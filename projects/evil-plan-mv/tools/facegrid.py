"""Zoomed face crops with a fine normalised grid, for placing mouths on cut sprites.

Usage: uv run --no-project --with pillow python tools/facegrid.py out.jpg spr_a:u0,u1,v0,v1 spr_b:...
(u, v are fractions of the cut image's width/height; grid lines every 0.01, labelled every 0.05)
"""
import sys
from PIL import Image, ImageDraw
out, specs = sys.argv[1], sys.argv[2:]
tiles = []
for sp in specs:
    name, box = sp.split(':'); u0, u1, v0, v1 = map(float, box.split(','))
    im = Image.open(f'assets/cut/{name}.png').convert('RGBA'); W, H = im.size
    crop = im.crop((int(u0 * W), int(v0 * H), int(u1 * W), int(v1 * H)))
    bg = Image.new('RGBA', crop.size, (90, 90, 100, 255)); bg.alpha_composite(crop)
    scale = 640 / crop.width; bg = bg.convert('RGB').resize((640, int(crop.height * scale)), Image.LANCZOS)
    d = ImageDraw.Draw(bg)
    k = round(u0 * 100)
    while k <= u1 * 100:
        x = (k / 100 - u0) * W * scale
        d.line([(x, 0), (x, bg.height)], fill=(255, 60, 60) if k % 5 == 0 else (255, 180, 180), width=1)
        if k % 5 == 0: d.text((x + 2, 2), f'{k / 100:.2f}', fill=(255, 255, 0))
        k += 1
    k = round(v0 * 100)
    while k <= v1 * 100:
        y = (k / 100 - v0) * H * scale
        d.line([(0, y), (bg.width, y)], fill=(60, 160, 255) if k % 5 == 0 else (170, 210, 255), width=1)
        if k % 5 == 0: d.text((2, y + 2), f'{k / 100:.2f}', fill=(0, 255, 255))
        k += 1
    d.text((4, bg.height - 14), name, fill=(255, 255, 255))
    tiles.append(bg)
w = 640; h = max(t.height for t in tiles); cols = 2
sheet = Image.new('RGB', (w * cols, h * ((len(tiles) + cols - 1) // cols)), (20, 20, 20))
for i, t in enumerate(tiles): sheet.paste(t, ((i % cols) * w, (i // cols) * h))
sheet.save(out, quality=92)
