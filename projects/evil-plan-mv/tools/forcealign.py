"""Forced alignment of the known lyrics to the isolated vocal (wav2vec2 CTC, letters), line by line.

  uv run --no-project --with torch --with transformers --with soundfile --with scipy python tools/forcealign.py audio/vocals.wav src/data/timing.js render/lipcheck/fa.json [model]
(model defaults to facebook/wav2vec2-base-960h; facebook/wav2vec2-large-960h-lv60-self gives a second opinion.)
For each lyric line: the audio around it (from the whisper line times) is scored by facebook/wav2vec2-base-960h and the
line's letters are Viterbi-aligned to it. Output per word: start/end and the letter spans (20 ms frames), plus a
confidence (mean log-prob of the aligned letters).
"""
import json
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
import torch
from scipy.signal import resample_poly
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor

voc, timing, out = sys.argv[1:4]
MODEL = sys.argv[4] if len(sys.argv) > 4 else 'facebook/wav2vec2-base-960h'
src = Path(timing).read_text(encoding='utf-8')
T = json.loads(src[src.index('{'):src.rindex('}') + 1])
wav, sr = sf.read(voc, dtype='float32', always_2d=True)
x = resample_poly(wav.mean(1), 160, 441).astype(np.float32)   # 44.1 kHz -> 16 kHz
SR, FR = 16000, 0.02
proc = Wav2Vec2Processor.from_pretrained(MODEL)
model = Wav2Vec2ForCTC.from_pretrained(MODEL).eval()
torch.set_num_threads(12)
vocab = proc.tokenizer.get_vocab(); BLANK = vocab['<pad>']
SPOKEN = {'110': 'a hundred and ten'}


def letters(word):
    w = SPOKEN.get(re.sub(r'[^0-9a-z]', '', word.lower()), word)
    return [c for c in w.upper().replace('’', "'") if c in vocab and c != '|' or c == ' ']


def viterbi(lp, toks):
    """CTC forced alignment: lp (T, C) log-probs, toks list of ids. Returns per-token (first, last) frame."""
    S = 2 * len(toks) + 1; Tn = lp.shape[0]
    ext = [BLANK if s % 2 == 0 else toks[s // 2] for s in range(S)]
    NEG = -1e9; dp = np.full((Tn, S), NEG); bp = np.zeros((Tn, S), np.int32)
    dp[0, 0] = lp[0, ext[0]]
    if S > 1: dp[0, 1] = lp[0, ext[1]]
    for t in range(1, Tn):
        prev = dp[t - 1]
        for s in range(S):
            cands = [(prev[s], s)]
            if s >= 1: cands.append((prev[s - 1], s - 1))
            if s >= 2 and ext[s] != BLANK and ext[s] != ext[s - 2]: cands.append((prev[s - 2], s - 2))
            v, k = max(cands)
            dp[t, s] = v + lp[t, ext[s]]; bp[t, s] = k
    s = S - 1 if S == 1 or dp[-1, S - 1] >= dp[-1, S - 2] else S - 2
    path = [0] * Tn
    for t in range(Tn - 1, -1, -1):
        path[t] = s; s = bp[t, s]
    spans = [[None, None] for _ in toks]
    for t, s in enumerate(path):
        if s % 2 == 1:
            k = s // 2
            if spans[k][0] is None: spans[k][0] = t
            spans[k][1] = t
    return spans, path


res = []
lines = T['lines']
for i, ln in enumerate(lines):
    prev_end = lines[i - 1]['t1'] if i else 0.0
    next_start = lines[i + 1]['t0'] if i + 1 < len(lines) else T['duration']
    a = max(ln['t0'] - 0.45, (prev_end + ln['t0']) / 2 if i else 0.0)
    b = min(ln['t1'] + 0.45, (ln['t1'] + next_start) / 2)
    seg = x[int(a * SR):int(b * SR)]
    inp = proc(seg, sampling_rate=SR, return_tensors='pt').input_values
    with torch.no_grad():
        lp = torch.log_softmax(model(inp).logits[0], -1).numpy()
    toks, owner = [], []
    for j, w in enumerate(ln['words']):
        if toks: toks.append(vocab['|']); owner.append(-1)
        for c in letters(w['w']):
            if c == ' ': toks.append(vocab['|']); owner.append(-1)
            else: toks.append(vocab[c]); owner.append(j)
    spans, path = viterbi(lp, toks)
    words, confs = [], []
    for j, w in enumerate(ln['words']):
        ks = [k for k, o in enumerate(owner) if o == j and spans[k][0] is not None]
        if not ks: words.append({'w': w['w'], 't0': None, 't1': None, 'chars': []}); continue
        chars = [[proc.tokenizer.convert_ids_to_tokens(toks[k]), round(a + spans[k][0] * FR, 3), round(a + (spans[k][1] + 1) * FR, 3)] for k in ks]
        for k in ks:
            confs += [lp[t, toks[k]] for t in range(spans[k][0], spans[k][1] + 1)]
        words.append({'w': w['w'], 't0': chars[0][1], 't1': chars[-1][2], 'chars': chars})
    res.append({'i': i, 'a': round(a, 3), 'b': round(b, 3), 'conf': round(float(np.mean(confs)) if confs else -99, 3), 'words': words})
    print(i, res[-1]['conf'], ' '.join(f"{w['w']}@{w['t0']}" for w in words)[:150], flush=True)
Path(out).parent.mkdir(parents=True, exist_ok=True)
Path(out).write_text(json.dumps(res), encoding='utf-8')
print('done', out)
