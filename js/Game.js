// Game.js — «+1 Black Slime Evolution»: склейка систем.
//   Лобби: тренировочные площадки (маркеры train-N) → слизь и уровни → слизь поглощает тело; портал (portal) → окно
//   «Миры»; стенды эволюции (evolve) и магазина (shop). Арена (world-N): волны мобов, автоатаки, барьер (gate) до
//   конца волн, площадки побед (win-1 зелёная, win-2 золотая за рекламу) → окно «Победа» → лобби.
// Данные — GameData.js, прогресс — GameState.js (GS), герой — GameHero.js, слизь — GameSlime.js, мобы — GameEnemies.js,
// атаки — GameAttacks.js, эффекты и звук — GameFx.js, интерфейс — GameHud.js.

const GAME_TEXT = {
    ru: {
        'g.stage': 'Стадия {n}',
        'g.loadingStage': 'Стадия {n}',
        'g.loadingLobby': 'Лобби',
        'g.level': 'Уровень {n}!',
        'g.grow.buddy': 'Слизь нашла тебя!',
        'g.grow.armR': 'Слизь поглотила руку!',
        'g.grow.head': 'Выросла голова слизи!',
        'g.grow.armL': 'Слизь захватила вторую руку!',
        'g.grow.torso': 'Слизь захватила торс!',
        'g.grow.legs': 'Полное слияние!',
        'g.grow.tendrils': 'Новые щупальца!',
        'g.grow.spikes': 'Слизь отрастила шипы!',
        'g.grow.sub': 'Ты стал сильнее',
        'g.evo.title': 'ЭВОЛЮЦИЯ!',
        'g.evo.sub': '{name} · новая атака: {attack}',
        'g.wave': 'Волна {n}!',
        'g.boss': 'БОСС: {name}',
        'g.cleared': 'Забери победу!',
        'g.locked': '{text}',
        'g.train': '+{n}',
        'g.portal': 'Арена',
        'g.evolveStand': 'Эволюция',
        'g.shopStand': 'Магазин',
        'g.tut.pad.t': 'Встань на площадку',
        'g.tut.pad.h': 'Тренировка даёт слизь — она растёт и поглощает тело',
        'g.tut.level.t': 'Дорасти до 3 уровня',
        'g.tut.level.h': 'Стой на площадке: каждый «+» — это слизь',
        'g.tut.portal.t': 'Иди в портал арены',
        'g.tut.portal.h': 'На арене слизь атакует врагов сама. Победи все волны!',
        'g.arenaHint': 'Атаки автоматические — подойди к врагам!',
        'g.offer.starter.t': 'Набор новичка',
        'g.offer.starter.x': 'x2 слизь на 5 минут и 60 кристаллов',
        'g.offer.power.t': 'Рывок силы',
        'g.offer.power.x': '+3 уровня прямо сейчас',
        'g.offer.wins.t': 'Охота за победами',
        'g.offer.wins.x': 'x2 победы на 10 минут',
        'g.gotReward': 'Награда получена!',
        'g.noAd': 'Реклама сейчас недоступна',
        'g.revived': 'Слизь снова в бою!',
        'g.needStage': 'Сначала пройди стадию {n}',
        'g.offer.ad': 'За рекламу',
        'g.winsN': '+{n} побед',
        'g.npc.hi': 'Заходи за обновками!',
    },
    en: {
        'g.stage': 'Stage {n}',
        'g.loadingStage': 'Stage {n}',
        'g.loadingLobby': 'Lobby',
        'g.level': 'Level {n}!',
        'g.grow.buddy': 'The slime found you!',
        'g.grow.armR': 'The slime absorbed your arm!',
        'g.grow.head': 'Your slime head has grown!',
        'g.grow.armL': 'The slime took your other arm!',
        'g.grow.torso': 'The slime took your torso!',
        'g.grow.legs': 'Full fusion!',
        'g.grow.tendrils': 'New tendrils!',
        'g.grow.spikes': 'The slime grew spikes!',
        'g.grow.sub': 'You got stronger',
        'g.evo.title': 'EVOLUTION!',
        'g.evo.sub': '{name} · new attack: {attack}',
        'g.wave': 'Wave {n}!',
        'g.boss': 'BOSS: {name}',
        'g.cleared': 'Claim your win!',
        'g.locked': '{text}',
        'g.train': '+{n}',
        'g.portal': 'Arena',
        'g.evolveStand': 'Evolution',
        'g.shopStand': 'Shop',
        'g.tut.pad.t': 'Step on a training pad',
        'g.tut.pad.h': 'Training gives slime — it grows and absorbs your body',
        'g.tut.level.t': 'Reach level 3',
        'g.tut.level.h': 'Stay on the pad: every "+" is slime',
        'g.tut.portal.t': 'Go to the arena portal',
        'g.tut.portal.h': 'In the arena your slime attacks by itself. Beat every wave!',
        'g.arenaHint': 'Attacks are automatic — get close to enemies!',
        'g.offer.starter.t': 'Starter pack',
        'g.offer.starter.x': 'x2 slime for 5 minutes and 60 crystals',
        'g.offer.power.t': 'Power rush',
        'g.offer.power.x': '+3 levels right now',
        'g.offer.wins.t': 'Win hunt',
        'g.offer.wins.x': 'x2 wins for 10 minutes',
        'g.gotReward': 'Reward received!',
        'g.noAd': 'No ad available right now',
        'g.revived': 'The slime is back in the fight!',
        'g.needStage': 'Clear stage {n} first',
        'g.offer.ad': 'Watch ad',
        'g.winsN': '+{n} wins',
        'g.npc.hi': 'Come get some new looks!',
    },
};
Object.assign(LANG_STRINGS.ru, GAME_TEXT.ru);
Object.assign(LANG_STRINGS.en, GAME_TEXT.en);

/** Есть ли интерфейс (GameHud.js пишет отдельный агент; без него игра всё равно идёт). */
function hud() { return typeof GameHud !== 'undefined' ? GameHud : null; }

/** @satisfies {Record<string, any>} */
const Game = {
    /** @type {LoryApp | null} */ app: null,
    state: 'loading',          // lobby | arena | result | dead | loading
    stage: 0,
    /** @type {any[]} */ pads: [],
    /** @type {any} */ zones: {},
    /** @type {HTMLElement | null} */ labelLayer: null,
    trainT: 0, padIn: -1, lockShown: -1,
    zoneIn: '',
    offerT: 120, offerIdx: 0,
    // арена
    /** @type {any[]} */ waves: [], waveIdx: -1, waveT: 0, spawnQueue: [], spawnT: 0,
    /** @type {any} */ gate: null, cleared: false, /** @type {any[]} */ winPads: [], winIn: '', deadT: 0, roundDone: false,
    stageStats: null, kills: 0, gemsRun: 0,
    hintShown: false, gateW: 0, uiCovered: false, revived: false,
    /** Свои меши и материалы карты (не из Maps.js): убираются при смене карты. @type {any[]} */ temp: [],
    /** Продавец в киоске. @type {any} */ npc: null,

    async firstMap() { return 'lobby'; },

    async init(app) {
        this.app = app;
        await GS.load();
        const cat = GameShopData.build();
        Shop.init({ tabs: cat.tabs, items: cat.items, state: GS.save.shop, persist: () => GS.persist(), autoEquip: true });
        GS.save.shop = Shop.state;
        DailyGift.init({ rewards: GameShopData.DAILY_REWARDS, rewardsSink: Shop, state: GS.save.daily, persist: () => GS.persist() });
        GS.save.daily = DailyGift.state;
        Wheel.init({ sectors: GameShopData.WHEEL_SECTORS, rewardsSink: Shop, state: GS.save.wheel, persist: () => GS.persist() });
        GS.save.wheel = Wheel.state;
        Shop.on((e) => {
            if (e.type === 'equip' || e.type === 'unequip' || e.type === 'preview' || e.type === 'grant') Hero.onLook();
            if (e.type === 'coins') GS.emit({ type: 'gems' });
        });
        HudLayout.init({ app });
        const acts = Object.assign({}, Input.DEFAULTS);
        if (Platform.name === 'playables' || String(GAME_PLATFORM) === 'playables') acts.jump = { keys: ['Space', 'Mouse2'], pad: [0] };   // одной мышью: ЛКМ — стик/взгляд, ПКМ — прыжок
        Input.init({ app, mouse: 'drag', actions: acts });
        // Средняя кнопка мыши камеру не двигает (иначе панорама срывает слежение за героем) и не включает автопрокрутку.
        const cam = app.camera, prevIgnore = cam.ignorePointer;
        cam.ignorePointer = (e) => (e.pointerType !== 'touch' && e.button === 1) || (prevIgnore ? !!prevIgnore.call(cam, e) : false);
        const canvas = document.getElementById('world3d');
        if (canvas) {
            canvas.addEventListener('pointerdown', (e) => { if (e.button === 1) e.preventDefault(); });
            canvas.addEventListener('mousedown', (e) => { if (e.button === 1) e.preventDefault(); });
            canvas.addEventListener('auxclick', (e) => { if (e.button === 1) e.preventDefault(); });
        }
        GameFx.init(app);
        Mobs.init(app);
        Mobs.onKill = (m) => this.onKill(m);
        await Attacks.init(app);
        this.makeLabelLayer();
        const H = hud();
        if (H) H.init({
            onStage: (i) => this.startStage(i),
            onLobby: () => this.leaveArena(),
            onRevive: () => this.revive(),
            onClaim: (mult) => this.finishWin(mult),
            onHowTo: () => this.howTo(),
            onSound: (on) => { if (on === Sound.muted) Sound.toggleMuted(); },
            onQuality: (q) => { if (typeof Quality !== 'undefined' && Quality.set) Quality.set(q); },
        });
        GS.on((e) => this.onState(e));
        await this.prepareLobby(app);
        Tutorial.init({
            app, state: () => GS.save, field: 'tutorialDone', persist: () => GS.persist(),
            steps: [
                Tutorial.preset('move'),
                { id: 'pad', title: 'g.tut.pad.t', hint: 'g.tut.pad.h', world: () => { const p = this.pads[0]; return p ? { x: p.x, y: p.y, h: p.h + 60 } : null; } },
                { id: 'level', title: 'g.tut.level.t', hint: 'g.tut.level.h', check: () => (GS.level >= 3 ? true : Math.max(0, (GS.level - 1 + GS.xp / GS.need()) / 2)) },
                { id: 'portal', title: 'g.tut.portal.t', hint: 'g.tut.portal.h', world: () => { const z = this.zones.portal; return z ? { x: z.x, y: z.y, h: z.h + 220 } : null; } },
            ],
        });
        window.addEventListener('keydown', (e) => {
            const H2 = hud();
            if (Platform.name === 'playgama') return;   // Playgama 1.5.2: Esc зарезервирован браузером (выход из полноэкранного)
            if (e.code === 'Escape' && H2 && !H2.isOpen() && (this.state === 'lobby' || this.state === 'arena')) H2.open('settings');
        });
        const st = document.createElement('style');
        st.textContent = 'body.ui-window #fx-pops, body.ui-window #world-labels, body.ui-window #mob-bars, body.ui-window #gb-layer { visibility: hidden; }';
        document.head.appendChild(st);
        app.onFrame((dt) => {
            GameFx.update(dt);
            const H2 = hud();
            if (H2 && H2.update) H2.update(dt);
            // окно или оверлей интерфейса открыт — цифры и подписи мира не лезут поверх него
            const covered = !!(H2 && ((H2.isOpen && H2.isOpen()) || (H2.S && H2.S.ov)));
            if (covered !== this.uiCovered) { this.uiCovered = covered; document.body.classList.toggle('ui-window', covered); }
            this.updateLabels();
            this.declutter();
            this.updatePadFx(dt);
        });
        Platform.onAd(() => { /* rewarded не паузит: герой неуязвим по Platform.adActive (Hero.damage) */ });
        this.initUiAds();
    },

    async ready() {
        if (!GS.save.tutorialDone) Tutorial.autoStart();
        Platform.gameplay(true);
    },

    // ---- лобби -----------------------------------------------------------------------------------
    async prepareLobby(app) {
        this.state = 'loading';
        this.cleanupTemp();
        Mobs.clear(); Attacks.clear();
        GameFx.onMap(); Attacks.onMap();
        const loc = app.location;
        Nav.build(loc, { ground: (x, y) => loc.terrain.fieldHeight(x, y) });
        const sp = this.spawnOf(loc);
        await Hero.create(app, sp);
        this.cameraFade(app);
        app.camera.follow(Hero.cam);
        app.camera.azimuth = (sp.heading || 0) + 0;
        Hero.syncCam(true);
        this.buildPads(loc);
        this.buildZones(loc);
        await this.makeShopkeeper(loc);
        if (typeof GameBots !== 'undefined') await GameBots.prepareLobby(app, { pads: this.pads, zones: this.zones });
        this.state = 'lobby';
        this.trainT = 0; this.padIn = -1; this.zoneIn = '';
        const H = hud();
        if (H) { H.hideOverlays(); H.setMode('lobby'); }
        Input.setContext({ id: 'jump', label: Lang.t('input.action.jump'), icon: '⤒', action: 'jump' }, 1);
        GameSfx.music('lobby');
        Platform.gameplay(true);
    },

    track(o) { if (o) this.temp.push(o); return o; },

    /**
     * Только сборка YouTube Playables (просьба пользователя): межстраничная реклама по нажатию кнопок интерфейса
     * в лобби. Не во время игры на арене и загрузки, не во время rewarded и не по кнопкам «за рекламу»;
     * кнопки результата арены идут через Platform.ads.next (правило двух раундов) — здесь не дублируются.
     * Локально проверить: ?mockads&uiads.
     */
    initUiAds() {
        const on = String(GAME_PLATFORM) === 'playables' || Platform.name === 'playables' || /[?&]uiads\b/.test(location.search);
        if (!on) return;
        let busy = false;
        document.addEventListener('click', (e) => {
            const t = /** @type {HTMLElement} */ (e.target);
            if (!t || !t.closest) return;
            const btn = t.closest('#gh-root button, #gh-root [role="button"]');
            if (!btn || btn.closest('[data-ad="1"]')) return;              // кнопка rewarded — не трогаем
            if (this.state !== 'lobby') return;                            // арена, результат, загрузка — нет
            if (busy || GS.adBusy || Platform.adActive || Tutorial.active) return;
            if (!Platform.interstitialSupported()) return;
            busy = true;
            // после обработчика самой кнопки (окно уже открылось/закрылось)
            setTimeout(() => {
                Promise.resolve(Platform.interstitial()).catch(() => false).then(() => { busy = false; });
            }, 0);
        }, true);
    },

    /** Убрать свои меши, материалы и текстуры прошлой карты (Location3D.loadMap убирает только объекты Maps.js). */
    cleanupTemp() {
        const view = this.app && this.app.location ? this.app.location.view : null;
        const meshes = this.temp.filter((o) => o instanceof BABYLON.AbstractMesh), rest = this.temp.filter((o) => !(o instanceof BABYLON.AbstractMesh));
        for (const o of meshes) { try { if (view) World3D.removeObject(view, o); else o.dispose(); } catch (e) { /* уже удалён */ } }
        for (const o of rest) { try { o.dispose(); } catch (e) { /* уже удалён */ } }
        for (const p of this.pads) this.stopPadFx(p);
        this.temp = [];
        this.npc = null;
        this.gate = null;
        if (typeof GameBots !== 'undefined') GameBots.clear();
    },

    /** Продавец за прилавком киоска (объект карты shop-stall; перед модели — +X). */
    async makeShopkeeper(loc) {
        this.npc = null;
        const stall = loc.objects.find((r) => r.def && (r.def.name === 'shop-stall' || /shop_stall/.test(r.def.model || '')));
        const z = this.zones.shop;
        if (!stall && !z) return;
        let src = null;
        try { src = await Model3D.load('assets/models/npc/shopkeeper.glb'); } catch (e) { return; }
        if (!src) return;
        const view = loc.view, scene = view.scene;
        let x, y, face;
        if (stall) {
            face = (stall.def.rot ? stall.def.rot[1] : 0) * Math.PI / 180;
            x = stall.def.x - Math.cos(face) * 8; y = stall.def.y - Math.sin(face) * 8;
        } else { face = Math.PI; x = z.x + 130; y = z.y; }
        const root = new BABYLON.Mesh('npc-shopkeeper', scene);
        const body = Model3D.build(src, scene, { name: 'npc-shopkeeper' });
        body.parent = root;
        const piv = {};
        for (const m of body.getChildMeshes(true)) {
            const name = (m.metadata && m.metadata.part) || '';
            const p = (m.metadata && m.metadata.pivot) || [0, 0, 0];
            const node = new BABYLON.TransformNode('npc-' + name, scene);
            node.parent = body; node.position.set(p[0], p[1], p[2]);
            m.parent = node; m.position.set(-p[0], -p[1], -p[2]);
            m.isPickable = false;
            piv[name] = node;
        }
        const s = 0.72;
        body.scaling.set(s, s, s);
        World3D.addObject(view, root, 'actor');
        const h = Nav.height(x, y);
        root.position.set(x, h, y);
        root.rotation.y = Math.PI / 2 - face;
        this.track(root);
        for (const m of body.getChildMeshes(false)) if (m.material && !this.temp.includes(m.material)) this.track(m.material);
        this.npc = { root, body, piv, x, y, h, face, t: Math.random() * 6, wave: 0 };
    },

    /** Продавец: дышит, смотрит на героя, машет, когда тот подходит. */
    updateNpc(dt) {
        const n = this.npc;
        if (!n) return;
        n.t += dt;
        const dx = Hero.x - n.x, dz = Hero.y - n.y, d = Math.hypot(dx, dz);
        // направление на героя в осях модели (лицо по +Z)
        const th = n.root.rotation.y, c = Math.cos(th), sn = Math.sin(th);
        const lx = dx * c - dz * sn, lz = dx * sn + dz * c;
        const yaw = d < 1100 ? Math.max(-0.9, Math.min(0.9, Math.atan2(lx, lz))) : Math.sin(n.t * 0.6) * 0.35;
        const head = n.piv.head;
        if (head) head.rotation.y += (yaw - head.rotation.y) * Math.min(1, dt * 5);
        const breathe = Math.sin(n.t * 2.2);
        if (n.piv.torso) n.piv.torso.rotation.x = breathe * 0.025;
        n.body.position.y = breathe * 1.2;
        const want = d < 600 ? 1 : 0;
        n.wave += (want - n.wave) * Math.min(1, dt * 4);
        const arm = n.piv['arm-right'];
        if (arm) { arm.rotation.x = -2.7 * n.wave + Math.sin(n.t * 1.3) * 0.05 * (1 - n.wave); arm.rotation.z = Math.sin(n.t * 9) * 0.45 * n.wave; }
        const armL = n.piv['arm-left'];
        if (armL) armL.rotation.x = Math.sin(n.t * 1.3 + 1) * 0.05;
    },

    /** Пропсы карты между камерой и героем растворяются (CameraSight). */
    cameraFade(app) {
        const sight = app.camera && app.camera.sight;
        if (sight) sight.fadeFilter = (rec) => !!rec.def && rec.def.kind === 'prop';
    },

/** Эффект площадки, на которой стоят: герой — яркий столб частиц и кольца, бот — слабее. */
    updatePadFx(dt) {
        void dt;
        if (this.state !== 'lobby' || !this.pads.length || !this.app || !this.app.fx) return;
        const bots = typeof GameBots !== 'undefined' && GameBots.list ? GameBots.list : [];
        for (let i = 0; i < this.pads.length; i++) {
            const p = this.pads[i];
            let kind = '';
            if (i === this.padIn && GS.padUnlocked(p.pad)) kind = 'hero';
            else {
                for (const b of bots) {
                    if (!b || !b.ch || b.state === 'gone') continue;
                    if (Math.hypot(b.ch.x - p.x, b.ch.y - p.y) < p.r * 0.85) { kind = 'bot'; break; }
                }
            }
            if (kind === p.fxKind) continue;
            this.stopPadFx(p);
            p.fxKind = kind;
            if (kind) p.fx = this.startPadFx(p, kind === 'hero');
        }
    },
    startPadFx(p, hero) {
        const fx = this.app.fx, c = p.pad.color, k = hero ? 1 : 0.45;
        const pos = new BABYLON.Vector3(p.x, p.h + 10, p.y), R = p.r * 0.8;
        const hs = [
            fx.create({ position: pos, rate: 34 * k, capacity: Math.ceil(60 * k), life: [0.8, 1.4], size: [10, 20], speed: [80, 190], texture: FX_TEX.star || FX_TEX.sparkle, color: '#ffffff', color2: c, box: [[-R, 0, -R], [R, 10, R]], direction: [[-0.05, 1, -0.05], [0.05, 1, 0.05]], sizeGradient: [[0, 0.3], [0.25, 1], [1, 0]], colorGradient: [[0, '#ffffff', 0.9], [0.4, c, 0.9], [1, c, 0]] }),
            fx.create({ position: pos, rate: 10 * k, capacity: Math.ceil(16 * k), life: [0.9, 1.3], size: [60, 110], speed: [40, 90], texture: FX_TEX.glow, color: c, box: [[-R * 0.6, 0, -R * 0.6], [R * 0.6, 20, R * 0.6]], direction: [[0, 1, 0], [0, 1, 0]], colorGradient: [[0, c, 0], [0.3, c, 0.35], [1, c, 0]] }),
        ].filter(Boolean);
        const decs = [];
        decs.push(GameFx.decal({ tex: 'rthin', x: p.x, y: p.y, h: p.h + 6, r0: p.r * 0.35, r1: p.r * 1.05, life: Infinity, loop: hero ? 1.1 : 1.8, color: c, a: hero ? 0.95 : 0.5 }));
        if (hero) decs.push(GameFx.decal({ tex: 'rthin', x: p.x, y: p.y, h: p.h + 7, r0: p.r * 0.35, r1: p.r * 1.05, life: Infinity, loop: 1.1, t0: 0.55, color: '#ffffff', a: 0.6 }));
        if (hero && FX_TEX.swirl) decs.push(GameFx.decal({ tex: 'swirl', x: p.x, y: p.y, h: p.h + 5, r0: p.r * 0.9, r1: p.r * 0.9, life: Infinity, color: c, a: 0.55, spin: 1.4 }));
        return { hs, decs };
    },
    stopPadFx(p) {
        if (!p.fx) return;
        for (const h of p.fx.hs) { try { h.stop(); } catch (e) { /* */ } }
        for (const d of p.fx.decs) { try { GameFx.killDecal(d); } catch (e) { /* */ } }
        p.fx = null; p.fxKind = '';
    },

    spawnOf(loc) {
        const m = loc.marker('spawn');
        if (m) return { x: m.x, y: m.y, heading: (m.rot ? m.rot[1] : 0) * Math.PI / 180 };
        return { x: (loc.map.width || 2000) / 2, y: (loc.map.height || 2000) / 2, heading: 0 };
    },

    /** Площадки тренировки по маркерам train-N (нет маркеров — ряд у спавна). */
    buildPads(loc) {
        this.pads = [];
        const ms = loc.markers('train');
        const sp = this.spawnOf(loc);
        GD.PADS.forEach((pad, i) => {
            let m = ms.find((d) => d.name === 'train-' + pad.id);
            const x = m ? m.x : sp.x - 600 + i * 260, y = m ? m.y : sp.y - 500;
            const r = m ? Math.max(60, (m.scale ? m.scale[0] : 1.2) * 100) : 110;
            const h = Nav.height(x, y);
            // светящиеся части модели площадки рядом с маркером
            const glows = [];
            for (const rec of loc.objects) {
                if (!rec.mesh || !rec.def.model || !/train_/.test(rec.def.model)) continue;
                if (Math.hypot(rec.def.x - x, rec.def.y - y) > r + 60) continue;
                for (const ch of rec.mesh.getChildMeshes(false)) {
                    const part = String((ch.metadata && ch.metadata.part) || '').toLowerCase();
                    if (part.startsWith('glow') && ch.material) { ch.material = ch.material.clone('padglow-' + pad.id); glows.push(ch.material); this.track(ch.material); }
                }
            }
            if (!glows.length && !m) {
                const disc = BABYLON.MeshBuilder.CreateCylinder('pad-fb', { height: 8, diameter: r * 2, tessellation: 40 }, loc.view.scene);
                const mat = new BABYLON.StandardMaterial('pad-fb-mat', loc.view.scene);
                mat.diffuseColor = BABYLON.Color3.FromHexString(pad.color); mat.emissiveColor = BABYLON.Color3.FromHexString(pad.color).scale(0.3);
                disc.material = mat; disc.position.set(x, h + 4, y);
                World3D.addObject(loc.view, disc, 'prop');
                this.track(disc); this.track(mat);
                glows.push(mat);
            }
            const label = this.makeLabel('pad');
            this.pads.push({ pad, x, y, h, r, glows, label, pulse: 0, fx: null, fxKind: '' });
        });
    },

    buildZones(loc) {
        this.zones = {};
        const sp = this.spawnOf(loc);
        const def = { portal: [sp.x + 700, sp.y], evolve: [sp.x - 350, sp.y + 350], shop: [sp.x + 350, sp.y + 350] };
        for (const k of Object.keys(def)) {
            const m = loc.marker(k);
            const x = m ? m.x : def[k][0], y = m ? m.y : def[k][1];
            const r = m && m.scale ? Math.max(80, m.scale[0] * 100) : 150;
            this.zones[k] = { x, y, h: Nav.height(x, y), r, label: this.makeLabel('zone') };
        }
        const p = this.zones.portal;
        GameFx.play('portal', p.x, p.y, p.h);
    },

    // ---- подписи над площадками (DOM) ----------------------------------------------------------------
    makeLabelLayer() {
        const el = document.createElement('div');
        el.id = 'world-labels';
        el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:24;overflow:hidden;contain:strict';
        document.body.appendChild(el);
        const st = document.createElement('style');
        st.textContent = `.wlabel{position:absolute;left:0;top:0;transform-origin:50% 100%;text-align:center;white-space:nowrap;
          font-family:var(--game-font,'Rubik',system-ui,sans-serif);font-weight:900;color:#fff;-webkit-text-stroke:4px #120a1c;paint-order:stroke fill;
          text-shadow:0 3px 0 #120a1c;will-change:transform}
          .wlabel b{display:block;font-size:30px;line-height:1}
          .wlabel small{display:block;font-size:17px;margin-top:2px;-webkit-text-stroke:3px #120a1c}
          .wlabel.locked b{color:#9aa0b0}`;
        document.head.appendChild(st);
        this.labelLayer = el;
    },
    makeLabel(kind) {
        const el = document.createElement('div');
        el.className = 'wlabel ' + kind;
        el.innerHTML = '<b></b><small></small>';
        this.labelLayer.appendChild(el);
        return el;
    },
    clearLabels() { if (this.labelLayer) this.labelLayer.innerHTML = ''; },
    placeLabel(el, x, y, h, title, sub, color, locked) {
        const view = this.app.location.view;
        const s = view.projectToScreen(x, y, h);
        const L = /** @type {any} */ (el);
        if (!s || !s.visible || s.behind) { if (L._vis !== false) { el.style.display = 'none'; L._vis = false; } return; }
        const d = Math.hypot(x - Hero.x, y - Hero.y);
        const k = Math.max(0.55, Math.min(1, 1300 / Math.max(1, d)));
        if (L._vis !== true) { el.style.display = ''; L._vis = true; }
        L._sx = s.x; L._sy = s.y; L._k = k; L._dist = d;   // позицию пишет declutter()
        const b = /** @type {HTMLElement} */ (el.firstChild), sm = /** @type {HTMLElement} */ (el.lastChild);
        if (b.textContent !== title) { b.textContent = title; L._w = 0; }       // размер подписи пересчитать (declutter)
        if (sm.textContent !== sub) { sm.textContent = sub; L._w = 0; }
        b.style.color = color || '#fff';
        el.classList.toggle('locked', !!locked);
    },
/**
     * Подписи над миром без наложений: зоны и площадки побед → тренировочные площадки → ники ботов (ближние первыми).
     * Пересечение — подпись поднимается над соседней (до 3 ступеней), места нет — гаснет. Сдвиг и прозрачность
     * сглажены: подписи не дёргаются от мелкого движения камеры.
     */
    declutter() {
        /** @type {any[]} */
        const items = [];
        const add = (el, prio, dist) => { if (el && el._vis && el._sx != null) items.push({ el, prio, dist }); };
        if (this.labelLayer && this.labelLayer.style.display !== 'none') {
            for (const k of Object.keys(this.zones)) add(this.zones[k].label, 0, 0);
            for (const p of this.winPads) add(p.label, 0, 0);
            for (const p of this.pads) add(p.label, 1, /** @type {any} */ (p.label)._dist || 0);
        }
        if (this.state === 'lobby' && typeof GameBots !== 'undefined' && GameBots.list) {
            for (const b of GameBots.list) if (b.tag && b.vis) add(b.tag.el, 2, Math.hypot(b.ch.x - Hero.x, b.ch.y - Hero.y));
        }
        items.sort((a, b) => a.prio - b.prio || a.dist - b.dist);
        // панели HUD — препятствия: подпись под ними гаснет, а не уезжает за край
        const H = hud();
        const placed = H && H.obstacles ? H.obstacles().slice() : [];
        const fr = this.frameN = (this.frameN || 0) + 1;
        for (const it of items) {
            const el = it.el;
            if (!el._w || fr - (el._mt || 0) > 40) { el._w = el.offsetWidth; el._h = el.offsetHeight; el._mt = fr; if (!el._w) { el._w = 0; continue; } }
            const k = el._k || 1, w = el._w * k, h = el._h * k, x0 = el._sx - w / 2, y1 = el._sy;
            let off = 0, ok = false;
            for (let tries = 0; tries < 4; tries++) {
                const top = y1 + off - h, bot = y1 + off;
                const hit = placed.find((r) => x0 < r.x1 && x0 + w > r.x0 && top < r.y1 && bot > r.y0);
                if (!hit) { ok = true; break; }
                if (hit.hud) break;
                off = hit.y0 - y1 - 3;
            }
            if (ok) placed.push({ x0, x1: x0 + w, y0: y1 + off - h, y1: y1 + off });
            el._dy = el._dy == null ? off : el._dy + (off - el._dy) * 0.25;
            const want = ok ? 1 : 0;
            el._op = el._op == null ? want : el._op + (want - el._op) * 0.2;
            el.style.transform = 'translate(' + el._sx.toFixed(1) + 'px,' + (el._sy + el._dy).toFixed(1) + 'px) translate(-50%,-100%) scale(' + k.toFixed(3) + ')';
            el.style.opacity = ((el._baseOp == null ? 1 : el._baseOp) * el._op).toFixed(3);
        }
    },

    updateLabels() {
        if (!this.app || !this.labelLayer) return;
        if (this.state === 'arena' || this.state === 'result') {
            this.labelLayer.style.display = this.cleared ? '' : 'none';
            if (this.cleared) {
                const wins = GD.STAGES[this.stage].wins, k2 = GS.boostLeft('wins2') > 0 ? 2 : 1;
                for (const p of this.winPads) this.placeLabel(p.label, p.x, p.y, p.h + 200, Lang.t('g.winsN', { n: Math.round(wins * (p.gold ? 3 : 1) * k2) }), p.gold ? Lang.t('g.offer.ad') : '', p.gold ? '#ffc23a' : '#39ff6a', false);
            }
            return;
        }
        if (this.state !== 'lobby') { this.labelLayer.style.display = 'none'; return; }
        this.labelLayer.style.display = '';
        for (const p of this.pads) {
            const un = GS.padUnlocked(p.pad);
            this.placeLabel(p.label, p.x, p.y, p.h + 230, Lang.t('g.train', { n: fmtNum(GS.padGain(p.pad)) }), un ? '' : Lang.t('g.locked', { text: GS.padLock(p.pad) }), p.pad.color, !un);
        }
        const z = this.zones;
        if (z.portal) this.placeLabel(z.portal.label, z.portal.x, z.portal.y, z.portal.h + 420, Lang.t('g.portal'), Lang.t('g.stage', { n: GS.save.stage + 1 }), '#c48aff');
        if (z.evolve) this.placeLabel(z.evolve.label, z.evolve.x, z.evolve.y, z.evolve.h + 300, Lang.t('g.evolveStand'), GS.evoInfo().canEvolve ? '!' : '', GD.EVOLUTIONS[GS.evo].glow);
        if (z.shop) {
            const n = this.npc, near = n && Math.hypot(Hero.x - n.x, Hero.y - n.y) < 750;
            if (n) this.placeLabel(z.shop.label, n.x, n.y, n.h + 250, Lang.t('g.shopStand'), near ? Lang.t('g.npc.hi') : '', '#ffd23c');
            else this.placeLabel(z.shop.label, z.shop.x, z.shop.y, z.shop.h + 320, Lang.t('g.shopStand'), '', '#ffd23c');
        }
    },

    // ---- кадр ------------------------------------------------------------------------------------
    update(dt) {
        GS.tick(dt);
        const H = hud();
        const controls = !(H && H.isOpen && H.isOpen()) && (this.state === 'lobby' || this.state === 'arena');
        const cam = this.app.camera;
        const look = Input.consumeLook();
        if (controls) {
            cam.azimuth += look.dx * 0.0045;
            cam.pitch = Math.max(0.07, Math.min(1.25, cam.pitch + look.dy * 0.0035));
        }
        Hero.update(dt, controls);
        if (this.state === 'lobby') this.updateLobby(dt);
        else if (this.state === 'arena' || this.state === 'dead' || this.state === 'result') this.updateArena(dt);
    },

    updateLobby(dt) {
        this.updateNpc(dt);
        if (typeof GameBots !== 'undefined') GameBots.update(dt);
        // площадка под героем
        let inPad = -1;
        for (let i = 0; i < this.pads.length; i++) {
            const p = this.pads[i];
            if (Math.hypot(Hero.x - p.x, Hero.y - p.y) < p.r) { inPad = i; break; }
        }
        if (inPad !== this.padIn) { this.padIn = inPad; this.trainT = 0; if (inPad < 0) this.lockShown = -1; }
        for (let i = 0; i < this.pads.length; i++) {
            const p = this.pads[i], on = i === inPad && GS.padUnlocked(p.pad);
            p.pulse = Math.max(0, p.pulse - dt * 3);
            const c = BABYLON.Color3.FromHexString(p.pad.color).scale((on ? 0.8 : 0.45) + p.pulse * 0.8 + (on ? 0.2 * Math.sin(GS.sessionT * 8) : 0));
            for (const m of p.glows) { m.emissiveColor = c; }
        }
        if (inPad >= 0) {
            const p = this.pads[inPad];
            if (!GS.padUnlocked(p.pad)) {
                if (this.lockShown !== inPad) { this.lockShown = inPad; const H = hud(); if (H) H.toast(GS.padLock(p.pad), 1800, 'bad'); }
            } else {
                this.trainT += dt;
                if (this.trainT >= GD.PAD_TICK) {
                    this.trainT -= GD.PAD_TICK;
                    const n = GS.padGain(p.pad);
                    p.pulse = 1;
                    GameFx.pop('+' + fmtNum(n), Hero.x, Hero.y, Hero.h + 200 * Hero.growthNow, 'gain', { size: 32 });
                    GameSfx.play('gain');
                    if (Hero.slime) Hero.slime.bounce(0.35);
                    GS.addSlime(n, 'train');
                    Tutorial.complete('pad');
                }
            }
        }
        // зоны
        let zone = '';
        for (const k of Object.keys(this.zones)) {
            const z = this.zones[k];
            if (Math.hypot(Hero.x - z.x, Hero.y - z.y) < z.r) { zone = k; break; }
        }
        if (zone !== this.zoneIn) {
            this.zoneIn = zone;
            const H = hud();
            if (zone && H && !H.isOpen()) {
                if (zone === 'portal') { GameSfx.play('portal'); Tutorial.complete('portal'); H.open('worlds'); }
                else if (zone === 'evolve') H.open('evolve');
                else if (zone === 'shop') H.open('shop');
            }
        }
        // предложения
        const H = hud();
        // Подарок дня: раз в день в лобби, после туториала, не поверх окон и предложений
        if (H && !Tutorial.active && !H.isOpen() && GS.save.tutorialDone && DailyGift.shouldOffer()) { H.open('daily'); if (H.isOpen()) DailyGift.markOffered(); }
        if (H && H.offer && !Tutorial.active && !H.isOpen() && GS.save.tutorialDone && Platform.rewardedSupported()) {
            this.offerT -= dt;
            if (this.offerT <= 0) { this.offerT = 150; this.showOffer(); }
        }
    },

    showOffer() {
        const H = hud();
        const offers = [
            { id: 'starter', title: Lang.t('g.offer.starter.t'), text: Lang.t('g.offer.starter.x'), icon: 'boost-slime', run: () => { GS.addBoost('slime2', 300); GS.addGems(60, true); } },
            { id: 'power', title: Lang.t('g.offer.power.t'), text: Lang.t('g.offer.power.x'), icon: 'pack', run: () => GS.addLevels(3, 'offer') },
            { id: 'wins', title: Lang.t('g.offer.wins.t'), text: Lang.t('g.offer.wins.x'), icon: 'boost-wins', run: () => GS.addBoost('wins2', 600) },
        ];
        const o = offers[this.offerIdx++ % offers.length];
        H.offer({
            title: o.title, text: o.text, icon: o.icon,
            cb: (ok) => { if (ok) { o.run(); H.toast(Lang.t('g.gotReward'), 1600, 'good'); GameSfx.play('confirm'); } },
        });
    },

    // ---- события прогресса --------------------------------------------------------------------------
    onState(e) {
        const H = hud();
        if (e.type === 'level') {
            GameFx.play('levelup', Hero.x, Hero.y, Hero.h + 10);
            GameSfx.play('levelup');
            GameFx.pop(Lang.t('g.level', { n: e.to }), Hero.x, Hero.y, Hero.h + 260 * Hero.growthNow, 'info', { size: 34, life: 1.4, spread: 0, color: '#7dff4d' });
            const fresh = Hero.onLevel(true);
            if (fresh.length) {
                const g = fresh[fresh.length - 1];
                GameFx.play('grow', Hero.x, Hero.y, Hero.h + 120);
                GameSfx.play('grow');
                if (this.app.camera.shake) this.app.camera.shake(260, 0.02);
                if (H) H.celebrate({ title: Lang.t('g.grow.' + g), sub: Lang.t('g.grow.sub'), color: GD.EVOLUTIONS[GS.evo].glow, icon: 'slime' });
            }
        } else if (e.type === 'evo') {
            const ev = GD.EVOLUTIONS[GS.evo];
            Hero.onEvo();
            GameFx.play('evolve', Hero.x, Hero.y, Hero.h + 60);
            GameFx.winEffect(Hero.x, Hero.y, Hero.h);
            GameSfx.play('evolve');
            if (this.app.camera.shake) this.app.camera.shake(400, 0.03);
            if (H) H.celebrate({ title: Lang.t('g.evo.title'), sub: Lang.t('g.evo.sub', { name: tr(ev.name), attack: tr(GD.ATTACKS[ev.attack].name) }), color: ev.glow, icon: 'evolve' });
            document.documentElement.style.setProperty('--evo', ev.glow);
        }
    },

    onKill(m) {
        this.kills++;
        GS.save.kills++;
        const slime = m.slimeReward;
        GS.addSlime(slime, 'kill');
        GameFx.pop('+' + fmtNum(slime), m.x, m.y, m.h + 160, 'gain', { size: 24 });
        if (m.gems) { this.gemsRun += m.gems; GS.addGems(m.gems); GameFx.play('gem', m.x, m.y, m.h + 60); }
        if (Hero.slime) Hero.slime.bounce(0.25);
        if (m.boss) { const H = hud(); if (H) H.boss(null); }
    },

    // ---- арена -----------------------------------------------------------------------------------
    async startStage(i) {
        if (this.state !== 'lobby' && this.state !== 'result' && this.state !== 'dead') return;
        if (!GS.stageUnlocked(i)) { const H = hud(); if (H) H.toast(Lang.t('g.needStage', { n: i }), 1800, 'bad'); return; }
        const st = GD.STAGES[i], world = GD.WORLDS[st.world - 1];
        const mapId = GAME_MAPS.some((m) => m.id === world.map) ? world.map : GAME_MAPS[0].id;
        this.state = 'loading';
        this.stage = i;
        const H = hud();
        if (H) { H.close(); H.hideOverlays(); H.setMode('hidden'); }
        this.clearLabels();
        Input.clearContext();
        Platform.gameplay(false);
        try {
            await this.app.loadMap(mapId, { label: Lang.t('g.loadingStage', { n: i + 1 }), gameplay: true, prepare: async (app) => this.prepareArena(app, i) });
        } catch (e) {
            console.error('startStage:', e);
        }
    },

    async prepareArena(app, i) {
        this.cleanupTemp();
        Mobs.clear(); Attacks.clear();
        GameFx.onMap(); Attacks.onMap();
        const loc = app.location;
        const st = GD.STAGES[i];
        // барьер — временный маркер block (Nav не пустит за него, пока волны живы)
        const g = loc.marker('gate');
        this.gate = null;
        if (g) {
            // ширина ворот — поперёк курса маркера (как рамка gate.glb): у block ширина по локальному y — scale[2]
            loc.map.objects.push({ name: 'block-gate', kind: 'marker', x: g.x, y: g.y, h: 0, rot: [0, g.rot ? g.rot[1] : 0, 0], scale: [0.6, 1, g.scale ? g.scale[0] : 10] });
        }
        Nav.build(loc, { ground: (x, y) => loc.terrain.fieldHeight(x, y) });
        const sp = this.spawnOf(loc);
        await Hero.create(app, sp);
        this.cameraFade(app);
        app.camera.follow(Hero.cam);
        app.camera.azimuth = sp.heading;
        Hero.syncCam(true);
        const types = new Set(st.pool);
        if (st.boss) types.add(st.boss);
        await Mobs.preload([...types]);
        this.stageStats = GD.mobStats(i);
        this.waves = GD.waves(i);
        this.waveIdx = -1; this.waveT = 1.6; this.spawnQueue = []; this.spawnT = 0;
        this.cleared = false; this.winIn = ''; this.deadT = 0; this.roundDone = false; this.revived = false; this.kills = 0; this.gemsRun = 0;
        if (g) this.gate = this.makeGate(loc, g);
        this.winPads = this.makeWinPads(loc);
        this.state = 'arena';
        const H = hud();
        if (H) {
            H.setMode('arena');
            H.hp(Hero.hp, Hero.maxHp);
            H.arena({ wave: 0, waves: this.waves.length, left: 0, total: 0, stage: i + 1 });
            H.gate(true);
            H.boss(null);
            if (!this.hintShown) { this.hintShown = true; H.toast(Lang.t('g.arenaHint'), 2600, 'info'); }
        }
        Input.setContext({ id: 'jump', label: Lang.t('input.action.jump'), icon: '⤒', action: 'jump' }, 1);
        GameSfx.music(st.boss ? 'boss' : 'arena');
        if (typeof Telemetry !== 'undefined') Telemetry.progress('started', 'stage_' + (i + 1), { step_index: i + 1 });
    },

    /** Энергостена барьера. */
    makeGate(loc, g) {
        const scene = loc.view.scene;
        const w = (g.scale ? g.scale[0] : 10) * 100, hgt = 320;
        this.gateW = w;
        const wall = BABYLON.MeshBuilder.CreatePlane('gate-wall', { width: w, height: hgt, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene);
        const tex = new BABYLON.DynamicTexture('gate-tex', { width: 512, height: 256 }, scene, true);
        const ctx = /** @type {CanvasRenderingContext2D} */ (/** @type {any} */ (tex.getContext()));
        const grd = ctx.createLinearGradient(0, 0, 0, 256);
        grd.addColorStop(0, 'rgba(255,40,70,0.05)'); grd.addColorStop(1, 'rgba(255,40,70,0.75)');
        ctx.fillStyle = grd; ctx.fillRect(0, 0, 512, 256);
        ctx.strokeStyle = 'rgba(255,220,230,0.55)'; ctx.lineWidth = 10;
        for (let x = -256; x < 768; x += 64) { ctx.beginPath(); ctx.moveTo(x, 256); ctx.lineTo(x + 128, 0); ctx.stroke(); }
        tex.hasAlpha = true; tex.update(true);
        tex.uScale = Math.max(1, w / 400);
        const mat = new BABYLON.StandardMaterial('gate-mat', scene);
        mat.diffuseTexture = tex; mat.useAlphaFromDiffuseTexture = true; mat.emissiveColor = new BABYLON.Color3(1, 0.3, 0.4);
        mat.disableLighting = true; mat.backFaceCulling = false;
        wall.material = mat;
        wall.isPickable = false;
        const heading = (g.rot ? g.rot[1] : 0) * Math.PI / 180;
        wall.position.set(g.x, Nav.height(g.x, g.y) + hgt / 2, g.y);
        wall.rotation.y = -heading + Math.PI / 2;   // плоскость шириной поперёк курса ворот, как рамка
        wall.renderingGroupId = World3D.LAYER.OVERLAY;
        this.track(wall); this.track(mat); this.track(tex);
        return { wall, mat, tex, open: 0, x: g.x, y: g.y };
    },

    /** Площадки побед: модели карты у маркеров win-1/2 прячутся до победы; нет — простые диски. */
    makeWinPads(loc) {
        const out = [];
        for (const name of ['win-1', 'win-2']) {
            const m = loc.marker(name);
            if (!m) continue;
            const gold = name === 'win-2';
            const r = Math.max(90, (m.scale ? m.scale[0] : 1.3) * 100);
            const meshes = [];
            for (const rec of loc.objects) {
                if (!rec.mesh || !rec.def.model || !/win_pad/.test(rec.def.model)) continue;
                if (Math.hypot(rec.def.x - m.x, rec.def.y - m.y) > r + 80) continue;
                meshes.push(rec.mesh);
            }
            if (!meshes.length) {
                const disc = BABYLON.MeshBuilder.CreateCylinder('winpad', { height: 10, diameter: r * 2, tessellation: 40 }, loc.view.scene);
                const mat = new BABYLON.StandardMaterial('winpad-mat', loc.view.scene);
                mat.diffuseColor = BABYLON.Color3.FromHexString(gold ? '#ffc23a' : '#39ff6a'); mat.emissiveColor = mat.diffuseColor.scale(0.5);
                disc.material = mat; disc.position.set(m.x, Nav.height(m.x, m.y) + 5, m.y);
                World3D.addObject(loc.view, disc, 'prop');
                this.track(disc); this.track(mat);
                meshes.push(disc);
            }
            for (const ms of meshes) ms.setEnabled(false);
            out.push({ name, gold, x: m.x, y: m.y, h: Nav.height(m.x, m.y), r, meshes, label: this.makeLabel('win'), shown: 0 });
        }
        return out;
    },

    updateArena(dt) {
        const H = hud();
        const fighting = this.state === 'arena';
        Attacks.update(dt, fighting && Hero.alive);
        Mobs.update(dt);
        if (H) H.hp(Hero.hp, Hero.maxHp);
        // волны
        if (fighting && !this.cleared) {
            if (this.spawnQueue.length) {
                this.spawnT -= dt;
                if (this.spawnT <= 0) { this.spawnT = 0.22; const q = this.spawnQueue.shift(); Mobs.spawn(q.type, q.x, q.y, this.stageStats, q.opts); }
            } else if (Mobs.count() === 0) {
                this.waveT -= dt;
                if (this.waveT <= 0) {
                    if (this.waveIdx + 1 < this.waves.length) this.nextWave();
                    else this.openGate();
                }
            }
            const boss = Mobs.list.find((m) => m.boss && !m.dead);
            if (H) {
                H.arena({ wave: this.waveIdx + 1, waves: this.waves.length, left: Mobs.count() + this.spawnQueue.length, total: this.waveTotal || 0, stage: this.stage + 1 });
                if (boss) H.boss({ name: tr(boss.def.name), hp: boss.hp, max: boss.maxHp });
            }
        }
        // барьер
        if (this.gate) {
            const gt = this.gate;
            if (this.cleared && gt.open < 1) {
                gt.open = Math.min(1, gt.open + dt * 1.5);
                gt.mat.alpha = 1 - gt.open;
                gt.wall.scaling.y = 1 - gt.open * 0.95;
                if (gt.open >= 1) gt.wall.setEnabled(false);
            } else if (!this.cleared) {
                gt.tex.vOffset = (gt.tex.vOffset + dt * 0.4) % 1;
            }
        }
        // площадки побед
        if (this.cleared) {
            let inside = '';
            for (const p of this.winPads) {
                if (p.shown < 1) {
                    p.shown = Math.min(1, p.shown + dt * 2.5);
                    const k = p.shown, s = k < 0.7 ? k / 0.7 * 1.15 : 1.15 - (k - 0.7) / 0.3 * 0.15;
                    for (const ms of p.meshes) { ms.setEnabled(true); ms.scaling.set(s, s, s); }
                }
                if (Math.hypot(Hero.x - p.x, Hero.y - p.y) < p.r * 0.8 && Hero.alive) inside = p.name;
            }
            if (inside !== this.winIn) {
                this.winIn = inside;
                if (inside && this.state === 'arena') {
                    const p = this.winPads.find((q) => q.name === inside);
                    if (p.gold && H && H.askGold) H.askGold((ok) => { if (ok) this.finishWin(3); });
                    else if (!p.gold) this.finishWin(1);
                    else this.finishWin(3);
                }
            }
        }
        // смерть
        if (this.state === 'arena' && !Hero.alive) {
            this.state = 'dead'; this.deadT = 1.3;
            GameSfx.play('lose');
        }
        if (this.state === 'dead' && this.deadT > 0) {
            this.deadT -= dt;
            if (this.deadT <= 0 && H) H.showDead({ canRevive: Platform.rewardedSupported() && !this.revived });
        }
    },

    nextWave() {
        this.waveIdx++;
        const wv = this.waves[this.waveIdx];
        const loc = this.app.location;
        let pts = loc.markers('enemy').map((m) => ({ x: m.x, y: m.y }));
        if (!pts.length) pts = [{ x: Hero.x + 700, y: Hero.y }, { x: Hero.x - 700, y: Hero.y }, { x: Hero.x, y: Hero.y + 700 }];
        this.spawnQueue = [];
        for (let k = 0; k < wv.count; k++) {
            const p = pts[k % pts.length];
            const a = Math.random() * Math.PI * 2, r = 40 + Math.random() * 140;
            const type = wv.pool[Math.floor(Math.random() * wv.pool.length)];
            const elite = this.stage > 2 && Math.random() < 0.08;
            this.spawnQueue.push({ type, x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r, opts: { elite } });
        }
        if (wv.boss) {
            const b = loc.marker('boss') || pts[0];
            this.spawnQueue.push({ type: wv.boss, x: b.x, y: b.y, opts: {} });
        }
        this.waveTotal = this.spawnQueue.length;
        this.waveT = 1.4;
        const H = hud();
        if (H) {
            if (wv.boss) H.celebrate({ title: Lang.t('g.boss', { name: tr(GD.MOBS[wv.boss].name) }), sub: Lang.t('g.wave', { n: this.waveIdx + 1 }), color: '#ff3b4d', icon: 'boss' });
            else H.toast(Lang.t('g.wave', { n: this.waveIdx + 1 }), 1400, 'info');
        }
    },

    openGate() {
        this.cleared = true;
        if (this.gate) {
            GameFx.gateBurst(this.gate.x, this.gate.y, Nav.height(this.gate.x, this.gate.y), this.gateW || 1000, 320, this.gate.wall.rotation.y);
            const loc = this.app.location;
            loc.map.objects = loc.map.objects.filter((d) => d.name !== 'block-gate');
            Nav.build(loc, { ground: (x, y) => loc.terrain.fieldHeight(x, y) });
        }
        const H = hud();
        if (H) { H.gate(false); H.boss(null); H.celebrate({ title: Lang.t('g.cleared'), sub: '', color: '#39ff6a', icon: 'trophy' }); }
        GameSfx.play('confirm');
        for (const p of this.winPads) GameFx.play('levelup', p.x, p.y, p.h);
    },

    finishWin(mult) {
        if (this.state !== 'arena') return;
        this.state = 'result';
        const i = this.stage, st = GD.STAGES[i];
        const wins = GS.addWins(st.wins * mult);
        const gems = 10 + 5 * i;
        GS.addGems(gems, true);
        GS.clearStage(i);
        GameFx.winEffect(Hero.x, Hero.y, Hero.h);
        GameSfx.play('win');
        if (Hero.slime) Hero.slime.bounce(2);
        if (!this.roundDone) { this.roundDone = true; Platform.ads.roundEnded(true); }
        try { Platform.submitScore(GS.save.wins); } catch (e) { /* лидерборд не обязателен */ }
        if (typeof Telemetry !== 'undefined') Telemetry.progress('completed', 'stage_' + (i + 1), { step_index: i + 1 });
        Platform.gameplay(false);
        const H = hud();
        if (H) H.showWin({ stage: i + 1, wins, gems: gems + this.gemsRun, gold: mult > 1 });
        else setTimeout(() => this.leaveArena(), 1500);
    },

    revive() {
        if (this.state !== 'dead' || this.revived) return;
        this.revived = true;   // возрождение за рекламу — не чаще раза за попытку (Playgama 2.2.4)
        Hero.revive();
        for (const m of Mobs.inRadius(Hero.x, Hero.y, 500)) { const dx = m.x - Hero.x, dy = m.y - Hero.y, L = Math.hypot(dx, dy) || 1; m.kx += dx / L * 900; m.ky += dy / L * 900; }
        GameFx.play('shock', Hero.x, Hero.y, Hero.h + 6);
        this.state = 'arena';
        const H = hud();
        if (H) { H.hideOverlays(); H.toast(Lang.t('g.revived'), 1500, 'good'); }
    },

    /** «В лобби» из победы или поражения: раунд засчитан, interstitial по правилу двух раундов. */
    leaveArena() {
        if (this.state === 'dead' && !this.roundDone) {
            this.roundDone = true;
            Platform.ads.roundEnded(false);
            try { Platform.submitScore(GS.save.wins); } catch (e) { /* лидерборд не обязателен */ }
            GS.save.deaths++;
            if (typeof Telemetry !== 'undefined') Telemetry.progress('failed', 'stage_' + (this.stage + 1), { step_index: this.stage + 1 });
        }
        Platform.ads.next(() => this.toLobby());
    },

    async toLobby() {
        if (this.state === 'loading') return;
        this.state = 'loading';
        const H = hud();
        if (H) { H.hideOverlays(); H.setMode('hidden'); }
        this.clearLabels();
        Input.clearContext();
        try {
            await this.app.loadMap('lobby', { label: Lang.t('g.loadingLobby'), gameplay: true, prepare: async (app) => this.prepareLobby(app) });
        } catch (e) { console.error('toLobby:', e); }
    },

    howTo() {
        const H = hud();
        if (H) H.close();
        if (this.state === 'lobby') Tutorial.start({ replay: true });
    },
};
