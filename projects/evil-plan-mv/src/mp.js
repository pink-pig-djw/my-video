// mp.js — moves ported from Motion Prompt (https://showheyohtaki.github.io/motion-prompt/), rebuilt for a
// 1920×1080 frame. Timings, easing, overshoot and order are kept as published; distances given in card px
// (539×208 cards) are multiplied by EP.SC; colours and content are the MV's own.
'use strict';
(function () {
  const { W, H, SC, C, clamp, lerp, P, eIO, eIOs, eOut, eOut5, eIn, backOut, backIn, spring, smooth } = EP;
  const TR = EP.TR = {};

  // ======================================================================= transitions
  // Each: TR[name](g, A, B, u, o) — A outgoing canvas, B incoming canvas, u seconds since the join started.
  // o.k scales the element's time when a slot is shorter than the published move (u is divided by k).

  TR.cut = (g, A, B) => { g.drawImage(B, 0, 0); };

  // Motion Prompt #044 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#044
  // Cross dissolve: incoming opacity 0→100 % over 1.5 s, quadratic ease-in-out; outgoing stays opaque underneath.
  TR.dissolve = (g, A, B, u, o) => {
    const p = eIOs(P(u / (o.k || 1), 0, 1.5));
    g.drawImage(A, 0, 0); g.globalAlpha = p; g.drawImage(B, 0, 0); g.globalAlpha = 1;
  };
  TR.dissolve.dur = 1.5;

  // Motion Prompt #045 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#045
  // Wipe: a vertical edge crosses in 1.1 s (cubic ease-in-out); incoming shows behind the edge; 4 px edge line while moving.
  TR.wipe = (g, A, B, u, o) => {
    const p = eIO(P(u / (o.k || 1), 0, 1.1)), dir = o.dir || 1;
    const ex = p * (W + 8 * SC) - 4 * SC;
    g.drawImage(A, 0, 0);
    if (p > 0) { g.save(); g.beginPath(); dir > 0 ? g.rect(0, 0, ex, H) : g.rect(W - ex, 0, ex, H); g.clip(); g.drawImage(B, 0, 0); g.restore(); }
    if (p > 0 && p < 1) { g.fillStyle = o.col || C.orange; g.fillRect((dir > 0 ? ex : W - ex) - 2 * SC, 0, 4 * SC, H); }
  };
  TR.wipe.dur = 1.1;

  // Motion Prompt #043 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#043
  // Whip pan: 0.8 s; outgoing yaws 0→+0.45 rad (quadratic in-out) in the first half, incoming −0.45→0 in the second;
  // swap at 50 %; motion blur = 9 renders spread over ±1.6 frames (30 fps) averaged.
  TR.whip = (g, A, B, u, o) => {
    const D = 0.8 * (o.k || 1), f = 330 * SC, dir = o.dir || 1;
    const at = s => s < 0.5 ? { im: A, yaw: eIOs(s * 2) * 0.45 } : { im: B, yaw: -(1 - eIOs((s - 0.5) * 2)) * 0.45 };
    const s = clamp(u / D), ds = 1 / 30 / D;
    for (let k = 0; k < 9; k++) {
      const sk = clamp(s + ds * 1.6 * (k / 4 - 1)), r = at(sk), dx = -dir * f * Math.tan(r.yaw);
      g.globalAlpha = 1 / (k + 1);   // running average with equal weights
      const x = ((dx % W) + W) % W;
      g.drawImage(r.im, x - W, 0); g.drawImage(r.im, x, 0);
    }
    g.globalAlpha = 1;
  };
  TR.whip.dur = 0.8;

  // Motion Prompt #017 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#017
  // Mask transition: a circle (or star — here the daisy) window grows from an object, 1.15 s cubic in-out,
  // next scene inside it; white 7 px outline while growing; the star version rotates 1.2 rad.
  TR.iris = (g, A, B, u, o) => {
    const p = eIO(P(u / (o.k || 1), 0, 1.15)), x = o.x ?? W / 2, y = o.y ?? H / 2;
    const far = Math.hypot(Math.max(x, W - x), Math.max(y, H - y));
    g.drawImage(A, 0, 0);
    if (p <= 0) return;
    const shape = () => { if (o.shape === 'daisy') EP.daisy(g, x, y, lerp(0, far / 0.36, p), p * 1.2, 14, 0.38); else { g.beginPath(); g.arc(x, y, lerp(0, far, p), 0, 7); } };
    g.save(); shape(); g.clip(); g.drawImage(B, 0, 0); g.restore();
    if (p < 1) { g.strokeStyle = o.col || '#FFF6E8'; g.lineWidth = 7 * SC; g.lineJoin = 'round'; shape(); g.stroke(); }
  };
  TR.iris.dur = 1.15;

  // Motion Prompt #018 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#018
  // Shape transition: four slanted bands (80 px slant) cover the frame in 0.62 s, the scene swaps underneath,
  // then they uncover in 0.63 s; each band delayed by 14 % of the phase, cubic in-out over 58 % of it.
  TR.bands = (g, A, B, u, o) => {
    const uu = u / (o.k || 1), p1 = P(uu, 0, 0.62), p2 = P(uu, 0.74, 1.37), N = 4, sk = 80 * SC;
    g.drawImage(p1 >= 1 ? B : A, 0, 0);
    const cols = o.cols || [C.orange, C.night2, C.gold, C.rose], dir = o.dir || 1;
    for (let i = 0; i < N; i++) {
      const d = i * 0.14, e1 = eIO(clamp((p1 - d) / (1 - 0.42))), e2 = eIO(clamp((p2 - d) / (1 - 0.42)));
      if (e1 <= 0 || e2 >= 1) continue;
      const bh = H / N + 1, y = i * H / N, span = W + sk + 20;
      const xa = -sk - 10 + e2 * span, xb = -sk - 10 + e1 * span;
      g.save(); if (dir < 0) { g.translate(W, 0); g.scale(-1, 1); }
      g.fillStyle = cols[i % cols.length]; g.beginPath(); g.moveTo(xa + sk, y); g.lineTo(xb + sk, y); g.lineTo(xb, y + bh); g.lineTo(xa, y + bh); g.closePath(); g.fill(); g.restore();
    }
  };
  TR.bands.dur = 1.37;

  // Motion Prompt #019 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#019
  // Liquid transition: a flat-colour liquid layer (1.15 s) then the next scene inside a second liquid layer (1.1 s),
  // both top→bottom with quadratic in-out; wavy front (13 px + 8 px sines) and seven round-tipped drips; merged
  // look = draw white → blur 7 px → threshold alpha → fill. Done at quarter resolution for speed.
  const LQ = { c: null, g: null, m: null, mg: null };
  const DRIPS = [0, 1].map(s => { const R = EP.rng(190 + s * 7), a = []; for (let i = 0; i < 7; i++) a.push({ x: 36 + i * 78 + (R() - 0.5) * 30, len: 30 + R() * 80, wd: 15 + R() * 12, ph: R() * 6 }); return a; });
  function liquidMask(p, set, u) {
    const q = 0.25, w = W * q, h = H * q, s = SC * q;
    if (!LQ.c) { LQ.c = EP.mk(w, h); LQ.g = LQ.c.getContext('2d', { willReadFrequently: true }); LQ.m = EP.mk(W, H); LQ.mg = LQ.m.getContext('2d'); }
    const g = LQ.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h); g.filter = `blur(${7 * s}px)`; g.fillStyle = '#fff';
    const base = lerp(-110 * s, h + 130 * s, p), amp = Math.sin(Math.PI * clamp(p * 1.1));
    g.beginPath(); g.moveTo(-20, -40);
    for (let x = -20; x <= w + 20; x += 4) { const cx = x / s; g.lineTo(x, base + amp * s * (13 * Math.sin(cx * 0.021 + u * 3 + set) + 8 * Math.sin(cx * 0.05 + u * 4.3))); }
    g.lineTo(w + 20, -40); g.closePath(); g.fill();
    for (const d of DRIPS[set]) { const L = d.len * (0.25 + amp * 0.9) * s, y0 = base - 20 * s, x = d.x * (w / 539), wd = d.wd * s; g.beginPath(); g.roundRect(x - wd, y0, wd * 2, L + 20 * s, wd); g.fill(); g.beginPath(); g.arc(x, y0 + L + 18 * s, wd * 1.25, 0, 7); g.fill(); }
    g.filter = 'none';
    const im = g.getImageData(0, 0, w, h), dd = im.data;
    for (let i = 3; i < dd.length; i += 4) { const a = dd[i]; dd[i] = a < 112 ? 0 : a > 144 ? 255 : (a - 112) * 8; }
    g.putImageData(im, 0, 0);
    const mg = LQ.mg; mg.setTransform(1, 0, 0, 1, 0, 0); mg.globalCompositeOperation = 'source-over'; mg.clearRect(0, 0, W, H); mg.imageSmoothingQuality = 'high'; mg.drawImage(LQ.c, 0, 0, W, H);
    return mg;
  }
  TR.liquid = (g, A, B, u, o) => {
    const uu = u / (o.k || 1), p1 = eIOs(P(uu, 0, 1.15)), p2 = eIOs(P(uu, 0.35, 1.45));
    g.drawImage(A, 0, 0);
    if (p1 > 0 && p2 < 1) { const mg = liquidMask(p1, 0, uu); mg.globalCompositeOperation = 'source-in'; mg.fillStyle = o.col || C.gold; mg.fillRect(0, 0, W, H); mg.globalCompositeOperation = 'source-over'; g.drawImage(LQ.m, 0, 0); }
    if (p2 >= 1) g.drawImage(B, 0, 0);
    else if (p2 > 0) { const mg = liquidMask(p2, 1, uu + 1); mg.globalCompositeOperation = 'source-in'; mg.drawImage(B, 0, 0); mg.globalCompositeOperation = 'source-over'; g.drawImage(LQ.m, 0, 0); }
  };
  TR.liquid.dur = 1.45;

  // Motion Prompt #020 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#020
  // Zoom through: scale about a hole's centre by Smax^p (Smax = 1.08 × the scale at which the hole covers the frame),
  // p = 0.8·easeInCubic over 0.95 s + 0.2·easeOutCubic over the next 0.45 s; the next scene sits in the hole at 1/Smax.
  TR.zoom = (g, A, B, u, o) => {
    const uu = u / (o.k || 1), x = o.x, y = o.y, r = o.r;
    const Smax = Math.hypot(Math.max(x, W - x), Math.max(y, H - y)) / r * 1.08;
    const p = eIn(P(uu, 0, 0.95)) * 0.8 + eOut(P(uu, 0.95, 1.4)) * 0.2;
    if (p >= 1) { g.drawImage(B, 0, 0); return; }
    const s = Math.pow(Smax, p), Z = sc => { g.translate(x, y); g.scale(sc, sc); g.translate(-x, -y); };
    g.save(); Z(s); g.drawImage(A, 0, 0);
    g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.clip(); g.fillStyle = o.bg || C.night; g.fillRect(0, 0, W, H); Z(1 / Smax); g.drawImage(B, 0, 0); g.restore();
    g.restore();
  };
  TR.zoom.dur = 1.4;

  // Motion Prompt #023 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#023
  // Glitch: stepped 0.14 s disturbances (no brightness flashing): coral/cyan copies split 7–16 px, 2–4 slices shifted
  // 18–64 px, three small colour bars. Used here as a join: 5 steps, the picture swaps after step 2.
  const GL = (() => { const R = EP.rng(231), st = []; for (let s = 0; s < 12; s++) { const sl = [], n = 2 + Math.floor(R() * 3); for (let i = 0; i < n; i++) sl.push({ y: (40 + R() * 110) / 208, h: (10 + R() * 26) / 208, dx: Math.round((R() < .5 ? -1 : 1) * (18 + R() * 46)) }); const bars = []; for (let i = 0; i < 3; i++) bars.push({ x: (30 + R() * 420) / 539, y: (30 + R() * 150) / 208, w: 30 + R() * 90, h: 5 + R() * 7, c: i }); st.push({ sl, bars, rgb: 7 + Math.round(R() * 9) }); } return st; })();
  const GLB = { c: null };
  EP.glitchFrame = (g, src, si) => {
    const S = GL[si % GL.length];
    if (!GLB.c) { GLB.c = EP.mk(W, H); GLB.g = GLB.c.getContext('2d'); GLB.t = EP.mk(W, H); GLB.tg = GLB.t.getContext('2d'); }
    const tint = col => { const t = GLB.tg; EP.reset(t); t.clearRect(0, 0, W, H); t.drawImage(src, 0, 0); t.globalCompositeOperation = 'multiply'; t.fillStyle = col; t.fillRect(0, 0, W, H); t.globalCompositeOperation = 'destination-in'; t.drawImage(src, 0, 0); t.globalCompositeOperation = 'source-over'; return GLB.t; };
    const k = GLB.g; EP.reset(k); k.drawImage(src, 0, 0);
    k.globalCompositeOperation = 'screen'; k.globalAlpha = 0.6;
    k.drawImage(tint('#FF6B5C'), -S.rgb * SC * 0.6, 2 * SC * 0.6); k.drawImage(tint('#22D3EE'), S.rgb * SC * 0.6, -2 * SC * 0.6);
    k.globalCompositeOperation = 'source-over'; k.globalAlpha = 1;
    g.drawImage(GLB.c, 0, 0);
    for (const sl of S.sl) { const y = sl.y * H, h = sl.h * H; g.drawImage(GLB.c, 0, y, W, h, sl.dx * SC, y, W, h); }
    for (const b of S.bars) { g.fillStyle = ['#FF6B5C', '#22D3EE', '#FFC83D'][b.c]; g.fillRect(b.x * W, b.y * H, b.w * SC, b.h * SC); }
  };
  TR.glitch = (g, A, B, u, o) => {
    const step = 0.14 * (o.k || 1), si = Math.floor(u / step);
    if (si >= 5) { g.drawImage(B, 0, 0); return; }
    EP.glitchFrame(g, si < 2 ? A : B, si + (o.seed || 0));
  };
  TR.glitch.dur = 0.7;

  // A plain dip through a colour (not from the library).
  TR.dip = (g, A, B, u, o) => {
    const d = o.d || 0.5, p = clamp(u / d);
    g.drawImage(p < 0.5 ? A : B, 0, 0);
    g.globalAlpha = 1 - Math.abs(p * 2 - 1); g.fillStyle = o.col || '#000'; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
  };

  // ======================================================================= single-object moves

  // Motion Prompt #001 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#001
  // Pop-in: scale spring 1 − e^(−6.5t)·cos(15t) (peaks ≈1.26), rotation −0.35 rad → 0 with 1 − e^(−6t)·cos(11t);
  // badge 0.34 s later with 1 − e^(−7t)·cos(17t); exit multiplies scale by (1 − backIn(s = 2.2)) over 0.26 s.
  EP.pop = (u, outAt = Infinity) => {
    const out = isFinite(outAt) ? backIn(P(u, outAt, outAt + 0.26), 2.2) : 0;
    return { sc: spring(u, 15, 6.5) * (1 - out), rot: (1 - spring(u, 11, 6)) * -0.35 * (u > 0 ? 1 : 0), badge: spring(u - 0.34, 17, 7) * (1 - out) };
  };

  // Motion Prompt #002 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#002
  // Stagger: item i starts 0.12·i s after the first and grows over 0.5 s with backOut (s = 2.6); its dot follows
  // 0.34 s later (spring 16/7); exit: cubic ease-in over 0.26 s starting 0.045·i s apart.
  EP.stagger = (u, i, outAt = Infinity) => {
    const t0 = i * 0.12, fin = isFinite(outAt);
    return {
      g: backOut(P(u, t0, t0 + 0.5), 2.6) * (fin ? 1 - eIn(P(u, outAt + i * 0.045, outAt + 0.26 + i * 0.045)) : 1),
      dot: spring(u - t0 - 0.34, 16, 7) * (fin ? 1 - eIn(P(u, outAt - 0.08 + i * 0.045, outAt + 0.12 + i * 0.045)) : 1)
    };
  };

  // Motion Prompt #003 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#003
  // Burst at tt = 0: ring radius 44→90 while its width 16→0 (0.6 s, quintic out); 10 radial lines 64→130 (y ×0.82),
  // length 36→0 between 0.22 and 0.7 s; 10 dots 58→150 on an ellipse (×1.45, ×0.78) fading 0.3–0.72 s. s = px per card px.
  EP.burst = (g, x, y, tt, s = SC, cols = [C.gold, C.mint, C.orange, C.rose]) => {
    if (tt <= 0 || tt >= 0.75) return;
    const q = eOut5(Math.min(1, tt / 0.6)), fade = 1 - P(tt, 0.3, 0.72);
    g.save(); g.lineCap = 'round';
    g.strokeStyle = cols[0]; g.lineWidth = Math.max(0.1, 16 * s * (1 - q));
    g.beginPath(); g.arc(x, y, (44 + 46 * q) * s, 0, 7); if (q < 0.98) g.stroke();
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2 - Math.PI / 2, r1 = (64 + 66 * q) * s, len = 36 * s * (1 - P(tt, 0.22, 0.7));
      if (len > 0.5) { g.strokeStyle = i % 2 ? cols[1] : cols[0]; g.lineWidth = 9 * s; g.beginPath(); g.moveTo(x + Math.cos(a) * (r1 - len), y + Math.sin(a) * (r1 - len) * 0.82); g.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1 * 0.82); g.stroke(); }
      const a2 = a + Math.PI / 10, r2 = (58 + 92 * q) * s;
      g.fillStyle = i % 2 ? cols[2] : cols[3]; g.globalAlpha = fade; g.beginPath(); g.arc(x + Math.cos(a2) * r2 * 1.45, y + Math.sin(a2) * r2 * 0.78, 8 * s * (1 - q * 0.4), 0, 7); g.fill(); g.globalAlpha = 1;
    }
    g.restore();
  };

  // Motion Prompt #005 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#005
  // Mask reveal, as offsets: divider grows 0.1–0.5 s (cubic in-out) and shrinks 2.05–2.3 s; top text rises into place
  // 0.35–1.0 s (quintic out) and leaves upward 1.7–2.05 s (backIn s = 1.2); bottom text drops in 0.55–1.15 s and leaves
  // downward 1.75–2.05 s (cubic in). Returns line scale lg and normalised offsets (multiply by the caller's distances).
  EP.mr = lu => ({
    lg: eIO(P(lu, 0.1, 0.5)) * (1 - eIO(P(lu, 2.05, 2.3))),
    upIn: 1 - eOut5(P(lu, 0.35, 1.0)), upOut: backIn(P(lu, 1.7, 2.05), 1.2),
    dnIn: 1 - eOut5(P(lu, 0.55, 1.15)), dnOut: eIn(P(lu, 1.75, 2.05))
  });

  // Motion Prompt #006 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#006
  // Typewriter: one character every dt (0.24 s) from t0 (0.3 s); each new character settles from 1.35× to 1×
  // (1 + 0.35·e^(−16t)); cursor solid while typing, then blinks with a 0.94 s period (on 0.5 s).
  EP.typeOn = (g, s, x, y, u, o = {}) => {
    const t0 = o.t0 ?? 0.3, dt = o.dt ?? 0.24, chars = [...s], font = o.font, col = o.color || C.ink;
    g.font = font; g.textBaseline = o.base || 'middle'; g.textAlign = 'center';
    let n = u < t0 ? 0 : clamp(Math.floor((u - t0) / dt) + 1, 0, chars.length);
    const widths = chars.map(ch => g.measureText(ch).width + (o.ls || 0));
    const total = widths.reduce((a, b) => a + b, 0);
    let cx = o.align === 'center' ? x - total / 2 : x;
    for (let i = 0; i < n; i++) {
      const age = u - (t0 + i * dt), pop = 1 + 0.35 * Math.exp(-age * 16), cw = widths[i];
      g.save(); g.translate(cx + cw / 2, y); g.scale(pop, pop); g.fillStyle = col; g.font = font; g.fillText(chars[i], 0, 0); g.restore();
      cx += cw;
    }
    const done = t0 + chars.length * dt, typing = u >= t0 - 0.05 && u < done + 0.1;
    const blink = typing ? 1 : (EP.mod(u, 0.94) < 0.5 ? 1 : 0);
    if (o.cursor !== false && blink) { g.fillStyle = o.cursorCol || C.orange; const ch = o.cursorH || 40; EP.rr(g, cx + 4, y - ch / 2, Math.max(4, ch / 9), ch, 2); g.fill(); }
    return { x: cx, done, n };
  };

  // Motion Prompt #007 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#007
  // Count-up: value = round(target × (1 − (1 − p)^4)), fast first and slow at the end; fixed-width digits drawn
  // right-aligned so nothing jitters; on landing a small bounce 1 + 0.07·e^(−7t)·cos(15t).
  EP.countVal = (p, from, to) => Math.round(from + (to - from) * (1 - Math.pow(1 - clamp(p), 4)));
  EP.landPop = tl => tl > 0 ? 1 + 0.07 * Math.exp(-7 * tl) * Math.cos(15 * tl) : 1;
  EP.digits = (g, s, x, y, font, col, align = 'center') => {
    g.font = font; g.textBaseline = 'middle'; g.textAlign = 'center';
    const dw = g.measureText('0').width + 2, cw = g.measureText(',').width;
    let tot = 0; for (const ch of s) tot += /\d/.test(ch) ? dw : g.measureText(ch).width;
    let xx = align === 'center' ? x + tot / 2 : align === 'right' ? x : x + tot;
    g.fillStyle = col;
    for (const ch of [...s].reverse()) { const w = /\d/.test(ch) ? dw : g.measureText(ch).width; xx -= w; g.fillText(ch, xx + w / 2, y); }
    return tot;
  };

  // Motion Prompt #008 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#008
  // Kinetic typography. slam: scale 3.4→1 at 0.02–0.2 s (cubic in); then x-shake 10 px·e^(−9t)·sin(38t), vertical
  // squash 20 %·e^(−11t), 8 radial lines for 0.4 s, slanted −0.14. spin: per char 0.12 s stagger, −360°→0 over 0.62 s
  // backOut(1.3), scale 0→1 over 0.25 s. bounce: per char 0.1 s stagger, 78 px·|sin(πt/0.4)|·e^(−2.6t), 16 % squash at contact.
  // Exit (all): last 0.2 s, fade while moving 46 px up (cubic in).
  EP.slam = (g, s, x, y, lu, o = {}) => {
    if (lu < 0.02) return;
    const hit = 0.2, tt = lu - hit, sc = tt < 0 ? lerp(3.4, 1, eIn(P(lu, 0.02, hit))) : 1, k = o.s || SC;
    const dx = tt > 0 ? 10 * k * Math.exp(-9 * tt) * Math.sin(38 * tt) : 0, sy = tt > 0 ? 1 - 0.2 * Math.exp(-11 * tt) : 1;
    const out = o.out !== undefined ? P(lu, o.out, o.out + 0.18) : 0;
    g.save(); g.translate(x, y - 46 * k * eIn(out)); g.globalAlpha *= P(lu, 0.02, 0.1) * (1 - out);
    if (tt > 0 && tt < 0.4 && o.lines !== false) {
      const q = eOut(tt / 0.4); g.strokeStyle = o.lineCol || C.gold; g.lineWidth = 7 * k * (1 - q); g.lineCap = 'round';
      const R0 = o.lineR || 120 * k;
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + 0.2, r0 = R0 + 50 * k * q, r1 = r0 + 26 * k; g.beginPath(); g.moveTo(Math.cos(a) * r0 * 1.35, Math.sin(a) * r0 * 0.5); g.lineTo(Math.cos(a) * r1 * 1.35, Math.sin(a) * r1 * 0.5); if (q < 0.97) g.stroke(); }
    }
    g.translate(dx, 0); g.scale(sc * (2 - sy), sc * sy); if (o.slant !== false) g.transform(1, 0, -0.14, 1, 0, 0);
    EP.txt(g, s, 0, 0, Object.assign({ base: 'middle' }, o.txt));
    g.restore();
  };
  EP.spinIn = (g, s, x, y, lu, o = {}) => {
    g.font = o.txt.font; const ls = o.ls || 0;
    const ws = [...s].map(ch => g.measureText(ch).width + ls), tot = ws.reduce((a, b) => a + b, 0) - ls;
    let cx = x - tot / 2;
    [...s].forEach((ch, i) => {
      const w = ws[i] - ls, tt = lu - 0.05 - i * (o.stag ?? 0.12);
      if (tt >= 0) {
        const q = backOut(P(tt, 0, 0.62), 1.3), sc = eOut(P(tt, 0, 0.25));
        g.save(); g.translate(cx + w / 2, y); g.rotate((1 - q) * -Math.PI * 2); g.scale(sc, sc);
        EP.txt(g, ch, 0, 0, Object.assign({ base: 'middle' }, o.txt)); g.restore();
      }
      cx += ws[i];
    });
  };
  EP.bounceIn = (g, s, x, y, lu, o = {}) => {
    g.font = o.txt.font; const ls = o.ls || 0, k = o.s || SC;
    const ws = [...s].map(ch => g.measureText(ch).width + ls), tot = ws.reduce((a, b) => a + b, 0) - ls;
    let cx = x - tot / 2;
    [...s].forEach((ch, i) => {
      const w = ws[i] - ls, tt = lu - 0.06 - i * 0.1;
      if (tt >= 0) {
        const yy = -78 * k * Math.abs(Math.sin(Math.PI * tt / 0.4)) * Math.exp(-2.6 * tt), near = Math.abs(Math.sin(Math.PI * tt / 0.4)) < 0.25 ? 1 : 0;
        const sq = 1 - 0.16 * near * Math.exp(-2.6 * tt);
        g.save(); g.globalAlpha *= P(tt, 0, 0.08); g.translate(cx + w / 2, y + yy); g.scale(2 - sq, sq);
        EP.txt(g, ch, 0, 0, Object.assign({ base: 'middle' }, o.txt)); g.restore();
      }
      cx += ws[i];
    });
  };

  // Motion Prompt #012 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#012
  // Shape morph: outlines stored as 240 points (circle, rounded square, star, heart, base radius 64) interpolated
  // point-by-point; progress uses backOut (s = 1.6); the scale swells by 1 + 0.07·sin(π·progress).
  const MN = 240;
  EP.SHAPES = (() => {
    const R = 64, mk = fn => { const a = []; for (let i = 0; i < MN; i++) a.push(fn(i / MN)); return a; };
    const circle = mk(t => { const a = t * Math.PI * 2 - Math.PI / 2; return [Math.cos(a) * R, Math.sin(a) * R]; });
    const sq = mk(t => { const a = t * Math.PI * 2 - Math.PI / 2; let r = R * 0.88 / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a))); r = Math.min(r, R * 1.13); return [Math.cos(a) * r, Math.sin(a) * r]; });
    const st = mk(t => { const seg = 1 / 10, j = Math.floor(t / seg), f = (t - j * seg) / seg, ro = R * 1.2, ri = R * 0.56; const a0 = j * Math.PI / 5 - Math.PI / 2, a1 = (j + 1) * Math.PI / 5 - Math.PI / 2, r0 = j % 2 ? ri : ro, r1 = j % 2 ? ro : ri; return [lerp(Math.cos(a0) * r0, Math.cos(a1) * r1, f), lerp(Math.sin(a0) * r0, Math.sin(a1) * r1, f)]; });
    const hp = mk(t => { const a = t * Math.PI * 2, s = R / 15.5; return [16 * Math.pow(Math.sin(a), 3) * s, -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * s - 4]; });
    return { circle, sq, star: st, heart: hp };
  })();
  EP.morph = (g, a, b, pr, x, y, scale) => {
    const A = EP.SHAPES[a], B = EP.SHAPES[b], p = backOut(clamp(pr), 1.6), pulse = 1 + 0.07 * Math.sin(Math.PI * clamp(pr));
    g.save(); g.translate(x, y); g.scale(scale * pulse, scale * pulse); g.beginPath();
    for (let j = 0; j < MN; j++) { const px = lerp(A[j][0], B[j][0], p), py = lerp(A[j][1], B[j][1], p); j ? g.lineTo(px, py) : g.moveTo(px, py); }
    g.closePath(); g.restore();
    return MN;
  };
  EP.morphPts = (a, b, pr) => { const A = EP.SHAPES[a], B = EP.SHAPES[b], p = backOut(clamp(pr), 1.6); return A.map((q, j) => [lerp(q[0], B[j][0], p), lerp(q[1], B[j][1], p)]); };

  // Motion Prompt #015 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#015
  // Particles: 84 from one emitter, vx ±190 px/s, vy −250…−400 px/s, gravity 470 px/s², each repeating every
  // 2.35 s or ≈1.57 s with a fixed random phase, life ≤ 1.5 s (fade in 0.06 s, out over the last 30 %), scale 1.15→0.7,
  // circles/squares/triangles 5–11 px spinning ±4.5 rad/s. o.s scales distances; o.cols/o.n/o.g/o.vy override.
  const PSETS = {};
  EP.particles = (g, u, o) => {
    const key = (o.seed || 15) + '|' + (o.n || 84);
    if (!PSETS[key]) { const R = EP.rng(o.seed || 15), a = []; for (let i = 0; i < (o.n || 84); i++) { const n = R() < 0.5 ? 2 : 3; a.push({ T: 4.7 / n, ph: R() * 4.7, vx: (R() - 0.5) * 2 * 190, vy: -(250 + R() * 150), sz: 5 + R() * 6, ci: i, kind: i % 3, spin: (R() - 0.5) * 9, rx: R() }); } PSETS[key] = a; }
    const s = o.s || SC * 0.6, X = o.x, Y = o.y, G = (o.g ?? 470) * s, cols = o.cols || [C.orange, C.gold, C.cream, C.rose];
    for (const p of PSETS[key]) {
      const t = EP.mod(u + p.ph, p.T), life = Math.min(p.T, 1.5); if (t > life) continue;
      const ex = X + (o.spread ? (p.rx - 0.5) * o.spread : 0);
      const x = ex + p.vx * s * (o.vxk ?? 1) * t, y = Y + p.vy * s * (o.vyk ?? 1) * t + 0.5 * G * t * t;
      const a = Math.min(1, t / 0.06) * (1 - smooth(P(t, life * 0.7, life))), sc = lerp(1.15, 0.7, t / life);
      g.globalAlpha = a * (o.alpha ?? 1); g.fillStyle = cols[p.ci % cols.length];
      g.save(); g.translate(x, y); g.rotate(t * p.spin); g.scale(sc * s, sc * s);
      const kind = o.kind ?? p.kind;
      if (kind === 0) { g.beginPath(); g.arc(0, 0, p.sz, 0, 7); g.fill(); }
      else if (kind === 1) g.fillRect(-p.sz, -p.sz * 0.6, p.sz * 2, p.sz * 1.2);
      else if (kind === 2) { g.beginPath(); g.moveTo(0, -p.sz * 1.3); g.lineTo(p.sz * 1.2, p.sz); g.lineTo(-p.sz * 1.2, p.sz); g.closePath(); g.fill(); }
      else if (kind === 3) { EP.heartPath(g, p.sz * 0.9); g.fill(); }
      else if (kind === 4) { EP.daisy(g, 0, 0, p.sz * 1.4, 0, 10, 0.3); g.fill(); }
      g.restore();
    }
    g.globalAlpha = 1;
  };

  // Motion Prompt #022 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#022
  // Light sweep inside a clip: a 116 px band (0.72 opacity at its centre) plus a 12 px band (0.5) 78 px behind,
  // rotated 0.42 rad, travelling from 130 px left of the shape to 130 px right of it over 0.45–1.5 s (quadratic in-out);
  // a four-point sparkle at the far corner 1.38–1.98 s. clip(g) must add the shape path; box = {x, y, w, h}; s scales px.
  EP.lightSweep = (g, u, box, clip, s = SC * 0.5) => {
    const p = eIOs(P(u, 0.45, 1.5));
    if (p > 0 && p < 1) {
      g.save(); clip(g); g.clip();
      g.translate(lerp(box.x - 130 * s, box.x + box.w + 130 * s, p), box.y + box.h / 2); g.rotate(0.42);
      const L = Math.max(box.h, 320 * s) * 1.6;
      const gr = g.createLinearGradient(-58 * s, 0, 58 * s, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,.72)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.globalCompositeOperation = 'screen'; g.fillStyle = gr; g.fillRect(-58 * s, -L, 116 * s, L * 2); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(78 * s, -L, 12 * s, L * 2);
      g.restore();
    }
    const tt = u - 1.38;
    if (tt > 0 && tt < 0.6) { const q = tt / 0.6, sc = Math.sin(Math.PI * q) * (1 + 0.2 * (1 - q)); g.save(); g.translate(box.x + box.w - 8 * s, box.y + 6 * s); g.rotate(q * 0.9); g.fillStyle = '#fff'; EP.star(g, 0, 0, 30 * s * sc, 0, 0.22, 4); g.fill(); g.restore(); }
  };

  // Motion Prompt #040 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#040
  // Freeze frame: footage time stops at tf for 1.4 s and then continues as u − 1.4; a 5 px border and a pause icon
  // (two bars on a 68×40 white rounded box, bottom centre) fade in and out over 0.12 s while frozen.
  EP.freezeTime = (u, tf, d = 1.4) => u < tf ? u : u < tf + d ? tf : u - d;
  EP.freezeMarks = (g, u, tf, d = 1.4, col = C.orange, s = SC * 0.7) => {
    const a = P(u, tf, tf + 0.12) * (1 - P(u, tf + d - 0.12, tf + d));
    if (a <= 0) return;
    g.save(); g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = 5 * s; g.strokeRect(5 * s / 2, 5 * s / 2, W - 5 * s, H - 5 * s);
    const bw = 68 * s, bh = 40 * s, x = W / 2 - bw / 2, y = H - bh - 24 * s;
    g.fillStyle = '#fff'; EP.rr(g, x, y, bw, bh, 8 * s); g.fill();
    g.fillStyle = col; EP.rr(g, W / 2 - 10 * s, y + 9 * s, 7 * s, bh - 18 * s, 2 * s); g.fill(); EP.rr(g, W / 2 + 3 * s, y + 9 * s, 7 * s, bh - 18 * s, 2 * s); g.fill();
    g.restore();
  };

  // Motion Prompt #027 / #028 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#027
  // Moves over 2.9 s with cubic in-out. Dolly in: subject 8 m → 2.2 m away, so scale = 8 / (8 − 5.8·p) (≈3.6×).
  // Zoom in (#028): focal length × (8/2.2)^p, exponential.
  // Both scales accept a ratio (< 3.6) for gentler versions with the same curve shape.
  EP.dollyScale = (p, ratio = 8 / 2.2) => { const d1 = 8 / ratio; return 8 / (8 - (8 - d1) * eIO(clamp(p))); };
  EP.zoomScale = (p, ratio = 8 / 2.2) => Math.pow(ratio, eIO(clamp(p)));
})();
