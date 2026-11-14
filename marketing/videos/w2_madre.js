// S2 · POV: tu madre pregunta si has estudiado
import { povVideo, prog, eOut } from './desk.js'; import { bubbleStack } from './povlib.js';
povVideo({ seed: 32, papers: false, css: '.hook{font-size:150px}', hook: '¿Has estudiado<br>{g}hoy?{/g}', sub: 'y tú dices que sí {g}sin pensarlo{/g}',
  mid: { label: 'minutos de estudio real hoy', value: t => String(Math.round(12 * eOut(prog(t, 3.3, 6)))) },
  panicText: 'y el examen es {g}el jueves{/g}',
  checks: ['Tus {g}horas reales{/g}', 'Tu {g}racha{/g} de días', 'Y se lo {g}enseñas{/g}'],
  clock: (t, calm) => calm > .5 ? ['2 h 10', '#F5B841'] : ['0 h 12', '#FF3B30'],
  cues: [[3.3, 'pop'], [3.9, 'pop'], [4.5, 'pop']],
  props: kit => { const st = bubbleStack(kit, [['Mamá', { sub: '¿Has estudiado hoy?' }], ['Yo', { sub: 'sí sí, un montón', bg: '#F5B841', fg: '#000' }], ['Mamá', { sub: '¿cuánto?' }]], { every: .6, gap: .62 }); return { seek: t => st(t) }; } });
