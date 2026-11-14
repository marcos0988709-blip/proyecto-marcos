// POV 4 · Un ejercicio imposible a las 23:00
import { povVideo, THREE, prog, eOut } from './desk.js'; import { hhmm, runClock, bubbleStack } from './povlib.js';
const clk = runClock(23, 2, 56);
povVideo({ seed: 24, papers: false, flashAt: 11.9, hook: 'Un ejercicio<br>{g}imposible{/g}', sub: 'a las 23:00. {g}Mañana se entrega{/g}',
  mid: { label: 'por 12 personas. 0 respuestas.', value: () => 'Visto' },
  panicText: 'lo buscas en internet y {g}lo explican peor{/g}',
  checks: ['Le haces {g}una foto{/g}', 'Te lo explica {g}paso a paso{/g}', 'Y te pone {g}otro para practicar{/g}'],
  clock: (t, calm) => calm > .5 ? ['LISTO', '#F5B841'] : [hhmm(clk(t)), '#FF3B30'],
  cues: [[3.3, 'pop'], [3.9, 'pop'], [4.5, 'tick'], [11.85, 'hit']],
  props: kit => {
    const cv = kit.canvasTex(1400, 1000); let last = '';
    const draw = solved => { if (last === String(solved)) return; last = String(solved); const g = cv.g; g.fillStyle = '#f4f1e8'; g.fillRect(0, 0, 1400, 1000); g.strokeStyle = '#c9d8ea'; g.lineWidth = 3; for (let y = 80; y < 1000; y += 80) { g.beginPath(); g.moveTo(0, y); g.lineTo(1400, y); g.stroke(); }
      g.fillStyle = '#1a2a6c'; g.font = 'italic 700 92px "Caveat", "Comic Sans MS", cursive'; g.fillText('Ej. 3:  2x² − 8x + 6 = 0', 70, 150);
      if (!solved) { g.fillStyle = '#d23a2e'; g.font = '700 150px "Caveat", cursive'; g.fillText('¿¿??', 520, 420); g.font = '700 70px "Caveat", cursive'; g.fillText('no entiendo nada', 430, 560); }
      else { g.fillStyle = '#B5730C'; g.font = '800 78px Figtree, sans-serif'; ['1) a = 2 · b = −8 · c = 6', '2) Δ = 64 − 48 = 16', '3) x = (8 ± 4) / 4', '✓ x = 3   ·   x = 1'].forEach((l, i) => g.fillText(l, 90, 320 + i * 160)); }
      cv.tex.needsUpdate = true; };
    draw(false);
    const book = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3), new THREE.MeshStandardMaterial({ map: cv.tex, roughness: .9 })); book.rotation.x = -Math.PI / 2; book.rotation.z = -.06; book.position.set(.4, .08, .9); book.receiveShadow = true; kit.scene.add(book);
    const st = bubbleStack(kit, [['¿alguien sabe el 3?', { bg: '#F5B841', fg: '#000' }], ['Visto por 12', { bg: '#2b2d36', fg: '#9a9cab' }]], { start: 3.3, every: .6, x: 1.2, y: 1.4, z: 2.4 });
    return { seek(t) { st(t); draw(t >= 11.9); } };
  } });
