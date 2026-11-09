#!/usr/bin/env python3
"""《百年一线》配乐：纯代码合成。同一段主题贯穿 11 个段落，配器和音质随时代变化，再叠环境声。

  uv run --no-project --with numpy --with scipy python tools/score.py
输出 audio/song.wav（150 s，44.1 kHz 立体声）和 audio/cues.json（段落和小节时间，画面按它卡点）。
"""
import json
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, lfilter, sosfilt

ROOT = Path(__file__).resolve().parent.parent
SR = 44100
TOTAL = 150.0
rng = np.random.default_rng(1917)


def mf(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(d):
    return np.arange(int(d * SR)) / SR


def lp(x, f, o=2):
    return sosfilt(butter(o, min(f, SR * .45) / (SR / 2), 'low', output='sos'), x, axis=0)


def hp(x, f, o=2):
    return sosfilt(butter(o, f / (SR / 2), 'high', output='sos'), x, axis=0)


def bp(x, a, b, o=2):
    return sosfilt(butter(o, [a / (SR / 2), min(b, SR * .45) / (SR / 2)], 'band', output='sos'), x, axis=0)


def adsr(n, a=.01, d=.1, s=.7, r=.1):
    A, D, R = int(a * SR), int(d * SR), int(r * SR)
    e = np.full(n, s, float)
    A = min(A, n)
    e[:A] = np.linspace(0, 1, A, endpoint=False)
    D2 = min(D, n - A)
    e[A:A + D2] = np.linspace(1, s, D2, endpoint=False)
    R = min(R, n)
    e[n - R:] *= np.linspace(1, 0, R)
    return e


def saw(f, t, ph=0.0):
    return 2 * ((f * t + ph) % 1.0) - 1


# ---------- 乐器 ----------
def piano(m, dur, v=.7):
    f = mf(m)
    d = max(dur, .25) + 1.8
    t = tt(d)
    y = np.zeros_like(t)
    B = .00035 * (1 + max(0, m - 60) / 30)
    top = int(min(14, 15000 / f))
    for k in range(1, top + 1):
        fk = f * k * np.sqrt(1 + B * k * k)
        a = (1 / k ** (1.55 - .7 * v)) * (1 if k > 1 else 1.15)
        dec = (1.1 + 2.2 * k / 8) * (f / 262) ** .35 + .25
        for det in (-.12, .12):
            y += .5 * a * np.sin(2 * np.pi * (fk + det) * t + rng.uniform(0, 6.28)) * np.exp(-t * dec)
    n = len(t)
    y[:220] *= np.linspace(0, 1, 220)
    h = bp(rng.standard_normal(1400), 300, 3200) * np.exp(-np.arange(1400) / 300)
    y[:1400] += h * .35 * v
    rel = int(max(dur, .2) * SR)
    if rel < n:
        y[rel:] *= np.exp(-np.arange(n - rel) / (SR * .28))
    return y * v * .34


def musicbox(m, dur, v=.7):
    f = mf(m)
    t = tt(1.8)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t * 2.8) + .55 * np.sin(2 * np.pi * f * 3.02 * t) * np.exp(-t * 7) + .3 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 16)
    y[:60] *= np.linspace(0, 1, 60)
    return y * v * .35


def fm_ep(m, dur, v=.7):
    f = mf(m)
    t = tt(max(dur, .2) + .9)
    i1 = 2.2 * v * np.exp(-t * 5)
    y = np.sin(2 * np.pi * f * t + i1 * np.sin(2 * np.pi * f * t))
    y += .32 * v * np.sin(2 * np.pi * f * t + 1.4 * np.exp(-t * 28) * np.sin(2 * np.pi * f * 14 * t)) * np.exp(-t * 11)
    return y * np.exp(-t * 1.5) * adsr(len(t), .002, .05, 1, .12) * v * .3


def strings(m, dur, v=.6, att=.18):
    f = mf(m)
    d = dur + .35
    t = tt(d)
    vib = .0035 * np.sin(2 * np.pi * 5.3 * t) * np.minimum(1, t / .5)
    y = np.zeros_like(t)
    for de in (-.006, -.0025, 0, .003, .0065):
        y += saw(f * (1 + de), t * (1 + vib), rng.uniform())
    y = lp(y / 5, min(1500 + 2600 * v + f * 1.5, 9000))
    return y * adsr(len(t), att, .1, .9, .32) * v * .3


def brass(m, dur, v=.7, att=.03):
    f = mf(m)
    t = tt(dur + .12)
    y = saw(f, t) + .7 * saw(f * 1.004, t, .3)
    e = np.exp(-t * 7) * .7 + .3
    y = lp(y, 700) * (1 - e) + lp(y, 700 + 4200 * v) * e
    return np.tanh(y * 1.3) * adsr(len(t), att, .08, .78, .08) * v * .23


def pad(m, dur, v=.5, cut=2200):
    f = mf(m)
    t = tt(dur + .9)
    y = saw(f * .997, t) + saw(f * 1.003, t, .4) + .5 * saw(f * 2.002, t, .7)
    y = lp(y, cut)
    return y * adsr(len(t), .55, .2, .85, .8) * v * .13


def lead(m, dur, v=.6, kind='saw'):
    f = mf(m)
    t = tt(dur + .1)
    vib = 1 + .004 * np.sin(2 * np.pi * 5.8 * t) * np.minimum(1, t / .3)
    ph = np.cumsum(f * vib) / SR
    y = (2 * (ph % 1) - 1) if kind == 'saw' else np.sign(np.sin(2 * np.pi * ph))
    y = lp(y, 3400) * adsr(len(t), .012, .1, .75, .06)
    return y * v * .17


def bass(m, dur, v=.7, kind='pluck'):
    f = mf(m)
    t = tt(dur + .05)
    if kind == 'sub':
        y = np.sin(2 * np.pi * f * t) + .2 * np.tanh(3 * np.sin(2 * np.pi * f * t))
        return y * adsr(len(t), .006, .1, .85, .05) * v * .42
    if kind == 'fm':
        y = np.sin(2 * np.pi * f * t + 3.2 * np.exp(-t * 16) * np.sin(2 * np.pi * f * t))
        return y * np.exp(-t * 2.2) * adsr(len(t), .002, .02, 1, .04) * v * .45
    y = lp(saw(f, t), 300 + 1900 * np.exp(-.0) * v)
    return np.tanh(y * 2.1) * np.exp(-t * 3.6) * adsr(len(t), .002, .02, 1, .03) * v * .4


def guitar(ms, dur, v=.7):
    out = None
    for m in ms:
        f = mf(m)
        n = int((dur + .1) * SR)
        p = int(SR / f)
        x = np.zeros(n)
        x[:p] = rng.uniform(-1, 1, p)
        a = np.zeros(p + 2)
        a[0], a[p], a[p + 1] = 1, -.4985, -.4985
        y = lfilter([1.], a, x)
        out = y if out is None else out + y
    y = np.tanh(hp(out, 90) * 3.5)
    y = lp(y, 4200)
    return y * adsr(len(y), .002, .05, .9, .05) * v * .12


def kick(v=.8):
    t = tt(.34)
    f = 46 + 120 * np.exp(-t * 34)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11) * v * .75


def snare(v=.7, gated=False):
    d = .42 if gated else .2
    t = tt(d)
    n = bp(rng.standard_normal(len(t)), 900, 8000)
    b = np.sin(2 * np.pi * 195 * t) * np.exp(-t * 26)
    e = np.exp(-t * (5 if gated else 18))
    y = n * e * .55 + b * .6
    if gated:
        y[int(.27 * SR):] *= np.linspace(1, 0, len(y) - int(.27 * SR))
    return y * v * .55


def hat(v=.5, op=False):
    t = tt(.3 if op else .06)
    return hp(rng.standard_normal(len(t)), 7500) * np.exp(-t * (11 if op else 70)) * v * .2


def clap(v=.6):
    t = tt(.18)
    n = bp(rng.standard_normal(len(t)), 900, 5200)
    e = np.exp(-t * 26)
    for o in (.011, .022):
        e = e + np.roll(np.exp(-t * 90), int(o * SR)) * .8
    return n * e * v * .22


def crash(v=.6, d=2.6):
    t = tt(d)
    return hp(rng.standard_normal(len(t)), 3500) * np.exp(-t * 2.2) * v * .18


def taiko(v=.8, low=True):
    t = tt(.95)
    f = (58 if low else 92) + 62 * np.exp(-t * 24)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5.2)
    y[:2400] += bp(rng.standard_normal(2400), 200, 2300) * np.exp(-np.arange(2400) / 500) * .5
    return y * v * .78


def tom(m, v=.7):
    t = tt(.4)
    f = mf(m) * (1 + .6 * np.exp(-t * 30))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8) * v * .55


def noise_sweep(d, f0, f1, v=.5, q=.35):
    """频率从 f0 扫到 f1 的风声，分块滤波。"""
    n = int(d * SR)
    x = rng.standard_normal(n + 4096)
    y = np.zeros(n)
    blk = 2048
    for i in range(0, n, blk):
        c = f0 * (f1 / f0) ** (i / n)
        s = bp(x[i:i + blk + 2048], max(30, c * (1 - q)), c * (1 + q))
        m = min(blk, n - i)
        y[i:i + m] = s[1024:1024 + m] if len(s) >= 1024 + m else s[:m]
    return y * v


# ---------- 混音总线 ----------
class Bus:
    def __init__(self, dur, tail=7.0):
        n = int((dur + tail) * SR)
        self.dry = np.zeros((n, 2))
        self.wet = np.zeros((n, 2))

    def add(self, t, y, pan=0.0, g=1.0, send=.2):
        i = int(t * SR)
        if i < 0:
            y, i = y[-i:], 0
        if i >= len(self.dry):
            return
        y = y[:len(self.dry) - i]
        pan = np.asarray(pan, float)
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        st = np.stack([y * l * 1.414, y * r * 1.414], 1) * g
        self.dry[i:i + len(y)] += st
        if send:
            self.wet[i:i + len(y)] += st * send

    def mix(self, t60=1.8, pre=.02, dark=6000, mixw=1.0):
        n = int(t60 * 1.3 * SR)
        t = np.arange(n) / SR
        ir = rng.standard_normal((n, 2)) * np.exp(-t * 6.9 / t60)[:, None]
        ir = lp(ir, dark)
        ir[:int(.004 * SR)] *= .2
        ir = np.vstack([np.zeros((int(pre * SR), 2)), ir])
        ir /= np.sqrt((ir ** 2).sum(0, keepdims=True))
        w = np.stack([fftconvolve(self.wet[:, c], ir[:, c])[:len(self.wet)] for c in (0, 1)], 1)
        return self.dry + w * mixw


master = np.zeros((int((TOTAL + 8) * SR), 2))


def put(t, st, g=1.0):
    i = int(t * SR)
    m = min(len(st), len(master) - i)
    master[i:i + m] += st[:m] * g


def hum(x):
    return x + rng.uniform(-.006, .006)


# ---------- 主题（C 调，4/4 共 8 小节） ----------
THEME = [(0, 1, 69), (1, 1, 72), (2, 1.5, 77), (3.5, .5, 76), (4, 2, 74), (6, 1, 71), (7, 1, 67),
         (8, 1, 67), (9, 1, 71), (10, 1.5, 76), (11.5, .5, 74), (12, 3, 72), (15, 1, 69),
         (16, 1, 69), (17, 1, 72), (18, 1, 77), (19, 1, 81), (20, 3, 79), (23, .5, 77), (23.5, .5, 76),
         (24, 1, 76), (25, 1, 74), (26, 1, 72), (27, 1, 74), (28, 4, 72)]
CH = {'F': [53, 60, 65, 69, 72], 'G': [55, 62, 67, 71, 74], 'Em': [52, 59, 64, 67, 71], 'Am': [57, 60, 64, 69, 72],
      'Dm': [50, 57, 62, 65, 69], 'C': [48, 55, 60, 64, 67]}
PROG = [(0, 4, 'F'), (4, 4, 'G'), (8, 4, 'Em'), (12, 4, 'Am'), (16, 4, 'F'), (20, 4, 'G'), (24, 2, 'Dm'), (26, 2, 'G'), (28, 4, 'C')]
cues = {'sections': [], 'hits': []}


def sec(name, t0, t1, bpm, beats=4):
    cues['sections'].append(dict(name=name, t0=t0, t1=t1, bpm=bpm, beats=beats))
    return 60.0 / bpm


def theme(b, ins, bt, k=0, g=1.0, oct_=0, send=.25, pan=0.0, start=0, stop=32, stac=1.0, shift=0, **kw):
    for s, d, m in THEME:
        if start <= s < stop:
            b.add(hum((s - start + shift) * bt), ins(m + k + 12 * oct_, d * bt * stac, **kw), pan, g, send)


def s0():
    b = Bus(6, 5)
    b.add(3.0, piano(72, 2.6, .55), 0, 1, .5)
    b.add(4.5, piano(79, 1.4, .36), .15, 1, .55)
    for m in (48, 60):
        b.add(3.0, pad(m, 3, .5, 900), 0, .6, .4)
    put(0, b.mix(3.2, .03, 5000))


def s1():
    bt = sec('1917', 6, 16, 108, 3)
    bar = bt * 3
    mel = [(0, 1, 72), (1, 1, 76), (2, 1, 79), (3, 2, 81), (5, 1, 79), (6, 1, 77), (7, 1, 81), (8, 1, 77), (9, 2, 76), (11, 1, 72),
           (12, 1, 74), (13, 1, 77), (14, 1, 71), (15, 3, 72)]
    chords = ['C', 'F', 'F', 'C', 'G', 'C']
    old = Bus(10, 3)
    new = Bus(10, 5)
    for s, d, m in mel:
        tgt, ins, g = (old, musicbox, 1) if s < 12 else (new, piano, .8)
        tgt.add(hum(s * bt), ins(m + 12 * (s < 12), d * bt, .7), 0, g, .3)
    for i, c in enumerate(chords):
        tgt, ins = (old, piano) if i < 4 else (new, piano)
        cc = CH[c]
        tgt.add(i * bar, ins(cc[0], bt, .45), 0, .85, .2)
        for j in (1, 2):
            tgt.add(i * bar + j * bt, ins(cc[2], bt * .6, .3), .1, .7, .2)
            tgt.add(i * bar + j * bt, ins(cc[3], bt * .6, .3), -.1, .7, .2)
    for m in CH['G'][1:4]:
        new.add(4 * bar - .1, strings(m + 12, bar * .95, .45, .5), 0, 1, .4)
    for m in CH['C'][1:]:
        new.add(5 * bar, strings(m + 12, bar, .5, .4), 0, 1, .4)
    o = old.mix(1.0, .01, 4000)
    o = bp(o.mean(1), 320, 3300)
    o = np.tanh(o * 2.4) * .55
    wow = 1 + .0
    cr = np.zeros(len(o))
    idx = rng.integers(0, len(o), 380)
    cr[idx] = rng.uniform(-.5, .5, len(idx))
    cr = bp(cr, 900, 7000) * .8 + bp(rng.standard_normal(len(o)), 500, 3000) * .012
    fade = np.ones(len(o))
    a = int(7.8 * SR)
    fade[a:a + int(.5 * SR)] = np.linspace(1, 0, int(.5 * SR))
    fade[a + int(.5 * SR):] = 0
    put(6, np.stack([(o + cr) * fade] * 2, 1))
    put(6, new.mix(2.0, .02, 6000))


def s2():
    bt = sec('1963', 16, 28, 160)
    b = Bus(12, 2.5)
    k = 3
    for s, d, m in THEME:
        b.add(hum(s * bt), brass(m + k, d * bt * .86, .8), 0, 1, .15)
        b.add(hum(s * bt), brass(m + k - 12, d * bt * .86, .55), 0, .6, .1)
    for s, d, c in PROG:
        cc = CH[c]
        for q in range(int(d)):
            bb = (s + q) * bt
            if q % 2 == 0:
                b.add(bb, brass(cc[0] + k - 12, bt * .8, .7), 0, .9, .05)
            else:
                for m in cc[2:4]:
                    b.add(bb, brass(m + k, bt * .4, .5), 0, .55, .1)
            b.add(bb, snare(.4 if q % 2 else .25), 0, .9, .1)
            if q % 2 == 1:
                b.add(bb + bt / 2, snare(.2), 0, .8, .05)
    b.add(0, crash(.7), 0, 1, .2)
    b.add(16 * bt, crash(.6), 0, 1, .2)
    for q, tq in enumerate([12, 14, 16, 18]):  # 定格连击
        cues['hits'].append(16 + tq * bt)
        b.add(tq * bt, kick(.9), 0, 1, .1)
    y = b.mix(.8, .01, 4500)
    y = bp(y, 170, 6500)
    y = y.mean(1)
    y = np.tanh(y * 1.5) * .72
    put(16, np.stack([y, y], 1))


def s3():
    bt = sec('1979', 28, 42, 137.14)
    b = Bus(14, 3)
    k = -3
    for s, d, c in PROG:
        cc = CH[c]
        r = cc[0] + k - 12
        for q in range(int(d)):
            bb = (s + q) * bt
            pat = [(0, .4, 0), (.75, .2, 0), (1.5 / 2, 0, 0)]
            b.add(bb, bass(r, bt * .42, .85), 0, 1, .03)
            b.add(bb + bt * .75, bass(r + (12 if q % 2 else 7), bt * .22, .7), 0, 1, .03)
            b.add(bb, hat(.5), .25, 1, .02)
            b.add(bb + bt / 2, hat(.35), .25, 1, .02)
            b.add(bb + bt * .25, hat(.2), .25, 1, .02)
            b.add(bb + bt * .75, hat(.22), .25, 1, .02)
            if q % 2 == 1:
                b.add(bb, snare(.72), 0, 1, .1)
            else:
                b.add(bb, kick(.85), 0, 1, .02)
                if q == 2:
                    b.add(bb + bt * .5, kick(.6), 0, 1, .02)
        for m in cc[2:5]:
            b.add(s * bt + bt * 1.5, brass(m + k, bt * .4, .75), -.3, .62, .2)
            b.add(s * bt + bt * 2.5, brass(m + k, bt * .25, .7), -.3, .55, .2)
    theme(b, lead, bt, k + 12, 1.0, 0, .3, .1, 0, 16)
    theme(b, brass, bt, k, 1.1, 0, .25, .1, 16, 32, shift=16)
    theme(b, lead, bt, k + 12, .7, 0, .3, -.2, 16, 32, shift=16, kind='sq')
    b.add(0, crash(.6), 0, 1, .2)
    for m in range(0, 16):  # 最后两小节，发射的上升音
        b.add((28 + m / 4) * bt, lead(45 + m * 2, bt * .3, .45, 'sq'), .3 * np.sin(m), .7, .3)
    y = b.mix(1.0, .015, 6000)
    y = lp(y, 11000)
    put(28, np.tanh(y * 1.25) * .8)


def s4():
    bt = sec('1984', 42, 60, 106.67)
    b = Bus(18, 5)
    k = 2
    for s, d, c in PROG:
        cc = CH[c]
        for m in cc[1:]:
            b.add(s * bt, pad(m + k + 12, d * bt, .7), rng.uniform(-.5, .5), .9, .45)
        for q in range(int(d * 4)):
            m = cc[1 + (q * 3 % 4)] + k + 12 + 12 * (q % 8 > 5)
            b.add(hum((s + q / 4) * bt), fm_ep(m, bt * .4, .5), .55 * np.sin(q * 1.1), .55, .4)
        r = cc[0] + k - 12
        if s >= 8:
            for q in range(int(d)):
                b.add((s + q) * bt, bass(r, bt * .45, .8, 'fm'), 0, 1, .03)
                b.add((s + q + .5) * bt, bass(r + 12 * (q % 2), bt * .3, .65, 'fm'), 0, 1, .03)
                if q % 2 == 1:
                    b.add((s + q) * bt, snare(.85, True), 0, 1, .65)
                else:
                    b.add((s + q) * bt, kick(.9), 0, 1, .03)
                b.add((s + q) * bt, hat(.32), -.3, 1, .05)
                b.add((s + q + .5) * bt, hat(.42, True), -.3, 1, .05)
    theme(b, fm_ep, bt, k + 12, 1.4, 0, .5, 0, 0, 8, v=.8)
    theme(b, lead, bt, k + 12, .95, 0, .5, 0, 8, 32, shift=8)
    theme(b, fm_ep, bt, k + 24, .7, 0, .55, .2, 8, 32, shift=8, v=.8)
    b.add(0, crash(.7, 4), 0, 1, .4)
    rs = noise_sweep(6.5, 300, 7000, .25) * np.linspace(0, 1, int(6.5 * SR)) ** 2
    b.add(28 * bt - 6.5, rs, 0, 1, .2)
    y = b.mix(2.6, .03, 7500)
    cut = int(28 * bt * SR)  # 57.75 s 处全部断掉
    y[cut:cut + 2000] *= np.linspace(1, .0, 2000)[:, None]
    y[cut + 2000:] = 0
    put(42, y)
    cues['hits'].append(42 + 28 * bt)


def s5():
    bt = sec('1995', 60, 74, 68.57)
    b = Bus(14, 7)
    for t, m, v, p in [(3.5, 33, .8, 0), (3.5, 45, .6, 0), (7.0, 81, .35, -.3), (7.0 + bt, 84, .3, .2), (7 + 2 * bt, 89, .34, 0), (7 + 3.5 * bt, 88, .22, .3),
                       (10.5, 86, .34, -.2), (10.5 + 2 * bt, 83, .28, .1), (10.5 + 3 * bt, 79, .25, 0)]:
        b.add(t, piano(m, 2.5, v), p, 1, .85)
    for m in (45, 52, 57):
        b.add(10.5, strings(m, 3.5, .34, 1.3), 0, .85, .7)
    for i in range(3):
        b.add(10.5 + i * bt * 2, kick(.5), 0, .7, .4)
    y = b.mix(6.0, .06, 3200)
    put(60, y)
    rv = hp(rng.standard_normal(int(1.6 * SR)), 2500) * np.linspace(0, 1, int(1.6 * SR)) ** 3 * .12
    put(72.4, np.stack([rv, rv], 1))


def s6():
    bt = sec('2000', 74, 92, 133.33)
    b = Bus(18, 3)
    k = 2
    prog = PROG + [(32, 4, 'F'), (36, 4, 'G')]
    for s, d, c in prog:
        cc = CH[c]
        r = cc[0] + k - 12
        calm = 12 <= s < 24
        for q in range(int(d * 2)):
            bb = (s + q / 2) * bt
            b.add(hum(bb), bass(r, bt * .45, .75), 0, .6 if calm else 1, .03)
            for m in cc[1:4]:
                b.add(hum(bb), piano(m + k + 12, bt * .4, .5 if q % 2 == 0 else .36), rng.uniform(-.2, .2), .6, .2)
            if not calm:
                b.add(bb, hat(.42 if q % 2 else .3), .3, 1, .03)
        if not calm:
            g = guitar([r + 12, r + 19, r + 24], d * bt * .96, .9)
            b.add(s * bt, g, -.55, .9, .12)
            b.add(s * bt + .012, guitar([r + 12, r + 19, r + 24], d * bt * .96, .9), .55, .9, .12)
        for q in range(int(d)):
            bb = (s + q) * bt
            if not calm:
                b.add(bb, (snare(.72) if q % 2 else kick(.9)), 0, 1, .12)
                if q % 2:
                    b.add(bb, clap(.5), 0, 1, .25)
                else:
                    b.add(bb + bt * 1.5, kick(.55), 0, 1, .03)
    theme(b, piano, bt, k + 12, 1.5, 0, .3, 0, 0, 32, shift=4, v=.85)
    theme(b, lead, bt, k + 12, .55, 0, .35, .2, 0, 32, shift=4)
    for i, m in enumerate([50, 48, 45, 43, 41, 40]):  # 收尾滚奏
        b.add((36 + i * .66) * bt, tom(m + 12, .8), .4 - i * .15, 1, .2)
    b.add(0, crash(.75), 0, 1, .2)
    y = b.mix(1.1, .012, 8000)
    put(74, np.tanh(y * 1.2) * .86)


def s7():
    bt = sec('2010', 92, 112, 96)
    b = Bus(20, 5)
    bar = bt * 4
    for m in (29, 36, 41):
        b.add(0, brass(m, bar * 2, .55, 1.0), 0, .9, .4)
        b.add(0, strings(m + 12, bar * 2, .5, 1.2), 0, .9, .4)
    for i in range(4):
        b.add(i * bt * 2, taiko(.8), 0, 1, .4)
    ost = [60, 60, 67, 60, 63, 60, 67, 63]
    for i in range(32):
        b.add(2 * bar + i * bt / 4, strings(ost[i % 8] - 5 + (i // 16) * 2, bt * .22, .4 + .4 * i / 32, .01), .4 * np.sin(i), .9, .25)
        if i % 8 == 0:
            b.add(2 * bar + i * bt / 4, taiko(.75), 0, 1, .4)
    rs = noise_sweep(3.0, 400, 9000, .2) * np.linspace(0, 1, int(3 * SR)) ** 2
    b.add(4 * bar - 3, rs, 0, 1, .3)
    t4 = 4 * bar
    k = 0
    b.add(t4, crash(.9, 4), 0, 1, .5)
    b.add(t4, taiko(1.0), 0, 1, .5)
    for s, d, c in PROG[:4]:
        cc = CH[c]
        for m in cc:
            b.add(t4 + s * bt, strings(m + k + 12, d * bt, .75, .12), rng.uniform(-.5, .5), .75, .55)
            b.add(t4 + s * bt, brass(m + k, d * bt, .45, .25), 0, .34, .55)
        b.add(t4 + s * bt, strings(cc[0] + k - 12, d * bt, .8, .05), 0, 1.1, .3)
        b.add(t4 + s * bt, taiko(.65), 0, .9, .45)
        b.add(t4 + (s + 2) * bt, taiko(.5, False), 0, .8, .45)
    for s, d, m in THEME[:12]:
        b.add(t4 + s * bt, strings(m + 12, d * bt, .9, .06), 0, 1.25, .55)
        b.add(t4 + s * bt, strings(m, d * bt, .8, .06), 0, .85, .5)
        b.add(t4 + s * bt, brass(m, d * bt, .6, .08), 0, .34, .5)
    y = b.mix(3.2, .04, 7000)
    put(92, np.tanh(y * 1.05) * .9)
    r2 = noise_sweep(2.2, 500, 11000, .3) * np.linspace(0, 1, int(2.2 * SR)) ** 3
    put(109.8, np.stack([r2, r2], 1))


def s8a():
    bt = sec('2020-fight', 112, 128, 120)
    b = Bus(16, 4)
    k = 2
    ost = [0, 0, 7, 0, 12, 0, 7, 3]
    for s, d, c in PROG:
        cc = CH[c]
        r = cc[0] + k
        for i in range(int(d * 4)):
            b.add((s + i / 4) * bt, strings(r + ost[i % 8] + 12, bt * .2, .62, .006), .5 * np.sin(i * .9), .62, .2)
        for m in cc[1:]:
            b.add(s * bt, brass(m + k, d * bt * .92, .62, .05), rng.uniform(-.4, .4), .36, .4)
        b.add(s * bt, bass(r - 12, d * bt, .9, 'sub'), 0, .75, 0)
        for q in range(int(d)):
            bb = (s + q) * bt
            b.add(bb, taiko(.95), 0, 1, .4)
            b.add(bb + bt * .5, taiko(.55, False), -.3, 1, .35)
            b.add(bb + bt * .75, taiko(.5, False), .3, 1, .35)
            b.add(bb, (snare(.7) if q % 2 else kick(.95)), 0, 1, .2)
            b.add(bb, hat(.45), .2, 1, .03)
            b.add(bb + bt / 2, hat(.5, q % 2 == 1), .2, 1, .03)
    for s, d, m in THEME:
        b.add(s * bt, brass(m + k, d * bt * .96, .92, .02), 0, .95, .35)
        b.add(s * bt, strings(m + k + 12, d * bt, .95, .03), 0, 1.15, .4)
        b.add(s * bt, strings(m + k + 24, d * bt, .75, .03), 0, .6, .45)
    b.add(0, crash(1.0, 4), 0, 1, .5)
    b.add(16 * bt, crash(.9, 4), 0, 1, .5)
    y = b.mix(2.0, .02, 8000)
    cut = int(15.5 * SR)
    y[cut:cut + 400] *= np.linspace(1, 0, 400)[:, None]
    y[cut + 400:] = 0
    put(112, np.tanh(y * 1.05) * .92)
    cues['hits'].append(127.5)
    s = noise_sweep(.5, 1200, 12000, .7) * np.linspace(.2, 1, int(.5 * SR))
    put(127.0, np.stack([s, s], 1))


def s8b():
    bt = sec('2020-quiet', 128, 138, 96)
    b = Bus(10, 5)
    theme(b, piano, bt, 0, 1.2, 0, .55, 0, 0, 16, v=.5)
    for s, d, c in PROG[:4]:
        cc = CH[c]
        b.add(s * bt, piano(cc[0], d * bt, .34), -.15, 1, .55)
        for j, m in enumerate(cc[1:4]):
            b.add((s + 1 + j) * bt, piano(m + 12, bt * 1.4, .24), .2, 1, .55)
    put(128, b.mix(3.4, .03, 5200))


def s9():
    bt = sec('end', 138, 150, 80)
    b = Bus(12, 6)
    theme(b, piano, bt, 0, 1.25, 0, .5, 0, 16, 32, shift=-16, v=.62)
    for s, d, c in PROG[4:]:
        cc = CH[c]
        s -= 16
        for m in cc[1:]:
            b.add(s * bt, strings(m + 12, d * bt, .42, .5), rng.uniform(-.5, .5), .6, .6)
        b.add(s * bt, strings(cc[0], d * bt, .5, .4), 0, .8, .4)
        b.add(s * bt, piano(cc[0], d * bt, .4), 0, 1, .5)
    b.add(9.0, piano(60, 3, .3), 0, 1, .6)
    b.add(10.6, piano(72, 2, .24), 0, 1, .7)
    y = b.mix(3.6, .03, 6000)
    n = len(y)
    f = np.ones(n)
    a = int(10.8 * SR)
    f[a:] = np.exp(-np.arange(n - a) / (SR * .6))
    put(138, y * f[:, None])


# ---------- 环境声 ----------
def pencil(t0, d, v=.28, pan=0.0):
    n = int(d * SR)
    x = bp(rng.standard_normal(n), 1800, 9000)
    e = np.abs(np.sin(np.arange(n) / SR * 2 * np.pi * 3.1)) ** 2 * .7 + .3
    y = x * e * adsr(n, .08, .1, 1, .2) * v
    put(t0, np.stack([y * (1 - pan), y * (1 + pan)], 1))


def amb(t0, d, y, v=1.0, pan=0.0, fade=.6):
    n = int(d * SR)
    y = y[:n] * adsr(n, fade, .01, 1, fade) * v
    p = np.asarray(pan, float)
    put(t0, np.stack([y * (1 - p), y * (1 + p)], 1))


def noise(d):
    return rng.standard_normal(int(d * SR))


def whoosh(t, d=1.0, v=.45, right=True):
    y = noise_sweep(d, 250, 3800, v) * np.sin(np.linspace(0, np.pi, int(d * SR))) ** 2
    p = np.linspace(-.85, .85, len(y)) * (1 if right else -1)
    put(t - d * .6, np.stack([y * (1 - p), y * (1 + p)], 1))


def sfx():
    pencil(1.0, 1.7, .05)
    pencil(3.0, 2.8, .2)
    pr = np.zeros(int(10 * SR))
    pr[::SR // 24] = 1
    pr = bp(pr, 200, 2500) * 1.3 + lp(noise(10), 400) * .02
    amb(6, 10, pr, .55, 0, .3)
    t = tt(1.0)
    put(16, np.stack([np.sin(2 * np.pi * 15625 * t) * .006] * 2, 1))
    amb(28, 14, lp(noise(14), 110), .45, 0, 1)
    amb(38.5, 3.5, noise_sweep(3.5, 200, 2400, .35), .9, 0, .6)
    amb(42, 8, noise_sweep(8, 700, 500, .2), .7, .4 * np.sin(np.linspace(0, 7, int(8 * SR))), 1)
    amb(58, 7, lp(noise(7), 180), .85, 0, .4)
    for tb in (60.8, 61.7, 62.3):
        y = np.sin(2 * np.pi * (500 + 320 * tt(.09) / .09) * tt(.09)) * np.exp(-tt(.09) * 24) * .08
        put(tb, np.stack([y, y], 1))
    amb(66.5, 3.2, np.sin(2 * np.pi * 100 * tt(3.2)) * .018 + hp(noise(3.2), 6000) * .006, 1, 0, .1)
    amb(69.5, 4.5, hp(noise(4.5), 1800) * .05, 1, 0, .3)
    for i in range(16):
        tb = 77 + rng.uniform(0, 3.6)
        d = rng.uniform(.06, .14)
        tq = tt(d)
        y = np.sin(2 * np.pi * (3000 + 1400 * np.sin(tq * 90)) * tq) * np.sin(np.pi * tq / d) * .022
        put(tb, np.stack([y * (1 + .5 * (i % 3 - 1)), y * (1 - .5 * (i % 3 - 1))], 1))
    amb(92, 5, lp(noise(5), 80), .7, 0, .8)
    for t in (97.5, 98.8, 100.1):
        whoosh(t, .9, .5, int(t) % 2 == 0)
    amb(101, 8.5, noise_sweep(8.5, 900, 450, .17), .8, 0, 1)
    amb(112, 3.3, noise_sweep(3.3, 1400, 500, .34), .9, 0, .3)
    fire = bp(noise(15.5), 80, 1400) * .06
    cr = np.zeros(len(fire))
    ix = rng.integers(0, len(cr), 1700)
    cr[ix] = rng.uniform(-1, 1, len(ix))
    amb(112, 15.5, fire + bp(cr, 1500, 8000) * .25, 1, 0, .4)
    amb(128, 10, noise_sweep(10, 620, 460, .13), .9, .25 * np.sin(np.linspace(0, 5, int(10 * SR))), 1.5)
    amb(138, 6, noise_sweep(6, 520, 420, .09), .8, 0, 1.2)
    pencil(146.8, 2.3, .18)
    for t in (6, 16, 28, 42, 74, 92, 102, 112, 138):
        whoosh(t, 1.1, .34, t % 4 == 0)


import sys
if '--sfx-only' in sys.argv:
    sfx()
    st = master[:int(TOTAL * SR)]
    wavfile.write(ROOT / 'audio' / 'sfx.wav', SR, (np.clip(st, -1, 1) * 32767).astype(np.int16))
    raise SystemExit
s0(); s1(); s2(); s3(); s4(); s5(); s6(); s7(); s8a(); s8b(); s9(); sfx()

y = master[:int(TOTAL * SR)]
gain = np.ones(len(y))                                   # 段落音量校正：1963 和收尾原本偏轻
for t0, t1, db in [(16, 28, 4.5), (138, 150, 3.0)]:
    a0, a1, r = int(t0 * SR), int(t1 * SR), int(.05 * SR)
    g0 = 10 ** (db / 20)
    gain[a0:a1] = g0
    gain[a0:a0 + r] = np.linspace(1, g0, r)
    gain[a1 - r:a1] = np.linspace(g0, 1, r)
y = y * gain[:, None]
y = y - lp(y, 22)
peak = np.abs(y).max()
y = y / peak * 1.5
y = np.tanh(y) / np.tanh(1.5) * .94
tail = int(.8 * SR)
y[-tail:] *= np.linspace(1, 0, tail)[:, None]
(ROOT / 'audio').mkdir(exist_ok=True)
wavfile.write(ROOT / 'audio' / 'song.wav', SR, (y * 32767).astype(np.int16))
json.dump(cues, open(ROOT / 'audio' / 'cues.json', 'w'), indent=1)
print('peak before limit', round(float(peak), 2))
for s in cues['sections']:
    a, b = int(s['t0'] * SR), int(s['t1'] * SR)
    print(s['name'], 'rms dB', round(20 * np.log10(np.sqrt((y[a:b] ** 2).mean()) + 1e-9), 1), 'peak', round(float(np.abs(y[a:b]).max()), 2))
