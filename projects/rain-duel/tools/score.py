#!/usr/bin/env python3
"""《雨烬》配乐和音效：纯代码合成。144 BPM，D 小调，节拍和所有撞击点都来自 src/cues.json（与画面同一份时间表）。

  uv run --no-project --with numpy --with scipy python tools/score.py
输出 audio/song.wav（100 s，44.1 kHz 立体声），另存 audio/music.wav 和 audio/sfx.wav 方便单独检查。
"""
import json
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

ROOT = Path(__file__).resolve().parent.parent
CUES = json.loads((ROOT / 'src' / 'cues.json').read_text(encoding='utf-8'))
SR = 44100
BT = CUES['beat']
BAR = 4 * BT
TOTAL = CUES['total']
rng = np.random.default_rng(2611)


def mf(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(d):
    return np.arange(int(max(d, 1e-3) * SR)) / SR


def lp(x, f, o=2):
    return sosfilt(butter(o, min(f, SR * .45) / (SR / 2), 'low', output='sos'), x, axis=0)


def hp(x, f, o=2):
    return sosfilt(butter(o, f / (SR / 2), 'high', output='sos'), x, axis=0)


def bp(x, a, b, o=2):
    return sosfilt(butter(o, [max(a, 20) / (SR / 2), min(b, SR * .45) / (SR / 2)], 'band', output='sos'), x, axis=0)


def adsr(n, a=.01, d=.1, s=.7, r=.1):
    A, D, R = int(a * SR), int(d * SR), int(r * SR)
    e = np.full(n, s, float)
    A = min(A, n)
    e[:A] = np.linspace(0, 1, A, endpoint=False)
    D2 = min(D, n - A)
    e[A:A + D2] = np.linspace(1, s, D2, endpoint=False)
    R = min(R, n)
    if R:
        e[n - R:] *= np.linspace(1, 0, R)
    return e


def saw(f, t, ph=0.0):
    return 2 * ((f * t + ph) % 1.0) - 1


def noise(d):
    return rng.standard_normal(int(d * SR))


# ---------- 乐器 ----------
def piano(m, dur, v=.7):
    f = mf(m)
    d = max(dur, .25) + 2.2
    t = tt(d)
    y = np.zeros_like(t)
    B = .00035 * (1 + max(0, m - 60) / 30)
    for k in range(1, int(min(14, 15000 / f)) + 1):
        fk = f * k * np.sqrt(1 + B * k * k)
        a = (1 / k ** (1.55 - .7 * v)) * (1.15 if k == 1 else 1)
        dec = (1.0 + 2.2 * k / 8) * (f / 262) ** .35 + .2
        for det in (-.12, .12):
            y += .5 * a * np.sin(2 * np.pi * (fk + det) * t + rng.uniform(0, 6.28)) * np.exp(-t * dec)
    y[:220] *= np.linspace(0, 1, 220)
    h = bp(rng.standard_normal(1400), 300, 3200) * np.exp(-np.arange(1400) / 300)
    y[:1400] += h * .35 * v
    rel = int(max(dur, .2) * SR)
    if rel < len(y):
        y[rel:] *= np.exp(-np.arange(len(y) - rel) / (SR * .35))
    return y * v * .34


def strings(m, dur, v=.6, att=.18, rel=.35, bright=1.0):
    f = mf(m)
    t = tt(dur + rel)
    vib = .0035 * np.sin(2 * np.pi * 5.3 * t + rng.uniform(0, 6)) * np.minimum(1, t / .5)
    y = np.zeros_like(t)
    for de in (-.006, -.0025, 0, .003, .0065):
        y += saw(f * (1 + de), t * (1 + vib), rng.uniform())
    y = lp(y / 5, min((1500 + 2600 * v) * bright + f * 1.5, 11000))
    return y * adsr(len(t), att, .1, .9, rel) * v * .3


def stac(m, v=.7):
    """弦乐断奏（十六分音符固定音型）。"""
    f = mf(m)
    t = tt(.2)
    y = saw(f, t) + saw(f * 1.004, t, .3) + saw(f * .997, t, .6)
    y = lp(y / 3, 2400 + 2600 * v)
    return y * np.exp(-t * 16) * adsr(len(t), .004, .02, 1, .03) * v * .3


def brass(m, dur, v=.7, att=.03):
    f = mf(m)
    t = tt(dur + .15)
    y = saw(f, t) + .7 * saw(f * 1.004, t, .3) + .5 * saw(f * .996, t, .7)
    e = np.exp(-t * 6) * .7 + .3
    y = lp(y, 600) * (1 - e) + lp(y, 700 + 4200 * v) * e
    return np.tanh(y * 1.3) * adsr(len(t), att, .1, .8, .12) * v * .2


def braam(m, dur, v=.8):
    """低音铜管长音，滤波缓慢打开。"""
    f = mf(m)
    t = tt(dur + .6)
    y = sum(saw(f * r * (1 + d), t, rng.uniform()) for r in (1, 2) for d in (-.004, 0, .005))
    out = np.zeros_like(y)
    blk = 2048
    for i in range(0, len(y), blk):
        c = 250 + 2200 * min(1, i / SR / max(dur * .5, .1)) * v
        seg = y[max(0, i - 1024):i + blk]
        s = lp(seg, c)
        out[i:i + blk] = s[-len(y[i:i + blk]):]
    return np.tanh(out * .5) * adsr(len(t), .08, .3, .85, .6) * v * .3


def choir(m, dur, v=.5):
    f = mf(m)
    t = tt(dur + 1.0)
    y = np.zeros_like(t)
    for d in (-.008, -.003, .002, .007):
        vib = 1 + .005 * np.sin(2 * np.pi * (4.6 + rng.uniform(0, 1)) * t + rng.uniform(0, 6))
        y += saw(f * (1 + d), t * vib, rng.uniform())
    y /= 4
    y = bp(y, 650, 950) + .55 * bp(y, 1050, 1300) + .25 * bp(y, 2600, 3200) + .3 * lp(y, 400)
    return y * adsr(len(t), .45, .2, .9, .9) * v * .5


def pad(m, dur, v=.5, cut=1800):
    f = mf(m)
    t = tt(dur + 1.2)
    y = saw(f * .997, t) + saw(f * 1.003, t, .4) + .5 * saw(f * 2.002, t, .7)
    return lp(y, cut) * adsr(len(t), .9, .3, .85, 1.1) * v * .12


def sub(m, dur, v=.8):
    f = mf(m)
    t = tt(dur + .05)
    y = np.sin(2 * np.pi * f * t) + .25 * np.tanh(3 * np.sin(2 * np.pi * f * t))
    return y * adsr(len(t), .005, .08, .85, .05) * v * .42


def gbass(m, dur, v=.7):
    """失真锯齿低音，跟在 sub 上给力度。"""
    f = mf(m)
    t = tt(dur + .03)
    y = np.tanh(3 * lp(saw(f, t) + saw(f * 1.01, t, .5), 900 * v + 200))
    return y * np.exp(-t * 3) * adsr(len(t), .003, .02, 1, .03) * v * .14


def kick(v=.8):
    t = tt(.4)
    f = 44 + 140 * np.exp(-t * 32)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
    y[:300] += hp(rng.standard_normal(300), 2000) * np.exp(-np.arange(300) / 40) * .4
    return np.tanh(y * 1.4) * v * .7


def snare(v=.7):
    t = tt(.5)
    n = bp(rng.standard_normal(len(t)), 700, 9000)
    b = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 22)
    y = n * np.exp(-t * 11) * .6 + b * .6
    return y * v * .55


def hat(v=.5, op=False):
    t = tt(.3 if op else .05)
    return hp(rng.standard_normal(len(t)), 7500) * np.exp(-t * (11 if op else 80)) * v * .16


def crash(v=.6, d=2.8):
    t = tt(d)
    y = hp(rng.standard_normal(len(t)), 3500) * np.exp(-t * 1.8)
    return y * v * .2


def taiko(v=.8, low=True):
    t = tt(1.1)
    f = (52 if low else 88) + 70 * np.exp(-t * 22)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4.6)
    y[:2600] += bp(rng.standard_normal(2600), 150, 2200) * np.exp(-np.arange(2600) / 500) * .6
    return np.tanh(y * 1.3) * v * .8


def tom(m, v=.7):
    t = tt(.45)
    f = mf(m) * (1 + .6 * np.exp(-t * 30))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) * v * .55


def sweep(d, f0, f1, v=.5, q=.35, shape=None):
    """带通扫频的风声 / 呼啸。"""
    n = int(d * SR)
    x = rng.standard_normal(n + 4096)
    y = np.zeros(n)
    blk = 1024
    for i in range(0, n, blk):
        u = i / n
        c = f0 * (f1 / f0) ** u
        s = bp(x[i:i + blk + 2048], max(30, c * (1 - q)), c * (1 + q))
        m = min(blk, n - i)
        y[i:i + m] = s[1024:1024 + m]
    if shape is not None:
        y *= shape(np.arange(n) / n)
    return y * v


def riser(d, v=.6):
    t = tt(d)
    u = t / d
    y = sweep(d, 300, 6000, .5, .3) * u ** 2
    f = 110 * 2 ** (3 * u)
    y += .25 * np.sin(2 * np.pi * np.cumsum(f) / SR) * u ** 2
    return y * v


def revcym(d, v=.6):
    t = tt(d)
    return hp(rng.standard_normal(len(t)), 3000) * (t / d) ** 3 * v * .4


# ---------- 音效 ----------
def sfx_clash(v=1.0):
    t = tt(1.8)
    y = np.zeros_like(t)
    for f, a in [(1580, .5), (2350, 1), (3120, .8), (4410, .7), (5230, .5), (6870, .4), (8120, .3), (9650, .2)]:
        f *= rng.uniform(.95, 1.05)
        y += a * np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * np.exp(-t * (2.6 + f / 1400))
    y *= .3
    y[:3000] += hp(rng.standard_normal(3000), 1800) * np.exp(-np.arange(3000) / 280) * 1.2
    y += np.sin(2 * np.pi * 95 * t) * np.exp(-t * 22) * .8
    return np.tanh(y * 1.2) * v * .6


def sfx_hit(v=1.0):
    t = tt(1.6)
    f = 30 + 90 * np.exp(-t * 14)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.2)
    y[:6000] += lp(rng.standard_normal(6000), 3500) * np.exp(-np.arange(6000) / 900) * .9
    return np.tanh(y * 1.6) * v * .75


def sfx_boom(v=1.0):
    t = tt(3.0)
    f = 26 + 60 * np.exp(-t * 5)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.4)
    y += lp(rng.standard_normal(len(t)), 300) * np.exp(-t * 2.2) * .5
    return np.tanh(y * 1.4) * v * .7


def sfx_thunder(v=1.0):
    d = 5.5
    t = tt(d)
    crack = bp(rng.standard_normal(len(t)), 900, 5000) * np.exp(-t * 9)
    env = np.zeros_like(t)
    for _ in range(14):
        c = rng.uniform(0, 2.8)
        env += np.exp(-np.abs(t - c) * rng.uniform(2, 6)) * rng.uniform(.3, 1)
    rumble = lp(rng.standard_normal(len(t)), 160, 3) * env * np.exp(-t * .5)
    y = crack * .6 + rumble * 2.2
    return np.tanh(y) * v * .8


def sfx_bell(v=1.0, f0=1318.5):
    t = tt(3.5)
    y = np.zeros_like(t)
    for r, a, dec in [(1, 1, 1.6), (1.003, .6, 1.5), (2.32, .5, 2.6), (4.25, .3, 4), (6.63, .18, 6), (.5, .15, 1.2)]:
        y += a * np.sin(2 * np.pi * f0 * r * t + rng.uniform(0, 6)) * np.exp(-t * dec)
    y[:400] += hp(rng.standard_normal(400), 4000) * np.exp(-np.arange(400) / 60) * .4
    return y * v * .32


def sfx_chime(v=1.0):
    y = np.zeros(int(2.2 * SR))
    for k, m in enumerate([93, 88, 96, 91, 98]):
        s = sfx_bell(.4, mf(m)) [:int(1.6 * SR)]
        i = int(k * .09 * SR)
        y[i:i + len(s)] += s[:len(y) - i]
    return y * v


def sfx_whoosh(v=1.0, d=.45):
    return sweep(d, 250, 2400, 1.0, .5, lambda u: np.sin(np.pi * u) ** 1.5) * v * .9


def sfx_slash(v=1.0):
    t = tt(1.4)
    f = 3200 + 2600 * (1 - np.exp(-t * 12))
    ring = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3) * .35
    ring += np.sin(2 * np.pi * np.cumsum(f * 1.51) / SR) * np.exp(-t * 4.5) * .2
    w = np.zeros_like(t)
    s = sfx_whoosh(1, .3)
    w[:len(s)] += s
    return (ring + w * .8) * v * .7


def sfx_splash(v=1.0):
    t = tt(1.5)
    y = lp(rng.standard_normal(len(t)), 3800) * np.exp(-t * 4) * .8
    for _ in range(26):
        c = rng.uniform(0, .7)
        i = int(c * SR)
        n = int(.08 * SR)
        tb = np.arange(n) / SR
        fb = rng.uniform(500, 1600) * (1 + 2 * tb / .08)
        b = np.sin(2 * np.pi * np.cumsum(fb) / SR) * np.exp(-tb * 50) * rng.uniform(.1, .3)
        y[i:i + n] += b[:len(y) - i]
    return y * v * .7


def sfx_drop(v=1.0):
    t = tt(.35)
    f = 700 * 2 ** (1.4 * (1 - np.exp(-t * 40)))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 22)
    return y * v * .4


def sfx_steam(v=1.0):
    t = tt(2.2)
    y = hp(rng.standard_normal(len(t)), 2500) * adsr(len(t), .03, .3, .5, 1.6)
    y += bp(rng.standard_normal(len(t)), 600, 2000) * np.exp(-t * 3) * .4
    return y * v * .35


def sfx_click(v=1.0):
    t = tt(.5)
    y = np.zeros_like(t)
    for f, a in [(3400, 1), (5100, .6), (7600, .4)]:
        y += a * np.sin(2 * np.pi * f * t) * np.exp(-t * 30)
    y[:200] += rng.standard_normal(200) * .6
    return y * v * .35


def sfx_grind(v=1.0, d=1.7):
    t = tt(d)
    y = bp(rng.standard_normal(len(t)), 1800, 7000)
    jit = lp(np.abs(rng.standard_normal(len(t))), 40) * 3
    return y * jit * adsr(len(t), .01, .2, .8, .5) * np.exp(-t * .8) * v * .45


def sfx_crack(v=1.0):
    t = tt(1.2)
    y = np.zeros_like(t)
    for _ in range(40):
        i = int(rng.uniform(0, .5) ** 1.6 * SR)
        n = 300
        y[i:i + n] += hp(rng.standard_normal(n), 1200) * np.exp(-np.arange(n) / 50) * rng.uniform(.2, 1)
    y += lp(rng.standard_normal(len(t)), 400) * np.exp(-t * 6) * .6
    return y * v * .6


def sfx_freeze(v=1.0):
    d = 2.6
    y = np.zeros(int(d * SR))
    pent = [86, 89, 91, 93, 96, 98, 101, 103]
    for _ in range(40):
        i = int(rng.uniform(0, 1.8) * SR)
        s = sfx_bell(rng.uniform(.06, .2), mf(pent[rng.integers(len(pent))]))[:int(.8 * SR)]
        y[i:i + len(s)] += s[:len(y) - i]
    t = tt(d)
    y += hp(rng.standard_normal(len(t)), 6000) * np.exp(-t * 2) * .05
    y += np.sin(2 * np.pi * 3520 * t) * adsr(len(t), 1.2, .2, .6, .8) * .03
    return y * v


def sfx_needle(v=1.0):
    d = 2.0
    y = np.zeros(int(d * SR))
    for _ in range(36):
        i = int(rng.uniform(0, 1.3) * SR)
        n = int(rng.uniform(.12, .3) * SR)
        tb = np.arange(n) / SR
        f = rng.uniform(3000, 6000) * (1 - .5 * tb / tb[-1])
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tb / tb[-1]) * rng.uniform(.05, .14)
        y[i:i + n] += s[:len(y) - i]
    y += sweep(d, 1200, 5000, .25, .4, lambda u: np.exp(-u * 3))
    return y * v


def sfx_horn(v=1.0):
    d = 2.2
    t = tt(d)
    dop = 1 + .03 * (1 - 2 * np.clip((t - .9) / .6, 0, 1))
    y = np.zeros_like(t)
    for f in (370, 466):
        ph = np.cumsum(f * dop) / SR
        y += 2 * (ph % 1) - 1
    y = lp(y, 1800) * adsr(len(t), .05, .1, .9, .4)
    return np.tanh(y * 1.2) * v * .22


def sfx_train(v=1.0):
    d = 5.0
    t = tt(d)
    env = np.clip(t / .6, 0, 1) * np.clip((d - t) / 1.6, 0, 1)
    y = lp(rng.standard_normal(len(t)), 220, 3) * 2.2
    y += bp(rng.standard_normal(len(t)), 2500, 6000) * .12
    per = .3
    for k in range(int(d / per)):
        for o in (0, .07):
            i = int((k * per + o) * SR)
            n = 900
            y[i:i + n] += (lp(rng.standard_normal(n), 1500) * np.exp(-np.arange(n) / 150))[:len(y) - i] * 1.2
    return np.tanh(y * env) * v * .6


def sfx_vortex(v=1.0):
    d = 2.6
    t = tt(d)
    y = sweep(d, 180, 1600, 1.0, .35, lambda u: u ** 1.5)
    y += sweep(d, 600, 4200, .5, .25, lambda u: u ** 2)
    return y * v * .8


SFX = dict(clash=sfx_clash, hit=sfx_hit, boom=sfx_boom, thunder=sfx_thunder, bell=sfx_bell, chime=sfx_chime, whoosh=sfx_whoosh,
           slash=sfx_slash, splash=sfx_splash, drop=sfx_drop, steam=sfx_steam, click=sfx_click, grind=sfx_grind, crack=sfx_crack,
           freeze=sfx_freeze, needle=sfx_needle, horn=sfx_horn, train=sfx_train, vortex=sfx_vortex)


# ---------- 混音 ----------
class Bus:
    def __init__(self, dur=TOTAL, tail=6.0):
        n = int((dur + tail) * SR)
        self.dry = np.zeros((n, 2))
        self.wet = np.zeros((n, 2))

    def add(self, t, y, pan=0.0, g=1.0, send=.2):
        i = int(round(t * SR))
        if i < 0:
            y, i = y[-i:], 0
        if i >= len(self.dry) or not len(y):
            return
        y = y[:len(self.dry) - i]
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        st = np.stack([y * l * 1.414, y * r * 1.414], 1) * g
        self.dry[i:i + len(y)] += st
        if send:
            self.wet[i:i + len(y)] += st * send

    def mix(self, t60=2.2, pre=.025, dark=6500, mixw=1.0):
        n = int(t60 * 1.3 * SR)
        t = np.arange(n) / SR
        ir = rng.standard_normal((n, 2)) * np.exp(-t * 6.9 / t60)[:, None]
        ir = lp(ir, dark)
        ir[:int(.004 * SR)] *= .2
        ir = np.vstack([np.zeros((int(pre * SR), 2)), ir])
        ir /= np.sqrt((ir ** 2).sum(0, keepdims=True))
        w = np.stack([fftconvolve(self.wet[:, c], ir[:, c])[:len(self.wet)] for c in (0, 1)], 1)
        return self.dry + w * mixw


def hb(b):
    """拍 → 秒，并加一点人味。"""
    return b * BT + rng.uniform(-.004, .004)


# D 小调。和弦：根音 MIDI + 构成音
CH = {'Dm': (38, [62, 65, 69]), 'Bb': (34, [58, 62, 65]), 'C': (36, [60, 64, 67]), 'A': (33, [61, 64, 69]), 'Gm': (31, [62, 67, 70]),
      'F': (29, [60, 65, 69]), 'D': (38, [62, 66, 69])}
FIGHT = ['Dm', 'Bb', 'C', 'A']
DARK = ['Dm', 'Bb', 'Gm', 'A']
THEME = [(0, 2, 74), (2, 1, 77), (3, 1, 76), (4, 3, 69), (7, 1, 74), (8, 2, 72), (10, 1, 70), (11, 1, 69), (12, 2, 67), (14, 2, 69),
         (16, 2, 74), (18, 1, 77), (19, 1, 76), (20, 3, 81), (23, 1, 79), (24, 2, 77), (26, 1, 76), (27, 1, 74), (28, 4, 76)]

music = Bus()


def drums(b0, b1, level=1.0, half=False, fill_every=4):
    for b in range(int(b0), int(b1)):
        bar, q = divmod(b - int(b0), 4)
        bb = hb(b)
        if half:
            if q == 0:
                music.add(bb, kick(.9 * level), 0, 1, .05)
                music.add(bb, taiko(.8 * level), 0, .9, .25)
            if q == 2:
                music.add(bb, snare(.85 * level), 0, 1, .35)
                music.add(bb, taiko(.5 * level, False), .2, .8, .3)
        else:
            if q in (0, 2):
                music.add(bb, kick(.9 * level), 0, 1, .05)
                music.add(bb, taiko(.75 * level), -.15 if q else .15, .85, .25)
            if q in (1, 3):
                music.add(bb, snare(.8 * level), 0, 1, .35)
            if q == 2:
                music.add(bb + BT * .75, kick(.6 * level), 0, 1, .03)
        for s in range(4):
            music.add(bb + s * BT / 4, hat(.42 * level if s % 2 == 0 else .25 * level), .3, 1, .02)
        if (bar + 1) % fill_every == 0 and q == 3:
            for s, m in enumerate([50, 47, 45, 43]):
                music.add(bb + s * BT / 4, tom(m, .8 * level), -.3 + .2 * s, 1, .2)


def ostinato(b0, b1, prog, level=.7, oct_=0):
    pat = [0, 0, 7, 0, 12, 0, 7, 0, 0, 0, 7, 0, 12, 7, 3, 7]
    for b in range(int(b0), int(b1)):
        ch = prog[((b - int(b0)) // 4) % len(prog)]
        root = CH[ch][0] + 12 + 12 * oct_
        if ch in ('Bb', 'Gm', 'F'):
            root += 12 if CH[ch][0] < 33 else 0
        for s in range(4):
            k = ((b - int(b0)) % 4) * 4 + s
            iv = pat[k]
            if iv == 3 and ch in ('C', 'A', 'F', 'Bb', 'D'):
                iv = 4
            music.add(hb(b) + s * BT / 4, stac(root + iv, level * (1 if s == 0 else .75)), -.35, 1, .2)
            music.add(hb(b) + s * BT / 4, stac(root + iv + 12, level * .5), .35, 1, .2)


def basses(b0, b1, prog, level=.8, eighths=True):
    for b in range(int(b0), int(b1)):
        ch = prog[((b - int(b0)) // 4) % len(prog)]
        r = CH[ch][0]
        steps = 2 if eighths else 1
        for s in range(steps):
            t = hb(b) + s * BT / steps
            music.add(t, sub(r, BT / steps * .9, level), 0, 1, 0)
            music.add(t, gbass(r + 12, BT / steps * .8, level * .8), 0, 1, .05)


def chords(b0, b1, prog, ins, level=.5, oct_=0, send=.4, spread=.3):
    for k, b in enumerate(range(int(b0), int(b1), 4)):
        ch = prog[k % len(prog)]
        d = min(4, b1 - b) * BT
        for j, m in enumerate(CH[ch][1]):
            music.add(hb(b), ins(m + 12 * oct_, d, level), (j - 1) * spread, 1, send)


def theme(b0, ins, start=0, stop=32, level=.7, oct_=0, send=.3, stretch=1.0, pan=0.0):
    for s, d, m in THEME:
        if start <= s < stop:
            music.add(hb(b0 + (s - start) * stretch), ins(m + 12 * oct_, d * BT * stretch * .95, level), pan, 1, send)


# A 冷开场 0–24 拍：低音铺底和高音泛音
music.add(0, braam(26, 10.5, .45), 0, .9, .3)
music.add(0, pad(50, 10, .5, 700), 0, 1, .5)
music.add(3.3, strings(93, 6.5, .25, 2.5, 1.0), .2, 1, .6)
music.add(hb(14), piano(38, 3, .6), 0, 1, .5)
music.add(hb(20), piano(50, 2, .5), 0, 1, .5)

# B 对峙 24–48：心跳太鼓渐快，弦乐颤音
for b in range(24, 46):
    q = (b - 24) % 4
    if b < 32:
        if q == 0:
            music.add(hb(b), taiko(.75), 0, 1, .3)
            music.add(hb(b + .5), taiko(.5), 0, 1, .3)
    elif b < 40:
        if q in (0, 2):
            music.add(hb(b), taiko(.8), 0, 1, .3)
            music.add(hb(b + .5), taiko(.5), 0, 1, .3)
    else:
        music.add(hb(b), taiko(.85, q % 2 == 0), (-.2, .2)[q % 2], 1, .3)
        music.add(hb(b + .5), taiko(.55, False), 0, 1, .3)
for k, ch in enumerate(['Dm', 'Bb', 'Gm', 'A', 'Dm', 'A']):
    b = 24 + k * 4
    if b >= 46:
        break
    d = min(4, 46 - b) * BT
    for j, m in enumerate(CH[ch][1]):
        y = strings(m, d, .35 + .08 * k, .15, .2)
        y *= 1 + .5 * np.sin(2 * np.pi * 12 * np.arange(len(y)) / SR)
        music.add(hb(b), y, (j - 1) * .4, 1, .4)
    music.add(hb(b), sub(CH[ch][0], d, .5 + .05 * k), 0, 1, 0)
music.add(hb(40), braam(38, 2.4, .7), 0, 1, .3)
music.add(hb(43), braam(33, 1.2, .7), 0, 1, .3)
music.add(hb(46.5) , revcym(1.5 * BT * 1.0, .9), 0, 1, .2)
music.add(hb(44), riser(4 * BT, .5), 0, 1, .2)

# C 初交锋 48–96
music.add(hb(48), crash(.9), 0, 1, .3)
music.add(hb(48), braam(38, 3, .9), 0, 1, .3)
drums(48, 96)
ostinato(48, 96, FIGHT, .65)
basses(48, 96, FIGHT, .75)
for b in range(48, 96, 4):
    ch = FIGHT[((b - 48) // 4) % 4]
    for m in CH[ch][1]:
        music.add(hb(b), brass(m - 12, BT * .5, .8), 0, .9, .2)
    music.add(hb(b + 2.5), brass(CH[ch][1][0] - 12, BT * .3, .6), 0, .7, .2)
theme(64, brass, 0, 32, .75, -1, .3)
theme(64, strings, 0, 32, .5, 0, .35)
chords(64, 96, FIGHT, pad, .5, 0, .4)
music.add(hb(80), crash(.6), 0, 1, .3)

# D 升级 96–136
music.add(hb(96), strings(93, 6.5 * BT, .3, .3, 1.5), -.3, 1, .7)
music.add(hb(96), strings(98, 6.5 * BT, .25, .3, 1.5), .3, 1, .7)
music.add(hb(96), sub(26, 6.5 * BT, .55), 0, 1, 0)
music.add(hb(100), riser(2.5 * BT, .6), 0, 1, .3)
music.add(hb(102.5), crash(.8), 0, 1, .3)
music.add(hb(102.5), braam(38, 2.5, .8), 0, 1, .3)
drums(103, 112, .9, half=True)
basses(103, 136, ['Dm', 'Dm', 'Bb', 'A'] * 3, .7)
chords(104, 136, DARK, choir, .5, 0, .5)
ostinato(112, 136, DARK, .55)
drums(120, 136, 1.0)
theme(120, brass, 16, 32, .75, -1, .3)
theme(120, strings, 16, 32, .55, 0, .35)
music.add(hb(128), crash(1), 0, 1, .3)

# E 坠落 136–160
music.add(hb(137), crash(.9), 0, 1, .3)
music.add(hb(137), braam(38, 2.5, .9), 0, 1, .3)
for m in (69, 74, 77, 81):
    music.add(hb(139), strings(m, 3 * BT + .1, .35, .2, .8), 0, 1, .7)
music.add(hb(140.5), revcym(1.8 * BT, .7), 0, 1, .2)
for k, (s, d, m) in enumerate(THEME[:10]):          # 水下：钢琴慢速主题
    if s < 10:
        music.add(144 * BT + s * BT * .62, piano(m - 12, d * BT * .62, .45), 0, 1, .6)
chords(144, 154, ['Dm', 'Bb', 'Dm'], pad, .5, -1, .6)
music.add(hb(154.6), braam(26, 2.5, .8), 0, 1, .3)
music.add(hb(155), riser(5 * BT, .7), 0, 1, .3)
for k in range(10):
    b = 156 + k * .4
    music.add(hb(b), taiko(.4 + .06 * k, k % 2 == 0), 0, 1, .3)

# F 决战 160–212
music.add(hb(160), crash(1), 0, 1, .3)
music.add(hb(160), braam(38, 4, 1), 0, 1, .3)
drums(160, 192, 1.0)
ostinato(160, 200, FIGHT, .7)
basses(160, 200, FIGHT, .85)
chords(160, 200, FIGHT, choir, .6, 0, .5)
chords(160, 200, FIGHT, pad, .5, 0, .4)
theme(168, brass, 0, 32, .85, -1, .3)
theme(168, strings, 0, 32, .6, 0, .35)
for b in range(174, 192):                            # 连击段每拍一下太鼓和铜管
    music.add(hb(b), taiko(.9), (-.3, .3)[b % 2], 1, .3)
    music.add(hb(b), brass(CH[FIGHT[((b - 160) // 4) % 4]][1][0] - 12, BT * .3, .8), 0, .8, .2)
music.add(hb(176), crash(.8), 0, 1, .3)
music.add(hb(184), crash(.8), 0, 1, .3)
for k in range(16):                                   # 漩涡：通鼓渐强
    music.add(hb(192 + k * .375), tom(43 + (k % 4) * 2, .5 + .03 * k), -.4 + .8 * (k % 2), 1, .2)
music.add(hb(192), riser(6 * BT, .8), 0, 1, .3)
music.add(hb(198), crash(1), 0, 1, .3)
music.add(hb(198), braam(26, 3, 1), 0, 1, .3)
drums(200, 206, 1.0)
theme(202, brass, 16, 24, .9, -1, .3)
theme(202, choir, 16, 24, .6, 0, .4)
basses(200, 206, ['Gm', 'A'], .9)
for k in range(6):                                    # 双眼特写：心跳 + 高音弦乐渐强
    music.add(hb(206 + k), taiko(.7 + .05 * k), 0, 1, .3)
    music.add(hb(206.5 + k), taiko(.45, False), 0, 1, .3)
for m in (81, 86, 88):
    music.add(hb(206), strings(m, 6 * BT, .45, 1.2, .05, 1.2), 0, 1, .5)
music.add(hb(208), riser(4 * BT, .9), 0, 1, .2)

# H 余烬 220–240：钢琴和弦乐收束，最后一个 D 大三和弦
for k, ch in enumerate(['Bb', 'C', 'Dm', 'Bb']):
    b = 220 + k * 3
    for j, m in enumerate(CH[ch][1]):
        music.add(hb(b) + j * .05, piano(m, 3 * BT, .4), (j - 1) * .3, 1, .6)
    music.add(hb(b), piano(CH[ch][0] + 12, 3 * BT, .45), 0, 1, .5)
    for m in CH[ch][1]:
        music.add(hb(b), strings(m - 12, 3 * BT, .32, .6, .6), 0, 1, .6)
music.add(hb(229), piano(74, 1.5, .35), 0, 1, .7)
music.add(hb(230.5), piano(76, 1.5, .35), 0, 1, .7)
for m in (62, 66, 69, 74, 78, 81):
    music.add(hb(232), strings(m, 7 * BT, .4, .8, 1.5), 0, 1, .6)
for m in (50, 62, 66, 69):
    music.add(hb(232), piano(m, 4, .5), 0, 1, .7)
music.add(hb(232), choir(69, 6 * BT, .4), 0, 1, .7)
music.add(hb(232), choir(74, 6 * BT, .35), 0, 1, .7)
mus = music.mix(2.4, .03, 7000, 1.0)

# ---------- 音效总线 ----------
fx = Bus()
for e in CUES['events']:
    f = SFX.get(e['kind'])
    if f:
        fx.add(e['t'], f(e['gain']), e['pan'], 1, .25 if e['kind'] not in ('thunder', 'train') else .1)


def rain_level(t):
    pts = [(0, 0), (.4, .85), (39.9, .9), (40.3, .1), (42.6, .1), (43.0, .9), (66.6, .9), (66.8, 1.0), (88.3, 1.0), (88.34, 0), (90.4, 0),
           (90.9, .9), (94.6, .9), (97.2, 0), (101, 0)]
    xs, ys = zip(*pts)
    return np.interp(t, xs, ys)


n = len(fx.dry)
t = np.arange(n) / SR
lvl = rain_level(t)
hiss = bp(rng.standard_normal(n), 1200, 9000) * .07
body = lp(rng.standard_normal(n), 700) * .12
ticks = np.zeros(n)
idx = rng.integers(0, n, int(n / SR * 900))
ticks[idx] = rng.uniform(-1, 1, len(idx))
ticks = bp(ticks, 2000, 8000) * .25
rain_l = (hiss + body + ticks) * lvl
rain_r = (np.roll(hiss, 3001) + np.roll(body, 1777) + np.roll(ticks, 911)) * lvl
fxm = fx.mix(1.6, .02, 7000, .8)
fxm[:, 0] += rain_l
fxm[:, 1] += rain_r

# 撞击时音乐让位（侧链）
duck = np.ones(n)
for e in CUES['events']:
    if e['kind'] in ('clash', 'hit', 'boom', 'slash', 'thunder'):
        i = int(e['t'] * SR)
        m = min(n - i, int(.6 * SR))
        duck[i:i + m] = np.minimum(duck[i:i + m], 1 - .4 * e['gain'] * np.exp(-np.arange(m) / (.16 * SR)))
mus = mus[:n] * duck[:, None]

# 静音段：最后一刀前后
g = np.ones(n)
g[int(88.333 * SR):int(91.667 * SR)] = 0
fade = int(.012 * SR)
i0 = int(88.333 * SR)
g[i0 - fade:i0] = np.linspace(1, 0, fade)
mus *= g[:, None]

# 水下：音效和雨声闷掉，钢琴保持清楚
a, b = int(59.95 * SR), int(65.42 * SR)
under = lp(fxm[a - SR:b + SR], 520, 4)[SR:-SR]
xf = np.ones(b - a)
k = int(.1 * SR)
xf[:k] = np.linspace(0, 1, k)
xf[-k:] = np.linspace(1, 0, k)
fxm[a:b] = fxm[a:b] * (1 - xf[:, None]) + under * xf[:, None] * 1.4
mus[a:b] *= 1.5
mix = mus * .85 + fxm[:n] * .9

end = int(TOTAL * SR)
mix = mix[:end + int(.0 * SR)]
mix[-int(1.2 * SR):] *= np.linspace(1, 0, int(1.2 * SR))[:, None] ** 2
peak = np.abs(mix).max()
mix = np.tanh(mix / peak * 1.6) / np.tanh(1.6) * .93
(ROOT / 'audio').mkdir(exist_ok=True)
wavfile.write(ROOT / 'audio' / 'song.wav', SR, (mix * 32767).astype(np.int16))
for name, y in (('music', mus[:end]), ('sfx', fxm[:end])):
    y = y / max(np.abs(y).max(), 1e-6) * .9
    wavfile.write(ROOT / 'audio' / f'{name}.wav', SR, (y * 32767).astype(np.int16))
rms = np.sqrt((mix ** 2).mean())
print(f'audio/song.wav {len(mix) / SR:.2f}s  rms {20 * np.log10(rms):.1f} dBFS')
