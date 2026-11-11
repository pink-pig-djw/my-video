"""Build the web version of the MV into web/: the live Canvas renderer (src/full.html's scripts) with web-sized assets.

  uv run --no-project --with pillow python tools/build_web.py
Photos become JPEG, the cut-out stickers WebP with alpha, outro thumbnails smaller JPEG; mouth patches stay PNG. Only
images the scripts actually name are copied. web/index.html is the player page (published as an Artifact).
"""
import re
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC, A, OUT = ROOT / 'src', ROOT / 'assets', ROOT / 'web'
html = (SRC / 'full.html').read_text(encoding='utf-8')
scripts = re.findall(r'<script src="([^"]+)"></script>', html)
code = '\n'.join((SRC / s).read_text(encoding='utf-8') for s in scripts)

if OUT.exists():
    for p in OUT.iterdir():
        shutil.rmtree(p) if p.is_dir() else p.unlink()
(OUT / 'js').mkdir(parents=True, exist_ok=True)
for s in scripts:
    dst = OUT / 'js' / s; dst.parent.mkdir(parents=True, exist_ok=True)
    if s.endswith('main_full.js'): continue   # the web player has its own boot (web/js/v2/main_web.js)
    shutil.copy2(SRC / s, dst)
shutil.copytree(SRC / 'fonts', OUT / 'fonts', ignore=shutil.ignore_patterns('*.txt'))
shutil.copy2(SRC / 'fonts.css', OUT / 'fonts.css')
(OUT / 'audio').mkdir(exist_ok=True); shutil.copy2(ROOT / 'audio' / 'song.mp3', OUT / 'audio' / 'song.mp3')

words = set(re.findall(r"[A-Za-z0-9_]+", code))
n = {'gen': 0, 'cut': 0, 'mouth': 0, 'thumb': 0}
(OUT / 'img' / 'gen').mkdir(parents=True, exist_ok=True)
for p in sorted((A / 'gen').glob('*.png')):
    if p.stem not in words or p.stem.startswith('spr_'): continue   # stickers use the cut-outs, not the original generations
    im = Image.open(p)
    if im.mode in ('RGBA', 'LA') and im.getchannel('A').getextrema()[0] < 255:
        im.save(OUT / 'img' / 'gen' / f'{p.stem}.webp', quality=90, method=6); print('alpha gen', p.stem)
    else:
        im.convert('RGB').save(OUT / 'img' / 'gen' / f'{p.stem}.jpg', quality=88, optimize=True, progressive=True)
    n['gen'] += 1
(OUT / 'img' / 'cut').mkdir(parents=True, exist_ok=True)
for p in sorted((A / 'cut').glob('*.png')):
    if p.stem not in words: continue
    Image.open(p).convert('RGBA').save(OUT / 'img' / 'cut' / f'{p.stem}.webp', quality=92, method=6); n['cut'] += 1
(OUT / 'img' / 'mouth').mkdir(parents=True, exist_ok=True)
for p in sorted((A / 'mouth').glob('*.png')):
    shutil.copy2(p, OUT / 'img' / 'mouth' / p.name); n['mouth'] += 1
(OUT / 'img' / 'thumb').mkdir(parents=True, exist_ok=True)
for p in sorted((A / 'thumbs').glob('*.png')):
    Image.open(p).convert('RGB').save(OUT / 'img' / 'thumb' / f'{p.stem}.jpg', quality=84, optimize=True); n['thumb'] += 1
ext = {}
for d in ('gen', 'cut', 'mouth', 'thumb'):
    for p in (OUT / 'img' / d).iterdir(): ext[f'{d}/{p.stem}'] = p.suffix
(OUT / 'js' / 'data' / 'webfiles.js').write_text('window.WEBFILES = ' + __import__('json').dumps(ext) + ';\n', encoding='utf-8')
# the player page and its boot script (tools/web/), plus a local preview page with a document skeleton (not published)
shutil.copy2(ROOT / 'tools' / 'web' / 'main_web.js', OUT / 'js' / 'v2' / 'main_web.js')
page = (ROOT / 'tools' / 'web' / 'index.html').read_text(encoding='utf-8')
(OUT / 'index.html').write_text(page, encoding='utf-8')
(OUT / 'preview.html').write_text('<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
                                  '<style>body{margin:0}[hidden]{display:none!important}</style></head><body>' + page + '</body></html>', encoding='utf-8')
files = [p for p in OUT.rglob('*') if p.is_file() and p.name != 'preview.html']
print(n, 'files', len(files), 'MB', round(sum(p.stat().st_size for p in files) / 1e6, 1),
      'largest', max(files, key=lambda p: p.stat().st_size).name, round(max(p.stat().st_size for p in files) / 1e6, 2))
