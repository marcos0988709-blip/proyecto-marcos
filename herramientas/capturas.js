// Revisa las webs demo y genera las imágenes para enviar por WhatsApp.
//
//   node herramientas/capturas.js revisar [carpeta-capturas]  -> desbordes, errores JS y capturas de control
//   node herramientas/capturas.js mockups                     -> webs/mockups/<slug>.jpg
const fs = require("fs");
const path = require("path");
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "/opt/node22/lib/node_modules/playwright");

const RAIZ = path.resolve(__dirname, "..");
const WEBS = path.join(RAIZ, "webs");
const slugs = fs.readdirSync(WEBS).filter((f) => f.endsWith(".html") && f !== "index.html").map((f) => f.slice(0, -5));
const url = (slug) => "file://" + path.join(WEBS, slug + ".html");
// Las capturas no esperan a las animaciones de entrada: se muestran ya terminadas.
const SIN_ANIMACION = "*,*::before,*::after{transition:none!important;animation:none!important}";
// En las imágenes de presentación sobra el aviso de "vista previa".
const SIN_BANNER = ".demo{display:none!important}";
const mostrarTodo = () => document.querySelectorAll(".reveal").forEach((el) => el.classList.add("on"));

async function revisar(browser, carpeta) {
  fs.mkdirSync(carpeta, { recursive: true });
  const anchos = [320, 390, 768, 1440];
  let fallos = 0;
  for (const slug of slugs) {
    for (const ancho of anchos) {
      const page = await browser.newPage({ viewport: { width: ancho, height: 900 }, isMobile: ancho < 800, hasTouch: ancho < 800 });
      const errores = [];
      page.on("pageerror", (err) => errores.push(err.message));
      page.on("console", (m) => m.type() === "error" && errores.push(m.text()));
      await page.goto(url(slug));
      await page.addStyleTag({ content: SIN_ANIMACION });
      await page.evaluate(mostrarTodo);
      const r = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const anchoDoc = document.documentElement.scrollWidth;
        const culpables = [];
        if (anchoDoc > vw) {
          document.querySelectorAll("body *").forEach((el) => {
            const b = el.getBoundingClientRect();
            if (b.right > vw + 1 && !el.closest(".hero,.panel,.contact")) culpables.push(el.tagName.toLowerCase() + "." + el.className);
          });
        }
        return { vw, anchoDoc, culpables: culpables.slice(0, 5) };
      });
      const red = errores.filter((t) => !/net::|Failed to load resource/.test(t));
      if (r.anchoDoc > r.vw || red.length) {
        fallos++;
        console.log(`FALLO ${slug} @${ancho}px  doc=${r.anchoDoc} vw=${r.vw} ${r.culpables.join(" ")} ${red.join(" | ")}`);
      }
      if (ancho === 390 || ancho === 1440) {
        await page.waitForTimeout(150);
        await page.screenshot({ path: path.join(carpeta, `${slug}-${ancho}.png`), fullPage: true });
      }
      await page.close();
    }
  }
  console.log(fallos ? `${fallos} fallos` : `OK: ${slugs.length} webs x ${anchos.length} anchos sin desbordes ni errores`);
}

function leerColores(html) {
  const c1 = /--c1:(#[0-9a-f]{6})/i.exec(html)[1];
  const c2 = /--c2:(#[0-9a-f]{6})/i.exec(html)[1];
  const deep = /--deep:(#[0-9a-f]{6})/i.exec(html)[1];
  const corto = /<span class="nm">([^<]+)<\/span>/.exec(html)[1];
  const etiqueta = /<p class="kick"><i><\/i>([^<]+)<\/p>/.exec(html)[1];
  const wa = html.includes('class="float"');
  return { c1, c2, deep, corto, etiqueta, wa };
}

async function mockups(browser) {
  const salida = path.join(WEBS, "mockups");
  const tmp = path.join(salida, ".tmp");
  fs.mkdirSync(tmp, { recursive: true });
  const fuente = "data:font/woff2;base64," + fs.readFileSync(path.join(__dirname, "fonts", "plus-jakarta-sans-latin-wght-normal.woff2")).toString("base64");
  for (const slug of slugs) {
    const escritorio = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await escritorio.goto(url(slug));
    await escritorio.addStyleTag({ content: SIN_ANIMACION + SIN_BANNER });
    await escritorio.evaluate(mostrarTodo);
    await escritorio.waitForTimeout(150);
    const pEsc = path.join(tmp, slug + "-d.png");
    const finPortada = await escritorio.evaluate(() => Math.round(document.querySelector(".hero").getBoundingClientRect().bottom));
    await escritorio.screenshot({ path: pEsc, clip: { x: 0, y: 0, width: 1440, height: finPortada } });
    await escritorio.close();

    const movil = await browser.newPage({ viewport: { width: 390, height: 804 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await movil.goto(url(slug));
    await movil.addStyleTag({ content: SIN_ANIMACION + SIN_BANNER });
    await movil.evaluate(mostrarTodo);
    await movil.waitForTimeout(150);
    const pMov = path.join(tmp, slug + "-m.png");
    await movil.screenshot({ path: pMov });
    await movil.close();

    const k = leerColores(fs.readFileSync(path.join(WEBS, slug + ".html"), "utf8"));
    const img = (p) => "data:image/png;base64," + fs.readFileSync(p).toString("base64");
    const lienzo = await browser.newPage({ viewport: { width: 1200, height: 1400 }, deviceScaleFactor: 1.5 });
    await lienzo.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:"PJS";font-weight:200 800;src:url(${fuente}) format("woff2")}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:1400px;overflow:hidden;font-family:"PJS",sans-serif;color:#fff;position:relative;
background:radial-gradient(70% 50% at 85% 0%,${k.c2}66,transparent 60%),radial-gradient(60% 45% at 0% 100%,${k.c2}33,transparent 65%),linear-gradient(165deg,${k.c1},${k.deep} 75%)}
body::before{content:"";position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.07) 1px,transparent 1px);background-size:26px 26px}
.t{position:absolute;left:84px;top:100px;right:84px}
.k{display:inline-block;font-size:22px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:${k.c2};margin-bottom:20px}
h1{font-size:74px;line-height:1.02;letter-spacing:-.035em;font-weight:800;max-width:15ch}
.s{margin-top:18px;font-size:26px;color:rgba(255,255,255,.75)}
.izq{position:absolute;left:84px;top:400px;width:800px;display:flex;flex-direction:column;gap:72px}
.br{position:relative;width:800px;border-radius:18px;overflow:hidden;background:#fff;box-shadow:0 60px 120px -40px rgba(0,0,0,.7)}
.bb{height:44px;background:#eef1f5;display:flex;align-items:center;gap:9px;padding:0 18px}
.bb i{width:12px;height:12px;border-radius:50%;background:#cfd5dd}
.bb span{margin-left:18px;flex:1;height:26px;border-radius:8px;background:#fff;color:#64748b;font-size:14px;display:flex;align-items:center;padding:0 12px}
.br img{display:block;width:100%}
.ph{position:absolute;left:790px;top:490px;width:350px;height:742px;border-radius:56px;background:#0b0b0f;padding:12px;box-shadow:0 70px 120px -30px rgba(0,0,0,.75),0 0 0 2px rgba(255,255,255,.08)}
.scr{width:326px;height:718px;border-radius:44px;overflow:hidden;background:#fff}
.sb{height:46px;display:flex;align-items:center;justify-content:space-between;padding:6px 30px 0 34px;color:#0b0b0f;font-size:15px;font-weight:700}
.bat{display:flex;align-items:center;gap:6px}.bat i{display:block;width:4px;border-radius:1px;background:#0b0b0f}
.bat b{display:block;width:24px;height:12px;border-radius:3px;border:1.5px solid #0b0b0f;padding:1.5px}.bat b::after{content:"";display:block;height:100%;width:75%;border-radius:1px;background:#0b0b0f}
.scr img{display:block;width:326px;height:672px;object-fit:cover;object-position:top}
.ph::after{content:"";position:absolute;top:22px;left:50%;width:96px;height:28px;margin-left:-48px;border-radius:20px;background:#0b0b0f}
.f{width:660px;display:grid;gap:16px}
.f div{display:flex;align-items:center;gap:16px;font-size:27px;font-weight:600}
.f b{display:grid;place-items:center;width:46px;height:46px;border-radius:50%;background:${k.c2};color:${k.deep};font-size:24px;flex:none}
.pie{position:absolute;left:84px;bottom:90px;width:660px;font-size:20px;color:rgba(255,255,255,.55)}
</style></head><body>
<div class="t"><span class="k">Propuesta de web</span><h1>${k.corto}</h1><p class="s">${k.etiqueta}</p></div>
<div class="izq"><div class="br"><div class="bb"><i></i><i></i><i></i><span>${slug}.es</span></div><img src="${img(pEsc)}"></div>

<div class="f"><div><b>✓</b>Diseñada para verse perfecta en el móvil</div><div><b>✓</b>${k.wa ? "Te escriben por WhatsApp con un toque" : "Te llaman con un solo toque"}</div><div><b>✓</b>Servicios, ubicación y preguntas frecuentes</div><div><b>✓</b>Lista para publicar con tu dominio</div></div></div>
<div class="ph"><div class="scr"><div class="sb"><span>9:41</span><span class="bat"><i style="height:5px"></i><i style="height:8px"></i><i style="height:11px"></i><b></b></span></div><img src="${img(pMov)}"></div></div>
<p class="pie">Vista previa · diseño a medida</p>
</body></html>`);
    await lienzo.waitForTimeout(200);
    await lienzo.screenshot({ path: path.join(salida, slug + ".jpg"), type: "jpeg", quality: 86 });
    await lienzo.close();
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`${slugs.length} mockups en ${salida}`);
}

(async () => {
  const modo = process.argv[2] || "revisar";
  const browser = await chromium.launch();
  try {
    if (modo === "mockups") await mockups(browser);
    else await revisar(browser, process.argv[3] || path.join(RAIZ, "capturas"));
  } finally {
    await browser.close();
  }
})();
