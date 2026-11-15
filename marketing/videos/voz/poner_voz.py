"""Pone voz en off a los vídeos de publicación (la misma voz joven del corto: piper davefx +2 semitonos).
Uso: python3 poner_voz.py <piper> <modelo.onnx> <carpeta_videos_sin_voz> <carpeta_salida> [días…]
Cada frase se ajusta para no pisar la siguiente (se acelera hasta un 25 %); la voz va sobre los efectos, bajados."""
import json, pathlib, subprocess, sys

PIPER, MODEL, SRC, OUT = sys.argv[1:5]; only = set(sys.argv[5:])
HERE = pathlib.Path(__file__).parent; OUT = pathlib.Path(OUT); OUT.mkdir(parents=True, exist_ok=True)
G = json.load(open(HERE / "guion_voz.json", encoding="utf-8"))
run = lambda *a: subprocess.run(a, check=True, capture_output=True, text=True).stdout
def length(f): return float(run("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)))
report = []
for day, lines in G.items():
    if day.startswith("_") or (only and day not in only): continue
    src = pathlib.Path(SRC) / f"dia-{day}.mp4"; total = length(src); tmp = OUT / f"tmp-{day}"; tmp.mkdir(exist_ok=True)
    inputs, filt, rows = [], "", []
    for i, (at, txt) in enumerate(lines):
        raw, v = tmp / f"r{i}.wav", tmp / f"v{i}.wav"
        subprocess.run([PIPER, "--model", MODEL, "--length_scale", "0.86", "--noise_scale", "0.75", "--noise_w", "0.9", "--output_file", str(raw)], input=txt, text=True, check=True, capture_output=True)
        nxt = lines[i + 1][0] if i + 1 < len(lines) else total - 0.25
        room = nxt - at - 0.12
        base = "asetrate=22050*1.1225,aresample=44100,highpass=f=90,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,volume=1.5"
        run("ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", base + ",atempo=0.97", "-ac", "2", str(v))
        d = length(v); speed = 1.0
        if d > room:
            speed = min(1.25, d / room)
            run("ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", base + f",atempo={0.97 * speed:.3f}", "-ac", "2", str(v)); d = length(v)
        rows.append((at, round(d, 2), round(room, 2), round(speed, 2), d <= room + 0.05, txt))
        inputs += ["-i", str(v)]; ms = int(at * 1000); filt += f"[{i + 1}:a]adelay={ms}|{ms}[d{i}];"
    mix = "[fx]" + "".join(f"[d{j}]" for j in range(len(lines)))
    out = OUT / f"dia-{day}.mp4"
    run("ffmpeg", "-v", "error", "-y", "-i", str(src), *inputs, "-filter_complex",
        f"[0:a]volume=0.45[fx];{filt}{mix}amix=inputs={len(lines) + 1}:normalize=0:duration=first,loudnorm=I=-14:TP=-2.5:LRA=11,alimiter=limit=0.8:level=false[a]",
        "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-shortest", "-movflags", "+faststart", str(out))
    report.append((day, total, length(out), rows))
for day, t0, t1, rows in report:
    print(f"Día {day}: {t0:.1f} s → {t1:.1f} s")
    for at, d, room, sp, ok, txt in rows: print(f"   {at:5.1f}s  {d:4.2f}/{room:4.2f}s  x{sp:<4} {'OK ' if ok else 'LARGA'} {txt}")
