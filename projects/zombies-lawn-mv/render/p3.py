import numpy as np, soundfile as sf
f0=np.load('render/f0.npy'); vf=np.load('render/vf.npy')
x,sr=sf.read('audio/vocals.wav'); x=x.mean(1)
def db(t): a=x[int(t*sr):int((t+0.1)*sr)]; return 20*np.log10(np.sqrt((a**2).mean())+1e-9)
for a,b in [(12.8,15.0),(20.5,25.0),(29.5,31.5),(39.5,42.5)]:
    out=[]
    for t in np.arange(a,b,0.1):
        k=int(round(t*100)); v=f0[k:k+10][vf[k:k+10]]
        out.append(f'{t:5.1f}:{db(t):4.0f}/{int(np.median(v)) if len(v) else 0:3d}')
    print('---')
    for i in range(0,len(out),6): print('  '.join(out[i:i+6]))
