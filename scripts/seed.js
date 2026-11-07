#!/usr/bin/env node
/**
 * Uso:
 *   npm run seed                     → base de datos de demo (ficticia)
 *   npm run seed -- ruta/jugadores.csv → importa tu CSV (ver data/players.template.csv)
 */
import { openDb } from '../src/db.js';
import { seedDatabase } from '../src/seed/index.js';
import { generateDemoPlayers } from '../src/seed/demo.js';
import { loadPlayersFromCsv } from '../src/seed/csv.js';

const csvPath = process.argv[2];
const db = openDb();
let players;
if (csvPath) {
  const { players: loaded, skipped } = loadPlayersFromCsv(csvPath);
  console.log(`CSV: ${loaded.length} jugadores válidos (${skipped} filas descartadas).`);
  players = loaded;
} else {
  players = generateDemoPlayers();
  console.log(`Demo: ${players.length} jugadores ficticios generados.`);
}
const summary = seedDatabase(db, players);
console.log(`Insertados ${summary.players} jugadores y ${summary.cards} cartas.`);
console.table(summary.byVersion);
