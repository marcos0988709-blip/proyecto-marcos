// Escenario común de los vídeos POV: escritorio 3D de noche + 4 fases (gancho, agobio, giro con Rocky, final).
// Cada vídeo llama a povVideo({...}) con sus textos y sus objetos propios.
import * as THREE from 'three';
import { boot, makeRenderer, envMap, dustField, el, show, words, endCard, endCardSeek, prog, eOut, eIn, eInOut, eBack, lerp, rng } from './common.js';
export { THREE, prog, eOut, eIn, eInOut, eBack, lerp, rng };

/* bocadillo de chat / notificación dibujado en un canvas */
export function bubble(text, { bg = '#2b2d36', fg = '#ffffff', w = 1.9, sub = '' } = {}) {
  const c = document.createElement('canvas'); c.width = 760; c.height = sub ? 250 : 190; const g = c.getContext('2d');
  g.fillStyle = bg; g.beginPath(); g.roundRect(6, 6, 748, c.height - 12, 60); g.fill();
  g.fillStyle = fg; g.font = '800 70px Figtree, sans-serif'; g.textBaseline = 'middle'; g.fillText(text, 54, sub ? 95 : c.height / 2 + 2);
  if (sub) { g.fillStyle = fg === '#000' ? 'rgba(0,0,0,.65)' : 'rgba(255,255,255,.55)'; g.font = '700 48px Figtree, sans-serif'; g.fillText(sub, 54, 180); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * c.height / 760), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })); return m;
}
/* textura de canvas que se puede redibujar */
export function canvasTex(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return { c, g, tex, last: '' }; }

const CSS = `
.pov{top:215px;font-size:70px;font-weight:900;color:#FF4A3D;letter-spacing:.12em}
.hook{top:320px;font-size:176px}
.c1{top:700px}.c1 .cap,.c2 .cap{font-size:80px}
.mid{top:300px;font-size:230px;color:#fff}
.mid small{display:block;font-family:Figtree,sans-serif;font-weight:900;font-size:62px;text-transform:none;color:#C9CBD3;letter-spacing:0;margin-top:10px}
.c2{top:330px}
.with{top:250px;font-size:120px}
.chk{top:0;font-size:64px;font-weight:900;text-align:left;width:840px;line-height:1.15}
.chk i{display:inline-grid;place-items:center;width:84px;height:84px;border-radius:24px;background:#F5B841;color:#000;font-style:normal;margin-right:26px;vertical-align:middle;font-size:56px;transform:translateY(-6px)}
.ck1{top:470px}.ck2{top:600px}.ck3{top:730px}
.end{top:900px}
.dim{position:absolute;inset:0;background:radial-gradient(90% 60% at 50% 40%,rgba(0,0,0,.55),rgba(0,0,0,.85))}
.flash{position:absolute;inset:0;background:#fff;opacity:0}
`;

export function povVideo(cfg) {
  boot(CSS + (cfg.css || ''), async () => {
    const r = makeRenderer(); r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; const env = envMap(r);
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x07070a); scene.fog = new THREE.Fog(0x07070a, 14, 34);
    const cam = new THREE.PerspectiveCamera(40, 1080 / 1920, .1, 100);
    scene.add(new THREE.AmbientLight(0x8090c0, .18));
    const lamp = new THREE.SpotLight(0xffc27a, 160, 30, .75, .55, 1.6); lamp.position.set(-2.2, 6.2, 1.2); lamp.target.position.set(.4, 0, .3); lamp.castShadow = true; lamp.shadow.mapSize.set(512, 512); scene.add(lamp, lamp.target);
    const screenL = new THREE.PointLight(0x7aa6ff, 6, 6); screenL.position.set(2.2, 1, 1.4); scene.add(screenL);
    const goldL = new THREE.PointLight(0xffd27a, 0, 18); goldL.position.set(0, 5, 4); scene.add(goldL);
    const std = (c, ro = .7, me = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: ro, metalness: me, envMap: env, envMapIntensity: .35 });
    const add = o => { o.castShadow = true; o.receiveShadow = true; scene.add(o); return o; };
    const desk = new THREE.Mesh(new THREE.BoxGeometry(11, .35, 6), std(cfg.deskColor || 0x3a2618, .55)); desk.position.y = -.2; desk.receiveShadow = true; scene.add(desk);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), std(cfg.wallColor || 0x14151b, .95)); wall.position.set(0, 6, -3.2); scene.add(wall);
    [0x7a2b2b, 0x24456b, 0x2f5a3c, 0x6b5a24].forEach((c, i) => { const b = add(new THREE.Mesh(new THREE.BoxGeometry(2.6 - i * .15, .36, 1.9), std(c, .8))); b.position.set(-3.1, .18 + i * .37, -1.3); b.rotation.y = (i % 2 ? .08 : -.06); });
    add(new THREE.Mesh(new THREE.CylinderGeometry(.5, .6, .14, 32), std(0x1b1b20, .35, .6))).position.set(-2.6, .05, 1.0);
    const arm = add(new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 5.6, 12), std(0x1b1b20, .35, .6))); arm.position.set(-2.5, 2.8, 1.1); arm.rotation.z = .12;
    const shade = add(new THREE.Mesh(new THREE.ConeGeometry(.8, 1, 32, 1, true), std(0x1b1b20, .4, .6))); shade.position.set(-2.2, 5.8, 1.2); shade.rotation.z = -.5; shade.material.side = THREE.DoubleSide;
    /* despertador */
    const ck = canvasTex(512, 220);
    const drawClock = (txt, col) => { const k = txt + col; if (k === ck.last) return; ck.last = k; const g = ck.g; g.fillStyle = '#050505'; g.fillRect(0, 0, 512, 220); g.font = `bold ${txt.length > 5 ? 130 : 170}px "JetBrains Mono", "Courier New", monospace`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = col; g.shadowBlur = 30; g.fillStyle = col; g.fillText(txt, 256, 118); ck.tex.needsUpdate = true; };
    const clock = add(new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.1, .9), [std(0x111114, .4), std(0x111114, .4), std(0x111114, .4), std(0x111114, .4), new THREE.MeshBasicMaterial({ map: ck.tex }), std(0x111114, .4)])); clock.position.set(2.8, .55, -.9); clock.rotation.y = -.35;
    const clockL = new THREE.PointLight(0xff3b30, 3, 4); clockL.position.set(2.5, .8, .2); scene.add(clockL);
    /* móvil */
    const phoneScreen = new THREE.MeshBasicMaterial({ color: 0x9cb8ff });
    const phone = add(new THREE.Mesh(new THREE.BoxGeometry(1.0, .07, 2.0), [std(0x0c0c0f, .3, .6), std(0x0c0c0f), phoneScreen, std(0x0c0c0f), std(0x0c0c0f), std(0x0c0c0f)])); phone.position.set(2.3, .04, 1.6); phone.rotation.y = .4;
    /* hojas */
    const R = rng(cfg.seed || 17); const papers = []; const pm = std(0xf4f1e8, .95); pm.side = THREE.DoubleSide;
    const goldPM = new THREE.MeshPhysicalMaterial({ color: 0xffe9b0, roughness: .5, metalness: .1, emissive: 0xf5b841, emissiveIntensity: 0, side: THREE.DoubleSide });
    const nPapers = cfg.papers === false ? 0 : 32;
    for (let i = 0; i < nPapers; i++) { const p = add(new THREE.Mesh(new THREE.PlaneGeometry(.85, 1.2), pm)); p.userData = { a: R() * 6.28, r: 1.6 + R() * 2.6, h: .6 + R() * 3.2, sp: .5 + R(), rx: R() * 6, rz: R() * 6, d: R() * 1.5 }; papers.push(p); }
    const dust = dustField(380, 20, 31); dust.material.opacity = 0; scene.add(dust);
    const kit = { THREE, scene, std, add, env, phone, phoneScreen, clock, papers, cam, bubble, canvasTex };
    const props = cfg.props ? await cfg.props(kit) : { seek() {} };
    /* textos */
    const pov = el('POV', 'pov'), hook = el(cfg.hook, 'big hook');
    const c1 = el('', 'c1'); const c1w = document.createElement('div'); c1w.className = 'cap'; c1.appendChild(c1w);
    const mid = el(`<span class="mn"></span><small>${cfg.mid.label}</small>`, 'big mid');
    const c2 = el('', 'c2'); const c2w = document.createElement('div'); c2w.className = 'cap'; c2.appendChild(c2w);
    const withR = el(cfg.withTitle || 'Con {g}Rocky{/g}', 'big with');
    const cks = cfg.checks.map((t, i) => el(`<i>✓</i>${t}`, 'chk ck' + (i + 1)));
    const end = endCard(); const over = document.getElementById('over');
    const dim = document.createElement('div'); dim.className = 'dim'; over.prepend(dim);
    const flash = document.createElement('div'); flash.className = 'flash'; over.prepend(flash);
    const P = cfg.noPanic ? { panicA: 99, calmA: 7.4 } : { panicA: 7.3, calmA: 11.5 };
    const cues = [[.05, 'hit'], [.6, 'pop'], [1.4, 'pop'], [3.0, 'whoosh'], ...(cfg.cues || []), ...(cfg.noPanic ? [] : [[7.3, 'whoosh'], [7.6, 'hit'], [10.7, 'riser']]), [11.9, 'hit'], [12.0, 'shine'], [12.9, 'pop'], [13.7, 'pop'], [14.5, 'pop'], [16.9, 'whoosh'], [17.3, 'pop']];
    const mn = mid.querySelector('.mn');
    return { dur: 21.5, cues, seek(t) {
      const back = eInOut(prog(t, 0, 3.2)); const shake = cfg.noPanic ? 0 : Math.exp(-Math.pow((t - 9) / 1.6, 2)) * .08;
      const calm = eInOut(prog(t, P.calmA, P.calmA + 2)); const endUp = eInOut(prog(t, 16.8, 18));
      const panic = prog(t, P.panicA, P.panicA + .7) * (1 - prog(t, 11.4, 12.2)); const flick = panic * (Math.sin(t * 31) * Math.sin(t * 13) > .55 ? .35 : 1);
      const C = cfg.camera || {}; const s0 = C.start || [2.6, 2.4, 3.2], l0 = C.look || [2.7, .6, -.8];
      cam.position.set(lerp(s0[0], .6, back) + Math.sin(t * 23) * shake, lerp(s0[1], 7.2, back) - calm * .8 + endUp * 1.2, lerp(s0[2], 10.5, back) - calm * 1.2 + Math.cos(t * 19) * shake);
      cam.lookAt(lerp(l0[0], .2, back), lerp(l0[1], .6, back) + endUp * 2.2, lerp(l0[2], 0, back));
      lamp.intensity = lerp(160, 70, panic) * (panic ? flick : 1) + 120 * calm; lamp.color.setHex(calm > .5 ? 0xffd27a : 0xffc27a);
      clockL.intensity = 3 + panic * 8; screenL.intensity = 6 * (1 - calm); goldL.intensity = calm * 60 + Math.exp(-Math.pow((t - 12) * 2.5, 2)) * 220;
      scene.background.setRGB(lerp(.027, .09, panic * .6), .027, .039);
      const [ct, cc] = cfg.clock(t, calm); drawClock(ct, cc);
      papers.forEach((p, i) => { const u = p.userData; const fly = eOut(prog(t, 3.1 + u.d, 4.6 + u.d)) * (1 - calm) * (cfg.papersFly === false ? 0 : 1); const tidy = calm;
        const ang = u.a + t * u.sp * (1 + panic * 1.5); const fx = Math.cos(ang) * u.r, fz = Math.sin(ang) * u.r * .6, fy = .3 + u.h * (.6 + .4 * Math.sin(t * .7 + i)) + panic * 1.2;
        const sx = .3 + (i % 3) * .02, sy = .1 + i * .012, sz = .6;
        p.position.set(lerp(sx, fx, fly) * (1 - tidy) + tidy * (.3 + Math.sin(i) * .03), lerp(sy, fy, fly) * (1 - tidy) + tidy * (.12 + i * .014), lerp(sz, fz, fly) * (1 - tidy) + tidy * .6);
        p.rotation.set(-Math.PI / 2 * (1 - fly) + fly * (u.rx + t * u.sp * 2), fly * (t * u.sp), fly * (u.rz + t * u.sp * 1.4) - .12 * (1 - fly));
        p.material = calm > .5 ? goldPM : pm; p.visible = t > 3.05 || i < 10; });
      goldPM.emissiveIntensity = calm * .25; dust.material.opacity = calm; dust.drift(t, .3);
      props.seek(t, { panic, calm, back });
      show(pov, t, .05, 3.0, { dy: 20 }); show(hook, t, .15, 3.0, { dy: 0, scale: .3, inn: .4 });
      show(c1, t, .9, 3.0, { dy: 0 }); words(c1w, cfg.sub, t, .95, .17);
      show(mid, t, 3.2, 7.3, { dy: 0, scale: .2 }); mn.textContent = cfg.mid.value(t);
      show(c2, t, 7.5, 11.4, { dy: 0 }); words(c2w, cfg.panicText, t, 7.55, .19);
      show(withR, t, 11.9, 16.9, { dy: 0, scale: .3 }); cks.forEach((n, i) => show(n, t, 12.9 + i * .8, 16.9, { dy: 40 }));
      dim.style.opacity = .55 * eOut(prog(t, 3.1, 3.6)) * (1 - eOut(prog(t, 11.3, 11.9))) + .5 * eOut(prog(t, 12.6, 13.2)) * (1 - prog(t, 16.6, 16.9)) + eOut(prog(t, 16.9, 17.5)) * .9;
      flash.style.opacity = cfg.flashAt ? Math.max(0, 1 - Math.abs(t - cfg.flashAt) * 4) : 0;
      endCardSeek(end, t, 17.3); end.style.transform = 'translate(-50%,0)';
      r.render(scene, cam);
    } };
  });
}
