// GameAttacks.js — автоатаки героя на арене. Каждая открытая атака (GS.attacks()) стреляет сама по своей
// перезарядке, если рядом есть цель. Урон = GS.damage() × mult атаки (крит 12% — ×2). Буст speed2 — КД вдвое.
// Вид: хлысты слизи (SlimeBody.whip), модели assets/models/slime/fx_*.glb (нет файла — простая форма), частицы GameFx.

const ATTACK_MODELS = {
    drop: 'assets/models/slime/fx_goo_drop.glb', gspike: 'assets/models/slime/fx_ground_spike.glb',
    ice: 'assets/models/slime/fx_ice_spike.glb', meteor: 'assets/models/slime/fx_meteor.glb', puddle: 'assets/models/slime/fx_puddle.glb',
};

/** @satisfies {Record<string, any>} */
const Attacks = {
    /** @type {Record<string, number>} */ cd: {},
    /** @type {any[]} */ fx: [],
    /** @type {Record<string, any>} */ src: {},
    /** @type {Record<string, BABYLON.Mesh | null>} */ protos: {},
    /** @type {LoryApp | null} */ app: null,
    /** @type {Record<string, BABYLON.StandardMaterial>} */ mats: {},
    /** Пул мешей эффектов по ключу модель|материал. @type {Record<string, any[]>} */ pool: {},

    async init(app) {
        this.app = app;
        await Promise.all(Object.keys(ATTACK_MODELS).map(async (k) => {
            if (this.src[k] !== undefined) return;
            try { this.src[k] = await Model3D.load(ATTACK_MODELS[k]); } catch (e) { this.src[k] = null; }
        }));
    },

    /** Новая карта: прототипы мешей в новой сцене. */
    onMap() {
        // пул и материалы прошлой карты (сцена общая на все карты — иначе копились бы)
        for (const k of Object.keys(this.pool || {})) for (const r of this.pool[k]) this.disposeMesh(r);
        this.pool = {};
        for (const k of Object.keys(this.mats || {})) { try { this.mats[k].dispose(); } catch (e) { /* */ } }
        this.fx = []; this.protos = {}; this.mats = {};
        this.cd = {};
        const scene = this.app.location.view.scene;
        const mk = (name, hex, emis) => {
            const m = new BABYLON.StandardMaterial('atk-' + name, scene);
            m.diffuseColor = BABYLON.Color3.FromHexString(hex);
            if (emis) { m.emissiveColor = BABYLON.Color3.FromHexString(emis); }
            m.specularColor = new BABYLON.Color3(0.8, 0.8, 0.9); m.specularPower = 48;
            this.mats[name] = m;
            return m;
        };
        // чёрная глянцевая слизь с цветной каймой (fresnel): цвет каймы — свечение эволюции или цвет атаки
        const rimMat = (name, rim) => {
            const m = mk(name, '#0d0d14', '#ffffff');
            m.emissiveFresnelParameters = new BABYLON.FresnelParameters();
            m.emissiveFresnelParameters.leftColor = BABYLON.Color3.FromHexString(rim);
            m.emissiveFresnelParameters.rightColor = BABYLON.Color3.Black();
            m.emissiveFresnelParameters.power = 1.8;
            return m;
        };
        rimMat('goo', GD.EVOLUTIONS[GS.evo].glow); rimMat('spit', '#7dff4d'); rimMat('spikes', '#ff3b4d'); rimMat('rock', '#ffd23c');
        mk('ice', '#bdf3ff', '#5a9ab8'); mk('toxic', '#3a6a10', '#6aaa10');
        const hole = mk('hole', '#000000', '#000000'); hole.specularColor = new BABYLON.Color3(0.6, 0.3, 1);
        hole.emissiveFresnelParameters = new BABYLON.FresnelParameters();
        hole.emissiveFresnelParameters.leftColor = BABYLON.Color3.FromHexString('#b05cff'); hole.emissiveFresnelParameters.rightColor = BABYLON.Color3.Black();
        hole.emissiveFresnelParameters.power = 1.6;
    },

    /** Меш эффекта из модели key (свои материалы, кроме Glow) или запасная форма. */
    mesh(key, fallback, matName) {
        const pk = key + '|' + (matName || '');
        const free = this.pool[pk];
        if (free && free.length) {
            const r = free.pop();
            r.setEnabled(true);
            r.position.set(0, 0, 0); r.rotation.set(0, 0, 0); r.scaling.set(1, 1, 1); r.rotationQuaternion = null; r.visibility = 1;
            return r;
        }
        const scene = this.app.location.view.scene;
        const src = this.src[key];
        let root;
        if (src) {
            root = Model3D.build(src, scene, { name: 'atk-' + key });
            for (const ch of root.getChildMeshes(true)) {
                const part = String((ch.metadata && ch.metadata.part) || '').toLowerCase();
                if (!part.startsWith('glow') && matName && key !== 'ice') {
                    const old = ch.material; ch.material = this.mats[matName]; if (old) old.dispose(false, true);
                    ch.useVertexColors = false;
                } else if (part.startsWith('glow')) {
                    const m = /** @type {BABYLON.StandardMaterial} */ (ch.material);
                    if (m) { m.emissiveColor = BABYLON.Color3.FromHexString(GD.EVOLUTIONS[GS.evo].glow); m.disableLighting = true; }
                }
                ch.isPickable = false;
            }
        } else {
            root = fallback(scene);
            if (matName) root.material = this.mats[matName];
            root.isPickable = false;
        }
        World3D.addObject(this.app.location.view, root, 'prop', { castShadow: false });
        root.metadata = Object.assign({}, root.metadata, { poolKey: pk });
        return root;
    },

    /** Меш эффекта отработал — в пул (выключен), лишнее сверх 40 на ключ — удалить. */
    killMesh(m) {
        if (!m) return;
        const pk = m.metadata && m.metadata.poolKey;
        if (!pk) { World3D.removeObject(this.app.location.view, m); return; }
        m.setEnabled(false);
        const list = this.pool[pk] || (this.pool[pk] = []);
        list.push(m);
        if (list.length > 40) this.disposeMesh(list.shift());
    },

    /** Удалить меш вместе со СВОИМИ материалами (общие this.mats остаются). */
    disposeMesh(m) {
        if (!m) return;
        const shared = new Set(Object.values(this.mats || {}));
        const own = new Set();
        for (const ch of [m].concat(m.getChildMeshes(false))) if (ch.material && !shared.has(ch.material)) own.add(ch.material);
        try { World3D.removeObject(this.app.location.view, m); } catch (e) { /* */ }
        for (const mt of own) { try { mt.dispose(false, true); } catch (e) { /* */ } }
    },

    dmg(mult) {
        const crit = Math.random() < 0.12;
        return { v: GS.damage() * mult * (crit ? 2 : 1), crit };
    },

    hit(m, mult, opts) {
        const d = this.dmg(mult);
        Mobs.hit(m, d.v, Object.assign({ crit: d.crit }, opts || {}));
    },

    // ---- кадр -------------------------------------------------------------------------------------
    update(dt, active) {
        // эффекты в полёте живут всегда (до конца раунда)
        for (let i = this.fx.length - 1; i >= 0; i--) {
            const e = this.fx[i];
            e.t += dt;
            if (e.step(dt, e) === false) { if (e.end) e.end(e); this.fx.splice(i, 1); }
        }
        if (!active || !Hero.alive) return;
        const speed = GS.boostLeft('speed2') > 0 ? 2 : 1;
        for (const id of GS.attacks()) {
            const def = GD.ATTACKS[id];
            this.cd[id] = (this.cd[id] == null ? Math.random() * 0.4 : this.cd[id]) - dt * speed;
            if (this.cd[id] > 0) continue;
            const ok = this.fire(id, def);
            this.cd[id] = ok ? def.cd : 0.15;
        }
    },

    fire(id, def) {
        const x = Hero.x, y = Hero.y;
        const near = Mobs.nearest(x, y, def.range * Math.max(1, Hero.growthNow * 0.9));
        if (!near) return false;
        const f = this['fire_' + id];
        if (!f) return false;
        f.call(this, def, near);
        return true;
    },

    // ---- атаки --------------------------------------------------------------------------------------
    fire_lash(def, target) {
        const slime = Hero.slime;
        const to = new BABYLON.Vector3(target.x, target.h + 110 * target.def.scale, target.y);
        const strike = () => { this.hit(target, def.mult, { knock: 260 }); GameFx.impact(target.x, target.y, target.h + 110 * target.def.scale, '#4de8ff', 1); };
        // замах: голубая искра у героя
        GameFx.impact(Hero.x, Hero.y, Hero.h + 120 * Hero.growthNow, '#4de8ff', 0.4);
        if (!slime || !slime.whip(to, strike, { dur: 0.3, thick: 2 })) strike();
        GameSfx.play('whip');
    },

    fire_spit(def) {
        const ts = Mobs.targets(Hero.x, Hero.y, def.range, def.targets);
        ts.forEach((m, i) => {
            const from = Hero.slime ? Hero.slime.point(Hero.slime.cov.head ? 'Head' : 'UpperTorso') : new BABYLON.Vector3(Hero.x, Hero.h + 160, Hero.y);
            const mesh = this.mesh('drop', (sc) => BABYLON.MeshBuilder.CreateSphere('spit', { diameter: 20, segments: 8 }, sc), 'spit');
            if (i === 0) GameFx.impact(from.x, from.z, from.y, '#7dff4d', 0.5);
            const trail = GameFx.play('spit-trail', from.x, from.z, from.y);
            const s = { x0: from.x, y0: from.z, h0: from.y };
            this.fx.push({
                t: -i * 0.07, dur: 0.38, mesh, trail, step: (dt, e) => {
                    if (e.t < 0) { mesh.setEnabled(false); return true; }
                    mesh.setEnabled(true);
                    const k = Math.min(1, e.t / e.dur);
                    const tx = m.x, ty = m.y, th = m.h + 100 * m.def.scale;
                    const px = s.x0 + (tx - s.x0) * k, py = s.y0 + (ty - s.y0) * k, ph = s.h0 + (th - s.h0) * k + Math.sin(k * Math.PI) * 120;
                    mesh.position.set(px, ph, py);
                    mesh.rotation.y = Math.atan2(-(ty - s.y0), tx - s.x0);
                    if (trail) trail.setPosition(mesh.position);
                    if (k >= 1) { this.hit(m, def.mult, { knock: 120 }); GameFx.play('goo-splash', px, py, ph, { rim: '#7dff4d', k: 0.8 }); GameFx.impact(px, py, ph, '#7dff4d', 0.7); return false; }
                    return true;
                }, end: (e) => { this.killMesh(e.mesh); if (e.trail) e.trail.stop(); },
            });
        });
        GameSfx.play('spit');
    },

    fire_spikes(def) {
        const x = Hero.x, y = Hero.y, h = Hero.h, R = def.radius * Math.max(1, Hero.growthNow * 0.9);
        const n = 12;
        for (let i = 0; i < n; i++) {
            const a = i / n * Math.PI * 2 + Math.random() * 0.2, r = (i % 2 ? 0.55 : 0.92) * R;
            const sx = x + Math.cos(a) * r, sy = y + Math.sin(a) * r;
            const mesh = this.mesh('gspike', (sc) => BABYLON.MeshBuilder.CreateCylinder('spike', { height: 60, diameterTop: 0, diameterBottom: 26, tessellation: 7 }, sc), 'spikes');
            const s0 = 0.9 + Math.random() * 0.6;
            const tilt = (Math.random() - 0.5) * 0.5;
            this.fx.push({
                t: -0.08 - i * 0.02, mesh, step: (dt, e) => {
                    const k = e.t / 0.65;
                    if (k < 0) { mesh.setEnabled(false); return true; }
                    mesh.setEnabled(true);
                    const up = k < 0.2 ? k / 0.2 : k < 0.65 ? 1 : 1 - (k - 0.65) / 0.35;
                    mesh.position.set(sx, Nav.height(sx, sy) - 10 + (1 - up) * -50, sy);
                    mesh.scaling.set(s0, s0 * Math.max(0.01, up) * 1.3, s0);
                    mesh.rotation.set(tilt, a, tilt * 0.5);
                    return k < 1;
                }, end: (e) => this.killMesh(e.mesh),
            });
        }
        // кольцо-предупреждение растёт к краю, трещины и красные искры
        GameFx.ring(x, y, h, R, '#ff3b4d', 0.4, { fill: true });
        GameFx.decal({ tex: 'crack', x, y, h, r0: R * 0.5, r1: R * 0.95, life: 0.9, color: '#ff3b4d', a: 0.9, ease: 'out', fade: [0.05, 0.6] });
        GameFx.shot([GameFx.glowL('assets/fx/star4.webp', '#ffffff', { burst: 22, capacity: 24, life: [0.4, 0.8], size: [16, 30], speed: [200, 480], color2: '#ff3b4d', direction: [[-1, 0.5, -1], [1, 1.8, 1]], gravity: [0, -500, 0], sizeGradient: [[0, 1], [1, 0]] })], x, y, h + 20);
        GameFx.play('ground-burst', x, y, h);
        for (const m of Mobs.inRadius(x, y, R)) { this.hit(m, def.mult, { knock: 220 }); GameFx.impact(m.x, m.y, m.h + 60 * m.def.scale, '#ff3b4d', 0.8); }
        if (this.app.camera.shake) this.app.camera.shake(160, 0.01);
        GameSfx.play('spikes');
    },

    fire_slam(def) {
        const x = Hero.x, y = Hero.y, R = def.radius * Math.max(1, Hero.growthNow * 0.9);
        if (Hero.slime) Hero.slime.bounce(2.2);
        // замах: оранжевое кольцо сжимается к герою
        GameFx.decal({ tex: 'rthin', x, y, h: Hero.h, r0: R, r1: R * 0.25, life: 0.22, color: '#ff9a2e', ease: 'in', fade: [0.1, 0.1] });
        GameFx.decal({ tex: 'disc', x, y, h: Hero.h, r0: R, r1: R * 0.25, life: 0.22, color: '#ff9a2e', a: 0.35, ease: 'in', fade: [0.1, 0.1] });
        this.fx.push({
            t: 0, step: (dt, e) => {
                if (e.t < 0.22) return true;
                GameFx.play('shock', Hero.x, Hero.y, Hero.h + 6, { color: '#ff9a2e', r: R });
                GameFx.decal({ tex: 'crack', x: Hero.x, y: Hero.y, h: Hero.h, r0: R * 0.5, r1: R * 0.8, life: 1.0, color: '#ff9a2e', a: 0.9, ease: 'out', fade: [0.05, 0.6] });
                GameFx.play('goo-splash', Hero.x, Hero.y, Hero.h + 20, { rim: '#ff9a2e', k: 1.4 });
                for (const m of Mobs.inRadius(Hero.x, Hero.y, R)) { this.hit(m, def.mult, { knock: 520 }); GameFx.impact(m.x, m.y, m.h + 60 * m.def.scale, '#ff9a2e', 1); }
                if (this.app.camera.shake) this.app.camera.shake(300, 0.025);
                GameSfx.play('slam');
                return false;
            },
        });
        void x; void y;
    },

    fire_storm(def) {
        const ts = Mobs.targets(Hero.x, Hero.y, def.range, def.targets);
        GameFx.impact(Hero.x, Hero.y, Hero.h + 140 * Hero.growthNow, '#b05cff', 0.9);
        ts.forEach((m, i) => {
            this.fx.push({
                t: -i * 0.06, step: (dt, e) => {
                    if (e.t < 0) return true;
                    const to = new BABYLON.Vector3(m.x, m.h + 100 * m.def.scale, m.y);
                    const strike = () => { this.hit(m, def.mult, { knock: 200 }); GameFx.impact(m.x, m.y, m.h + 100 * m.def.scale, '#b05cff', 1); };
                    if (!Hero.slime || !Hero.slime.whip(to, strike, { from: 'back', side: i % 2 ? 1 : -1, dur: 0.32, thick: 1.8 })) strike();
                    return false;
                },
            });
        });
        GameSfx.play('whip');
    },

    fire_toxic(def) {
        const ts = Mobs.targets(Hero.x, Hero.y, def.range, def.targets);
        for (const m of ts) {
            const px = m.x, py = m.y, ph = Nav.height(px, py);
            const mesh = this.mesh('puddle', (sc) => BABYLON.MeshBuilder.CreateDisc('pud', { radius: 60, tessellation: 24 }, sc), 'toxic');
            if (!this.src.puddle) mesh.rotation.x = Math.PI / 2;
            mesh.position.set(px, ph + 2, py);
            const sc = def.radius / 60;
            const dur = def.ticks * 0.5;
            GameFx.play('toxic', px, py, ph, { r: def.radius, life: dur });
            GameFx.decal({ tex: 'disc', x: px, y: py, h: ph, r0: def.radius * 0.3, r1: def.radius, life: dur, color: '#c8ff1e', a: 0.4, ease: 'out', fade: [0.08, 0.2] });
            GameFx.decal({ tex: 'rthin', x: px, y: py, h: ph + 1, r0: def.radius * 0.3, r1: def.radius, life: dur, color: '#e6ff7a', a: 0.9, ease: 'out', fade: [0.08, 0.2] });
            let tick = 0;
            this.fx.push({
                t: 0, mesh, step: (dt, e) => {
                    const g = Math.min(1, e.t / 0.25) * (e.t > def.ticks * 0.5 - 0.3 ? Math.max(0, 1 - (e.t - (def.ticks * 0.5 - 0.3)) / 0.3) : 1);
                    mesh.scaling.set(sc * g, 1, sc * g);
                    if (e.t >= tick * 0.5) {
                        tick++;
                        GameFx.decal({ tex: 'rthin', x: px, y: py, h: ph + 2, r0: def.radius * 0.3, r1: def.radius * 0.95, life: 0.35, color: '#c8ff1e', a: 0.55, ease: 'out' });
                        for (const mm of Mobs.inRadius(px, py, def.radius)) this.hit(mm, def.mult, { slow: 0.6, quiet: true, noStagger: true });
                    }
                    return tick < def.ticks || e.t < def.ticks * 0.5;
                }, end: (e) => this.killMesh(e.mesh),
            });
        }
        GameSfx.play('toxic');
    },

    fire_nova(def) {
        const x = Hero.x, y = Hero.y, h = Hero.h, R = def.radius * Math.max(1, Hero.growthNow * 0.9);
        GameFx.play('nova', x, y, h + 30, { r: R });
        if (Hero.slime) Hero.slime.bounce(1.2);
        const done = new Set();
        this.fx.push({
            t: 0, step: (dt, e) => {
                const r = Math.min(1, e.t / 0.5) * R;
                for (const m of Mobs.inRadius(x, y, r)) {
                    if (done.has(m)) continue;
                    done.add(m);
                    this.hit(m, def.mult, { knock: 300, fromX: x, fromY: y });
                    GameFx.play('burn', m.x, m.y, m.h + 40);
                    GameFx.impact(m.x, m.y, m.h + 60 * m.def.scale, '#ff5a1e', 0.9);
                }
                return e.t < 0.5;
            },
        });
        if (this.app.camera.shake) this.app.camera.shake(220, 0.015);
        GameSfx.play('nova');
    },

    fire_frost(def) {
        const x = Hero.x, y = Hero.y, R = def.radius * Math.max(1, Hero.growthNow * 0.9);
        GameFx.play('frost', x, y, Hero.h + 20, { r: R });
        const n = 14;
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * R;
            const sx = x + Math.cos(a) * r, sy = y + Math.sin(a) * r;
            const mesh = this.mesh('ice', (sc) => BABYLON.MeshBuilder.CreateCylinder('ice', { height: 80, diameterTop: 0, diameterBottom: 34, tessellation: 6 }, sc), 'ice');
            const s0 = 0.8 + Math.random() * 0.8, rot = Math.random() * 6.28;
            this.fx.push({
                t: -Math.random() * 0.2, mesh, step: (dt, e) => {
                    const k = e.t / 1.1;
                    if (k < 0) { mesh.setEnabled(false); return true; }
                    mesh.setEnabled(true);
                    const up = k < 0.12 ? k / 0.12 : k < 0.75 ? 1 : 1 - (k - 0.75) / 0.25;
                    mesh.position.set(sx, Nav.height(sx, sy) - 6, sy);
                    mesh.scaling.set(s0 * Math.max(0.05, up), s0 * Math.max(0.01, up), s0 * Math.max(0.05, up));
                    mesh.rotation.y = rot;
                    return k < 1;
                }, end: (e) => this.killMesh(e.mesh),
            });
        }
        for (const m of Mobs.inRadius(x, y, R)) { this.hit(m, def.mult, { slow: 3, knock: 80 }); GameFx.impact(m.x, m.y, m.h + 60 * m.def.scale, '#7fd8ff', 0.8); }
        GameSfx.play('frost');
    },

    fire_hole(def, near) {
        // центр — там, где больше врагов (из нескольких кандидатов)
        let best = near, bestN = 0;
        for (const c of Mobs.targets(Hero.x, Hero.y, def.range, 6)) {
            const n = Mobs.inRadius(c.x, c.y, 250).length;
            if (n > bestN) { bestN = n; best = c; }
        }
        const cx = best.x, cy = best.y, ch = Nav.height(cx, cy) + 90;
        const sphere = this.mesh('hole-core', (sc) => BABYLON.MeshBuilder.CreateSphere('hole', { diameter: 1, segments: 16 }, sc), 'hole');
        sphere.position.set(cx, ch, cy);
        GameFx.play('hole', cx, cy, ch - 60);
        const gh = ch - 90, life0 = def.ticks * 0.5, HR = def.radius * 0.75;
        // воронка на земле: тёмный диск, вращающиеся спирали, кольцо радиуса затягивания
        GameFx.decal({ tex: 'disc', x: cx, y: cy, h: gh, r0: HR * 0.2, r1: HR, life: life0, color: '#12002a', a: 0.7, ease: 'out', add: false, fade: [0.08, 0.1] });
        GameFx.decal({ tex: 'swirl', x: cx, y: cy, h: gh + 1, r0: HR * 0.3, r1: HR, life: life0, color: '#8a3cff', a: 0.9, spin: 3.5, ease: 'out', fade: [0.08, 0.1] });
        GameFx.decal({ tex: 'swirl', x: cx, y: cy, h: gh + 2, r0: HR * 0.2, r1: HR * 0.6, life: life0, color: '#e0c0ff', a: 0.7, spin: -5, ease: 'out', fade: [0.08, 0.1] });
        GameFx.decal({ tex: 'rthin', x: cx, y: cy, h: gh + 3, r0: HR * 0.3, r1: HR, life: life0, color: '#b05cff', a: 0.8, ease: 'out', fade: [0.08, 0.1] });
        let tick = 0;
        this.fx.push({
            t: 0, mesh: sphere, step: (dt, e) => {
                const life = def.ticks * 0.5;
                const g = Math.min(1, e.t / 0.3) * (e.t > life - 0.3 ? Math.max(0, (life - e.t) / 0.3) : 1);
                const d = 150 * g * (1 + 0.08 * Math.sin(e.t * 20));
                sphere.scaling.set(d, d, d);
                for (const m of Mobs.inRadius(cx, cy, def.radius)) m.pull = { x: cx, y: cy, k: 420, t: 0.2 };
                if (g > 0.3) GameFx.suck(cx, cy, ch, HR * (0.6 + 0.4 * Math.random()), Math.max(1, Math.round(dt * 110)));
                if (e.t >= tick * 0.5) {
                    tick++;
                    for (const m of Mobs.inRadius(cx, cy, 200)) { this.hit(m, def.mult, { quiet: true, noStagger: true }); GameFx.impact(m.x, m.y, m.h + 60 * m.def.scale, '#8a3cff', 0.6); }
                }
                return e.t < life;
            }, end: (e) => { this.killMesh(e.mesh); GameFx.play('hole-end', cx, cy, ch - 20); },
        });
        GameSfx.play('hole');
    },

    fire_meteor(def) {
        const ts = Mobs.targets(Hero.x, Hero.y, def.range, def.targets);
        while (ts.length && ts.length < def.targets) ts.push(ts[Math.floor(Math.random() * ts.length)]);
        ts.forEach((m, i) => {
            const tx = m.x + (Math.random() - 0.5) * 80, ty = m.y + (Math.random() - 0.5) * 80, th = Nav.height(tx, ty);
            const mesh = this.mesh('meteor', (sc) => BABYLON.MeshBuilder.CreateIcoSphere('met', { radius: 30, subdivisions: 1 }, sc), 'rock');
            const tail = GameFx.play('meteor-tail', tx, ty, th + 900);
            const ox = (Math.random() - 0.5) * 500, oy = (Math.random() - 0.5) * 500;
            // метка падения: золотой круг сжимается к точке удара
            GameFx.decal({ tex: 'disc', x: tx, y: ty, h: th, r0: def.radius * 1.5, r1: def.radius * 0.7, life: 0.55, delay: i * 0.12, color: '#ffd23c', a: 0.45, ease: 'in', fade: [0.1, 0.05] });
            GameFx.decal({ tex: 'rthin', x: tx, y: ty, h: th + 1, r0: def.radius * 1.5, r1: def.radius * 0.7, life: 0.55, delay: i * 0.12, color: '#fff2a0', a: 1, ease: 'in', fade: [0.1, 0.05] });
            this.fx.push({
                t: -i * 0.12, mesh, tail, step: (dt, e) => {
                    if (e.t < 0) { mesh.setEnabled(false); return true; }
                    mesh.setEnabled(true);
                    const k = Math.min(1, e.t / 0.55);
                    const px = tx + ox * (1 - k), py = ty + oy * (1 - k), ph = th + 900 * (1 - k);
                    mesh.position.set(px, ph, py);
                    mesh.rotation.set(e.t * 6, e.t * 4, 0);
                    mesh.scaling.set(1.4, 1.4, 1.4);
                    if (tail) tail.setPosition(mesh.position);
                    if (k >= 1) {
                        GameFx.play('meteor-hit', tx, ty, th + 10, { r: def.radius });
                        for (const mm of Mobs.inRadius(tx, ty, def.radius)) this.hit(mm, def.mult, { knock: 380, fromX: tx, fromY: ty, quiet: true });
                        if (this.app.camera.shake) this.app.camera.shake(180, 0.015);
                        GameSfx.play('boom');
                        return false;
                    }
                    return true;
                }, end: (e) => { this.killMesh(e.mesh); if (e.tail) e.tail.stop(); },
            });
        });
    },

    clear() {
        for (const e of this.fx) { if (e.mesh) { try { this.killMesh(e.mesh); } catch (er) { /* */ } } if (e.trail) e.trail.dispose(); if (e.tail) e.tail.dispose(); }
        this.fx = [];
        this.cd = {};
    },
};
