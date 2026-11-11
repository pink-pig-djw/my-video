"""Mouth (and blink) frames for the lip sync: Codex repaints only the mouth on a face crop, the change is cut out as a
feathered patch and placed back on the cut sprite (from evil-plan-mv/tools/mouths.py, generalised to several targets).

  crops   : uv run --no-project --with pillow --with numpy python tools/mouths.py crops [target ...]
  jobs    : ... python tools/mouths.py jobs [target ...] > tools/jobs_mouths.json
  patches : ... python tools/mouths.py patches [target ...]
Targets are in TARGETS below (crop centre/side in generation px; search ellipses for the change in generation px).
Outputs: assets/mouth/src/<target>.png (1024 crop) · assets/mouth/raw/<target>_<shape>.png (Codex) ·
assets/mouth/<prefix><shape>.png (RGBA patch at generation scale) · src/data/mouths.js (window.MOUTHS[sprite] =
{mouth: {x, y, w, h}, eyes: {...}, shapes: [...]}, boxes in the cut sprite's px) · render/review/mouths_<target>.jpg
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).parent))
from cutout import key  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SRC, RAW, OUT = ROOT / 'assets' / 'mouth' / 'src', ROOT / 'assets' / 'mouth' / 'raw', ROOT / 'assets' / 'mouth'
SF_KEEP = ("Everything else must stay exactly as in the attached image: the same framing and crop, the same golden-brown face "
           "disc with its texture and shading, the same eyes, eyebrows and rosy cheeks, the same petals and dark outlines, the same "
           "lighting and art style. The sunflower has no teeth unless asked.")
SF_SHAPES = {
    'mbp': "her lips pressed firmly together into a short straight closed line with the corners slightly tucked, cheeks a little puffed, as when humming 'mmm' (no opening)",
    'fv': "her mouth almost closed: two small white upper front teeth rest on her lower lip, which is tucked in under them, as when singing 'f' or 'v'",
    'small': "her mouth slightly open in a small relaxed oval, as when singing a soft 'uh': dark brown inside with just a hint of a red tongue at the bottom",
    'ah': "her mouth opened wide in a big rounded singing 'aah': a tall dark brown opening with a red tongue at the bottom, the corners slightly turned up",
    'ahh': "her mouth opened as wide as it can go in a huge joyful belted 'AAAH': a very tall rounded dark opening reaching down toward her chin, red tongue at the bottom",
    'eh': "her mouth open medium-wide in a stretched singing 'eh': wider than tall, dark brown inside with the red tongue visible, the corners pulled sideways",
    'ee': "her mouth stretched into a wide smile with only a narrow dark opening between the lips (a wide thin crescent), as when singing 'ee'",
    'oh': "her mouth in a round open 'oh' shape: a medium-size circle, dark brown inside with the red tongue at the bottom",
    'oo': "her mouth pursed into a small tight round 'oo': the lips pushed forward into a little ring with a small dark hole",
    'l': "her mouth open medium with the red tongue tip raised and touching just behind the upper lip, as when singing 'la'",
    'r': "her mouth slightly open in a soft rounded-square shape with the lips pushed a little forward, as when singing 'r' or 'sh'",
}
Z_KEEP = ("Everything else must stay exactly as in the attached image: the same framing and crop, the same head, eyes, hair, "
          "skin colour, clothes, outlines, lighting and art style.")
Z_SHAPES = {
    'closed': "his mouth CLOSED: the grey-green lips shut in a flat, slightly crooked line (no opening, no teeth showing)",
    'wide': "his mouth opened very WIDE as if groaning or shouting a song: a big dark opening with a few crooked teeth on top and bottom, jaw dropped",
}
TARGETS = {
    # name: sprite, prefix, crop (cx, cy, side) in generation px, change ellipse (cx, cy, rx, ry), align box, shapes, keep text
    'sf': dict(src='assets/gen/sf_head.png', sprite='sf_head', prefix='sfm_', crop=(630, 640, 600), part='mouth',
               look=(635, 775, 235, 150), align=(440, 415, 840, 660), shapes=SF_SHAPES, keep=SF_KEEP, who='this sunflower'),
    'sfe': dict(src='assets/gen/sf_head.png', sprite='sf_head', prefix='sfe_', crop=(630, 640, 600), part='eyes',
                look=(640, 545, 230, 150), align=(400, 680, 870, 900),
                shapes={'closed': "BOTH EYES CLOSED happily: each eye is now just a short, thick, curved dark line arching upward (like ^ ^) at the height of the middle of the old eyes; the big black eye ovals are COMPLETELY gone, with no trace, shadow, outline or darker patch left where they were: there the face disc is the same smooth plain golden-brown texture as the rest of the face; the eyebrows stay",
                        'wink': "a playful WINK: ONLY the eye on the RIGHT side of the image is closed, drawn as a short, thick, curved dark line arching upward (like ^) at the height of the middle of the old eye, with no trace of the black oval left there (plain golden-brown face texture); the eye on the LEFT side of the image stays exactly as it is, open, with its white highlights; the eyebrows stay"},
                keep=SF_KEEP.replace('the same eyes, eyebrows and rosy cheeks', 'the same mouth, eyebrows and rosy cheeks'), who='this sunflower', change='eyes'),
}

# zombies: crop around the head found by tools/headbox.py (render/headboxes.json); the mouth sits in the lower part of
# the head, a little toward the side the zombie faces (left)
_HB = ROOT / 'render' / 'headboxes.json'
ZSRC = {'z_basic': '../pvz-remake/assets/gen/t_zombie.png'}
if _HB.exists():
    for zn, (x0, y0, x1, y1) in json.loads(_HB.read_text()).items():
        w, h = x1 - x0, y1 - y0
        TARGETS[zn] = dict(src=ZSRC.get(zn, f'assets/gen/{zn}.png'), sprite=zn, prefix=f'zm_{zn}_', part='mouth',
                           crop=(round((x0 + x1) / 2), round((y0 + y1) / 2 + h * 0.08), round(max(w, h) * 1.45)),
                           look=(x0 + w * 0.42, y0 + h * 0.8, w * 0.42, h * 0.3), align=(x0, y0, x1, y0 + h * 0.5),
                           shapes=Z_SHAPES, keep=Z_KEEP, who='this zombie')


def tgt(name):
    t = dict(TARGETS[name]); t.setdefault('change', 'mouth'); return t


def crops(names):
    SRC.mkdir(parents=True, exist_ok=True)
    for n in names:
        t = tgt(n); gen = Image.open(ROOT / t['src']).convert('RGB')
        cx, cy, side = t['crop']; x0, y0 = int(cx - side / 2), int(cy - side / 2)
        gen.crop((x0, y0, x0 + side, y0 + side)).resize((1024, 1024), Image.LANCZOS).save(SRC / f'{n}.png')
        print(n, (x0, y0, side))


def jobs(names):
    out = []
    for n in names:
        t = tgt(n)
        for s, desc in t['shapes'].items():
            out.append({'id': f'{n}_{s}', 'out': f'assets/mouth/raw/{n}_{s}.png', 'aspect': 'square', 'style': 'edit', 'refs': [f'assets/mouth/src/{n}.png'],
                        'prompt': f"Edit the attached close-up of {t['who']}'s face. Change ONLY the {t['change']}: {desc}. {t['keep']}"})
    print(json.dumps(out, ensure_ascii=False, indent=1))


def align(base, img, region, search=48):
    b = np.asarray(base.convert('L'), np.float32)[::2, ::2]; m = np.asarray(img.convert('L'), np.float32)[::2, ::2]
    x0, y0, x1, y1 = [int(r) // 2 for r in region]; s = search // 2
    ref = b[y0:y1, x0:x1]; best = (1e18, 0, 0)
    for dy in range(-s, s + 1):
        for dx in range(-s, s + 1):
            if y0 + dy < 0 or x0 + dx < 0 or y1 + dy > m.shape[0] or x1 + dx > m.shape[1]: continue
            d = ((m[y0 + dy:y1 + dy, x0 + dx:x1 + dx] - ref) ** 2).mean()
            if d < best[0]: best = (d, dx * 2, dy * 2)
    return best[1], best[2]


def patches(names):
    sprites = json.loads((lambda t: t[t.index('{'):t.rindex('}') + 1])((ROOT / 'src' / 'data' / 'sprites.js').read_text(encoding='utf-8')))
    mp = ROOT / 'src' / 'data' / 'mouths.js'
    allm = json.loads((lambda t: t[t.index('{'):t.rindex('}') + 1])(mp.read_text(encoding='utf-8'))) if mp.exists() else {}
    for n in names:
        t = tgt(n)
        cx, cy, side = t['crop']; X0, Y0 = int(cx - side / 2), int(cy - side / 2); sc = 1024 / side
        base = Image.open(SRC / f'{n}.png').convert('RGB'); B = np.asarray(base, np.float32)
        to = lambda gx, gy: ((gx - X0) * sc, (gy - Y0) * sc)
        ax0, ay0 = to(*t['align'][:2]); ax1, ay1 = to(*t['align'][2:])
        lx, ly = to(*t['look'][:2]); lrx, lry = t['look'][2] * sc, t['look'][3] * sc
        yy, xx = np.mgrid[0:1024, 0:1024]
        near = ((xx - lx) / lrx) ** 2 + ((yy - ly) / lry) ** 2 < 1
        res = {}
        for s in t['shapes']:
            p = RAW / f'{n}_{s}.png'
            if not p.exists(): print('missing', p); continue
            raw = Image.open(p).convert('RGB').resize((1024, 1024), Image.LANCZOS)
            dx, dy = align(base, raw, (ax0, ay0, ax1, ay1))
            al = Image.new('RGB', (1024, 1024)); al.paste(raw, (-dx, -dy))
            A = np.asarray(al, np.float32)
            ch = (np.abs(A - B).sum(2) > 70) & near
            if ch.sum() < 60: print(n, s, 'no change found'); continue
            ys, xs = np.nonzero(ch)
            res[s] = (A, xs.min(), ys.min(), xs.max(), ys.max(), dx, dy)
        if not res: continue
        # one ellipse for all shapes (switching never uncovers the painted mouth), feathered
        x0 = min(r[1] for r in res.values()); y0 = min(r[2] for r in res.values()); x1 = max(r[3] for r in res.values()); y1 = max(r[4] for r in res.values())
        ecx, ecy = (x0 + x1) / 2, (y0 + y1) / 2
        erx, ery = (x1 - x0) / 2 * 1.16 + 34, (y1 - y0) / 2 * 1.22 + 34    # generous: the feather must not reach a drawn edge
        dist = (np.abs((xx - ecx) / erx) ** 4 + np.abs((yy - ecy) / ery) ** 4) ** 0.25   # superellipse: covers the corners (tall eyes)
        alpha = np.clip((1.0 - dist) / 0.22, 0, 1)
        ring = (dist > 1.0) & (dist < 1.25)
        bx0, by0 = int(max(0, ecx - erx - 2)), int(max(0, ecy - ery - 2)); bx1, by1 = int(min(1024, ecx + erx + 2)), int(min(1024, ecy + ery + 2))
        cut = sprites[t['sprite']]; cbx, cby = cut['box'][0], cut['box'][1]
        gw, gh = (bx1 - bx0) / sc, (by1 - by0) / sc
        for s, (A, *_r) in res.items():
            A = A.copy(); A += (B[ring].mean(0) - A[ring].mean(0))
            rgba = np.dstack([np.clip(A, 0, 255), alpha * 255]).astype(np.uint8)[by0:by1, bx0:bx1]
            Image.fromarray(rgba, 'RGBA').resize((max(1, round(gw)), max(1, round(gh))), Image.LANCZOS).save(OUT / f"{t['prefix']}{s}.png")
        box = {'x': X0 + bx0 / sc - cbx, 'y': Y0 + by0 / sc - cby, 'w': gw, 'h': gh}
        if t['prefix'].startswith('zm_'):
            # zombies stand on transparency and a closed jaw is smaller than the painted gape: bake whole sprite variants,
            # blending colour AND alpha (keyed with the crop's own magenta) inside the feathered patch
            baseK = np.asarray(key(base), np.float32)
            K = np.median(np.asarray(base, np.float32)[baseK[..., 3] < 8], axis=0)
            spr = Image.open(ROOT / 'assets' / 'cut' / f"{t['sprite']}.png").convert('RGBA')
            for s, (A, *_r) in res.items():
                A = A.copy(); A += (B[ring].mean(0) - A[ring].mean(0)) * (baseK[ring][..., 3:].mean() > 128)
                rk = np.asarray(key(Image.fromarray(np.clip(A, 0, 255).astype(np.uint8)), K), np.float32)
                big = np.dstack([rk[..., :3] * rk[..., 3:] / 255, rk[..., 3:], alpha[..., None] * 255])   # premultiplied rgb, a, f
                small = np.asarray(Image.fromarray(np.clip(big[by0:by1, bx0:bx1], 0, 255).astype(np.uint8)[..., [0, 1, 2, 3]], 'RGBA')
                                   .resize((max(1, round(gw)), max(1, round(gh))), Image.LANCZOS), np.float32)
                fm = np.asarray(Image.fromarray((alpha[by0:by1, bx0:bx1] * 255).astype(np.uint8)).resize((small.shape[1], small.shape[0]), Image.LANCZOS), np.float32)[..., None] / 255
                S_ = np.asarray(spr, np.float32).copy()
                px, py = round(box['x']), round(box['y'])
                x0_, y0_ = max(0, px), max(0, py); x1_, y1_ = min(S_.shape[1], px + small.shape[1]), min(S_.shape[0], py + small.shape[0])
                reg = S_[y0_:y1_, x0_:x1_]; sm = small[y0_ - py:y1_ - py, x0_ - px:x1_ - px]; f = fm[y0_ - py:y1_ - py, x0_ - px:x1_ - px]
                bpm = reg[..., :3] * reg[..., 3:] / 255
                a = reg[..., 3:] * (1 - f) + sm[..., 3:] * f
                pm = bpm * (1 - f) + sm[..., :3] * f
                reg[..., :3] = np.where(a > 0.5, pm * 255 / np.maximum(a, 1e-3), 0); reg[..., 3:] = a
                S_[y0_:y1_, x0_:x1_] = reg
                Image.fromarray(np.clip(S_, 0, 255).astype(np.uint8), 'RGBA').save(ROOT / 'assets' / 'cut' / f"{t['sprite']}__{s}.png", optimize=True)
        ent = allm.setdefault(t['sprite'], {})
        ent[t['part']] = box; ent.setdefault('shapes', {})[t['part']] = list(res)
        # review sheet: base | each shape, zoomed
        rb = (int(max(0, ecx - erx * 1.5)), int(max(0, ecy - ery * 1.6)), int(min(1024, ecx + erx * 1.5)), int(min(1024, ecy + ery * 1.4)))
        tiles = [base.crop(rb)]
        for s in res:
            comp = base.copy(); pt = Image.open(OUT / f"{t['prefix']}{s}.png").resize((bx1 - bx0, by1 - by0), Image.LANCZOS); comp.paste(pt, (bx0, by0), pt)
            tiles.append(comp.crop(rb))
        tw, th = tiles[0].size; cols = min(6, len(tiles)); rows = (len(tiles) + cols - 1) // cols
        sheet = Image.new('RGB', (tw * cols, th * rows), (30, 30, 30)); d = ImageDraw.Draw(sheet)
        for i, tl in enumerate(tiles):
            sheet.paste(tl, ((i % cols) * tw, (i // cols) * th)); d.text(((i % cols) * tw + 6, (i // cols) * th + 6), (['base'] + list(res))[i], fill=(255, 255, 0))
        (ROOT / 'render' / 'review').mkdir(parents=True, exist_ok=True)
        sheet.save(ROOT / 'render' / 'review' / f'mouths_{n}.jpg', quality=90)
        print(n, 'patch', box, list(res))
    mp.write_text('// generated by tools/mouths.py\nwindow.MOUTHS = ' + json.dumps(allm) + ';\n', encoding='utf-8')


if __name__ == '__main__':
    cmd, args = sys.argv[1], sys.argv[2:] or list(TARGETS)
    {'crops': crops, 'jobs': jobs, 'patches': patches}[cmd](args)
