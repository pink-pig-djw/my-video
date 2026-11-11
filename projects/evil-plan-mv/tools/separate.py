"""Separate the vocal stem of the song (Demucs htdemucs, CPU) for checking the lip sync against the voice.

Usage: uv run --no-project --with demucs --with soundfile python tools/separate.py render/sep/song44.wav audio/vocals.wav
(the input is a 44.1 kHz stereo WAV decoded with ffmpeg first)
"""
import sys
import time

import numpy as np
import soundfile as sf
import torch
from demucs.apply import apply_model
from demucs.pretrained import get_model

src, out = sys.argv[1], sys.argv[2]
t0 = time.time()
wav, sr = sf.read(src, dtype='float32', always_2d=True)
assert sr == 44100
x = torch.from_numpy(wav.T.copy())
ref = x.mean(0)
x = (x - ref.mean()) / ref.std()
torch.set_num_threads(12)
model = get_model('htdemucs'); model.eval()
with torch.no_grad():
    stems = apply_model(model, x[None], device='cpu', shifts=1, split=True, overlap=0.25, progress=True)[0]
stems = stems * ref.std() + ref.mean()
v = stems[model.sources.index('vocals')].numpy().T
sf.write(out, v, sr, subtype='PCM_16')
print('vocals ->', out, f'{time.time() - t0:.0f}s')
