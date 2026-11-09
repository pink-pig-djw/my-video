"""Fit a beat grid to audio/suno.wav, print per-bar features, draw a spectrogram with bar lines."""
import numpy as np
from scipy.io import wavfile
from scipy.signal import stft
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
sr, x = wavfile.read('audio/suno.wav')
x = x.astype(float).mean(1) / 32768
dur = len(x) / sr
hop = 256
f, t, Z = stft(x, sr, nperseg=2048, noverlap=2048 - hop)
A = np.abs(Z)
S = np.log1p(A * 50)
flux = np.maximum(0, np.diff(S, axis=1)).sum(0)
flux -= np.convolve(flux, np.ones(87) / 87, 'same')
flux = np.maximum(flux, 0)
fr = sr / hop
tf = np.arange(len(flux)) / fr
best = None
for bpm in np.arange(116, 128, .02):
    b = 60 / bpm
    for ph in np.arange(0, b, .01):
        idx = ((np.arange(ph, dur, b)) * fr).astype(int)
        idx = idx[idx < len(flux)]
        s = flux[idx].mean()
        if best is None or s > best[0]:
            best = (s, bpm, ph)
s, bpm, ph = best
print('grid bpm', round(bpm, 2), 'phase', round(ph, 3), 'score', round(s / flux.mean(), 2))
# local drift: best phase per 20 s window
b = 60 / bpm
for a in range(0, int(dur) - 20, 20):
    sc = []
    for p in np.arange(-.2, .2, .01):
        idx = ((np.arange(ph + p, dur, b)) * fr).astype(int)
        idx = idx[(idx >= a * fr) & (idx < (a + 20) * fr)]
        sc.append(flux[idx].mean())
    print(a, 'offset', round(-.2 + .01 * int(np.argmax(sc)), 2), 'peak/mean', round(max(sc) / np.mean(sc), 2))
# downbeat: pick of 4 phases with strongest low-frequency onset
low = np.maximum(0, np.diff(S[f < 200], axis=1)).sum(0)
sc = [low[((np.arange(ph + k * b, dur, 4 * b)) * fr).astype(int).clip(0, len(low) - 1)].mean() for k in range(4)]
k = int(np.argmax(sc))
d0 = ph + k * b
print('downbeat offset', round(d0, 3), [round(v, 1) for v in sc])
bar = 4 * b
bars = np.arange(d0 % bar, dur, bar)
print('bars', len(bars), 'bar sec', round(bar, 4))
rows = []
for i, a in enumerate(bars):
    i0, i1 = int(a * fr), int((a + bar) * fr)
    seg = A[:, i0:i1]
    e = seg.mean(1)
    c = (f * e).sum() / e.sum()
    rows.append((i + 1, round(a, 2), round(20 * np.log10(e[f < 150].mean() + 1e-6), 1), round(20 * np.log10(e[(f > 3000)].mean() + 1e-6), 1), int(c), round(flux[i0:i1].mean(), 1)))
print('bar t low high cent flux')
for r in rows:
    print(*r)
fig, ax = plt.subplots(3, 1, figsize=(22, 11))
M = 20 * np.log10(A + 1e-5)
fb = np.geomspace(40, 16000, 160)
ii = np.searchsorted(f, fb).clip(0, len(f) - 1)
M2 = M[ii][:, ::8]
tt = np.arange(M2.shape[1]) * 8 / fr
for k, a in enumerate(ax):
    lo, hi = k * 66, (k + 1) * 66
    m = (tt >= lo) & (tt < hi)
    a.imshow(M2[:, m], origin='lower', aspect='auto', extent=[lo, hi, 0, 160], cmap='magma', vmin=-70, vmax=0)
    for j, v in enumerate(bars):
        if lo <= v < hi:
            a.axvline(v, color='w', lw=.3 if j % 4 else 1)
            if j % 4 == 0:
                a.text(v, 150, str(j + 1), color='cyan', fontsize=9)
    a.set_xticks(np.arange(lo, hi, 5))
plt.tight_layout()
plt.savefig('render/music_map.png', dpi=75)
