/**
 * Versiones de carta. Las "base" se asignan por media; las especiales se generan
 * a partir del jugador base aplicando un boost (ver src/seed/cards.js).
 *
 * - qs: multiplicador de venta rápida
 * - packWeight: probabilidad relativa de salir cuando un sobre "tira" especial (0 = no sale en sobres)
 * - era: 'fifa14' (promos clásicas de la temporada 13/14) o 'modern' (promos modernas)
 */
export const VERSIONS = {
  bronze: { label: 'Bronce', color: '#a0703c', special: false, rare: false, qs: 0.05, packWeight: 0 },
  bronze_rare: { label: 'Bronce raro', color: '#8a5a2b', special: false, rare: true, qs: 0.08, packWeight: 0 },
  silver: { label: 'Plata', color: '#a7b1ba', special: false, rare: false, qs: 0.1, packWeight: 0 },
  silver_rare: { label: 'Plata raro', color: '#8c98a3', special: false, rare: true, qs: 0.15, packWeight: 0 },
  gold: { label: 'Oro', color: '#e3c770', special: false, rare: false, qs: 0.25, packWeight: 0 },
  gold_rare: { label: 'Oro raro', color: '#d4a937', special: false, rare: true, qs: 0.5, packWeight: 0 },

  // --- Promos de la era FIFA 14 ---
  inform: { label: 'In-Form', color: '#1b1b1b', special: true, rare: true, qs: 1.2, packWeight: 60, era: 'fifa14' },
  motm: { label: 'Man of the Match', color: '#7a0f1c', special: true, rare: true, qs: 1.5, packWeight: 14, era: 'fifa14' },
  otw: { label: 'Ones to Watch', color: '#2d1457', special: true, rare: true, qs: 1.5, packWeight: 8, era: 'fifa14' },
  record_breaker: { label: 'Record Breaker', color: '#0f4c81', special: true, rare: true, qs: 2, packWeight: 6, era: 'fifa14' },
  halloween: { label: 'Halloween', color: '#e2621b', special: true, rare: true, qs: 2, packWeight: 6, era: 'fifa14' },
  winter: { label: 'Winter Special', color: '#c41e3a', special: true, rare: true, qs: 2, packWeight: 5, era: 'fifa14' },
  tots: { label: 'Team of the Season', color: '#0b3d91', special: true, rare: true, qs: 4, packWeight: 3, era: 'fifa14' },
  toty: { label: 'Team of the Year', color: '#0a1f44', special: true, rare: true, qs: 6, packWeight: 1, era: 'fifa14' },
  legend: { label: 'Legend', color: '#f4f1e6', special: true, rare: true, qs: 5, packWeight: 0, era: 'fifa14' },

  // --- Promos modernas ---
  future_stars: { label: 'Future Stars', color: '#14d2c8', special: true, rare: true, qs: 2.5, packWeight: 4, era: 'modern' },
  flashback: { label: 'Flashback', color: '#5b3a29', special: true, rare: true, qs: 2.5, packWeight: 3, era: 'modern' },
  hero: { label: 'Hero', color: '#7b2ff7', special: true, rare: true, qs: 3, packWeight: 2, era: 'modern' },
  sbc_special: { label: 'SBC Premium', color: '#0e7c3a', special: true, rare: true, qs: 1, packWeight: 0, era: 'modern' },
};

export const BASE_VERSIONS = ['bronze', 'bronze_rare', 'silver', 'silver_rare', 'gold', 'gold_rare'];

export const isSpecial = (v) => Boolean(VERSIONS[v]?.special);
export const isRareOrSpecial = (v) => Boolean(VERSIONS[v]?.rare || VERSIONS[v]?.special);

export function baseVersionFor(rating, rare) {
  const tier = rating >= 75 ? 'gold' : rating >= 65 ? 'silver' : 'bronze';
  return rare ? `${tier}_rare` : tier;
}

export function quickSellValue(version, rating) {
  const mult = VERSIONS[version]?.qs ?? 0.1;
  return Math.max(10, Math.round((mult * rating * rating) / 8 / 10) * 10);
}
