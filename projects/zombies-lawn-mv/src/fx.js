// fx.js — lights and screen effects: spotlight cones, light bursts, stage-light sweeps, fog, iris, sparkles, flashes.
'use strict';
(function () {
  const { W, H, clamp, lerp, P, eOut, eIn, TAU, hash, noise } = ZL;

  // A theatre spotlight: cone from (x0, y0) (lamp, usually above the frame) to a floor ellipse at (x1, y1) of radius rx.
  // o: {a (0..1), col ([r,g,b]), ry (floor ellipse height), w0 (lamp width), dust (motes), t, seed}
  ZL.spot = (g, x0, y0, x1, y1, rx, o = {}) => {
    const a = o.a ?? 1; if (a <= 0.003) return;
    const [r, gg, b] = o.col || [255, 248, 225];
    const ry = o.ry ?? rx * 0.28, w0 = o.w0 ?? rx * 0.18;
    g.save();
    g.globalCompositeOperation = 'screen';
    // cone: a trapezoid filled with a gradient that fades toward the floor edges
    const ang = Math.atan2(x1 - x0, y1 - y0);
    const len = Math.hypot(x1 - x0, y1 - y0);
    g.translate(x0, y0); g.rotate(-ang);
    const grd = g.createLinearGradient(-rx, 0, rx, 0);
    grd.addColorStop(0, `rgba(${r},${gg},${b},0)`);
    grd.addColorStop(0.25, `rgba(${r},${gg},${b},${0.10 * a})`);
    grd.addColorStop(0.5, `rgba(${r},${gg},${b},${0.20 * a})`);
    grd.addColorStop(0.75, `rgba(${r},${gg},${b},${0.10 * a})`);
    grd.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    g.fillStyle = grd;
    g.beginPath(); g.moveTo(-w0, 0); g.lineTo(w0, 0); g.lineTo(rx, len); g.lineTo(-rx, len); g.closePath(); g.fill();
    // a brighter core
    const grd2 = g.createLinearGradient(0, 0, 0, len);
    grd2.addColorStop(0, `rgba(${r},${gg},${b},${0.22 * a})`); grd2.addColorStop(1, `rgba(${r},${gg},${b},${0.04 * a})`);
    g.fillStyle = grd2;
    g.beginPath(); g.moveTo(-w0 * 0.5, 0); g.lineTo(w0 * 0.5, 0); g.lineTo(rx * 0.45, len); g.lineTo(-rx * 0.45, len); g.closePath(); g.fill();
    g.restore();
    // floor pool of light
    g.save(); g.globalCompositeOperation = 'screen';
    g.translate(x1, y1); g.scale(1, ry / rx);
    const fp = g.createRadialGradient(0, 0, 0, 0, 0, rx * 1.05);
    fp.addColorStop(0, `rgba(${r},${gg},${b},${0.55 * a})`); fp.addColorStop(0.6, `rgba(${r},${gg},${b},${0.35 * a})`); fp.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    g.fillStyle = fp; g.beginPath(); g.arc(0, 0, rx * 1.05, 0, TAU); g.fill();
    g.restore();
    // dust motes drifting in the beam
    if (o.dust) {
      const t = o.t || 0, n = o.dust;
      g.save(); g.globalCompositeOperation = 'screen';
      for (let i = 0; i < n; i++) {
        const v = (hash(i, o.seed || 1) + t * (0.02 + hash(i, 7) * 0.03)) % 1;
        const u = (hash(i, 3) - 0.5) * 2 * lerp(w0, rx, v) * 0.85 + noise(t * 0.4 + i, 5) * 10;
        const px = lerp(x0, x1, v) + u, py = lerp(y0, y1, v);
        const tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 2 + i * 1.7));
        g.fillStyle = `rgba(255,250,230,${0.5 * a * tw})`;
        g.beginPath(); g.arc(px, py, 1.2 + hash(i, 9) * 2.2, 0, TAU); g.fill();
      }
      g.restore();
    }
  };

  // The light under a spot that falls on a character standing in it: brighten them softly (draw after the actor).
  ZL.glow = (g, x, y, r, col = 'rgba(255,240,200,0.35)') => {
    g.save(); g.globalCompositeOperation = 'screen';
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
  };

  // Light burst: rays rotating out of a point + white bloom. k 0..1 intensity.
  ZL.burst = (g, x, y, k, t, o = {}) => {
    if (k <= 0) return;
    const n = o.rays ?? 14, R = o.R ?? 1800;
    g.save(); g.globalCompositeOperation = 'screen';
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU + t * 0.6 + hash(i, 4) * 0.4, wdt = 0.05 + hash(i, 2) * 0.09;
      const gr = g.createRadialGradient(x, y, 0, x, y, R);
      gr.addColorStop(0, `rgba(255,255,240,${0.75 * k})`); gr.addColorStop(1, 'rgba(255,255,240,0)');
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(x, y); g.arc(x, y, R, a - wdt, a + wdt); g.closePath(); g.fill();
    }
    const gr = g.createRadialGradient(x, y, 0, x, y, R * 0.6);
    gr.addColorStop(0, `rgba(255,255,255,${k})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.restore();
  };

  // full-screen flash
  ZL.flash = (g, k, col = '#fff') => { if (k <= 0) return; g.save(); g.globalAlpha = clamp(k); g.fillStyle = col; g.fillRect(0, 0, W, H); g.restore(); };

  // Iris: everything outside the circle (cx, cy, r) goes black.
  ZL.iris = (g, cx, cy, r) => {
    g.save(); g.fillStyle = '#000';
    g.beginPath(); g.rect(0, 0, W, H); g.arc(cx, cy, Math.max(0, r), 0, TAU, true); g.fill('evenodd');
    g.restore();
  };

  // Moving concert light from a lamp at (x0, y0) sweeping between angles (rad from straight down), coloured.
  ZL.sweep = (g, x0, y0, len, ang, wid, col, a) => {
    if (a <= 0.003) return;
    g.save(); g.globalCompositeOperation = 'screen';
    g.translate(x0, y0); g.rotate(ang);
    const gr = g.createLinearGradient(0, 0, 0, len);
    gr.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${0.45 * a})`); gr.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(-wid * 0.08, 0); g.lineTo(wid * 0.08, 0); g.lineTo(wid, len); g.lineTo(-wid, len); g.closePath(); g.fill();
    g.restore();
  };

  // Fog bank: puffs from the fog parts sheet drifting in from the right; cover 0..1 is how far it has rolled in.
  ZL.fog = (g, t, cover, o = {}) => {
    if (cover <= 0) return;
    const parts = ['fog_0', 'fog_1', 'fog_2', 'fog_3', 'fog_4', 'fog_5'].filter(n => ZL.img[n]);
    if (!parts.length) return;
    const n = o.n ?? 70, edge = lerp(W + 400, -500, cover);
    g.save();
    for (let i = 0; i < n; i++) {
      const row = hash(i, 11), col = hash(i, 12);
      const y = lerp(o.y0 ?? 80, o.y1 ?? H + 60, row);
      const x = edge + col * (W + 900) + noise(t * 0.12 + i, 3) * 60 - (t * (14 + hash(i, 5) * 22)) % 400 * 0;
      if (x > W + 500) continue;
      const nm = parts[i % parts.length], im = ZL.img[nm];
      const s = (o.s ?? 1.1) * (0.7 + hash(i, 6) * 0.7);
      const a = clamp((W + 450 - x) / 500) * (o.a ?? 0.92);
      g.globalAlpha = a;
      g.drawImage(im, x - im.width * s / 2 + Math.sin(t * 0.3 + i) * 20, y - im.height * s / 2, im.width * s, im.height * s);
    }
    g.restore();
  };

  // Haze: pale fog rising from the bottom of the frame up to `top` (k 0..1), with puffs drifting along its edge.
  ZL.haze = (g, t, k, o = {}) => {
    if (k <= 0) return;
    const A = o.a ?? 0.78, top = lerp(H + 260, o.top ?? H * 0.3, ZL.eOut(clamp(k)));
    const col = o.col || '226,230,246';
    g.save();
    const gr = g.createLinearGradient(0, top - 170, 0, top + 230);
    gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(1, `rgba(${col},${A})`);
    g.fillStyle = gr; g.fillRect(0, top - 170, W, 400);
    g.fillStyle = `rgba(${col},${A})`; g.fillRect(0, top + 229, W, Math.max(0, H - top));
    const parts = ['fog_0', 'fog_1', 'fog_2', 'fog_3', 'fog_4', 'fog_5'].filter(n => ZL.img[n]);
    for (let i = 0; i < 16 && parts.length; i++) {
      const im = ZL.img[parts[i % parts.length]], s = 0.75 + hash(i, 31) * 0.5;
      const x = ((i * 157 + t * (26 + hash(i, 32) * 30)) % (W + 700)) - 350, y = top - 30 + hash(i, 33) * 180;
      g.globalAlpha = 0.42 * clamp(k * 2);
      g.drawImage(im, x - im.width * s / 2, y - im.height * s / 2, im.width * s, im.height * s);
    }
    g.restore();
  };

  // Sparkles (4-point stars) around a point, twinkling.
  ZL.sparkles = (g, x, y, R, n, t, k = 1, seed = 1, col = '255,255,220') => {
    if (k <= 0) return;
    g.save(); g.globalCompositeOperation = 'screen';
    for (let i = 0; i < n; i++) {
      const a = hash(i, seed) * TAU, d = R * (0.4 + hash(i, seed + 1) * 0.7);
      const ph = (t * (1.2 + hash(i, seed + 2)) + hash(i, seed + 3)) % 1;
      const s = Math.sin(ph * Math.PI) * (6 + hash(i, seed + 4) * 12) * k;
      if (s <= 0.3) continue;
      const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
      g.fillStyle = `rgba(${col},${0.9 * Math.sin(ph * Math.PI) * k})`;
      g.beginPath();
      g.moveTo(px, py - s); g.quadraticCurveTo(px, py, px + s, py); g.quadraticCurveTo(px, py, px, py + s); g.quadraticCurveTo(px, py, px - s, py); g.quadraticCurveTo(px, py, px, py - s);
      g.fill();
    }
    g.restore();
  };

  // Vignette
  ZL.vignette = (g, k = 0.5, col = '0,0,0') => {
    if (k <= 0) return;
    g.save();
    const gr = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
    gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(1, `rgba(${col},${k})`);
    g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
  };

  // Confetti pieces falling (deterministic)
  ZL.confetti = (g, t, t0, n = 120, k = 1) => {
    if (t < t0 || k <= 0) return;
    const cols = ['#ffd23a', '#ff5a5a', '#4fd1ff', '#7dff6a', '#ff8de0', '#ffffff'];
    g.save();
    for (let i = 0; i < n; i++) {
      const st = t0 + hash(i, 21) * 2.5; if (t < st) continue;
      const age = t - st, x = hash(i, 22) * W + Math.sin(age * 2 + i) * 40, y = -40 + age * (160 + hash(i, 23) * 140);
      if (y > H + 40) continue;
      g.save(); g.translate(x, y); g.rotate(age * (2 + hash(i, 24) * 4)); g.scale(1, Math.cos(age * 5 + i));
      g.globalAlpha = k; g.fillStyle = cols[i % cols.length]; g.fillRect(-7, -4, 14, 8); g.restore();
    }
    g.restore();
  };
})();
