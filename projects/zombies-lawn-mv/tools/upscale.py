"""Upscale the painted backgrounds for 1080p camera moves: Real-ESRGAN x4plus anime 6B (via spandrel), tiled on the CPU,
then resized to the stored width and saved as high-quality JPEG in assets/bg/.

  uv run --no-project --with torch --with spandrel --with pillow --with numpy --with huggingface_hub python tools/upscale.py \
      bg_yard_day:3072 bg_roof:3072 ...
(name[:width]; the source is assets/gen/<name>.png, or a path)
"""
import sys
import time
from pathlib import Path

import numpy as np
import torch
from huggingface_hub import hf_hub_download
from PIL import Image
from spandrel import ModelLoader

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'bg'
OUT.mkdir(parents=True, exist_ok=True)
torch.set_num_threads(10)
model = ModelLoader().load_from_file(hf_hub_download('ximso/RealESRGAN_x4plus_anime_6B', 'RealESRGAN_x4plus_anime_6B.pth')).model.eval()
TILE, PAD = 256, 16


def up(im):
    x = torch.from_numpy(np.asarray(im.convert('RGB'), np.float32) / 255).permute(2, 0, 1)[None]
    _, _, h, w = x.shape
    out = torch.zeros(1, 3, h * 4, w * 4)
    with torch.no_grad():
        for y0 in range(0, h, TILE):
            for x0 in range(0, w, TILE):
                a, b = max(0, y0 - PAD), max(0, x0 - PAD)
                c, d = min(h, y0 + TILE + PAD), min(w, x0 + TILE + PAD)
                o = model(x[:, :, a:c, b:d])
                oy, ox = (y0 - a) * 4, (x0 - b) * 4
                th, tw = min(TILE, h - y0) * 4, min(TILE, w - x0) * 4
                out[:, :, y0 * 4:y0 * 4 + th, x0 * 4:x0 * 4 + tw] = o[:, :, oy:oy + th, ox:ox + tw]
    arr = (out[0].permute(1, 2, 0).clamp(0, 1).numpy() * 255 + 0.5).astype(np.uint8)
    return Image.fromarray(arr)


for spec in sys.argv[1:]:
    name, _, width = spec.partition(':')
    src = Path(name) if name.endswith('.png') else ROOT / 'assets' / 'gen' / f'{name}.png'
    t0 = time.time()
    im = Image.open(src)
    big = up(im)
    wd = int(width) if width else im.width * 2
    big = big.resize((wd, round(big.height * wd / big.width)), Image.LANCZOS)
    dst = OUT / f'{src.stem}.jpg'
    big.save(dst, quality=93, subsampling=0)
    print(src.stem, big.size, f'{time.time() - t0:.0f}s', flush=True)
