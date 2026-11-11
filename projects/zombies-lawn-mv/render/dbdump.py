import sys, numpy as np, soundfile as sf
x, sr = sf.read('audio/vocals.wav', dtype='float32', always_2d=True); x = x.mean(1)
HZ = 100; hop = sr // HZ; win = sr // 40; n = len(x) // hop; pad = np.pad(x, (win // 2, win))
db = 20 * np.log10(np.array([np.sqrt(np.mean(pad[k * hop:k * hop + win] ** 2)) + 1e-9 for k in range(n)]))
db = np.convolve(db, np.ones(3) / 3, mode='same')
locmax = np.array([db[max(0, k - 120):k + 120].max() for k in range(n)]); floor = np.percentile(db, 5)
f0 = np.load('render/f0.npy')
a, b = float(sys.argv[1]), float(sys.argv[2])
for k in range(int(a * HZ), int(b * HZ), 2):
    q = db[k] < locmax[k] - 16 or db[k] < floor + 8
    print(f'{k/HZ:6.2f} {db[k]:6.1f} loc{locmax[k]:6.1f} f0 {f0[k]:5.0f} {"Q" if q else ""}')
