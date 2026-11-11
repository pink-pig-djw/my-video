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
lines, sec = [], None
for raw in lyr_path.read_text(encoding="utf-8").splitlines():
    raw = raw.strip()
    if not raw or raw.startswith("#"):
        continue
    if raw.startswith("@"):
        sec = raw[1:]
        continue
    en, zh = [s.strip() for s in raw.split("|")]
    toks = [t for t in re.split(r"\s+", en) if norm(t)]
    lines.append({"i": len(lines), "sec": sec, "en": en, "zh": zh, "toks": toks})

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

# Manual fixes where whisper missed or stretched words. The final hook (lines 164-166) comes from a separate
# transcription of 340-352 s with a hint prompt; its spacing matches the chorus-3 hook (1.9 s between "Evil"s).
OVERRIDE = {
    164: {0: (347.72, 348.20), 1: (348.28, 348.80), 2: (348.86, 349.25), 3: (349.30, 349.65)},
    165: {0: (349.70, 350.00), 1: (350.02, 350.60), 2: (350.64, 351.05), 3: (351.12, 351.45)},
    166: {0: (351.52, 351.66), 1: (351.68, 351.82)},
}
for li, fixes in OVERRIDE.items():
    idx = [k for k in range(n) if L[k][0] == li]
    for wj, (a, b) in fixes.items():
        if wj < len(idx):
            tt[idx[wj]] = (a, b)
            pairs[idx[wj]] = -1

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
    report.append(f"{ln['t0']:7.2f}-{ln['t1']:7.2f} [{ln['sec']:8s}] c={ln['conf']:.2f} {ln['en']}\n{'':37s}heard: {heard}{flag}")
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
