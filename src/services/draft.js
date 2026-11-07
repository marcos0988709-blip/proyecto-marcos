import { FORMATIONS } from '../config/formations.js';
import { DRAFT_COST, DRAFT_OPPONENTS, DRAFT_REWARDS } from '../config/packs.js';
import { tx } from '../db.js';
import { assert } from '../lib/http.js';
import { secureRandom, shuffle, randInt } from '../lib/rng.js';
import { publicCard } from '../cardStore.js';
import { evaluateSquad } from './squad.js';
import { spendCoins, grantReward } from './users.js';

/*
 * Flujo de draft:
 *  1. POST /drafts {mode}            → 5 formaciones a elegir
 *  2. POST /drafts/:id/formation     → 5 capitanes (cartas 84+ / especiales)
 *  3. POST /drafts/:id/captain       → se generan 5 opciones por cada hueco
 *  4. POST /drafts/:id/pick (x10)    → rellenar huecos
 *  5. POST /drafts/:id/play (x4)     → cuartos, semis, final... perder = fin
 *  Recompensas automáticas al terminar (según victorias).
 */

function load(db, userId, id) {
  const row = db.prepare('SELECT * FROM drafts WHERE id = ? AND user_id = ?').get(Number(id), userId);
  assert(row, 404, 'Draft no encontrado');
  return { id: row.id, mode: row.mode, status: row.status, state: JSON.parse(row.state) };
}

function save(db, d) {
  db.prepare('UPDATE drafts SET status = ?, state = ? WHERE id = ?').run(d.status, JSON.stringify(d.state), d.id);
}

function draftPoolCard(store, position, rnd) {
  const special = rnd() < 0.22;
  const key = `draft:${position}:${special}`;
  const pool = store.pool(key, (c) => c.position === position && c.version !== 'sbc_special' &&
    (special ? c.special : c.version.startsWith('gold') && c.rating >= 76), 0.93);
  return store.draw(pool, rnd) ?? store.draw(store.pool(`draft:${position}:any`, (c) => c.position === position, 0.95), rnd);
}

function distinctOptions(gen, count, excludePlayers) {
  const out = [];
  const seen = new Set(excludePlayers);
  for (let tries = 0; out.length < count && tries < 60; tries++) {
    const c = gen();
    if (c && !seen.has(c.playerId)) { seen.add(c.playerId); out.push(c.id); }
  }
  return out;
}

export function view(store, d) {
  const s = d.state;
  const cards = (s.slots ?? []).map((sl) => store.get(sl.cardId) ?? null);
  return {
    id: d.id, mode: d.mode, status: d.status, step: s.step,
    formationOptions: s.step === 'formation' ? s.formationOptions : undefined,
    formation: s.formation,
    captainOptions: s.step === 'captain' ? s.captainOptions.map((id) => publicCard(store.get(id))) : undefined,
    slots: (s.slots ?? []).map((sl, i) => ({
      index: i, position: sl.position, card: publicCard(store.get(sl.cardId)),
      options: !sl.cardId && s.step === 'picking' ? sl.options.map((id) => publicCard(store.get(id))) : undefined,
    })),
    squad: s.formation && cards.every(Boolean) ? evaluateSquad(cards, s.formation) : null,
    wins: s.wins, matches: s.matches, nextOpponentRating: d.status === 'ready' ? DRAFT_OPPONENTS[s.wins] : undefined,
    rewards: s.rewards ?? null,
  };
}

export function createDraft(db, store, userId, mode = 'single', rnd = secureRandom) {
  assert(mode in DRAFT_COST, 400, `Modo inválido. Usa: ${Object.keys(DRAFT_COST).join(', ')}`);
  return tx(db, () => {
    if (DRAFT_COST[mode]) spendCoins(db, userId, DRAFT_COST[mode]);
    const state = { step: 'formation', formationOptions: shuffle(Object.keys(FORMATIONS), rnd).slice(0, 5), wins: 0, matches: [] };
    const r = db.prepare('INSERT INTO drafts (user_id, mode, status, state) VALUES (?, ?, ?, ?)').run(userId, mode, 'building', JSON.stringify(state));
    return view(store, { id: Number(r.lastInsertRowid), mode, status: 'building', state });
  });
}

export function chooseFormation(db, store, userId, id, formation, rnd = secureRandom) {
  const d = load(db, userId, id);
  assert(d.state.step === 'formation', 409, 'La formación ya está elegida');
  assert(d.state.formationOptions.includes(formation), 400, 'Formación no ofrecida en este draft');
  const positions = new Set(FORMATIONS[formation]);
  const pool = store.pool(`captain:${formation}`, (c) => positions.has(c.position) && c.version !== 'sbc_special' && (c.special || c.rating >= 84), 0.9);
  d.state.formation = formation;
  d.state.slots = FORMATIONS[formation].map((position) => ({ position, cardId: null, options: [] }));
  d.state.captainOptions = distinctOptions(() => store.draw(pool, rnd), 5, []);
  d.state.step = 'captain';
  save(db, d);
  return view(store, d);
}

export function chooseCaptain(db, store, userId, id, cardId, rnd = secureRandom) {
  const d = load(db, userId, id);
  assert(d.state.step === 'captain', 409, 'No toca elegir capitán');
  assert(d.state.captainOptions.includes(Number(cardId)), 400, 'Capitán no ofrecido');
  const captain = store.get(cardId);
  const slot = d.state.slots.find((s) => s.position === captain.position);
  slot.cardId = captain.id;
  const taken = [captain.playerId];
  for (const s of d.state.slots) {
    if (s.cardId) continue;
    s.options = distinctOptions(() => draftPoolCard(store, s.position, rnd), 5, taken);
    taken.push(...s.options.map((o) => store.get(o).playerId));
  }
  d.state.captainId = captain.id;
  d.state.step = 'picking';
  save(db, d);
  return view(store, d);
}

export function pick(db, store, userId, id, slotIndex, cardId) {
  const d = load(db, userId, id);
  assert(d.state.step === 'picking', 409, 'No toca elegir jugadores');
  const slot = d.state.slots[Number(slotIndex)];
  assert(slot && !slot.cardId, 400, 'Hueco inválido o ya ocupado');
  assert(slot.options.includes(Number(cardId)), 400, 'Esa carta no es una opción de este hueco');
  slot.cardId = Number(cardId);
  if (d.state.slots.every((s) => s.cardId)) { d.state.step = 'tournament'; d.status = 'ready'; }
  save(db, d);
  return view(store, d);
}

function poissonGoals(lambda, rnd) {
  let k = 0, p = 1;
  const L = Math.exp(-lambda);
  do { k++; p *= rnd(); } while (p > L);
  return k - 1;
}

function finish(db, userId, d) {
  d.status = 'finished';
  d.state.step = 'finished';
  if (d.mode !== 'practice') {
    const reward = DRAFT_REWARDS[d.state.wins];
    d.state.rewards = { ...reward, granted: grantReward(db, userId, reward, `draft:${d.id}`) };
  } else d.state.rewards = { practice: true };
}

export function play(db, store, userId, id, rnd = secureRandom) {
  return tx(db, () => {
    const d = load(db, userId, id);
    assert(d.status === 'ready', 409, 'El draft no está listo para jugar');
    const cards = d.state.slots.map((s) => store.get(s.cardId));
    const squad = evaluateSquad(cards, d.state.formation);
    const opp = DRAFT_OPPONENTS[d.state.wins];
    const strength = squad.rating + (squad.chemistry - 22) * 0.25;
    const pWin = 1 / (1 + Math.exp(-(strength - opp) / 2.5));
    const won = rnd() < pWin;
    let goalsFor = poissonGoals(1.4 + (strength - opp) * 0.05, rnd);
    let goalsAgainst = poissonGoals(1.2 - (strength - opp) * 0.05, rnd);
    let penalties = null;
    if (won && goalsFor <= goalsAgainst) goalsFor = goalsAgainst + (rnd() < 0.3 ? 0 : 1);
    if (!won && goalsAgainst <= goalsFor) goalsAgainst = goalsFor + (rnd() < 0.3 ? 0 : 1);
    if (goalsFor === goalsAgainst) penalties = won ? `${randInt(4, 5, rnd)}-${randInt(2, 3, rnd)}` : `${randInt(2, 3, rnd)}-${randInt(4, 5, rnd)}`;
    const round = ['Cuartos de final', 'Semifinal', 'Final', 'Gran final'][d.state.wins];
    d.state.matches.push({ round, opponentRating: opp, score: `${goalsFor}-${goalsAgainst}`, penalties, won, winProbability: Math.round(pWin * 100) });
    if (won) d.state.wins++;
    if (!won || d.state.wins === DRAFT_OPPONENTS.length) finish(db, userId, d);
    save(db, d);
    return view(store, d);
  });
}

/** Abandonar: cobra las recompensas según victorias actuales. */
export function forfeit(db, store, userId, id) {
  return tx(db, () => {
    const d = load(db, userId, id);
    assert(d.status !== 'finished', 409, 'El draft ya terminó');
    finish(db, userId, d);
    save(db, d);
    return view(store, d);
  });
}

export function getDraft(db, store, userId, id) {
  return view(store, load(db, userId, id));
}
