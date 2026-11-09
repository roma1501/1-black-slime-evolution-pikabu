// GameSlime.js — живая чёрная слизь на теле героя (HumanoidModel): куски по уровню (GD.coverage), голова по
// эволюции, цвет и глаза — косметика. «Физика слизи» на CPU:
//   • желе: каждый кусок держит пружину смещения в мире; когда часть тела дёргается, слизь запаздывает, вершины
//     смещаются тем сильнее, чем дальше от точки крепления (анкер), + покачивание по нормали;
//   • сжатие-растяжение куска (bounce): пружина масштаба — отскок при +N, приземлении, ударе;
//   • рост куска: появление с перелётом масштаба (0 → 1.18 → 1) и брызгами;
//   • щупальца на спине — цепочки Верле, хлысты атак — процедурная кривая «выброс — возврат».
// Модели — assets/models/slime/*.glb (части Goo/Glow/Teeth/Mouth); нет файла — запасная капля из сфер.

const SLIME_MODELS = {
    head0: 'assets/models/slime/head_t0.glb', head1: 'assets/models/slime/head_t1.glb', head2: 'assets/models/slime/head_t2.glb',
    head3: 'assets/models/slime/head_t3.glb', head4: 'assets/models/slime/head_t4.glb', buddy: 'assets/models/slime/buddy.glb',
    torso_up: 'assets/models/slime/torso_up.glb', torso_low: 'assets/models/slime/torso_low.glb',
    arm_up: 'assets/models/slime/arm_up.glb', arm_low: 'assets/models/slime/arm_low.glb', hand: 'assets/models/slime/hand.glb',
    leg_up: 'assets/models/slime/leg_up.glb', leg_low: 'assets/models/slime/leg_low.glb', foot: 'assets/models/slime/foot.glb',
    tendril_seg: 'assets/models/slime/tendril_seg.glb', tendril_tip: 'assets/models/slime/tendril_tip.glb', spike: 'assets/models/slime/spike.glb',
    hair: 'assets/models/hero/hair.glb',
};

// Куски: группа покрытия, часть тела, модель, анкер (точка крепления в осях части, px), охват желе, запасная форма [x,y,z].
const SLIME_PIECES = [
    { id: 'buddy', cs: 1, group: 'buddy', part: 'UpperArmR', model: 'buddy', at: [0, 19, 9], anchor: [0, 0, 0], reach: 30, fb: [24, 22, 24], lag: 0.9 },
    { id: 'head', cs: 1.04, group: 'head', part: 'Head', model: 'head', anchor: [0, -24, 0], reach: 64, fb: [66, 62, 72], lag: 0.75 },
    { id: 'armRu', cs: 1.12, group: 'armR', part: 'UpperArmR', model: 'arm_up', anchor: [0, 11, 0], reach: 46, fb: [40, 44, 40], lag: 0.5 },
    { id: 'armRl', cs: 1.14, group: 'armR', part: 'LowerArmR', model: 'arm_low', anchor: [0, 14, 0], reach: 38, fb: [38, 34, 38], lag: 0.5 },
    { id: 'handR', cs: 1.2, group: 'armR', part: 'HandR', model: 'hand', anchor: [0, 6, 0], reach: 30, fb: [36, 18, 36], lag: 0.6 },
    { id: 'armLu', cs: 1.12, group: 'armL', part: 'UpperArmL', model: 'arm_up', anchor: [0, 11, 0], reach: 46, fb: [40, 44, 40], lag: 0.5 },
    { id: 'armLl', cs: 1.14, group: 'armL', part: 'LowerArmL', model: 'arm_low', anchor: [0, 14, 0], reach: 38, fb: [38, 34, 38], lag: 0.5 },
    { id: 'handL', cs: 1.2, group: 'armL', part: 'HandL', model: 'hand', anchor: [0, 6, 0], reach: 30, fb: [36, 18, 36], lag: 0.6 },
    { id: 'torsoU', cs: 1.08, group: 'torso', part: 'UpperTorso', model: 'torso_up', anchor: [0, -28, 0], reach: 72, fb: [44, 62, 78], lag: 0.45 },
    { id: 'torsoL', cs: 1.16, group: 'torso', part: 'LowerTorso', model: 'torso_low', anchor: [0, 0, 0], reach: 40, fb: [42, 20, 76], lag: 0.4 },
    { id: 'legLu', cs: 1.12, group: 'legs', part: 'UpperLegL', model: 'leg_up', anchor: [0, 11, 0], reach: 40, fb: [42, 37, 42], lag: 0.4 },
    { id: 'legLl', cs: 1.12, group: 'legs', part: 'LowerLegL', model: 'leg_low', anchor: [0, 14, 0], reach: 36, fb: [40, 35, 40], lag: 0.4 },
    { id: 'footL', cs: 1.12, group: 'legs', part: 'FootL', model: 'foot', anchor: [-4, 5, 0], reach: 30, fb: [46, 16, 40], lag: 0.35 },
    { id: 'legRu', cs: 1.12, group: 'legs', part: 'UpperLegR', model: 'leg_up', anchor: [0, 11, 0], reach: 40, fb: [42, 37, 42], lag: 0.4 },
    { id: 'legRl', cs: 1.12, group: 'legs', part: 'LowerLegR', model: 'leg_low', anchor: [0, 14, 0], reach: 36, fb: [40, 35, 40], lag: 0.4 },
    { id: 'footR', cs: 1.12, group: 'legs', part: 'FootR', model: 'foot', anchor: [-4, 5, 0], reach: 30, fb: [46, 16, 40], lag: 0.35 },
];
// Корни щупалец на спине (оси UpperTorso: −X — спина) и направление покоя (x назад, y вверх, z вбок).
const SLIME_TENDRILS = [
    { at: [-16, 18, 20], dir: [-0.8, 0.35, 0.5] }, { at: [-16, 18, -20], dir: [-0.8, 0.35, -0.5] },
    { at: [-16, 2, 24], dir: [-0.7, 0.05, 0.75] }, { at: [-16, 2, -24], dir: [-0.7, 0.05, -0.75] },
    { at: [-16, 30, 8], dir: [-0.75, 0.6, 0.25] }, { at: [-16, 30, -8], dir: [-0.75, 0.6, -0.25] },
];
// Шипы: часть, точка, наклон (градусы вокруг X и Z части).
const SLIME_SPIKES = [
    { part: 'UpperArmR', at: [0, 18, 8], rx: -35, rz: 0, s: 0.9 }, { part: 'UpperArmL', at: [0, 18, -8], rx: 35, rz: 0, s: 0.9 },
    { part: 'UpperTorso', at: [-18, 20, 14], rx: -20, rz: 55, s: 1.1 }, { part: 'UpperTorso', at: [-18, 20, -14], rx: 20, rz: 55, s: 1.1 },
    { part: 'UpperTorso', at: [-18, -6, 0], rx: 0, rz: 70, s: 0.9 },
];

class SlimeBody {
    /** @param {any} view View3D @param {any} model HumanoidModel героя */
    constructor(view, model) {
        this.view = view;
        this.scene = view.scene;
        this.model = model;
        /** @type {Record<string, any>} разобранные модели (Model3D.load) или null */
        this.src = {};
        /** @type {Record<string, any>} */
        this.pieces = {};
        /** @type {any[]} */
        this.tendrils = [];
        /** @type {any[]} */
        this.whips = [];
        /** @type {any[]} */
        this.spikes = [];
        this.level = 0; this.evo = -1; this.headTier = -1;
        this.t = 0;
        this.look = {};
        this.glowHex = '#4de8ff';
        this.mats = this.makeMaterials();
        /** @type {any} */
        this.hair = null;
        this.cov = GD.coverage(0);
        this.disposed = false;
        /** false — без пер-вершинного желе (боты): остаются сжатие/отскок и щупальца. */
        this.jelly = true;
        /** Слизь отбрасывает тень (боты — нет: дешевле карта теней). */
        this.shadows = true;
        this._m = new BABYLON.Matrix();
        this._v = new BABYLON.Vector3();
        this._w = new BABYLON.Vector3();
    }

    async load() {
        const keys = Object.keys(SLIME_MODELS);
        await Promise.all(keys.map(async (k) => {
            try { this.src[k] = await Model3D.load(SLIME_MODELS[k]); } catch (e) { this.src[k] = null; }
        }));
        if (this.src.hair) this.attachHair();
    }

    makeMaterials() {
        const sc = this.scene;
        const goo = new BABYLON.StandardMaterial('slime-goo', sc);
        goo.diffuseColor = new BABYLON.Color3(0.05, 0.05, 0.08);
        goo.specularColor = new BABYLON.Color3(0.9, 0.9, 1);
        goo.specularPower = 42;
        goo.emissiveColor = new BABYLON.Color3(0.015, 0.015, 0.03);
        goo.emissiveFresnelParameters = new BABYLON.FresnelParameters();
        goo.emissiveFresnelParameters.bias = 0.25;
        goo.emissiveFresnelParameters.power = 2.4;
        goo.emissiveFresnelParameters.leftColor = BABYLON.Color3.FromHexString('#3a3f66');
        goo.emissiveFresnelParameters.rightColor = BABYLON.Color3.Black();
        const glow = new BABYLON.StandardMaterial('slime-glow', sc);
        glow.disableLighting = true;
        glow.emissiveColor = BABYLON.Color3.FromHexString('#4de8ff');
        glow.diffuseColor = BABYLON.Color3.Black();
        const teeth = new BABYLON.StandardMaterial('slime-teeth', sc);
        teeth.diffuseColor = BABYLON.Color3.FromHexString('#f2ead8');
        teeth.emissiveColor = new BABYLON.Color3(0.25, 0.24, 0.2);
        teeth.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
        const mouth = new BABYLON.StandardMaterial('slime-mouth', sc);
        mouth.diffuseColor = BABYLON.Color3.FromHexString('#4a0710');
        mouth.emissiveColor = new BABYLON.Color3(0.12, 0.0, 0.02);
        mouth.specularColor = new BABYLON.Color3(0.3, 0.1, 0.1);
        for (const m of [goo, glow, teeth, mouth]) m.metadata = { slime: true };
        return { goo, glow, teeth, mouth };
    }

    matFor(partName) {
        const n = String(partName || '').toLowerCase();
        if (n.startsWith('glow')) return this.mats.glow;
        if (n.startsWith('teeth')) return this.mats.teeth;
        if (n.startsWith('mouth')) return this.mats.mouth;
        return this.mats.goo;
    }

    /** Меши модели key под узлом parent: общие материалы слизи. fb — запасная форма: [x,y,z] (капля) | 'seg' | 'tip' | 'spike'.
     *  → { node (пустой меш-корень, зарегистрирован World3D.addObject), meshes } */
    buildModel(key, parent, fb) {
        const node = new BABYLON.Mesh('slime-' + key, this.scene);
        node.parent = parent;
        const meshes = [];
        const src = this.src[key];
        if (src) {
            const root = Model3D.build(src, this.scene, { name: 'slime-' + key });
            for (const ch of root.getChildMeshes(true)) {
                const old = ch.material;
                ch.material = this.matFor(ch.metadata && ch.metadata.part);
                if (old && !(old.metadata && old.metadata.slime)) old.dispose(false, true);
                ch.useVertexColors = false;
                meshes.push(/** @type {BABYLON.Mesh} */ (ch));
            }
            root.parent = node;
        } else if (Array.isArray(fb)) {
            const s = fb;
            const m = BABYLON.MeshBuilder.CreateSphere('slime-fb-' + key, { diameterX: s[0], diameterY: s[1], diameterZ: s[2], segments: 12, updatable: true }, this.scene);
            m.material = this.mats.goo;
            m.parent = node;
            meshes.push(m);
            if (key.startsWith('head') || key === 'buddy') {
                for (const z of [-1, 1]) {
                    const e = BABYLON.MeshBuilder.CreateBox('slime-fb-eye', { width: s[0] * 0.12, height: s[1] * 0.1, depth: s[2] * 0.22 }, this.scene);
                    e.material = this.mats.glow;
                    e.position.set(s[0] * 0.45, s[1] * 0.08, z * s[2] * 0.2);
                    e.rotation.x = z * 0.35;
                    e.parent = node;
                    meshes.push(e);
                }
            }
        } else if (fb) {
            const tip = fb === 'tip', spike = fb === 'spike';
            const hgt = spike ? 40 : tip ? 34 : 30;
            const m = BABYLON.MeshBuilder.CreateCylinder('slime-fb-' + fb, { height: hgt, diameterTop: tip || spike ? 0 : 11, diameterBottom: spike ? 16 : 14, tessellation: 10 }, this.scene);
            m.material = this.mats.goo;
            m.position.y = hgt / 2;
            m.parent = node;
            meshes.push(m);
        }
        for (const m of meshes) { m.isPickable = false; m.alwaysSelectAsActiveMesh = true; }
        World3D.addObject(this.view, node, 'actor', { castShadow: this.shadows });
        return { node, meshes };
    }

    /** Подготовить меши к желе: копии базовых вершин и веса от анкера. */
    prepJelly(piece) {
        piece.jm = [];
        if (!this.jelly) return;
        const a = piece.anchor || [0, 0, 0], reach = piece.reach || 40;
        for (const m of piece.meshes) {
            const base = m.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            const nor = m.getVerticesData(BABYLON.VertexBuffer.NormalKind);
            if (!base || base.length > 30000) continue;          // слишком тяжёлое — без деформации
            const b = Float32Array.from(base);
            // позиции меша → оси куска: у Model3D-меша позиция 0, у запасных глаз — своя
            const off = [m.position.x, m.position.y, m.position.z];
            const n = b.length / 3, w = new Float32Array(n), ph = new Float32Array(n);
            for (let i = 0; i < n; i++) {
                const x = b[i * 3] + off[0] - a[0], y = b[i * 3 + 1] + off[1] - a[1], z = b[i * 3 + 2] + off[2] - a[2];
                const d = Math.min(1, Math.hypot(x, y, z) / reach);
                w[i] = Math.pow(d, 1.25);
                ph[i] = (b[i * 3] * 0.09 + b[i * 3 + 1] * 0.13 + b[i * 3 + 2] * 0.07);
            }
            m.setVerticesData(BABYLON.VertexBuffer.PositionKind, Float32Array.from(b), true);
            piece.jm.push({ mesh: m, base: b, nor: nor ? Float32Array.from(nor) : null, w, ph, cur: new Float32Array(b.length) });
        }
    }

    /** Кусок по описанию def (создаётся при первом появлении). */
    ensurePiece(def) {
        if (this.pieces[def.id]) return this.pieces[def.id];
        const part = this.model.part(def.part);
        if (!part) return null;
        const key = def.model === 'head' ? 'head' + Math.max(0, this.headTier) : def.model;
        const built = this.buildModel(key, part, def.fb);
        if (def.at) built.node.position.set(def.at[0], def.at[1], def.at[2]);
        const piece = Object.assign({ def, key, visible: false, g: 0, gv: 0, sq: 0, sqv: 0, o: [0, 0, 0], ov: [0, 0, 0], prev: null, wob: 1 }, built,
            { anchor: def.anchor, reach: def.reach, lag: def.lag * 0.45, cs: def.cs || 1, lim: def.id === 'buddy' ? 0.2 : def.id === 'head' ? 0.1 : 0.06 });
        this.prepJelly(piece);
        built.node.setEnabled(false);
        this.pieces[def.id] = piece;
        return piece;
    }

    disposePiece(id) {
        const p = this.pieces[id];
        if (!p) return;
        World3D.removeObject(this.view, p.node);
        delete this.pieces[id];
    }

    attachHair() {
        const head = this.model.part('Head');
        if (!head || !this.src.hair) return;
        const root = Model3D.build(this.src.hair, this.scene, { name: 'hero-hair' });
        root.parent = head;
        World3D.addObject(this.view, root, 'actor', { castShadow: this.shadows });
        this.hair = root;
    }

    // ---- состояние --------------------------------------------------------------------------------
    /** Уровень героя → какие куски видны. animate — с ростом и брызгами. Возвращает список новых групп. */
    setLevel(L, animate) {
        const cov = GD.coverage(L), prev = this.cov, fresh = [];
        this.level = L;
        for (const def of SLIME_PIECES) {
            const on = !!cov[def.group];
            const p = on ? this.ensurePiece(def) : this.pieces[def.id];
            if (!p) continue;
            if (on && !p.visible) {
                p.visible = true; p.node.setEnabled(true);
                if (animate) { p.g = 0; p.gv = 9; if (!fresh.includes(def.group)) fresh.push(def.group); } else { p.g = 1; p.gv = 0; }
            } else if (!on && p.visible) {
                p.visible = false; p.node.setEnabled(false);
            }
        }
        // части тела под слизью не рисуются: в стыках не проглядывают кожа и одежда
        for (const def of SLIME_PIECES) {
            if (def.group === 'buddy') continue;
            const part = this.model.part(def.part);
            if (part) part.isVisible = !cov[def.group];
        }
        // голова слизи прячет голову и волосы героя
        const head = this.model.part('Head');
        if (this.hair) this.hair.setEnabled(!cov.head);
        if (this.model.face) this.model.face.setEnabled(!cov.head);
        void head;
        this.setTendrils(cov.tendrils, animate && cov.tendrils > prev.tendrils);
        this.setSpikes(cov.spikes, animate && cov.spikes && !prev.spikes);
        if (animate && cov.tendrils > prev.tendrils && !fresh.includes('tendrils')) fresh.push('tendrils');
        if (animate && cov.spikes && !prev.spikes) fresh.push('spikes');
        this.cov = cov;
        return fresh;
    }

    /** Эволюция: голова нужного яруса, свечение. */
    setEvo(e) {
        const ev = GD.EVOLUTIONS[e] || GD.EVOLUTIONS[0];
        this.evo = e;
        if (ev.head !== this.headTier) {
            this.headTier = ev.head;
            const had = this.pieces.head, vis = had && had.visible;
            this.disposePiece('head');
            if (vis) { const p = this.ensurePiece(SLIME_PIECES[1]); if (p) { p.visible = true; p.node.setEnabled(true); p.g = 0; p.gv = 8; } }
        }
        this.glowHex = ev.glow;
        this.applyLook(this.look);
    }

    /** Косметика: look = Shop.look() (goo, eyes …). */
    applyLook(look) {
        this.look = look || {};
        const gooRow = GameShopData.GOO.find((r) => r[0] === this.look.goo) || GameShopData.GOO[0];
        const eyesRow = GameShopData.EYES.find((r) => r[0] === this.look.eyes) || GameShopData.EYES[0];
        this.gooP = gooRow[4];
        this.eyesP = eyesRow[4];
        const g = this.gooP, m = this.mats.goo;
        m.diffuseColor = BABYLON.Color3.FromHexString(g.color);
        const sp = g.spec || 0.9;
        m.specularColor = new BABYLON.Color3(sp, sp, sp * 1.05);
        m.emissiveFresnelParameters.leftColor = BABYLON.Color3.FromHexString(g.rim || '#3a3f66');
        m.emissiveColor = g.emis ? BABYLON.Color3.FromHexString(g.emis).scale(0.35) : new BABYLON.Color3(0.015, 0.015, 0.03);
        this.applyEyes(0);
    }

    eyeColor() { return this.eyesP && !this.eyesP.evo ? this.eyesP.color : this.glowHex; }

    applyEyes(t) {
        const p = this.eyesP || { evo: true };
        let c = BABYLON.Color3.FromHexString(this.eyeColor());
        if (p.anim === 'pulse') c = c.scale(0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 6)));
        else if (p.anim === 'fire' || p.anim === 'hue') c = BABYLON.Color3.Lerp(c, BABYLON.Color3.FromHexString(p.color2 || '#ffffff'), 0.5 + 0.5 * Math.sin(t * 4));
        else if (p.anim === 'rainbow') c = BABYLON.Color3.FromHSV((t * 90) % 360, 0.9, 1);
        else if (p.anim === 'flicker') c = c.scale(Math.random() < 0.08 ? 0.2 : 1);
        else if (p.anim === 'sparkle') c = c.scale(0.8 + 0.4 * Math.abs(Math.sin(t * 9)));
        this.mats.glow.emissiveColor = c;
    }

    animateGoo(t) {
        const g = this.gooP;
        const m = this.mats.goo;
        // движок ставит блик группы 'actor' из констант — у слизи свой глянец
        const sp = g ? (g.spec || 0.9) : 0.9;
        if (m.specularPower !== 42 || m.specularColor.r !== sp) { m.specularColor = new BABYLON.Color3(sp, sp, sp * 1.05); m.specularPower = 42; }
        const tm = this.mats.teeth;
        if (tm.specularPower !== 24) { tm.specularColor = new BABYLON.Color3(0.5, 0.5, 0.45); tm.specularPower = 24; }
        if (!g || !g.anim) return;
        if (g.anim === 'rainbow') { m.diffuseColor = BABYLON.Color3.FromHSV((t * 60) % 360, 0.85, 0.75); m.emissiveFresnelParameters.leftColor = BABYLON.Color3.FromHSV((t * 60 + 180) % 360, 0.6, 1); }
        else if (g.anim === 'hue') m.diffuseColor = BABYLON.Color3.Lerp(BABYLON.Color3.FromHexString(g.color), BABYLON.Color3.FromHexString(g.color2 || g.rim), 0.5 + 0.5 * Math.sin(t * 1.6));
        else if (g.anim === 'pulse' || g.anim === 'void') m.emissiveColor = BABYLON.Color3.FromHexString(g.emis || '#200040').scale(0.2 + 0.5 * (0.5 + 0.5 * Math.sin(t * 3)));
        else if (g.anim === 'sparkle') m.emissiveFresnelParameters.leftColor = BABYLON.Color3.FromHexString(g.rim).scale(0.6 + 0.6 * Math.abs(Math.sin(t * 4)));
    }

    // ---- щупальца и шипы ------------------------------------------------------------------------------
    setTendrils(n, animate) {
        const torso = this.model.part('UpperTorso');
        if (!torso) return;
        while (this.tendrils.length < n) {
            const def = SLIME_TENDRILS[this.tendrils.length];
            this.tendrils.push(this.makeChain(def, torso, 7, 20, animate));
        }
        while (this.tendrils.length > n) this.disposeChain(this.tendrils.pop());
    }

    /** Цепочка Верле: корень на части body, N звеньев длиной len px. Вид — ОДНА трубка (меш на щупальце, а не на звено). */
    makeChain(def, part, N, len, animate) {
        const pts = [], prev = [];
        for (let i = 0; i <= N; i++) { pts.push(new BABYLON.Vector3(0, i, 0)); prev.push(new BABYLON.Vector3()); }
        const c = { def, part, N, len, pts, prev, init: false, grow: animate ? 0 : 1, phase: Math.random() * 6.28, thick: 1, scale: 1, tube: null, radius: null };
        c.radius = (i) => 6.8 * (c.thick || 1) * (c.scale || 1) * Math.max(0.06, 1 - i / N * 0.94);
        const tube = BABYLON.MeshBuilder.CreateTube('slime-tendril', { path: pts, radiusFunction: (i) => c.radius(i), tessellation: 8, cap: BABYLON.Mesh.CAP_START, updatable: true }, this.scene);
        tube.material = this.mats.goo;
        tube.isPickable = false;
        tube.alwaysSelectAsActiveMesh = true;
        World3D.addObject(this.view, tube, 'actor', { castShadow: this.shadows });
        c.tube = tube;
        return c;
    }

    disposeChain(c) {
        if (c.tube) World3D.removeObject(this.view, c.tube);
        c.tube = null;
    }

    setSpikes(on, animate) {
        if (on && !this.spikes.length) {
            for (const d of SLIME_SPIKES) {
                const part = this.model.part(d.part);
                if (!part) continue;
                const b = this.buildModel('spike', part, 'spike');
                b.node.position.set(d.at[0], d.at[1], d.at[2]);
                b.node.rotation.set(d.rx * Math.PI / 180, 0, d.rz * Math.PI / 180);
                const sc = d.s;
                this.spikes.push({ b, s: sc, g: animate ? 0 : 1, gv: animate ? 7 : 0 });
                b.node.scaling.set(sc, sc, sc);
            }
        } else if (!on && this.spikes.length) {
            for (const sp of this.spikes) World3D.removeObject(this.view, sp.b.node);
            this.spikes = [];
        }
    }

    // ---- хлыст атаки ----------------------------------------------------------------------------
    /**
     * Хлыст из руки (или слизня на плече) к точке мира. onHit — в момент удара.
     * @param {BABYLON.Vector3} to @param {() => void} [onHit] @param {any} [opts] { from: 'hand'|'back'|'buddy', dur, thick }
     */
    whip(to, onHit, opts) {
        const o = opts || {};
        let w = this.whips.find((q) => !q.active);
        if (!w) {
            if (this.whips.length >= 8) return false;
            w = this.makeChain(null, null, 8, 26, false);
            w.active = false;
            this.whips.push(w);
        }
        w.active = true; w.t = 0; w.dur = o.dur || 0.34; w.hit = false; w.onHit = onHit || null;
        w.to = to.clone(); w.from = o.from || (this.cov.armR ? 'hand' : this.cov.buddy ? 'buddy' : 'hand');
        w.side = o.side || (Math.random() < 0.5 ? -1 : 1);
        w.thick = o.thick || 1;
        if (w.tube) w.tube.setEnabled(true);
        return true;
    }

    whipOrigin(w, out) {
        let part = null, local = [0, 0, 0];
        if (w.from === 'buddy' && this.cov.buddy) { part = this.model.part('UpperArmR'); local = [0, 32, 9]; }
        else if (w.from === 'back') { part = this.model.part('UpperTorso'); local = [-16, 20 + (w.side > 0 ? 6 : -6), w.side * 20]; }
        else { part = this.model.part('HandR'); local = [0, -8, 0]; }
        if (!part) return out.set(0, 0, 0);
        part.computeWorldMatrix(true);
        BABYLON.Vector3.TransformCoordinatesFromFloatsToRef(local[0], local[1], local[2], part.getWorldMatrix(), out);
        return out;
    }

    updateWhip(w, dt) {
        w.t += dt;
        const k = w.t / w.dur;
        if (k >= 1) { w.active = false; if (w.tube) w.tube.setEnabled(false); return; }
        // выброс 0..0.45, удержание, возврат
        const ext = k < 0.45 ? 1 - Math.pow(1 - k / 0.45, 3) : k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
        if (!w.hit && k >= 0.42) { w.hit = true; if (w.onHit) w.onHit(); }
        const a = this.whipOrigin(w, w.pts[0]);
        const b = w.to;
        const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
        const len = Math.hypot(dx, dy, dz) || 1;
        // перпендикуляр в горизонтали для изгиба
        const px = -dz / len * w.side, pz = dx / len * w.side;
        for (let i = 1; i <= w.N; i++) {
            const s = (i / w.N) * ext;
            const arc = Math.sin(s * Math.PI) * len * 0.22 * (1 - ext * 0.5);
            const wave = Math.sin(s * 9 - w.t * 30) * 10 * (1 - s);
            w.pts[i].set(a.x + dx * s + px * (arc + wave), a.y + dy * s + Math.sin(s * Math.PI) * len * 0.18, a.z + dz * s + pz * (arc + wave));
        }
        this.layoutChain(w, w.thick);
    }

    /** Трубка по точкам цепочки: толщина спадает к кончику. */
    layoutChain(c, thick) {
        if (!c.tube) return;
        c.thick = thick || 1;
        BABYLON.MeshBuilder.CreateTube('slime-tendril', { path: c.pts, radiusFunction: (i) => c.radius(i), instance: c.tube });
    }

    updateTendril(c, dt, heading, growth) {
        const part = c.part;
        part.computeWorldMatrix(true);
        const W = part.getWorldMatrix();
        const root = c.pts[0];
        BABYLON.Vector3.TransformCoordinatesFromFloatsToRef(c.def.at[0], c.def.at[1], c.def.at[2], W, root);
        c.grow = Math.min(1, c.grow + dt * 1.6);
        const len = c.len * growth * (0.25 + 0.75 * c.grow);
        c.scale = growth;
        // направление покоя в мире: по курсу героя
        const ch = Math.cos(heading), sh = Math.sin(heading);
        const dl = c.def.dir;
        const sway = Math.sin(this.t * 1.7 + c.phase) * 0.35, sway2 = Math.cos(this.t * 1.3 + c.phase) * 0.25;
        const lx = dl[0] + sway2 * 0.3, ly = dl[1] + sway * 0.4, lz = dl[2] + sway;
        // оси героя: X вперёд (курс), Z вправо; мир: x = cos·X − sin·Z ... (карта y = мир z)
        const wx = lx * ch - lz * sh, wz = lx * sh + lz * ch;
        if (!c.init) {
            for (let i = 0; i <= c.N; i++) { c.pts[i].set(root.x + wx * len * i, root.y + ly * len * i, root.z + wz * len * i); c.prev[i].copyFrom(c.pts[i]); }
            c.init = true;
        }
        const damp = 0.9;
        for (let i = 1; i <= c.N; i++) {
            const p = c.pts[i], q = c.prev[i];
            const vx = (p.x - q.x) * damp, vy = (p.y - q.y) * damp, vz = (p.z - q.z) * damp;
            q.copyFrom(p);
            // притяжение к форме покоя (сильнее у корня), лёгкая гравитация
            const stiff = 0.16 * (1 - i / (c.N + 2));
            const tx = root.x + wx * len * i, ty = root.y + ly * len * i - i * i * 0.6, tz = root.z + wz * len * i;
            p.x += vx + (tx - p.x) * stiff;
            p.y += vy + (ty - p.y) * stiff - 20 * dt * dt * 60;
            p.z += vz + (tz - p.z) * stiff;
        }
        // длины звеньев
        for (let it = 0; it < 3; it++) {
            for (let i = 0; i < c.N; i++) {
                const a = c.pts[i], b = c.pts[i + 1];
                const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
                const d = Math.hypot(dx, dy, dz) || 1, diff = (d - len) / d;
                if (i === 0) { b.x -= dx * diff; b.y -= dy * diff; b.z -= dz * diff; }
                else { a.x += dx * diff * 0.5; a.y += dy * diff * 0.5; a.z += dz * diff * 0.5; b.x -= dx * diff * 0.5; b.y -= dy * diff * 0.5; b.z -= dz * diff * 0.5; }
            }
        }
        this.layoutChain(c, 2.3);
    }

    // ---- желе -----------------------------------------------------------------------------------
    /** Толчок всей слизи: amount ~1 — заметный отскок. */
    bounce(amount) {
        const a = amount == null ? 1 : amount;
        for (const id of Object.keys(this.pieces)) {
            const p = this.pieces[id];
            if (!p.visible) continue;
            p.sqv += 6 * a;
            p.ov[1] += 90 * a;
        }
    }

    updatePiece(p, dt) {
        const node = p.node;
        node.computeWorldMatrix(true);
        const W = node.getWorldMatrix();
        const wp = this._w;
        BABYLON.Vector3.TransformCoordinatesFromFloatsToRef(p.anchor[0], p.anchor[1], p.anchor[2], W, wp);
        if (!p.prev) p.prev = wp.clone();
        // запаздывание: движение анкера уводит слизь назад
        const mx = wp.x - p.prev.x, my = wp.y - p.prev.y, mz = wp.z - p.prev.z;
        p.prev.copyFrom(wp);
        const tele = Math.abs(mx) + Math.abs(my) + Math.abs(mz) > 200;   // телепорт — без рывка
        if (!tele) { p.o[0] -= mx * p.lag; p.o[1] -= my * p.lag; p.o[2] -= mz * p.lag; }
        // пружина
        const K = 110, C = 8.5, h = Math.min(dt, 1 / 30);
        for (let k = 0; k < 3; k++) {
            p.ov[k] += (-K * p.o[k] - C * p.ov[k]) * h;
            p.o[k] += p.ov[k] * h;
        }
        const lim = p.reach * p.lim;
        for (let k = 0; k < 3; k++) p.o[k] = Math.max(-lim, Math.min(lim, p.o[k]));
        // рост и сжатие
        p.gv += (-140 * (p.g - 1) - 11 * p.gv) * h; p.g += p.gv * h;
        p.sqv += (-160 * p.sq - 9 * p.sqv) * h; p.sq += p.sqv * h;
        const g = Math.max(0.01, p.g), sq = Math.max(-0.35, Math.min(0.35, p.sq));
        const cs = p.cs;
        node.scaling.set(cs * g * (1 + sq * 0.35), cs * g * (1 - sq * 0.7), cs * g * (1 + sq * 0.35));
        if (!this.jelly) return;
        // смещение в осях куска
        W.invertToRef(this._m);
        const lo = BABYLON.Vector3.TransformNormalFromFloatsToRef(p.o[0], p.o[1], p.o[2], this._m, this._v);
        const s = node.scaling;
        const lx = lo.x * s.x, ly = lo.y * s.y, lz = lo.z * s.z;   // TransformNormal поделил на масштаб узла — вернуть
        const t = this.t, amp = 1.3 * p.wob;
        for (const j of p.jm) {
            const b = j.base, c = j.cur, w = j.w, ph = j.ph, n = j.nor;
            for (let i = 0, v = 0; i < b.length; i += 3, v++) {
                const wi = w[v];
                const wob = n ? Math.sin(t * 3.2 + ph[v]) * amp * wi : 0;
                c[i] = b[i] + lx * wi + (n ? n[i] * wob : 0);
                c[i + 1] = b[i + 1] + ly * wi + (n ? n[i + 1] * wob : 0);
                c[i + 2] = b[i + 2] + lz * wi + (n ? n[i + 2] * wob : 0);
            }
            j.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, c, false, false);
        }
    }

    /** Кадр. heading — курс героя (рад), growth — множитель роста тела. */
    update(dt, heading, growth) {
        if (this.disposed) return;
        this.t += dt;
        for (const id of Object.keys(this.pieces)) {
            const p = this.pieces[id];
            if (p.visible) this.updatePiece(p, dt);
        }
        for (const c of this.tendrils) this.updateTendril(c, dt, heading, growth);
        for (const w of this.whips) if (w.active) { w.scale = growth; this.updateWhip(w, dt); }
        for (const sp of this.spikes) {
            sp.gv += (-120 * (sp.g - 1) - 10 * sp.gv) * Math.min(dt, 1 / 30); sp.g += sp.gv * Math.min(dt, 1 / 30);
            const s = sp.s * Math.max(0.01, sp.g);
            sp.b.node.scaling.set(s, s, s);
        }
        this.applyEyes(this.t);
        this.animateGoo(this.t);
    }

    /** Мировая точка для эффектов (центр торса / головы). */
    point(name, out) {
        const part = this.model.part(name || 'UpperTorso');
        const o = out || new BABYLON.Vector3();
        if (!part) return o;
        part.computeWorldMatrix(true);
        return o.copyFrom(part.getAbsolutePosition());
    }

    dispose() {
        this.disposed = true;
        for (const id of Object.keys(this.pieces)) this.disposePiece(id);
        for (const c of this.tendrils) this.disposeChain(c);
        for (const c of this.whips) this.disposeChain(c);
        this.setSpikes(false, false);
        if (this.hair) {
            const mats = new Set();
            for (const m of this.hair.getChildMeshes(false)) if (m.material) mats.add(m.material);
            World3D.removeObject(this.view, this.hair);
            for (const m of mats) m.dispose(false, true);
            this.hair = null;
        }
        for (const k of Object.keys(this.mats)) this.mats[k].dispose(false, false);
    }
}
