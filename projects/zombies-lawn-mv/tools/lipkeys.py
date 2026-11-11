"""Mouth keys for the lip sync, from phoneme-level forced alignment of the lyrics to the isolated vocal.

  uv run --no-project --with numpy --with soundfile python tools/lipkeys.py audio/vocals.wav src/data/timing.js \
      render/lipcheck/fa.json render/lipcheck/fa_large.json render/lipcheck/pa.json src/data/lipkeys.js

Word starts: three aligners (wav2vec2 letters base + large, wav2vec2 espeak phonemes); the median of those that agree
(an aligner more than 0.1 s from the other two is dropped). Phonemes come from the phoneme aligner, moved onto the
consensus word start (and squeezed into the word's slot when it disagrees badly).
Sunflower (lines sung by the lead, echoes included): one of 12 painted mouths per phoneme —
  rest mbp fv small ah ahh eh ee oh oo l r
open vowels get 'ahh' when held and loud, 'small' when short and unstressed; diphthongs switch half-way (aɪ = ah→ee,
oʊ = oh→oo …); m/b/p close the lips for at least 2 frames before the vowel; the mouth closes only where the voice stops
(the vocal stem drops well below its local level). Faint backing "yeah"s that could not be aligned follow the voice.
Zombie (the low male voice): closed / mid / wide per phoneme.
Shapes lead the sound by LEAD s, as in hand-drawn lip sync. Writes window.SF_LIP, window.Z_LIP, window.SF_EYES.
"""
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

voc, timing, fa_b, fa_l, pa, out = sys.argv[1:7]
LEAD = 0.035
src = Path(timing).read_text(encoding='utf-8')
T = json.loads(src[src.index('{'):src.rindex('}') + 1])
FB = {r['i']: r for r in json.loads(Path(fa_b).read_text(encoding='utf-8'))}
FL = {r['i']: r for r in json.loads(Path(fa_l).read_text(encoding='utf-8'))}
PA = {r['i']: r for r in json.loads(Path(pa).read_text(encoding='utf-8'))}

# ---- the voice: level (dB, 10 ms), quiet = well below its local level or near the floor
wav, sr = sf.read(voc, dtype='float32', always_2d=True); x = wav.mean(1)
HZ = 100; hop = sr // HZ; win = sr // 40; n = len(x) // hop; pad = np.pad(x, (win // 2, win))
db = 20 * np.log10(np.array([np.sqrt(np.mean(pad[k * hop:k * hop + win] ** 2)) + 1e-9 for k in range(n)]))
db = np.convolve(db, np.ones(3) / 3, mode='same')
floor = np.percentile(db, 5)
locmax = np.array([db[max(0, k - 120):k + 120].max() for k in range(n)])
quiet = (db < locmax - 16) | (db < floor + 8)
for _ in range(2):
    k = 0
    while k < n:
        j = k
        while j < n and quiet[j] == quiet[k]: j += 1
        if j - k < 5: quiet[k:j] = not quiet[k]
        k = j
F0p = Path('render/f0.npy')
f0 = np.load(F0p) if F0p.exists() else np.zeros(n)
def is_quiet(t): k = int(t * HZ); return 0 <= k < n and quiet[k]
def level(t0, t1):
    a, b = int(t0 * HZ), max(int(t0 * HZ) + 1, int(t1 * HZ)); return float(db[a:b].max()) if b <= n else -99
def rise_onsets():
    """times where the vocal level climbs >= 8 dB out of a dip within 0.15 s (the start of a sung vowel)"""
    out = []
    for k in range(6, n - 16):
        seg = db[k - 5:k + 6]
        if db[k] > seg.min() + 1e-6 or db[k] > db[k - 5:k].min() + 0.5: continue    # local minimum
        peak = db[k:k + 16].max()
        if peak - db[k] < 8: continue
        thr = db[k] + 0.6 * (peak - db[k])
        j = k
        while j < k + 16 and db[j] < thr: j += 1
        if not out or j / HZ - out[-1] > 0.05: out.append(j / HZ)
    return out


def quiet_from(t, until):
    """first time >= t where the voice stops for >= 60 ms, before `until`"""
    for k in range(int(t * HZ), min(n, int(until * HZ))):
        if quiet[k:k + 6].all(): return k / HZ
    return None

VIS = {'ɑː': 'ah', 'ɑːɹ': 'ah', 'æ': 'ah', 'ʌ': 'small', 'ə': 'small', 'ɔː': 'oh', 'ɔːɹ': 'oh', 'aʊ': ('ah', 'oo'), 'aɪ': ('ah', 'ee'),
       'ɛ': 'eh', 'ɛɹ': 'eh', 'ɚ': 'r', 'ɜː': 'r', 'eɪ': ('eh', 'ee'), 'ɪ': 'ee', 'ɪɹ': 'ee', 'iː': 'ee', 'i': 'ee', 'oʊ': ('oh', 'oo'),
       'ɔɪ': ('oh', 'ee'), 'ʊ': 'oo', 'ʊɹ': 'oo', 'uː': 'oo',
       'm': 'mbp', 'b': 'mbp', 'p': 'mbp', 'f': 'fv', 'v': 'fv', 'w': 'oo', 'l': 'l', 'θ': 'l', 'ð': 'l', 'ɹ': 'r', 'ʃ': 'r', 'ʒ': 'r',
       'tʃ': 'r', 'dʒ': 'r', 'j': 'ee', 's': 'ee', 'z': 'ee', 't': 'ee', 'd': 'ee', 'n': 'ee', 'ɾ': 'l', 'k': 'ee', 'ɡ': 'ee',
       'ŋ': 'ee', 'h': None}
VOWELS = {k for k, v in VIS.items() if k[0] in 'ɑæʌəɔaɛɚɜeɪioʊu'}
OPEN = {'ah'}
ZOPEN = {'ah': 'wide', 'ahh': 'wide', 'eh': 'wide', 'oh': 'wide', 'small': 'mid', 'ee': 'mid', 'oo': 'mid', 'r': 'mid', 'l': 'mid'}


def word_start(i, j):
    c = []
    for D in (FB, FL, PA):
        r = D.get(i)
        if r and not r.get('opt') and j < len(r['words']) and r['words'][j]['t0'] is not None: c.append(r['words'][j]['t0'])
    if not c: return None
    if len(c) == 3:
        m = float(np.median(c)); c = [v for v in c if abs(v - m) <= 0.1] or [m]
    return float(np.mean(c))


RISES = rise_onsets()
report, SF, ZK, EYES = [], [], [], []
WORDT = {}
LEND = {}            # where each lead line's mouth comes to rest
lines = T['lines']
for i, ln in enumerate(lines):
    if ln.get('opt'): continue
    P_ = PA.get(i)
    if not P_ or not P_['words']: continue
    starts = [word_start(i, j) for j in range(len(ln['words']))]
    end = ln['t1'] + 0.6
    nxt = next((l['t0'] for l in lines[i + 1:] if not l.get('opt')), T['duration'])
    events = []                                                    # (t, phoneme ipa, arpabet)
    for j, w in enumerate(P_['words']):
        ph = [p for p in w['ph'] if p[2] is not None]
        if not ph: continue
        cs = starts[j] if starts[j] is not None else ph[0][2]
        ws = ph[0][2]
        nx_start = next((s for s in starts[j + 1:] if s is not None), min(end, nxt))
        if abs(cs - ws) <= 0.25:
            sh = cs - ws; ts = [p[2] + sh for p in ph]
        else:                                                      # squeeze into the consensus slot
            span = max(0.08, nx_start - cs); w0, w1 = ph[0][2], ph[-1][3]
            ts = [cs + (p[2] - w0) / max(0.02, w1 - w0) * span * 0.9 for p in ph]
        # Sung words: the vowels carry the length, consonants are short. CTC spikes sit anywhere inside a sound (a
        # final "n" often spikes in the middle of a held "aw"), so leading consonants are packed at the word start and
        # trailing ones at the word end (where the voice stops or the next word starts); inner ones keep their spikes.
        qs = quiet_from(cs + 0.06, nx_start)
        we = min(nx_start, qs) if qs is not None else nx_start
        vi = [k for k, p in enumerate(ph) if p[0] in VOWELS]
        if vi:
            nl, nt = vi[0], len(ph) - 1 - vi[-1]
            dc = min(0.085, max(0.03, (we - cs) * 0.22 / max(1, nl + nt)))
            for k in range(nl): ts[k] = cs + k * dc
            ts[vi[0]] = min(ts[vi[0]], cs + nl * dc) if nl else cs
            for q in range(nt):
                k = vi[-1] + 1 + q
                ts[k] = max(ts[k], we - (nt - q) * dc)
            # consonants between two vowels of the word ("zom-bie"): a quick cluster right before the next vowel, so the
            # first vowel is held (CTC tends to put the m/b early, which kept the lips pressed for half a second)
            for va, vb in zip(vi, vi[1:]):
                nc = vb - va - 1
                if nc <= 0: continue
                span = ts[vb] - ts[va]
                cd = min(0.075 * nc, span * 0.4) / nc
                for q in range(nc):
                    ts[va + 1 + q] = ts[vb] - (nc - q) * cd
            for k in range(1, len(ts)):                            # keep the order, at least 1 frame apart
                ts[k] = max(ts[k], ts[k - 1] + 0.034)
        for p, tt in zip(ph, ts): events.append((tt, p[0], p[1]))
    events.sort()
    # snap each vowel to the nearest swell of the voice (-0.2 .. +0.12 s around the aligned time), keeping the order of
    # the vowels; the consonants before it are packed just before the new vowel time, those after it just after
    vix = [q for q, e in enumerate(events) if e[1] in VOWELS]
    for qi, q in enumerate(vix):
        tv = events[q][0]
        lo = events[vix[qi - 1]][0] + 0.07 if qi else tv - 0.2
        hi = events[vix[qi + 1]][0] - 0.07 if qi + 1 < len(vix) else tv + 0.12
        c = [r for r in RISES if max(lo, tv - 0.2) <= r <= min(hi, tv + 0.12)]
        if not c: continue
        r = min(c, key=lambda r: abs(r - tv))
        events[q] = (r, events[q][1], events[q][2])
        before = list(range(vix[qi - 1] + 1 if qi else 0, q))
        for m_, b_ in enumerate(before):
            events[b_] = (min(events[b_][0], r - (len(before) - m_) * 0.045), events[b_][1], events[b_][2])
        after = list(range(q + 1, vix[qi + 1] if qi + 1 < len(vix) else len(events)))
        for m_, a_ in enumerate(after):
            events[a_] = (max(events[a_][0], r + (m_ + 1) * 0.045), events[a_][1], events[a_][2])
    events.sort()
    who = ln['who']
    keys = []
    line_end = (quiet_from(events[-1][0] + 0.05, nxt + 0.3) if events else None) or min(nxt - 0.05, events[-1][0] + 0.6)
    for k, (tt, ipa, arp) in enumerate(events):
        t_next = events[k + 1][0] if k + 1 < len(events) else line_end
        # the voice may stop before the next phoneme (end of a word followed by a breath)
        qs = quiet_from(tt + 0.06, t_next)
        seg_end = qs if qs is not None else t_next
        v = VIS.get(ipa)
        if v is None: continue                                     # h: keep the previous mouth
        dur = seg_end - tt
        isv = ipa in VOWELS
        zs = lambda sh: ZOPEN.get(sh, 'mid') if isv else ('mid' if sh in ('l', 'r', 'oo') else 'closed')   # zombie jaw
        if isinstance(v, tuple):
            keys.append((tt, v[0], zs(v[0])))
            if dur > 0.16: keys.append((tt + dur * 0.6, v[1], zs(v[1])))
        else:
            if v in OPEN and isv:
                stressed = not arp.endswith('0')
                if dur > 0.34 and level(tt, seg_end) > np.percentile(db[int(ln['t0'] * HZ):int(ln['t1'] * HZ) + 1], 75) - 2: v = 'ahh'
                elif dur < 0.1 and not stressed: v = 'small'
            if v == 'eh' and dur < 0.09: v = 'small'
            keys.append((tt, v, zs(v)))
        if qs is not None and (k + 1 == len(events) or qs < t_next - 0.08):
            keys.append((qs, 'rest', 'closed'))
        # eyes close on long held notes (lead only), once per line
        if who == 'S' and isv and dur > 0.9 and not any(a_ >= ln['t0'] - 0.5 and a_ <= seg_end for a_, s_ in EYES if s_ == 'closed'):
            EYES.append((tt + 0.25, 'closed')); EYES.append((seg_end - 0.1, 'open'))
    keys.append((line_end, 'rest', 'closed'))
    if who == 'S': LEND[i] = line_end
    st_ = [v if v is not None else ln['words'][j]['t0'] for j, v in enumerate(starts)]
    WORDT[i] = [[round(st_[j], 3), round(st_[j + 1] if j + 1 < len(st_) else line_end, 3)] for j in range(len(st_))]
    # m/b/p closures need at least 2 frames; nothing shorter than 1 frame
    col = 1 if who == 'S' else 2
    clean = []
    for key_ in keys:
        tt, sh = key_[0], key_[col]
        if clean and sh == clean[-1][1]: continue
        if clean and clean[-1][1] in ('mbp', 'closed') and tt - clean[-1][0] < 0.067: tt = clean[-1][0] + 0.067
        if clean and tt - clean[-1][0] < 0.034 and clean[-1][1] not in ('mbp', 'closed'): clean[-1] = (clean[-1][0], sh); continue
        clean.append((tt, sh))
    for tt, sh in clean:
        (SF if who == 'S' else ZK).append((round(tt - LEAD, 3), sh))
    report.append(f"{i:2d} {who}{'~' if ln['echo'] else ' '} {ln['en'][:44]:44s} words@ " + ' '.join(f"{s:.2f}" if s is not None else '-' for s in starts))

# faint backing "yeah"s / ad-libs: follow the voice in the optional lines' windows (lead voice only)
for ln in lines:
    if not ln.get('opt'): continue
    a, b = ln['t0'] - 0.15, ln['t1'] + 0.25
    prev_end = max([v for k_, v in LEND.items() if k_ < ln['i']] or [0])
    a = max(a, prev_end + 0.05)                             # never over the held end of the line before
    if a >= b: continue
    on = False
    for k in range(int(a * HZ), int(b * HZ)):
        t = k / HZ
        fem = k < len(f0) and f0[k] > 190
        v = (not quiet[k]) and fem
        if v and not on: SF.append((round(t - LEAD, 3), 'eh')); on = True
        elif not v and on: SF.append((round(t - LEAD, 3), 'rest')); on = False
    if on: SF.append((round(b, 3), 'rest'))

SF.sort(); ZK.sort(); EYES.sort()
def dedup(K):
    o = []
    for t, s in K:
        if o and o[-1][1] == s: continue
        if o and t <= o[-1][0]: o[-1] = (t, s); continue
        o.append((t, s))
    return o
SF, ZK, EYES = dedup(SF), dedup(ZK), dedup(EYES)
Path(out).write_text('// generated by tools/lipkeys.py from the phoneme alignment of the vocal stem\n'
                     f'window.SF_LIP = {json.dumps(SF)};\nwindow.Z_LIP = {json.dumps(ZK)};\nwindow.SF_EYES = {json.dumps(EYES)};\n'
                     f'window.WORDT = {json.dumps(WORDT)};\n', encoding='utf-8')
Path(pa).with_name('lipkeys_report.txt').write_text('\n'.join(report), encoding='utf-8')
from collections import Counter
print('sunflower keys', len(SF), Counter(s for _, s in SF).most_common()); print('zombie keys', len(ZK), Counter(s for _, s in ZK).most_common()); print('eyes', len(EYES))
