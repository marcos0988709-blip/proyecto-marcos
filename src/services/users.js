import { randomBytes } from 'node:crypto';
import { STARTING_COINS } from '../config/packs.js';
import { HttpError, assert } from '../lib/http.js';

export function register(db, username) {
  assert(typeof username === 'string' && /^[\w.-]{3,20}$/.test(username), 400, 'username debe tener 3-20 caracteres alfanuméricos');
  const token = randomBytes(24).toString('hex');
  try {
    const r = db.prepare('INSERT INTO users (username, token, coins) VALUES (?, ?, ?)').run(username, token, STARTING_COINS);
    const id = Number(r.lastInsertRowid);
    // Regalo de bienvenida
    addPacks(db, id, ['premium_gold', 'gold_pack'], { untradeable: true, source: 'welcome' });
    return { id, username, token, coins: STARTING_COINS };
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) throw new HttpError(409, 'Ese username ya existe');
    throw e;
  }
}

export function authenticate(db, header) {
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  assert(token, 401, 'Falta cabecera Authorization: Bearer <token>');
  const user = db.prepare('SELECT id, username, coins FROM users WHERE token = ?').get(token);
  assert(user, 401, 'Token inválido');
  return user;
}

export function getCoins(db, userId) {
  return db.prepare('SELECT coins FROM users WHERE id = ?').get(userId).coins;
}

export function spendCoins(db, userId, amount) {
  const r = db.prepare('UPDATE users SET coins = coins - ? WHERE id = ? AND coins >= ?').run(amount, userId, amount);
  assert(r.changes === 1, 402, `Monedas insuficientes (necesitas ${amount})`);
}

export function addCoins(db, userId, amount) {
  db.prepare('UPDATE users SET coins = coins + ? WHERE id = ?').run(amount, userId);
}

export function addCards(db, userId, cardIds, { untradeable = false } = {}) {
  const ins = db.prepare('INSERT INTO user_cards (user_id, card_id, untradeable) VALUES (?, ?, ?)');
  return cardIds.map((cid) => Number(ins.run(userId, cid, untradeable ? 1 : 0).lastInsertRowid));
}

export function addPacks(db, userId, packIds, { untradeable = false, source = 'store' } = {}) {
  const ins = db.prepare('INSERT INTO user_packs (user_id, pack_id, untradeable, source) VALUES (?, ?, ?, ?)');
  return packIds.map((p) => Number(ins.run(userId, p, untradeable ? 1 : 0, source).lastInsertRowid));
}

/** Concede una recompensa {coins, packs, cardId} y devuelve lo concedido. */
export function grantReward(db, userId, reward, source) {
  if (!reward) return null;
  const granted = {};
  if (reward.coins) { addCoins(db, userId, reward.coins); granted.coins = reward.coins; }
  if (reward.packs?.length) granted.userPackIds = addPacks(db, userId, reward.packs, { untradeable: true, source });
  if (reward.cardId) granted.userCardIds = addCards(db, userId, [reward.cardId], { untradeable: true });
  return granted;
}

/** Obtiene cartas del club verificando propiedad. Devuelve [{userCardId, card}]. */
export function getOwnedCards(db, store, userId, userCardIds) {
  assert(Array.isArray(userCardIds), 400, 'Se esperaba un array de userCardIds');
  assert(new Set(userCardIds).size === userCardIds.length, 400, 'userCardIds repetidos');
  const q = db.prepare('SELECT id, card_id, untradeable FROM user_cards WHERE id = ? AND user_id = ?');
  return userCardIds.map((ucid) => {
    const row = q.get(Number(ucid), userId);
    assert(row, 404, `La carta ${ucid} no está en tu club`);
    return { userCardId: row.id, untradeable: Boolean(row.untradeable), card: store.get(row.card_id) };
  });
}

export function removeUserCards(db, userId, userCardIds) {
  const del = db.prepare('DELETE FROM user_cards WHERE id = ? AND user_id = ?');
  for (const id of userCardIds) del.run(Number(id), userId);
}
