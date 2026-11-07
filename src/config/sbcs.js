/**
 * SBCs estáticos. Además, en tiempo de ejecución se generan:
 *  - "Maestro de liga" para cada liga importante
 *  - SBCs de jugador para cada carta `sbc_special`
 * (ver src/services/sbc.js)
 *
 * Requisitos soportados (todos opcionales):
 *  minTeamRating, minChemistry, minSpecial, minRare, minRatingEach, maxRatingEach,
 *  minDistinctLeagues, maxDistinctLeagues, minDistinctNations, maxDistinctNations,
 *  minDistinctClubs, maxDistinctClubs, sameLeague, sameNation, sameClub,
 *  nation {name,count}, league {name,count}, versionCount {versions[],count}
 *
 * Recompensa: { coins?, packs?: [packId], cardId? }
 */
export const STATIC_SBCS = [
  {
    id: 'hybrid_leagues', category: 'Básicos', name: 'Ligas híbridas', repeatable: true,
    description: 'Mezcla 4 ligas distintas con buena química.',
    challenges: [{ id: 'main', name: 'Ligas híbridas', requirements: { minDistinctLeagues: 4, minTeamRating: 70, minChemistry: 15 } }],
    reward: { packs: ['premium_gold'] },
  },
  {
    id: 'hybrid_nations', category: 'Básicos', name: 'Naciones híbridas', repeatable: true,
    description: 'Al menos 5 nacionalidades distintas.',
    challenges: [{ id: 'main', name: 'Naciones híbridas', requirements: { minDistinctNations: 5, minChemistry: 18 } }],
    reward: { packs: ['gold_pack'] },
  },
  {
    id: 'bronze_upgrade', category: 'Mejoras', name: 'Mejora bronce', repeatable: true,
    description: '11 cartas de bronce → sobre plata.',
    challenges: [{ id: 'main', name: 'Mejora bronce', requirements: { maxRatingEach: 64 } }],
    reward: { packs: ['silver_pack'] },
  },
  {
    id: 'silver_upgrade', category: 'Mejoras', name: 'Mejora plata', repeatable: true,
    description: '11 cartas de plata (o mejores) → sobre oro.',
    challenges: [{ id: 'main', name: 'Mejora plata', requirements: { minRatingEach: 65, maxRatingEach: 74 } }],
    reward: { packs: ['gold_pack'] },
  },
  {
    id: 'upgrade_83', category: 'Mejoras', name: 'Mejora 83+', repeatable: true,
    description: 'Plantilla 83 de media → sobre promo.',
    challenges: [{ id: 'main', name: '83 de media', requirements: { minTeamRating: 83, minRare: 6 } }],
    reward: { packs: ['promo_pack'] },
  },
  {
    id: 'upgrade_86', category: 'Mejoras', name: 'Mejora 86+', repeatable: true,
    description: 'Plantilla 86 con al menos una especial → sobre raros 80+.',
    challenges: [{ id: 'main', name: '86 de media', requirements: { minTeamRating: 86, minSpecial: 1 } }],
    reward: { packs: ['rare_players'] },
  },
  {
    id: 'season_finale', category: 'Hitos', name: 'Final de temporada', repeatable: false,
    description: 'Tres plantillas, una gran recompensa.',
    challenges: [
      { id: 'squad_1', name: 'Plantilla de liga', requirements: { sameLeague: 6, minTeamRating: 78, minChemistry: 20 }, reward: { packs: ['premium_gold'] } },
      { id: 'squad_2', name: 'Patriotas', requirements: { sameNation: 5, minTeamRating: 80 }, reward: { packs: ['premium_gold'] } },
      { id: 'squad_3', name: 'Élite', requirements: { minTeamRating: 84, minSpecial: 2 }, reward: { packs: ['promo_pack'] } },
    ],
    reward: { packs: ['legend_pack'], coins: 20000 },
  },
];
