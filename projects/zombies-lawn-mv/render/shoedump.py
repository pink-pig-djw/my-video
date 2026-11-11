import sys, json
sys.path.insert(0, 'tools')
from pathlib import Path
import importlib.util
src = Path('tools/footlock.py').read_text(encoding='utf-8').split('def track')[0].replace("Path(__file__).resolve().parent.parent", "Path('.').resolve()")
ns = {}; exec(src, ns)
A = ns['ANIMS'][sys.argv[1]]; im = ns['Image'].open(ns['ROOT'] / 'assets' / (A['src'] + '.png')).convert('RGBA')
for i, (x, y, w, h, ax, ay) in enumerate(A['frames']):
    S = ns['shoes'](im.crop((x, y, x + w, y + h)), ax, ay)
    print(i, '  '.join(f"x{s['x']*A['k']:6.1f} y{s['y']*A['k']:5.1f}" for s in sorted(S, key=lambda s: s['x'])))
