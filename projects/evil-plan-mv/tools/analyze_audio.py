"""Beat, energy and structure analysis for the MV.

Usage: uv run --with librosa --with matplotlib python tools/analyze_audio.py audio/song.mp3 audio/analysis.json
Writes the JSON plus a PNG overview next to it.
"""
import json
import sys

import librosa
import matplotlib
import numpy as np

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

src, out = sys.argv[1], sys.argv[2]
SR = 22050
HOP = 512

y, sr = librosa.load(src, sr=SR, mono=True)
dur = len(y) / sr

# Harmonic/percussive split gives a cleaner beat grid on a vocal-heavy mix.
y_h, y_p = librosa.effects.hpss(y)
onset = librosa.onset.onset_strength(y=y_p, sr=sr, hop_length=HOP)
tempo, beats = librosa.beat.beat_track(onset_envelope=onset, sr=sr, hop_length=HOP, tightness=120)
tempo = float(np.atleast_1d(tempo)[0])
beat_t = librosa.frames_to_time(beats, sr=sr, hop_length=HOP)

# Downbeat phase: the beat-in-bar offset whose beats carry the most low-end onset energy.
S = np.abs(librosa.stft(y, hop_length=HOP))
low = librosa.onset.onset_strength(S=librosa.amplitude_to_db(S[:40]), sr=sr, hop_length=HOP)
scores = []
for ph in range(4):
    idx = beats[ph::4]
    scores.append(float(low[idx].mean()) if len(idx) else 0.0)
phase = int(np.argmax(scores))
downbeats = beat_t[phase::4]

# Energy curves at 10 Hz.
rms = librosa.feature.rms(y=y, hop_length=HOP)[0]
t_rms = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=HOP)
grid = np.arange(0, dur, 0.1)
rms_g = np.interp(grid, t_rms, rms)
rms_db = librosa.amplitude_to_db(rms_g, ref=np.max(rms_g))
perc = librosa.feature.rms(y=y_p, hop_length=HOP)[0]
perc_g = np.interp(grid, t_rms, perc)
harm = librosa.feature.rms(y=y_h, hop_length=HOP)[0]
harm_g = np.interp(grid, t_rms, harm)
cent = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=HOP)[0]
cent_g = np.interp(grid, t_rms, cent)

# Structure: beat-synchronous chroma + MFCC, agglomerative segmentation.
chroma = librosa.feature.chroma_cqt(y=y_h, sr=sr, hop_length=HOP)
mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20, hop_length=HOP)
feat = np.vstack([librosa.util.normalize(chroma), librosa.util.normalize(mfcc)])
feat_sync = librosa.util.sync(feat, beats, aggregate=np.median)
bounds = {}
for k in (12, 20, 28):
    b = librosa.segment.agglomerative(feat_sync, k)
    bt = [float(beat_t[min(i, len(beat_t) - 1)]) for i in b if i < len(beats)]
    bounds[str(k)] = bt


def smooth(a, n):
    k = np.ones(n) / n
    return np.convolve(a, k, mode="same")


result = {
    "duration": dur,
    "tempo": tempo,
    "beat_phase": phase,
    "beats": [round(float(t), 4) for t in beat_t],
    "downbeats": [round(float(t), 4) for t in downbeats],
    "grid_hz": 10,
    "rms_db": [round(float(v), 2) for v in rms_db],
    "perc": [round(float(v), 5) for v in perc_g],
    "harm": [round(float(v), 5) for v in harm_g],
    "centroid": [round(float(v), 1) for v in cent_g],
    "segments": bounds,
}
with open(out, "w", encoding="utf-8") as f:
    json.dump(result, f)

fig, ax = plt.subplots(3, 1, figsize=(26, 10), sharex=True)
ax[0].plot(grid, smooth(rms_db, 10), lw=0.8)
ax[0].set_ylabel("RMS dB (1s smooth)")
for t in bounds["20"]:
    for a in ax:
        a.axvline(t, color="r", lw=0.6, alpha=0.6)
ax[1].plot(grid, smooth(perc_g, 10), lw=0.8, color="g", label="perc")
ax[1].plot(grid, smooth(harm_g, 10), lw=0.8, color="m", label="harm")
ax[1].legend()
ax[2].plot(grid, smooth(cent_g, 10), lw=0.8, color="k")
ax[2].set_ylabel("centroid")
ax[2].set_xticks(np.arange(0, dur, 10))
for a in ax:
    a.grid(alpha=0.3)
plt.tight_layout()
plt.savefig(out.replace(".json", ".png"), dpi=70)
print(f"duration {dur:.2f}s tempo {tempo:.2f} beats {len(beat_t)} phase {phase} scores {scores}")
print("segments(20):", [round(t, 1) for t in bounds["20"]])
