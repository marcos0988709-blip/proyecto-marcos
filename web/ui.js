import { startBackend } from './backend.js';

const TOKEN_KEY = 'fut14-cards-token';
const TABS = [
  ['inicio', 'Inicio'], ['tienda', 'Tienda'], ['club', 'Club'], ['sbc', 'SBC'], ['draft', 'Draft'], ['base', 'Base'],
];
const S = { backend: null, token: null, me: null, tab: 'inicio', packs: [], versions: [], clubFilter: { chip: 'all', search: '', position: '', sort: 'rating' }, baseFilter: { version: '', search: '', position: '' }, sbc: null, builder: null };

// ---------- utilidades ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = (n) => Number(n ?? 0).toLocaleString('es-ES');
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const readLS = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const writeLS = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } };

async function api(method, path, body) {
  const r = await S.backend.request(method, path, body, S.token);
  if (r.status !== 200) throw new Error(r.data.error ?? 'Error');
  return r.data;
}

let toastTimer;
function toast(msg, error = false) {
  $('.toast')?.remove();
  const t = document.createElement('div');
  t.className = 'toast' + (error ? ' error' : '');
  t.textContent = msg;
  document.body.append(t);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.remove(), 2600);
}
const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { toast(e.message, true); } };

/** Botón de confirmación en dos pasos (la vista no muestra confirm()). */
function twoStep(btn, armedLabel, action) {
  const original = btn.textContent;
  btn.addEventListener('click', guard(async () => {
    if (btn.dataset.armed) { btn.disabled = true; await action(); return; }
    btn.dataset.armed = '1';
    btn.textContent = armedLabel;
    setTimeout(() => { if (btn.isConnected && !btn.disabled) { delete btn.dataset.armed; btn.textContent = original; } }, 4000);
  }));
}

function textColor(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 140 ? '#15110a' : '#f6f3ea';
}

const STAT_LABELS = { pac: 'RIT', sho: 'TIR', pas: 'PAS', dri: 'REG', def: 'DEF', phy: 'FIS' };
const GK_LABELS = { pac: 'EST', sho: 'PAR', pas: 'SAQ', dri: 'REF', def: 'VEL', phy: 'POS' };

function cardHTML(c, { mini = false, tag = '', dim = false, attrs = '' } = {}) {
  if (!c) return '';
  const labels = c.position === 'GK' ? GK_LABELS : STAT_LABELS;
  const stats = Object.entries(labels).map(([k, l]) => `<span><b>${c.stats?.[k] ?? '–'}</b> ${l}</span>`).join('');
  return `<button type="button" class="card${c.special ? ' special' : ''}${mini ? ' mini' : ''}${dim ? ' dim' : ''}" style="--c:${c.color};--t:${textColor(c.color)}" ${attrs} aria-label="${esc(`${c.name}, ${c.rating} ${c.position}, ${c.versionLabel}`)}">
    <span class="face">
      <span class="top"><span class="ovr">${c.rating}</span><span class="pos">${c.position}</span></span>
      <span class="ver">${esc(c.versionLabel)}</span>
      <span class="name">${esc(mini ? c.name.split(' ').slice(1).join(' ') || c.name : c.name)}</span>
      <span class="club">${esc(c.club)} · ${esc(c.nation)}</span>
      <span class="stats">${stats}</span>
    </span>${tag ? `<span class="tag">${esc(tag)}</span>` : ''}
  </button>`;
}

const REQ_TEXT = {
  minTeamRating: (v) => `Media de equipo mín. ${v}`,
  minChemistry: (v) => `Química mín. ${v}`,
  minSpecial: (v) => `Cartas especiales mín. ${v}`,
  minRare: (v) => `Cartas raras mín. ${v}`,
  minRatingEach: (v) => `Cada jugador: media mín. ${v}`,
  maxRatingEach: (v) => `Cada jugador: media máx. ${v}`,
  minDistinctLeagues: (v) => `Ligas distintas: mín. ${v}`,
  maxDistinctLeagues: (v) => `Ligas distintas: máx. ${v}`,
  minDistinctNations: (v) => `Nacionalidades distintas: mín. ${v}`,
  maxDistinctNations: (v) => `Nacionalidades distintas: máx. ${v}`,
  minDistinctClubs: (v) => `Clubes distintos: mín. ${v}`,
  maxDistinctClubs: (v) => `Clubes distintos: máx. ${v}`,
  sameLeague: (v) => `Jugadores de la misma liga: mín. ${v}`,
  sameNation: (v) => `Jugadores de la misma nación: mín. ${v}`,
  sameClub: (v) => `Jugadores del mismo club: mín. ${v}`,
  nation: (v) => `${v.name}: mín. ${v.count}`,
  league: (v) => `${v.name}: mín. ${v.count}`,
  versionCount: (v) => `${v.versions.join(', ')}: mín. ${v.count}`,
};
const reqText = (k, v) => (REQ_TEXT[k] ? REQ_TEXT[k](v) : `${k}: ${JSON.stringify(v)}`);
const packName = (id) => S.packs.find((p) => p.id === id)?.name ?? id;
function rewardText(r) {
  if (!r) return '';
  const parts = [];
  if (r.cardId) parts.push('Carta del jugador');
  for (const p of r.packs ?? []) parts.push(packName(p));
  if (r.coins) parts.push(`${fmt(r.coins)} monedas`);
  return parts.join(' + ');
}

// ---------- shell ----------
function renderShell() {
  document.getElementById('app').innerHTML = `
    <header class="topbar">
      <div class="brand">FUT<b>14</b> Cards</div>
      <div class="coins" id="coins"><i aria-hidden="true"></i><span>${fmt(S.me?.coins)}</span></div>
    </header>
    <main id="view"></main>
    <nav class="tabs" aria-label="Secciones">${TABS.map(([id, l]) => `<button type="button" data-tab="${id}">${l}</button>`).join('')}</nav>`;
  $$('nav.tabs button').forEach((b) => b.addEventListener('click', () => go(b.dataset.tab)));
}

async function refreshMe() {
  S.me = await api('GET', '/me');
  const c = $('#coins span');
  if (c) c.textContent = fmt(S.me.coins);
}

function go(tab) {
  if (location.hash !== `#${tab}`) location.hash = tab;
  else show(tab);
}

function show(tab) {
  S.tab = TABS.some(([id]) => id === tab) ? tab : 'inicio';
  $$('nav.tabs button').forEach((b) => b.toggleAttribute('aria-current', b.dataset.tab === S.tab) || b.setAttribute('aria-current', b.dataset.tab === S.tab ? 'page' : 'false'));
  $$('nav.tabs button').forEach((b) => (b.dataset.tab === S.tab ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current')));
  const view = $('#view');
  view.scrollTop = 0;
  ({ inicio: viewHome, tienda: viewStore, club: viewClub, sbc: viewSbc, draft: viewDraft, base: viewBase })[S.tab](view);
}

function setView(view, html) {
  view.innerHTML = `<div class="wrap">${html}</div>`;
  return view.firstElementChild;
}

// ---------- hojas ----------
function openSheet(title, html, onMount) {
  closeSheet();
  const bg = document.createElement('div');
  bg.className = 'sheet-bg';
  bg.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><header><h2>${esc(title)}</h2><button type="button" class="close" aria-label="Cerrar">×</button></header><div class="body">${html}</div></div>`;
  bg.addEventListener('click', (e) => { if (e.target === bg) closeSheet(); });
  $('.close', bg).addEventListener('click', closeSheet);
  document.body.append(bg);
  onMount?.($('.body', bg));
}
const closeSheet = () => $('.sheet-bg')?.remove();

async function cardSheet(cardOrUserCard, { owned = false, onChange } = {}) {
  const c = cardOrUserCard;
  const full = await api('GET', `/cards/${c.cardId}`);
  const others = full.otherVersions;
  openSheet(c.name, `
    <div class="row" style="align-items:flex-start;flex-wrap:nowrap">
      <div style="width:42%;max-width:180px;flex-shrink:0">${cardHTML(c)}</div>
      <div style="display:flex;flex-direction:column;gap:8px;min-width:0">
        <span class="eyebrow">${esc(c.versionLabel)}</span>
        <p><b>${esc(c.club)}</b><br><span class="muted">${esc(c.league)} · ${esc(c.nation)}</span></p>
        <p class="muted">Posición ${c.position}${c.altPositions.length ? ` (también ${c.altPositions.join(', ')})` : ''}</p>
        <p class="muted">Venta rápida: <b style="color:var(--ink)">${fmt(c.quickSell)}</b></p>
        ${owned ? `<button type="button" class="btn danger" id="qs">Vender por ${fmt(c.quickSell)}</button>` : ''}
        ${owned && c.untradeable ? '<span class="chip">Intransferible</span>' : ''}
      </div>
    </div>
    ${others.length ? `<h3>Otras versiones</h3><div class="cards">${others.map((o) => cardHTML(o)).join('')}</div>` : ''}`, (body) => {
    const qs = $('#qs', body);
    if (qs) twoStep(qs, `Confirmar venta (+${fmt(c.quickSell)})`, async () => {
      const r = await api('POST', '/me/club/quicksell', { userCardIds: [c.userCardId] });
      toast(`Vendida por ${fmt(r.coinsEarned)} monedas`);
      closeSheet();
      await refreshMe();
      onChange?.();
    });
  });
}

// ---------- apertura de sobres ----------
async function openPackFlow(promise) {
  const res = await promise;
  await refreshMe();
  const best = res.cards[0];
  const ov = document.createElement('div');
  ov.className = 'opening';
  ov.style.setProperty('--glow', best?.color ?? '#ffd34d');
  ov.innerHTML = `${res.walkout ? '<div class="beam"></div>' : ''}
    <div class="info"><span class="eyebrow">${res.walkout ? 'Walkout' : 'Mejor carta del sobre'}</span><h1>${esc(packName(res.packId))}</h1></div>
    <div class="hero">${cardHTML(best)}</div>
    <div class="actions"><button type="button" class="btn primary" id="seeAll">Ver las ${res.cards.length} cartas</button></div>`;
  document.body.append(ov);
  $('#seeAll', ov).addEventListener('click', () => { ov.remove(); packResults(res); });
}

function packResults(res) {
  const fodder = res.cards.filter((c) => !c.rare && !c.special);
  const fodderValue = fodder.reduce((s, c) => s + c.quickSell, 0);
  const ov = document.createElement('div');
  ov.className = 'results';
  ov.innerHTML = `<div class="body"><div class="wrap">
      <div><span class="eyebrow">${esc(packName(res.packId))}</span><h1>Tu sobre</h1></div>
      <div class="cards">${res.cards.map((c, i) => cardHTML(c, { attrs: `data-i="${i}"`, tag: c.special ? c.versionLabel : '' })).join('')}</div>
    </div></div>
    <footer>
      <button type="button" class="btn" id="sellFodder" ${fodder.length ? '' : 'disabled'}>Vender ${fodder.length} no raras (+${fmt(fodderValue)})</button>
      <button type="button" class="btn primary" id="toClub">Guardar en el club</button>
    </footer>`;
  document.body.append(ov);
  $$('.card', ov).forEach((el) => el.addEventListener('click', () => cardSheet(res.cards[el.dataset.i])));
  const done = () => { ov.remove(); show(S.tab); };
  $('#toClub', ov).addEventListener('click', done);
  if (fodder.length) twoStep($('#sellFodder', ov), `Confirmar (+${fmt(fodderValue)})`, async () => {
    const r = await api('POST', '/me/club/quicksell', { userCardIds: fodder.map((c) => c.userCardId) });
    toast(`+${fmt(r.coinsEarned)} monedas`);
    await refreshMe();
    done();
  });
}

// ---------- vistas ----------
async function viewHome(view) {
  await refreshMe();
  const [packs, club] = await Promise.all([api('GET', '/me/packs'), api('GET', '/me/club?limit=6')]);
  const root = setView(view, `
    <div><span class="eyebrow">Temporada 13/14</span><h1>Club de ${esc(S.me.username)}</h1></div>
    <div class="stat-strip">
      <div><b>${fmt(S.me.coins)}</b><span>Monedas</span></div>
      <div><b>${fmt(S.me.clubSize)}</b><span>Cartas</span></div>
      <div><b>${fmt(packs.length)}</b><span>Sobres</span></div>
    </div>
    <section class="sec">
      <h2>Sobres sin abrir</h2>
      ${packs.length ? `<div class="list">${packs.map((p) => `
        <div class="item"><div class="grow"><b>${esc(p.name)}</b><span class="muted" style="font-size:13px">${p.source === 'welcome' ? 'Regalo de bienvenida' : p.source.startsWith('sbc') ? 'Recompensa de SBC' : p.source.startsWith('draft') ? 'Recompensa de draft' : 'Tienda'}${p.untradeable ? ' · intransferible' : ''}</span></div>
        <button type="button" class="btn primary small" data-open="${p.userPackId}">Abrir</button></div>`).join('')}</div>`
        : '<p class="muted">No tienes sobres pendientes. Compra uno en la Tienda o gánalo en SBCs y drafts.</p>'}
    </section>
    ${club.items.length ? `<section class="sec"><div class="row between"><h2>Tus mejores cartas</h2><button type="button" class="btn small" data-go="club">Ver club</button></div>
      <div class="cards">${club.items.map((c, i) => cardHTML(c, { attrs: `data-i="${i}"` })).join('')}</div></section>` : ''}
    <section class="sec">
      <h2>Modo prueba</h2>
      <p class="muted">Tu partida se guarda en este navegador. Para probar todo rápido puedes darte monedas.</p>
      <div class="row"><button type="button" class="btn" id="coins100">+100.000 monedas</button><button type="button" class="btn danger" id="reset">Reiniciar partida</button></div>
    </section>
    <section class="sec">
      <h2>Tu base de datos</h2>
      <p class="muted">Carga un CSV con tus jugadores (por ejemplo, la plantilla de la temporada 13/14). Se generan todas las cartas especiales y se queda solo en este navegador. Sustituye a los jugadores de demo y vacía tu club; tus monedas se mantienen.</p>
      <label class="btn" for="csv" style="align-self:flex-start">Importar CSV</label>
      <input type="file" id="csv" accept=".csv,text/csv" hidden>
    </section>`);
  $('#csv', root).addEventListener('change', guard(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    toast('Importando…');
    const r = S.backend.importCsv(await file.text());
    [S.packs, S.versions] = await Promise.all([api('GET', '/packs'), api('GET', '/versions')]);
    toast(`${fmt(r.players)} jugadores y ${fmt(r.cards)} cartas cargadas`);
    show('inicio');
  }));
  $$('[data-open]', root).forEach((b) => b.addEventListener('click', guard(() => openPackFlow(api('POST', `/me/packs/${b.dataset.open}/open`)))));
  $$('[data-go]', root).forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));
  $$('.card', root).forEach((el) => el.addEventListener('click', () => cardSheet(club.items[el.dataset.i], { owned: true, onChange: () => show('inicio') })));
  $('#coins100', root).addEventListener('click', guard(async () => { S.backend.addTestCoins(S.me.id, 100000); toast('+100.000 monedas'); show('inicio'); }));
  twoStep($('#reset', root), 'Pulsa otra vez para borrar todo', async () => {
    S.backend.reset();
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* nada */ }
    location.hash = '';
    location.reload();
  });
}

async function viewStore(view) {
  await refreshMe();
  const root = setView(view, `
    <div><span class="eyebrow">Tienda</span><h1>Sobres</h1></div>
    <p class="muted">Las medias altas salen menos. El sobre promo garantiza una carta especial y el de leyenda, una leyenda.</p>
    <div class="list">${S.packs.map((p) => `
      <div class="item"><div class="grow"><b>${esc(p.name)}</b><span class="muted" style="font-size:13px">${p.cards} cartas${p.guaranteed ? ` · ${p.guaranteed} garantizada` : ''}</span></div>
      <span class="price">${fmt(p.price)}</span>
      <button type="button" class="btn primary small" data-buy="${p.id}" ${S.me.coins < p.price ? 'disabled' : ''}>Comprar</button></div>`).join('')}</div>`);
  $$('[data-buy]', root).forEach((b) => b.addEventListener('click', guard(async () => {
    b.disabled = true;
    await openPackFlow(api('POST', `/store/packs/${b.dataset.buy}/buy`, {}));
  })));
}

const CLUB_CHIPS = [['all', 'Todas', ''], ['special', 'Especiales', 'special=true'], ['gold', 'Oro', 'version=gold,gold_rare'], ['silver', 'Plata', 'version=silver,silver_rare'], ['bronze', 'Bronce', 'version=bronze,bronze_rare']];
const POS_OPTIONS = ['', 'GK', 'LB', 'CB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST'];

async function listView(view, { title, eyebrow, endpoint, filter, chips, owned }) {
  let page = 1;
  let items = [];
  const root = setView(view, `
    <div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1></div>
    <div class="row"><input class="field" id="q" type="search" placeholder="Buscar jugador" value="${esc(filter.search)}" aria-label="Buscar jugador">
      <select class="field" id="pos" aria-label="Posición">${POS_OPTIONS.map((p) => `<option value="${p}" ${p === filter.position ? 'selected' : ''}>${p || 'Todas las posiciones'}</option>`).join('')}</select></div>
    <div class="chips" role="group" aria-label="Tipo de carta">${chips.map(([id, l]) => `<button type="button" class="chip${filter.chip === id ? ' on' : ''}" data-chip="${id}">${esc(l)}</button>`).join('')}</div>
    <p class="muted" id="count"></p>
    <div class="cards" id="grid"></div>
    <button type="button" class="btn" id="more" hidden>Cargar más</button>`);
  const qs = () => {
    const chip = chips.find(([id]) => id === filter.chip)?.[2] ?? '';
    return [chip, filter.search && `search=${encodeURIComponent(filter.search)}`, filter.position && `position=${filter.position}`].filter(Boolean).join('&');
  };
  const load = guard(async (reset) => {
    if (reset) { page = 1; items = []; }
    const r = await api('GET', `${endpoint}?limit=60&page=${page}&${qs()}`);
    items.push(...r.items);
    $('#count', root).textContent = `${fmt(r.total)} cartas`;
    $('#grid', root).innerHTML = items.map((c, i) => cardHTML(c, { attrs: `data-i="${i}"` })).join('') || '<p class="muted">Nada por aquí con estos filtros.</p>';
    $$('#grid .card', root).forEach((el) => el.addEventListener('click', guard(() => cardSheet(items[el.dataset.i], { owned, onChange: () => load(true) }))));
    $('#more', root).hidden = items.length >= r.total;
  });
  let t;
  $('#q', root).addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => { filter.search = e.target.value.trim(); load(true); }, 250); });
  $('#pos', root).addEventListener('change', (e) => { filter.position = e.target.value; load(true); });
  $$('[data-chip]', root).forEach((b) => b.addEventListener('click', () => {
    filter.chip = b.dataset.chip;
    $$('[data-chip]', root).forEach((x) => x.classList.toggle('on', x === b));
    load(true);
  }));
  $('#more', root).addEventListener('click', () => { page++; load(false); });
  await load(true);
}

const viewClub = (view) => listView(view, { title: 'Mi club', eyebrow: 'Colección', endpoint: '/me/club', filter: S.clubFilter, chips: CLUB_CHIPS, owned: true });

function viewBase(view) {
  if (!S.baseFilter.chip) S.baseFilter.chip = 'all';
  const chips = [['all', 'Todas', ''], ...S.versions.filter((v) => v.count).map((v) => [v.id, v.label, `version=${v.id}`])];
  return listView(view, { title: 'Base de datos', eyebrow: `${fmt(S.versions.reduce((s, v) => s + v.count, 0))} cartas`, endpoint: '/cards', filter: S.baseFilter, chips, owned: false });
}

// ---------- campo ----------
const ROW = { ST: 0, LW: 0, RW: 0, CAM: 1, LM: 1, RM: 1, CM: 2, CDM: 3, LB: 4, CB: 4, RB: 4, GK: 5 };
const SIDE = { LB: 0, LM: 0, LW: 0, RB: 2, RM: 2, RW: 2 };
function pitchHTML(slots) {
  const rows = [[], [], [], [], [], []];
  slots.forEach((s, i) => rows[ROW[s.position]].push({ ...s, i }));
  return `<div class="pitch">${rows.filter((r) => r.length).map((r) => `<div class="line">${r
    .sort((a, b) => (SIDE[a.position] ?? 1) - (SIDE[b.position] ?? 1) || a.i - b.i)
    .map((s) => `<div class="slot"><button type="button" class="wrapbtn" data-slot="${s.i}" aria-label="Hueco ${s.position}">${s.card ? cardHTML(s.card, { mini: true, attrs: 'tabindex="-1"' }) : `<span class="empty">${s.position}</span>`}</button>${s.chem != null ? `<span class="chem">${s.chem}/3</span>` : ''}</div>`).join('')}</div>`).join('')}</div>`;
}
const inPos = (c, pos) => c.position === pos || c.altPositions.includes(pos);

// ---------- SBC ----------
async function viewSbc(view) {
  if (S.builder) return viewBuilder(view);
  if (S.sbc) return viewSbcDetail(view);
  const sbcs = await api('GET', '/me/sbcs');
  const cats = [...new Set(sbcs.map((s) => s.category))];
  const status = (s) => {
    const done = s.challenges.filter((c) => c.completed).length;
    if (s.repeatable) return s.completedTimes ? `<span class="chip ok">Hecho ×${s.completedTimes}</span>` : '<span class="chip">Repetible</span>';
    if (s.completedTimes) return '<span class="chip ok">Completado</span>';
    return s.challenges.length > 1 ? `<span class="chip">${done}/${s.challenges.length} retos</span>` : '';
  };
  const root = setView(view, `
    <div><span class="eyebrow">Squad Building Challenges</span><h1>SBC</h1></div>
    <p class="muted">Entrega plantillas de tu club que cumplan los requisitos. Las cartas se consumen y recibes la recompensa.</p>
    ${cats.map((cat) => `<section class="sec"><h2>${esc(cat)}</h2><div class="list">${sbcs.filter((s) => s.category === cat).map((s) => `
      <button type="button" class="item" style="text-align:left;border:0;width:100%" data-sbc="${esc(s.id)}">
        <span class="grow"><b>${esc(s.name)}</b><span class="muted" style="font-size:13px">${esc(rewardText(s.reward))}</span></span>${status(s)}
      </button>`).join('')}</div></section>`).join('')}`);
  $$('[data-sbc]', root).forEach((b) => b.addEventListener('click', () => { S.sbc = b.dataset.sbc; show('sbc'); }));
}

async function viewSbcDetail(view) {
  const all = await api('GET', '/me/sbcs');
  const s = all.find((x) => x.id === S.sbc);
  if (!s) { S.sbc = null; return viewSbc(view); }
  const rewardCard = s.rewardCardId ? await api('GET', `/cards/${s.rewardCardId}`) : null;
  const locked = !s.repeatable && s.completedTimes > 0;
  const root = setView(view, `
    <button type="button" class="btn small" id="back" style="align-self:flex-start">← Todos los SBC</button>
    <div><span class="eyebrow">${esc(s.category)}</span><h1>${esc(s.name)}</h1></div>
    <p class="muted">${esc(s.description)}</p>
    <div class="row" style="align-items:flex-start;flex-wrap:nowrap">
      ${rewardCard ? `<div style="width:34%;max-width:150px;flex-shrink:0">${cardHTML(rewardCard)}</div>` : ''}
      <div style="display:flex;flex-direction:column;gap:4px;min-width:0"><span class="eyebrow">Recompensa final</span><b>${esc(rewardText(s.reward))}</b>
      ${locked ? '<span class="chip ok" style="align-self:flex-start">Completado</span>' : ''}</div>
    </div>
    ${s.challenges.map((c) => `<section class="list">
      <div class="item"><div class="grow"><b>${esc(c.name)}</b>${c.reward ? `<span class="muted" style="font-size:13px">Recompensa: ${esc(rewardText(c.reward))}</span>` : ''}</div>
        ${c.completed && !s.repeatable ? '<span class="chip ok">Hecho</span>' : `<button type="button" class="btn primary small" data-ch="${esc(c.id)}" ${locked ? 'disabled' : ''}>Hacer</button>`}</div>
      ${Object.entries(c.requirements).map(([k, v]) => `<div class="req"><span>${esc(reqText(k, v))}</span></div>`).join('')}
    </section>`).join('')}`);
  $('#back', root).addEventListener('click', () => { S.sbc = null; show('sbc'); });
  $$('[data-ch]', root).forEach((b) => b.addEventListener('click', () => {
    const ch = s.challenges.find((c) => c.id === b.dataset.ch);
    S.builder = { sbc: s, challenge: ch, formation: '4-4-2', slots: Array(11).fill(null), check: null };
    show('sbc');
  }));
}

async function loadClubAll() {
  const all = [];
  for (let page = 1; ; page++) {
    const r = await api('GET', `/me/club?limit=100&page=${page}`);
    all.push(...r.items);
    if (all.length >= r.total || !r.items.length) return all;
  }
}

async function viewBuilder(view) {
  const B = S.builder;
  const [formations, club] = await Promise.all([api('GET', '/formations'), loadClubAll()]);
  B.club = club;
  const positions = formations[B.formation];
  const used = () => new Set(B.slots.filter(Boolean).map((c) => c.userCardId));
  const usedPlayers = () => new Set(B.slots.filter(Boolean).map((c) => c.playerId));
  const full = () => B.slots.every(Boolean);

  const render = async () => {
    B.check = null;
    if (full()) {
      try {
        B.check = await api('POST', `/sbcs/${B.sbc.id}/submit`, { challengeId: B.challenge.id, formation: B.formation, squad: B.slots.map((c) => c.userCardId), dryRun: true });
      } catch (e) { toast(e.message, true); }
    }
    const reqs = B.check?.requirements ?? Object.entries(B.challenge.requirements).map(([key, required]) => ({ key, required, actual: null, ok: null }));
    const slots = positions.map((position, i) => ({ position, card: B.slots[i], chem: B.check ? B.check.evaluation.slots[i].chemistry : null }));
    const root = setView(view, `
      <button type="button" class="btn small" id="back" style="align-self:flex-start">← ${esc(B.sbc.name)}</button>
      <div><span class="eyebrow">${esc(B.sbc.name)}</span><h1>${esc(B.challenge.name)}</h1></div>
      <div class="row"><select class="field" id="form" aria-label="Formación">${Object.keys(formations).map((f) => `<option ${f === B.formation ? 'selected' : ''}>${f}</option>`).join('')}</select>
        <button type="button" class="btn" id="auto">Autocompletar</button><button type="button" class="btn" id="clear">Vaciar</button></div>
      <div class="score"><div><span class="muted">Media</span><b>${B.check ? B.check.evaluation.rating : '–'}</b></div><div><span class="muted">Química</span><b>${B.check ? B.check.evaluation.chemistry : '–'}/33</b></div></div>
      ${pitchHTML(slots)}
      <div class="list">${reqs.map((r) => `<div class="req ${r.ok === true ? 'ok' : r.ok === false ? 'ko' : ''}"><span>${esc(reqText(r.key, r.required))}</span><span class="v">${r.actual == null ? '—' : `${r.ok ? '✓' : '✗'} ${r.actual}`}</span></div>`).join('')}</div>
      <button type="button" class="btn primary" id="submit" ${B.check?.ok ? '' : 'disabled'}>${full() ? (B.check?.ok ? 'Entregar plantilla' : 'Faltan requisitos') : `Coloca ${B.slots.filter((x) => !x).length} jugadores más`}</button>
      <p class="muted" style="font-size:13px">Tienes ${fmt(club.length)} cartas en el club. Las cartas entregadas desaparecen.</p>`);
    $('#back', root).addEventListener('click', () => { S.builder = null; show('sbc'); });
    $('#form', root).addEventListener('change', (e) => { B.formation = e.target.value; B.slots = Array(11).fill(null); show('sbc'); });
    $('#clear', root).addEventListener('click', () => { B.slots = Array(11).fill(null); render(); });
    $('#auto', root).addEventListener('click', () => { autoFill(); render(); });
    $$('[data-slot]', root).forEach((b) => b.addEventListener('click', () => pickFor(Number(b.dataset.slot))));
    $('#submit', root).addEventListener('click', guard(async () => {
      $('#submit', root).disabled = true;
      const r = await api('POST', `/sbcs/${B.sbc.id}/submit`, { challengeId: B.challenge.id, formation: B.formation, squad: B.slots.map((c) => c.userCardId) });
      await refreshMe();
      const got = [B.challenge.reward && rewardText(B.challenge.reward), r.sbcCompleted && rewardText(B.sbc.reward)].filter(Boolean);
      S.builder = null;
      if (!B.sbc.repeatable && !r.sbcCompleted) S.sbc = B.sbc.id; else S.sbc = B.sbc.repeatable ? B.sbc.id : null;
      openSheet(r.sbcCompleted ? '¡SBC completado!' : 'Reto completado', `
        <p>${got.length ? `Has recibido: <b>${esc(got.join(' + '))}</b>.` : 'Reto entregado. Completa el resto para la recompensa final.'}</p>
        <p class="muted">Los sobres te esperan en Inicio y las cartas ya están en tu club.</p>
        <div class="row"><button type="button" class="btn primary" id="toHome">Ir a abrir sobres</button><button type="button" class="btn" id="stay">Seguir en SBC</button></div>`, (body) => {
        $('#toHome', body).addEventListener('click', () => { closeSheet(); go('inicio'); });
        $('#stay', body).addEventListener('click', () => { closeSheet(); show('sbc'); });
      });
      show('sbc');
    }));
  };

  const bounds = () => ({ min: B.challenge.requirements.minRatingEach ?? 0, max: B.challenge.requirements.maxRatingEach ?? 99 });
  function autoFill() {
    const { min, max } = bounds();
    const leagueCount = new Map();
    B.slots.filter(Boolean).forEach((c) => leagueCount.set(c.league, (leagueCount.get(c.league) ?? 0) + 1));
    positions.forEach((pos, i) => {
      if (B.slots[i]) return;
      const u = used(), up = usedPlayers();
      const cands = club.filter((c) => !u.has(c.userCardId) && !up.has(c.playerId) && c.rating >= min && c.rating <= max);
      const pool = cands.filter((c) => inPos(c, pos));
      const best = (pool.length ? pool : cands).sort((a, b) => (leagueCount.get(b.league) ?? 0) - (leagueCount.get(a.league) ?? 0) || b.rating - a.rating)[0];
      if (best) { B.slots[i] = best; leagueCount.set(best.league, (leagueCount.get(best.league) ?? 0) + 1); }
    });
  }

  function pickFor(i) {
    const pos = positions[i];
    let onlyPos = true;
    const draw = (body) => {
      const u = used(), up = usedPlayers();
      const list = club.filter((c) => !u.has(c.userCardId) && (!up.has(c.playerId) || B.slots[i]?.playerId === c.playerId) && (!onlyPos || inPos(c, pos))).sort((a, b) => b.rating - a.rating);
      body.innerHTML = `<div class="row"><button type="button" class="chip${onlyPos ? ' on' : ''}" id="tog" style="border:0">Solo ${pos}</button>${B.slots[i] ? '<button type="button" class="btn small danger" id="rm">Quitar del hueco</button>' : ''}</div>
        <div class="cards">${list.map((c, k) => cardHTML(c, { attrs: `data-k="${k}"` })).join('') || '<p class="muted">No tienes cartas disponibles para este hueco. Abre más sobres o quita el filtro.</p>'}</div>`;
      $('#tog', body).addEventListener('click', () => { onlyPos = !onlyPos; draw(body); });
      $('#rm', body)?.addEventListener('click', () => { B.slots[i] = null; closeSheet(); render(); });
      $$('.card', body).forEach((el) => el.addEventListener('click', () => { B.slots[i] = list[el.dataset.k]; closeSheet(); render(); }));
    };
    openSheet(`Elegir ${pos}`, '', draw);
  }

  await render();
}

// ---------- Draft ----------
async function viewDraft(view) {
  const list = await api('GET', '/drafts');
  const active = list.find((d) => d.status !== 'finished');
  if (S.draftId && !list.some((d) => d.id === S.draftId)) S.draftId = null;
  const id = S.draftId ?? active?.id;
  if (!id) return draftStart(view);
  S.draftId = id;
  const d = await api('GET', `/drafts/${id}`);
  renderDraft(view, d);
}

function draftStart(view) {
  const root = setView(view, `
    <div><span class="eyebrow">Modo draft</span><h1>Arma tu once</h1></div>
    <p class="muted">Elige formación y capitán, rellena cada hueco entre 5 cartas y juega hasta 4 partidos seguidos. Una derrota termina el torneo. Cuantas más victorias, mejores premios.</p>
    <div class="list">
      ${[[0, 'Gold pack + 500'], [1, 'Oro premium + 2.000'], [2, '2 oro premium + 5.000'], [3, 'Promo + oro premium + 10.000'], [4, 'Raros 80+ + promo + 25.000']].map(([w, r]) => `<div class="item"><b>${w} victorias</b><span class="muted">${r}</span></div>`).join('')}
    </div>
    <div class="row"><button type="button" class="btn primary" id="single" ${S.me.coins < 15000 ? 'disabled' : ''}>Jugar draft · 15.000</button><button type="button" class="btn" id="practice">Práctica gratis (sin premios)</button></div>`);
  const start = (mode) => guard(async () => { const d = await api('POST', '/drafts', { mode }); S.draftId = d.id; await refreshMe(); renderDraft(view, d); });
  $('#single', root).addEventListener('click', start('single'));
  $('#practice', root).addEventListener('click', start('practice'));
}

function renderDraft(view, d) {
  const picked = d.slots.filter((s) => s.card);
  const avg = picked.length ? Math.round(picked.reduce((s, x) => s + x.card.rating, 0) / picked.length) : 0;
  const header = `<div><span class="eyebrow">${d.mode === 'practice' ? 'Draft de práctica' : 'Draft'}${d.formation ? ` · ${esc(d.formation)}` : ''}</span><h1>${{ formation: 'Elige formación', captain: 'Elige capitán', picking: 'Completa el once', tournament: 'Torneo', finished: 'Draft terminado' }[d.step]}</h1></div>`;
  let body = '';
  if (d.step === 'formation') {
    body = `<div class="list">${d.formationOptions.map((f) => `<button type="button" class="item" style="border:0;width:100%" data-f="${esc(f)}"><b style="font-family:var(--display);font-size:20px">${esc(f)}</b><span class="muted">Elegir</span></button>`).join('')}</div>`;
  } else if (d.step === 'captain') {
    body = `<p class="muted">Tu capitán ocupa su posición en el once.</p><div class="cards">${d.captainOptions.map((c, i) => cardHTML(c, { attrs: `data-cap="${i}"` })).join('')}</div>`;
  } else {
    const slots = d.slots.map((s, i) => ({ position: s.position, card: s.card, chem: d.squad ? d.squad.slots[i].chemistry : null }));
    body = `
      <div class="score"><div><span class="muted">${d.squad ? 'Media' : 'Media actual'}</span><b>${d.squad ? d.squad.rating : avg || '–'}</b></div><div><span class="muted">${d.squad ? 'Química' : 'Jugadores'}</span><b>${d.squad ? `${d.squad.chemistry}/33` : `${picked.length}/11`}</b></div></div>
      ${d.step === 'picking' ? '<p class="muted">Toca un hueco vacío para ver tus 5 opciones.</p>' : ''}
      ${pitchHTML(slots)}
      ${d.matches.length ? `<div class="list">${d.matches.map((m) => `<div class="match"><span><b>${esc(m.round)}</b><br><span class="muted" style="font-size:13px">Rival ${m.opponentRating} · ${m.winProbability}% de victoria${m.penalties ? ` · penaltis ${m.penalties}` : ''}</span></span><span class="res ${m.won ? 'win' : 'loss'}">${m.score}</span></div>`).join('')}</div>` : ''}
      ${d.status === 'ready' ? `<div class="row"><button type="button" class="btn primary" id="play">Jugar ${['cuartos', 'semifinal', 'final', 'gran final'][d.wins]} · rival ${d.nextOpponentRating}</button><button type="button" class="btn" id="forfeit">Retirarse y cobrar</button></div>` : ''}
      ${d.status === 'finished' ? `<section class="list"><div class="item"><b>${d.wins} ${d.wins === 1 ? 'victoria' : 'victorias'}${d.wins === 4 ? ' · ¡campeón!' : ''}</b></div>
        <div class="item"><span>${d.rewards?.practice ? 'Draft de práctica: sin premios.' : `Premio: <b>${esc(rewardText(d.rewards))}</b>`}</span></div></section>
        <div class="row">${d.rewards?.practice ? '' : '<button type="button" class="btn primary" id="toHome">Abrir premios</button>'}<button type="button" class="btn" id="again">Nuevo draft</button></div>` : ''}`;
  }
  const root = setView(view, header + body);
  const act = (fn) => guard(async () => { const nd = await fn(); renderDraft(view, nd); });
  $$('[data-f]', root).forEach((b) => b.addEventListener('click', act(() => api('POST', `/drafts/${d.id}/formation`, { formation: b.dataset.f }))));
  $$('[data-cap]', root).forEach((b) => b.addEventListener('click', act(() => api('POST', `/drafts/${d.id}/captain`, { cardId: d.captainOptions[b.dataset.cap].cardId }))));
  if (d.step === 'picking') $$('[data-slot]', root).forEach((b) => b.addEventListener('click', () => {
    const slot = d.slots[b.dataset.slot];
    if (slot.card) return cardSheet(slot.card);
    openSheet(`Elige ${slot.position}`, `<div class="cards">${slot.options.map((c, i) => cardHTML(c, { attrs: `data-o="${i}"` })).join('')}</div>`, (body) => {
      $$('[data-o]', body).forEach((el) => el.addEventListener('click', act(async () => {
        closeSheet();
        return api('POST', `/drafts/${d.id}/pick`, { slot: slot.index, cardId: slot.options[el.dataset.o].cardId });
      })));
    });
  }));
  else $$('[data-slot]', root).forEach((b) => b.addEventListener('click', () => { const c = d.slots[b.dataset.slot].card; if (c) cardSheet(c); }));
  $('#play', root)?.addEventListener('click', act(async () => { $('#play', root).disabled = true; const nd = await api('POST', `/drafts/${d.id}/play`); await refreshMe(); return nd; }));
  if ($('#forfeit', root)) twoStep($('#forfeit', root), 'Confirmar retirada', act(async () => { const nd = await api('POST', `/drafts/${d.id}/forfeit`); await refreshMe(); return nd; }));
  $('#toHome', root)?.addEventListener('click', () => go('inicio'));
  $('#again', root)?.addEventListener('click', () => { S.draftId = null; draftStart(view); });
}

// ---------- arranque ----------
async function boot() {
  S.backend = await startBackend();
  S.token = readLS(TOKEN_KEY);
  try {
    if (!S.token) throw new Error('sin token');
    await refreshMe();
  } catch {
    const u = await api('POST', '/auth/register', { username: `jugador${Math.floor(1000 + Math.random() * 9000)}` });
    S.token = u.token;
    writeLS(TOKEN_KEY, u.token);
    await refreshMe();
  }
  [S.packs, S.versions] = await Promise.all([api('GET', '/packs'), api('GET', '/versions')]);
  renderShell();
  window.addEventListener('hashchange', () => show(location.hash.slice(1)));
  show(location.hash.slice(1) || 'inicio');
}

boot().catch((e) => {
  console.error(e);
  document.getElementById('app').innerHTML = `<div class="loading"><div><h2>No se pudo arrancar</h2><p class="muted">${esc(e.message)}</p></div></div>`;
});
