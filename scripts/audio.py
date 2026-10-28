#!/usr/bin/env python3
"""Sintetiza SFX + trilha em código, mistura com a voz (se houver) e normaliza em -14 LUFS.

  audio.py events.json [-o audio.wav] [--voice voz.wav]

events.json:
  {"bpm":120, "dur":16, "score":true, "key":0, "voice_t0":0, "bar0":0, "loop":false,
   "events":[{"t":0.5,"sfx":"click","gain":1.0}, {"t":3.0,"sfx":"riser","len":1.5}]}
sfx: drip click tick type whoosh pop thud success riser
Saídas: audio.wav (48k estéreo) e beats.json ao lado ({bpm, beats[], bars[], duration}).
A trilha é gerada no BPM dado, então a grade de batidas é exata por construção.
Voz: o score e os SFX abaixam sob a fala (ducking).
bar0: compasso em que a progressão começa (carrossel: cada slide continua a música do anterior).
loop: o fim emenda no começo (caudas voltam pro início; sem batida duplicada em t=dur).
"""
import argparse, json, subprocess, sys, wave
from pathlib import Path
import numpy as np

SR = 48000
rng = np.random.default_rng(7)  # semente fixa: mesmo JSON, mesmo áudio


def tt(d): return np.arange(int(SR * d)) / SR
def env(n, a=0.002, d=0.1):  # ataque curto + queda exponencial
    t = np.arange(n) / SR
    return np.minimum(t / a, 1) * np.exp(-t / d)
def box(x, w):  # passa-baixa barato: média móvel centrada por soma acumulada, O(n)
    w = max(1, int(w)); c = np.concatenate(([0.0], np.cumsum(x))); i = np.arange(len(x))
    lo = np.clip(i - w // 2, 0, len(x)); hi = np.clip(i - w // 2 + w, 0, len(x)); return (c[hi] - c[lo]) / w
def hp(x, w): return x - box(x, w)


def click(g=1):
    n = int(SR * 0.05); t = np.arange(n) / SR
    return g * (0.5 * hp(rng.standard_normal(n), 12) * env(n, 0.0005, 0.006) + 0.5 * np.sin(2 * np.pi * 1900 * t) * env(n, 0.0005, 0.012))
def tick(g=1, f=3200):
    n = int(SR * 0.03); t = np.arange(n) / SR
    return g * 0.35 * np.sin(2 * np.pi * f * t) * env(n, 0.0005, 0.006)
def typ(g=1): return tick(g * 0.8, 2400 + 900 * rng.random())
def pop(g=1):
    n = int(SR * 0.18); t = np.arange(n) / SR
    f = 300 + 700 * np.exp(-t / 0.03)
    return g * 0.6 * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.05)
def thud(g=1):
    n = int(SR * 0.35); t = np.arange(n) / SR
    f = 45 + 90 * np.exp(-t / 0.04)
    return g * 0.9 * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.12)
def whoosh(g=1, d=0.45):
    n = int(SR * d); x = rng.standard_normal(n)
    lo, mid, hi = box(x, 120), box(x, 24), hp(x, 6)
    u = np.linspace(0, 1, n)
    y = lo * (1 - u) ** 2 + mid * 2 * u * (1 - u) + hi * 0.15 * u ** 2
    return g * 1.6 * y * np.sin(np.pi * u) ** 2
def riser(g=1, d=1.5):
    n = int(SR * d); x = rng.standard_normal(n); u = np.linspace(0, 1, n)
    y = (box(x, 60) * (1 - u) + hp(x, 8) * u) * u ** 2
    return g * 1.2 * y
def success(g=1):
    out = np.zeros(int(SR * 0.7))
    for k, f in enumerate((659.3, 987.8)):
        n = int(SR * 0.5); t = np.arange(n) / SR; s = int(SR * 0.09 * k)
        out[s:s + n] += 0.4 * np.sin(2 * np.pi * f * t) * env(n, 0.002, 0.18)
    return g * out

def drip(g=1):  # pingo d'água: varredura rápida pra cima + bolha curta
    n = int(SR * 0.3); t = np.arange(n) / SR
    f = 420 + 1250 * (1 - np.exp(-t / 0.014))
    y = 0.6 * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.05)
    y += 0.18 * np.sin(2 * np.pi * np.cumsum(f * 2.02) / SR) * env(n, 0.001, 0.025)
    return g * y

SFX = dict(drip=drip, click=click, tick=tick, type=typ, pop=pop, thud=thud, whoosh=whoosh, riser=riser, success=success)


def place(buf, x, t):
    i = int(t * SR)
    if i < 0 or i >= len(buf): return
    x = x[: len(buf) - i]; buf[i:i + len(x)] += x


def score(dur, bpm, key, bar0=0, nbuf=None, loop=False):
    buf = np.zeros(nbuf or int(SR * dur)); B = 60 / bpm; sh = 2 ** (key / 12)
    chords = [(220, 261.6, 329.6), (174.6, 220, 261.6), (261.6, 329.6, 392), (196, 246.9, 293.7)]  # Am F C G
    bass = [55, 43.65, 65.4, 49]
    nb = int(round(dur / B)) if loop else int(dur / B) + 1  # no loop, a batida de t=dur é a de t=0
    for i in range(nb):
        t = i * B
        place(buf, 0.30 * thud(1)[: int(SR * 0.22)], t)                      # bumbo em toda batida
        place(buf, 0.10 * hp(rng.standard_normal(int(SR * 0.04)), 6) * env(int(SR * 0.04), 0.0005, 0.01), t + B / 2)  # chimbal
        bar = (i // 4 + bar0) % 4
        if i % 4 == 0:
            n = int(SR * B * 4); tn = np.arange(n) / SR
            pad = sum(np.sin(2 * np.pi * f * sh * tn) for f in chords[bar]) / 3
            place(buf, 0.07 * pad * np.minimum(tn / 0.4, 1) * np.minimum((B * 4 - tn) / 0.4, 1), t)
            bn = int(SR * B * 2); tb = np.arange(bn) / SR
            place(buf, 0.22 * np.sin(2 * np.pi * bass[bar] * sh * tb) * env(bn, 0.005, 0.6), t)
    return buf


def read_voice(path, t0, n):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    v = np.frombuffer(raw, dtype="<f4").astype(np.float64)
    out = np.zeros(n); i = int(t0 * SR); v = v[: max(0, n - i)]; out[i:i + len(v)] = v
    return out


def speech_mask(v):
    e = np.sqrt(box(v ** 2, int(SR * 0.05)))
    m = (e > 0.02).astype(float)
    return np.clip(box(m, int(SR * 0.35)) * 2, 0, 1)  # rampa suave, segura pausas curtas


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("events"); ap.add_argument("-o", default="audio.wav"); ap.add_argument("--voice")
    a = ap.parse_args()
    E = json.loads(Path(a.events).read_text())
    bpm, dur = E.get("bpm", 120), E["dur"]; n = int(SR * dur)
    loop = bool(E.get("loop", False)); nbuf = n + (int(SR * 2.5) if loop else 0)
    sfx = np.zeros(nbuf)
    for ev in E.get("events", []):
        f = SFX.get(ev["sfx"])
        if not f: sys.exit(f"sfx desconhecido: {ev['sfx']}")
        kw = {"g": ev.get("gain", 1.0)}
        if "len" in ev: kw["d"] = ev["len"]
        place(sfx, f(**kw), ev["t"])
    sc = score(dur, bpm, E.get("key", 0), E.get("bar0", 0), nbuf, loop) if E.get("score", True) else np.zeros(nbuf)
    def wrap(x):  # loop: o que passou do fim soma no começo
        y = x[:n].copy(); tail = x[n:]; y[:len(tail)] += tail[: n]; return y
    sc, sfx = wrap(sc), wrap(sfx)
    mix = sc + sfx
    if a.voice:
        v = read_voice(a.voice, E.get("voice_t0", 0), n); m = speech_mask(v)
        mix = sc * (1 - 0.65 * m) + sfx * (1 - 0.3 * m) + v
    mix = np.tanh(mix * 1.2) / np.tanh(1.2)  # limitador suave antes do loudnorm
    # -14 LUFS: mede com ebur128 e aplica o ganho nas próprias amostras (o loudnorm reamostra a 192 kHz e
    # deixa transiente nas bordas, o que quebra a emenda do loop)
    def write(path, x):
        with wave.open(str(path), "wb") as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((np.clip(np.stack([x, x], 1), -1, 1) * 32767).astype("<i2").tobytes())
    tmp = Path(a.o).with_suffix(".raw.wav"); write(tmp, mix)
    err = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(tmp), "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    tmp.unlink()
    li = float(err[err.rindex("I:"):].split()[1])
    out = mix * 10 ** ((-14 - li) / 20)
    pk = np.abs(out).max()
    if pk > 0.84:  # teto ~ -1,5 dBFS: limitador suave só no excesso
        out = np.where(np.abs(out) > 0.7, np.sign(out) * (0.7 + 0.14 * np.tanh((np.abs(out) - 0.7) / 0.14)), out)
    write(a.o, out)
    B = 60 / bpm
    beats = [round(i * B, 4) for i in range(int(dur / B) + 1) if i * B <= dur]
    Path(a.o).with_name("beats.json").write_text(json.dumps({"bpm": bpm, "beats": beats, "bars": beats[::4], "duration": dur}))
    print(f"ok → {a.o} + beats.json ({len(beats)} batidas)")


if __name__ == "__main__":
    main()
