"""按片段名抽帧拼图，用来检查走样：python tools/clipsheet.py out.jpg a b c"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw
out, names = sys.argv[1], sys.argv[2:]
W, H, C = 400, 225, 6
s = Image.new('RGB', (C * W, len(names) * H))
d = ImageDraw.Draw(s)
for r, n in enumerate(names):
    fs = sorted(Path(f'assets/frames/{n}').glob('*.jpg'))
    for i in range(C):
        f = fs[min(len(fs) - 1, int(i * (len(fs) - 1) / (C - 1)))]
        s.paste(Image.open(f).resize((W, H)), (i * W, r * H))
    d.text((6, r * H + 6), n, fill='yellow')
s.save(out, quality=85)
