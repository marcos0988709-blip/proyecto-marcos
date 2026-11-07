import { CardStore, publicCard } from './cardStore.js';
import { VERSIONS, quickSellValue } from './config/versions.js';
import { FORMATIONS } from './config/formations.js';
import { PACKS } from './config/packs.js';
import { tx } from './db.js';
import { HttpError, assert } from './lib/http.js';
import * as users from './services/users.js';
import { rollPack, listPacks } from './services/packs.js';
import { evaluateSquad } from './services/squad.js';
import { allSbcs, findSbc, progressFor, sbcView, submitChallenge } from './services/sbc.js';
import * as drafts from './services/draft.js';

const routes = [];
const route = (method, path, handler, { auth = false } = {}) => {
  const keys = [];
  const re = new RegExp('^' + path.replace(/:(\w+)/g, (_, k) => (keys.push(k), '([^/]+)')) + '/?$');
  routes.push({ method, re, keys, handler, auth });
};

const paginate = (items, q) => {
  const limit = Math.min(100, Math.max(1, Number(q.get('limit') ?? 30)));
  const page = Math.max(1, Number(q.get('page') ?? 1));
  return { total: items.length, page, limit, items: items.slice((page - 1) * limit, page * limit) };
};

const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function filterCards(cards, q) {
  const search = norm(q.get('search'));
  const f = (k) => q.get(k);
  let out = cards.filter((c) =>
    (!search || norm(c.name).includes(search)) &&
    (!f('nation') || c.nation === f('nation')) &&
    (!f('league') || c.league === f('league')) &&
    (!f('club') || c.club === f('club')) &&
    (!f('position') || c.position === f('position')) &&
    (!f('version') || f('version').split(',').includes(c.version)) &&
    (!f('special') || String(c.special) === f('special')) &&
    (!f('minRating') || c.rating >= Number(f('minRating'))) &&
    (!f('maxRating') || c.rating <= Number(f('maxRating'))));
  const sort = f('sort') ?? 'rating';
  const sorters = { rating: (a, b) => b.rating - a.rating, name: (a, b) => a.name.localeCompare(b.name), pac: (a, b) => (b.stats.pac ?? 0) - (a.stats.pac ?? 0) };
  return out.sort(sorters[sort] ?? sorters.rating);
}

export function createApp(db) {
  const store = new CardStore(db);
  routes.length = 0;

  // ---------- Catálogo público ----------
  route('GET', '/', () => ({
    name: 'FUT14 Cards API', version: '1.0.0',
    players: db.prepare('SELECT COUNT(*) n FROM players').get().n, cards: store.cards.length,
    docs: 'Ver README.md',
  }));
  route('GET', '/versions', () => Object.entries(VERSIONS).map(([id, v]) => ({ id, ...v, count: store.cards.filter((c) => c.version === id).length })));
  route('GET', '/formations', () => FORMATIONS);
  route('GET', '/meta', () => {
    const uniq = (k) => [...new Set(store.cards.map((c) => c[k]))].sort();
    return { nations: uniq('nation'), leagues: uniq('league'), clubs: uniq('club'), positions: uniq('position') };
  });
  route('GET', '/cards', ({ q }) => {
    const p = paginate(filterCards(store.cards, q), q);
    return { ...p, items: p.items.map((c) => publicCard(c)) };
  });
  route('GET', '/cards/:id', ({ params }) => {
    const c = store.get(params.id);
    assert(c, 404, 'Carta no encontrada');
    const otherVersions = store.cards.filter((x) => x.playerId === c.playerId && x.id !== c.id).map((x) => publicCard(x));
    return { ...publicCard(c), otherVersions };
  });
  route('GET', '/players/:id', ({ params }) => {
    const versions = store.cards.filter((c) => c.playerId === Number(params.id)).sort((a, b) => a.rating - b.rating);
    assert(versions.length, 404, 'Jugador no encontrado');
    return { playerId: Number(params.id), name: versions[0].name, versions: versions.map((c) => publicCard(c)) };
  });
  route('GET', '/packs', () => listPacks());
  route('GET', '/sbcs', ({ q }) => allSbcs(store).filter((s) => !q.get('category') || s.category === q.get('category')).map((s) => sbcView(s)));
  route('GET', '/sbcs/:id', ({ params }) => sbcView(findSbc(store, params.id)));
  route('POST', '/squad/evaluate', ({ body }) => {
    const cards = (body.cardIds ?? []).map((id) => { const c = store.get(id); assert(c, 404, `Carta ${id} no existe`); return c; });
    return evaluateSquad(cards, body.formation);
  });

  // ---------- Cuenta ----------
  route('POST', '/auth/register', ({ body }) => users.register(db, body.username));
  route('GET', '/me', ({ user }) => ({
    ...user,
    coins: users.getCoins(db, user.id),
    clubSize: db.prepare('SELECT COUNT(*) n FROM user_cards WHERE user_id = ?').get(user.id).n,
    unopenedPacks: db.prepare('SELECT COUNT(*) n FROM user_packs WHERE user_id = ?').get(user.id).n,
  }), { auth: true });

  route('GET', '/me/club', ({ user, q }) => {
    const rows = db.prepare('SELECT id, card_id, untradeable FROM user_cards WHERE user_id = ?').all(user.id);
    // Cada instancia (puede haber duplicados) se lista por separado con su userCardId
    const byCard = Map.groupBy(rows, (r) => r.card_id);
    const owned = [...byCard.keys()].map((id) => store.get(id)).filter(Boolean);
    const instances = filterCards(owned, q).flatMap((c) =>
      byCard.get(c.id).map((r) => publicCard(c, { userCardId: r.id, untradeable: Boolean(r.untradeable) })));
    return paginate(instances, q);
  }, { auth: true });

  route('POST', '/me/club/quicksell', ({ user, body }) => tx(db, () => {
    const owned = users.getOwnedCards(db, store, user.id, body.userCardIds);
    const total = owned.reduce((s, o) => s + quickSellValue(o.card.version, o.card.rating), 0);
    users.removeUserCards(db, user.id, owned.map((o) => o.userCardId));
    users.addCoins(db, user.id, total);
    return { sold: owned.length, coinsEarned: total, coins: users.getCoins(db, user.id) };
  }), { auth: true });

  route('GET', '/me/packs', ({ user }) => db.prepare('SELECT id AS userPackId, pack_id AS packId, untradeable, source, created_at AS createdAt FROM user_packs WHERE user_id = ? ORDER BY id')
    .all(user.id).map((p) => ({ ...p, name: PACKS[p.packId]?.name, untradeable: Boolean(p.untradeable) })), { auth: true });

  const openInto = (userId, packId, untradeable) => {
    const cards = rollPack(store, packId);
    const ids = users.addCards(db, userId, cards.map((c) => c.id), { untradeable });
    const items = cards.map((c, i) => publicCard(c, { userCardId: ids[i], untradeable }));
    const best = items[0];
    return { packId, walkout: Boolean(best && (best.special || best.rating >= 86)), cards: items };
  };

  route('POST', '/me/packs/:id/open', ({ user, params }) => tx(db, () => {
    const p = db.prepare('SELECT * FROM user_packs WHERE id = ? AND user_id = ?').get(Number(params.id), user.id);
    assert(p, 404, 'Sobre no encontrado');
    db.prepare('DELETE FROM user_packs WHERE id = ?').run(p.id);
    return openInto(user.id, p.pack_id, Boolean(p.untradeable));
  }), { auth: true });

  route('POST', '/store/packs/:packId/buy', ({ user, params, body }) => tx(db, () => {
    const pack = PACKS[params.packId];
    assert(pack, 404, 'Sobre no encontrado');
    users.spendCoins(db, user.id, pack.price);
    if (body.open === false) return { userPackIds: users.addPacks(db, user.id, [params.packId]), coins: users.getCoins(db, user.id) };
    return { ...openInto(user.id, params.packId, false), coins: users.getCoins(db, user.id) };
  }), { auth: true });

  // ---------- SBCs ----------
  route('GET', '/me/sbcs', ({ user }) => allSbcs(store).map((s) => sbcView(s, progressFor(db, user.id, s.id))), { auth: true });
  route('POST', '/sbcs/:id/submit', ({ user, params, body }) => submitChallenge(db, store, user.id, params.id, body), { auth: true });

  // ---------- Drafts ----------
  route('POST', '/drafts', ({ user, body }) => drafts.createDraft(db, store, user.id, body.mode), { auth: true });
  route('GET', '/drafts', ({ user }) => db.prepare('SELECT id, mode, status, created_at AS createdAt FROM drafts WHERE user_id = ? ORDER BY id DESC').all(user.id), { auth: true });
  route('GET', '/drafts/:id', ({ user, params }) => drafts.getDraft(db, store, user.id, params.id), { auth: true });
  route('POST', '/drafts/:id/formation', ({ user, params, body }) => drafts.chooseFormation(db, store, user.id, params.id, body.formation), { auth: true });
  route('POST', '/drafts/:id/captain', ({ user, params, body }) => drafts.chooseCaptain(db, store, user.id, params.id, body.cardId), { auth: true });
  route('POST', '/drafts/:id/pick', ({ user, params, body }) => drafts.pick(db, store, user.id, params.id, body.slot, body.cardId), { auth: true });
  route('POST', '/drafts/:id/play', ({ user, params }) => drafts.play(db, store, user.id, params.id), { auth: true });
  route('POST', '/drafts/:id/forfeit', ({ user, params }) => drafts.forfeit(db, store, user.id, params.id), { auth: true });

  /** Ejecuta una petición sin depender de node:http (lo usa también la app web offline). */
  const dispatch = async ({ method, path, body = {}, authorization }) => {
    try {
      const url = new URL(path, 'http://localhost');
      const r = routes.find((x) => x.method === method && x.re.test(url.pathname));
      if (!r) throw new HttpError(404, `Ruta no encontrada: ${method} ${url.pathname}`);
      const m = url.pathname.match(r.re);
      const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
      const user = r.auth ? users.authenticate(db, authorization) : null;
      const data = await r.handler({ params, q: url.searchParams, body: body ?? {}, user });
      return { status: 200, data };
    } catch (err) {
      if (err instanceof HttpError) return { status: err.status, data: { error: err.message, details: err.details } };
      console.error(err);
      return { status: 500, data: { error: 'Error interno' } };
    }
  };

  const handler = async (req, res) => {
    const send = (status, data) => {
      res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      });
      res.end(status === 204 ? undefined : JSON.stringify(data));
    };
    if (req.method === 'OPTIONS') return send(204);
    let body = {};
    if (req.method === 'POST') {
      let raw = '';
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 1e6) return send(413, { error: 'Body demasiado grande' });
      }
      try { body = raw ? JSON.parse(raw) : {}; } catch { return send(400, { error: 'JSON inválido' }); }
    }
    const { status, data } = await dispatch({ method: req.method, path: req.url, body, authorization: req.headers.authorization });
    send(status, data);
  };
  return { handler, dispatch, store };
}
