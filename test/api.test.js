import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { openDb } from '../src/db.js';
import { createApp } from '../src/app.js';
import { seedDatabase } from '../src/seed/index.js';
import { generateDemoPlayers } from '../src/seed/demo.js';
import { parseCsv, normalizePlayer } from '../src/seed/csv.js';
import { teamRating } from '../src/services/squad.js';

let server, base, db, store;
const call = async (method, path, body, token) => {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
};

before(async () => {
  db = openDb(':memory:');
  seedDatabase(db, generateDemoPlayers());
  const app = createApp(db);
  store = app.store;
  server = createServer(app.handler);
  await new Promise((r) => server.listen(0, r));
  base = `http://localhost:${server.address().port}`;
});
after(() => server.close());

test('catálogo: versiones especiales y búsqueda', async () => {
  const { data: versions } = await call('GET', '/versions');
  for (const v of ['inform', 'motm', 'otw', 'tots', 'toty', 'legend', 'future_stars', 'sbc_special']) {
    assert.ok(versions.find((x) => x.id === v).count > 0, `faltan cartas ${v}`);
  }
  const { data } = await call('GET', '/cards?version=toty&limit=50');
  assert.equal(data.total, 11);
  assert.ok(data.items.every((c) => c.special && c.rating >= 80));
});

test('fórmula de media de equipo', () => {
  const cards = Array.from({ length: 11 }, (_, i) => ({ rating: i < 10 ? 80 : 90 }));
  assert.equal(teamRating(cards), 81);
});

test('importador CSV con alias estilo dataset público', () => {
  const [row] = parseCsv('short_name,nationality_name,league_name,club_name,player_positions,overall,pace\n"Pérez, J.",Spain,Liga X,Club Y,"RWB, RM",78,88\n');
  const p = normalizePlayer(row);
  assert.equal(p.name, 'Pérez, J.');
  assert.equal(p.position, 'RB');
  assert.equal(p.alt_positions, 'RM');
  assert.equal(p.pac, 88);
});

test('registro, sobres de bienvenida, compra y venta rápida', async () => {
  const { data: u } = await call('POST', '/auth/register', { username: 'marcos' });
  assert.equal((await call('POST', '/auth/register', { username: 'marcos' })).status, 409);
  const { data: packs } = await call('GET', '/me/packs', null, u.token);
  assert.equal(packs.length, 2);
  const opened = await call('POST', `/me/packs/${packs[0].userPackId}/open`, null, u.token);
  assert.equal(opened.data.cards.length, 12);
  const bought = await call('POST', '/store/packs/promo_pack/buy', {}, u.token);
  assert.equal(bought.status, 200);
  assert.ok(bought.data.cards.some((c) => c.special), 'el promo pack garantiza especial');
  const sell = await call('POST', '/me/club/quicksell', { userCardIds: [bought.data.cards.at(-1).userCardId] }, u.token);
  assert.ok(sell.data.coinsEarned > 0);
  assert.equal((await call('POST', '/store/packs/legend_pack/buy', {}, u.token)).status, 402);
});

test('SBC: rechaza plantilla inválida y acepta una válida', async () => {
  const { data: u } = await call('POST', '/auth/register', { username: 'sbc_user' });
  // Dar al usuario 11 cartas de un mismo club en su posición (química alta)
  const club = store.cards.find((c) => c.version.startsWith('gold') && !c.isLegend).club;
  const formation = '4-4-2';
  const slots = ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'RM', 'ST', 'ST'];
  const used = new Set();
  const cardIds = slots.map((pos) => {
    const c = store.cards.find((x) => x.club === club && x.position === pos && !used.has(x.playerId) && !x.special);
    used.add(c.playerId);
    return c.id;
  });
  const ins = db.prepare('INSERT INTO user_cards (user_id, card_id) VALUES (?, ?)');
  const userCardIds = cardIds.map((id) => Number(ins.run(u.id, id).lastInsertRowid));

  const bad = await call('POST', '/sbcs/upgrade_86/submit', { formation, squad: userCardIds }, u.token);
  assert.equal(bad.data.ok, false);

  const ok = await call('POST', '/sbcs/hybrid_nations/submit', { formation, squad: userCardIds, dryRun: true }, u.token);
  const leagueSbc = (await call('GET', '/sbcs?category=Ligas')).data.find((s) => s.name.includes(store.get(cardIds[0]).league));
  const res = await call('POST', `/sbcs/${leagueSbc.id}/submit`, { formation, squad: userCardIds }, u.token);
  assert.equal(res.data.evaluation.chemistry, 33);
  assert.ok(res.data.ok, JSON.stringify(res.data.requirements));
  {
    assert.ok(res.data.sbcCompleted);
    const { data: club2 } = await call('GET', '/me/club', null, u.token);
    assert.equal(club2.total, 0, 'las cartas se consumen');
    assert.equal((await call('POST', `/sbcs/${leagueSbc.id}/submit`, { formation, squad: userCardIds }, u.token)).status, 409);
  }
  assert.ok(Array.isArray(ok.data.requirements));
});

test('draft completo: formación → capitán → 10 picks → torneo → recompensas', async () => {
  const { data: u } = await call('POST', '/auth/register', { username: 'drafter' });
  let { data: d } = await call('POST', '/drafts', { mode: 'single' }, u.token);
  assert.equal(d.formationOptions.length, 5);
  d = (await call('POST', `/drafts/${d.id}/formation`, { formation: d.formationOptions[0] }, u.token)).data;
  assert.equal(d.captainOptions.length, 5);
  d = (await call('POST', `/drafts/${d.id}/captain`, { cardId: d.captainOptions[0].cardId }, u.token)).data;
  for (const slot of d.slots.filter((s) => !s.card)) {
    assert.ok(slot.options.length >= 1);
    const best = [...slot.options].sort((a, b) => b.rating - a.rating)[0];
    d = (await call('POST', `/drafts/${d.id}/pick`, { slot: slot.index, cardId: best.cardId }, u.token)).data;
  }
  assert.equal(d.status, 'ready');
  assert.ok(d.squad.rating >= 80);
  while (d.status === 'ready') d = (await call('POST', `/drafts/${d.id}/play`, null, u.token)).data;
  assert.equal(d.status, 'finished');
  assert.ok(d.rewards.packs.length >= 1);
  const { data: me } = await call('GET', '/me', null, u.token);
  assert.ok(me.unopenedPacks >= 3);
});
