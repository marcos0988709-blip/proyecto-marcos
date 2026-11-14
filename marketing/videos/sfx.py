# Efectos sincronizados (whoosh, golpe, pop, tic, subida, brillo) a volumen bajo, para que encajen con la música del creador.
import json, sys, numpy as np, wave
SR = 48000; cfg = json.load(open(sys.argv[1])); dur = cfg['dur']; out = np.zeros((int(SR * (dur + .5)), 2))
rng = np.random.default_rng(5)
def env(n, a, r): e = np.ones(n); a = max(1, int(a * SR)); r = max(1, int(r * SR)); e[:a] = np.linspace(0, 1, a); e[-r:] *= np.linspace(1, 0, r) ** 2; return e
def lp(x, k): y = np.copy(x); [y.__setitem__(slice(1, None), y[1:] * (1 - k) + y[:-1] * k) for _ in range(3)]; return y
def whoosh(d=.45):
    n = int(SR * d); x = rng.standard_normal(n); f = np.linspace(.92, .55, n); y = np.zeros(n); acc = 0
    for i in range(n): acc = acc * f[i] + x[i] * (1 - f[i]); y[i] = acc
    return y * np.sin(np.linspace(0, np.pi, n)) ** 2 * 2.2
def hit(d=.7):
    n = int(SR * d); t = np.arange(n) / SR; f = 90 * np.exp(-t * 9) + 42; s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6)
    return s * 1.1 + lp(rng.standard_normal(n), .6) * np.exp(-t * 30) * .5
def pop(d=.12):
    n = int(SR * d); t = np.arange(n) / SR; return np.sin(2 * np.pi * (900 - 2500 * t) * t) * np.exp(-t * 40) * .55
def tick(d=.05):
    n = int(SR * d); t = np.arange(n) / SR; return (np.sin(2 * np.pi * 3200 * t) + rng.standard_normal(n) * .3) * np.exp(-t * 120) * .35
def riser(d=1.4):
    n = int(SR * d); t = np.arange(n) / SR; x = lp(rng.standard_normal(n), .3) * (t / d) ** 2; return x * 1.2 + np.sin(2 * np.pi * (200 + 500 * (t / d) ** 2) * t) * (t / d) ** 2 * .25
def shine(d=1.2):
    n = int(SR * d); t = np.arange(n) / SR; s = sum(np.sin(2 * np.pi * f * t) / (k + 1) for k, f in enumerate([1318.5, 1975.5, 2637])); return s * np.exp(-t * 3) * .28
LIB = {'whoosh': whoosh, 'hit': hit, 'pop': pop, 'tick': tick, 'riser': riser, 'shine': shine}
for t, k in cfg['cues']:
    s = LIB[k](); i = int(t * SR); j = min(len(out), i + len(s)); pan = .5 + (rng.random() - .5) * .3
    out[i:j, 0] += s[:j - i] * (1 - pan) * 2; out[i:j, 1] += s[:j - i] * pan * 2
out = out[:int(SR * dur)]; out *= .5 / max(1e-6, np.abs(out).max())  # pico a -6 dB: deja sitio a la música
w = wave.open(sys.argv[2], 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype('<i2').tobytes()); w.close()
