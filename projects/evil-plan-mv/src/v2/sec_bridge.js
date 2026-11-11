// v2/sec_bridge.js — the bedtime bridge, the silence, and the hundred-year interlude (239.8 – 292.5 s).
// Half past nine: the quiet house, the clock, the kid in the doorway with a broken-spined book; "just a minute"
// bubbles multiply while the clock winds back to eight and the kid's tally marks count the wait. Claude's giant pencil
// throws out a thousand tales in 0.50 s; a crayon dragon, a rocket and a talking cat draw themselves. A perfect page
// against the dad's wonderfully wrong voices; "Go hold him"; Claude takes the laptop away and the lamp clicks off.
// After 3.5 s of silence: a hundred years go by in a window — days flicker, seasons fly, the calendar runs from 2026
// to 2126, the hero's photograph ages beside it. Claude sits on the sill and does not change.
'use strict';
(function () {
  const { W, H, clamp, lerp, P, eIO, eIOs, eOut, eOut5, eIn, backOut, spring, smooth, hash, noise, mod } = EP;
  const PA = EP.PA, STK = EP.STK, KT = EP.KT, WD = EP.WD, K = EP.K, F = EP.F, COL = PA.COL;
  const L = EP.L, Wd = EP.Wd;
  const spread = (id, x, y, w, h, mood, rot, draw, extra = {}) => WD.spreads.push(Object.assign({ id, x, y, w, h, mood, rot, draw }, extra));
  const mixc = (a, b, k) => EP.mix(a, b, clamp(k));
  const nd = (i, x, y, w, px, emph = {}, extra = {}) => Object.assign({ i, x, y, w, px, style: 'serif', col: '#EDE6F2', emph, zhCol: '#B8B0C8', zh: { px: 26 } }, extra);

  // ================================================================== B1 · half past nine
  const dB116 = nd(116, -1080, -605, 960, 70, { 'quiet': { italic: true, col: '#9FB4E0' } });
  const dB117 = nd(117, 40, -605, 1050, 70, { 'nine': { style: 'marker', col: '#F4CE72', big: 1.25 } });
  const dB118 = nd(118, -1080, 160, 950, 64, { 'doorway': { italic: true, col: '#F4CE72' } });
  const dB119 = nd(119, -1080, 300, 950, 64, { 'broken': { style: 'marker', col: '#E8A0A0' }, 'spine': { style: 'marker', col: '#E8A0A0' } });
  function brokenBook(g, x, y, s, t, t0) {
    const p = eOut5(P(t, t0, t0 + 0.4)); if (p <= 0) return;
    g.save(); g.translate(x, y + (1 - p) * 200); g.rotate(-0.12); g.scale(s, s); g.globalAlpha *= p;
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-150, -90, 310, 200);
    g.fillStyle = '#3E7FB8'; g.fillRect(-160, -100, 150, 200); g.fillStyle = '#3A76AC'; g.fillRect(10, -100, 150, 200);
    g.fillStyle = '#F4EADB'; g.fillRect(-150, -92, 135, 184); g.fillRect(15, -92, 135, 184);
    g.strokeStyle = '#2A2440'; g.lineWidth = 6; g.beginPath(); g.moveTo(0, -100); g.lineTo(-8, -40); g.lineTo(6, 10); g.lineTo(-6, 60); g.lineTo(0, 100); g.stroke();
    PA.tape(g, 0, -20, 120, 0.5, 'rgba(244,206,120,.85)', 34, 7); PA.tape(g, 0, 50, 110, -0.5, 'rgba(244,206,120,.85)', 34, 8);
    PA.drawDoodle(g, 'star', -80, -20, 0.6, 1, { col: '#E8A62A', w: 5, seed: 3 }); PA.drawDoodle(g, 'moon', 80, -10, 0.5, 1, { col: '#3E7FB8', w: 5, seed: 4 });
    g.restore();
  }
  spread('B1', 105500, 0, 2400, 1450, 'night', 0.006, (g, t) => {
    PA.drawCard(g, PA.card('B1', 2400, 1450, { tex: '#1E2342', torn: 'lr', edge: 0.4 }), 0, 0);
    K.photo(g, 'bg_house_night', -560, -205, 820, 547, -0.02, t, L(116) - 0.4, { mode: 'fade', kb: { z0: 1.0, z1: 1.16, x0: 0.5, x1: 0.62, y0: 0.5, y1: 0.42, d: 7 }, tape: 701 });
    const mins = 570 + Math.max(0, t - (L(117) - 0.3)) * 0.5;
    K.clock(g, 700, -250, 180, mins, { pr: eOut5(P(t, L(117) - 0.4, L(117))), face: '#FBF4E6', num: true });
    K.photo(g, 'bg_doorway', 420, 300, 640, 427, 0.03, t, L(118) - 0.25, { mode: 'drop', fx: 0.4, kb: { z0: 1.0, z1: 1.1, x0: 0.3, x1: 0.35, d: 5 }, tape: 702 });
    brokenBook(g, -170, 470, 0.9, t, Wd(119, 4) - 0.2);
    KT.draw(g, dB116, t); KT.draw(g, dB117, t); KT.draw(g, dB118, t); KT.draw(g, dB119, t);
    // "shh" for the quiet house, then she holds up a candle for the kid in the doorway and sings
    const fq = P(t, L(117) - 0.4, L(117) - 0.02);
    STK.draw(g, fq >= 1 ? 'spr_candle' : 'spr_shh', 985, 735, 700, { t, peel: P(t, L(116) - 0.2, L(116) + 0.3), sway: 0.6, flip: fq > 0 && fq < 1 ? { to: 'spr_candle', p: fq } : undefined });
  }, { img: ['bg_house_night', 'bg_doorway', 'cut/spr_shh', 'cut/spr_candle'] });

  // ================================================================== B2 · "just a minute"
  const dB120 = nd(120, -1080, -605, 1300, 66, { 0: { style: 'marker', col: '#9FC7FF' }, 1: { style: 'marker', col: '#9FC7FF' }, 2: { style: 'marker', col: '#9FC7FF' } });
  const dB121 = nd(121, -1080, -470, 1300, 66, { 'screen': { italic: true, col: '#9FC7FF' } });
  const dB122 = nd(122, -1080, 360, 1000, 66, { 'eight': { style: 'marker', col: '#F4CE72', big: 1.25 } });
  const dB123 = nd(123, -1080, 490, 1000, 66, { 'counting': { style: 'marker', col: '#F4CE72' } });
  const MORE = [['8:00', -980, -230], ['8:15', 120, -500], ['8:30', 520, -150], ['8:45', -60, 230], ['9:00', 760, 120], ['9:15', -560, 230]];
  spread('B2', 108200, -100, 2400, 1450, 0.85, -0.008, (g, t) => {
    PA.drawCard(g, PA.card('B2', 2400, 1450, { tex: '#1A2240', torn: 'tb', edge: 0.4 }), 0, 0);
    K.photo(g, 'bg_doorway', -380, -45, 820, 547, -0.02, t, L(120) - 0.4, { mode: 'fade', fx: 0.68, kb: { z0: 1.05, z1: 1.18, x0: 0.66, x1: 0.7, d: 6 }, tape: 711 });
    g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.25 + 0.08 * noise(t * 5, 2); EP.glowDot(g, -160, -60, 500, 'rgba(140,190,255,.6)', 'rgba(100,150,255,.2)'); g.restore();
    K.bubble(g, 260, -400, 470, 140, -100, -210, t, Wd(120, 0) - 0.1, { text: 'just a minute…', font: EP.font(700, 56, F.hand), typed: 0.04 });
    // he said it at eight, and every quarter hour since
    MORE.forEach(([tm, x, y], k) => {
      const t0 = Wd(122, 3) + k * 0.13; if (t < t0) return;
      K.bubble(g, x, y, 320, 100, x + (k % 2 ? -120 : 120), y + 110, t, t0, { lines: ['just a minute'], font: EP.font(700, 38, F.hand), rot: (hash(k, 3) - 0.5) * 0.15, fill: 'rgba(255,253,246,.92)' });
      EP.txt(g, tm, x + 120, y - 62, { font: EP.font(800, 26, F.ui), color: '#9FC7FF' });
    });
    // the clock winds back to eight
    const back = eIO(P(t, Wd(122, 3), Wd(122, 5) + 0.2)), mins = lerp(575, 480, back) + Math.max(0, t - (Wd(122, 5) + 0.2)) * 0.5;
    K.clock(g, 760, -200, 160, mins, { pr: eOut5(P(t, L(121) - 0.3, L(121) + 0.1)), num: true });
    // the kid's tally marks
    const shown = (t - (Wd(123, 1) - 0.1)) / 0.085;
    if (shown > 0) K.tally(g, 260, 380, 17, shown, { col: '#F4CE72', w: 9, sp: 24, h: 110 });
    KT.draw(g, dB120, t); KT.draw(g, dB121, t); KT.draw(g, dB122, t); KT.draw(g, dB123, t);
    STK.draw(g, 'spr_sit', 990, 730, 540, { t, peel: P(t, L(121) - 0.2, L(121) + 0.3), sway: 0.4 });
  }, { img: ['bg_doorway', 'cut/spr_sit'] });

  // ================================================================== B3 · a thousand tales in half a second
  const dd = (i, x, y, w, px, emph = {}) => ({ i, x, y, w, px, style: 'serif', col: '#2A2440', emph, zh: { px: 26 } });
  const dB124 = dd(124, -1080, -605, 1250, 70, { 'thousand': { style: 'cut', cols: ['#F07A2E', '#2B3990', '#D23A2C', '#2F8F8A', '#E8A62A', '#C2357A', '#F07A2E', '#2B3990'] }, 'tales': { italic: true, col: COL.tangerine } });
  const dB125 = dd(125, -1080, -455, 1250, 70, { 'second': { style: 'marker', col: '#2F8F8A' }, 'flat': { style: 'stamp', col: '#D23A2C', big: 0.9, rot: -0.1 } });
  const dB126 = dd(126, -1080, 360, 1300, 66, { 'dragon': { style: 'marker', col: '#2F8F8A', big: 1.2 }, 'rocket': { style: 'marker', col: '#D23A2C', big: 1.2 } });
  const dB127 = dd(127, -1080, 500, 1300, 66, { 'talking': { italic: true, col: '#C2357A' }, 'cat': { style: 'marker', col: '#C2357A', big: 1.3 } });
  const DRAGON = [
    [[-150, -10], [-120, -40], [-90, -20], [-40, -30], [20, -10], [70, 20], [120, 10], [170, -30], [190, -60]],
    [[-150, -10], [-170, 10], [-140, 24], [-100, 10], [-60, 20], [-10, 30], [40, 40], [90, 40], [130, 30], [170, -30]],
    [[-30, -30], [0, -120], [30, -70], [60, -110], [70, -20]],
    [[-140, -38], [-150, -70]], [[-118, -42], [-118, -76]],
    [[-40, 30], [-46, 70]], [[60, 40], [60, 80]],
    [[-180, 4], [-230, -10], [-260, 10], [-300, -6]],
  ];
  const ROCKET = [[[0, -120], [40, -60], [40, 70], [-40, 70], [-40, -60], [0, -120]], [[-40, 30], [-80, 90], [-40, 70]], [[40, 30], [80, 90], [40, 70]]];
  const CAT = [[[-60, -40], [-50, -100], [-20, -60], [20, -60], [50, -100], [60, -40], [40, 0], [-40, 0], [-60, -40]], [[-40, 0], [-60, 90], [60, 90], [40, 0]], [[60, 70], [110, 40], [100, -10]], [[-80, -30], [-30, -26]], [[-80, -14], [-30, -18]], [[80, -30], [30, -26]], [[80, -14], [30, -18]]];
  const SHAPES = {};
  const shape = (key, strokes, s, seed) => SHAPES[key] || (SHAPES[key] = strokes.map((st, i) => PA.hand(st.map(([x, y]) => [x * s, y * s]), 3, seed + i)));
  function crayon(g, strokes, x, y, pr, col, w = 10) { g.save(); g.translate(x, y); const n = strokes.length; strokes.forEach((st, i) => { const f = clamp(pr * n - i); if (f > 0) PA.ink(g, st, 0, eIO(f), { col, w }); }); g.restore(); }
  spread('B3', 110900, 150, 2400, 1450, 0.25, 0.01, (g, t) => {
    PA.drawCard(g, PA.card('B3', 2400, 1450, { tex: '#F8EFDA', torn: 'lr', edge: 0.22 }), 0, 0);
    // a thousand tiny books burst out of the pencil (#015-style fountain), counted on a stopwatch
    const tipX = 640, tipY = 640;
    for (let k = 0; k < 70; k++) {
      const u = t - (Wd(124, 1) + hash(k, 1) * 1.4); if (u <= 0 || u > 2.2) continue;
      const a = -Math.PI / 2 - 0.15 - hash(k, 2) * 1.25, sp = 1100 + hash(k, 3) * 900, x = tipX + Math.cos(a) * sp * u, y = tipY + Math.sin(a) * sp * u + 900 * u * u;
      if (y > 760) continue;
      g.save(); g.translate(x, y); g.rotate(u * (4 + hash(k, 4) * 6)); g.fillStyle = K.pcol(k); g.fillRect(-26, -34, 52, 68); g.fillStyle = '#FFF6E8'; g.fillRect(-18, -24, 36, 8); g.restore();
    }
    if (t > Wd(124, 1)) {
      const v = EP.countVal(P(t, Wd(124, 1), Wd(124, 6) + 0.3), 0, 1000);
      EP.txt(g, v.toLocaleString('en-US') + ' tales', 420, -190, { font: EP.font(700, 86, F.hand), color: '#2B3990' });
    }
    const swp = eOut5(P(t, L(125) - 0.3, L(125)));
    if (swp > 0) {
      g.save(); g.translate(760, -430); g.scale(swp, swp);
      g.fillStyle = '#5A6075'; g.fillRect(-18, -150, 36, 40); g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(8, 12, 120, 0, 7); g.fill();
      g.fillStyle = '#E8E4DA'; g.beginPath(); g.arc(0, 0, 120, 0, 7); g.fill(); g.strokeStyle = '#2A2440'; g.lineWidth = 10; g.stroke();
      const s = Math.min(0.5, Math.max(0, t - L(125)) * 0.5 / 0.8), a = s / 60 * EP.TAU * 60;
      g.strokeStyle = '#D23A2C'; g.lineWidth = 7; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(a) * 90, -Math.cos(a) * 90); g.stroke();
      EP.txt(g, s.toFixed(2) + ' s', 0, 74, { font: EP.font(900, 34, F.ui), color: '#2A2440' });
      g.restore();
    }
    // the dragon, the rocket, and of course the talking cat, in crayon
    crayon(g, shape('dragon', DRAGON, 1.6, 801), -360, 60, P(t, Wd(126, 2) - 0.1, Wd(126, 2) + 0.8), '#2F8F8A', 11);
    if (t > Wd(126, 2) + 0.5) for (let k = 0; k < 3; k++) { const f = 0.5 + 0.5 * Math.sin(t * 14 + k); g.fillStyle = ['#F07A2E', '#E8A62A', '#D23A2C'][k]; g.beginPath(); g.ellipse(-360 - 1.6 * 260 - k * 40, 60 - 1.6 * 4 + Math.sin(t * 9 + k) * 6, 30 * f + 10, 12, 0, 0, 7); g.fill(); }
    const rk = P(t, Wd(126, 5) - 0.1, Wd(126, 5) + 2.5), rx = lerp(160, 620, eIO(rk)), ry = lerp(150, -330, eIO(rk));
    if (rk > 0) { g.save(); g.translate(rx, ry); g.rotate(0.6); crayon(g, shape('rocket', ROCKET, 1.2, 811), 0, 0, P(t, Wd(126, 5) - 0.1, Wd(126, 5) + 0.5), '#D23A2C', 10); g.fillStyle = '#F4C430'; g.beginPath(); g.moveTo(-30, 90); g.lineTo(0, 140 + Math.sin(t * 30) * 20); g.lineTo(30, 90); g.closePath(); g.fill(); g.restore(); }
    crayon(g, shape('cat', CAT, 1.5, 821), 80, 140, P(t, Wd(127, 4) - 0.2, Wd(127, 5) + 0.3), '#C2357A', 10);
    K.bubble(g, 340, -30, 330, 110, 180, 60, t, Wd(127, 5) + 0.05, { text: 'of course!', font: EP.font(700, 50, F.hand), col: '#C2357A' });
    KT.draw(g, dB124, t); KT.draw(g, dB125, t); KT.draw(g, dB126, t); KT.draw(g, dB127, t);
    STK.draw(g, 'spr_write', 930, 735, 860, { t, peel: P(t, L(124) - 0.2, L(124) + 0.3), sway: 0.9, bob: 8, T: t });
  }, { img: ['cut/spr_write'] });

  // ================================================================== B4 · the perfect tale vs the wrong voices
  const dB128 = dd(128, -1080, -605, 1250, 66, { 'perfect': { italic: true, col: '#B8902A' } });
  const dB129 = dd(129, -1080, -470, 1250, 66, { 'right': { italic: true, col: '#B8902A' } });
  const dB130 = dd(130, -1080, 360, 1300, 64, { 'voices': { style: 'marker', col: '#C2357A', shake: true, big: 1.15 }, 'wrong': { style: 'marker', col: '#C2357A', shake: true, big: 1.2 } });
  const dB131 = dd(131, -1080, 520, 1300, 70, { 'again': { circle: COL.marker, italic: true }, 'tonight': { italic: true, col: '#2B3990' } });
  function perfectPage(g, t) {
    PA.drawCard(g, PA.card('perfect', 520, 640, { tex: 'white', r: 4, blur: 10 }), 0, 0);
    EP.txt(g, 'Chapter One', 0, -230, { font: 'italic ' + EP.font(700, 40, F.serif), color: '#3A3350' });
    g.fillStyle = 'rgba(60,50,80,.45)'; for (let k = 0; k < 13; k++) g.fillRect(-210, -180 + k * 30, k === 12 ? 260 : 420, 8);
    g.save(); g.translate(150, 230); g.rotate(-0.2); g.fillStyle = '#E8B54A'; EP.star(g, 0, 0, 64, 0, 0.62, 12); g.fill(); EP.txt(g, 'PERFECT', 0, 9, { font: EP.font(900, 22, F.ui), color: '#5A3B10' }); g.restore();
  }
  const WRONG = [['RAWR?!', -820, -320, 'italic ' + EP.font(900, 54, F.ui), '#D23A2C'], ['*squeak*', -40, -330, EP.font(700, 52, F.hand), '#2B3990'], ['Ho ho HO', -760, 260, EP.font(400, 50, F.villain), '#2F8F8A']];
  spread('B4', 113600, -100, 2400, 1450, 0.55, -0.006, (g, t) => {
    PA.drawCard(g, PA.card('B4', 2400, 1450, { tex: '#F3E3C8', torn: 'tb', edge: 0.28 }), 0, 0);
    // the perfect page arrives, then gets pushed aside for the real thing
    const pin = eOut5(P(t, L(128) - 0.35, L(128))), pout = eIn(P(t, L(130) - 0.1, L(130) + 0.4));
    if (pin > 0 && pout < 1) { g.save(); g.translate(560 + pout * 1300, -230 + (1 - pin) * 600); g.rotate(0.05 + pout * 0.6); perfectPage(g, t); g.restore(); }
    K.photo(g, 'bg_hug_read', -370, 0, 820, 547, -0.02, t, L(130) - 0.2, { mode: 'drop', kb: { z0: 1.0, z1: 1.1, d: 5 }, tape: 721 });
    WRONG.forEach(([s, x, y, f, c], k) => K.bubble(g, x, y, 330, 120, -370 + (k - 1) * 140, -40, t, Wd(130, 7) - 0.2 + k * 0.22, { text: s, font: f, col: c, rot: (k - 1) * 0.12 }));
    if (t > L(131)) PA.drawDoodle(g, 'moon', 560, -260, 1.2, P(t, L(131), L(131) + 0.5), { col: '#2B3990', w: 8, seed: 731 });
    KT.draw(g, dB128, t); KT.draw(g, dB129, t); KT.draw(g, dB130, t); KT.draw(g, dB131, t);
    STK.draw(g, 'spr_book', 960, 735, 760, { t, peel: P(t, L(128) - 0.2, L(128) + 0.3), sway: 1, bob: 8, T: t });
  }, { img: ['bg_hug_read', 'cut/spr_book'] });

  // ================================================================== B5 · go hold him / I've got the rest
  const LAMPOFF = Wd(137, 3) + 0.42;
  const dB132 = nd(132, -1080, -605, 560, 62, {}, { col: '#3A2418', zhCol: '#6A5A4A' });
  const dB133 = { i: 133, x: -480, y: -625, w: 900, px: 104, style: 'marker', col: COL.marker, zh: { px: 28, col: '#6A5A4A' } };
  const dB134 = dd(134, -1080, 290, 1400, 64, { 'laugh': { style: 'marker', col: '#E8455C', big: 1.2 }, 'chest': { italic: true } });
  const dB135 = dd(135, -1080, 420, 700, 64, { 'book': { style: 'marker', col: '#2B3990', big: 1.15 } });
  const dB136 = dd(136, -300, 420, 900, 64, { 'work': { style: 'marker', col: '#7A7486', big: 1.15 } });
  const dB137 = dd(137, -1080, 545, 1300, 70, { 'rest': { italic: true, col: COL.tangerine, w: 900 } });
  spread('B5', 116300, 150, 2400, 1450, 0.8, 0.008, (g, t) => {
    PA.drawCard(g, PA.card('B5', 2400, 1450, { tex: '#F1DDBE', torn: 'lr', edge: 0.35 }), 0, 0);
    K.photo(g, 'bg_hug_read', -230, -135, 880, 587, 0.015, t, L(133) - 0.4, { mode: 'fade', kb: { z0: 1.04, z1: 1.18, x0: 0.45, x1: 0.5, y0: 0.4, d: 6 }, tape: 741 });
    g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.3; EP.glowDot(g, -400, -300, 600, 'rgba(255,200,120,.7)', 'rgba(255,160,80,.25)'); g.restore();
    // hearts rise as he laughs against his dad's chest
    if (t > Wd(134, 2)) EP.particles(g, t - Wd(134, 2), { x: -230, y: 60, kind: 3, cols: ['#E8455C', '#FF8FA3', '#FFD27A'], s: 1.4, g: -60, vyk: 0.5, spread: 500, n: 26, seed: 51, alpha: 0.9 });
    // you take the book (it slides to him); I'll take the work (the laptop folds shut and leaves with Claude)
    const bk = eIO(P(t, Wd(135, 1), Wd(135, 3) + 0.2));
    if (t > L(135) - 0.3) { g.save(); g.translate(lerp(820, 150, bk), lerp(-420, -60, bk)); g.rotate(lerp(0.3, -0.1, bk)); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-96, -60, 200, 140); g.fillStyle = '#3E7FB8'; g.fillRect(-100, -66, 200, 140); g.fillStyle = '#F4EADB'; g.fillRect(-92, -58, 88, 124); g.fillRect(4, -58, 88, 124); g.restore(); }
    const lt = P(t, Wd(136, 1), Wd(136, 3) + 0.2), leave = eIn(P(t, Wd(137, 0), LAMPOFF - 0.1));
    if (t > L(135)) K.laptop(g, 760 + leave * 800, 120, 300, 1 - eIO(lt), 1 - lt);
    const fp = P(t, Wd(136, 0) - 0.3, Wd(136, 0) + 0.1);
    STK.draw(g, fp >= 1 ? 'spr_carry' : 'spr_whisper', 980 + leave * 900, 735, 680, { t, peel: P(t, L(132) - 0.2, L(132) + 0.3), sway: 0.8, flip: fp > 0 && fp < 1 ? { to: 'spr_carry', p: fp } : undefined });
    KT.draw(g, dB132, t); KT.draw(g, dB133, t); KT.draw(g, dB134, t); KT.draw(g, dB135, t); KT.draw(g, dB136, t); KT.draw(g, dB137, t);
  }, {
    img: ['bg_hug_read', 'cut/spr_whisper', 'cut/spr_carry'], thumbT: 272.4,
  });


  // ================================================================== TL · a hundred years in a window (278.9 – 292.5)
  const T0 = 278.88, T1 = 291.9;
  const yearAt = t => Math.round(lerp(2026, 2126, eIOs(P(t, T0 + 0.3, T1))));
  const WIN = { x: -250, y: -150, w: 1100, h: 820 };
  const SEASON = [['#F7B7C8', '#FFFFFF'], ['#6FA855', '#B9E3B0'], ['#E8862A', '#C8562C'], ['#FFFFFF', '#E8ECF8']];
  function windowView(g, t) {
    const { x, y, w, h } = WIN, u = Math.max(0, t - T0), cyc = u * u * 0.22 + u * 1.2, ph = mod(cyc, 1), day = 0.5 - 0.5 * Math.cos(ph * EP.TAU);
    g.save(); g.beginPath(); g.rect(x - w / 2, y - h / 2, w, h); g.clip();
    const sky = g.createLinearGradient(0, y - h / 2, 0, y + h / 2); sky.addColorStop(0, mixc('#0E1430', '#6EB8EA', day)); sky.addColorStop(1, mixc('#2C3A78', '#FFE0B8', day)); g.fillStyle = sky; g.fillRect(x - w / 2, y - h / 2, w, h);
    // sun and moon streak across (#039 time-lapse arcs)
    const arc = (k, col, r) => { const a = Math.PI * (1 + k), cx = x + Math.cos(a) * w * 0.45, cy = y + h * 0.35 + Math.sin(a) * h * 0.65; g.fillStyle = col; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); };
    if (day > 0.15) arc(mod(ph * 2, 1), 'rgba(255,214,120,' + day + ')', 60); else arc(mod(ph * 2, 1), 'rgba(236,240,255,.9)', 40);
    if (day < 0.5) for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(255,250,235,${(0.5 - day) * 1.6})`; const sx = x - w / 2 + hash(k, 1) * w, sy = y - h / 2 + hash(k, 2) * h * 0.6; g.fillRect(sx, sy, 3, 3 + u * 2); }
    // seasons blowing past
    const season = Math.floor(u / 0.9) % 4, [c1, c2] = SEASON[season];
    for (let k = 0; k < 46; k++) { const life = mod(u * (0.9 + hash(k, 3)) + hash(k, 4), 1), px = x - w / 2 + mod(hash(k, 5) * w + life * 240, w), py = y - h / 2 + life * h; g.fillStyle = k % 2 ? c1 : c2; g.save(); g.translate(px, py); g.rotate(life * 9 + k); g.beginPath(); g.ellipse(0, 0, 12, 6, 0, 0, 7); g.fill(); g.restore(); }
    // the hill outside slowly changes colour with the seasons
    g.fillStyle = mixc(['#9AC27A', '#5E9A4A', '#B8863A', '#E8ECF2'][season], '#1A2030', 1 - day); g.beginPath(); g.moveTo(x - w / 2, y + h * 0.3); g.quadraticCurveTo(x, y + h * 0.1, x + w / 2, y + h * 0.28); g.lineTo(x + w / 2, y + h / 2); g.lineTo(x - w / 2, y + h / 2); g.closePath(); g.fill();
    g.restore();
    // the frame and its cross
    g.strokeStyle = '#8A5A3A'; g.lineWidth = 40; g.strokeRect(x - w / 2, y - h / 2, w, h); g.lineWidth = 22; g.beginPath(); g.moveTo(x, y - h / 2); g.lineTo(x, y + h / 2); g.moveTo(x - w / 2, y); g.lineTo(x + w / 2, y); g.stroke();
    g.fillStyle = '#A8744A'; g.fillRect(x - w / 2 - 60, y + h / 2 + 10, w + 120, 46);
    return day;
  }
  function calendar(g, t) {
    const yr = yearAt(t);
    g.save(); g.translate(-1010, -260); g.rotate(-0.04);
    PA.drawCard(g, PA.card('tlcal', 300, 360, { tex: 'white', r: 6, blur: 10, header: { col: '#D23A2C', h: 90 } }), 0, 0);
    EP.txt(g, 'YEAR', 0, -118, { font: EP.font(900, 46, F.ui), color: '#FFFFFF', ls: '6px' });
    EP.digits(g, String(yr), 0, 60, EP.font(900, 96, F.serif), '#2A2440');
    g.fillStyle = '#8A8070'; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(-100 + k * 66, -183, 12, 0, 7); g.fill(); }
    g.restore();
    // torn-off pages flutter away
    for (let k = 0; k < 40; k++) { const t0 = T0 + 0.2 + k * 0.3, u = t - t0; if (u <= 0 || u > 1.6) continue; g.save(); g.translate(-1010 + u * (300 + hash(k, 1) * 500), -260 - u * 200 + u * u * 500); g.rotate(u * (4 + hash(k, 2) * 4)); g.scale(0.6, 0.6); g.fillStyle = '#FBF6EA'; g.fillRect(-150, -120, 300, 240); g.fillStyle = '#D23A2C'; g.fillRect(-150, -120, 300, 40); g.restore(); }
  }
  const AGES = [[T0, 'bg_hero_close', 0.4, 0.38], [287.0, 'bg_daughter', 0.4, 0.35], [289.6, 'bg_110', 0.32, 0.4]];
  spread('TL', 119000, 0, 2600, 1500, t => (t < T0 ? 1 : 0.4), 0, (g, t) => {
    PA.drawCard(g, PA.card('TL', 2600, 1500, { tex: '#E9DCC4', r: 8, edge: 0.3 }), 0, 0);
    g.save(); g.globalAlpha = 0.08; g.strokeStyle = '#8A5A3A'; g.lineWidth = 3; for (let x = -1300; x < 1300; x += 70) { g.beginPath(); g.moveTo(x, -750); g.lineTo(x, 750); g.stroke(); } g.restore();
    const day = windowView(g, t);
    g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.45 * (1 - day); g.fillStyle = '#2A2A50'; g.fillRect(-1300, -750, 2600, 1500); g.restore();
    calendar(g, t);
    // the hero's photograph on the wall, getting older (and browner) as the years pass
    let k = 0; while (k + 1 < AGES.length && t >= AGES[k + 1][0]) k++;
    const sep = clamp((t - T0) / (T1 - T0)) * 0.55, A = K.photoCanvas(AGES[k][1], 380, 300, { fx: AGES[k][2], fy: AGES[k][3] });
    const fp = k + 1 < AGES.length ? P(t, AGES[k + 1][0] - 0.4, AGES[k + 1][0]) : 0;
    g.save(); g.translate(930, 120); g.rotate(0.04);
    if (fp > 0 && fp < 1) { const B = K.photoCanvas(AGES[k + 1][1], 380, 300, { fx: AGES[k + 1][2], fy: AGES[k + 1][3] }); PA.flipDraw(g, A.c, B.c, fp, 0, 0, A.w, A.h, { slices: 20, liftK: 1.5 }); }
    else { g.drawImage(A.c, -A.w / 2, -A.h / 2); g.save(); g.globalCompositeOperation = 'color'; g.globalAlpha = sep; g.fillStyle = '#A0784C'; g.fillRect(-190, -150, 380, 300); g.restore(); }
    PA.pin(g, 0, -170, '#D23A2C');
    g.restore();
    if (t > T1 - 0.4) PA.stamp(g, 'HAPPY 110th', 930, 360, t - (T1 - 0.4), { px: 54, col: '#D23A2C', rot: -0.1 });
    // a vine grows across the wall the whole time
    const vine = PA.hand([[-1250, 600], [-900, 520], [-600, 600], [-300, 520], [0, 600], [300, 520], [700, 600], [1250, 520]], 6, 751);
    PA.ink(g, vine, 0, P(t, T0, T1), { col: '#5E8A3A', w: 10 });
    for (let j = 0; j < 14; j++) { const f = j / 14; if (P(t, T0, T1) > f) { const pp = EP.pop(t - (T0 + f * (T1 - T0))); g.save(); g.translate(-1250 + f * 2500, 560 + Math.sin(j * 1.7) * 40); g.scale(pp.sc, pp.sc); if (j % 3 === 0) EP.drawDaisy(g, 0, -20, 26, { petal: '#FFFFFF', center: '#F4CE72' }); else { g.fillStyle = '#6FA855'; g.beginPath(); g.ellipse(0, -14, 20, 9, 0.6, 0, 7); g.fill(); } g.restore(); } }
    STK.draw(g, 'spr_sit', 120, 300, 560, { t, sway: 0.5 });
  }, { img: ['bg_hero_close', 'bg_daughter', 'bg_110', 'cut/spr_sit'] });

  EP.overlays = EP.overlays || [];
  EP.overlays.push((g, t) => {   // the lamp clicks off; three seconds of dark with only the moon in the window, then the drop
      if (t >= T0 && t < T0 + 0.5) { g.fillStyle = `rgba(255,248,230,${0.85 * (1 - (t - T0) / 0.5)})`; g.fillRect(0, 0, W, H); return; }
      if (t < LAMPOFF || t >= T0) return;
      const a = t < LAMPOFF + 0.05 ? 0.9 : 0.97;
      g.fillStyle = `rgba(4,4,8,${a})`; g.fillRect(0, 0, W, H);
      const mo = P(t, LAMPOFF + 0.6, LAMPOFF + 1.6) * (1 - P(t, 278.5, 278.85));
      if (mo > 0) { g.save(); g.globalAlpha = mo; g.globalCompositeOperation = 'screen'; EP.glowDot(g, 1500, 260, 220, 'rgba(200,215,255,.5)', 'rgba(140,160,230,.15)'); g.globalCompositeOperation = 'source-over'; g.fillStyle = '#E8ECF8'; g.beginPath(); g.arc(1500, 260, 46, 0, 7); g.fill(); g.fillStyle = '#04040A'; g.beginPath(); g.arc(1522, 248, 42, 0, 7); g.fill(); g.restore(); }
  });  // ================================================================== camera, impacts, light
  WD.keys.push(
    { t: 239.55, s: 'B1', dx: 0, dy: -32, z: 0.79, d: 0.7, drift: { z: 0.008 } },
    { t: 246.8, s: 'B2', dx: 0, dy: -32, z: 0.79, d: 0.55, drift: { z: 0.008 } },
    { t: 253.85, s: 'B3', dx: 0, dy: -32, z: 0.79, d: 0.5, drift: { z: 0.01 } },
    { t: 260.98, s: 'B4', dx: 0, dy: -32, z: 0.79, d: 0.5, drift: { z: 0.01 } },
    { t: 267.6, s: 'B5', dx: 0, dy: -32, z: 0.79, d: 0.5, drift: { z: 0.012 } },
    { t: 277.6, s: 'TL', dx: 0, dy: -20, z: 0.95, d: 1.0 },
    { t: T0, s: 'TL', dx: 0, dy: -20, z: 0.74, d: 1.4, e: 'out', drift: { z: 0.012 } },
  );
  WD.punches.push([T0, 292.4, 0.02]);
  WD.shakes.push([Wd(125, 4) + 0.1, 0.3], [T0 + 0.02, 0.6], [T1 - 0.3, 0.3]);
  WD.blooms.push([239.6, 247.0, 0.18, 0.6, 0.5], [267.6, 275.3, 0.22, 0.6, 0.3]);
  WD.grades.push([239.5, 275.3, { col: '#3A4A8A', op: 'soft-light', a: 0.14 }, 1.0, 0.5]);
})();
