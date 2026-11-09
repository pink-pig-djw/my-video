"""逐帧追踪手腕上的红绳结，写入 assets/frames/knots.json，红线就能接在真实动态镜头的手腕上。"""
import json
import os
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ni

ROOT = Path(__file__).resolve().parent.parent
out = {}
for name in sys.argv[1:]:
    fs = sorted((ROOT / 'assets' / 'frames' / name).glob('*.jpg'))
    pts, prev = [], None
    for f in fs:
        a = np.asarray(Image.open(f).convert('RGB').resize((960, 540)), float)
        if os.environ.get('LOOSE'):
            m = (a[..., 0] > 62) & (a[..., 0] > a[..., 1] * 1.45) & (a[..., 0] > a[..., 2] * 1.45)
        else:
            m = (a[..., 0] > 135) & (a[..., 1] < 72) & (a[..., 2] < 72) & (a[..., 0] > a[..., 1] * 2.2)
        lab, n = ni.label(ni.binary_dilation(m, iterations=2))
        best = None
        for i in range(1, n + 1):
            ys, xs = np.where(lab == i)
            if len(xs) < 8 or len(xs) > 2600:
                continue
            c = (xs.mean(), ys.mean())
            d = 0 if prev is None else np.hypot(c[0] - prev[0], c[1] - prev[1])
            if prev is not None and d > (130 if os.environ.get('LOOSE') else 70):
                continue
            score = d - min(len(xs), 200) * .04
            if best is None or score < best[0]:
                best = (score, c)
        if best:
            prev = best[1]
            pts.append([round(prev[0] / 960, 4), round(prev[1] / 540, 4)])
        else:
            pts.append(None)
    known = [i for i, p in enumerate(pts) if p]
    if known:  # 填补没检测到的帧，再平滑抖动
        xs = np.interp(range(len(pts)), known, [pts[i][0] for i in known])
        ys = np.interp(range(len(pts)), known, [pts[i][1] for i in known])
        k = np.ones(5) / 5
        xs = np.convolve(np.pad(xs, 2, mode='edge'), k, 'valid')
        ys = np.convolve(np.pad(ys, 2, mode='edge'), k, 'valid')
        out[name] = [[round(float(x), 4), round(float(y), 4)] for x, y in zip(xs, ys)]
    print(name, 'found', len(known), '/', len(pts), 'first', pts[known[0]] if known else None, 'last', pts[known[-1]] if known else None)
p = ROOT / 'assets' / 'frames' / 'knots.json'
old = json.loads(p.read_text()) if p.exists() else {}
old.update(out)
p.write_text(json.dumps(old))
