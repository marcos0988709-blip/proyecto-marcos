import { randomInt } from 'node:crypto';

/** RNG determinista (para generar la base de datos de forma reproducible). */
export function seededRandom(seed = 14) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** RNG criptográfico (para sobres y partidos: no predecible por el cliente). */
export const secureRandom = () => randomInt(0, 2 ** 32) / 2 ** 32;

export const randInt = (min, max, rnd) => min + Math.floor(rnd() * (max - min + 1));

export const pickOne = (arr, rnd) => arr[Math.floor(rnd() * arr.length)];

export function shuffle(arr, rnd) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Elige una clave de un objeto {clave: peso}. */
export function pickWeightedKey(weights, rnd) {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rnd() * total;
  for (const [k, w] of entries) {
    r -= w;
    if (r < 0) return k;
  }
  return entries.at(-1)?.[0];
}

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
