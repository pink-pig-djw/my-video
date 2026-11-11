"""Build the MV's sprites and frame atlases from the Codex images.

  uv run --no-project --with pillow --with numpy --with scipy python tools/build.py [names...]

- SINGLE: key out the flat magenta, trim -> assets/cut/<name>.png (+ anchor, box in generation px)
- PARTS: split a parts sheet into its pieces -> assets/cut/<name>_<i>.png (+ assets/cut/<name>_sheet.png to check)
- SHEETS: 4x2 animation sheets -> atlas assets/anim/<name>.png, frames anchored on the planted feet and scaled so the
  zombie's skull is as wide as in the game's walk cycle (41 logical units; atlas stored at 3 px per unit)
- the walk cycles of pvz-remake are reused as they are (assets/anim/zw_*.png)
Writes src/data/sprites.js (window.SPRITES) and src/data/anims.js (window.ANIMS), keeping entries of names not rebuilt.
"""
import json
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).parent))
from cutout import key, trim  # noqa: E402

GEN, CUT, ANIM = ROOT / 'assets' / 'gen', ROOT / 'assets' / 'cut', ROOT / 'assets' / 'anim'
CUT.mkdir(parents=True, exist_ok=True); ANIM.mkdir(parents=True, exist_ok=True)
REMAKE = ROOT.parent / 'pvz-remake'
RES, SKULL = 3.0, 41.0

# name: anchor (u, v) of the trimmed sprite; 'neck' / 'feet' are computed
SINGLE = {
    'sf_head': (0.5, 0.70), 'sf_body': 'feet', 'stage': (0.5, 1.0), 'mic': (0.5, 1.0), 'brain': (0.5, 0.5), 'plate': (0.5, 0.5),
    'heart': (0.5, 0.5), 'z_football': 'feet', 'z_cone': 'feet', 'z_door': 'feet', 'z_trike': 'feet', 'z_butter': 'feet',
    'z_dolphin': (0.5, 0.75), 'z_bungee': (0.5, 0.0), 'robot_foot': (0.5, 1.0), 'title_brains': (0.5, 0.5),
    'title_undead': (0.5, 0.5), 'title_end': (0.5, 0.5), 'z_basic': 'feet',
    'sun': (0.5, 0.5), 'peashooter': 'feet', 'wallnut': 'feet', 'sunflower_small': 'feet',
}
# sprites taken from the pvz-remake's own Codex art (same look)
REMAKE_SRC = {'z_basic': 't_zombie.png', 'sun': 'sun.png', 'peashooter': 't_peashooter.png', 'wallnut': 'wallnut.png',
              'sunflower_small': 'sunflower.png', 'zparts2': 'zparts2.png', 'cones': 'cones.png'}
PARTS = ['jaws', 'petal', 'fog', 'plants_a', 'plants_b', 'zparts2', 'cones', 'melon']
SHEETS = {'zdance_a': 'feet', 'zdance_b': 'feet', 'zduck': 'ring', 'zdance_c': 'feet', 'zduck2': 'ring',
          'zwalk12': ('tie', 4, 3), 'zwalk12_head': ('tie', 4, 3)}
SCALE_FROM = {'zwalk12_head': 'zwalk12'}       # edited sheets: same drawing size as their source
REMAKE_ANIMS = ['zw_walk', 'zw_walk_head', 'zw_idle', 'zw_walk_arm']


def load_js(p, var):
    if not p.exists(): return {}
    t = p.read_text(encoding='utf-8'); return json.loads(t[t.index('{'):t.rindex('}') + 1])


def feet_anchor(a):
    ys, xs = np.nonzero(a > 128)
    bottom = ys.max(); top = ys.min()
    band = (ys > bottom - (bottom - top) * 0.06)
    return float(xs[band].mean()) / a.shape[1], 1.0


def single(name):
    src = REMAKE / 'assets' / 'gen' / REMAKE_SRC[name] if name in REMAKE_SRC else GEN / f'{name}.png'
    im = key(Image.open(src))
    cut, box = trim(im)
    cut.save(CUT / f'{name}.png', optimize=True)
    a = np.asarray(cut)[..., 3]
    anc = SINGLE[name]
    info = {'w': cut.width, 'h': cut.height, 'box': [int(v) for v in box], 'gen': [im.width, im.height]}
    if anc == 'feet':
        info['ax'], info['ay'] = feet_anchor(a)
    else:
        info['ax'], info['ay'] = anc
    if name == 'sf_body':      # the stem tip: centre of the top 3% of the sprite
        ys, xs = np.nonzero(a > 128); top = ys.min(); sel = ys < top + cut.height * 0.03
        info['neck'] = [float(xs[sel].mean()) / cut.width, float(top + cut.height * 0.03) / cut.height]
        info['ax'] = info['neck'][0]    # stand under the stem, not under the lowest leaf tip
    print(name, cut.size, {k: v for k, v in info.items() if k in ('ax', 'ay', 'neck')})
    return info


def parts(name, min_area=1500, join=9):
    im = key(Image.open(REMAKE / 'assets' / 'gen' / REMAKE_SRC[name] if name in REMAKE_SRC else GEN / f'{name}.png'))
    a = np.asarray(im)[..., 3] > 30
    lab, n = ndimage.label(ndimage.binary_dilation(a, iterations=join))
    pieces = []
    for i in range(1, n + 1):
        m = (lab == i) & a
        if m.sum() < min_area: continue
        ys, xs = np.nonzero(m)
        pieces.append((ys.min(), xs.min(), ys.max(), xs.max(), i))
    H = im.height
    pieces.sort(key=lambda p: (int((p[0] + p[2]) / 2 // (H / 2.2)), p[1]))
    arr = np.asarray(im); out = {}
    sheet = Image.new('RGBA', im.size, (40, 40, 40, 255))
    from PIL import ImageDraw
    d = ImageDraw.Draw(sheet)
    for k, (y0, x0, y1, x1, i) in enumerate(pieces):
        piece = arr.copy(); piece[..., 3] = np.where(lab == i, piece[..., 3], 0)
        cut, box = trim(Image.fromarray(piece, 'RGBA'))
        nm = f'{name}_{k}'
        cut.save(CUT / f'{nm}.png', optimize=True)
        aa = np.asarray(cut)[..., 3]
        fx, fy = feet_anchor(aa)
        out[nm] = {'w': cut.width, 'h': cut.height, 'box': [int(v) for v in box], 'ax': fx, 'ay': fy}
        sheet.alpha_composite(cut, (box[0], box[1])); d.rectangle(box, outline=(255, 255, 0, 255), width=3); d.text((box[0] + 6, box[1] + 4), str(k), fill=(255, 255, 0, 255))
    sheet.convert('RGB').save(CUT / f'{name}_sheet.jpg', quality=85)
    print(name, len(out), 'parts')
    return out


def clean_alpha(a):
    m = a > 40
    lab, n = ndimage.label(ndimage.binary_dilation(m, iterations=6))
    if n == 0: return a
    sizes = ndimage.sum(m, lab, range(1, n + 1)); big = sizes.max(); keep = np.zeros_like(m)
    for i, s in enumerate(sizes, 1):
        if s > big * 0.04: keep |= lab == i
    return np.where(keep, a, 0)


def skull_width(arr):
    r, g, b, a = [arr[..., k].astype(np.float32) for k in range(4)]
    on = a > 128
    ys, xs = np.nonzero(on); top, bottom = ys.min(), ys.max()
    skin = on & (g > r + 2) & (g > b + 2) & (g > 105) & (np.abs(r - b) < 45)
    skin[int(top + (bottom - top) * 0.55):] = False
    lab, n = ndimage.label(skin)
    if not n: return None
    sizes = ndimage.sum(skin, lab, range(1, n + 1)); i = int(np.argmax(sizes)) + 1
    if sizes[i - 1] < 400: return None
    hy, hx = np.nonzero(lab == i)
    return float(hx.max() - hx.min())


SCALES = {}


def sheet(name, mode, cols=4, rows=2):
    im = key(Image.open(GEN / f'{name}.png'))
    W, H = im.size; cw, ch = W / cols, H / rows
    cells = []
    for r in range(rows):
        for c in range(cols):
            cell = im.crop((round(c * cw), round(r * ch), round((c + 1) * cw), round((r + 1) * ch)))
            arr = np.asarray(cell).copy(); arr[..., 3] = clean_alpha(arr[..., 3]); cells.append(arr)
    if name in SCALE_FROM:
        scale = SCALES[SCALE_FROM[name]]
    else:
        sk = [s for s in (skull_width(c) for c in cells) if s]
        scale = SKULL / float(np.median(sk))       # logical units per source px
    SCALES[name] = scale
    f = scale * RES
    frames, imgs = [], []
    for arr in cells:
        a = arr[..., 3]
        ys, xs = np.nonzero(a > 128)
        bottom = ys.max(); top = ys.min()
        if mode == 'feet':
            band = ys > bottom - (bottom - top) * 0.06
            ax = float(xs[band].mean())
        elif mode == 'tie':                         # walk cycles: the torso (red necktie) stays put, the legs move
            rr, gg, bb_ = arr[..., 0].astype(int), arr[..., 1].astype(int), arr[..., 2].astype(int)
            red = (a > 128) & (rr > 150) & (gg < 90) & (bb_ < 100) & (rr - gg > 90)
            red[int(top + (bottom - top) * 0.75):] = False
            ax = float(np.nonzero(red)[1].mean()) if red.sum() > 40 else float(xs.mean())
        else:                                       # swim ring: centre of the ring's widest rows near the bottom
            band = ys > bottom - (bottom - top) * 0.25
            ax = float((xs[band].min() + xs[band].max()) / 2)
        cimg = Image.fromarray(arr, 'RGBA'); bb = cimg.getbbox(); crop = cimg.crop(bb)
        w, h = max(1, round(crop.width * f)), max(1, round(crop.height * f))
        imgs.append(crop.resize((w, h), Image.LANCZOS))
        frames.append([(ax - bb[0]) * f, (bottom + 1 - bb[1]) * f])
    pad = 2; Wt = sum(i.width + pad for i in imgs); Ht = max(i.height for i in imgs)
    atlas = Image.new('RGBA', (Wt, Ht)); x = 0; out = []
    for img, (ax, ay) in zip(imgs, frames):
        atlas.alpha_composite(img, (x, 0)); out.append([x, 0, img.width, img.height, round(ax, 2), round(ay, 2)]); x += img.width + pad
    atlas.save(ANIM / f'{name}.png', optimize=True)
    print(name, 'scale', round(scale, 4), 'atlas', atlas.size)
    return {'src': 'anim/' + name, 'k': 1 / RES, 'frames': out}


def main():
    only = set(sys.argv[1:])
    sp = load_js(ROOT / 'src' / 'data' / 'sprites.js', 'SPRITES')
    an = load_js(ROOT / 'src' / 'data' / 'anims.js', 'ANIMS')
    have = lambda n: n in REMAKE_SRC or (GEN / f'{n}.png').exists()
    for n in SINGLE:
        if (not only or n in only) and have(n):
            sp[n] = single(n)
    for n in PARTS:
        if (not only or n in only) and have(n):
            for k in [k for k in sp if k.startswith(n + '_')]: del sp[k]
            sp.update(parts(n))
    for n, mode in SHEETS.items():
        if (not only or n in only) and (GEN / f'{n}.png').exists():
            an[n] = sheet(n, *mode) if isinstance(mode, tuple) else sheet(n, mode)
    rd = load_js(REMAKE / 'src' / 'frames_data.js', 'FRAMES')
    for n in REMAKE_ANIMS:
        if only and n not in only and an.get(n): continue
        shutil.copyfile(REMAKE / rd[n]['src'], ANIM / f'{n}.png')
        an[n] = {'src': 'anim/' + n, 'k': rd[n]['k'], 'frames': [f[:6] for f in rd[n]['frames']]}
    (ROOT / 'src' / 'data').mkdir(parents=True, exist_ok=True)
    (ROOT / 'src' / 'data' / 'sprites.js').write_text('// generated by tools/build.py\nwindow.SPRITES = ' + json.dumps(sp) + ';\n', encoding='utf-8')
    (ROOT / 'src' / 'data' / 'anims.js').write_text('// generated by tools/build.py\nwindow.ANIMS = ' + json.dumps(an) + ';\n', encoding='utf-8')


if __name__ == '__main__':
    main()
