"""Mouth shapes for lip sync, painted by Codex and patched onto the cut sprites.

  crops   : uv run --no-project --with pillow --with numpy python tools/mouths.py crops spr_heart:0.477,0.133 ...
            (u, v = rough mouth position as fractions of the CUT image) -> assets/mouth/src/<pose>.png (1024x1024 face
            crop of the original generation, upscaled) + assets/mouth/src/<pose>.json (crop box in generation pixels)
  jobs    : ... python tools/mouths.py jobs spr_heart spr_pointcam > tools/jobs_mouths.json
  patches : ... python tools/mouths.py patches spr_heart spr_pointcam
            aligns each assets/mouth/raw/<pose>_<shape>.png to the source crop, finds where the mouth changed, colour-
            matches it to the original skin and writes assets/mouth/<pose>_<shape>.png (RGBA patch) + assets/mouth/<pose>.json
            (patch placement in CUT-image pixels), plus a review sheet render/review/mouths_<pose>.jpg
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets' / 'mouth' / 'src'
RAW = ROOT / 'assets' / 'mouth' / 'raw'
OUT = ROOT / 'assets' / 'mouth'
SHAPES = {
    'closed': "her lips gently closed in a soft, relaxed smile (a short curved line, no teeth)",
    'a': "her mouth opened wide as if singing a long, bright 'aah' — a big rounded open mouth with the upper teeth and the tongue visible",
    'o': "her mouth in a small round 'ooh' shape, lips softly rounded into a little circle, as if singing 'oh'",
}
EXTRA = {   # optional shapes, asked for with name+shape (e.g. spr_lab+e for a pose whose painted mouth is closed)
    'e': "her mouth slightly open in a relaxed singing 'eh' shape: a medium opening showing just the upper teeth, the corners softly smiling",
}
CROP = 0.30   # crop side as a fraction of the generation's width


def crops(specs):
    SRC.mkdir(parents=True, exist_ok=True)
    for sp in specs:
        name, uv = sp.split(':'); u, v = map(float, uv.split(','))
        meta = json.loads((ROOT / 'assets' / 'cut' / f'{name}.json').read_text())
        x0, y0, x1, y1 = meta['box']
        gen = Image.open(ROOT / 'assets' / 'gen' / f'{name}.png').convert('RGB')
        mx, my = x0 + u * (x1 - x0), y0 + v * (y1 - y0)          # mouth in generation pixels
        side = round(CROP * gen.width)
        cx, cy = mx, my - side * 0.12                              # keep the eyes and chin in view
        bx0 = int(round(min(max(cx - side / 2, 0), gen.width - side))); by0 = int(round(min(max(cy - side / 2, 0), gen.height - side)))
        crop = gen.crop((bx0, by0, bx0 + side, by0 + side)).resize((1024, 1024), Image.LANCZOS)
        crop.save(SRC / f'{name}.png')
        (SRC / f'{name}.json').write_text(json.dumps({'box': [bx0, by0, bx0 + side, by0 + side], 'mouth': [mx, my], 'cut': meta}))
        print(name, bx0, by0, side)


def jobs(names):
    out = []
    for n in names:
        n, *extra = n.split('+')
        for s, desc in [(k, v) for k, v in SHAPES.items() if not extra or k in extra] + [(e, EXTRA[e]) for e in extra if e in EXTRA]:
            out.append({'id': f'{n}_{s}', 'out': f'assets/mouth/raw/{n}_{s}.png', 'aspect': 'square', 'style': 'edit',
                        'refs': [f'assets/mouth/src/{n}.png'],
                        'prompt': 'Edit the attached image of this girl. Change ONLY her mouth: ' + desc + '. Everything else must stay '
                                  'exactly as in the attached image: the same framing and crop, face, eyes, eyebrows, blush, hair strands, '
                                  'headset microphone, clothes, colours, line art and lighting. Same art style as the attached image.'})
    print(json.dumps(out, ensure_ascii=False, indent=1))


def align(base, img, region, search=40):
    """translation of img that best matches base inside region (x0, y0, x1, y1), by brute-force SSD on a 1/2 grid"""
    b = np.asarray(base.convert('L'), np.float32)[::2, ::2]; m = np.asarray(img.convert('L'), np.float32)[::2, ::2]
    x0, y0, x1, y1 = [r // 2 for r in region]; s = search // 2
    ref = b[y0:y1, x0:x1]; best = (1e18, 0, 0)
    for dy in range(-s, s + 1):
        for dx in range(-s, s + 1):
            if y0 + dy < 0 or x0 + dx < 0 or y1 + dy > m.shape[0] or x1 + dx > m.shape[1]: continue
            d = ((m[y0 + dy:y1 + dy, x0 + dx:x1 + dx] - ref) ** 2).mean()
            if d < best[0]: best = (d, dx * 2, dy * 2)
    return best[1], best[2]


def patches(names):
    for n in names:
        meta = json.loads((SRC / f'{n}.json').read_text())
        bx0, by0, bx1, by1 = meta['box']; side = bx1 - bx0; sc = 1024 / side
        base = Image.open(SRC / f'{n}.png').convert('RGB')
        mx, my = (meta['mouth'][0] - bx0) * sc, (meta['mouth'][1] - by0) * sc   # mouth in crop pixels
        # align on the upper face (eyes, nose), which must not change
        reg = (int(mx - 260), int(my - 330), int(mx + 260), int(my - 70))
        res, shapes = {}, []
        for s in list(SHAPES) + list(EXTRA):
            p = RAW / f'{n}_{s}.png'
            if not p.exists():
                if s in SHAPES: print('missing', p)
                continue
            raw = Image.open(p).convert('RGB').resize((1024, 1024), Image.LANCZOS)
            dx, dy = align(base, raw, reg)
            al = Image.new('RGB', (1024, 1024)); al.paste(raw, (-dx, -dy))
            A, B = np.asarray(al, np.float32), np.asarray(base, np.float32)
            # where did the mouth change? (search a box around the expected mouth)
            diff = np.abs(A - B).sum(2)
            yy, xx = np.mgrid[0:1024, 0:1024]
            near = ((xx - mx) / 170) ** 2 + ((yy - (my + 25)) / 120) ** 2 < 1
            ch = (diff > 60) & near
            if ch.sum() < 50: print(n, s, 'no change found'); continue
            ys, xs = np.nonzero(ch); cx, cy = xs.mean(), ys.mean()
            rx = max(70, (xs.max() - xs.min()) / 2 + 34); ry = max(50, (ys.max() - ys.min()) / 2 + 30)
            res[s] = (al, cx, cy, rx, ry, dx, dy); shapes.append(s)
        if not res: continue
        # one patch region for all shapes (so switching never reveals the original mouth)
        cx = float(np.mean([r[1] for r in res.values()])); cy = float(np.mean([r[2] for r in res.values()]))
        rx = float(max(r[3] for r in res.values())); ry = float(max(r[4] for r in res.values()))
        yy, xx = np.mgrid[0:1024, 0:1024]
        dist = np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)
        alpha = np.clip((1.0 - dist) / 0.35, 0, 1)            # feathered ellipse
        ring = (dist > 1.0) & (dist < 1.35)
        B = np.asarray(base, np.float32)
        x0 = int(max(0, cx - rx - 4)); x1 = int(min(1024, cx + rx + 4)); y0 = int(max(0, cy - ry - 4)); y1 = int(min(1024, cy + ry + 4))
        info = {}
        cut = meta['cut']; cbx0, cby0 = cut['box'][0], cut['box'][1]
        for s, (al, *_r) in res.items():
            A = np.asarray(al, np.float32).copy()
            A += (B[ring].mean(0) - A[ring].mean(0))              # match the skin tone to the original
            rgba = np.dstack([np.clip(A, 0, 255), alpha * 255]).astype(np.uint8)[y0:y1, x0:x1]
            im = Image.fromarray(rgba, 'RGBA').resize((max(1, round((x1 - x0) / sc)), max(1, round((y1 - y0) / sc))), Image.LANCZOS)
            im.save(OUT / f'{n}_{s}.png')
        # placement in CUT-image pixels
        info = {'x': bx0 + x0 / sc - cbx0, 'y': by0 + y0 / sc - cby0, 'w': (x1 - x0) / sc, 'h': (y1 - y0) / sc, 'shapes': shapes}
        (OUT / f'{n}.json').write_text(json.dumps(info))
        # review: base | each aligned shape, zoomed on the mouth
        box = (int(cx - 220), int(cy - 200), int(cx + 220), int(cy + 160))
        tiles = [base.crop(box)]
        for s in shapes:
            comp = base.copy(); patch = Image.open(OUT / f'{n}_{s}.png').resize((x1 - x0, y1 - y0), Image.LANCZOS); comp.paste(patch, (x0, y0), patch)
            tiles.append(comp.crop(box))
        sheet = Image.new('RGB', (440 * len(tiles), 360)); d = ImageDraw.Draw(sheet)
        for i, t in enumerate(tiles): sheet.paste(t, (i * 440, 0)); d.text((i * 440 + 6, 6), (['base'] + shapes)[i], fill=(255, 255, 0))
        (ROOT / 'render' / 'review').mkdir(parents=True, exist_ok=True)
        sheet.save(ROOT / 'render' / 'review' / f'mouths_{n}.jpg', quality=90)
        print(n, 'patch', info)
    allm = {}
    for f in sorted(OUT.glob('*.json')): allm[f.stem] = json.loads(f.read_text())
    (ROOT / 'src' / 'data' / 'mouths.js').write_text('window.MOUTHS = ' + json.dumps(allm) + ';' + chr(10), encoding='utf-8')


if __name__ == '__main__':
    cmd, args = sys.argv[1], sys.argv[2:]
    {'crops': crops, 'jobs': jobs, 'patches': patches}[cmd](args)
