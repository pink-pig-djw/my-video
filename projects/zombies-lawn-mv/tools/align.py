"""Align the supplied lyric sheet to whisper word timestamps.

Usage: python tools/align.py audio/lyrics.txt audio/words.json audio/analysis.json src/data/timing.js
Writes a JS data file (window.TIMING = {...}) with per-line and per-word times, beats and the energy curve,
plus audio/alignment_report.txt for checking.
"""
import json
import re
import sys
from difflib import SequenceMatcher
from pathlib import Path

lyr_path, words_path, ana_path, out_path = map(Path, sys.argv[1:5])


def norm(w):
    w = w.lower().replace("’", "'")
    w = re.sub(r"[^a-z0-9']", "", w)
    w = w.replace("'", "")
    return {"wanna": "want", "gonna": "going", "110": "hundred"}.get(w, w)


# ---- lyric sheet -------------------------------------------------------------
# Plain line = the sunflower; "Z: " = a zombie sings it; "~" = the sunflower's echo/backing line. For alignment an echo
# is glued to the line before it (whisper rarely hears echoes), then split off again.
lines, sec = [], None
for raw in lyr_path.read_text(encoding="utf-8").splitlines():
    raw = raw.strip()
    if not raw or raw.startswith("#"):
        continue
    if raw.startswith("@"):
        sec = raw[1:]
        continue
    who, echo = "S", False
    if raw.startswith("Z:"):
        who, raw = "Z", raw[2:].strip()
    opt = False
    if raw.startswith("~?"):
        echo, opt, raw = True, True, raw[2:].strip()
    elif raw.startswith("~"):
        echo, raw = True, raw[1:].strip()
    en = raw
    toks = [t for t in re.split(r"\s+", en.strip("()")) if norm(t)]
    lines.append({"i": len(lines), "sec": sec, "who": who, "echo": echo, "opt": opt, "en": en, "toks": toks})

L = []  # flat lyric tokens: (line index, token index, normalized)
for ln in lines:
    for j, t in enumerate(ln["toks"]):
        n = norm(t)
        if n == "110":
            n = "hundred"
        L.append((ln["i"], j, n))

W = json.loads(words_path.read_text(encoding="utf-8"))["words"]
Wn = [norm(w["word"]) for w in W]


def sim(a, b):
    if a == b:
        return 1.0
    if not a or not b:
        return 0.0
    r = SequenceMatcher(None, a, b).ratio()
    return r if r >= 0.6 else 0.0


# ---- Needleman-Wunsch with fuzzy match score ---------------------------------
n, m = len(L), len(Wn)
GAP_L, GAP_W = -0.45, -0.35
score = [[0.0] * (m + 1) for _ in range(n + 1)]
back = [[0] * (m + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    score[i][0] = score[i - 1][0] + GAP_L
    back[i][0] = 1
for j in range(1, m + 1):
    score[0][j] = score[0][j - 1] + GAP_W
    back[0][j] = 2
for i in range(1, n + 1):
    li = L[i - 1][2]
    row, prow = score[i], score[i - 1]
    for j in range(1, m + 1):
        s = sim(li, Wn[j - 1])
        d = prow[j - 1] + (2.0 * s if s > 0 else -0.8)
        u = prow[j] + GAP_L
        lft = row[j - 1] + GAP_W
        if d >= u and d >= lft:
            row[j], back[i][j] = d, 0
        elif u >= lft:
            row[j], back[i][j] = u, 1
        else:
            row[j], back[i][j] = lft, 2
pairs = {}
i, j = n, m
while i > 0 or j > 0:
    b = back[i][j]
    if i > 0 and j > 0 and b == 0:
        if sim(L[i - 1][2], Wn[j - 1]) > 0:
            pairs[i - 1] = j - 1
        i, j = i - 1, j - 1
    elif i > 0 and (j == 0 or b == 1):
        i -= 1
    else:
        j -= 1

# ---- per-token times, interpolating gaps ---------------------------------------
tt = [None] * n
for li_, wj in pairs.items():
    tt[li_] = (W[wj]["start"], W[wj]["end"])
known = [k for k in range(n) if tt[k]]
for k in range(n):
    if tt[k]:
        continue
    prv = max([q for q in known if q < k], default=None)
    nxt = min([q for q in known if q > k], default=None)
    if prv is None and nxt is None:
        tt[k] = (0, 0.3)
    elif prv is None:
        tt[k] = (tt[nxt][0] - 0.3 * (nxt - k), tt[nxt][0] - 0.3 * (nxt - k) + 0.25)
    elif nxt is None:
        tt[k] = (tt[prv][1] + 0.3 * (k - prv) - 0.25, tt[prv][1] + 0.3 * (k - prv))
    else:
        a, b = tt[prv][1], tt[nxt][0]
        f0, f1 = (k - prv) / (nxt - prv), (k - prv + 1) / (nxt - prv)
        span = max(0.0, b - a)
        tt[k] = (a + span * (f0 - 0.5 / (nxt - prv)), a + span * (f1 - 0.5 / (nxt - prv)))

pairs = dict(pairs)
# Windows (s) for lines whisper could not place: the echoes and the low zombie voice, read off the pitch track of the
# vocal stem (male ~80-150 Hz vs. the lead ~250-400 Hz) and the free phoneme decode. Tokens are spread evenly inside;
# the forced aligners refine them.
WIN = {2: (24.62, 25.05), 3: (25.02, 28.3), 5: (32.2, 33.0), 8: (41.0, 41.8),
       15: (63.25, 65.86), 16: (65.9, 66.97), 17: (67.02, 69.88), 18: (69.86, 71.42), 19: (71.45, 75.02), 20: (75.05, 77.0),
       21: (77.45, 79.55), 24: (86.9, 87.3), 27: (95.9, 96.3),
       34: (118.1, 120.2), 35: (120.22, 122.52), 36: (122.55, 125.1), 37: (125.45, 126.2), 38: (126.4, 128.95),
       39: (129.0, 130.95), 40: (132.3, 134.4), 43: (141.7, 142.1), 46: (150.8, 151.3)}
for li, (a, b) in WIN.items():
    lines[li]['win'] = [a, b]
    idx = [k for k in range(n) if L[k][0] == li]
    lens = [max(1, len(L[k][2])) for k in idx]; tot = sum(lens); acc = 0
    for k, ln_ in zip(idx, lens):
        tt[k] = (a + (b - a) * acc / tot, a + (b - a) * (acc + ln_) / tot); acc += ln_
        pairs.pop(k, None)

report = []
for ln in lines:
    idx = [k for k in range(n) if L[k][0] == ln["i"]]
    matched = sum(1 for k in idx if k in pairs)
    ln["words"] = [{"w": ln["toks"][L[k][1]], "t0": round(tt[k][0], 3), "t1": round(tt[k][1], 3)} for k in idx]
    ln["t0"] = ln["words"][0]["t0"] if ln["words"] else 0
    ln["t1"] = ln["words"][-1]["t1"] if ln["words"] else 0
    ln["conf"] = round(matched / max(1, len(idx)), 2)
    heard = " ".join(W[pairs[k]]["word"].strip() if pairs[k] >= 0 else "(fixed)" for k in idx if k in pairs)
    flag = "  <-- CHECK" if ln["conf"] < 0.6 else ""
    report.append(f"{ln['t0']:7.2f}-{ln['t1']:7.2f} [{ln['sec']:8s}] {ln['who']}{'~' if ln['echo'] else ' '} c={ln['conf']:.2f} {ln['en']}\n{'':37s}heard: {heard}{flag}")
    del ln["toks"]

ana = json.loads(ana_path.read_text(encoding="utf-8"))
data = {
    "duration": ana["duration"],
    "tempo": ana["tempo"],
    "beats": ana["beats"],
    "downbeats": ana["downbeats"],
    "rms_db": ana["rms_db"],
    "perc": ana["perc"],
    "lines": lines,
}
out_path.parent.mkdir(parents=True, exist_ok=True)
out_path.write_text("// Generated by tools/align.py: lyric timing (from the user's lyric sheet), beats and energy.\nwindow.TIMING = "
                    + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
(lyr_path.parent / "alignment_report.txt").write_text("\n".join(report), encoding="utf-8")
print(f"{len(lines)} lines, {len(pairs)}/{n} tokens matched; low-confidence lines: {sum(1 for l in lines if l['conf'] < 0.6)}")
