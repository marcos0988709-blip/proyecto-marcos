import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  nation TEXT NOT NULL,
  league TEXT NOT NULL,
  club TEXT NOT NULL,
  position TEXT NOT NULL,
  alt_positions TEXT NOT NULL DEFAULT '',
  age INTEGER,
  rating INTEGER NOT NULL,
  pac INTEGER, sho INTEGER, pas INTEGER, dri INTEGER, def INTEGER, phy INTEGER,
  is_legend INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS cards (
  id INTEGER PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  rating INTEGER NOT NULL,
  pac INTEGER, sho INTEGER, pas INTEGER, dri INTEGER, def INTEGER, phy INTEGER,
  UNIQUE (player_id, version)
);
CREATE INDEX IF NOT EXISTS idx_cards_version ON cards(version, rating);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,
  coins INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS user_cards (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id INTEGER NOT NULL REFERENCES cards(id),
  untradeable INTEGER NOT NULL DEFAULT 0,
  acquired_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_user_cards_user ON user_cards(user_id);
CREATE TABLE IF NOT EXISTS user_packs (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pack_id TEXT NOT NULL,
  untradeable INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'store',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sbc_progress (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sbc_id TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  times INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, sbc_id, challenge_id)
);
CREATE TABLE IF NOT EXISTS drafts (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  status TEXT NOT NULL,
  state TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

export function openDb(path = process.env.DB_PATH || 'data/game.db') {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON;');
  if (path !== ':memory:') db.exec('PRAGMA journal_mode = WAL;');
  db.exec(SCHEMA);
  return db;
}

/** Ejecuta fn dentro de una transacción. */
export function tx(db, fn) {
  db.exec('BEGIN');
  try {
    const out = fn();
    db.exec('COMMIT');
    return out;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
