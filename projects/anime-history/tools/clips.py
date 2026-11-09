"""把 OpenArt 片段解成 1920 宽的逐帧图，并更新 assets/frames/index.json。
  python tools/clips.py            # 处理 assets/clips/ 里还没解帧的片段
"""
import json, subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
FF = 'D:/LenovoSoftstore/Install/Zipjieyasuo/ffmpeg.exe'
OUT = ROOT / 'assets' / 'frames'
OUT.mkdir(parents=True, exist_ok=True)
idx = {}
for c in sorted((ROOT / 'assets' / 'clips').glob('*.mp4')):
    d = OUT / c.stem
    if not d.exists() or not any(d.iterdir()) or d.stat().st_mtime < c.stat().st_mtime:
        d.mkdir(exist_ok=True)
        for f in d.glob('*.jpg'):
            f.unlink()
        subprocess.run([FF, '-y', '-v', 'error', '-i', str(c), '-vf', 'scale=1920:1080:flags=lanczos,unsharp=5:5:0.55:5:5:0', '-q:v', '2', str(d / '%04d.jpg')], check=True)
    idx[c.stem] = len(list(d.glob('*.jpg')))
(OUT / 'index.json').write_text(json.dumps(idx, indent=0))
print(idx)
