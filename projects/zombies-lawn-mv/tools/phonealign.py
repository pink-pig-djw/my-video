"""Phoneme-level forced alignment of the lyrics to the isolated vocal, for the lip sync.

  uv run --no-project --with torch --with transformers --with soundfile --with scipy --with cmudict python tools/phonealign.py \
      audio/vocals.wav src/data/timing.js render/lipcheck/pa.json

Model: facebook/wav2vec2-lv-60-espeak-cv-ft (CTC over espeak IPA phonemes). Each lyric line's words are looked up in
CMUdict (ARPAbet), mapped to the model's IPA tokens, and Viterbi-aligned to the line's audio window (the window comes from
the whisper/letter alignment in timing.js). Output per line: words with their phonemes [ipa, arpabet, t0, t1] (20 ms frames)
and a mean log-prob confidence. Also prints the free (greedy) decode of each window for checking what is really sung.
"""
import json
import re
import sys
from pathlib import Path

import cmudict
import numpy as np
import soundfile as sf
import torch
from huggingface_hub import hf_hub_download
from scipy.signal import resample_poly
from transformers import Wav2Vec2FeatureExtractor, Wav2Vec2ForCTC

voc, timing, out = sys.argv[1:4]
M = 'facebook/wav2vec2-lv-60-espeak-cv-ft'
src = Path(timing).read_text(encoding='utf-8')
T = json.loads(src[src.index('{'):src.rindex('}') + 1])
vocab = json.load(open(hf_hub_download(M, 'vocab.json'), encoding='utf-8'))
inv = {v: k for k, v in vocab.items()}
BLANK = vocab['<pad>']
fe = Wav2Vec2FeatureExtractor.from_pretrained(M)
model = Wav2Vec2ForCTC.from_pretrained(M).eval()
torch.set_num_threads(10)
wav, sr = sf.read(voc, dtype='float32', always_2d=True)
x = resample_poly(wav.mean(1), 160, 441).astype(np.float32)
SR, FR = 16000, 0.02
CMU = cmudict.dict()
EXTRA = {   # words CMUdict lacks or says differently from the singer
    'reevaluate': 'R IY0 IH0 V AE1 L Y UW0 EY2 T', 'gonna': 'G AH1 N AH0', 'wanna': 'W AA1 N AH0', 'undead': 'AH0 N D EH1 D',
    'screendoor': 'S K R IY1 N D AO1 R', 'ooh': 'UW1', 'yeah': 'Y EH1', 'sunflower': 'S AH1 N F L AW2 ER0',
}
A2I = {'AA': 'ɑː', 'AE': 'æ', 'AH': 'ʌ', 'AO': 'ɔː', 'AW': 'aʊ', 'AY': 'aɪ', 'EH': 'ɛ', 'ER': 'ɜː', 'EY': 'eɪ', 'IH': 'ɪ', 'IY': 'iː',
       'OW': 'oʊ', 'OY': 'ɔɪ', 'UH': 'ʊ', 'UW': 'uː', 'B': 'b', 'CH': 'tʃ', 'D': 'd', 'DH': 'ð', 'F': 'f', 'G': 'ɡ', 'HH': 'h',
       'JH': 'dʒ', 'K': 'k', 'L': 'l', 'M': 'm', 'N': 'n', 'NG': 'ŋ', 'P': 'p', 'R': 'ɹ', 'S': 's', 'SH': 'ʃ', 'T': 't', 'TH': 'θ',
       'V': 'v', 'W': 'w', 'Y': 'j', 'Z': 'z', 'ZH': 'ʒ'}
RCOL = {('AA', 'R'): 'ɑːɹ', ('AO', 'R'): 'ɔːɹ', ('IH', 'R'): 'ɪɹ', ('IY', 'R'): 'ɪɹ', ('EH', 'R'): 'ɛɹ', ('UH', 'R'): 'ʊɹ'}


def pron(word):
    w = re.sub(r"[^a-z']", '', word.lower().replace('’', "'"))
    key = w.replace("'", '')
    if key in EXTRA:
        arp = EXTRA[key].split()
    elif w in CMU:
        arp = CMU[w][0]
    elif key in CMU:
        arp = CMU[key][0]
    else:
        raise SystemExit(f'no pronunciation for {word!r}; add it to EXTRA')
    out, i = [], 0
    while i < len(arp):
        p, st = re.sub(r'\d', '', arp[i]), re.sub(r'\D', '', arp[i])
        if i + 1 < len(arp) and (p, re.sub(r'\d', '', arp[i + 1])) in RCOL:
            out.append((RCOL[(p, 'R')], p + st + '+R')); i += 2; continue
        ipa = A2I[p]
        if p == 'AH' and st == '0': ipa = 'ə'
        if p == 'ER' and st == '0': ipa = 'ɚ'
        if p == 'IY' and st == '0' and i == len(arp) - 1: ipa = 'i'
        out.append((ipa, p + st)); i += 1
    return out


def viterbi(lp, toks):
    S = 2 * len(toks) + 1; Tn = lp.shape[0]
    ext = [BLANK if s % 2 == 0 else toks[s // 2] for s in range(S)]
    NEG = -1e9; dp = np.full((Tn, S), NEG); bp = np.zeros((Tn, S), np.int32)
    dp[0, 0] = lp[0, ext[0]]
    if S > 1: dp[0, 1] = lp[0, ext[1]]
    E = np.array(ext)
    skip_ok = np.array([s >= 2 and ext[s] != BLANK and ext[s] != ext[s - 2] for s in range(S)])
    for t in range(1, Tn):
        prev = dp[t - 1]
        c0 = prev
        c1 = np.concatenate([[NEG], prev[:-1]])
        c2 = np.where(skip_ok, np.concatenate([[NEG, NEG], prev[:-2]]), NEG)
        stack = np.stack([c0, c1, c2])
        k = stack.argmax(0)
        dp[t] = stack[k, np.arange(S)] + lp[t, E]
        bp[t] = np.arange(S) - k
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
    return spans


res = []
lines = T['lines']
for i, ln in enumerate(lines):
    if ln.get('opt'):
        res.append({'i': i, 'a': ln['t0'], 'b': ln['t1'], 'conf': -99, 'words': [], 'opt': True}); continue
    prv = [l for l in lines[:i] if not l.get('opt')]; nxl = [l for l in lines[i + 1:] if not l.get('opt')]
    prev_end = prv[-1]['t1'] if prv else 0.0
    next_start = nxl[0]['t0'] if nxl else T['duration']
    a = max(ln['t0'] - 0.45, (prev_end + ln['t0']) / 2 if prv else 0.0, 0)
    b = min(ln['t1'] + 0.45, (ln['t1'] + next_start) / 2)
    if ln.get('win'): a, b = ln['win'][0] - 0.06, ln['win'][1] + 0.08     # pinned by the pitch track
    seg = x[int(a * SR):int(b * SR)]
    with torch.no_grad():
        lp = torch.log_softmax(model(fe(seg, sampling_rate=SR, return_tensors='pt').input_values).logits[0], -1).numpy()
    ids = lp.argmax(-1); heard = []; prevk = -1
    for t, k in enumerate(ids):
        if k != prevk and k != BLANK: heard.append(inv[k])
        prevk = k
    toks, owner, arp = [], [], []
    for j, w in enumerate(ln['words']):
        for part in re.split(r'[-\s]+', w['w']):
            if not re.sub(r"[^a-zA-Z]", '', part): continue
            for ipa, ap in pron(part):
                if ipa not in vocab: raise SystemExit(f'{ipa} not in vocab')
                toks.append(vocab[ipa]); owner.append(j); arp.append((ipa, ap))
    spans = viterbi(lp, toks)
    words, confs = [], []
    for j, w in enumerate(ln['words']):
        ks = [k for k, o in enumerate(owner) if o == j]
        ph = []
        for k in ks:
            if spans[k][0] is None: ph.append([arp[k][0], arp[k][1], None, None]); continue
            ph.append([arp[k][0], arp[k][1], round(a + spans[k][0] * FR, 3), round(a + (spans[k][1] + 1) * FR, 3)])
            confs += [lp[t, toks[k]] for t in range(spans[k][0], spans[k][1] + 1)]
        got = [p for p in ph if p[2] is not None]
        words.append({'w': w['w'], 't0': got[0][2] if got else None, 't1': got[-1][3] if got else None, 'ph': ph})
    conf = round(float(np.mean(confs)) if confs else -99, 3)
    res.append({'i': i, 'a': round(a, 3), 'b': round(b, 3), 'conf': conf, 'heard': ' '.join(heard), 'words': words})
    print(f"{i:2d} {a:7.2f}-{b:7.2f} conf {conf:6.2f} | {ln['en']}\n     heard: {' '.join(heard)}\n     " +
          ' '.join(f"{w['w']}@{w['t0']}" for w in words), flush=True)
Path(out).parent.mkdir(parents=True, exist_ok=True)
Path(out).write_text(json.dumps(res, ensure_ascii=False), encoding='utf-8')
print('done', out)
