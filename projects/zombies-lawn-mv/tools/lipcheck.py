"""Check the sunflower's mouth keys against the isolated vocal (where the lead voice is actually sounding).

  uv run --no-project --with numpy --with soundfile python tools/lipcheck.py audio/vocals.wav src/data/lipkeys.js src/data/timing.js

For the lead's lines (and her echoes): voice = the vocal stem well above its local floor and, when pitched, above
190 Hz (her range, not the zombie's). Reports
  - voiced frames with a closed mouth (rest) — should be rare (m/b/p/f/v count as closed on purpose and are excluded)
  - frames in pauses (>= 0.15 s of silence) with an open mouth
  - mouth-open onset vs voice onset after a pause (median and share within ±70 ms)
"""
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

voc, keys, timing = sys.argv[1:4]
t_ = Path(keys).read_text(encoding='utf-8')
SF = json.loads(t_.split('window.SF_LIP = ')[1].split(';')[0])
src = Path(timing).read_text(encoding='utf-8'); T = json.loads(src[src.index('{'):src.rindex('}') + 1])
W = json.loads(t_.split('window.WORDT = ')[1].split(';')[0]) if 'WORDT' in t_ else {}
wav, sr = sf.read(voc, dtype='float32', always_2d=True); x = wav.mean(1)
HZ = 100; hop = sr // HZ; win = sr // 40; n = len(x) // hop; pad = np.pad(x, (win // 2, win))
db = 20 * np.log10(np.array([np.sqrt(np.mean(pad[k * hop:k * hop + win] ** 2)) + 1e-9 for k in range(n)]))
locmax = np.array([db[max(0, k - 120):k + 120].max() for k in range(n)])
f0 = np.load('render/f0.npy') if Path('render/f0.npy').exists() else np.zeros(n)
f0 = np.pad(f0, (0, max(0, n - len(f0))))[:n]
voice = (db > locmax - 18) & (db > np.percentile(db, 5) + 10) & ((f0 == 0) | (f0 > 190))
kt = np.array([k[0] for k in SF]); ks = [k[1] for k in SF]
def shape(t):
    i = np.searchsorted(kt, t, side='right') - 1
    return ks[i] if i >= 0 else 'rest'
CLOSED = {'rest'}; LIPS = {'mbp', 'fv'}
rows, bad_closed, bad_open, total_v, total_p, onsets = [], 0, 0, 0, 0, []
for i, ln in enumerate(T['lines']):
    if ln['who'] != 'S' or ln.get('opt'): continue
    wt = W.get(str(i))
    a = (wt[0][0] if wt else ln['t0']) - 0.1; b = (wt[-1][1] if wt else ln['t1']) + 0.1
    fr = range(int(a * HZ), int(b * HZ))
    vc = oc = vt = pt = 0
    for k in fr:
        t = k / HZ; s = shape(t)
        if voice[k]:
            vt += 1
            if s in CLOSED: vc += 1
        else:
            j0, j1 = max(0, k - 8), min(n, k + 8)
            if not voice[j0:j1].any():
                pt += 1
                if s not in CLOSED and s not in LIPS: oc += 1
        if voice[k] and k > 20 and not voice[k - 20:k].any():
            # voice onset after >= 0.2 s silence: when did the mouth open?
            opens = [kt[q] for q in range(len(kt)) if ks[q] not in CLOSED | LIPS and t - 0.4 <= kt[q] <= t + 0.4]
            if opens: onsets.append(min(opens, key=lambda v: abs(v - t)) - t)
    bad_closed += vc; bad_open += oc; total_v += vt; total_p += pt
    rows.append(f"{i:2d} {ln['en'][:42]:42s} voiced {vt / HZ:5.2f}s closed-while-singing {vc / HZ:4.2f}s | pauses {pt / HZ:4.2f}s open-in-pause {oc / HZ:4.2f}s")
print('\n'.join(rows))
on = np.array(onsets)
print(f"\nvoiced {total_v / HZ:.1f}s, mouth closed while singing {bad_closed / HZ:.2f}s ({100 * bad_closed / max(1, total_v):.1f}%)")
print(f"pauses {total_p / HZ:.1f}s, mouth open in pauses {bad_open / HZ:.2f}s ({100 * bad_open / max(1, total_p):.1f}%)")
if len(on): print(f"onsets {len(on)}: median {np.median(on) * 1000:+.0f} ms, within ±70 ms {100 * np.mean(np.abs(on) <= 0.07):.0f}%, within ±120 ms {100 * np.mean(np.abs(on) <= 0.12):.0f}%")
