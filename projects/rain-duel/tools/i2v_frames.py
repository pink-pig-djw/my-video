"""Crop the clip keyframes to 16:9 (1536x864) for PixVerse image2video; output assets/i2v/<name>.png.
The number is how far down (in px of the 1024-tall source) the crop starts; 80 is centred.
  uv run --no-project --with pillow python tools/i2v_frames.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OFF = {'k_jin_walk': 40, 'k_ling_stand': 30, 'k_jin_dash': 60, 'k_ling_dash': 40, 'k_exchange_a': 30, 'k_exchange_b': 30,
       'k_jin_swing': 20, 'k_ling_dive': 0, 'k_jin_deflect': 30, 'k_ling_fall': 80, 'k_train_a': 40, 'k_train_b': 40,
       'k_ling_under': 80, 'k_ling_rise': 80, 'k_jin_vortex': 80}
out = ROOT / 'assets' / 'i2v'
out.mkdir(parents=True, exist_ok=True)
for n, off in OFF.items():
    src = ROOT / 'assets' / 'gen' / f'{n}.png'
    if not src.exists():
        print('missing', n)
        continue
    im = Image.open(src).convert('RGB')
    w, h = im.size
    ch = round(w * 9 / 16)
    off = round(min(off * h / 1024, h - ch))
    im.crop((0, off, w, off + ch)).save(out / f'{n}.png')
    print(n, (w, ch), off)
