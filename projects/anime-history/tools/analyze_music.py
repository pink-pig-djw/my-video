"""Measure tempo, onsets and section changes of audio/suno.wav."""
import json
import numpy as np
from scipy.io import wavfile
from scipy.signal import stft, find_peaks
sr, x = wavfile.read('audio/suno.wav')
x = x.astype(float).mean(1) / 32768
print('dur', round(len(x) / sr, 3))
hop = 512
f, t, Z = stft(x, sr, nperseg=2048, noverlap=2048 - hop)
S = np.log1p(np.abs(Z) * 50)
flux = np.maximum(0, np.diff(S, axis=1)).sum(0)
flux = flux - np.convolve(flux, np.ones(43) / 43, 'same')
flux = np.maximum(flux, 0)
fr = sr / hop
def tempo(a, b):
    seg = flux[int(a * fr):int(b * fr)]
    ac = np.correlate(seg, seg, 'full')[len(seg) - 1:]
    lo, hi = int(fr * 60 / 200), int(fr * 60 / 50)
    k = lo + np.argmax(ac[lo:hi])
    return round(60 * fr / k, 1)
dur = len(x) / sr
print('tempo per 10s:', [(a, tempo(a, min(a + 10, dur))) for a in range(0, int(dur) - 2, 10)])
# rms per 2s and novelty between adjacent 4s windows of band energies
bands = np.array_split(np.arange(len(f)), 24)
B = np.stack([np.abs(Z[b]).mean(0) for b in bands])
B = np.log1p(B * 200)
n = int(fr * 3)
nov = []
tt = np.arange(n, B.shape[1] - n, int(fr * .25))
for i in tt:
    nov.append(np.linalg.norm(B[:, i - n:i].mean(1) - B[:, i:i + n].mean(1)))
nov = np.array(nov)
pk, _ = find_peaks(nov, distance=12, prominence=nov.std() * .5)
print('section changes:', [(round(float(tt[p] / fr), 2), round(float(nov[p]), 2)) for p in pk])
r = [round(20 * np.log10(np.sqrt((x[int(a * sr):int((a + 2) * sr)] ** 2).mean()) + 1e-6), 1) for a in np.arange(0, dur - 1, 2)]
print('rms/2s:', r)
# silences
fl = 20 * np.log10(np.abs(x[:len(x) // 2205 * 2205]).reshape(-1, 2205).max(1) + 1e-6)
q = np.where(fl < -40)[0]
print('quiet 50ms slots at s:', sorted(set(np.round(q * .05, 0).tolist())))
np.save('render/flux.npy', flux)
