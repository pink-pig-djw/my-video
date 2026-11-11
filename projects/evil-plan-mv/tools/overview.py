"""Overview of a rendered MV: stream info plus a contact sheet of frames sampled every --every seconds.

Usage: uv run --no-project --with pillow python tools/overview.py out/evil_plan_mv.mp4 render/review/overview.jpg [--every 6]
"""
import argparse, os, re, subprocess, tempfile
from pathlib import Path
from PIL import Image, ImageDraw

FFMPEG = os.environ.get('FFMPEG', 'D:/LenovoSoftstore/Install/Zipjieyasuo/ffmpeg.exe')
ap = argparse.ArgumentParser()
ap.add_argument('video'); ap.add_argument('out'); ap.add_argument('--every', type=float, default=6.0)
a = ap.parse_args()

info = subprocess.run([FFMPEG, '-hide_banner', '-i', a.video], capture_output=True, text=True, encoding='utf-8', errors='replace').stderr
for line in info.splitlines():
    if 'Duration' in line or 'Stream' in line:
        print(line.strip())
dur = re.search(r'Duration: (\d+):(\d+):([\d.]+)', info)
total = int(dur[1]) * 3600 + int(dur[2]) * 60 + float(dur[3])
with tempfile.TemporaryDirectory() as td:
    subprocess.run([FFMPEG, '-v', 'error', '-i', a.video, '-vf', f'fps=1/{a.every},scale=320:180', str(Path(td) / 'f%04d.jpg')], check=True)
    fs = sorted(Path(td).glob('f*.jpg'))
    cols = 8
    rows = (len(fs) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * 320, rows * 196), (16, 16, 16))
    d = ImageDraw.Draw(sheet)
    for i, f in enumerate(fs):
        x, y = (i % cols) * 320, (i // cols) * 196
        sheet.paste(Image.open(f), (x, y))
        t = i * a.every
        d.text((x + 4, y + 182), f'{int(t // 60)}:{t % 60:04.1f}', fill=(255, 220, 0))
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    sheet.save(a.out, quality=85)
print(f'duration {total:.2f}s, {len(fs)} samples -> {a.out}')
