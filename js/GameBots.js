// GameBots.js — боты-«игроки» в лобби: живые человечки со своей слизью, ходят по площадкам, качаются, растут, болтают
// в чате и уходят/приходят через портал. Это имитация онлайна (как в Roblox-играх): никакой сети и чужих данных.
//
//   GameBots.prepareLobby(app, ctx)  — под загрузкой лобби (после героя, площадок и зон); ctx = { pads, zones }
//   GameBots.update(dt)              — каждый кадр лобби (на паузе не вызывается)
//   GameBots.clear()                 — смена карты: все меши, материалы, DOM и подписки бота убираются
//
// Тело — HumanoidCharacter на общем navWorld, слизь — SlimeBody с jelly = false (без пер-вершинной деформации).
// ИИ бота: ходьба по Nav.path к площадке (pad.level <= уровень и pad.evo <= эволюция) → тренировка («+N», отскок слизи,
// редкий уровень/эволюция) → прогулка / киоск / алтарь → портал («ушёл на арену») → через время новый бот выходит из портала.
// Ники над головой и пузыри реплик — DOM-слой, чат-лог внизу слева (подстраивается под HUD, прячется на тесных экранах).

Object.assign(LANG_STRINGS.ru, {
    'bots.lv': 'Ур. {n}',
    'bots.levelUp': 'Уровень {n}!',
    'bots.evolved': 'Эволюция!',
    'bots.joined': '{name} зашёл в игру',
    'bots.portalIn': '{name} ушёл на арену',
    'bots.portalOut': '{name} вернулся с арены',
});
Object.assign(LANG_STRINGS.en, {
    'bots.lv': 'Lv. {n}',
    'bots.levelUp': 'Level {n}!',
    'bots.evolved': 'Evolved!',
    'bots.joined': '{name} joined the game',
    'bots.portalIn': '{name} left for the arena',
    'bots.portalOut': '{name} is back from the arena',
});

/** @satisfies {Record<string, any>} */
const GameBots = {
    // ---- данные внешности -------------------------------------------------------------------------
    // Оттенки кожи — только реалистичные (никакого «жёлтого нуба»), одежда — из нейтральной палитры без классики «синий + зелёный».
    SKINS: [[244, 214, 176], [232, 185, 143], [201, 142, 99], [156, 106, 69], [109, 70, 48], [255, 224, 194], [222, 168, 128]],
    TOPS: [[229, 72, 77], [142, 78, 198], [18, 165, 148], [247, 107, 21], [214, 64, 159], [28, 28, 40], [238, 240, 245], [245, 165, 36],
        [90, 110, 160], [160, 60, 60], [60, 140, 120], [200, 200, 80], [255, 120, 150], [70, 70, 90]],
    BOTTOMS: [[42, 47, 69], [59, 47, 42], [74, 69, 96], [92, 92, 102], [30, 30, 40], [110, 80, 60], [60, 70, 90], [130, 60, 90], [40, 90, 100]],
    NAMES_FALLBACK: {
        ru: ['Слимыч', 'Тёмчик', 'Клякса', 'Бульк', 'Гуля', 'Мракобес', 'ЧёрныйКот', 'Лизун', 'Капелька', 'Пупсик', 'Жижа', 'Вжух', 'Шустрик', 'Турбо', 'Рыжик', 'Ниндзя'],
        en: ['Slimey', 'Gooey', 'Blobby', 'DarkDrip', 'Inkling', 'Squish', 'Goober', 'Nova', 'Turbo', 'Pixel', 'Muffin', 'Comet', 'Bolt', 'Hopper', 'Toast', 'Ziggy'],
    },

    // ---- реплики (ru / en). Без ссылок и личных данных. {n} — число, {name} — ник/эволюция ---------------------
    LINES: {
        ru: {
            farm: ['кто фармит 3 площадку?', 'го качаться вместе', 'на площадке с большим плюсом быстрее', 'кто идёт на арену?', 'мне чуть-чуть до эволюции', 'кто уже эволюционировал?',
                'качаюсь до {n} уровня', 'слизь растёт, красота', 'а вы на какой площадке?', 'нужен уровень повыше для новой площадки', 'арена на 2 мир тяжёлая', 'босс одолел меня('],
            cosm: ['у кого такая слизь крутая?', 'хочу радужную слизь', 'кто что купил в магазине?', 'классные глаза у слизи', 'надо накопить на магазин', 'лава слизь — огонь'],
            ask: ['ты на какой эволюции?', 'какой уровень у всех?', 'кто тут самый сильный?'],
            askR: ['у меня {n}', '{n} уровень, а у тебя?', 'только {n}', 'уже {n}!'],
            lvR: ['ого, быстро качаешься!', 'гг, {n} уровень!', 'красава', 'ты профи?', 'ого {n} уровень', 'го на арену вместе'],
            evR: ['ВАУ эволюция!', 'ого, ты эволюционировал!', 'гг, какая слизь!', 'красиво эволюционировал', 'круто! я тоже хочу'],
            evB: ['ура, эволюция!', 'я эволюционировал!', 'наконец-то новая форма', 'теперь можно на новую площадку'],
            lvB: ['новый уровень!', 'ура {n}!', 'растём)'],
            leave: ['иду на арену!', 'го на арену, пока!', 'побегу бить мобов', 'я на арену', 'ухожу сражаться'],
            back: ['арена огонь', 'вернулся, вот это мобы', 'прошёл стадию!', 'на арене жарко', 'я снова тут'],
        },
        en: {
            farm: ['who farms pad 3?', 'lets grind together', 'the bigger pad is way faster', 'who is going to the arena?', 'almost at my evolution', 'who already evolved?',
                'grinding to level {n}', 'my slime is growing, nice', 'which pad are you on?', 'need a higher level for the next pad', 'world 2 arena is tough', 'the boss got me('],
            cosm: ['who has that cool slime?', 'i want rainbow slime', 'what did you buy in the shop?', 'nice slime eyes', 'saving up for the shop', 'lava slime is fire'],
            ask: ['what evolution are you?', 'what level is everyone?', 'who is the strongest here?'],
            askR: ['im {n}', 'level {n}, you?', 'only {n}', 'already {n}!'],
            lvR: ['whoa, you level fast!', 'gg, level {n}!', 'nice one', 'are you a pro?', 'wow level {n}', 'lets go to the arena together'],
            evR: ['WOW evolution!', 'you evolved! nice', 'gg, what a slime!', 'sweet evolution', 'cool! i want that too'],
            evB: ['yay, evolution!', 'i evolved!', 'finally a new form', 'now i can use a new pad'],
            lvB: ['level up!', 'yay {n}!', 'growing)'],
            leave: ['going to the arena!', 'arena time, bye!', 'off to smash mobs', 'to the arena', 'heading out to fight'],
            back: ['arena is fire', 'back, those mobs are wild', 'cleared the stage!', 'its hot in the arena', 'im back'],
        },
    },

    // ---- состояние ---------------------------------------------------------------------------------
    /** @type {any[]} */ list: [],
    /** @type {any} */ app: null,
    /** @type {any} */ view: null,
    /** @type {any} */ ctx: null,
    /** @type {any} */ world: null,
    /** @type {HTMLElement | null} */ layer: null,
    /** @type {HTMLElement | null} */ logEl: null,
    /** @type {HTMLStyleElement | null} */ styleEl: null,
    /** @type {any[]} */ tagPool: [],
    /** @type {any[]} */ logLines: [],
    /** @type {any[]} */ events: [],      // отложенные действия { t, fn }
    /** @type {any[]} */ joins: [],        // ждущие захода { t, ident }
    /** @type {any[]} */ cleanups: [],
    unsub: null,
    gen: 0,
    target: 0,
    time: 0, chatT: 8, layoutT: 0, popTokens: 3, lastReact: -99, lastSay: -99,
    ready: false,
    maxLines: 5,

    // ---- вспомогательное ---------------------------------------------------------------------------
    rnd() { return Math.random(); },
    rr(a, b) { return a + Math.random() * (b - a); },
    pickOf(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    lang() { return typeof Lang !== 'undefined' && String(Lang.code).startsWith('ru') ? 'ru' : 'en'; },
    tx(k, p) { return Lang.t(k, p); },

    botCount() {
        if (typeof IS_MOBILE !== 'undefined' && IS_MOBILE) return 3;
        if (typeof Quality !== 'undefined' && Quality.level === 0) return 2;
        return 4 + Math.floor(Math.random() * 4);   // 4..7
    },

    maxEvoFor(level) {
        let e = 0;
        for (let i = 0; i < GD.EVOLUTIONS.length && i <= 8; i++) if (level >= GD.EVOLUTIONS[i].level) e = i;
        return e;
    },

    /** Новая личность: ник, внешность, уровень и эволюция, согласованные друг с другом. */
    makeIdentity(used) {
        const lang = this.lang();
        const pool = (typeof ObbyBots !== 'undefined' && ObbyBots.NAMES && ObbyBots.NAMES[lang]) || this.NAMES_FALLBACK[lang];
        let name = this.pickOf(pool);
        for (let i = 0; i < 12 && used.includes(name); i++) name = this.pickOf(pool);
        if (used.includes(name)) name += Math.floor(this.rr(2, 99));
        const level = Math.max(1, Math.min(70, Math.round(1 + 69 * Math.pow(this.rnd(), 1.7))));
        const maxE = this.maxEvoFor(level), r = this.rnd();
        const evo = Math.max(0, maxE - (r < 0.55 ? 0 : r < 0.88 ? 1 : 2));
        const pub = (rows) => rows.filter((r) => r[5] !== 'daily');   // эксклюзивы Подарка дня — только у игрока
        const goo = this.pickOf(pub(GameShopData.GOO))[0], eyes = this.pickOf(pub(GameShopData.EYES))[0];
        return {
            name, level, evo, look: { goo, eyes },
            colors: { skin: this.pickOf(this.SKINS), top: this.pickOf(this.TOPS), bottom: this.pickOf(this.BOTTOMS) },
        };
    },

    // ---- DOM ---------------------------------------------------------------------------------------
    ensureDom() {
        if (this.layer) return;
        const st = document.createElement('style');
        st.textContent = `
#gb-layer{position:fixed;inset:0;pointer-events:none;z-index:25;overflow:hidden;contain:strict}
.gb-tag{position:absolute;left:0;top:0;display:flex;flex-direction:column;align-items:center;white-space:nowrap;will-change:transform;
  font-family:var(--game-font,'Rubik',system-ui,sans-serif);font-weight:900;color:#fff;transform-origin:50% 100%}
.gb-tag b{font-size:15px;line-height:1.05;-webkit-text-stroke:3.5px #120a1c;paint-order:stroke fill;text-shadow:0 2px 0 #120a1c}
.gb-tag small{font-size:11.5px;line-height:1.1;margin-top:1px;-webkit-text-stroke:3px #120a1c;paint-order:stroke fill;text-shadow:0 0 6px var(--g,#4de8ff)}
.gb-say{display:none;max-width:190px;margin-bottom:4px;padding:3px 9px;border-radius:12px;background:rgba(255,255,255,.93);color:#14101f;
  font-size:13px;font-weight:800;line-height:1.2;white-space:normal;text-align:center;-webkit-text-stroke:0;text-shadow:none;box-shadow:0 2px 0 rgba(0,0,0,.35)}
#gb-log{position:fixed;left:8px;bottom:10px;width:260px;z-index:29;pointer-events:none;display:none;flex-direction:column;gap:2px;
  font-family:var(--game-font,var(--gh-font,'Rubik',system-ui,sans-serif));font-size:13px;font-weight:700;line-height:1.25;color:#e9e6f5}
#gb-log div{padding:2px 8px;border-radius:8px;border-left:3px solid var(--evo,#4de8ff);background:linear-gradient(90deg,rgba(10,10,18,.62),rgba(10,10,18,.38));
  text-shadow:0 1px 0 rgba(0,0,0,.7);overflow-wrap:anywhere;transition:opacity .4s}
#gb-log div.sys{border-left-color:rgba(255,255,255,.25);color:#b9b4cc;font-style:italic;font-weight:600}
#gb-log b{font-weight:900}`;
        document.head.appendChild(st);
        this.styleEl = st;
        const layer = document.createElement('div');
        layer.id = 'gb-layer';
        document.body.appendChild(layer);
        this.layer = layer;
        const log = document.createElement('div');
        log.id = 'gb-log';
        document.body.appendChild(log);
        this.logEl = log;
    },

    acquireTag() {
        let t = this.tagPool.pop();
        if (!t) {
            const el = document.createElement('div');
            el.className = 'gb-tag';
            const say = document.createElement('div'); say.className = 'gb-say';
            const b = document.createElement('b'), s = document.createElement('small');
            el.appendChild(say); el.appendChild(b); el.appendChild(s);
            t = { el, say, b, s, shown: false };
        }
        if (this.layer && !t.el.parentNode) this.layer.appendChild(t.el);
        t.el.style.display = 'none'; t.shown = false;
        return t;
    },

    releaseTag(t) {
        if (!t) return;
        t.el.style.display = 'none'; t.say.style.display = 'none';
        this.tagPool.push(t);
    },

    // ---- чат ---------------------------------------------------------------------------------------
    line(cat, vars) {
        const L = this.lang();
        const mine = this.LINES[L][cat];
        if (mine && mine.length) return this.pickOf(mine).replace(/\{(\w+)\}/g, (m, k) => (vars && k in vars ? String(vars[k]) : m));
        return '';
    },

    /** Строка из общего ObbyChat (hi / hiReply / bye / ask / answer) или своя. */
    shared(cat, vars) {
        try {
            if (typeof ObbyChat !== 'undefined') { const s = ObbyChat.pick(this.lang(), cat, Math.random, vars); if (s) return s; }
        } catch (e) { /* без общих строк */ }
        return '';
    },

    addLog(text, color, who, sys) {
        if (!this.logEl) return;
        const el = document.createElement('div');
        if (sys) { el.className = 'sys'; el.textContent = text; }
        else {
            const b = document.createElement('b');
            b.style.color = color || '#fff';
            b.textContent = who + ': ';
            el.appendChild(b);
            el.appendChild(document.createTextNode(text));
        }
        this.logEl.appendChild(el);
        this.logLines.push({ el, age: 0 });
        while (this.logLines.length > 12) { const o = this.logLines.shift(); if (o) o.el.remove(); }
        this.applyLogLimit();
    },

    applyLogLimit() {
        const n = this.logLines.length, lim = this.maxLines;
        for (let i = 0; i < n; i++) {
            const o = this.logLines[i];
            const fromEnd = n - 1 - i;
            o.el.style.display = fromEnd < lim ? '' : 'none';
            o.el.style.opacity = fromEnd >= lim ? '0' : String(Math.max(0.35, 1 - fromEnd * 0.16 - Math.max(0, o.age - 14) * 0.05));
        }
        // пустой лог не рисуется
        const any = this.logLines.some((o) => o.el.style.display !== 'none');
        this.logEl.dataset.empty = any ? '' : '1';
    },

    say(bot, text, opts) {
        if (!bot || !text || bot.dead) return;
        const o = opts || {};
        bot.sayT = o.dur || Math.min(6, 2.6 + text.length * 0.06);
        if (bot.tag) { bot.tag.say.textContent = text; bot.tag.say.style.display = ''; }
        this.addLog(text, GD.EVOLUTIONS[bot.evo].glow, bot.name, false);
        this.lastSay = this.time;
    },

    later(sec, fn) { this.events.push({ t: this.time + sec, fn }); },

    activeBots() { return this.list.filter((b) => !b.dead && b.state !== 'enter' && b.state !== 'spawn'); },

    chatTick() {
        const bots = this.activeBots();
        if (!bots.length) return;
        const b = this.pickOf(bots);
        const r = this.rnd();
        if (r < 0.34) this.say(b, this.line('farm', { n: Math.min(70, b.level + Math.ceil(this.rr(1, 6))) }));
        else if (r < 0.5) this.say(b, this.line('cosm'));
        else if (r < 0.66 && bots.length > 1) {
            const q = this.rnd() < 0.5 ? this.line('ask') : this.shared('ask');
            this.say(b, q);
            const a = this.pickOf(bots.filter((x) => x !== b));
            if (a) this.later(this.rr(2.2, 3.6), () => this.say(a, this.line('askR', { n: a.level })));
        } else if (r < 0.8) {
            this.say(b, this.line('farm', { n: Math.min(70, b.level + 3) }));
        } else {
            this.say(b, this.shared('hi') || this.line('farm', { n: b.level }));
        }
    },

    onState(e) {
        if (!e || !this.ready) return;
        if (e.type === 'level' && this.time - this.lastReact > 18 && this.rnd() < 0.45) {
            this.lastReact = this.time;
            this.later(this.rr(1.4, 3.2), () => { const b = this.pickOf(this.activeBots()); if (b) this.say(b, this.line('lvR', { n: e.to })); });
        } else if (e.type === 'evo' && this.rnd() < 0.9) {
            this.lastReact = this.time;
            this.later(this.rr(1.6, 3.4), () => { const b = this.pickOf(this.activeBots()); if (b) this.say(b, this.line('evR')); });
        }
    },

    // ---- создание бота -----------------------------------------------------------------------------
    async makeBot(ident, x, y, heading) {
        const view = this.view;
        const ch = HumanoidCharacter.create(view, { world: this.world, x, y, heading, colors: ident.colors, name: 'bot' });
        const bot = Object.assign({}, ident, {
            ch, slime: null, growth: GD.growth(ident.level), growthNow: GD.growth(ident.level), shrink: 1,
            state: 'idle', stateT: this.rr(0.5, 3), path: null, pi: 0, dest: null, pad: null, slot: -1,
            tickT: this.rr(0, 0.6), lvlT: this.rr(14, 46), jumpT: this.rr(4, 14), sayT: 0, stuckT: 0, lx: x, ly: y,
            life: this.rr(70, 190), age: 0, sprint: this.rnd() < 0.3, tag: null, dead: false, vis: false, ret: false,
            sx: 0, sy: 0, evoWait: 0,
        });
        ch.setBody(Humanoid.HEIGHT * bot.growthNow, bot.growthNow);
        ch.on('land', () => { if (bot.slime) bot.slime.bounce(0.4); });
        try {
            const sl = new SlimeBody(view, ch.model);
            sl.shadows = false;   // слизь ботов без теней: карта теней дешевле
            sl.jelly = false;
            await sl.load();
            sl.setEvo(bot.evo);
            sl.applyLook(bot.look);
            sl.setLevel(bot.level, false);
            bot.slime = sl;
        } catch (e) { console.warn('GameBots: slime', e); }
        bot.tag = this.acquireTag();
        bot.tag.b.textContent = bot.name;
        this.paintTag(bot);
        return bot;
    },

    paintTag(bot) {
        const glow = GD.EVOLUTIONS[bot.evo].glow;
        bot.tag.s.textContent = this.tx('bots.lv', { n: bot.level });
        bot.tag.s.style.color = glow;
        bot.tag.el.style.setProperty('--g', glow);
    },

    disposeBot(bot) {
        if (bot.dead) return;
        bot.dead = true;
        if (bot.pad) this.freeSlot(bot);
        this.releaseTag(bot.tag); bot.tag = null;
        // материалы волос SlimeBody не освобождает (меш снимается раньше) — собираем и чистим сами
        const hairMats = [];
        try { if (bot.slime && bot.slime.hair) for (const m of bot.slime.hair.getChildMeshes(false)) if (m.material) hairMats.push(m.material); } catch (e) { /* нет волос */ }
        try { if (bot.slime) bot.slime.dispose(); } catch (e) { /* уже снят */ }
        for (const m of hairMats) { try { m.dispose(false, true); } catch (e) { /* уже снят */ } }
        bot.slime = null;
        try { bot.ch.dispose(); } catch (e) { /* уже снят */ }
    },

    // ---- площадки ----------------------------------------------------------------------------------
    padsFor(bot) {
        return this.ctx.pads.filter((p) => p.pad.level <= bot.level && p.pad.evo <= bot.evo);
    },

    slotPos(p, k) {
        const a = k * 2.399 + p.x * 0.01, rad = p.r * (k === 0 ? 0.2 : 0.62);
        const x = p.x + Math.cos(a) * rad, y = p.y + Math.sin(a) * rad;
        return Nav.blocked(x, y, 24) ? { x: p.x, y: p.y } : { x, y };
    },

    takeSlot(bot, p) {
        p.slots = p.slots || [];
        const hx = Hero.x, hy = Hero.y;
        for (let k = 0; k < 6; k++) {
            if (p.slots[k] && !p.slots[k].dead) continue;
            const s = this.slotPos(p, k);
            if (Math.hypot(s.x - hx, s.y - hy) < 120) continue;
            p.slots[k] = bot; bot.pad = p; bot.slot = k;
            return s;
        }
        return null;
    },

    freeSlot(bot) {
        const p = bot.pad;
        if (p && p.slots && p.slots[bot.slot] === bot) p.slots[bot.slot] = null;
        bot.pad = null; bot.slot = -1;
    },

    // ---- навигация ---------------------------------------------------------------------------------
    goTo(bot, x, y, kind, onArrive) {
        const f = Nav.nearestFree(x, y, 30);
        let path = null;
        try { path = Nav.path(bot.ch.x, bot.ch.y, f.x, f.y, 30, { partial: true }); } catch (e) { path = null; }
        if (!path || !path.length) path = [{ x: f.x, y: f.y }];
        bot.path = path; bot.pi = 0; bot.dest = { x: f.x, y: f.y, kind, onArrive };
        bot.state = 'walk'; bot.stuckT = 0;
    },

    homePoint() {
        const z = this.ctx.zones.portal, p = this.ctx.pads;
        let sx = 0, sy = 0, n = 0;
        for (const q of p) { sx += q.x; sy += q.y; n++; }
        if (z) { sx += z.x; sy += z.y; n++; }
        return n ? { x: sx / n, y: sy / n } : { x: Hero.x, y: Hero.y };
    },

    wander(bot) {
        const c = this.homePoint();
        const base = this.rnd() < 0.5 ? this.pickOf(this.ctx.pads) || c : c;
        const a = this.rr(0, 6.283), d = this.rr(120, 520);
        this.goTo(bot, base.x + Math.cos(a) * d, base.y + Math.sin(a) * d, 'wander', (b) => { b.state = 'idle'; b.stateT = this.rr(1.5, 5); });
    },

    chooseGoal(bot) {
        const r = this.rnd();
        if (bot.age > bot.life) return this.leave(bot);
        const z = this.ctx.zones;
        if (r < 0.62) {
            const ps = this.padsFor(bot).sort((a, b) => b.pad.gain - a.pad.gain);
            // чаще лучшая из доступных, иногда любая
            const order = this.rnd() < 0.65 ? ps : ps.slice().sort(() => Math.random() - 0.5);
            for (const p of order) {
                const s = this.takeSlot(bot, p);
                if (s) return this.goTo(bot, s.x, s.y, 'pad', (b) => this.startTrain(b));
            }
            return this.wander(bot);
        }
        if (r < 0.75 && z.shop) return this.goTo(bot, z.shop.x + this.rr(-60, 60), z.shop.y + this.rr(-60, 60) + 110, 'shop', (b) => { b.state = 'idle'; b.stateT = this.rr(3, 8); });
        if (r < 0.84 && z.evolve) return this.goTo(bot, z.evolve.x + this.rr(-70, 70), z.evolve.y + 130, 'evolve', (b) => { b.state = 'idle'; b.stateT = this.rr(3, 7); });
        return this.wander(bot);
    },

    startTrain(bot) {
        bot.state = 'train'; bot.stateT = this.rr(14, 38); bot.tickT = this.rr(0.2, 0.6);
    },

    leave(bot) {
        if (bot.pad) this.freeSlot(bot);
        const z = this.ctx.zones.portal;
        if (!z) { bot.dead = true; return; }
        bot.leaving = true;
        this.goTo(bot, z.x, z.y, 'portal', (b) => this.enterPortal(b));
        if (this.rnd() < 0.7) this.say(bot, this.line('leave'));
    },

    enterPortal(bot) {
        bot.state = 'enter'; bot.stateT = 0;
        const z = this.ctx.zones.portal;
        GameFx.play('portal', bot.ch.x, bot.ch.y, bot.ch.h, { duration: 0.6, rate: 60 });
        if (this.near(bot, 2500)) GameSfx.play('portal', 0.3);
        this.addLog(this.tx('bots.portalIn', { name: bot.name }), '', '', true);
        void z;
    },

    near(bot, d) { return Math.hypot(bot.ch.x - Hero.x, bot.ch.y - Hero.y) < d; },

    // ---- заход ботов -------------------------------------------------------------------------------
    scheduleJoin(delay, ident) {
        this.joins.push({ t: this.time + delay, ident: ident || null });
    },

    async spawnAtPortal(ident) {
        const gen = this.gen, z = this.ctx.zones.portal;
        const used = this.list.map((b) => b.name);
        const id = ident || this.makeIdentity(used);
        const a = this.rr(0, 6.283);
        const f = Nav.nearestFree((z ? z.x : Hero.x) + Math.cos(a) * 90, (z ? z.y : Hero.y) + Math.sin(a) * 90, 30);
        const bot = await this.makeBot(id, f.x, f.y, a + Math.PI);
        if (gen !== this.gen) { this.disposeBot(bot); return; }
        bot.state = 'spawn'; bot.stateT = 0; bot.shrink = 0.15; bot.growthNow = bot.growth * 0.15; bot.ch.setBody(Humanoid.HEIGHT * bot.growthNow, bot.growthNow);
        this.list.push(bot);
        GameFx.play('portal', f.x, f.y, bot.ch.h, { duration: 0.6, rate: 60 });
        if (this.near(bot, 2500)) GameSfx.play('portal', 0.25);
        const back = !!id.ret;
        this.addLog(this.tx(back ? 'bots.portalOut' : 'bots.joined', { name: bot.name }), '', '', true);
        this.later(this.rr(2.5, 6), () => { this.say(bot, back ? this.line('back') : (this.shared('hi') || this.line('farm', { n: bot.level }))); });
    },

    // ---- основной вход -----------------------------------------------------------------------------
    async prepareLobby(app, ctx) {
        this.clear();
        const gen = ++this.gen;
        this.app = app; this.view = app.location.view; this.ctx = ctx || { pads: [], zones: {} };
        if (!this.ctx.pads || !this.ctx.pads.length) return;
        this.ensureDom();
        this.world = CharacterPhysics.navWorld(Nav);
        this.time = 0; this.chatT = this.rr(7, 11); this.popTokens = 3; this.lastReact = -99;
        this.target = this.botCount();
        const used = [];
        for (let i = 0; i < this.target; i++) {
            const id = this.makeIdentity(used); used.push(id.name);
            const probe = { level: id.level, evo: id.evo, name: id.name };
            let x, y, state = 'idle';
            const pads = this.padsFor(probe);
            const p = i % 5 < 3 && pads.length ? this.pickOf(pads) : null;
            const slotted = p ? this.slotCandidate(p) : null;
            if (slotted) { x = slotted.x; y = slotted.y; state = 'train'; }
            else {
                const c = this.homePoint(), a = this.rr(0, 6.283), d = this.rr(150, 600);
                const f = Nav.nearestFree(c.x + Math.cos(a) * d, c.y + Math.sin(a) * d, 30);
                x = f.x; y = f.y;
            }
            const bot = await this.makeBot(id, x, y, this.rr(-3, 3));
            if (gen !== this.gen) { this.disposeBot(bot); return; }
            if (state === 'train' && p) {
                const s = this.takeSlot(bot, p);
                if (s) { bot.ch.place(s.x, s.y, this.rr(-3, 3)); this.startTrain(bot); bot.stateT = this.rr(5, 25); }
            }
            bot.age = this.rr(0, 50);
            this.list.push(bot);
        }
        if (gen !== this.gen) return;
        this.unsub = GS.on((e) => this.onState(e));
        this.ready = true;
        this.layoutT = 0;
        this.later(this.rr(3, 6), () => { const b = this.pickOf(this.activeBots()); if (b) this.say(b, this.shared('hi') || this.line('farm', { n: b.level })); });
    },

    slotCandidate(p) {
        const s = this.slotPos(p, 0);
        return Math.hypot(s.x - Hero.x, s.y - Hero.y) < 140 ? null : s;
    },

    // ---- кадр --------------------------------------------------------------------------------------
    update(dt) {
        if (!this.ready) return;
        dt = Math.min(dt, 0.1);
        this.time += dt;
        this.popTokens = Math.min(3, this.popTokens + dt * 2.5);
        for (let i = this.list.length - 1; i >= 0; i--) {
            const b = this.list[i];
            this.updateBot(b, dt);
            if (b.dead) { this.list.splice(i, 1); continue; }
        }
        this.updateTags(dt);
        // отложенные
        for (let i = this.events.length - 1; i >= 0; i--) {
            if (this.time >= this.events[i].t) { const e = this.events.splice(i, 1)[0]; try { e.fn(); } catch (err) { console.warn(err); } }
        }
        // заходы
        for (let i = this.joins.length - 1; i >= 0; i--) {
            if (this.time >= this.joins[i].t) {
                const j = this.joins.splice(i, 1)[0];
                this.spawnAtPortal(j.ident).catch((e) => console.warn('GameBots: join', e));
            }
        }
        // держим число ботов
        if (this.list.length + this.joins.length < this.target) this.scheduleJoin(this.rr(5, 14));
        // чат
        this.chatT -= dt;
        if (this.chatT <= 0) { this.chatT = this.rr(6, 12); this.chatTick(); }
        // лог
        for (const o of this.logLines) o.age += dt;
        if (this.logLines.length && this.logLines[0].age > 30) { this.logLines.shift().el.remove(); }
        this.layoutT -= dt;
        if (this.layoutT <= 0) { this.layoutT = 0.5; this.layoutLog(); this.applyLogLimit(); }
    },

    sep(bot, out) {
        let sx = 0, sy = 0;
        const bx = bot.ch.x, by = bot.ch.y;
        const R = 150;
        for (const o of this.list) {
            if (o === bot || o.dead) continue;
            const dx = bx - o.ch.x, dy = by - o.ch.y, d = Math.hypot(dx, dy);
            if (d < R && d > 0.01) { const k = (1 - d / R) * 1.6 / d; sx += dx * k; sy += dy * k; }
        }
        const hx = bx - Hero.x, hy = by - Hero.y, hd = Math.hypot(hx, hy);
        if (hd < 190 && hd > 0.01) { const k = (1 - hd / 190) * 2.4 / hd; sx += hx * k; sy += hy * k; }
        out.x = sx; out.y = sy;
    },

    updateBot(b, dt) {
        const ch = b.ch;
        b.age += dt; b.stateT -= dt;
        if (b.sayT > 0) { b.sayT -= dt; if (b.sayT <= 0 && b.tag) b.tag.say.style.display = 'none'; }
        let move = false, heading = ch.heading, jump = false, sprint = false;
        const sp = this._sp || (this._sp = { x: 0, y: 0 });
        switch (b.state) {
            case 'spawn':
                b.shrink = Math.min(1, b.shrink + dt * 2.2);
                if (b.shrink >= 1) { b.state = 'idle'; b.stateT = this.rr(0.4, 1.5); }
                break;
            case 'enter':
                b.stateT += 0; b.shrink = Math.max(0, b.shrink - dt * 2.4);
                if (b.shrink <= 0.02) {
                    const ident = this.rnd() < 0.55 ? { name: b.name, colors: b.colors, look: b.look, level: Math.min(70, b.level + 1), evo: b.evo, ret: true } : null;
                    this.disposeBot(b);
                    this.scheduleJoin(this.rr(8, 30), ident);
                    return;
                }
                break;
            case 'idle':
                if (b.stateT <= 0) this.chooseGoal(b);
                if (this.near(b, 110) || this.nearBot(b, 70)) this.dodge(b);
                break;
            case 'train': {
                b.tickT -= dt;
                if (b.tickT <= 0) this.trainTick(b);
                if (Math.hypot(ch.x - Hero.x, ch.y - Hero.y) < 100) { this.shuffle(b); break; }
                if (b.stateT <= 0) { this.freeSlot(b); b.state = 'idle'; b.stateT = this.rr(0.5, 2); }
                break;
            }
            case 'walk': {
                const d = b.dest, w = b.path[b.pi] || d;
                let dx = w.x - ch.x, dy = w.y - ch.y, dist = Math.hypot(dx, dy);
                const last = b.pi >= b.path.length - 1;
                if (dist < (last ? 42 : 60)) {
                    if (last) { const fn = d.onArrive; b.path = null; if (fn) fn(b); else b.state = 'idle'; break; }
                    b.pi++;
                    break;
                }
                this.sep(b, sp);
                dx /= dist; dy /= dist;
                const gx = dx + sp.x, gy = dy + sp.y;
                heading = Math.atan2(gy, gx);
                move = true;
                sprint = b.sprint && dist > 400;
                // застряли
                const moved = Math.hypot(ch.x - b.lx, ch.y - b.ly);
                b.stuckT += dt;
                if (b.stuckT > 1.2) {
                    if (moved < 25) { b.path = null; if (b.dest.kind === 'pad' && b.pad) this.freeSlot(b); b.state = 'idle'; b.stateT = this.rr(0.5, 1.5); if (b.leaving) { b.leaving = false; b.age = 0; } }
                    b.lx = ch.x; b.ly = ch.y; b.stuckT = 0;
                }
                break;
            }
        }
        // случайный прыжок
        b.jumpT -= dt;
        if (b.jumpT <= 0) { b.jumpT = this.rr(6, 20); if (b.state === 'idle' || b.state === 'train' || b.state === 'walk') jump = true; }
        if (jump && b.slime) b.slime.bounce(-0.6);
        ch.control({ move: move ? { x: 0, y: 1 } : { x: 0, y: 0 }, sprint, jump, jumpHeld: false, camYaw: heading });
        ch.update(dt);
        // рост тела
        const g = b.growth * b.shrink;
        if (Math.abs(b.growthNow - g) > 0.001) {
            b.growthNow += (g - b.growthNow) * Math.min(1, dt * (b.state === 'spawn' || b.state === 'enter' ? 10 : 3));
            ch.setBody(Humanoid.HEIGHT * b.growthNow, b.growthNow);
        }
        if (b.slime && !b.culled) b.slime.update(dt, ch.heading, b.growthNow);
        // рост уровня
        if (b.state !== 'enter' && b.state !== 'spawn') {
            b.lvlT -= dt;
            if (b.lvlT <= 0) this.levelUp(b);
        }
    },

    nearBot(b, r) {
        for (const o of this.list) if (o !== b && !o.dead && Math.hypot(o.ch.x - b.ch.x, o.ch.y - b.ch.y) < r) return true;
        return false;
    },

    /** Отойти от героя / другого бота. */
    dodge(b) {
        const dx = b.ch.x - Hero.x, dy = b.ch.y - Hero.y, d = Math.hypot(dx, dy) || 1;
        const a = Math.atan2(dy, dx) + this.rr(-0.8, 0.8);
        this.goTo(b, b.ch.x + Math.cos(a) * 260, b.ch.y + Math.sin(a) * 260, 'wander', (x) => { x.state = 'idle'; x.stateT = this.rr(1, 3); });
        void d;
    },

    /** Герой встал в слот бота на площадке: бот занимает другой слот. */
    shuffle(b) {
        const p = b.pad;
        this.freeSlot(b);
        if (p) {
            const s = this.takeSlot(b, p);
            if (s) return this.goTo(b, s.x, s.y, 'pad', (x) => this.startTrain(x));
        }
        this.dodge(b);
    },

    trainTick(b) {
        b.tickT = 0.6;
        if (b.slime) b.slime.bounce(0.3);
        if (!b.pad || !b.vis || this.popTokens < 1) return;
        this.popTokens -= 1;
        const n = Math.max(1, Math.round(b.pad.pad.gain * GD.evoMult(b.evo)));
        GameFx.pop('+' + fmtNum(n), b.ch.x, b.ch.y, b.ch.h + 190 * b.growthNow, 'info', { size: 16, color: 'rgba(216,236,255,0.82)', life: 0.8, rise: 70, spread: 24 });
    },

    levelUp(b) {
        b.lvlT = this.rr(35, 85);
        if (b.level >= 70) return;
        b.level++;
        b.growth = GD.growth(b.level);
        if (b.slime) { b.slime.setLevel(b.level, true); b.slime.bounce(1); b.culled = null; }
        const glow = GD.EVOLUTIONS[b.evo].glow;
        if (b.vis) {
            GameFx.pop(this.tx('bots.levelUp', { n: b.level }), b.ch.x, b.ch.y, b.ch.h + 230 * b.growthNow, 'info', { size: 19, color: glow, life: 1.2, rise: 80, spread: 20 });
            GameFx.play('levelup', b.ch.x, b.ch.y, b.ch.h + 60);
            if (this.near(b, 1200)) GameSfx.play('levelup', 0.25);
        }
        this.paintTag(b);
        // эволюция, когда уровень позволяет
        const nx = GD.EVOLUTIONS[b.evo + 1];
        if (nx && b.evo < 8 && b.level >= nx.level && this.rnd() < 0.7) this.later(this.rr(2, 6), () => this.evolve(b));
        else if (this.rnd() < 0.3) this.say(b, this.line('lvB', { n: b.level }));
    },

    evolve(b) {
        if (b.dead || b.state === 'enter') return;
        b.evo = Math.min(8, b.evo + 1);
        if (b.slime) { b.slime.setEvo(b.evo); b.slime.bounce(2); b.culled = null; }
        this.paintTag(b);
        if (b.vis) {
            GameFx.pop(this.tx('bots.evolved'), b.ch.x, b.ch.y, b.ch.h + 240 * b.growthNow, 'info', { size: 20, color: GD.EVOLUTIONS[b.evo].glow, life: 1.4, rise: 80, spread: 20 });
            GameFx.play('evolve', b.ch.x, b.ch.y, b.ch.h + 60);
            if (this.near(b, 1200)) GameSfx.play('evolve', 0.25);
        }
        this.say(b, this.line('evB'));
    },

    // ---- ники и пузыри -----------------------------------------------------------------------------
    /** Вне кадра бот не рисуется (меши слизи помечены alwaysSelectAsActiveMesh — сами не отсекаются) и не считает слизь. */
    setCulled(b, on) {
        if (b.culled === on) return;
        b.culled = on;
        try {
            b.ch.model.root.setEnabled(!on);
            if (b.slime) for (const c of b.slime.tendrils) for (const sg of c.segs) sg.node.setEnabled(!on);
        } catch (e) { /* бот уже снят */ }
    },

    updateTags(dt) {
        void dt;
        const view = this.view, W = window.innerWidth, H = window.innerHeight;
        for (const b of this.list) {
            const t = b.tag;
            if (!t) continue;
            const hero = Math.hypot(b.ch.x - Hero.x, b.ch.y - Hero.y);
            const s = hero < 5200 ? view.projectToScreen(b.ch.x, b.ch.y, b.ch.h + (184 * b.growthNow + 52)) : null;
            const inView = !!(s && !s.behind && s.x > -380 && s.x < W + 380 && s.y > -320 && s.y < H + 520);
            this.setCulled(b, !inView);
            const vis = !!(s && s.visible && !s.behind && hero < 3600 && b.shrink > 0.5);
            b.vis = vis;
            const L = /** @type {any} */ (t.el);
            if (!vis) { L._vis = false; if (t.shown) { t.el.style.display = 'none'; t.shown = false; } continue; }
            if (!t.shown) { t.el.style.display = ''; t.shown = true; }
            const k = hero > 1800 ? Math.max(0.7, 1 - (hero - 1800) / 3000) : 1;
            // позицию и прозрачность пишет Game.declutter() (подписи без наложений)
            L._vis = true; L._sx = s.x; L._sy = s.y; L._k = k; L._baseOp = hero > 2800 ? Math.max(0, 1 - (hero - 2800) / 800) : 1;
        }
    },

    // ---- раскладка чата под HUD --------------------------------------------------------------------
    layoutLog() {
        const log = this.logEl;
        if (!log) return;
        const W = window.innerWidth, H = window.innerHeight;
        const hidden = H < 420 || W < 330 || (typeof Game !== 'undefined' && Game.state !== 'lobby');
        const hudShown = typeof GameHud !== 'undefined' && GameHud.isOpen && GameHud.isOpen();
        if (hidden || hudShown || !this.logLines.length || log.dataset.empty === '1') { log.style.display = 'none'; return; }
        const port = H > W;
        const bar = /** @type {HTMLElement | null} */ (document.querySelector('.gh-lobbybar'));
        const menu = /** @type {HTMLElement | null} */ (document.querySelector('.gh-mid > :first-child'));
        const br = bar && bar.offsetParent !== null ? bar.getBoundingClientRect() : null;
        const mr = menu && menu.offsetParent !== null ? menu.getBoundingClientRect() : null;
        const menuB = mr ? mr.bottom : 0;
        const fs = port || W < 700 ? 12 : 13;
        log.style.fontSize = fs + 'px';
        const lineH = fs * 1.25 + 6;
        let bottom = 10, left = 8, width = Math.min(290, W * 0.4), avail;
        if (br && br.left - 20 >= 170) {                 // слева от нижней панели
            width = Math.min(290, br.left - 20);
            avail = H - 10 - menuB - 8;
        } else if (br) {                                 // узкий экран: над панелью, правее колонки кнопок слева
            bottom = H - br.top + 6;
            left = mr ? mr.right + 8 : 8;
            width = Math.max(120, Math.min(260, W - left - 10));
            avail = br.top - 6 - (mr ? mr.top : 100);
        } else avail = H - 10 - menuB - 8;
        const n = Math.max(0, Math.min(5, Math.floor(avail / lineH)));
        if (n < 2) { log.style.display = 'none'; return; }
        this.maxLines = port ? Math.min(n, 3) : n;
        log.style.width = width + 'px';
        log.style.left = left + 'px';
        log.style.bottom = bottom + 'px';
        log.style.display = 'flex';
    },

    // ---- уборка ------------------------------------------------------------------------------------
    clear() {
        this.gen++;
        this.ready = false;
        if (this.unsub) { try { this.unsub(); } catch (e) { /* уже снят */ } this.unsub = null; }
        for (const b of this.list) this.disposeBot(b);
        this.list = [];
        this.events = []; this.joins = [];
        for (const t of this.tagPool) t.el.remove();
        this.tagPool = [];
        this.logLines = [];
        if (this.layer) { this.layer.remove(); this.layer = null; }
        if (this.logEl) { this.logEl.remove(); this.logEl = null; }
        if (this.styleEl) { this.styleEl.remove(); this.styleEl = null; }
        this.world = null; this.ctx = null; this.app = null; this.view = null;
    },
};
