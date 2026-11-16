"""python3 entregar.py guiones.json N  → copia out/final/<id>.mp4 a entrega/tandaN/ con nombre legible y escribe textos.txt"""
import json, pathlib, shutil, sys, unicodedata
HERE = pathlib.Path(__file__).parent; G = json.load(open(sys.argv[1], encoding="utf-8")); n = sys.argv[2]
dst = HERE / "entrega" / f"tanda{n}"; dst.mkdir(parents=True, exist_ok=True)
TAGS = "#estudiar #examenes #estudiantes #eso #bachillerato #fp #studytok #pov"
def clean(s): return "".join(c for c in s if c.isalnum() or c in " -").strip()
txt = []; files = []
for i, V in enumerate(G["videos"], 1):
    num = (int(n) - 1) * 10 + i
    name = f"{num:03d} - {clean(V['hook'].title())}.mp4"
    shutil.copy(HERE / "out" / "final" / f"{V['id']}.mp4", dst / name); files.append(str(dst / name))
    txt.append(f"{num:03d} · {V['hook']}\n{V['caption']}\n{TAGS}\n")
(dst / "textos.txt").write_text("\n".join(txt), encoding="utf-8")
print("\n".join(files))
