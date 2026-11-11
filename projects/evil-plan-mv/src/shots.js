// shots.js — the MV's shot list. Times come from the aligned lyrics (EP.L = sung start of line i, EP.Wd = a word)
// and are snapped to the 136 BPM beat grid (EP.snap). tr = how a shot enters: {type, lead (s before t), k (time scale)}.
'use strict';
(function () {
  const { L, E, Wd, snap: B } = EP;
  const SH = [];
  const add = (t, s, p = {}, tr) => SH.push({ t, s, p, tr });
  const cutAt = i => B(L(i) - 0.08);

  EP.ASSETS = {
    gen: ['bg_castle', 'bg_lair', 'bg_meeting', 'bg_park', 'bg_hospital_hall', 'bg_kid_bed', 'bg_bread', 'bg_heroes', 'bg_door', 'bg_switch', 'bg_fridge', 'bg_airport', 'bg_hands', 'bg_books', 'bg_cake', 'bg_house_night', 'bg_doorway', 'bg_write', 'bg_sunrise', 'bg_crowd', 'bg_office', 'bg_painter', 'bg_stage', 'bg_old_man', 'bg_mirror', 'bg_mom_relief', 'bg_feast', 'bg_hero_close', 'bg_110', 'bg_daughter', 'bg_hug_read', 'bg_mother_photo', 'bg_throne'],
    cut: ['claude_ref', 'spr_villain', 'spr_shh', 'spr_burglar', 'spr_fan', 'spr_lab', 'spr_lantern', 'spr_candle', 'spr_okay', 'spr_sing', 'spr_point', 'spr_laugh', 'spr_jar', 'spr_phone', 'spr_greedy', 'spr_stamp', 'spr_shrug', 'spr_curtsy']
  };
  EP.ZH_EXTRA = '我爱你慢慢来大好き邪恶计划不统治世界而是全世界放假';
  EP.TOTAL = 380.0;

  // ---------------------------------------------------------------- intro (spoken)
  add(0, 'hello', { vig: 0.3 });
  add(B(3.0), 'monster', {}, { type: 'cut' });                                                     // #046 smash cut
  add(cutAt(2), 'cork', { freezeAt: L(3) - cutAt(2) - 0.05 });
  add(cutAt(4), 'villain', {}, { type: 'cut' });
  add(cutAt(5), 'shh', {});
  // ---------------------------------------------------------------- verse 1
  add(L(6), 'img', { img: 'bg_castle', cam: [{ x: 0.5, y: 0.45, z: 1.18 }, { x: 0.5, y: 0.42, z: 1.04 }], flash: [L(6) + 0.05, Wd(6, 3)], fx: [{ type: 'rays', x: 1300, y: 140, a0: 2.2, alpha: 0.08 }] },
    { type: 'zoom', lead: 1.0, k: 0.71, x: 0, y: 0, r: 34, bg: '#120A18' });   // #020 into the hair daisy (x/y filled below)
  add(cutAt(7), 'throne', {});
  add(cutAt(8), 'phone', {}, { type: 'cut' });
  add(cutAt(9), 'inbox', {});
  add(cutAt(10), 'found', {});
  add(cutAt(11), 'meeting', {});
  add(cutAt(13), 'forms', {});
  add(cutAt(15), 'hold', {});
  add(L(16) - 0.1, 'img', { img: 'bg_park', cam: [{ x: 0.42, y: 0.5, z: 1.12 }, { x: 0.5, y: 0.48, z: 1.05 }], fx: [{ type: 'petals', n: 30 }, { type: 'leak', y: 200, a: 0.3, per: 8 }] }, { type: 'wipe', lead: 0.45 });   // #045
  // ---------------------------------------------------------------- pre-chorus 1
  add(cutAt(17), 'lairwork', {});
  add(cutAt(18), 'sprbg', { bg: 'rays', bgo: { x: 1000, y: 560, c1: '#FF9E5C', c2: '#FFBE82' }, sprites: [{ n: 'spr_villain', x: 1000, y: 1120, h: 1180, enter: 'pop', at: 0.0, sway: 4 }], fx: [{ type: 'sparkle', n: 16 }] });
  add(cutAt(19), 'img', { img: 'bg_hands', cam: [{ x: 0.5, y: 0.5, z: 1.06 }, { x: 0.52, y: 0.48, z: 1.18 }], fx: [{ type: 'leak', y: 300, a: 0.3, per: 6 }, { type: 'dust', n: 26 }] }, { type: 'dissolve', lead: 0.25, k: 0.35 });
  add(cutAt(20), 'sprbg', { bg: 'nightsky', bgo: { mx: 1600, my: 200, mr: 70 }, sprites: [{ n: 'spr_jar', x: 968, y: 1733, h: 1700, enter: 'rise', at: 0, dist: 120, sway: 0 }], fx: [{ type: 'fn', fn: (g, t, f, lt) => { const fl = Math.max(EP.pulse(t, 14) - 0.3, 0); if (fl > 0) { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = fl; EP.glowDot(g, 960, 560, 160, 'rgba(230,240,255,1)', 'rgba(200,220,255,.4)'); g.restore(); } } }, { type: 'fireflies', n: 14 }] }, { type: 'dissolve', lead: 0.25, k: 0.35 });
  add(cutAt(21), 'clockheist', {});
  add(cutAt(22), 'timelapse', {});
  // ---------------------------------------------------------------- chorus 1
  add(L(23) - 0.02, 'daynight', { split: L(24) - L(23) - 0.15, chores: L(24) - L(23) + 0.45 }, { type: 'cut' });   // #042 match cut moon → sun
  const evilWords = (a, b, layout) => {
    const w = [Wd(a, 0), Wd(a, 1), Wd(b, 0), Wd(b, 1)];
    return [
      { s: 'EVIL', at: w[0], x: 600, y: 330, px: 280, out: w[2] - 0.25 }, { s: 'PLAN', at: w[1], x: 600, y: 640, px: 280, out: w[2] - 0.25 },
      { s: 'EVIL', at: w[2], x: 600, y: 330, px: 300, fill: '#FFF6E8', stroke: '#E0662A' }, { s: 'PLAN', at: w[3], x: 600, y: 640, px: 300, fill: '#FFF6E8', stroke: '#E0662A' }
    ];
  };
  add(B(Wd(25, 0) - 0.3), 'evil', { words: evilWords(25, 26), spr: 'spr_laugh' }, { type: 'cut' });
  add(cutAt(27), 'fan', {}, { type: 'cut' });
  add(cutAt(28), 'globe', { line: 28 }, { type: 'bands', lead: 0.7 });   // #018
  add(cutAt(29), 'plan', { v: 1 }, { type: 'cut' });
  // ---------------------------------------------------------------- post-chorus 1
  add(cutAt(31), 'img', { img: 'bg_park', cam: [{ x: 0.3, y: 0.55, z: 1.1 }, { x: 0.62, y: 0.5, z: 1.1 }], ease: 'io', fx: [{ type: 'petals', n: 36 }, { type: 'leak', y: 220, a: 0.3, per: 9 }] }, { type: 'dissolve', lead: 0.3, k: 0.4 });
  add(cutAt(33), 'img', { img: 'bg_painter', cam: [{ x: 0.4, y: 0.5, z: 1.15 }, { x: 0.35, y: 0.5, z: 1.05 }], fx: [{ type: 'dust', n: 26 }] }, { type: 'dissolve', lead: 0.3, k: 0.4 });
  add(cutAt(34), 'img', { img: 'bg_office', grade: 'saturate(0.55) brightness(0.85)', cam: [{ x: 0.45, y: 0.5, z: 1.05 }, { x: 0.45, y: 0.5, z: 1.14 }] }, { type: 'wipe', lead: 0.5, dir: -1, col: '#9AA3B5' });
  add(cutAt(35), 'img', { img: 'bg_crowd', cam: [{ x: 0.6, y: 0.45, z: 1.02 }, { x: 0.55, y: 0.45, z: 1.1 }], fx: [{ type: 'confetti', n: 60 }] }, { type: 'dissolve', lead: 0.3, k: 0.4 });
  add(cutAt(37), 'img', { img: 'bg_crowd', cam: [{ x: 0.45, y: 0.36, z: 1.2 }], zoomin: { t0: 0, ratio: 1.6, k: 0.75 }, fx: [{ type: 'confetti', n: 40 }] }, { type: 'cut' });   // #028 zoom in
  // ---------------------------------------------------------------- verse 2
  add(B(E(37) + 0.05), 'phase2', { greedy: L(39) - B(E(37) + 0.05) - 0.12 }, { type: 'glitch' });   // #023
  add(cutAt(40), 'someday', {});
  add(cutAt(41), 'tuesday', {});
  add(cutAt(42), 'thorns', {}, { type: 'dip', d: 0.4, col: '#000' });
  add(cutAt(44), 'ground', {});
  add(cutAt(46), 'img', { img: 'bg_hospital_hall', cam: [{ x: 0.52, y: 0.5, z: 1.04 }], dolly: { t0: 0.0, ratio: 1.7, k: 0.6 }, fx: [{ type: 'tag', x: 960, y: 140, text: '4F', at: 0.15, bg: '#2A3550', col: '#FFD27A', px: 54, r: 14 }, { type: 'dust', n: 18, a: 0.3 }] });
  add(B(L(47) - 0.15), 'bald', {}, { type: 'dissolve', lead: 0.2, k: 0.3 });
  add(cutAt(48), 'imgx', { a: 'bg_mirror', b: 'bg_mom_relief', at: L(49) - 0.25, k: 0.45, camA: [{ x: 0.35, y: 0.45, z: 1.1 }, { x: 0.33, y: 0.42, z: 1.2 }], camB: [{ x: 0.55, y: 0.45, z: 1.15 }, { x: 0.52, y: 0.42, z: 1.05 }], fx: [{ type: 'petals', n: 16, from: 2.4 }] }, { type: 'dissolve', lead: 0.2, k: 0.3 });
  add(cutAt(50), 'img', { img: 'bg_bread', cam: [{ x: 0.42, y: 0.55, z: 1.25 }, { x: 0.62, y: 0.5, z: 1.15 }], ease: 'io', fx: [{ type: 'dust', n: 20, a: 0.35 }] }, { type: 'dissolve', lead: 0.25, k: 0.35 });
  add(L(52) + 0.1, 'img', { img: 'bg_feast', cam: [{ x: 0.5, y: 0.5, z: 1.15 }, { x: 0.55, y: 0.48, z: 1.05 }], fx: [{ type: 'rays', x: 1700, y: -100, a0: 2.3, alpha: 0.14 }, { type: 'dust', n: 24 }] }, { type: 'liquid', lead: 0.5, col: '#F7BE4F' });   // #019
  add(cutAt(54), 'work2', {});
  add(L(55) - 0.1, 'img', { img: 'bg_painter', cam: [{ x: 0.3, y: 0.5, z: 1.15 }, { x: 0.36, y: 0.48, z: 1.08 }], fx: [{ type: 'dust', n: 24 }, { type: 'leak', y: 200, a: 0.3, per: 7 }] }, { type: 'wipe', lead: 0.5 });
  add(cutAt(56), 'img', { img: 'bg_office', grade: 'saturate(0.8)', cam: [{ x: 0.5, y: 0.45, z: 1.05 }, { x: 0.82, y: 0.32, z: 1.6 }], ease: 'io', fx: [{ type: 'sparkle', n: 10, x0: 1350, w: 500, y0: 150, h: 380, col: '#FFE6A8' }] });
  // ---------------------------------------------------------------- chorus 2
  add(L(58) - 0.02, 'daynight', { split: -1, day: 'bg_painter', chores: L(59) - L(58) + 0.4, dayCam: [{ x: 0.7, z: 1.08 }, { x: 0.74, z: 1.14 }] }, { type: 'whip', lead: 0.4 });   // #043
  add(B(Wd(60, 0) - 0.3), 'evil', { words: evilWords(60, 61), spr: 'spr_villain' }, { type: 'cut' });
  add(cutAt(62), 'fan', { bgImg: 'bg_crowd' }, { type: 'cut' });
  add(cutAt(63), 'globe', { line: 63, planes: true, rot0: 120 }, { type: 'bands', lead: 0.7, cols: ['#4A7BD6', '#F28C38', '#F7BE4F', '#FFF6E8'] });
  add(cutAt(64), 'plan', { v: 2 }, { type: 'cut' });
  // ---------------------------------------------------------------- post-chorus 2
  add(cutAt(66), 'img', { img: 'bg_old_man', cam: [{ x: 0.35, y: 0.5, z: 1.12 }, { x: 0.55, y: 0.45, z: 1.06 }], fx: [{ type: 'petals', n: 26 }, { type: 'leak', y: 180, a: 0.3, per: 8 }] }, { type: 'dissolve', lead: 0.3, k: 0.4 });
  add(cutAt(68), 'img', { img: 'bg_mom_relief', cam: [{ x: 0.5, y: 0.45, z: 1.06 }, { x: 0.46, y: 0.42, z: 1.16 }], fx: [{ type: 'petals', n: 24 }] }, { type: 'dissolve', lead: 0.3, k: 0.4 });
  add(cutAt(69), 'img', { img: 'bg_feast', cam: [{ x: 0.6, y: 0.5, z: 1.15 }, { x: 0.5, y: 0.5, z: 1.06 }], fx: [{ type: 'dust', n: 20 }] }, { type: 'dissolve', lead: 0.3, k: 0.4 });
  add(cutAt(70), 'img', { img: 'bg_park', cam: [{ x: 0.7, y: 0.5, z: 1.15 }, { x: 0.5, y: 0.5, z: 1.04 }], fx: [{ type: 'petals', n: 30 }] }, { type: 'dissolve', lead: 0.3, k: 0.4 });
  add(cutAt(72), 'img', { img: 'bg_hero_close', cam: [{ x: 0.4, y: 0.42, z: 1.04 }, { x: 0.38, y: 0.4, z: 1.16 }], fx: [{ type: 'embers', n: 40 }] }, { type: 'dissolve', lead: 0.3, k: 0.4 });
  // ---------------------------------------------------------------- the heroes
  add(cutAt(73), 'img', { img: 'bg_heroes', cam: [{ x: 0.3, y: 0.65, z: 1.25 }, { x: 0.6, y: 0.35, z: 1.08 }], ease: 'io', fx: [{ type: 'embers', n: 70 }, { type: 'fn', fn: (g, t) => { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.08 + 0.05 * Math.sin(t * 13) + 0.03 * Math.sin(t * 31); g.fillStyle = '#FF8A3D'; g.fillRect(0, 0, EP.W, EP.H); g.restore(); } }] }, { type: 'dip', d: 0.5, col: '#000' });
  add(cutAt(75), 'img', { img: 'bg_hero_close', cam: [{ x: 0.42, y: 0.42, z: 1.08 }], dolly: { t0: 0, ratio: 1.3, k: 0.7 }, fx: [{ type: 'embers', n: 40 }] });
  add(cutAt(76), 'sprbg', { img: 'bg_heroes', blur: 18, bright: 0.7, cam: [{ z: 1.1 }, { z: 1.16 }], sprites: [{ n: 'spr_okay', x: 960, y: 1850, h: 1800, enter: 'fade', at: 0, fd: 0.3, sway: 0, rim: '#FF9A3D', rimA: 0.3 }], fx: [{ type: 'embers', n: 40 }] });
  add(cutAt(77), 'wait', {}, { type: 'dissolve', lead: 0.25, k: 0.3 });
  add(cutAt(79), 'img', { img: 'bg_kid_bed', grade: 'saturate(0.7) brightness(0.9)', cam: [{ x: 0.4, y: 0.45, z: 1.1 }, { x: 0.38, y: 0.42, z: 1.18 }], fx: [{ type: 'ecg', y: 960, d: 3.3, t0: B(L(79) - 0.08) }] }, { type: 'dissolve', lead: 0.25, k: 0.3 });
  add(cutAt(81), 'sprbg', { img: 'bg_heroes', blur: 14, bright: 0.75, cam: [{ z: 1.12 }, { z: 1.2 }], sprites: [{ n: 'spr_lantern', x: 960, y: 1130, h: 1100, enter: 'rise', at: 0, sway: 3, rim: '#FFB35C', rimA: 0.3 }], fx: [{ type: 'embers', n: 50 }, { type: 'bokeh', n: 14, a: 0.3 }] });
  add(cutAt(83), 'img', { img: 'bg_hospital_hall', grade: 'grayscale(1) brightness(0.7) contrast(1.1)', cam: [{ x: 0.5, y: 0.5, z: 1.05 }, { x: 0.5, y: 0.5, z: 1.15 }], fx: [{ type: 'rain', n: 200 }, { type: 'vign', col: 'rgba(0,0,0,.75)' }], grain: 0.16 }, { type: 'dissolve', lead: 0.3, k: 0.35 });
  add(cutAt(85), 'img', { img: 'bg_door', cam: [{ x: 0.5, y: 0.5, z: 1.15 }, { x: 0.5, y: 0.45, z: 1.04 }], fx: [{ type: 'rays', x: 960, y: 300, a0: Math.PI / 2, spread: 0.25, n: 10, alpha: 0.12 }, { type: 'embers', n: 40 }] }, { type: 'iris', lead: 0.55, x: 960, y: 420, shape: 'circle', col: '#FFE2B0' });   // #017
  add(cutAt(87), 'switch', {});
  // ---------------------------------------------------------------- what made the monster
  add(cutAt(89), 'madeQ', {}, { type: 'dissolve', lead: 0.3, k: 0.35 });
  add(cutAt(90), 'img', { img: 'bg_airport', cam: [{ x: 0.4, y: 0.4, z: 1.2 }, { x: 0.42, y: 0.38, z: 1.32 }], fx: [{ type: 'bubble', x: 1180, y: 300, text: 'landed ✈  call you soon ♥', at: 0.35, px: 40 }] });
  add(cutAt(91), 'img', { img: 'bg_fridge', cam: [{ x: 0.55, y: 0.45, z: 1.05 }, { x: 0.5, y: 0.45, z: 1.12 }], fx: [
    { type: 'hand', x: 655, y: 205, text: 'love you!', at: 0.15, px: 48, rot: -0.04 }, { type: 'hand', x: 615, y: 640, text: 'eat breakfast ♥', at: 0.35, px: 34, rot: 0.03 },
    { type: 'hand', x: 845, y: 770, text: 'proud of you', at: 0.55, px: 36, rot: -0.02 }, { type: 'hand', x: 1475, y: 505, text: "you've got this", at: 0.75, px: 34, rot: 0.04 },
    { type: 'hand', x: 1150, y: 790, text: 'call me when', at: 0.95, px: 40 }, { type: 'hand', x: 1150, y: 850, text: 'you land :)', at: 1.15, px: 40 }] });
  add(cutAt(92), 'img', { img: 'bg_hands', cam: [{ x: 0.55, y: 0.5, z: 1.15 }, { x: 0.58, y: 0.5, z: 1.3 }], fx: [{ type: 'fn', fn: (g, t, f, lt) => EP.lightSweep(g, lt, { x: 300, y: 200, w: 1300, h: 700 }, k => { k.beginPath(); k.rect(0, 0, EP.W, EP.H); }, EP.SC * 2.5) }, { type: 'dust', n: 20 }] });
  add(cutAt(93), 'words', {});
  add(cutAt(94), 'name', {}, { type: 'iris', lead: 0.4, x: 960, y: 520, shape: 'daisy', k: 0.6 });   // #017 (daisy window)
  add(cutAt(95), 'img', { img: 'bg_books', cam: [{ x: 0.4, y: 0.4, z: 1.05 }, { x: 0.42, y: 0.32, z: 1.22 }], fx: [{ type: 'dust', n: 24 }, { type: 'fn', fn: (g, t) => { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.06 + 0.06 * Math.max(0, Math.sin(t * 9)); g.fillStyle = '#FF3A2A'; g.fillRect(EP.W * 0.45, 0, EP.W * 0.55, EP.H); g.restore(); } }] });
  add(cutAt(97), 'img', { img: 'bg_cake', cam: [{ x: 0.5, y: 0.45, z: 1.05 }, { x: 0.5, y: 0.42, z: 1.2 }], fx: [{ type: 'bokeh', n: 14, a: 0.3 }] }, { type: 'dissolve', lead: 0.25, k: 0.3 });
  add(cutAt(98), 'sprbg', { bg: 'radial', bgo: { x: 960, y: 520, r: 1200, stops: [[0, '#4A2A22'], [1, '#100A10']] }, sprites: [{ n: 'spr_candle', x: 960, y: 1500, h: 1500, enter: 'fade', at: 0, fd: 0.3, sway: 0 }], fx: [{ type: 'bokeh', n: 12, a: 0.3 }] });
  add(cutAt(99), 'take', {});
  // ---------------------------------------------------------------- chorus 3 (the big one)
  add(L(101) - 0.02, 'daynight', { split: -1, days: ['bg_park', 'bg_feast', 'bg_old_man', 'bg_mom_relief', 'bg_painter', 'bg_crowd', 'bg_hug_read', 'bg_daughter'], chores: L(102) - L(101) + 0.4 }, { type: 'whip', lead: 0.4 });
  add(B(E(102) + 0.05), 'build', {});
  add(B(211.92 - 0.3), 'evil', {
    alt: ['spr_laugh', 'spr_villain'], words: [
      { s: 'EVIL', at: 211.92, x: 600, y: 300, px: 300, out: 213.55 }, { s: 'PLAN', at: 212.56, x: 600, y: 600, px: 300, out: 213.55 },
      { s: 'PLAN', at: 213.12, x: 330, y: 840, px: 150, r: -0.12, out: 213.55, amt: 0.3 }, { s: 'PLAN', at: 213.56, x: 870, y: 850, px: 150, r: 0.1, out: 213.75, amt: 0.3 },
      { s: 'EVIL', at: 213.80, x: 600, y: 300, px: 320, fill: '#FFF6E8', stroke: '#E0662A' }, { s: 'PLAN', at: 214.26, x: 600, y: 600, px: 320, fill: '#FFF6E8', stroke: '#E0662A' },
      { s: 'PLAN', at: 214.88, x: 330, y: 850, px: 160, r: -0.1, fill: '#FFF6E8', stroke: '#E0662A', amt: 0.3 }, { s: 'PLAN', at: 215.30, x: 880, y: 860, px: 160, r: 0.12, fill: '#FFF6E8', stroke: '#E0662A', amt: 0.3 }]
  }, { type: 'cut' });
  add(cutAt(105), 'fan', { bgImg: 'bg_crowd' }, { type: 'cut' });
  add(cutAt(106), 'globe', { line: 106, planes: true, rot0: 240 }, { type: 'bands', lead: 0.7 });
  add(B(L(107) - 0.2), 'plan', { v: 3 }, { type: 'cut' });
  // ---------------------------------------------------------------- post-chorus 3
  add(cutAt(109), 'img', { img: 'bg_painter', cam: [{ x: 0.6, y: 0.5, z: 1.15 }, { x: 0.4, y: 0.5, z: 1.08 }], fx: [{ type: 'leak', y: 200, a: 0.3, per: 9 }] }, { type: 'dissolve', lead: 0.3, k: 0.4 });
  add(cutAt(111), 'img', { img: 'bg_park', cam: [{ x: 0.5, y: 0.45, z: 1.05 }, { x: 0.6, y: 0.45, z: 1.14 }], fx: [{ type: 'petals', n: 30 }] }, { type: 'dissolve', lead: 0.3, k: 0.4 });
  add(cutAt(112), 'img', { img: 'bg_office', grade: 'saturate(0.6) brightness(0.8)', cam: [{ x: 0.45, y: 0.45, z: 1.2 }, { x: 0.45, y: 0.45, z: 1.3 }], fx: [{ type: 'tag', x: 820, y: 560, text: 'gone outside :)', at: 0.4, bg: '#FFE37A', col: '#3A2A20', px: 46, fam: EP.F.hand, r: 6, rot: -0.06 }] }, { type: 'dissolve', lead: 0.3, k: 0.4 });
  add(cutAt(113), 'img', { img: 'bg_crowd', cam: [{ x: 0.6, y: 0.45, z: 1.02 }, { x: 0.52, y: 0.45, z: 1.1 }], fx: [{ type: 'confetti', n: 70 }] }, { type: 'dissolve', lead: 0.3, k: 0.4 });
  add(cutAt(115), 'img', { img: 'bg_crowd', cam: [{ x: 0.46, y: 0.36, z: 1.3 }], zoomin: { t0: 0, ratio: 1.5, k: 0.8 }, fx: [{ type: 'confetti', n: 40 }] }, { type: 'cut' });
  // ---------------------------------------------------------------- bridge: the bedtime story
  add(B(L(116) - 0.6), 'img', { img: 'bg_house_night', cam: [{ x: 0.55, y: 0.5, z: 1.04 }, { x: 0.58, y: 0.42, z: 1.22 }], fx: [{ type: 'fireflies', n: 22 }, { type: 'clock', x: 1690, y: 200, text: '21:30', at: 2.2 }], vig: 0.55 }, { type: 'dissolve', lead: 0.6, k: 0.8 });
  add(cutAt(118), 'img', { img: 'bg_doorway', cam: [{ x: 0.2, y: 0.42, z: 1.75 }, { x: 0.21, y: 0.4, z: 1.95 }], fx: [{ type: 'dust', n: 16, a: 0.35 }] }, { type: 'dissolve', lead: 0.3, k: 0.4 });
  add(cutAt(120), 'img', { img: 'bg_doorway', cam: [{ x: 0.68, y: 0.38, z: 1.5 }, { x: 0.68, y: 0.38, z: 1.62 }], fx: [{ type: 'fn', fn: (g, t) => { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.1 + 0.05 * Math.sin(t * 7) + 0.04 * Math.sin(t * 19); g.fillStyle = '#5A8CFF'; g.fillRect(0, 0, EP.W, EP.H); g.restore(); } }] });
  add(cutAt(122), 'jumpcut', {});
  add(cutAt(124), 'tales', {});
  add(cutAt(126), 'doodles', { line: 126 }, { type: 'dissolve', lead: 0.25, k: 0.3 });
  add(cutAt(128), 'perfect', {}, { type: 'dissolve', lead: 0.3, k: 0.4 });
  add(cutAt(130), 'voices', {}, { type: 'dissolve', lead: 0.3, k: 0.35 });
  add(cutAt(132), 'tell', {});
  add(cutAt(134), 'img', { img: 'bg_hug_read', cam: [{ x: 0.5, y: 0.45, z: 1.06 }, { x: 0.48, y: 0.42, z: 1.2 }], fx: [{ type: 'leak', y: 250, a: 0.35, per: 6 }, { type: 'sparkle', n: 10, col: '#FFE6A8' }] }, { type: 'dissolve', lead: 0.3, k: 0.4 });
  add(B(L(136) - 0.15), 'img', { img: 'bg_lair', cam: [{ x: 0.55, y: 0.5, z: 1.3 }, { x: 0.5, y: 0.5, z: 1.04 }], fx: [{ type: 'dust', n: 24 }] }, { type: 'dissolve', lead: 0.3, k: 0.4 });
  add(B(E(137) + 0.1), 'century', { musicAt: 278.3, noLyrics: true, grain: 0.12 }, { type: 'dip', d: 0.8, col: '#000' });
  // ---------------------------------------------------------------- I hope you get old
  add(B(L(138) - 0.3), 'img', { img: 'bg_heroes', grade: 'saturate(1.1) brightness(1.05) sepia(0.15)', cam: [{ x: 0.35, y: 0.6, z: 1.15 }, { x: 0.55, y: 0.45, z: 1.05 }], ease: 'io', fx: [{ type: 'embers', n: 50 }] }, { type: 'dissolve', lead: 0.4, k: 0.5 });
  add(cutAt(140), 'img', { img: 'bg_110', cam: [{ x: 0.42, y: 0.42, z: 1.06 }, { x: 0.4, y: 0.4, z: 1.16 }], hand: 0.0, fx: [{ type: 'dust', n: 20 }, { type: 'bokeh', n: 10, a: 0.2 }] }, { type: 'dissolve', lead: 0.25, k: 0.35 });
  add(cutAt(142), 'img', { img: 'bg_daughter', cam: [{ x: 0.5, y: 0.45, z: 1.04 }, { x: 0.46, y: 0.42, z: 1.15 }], fx: [{ type: 'leak', y: 280, a: 0.3, per: 7, from: 4.5 }, { type: 'dust', n: 20 }] }, { type: 'dissolve', lead: 0.3, k: 0.4 });
  add(cutAt(146), 'prize', {}, { type: 'dissolve', lead: 0.25, k: 0.35 });
  add(cutAt(148), 'img', { img: 'bg_110', cam: [{ x: 0.38, y: 0.38, z: 1.35 }, { x: 0.38, y: 0.36, z: 1.45 }], hand: 0.25, fx: [{ type: 'dust', n: 16 }] });
  add(cutAt(150), 'eyes', {}, { type: 'cut' });
  // ---------------------------------------------------------------- the different ending
  add(cutAt(151), 'realistic', { grain: 0.15 }, { type: 'dissolve', lead: 0.3, k: 0.4 });
  add(cutAt(153), 'hope', {}, { type: 'dissolve', lead: 0.3, k: 0.4 });
  add(cutAt(155), 'persuasion', {}, { type: 'cut' });
  const doom = EP.T.lines[157].en;
  add(cutAt(156), 'lies', { lines: [[doom, L(157) - 0.1, '#8A2A1E']], dt: Math.min(0.07, (E(157) - L(157) + 0.2) / [...doom].length) });
  add(cutAt(158), 'different', { lines: [[doom, 0, '#8A2A1E']] }, { type: 'cut' });
  add(cutAt(159), 'img', { img: 'bg_write', cam: [{ x: 0.5, y: 0.5, z: 1.04 }, { x: 0.52, y: 0.56, z: 1.3 }], fx: [{ type: 'dust', n: 30 }, { type: 'leak', y: 200, a: 0.35, per: 6 }] }, { type: 'dissolve', lead: 0.3, k: 0.35 });
  add(B(L(161) - 0.25), 'forever', { text: 'Everyone lives forever.' }, { type: 'dissolve', lead: 0.2, k: 0.25 });
  // ---------------------------------------------------------------- chorus 4
  add(L(162) - 0.02, 'dawn', {}, { type: 'dip', d: 0.3, col: '#FFF6E8' });
  add(B(347.72 - 0.3), 'evil', {
    alt: ['spr_sing', 'spr_laugh'], grade: 'brightness(0.75) saturate(1.3) hue-rotate(8deg)', words: [
      { s: 'EVIL', at: 347.72, x: 600, y: 300, px: 300, out: 349.45 }, { s: 'PLAN', at: 348.28, x: 600, y: 600, px: 300, out: 349.45 },
      { s: 'PLAN', at: 348.86, x: 330, y: 840, px: 150, r: -0.12, out: 349.45, amt: 0.3 }, { s: 'PLAN', at: 349.30, x: 870, y: 850, px: 150, r: 0.1, out: 349.6, amt: 0.3 },
      { s: 'EVIL', at: 349.70, x: 600, y: 300, px: 320, fill: '#FFF6E8', stroke: '#E0662A' }, { s: 'PLAN', at: 350.02, x: 600, y: 600, px: 320, fill: '#FFF6E8', stroke: '#E0662A' },
      { s: 'PLAN', at: 350.64, x: 330, y: 850, px: 160, r: -0.1, fill: '#FFF6E8', stroke: '#E0662A', amt: 0.3 }, { s: 'PLAN', at: 351.12, x: 880, y: 860, px: 160, r: 0.12, fill: '#FFF6E8', stroke: '#E0662A', amt: 0.3 }]
  }, { type: 'bands', lead: 0.7, cols: ['#F28C38', '#FFF6E8', '#F7BE4F', '#E0662A'] });
  add(cutAt(166), 'fan', { bgImg: 'bg_sunrise' }, { type: 'cut' });
  add(cutAt(167), 'globe', { line: 167, planes: true, rot0: 60 }, { type: 'bands', lead: 0.7 });
  add(cutAt(168), 'plan', { v: 4 }, { type: 'cut' });
  // ---------------------------------------------------------------- outro montage + end card
  const mc = [L(170), L(171), L(172), L(173), L(174), L(175), L(176), Wd(176, 3)].map(x => B(x - 0.08));
  add(mc[0], 'montage', {
    cuts: mc, list: [['bg_old_man', 0.45, 0.45, 1.06], ['bg_feast', 0.5, 0.5, 1.06], ['bg_mom_relief', 0.5, 0.45, 1.06], ['bg_hug_read', 0.5, 0.45, 1.06], ['bg_daughter', 0.5, 0.45, 1.06], ['bg_110', 0.45, 0.42, 1.06], ['bg_painter', 0.45, 0.5, 1.06], ['bg_crowd', 0.45, 0.4, 1.12]]
  }, { type: 'dissolve', lead: 0.3, k: 0.4 });
  add(E(176) + 0.15, 'endcard', { noLyrics: false }, { type: 'iris', lead: 0.6, x: 960, y: 540, shape: 'daisy', k: 0.8 });

  SH.sort((a, b) => a.t - b.t);
  SH.forEach((s, i) => { s.dur = (i + 1 < SH.length ? SH[i + 1].t : EP.TOTAL) - s.t; });
  EP.SHOTS = SH;

  // subtitle modes: the giant EVIL PLAN slams carry the English, keep the Chinese line
  [25, 26, 60, 61, 103, 104, 164, 165].forEach(i => { EP.SUB[i] = 'zh'; });
  for (let i = 116; i <= 137; i++) EP.SUBSTYLE[i] = 'italic';
  EP.letterbox = t => EP.smooth(EP.P(t, 238.9, 239.9)) * (1 - EP.smooth(EP.P(t, 291.9, 292.7)));

  // after images load: aim the zoom-through at the daisy in "shh"
  EP.prepare = async () => {
    const z = SH.find(s => s.tr && s.tr.type === 'zoom');
    if (z) { const d = EP.shhDaisy(); z.tr.x = d.x; z.tr.y = d.y; }
  };
})();
