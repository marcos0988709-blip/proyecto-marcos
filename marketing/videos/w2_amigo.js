// S2 · POV: tu amigo saca un 8 estudiando la mitad
import { povVideo, prog, eOut } from './desk.js'; import { bubbleStack } from './povlib.js';
povVideo({ seed: 35, papers: false, hook: 'Tu amigo<br>saca un {g}8{/g}', sub: 'estudiando {g}la mitad que tú{/g}',
  mid: { label: 'horas tuyas contra 3 suyas', value: t => String(Math.round(6 * eOut(prog(t, 3.3, 5.5)))) },
  panicText: 'él no estudia más. {g}Estudia lo que cae{/g}',
  checks: ['Primero {g}lo que cae{/g}', 'Nada de {g}lo que no entra{/g}', 'Repasas {g}lo que fallas{/g}'],
  clock: (t, calm) => calm > .5 ? ['3 h', '#F5B841'] : ['6 h', '#FF3B30'],
  cues: [[3.3, 'pop'], [3.95, 'pop']],
  props: kit => { const st = bubbleStack(kit, [['Pablo', { sub: 'he sacado un 8 jajaja' }], ['Yo', { sub: '¿¿cuánto estudiaste??', bg: '#F5B841', fg: '#000' }], ['Pablo', { sub: 'lo que más caía' }]], { every: .65, gap: .62 }); return { seek: t => st(t) }; } });
