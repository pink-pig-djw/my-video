"""Plot the vocal stem (level, pitch, spectrogram) with the current word times, for checking alignment by eye.
uv run --no-project --with numpy --with soundfile --with matplotlib --with scipy python tools/vplot.py a b out.png"""
import sys, json, numpy as np, soundfile as sf, matplotlib
matplotlib.use('Agg'); import matplotlib.pyplot as plt
from scipy.signal import spectrogram
a, b, out = float(sys.argv[1]), float(sys.argv[2]), sys.argv[3]
x, sr = sf.read('audio/vocals.wav'); x = x.mean(1)
seg = x[int(a * sr):int(b * sr)]
f0 = np.load('render/f0.npy'); vf = np.load('render/vf.npy')
src = open('src/data/timing.js', encoding='utf-8').read(); T = json.loads(src[src.index('{'):src.rindex('}') + 1])
fig, ax = plt.subplots(2, 1, figsize=(max(14, (b - a) * 1.6), 7), sharex=True, gridspec_kw={'height_ratios': [2, 1]})
f, t, S = spectrogram(seg, sr, nperseg=1024, noverlap=768)
m = f < 4000
ax[0].pcolormesh(t + a, f[m], 10 * np.log10(S[m] + 1e-12), shading='auto', cmap='magma', vmin=-110, vmax=-30)
tt = np.arange(len(f0)) * 0.01; k = (tt >= a) & (tt < b)
ax[0].plot(tt[k], np.where(vf[k], f0[k], np.nan), 'c.', ms=2)
hop = sr // 100; n = len(seg) // hop
db = 20 * np.log10(np.sqrt((seg[:n * hop].reshape(n, hop) ** 2).mean(1)) + 1e-9)
ax[1].plot(a + np.arange(n) / 100, db, 'k', lw=0.7); ax[1].set_ylim(-80, -10)
for ln in T['lines']:
    for w in ln['words']:
        if w['t1'] < a or w['t0'] > b: continue
        c = 'lime' if ln['who'] == 'S' and not ln['echo'] else ('orange' if ln['echo'] else 'red')
        ax[0].axvline(w['t0'], color=c, lw=0.8); ax[0].text(w['t0'], 3800, w['w'], color=c, fontsize=8, rotation=60)
        ax[1].axvline(w['t0'], color=c, lw=0.6)
ax[1].set_xticks(np.arange(np.floor(a), b, 0.5)); ax[1].grid(alpha=0.3)
plt.tight_layout(); plt.savefig(out, dpi=60)
