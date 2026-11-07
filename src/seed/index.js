import { tx } from '../db.js';
import { seededRandom } from '../lib/rng.js';
import { buildCards } from './cards.js';

/** Sustituye jugadores y cartas por los dados (los usuarios se mantienen, sus cartas se borran). */
export function seedDatabase(db, players, { seed = 14 } = {}) {
  const rnd = seededRandom(seed);
  return tx(db, () => {
    db.exec('DELETE FROM user_cards; DELETE FROM drafts; DELETE FROM sbc_progress; DELETE FROM cards; DELETE FROM players;');
    const insP = db.prepare(`INSERT INTO players (name, nation, league, club, position, alt_positions, age, rating, pac, sho, pas, dri, def, phy, is_legend)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const withIds = players.map((p) => {
      const r = insP.run(p.name, p.nation, p.league, p.club, p.position, p.alt_positions ?? '', p.age ?? null, p.rating,
        p.pac ?? null, p.sho ?? null, p.pas ?? null, p.dri ?? null, p.def ?? null, p.phy ?? null, p.is_legend ? 1 : 0);
      return { ...p, alt_positions: p.alt_positions ?? '', id: Number(r.lastInsertRowid) };
    });
    const insC = db.prepare(`INSERT OR IGNORE INTO cards (player_id, version, rating, pac, sho, pas, dri, def, phy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const cards = buildCards(withIds, rnd);
    for (const c of cards) insC.run(c.player_id, c.version, c.rating, c.pac, c.sho, c.pas, c.dri, c.def, c.phy);
    const byVersion = db.prepare('SELECT version, COUNT(*) AS n FROM cards GROUP BY version ORDER BY n DESC').all();
    return { players: withIds.length, cards: cards.length, byVersion: Object.fromEntries(byVersion.map((r) => [r.version, r.n])) };
  });
}
