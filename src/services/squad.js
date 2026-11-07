import { FORMATIONS } from '../config/formations.js';
import { assert } from '../lib/http.js';

const points = (count, thresholds) => thresholds.filter((t) => count >= t).length;

export const inPosition = (card, slot) => Boolean(card) && (card.position === slot || card.altPositions.includes(slot));

/** Media de equipo con la fórmula clásica (bonus por jugadores por encima de la media). */
export function teamRating(cards) {
  const ratings = cards.map((c) => c?.rating ?? 0);
  const sum = ratings.reduce((a, b) => a + b, 0);
  const avg = sum / 11;
  const excess = ratings.reduce((a, r) => a + Math.max(0, r - avg), 0);
  return Math.min(99, Math.floor((sum + excess) / 11));
}

/**
 * Química moderna (máx. 3 por jugador, 33 total).
 * Club: 2/4/7 → 1/2/3 · Liga: 3/5/8 · Nación: 2/5/8. Fuera de posición = 0.
 * Las leyendas tienen 3 de química en su posición, cuentan doble para su nación y +1 en cada liga.
 */
export function chemistry(cards, formation) {
  const slots = FORMATIONS[formation];
  const club = new Map(), league = new Map(), nation = new Map();
  const inc = (m, k, n = 1) => m.set(k, (m.get(k) ?? 0) + n);
  cards.forEach((c, i) => {
    if (!inPosition(c, slots[i])) return;
    if (c.isLegend) { inc(nation, c.nation, 2); return; }
    inc(club, c.club); inc(league, c.league); inc(nation, c.nation);
  });
  const legends = cards.filter((c, i) => c?.isLegend && inPosition(c, slots[i])).length;
  if (legends) for (const k of league.keys()) inc(league, k, legends);

  const perPlayer = cards.map((c, i) => {
    if (!inPosition(c, slots[i])) return 0;
    if (c.isLegend) return 3;
    return Math.min(3, points(club.get(c.club), [2, 4, 7]) + points(league.get(c.league), [3, 5, 8]) + points(nation.get(c.nation), [2, 5, 8]));
  });
  return { total: perPlayer.reduce((a, b) => a + b, 0), perPlayer };
}

export function evaluateSquad(cards, formation) {
  assert(FORMATIONS[formation], 400, `Formación desconocida: ${formation}`);
  assert(cards.length === 11, 400, 'La plantilla debe tener 11 jugadores (en el orden de la formación)');
  const chem = chemistry(cards, formation);
  return {
    formation,
    rating: teamRating(cards),
    chemistry: chem.total,
    slots: FORMATIONS[formation].map((pos, i) => ({
      position: pos,
      cardId: cards[i]?.id ?? null,
      inPosition: inPosition(cards[i], pos),
      chemistry: chem.perPlayer[i],
    })),
  };
}
