// POV 5 · Te dan la nota… y es un 9
import { povVideo, THREE, prog, eOut, eInOut, eBack, lerp, rng } from './desk.js';
povVideo({ seed: 25, papers: false, noPanic: true, hook: 'Te dan<br>{g}la nota{/g}', sub: 'del examen que {g}más miedo te daba{/g}',
  mid: { label: 'el profe reparte los exámenes', value: t => String(Math.max(1, 3 - Math.floor((t - 3.2) / 1.36))) },
  panicText: 'Un {g}9.{/g} Hace 2 semanas no sabías {g}ni por dónde empezar{/g}',
  withTitle: 'Con {g}Rocky{/g}', checks: ['Sabías {g}qué caía{/g}', 'Repasaste {g}a tiempo{/g}', 'Y nada te pilló {g}por sorpresa{/g}'],
  clock: (t, calm) => calm > .5 ? ['9,0', '#F5B841'] : ['08:15', '#FF3B30'],
  cues: [[3.3, 'tick'], [4.66, 'tick'], [6.02, 'tick'], [7.35, 'whoosh'], [7.6, 'hit'], [7.65, 'shine']],
  props: kit => {
    const cv = kit.canvasTex(900, 1200); const g = cv.g; g.fillStyle = '#f7f4ec'; g.fillRect(0, 0, 900, 1200); g.fillStyle = '#333'; g.font = '700 46px Figtree, sans-serif'; g.fillText('EXAMEN · TEMA 4', 60, 100);
    g.strokeStyle = '#d9d4c7'; g.lineWidth = 4; for (let y = 520; y < 1150; y += 70) { g.beginPath(); g.moveTo(60, y); g.lineTo(840, y); g.stroke(); }
    g.strokeStyle = '#d23a2e'; g.lineWidth = 14; g.beginPath(); g.ellipse(600, 280, 190, 170, -.1, 0, 7); g.stroke(); g.fillStyle = '#d23a2e'; g.font = '700 300px "Caveat", cursive'; g.fillText('9', 520, 380); cv.tex.needsUpdate = true;
    const back = new THREE.MeshStandardMaterial({ color: 0xf1ece0, roughness: .9 });
    const exam = new THREE.Mesh(new THREE.BoxGeometry(2.4, .02, 3.2), [back, back, new THREE.MeshStandardMaterial({ map: cv.tex, roughness: .9 }), back, back, back]); exam.castShadow = true; kit.scene.add(exam);
    const R = rng(9); const conf = []; const cm = new THREE.MeshPhysicalMaterial({ color: 0xF5B841, metalness: 1, roughness: .3, envMap: kit.env, side: THREE.DoubleSide, emissive: 0xF5B841, emissiveIntensity: .25 });
    for (let i = 0; i < 140; i++) { const c = new THREE.Mesh(new THREE.PlaneGeometry(.14, .26), cm); c.userData = { x: (R() - .5) * 9, z: (R() - .5) * 5, sp: .8 + R() * 1.2, rot: R() * 6, d: R() * .8 }; kit.scene.add(c); conf.push(c); }
    return { seek(t) {
      const flip = eInOut(prog(t, 7.3, 8.0)); exam.position.set(.4, .1 + Math.sin(flip * Math.PI) * 1.4, .7); exam.rotation.set(0, -.08, Math.PI * (1 - flip));
      conf.forEach(c => { const u = c.userData; const tt = t - 7.6 - u.d; c.visible = tt > 0; c.position.set(u.x + Math.sin(tt * 2 + u.rot) * .3, 7 - tt * u.sp * 1.6, u.z); c.rotation.set(tt * 3 + u.rot, tt * 2, tt * 4); });
    } };
  } });
