import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../src/db.js';
import { seedDatabase } from '../src/seed/index.js';
import { loadPlayersFromCsv } from '../src/seed/csv.js';
import { CardStore } from '../src/cardStore.js';
import { rollPack } from '../src/config/../services/packs.js';
import { allSbcs } from '../src/services/sbc.js';

test('base real 13/14: carga, especiales y sobres sin huecos', () => {
  const { players, skipped } = loadPlayersFromCsv(new URL('../data/fifa14-players.csv', import.meta.url));
  assert.equal(skipped, 0);
  const db = openDb(':memory:');
  const summary = seedDatabase(db, players);
  assert.ok(summary.byVersion.toty === 11 && summary.byVersion.tots >= 55 && summary.byVersion.legend === 25);
  const store = new CardStore(db);
  const messi = store.cards.find((c) => c.name === 'Lionel Messi' && c.version.startsWith('gold'));
  assert.equal(messi.rating, 94);
  assert.ok(messi.stats.pac > 50, 'stats generadas');
  for (const pack of ['bronze_pack', 'silver_pack', 'gold_pack', 'legend_pack']) assert.equal(rollPack(store, pack).length, 12, pack);
  assert.ok(allSbcs(store).some((s) => s.name.includes('Premier League')));
});
