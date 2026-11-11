"""Check the lip sync against the isolated voice.

  uv run --no-project --with numpy --with soundfile --with pillow python tools/lipcheck.py audio/vocals.wav render/lipcheck/timeline.json render/lipcheck
(timeline.json comes from `node tools/liptimeline.js`.) Writes report.txt (per sung line: open mouth during silence, closed
mouth while she is singing, phrase start/end offsets, word-onset offsets) and strips_<k>.png (voice envelope under the
mouth shapes, one row per line) for looking at.
"""
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from PIL import Image, ImageDraw

voc_path, tl_path, out_dir = sys.argv[1], sys.argv[2], Path(sys.argv[3])
out_dir.mkdir(parents=True, exist_ok=True)
HZ = 100
wav, sr = sf.read(voc_path, dtype='float32', always_2d=True)
x = wav.mean(1)
hop, win = sr // HZ, sr // 25
n = len(x) // hop
pad = np.pad(x, (win // 2, win))
rms = np.array([np.sqrt(np.mean(pad[k * hop:k * hop + win] ** 2)) + 1e-9 for k in range(n)])
db = 20 * np.log10(rms)
peak = np.percentile(db, 99.5)
floor = np.percentile(db, 5)
TH = floor + 8
# the voice counts as stopped where it drops well below its own level around it (same rule as tools/lipkeys.py)
dbs = np.convolve(db, np.ones(3) / 3, mode='same')
locmax = np.array([dbs[max(0, k - 120):k + 120].max() for k in range(n)])
active = ~((dbs < locmax - 15) | (dbs < floor + 8))
def runs(mask):
    out, k = [], 0
    while k < len(mask):
        j = k
        while j < len(mask) and mask[j] == mask[k]: j += 1
        out.append((bool(mask[k]), k, j)); k = j
    return out
for _ in range(2):
    for v, a, b in runs(active):
        if b - a < 8: active[a:b] = not v
smooth = np.convolve(db, np.ones(3) / 3, mode='same')
flux = np.maximum(0, np.diff(smooth, prepend=smooth[0]))

TL = json.loads(Path(tl_path).read_text(encoding='utf-8'))
shapes = TL['shapes']; lines = TL['lines']; plan = set(TL['plan'])
OPEN = {'a', 'o', 'base', 'e'}
rep, allw, stats, onset_d = [], [], [], []
for v, a, b in runs(active):
    if not v or a < 10 or active[a - 10:a].any(): continue
    if not shapes[a] and not shapes[min(len(shapes) - 1, a + 10)]: continue   # not a sung moment
    OPN = ('a', 'o', 'base', 'e')
    tr = [k for k in range(max(1, a - 50), min(len(shapes), a + 50)) if shapes[k] in OPN and shapes[k - 1] not in OPN]
    onset_d.append(min(((k - a) / HZ for k in tr), key=abs) if tr else None)
for i, ln in enumerate(lines):
    if i not in plan: continue
    f0, f1 = int((ln['t0'] - 0.08) * HZ), min(n, int((ln['t1'] + 0.12) * HZ))
    sh = shapes[f0:f1]; act = active[f0:f1]
    dil = np.convolve(act.astype(float), np.ones(9), mode='same') > 0      # ±40 ms tolerance
    ero = np.convolve(act.astype(float), np.ones(9), mode='same') >= 9
    op_sil = [k for k, s in enumerate(sh) if s in OPEN and not dil[k]]
    cl_voi = [k for k, s in enumerate(sh) if s == 'closed' and ero[k]]
    def longest(idx):
        best, cur, prev = 0, 0, -9
        for k in idx: cur = cur + 1 if k == prev + 1 else 1; best = max(best, cur); prev = k
        return best * 10
    # phrase start: first voiced frame within ±0.4 s of the first word that follows ≥150 ms of quiet
    t0 = ln['t0']; on_err = None
    for k in range(int((t0 - 0.4) * HZ), int((t0 + 0.4) * HZ)):
        if 0 < k < n and active[k] and not active[max(0, k - 15):k].any():
            on_err = k / HZ - t0; break
    # word onsets: nearest energy rise (flux peak ≥ 2.5 dB/10 ms) within ±0.15 s
    werr = []
    for w in ln['words']:
        a, b = int((w['t0'] - 0.15) * HZ), int((w['t0'] + 0.15) * HZ)
        seg = flux[max(0, a):b]
        if len(seg) and seg.max() >= 2.5:
            werr.append((max(0, a) + int(seg.argmax())) / HZ - w['t0'])
    allw += werr
    stats.append({'i': i, 'op_sil_ms': len(op_sil) * 10, 'op_sil_run': longest(op_sil), 'cl_voi_ms': len(cl_voi) * 10, 'cl_voi_run': longest(cl_voi),
                  'on_err': on_err, 'w_med': float(np.median(werr)) if werr else None, 'dur': (f1 - f0) * 10})
lines_txt = []
for s in stats:
    flag = []
    if s['op_sil_run'] >= 150: flag.append(f"mouth open in silence {s['op_sil_run']}ms")
    if s['cl_voi_run'] >= 200: flag.append(f"mouth shut while singing {s['cl_voi_run']}ms")
    if s['on_err'] is not None and abs(s['on_err']) >= 0.1: flag.append(f"phrase start off {s['on_err']*1000:+.0f}ms")
    w = f"{s['w_med']*1000:+.0f}" if s['w_med'] is not None else '  -'
    on = f"{s['on_err']*1000:+.0f}" if s['on_err'] is not None else '   -'
    lines_txt.append(f"L{s['i']:3d} {lines[s['i']]['t0']:7.2f}  open-silent {s['op_sil_ms']:4d}ms (run {s['op_sil_run']:3d})  shut-voiced {s['cl_voi_ms']:4d}ms (run {s['cl_voi_run']:3d})  start {on:>5}  words {w:>5}  {'; '.join(flag)}  | {' '.join(x['w'] for x in lines[s['i']]['words'])}")
aw = np.array(allw)
nopen = sum(1 for d in onset_d if d is None); od = np.array([d for d in onset_d if d is not None] or [0.0])
summary = [f"voice level: peak {peak:.1f} dB, floor {floor:.1f} dB",
           f"voice onsets after a stop: {len(onset_d)}, mouth already open (never closed in the stop) {nopen}; mouth opening vs onset: median {np.median(od)*1000:+.0f} ms, |d| median {np.median(np.abs(od))*1000:.0f} ms, within ±70 ms {np.mean(np.abs(od) <= 0.07)*100:.0f}%, off by >150 ms {np.mean(np.abs(od) > 0.15)*100:.0f}%",
           f"word onsets: n={len(aw)} median {np.median(aw)*1000:+.0f} ms, mean abs {np.mean(np.abs(aw))*1000:.0f} ms, |err|>100ms {np.mean(np.abs(aw) > 0.1)*100:.0f}%",
           f"open mouth during silence: {sum(s['op_sil_ms'] for s in stats)/1000:.1f}s of {sum(s['dur'] for s in stats)/1000:.1f}s sung; shut while singing {sum(s['cl_voi_ms'] for s in stats)/1000:.1f}s",
           f"flagged lines: {sum(1 for t in lines_txt if 'ms' in t.split('|')[0].split('words')[1])}"]
(out_dir / 'report.txt').write_text('\n'.join(summary + [''] + lines_txt) + '\n', encoding='utf-8')
print('\n'.join(summary))
# strips: one row per sung line, voice envelope (grey), active (green), mouth shapes (colour bar), word starts (ticks)
COL = {'a': (230, 80, 60), 'o': (240, 170, 40), 'base': (120, 180, 240), 'e': (120, 180, 240), 'closed': (60, 60, 70), '': (0, 0, 0)}
ids = [s['i'] for s in stats]; per = 20; PX = 2   # 2 px per 10 ms
for c in range(0, len(ids), per):
    sub = ids[c:c + per]; Wd = max(int((lines[i]['t1'] - lines[i]['t0'] + 0.6) * HZ) * PX for i in sub) + 120
    im = Image.new('RGB', (Wd, 70 * len(sub)), (20, 20, 24)); d = ImageDraw.Draw(im)
    for r, i in enumerate(sub):
        y0 = r * 70; f0 = int((lines[i]['t0'] - 0.3) * HZ); f1 = int((lines[i]['t1'] + 0.3) * HZ)
        d.text((4, y0 + 4), f'L{i}', fill=(255, 255, 255)); d.text((4, y0 + 18), f"{lines[i]['t0']:.1f}", fill=(160, 160, 160))
        for k in range(f0, min(f1, n)):
            x0 = 110 + (k - f0) * PX; h = int(np.clip((db[k] - floor) / (peak - floor), 0, 1) * 40)
            d.rectangle([x0, y0 + 48 - h, x0 + PX - 1, y0 + 48], fill=(90, 200, 110) if active[k] else (110, 110, 110))
            d.rectangle([x0, y0 + 52, x0 + PX - 1, y0 + 64], fill=COL.get(shapes[k] if k < len(shapes) else '', (0, 0, 0)))
        for w in lines[i]['words']:
            x0 = 110 + int((w['t0'] * HZ - f0)) * PX; d.line([x0, y0 + 2, x0, y0 + 66], fill=(255, 255, 255)); d.text((x0 + 2, y0 + 2), w['w'][:10], fill=(230, 230, 230))
    im.save(out_dir / f'strips_{c // per}.png')
print('strips', (len(ids) + per - 1) // per)
