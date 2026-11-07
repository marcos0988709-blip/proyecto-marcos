import { PROMOS, BEST_XI_SHAPE } from '../config/promos.js';
import { baseVersionFor } from '../config/versions.js';
import { randInt, shuffle, clamp } from '../lib/rng.js';

const STATS = ['pac', 'sho', 'pas', 'dri', 'def', 'phy'];

function boosted(player, version, boost, rnd) {
  const delta = boost ? randInt(boost[0], boost[1], rnd) : 0;
  // Solo el TOTY puede llegar a 99; el resto de especiales se queda en 97 como máximo
  const card = { player_id: player.id, version, rating: clamp(player.rating + delta, 1, version === 'toty' ? 99 : Math.max(97, player.rating)) };
  for (const s of STATS) card[s] = player[s] == null ? null : clamp(player[s] + (delta ? delta + randInt(0, 2, rnd) : 0), 1, 99);
  return card;
}

function bestXI(pool) {
  const sorted = [...pool].sort((a, b) => b.rating - a.rating);
  const chosen = new Set();
  const pickFor = (pos) =>
    sorted.find((p) => !chosen.has(p.id) && p.position === pos) ??
    sorted.find((p) => !chosen.has(p.id) && p.alt_positions.split('|').includes(pos)) ??
    sorted.find((p) => !chosen.has(p.id) && (pos === 'GK') === (p.position === 'GK'));
  const xi = [];
  for (const pos of BEST_XI_SHAPE) {
    const p = pickFor(pos);
    if (p) { chosen.add(p.id); xi.push(p); }
  }
  return xi;
}

/**
 * Genera todas las cartas (base + especiales) para jugadores ya insertados (con id).
 * Devuelve un array de filas para la tabla `cards`.
 */
export function buildCards(players, rnd) {
  const cards = [];
  const active = players.filter((p) => !p.is_legend);
  const scale = Math.max(1, active.length / 1500);

  for (const p of players) {
    if (p.is_legend) { cards.push(boosted(p, 'legend', null, rnd)); continue; }
    const rareChance = p.rating >= 82 ? 0.75 : p.rating >= 75 ? 0.35 : 0.2;
    cards.push(boosted(p, baseVersionFor(p.rating, rnd() < rareChance), null, rnd));
  }

  for (const promo of PROMOS) {
    let selected = [];
    const eligible = active.filter((p) => p.rating >= (promo.minRating ?? 0));
    const count = Math.round((promo.count ?? 0) * scale);
    switch (promo.select) {
      case 'random':
        selected = shuffle(eligible, rnd).slice(0, count);
        break;
      case 'young': {
        const young = eligible.filter((p) => p.age == null || p.age <= promo.maxAge);
        selected = shuffle(young, rnd).slice(0, count);
        break;
      }
      case 'veteran': {
        const vets = eligible.filter((p) => p.age != null && p.age >= promo.minAge);
        selected = shuffle(vets.length ? vets : eligible, rnd).slice(0, count);
        break;
      }
      case 'top':
        selected = [...eligible].sort((a, b) => b.rating - a.rating).slice(0, promo.count);
        break;
      case 'best_xi':
        selected = bestXI(active);
        break;
      case 'best_xi_league': {
        const byLeague = Map.groupBy(active, (p) => p.league);
        for (const [, leaguePlayers] of byLeague) if (leaguePlayers.length >= 40) selected.push(...bestXI(leaguePlayers));
        break;
      }
    }
    for (const p of selected) cards.push(boosted(p, promo.version, promo.boost, rnd));
  }
  return cards;
}
