import { PACKS } from '../config/packs.js';
import { VERSIONS } from '../config/versions.js';
import { pickWeightedKey, secureRandom } from '../lib/rng.js';
import { assert } from '../lib/http.js';

const SPECIAL_WEIGHTS = Object.fromEntries(Object.entries(VERSIONS).filter(([, v]) => v.packWeight > 0).map(([k, v]) => [k, v.packWeight]));

function drawSpecial(store, rnd) {
  // Solo versiones que existen en la base de datos cargada
  const available = Object.fromEntries(Object.entries(SPECIAL_WEIGHTS).filter(([v]) => store.pool(`v:${v}`, (c) => c.version === v).cards.length));
  const version = pickWeightedKey(available, rnd);
  return version ? store.draw(store.pool(`v:${version}`, (c) => c.version === version, 0.85), rnd) : null;
}

/** Genera el contenido de un sobre. Devuelve cartas (objetos del CardStore) ordenadas de mejor a peor. */
export function rollPack(store, packId, rnd = secureRandom) {
  const pack = PACKS[packId];
  assert(pack, 404, `Sobre desconocido: ${packId}`);
  const out = [];
  for (const slot of pack.slots) {
    for (let i = 0; i < slot.count; i++) {
      let card = null;
      if (slot.guaranteedLegend) {
        card = store.draw(store.pool('v:legend', (c) => c.version === 'legend', 0.9), rnd);
      } else if (slot.guaranteedSpecial || rnd() < (slot.specialChance ?? 0)) {
        card = drawSpecial(store, rnd);
      }
      if (!card && slot.versions) {
        const version = pickWeightedKey(slot.versions, rnd);
        const min = slot.minRating ?? 0;
        card = store.draw(store.pool(`v:${version}:${min}`, (c) => c.version === version && c.rating >= min), rnd);
      }
      if (!card && slot.versions) {
        // La base no tiene cartas de esa versión (p. ej. sin bronces): usar la carta base más baja disponible
        card = store.draw(store.pool('base:any', (c) => !c.special && !c.isLegend, 0.85), rnd);
      }
      if (card) out.push(card);
    }
  }
  return out.sort((a, b) => Number(b.special) - Number(a.special) || b.rating - a.rating);
}

export function listPacks() {
  return Object.entries(PACKS).map(([id, p]) => ({
    id, name: p.name, price: p.price,
    cards: p.slots.reduce((s, x) => s + x.count, 0),
    guaranteed: p.slots.some((s) => s.guaranteedLegend) ? 'Leyenda' : p.slots.some((s) => s.guaranteedSpecial) ? 'Especial' : null,
  }));
}
