"""The one timeline for 《雨烬》: shots and sound/impact events, in beats (144 BPM, beat = 10 frames at 24 fps).
Writes src/cues.json, read by src/film.js (cuts, shake, flashes) and tools/score.py (music sections, sound effects).
  python tools/cues.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BPM = 144
BEAT = 60 / BPM

# (id, first beat, end beat)
SHOTS = [
    ('s01', 0, 8), ('s02', 8, 14), ('s03', 14, 20), ('s04', 20, 24),
    ('s05', 24, 28), ('s06', 28, 31), ('s07', 31, 34), ('s08', 34, 37), ('s09', 37, 40), ('s10', 40, 43), ('s11', 43, 46), ('s12', 46, 48),
    ('s13', 48, 50.5), ('s14', 50.5, 52.5), ('s15', 52.5, 54), ('s16', 54, 56), ('s17', 56, 58), ('s18', 58, 64), ('s19', 64, 66),
    ('s20', 66, 68), ('s21', 68, 72), ('s22', 72, 76), ('s23', 76, 78), ('s24', 78, 80), ('s25', 80, 84), ('s26', 84, 88), ('s27', 88, 92),
    ('s28', 92, 96),
    ('s29', 96, 100), ('s30', 100, 102), ('s31', 102, 106), ('s32', 106, 110), ('s33', 110, 112), ('s34', 112, 116), ('s35', 116, 120),
    ('s36', 120, 124), ('s37', 124, 128), ('s38', 128, 130), ('s39', 130, 136),
    ('s40', 136, 139), ('s41', 139, 142), ('s42', 142, 144), ('s43', 144, 150), ('s44', 150, 154), ('s45', 154, 157), ('s46', 157, 160),
    ('s47', 160, 164), ('s48', 164, 167), ('s49', 167, 170), ('s50', 170, 174), ('s51', 174, 192), ('s52', 192, 198), ('s53', 198, 202),
    ('s54', 202, 206), ('s55', 206, 212),
    ('s56', 212, 214), ('s57', 214, 220),
    ('s58', 220, 224), ('s59', 224, 227), ('s60', 227, 232), ('s61', 232, 240),
]

# (beat, kind, gain 0..1, pan -1..1). Kinds: clash hit whoosh thunder bell splash steam horn slash click needle crack drop boom riser
EV = [
    (2.6, 'thunder', .9, 0), (21.6, 'bell', .8, .1),
    (34.6, 'click', .7, -.2), (36.0, 'steam', .5, -.2), (37.6, 'chime', .6, .3),
    (40, 'boom', .5, 0), (43, 'boom', .5, 0),
    (46, 'thunder', 1, 0), (46, 'hit', .8, 0),
    (48, 'splash', .8, -.3), (48.2, 'whoosh', .7, -.4), (50.5, 'splash', .8, .3), (50.6, 'whoosh', .7, .4), (52.5, 'whoosh', .9, 0),
    (54, 'clash', 1, 0), (54, 'hit', 1, 0), (56, 'splash', .9, 0),
    (58.6, 'whoosh', .5, -.2), (59, 'clash', .8, -.2), (60.6, 'whoosh', .5, .2), (61, 'clash', .9, .2), (62.5, 'whoosh', .7, .3),
    (64, 'clash', .9, -.2), (66, 'clash', .9, .2),
    (68, 'hit', .8, .3), (68.2, 'grind', .8, -.3), (72.5, 'whoosh', .7, 0), (73.5, 'slash', .9, 0), (73.6, 'hit', .6, 0),
    (76, 'whoosh', .8, .2), (77, 'crack', .8, .4), (77.3, 'clash', .4, .4), (78, 'whoosh', .4, 0),
    (80.5, 'whoosh', .8, .2), (84, 'clash', 1, -.3), (85, 'clash', 1, .3), (86, 'clash', 1, -.2), (87, 'clash', 1, .2), (87, 'hit', .7, 0),
    (88, 'hit', .8, .3), (88.1, 'splash', .9, .3), (92, 'drop', .5, 0),
    (96, 'freeze', .9, 0), (102.5, 'needle', 1, 0), (106.2, 'clash', .6, -.2), (106.8, 'clash', .6, .2), (107.4, 'clash', .6, 0),
    (108, 'clash', .6, -.3), (108.5, 'clash', .6, .3), (106, 'steam', 1, 0), (110, 'steam', .8, 0),
    (112.3, 'horn', 1, -.6), (113, 'train', 1, 0), (124, 'whoosh', .9, 0), (128, 'clash', 1, 0), (128, 'hit', 1, 0), (128.1, 'crack', 1, 0),
    (128.2, 'splash', 1, 0), (131, 'clash', .8, -.2), (132.5, 'clash', .8, .2), (134, 'clash', .8, 0), (135, 'clash', .9, 0),
    (137, 'slash', 1, 0), (137, 'hit', 1, 0), (139.2, 'whoosh', .5, 0), (142.3, 'splash', 1, 0),
    (151, 'bell', .6, 0), (154.6, 'boom', .9, 0), (157.2, 'splash', 1, 0), (157.3, 'whoosh', .9, 0),
    (160, 'hit', .9, 0), (160.1, 'splash', .8, 0), (164.5, 'steam', 1, 0), (167, 'thunder', 1, 0),
    (170, 'whoosh', .8, -.4), (172, 'whoosh', .8, .4),
    *[(174 + k, 'clash' if k % 2 == 0 else 'hit', .85 if k % 4 else 1, (-.4 if k % 2 else .4) * (k % 3 - 1)) for k in range(18)],
    (192, 'vortex', 1, 0), (198, 'hit', 1, 0), (198, 'steam', 1, 0), (198.2, 'boom', 1, 0), (202, 'thunder', 1, 0), (202.2, 'whoosh', .9, 0),
    (209, 'bell', .7, -.3), (209, 'bell', .7, .3),
    (212.3, 'slash', 1, 0), (217, 'rain', .8, 0),
    (221, 'crack', .6, -.2), (222.4, 'drop', .7, -.2), (225.6, 'bell', 1, .2), (225.8, 'drop', .6, .2),
]

out = {
    'bpm': BPM, 'beat': BEAT, 'total': 240 * BEAT,
    'shots': [{'id': i, 'b0': a, 'b1': b, 't0': round(a * BEAT, 6), 't1': round(b * BEAT, 6)} for i, a, b in SHOTS],
    'events': sorted([{'b': b, 't': round(b * BEAT, 6), 'kind': k, 'gain': g, 'pan': p} for b, k, g, p in EV], key=lambda e: e['t']),
}
for x, y in zip(SHOTS, SHOTS[1:]):
    assert x[2] == y[1], (x, y)
(ROOT / 'src' / 'cues.json').write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding='utf-8')
print(len(SHOTS), 'shots', len(EV), 'events', f"{out['total']:.2f}s")
