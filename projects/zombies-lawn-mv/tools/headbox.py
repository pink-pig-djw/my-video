"""Find each zombie's head (largest grey-green skin blob in the upper part of the figure) in the generation images."""
import sys, json
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, str(Path(__file__).parent))
from cutout import key
ROOT = Path(__file__).resolve().parent.parent
out = {}
for name, path in [(a.split('=')[0], a.split('=')[1]) for a in sys.argv[1:]]:
    im = key(Image.open(ROOT / path)); arr = np.asarray(im).astype(np.float32)
    r, g, b, a = [arr[..., k] for k in range(4)]
    on = a > 128; ys, xs = np.nonzero(on); top, bottom = ys.min(), ys.max()
    skin = on & (g > r + 2) & (g > b + 2) & (g > 100) & (np.abs(r - b) < 50)
    lim = {'z_bungee': None}.get(name, int(top + (bottom - top) * 0.5))
    if name == 'z_bungee': skin[:int(top + (bottom - top) * 0.45)] = False
    elif name == 'z_dolphin': skin[int(top + (bottom - top) * 0.6):] = False
    else: skin[lim:] = False
    lab, n = ndimage.label(ndimage.binary_closing(skin, iterations=3))
    sizes = ndimage.sum(skin, lab, range(1, n + 1)); i = int(np.argmax(sizes)) + 1
    hy, hx = np.nonzero(lab == i)
    out[name] = [int(hx.min()), int(hy.min()), int(hx.max()), int(hy.max())]
    print(name, out[name], im.size)
Path(ROOT / 'render' / 'headboxes.json').write_text(json.dumps(out))
