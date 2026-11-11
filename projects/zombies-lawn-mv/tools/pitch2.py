import sys, numpy as np, librosa
y, sr = librosa.load(sys.argv[1], sr=16000, mono=True)
f0, vf, vp = librosa.pyin(y, fmin=60, fmax=900, sr=sr, frame_length=1024, hop_length=160)
np.save('render/f0.npy', np.nan_to_num(f0)); np.save('render/vf.npy', vf)
t = np.arange(len(f0)) * 0.01
for a, b in [(21.5, 25.2), (62.5, 80.5), (117, 135), (150, 161)]:
    row = []
    for s in np.arange(a, b, 0.1):
        m = (t >= s) & (t < s + 0.1) & vf
        v = np.nanmedian(f0[m]) if m.sum() >= 3 else 0
        row.append('  .' if v == 0 else ('M' if v < 200 else 'F') + f'{int(v):3d}'[-3:] if False else (' . ' if v == 0 else ('m' if v < 190 else ('?' if v < 230 else 'F'))))
    print(f'{a:6.1f}', ''.join(r.strip() or '.' for r in row))
