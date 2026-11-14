// utilidades para los guiones POV
import { prog, eOut, eBack, lerp } from './desk.js';
export const hhmm = m => { m = Math.floor(m) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
export const runClock = (h0, m0, mins, a = 3, b = 11) => t => h0 * 60 + m0 + prog(t, a, b) * mins;
/* bocadillos que aparecen encima del móvil y se apilan mirando a la cámara */
export function bubbleStack(kit, items, { x = .9, y = .5, z = 2.2, start = 3.3, every = .45, gap = .5, hideAt = 11.6 } = {}) {
  const bs = items.map(([txt, o]) => { const b = kit.bubble(txt, o); kit.scene.add(b); return b; });
  return t => bs.forEach((b, i) => { const a = start + i * every; const k = eBack(prog(t, a, a + .35)); const out = eOut(prog(t, hideAt, hideAt + .5));
    b.visible = t > a && out < 1; const lvl = Math.min(bs.length, Math.floor((t - start) / every) + 1) - 1 - i;
    b.position.set(x + Math.sin(i * 1.7) * .3, y + Math.max(0, lvl) * gap + out * 2, z); b.scale.setScalar(Math.max(.001, k * (1 - out)));
    b.lookAt(kit.cam.position); b.material.opacity = 1 - out; });
}
