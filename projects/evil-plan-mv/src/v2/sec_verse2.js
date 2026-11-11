// v2/sec_verse2.js — verse 2 and pre-chorus 2 (84.8 – 119.1 s). PHASE TWO and the greedy grin; the planner again,
// where the CURE note jumps from SOMEDAY to TUESDAY; the mother's portrait and the ink-blot illness dragged into the
// ground until a daisy grows there; the kid on the fourth floor (elevator dial, the photo flipping from 9 to 80);
// the mother's "I'm fine" rehearsal torn off for the day it's true; "I already ate" turning into a feast; then the
// office stacks Claude carries away, the work you choose, and the time card torn in half.
'use strict';
(function () {
  const { W, H, clamp, lerp, P, eIO, eIOs, eOut, eOut5, eIn, backOut, spring, smooth, hash, noise, mod } = EP;
  const PA = EP.PA, STK = EP.STK, KT = EP.KT, WD = EP.WD, K = EP.K, F = EP.F, COL = PA.COL;
  const L = EP.L, Wd = EP.Wd;
  const spread = (id, x, y, w, h, mood, rot, draw, extra = {}) => WD.spreads.push(Object.assign({ id, x, y, w, h, mood, rot, draw }, extra));
  const hit = (lu, k = 1) => lu > 0 && lu < 0.3 ? 1 - 0.06 * k * Math.sin(Math.PI * lu / 0.3) : 1;
  function handText(g, text, x, y, t0, t, o = {}) {
    const px = o.px || 48, f = EP.font(700, px, F.hand), dur = o.dur ?? Math.max(0.3, text.length * 0.035), pr = eOut(P(t, t0, t0 + dur));
    if (pr <= 0) return 0;
    g.save(); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.font = f;
    const tw = g.measureText(text).width, x0 = o.align === 'c' ? -tw / 2 : 0;
    g.beginPath(); g.rect(x0 - 6, -px * 1.2, (tw + 12) * pr, px * 1.8); g.clip();
    EP.txt(g, text, x0, 0, { font: f, color: o.col || COL.ink, align: 'left' }); g.restore();
    return tw;
  }

  // ================================================================== V2a · PHASE TWO (divider)
  const dV38 = { i: 38, x: -940, y: -360, w: 1500, px: 120, style: 'label', tape: '#F4EADB', ink: '#1E1B26', emph: { 1: { style: 'stamp', col: '#E0332A', big: 1.5, rot: -0.1, comp: 'source-over' } }, zh: { px: 34, col: '#C9C3D8', dy: 230 } };
  const dV39 = { i: 39, x: -940, y: 120, w: 1300, px: 110, style: 'serif', col: '#F4EADB', emph: { 'greedy': { style: 'cut', big: 1.25, cols: ['#F4CE72', '#E8B54A', '#F4CE72', '#E8B54A', '#F4CE72', '#E8B54A', '#F4CE72'] } }, zh: { px: 34, col: '#C9C3D8' } };
  spread('V2a', 37450, 150, 2200, 1350, 'night', -0.01, (g, t) => {
    PA.drawCard(g, PA.card('V2a', 2200, 1350, { tex: 'black', r: 10, edge: 0.4 }), 0, 0);
    // the divider tab
    g.fillStyle = '#E0332A'; g.beginPath(); g.roundRect(1060, -560, 140, 300, [0, 18, 18, 0]); g.fill();
    g.save(); g.translate(1130, -410); g.rotate(Math.PI / 2); EP.txt(g, 'PHASE 2', 0, 14, { font: EP.font(900, 44, F.ui), color: '#FFF6E8', ls: '4px' }); g.restore();
    KT.draw(g, dV38, t); KT.draw(g, dV39, t);
    const gb = KT.box(g, dV39, 2);
    if (gb && t > Wd(39, 2)) EP.lightSweep(g, t - Wd(39, 2) - 0.1 + 0.45, { x: gb.x, y: gb.y - gb.px * 1.2, w: gb.w + 120, h: gb.px * 1.3 }, k2 => { k2.beginPath(); k2.rect(gb.x - 20, gb.y - gb.px * 1.4, gb.w + 200, gb.px * 1.7); }, EP.SC * 1.2);
    // coins clink out on the beats
    for (let k = 0; k < 7; k++) { const u = t - (Wd(39, 2) + k * 0.06); if (u <= 0) continue; const x = 300 + k * 90 + u * (k - 3) * 260, y = 200 - u * 900 + 1700 * u * u; if (y > 800) continue; g.save(); g.translate(x, y); g.scale(Math.cos(u * 14 + k), 1); g.fillStyle = '#E8B54A'; g.beginPath(); g.arc(0, 0, 34, 0, 7); g.fill(); g.fillStyle = '#F7D774'; g.beginPath(); g.arc(-6, -6, 24, 0, 7); g.fill(); g.restore(); }
    STK.draw(g, 'spr_greedy', 680, 690, 1050, { t, peel: P(t, L(39) - 0.25, L(39) + 0.15), sway: 0.8, bob: 10, T: t });
  }, { img: ['cut/spr_greedy'] });

  // ================================================================== V2b · someday → Tuesday (the planner again)
  const COLS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN', 'SOMEDAY'];
  const cx = i => -1050 + i * 270 + 120;
  const dV40 = { i: 40, x: -1080, y: -610, w: 2000, px: 64, style: 'serif', col: COL.ink, emph: { 3: { style: 'marker', col: '#7A7486' }, 4: { style: 'marker', col: '#7A7486' }, 'cure': { col: COL.tangerine, italic: true, w: 900 } }, zh: { px: 28 } };
  const dV41 = { i: 41, x: -1080, y: -455, w: 2000, px: 64, style: 'serif', col: COL.ink, emph: { 'tuesday': { style: 'marker', col: COL.marker, big: 1.3, under: true } }, zh: { px: 28 } };
  const MOVE = Wd(41, 1) - 0.05;
  spread('V2b', 40100, -100, 2400, 1450, 'day', 0.01, (g, t) => {
    PA.drawCard(g, PA.card('V2b', 2400, 1450, { tex: 'grid', torn: 'l' }), 0, 0);
    COLS.forEach((c, i) => {
      const x = cx(i), lit = i === 1 ? eOut(P(t, MOVE + 0.5, MOVE + 0.9)) : 0;
      g.fillStyle = i === 7 ? 'rgba(120,110,100,.12)' : `rgba(240,122,46,${0.12 * lit})`; g.fillRect(x - 125, -300, 250, 980);
      EP.txt(g, c, x, -260, { font: EP.font(900, i === 7 ? 30 : 36, F.ui), color: i === 1 && lit > 0.5 ? COL.tangerine : '#6A6070', ls: '3px' });
    });
    // last week's errands, already sitting there
    [[0, 'meetings', '#A9D3F5'], [2, 'forms', '#FFE37A'], [3, 'groceries', '#B9E3B0'], [4, 'dentist', '#F7B7C8']].forEach(([col, s, c], k) => { g.save(); g.translate(cx(col), -60 + (k % 2) * 40); g.rotate((hash(k, 4) - 0.5) * 0.12); PA.sticky(g, 0, 0, 200, c, 0, 0); g.font = EP.font(700, 40, F.hand); EP.txt(g, s, 0, 12, { font: EP.font(700, 40, F.hand), color: COL.ink }); g.restore(); });
    // a cobweb in the SOMEDAY corner, and the CURE note gathering dust there
    g.save(); g.translate(cx(7) + 125, -300); g.strokeStyle = 'rgba(90,90,100,.45)'; g.lineWidth = 2;
    for (let k = 0; k < 5; k++) { const a = Math.PI / 2 + k / 4 * Math.PI / 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 170, Math.sin(a) * 170); g.stroke(); }
    for (let r = 40; r <= 160; r += 40) { g.beginPath(); for (let k = 0; k <= 4; k++) { const a = Math.PI / 2 + k / 4 * Math.PI / 2; k ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r); } g.stroke(); }
    g.restore();
    const tt = t - MOVE, v = tt <= 0 ? 0 : 1 - Math.exp(-4.6 * tt) * Math.cos(10.5 * tt);   // #010 overshoot
    const x = lerp(cx(7), cx(1), v), y = lerp(80, 300, v) - Math.sin(Math.PI * clamp(tt / 0.6)) * 200 * (tt < 0.6 ? 1 : 0);
    g.save(); g.translate(x, y); g.rotate(lerp(0.12, -0.03, clamp(v)) + (tt > 0 && tt < 0.6 ? Math.sin(tt * 20) * 0.08 : 0)); g.scale(1.15, 1.15);
    PA.sticky(g, 0, 0, 230, '#F7B7C8', 0, tt > 0 && tt < 0.7 ? 0.8 : 0);
    EP.txt(g, 'CURE', 0, 14, { font: EP.font(700, 64, F.hand), color: COL.marker });
    if (tt < 0) { g.globalAlpha = 0.35; g.fillStyle = '#9A9080'; for (let k = 0; k < 40; k++) g.fillRect((hash(k, 1) - 0.5) * 220, (hash(k, 2) - 0.5) * 220, 3, 3); }
    g.restore();
    if (tt > 0.75) { const loop = PA.loop(cx(1), 300, 170, 170, 9); PA.ink(g, loop, 0, eIO(P(tt, 0.75, 1.25)), { col: COL.marker, w: 8 }); }
    KT.draw(g, dV40, t); KT.draw(g, dV41, t);
    STK.draw(g, 'spr_lab', -960, 728, 640, { t, peel: P(t, L(40) + 1.6, L(40) + 2.1), sway: 0.9, bob: 8, T: t });
  }, { img: ['cut/spr_lab'] });

  // ================================================================== V2c · the thing that took your mother
  const dV42 = { i: 42, x: -330, y: -612, w: 1400, px: 68, style: 'serif', col: '#EDE6F2', emph: { 'mother': { italic: true, col: '#F4CE72' } }, zhCol: '#B8B0C8', zh: { px: 28 }, dim: L(44) };
  const dV43 = { i: 43, x: -330, y: -440, w: 1400, px: 68, style: 'serif', col: '#EDE6F2', emph: { 'slow': { style: 'marker', col: '#F4C430' }, 'down': { style: 'marker', col: '#F4C430' } }, zhCol: '#B8B0C8', zh: { px: 28 }, dim: L(44) };
  const dV44 = { i: 44, x: -330, y: -268, w: 1400, px: 68, style: 'serif', col: '#EDE6F2', emph: { 'her': { italic: true, col: '#F4CE72' } }, zhCol: '#B8B0C8', zh: { px: 28 } };
  const dV45 = { i: 45, x: -330, y: -96, w: 1400, px: 74, style: 'serif', col: '#EDE6F2', emph: { 'ground': { style: 'cut', big: 1.3, cols: ['#8A5A3A', '#6E4A2E', '#8A5A3A', '#6E4A2E', '#8A5A3A', '#6E4A2E'] } }, zhCol: '#B8B0C8', zh: { px: 28 } };
  function blot(g, x, y, r, t, seed) {
    g.save(); g.translate(x, y);
    g.strokeStyle = '#141119'; g.lineCap = 'round';
    for (let k = 0; k < 8; k++) { const a = k / 8 * EP.TAU + seed, Ln = r * (0.6 + 0.5 * hash(k, seed)), wig = noise(t * 2.2 + k * 1.3, seed + k) * 0.7; g.lineWidth = r * (0.13 - (k % 3) * 0.03); g.beginPath(); g.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.7); g.quadraticCurveTo(Math.cos(a + wig) * (r + Ln * 0.6), Math.sin(a + wig) * (r + Ln * 0.6), Math.cos(a + wig * 1.6) * (r + Ln), Math.sin(a + wig * 1.6) * (r + Ln)); g.stroke(); g.fillStyle = '#141119'; g.beginPath(); g.arc(Math.cos(a + wig * 1.6) * (r + Ln), Math.sin(a + wig * 1.6) * (r + Ln), r * 0.06, 0, 7); g.fill(); }
    const N = 44; g.beginPath();
    for (let i = 0; i <= N; i++) { const a = i / N * EP.TAU, k = 1 + 0.17 * noise(a * 2.2 + t * 1.7, seed) + 0.09 * Math.sin(a * 5 + t * 3 + seed); const px = Math.cos(a) * r * k, py = Math.sin(a) * r * k * 0.85; i ? g.lineTo(px, py) : g.moveTo(px, py); }
    g.closePath(); g.fillStyle = '#141119'; g.fill();
    g.globalCompositeOperation = 'screen'; g.fillStyle = 'rgba(130,100,180,.2)'; g.beginPath(); g.ellipse(-r * 0.32, -r * 0.3, r * 0.34, r * 0.18, -0.5, 0, 7); g.fill();
    g.restore();
  }
  function slowSign(g, x, y, s, rot, xpr) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    g.strokeStyle = '#5A5A62'; g.lineWidth = 16; g.beginPath(); g.moveTo(0, 60); g.lineTo(0, 330); g.stroke();
    g.fillStyle = 'rgba(0,0,0,.35)'; g.save(); g.translate(8, 10); g.rotate(Math.PI / 4); g.fillRect(-100, -100, 200, 200); g.restore();
    g.save(); g.rotate(Math.PI / 4); g.fillStyle = '#F4C430'; g.fillRect(-100, -100, 200, 200); g.strokeStyle = '#1E1B26'; g.lineWidth = 10; g.strokeRect(-86, -86, 172, 172); g.restore();
    EP.txt(g, 'SLOW', 0, 20, { font: EP.font(900, 58, F.ui), color: '#1E1B26', ls: '2px' });
    if (xpr > 0) { PA.ink(g, PA.hand([[-120, -120], [120, 120]], 4, 41), 0, eIO(clamp(xpr * 2)), { col: '#E0332A', w: 18 }); PA.ink(g, PA.hand([[120, -120], [-120, 120]], 4, 42), 0, eIO(clamp(xpr * 2 - 1)), { col: '#E0332A', w: 18 }); }
    g.restore();
  }
  const SOIL = 440;
  spread('V2c', 42800, 200, 2300, 1400, 'night', -0.008, (g, t) => {
    PA.drawCard(g, PA.card('V2c', 2300, 1400, { tex: '#24212E', torn: 'tb', edge: 0.4 }), 0, 0);
    // the portrait: an old sepia photograph with photo corners, a pressed daisy beside it
    const pc = K.photoCanvas('bg_mother_photo', 430, 600, { fy: 0.4 }), pp = eOut5(P(t, L(42) - 0.3, L(42) + 0.3));
    if (pp > 0) {
      g.save(); g.translate(-760, lerp(300, -90, pp)); g.rotate(-0.045 + (1 - pp) * 0.2); g.globalAlpha *= pp;
      g.drawImage(pc.c, -pc.w / 2, -pc.h / 2);
      g.fillStyle = '#1A1720'; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => { g.beginPath(); g.moveTo(sx * 231, sy * 316); g.lineTo(sx * 231 - sx * 64, sy * 316); g.lineTo(sx * 231, sy * 316 - sy * 64); g.closePath(); g.fill(); });
      g.restore();
      PA.drawDoodle(g, 'daisy', -470, 330, 0.9, P(t, L(42) + 0.4, L(42) + 1.2), { col: '#E9E2F2', w: 5, seed: 121 });
    }
    // the illness: an ink blot that creeps in, then is dragged into the ground
    const bIn = eOut(P(t, L(43) - 0.2, L(43) + 0.6)), drag = eIn(P(t, Wd(44, 1), Wd(45, 3)));
    const bx = lerp(1250, 520, bIn) - drag * 40, by = lerp(240, 330, bIn) + drag * 560 + Math.sin(t * 2) * 10 * (1 - drag);
    if (bIn > 0 && drag < 1) { g.save(); g.beginPath(); g.rect(-1150, -700, 2300, 700 + SOIL + 8); g.clip(); blot(g, bx, by, 170, t, 5); g.restore(); }
    // SLOW — crossed out on "down", knocked over when the blot is dragged
    const sIn = eOut5(P(t, Wd(43, 3) - 0.3, Wd(43, 3))), fall = eIn(P(t, Wd(44, 1), Wd(44, 1) + 0.5));
    if (sIn > 0) slowSign(g, 120 + fall * 120, lerp(800, 120, sIn) + fall * 260, 0.95, fall * 1.4, P(t, Wd(43, 5) - 0.05, Wd(43, 5) + 0.4));
    // the ground: torn soil strips, the second one closes over it
    const s1 = eOut5(P(t, L(44) - 0.2, L(44) + 0.3)), s2 = eOut5(P(t, Wd(45, 3) - 0.05, Wd(45, 4)));
    if (s1 > 0) PA.drawCard(g, PA.card('soil1', 2320, 300, { tex: '#5A3A24', torn: 't', sa: 0.6 }), lerp(-2600, 0, s1), SOIL + 150, 0);
    if (s2 > 0) PA.drawCard(g, PA.card('soil2', 1500, 220, { tex: '#6E4A2E', torn: 't', sa: 0.55 }), lerp(2600, 420, s2), SOIL + 110, 0.01);
    // and a daisy grows where it was buried
    const sp = P(t, Wd(45, 4) + 0.02, Wd(45, 4) + 0.42);
    if (sp > 0) {
      PA.ink(g, PA.hand([[520, SOIL + 20], [510, SOIL - 60], [530, SOIL - 150]], 3, 131), 0, eIO(sp), { col: '#6FA855', w: 12 });
      const fp = EP.pop(t - (Wd(45, 4) + 0.3)); if (fp.sc > 0.01) { g.save(); g.translate(530, SOIL - 160); g.scale(fp.sc, fp.sc); g.rotate(fp.rot); EP.drawDaisy(g, 0, 0, 62, { petal: '#FFFFFF', center: '#F4CE72', line: 'rgba(0,0,0,.2)', lw: 2 }); g.restore(); }
      const lf = eOut(P(sp, 0.4, 1)); if (lf > 0) { g.fillStyle = '#6FA855'; g.save(); g.translate(512, SOIL - 70); g.rotate(-0.7); g.scale(lf, lf); g.beginPath(); g.ellipse(-28, 0, 32, 12, 0, 0, 7); g.fill(); g.restore(); }
    }
    KT.draw(g, dV42, t); KT.draw(g, dV43, t); KT.draw(g, dV44, t); KT.draw(g, dV45, t);
    STK.draw(g, 'spr_lab', 960, 720, 820, { t, peel: P(t, L(43) - 0.1, L(43) + 0.35), sway: 0.8, flip: { to: 'spr_stamp', p: P(t, Wd(44, 0) - 0.1, Wd(44, 0) + 0.3) } });
  }, { img: ['bg_mother_photo', 'cut/spr_lab', 'cut/spr_stamp'] });

  // ================================================================== V2d · the kid on the fourth floor
  const dV46 = { i: 46, x: -1080, y: -610, w: 1500, px: 70, style: 'serif', col: '#1E2A4A', emph: { 'fourth': { style: 'marker', col: '#2F6FA8' }, 'floor': { style: 'marker', col: '#2F6FA8' } }, zh: { px: 28 } };
  const dV47 = { i: 47, x: -1080, y: -455, w: 1500, px: 84, style: 'serif', col: '#1E2A4A', emph: { 'eighty': { style: 'cut', big: 1.15, cols: ['#F07A2E', '#2B3990', '#2F8F8A', '#E8A62A', '#D23A2C', '#C2357A', '#F07A2E'] }, 3: { col: '#8A90A0' }, 4: { col: '#8A90A0' }, 5: { col: '#8A90A0' } }, zh: { px: 28 } };
  function dial(g, x, y, r, v, t) {
    g.save(); g.translate(x, y);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.arc(8, 10, r * 1.15, Math.PI, 0); g.closePath(); g.fill();
    const gr = g.createLinearGradient(-r, -r, r, 0); gr.addColorStop(0, '#E8C878'); gr.addColorStop(1, '#B08A3A'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r * 1.15, Math.PI, 0); g.closePath(); g.fill();
    g.fillStyle = '#2A2440'; g.beginPath(); g.arc(0, 0, r, Math.PI, 0); g.closePath(); g.fill();
    for (let n = 1; n <= 5; n++) { const a = Math.PI + (n - 1) / 4 * Math.PI, on = n === 4 && v >= 3.98; if (on) { g.save(); g.globalCompositeOperation = 'screen'; EP.glowDot(g, Math.cos(a) * r * 0.74, Math.sin(a) * r * 0.74 + 4, 60, 'rgba(255,190,90,1)', 'rgba(255,150,50,.4)'); g.restore(); } EP.txt(g, String(n), Math.cos(a) * r * 0.74, Math.sin(a) * r * 0.74 + 14, { font: EP.font(900, r * 0.24, F.ui), color: on ? '#FFE3A0' : '#B8B2C8' }); }
    const a = Math.PI + (v - 1) / 4 * Math.PI; g.strokeStyle = '#F07A2E'; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55); g.stroke();
    g.fillStyle = '#E8C878'; g.beginPath(); g.arc(0, 0, 12, 0, 7); g.fill();
    g.restore();
  }
  const FLIP80 = Wd(47, 2) - 0.12;
  spread('V2d', 45500, -150, 2400, 1450, 0.12, 0.012, (g, t) => {
    PA.drawCard(g, PA.card('V2d', 2400, 1450, { tex: '#DCE8F0', torn: 'lr', edge: 0.22 }), 0, 0);
    // the elevator going up to the fourth floor (#007 count curve)
    const fl = 1 + 3 * (1 - Math.pow(1 - P(t, Wd(46, 0), Wd(46, 6)), 4));
    if (t > L(46) - 0.4) dial(g, 790, -430, 130, fl, t);
    EP.txt(g, 'floor', 790, -365, { font: EP.font(700, 40, F.hand), color: '#5A6075' });
    // the kid's photo, flipped forward seventy-one years
    const A = K.photoCanvas('bg_kid_bed', 860, 573, { fx: 0.42 }), B = K.photoCanvas('bg_old_man', 860, 573, { fx: 0.5 });
    const dp = eOut5(P(t, Wd(46, 3) - 0.1, Wd(46, 3) + 0.4));
    if (dp > 0) { g.save(); g.translate(0, (1 - dp) * 900); g.rotate((1 - dp) * 0.3); K.photoFlip(g, A, B, P(t, FLIP80, FLIP80 + 0.55), -330, 110, -0.025); g.restore(); if (dp >= 1) { PA.tape(g, -330 - 380, 110 - 330, 150, -0.6, undefined, 40, 61); PA.tape(g, -330 + 380, 110 - 330, 150, 0.6, undefined, 40, 62); } }
    // the age, counting up with it
    if (t > Wd(46, 3) + 0.2) {
      const age = t < FLIP80 ? 9 : EP.countVal(P(t, FLIP80, FLIP80 + 0.6), 9, 80), land = t - (FLIP80 + 0.6);
      EP.txt(g, 'age', 650, -230, { font: EP.font(700, 50, F.hand), color: '#5A6075' });
      g.save(); g.translate(790, -60); g.scale(EP.landPop(land), EP.landPop(land)); EP.digits(g, String(age), 0, 0, EP.font(700, 230, F.hand), t > FLIP80 ? COL.tangerine : '#2B3990'); g.restore();
      if (land > 0) PA.drawDoodle(g, 'check', 960, -170, 1.0, P(land, 0, 0.3), { col: '#2E8B57', w: 9, seed: 141 });
    }
    KT.draw(g, dV46, t); KT.draw(g, dV47, t);
    STK.draw(g, 'spr_point', 880, 725, 760, { t, peel: P(t, L(46) - 0.1, L(46) + 0.4), sway: 1 });
  }, { img: ['bg_kid_bed', 'bg_old_man', 'cut/spr_point'] });

  // ================================================================== V2e · the rehearsal ("I'm fine")
  const dV48 = { i: 48, x: -1080, y: 300, w: 1300, px: 72, style: 'serif', col: '#2A2440', emph: { 'rehearsing': { italic: true, col: '#6A5A9A' } }, zh: { px: 28 } };
  const dV49 = { i: 49, x: -1080, y: 440, w: 1300, px: 72, style: 'serif', col: '#2A2440', emph: { 'fine': { style: 'marker', col: COL.marker, big: 1.3, circle: true } }, zh: { px: 28 } };
  const TEAR = Wd(49, 6) - 0.02;
  function notepad(g, t) {
    PA.drawCard(g, PA.card('npad', 520, 620, { tex: 'white', lines: 64, margin: 70, r: 6, blur: 12 }), 0, 0);
    ['I\'m fine.', 'I\'m fine!', 'we\'re fine :)'].forEach((s, k) => {
      const t0 = 102.35 + k * 0.62, w = handText(g, s, -200, -150 + k * 150, t0, t, { px: 64, col: '#4A4458', rot: -0.02 });
      if (w) PA.ink(g, PA.hand([[-210, -170 + k * 150], [-200 + w + 10, -175 + k * 150]], 3, 150 + k), 0, eIO(P(t, t0 + 0.42, t0 + 0.62)), { col: COL.marker, w: 7 });
    });
    g.fillStyle = '#9A98A8'; for (let k = 0; k < 9; k++) { g.beginPath(); g.arc(-230 + k * 57, -310, 14, 0, 7); g.fill(); }
  }
  spread('V2e', 48200, 150, 2400, 1450, 0.5, -0.01, (g, t) => {
    PA.drawCard(g, PA.card('V2e', 2400, 1450, { tex: '#E4E0EC', torn: 'tb', edge: 0.25 }), 0, 0);
    K.photo(g, 'bg_mirror', -470, -170, 860, 573, -0.02, t, L(48) - 0.2, { mode: 'drop', kb: { z0: 1.0, z1: 1.08, x0: 0.45, x1: 0.5, d: 5 }, tape: 71 });
    // under the notepad: the day it's true
    K.photo(g, 'bg_mom_relief', 640, -60, 520, 400, 0.04, t, TEAR, { frame: 'polaroid', mode: 'develop', caption: 'fine. really.', capPx: 44, tape: false, devDur: 1.0 });
    const tp = P(t, TEAR, TEAR + 0.5);
    if (tp < 1) { g.save(); g.translate(640 + eIn(tp) * 900, -60 - eIn(tp) * 700 + Math.sin(Math.PI * tp) * -80); g.rotate(0.03 + eIn(tp) * 1.2); notepad(g, t); g.restore(); }
    KT.draw(g, dV48, t); KT.draw(g, dV49, t);
    STK.draw(g, 'spr_whisper', 1000, 730, 680, { t, peel: P(t, L(48) + 0.2, L(48) + 0.65), sway: 0.8, flip: { to: 'spr_okay', p: P(t, TEAR + 0.2, TEAR + 0.6) } });
  }, { img: ['bg_mirror', 'bg_mom_relief', 'cut/spr_whisper', 'cut/spr_okay'] });

  // ================================================================== V2f · "I already ate" → the feast
  const dV50 = { i: 50, x: -1080, y: 320, w: 1150, px: 62, style: 'serif', col: '#3A2A20', emph: { 'ate': { italic: true, col: COL.tangerine } }, zh: { px: 26 } };
  const dV51 = { i: 51, x: -1080, y: 450, w: 1150, px: 62, style: 'serif', col: '#3A2A20', emph: { 'bread': { style: 'marker', col: '#B8742A', big: 1.2 } }, zh: { px: 26 } };
  const dV52 = { i: 52, x: 140, y: -60, w: 950, px: 70, style: 'serif', col: '#3A2A20', emph: { 'kill': { style: 'cut', big: 1.15, cols: ['#D23A2C', '#2A2440', '#D23A2C', '#2A2440'] }, 'reason': { under: true } }, zh: { px: 28 } };
  const dV53 = { i: 53, x: 140, y: 140, w: 950, px: 70, style: 'serif', col: '#3A2A20', emph: { 'lie': { col: '#8A90A0', strike: Wd(53, 2) + 0.3 }, 'never': { style: 'marker', col: COL.marker, big: 1.2, circle: true } }, zh: { px: 28 } };
  const BREAD = { x: -520, y: -60, w: 820, h: 547 }, FEAST = Wd(53, 4) - 0.1;
  spread('V2f', 50900, -100, 2400, 1450, 0.25, 0.01, (g, t) => {
    PA.drawCard(g, PA.card('V2f', 2400, 1450, { tex: '#E9D6B6', torn: 'lr', edge: 0.25 }), 0, 0);
    const A = K.photoCanvas('bg_bread', BREAD.w, BREAD.h, {}), B = K.photoCanvas('bg_feast', BREAD.w, BREAD.h, {});
    const dp = eOut5(P(t, L(50) - 0.3, L(50) + 0.2));
    if (dp > 0) { g.save(); g.translate(0, (1 - dp) * -900); K.photoFlip(g, A, B, P(t, FEAST, FEAST + 0.55), BREAD.x, BREAD.y, -0.02); g.restore(); }
    // the slice of bread passes from her plate to the child's (drawn over the photo)
    const bp = eIO(P(t, Wd(51, 1), Wd(51, 5))), ox = BREAD.x - BREAD.w / 2, oy = BREAD.y - BREAD.h / 2;
    if (t > Wd(51, 0) && t < FEAST + 0.25) {
      const x = ox + lerp(0.44, 0.62, bp) * BREAD.w, y = oy + lerp(0.66, 0.6, bp) * BREAD.h - Math.sin(Math.PI * bp) * 70;
      g.save(); g.translate(x, y); g.rotate(-0.2 + bp * 0.4); g.globalAlpha *= 1 - P(t, FEAST, FEAST + 0.25);
      g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(6, 26, 50, 10, 0, 0, 7); g.fill();
      g.fillStyle = '#C8843A'; g.beginPath(); g.roundRect(-46, -40, 92, 74, [30, 30, 8, 8]); g.fill(); g.fillStyle = '#F6DDB0'; g.beginPath(); g.roundRect(-36, -30, 72, 58, [24, 24, 6, 6]); g.fill();
      g.restore();
    }
    // "I already ate." — then crossed out, and the bubble pops away
    K.bubble(g, -700, -560, 470, 150, ox + 0.36 * BREAD.w, oy + 0.24 * BREAD.h, t, Wd(50, 5) - 0.05, { text: 'I already ate.', font: EP.font(700, 58, F.hand), typed: 0.035, rot: -0.03, outAt: FEAST + 0.1 });
    if (t > Wd(53, 2) && t < FEAST + 0.3) PA.ink(g, PA.hand([[-890, -560], [-510, -565]], 3, 161), 0, eIO(P(t, Wd(53, 2) + 0.05, Wd(53, 2) + 0.3)), { col: COL.marker, w: 9, alpha: 1 - P(t, FEAST, FEAST + 0.3) });
    // the reason, stamped and struck
    PA.stamp(g, 'HUNGER', 540, -400, t - (L(52) - 0.1), { px: 110, col: '#6A6070', rot: -0.08 });
    if (t > Wd(52, 3)) { PA.ink(g, PA.hand([[300, -500], [780, -300]], 6, 171), 0, eIO(P(t, Wd(52, 3), Wd(52, 3) + 0.2)), { col: '#E0332A', w: 22 }); PA.ink(g, PA.hand([[780, -500], [300, -300]], 6, 172), 0, eIO(P(t, Wd(52, 3) + 0.15, Wd(52, 3) + 0.35)), { col: '#E0332A', w: 22 }); }
    KT.draw(g, dV50, t); KT.draw(g, dV51, t); KT.draw(g, dV52, t); KT.draw(g, dV53, t);
    STK.draw(g, 'spr_villain', 1010, -110, 600, { t, peel: P(t, L(52) - 0.3, L(52) + 0.15), sway: 1, flip: { to: 'spr_heart', p: P(t, FEAST + 0.1, FEAST + 0.5) } });
  }, { img: ['bg_bread', 'bg_feast', 'cut/spr_villain', 'cut/spr_heart'] });

  // ================================================================== PR2 · the work you have to do / the work you choose / the time card
  const dP54 = { i: 54, x: -1080, y: 120, w: 1250, px: 66, style: 'serif', col: COL.ink, emph: { 'work': { italic: true, col: '#6A6478' }, 'have': { style: 'type', col: '#6A6478' }, 'to': { style: 'type', col: '#6A6478' }, 'do': { style: 'type', col: '#6A6478' } }, zh: { px: 26 } };
  const dP55 = { i: 55, x: -1080, y: 245, w: 1250, px: 66, style: 'serif', col: COL.ink, emph: { 'choose': { style: 'marker', col: COL.tangerine, big: 1.3, circle: COL.tangerine } }, zh: { px: 26 } };
  const dP56 = { i: 56, x: -1080, y: 375, w: 1250, px: 66, style: 'serif', col: COL.ink, emph: { 'earn': { style: 'type', col: '#6A6478' }, 'life': { italic: true, col: COL.marker } }, zh: { px: 26 } };
  const dP57 = { i: 57, x: -1080, y: 498, w: 1250, px: 66, style: 'serif', col: COL.ink, emph: { 'use': { style: 'marker', col: COL.marker, big: 1.2 } }, zh: { px: 26 } };
  const RIPC = PA.rip(181, 40, -330, -20, 330), TORN = Wd(57, 2) - 0.05;
  function timecard(g, t) {
    PA.drawCard(g, PA.card('tcard', 560, 640, { tex: '#F2E8D0', header: { col: '#C8B590', h: 80 }, r: 4, blur: 12 }), 0, 0);
    EP.txt(g, 'TIME CARD', 0, -262, { font: EP.font(900, 40, F.ui), color: '#4A3A28', ls: '5px' });
    ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].forEach((d, k) => {
      const y = -170 + k * 64; EP.txt(g, d, -220, y, { font: EP.font(800, 26, F.ui), color: '#7A6A50', align: 'left' }); g.fillStyle = '#C8B590'; g.fillRect(-230, y + 18, 460, 2);
      const st = t - (Wd(56, 0) + k * EP.BEAT * 0.5);
      if (st > 0) PA.stamp(g, '09:00  17:00', 70, y - 8, st, { px: 30, col: k > 4 ? '#D23A2C' : '#3A3A8A', rot: (hash(k, 9) - 0.5) * 0.06, border: false });
    });
  }
  spread('PR2', 53600, 150, 2400, 1450, 'day', -0.01, (g, t) => {
    PA.drawCard(g, PA.card('PR2', 2400, 1450, { tex: 'cream', torn: 'tb', edge: 0.22 }), 0, 0);
    K.photo(g, 'bg_office', -560, -330, 700, 467, -0.03, t, L(54) - 0.3, { mode: 'drop', kb: { z0: 1, z1: 1.08, d: 5 }, tape: 191 });
    // the paperwork leaves the office photo
    for (let k = 0; k < 12; k++) {
      const t0 = Wd(54, 1) + k * 0.07, u = P(t, t0, t0 + 0.7); if (u <= 0 || u >= 1) continue;
      const x = lerp(-560 + (hash(k, 1) - 0.5) * 500, 1300, eIO(u)), y = lerp(-330 + (hash(k, 2) - 0.5) * 300, 200, eIO(u)) - Math.sin(Math.PI * u) * 300;
      g.save(); g.translate(x, y); g.rotate(u * 6 + k); PA.drawCard(g, PA.card('sheet', 130, 170, { tex: 'white', lines: 22, r: 2, blur: 6, sa: 0.3 }), 0, 0); g.restore();
    }
    K.photo(g, 'bg_painter', 560, -320, 700, 467, 0.035, t, Wd(55, 1) - 0.1, { mode: 'drop', from: -900, kb: { z0: 1, z1: 1.08, d: 5 }, tape: 193 });
    // the time card, punched on the beats, then torn in half
    const cp = eOut5(P(t, L(56) - 0.35, L(56)));
    if (cp > 0) {
      const tp = P(t, TORN, TORN + 0.55);
      g.save(); g.translate(660, lerp(1200, 300, cp)); g.rotate(0.03); g.scale(0.86, 0.86);
      if (tp <= 0) timecard(g, t); else PA.tornDraw(g, gg => timecard(gg, t), RIPC, tp, { dist: 1100, rot: 0.3 });
      g.restore();
    }
    KT.draw(g, dP54, t); KT.draw(g, dP55, t); KT.draw(g, dP56, t); KT.draw(g, dP57, t);
    // Claude carries the stack away
    const cw = P(t, Wd(54, 2), L(55) + 0.3);
    if (cw > 0 && cw < 1) STK.draw(g, 'spr_carry', lerp(-150, 1500, eIO(cw)), 720 - Math.abs(Math.sin(cw * 18)) * 18, 760, { t, sway: 1 });
    STK.draw(g, 'spr_scissors', 1020, 720, 620, { t, peel: P(t, L(57) - 0.4, L(57)), sway: 0.8 });
  }, { img: ['bg_office', 'bg_painter', 'cut/spr_carry', 'cut/spr_scissors'] });

  // ================================================================== camera, impacts, light
  WD.keys.push(
    { t: 84.5, s: 'V2a', dx: 0, dy: 0, z: 0.84, d: 0.38, drift: { z: 0.02 } },
    { t: 86.45, s: 'V2b', dx: 0, dy: -32, z: 0.79, d: 0.5, drift: { z: 0.008 } },
    { t: 91.45, s: 'V2c', dx: 0, dy: 0, z: 0.8, d: 0.55, drift: { z: 0.01 } },
    { t: 98.62, s: 'V2d', dx: 0, dy: -32, z: 0.79, d: 0.45, drift: { z: 0.01 } },
    { t: 101.95, s: 'V2e', dx: 0, dy: -32, z: 0.79, d: 0.5, drift: { z: 0.012 } },
    { t: 105.45, s: 'V2f', dx: 0, dy: -32, z: 0.79, d: 0.5, drift: { z: 0.01 } },
    { t: 112.38, s: 'PR2', dx: 0, dy: -32, z: 0.79, d: 0.5, drift: { z: 0.012 } },
  );
  WD.shakes.push([Wd(38, 1) + 0.2, 0.55], [Wd(39, 2) + 0.15, 0.25], [Wd(41, 4) + 0.2, 0.25], [Wd(45, 5) + 0.1, 0.3], [FLIP80 + 0.6, 0.25], [Wd(52, 3) + 0.1, 0.35], [L(52) + 0.1, 0.25], [TORN + 0.05, 0.4]);
  WD.grades.push([91.4, 98.9, { col: '#808080', op: 'saturation', a: 0.3 }, 0.5, 0.6], [98.5, 105.6, { col: '#6A90B8', op: 'soft-light', a: 0.22 }, 0.4, 0.5]);
  WD.props.push(
    { x: 39000, y: 820, rot: 0.25, d: 0.12, blur: 3, draw: (g) => { g.fillStyle = 'rgba(0,0,0,.35)'; g.filter = 'blur(8px)'; g.fillRect(-300, 14, 600, 40); g.filter = 'none'; g.fillStyle = '#F2C230'; g.fillRect(-260, -22, 480, 44); g.fillStyle = '#E8C9A0'; g.beginPath(); g.moveTo(220, -22); g.lineTo(300, 0); g.lineTo(220, 22); g.closePath(); g.fill(); } },
    { x: 47000, y: -820, rot: 0.4, d: 0.1, blur: 3, draw: (g, t) => { for (let i = 0; i < 3; i++) EP.drawDaisy(g, i * 70, (i % 2) * 40, 52 - i * 6, { rot: i + t * 0.05, petal: '#FBF6EA', center: '#E8B54A' }); } },
  );
})();
