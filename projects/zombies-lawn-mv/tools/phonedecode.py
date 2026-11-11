"""Free (greedy) phoneme decoding of the vocal stem in given windows, to hear what is really sung (echoes, 'yeah', 'ooh').
uv run --no-project --with torch --with transformers --with soundfile --with scipy python tools/phonedecode.py a-b [a-b ...]"""
import sys, json, numpy as np, soundfile as sf, torch
from scipy.signal import resample_poly
from transformers import Wav2Vec2ForCTC, Wav2Vec2FeatureExtractor
from huggingface_hub import hf_hub_download
M = 'facebook/wav2vec2-lv-60-espeak-cv-ft'
vocab = json.load(open(hf_hub_download(M, 'vocab.json'), encoding='utf-8')); inv = {v: k for k, v in vocab.items()}
fe = Wav2Vec2FeatureExtractor.from_pretrained(M); model = Wav2Vec2ForCTC.from_pretrained(M).eval(); torch.set_num_threads(12)
wav, sr = sf.read('audio/vocals.wav', dtype='float32', always_2d=True); x = resample_poly(wav.mean(1), 160, 441).astype(np.float32)
for w in sys.argv[1:]:
    a, b = map(float, w.split('-'))
    seg = x[int(a * 16000):int(b * 16000)]
    with torch.no_grad():
        lp = torch.log_softmax(model(fe(seg, sampling_rate=16000, return_tensors='pt').input_values).logits[0], -1).numpy()
    ids = lp.argmax(-1); out = []; prev = -1
    for t, i in enumerate(ids):
        if i != prev and i != 0: out.append(f'{inv[i]}@{a + t * 0.02:.2f}')
        prev = i
    print(f'{a:.2f}-{b:.2f}:', ' '.join(out), flush=True)
