"""Word-level transcription of the song with faster-whisper.

Usage: uv run --with faster-whisper python tools/transcribe.py audio/song16k.wav audio/words.json [model]
The input must be a 16 kHz mono 16-bit WAV (decoded with ffmpeg first; the bundled PyAV path is broken).
"""
import json
import sys
import time
import wave

import numpy as np
from faster_whisper import WhisperModel

src, out = sys.argv[1], sys.argv[2]
name = sys.argv[3] if len(sys.argv) > 3 else "large-v3-turbo"

with wave.open(src, "rb") as wf:
    assert wf.getframerate() == 16000 and wf.getnchannels() == 1 and wf.getsampwidth() == 2
    audio = np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0

t0 = time.time()
model = WhisperModel(name, device="cpu", compute_type="int8", cpu_threads=12)
segments, info = model.transcribe(
    audio,
    language="en",
    word_timestamps=True,
    vad_filter=False,
    beam_size=5,
    condition_on_previous_text=False,
    initial_prompt="Sunflower. There's a zombie on your lawn. Petals, infantry, cholesterol, reevaluate, tricycle, the undead.",
)
words, segs = [], []
for s in segments:
    segs.append({"start": s.start, "end": s.end, "text": s.text})
    for w in s.words or []:
        words.append({"start": round(w.start, 3), "end": round(w.end, 3), "word": w.word, "p": round(w.probability, 3)})
    print(f"[{s.start:7.2f} -> {s.end:7.2f}] {s.text}", flush=True)
with open(out, "w", encoding="utf-8") as f:
    json.dump({"model": name, "words": words, "segments": segs}, f, ensure_ascii=False, indent=0)
print(f"done in {time.time() - t0:.0f}s, {len(words)} words")
