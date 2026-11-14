// S2 · POV: quedan 20 minutos y vas por la pregunta 2
import { povVideo, prog, eOut } from './desk.js'; import { bubbleStack } from './povlib.js';
const left = t => Math.max(0, 20 * 60 - prog(t, 3, 11) * 17 * 60);
const mmss = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s) % 60).padStart(2, '0')}`;
povVideo({ seed: 31, hook: 'Quedan<br>{g}20 minutos{/g}', sub: 'y vas por la {g}pregunta 2{/g}',
  mid: { label: 'preguntas sin contestar', value: t => String(8 - Math.min(1, Math.floor(prog(t, 3.3, 7) * 2))) },
  panicText: 'nunca habías hecho un examen {g}con reloj{/g}',
  checks: ['Simulacros {g}con reloj{/g}', 'Ves dónde {g}pierdes tiempo{/g}', 'Y llegas {g}entrenado{/g}'],
  clock: (t, calm) => calm > .5 ? ['LISTO', '#F5B841'] : [mmss(left(t)), '#FF3B30'],
  cues: Array.from({ length: 16 }, (_, i) => [3.2 + i * .5, 'tick']) });
