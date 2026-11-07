import { createServer } from 'node:http';
import { openDb } from './db.js';
import { createApp } from './app.js';
import { seedDatabase } from './seed/index.js';
import { generateDemoPlayers } from './seed/demo.js';
import { loadPlayersFromCsv } from './seed/csv.js';
import { existsSync } from 'node:fs';

const db = openDb();
if (db.prepare('SELECT COUNT(*) n FROM players').get().n === 0) {
  const csv = new URL('../data/fifa14-players.csv', import.meta.url);
  const players = existsSync(csv) ? loadPlayersFromCsv(csv).players : generateDemoPlayers();
  console.log(`Base de datos vacía → cargando ${players.length} jugadores.`);
  seedDatabase(db, players);
}
const { handler, store } = createApp(db);
const port = Number(process.env.PORT ?? 3000);
createServer(handler).listen(port, () => console.log(`API escuchando en http://localhost:${port} (${store.cards.length} cartas)`));
