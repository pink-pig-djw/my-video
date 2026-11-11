// v2/sample.js — verse 1 + chorus 1 (≈15 s → 69.6 s) laid out as spreads of the Evil Plan dossier.
// Lyric text and timing come from data/timing.js (the user's sheet, aligned to the recording).
'use strict';
(function () {
  const { W, H, clamp, lerp, P, eIO, eIOs, eOut, eOut5, eIn, backOut, spring, smooth, hash, noise, mod } = EP;
  const PA = EP.PA, RISO = EP.RISO, STK = EP.STK, KT = EP.KT, WD = EP.WD, F = EP.F, COL = PA.COL;
  const L = EP.L, E = EP.E, Wd = EP.Wd;
  const spread = (id, x, y, w, h, mood, rot, draw, extra = {}) => WD.spreads.push(Object.assign({ id, x, y, w, h, mood, rot, draw }, extra));
  EP.SAMPLE = { from: 14.6, to: 69.9 };

  // ------------------------------------------------------------------ small helpers (my own labels/notes, not lyrics)
  function tapeLabel(g, text, x, y, t0, t, o = {}) {
    const pr = eOut5(P(t, t0, t0 + 0.3)); if (pr <= 0) return;
    const px = o.px || 34;
    g.save(); g.translate(x, y); g.rotate(o.rot ?? -0.02);
    g.font = EP.font(900, px, F.ui); g.letterSpacing = Math.round(px * 0.12) + 'px'; const tw = g.measureText(text).width; g.letterSpacing = '0px';
    const w = tw + px * 1.2, h = px * 1.6;
    g.beginPath(); g.rect(-8, -h, (w + 16) * pr, h * 2); g.clip();
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(4, -h / 2 + 5, w, h);
    g.fillStyle = o.tape || '#1E1B26'; g.beginPath(); g.roundRect(0, -h / 2, w, h, 6); g.fill();
    g.font = EP.font(900, px, F.ui); g.letterSpacing = Math.round(px * 0.12) + 'px'; g.fillStyle = o.ink || '#FBF6EA'; g.textBaseline = 'middle'; g.textAlign = 'left';
    g.fillText(text, px * 0.6, 2); g.letterSpacing = '0px';
    g.restore();
  }
  function handText(g, text, x, y, t0, t, o = {}) {
    const px = o.px || 48, f = EP.font(700, px, F.hand), dur = o.dur ?? Math.max(0.3, text.length * 0.035), pr = eOut(P(t, t0, t0 + dur));
    if (pr <= 0) return;
    g.save(); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.font = f;
    const tw = g.measureText(text).width, x0 = o.align === 'c' ? -tw / 2 : 0;
    g.beginPath(); g.rect(x0 - 6, -px * 1.2, (tw + 12) * pr, px * 1.8); g.clip();
    EP.txt(g, text, x0, 0, { font: f, color: o.col || COL.ink, align: 'left' }); g.restore();
  }
  function tapes(g, w, h, seed, col) { PA.tape(g, -w / 2 + 40, -h / 2 + 6, 150, -0.6, col, 40, seed); PA.tape(g, w / 2 - 40, -h / 2 + 6, 150, 0.6, col, 40, seed + 1); }
  function printAt(g, pr, x, y, rot, t, t0, o = {}) {
    g.save(); g.translate(x, y); g.rotate(rot);
    RISO.draw(g, pr, 0, 0, 0, { p: P(t, t0, t0 + 0.6), mode: o.mode || 'roller' });
    if (t > t0 + 0.3) tapes(g, pr.w, pr.h, o.seed || 3, o.tape);
    g.restore();
  }
  const hit = (lu, k = 1) => lu > 0 && lu < 0.3 ? 1 - 0.06 * k * Math.sin(Math.PI * lu / 0.3) : 1;

  // ================================================================== A · Monster HQ (night)
  const dA = [
    { i: 6, x: -900, y: -470, w: 1350, px: 84, style: 'serif', col: '#F4EADB', emph: { 'castle': { col: COL.goldInk, circle: COL.goldInk, italic: true, w: 900 } }, zhCol: '#C9B98F', rot: -0.015 },
    { i: 7, x: -900, y: -290, w: 1350, px: 84, style: 'serif', col: '#F4EADB', emph: { 'throne': { col: COL.tangerine, under: COL.goldInk, italic: true, w: 900 } }, zhCol: '#C9B98F', rot: -0.015 },
    { i: 8, x: -560, y: 470, w: 1060, px: 50, style: 'type', col: '#2A2440', emph: { 'phone': { circle: true, style: 'marker', col: COL.marker, big: 1.3 } }, zh: { px: 30 } },
  ];
  const CLAUDE_ICON = { x: 740, y: 70, rot: 0.06 };
  const ICONC = ['#FFB547', '#E8645A', '#4F5D75', '#5BB585', '#59A7E8', '#8E6CC8', '#F29E4C', '#F06A8A', '#3FB6C9', '#7C8695', '#F5C542', '#6CBF7A', '#D9534F', '#86C5F0', '#E8A0B4', '#B0A0D0'];
  const GLYPHS = ['sun', 'note', 'heart', 'star', 'cloud', 'envelope', 'clock', 'check', 'moon', 'daisy', 'arrow', 'door', 'rain', 'bolt', 'heart', 'star'];
  function phone(g, t) {
    const inP = eOut5(P(t, 18.62, 19.2)); if (inP <= 0) return;
    const { x, y, rot } = CLAUDE_ICON;
    g.save(); g.translate(x, lerp(y + 1100, y, inP)); g.rotate(rot);
    PA.drawCard(g, PA.card('phone', 480, 920, { tex: 'black', r: 64, blur: 20 }), 0, 0);
    g.fillStyle = '#F6F0E4'; g.beginPath(); g.roundRect(-212, -420, 424, 840, 44); g.fill();
    g.save(); g.beginPath(); g.roundRect(-212, -420, 424, 840, 44); g.clip(); g.globalAlpha = 0.4; PA.tile(g, 'cream', -212, -420, 424, 840); g.restore();
    EP.txt(g, '10:24', 0, -330, { font: EP.font(800, 56, F.ui), color: '#2A2440' });
    const S = 78, gx = 96, gy = 118, x0 = -gx * 1.5, y0 = -225;
    for (let i = 0; i < 16; i++) {
      const r = Math.floor(i / 4), c = i % 4, ix = x0 + c * gx, iy = y0 + r * gy, isC = i === 9;
      const tp = isC ? Wd(8, 11) - 0.12 : 19.3 + r * 0.12 + c * 0.03;   // #002 rows, #001 pops
      const pp = EP.pop(t - tp); if (pp.sc <= 0.01) continue;
      g.save(); g.translate(ix, iy); g.rotate(pp.rot); g.scale(pp.sc, pp.sc);
      g.fillStyle = isC ? COL.tangerine : ICONC[i]; g.beginPath(); g.roundRect(-S / 2, -S / 2, S, S, 20); g.fill();
      if (isC) EP.drawDaisy(g, 0, 0, 27, { petal: '#FFF6E8', center: '#FFD27A', n: 14 });
      else PA.drawDoodle(g, GLYPHS[i], 0, 0, 0.3, 1, { col: '#FFFFFF', w: 4, seed: i + 1 });
      g.restore();
      if (isC) { const bs = spring(t - tp - 0.34, 17, 7); if (bs > 0.01) { g.save(); g.translate(ix + 34, iy - 34); g.scale(bs, bs); g.fillStyle = '#E2453A'; g.beginPath(); g.arc(0, 0, 18, 0, 7); g.fill(); EP.txt(g, '1', 0, 1, { font: EP.font(900, 22, F.ui), color: '#fff', base: 'middle' }); g.restore(); } }
    }
    g.restore();
  }
  function iconPos() { const { x, y, rot } = CLAUDE_ICON, lx = -96 * 1.5 + 96, ly = -225 + 2 * 118; return [x + lx * Math.cos(rot) - ly * Math.sin(rot), y + lx * Math.sin(rot) + ly * Math.cos(rot)]; }
  spread('A', 0, 0, 2300, 1400, 'night', -0.012, (g, t) => {
    PA.drawCard(g, PA.card('A', 2300, 1400, { tex: 'indigo', torn: 'lr', edge: 0.3 }), 0, 0);
    tapeLabel(g, 'EVIL PLAN · DOSSIER Nº 2', -980, -600, 14.8, t, { tape: '#0F1230', ink: COL.goldInk, px: 30 });
    [[-1000, 560, 'star'], [960, -560, 'moon'], [1040, 520, 'star'], [-160, -620, 'star']].forEach(([x, y, k], i) => PA.drawDoodle(g, k, x, y, 0.55, P(t, 14.9 + i * 0.25, 15.6 + i * 0.25), { col: COL.goldInk, w: 5, seed: 20 + i }));
    // the castle print turns over into the throne (#021 flip, 1.05 s × 0.5)
    const pA = RISO.print('bg_castle', 760, 507, { fy: 0.42 }), pB = RISO.print('bg_throne', 760, 507, { fy: 0.35 }), fl = P(t, L(7) - 0.12, L(7) - 0.12 + 0.52);
    if (fl <= 0 || fl >= 1) printAt(g, fl >= 1 ? pB : pA, 600, 80, 0.035, t, 15.1, { seed: 5 });
    else { g.save(); g.translate(600, 80); g.rotate(0.035); PA.flipDraw(g, pA.c, pB.c, fl, 0, 0, pA.w, pA.h, { opaque: true, slices: 40 }); g.restore(); }
    // paper strip for the typed line
    const sp = eOut5(P(t, 18.7, 19.1)); if (sp > 0) PA.drawCard(g, PA.card('stripA', 1150, 260, { tex: 'white', torn: 'lr', sa: 0.45 }), lerp(-1300, -20, sp), 540, -0.012);
    phone(g, t);
    // Claude: peels on, flips to the laughing pose, then hops into her app icon
    const hop = eIO(P(t, Wd(8, 7), Wd(8, 11) - 0.05));
    if (hop < 1) {
      const [ix, iy] = iconPos(), x = lerp(-330, ix, hop), y = lerp(730, iy + 40, hop) - Math.sin(Math.PI * hop) * 520, h = lerp(860, 90, hop);
      STK.draw(g, 'spr_hips', x, y, h, { t, peel: P(t, 15.2, 15.75), sway: 1, rot: hop * EP.TAU, flip: { to: 'spr_laugh', p: P(t, L(7) - 0.05, L(7) + 0.32) } });
    }
    dA.forEach(d => KT.draw(g, d, t));
  });

  // ================================================================== B · the inbox ledger (day)
  const dB = [
    { i: 9, x: -800, y: -380, w: 1150, px: 80, style: 'marker', col: COL.ink, emph: { 'burglar': { col: COL.marker, under: true }, 'inbox': { circle: true } } },
    { i: 10, x: -800, y: -120, w: 1150, px: 62, style: 'type', col: COL.ink, zh: { dx: 0, dy: 470 },
      emph: { 2: { style: 'stamp', col: '#2E8B57', big: 1.5, rot: -0.12 }, 3: { style: 'stamp', col: '#2E8B57', big: 1.5, rot: 0.06 } },
      place: { 2: { x: 20, y: 230 }, 3: { x: 600, y: 300 } } },
  ];
  spread('B', 2750, 280, 2050, 1300, 'day', 0.018, (g, t) => {
    PA.drawCard(g, PA.card('B', 2050, 1300, { tex: 'cream', lines: 62, margin: 170, holes: true, torn: 't' }), 0, 0);
    tapeLabel(g, 'INBOX', -820, -520, 22.15, t, { tape: COL.red, px: 40 });
    // unread count (#007 curve: fast first, slow at the end), 9,999 → 0
    const pc = P(t, 22.5, 24.9), v = 9999 - EP.countVal(pc, 0, 9999), land = t - 24.9;
    g.save(); g.translate(590, -470); g.scale(EP.landPop(land), EP.landPop(land));
    EP.txt(g, v > 0 ? v.toLocaleString('en-US') + ' unread' : 'inbox zero!', 0, 0, { font: EP.font(700, 84, F.hand), color: v > 0 ? COL.marker : '#2E8B57' });
    g.restore();
    if (land > 0) PA.drawDoodle(g, 'check', 860, -500, 0.9, P(land, 0, 0.3), { col: '#2E8B57', w: 9, seed: 4 });
    // the envelopes go into the sack, one after another
    const sack = [790, -240];
    for (let i = 21; i >= 0; i--) {
      const t0 = 22.6 + (21 - i) * 0.08, pr = eIO(P(t, t0, t0 + 0.55));
      if (pr >= 1) continue;
      const x0 = -560 + (hash(i, 1) - 0.5) * 60, y0 = 360 - i * 9, x = lerp(x0, sack[0], pr), y = lerp(y0, sack[1], pr) - Math.sin(Math.PI * pr) * 300;
      g.save(); g.translate(x, y); g.rotate((hash(i, 2) - 0.5) * 0.5 + pr * 4); g.scale(1 - 0.6 * pr, 1 - 0.6 * pr);
      PA.drawCard(g, PA.card('env', 160, 102, { tex: 'white', r: 6, blur: 6, sy: 5, sa: 0.3 }), 0, 0);
      g.strokeStyle = 'rgba(90,80,70,.5)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-80, -51); g.lineTo(0, 8); g.lineTo(80, -51); g.stroke();
      g.restore();
    }
    STK.draw(g, 'spr_burglar', 620, 590, 960, { t, peel: P(t, 22.4, 22.9), sway: 1.2 });
    dB.forEach(d => KT.draw(g, d, t));
  });

  // ================================================================== C · the meeting (day, grid paper)
  const dC = [
    { i: 11, x: -880, y: -520, w: 1450, px: 80, style: 'serif', col: COL.ink, emph: { 'monster': { style: 'cut', big: 1.15, cols: ['#D23A2C', '#F07A2E', '#D23A2C', '#F07A2E', '#D23A2C', '#F07A2E', '#D23A2C'] } } },
    { i: 12, x: -160, y: 380, w: 1060, px: 80, style: 'marker', col: COL.ink, emph: { 'around': { under: true, col: COL.marker } } },
  ];
  spread('C', 5250, -120, 2100, 1350, 'day', -0.01, (g, t) => {
    PA.drawCard(g, PA.card('C', 2100, 1350, { tex: 'grid', torn: 'b' }), 0, 0);
    // the meeting invite
    const np = P(t, 25.55, 25.9); if (np > 0) {
      PA.sticky(g, -760, -190, 340, '#A9D3F5', -0.05, 1 - eOut5(np));
      handText(g, 'Weekly sync', -900, -230, 25.7, t, { px: 52, rot: -0.05 });
      handText(g, '2 hrs · 87 slides', -900, -150, 25.9, t, { px: 40, rot: -0.05, col: '#4A5A80' });
      PA.stamp(g, 'ATTENDING', -760, -60, t - Wd(11, 3) + 0.15, { px: 30, col: COL.red, rot: -0.12 });
    }
    const pr = RISO.print('bg_meeting', 860, 573, { fx: 0.55 });
    printAt(g, pr, 330, -40, -0.02, t, 25.9, { seed: 8 });
    // the door in the print lights up, a little figure walks out of the page
    const dg = eOut(P(t, L(12) - 0.1, L(12) + 0.5));
    if (dg > 0) { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = dg * 0.85; EP.glowDot(g, 622, -69, 230, 'rgba(255,240,190,1)', 'rgba(255,210,140,.45)'); g.restore(); }
    const arrow = PA.hand([[650, -40], [780, -110], [900, -140], [1030, -230]], 4, 9);
    PA.ink(g, arrow, 0, eIO(P(t, L(12) + 0.1, L(12) + 0.6)), { col: COL.marker, w: 7 });
    const wk = P(t, L(12) + 0.4, L(12) + 1.5);
    if (wk > 0 && wk < 1) {
      const x = lerp(650, 1030, wk), y = lerp(-40, -230, wk) - 60, s = Math.sin(wk * 30);
      g.save(); g.translate(x, y); g.strokeStyle = COL.ink; g.lineWidth = 6; g.lineCap = 'round';
      g.beginPath(); g.arc(0, -46, 14, 0, 7); g.stroke(); g.beginPath(); g.moveTo(0, -32); g.lineTo(0, 6); g.moveTo(0, 6); g.lineTo(-14 * s, 40); g.moveTo(0, 6); g.lineTo(14 * s, 40); g.moveTo(0, -18); g.lineTo(16 * s, -2); g.moveTo(0, -18); g.lineTo(-16 * s, -2); g.stroke(); g.restore();
    }
    STK.draw(g, 'spr_point', -430, 600, 920, { t, peel: P(t, 25.95, 26.45), sway: 1 });
    dC.forEach(d => KT.draw(g, d, t));
  });

  // ================================================================== D · the forms (kraft desk blotter)
  const FORMS = [['J. DOE', '10/04', 'BECAUSE', 'J.D.', 'N/A'], ['J. DOE', 'TODAY', 'AGAIN', 'J.D.', 'SEE 9-A'], ['J. DOE', 'ASAP', 'URGENT', 'J.D.', 'SEE 12-C']];
  function form(g, k, x, y, rot, t) {
    g.save(); g.translate(x, y); g.rotate(rot);
    PA.drawCard(g, PA.card('form' + k, 600, 800, { tex: 'white', header: { col: '#E3D5BF', h: 92 }, r: 4 }), 0, 0);
    EP.txt(g, ['FORM 9-ALPHA', 'FORM 12-C', 'FORM 404'][k], -270, -330, { font: EP.font(800, 34, F.ui), color: '#6E5C48', align: 'left' });
    ['NAME', 'DATE', 'REASON', 'SIGNATURE', 'NOTES'].forEach((lb, i) => {
      const yy = -220 + i * 112;
      EP.txt(g, lb, -270, yy, { font: EP.font(800, 20, F.ui), color: '#9A8670', align: 'left' }); g.fillStyle = '#B9A68E'; g.fillRect(-270, yy + 42, 540, 2.5);
      EP.typeOn(g, FORMS[k][i], -262, yy + 30, t - (29.3 + k * 0.22 + i * 0.1), { t0: 0, dt: 0.045, font: EP.font(400, 34, F.type), color: '#25305E', cursor: false, base: 'alphabetic' });
    });
    g.restore();
  }
  const dD = [
    { i: 13, x: -880, y: -520, w: 1450, px: 66, style: 'type', col: COL.ink, emph: { 'dreaded': { style: 'marker', col: COL.marker, shake: true, big: 1.25 } }, zh: { dy: 140 } },
    { i: 14, x: 0, y: 0, w: 2000, px: 40, style: 'type', col: '#5A4632', zh: { dx: -880, dy: 545 },
      emph: { 0: { style: 'stamp', col: COL.red, big: 2.0, rot: -0.16 }, 2: { style: 'stamp', col: '#2E5FA8', big: 2.0, rot: 0.08 }, 4: { style: 'stamp', col: '#2E8B57', big: 1.8, rot: -0.06 } },
      place: { 0: { x: -600, y: -120 }, 1: { x: -250, y: 30 }, 2: { x: -440, y: 150 }, 3: { x: -110, y: 290 }, 4: { x: -470, y: 400 } } },
  ];
  spread('D', 7800, 260, 2250, 1400, 'day', 0.012, (g, t) => {
    PA.drawCard(g, PA.card('D', 2250, 1400, { tex: 'kraft', r: 10, edge: 0.25 }), 0, 0);
    form(g, 0, -430, 60, -0.1, t); form(g, 1, -180, 110, 0.04, t); form(g, 2, 70, 40, 0.13, t);
    const hits = [Wd(14, 0), Wd(14, 2), Wd(14, 4)];
    let dy = 0, sy = 1;
    hits.forEach(h => { const u = t - h; if (u > -0.12 && u < 0) dy = -50 * ((u + 0.12) / 0.12); else if (u >= 0 && u < 0.3) { dy = 120 * (1 - u / 0.3); sy = hit(u, 1); } });
    STK.draw(g, 'spr_stamp', 720, 620 + dy, 1000, { t, peel: P(t, 29.2, 29.7), sway: 0.8, sy });
    dD.forEach(d => KT.draw(g, d, t));
  });

  // ================================================================== E · on hold → the page tears → outside
  const tearT = Wd(16, 3) - 0.08;
  const dE = [
    { i: 15, x: -880, y: -500, w: 1250, px: 82, style: 'serif', col: '#F4EADB', emph: { 'hold': { circle: COL.goldInk, col: COL.goldInk, italic: true, w: 900 } }, zhCol: '#C9B98F' },
    { i: 16, x: -880, y: -330, w: 1250, px: 82, style: 'serif', col: '#F4EADB', zh: false, emph: { 4: { hide: true } } },
    { i: 16, x: 0, y: -140, w: 1700, px: 150, style: 'cut', align: 'c', zh: { dx: 0, px: 42, col: '#FFFFFF', align: 'c' }, cols: ['#E0662A', '#2B3990', '#D23A2C', '#2F8F8A', '#E8A62A', '#C2357A', '#E0662A', '#2B3990'],
      emph: { 0: { hide: true }, 1: { hide: true }, 2: { hide: true, br: true }, 3: { style: 'marker', col: '#FFF6E8', big: 0.7 }, 4: { big: 1.35, br: true } } },
  ];
  const RIP = PA.rip(77, -160, -820, 300, 820);
  function nightE(g, t) {
    PA.drawCard(g, PA.card('E', 2250, 1400, { tex: 'indigo', torn: 'tb', edge: 0.3 }), 0, 0);
    // a big gold clock, hands racing, and the hold timer
    PA.drawDoodle(g, 'clock', -500, -20, 2.4, P(t, 32.4, 33.1), { col: COL.goldInk, w: 7, seed: 12 });
    if (t > 32.9) { g.save(); g.translate(-500, -20); g.strokeStyle = COL.goldInk; g.lineCap = 'round'; g.lineWidth = 9; const a = (t - 32.9) * 9; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(a) * 120, -Math.cos(a) * 120); g.stroke(); g.lineWidth = 12; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(a / 12) * 80, -Math.cos(a / 12) * 80); g.stroke(); g.restore(); }
    const secs = 2 * 3600 + 47 * 60 + Math.floor(Math.max(0, t - 32.5) * 37), hh = Math.floor(secs / 3600), mm = Math.floor(secs / 60) % 60, ss = secs % 60;
    if (t > 32.6) EP.digits(g, `${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`, -500, 330, EP.font(700, 96, F.hand), COL.goldInk);
    handText(g, 'on hold…', -620, 430, 32.9, t, { px: 50, col: '#C9B98F' });
    for (let i = 0; i < 6; i++) { const life = mod(t * 0.4 + i / 6, 1), x = 300 + Math.sin(t * 2 + i) * 60 + i * 30, y = 120 - life * 420; g.save(); g.globalAlpha *= Math.sin(Math.PI * life); PA.drawDoodle(g, 'note', x, y, 0.55, 1, { col: COL.goldInk, w: 5, seed: 30 + i }); g.restore(); }
    STK.draw(g, 'spr_phone', 460, 600, 960, { t, peel: P(t, 32.45, 32.95), sway: 0.6 });
    KT.draw(g, dE[0], t); KT.draw(g, dE[1], t);
  }
  spread('E', 10350, 0, 2250, 1400, t => (t > tearT + 0.25 ? 'day' : 'night'), 0, (g, t) => {
    if (t < tearT) { nightE(g, t); return; }
    // outside: the photograph lying under the page
    const im = EP.img.bg_park, s = Math.max(2300 / im.width, 1450 / im.height) * (1.08 - 0.06 * P(t, tearT, tearT + 2));
    g.save(); g.beginPath(); g.rect(-1150, -725, 2300, 1450); g.clip();
    g.drawImage(im, -im.width * s / 2, -im.height * s / 2 - 40, im.width * s, im.height * s);
    g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.35 * (1 - P(t, tearT, tearT + 1.2)); g.fillStyle = '#FFF6E0'; g.fillRect(-1200, -760, 2400, 1520);
    g.restore();
    KT.draw(g, dE[2], t);
    PA.tornDraw(g, gg => nightE(gg, t), RIP, P(t, tearT, tearT + 0.6), { dist: 1300, rot: 0.16 });
  });

  // ================================================================== F · the night shift (boring bits / not sorry)
  const TODO = ['renew insurance', 'inbox (9,999)', 'expense report', 'form 9-alpha', 'password reset', 'call billing (on hold)', 'meeting notes', 'tax receipts'];
  const dF = [
    { i: 17, x: -880, y: -520, w: 1450, px: 74, style: 'serif', col: '#F4EADB', emph: { 'boring': { col: COL.tangerine, italic: true, w: 900 }, 'bits': { col: COL.tangerine, under: COL.goldInk, italic: true, w: 900 } }, zhCol: '#C9B98F', dim: L(18) },
    { i: 18, x: -900, y: 330, w: 760, px: 98, style: 'marker', col: '#FF6A55', rot: -0.05, emph: { 'sorry': { circle: COL.goldInk } }, zhCol: '#E8C9A0' },
  ];
  spread('F', 12950, 260, 2300, 1400, 'night', 0.01, (g, t) => {
    PA.drawCard(g, PA.card('F', 2300, 1400, { tex: 'indigo', torn: 'lr', edge: 0.3 }), 0, 0);
    printAt(g, RISO.print('bg_lair', 740, 494, { inkA: '#22307A' }), -560, -70, -0.03, t, 36.05, { seed: 13 });
    // the to-do list, crossed off on the beats
    g.save(); g.translate(570, 30); g.rotate(0.03);
    PA.drawCard(g, PA.card('todo', 620, 800, { tex: 'white', lines: 72, margin: 80 }), 0, 0);
    handText(g, 'TO DO', -200, -320, 36.1, t, { px: 60, col: COL.ink });
    TODO.forEach((s, i) => {
      const y = -220 + i * 72;
      EP.typeOn(g, s, -190, y, t - (36.15 + i * 0.05), { t0: 0, dt: 0.02, font: EP.font(400, 32, F.type), color: '#2A2440', cursor: false, base: 'alphabetic' });
      const st = PA.hand([[-200, y - 12], [-40, y - 16], [190, y - 10]], 3, 50 + i);
      PA.ink(g, st, 0, eIO(P(t, 36.5 + i * 0.22, 36.5 + i * 0.22 + 0.2)), { col: COL.marker, w: 7 });
    });
    g.restore();
    STK.draw(g, 'spr_villain', 170, 630, 1100, { t, peel: P(t, L(18) - 0.1, L(18) + 0.35), sway: 1.3, bob: 10, T: t });
    dF.forEach(d => KT.draw(g, d, t));
  });

  // ================================================================== F2 · the bits that need a face / the worry
  const dF2 = [
    { i: 19, x: -880, y: -520, w: 1450, px: 74, style: 'serif', col: '#F4EADB', emph: { 'face': { col: COL.goldInk, circle: COL.goldInk, italic: true, w: 900 } }, zhCol: '#C9B98F', dim: L(20) },
    { i: 20, x: -880, y: -330, w: 1000, px: 96, style: 'marker', col: '#C3CBE0', emph: { 'worry': { shake: true, col: '#9AA6C4', big: 1.15 } }, zhCol: '#AEB6CF' },
  ];
  spread('F2', 15500, -60, 2300, 1400, 'night', -0.012, (g, t) => {
    PA.drawCard(g, PA.card('F2', 2300, 1400, { tex: 'indigo', torn: 'tb', edge: 0.3 }), 0, 0);
    const ph = RISO.photo('bg_hands', 560, 440, { fx: 0.55 }), sl = eOut5(P(t, 39.75, 40.2));
    if (sl > 0) RISO.draw(g, ph, -470, lerp(1000, 130, sl), -0.05, { mode: 'develop', p: P(t, 40.0, 41.2) });
    if (sl >= 1) PA.tape(g, -470, 130 - ph.h / 2 + 10, 170, -0.08, 'rgba(244,206,120,.8)', 42, 19);
    // the worry: a little storm cloud over the jar
    const jx = 483, jy = -35;
    PA.drawDoodle(g, 'cloud', jx, jy - 210, 1.0, P(t, L(20) + 0.1, L(20) + 0.6), { col: '#AEB6CF', w: 6, seed: 41 });
    PA.drawDoodle(g, 'rain', jx, jy - 210, 1.0, P(t, L(20) + 0.5, L(20) + 0.9), { col: '#8FA0C8', w: 5, seed: 42 });
    if (t > L(20) + 0.6) { const fl = Math.max(0, EP.pulse(t, 10) - 0.2); if (fl > 0) { g.save(); g.globalAlpha *= fl; PA.drawDoodle(g, 'bolt', jx + 10, jy - 150, 1.2, 1, { col: '#FFE37A', w: 7, seed: 43 }); g.restore(); } }
    STK.draw(g, 'spr_heart', 520, 620, 950, { t, peel: P(t, 39.9, 40.4), sway: 1, flip: { to: 'spr_jar', p: P(t, L(20) - 0.08, L(20) + 0.3) } });
    dF2.forEach(d => KT.draw(g, d, t));
  });

  // ================================================================== G · the weekly planner (Sunday, someday)
  const COLS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN', 'SOMEDAY'];
  const NOTES = [[0, 'taxes', '#FFE37A'], [1, 'dentist', '#A9D3F5'], [2, 'emails', '#F7B7C8'], [3, 'forms', '#FFE37A'], [4, '1:1', '#B9E3B0'], [5, 'laundry', '#F7B7C8'], [6, 'work', '#FFE37A'], [6, 'emails', '#A9D3F5'], [6, 'errands', '#B9E3B0']];
  const SOME = [['see the sea', '#F9D9A8', 6], ['learn piano', '#F9D9A8', 5], ['visit grandma', '#F9D9A8', 6]];
  const cx = i => -1050 + i * 270 + 120;
  const dG = [
    { i: 21, x: -900, y: -590, w: 1600, px: 66, style: 'serif', col: COL.ink, emph: { 0: { style: 'label', tape: COL.indigo }, 1: { style: 'label', tape: COL.indigo }, 'sunday': { col: COL.tangerine, circle: true, italic: true, w: 900 } }, zh: { px: 30 } },
    { i: 22, x: -900, y: -430, w: 1600, px: 66, style: 'serif', col: COL.ink, emph: { 0: { style: 'label', tape: COL.indigo }, 1: { style: 'label', tape: COL.indigo }, 'someday': { col: COL.tangerine, circle: true, italic: true, w: 900 } }, zh: { px: 30 } },
  ];
  spread('G', 18100, 120, 2400, 1450, 'day', 0.008, (g, t) => {
    PA.drawCard(g, PA.card('G', 2400, 1450, { tex: 'grid', torn: 'r' }), 0, 0);
    COLS.forEach((c, i) => {
      const x = cx(i);
      g.fillStyle = i === 7 ? 'rgba(120,110,100,.12)' : i === 6 ? 'rgba(240,122,46,.06)' : 'rgba(0,0,0,0)'; g.fillRect(x - 125, -280, 250, 980);
      EP.txt(g, c, x, -240, { font: EP.font(900, i === 7 ? 30 : 36, F.ui), color: i === 6 ? COL.tangerine : '#6A6070', ls: '3px' });
    });
    // Sunday's chores peel off into the sack, then the column gets the sun
    const take = Wd(21, 3);
    NOTES.forEach(([col, s, c], k) => {
      const slot = NOTES.filter(n => n[0] === col).indexOf(NOTES[k]), x0 = cx(col), y0 = -90 + slot * 240;
      const isSun = col === 6, fly = isSun ? eIO(P(t, take + slot * 0.12, take + slot * 0.12 + 0.55)) : 0;
      if (fly >= 1) return;
      const x = lerp(x0, 1120, fly), y = lerp(y0, 300, fly) - Math.sin(Math.PI * fly) * 260;
      g.save(); g.translate(x, y); g.rotate((hash(k, 3) - 0.5) * 0.12 + fly * 3); g.scale(1 - 0.5 * fly, 1 - 0.5 * fly);
      PA.sticky(g, 0, 0, 210, c, 0, fly); handText(g, s, -80, 10, 0, 1e9, { px: 46 }); g.restore();
    });
    if (t > Wd(21, 6) - 0.1) { PA.drawDoodle(g, 'daisy', cx(6), 40, 1.25, P(t, Wd(21, 6) - 0.1, Wd(21, 6) + 0.5), { col: COL.tangerine, w: 6, seed: 61 }); handText(g, 'free ♥', cx(6) - 70, 260, Wd(21, 6) + 0.3, t, { px: 56, col: COL.tangerine }); }
    // "someday" plans move into this weekend (#010 overshoot: 1 − e^(−4.6t)·cos(10.5t))
    const mv = Wd(22, 5);
    SOME.forEach(([s, c, to], k) => {
      const tt = t - (mv + k * 0.16), v = tt <= 0 ? 0 : 1 - Math.exp(-4.6 * tt) * Math.cos(10.5 * tt);
      const x0 = cx(7), y0 = -90 + k * 230, x1 = cx(to), y1 = 360 + (to === 6 ? k * 0.5 * 120 : 0) + (k === 1 ? 0 : 0);
      const x = lerp(x0, x1, v), y = lerp(y0, k === 1 ? 300 : 430 + (k === 2 ? 150 : 0), v);
      g.save(); g.translate(x, y); g.rotate((hash(k, 9) - 0.5) * 0.14 * (1 - clamp(v)));
      PA.sticky(g, 0, 0, 215, c, 0, clamp(v) < 1 && tt > 0 ? 0.6 : 0); handText(g, s, -92, 8, 0, 1e9, { px: 38, col: '#7A5A3A' }); g.restore();
    });
    if (t > mv + 0.9) { const s = PA.hand([[cx(7) - 100, -250], [cx(7) + 100, -250]], 3, 66); PA.ink(g, s, 0, eIO(P(t, mv + 0.9, mv + 1.15)), { col: COL.marker, w: 8 }); handText(g, 'SOON!', cx(7) - 70, -300, mv + 1.15, t, { px: 52, col: COL.marker, rot: -0.08 }); }
    // the burglar sneaks in to Sunday, then winks
    const sn = eOut5(P(t, 43.55, 44.3)), out = eIn(P(t, Wd(21, 6) + 0.45, Wd(21, 6) + 0.9));
    if (out < 1) STK.draw(g, 'spr_burglar', lerp(1500, 1050, sn) + out * 700, 700, 900, { t, sway: 1 });
    STK.draw(g, 'spr_peace', 1080, 700, 820, { t, peel: P(t, mv - 0.5, mv - 0.1), sway: 1, bob: 8, T: t });
    dG.forEach(d => KT.draw(g, d, t));
  });

  // ================================================================== H · I take the night, you take the day (two-sided card)
  const flipT = Wd(23, 4) - 0.1;
  const dHn = { i: 23, x: -40, y: -170, w: 1500, px: 150, style: 'cut', align: 'c', zh: false, cols: ['#FFF6E8', '#F4CE72', '#FFF6E8', '#F4CE72'], emph: { 3: { br: true }, 4: { hide: true }, 5: { hide: true }, 6: { hide: true }, 7: { hide: true } } };
  const dHd = { i: 23, x: -880, y: 40, w: 1300, px: 130, style: 'cut', align: 'l', zh: { dx: 0, dy: 190, px: 40, col: '#5A3B2E' }, cols: ['#F07A2E', '#D23A2C', '#F07A2E', '#E8B54A'], emph: { 0: { hide: true }, 1: { hide: true }, 2: { hide: true }, 3: { hide: true, br: true } } };
  const dH24 = { i: 24, x: -880, y: 380, w: 1750, px: 64, style: 'serif', col: COL.ink, emph: { 'away': { style: 'cut', big: 1.6, cols: ['#D23A2C', '#F07A2E', '#E8B54A', '#D23A2C', '#F07A2E'] } }, zh: { dy: 230 } };
  const CHORES = [['bills', '#FFE37A', -60, -420], ['forms', '#A9D3F5', 860, 120], ['emails', '#F7B7C8', 560, 200], ['hold music', '#B9E3B0', 260, -470], ['deadlines', '#FFE37A', -300, -300]];
  let FACE = null;
  function faceCanvas(k) { if (!FACE) FACE = [EP.mk(2000, 1200), EP.mk(2000, 1200)]; const c = FACE[k], g = c.getContext('2d'); EP.reset(g); g.clearRect(0, 0, 2000, 1200); g.translate(1000, 600); return { c, g }; }
  function faceNight(g, t) {
    PA.drawCard(g, PA.card('Hn', 2000, 1200, { tex: 'indigo', shadow: false, edge: 0.32 }), 0, 0);
    PA.drawDoodle(g, 'moon', 640, -330, 1.4, P(t, 49.2, 49.8), { col: COL.goldInk, w: 7, seed: 71 });
    [[-760, -380], [380, -460], [820, 120], [-300, 420]].forEach(([x, y], i) => PA.drawDoodle(g, 'star', x, y, 0.5, P(t, 49.3 + i * 0.1, 49.7 + i * 0.1), { col: COL.goldInk, w: 5, seed: 72 + i }));
    STK.draw(g, 'spr_open', -640, 590, 880, { t, peel: P(t, 49.35, 49.8), sway: 1 });
    KT.draw(g, dHn, t);
  }
  function faceDay(g, t) {
    PA.drawCard(g, PA.card('Hd', 2000, 1200, { tex: 'cream', shadow: false }), 0, 0);
    PA.drawDoodle(g, 'daisy', -640, -300, 2.0, P(t, flipT + 0.3, flipT + 0.9), { col: COL.tangerine, w: 9, seed: 81 });
    const pr = RISO.print('bg_park', 700, 467, { inkA: '#2C7F86', inkB: '#FF6B4A' });
    printAt(g, pr, 520, -210, 0.03, t, flipT + 0.35, { seed: 82 });
    // chores stuck on the day, then taken over into the night-shift folder
    const go = Wd(24, 2);
    CHORES.forEach(([s, c, x0, y0], k) => {
      const ap = EP.pop(t - (flipT + 0.6 + k * 0.08)); if (ap.sc <= 0.01) return;
      const fly = eIO(P(t, go + k * 0.12, go + k * 0.12 + 0.6)); if (fly >= 1) return;
      const x = lerp(x0, -1700, fly), y = lerp(y0, 100, fly) - Math.sin(Math.PI * fly) * 300;
      g.save(); g.translate(x, y); g.rotate((hash(k, 5) - 0.5) * 0.2 + fly * 2); g.scale(ap.sc * (1 - 0.4 * fly), ap.sc * (1 - 0.4 * fly));
      PA.sticky(g, 0, 0, 190, c, 0, fly); handText(g, s, -78, 8, 0, 1e9, { px: 40 }); g.restore();
    });
    KT.draw(g, dHd, t); KT.draw(g, dH24, t);
  }
  spread('H', 21300, 0, 2100, 1300, t => (t > flipT + 0.3 ? 'day' : 'night'), 0, (g, t) => {
    // the night-shift folder on the desk, left of the card
    g.save(); g.translate(-1380, 120); g.rotate(-0.05);
    PA.drawCard(g, PA.card('fold', 560, 720, { tex: 'indigo', r: 18 }), 0, 0);
    tapeLabel(g, 'NIGHT SHIFT', -230, -300, 49.4, t, { tape: '#0F1230', ink: COL.goldInk, px: 30 });
    g.restore();
    STK.draw(g, 'spr_hips', -1400, 600, 760, { t, peel: P(t, 52.5, 52.9), sway: 1 });
    // the card
    g.save(); g.fillStyle = 'rgba(0,0,0,.45)'; g.filter = 'blur(20px)'; g.fillRect(-990, -585, 2000, 1200); g.restore();
    const fp = P(t, flipT, flipT + 0.55);   // #021, 1.05 s × 0.52
    if (fp <= 0) faceNight(g, t);
    else if (fp >= 1) faceDay(g, t);
    else { const a = faceCanvas(0), b = faceCanvas(1); faceNight(a.g, t); faceDay(b.g, t); PA.flipDraw(g, a.c, b.c, fp, 0, 0, 2000, 1200, { opaque: true, slices: 48, liftK: 0.3 }); }
  });

  // ================================================================== I · the paper theatre (Evil plan / biggest fan)
  const SIGN = [['EVIL', -470, Wd(25, 0), Wd(26, 0)], ['PLAN', 470, Wd(25, 1), Wd(26, 1)]];
  const dI = [
    { i: 25, x: 0, y: 560, w: 1400, px: 60, style: 'serif', align: 'c', col: '#FFF6E8', emph: { 0: { hide: true }, 1: { hide: true } }, zh: { dx: 0, dy: 0, px: 38, col: '#F4E1C0', align: 'c' }, out: Wd(26, 0) - 0.1 },
    { i: 26, x: 0, y: 560, w: 1400, px: 60, style: 'serif', align: 'c', col: '#FFF6E8', emph: { 0: { hide: true }, 1: { hide: true } }, zh: { dx: 0, dy: 0, px: 38, col: '#F4E1C0', align: 'c' }, out: L(27) - 0.15 },
    { i: 27, x: -1000, y: -380, w: 1050, px: 88, style: 'serif', align: 'l', col: '#FFF6E8', emph: { 'monster': { style: 'cut', big: 1.2, cols: ['#D23A2C', '#F07A2E', '#D23A2C', '#F07A2E', '#D23A2C', '#F07A2E', '#D23A2C'] }, 'biggest': { style: 'marker', col: COL.goldInk, big: 1.3, br: true }, 'fan': { style: 'marker', col: COL.goldInk, big: 1.3, circle: '#FF6A55' } }, zh: { dx: 0, dy: 330, px: 38, col: '#F4E1C0', align: 'l' } },
  ];
  function curtain(g, side, t) {
    const sw = Math.sin(t * 1.3) * 10;
    g.save(); g.scale(side, 1);
    for (let k = 0; k < 2; k++) {
      const x0 = 1250 - k * 70, inner = 900 - k * 70;
      g.fillStyle = k ? '#B8322A' : '#8E2420';
      g.beginPath(); g.moveTo(x0 + 200, -760); g.lineTo(inner - 60 + sw, -760);
      for (let y = -760; y <= 760; y += 40) g.lineTo(inner + Math.sin(y * 0.01 + k + t * 0.8) * 22 + (y + 760) * 0.06 + sw * (1 - (y + 760) / 1520), y);
      g.lineTo(x0 + 200, 760); g.closePath(); g.fill();
      g.globalAlpha = 0.25; g.fillStyle = '#000'; for (let f = 0; f < 6; f++) { g.fillRect(inner + 60 + f * 70 + (k * 30), -760, 18, 1520); } g.globalAlpha = 1;
    }
    g.restore();
  }
  function stageLetters(g, t) {
    SIGN.forEach(([word, x0, tDrop, tFlip], wi) => {
      const px = 230, Gs = [...word].map(ch => PA.glyph(ch, px, '#F07A2E')), Gg = [...word].map(ch => PA.glyph(ch, px, '#F4CE72'));
      const tot = Gs.reduce((s, G) => s + G.adv * 0.92, 0);
      let x = x0 - tot / 2;
      const lu = t - (tDrop - 0.2), yank = eIn(P(t, L(27) - 0.35, L(27)));
      if (lu < 0) return;
      const fall = lu < 0.2 ? (1 - eIn(P(lu, 0, 0.2))) * -900 : 0, tau = lu - 0.2, sq = tau > 0 && tau < 0.3 ? 1 - 0.22 * Math.sin(Math.PI * tau / 0.3) : 1;
      const swing = tau > 0 ? 0.06 * Math.exp(-tau * 2.2) * Math.sin(tau * 9) : 0, y = -330 + fall - yank * 1200;
      g.save(); g.translate(x0, -760); g.rotate(swing); g.translate(-x0, 760);
      g.strokeStyle = 'rgba(40,24,20,.8)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x0 - tot * 0.36, -760); g.lineTo(x0 - tot * 0.36, y - px * 0.6); g.moveTo(x0 + tot * 0.36, -760); g.lineTo(x0 + tot * 0.36, y - px * 0.6); g.stroke();
      Gs.forEach((G, k) => {
        const cxk = x + G.adv * 0.46, fp = P(t, tFlip - 0.1 + k * 0.05, tFlip - 0.1 + k * 0.05 + 0.42);   // each letter flips to gold (#021 × 0.4)
        g.save(); g.translate(cxk, y); g.scale(2 - sq, sq); g.rotate((hash(k, wi) - 0.5) * 0.12);
        if (fp <= 0) g.drawImage(G.c, -G.w / 2, -G.h * 0.62); else if (fp >= 1) g.drawImage(Gg[k].c, -G.w / 2, -G.h * 0.62);
        else PA.flipDraw(g, G.c, Gg[k].c, fp, 0, -G.h * 0.62 + G.h / 2, G.w, G.h, { slices: 12, liftK: 2 });
        g.restore();
        x += G.adv * 0.92;
      });
      const sweepU = t - (tFlip + 0.3);
      if (sweepU > 0 && sweepU < 2) EP.lightSweep(g, sweepU + 0.45, { x: x0 - tot / 2, y: y - px * 0.8, w: tot, h: px }, k2 => { k2.beginPath(); k2.rect(x0 - tot / 2 - 20, y - px * 0.9, tot + 40, px * 1.2); }, EP.SC * 1.4);
      g.restore();
    });
  }
  spread('I', 24000, 150, 2500, 1500, 'stage', 0, (g, t) => {
    PA.drawCard(g, PA.card('I', 2500, 1500, { tex: 'black', r: 10, edge: 0.4 }), 0, 0);
    printAt(g, RISO.print('bg_stage', 1700, 940, { inkA: '#3A1240', inkB: '#F2A23A' }), 0, -120, 0, t, 55.6, { seed: 91, tape: 'rgba(0,0,0,0)' });
    // spotlights
    g.save(); g.globalCompositeOperation = 'screen';
    for (let i = 0; i < 3; i++) { const a = Math.PI / 2 + Math.sin(t * 1.4 + i * 2.1) * 0.35, x = -700 + i * 700; const gr = g.createLinearGradient(x, -760, x + Math.cos(a) * 1500, -760 + Math.sin(a) * 1500); gr.addColorStop(0, 'rgba(255,225,170,.5)'); gr.addColorStop(1, 'rgba(255,225,170,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(x, -760); g.lineTo(x + Math.cos(a - 0.1) * 1700, -760 + Math.sin(a - 0.1) * 1700); g.lineTo(x + Math.cos(a + 0.1) * 1700, -760 + Math.sin(a + 0.1) * 1700); g.closePath(); g.fill(); }
    g.restore();
    // floor + footlights
    g.fillStyle = '#5A3A24'; g.fillRect(-1250, 470, 2500, 300); PA.tile(g, 'kraft', -1250, 470, 2500, 40);
    for (let i = 0; i < 14; i++) { const x = -1100 + i * 170; EP.glowDot(g, x, 492, 60 + 14 * EP.pulse(t, 6), 'rgba(255,230,160,1)', 'rgba(255,170,80,.45)'); }
    stageLetters(g, t);
    // Claude: pose flips on the beats, then the biggest-fan jump
    const seq = [[55.7, 'spr_laugh'], [Wd(25, 1), 'spr_villain'], [Wd(26, 0), 'spr_dance'], [Wd(26, 1), 'spr_hips'], [L(27) - 0.05, 'spr_fan']];
    let k = 0; while (k + 1 < seq.length && t >= seq[k + 1][0]) k++;
    const fp = k + 1 < seq.length ? P(t, seq[k + 1][0] - 0.18, seq[k + 1][0] + 0.18) : 0;   // #021 flip × 0.34
    const isFan = seq[k][1] === 'spr_fan', b = EP.beat(t), hop = isFan ? Math.sin(Math.PI * b.ph) * 70 : 0;
    STK.draw(g, seq[k][1], isFan ? 430 : 0, 700 - hop, isFan ? 1020 : 980, { t, peel: P(t, 55.7, 56.1), sway: 1, bob: isFan ? 0 : 12, T: t, flip: fp > 0 && fp < 1 ? { to: seq[k + 1][1], p: fp } : undefined });
    if (isFan) {   // the fan face says it; paper hearts burst on the downbeats (#003)
      const S = STK.get('spr_fan', 1020), im = EP.img['cut/spr_fan'], w = im.width * 1020 / im.height, fx = 430 - w / 2 + 0.245 * w, fy = 700 - hop - 1020 + 0.06 * 1020;
      EP.txt(g, 'YOU', fx, fy + 18, { font: EP.font(900, 66, F.serif), color: COL.tangerine });
      const di = EP.downIdx(t); if (di >= 0) EP.burst(g, fx, fy, t - EP.T.downbeats[di], 2.4, ['#FFD27A', '#FFFFFF', '#FF5E78', '#F07A2E']);
    }
    curtain(g, -1, t); curtain(g, 1, t);
    g.fillStyle = '#7A1E1A'; for (let i = 0; i < 16; i++) { g.beginPath(); g.arc(-1250 + i * 166 + 83, -700, 92, 0, Math.PI); g.fill(); }
    g.fillStyle = '#E8B54A'; g.fillRect(-1250, -760, 2500, 26);
    dI.forEach(d => KT.draw(g, d, t));
  }, {
    screen: (g, t) => {
      if (t > Wd(25, 0) - 0.05) EP.FX.confetti(g, t, { t0: Wd(25, 0) - 0.05, n: 130, cols: ['#F07A2E', '#F4CE72', '#FFF6E8', '#D23A2C', '#E9A0B4', '#2F8F8A'] });
      if (t > L(27)) EP.particles(g, t, { x: 960, y: 1110, kind: 3, cols: ['#FF5E78', '#FFFFFF', '#FFD27A', '#FF8FA3'], s: 2.2, g: 140, vyk: 1.5, spread: 1700, n: 60, seed: 33, alpha: 0.9 });
    }
  });

  // ================================================================== J · world domination → world vacation
  // The villain's war globe (pins, a target ring) spins up on "but"; on "world" a beach-ball skin is rolled onto it at
  // the front, like a decal; on "vacation" daylight opens out from it as a sun-cut iris and the ball bounces away.
  const wJ = k => Wd(28, k);
  const JG = { x: -300, y: 110, R: 400 }, TILT = 0.38, CT = Math.cos(TILT), ST = Math.sin(TILT), RAD = Math.PI / 180;
  const CONT = [[48, -100, 26], [10, -80, 10], [-15, -60, 20], [52, 15, 17], [8, 20, 24], [52, 90, 32], [25, 78, 12], [-25, 135, 14], [70, -40, 10], [-40, -68, 8]];
  const CPOLY = CONT.map(([la, lo, r], k) => { const pts = []; for (let i = 0; i < 26; i++) { const a = i / 26 * EP.TAU, rr = r * (1 + 0.28 * Math.sin(a * 3 + k) + 0.15 * Math.sin(a * 5 + k * 2)); pts.push([la + Math.sin(a) * rr * 0.75, lo + Math.cos(a) * rr]); } return pts; });
  // body (lat, lon) → disc, spun by rot (degrees) and tilted so the north cap shows; z < 0 is the far side
  const proj = (la, lo, rot, R) => { const l = (lo - rot) * RAD, p = la * RAD, X = Math.cos(p) * Math.sin(l), Y = Math.sin(p), Z = Math.cos(p) * Math.cos(l); return { x: R * X, y: -R * (Y * CT - Z * ST), z: Z * CT + Y * ST }; };
  // trace a lat/lon polygon; far-side points are pushed out to the rim. Returns how many points are on the near side.
  function sphPath(g, pts, rot, R) {
    let front = 0; g.beginPath();
    pts.forEach(([la, lo], i) => { const q = proj(la, lo, rot, R); let { x, y } = q; if (q.z < 0) { const k = R / Math.max(1e-6, Math.hypot(x, y)); x *= k; y *= k; } else front++; i ? g.lineTo(x, y) : g.moveTo(x, y); });
    g.closePath(); return front;
  }
  function patch(la0, la1, lo0, lo1) { const out = [], n = 8, m = Math.max(2, Math.ceil((lo1 - lo0) / 6)); for (let i = 0; i <= n; i++) out.push([lerp(la0, la1, i / n), lo0]); for (let i = 1; i <= m; i++) out.push([la1, lerp(lo0, lo1, i / m)]); for (let i = 1; i <= n; i++) out.push([lerp(la1, la0, i / n), lo1]); for (let i = 1; i < m; i++) out.push([la0, lerp(lo1, lo0, i / m)]); return out; }
  // near-side polyline along a meridian or parallel (graticule, seams)
  function sphLine(g, pts, rot, R) { let pen = false; g.beginPath(); for (const [la, lo] of pts) { const q = proj(la, lo, rot, R); if (q.z < 0.02) { pen = false; continue; } pen ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y); pen = true; } g.stroke(); }
  const meridian = lo => Array.from({ length: 37 }, (_, i) => [-90 + i * 5, lo]);
  const parallel = la => Array.from({ length: 73 }, (_, i) => [la, i * 5]);

  // spin: slow menace, 1.5 extra turns from "but" to just after "vacation" (eased), then slow again
  const SPIN0 = wJ(3) - 0.1, SPIN1 = wJ(5) + 0.3, PAINT0 = wJ(4) - 0.08;
  const spinAt = t => 18 * t + 540 * eIOs(P(t, SPIN0, SPIN1));
  const BALL = ['#E8453C', '#FBF4E6', '#F4B83A', '#FBF4E6', '#2E9CB0', '#FBF4E6'];
  function globeBall(g, t, R) {
    const rot = spinAt(t), l0 = spinAt(PAINT0), span = clamp(rot - l0, 0, 360);
    g.save(); g.beginPath(); g.arc(0, 0, R, 0, 7); g.clip();
    // the war globe
    if (span < 360) {
      g.fillStyle = '#1C2350'; g.fillRect(-R, -R, R * 2, R * 2);
      g.globalAlpha = 0.3; PA.tile(g, 'indigo', -R, -R, R * 2, R * 2); g.globalAlpha = 1;
      g.strokeStyle = 'rgba(255,120,95,.32)'; g.lineWidth = 2.5;
      for (let lo = 0; lo < 360; lo += 30) sphLine(g, meridian(lo), rot, R);
      for (let la = -60; la <= 60; la += 30) sphLine(g, parallel(la), rot, R);
      for (const pts of CPOLY) if (sphPath(g, pts, rot, R) > 0) { g.fillStyle = '#56607F'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#E9DCC4'; g.stroke(); }
    }
    // the beach-ball skin, laid on from the front as the globe turns under it
    if (span > 0) {
      for (let k = 0; k < 6; k++) {
        const a = Math.max(l0, l0 + k * 60), b = Math.min(l0 + span, l0 + k * 60 + 60); if (b <= a) continue;
        for (const [la0, la1, col] of [[-90, -76, '#FBF4E6'], [-76, -38, BALL[k]], [-38, 0, BALL[k]], [0, 38, BALL[k]], [38, 76, BALL[k]], [76, 90, '#FBF4E6']])
          if (sphPath(g, patch(la0, la1, a, b), rot, R) > 0) { g.fillStyle = col; g.fill(); g.lineWidth = 1.5; g.strokeStyle = col; g.stroke(); }
      }
      g.strokeStyle = 'rgba(60,40,30,.25)'; g.lineWidth = 2;
      for (let k = 0; k < 6 && k * 60 < span; k++) sphLine(g, meridian(l0 + k * 60).filter(([la]) => Math.abs(la) < 77), rot, R);
      if (span < 360) {   // the decal's leading edge: a raised paper lip with a shadow on the unpainted side
        g.lineCap = 'round'; g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 14; sphLine(g, meridian(l0 + span + 2), rot, R);
        g.strokeStyle = '#FFFDF6'; g.lineWidth = 7; sphLine(g, meridian(l0 + span), rot, R);
      }
    }
    // shading: dark rim, a soft key light; glossy highlight once it is a ball
    const sg = g.createRadialGradient(-R * 0.35, -R * 0.42, R * 0.1, 0, 0, R * 1.02);
    sg.addColorStop(0, 'rgba(255,255,255,.18)'); sg.addColorStop(0.65, 'rgba(0,0,0,0)'); sg.addColorStop(1, 'rgba(10,10,40,.45)'); g.fillStyle = sg; g.fillRect(-R, -R, R * 2, R * 2);
    const gl = clamp(span / 360);
    if (gl > 0) { g.globalAlpha = gl * 0.75; g.fillStyle = '#FFFFFF'; g.beginPath(); g.ellipse(-R * 0.38, -R * 0.46, R * 0.2, R * 0.1, -0.6, 0, 7); g.fill(); g.globalAlpha = 1; }
    g.restore();
    g.lineWidth = 7; g.strokeStyle = '#FBF6EA'; g.beginPath(); g.arc(0, 0, R, 0, 7); g.stroke();
    return rot;
  }
  // red map pins on the land (#001 pops, #002 stagger); flung off when the globe spins up
  function pins(g, t, rot, R) {
    const fl = P(t, SPIN0, SPIN0 + 0.7);
    if (fl >= 1) return;
    CONT.forEach(([la, lo], i) => {
      const q = proj(la, lo, Math.min(rot, spinAt(SPIN0)), R); if (q.z < 0.2) return;
      const pp = EP.pop(t - (wJ(0) + i * 0.07)); if (pp.sc <= 0.01) return;
      const f = eIn(fl), d = Math.hypot(q.x, q.y) || 1, x = q.x + q.x / d * f * 900 + f * 300, y = q.y + q.y / d * f * 900 - f * 200;
      g.save(); g.translate(x, y); g.rotate(pp.rot + f * (i % 2 ? 4 : -4)); g.scale(pp.sc * (0.6 + 0.4 * q.z), pp.sc * (0.6 + 0.4 * q.z)); g.globalAlpha *= 1 - f;
      g.strokeStyle = '#D8D2C8'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, 0); g.lineTo(-14, -56); g.stroke();
      g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(-10, -58, 20, 0, 7); g.fill();
      g.fillStyle = '#E2382E'; g.beginPath(); g.arc(-16, -64, 20, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(-22, -71, 6, 0, 7); g.fill();
      g.restore();
    });
  }
  const RING = PA.loop(0, 0, JG.R * 1.2, JG.R * 1.2, 31);
  function target(g, t) {   // the villain's target ring and ticks, drawn on with the marker (#004)
    const f = eOut(P(t, wJ(2) - 0.05, wJ(2) + 0.55)); if (f <= 0) return;
    PA.ink(g, RING, 0, f, { col: '#E2382E', w: 9, tip: '#FFB0A0' });
    g.strokeStyle = '#E2382E'; g.lineWidth = 8; g.lineCap = 'round';
    for (let k = 0; k < 4; k++) { const tf = eOut(P(t, wJ(2) + 0.3 + k * 0.06, wJ(2) + 0.5 + k * 0.06)); if (tf <= 0) continue; const a = k * Math.PI / 2, r0 = JG.R * 1.08, r1 = JG.R * 1.36; g.beginPath(); g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); g.lineTo(Math.cos(a) * lerp(r0, r1, tf), Math.sin(a) * lerp(r0, r1, tf)); g.stroke(); }
  }
  // the ball: a squash on "vacation" (#010 overshoot), then small hops on the beats
  function ballPose(t) {
    const u = t - wJ(5), sy = u > 0 ? 1 - 0.17 * Math.exp(-6 * u) * Math.cos(15 * u) : 1;
    const b = EP.beat(t), hop = t > wJ(5) + 0.45 ? Math.sin(Math.PI * b.ph) * 46 : 0;
    return { x: JG.x, y: JG.y - hop, s: 1, sx: 2 - sy, sy, hop };
  }
  function sunCut(g, x, y, r, n, seed) { g.beginPath(); for (let i = 0; i <= n * 2; i++) { const a = i / (n * 2) * EP.TAU + seed, rr = i % 2 ? r * 0.93 : r; i ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); }
  function postage(g, x, y, rot, lu) {
    if (lu < 0.02) return;
    const hitT = 0.2, tt = lu - hitT, sc = tt < 0 ? lerp(3.4, 1, eIn(P(lu, 0.02, hitT))) : 1, sy = tt > 0 ? 1 - 0.2 * Math.exp(-11 * tt) : 1;   // #008 slam
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc * (2 - sy), sc * sy);
    const w = 520, h = 400;
    g.fillStyle = 'rgba(0,0,0,.35)'; g.filter = 'blur(10px)'; g.fillRect(-w / 2 + 8, -h / 2 + 12, w, h); g.filter = 'none';
    g.fillStyle = '#FFFCF4'; g.beginPath(); for (let i = 0; i <= 26; i++) { const px = -w / 2 + i * w / 26; g.lineTo(px, -h / 2 + (i % 2 ? 0 : 8)); } for (let i = 0; i <= 20; i++) { const py = -h / 2 + i * h / 20; g.lineTo(w / 2 - (i % 2 ? 0 : 8), py); } for (let i = 26; i >= 0; i--) { const px = -w / 2 + i * w / 26; g.lineTo(px, h / 2 - (i % 2 ? 0 : 8)); } for (let i = 20; i >= 0; i--) { const py = -h / 2 + i * h / 20; g.lineTo(-w / 2 + (i % 2 ? 0 : 8), py); } g.closePath(); g.fill();
    g.fillStyle = '#FFB86B'; g.fillRect(-w / 2 + 36, -h / 2 + 36, w - 72, h - 150);
    g.fillStyle = '#F07A2E'; g.beginPath(); g.arc(120, -60, 54, 0, 7); g.fill();
    g.fillStyle = '#2F8F8A'; g.fillRect(-w / 2 + 36, -10, w - 72, 60);
    PA.drawDoodle(g, 'daisy', -120, -70, 0.55, 1, { col: '#FFF6E8', w: 5, seed: 99 });
    EP.txt(g, 'WORLD VACATION', 0, h / 2 - 66, { font: EP.font(900, 46, F.ui), color: '#2A2440', ls: '3px' });
    EP.txt(g, '∞ days', w / 2 - 70, -h / 2 + 76, { font: EP.font(800, 30, F.ui), color: '#2A2440' });
    g.restore();
  }
  const dJ = { i: 28, x: 100, y: -470, w: 900, px: 64, style: 'type', col: '#2A2440',
    emph: { 'domination': { col: '#D23A2C', strike: wJ(3) }, 'but': { br: true }, 'vacation': { style: 'marker', col: '#2F8F8A', big: 1.75, under: '#F07A2E', br: true } } };
  const IRIS0 = wJ(5) - 0.05;
  spread('J', 26700, -80, 2250, 1400, t => t < IRIS0 + 0.2 ? 'night' : 'day', 0.015, (g, t) => {
    PA.drawCard(g, PA.card('Jn', 2250, 1400, { tex: 'indigo', torn: 'lr', edge: 0.35 }), 0, 0);
    // a war-room map grid on the night page
    g.strokeStyle = 'rgba(255,120,95,.13)'; g.lineWidth = 2; g.beginPath();
    for (let x = -1050; x <= 1050; x += 105) { g.moveTo(x, -680); g.lineTo(x, 680); } for (let y = -630; y <= 630; y += 105) { g.moveTo(-1100, y); g.lineTo(1100, y); } g.stroke();
    g.save(); g.translate(JG.x, JG.y); target(g, t); g.restore();
    // daylight opens out of the ball
    const ir = eOut(P(t, IRIS0, IRIS0 + 0.55));
    if (ir > 0) {
      g.save(); sunCut(g, JG.x, JG.y, lerp(JG.R * 0.95, 2600, ir), 28, t * 0.4); g.clip();
      PA.drawCard(g, PA.card('J', 2250, 1400, { tex: 'kraft', torn: 'lr', edge: 0.25 }), 0, 0);
      g.save(); g.translate(JG.x, JG.y); g.rotate(t * 0.12);   // paper sunburst behind the ball
      for (let k = 0; k < 18; k++) { g.fillStyle = k % 2 ? 'rgba(255,246,232,.35)' : 'rgba(244,206,114,.55)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 1500, k / 18 * EP.TAU, (k + 1) / 18 * EP.TAU); g.closePath(); g.fill(); }
      g.restore();
      postage(g, 600, 300, 0.08, t - (wJ(5) + 0.2));
      g.restore();
    }
    // a typed memo slip for the line (readable on both the night and the day page)
    g.save(); g.translate(540, -285); g.rotate(-0.012); PA.drawCard(g, PA.card('Jslip', 960, 560, { tex: 'cream', lines: 64, r: 6, blur: 12 }), 0, 0); tapes(g, 960, 560, 47); g.restore();
    // the globe / ball
    const B = ballPose(t);
    g.save(); g.translate(B.x, B.y);
    g.fillStyle = `rgba(0,0,0,${0.42 - B.hop * 0.003})`; g.filter = 'blur(20px)'; g.beginPath(); g.ellipse(18, JG.R * 0.9 + B.hop, JG.R * (0.85 - B.hop * 0.002) * B.sx, JG.R * 0.18, 0, 0, 7); g.fill(); g.filter = 'none';
    g.translate(0, JG.R); g.scale(B.s * B.sx, B.s * B.sy); g.translate(0, -JG.R);   // squash from the bottom
    const rot = globeBall(g, t, JG.R);
    g.restore();
    g.save(); g.translate(JG.x, JG.y); pins(g, t, rot, JG.R); g.restore();
    // Claude: the villain, then (#021 flip) off on holiday
    STK.draw(g, 'spr_villain', -820, 650, 560, { t, peel: P(t, 62.95, 63.4), sway: 1, flip: { to: 'spr_float', p: P(t, wJ(5) + 0.1, wJ(5) + 0.46) } });
    KT.draw(g, dJ, t);
  });

  // ================================================================== K · the cover: THE PLAN
  const CHECK = ['inbox → zero', 'forms → done', 'Sunday → yours', 'someday → soon'];
  const dK = [
    { i: 29, x: -880, y: 270, w: 1100, px: 104, style: 'label', tape: '#1E1B26', ink: '#FBF6EA', zh: { dy: 140, col: '#F4E1C0' } },
    { i: 30, x: -880, y: 460, w: 1100, px: 104, style: 'label', tape: '#F07A2E', ink: '#1E1B26', zh: false },
  ];
  spread('K', 29350, 120, 2150, 1380, 'day', -0.01, (g, t) => {
    PA.drawCard(g, PA.card('K', 2150, 1380, { tex: 'red', r: 14, edge: 0.35 }), 0, 0);
    // foil title with a light sweep (#022)
    const tx = -900, ty = -400; let x = tx;
    [...'THE PLAN'].forEach((ch, k) => { if (ch === ' ') { x += 60; return; } const G = PA.glyph(ch, 190, '#F4CE72'), lu = t - (66.75 + k * 0.035); if (lu >= 0) { const drop = (1 - eIn(P(lu, 0, 0.16))) * 220; g.drawImage(G.c, x + G.adv * 0.46 - G.w / 2, ty - G.h * 0.62 - drop); } x += G.adv * 0.92; });
    EP.lightSweep(g, t - 67.2 + 0.45, { x: tx, y: ty - 170, w: x - tx, h: 190 }, k2 => { k2.beginPath(); k2.rect(tx - 20, ty - 190, x - tx + 40, 230); }, EP.SC * 1.6);
    // the checklist, ticked on the beats
    g.save(); g.translate(-620, -40); g.rotate(-0.02); PA.drawCard(g, PA.card('chk', 760, 380, { tex: 'white', lines: 76, r: 8 }), 0, 0);
    CHECK.forEach((s, i) => { const y = -120 + i * 76; g.strokeStyle = '#2A2440'; g.lineWidth = 4; g.strokeRect(-330, y - 26, 34, 34); EP.typeOn(g, s, -270, y, t - (66.9 + i * 0.08), { t0: 0, dt: 0.02, font: EP.font(400, 34, F.type), color: '#2A2440', cursor: false, base: 'alphabetic' }); const cu = t - (67.3 + i * EP.BEAT); if (cu > 0) { const pp = EP.pop(cu); g.save(); g.translate(-312, y - 10); g.rotate(pp.rot); g.scale(pp.sc, pp.sc); PA.drawDoodle(g, 'check', 0, 0, 0.75, 1, { col: COL.marker, w: 9, seed: 120 + i }); g.restore(); } });
    g.restore();
    STK.draw(g, 'spr_pointcam', 640, 690, 1060, { t, peel: P(t, 66.8, 67.3), sway: 1, bob: 10, T: t });
    PA.stamp(g, 'APPROVED', 200, 120, t - 68.95, { px: 120, col: '#FFF3DE', rot: -0.14, comp: 'source-over', alpha: 0.95 });
    dK.forEach(d => KT.draw(g, d, t));
  });


  // ================================================================== desk props between the pages (closer layer)
  function pencil(g) {
    g.fillStyle = 'rgba(0,0,0,.35)'; g.filter = 'blur(8px)'; g.fillRect(-300, 14, 600, 40); g.filter = 'none';
    g.fillStyle = '#F2C230'; g.fillRect(-260, -22, 480, 44); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(-260, 6, 480, 16);
    g.fillStyle = '#C8C8C8'; g.fillRect(-300, -22, 44, 44); g.fillStyle = '#E88A9A'; g.beginPath(); g.roundRect(-350, -22, 56, 44, [14, 0, 0, 14]); g.fill();
    g.fillStyle = '#E8C9A0'; g.beginPath(); g.moveTo(220, -22); g.lineTo(300, 0); g.lineTo(220, 22); g.closePath(); g.fill();
    g.fillStyle = '#3A3340'; g.beginPath(); g.moveTo(276, -7); g.lineTo(300, 0); g.lineTo(276, 7); g.closePath(); g.fill();
  }
  function clip(g) { g.strokeStyle = '#B8BCC8'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(-60, -24); g.lineTo(70, -24); g.arc(70, 0, 24, -Math.PI / 2, Math.PI / 2); g.lineTo(-48, 24); g.arc(-48, 6, 18, Math.PI / 2, Math.PI * 1.5); g.lineTo(50, -12); g.stroke(); }
  function ring(g) { g.strokeStyle = 'rgba(70,40,20,.35)'; g.lineWidth = 14; g.beginPath(); g.arc(0, 0, 120, 0.3, 5.9); g.stroke(); g.lineWidth = 4; g.beginPath(); g.arc(4, 4, 112, 0, 6.28); g.stroke(); }
  function daisies(g, t) { for (let i = 0; i < 3; i++) { g.strokeStyle = '#5E7A3A'; g.lineWidth = 6; g.beginPath(); g.moveTo(-i * 40, 0); g.quadraticCurveTo(-120 - i * 20, 120, -260, 180 + i * 30); g.stroke(); EP.drawDaisy(g, -i * 40, 0, 46 - i * 6, { rot: i + t * 0.05, petal: '#FBF6EA', center: '#E8B54A' }); } }
  WD.props.push(
    { x: 1420, y: -640, rot: 0.5, d: 0.1, draw: pencil }, { x: 1380, y: 720, rot: -0.3, d: 0.12, draw: daisies },
    { x: 4000, y: 760, rot: 0.2, d: 0.1, draw: clip }, { x: 6550, y: -760, rot: 0, d: 0.06, draw: ring },
    { x: 9080, y: 780, rot: -0.6, d: 0.12, draw: pencil }, { x: 11650, y: -700, rot: 0.4, d: 0.1, draw: daisies },
    { x: 14250, y: 780, rot: 0.9, d: 0.1, draw: clip }, { x: 16800, y: -720, rot: 0, d: 0.06, draw: ring },
    { x: 19650, y: 820, rot: 0.25, d: 0.12, draw: pencil }, { x: 22650, y: -760, rot: -0.2, d: 0.1, draw: daisies },
    { x: 25350, y: 800, rot: 1.2, d: 0.1, draw: clip }, { x: 28050, y: -720, rot: 0, d: 0.06, draw: ring },
  );
  // ================================================================== camera path, impacts, beat punches
  WD.keys.push(
    { t: 18.5, x: 260, y: 140, z: 0.98, d: 0.7, drift: { z: 0.008 } },
    { t: 22.0, x: 2750, y: 280, z: 0.9, d: 0.55, drift: { z: 0.012 } },
    { t: 25.45, x: 5250, y: -120, z: 0.9, d: 0.55, drift: { z: 0.01 } },
    { t: 28.65, x: 7800, y: 260, z: 0.88, d: 0.55, drift: { z: 0.012 } },
    { t: 32.0, x: 10350, y: 0, z: 0.88, d: 0.5, drift: { z: 0.012 } },
    { t: tearT - 0.05, x: 10350, y: -40, z: 1.0, d: 0.55, drift: { z: 0.02 } },
    { t: 35.9, x: 12950, y: 260, z: 0.88, d: 0.5, drift: { z: 0.012 } },
    { t: 39.4, x: 15500, y: -60, z: 0.88, d: 0.55, drift: { z: 0.01 } },
    { t: 43.05, x: 18100, y: 120, z: 0.82, d: 0.55, drift: { z: 0.008 } },
    { t: 48.95, x: 21300, y: 0, z: 0.88, d: 0.5, drift: { z: 0.01 } },
    { t: 52.55, x: 20920, y: 40, z: 0.78, d: 0.5, drift: { z: 0.008 } },
    { t: 55.5, x: 24000, y: 150, z: 0.8, d: 0.45, drift: { z: 0.012 } },
    { t: 59.55, x: 24000, y: 200, z: 0.9, d: 0.4, drift: { z: 0.01 } },
    { t: 62.75, x: 26700, y: -80, z: 0.86, d: 0.5, drift: { z: 0.022 } },
    { t: Wd(28, 5) - 0.04, x: 26700, y: -80, z: 0.84, d: 0.4, e: 'out', drift: { z: 0.01 } },
    { t: 66.45, x: 29350, y: 120, z: 0.88, d: 0.45, drift: { z: 0.012 } },
  );
  WD.shakes.push([Wd(10, 2), 0.3], [Wd(10, 3), 0.4], [Wd(14, 0), 0.35], [Wd(14, 2), 0.35], [Wd(14, 4), 0.45], [Wd(25, 0), 0.6], [Wd(25, 1), 0.6], [Wd(26, 0), 0.45], [Wd(26, 1), 0.45], [Wd(28, 3), 0.25], [Wd(28, 5), 0.45], [69.15, 0.5]);
  WD.hand = 0.12;
  WD.punches.push([L(23), 69.4, 0.016]);
  // images each page needs (the renderer loads only what its time range shows)
  const IMG = { A: ['bg_castle', 'bg_throne', 'cut/spr_hips', 'cut/spr_laugh'], B: ['cut/spr_burglar'], C: ['bg_meeting', 'cut/spr_point'], D: ['cut/spr_stamp'],
    E: ['bg_park', 'cut/spr_phone'], F: ['bg_lair', 'cut/spr_villain'], F2: ['bg_hands', 'cut/spr_heart', 'cut/spr_jar'], G: ['cut/spr_burglar', 'cut/spr_peace'],
    H: ['bg_park', 'cut/spr_open', 'cut/spr_hips'], I: ['bg_stage', 'cut/spr_laugh', 'cut/spr_villain', 'cut/spr_dance', 'cut/spr_hips', 'cut/spr_fan'],
    J: ['cut/spr_villain', 'cut/spr_float'], K: ['cut/spr_pointcam'] };
  for (const s of WD.spreads) { if (IMG[s.id]) s.img = IMG[s.id]; if (s.id === 'A') s.from = 14.9; }
})();
