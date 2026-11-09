"""Tile rendered stills into one labelled contact sheet.

Usage: uv run --no-project --with pillow python tools/sheet.py render/stills_full out.jpg [--cols 3] [--w 640]
"""
import argparse
from pathlib import Path

from PIL import Image, ImageDraw

ap = argparse.ArgumentParser()
ap.add_argument('dir'); ap.add_argument('out')
ap.add_argument('--cols', type=int, default=3); ap.add_argument('--w', type=int, default=640)
ap.add_argument('--only', default='')
a = ap.parse_args()
files = sorted(Path(a.dir).glob('t*.jpg'))
if a.only:
    keep = set(a.only.split(','))
    files = [f for f in files if f.stem in keep]
w = a.w; h = w * 9 // 16
rows = (len(files) + a.cols - 1) // a.cols
sheet = Image.new('RGB', (w * a.cols, (h + 4) * rows), (12, 12, 12))
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((w, h), Image.LANCZOS)
    x, y = (i % a.cols) * w, (i // a.cols) * (h + 4)
    sheet.paste(im, (x, y))
    d.rectangle([x, y + h - 20, x + 86, y + h], fill=(0, 0, 0))
    d.text((x + 5, y + h - 16), f.stem[1:], fill=(255, 220, 90))
sheet.save(a.out, quality=88)
print(a.out, len(files))
