// Sustituto de node:crypto con Web Crypto.
export function randomInt(min, max) {
  const range = max - min;
  const buf = new Uint32Array(2);
  crypto.getRandomValues(buf);
  const r = (buf[0] * 2 ** 21 + (buf[1] >>> 11)) / 2 ** 53;
  return min + Math.floor(r * range);
}
export function randomBytes(n) {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return { toString: () => [...b].map((x) => x.toString(16).padStart(2, '0')).join('') };
}
