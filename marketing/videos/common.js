// Motor común de los vídeos de Rocky: todo depende de seek(t), así cada fotograma es exacto.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const W = 1080, H = 1920;
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const prog = (t, a, b) => clamp((t - a) / (b - a));
export const eOut = x => 1 - Math.pow(1 - clamp(x), 3);
export const eIn = x => Math.pow(clamp(x), 3);
export const eInOut = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const eBack = x => { x = clamp(x); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
export const lerp = (a, b, k) => a + (b - a) * k;
export function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const GOLD = 0xF5B841, GOLD_L = 0xFFE59C, GOLD_D = 0xC98410, RED = 0xFF4A3D;

export function makeRenderer() {
  const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: false });
  r.setPixelRatio(1); r.setSize(W, H, false);
  r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
  r.domElement.id = 'gl'; document.getElementById('stage').prepend(r.domElement);
  return r;
}
export function envMap(renderer) { const pm = new THREE.PMREMGenerator(renderer); return pm.fromScene(new RoomEnvironment(), 0.04).texture; }

/* ---- la R de Rocky en 3D (mismo trazado que el logo) ---- */
const R_OUT = [['M', 31, 23], ['H', 64], ['C', 81, 23, 91, 33, 91, 48], ['C', 91, 61, 83, 69.5, 71, 71.5], ['L', 92, 97], ['H', 71.5], ['L', 53.5, 73], ['H', 47.5], ['V', 97], ['H', 31], ['Z']];
const R_HOLE = [['M', 60, 34], ['L', 74.5, 50.5], ['H', 66], ['V', 61.5], ['H', 54], ['V', 50.5], ['H', 45.5], ['Z']];
function toPath(cmds, P) { let x = 0, y = 0; const f = (a, b) => [a - 60, 60 - b]; for (const c of cmds) { const [k, ...v] = c; if (k === 'M') { [x, y] = v; P.moveTo(...f(x, y)); } else if (k === 'H') { x = v[0]; P.lineTo(...f(x, y)); } else if (k === 'V') { y = v[0]; P.lineTo(...f(x, y)); } else if (k === 'L') { [x, y] = v; P.lineTo(...f(x, y)); } else if (k === 'C') { P.bezierCurveTo(...f(v[0], v[1]), ...f(v[2], v[3]), ...f(v[4], v[5])); [x, y] = [v[4], v[5]]; } } return P; }
export function rLogo(env) {
  const shape = toPath(R_OUT, new THREE.Shape()); shape.holes.push(toPath(R_HOLE, new THREE.Path()));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 14, bevelEnabled: true, bevelThickness: 3, bevelSize: 2.2, bevelSegments: 6, curveSegments: 32 });
  geo.center();
  const mat = new THREE.MeshPhysicalMaterial({ color: GOLD, metalness: 1, roughness: .22, clearcoat: .6, clearcoatRoughness: .15, envMap: env, envMapIntensity: 1.6 });
  const m = new THREE.Mesh(geo, mat); m.scale.setScalar(.06); return m;
}
/* puntos dentro de la R (para que las partículas formen el logo) */
export function rPoints(n, seed = 7) {
  const c = document.createElement('canvas'); c.width = c.height = 240; const g = c.getContext('2d');
  const p = new Path2D(); const rr = (cmds) => { for (const [k, ...v] of cmds) { if (k === 'M') p.moveTo(v[0] * 2, v[1] * 2); else if (k === 'L') p.lineTo(v[0] * 2, v[1] * 2); else if (k === 'C') p.bezierCurveTo(...v.map(z => z * 2)); else if (k === 'Z') p.closePath(); } };
  const abs = cmds => { let x = 0, y = 0; return cmds.map(([k, ...v]) => { if (k === 'H') { x = v[0]; return ['L', x, y]; } if (k === 'V') { y = v[0]; return ['L', x, y]; } if (k === 'M' || k === 'L') { [x, y] = v; } if (k === 'C') { [x, y] = [v[4], v[5]]; } return [k, ...v]; }); };
  rr(abs(R_OUT)); rr(abs(R_HOLE)); g.fill(p, 'evenodd');
  const d = g.getImageData(0, 0, 240, 240).data; const pts = []; const R = rng(seed);
  while (pts.length < n) { const x = R() * 240, y = R() * 240; if (d[((y | 0) * 240 + (x | 0)) * 4 + 3] > 128) pts.push([(x / 2 - 60), (60 - y / 2)]); }
  return pts;
}
/* campo de partículas doradas */
export function dustField(n, spread, seed = 3) {
  const R = rng(seed); const pos = new Float32Array(n * 3); const base = [];
  for (let i = 0; i < n; i++) { const p = [(R() - .5) * spread, (R() - .5) * spread * 1.8, (R() - .5) * spread]; base.push(p); pos.set(p, i * 3); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const tex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,240,200,1)'); gr.addColorStop(.3, 'rgba(245,184,65,.7)'); gr.addColorStop(1, 'rgba(245,184,65,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const mat = new THREE.PointsMaterial({ size: .22, map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffffff });
  const pts = new THREE.Points(geo, mat); pts.userData = { base, R: rng(seed + 1), phase: base.map(() => R() * 6.28) };
  pts.drift = (t, amp = .25) => { const a = geo.attributes.position.array; base.forEach((b, i) => { const ph = pts.userData.phase[i]; a[i * 3] = b[0] + Math.sin(t * .4 + ph) * amp; a[i * 3 + 1] = b[1] + ((t * .25 + ph) % 3) * amp; a[i * 3 + 2] = b[2] + Math.cos(t * .3 + ph) * amp; }); geo.attributes.position.needsUpdate = true; };
  return pts;
}

/* ---- capa de texto (DOM): títulos y subtítulos estilo TikTok ---- */
export const $ = s => document.querySelector(s);
export const gtag = h => h.replace(/\{g\}/g, '<span class="gold">').replace(/\{\/g\}/g, '</span>');
export function el(html, cls = '') { const d = document.createElement('div'); d.className = 'ov ' + cls; d.innerHTML = gtag(html); $('#over').appendChild(d); return d; }
/* aparece/desaparece con desplazamiento; devuelve la opacidad para combinar */
export function show(node, t, a, b, { dy = 60, scale = 0, out = .25, inn = .45 } = {}) {
  const pin = eOut(prog(t, a, a + inn)), pout = b == null ? 0 : eIn(prog(t, b - out, b));
  const o = pin * (1 - pout); node.style.opacity = o;
  node.style.transform = `translate(-50%,0) translateY(${(1 - pin) * dy - pout * dy * .5}px) scale(${1 - scale + scale * eBack(prog(t, a, a + inn))})`;
  return o;
}
/* subtítulo por palabras: cada palabra entra con un pop y la que «suena» brilla en dorado; {g}palabra{/g} queda dorada siempre */
export function words(node, text, t, a, per = .16) {
  if (!node._w) { node._w = text.split(' ').map(w => { const gold = /\{g\}/.test(w); const s = document.createElement('span'); s.className = 'w' + (gold ? ' gold' : ''); s.textContent = w.replace(/\{\/?g\}/g, ''); node.appendChild(s); node.appendChild(document.createTextNode(' ')); return s; }); }
  node._w.forEach((s, i) => { const st = a + i * per; const k = prog(t, st, st + .22); s.style.opacity = k > 0 ? 1 : 0; s.style.transform = `translateY(${(1 - eBack(k)) * 30}px) scale(${.6 + .4 * eBack(k)})`; s.classList.toggle('hot', t >= st && t < st + per * 1.6 && !s.classList.contains('gold')); });
}
/* tarjeta final común */
export function endCard() {
  return el(`<div class="end-w">ROCKY</div><div class="end-s">Para ESO, Bachillerato y FP</div><div class="end-b">Comenta <b>ROCKY</b></div><div class="end-p">y te aviso cuando salga</div>`, 'end');
}
export function endCardSeek(node, t, a) {
  const k = eOut(prog(t, a, a + .6)); node.style.opacity = k;
  node.children[0].style.transform = `scale(${.7 + .3 * eBack(prog(t, a, a + .7))})`; node.children[0].style.letterSpacing = `${.3 - .22 * eOut(prog(t, a, a + 1.2))}em`;
  node.children[1].style.opacity = eOut(prog(t, a + .4, a + 1));
  const b = node.children[2]; b.style.opacity = eOut(prog(t, a + .7, a + 1.2)); const pulse = 1 + Math.max(0, Math.sin((t - a - 1.2) * 5)) * .05 * (t > a + 1.2); b.style.transform = `scale(${(.8 + .2 * eBack(prog(t, a + .7, a + 1.2))) * pulse})`;
  node.children[3].style.opacity = eOut(prog(t, a + 1.1, a + 1.6));
}
export const BASE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Figtree:wght@500;700;800;900&display=swap');
html,body{margin:0;background:#000;overflow:hidden}
#stage{position:relative;width:1080px;height:1920px;overflow:hidden;background:#000;font-family:Figtree,sans-serif;color:#fff}
#gl{position:absolute;inset:0;width:1080px;height:1920px}
#over{position:absolute;inset:0;pointer-events:none}
.ov{position:absolute;left:50%;transform:translate(-50%,0);text-align:center;width:960px;opacity:0;will-change:transform,opacity}
.big{font-family:Anton,sans-serif;text-transform:uppercase;line-height:.98;letter-spacing:.01em;text-shadow:0 6px 40px rgba(0,0,0,.65)}
.cap{font-weight:900;font-size:76px;line-height:1.08;text-shadow:0 0 2px #000,0 4px 0 #000,0 8px 30px rgba(0,0,0,.8);-webkit-text-stroke:2px rgba(0,0,0,.6)}
.cap .w{display:inline-block;transition:none}.cap .w.hot{color:#FFE59C;text-shadow:0 0 30px rgba(245,184,65,.6),0 4px 0 #000}.gold{color:#F5B841}
.end{top:640px}
.end-w{font-family:Anton,sans-serif;font-size:210px;line-height:1;background:linear-gradient(180deg,#FFE59C,#F5B841 55%,#C98410);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 10px 40px rgba(245,184,65,.35))}
.end-s{font-size:46px;font-weight:800;margin-top:18px;color:#fff}
.end-b{display:inline-block;margin-top:60px;padding:30px 64px;border-radius:999px;background:linear-gradient(180deg,#FFD978,#F5B841);color:#000;font-size:62px;font-weight:900;box-shadow:0 20px 60px rgba(245,184,65,.45)}
.end-p{margin-top:26px;font-size:40px;font-weight:700;color:#C9CBD3}
.grain{position:absolute;inset:0;opacity:.07;mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.vig{position:absolute;inset:0;background:radial-gradient(120% 80% at 50% 45%,transparent 50%,rgba(0,0,0,.75))}
`;
export function boot(css, setup) {
  const st = document.createElement('style'); st.textContent = BASE_CSS + css; document.head.appendChild(st);
  document.body.innerHTML = `<div id="stage"><div id="over"></div><div class="vig"></div><div class="grain"></div></div>`;
  window.ready = (async () => { await document.fonts.load('80px Anton'); await document.fonts.load('900 80px Figtree'); await document.fonts.ready; const api = await setup(); window.DUR = api.dur; window.CUES = api.cues || []; window.seek = t => api.seek(t); api.seek(0); return true; })();
}
