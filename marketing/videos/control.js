// POV 1 · Control sorpresa mañana
import { povVideo, prog, eOut } from './desk.js'; import { hhmm, runClock, bubbleStack } from './povlib.js';
const clk = runClock(22, 10, 85);
povVideo({ seed: 21, hook: 'Control<br>{g}sorpresa{/g}', sub: 'mañana. Y no sabes {g}qué entra{/g}',
  mid: { label: 'mensajes sin leer en el grupo', value: t => Math.round(47 * eOut(prog(t, 3.3, 6.2))) },
  panicText: 'y en el grupo {g}nadie lo sabe{/g}',
  checks: ['Te dice {g}qué cae{/g}', 'Te monta {g}el plan{/g} de hoy', 'Y te pregunta {g}antes del control{/g}'],
  clock: (t, calm) => calm > .5 ? ['LISTO', '#F5B841'] : [hhmm(clk(t)), '#FF3B30'],
  cues: [3.3, 3.75, 4.2, 4.65, 5.1, 5.55, 6.0, 6.45].map(x => [x, 'pop']),
  props: kit => { const st = bubbleStack(kit, [['¿¿qué entra??'], ['ni idea'], ['¿alguien tiene apuntes?'], ['el tema 4 creo'], ['¿¿o el 5??'], ['estoy muerto'], ['¿qué página?'], ['socorro']]); return { seek: t => st(t) }; } });
