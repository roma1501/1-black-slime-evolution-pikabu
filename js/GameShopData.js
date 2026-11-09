// GameShopData.js — каталог косметики (Shop.js): 6 вкладок, всё видно в игре.
//   goo   — цвет и материал слизи (все куски на герое)
//   eyes  — свечение глаз и эмблемы (по умолчанию — цвет эволюции)
//   aura  — аура частиц вокруг героя
//   trail — след за героем при движении
//   pop   — стиль всплывающих «+N» на тренировке и уроне
//   win   — эффект победы (площадка побед, эволюция)
// Цена: ≈35% за кристаллы (Shop.coins), остальные — 1..7 просмотров рекламы, по редкости.
// Редкие — анимация: hue (перелив), pulse (пульс), sparkle (искры), fire, void.

/** @satisfies {Record<string, any>} */
const GameShopData = {
    TABS: [
        { id: 'goo', name: { ru: 'Слизь', en: 'Goo' }, icon: 'goo' },
        { id: 'eyes', name: { ru: 'Глаза', en: 'Eyes' }, icon: 'eyes' },
        { id: 'aura', name: { ru: 'Ауры', en: 'Auras' }, icon: 'aura' },
        { id: 'trail', name: { ru: 'Следы', en: 'Trails' }, icon: 'trail' },
        { id: 'pop', name: { ru: 'Цифры', en: 'Numbers' }, icon: 'pop' },
        { id: 'win', name: { ru: 'Победа', en: 'Victory' }, icon: 'win' },
    ],
    RARITY_COLOR: { common: '#b8c4d6', uncommon: '#62e36b', rare: '#3aa8ff', epic: '#b05cff', legendary: '#ffc23a' },
    PRICE: {
        common: { coins: 60, ads: 1 }, uncommon: { coins: 160, ads: 2 }, rare: { coins: 380, ads: 3 },
        epic: { coins: 850, ads: 5 }, legendary: { coins: 2000, ads: 7 },
    },

    // [id, ru, en, rarity, params]
    /** @type {any[][]} */
    GOO: [
        ['goo-black', 'Чёрная', 'Black', 'common', { color: '#0d0d14', rim: '#3a3f66', spec: 0.9 }],
        ['goo-midnight', 'Полночь', 'Midnight', 'common', { color: '#0f1430', rim: '#3d5bff', spec: 0.9 }],
        ['goo-ink', 'Чернила', 'Ink', 'common', { color: '#101a2e', rim: '#4aa3ff', spec: 0.8 }],
        ['goo-crimson', 'Багровая', 'Crimson', 'common', { color: '#3a0710', rim: '#ff3b4d', spec: 0.9 }],
        ['goo-toxic', 'Токсичная', 'Toxic', 'uncommon', { color: '#16300a', rim: '#9dff3a', spec: 0.9 }],
        ['goo-violet', 'Фиолетовая', 'Violet', 'uncommon', { color: '#220c3a', rim: '#b05cff', spec: 0.9 }],
        ['goo-emerald', 'Изумруд', 'Emerald', 'uncommon', { color: '#062a1c', rim: '#2affa0', spec: 0.95 }],
        ['goo-teal', 'Бирюза', 'Teal', 'uncommon', { color: '#062a2e', rim: '#3af0ff', spec: 0.9 }],
        ['goo-rust', 'Ржавчина', 'Rust', 'common', { color: '#2e1408', rim: '#ff8a3a', spec: 0.6 }],
        ['goo-bubblegum', 'Жвачка', 'Bubblegum', 'rare', { color: '#ff5fb2', rim: '#ffffff', spec: 0.9 }],
        ['goo-ocean', 'Океан', 'Ocean', 'rare', { color: '#0a3a7a', rim: '#7fd8ff', spec: 1 }],
        ['goo-chrome', 'Хром', 'Chrome', 'epic', { color: '#9aa6b8', rim: '#ffffff', spec: 1.4 }],
        ['goo-gold', 'Золото', 'Gold', 'epic', { color: '#b8860b', rim: '#fff3a0', spec: 1.4 }],
        ['goo-rose', 'Розовое золото', 'Rose Gold', 'rare', { color: '#b76e79', rim: '#ffe0e6', spec: 1.2 }],
        ['goo-obsidian', 'Обсидиан', 'Obsidian', 'rare', { color: '#050508', rim: '#8a3cff', spec: 1.3 }],
        ['goo-lava', 'Лава', 'Lava', 'epic', { color: '#1a0702', rim: '#ff5a1e', spec: 0.7, emis: '#ff3a00', anim: 'pulse' }],
        ['goo-ice', 'Лёд', 'Ice', 'rare', { color: '#a8e6ff', rim: '#ffffff', spec: 1.2 }],
        ['goo-galaxy', 'Галактика', 'Galaxy', 'legendary', { color: '#120a2e', rim: '#ff6bff', spec: 1, anim: 'sparkle' }],
        ['goo-neon', 'Неон', 'Neon', 'epic', { color: '#0a2a0a', rim: '#39ff14', spec: 1, emis: '#20c010', anim: 'pulse' }],
        ['goo-shadow', 'Тень', 'Shadow', 'uncommon', { color: '#08060c', rim: '#5a2a8a', spec: 0.6 }],
        ['goo-bloodmoon', 'Кровавая луна', 'Blood Moon', 'epic', { color: '#2a0004', rim: '#ff1a3a', spec: 1.1, emis: '#600010', anim: 'pulse' }],
        ['goo-candy', 'Конфета', 'Candy', 'uncommon', { color: '#ff8ad8', rim: '#8af7ff', spec: 1 }],
        ['goo-mint', 'Мята', 'Mint', 'common', { color: '#7fffd0', rim: '#ffffff', spec: 0.9 }],
        ['goo-sunset', 'Закат', 'Sunset', 'legendary', { color: '#ff6a3a', color2: '#7a2aff', rim: '#ffd23c', spec: 1, anim: 'hue' }],
        ['goo-rainbow', 'Радуга', 'Rainbow', 'legendary', { color: '#ff3b3b', rim: '#ffffff', spec: 1.1, anim: 'rainbow' }],
        ['goo-voidstar', 'Звёздная бездна', 'Void Star', 'legendary', { color: '#000000', rim: '#ffd23c', spec: 1.3, emis: '#2a0a5a', anim: 'void' }],
        // Эксклюзивы Подарка дня (6-й элемент 'daily'): не продаются и не выпадают на колесе, у каждого свой вид; видны на герое.
        ['goo-abyss-crown', 'Корона бездны', 'Abyss Crown', 'legendary', { color: '#12052b', color2: '#ffd23c', rim: '#fff0a0', spec: 1.5, emis: '#ffb300', anim: 'void' }, 'daily'],
    ],
    /** @type {any[][]} */
    EYES: [
        ['eyes-evo', 'Цвет эволюции', 'Evolution', 'common', { evo: true }],
        ['eyes-white', 'Белые', 'White', 'common', { color: '#ffffff' }],
        ['eyes-red', 'Красные', 'Red', 'common', { color: '#ff2a3a' }],
        ['eyes-green', 'Зелёные', 'Green', 'common', { color: '#39ff6a' }],
        ['eyes-cyan', 'Голубые', 'Cyan', 'common', { color: '#3af0ff' }],
        ['eyes-yellow', 'Жёлтые', 'Yellow', 'uncommon', { color: '#ffe23a' }],
        ['eyes-pink', 'Розовые', 'Pink', 'uncommon', { color: '#ff5fd2' }],
        ['eyes-orange', 'Оранжевые', 'Orange', 'uncommon', { color: '#ff8a1e' }],
        ['eyes-purple', 'Пурпурные', 'Purple', 'uncommon', { color: '#a64dff' }],
        ['eyes-blue', 'Синие', 'Blue', 'uncommon', { color: '#2a6bff' }],
        ['eyes-lime', 'Лайм', 'Lime', 'rare', { color: '#c8ff1e' }],
        ['eyes-gold', 'Золотые', 'Gold', 'rare', { color: '#ffc23a' }],
        ['eyes-crimson', 'Алые', 'Crimson', 'rare', { color: '#d4001e' }],
        ['eyes-ice', 'Ледяные', 'Ice', 'rare', { color: '#bdf3ff' }],
        ['eyes-toxic', 'Ядовитые', 'Toxic', 'rare', { color: '#7dff00' }],
        ['eyes-pulse', 'Пульс', 'Pulse', 'epic', { color: '#ff2a3a', anim: 'pulse' }],
        ['eyes-fire', 'Огонь', 'Fire', 'epic', { color: '#ff7a00', color2: '#ffe23a', anim: 'fire' }],
        ['eyes-frost', 'Иней', 'Frost', 'epic', { color: '#7fd8ff', color2: '#ffffff', anim: 'hue' }],
        ['eyes-void', 'Бездна', 'Void', 'epic', { color: '#8a3cff', color2: '#1a0040', anim: 'hue' }],
        ['eyes-flicker', 'Мерцание', 'Flicker', 'epic', { color: '#ffffff', anim: 'flicker' }],
        ['eyes-rainbow', 'Радуга', 'Rainbow', 'legendary', { color: '#ff3b3b', anim: 'rainbow' }],
        ['eyes-star', 'Звёзды', 'Stars', 'legendary', { color: '#fff6c0', anim: 'sparkle' }],
        ['eyes-sun', 'Солнце', 'Sun', 'legendary', { color: '#ffd23c', color2: '#ff5a1e', anim: 'fire' }],
        ['eyes-ghost', 'Призрак', 'Ghost', 'rare', { color: '#d8fff4' }],
        ['eyes-godlike', 'Взгляд бога', 'Godlike Gaze', 'legendary', { color: '#fff3a0', color2: '#ff5af0', anim: 'sparkle' }, 'daily'],
    ],
    /** @type {any[][]} */
    AURA: [
        ['aura-none', 'Без ауры', 'None', 'common', { none: true }],
        ['aura-goo', 'Капли', 'Goo Drops', 'common', { type: 'drops', color: '#1a1a2e' }],
        ['aura-cyan', 'Голубое кольцо', 'Cyan Ring', 'common', { type: 'ring', color: '#3af0ff' }],
        ['aura-green', 'Зелёное кольцо', 'Green Ring', 'common', { type: 'ring', color: '#39ff6a' }],
        ['aura-red', 'Красное кольцо', 'Red Ring', 'common', { type: 'ring', color: '#ff3b4d' }],
        ['aura-smoke', 'Дым', 'Smoke', 'uncommon', { type: 'smoke', color: '#3a3550' }],
        ['aura-bubbles', 'Пузыри', 'Bubbles', 'uncommon', { type: 'bubbles', color: '#7fd8ff' }],
        ['aura-sparks', 'Искры', 'Sparks', 'uncommon', { type: 'sparkle', color: '#ffe23a' }],
        ['aura-toxic', 'Ядовитый пар', 'Toxic Fumes', 'uncommon', { type: 'smoke', color: '#7dff00' }],
        ['aura-hearts', 'Сердца', 'Hearts', 'uncommon', { type: 'sparkle', color: '#ff5fd2' }],
        ['aura-purple', 'Фиолетовое пламя', 'Violet Flame', 'rare', { type: 'flame', color: '#b05cff' }],
        ['aura-fire', 'Пламя', 'Flame', 'rare', { type: 'flame', color: '#ff7a00' }],
        ['aura-ice', 'Снежинки', 'Snowflakes', 'rare', { type: 'sparkle', color: '#bdf3ff' }],
        ['aura-bolt', 'Молнии', 'Lightning', 'rare', { type: 'bolt', color: '#7fd8ff' }],
        ['aura-gold', 'Золотая пыль', 'Gold Dust', 'rare', { type: 'sparkle', color: '#ffc23a' }],
        ['aura-dark', 'Тьма', 'Darkness', 'epic', { type: 'smoke', color: '#120820', big: true }],
        ['aura-bloodfire', 'Кровавое пламя', 'Blood Flame', 'epic', { type: 'flame', color: '#ff1a3a', big: true }],
        ['aura-storm', 'Гроза', 'Storm', 'epic', { type: 'bolt', color: '#b05cff', big: true }],
        ['aura-galaxy', 'Галактика', 'Galaxy', 'epic', { type: 'sparkle', color: '#ff6bff', big: true }],
        ['aura-inferno', 'Инферно', 'Inferno', 'legendary', { type: 'flame', color: '#ff5a1e', big: true, ring: true }],
        ['aura-void', 'Бездна', 'Void', 'legendary', { type: 'smoke', color: '#8a3cff', big: true, ring: true }],
        ['aura-rainbow', 'Радуга', 'Rainbow', 'legendary', { type: 'sparkle', color: '#ff3b3b', rainbow: true, big: true }],
        ['aura-sun', 'Солнце', 'Sun', 'legendary', { type: 'flame', color: '#ffd23c', big: true, ring: true }],
        ['aura-frost', 'Вьюга', 'Blizzard', 'epic', { type: 'sparkle', color: '#ffffff', big: true }],
        ['aura-royal-halo', 'Королевский ореол', 'Royal Halo', 'legendary', { type: 'sparkle', color: '#fff3a0', big: true, ring: true, rainbow: true }, 'daily'],
    ],
    /** @type {any[][]} */
    TRAIL: [
        ['trail-none', 'Без следа', 'None', 'common', { none: true }],
        ['trail-goo', 'Слизь', 'Goo', 'common', { color: '#1a1a2e', drops: true }],
        ['trail-white', 'Белый', 'White', 'common', { color: '#ffffff' }],
        ['trail-cyan', 'Голубой', 'Cyan', 'common', { color: '#3af0ff' }],
        ['trail-green', 'Зелёный', 'Green', 'common', { color: '#39ff6a' }],
        ['trail-red', 'Красный', 'Red', 'common', { color: '#ff3b4d' }],
        ['trail-pink', 'Розовый', 'Pink', 'uncommon', { color: '#ff5fd2' }],
        ['trail-yellow', 'Жёлтый', 'Yellow', 'uncommon', { color: '#ffe23a' }],
        ['trail-purple', 'Фиолетовый', 'Purple', 'uncommon', { color: '#b05cff' }],
        ['trail-toxic', 'Яд', 'Toxic', 'uncommon', { color: '#7dff00', drops: true }],
        ['trail-blue', 'Синий', 'Blue', 'uncommon', { color: '#2a6bff' }],
        ['trail-fire', 'Огонь', 'Fire', 'rare', { color: '#ff7a00', fire: true }],
        ['trail-ice', 'Лёд', 'Ice', 'rare', { color: '#bdf3ff', sparkle: true }],
        ['trail-gold', 'Золото', 'Gold', 'rare', { color: '#ffc23a', sparkle: true }],
        ['trail-smoke', 'Дым', 'Smoke', 'rare', { color: '#5a5570', smoke: true }],
        ['trail-hearts', 'Сердечки', 'Hearts', 'rare', { color: '#ff5fd2', sparkle: true }],
        ['trail-bolt', 'Разряд', 'Bolt', 'epic', { color: '#7fd8ff', bolt: true }],
        ['trail-blood', 'Кровавый', 'Blood', 'epic', { color: '#d4001e', drops: true, fire: true }],
        ['trail-void', 'Бездна', 'Void', 'epic', { color: '#8a3cff', smoke: true, sparkle: true }],
        ['trail-stars', 'Звёзды', 'Stars', 'epic', { color: '#fff6c0', sparkle: true, big: true }],
        ['trail-rainbow', 'Радуга', 'Rainbow', 'legendary', { color: '#ff3b3b', rainbow: true, big: true }],
        ['trail-inferno', 'Инферно', 'Inferno', 'legendary', { color: '#ff5a1e', fire: true, big: true }],
        ['trail-galaxy', 'Галактика', 'Galaxy', 'legendary', { color: '#ff6bff', sparkle: true, smoke: true, big: true }],
        ['trail-gold2', 'Королевский', 'Royal', 'legendary', { color: '#ffd23c', sparkle: true, fire: true, big: true }],
        ['trail-milky-way', 'Млечный путь', 'Milky Way', 'legendary', { color: '#9fd8ff', sparkle: true, smoke: true, rainbow: true, big: true }, 'daily'],
    ],
    /** @type {any[][]} */
    POP: [
        ['pop-classic', 'Классика', 'Classic', 'common', { color: '#ffffff', stroke: '#1a1030' }],
        ['pop-green', 'Зелёные', 'Green', 'common', { color: '#7dff4d', stroke: '#0a2a00' }],
        ['pop-cyan', 'Голубые', 'Cyan', 'common', { color: '#4de8ff', stroke: '#002a3a' }],
        ['pop-yellow', 'Жёлтые', 'Yellow', 'common', { color: '#ffe23a', stroke: '#3a2a00' }],
        ['pop-pink', 'Розовые', 'Pink', 'uncommon', { color: '#ff7ad8', stroke: '#3a0028' }],
        ['pop-red', 'Красные', 'Red', 'uncommon', { color: '#ff4d5e', stroke: '#2a0006' }],
        ['pop-purple', 'Фиолетовые', 'Purple', 'uncommon', { color: '#c48aff', stroke: '#200040' }],
        ['pop-orange', 'Оранжевые', 'Orange', 'uncommon', { color: '#ffa04d', stroke: '#3a1400' }],
        ['pop-big', 'Крупные', 'Big', 'rare', { color: '#ffffff', stroke: '#000000', scale: 1.35 }],
        ['pop-goo', 'Слизистые', 'Gooey', 'rare', { color: '#1a1a2e', stroke: '#7dff4d', scale: 1.15 }],
        ['pop-ice', 'Ледяные', 'Icy', 'rare', { color: '#e8fbff', stroke: '#2a8ad8', glow: '#7fd8ff' }],
        ['pop-fire', 'Огненные', 'Fiery', 'rare', { color: '#ffe23a', stroke: '#c81e00', glow: '#ff5a1e' }],
        ['pop-gold', 'Золотые', 'Golden', 'epic', { color: '#ffd23c', stroke: '#6a3a00', glow: '#fff3a0', scale: 1.2 }],
        ['pop-neon', 'Неон', 'Neon', 'epic', { color: '#39ff14', stroke: '#002a00', glow: '#39ff14', scale: 1.15 }],
        ['pop-void', 'Бездна', 'Void', 'epic', { color: '#d8b0ff', stroke: '#14002a', glow: '#8a3cff', scale: 1.2 }],
        ['pop-blood', 'Кровавые', 'Blood', 'epic', { color: '#ff1a3a', stroke: '#200000', glow: '#ff1a3a', scale: 1.2 }],
        ['pop-rainbow', 'Радужные', 'Rainbow', 'legendary', { color: '#ffffff', stroke: '#000000', rainbow: true, scale: 1.3 }],
        ['pop-king', 'Королевские', 'Royal', 'legendary', { color: '#fff3a0', stroke: '#6a3a00', glow: '#ffd23c', scale: 1.45 }],
        ['pop-galaxy', 'Галактика', 'Galaxy', 'legendary', { color: '#ffb0ff', stroke: '#1a0040', glow: '#ff6bff', rainbow: true, scale: 1.35 }],
        ['pop-mint', 'Мятные', 'Mint', 'uncommon', { color: '#a0ffe0', stroke: '#003a2a' }],
    ],
    /** @type {any[][]} */
    WIN: [
        ['win-confetti', 'Конфетти', 'Confetti', 'common', { type: 'confetti', color: '#ffffff' }],
        ['win-goo', 'Фонтан слизи', 'Goo Fountain', 'common', { type: 'fountain', color: '#1a1a2e' }],
        ['win-green', 'Зелёный салют', 'Green Burst', 'common', { type: 'burst', color: '#39ff6a' }],
        ['win-blue', 'Синий салют', 'Blue Burst', 'common', { type: 'burst', color: '#3aa8ff' }],
        ['win-red', 'Красный салют', 'Red Burst', 'uncommon', { type: 'burst', color: '#ff3b4d' }],
        ['win-stars', 'Звездопад', 'Starfall', 'uncommon', { type: 'rain', color: '#fff6c0' }],
        ['win-hearts', 'Сердца', 'Hearts', 'uncommon', { type: 'fountain', color: '#ff5fd2' }],
        ['win-coins', 'Кристаллы', 'Crystals', 'uncommon', { type: 'fountain', color: '#3af0ff' }],
        ['win-fire', 'Огненный столб', 'Fire Pillar', 'rare', { type: 'pillar', color: '#ff7a00' }],
        ['win-ice', 'Ледяной взрыв', 'Ice Blast', 'rare', { type: 'burst', color: '#bdf3ff', big: true }],
        ['win-bolt', 'Удар молнии', 'Lightning Strike', 'rare', { type: 'pillar', color: '#7fd8ff' }],
        ['win-toxic', 'Ядовитый гейзер', 'Toxic Geyser', 'rare', { type: 'fountain', color: '#7dff00', big: true }],
        ['win-void', 'Портал бездны', 'Void Portal', 'epic', { type: 'pillar', color: '#8a3cff', big: true }],
        ['win-gold', 'Золотой дождь', 'Gold Rain', 'epic', { type: 'rain', color: '#ffc23a', big: true }],
        ['win-firework', 'Фейерверк', 'Fireworks', 'epic', { type: 'burst', color: '#ff5fd2', big: true, multi: true }],
        ['win-storm', 'Буря', 'Storm', 'epic', { type: 'pillar', color: '#b05cff', big: true, multi: true }],
        ['win-rainbow', 'Радуга', 'Rainbow', 'legendary', { type: 'burst', color: '#ff3b3b', rainbow: true, big: true, multi: true }],
        ['win-sun', 'Сверхновая', 'Supernova', 'legendary', { type: 'burst', color: '#ffd23c', big: true, multi: true }],
        ['win-galaxy', 'Галактика', 'Galaxy', 'legendary', { type: 'rain', color: '#ff6bff', rainbow: true, big: true }],
        ['win-mint', 'Мятный салют', 'Mint Burst', 'common', { type: 'burst', color: '#7fffd0' }],
    ],

    /** Подарок дня, дни 1–6 (кристаллы = Shop.coins, по нарастающей; на 4 и 6 — ещё и случайная вещь). */
    DAILY_REWARDS: [
        { coins: 40 },
        { coins: 70 },
        { coins: 110 },
        { coins: 150, randomItems: 1, maxRarity: 'rare' },
        { coins: 220 },
        { coins: 320, randomItems: 1, maxRarity: 'epic' },
    ],
    /** Колесо фортуны: 8 секторов по часовой от стрелки. Кристаллов разной величины много, две редкие вещи (случайная из магазина). */
    WHEEL_SECTORS: [
        { coins: 25, weight: 22 },
        { randomItem: true, maxRarity: 'rare', weight: 5 },
        { coins: 60, weight: 18 },
        { coins: 40, weight: 20 },
        { coins: 150, weight: 8 },
        { randomItem: true, maxRarity: 'epic', weight: 2 },
        { coins: 100, weight: 12 },
        { coins: 500, weight: 2 },
    ],

    /** Каталог для Shop.init: вкладки и предметы с ценами (первый в вкладке — бесплатный и надет). */
    build() {
        const groups = { goo: this.GOO, eyes: this.EYES, aura: this.AURA, trail: this.TRAIL, pop: this.POP, win: this.WIN };
        const items = [];
        for (const tab of Object.keys(groups)) {
            groups[tab].forEach((row, i) => {
                const [id, ru, en, rarity, params, kind] = row;
                const it = { id, tab, slot: tab, name: { ru, en }, rarity, params };
                if (kind === 'daily') it.exclusive = 'daily';
                else if (i === 0) it.default = true;
                else {
                    const p = this.PRICE[rarity] || this.PRICE.common;
                    it.price = (i % 3 === 1) ? { coins: p.coins } : { ads: p.ads };
                }
                items.push(it);
            });
        }
        return { tabs: this.TABS.map((t) => ({ id: t.id, name: t.name, icon: t.icon })), items };
    },
};
