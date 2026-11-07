/**
 * Reglas para generar las cartas especiales a partir de la base de jugadores.
 * Los `count` están calibrados para ~1.500 jugadores y se escalan con el tamaño
 * real de la base de datos importada.
 *
 * select:
 *  - random       → muestra aleatoria entre los que cumplen minRating
 *  - young        → edad <= maxAge (si no hay edad, aleatorio)
 *  - veteran      → edad >= minAge
 *  - top          → los mejores por media
 *  - best_xi      → mejor 11 (4-3-3) de toda la base
 *  - best_xi_league → mejor 11 de cada liga
 */
export const PROMOS = [
  { version: 'inform', select: 'random', count: 160, minRating: 68, boost: [1, 3] },
  { version: 'motm', select: 'random', count: 40, minRating: 72, boost: [2, 3] },
  { version: 'otw', select: 'young', count: 30, minRating: 70, maxAge: 23, boost: [1, 2] },
  { version: 'record_breaker', select: 'random', count: 25, minRating: 78, boost: [3, 5] },
  { version: 'halloween', select: 'random', count: 25, minRating: 75, boost: [3, 6] },
  { version: 'winter', select: 'random', count: 25, minRating: 75, boost: [3, 5] },
  { version: 'future_stars', select: 'young', count: 25, minRating: 64, maxAge: 22, boost: [8, 12] },
  { version: 'flashback', select: 'veteran', count: 15, minRating: 76, minAge: 31, boost: [4, 6] },
  { version: 'hero', select: 'random', count: 15, minRating: 74, boost: [6, 9] },
  { version: 'tots', select: 'best_xi_league', boost: [5, 8] },
  { version: 'toty', select: 'best_xi', boost: [7, 10] },
  { version: 'sbc_special', select: 'top', count: 6, minRating: 80, boost: [3, 5] },
];

export const BEST_XI_SHAPE = ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'ST', 'RW'];
