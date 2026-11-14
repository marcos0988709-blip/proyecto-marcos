// POV 2 · 3 exámenes en una semana
import { povVideo, THREE, prog, eOut, eBack, eInOut, lerp } from './desk.js'; import { hhmm, runClock } from './povlib.js';
const clk = runClock(21, 0, 95);
povVideo({ seed: 22, hook: '3 exámenes<br>{g}en 5 días{/g}', sub: 'y no sabes {g}cuál estudiar antes{/g}',
  mid: { label: 'exámenes esta semana', value: t => String(Math.min(3, Math.max(0, Math.floor((t - 3.3) / .6) + 1))) },
  panicText: 'estudias los 3 a la vez y {g}no avanzas en ninguno{/g}',
  checks: ['Te lo {g}reparte por días{/g}', 'Lo que más cae, {g}primero{/g}', 'Si te saltas un día, {g}lo recoloca{/g}'],
  clock: (t, calm) => calm > .5 ? ['LISTO', '#F5B841'] : [hhmm(clk(t)), '#FF3B30'],
  cues: [[3.4, 'hit'], [4.0, 'hit'], [4.6, 'hit'], ...Array.from({ length: 10 }, (_, i) => [12.2 + i * .18, 'tick'])],
  props: kit => {
    const { scene, std, add } = kit; const cv = kit.canvasTex(1600, 520); const g = cv.g;
    g.fillStyle = '#16171d'; g.fillRect(0, 0, 1600, 520); g.font = '900 64px Figtree, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#C9CBD3';
    ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE'].forEach((d, i) => { g.fillText(d, 160 + i * 320, 80); g.strokeStyle = '#2a2c35'; g.lineWidth = 4; g.strokeRect(10 + i * 320, 120, 300, 390); }); cv.tex.needsUpdate = true;
    const board = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 2.1), new THREE.MeshBasicMaterial({ map: cv.tex })); board.position.set(.4, 1.65, -2.9); scene.add(board);
    const colX = i => .4 - 3.2 + .64 + i * 1.28; const red = std(0xd23a2e, .4); red.emissive = new THREE.Color(0xff2a1a); red.emissiveIntensity = .5;
    const reds = [0, 2, 4].map(i => { const b = add(new THREE.Mesh(new THREE.BoxGeometry(1.05, .9, .25), red)); b.userData.x = colX(i); return b; });
    const gold = new THREE.MeshPhysicalMaterial({ color: 0xF5B841, metalness: 1, roughness: .25, envMap: kit.env, envMapIntensity: 1.4 });
    const slots = [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1], [3, 0], [3, 1], [4, 0], [1, 2]]; const golds = slots.map(([c, r]) => { const b = add(new THREE.Mesh(new THREE.BoxGeometry(1.05, .28, .2), gold)); b.userData = { x: colX(c), y: 1.65 + .45 - r * .36 }; return b; });
    return { seek(t, s) {
      reds.forEach((b, i) => { const a = 3.4 + i * .6; const fall = eOut(prog(t, a, a + .4)); const shrink = 1 - eInOut(prog(t, 11.8, 12.4)) * .75; b.visible = t > a; b.position.set(b.userData.x + Math.sin(t * 30 + i) * .03 * s.panic, lerp(7, 1.5, fall) - (1 - shrink) * .7, -2.7); b.scale.set(1, shrink, 1); });
      golds.forEach((b, i) => { const a = 12.2 + i * .18; const k = eBack(prog(t, a, a + .3)); b.visible = t > a; b.scale.setScalar(Math.max(.001, k)); b.position.set(b.userData.x, b.userData.y, -2.65); });
    } };
  } });
