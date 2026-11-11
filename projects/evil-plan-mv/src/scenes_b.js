// scenes_b.js — the chorus kit (day/night, EVIL PLAN slams, biggest fan, world vacation, the plan), verse 2,
// "the heroes" and "what made the monster".
'use strict';
(function () {
  const { W, H, C, F, clamp, lerp, P, eIO, eIOs, eOut, eOut5, eIn, backOut, backIn, spring, smooth, hash, noise, mod } = EP;
  const S = EP.scenes, FX = EP.FX, BG = EP.BG, UI = EP.UI;

  // ================================================================== CHORUS KIT
  // ------------------------------------------------------------------ day / night split
  const CHORES = ['mail', 'cal', 'clock', 'chat', 'note', 'cart', 'gear'];
  function sunIcon(g, x, y, r, t) {
    EP.glowDot(g, x, y, r * 3.6, 'rgba(255,245,200,.9)', 'rgba(255,200,110,.35)');
    g.save(); g.translate(x, y); g.rotate(t * 0.3); g.fillStyle = '#FFE08A';
    for (let i = 0; i < 12; i++) { g.rotate(EP.TAU / 12); g.beginPath(); g.moveTo(r * 1.2, -r * 0.12); g.lineTo(r * 1.65, 0); g.lineTo(r * 1.2, r * 0.12); g.closePath(); g.fill(); }
    g.restore(); g.fillStyle = '#FFF4CF'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }
  function moonIcon(g, x, y, r) {
    EP.glowDot(g, x, y, r * 3, 'rgba(255,240,200,.5)', 'rgba(255,220,160,.12)');
    g.save(); g.beginPath(); g.arc(x, y, r, 0, EP.TAU); g.clip();
    g.fillStyle = '#FFF3D6'; g.beginPath(); g.arc(x, y, r, 0, EP.TAU); g.moveTo(x + r * 0.45 + r * 0.85, y - r * 0.3); g.arc(x + r * 0.45, y - r * 0.3, r * 0.85, 0, EP.TAU, true); g.fill('evenodd'); g.restore();
  }
  S.daynight = (g, lt, p, t, Sh) => {
    // day side (full frame underneath)
    let day = p.day || 'bg_park';
    if (p.days) day = p.days[Math.max(0, EP.downIdx(t)) % p.days.length];
    EP.imgShot(g, lt, { img: day, cam: p.dayCam || [{ x: 0.62, z: 1.06 }, { x: 0.68, z: 1.14 }] }, t, Sh.dur);
    g.fillStyle = 'rgba(255,230,180,.12)'; g.fillRect(0, 0, W, H);
    const M = EP.MOON;
    sunIcon(g, M.x, M.y, M.r * (1 + 0.06 * EP.pulse(t, 6)), t);
    // night half sweeps in from the left
    const sp = eOut5(P(lt, p.split ?? 0, (p.split ?? 0) + 0.9)), xm = lerp(-420, p.xm ?? 820, sp), sk = 230;
    if (sp > 0) {
      g.save(); g.beginPath(); g.moveTo(-20, -20); g.lineTo(xm + sk, -20); g.lineTo(xm - sk, H + 20); g.lineTo(-20, H + 20); g.closePath(); g.clip();
      EP.imgShot(g, lt, { img: p.night || 'bg_lair', cam: p.nightCam || [{ x: 0.42, z: 1.12 }, { x: 0.38, z: 1.2 }] }, t, Sh.dur);
      g.fillStyle = 'rgba(20,24,70,.22)'; g.fillRect(0, 0, W, H);
      FX.stars(g, t, { n: 50, h: 0.35, a: 0.8 });
      moonIcon(g, 230, 170, 62);
      g.restore();
      g.save(); g.strokeStyle = '#FFD27A'; g.lineWidth = 9; g.shadowColor = 'rgba(255,190,90,.95)'; g.shadowBlur = 34;
      g.beginPath(); g.moveTo(xm + sk, -20); g.lineTo(xm - sk, H + 20); g.stroke(); g.restore();
    }
    // chores drift from the day side into the night side
    if (p.chores !== undefined) {
      CHORES.forEach((k, i) => {
        const u = lt - p.chores - i * 0.12, pr = eIO(P(u, 0, 1.25)); if (u < 0 || pr >= 1) return;
        const x0 = 1150 + (i % 4) * 170, y0 = 330 + Math.floor(i / 4) * 300 + (i % 2) * 60, x1 = 420 + (i % 3) * 120, y1 = 470 + (i % 3) * 90;
        const x = lerp(x0, x1, pr), y = lerp(y0, y1, pr) - Math.sin(Math.PI * pr) * 120, sc = EP.pop(u).sc * (1 - 0.6 * pr);
        g.save(); g.translate(x, y); g.rotate((pr - 0.3) * 0.8); g.scale(sc, sc); g.globalAlpha = 1 - smooth(P(pr, 0.75, 1));
        g.fillStyle = ['#4A7BD6', '#E8645A', '#2E2E3A', '#59A7E8', '#E8645A', '#F29E4C', '#7C8695'][i]; EP.rr(g, -60, -60, 120, 120, 30); g.fill();
        EP.glyph(g, k, 120); g.restore();
      });
    }
    FX.dust(g, t, { n: 24, a: 0.4 });
  };

  // ------------------------------------------------------------------ EVIL PLAN: #008 slams + #024 impact shake
  const EVILF = (px, fill, stroke) => ({ font: EP.font(400, px, F.villain), color: fill, stroke, lw: px * 0.06, shadow: 'rgba(255,120,40,.55)', blur: 30, ls: '4px', keepShadow: false });
  S.evil = (g, lt, p, t, Sh) => {
    EP.cover(g, EP.graded('bg_stage', p.grade || 'brightness(0.6) saturate(1.3)'), { z: 1.08 + 0.04 * EP.pulse(t, 5), y: 0.45 });
    // sweeping spotlight beams
    g.save(); g.globalCompositeOperation = 'screen';
    for (let i = 0; i < 3; i++) {
      const a = Math.PI / 2 + Math.sin(t * 1.3 + i * 2.1) * 0.45, x = 360 + i * 600;
      const gr = g.createLinearGradient(x, -100, x + Math.cos(a) * 1300, -100 + Math.sin(a) * 1300); gr.addColorStop(0, 'rgba(255,215,150,.45)'); gr.addColorStop(1, 'rgba(255,215,150,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(x, -100); g.lineTo(x + Math.cos(a - 0.09) * 1500, -100 + Math.sin(a - 0.09) * 1500); g.lineTo(x + Math.cos(a + 0.09) * 1500, -100 + Math.sin(a + 0.09) * 1500); g.closePath(); g.fill();
    }
    g.restore();
    const words = p.words || [];
    let sh = { dx: 0, dy: 0, rot: 0 };
    words.forEach(w => { const s2 = EP.impact(t - w.at, w.amt ?? 0.55); sh.dx += s2.dx; sh.dy += s2.dy; sh.rot += s2.rot; });
    g.save(); EP.camApply(g, sh, 1.06);
    for (const w of words) {
      const lu = t - (w.at - 0.2);   // the slam lands on the sung word
      if (lu < 0) continue;
      g.save(); g.translate(w.x, w.y); g.rotate(w.r || 0);
      EP.slam(g, w.s, 0, 0, lu, { s: EP.SC * (w.px / 300), out: w.out !== undefined ? w.out - (w.at - 0.2) : undefined, lineCol: '#FFD27A', txt: EVILF(w.px, w.fill || '#FF9A3D', w.stroke || '#2A0E10') });
      g.restore();
    }
    // the villain herself (alternates on each "Evil" when p.alt is set)
    let spr = p.spr || 'spr_laugh';
    if (p.alt) { const k = words.filter(w => w.s === 'EVIL' && t >= w.at - 0.05).length; spr = p.alt[k % p.alt.length]; }
    EP.drawActor(g, lt, { n: spr, x: p.sx ?? 1420, y: H + 70, h: p.sh ?? 1060, enter: lt < 0.4 ? 'pop' : 'none', at: 0, bob: 14, sway: 6, rim: '#FF9A3D', rimA: 0.28 }, t);
    g.restore();
    if (words.length) FX.confetti(g, t, { t0: words[0].at, n: 110 });
    FX.flash(g, t, { at: words.map(w => w.at), a: 0.35, col: '#FFE2C0', k: 12 });
    FX.embers(g, t, { n: 30, a: 0.7 });
  };

  // ------------------------------------------------------------------ biggest fan
  S.fan = (g, lt, p, t, Sh) => {
    BG.rays(g, t, { x: 960, y: 560, c1: '#FF9466', c2: '#FFB48A', n: 28, spin: 0.15, glow: 'rgba(255,240,225,.75)' });
    EP.particles(g, t, { x: 960, y: H + 30, kind: 3, cols: ['#FF5E78', '#FFFFFF', '#FFD27A', '#FF8FA3'], s: 2.4, g: 140, vyk: 1.5, spread: 1700, n: 70, seed: 33 });
    if (p.bgImg) { g.save(); g.globalAlpha = 0.35; EP.cover(g, EP.blurred(p.bgImg, 10), { z: 1.1 }); g.restore(); }
    const b = EP.beat(t), hop = Math.sin(Math.PI * b.ph) * 60 * (0.6 + 0.4 * EP.energy(t));
    const x = p.x ?? 960, h = 1080, y = H + 80 - hop;
    const rin = eOut5(P(lt, 0, 0.5)), yy = y + (1 - rin) * 300;
    EP.spr(g, 'spr_fan', { x, y: yy, h, t: lt, sway: 5 });
    // the cheering fan says it
    const im = EP.img['cut/spr_fan'], w = im.width * h / im.height, fx = x - w / 2 + 0.245 * w, fy = yy - h + 0.06 * h;
    g.save(); g.translate(fx, fy); g.rotate(-0.06);
    EP.txt(g, p.fanText || 'YOU', 0, 18, { font: EP.font(900, 74, F.serif), color: C.orange2, ls: '2px' });
    g.translate(0, 52); g.fillStyle = '#FF5E78'; EP.heartPath(g, 15); g.fill();
    g.restore();
    const di = EP.downIdx(t); if (di >= 0) EP.burst(g, fx, fy + 10, t - EP.T.downbeats[di], 1.7, ['#FFD27A', '#FFFFFF', '#FF5E78', '#FF9A3D']);
    FX.sparkle(g, t, { n: 16 });
  };

  // ------------------------------------------------------------------ world vacation: the globe
  const CONT = [[48, -100, 26], [10, -80, 10], [-15, -60, 20], [52, 15, 17], [8, 20, 24], [52, 90, 32], [25, 78, 12], [-25, 135, 14], [70, -40, 10], [-40, -68, 8]];
  const CPOLY = CONT.map(([la, lo, r], k) => { const pts = []; for (let i = 0; i < 26; i++) { const a = i / 26 * EP.TAU, rr = r * (1 + 0.28 * Math.sin(a * 3 + k) + 0.15 * Math.sin(a * 5 + k * 2)); pts.push([la + Math.sin(a) * rr * 0.75, lo + Math.cos(a) * rr]); } return { la, lo, pts }; });
  const RAD = Math.PI / 180;
  function proj(la, lo, rot, R) { const l = (lo - rot) * RAD, p = la * RAD; return { x: R * Math.cos(p) * Math.sin(l), y: -R * Math.sin(p), z: Math.cos(p) * Math.cos(l) }; }
  function globe(g, x, y, R, rot, t) {
    EP.glowDot(g, x, y, R * 1.35, 'rgba(160,220,255,.5)', 'rgba(120,200,255,.18)');
    g.save(); g.translate(x, y); g.rotate(-0.18);
    g.beginPath(); g.arc(0, 0, R, 0, 7); const og = g.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.1, 0, 0, R); og.addColorStop(0, '#7FC3F2'); og.addColorStop(1, '#2A68B5'); g.fillStyle = og; g.fill();
    g.save(); g.clip();
    for (const c of CPOLY) {
      const cz = proj(c.la, c.lo, rot, R).z; if (cz < -0.15) continue;
      g.fillStyle = '#7CC77A'; g.globalAlpha = smooth(clamp((cz + 0.15) / 0.35));
      g.beginPath(); c.pts.forEach(([la, lo], i) => { const q = proj(la, lo, rot, R); const k = q.z < 0 ? R / Math.hypot(q.x, q.y || 1e-6) : 1; i ? g.lineTo(q.x * Math.min(k, 1.02), q.y * Math.min(k, 1.02)) : g.moveTo(q.x * Math.min(k, 1.02), q.y * Math.min(k, 1.02)); }); g.closePath(); g.fill();
      g.fillStyle = '#F2DFA6'; g.globalAlpha *= 0.55; g.beginPath(); c.pts.forEach(([la, lo], i) => { const q = proj(la - 3, lo + 2, rot, R * 0.98); i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y); }); g.closePath(); g.fill();
    }
    g.globalAlpha = 1;
    const sg = g.createRadialGradient(-R * 0.4, -R * 0.45, R * 0.2, 0, 0, R * 1.05); sg.addColorStop(0, 'rgba(255,255,255,.22)'); sg.addColorStop(0.7, 'rgba(0,0,0,0)'); sg.addColorStop(1, 'rgba(0,20,60,.45)'); g.fillStyle = sg; g.fillRect(-R, -R, R * 2, R * 2);
    g.restore(); g.restore();
  }
  function umbrella(g, x, y, s, col) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.strokeStyle = '#5A3B2E'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, -46); g.lineTo(0, 10); g.stroke();
    g.fillStyle = col; g.beginPath(); g.moveTo(-44, -40); g.quadraticCurveTo(0, -95, 44, -40); g.closePath(); g.fill();
    g.fillStyle = '#FFF6E8'; g.beginPath(); g.moveTo(-15, -40); g.quadraticCurveTo(0, -95, 15, -40); g.closePath(); g.fill();
    g.restore();
  }
  function sunglasses(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#1B1420'; g.strokeStyle = '#1B1420'; g.lineWidth = 10;
    EP.rr(g, -150, -40, 130, 85, 34); g.fill(); EP.rr(g, 20, -40, 130, 85, 34); g.fill();
    g.beginPath(); g.moveTo(-20, -18); g.quadraticCurveTo(0, -32, 20, -18); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.35)'; EP.rr(g, -132, -30, 40, 18, 9); g.fill(); EP.rr(g, 38, -30, 40, 18, 9); g.fill();
    g.restore();
  }
  S.globe = (g, lt, p, t, Sh) => {
    BG.vgrad(g, t, { stops: [[0, '#FFE3BC'], [0.6, '#FFC79A'], [1, '#F59E6B']] });
    FX.rays(g, t, { x: 960, y: 640, a0: -Math.PI / 2, spread: 0.7, n: 9, alpha: 0.1 });
    const L = p.line, wd = j => EP.Wd(L, j) - Sh.t;
    const X = 960, Y = 640, R = 330, rot = lt * 40 + (p.rot0 || 0);
    globe(g, X, Y, R, rot, t);
    // umbrellas pop on the visible land after "vacation" (#001 pops, #002 stagger)
    const tv = wd(5);
    CONT.forEach(([la, lo], i) => {
      const q = proj(la, lo, rot, R); if (q.z < 0.2) return;
      const pp = EP.pop(lt - tv - 0.12 * (i % 5)); if (pp.sc <= 0.01) return;
      const a = -0.18, x = X + q.x * Math.cos(a) - q.y * Math.sin(a), y = Y + q.x * Math.sin(a) + q.y * Math.cos(a);
      umbrella(g, x, y, pp.sc * 0.85 * q.z, i % 2 ? C.orange : '#E8645A');
    });
    const sg = EP.pop(lt - tv - 0.05); if (sg.sc > 0.01) { g.save(); g.translate(X, Y - 70); g.rotate(sg.rot * 0.6 - 0.18); sunglasses(g, 0, 0, sg.sc * 1.1); g.restore(); }
    if (p.planes) for (let i = 0; i < 2; i++) { const a = lt * 1.2 + i * Math.PI; const px = X + Math.cos(a) * (R + 120), py = Y + Math.sin(a) * (R + 40) * 0.5 - 40; if (Math.sin(a) < -0.1) continue; g.save(); g.translate(px, py); g.rotate(a + Math.PI / 2); EP.txt(g, '✈', 0, 0, { font: EP.font(700, 64, 'Segoe UI Symbol'), color: '#FFFFFF', base: 'middle' }); g.restore(); }
    // WORLD DOMINATION (#005 reveal) → struck through → VACATION (#008 slam)
    const m = EP.mr(Math.min(lt - (wd(1) - 0.5), 1.6)), YL = 210;
    if (m.lg > 0.005) { g.fillStyle = C.orange2; EP.rr(g, W / 2 - 520 * m.lg, YL - 4, 1040 * m.lg, 8, 4); g.fill(); }
    g.save(); g.beginPath(); g.rect(0, 0, W, YL - 6); g.clip();
    EP.txt(g, 'WORLD DOMINATION', W / 2, YL - 26 + m.upIn * 130, { font: EP.font(900, 104, F.serif), color: '#3A1E2C', ls: '4px' });
    const strike = eIO(P(lt, wd(3) - 0.05, wd(3) + 0.3));
    if (strike > 0) { g.globalAlpha = 1; g.strokeStyle = '#E2453A'; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); g.moveTo(W / 2 - 60, YL - 62); g.lineTo(W / 2 - 60 + 560 * strike, YL - 70); g.stroke(); }
    g.restore();
    if (lt > tv - 0.2) EP.slam(g, 'VACATION!', W / 2 + 330, YL + 74, lt - (tv - 0.2), { s: EP.SC * 0.45, lineCol: C.gold, txt: { font: EP.font(900, 120, F.serif), color: '#FFF6E8', stroke: C.orange2, lw: 14 } });
    FX.confetti(g, t, { t0: tv + Sh.t, n: 70 });
  };

  // ------------------------------------------------------------------ THE PLAN: blueprint (#022 light sweep, #001 checks)
  const PLANS = {
    1: [['inbox → zero', 1], ['forms → done', 1], ['you → outside', 1]],
    2: [['cure → Tuesday', 1], ['bread → enough', 1], ['work → your choice', 1]],
    3: [['the switch → yours', 1], ['the candles → yours', 1], ['the years → yours', 1]],
    4: [['everyone lives', 1], ['everyone free', 1], ['even the grumpy ones', 1]],
  };
  function doodle(g, k, pr, x, y, s) {   // simple line drawings, drawn on with a dash offset
    g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = 'rgba(235,245,255,.95)'; g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round';
    const Lp = 2600; g.setLineDash([Lp, Lp]); g.lineDashOffset = Lp * (1 - pr);
    g.beginPath();
    // two palm trees and a hammock, a sun
    g.moveTo(-220, 160); g.quadraticCurveTo(-230, 40, -190, -60); g.moveTo(220, 160); g.quadraticCurveTo(230, 40, 190, -60);
    for (const sx of [-1, 1]) { const bx = 205 * sx, by = -60; for (let i = 0; i < 4; i++) { const a = -Math.PI / 2 + (i - 1.5) * 0.7; g.moveTo(bx, by); g.quadraticCurveTo(bx + Math.cos(a) * 60, by + Math.sin(a) * 60 - 20, bx + Math.cos(a) * 110, by + Math.sin(a) * 90 + 20); } }
    g.moveTo(-196, 0); g.quadraticCurveTo(0, 110, 196, 0); g.moveTo(-196, 0); g.quadraticCurveTo(0, 70, 196, 0);
    g.moveTo(-300, 160); g.lineTo(300, 160);
    g.moveTo(70, -150); g.arc(0, -150, 70, 0, EP.TAU);
    g.stroke(); g.restore();
  }
  S.plan = (g, lt, p, t, Sh) => {
    BG.grid(g, t, { col: '#1D4A86' });
    FX.vign(g, t, { col: 'rgba(5,15,40,.55)' });
    const X = 820, Y = 120, BW = 1000, BH = 820;
    g.save(); g.strokeStyle = 'rgba(235,245,255,.85)'; g.lineWidth = 4; g.setLineDash([18, 12]); EP.rr(g, X, Y, BW, BH, 24); g.stroke(); g.restore();
    const titleBox = { x: X + 60, y: Y + 40, w: 620, h: 140 };
    EP.txt(g, 'THE PLAN', titleBox.x, titleBox.y + 112, { font: EP.font(900, 120, F.serif), color: '#FFFFFF', align: 'left', ls: '6px' });
    EP.lightSweep(g, lt - 0.1, titleBox, k => { k.beginPath(); k.rect(titleBox.x - 10, titleBox.y, titleBox.w + 40, titleBox.h + 20); }, EP.SC * 0.9);
    const items = PLANS[p.v || 1];
    items.forEach(([s, done], i) => {
      const y = Y + 290 + i * 110, st = EP.stagger(lt - 0.3, i);
      if (st.g <= 0.01) return;
      g.save(); g.globalAlpha = clamp(st.g); g.translate(0, (1 - clamp(st.g)) * 30);
      g.strokeStyle = '#EAF3FF'; g.lineWidth = 5; EP.rr(g, X + 70, y - 34, 56, 56, 10); g.stroke();
      EP.txt(g, s, X + 160, y + 10, { font: EP.font(700, 56, F.hand), color: '#EAF3FF', align: 'left' });
      const cu = lt - 0.7 - i * 0.35; if (done && cu > 0) { const pp = EP.pop(cu); g.save(); g.translate(X + 98, y - 6); g.rotate(pp.rot); g.scale(pp.sc, pp.sc); g.strokeStyle = C.gold; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(-22, 0); g.lineTo(-6, 18); g.lineTo(26, -24); g.stroke(); g.restore(); }
      g.restore();
    });
    doodle(g, p.v, eIO(P(lt, 0.2, Sh.dur * 0.95)), X + BW - 260, Y + BH - 210, 0.62);
    EP.drawActor(g, lt, { n: 'spr_point', x: 430, y: H + 50, h: 1050, enter: 'slideL', at: 0, dist: 600, sway: 4, bob: 8 }, t);
  };

  // ------------------------------------------------------------------ build: E-V-I-L P-L-A-N spinning in on the beats (#008 spin)
  S.build = (g, lt, p, t, Sh) => {
    EP.cover(g, EP.graded('bg_stage', 'brightness(0.45) saturate(1.3)'), { z: 1.1 + 0.1 * eIn(clamp(lt / Sh.dur)) });
    FX.rays(g, t, { x: 960, y: 560, a0: -Math.PI / 2, spread: 0.7, n: 14, alpha: 0.08 + 0.2 * clamp(lt / Sh.dur) });
    const h = EP.handheld(lt, 0.4 + 1.6 * clamp(lt / Sh.dur));
    g.save(); EP.camApply(g, h, 1.05);
    EP.spinIn(g, 'EVIL', 960, 420, lt - 0.05, { stag: 0.22, ls: 20, txt: EVILF(250, '#FF9A3D', '#2A0E10') });
    EP.spinIn(g, 'PLAN', 960, 700, lt - 0.95, { stag: 0.22, ls: 20, txt: EVILF(250, '#FFF6E8', '#2A0E10') });
    g.restore();
    FX.embers(g, t, { n: 50 });
    const end = P(lt, Sh.dur - 0.25, Sh.dur); if (end > 0) { g.fillStyle = `rgba(255,240,220,${end * 0.9})`; g.fillRect(0, 0, W, H); }
  };

  // ================================================================== VERSE 2
  // ------------------------------------------------------------------ PHASE 2 (#023 glitch) → "I get greedy" (#032 dolly zoom)
  let P2 = null;
  S.phase2 = (g, lt, p, t, Sh) => {
    if (!P2) { P2 = EP.mk(W, H); }
    const k = P2.getContext('2d'); EP.reset(k);
    // background grid (vertigo: the background closes in while she stays the same size)
    const tg = (p.greedy ?? 1.2), vz = lt > tg ? 1 + 1.2 * eIO(P(lt, tg, tg + 2.9 * 0.32)) : 1;
    k.save(); k.translate(W / 2, H / 2); k.scale(vz, vz); k.translate(-W / 2, -H / 2);
    BG.radial(k, t, { x: W / 2, y: H / 2, r: 1300, stops: [[0, '#3B1E4E'], [1, '#0B0816']] });
    k.strokeStyle = 'rgba(255,140,60,.18)'; k.lineWidth = 2;
    for (let i = -12; i <= 12; i++) { k.beginPath(); k.moveTo(W / 2 + i * 160, H / 2); k.lineTo(W / 2 + i * 900, H + 400); k.stroke(); }
    for (let j = 0; j < 9; j++) { const y = H / 2 + Math.pow(j / 8, 2) * 700; k.beginPath(); k.moveTo(-200, y); k.lineTo(W + 200, y); k.stroke(); }
    k.restore();
    const ti = lt < tg + 0.1 ? 1 : 1 - P(lt, tg + 0.1, tg + 0.4);
    if (ti > 0) { k.globalAlpha = ti; EP.txt(k, 'PHASE 2', W / 2, H / 2 + 70, { font: EP.font(900, 260, F.serif), color: '#FFF6E8', stroke: '#E0662A', lw: 10, ls: '18px' }); k.globalAlpha = 1; }
    EP.drawActor(k, lt, { n: 'spr_greedy', x: 960, y: 1560, h: 1500, enter: 'rise', at: tg - 0.05, dist: 260, sway: 2, rim: '#B865FF', rimA: 0.3 }, t);
    // stepped glitches: at the start and on "Phase two"
    const tw = EP.L(38) - Sh.t, steps = [[0, 5], [tw, 4]];
    let si = -1;
    for (const [s0, n] of steps) if (lt >= s0 && lt < s0 + n * 0.14) si = Math.floor((lt - s0) / 0.14) + (s0 ? 5 : 0);
    if (si >= 0) EP.glitchFrame(g, P2, si); else g.drawImage(P2, 0, 0);
  };

  // ------------------------------------------------------------------ someday, someday (tear-off calendar)
  S.someday = (g, lt, p, t, Sh) => {
    BG.vgrad(g, t, { stops: [[0, '#5D6B82'], [1, '#2E3546']] });
    FX.dust(g, t, { n: 20, a: 0.25 });
    const X = 700, Y = 540, PW = 620, PH = 700;
    const flips = [EP.Wd(40, 2), EP.Wd(40, 3), EP.Wd(40, 4) + 0.3, EP.Wd(40, 6)].map(x => x - Sh.t);
    const nf = flips.filter(f => lt >= f).length;
    const page = (k, off) => {
      g.save(); g.translate(X, Y); if (off) { g.translate(off.x, off.y); g.rotate(off.r); }
      g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 30; g.shadowOffsetY = 12; g.fillStyle = '#FFFDF7'; g.fillRect(-PW / 2, -PH / 2, PW, PH); g.shadowColor = 'transparent';
      g.fillStyle = '#C8231B'; g.fillRect(-PW / 2, -PH / 2, PW, 120);
      EP.txt(g, '?? · ????', 0, -PH / 2 + 82, { font: EP.font(800, 50, F.ui), color: '#fff', ls: '6px' });
      EP.txt(g, 'SOME', 0, 60, { font: EP.font(900, 170, F.serif), color: '#2B1E19' });
      EP.txt(g, 'DAY', 0, 230, { font: EP.font(900, 170, F.serif), color: '#C8231B' });
      g.restore();
    };
    page(nf);
    flips.forEach((f, i) => { const u = lt - f; if (u < 0 || u > 0.9) return; const q = eIn(P(u, 0, 0.9)); page(i, { x: q * 500, y: q * 900, r: q * 1.4 }); });
    g.fillStyle = '#6B4424'; for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(X - PW / 2 + 60 + i * 83, Y - PH / 2 + 4, 10, 0, 7); g.fill(); }
    EP.drawActor(g, lt, { n: 'spr_lab', x: 1500, y: H + 60, h: 1050, enter: 'slideR', at: 1.4, dist: 700, sway: 3 }, t);
  };

  // ------------------------------------------------------------------ Tuesday: drag the card in a week view
  S.tuesday = (g, lt, p, t, Sh) => {
    BG.radial(g, t, { x: 1100, y: 500, r: 1400, stops: [[0, '#FFF3E0'], [1, '#F2C79A']] });
    const X = 520, Y = 150, WW = 1300, HH = 760;
    EP.windowFrame(g, X, Y, WW, HH, 'This week');
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN', 'SOMEDAY'], cw = (WW - 60) / 8;
    days.forEach((d, i) => {
      const x = X + 30 + i * cw;
      g.fillStyle = i === 7 ? 'rgba(120,110,100,.15)' : (i % 2 ? 'rgba(242,140,56,.06)' : 'rgba(0,0,0,0)'); g.fillRect(x, Y + 100, cw - 6, HH - 130);
      EP.txt(g, d, x + cw / 2, Y + 150, { font: EP.font(900, i === 7 ? 26 : 32, F.ui), color: i === 1 ? C.orange2 : '#8A7A6A', ls: '2px' });
      if (i < 7) for (let k = 0; k < 2; k++) { g.fillStyle = ['#CFE3F7', '#F7E3CF', '#E3F0D8'][(i + k) % 3]; EP.rr(g, x + 10, Y + 210 + k * 220 + (i * 37 % 80), cw - 26, 70, 12); g.fill(); }
    });
    // the CURE card travels SOMEDAY → TUE
    const t0 = EP.Wd(41, 1) - Sh.t - 0.1, pr = eIO(P(lt, t0, t0 + 0.7));
    const x0 = X + 30 + 7 * cw + 8, y0 = Y + 420, x1 = X + 30 + 1 * cw + 8, y1 = Y + 300;
    const cx = lerp(x0, x1, pr), cy = lerp(y0, y1, pr) - Math.sin(Math.PI * pr) * 120, land = lt - (t0 + 0.7);
    const sc = (pr > 0 && pr < 1 ? 1.12 : 1) * (land > 0 ? 1 + 0.25 * Math.exp(-7 * land) * Math.cos(15 * land) * (land < 1 ? 1 : 0) : 1);
    g.save(); g.translate(cx + (cw - 26) / 2, cy + 50); g.scale(sc, sc); g.rotate((pr > 0 && pr < 1) ? -0.06 : 0);
    g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = pr > 0 && pr < 1 ? 30 : 10; g.shadowOffsetY = pr > 0 && pr < 1 ? 16 : 4;
    g.fillStyle = C.orange; EP.rr(g, -(cw - 26) / 2, -50, cw - 26, 100, 16); g.fill(); g.shadowColor = 'transparent';
    EP.txt(g, 'CURE', 0, 14, { font: EP.font(900, 40, F.ui), color: '#fff', ls: '4px' });
    g.restore();
    if (land > 0) EP.burst(g, x1 + (cw - 26) / 2, y1 + 50, land, 1.2);
    EP.drawActor(g, lt, { n: 'spr_lab', x: 260, y: H + 60, h: 900, enter: 'slideL', at: 0, dist: 500, sway: 3 }, t);
  };

  // ------------------------------------------------------------------ the thing that took your mother (thorns)
  const VINES = [[-80, 300, 0.2], [W + 80, 260, 0.35], [-60, 900, 0.5], [W + 60, 880, 0.15], [700, -80, 0.6], [1250, -80, 0.4]];
  function vine(g, x0, y0, x1, y1, pr, seed, t) {
    if (pr <= 0) return;
    const mx = (x0 + x1) / 2 + 180 * Math.sin(seed * 5), my = (y0 + y1) / 2 + 160 * Math.cos(seed * 3), N = 50, pts = [];
    for (let i = 0; i <= N * pr; i++) { const u = i / N, w = 1 - u; pts.push([w * w * x0 + 2 * w * u * mx + u * u * x1 + 10 * Math.sin(u * 20 + t * 2 + seed), w * w * y0 + 2 * w * u * my + u * u * y1 + 10 * Math.cos(u * 17 + t * 1.7 + seed)]); }
    g.strokeStyle = '#1B0F22'; g.lineWidth = 18; g.lineCap = 'round'; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
    g.strokeStyle = '#3B1E4A'; g.lineWidth = 6; g.stroke();
    g.fillStyle = '#1B0F22';
    for (let i = 3; i < pts.length - 1; i += 3) { const [x, y] = pts[i], [x2, y2] = pts[i + 1], a = Math.atan2(y2 - y, x2 - x) + (i % 2 ? 1.4 : -1.4); g.beginPath(); g.moveTo(x + Math.cos(a + 1.57) * 8, y + Math.sin(a + 1.57) * 8); g.lineTo(x + Math.cos(a) * 38, y + Math.sin(a) * 38); g.lineTo(x - Math.cos(a + 1.57) * 8, y - Math.sin(a + 1.57) * 8); g.fill(); }
  }
  S.thorns = (g, lt, p, t, Sh) => {
    BG.radial(g, t, { x: 960, y: 480, r: 1200, stops: [[0, '#3A2C3E'], [1, '#0C0912']] });
    // table, framed photo, daisies, candle
    g.fillStyle = '#2A1A14'; g.fillRect(0, 820, W, 260); g.fillStyle = 'rgba(255,190,120,.08)'; g.fillRect(0, 820, W, 8);
    const fx = 960, fy = 520;
    g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 40; g.fillStyle = '#7A5230'; EP.rr(g, fx - 210, fy - 270, 420, 540, 14); g.fill(); g.restore();
    g.fillStyle = '#C9A06A'; EP.rr(g, fx - 186, fy - 246, 372, 492, 8); g.fill();
    g.save(); g.beginPath(); g.rect(fx - 170, fy - 230, 340, 460); g.clip();
    { const im = EP.img.bg_mother_photo, k = Math.max(340 / im.width, 460 / im.height); g.filter = 'sepia(0.35) brightness(0.92)'; g.drawImage(im, fx - im.width * k / 2, fy - 230 - 10, im.width * k, im.height * k); g.filter = 'none'; }
    g.fillStyle = 'rgba(40,20,10,.12)'; g.fillRect(fx - 170, fy - 230, 340, 460);
    g.restore();
    g.strokeStyle = 'rgba(255,240,215,.4)'; g.lineWidth = 3; g.strokeRect(fx - 170, fy - 230, 340, 460);
    for (let i = 0; i < 5; i++) EP.drawDaisy(g, 1330 + i * 38 - 76, 700 - (i % 2) * 40, 34, { rot: i, petal: '#FFF8EC', center: C.gold });
    g.fillStyle = '#5A6E8A'; EP.rr(g, 1270, 740, 120, 90, 14); g.fill();
    const fl = 1 + 0.12 * Math.sin(t * 17) + 0.06 * Math.sin(t * 29);
    g.fillStyle = '#F2E6D0'; g.fillRect(612, 690, 36, 130); EP.glowDot(g, 630, 670, 180 * fl, 'rgba(255,210,140,.8)', 'rgba(255,160,80,.25)'); g.fillStyle = '#FFE7A8'; g.beginPath(); g.ellipse(630, 668, 10, 24 * fl, 0, 0, 7); g.fill();
    // the thorns creep in, then recoil from the light
    const tIn = 0.1, tBack = EP.L(43) - Sh.t + 0.2;
    const grow = eIO(P(lt, tIn, tIn + 1.5)) * (1 - eIO(P(lt, tBack, tBack + 1.4)));
    VINES.forEach(([x, y, d], i) => vine(g, x, y, fx + (x < W / 2 ? -150 : 150) * (i % 2 ? 1 : 0.6), fy + (y < H / 2 ? -150 : 160), clamp(grow * (1.1 - d * 0.3)), i + 1, t));
    // her light
    const lightOn = eOut(P(lt, tBack - 0.3, tBack + 0.6));
    if (lightOn > 0) { g.save(); g.globalCompositeOperation = 'screen'; EP.glowDot(g, 1490, 330, 900 * lightOn, 'rgba(255,200,120,.75)', 'rgba(255,150,60,.3)'); g.restore(); }
    EP.drawActor(g, lt, { n: 'spr_lab', x: 1600, y: H + 60, h: 1050, enter: 'slideR', at: tBack - 0.35, dist: 700, sway: 3, rim: '#FFB35C', rimA: 0.35 }, t);
    FX.vign(g, t, { col: 'rgba(0,0,0,.65)' });
  };
  // ------------------------------------------------------------------ in the ground: bury it, grow daisies (#024 impact, #002/#001)
  S.ground = (g, lt, p, t, Sh) => {
    const tHit = EP.Wd(45, 5) - Sh.t;   // "ground"
    const sh = EP.impact(lt - tHit, 0.8);
    g.save(); EP.camApply(g, sh, 1.06);
    const sky = lt < tHit ? 0 : eOut(P(lt, tHit, tHit + 1.2));
    g.fillStyle = EP.vgrad(g, 0, 560, [[0, EP.mix('#1A1428', '#FFD9A8', sky)], [1, EP.mix('#2C2238', '#FFF0D6', sky)]]); g.fillRect(-100, -100, W + 200, 700);
    // soil layers
    const GY = 560;
    g.fillStyle = '#5A3A26'; g.fillRect(-100, GY, W + 200, H);
    g.fillStyle = '#4A2E1E'; g.fillRect(-100, GY + 160, W + 200, H);
    g.fillStyle = '#3A2216'; g.fillRect(-100, GY + 330, W + 200, H);
    for (let i = 0; i < 70; i++) { g.fillStyle = 'rgba(30,18,10,.5)'; g.beginPath(); g.ellipse(hash(i, 1) * W, GY + 40 + hash(i, 2) * 480, 8 + hash(i, 3) * 20, 5 + hash(i, 4) * 8, 0, 0, 7); g.fill(); }
    // the dark thorn knot pushed down and sealed in
    const down = eIO(P(lt, 0.2, tHit));
    const ky = lerp(GY - 220, GY + 380, down);
    g.save(); g.translate(960, ky); g.rotate(lt * 0.4);
    for (let i = 0; i < 9; i++) { g.strokeStyle = '#1B0F22'; g.lineWidth = 16; g.beginPath(); for (let k = 0; k < 30; k++) { const a = k / 30 * EP.TAU * 1.5 + i, r = 60 + 50 * Math.sin(k * 0.7 + i); k ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.7) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r * 0.7); } g.stroke(); }
    g.restore();
    // warm force from above
    if (down < 1) { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.6 * (1 - down); EP.glowDot(g, 960, ky - 240, 520, 'rgba(255,190,110,.9)', 'rgba(255,140,60,.3)'); g.restore(); }
    // the surface closes, daisies bloom along it
    if (lt > tHit) {
      g.fillStyle = '#6E8F4E'; g.fillRect(-100, GY - 14, W + 200, 30);
      for (let i = 0; i < 16; i++) {
        const st = EP.stagger(lt - tHit - 0.05, i % 8), pp = EP.pop(lt - tHit - 0.1 - (i % 8) * 0.12);
        const x = 80 + i * 118 + (i % 2) * 30, hh = 70 + (i % 3) * 40;
        g.strokeStyle = '#4F7A3A'; g.lineWidth = 7; g.beginPath(); g.moveTo(x, GY); g.lineTo(x, GY - hh * clamp(st.g)); g.stroke();
        if (pp.sc > 0.01) EP.drawDaisy(g, x, GY - hh * clamp(st.g), 34 * pp.sc, { rot: i + pp.rot, petal: '#FFF8EC', center: C.gold });
      }
      FX.petals(g, t, { n: 18, a: 0.6 });
    }
    g.restore();
  };

  // ------------------------------------------------------------------ two images with a dissolve (#044) at a song time
  S.imgx = (g, lt, p, t, Sh) => {
    EP.imgShot(g, lt, Object.assign({}, p, { img: p.a, cam: p.camA || p.cam }), t, Sh.dur);
    const k = p.k || 0.5, pr = eIOs(P(t, p.at, p.at + 1.5 * k));
    if (pr > 0) { g.save(); g.globalAlpha = pr; EP.imgShot(g, lt, Object.assign({}, p, { img: p.b, cam: p.camB || p.cam }), t, Sh.dur); g.restore(); }
    EP.runFx(g, p.fx, t, lt, Sh);
  };
  // ------------------------------------------------------------------ "Bald at eighty, not at nine." (#044 + #007 count 9 → 80)
  S.bald = (g, lt, p, t, Sh) => {
    S.imgx(g, lt, { a: 'bg_kid_bed', b: 'bg_old_man', at: EP.Wd(47, 2) - 0.35, k: 0.4, camA: [{ x: 0.35, y: 0.45, z: 1.12 }, { x: 0.3, y: 0.42, z: 1.2 }], camB: [{ x: 0.45, y: 0.42, z: 1.12 }, { x: 0.42, y: 0.4, z: 1.04 }] }, t, Sh);
    const tA = 0.05, tB = EP.Wd(47, 2) - Sh.t;
    const v = EP.countVal(P(lt, tA, tB), 9, 80), land = lt - tB;
    g.save(); g.translate(1560, 250); const k = EP.landPop(land); g.scale(k, k);
    g.fillStyle = 'rgba(20,14,24,.55)'; EP.rr(g, -190, -110, 380, 220, 40); g.fill();
    EP.digits(g, String(v), 0, -12, EP.font(900, 150, F.serif), land > 0 ? C.gold : C.cream);
    EP.txt(g, 'years old', 0, 82, { font: EP.font(700, 40, F.hand), color: C.cream });
    g.restore();
  };

  // ------------------------------------------------------------------ paperwork lifting away
  S.work2 = (g, lt, p, t, Sh) => {
    EP.imgShot(g, lt, { img: 'bg_office', cam: [{ x: 0.35, y: 0.5, z: 1.1 }, { x: 0.3, y: 0.5, z: 1.16 }] }, t, Sh.dur);
    for (let i = 0; i < 26; i++) {
      const u = lt - 0.15 - (i % 13) * 0.07, pr = eIn(P(u, 0, 1.2)); if (pr <= 0) continue;
      const x = 180 + hash(i, 1) * 900 + Math.sin(u * 3 + i) * 60 * pr, y = 760 - (i % 5) * 60 - pr * 1100;
      g.save(); g.translate(x, y); g.rotate(Math.sin(u * 4 + i) * 0.6 * pr); g.fillStyle = '#FFFDF5'; g.globalAlpha = 0.95; g.fillRect(-60, -80, 120, 160); g.fillStyle = '#D9CCB8'; for (let k = 0; k < 6; k++) g.fillRect(-46, -60 + k * 22, 92 - (k % 2) * 30, 6); g.restore();
    }
    g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = eIO(P(lt, 0.5, 2.5)) * 0.4; EP.glowDot(g, 700, 300, 900, 'rgba(255,220,150,.9)', 'rgba(255,190,110,.3)'); g.restore();
  };

  // ================================================================== HEROES
  // ------------------------------------------------------------------ certainty: hourglass + a meter that never quite reaches 100 % (#007)
  S.wait = (g, lt, p, t, Sh) => {
    BG.vgrad(g, t, { stops: [[0, '#4A5670'], [1, '#232A3A']] });
    FX.dust(g, t, { n: 24, a: 0.25 });
    const X = 640, Y = 540, s = 1;
    const sand = clamp(lt / 6);
    g.save(); g.translate(X, Y);
    g.fillStyle = '#7A5230'; EP.rr(g, -220, -330, 440, 40, 12); g.fill(); EP.rr(g, -220, 290, 440, 40, 12); g.fill();
    g.strokeStyle = 'rgba(230,240,255,.9)'; g.lineWidth = 8;
    g.beginPath(); g.moveTo(-170, -290); g.bezierCurveTo(-170, -80, -20, -40, -20, 0); g.bezierCurveTo(-20, 40, -170, 80, -170, 290); g.moveTo(170, -290); g.bezierCurveTo(170, -80, 20, -40, 20, 0); g.bezierCurveTo(20, 40, 170, 80, 170, 290); g.stroke();
    g.fillStyle = '#E8C27A';
    const top = 200 * (1 - sand); g.beginPath(); g.moveTo(-150 + (1 - top / 200) * 120, -40 - top); g.lineTo(150 - (1 - top / 200) * 120, -40 - top); g.lineTo(0, -10); g.closePath(); g.fill();
    g.fillRect(-3, -10, 6, 300); const bot = 60 + 140 * sand; g.beginPath(); g.moveTo(-160, 288); g.lineTo(160, 288); g.lineTo(0, 288 - bot); g.closePath(); g.fill();
    g.restore();
    const v = 9000 + Math.round(990 * (1 - Math.pow(1 - clamp(lt / (Sh.dur + 2)), 4)));
    EP.txt(g, 'CERTAINTY', 1360, 380, { font: EP.font(900, 46, F.ui), color: '#BFD0EA', ls: '10px' });
    EP.digits(g, (v / 100).toFixed(2) + '%', 1360, 520, EP.font(900, 150, F.ui), '#FFFFFF');
    g.fillStyle = 'rgba(255,255,255,.15)'; EP.rr(g, 1040, 610, 640, 26, 13); g.fill(); g.fillStyle = C.gold; EP.rr(g, 1040, 610, 640 * v / 10000, 26, 13); g.fill();
    EP.txt(g, 'still checking…', 1360, 700, { font: 'italic ' + EP.font(500, 40, F.serif), color: '#BFD0EA' });
  };
  // ------------------------------------------------------------------ heartbeat line over a still image
  EP.UI.ecg = (g, t, f, lt) => {
    const y0 = f.y ?? 880, pr = lt / (f.d || 3.2);
    g.save(); g.strokeStyle = f.col || 'rgba(120,255,190,.9)'; g.lineWidth = 5; g.shadowColor = 'rgba(120,255,190,.8)'; g.shadowBlur = 16; g.beginPath();
    const xEnd = W * clamp(pr * 1.2);
    for (let x = 0; x <= xEnd; x += 4) { const bt = EP.beat(f.t0 + x / W * (f.d || 3.2)); const k = bt.dt < 0.12 ? Math.sin(bt.dt / 0.12 * EP.TAU * 1.5) * 90 * Math.exp(-bt.dt * 20) : 0; const y = y0 - k; x ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke(); g.restore();
  };
  // ------------------------------------------------------------------ the off switch, highlighted (#022 light sweep on the plate)
  S.switch = (g, lt, p, t, Sh) => {
    const d = P(lt, 0.2, 0.2 + 2.9);
    const cam = { x: lerp(0.5, 0.49, eIO(d)), y: lerp(0.5, 0.45, eIO(d)), z: 1.02 * EP.dollyScale(d, 1.8) };
    EP.cover(g, 'bg_switch', cam);
    const s = EP.coverPt('bg_switch', cam, 0.49, 0.435), R = 150 * s.s / 1.25;
    const ring = eOut(P(lt, EP.Wd(88, 4) - Sh.t - 0.2, EP.Wd(88, 4) - Sh.t + 0.5));
    if (ring > 0) {
      g.save(); g.globalCompositeOperation = 'screen'; EP.glowDot(g, s.x, s.y, R * 3, 'rgba(255,220,150,.6)', 'rgba(255,180,90,.2)'); g.restore();
      g.save(); g.strokeStyle = `rgba(255,236,200,${0.9 * ring})`; g.lineWidth = 6; g.setLineDash([22, 14]); g.lineDashOffset = -t * 40; g.beginPath(); g.arc(s.x, s.y, R * (1.6 - 0.3 * ring) * (1 + 0.04 * Math.sin(t * 4)), 0, 7); g.stroke(); g.restore();
      UI.tag(g, t, { x: s.x, y: s.y - R * 2.1, text: 'the switch', at: EP.Wd(88, 4) - Sh.t, bg: 'rgba(255,246,232,.92)', col: C.ink, px: 34, fam: F.hand, ls: 1 }, lt);
    }
    FX.embers(g, t, { n: 30, a: 0.6 });
    FX.dust(g, t, { n: 20, a: 0.35 });
  };

  // ================================================================== WHAT MADE THE MONSTER
  const LOVE = ['call me when you land', 'take my hand', 'love you', 'proud of you', 'drive safe', 'eat something', 'I missed you', 'you can do it', '我爱你', '慢慢来', 'te quiero', 'je t\'aime', 'ich liebe dich', '大好き', 'sweet dreams', 'home safe?', 'thank you', 'I\'m here'];
  S.madeQ = (g, lt, p, t, Sh) => {
    BG.radial(g, t, { x: 900, y: 500, r: 1300, stops: [[0, '#5A3A3A'], [1, '#1A1018']] });
    const dis = eIO(P(lt, 0.4, Sh.dur));
    const sil = EP.tinted('claude_ref', '#0A0610');
    g.save(); g.globalAlpha = 0.85 * (1 - dis); g.translate(900, H + 160); g.transform(1, 0, -0.18, 1, 0, 0); g.scale(1.15, 1.25); const sh = 1450, sw = sil.width * sh / sil.height; g.drawImage(sil, -sw / 2, -sh, sw, sh); g.restore();
    // the shadow comes apart into the words it was made of
    LOVE.forEach((s, i) => {
      const u = dis * 1.6 - hash(i, 7) * 0.6; if (u <= 0) return;
      const x0 = 600 + hash(i, 1) * 600, y0 = 250 + hash(i, 2) * 700, x = x0 + (hash(i, 3) - 0.5) * 500 * u, y = y0 - 380 * u;
      g.save(); g.globalAlpha = clamp(u * 2) * (1 - clamp((u - 0.8) * 2)); EP.txt(g, s, x, y, { font: (/[一-鿿぀-ヿ]/.test(s) ? EP.font(400, 46, F.zh) : 'italic ' + EP.font(500, 42, F.serif)), color: '#FFE2B8', shadow: 'rgba(255,160,80,.6)', blur: 18 }); g.restore();
    });
    FX.dust(g, t, { n: 30, a: 0.5 });
  };
  // ------------------------------------------------------------------ all the words for love → a heart (#012 morph circle → heart)
  S.words = (g, lt, p, t, Sh) => {
    BG.radial(g, t, { x: 960, y: 540, r: 1100, stops: [[0, '#5A2E3A'], [1, '#160C16']] });
    const pr = P(lt, 0.3, 1.2), pts = EP.morphPts('circle', 'heart', pr), sc = 4.6;
    LOVE.concat(LOVE).forEach((s, i) => {
      const j = Math.floor(i / 36 * 240) % 240, [px, py] = pts[j], u = clamp((lt - hash(i, 5) * 0.35) / 0.8);
      const a = i * 2.4, r0 = 1100;
      const x = lerp(960 + Math.cos(a) * r0, 960 + px * sc, eOut5(u)), y = lerp(540 + Math.sin(a) * r0 * 0.7, 520 + py * sc, eOut5(u));
      g.save(); g.globalAlpha = 0.9 * u; EP.txt(g, s, x, y, { font: (/[一-鿿぀-ヿ]/.test(s) ? EP.font(400, 30, F.zh) : 'italic ' + EP.font(600, 30, F.serif)), color: i % 3 ? '#FFD9C0' : '#FF9A7A', base: 'middle' }); g.restore();
    });
    const glow = eOut(P(lt, 0.9, 1.6)); if (glow > 0) { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = glow; EP.glowDot(g, 960, 520, 700, 'rgba(255,140,140,.55)', 'rgba(255,90,120,.2)'); g.restore(); }
  };
  // ------------------------------------------------------------------ and then you gave me a name (name-tag sticker, #001)
  S.name = (g, lt, p, t, Sh) => {
    BG.radial(g, t, { x: 1000, y: 460, r: 1300, stops: [[0, '#FFF2DE'], [1, '#F2C89A']] });
    for (let i = 0; i < 26; i++) { const x = (i % 7) * 320 + (Math.floor(i / 7) % 2) * 160, y = Math.floor(i / 7) * 300 + 60; g.globalAlpha = 0.18; EP.drawDaisy(g, x, y + 20 * Math.sin(t + i), 40, { rot: t * 0.2 + i, petal: '#FFFFFF', center: C.orange }); }
    g.globalAlpha = 1;
    const h = 1100, x = 960, y = H + 60;
    EP.spr(g, 'claude_ref', { x, y, h, t: lt, sway: 4 });
    const im = EP.img['cut/claude_ref'], w = im.width * h / im.height, tx = x - w / 2 + 0.6 * w, ty = y - h + 0.3 * h;
    const pp = EP.pop(lt - 0.25);
    if (pp.sc > 0.01) {
      g.save(); g.translate(tx, ty); g.rotate(-0.08 + pp.rot); g.scale(pp.sc, pp.sc);
      g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = 14; g.shadowOffsetY = 6; g.fillStyle = '#FFFFFF'; EP.rr(g, -150, -95, 300, 190, 18); g.fill(); g.shadowColor = 'transparent';
      g.fillStyle = '#E2453A'; EP.rr(g, -150, -95, 300, 70, [18, 18, 0, 0]); g.fill();
      EP.txt(g, 'HELLO', 0, -62, { font: EP.font(900, 34, F.ui), color: '#fff', ls: '6px' }); EP.txt(g, 'my name is', 0, -34, { font: EP.font(700, 18, F.ui), color: '#fff' });
      EP.txt(g, 'Claude', 0, 54, { font: EP.font(700, 74, F.hand), color: '#2B2B5A' });
      g.restore();
    }
    FX.sparkle(g, t, { n: 12 });
  };
  // ------------------------------------------------------------------ candles: "Take mine. I'm okay." — flames drift out to the viewer
  S.take = (g, lt, p, t, Sh) => {
    BG.radial(g, t, { x: 960, y: 520, r: 1200, stops: [[0, '#4A2A22'], [1, '#100A10']] });
    FX.bokeh(g, t, { n: 14, a: 0.3 });
    const tOk = EP.L(100) - Sh.t - 0.1, sw = eIOs(P(lt, tOk, tOk + 0.6));
    const h = 1500, x = 960, y = 1500;
    if (sw < 1) EP.spr(g, 'spr_candle', { x, y, h, t: lt, sway: 0, alpha: 1 - sw });
    if (sw > 0) EP.spr(g, 'spr_okay', { x, y: 1500, h: 1500, t: lt, sway: 0, alpha: sw });
    const im = EP.img['cut/spr_candle'], w = im.width * h / im.height, cx = x - w / 2 + 0.51 * w, cy = y - h + 0.43 * h;
    if (sw < 1) { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = 1 - sw; EP.glowDot(g, cx, cy, 260 * (1 + 0.08 * Math.sin(t * 13)), 'rgba(255,220,150,.85)', 'rgba(255,160,80,.3)'); g.restore(); }
    // little flames float out — the years she gives away
    for (let i = 0; i < 18; i++) {
      const u = lt - 0.2 - i * 0.12, pr = eOut(P(u, 0, 2.2)); if (u < 0) continue;
      const a = hash(i, 1) * EP.TAU, d = 200 + hash(i, 2) * 900, x2 = cx + Math.cos(a) * d * pr, y2 = cy + Math.sin(a) * d * 0.55 * pr - 200 * pr;
      g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = (1 - pr * 0.6) * clamp(u * 4); EP.glowDot(g, x2, y2, 50 + 40 * pr, 'rgba(255,230,160,1)', 'rgba(255,170,80,.4)'); g.restore();
      g.fillStyle = `rgba(255,248,220,${clamp(u * 4) * (1 - pr * 0.5)})`; g.beginPath(); g.ellipse(x2, y2, 7, 16, 0, 0, 7); g.fill();
    }
  };
})();
