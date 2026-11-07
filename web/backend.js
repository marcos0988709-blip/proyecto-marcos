// Ejecuta la API completa dentro del navegador (sin servidor). La partida se guarda en localStorage.
import './polyfills.js';
import initSqlJs from 'sql.js/dist/sql-wasm.js';
import wasmBinary from 'sql.js/dist/sql-wasm.wasm';
import { configure, currentDb } from './shims/sqlite.js';
import { openDb } from '../src/db.js';
import { createApp } from '../src/app.js';
import { seedDatabase } from '../src/seed/index.js';
import { parseCsv, normalizePlayer } from '../src/seed/csv.js';
import realPlayersCsv from '../data/fifa14-players.csv';

const KEY = 'fut14-cards-save-v2';

const toB64 = (bytes) => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const fromB64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

function loadSave() {
  try {
    const b64 = localStorage.getItem(KEY);
    return b64 ? fromB64(b64) : null;
  } catch { return null; }
}

export async function startBackend() {
  const SQL = await initSqlJs({ wasmBinary });
  let bytes = loadSave();
  let db;
  try {
    configure(SQL, bytes);
    db = openDb(':memory:');
    db.prepare('SELECT COUNT(*) n FROM players').get();
  } catch {
    bytes = null;
    configure(SQL, null);
    db = openDb(':memory:');
  }
  if (db.prepare('SELECT COUNT(*) n FROM players').get().n === 0) seedDatabase(db, parseCsv(realPlayersCsv).map(normalizePlayer).filter(Boolean));
  let { dispatch } = createApp(db);
  let saveOk = true;
  const persist = () => {
    try { localStorage.setItem(KEY, toB64(currentDb.export())); saveOk = true; } catch { saveOk = false; }
  };
  return {
    restored: Boolean(bytes),
    get saveOk() { return saveOk; },
    async request(method, path, body, token) {
      const res = await dispatch({ method, path, body, authorization: token ? `Bearer ${token}` : undefined });
      if (method === 'POST' && res.status === 200) persist();
      return res;
    },
    /** Solo para probar: añade monedas a la cuenta. */
    addTestCoins(userId, amount) {
      db.prepare('UPDATE users SET coins = coins + ? WHERE id = ?').run(amount, userId);
      persist();
    },
    /** Sustituye la base de jugadores por un CSV del usuario (se queda solo en este navegador). */
    importCsv(text) {
      const rows = parseCsv(text);
      const players = rows.map(normalizePlayer).filter(Boolean);
      if (players.length < 50) throw new Error(`Solo ${players.length} jugadores válidos. Revisa las columnas (name, nation, league, club, position, rating...).`);
      const summary = seedDatabase(db, players);
      ({ dispatch } = createApp(db));
      persist();
      return { ...summary, skipped: rows.length - players.length };
    },
    reset() {
      try { localStorage.removeItem(KEY); } catch { /* sin almacenamiento */ }
    },
  };
}
