// node render.js <video> [fps] [desde] [hasta]  → out/<video>.mp4 (+ _sfx), fotograma a fotograma
const { chromium } = require('playwright'); const { spawn, execFileSync } = require('child_process'); const fs = require('fs');
const [name, fpsA, fromA, toA] = process.argv.slice(2); const fps = +fpsA || 30; const DIR = __dirname; fs.mkdirSync(DIR + '/out', { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', '8790', '--directory', DIR], { stdio: 'ignore' }); await new Promise(r => setTimeout(r, 800));
  const b = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' }, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1, ignoreHTTPSErrors: true });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto(`http://localhost:8790/page.html?v=${name}`); await p.waitForFunction(() => window.ready, null, { timeout: 60000 }); await p.evaluate(() => window.ready);
  const dur = await p.evaluate(() => window.DUR); const cues = await p.evaluate(() => window.CUES);
  const from = +fromA || 0, to = toA ? +toA : dur; const n = Math.round((to - from) * fps);
  const silent = `${DIR}/out/${name}_v.mp4`;
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(fps), '-movflags', '+faststart', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    await p.evaluate(t => window.seek(t), from + i / fps);
    const buf = await p.screenshot({ type: 'jpeg', quality: 93, clip: { x: 0, y: 0, width: 1080, height: 1920 } });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 60 === 0) process.stdout.write(`\r${name} ${i}/${n} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  fs.writeFileSync(`${DIR}/out/${name}_cues.json`, JSON.stringify({ dur: to - from, cues: cues.map(([t, k]) => [t - from, k]).filter(c => c[0] >= 0) }));
  execFileSync('python3', [DIR + '/sfx.py', `${DIR}/out/${name}_cues.json`, `${DIR}/out/${name}_sfx.wav`]);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', silent, '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-shortest', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', `${DIR}/out/Rocky-${name}.mp4`]);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', silent, '-i', `${DIR}/out/${name}_sfx.wav`, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', `${DIR}/out/Rocky-${name}_efectos.mp4`]);
  console.log(`\n${name}: ${n} fotogramas en ${((Date.now() - t0) / 1000).toFixed(0)} s · errores: ${errs.join(' | ') || 'ninguno'}`);
  await b.close(); srv.kill();
})();
