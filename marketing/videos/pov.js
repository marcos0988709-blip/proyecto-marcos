// Piloto A · «POV: examen mañana y no has abierto el libro»: historia en un escritorio 3D de noche
import * as THREE from 'three';
import { boot, makeRenderer, envMap, dustField, rLogo, el, show, words, endCard, endCardSeek, prog, eOut, eIn, eInOut, eBack, lerp, rng, GOLD } from './common.js';

boot(`
.pov{top:250px;font-size:70px;font-weight:900;color:#FF4A3D;letter-spacing:.12em}
.exam{top:330px;font-size:190px}
.c1{top:780px}.c1 .cap,.c2 .cap{font-size:80px}
.pages{top:300px;font-size:250px;color:#fff}
.pages small{display:block;font-family:Figtree,sans-serif;font-weight:900;font-size:64px;text-transform:none;color:#C9CBD3;letter-spacing:0;margin-top:10px}
.c2{top:330px}
.with{top:250px;font-size:120px}
.chk{top:0;font-size:66px;font-weight:900;text-align:left;width:820px;line-height:1.15}
.chk i{display:inline-grid;place-items:center;width:84px;height:84px;border-radius:24px;background:#F5B841;color:#000;font-style:normal;margin-right:26px;vertical-align:middle;font-size:56px;transform:translateY(-6px)}
.ck1{top:470px}.ck2{top:600px}.ck3{top:730px}
.end{top:900px}
.dim{position:absolute;inset:0;background:radial-gradient(90% 60% at 50% 40%,rgba(0,0,0,.55),rgba(0,0,0,.85))}
`, async () => {
  const r = makeRenderer(); r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; const env = envMap(r);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x07070a); scene.fog = new THREE.Fog(0x07070a, 14, 34);
  const cam = new THREE.PerspectiveCamera(40, 1080 / 1920, .1, 100);
  const amb = new THREE.AmbientLight(0x8090c0, .18); scene.add(amb);
  const lamp = new THREE.SpotLight(0xffc27a, 160, 30, .75, .55, 1.6); lamp.position.set(-2.2, 6.2, 1.2); lamp.target.position.set(.4, 0, .3); lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024); scene.add(lamp, lamp.target);
  const screenL = new THREE.PointLight(0x7aa6ff, 6, 6); screenL.position.set(2.2, 1, 1.4); scene.add(screenL);
  const goldL = new THREE.PointLight(0xffd27a, 0, 18); goldL.position.set(0, 5, 4); scene.add(goldL);
  const std = (c, ro = .7, me = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: ro, metalness: me, envMap: env, envMapIntensity: .35 });
  /* mesa, pared y objetos */
  const desk = new THREE.Mesh(new THREE.BoxGeometry(11, .35, 6), std(0x3a2618, .55)); desk.position.y = -.2; desk.receiveShadow = true; scene.add(desk);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), std(0x14151b, .95)); wall.position.set(0, 6, -3.2); scene.add(wall);
  const shadow = o => { o.castShadow = true; o.receiveShadow = true; scene.add(o); return o; };
  const bookCols = [0x7a2b2b, 0x24456b, 0x2f5a3c, 0x6b5a24];
  bookCols.forEach((c, i) => { const b = shadow(new THREE.Mesh(new THREE.BoxGeometry(2.6 - i * .15, .36, 1.9), std(c, .8))); b.position.set(-3.1, .18 + i * .37, -1.3); b.rotation.y = (i % 2 ? .08 : -.06); });
  const nb = shadow(new THREE.Mesh(new THREE.BoxGeometry(3, .06, 2.1), std(0xf1ece0, .9))); nb.position.set(.3, .02, .6); nb.rotation.y = -.12;
  const lampBase = shadow(new THREE.Mesh(new THREE.CylinderGeometry(.5, .6, .14, 32), std(0x1b1b20, .35, .6))); lampBase.position.set(-2.6, .05, 1.0);
  const arm = shadow(new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 5.6, 12), std(0x1b1b20, .35, .6))); arm.position.set(-2.5, 2.8, 1.1); arm.rotation.z = .12;
  const shade = shadow(new THREE.Mesh(new THREE.ConeGeometry(.8, 1, 32, 1, true), std(0x1b1b20, .4, .6))); shade.position.set(-2.2, 5.8, 1.2); shade.rotation.z = -.5; shade.material.side = THREE.DoubleSide;
  /* despertador con pantalla dibujada */
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 220; const cg = cv.getContext('2d'); const ctex = new THREE.CanvasTexture(cv); ctex.colorSpace = THREE.SRGBColorSpace;
  let lastClock = ''; const drawClock = (txt, col) => { const k = txt + col; if (k === lastClock) return; lastClock = k; cg.fillStyle = '#050505'; cg.fillRect(0, 0, 512, 220); cg.font = 'bold 170px "JetBrains Mono", "Courier New", monospace'; cg.textAlign = 'center'; cg.textBaseline = 'middle'; cg.shadowColor = col; cg.shadowBlur = 30; cg.fillStyle = col; cg.fillText(txt, 256, 118); ctex.needsUpdate = true; };
  const clock = shadow(new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.1, .9), [std(0x111114, .4), std(0x111114, .4), std(0x111114, .4), std(0x111114, .4), new THREE.MeshBasicMaterial({ map: ctex }), std(0x111114, .4)])); clock.position.set(2.8, .55, -.9); clock.rotation.y = -.35;
  const clockL = new THREE.PointLight(0xff3b30, 3, 4); clockL.position.set(2.5, .8, .2); scene.add(clockL);
  /* móvil boca arriba con notificaciones */
  const phone = shadow(new THREE.Mesh(new THREE.BoxGeometry(1.0, .07, 2.0), [std(0x0c0c0f, .3, .6), std(0x0c0c0f), new THREE.MeshBasicMaterial({ color: 0x9cb8ff }), std(0x0c0c0f), std(0x0c0c0f), std(0x0c0c0f)])); phone.position.set(2.3, .04, 1.6); phone.rotation.y = .4;
  /* hojas del temario */
  const R = rng(17); const papers = []; const pm = std(0xf4f1e8, .95); pm.side = THREE.DoubleSide;
  for (let i = 0; i < 32; i++) { const p = shadow(new THREE.Mesh(new THREE.PlaneGeometry(.85, 1.2), pm)); p.userData = { a: R() * 6.28, r: 1.6 + R() * 2.6, h: .6 + R() * 3.2, sp: .5 + R(), rx: R() * 6, rz: R() * 6, d: R() * 1.5 }; papers.push(p); }
  const goldPM = new THREE.MeshPhysicalMaterial({ color: 0xffe9b0, roughness: .5, metalness: .1, emissive: 0xf5b841, emissiveIntensity: 0, side: THREE.DoubleSide });
  const dust = dustField(380, 20, 31); dust.material.opacity = 0; scene.add(dust);
  const logo = rLogo(env); logo.scale.setScalar(.022); logo.position.set(0, 3.4, 1.5); logo.visible = false; scene.add(logo);
  /* textos */
  const pov = el('POV', 'pov'), exam = el('Examen<br>{g}mañana{/g}', 'big exam');
  const c1 = el('', 'c1'); const c1w = document.createElement('div'); c1w.className = 'cap'; c1.appendChild(c1w);
  const pages = el('<span id="pn">0</span><small>páginas sin abrir</small>', 'big pages');
  const c2 = el('', 'c2'); const c2w = document.createElement('div'); c2w.className = 'cap'; c2.appendChild(c2w);
  const withR = el('Con {g}Rocky{/g}', 'big with');
  const ck = [['Qué estudiar {g}primero{/g}', 'ck1'], ['Cuánto rato {g}cada tema{/g}', 'ck2'], ['Si te atascas, {g}te lo explica{/g}', 'ck3']].map(([t, c]) => el(`<i>✓</i>${t}`, 'chk ' + c));
  const end = endCard(); const dim = document.createElement('div'); dim.className = 'dim'; document.getElementById('over').prepend(dim);
  const cues = [[.05, 'hit'], [.6, 'pop'], [1.4, 'pop'], [3.0, 'whoosh'], ...Array.from({ length: 9 }, (_, i) => [3.2 + i * .5, 'tick']), [7.3, 'whoosh'], [7.6, 'hit'], [10.7, 'riser'], [11.9, 'hit'], [12.0, 'shine'], [12.9, 'pop'], [13.7, 'pop'], [14.5, 'pop'], [16.9, 'whoosh'], [17.3, 'pop']];
  return { dur: 21.5, cues, seek(t) {
    /* cámara: empieza encima del despertador, se aleja, tiembla en el agobio y se calma con Rocky */
    const back = eInOut(prog(t, 0, 3.2)); const shake = Math.exp(-Math.pow((t - 9) / 1.6, 2)) * .08;
    const calm = eInOut(prog(t, 11.5, 13.5)); const endUp = eInOut(prog(t, 16.8, 18));
    cam.position.set(lerp(2.6, .6, back) + Math.sin(t * 23) * shake, lerp(2.4, 7.2, back) - calm * .8 + endUp * 1.2, lerp(3.2, 10.5, back) - calm * 1.2 + Math.cos(t * 19) * shake);
    cam.lookAt(lerp(2.7, .2, back), lerp(.6, .6, back) + endUp * 2.2, lerp(-.8, 0, back));
    /* luces: noche azul → agobio rojo parpadeante → calma dorada */
    const panic = prog(t, 7.3, 8) * (1 - prog(t, 11.4, 12.2)); const flick = panic * (Math.sin(t * 31) * Math.sin(t * 13) > .55 ? .35 : 1);
    lamp.intensity = lerp(160, 70, panic) * (panic ? flick : 1) + 120 * calm; lamp.color.setHex(calm > .5 ? 0xffd27a : 0xffc27a);
    clockL.intensity = 3 + panic * 8; screenL.intensity = 6 * (1 - calm); goldL.intensity = calm * 60 + Math.exp(-Math.pow((t - 12) * 2.5, 2)) * 220;
    scene.background.setRGB(lerp(.027, .09, panic * .6), .027, .039);
    /* hora del despertador */
    const run = prog(t, 3.0, 11.0); const mins = Math.floor(23 * 60 + 47 + run * 85) % (24 * 60); const hhmm = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
    drawClock(calm > .5 ? 'LISTO' : hhmm, calm > .5 ? '#F5B841' : '#FF3B30');
    /* hojas: quietas → vuelan en remolino → se ordenan en un montón dorado */
    papers.forEach((p, i) => { const u = p.userData; const fly = eOut(prog(t, 3.1 + u.d, 4.6 + u.d)) * (1 - calm); const tidy = calm;
      const ang = u.a + t * u.sp * (1 + panic * 1.5); const fx = Math.cos(ang) * u.r, fz = Math.sin(ang) * u.r * .6, fy = .3 + u.h * (.6 + .4 * Math.sin(t * .7 + i)) + panic * 1.2;
      const sx = .3 + (i % 3) * .02, sy = .1 + i * .012, sz = .6;
      p.position.set(lerp(lerp(sx, fx, fly), 0, tidy * 0) * (1 - tidy) + tidy * (.3 + Math.sin(i) * .03), lerp(sy, fy, fly) * (1 - tidy) + tidy * (.12 + i * .014), lerp(sz, fz, fly) * (1 - tidy) + tidy * .6);
      p.rotation.set(-Math.PI / 2 * (1 - fly) + fly * (u.rx + t * u.sp * 2), fly * (t * u.sp), fly * (u.rz + t * u.sp * 1.4) - .12 * (1 - fly));
      p.material = calm > .5 ? goldPM : pm; p.visible = t > 3.05 || i < 10; });
    goldPM.emissiveIntensity = calm * .25;
    dust.material.opacity = calm; dust.drift(t, .3);
    logo.visible = false; logo.scale.setScalar(.022 * eBack(prog(t, 16.9, 17.6))); logo.rotation.y = (1 - eOut(prog(t, 16.9, 17.8))) * 2 + Math.sin(t) * .15;
    /* textos */
    show(pov, t, .05, 3.0, { dy: 20 }); show(exam, t, .15, 3.0, { dy: 0, scale: .3, inn: .4 });
    show(c1, t, .9, 3.0, { dy: 0 }); words(c1w, 'y no has abierto {g}el libro{/g}', t, .95, .17);
    show(pages, t, 3.2, 7.3, { dy: 0, scale: .2 }); document.getElementById('pn').textContent = Math.round(86 * eOut(prog(t, 3.3, 5.6)));
    show(c2, t, 7.5, 11.4, { dy: 0 }); words(c2w, 'y no sabes ni por dónde {g}empezar{/g}', t, 7.55, .19);
    show(withR, t, 11.9, 16.9, { dy: 0, scale: .3 }); ck.forEach((n, i) => show(n, t, 12.9 + i * .8, 16.9, { dy: 40 }));
    dim.style.opacity = .55 * eOut(prog(t, 3.1, 3.6)) * (1 - eOut(prog(t, 11.3, 11.9))) + .5 * eOut(prog(t, 12.6, 13.2)) * (1 - prog(t, 16.6, 16.9)) + eOut(prog(t, 16.9, 17.5)) * .9; endCardSeek(end, t, 17.3); end.style.transform = 'translate(-50%,0)';
    r.render(scene, cam);
  } };
});
