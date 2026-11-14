// Piloto B · «3 trucos para estudiar la mitad»: contenido de valor con gráficos 3D
import * as THREE from 'three';
import { boot, makeRenderer, envMap, dustField, el, show, words, endCard, endCardSeek, prog, eOut, eIn, eInOut, eBack, lerp, rng, GOLD } from './common.js';

boot(`
.hook{top:700px}.hook .cap{font-size:150px;font-family:Anton,sans-serif;font-weight:400;text-transform:uppercase;line-height:1;-webkit-text-stroke:0}
.three{top:760px;font-size:200px}
.tt{top:250px;font-size:74px;font-weight:900;line-height:1.1}
.tt .n{display:inline-block;width:96px;height:96px;line-height:96px;border-radius:50%;background:#F5B841;color:#000;font-size:60px;margin-bottom:22px}
.lab{font-size:58px;font-weight:900}
.l1{top:1450px}.l2{top:1540px;color:#F5B841}
.lg1{top:1460px;color:#8B8E99;font-size:50px}.lg2{top:1535px;color:#F5B841;font-size:50px}
.clock{top:800px;font-family:Anton,sans-serif;font-size:180px}
.save{top:330px;font-size:56px;font-weight:800;color:#C9CBD3}
.does{top:520px}.end{top:900px}
`, async () => {
  const r = makeRenderer(); const env = envMap(r);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x060608);
  const cam = new THREE.PerspectiveCamera(35, 1080 / 1920, .1, 200); cam.position.set(0, 0, 22);
  scene.add(new THREE.AmbientLight(0xffffff, .35)); const key = new THREE.DirectionalLight(0xfff0d0, 2.2); key.position.set(4, 8, 10); scene.add(key);
  const dust = dustField(500, 30, 5); scene.add(dust);
  const goldM = new THREE.MeshPhysicalMaterial({ color: GOLD, metalness: 1, roughness: .25, envMap: env, envMapIntensity: 1.4, clearcoat: .5 });
  const greyM = new THREE.MeshStandardMaterial({ color: 0x2a2b33, metalness: .3, roughness: .6, envMap: env, envMapIntensity: .5 });
  /* 1 · columnas: 10 temas, 2 dan la mayor parte de la nota */
  const g1 = new THREE.Group(); scene.add(g1); const cols = []; const R = rng(4); const hs = [1.2, 1.0, 1.5, 0.9, 1.3, 1.1, 0.8, 1.4, 1.0, 1.2];
  for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(.52, 1, .52), (i === 2 || i === 6) ? goldM : greyM); m.position.x = (i - 4.5) * .72; g1.add(m); cols.push(m); }
  g1.position.y = -2.6; g1.rotation.x = .3;
  /* 2 · curva del olvido */
  const g2 = new THREE.Group(); scene.add(g2); const NP = 240;
  const mkLine = (col, w) => { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NP * 3), 3)); const m = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: col, linewidth: w })); g2.add(m); return m; };
  const tube = (fn, col, rad) => { const pts = []; for (let i = 0; i <= NP; i++) { const x = i / NP; pts.push(new THREE.Vector3(lerp(-3.4, 3.4, x), lerp(-2.2, 2.2, fn(x)), 0)); } const c = new THREE.CatmullRomCurve3(pts); const m = new THREE.Mesh(new THREE.TubeGeometry(c, 400, rad, 10), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: .6, roughness: .4, metalness: .2 })); g2.add(m); return m; };
  const forget = x => Math.exp(-x * 4.2) * .95 + .02; // sin repasar
  const reviews = [1 / 8, 3 / 8, 7 / 8]; // días 1, 3 y 7 sobre 8
  const study = x => { let base = 1, last = 0, k = 4.2; for (const d of reviews) { if (x >= d) { base = 1; last = d; k *= .45; } } return .02 + .95 * Math.exp(-(x - last) * k) * base * (x < reviews[0] ? 1 : 1) * .98 + (x >= reviews[0] ? .0 : 0); };
  const tGrey = tube(forget, 0x6b6e78, .07), tGold = tube(study, GOLD, .1);
  const axis = new THREE.Mesh(new THREE.BoxGeometry(7, .04, .04), new THREE.MeshBasicMaterial({ color: 0x333640 })); axis.position.y = -2.3; g2.add(axis);
  const dots = reviews.map(d => { const s = new THREE.Mesh(new THREE.SphereGeometry(.2, 24, 16), goldM); s.position.set(lerp(-3.4, 3.4, d), lerp(-2.2, 2.2, 0.97), .1); g2.add(s); return s; });
  g2.position.y = -.3;
  /* 3 · temporizador de 2 minutos + ondas de voz */
  const g3 = new THREE.Group(); scene.add(g3); const ringBg = new THREE.Mesh(new THREE.TorusGeometry(2.5, .12, 16, 120), greyM); g3.add(ringBg);
  let ring = null; const bars = []; for (let i = 0; i < 15; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.24, 1, .24), goldM); b.position.set((i - 7) * .38, -4.1, 0); g3.add(b); bars.push(b); }
  /* textos */
  const hook = el('', 'hook'); const hk = document.createElement('div'); hk.className = 'cap'; hook.appendChild(hk);
  const three = el('3 trucos', 'big three');
  const t1 = el('<span class="n">1</span><br>Empieza por lo que<br>{g}más cae{/g}', 'tt'), l1 = el('El 20 % de los temas', 'lab l1'), l2 = el('da el 80 % de la nota', 'lab l2');
  const t2 = el('<span class="n">2</span><br>Repasa a los<br>{g}1, 3 y 7 días{/g}', 'tt'), lg1 = el('— sin repasar', 'lab lg1'), lg2 = el('— repasando', 'lab lg2');
  const t3 = el('<span class="n">3</span><br>Explícalo en voz alta<br>{g}2 minutos{/g}', 'tt'), clock = el('2:00', 'big clock');
  const does = el('', 'does'); const dk = document.createElement('div'); dk.className = 'cap'; does.appendChild(dk);
  const save = el('Guárdalo para tu próximo examen', 'save'); const end = endCard();
  const cues = [[.05, 'hit'], [.5, 'pop'], [2.6, 'whoosh'], [2.8, 'hit'], [3.7, 'whoosh'], [5.0, 'riser'], [6.1, 'pop'], [6.8, 'pop'], [9.1, 'whoosh'], [10.6, 'pop'], [11.6, 'pop'], [12.9, 'pop'], [14.7, 'whoosh'], [15.6, 'tick'], [16.1, 'tick'], [16.6, 'tick'], [17.1, 'tick'], [17.6, 'tick'], [19.5, 'whoosh'], [20.0, 'pop'], [20.9, 'hit'], [21.0, 'shine']];
  const seg = (t, a, b) => eOut(prog(t, a, a + .5)) * (1 - eIn(prog(t, b - .4, b)));
  return { dur: 24, cues, seek(t) {
    dust.drift(t, .3); cam.position.x = Math.sin(t * .25) * .6; cam.lookAt(0, 0, 0);
    /* hook */
    show(hook, t, 0, 2.6, { dy: 0 }); words(hk, 'Estudias el {g}doble{/g} de lo que necesitas', t, .05, .2);
    show(three, t, 2.7, 3.7, { dy: 0, scale: .4, inn: .35 });
    /* 1 */
    const s1 = seg(t, 3.7, 9.2); g1.visible = s1 > 0; g1.scale.setScalar(.85 + .15 * s1); show(t1, t, 3.7, 9.2);
    cols.forEach((m, i) => { const gold = i === 2 || i === 6; const up = eBack(prog(t, 3.9 + i * .06, 4.5 + i * .06)); const tall = gold ? lerp(1, 3.4, eInOut(prog(t, 5.0, 6.0))) : lerp(1, .8, eInOut(prog(t, 5.0, 6.0))); const h = Math.max(.01, hs[i] * up * tall); m.scale.y = h; m.position.y = h / 2; m.material.opacity = 1; });
    g1.rotation.y = Math.sin(t * .3) * .12; show(l1, t, 6.0, 9.2, { dy: 30 }); show(l2, t, 6.7, 9.2, { dy: 30 });
    /* 2 */
    const s2 = seg(t, 9.1, 14.8); g2.visible = s2 > 0; g2.scale.setScalar(.9 + .1 * s2); show(t2, t, 9.1, 14.8);
    const draw = eInOut(prog(t, 9.6, 13.4)); const n = Math.floor(draw * 400) * 6 * 10;
    tGrey.geometry.setDrawRange(0, Math.floor(draw * tGrey.geometry.index.count / 3) * 3); tGold.geometry.setDrawRange(0, Math.floor(draw * tGold.geometry.index.count / 3) * 3);
    dots.forEach((d, i) => { const k = eBack(prog(t, 9.6 + reviews[i] * 3.8, 9.9 + reviews[i] * 3.8)); d.scale.setScalar(Math.max(.001, k)); });
    show(lg1, t, 10.2, 14.8, { dy: 20 }); show(lg2, t, 10.6, 14.8, { dy: 20 });
    /* 3 */
    const s3 = seg(t, 14.7, 19.6); g3.visible = s3 > 0; g3.scale.setScalar(.9 + .1 * s3); show(t3, t, 14.7, 19.6); show(clock, t, 15.0, 19.6, { dy: 0, scale: .3 });
    const cd = prog(t, 15.3, 19.2); const secs = Math.round(120 * (1 - cd)); clock.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    if (ring) { g3.remove(ring); ring.geometry.dispose(); } ring = new THREE.Mesh(new THREE.TorusGeometry(2.5, .16, 16, 160, Math.max(.001, Math.PI * 2 * (1 - cd))), goldM); ring.rotation.z = Math.PI / 2; g3.add(ring);
    bars.forEach((b, i) => { const v = .3 + Math.abs(Math.sin(t * 9 + i * .9) * Math.sin(t * 3.1 + i * .4)) * 1.5 * prog(t, 15.2, 15.6); b.scale.y = v; b.position.y = -4.1 + v / 2; });
    g3.position.y = -.2; g3.rotation.y = Math.sin(t * .4) * .2;
    /* cierre */
    show(does, t, 19.5, 20.9, { dy: 0 }); words(dk, 'Rocky hace los {g}3{/g} por ti.', t, 19.55, .18);
    show(save, t, 20.9, null, { dy: 20 }); endCardSeek(end, t, 20.9); end.style.transform = 'translate(-50%,0)';
    r.render(scene, cam);
  } };
});
