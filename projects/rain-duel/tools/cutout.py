"""Key sprites out of their flat magenta (#FF00FF) backgrounds.

Usage:
  uv run --no-project --with pillow --with numpy --with scipy python tools/cutout.py single assets/gen/x.png [...]
  uv run ... python tools/cutout.py parts  assets/gen/x_parts.png [...]

single: writes assets/cut/<name>.png trimmed to the alpha box (+margin).
parts:  splits the sheet into connected pieces, writes assets/cut/<name>_<i>.png for each piece
        (ordered top-to-bottom, left-to-right), <name>_parts.json with each piece's box in the sheet,
        and assets/cut/<name>_sheet.png, a labelled contact sheet for checking.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "cut"
OUT.mkdir(parents=True, exist_ok=True)


def key(im, K=None):
    rgb = np.asarray(im.convert("RGB"), np.float32)
    if K is None:
        border = np.concatenate([rgb[:6].reshape(-1, 3), rgb[-6:].reshape(-1, 3), rgb[:, :6].reshape(-1, 3), rgb[:, -6:].reshape(-1, 3)])
        K = np.median(border, axis=0)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    green = K[1] > max(K[0], K[2])
    if green:   # "green amount": how much G exceeds max(R,B), relative to the key colour.
        km = K[1] - max(K[0], K[2])
        m = (g - np.maximum(r, b)) / max(km, 1)
    else:       # "magenta amount": how much min(R,B) exceeds G, relative to the key colour.
        km = min(K[0], K[2]) - K[1]
        m = (np.minimum(r, b) - g) / max(km, 1)
    # colour distance to the key, for pixels that are magenta-ish but darker/lighter
    d = np.sqrt(((rgb - K) ** 2).sum(-1))
    a = np.clip((1.0 - m - 0.08) / 0.8, 0, 1)
    a = np.where(d < 40, 0, a)
    a = np.where(d > 230, np.maximum(a, 1.0), a)
    # unmix the key colour from semi-transparent pixels
    al = a[..., None]
    fg = np.where((al > 0.01) & (al < 0.99), (rgb - (1 - al) * K) / np.maximum(al, 0.05), rgb)
    fg = np.clip(fg, 0, 255)
    # remove residual magenta tint (despill): G should not be far below min(R,B) on the subject edge
    if green:
        spill = fg[..., 1] - np.maximum(fg[..., 0], fg[..., 2])
        fg[..., 1] = np.where(spill > 0, fg[..., 1] - spill, fg[..., 1])   # nothing in these designs is green
        edge = a < .97                                                       # unmixed edge pixels drift olive: pull G down
        fg[..., 1] = np.where(edge, np.minimum(fg[..., 1], (fg[..., 0] + fg[..., 2]) / 2), fg[..., 1])
    else:
        spill = np.minimum(fg[..., 0], fg[..., 2]) - fg[..., 1]
        fix = (spill > 0) & (a < 1)
        fg[..., 0] = np.where(fix, fg[..., 0] - spill * 0.5, fg[..., 0])
        fg[..., 2] = np.where(fix, fg[..., 2] - spill * 0.5, fg[..., 2])
    alpha = (a * 255).astype(np.uint8)
    # clean speckles: drop tiny isolated alpha islands
    A = Image.fromarray(alpha)
    A = A.filter(ImageFilter.MedianFilter(3))
    rgba = np.dstack([fg.astype(np.uint8), np.asarray(A)])
    return Image.fromarray(rgba, "RGBA")


def trim(im, mg=6):
    a = np.asarray(im)[..., 3]
    ys, xs = np.nonzero(a > 8)
    if len(xs) == 0:
        return im, (0, 0, 0, 0)
    box = (max(0, xs.min() - mg), max(0, ys.min() - mg), min(im.width, xs.max() + 1 + mg), min(im.height, ys.max() + 1 + mg))
    return im.crop(box), box


def single(path):
    src = Path(path)
    im = key(Image.open(src))
    cut, box = trim(im)
    cut.save(OUT / f"{src.stem}.png", optimize=True)
    print(f"{src.stem}: {cut.width}x{cut.height} box={box}")


def parts(path, min_area=1500, join=9):
    src = Path(path)
    im = key(Image.open(src))
    a = np.asarray(im)[..., 3] > 30
    joined = ndimage.binary_dilation(a, iterations=join)
    lab, n = ndimage.label(joined)
    pieces = []
    for i in range(1, n + 1):
        mask = (lab == i) & a
        area = int(mask.sum())
        if area < min_area:
            continue
        ys, xs = np.nonzero(mask)
        pieces.append((ys.min(), xs.min(), ys.max(), xs.max(), i, area))
    # order rows top-to-bottom (by centre y bands), then left-to-right
    pieces.sort(key=lambda p: ((p[0] + p[2]) // 2 // 220, p[1]))
    meta = []
    arr = np.asarray(im)
    sheet = Image.new("RGBA", im.size, (40, 40, 40, 255))
    draw = ImageDraw.Draw(sheet)
    for k, (y0, x0, y1, x1, i, area) in enumerate(pieces):
        mask = (lab == i)
        piece = arr.copy()
        piece[..., 3] = np.where(mask, piece[..., 3], 0)
        pim = Image.fromarray(piece, "RGBA")
        cut, box = trim(pim)
        name = f"{src.stem}_{k}"
        cut.save(OUT / f"{name}.png", optimize=True)
        meta.append({"i": k, "name": name, "box": [int(v) for v in box], "w": cut.width, "h": cut.height})
        sheet.alpha_composite(cut, (box[0], box[1]))
        draw.rectangle(box, outline=(255, 255, 0, 255), width=3)
        draw.text((box[0] + 6, box[1] + 4), str(k), fill=(255, 255, 0, 255))
        print(f"{name}: {cut.width}x{cut.height} box={box}")
    (OUT / f"{src.stem}_parts.json").write_text(json.dumps(meta, indent=1), encoding="utf-8")
    sheet.convert("RGB").save(OUT / f"{src.stem}_sheet.png")


if __name__ == "__main__":
    mode = sys.argv[1]
    for p in sys.argv[2:]:
        (single if mode == "single" else parts)(p)
