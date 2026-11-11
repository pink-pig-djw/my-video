"""Median F0 of the vocal stem in given windows (who sings: low male zombie voice or the high lead)."""
import sys, numpy as np, librosa
y, sr = librosa.load(sys.argv[1], sr=16000, mono=True)
f0, vf, vp = librosa.pyin(y, fmin=70, fmax=900, sr=sr, frame_length=1024, hop_length=160)
t = np.arange(len(f0)) * 0.01
wins = [(13.4,14.3),(22.5,24.3),(24.3,30),(42.2,45.5),(52.6,57),(62.8,65.3),(65.3,67.4),(67.4,69.8),(69.8,71.1),(71.0,74.3),(74.3,76.6),(76.6,79),(117.4,120.1),(120.1,122.1),(122.1,124.9),(124.9,126.3),(126.3,129.5),(129.5,131.2),(131.2,133.9),(150,156)]
for a,b in wins:
    m = (t>=a)&(t<b)&vf
    v = f0[m]
    print(f"{a:6.1f}-{b:6.1f} voiced {m.sum()*0.01:4.2f}s  median F0 {np.nanmedian(v) if len(v) else 0:6.1f} Hz  p10 {np.nanpercentile(v,10) if len(v) else 0:6.1f}  p90 {np.nanpercentile(v,90) if len(v) else 0:6.1f}")
