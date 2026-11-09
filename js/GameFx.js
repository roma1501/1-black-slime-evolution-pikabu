// GameFx.js — эффекты игры: всплывающие числа (DOM над миром, стиль — косметика «Цифры»), частицы слизи, ударов,
// атак, уровня, эволюции, победы; ауры/следы героя (косметика); плоские декали на земле (кольца, лужи, столбы света).
// Стиль: чёрная глянцевая слизь с цветной каймой цвета текущей эволюции. Пути текстур — литералы (сборщик их видит).
// Частые вспышки (тик тренировки, удары, смерть врага) идут через постоянные системы GameFx.spawn (очередь точек,
// ни одной новой системы на вспышку); редкие крупные эффекты создаются разово и сами гаснут.

const FX_TEX = {
    glow: 'assets/fx/glow.webp', spark: 'assets/fx/spark.webp', streak: 'assets/fx/spark-streak.webp',
    ring: 'assets/fx/shockwave-ring.webp', smoke: 'assets/fx/smoke-puff.webp', dust: 'assets/fx/dust-puff.webp',
    slime: 'assets/fx/slime-burst.webp', splat: 'assets/fx/slime-splat.webp', ice: 'assets/fx/ice-shard.webp',
    iceBurst: 'assets/fx/ice-burst.webp', fireball: 'assets/fx/fireball.webp', orb: 'assets/fx/plasma-orb.webp',
    sparkle: 'assets/fx/coin-sparkle.webp', plus: 'assets/fx/heal-plus.webp', scorch: 'assets/fx/scorch.webp',
    drop: 'assets/fx/blood-drop.webp', fire: 'assets/fx/fire-sheet.png',
    blob: 'assets/fx/goo-blob.webp', blob2: 'assets/fx/goo-blob2.webp', gsplat: 'assets/fx/goo-splat.webp', gdrop: 'assets/fx/goo-drop.webp',
    bubble: 'assets/fx/goo-bubble.webp', star: 'assets/fx/star4.webp', rthin: 'assets/fx/ring-thin.webp', disc: 'assets/fx/disc-glow.webp',
    beam: 'assets/fx/beam.webp', line: 'assets/fx/spark-line.webp', shard: 'assets/fx/shard.webp', swirl: 'assets/fx/swirl.webp',
    crack: 'assets/fx/crack.webp', flame: 'assets/fx/flame.webp', heart: 'assets/fx/heart.webp', snow: 'assets/fx/snow.webp',
    bolt: 'assets/fx/bolt.webp', confetti: 'assets/fx/confetti.webp',
};

/** Цикл радуги для colorGradient. @type {any[]} */
const FX_RAINBOW = [[0, '#ff3b3b', 1], [0.2, '#ffe23a', 1], [0.4, '#39ff6a', 1], [0.6, '#3af0ff', 1], [0.8, '#b05cff', 1], [1, '#ff3b3b', 0]];

/** @satisfies {Record<string, any>} */
const GameFx = {
    /** @type {LoryApp | null} */ app: null,
    /** @type {HTMLElement | null} */ layer: null,
    /** @type {any[]} */ pops: [],
    /** @type {any[]} */ pool: [],
    /** @type {any} */ aura: null,
    /** @type {any} */ trail: null,
    auraId: '', trailId: '',
    /** @type {any[]} */ decals: [],
    /** @type {any[]} */ timers: [],
    /** @type {Record<string, any>} */ pers: {},
    /** @type {Record<string, any>} */ texs: {},
    /** @type {Record<string, any>} */ mats: {},
    /** @type {HTMLElement | null} */ hurtEl: null,
    hurtT: 0,
    t: 0,

    init(app) {
        this.app = app;
        const el = document.createElement('div');
        el.id = 'fx-pops';
        el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:27;overflow:hidden;contain:strict';
        document.body.appendChild(el);
        this.layer = el;
        const hurt = document.createElement('div');
        hurt.style.cssText = 'position:absolute;inset:0;opacity:0;background:radial-gradient(ellipse at center,rgba(255,30,50,0) 45%,rgba(255,20,40,.55) 100%)';
        el.appendChild(hurt);
        this.hurtEl = hurt;
        const st = document.createElement('style');
        st.textContent = `
        .fxpop{position:absolute;left:0;top:0;font-weight:900;white-space:nowrap;will-change:transform,opacity;
          font-family:var(--game-font, 'Rubik', system-ui, sans-serif);letter-spacing:.5px;transform-origin:50% 100%}
        .fxpop.rainbow{animation:fxhue .6s linear infinite}
        @keyframes fxhue{from{filter:hue-rotate(0deg)}to{filter:hue-rotate(360deg)}}`;
        document.head.appendChild(st);
        this.registerRecipes();
    },

    /** Подготовка частиц новой карты (менеджер пересоздан вместе со сценой). */
    onMap() {
        this.aura = null; this.trail = null; this.auraId = ''; this.trailId = '';
        for (const d of this.decals) { try { d.mesh.dispose(); } catch (e) { /* уже удалён со сценой */ } }
        this.decals = []; this.timers = []; this.pers = {}; this.texs = {}; this.mats = {};
        this.registerRecipes();
        for (const p of this.pops) this.release(p);
        this.pops = [];
    },

    fx() { return this.app && this.app.fx; },
    scene() { return this.app.location.view.scene; },
    v3(x, h, y) { return new BABYLON.Vector3(x, h, y); },
    rnd(a, b) { return a + Math.random() * (b - a); },
    /** Цвет свечения текущей эволюции. */
    glow() { try { return GD.EVOLUTIONS[GS.evo].glow; } catch (e) { return '#4de8ff'; } },
    /** Масштаб героя (для эффектов вокруг него). */
    gs() { return typeof Hero !== 'undefined' && Hero.growthNow ? Math.min(2.4, Math.max(1, Hero.growthNow)) : 1; },
    quality() { return typeof IS_MOBILE !== 'undefined' && IS_MOBILE ? FX_MOBILE_SCALE : 1; },
    lum(hex) { const c = BABYLON.Color3.FromHexString(hex); return c.r * 0.3 + c.g * 0.59 + c.b * 0.11; },
    /** Цвет каймы слизи: тёмные цвета заменяем свечением эволюции. */
    rimOf(hex) { return this.lum(hex) < 0.28 ? this.glow() : hex; },
    /** Осветлить цвет к белому на k. */
    lighten(hex, k) { const c = BABYLON.Color3.FromHexString(hex); return new BABYLON.Color3(c.r + (1 - c.r) * k, c.g + (1 - c.g) * k, c.b + (1 - c.b) * k).toHexString().slice(0, 7); },
    heroPoint() { return { x: Hero.x, y: Hero.y, h: Hero.h + 100 * this.gs() }; },
    /** Отложенный вызов (игровые секунды; на паузе update не идёт). */
    later(sec, fn) { this.timers.push({ t: sec, fn }); },

    // ---- всплывающие числа ------------------------------------------------------------------------
    popStyle() {
        const id = typeof Shop !== 'undefined' && Shop.state ? (Shop.look().pop || 'pop-classic') : 'pop-classic';
        const it = GameShopData.POP.find((r) => r[0] === id) || GameShopData.POP[0];
        return it[4];
    },
    acquire() {
        const el = this.pool.pop() || document.createElement('div');
        el.className = 'fxpop';
        if (!el.parentNode) this.layer.appendChild(el);
        el.style.display = '';
        return el;
    },
    release(p) { p.el.style.display = 'none'; this.pool.push(p.el); },
    /**
     * Текст над точкой мира. kind: 'gain' (+N, стиль косметики), 'dmg' (урон), 'crit', 'hurt' (урон герою), 'info'.
     * Заодно даёт частицы: пузырь слизи на «+N» героя, искры на ударе, красную вспышку на уроне героя.
     * @param {string} text @param {number} x @param {number} y @param {number} h @param {string} [kind] @param {any} [opts]
     */
    pop(text, x, y, h, kind, opts) {
        if (!this.layer) return;
        const o = opts || {};
        if (kind === 'gain' || !kind) { if (this.app && this.app.fx) this.gainFx(x, y, h, (o.size || 30) >= 30); }
        else if (kind === 'dmg' || kind === 'crit') this.hitSpark(x, y, h - 100, kind === 'crit');
        else if (kind === 'hurt') this.hurtFx(x, y, h - 90);
        if (this.pops.length > 60) return;
        const el = this.acquire();
        let color = '#ffffff', stroke = '#1a1030', glow = '', scale = 1, rainbow = false, tilt = 0, drift = 0;
        if (kind === 'gain' || !kind) {
            const s = this.popStyle();
            color = s.color; stroke = s.stroke; glow = s.glow || ''; scale = s.scale || 1; rainbow = !!s.rainbow;
        } else if (kind === 'crit') { color = '#ffe23a'; stroke = '#7a2200'; glow = '#ff9a00'; scale = 1.55; tilt = (Math.random() - 0.5) * 16; drift = (Math.random() - 0.5) * 160; }
        else if (kind === 'dmg') { color = '#ffffff'; stroke = '#3a0016'; scale = 0.85; drift = (Math.random() - 0.5) * 110; }
        else if (kind === 'hurt') { color = '#ff4d5e'; stroke = '#2a0006'; scale = 1; }
        else if (kind === 'info') { color = o.color || '#ffe23a'; stroke = '#1a1030'; glow = o.color || '#ffe23a'; scale = 1.1; }
        const size = Math.round((o.size || 30) * scale);
        el.textContent = text;
        el.classList.toggle('rainbow', rainbow);
        el.style.color = color;
        el.style.fontSize = size + 'px';
        el.style.webkitTextStroke = Math.max(2, size / 9) + 'px ' + stroke;
        el.style.textShadow = (glow ? `0 0 ${size / 3}px ${glow},` : '') + `0 ${size / 12}px 0 ${stroke}`;
        el.style.paintOrder = 'stroke fill';
        const jx = (Math.random() - 0.5) * (o.spread == null ? 60 : o.spread);
        this.pops.push({ el, x: x + jx * 0.6, y: y + (Math.random() - 0.5) * 30, h, t: 0, life: o.life || (kind === 'crit' ? 1.1 : 0.95), vy: o.rise || 120, kind, tilt, drift });
    },
    updatePops(dt) {
        if (!this.app || !this.pops.length) return;
        const view = this.app.location.view;
        for (let i = this.pops.length - 1; i >= 0; i--) {
            const p = this.pops[i];
            p.t += dt;
            const k = p.t / p.life;
            if (k >= 1) { this.release(p); this.pops.splice(i, 1); continue; }
            const s = view.projectToScreen(p.x, p.y, p.h + p.vy * p.t * (1 - k * 0.4));
            if (!s || !s.visible || s.behind) { p.el.style.opacity = '0'; continue; }
            // пружинистое появление: 0.5 -> 1.3 -> 1 (крит — резче)
            const big = p.kind === 'crit' ? 1.5 : 1.25;
            const pop = k < 0.12 ? 0.5 + k / 0.12 * (big - 0.5) : k < 0.28 ? big - (k - 0.12) / 0.16 * (big - 1) : 1;
            p.el.style.opacity = String(k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1);
            p.el.style.transform = `translate(${(s.x + p.drift * p.t).toFixed(1)}px,${s.y.toFixed(1)}px) translate(-50%,-100%) rotate(${p.tilt}deg) scale(${pop.toFixed(3)})`;
        }
    },
    /** Красная вспышка по краям экрана. */
    hurtFx(x, y, h) {
        this.hurtT = 0.35;
        this.spawn('hurtStar', 5, x, y, h, { r: 30 });
        this.spawn('hurtBlob', 5, x, y, h, { r: 20 });
    },

    // ---- постоянные системы-«пулемёты»: spawn(id, n, x, y, h, {r, ring, aim, line}) ------------------------------
    /** Определения постоянных систем; c — цвет эволюции. */
    PD: {
        gainBubble: (c) => ({ capacity: 60, life: [0.55, 0.95], size: [18, 34], speed: [60, 130], texture: FX_TEX.bubble, color: c, color2: '#ffffff', direction: [[-0.5, 1, -0.5], [0.5, 1.8, 0.5]], gravity: [0, 120, 0], sizeGradient: [[0, 0.4], [0.2, 1], [1, 1.15]], colorGradient: [[0, c, 0.95], [0.7, c, 0.8], [1, c, 0]] }),
        gainBlob: (c) => ({ capacity: 60, life: [0.35, 0.65], size: [12, 22], speed: [150, 300], texture: FX_TEX.blob, blend: 'standard', color: c, direction: [[-0.7, 1, -0.7], [0.7, 1.7, 0.7]], gravity: [0, -1300, 0], spin: [-3, 3], sizeGradient: [[0, 1], [1, 0.5]], colorGradient: [[0, c, 1], [0.8, c, 1], [1, c, 0]] }),
        gainStar: (c) => ({ capacity: 60, life: [0.4, 0.8], size: [20, 36], speed: [80, 200], texture: FX_TEX.star, color: '#ffffff', color2: c, direction: [[-1, 0.4, -1], [1, 1.4, 1]], gravity: [0, -200, 0], sizeGradient: [[0, 0.3], [0.25, 1], [1, 0]] }),
        padMote: (c) => ({ capacity: 50, life: [0.6, 1.1], size: [8, 16], speed: [50, 120], texture: FX_TEX.star, color: c, direction: [[-0.15, 1, -0.15], [0.15, 1.6, 0.15]], sizeGradient: [[0, 0.5], [0.3, 1], [1, 0]] }),
        hitStar: () => ({ capacity: 60, life: [0.18, 0.34], size: [24, 42], speed: [120, 300], texture: FX_TEX.star, color: '#ffffff', color2: '#ffe27a', direction: [[-1, -0.3, -1], [1, 1, 1]], sizeGradient: [[0, 1], [1, 0.1]] }),
        hitLine: () => ({ capacity: 60, life: [0.12, 0.26], size: [40, 70], speed: [350, 700], texture: FX_TEX.line, color: '#ffffff', color2: '#ffd23c', direction: [[-1, -0.2, -1], [1, 1, 1]], stretch: true, sizeGradient: [[0, 1], [1, 0.2]] }),
        hitFlash: () => ({ capacity: 12, life: [0.1, 0.14], size: [110, 140], speed: [0, 0], texture: FX_TEX.glow, color: '#ffffff', color2: '#fff2b0', sizeGradient: [[0, 0.5], [1, 1.2]] }),
        critStar: () => ({ capacity: 40, life: [0.3, 0.55], size: [40, 76], speed: [180, 460], texture: FX_TEX.star, color: '#ffe23a', color2: '#ff9a00', direction: [[-1, -0.2, -1], [1, 1.2, 1]], sizeGradient: [[0, 1], [1, 0]] }),
        critLine: () => ({ capacity: 40, life: [0.2, 0.4], size: [80, 140], speed: [600, 1100], texture: FX_TEX.line, color: '#fff2a0', color2: '#ff9a00', direction: [[-1, -0.2, -1], [1, 1, 1]], stretch: true, sizeGradient: [[0, 1], [1, 0.2]] }),
        critRing: () => ({ capacity: 6, life: [0.28, 0.32], size: [420, 460], speed: [0, 0], texture: FX_TEX.ring, color: '#ffd23c', sizeGradient: [[0, 0.1], [1, 1]], colorGradient: [[0, '#fff2a0', 1], [1, '#ff9a00', 0]] }),
        hurtStar: () => ({ capacity: 24, life: [0.25, 0.5], size: [30, 56], speed: [160, 380], texture: FX_TEX.star, color: '#ff4d5e', color2: '#ffb0b8', direction: [[-1, -0.2, -1], [1, 1.2, 1]], sizeGradient: [[0, 1], [1, 0]] }),
        hurtBlob: () => ({ capacity: 24, life: [0.4, 0.7], size: [16, 30], speed: [150, 320], texture: FX_TEX.blob, blend: 'standard', color: '#ff3b4d', direction: [[-1, 0.2, -1], [1, 1.4, 1]], gravity: [0, -1200, 0], spin: [-3, 3] }),
        dieBlob: (c) => ({ capacity: 90, life: [0.4, 0.75], size: [30, 60], speed: [150, 380], texture: FX_TEX.blob, blend: 'standard', color: c, direction: [[-1, 0.3, -1], [1, 1.6, 1]], gravity: [0, -1100, 0], spin: [-4, 4], sizeGradient: [[0, 0.5], [0.2, 1], [1, 0.4]], colorGradient: [[0, c, 1], [0.8, c, 1], [1, c, 0]] }),
        dieSplat: (c) => ({ capacity: 24, life: [0.7, 1.0], size: [140, 220], speed: [0, 8], texture: FX_TEX.gsplat, blend: 'standard', color: c, direction: [[-0.1, 0.05, -0.1], [0.1, 0.1, 0.1]], sizeGradient: [[0, 0.4], [0.15, 1], [1, 1.05]], colorGradient: [[0, c, 1], [0.6, c, 0.9], [1, c, 0]] }),
        dieAim: (c) => ({ capacity: 90, life: [0.42, 0.7], size: [22, 42], speed: [1, 1], texture: FX_TEX.blob, blend: 'standard', color: c, direction: [[0, 0, 0], [0, 0, 0]], spin: [-3, 3], sizeGradient: [[0, 0.6], [0.5, 1], [1, 0.3]], colorGradient: [[0, c, 1], [0.85, c, 1], [1, c, 0]] }),
        dieStar: (c) => ({ capacity: 60, life: [0.42, 0.7], size: [24, 40], speed: [1, 1], texture: FX_TEX.star, color: '#ffffff', color2: c, direction: [[0, 0, 0], [0, 0, 0]], sizeGradient: [[0, 0.5], [0.4, 1], [1, 0.3]] }),
        shotTrail: () => ({ capacity: 80, life: [0.18, 0.34], size: [28, 50], speed: [0, 12], texture: FX_TEX.glow, color: '#7dff4d', color2: '#d8ff9a', sizeGradient: [[0, 1], [1, 0.1]] }),
        shotBlob: () => ({ capacity: 50, life: [0.25, 0.45], size: [14, 24], speed: [0, 20], texture: FX_TEX.blob, blend: 'standard', color: '#7dff4d', sizeGradient: [[0, 1], [1, 0.2]], colorGradient: [[0, '#7dff4d', 1], [1, '#7dff4d', 0]] }),
        suck: () => ({ capacity: 160, life: [0.45, 0.7], size: [30, 56], speed: [1, 1], texture: FX_TEX.line, stretch: true, color: '#b05cff', color2: '#e0c0ff', direction: [[0, 0, 0], [0, 0, 0]], sizeGradient: [[0, 0.4], [1, 1]], colorGradient: [[0, '#8a3cff', 0], [0.3, '#b05cff', 1], [1, '#e0c0ff', 0.2]] }),
        gateSpark: () => ({ capacity: 160, life: [0.5, 1.1], size: [12, 26], speed: [60, 220], texture: FX_TEX.star, color: '#ff4d6e', color2: '#ffe0e8', direction: [[-1, 0.2, -1], [1, 1.6, 1]], gravity: [0, -300, 0], sizeGradient: [[0, 0.3], [0.2, 1], [1, 0]] }),
    },

    /** Постоянная система id (создаётся один раз) + n частиц в точке (x, h, y). o: r (разброс), ring (по окружности r), aim {x,y,h} (лететь к цели), line {dx,dz,h}. */
    spawn(id, n, x, y, h, o) {
        const fx = this.fx();
        if (!fx || n <= 0) return;
        const c = this.glow();
        let P = this.pers[id];
        if (P && P.c !== c && this.PD[id].length > 0) { P.h.dispose(); P = null; delete this.pers[id]; }
        if (!P) {
            P = this.makeP(id, c);
            if (!P) return;
            this.pers[id] = P;
        }
        const cnt = Math.max(1, Math.round(n * this.quality()));
        const ps = P.ps;
        P.q.push(Object.assign({ x, y, h, n: cnt }, o || {}));
        ps.manualEmitCount = Math.max(0, ps.manualEmitCount) + cnt;
    },
    makeP(id, c) {
        const fx = this.fx();
        const def = this.PD[id](c);
        const h = fx.create(Object.assign({}, def, { rate: 0, position: [0, 0, 0] }));
        if (!h) return null;
        const ps = h.system;
        if (def.stretch) ps.billboardMode = BABYLON.ParticleSystem.BILLBOARDMODE_STRETCHED;
        /** @type {any[]} */
        const q = [];
        /** @type {any} */
        let cur = null;
        const d1 = (def.direction || [[-1, -1, -1], [1, 1, 1]])[0], d2 = (def.direction || [[-1, -1, -1], [1, 1, 1]])[1];
        ps.startPositionFunction = (wm, pos) => {
            cur = q[0] || null;
            if (!cur) { pos.set(0, -9999, 0); return; }
            if (--cur.n <= 0) q.shift();
            let ox = 0, oy = 0, oz = 0;
            const a = Math.random() * 6.2832;
            if (cur.ring) { ox = Math.cos(a) * cur.r; oz = Math.sin(a) * cur.r; }
            else if (cur.r) { const rr = Math.sqrt(Math.random()) * cur.r; ox = Math.cos(a) * rr; oz = Math.sin(a) * rr; oy = (Math.random() - 0.5) * cur.r * 0.6; }
            if (cur.line) { const t = Math.random() - 0.5; ox = cur.line.dx * t; oz = cur.line.dz * t; oy = Math.random() * cur.line.h; }
            pos.set(cur.x + ox, cur.h + oy, cur.y + oz);
        };
        ps.startDirectionFunction = (wm, dir, particle) => {
            const e = cur;
            if (e && e.aim) {
                const life = particle.lifeTime || 0.55;
                dir.set((e.aim.x - particle.position.x) / life, (e.aim.h - particle.position.y) / life, (e.aim.y - particle.position.z) / life);
                return;
            }
            dir.set(d1[0] + (d2[0] - d1[0]) * Math.random(), d1[1] + (d2[1] - d1[1]) * Math.random(), d1[2] + (d2[2] - d1[2]) * Math.random());
        };
        return { h, ps, q, c };
    },

    // ---- разовые частицы ----------------------------------------------------------------------------
    /** Создать слой (с поддержкой stretch/rot). */
    mk(l, pos) {
        const fx = this.fx();
        if (!fx) return null;
        const h = fx.create(Object.assign({}, l, { position: pos || l.position }));
        if (h && h.system) {
            const ps = h.system;
            if (l.stretch) ps.billboardMode = BABYLON.ParticleSystem.BILLBOARDMODE_STRETCHED;
            if (l.rot) { ps.minInitialRotation = 0; ps.maxInitialRotation = 6.283; }
        }
        return h;
    },
    group(hs) {
        const a = hs.filter(Boolean);
        return { handles: a, stop() { a.forEach((h) => h.stop()); }, dispose() { a.forEach((h) => h.dispose()); }, setPosition(p) { a.forEach((h) => h.setPosition(p)); } };
    },
    /** Разовый набор слоёв в точке карты. @param {any[]} layers */
    shot(layers, x, y, h) {
        const pos = this.v3(x, h || 0, y);
        return this.group(layers.map((l) => this.mk(l, pos)));
    },
    /** Слой слизи (чёрное тело + кайма цвета c). */
    gooL(c, o) {
        return Object.assign({ texture: FX_TEX.blob, blend: 'standard', color: c, life: [0.4, 0.8], size: [18, 38], speed: [100, 300], gravity: [0, -1000, 0], spin: [-3, 3], capacity: 40, burst: 20, sizeGradient: [[0, 0.6], [0.2, 1], [1, 0.4]], colorGradient: [[0, c, 1], [0.75, c, 1], [1, c, 0]] }, o || {});
    },
    /** Светящийся слой (аддитив). */
    glowL(tex, c, o) {
        return Object.assign({ texture: tex, color: c, life: [0.3, 0.6], size: [10, 20], speed: [100, 300], capacity: 40, burst: 20 }, o || {});
    },

    // ---- рецепты (имя -> вызов); play(name, x, y, h) оставлен для Game.js / GameEnemies.js / GameAttacks.js ---------
    registerRecipes() { /* рецепты — методы fx_*: цвета берутся из эволюции в момент вызова */ },

    /** Эффект в точке карты. */
    play(name, x, y, h, overrides) {
        if (!this.fx()) return null;
        const f = this['fx_' + String(name).replace(/-/g, '_')];
        if (!f) return null;
        try { return f.call(this, x, y, h || 0, overrides || {}); } catch (e) { console.warn(e); return null; }
    },

    /** Тик «+N»: пузырь слизи, капли и искры цвета эволюции; hero — вокруг героя на площадке. */
    gainFx(x, y, h, hero) {
        const c = this.glow();
        if (!hero) { this.spawn('gainStar', 3, x, y, h - 60, { r: 20 }); return; }
        const s = this.gs();
        this.spawn('gainBubble', 4, x, y, h - 70 * s, { r: 40 * s });
        this.spawn('gainBlob', 4, x, y, h - 110 * s, { r: 25 * s });
        this.spawn('gainStar', 3, x, y, h - 90 * s, { r: 40 * s });
        // площадка под героем: мотыльки цвета площадки
        if (typeof Game !== 'undefined' && Game.pads) {
            const p = Game.pads.find((q) => Math.hypot(q.x - x, q.y - y) < q.r);
            if (p) this.spawn('padMote', 5, x, y, p.h + 8, { ring: true, r: Math.min(p.r * 0.7, 160) });
        }
        void c;
    },
    /** Искры удара (обычный/крит), постоянные системы. */
    hitSpark(x, y, h, crit) {
        if (crit) {
            this.spawn('critStar', 6, x, y, h, { r: 10 });
            this.spawn('critLine', 7, x, y, h, { r: 10 });
            this.spawn('critRing', 1, x, y, h);
            this.spawn('hitFlash', 1, x, y, h);
        } else {
            this.spawn('hitStar', 2, x, y, h, { r: 12 });
            this.spawn('hitLine', 3, x, y, h, { r: 12 });
            this.spawn('hitFlash', 1, x, y, h);
        }
    },
    /** Шлейф снаряда врага: вызывать каждый кадр с позицией снаряда. */
    shotTrail(x, y, h) {
        this.spawn('shotTrail', 2, x, y, h, { r: 6 });
        this.spawn('shotBlob', 1, x, y, h, { r: 8 });
    },
    /** Втягивание к точке (чёрная дыра): n штрихов с кольца радиуса r к центру. */
    suck(x, y, h, r, n) { this.spawn('suck', n, x, y, h, { ring: true, r, aim: { x, y, h } }); },
    /** Искры вдоль энергостены: центр (x,y), ширина w, высота hh, поворот rotY (рад., как у plane.rotation.y). */
    gateBurst(x, y, h, w, hh, rotY) {
        const dx = Math.cos(rotY) * w, dz = -Math.sin(rotY) * w;
        this.spawn('gateSpark', 90, x, y, h, { line: { dx, dz, h: hh } });
        this.shot([this.glowL(FX_TEX.glow, '#ff4d6e', { burst: 6, capacity: 8, life: [0.4, 0.6], size: [260, 340], speed: [0, 0], sizeGradient: [[0, 0.4], [1, 1.2]], colorGradient: [[0, '#ff4d6e', 0.6], [1, '#ff4d6e', 0]] })], x, y, h + hh * 0.5);
    },

    fx_hit(x, y, h) { this.hitSpark(x, y, h, false); return null; },

    /** Цветной удар атаки: вспышка, звёзды, штрихи, малое кольцо. k — масштаб. */
    impact(x, y, h, color, k) {
        const s = k || 1, c = color || '#ffffff', light = this.lighten(c, 0.6);
        return this.shot([
            this.glowL(FX_TEX.glow, light, { burst: 1, capacity: 2, life: [0.14, 0.18], size: [130 * s, 150 * s], speed: [0, 0], sizeGradient: [[0, 0.4], [1, 1.2]], colorGradient: [[0, '#ffffff', 0.9], [1, c, 0]] }),
            this.glowL(FX_TEX.star, '#ffffff', { burst: 7, capacity: 8, life: [0.25, 0.45], size: [18 * s, 34 * s], speed: [120 * s, 320 * s], color2: c, direction: [[-1, -0.2, -1], [1, 1.2, 1]], sizeGradient: [[0, 1], [1, 0]] }),
            this.glowL(FX_TEX.line, light, { stretch: true, burst: 8, capacity: 10, life: [0.15, 0.3], size: [40 * s, 80 * s], speed: [400 * s, 800 * s], color2: c, direction: [[-1, -0.2, -1], [1, 1.1, 1]], sizeGradient: [[0, 1], [1, 0.2]] }),
            this.glowL(FX_TEX.ring, c, { burst: 1, capacity: 2, life: [0.2, 0.24], size: [230 * s, 250 * s], speed: [0, 0], sizeGradient: [[0, 0.1], [1, 1]], colorGradient: [[0, light, 1], [1, c, 0]] }),
        ], x, y, h);
    },

    /** Брызги слизи (чёрная слизь с каймой). o.rim — цвет каймы, o.k — масштаб. */
    fx_goo_splash(x, y, h, o) {
        const c = this.rimOf(o.rim || this.glow()), k = o.k || 1;
        return this.shot([
            this.gooL(c, { burst: 22, capacity: 24, size: [20 * k, 40 * k], speed: [140 * k, 360 * k], direction: [[-1, 0.5, -1], [1, 1.5, 1]] }),
            this.gooL(c, { texture: FX_TEX.gsplat, burst: 2, capacity: 3, life: [0.5, 0.7], size: [170 * k, 230 * k], speed: [0, 0], gravity: [0, 0, 0], spin: [-1, 1], sizeGradient: [[0, 0.3], [0.2, 1], [1, 1.1]] }),
            this.glowL(FX_TEX.star, c, { burst: 7, capacity: 8, life: [0.3, 0.5], size: [14 * k, 26 * k], speed: [100, 240], sizeGradient: [[0, 1], [1, 0]] }),
        ], x, y, h);
    },

    /** Смерть врага: чёрная слизь разлетается и втягивается в героя. */
    fx_die(x, y, h) {
        const c = this.glow();
        this.spawn('dieBlob', 12, x, y, h, { r: 22 });
        this.spawn('dieSplat', 2, x, y, h - 60, { r: 30 });
        this.later(0.16, () => {
            if (typeof Hero === 'undefined' || !Hero.alive) return;
            const tp = this.heroPoint();
            this.spawn('dieAim', 8, x, y, h, { r: 36, aim: tp });
            this.spawn('dieStar', 5, x, y, h, { r: 36, aim: tp });
        });
        void c;
        return null;
    },
    fx_absorb(x, y, h) { return this.fx_die(x, y, h); },

    fx_gem(x, y, h) {
        return this.shot([
            this.glowL(FX_TEX.star, '#3af0ff', { burst: 8, capacity: 10, life: [0.4, 0.8], size: [16, 28], speed: [100, 260], color2: '#b05cff', gravity: [0, -400, 0], direction: [[-0.6, 1, -0.6], [0.6, 2, 0.6]], sizeGradient: [[0, 1], [1, 0]] }),
            this.glowL(FX_TEX.shard, '#7fe8ff', { blend: 'standard', burst: 5, capacity: 6, life: [0.5, 0.8], size: [14, 22], speed: [90, 200], gravity: [0, -700, 0], spin: [-4, 4], direction: [[-0.6, 1, -0.6], [0.6, 1.8, 0.6]], colorGradient: [[0, '#7fe8ff', 1], [0.8, '#b05cff', 1], [1, '#b05cff', 0]] }),
        ], x, y, h);
    },
    fx_heal(x, y, h) {
        return this.shot([this.glowL(FX_TEX.plus, '#7dff4d', { burst: 8, capacity: 10, life: [0.6, 1], size: [22, 34], speed: [60, 140], direction: [[-0.4, 1, -0.4], [0.4, 1.6, 0.4]], sizeGradient: [[0, 0.3], [0.3, 1], [1, 0.8]] }),
            this.glowL(FX_TEX.star, '#d8ffb0', { burst: 8, capacity: 10, life: [0.5, 0.9], size: [10, 18], speed: [60, 160], direction: [[-0.6, 1, -0.6], [0.6, 1.8, 0.6]] })], x, y, h);
    },

    /** Уровень: поднимающееся кольцо, столб света, искры. */
    fx_levelup(x, y, h) {
        const c = this.glow(), s = this.gs(), foot = h - 10;
        this.risingRing(x, y, foot, c, 160 * s, 0.7, 360 * s);
        this.decal({ tex: 'rthin', x, y, h: foot, r0: 60 * s, r1: 300 * s, life: 0.55, color: c, ease: 'out' });
        this.beam(x, y, foot, c, 0.65, 170 * s, 640 * s);
        return this.shot([
            this.glowL(FX_TEX.star, '#ffffff', { burst: 26, capacity: 30, life: [0.6, 1.1], size: [16 * s, 30 * s], speed: [130, 320], color2: c, blend: 'standard', direction: [[-0.7, 1, -0.7], [0.7, 2, 0.7]], gravity: [0, -150, 0], sizeGradient: [[0, 0.3], [0.2, 1], [1, 0]], colorGradient: [[0, '#ffffff', 1], [0.5, c, 1], [1, c, 0]] }),
            this.glowL(FX_TEX.bubble, c, { burst: 8, capacity: 10, life: [0.7, 1.2], size: [14 * s, 26 * s], speed: [60, 150], direction: [[-0.5, 1, -0.5], [0.5, 1.8, 0.5]] }),
            this.glowL(FX_TEX.glow, c, { burst: 1, capacity: 2, life: [0.35, 0.4], size: [420 * s, 460 * s], speed: [0, 0], sizeGradient: [[0, 0.3], [1, 1]], colorGradient: [[0, c, 0.7], [1, c, 0]] }),
        ], x, y, h);
    },

    /** Новая часть тела: всплеск слизи + ударная волна. */
    fx_grow(x, y, h) {
        const c = this.rimOf(this.glow()), s = this.gs(), foot = h - 120;
        this.decal({ tex: 'rthin', x, y, h: foot, r0: 40 * s, r1: 380 * s, life: 0.5, color: c, ease: 'out' });
        this.decal({ tex: 'disc', x, y, h: foot, r0: 40 * s, r1: 330 * s, life: 0.45, color: c, a: 0.5, ease: 'out' });
        return this.shot([
            this.gooL(c, { burst: 34, capacity: 40, life: [0.5, 1], size: [14 * s, 32 * s], speed: [170, 420], direction: [[-1, 0.7, -1], [1, 1.8, 1]], gravity: [0, -950, 0] }),
            this.gooL(c, { texture: FX_TEX.gsplat, burst: 4, capacity: 5, life: [0.6, 0.9], size: [180 * s, 260 * s], speed: [0, 0], gravity: [0, 0, 0], spin: [-1, 1], sizeGradient: [[0, 0.3], [0.2, 1], [1, 1.1]] }),
            this.glowL(FX_TEX.star, '#ffffff', { burst: 18, capacity: 20, life: [0.5, 1], size: [14, 26], speed: [100, 300], color2: c, direction: [[-1, 0.5, -1], [1, 1.6, 1]], gravity: [0, -200, 0], sizeGradient: [[0, 1], [1, 0]] }),
            this.glowL(FX_TEX.glow, c, { burst: 1, capacity: 2, life: [0.3, 0.35], size: [520 * s, 560 * s], speed: [0, 0], sizeGradient: [[0, 0.3], [1, 1]], colorGradient: [[0, '#ffffff', 0.8], [1, c, 0]] }),
        ], x, y, h);
    },

    /** Эволюция: схлопывание -> вспышка -> взрыв слизи -> кольцо света -> долгие искры; цвет — новая эволюция. */
    fx_evolve(x, y, h) {
        const c = this.glow(), s = this.gs(), foot = h - 60, mid = h + 30 * s;
        const aim = { x, y, h: mid };
        // 1. схлопывание (0-0.5 c)
        this.spawn('dieAim', 34, x, y, mid, { ring: true, r: 460 * s, aim });
        this.spawn('dieStar', 30, x, y, mid, { ring: true, r: 520 * s, aim });
        this.decal({ tex: 'rthin', x, y, h: foot, r0: 620 * s, r1: 40 * s, life: 0.5, color: c, ease: 'in', a: 0.9 });
        this.decal({ tex: 'disc', x, y, h: foot, r0: 500 * s, r1: 60 * s, life: 0.5, color: c, a: 0.5, ease: 'in' });
        // 2. вспышка и взрыв (0.5 c)
        this.later(0.5, () => {
            this.shot([
                this.glowL(FX_TEX.glow, '#ffffff', { burst: 1, capacity: 2, life: [0.35, 0.4], size: [1100 * s, 1200 * s], speed: [0, 0], sizeGradient: [[0, 0.2], [0.3, 1], [1, 0.6]], colorGradient: [[0, '#ffffff', 1], [0.4, c, 0.8], [1, c, 0]] }),
                this.gooL(c, { burst: 70, capacity: 80, life: [0.8, 1.5], size: [18 * s, 42 * s], speed: [260, 640], direction: [[-1, 0.5, -1], [1, 2, 1]], gravity: [0, -900, 0] }),
                this.gooL(c, { texture: FX_TEX.gsplat, burst: 6, capacity: 8, life: [0.9, 1.2], size: [260 * s, 420 * s], speed: [0, 0], gravity: [0, 0, 0], spin: [-1, 1], sizeGradient: [[0, 0.3], [0.2, 1], [1, 1.1]] }),
                this.glowL(FX_TEX.line, '#ffffff', { stretch: true, burst: 40, capacity: 44, life: [0.3, 0.6], size: [80, 160], speed: [700, 1300], color2: c, direction: [[-1, -0.1, -1], [1, 1.2, 1]], sizeGradient: [[0, 1], [1, 0.2]] }),
            ], x, y, mid);
            this.decal({ tex: 'rthin', x, y, h: foot, r0: 60 * s, r1: 760 * s, life: 0.8, color: '#ffffff', ease: 'out' });
            this.decal({ tex: 'rthin', x, y, h: foot, r0: 40 * s, r1: 980 * s, life: 1.0, color: c, ease: 'out' });
            this.decal({ tex: 'crack', x, y, h: foot, r0: 360 * s, r1: 420 * s, life: 1.6, color: c, a: 0.9, ease: 'out' });
            this.beam(x, y, foot, c, 1.3, 260 * s, 1300 * s);
        });
        // 3. долгие искры (0.7-2.2 c)
        this.later(0.7, () => {
            this.shot([
                this.glowL(FX_TEX.star, '#ffffff', { burst: undefined, rate: 55, duration: 1.4, capacity: 60, life: [0.9, 1.6], size: [14 * s, 28 * s], speed: [40, 140], color2: c, blend: 'standard', box: [[-140 * s, 0, -140 * s], [140 * s, 120, 140 * s]], direction: [[-0.2, 1, -0.2], [0.2, 1.6, 0.2]], sizeGradient: [[0, 0.2], [0.3, 1], [1, 0]], colorGradient: [[0, '#ffffff', 1], [0.5, c, 1], [1, c, 0]] }),
                this.glowL(FX_TEX.bubble, c, { burst: undefined, rate: 14, duration: 1.4, capacity: 24, life: [1, 1.6], size: [14, 26], speed: [40, 100], box: [[-120 * s, 0, -120 * s], [120 * s, 80, 120 * s]], direction: [[-0.2, 1, -0.2], [0.2, 1.5, 0.2]] }),
            ], x, y, foot);
        });
        return null;
    },

    fx_ground_burst(x, y, h) {
        return this.shot([
            this.glowL(FX_TEX.dust, '#b8a890', { blend: 'standard', burst: 8, capacity: 10, life: [0.4, 0.7], size: [26, 44], speed: [60, 170], direction: [[-1, 0.2, -1], [1, 0.7, 1]], sizeGradient: [[0, 0.5], [1, 1.4]], colorGradient: [[0, '#b8a890', 0.75], [1, '#b8a890', 0]] }),
            this.glowL(FX_TEX.star, '#ffffff', { burst: 6, capacity: 8, life: [0.3, 0.5], size: [14, 22], speed: [100, 200], color2: this.glow(), direction: [[-0.7, 0.8, -0.7], [0.7, 1.6, 0.7]], sizeGradient: [[0, 1], [1, 0]] }),
        ], x, y, h);
    },

    /** Ударная волна по земле (босс, прыжок): o.color, o.r. */
    fx_shock(x, y, h, o) {
        const c = o.color || '#ffffff', r = o.r || 480;
        this.decal({ tex: 'rthin', x, y, h: h - 6, r0: 40, r1: r, life: 0.45, color: c, ease: 'out' });
        this.decal({ tex: 'disc', x, y, h: h - 6, r0: 40, r1: r * 0.9, life: 0.4, color: c, a: 0.35, ease: 'out' });
        return this.shot([
            this.glowL(FX_TEX.dust, '#b8a890', { blend: 'standard', burst: 26, capacity: 30, life: [0.4, 0.9], size: [30, 54], speed: [300, 620], direction: [[-1, 0.05, -1], [1, 0.3, 1]], sizeGradient: [[0, 0.5], [1, 1.6]], colorGradient: [[0, '#b8a890', 0.85], [1, '#b8a890', 0]] }),
            this.glowL(FX_TEX.star, c, { burst: 12, capacity: 14, life: [0.3, 0.6], size: [18, 32], speed: [200, 480], direction: [[-1, 0.2, -1], [1, 1, 1]], sizeGradient: [[0, 1], [1, 0]] }),
        ], x, y, h + 6);
    },
    fx_boom(x, y, h) { return this.fx_shock(x, y, h, {}); },

    /** Огненная нова: заряд -> кольцо огня (кольцо-декаль растёт вместе с уроном). */
    fx_nova(x, y, h, o) {
        const R = o.r || 650;
        this.decal({ tex: 'rthin', x, y, h: h - 26, r0: 40, r1: R, life: 0.5, color: '#ff7a1e', ease: 'lin', a: 1 });
        this.decal({ tex: 'disc', x, y, h: h - 26, r0: 40, r1: R, life: 0.5, color: '#ff5a1e', a: 0.28, ease: 'lin' });
        this.decal({ tex: 'scorch', x, y, h: h - 26, r0: 200, r1: 240, life: 1.4, color: '#ffffff', a: 0.55, ease: 'out', add: false });
        return this.shot([
            this.glowL(FX_TEX.glow, '#ffb04d', { burst: 1, capacity: 2, life: [0.3, 0.35], size: [700, 760], speed: [0, 0], sizeGradient: [[0, 0.3], [1, 1]], colorGradient: [[0, '#fff0b0', 0.9], [1, '#ff5a1e', 0]] }),
            { burst: 46, capacity: 50, life: [0.5, 0.9], size: [60, 110], speed: [R * 1.2, R * 1.7], texture: FX_TEX.fire, sheet: { width: 256, height: 256, start: 0, end: 15, speed: 1.2, randomStart: true }, color: '#ffffff', direction: [[-1, 0.02, -1], [1, 0.1, 1]], sizeGradient: [[0, 0.6], [1, 1.1]] },
            this.glowL(FX_TEX.star, '#ffe27a', { burst: 24, capacity: 28, life: [0.4, 0.8], size: [18, 34], speed: [R * 0.8, R * 1.4], color2: '#ff5a1e', direction: [[-1, 0.05, -1], [1, 0.4, 1]], sizeGradient: [[0, 1], [1, 0]] }),
        ], x, y, h);
    },
    fx_burn(x, y, h) {
        return this.shot([{ burst: 4, capacity: 6, life: [0.4, 0.8], size: [40, 70], speed: [20, 60], texture: FX_TEX.fire, sheet: { width: 256, height: 256, start: 0, end: 15, speed: 1.2, randomStart: true }, color: '#ffffff', direction: [[-0.2, 1, -0.2], [0.2, 1.5, 0.2]] },
            this.glowL(FX_TEX.star, '#ffb04d', { burst: 4, capacity: 5, life: [0.4, 0.7], size: [10, 18], speed: [40, 100], direction: [[-0.5, 1, -0.5], [0.5, 1.8, 0.5]] })], x, y, h);
    },

    /** Лёд: морозное пятно, осколки, снежинки. o.r — радиус. */
    fx_frost(x, y, h, o) {
        const R = o.r || 520, c = '#7fd8ff';
        this.decal({ tex: 'disc', x, y, h: h - 16, r0: 60, r1: R, life: 1.3, color: c, a: 0.5, ease: 'out', fade: [0.05, 0.6] });
        this.decal({ tex: 'rthin', x, y, h: h - 16, r0: 60, r1: R, life: 0.55, color: '#e8fbff', ease: 'out' });
        this.decal({ tex: 'crack', x, y, h: h - 16, r0: R * 0.5, r1: R * 0.6, life: 1.3, color: '#e8fbff', a: 0.8, ease: 'out', fade: [0.05, 0.6] });
        return this.shot([
            this.glowL(FX_TEX.shard, '#d8f6ff', { blend: 'standard', burst: 26, capacity: 30, life: [0.6, 1.1], size: [18, 38], speed: [60, 240], direction: [[-1, 0.7, -1], [1, 1.7, 1]], gravity: [0, -600, 0], spin: [-4, 4], colorGradient: [[0, '#ffffff', 1], [0.8, '#9fe4ff', 1], [1, '#9fe4ff', 0]] }),
            this.glowL(FX_TEX.snow, '#ffffff', { burst: 20, capacity: 24, life: [0.9, 1.6], size: [14, 26], speed: [30, 120], direction: [[-1, 0.4, -1], [1, 1.2, 1]], gravity: [0, -90, 0], spin: [-2, 2], blend: 'standard', colorGradient: [[0, '#ffffff', 1], [0.8, '#cfeeff', 0.9], [1, '#cfeeff', 0]] }),
            this.glowL(FX_TEX.smoke, '#bdeaff', { blend: 'standard', burst: 12, capacity: 14, life: [0.8, 1.4], size: [80, 140], speed: [40, 130], direction: [[-1, 0.05, -1], [1, 0.25, 1]], sizeGradient: [[0, 0.5], [1, 1.5]], colorGradient: [[0, '#d8f6ff', 0.5], [1, '#d8f6ff', 0]] }),
            this.glowL(FX_TEX.glow, c, { burst: 1, capacity: 2, life: [0.4, 0.5], size: [600, 700], speed: [0, 0], sizeGradient: [[0, 0.3], [1, 1]], colorGradient: [[0, '#e8fbff', 0.6], [1, c, 0]] }),
        ], x, y, h);
    },

    /** Ядовитая лужа (непрерывная, ~3 c): пузыри и пар. o.life, o.r. */
    fx_toxic(x, y, h, o) {
        const R = o.r || 170, d = o.life || 3, c = '#c8ff1e';
        return this.shot([
            this.glowL(FX_TEX.bubble, c, { burst: undefined, rate: 16, duration: d - 0.3, capacity: 30, life: [0.7, 1.2], size: [14, 30], speed: [30, 80], box: [[-R * 0.8, 0, -R * 0.8], [R * 0.8, 6, R * 0.8]], direction: [[-0.2, 1, -0.2], [0.2, 1.4, 0.2]], sizeGradient: [[0, 0.4], [1, 1.1]], colorGradient: [[0, c, 0.9], [0.7, '#e6ff7a', 0.7], [1, c, 0]] }),
            this.glowL(FX_TEX.smoke, '#9dff3a', { blend: 'standard', burst: undefined, rate: 12, duration: d - 0.3, capacity: 24, life: [0.8, 1.4], size: [50, 90], speed: [10, 40], box: [[-R * 0.7, 0, -R * 0.7], [R * 0.7, 10, R * 0.7]], direction: [[-0.2, 1, -0.2], [0.2, 1.5, 0.2]], sizeGradient: [[0, 0.4], [1, 1.4]], colorGradient: [[0, '#9dff3a', 0.55], [1, '#3a6a10', 0]] }),
            this.gooL(c, { burst: undefined, rate: 10, duration: d - 0.3, capacity: 16, life: [0.4, 0.7], size: [8, 14], speed: [120, 220], box: [[-R * 0.6, 0, -R * 0.6], [R * 0.6, 4, R * 0.6]], direction: [[-0.3, 1, -0.3], [0.3, 1.6, 0.3]], gravity: [0, -900, 0] }),
        ], x, y, h);
    },

    /** Чёрная дыра: свечение и всплески; втягивание — GameFx.suck каждый кадр. */
    fx_hole(x, y, h) {
        return this.shot([
            this.glowL(FX_TEX.glow, '#8a3cff', { burst: undefined, rate: 5, duration: 3, capacity: 12, life: [0.5, 0.7], size: [380, 460], speed: [0, 0], sizeGradient: [[0, 0.5], [1, 1]], colorGradient: [[0, '#8a3cff', 0.55], [1, '#3a0a6a', 0]] }),
            this.glowL(FX_TEX.star, '#d8b0ff', { burst: undefined, rate: 18, duration: 3, capacity: 30, life: [0.5, 0.9], size: [14, 26], speed: [60, 160], color2: '#8a3cff', box: [[-80, -40, -80], [80, 40, 80]], direction: [[-1, 0.2, -1], [1, 1, 1]], sizeGradient: [[0, 1], [1, 0]] }),
        ], x, y, h);
    },
    fx_hole_end(x, y, h) {
        this.decal({ tex: 'rthin', x, y, h: h - 90, r0: 40, r1: 520, life: 0.5, color: '#b05cff', ease: 'out' });
        return this.shot([
            this.glowL(FX_TEX.glow, '#ffffff', { burst: 1, capacity: 2, life: [0.3, 0.35], size: [700, 760], speed: [0, 0], sizeGradient: [[0, 0.3], [1, 1]], colorGradient: [[0, '#ffffff', 0.9], [0.4, '#b05cff', 0.8], [1, '#8a3cff', 0]] }),
            this.gooL('#b05cff', { burst: 26, capacity: 30, size: [14, 30], speed: [200, 520], direction: [[-1, 0.2, -1], [1, 1.2, 1]], gravity: [0, -700, 0] }),
            this.glowL(FX_TEX.line, '#e0c0ff', { stretch: true, burst: 20, capacity: 24, life: [0.3, 0.5], size: [60, 110], speed: [500, 900], direction: [[-1, 0, -1], [1, 0.6, 1]] }),
        ], x, y, h);
    },

    /** Попадание метеора: золотая вспышка, огонь, обломки, воронка. */
    fx_meteor_hit(x, y, h, o) {
        const R = o.r || 190, c = '#ffd23c';
        this.decal({ tex: 'rthin', x, y, h: h - 6, r0: 30, r1: R * 1.6, life: 0.45, color: c, ease: 'out' });
        this.decal({ tex: 'disc', x, y, h: h - 6, r0: 30, r1: R * 1.3, life: 0.4, color: '#ffb04d', a: 0.5, ease: 'out' });
        this.decal({ tex: 'scorch', x, y, h: h - 6, r0: R * 1.1, r1: R * 1.3, life: 1.8, color: '#ffffff', a: 0.7, ease: 'out', add: false, fade: [0.02, 0.5] });
        this.decal({ tex: 'crack', x, y, h: h - 5, r0: R * 0.9, r1: R * 1.1, life: 1.2, color: c, a: 0.9, ease: 'out', fade: [0.02, 0.7] });
        return this.shot([
            this.glowL(FX_TEX.glow, '#fff6c0', { burst: 1, capacity: 2, life: [0.25, 0.3], size: [560, 620], speed: [0, 0], sizeGradient: [[0, 0.3], [1, 1]], colorGradient: [[0, '#ffffff', 1], [0.4, c, 0.8], [1, '#8a3cff', 0]] }),
            { burst: 18, capacity: 22, life: [0.4, 0.9], size: [50, 90], speed: [100, 340], texture: FX_TEX.fire, sheet: { width: 256, height: 256, start: 0, end: 15, speed: 1.5, randomStart: true }, color: '#ffffff', direction: [[-1, 0.4, -1], [1, 1.4, 1]], gravity: [0, -300, 0] },
            this.glowL(FX_TEX.star, '#fff2a0', { burst: 20, capacity: 24, life: [0.5, 1], size: [18, 34], speed: [200, 520], color2: '#ff9a2e', direction: [[-1, 0.5, -1], [1, 1.8, 1]], gravity: [0, -500, 0], sizeGradient: [[0, 1], [1, 0]] }),
            this.gooL('#4a3020', { texture: FX_TEX.blob2, burst: 14, capacity: 16, life: [0.6, 1.1], size: [16, 32], speed: [150, 420], direction: [[-1, 0.6, -1], [1, 1.8, 1]], gravity: [0, -900, 0], colorGradient: [[0, '#ffb04d', 1], [0.8, '#ff9a2e', 1], [1, '#ff9a2e', 0]] }),
            this.glowL(FX_TEX.smoke, '#3a2a4a', { blend: 'standard', burst: 10, capacity: 12, life: [0.9, 1.6], size: [70, 120], speed: [40, 120], direction: [[-0.5, 1, -0.5], [0.5, 1.5, 0.5]], sizeGradient: [[0, 0.5], [1, 1.5]], colorGradient: [[0, '#3a2a4a', 0.7], [1, '#3a2a4a', 0]] }),
        ], x, y, h);
    },
    /** Хвост метеора: непрерывно, следует за позицией (setPosition). */
    fx_meteor_tail(x, y, h) {
        return this.shot([
            this.glowL(FX_TEX.fireball, '#ffe27a', { burst: undefined, rate: 70, capacity: 50, life: [0.25, 0.45], size: [50, 90], speed: [0, 20], color2: '#ff7a1e', sizeGradient: [[0, 1], [1, 0.2]] }),
            this.glowL(FX_TEX.glow, '#ffd23c', { burst: undefined, rate: 40, capacity: 40, life: [0.2, 0.4], size: [90, 160], speed: [0, 10], colorGradient: [[0, '#fff2a0', 0.8], [1, '#ff7a1e', 0]], sizeGradient: [[0, 1], [1, 0.3]] }),
            this.glowL(FX_TEX.star, '#ffe27a', { burst: undefined, rate: 24, capacity: 30, life: [0.3, 0.6], size: [14, 26], speed: [20, 90], direction: [[-1, -0.5, -1], [1, 0.5, 1]], sizeGradient: [[0, 1], [1, 0]] }),
        ], x, y, h);
    },
    /** Хвост плевка: чёрные капли с зелёной каймой + зелёное свечение. */
    fx_spit_trail(x, y, h) {
        const c = '#7dff4d';
        return this.shot([
            this.gooL(c, { burst: undefined, rate: 70, capacity: 40, life: [0.2, 0.4], size: [10, 18], speed: [0, 15], gravity: [0, -200, 0], sizeGradient: [[0, 1], [1, 0.2]] }),
            this.glowL(FX_TEX.glow, c, { burst: undefined, rate: 40, capacity: 30, life: [0.15, 0.3], size: [40, 66], speed: [0, 0], sizeGradient: [[0, 1], [1, 0.2]], colorGradient: [[0, c, 0.6], [1, c, 0]] }),
        ], x, y, h);
    },
    /** Портал: вихрь (плоский на земле) + столб искр, живёт до смены карты. */
    fx_portal(x, y, h) {
        this.decal({ tex: 'swirl', x, y, h: h + 4, r0: 150, r1: 150, life: Infinity, color: '#b05cff', a: 0.9, spin: 1.6 });
        this.decal({ tex: 'swirl', x, y, h: h + 5, r0: 100, r1: 100, life: Infinity, color: '#4de8ff', a: 0.7, spin: -2.4 });
        this.decal({ tex: 'rthin', x, y, h: h + 3, r0: 80, r1: 170, life: Infinity, color: '#c48aff', a: 0.9, loop: 1.6 });
        return this.shot([
            this.glowL(FX_TEX.star, '#c48aff', { burst: undefined, rate: 26, capacity: 50, life: [0.9, 1.6], size: [12, 24], speed: [60, 140], color2: '#4de8ff', box: [[-110, 0, -110], [110, 20, 110]], direction: [[-0.25, 1, -0.25], [0.25, 1.6, 0.25]], sizeGradient: [[0, 0.3], [0.3, 1], [1, 0]] }),
            this.glowL(FX_TEX.glow, '#8a3cff', { burst: undefined, rate: 3, capacity: 6, life: [1.2, 1.6], size: [380, 440], speed: [0, 0], colorGradient: [[0, '#8a3cff', 0], [0.4, '#8a3cff', 0.35], [1, '#8a3cff', 0]] }),
        ], x, y, h);
    },

    // ---- плоские декали на земле, столбы света ---------------------------------------------------------
    tex(key) {
        if (!this.texs[key]) { const t = new BABYLON.Texture(/** @type {Record<string,string>} */ (FX_TEX)[key], this.scene()); t.hasAlpha = true; this.texs[key] = t; }
        return this.texs[key];
    },
    /** Общий материал на (текстура, цвет, аддитив): прозрачность — через mesh.visibility. */
    mat(key, color, add) {
        const id = key + color + (add === false ? 's' : 'a');
        if (!this.mats[id]) {
            const m = new BABYLON.StandardMaterial('fx-' + id, this.scene());
            m.diffuseTexture = this.tex(key); m.useAlphaFromDiffuseTexture = true;
            m.emissiveColor = BABYLON.Color3.FromHexString(color); m.diffuseColor = BABYLON.Color3.Black(); m.specularColor = BABYLON.Color3.Black();
            m.disableLighting = true; m.backFaceCulling = false;
            if (add !== false) m.alphaMode = BABYLON.Engine.ALPHA_ADD;
            this.mats[id] = m;
        }
        return this.mats[id];
    },
    /**
     * Плоская картинка на земле. o: tex (ключ FX_TEX), x, y, h, r0->r1 (радиус), life (Infinity — до смены карты), color, a, ease ('out'|'in'|'lin'),
     * fade [вход, выход] доли жизни, spin (рад/с), rise (подъём), delay, loop (период повтора), follow (функция позиции), add (false — обычное смешивание),
     * manual (не обновлять, владелец сам ставит mesh.scaling/visibility).
     * @param {any} o
     */
    decal(o) {
        const m = BABYLON.MeshBuilder.CreatePlane('fx-dec', { size: 2 }, this.scene());
        m.rotation.x = Math.PI / 2;
        m.position.set(o.x || 0, (o.h || 0) + 3, o.y || 0);
        m.material = this.mat(o.tex, o.color || '#ffffff', o.add);
        m.isPickable = false; m.visibility = 0; m.alwaysSelectAsActiveMesh = true;
        m.renderingGroupId = World3D.LAYER.OVERLAY;
        const d = Object.assign({ t: 0, life: 0.5, r0: 1, r1: 1, a: 1, ease: 'out', fade: [0.08, 0.45], spin: 0 }, o, { mesh: m });
        if (!(d.life > 0)) d.life = 0.5;                 // NaN/undefined — иначе декаль не умрёт никогда
        d.t = -(o.delay || 0) + (o.t0 || 0);
        this.decals.push(d);
        // предохранитель: временных декалей не больше лимита — старейшие уходят
        if (this.decals.length > 140) {
            const old = this.decals.find((q) => q.life !== Infinity && !q.manual && q !== d);
            if (old) this.killDecal(old);
        }
        return d;
    },
    killDecal(d) {
        const i = this.decals.indexOf(d);
        if (i >= 0) this.decals.splice(i, 1);
        try { d.mesh.dispose(); } catch (e) { /* сцена уже удалена */ }
    },
    /** Вертикальный столб света (плоскость к камере по Y). */
    beam(x, y, h, color, life, w, hh) {
        const m = BABYLON.MeshBuilder.CreatePlane('fx-beam', { width: w, height: hh }, this.scene());
        m.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;
        m.position.set(x, h + hh / 2, y);
        m.material = this.mat('beam', color, true);
        m.isPickable = false; m.visibility = 0; m.alwaysSelectAsActiveMesh = true;
        m.renderingGroupId = World3D.LAYER.OVERLAY;
        const d = { mesh: m, t: 0, life, beam: true, x, y, h, w, hh, a: 1 };
        this.decals.push(d);
        return d;
    },
    /** Кольцо, поднимающееся от ног вверх (уровень). */
    risingRing(x, y, foot, color, r, life, rise) {
        return this.decal({ tex: 'rthin', x, y, h: foot, r0: r * 0.9, r1: r * 1.15, life, color, rise, ease: 'lin', fade: [0.1, 0.5] });
    },
    updateDecals(dt) {
        for (let i = this.decals.length - 1; i >= 0; i--) {
            const d = this.decals[i];
            if (d.manual) continue;
            d.t += dt;
            if (d.t < 0) continue;
            const inf = d.life === Infinity;
            let k = inf ? 0 : d.t / d.life;
            if (k >= 1) { this.killDecal(d); continue; }
            const m = d.mesh;
            if (d.beam) {
                m.scaling.set(0.45 + 0.55 * Math.sin(Math.min(1, k * 3) * 1.57), Math.min(1, 0.25 + k * 6), 1);
                m.position.y = d.h + d.hh * m.scaling.y / 2;
                m.visibility = (1 - k) * (1 - k) * d.a;
                continue;
            }
            let kk = k;
            if (d.loop) kk = (d.t / d.loop) % 1;
            const e = d.ease === 'in' ? kk * kk : d.ease === 'lin' ? kk : 1 - (1 - kk) * (1 - kk);
            const r = d.r0 + (d.r1 - d.r0) * e;
            m.scaling.set(r, r, 1);
            if (d.spin) m.rotation.z += d.spin * dt;
            let a = d.a;
            if (d.loop) a *= Math.sin(kk * Math.PI);
            else if (inf) a *= Math.min(1, d.t / 0.3);
            else a *= Math.min(1, k / d.fade[0]) * Math.min(1, (1 - k) / d.fade[1]);
            m.visibility = Math.max(0, a);
            if (d.follow) { const p = d.follow(); if (p) m.position.set(p.x, p.y + 3, p.z); }
            else if (d.rise) m.position.y = d.h + 3 + d.rise * e;
        }
    },
    /** Временное кольцо-индикатор радиуса r (opts.fill — ещё и светлая заливка). */
    ring(x, y, h, r, color, life, opts) {
        const o = opts || {};
        this.decal({ tex: 'rthin', x, y, h, r0: r * 0.2, r1: r, life: life || 0.5, color: color || '#ffffff', ease: o.ease || 'out', a: o.a || 1 });
        if (o.fill) this.decal({ tex: 'disc', x, y, h, r0: r * 0.2, r1: r, life: life || 0.5, color: color || '#ffffff', ease: o.ease || 'out', a: 0.4 });
    },
    /** Наземный индикатор удара по области: внешнее кольцо + заливка, растущая к краю (k 0..1). Возвращает { set(k), dispose() }. */
    telegraph(x, y, h, r, color) {
        const c = color || '#ff2a3a';
        const outer = this.decal({ tex: 'rthin', x, y, h, r0: r, r1: r, life: Infinity, color: c, a: 0.95 });
        const fill = this.decal({ tex: 'disc', x, y, h: h + 1, r0: r, r1: r, life: Infinity, color: c, a: 0.5, manual: true });
        const warn = this.decal({ tex: 'rthin', x, y, h: h + 2, r0: r, r1: r, life: Infinity, color: '#ffffff', a: 0.6, manual: true });
        let t = 0;
        return {
            set(k) {
                t += 0.016;
                const s = Math.max(0.02, k) * r;
                fill.mesh.scaling.set(s, s, 1); fill.mesh.visibility = 0.3 + 0.35 * k + 0.12 * Math.sin(t * 26 * (0.5 + k));
                warn.mesh.scaling.set(s, s, 1); warn.mesh.visibility = 0.5 * k;
            },
            dispose() { GameFx.killDecal(outer); GameFx.killDecal(fill); GameFx.killDecal(warn); },
        };
    },

    // ---- косметика: аура и след ---------------------------------------------------------------
    AURA_TEX: { 'aura-hearts': 'heart', 'aura-ice': 'snow', 'aura-frost': 'snow', 'aura-galaxy': 'star', 'aura-gold': 'star' },
    TRAIL_TEX: { 'trail-hearts': 'heart', 'trail-ice': 'snow', 'trail-stars': 'star', 'trail-galaxy': 'star', 'trail-gold': 'star', 'trail-gold2': 'star' },

    /** Обновить ауру и след под надетое (cosmetic look) и держать их на герое. */
    setCosmetics(look, follow) {
        const fx = this.fx();
        if (!fx) return;
        const auraId = look.aura || 'aura-none', trailId = look.trail || 'trail-none';
        if (auraId !== this.auraId) {
            if (this.aura) this.aura.dispose();
            this.aura = null; this.auraId = auraId;
            const row = GameShopData.AURA.find((r) => r[0] === auraId);
            const p = row ? row[4] : { none: true };
            if (!p.none) this.aura = this.makeAura(p, follow, auraId);
        }
        if (trailId !== this.trailId) {
            if (this.trail) this.trail.dispose();
            this.trail = null; this.trailId = trailId;
            const row = GameShopData.TRAIL.find((r) => r[0] === trailId);
            const p = row ? row[4] : { none: true };
            if (!p.none) this.trail = this.makeTrail(p, follow, trailId);
        }
    },
    makeAura(p, follow, id) {
        const T = FX_TEX, big = p.big ? 1.5 : 1, c = p.color, light = this.lighten(c, 0.5), rim = this.rimOf(c);
        const rb = p.rainbow ? { colorGradient: FX_RAINBOW } : {};
        const tk = /** @type {any} */ (this.AURA_TEX)[id], tex = tk ? /** @type {any} */ (FX_TEX)[tk] : T.star;
        const box = (w, y0, y1) => [[-w, y0, -w], [w, y1, w]];
        /** @type {any[]} */
        const layers = [];
        /** @type {any[]} */
        const decs = [];
        const rings = (r0, r1, col) => {
            decs.push(this.decal({ tex: 'rthin', follow, r0, r1, life: Infinity, loop: 1.9, color: col, a: 0.95 }));
            decs.push(this.decal({ tex: 'rthin', follow, r0, r1, life: Infinity, loop: 1.9, t0: 0.95, color: col, a: 0.95 }));
        };
        if (p.type === 'ring') {
            rings(90 * big, 190 * big, c);
            decs.push(this.decal({ tex: 'disc', follow, r0: 130 * big, r1: 130 * big, life: Infinity, color: c, a: 0.16 }));
            layers.push({ rate: 8, capacity: 16, life: [0.8, 1.3], size: [10, 18], speed: [20, 60], texture: T.star, color: light, color2: c, box: box(110 * big, 0, 40), direction: [[-0.1, 1, -0.1], [0.1, 1.5, 0.1]], sizeGradient: [[0, 0.3], [0.3, 1], [1, 0]] });
        }
        if (p.type === 'flame') {
            layers.push(Object.assign({ rate: 30 * big, capacity: 56, life: [0.5, 0.95], size: [44 * big, 80 * big], speed: [60, 140], texture: T.flame, color: c, color2: light, box: box(55 * big, 0, 20), direction: [[-0.1, 1, -0.1], [0.1, 1.5, 0.1]], sizeGradient: [[0, 0.5], [0.3, 1], [1, 0.1]], colorGradient: [[0, light, 0.9], [0.5, c, 0.8], [1, c, 0]] }, rb));
            layers.push({ rate: 10, capacity: 18, life: [0.6, 1.1], size: [8, 14], speed: [60, 150], texture: T.star, color: light, color2: c, box: box(50 * big, 10, 60), direction: [[-0.2, 1, -0.2], [0.2, 1.8, 0.2]] });
            layers.push({ rate: 3, capacity: 6, life: [0.9, 1.2], size: [200 * big, 240 * big], speed: [0, 0], texture: T.glow, color: c, colorGradient: [[0, c, 0], [0.4, c, 0.28], [1, c, 0]], box: box(10, 40, 80) });
        }
        if (p.type === 'sparkle') {
            const big2 = tk === 'heart' ? 1.4 : 1;
            layers.push(Object.assign({ rate: 22 * big, capacity: 44, life: [0.7, 1.3], size: [11 * big * big2, 22 * big * big2], speed: [20, 70], texture: tex, blend: tk ? 'standard' : undefined, color: c, color2: light, box: box(70 * big, 0, 190), direction: [[-0.2, 1, -0.2], [0.2, 1.4, 0.2]], spin: tk === 'snow' ? [-2, 2] : [-0.5, 0.5], sizeGradient: [[0, 0.2], [0.25, 1], [1, 0.1]], colorGradient: [[0, light, 1], [0.6, c, 1], [1, c, 0]] }, rb));
            layers.push({ rate: 6 * big, capacity: 12, life: [1, 1.5], size: [40 * big, 70 * big], speed: [10, 30], texture: T.glow, color: c, box: box(60 * big, 20, 170), colorGradient: [[0, c, 0], [0.4, c, 0.3], [1, c, 0]] });
            if (p.big) layers.push(Object.assign({ rate: 10, capacity: 20, life: [0.5, 0.9], size: [22, 40], speed: [100, 200], texture: T.star, color: '#ffffff', color2: c, box: box(30, 80, 120), direction: [[-1, 0.2, -1], [1, 0.8, 1]], sizeGradient: [[0, 1], [1, 0]] }, rb));
        }
        if (p.type === 'smoke') {
            layers.push({ rate: 16 * big, capacity: 34, life: [0.9, 1.5], size: [50 * big, 90 * big], speed: [10, 45], texture: T.smoke, color: c, blend: 'standard', box: box(55 * big, 0, 50), direction: [[-0.2, 1, -0.2], [0.2, 1.4, 0.2]], sizeGradient: [[0, 0.5], [1, 1.5]], colorGradient: [[0, c, 0], [0.25, c, 0.7], [1, c, 0]] });
            layers.push({ rate: 7, capacity: 14, life: [0.7, 1.2], size: [10, 18], speed: [20, 70], texture: T.star, color: this.lighten(c, 0.7), color2: c, box: box(60 * big, 10, 150), direction: [[-0.2, 1, -0.2], [0.2, 1.4, 0.2]], sizeGradient: [[0, 0.3], [0.3, 1], [1, 0]] });
        }
        if (p.type === 'bolt') {
            layers.push({ rate: 14 * big, capacity: 24, life: [0.12, 0.22], size: [90 * big, 150 * big], speed: [0, 20], texture: T.bolt, rot: true, color: '#ffffff', color2: light, box: box(60 * big, 20, 180) });
            layers.push({ rate: 14 * big, capacity: 24, life: [0.14, 0.24], size: [160 * big, 240 * big], speed: [0, 0], texture: T.glow, color: c, box: box(60 * big, 20, 180), colorGradient: [[0, c, 0.6], [1, c, 0]] });
            layers.push({ rate: 14, capacity: 24, life: [0.15, 0.3], size: [30, 60], speed: [100, 300], texture: T.line, stretch: true, color: light, color2: c, box: box(50 * big, 10, 140), direction: [[-1, 0, -1], [1, 1, 1]] });
        }
        if (p.type === 'bubbles') {
            layers.push({ rate: 15, capacity: 30, life: [0.9, 1.5], size: [12, 26], speed: [30, 80], texture: T.bubble, color: c, color2: '#ffffff', box: box(65, 0, 60), direction: [[-0.2, 1, -0.2], [0.2, 1.3, 0.2]], sizeGradient: [[0, 0.5], [1, 1.1]], colorGradient: [[0, c, 0.95], [0.8, c, 0.8], [1, c, 0]] });
        }
        if (p.type === 'drops') {
            layers.push(this.gooL(rim, { burst: undefined, rate: 18, capacity: 30, life: [0.4, 0.8], size: [8, 15], speed: [10, 60], gravity: [0, -900, 0], box: box(55, 90, 170), direction: [[-0.4, 0.2, -0.4], [0.4, 0.8, 0.4]] }));
            layers.push({ rate: 3, capacity: 6, life: [1, 1.4], size: [230, 260], speed: [0, 0], texture: T.glow, color: rim, box: box(10, 60, 100), colorGradient: [[0, rim, 0], [0.4, rim, 0.22], [1, rim, 0]] });
        }
        if (p.ring && p.type !== 'ring') rings(100 * big, 210 * big, c);
        if (p.big && p.type !== 'sparkle') layers.push(Object.assign({ rate: 3, capacity: 6, life: [1.1, 1.5], size: [280, 320], speed: [0, 0], texture: T.glow, color: c, box: box(10, 60, 120), colorGradient: [[0, c, 0], [0.4, c, 0.25], [1, c, 0]] }, rb));
        return this.followGroup(layers, follow, decs);
    },
    makeTrail(p, follow, id) {
        const T = FX_TEX, big = p.big ? 1.4 : 1, c = p.color, light = this.lighten(c, 0.5), rim = this.rimOf(c);
        const rb = p.rainbow ? { colorGradient: FX_RAINBOW } : {};
        const tk = /** @type {any} */ (this.TRAIL_TEX)[id], tex = tk ? /** @type {any} */ (FX_TEX)[tk] : T.star;
        const bx = (w, y0, y1) => [[-w, y0, -w], [w, y1, w]];
        /** @type {any[]} */
        const layers = [Object.assign({ rate: 44 * big, capacity: 70, life: [0.4, 0.8], size: [22 * big, 40 * big], speed: [0, 8], texture: T.glow, color: c, color2: light, box: bx(22, 6, 14), sizeGradient: [[0, 1], [1, 0.1]], colorGradient: [[0, light, 0.8], [1, c, 0]] }, rb)];
        if (p.drops) layers.push(this.gooL(rim, { burst: undefined, rate: 14, capacity: 26, life: [0.9, 1.5], size: [14, 28], speed: [0, 6], gravity: [0, 0, 0], texture: T.blob2, box: bx(30, 2, 5), sizeGradient: [[0, 0.5], [0.15, 1], [1, 0.8]] }));
        if (p.fire) layers.push({ rate: 22, capacity: 30, life: [0.35, 0.7], size: [34 * big, 56 * big], speed: [20, 70], texture: T.flame, color: c, color2: light, box: bx(20, 0, 10), direction: [[-0.1, 1, -0.1], [0.1, 1.4, 0.1]], sizeGradient: [[0, 0.6], [0.3, 1], [1, 0.1]], colorGradient: [[0, light, 0.9], [0.6, c, 0.7], [1, c, 0]] });
        if (p.sparkle) layers.push(Object.assign({ rate: 20 * big, capacity: 30, life: [0.5, 1], size: [12 * big * (tk === 'heart' ? 1.4 : 1), 22 * big * (tk === 'heart' ? 1.4 : 1)], speed: [10, 50], texture: tex, blend: tk && tk !== 'star' ? 'standard' : undefined, color: c, color2: light, box: bx(32, 10, 60), direction: [[-0.2, 1, -0.2], [0.2, 1.4, 0.2]], spin: [-2, 2], sizeGradient: [[0, 0.3], [0.3, 1], [1, 0]] }, rb));
        if (p.smoke) layers.push({ rate: 12, capacity: 20, life: [0.7, 1.2], size: [36 * big, 60 * big], speed: [5, 25], texture: T.smoke, color: c, blend: 'standard', box: bx(20, 6, 20), sizeGradient: [[0, 0.5], [1, 1.5]], colorGradient: [[0, c, 0.55], [1, c, 0]] });
        if (p.bolt) {
            layers.push({ rate: 10, capacity: 14, life: [0.07, 0.14], size: [60, 110], speed: [0, 10], texture: T.bolt, rot: true, color: '#ffffff', color2: light, box: bx(30, 10, 90) });
            layers.push({ rate: 14, capacity: 20, life: [0.15, 0.3], size: [30, 60], speed: [150, 350], texture: T.line, stretch: true, color: light, color2: c, box: bx(20, 6, 50), direction: [[-1, 0, -1], [1, 0.6, 1]] });
        }
        if (p.rainbow || p.big) layers.push(Object.assign({ rate: 14, capacity: 24, life: [0.6, 1.1], size: [10, 20], speed: [20, 70], texture: T.star, color: '#ffffff', color2: light, box: bx(30, 10, 70), direction: [[-0.4, 1, -0.4], [0.4, 1.4, 0.4]], sizeGradient: [[0, 0.3], [0.3, 1], [1, 0]] }, rb));
        return this.followGroup(layers, follow, [], 1.5);
    },
    /** Группа непрерывных слоёв за функцией позиции (+ декали, идущие за ней). */
    /** Крупнее мелкие спрайты (камера далеко): размеры до 150 умножаются на k, большие свечения не трогаем. */
    scaleL(layers, k) {
        return layers.map((l) => (l.size && l.size[1] < 150 ? Object.assign({}, l, { size: [l.size[0] * k, l.size[1] * k] }) : l));
    },
    followGroup(layers0, follow, decs, k) {
        const layers = this.scaleL(layers0, k || 1.6);
        const pairs = layers.map((l) => ({ h: this.mk(Object.assign({}, l, { follow }), follow()), rate: l.rate || 0 })).filter((q) => q.h);
        const hs = pairs.map((q) => q.h);
        return {
            handles: hs, decals: decs,
            setRate(k) { pairs.forEach((q) => q.h.setRate(q.rate * k)); },
            dispose() { hs.forEach((h) => h.dispose()); for (const d of decs) GameFx.killDecal(d); },
        };
    },

    // ---- эффект победы из косметики «Победа» -------------------------------------------------------------
    winEffect(x, y, h) {
        const id = typeof Shop !== 'undefined' && Shop.state ? (Shop.look().win || 'win-confetti') : 'win-confetti';
        const row = GameShopData.WIN.find((r) => r[0] === id) || GameShopData.WIN[0];
        const p = row[4], T = FX_TEX, fx = this.fx();
        if (!fx) return;
        const big = p.big ? 1.5 : 1, c = p.color, light = this.lighten(c, 0.55), pos = this.v3(x, h || 0, y);
        const rb = p.rainbow ? { colorGradient: FX_RAINBOW } : {};
        const dark = this.lum(c) < 0.28, rim = this.rimOf(c);
        /** @type {any[]} */
        const layers = [];
        const dirUp = [[-0.5, 1.2, -0.5], [0.5, 2.6, 0.5]];
        // общее: кольцо по земле + вспышка
        this.decal({ tex: 'rthin', x, y, h, r0: 60, r1: 560 * big, life: 0.75, color: c, ease: 'out' });
        this.decal({ tex: 'rthin', x, y, h, r0: 40, r1: 420 * big, life: 0.6, delay: 0.12, color: '#ffffff', ease: 'out', a: 0.8 });
        layers.push({ burst: 1, capacity: 2, life: [0.35, 0.4], size: [520 * big, 560 * big], speed: [0, 0], texture: T.glow, color: c, sizeGradient: [[0, 0.3], [1, 1]], colorGradient: [[0, '#ffffff', 0.8], [0.4, c, 0.6], [1, c, 0]], position: pos.add(new BABYLON.Vector3(0, 120, 0)) });
        const star = (o) => Object.assign({ texture: T.star, blend: 'standard', color: c, color2: light, sizeGradient: [[0, 0.3], [0.2, 1], [1, 0]] }, rb, o);
        switch (p.type) {
            case 'confetti':
                layers.push({ burst: 130, capacity: 140, life: [1.2, 2.2], size: [12, 20], speed: [350, 800], texture: T.confetti, blend: 'standard', color: '#ffffff', colorGradient: FX_RAINBOW, rot: true, direction: [[-0.7, 1.4, -0.7], [0.7, 3, 0.7]], gravity: [0, -800, 0], spin: [-8, 8] });
                layers.push(star({ burst: 30, capacity: 34, life: [0.8, 1.4], size: [16, 30], speed: [250, 600], color: '#ffffff', color2: '#ffe23a', direction: dirUp, gravity: [0, -500, 0] }));
                break;
            case 'fountain': {
                const tk = { '#ff5fd2': 'heart', '#3af0ff': 'shard' }[c];
                if (dark || tk === undefined && p.color === '#7dff00') {
                    layers.push(this.gooL(dark ? rim : c, { burst: undefined, rate: 110, duration: 1.4, capacity: 150, life: [0.9, 1.7], size: [14 * big, 30 * big], speed: [520, 860], direction: [[-0.25, 1, -0.25], [0.25, 1, 0.25]], gravity: [0, -900, 0] }));
                    layers.push({ rate: 40, duration: 1.4, capacity: 50, life: [0.8, 1.4], size: [14, 26], speed: [300, 600], texture: T.bubble, color: dark ? rim : c, direction: [[-0.3, 1, -0.3], [0.3, 1, 0.3]], gravity: [0, -500, 0] });
                } else {
                    const tx = tk ? /** @type {any} */ (FX_TEX)[tk] : T.star;
                    layers.push(star({ burst: undefined, rate: 110, duration: 1.4, capacity: 150, life: [0.9, 1.7], size: [16 * big * (tk === 'heart' ? 1.4 : 1), 30 * big * (tk === 'heart' ? 1.4 : 1)], speed: [520, 860], texture: tx, direction: [[-0.25, 1, -0.25], [0.25, 1, 0.25]], gravity: [0, -900, 0], spin: [-4, 4] }));
                }
                this.beam(x, y, h, c, 1.2, 130, 600);
                break;
            }
            case 'burst':
                layers.push(star({ burst: 100 * big, capacity: 150, life: [0.9, 1.6], size: [14 * big, 28 * big], speed: [350, 760], texture: p.color === '#bdf3ff' ? T.snow : T.star, direction: [[-1, 0.4, -1], [1, 1.8, 1]], gravity: [0, -330, 0], spin: [-3, 3] }));
                layers.push({ burst: 40, capacity: 44, life: [0.3, 0.6], size: [90, 180], speed: [700, 1300], texture: T.line, stretch: true, color: '#ffffff', color2: c, direction: [[-1, 0, -1], [1, 1.2, 1]], sizeGradient: [[0, 1], [1, 0.2]] });
                break;
            case 'rain':
                layers.push(star({ burst: undefined, rate: 120 * big, duration: 1.8, capacity: 200, life: [0.9, 1.5], size: [16 * big, 30 * big], speed: [120, 260], box: [[-420, 600, -420], [420, 720, 420]], direction: [[-0.1, -1, -0.1], [0.1, -1, 0.1]], spin: [-2, 2] }));
                layers.push({ burst: undefined, rate: 30, duration: 1.8, capacity: 40, life: [0.8, 1.3], size: [60, 100], speed: [100, 200], texture: T.glow, color: c, box: [[-420, 600, -420], [420, 720, 420]], direction: [[-0.1, -1, -0.1], [0.1, -1, 0.1]], colorGradient: [[0, c, 0.5], [1, c, 0]] });
                if (p.rainbow) this.decal({ tex: 'swirl', x, y, h, r0: 380, r1: 380, life: 2.2, color: '#ff6bff', spin: 2, a: 0.8 });
                break;
            case 'pillar':
                this.beam(x, y, h, c, 1.3, 190 * big, 1100 * big);
                if (this.lum(c) < 0.6 && p.big) this.decal({ tex: 'swirl', x, y, h, r0: 300, r1: 300, life: 1.6, color: c, spin: 3, a: 0.9 });
                layers.push({ burst: undefined, rate: 140 * big, duration: 1.1, capacity: 160, life: [0.5, 1.1], size: [30 * big, 56 * big], speed: [650, 1000], texture: p.color === '#ff7a00' ? T.flame : T.glow, color: c, color2: light, box: [[-45, 0, -45], [45, 20, 45]], direction: [[-0.05, 1, -0.05], [0.05, 1, 0.05]] });
                if (p.color === '#7fd8ff' || p.color === '#b05cff') layers.push({ burst: undefined, rate: 14, duration: 1.2, capacity: 16, life: [0.1, 0.18], size: [260, 420], speed: [0, 0], texture: T.bolt, rot: true, color: '#ffffff', color2: light, box: [[-90, 200, -90], [90, 500, 90]] });
                layers.push(star({ burst: 40, capacity: 44, life: [0.7, 1.3], size: [14, 26], speed: [250, 520], direction: [[-1, 0.5, -1], [1, 1.6, 1]], gravity: [0, -300, 0] }));
                break;
            default:
                layers.push(star({ burst: 80, capacity: 90, life: [0.8, 1.5], size: [14, 28], speed: [300, 650], direction: [[-1, 0.4, -1], [1, 1.8, 1]], gravity: [0, -300, 0] }));
        }
        if (p.multi) {
            for (let i = 0; i < 3; i++) {
                const ox = this.rnd(-260, 260), oy = this.rnd(-260, 260), oh = this.rnd(380, 620), d = 0.3 + i * 0.28;
                this.later(d, () => {
                    this.shot([
                        star({ burst: 60, capacity: 70, life: [0.8, 1.4], size: [14, 28], speed: [250, 520], color: i % 2 ? c : '#ffffff', color2: p.rainbow ? '#3b8bff' : light, gravity: [0, -260, 0], direction: [[-1, -1, -1], [1, 1, 1]] }),
                        { burst: 1, capacity: 2, life: [0.4, 0.45], size: [380, 420], speed: [0, 0], texture: T.ring, color: c, sizeGradient: [[0, 0.1], [1, 1]], colorGradient: [[0, '#ffffff', 1], [1, c, 0]] },
                        { burst: 1, capacity: 2, life: [0.25, 0.3], size: [300, 340], speed: [0, 0], texture: T.glow, color: c, colorGradient: [[0, '#ffffff', 0.8], [1, c, 0]] },
                    ], x + ox, y + oy, (h || 0) + oh);
                });
            }
        }
        for (const l of this.scaleL(layers, 1.5)) this.mk(Object.assign({ position: pos }, l));
    },

    update(dt) {
        if (typeof Pause !== 'undefined' && Pause.active) return;
        this.t += dt;
        for (let i = this.timers.length - 1; i >= 0; i--) {
            const tm = this.timers[i];
            tm.t -= dt;
            if (tm.t <= 0) { this.timers.splice(i, 1); try { tm.fn(); } catch (e) { console.warn(e); } }
        }
        this.updatePops(dt);
        this.updateDecals(dt);
        if (this.hurtT > 0 && this.hurtEl) { this.hurtT -= dt; this.hurtEl.style.opacity = String(Math.max(0, this.hurtT / 0.35)); }
    },
};

// ---- звуки игры: имя -> варианты (литералы путей), громкость и минимальный интервал ----------------
/** @satisfies {Record<string, any>} */
const GameSfx = {
    /** @type {Record<string, number>} */ last: {},
    LIST: {
        step: { v: 0.25, gap: 0.12, f: ['assets/sounds/step-1.ogg', 'assets/sounds/step-2.ogg', 'assets/sounds/step-3.ogg'] },
        land: { v: 0.45, gap: 0.2, f: ['assets/sounds/land.wav'] },
        hurt: { v: 0.55, gap: 0.25, f: ['assets/sounds/hurt-1.ogg', 'assets/sounds/hurt-2.ogg', 'assets/sounds/hurt-3.ogg'] },
        hit: { v: 0.45, gap: 0.06, f: ['assets/sounds/hit-1.wav', 'assets/sounds/hit-2.wav', 'assets/sounds/hit-3.wav'] },
        kill: { v: 0.6, gap: 0.08, f: ['assets/sounds/splat-1.ogg', 'assets/sounds/splat-2.ogg', 'assets/sounds/splat-3.ogg'] },
        spit: { v: 0.5, gap: 0.1, f: ['assets/sounds/splat-1.ogg', 'assets/sounds/splat-3.ogg'] },
        toxic: { v: 0.5, gap: 0.2, f: ['assets/sounds/splat-2.ogg', 'assets/sounds/splat-1.ogg'] },
        gain: { v: 0.35, gap: 0.09, f: ['assets/sounds/gain-1.ogg', 'assets/sounds/gain-2.ogg', 'assets/sounds/gain-3.ogg'] },
        grow: { v: 0.8, gap: 0.3, f: ['assets/sounds/splat-1.ogg', 'assets/sounds/splat-2.ogg'] },
        shoot: { v: 0.35, gap: 0.08, f: ['assets/sounds/shoot.ogg'] },
        whip: { v: 0.4, gap: 0.08, f: ['assets/sounds/whip-1.ogg', 'assets/sounds/whip-2.ogg'] },
        swing: { v: 0.3, gap: 0.1, f: ['assets/sounds/whip-1.ogg', 'assets/sounds/whip-2.ogg'] },
        dash: { v: 0.35, gap: 0.2, f: ['assets/sounds/whip-2.ogg'] },
        spikes: { v: 0.6, gap: 0.2, f: ['assets/sounds/slam.ogg'] },
        slam: { v: 0.7, gap: 0.15, f: ['assets/sounds/slam.ogg'] },
        nova: { v: 0.7, gap: 0.2, f: ['assets/sounds/boom.ogg'] },
        frost: { v: 0.6, gap: 0.2, f: ['assets/sounds/confirm.ogg'] },
        hole: { v: 0.7, gap: 0.3, f: ['assets/sounds/portal.wav'] },
        boom: { v: 0.55, gap: 0.07, f: ['assets/sounds/boom.ogg', 'assets/sounds/slam.ogg'] },
        death: { v: 0.8, gap: 0.5, f: ['assets/sounds/hurt-3.ogg'] },
        click: { v: 0.5, gap: 0.05, f: ['assets/sounds/click.ogg'] },
        confirm: { v: 0.6, gap: 0.1, f: ['assets/sounds/confirm.ogg'] },
        levelup: { v: 0.7, gap: 0.25, f: ['assets/sounds/jingle-levelup.ogg'] },
        lose: { v: 0.8, gap: 0.5, f: ['assets/sounds/jingle-lose.ogg'] },
        win: { v: 0.8, gap: 0.5, f: ['assets/sounds/jingle-win.ogg'] },
        evolve: { v: 0.9, gap: 0.5, f: ['assets/sounds/jingle-evolve.ogg'] },
        portal: { v: 0.7, gap: 0.5, f: ['assets/sounds/portal.wav'] },
        gem: { v: 0.5, gap: 0.1, f: ['assets/sounds/gem.wav'] },
    },
    play(name, vol) {
        const s = this.LIST[name];
        if (!s || typeof Sound === 'undefined') return;
        const now = performance.now() / 1000;
        if (now - (this.last[name] || 0) < s.gap) return;
        this.last[name] = now;
        try { Sound.play(s.f.length > 1 ? s.f : s.f[0], { volume: s.v * (vol == null ? 1 : vol) }); } catch (e) { /* звук не обязателен */ }
    },
    music(kind) {
        if (typeof Sound === 'undefined') return;
        try {
            if (kind === 'arena') Sound.music('assets/sounds/music-arena.ogg');
            else if (kind === 'boss') Sound.music('assets/sounds/music-boss.ogg');
            else Sound.music('assets/sounds/music-lobby.ogg');
        } catch (e) { /* без музыки */ }
    },
};
