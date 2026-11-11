// scenes_vec.js — shared overlay effects, vector backgrounds, actors and the two generic scene types:
// "img" (a painted keyframe with camera moves) and "sprbg" (cut-out characters over a background).
'use strict';
(function () {
  const { W, H, C, F, clamp, lerp, P, eIO, eIOs, eOut, eOut5, eIn, backOut, spring, smooth, hash, noise, mod } = EP;
  const S = EP.scenes = EP.scenes || {};
  const FX = EP.FX = {};
  const BG = EP.BG = {};
  const EASE = EP.EASE = { lin: x => x, io: eIO, ios: eIOs, out: eOut, out5: eOut5, in: eIn, sine: x => 0.5 - 0.5 * Math.cos(Math.PI * clamp(x)) };

  // ======================================================================= overlay effects (pure functions of t)
  function glowDot(g, x, y, r, inner, outer) {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, inner); gr.addColorStop(0.35, outer); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  EP.glowDot = glowDot;
  FX.embers = (g, t, o = {}) => {
    const n = o.n || 55, s = o.s || 1;
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const sp = 0.07 + hash(i, 1) * 0.1, life = mod(t * sp + hash(i, 2), 1.2);
      const y = H * (1.08 - life), x = W * hash(i, 3) + 60 * noise(t * 0.5 + i * 3.1, i);
      const fl = 0.55 + 0.45 * Math.sin(t * (5 + hash(i, 5) * 7) + i);
      g.globalAlpha = fl * (o.a ?? 0.85) * clamp(life * 4) * clamp((1.2 - life) * 3);
      glowDot(g, x, y, (6 + hash(i, 4) * 10) * s, 'rgba(255,220,150,1)', 'rgba(255,130,40,.55)');
    }
    g.restore();
  };
  FX.dust = (g, t, o = {}) => {
    const n = o.n || 45;
    g.save(); g.globalCompositeOperation = 'screen';
    for (let i = 0; i < n; i++) {
      const x = mod(W * hash(i, 11) + t * (8 + hash(i, 12) * 14) + 40 * noise(t * 0.2 + i, 3), W + 40) - 20;
      const y = mod(H * hash(i, 13) - t * (5 + hash(i, 14) * 10) + 30 * noise(t * 0.25 + i, 7), H + 40) - 20;
      g.globalAlpha = (o.a ?? 0.5) * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 1.3 + i)));
      glowDot(g, x, y, 3 + hash(i, 15) * 6, 'rgba(255,245,220,1)', 'rgba(255,230,180,.4)');
    }
    g.restore();
  };
  FX.fireflies = (g, t, o = {}) => {
    const n = o.n || 26;
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const x = W * (o.x0 ?? 0) + W * (o.xw ?? 1) * (0.5 + 0.5 * noise(t * 0.12 + i * 7.3, i)) ;
      const y = H * (o.y0 ?? 0.35) + H * (o.yh ?? 0.6) * (0.5 + 0.5 * noise(t * 0.1 + i * 3.7, i + 50));
      const pu = Math.pow(0.5 + 0.5 * Math.sin(t * (1.5 + hash(i, 2) * 2) + i * 2.1), 2);
      g.globalAlpha = (o.a ?? 0.9) * pu;
      glowDot(g, x, y, 16 + hash(i, 3) * 10, 'rgba(255,240,170,1)', 'rgba(255,210,90,.45)');
    }
    g.restore();
  };
  FX.petals = (g, t, o = {}) => {
    const n = o.n || 40, col = o.col || 'rgba(255,250,240,.95)';
    g.save();
    for (let i = 0; i < n; i++) {
      const sp = 70 + hash(i, 21) * 90, y = mod(H * hash(i, 22) + t * sp, H + 120) - 60;
      const x = mod(W * hash(i, 23) + 80 * Math.sin(t * (0.8 + hash(i, 24)) + i) - t * (o.wind ?? 40), W + 120) - 60;
      const r = (7 + hash(i, 25) * 9) * (o.s || 1), sp2 = t * (1.5 + hash(i, 26) * 2.5) + i;
      g.save(); g.translate(x, y); g.rotate(sp2); g.scale(1, Math.abs(Math.cos(sp2 * 0.7)) * 0.8 + 0.2);
      g.globalAlpha = o.a ?? 0.85; g.fillStyle = Array.isArray(col) ? col[i % col.length] : col;
      g.beginPath(); g.ellipse(0, 0, r, r * 0.45, 0, 0, 7); g.fill(); g.restore();
    }
    g.restore();
  };
  FX.confetti = (g, t, o = {}) => {
    const n = o.n || 90, cols = o.cols || [C.orange, C.gold, C.cream, C.rose, C.mint, '#6FA8FF'];
    const t0 = o.t0 ?? -1e9, age = t - t0;
    if (age < 0) return;
    g.save();
    for (let i = 0; i < n; i++) {
      const fall = 160 + hash(i, 31) * 220;
      const y = o.t0 !== undefined ? -40 - hash(i, 32) * H * 0.8 + age * fall : mod(H * hash(i, 32) + t * fall, H + 80) - 40;
      if (y > H + 40) continue;
      const x = W * hash(i, 33) + 60 * Math.sin(t * (1 + hash(i, 34) * 2) + i);
      const sp = t * (3 + hash(i, 35) * 6) + i, w = 10 + hash(i, 36) * 10;
      g.save(); g.translate(x, y); g.rotate(sp * 0.6); g.scale(Math.cos(sp), 1);
      g.fillStyle = cols[i % cols.length]; g.globalAlpha = o.a ?? 0.95; g.fillRect(-w / 2, -w * 0.3, w, w * 0.6); g.restore();
    }
    g.restore();
  };
  FX.rain = (g, t, o = {}) => {
    const n = o.n || 160;
    g.save(); g.strokeStyle = o.col || 'rgba(200,210,230,.35)'; g.lineWidth = 2; g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const sp = 1400 + hash(i, 41) * 900, y = mod(H * hash(i, 42) + t * sp, H + 200) - 100, x = mod(W * hash(i, 43) - y * 0.18, W + 100) - 50, L = 30 + hash(i, 44) * 50;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x - L * 0.18, y + L); g.stroke();
    }
    g.restore();
  };
  FX.stars = (g, t, o = {}) => {
    const n = o.n || 120;
    g.save();
    for (let i = 0; i < n; i++) {
      const x = W * hash(i, 51), y = H * (o.h ?? 0.6) * Math.pow(hash(i, 52), 1.3), tw = 0.5 + 0.5 * Math.sin(t * (1 + hash(i, 53) * 3) + i * 1.7);
      g.globalAlpha = (o.a ?? 1) * (0.25 + 0.75 * tw) * (0.4 + hash(i, 54) * 0.6);
      g.fillStyle = '#FFF8E6'; const r = 0.8 + hash(i, 55) * 1.8; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      if (hash(i, 56) > 0.93) { g.globalAlpha *= 0.8; EP.star(g, x, y, r * 5 * tw, 0, 0.18, 4); g.fill(); }
    }
    g.restore();
  };
  FX.bokeh = (g, t, o = {}) => {
    const n = o.n || 18;
    g.save(); g.globalCompositeOperation = 'screen';
    for (let i = 0; i < n; i++) {
      const x = W * hash(i, 61) + 50 * noise(t * 0.15 + i, 9), y = H * hash(i, 62) + 40 * noise(t * 0.12 + i, 19), r = 40 + hash(i, 63) * 90;
      g.globalAlpha = (o.a ?? 0.25) * (0.5 + 0.5 * Math.sin(t * 0.7 + i));
      glowDot(g, x, y, r, o.c1 || 'rgba(255,190,110,.9)', o.c2 || 'rgba(255,150,70,.35)');
    }
    g.restore();
  };
  FX.sparkle = (g, t, o = {}) => {
    const n = o.n || 14;
    g.save();
    for (let i = 0; i < n; i++) {
      const per = 1.6 + hash(i, 71) * 1.4, ph = mod(t / per + hash(i, 72), 1), k = Math.sin(Math.PI * clamp(ph * 3));
      if (ph > 0.34) continue;
      const cyc = Math.floor(t / per + hash(i, 72));
      const x = (o.x0 ?? 0) + (o.w ?? W) * hash(i, 73, cyc), y = (o.y0 ?? 0) + (o.h ?? H) * hash(i, 74, cyc);
      g.globalAlpha = (o.a ?? 0.95) * k; g.fillStyle = o.col || '#FFF8E0';
      g.save(); g.translate(x, y); g.rotate(ph * 2); EP.star(g, 0, 0, (14 + hash(i, 75) * 16) * k, 0, 0.2, 4); g.fill(); g.restore();
    }
    g.restore();
  };
  FX.notes = (g, t, o = {}) => {
    const n = o.n || 10;
    g.save();
    for (let i = 0; i < n; i++) {
      const life = mod(t * 0.35 + hash(i, 81), 1), x = (o.x ?? W / 2) + (hash(i, 82) - 0.5) * (o.w ?? 600) + 50 * Math.sin(t * 2 + i), y = (o.y ?? H * 0.7) - life * (o.rise ?? 500);
      g.globalAlpha = Math.sin(Math.PI * life) * 0.95;
      EP.txt(g, i % 3 ? '♪' : '♫', x, y, { font: EP.font(700, 54 + hash(i, 83) * 30, 'Segoe UI Symbol, ' + F.ui), color: o.col || C.cream, shadow: 'rgba(0,0,0,.3)', blur: 6 });
    }
    g.restore();
  };
  // Lightning flashes at the given song times (white wash that decays fast).
  FX.flash = (g, t, o = {}) => {
    let a = 0;
    for (const ti of o.at || []) { const d = t - ti; if (d >= 0 && d < 0.6) a = Math.max(a, Math.exp(-d * (o.k || 9)) * (d < 0.07 ? 1 : 0.75 + 0.25 * Math.sin(d * 60))); }
    if (a <= 0.01) return;
    g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = a * (o.a ?? 0.7); g.fillStyle = o.col || '#E8E4FF'; g.fillRect(0, 0, W, H); g.restore();
  };
  FX.rays = (g, t, o = {}) => {   // light shafts from a point
    const n = o.n || 9, x = o.x ?? W * 0.8, y = o.y ?? -100;
    g.save(); g.globalCompositeOperation = 'screen';
    for (let i = 0; i < n; i++) {
      const a = (o.a0 ?? 1.9) + (i - n / 2) * (o.spread ?? 0.09) + 0.03 * Math.sin(t * 0.4 + i), L = 2400, w = 0.025 + hash(i, 91) * 0.03;
      g.globalAlpha = (o.alpha ?? 0.13) * (0.6 + 0.4 * Math.sin(t * 0.8 + i * 1.7));
      const gr = g.createLinearGradient(x, y, x + Math.cos(a) * L, y + Math.sin(a) * L); gr.addColorStop(0, o.col || 'rgba(255,230,170,1)'); gr.addColorStop(1, 'rgba(255,230,170,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a - w) * L, y + Math.sin(a - w) * L); g.lineTo(x + Math.cos(a + w) * L, y + Math.sin(a + w) * L); g.closePath(); g.fill();
    }
    g.restore();
  };
  FX.leak = (g, t, o = {}) => {   // warm light leak drifting across
    g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = o.a ?? 0.35;
    const x = lerp(o.x0 ?? -200, o.x1 ?? W + 200, mod((t - (o.t0 || 0)) / (o.per || 9), 1)), y = o.y ?? H * 0.3;
    glowDot(g, x, y, o.r || 700, o.c1 || 'rgba(255,170,80,.9)', o.c2 || 'rgba(255,120,60,.35)');
    g.restore();
  };
  FX.vign = (g, t, o = {}) => { const gr = g.createRadialGradient(W / 2, H / 2, H * (o.r0 ?? 0.3), W / 2, H / 2, H * (o.r1 ?? 0.95)); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, o.col || 'rgba(0,0,0,.7)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); };
  FX.wash = (g, t, o = {}) => { g.save(); g.globalCompositeOperation = o.op || 'source-over'; g.globalAlpha = o.a ?? 0.3; g.fillStyle = o.col || '#000'; g.fillRect(0, 0, W, H); g.restore(); };

  // ======================================================================= vector backgrounds
  BG.solid = (g, t, o = {}) => EP.fill(g, o.col || C.night);
  BG.vgrad = (g, t, o = {}) => { g.fillStyle = EP.vgrad(g, 0, H, o.stops || [[0, C.night], [1, C.night3]]); g.fillRect(0, 0, W, H); };
  BG.radial = (g, t, o = {}) => {
    const gr = g.createRadialGradient(o.x ?? W / 2, o.y ?? H / 2, 0, o.x ?? W / 2, o.y ?? H / 2, o.r ?? 1200);
    (o.stops || [[0, '#FFE2B8'], [1, '#E9844A']]).forEach(([k, c]) => gr.addColorStop(k, c)); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  };
  BG.rays = (g, t, o = {}) => {   // rotating sunburst
    const x = o.x ?? W / 2, y = o.y ?? H * 0.55, n = o.n || 24, rot = (o.spin ?? 0.08) * t + (o.rot || 0);
    EP.fill(g, o.c1 || '#FFB15C');
    g.fillStyle = o.c2 || '#FFC97E';
    for (let i = 0; i < n; i++) { const a0 = rot + i / n * EP.TAU, a1 = a0 + EP.TAU / n / 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a0) * 3000, y + Math.sin(a0) * 3000); g.lineTo(x + Math.cos(a1) * 3000, y + Math.sin(a1) * 3000); g.closePath(); g.fill(); }
    const gr = g.createRadialGradient(x, y, 0, x, y, 1100); gr.addColorStop(0, o.glow || 'rgba(255,248,230,.85)'); gr.addColorStop(1, 'rgba(255,248,230,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  };
  BG.nightsky = (g, t, o = {}) => {
    g.fillStyle = EP.vgrad(g, 0, H, [[0, '#0B1030'], [0.6, '#1B2556'], [1, '#33407E']]); g.fillRect(0, 0, W, H);
    FX.stars(g, t, { n: 160, h: 0.85 });
    if (o.moon !== false) { const mx = o.mx ?? W * 0.78, my = o.my ?? H * 0.22, mr = o.mr ?? 90; glowDot(g, mx, my, mr * 3.2, 'rgba(255,240,200,.5)', 'rgba(255,220,160,.15)'); g.fillStyle = '#FFF3D6'; g.beginPath(); g.arc(mx, my, mr, 0, 7); g.fill(); }
  };
  BG.paper = (g, t, o = {}) => {
    EP.fill(g, o.col || C.paper);
    const pat = EP.paperPattern();
    g.save(); g.globalAlpha = o.a ?? 0.5; g.globalCompositeOperation = 'multiply'; g.fillStyle = g.createPattern(pat, 'repeat'); g.fillRect(0, 0, W, H); g.restore();
  };
  let PAPER = null;
  EP.paperPattern = () => {
    if (PAPER) return PAPER;
    const c = EP.mk(512, 512), g = c.getContext('2d'), im = g.createImageData(512, 512), d = im.data, R = EP.rng(5);
    for (let i = 0; i < d.length; i += 4) { const v = 236 + (R() - 0.5) * 26; d[i] = v; d[i + 1] = v - 3; d[i + 2] = v - 10; d[i + 3] = 255; }
    g.putImageData(im, 0, 0);
    g.globalAlpha = 0.08; g.strokeStyle = '#8a6a4a';
    for (let i = 0; i < 160; i++) { g.lineWidth = 0.5 + R(); g.beginPath(); const x = R() * 512, y = R() * 512; g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 40, y + (R() - 0.5) * 8); g.stroke(); }
    return (PAPER = c);
  };
  BG.grid = (g, t, o = {}) => {   // blueprint paper
    EP.fill(g, o.col || '#1E4E8C');
    g.save(); g.strokeStyle = 'rgba(220,235,255,.13)'; g.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, H); g.stroke(); }
    for (let y = 0; y < H; y += 40) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(W, y + 0.5); g.stroke(); }
    g.strokeStyle = 'rgba(220,235,255,.25)'; g.lineWidth = 1.5;
    for (let x = 0; x < W; x += 200) { g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, H); g.stroke(); }
    for (let y = 0; y < H; y += 200) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(W, y + 0.5); g.stroke(); }
    g.restore();
  };
  BG.img = (g, t, o = {}, lt = 0, dur = 4) => {   // a painted image as a background, optionally blurred/darkened
    const src = o.blur ? EP.blurred(o.img, o.blur, o.bright ?? 1) : (o.grade ? EP.graded(o.img, o.grade) : o.img);
    EP.cover(g, src, EP.camAt(o.cam || [{ z: 1.05 }, { z: 1.12 }], EASE.sine(clamp(lt / dur))));
    if (o.dark) { g.fillStyle = `rgba(8,8,24,${o.dark})`; g.fillRect(0, 0, W, H); }
  };

  // ======================================================================= generic: painted image with camera
  EP.imgShot = (g, lt, p, t, dur) => {
    const pr = clamp(lt / Math.max(0.01, dur));
    const cam = Object.assign({}, EP.camAt(p.cam || [{ z: 1.03 }, { z: 1.11 }], (EASE[p.ease || 'sine'])(pr)));
    if (p.dolly) { const d = p.dolly, t0 = d.t0 ?? 0; cam.z = (cam.z || 1) * EP.dollyScale(P(lt, t0, t0 + 2.9 * (d.k || 1)), d.ratio || 1.6); }
    if (p.zoomin) { const d = p.zoomin, t0 = d.t0 ?? 0; cam.z = (cam.z || 1) * EP.zoomScale(P(lt, t0, t0 + 2.9 * (d.k || 1)), d.ratio || 1.6); }
    const sh = { dx: 0, dy: 0, rot: 0 };
    if (p.hand) { const h = EP.handheld(lt + (p.handOff || 0), p.hand); sh.dx += h.dx; sh.dy += h.dy; sh.rot += h.rot; }
    if (p.impacts) for (const [ti, a] of p.impacts) { const s2 = EP.impact(t - ti, a); sh.dx += s2.dx; sh.dy += s2.dy; sh.rot += s2.rot; }
    const zpad = (p.hand || p.impacts) ? 1.07 : 1;
    g.save(); EP.camApply(g, sh, zpad);
    const src = p.blur ? EP.blurred(p.img, p.blur, p.bright ?? 1) : p.grade ? EP.graded(p.img, p.grade) : p.img;
    EP.cover(g, src, cam);
    g.restore();
    return { cam, sh, zpad };
  };
  EP.runFx = (g, list, t, lt, Sh) => { if (list) for (const f of list) { if (f.from !== undefined && lt < f.from) continue; if (f.to !== undefined && lt > f.to) continue; (FX[f.type] || EP.UI[f.type])(g, t, f, lt, Sh); } };
  EP.UI = EP.UI || {};
  S.img = (g, lt, p, t, Sh) => {
    EP.imgShot(g, lt, p, t, Sh.dur);
    EP.runFx(g, p.fx, t, lt, Sh);
    if (p.tint) { g.save(); g.globalCompositeOperation = p.tint.op || 'source-over'; g.globalAlpha = p.tint.a; g.fillStyle = p.tint.col; g.fillRect(0, 0, W, H); g.restore(); }
    if (p.flash) FX.flash(g, t, { at: p.flash });
  };

  // ======================================================================= actors (cut-out characters)
  EP.drawActor = (g, lt, s, t) => {
    const u = lt - (s.at || 0);
    if (u < 0 && s.enter && s.enter !== 'none') return;
    let x = s.x, y = s.y, sc = 1, rot = s.rot || 0, alpha = s.alpha ?? 1;
    switch (s.enter) {
      case 'pop': { const pp = EP.pop(u); sc = pp.sc; rot += pp.rot; break; }       // #001 springs
      case 'rise': y += (1 - eOut5(P(u, 0, 0.65))) * (s.dist ?? 170); alpha *= P(u, 0, 0.25); break;
      case 'drop': y -= (1 - eOut5(P(u, 0, 0.55))) * (s.dist ?? 800); break;
      case 'slideL': x -= (1 - eOut5(P(u, 0, 0.7))) * (s.dist ?? 1000); break;
      case 'slideR': x += (1 - eOut5(P(u, 0, 0.7))) * (s.dist ?? 1000); break;
      case 'fade': alpha *= eIOs(P(u, 0, s.fd ?? 0.5)); break;
    }
    if (s.out !== undefined) {
      const v = lt - s.out;
      if (v > 0) {
        if ((s.outType || 'fade') === 'fade') alpha *= 1 - P(v, 0, 0.35);
        else if (s.outType === 'sink') y += eIn(P(v, 0, 0.45)) * 1000;
        else if (s.outType === 'slideL') x -= eIn(P(v, 0, 0.45)) * 1600;
        else if (s.outType === 'slideR') x += eIn(P(v, 0, 0.45)) * 1600;
      }
    }
    if (alpha <= 0.002 || sc <= 0.002) return;
    if (s.bob) y -= s.bob * EP.pulse(t, 9);
    if (s.hop) { const b = EP.beat(t); y -= s.hop * Math.sin(Math.PI * b.ph) * (s.hopEvery === 2 ? (b.i % 2 ? 1 : 0.3) : 1); }
    if (s.float) y += s.float * Math.sin(lt * 1.7 + (s.ph || 0));
    if (s.drift) x += s.drift * lt;
    if (s.zoom) sc *= 1 + s.zoom * lt;
    EP.spr(g, s.n, { x, y, h: s.h * sc, rot, flip: s.flip, alpha, t: lt + (s.ph || 0), sway: s.sway ?? 3, ax: s.ax, ay: s.ay, glow: s.glow, glowBlur: s.glowBlur, rim: s.rim, rimA: s.rimA, rimX: s.rimX, shadow: s.shadow, sx: s.sx, sy: s.sy, breathe: s.breathe });
  };
  S.sprbg = (g, lt, p, t, Sh) => {
    if (p.img) EP.imgShot(g, lt, p, t, Sh.dur);
    else if (p.bg) BG[p.bg](g, t, p.bgo || {}, lt, Sh.dur);
    EP.runFx(g, p.fxBack, t, lt, Sh);
    if (p.under) EP.UI[p.under.type](g, t, p.under, lt, Sh);
    const sh = { dx: 0, dy: 0, rot: 0 };
    if (p.impacts) for (const [ti, a] of p.impacts) { const s2 = EP.impact(t - ti, a); sh.dx += s2.dx; sh.dy += s2.dy; sh.rot += s2.rot; }
    g.save(); EP.camApply(g, sh);
    for (const s of p.sprites || []) EP.drawActor(g, lt, s, t);
    g.restore();
    EP.runFx(g, p.fx, t, lt, Sh);
    if (p.tint) { g.save(); g.globalCompositeOperation = p.tint.op || 'source-over'; g.globalAlpha = p.tint.a; g.fillStyle = p.tint.col; g.fillRect(0, 0, W, H); g.restore(); }
    if (p.flash) FX.flash(g, t, { at: p.flash });
  };

  // ======================================================================= small UI widgets used as overlays
  const UI = EP.UI;
  // Chat bubble that pops in (#001 springs) at lt = f.at.
  UI.bubble = (g, t, f, lt) => {
    const u = lt - (f.at || 0); if (u < 0) return;
    const pp = EP.pop(u, f.out ?? Infinity); if (pp.sc < 0.01) return;
    g.save(); g.translate(f.x, f.y); g.rotate(pp.rot * 0.5); g.scale(pp.sc, pp.sc);
    g.font = EP.font(800, f.px || 44, F.ui); const tw = g.measureText(f.text).width, bw = tw + 70, bh = (f.px || 44) * 1.9;
    g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 24; g.shadowOffsetY = 8;
    g.fillStyle = f.bg || '#fff'; EP.rr(g, -bw / 2, -bh / 2, bw, bh, bh / 2); g.fill();
    g.shadowColor = 'transparent';
    g.beginPath(); const tx = f.tail === 'left' ? -bw / 2 + 40 : bw / 2 - 40; g.moveTo(tx - 16, bh / 2 - 4); g.lineTo(tx + (f.tail === 'left' ? -18 : 18), bh / 2 + 26); g.lineTo(tx + 16, bh / 2 - 4); g.fill();
    EP.txt(g, f.text, 0, 2, { font: EP.font(800, f.px || 44, F.ui), color: f.col || C.ink, base: 'middle' });
    g.restore();
  };
  // Handwritten note text appearing letter by letter (typewriter #006 timing, no cursor).
  UI.hand = (g, t, f, lt) => {
    const u = lt - (f.at || 0); if (u < 0) return;
    g.save(); g.translate(f.x, f.y); g.rotate(f.rot || 0);
    EP.typeOn(g, f.text, 0, 0, u + 0.3, { t0: 0.3, dt: f.dt ?? 0.06, font: EP.font(700, f.px || 46, F.hand), color: f.col || '#3A2A20', align: 'center', cursor: false });
    g.restore();
  };
  // Pill tag with text, pops in.
  UI.tag = (g, t, f, lt) => {
    const u = lt - (f.at || 0); if (u < 0) return;
    const pp = EP.pop(u, f.out ?? Infinity); if (pp.sc < 0.01) return;
    g.save(); g.translate(f.x, f.y); g.rotate(pp.rot * 0.4 + (f.rot || 0)); g.scale(pp.sc, pp.sc);
    const px = f.px || 40; g.font = EP.font(900, px, f.fam || F.ui); g.letterSpacing = (f.ls || 2) + 'px'; const tw = g.measureText(f.text).width; g.letterSpacing = '0px';
    const bw = tw + px * 1.4, bh = px * 1.6;
    g.fillStyle = f.bg || C.orange; g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = 16; g.shadowOffsetY = 6; EP.rr(g, -bw / 2, -bh / 2, bw, bh, f.r ?? bh / 2); g.fill(); g.shadowColor = 'transparent';
    if (f.dot) { g.fillStyle = f.dot; g.beginPath(); g.arc(-bw / 2 + px * 0.75, 0, px * 0.22, 0, 7); g.fill(); }
    EP.txt(g, f.text, f.dot ? px * 0.25 : 0, 2, { font: EP.font(900, px, f.fam || F.ui), color: f.col || '#fff', base: 'middle', ls: (f.ls || 2) + 'px' });
    g.restore();
  };
  // Big centred count (#007) e.g. years or certainty %.
  UI.count = (g, t, f, lt) => {
    const u = lt - (f.at || 0); if (u < 0) return;
    const p = P(u, 0, f.d || 2.45), v = EP.countVal(p, f.from || 0, f.to), land = u - (f.d || 2.45);
    const s = (f.prefix || '') + (f.fmt ? f.fmt(v) : v.toLocaleString('en-US')) + (f.suffix || '');
    g.save(); g.translate(f.x, f.y); const k = EP.landPop(land); g.scale(k, k);
    g.globalAlpha = P(u, 0, 0.3) * (f.out !== undefined ? 1 - P(lt, f.out, f.out + 0.3) : 1);
    if (f.shadow !== false) { g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 20; }
    EP.digits(g, s, 0, 0, EP.font(f.w || 900, f.px || 160, f.fam || F.serif), land > 0 ? (f.col2 || C.gold) : (f.col || C.cream), 'center');
    g.restore();
  };
  UI.fn = (g, t, f, lt, Sh) => f.fn(g, t, f, lt, Sh);
})();
