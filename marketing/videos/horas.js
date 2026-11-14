// POV 3 · 2 horas «estudiando»
import { povVideo, THREE, prog, eOut, eInOut, eBack, lerp } from './desk.js'; import { hhmm, runClock, bubbleStack } from './povlib.js';
const clk = runClock(17, 0, 134);
povVideo({ seed: 23, papers: false, hook: '2 horas<br>{g}“estudiando”{/g}', sub: 'y el libro {g}sigue cerrado{/g}',
  mid: { label: 'de pantalla. 0 páginas.', value: t => { const m = Math.round(134 * eOut(prog(t, 3.3, 6.4))); return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`; } },
  panicText: 'el móvil {g}gana otra vez{/g}',
  checks: ['Modo {g}Zen{/g}: el móvil fuera', 'Sesiones de {g}25 minutos{/g}', 'Y ves cuánto te has {g}concentrado{/g}'],
  clock: (t, calm) => calm > .5 ? [hhmm(25 * 60 - prog(t, 12, 21) * 60).replace(/^(\d\d):(\d\d)$/, (a, h, m) => `${String(Math.floor((1500 - prog(t, 12, 21) * 60) / 60)).padStart(2, '0')}:${String(Math.floor(1500 - prog(t, 12, 21) * 60) % 60).padStart(2, '0')}`), '#F5B841'] : [hhmm(clk(t)), '#FF3B30'],
  cues: [3.3, 3.75, 4.2, 4.65, 5.1, 5.55, 6.0].map(x => [x, 'pop']).concat([[11.95, 'whoosh']]),
  props: kit => {
    const st = bubbleStack(kit, [['34 mensajes', { sub: 'grupo de clase' }], ['Nuevo vídeo', { sub: 'te puede gustar' }], ['Te han mencionado', { sub: 'hace 1 min' }], ['Tu racha se acaba', { sub: '¡entra ya!' }], ['12 me gusta', { sub: 'en tu foto' }], ['+99', { sub: 'notificaciones' }]], { gap: .6 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.75, .07, 16, 120), new THREE.MeshPhysicalMaterial({ color: 0xF5B841, metalness: 1, roughness: .25, envMap: kit.env, envMapIntensity: 1.5, emissive: 0xF5B841, emissiveIntensity: .2 })); ring.position.set(.6, 1.0, 2.0); kit.scene.add(ring);
    return { seek(t, s) { st(t);
      const flip = eInOut(prog(t, 11.9, 12.6)); kit.phone.rotation.set(0, .4, flip * Math.PI); kit.phone.position.y = .04 + Math.sin(flip * Math.PI) * .8 + flip * .04; kit.phoneScreen.color.setHex(flip > .5 ? 0x000000 : 0x9cb8ff);
      ring.visible = t > 12.3; ring.scale.setScalar(Math.max(.001, eBack(prog(t, 12.3, 12.9)))); ring.rotation.set(-.3, Math.sin(t * .6) * .3, 0); ring.lookAt(kit.cam.position); } };
  } });
