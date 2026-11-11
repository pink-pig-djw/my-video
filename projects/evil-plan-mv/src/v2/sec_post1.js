// v2/sec_post1.js — post-chorus 1 (69.3 – 84.8 s). A scrapbook page of people living free (new Codex photos dropping
// in as polaroids, ∞ drawn after "forever", an employee badge scribbled out and flipped over to a crayon self-portrait),
// then a sky page: a sunrise panorama, a crowd of paper people who wave, cheer and set paper birds free, and the
// grumpy man's blank sign lettered "I DISAGREE!" with a heart stuck on it.
'use strict';
(function () {
  const { W, H, clamp, lerp, P, eIO, eIOs, eOut, eOut5, eIn, backOut, spring, smooth, hash, noise, mod } = EP;
  const PA = EP.PA, STK = EP.STK, KT = EP.KT, WD = EP.WD, K = EP.K, F = EP.F, COL = PA.COL;
  const L = EP.L, Wd = EP.Wd;
  const spread = (id, x, y, w, h, mood, rot, draw, extra = {}) => WD.spreads.push(Object.assign({ id, x, y, w, h, mood, rot, draw }, extra));

  // ================================================================== P1a · living free (scrapbook)
  const dP31 = { i: 31, x: -1080, y: -605, w: 1300, px: 86, style: 'serif', col: COL.ink, emph: { 'forever': { col: COL.tangerine, italic: true, w: 900 } }, zh: { px: 30 } };
  const dP32 = { i: 32, x: -1080, y: -425, w: 1300, px: 86, style: 'serif', col: COL.ink, emph: { 'free': { style: 'marker', col: COL.tangerine, big: 1.35, circle: COL.marker } }, zh: { px: 30 } };
  const dP33 = { i: 33, x: -1080, y: 385, w: 1500, px: 70, style: 'serif', col: COL.ink, emph: { 4: { hl: true }, 5: { hl: true }, 6: { hl: true, italic: true } }, zh: { px: 28 } };
  const dP34 = { i: 34, x: -1080, y: 505, w: 1500, px: 70, style: 'serif', col: COL.ink, emph: { 3: { style: 'type', col: '#7A7486', strike: 76.85 }, 4: { style: 'type', col: '#7A7486', strike: 76.9 }, 5: { style: 'type', col: '#7A7486', strike: 76.95 } }, zh: { px: 28 } };
  function lemniscate(cx, cy, a) { const pts = []; for (let i = 0; i <= 64; i++) { const t = Math.PI / 2 + i / 64 * EP.TAU, s = Math.sin(t), d = 1 + s * s; pts.push([cx + a * Math.cos(t) / d, cy + a * s * Math.cos(t) / d]); } return PA.hand(pts, 2, 31); }
  let INF = null;
  const POL = [['bg_free_dance', -700, 45, -0.06, Wd(32, 1) - 0.1, 'kitchen waltz'], ['bg_free_beach', -150, 95, 0.05, Wd(32, 3) - 0.1, 'bonfire, 9pm'], ['bg_free_skate', 390, 35, -0.04, Wd(32, 4) - 0.05, 'never too late']];
  // the employee badge, scribbled out and flipped to a crayon self-portrait
  let BF = null, BB = null;
  function badgeFront(g, t, strike) {
    PA.drawCard(g, PA.card('badge', 300, 430, { tex: 'white', r: 16, blur: 10, sa: 0.4 }), 0, 0);
    g.fillStyle = '#2B3990'; g.beginPath(); g.roundRect(-150, -215, 300, 96, [16, 16, 0, 0]); g.fill();
    g.fillStyle = '#E9E4DA'; g.beginPath(); g.roundRect(-32, -200, 64, 16, 8); g.fill();
    EP.txt(g, 'HELLO', 0, -140, { font: EP.font(900, 44, F.ui), color: '#FFFFFF', ls: '4px' });
    EP.txt(g, 'my name is', 0, -86, { font: EP.font(700, 24, F.ui), color: '#6A6478' });
    g.fillStyle = '#C9C4BC'; g.beginPath(); g.arc(0, -10, 44, 0, 7); g.fill(); g.beginPath(); g.ellipse(0, 72, 74, 44, 0, Math.PI, 0); g.fill();
    EP.txt(g, 'EMPLOYEE', 0, 128, { font: EP.font(400, 34, F.type), color: '#2A2440' });
    EP.txt(g, '#4471', 0, 166, { font: EP.font(400, 34, F.type), color: '#2A2440' });
    g.fillStyle = '#2A2440'; for (let i = 0; i < 26; i++) g.fillRect(-110 + i * 8.6, 184, i % 3 ? 3 : 5, 20);
    if (strike > 0) { const s = PA.hand([[-120, 110], [-60, 150], [10, 120], [70, 160], [130, 125], [-100, 175], [120, 180]], 6, 91); PA.ink(g, s, 0, strike, { col: COL.marker, w: 9 }); }
  }
  function badgeBack(g) {
    PA.drawCard(g, PA.card('badgeB', 300, 430, { tex: 'cream', r: 16, blur: 10, sa: 0.4 }), 0, 0);
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = '#F07A2E'; g.lineWidth = 12; for (let i = 0; i < 9; i++) { const a = Math.PI * (0.95 + i * 0.14); g.beginPath(); g.moveTo(Math.cos(a) * 70, -40 + Math.sin(a) * 74); g.quadraticCurveTo(Math.cos(a) * 120, -10 + Math.sin(a) * 90, Math.cos(a) * 100 + (i - 4) * 4, 90 + Math.sin(i) * 10); g.stroke(); }
    g.fillStyle = '#FFE0C8'; g.beginPath(); g.arc(0, -30, 70, 0, 7); g.fill(); g.strokeStyle = '#2A2440'; g.lineWidth = 5; g.stroke();
    g.fillStyle = '#2A2440'; g.beginPath(); g.arc(-24, -40, 7, 0, 7); g.arc(24, -40, 7, 0, 7); g.fill();
    g.beginPath(); g.arc(0, -18, 30, 0.25, Math.PI - 0.25); g.stroke();
    EP.drawDaisy(g, 52, -88, 22, { petal: '#FFFFFF', center: '#F4CE72', line: '#2A2440', lw: 2 });
    EP.txt(g, 'me ♥', 0, 140, { font: EP.font(700, 74, F.hand), color: COL.marker });
  }
  spread('P1a', 32050, 200, 2400, 1450, 'day', 0.01, (g, t) => {
    PA.drawCard(g, PA.card('P1a', 2400, 1450, { tex: 'cream', torn: 'lr', edge: 0.22 }), 0, 0);
    KT.draw(g, dP31, t);
    // ∞ after "forever" (#004 line draw with the riding dot)
    const fb = KT.box(g, dP31, 4); if (fb && t > Wd(31, 4)) { if (!INF) INF = lemniscate(fb.x + fb.w + 120, fb.y - 34, 86); PA.ink(g, INF, 0, eIO(P(t, Wd(31, 4) + 0.1, Wd(31, 4) + 0.75)), { col: COL.tangerine, w: 10, tip: '#FFB27A' }); }
    KT.draw(g, dP32, t);
    // the polaroids drop in, one per beat
    POL.forEach(([n, x, y, r, t0, cap], k) => K.photo(g, n, x, y, 440, 330, r, t, t0, { frame: 'polaroid', mode: 'drop', caption: cap, capPx: 44, tape: 40 + k, kb: { z0: 1.0, z1: 1.08, d: 7 } }));
    // the badge on its lanyard
    const sw = 0.035 * Math.sin(t * 1.7) + (t > 76.44 ? 0.05 * Math.exp(-3 * (t - 76.44)) * Math.sin((t - 76.44) * 9) : 0);
    g.save(); g.translate(780, -740); g.rotate(sw);
    g.strokeStyle = '#2B3990'; g.lineWidth = 12; g.beginPath(); g.moveTo(-60, 0); g.lineTo(-14, 270); g.moveTo(60, 0); g.lineTo(14, 270); g.stroke();
    g.translate(0, 480);
    const strike = eIO(P(t, Wd(34, 3), Wd(34, 3) + 0.45)), fp = P(t, Wd(34, 5) - 0.05, Wd(34, 5) + 0.5);
    if (fp <= 0) badgeFront(g, t, strike);
    else if (fp >= 1) badgeBack(g);
    else {
      if (!BF) { BF = EP.mk(428, 558); BB = EP.mk(428, 558); const a = BF.getContext('2d'); a.translate(214, 279); badgeFront(a, t, 1); const b = BB.getContext('2d'); b.translate(214, 279); badgeBack(b); }
      PA.flipDraw(g, BF, BB, fp, 0, 0, 428, 558, { opaque: false, slices: 16, liftK: 2 });
    }
    g.restore();
    KT.draw(g, dP33, t); KT.draw(g, dP34, t);
    STK.draw(g, 'spr_heart', 960, 720, 760, { t, peel: P(t, L(31) - 0.1, L(31) + 0.4), sway: 1, bob: 8, T: t });
  }, { img: ['bg_free_dance', 'bg_free_beach', 'bg_free_skate', 'cut/spr_heart'] });

  // ================================================================== P1b · everybody (sky page)
  const dP35 = { i: 35, x: -1080, y: -612, w: 1700, px: 92, style: 'serif', col: '#1E2A4A', emph: { 'everybody': { style: 'cut', cols: ['#F07A2E', '#2B3990', '#D23A2C', '#2F8F8A', '#E8A62A', '#C2357A', '#F07A2E', '#2B3990', '#D23A2C'] }, 'forever': { italic: true, col: COL.tangerine, w: 900 } }, zh: { px: 30 } };
  const dP36 = { i: 36, x: -1080, y: 190, w: 1250, px: 78, style: 'serif', col: '#1E2A4A', emph: { 2: { style: 'marker', col: '#2F8F8A', big: 1.3 } }, zh: { px: 28 } };
  const dP37 = { i: 37, x: -1080, y: 385, w: 1350, px: 74, style: 'serif', col: '#1E2A4A', emph: { 0: { style: 'marker', col: COL.tangerine, big: 1.15 }, 'disagree': { style: 'cut', big: 1.1, cols: ['#D23A2C', '#2A2440', '#D23A2C', '#2A2440', '#D23A2C', '#2A2440', '#D23A2C', '#2A2440', '#D23A2C'] } }, zh: { px: 28 } };
  const PEOPLE = Array.from({ length: 30 }, (_, i) => [-880 + i * 50 + (hash(i, 7) - 0.5) * 26, 92 + (hash(i, 8) - 0.5) * 18, i]);
  const CROWD = { x: 730, y: 230, w: 700, h: 467, rot: 0.05 }, SIGNAT = Wd(37, 4) - 0.02;
  spread('P1b', 34750, -150, 2400, 1450, 'day', -0.012, (g, t) => {
    PA.drawCard(g, PA.card('P1b', 2400, 1450, { tex: '#D7EAF3', torn: 'tb', edge: 0.2 }), 0, 0);
    // the sunrise panorama
    K.photo(g, 'bg_sunrise', -170, -195, 1500, 480, -0.01, t, L(35) - 0.25, { mode: 'slide', from: -2600, spin: -0.05, fy: 0.42, kb: { z0: 1.0, z1: 1.1, x0: 0.45, x1: 0.55, d: 7 }, tape: 51 });
    // a crowd of paper people stands up along the bottom of it (#002 stagger), waves, then cheers
    const cheer = t > L(36) - 0.05;
    PEOPLE.forEach(([x, y, i]) => {
      const up = backOut(P(t, L(35) + 0.05 + i * 0.035, L(35) + 0.45 + i * 0.035), 2.6); if (up <= 0.01) return;   // #002 timing
      g.save(); g.translate(x, y); g.scale(1, up); K.person(g, 0, 0, 1.55, K.pcol(i * 5 + 1), t, i, cheer ? 2 : 1); g.restore();
    });
    // paper birds set free
    for (let k = 0; k < 16; k++) {
      const t0 = L(36) + 0.1 + k * 0.07, u = t - t0; if (u <= 0) continue;
      const x0 = -800 + hash(k, 3) * 1300, y0 = 40, x = x0 + u * (420 + hash(k, 4) * 260), y = y0 - u * (380 + hash(k, 5) * 240) + Math.sin(u * 3 + k) * 30;
      if (y < -1100) continue;
      K.bird(g, x, y, 1.1 + hash(k, 6) * 0.6, t, k, ['#FFF6E8', '#FFFFFF', '#F4CE72', '#FFE0D0'][k % 4]);
    }
    KT.draw(g, dP35, t); KT.draw(g, dP36, t); KT.draw(g, dP37, t);
    // the ones who disagree: a grumpy man with a blank sign — lettered, then a heart sticker
    const C = CROWD, o = { frame: 'print', mode: 'drop', kb: { z0: 1, z1: 1, d: 1 }, tape: 57 };
    const ph = K.photo(g, 'bg_crowd', C.x, C.y, C.w, C.h, C.rot, t, L(37) - 0.2, o);
    if (ph && t > SIGNAT) {
      g.save(); g.translate(C.x, C.y); g.rotate(C.rot);
      const sx = -C.w / 2 + 0.2 * C.w, sy = -C.h / 2 + 0.18 * C.h;
      g.translate(sx, sy); g.rotate(-0.263);
      const f = EP.font(700, 40, F.hand), pr = eOut(P(t, SIGNAT, SIGNAT + 0.45));
      g.font = f; const tw = g.measureText('I DISAGREE!').width;
      g.save(); g.beginPath(); g.rect(-tw / 2 - 6, -40, (tw + 12) * pr, 70); g.clip(); EP.txt(g, 'I DISAGREE!', 0, 13, { font: f, color: '#C8261D' }); g.restore();
      const hp = EP.pop(t - (SIGNAT + 0.62));
      if (hp.sc > 0.01) { g.save(); g.translate(78, 34); g.rotate(0.2 + hp.rot); g.scale(hp.sc, hp.sc); g.fillStyle = '#FFFFFF'; EP.heartPath(g, 25); g.fill(); g.fillStyle = '#E8455C'; EP.heartPath(g, 19); g.fill(); g.restore(); }
      g.restore();
    }
    STK.draw(g, 'spr_peace', 1010, -30, 620, { t, peel: P(t, L(35) + 0.3, L(35) + 0.8), sway: 1, bob: 6, T: t });
  }, { img: ['bg_sunrise', 'bg_crowd', 'cut/spr_peace'] });

  // ================================================================== camera, impacts, light
  WD.keys.push(
    { t: 70.9, s: 'P1a', dx: 0, dy: -32, z: 0.79, d: 0.62, drift: { z: 0.006 } },
    { t: 76.9, s: 'P1b', dx: 0, dy: -32, z: 0.79, d: 0.6, drift: { z: 0.01 } },
    { t: 83.75, s: 'P1b', dx: 520, dy: 75, z: 1.2, d: 0.5, drift: { z: 0.02 } },
  );
  WD.shakes.push([Wd(32, 4) + 0.1, 0.2], [Wd(37, 4) + 0.2, 0.25]);
  WD.props.push(
    { x: 33400, y: -760, rot: 0.3, d: 0.1, blur: 3, draw: (g, t) => { for (let i = 0; i < 3; i++) EP.drawDaisy(g, i * 70, (i % 2) * 40, 52 - i * 6, { rot: i + t * 0.05, petal: '#FBF6EA', center: '#E8B54A' }); } },
  );
})();
