"""Tandas de vídeos con personajes que hablan.
Uso: python3 tanda.py <guiones.json> [ids…]
Por cada vídeo: genera la voz de cada frase (voz distinta por personaje), mide tiempos, crea talk_data/<id>.json,
renderiza con render.js (talk:<id>) y mezcla voz + efectos → out/final/<id>.mp4"""
import json, os, pathlib, subprocess, sys, wave
import numpy as np

HERE = pathlib.Path(__file__).parent; SP = HERE.parent
PIPER = str(SP / "tts-env/bin/piper"); M = SP / "kit/voz/models"
VOICES = {  # modelo, speaker, filtro (tono/velocidad), length_scale
    "voz":        ("es_ES-davefx-medium", None, "asetrate=22050*1.1225,aresample=44100,atempo=0.97", .86),
    "estudiante": ("es_ES-davefx-medium", None, "asetrate=22050*1.1225,aresample=44100,atempo=0.97", .86),
    "fenomeno":   ("es_MX-ald-medium", None, "asetrate=22050*0.97,aresample=44100,atempo=1.02", .88),
    "narrador":   ("es_ES-carlfm-x_low", None, "asetrate=16000*1.04,aresample=44100,atempo=1.12", .82),
    "madre":      ("es_ES-sharvard-medium", 1, "asetrate=22050*1.0,aresample=44100", .9),
    "profe":      ("es_ES-sharvard-medium", 0, "asetrate=22050*0.97,aresample=44100", .92),
    "amigo":      ("es_AR-daniela-high", None, "asetrate=22050*0.84,aresample=44100,atempo=1.12", .88),
}
POST = ",highpass=f=90,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,volume=1.5"
run = lambda *a: subprocess.run([str(x) for x in a], check=True, capture_output=True, text=True).stdout
def length(f): return float(run("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f))
def envelope(f, fps=30):
    x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", str(f), "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout, dtype="<i2").astype(float) / 32768
    hop = 16000 // fps; n = len(x) // hop
    rms = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2)) for i in range(n)])
    rms = rms / max(1e-6, np.percentile(rms, 95)); rms = np.clip(rms, 0, 1)
    return [round(float(v), 2) for v in np.convolve(rms, [.25, .5, .25], "same")]

def build(V):
    vid = V["id"]; tmp = HERE / "talk_tmp" / vid; tmp.mkdir(parents=True, exist_ok=True)
    cur = V.get("lead", .35); lines = []; voices = []
    for i, L in enumerate(V["lines"]):
        who = L.get("who", "voz"); model, spk, filt, ls = VOICES[who]
        raw, out = tmp / f"r{i}.wav", tmp / f"v{i}.wav"
        cmd = [PIPER, "--model", str(M / f"{model}.onnx"), "--length_scale", str(L.get("ls", ls)), "--noise_scale", ".75", "--noise_w", ".9", "--output_file", str(raw)]
        if spk is not None: cmd += ["--speaker", str(spk)]
        subprocess.run(cmd, input=L.get("say", L["text"]), text=True, check=True, capture_output=True)
        run("ffmpeg", "-v", "error", "-y", "-i", raw, "-af", filt + POST, "-ac", "2", "-ar", "44100", out)
        d = length(out); cur += L.get("pre", 0)
        lines.append({"who": who, "text": L["text"], "cap": L.get("cap"), "act": L.get("act", ""), "big": L.get("big"), "scene": L.get("scene"),
                      "start": round(cur, 3), "dur": round(d, 3), "env": envelope(out)})
        voices.append((cur, out)); cur += d + L.get("gap", .28)
    end = cur + .15; total = round(end + 3.3, 2)
    cues = [[0.0, "whoosh"]]
    for L in lines:
        if L["big"]: cues.append([L["start"] + .1, "hit"])
        elif L["act"] in ("flipa", "shock"): cues.append([L["start"], "pop"])
        if "gol" in L["act"]: cues += [[max(0, L["start"] - 1.3), "riser"], [L["start"], "hit"]]
    cues += [[end, "whoosh"], [end + .25, "shine"]]
    data = {"total": total, "end": round(end, 3), "scene": V.get("scene", "oscuro"), "hook": V.get("hook"), "names": V.get("names", {}), "lines": lines, "cues": cues}
    (HERE / "talk_data" / f"{vid}.json").write_text(json.dumps(data, ensure_ascii=False))
    return data, voices

def render(V, data, voices, port):
    vid = V["id"]; env = dict(os.environ, PORT=str(port))
    subprocess.run(["node", str(HERE / "render.js"), f"talk:{vid}"], check=True, env=env, capture_output=True)
    src = HERE / "out" / f"Rocky-{vid}_efectos.mp4"; fin = HERE / "out" / "final"; fin.mkdir(exist_ok=True)
    ins = []; filt = ""
    for j, (at, f) in enumerate(voices):
        ins += ["-i", str(f)]; ms = int(at * 1000); filt += f"[{j + 1}:a]adelay={ms}|{ms}[d{j}];"
    mix = "[fx]" + "".join(f"[d{j}]" for j in range(len(voices)))
    run("ffmpeg", "-v", "error", "-y", "-i", src, *ins, "-filter_complex",
        f"[0:a]volume=0.4[fx];{filt}{mix}amix=inputs={len(voices) + 1}:normalize=0:duration=first,loudnorm=I=-14:TP=-2.5:LRA=11,alimiter=limit=0.8:level=false[a]",
        "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-shortest", "-movflags", "+faststart", fin / f"{vid}.mp4")
    return fin / f"{vid}.mp4"

if __name__ == "__main__":
    S = json.load(open(sys.argv[1], encoding="utf-8")); only = set(sys.argv[2:]); port = int(os.environ.get("PORT", 8800))
    for V in S["videos"]:
        if only and V["id"] not in only: continue
        data, voices = build(V)
        if os.environ.get("NORENDER"): print(V["id"], data["total"], "s"); continue
        f = render(V, data, voices, port); print(f"{V['id']}: {data['total']} s → {f}", flush=True)
