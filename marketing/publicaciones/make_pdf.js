// node make_pdf.js <carpeta_de_trabajo>  → guia.pdf (páginas con forma de móvil) + comprobación de que nada se corta
const { chromium } = require('playwright');
const W = process.argv[2];
(async () => {
  const b = await chromium.launch(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {});
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, ignoreHTTPSErrors: true })).newPage();
  await p.goto('file://' + W + '/guia.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const over = await p.$$eval('.page', ps => ps.map((s, i) => ({ i: i + 1, extra: s.scrollHeight - s.clientHeight })).filter(x => x.extra > 0));
  const fonts = await p.evaluate(() => [document.fonts.check('20px Anton'), document.fonts.check('700 14px Figtree')]);
  await p.pdf({ path: W + '/guia.pdf', width: '390px', height: '844px', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  for (const n of [1, 3, 9, 17]) { await p.evaluate(k => document.querySelectorAll('.page')[k - 1].scrollIntoView(), n); await p.screenshot({ path: `${W}/guia-p${n}.png`, clip: { x: 0, y: 0, width: 390, height: 844 } }); }
  console.log('páginas con texto cortado:', JSON.stringify(over), '· fuentes cargadas:', fonts.join(','));
  await b.close();
})();
