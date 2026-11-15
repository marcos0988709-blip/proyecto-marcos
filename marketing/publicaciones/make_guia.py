"""Genera guia.html (una página con forma de móvil por día) a partir de dias.json.
Uso: python3 make_guia.py <carpeta_de_trabajo>   (la carpeta tiene dias.json y thumbs/dia-N.jpg)
Después, make_pdf.js la convierte en PDF."""
import html, json, pathlib, sys

W = pathlib.Path(sys.argv[1])
days = json.load(open(W / "dias.json", encoding="utf-8"))
SLUG = {1: "Examen manana", 2: "Control sorpresa", 3: "3 examenes en 5 dias", 4: "2 horas estudiando", 5: "Ejercicio imposible",
        6: "Te dan la nota", 7: "3 trucos", 8: "Domingo 23h entrega", 9: "Asi se ve un 10", 10: "Has estudiado hoy",
        11: "Quedan 20 minutos", 12: "Leido 3 veces", 13: "Tu amigo saca un 8", 14: "Te mandan un PDF"}
DA = {"lunes": "lun", "martes": "mar", "miércoles": "mie", "jueves": "jue", "viernes": "vie", "sábado": "sab", "domingo": "dom"}
for d in days:
    dd = int(d["date"][-2:])
    d["fname"] = f"Dia {d['n']:02d} - {DA[d['dow']]} {dd} nov - {SLUG[d['n']]}.mp4"
    d["tname"] = f"Dia {d['n']:02d} - TEXTO.txt"
json.dump(days, open(W / "dias_nombres.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
e = html.escape
LINKS = {1: "https://claude.ai/artifact/NFqFVRY8pzGiYbde1FTGBB", 2: "https://claude.ai/artifact/PcaundmHXuvErjKntvVNA1"}

CSS = """
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Figtree:wght@500;700;800;900&display=swap');
@page{size:390px 844px;margin:0}
*{box-sizing:border-box}html,body{margin:0;background:#08080A}
body{font-family:Figtree,system-ui,sans-serif;color:#F4F2EC;font-size:14.5px;line-height:1.4}
.page{width:390px;height:844px;padding:26px 22px 22px;display:flex;flex-direction:column;gap:11px;page-break-after:always;break-after:page;overflow:hidden;position:relative;
  background:radial-gradient(90% 40% at 100% 0%,rgba(245,184,65,.16),transparent 60%),#08080A}
.page:last-child{page-break-after:auto;break-after:auto}
h1{font-family:Anton,Impact,sans-serif;font-weight:400;text-transform:uppercase;font-size:44px;line-height:1;margin:0;color:#F5B841;letter-spacing:.02em}
h2{font-family:Anton,Impact,sans-serif;font-weight:400;text-transform:uppercase;font-size:27px;line-height:1.04;margin:0}
.eyebrow{font-size:11px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#F5B841}
.muted{color:#A3A2AD}.small{font-size:12.5px}
.box{background:#121217;border:1px solid #25262E;border-radius:13px;padding:10px 12px}
.lab{font-size:10.5px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#F5B841;margin-bottom:3px}
.row{display:flex;gap:12px;align-items:stretch}
.thumb{width:112px;height:199px;border-radius:11px;object-fit:cover;border:1px solid #25262E;flex:none}
.info{display:flex;flex-direction:column;gap:7px;min-width:0;flex:1}
.pill{display:inline-block;align-self:flex-start;background:#F5B841;color:#000;font-weight:900;font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;padding:4px 10px;border-radius:99px}
.file{font-size:11.5px;color:#A3A2AD;overflow-wrap:anywhere}
ol{margin:0;padding-left:18px}ol li{margin:1px 0}
.tick{display:flex;align-items:center;gap:10px;font-weight:800}
.sq{width:20px;height:20px;border:2px solid #F5B841;border-radius:5px;flex:none}
.line{flex:1;border-bottom:1px solid #4a4b55;height:16px}
.foot{margin-top:auto;display:flex;justify-content:space-between;font-size:10.5px;color:#6d6e78;font-weight:700;letter-spacing:.06em}
table{width:100%;border-collapse:collapse;font-size:12.5px}
td{padding:5.5px 4px;border-bottom:1px solid #1d1e25;vertical-align:top}
td.n{font-family:Anton,sans-serif;color:#F5B841;font-size:15px;width:26px}
td.d{color:#A3A2AD;white-space:nowrap;width:74px}
.wk td{font-weight:900;color:#F5B841;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;border-bottom:0;padding-top:9px}
.step{display:flex;gap:10px;align-items:flex-start}
.num{width:24px;height:24px;border-radius:50%;background:#F5B841;color:#000;font-weight:900;display:grid;place-items:center;flex:none;font-size:13px}
a{color:#F5B841;text-decoration:none;overflow-wrap:anywhere}
"""
P = []
foot = lambda t: f'<div class="foot"><span>ROCKY · PLAN DE PUBLICACIÓN</span><span>{t}</span></div>'

# Portada + calendario
rows = ""
for wk in (1, 2):
    rows += f'<tr class="wk"><td colspan="3">Semana {wk}</td></tr>'
    rows += "".join(f'<tr><td class="n">{d["n"]}</td><td class="d">{e(d["dlabel"])}</td><td>{e(d["title"])}</td></tr>' for d in days if d["week"] == wk)
P.append(f'''<section class="page"><div><div class="eyebrow">Del 15 al 28 de noviembre</div><h1>Plan de<br>publicación</h1></div>
<p class="muted" style="margin:0">Un vídeo al día, entre las <b style="color:#F4F2EC">19:00 y las 21:00</b>, en TikTok y en Reels.</p>
<div class="box" style="padding:6px 10px"><table>{rows}</table></div>{foot("1")}</section>''')

# Cómo se usa
steps = ["Abre la carpeta <b>Rocky semana 1</b> (o 2) en la app Archivos.",
         "Toca el vídeo del día → botón de compartir → <b>Guardar vídeo</b>. Ya está en Fotos.",
         "Abre TikTok o Instagram y sube ese vídeo desde Fotos.",
         "Abre el archivo <b>TEXTO</b> del mismo día → mantén pulsado → <b>Seleccionar todo</b> → <b>Copiar</b>. Pégalo en la publicación.",
         "Ponle una música que esté sonando y publica.",
         "En la primera hora, contesta a todos los que comenten <b>ROCKY</b>.",
         "A las 48 horas apunta en esta guía las vistas y cuántos «ROCKY» tiene."]
P.append(f'''<section class="page"><div><div class="eyebrow">Cada día, 5 minutos</div><h2>Cómo se usa</h2></div>
{"".join(f'<div class="step"><span class="num">{i+1}</span><span>{s}</span></div>' for i, s in enumerate(steps))}
<div class="box small"><div class="lab">Para hablar con Claude</div>Di «el del día 3» y sabrá qué vídeo es. El que más «ROCKY» saque marca los siguientes vídeos.</div>
<div class="box small"><div class="lab">Todo esto es tuyo</div>Funciona sin Claude y sin internet. Las páginas con botones siguen en los enlaces del final.</div>{foot("2")}</section>''')

# Un día por página
for i, d in enumerate(days):
    P.append(f'''<section class="page" data-day="{d["n"]}">
<div class="row"><img class="thumb" src="thumbs/dia-{d["n"]}.jpg" alt="">
 <div class="info"><span class="pill">Día {d["n"]} · {e(d["dlabel"])}</span><h2>{e(d["title"])}</h2>
 <div class="small"><b>Hora:</b> de 19:00 a 21:00</div><div class="file">Vídeo: {e(d["fname"])}</div></div></div>
<div class="box"><div class="lab">Texto para pegar</div><div class="cap">{e(d["text"])}</div></div>
<div class="box"><div class="lab">Hashtags</div><div class="tags">{e(d["tags"])}</div></div>
<div class="box small"><div class="lab">Música</div>{e(d["music"])}</div>
<div class="small"><ol><li>Sube el vídeo y pega el texto y los hashtags.</li><li>Contesta los «ROCKY» en la primera hora.</li><li>A las 48 h, apunta los números aquí abajo.</li></ol></div>
<div class="box"><div class="tick"><span class="sq"></span>Publicado</div>
 <div class="tick small" style="margin-top:9px;font-weight:700">Vistas<span class="line"></span>«ROCKY»<span class="line"></span></div></div>
{foot(str(i + 3))}</section>''')

# Otras tareas
tasks = [("Probar la voz de IA", "En la app: GEFI → Estudio IA → Vídeo resumen → play. Dile a Claude cómo suena."),
         ("Descargar un vídeo resumen", "Botón «Descargar vídeo» y mira si se guarda en Fotos."),
         ("Tus hábitos", "Agenda → Hábitos → añade los tuyos → «Avisos al calendario»."),
         ("Pasar la app a 2 o 3 amigos", "Que se registren y te digan qué no entienden. Apúntalo."),
         ("Cuenta gratis de Cloudflare", "Sin tarjeta. Avisa a Claude y subís juntos la IA gratis para tus amigos.")]
P.append(f'''<section class="page"><div><div class="eyebrow">Además de los vídeos</div><h2>Tus otras tareas</h2></div>
{"".join(f'<div class="box"><div class="tick"><span class="sq"></span>{e(t)}</div><div class="small muted" style="margin-top:4px">{e(s)}</div></div>' for t, s in tasks)}
<div class="box small"><div class="lab">Enlaces</div>App: <a href="https://marcos0988709-blip.github.io/proyecto-marcos/">marcos0988709-blip.github.io/proyecto-marcos</a><br>
Semana 1: <a href="{LINKS[1]}">{LINKS[1].replace("https://", "")}</a><br>Semana 2: <a href="{LINKS[2]}">{LINKS[2].replace("https://", "")}</a></div>{foot(str(len(days) + 3))}</section>''')

(W / "guia.html").write_text(f'<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Rocky - Plan de publicación</title><style>{CSS}</style></head><body>{"".join(P)}</body></html>', encoding="utf-8")
print("páginas:", len(P))
