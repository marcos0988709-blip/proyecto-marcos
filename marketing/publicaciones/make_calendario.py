"""Calendario de los 104 vídeos (14 primeros + 90 de personajes), 1 al día a las 20:00.
python3 make_calendario.py <carpeta_guiones> <salida.html>"""
import datetime as dt, html, json, pathlib, sys

G = pathlib.Path(sys.argv[1]); OUT = pathlib.Path(sys.argv[2])
TAGS = "#estudiar #examenes #estudiantes #eso #bachillerato #fp #studytok #pov"
DOW = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
FMT = {"f": "El Fenómeno", "i": "Intriga", "p": "POV", "n": "Narrador"}

import re
FIX = {"rocky": "Rocky", "pov": "POV", "fenómeno": "Fenómeno", "var": "VAR", "am": "AM", "pdf": "PDF"}
def nice(h):
    s = h.lower(); s = re.sub(r"[a-záéíóúñü]+", lambda m: FIX.get(m.group(0), m.group(0)), s)
    i = next((k for k, c in enumerate(s) if c.isalpha()), 0); return s[:i] + s[i].upper() + s[i + 1:]
days = [{"title": d["title"], "text": d["text"], "file": f"Día {d['n']}", "fmt": "Primeros 14"} for d in json.load(open(pathlib.Path(__file__).parent / "dias.json", encoding="utf-8"))]
# los 90: número de archivo según la tanda en que se entregaron
pool = {k: [] for k in "fipn"}
for t in range(1, 10):
    for i, V in enumerate(json.load(open(G / f"guiones_t{t}.json", encoding="utf-8"))["videos"], 1):
        pool[V["id"][0]].append({"title": nice(V["hook"]), "text": V["caption"], "file": f"{(t - 1) * 10 + i:03d}", "fmt": FMT[V["id"][0]]})
order = "finp"; k = 0
while any(pool.values()):
    c = order[k % 4]; k += 1
    if pool[c]: days.append(pool[c].pop(0))
start = dt.date(2026, 11, 15)
rows, month = [], None
for n, d in enumerate(days):
    day = start + dt.timedelta(days=n); m = f"{MES[day.month - 1]} {day.year}"
    if m != month: rows.append(f'<h2>{m.capitalize()}</h2>'); month = m
    rows.append(f'''<div class="d"><div class="dt"><b>{day.day}</b><span>{DOW[day.weekday()][:3]}</span></div>
<div class="c"><div class="t">{html.escape(d["title"])}</div><div class="m"><span class="f">{d["fmt"]}</span> Archivo <b>{d["file"]}</b></div>
<div class="x">{html.escape(d["text"])}</div></div></div>''')
end = start + dt.timedelta(days=len(days) - 1)
OUT.write_text(f'''<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Calendario Rocky</title>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Figtree:wght@500;700;800&display=swap" rel="stylesheet">
<style>
@page{{size:390px 844px;margin:0}}
body{{margin:0;background:#0b0b0e;color:#f4f2ec;font-family:Figtree,sans-serif}}
.wrap{{padding:22px 16px}}
.cover{{height:800px;display:flex;flex-direction:column;justify-content:center;page-break-after:always}}
h1{{font-family:Anton,sans-serif;font-size:58px;line-height:1;margin:0;color:#F5B841}}
.cover p{{font-size:16px;line-height:1.45;color:#c9cbd3}} .cover b{{color:#fff}}
.box{{background:#17171d;border:1px solid #2a2a33;border-radius:14px;padding:14px;margin-top:12px;font-size:14px;line-height:1.45}}
.tags{{font-size:13px;color:#F5B841;word-break:break-word}}
h2{{font-family:Anton,sans-serif;font-size:30px;color:#F5B841;margin:18px 0 8px;page-break-after:avoid}}
.d{{display:flex;gap:10px;background:#15151a;border-radius:12px;padding:10px;margin-bottom:8px;page-break-inside:avoid}}
.dt{{width:44px;text-align:center;flex:none}} .dt b{{display:block;font-family:Anton,sans-serif;font-size:26px}} .dt span{{font-size:11px;color:#9a9ca6;text-transform:uppercase}}
.t{{font-weight:800;font-size:15px}} .m{{font-size:12px;color:#9a9ca6;margin:3px 0}} .m b{{color:#fff}}
.f{{background:#F5B841;color:#000;border-radius:6px;padding:1px 6px;font-weight:800;margin-right:4px}}
.x{{font-size:13px;color:#d8d9de;line-height:1.35}}
</style></head><body><div class="wrap">
<div class="cover"><h1>CALENDARIO<br>ROCKY</h1>
<p><b>{len(days)} vídeos</b>, uno al día a las <b>20:00</b>, en TikTok, Instagram y YouTube.<br>Del {start.day} {MES[start.month-1]} {start.year} al {end.day} {MES[end.month-1]} {end.year}.</p>
<div class="box"><b>Cada día:</b><br>1. Busca el archivo del día (Día N o número 001–090).<br>2. Súbelo a las 20:00 a los 3 sitios.<br>3. Copia el texto de debajo y pega estos hashtags:</div>
<div class="box tags">{TAGS}</div>
<div class="box">Los formatos van alternados. A las 2 semanas, mira cuál tiene más vistas y «Comenta ROCKY», y dímelo.</div></div>
{"".join(rows)}
</div></body></html>''', encoding="utf-8")
print(len(days), "días hasta", end)
