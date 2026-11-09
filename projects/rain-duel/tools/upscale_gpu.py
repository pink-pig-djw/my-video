"""GPU upscaling through Real-ESRGAN ncnn/Vulkan (works on the RTX 3050 without a CUDA torch build).

  stills: uv run --python 3.12 --no-project --with realesrgan-ncnn-py --with pillow python tools/upscale_gpu.py stills [names...]
          x4plus-anime on assets/gen/<name>.png → 2x size JPEG in assets/bg/<name>.jpg (all images when no names)
  clips : uv run ... python tools/upscale_gpu.py clips [clip names...]
          animevideov3-x2 on every frame of assets/clips/<clip>.mp4 → 1920x1080 JPEG in assets/frames/<clip>/
Files are written to a temp name and renamed, so a render that is reading them never sees half a file.
"""
import json
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path

from PIL import Image
from realesrgan_ncnn_py import Realesrgan

ROOT = Path(__file__).resolve().parent.parent
FF = 'D:/LenovoSoftstore/Install/Zipjieyasuo/ffmpeg.exe'
mode, names = sys.argv[1], sys.argv[2:]


def save(im, dst, **kw):
    tmp = dst.with_name(dst.stem + '.tmp' + dst.suffix)
    im.save(tmp, **kw)
    os.replace(tmp, dst)


if mode == 'stills':
    r = Realesrgan(gpuid=0, model=3, tilesize=256)
    out = ROOT / 'assets' / 'bg'
    out.mkdir(parents=True, exist_ok=True)
    srcs = [ROOT / 'assets' / 'gen' / f'{n}.png' for n in names] if names else sorted((ROOT / 'assets' / 'gen').glob('*.png'))
    for src in srcs:
        if src.stem.startswith('sp_'):
            continue
        t0 = time.time()
        im = Image.open(src).convert('RGB')
        big = r.process_pil(im).resize((im.width * 2, im.height * 2), Image.LANCZOS)
        save(big, out / f'{src.stem}.jpg', quality=93, subsampling=0)
        print(src.stem, big.size, f'{time.time() - t0:.1f}s', flush=True)
else:
    r = Realesrgan(gpuid=0, model=0, tilesize=0)
    fr = ROOT / 'assets' / 'frames'
    idx = json.loads((fr / 'index.json').read_text())
    clips = [ROOT / 'assets' / 'clips' / f'{n}.mp4' for n in names] if names else sorted((ROOT / 'assets' / 'clips').glob('*.mp4'))
    for c in clips:
        d = fr / c.stem
        d.mkdir(parents=True, exist_ok=True)
        t0 = time.time()
        with tempfile.TemporaryDirectory() as td:
            subprocess.run([FF, '-y', '-v', 'error', '-i', str(c), '-vf', 'fps=24', str(Path(td) / '%04d.png')], check=True)
            pngs = sorted(Path(td).glob('*.png'))
            for p in pngs:
                im = Image.open(p).convert('RGB')
                big = r.process_pil(im).resize((1920, 1080), Image.LANCZOS)
                save(big, d / f'{p.stem}.jpg', quality=94, subsampling=0)
        idx[c.stem] = len(pngs)
        (d / '.done').write_text('esrgan')
        print(c.stem, len(pngs), 'frames', f'{time.time() - t0:.0f}s', flush=True)
    (fr / 'index.json').write_text(json.dumps(idx, indent=0))
