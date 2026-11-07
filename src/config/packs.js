/**
 * Sobres. Cada slot genera `count` cartas:
 *  - versions: pesos de versión base {gold: 0.85, gold_rare: 0.15}
 *  - specialChance: probabilidad de que la carta sea una especial (por packWeight)
 *  - guaranteedSpecial / guaranteedLegend: fuerza especial o leyenda
 *  - minRating: media mínima del pool
 */
export const PACKS = {
  bronze_pack: {
    name: 'Sobre bronce', price: 400,
    slots: [{ count: 12, versions: { bronze: 0.85, bronze_rare: 0.15 } }],
  },
  silver_pack: {
    name: 'Sobre plata', price: 2500,
    slots: [{ count: 12, versions: { silver: 0.8, silver_rare: 0.2 } }],
  },
  gold_pack: {
    name: 'Sobre oro', price: 7500,
    slots: [
      { count: 11, versions: { gold: 0.85, gold_rare: 0.15 }, specialChance: 0.01 },
      { count: 1, versions: { gold_rare: 1 }, specialChance: 0.02 },
    ],
  },
  premium_gold: {
    name: 'Sobre oro premium', price: 15000,
    slots: [
      { count: 9, versions: { gold: 0.7, gold_rare: 0.3 }, specialChance: 0.02 },
      { count: 3, versions: { gold_rare: 1 }, specialChance: 0.04 },
    ],
  },
  promo_pack: {
    name: 'Sobre promo (1 especial garantizada)', price: 25000,
    slots: [
      { count: 11, versions: { gold: 0.6, gold_rare: 0.4 }, specialChance: 0.03 },
      { count: 1, guaranteedSpecial: true },
    ],
  },
  jumbo_rare: {
    name: 'Sobre jumbo raros', price: 50000,
    slots: [{ count: 24, versions: { gold_rare: 1 }, specialChance: 0.04 }],
  },
  rare_players: {
    name: 'Sobre jugadores raros 80+', price: 100000,
    slots: [{ count: 12, versions: { gold_rare: 1 }, minRating: 80, specialChance: 0.1 }],
  },
  legend_pack: {
    name: 'Sobre leyenda', price: 250000,
    slots: [
      { count: 1, guaranteedLegend: true },
      { count: 11, versions: { gold_rare: 1 }, specialChance: 0.05 },
    ],
  },
};

/** Recompensas del draft según victorias (0..4). */
export const DRAFT_REWARDS = [
  { coins: 500, packs: ['gold_pack'] },
  { coins: 2000, packs: ['premium_gold'] },
  { coins: 5000, packs: ['premium_gold', 'premium_gold'] },
  { coins: 10000, packs: ['promo_pack', 'premium_gold'] },
  { coins: 25000, packs: ['rare_players', 'promo_pack'] },
];

export const DRAFT_COST = { single: 15000, practice: 0 };
export const DRAFT_OPPONENTS = [80, 83, 86, 89];
export const STARTING_COINS = 50000;
