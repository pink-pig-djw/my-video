import numpy as np, soundfile as sf
x, sr = sf.read('audio/vocals.wav', dtype='float32', always_2d=True); x = x.mean(1)
HZ = 100; hop = sr // HZ; win = sr // 40; n = len(x) // hop; pad = np.pad(x, (win // 2, win))
db = 20 * np.log10(np.array([np.sqrt(np.mean(pad[k * hop:k * hop + win] ** 2)) + 1e-9 for k in range(n)]))
f0 = np.load('render/f0.npy'); f0 = np.pad(f0, (0, max(0, n - len(f0))))[:n]
for a, b in [(65.0, 67.4), (69.4, 71.9), (74.6, 77.4), (119.9, 122.7), (124.6, 126.6), (128.8, 131.6), (62.5, 65.6), (66.8, 70.2), (71.0, 75.2), (117.0, 120.4), (122.0, 125.4), (126.0, 129.6), (131.0, 134.6), (76.9, 79.9)]:
    segs = []; cur = None
    for k in range(int(a * HZ), int(b * HZ)):
        voiced = db[k] > -45
        g = 'F' if f0[k] > 200 else ('M' if 60 < f0[k] <= 200 else ('u' if voiced else '.'))
        if cur is None or cur[0] != g: 
            if cur: segs.append(cur)
            cur = [g, k / HZ, k / HZ]
        cur[2] = k / HZ
    segs.append(cur)
    print(f'{a}-{b}:', ' '.join(f'{g}{s:.2f}-{e:.2f}' for g, s, e in segs if e - s >= 0.04 and g != '.'))
