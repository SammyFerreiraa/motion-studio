#!/usr/bin/env python3
"""Transcreve a voz gravada com timestamps por palavra → voz.json.

  voice_sync.py voz.wav [-o voz.json] [--lang pt]
Precisa de faster-whisper (scripts/setup.sh --voice). CPU, modelo "small".
"""
import argparse, json, os
os.environ.setdefault("HF_HUB_DISABLE_XET", "1")  # o downloader xet travou aqui; HTTP normal funciona
from faster_whisper import WhisperModel

ap = argparse.ArgumentParser()
ap.add_argument("audio"); ap.add_argument("-o", default="voz.json"); ap.add_argument("--lang", default="pt")
a = ap.parse_args()
m = WhisperModel("small", device="cpu", compute_type="int8")
segs, info = m.transcribe(a.audio, language=a.lang, word_timestamps=True, vad_filter=True)
out = {"duration": round(info.duration, 3), "segments": [
    {"text": s.text.strip(), "start": round(s.start, 3), "end": round(s.end, 3),
     "words": [{"w": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3)} for w in s.words]}
    for s in segs]}
json.dump(out, open(a.o, "w"), ensure_ascii=False, indent=1)
print(f"ok → {a.o}: {len(out['segments'])} frases, {out['duration']}s")
