"""Mouth keys for the lip sync, from letter-level forced alignment of the lyrics to the isolated vocal.

  uv run --no-project --with numpy --with soundfile python tools/lipkeys.py audio/vocals.wav src/data/timing.js \
      render/lipcheck/fa.json render/lipcheck/fa_large.json src/data/lipkeys.js
Word starts: two wav2vec2 alignments (base, large) and whisper; where the two aligners agree their mean wins, otherwise the
aligner closest to whisper. Inside a word every vowel group gets its mouth shape at the time its first letter is sung;
m/b/p/f/v before a vowel close the lips, w rounds them, a final m/b/p closes them. The mouth closes only where the voice
actually stops (the vocal stem drops well below its local level), never in the middle of a held note; through short
gaps between lines it stays gently closed. Shapes lead the
sound by LEAD seconds, as in hand-drawn lip sync. Writes window.LIPKEYS = [[t, shape], …] and window.LIPLINES =
{line: [from, to]} (when each line's mouth is live), plus a report next to the alignment files.
"""
import json
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

voc, timing, fa_b, fa_l, out = sys.argv[1:6]
LEAD = 0.04     # shapes lead the sound by about a frame
ONSET = 0.08    # how long lips stay closed/rounded before a vowel
src = Path(timing).read_text(encoding='utf-8')
T = json.loads(src[src.index('{'):src.rindex('}') + 1])
FB = {r['i']: r for r in json.loads(Path(fa_b).read_text(encoding='utf-8'))}
FL = {r['i']: r for r in json.loads(Path(fa_l).read_text(encoding='utf-8'))} if Path(fa_l).exists() else {}

# ---- the voice: level in dB (10 ms) and where it is quiet relative to its surroundings
wav, sr = sf.read(voc, dtype='float32', always_2d=True); x = wav.mean(1)
HZ = 100; hop = sr // HZ; win = sr // 40; n = len(x) // hop; pad = np.pad(x, (win // 2, win))
db = 20 * np.log10(np.array([np.sqrt(np.mean(pad[k * hop:k * hop + win] ** 2)) + 1e-9 for k in range(n)]))
db = np.convolve(db, np.ones(3) / 3, mode='same')
floor = np.percentile(db, 5)
locmax = np.array([db[max(0, k - 120):k + 120].max() for k in range(n)])
quiet = (db < locmax - 15) | (db < floor + 8)
for _ in range(2):   # drop blips shorter than 80 ms either way
    k = 0
    while k < n:
        j = k
        while j < n and quiet[j] == quiet[k]: j += 1
        if j - k < 8: quiet[k:j] = not quiet[k]
        k = j
def is_quiet(t): k = int(t * HZ); return 0 <= k < n and quiet[k]
def next_quiet(t, until):
    """first time ≥ t where the voice stops (≥ 0.1 s), before `until`"""
    for k in range(int(t * HZ), min(n, int(until * HZ))):
        if quiet[k:k + 10].all(): return k / HZ
    return None

# ---- word timing: consensus of the two aligners and whisper
def pick(i, j, wh):
    b = FB.get(i, {}).get('words', [None] * 999)[j] if i in FB else None
    l = FL.get(i, {}).get('words', [None] * 999)[j] if i in FL else None
    b = b if b and b['t0'] is not None else None; l = l if l and l['t0'] is not None else None
    if b and l:
        if abs(b['t0'] - l['t0']) <= 0.08:
            return (b['t0'] + l['t0']) / 2, (b if FB[i]['conf'] >= FL[i]['conf'] else l), 'agree'
        cb, cl = abs(b['t0'] - wh), abs(l['t0'] - wh)
        src = b if cb < cl else l
        return src['t0'], src, 'whisper-tiebreak'
    if b or l:
        s = b or l; return s['t0'], s, 'one'
    return wh, None, 'whisper'

# ---- spelling -> syllables -> shapes (same rules as v2/lip.js, plus the long "I")
SPOKEN = {'110': 'a hundred and ten'}
AI_WORDS = {'i', 'im', 'ill', 'ive', 'id', 'hi', 'high', 'kind', 'mind', 'find', 'behind', 'child', 'wild', 'climb', 'tonight', 'my', 'by', 'why', 'fly', 'lie', 'die', 'eye', 'eyes', 'bye', 'try', 'cry', 'sky'}
def sylls(word):
    w = re.sub(r"[^a-z]", '', word.lower())
    groups = [(m.group(), m.start()) for m in re.finditer(r'[aeiouy]+', w)]
    if len(groups) > 1 and groups[-1][0] == 'e' and groups[-1][1] == len(w) - 1 and not re.search(r'[^aeiou]le$', w): groups.pop()
    if groups and groups[0][1] == 0 and w[0] == 'y' and len(groups[0][0]) > 1: groups[0] = (groups[0][0][1:], 1)
    out = []
    for k, (g, at) in enumerate(groups):
        prev_end = groups[k - 1][1] + len(groups[k - 1][0]) if k else 0
        onset = w[prev_end:at]
        v = g[1] if g[0] == 'y' and len(g) > 1 else g[0]
        shape = {'a': 'a', 'e': 'base', 'i': 'base', 'o': 'o', 'u': 'o', 'y': 'base'}.get(v, 'base')
        if re.match(r'oo|ew|ue|ou|ow', g): shape = 'o'
        elif re.match(r'ee|ea|ie|ai|ay|ei', g): shape = 'base'
        elif g == 'i' and re.search(r'[^aeiou]e$', w) and re.fullmatch(r'[^aeiou]*', w[at + 1:-1]): shape = 'a'
        if 'igh' in w and v == 'i': shape = 'a'
        if w in AI_WORDS and k == 0: shape = 'a'
        last = onset[-1:] if onset else ''
        out.append({'shape': shape, 'vowel_at': at, 'onset_at': (at - 1) if last else None,
                    'onset': 'closed' if last and last in 'mbpfv' else ('o' if last == 'w' else None)})
    final = w[-1:] if w else ''
    return w, out, (len(w) - 1 if final in 'mbp' and groups and groups[-1][1] + len(groups[-1][0]) <= len(w) - 1 else None)

def letter_times(word, chars, t0, t1):
    """time of each letter of the normalised word (a–z only)"""
    w = re.sub(r"[^a-z]", '', word.lower())
    cs = [c for c in (chars or []) if c[0].isalpha()]
    if cs and len(cs) == len(w):
        return [c[1] for c in cs]
    if cs:   # spelled differently (e.g. 110): stretch what we have
        return [cs[min(len(cs) - 1, int(k * len(cs) / max(1, len(w))))][1] for k in range(len(w))]
    return [t0 + (t1 - t0) * k / max(1, len(w)) for k in range(len(w))]

KEYS, LINES, report, PER = [], {}, [], []
lines = T['lines']
for i, ln in enumerate(lines):
    ws = ln['words']; picked = []
    for j, w in enumerate(ws):
        t0, s, how = pick(i, j, w['t0'])
        chars = None
        if s:
            sh = t0 - s['t0']; chars = [[c, a + sh, b + sh] for c, a, b in s['chars']]
        picked.append((t0, chars, how))
    # keep starts in order and at least 50 ms apart
    starts = []
    for j, (t0, chars, how) in enumerate(picked):
        if starts and t0 < starts[-1] + 0.05:
            sh = starts[-1] + 0.05 - t0; t0 += sh
            if chars: chars = [[c, a + sh, b + sh] for c, a, b in chars]
            picked[j] = (t0, chars, how)
        starts.append(t0)
    # sung units: words, with numerals split into the words actually sung ("110" -> "a hundred and ten")
    units = []
    for j, (w, (t0, chars, how)) in enumerate(zip(ws, picked)):
        spoken = SPOKEN.get(re.sub(r'[^0-9a-z]', '', w['w'].lower()))
        if not spoken:
            units.append((w['w'], chars, t0, j)); continue
        cs = [c for c in (chars or []) if c[0].isalpha()]; k = 0
        for sw in spoken.split():
            part = cs[k:k + len(sw)]; k += len(sw)
            units.append((sw, part or None, part[0][1] if part else t0, j))
    lk = []
    for u, (text, chars, t0, j) in enumerate(units):
        nxt_u = units[u + 1][2] if u + 1 < len(units) else None
        t1 = nxt_u if nxt_u is not None else max(t0 + 0.25, (chars[-1][2] if chars else ws[j]['t1']))
        lt = letter_times(text, chars, t0, t1)
        word, syl, final_mbp = sylls(text)
        if not syl: continue
        for s in syl:
            tv = lt[s['vowel_at']] if s['vowel_at'] < len(lt) else t0
            if s['onset']:   # lips close (or round) for the last ~80 ms before the vowel, as drawn lip sync does
                lk.append([tv - LEAD - ONSET, s['onset']])
            lk.append([tv - LEAD, s['shape']])
        # a final m/b/p closes the lips just before the next word (if the voice runs on to it)
        if final_mbp is not None and nxt_u is not None and nxt_u - lk[-1][0] > 0.2:
            lk.append([nxt_u - LEAD - ONSET, 'closed'])
    # breaths inside the line: the mouth closes where the voice stops between words
    for j in range(len(starts) - 1):
        q = next_quiet(starts[j] + 0.12, starts[j + 1] - 0.06)
        if q is not None: lk.append([q + 0.02, 'closed'])
    lk.sort(key=lambda k: k[0])
    # a closure never outlasts ~0.1 s once she is singing again: the aligner marks a vowel when it is sure of it, often
    # a little after the voice has resumed (after a consonant or a breath), so reopen on the voice to the coming shape
    fixed = []
    for idx, (t, sh) in enumerate(lk):
        fixed.append([t, sh])
        if sh != 'closed' or idx + 1 >= len(lk): continue
        nt = lk[idx + 1][0]
        if nt - t <= 0.14: continue
        k = next((k for k in range(int((t + 0.08) * HZ), int(nt * HZ)) if 0 <= k < n and not quiet[k]), None)
        if k is None: continue
        ro = max(t + 0.08, k / HZ - LEAD)
        if nt - ro < 0.05: continue
        coming = next((s2 for _, s2 in lk[idx + 1:] if s2 != 'closed'), 'base')
        fixed.append([ro, coming])
    lk = sorted(fixed, key=lambda k: k[0])
    last_letter = max([lt_ for u in units for lt_ in ([c[1] for c in u[1]] if u[1] else [u[2]])] + [starts[-1]])
    PER.append({'i': i, 'lk': lk, 'last_start': starts[-1], 'last_letter': last_letter, 'picked': picked, 'starts': starts})
# second pass: each line's mouth closes where the voice stops after its last word, and always before the next line;
# through short gaps between lines (< 1.5 s) it stays gently closed instead of going back to the painted smile, and it
# closes 0.2 s before a phrase starts
ENDS = []
for k, L_ in enumerate(PER):
    nxt_first = PER[k + 1]['lk'][0][0] if k + 1 < len(PER) and PER[k + 1]['lk'] else T['duration']
    s0 = max(L_['last_start'] + 0.12, L_['last_letter'] + 0.05)
    end = next_quiet(s0, nxt_first - 0.05)
    if end is None: end = min(nxt_first - 0.08, L_['last_letter'] + 0.9)
    ENDS.append((end, nxt_first))
for k, L_ in enumerate(PER):
    i, lk = L_['i'], L_['lk']; end, nxt_first = ENDS[k]
    first = lk[0][0]; prev_end = ENDS[k - 1][0] if k else -1
    lk = [x for x in lk if x[0] < end] + [[end + 0.02, 'closed']]
    if prev_end + 0.02 <= first - 0.2: lk = [[first - 0.2, 'closed']] + lk
    clean = []   # drop keys that would last less than one frame
    for x in lk:
        if clean and x[0] - clean[-1][0] < 0.033: clean[-1] = x
        else: clean.append(x)
    KEYS.extend(clean)
    win_end = nxt_first - 0.05 if nxt_first - end < 1.5 else end + 0.12
    LINES[i] = [round(first - 0.2, 3), round(max(end + 0.06, min(win_end, nxt_first - 0.05)), 3)]
    ln = lines[i]; ws = ln['words']; hows = [h for _, _, h in L_['picked']]
    report.append(f"L{i:3d} {ln['t0']:7.2f}  start {L_['starts'][0] - ws[0]['t0']:+.2f}s vs whisper  words: agree {hows.count('agree')}/{len(hows)}"
                  f"  tiebreak {hows.count('whisper-tiebreak')}  single {hows.count('one')}  whisper-only {hows.count('whisper')}  ends {end:.2f}")
KEYS.sort(key=lambda k: k[0])
# ad-libs that are not on the lyric sheet ("go, go" before "everybody lives forever"): where the mouth is closed but she
# is clearly singing for ≥ 150 ms, the mouth follows the voice — opens on it, closes briefly at its syllable dips
# (not over the lines she deliberately doesn't sing: the SKIP set in v2/sec_sing.js)
sing_src = Path(timing).parent.parent / 'v2' / 'sec_sing.js'
SKIP = set(int(v) for v in re.search(r'SKIP = new Set\(\[([^\]]*)\]', sing_src.read_text(encoding='utf-8')).group(1).split(',')) if sing_src.exists() else set()
def skipped(t):
    for i in SKIP:
        w = lines[i]['words']; fb = (FB.get(i) or {}).get('words') or []
        a = min([w[0]['t0']] + [x['t0'] for x in fb[:1] if x.get('t0') is not None]) - 0.3
        b = max([w[-1]['t1']] + [x['t1'] for x in fb[-1:] if x.get('t1') is not None]) + 0.1
        if a <= t <= b: return True
    return False
ADLIB = []
for idx in range(len(KEYS) - 1):
    t, sh = KEYS[idx]; t2 = KEYS[idx + 1][0]
    if sh != 'closed' or t2 - t < 0.3: continue
    k, kend = int((t + 0.06) * HZ), int((t2 - 0.05) * HZ)
    while k < kend:
        if quiet[k]: k += 1; continue
        j = k
        while j < kend and not quiet[j]: j += 1
        j = next((m for m in range(k, j) if skipped(m / HZ)), j)   # stop where a line she doesn't sing begins
        if j - k >= 15 and (locmax[k:j] - db[k:j]).mean() < 10 and not skipped(k / HZ):
            seg = db[k:j]; shp = 'o'
            ADLIB.append([k / HZ - LEAD, shp])
            m = k + 12
            while m < j - 10:   # a dip of ≥ 4 dB between two louder stretches = a new syllable
                if db[m] < min(db[k:m].max(), db[m:j].max()) - 4 and db[m] <= db[m - 3:m + 4].min():
                    r = m + int(np.argmax(db[m:min(j, m + 20)] > db[m] + 3)) if (db[m:min(j, m + 20)] > db[m] + 3).any() else m + 6
                    shp = 'a' if shp == 'o' else 'o'
                    ADLIB += [[m / HZ - 0.03, 'closed'], [r / HZ - LEAD, shp]]
                    m = r + 12
                else: m += 1
            if j < kend: ADLIB.append([j / HZ + 0.02, 'closed'])
        k = max(j, k + 1)
KEYS = sorted(KEYS + ADLIB, key=lambda k: k[0])
print('ad-lib keys', len(ADLIB), ' at', ' '.join(f'{t:.1f}' for t, s_ in ADLIB if s_ != 'closed')[:400])
Path(out).write_text('// Generated by tools/lipkeys.py from forced alignment of the lyrics to the vocal stem (see v2/lip.js).\n'
                     'window.LIPKEYS = ' + json.dumps([[round(t, 3), s] for t, s in KEYS]) + ';\n'
                     'window.LIPLINES = ' + json.dumps(LINES) + ';\n', encoding='utf-8')
Path(fa_b).with_name('lipkeys_report.txt').write_text('\n'.join(report) + '\n', encoding='utf-8')
agree = sum(int(r.split('agree ')[1].split('/')[0]) for r in report); tot = sum(int(r.split('/')[1].split()[0]) for r in report)
print(f'keys {len(KEYS)}, lines {len(LINES)}, words where both aligners agree: {agree}/{tot}')
