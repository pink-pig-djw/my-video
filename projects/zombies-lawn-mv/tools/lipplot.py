"""Lip-sync check plot: vocal spectrogram + level with the sunflower's mouth keys as coloured bands (height = how open
the shape is), word starts and the phoneme alignment underneath.

  uv run --no-project --with numpy --with soundfile --with matplotlib --with scipy python tools/lipplot.py a b out.png
"""
import json
import sys
from pathlib import Path

import matplotlib
import numpy as np
import soundfile as sf
from scipy.signal import spectrogram

matplotlib.use('Agg')
import matplotlib.pyplot as plt  # noqa: E402

a, b, out = float(sys.argv[1]), float(sys.argv[2]), sys.argv[3]
OPEN = {'rest': 0, 'mbp': 0.02, 'fv': 0.12, 'ee': 0.3, 'oo': 0.32, 'r': 0.4, 'small': 0.42, 'l': 0.5, 'eh': 0.62, 'oh': 0.72,
        'ah': 0.85, 'ahh': 1.0}
COL = {'rest': '#666', 'mbp': '#d33', 'fv': '#f80', 'ee': '#ee4', 'oo': '#4cf', 'r': '#a6f', 'small': '#9c9', 'l': '#f6c',
       'eh': '#6e6', 'oh': '#38f', 'ah': '#fff', 'ahh': '#fff'}
t_ = Path('src/data/lipkeys.js').read_text(encoding='utf-8')
SF = json.loads(t_.split('window.SF_LIP = ')[1].split(';')[0])
WT = json.loads(t_.split('window.WORDT = ')[1].split(';')[0])
src = Path('src/data/timing.js').read_text(encoding='utf-8'); T = json.loads(src[src.index('{'):src.rindex('}') + 1])
PA = {r['i']: r for r in json.loads(Path('render/lipcheck/pa.json').read_text(encoding='utf-8'))}
x, sr = sf.read('audio/vocals.wav'); x = x.mean(1)
seg = x[int(a * sr):int(b * sr)]
fig, ax = plt.subplots(3, 1, figsize=(max(16, (b - a) * 3.2), 9), sharex=True, gridspec_kw={'height_ratios': [3, 1.2, 1]})
f, tt, S = spectrogram(seg, sr, nperseg=1024, noverlap=896)
m = f < 4000
ax[0].pcolormesh(tt + a, f[m], 10 * np.log10(S[m] + 1e-12), shading='auto', cmap='magma', vmin=-110, vmax=-30)
hop = sr // 100; n = len(seg) // hop
db = 20 * np.log10(np.sqrt((seg[:n * hop].reshape(n, hop) ** 2).mean(1)) + 1e-9)
ax[1].plot(a + np.arange(n) / 100, db, 'k', lw=0.8); ax[1].set_ylim(-70, -10); ax[1].set_ylabel('vocal dB')
# mouth keys
ks = [k for k in SF if a - 2 <= k[0] <= b]
for i, (t0, s) in enumerate(ks):
    t1 = ks[i + 1][0] if i + 1 < len(ks) else b
    if t1 < a or t0 > b: continue
    ax[2].add_patch(plt.Rectangle((t0, 0), t1 - t0, OPEN[s], color=COL[s], ec='k', lw=0.4))
    if t1 - t0 > 0.05: ax[2].text(t0 + 0.005, OPEN[s] + 0.03, s, fontsize=7, rotation=90)
ax[2].set_ylim(0, 1.4); ax[2].set_ylabel('mouth'); ax[2].set_facecolor('#223')
# words and phonemes
for i, ln in enumerate(T['lines']):
    w_ = WT.get(str(i))
    if not w_: continue
    for (w0, w1), w in zip(w_, ln['words']):
        if w0 > b or w1 < a: continue
        for k in (0, 1, 2): ax[k].axvline(w0, color='cyan', lw=0.8)
        ax[0].text(w0, 3750, w['w'], color='cyan', fontsize=9)
    for wd in PA.get(i, {}).get('words', []):
        for ph in wd['ph']:
            if ph[2] is None or ph[2] < a or ph[2] > b: continue
            ax[0].text(ph[2], 300, ph[0], color='lime', fontsize=8)
ax[2].set_xticks(np.arange(np.floor(a * 4) / 4, b, 0.25)); ax[2].tick_params(axis='x', labelsize=7, rotation=90); ax[2].grid(alpha=0.3)
plt.tight_layout(); plt.savefig(out, dpi=55)
