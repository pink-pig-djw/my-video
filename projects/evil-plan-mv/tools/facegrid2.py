"""Gridded face crops (1 grid line per 0.01 of the cut image, labels every 0.05) around rough centres.
Usage: python tools/facegrid2.py out_prefix name:u,v [...]   (6 crops per sheet)"""
import sys
from PIL import Image, ImageDraw
pre, specs = sys.argv[1], sys.argv[2:]
tiles = []
for sp in specs:
    n, uv = sp.split(':'); u, v = map(float, uv.split(','))
    im = Image.open(f'assets/cut/{n}.png').convert('RGBA'); W, H = im.size
    hw, hh = 0.11, 0.06 * W / H * 1.6          # window half-size in u and v
    u0, u1, v0, v1 = max(0, u - hw), min(1, u + hw), max(0, v - hh), min(1, v + hh * 1.3)
    c = im.crop((int(u0 * W), int(v0 * H), int(u1 * W), int(v1 * H)))
    bg = Image.new('RGBA', c.size, (90, 90, 100, 255)); bg.alpha_composite(c)
    s = 600 / c.width; t = bg.convert('RGB').resize((600, int(c.height * s)), Image.LANCZOS); d = ImageDraw.Draw(t)
    k = int(u0 * 100)
    while k / 100 <= u1:
        x = (k / 100 - u0) * W * s
        if x >= 0: d.line([(x, 0), (x, t.height)], fill=(255, 40, 40) if k % 5 == 0 else (255, 170, 170), width=1)
        if k % 5 == 0 and x >= 0: d.text((x + 2, 2), f'{k / 100:.2f}', fill=(255, 255, 0))
        k += 1
    k = int(v0 * 100)
    while k / 100 <= v1:
        y = (k / 100 - v0) * H * s
        if y >= 0: d.line([(0, y), (t.width, y)], fill=(40, 140, 255) if k % 5 == 0 else (170, 210, 255), width=1)
        if y >= 0: d.text((2, y + 1), f'{k / 100:.2f}', fill=(0, 255, 255))
        k += 1
    d.rectangle([0, t.height - 16, 260, t.height], fill=(0, 0, 0)); d.text((4, t.height - 14), f'{n} {W}x{H}', fill=(255, 255, 255))
    tiles.append(t)
for p in range(0, len(tiles), 6):
    sub = tiles[p:p + 6]; h = max(x.height for x in sub)
    sheet = Image.new('RGB', (600 * 3, h * 2), (20, 20, 20))
    for i, x in enumerate(sub): sheet.paste(x, ((i % 3) * 600, (i // 3) * h))
    sheet.save(f'{pre}_{p // 6}.jpg', quality=90)
print('sheets', (len(tiles) + 5) // 6)
