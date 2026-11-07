import { VERSIONS, quickSellValue } from './config/versions.js';

/**
 * Caché en memoria de todas las cartas (con datos del jugador) para abrir sobres,
 * generar drafts y validar SBCs sin consultar la BD en cada tirada.
 */
export class CardStore {
  constructor(db) {
    this.db = db;
    this.reload();
  }

  reload() {
    const rows = this.db.prepare(`
      SELECT c.id, c.player_id, c.version, c.rating, c.pac, c.sho, c.pas, c.dri, c.def, c.phy,
             p.name, p.nation, p.league, p.club, p.position, p.alt_positions, p.age, p.is_legend
      FROM cards c JOIN players p ON p.id = c.player_id`).all();
    this.cards = rows.map((r) => ({
      id: r.id,
      playerId: r.player_id,
      name: r.name,
      nation: r.nation,
      league: r.league,
      club: r.club,
      position: r.position,
      altPositions: r.alt_positions ? r.alt_positions.split('|') : [],
      age: r.age,
      version: r.version,
      rating: r.rating,
      stats: { pac: r.pac, sho: r.sho, pas: r.pas, dri: r.dri, def: r.def, phy: r.phy },
      isLegend: Boolean(r.is_legend),
      special: Boolean(VERSIONS[r.version]?.special),
      rare: Boolean(VERSIONS[r.version]?.rare),
    }));
    this.byId = new Map(this.cards.map((c) => [c.id, c]));
    this.pools = new Map();
  }

  get(id) {
    return this.byId.get(Number(id));
  }

  /**
   * Pool filtrado y ponderado (las medias altas son más raras).
   * decay: cuanto menor, más difícil sacar medias altas.
   */
  pool(key, filter, decay = 0.8) {
    if (this.pools.has(key)) return this.pools.get(key);
    const cards = this.cards.filter(filter);
    const min = Math.min(...cards.map((c) => c.rating));
    let total = 0;
    const cum = cards.map((c) => (total += Math.pow(decay, c.rating - min)));
    const p = { cards, cum, total };
    this.pools.set(key, p);
    return p;
  }

  draw(pool, rnd) {
    if (!pool.cards.length) return null;
    const r = rnd() * pool.total;
    let lo = 0, hi = pool.cum.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (pool.cum[mid] > r) hi = mid; else lo = mid + 1;
    }
    return pool.cards[lo];
  }
}

export function publicCard(card, extra = {}) {
  if (!card) return null;
  const v = VERSIONS[card.version] ?? {};
  return {
    cardId: card.id,
    playerId: card.playerId,
    name: card.name,
    rating: card.rating,
    position: card.position,
    altPositions: card.altPositions,
    nation: card.nation,
    league: card.league,
    club: card.club,
    version: card.version,
    versionLabel: v.label,
    color: v.color,
    special: card.special,
    rare: card.rare,
    stats: card.stats,
    quickSell: quickSellValue(card.version, card.rating),
    ...extra,
  };
}
