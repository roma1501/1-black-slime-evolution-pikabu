// GameHud.js — весь интерфейс игры: HUD лобби и арены, окна (Миры, Эволюция, Атаки, Магазин, Подарки, Настройки),
// победа / смерть / золотая площадка / предложение. DOM-слой поверх холста, свои стили (строка CSS внизу файла).
// Образ: «живая чёрная слизь» — глянцевые почти чёрные панели с подтёками, неон цвета текущей эволюции (--evo),
// подтёки-метаболлы (SVG-фильтр gooey), жидкость в шкалах, кнопки-капли с упругим нажатием. Шрифты: --game-title-font (Rubik Wet Paint,
// заголовки и крупные числа) и --game-font (Rubik Bubbles, весь текст интерфейса) — заданы в index.html.
// Размеры — в em от корня: размер корня считает fit() по ширине ПОЛЯ (ViewCap), не окна. Тексты — Lang (GameLang.js).
//
// API (зовёт Game.js): init(handlers), update(dt), setMode('lobby'|'arena'|'hidden'), hp, arena, boss, gate,
// showWin, showDead, askGold, hideOverlays, toast, celebrate, open/close/isOpen, offer.
// handlers: { onStage(i), onLobby(), onRevive(), onClaim(mult), onHowTo(), onSound(on), onQuality(q) }.

// Свои значки (SVG, нарисованы здесь): колесо и календарь — в наборе иконок их нет.
const GH_SVG_WHEEL = (() => {
    let g = '';
    for (let i = 0; i < 8; i++) {
        const a0 = (i - 0.5) * Math.PI / 4, a1 = (i + 0.5) * Math.PI / 4, r = 27;
        const p = (/** @type {number} */ a) => (32 + r * Math.sin(a)).toFixed(1) + ' ' + (32 - r * Math.cos(a)).toFixed(1);
        g += '<path d="M32 32L' + p(a0) + 'A' + r + ' ' + r + ' 0 0 1 ' + p(a1) + 'Z" fill="' + (i % 2 ? '#7a2aff' : '#c8ff1e') + '"/>';
    }
    return 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' + g + '<circle cx="32" cy="32" r="29" fill="none" stroke="#ffc23a" stroke-width="4"/><circle cx="32" cy="32" r="8" fill="#0b0b12" stroke="#ffc23a" stroke-width="3"/><path d="M26 2h12l-6 12z" fill="#ff3b4d" stroke="#05050a" stroke-width="2" stroke-linejoin="round"/></svg>');
})();
const GH_SVG_CAL = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="6" y="10" width="52" height="46" rx="10" fill="#f4f1ff" stroke="#05050a" stroke-width="3"/><path d="M6 20a10 10 0 0 1 10-10h32a10 10 0 0 1 10 10v6H6z" fill="#c8ff1e" stroke="#05050a" stroke-width="3"/><rect x="17" y="4" width="6" height="12" rx="3" fill="#0b0b12"/><rect x="41" y="4" width="6" height="12" rx="3" fill="#0b0b12"/><g fill="#7a2aff"><circle cx="18" cy="36" r="4"/><circle cx="32" cy="36" r="4"/><circle cx="46" cy="36" r="4"/><circle cx="18" cy="47" r="4"/><circle cx="32" cy="47" r="4"/></g><circle cx="46" cy="47" r="5" fill="#ffc23a" stroke="#05050a" stroke-width="2"/></svg>');
const GH_ICONS = {
    abilities: 'assets/ui/icons/abilities.webp',
    ad: 'assets/ui/icons/ad.webp',
    'attack-frost': 'assets/ui/icons/attack-frost.webp',
    'attack-hole': 'assets/ui/icons/attack-hole.webp',
    'attack-lash': 'assets/ui/icons/attack-lash.webp',
    'attack-meteor': 'assets/ui/icons/attack-meteor.webp',
    'attack-nova': 'assets/ui/icons/attack-nova.webp',
    'attack-slam': 'assets/ui/icons/attack-slam.webp',
    'attack-spikes': 'assets/ui/icons/attack-spikes.webp',
    'attack-spit': 'assets/ui/icons/attack-spit.webp',
    'attack-storm': 'assets/ui/icons/attack-storm.webp',
    'attack-toxic': 'assets/ui/icons/attack-toxic.webp',
    aura: 'assets/ui/icons/aura.webp',
    'boost-slime': 'assets/ui/icons/boost-slime.webp',
    'boost-speed': 'assets/ui/icons/boost-speed.webp',
    'boost-wins': 'assets/ui/icons/boost-wins.webp',
    boss: 'assets/ui/icons/boss.webp',
    check: 'assets/ui/icons/check.webp',
    close: 'assets/ui/icons/close.webp',
    evolve: 'assets/ui/icons/evolve.webp',
    eyes: 'assets/ui/icons/eyes.webp',
    gem: 'assets/ui/icons/gem.webp',
    gift: 'assets/ui/icons/gift.webp',
    goo: 'assets/ui/icons/goo.webp',
    heart: 'assets/ui/icons/heart.webp',
    home: 'assets/ui/icons/home.webp',
    level: 'assets/ui/icons/level.webp',
    lock: 'assets/ui/icons/lock.webp',
    pack: 'assets/ui/icons/pack.webp',
    pop: 'assets/ui/icons/pop.webp',
    portal: 'assets/ui/icons/portal.webp',
    question: 'assets/ui/icons/question.webp',
    settings: 'assets/ui/icons/settings.webp',
    shop: 'assets/ui/icons/shop.webp',
    skull: 'assets/ui/icons/skull.webp',
    slime: 'assets/ui/icons/slime.webp',
    'sound-off': 'assets/ui/icons/sound-off.webp',
    'sound-on': 'assets/ui/icons/sound-on.webp',
    star: 'assets/ui/icons/star.webp',
    trail: 'assets/ui/icons/trail.webp',
    trophy: 'assets/ui/icons/trophy.webp',
    win: 'assets/ui/icons/win.webp',
    worlds: 'assets/ui/icons/worlds.webp',
    wheel: GH_SVG_WHEEL,
    calendar: GH_SVG_CAL,
};
// Запасная картинка, если файла иконки нет: тёмная капля с неоновой точкой (никаких «битых» картинок).
const GH_FALLBACK = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 4C20 22 10 30 10 42a22 22 0 0 0 44 0C54 30 44 22 32 4z" fill="#14141f" stroke="#4de8ff" stroke-width="3"/><circle cx="24" cy="40" r="4" fill="#4de8ff"/><circle cx="40" cy="40" r="4" fill="#4de8ff"/></svg>');
// Портреты форм, боссы и баннеры миров (Codex): литеральные пути — их видит сканер ассетов.
const GH_EVO_IMG = ['assets/ui/evo/evo-0.webp', 'assets/ui/evo/evo-1.webp', 'assets/ui/evo/evo-2.webp', 'assets/ui/evo/evo-3.webp', 'assets/ui/evo/evo-4.webp',
    'assets/ui/evo/evo-5.webp', 'assets/ui/evo/evo-6.webp', 'assets/ui/evo/evo-7.webp', 'assets/ui/evo/evo-8.webp', 'assets/ui/evo/evo-9.webp'];
const GH_BOSS_IMG = ['assets/ui/boss/boss-1.webp', 'assets/ui/boss/boss-2.webp', 'assets/ui/boss/boss-3.webp'];
const GH_WORLD_IMG = ['assets/ui/worlds/world-1.webp', 'assets/ui/worlds/world-2.webp', 'assets/ui/worlds/world-3.webp'];
const GH_LOGO_IMG = (String(GAME_PLATFORM) === 'pikabu' ? 'assets/ui/logo-pikabu.webp' : 'assets/ui/logo.webp');
const GH_BOOST_ICON = { slime2: 'boost-slime', wins2: 'boost-wins', speed2: 'boost-speed' };
const GH_WORLD_PLAY_COLORS = { low: '#ff5a5a', mid: '#ffd23c', ok: '#5df07a' };

// ---- маленькие помощники DOM (имена с префиксом gh — глобальные в классических скриптах) ---------------------------

/** @param {any} e @param {any} kids */
function ghAdd(e, kids) {
    if (kids == null || kids === false) return;
    if (Array.isArray(kids)) { for (const k of kids) ghAdd(e, k); return; }
    if (typeof kids === 'string' || typeof kids === 'number') { e.appendChild(document.createTextNode(String(kids))); return; }
    e.appendChild(kids);
}
/** @param {string} tag @param {string} [cls] @param {any} [kids] @returns {HTMLElement} */
function ghEl(tag, cls, kids) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (kids != null) ghAdd(e, kids);
    return e;
}
/** @param {string} cls @param {any} kids @param {(e: Event) => void} [onclick] @returns {HTMLButtonElement} */
function ghBtn(cls, kids, onclick) {
    const b = /** @type {HTMLButtonElement} */ (ghEl('button', cls, kids));
    b.type = 'button';
    if (onclick) b.addEventListener('click', onclick);
    return b;
}
/** Иконка по имени (литеральные пути — в GH_ICONS). @param {string} name @param {string} [cls] @returns {HTMLImageElement} */
function ghIcon(name, cls) {
    const img = /** @type {HTMLImageElement} */ (document.createElement('img'));
    img.className = 'gh-ico' + (cls ? ' ' + cls : '');
    img.alt = ''; img.draggable = false;
    img.onerror = () => { img.onerror = null; img.src = GH_FALLBACK; };
    img.src = GH_ICONS[name] || GH_FALLBACK;
    return img;
}
/** Картинка с запасной иконкой, если файла нет. @param {string} src @param {string} cls @param {string} [fallbackIcon] @returns {HTMLImageElement} */
function ghImg(src, cls, fallbackIcon) {
    const img = /** @type {HTMLImageElement} */ (document.createElement('img'));
    img.className = cls; img.alt = ''; img.draggable = false;
    img.onerror = () => { img.onerror = null; img.src = GH_ICONS[fallbackIcon || 'slime'] || GH_FALLBACK; };
    img.src = src;
    return img;
}
/** Номер босса (0..2) по миру этапа. @param {number} stageIdx */
function ghBossIdx(stageIdx) {
    const st = GD.STAGES[stageIdx];
    return Math.max(0, Math.min(GH_BOSS_IMG.length - 1, ((st && st.world) || 1) - 1));
}
/** @param {string} s @param {any} [p] @returns {string} */
function ghT(s, p) { return Lang.t(s, p); }
/** mm:ss. @param {number} s */
function ghTime(s) { s = Math.max(0, Math.ceil(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
/** #rrggbb -> «r,g,b». @param {string} hex */
function ghRgb(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return '77,232,255';
    const n = parseInt(m[1], 16);
    return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
}
/** Склонение по ключу «один|два|пять» (en: «one|many|many»). @param {number} n @param {string} key */
function ghPlural(n, key) {
    const parts = ghT('hud.pl.' + key).split('|');
    n = Math.abs(Math.floor(n));
    let i;
    if (Lang.code === 'ru') {
        const a = n % 10, b = n % 100;
        i = (a === 1 && b !== 11) ? 0 : (a >= 2 && a <= 4 && (b < 12 || b > 14)) ? 1 : 2;
    } else i = n === 1 ? 0 : 1;
    return parts[i] || parts[0] || '';
}
/** Текст награды { gems, wins, slimeLevels, boost }. @param {any} r */
function ghRewardText(r) {
    const out = [];
    if (r.gems) out.push('+' + fmtNum(r.gems) + ' ' + ghPlural(r.gems, 'gem'));
    if (r.wins) out.push(ghT('hud.reward', { n: r.wins, pl: ghPlural(r.wins, 'win') }));
    if (r.slimeLevels) out.push(ghT('hud.pack', { n: r.slimeLevels, lv: ghPlural(r.slimeLevels, 'level') }));
    if (r.boost) out.push(ghT('hud.boost.' + r.boost));
    return out.join(' · ');
}
/** Что получил игрок (DailyGift.claim / Wheel.finish → got[]): «+25 кристаллов · Хром». @param {any[]} got */
function ghGotText(got) {
    return (got || []).map((/** @type {any} */ g) => g.type === 'coins' ? ghRewardText({ gems: g.amount }) : (typeof Shop !== 'undefined' ? Shop.name(g.id) : String(g.id))).join(' · ');
}
/** Иконка + число награды для карточек подарков. @param {any} r @returns {{ icon: string, text: string, sub: string }} */
function ghRewardView(r) {
    if (r.gems) return { icon: 'gem', text: ghT('hud.giftGems', { n: fmtNum(r.gems) }), sub: ghPlural(r.gems, 'gem') };
    if (r.wins) return { icon: 'trophy', text: ghT('hud.giftWins', { n: r.wins }), sub: ghPlural(r.wins, 'win') };
    if (r.slimeLevels) return { icon: 'level', text: ghT('hud.giftLevels', { n: r.slimeLevels }), sub: '' };
    if (r.boost) {
        const sec = r.sec || (GD.BOOSTS[r.boost] && GD.BOOSTS[r.boost].sec) || 0;
        return { icon: GH_BOOST_ICON[r.boost] || 'star', text: ghT('hud.boost.' + r.boost), sub: ghT('hud.minShort', { n: Math.round(sec / 60) }) };
    }
    return { icon: 'star', text: '', sub: '' };
}

// ---- процедурные «картинки» косметики (CSS / SVG по params из GameShopData) ----------------------------------------

/** Звезда-искра SVG. */
function ghStar(x, y, s) {
    return '<path d="M' + x + ' ' + (y - s) + 'L' + (x + s * 0.28) + ' ' + (y - s * 0.28) + 'L' + (x + s) + ' ' + y + 'L' + (x + s * 0.28) + ' ' + (y + s * 0.28) +
        'L' + x + ' ' + (y + s) + 'L' + (x - s * 0.28) + ' ' + (y + s * 0.28) + 'L' + (x - s) + ' ' + y + 'L' + (x - s * 0.28) + ' ' + (y - s * 0.28) + 'z"/>';
}
/** Язычок пламени SVG. */
function ghFlame(x, y, s) {
    return '<path d="M' + x + ' ' + y + 'c' + (-7 * s) + ' ' + (-8 * s) + ' ' + (-1 * s) + ' ' + (-15 * s) + ' ' + (1 * s) + ' ' + (-24 * s) + 'c' + (2 * s) + ' ' + (7 * s) + ' ' + (11 * s) + ' ' + (12 * s) + ' ' + (7 * s) + ' ' + (24 * s) + 'z"/>';
}
/** Капля SVG. */
function ghDrop(x, y, s) {
    return '<path d="M' + x + ' ' + y + 'q' + (4 * s) + ' ' + (7 * s) + ' 0 ' + (10 * s) + 'q' + (-4 * s) + ' ' + (-3 * s) + ' 0 ' + (-10 * s) + 'z"/>';
}
/** Зигзаг молнии. */
function ghBolt(x, y, s) {
    return '<polyline points="' + (x + 6 * s) + ',' + y + ' ' + x + ',' + (y + 18 * s) + ' ' + (x + 8 * s) + ',' + (y + 18 * s) + ' ' + (x + 2 * s) + ',' + (y + 38 * s) + '" fill="none" stroke-width="' + (4 * s) + '" stroke-linejoin="round" stroke-linecap="round"/>';
}
/** SVG эффекта: aura / trail / win. @param {string} tab @param {any} p @returns {string} */
function ghFxSvg(tab, p) {
    const c = p.color || '#ffffff';
    let g = '';
    if (p.none) {
        return '<svg class="gh-fx" viewBox="0 0 100 100"><circle cx="50" cy="50" r="26" fill="none" stroke="#6a6a88" stroke-width="5"/><path d="M32 68L68 32" stroke="#6a6a88" stroke-width="5" stroke-linecap="round"/></svg>';
    }
    if (tab === 'aura') {
        const t = p.type, big = p.big;
        g += '<rect x="41" y="40" width="18" height="40" rx="9" fill="#0b0b12" stroke="#4a4f78" stroke-width="2"/>';
        g += '<g fill="' + c + '" stroke="' + c + '" style="color:' + c + '">';
        if (t === 'ring' || p.ring) g += '<ellipse cx="50" cy="80" rx="32" ry="9" fill="none" stroke-width="4"/><ellipse cx="50" cy="38" rx="' + (big ? 30 : 24) + '" ry="7" fill="none" stroke-width="3" opacity=".7"/>';
        if (t === 'drops') g += ghDrop(26, 30, 1.3) + ghDrop(72, 40, 1.1) + ghDrop(34, 60, 1) + ghDrop(66, 66, 1.3) + ghDrop(50, 14, 1);
        if (t === 'smoke') g += '<circle cx="30" cy="62" r="13" opacity=".4" stroke="none"/><circle cx="70" cy="56" r="15" opacity=".4" stroke="none"/><circle cx="50" cy="28" r="14" opacity=".35" stroke="none"/><circle cx="64" cy="78" r="10" opacity=".45" stroke="none"/><circle cx="34" cy="36" r="9" opacity=".4" stroke="none"/>';
        if (t === 'bubbles') g += '<g fill="none" stroke-width="2.5"><circle cx="28" cy="58" r="9"/><circle cx="72" cy="46" r="7"/><circle cx="62" cy="76" r="6"/><circle cx="36" cy="30" r="5"/><circle cx="76" cy="20" r="4"/></g>';
        if (t === 'sparkle') g += ghStar(26, 40, 9) + ghStar(74, 58, 11) + ghStar(36, 74, 6) + ghStar(66, 22, 7);
        if (t === 'flame') g += ghFlame(24, 80, 1.1) + ghFlame(76, 80, 1.1) + ghFlame(36, 84, 0.8) + ghFlame(64, 84, 0.9);
        if (t === 'bolt') g += ghBolt(26, 24, 1.1) + ghBolt(66, 30, 1);
        g += '</g>';
    } else if (tab === 'trail') {
        g += '<g style="color:' + c + '" fill="' + c + '" stroke="' + c + '">';
        g += '<path d="M8 78C28 38 52 92 92 32" fill="none" stroke-width="' + (p.big ? 11 : 7) + '" stroke-linecap="round" opacity=".85"/>';
        g += '<path d="M8 78C28 38 52 92 92 32" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".6"/>';
        if (p.drops) g += ghDrop(30, 62, 1.1) + ghDrop(52, 74, 1) + ghDrop(74, 54, 1.1);
        if (p.fire) g += ghFlame(34, 70, 0.8) + ghFlame(62, 62, 0.9);
        if (p.sparkle) g += ghStar(24, 52, 6) + ghStar(60, 80, 7) + ghStar(84, 50, 5);
        if (p.smoke) g += '<circle cx="28" cy="70" r="9" opacity=".35" stroke="none"/><circle cx="56" cy="76" r="11" opacity=".3" stroke="none"/><circle cx="80" cy="46" r="9" opacity=".35" stroke="none"/>';
        if (p.bolt) g += ghBolt(30, 44, 0.8) + ghBolt(62, 52, 0.7);
        g += '</g>';
    } else {
        const t = p.type;
        g += '<g style="color:' + c + '" fill="' + c + '" stroke="' + c + '">';
        if (t === 'confetti') {
            const cols = [c, '#ffffff', '#ffd23c', '#5df07a', '#ff5fd2'];
            for (let i = 0; i < 14; i++) g += '<rect x="' + (12 + (i * 37) % 76) + '" y="' + (10 + (i * 53) % 72) + '" width="7" height="4" rx="1" fill="' + cols[i % 5] + '" stroke="none" transform="rotate(' + (i * 47) + ' ' + (15 + (i * 37) % 76) + ' ' + (12 + (i * 53) % 72) + ')"/>';
        } else if (t === 'burst') {
            for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5, x1 = 50 + Math.cos(a) * 14, y1 = 50 + Math.sin(a) * 14, x2 = 50 + Math.cos(a) * (p.big ? 42 : 34), y2 = 50 + Math.sin(a) * (p.big ? 42 : 34); g += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke-width="4" stroke-linecap="round"/>'; }
            g += '<circle cx="50" cy="50" r="8" stroke="none"/>';
            if (p.multi) g += ghStar(20, 22, 7) + ghStar(80, 78, 7);
        } else if (t === 'fountain') {
            g += '<path d="M50 90C50 40 22 30 12 70M50 90C50 36 78 28 88 70M50 90V24" fill="none" stroke-width="4" stroke-dasharray="1 9" stroke-linecap="round"/>';
            g += '<circle cx="50" cy="20" r="5" stroke="none"/><circle cx="18" cy="52" r="4" stroke="none"/><circle cx="82" cy="52" r="4" stroke="none"/><ellipse cx="50" cy="90" rx="22" ry="6" stroke="none" opacity=".6"/>';
        } else if (t === 'rain') {
            for (let i = 0; i < 8; i++) g += '<line x1="' + (14 + i * 11) + '" y1="' + (12 + (i * 29) % 34) + '" x2="' + (14 + i * 11) + '" y2="' + (30 + (i * 29) % 34) + '" stroke-width="4" stroke-linecap="round"/>' + ghStar(14 + i * 11, 70 + (i * 13) % 20, 3.5);
        } else {
            g += '<defs><linearGradient id="gh-pg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="' + c + '"/><stop offset="1" stop-color="' + c + '" stop-opacity="0"/></linearGradient></defs>';
            g += '<rect x="36" y="6" width="28" height="82" fill="url(#gh-pg)" stroke="none"/><ellipse cx="50" cy="88" rx="26" ry="7" stroke="none"/>';
            if (p.multi) g += '<rect x="14" y="30" width="14" height="58" fill="url(#gh-pg)" stroke="none"/><rect x="72" y="30" width="14" height="58" fill="url(#gh-pg)" stroke="none"/>';
        }
        g += '</g>';
    }
    return '<svg class="gh-fx' + (p.rainbow ? ' gh-rb' : '') + '" viewBox="0 0 100 100" aria-hidden="true">' + g + '</svg>';
}
/** Образец предмета (CSS/SVG) по вкладке и params. @param {string} tab @param {any} p @returns {HTMLElement} */
function ghSwatch(tab, p) {
    p = p || {};
    const w = ghEl('div', 'gh-sw gh-swt-' + tab);
    if (tab === 'goo') {
        const b = ghEl('div', 'gh-sw-goo' + (p.anim ? ' an-' + p.anim : ''));
        b.style.setProperty('--c', p.color || '#101018');
        b.style.setProperty('--c2', p.color2 || p.color || '#101018');
        b.style.setProperty('--rim', p.rim || '#4a4f78');
        b.style.setProperty('--spec', String(p.spec == null ? 0.9 : p.spec));
        b.style.setProperty('--emis', p.emis || p.rim || '#4a4f78');
        w.appendChild(b);
        if (p.anim === 'sparkle' || p.anim === 'void') w.appendChild(ghEl('i', 'gh-stars'));
    } else if (tab === 'eyes') {
        const face = ghEl('div', 'gh-sw-face');
        const c1 = p.evo ? 'var(--evo)' : (p.color || '#fff');
        for (let i = 0; i < 2; i++) {
            const e = ghEl('i', 'gh-slit' + (p.anim ? ' an-' + p.anim : ''));
            e.style.setProperty('--c', c1);
            e.style.setProperty('--c2', p.color2 || c1);
            face.appendChild(e);
        }
        w.appendChild(face);
        if (p.anim === 'sparkle') w.appendChild(ghEl('i', 'gh-stars'));
    } else if (tab === 'pop') {
        const t = ghEl('b', 'gh-sw-pop' + (p.rainbow ? ' gh-rb' : ''), '+25');
        t.style.color = p.color || '#fff';
        t.style.setProperty('-webkit-text-stroke', '0.2em ' + (p.stroke || '#000'));
        t.style.fontSize = (1.9 * (p.scale || 1)) + 'em';
        if (p.glow) t.style.textShadow = '0 0 .4em ' + p.glow + ', 0 0 .9em ' + p.glow;
        w.appendChild(t);
    } else {
        w.innerHTML = ghFxSvg(tab, p);
    }
    return w;
}
/** Портрет формы (картинка Codex); если файла нет — нарисованная капля. @param {number} e @param {string} glow @returns {HTMLElement} */
function ghPortrait(e, glow) {
    const img = /** @type {HTMLImageElement} */ (document.createElement('img'));
    img.className = 'gh-portrait'; img.alt = ''; img.draggable = false;
    img.style.setProperty('--g', glow); img.style.setProperty('--grgb', ghRgb(glow));
    img.onerror = () => { img.onerror = null; if (img.parentNode) img.parentNode.replaceChild(ghBlob(glow, e), img); };
    img.src = GH_EVO_IMG[Math.max(0, Math.min(GH_EVO_IMG.length - 1, e))];
    return img;
}
/** Капля слизи с глазами цвета glow — «портрет» формы. @param {string} glow @param {number} [seed] */
function ghBlob(glow, seed) {
    const b = ghEl('div', 'gh-blob');
    b.style.setProperty('--g', glow);
    b.style.setProperty('--grgb', ghRgb(glow));
    b.appendChild(ghEl('i', 'gh-blob-eye l'));
    b.appendChild(ghEl('i', 'gh-blob-eye r'));
    b.appendChild(ghEl('i', 'gh-blob-mouth'));
    const spikes = Math.min(5, 1 + Math.floor((seed || 0) / 2));
    for (let i = 0; i < spikes; i++) { const s = ghEl('i', 'gh-blob-spike'); s.style.setProperty('--i', String(i)); s.style.setProperty('--n', String(spikes)); b.appendChild(s); }
    return b;
}


/** Подтёки: полоса-обод + капли; фильтр #gh-goo склеивает их в тянущиеся нити. @param {number} n @param {number} [seed] @returns {HTMLElement} */
function ghDrips(n, seed) {
    const w = ghEl('div', 'gh-drips');
    w.appendChild(ghEl('b'));
    let s = ((seed || 1) * 9301 + 49297) % 233280;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < n; i++) {
        const d = ghEl('i');
        d.style.setProperty('--x', (6 + 88 * (i + 0.15 + rnd() * 0.7) / n).toFixed(1) + '%');
        d.style.setProperty('--w', (0.85 + rnd() * 0.45).toFixed(2) + 'em');
        d.style.setProperty('--l', (0.9 + rnd() * 1.1).toFixed(2) + 'em');
        d.style.setProperty('--t', (5 + rnd() * 5).toFixed(1) + 's');
        d.style.setProperty('--d', (-rnd() * 9).toFixed(1) + 's');
        w.appendChild(d);
    }
    return w;
}
/** Пузырьки, медленно всплывающие внутри панели. @returns {HTMLElement} */
function ghBubbles() { return ghEl('div', 'gh-bub', [ghEl('i')]); }
/** Скрытые SVG-определения: фильтр «gooey» (размытие + порог по альфе) — склеивает близкие капли в метаболлы. @returns {HTMLElement} */
function ghDefs() {
    const d = ghEl('div', 'gh-defs');
    d.setAttribute('aria-hidden', 'true');
    d.innerHTML = '<svg width="0" height="0" focusable="false"><defs><filter id="gh-goo" x="-15%" y="-30%" width="130%" height="170%" color-interpolation-filters="sRGB">' +
        '<feGaussianBlur in="SourceGraphic" stdDeviation="2.4" result="b"/><feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"/></filter></defs></svg>';
    return d;
}

/** @satisfies {Record<string, any>} */
const GameHud = {
    /** Все изменяемое — здесь (одним мешком, чтобы не объявлять свойства по одному). @type {any} */
    S: {
        inited: false, h: null, mode: 'hidden', root: null, win: null, ov: null, k: 1, busy: false,
        soundOn: true, world: 0, shopTab: 'goo', shopSel: '', acc: 0, evoRgb: '', last: {}, raf: 0,
    },

    // =============================================================================================
    // Запуск
    // =============================================================================================

    init(handlers) {
        const S = this.S;
        S.h = handlers || {};
        if (S.inited) return;
        S.inited = true;
        const st = document.createElement('style');
        st.id = 'gh-style';
        st.textContent = GH_CSS + GH_CSS_WIN + GH_CSS_SW + GH_CSS_END;
        document.head.appendChild(st);
        const root = ghEl('div', 'gh-root gh-m-hidden');
        root.id = 'gh-root';
        root.setAttribute('data-hl', 'ui');
        S.root = root;
        document.body.appendChild(root);
        this._build();
        this._fit();
        this._applyEvo();
        S.soundOn = typeof Sound !== 'undefined' ? !Sound.muted : true;
        window.addEventListener('resize', () => this._fit());
        window.addEventListener('lory-viewcap', () => this._fit());
        window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.win && Platform.name !== 'playgama') { this.close(); } });
        window.addEventListener('touchstart', () => { if (!S.root.classList.contains('gh-touch')) S.root.classList.add('gh-touch'); }, { passive: true, once: true });
        root.addEventListener('pointerdown', (e) => { const t = /** @type {HTMLElement} */ (e.target); if (t && t.closest && t.closest('button,.gh-win')) e.stopPropagation(); });
        try { if (typeof Input !== 'undefined' && Input.on) Input.on('device', () => this._fit()); } catch (e) { /* без Input */ }
        GS.on((e) => this._onGs(e));
        if (typeof Shop !== 'undefined') Shop.on((e) => { if (e.type !== 'preview') this._onShop(e); });
        if (typeof Platform !== 'undefined' && Platform.onRewardedCooldown) Platform.onRewardedCooldown(() => this._adRefresh());
        this._refreshAll();
    },

    /** Размер корня: em интерфейса от ширины поля игры и высоты окна. */
    _fit() {
        const S = this.S, r = S.root;
        if (!r) return;
        const W = typeof ViewCap !== 'undefined' ? ViewCap.width() : window.innerWidth, H = window.innerHeight;
        const portrait = H > W;
        let k = portrait ? Math.min(W / 400, H / 760) : Math.min(W / 1000, H / 640);
        k = Math.max(portrait ? 0.8 : 0.74, Math.min(1.35, k));
        S.k = k;
        r.style.setProperty('--k', k.toFixed(3));
        r.classList.toggle('gh-port', portrait);
        r.classList.toggle('gh-land', !portrait);
        r.classList.toggle('gh-narrow', W < 760);
        r.classList.toggle('gh-low', !portrait && H <= 460);
        const touch = (typeof IS_MOBILE !== 'undefined' && IS_MOBILE) || (typeof Input !== 'undefined' && (Input.device === 'touch' || Input.touchSeen));
        if (touch) r.classList.add('gh-touch');
        this._touchLayout(r.classList.contains('gh-touch'));
    },

    /** Сенсорный экран: полоса уровня и наборы — наверх под цель; низ свободен под джойстик и кнопку прыжка. */
    _touchLayout(touch) {
        const S = this.S, bar = S.lobbyBar;
        if (!bar || !S.centerCol || !S.bottomRow) return;
        if (touch && bar.parentNode !== S.centerCol) S.centerCol.insertBefore(bar, S.centerCol.firstChild);
        else if (!touch && bar.parentNode !== S.bottomRow) S.bottomRow.insertBefore(bar, S.bottomRow.firstChild);
        S.obsT = 0;
    },

    /** Прямоугольники видимых панелей HUD (экранные px): подписи мира под ними прячутся (Game.declutter). */
    obstacles() {
        const S = this.S, now = performance.now();
        if (S.obs && now - (S.obsT || 0) < 400) return S.obs;
        S.obsT = now;
        const list = [];
        for (const el of [S.curCol, S.goal, S.lobbyBar, S.menu, S.offersCol, S.sysCol, S.hp, S.wave, S.boss, S.gate]) {
            if (!el || el.hidden || !el.offsetParent) continue;
            const r = el.getBoundingClientRect();
            if (r.width > 2 && r.height > 2) list.push({ x0: r.left, y0: r.top, x1: r.right, y1: r.bottom, hud: true });
        }
        S.obs = list;
        return list;
    },

    _applyEvo() {
        const S = this.S, g = GD.EVOLUTIONS[GS.save ? GS.evo : 0].glow;
        S.root.style.setProperty('--evo', g);
        S.root.style.setProperty('--evo-rgb', ghRgb(g));
    },

    // =============================================================================================
    // Постоянные элементы HUD
    // =============================================================================================

    _build() {
        const S = this.S, R = S.root;
        const ref = (/** @type {string} */ k, /** @type {HTMLElement} */ e) => { S[k] = e; return e; };

        R.appendChild(ghDefs());
        const frame = ghEl('div', 'gh-frame');
        // --- верх: валюта, центр (цель / арена), системные кнопки
        const cur = ref('curCol', ghEl('div', 'gh-cur', [
            ref('lvlBadge', ghEl('div', 'gh-lvl gh-goo', [ghEl('small', '', ghT('hud.lvlShort')), ref('lvlNum', ghEl('b', 'gh-t', '1'))])),
            ghEl('div', 'gh-chips', [
                ghEl('div', 'gh-chip gh-goo', [ghIcon('trophy'), ref('winsNum', ghEl('b', 'gh-t', '0'))]),
                ghEl('div', 'gh-chip gh-goo', [ghIcon('gem'), ref('gemsNum', ghEl('b', 'gh-t', '0'))]),
            ]),
        ]));
        cur.setAttribute('data-m', 'lobby');
        const goal = ghEl('div', 'gh-goal gh-goo', [ghDrips(6, 3), ghEl('span', 'gh-goal-text'), ghEl('b', 'gh-goal-n')]);
        goal.setAttribute('data-m', 'lobby');
        ref('goal', goal);
        const wave = ghEl('div', 'gh-wave gh-goo', [ref('waveText', ghEl('span', 'gh-t')), ref('waveBar', ghEl('i', 'gh-wave-bar'))]);
        wave.setAttribute('data-m', 'arena'); wave.hidden = true; ref('wave', wave);
        const boss = ghEl('div', 'gh-boss gh-goo', [
            ref('bossIco', ghIcon('boss', 'gh-boss-ico')),
            ghEl('div', 'gh-boss-main', [ref('bossName', ghEl('b', 'gh-t gh-boss-name')), ghEl('div', 'gh-bar gh-bar-boss', [ref('bossFill', ghEl('i')), ref('bossNum', ghEl('span', 'gh-bar-num gh-t'))])]),
        ]);
        boss.hidden = true; ref('boss', boss);
        const gate = ghEl('div', 'gh-gate gh-goo', [ref('gateText', ghEl('b', 'gh-t'))]);
        gate.hidden = true; ref('gate', gate);
        const center = ref('centerCol', ghEl('div', 'gh-center', [goal, wave, boss, gate]));
        const sys = ref('sysCol', ghEl('div', 'gh-sys', [
            (Platform.name === 'playables' || String(GAME_PLATFORM) === 'playables') ? null : ref('soundBtn', ghBtn('gh-round gh-btn', ghIcon('sound-on'), () => this._toggleSound())),
            ghBtn('gh-round gh-btn', ghIcon('settings'), () => this.open('settings')),
        ]));
        sys.firstElementChild.setAttribute('aria-label', ghT('hud.sound'));
        sys.lastElementChild.setAttribute('aria-label', ghT('hud.settings'));
        const top = ghEl('div', 'gh-top', [cur, center, sys]);

        // --- середина: меню слева, предложения справа
        const mk = (name, icon, key) => {
            const b = ghBtn('gh-mbtn gh-btn gh-goo', [ghIcon(icon, 'gh-mbtn-ico'), ghEl('span', 'gh-mbtn-cap gh-t', ghT(key)), ref(name + 'Badge', (() => { const bd = ghEl('i', 'gh-badge', '!'); bd.hidden = true; return bd; })())], () => this.open(name));
            b.setAttribute('data-win', name);
            return b;
        };
        const menu = ghEl('div', 'gh-menu', [ref('menuGb', ghEl('div', 'gh-gb')), mk('worlds', 'worlds', 'hud.worlds'), mk('evolve', 'evolve', 'hud.evolve'), mk('abilities', 'abilities', 'hud.attacks'), mk('shop', 'shop', 'hud.shop'), mk('gifts', 'gift', 'hud.gifts'), mk('daily', 'calendar', 'hud.daily'), mk('wheel', 'wheel', 'hud.wheel'), mk('leaders', 'trophy', 'hud.leaders'), mk('packs', 'pack', 'hud.packsBtn')]);
        menu.querySelector('[data-win="packs"]').classList.add('gh-touch-only');
        menu.setAttribute('data-m', 'lobby');
        ref('menu', menu);
        S.leadersBtn = menu.querySelector('[data-win="leaders"]');
        S.leadersBtn.hidden = true;
        const offers = ref('offersCol', ghEl('div', 'gh-offers', [this._mkBoost('slime2', 'lobby'), this._mkBoost('wins2', 'lobby'), this._mkBoost('speed2', 'arena')]));
        const mid = ghEl('div', 'gh-mid', [menu, offers]);

        // --- низ: уровень + наборы (лобби), здоровье (арена)
        const lvlBar = ghEl('div', 'gh-lvlbar gh-goo', [
            ghEl('div', 'gh-bar gh-bar-lvl', [ref('xpFill', ghEl('i')), ref('lvlText', ghEl('b', 'gh-bar-l gh-t')), ref('xpText', ghEl('span', 'gh-bar-num gh-t'))]),
            ref('totalText', ghEl('small', 'gh-total')),
        ]);
        const packs = ghEl('div', 'gh-packs', GS.PACKS.map((p) => this._mkPack(p)));
        const lobbyBottom = ref('lobbyBar', ghEl('div', 'gh-lobbybar', [lvlBar, packs]));
        lobbyBottom.setAttribute('data-m', 'lobby');
        const hp = ghEl('div', 'gh-hp', [ghIcon('heart', 'gh-hp-ico'), ghEl('div', 'gh-bar gh-bar-hp', [ref('hpFill', ghEl('i')), ref('hpNum', ghEl('span', 'gh-bar-num gh-t'))])]);
        hp.setAttribute('data-m', 'arena'); ref('hp', hp);
        const bottom = ref('bottomRow', ghEl('div', 'gh-bottom', [lobbyBottom, hp]));

        frame.appendChild(top); frame.appendChild(mid); frame.appendChild(bottom);
        R.appendChild(frame);
        R.appendChild(ref('toasts', ghEl('div', 'gh-toasts')));
        R.appendChild(ref('layer', ghEl('div', 'gh-layer')));
        R.appendChild(ref('celLayer', ghEl('div', 'gh-cel-layer')));
    },

    /** Кнопка-предложение «x2 …» за рекламу. */
    _mkBoost(id, mode) {
        const b = ghBtn('gh-offer gh-btn gh-ad', [
            ghEl('div', 'gh-offer-top', [ghIcon(GH_BOOST_ICON[id], 'gh-offer-ico'), ghEl('div', 'gh-offer-txt', [ghEl('b', 'gh-t gh-offer-name', ghT('hud.boost.' + id)), ghEl('i', 'gh-offer-timer')])]),
            ghEl('div', 'gh-adrow', [ghIcon('ad'), ghEl('span', 'gh-sub')]),
        ], () => this._watchBoost(id));
        b.setAttribute('data-m', mode); b.setAttribute('data-ad', '1'); b.setAttribute('data-boost', id);
        b.querySelector('.gh-sub').setAttribute('data-base', ghT('hud.ad'));
        return b;
    },
    /** Кнопка набора уровней. */
    _mkPack(p) {
        const b = ghBtn('gh-pack gh-btn gh-ad', [
            ghEl('b', 'gh-t gh-pack-t', ghT('hud.pack', { n: p.levels, lv: ghPlural(p.levels, 'level') })),
            ghEl('div', 'gh-adrow', [ghIcon('ad'), ghEl('span', 'gh-sub')]),
        ], () => this._watchPack(p));
        b.setAttribute('data-ad', '1'); b.setAttribute('data-pack', p.id);
        return b;
    },

    async _toggleSound() {
        const S = this.S;
        S.soundOn = !S.soundOn;
        try { if (S.h.onSound) S.h.onSound(S.soundOn); } catch (e) { console.error(e); }
        if (typeof Sound !== 'undefined') S.soundOn = !Sound.muted;
        this._refreshAll();
        if (S.win && S.win.name === 'settings') this._win_settings();
    },

    // =============================================================================================
    // Рекламные действия (rewarded, без паузы игры)
    // =============================================================================================

    /** Один рекламный поток за раз; false — реклама не показана / отказ. */
    async _ad(fn) {
        const S = this.S;
        if (S.busy) return false;
        S.busy = true;
        this._adRefresh();
        try { return await fn(); } catch (e) { console.error(e); return false; } finally { S.busy = false; this._adRefresh(); }
    },
    _adFail() { this.toast(ghT('hud.adFail'), 2400, 'bad'); },

    async _watchBoost(id) {
        const ok = await this._ad(() => GS.watchBoost(id));
        if (ok) this.toast(ghT('hud.boostLine.' + id), 2600, 'good'); else this._adFail();
    },
    async _watchPack(p) {
        const res = await this._ad(() => GS.watchPack(p));
        if (res === 'done') this.celebrate({ title: ghT('hud.packDone', { n: p.levels, lv: ghPlural(p.levels, 'level') }), sub: ghT('hud.levelN', { n: GS.level }), color: GD.EVOLUTIONS[GS.evo].glow, icon: 'level' });
        else if (res === 'progress') { const i = GS.packInfo(p); this.toast(ghT('hud.adProg', { a: i.done, b: i.need }), 2000, 'info'); } else this._adFail();
    },

    /** Подписи «Через N с» и доступность всех кнопок рекламы. */
    _adRefresh() {
        const S = this.S;
        if (!S.root || typeof Platform === 'undefined') return;
        const cd = Platform.rewardedCooldownLeft(), sup = Platform.rewardedSupported();
        const label = cd > 0 ? (Platform.rewardedCooldownLabel() || ghT('hud.adIn', { n: Math.ceil(cd) })) : '';
        for (const el of /** @type {NodeListOf<HTMLButtonElement>} */ (S.root.querySelectorAll('[data-ad]'))) {
            el.classList.toggle('gh-hide', !sup);
            const sub = el.querySelector('.gh-sub');
            if (sub) { const t = label || sub.getAttribute('data-base') || ghT('hud.ad'); if (sub.textContent !== t) sub.textContent = t; }
            el.disabled = cd > 0 || S.busy || GS.adBusy;
        }
        if (S.win && S.win.adTick) S.win.adTick(cd);
    },

    // =============================================================================================
    // Состояние HUD
    // =============================================================================================

    setMode(mode) {
        const S = this.S;
        if (!S.root) return;
        if (S.mode !== mode && S.win) this.close();
        if (S.mode !== mode) S.goalT = 0;
        S.mode = mode;
        S.root.classList.remove('gh-m-lobby', 'gh-m-arena', 'gh-m-hidden');
        S.root.classList.add('gh-m-' + mode);
        if (mode !== 'arena') { S.boss.hidden = true; S.gate.hidden = true; }
        if (mode === 'hidden') this.hideOverlays();
        this._refreshAll();
    },

    hp(hp, max) {
        const S = this.S;
        if (!S.hpFill) return;
        const r = max > 0 ? Math.max(0, Math.min(1, hp / max)) : 0;
        S.hpFill.style.width = (r * 100).toFixed(1) + '%';
        S.hpFill.className = r > 0.5 ? '' : r > 0.25 ? 'mid' : 'low';
        const t = Math.ceil(hp) + ' / ' + Math.ceil(max);
        if (S.hpNum.textContent !== t) S.hpNum.textContent = t;
        if (S.last.hp != null && hp < S.last.hp) { S.hp.classList.remove('hit'); void S.hp.offsetWidth; S.hp.classList.add('hit'); }
        S.last.hp = hp;
    },
    arena(o) {
        const S = this.S;
        if (!S.waveText || !o) return;
        S.waveText.textContent = ghT('hud.waveLine', { stage: o.stage, wave: o.wave, waves: o.waves, left: o.left });
        const r = o.total > 0 ? Math.max(0, Math.min(1, 1 - o.left / o.total)) : 0;
        S.waveBar.style.width = (r * 100).toFixed(1) + '%';
        S.wave.hidden = false;
    },
    boss(info) {
        const S = this.S;
        if (!S.boss) return;
        if (!info) { S.boss.hidden = true; return; }
        S.boss.hidden = false;
        const r = info.max > 0 ? Math.max(0, Math.min(1, info.hp / info.max)) : 0;
        S.bossName.textContent = info.name || '';
        const bi = GH_BOSS_IMG[ghBossIdx(typeof Game !== 'undefined' ? Game.stage : 0)];
        if (S.bossIco && S.bossIco.getAttribute('data-s') !== bi) { S.bossIco.setAttribute('data-s', bi); S.bossIco.onerror = () => { S.bossIco.onerror = null; S.bossIco.src = GH_ICONS.boss; }; S.bossIco.src = bi; S.bossIco.classList.add('art'); }
        S.bossFill.style.width = (r * 100).toFixed(1) + '%';
        S.bossNum.textContent = fmtNum(Math.ceil(info.hp)) + ' / ' + fmtNum(info.max);
    },
    gate(on) {
        const S = this.S;
        if (!S.gate) return;
        S.gate.hidden = false;
        S.gate.classList.toggle('clear', !on);
        S.gateText.textContent = ghT(on ? 'hud.gateWin' : 'hud.gateClear');
    },

    // =============================================================================================
    // Кадр и обновление значений
    // =============================================================================================

    update(dt) {
        const S = this.S;
        if (!S.inited) return;
        S.acc += dt;
        S.goalT = (S.goalT || 0) + Math.min(dt, 0.1);
        if (S.acc < 0.25) return;
        S.acc = 0;
        this._refreshAll();
    },

    _setText(el, t, bump) {
        if (!el || el.textContent === t) return;
        const first = el.textContent === '' || el.textContent === '0';
        el.textContent = t;
        if (bump && !first) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
    },

    /** Все значения HUD из GS / Shop / Platform (дёшево, ~4 раза в секунду и по событиям). */
    _refreshAll() {
        const S = this.S;
        if (!S.root || !GS.save) return;
        this._setText(S.winsNum, fmtNum(GS.wins), true);
        this._setText(S.gemsNum, fmtNum(GS.gems), true);
        this._setText(S.lvlNum, String(GS.level), true);
        const need = GS.need();
        S.xpFill.style.width = Math.max(0, Math.min(100, GS.xp / need * 100)).toFixed(1) + '%';
        this._setText(S.lvlText, ghT('hud.levelN', { n: GS.level }));
        this._setText(S.xpText, fmtNum(GS.xp) + ' / ' + fmtNum(need));
        this._setText(S.totalText, ghT('hud.total', { n: fmtNum(GS.save.total) }));
        // цель
        const g = GS.goal(), gt = S.goal.querySelector('.gh-goal-text'), gn = S.goal.querySelector('.gh-goal-n');
        if (gt.textContent !== g.text) gt.textContent = g.text;
        const gs = g.b > 1 ? '(' + g.a + '/' + g.b + ')' : '';
        if (gn.textContent !== gs) gn.textContent = gs;
        // телефон: цель видна 6 с после изменения и гаснет, чтобы не закрывать игру
        // (время — игровое, из update: загрузка его не съедает)
        const gkey = g.text + gs;
        if (gkey !== S.goalKey) { S.goalKey = gkey; S.goalT = 0; }
        S.goal.classList.toggle('gh-goal-hide', S.root.classList.contains('gh-touch') && (S.goalT || 0) > 6);
        // значки меню
        const ev = GS.evoInfo();
        S.evolveBadge.hidden = !ev.canEvolve;
        const ready = GS.playtimeReadyCount();
        S.giftsBadge.hidden = ready <= 0;
        const gcap = S.menu.querySelector('[data-win="gifts"] .gh-mbtn-cap');
        if (gcap) {
            let t = ghT('hud.gifts');
            if (ready > 0) t = ghT('hud.claim');
            else { const n = GS.playtimeNext(); if (n >= 0) t = ghTime(GS.playtimeState(n).left); }
            if (gcap.textContent !== t) gcap.textContent = t;
            gcap.parentElement.classList.toggle('ready', ready > 0);
        }
        // бусты: таймеры
        for (const el of /** @type {NodeListOf<HTMLElement>} */ (S.root.querySelectorAll('[data-boost]'))) {
            const id = el.getAttribute('data-boost'), left = GS.boostLeft(id), tm = el.querySelector('.gh-offer-timer');
            const t = left > 0 ? ghTime(left) : ghT('hud.minShort', { n: Math.round(GD.BOOSTS[id].sec / 60) });
            if (tm.textContent !== t) tm.textContent = t;
            el.classList.toggle('active', left > 0);
        }
        // паки: оставшиеся просмотры
        for (const el of /** @type {NodeListOf<HTMLElement>} */ (S.root.querySelectorAll('[data-pack]'))) {
            const p = GS.PACKS.find((x) => x.id === el.getAttribute('data-pack')), i = GS.packInfo(p);
            const sub = el.querySelector('.gh-sub'), base = ghT('hud.adProg', { a: i.done, b: i.need });
            if (sub.getAttribute('data-base') !== base) { sub.setAttribute('data-base', base); sub.textContent = base; }
        }
        // Подарок дня, колесо, рекорды
        if (typeof DailyGift !== 'undefined' && DailyGift.state) {
            const dOk = DailyGift.canClaim();
            S.dailyBadge.hidden = !dOk;
            this._capTimer(S.menu.querySelector('[data-win="daily"]'), dOk, dOk ? '' : DailyGift.formatTime(DailyGift.msToNextDay()), 'hud.daily');
        }
        if (typeof Wheel !== 'undefined' && Wheel.state) {
            const ws = Wheel.status();
            S.wheelBadge.hidden = !ws.freeAvailable || !!ws.pending;
            this._capTimer(S.menu.querySelector('[data-win="wheel"]'), ws.freeAvailable, ws.freeAvailable ? '' : Wheel.formatTime(ws.nextFreeMs), 'hud.wheel');
        }
        const lb = this._lbOn();
        if (S.leadersBtn.hidden === lb || !S.menuGb.firstChild) { S.leadersBtn.hidden = !lb; this._menuGb(); }
        // кнопка звука
        const sb = S.soundBtn && S.soundBtn.firstElementChild;   // в Playables кнопки звука нет
        const want = GH_ICONS[S.soundOn ? 'sound-on' : 'sound-off'];
        if (sb && sb.getAttribute('src') !== want) sb.setAttribute('src', want);
        this._adRefresh();
        if (S.win && S.win.tick) S.win.tick();
    },

    /** Подпись кнопки меню: ключ, когда можно забрать; иначе таймер до следующего раза. */
    _capTimer(btn, ready, timer, key) {
        if (!btn) return;
        const cap = btn.querySelector('.gh-mbtn-cap');
        const t = ready ? ghT(key) : timer;
        if (cap.textContent !== t) cap.textContent = t;
        btn.classList.toggle('ready', ready);
    },
    /** Таблица рекордов есть только на площадках с лидербордом (дёшево, без запроса к SDK). */
    _lbOn() {
        if (typeof Platform === 'undefined') return false;
        if (Platform.name === 'yandex') return true;
        // Playgama: таблицу рисует игра только при in_game; на остальных площадках её нет или её показывает площадка
        const br = /** @type {any} */ (window).bridge;
        return Platform.name === 'playgama' && !!(br && br.leaderboards && br.leaderboards.type === 'in_game');
    },
    /** Слизистая подложка меню: по одному комку на видимую кнопку. */
    _menuGb() {
        const S = this.S, n = S.menu.querySelectorAll('.gh-mbtn:not([hidden])').length;
        S.menuGb.textContent = '';
        for (let i = 0; i < n; i++) S.menuGb.appendChild(ghEl('i'));
    },

    _onGs(e) {
        const S = this.S;
        if (!S.root) return;
        if (e.type === 'evo') this._applyEvo();
        this._refreshAll();
        if (S.win && S.win.refresh && e.type !== 'slime' && e.type !== 'boost') {
            if (!S.raf) S.raf = requestAnimationFrame(() => { S.raf = 0; if (S.win && S.win.refresh) S.win.refresh(); });
        }
    },
    _onShop(e) {
        const S = this.S;
        this._refreshAll();
        if (S.win && S.win.name === 'shop') {
            if (!S.raf) S.raf = requestAnimationFrame(() => { S.raf = 0; if (S.win && S.win.name === 'shop') this._shopRender(); });
        }
    },

    // =============================================================================================
    // Тосты и праздничные плашки
    // =============================================================================================

    toast(text, ms, kind) {
        const S = this.S;
        if (!S.toasts || !text) return;
        const t = ghEl('div', 'gh-toast gh-goo ' + (kind || 'info'), [ghEl('span', 'gh-t', text)]);
        while (S.toasts.children.length >= 3) S.toasts.removeChild(S.toasts.firstChild);
        S.toasts.appendChild(t);
        const life = ms || 2200;
        t.style.animationDuration = '.32s, .3s';
        t.style.animationDelay = '0s, ' + Math.max(0, life - 300) + 'ms';
        setTimeout(() => t.remove(), life);
    },

    celebrate(o) {
        const S = this.S;
        if (!S.celLayer || !o) return;
        S.celLayer.textContent = '';
        const c = o.color || GD.EVOLUTIONS[GS.evo].glow;
        let art = '';
        if (o.image === 'evo') art = GH_EVO_IMG[Math.max(0, Math.min(GH_EVO_IMG.length - 1, o.index == null ? GS.evo : o.index))];
        else if (o.icon === 'evolve') art = GH_EVO_IMG[Math.max(0, Math.min(GH_EVO_IMG.length - 1, GS.evo))];
        else if (o.icon === 'boss') art = GH_BOSS_IMG[ghBossIdx(typeof Game !== 'undefined' ? Game.stage : 0)];
        const ico = art ? ghImg(art, 'gh-cel-art', o.icon || 'evolve') : o.icon ? (o.icon.indexOf('/') >= 0 ? (() => { const i = /** @type {HTMLImageElement} */ (ghEl('img', 'gh-ico gh-cel-ico')); i.src = o.icon; return i; })() : ghIcon(o.icon, 'gh-cel-ico')) : null;
        const el = ghEl('div', 'gh-cel', [ghEl('i', 'gh-cel-rays'), ico, ghEl('b', 'gh-cel-title gh-t', o.title || ''), o.sub ? ghEl('span', 'gh-cel-sub gh-t', o.sub) : null]);
        el.style.setProperty('--cc', c);
        el.style.setProperty('--cc-rgb', ghRgb(c));
        S.celLayer.appendChild(el);
        setTimeout(() => el.remove(), 2400);
    },

    // =============================================================================================
    // Окна: открыть / закрыть
    // =============================================================================================

    isOpen() { return !!this.S.win; },

    open(name) {
        const S = this.S;
        if (!S.root || S.mode === 'hidden') return;
        if (S.win) this._closeWin(true);
        const defs = {
            worlds: { icon: 'worlds', title: 'hud.worlds', cls: 'w-worlds', fn: '_win_worlds' },
            evolve: { icon: 'evolve', title: 'hud.evolve', cls: 'w-evolve', fn: '_win_evolve' },
            abilities: { icon: 'abilities', title: 'hud.attacks', cls: 'w-abil', fn: '_win_abilities' },
            shop: { icon: 'shop', title: 'hud.shop', cls: 'w-shop', fn: '_win_shop' },
            gifts: { icon: 'gift', title: 'hud.giftsTitle', cls: 'w-gifts', fn: '_win_gifts' },
            daily: { icon: 'calendar', title: 'hud.dailyTitle', cls: 'w-daily', fn: '_win_daily' },
            wheel: { icon: 'wheel', title: 'hud.wheelTitle', cls: 'w-wheel', fn: '_win_wheel' },
            leaders: { icon: 'trophy', title: 'hud.leadersTitle', cls: 'w-leaders', fn: '_win_leaders' },
            settings: { icon: 'settings', title: 'hud.settingsTitle', cls: 'w-settings', fn: '_win_settings' },
            packs: { icon: 'pack', title: 'hud.packsTitle', cls: 'w-packs', fn: '_win_packs' },
        };
        const d = defs[name];
        if (!d) return;
        if (S.ov) return;   // поверх окна-результата (победа, смерть, предложение) окна не открываются
        if (name === 'leaders' && !this._lbOn()) return;
        const win = this._panel(d.cls, d.icon, ghT(d.title), () => this.close());
        const modal = ghEl('div', 'gh-modal', [win.el]);
        modal.addEventListener('pointerdown', (e) => { if (e.target === modal) this.close(); });
        S.layer.appendChild(modal);
        S.win = { name, modal, body: win.body, head: win.head, refresh: null, tick: null, adTick: null };
        if (typeof Pause !== 'undefined') Pause.set('manual', true);
        if (typeof Input !== 'undefined' && Input.configure) Input.configure({ controls: false });
        this[d.fn]();
        this._adRefresh();
    },

    close() { this._closeWin(false); },

    _closeWin(swap) {
        const S = this.S;
        if (!S.win) return;
        const wasShop = S.win.name === 'shop';
        S.win.modal.remove();
        S.win = null;
        if (wasShop && typeof Shop !== 'undefined') Shop.clearPreview();
        if (!swap) {
            if (typeof Pause !== 'undefined') Pause.set('manual', false);
            if (typeof Input !== 'undefined' && Input.configure) Input.configure({ controls: true });
        }
        this._refreshAll();
    },

    /** Панель окна с шапкой (иконка, заголовок, закрыть). @returns {{ el: HTMLElement, body: HTMLElement, head: HTMLElement }} */
    _panel(cls, icon, title, onClose, extra) {
        const body = ghEl('div', 'gh-wbody');
        const head = ghEl('div', 'gh-whead', [
            ghIcon(icon, 'gh-whead-ico'), ghEl('h2', 'gh-wtitle gh-t', title), ghEl('span', 'gh-grow'),
            extra || null,
            onClose ? (() => { const b = ghBtn('gh-round gh-btn gh-close', ghIcon('close'), onClose); b.setAttribute('aria-label', ghT('hud.close')); return b; })() : null,
        ]);
        const el = ghEl('div', 'gh-win gh-goo ' + cls, [ghBubbles(), ghDrips(7, cls.length + 5), head, body]);
        el.setAttribute('role', 'dialog');
        return { el, body, head };
    },

    /** Модальное окно-оверлей (победа, смерть…): по одному. */
    _overlay(cls, icon, title, build, onClose) {
        const S = this.S;
        this._clearOverlay();
        const p = this._panel('gh-sm ' + cls, icon, title, onClose || null);
        build(p.body);
        const modal = ghEl('div', 'gh-modal gh-ovl', [p.el]);
        S.layer.appendChild(modal);
        S.ov = modal;
        this._adRefresh();
    },
    _clearOverlay() { const S = this.S; if (S.ov) { S.ov.remove(); S.ov = null; } },

    hideOverlays() {
        const S = this.S;
        this._clearOverlay();
        if (S.win) this.close();
        if (S.gate) S.gate.hidden = true;
    },

    // =============================================================================================
    // Окно «Миры»
    // =============================================================================================

    _win_worlds() {
        const S = this.S, w = S.win;
        if (!w.init) { w.init = true; S.world = Math.max(0, Math.min(GD.WORLDS.length - 1, (GD.STAGES[GS.save.stage] || GD.STAGES[0]).world - 1)); }
        w.refresh = () => this._win_worlds();
        const tabs = ghEl('div', 'gh-tabs');
        GD.WORLDS.forEach((wd, wi) => {
            const t = ghBtn('gh-tab gh-btn' + (wi === S.world ? ' on' : ''), [ghEl('b', 'gh-t', tr(wd.name))], () => { S.world = wi; this._win_worlds(); });
            t.style.setProperty('--tc', wd.color); t.style.setProperty('--tc-rgb', ghRgb(wd.color));
            if (GH_WORLD_IMG[wi]) { t.classList.add('gh-wtab'); t.style.setProperty('--wimg', 'url("' + GH_WORLD_IMG[wi] + '")'); }
            tabs.appendChild(t);
        });
        const wd = GD.WORLDS[S.world];
        const grid = ghEl('div', 'gh-stages');
        grid.style.setProperty('--tc', wd.color); grid.style.setProperty('--tc-rgb', ghRgb(wd.color));
        GD.STAGES.forEach((st, i) => {
            if (st.world !== wd.id) return;
            const unlocked = GS.stageUnlocked(i), cleared = GS.stageCleared(i), pw = GS.stagePower(i);
            const col = pw < 0.6 ? GH_WORLD_PLAY_COLORS.low : pw < 1 ? GH_WORLD_PLAY_COLORS.mid : GH_WORLD_PLAY_COLORS.ok;
            const card = ghEl('div', 'gh-stage gh-goo' + (unlocked ? '' : ' locked') + (st.boss ? ' boss' : '') + (cleared ? ' done' : ''));
            const head = ghEl('div', 'gh-stage-head', [
                st.boss ? ghImg(GH_BOSS_IMG[ghBossIdx(i)], 'gh-stage-ico gh-stage-boss', 'boss') : ghIcon('skull', 'gh-stage-ico'),
                ghEl('div', 'gh-stage-name', [ghEl('b', 'gh-t', ghT('hud.stage', { n: i + 1 })), st.boss ? ghEl('small', 'boss-name', ghT('hud.bossName', { name: tr(GD.MOBS[st.boss].name) })) : null]),
                cleared ? ghIcon('check', 'gh-stage-state') : (!unlocked ? ghIcon('lock', 'gh-stage-state') : null),
            ]);
            const rec = ghEl('div', 'gh-stage-rec', [ghEl('span', '', ghT('hud.recLevel', { n: st.rec[0] }))]);
            rec.style.color = col;
            const rw = ghEl('div', 'gh-stage-rw', [ghIcon('trophy'), ghEl('b', 'gh-t', ghT('hud.reward', { n: st.wins, pl: ghPlural(st.wins, 'win') }))]);
            let btn;
            if (!unlocked) btn = ghEl('div', 'gh-stage-lock', ghT('hud.needStage', { n: i }));
            else {
                btn = ghBtn('gh-btn pri gh-stage-play', [ghEl('b', 'gh-t', ghT('hud.play'))], () => { this.close(); if (S.h.onStage) S.h.onStage(i); });
            }
            ghAdd(card, [head, rec, rw, btn]);
            grid.appendChild(card);
        });
        w.body.textContent = '';
        ghAdd(w.body, [tabs, grid]);
    },

    // =============================================================================================
    // Окно «Эволюция»
    // =============================================================================================

    _formCard(e, label, big) {
        const evo = GD.EVOLUTIONS[e];
        const c = ghEl('div', 'gh-form gh-goo' + (big ? ' big' : ''));
        c.style.setProperty('--g', evo.glow); c.style.setProperty('--grgb', ghRgb(evo.glow));
        ghAdd(c, [ghEl('small', 'gh-form-label', label), ghPortrait(e, evo.glow), ghEl('b', 'gh-t gh-form-name', tr(evo.name)), ghEl('span', 'gh-form-mult', ghT('hud.evoMult', { n: GD.evoMult(e) }))]);
        return c;
    },
    _req(label, a, b) {
        const ok = a >= b, r = ghEl('div', 'gh-req' + (ok ? ' ok' : ''));
        ghAdd(r, [ghEl('div', 'gh-req-top', [ghEl('span', '', label), ok ? ghIcon('check', 'gh-req-ok') : null]), ghEl('div', 'gh-bar gh-bar-req', [(() => { const i = ghEl('i'); i.style.width = Math.min(100, b > 0 ? a / b * 100 : 100) + '%'; return i; })()])]);
        return r;
    },
    _win_evolve() {
        const S = this.S, w = S.win, info = GS.evoInfo();
        w.refresh = () => this._win_evolve();
        w.body.textContent = '';
        if (info.max) {
            ghAdd(w.body, [ghEl('div', 'gh-evo-row one', [this._formCard(GS.evo, ghT('hud.evoNow'), true)]), ghEl('div', 'gh-evo-max gh-t', ghT('hud.evoMax'))]);
            return;
        }
        const next = info.next, at = GD.ATTACKS[next.attack];
        const atk = ghEl('div', 'gh-form-atk', [
            ghIcon('attack-' + at.icon, 'gh-atk-ico'),
            ghEl('div', '', [ghEl('small', 'gh-form-label', ghT('hud.evoNewAttack')), ghEl('b', 'gh-t', tr(at.name)), ghEl('span', 'gh-atk-desc', tr(at.desc))]),
        ]);
        const nextCard = this._formCard(GS.evo + 1, ghT('hud.evoNext'), true);
        nextCard.appendChild(atk);
        const row = ghEl('div', 'gh-evo-row', [this._formCard(GS.evo, ghT('hud.evoNow'), false), ghEl('div', 'gh-arrow'), nextCard]);
        const reqs = ghEl('div', 'gh-reqs', [ghEl('small', 'gh-form-label', ghT('hud.evoNeed')), this._req(ghT('hud.reqLevel', { a: Math.min(GS.level, next.level), b: next.level }), GS.level, next.level), this._req(ghT('hud.reqWins', { a: Math.min(GS.wins, next.wins), b: next.wins }), GS.wins, next.wins)]);
        const evBtn = ghBtn('gh-btn pri gh-big', [ghEl('b', 'gh-t', ghT('hud.doEvolve'))], () => { if (GS.evolve()) this.close(); });
        evBtn.disabled = !info.canEvolve;
        const adBtn = ghBtn('gh-btn gh-ad gh-big', [ghEl('div', 'gh-adrow big', [ghIcon('ad'), ghEl('b', 'gh-t', ghT('hud.evoAd'))]), ghEl('span', 'gh-sub')], async () => {
            const res = await this._ad(() => GS.watchEvoAd());
            if (res === 'evolved') this.close();
            else if (res === 'progress') { const i = GS.evoInfo(); this.toast(ghT('hud.evoProgress', { a: i.adsDone, b: i.adsNeed }), 2200, 'good'); this._win_evolve(); } else this._adFail();
        });
        adBtn.setAttribute('data-ad', '1');
        adBtn.querySelector('.gh-sub').setAttribute('data-base', ghT('hud.adProg', { a: info.adsDone, b: info.adsNeed }));
        const btns = ghEl('div', 'gh-evo-btns', [evBtn, adBtn]);
        ghAdd(w.body, [row, reqs, btns, ghEl('p', 'gh-hint', ghT('hud.evoHint'))]);
    },

    // =============================================================================================
    // Окно «Атаки»
    // =============================================================================================

    _win_abilities() {
        const S = this.S, w = S.win;
        w.refresh = () => this._win_abilities();
        const list = ghEl('div', 'gh-atks');
        GD.EVOLUTIONS.forEach((ev, j) => {
            const a = GD.ATTACKS[ev.attack], open = GS.evo >= j;
            const row = ghEl('div', 'gh-atk gh-goo' + (open ? ' open' : ' locked'));
            row.style.setProperty('--g', ev.glow); row.style.setProperty('--grgb', ghRgb(ev.glow));
            let stats = ghT('hud.attackStats', { m: a.mult, cd: a.cd });
            if (a.targets) stats += ghT('hud.attackTargets', { n: a.targets }); else if (a.radius) stats += ghT('hud.attackArea');
            ghAdd(row, [
                ghEl('div', 'gh-atk-icon', [ghIcon('attack-' + a.icon, 'gh-atk-ico'), ghImg(GH_EVO_IMG[j], 'gh-atk-evo', 'evolve')]),
                ghEl('div', 'gh-atk-main', [ghEl('b', 'gh-t', tr(a.name)), ghEl('span', 'gh-atk-desc', tr(a.desc)), ghEl('small', 'gh-atk-stats', stats)]),
                ghEl('div', 'gh-atk-state', open ? [ghIcon('check')] : [ghIcon('lock'), ghEl('small', '', ghT('hud.attackLocked', { name: tr(ev.name) }))]),
            ]);
            list.appendChild(row);
        });
        w.body.textContent = '';
        w.body.appendChild(list);
    },

    // =============================================================================================
    // Окно «Подарки»
    // =============================================================================================

    _win_gifts() {
        const S = this.S, w = S.win;
        w.refresh = () => this._win_gifts();
        w.cells = [];
        const grid = ghEl('div', 'gh-gifts');
        const next = GS.playtimeNext();
        GD.PLAYTIME.forEach((g, i) => {
            const stt = GS.playtimeState(i), rv = ghRewardView(g.reward);
            const cell = ghEl('div', 'gh-gift gh-goo ' + stt.state);
            const timer = ghEl('div', 'gh-gift-timer gh-t', stt.state === 'wait' ? ghTime(stt.left) : '');
            ghAdd(cell, [
                ghIcon(rv.icon, 'gh-gift-ico'),
                ghEl('b', 'gh-t gh-gift-amt', rv.text),
                ghEl('small', 'gh-gift-sub', rv.sub || ' '),
            ]);
            if (stt.state === 'claimed') ghAdd(cell, ghEl('div', 'gh-gift-done', [ghIcon('check'), ghEl('small', '', ghT('hud.giftGot'))]));
            else if (stt.state === 'ready') ghAdd(cell, ghBtn('gh-btn ok gh-gift-btn', [ghEl('b', 'gh-t', ghT('hud.giftTake'))], () => this._claimGift(i, false)));
            else {
                cell.appendChild(timer);
                if (i === next) {
                    const ab = ghBtn('gh-btn gh-ad gh-gift-btn', [ghEl('div', 'gh-adrow', [ghIcon('ad'), ghEl('b', 'gh-t', ghT('hud.giftNow'))]), ghEl('span', 'gh-sub')], () => this._claimGift(i, true));
                    ab.setAttribute('data-ad', '1'); ab.querySelector('.gh-sub').setAttribute('data-base', ghT('hud.ad'));
                    cell.appendChild(ab);
                }
            }
            w.cells.push({ i, state: stt.state, timer });
            grid.appendChild(cell);
        });
        w.body.textContent = '';
        ghAdd(w.body, [grid, ghEl('p', 'gh-hint', ghT('hud.giftsHint'))]);
        w.tick = () => {
            let changed = false;
            for (const c of w.cells) {
                const s = GS.playtimeState(c.i);
                if (s.state !== c.state) changed = true;
                else if (s.state === 'wait') { const t = ghTime(s.left); if (c.timer.textContent !== t) c.timer.textContent = t; }
            }
            if (changed && S.win === w) this._win_gifts();
        };
    },
    async _claimGift(i, ad) {
        let r;
        if (ad) {
            r = await this._ad(() => GS.watchPlaytime(i));
            if (!r) { this._adFail(); return; }
        } else r = GS.claimPlaytime(i, false);
        if (r) this.toast(ghT('hud.rewardToast') + ' ' + ghRewardText(r), 2600, 'good');
        if (this.S.win && this.S.win.name === 'gifts') this._win_gifts();
    },

    // =============================================================================================
    // Окно «Настройки»
    // =============================================================================================

    /** Окно «Уровни» (телефон): наборы уровней за рекламу — с экрана они убраны, чтобы не закрывать игру. */
    _win_packs() {
        const S = this.S, w = S.win;
        if (!w) return;
        w.body.textContent = '';
        ghAdd(w.body, ghEl('div', 'gh-packs-win', [ghEl('p', 'gh-t gh-packs-hint', ghT('hud.packsHint')), ...GS.PACKS.map((p) => this._mkPack(p))]));
        this._adRefresh();
    },

    _win_settings() {
        const S = this.S, w = S.win;
        if (!w) return;
        w.refresh = null;
        const on = S.soundOn;
        const sound = ghEl('div', 'gh-set-row gh-goo', [ghIcon(on ? 'sound-on' : 'sound-off', 'gh-set-ico'), ghEl('b', 'gh-t gh-grow', ghT('hud.sound')), ghBtn('gh-switch gh-btn' + (on ? ' on' : ''), [ghEl('i'), ghEl('span', 'gh-t', ghT(on ? 'hud.on' : 'hud.off'))], () => this._toggleSound())]);
        const cur = typeof Quality !== 'undefined' ? Quality.choice : 'auto';
        const seg = ghEl('div', 'gh-seg');
        for (const q of ['auto', 'low', 'medium', 'high']) {
            seg.appendChild(ghBtn('gh-btn gh-segb' + (cur === q ? ' on' : ''), [ghEl('b', 'gh-t', ghT('hud.q.' + q))], () => {
                try { if (S.h.onQuality) S.h.onQuality(q); } catch (e) { console.error(e); }
                if (S.win && S.win.name === 'settings') this._win_settings();
            }));
        }
        const qrow = ghEl('div', 'gh-set-col gh-goo', [ghEl('b', 'gh-t', ghT('hud.quality')), seg]);
        const how = ghBtn('gh-btn pri gh-big', [ghIcon('question', 'gh-btn-ico'), ghEl('b', 'gh-t', ghT('hud.howTo'))], () => { this.close(); if (S.h.onHowTo) S.h.onHowTo(); });
        w.body.textContent = '';
        ghAdd(w.body, ghEl('div', 'gh-set', [ghImg(GH_LOGO_IMG, 'gh-set-logo', 'slime'), (Platform.name === 'playables' || String(GAME_PLATFORM) === 'playables') ? null : sound, qrow, how]));
    },

    // =============================================================================================
    // Окно «Магазин»
    // =============================================================================================

    _win_shop() {
        const S = this.S, w = S.win;
        w.refresh = null;
        if (typeof Shop === 'undefined' || !Shop.state) { w.body.textContent = ''; return; }
        w.gems = ghEl('b', 'gh-t', fmtNum(GS.gems));
        const chip = ghEl('div', 'gh-chip gh-goo gh-shop-gems', [ghIcon('gem'), w.gems]);
        w.head.insertBefore(chip, w.head.querySelector('.gh-close'));
        w.body.textContent = '';
        w.tabsEl = ghEl('div', 'gh-tabs shop');
        w.main = ghEl('div', 'gh-shop');
        w.gridEl = ghEl('div', 'gh-sgrid');
        w.detail = ghEl('div', 'gh-sdetail gh-goo');
        w.main.appendChild(w.gridEl); w.main.appendChild(w.detail);
        ghAdd(w.body, [w.tabsEl, w.main]);
        w.body.classList.add('gh-shopbody');
        w.adTick = () => this._shopDetail();
        this._shopRender();
    },
    _shopRender() {
        const S = this.S, w = S.win;
        if (!w || w.name !== 'shop' || !w.gridEl) return;
        w.gems.textContent = fmtNum(GS.gems);
        // вкладки
        w.tabsEl.textContent = '';
        const tabs = GameShopData.TABS;
        if (!tabs.find((t) => t.id === S.shopTab)) S.shopTab = tabs[0].id;
        for (const t of tabs) {
            const b = ghBtn('gh-tab gh-btn' + (t.id === S.shopTab ? ' on' : ''), [ghIcon(t.icon, 'gh-tab-ico'), ghEl('b', 'gh-t gh-tab-cap', tr(t.name))], () => { S.shopTab = t.id; S.shopSel = ''; this._shopRender(); });
            w.tabsEl.appendChild(b);
        }
        const cards = Shop.cards(S.shopTab);
        if (!cards.find((c) => c.id === S.shopSel)) {
            const eq = cards.find((c) => c.equipped) || cards[0];
            S.shopSel = eq ? eq.id : '';
            if (S.shopSel) Shop.preview(S.shopSel);
        }
        const keepScroll = w.gridEl.scrollTop;
        w.gridEl.textContent = '';
        for (const c of cards) w.gridEl.appendChild(this._shopCard(c));
        w.gridEl.scrollTop = keepScroll;
        this._shopDetail();
    },
    /** Карточка предмета в сетке. */
    _shopCard(c) {
        const S = this.S, col = GameShopData.RARITY_COLOR[c.rarity] || '#b8c4d6';
        const el = ghBtn('gh-scard gh-goo r-' + c.rarity + (c.id === S.shopSel ? ' sel' : '') + (c.owned ? ' own' : ''), [
            ghEl('div', 'gh-scard-sw', [ghSwatch(c.tab, c.item.params), (c.rarity === 'epic' || c.rarity === 'legendary') ? ghEl('i', 'gh-shine') : null]),
            ghEl('b', 'gh-t gh-scard-name', c.name),
            ghEl('small', 'gh-scard-price', c.equipped ? [ghIcon('check', 'gh-mini')] : c.kind === 'coins' && !c.owned ? [ghIcon('gem', 'gh-mini'), String(c.price)] : c.kind === 'ads' && !c.owned ? [ghIcon('ad', 'gh-mini'), c.progress + '/' + c.need] : c.owned ? [ghIcon('check', 'gh-mini')] : [ghIcon('lock', 'gh-mini')]),
        ], () => { S.shopSel = c.id; Shop.preview(c.id); this._shopRender(); });
        el.style.setProperty('--rc', col); el.style.setProperty('--rc-rgb', ghRgb(col));
        return el;
    },
    /** Правая панель: крупный образец, название, редкость, цена, основная кнопка. */
    _shopDetail() {
        const S = this.S, w = S.win;
        if (!w || w.name !== 'shop' || !w.detail) return;
        const c = S.shopSel ? Shop.card(S.shopSel) : null;
        w.detail.textContent = '';
        if (!c) { w.detail.appendChild(ghEl('p', 'gh-hint', ghT('hud.shopPick'))); return; }
        const col = GameShopData.RARITY_COLOR[c.rarity] || '#b8c4d6';
        w.detail.style.setProperty('--rc', col); w.detail.style.setProperty('--rc-rgb', ghRgb(col));
        const sw = ghEl('div', 'gh-dsw r-' + c.rarity, [ghSwatch(c.tab, c.item.params), (c.rarity === 'epic' || c.rarity === 'legendary') ? ghEl('i', 'gh-shine') : null]);
        const rar = ghEl('span', 'gh-rar', c.rarityLabel);
        const price = ghEl('div', 'gh-dprice', c.kind === 'coins' && !c.owned ? [ghIcon('gem', 'gh-mini'), ghEl('b', 'gh-t', String(c.price))] : c.kind === 'ads' && !c.owned ? [ghIcon('ad', 'gh-mini'), ghEl('b', 'gh-t', c.priceLabel)] : ghEl('b', 'gh-t', c.priceLabel));
        const btn = ghBtn('gh-btn gh-big ' + (c.action === 'watch' ? 'gh-ad' : 'pri'), [c.action === 'watch' ? ghIcon('ad', 'gh-btn-ico') : null, ghEl('b', 'gh-t', c.actionLabel || c.priceLabel)], async () => {
            if (S.busy) return;
            S.busy = true; btn.disabled = true;
            let res;
            try { res = await Shop.act(c.id); } catch (e) { console.error(e); } finally { S.busy = false; }
            if (res && res.ok === false && res.reason === 'adFailed') this._adFail();
            else if (res && res.ok === false && res.reason === 'adUnavailable') this._adFail();
            this._shopRender();
        });
        btn.disabled = !c.enabled || S.busy || c.busy;
        const hint = (!c.enabled && c.hint) ? ghEl('p', 'gh-hint warn', c.hint) : null;
        ghAdd(w.detail, [sw, ghEl('b', 'gh-t gh-dname', c.name), rar, price, btn, hint, ghEl('small', 'gh-dtry', ghT('hud.shopTry'))]);
    },


    // =============================================================================================
    // Окно «Подарок дня» (7 дней, x2 за рекламу, на 7-м дне — эксклюзивная вещь)
    // =============================================================================================

    /** Картинка награды дня: эксклюзив — образец вещи, иначе кристаллы. @param {any} d день из DailyGift.view().days @param {boolean} [big] */
    _dayArt(d, big) {
        const r = d.reward;
        if (r.exclusive && typeof Shop !== 'undefined') {
            const c = Shop.card(r.exclusive);
            if (c) return ghEl('div', 'gh-day-art sw' + (big ? ' big' : ''), [ghSwatch(c.tab, c.item.params), ghEl('i', 'gh-shine')]);
        }
        const kids = [ghIcon(r.coins ? 'gem' : 'gift', 'gh-day-ico')];
        if (r.randomItems) kids.push(ghIcon('question', 'gh-day-q'));
        return ghEl('div', 'gh-day-art' + (big ? ' big' : ''), kids);
    },
    _win_daily() {
        const S = this.S, w = S.win;
        if (!w || typeof DailyGift === 'undefined') return;
        w.refresh = () => this._win_daily();
        const v = DailyGift.view();
        w.canClaim = v.canClaim;
        w.body.textContent = '';
        const row = ghEl('div', 'gh-days');
        for (const d of v.days) {
            const num = d.reward.coins ? ghEl('b', 'gh-t gh-day-n', fmtNum(d.reward.coins)) : ghEl('b', 'gh-t gh-day-n', d.reward.exclusive ? Shop.name(d.reward.exclusive) : '');
            const card = ghEl('div', 'gh-day gh-goo ' + d.state + (d.exclusive ? ' ex' : ''), [
                ghEl('small', 'gh-day-h', d.dayLabel), this._dayArt(d, false), num,
                d.state === 'claimed' ? ghIcon('check', 'gh-day-st') : d.state === 'locked' ? ghIcon('lock', 'gh-day-st') : ghEl('small', 'gh-day-state', d.stateLabel),
            ]);
            row.appendChild(card);
        }
        const today = v.days.find((d) => d.state === 'today');
        /** @type {HTMLButtonElement[]} */
        const btns = [];
        let main;
        w.timerEl = null;
        if (today) {
            const claim = ghBtn('gh-btn pri gh-big', [ghEl('b', 'gh-t', DailyGift.t('daily.claim'))], () => this._dailyClaim(false, btns));
            btns.push(claim);
            let x2 = null;
            if (v.x2.available) {
                x2 = ghBtn('gh-btn gh-ad gh-big', [ghEl('div', 'gh-adrow big', [ghIcon('ad'), ghEl('b', 'gh-t', 'x2')]), ghEl('span', 'gh-sub')], () => this._dailyClaim(true, btns));
                x2.setAttribute('data-ad', '1'); x2.querySelector('.gh-sub').setAttribute('data-base', ghT('hud.ad'));
                btns.push(x2);
            }
            w.adTick = () => { if (x2) { const vv = DailyGift.view(); if (!vv.x2.enabled) x2.disabled = true; } };
            const note = x2 ? ghEl('span', 'gh-today-x2', 'x2: ' + v.x2.rewardLabel) : (v.x2.hint ? ghEl('span', 'gh-today-x2', v.x2.hint) : null);
            main = ghEl('div', 'gh-today gh-goo', [
                this._dayArt(today, true),
                ghEl('div', 'gh-today-txt', [ghEl('small', 'gh-form-label', today.dayLabel + (today.exclusive ? ' · ' + ghT('hud.dailyGoal') : '')), ghEl('b', 'gh-t gh-today-label', DailyGift.rewardLabel(today.reward)), note]),
                ghEl('div', 'gh-today-btns', btns),
            ]);
        } else {
            w.adTick = null;
            const timer = ghEl('b', 'gh-t gh-today-timer', DailyGift.status().nextLabel);
            w.timerEl = timer;
            main = ghEl('div', 'gh-today gh-goo done', [ghIcon('check', 'gh-today-ok'), ghEl('div', 'gh-today-txt', [ghEl('b', 'gh-t', ghT('hud.dailyDone')), timer])]);
        }
        ghAdd(w.body, [main, row]);
        w.tick = () => {
            if (DailyGift.canClaim() !== w.canClaim) { this._win_daily(); return; }
            if (!w.canClaim && w.timerEl) { const t = DailyGift.status().nextLabel; if (w.timerEl.textContent !== t) w.timerEl.textContent = t; }
        };
        this._adRefresh();
    },
    /** Забрать подарок дня (x2 — после рекламы). Двойное нажатие: кнопки гаснут сразу, повторный claim() всё равно ничего не выдаст. */
    async _dailyClaim(x2, btns) {
        const S = this.S;
        if (btns.some((b) => b.dataset.busy)) return;
        let res;
        if (x2) {
            res = await this._ad(() => DailyGift.claimX2());
            if (!res) return;
        } else {
            for (const b of btns) { b.dataset.busy = '1'; b.disabled = true; }
            res = DailyGift.claim();
        }
        if (res && res.ok) {
            const ex = (res.got || []).find((/** @type {any} */ g) => g.type === 'exclusive');
            this.toast(ghT('hud.dailyGot', { t: ghGotText(res.got) }), 2800, 'good');
            if (ex) this.celebrate({ title: DailyGift.t('daily.exclusive'), sub: Shop.name(ex.id), color: '#ffc23a', icon: 'gift' });
            this._refreshAll();
        } else if (res && (res.reason === 'adFailed' || res.reason === 'adUnavailable' || res.reason === 'cooldown')) this._adFail();
        if (S.win && S.win.name === 'daily') this._win_daily();
    },

    // =============================================================================================
    // Окно «Колесо фортуны»: диск с 8 секторами, результат выбирает Wheel до анимации
    // =============================================================================================

    /** SVG диска: сектор i по центру на i·45° по часовой от стрелки (сверху). @param {any[]} secs Wheel.sectors() */
    _wheelSvg(secs) {
        const n = secs.length, step = 2 * Math.PI / n, R = 96;
        const pt = (/** @type {number} */ a, /** @type {number} */ r) => (r * Math.sin(a)).toFixed(2) + ' ' + (-r * Math.cos(a)).toFixed(2);
        let g = '<defs><radialGradient id="gh-wg" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".75" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></radialGradient></defs>';
        g += '<circle r="99" fill="#0b0b12" stroke="#ffc23a" stroke-width="3"/>';
        secs.forEach((sc, i) => {
            const a0 = (i - 0.5) * step, a1 = (i + 0.5) * step, item = sc.kind === 'item';
            const fill = item ? '#5b22b0' : (i % 2 ? '#241a42' : '#34265e');
            g += '<g class="gh-wedge" data-i="' + i + '"><path class="wp" d="M0 0L' + pt(a0, R) + 'A' + R + ' ' + R + ' 0 0 1 ' + pt(a1, R) + 'Z" fill="' + fill + '" stroke="#05050a" stroke-width="1.6"/>';
            const ico = item ? GH_ICONS.star : GH_ICONS.gem;
            const txt = item ? ghT('hud.wheelItem') : String(sc.coins);
            g += '<g transform="rotate(' + (i * 360 / n) + ')"><image href="' + ico + '" x="-13" y="-84" width="26" height="26"/>' +
                '<text x="0" y="-45" text-anchor="middle" font-size="' + (item ? 12 : 15) + '" style="font-family:var(--game-font,sans-serif)" fill="#fff" stroke="#05050a" stroke-width="3.2" paint-order="stroke">' + txt.replace(/[<&]/g, '') + '</text></g></g>';
        });
        g += '<circle r="99" fill="url(#gh-wg)"/><circle r="96" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="1.5"/>';
        for (let i = 0; i < n; i++) g += '<circle cx="' + (97.5 * Math.sin((i + 0.5) * step)).toFixed(1) + '" cy="' + (-97.5 * Math.cos((i + 0.5) * step)).toFixed(1) + '" r="2.6" fill="#fff3a0"/>';
        g += '<circle r="17" fill="#0b0b12" stroke="#ffc23a" stroke-width="3"/><circle r="9" fill="rgb(var(--evo-rgb))"/><circle cx="-3" cy="-3" r="2.5" fill="#fff"/>';
        return '<svg class="gh-wheel-svg" viewBox="-102 -102 204 204" aria-hidden="true">' + g + '</svg>';
    },
    _win_wheel() {
        const S = this.S, w = S.win;
        if (!w || typeof Wheel === 'undefined') return;
        // вращение, чей приз ещё не выдан (закрыли окно, не дождавшись) — выдаём сразу
        if (Wheel.pendingSpin()) { const fr = Wheel.finish({ recovered: true }); if (fr.ok) this.toast(ghT('hud.wheelWin', { t: ghGotText(fr.got) }), 2800, 'good'); }
        w.rot = 0; w.spinning = false;
        w.refresh = () => this._wheelSync();
        const secs = Wheel.sectors();
        const disc = ghEl('div', 'gh-wheel-disc');
        disc.innerHTML = this._wheelSvg(secs);
        w.disc = disc;
        const wheel = ghEl('div', 'gh-wheel', [disc, ghEl('i', 'gh-wheel-ptr')]);
        const free = ghBtn('gh-btn pri gh-big', [ghEl('b', 'gh-t')], () => this._wheelSpin('free'));
        const ad = ghBtn('gh-btn gh-ad gh-big', [ghEl('div', 'gh-adrow big', [ghIcon('ad'), ghEl('b', 'gh-t', ghT('hud.wheelAgain'))]), ghEl('span', 'gh-sub')], () => this._wheelSpin('ad'));
        ad.setAttribute('data-ad', '1');
        w.freeBtn = free; w.adBtn = ad; w.hintEl = ghEl('p', 'gh-hint gh-wheel-hint', ' ');
        const side = ghEl('div', 'gh-wheel-side', [ghEl('div', 'gh-ovl-btns', [free, ad]), w.hintEl]);
        w.body.textContent = '';
        ghAdd(w.body, ghEl('div', 'gh-wheel-row', [wheel, side]));
        w.tick = () => this._wheelSync();
        w.adTick = () => { const st = Wheel.status(); if (w.spinning || !st.canSpinAd) ad.disabled = true; };
        this._wheelSync();
    },
    /** Подписи и доступность кнопок колеса (по Wheel.status()). */
    _wheelSync() {
        const S = this.S, w = S.win;
        if (!w || w.name !== 'wheel' || !w.freeBtn) return;
        const st = Wheel.status();
        const lab = w.freeBtn.querySelector('b');
        if (lab.textContent !== st.freeLabel) lab.textContent = st.freeLabel;
        w.freeBtn.disabled = w.spinning || !st.canSpinFree;
        const base = ghT('hud.wheelAdLeft', { a: st.adLeft + st.banked, b: st.adLimit });
        const sub = w.adBtn.querySelector('.gh-sub');
        if (sub.getAttribute('data-base') !== base) { sub.setAttribute('data-base', base); sub.textContent = base; }
        const hint = w.spinning ? Wheel.t('wheel.spinning') : st.hint;
        if (w.hintEl.textContent !== (hint || ' ')) w.hintEl.textContent = hint || ' ';
        this._adRefresh();
    },
    async _wheelSpin(kind) {
        const S = this.S, w = S.win;
        if (!w || w.name !== 'wheel' || w.spinning) return;
        w.spinning = true;
        this._wheelSync();
        let r;
        if (kind === 'free') r = Wheel.spinFree();
        else { r = await this._ad(() => Wheel.spinAd()); if (!r) r = { ok: false, reason: 'busy' }; }
        if (!r.ok) {
            w.spinning = false;
            if (r.reason === 'adFailed' || r.reason === 'adUnavailable' || r.reason === 'cooldown') this._adFail();
            if (S.win === w) this._wheelSync();
            return;
        }
        if (S.win !== w) { setTimeout(() => this._wheelFinish(w), r.durationMs + 100); return; }   // окно закрыли во время рекламы
        w.rot = Wheel.angleFrom(w.rot || 0, r);
        const disc = w.disc;
        disc.querySelectorAll('.win').forEach((/** @type {Element} */ e) => e.classList.remove('win'));
        disc.style.transition = 'transform ' + r.durationMs + 'ms cubic-bezier(.12,.72,.14,1)';
        disc.style.transform = 'rotate(' + w.rot + 'deg)';
        setTimeout(() => this._wheelFinish(w), r.durationMs + 150);   // не зависит от окна: приз выдаётся в любом случае, ровно один раз
    },
    _wheelFinish(w) {
        const S = this.S;
        const fr = Wheel.finish();
        if (!fr.ok) return;
        const t = ghGotText(fr.got), conv = (fr.got || []).some((/** @type {any} */ g) => g.converted);
        this.toast(ghT(conv ? 'hud.wheelDup' : 'hud.wheelWin', { t }), 3000, 'good');
        if ((fr.got || []).some((/** @type {any} */ g) => g.type === 'item')) this.celebrate({ title: ghT('hud.wheelTitle'), sub: t, color: '#ffc23a', icon: 'gift' });
        if (S.win === w) {
            w.spinning = false;
            const el = w.disc.querySelector('.gh-wedge[data-i="' + fr.sector + '"]');
            if (el) el.classList.add('win');
            this._wheelSync();
        }
    },

    // =============================================================================================
    // Окно «Рекорды» (лидерборд площадки): Platform.leaderboard() — по требованию, при открытии
    // =============================================================================================

    _win_leaders() {
        const S = this.S, w = S.win;
        if (!w) return;
        w.refresh = null;
        const list = ghEl('div', 'gh-lb'), foot = ghEl('div', 'gh-lb-foot');
        w.body.textContent = '';
        ghAdd(w.body, [list, foot]);
        const showLogin = () => {
            foot.textContent = '';
            let can = false;
            try { can = Platform.canLogin() && !Platform.authorized(); } catch (e) { can = false; }
            if (!can) return;
            const b = ghBtn('gh-btn pri gh-big', [ghEl('b', 'gh-t', ghT('hud.lbLogin'))], async () => {
                if (b.disabled) return;
                b.disabled = true;
                try { await Platform.login(); } catch (e) { console.error(e); }
                if (S.win === w) { showLogin(); load(); }
            });
            foot.appendChild(b);
        };
        const load = async () => {
            list.textContent = '';
            list.appendChild(ghEl('p', 'gh-lb-empty gh-t', ghT('hud.lbLoading')));
            let rows = null;
            try { rows = await Platform.leaderboard({ avatarSize: 96 }); } catch (e) { rows = null; }
            if (S.win !== w) return;
            list.textContent = '';
            if (!rows || !rows.length) { list.appendChild(ghEl('p', 'gh-lb-empty gh-t', ghT('hud.lbEmpty'))); showLogin(); return; }
            rows.slice(0, 50).forEach((/** @type {any} */ e, /** @type {number} */ i) => {
                const rank = e.rank || i + 1, score = Math.max(0, Math.floor(Number(e.score) || 0));
                const av = ghEl('div', 'gh-lb-av');
                const fallback = () => { av.textContent = ''; av.appendChild(ghBlob(GD.EVOLUTIONS[rank % GD.EVOLUTIONS.length].glow, rank)); };
                if (e.avatar) {
                    const im = /** @type {HTMLImageElement} */ (document.createElement('img'));
                    im.alt = ''; im.draggable = false; im.referrerPolicy = 'no-referrer'; im.onerror = fallback; im.src = String(e.avatar);
                    av.appendChild(im);
                } else fallback();
                list.appendChild(ghEl('div', 'gh-lbrow gh-goo' + (e.me ? ' me' : '') + (rank <= 3 ? ' top' + rank : ''), [
                    ghEl('b', 'gh-t gh-lb-rank', String(rank)), av,
                    ghEl('div', 'gh-lb-name', [ghEl('b', 'gh-t', e.name || ghT('hud.lbPlayer')), e.me ? ghEl('small', 'gh-lb-me', ghT('hud.lbYou')) : null]),
                    ghEl('div', 'gh-lb-score', [ghIcon('trophy', 'gh-mini'), ghEl('b', 'gh-t', fmtNum(score)), ghEl('small', '', ghPlural(score, 'win'))]),
                ]));
            });
            showLogin();
        };
        load();
    },

    // =============================================================================================
    // Победа, смерть, золотая площадка, предложение
    // =============================================================================================

    showWin(o) {
        const S = this.S;
        o = o || {};
        if (S.gate) S.gate.hidden = true;
        if (S.boss) S.boss.hidden = true;
        this._overlay('gh-win-ok', 'win', ghT('hud.winTitle'), (body) => {
            const rows = ghEl('div', 'gh-rewards');
            if (o.wins) rows.appendChild(ghEl('div', 'gh-rw gh-goo', [ghIcon('trophy', 'gh-rw-ico'), ghEl('b', 'gh-t', ghT('hud.winWins', { n: fmtNum(o.wins), pl: ghPlural(o.wins, 'win') })), o.gold ? ghEl('i', 'gh-x3', 'x3') : null]));
            if (o.gems) rows.appendChild(ghEl('div', 'gh-rw gh-goo', [ghIcon('gem', 'gh-rw-ico'), ghEl('b', 'gh-t', ghT('hud.winGems', { n: fmtNum(o.gems), pl: ghPlural(o.gems, 'gem') }))]));
            const go = ghBtn('gh-btn pri gh-big', [ghIcon('home', 'gh-btn-ico'), ghEl('b', 'gh-t', ghT('hud.toLobby'))], () => this._once(go, () => { this._clearOverlay(); if (S.h.onLobby) S.h.onLobby(); }));
            ghAdd(body, [o.stage ? ghEl('p', 'gh-sub-line', ghT('hud.winStage', { n: o.stage })) : null, rows, go]);
        });
    },

    showDead(o) {
        const S = this.S;
        o = o || {};
        if (S.gate) S.gate.hidden = true;
        this._overlay('gh-dead', 'skull', ghT('hud.deadTitle'), (body) => {
            const lobby = ghBtn('gh-btn gh-big', [ghIcon('home', 'gh-btn-ico'), ghEl('b', 'gh-t', ghT('hud.toLobby'))], () => this._once(lobby, () => { this._clearOverlay(); if (S.h.onLobby) S.h.onLobby(); }));
            const btns = ghEl('div', 'gh-ovl-btns');
            if (o.canRevive) {
                const rv = ghBtn('gh-btn gh-ad gh-big', [ghEl('div', 'gh-adrow big', [ghIcon('ad'), ghEl('b', 'gh-t', ghT('hud.revive'))]), ghEl('span', 'gh-sub')], async () => {
                    const ok = await this._ad(() => GS.rewarded('revive'));
                    if (ok) { this._clearOverlay(); if (S.h.onRevive) S.h.onRevive(); } else this._adFail();
                });
                rv.setAttribute('data-ad', '1'); rv.querySelector('.gh-sub').setAttribute('data-base', ghT('hud.ad'));
                btns.appendChild(rv);
            }
            btns.appendChild(lobby);
            ghAdd(body, [ghEl('p', 'gh-sub-line', ghT('hud.deadSub')), btns]);
        });
    },

    askGold(cb) {
        const S = this.S;
        this._overlay('gh-gold', 'trophy', ghT('hud.goldTitle'), (body) => {
            const yes = ghBtn('gh-btn gh-ad gh-big', [ghEl('div', 'gh-adrow big', [ghIcon('ad'), ghEl('b', 'gh-t', ghT('hud.watch'))]), ghEl('span', 'gh-sub')], async () => {
                const ok = await this._ad(() => GS.rewarded('win-x3'));
                this._clearOverlay();
                if (!ok) this._adFail();
                if (cb) cb(!!ok);
            });
            yes.setAttribute('data-ad', '1'); yes.querySelector('.gh-sub').setAttribute('data-base', ghT('hud.ad'));
            const no = ghBtn('gh-btn gh-big', [ghEl('b', 'gh-t', ghT('hud.no'))], () => this._once(no, () => { this._clearOverlay(); if (cb) cb(false); }));
            ghAdd(body, [ghIcon('trophy', 'gh-gold-ico'), ghEl('p', 'gh-sub-line big', ghT('hud.goldText')), ghEl('div', 'gh-ovl-btns', [yes, no])]);
        });
    },

    /** Предложение в лобби: o = { title, text, icon, reward, cb } — cb(true) после просмотра, cb(false) при закрытии. */
    offer(o) {
        const S = this.S;
        if (!S.root || S.mode !== 'lobby' || S.win || S.ov) return;
        o = o || {};
        const done = (ok) => { this._clearOverlay(); if (o.cb) o.cb(ok); };
        this._overlay('gh-offer-win', o.icon || 'pack', o.title || ghT('hud.offerDefault'), (body) => {
            const ab = ghBtn('gh-btn gh-ad gh-big', [ghEl('div', 'gh-adrow big', [ghIcon('ad'), ghEl('b', 'gh-t', ghT('hud.ad'))]), ghEl('span', 'gh-sub')], async () => {
                const ok = await this._ad(() => GS.rewarded('offer'));
                if (ok) done(true); else this._adFail();
            });
            ab.setAttribute('data-ad', '1'); ab.querySelector('.gh-sub').setAttribute('data-base', ghT('hud.ad'));
            ghAdd(body, [
                ghIcon(o.icon || 'pack', 'gh-offer-big'),
                o.text ? ghEl('p', 'gh-sub-line big', o.text) : null,
                o.reward ? ghEl('div', 'gh-rw gh-goo', [ghEl('b', 'gh-t', typeof o.reward === 'string' ? o.reward : ghRewardText(o.reward))]) : null,
                ghEl('div', 'gh-ovl-btns', [ab]),
            ]);
        }, () => done(false));
    },

    /** Защита от двойного нажатия: кнопка срабатывает один раз. */
    _once(btn, fn) {
        if (btn.disabled) return;
        btn.disabled = true;
        fn();
    },
};


// ================================================================================================================
// Стили. Образ «живая чёрная слизь»: глянцевый чёрный студень с одним резким бликом, толстый обод, подтёки-метаболлы
// (SVG-фильтр #gh-goo склеивает полосу и капли), жидкость в трубках-шкалах, упругие кнопки-капли, неон --evo.
// Анимируются только transform / scale / opacity; фильтр gooey — на нескольких маленьких элементах.
// ================================================================================================================
/** Круглые пузыри для «жидкости»: плитка 100% x 50% по высоте, повторяется — сдвиг на 50% даёт бесшовный подъём. */
const ghBubLayers = (/** @type {string} */ c, /** @type {number} */ a, /** @type {number} */ s) => [[14, 78, .5], [38, 40, .28], [63, 88, .38], [82, 30, .55], [52, 62, .2], [92, 70, .3]]
    .map(([x, y, r]) => 'radial-gradient(circle at ' + x + '% ' + y + '%,transparent ' + (r * s * .55).toFixed(2) + 'em,rgba(' + c + ',' + a + ') ' + (r * s * .66).toFixed(2) + 'em,rgba(' + c + ',' + a + ') ' + (r * s * .9).toFixed(2) + 'em,transparent ' + (r * s).toFixed(2) + 'em)').join(',');
/** Волна на поверхности жидкости: цвет внутренности трубки #030307 над линией волны. */
const GH_WAVE = 'url("data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 8" preserveAspectRatio="none"><path d="M0 0H40V4Q30 9 20 4T0 4Z" fill="#030307"/></svg>') + '")';
/** Трещинки высохшей слизи (кнопка недоступна / этап закрыт). */
const GH_CRACK = 'url("data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60" preserveAspectRatio="none"><g fill="none" stroke="#000" stroke-opacity=".28" stroke-width="1.2" stroke-linecap="round"><path d="M8 4L16 18L11 30L24 38"/><path d="M16 18L30 16"/><path d="M96 56L88 42L99 32L92 20"/><path d="M88 42L74 46"/><path d="M52 2L56 12L50 20"/></g></svg>') + '")';

const GH_CSS = `
.gh-root{--evo:#4de8ff;--evo-rgb:77,232,255;--ink:#05050a;--lime:#c8ff1e;--gold:#ffc23a;--goo:#0b0b12;
  position:fixed;inset:0;z-index:30;pointer-events:none;overflow:hidden;box-sizing:border-box;
  font-family:var(--game-font,'GH Bubbles',system-ui,sans-serif);font-weight:400;font-synthesis:none;color:#f6f3ff;line-height:1.15;
  font-size:calc(16px * var(--k,1));-webkit-tap-highlight-color:transparent;-webkit-font-smoothing:antialiased}
.gh-root *,.gh-root *::before,.gh-root *::after{box-sizing:border-box}
.gh-root.gh-m-hidden{display:none}
.gh-root [hidden]{display:none !important}
.gh-m-lobby [data-m="arena"],.gh-m-arena [data-m="lobby"]{display:none !important}
.gh-defs{position:absolute;width:0;height:0;overflow:hidden}
.gh-ico{width:1.8em;height:1.8em;object-fit:contain;flex:none;pointer-events:none;-webkit-user-drag:none;filter:drop-shadow(0 .08em 0 rgba(0,0,0,.6))}
.gh-grow{flex:1}
.gh-hide{display:none !important}
.gh-t{color:#fff;-webkit-text-stroke:.15em var(--ink);paint-order:stroke fill;text-shadow:0 .09em 0 rgba(0,0,0,.5);letter-spacing:.02em}
.gh-t.bump,.bump{animation:gh-bump .4s cubic-bezier(.3,1.8,.5,1)}
@keyframes gh-bump{0%{transform:scale(1)}35%{transform:scale(1.35,.8)}65%{transform:scale(.9,1.15)}100%{transform:scale(1)}}
@keyframes gh-jig{0%,100%{scale:1 1}50%{scale:1.03 .965}}

/* --- чёрная слизь: тёмная глубина, светлый мокрый обод, ОДИН резкий блик, неоновое свечение --- */
.gh-goo{position:relative;border:.2em solid transparent;border-radius:1.2em 1.8em 1.3em 1.9em/1.6em 1.2em 1.8em 1.3em;
  background:radial-gradient(120% 90% at 50% 135%,rgba(var(--evo-rgb),.2),transparent 62%) padding-box,linear-gradient(180deg,#221b38 0,#140f22 40%,#09080f 100%) padding-box,
   linear-gradient(150deg,#6e6492 0,#2a2442 22%,#0e0b17 48%,rgba(var(--evo-rgb),.75) 100%) border-box;
  box-shadow:inset 0 .14em .06em rgba(255,255,255,.12),inset 0 -.7em 1.1em rgba(0,0,0,.7),0 .28em 0 rgba(0,0,0,.65),0 0 1.1em rgba(var(--evo-rgb),.24)}
.gh-goo::before,.gh-btn::before,.gh-bar::before{content:'';position:absolute;left:12%;top:.2em;width:32%;max-width:6em;height:.2em;border-radius:1em;pointer-events:none;
  background:linear-gradient(90deg,#fff 30%,rgba(255,255,255,.15));opacity:.85;rotate:-2.5deg;z-index:2}

/* --- подтёки: полоса-обод + капли, фильтр gooey склеивает их в тянущиеся нити (метаболлы) --- */
.gh-drips{position:absolute;left:6%;right:6%;top:calc(100% - .45em);height:2.6em;pointer-events:none;z-index:0;
  filter:url(#gh-goo) drop-shadow(0 0 .1em rgba(var(--evo-rgb),.9))}
.gh-drips b{position:absolute;left:0;right:0;top:0;height:.7em;border-radius:0 0 1em 1em;background:#05050a}
.gh-drips i{position:absolute;top:.25em;left:var(--x);width:var(--w);height:var(--w);margin-left:calc(var(--w) / -2);border-radius:50%;background:#05050a;
  animation:gh-hang var(--t) ease-in-out var(--d) infinite}
.gh-drips i:nth-child(3n+2){animation-name:gh-drop;animation-timing-function:cubic-bezier(.45,0,.85,.5);animation-duration:calc(var(--t) * 1.4)}
@keyframes gh-drop{0%{transform:translateY(0) scale(1)}50%{transform:translateY(calc(var(--l) * .4)) scale(.9,1.15)}72%{transform:translateY(calc(var(--l) * .75)) scale(.78,1.35);opacity:1}86%{transform:translateY(calc(var(--l) * 1.7)) scale(.7,1.1);opacity:0}100%{transform:translateY(0) scale(1);opacity:0}}
@keyframes gh-hang{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(calc(var(--l) * .45)) scale(.88,1.2)}}
.gh-win>.gh-drips{top:.2em;left:7%;right:7%;z-index:0;height:2.8em}

/* --- кнопки: комки слизи с каплей снизу, давятся и пружинят --- */
.gh-btn{--b1:#2d2650;--b2:#0f0c1a;--bt:#fff;--rim:rgba(var(--evo-rgb),.85);--dx:24%;--dd:0s;
  position:relative;font:inherit;color:var(--bt);cursor:pointer;margin:0;padding:.5em .9em;min-height:46px;border:.17em solid transparent;
  display:inline-flex;align-items:center;justify-content:center;gap:.45em;pointer-events:auto;touch-action:manipulation;text-align:center;
  border-radius:1.25em 1.75em 1.3em 1.6em/1.55em 1.15em 1.65em 1.25em;
  background:radial-gradient(90% 60% at 50% 128%,rgba(255,255,255,.2),transparent 70%) padding-box,linear-gradient(180deg,var(--b1),var(--b2)) padding-box,
   linear-gradient(150deg,rgba(255,255,255,.65),rgba(255,255,255,.06) 40%,var(--rim) 100%) border-box;
  box-shadow:inset 0 -.4em .5em rgba(0,0,0,.42),0 .26em 0 #000,0 0 .8em rgba(var(--evo-rgb),.3);
  transition:transform .4s cubic-bezier(.3,2.4,.5,1),filter .15s;outline:none;animation:gh-jig var(--jd,6s) ease-in-out var(--jl,0s) infinite}
.gh-btn::after{content:'';position:absolute;left:var(--dx);top:calc(100% - .3em);width:.6em;height:.85em;pointer-events:none;
  border-radius:48% 48% 50% 50%/22% 22% 78% 78%;background:linear-gradient(90deg,var(--b2),var(--b1) 40%,var(--b2));transform-origin:50% 0;
  box-shadow:0 .06em 0 rgba(0,0,0,.6);animation:gh-bdrip 4.6s ease-in-out var(--dd) infinite}
@keyframes gh-bdrip{0%,100%{transform:scaleY(.55)}55%{transform:scaleY(1.2)}}
@media (hover:hover){.gh-btn:hover:not(:disabled){transform:scale(1.04,.98)}}
.gh-btn:active:not(:disabled){transform:scale(1.1,.8) translateY(.08em);transition-duration:.07s}
.gh-btn:focus-visible{box-shadow:0 0 0 .2em #fff,0 .26em 0 #000}
.gh-btn.pri,.gh-btn.ok{--b1:#e9ff82;--b2:#86c800;--bt:#10200a;--rim:rgba(255,255,255,.35);box-shadow:inset 0 -.4em .5em rgba(40,80,0,.5),0 .26em 0 #000,0 0 1em rgba(200,255,30,.55)}
.gh-btn.gh-ad{--b1:#ffe483;--b2:#e48a12;--bt:#2b1500;--rim:rgba(255,255,255,.4);box-shadow:inset 0 -.4em .5em rgba(120,50,0,.45),0 .26em 0 #000,0 0 .9em rgba(255,194,58,.45)}
.gh-btn.pri .gh-t,.gh-btn.ok .gh-t,.gh-btn.gh-ad .gh-t,.gh-btn.pri .gh-sub,.gh-btn.ok .gh-sub,.gh-btn.gh-ad .gh-sub{color:var(--bt);-webkit-text-stroke:0;text-shadow:0 .07em 0 rgba(255,255,255,.45)}
/* высохшая слизь: серая, матовая, без капли и без свечения */
.gh-btn:disabled{--b1:#55525e;--b2:#2e2c35;--rim:rgba(255,255,255,.18);cursor:default;transform:none;animation:none;color:#b5b2c2;
  background:${GH_CRACK} center/100% 100% no-repeat padding-box,linear-gradient(180deg,var(--b1),var(--b2)) padding-box,linear-gradient(150deg,rgba(255,255,255,.3),rgba(255,255,255,.04) 45%,rgba(255,255,255,.12)) border-box;
  box-shadow:inset 0 -.3em .4em rgba(0,0,0,.35),0 .2em 0 #000}
.gh-btn:disabled::after{display:none}
.gh-btn:disabled .gh-t,.gh-btn:disabled .gh-sub{color:#c6c3d2 !important;-webkit-text-stroke:.1em #17161c !important;text-shadow:none !important}
.gh-btn:disabled .gh-ico{filter:grayscale(1) brightness(.8)}
.gh-big{min-height:max(3em,44px);font-size:1.1em;padding:.5em 1.2em}
.gh-btn-ico{width:1.6em;height:1.6em}
.gh-round::after,.gh-tab::after,.gh-segb::after,.gh-switch::after,.gh-scard::after,.gh-close::after{display:none}
.gh-round{width:max(2.9em,46px);height:max(2.9em,46px);padding:0;border-radius:49% 51% 45% 55%/58% 44% 56% 42%}
.gh-round .gh-ico{width:1.9em;height:1.9em}
.gh-adrow{display:flex;align-items:center;justify-content:center;gap:.3em;min-width:0}
.gh-adrow .gh-ico{width:1.25em;height:1.25em}
.gh-adrow.big{font-size:1.05em}
.gh-sub{font-size:max(11px,.72em);color:#fff;-webkit-text-stroke:.12em rgba(30,10,0,.85);paint-order:stroke fill;white-space:nowrap}
.gh-ad .gh-sub{display:block}
.gh-btn > .gh-sub{margin-top:-.1em}
.gh-btn.gh-ad.gh-big{flex-direction:column;gap:0}

/* --- каркас HUD --- */
.gh-frame{position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;pointer-events:none;
  padding:max(.5em,env(safe-area-inset-top)) max(.6em,env(safe-area-inset-right)) max(.5em,env(safe-area-inset-bottom)) max(.6em,env(safe-area-inset-left))}
.gh-top{display:grid;grid-template-columns:auto minmax(0,1fr) auto;grid-template-areas:"cur center sys";gap:.6em;align-items:start}
.gh-narrow .gh-top{grid-template-areas:"cur . sys" "center center center"}
.gh-m-arena .gh-narrow .gh-top,.gh-narrow.gh-m-arena .gh-top{grid-template-areas:". . sys" "center center center"}
.gh-cur{grid-area:cur;display:flex;align-items:center;gap:0;position:relative}
.gh-center{grid-area:center;display:flex;flex-direction:column;align-items:center;gap:.5em;min-width:0}
.gh-sys{grid-area:sys;display:flex;gap:.5em}
.gh-chips{display:flex;flex-direction:column;gap:.3em;margin-left:-.9em;padding-top:.2em}
.gh-chip{display:flex;align-items:center;gap:.35em;min-width:6.6em;padding:.1em .9em .1em .3em;border-radius:1.4em 1.9em 1.4em 1.8em/1.3em 1em 1.4em 1.1em;font-size:1.05em;--jd:7s}
.gh-chip:nth-child(2){margin-left:.6em;--jd:5.4s;--jl:-2s;border-radius:1.8em 1.3em 1.9em 1.3em/1.2em 1.3em 1em 1.4em}
.gh-chip .gh-ico{width:1.7em;height:1.7em}
.gh-chip b{font-size:1.2em}
.gh-lvl{position:relative;z-index:2;width:3.9em;height:3.9em;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:47% 53% 44% 56%/58% 44% 56% 42%;border-width:.24em;--jd:4.8s;
  box-shadow:inset 0 .14em .06em rgba(255,255,255,.16),inset 0 -.7em 1em rgba(0,0,0,.7),0 .28em 0 rgba(0,0,0,.65),0 0 1.4em rgba(var(--evo-rgb),.5)}
.gh-lvl small{font-size:max(9px,.55em);color:rgb(var(--evo-rgb));letter-spacing:.04em;text-transform:uppercase;margin-bottom:-.15em;text-shadow:0 0 .5em rgba(var(--evo-rgb),.8)}
.gh-lvl b{font-family:var(--game-title-font,var(--game-font,sans-serif));font-size:1.55em;line-height:1}
.gh-goal{width:min(100%,34em);padding:.55em 1.1em;text-align:center;font-size:.98em;border-radius:1.4em 1.9em 1.5em 1.8em/1.5em 1.2em 1.7em 1.3em;margin-bottom:1.5em;--jd:8s}
.gh-goal-n{margin-left:.35em;color:rgb(var(--evo-rgb));text-shadow:0 0 .5em rgba(var(--evo-rgb),.7)}
.gh-narrow .gh-goal{font-size:.92em}
.gh-low .gh-goal{padding:.35em .8em;margin-bottom:1em}
.gh-wave{padding:.4em 1.1em .75em;font-size:1.05em;text-align:center;overflow:hidden;border-radius:1.3em 1.7em 1.3em 1.6em/1.3em 1.1em 1.5em 1.2em}
.gh-wave-bar{position:absolute;left:.4em;bottom:.2em;height:.32em;max-width:calc(100% - .8em);border-radius:1em;background:linear-gradient(90deg,rgba(var(--evo-rgb),.6),rgb(var(--evo-rgb)));box-shadow:0 0 .6em rgba(var(--evo-rgb),.9);transition:width .3s}
.gh-boss{width:min(100%,32em);display:flex;align-items:center;gap:.6em;padding:.4em .9em .4em .45em;--jd:7s}
.gh-boss-ico{width:2.6em;height:2.6em}
.gh-boss-main{flex:1;min-width:0}
.gh-boss-name{display:block;font-size:1.05em;margin-bottom:.2em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gh-gate{padding:.4em 1.3em;font-size:1.1em;--evo-rgb:255,122,58;animation:gh-gate 1.4s ease-in-out infinite}
.gh-gate.clear{--evo-rgb:150,255,90;animation-duration:.8s}
@keyframes gh-gate{0%,100%{transform:scale(1)}50%{transform:scale(1.08,.95)}}
.gh-mid{flex:1;min-height:0;display:flex;justify-content:space-between;align-items:flex-start;padding-top:.3em}
.gh-menu{--mb:4.7em;position:relative;display:grid;grid-template-columns:var(--mb) var(--mb);gap:.5em;align-content:start}
.gh-port .gh-menu{--mb:4.2em}
.gh-low .gh-menu{--mb:4.2em}
/* слизистая подложка меню: фильтр gooey склеивает чередующиеся комки в одну тянущуюся колонну */
.gh-gb{position:absolute;inset:-.25em -.3em;display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:calc(var(--mb) + .5em);justify-items:center;pointer-events:none;filter:url(#gh-goo) drop-shadow(0 0 .12em rgba(var(--evo-rgb),.75))}
.gh-gb i{display:block;width:100%;height:100%;border-radius:1.6em;background:#05050a}
.gh-gb i:nth-child(4n+2),.gh-gb i:nth-child(4n+3){width:80%;height:84%;align-self:center}
.gh-offers{display:flex;flex-direction:column;gap:.55em;align-items:flex-end;margin-left:auto}
.gh-mbtn{position:relative;z-index:1;width:var(--mb);height:var(--mb);flex-direction:column;gap:0;padding:.3em .2em .2em;justify-content:center;min-height:0}
.gh-menu .gh-mbtn::after{display:none}
.gh-mbtn:nth-of-type(odd){border-radius:1.5em 1.9em 1.4em 1.8em/1.8em 1.3em 1.9em 1.4em}
.gh-mbtn-ico{width:2.6em;height:2.6em}
.gh-mbtn-cap{-webkit-text-stroke-width:.1em;font-size:max(11px,.68em);margin-top:-.05em;max-width:100%;white-space:normal;line-height:.95;text-align:center}
.gh-port .gh-mbtn-ico{width:2.1em;height:2.1em}
.gh-low .gh-mbtn-ico{width:2.2em;height:2.2em}
.gh-mbtn.ready{--rim:#c8ff1e;animation:gh-ready .9s ease-in-out infinite}
.gh-mbtn.ready .gh-mbtn-cap{color:var(--lime)}
@keyframes gh-ready{0%,100%{transform:scale(1)}50%{transform:scale(1.1,.94)}}
.gh-badge{position:absolute;top:-.5em;right:-.45em;min-width:1.6em;height:1.6em;padding:0 .3em;display:flex;align-items:center;justify-content:center;border-radius:52% 48% 50% 50%;background:radial-gradient(circle at 35% 28%,#fff 0 8%,transparent 12%),radial-gradient(circle at 40% 40%,#ff7a86,#e0192e 75%);border:.12em solid #1a0006;font-style:normal;font-size:.85em;color:#fff;box-shadow:0 .1em 0 #000,0 0 .6em rgba(255,40,70,.7);animation:gh-badge 1s ease-in-out infinite}
@keyframes gh-badge{0%,100%{transform:scale(1)}50%{transform:scale(1.2,.9)}}
.gh-offer{flex-direction:column;align-items:stretch;gap:.1em;width:8.6em;padding:.4em .55em .4em}
.gh-offer:nth-child(2){--dx:60%;margin-right:.3em}
.gh-offer-top{display:flex;align-items:center;gap:.35em;min-width:0}
.gh-offer-ico{width:2em;height:2em}
.gh-offer-txt{display:flex;flex-direction:column;align-items:flex-start;min-width:0;text-align:left}
.gh-offer-name{font-size:.82em;line-height:1.05;white-space:normal}
.gh-offer-timer{font-style:normal;font-size:max(11px,.8em);color:#2b1500}
.gh-offer.active{box-shadow:inset 0 -.4em .5em rgba(120,50,0,.45),0 .26em 0 #000,0 0 1.3em rgba(255,226,120,.95)}
.gh-low .gh-offer{width:7.8em}
.gh-bottom{display:flex;flex-direction:column;align-items:center;gap:.4em}
.gh-lobbybar{display:flex;flex-direction:column;align-items:center;gap:.7em;width:min(100%,34em)}
/* ===== ТЕЛЕФОН (сенсор): всё мелкое и у верхнего края, низ — джойстику и прыжку ===== */
.gh-touch .gh-center .gh-lobbybar{width:min(100%,19em);gap:0;margin:0}
.gh-touch .gh-center .gh-lvlbar{padding:.1em .25em .08em;font-size:.7em;border-width:.12em}
.gh-touch .gh-center .gh-bar-lvl{height:1.45em}
.gh-touch .gh-center .gh-total,.gh-touch .gh-center .gh-packs{display:none}
.gh-touch .gh-goal{font-size:.62em;padding:.18em .7em;margin:.35em 0 0;width:auto;max-width:min(100%,32em);transition:opacity .45s,transform .45s}
.gh-touch .gh-goal .gh-drips{display:none}
.gh-touch .gh-goal.gh-goal-hide{opacity:0;transform:translateY(-.5em) scale(.92);pointer-events:none}
.gh-touch .gh-center{font-size:.9em}
.gh-touch .gh-wave{font-size:.78em;padding:.25em .9em .5em}
.gh-touch .gh-gate{font-size:.8em;padding:.25em 1em}
.gh-touch .gh-boss{font-size:.8em}
.gh-touch .gh-lvl{width:3.3em;height:3.3em}
.gh-touch .gh-chip{font-size:.9em;min-width:5.6em}
.gh-touch .gh-round{font-size:.85em}
.gh-touch .gh-bottom{margin-top:auto;padding-bottom:.4em}
.gh-touch .gh-hp{width:min(100%,19em);max-width:calc(100% - 15em);font-size:.78em}
.gh-touch .gh-mid{position:absolute;left:0;right:0;top:4.2em;padding-top:0}
.gh-touch .gh-menu{--mb:3.35em;grid-template-columns:repeat(4,var(--mb));gap:.32em;margin-left:.3em}
.gh-touch .gh-gb{grid-template-columns:repeat(4,1fr);grid-auto-rows:calc(var(--mb) + .32em)}
.gh-touch .gh-mbtn-ico{width:1.6em;height:1.6em}
.gh-touch .gh-mbtn-cap{font-size:max(8px,.5em);letter-spacing:-.02em}
.gh-touch .gh-offer{width:auto;min-width:6.4em;max-width:12em;padding:.25em .4em;font-size:.72em;margin-right:.35em}
.gh-touch .gh-offer:nth-child(2){margin-right:.35em}
.gh-touch .gh-offer .gh-adrow{white-space:nowrap}
.gh-touch.gh-port .gh-mid{top:9.2em}
.gh-mbtn.gh-touch-only{display:none}
.gh-touch .gh-mbtn.gh-touch-only{display:inline-flex}
.gh-packs-win{display:flex;flex-direction:column;gap:.7em;align-items:stretch}
.gh-packs-win .gh-pack{font-size:1.15em;padding:.6em .8em}
.gh-packs-hint{text-align:center;opacity:.85;margin:0 0 .3em}
.gh-touch.gh-land .gh-lobbybar{max-width:calc(100% - 16em)}
.gh-lvlbar{width:100%;padding:.45em .7em .35em;text-align:center;border-radius:1.5em 2em 1.5em 1.9em/1.6em 1.3em 1.8em 1.4em}
.gh-total{display:block;font-size:max(11px,.7em);color:rgba(255,255,255,.75);margin-top:.3em;text-shadow:0 .08em 0 #000}

/* --- жидкость в трубке: волнистая поверхность, пузырьки, блик на стекле --- */
.gh-bar{position:relative;height:1.9em;border-radius:1em 1.2em 1em 1.3em/1.1em 1em 1.2em 1em;background:#030307;border:.14em solid #000;overflow:hidden;display:flex;align-items:center;justify-content:space-between;padding:0 .7em;
  box-shadow:inset 0 .25em .5em rgba(0,0,0,.9),0 0 0 .12em rgba(var(--evo-rgb),.4),0 0 .9em rgba(var(--evo-rgb),.25)}
.gh-bar::before{top:.2em;left:6%;width:38%;height:.16em;opacity:.45;z-index:3}
.gh-bar>i{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:0 1em 1em 0;overflow:hidden;transition:width .3s cubic-bezier(.3,1.5,.5,1);--fc:var(--evo-rgb);
  background:linear-gradient(180deg,rgba(255,255,255,.55),rgba(255,255,255,0) 38%,rgba(0,0,0,.28)),linear-gradient(90deg,rgba(var(--fc),.78),rgb(var(--fc)));box-shadow:0 0 .8em rgba(var(--fc),.8)}
.gh-bar>i::before{content:'';position:absolute;left:0;top:-.02em;width:calc(100% + 4em);height:.6em;background:${GH_WAVE} 0 0/2em 100% repeat-x;animation:gh-wave 2.2s linear infinite}
.gh-bar>i::after{content:'';position:absolute;left:0;right:0;top:0;height:200%;background:${ghBubLayers('255,255,255', .6, 1.1)};background-size:100% 50%;animation:gh-rise 5s linear infinite}
@keyframes gh-wave{to{transform:translateX(-2em)}}
@keyframes gh-rise{to{transform:translateY(-50%)}}
.gh-bar>*:not(i){position:relative;z-index:2;font-size:.95em}
.gh-bar-lvl{height:2.3em}
.gh-bar-lvl .gh-bar-l{font-size:1.05em}
.gh-bar-boss>i{--fc:255,70,90}
.gh-bar-boss{justify-content:center;height:1.7em}
.gh-bar-hp>i{--fc:90,240,120}
.gh-bar-hp>i.mid{--fc:255,200,50}
.gh-bar-hp>i.low{--fc:255,64,84;animation:gh-low .6s ease-in-out infinite}
@keyframes gh-low{50%{filter:brightness(1.45)}}
.gh-bar-hp{justify-content:center;height:2.3em;flex:1}
.gh-hp{display:flex;align-items:center;width:min(100%,26em);margin-bottom:.2em}
.gh-hp-ico{width:3em;height:3em;margin-right:-1em;z-index:3}
.gh-hp.hit{animation:gh-hit .3s}
@keyframes gh-hit{25%{transform:translateX(-.3em) scale(1.03,.96)}75%{transform:translateX(.3em)}}
.gh-packs{display:flex;gap:.5em;width:100%}
.gh-pack{flex:1;min-width:0;flex-direction:column;gap:0;padding:.35em .3em .3em;--jd:6.5s}
.gh-pack:nth-child(2){--dx:62%;--jl:-3s;border-radius:1.6em 1.2em 1.7em 1.3em/1.2em 1.6em 1.2em 1.5em}
.gh-pack-t{font-size:.95em}
.gh-low .gh-pack{padding:.2em .2em .15em}

/* --- тосты, праздничная плашка --- */
.gh-toasts{z-index:8;position:absolute;left:0;right:0;bottom:11em;display:flex;flex-direction:column;align-items:center;gap:.4em;pointer-events:none}
.gh-low .gh-toasts{bottom:8.5em}
.gh-touch.gh-port .gh-toasts{bottom:14em}
.gh-toast{padding:.45em 1.2em .45em 2.1em;font-size:1em;max-width:92%;text-align:center;border-radius:1.4em 1.9em 1.4em 1.8em/1.3em 1.1em 1.5em 1.2em;--tcol:var(--evo-rgb);
  animation:gh-toast-in .4s cubic-bezier(.3,2,.5,1),gh-toast-out .3s ease-in forwards}
.gh-toast::after{content:'';position:absolute;left:.65em;top:50%;width:.9em;height:.9em;margin-top:-.45em;border-radius:50% 50% 50% 8%;rotate:-45deg;background:radial-gradient(circle at 35% 30%,#fff 0 12%,rgb(var(--tcol)) 18%);box-shadow:0 0 .6em rgb(var(--tcol))}
.gh-toast.good{--tcol:200,255,30}.gh-toast.bad{--tcol:255,70,90}
.gh-toast.good,.gh-toast.bad{background:linear-gradient(180deg,#221b38,#09080f) padding-box,linear-gradient(150deg,#6e6492,rgba(var(--tcol),.9)) border-box}
@keyframes gh-toast-in{from{transform:translateY(1.2em) scale(.6,1.3);opacity:0}}
@keyframes gh-toast-out{to{transform:translateY(-.6em) scale(1,.8);opacity:0}}
.gh-cel-layer{z-index:9;position:absolute;inset:0;pointer-events:none;display:flex;align-items:center;justify-content:center}
.gh-cel{position:relative;display:flex;flex-direction:column;align-items:center;gap:.1em;margin-top:-8%;padding:1.4em 2.4em 1.2em;animation:gh-cel 2.3s cubic-bezier(.3,1.5,.5,1) forwards}
.gh-cel::before{content:'';position:absolute;inset:0;z-index:-1;border-radius:46% 54% 50% 50%/55% 45% 55% 45%;
  background:radial-gradient(circle at 28% 22%,#fff 0 3%,transparent 4%),radial-gradient(ellipse at 50% 100%,rgba(var(--cc-rgb),.35),transparent 70%),linear-gradient(180deg,#1e1733,#05050a);
  box-shadow:inset 0 -.8em 1.2em rgba(0,0,0,.7),0 0 2em rgba(var(--cc-rgb),.7),0 0 0 .2em rgba(var(--cc-rgb),.85)}
.gh-cel-rays{position:absolute;width:26em;height:26em;max-width:130vw;left:50%;top:50%;margin:-13em 0 0 -13em;background:repeating-conic-gradient(from 0deg,rgba(var(--cc-rgb),.45) 0 8deg,transparent 8deg 24deg);-webkit-mask:radial-gradient(circle,#000 5%,transparent 66%);mask:radial-gradient(circle,#000 5%,transparent 66%);animation:gh-spin 7s linear infinite;z-index:-2}
@keyframes gh-spin{to{transform:rotate(360deg)}}
.gh-cel-ico{width:5.2em;height:5.2em;filter:drop-shadow(0 0 .6em var(--cc)) drop-shadow(0 .1em 0 #000)}
.gh-cel-title{font-family:var(--game-title-font,var(--game-font,sans-serif));font-size:2.5em;color:var(--cc);text-align:center;text-shadow:0 0 .35em var(--cc),0 .08em 0 #000;max-width:86vw;line-height:1}
.gh-cel-sub{font-size:1.3em;color:#fff;text-align:center;max-width:86vw}
@keyframes gh-cel{0%{transform:scale(.2,.1);opacity:0}14%{transform:scale(1.15,.9);opacity:1}24%{transform:scale(.97,1.04)}32%{transform:scale(1)}82%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.06) translateY(-.6em)}}
`;

const GH_CSS_WIN = `
/* --- окна: толстый обод, ярлык-«прилипшая слизь» поверх края, подтёки сверху, пузырьки внутри, капли-брызги на углу --- */
.gh-layer{position:absolute;inset:0;z-index:5;pointer-events:none}
.gh-modal{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:2em .6em .7em;pointer-events:auto;animation:gh-fade .2s;
  background:radial-gradient(120% 100% at 50% 40%,rgba(26,10,52,.5),rgba(2,0,10,.88))}
.gh-low .gh-modal{padding-top:1.6em}
.gh-modal.gh-ovl{z-index:2}
@keyframes gh-fade{from{opacity:0}}
.gh-win{width:min(100%,60em);max-height:100%;display:flex;flex-direction:column;border-width:.28em;border-radius:1.7em 2.2em 1.8em 2.4em/2em 1.6em 2.3em 1.7em;pointer-events:auto;padding:0;overflow:visible;
  animation:gh-pop .55s cubic-bezier(.3,1.7,.5,1);
  box-shadow:inset 0 .14em .06em rgba(255,255,255,.12),inset 0 -1em 1.5em rgba(0,0,0,.6),0 .4em 0 rgba(0,0,0,.7),0 0 1.8em rgba(var(--evo-rgb),.3)}
.gh-win::before{left:auto;right:9%;top:.3em;width:14%;max-width:7em}
@keyframes gh-pop{0%{transform:scale(.7,.5) translateY(2em);opacity:0}45%{opacity:1}65%{transform:scale(1.04,.97)}100%{transform:none}}
/* капли цвета эволюции, приставшие к углу панели */
.gh-win::after{content:'';position:absolute;right:-.9em;bottom:-.9em;width:4em;height:3em;pointer-events:none;z-index:4;
  background:radial-gradient(circle at 34% 30%,#fff 0 .08em,transparent .1em),radial-gradient(ellipse 1.5em 1.2em at 40% 48%,var(--evo) 0 98%,transparent 100%),radial-gradient(circle .62em at 82% 26%,var(--evo) 0 98%,transparent 100%),radial-gradient(circle .3em at 92% 80%,var(--evo) 0 98%,transparent 100%),radial-gradient(circle .22em at 14% 90%,var(--evo) 0 98%,transparent 100%);
  filter:drop-shadow(0 .1em 0 rgba(0,0,0,.7)) drop-shadow(0 0 .35em rgba(var(--evo-rgb),.7))}
.gh-win.w-shop{width:min(100%,66em)}
.gh-win.gh-sm{width:min(100%,26em)}
.gh-bub{position:absolute;inset:.25em;border-radius:inherit;overflow:hidden;pointer-events:none;z-index:0;opacity:.7}
.gh-bub i{position:absolute;left:0;right:0;top:0;height:200%;background:${ghBubLayers('var(--evo-rgb)', .45, 1.8)};background-size:100% 50%;animation:gh-rise 22s linear infinite}
.gh-whead{position:relative;z-index:3;display:flex;align-items:center;gap:.4em;padding:0 .7em 0 .5em;margin-top:-1.35em;flex:none;pointer-events:none}
.gh-whead>*{pointer-events:auto}
.gh-low .gh-whead{margin-top:-1.15em}
.gh-whead-ico{width:2.5em;height:2.5em;padding:.25em;border-radius:48% 52% 46% 54%/55% 45% 55% 45%;background:radial-gradient(circle at 32% 25%,#3a3160,#0c0914);border:.14em solid rgba(var(--evo-rgb),.9);box-shadow:0 .2em 0 #000,0 0 .8em rgba(var(--evo-rgb),.5);rotate:-7deg;z-index:2;filter:none}
.gh-wtitle{position:relative;margin:0 0 0 -.9em;padding:.12em .9em .22em 1.1em;font-family:var(--game-title-font,var(--game-font,sans-serif));font-weight:400;font-size:1.65em;line-height:1.05;min-width:0;color:#0b0a14;
  rotate:-1.6deg;border-radius:1.1em .9em 1.2em .8em/1em 1.1em .9em 1.1em;border:.1em solid #000;
  background:radial-gradient(circle at 18% 18%,#fff 0 .05em,transparent .08em),linear-gradient(180deg,rgba(255,255,255,.55),rgba(255,255,255,0) 45%),rgb(var(--evo-rgb));
  text-shadow:0 .05em 0 rgba(255,255,255,.5);box-shadow:inset 0 -.2em .3em rgba(0,0,0,.3),0 .16em 0 #000,0 0 1em rgba(var(--evo-rgb),.6)}
.gh-sm .gh-wtitle{font-size:1.45em}
.gh-wbody{position:relative;z-index:1;padding:1.3em .9em .9em;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y;flex:1;min-height:0;border-radius:0 0 1.7em 1.9em}
.gh-low .gh-wbody{padding:1em .7em .6em}
.gh-wbody>*{position:relative;z-index:1}
.gh-hint{margin:.8em 0 0;text-align:center;font-size:.85em;color:rgba(255,255,255,.78)}
.gh-hint.warn{color:#ffb4b4}
.gh-sub-line{margin:0 0 .8em;text-align:center;color:rgba(255,255,255,.88);font-size:.95em}
.gh-sub-line.big{font-size:1.05em}
.gh-ovl-btns{display:flex;flex-direction:column;gap:.75em;margin-top:.6em}
.gh-ovl-btns .gh-btn{width:100%}

/* вкладки: «ярлыки» из слизи, чуть набекрень */
.gh-tabs{display:flex;gap:.5em;margin-bottom:.9em;overflow-x:auto;padding:.3em .2em .5em;flex:none;-webkit-overflow-scrolling:touch}
.gh-tab{flex:1;min-width:0;flex-direction:column;gap:0;padding:.4em .5em;--tc-rgb:var(--evo-rgb);animation:none}
.gh-tab:nth-child(odd){rotate:-1.2deg}.gh-tab:nth-child(even){rotate:.9deg;border-radius:1.6em 1.2em 1.7em 1.3em/1.2em 1.6em 1.2em 1.5em}
.gh-tab.on{--b1:rgba(var(--tc-rgb),1);--b2:rgba(var(--tc-rgb),.62);--bt:#0b0a14;--rim:rgba(255,255,255,.5);scale:1.05;box-shadow:inset 0 -.4em .5em rgba(0,0,0,.35),0 .26em 0 #000,0 0 1em rgba(var(--tc-rgb),.7)}
.gh-tab.on .gh-t{color:#0b0a14;-webkit-text-stroke:0;text-shadow:0 .06em 0 rgba(255,255,255,.45)}
.gh-tab-ico{width:2em;height:2em}
.gh-tab-cap{-webkit-text-stroke-width:.1em;font-size:max(11px,.78em)}
.gh-tabs:not(.shop) .gh-tab{flex-direction:row;font-size:1.05em;padding:.55em .8em}

/* миры: каждая карточка — свой комок (форма и наклон по месту) */
.gh-stages{display:grid;grid-template-columns:repeat(auto-fill,minmax(12.5em,1fr));gap:1em .9em;--tc:#fff}
.gh-stage{padding:.75em .75em .8em;display:flex;flex-direction:column;gap:.45em;background:linear-gradient(180deg,rgba(var(--tc-rgb),.16),transparent 55%) padding-box,linear-gradient(180deg,#221b38 0,#140f22 40%,#09080f 100%) padding-box,linear-gradient(150deg,#6e6492 0,#2a2442 22%,#0e0b17 45%,rgba(var(--tc-rgb),.95) 100%) border-box}
.gh-stage:nth-child(4n+1){rotate:-.8deg}
.gh-stage:nth-child(4n+2){rotate:.6deg;border-radius:1.9em 1.2em 1.7em 1.3em/1.3em 1.8em 1.2em 1.7em}
.gh-stage:nth-child(4n+3){rotate:.4deg;border-radius:1.3em 1.9em 1.2em 1.8em/1.7em 1.2em 1.9em 1.3em}
.gh-stage:nth-child(4n){rotate:-.5deg}
.gh-stage.locked{filter:saturate(.3) brightness(.78)}
.gh-stage.boss{--tc-rgb:255,70,90;box-shadow:inset 0 -.7em 1.1em rgba(0,0,0,.7),0 .28em 0 rgba(0,0,0,.65),0 0 1.3em rgba(255,70,90,.6)}
.gh-stage-head{display:flex;align-items:center;gap:.5em}
.gh-stage-ico{width:2.4em;height:2.4em}
.gh-stage-name{display:flex;flex-direction:column;flex:1;min-width:0}
.gh-stage-name b{font-size:1.1em}
.boss-name{font-size:.78em;color:#ff9aa6}
.gh-stage-state{width:1.8em;height:1.8em}
.gh-stage-rec{font-size:.8em}
.gh-stage-rw{display:flex;align-items:center;gap:.35em}
.gh-stage-rw .gh-ico{width:1.5em;height:1.5em}
.gh-stage-rw b{font-size:.95em}
.gh-stage-lock{text-align:center;font-size:.82em;color:rgba(255,255,255,.75);padding:.5em 0 .2em}
.gh-stage-play{width:100%;margin-top:auto}

/* эволюция */
.gh-evo-row{display:flex;align-items:stretch;justify-content:center;gap:.5em}
.gh-evo-row.one{justify-content:center}
.gh-arrow{align-self:center;flex:none;width:2.4em;height:2.4em;background:rgb(var(--evo-rgb));border-radius:50% 0 50% 50%;rotate:-45deg;animation:gh-arrow 1s ease-in-out infinite;box-shadow:inset .15em .15em .2em rgba(255,255,255,.6),0 0 .8em rgba(var(--evo-rgb),.8)}
@keyframes gh-arrow{50%{translate:.3em .3em}}
.gh-form{flex:1;max-width:19em;padding:.8em .6em;display:flex;flex-direction:column;align-items:center;gap:.25em;text-align:center;--g:#4de8ff;--evo-rgb:var(--grgb);--grgb:77,232,255}
.gh-form:nth-child(1){rotate:-1deg}.gh-form:nth-child(3){rotate:.8deg}
.gh-form.big{border-width:.24em}
.gh-form-label{font-size:max(11px,.7em);color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.06em}
.gh-form-name{font-family:var(--game-title-font,var(--game-font,sans-serif));font-size:1.35em;color:var(--g);-webkit-text-stroke-width:.1em}
.gh-form-mult{font-size:.85em;color:rgba(255,255,255,.88)}
.gh-form-atk{display:flex;align-items:center;gap:.5em;text-align:left;margin-top:.4em;padding:.45em .55em;border-radius:1.1em;background:rgba(0,0,0,.5);box-shadow:inset 0 .15em .3em rgba(0,0,0,.7);width:100%}
.gh-form-atk>div{display:flex;flex-direction:column;min-width:0}
.gh-form-atk b{font-size:.95em}
.gh-atk-desc{font-size:.78em;color:rgba(255,255,255,.78)}
.gh-atk-ico{width:2.6em;height:2.6em}
.gh-reqs{margin:1em auto 0;max-width:30em;display:flex;flex-direction:column;gap:.5em}
.gh-reqs .gh-form-label{text-align:center}
.gh-req-top{display:flex;align-items:center;justify-content:space-between;font-size:.92em;margin-bottom:.2em}
.gh-req-ok{width:1.4em;height:1.4em}
.gh-req.ok .gh-req-top{color:var(--lime)}
.gh-bar-req{height:1.15em;padding:0}
.gh-req.ok .gh-bar-req>i{--fc:200,255,30}
.gh-evo-btns{display:flex;gap:.8em;margin:1.1em auto 0;max-width:34em;flex-wrap:wrap}
.gh-evo-btns .gh-btn{flex:1 1 12em}
.gh-evo-max{font-family:var(--game-title-font,var(--game-font,sans-serif));text-align:center;font-size:1.7em;margin-top:.8em;color:rgb(var(--evo-rgb))}
.gh-blob{position:relative;width:5.6em;height:4.8em;margin:.4em 0 .6em;border-radius:48% 52% 44% 56%/62% 58% 42% 38%;background:radial-gradient(ellipse at 28% 18%,#fff 0 .12em,rgba(255,255,255,.4) .14em,transparent 1.2em),radial-gradient(ellipse at 50% 92%,#2a2744,#07070c 72%);box-shadow:inset 0 0 .7em rgba(var(--grgb),.75),inset 0 -.4em .6em rgba(0,0,0,.6),0 0 1.3em rgba(var(--grgb),.55);animation:gh-wob 2.8s ease-in-out infinite;transform-origin:50% 100%}
@keyframes gh-wob{0%,100%{transform:scale(1,1)}40%{transform:scale(1.07,.93)}70%{transform:scale(.97,1.05)}}
.gh-blob::after{content:'';position:absolute;left:18%;right:18%;bottom:-.6em;height:.8em;background:radial-gradient(ellipse .25em .6em at 25% 0,#07070c 0 70%,transparent 76%) no-repeat,radial-gradient(ellipse .2em .45em at 70% 0,#07070c 0 70%,transparent 76%) no-repeat}
.gh-blob-eye{position:absolute;top:34%;width:1.35em;height:.7em;border-radius:50%;background:var(--g);box-shadow:0 0 .6em var(--g),0 0 1.2em var(--g);animation:gh-blink 4s infinite}
.gh-blob-eye.l{left:20%;rotate:14deg}.gh-blob-eye.r{right:20%;rotate:-14deg}
@keyframes gh-blink{0%,92%,100%{opacity:1}94%{opacity:.2}}
.gh-blob-mouth{position:absolute;left:28%;right:28%;bottom:18%;height:.55em;border-radius:0 0 1em 1em;background:repeating-linear-gradient(90deg,#f3f3ff 0 .18em,transparent .18em .3em);border-bottom:.12em solid var(--g);opacity:.9}
.gh-blob-spike{position:absolute;top:-.55em;left:calc(18% + var(--i) * (64% / max(var(--n),1)));width:.55em;height:.9em;background:#07070c;clip-path:polygon(50% 0,100% 100%,0 100%);filter:drop-shadow(0 0 .1em var(--g))}

/* атаки */
.gh-atks{display:grid;grid-template-columns:repeat(auto-fill,minmax(18em,1fr));gap:.9em .8em}
.gh-atk{display:flex;align-items:center;gap:.7em;padding:.55em .75em;--grgb:255,255,255;--evo-rgb:var(--grgb)}
.gh-atk:nth-child(odd){rotate:-.4deg}.gh-atk:nth-child(even){rotate:.4deg;border-radius:1.9em 1.2em 1.8em 1.3em/1.3em 1.8em 1.2em 1.7em}
.gh-atk.locked{filter:saturate(.25) brightness(.72)}
.gh-atk-icon{width:3.8em;height:3.8em;flex:none;display:flex;align-items:center;justify-content:center;border-radius:50% 46% 52% 48%/48% 52% 46% 54%;background:radial-gradient(circle at 32% 24%,rgba(255,255,255,.7) 0 .1em,transparent .14em),radial-gradient(circle at 50% 60%,rgba(var(--grgb),.55),rgba(0,0,0,.7) 80%);box-shadow:inset 0 -.3em .4em rgba(0,0,0,.5),0 0 .8em rgba(var(--grgb),.4)}
.gh-atk-main{display:flex;flex-direction:column;gap:.1em;flex:1;min-width:0}
.gh-atk-main b{font-size:1.05em}
.gh-atk-stats{font-size:.78em;color:rgb(var(--grgb));filter:brightness(1.35)}
.gh-atk-state{display:flex;flex-direction:column;align-items:center;gap:.1em;max-width:5.5em;text-align:center;font-size:.72em;color:rgba(255,255,255,.75)}
.gh-atk-state .gh-ico{width:1.9em;height:1.9em}

/* подарки */
.gh-gifts{display:grid;grid-template-columns:repeat(auto-fill,minmax(9.2em,1fr));gap:1em .8em}
.gh-gift{display:flex;flex-direction:column;align-items:center;gap:.15em;padding:.65em .4em .55em;text-align:center}
.gh-gift:nth-child(3n+1){rotate:-.8deg}.gh-gift:nth-child(3n+2){rotate:.6deg;border-radius:1.9em 1.2em 1.7em 1.3em/1.3em 1.8em 1.2em 1.7em}
.gh-gift-ico{width:3.2em;height:3.2em}
.gh-gift-amt{font-size:1.05em}
.gh-gift-sub{font-size:max(11px,.74em);color:rgba(255,255,255,.75);min-height:1em}
.gh-gift-timer{font-size:1.1em;color:#fff}
.gh-gift.ready{--evo-rgb:200,255,30;animation:gh-ready2 1.1s ease-in-out infinite}
@keyframes gh-ready2{0%,100%{scale:1}50%{scale:1.04 .97}}
.gh-gift.claimed{filter:saturate(.35) brightness(.78)}
.gh-gift-done{display:flex;align-items:center;gap:.3em;color:var(--lime)}
.gh-gift-done .gh-ico{width:1.6em;height:1.6em}
.gh-gift-btn{width:100%;margin-top:.3em;padding:.35em .3em}
.gh-gift-btn.gh-ad{flex-direction:column;gap:0}
.gh-gift-btn .gh-adrow b{font-size:.95em}

/* настройки */
.gh-set{display:flex;flex-direction:column;gap:.9em;max-width:30em;margin:0 auto}
.gh-set-row{display:flex;align-items:center;gap:.7em;padding:.6em .8em}
.gh-set-col{display:flex;flex-direction:column;gap:.55em;padding:.7em .8em;rotate:.3deg}
.gh-set-ico{width:2.4em;height:2.4em}
.gh-switch{min-width:6.4em;gap:.5em;--b1:#3a3358;--b2:#14101f}
.gh-switch>i{width:2.5em;height:1.3em;border-radius:1em;background:#05050a;position:relative;box-shadow:inset 0 .15em .3em #000,0 0 0 .1em rgba(255,255,255,.15)}
.gh-switch>i::after{content:'';position:absolute;top:.1em;left:.12em;width:1.05em;height:1.05em;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff 0 12%,#9a98ac 20%);transition:transform .35s cubic-bezier(.3,2.4,.5,1)}
.gh-switch.on>i{background:rgb(var(--evo-rgb));box-shadow:inset 0 .15em .3em rgba(0,0,0,.4),0 0 .8em rgba(var(--evo-rgb),.8)}
.gh-switch.on>i::after{transform:translateX(1.15em)}
.gh-seg{display:flex;gap:.45em;flex-wrap:wrap}
.gh-segb{flex:1 1 4.5em;padding:.4em .5em}
.gh-segb.on{--b1:rgb(var(--evo-rgb));--b2:rgba(var(--evo-rgb),.6);--bt:#0b0a14}
.gh-segb.on .gh-t{color:#0b0a14;-webkit-text-stroke:0;text-shadow:0 .06em 0 rgba(255,255,255,.45)}

/* магазин: рамки редкости — цветная слизь по краю; у эпика и легендарки толще и ярче */
.gh-shopbody{display:flex;flex-direction:column;overflow:hidden}
.gh-shop{flex:1;min-height:0;display:flex;gap:.9em}
.gh-sgrid{flex:1;min-width:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y;display:grid;grid-template-columns:repeat(auto-fill,minmax(6.8em,1fr));gap:.8em .6em;align-content:start;padding:.5em .4em .8em}
.gh-sdetail{width:15.5em;flex:none;display:flex;flex-direction:column;align-items:center;gap:.4em;padding:.8em;overflow-y:auto;--rc-rgb:200,200,220;--evo-rgb:var(--rc-rgb)}
.gh-sdetail .gh-btn{width:100%}
.gh-port .gh-shop{flex-direction:column-reverse}
.gh-port .gh-sdetail{width:auto;overflow:visible;padding:.6em;display:grid;grid-template-columns:7.5em 1fr;grid-auto-rows:auto;gap:.3em .8em;text-align:left;justify-items:stretch;align-items:center}
.gh-port .gh-dsw{grid-row:1 / span 5;width:100%}
.gh-port .gh-dtry{display:none}
.gh-low .gh-sdetail{width:13.5em}
.gh-low .gh-dsw{width:7em}
.gh-dsw{position:relative;flex:none;width:9.5em;aspect-ratio:1;border-radius:46% 54% 48% 52%/52% 46% 54% 48%;border:.2em solid transparent;overflow:hidden;font-size:1.4em;
  background:radial-gradient(circle at 50% 35%,#2e2a48,#08080e) padding-box,linear-gradient(150deg,#fff,var(--rc,#b8c4d6) 35%,rgba(var(--rc-rgb),.5)) border-box;
  box-shadow:0 0 1em rgba(var(--rc-rgb),.5),inset 0 0 1em rgba(0,0,0,.6)}
.gh-dsw .gh-sw{font-size:.55em}
.gh-dname{font-size:1.15em;text-align:center}
.gh-rar{font-size:.8em;color:var(--rc);text-transform:uppercase;letter-spacing:.07em;text-shadow:0 .08em 0 #000}
.gh-dprice{display:flex;align-items:center;gap:.3em;font-size:.95em}
.gh-dprice .gh-mini{width:1.4em;height:1.4em}
.gh-dtry{font-size:max(11px,.72em);color:rgba(255,255,255,.6)}
.gh-scard{--b1:#241d3c;--b2:#0b0914;--rw:.16em;font:inherit;color:#f6f3ff;cursor:pointer;pointer-events:auto;margin:0;touch-action:manipulation;transition:transform .4s cubic-bezier(.3,2.4,.5,1);outline:none;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.1em;padding:.35em .3em .4em;aspect-ratio:1/1.4;align-self:start;--rc-rgb:200,200,220;
  border:var(--rw) solid transparent;border-radius:1.2em 1.6em 1.3em 1.5em/1.5em 1.2em 1.6em 1.3em;
  background:linear-gradient(180deg,var(--b1),var(--b2)) padding-box,linear-gradient(150deg,rgba(255,255,255,.7),rgb(var(--rc-rgb)) 30%,rgba(var(--rc-rgb),.55) 100%) border-box;
  box-shadow:inset 0 -.5em .7em rgba(0,0,0,.5),0 .24em 0 #000,0 0 .6em rgba(var(--rc-rgb),.3)}
.gh-scard:nth-child(5n+1){rotate:-1.1deg}.gh-scard:nth-child(5n+2){rotate:.8deg;border-radius:1.6em 1.2em 1.5em 1.3em/1.2em 1.6em 1.3em 1.5em}.gh-scard:nth-child(5n+4){rotate:-.6deg}
.gh-scard.r-uncommon{--rw:.18em}.gh-scard.r-rare{--rw:.22em;box-shadow:inset 0 -.5em .7em rgba(0,0,0,.5),0 .24em 0 #000,0 0 .9em rgba(var(--rc-rgb),.5)}
.gh-scard.r-epic{--rw:.26em;box-shadow:inset 0 -.5em .7em rgba(0,0,0,.5),0 .24em 0 #000,0 0 1.2em rgba(var(--rc-rgb),.75)}
.gh-scard.r-legendary{--rw:.3em;animation:gh-legend 2.6s ease-in-out infinite;box-shadow:inset 0 -.5em .7em rgba(0,0,0,.5),0 .24em 0 #000,0 0 1.4em rgba(var(--rc-rgb),.9)}
@keyframes gh-legend{50%{filter:brightness(1.3)}}
@media (hover:hover){.gh-scard:hover{transform:scale(1.05)}}
.gh-scard:active{transform:scale(1.1,.85);transition-duration:.07s}
.gh-scard.sel{background:linear-gradient(180deg,#3a3066,#120f20) padding-box,linear-gradient(150deg,#fff,rgb(var(--rc-rgb)) 40%,#fff) border-box;box-shadow:inset 0 -.5em .7em rgba(0,0,0,.4),0 .24em 0 #000,0 0 0 .14em #fff,0 0 1.3em rgba(var(--rc-rgb),.95);scale:1.04}
.gh-scard-sw{position:relative;flex:none;width:100%;aspect-ratio:1;border-radius:46% 54% 48% 52%/54% 46% 54% 46%;overflow:hidden;background:radial-gradient(circle at 50% 35%,#2e2a48,#08080e);font-size:.9em;box-shadow:inset 0 .15em .3em rgba(0,0,0,.7)}
.gh-scard-name{-webkit-text-stroke-width:.09em;font-size:max(11px,.76em);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gh-scard-price{display:flex;align-items:center;gap:.2em;font-size:max(11px,.78em);color:#fff;text-shadow:0 .08em 0 #000;min-height:1.4em}
.gh-mini{width:1.4em;height:1.4em}
.gh-shine{position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,transparent 35%,rgba(255,255,255,.45) 50%,transparent 65%);background-size:250% 100%;animation:gh-shine 2.8s linear infinite;mix-blend-mode:overlay}
@keyframes gh-shine{0%{background-position:200% 0}100%{background-position:-100% 0}}
`;

const GH_CSS_SW = `
.gh-sw{position:relative;width:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:1em}
.gh-fx{width:92%;height:92%;color:#fff;filter:drop-shadow(0 0 .3em currentColor)}
.gh-rb,.gh-sw-goo.an-rainbow{animation:gh-hue 3s linear infinite}
@keyframes gh-hue{to{filter:hue-rotate(360deg)}}
.gh-sw-goo{position:relative;width:64%;height:56%;border-radius:48% 52% 46% 54% / 62% 60% 40% 38%;
  background:radial-gradient(ellipse at 30% 22%,rgba(255,255,255,calc(var(--spec) * .65)) 0 9%,transparent 26%),radial-gradient(ellipse at 50% 90%,var(--c2),var(--c) 72%);
  box-shadow:inset 0 0 .45em var(--rim),inset 0 -.35em .5em rgba(0,0,0,.45),0 0 .7em var(--emis)}
.gh-sw-goo::before,.gh-sw-goo::after{content:'';position:absolute;bottom:-.5em;width:.4em;height:.7em;border-radius:0 0 50% 50%;background:var(--c)}
.gh-sw-goo::before{left:24%}.gh-sw-goo::after{right:28%;height:.45em}
.gh-sw-goo.an-pulse{animation:gh-pulse 1.4s ease-in-out infinite}
@keyframes gh-pulse{50%{filter:brightness(1.6) saturate(1.3);transform:scale(1.05)}}
.gh-sw-goo.an-hue{animation:gh-hue 4s linear infinite}
.gh-sw-goo.an-sparkle,.gh-sw-goo.an-void{animation:gh-pulse 2s ease-in-out infinite}
.gh-stars{position:absolute;inset:8%;pointer-events:none;background:radial-gradient(circle,#fff 0 6%,transparent 8%) 12% 20%/30% 30%,radial-gradient(circle,#ffe9a8 0 5%,transparent 7%) 60% 60%/40% 40%,radial-gradient(circle,#fff 0 4%,transparent 6%) 80% 10%/25% 25%;animation:gh-twinkle 1.6s ease-in-out infinite}
@keyframes gh-twinkle{50%{opacity:.25}}
.gh-sw-face{width:70%;height:50%;border-radius:45% 45% 40% 40%;background:radial-gradient(ellipse at 50% 90%,#232338,#07070c 75%);display:flex;align-items:center;justify-content:center;gap:16%;box-shadow:inset 0 .3em .5em rgba(0,0,0,.6)}
.gh-slit{width:24%;height:22%;border-radius:50%;background:linear-gradient(90deg,var(--c),var(--c2));box-shadow:0 0 .4em var(--c),0 0 .9em var(--c)}
.gh-slit:first-child{transform:rotate(14deg)}.gh-slit:last-child{transform:rotate(-14deg)}
.gh-slit.an-pulse{animation:gh-pulse 1s ease-in-out infinite}
.gh-slit.an-hue,.gh-slit.an-rainbow{animation:gh-hue 3s linear infinite}
.gh-slit.an-flicker{animation:gh-flick 1.1s steps(2) infinite}
.gh-slit.an-fire{animation:gh-fire .5s ease-in-out infinite alternate}
@keyframes gh-flick{0%{opacity:1}30%{opacity:.35}60%{opacity:1}80%{opacity:.5}}
@keyframes gh-fire{from{filter:brightness(1);transform:translateY(0) rotate(14deg)}to{filter:brightness(1.6) hue-rotate(-12deg);transform:translateY(-.06em) rotate(14deg)}}
.gh-sw-pop{font-weight:900;font-size:1.9em;-webkit-text-stroke:.2em #000;paint-order:stroke fill;letter-spacing:.02em}
.gh-rar-common{color:#b8c4d6}
`;

const GH_CSS_END = `

/* --- картинки Codex: портреты форм, боссы, баннеры миров, логотип --- */
.gh-portrait{width:6.6em;height:6.6em;object-fit:contain;margin:.1em 0 .2em;pointer-events:none;-webkit-user-drag:none;filter:drop-shadow(0 .08em 0 rgba(0,0,0,.7)) drop-shadow(0 0 .7em rgba(var(--grgb),.75));animation:gh-wob 2.8s ease-in-out infinite;transform-origin:50% 100%}
.gh-low .gh-portrait{width:5.2em;height:5.2em}
.gh-form.big .gh-portrait{width:7.2em;height:7.2em}
.gh-low .gh-form.big .gh-portrait{width:5.6em;height:5.6em}
.gh-boss-ico.art{width:3.1em;height:3.1em;margin:-.3em 0;filter:drop-shadow(0 0 .5em rgba(255,70,90,.8)) drop-shadow(0 .08em 0 #000)}
.gh-stage-ico.gh-stage-boss{width:3.4em;height:3.4em;margin:-.5em -.2em -.5em -.3em;filter:drop-shadow(0 0 .5em rgba(255,70,90,.8)) drop-shadow(0 .08em 0 #000)}
.gh-cel-art{width:6.6em;height:6.6em;object-fit:contain;filter:drop-shadow(0 0 .7em var(--cc)) drop-shadow(0 .1em 0 #000);animation:gh-wob 1.4s ease-in-out infinite;transform-origin:50% 100%}
.gh-atk-icon{position:relative;overflow:visible}
.gh-atk-evo{position:absolute;right:-.9em;bottom:-.7em;width:2.3em;height:2.3em;object-fit:contain;pointer-events:none;filter:drop-shadow(0 .06em 0 #000) drop-shadow(0 0 .35em rgba(var(--grgb),.8))}
.gh-atk{padding-right:.5em}
.gh-atk-main{margin-left:.5em}
.gh-set-logo{display:block;width:min(15em,70%);height:auto;margin:-.2em auto -.2em;pointer-events:none;filter:drop-shadow(0 .1em 0 rgba(0,0,0,.6))}
.gh-low .gh-set-logo{display:none}
/* вкладки миров — иллюстрированные баннеры */
.gh-tabs:not(.shop) .gh-wtab{min-height:max(4.4em,56px);align-items:flex-end;justify-content:center;padding:.3em .5em .35em;color:#fff;
  background:linear-gradient(180deg,rgba(0,0,0,0) 35%,rgba(5,3,12,.85)) padding-box,var(--wimg) center/cover padding-box,linear-gradient(150deg,rgba(255,255,255,.55),rgba(255,255,255,.06) 40%,rgba(var(--tc-rgb),.85) 100%) border-box;filter:saturate(.7) brightness(.72)}
.gh-tabs:not(.shop) .gh-wtab.on{filter:none;box-shadow:inset 0 -.4em .5em rgba(0,0,0,.35),0 .26em 0 #000,0 0 1.1em rgba(var(--tc-rgb),.85),0 0 0 .14em rgba(var(--tc-rgb),.9);scale:1.04}
.gh-tabs:not(.shop) .gh-wtab .gh-t,.gh-tabs:not(.shop) .gh-wtab.on .gh-t{color:#fff;-webkit-text-stroke:.15em var(--ink);text-shadow:0 .09em 0 rgba(0,0,0,.6)}

/* победа / смерть / предложение */
.gh-rewards{display:flex;flex-direction:column;gap:.6em;margin:.4em 0 .9em}
.gh-rw{display:flex;align-items:center;justify-content:center;gap:.6em;padding:.45em .8em;font-size:1.25em;position:relative;--evo-rgb:255,194,58}
.gh-rw:nth-child(2){rotate:.8deg}.gh-rw:nth-child(1){rotate:-.8deg}
.gh-rw-ico{width:2.1em;height:2.1em}
.gh-x3{font-style:normal;font-size:.8em;padding:.05em .55em;border-radius:1em 1.2em .9em 1.3em;background:linear-gradient(180deg,#ffe483,#e48a12);color:#2b1500;border:.12em solid #000;box-shadow:0 .12em 0 #000}
.gh-gold-ico,.gh-offer-big{display:block;margin:0 auto .5em;width:5em;height:5em}
.gh-win-ok{--evo-rgb:200,255,30}
.gh-win-ok .gh-whead,.gh-gold .gh-whead{justify-content:center}
.gh-gold{--evo-rgb:255,194,58}
.gh-dead{--evo-rgb:255,70,90}
.gh-sm .gh-wbody>.gh-btn{display:flex;width:100%}
.gh-sm .gh-whead .gh-grow{flex:1}
/* --- Подарок дня --- */
.gh-win.w-daily{width:min(100%,56em)}
.gh-days{display:grid;grid-template-columns:repeat(7,1fr);gap:.55em;margin-top:1.1em;padding-bottom:.6em}
.gh-port .gh-days{grid-template-columns:repeat(4,1fr)}
.gh-day{display:flex;flex-direction:column;align-items:center;gap:.15em;padding:.45em .25em .4em;text-align:center;min-width:0;--evo-rgb:150,140,190}
.gh-day:nth-child(odd){rotate:-.9deg}.gh-day:nth-child(even){rotate:.7deg;border-radius:1.8em 1.2em 1.7em 1.3em/1.3em 1.7em 1.2em 1.6em}
.gh-day-h{font-size:max(11px,.72em);color:rgba(255,255,255,.8)}
.gh-day-art{position:relative;width:3.4em;height:3.4em;display:flex;align-items:center;justify-content:center}
.gh-day-art.big{width:6.4em;height:6.4em}
.gh-day-ico{width:100%;height:100%}
.gh-day-q{position:absolute;right:-.4em;bottom:-.3em;width:1.5em;height:1.5em}
.gh-day-art.sw{border-radius:46% 54% 48% 52%/52% 46% 54% 48%;overflow:hidden;background:radial-gradient(circle at 50% 35%,#2e2a48,#08080e);border:.15em solid #ffc23a;box-shadow:0 0 .8em rgba(255,194,58,.7)}
.gh-day-art.sw .gh-sw{font-size:.5em}
.gh-day-art.big.sw .gh-sw{font-size:.9em}
.gh-day-n{font-size:max(11px,.85em);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gh-day.ex .gh-day-n{white-space:normal;line-height:1;font-size:max(10px,.7em)}
.gh-day-st{width:1.6em;height:1.6em}
.gh-day-state{font-size:max(11px,.72em);color:var(--lime)}
.gh-day.claimed{filter:saturate(.45) brightness(.78)}
.gh-day.locked,.gh-day.tomorrow{filter:saturate(.7) brightness(.85)}
.gh-day.today{--evo-rgb:200,255,30;animation:gh-ready2 1.1s ease-in-out infinite}
.gh-day.ex{--evo-rgb:255,194,58}
.gh-today{display:flex;align-items:center;gap:.9em;padding:.8em 1em;flex-wrap:wrap;--evo-rgb:200,255,30}
.gh-today.done{justify-content:center}
.gh-today-txt{display:flex;flex-direction:column;gap:.25em;flex:1 1 11em;min-width:0}
.gh-today-label{font-size:1.15em}
.gh-today-x2{font-size:.82em;color:var(--gold);text-shadow:0 .08em 0 #000}
.gh-today-btns{display:flex;flex-direction:column;gap:.6em;flex:0 1 14em;min-width:9em}
.gh-today-btns .gh-btn{width:100%}
.gh-today-ok{width:3.2em;height:3.2em}
.gh-today-timer{font-size:1.25em;color:rgb(var(--evo-rgb))}

/* --- Колесо фортуны --- */
.gh-win.w-wheel{width:min(100%,50em)}
.gh-wheel-row{display:flex;align-items:center;justify-content:center;gap:1.4em;flex-wrap:wrap}
.gh-wheel{position:relative;width:min(19em,100%);aspect-ratio:1;flex:none;margin-top:.9em;filter:drop-shadow(0 .25em 0 rgba(0,0,0,.6)) drop-shadow(0 0 1em rgba(var(--evo-rgb),.4))}
.gh-low .gh-wheel{width:min(15em,100%)}
.gh-wheel-disc{position:absolute;inset:0;will-change:transform}
.gh-wheel-svg{display:block;width:100%;height:100%}
.gh-wedge.win .wp{fill:#7a9d00;stroke:#c8ff1e;stroke-width:2.4}
.gh-wedge.win{animation:gh-wedge .5s ease-in-out 4}
@keyframes gh-wedge{50%{opacity:.55}}
.gh-wheel-ptr{position:absolute;left:50%;top:-1.2em;width:2.2em;height:2.7em;margin-left:-1.1em;z-index:3;pointer-events:none;background:radial-gradient(circle at 35% 25%,#fff 0 .1em,transparent .14em),linear-gradient(180deg,#ff7a8a,#d4102a);clip-path:polygon(50% 100%,6% 38%,10% 14%,32% 2%,68% 2%,90% 14%,94% 38%);filter:drop-shadow(0 .1em 0 #000)}
.gh-wheel-side{display:flex;flex-direction:column;gap:.5em;flex:1 1 13em;max-width:20em;min-width:0}
.gh-wheel-hint{min-height:1.2em;margin:.2em 0 0}

/* --- Рекорды --- */
.gh-win.w-leaders{width:min(100%,38em)}
.gh-lb{display:flex;flex-direction:column;gap:.6em}
.gh-lb-empty{text-align:center;font-size:1.15em;margin:1.4em 0}
.gh-lb-foot{margin-top:.8em}
.gh-lb-foot .gh-btn{width:100%}
.gh-lbrow{display:flex;align-items:center;gap:.7em;padding:.4em .8em .4em .5em;--evo-rgb:150,140,190}
.gh-lbrow:nth-child(odd){rotate:-.3deg}.gh-lbrow:nth-child(even){rotate:.3deg}
.gh-lbrow.top1{--evo-rgb:255,194,58}.gh-lbrow.top2{--evo-rgb:200,210,230}.gh-lbrow.top3{--evo-rgb:230,140,70}
.gh-lbrow.me{--evo-rgb:200,255,30;box-shadow:inset 0 -.7em 1.1em rgba(0,0,0,.7),0 .28em 0 rgba(0,0,0,.65),0 0 1.2em rgba(200,255,30,.7)}
.gh-lb-rank{min-width:1.8em;text-align:center;font-size:1.25em}
.gh-lbrow.top1 .gh-lb-rank{color:var(--gold)}
.gh-lb-av{width:2.8em;height:2.8em;flex:none;border-radius:50%;overflow:hidden;background:radial-gradient(circle at 35% 30%,#2e2a48,#08080e);border:.14em solid rgba(var(--evo-rgb),.9);display:flex;align-items:center;justify-content:center}
.gh-lb-av img{width:100%;height:100%;object-fit:cover}
.gh-lb-av .gh-blob{font-size:.42em;margin:0;animation:none}
.gh-lb-name{flex:1;min-width:0;display:flex;flex-direction:column}
.gh-lb-name b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gh-lb-me{color:var(--lime);font-size:max(11px,.75em)}
.gh-lb-score{display:flex;align-items:center;gap:.3em;white-space:nowrap}
.gh-lb-score small{font-size:max(11px,.75em);color:rgba(255,255,255,.75)}

@media (prefers-reduced-motion:reduce){
  .gh-root *,.gh-root *::before,.gh-root *::after{animation-duration:.001s !important;animation-iteration-count:1 !important;transition-duration:.001s !important}
  .gh-drips i,.gh-bub,.gh-btn::after{display:none}
}
`;
