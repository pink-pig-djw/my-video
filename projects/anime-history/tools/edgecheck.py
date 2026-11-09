"""扫描成片四边，找摄影机移出图片留下的纯色边。python tools/edgecheck.py out/x.mp4"""
import subprocess, sys
import numpy as np
FF = 'D:/LenovoSoftstore/Install/Zipjieyasuo/ffmpeg.exe'
W, H, fps = 480, 270, 4
p = subprocess.run([FF, '-v', 'error', '-i', sys.argv[1], '-vf', f'fps={fps},scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True)
a = np.frombuffer(p.stdout, np.uint8).reshape(-1, H, W).astype(float)
bad = []
for i, f in enumerate(a):
    if f.std() < 6:
        continue                                          # 整帧纯色是设计好的闪白或黑场
    for name, s, inner in (('top', f[:3], f[6:30]), ('bottom', f[-3:], f[-30:-6]), ('left', f[:, :3], f[:, 6:30]), ('right', f[:, -3:], f[:, -30:-6])):
        if s.std() < 1.5 and inner.std() > 8 and abs(s.mean() - inner.mean()) > 12:
            bad.append((round(i / fps, 2), name, round(float(s.mean()))))
print(len(a), 'frames checked,', len(bad), 'suspect edges')
print(bad[:60])
