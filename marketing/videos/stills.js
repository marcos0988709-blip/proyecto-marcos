// node stills.js <video> t1 t2 ... → out/<video>_stills.png (tira de fotogramas)
const { chromium } = require('playwright'); const { spawn, execFileSync } = require('child_process'); const fs = require('fs');
const [name, ...ts] = process.argv.slice(2); const DIR = __dirname; fs.mkdirSync(DIR + '/out/st', { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', '8791', '--directory', DIR], { stdio: 'ignore' }); await new Promise(r => setTimeout(r, 800));
  const b = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' }, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await (await b.newContext({ viewport: { width: 1080, height: 1920 }, ignoreHTTPSErrors: true })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto(`http://localhost:8791/page.html?v=${name}`); await p.waitForFunction(() => window.ready, null, { timeout: 60000 }); await p.evaluate(() => window.ready).catch(e => errs.push(String(e)));
  const files = [];
  for (const t of ts) { await p.evaluate(t => window.seek(t), +t); const f = `${DIR}/out/st/${name}_${t}.png`; await p.screenshot({ path: f }); files.push(f); }
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...files.flatMap(f => ['-i', f]), '-filter_complex', files.map((_, i) => `[${i}]scale=300:-1[s${i}]`).join(';') + ';' + files.map((_, i) => `[s${i}]`).join('') + `hstack=inputs=${files.length}`, `${DIR}/out/${name}_stills.png`]);
  console.log('errores:', errs.join(' | ') || 'ninguno'); await b.close(); srv.kill();
})();
