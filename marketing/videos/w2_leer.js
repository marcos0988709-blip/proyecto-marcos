// S2 · POV: lees el tema 3 veces y no se te queda nada
import { povVideo, prog, eOut } from './desk.js'; import { hhmm, runClock } from './povlib.js';
const clk = runClock(19, 0, 150);
povVideo({ seed: 34, hook: 'Lo has leído<br>{g}3 veces{/g}', sub: 'y no te acuerdas {g}de nada{/g}',
  mid: { label: 'cosas que recuerdas del tema', value: t => String(Math.max(0, 10 - Math.round(10 * eOut(prog(t, 3.3, 6.5))))) },
  panicText: 'leer {g}no es estudiar{/g}',
  checks: ['Tarjetas que {g}te preguntan{/g}', 'Tests {g}tipo examen{/g}', 'Repasas {g}antes de olvidar{/g}'],
  clock: (t, calm) => calm > .5 ? ['LISTO', '#F5B841'] : [hhmm(clk(t)), '#FF3B30'],
  cues: [[3.3, 'whoosh'], [4.4, 'whoosh'], [5.5, 'whoosh']] });
