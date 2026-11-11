import json, numpy as np, soundfile as sf
from pathlib import Path
t_ = Path('src/data/lipkeys.js').read_text(encoding='utf-8')
SF = json.loads(t_.split('window.SF_LIP = ')[1].split(';')[0]); W = json.loads(t_.split('window.WORDT = ')[1].split(';')[0])
x, sr = sf.read('audio/vocals.wav', dtype='float32', always_2d=True); x = x.mean(1)
HZ = 100; hop = sr // HZ; win = sr // 40; n = len(x) // hop; pad = np.pad(x, (win // 2, win))
db = 20 * np.log10(np.array([np.sqrt(np.mean(pad[k * hop:k * hop + win] ** 2)) + 1e-9 for k in range(n)]))
locmax = np.array([db[max(0, k - 120):k + 120].max() for k in range(n)])
f0 = np.load('render/f0.npy'); f0 = np.pad(f0, (0, max(0, n - len(f0))))[:n]
voice = (db > locmax - 18) & (db > np.percentile(db, 5) + 10) & ((f0 == 0) | (f0 > 190))
kt = np.array([k[0] for k in SF]); ks = [k[1] for k in SF]
for li in ['23', '9', '12', '35']:
    a, b = W[li][0][0] - 0.1, W[li][-1][1] + 0.1
    runs = []; cur = None
    for k in range(int(a * HZ), int(b * HZ)):
        i = np.searchsorted(kt, k / HZ, side='right') - 1; s = ks[i] if i >= 0 else 'rest'
        bad = voice[k] and s == 'rest'
        if bad and cur is None: cur = k
        if not bad and cur is not None: runs.append((cur / HZ, k / HZ)); cur = None
    print(li, 'words', [round(w[0], 2) for w in W[li]], 'end', W[li][-1][1])
    print('   closed while voiced:', [(round(r0, 2), round(r1, 2), round(float(db[int(r0*HZ):int(r1*HZ)].mean() - locmax[int(r0*HZ)]), 1), int(np.median(f0[int(r0*HZ):int(r1*HZ)]))) for r0, r1 in runs if r1 - r0 >= 0.05])
