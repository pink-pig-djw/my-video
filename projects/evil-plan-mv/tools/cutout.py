"""Cut character sprites out of their plain backgrounds with the ISNet anime-segmentation model
(skytnt/anime-seg, isnetis.onnx in ~/.u2net), run directly through onnxruntime.

Usage: uv run --no-project --with onnxruntime --with pillow --with numpy python tools/cutout.py assets/gen/spr_*.png assets/claude_ref.jpg
Writes assets/cut/<name>.png (RGBA, trimmed to the alpha bounding box plus a small margin)
and assets/cut/<name>.json with the trimmed size, the crop box and the source size.
"""
import json
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "cut"
OUT.mkdir(parents=True, exist_ok=True)
MODEL = Path.home() / ".u2net" / "isnetis.onnx"
sess = ort.InferenceSession(str(MODEL), providers=["CPUExecutionProvider"])
INP = sess.get_inputs()[0].name
S = 1024


def mask_of(im):
    w0, h0 = im.size
    if h0 > w0:
        h, w = S, int(S * w0 / h0)
    else:
        h, w = int(S * h0 / w0), S
    ph, pw = S - h, S - w
    x = np.zeros((S, S, 3), np.float32)
    x[ph // 2:ph // 2 + h, pw // 2:pw // 2 + w] = np.asarray(im.resize((w, h), Image.LANCZOS), np.float32) / 255.0
    x = np.transpose(x, (2, 0, 1))[None]
    m = sess.run(None, {INP: x})[0][0, 0]
    m = m[ph // 2:ph // 2 + h, pw // 2:pw // 2 + w]
    m = Image.fromarray(np.clip(m * 255, 0, 255).astype(np.uint8)).resize((w0, h0), Image.LANCZOS)
    return m


for arg in sys.argv[1:]:
    src = Path(arg)
    if not src.is_absolute():
        src = ROOT / src
    im = Image.open(src).convert("RGB")
    a = mask_of(im)
    # Tighten the matte so no grey halo survives, then soften the edge by a pixel.
    a = a.point(lambda v: 0 if v < 40 else (255 if v > 215 else int((v - 40) * 255 / 175)))
    a = a.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    # Colour decontamination: the background is flat, so unmix it from semi-transparent edge pixels.
    rgb = np.asarray(im, np.float32)
    border = np.concatenate([rgb[:8].reshape(-1, 3), rgb[-8:].reshape(-1, 3), rgb[:, :8].reshape(-1, 3), rgb[:, -8:].reshape(-1, 3)])
    bg = np.median(border, axis=0)
    al = np.asarray(a, np.float32)[..., None] / 255.0
    edge = (al > 0.02) & (al < 0.98)
    fg = np.where(edge, (rgb - (1 - al) * bg) / np.maximum(al, 0.05), rgb)
    rgb = np.clip(fg, 0, 255).astype(np.uint8)
    rgba = Image.fromarray(rgb, "RGB").convert("RGBA")
    rgba.putalpha(a)
    box = a.point(lambda v: 255 if v > 10 else 0).getbbox()
    if box is None:
        print("EMPTY", src.name)
        continue
    mg = 10
    box = (max(0, box[0] - mg), max(0, box[1] - mg), min(im.width, box[2] + mg), min(im.height, box[3] + mg))
    cut = rgba.crop(box)
    name = src.stem
    cut.save(OUT / f"{name}.png", optimize=True)
    (OUT / f"{name}.json").write_text(json.dumps({"w": cut.width, "h": cut.height, "box": box, "src": [im.width, im.height]}), encoding="utf-8")
    print(f"{name}: {cut.width}x{cut.height} box={box}", flush=True)
