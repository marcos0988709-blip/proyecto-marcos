// Piloto C · «Así se ve un 10»: intriga → 3 claves → partículas que forman la R → Rocky
import * as THREE from 'three';
import { boot, makeRenderer, envMap, rLogo, rPoints, dustField, el, show, words, endCard, endCardSeek, prog, eOut, eInOut, eBack, lerp, rng, GOLD } from './common.js';

boot(`
.kick{top:560px;font-size:64px;font-weight:800;color:#C9CBD3;letter-spacing:.3em}
.ten{top:660px;font-size:440px;white-space:nowrap;background:linear-gradient(180deg,#FFF1C4,#F5B841 50%,#B5730C);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 20px 80px rgba(245,184,65,.45))}
.plan{top:440px;font-size:124px}
.k{font-size:92px;font-weight:900}
.k1{top:820px}.k2{top:1000px}.k3{top:1180px}
.k .n{display:inline-block;width:92px;height:92px;line-height:92px;border-radius:50%;background:#F5B841;color:#000;font-size:56px;margin-right:24px;vertical-align:middle;transform:translateY(-8px)}
.end{top:1000px}
`, async () => {
  const r = makeRenderer(); const env = envMap(r);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x050507); scene.fog = new THREE.FogExp2(0x050507, .045);
  const cam = new THREE.PerspectiveCamera(38, 1080 / 1920, .1, 200);
  scene.add(new THREE.AmbientLight(0xffffff, .25)); const key = new THREE.PointLight(0xffd27a, 60, 40); key.position.set(4, 6, 8); scene.add(key);
  const rim = new THREE.PointLight(0xff4a3d, 25, 30); rim.position.set(-6, -3, 2); scene.add(rim);
  const dust = dustField(900, 26, 11); scene.add(dust);
  /* partículas que forman la R */
  const N = 2600, tgt = rPoints(N, 9), R = rng(21); const start = [], pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { const a = R() * 6.283, rr = 6 + R() * 10; start.push([Math.cos(a) * rr, (R() - .5) * 22, Math.sin(a) * rr - 4]); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pm = dust.material.clone(); pm.size = .13; const swarm = new THREE.Points(pg, pm); scene.add(swarm);
  const logo = rLogo(env); scene.add(logo);
  /* textos */
  const kick = el('ASÍ SE VE', 'kick'), ten = el('UN 10', 'big ten');
  const plan = el('Un 10 se {g}planea.{/g}', 'big plan');
  const k1 = el('', 'cap k k1'), k2 = el('', 'cap k k2'), k3 = el('', 'cap k k3');
  const nb = i => `<span class="n">${i}</span>`;
  const end = endCard();
  const cues = [[0.1, 'hit'], [2.6, 'whoosh'], [3.0, 'pop'], [4.3, 'pop'], [5.8, 'pop'], [7.3, 'pop'], [8.3, 'whoosh'], [8.5, 'riser'], [10.6, 'hit'], [10.7, 'shine'], [12.6, 'whoosh'], [13.4, 'pop']];
  let k1w = false;
  return { dur: 16.5, cues, seek(t) {
    /* cámara: empuje lento + órbita final */
    const orb = eInOut(prog(t, 9, 13)) * .6;
    cam.position.set(Math.sin(orb) * 13, lerp(.4, 0, eOut(prog(t, 0, 3))), Math.cos(orb) * lerp(15, 13, eOut(prog(t, 0, 16))));
    cam.lookAt(0, 0, 0);
    dust.drift(t, .35); dust.material.opacity = 1 - .6 * prog(t, 9, 11);
    /* enjambre → R */
    const gather = eInOut(prog(t, 8.4, 10.6)); const a = pg.attributes.position.array; const tw = t * 1.3;
    for (let i = 0; i < N; i++) { const s = start[i], g = tgt[i]; const swirl = (1 - gather) * 1.5;
      a[i * 3] = lerp(s[0] + Math.sin(tw + i) * swirl, g[0] * .045, gather); a[i * 3 + 1] = lerp(s[1] + Math.cos(tw * .7 + i) * swirl, g[1] * .045, gather); a[i * 3 + 2] = lerp(s[2], (Math.sin(i) * .4), gather); }
    pg.attributes.position.needsUpdate = true; pm.opacity = t < 8 ? 0 : prog(t, 8, 8.6) * (1 - prog(t, 10.6, 11.4));
    const lk = eOut(prog(t, 10.5, 11.3)); logo.visible = t > 10.4; const shrink = lerp(1, .62, eInOut(prog(t, 12.4, 13.4))); logo.scale.setScalar(.045 * (.85 + .15 * eBack(prog(t, 10.5, 11.2))) * shrink);
    logo.rotation.y = (1 - lk) * 1.4 + Math.sin(t * .8) * .18; logo.material.opacity = lk; logo.material.transparent = lk < 1;
    logo.position.y = lerp(0, 2.7, eInOut(prog(t, 12.4, 13.4)));
    key.intensity = 60 + 140 * Math.exp(-Math.pow((t - 10.7) * 3, 2));
    /* texto */
    show(kick, t, .05, 2.6, { dy: 30 }); show(ten, t, .15, 2.7, { dy: 0, scale: .35, inn: .55 });
    show(plan, t, 3.0, 8.4, { dy: 40, scale: .2 });
    if (!k1w) { k1.innerHTML = nb(1); k2.innerHTML = nb(2); k3.innerHTML = nb(3); [k1, k2, k3].forEach(n => n.appendChild(document.createElement('span'))); k1w = true; }
    [[k1, 'Saber qué {g}cae.{/g}', 4.3], [k2, 'Repasar a {g}tiempo.{/g}', 5.8], [k3, 'No atascarte {g}solo.{/g}', 7.3]].forEach(([n, txt, s]) => { show(n, t, s, 8.4, { dy: 50 }); words(n.lastChild, txt, t, s + .1, .14); });
    endCardSeek(end, t, 13.2); end.style.transform = 'translate(-50%,0)';
    r.render(scene, cam);
  } };
});
