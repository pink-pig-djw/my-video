"""OpenArt clips → 24 fps frames at 1920x1080 in assets/frames/<clip>/, and assets/frames/index.json.
The film shows clips on twos (12 drawings/s → frames 1,3,5,...); those frames go through Real-ESRGAN x4plus-anime
(GPU when torch sees CUDA), the in-between frames are only resized.

  uv run --python 3.12 --no-project --with "torch==2.5.1+cu121" --with numpy --with pillow --with spandrel --with huggingface_hub \
      --extra-index-url https://download.pytorch.org/whl/cu121 --index-strategy unsafe-best-match python tools/clips.py [names...]
"""
import json
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
FF = 'D:/LenovoSoftstore/Install/Zipjieyasuo/ffmpeg.exe'
OUT = ROOT / 'assets' / 'frames'
OUT.mkdir(parents=True, exist_ok=True)
USE_ESRGAN = '--esrgan' in sys.argv
names = [a for a in sys.argv[1:] if not a.startswith('--')]

model = None


def esrgan():
    global model, torch, dev
    if model is None:
        import torch
        from huggingface_hub import hf_hub_download
        from spandrel import ModelLoader
        dev = 'cuda' if torch.cuda.is_available() else 'cpu'
        model = ModelLoader().load_from_file(hf_hub_download('ximso/RealESRGAN_x4plus_anime_6B', 'RealESRGAN_x4plus_anime_6B.pth')).model.eval().to(dev)
        if dev == 'cuda':
            model = model.half()
        print('esrgan on', dev, flush=True)
    return model


def up(im):
    m = esrgan()
    x = torch.from_numpy(np.asarray(im.convert('RGB'), np.float32) / 255).permute(2, 0, 1)[None].to(dev)
    if dev == 'cuda':
        x = x.half()
    _, _, h, w = x.shape
    T, P = 360, 16
    out = torch.zeros(1, 3, h * 4, w * 4, dtype=x.dtype, device=dev)
    with torch.no_grad():
        for y0 in range(0, h, T):
            for x0 in range(0, w, T):
                a, b, c, d = max(0, y0 - P), max(0, x0 - P), min(h, y0 + T + P), min(w, x0 + T + P)
                o = m(x[:, :, a:c, b:d])
                oy, ox = (y0 - a) * 4, (x0 - b) * 4
                th, tw = min(T, h - y0) * 4, min(T, w - x0) * 4
                out[:, :, y0 * 4:y0 * 4 + th, x0 * 4:x0 * 4 + tw] = o[:, :, oy:oy + th, ox:ox + tw]
    arr = (out[0].float().permute(1, 2, 0).clamp(0, 1).cpu().numpy() * 255 + .5).astype(np.uint8)
    return Image.fromarray(arr).resize((1920, 1080), Image.LANCZOS)


idx = json.loads((OUT / 'index.json').read_text()) if (OUT / 'index.json').exists() else {}
for c in sorted((ROOT / 'assets' / 'clips').glob('*.mp4')):
    if names and c.stem not in names:
        continue
    d = OUT / c.stem
    done = d / '.done'
    if done.exists() and done.stat().st_mtime > c.stat().st_mtime:
        idx[c.stem] = len(list(d.glob('*.jpg')))
        continue
    d.mkdir(exist_ok=True)
    for f in list(d.glob('*.jpg')) + list(d.glob('*.png')):
        f.unlink()
    subprocess.run([FF, '-y', '-v', 'error', '-i', str(c), '-vf', 'fps=24,scale=1280:720:flags=lanczos', str(d / '%04d.png')], check=True)
    t0 = time.time()
    pngs = sorted(d.glob('*.png'))
    for i, p in enumerate(pngs, 1):
        im = Image.open(p)
        if USE_ESRGAN and i % 2 == 1:
            big = up(im)
        else:
            big = im.resize((1920, 1080), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
        big.save(p.with_suffix('.jpg'), quality=94, subsampling=0)
        p.unlink()
    done.write_text('ok')
    idx[c.stem] = len(pngs)
    print(c.stem, len(pngs), 'frames', f'{time.time() - t0:.0f}s', flush=True)
(OUT / 'index.json').write_text(json.dumps(idx, indent=0))
print(idx)
