// GameHero.js — герой: физический блочный человечек движка (HumanoidCharacter) + живая слизь (SlimeBody).
// Ввод, камера, HP и неуязвимость, смерть (рэгдолл) и возрождение, рост тела по уровню, отскок слизи.

const HERO_COLORS = { skin: [236, 192, 158], top: [236, 96, 44], bottom: [46, 54, 78] };

/** @satisfies {Record<string, any>} */
const Hero = {
    /** @type {any} HumanoidCharacter */ ch: null,
    /** @type {SlimeBody | null} */ slime: null,
    /** @type {LoryApp | null} */ app: null,
    cam: { x: 0, y: 0, h: 0, frameHeight: 900, frameWidth: 900 },
    hp: 100, maxHp: 100, alive: true, inv: 0, hurtT: 0, regenT: 0,
    growth: 1, growthNow: 1,
    moving: false, speed: 0,
    lastX: 0, lastY: 0,

    /** Создать героя на текущей карте (prepare под загрузкой). */
    async create(app, spawn) {
        this.app = app;
        this.dispose();
        const view = app.location.view;
        await MotionDB.sharedAsync();
        const world = CharacterPhysics.navWorld(Nav);
        this.ch = HumanoidCharacter.create(view, { world, x: spawn.x, y: spawn.y, heading: spawn.heading || 0, colors: HERO_COLORS, name: 'hero' });
        this.ch.on('land', (e) => {
            if (this.slime) this.slime.bounce(Math.min(1.4, 0.4 + (e && e.speed ? e.speed / 900 : 0.5)));
            GameSfx.play('land');
        });
        this.ch.on('step', () => { if (this.moving) GameSfx.play('step'); });
        this.slime = new SlimeBody(view, this.ch.model);
        await this.slime.load();
        this.growth = this.growthNow = GS.growth();
        this.applyGrowth(true);
        this.slime.setEvo(GS.evo);
        this.slime.applyLook(this.look());
        this.slime.setLevel(GS.level, false);
        this.refreshStats(true);
        this.alive = true; this.inv = 0;
        this.syncCam(true);
        GameFx.setCosmetics(this.look(), () => this.footPos());
    },

    look() { return typeof Shop !== 'undefined' && Shop.state ? Shop.look() : {}; },

    footPos() { return new BABYLON.Vector3(this.x, this.h + 4, this.y); },

    get x() { return this.ch ? this.ch.x : 0; },
    get y() { return this.ch ? this.ch.y : 0; },
    get h() { return this.ch ? this.ch.h : 0; },
    get heading() { return this.ch ? this.ch.heading : 0; },
    /** Радиус тела для попаданий (px). */
    get radius() { return 34 * this.growthNow; },

    place(x, y, heading) {
        if (!this.ch) return;
        this.ch.place(x, y, heading || 0);
        this.syncCam(true);
    },

    /** Пересчитать HP после уровня/эволюции; full — вылечить полностью. */
    refreshStats(full) {
        const m = GS.maxHp();
        const k = this.maxHp > 0 ? this.hp / this.maxHp : 1;
        this.maxHp = m;
        this.hp = full ? m : Math.max(1, Math.round(m * k));
    },

    applyGrowth(now) {
        if (!this.ch) return;
        if (now) this.growthNow = this.growth;
        this.ch.setBody(Humanoid.HEIGHT * this.growthNow, this.growthNow);
    },

    /** Уровень вырос: покрытие, рост, отскок. Возвращает новые группы кусков (для праздника). */
    onLevel(animate) {
        if (!this.slime) return [];
        const fresh = this.slime.setLevel(GS.level, animate);
        this.growth = GS.growth();
        this.refreshStats(false);
        this.slime.bounce(1.2);
        return fresh;
    },

    onEvo() {
        if (!this.slime) return;
        this.slime.setEvo(GS.evo);
        this.refreshStats(true);
        this.slime.bounce(2);
    },

    onLook() {
        if (this.slime) this.slime.applyLook(this.look());
        GameFx.setCosmetics(this.look(), () => this.footPos());
    },

    // ---- урон -----------------------------------------------------------------------------------
    /** Урон герою. → true, если умер. */
    damage(n, fromX, fromY) {
        if (!this.alive || this.inv > 0 || Platform.adActive || (Game && Game.state !== 'arena')) return false;
        n = Math.max(1, Math.round(n));
        this.hp -= n;
        this.hurtT = 0.25; this.regenT = 3;
        GameFx.pop('-' + fmtNum(n), this.x, this.y, this.h + 200 * this.growthNow, 'hurt', { size: 26 });
        if (this.slime) this.slime.bounce(0.5);
        GameSfx.play('hurt');
        if (this.hp <= 0) { this.hp = 0; this.die(fromX, fromY); return true; }
        return false;
    },

    heal(n) { this.hp = Math.min(this.maxHp, this.hp + n); },

    die(fx, fy) {
        this.alive = false;
        const dx = this.x - (fx == null ? this.x - 1 : fx), dy = this.y - (fy == null ? this.y : fy), L = Math.hypot(dx, dy) || 1;
        this.ch.hold = true;
        this.ch.knock([dx / L * 380, 420, dy / L * 380], 'death');
        GameSfx.play('death');
    },

    revive() {
        this.alive = true;
        this.ch.hold = false;
        this.hp = this.maxHp;
        this.inv = 2.5;
        if (this.ch.ragdolled) this.ch.getUp();
        if (this.slime) this.slime.bounce(2);
        GameFx.play('heal', this.x, this.y, this.h + 60);
    },

    // ---- кадр -----------------------------------------------------------------------------------
    /** controls — принимать ли ввод (нет окон, не загрузка). */
    update(dt, controls) {
        if (!this.ch || !this.app) return;
        const cam = this.app.camera;
        const m = controls && this.alive ? Input.move() : { x: 0, y: 0 };
        const jump = controls && this.alive && Input.pressed('jump');
        this.ch.control({ move: m, sprint: true, jump, jumpHeld: controls && Input.down('jump'), camYaw: cam.azimuth });
        this.ch.update(dt);
        if (jump && this.slime) this.slime.bounce(-0.6);
        // рост тела плавно
        if (Math.abs(this.growthNow - this.growth) > 0.001) {
            this.growthNow += (this.growth - this.growthNow) * Math.min(1, dt * 3);
            if (Math.abs(this.growthNow - this.growth) < 0.004) this.growthNow = this.growth;
            this.applyGrowth(false);
        }
        const sp = Math.hypot(this.x - this.lastX, this.y - this.lastY) / Math.max(dt, 1e-4);
        this.lastX = this.x; this.lastY = this.y;
        this.speed = sp < 2000 ? sp : 0;
        this.moving = this.speed > 40;
        if (this.inv > 0) this.inv -= dt;
        if (this.hurtT > 0) this.hurtT -= dt;
        if (this.regenT > 0) this.regenT -= dt;
        else if (this.alive && this.hp < this.maxHp) this.heal(this.maxHp * 0.03 * dt);
        if (this.slime) this.slime.update(dt, this.heading, this.growthNow);
        if (GameFx.trail) GameFx.trail.setRate(this.moving ? 1 : 0);
        this.syncCam(false);
    },

    syncCam(snap) {
        const c = this.cam;
        c.x = this.x; c.y = this.y; c.h = this.h + 150 * this.growthNow;
        c.frameHeight = 620 + 380 * (this.growthNow - 1);
        c.frameWidth = 620 + 380 * (this.growthNow - 1);
        if (snap && this.app && this.app.camera.snap) this.app.camera.snap();
    },

    dispose() {
        if (this.slime) { this.slime.dispose(); this.slime = null; }
        if (this.ch) { this.ch.dispose(); this.ch = null; }
    },
};
