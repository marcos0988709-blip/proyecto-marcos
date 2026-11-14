// S2 · POV: el profe manda un PDF de 80 páginas
import { povVideo, prog, eOut } from './desk.js'; import { hhmm, runClock, bubbleStack } from './povlib.js';
const clk = runClock(20, 30, 70);
povVideo({ seed: 36, hook: 'Te mandan<br>{g}un PDF{/g}', sub: 'de 80 páginas {g}para el viernes{/g}',
  mid: { label: 'páginas', value: t => String(Math.round(80 * eOut(prog(t, 3.3, 5.6)))) },
  panicText: 'y no sabes ni {g}de qué va{/g}',
  checks: ['Apuntes {g}visuales{/g}', 'Un {g}mapa mental{/g}', 'Un {g}pódcast{/g} para el bus'],
  clock: (t, calm) => calm > .5 ? ['LISTO', '#F5B841'] : [hhmm(clk(t)), '#FF3B30'],
  cues: [[3.3, 'pop']],
  props: kit => { const st = bubbleStack(kit, [['Profe', { sub: 'Tema_7_completo.pdf · 80 pág.' }]], { every: .6, gap: .62 }); return { seek: t => st(t) }; } });
