// S2 · POV: domingo 23:00 y el lunes hay entrega
import { povVideo, prog } from './desk.js'; import { hhmm, runClock, bubbleStack } from './povlib.js';
const clk = runClock(23, 0, 95);
povVideo({ seed: 33, hook: 'Domingo,<br>{g}23:00{/g}', sub: 'y te acuerdas de que {g}el lunes se entrega{/g}',
  mid: { label: 'páginas de trabajo por hacer', value: t => String(Math.round(15 * prog(t, 3.3, 5.6))) },
  panicText: 'lo sabías desde {g}hace 2 semanas{/g}',
  checks: ['Apuntas {g}tus entregas{/g}', 'Te lo {g}reparte en días{/g}', 'Y te avisa {g}a tiempo{/g}'],
  clock: (t, calm) => calm > .5 ? ['LISTO', '#F5B841'] : [hhmm(clk(t)), '#FF3B30'],
  cues: Array.from({ length: 8 }, (_, i) => [3.2 + i * .5, 'tick']) });
