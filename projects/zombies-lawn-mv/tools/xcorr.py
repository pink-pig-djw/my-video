import sys, numpy as np, soundfile as sf
a, sr = sf.read(sys.argv[1]); b, _ = sf.read(sys.argv[2])
def env(x):
    hop = 160
    n = len(x)//hop
    return np.sqrt((x[:n*hop].reshape(n, hop)**2).mean(1))
ea, eb = env(a), env(b)
ea = (ea-ea.mean())/ea.std(); eb = (eb-eb.mean())/eb.std()
n = 1 << int(np.ceil(np.log2(len(ea)+len(eb))))
c = np.fft.irfft(np.fft.rfft(ea, n)*np.conj(np.fft.rfft(eb, n)), n)
lag = int(np.argmax(c)); lag = lag - n if lag > n//2 else lag
print('lag (ref - song) seconds:', lag*0.01, 'peak', c.max()/len(ea))
# rms per second for both
for i in range(0, min(len(ea), len(eb))//100, 1):
    pass
print('ref dur', len(a)/sr, 'song dur', len(b)/sr)
# loudness per 2 s
ra = [float(np.sqrt((a[int(t*sr):int((t+2)*sr)]**2).mean())) for t in range(0, int(len(a)/sr), 2)]
rb = [float(np.sqrt((b[int(t*sr):int((t+2)*sr)]**2).mean())) for t in range(0, int(len(b)/sr), 2)]
print('ref rms/2s', ' '.join(f'{v:.3f}' for v in ra[:20]))
print('song rms/2s', ' '.join(f'{v:.3f}' for v in rb[:20]))
