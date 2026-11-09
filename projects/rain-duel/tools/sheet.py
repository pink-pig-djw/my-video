"""Contact sheet for checking images: python tools/sheet.py out.jpg cols width img1 img2 ... (labels are file stems)."""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

out, cols, cw = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
ims = [Path(p) for p in sys.argv[4:]]
tiles = []
for p in ims:
    im = Image.open(p).convert('RGB')
    h = round(im.height * cw / im.width)
    tiles.append((p.stem, im.resize((cw, h), Image.LANCZOS)))
rows = [tiles[i:i + cols] for i in range(0, len(tiles), cols)]
H = sum(max(t[1].height for t in r) + 4 for r in rows)
sheet = Image.new('RGB', (cols * (cw + 4), H), (30, 30, 30))
d = ImageDraw.Draw(sheet)
y = 0
for r in rows:
    for k, (name, im) in enumerate(r):
        x = k * (cw + 4)
        sheet.paste(im, (x, y))
        d.rectangle([x, y, x + 8 * len(name) + 8, y + 16], fill=(0, 0, 0))
        d.text((x + 4, y + 2), name, fill=(255, 255, 0))
    y += max(t[1].height for t in r) + 4
sheet.save(out, quality=88)
print(out, sheet.size)
