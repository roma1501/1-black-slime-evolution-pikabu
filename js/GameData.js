// GameData.js — данные игры «+1 Black Slime Evolution»: эволюции, атаки, покрытие тела, площадки,
// миры и стадии, мобы, подарки за время, предложения и каталог косметики. Логики тут нет — только таблицы
// и формулы баланса (docs/DESIGN.md). Тексты — { ru, en } или ключи Lang (GameLang.js).

/** Текст { ru, en } -> строка на языке игры. */
function tr(o) {
    if (o == null) return '';
    if (typeof o === 'string') return o;
    const c = typeof Lang !== 'undefined' ? Lang.code : 'ru';
    return o[c] || o.en || o.ru || '';
}

/** Короткая запись больших чисел: 1.2K, 3.4M, 5.6B. */
function fmtNum(n) {
    n = Math.floor(Number(n) || 0);
    if (n < 1000) return String(n);
    const u = ['K', 'M', 'B', 'T', 'Qa', 'Qi'];
    let i = -1, v = n;
    while (v >= 1000 && i < u.length - 1) { v /= 1000; i++; }
    return (v >= 100 ? Math.floor(v) : v >= 10 ? Math.floor(v * 10) / 10 : Math.floor(v * 100) / 100) + u[i];
}

/** @satisfies {Record<string, any>} */
const GD = {
    // ---- уровень и сила ---------------------------------------------------------------------
    /** Слизи до следующего уровня с уровня L. */
    need(L) { return Math.round(20 * Math.pow(1.25, Math.max(0, L - 1))); },
    /** Урон базовой атаки (хлыст) при уровне L и эволюции e. */
    damage(L, e) { return (6 + 2.2 * L) * Math.pow(2, e); },
    /** Здоровье героя. */
    heroHp(L, e) { return Math.round((150 + 18 * L) * (1 + 0.6 * e)); },
    /** Множитель слизи с тренировки. */
    evoMult(e) { return Math.pow(2, e); },
    /** Рост героя (множитель) по уровню: покрытие и масса слизи. */
    growth(L) {
        if (L < 25) return 1;
        if (L < 30) return 1.12;
        if (L < 40) return 1.25;
        if (L < 50) return 1.4;
        return Math.min(1.8, 1.4 + (L - 50) * 0.008);
    },

    // ---- эволюции -------------------------------------------------------------------------
    EVOLUTIONS: [
        { id: 0, name: { ru: 'Капля', en: 'Drip' }, glow: '#4de8ff', level: 1, wins: 0, attack: 'lash', head: 0 },
        { id: 1, name: { ru: 'Дикая слизь', en: 'Feral Goo' }, glow: '#7dff4d', level: 8, wins: 2, attack: 'spit', head: 0 },
        { id: 2, name: { ru: 'Клыкач', en: 'Fang' }, glow: '#ff3b4d', level: 14, wins: 6, attack: 'spikes', head: 1 },
        { id: 3, name: { ru: 'Шипач', en: 'Spiker' }, glow: '#ff9a2e', level: 20, wins: 14, attack: 'slam', head: 1 },
        { id: 4, name: { ru: 'Громила', en: 'Brute' }, glow: '#b05cff', level: 27, wins: 28, attack: 'storm', head: 2 },
        { id: 5, name: { ru: 'Токсик', en: 'Toxic' }, glow: '#c8ff1e', level: 35, wins: 50, attack: 'toxic', head: 2 },
        { id: 6, name: { ru: 'Пекло', en: 'Inferno' }, glow: '#ff5a1e', level: 44, wins: 85, attack: 'nova', head: 3 },
        { id: 7, name: { ru: 'Стужа', en: 'Frost' }, glow: '#7fd8ff', level: 54, wins: 140, attack: 'frost', head: 3 },
        { id: 8, name: { ru: 'Бездна', en: 'Void' }, glow: '#8a3cff', level: 66, wins: 220, attack: 'hole', head: 4 },
        { id: 9, name: { ru: 'Король бездны', en: 'Abyss King' }, glow: '#ffd23c', level: 80, wins: 340, attack: 'meteor', head: 4 },
    ],
    EVO_ADS_MAX: 7,          // роликов на эволюцию «за рекламу» при нулевом прогрессе
    EVO_ADS_MIN: 1,

    // ---- автоатаки ------------------------------------------------------------------------
    // mult — доля урона героя; cd — перезарядка (с); range — дальность поиска цели (px); radius — область.
    ATTACKS: {
        lash: { name: { ru: 'Хлыст', en: 'Lash' }, desc: { ru: 'Щупальце бьёт ближайшего врага', en: 'A tendril whips the nearest enemy' }, mult: 1.0, cd: 0.55, range: 320, icon: 'lash' },
        spit: { name: { ru: 'Плевок', en: 'Goo Spit' }, desc: { ru: 'Капли слизи летят в 3 цели', en: 'Goo blobs hit 3 targets' }, mult: 0.75, cd: 1.1, range: 850, targets: 3, icon: 'spit' },
        spikes: { name: { ru: 'Кольцо шипов', en: 'Spike Ring' }, desc: { ru: 'Шипы из земли вокруг тебя', en: 'Spikes erupt around you' }, mult: 1.5, cd: 2.8, range: 330, radius: 330, icon: 'spikes' },
        slam: { name: { ru: 'Удар о землю', en: 'Ground Slam' }, desc: { ru: 'Прыжок и ударная волна', en: 'Leap and shockwave' }, mult: 2.4, cd: 4.5, range: 460, radius: 460, icon: 'slam' },
        storm: { name: { ru: 'Буря щупалец', en: 'Tendril Storm' }, desc: { ru: 'Хлещет до 6 врагов', en: 'Whips up to 6 enemies' }, mult: 1.3, cd: 3.4, range: 650, targets: 6, icon: 'storm' },
        toxic: { name: { ru: 'Ядовитые лужи', en: 'Toxic Pools' }, desc: { ru: 'Лужи яда под врагами', en: 'Poison pools under enemies' }, mult: 0.45, cd: 5, range: 750, radius: 170, targets: 3, ticks: 6, icon: 'toxic' },
        nova: { name: { ru: 'Огненная нова', en: 'Inferno Nova' }, desc: { ru: 'Огненное кольцо расходится от тебя', en: 'A ring of fire bursts out' }, mult: 2.2, cd: 6, range: 650, radius: 650, icon: 'nova' },
        frost: { name: { ru: 'Ледяные пики', en: 'Frost Spikes' }, desc: { ru: 'Поле ледяных пик, враги замедлены', en: 'Ice spike field, enemies slowed' }, mult: 1.8, cd: 6.5, range: 520, radius: 520, icon: 'frost' },
        hole: { name: { ru: 'Чёрная дыра', en: 'Black Hole' }, desc: { ru: 'Стягивает врагов и рвёт их', en: 'Pulls enemies in and shreds them' }, mult: 0.9, cd: 9, range: 700, radius: 600, ticks: 6, icon: 'hole' },
        meteor: { name: { ru: 'Метеоры бездны', en: 'Abyss Meteors' }, desc: { ru: 'Дождь метеоров по врагам', en: 'Meteor rain on enemies' }, mult: 3.5, cd: 10, range: 1100, radius: 190, targets: 8, icon: 'meteor' },
    },
    /** Открытые атаки для эволюции e (по порядку открытия). */
    attacksFor(e) { return this.EVOLUTIONS.slice(0, e + 1).map((v) => v.attack); },

    // ---- покрытие тела слизью (уровень -> куски) ------------------------------------------------
    COVERAGE: [
        { level: 1, pieces: ['buddy'] },
        { level: 3, pieces: ['armR'] },
        { level: 5, pieces: ['head'] },
        { level: 8, pieces: ['armL'] },
        { level: 12, pieces: ['torso'] },
        { level: 16, pieces: ['legs'] },
        { level: 20, tendrils: 2 },
        { level: 25, tendrils: 4 },
        { level: 30, spikes: true },
        { level: 40, tendrils: 6 },
    ],
    /** Состояние покрытия на уровне L: { buddy, armR, head, armL, torso, legs, tendrils, spikes }. */
    coverage(L) {
        const c = { buddy: false, armR: false, head: false, armL: false, torso: false, legs: false, tendrils: 0, spikes: false };
        for (const s of this.COVERAGE) {
            if (L < s.level) break;
            if (s.pieces) for (const p of s.pieces) c[p] = true;
            if (s.tendrils) c.tendrils = s.tendrils;
            if (s.spikes) c.spikes = true;
        }
        if (c.head) c.buddy = false;           // слизень-малыш стал головой
        return c;
    },
    /** Следующая ступень покрытия после уровня L или null. */
    nextCoverage(L) { return this.COVERAGE.find((s) => s.level > L) || null; },

    // ---- тренировочные площадки лобби -----------------------------------------------------------
    // gain — слизи за тик; req — что нужно для доступа.
    PADS: [
        { id: 1, gain: 1, level: 1, evo: 0, color: '#d8e0ea' },
        { id: 2, gain: 3, level: 3, evo: 0, color: '#5df07a' },
        { id: 3, gain: 10, level: 8, evo: 0, color: '#36d8ff' },
        { id: 4, gain: 40, level: 1, evo: 2, color: '#b05cff' },
        { id: 5, gain: 160, level: 1, evo: 4, color: '#ff9a2e' },
        { id: 6, gain: 700, level: 1, evo: 6, color: '#ff3b4d' },
        { id: 7, gain: 3000, level: 1, evo: 8, color: '#ffd23c' },
    ],
    PAD_TICK: 0.6,           // с между тиками тренировки

    // ---- миры и стадии --------------------------------------------------------------------------
    WORLDS: [
        { id: 1, map: 'world-1', name: { ru: 'Город', en: 'City' }, color: '#ffb347', music: 'arena' },
        { id: 2, map: 'world-2', name: { ru: 'Лаборатория', en: 'Laboratory' }, color: '#5df07a', music: 'arena' },
        { id: 3, map: 'world-3', name: { ru: 'Бездна', en: 'The Void' }, color: '#b05cff', music: 'arena' },
    ],
    // Стадия: мир, новый моб, рекомендуемые уровень/эволюция, победы за прохождение, босс.
    STAGES: [
        { world: 1, mob: 'walker', pool: ['walker'], rec: [3, 0], wins: 1 },
        { world: 1, mob: 'prisoner', pool: ['walker', 'prisoner'], rec: [5, 0], wins: 1 },
        { world: 1, mob: 'cop', pool: ['prisoner', 'cop'], rec: [6, 0], wins: 2 },
        { world: 1, mob: 'soldier', pool: ['cop', 'soldier', 'walker'], rec: [7, 0], wins: 2 },
        { world: 1, mob: 'rugby', pool: ['soldier', 'rugby', 'prisoner'], rec: [9, 1], wins: 3 },
        { world: 1, mob: 'boss1', pool: ['rugby', 'soldier', 'cop'], rec: [11, 1], wins: 5, boss: 'boss1' },
        { world: 2, mob: 'medic', pool: ['medic'], rec: [14, 2], wins: 4 },
        { world: 2, mob: 'hazmat', pool: ['medic', 'hazmat'], rec: [17, 2], wins: 4 },
        { world: 2, mob: 'fireman', pool: ['hazmat', 'fireman'], rec: [20, 3], wins: 5 },
        { world: 2, mob: 'miner', pool: ['fireman', 'miner', 'medic'], rec: [24, 3], wins: 6 },
        { world: 2, mob: 'bloater', pool: ['miner', 'bloater', 'hazmat'], rec: [28, 4], wins: 7 },
        { world: 2, mob: 'boss2', pool: ['bloater', 'miner', 'fireman'], rec: [32, 4], wins: 10, boss: 'boss2' },
        { world: 3, mob: 'skeleton', pool: ['skeleton'], rec: [36, 5], wins: 12 },
        { world: 3, mob: 'ghost', pool: ['skeleton', 'ghost'], rec: [41, 6], wins: 13 },
        { world: 3, mob: 'mummy', pool: ['ghost', 'mummy'], rec: [46, 6], wins: 15 },
        { world: 3, mob: 'vampire', pool: ['mummy', 'vampire', 'skeleton'], rec: [52, 7], wins: 17 },
        { world: 3, mob: 'werewolf', pool: ['vampire', 'werewolf', 'ghost'], rec: [58, 7], wins: 19 },
        { world: 3, mob: 'boss3', pool: ['werewolf', 'vampire', 'mummy'], rec: [66, 8], wins: 25, boss: 'boss3' },
    ],
    /** Волны стадии i: [{ count, pool }]. Последняя волна босса — с боссом. */
    waves(i) {
        const st = this.STAGES[i];
        const n = Math.min(4, 2 + Math.floor((i % 6) / 2));
        const out = [];
        for (let w = 0; w < n; w++) out.push({ count: Math.min(14, 5 + (i % 6) + w * 2), pool: st.pool });
        if (st.boss) out.push({ count: 3, pool: st.pool, boss: st.boss });
        return out;
    },
    /** Здоровье и урон обычного моба на стадии i: рассчитаны от рекомендуемых сил героя. */
    mobStats(i) {
        const st = this.STAGES[i];
        const dmg = this.damage(st.rec[0], st.rec[1]);
        const hp = this.heroHp(st.rec[0], st.rec[1]);
        return { hp: Math.round(dmg * 2.8), dmg: Math.max(2, Math.round(hp / 34)), slime: Math.round(this.need(st.rec[0]) * 0.06) + 1, gems: 1 };
    },

    // ---- мобы (модели — копии из ShootMonsters, своё процедурное движение) ---------------------
    // hp/dmg/speed — множители к mobStats; kind: melee | ranged | charger | float; scale — к модели 240 px.
    MOBS: {
        walker: { model: 'assets/models/enemies/mon-walker-1.glb', hp: 1, dmg: 1, speed: 150, kind: 'melee', scale: 0.82 },
        prisoner: { model: 'assets/models/enemies/mon-prisoner-1.glb', hp: 0.9, dmg: 1, speed: 210, kind: 'melee', scale: 0.82 },
        cop: { model: 'assets/models/enemies/mon-cop-1.glb', hp: 1.3, dmg: 1.2, speed: 170, kind: 'melee', scale: 0.84 },
        soldier: { model: 'assets/models/enemies/mon-soldier-1.glb', hp: 1.1, dmg: 0.9, speed: 160, kind: 'ranged', scale: 0.84 },
        rugby: { model: 'assets/models/enemies/mon-rugby-1.glb', hp: 1.6, dmg: 1.3, speed: 230, kind: 'charger', scale: 0.88 },
        boss1: { model: 'assets/models/enemies/mon-brute-3.glb', hp: 28, dmg: 3, speed: 150, kind: 'boss', scale: 1.9, name: { ru: 'Зомби-громила', en: 'Zombie Brute' } },
        medic: { model: 'assets/models/enemies/mon-medic-1.glb', hp: 1, dmg: 1, speed: 180, kind: 'melee', scale: 0.84 },
        hazmat: { model: 'assets/models/enemies/mon-hazmat-1.glb', hp: 1.2, dmg: 1, speed: 150, kind: 'ranged', scale: 0.86 },
        fireman: { model: 'assets/models/enemies/mon-fireman-1.glb', hp: 1.5, dmg: 1.2, speed: 170, kind: 'melee', scale: 0.86 },
        miner: { model: 'assets/models/enemies/mon-miner-1.glb', hp: 1.4, dmg: 1.4, speed: 175, kind: 'melee', scale: 0.86 },
        bloater: { model: 'assets/models/enemies/mon-bloater-1.glb', hp: 2.6, dmg: 1.6, speed: 120, kind: 'melee', scale: 0.9 },
        boss2: { model: 'assets/models/enemies/mon-bloater-2.glb', hp: 30, dmg: 3, speed: 135, kind: 'boss', scale: 1.9, name: { ru: 'Мега-толстяк', en: 'Mega Bloater' } },
        skeleton: { model: 'assets/models/enemies/mon-skeleton-1.glb', hp: 0.9, dmg: 1.1, speed: 220, kind: 'melee', scale: 0.84 },
        ghost: { model: 'assets/models/enemies/mon-ghost-1.glb', hp: 1, dmg: 1, speed: 160, kind: 'float', scale: 0.86 },
        mummy: { model: 'assets/models/enemies/mon-mummy-1.glb', hp: 1.8, dmg: 1.2, speed: 140, kind: 'melee', scale: 0.88 },
        vampire: { model: 'assets/models/enemies/mon-vampire-1.glb', hp: 1.3, dmg: 1.4, speed: 250, kind: 'charger', scale: 0.86 },
        werewolf: { model: 'assets/models/enemies/mon-werewolf-1.glb', hp: 2, dmg: 1.6, speed: 240, kind: 'charger', scale: 0.92 },
        boss3: { model: 'assets/models/enemies/mon-demon-2.glb', hp: 34, dmg: 3.2, speed: 160, kind: 'boss', scale: 2.1, name: { ru: 'Демон бездны', en: 'Void Demon' } },
    },

    // ---- подарки за время игры (минуты от начала сессии) ----------------------------------------
    PLAYTIME: [
        { min: 1, reward: { gems: 25 } },
        { min: 3, reward: { boost: 'slime2', sec: 180 } },
        { min: 5, reward: { slimeLevels: 1 } },
        { min: 8, reward: { wins: 2 } },
        { min: 12, reward: { gems: 80 } },
        { min: 16, reward: { boost: 'wins2', sec: 300 } },
        { min: 20, reward: { slimeLevels: 2 } },
        { min: 26, reward: { gems: 150 } },
        { min: 32, reward: { wins: 6 } },
        { min: 40, reward: { gems: 300 } },
    ],

    // ---- бусты за рекламу ---------------------------------------------------------------------
    BOOSTS: {
        slime2: { sec: 300, name: { ru: 'x2 слизь', en: 'x2 Slime' } },
        wins2: { sec: 600, name: { ru: 'x2 победы', en: 'x2 Wins' } },
        speed2: { sec: 180, name: { ru: 'x2 скорость атак', en: 'x2 Attack speed' } },
    },
};
