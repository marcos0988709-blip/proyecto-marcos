import { STATIC_SBCS } from '../config/sbcs.js';
import { tx } from '../db.js';
import { assert } from '../lib/http.js';
import { evaluateSquad } from './squad.js';
import { getOwnedCards, removeUserCards, grantReward } from './users.js';

const mostCommon = (arr) => {
  const m = new Map();
  for (const x of arr) m.set(x, (m.get(x) ?? 0) + 1);
  return Math.max(0, ...m.values());
};

/** SBCs estáticos + dinámicos (por liga y por carta sbc_special). Se cachean por store. */
const cache = new WeakMap();
export function allSbcs(store) {
  if (cache.has(store)) return cache.get(store);
  const sbcs = [...STATIC_SBCS];

  const leagues = Map.groupBy(store.cards.filter((c) => !c.isLegend && c.version.startsWith('gold')), (c) => c.league);
  [...leagues.entries()].filter(([, cs]) => cs.length >= 30).forEach(([league]) => {
    sbcs.push({
      id: `league_${league.toLowerCase().normalize('NFD').replace(/[^\w]+/g, '_')}`,
      category: 'Ligas', name: `Maestro de liga: ${league}`, repeatable: false,
      description: `Once completo de la ${league}.`,
      challenges: [{ id: 'main', name: league, requirements: { league: { name: league, count: 11 }, minTeamRating: 75, minChemistry: 25 } }],
      reward: { packs: ['promo_pack'], coins: 5000 },
    });
  });

  store.cards.filter((c) => c.version === 'sbc_special').sort((a, b) => b.rating - a.rating).forEach((card) => {
    const r = card.rating;
    sbcs.push({
      id: `player_${card.id}`, category: 'Jugadores', name: `${card.name} (${r}) SBC Premium`, repeatable: false,
      description: `Consigue la carta SBC Premium de ${card.name}.`, rewardCardId: card.id,
      challenges: [
        { id: 'nation', name: `Orgullo: ${card.nation}`, requirements: { nation: { name: card.nation, count: 1 }, minTeamRating: Math.min(r - 8, 84), minChemistry: 18 } },
        { id: 'league', name: `Liga: ${card.league}`, requirements: { league: { name: card.league, count: 1 }, minTeamRating: Math.min(r - 6, 85) } },
        { id: 'top', name: 'Plantilla top', requirements: { minTeamRating: Math.min(r - 4, 87), minSpecial: 1 } },
      ],
      reward: { cardId: card.id },
    });
  });
  cache.set(store, sbcs);
  return sbcs;
}

export const findSbc = (store, id) => {
  const s = allSbcs(store).find((x) => x.id === id);
  assert(s, 404, `SBC no encontrado: ${id}`);
  return s;
};

/** Comprueba requisitos. Devuelve [{key, required, actual, ok}]. */
export function checkRequirements(req, cards, evaluation) {
  const results = [];
  const add = (key, required, actual, ok) => results.push({ key, required, actual, ok });
  const distinct = (f) => new Set(cards.map(f)).size;
  const n = (k, fn) => req[k] !== undefined && fn(req[k]);

  n('minTeamRating', (v) => add('minTeamRating', v, evaluation.rating, evaluation.rating >= v));
  n('minChemistry', (v) => add('minChemistry', v, evaluation.chemistry, evaluation.chemistry >= v));
  n('minSpecial', (v) => { const a = cards.filter((c) => c.special).length; add('minSpecial', v, a, a >= v); });
  n('minRare', (v) => { const a = cards.filter((c) => c.rare).length; add('minRare', v, a, a >= v); });
  n('minRatingEach', (v) => { const a = Math.min(...cards.map((c) => c.rating)); add('minRatingEach', v, a, a >= v); });
  n('maxRatingEach', (v) => { const a = Math.max(...cards.map((c) => c.rating)); add('maxRatingEach', v, a, a <= v); });
  for (const [k, f] of [['Leagues', (c) => c.league], ['Nations', (c) => c.nation], ['Clubs', (c) => c.club]]) {
    n(`minDistinct${k}`, (v) => { const a = distinct(f); add(`minDistinct${k}`, v, a, a >= v); });
    n(`maxDistinct${k}`, (v) => { const a = distinct(f); add(`maxDistinct${k}`, v, a, a <= v); });
  }
  n('sameLeague', (v) => { const a = mostCommon(cards.map((c) => c.league)); add('sameLeague', v, a, a >= v); });
  n('sameNation', (v) => { const a = mostCommon(cards.map((c) => c.nation)); add('sameNation', v, a, a >= v); });
  n('sameClub', (v) => { const a = mostCommon(cards.map((c) => c.club)); add('sameClub', v, a, a >= v); });
  n('nation', (v) => { const a = cards.filter((c) => c.nation === v.name).length; add('nation', v, a, a >= v.count); });
  n('league', (v) => { const a = cards.filter((c) => c.league === v.name).length; add('league', v, a, a >= v.count); });
  n('versionCount', (v) => { const a = cards.filter((c) => v.versions.includes(c.version)).length; add('versionCount', v, a, a >= v.count); });
  return results;
}

export function progressFor(db, userId, sbcId) {
  const rows = db.prepare('SELECT challenge_id, times FROM sbc_progress WHERE user_id = ? AND sbc_id = ?').all(userId, sbcId);
  return Object.fromEntries(rows.map((r) => [r.challenge_id, r.times]));
}

const GROUP_KEY = '__group__';

export function sbcView(sbc, progress = {}) {
  return {
    id: sbc.id, category: sbc.category, name: sbc.name, description: sbc.description,
    repeatable: sbc.repeatable, reward: sbc.reward, rewardCardId: sbc.rewardCardId,
    completedTimes: progress[GROUP_KEY] ?? 0,
    challenges: sbc.challenges.map((c) => ({ id: c.id, name: c.name, requirements: c.requirements, reward: c.reward ?? null, completed: (progress[c.id] ?? 0) > 0 })),
  };
}

/** Envía una plantilla a un reto de un SBC. Consume las cartas si cumple. */
export function submitChallenge(db, store, userId, sbcId, { challengeId, formation, squad, dryRun = false }) {
  const sbc = findSbc(store, sbcId);
  const challenge = challengeId ? sbc.challenges.find((c) => c.id === challengeId) : sbc.challenges[0];
  assert(challenge, 404, `Reto no encontrado: ${challengeId}`);
  const progress = progressFor(db, userId, sbcId);
  assert(sbc.repeatable || !(progress[GROUP_KEY] > 0), 409, 'SBC ya completado');
  assert(sbc.repeatable || !(progress[challenge.id] > 0), 409, 'Reto ya completado');

  const owned = getOwnedCards(db, store, userId, squad ?? []);
  const cards = owned.map((o) => o.card);
  assert(new Set(cards.map((c) => c.playerId)).size === cards.length, 400, 'No puedes repetir jugador en la plantilla');
  const evaluation = evaluateSquad(cards, formation);
  const results = checkRequirements(challenge.requirements, cards, evaluation);
  const ok = results.every((r) => r.ok);
  if (!ok || dryRun) return { ok, dryRun, evaluation, requirements: results };

  return tx(db, () => {
    removeUserCards(db, userId, owned.map((o) => o.userCardId));
    const up = db.prepare(`INSERT INTO sbc_progress (user_id, sbc_id, challenge_id, times) VALUES (?, ?, ?, 1)
      ON CONFLICT (user_id, sbc_id, challenge_id) DO UPDATE SET times = times + 1`);
    up.run(userId, sbcId, challenge.id);
    const rewards = { challenge: grantReward(db, userId, challenge.reward, `sbc:${sbcId}`) };
    const after = progressFor(db, userId, sbcId);
    const groupDone = sbc.challenges.every((c) => (after[c.id] ?? 0) > (progress[GROUP_KEY] ?? 0));
    if (groupDone) {
      up.run(userId, sbcId, GROUP_KEY);
      rewards.sbc = grantReward(db, userId, sbc.reward, `sbc:${sbcId}`);
    }
    return { ok: true, evaluation, requirements: results, sbcCompleted: groupDone, rewards };
  });
}
