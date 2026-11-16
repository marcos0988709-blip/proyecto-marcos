// Formato «personajes»: muñecos de dibujos animados que hablan con voz (boca sincronizada), escenas y subtítulos.
// Los datos de cada vídeo (frases, tiempos, envolvente de la voz) los genera tanda.py en talk_data/<id>.json
import { boot, el, show, words, endCard, endCardSeek, prog, eOut, eIn, eInOut, eBack, lerp, rng } from './common.js';

const ID = new URLSearchParams(location.search).get('id');

/* ---------- personajes (SVG) ---------- */
const SKIN = { fenomeno: '#B97A4E', estudiante: '#F1C7A3', narrador: '#E2B28C', profe: '#F3CFB0', madre: '#E9BC97', amigo: '#8D5A3B' };
function charSVG(kind) {
  const s = SKIN[kind] || '#E8B892';
  const hair = {
    fenomeno: `<path d="M-118 -70 Q-120 -190 0 -205 Q120 -190 118 -70 Q90 -150 0 -150 Q-90 -150 -118 -70Z" fill="#1d1208"/><path d="M-40 -200 Q0 -260 50 -205 Q20 -225 -10 -198Z" fill="#F5B841"/><rect x="-122" y="-108" width="244" height="22" rx="10" fill="#FF4A3D"/>`,
    estudiante: `<path d="M-125 -60 Q-140 -200 -10 -205 Q130 -205 125 -60 Q120 -120 60 -150 Q70 -120 20 -140 Q30 -110 -30 -140 Q-40 -110 -80 -135 Q-110 -110 -125 -60Z" fill="#5a3a22"/>`,
    narrador: `<path d="M-118 -60 Q-118 -180 0 -185 Q118 -180 118 -60 Q100 -130 0 -132 Q-100 -130 -118 -60Z" fill="#9a9aa2"/><path d="M-60 62 Q0 40 60 62 Q30 78 0 72 Q-30 78 -60 62Z" fill="#6d6d74"/>`,
    profe: `<circle cx="0" cy="-200" r="48" fill="#3b2a20"/><path d="M-125 -40 Q-135 -195 0 -190 Q135 -195 125 -40 Q110 -140 0 -145 Q-110 -140 -125 -40Z" fill="#3b2a20"/>`,
    madre: `<path d="M-130 40 Q-150 -200 0 -200 Q150 -200 130 40 Q120 -110 60 -140 Q0 -120 -60 -140 Q-120 -110 -130 40Z" fill="#7a3b22"/>`,
    amigo: `<path d="M-115 -80 Q-110 -195 0 -198 Q110 -195 115 -80 Q95 -150 0 -150 Q-95 -150 -115 -80Z" fill="#111"/>`,
  }[kind] || '';
  const glasses = kind === 'profe' ? `<g fill="none" stroke="#222" stroke-width="7"><circle cx="-45" cy="-40" r="30"/><circle cx="45" cy="-40" r="30"/><path d="M-15 -42 H15"/></g>` : '';
  const headset = kind === 'narrador' ? `<path d="M-118 -60 Q-125 -200 0 -205 Q125 -200 118 -60" fill="none" stroke="#222" stroke-width="14"/><rect x="-134" y="-80" width="30" height="60" rx="12" fill="#222"/><path d="M-118 -30 Q-110 40 -40 50" fill="none" stroke="#222" stroke-width="8"/><circle cx="-36" cy="50" r="12" fill="#333"/>` : '';
  const body = {
    fenomeno: `<path d="M-200 520 Q-200 300 -120 260 L120 260 Q200 300 200 520Z" fill="#F5B841"/><path d="M-60 260 L0 320 L60 260" fill="none" stroke="#1d1208" stroke-width="12"/><text x="0" y="460" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="150" fill="#111">10</text>`,
    estudiante: `<path d="M-200 520 Q-200 300 -120 260 L120 260 Q200 300 200 520Z" fill="#26324a"/><path d="M-90 262 Q0 330 90 262" fill="none" stroke="#1a2236" stroke-width="18"/><path d="M-130 250 Q-140 190 -100 175 M130 250 Q140 190 100 175" stroke="#222" stroke-width="16" fill="none"/>`,
    narrador: `<path d="M-200 520 Q-200 300 -120 260 L120 260 Q200 300 200 520Z" fill="#2b2e3a"/><path d="M-40 262 L0 360 L40 262Z" fill="#f4f2ec"/><path d="M-14 280 L0 380 L14 280Z" fill="#FF4A3D"/>`,
    profe: `<path d="M-200 520 Q-200 300 -120 260 L120 260 Q200 300 200 520Z" fill="#6b4c8a"/><path d="M-60 262 Q0 300 60 262" fill="none" stroke="#f4f2ec" stroke-width="10"/>`,
    madre: `<path d="M-200 520 Q-200 300 -120 260 L120 260 Q200 300 200 520Z" fill="#2f7a63"/>`,
    amigo: `<path d="M-200 520 Q-200 300 -120 260 L120 260 Q200 300 200 520Z" fill="#c23b3b"/><text x="0" y="440" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="110" fill="#fff">7</text>`,
  }[kind] || '';
  return `<svg viewBox="-260 -300 520 820" class="ch-svg">
    <g class="body">${body}<rect x="-45" y="190" width="90" height="90" rx="20" fill="${s}"/></g>
    <g class="head">
      ${kind === 'madre' ? hair : ''}
      <ellipse cx="0" cy="0" rx="130" ry="150" fill="${s}"/>
      <ellipse cx="-128" cy="10" rx="22" ry="34" fill="${s}"/><ellipse cx="128" cy="10" rx="22" ry="34" fill="${s}"/>
      ${kind === 'madre' ? '' : hair}
      <g class="brows"><path class="bl" d="M-78 -82 Q-45 -98 -15 -84" stroke="#1d1208" stroke-width="12" fill="none" stroke-linecap="round"/><path class="br" d="M15 -84 Q45 -98 78 -82" stroke="#1d1208" stroke-width="12" fill="none" stroke-linecap="round"/></g>
      <g class="eyes"><ellipse class="el" cx="-45" cy="-38" rx="22" ry="26" fill="#fff"/><ellipse class="er" cx="45" cy="-38" rx="22" ry="26" fill="#fff"/>
        <circle class="pl" cx="-42" cy="-34" r="11" fill="#151515"/><circle class="pr" cx="48" cy="-34" r="11" fill="#151515"/></g>
      ${glasses}
      <path d="M-8 0 Q0 30 10 28" stroke="rgba(0,0,0,.25)" stroke-width="7" fill="none" stroke-linecap="round"/>
      <ellipse class="mouth" cx="0" cy="68" rx="34" ry="6" fill="#3a1010"/>
      <ellipse class="tongue" cx="0" cy="78" rx="18" ry="0" fill="#e0575b"/>
      <g class="tear" opacity="0"><path d="M-60 -10 Q-70 20 -60 35 Q-50 20 -60 -10Z" fill="#6fc3ff"/></g>
      ${headset}
    </g>
    <g class="arm-r"><path d="M150 300 Q260 300 280 180" stroke="${s}" stroke-width="44" fill="none" stroke-linecap="round"/></g>
    <g class="phone" opacity="0"><rect x="230" y="40" width="110" height="190" rx="22" fill="#0b0b0e" stroke="#F5B841" stroke-width="6"/>
      <path transform="translate(285 135) scale(.75)" fill="#F5B841" fill-rule="evenodd" d="M-29 -37 H4 C21 -37 31 -27 31 -12 C31 1 23 9.5 11 11.5 L32 37 H11.5 L-6.5 13 H-12.5 V37 H-29 Z M0 -26 L14.5 -9.5 H6 V1.5 H-6 V-9.5 H-14.5 Z"/></g>
  </svg>`;
}

/* ---------- escenarios ---------- */
const SCENES = {
  vestuario: `<div class="bg" style="background:linear-gradient(#2a2f3a,#14161c)"><div class="lockers">${Array.from({ length: 7 }, (_, i) => `<i style="left:${i * 160 - 40}px"></i>`).join('')}</div><div class="bench"></div></div>`,
  campo: `<div class="bg" style="background:linear-gradient(#0b1a2b 0%,#123a5c 35%,#1d6b2f 36%,#16521f 100%)"><div class="lights"></div><div class="lines"></div><div class="crowd"></div></div>`,
  cuarto: `<div class="bg" style="background:linear-gradient(#232634,#14151c)"><div class="window"></div><div class="desk"></div><div class="lamp"></div></div>`,
  aula: `<div class="bg" style="background:linear-gradient(#e8e2d4,#cfc6b4)"><div class="board"><span>EXAMEN</span></div><div class="desk light"></div></div>`,
  cabina: `<div class="bg" style="background:linear-gradient(#0e1018,#05060a)"><div class="glass"><div class="mini-pitch"></div></div><div class="console"></div></div>`,
  casa: `<div class="bg" style="background:linear-gradient(#3a2e2a,#211a17)"><div class="window warm"></div><div class="sofa"></div></div>`,
  oscuro: `<div class="bg" style="background:radial-gradient(80% 60% at 50% 40%,#1b1b22,#050507)"></div>`,
};
const CSS = `
#scene{position:absolute;inset:0;overflow:hidden}
.bg{position:absolute;inset:0}
.lockers i{position:absolute;top:240px;width:150px;height:900px;background:linear-gradient(90deg,#3c4352,#2d3340);border:4px solid #1c2029;border-radius:8px}
.lockers i::after{content:"";position:absolute;left:20px;right:20px;top:60px;height:10px;border-radius:4px;background:#1c2029;box-shadow:0 30px 0 #1c2029,0 60px 0 #1c2029}
.bench{position:absolute;left:-40px;right:-40px;bottom:330px;height:60px;background:#7a5230;border-radius:10px}
.lights{position:absolute;inset:0;background:radial-gradient(20% 10% at 15% 8%,rgba(255,255,230,.6),transparent 70%),radial-gradient(20% 10% at 85% 8%,rgba(255,255,230,.6),transparent 70%)}
.lines{position:absolute;left:-200px;right:-200px;top:690px;bottom:-100px;border-top:6px solid rgba(255,255,255,.5);background:repeating-linear-gradient(90deg,transparent 0 140px,rgba(255,255,255,.05) 140px 280px)}
.crowd{position:absolute;left:0;right:0;top:520px;height:170px;background:repeating-radial-gradient(circle at 20px 20px,#2a3550 0 10px,#1a2138 10px 22px);opacity:.8}
.window{position:absolute;right:90px;top:260px;width:300px;height:380px;border:14px solid #3b3f50;background:linear-gradient(#0a1530,#1b2a55);border-radius:8px}
.window.warm{background:linear-gradient(#f5b86b,#c8743a)}
.desk{position:absolute;left:-40px;right:-40px;bottom:300px;height:70px;background:#5a3c26;border-radius:8px}.desk.light{background:#b58b5a}
.lamp{position:absolute;left:120px;top:420px;width:160px;height:120px;background:radial-gradient(circle at 50% 100%,rgba(255,200,110,.45),transparent 70%)}
.board{position:absolute;left:140px;right:140px;top:560px;height:270px;background:#24423a;border:16px solid #7a5a3a;border-radius:10px;display:grid;place-items:center}
.board span{font-family:Caveat,'Comic Sans MS',cursive;color:rgba(244,242,236,.55);font-size:96px;transform:rotate(-4deg)}
.glass{position:absolute;left:60px;right:60px;top:200px;height:520px;border:12px solid #222632;border-radius:16px;background:#0a1a10;overflow:hidden}
.mini-pitch{position:absolute;inset:40px;background:#1d6b2f;border:4px solid rgba(255,255,255,.6)}
.console{position:absolute;left:-40px;right:-40px;bottom:300px;height:90px;background:#1a1c26;border-top:6px solid #2c3040}
.sofa{position:absolute;left:-40px;right:-40px;bottom:330px;height:200px;background:#5b3b6e;border-radius:40px 40px 0 0}
.ch{position:absolute;bottom:-40px;width:760px;height:1200px;transform-origin:50% 100%}
.ch-svg{width:100%;height:100%;overflow:visible}
.ch .name{position:absolute;left:50%;transform:translateX(-50%);top:160px;font-family:Anton,sans-serif;font-size:48px;letter-spacing:.06em;color:#000;background:#F5B841;padding:4px 22px;border-radius:12px;opacity:0;white-space:nowrap}
.capbox{position:absolute;left:50%;top:370px;transform:translateX(-50%);width:940px;text-align:center}
.capbox .cap{font-size:84px}
.who{position:absolute;left:50%;top:300px;transform:translateX(-50%);font-weight:900;font-size:40px;letter-spacing:.14em;text-transform:uppercase;color:#F5B841;opacity:0}
.bigpop{position:absolute;left:50%;top:540px;transform:translate(-50%,0);font-family:Anton,sans-serif;font-size:250px;line-height:1;color:#F5B841;text-shadow:0 10px 60px rgba(0,0,0,.6);opacity:0;white-space:nowrap}
.marks{position:absolute;font-family:Anton,sans-serif;font-size:160px;color:#F5B841;opacity:0}
.conf{position:absolute;width:24px;height:44px;border-radius:4px}
.hookt{position:absolute;left:50%;top:120px;width:auto;max-width:940px;font-family:Anton,sans-serif;font-size:62px;line-height:1.1;color:#fff;background:#FF4A3D;padding:8px 28px;border-radius:14px;white-space:nowrap;opacity:0}
.end{top:900px}
.dimend{position:absolute;inset:0;background:rgba(5,5,8,.88);opacity:0}
`;

boot(CSS, async () => {
  const D = await (await fetch(`talk_data/${ID}.json`)).json();
  const stage = document.getElementById('stage'); const sc = document.createElement('div'); sc.id = 'scene'; stage.prepend(sc);
  const scenes = {}; for (const k of new Set(D.lines.map(l => l.scene || D.scene))) { const d = document.createElement('div'); d.innerHTML = SCENES[k] || SCENES.oscuro; d.style.cssText = 'position:absolute;inset:0;opacity:0'; sc.appendChild(d); scenes[k] = d; }
  // personajes presentes
  const kinds = [...new Set(D.lines.map(l => l.who).filter(w => w && w !== 'voz'))];
  const chars = {}; kinds.forEach((k, i) => { const c = document.createElement('div'); c.className = 'ch'; c.innerHTML = charSVG(k) + `<div class="name">${(D.names || {})[k] || ''}</div>`; sc.appendChild(c); chars[k] = { el: c, i, n: kinds.length }; });
  const phone = {}; Object.entries(chars).forEach(([k, c]) => { phone[k] = c.el.querySelector('.phone'); });
  const hook = D.hook ? el(D.hook, 'hookt') : null;
  const who = el('', 'who'); const capbox = el('', 'capbox'); let capNode = null, capIdx = -1;
  const big = el('', 'bigpop'); const marks = document.createElement('div'); marks.className = 'marks'; marks.textContent = '!!'; sc.appendChild(marks);
  const R = rng(7); const confs = Array.from({ length: 70 }, () => { const c = document.createElement('div'); c.className = 'conf'; c.style.background = ['#F5B841', '#FF4A3D', '#fff', '#3DDC97'][Math.floor(R() * 4)]; c._x = R() * 1080; c._s = .6 + R() * .9; c._r = R() * 6; c._d = R() * .6; sc.appendChild(c); return c; });
  const dimend = document.createElement('div'); dimend.className = 'dimend'; document.getElementById('over').prepend(dimend);
  const end = endCard();
  const ENV_FPS = D.env_fps || 30;
  await document.fonts.load('62px Anton', 'ÁÉÍÓÚÑ¿¡0123456789'); await document.fonts.load('900 80px Figtree', 'ÁÉÍÓÚÑ¿¡'); await new Promise(r => setTimeout(r, 700));
  return { dur: D.total, cues: D.cues || [], seek(t) {
    // línea actual
    let li = -1; D.lines.forEach((l, i) => { if (t >= l.start - .05) li = i; });
    const L = li >= 0 ? D.lines[li] : D.lines[0];
    const curScene = L.scene || D.scene; for (const [k, d] of Object.entries(scenes)) d.style.opacity = k === curScene ? 1 : 0;
    // cámara: zoom lento y punch en cada cambio de frase
    const since = li >= 0 ? t - L.start : 0; const punch = 1 + .04 * Math.exp(-since * 6);
    sc.style.transform = `scale(${(1.02 + t * .004) * punch})`; sc.style.transformOrigin = '50% 70%';
    // personajes
    for (const [k, c] of Object.entries(chars)) {
      const speaking = li >= 0 && L.who === k && since < L.dur; const present = D.lines.some(l => l.who === k && (l.scene || D.scene) === curScene);
      const x = c.n === 1 ? 160 : (c.i === 0 ? -140 : 300); const appear = eBack(prog(t, .0, .5));
      c.el.style.left = x + 'px'; c.el.style.opacity = present ? 1 : 0;
      const env = speaking ? (L.env[Math.min(L.env.length - 1, Math.floor(since * ENV_FPS))] || 0) : 0;
      const act = speaking ? (L.act || '') : '';
      const jump = act === 'flipa' ? Math.abs(Math.sin(since * 9)) * 40 * Math.exp(-since * 1.2) : 0;
      const sway = Math.sin(t * 2 + c.i) * 6 + (speaking ? Math.sin(t * 7) * 5 : 0);
      c.el.style.transform = `translateY(${-jump + (1 - appear) * 300}px) rotate(${sway * .25}deg) scale(${(c.n > 1 ? .75 : 1) * (speaking ? 1.03 : .97)})`;
      c.el.style.filter = c.n > 1 && !(li >= 0 && L.who === k) ? 'brightness(.6)' : 'none';
      const svg = c.el.querySelector('svg');
      svg.querySelector('.mouth').setAttribute('ry', (act === 'flipa' && speaking ? 26 : 6) + env * 34);
      svg.querySelector('.mouth').setAttribute('rx', 34 + env * 10);
      svg.querySelector('.tongue').setAttribute('ry', env > .4 ? (env - .4) * 18 : 0);
      const blink = (t + c.i * 1.3) % 3.4 < .12; const wide = act === 'flipa' || act === 'shock';
      for (const e of svg.querySelectorAll('.el,.er')) e.setAttribute('ry', blink ? 3 : wide ? 34 : 26);
      for (const p of svg.querySelectorAll('.pl,.pr')) { p.setAttribute('r', blink ? 0 : wide ? 8 : 11); }
      const bu = act === 'flipa' || act === 'shock' ? -18 : act === 'triste' ? 10 : act === 'piensa' ? -8 : 0;
      svg.querySelector('.brows').setAttribute('transform', `translate(0 ${bu})`);
      svg.querySelector('.tear').setAttribute('opacity', act === 'triste' ? 1 : 0);
      svg.querySelector('.head').setAttribute('transform', `rotate(${speaking ? Math.sin(t * 5) * 3 : 0}) translate(0 ${speaking ? -env * 8 : 0})`);
      const ph = (L.who === k && /movil/.test(act)) || (D.lines.slice(0, li + 1).some(l => l.who === k && /movil/.test(l.act || '')) && !speaking && false);
      phone[k].setAttribute('opacity', (L.who === k && /movil/.test(act)) ? eOut(prog(since, 0, .3)) : 0);
      svg.querySelector('.arm-r').setAttribute('transform', /movil|gol/.test(act) && L.who === k ? 'rotate(-20 150 300)' : 'rotate(0)');
    }
    // subtítulo palabra a palabra
    if (li !== capIdx) { capbox.innerHTML = ''; capNode = document.createElement('div'); capNode.className = 'cap'; capbox.appendChild(capNode); capIdx = li; }
    if (li >= 0 && capNode) { words(capNode, L.cap || L.text, t, L.start, Math.max(.12, Math.min(.3, L.dur / Math.max(1, (L.cap || L.text).split(' ').length)))); }
    capbox.style.opacity = t < D.end ? 1 : 0;
    who.textContent = li >= 0 ? ((D.names || {})[L.who] || '') : ''; who.style.opacity = li >= 0 && t < D.end ? 1 : 0;
    if (hook) show(hook, t, .1, Math.min(3.2, D.lines[1] ? D.lines[1].start : 3.2), { dy: 0, scale: .3 });
    // efectos
    const bigL = li >= 0 && L.big ? L : null;
    big.textContent = bigL ? bigL.big : ''; big.style.opacity = bigL ? eOut(prog(since, .1, .4)) * (1 - prog(since, bigL.dur + .2, bigL.dur + .6)) : 0;
    big.style.transform = `translate(-50%,0) scale(${bigL ? .5 + .5 * eBack(prog(since, .1, .5)) : 1})`;
    const flip = li >= 0 && !L.big && /flipa|shock/.test(L.act || ''); marks.style.opacity = flip ? (Math.floor(since * 6) % 2 ? 1 : .6) : 0; marks.style.left = '760px'; marks.style.top = '700px';
    const gol = D.lines.find(l => /gol/.test(l.act || '')); const gt = gol ? t - gol.start : -1;
    confs.forEach(c => { const tt = gt - c._d; c.style.opacity = gol && tt > 0 && tt < 4 && t < D.end + .2 ? 1 : 0; c.style.transform = `translate(${c._x + Math.sin(tt * 3 + c._r) * 40}px, ${-60 + tt * 520 * c._s}px) rotate(${tt * 300 * c._s}deg)`; });
    // final
    dimend.style.opacity = eOut(prog(t, D.end, D.end + .5)) * .95;
    endCardSeek(end, t, D.end + .1); end.style.transform = 'translate(-50%,0)';
  } };
});
