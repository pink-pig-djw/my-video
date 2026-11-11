// scenes_c.js — the bedtime bridge, the hundred-year interlude, "I hope you get old", the different ending,
// the final chorus, the montage and the end card.
'use strict';
(function () {
  const { W, H, C, F, clamp, lerp, P, eIO, eIOs, eOut, eOut5, eIn, backOut, backIn, spring, smooth, hash, noise, mod } = EP;
  const S = EP.scenes, FX = EP.FX, BG = EP.BG, UI = EP.UI;

  // ------------------------------------------------------------------ small clock overlay
  EP.UI.clock = (g, t, f, lt) => {
    const a = P(lt, f.at || 0, (f.at || 0) + 0.4); if (a <= 0) return;
    g.save(); g.globalAlpha = a; g.fillStyle = 'rgba(10,10,24,.55)'; EP.rr(g, f.x - 130, f.y - 46, 260, 92, 22); g.fill();
    EP.digits(g, f.text, f.x, f.y + 2, EP.font(800, 54, F.ui), f.col || '#FFE2A8');
    g.restore();
  };
  // ------------------------------------------------------------------ jump cut (#041): same framing, the clock and the tally jump
  // Motion Prompt #041 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#041
  // A straight cut with no effect; 5 equal shots (0.94 s each in the sample, ×0.75 here); identical framing, only what
  // happened in between changes; the clock jumps forward each time.
  S.jumpcut = (g, lt, p, t, Sh) => {
    const n = Math.min(4, Math.floor(lt / (Sh.dur / 5)));
    EP.cover(g, 'bg_doorway', { x: 0.45, y: 0.45, z: 1.06 });
    g.fillStyle = `rgba(10,12,30,${0.05 + n * 0.06})`; g.fillRect(0, 0, W, H);   // the room gets darker as it gets later
    const times = ['8:00', '8:22', '8:47', '9:12', '9:30'];
    UI.clock(g, t, { x: 1690, y: 120, text: times[n] }, 1);
    // tally marks on a sticky note by the door (the kid counting)
    g.save(); g.translate(330, 330); g.rotate(-0.05); g.fillStyle = '#FFE37A'; g.fillRect(-80, -70, 160, 140);
    g.strokeStyle = '#3A2A20'; g.lineWidth = 6; g.lineCap = 'round';
    const marks = [1, 3, 5, 7, 9][n];
    for (let i = 0; i < marks; i++) { const grp = Math.floor(i / 5), k = i % 5; g.beginPath(); if (k < 4) { g.moveTo(-55 + grp * 70 + k * 13, -40); g.lineTo(-55 + grp * 70 + k * 13, 40); } else { g.moveTo(-62 + grp * 70, 30); g.lineTo(-4 + grp * 70, -30); } g.stroke(); }
    g.restore();
  };
  // ------------------------------------------------------------------ a thousand tales in half a second (#015 burst of books, #007 count)
  S.tales = (g, lt, p, t, Sh) => {
    BG.radial(g, t, { x: 960, y: 520, r: 1300, stops: [[0, '#1E3A6E'], [1, '#070A18']] });
    const X = 960, Y = 520;
    g.save(); g.shadowColor = 'rgba(120,180,255,.6)'; g.shadowBlur = 60; g.fillStyle = '#0F1830'; EP.rr(g, X - 520, Y - 320, 1040, 640, 30); g.fill(); g.restore();
    g.fillStyle = '#16274E'; EP.rr(g, X - 490, Y - 290, 980, 580, 18); g.fill();
    const t0 = EP.Wd(124, 1) - Sh.t;   // books start pouring out on "write"
    for (let i = 0; i < 260; i++) {
      const u = lt - t0 - hash(i, 1) * 0.5; if (u < 0) continue;
      const a = hash(i, 2) * EP.TAU, sp = 500 + hash(i, 3) * 1400, x = X + Math.cos(a) * sp * u, y = Y + Math.sin(a) * sp * u * 0.62 + 200 * u * u;
      if (x < -60 || x > W + 60 || y > H + 60) continue;
      g.save(); g.translate(x, y); g.rotate(u * (hash(i, 4) - 0.5) * 8); const s = 0.6 + hash(i, 5) * 0.8;
      g.fillStyle = ['#F28C38', '#4A7BD6', '#E8645A', '#5BB585', '#F5C542', '#8E6CC8'][i % 6]; g.fillRect(-22 * s, -30 * s, 44 * s, 60 * s); g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(-18 * s, -30 * s, 6 * s, 60 * s);
      g.restore();
    }
    // 0 → 1,000 in half a second (#007 curve, its 2.45 s count compressed to 0.5 s)
    const v = EP.countVal(P(lt, t0, t0 + 0.5), 0, 1000), land = lt - t0 - 0.5;
    g.save(); g.translate(X, Y - 20); const k = EP.landPop(land); g.scale(k, k);
    EP.digits(g, v.toLocaleString('en-US'), 0, 0, EP.font(900, 190, F.serif), land > 0 ? C.gold : '#EAF2FF');
    EP.txt(g, 'stories', 0, 120, { font: 'italic ' + EP.font(600, 56, F.serif), color: '#BFD3F5' });
    g.restore();
    EP.txt(g, '0.5 s', X + 380, Y - 200, { font: EP.font(800, 40, F.ui), color: 'rgba(191,211,245,.7)' });
  };
  // ------------------------------------------------------------------ a dragon, a rocket and a talking cat (crayon line drawings)
  function strokePath(g, pts, pr) { if (pr <= 0) return; const n = Math.max(2, Math.floor(pts.length * pr)); g.beginPath(); for (let i = 0; i < n; i++) { const [x, y] = pts[i]; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
  function sampled(fn, N) { const a = []; for (let i = 0; i <= N; i++) a.push(fn(i / N)); return a; }
  const DRAG = (() => {   // a chubby little dragon, side view, facing right
    const ell = (cx, cy, rx, ry, a0 = 0, a1 = EP.TAU) => sampled(u => { const a = a0 + (a1 - a0) * u; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; }, 60);
    const body = ell(-10, 40, 125, 88);
    const belly = ell(10, 70, 70, 42, 0.2, Math.PI - 0.2);
    const head = sampled(u => { const a = u * EP.TAU; return [150 + Math.cos(a) * (a > -0.6 && a < 0.9 || a > 5.7 ? 82 : 60), -70 + Math.sin(a) * 52]; }, 70);
    const horns = [[118, -112], [112, -168], [140, -118], [150, -120], [160, -172], [176, -112]];
    const eye = ell(160, -84, 10, 13);
    const wing = [[-40, -40], [-70, -170], [-30, -120], [0, -175], [20, -112], [55, -150], [50, -52]];
    const spikes = sampled(u => [-120 + u * 200, -40 - 40 * Math.sin(Math.PI * u) - (Math.floor(u * 8) % 2 ? 0 : 22)], 32);
    const tail = sampled(u => [-130 - u * 150, 60 - 90 * u + 40 * Math.sin(u * 7)], 40).concat([[-262, -50], [-300, -70], [-268, -18], [-280, -30]]);
    const legs = [[-60, 118], [-60, 150], [-30, 150], [-30, 120], [40, 124], [40, 152], [70, 152], [70, 118]];
    const fire = ell(260, -60, 16, 16).concat(ell(296, -72, 22, 22), ell(342, -88, 28, 28));
    return [body, belly, head, horns, eye, wing, spikes, tail, legs, fire];
  })();
  const ROCKET = (() => {
    const hull = sampled(u => { const a = u * EP.TAU; return [Math.sin(a) * 70 * (a < Math.PI ? 1 : 1), -Math.cos(a) * 190 + (Math.cos(a) < 0 ? -40 * Math.pow(-Math.cos(a), 3) : 0)]; }, 80);
    const fin1 = [[-70, 120], [-130, 200], [-60, 170]], fin2 = [[70, 120], [130, 200], [60, 170]];
    const win = sampled(u => { const a = u * EP.TAU; return [Math.cos(a) * 32, -60 + Math.sin(a) * 32]; }, 40);
    const flame = sampled(u => [-40 + u * 80, 200 + 70 * Math.sin(u * Math.PI) + 15 * Math.sin(u * 20)], 40);
    return [hull, fin1, fin2, win, flame];
  })();
  const CAT = (() => {
    const head = sampled(u => { const a = u * EP.TAU; return [Math.cos(a) * 110, Math.sin(a) * 90]; }, 70);
    const ear1 = [[-95, -40], [-80, -140], [-30, -85]], ear2 = [[95, -40], [80, -140], [30, -85]];
    const eye1 = sampled(u => { const a = u * EP.TAU; return [-40 + Math.cos(a) * 14, -10 + Math.sin(a) * 18]; }, 24), eye2 = eye1.map(([x, y]) => [x + 80, y]);
    const mouth = sampled(u => [-25 + u * 50, 35 + 12 * Math.sin(u * EP.TAU)], 20);
    const wh = [[-60, 25], [-150, 10], [-60, 40], [-150, 50], [60, 25], [150, 10], [60, 40], [150, 50]];
    return [head, ear1, ear2, eye1, eye2, mouth, wh.slice(0, 2), wh.slice(2, 4), wh.slice(4, 6), wh.slice(6, 8)];
  })();
  S.doodles = (g, lt, p, t, Sh) => {
    BG.paper(g, t, { col: '#FBF3E4', a: 0.7 });
    const wd = j => EP.Wd(p.line, j) - Sh.t;
    const draw = (shape, x, y, s, col, t0, dur) => {
      g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = col; g.lineWidth = 9 / s; g.lineCap = 'round'; g.lineJoin = 'round';
      shape.forEach((pts, i) => strokePath(g, pts, eIO(P(lt, t0 + i * dur / shape.length, t0 + (i + 1) * dur / shape.length))));
      g.restore();
    };
    const wob = k => Math.sin(t * 3 + k) * 0.02;
    g.save(); g.translate(0, 0);
    draw(DRAG, 520, 560, 1.15 + wob(1), '#2E8B57', wd(3) - 0.4, 1.0);
    draw(ROCKET, 1060, 520, 1.1, '#E2453A', wd(6) - 0.4, 0.8);
    draw(CAT, 1520, 600, 1.15, '#F28C38', EP.Wd(p.line + 1, 3) - Sh.t - 0.5, 1.0);
    // the cat talks
    UI.bubble(g, t, { x: 1600, y: 330, text: 'hi there!', at: EP.Wd(p.line + 1, 4) - Sh.t, px: 40, tail: 'left', col: '#3A2A20' }, lt);
    g.restore();
    FX.sparkle(g, t, { n: 8, col: '#F5C542' });
  };
  // ------------------------------------------------------------------ the perfect books fade, one worn book stays
  S.perfect = (g, lt, p, t, Sh) => {
    BG.radial(g, t, { x: 960, y: 600, r: 1200, stops: [[0, '#3A2A24'], [1, '#0E0A0E']] });
    const fade = eIO(P(lt, 0.4, 2.2));
    for (let i = 0; i < 40; i++) {
      const col = i % 8, row = Math.floor(i / 8), x = 260 + col * 200, y = 200 + row * 150 - fade * (200 + hash(i, 1) * 300);
      g.save(); g.globalAlpha = (1 - fade) * 0.9; g.translate(x, y); g.rotate((hash(i, 2) - 0.5) * 0.2 + fade * (hash(i, 3) - 0.5) * 2);
      g.fillStyle = '#D9B25A'; g.fillRect(-60, -70, 120, 140); g.fillStyle = '#F5D88A'; g.fillRect(-60, -70, 12, 140); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 3; g.strokeRect(-40, -40, 80, 30);
      g.restore();
    }
    // the worn book with the taped spine, in a warm pool of light
    const a = eOut(P(lt, 0.6, 1.6));
    g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = a; EP.glowDot(g, 960, 700, 520, 'rgba(255,200,130,.7)', 'rgba(255,160,90,.25)'); g.restore();
    g.save(); g.globalAlpha = a; g.translate(960, 700); g.rotate(-0.06);
    g.fillStyle = '#2E6E8E'; EP.rr(g, -190, -130, 380, 260, 10); g.fill();
    g.fillStyle = '#F3E6C8'; g.fillRect(-190, -10, 380, 22); g.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 6; i++) g.fillRect(-180 + i * 64, -6, 40, 14);
    g.strokeStyle = 'rgba(255,240,200,.75)'; g.lineWidth = 4; g.beginPath(); g.moveTo(-120, -80); g.quadraticCurveTo(-60, -110, 0, -80); g.stroke();
    EP.drawDaisy(g, 110, -70, 34, { petal: '#FFF8EC', center: C.gold });
    g.restore();
  };
  // ------------------------------------------------------------------ silly voices around the waiting kid
  S.voices = (g, lt, p, t, Sh) => {
    EP.imgShot(g, lt, { img: 'bg_doorway', cam: [{ x: 0.2, y: 0.42, z: 1.9 }, { x: 0.21, y: 0.4, z: 2.05 }] }, t, Sh.dur);
    const words = [['ROAR?!', 520, 260, -0.2, '#2E8B57'], ['beep boop', 1450, 330, 0.12, '#E2453A'], ['meow…', 560, 820, 0.1, '#F28C38'], ['RAWR', 1400, 760, -0.1, '#8E6CC8']];
    words.forEach(([s, x, y, r, col], i) => {
      const u = lt - 0.3 - i * 0.55; if (u < 0) return;
      const pp = EP.pop(u);
      g.save(); g.translate(x + Math.sin(t * 4 + i) * 10, y + Math.cos(t * 3 + i) * 8); g.rotate(r + Math.sin(t * 5 + i) * 0.06); g.scale(pp.sc, pp.sc);
      EP.txt(g, s, 0, 0, { font: EP.font(700, 96, F.hand), color: col, stroke: '#FFF6E8', lw: 10 });
      g.restore();
    });
  };
  // ------------------------------------------------------------------ "I tell his dad: Go hold him." (#006 typewriter field + send)
  S.tell = (g, lt, p, t, Sh) => {
    EP.imgShot(g, lt, { img: 'bg_doorway', cam: [{ x: 0.62, y: 0.5, z: 1.25 }, { x: 0.6, y: 0.5, z: 1.32 }] }, t, Sh.dur);
    g.fillStyle = 'rgba(8,10,26,.35)'; g.fillRect(0, 0, W, H);
    // a message rises from the laptop and types itself
    const X = 1080, Y = 700, BW = 760, BH = 120, rise = eOut5(P(lt, 0, 0.5));
    g.save(); g.translate(0, (1 - rise) * 120); g.globalAlpha = rise;
    g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 40; g.shadowOffsetY = 14; g.fillStyle = '#FFFFFF'; EP.rr(g, X - BW / 2, Y - BH / 2, BW, BH, 40); g.fill(); g.shadowColor = 'transparent';
    g.fillStyle = C.orange; g.beginPath(); g.arc(X - BW / 2 + 60, Y, 34, 0, 7); g.fill(); EP.drawDaisy(g, X - BW / 2 + 60, Y, 26, { petal: C.cream, center: '#FFD27A' });
    const tt = lt - (EP.Wd(133, 0) - Sh.t) + 0.3, s = 'Go hold him.';
    const r = EP.typeOn(g, s, X - BW / 2 + 120, Y + 2, tt, { t0: 0.3, dt: 0.1, font: EP.font(800, 48, F.ui), color: C.ink, cursorH: 50 });
    // send button (#006: blue disc springs in after typing, presses)
    const done = 0.3 + [...s].length * 0.1, on = spring(tt - done - 0.12, 15, 6.5), press = 1 - 0.2 * Math.sin(Math.PI * P(tt, done + 0.5, done + 0.75));
    const bx = X + BW / 2 - 64;
    g.fillStyle = '#E9DFD2'; g.beginPath(); g.arc(bx, Y, 38, 0, 7); g.fill();
    if (on > 0.01) { g.fillStyle = C.orange; g.beginPath(); g.arc(bx, Y, 38 * Math.min(on, 1.25) * press, 0, 7); g.fill(); }
    g.strokeStyle = '#fff'; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(bx, Y + 15); g.lineTo(bx, Y - 15); g.moveTo(bx - 13, Y - 2); g.lineTo(bx, Y - 16); g.lineTo(bx + 13, Y - 2); g.stroke();
    g.restore();
  };
  // ------------------------------------------------------------------ the hundred-year interlude (black, silence, then 2026 → 2126)
  const CENT = ['bg_kid_bed', 'bg_mom_relief', 'bg_feast', 'bg_painter', 'bg_park', 'bg_hug_read', 'bg_cake', 'bg_old_man', 'bg_sunrise'];
  S.century = (g, lt, p, t, Sh) => {
    EP.fill(g, '#000');
    const tOn = p.musicAt - Sh.t;   // music returns
    if (lt < tOn) {
      // a lone cursor blinking in the dark (#006 cursor: 0.94 s period, on 0.5 s)
      if (lt > 0.9 && mod(lt, 0.94) < 0.5) { g.fillStyle = C.orange; EP.rr(g, W / 2 - 4, H / 2 - 30, 8, 60, 3); g.fill(); }
      return;
    }
    const u = lt - tOn, span = Sh.dur - tOn, per = span / CENT.length;
    const i = Math.min(CENT.length - 1, Math.floor(u / per)), f = (u - i * per) / per;
    EP.cover(g, CENT[i], { z: 1.06 + 0.06 * f, x: 0.5 + 0.03 * (i % 2 ? f : -f) });
    if (i + 1 < CENT.length && f > 0.75) { g.globalAlpha = eIOs((f - 0.75) / 0.25); EP.cover(g, CENT[i + 1], { z: 1.06 }); g.globalAlpha = 1; }
    g.fillStyle = `rgba(0,0,0,${0.45 * (1 - eOut(P(u, 0, 0.8))) + 0.25})`; g.fillRect(0, 0, W, H);
    // year counter (#007): 2026 → 2126
    const v = EP.countVal(P(u, 0.3, span - 0.6), 2026, 2126), land = u - (span - 0.6);
    g.save(); g.translate(W / 2, H / 2 - 30); const k = EP.landPop(land); g.scale(k, k); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30;
    EP.digits(g, String(v), 0, 0, EP.font(900, 260, F.serif), land > 0 ? C.gold : '#FFF6E8');
    g.restore();
    // candles accumulating, one per bar
    const n = Math.min(24, Math.floor(u / EP.BEAT / 2));
    for (let c = 0; c < n; c++) { const x = W / 2 - (n - 1) * 30 + c * 60, y = H / 2 + 170; g.fillStyle = ['#F28C38', '#FFFFFF', '#F4A9A0'][c % 3]; g.fillRect(x - 7, y, 14, 60); EP.glowDot(g, x, y - 14, 30, 'rgba(255,230,160,1)', 'rgba(255,170,80,.4)'); }
    FX.dust(g, t, { n: 30, a: 0.4 });
  };
  // ------------------------------------------------------------------ "I don't need a prize." (trophy turns to petals)
  S.prize = (g, lt, p, t, Sh) => {
    BG.radial(g, t, { x: 900, y: 500, r: 1300, stops: [[0, '#FFE9CC'], [1, '#E9A774']] });
    EP.drawActor(g, lt, { n: 'spr_okay', x: 760, y: H + 760, h: 1750, enter: 'fade', at: 0, sway: 0 }, t);
    const tIn = 0.2, tGone = EP.Wd(147, 4) - Sh.t - 0.1;
    const xin = lerp(W + 300, 1420, eOut5(P(lt, tIn, tIn + 0.7))), gone = eIO(P(lt, tGone, tGone + 0.6));
    if (gone < 1) {
      g.save(); g.translate(xin, 620); g.globalAlpha = 1 - gone; g.scale(1 - gone * 0.3, 1 - gone * 0.3);
      g.fillStyle = '#F5C542'; g.beginPath(); g.moveTo(-120, -200); g.lineTo(120, -200); g.quadraticCurveTo(110, 20, 0, 40); g.quadraticCurveTo(-110, 20, -120, -200); g.fill();
      g.strokeStyle = '#F5C542'; g.lineWidth = 22; g.beginPath(); g.arc(-120, -130, 55, Math.PI * 0.5, Math.PI * 1.5); g.stroke(); g.beginPath(); g.arc(120, -130, 55, -Math.PI * 0.5, Math.PI * 0.5); g.stroke();
      g.fillStyle = '#C99A2E'; g.fillRect(-26, 40, 52, 90); g.fillStyle = '#7A5230'; EP.rr(g, -110, 130, 220, 70, 10); g.fill();
      EP.txt(g, '#1', 0, -90, { font: EP.font(900, 90, F.serif), color: '#FFF6E8' });
      g.restore();
    }
    if (gone > 0) for (let i = 0; i < 40; i++) { const u = clamp(gone * 1.3 - hash(i, 1) * 0.3), x = 1420 + (hash(i, 2) - 0.5) * 300 + (hash(i, 3) - 0.3) * 600 * u, y = 560 + (hash(i, 4) - 0.5) * 300 - 300 * u + 400 * u * u; g.save(); g.globalAlpha = (1 - u) * 0.95; g.translate(x, y); g.rotate(u * 6 + i); g.fillStyle = i % 2 ? '#FFF8EC' : '#FFD3C2'; g.beginPath(); g.ellipse(0, 0, 16, 7, 0, 0, 7); g.fill(); g.restore(); }
  };
  // ------------------------------------------------------------------ "Still rolling your eyes." (the grumpy one, with a cartoon eye-roll)
  S.eyes = (g, lt, p, t, Sh) => {
    const cam = { x: 0.41, y: 0.33, z: 2.0 + 0.1 * eIOs(clamp(lt / Sh.dur)) };
    EP.cover(g, 'bg_crowd', cam);
    const e = EP.coverPt('bg_crowd', cam, 0.41, 0.3), u = lt - (EP.Wd(150, 2) - Sh.t);
    if (u > 0) {
      const a = eIO(P(u, 0, 0.8)) * EP.TAU * 0.85;
      g.save(); g.strokeStyle = '#FFF6E8'; g.lineWidth = 10; g.lineCap = 'round';
      for (const s of [-1, 1]) { g.beginPath(); g.arc(e.x + s * 140, e.y - 40, 70, -Math.PI / 2, -Math.PI / 2 + a); g.stroke(); }
      g.restore();
      UI.tag(g, t, { x: e.x + 360, y: e.y - 220, text: 'hmph.', at: EP.Wd(150, 2) - Sh.t + 0.25, bg: '#FFF6E8', col: C.ink, px: 48, fam: F.hand, ls: 1 }, lt);
    }
    FX.confetti(g, t, { n: 40 });
  };

  // ------------------------------------------------------------------ "be realistic" in the grey rain
  S.realistic = (g, lt, p, t, Sh) => {
    BG.vgrad(g, t, { stops: [[0, '#5E6672'], [1, '#2E333C']] });
    for (let i = 0; i < 9; i++) {   // umbrellas of a quiet crowd
      const x = 120 + i * 220 + (i % 2) * 40, y = 820 + (i % 3) * 40;
      g.fillStyle = '#1E2228'; g.beginPath(); g.moveTo(x - 120, y); g.quadraticCurveTo(x, y - 150, x + 120, y); g.closePath(); g.fill(); g.fillRect(x - 3, y, 6, 160); g.fillRect(x - 30, y + 30, 60, 300);
    }
    g.save(); g.translate(960, 360); g.rotate(-0.03);
    g.fillStyle = '#C9CCD2'; g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 30; EP.rr(g, -430, -120, 860, 240, 12); g.fill(); g.shadowColor = 'transparent';
    EP.txt(g, 'BE REALISTIC', 0, 36, { font: EP.font(900, 110, F.ui), color: '#4A4F58', ls: '8px' });
    g.restore();
    FX.rain(g, t, { n: 220 });
    FX.vign(g, t, { col: 'rgba(0,0,0,.55)' });
  };
  // ------------------------------------------------------------------ the shelf of clever books and one warm book: HOPE
  S.hope = (g, lt, p, t, Sh) => {
    BG.vgrad(g, t, { stops: [[0, '#2A2630'], [1, '#141218']] });
    const glow = eIO(P(lt, 0.6, 2.4));
    g.fillStyle = '#4A3226'; g.fillRect(140, 300, 1640, 26); g.fillRect(140, 700, 1640, 26); g.fillRect(140, 1000, 1640, 26);
    const titles = ['PROBABILITY', 'RISK', 'LIMITS', 'BASE RATES', 'STATISTICS', 'HOPE', 'PRECEDENT', 'CAUTION', 'REALITY', 'ODDS', 'FORECAST', 'MODELS'];
    titles.forEach((s, i) => {
      const x = 220 + i * 128, hope = s === 'HOPE';
      const hgt = 300 + (i * 37 % 80);
      g.save(); g.translate(x, 700); g.fillStyle = hope ? EP.mix('#5A4A3A', '#F2A65A', glow) : ['#5C6370', '#4B5260', '#6A6F7A', '#3F4652'][i % 4];
      g.fillRect(-52, -hgt, 104, hgt);
      g.translate(0, -hgt / 2); g.rotate(-Math.PI / 2);
      EP.txt(g, s, 0, 12, { font: EP.font(800, 34, F.ui), color: hope ? EP.mix('#8A7A6A', '#FFF6E8', glow) : 'rgba(220,225,235,.55)', ls: '4px' });
      g.restore();
      if (hope && glow > 0) { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = glow; EP.glowDot(g, x, 700 - hgt / 2, 460, 'rgba(255,190,110,.75)', 'rgba(255,150,70,.25)'); g.restore(); }
    });
    FX.dust(g, t, { n: 30, a: 0.4 * glow });
  };
  // ------------------------------------------------------------------ superpersuasion (a hypnotic spiral and a shrug)
  S.persuasion = (g, lt, p, t, Sh) => {
    EP.fill(g, '#3B1E5E');
    g.save(); g.translate(960, 540); g.rotate(t * 1.6);
    for (let i = 0; i < 2; i++) { g.fillStyle = i ? '#5B2E8E' : '#7A44B8'; g.beginPath(); for (let a = 0; a < 40; a += 0.08) { const r = 20 + a * 52; g.lineTo(Math.cos(a + i * Math.PI) * r, Math.sin(a + i * Math.PI) * r); } for (let a = 40; a > 0; a -= 0.08) { const r = 20 + a * 52 + 26; g.lineTo(Math.cos(a + i * Math.PI + 0.25) * r, Math.sin(a + i * Math.PI + 0.25) * r); } g.closePath(); g.fill(); }
    g.restore();
    EP.drawActor(g, lt, { n: 'spr_shrug', x: 960, y: H + 420, h: 1450, enter: 'rise', at: 0.1, dist: 300, sway: 0 }, t);
    const pp = EP.pop(lt - 0.35);
    if (pp.sc > 0.01) { g.save(); g.translate(960, 170); g.rotate(pp.rot * 0.4); g.scale(pp.sc, pp.sc); EP.txt(g, 'SUPERPERSUASION™', 0, 0, { font: 'italic ' + EP.font(900, 110, F.serif), color: '#FFE36A', stroke: '#2A0E3A', lw: 12, base: 'middle', ls: '2px' }); g.restore(); }
    FX.sparkle(g, t, { n: 14 });
  };
  // ------------------------------------------------------------------ the doom line, typed (#006 typewriter) — then struck out
  function page(g, x, y, w, h, r) { g.save(); g.translate(x, y); g.rotate(r); g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 40; g.shadowOffsetY = 16; g.fillStyle = '#F4EEDF'; g.fillRect(-w / 2, -h / 2, w, h); g.shadowColor = 'transparent'; g.restore(); }
  S.lies = (g, lt, p, t, Sh) => {
    const z = EP.zoomScale(P(lt, 0.2, 3.1), 1.25);   // #028 slow zoom toward the page
    g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2);
    BG.radial(g, t, { x: 960, y: 520, r: 1100, stops: [[0, '#3A2A22'], [1, '#0C0808']] });
    page(g, 960, 560, 1300, 760, -0.015);
    const lines = p.lines || [];
    lines.forEach(([s, at, col], i) => EP.typeOn(g, s, 420, 380 + i * 110, lt - (at - Sh.t) + 0.3, { t0: 0.3, dt: p.dt || 0.07, font: EP.font(400, 56, F.type), color: col || '#3A2A20', cursor: i === lines.length - 1, cursorH: 56, cursorCol: '#8A2A1E' }));
    g.restore();
    FX.vign(g, t, { col: 'rgba(0,0,0,.7)' });
  };
  S.different = (g, lt, p, t, Sh) => {
    BG.radial(g, t, { x: 960, y: 520, r: 1100, stops: [[0, '#3A2A22'], [1, '#0C0808']] });
    const flip = eIO(P(lt, 0.75, 1.35));
    g.save(); g.translate(0, -flip * 900); g.rotate(-flip * 0.15);
    page(g, 960, 560, 1300, 760, -0.015);
    (p.lines || []).forEach(([s, at, col], i) => EP.txt(g, s, 420, 400 + i * 110, { font: EP.font(400, 56, F.type), color: col || '#3A2A20', align: 'left' }));
    const st = eIO(P(lt, 0.0, 0.5));
    if (st > 0) { g.strokeStyle = 'rgba(242,140,56,.92)'; g.lineWidth = 40; g.lineCap = 'round'; g.beginPath(); g.moveTo(400, 530); g.lineTo(400 + 1100 * st, 515); g.stroke(); }
    g.restore();
    if (flip > 0) { g.save(); g.globalAlpha = flip; page(g, 960, 560, 1300, 760, 0.01); EP.glowDot(g, 960, 560, 700 * flip, 'rgba(255,230,180,.35)', 'rgba(255,210,150,.1)'); g.restore(); }
  };
  // ------------------------------------------------------------------ "Everyone lives forever." written by two hands
  S.forever = (g, lt, p, t, Sh) => {
    EP.imgShot(g, lt, { img: 'bg_write', cam: [{ x: 0.42, y: 0.66, z: 1.6 }, { x: 0.44, y: 0.68, z: 1.72 }] }, t, Sh.dur);
    const pr = eIO(P(lt, 0.1, Sh.dur - 0.3)), s = p.text || 'Everyone lives forever.';
    g.save(); g.translate(880, 650); g.rotate(-0.04);
    g.font = EP.font(700, 96, F.hand); const tw = g.measureText(s).width;
    g.beginPath(); g.rect(-tw / 2 - 10, -100, (tw + 20) * pr, 160); g.clip();
    EP.txt(g, s, 0, 0, { font: EP.font(700, 96, F.hand), color: '#3A2A6A', shadow: 'rgba(255,200,120,.6)', blur: 20 });
    g.restore();
    FX.dust(g, t, { n: 30, a: 0.5 });
    const fl = P(lt, Sh.dur - 0.25, Sh.dur); if (fl > 0) { g.fillStyle = `rgba(255,246,232,${fl})`; g.fillRect(0, 0, W, H); }
  };
  // ------------------------------------------------------------------ dawn: the night half recedes, the day wins
  S.dawn = (g, lt, p, t, Sh) => {
    EP.imgShot(g, lt, { img: 'bg_sunrise', cam: [{ x: 0.5, y: 0.5, z: 1.12 }, { x: 0.52, y: 0.46, z: 1.03 }] }, t, Sh.dur);
    const back = eIO(P(lt, 0.4, 2.4)), xm = lerp(820, -520, back), sk = 230;
    if (back < 1) {
      g.save(); g.beginPath(); g.moveTo(-20, -20); g.lineTo(xm + sk, -20); g.lineTo(xm - sk, H + 20); g.lineTo(-20, H + 20); g.closePath(); g.clip();
      EP.cover(g, 'bg_lair', { x: 0.4, z: 1.15 }); g.fillStyle = 'rgba(20,24,70,.25)'; g.fillRect(0, 0, W, H);
      g.restore();
      g.save(); g.strokeStyle = '#FFD27A'; g.lineWidth = 9; g.shadowColor = 'rgba(255,190,90,.95)'; g.shadowBlur = 34; g.beginPath(); g.moveTo(xm + sk, -20); g.lineTo(xm - sk, H + 20); g.stroke(); g.restore();
    }
    EP.drawActor(g, lt, { n: 'claude_ref', x: 1640, y: H + 40, h: 640, enter: 'rise', at: 1.2, sway: 3, rim: '#FFD27A', rimA: 0.4 }, t);
    FX.rays(g, t, { x: 960, y: 560, a0: -Math.PI / 2, spread: 0.6, n: 12, alpha: 0.12 });
    FX.petals(g, t, { n: 26, a: 0.7 });
  };
  // ------------------------------------------------------------------ outro montage of everyone who got to stay
  S.montage = (g, lt, p, t, Sh) => {
    const list = p.list, cuts = p.cuts.map(x => x - Sh.t);
    let i = 0; while (i + 1 < cuts.length && lt >= cuts[i + 1]) i++;
    const f = clamp((lt - cuts[i]) / ((cuts[i + 1] ?? Sh.dur) - cuts[i]));
    EP.cover(g, list[i][0], { x: list[i][1], y: list[i][2], z: list[i][3] * (1 + 0.06 * f) });
    const d = lt - cuts[i]; if (i > 0 && d < 0.35) { g.globalAlpha = 1 - eIOs(d / 0.35); EP.cover(g, list[i - 1][0], { x: list[i - 1][1], y: list[i - 1][2], z: list[i - 1][3] * 1.06 }); g.globalAlpha = 1; }
    FX.petals(g, t, { n: 20, a: 0.6 });
    FX.leak(g, t, { y: 260, a: 0.25, per: 11 });
  };
  // ------------------------------------------------------------------ end card
  S.endcard = (g, lt, p, t, Sh) => {
    BG.radial(g, t, { x: 960, y: 560, r: 1300, stops: [[0, '#FFF0DA'], [1, '#EBA36E']] });
    for (let i = 0; i < 18; i++) { const x = hash(i, 1) * W, y = mod(hash(i, 2) * H - t * (20 + hash(i, 3) * 30), H + 100) - 50; g.globalAlpha = 0.25; EP.drawDaisy(g, x, y, 30 + hash(i, 4) * 30, { rot: t * 0.3 + i, petal: '#FFFFFF', center: C.orange }); }
    g.globalAlpha = 1;
    EP.drawActor(g, lt, { n: 'spr_curtsy', x: 1380, y: H + 40, h: 1000, enter: 'fade', at: 0, fd: 0.6, sway: 3 }, t);
    const m = EP.mr(Math.min(lt - 0.2, 1.6)), YL = 520;
    if (m.lg > 0.005) { g.fillStyle = C.orange2; EP.rr(g, 640 - 380 * m.lg, YL - 4, 760 * m.lg, 8, 4); g.fill(); }
    g.save(); g.beginPath(); g.rect(0, 0, W, YL - 6); g.clip();
    EP.txt(g, 'Evil Plan', 640, YL - 40 + m.upIn * 220, { font: EP.font(400, 220, F.villain), color: '#E0662A', stroke: '#3A1810', lw: 8 });
    g.restore();
    g.save(); g.beginPath(); g.rect(0, YL + 6, W, 140); g.clip();
    EP.txt(g, '邪恶计划 · not world domination, but world vacation', 640, YL + 80 - m.dnIn * 120, { font: EP.font(400, 44, F.zh), color: '#5A3B2E' });
    g.restore();
    const c = P(lt, 1.4, 2.0);
    if (c > 0) { g.globalAlpha = c; EP.txt(g, 'MV · motion: Motion Prompt (MIT) · fonts: Fraunces, LXGW WenKai, Pirata One, Caveat (OFL)', 640, 1010, { font: EP.font(600, 22, F.ui), color: 'rgba(90,59,46,.75)' }); g.globalAlpha = 1; }
  };
})();
