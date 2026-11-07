import { createServer } from 'node:http';
import { openDb } from './db.js';
import { createApp } from './app.js';
import { seedDatabase } from './seed/index.js';
import { generateDemoPlayers } from './seed/demo.js';

const db = openDb();
if (db.prepare('SELECT COUNT(*) n FROM players').get().n === 0) {
  console.log('Base de datos vacía → cargando datos de demo (usa `npm run seed -- tu.csv` para los tuyos).');
  seedDatabase(db, generateDemoPlayers());
}
const { handler, store } = createApp(db);
const port = Number(process.env.PORT ?? 3000);
createServer(handler).listen(port, () => console.log(`API escuchando en http://localhost:${port} (${store.cards.length} cartas)`));
