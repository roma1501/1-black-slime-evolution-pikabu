// @ts-nocheck
// PikabuPacks.js — наборы за рубли в сборке Пикабу Игр (js/PikabuShop.js). Цены и названия товаров — в Студии
// (каталог CSV: coins_s 19 ₽, coins_m 49 ₽, coins_l 99 ₽, starter 29 ₽, no_ads 59 ₽), здесь — что игрок получает.
// Валюта — монеты движкового Shop (Shop.addCoins), предметы набора — лучшие «за рекламу» из каталога Shop.
PikabuShop.setup({
    colors: ['#3ddc84', '#9c27b0'],
    ready: () => !!(typeof Shop !== 'undefined' && Shop.state && Shop.items().length && typeof Game !== 'undefined'),
    visible: () => Game.state === 'lobby',
    persist: () => Shop._save('pikabu'),
    button: { corner: 'tr', x: 12, y: 74 },
    packs: [
        { id: 'coins_s', type: 'consumable', icon: '🪙', name: 'Горсть монет', desc: '600 монет на слизь, глаза и ауры', grant: () => Shop.addCoins(600) },
        { id: 'coins_m', type: 'consumable', icon: '💰', name: 'Мешок монет', desc: '2 000 монет', grant: () => Shop.addCoins(2000) },
        { id: 'coins_l', type: 'consumable', icon: '🏆', name: 'Сундук монет', desc: '5 000 монет — хватит на самые дорогие предметы', best: true, grant: () => Shop.addCoins(5000) },
        {
            id: 'starter', type: 'non_consumable', icon: '🌌', name: 'Галактическая слизь', best: 'Один раз',
            desc: '1 000 монет, слизь «Галактика», радужные глаза и аура «Бездна»',
            grant: () => Shop.addCoins(1000),
            apply: () => PikabuShop.shopGrant(['goo-galaxy', 'eyes-rainbow', 'aura-void']),
        },
        { id: 'no_ads', type: 'non_consumable', icon: '🚫', name: 'Без рекламы', desc: 'Убирает рекламу между матчами навсегда. Награды за рекламу остаются', noAds: true },
    ],
});
