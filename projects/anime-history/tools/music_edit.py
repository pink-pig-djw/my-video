#!/usr/bin/env python3
"""把 audio/suno.wav 重新编排成正好 150 秒的片子配乐。

原曲 121.98 BPM，重采样到 120 BPM 后一小节正好 2 秒；按小节挑选、拼接，
每个接点用和声相似度打分，最后把 audio/sfx.wav 的环境声混进去，写 audio/song_v2.wav。
  uv run --no-project --with numpy --with scipy python tools/music_edit.py [--check]
"""
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, resample_poly, sosfilt, stft

SR = 44100
SPEED = 120 / 121.98
BAR = 2.0
S1 = 1.826 / SPEED                     # 重采样后第 1 小节的起点
TOTAL = 150.0

# (片中起点秒, 原曲起始小节, 小节数)
PLAN = [
    (6, 2, 18),     # 1917-1979：乐队在 6.0 秒进入，S13 的强拍正落在 28 秒
    (42, 29, 8),    # 1984-88：和声接得最顺；S31 的回归落在 46 秒，滑翔镜头起飞
    # 58-60 全静
    (60, 60, 4),    # 水下：滤成闷响，66 秒后淡出
    (68, 94, 2),    # 走廊：只剩一段冷钢琴
    # 72-74 全静，只留光标和上升音
    (74, 38, 9),    # 2000s：S44-46 的安静段给深夜镜头
    (92, 47, 4),    # 高墙：低沉
    (100, 54, 1),
    (102, 55, 5),   # 天空：大开
    (112, 71, 8),   # 战斗：全曲最大高潮
    (128, 60, 2),   # 寂静：战斗后只剩稀疏的音
    (132, 69, 2),
    (136, 93, 7),   # 钢琴尾声，自然收在片尾
]


def load():
    sr, x = wavfile.read('audio/suno.wav')
    x = x.astype(np.float64) / 32768
    # 纯重采样放慢 1.6%：没有时间拉伸的瑕疵，音高只低约 28 音分
    y = resample_poly(x, 12000, round(12000 * SPEED), axis=0)
    return y


def bar_at(n):
    return S1 + (n - 1) * BAR


def chroma(y, a, b):
    seg = y[int(a * SR):int(b * SR)].mean(1)
    f, t, Z = stft(seg, SR, nperseg=8192, noverlap=4096)
    A = np.abs(Z).mean(1)
    c = np.zeros(12)
    m = (f > 80) & (f < 2500)
    pc = np.round(12 * np.log2(f[m] / 440)).astype(int) % 12
    np.add.at(c, pc, A[m] ** 2)
    return c / (np.linalg.norm(c) + 1e-9)


def check(y):
    """接点 a->b：比较 b 这一小节和 a 后面本该出现的那一小节，越接近 1 越顺。"""
    for i in range(len(PLAN) - 1):
        t0, s, n = PLAN[i]
        t1, s2, _ = PLAN[i + 1]
        nxt = s + n
        if t0 + n * BAR != t1 or nxt == s2:
            print(f'{t1:>4}s S{nxt - 1}->S{s2}: {"gap" if t0 + n * BAR != t1 else "natural"}')
            continue
        sim = chroma(y, bar_at(nxt), bar_at(nxt) + BAR) @ chroma(y, bar_at(s2), bar_at(s2) + BAR)
        alts = sorted(((chroma(y, bar_at(nxt), bar_at(nxt) + BAR) @ chroma(y, bar_at(k), bar_at(k) + BAR), k) for k in range(max(2, s2 - 4), s2 + 5)), reverse=True)[:3]
        print(f'{t1:>4}s S{nxt - 1}->S{s2}: harmony {sim:.3f}   nearby best {[(k, round(float(v), 3)) for v, k in alts]}')


def lp(x, f):
    return sosfilt(butter(4, f / (SR / 2), 'low', output='sos'), x, axis=0)


def build(y):
    out = np.zeros((int((TOTAL + 2) * SR), 2))
    X = int(.03 * SR)                  # 30 毫秒等功率交叉
    fade = np.sin(np.linspace(0, np.pi / 2, X))[:, None]

    def place(t, src0, src1):
        a, b = int(src0 * SR), int(src1 * SR)
        seg = y[max(0, a - X):b + X].copy()
        seg[:X] *= fade
        seg[-X:] *= fade[::-1]
        i = int(t * SR) - X
        out[i:i + len(seg)] += seg

    # 前奏：让原曲的开头在 6.0 秒之前铺好，乐队准点进入
    place(6 - bar_at(2), 0.02, bar_at(2))
    for t, s, n in PLAN:
        place(t, bar_at(s), bar_at(s + n) if s + n <= 100 else len(y) / SR - .02)
    return out[:int(TOTAL * SR)]


def main():
    y = load()
    print('resampled sec', round(len(y) / SR, 3), 'bar 2 at', round(bar_at(2), 3))
    check(y)
    if '--check' in sys.argv:
        return
    m = build(y)
    n = len(m)
    # 58 秒硬停
    c = int(58 * SR)
    m[c:c + 200] *= np.linspace(1, 0, 200)[:, None]
    m[c + 200:int(60 * SR)] = 0
    # 水下：60-64 全闷，64-72 只留冷的中低频
    a, b, d = int(60 * SR), int(64 * SR), int(72 * SR)
    m[a:b] = lp(m[a:b], 520) * 1.5
    m[b:d] = lp(m[b:d], 2400) * .62
    f0, f1 = int(66 * SR), int(67.4 * SR)  # 水下的音乐淡出，走廊之前完全安静
    m[f0:f1] *= np.linspace(1, 0, f1 - f0)[:, None] ** 2
    m[f1:int(68 * SR)] = 0
    r = int(.5 * SR)                   # 72 秒前收住，留一小节静默
    m[d - r:d] *= np.linspace(1, 0, r)[:, None] ** 2
    m[d:int(74 * SR)] = 0
    # 127.5 硬切，128 前全静
    c = int(127.5 * SR)
    m[c:c + 200] *= np.linspace(1, 0, 200)[:, None]
    m[c + 200:int(128 * SR)] = 0
    # 寂静段压低一点，让战斗后的落差更大
    a, b = int(128 * SR), int(136 * SR)
    g = np.ones(n)
    g[a:b] = .8
    q = int(.9 * SR)                   # 136 秒前留一口气，再进钢琴尾声
    g[b - q:b] *= np.linspace(1, 0, q) ** 2
    m *= g[:, None]
    # 环境声
    sr, s = wavfile.read('audio/sfx.wav')
    s = s.astype(np.float64) / 32768
    s = s[:n]
    # 74 秒爆开前的上升音
    k = int(1.6 * SR)
    rng = np.random.default_rng(74)
    rise = sosfilt(butter(2, 2500 / (SR / 2), 'high', output='sos'), rng.standard_normal(k)) * np.linspace(0, 1, k) ** 3 * .16
    i = int(72.4 * SR)
    m[i:i + k] += rise[:, None]
    mix = m + s[:, :] * .8
    peak = np.abs(mix).max()
    mix = np.tanh(mix / peak * 1.25) / np.tanh(1.25) * .95
    t = int(.5 * SR)
    mix[-t:] *= np.linspace(1, 0, t)[:, None]
    wavfile.write('audio/song_v2.wav', SR, (mix * 32767).astype(np.int16))
    print('written, peak before limit', round(float(peak), 2), 'sec', round(len(mix) / SR, 3))
    for a, b in [(0, 6), (6, 28), (28, 42), (42, 58), (58, 60), (60, 72), (72, 74), (74, 86), (86, 92), (92, 102), (102, 112), (112, 127.5), (127.5, 128), (128, 136), (136, 150)]:
        seg = mix[int(a * SR):int(b * SR)]
        print(f'{a:>6}-{b:<6} rms {20 * np.log10(np.sqrt((seg ** 2).mean()) + 1e-7):6.1f} dB')


if '--quiet' in sys.argv:
    y = load()
    Q = [45, 46, 60, 61, 62, 69, 70, 86, 87, 96, 97]
    ch = {k: chroma(y, bar_at(k), bar_at(k) + BAR) for k in Q + [k + 1 for k in Q] + [93]}
    fit = lambda a, b: float(ch[a + 1] @ ch[b]) if a + 1 != b else 1.0
    import itertools
    res = []
    for a, b in itertools.product(Q, Q):
        for c, d in itertools.product(Q, Q):
            if len({a, c}) < 2 or b != a + 1 or d != c + 1:
                continue
            res.append((min(fit(b, c), fit(d, 93)), a, b, c, d, round(fit(b, c), 3), round(fit(d, 93), 3)))
    for r in sorted(res, reverse=True)[:8]:
        print(r)
else:
    main()
