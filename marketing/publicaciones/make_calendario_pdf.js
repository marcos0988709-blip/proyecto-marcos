// node make_calendario_pdf.js <calendario.html> <salida.pdf> → PDF tamaño móvil + captura de comprobación
const { chromium } = require('playwright');
const [src, out] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {});
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, ignoreHTTPSErrors: true })).newPage();
  await p.goto('file://' + src, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready);
  const wide = await p.evaluate(() => document.documentElement.scrollWidth);
  await p.pdf({ path: out, width: '390px', height: '844px', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  await p.screenshot({ path: out.replace('.pdf', '-p1.png') }); await p.evaluate(() => window.scrollTo(0, 900)); await p.screenshot({ path: out.replace('.pdf', '-p2.png') });
  console.log('ancho', wide, 'fuente Anton:', await p.evaluate(() => document.fonts.check('20px Anton'))); await b.close();
})();
