// GameEnemies.js — мобы арены. Модели — блочные зомби (части torso/head/arm-*/leg-*, лицо по +Z, рост 240 px);
// движение частей процедурное (поворот вокруг pivot). ИИ: melee — идёт и бьёт; ranged — держит дистанцию и
// стреляет; charger — рывок; float — парит и колдует; boss — удар по области с предупреждающим кругом.
// Позиции — логика игры (Nav.move / Nav.height), Babylon — только вид.

class Mob {
    /** @param {string} type ключ GD.MOBS @param {any} stats { hp, dmg } @param {number} x @param {number} y @param {any} [opts] */
    constructor(type, stats, x, y, opts) {
        const o = opts || {};
        this.type = type;
        this.def = GD.MOBS[type];
        this.boss = this.def.kind === 'boss';
        this.maxHp = Math.round(stats.hp * this.def.hp * (o.elite ? 2 : 1));
        this.hp = this.maxHp;
        this.dmg = stats.dmg * this.def.dmg;
        this.slimeReward = Math.round(stats.slime * (this.boss ? 25 : 1) * this.def.hp);
        this.gems = this.boss ? 25 : stats.gems;
        this.x = x; this.y = y; this.h = 0;
        this.heading = 0;
        this.speed = this.def.speed;
        this.radius = (this.boss ? 70 : 34) * (this.def.scale / 0.85);
        this.state = 'spawn'; this.t = 0; this.stateT = 0;
        this.atkCd = 0.6 + Math.random() * 0.8;
        this.slowT = 0; this.hitT = 0; this.flash = 0;
        this.kx = 0; this.ky = 0;              // отброс
        this.pull = null;                      // { x, y, k } — чёрная дыра
        this.dead = false; this.gone = false;
        this.walkPh = Math.random() * 6.28;
        this.dashT = 0; this.dashCd = 2 + Math.random() * 2;
        this.windup = 0.35;
        this.root = null; this.pivots = {}; this.mats = [];
        this.bar = null;
        this.elite = !!o.elite;
    }

    build(view, src) {
        const scene = view.scene;
        const root = new BABYLON.Mesh('mob-' + this.type, scene);
        const body = Model3D.build(src, scene, { name: 'mob-' + this.type });
        body.parent = root;
        for (const m of body.getChildMeshes(true)) {
            const name = (m.metadata && m.metadata.part) || '';
            const piv = (m.metadata && m.metadata.pivot) || [0, 0, 0];
            const node = new BABYLON.TransformNode('piv-' + name, scene);
            node.parent = body;
            node.position.set(piv[0], piv[1], piv[2]);
            m.parent = node;
            m.position.set(-piv[0], -piv[1], -piv[2]);
            m.isPickable = false;
            this.pivots[name] = node;
            const mat = m.material;
            if (mat) for (const sm of (/** @type {any} */ (mat).subMaterials || [mat])) if (sm && !this.mats.includes(sm)) this.mats.push(sm);
        }
        const s = this.def.scale * (this.elite ? 1.15 : 1);
        body.scaling.set(s, s, s);
        this.body = body;
        World3D.addObject(view, root, 'actor');
        this.root = root;
        this.place();
        if (this.elite) for (const m of this.mats) m.emissiveColor = new BABYLON.Color3(0.25, 0.05, 0.3);
    }

    place() {
        if (!this.root) return;
        const fl = this.def.kind === 'float' ? 40 + Math.sin(this.t * 2.4) * 12 : 0;
        this.root.position.set(this.x, this.h + fl, this.y);
        this.root.rotation.y = Math.PI / 2 - this.heading;
    }

    rot(name, x, y, z) {
        const n = this.pivots[name];
        if (n) n.rotation.set(x, y || 0, z || 0);
    }

    /** Поза частей по состоянию. */
    pose(dt) {
        const st = this.state, k = this.stateT;
        const walk = (st === 'chase' || st === 'dash') ? Math.sin(this.walkPh) : 0;
        const amp = st === 'dash' ? 1.0 : 0.7;
        let armL = -walk * 0.6 * amp, armR = walk * 0.6 * amp, legL = walk * amp, legR = -walk * amp, torso = 0, head = 0;
        if (this.def.kind !== 'float' && st === 'chase') { armL -= 1.2; armR -= 1.2; }            // зомби тянут руки
        if (st === 'windup') { const a = Math.min(1, k / this.windup); armR = -2.6 * a; armL = -1.4 * a; torso = -0.25 * a; }
        if (st === 'strike') { const a = Math.min(1, k / 0.12); armR = -2.6 + 3.4 * a; armL = -1.4 + 1.8 * a; torso = 0.35 * a; }
        if (st === 'aim') { armR = -1.55; armL = -1.4; }
        if (st === 'hit') { torso = -0.4 * (1 - k / 0.18); head = -0.3; }
        if (st === 'spawn') { const a = Math.min(1, k / 0.6); this.body.position.y = -120 * (1 - a) * this.def.scale; }
        else if (st !== 'dead') this.body.position.y = 0;
        if (st === 'slam') { const a = Math.min(1, k / this.windup); armL = armR = -3 * a; torso = -0.3 * a; }
        this.rot('arm-left', armL, 0, 0); this.rot('arm-right', armR, 0, 0);
        this.rot('leg-left', legL, 0, 0); this.rot('leg-right', legR, 0, 0);
        this.rot('torso', torso, 0, 0); this.rot('head', head, Math.sin(this.t * 1.7) * 0.15, 0);
        // вспышка попадания и сжатие
        if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 6);
        const f = this.flash;
        for (const m of this.mats) m.emissiveColor = this.elite ? new BABYLON.Color3(0.25 + f, 0.05 + f, 0.3 + f) : new BABYLON.Color3(f, f, f);
        const sq = this.hitT > 0 ? Math.sin(this.hitT / 0.18 * Math.PI) * 0.12 : 0;
        const s = this.def.scale * (this.elite ? 1.15 : 1);
        this.body.scaling.set(s * (1 + sq), s * (1 - sq), s * (1 + sq));
    }
}

/** @satisfies {Record<string, any>} */
const Mobs = {
    /** @type {Mob[]} */ list: [],
    /** @type {Record<string, any>} */ src: {},
    /** @type {any[]} */ shots: [],
    /** @type {any[]} */ slams: [],
    /** @type {LoryApp | null} */ app: null,
    /** @type {HTMLElement | null} */ layer: null,
    /** @type {HTMLElement[]} */ barPool: [],
    /** @type {BABYLON.StandardMaterial | null} */ shotMat: null,
    killed: 0,
    /** Слушатели: убийство (mob). @type {(m: Mob) => void} */
    onKill: null,

    init(app) {
        this.app = app;
        if (!this.layer) {
            const el = document.createElement('div');
            el.id = 'mob-bars';
            el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:26;overflow:hidden;contain:strict';
            document.body.appendChild(el);
            this.layer = el;
            const st = document.createElement('style');
            st.textContent = `.mobbar{position:absolute;left:0;top:0;width:64px;height:9px;border-radius:6px;background:#1a0b14;border:2px solid #0a0508;
              box-shadow:0 2px 0 rgba(0,0,0,.35);overflow:hidden;will-change:transform}
              .mobbar i{display:block;height:100%;width:100%;background:linear-gradient(#ff6a6a,#d8102a);border-radius:4px;transform-origin:0 50%}
              .mobbar.elite i{background:linear-gradient(#e08aff,#8a20d8)}`;
            document.head.appendChild(st);
        }
    },

    /** Загрузить модели типов стадии (под загрузкой). */
    async preload(types) {
        await Promise.all(types.map(async (t) => {
            if (this.src[t] !== undefined) return;
            try { this.src[t] = await Model3D.load(GD.MOBS[t].model); } catch (e) { this.src[t] = null; }
        }));
    },

    spawn(type, x, y, stats, opts) {
        const view = this.app.location.view;
        const m = new Mob(type, stats, x, y, opts);
        m.h = Nav.height(x, y);
        const src = this.src[type];
        if (src) m.build(view, src);
        else {
            const box = BABYLON.MeshBuilder.CreateBox('mob-fb', { width: 60, height: 190, depth: 40 }, view.scene);
            box.position.y = 95;
            const root = new BABYLON.Mesh('mob-' + type, view.scene);
            box.parent = root;
            m.root = root; m.body = root; m.mats = [];
            World3D.addObject(view, root, 'actor');
        }
        if (!m.boss) {
            const bar = this.barPool.pop() || document.createElement('div');
            bar.className = 'mobbar' + (m.elite ? ' elite' : '');
            bar.innerHTML = '<i></i>';
            bar.style.display = '';
            this.layer.appendChild(bar);
            m.bar = bar;
        }
        this.list.push(m);
        GameFx.play('ground-burst', x, y, m.h);
        return m;
    },

    alive() { return this.list.filter((m) => !m.dead); },
    count() { let n = 0; for (const m of this.list) if (!m.dead) n++; return n; },

    nearest(x, y, range) {
        let best = null, bd = range * range;
        for (const m of this.list) {
            if (m.dead || m.state === 'spawn') continue;
            const d = (m.x - x) ** 2 + (m.y - y) ** 2;
            if (d < bd) { bd = d; best = m; }
        }
        return best;
    },
    inRadius(x, y, r) { return this.list.filter((m) => !m.dead && m.state !== 'spawn' && (m.x - x) ** 2 + (m.y - y) ** 2 <= (r + m.radius) ** 2); },
    /** До n целей в радиусе, ближайшие первыми. */
    targets(x, y, range, n) {
        return this.inRadius(x, y, range).sort((a, b) => ((a.x - x) ** 2 + (a.y - y) ** 2) - ((b.x - x) ** 2 + (b.y - y) ** 2)).slice(0, n);
    },

    /** Урон мобу. crit — крупная цифра. */
    hit(m, dmg, opts) {
        if (!m || m.dead) return;
        const o = opts || {};
        dmg = Math.max(1, Math.round(dmg));
        m.hp -= dmg;
        m.flash = 0.9; m.hitT = 0.18;
        if (o.knock) {
            const dx = m.x - (o.fromX != null ? o.fromX : Hero.x), dy = m.y - (o.fromY != null ? o.fromY : Hero.y), L = Math.hypot(dx, dy) || 1;
            const k = m.boss ? o.knock * 0.15 : o.knock;
            m.kx += dx / L * k; m.ky += dy / L * k;
        }
        if (o.slow) m.slowT = Math.max(m.slowT, o.slow);
        if (!m.boss && m.state !== 'windup' && m.state !== 'slam' && !o.noStagger) { m.state = 'hit'; m.stateT = 0; }
        GameFx.pop(fmtNum(dmg), m.x, m.y, m.h + 210 * m.def.scale, o.crit ? 'crit' : 'dmg', { size: o.crit ? 30 : 24, spread: 50 });
        if (!o.quiet) GameSfx.play('hit');
        if (m.hp <= 0) this.kill(m);
    },

    kill(m) {
        m.dead = true; m.hp = 0;
        m.state = 'dead'; m.stateT = 0;
        if (m.bar) { m.bar.style.display = 'none'; this.barPool.push(m.bar); m.bar = null; }
        this.killed++;
        GameFx.play('die', m.x, m.y, m.h + 80);
        GameSfx.play('kill');
        if (this.onKill) this.onKill(m);
    },

    /** Снаряд моба к герою. */
    shoot(m) {
        const scene = this.app.location.view.scene;
        if (!this.shotMat) {
            this.shotMat = new BABYLON.StandardMaterial('mob-shot', scene);
            this.shotMat.disableLighting = true;
            this.shotMat.emissiveColor = BABYLON.Color3.FromHexString('#7dff4d');
        }
        const ball = BABYLON.MeshBuilder.CreateSphere('mob-shot', { diameter: m.def.kind === 'float' ? 30 : 22, segments: 8 }, scene);
        ball.material = this.shotMat;
        ball.isPickable = false;
        const dx = Hero.x - m.x, dy = Hero.y - m.y, L = Math.hypot(dx, dy) || 1;
        const sp = 520;
        this.shots.push({ mesh: ball, x: m.x + dx / L * 40, y: m.y + dy / L * 40, h: m.h + 130 * m.def.scale, vx: dx / L * sp, vy: dy / L * sp, t: 0, dmg: m.dmg, from: m });
        GameSfx.play('shoot');
    },

    updateShots(dt) {
        for (let i = this.shots.length - 1; i >= 0; i--) {
            const s = this.shots[i];
            s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt;
            s.mesh.position.set(s.x, s.h, s.y);
            GameFx.shotTrail(s.x, s.y, s.h);
            const d = Math.hypot(Hero.x - s.x, Hero.y - s.y);
            let done = s.t > 2.2 || Nav.blocked(s.x, s.y, 4);
            if (!done && d < Hero.radius + 14 && Hero.alive) { Hero.damage(s.dmg, s.x, s.y); done = true; GameFx.play('hit', s.x, s.y, s.h); }
            if (done) { s.mesh.dispose(); this.shots.splice(i, 1); }
        }
    },

    updateSlams(dt) {
        for (let i = this.slams.length - 1; i >= 0; i--) {
            const s = this.slams[i];
            s.t += dt;
            const k = s.t / s.dur;
            s.tg.set(Math.min(1, k));
            if (k >= 1) {
                if (Math.hypot(Hero.x - s.x, Hero.y - s.y) < s.r + Hero.radius * 0.5) Hero.damage(s.dmg, s.x, s.y);
                GameFx.play('shock', s.x, s.y, s.h + 10);
                if (this.app.camera.shake) this.app.camera.shake(260, 0.02);
                GameSfx.play('slam');
                s.tg.dispose();
                this.slams.splice(i, 1);
            }
        }
    },

    /** Удар босса по области: красный круг, через dur — урон. */
    telegraph(x, y, h, r, dur, dmg) {
        const tg = GameFx.telegraph(x, y, h + 3, r, '#ff2a3a');
        this.slams.push({ tg, x, y, h, r, dur, dmg, t: 0 });
    },

    update(dt) {
        const hx = Hero.x, hy = Hero.y;
        const list = this.list;
        for (const m of list) {
            m.t += dt; m.stateT += dt;
            if (m.state === 'dead') {
                // падение назад и уход в лужу
                const k = m.stateT;
                if (m.body) {
                    const fall = Math.min(1, k / 0.35);
                    m.body.rotation.x = -fall * 1.45;
                    const sink = Math.max(0, (k - 0.6) / 0.6);
                    const s = m.def.scale * (1 - sink * 0.9);
                    m.body.scaling.set(s, s * (1 - sink * 0.5), s);
                    m.body.position.y = -sink * 30;
                }
                if (k > 1.2) m.gone = true;
                continue;
            }
            if (m.slowT > 0) m.slowT -= dt;
            if (m.hitT > 0) m.hitT -= dt;
            m.atkCd -= dt; m.dashCd -= dt;
            const dx = hx - m.x, dy = hy - m.y, dist = Math.hypot(dx, dy) || 1;
            const reach = m.radius + Hero.radius + (m.boss ? 40 : 26);
            let vx = 0, vy = 0;
            const spd = m.speed * (m.slowT > 0 ? 0.55 : 1) * (Hero.alive ? 1 : 0.4);
            if (m.state === 'spawn') { if (m.stateT > 0.6) { m.state = 'chase'; m.stateT = 0; } }
            else if (m.state === 'hit') { if (m.stateT > 0.18) { m.state = 'chase'; m.stateT = 0; } }
            else if (m.state === 'windup') {
                if (m.stateT >= m.windup) {
                    m.state = 'strike'; m.stateT = 0;
                    if (Hero.alive && dist < reach + 30) Hero.damage(m.dmg, m.x, m.y);
                    GameSfx.play('swing');
                }
            } else if (m.state === 'strike') { if (m.stateT > 0.3) { m.state = 'chase'; m.stateT = 0; } }
            else if (m.state === 'aim') {
                if (m.stateT > 0.45) { this.shoot(m); m.state = 'chase'; m.stateT = 0; m.atkCd = 1.8 + Math.random(); }
            } else if (m.state === 'slam') {
                if (m.stateT >= m.windup) { m.state = 'strike'; m.stateT = 0; }
            } else if (m.state === 'dash') {
                vx = dx / dist * spd * 2.6; vy = dy / dist * spd * 2.6;
                if (m.stateT > 0.55 || dist < reach) { m.state = 'chase'; m.stateT = 0; }
                if (dist < reach && Hero.alive && m.atkCd <= 0) { Hero.damage(m.dmg * 1.2, m.x, m.y); m.atkCd = 1.2; }
            } else { // chase
                const kind = m.def.kind;
                if (kind === 'ranged' || kind === 'float') {
                    const want = kind === 'float' ? 420 : 520;
                    if (dist > want + 80) { vx = dx / dist * spd; vy = dy / dist * spd; }
                    else if (dist < want - 160) { vx = -dx / dist * spd * 0.7; vy = -dy / dist * spd * 0.7; }
                    else { vx = -dy / dist * spd * 0.35; vy = dx / dist * spd * 0.35; }
                    if (m.atkCd <= 0 && dist < 900 && Hero.alive) { m.state = 'aim'; m.stateT = 0; }
                } else {
                    if (dist > reach) { vx = dx / dist * spd; vy = dy / dist * spd; }
                    if (kind === 'charger' && m.dashCd <= 0 && dist < 650 && dist > 200) { m.state = 'dash'; m.stateT = 0; m.dashCd = 3 + Math.random() * 2; GameSfx.play('dash'); }
                    else if (m.boss && m.atkCd <= 0 && dist < 520) {
                        m.state = 'slam'; m.stateT = 0; m.windup = 1.0; m.atkCd = 3.6;
                        this.telegraph(m.x, m.y, m.h, 330 * (m.def.scale / 1.9), 1.0, m.dmg * 1.6);
                    } else if (dist <= reach && m.atkCd <= 0 && Hero.alive) {
                        m.state = 'windup'; m.stateT = 0; m.windup = m.boss ? 0.5 : 0.35; m.atkCd = m.boss ? 1.4 : 1.1;
                    }
                }
            }
            if (Math.abs(vx) + Math.abs(vy) > 1) m.heading = Math.atan2(vy, vx);
            else if (m.state !== 'dead') m.heading = Math.atan2(dy, dx);
            // чёрная дыра
            if (m.pull) {
                const px = m.pull.x - m.x, py = m.pull.y - m.y, pl = Math.hypot(px, py) || 1;
                if (pl > 30) { vx += px / pl * m.pull.k * (m.boss ? 0.2 : 1); vy += py / pl * m.pull.k * (m.boss ? 0.2 : 1); }
                m.pull.t -= dt;
                if (m.pull.t <= 0) m.pull = null;
            }
            vx += m.kx; vy += m.ky;
            m.kx *= Math.pow(0.02, dt); m.ky *= Math.pow(0.02, dt);
            if (Math.abs(m.kx) < 5) m.kx = 0;
            if (Math.abs(m.ky) < 5) m.ky = 0;
            const r = Math.min(40, m.radius);
            const p = Nav.move(m.x, m.y, vx * dt, vy * dt, r);
            m.x = p.x; m.y = p.y;
            m.h = Nav.height(m.x, m.y);
            if (Math.abs(vx) + Math.abs(vy) > 1) m.walkPh += dt * (m.state === 'dash' ? 16 : 8) * (spd / 180);
        }
        // расталкивание
        for (let i = 0; i < list.length; i++) {
            const a = list[i];
            if (a.dead) continue;
            for (let j = i + 1; j < list.length; j++) {
                const b = list[j];
                if (b.dead) continue;
                const dx = b.x - a.x, dy = b.y - a.y, rr = a.radius + b.radius;
                const d2 = dx * dx + dy * dy;
                if (d2 < rr * rr && d2 > 0.01) {
                    const d = Math.sqrt(d2), push = (rr - d) * 0.5 / d;
                    const wa = a.boss ? 0.1 : 1, wb = b.boss ? 0.1 : 1;
                    a.x -= dx * push * wa; a.y -= dy * push * wa;
                    b.x += dx * push * wb; b.y += dy * push * wb;
                }
            }
            // не залезать в героя
            const hx2 = a.x - hx, hy2 = a.y - hy, hr = a.radius + Hero.radius * 0.8, hd = Math.hypot(hx2, hy2);
            if (hd < hr && hd > 0.01 && Hero.alive) { a.x = hx + hx2 / hd * hr; a.y = hy + hy2 / hd * hr; }
        }
        for (const m of list) { if (m.root) { m.place(); if (m.body) m.pose(dt); } }
        this.updateShots(dt);
        this.updateSlams(dt);
        // удалить ушедших
        for (let i = list.length - 1; i >= 0; i--) {
            const m = list[i];
            if (m.gone) { if (m.root) World3D.removeObject(this.app.location.view, m.root); for (const mt of m.mats) mt.dispose(); list.splice(i, 1); }
        }
        this.updateBars();
    },

    updateBars() {
        const view = this.app.location.view;
        const obs = typeof GameHud !== 'undefined' && GameHud.obstacles ? GameHud.obstacles() : [];
        for (const m of this.list) {
            if (!m.bar) continue;
            const s = view.projectToScreen(m.x, m.y, m.h + 250 * m.def.scale + 10);
            if (!s || !s.visible || s.behind || m.state === 'spawn') { m.bar.style.opacity = '0'; continue; }
            // под панелью интерфейса полоску не рисуем
            const under = obs.some((r) => s.x + 32 > r.x0 && s.x - 32 < r.x1 && s.y + 10 > r.y0 && s.y < r.y1);
            m.bar.style.opacity = under ? '0' : '1';
            m.bar.style.transform = `translate(${(s.x - 32).toFixed(1)}px,${s.y.toFixed(1)}px)`;
            /** @type {HTMLElement} */ (m.bar.firstChild).style.transform = `scaleX(${Math.max(0, m.hp / m.maxHp).toFixed(3)})`;
        }
    },

    clear() {
        const view = this.app && this.app.location ? this.app.location.view : null;
        for (const m of this.list) {
            if (m.root && view) { try { World3D.removeObject(view, m.root); } catch (e) { /* сцена уже ушла */ } }
            for (const mt of m.mats) { try { mt.dispose(); } catch (e) { /* */ } }
            if (m.bar) { m.bar.style.display = 'none'; this.barPool.push(m.bar); }
        }
        for (const s of this.shots) { try { s.mesh.dispose(); } catch (e) { /* */ } }
        for (const s of this.slams) { try { s.tg.dispose(); } catch (e) { /* */ } }
        this.list = []; this.shots = []; this.slams = [];
        if (this.shotMat) { try { this.shotMat.dispose(); } catch (e) { /* */ } this.shotMat = null; }
    },
};
