// GameState.js — прогресс игрока и правила: слизь и уровень, эволюция (в том числе за рекламу), победы,
// кристаллы (= монеты Shop), стадии, бусты, подарки за время, цель-подсказка. Одно сохранение Platform.save.
// Интерфейс и мир слушают события GS.on(fn): { type: 'slime'|'level'|'coverage'|'evo'|'wins'|'gems'|'boost'|'stage'|'ads', ... }.

/** @satisfies {Record<string, any>} */
const GS = {
    /** Сохранение игры (один объект; save.shop — состояние Shop). @type {any} */
    save: null,
    /** @type {Array<(e: any) => void>} */
    _listeners: [],
    _saveT: 0,
    _dirty: false,
    /** Секунды игры в этой сессии (подарки за время). */
    sessionT: 0,
    /** Полученные подарки за время в этой сессии: индексы. @type {Record<number, boolean>} */
    playtimeClaimed: {},
    adBusy: false,

    DEFAULTS() {
        return {
            v: 1, level: 1, xp: 0, total: 0, evo: 0, wins: 0, stage: 0, cleared: {}, world: 1,
            boosts: {}, evoAds: {}, packAds: {}, tutorialDone: false, kills: 0, deaths: 0,
            offers: {}, quality: '', lastStage: 0,
        };
    },

    async load() {
        let saved = null;
        try { saved = await Platform.load(); } catch (e) { console.warn('Platform.load:', e); }
        this.save = Object.assign(this.DEFAULTS(), saved || {});
        const s = this.save;
        s.level = Math.max(1, s.level | 0);
        s.evo = Math.max(0, Math.min(GD.EVOLUTIONS.length - 1, s.evo | 0));
        s.stage = Math.max(0, Math.min(GD.STAGES.length - 1, s.stage | 0));
        if (!s.cleared || typeof s.cleared !== 'object') s.cleared = {};
        if (!s.boosts || typeof s.boosts !== 'object') s.boosts = {};
        if (!s.evoAds || typeof s.evoAds !== 'object') s.evoAds = {};
        if (!s.packAds || typeof s.packAds !== 'object') s.packAds = {};
        if (!s.offers || typeof s.offers !== 'object') s.offers = {};
        return s;
    },

    /** Сохранить сейчас. */
    persist() {
        this._dirty = false; this._saveT = 0;
        try { Platform.save(this.save); } catch (e) { console.warn('Platform.save:', e); }
    },
    /** Сохранить чуть позже (частые начисления на тренировке). */
    persistSoon() { this._dirty = true; },

    on(fn) { this._listeners.push(fn); return () => { this._listeners = this._listeners.filter((f) => f !== fn); }; },
    emit(e) { for (const f of this._listeners.slice()) { try { f(e); } catch (err) { console.error(err); } } },

    // ---- геттеры --------------------------------------------------------------------------------
    get level() { return this.save.level; },
    get xp() { return this.save.xp; },
    get evo() { return this.save.evo; },
    get wins() { return this.save.wins; },
    get gems() { return typeof Shop !== 'undefined' && Shop.state ? Shop.coins : 0; },
    get evoData() { return GD.EVOLUTIONS[this.save.evo]; },
    need() { return GD.need(this.save.level); },
    damage() { return GD.damage(this.save.level, this.save.evo) * (1 + (this.save.level >= 30 ? 0.1 : 0)); },
    maxHp() { return GD.heroHp(this.save.level, this.save.evo); },
    attacks() { return GD.attacksFor(this.save.evo); },
    coverage() { return GD.coverage(this.save.level); },
    growth() { return GD.growth(this.save.level); },

    // ---- слизь и уровень ------------------------------------------------------------------------
    /** Множитель слизи: эволюция × бусты. */
    slimeMult() { return GD.evoMult(this.save.evo) * (this.boostLeft('slime2') > 0 ? 2 : 1); },
    /** Слизи за тик площадки pad. */
    padGain(pad) { return Math.round(pad.gain * this.slimeMult()); },
    padUnlocked(pad) { return this.save.level >= pad.level && this.save.evo >= pad.evo; },
    /** Текст замка площадки: «Уровень 8» / «Эволюция: Клыкач». */
    padLock(pad) {
        if (this.save.evo < pad.evo) return Lang.t('pad.needEvo', { name: tr(GD.EVOLUTIONS[pad.evo].name) });
        if (this.save.level < pad.level) return Lang.t('pad.needLevel', { n: pad.level });
        return '';
    },

    /** Начислить слизь (опыт). Уровни растут, события level/coverage. Возвращает число новых уровней. */
    addSlime(n, source) {
        n = Math.max(0, Math.floor(n));
        if (!n) return 0;
        const s = this.save, before = s.level, cov0 = JSON.stringify(GD.coverage(before));
        s.xp += n; s.total += n;
        let up = 0;
        while (s.xp >= GD.need(s.level) && s.level < 999) { s.xp -= GD.need(s.level); s.level++; up++; }
        this.emit({ type: 'slime', n, source });
        if (up) {
            this.emit({ type: 'level', from: before, to: s.level });
            if (JSON.stringify(GD.coverage(s.level)) !== cov0) { this.emit({ type: 'coverage', from: before, to: s.level }); this.persist(); }
            else this.persistSoon();   // частые уровни — отложенное сохранение (облако площадки)
        } else this.persistSoon();
        return up;
    },
    /** Сразу +k уровней (награды): добираем опыт до нужного. */
    addLevels(k, source) {
        let total = GD.need(this.save.level) - this.save.xp;
        for (let i = 1; i < k; i++) total += GD.need(this.save.level + i);
        return this.addSlime(total, source);
    },

    // ---- эволюция --------------------------------------------------------------------------------
    evoInfo() {
        const s = this.save, cur = GD.EVOLUTIONS[s.evo], next = GD.EVOLUTIONS[s.evo + 1] || null;
        if (!next) return { cur, next: null, max: true, canEvolve: false, levelOk: true, winsOk: true, progress: 1, adsNeed: 0, adsDone: 0 };
        const levelOk = s.level >= next.level, winsOk = s.wins >= next.wins;
        const pL = Math.min(1, (s.level - cur.level) / Math.max(1, next.level - cur.level));
        const pW = next.wins > 0 ? Math.min(1, s.wins / next.wins) : 1;
        const progress = Math.max(0, Math.min(1, (pL + pW) / 2));
        const adsNeed = Math.max(GD.EVO_ADS_MIN, Math.min(GD.EVO_ADS_MAX, Math.ceil((1 - progress) * GD.EVO_ADS_MAX)));
        const adsDone = Math.min(adsNeed, (s.evoAds[s.evo + 1] | 0));
        return { cur, next, max: false, canEvolve: levelOk && winsOk, levelOk, winsOk, progress, adsNeed, adsDone };
    },
    /** Эволюционировать (по требованиям или после всех роликов). */
    evolve(force) {
        const info = this.evoInfo();
        if (!info.next || (!info.canEvolve && !force)) return false;
        const s = this.save;
        s.evo++;
        delete s.evoAds[s.evo];
        this.emit({ type: 'evo', evo: s.evo });
        this.persist();
        return true;
    },
    /** Ролик к эволюции: +1 просмотр; на последнем — эволюция. → 'evolved' | 'progress' | false */
    async watchEvoAd() {
        const info = this.evoInfo();
        if (!info.next || this.adBusy) return false;
        const ok = await this.rewarded('evolve');
        if (!ok) return false;
        const s = this.save, k = s.evo + 1;
        s.evoAds[k] = (s.evoAds[k] | 0) + 1;
        if (s.evoAds[k] >= this.evoInfo().adsNeed) { this.evolve(true); return 'evolved'; }
        this.emit({ type: 'ads', what: 'evolve' });
        this.persist();
        return 'progress';
    },

    // ---- реклама --------------------------------------------------------------------------------
    /** Rewarded со стабильным id. true — выдать награду один раз. */
    async rewarded(id) {
        if (this.adBusy) return false;
        this.adBusy = true;
        try { return !!(await Platform.rewarded(id)); } catch (e) { return false; } finally { this.adBusy = false; this.emit({ type: 'ads', what: id }); }
    },
    adReady() { return !this.adBusy && Platform.rewardedSupported() && Platform.rewardedReady(); },
    adLabel(base) { const w = Platform.rewardedCooldownLeft(); return w > 0 ? Platform.rewardedCooldownLabel() : base; },

    // ---- наборы слизи за рекламу (нижняя панель): прогресс просмотров ---------------------------
    PACKS: [
        { id: 'pack1', levels: 1, ads: 1 },
        { id: 'pack3', levels: 3, ads: 2 },
        { id: 'pack6', levels: 6, ads: 4 },
    ],
    packInfo(p) { return { done: this.save.packAds[p.id] | 0, need: p.ads }; },
    async watchPack(p) {
        if (!(await this.rewarded('slime-pack'))) return false;
        const s = this.save;
        s.packAds[p.id] = (s.packAds[p.id] | 0) + 1;
        if (s.packAds[p.id] >= p.ads) { s.packAds[p.id] = 0; this.addLevels(p.levels, 'pack'); this.persist(); return 'done'; }
        this.persist();
        return 'progress';
    },

    // ---- победы и кристаллы ----------------------------------------------------------------------
    addWins(n) {
        n = Math.max(0, Math.round(n * (this.boostLeft('wins2') > 0 ? 2 : 1)));
        this.save.wins += n;
        this.emit({ type: 'wins', n });
        this.persist();
        return n;
    },
    addGems(n, save) {
        if (typeof Shop === 'undefined' || !Shop.state) return;
        Shop.addCoins(Math.max(0, Math.round(n)), { save: !!save });
        this.emit({ type: 'gems', n });
        if (!save) this.persistSoon();
    },

    // ---- стадии ----------------------------------------------------------------------------------
    stageUnlocked(i) { return i <= this.save.stage; },
    stageCleared(i) { return !!this.save.cleared[i]; },
    clearStage(i) {
        const s = this.save;
        s.cleared[i] = true;
        if (i + 1 < GD.STAGES.length && s.stage < i + 1) s.stage = i + 1;
        s.lastStage = Math.min(GD.STAGES.length - 1, i + 1);
        this.emit({ type: 'stage', i });
        this.persist();
    },
    /** Сила героя относительно рекомендуемой для стадии: <0.8 — опасно, ≥1 — ок. */
    stagePower(i) {
        const st = GD.STAGES[i];
        return GD.damage(this.save.level, this.save.evo) / GD.damage(st.rec[0], st.rec[1]);
    },

    // ---- бусты (секунды игры; на паузе стоят) ------------------------------------------------------
    boostLeft(id) { return Math.max(0, this.save.boosts[id] || 0); },
    addBoost(id, sec) {
        this.save.boosts[id] = this.boostLeft(id) + sec;
        this.emit({ type: 'boost', id });
        this.persist();
    },
    async watchBoost(id) {
        if (!(await this.rewarded('boost-' + id))) return false;
        this.addBoost(id, GD.BOOSTS[id].sec);
        return true;
    },

    // ---- подарки за время -------------------------------------------------------------------------
    playtimeState(i) {
        const g = GD.PLAYTIME[i];
        if (this.playtimeClaimed[i]) return { state: 'claimed', left: 0 };
        const left = Math.max(0, g.min * 60 - this.sessionT);
        return { state: left <= 0 ? 'ready' : 'wait', left };
    },
    playtimeReadyCount() { let n = 0; for (let i = 0; i < GD.PLAYTIME.length; i++) if (this.playtimeState(i).state === 'ready') n++; return n; },
    /** Следующий незабранный подарок: индекс или −1. */
    playtimeNext() { for (let i = 0; i < GD.PLAYTIME.length; i++) if (!this.playtimeClaimed[i]) return i; return -1; },
    claimPlaytime(i, viaAd) {
        if (this.playtimeClaimed[i]) return null;
        if (!viaAd && this.playtimeState(i).state !== 'ready') return null;
        this.playtimeClaimed[i] = true;
        return this.giveReward(GD.PLAYTIME[i].reward, 'playtime');
    },
    async watchPlaytime(i) {
        if (this.playtimeClaimed[i]) return null;
        if (!(await this.rewarded('playtime'))) return null;
        return this.claimPlaytime(i, true);
    },
    /** Выдать награду { gems | wins | slimeLevels | boost+sec } → то же с фактическими числами. */
    giveReward(r, source) {
        const out = {};
        if (r.gems) { this.addGems(r.gems, true); out.gems = r.gems; }
        if (r.wins) { out.wins = this.addWins(r.wins); }
        if (r.slimeLevels) { this.addLevels(r.slimeLevels, source); out.slimeLevels = r.slimeLevels; }
        if (r.boost) { this.addBoost(r.boost, r.sec || GD.BOOSTS[r.boost].sec); out.boost = r.boost; out.sec = r.sec; }
        this.persist();
        return out;
    },

    // ---- цель-подсказка (баннер сверху) --------------------------------------------------------
    /** { text, a, b } — текущая цель игрока. */
    goal() {
        const s = this.save;
        if (s.level < 5) return { text: Lang.t('goal.head'), a: s.level, b: 5 };
        if (!s.cleared[0]) return { text: Lang.t('goal.stage1'), a: 0, b: 1 };
        const ev = this.evoInfo();
        if (ev.next && ev.canEvolve) return { text: Lang.t('goal.evolve', { name: tr(ev.next.name) }), a: 1, b: 1 };
        const nc = GD.nextCoverage(s.level);
        if (nc && nc.level - s.level <= 4) return { text: Lang.t('goal.grow', { n: nc.level }), a: s.level, b: nc.level };
        if (ev.next && !ev.levelOk) return { text: Lang.t('goal.levelFor', { n: ev.next.level, name: tr(ev.next.name) }), a: s.level, b: ev.next.level };
        if (ev.next && !ev.winsOk) return { text: Lang.t('goal.winsFor', { n: ev.next.wins, name: tr(ev.next.name) }), a: s.wins, b: ev.next.wins };
        const st = Math.min(s.stage, GD.STAGES.length - 1);
        return { text: Lang.t('goal.clear', { n: st + 1 }), a: 0, b: 1 };
    },

    /** Кадр: бусты, время сессии, отложенное сохранение. */
    tick(dt) {
        this.sessionT += dt;
        const b = this.save.boosts;
        for (const k of Object.keys(b)) {
            if (b[k] > 0) { b[k] = Math.max(0, b[k] - dt); if (b[k] === 0) { delete b[k]; this.emit({ type: 'boost', id: k, ended: true }); } }
        }
        if (this._dirty) { this._saveT += dt; if (this._saveT > 12) this.persist(); }   // не чаще раза в 12 с (облачные сохранения площадок)
    },
};
