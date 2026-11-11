"""Guess where each cut sprite's mouth is: the largest blob of mouth-pink pixels in the upper part of the figure.
Writes render/review/findmouth.jpg (crops with a cross at the guess) and prints name:u,v for tools/mouths.py crops."""
import sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
names = sys.argv[1:]
tiles, out = [], []
for n in names:
    im = Image.open(f'assets/cut/{n}.png').convert('RGBA'); W, H = im.size
    a = np.asarray(im, np.int32); R, G, B, A = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    top = int(H * 0.36)
    m = (A > 200) & (R > 150) & (R < 250) & (G > 70) & (G < 165) & (B > 70) & (B < 160) & (R - G > 55) & (np.abs(G - B) < 38)
    m[top:] = False
    lab, k = ndimage.label(ndimage.binary_dilation(m, iterations=2))
    if k == 0: out.append((n, None)); continue
    sizes = ndimage.sum(m, lab, range(1, k + 1)); best = int(np.argmax(sizes)) + 1
    ys, xs = np.nonzero((lab == best) & m); u, v = xs.mean() / W, ys.mean() / H
    out.append((n, (u, v, int(sizes[best - 1]))))
    cx, cy = int(u * W), int(v * H); box = (max(0, cx - 160), max(0, cy - 180), min(W, cx + 160), min(H, cy + 100))
    c = im.crop(box); bg = Image.new('RGBA', c.size, (90, 90, 100, 255)); bg.alpha_composite(c); t = bg.convert('RGB').resize((320, 280))
    d = ImageDraw.Draw(t); px, py = (cx - box[0]) * 320 / c.width, (cy - box[1]) * 280 / c.height
    d.line([(px - 14, py), (px + 14, py)], fill=(0, 255, 0), width=2); d.line([(px, py - 14), (px, py + 14)], fill=(0, 255, 0), width=2)
    d.text((4, 4), f'{n} {u:.3f},{v:.3f} n={int(sizes[best - 1])}', fill=(255, 255, 0)); tiles.append(t)
cols = 6; rows = (len(tiles) + cols - 1) // cols
sheet = Image.new('RGB', (320 * cols, 280 * rows), (20, 20, 20))
for i, t in enumerate(tiles): sheet.paste(t, ((i % cols) * 320, (i // cols) * 280))
sheet.save('render/review/findmouth.jpg', quality=88)
for n, r in out: print(n, 'NONE' if r is None else f'{r[0]:.4f},{r[1]:.4f} {r[2]}')
