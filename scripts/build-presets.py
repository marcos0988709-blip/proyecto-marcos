"""Genera las versiones personalizadas de Pupitre Libre a partir de docs/index.html.

Uso: python3 scripts/build-presets.py   (ejecutar después de cada cambio en docs/index.html)
"""
import json, pathlib, shutil

ROOT = pathlib.Path(__file__).resolve().parent.parent / "docs"
PRESETS = {"mecanica": "Pupitre · Mecánica"}

src = (ROOT / "index.html").read_text(encoding="utf-8")
for key, name in PRESETS.items():
    out = ROOT / key
    out.mkdir(exist_ok=True)
    html = src.replace('<meta name="theme-color"', f'<meta name="pupitre-preset" content="{key}">\n<meta name="theme-color"', 1)
    html = html.replace('href="icon-192.png"', 'href="../icon-192.png"').replace('href="icon-512.png"', 'href="../icon-512.png"')
    assert f'content="{key}"' in html
    (out / "index.html").write_text(html, encoding="utf-8")
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    manifest["name"] = name
    manifest["icons"] = [{**i, "src": "../" + i["src"]} for i in manifest["icons"]]
    (out / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    shutil.copy(ROOT / "version.json", out / "version.json")
    print("ok", key)
