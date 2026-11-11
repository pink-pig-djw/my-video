"""Side-by-side review: the reference video (top) over our render (bottom), one pair per second.
uv run --no-project --with pillow python tools/compare.py ref_frames_dir our_frames_dir out_dir t_from t_to"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
ref, ours, out, a, b = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5])
out.mkdir(parents=True, exist_ok=True)
CW, COLS, ROWS = 240, 8, 4
try: font = ImageFont.truetype('arial.ttf', 16)
except Exception: font = ImageFont.load_default()
secs = list(range(a, b))
per = COLS * ROWS
for s in range(0, len(secs), per):
    chunk = secs[s:s + per]
    sheet = Image.new('RGB', (CW * COLS, 263 * ROWS), (20, 20, 20)); d = ImageDraw.Draw(sheet)
    for i, sec in enumerate(chunk):
        fr = ref / f'f_{sec + 1:04d}.jpg'; fo = ours / f'f_{sec + 1:04d}.jpg'
        x, y = (i % COLS) * CW, (i // COLS) * 263
        if fr.exists(): sheet.paste(Image.open(fr).convert('RGB').resize((CW, 128)), (x, y))
        if fo.exists(): sheet.paste(Image.open(fo).convert('RGB').resize((CW, 135)), (x, y + 128))
        d.rectangle([x, y, x + 52, y + 18], fill=(0, 0, 0)); d.text((x + 3, y + 1), f'{sec // 60}:{sec % 60:02d}.5', fill=(255, 230, 0), font=font)
        d.line([(x, y + 128), (x + CW, y + 128)], fill=(255, 0, 255), width=1)
    sheet.save(out / f'cmp_{a + s:03d}.jpg', quality=85)
print('ok')
