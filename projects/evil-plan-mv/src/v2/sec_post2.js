// v2/sec_post2.js — post-chorus 2 (138.9 – 154.2 s). A sealed gatefold card opens flap by flap onto a festival
// panorama while paper hot-air balloons rise out of it; then hundreds of tiny paper people run in to spell FOREVER,
// wave, scatter free on "free" — except one, who stays with a NO! sign and gets a heart for it.
'use strict';
(function () {
  const { W, H, clamp, lerp, P, eIO, eIOs, eOut, eOut5, eIn, backOut, spring, smooth, hash, noise, mod } = EP;
  const PA = EP.PA, STK = EP.STK, KT = EP.KT, WD = EP.WD, K = EP.K, F = EP.F, COL = PA.COL;
  const L = EP.L, Wd = EP.Wd;
  const spread = (id, x, y, w, h, mood, rot, draw, extra = {}) => WD.spreads.push(Object.assign({ id, x, y, w, h, mood, rot, draw }, extra));

  // ================================================================== P2a · the gatefold
  const GW = 2280, GH = 560, GY = 20, FW = GW / 4;   // open width, height, centre y, flap width (centre panel = 2 flaps)
  let GF = null;
  function gatefold() {
    if (GF) return GF;
    const im = EP.img.bg_festival || EP.img.bg_park, [sx, sy, sw, sh] = K.crop(im, GW, GH, 0.5, 0.55, 1);
    const pan = EP.mk(GW, GH), pg = pan.getContext('2d'); pg.imageSmoothingQuality = 'high'; pg.drawImage(im, sx, sy, sw, sh, 0, 0, GW, GH);
    const panel = (x0, w, mirror) => { const c = EP.mk(w, GH), g = c.getContext('2d'); if (mirror) { g.translate(w, 0); g.scale(-1, 1); } g.drawImage(pan, x0, 0, w, GH, 0, 0, w, GH); g.strokeStyle = '#FFFDF6'; g.lineWidth = 16; g.strokeRect(0, 0, w, GH); return c; };
    const outside = (side, mirror) => {
      const c = EP.mk(FW, GH), g = c.getContext('2d'); if (mirror) { g.translate(FW, 0); g.scale(-1, 1); }
      PA.tile(g, 'cream', 0, 0, FW, GH); g.strokeStyle = '#E8B54A'; g.lineWidth = 10; g.strokeRect(14, 14, FW - 28, GH - 28);
      g.save(); g.translate(side ? 0 : FW, GH / 2); g.strokeStyle = COL.tangerine; g.lineWidth = 14; g.lineCap = 'round'; g.beginPath();
      for (let i = 0; i <= 60; i++) { const tt = Math.PI / 2 + i / 60 * EP.TAU, s = Math.sin(tt), d = 1 + s * s, x = 230 * Math.cos(tt) / d, y = 230 * s * Math.cos(tt) / d; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.restore();
      g.font = EP.font(700, 64, F.hand); g.fillStyle = '#5A3B2E'; g.textAlign = 'center'; g.fillText(side ? 'forever' : 'open me', FW / 2, GH - 70);
      return c;
    };
    return (GF = { centre: panel(FW, FW * 2, false), inL: panel(0, FW, false), inR: panel(FW * 3, FW, true), outL: outside(0, false), outR: outside(1, true) });
  }
  const OPENL = Wd(67, 0) - 0.12, OPENR = L(68) - 0.08;
  const dP66 = { i: 66, x: -1080, y: -612, w: 1700, px: 80, style: 'serif', col: COL.ink, emph: { 'forever': { italic: true, col: COL.tangerine, w: 900 } }, zh: { px: 28 } };
  const dP67 = { i: 67, x: -1080, y: -470, w: 1700, px: 80, style: 'serif', col: COL.ink, emph: { 'free': { style: 'marker', col: '#2F8F8A', big: 1.3 } }, zh: { px: 28 } };
  const dP68 = { i: 68, x: -1080, y: 365, w: 1600, px: 68, style: 'serif', col: COL.ink, emph: { 4: { hl: true }, 5: { hl: true }, 6: { hl: true, italic: true } }, zh: { px: 26 } };
  const dP69 = { i: 69, x: -1080, y: 485, w: 1600, px: 68, style: 'serif', col: COL.ink, emph: { 3: { style: 'type', col: '#7A7486', strike: Wd(69, 5) + 0.3 }, 4: { style: 'type', col: '#7A7486', strike: Wd(69, 5) + 0.35 }, 5: { style: 'type', col: '#7A7486', strike: Wd(69, 5) + 0.4 } }, zh: { px: 26 } };
  spread('P2a', 64400, -100, 2400, 1450, 'day', -0.008, (g, t) => {
    PA.drawCard(g, PA.card('P2a', 2400, 1450, { tex: '#F6E7CF', torn: 'lr', edge: 0.22 }), 0, 0);
    const G = gatefold(), pl = P(t, OPENL, OPENL + 0.7), pr = P(t, OPENR, OPENR + 0.7);
    const ext = FW * 2 * (1 + eIO(pl) * 0.5 + eIO(pr) * 0.5);   // shadow under whatever is open
    const xl = -FW - FW * eIO(pl);
    g.save(); g.fillStyle = 'rgba(0,0,0,.4)'; g.filter = 'blur(18px)'; g.fillRect(xl + 10, GY - GH / 2 + 16, ext, GH); g.restore();
    g.drawImage(G.centre, -FW, GY - GH / 2);
    // paper balloons rise out of the picture on "not who you have to be"
    for (let k = 0; k < 6; k++) {
      const u = t - (L(69) - 0.3 + k * 0.28); if (u <= 0) continue;
      const x = -900 + k * 360 + Math.sin(u * 0.9 + k) * 40, y = 160 - u * (230 + k * 18);
      if (y < -1000) continue;
      K.balloon(g, x, y, 0.9 + hash(k, 2) * 0.5, t, [['#F07A2E', '#FFF6E8'], ['#2F8F8A', '#F4CE72'], ['#D23A2C', '#FFF6E8'], ['#2B3990', '#F4CE72']][k % 4], k);
    }
    K.hinge(g, G.outL, G.inL, pl, -FW, GY, FW, GH, { per: 0.2, shade: 0.4, slices: 20 });
    g.save(); g.translate(FW, 0); g.scale(-1, 1); K.hinge(g, G.outR, G.inR, pr, 0, GY, FW, GH, { per: 0.2, shade: 0.4, slices: 20 }); g.restore();
    // the daisy seal on the seam pops off as it opens
    const seal = P(t, OPENL - 0.05, OPENL + 0.35);
    if (seal < 1) { g.save(); g.translate(0 + eIn(seal) * -500, GY - eIn(seal) * 600); g.rotate(seal * 5); g.globalAlpha *= 1 - seal; EP.drawDaisy(g, 0, 0, 70, { petal: '#FFFFFF', center: '#E8455C', line: '#C8261D', lw: 3 }); g.restore(); }
    KT.draw(g, dP66, t); KT.draw(g, dP67, t); KT.draw(g, dP68, t); KT.draw(g, dP69, t);
    STK.draw(g, 'spr_float', 960, 690, 560, { t, peel: P(t, L(66) - 0.1, L(66) + 0.35), sway: 1, bob: 14, T: t });
  }, { img: ['bg_festival', 'cut/spr_float'] });

  // ================================================================== P2b · FOREVER, spelled by everybody
  let PTS = null, DISS = 0;   // built on first use, after the fonts have loaded
  function pts() { if (PTS) return PTS; PTS = K.textPoints('FOREVER', 330, F.ui, 30, 7); let best = 1e9; PTS.forEach(([x, y], i) => { const d = Math.hypot(x - 80, y - 40); if (d < best) { best = d; DISS = i; } }); return PTS; }
  const RUNIN = L(70) - 0.15, SCATTER = Wd(71, 2) - 0.02;
  const dP70 = { i: 70, x: -1080, y: -612, w: 1800, px: 84, style: 'serif', col: COL.ink, emph: { 'everybody': { style: 'cut', cols: ['#F07A2E', '#2B3990', '#D23A2C', '#2F8F8A', '#E8A62A', '#C2357A', '#F07A2E', '#2B3990', '#D23A2C'] }, 'forever': { italic: true, col: COL.tangerine, w: 900 } }, zh: { px: 28 } };
  const dP71 = { i: 71, x: -1080, y: 300, w: 1500, px: 76, style: 'serif', col: COL.ink, emph: { 2: { style: 'marker', col: '#2F8F8A', big: 1.3 } }, zh: { px: 26 } };
  const dP72 = { i: 72, x: -1080, y: 440, w: 1500, px: 76, style: 'serif', col: COL.ink, emph: { 0: { style: 'marker', col: COL.tangerine, big: 1.15 }, 'disagree': { col: '#D23A2C', italic: true, w: 900 } }, zh: { px: 26 } };
  spread('P2b', 67100, 150, 2400, 1450, 'day', 0.01, (g, t) => {
    PA.drawCard(g, PA.card('P2b', 2400, 1450, { tex: '#FBEFD8', torn: 'tb', edge: 0.2 }), 0, 0);
    const oy = -60, PTS = pts();
    PTS.forEach(([px, py, r], i) => {
      const t0 = RUNIN + r * 0.6, u = P(t, t0, t0 + 0.55); if (u <= 0) return;
      const sx = px * 0.5 + (hash(i, 3) - 0.5) * 1600, sy = 900, e = eOut(u);
      let x = lerp(sx, px, e), y = lerp(sy, py + oy, e) - Math.sin(Math.PI * u) * 120, pose = u < 1 ? 3 : (t > L(70) + 0.4 ? 1 : 0), s = 0.72;
      if (i === DISS) { if (t > SCATTER) { pose = 0; s = 0.95; } }
      else if (t > SCATTER) { const v = t - SCATTER, a = Math.atan2(py, px) + (hash(i, 5) - 0.5) * 0.8, sp = 900 + hash(i, 6) * 900; x += Math.cos(a) * sp * v; y += Math.sin(a) * sp * v * 0.7 - 300 * v + 500 * v * v; pose = 3; if (Math.abs(x) > 1500 || y > 900) return; }
      K.person(g, x, y + 20, s, K.pcol(i * 7 + 3), t, i, pose);
    });
    // the one who disagrees keeps standing there, sign up
    if (t > SCATTER) {
      const [px, py] = pts()[DISS], x = px, y = py + oy + 20, sp = EP.pop(t - (SCATTER + 0.2));
      if (sp.sc > 0.01) { g.save(); g.translate(x + 26, y - 44); g.rotate(-0.1 + sp.rot); g.scale(sp.sc, sp.sc); g.strokeStyle = '#8A5A3A'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, 30); g.lineTo(0, -40); g.stroke(); g.fillStyle = '#FFFDF6'; g.fillRect(-52, -96, 104, 60); g.strokeStyle = '#2A2440'; g.lineWidth = 3; g.strokeRect(-52, -96, 104, 60); EP.txt(g, 'NO!', 0, -52, { font: EP.font(900, 40, F.ui), color: '#D23A2C' }); g.restore(); }
      const hp = EP.pop(t - (Wd(72, 4) + 0.1)); if (hp.sc > 0.01) { g.save(); g.translate(x - 30, y - 120); g.scale(hp.sc * 1.4, hp.sc * 1.4); g.rotate(hp.rot); g.fillStyle = '#FFFFFF'; EP.heartPath(g, 26); g.fill(); g.fillStyle = '#E8455C'; EP.heartPath(g, 20); g.fill(); g.restore(); }
    }
    KT.draw(g, dP70, t); KT.draw(g, dP71, t); KT.draw(g, dP72, t);
    STK.draw(g, 'spr_cheer', 990, 728, 680, { t, peel: P(t, L(70) - 0.1, L(70) + 0.35), sway: 1, bob: 16, T: t });
  }, { img: ['cut/spr_cheer'], screen: (g, t) => { if (t > SCATTER) EP.FX.confetti(g, t, { t0: SCATTER, n: 90 }); } });

  // ================================================================== camera, impacts
  WD.keys.push(
    { t: 138.72, s: 'P2a', dx: 0, dy: -32, z: 0.79, d: 0.5, drift: { z: 0.008 } },
    { t: 147.72, s: 'P2b', dx: 0, dy: -32, z: 0.79, d: 0.5, drift: { z: 0.01 } },
  );
  WD.shakes.push([OPENR + 0.5, 0.2], [SCATTER + 0.05, 0.3]);
})();
