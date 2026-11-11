// core.js — namespace, math, beat clock, assets and drawing helpers for the "Evil Plan" MV.
// Every frame is a pure function of song time t (no clock reads, no Math.random at draw time),
// so live preview and frame-by-frame export give identical pictures.
'use strict';
(function () {
  const EP = window.EP = {};
  const W = EP.W = 1920, H = EP.H = 1080;
  EP.SC = 1920 / 539;   // motion-prompt card (539 px wide) → full frame scale, used when porting distances

  // Motion Prompt #001-024 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#001
  // Easing and shape helpers below are copied from the "motion" pack kit.
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, x) => a + (b - a) * x;
  const P = (t, a, b) => clamp((t - a) / (b - a));
  const eIO = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const eIOs = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  const eOut = x => 1 - Math.pow(1 - x, 3);
  const eOut5 = x => 1 - Math.pow(1 - x, 5);
  const eIn = x => x * x * x;
  const smooth = x => x * x * (3 - 2 * x);
  const mod = (a, n) => ((a % n) + n) % n;
  const backOut = (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
  const backIn = (x, s = 1.70158) => (s + 1) * x * x * x - s * x * x;
  const spring = (t, w = 14, d = 7) => t <= 0 ? 0 : 1 - Math.exp(-d * t) * Math.cos(w * t);
  function star(k, x, y, R, rot = 0, inner = 0.5, n = 5) { k.beginPath(); for (let i = 0; i < n * 2; i++) { const r = i % 2 ? R * inner : R, a = rot - Math.PI / 2 + i * Math.PI / n; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; i ? k.lineTo(px, py) : k.moveTo(px, py); } k.closePath(); }
  function heartPath(k, s) { k.beginPath(); k.moveTo(0, s * 0.92); k.bezierCurveTo(-s * 1.75, -s * 0.12, -s * 0.85, -s * 1.2, 0, -s * 0.42); k.bezierCurveTo(s * 0.85, -s * 1.2, s * 1.75, -s * 0.12, 0, s * 0.92); k.closePath(); }
  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function mix(a, b, t) { const A = hex(a), B = hex(b); return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`; }
  Object.assign(EP, { clamp, lerp, P, eIO, eIOs, eOut, eOut5, eIn, smooth, mod, backOut, backIn, spring, star, heartPath, mix });
  // ---- end of kit-derived helpers

  EP.rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  EP.TAU = Math.PI * 2;

  // Deterministic hash → [0, 1) and smooth 1-D value noise in [-1, 1].
  EP.hash = (a, b = 0, c = 0) => {
    let h = Math.imul(a | 0, 374761393) ^ Math.imul((b | 0) + 0x9E37, 668265263) ^ Math.imul((c | 0) + 0x85EB, 1274126177);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
  EP.noise = (x, s = 0) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(EP.hash(i, s), EP.hash(i + 1, s), u) * 2 - 1; };
  EP.rng = seed => { let s = seed >>> 0 || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };

  // Palette (cream / tangerine / ink by day; indigo with tangerine lamplight by night) and fonts.
  EP.C = {
    cream: '#FFF6E8', paper: '#F6ECDD', paper2: '#EADBC4', orange: '#F28C38', orange2: '#E0662A', gold: '#F7BE4F',
    ink: '#2B1E19', brown: '#5A3B2E', night: '#111733', night2: '#1C2450', night3: '#2C3A78', sky: '#A9D8F2',
    rose: '#F4A9A0', mint: '#79C9A6', red: '#D9412B', blue: '#4A7BD6', white: '#FFFFFF', grey: '#8A8F9C'
  };
  EP.F = {
    serif: '"Fraunces", Georgia, serif', villain: '"Pirata One", "Fraunces", serif', hand: '"Caveat", cursive',
    type: '"Special Elite", "Courier New", monospace', ui: '"Nunito", "Segoe UI", sans-serif', zh: '"LXGW WenKai", "Microsoft YaHei", sans-serif'
  };

  // ---------------------------------------------------------------- timing / beat clock
  const T = EP.T = window.TIMING;
  const BEATS = T.beats, DOWNS = T.downbeats;
  function lastLE(arr, t) { let lo = 0, hi = arr.length - 1, r = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (arr[m] <= t) { r = m; lo = m + 1; } else hi = m - 1; } return r; }
  EP.BEAT = 60 / T.tempo;
  EP.beat = t => {
    const i = lastLE(BEATS, t), t0 = i >= 0 ? BEATS[i] : 0, t1 = i + 1 < BEATS.length ? BEATS[i + 1] : t0 + EP.BEAT;
    return { i, t0, dt: t - t0, ph: clamp((t - t0) / (t1 - t0)) };
  };
  EP.pulse = (t, k = 7) => { const i = lastLE(BEATS, t); return i < 0 ? 0 : Math.exp(-k * (t - BEATS[i])); };
  EP.dpulse = (t, k = 4) => { const i = lastLE(DOWNS, t); return i < 0 ? 0 : Math.exp(-k * (t - DOWNS[i])); };
  EP.downIdx = t => lastLE(DOWNS, t);
  EP.energy = t => { const a = T.rms_db, x = t * 10, i = Math.floor(x), f = x - i; const v = lerp(a[clamp(i, 0, a.length - 1)], a[clamp(i + 1, 0, a.length - 1)], f); return clamp((v + 26) / 24); };
  EP.snap = (t, tol = 0.16) => { const i = lastLE(BEATS, t); let best = t, d = tol; [i, i + 1].forEach(j => { if (j >= 0 && j < BEATS.length && Math.abs(BEATS[j] - t) < d) { d = Math.abs(BEATS[j] - t); best = BEATS[j]; } }); return best; };
  EP.L = i => T.lines[i].t0;          // sung start of lyric line i
  EP.E = i => T.lines[i].t1;          // sung end of lyric line i
  EP.Wd = (i, j) => T.lines[i].words[Math.min(j, T.lines[i].words.length - 1)].t0;   // start of word j of line i

  // ---------------------------------------------------------------- canvases and buffers
  EP.mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const BUFS = [];
  EP.buf = i => {
    if (!BUFS[i]) { const c = EP.mk(W, H); BUFS[i] = { c, g: c.getContext('2d') }; }
    const b = BUFS[i]; EP.reset(b.g); return b;
  };
  EP.reset = g => { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none'; g.shadowColor = 'transparent'; g.shadowBlur = 0; g.imageSmoothingQuality = 'high'; };

  // ---------------------------------------------------------------- images
  EP.img = {};
  EP.load = list => Promise.all(list.map(([name, src]) => new Promise(res => {
    const im = new Image();
    im.onload = () => { (im.decode ? im.decode() : Promise.resolve()).catch(() => {}).then(() => { EP.img[name] = im; res(); }); };
    im.onerror = () => { console.error('image failed: ' + src); res(); };
    im.src = src;
  })));
  // Pre-blurred / graded copies of images, cached once (blur on a full frame every frame is too slow).
  const VAR = {};
  EP.variant = (name, key, fn) => {
    const id = name + '|' + key;
    if (!VAR[id]) { const im = EP.img[name]; if (!im) return null; const c = EP.mk(im.width, im.height), g = c.getContext('2d'); fn(g, im, c); VAR[id] = c; }
    return VAR[id];
  };
  EP.blurred = (name, px = 16, bright = 1) => EP.variant(name, 'blur' + px + 'b' + bright, (g, im, c) => {
    g.filter = `blur(${px}px) brightness(${bright})`; g.drawImage(im, -px * 2, -px * 2, c.width + px * 4, c.height + px * 4); g.filter = 'none';
  });
  EP.graded = (name, filter) => EP.variant(name, filter, (g, im) => { g.filter = filter; g.drawImage(im, 0, 0); g.filter = 'none'; });

  // Draw an image so that it covers the frame. cam = {x, y} focus in image units 0..1, z zoom (1 = just covers),
  // r roll (rad), dx/dy screen offsets, free = allow edges to show (no clamping).
  EP.cover = (g, src, cam = {}) => {
    const im = typeof src === 'string' ? EP.img[src] : src;
    if (!im) return;
    const iw = im.width, ih = im.height;
    const { x = 0.5, y = 0.5, z = 1, r = 0, dx = 0, dy = 0, free = false } = cam;
    let zz = z;
    if (r) zz *= Math.abs(Math.cos(r)) + Math.abs(Math.sin(r)) * (W / H);
    const s = Math.max(W / iw, H / ih) * zz, dw = iw * s, dh = ih * s;
    let ox = W / 2 - x * dw, oy = H / 2 - y * dh;
    if (!free) { ox = clamp(ox, W - dw, 0); oy = clamp(oy, H - dh, 0); }
    g.save();
    if (r) { g.translate(W / 2, H / 2); g.rotate(r); g.translate(-W / 2, -H / 2); }
    g.drawImage(im, ox + dx, oy + dy, dw, dh);
    g.restore();
  };
  // Where image point (ix, iy) lands on screen for a given cover camera (no roll).
  EP.coverPt = (src, cam, ix, iy) => {
    const im = typeof src === 'string' ? EP.img[src] : src;
    const iw = im.width, ih = im.height, { x = 0.5, y = 0.5, z = 1, dx = 0, dy = 0, free = false } = cam;
    const s = Math.max(W / iw, H / ih) * z, dw = iw * s, dh = ih * s;
    let ox = W / 2 - x * dw, oy = H / 2 - y * dh;
    if (!free) { ox = clamp(ox, W - dw, 0); oy = clamp(oy, H - dh, 0); }
    return { x: ox + ix * dw + dx, y: oy + iy * dh + dy, s };
  };
  // Interpolate a camera path [{x,y,z,r}, ...] at progress p (each key evenly spaced).
  EP.camAt = (path, p) => {
    if (!Array.isArray(path)) return path || {};
    if (path.length === 1) return path[0];
    const n = path.length - 1, f = clamp(p) * n, i = Math.min(n - 1, Math.floor(f)), u = f - i, a = path[i], b = path[i + 1], o = {};
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const va = a[k] ?? b[k], vb = b[k] ?? a[k];
      o[k] = typeof va === 'number' ? (k === 'z' ? va * Math.pow(vb / va, u) : lerp(va, vb, u)) : vb;   // zoom interpolates exponentially (#028)
    }
    return o;
  };

  // ---------------------------------------------------------------- sprites (cut-out characters)
  // o: {x, y, h, ax, ay (anchor in sprite units, default bottom-centre), rot, sx, sy, flip, alpha,
  //     t (time for breathing/sway), sway (px of skirt/hair sway, default 0), breathe (default true), glow, rim}
  EP.spr = (g, name, o) => {
    const im = EP.img['cut/' + name];
    if (!im) return;
    const h = o.h, s = h / im.height, w = im.width * s, ax = o.ax ?? 0.5, ay = o.ay ?? 1, t = o.t ?? 0;
    g.save();
    g.translate(o.x, o.y);
    if (o.rot) g.rotate(o.rot);
    const br = o.breathe === false ? 0 : 0.0065 * Math.sin(t * EP.TAU / 3.4);
    g.scale((o.sx ?? 1) * (o.flip ? -1 : 1) * (1 - br * 0.5), (o.sy ?? 1) * (1 + br));
    if (o.alpha !== undefined) g.globalAlpha *= clamp(o.alpha);
    const x0 = -ax * w, y0 = -ay * h;
    if (o.shadow) {
      g.save(); g.fillStyle = `rgba(0,0,0,${o.shadow})`; g.filter = 'blur(10px)';
      g.beginPath(); g.ellipse(x0 + ax * w, y0 + h - 6, w * 0.32, 20, 0, 0, 7); g.fill(); g.restore();
    }
    if (o.glow) { g.save(); g.shadowColor = o.glow; g.shadowBlur = o.glowBlur ?? 40; g.drawImage(im, x0, y0, w, h); g.restore(); }
    const sway = o.sway ?? 0;
    if (sway > 0) {
      const N = 56, sh = im.height / N;
      for (let i = 0; i < N; i++) {
        const v = i / N, k = Math.pow(v, 1.4) * (1 - smooth(P(v, 0.86, 1)));
        const dx = sway * k * (Math.sin(t * 2.1 + v * 4.2) + 0.45 * Math.sin(t * 3.7 + v * 9.0 + 1.3));
        g.drawImage(im, 0, i * sh, im.width, sh + 1, x0 + dx, y0 + v * h, w, h / N + 1.2);
      }
    } else g.drawImage(im, x0, y0, w, h);
    if (o.rim) {   // rim light: only the sliver where a shifted, tinted silhouette sticks out past the sprite's edge
      const c = EP.rimEdge(name, o.rim, o.rimX ?? 10);
      g.globalCompositeOperation = 'lighter'; g.globalAlpha *= Math.min(1, (o.rimA ?? 0.35) * 2.2);
      g.drawImage(c, x0, y0, w, h);
    }
    g.restore();
  };
  const TINT = {};
  EP.tinted = (name, col) => {
    const id = name + col;
    if (!TINT[id]) { const im = EP.img['cut/' + name], c = EP.mk(im.width, im.height), g = c.getContext('2d'); g.drawImage(im, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height); TINT[id] = c; }
    return TINT[id];
  };
  const RIM = {};
  EP.rimEdge = (name, col, dx) => {
    const id = name + col + dx;
    if (!RIM[id]) {
      // light from the upper right: the sprite minus a copy shifted away from the light leaves a lit band on that edge
      const im = EP.img['cut/' + name], k = im.height / 1000, a = EP.mk(im.width, im.height), ag = a.getContext('2d');
      ag.drawImage(EP.tinted(name, col), 0, 0);
      ag.globalCompositeOperation = 'destination-out'; ag.drawImage(im, -dx * k, dx * k * 0.5); ag.globalCompositeOperation = 'source-over';
      const c = EP.mk(im.width, im.height), g = c.getContext('2d');
      g.filter = `blur(${1.5 * k}px)`; g.drawImage(a, 0, 0); g.filter = 'none';
      g.globalCompositeOperation = 'destination-in'; g.drawImage(im, 0, 0);    // stay inside the silhouette
      RIM[id] = c;
    }
    return RIM[id];
  };

  // ---------------------------------------------------------------- text
  EP.font = (w, px, fam) => `${w} ${Math.round(px)}px ${fam}`;
  EP.txt = (g, s, x, y, o = {}) => {
    g.font = o.font || EP.font(600, 48, EP.F.serif);
    g.textAlign = o.align || 'center'; g.textBaseline = o.base || 'alphabetic'; g.letterSpacing = o.ls || '0px';
    if (o.shadow) { g.shadowColor = o.shadow; g.shadowBlur = o.blur ?? 14; g.shadowOffsetY = o.oy ?? 3; }
    if (o.stroke) { g.lineJoin = 'round'; g.miterLimit = 2; g.strokeStyle = o.stroke; g.lineWidth = o.lw || 8; g.strokeText(s, x, y); if (!o.keepShadow) { g.shadowColor = 'transparent'; g.shadowBlur = 0; } }
    g.fillStyle = o.color || '#fff'; g.fillText(s, x, y);
    g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetY = 0; g.letterSpacing = '0px';
  };
  EP.fitPx = (g, s, w, px, fam, maxW, ls = 0) => { g.font = EP.font(w, px, fam); g.letterSpacing = ls + 'px'; const m = g.measureText(s).width; g.letterSpacing = '0px'; return m > maxW ? px * maxW / m : px; };

  // ---------------------------------------------------------------- shapes
  // Daisy outline (n rounded petals) — the character's own flower motif; also used as an iris shape.
  EP.daisy = (g, x, y, R, rot = 0, n = 14, inner = 0.38) => {
    g.beginPath();
    const M = n * 10;
    for (let i = 0; i <= M; i++) {
      const a = rot + i / M * EP.TAU, k = Math.pow(Math.abs(Math.cos(a * n / 2)), 0.55), r = R * (inner + (1 - inner) * k);
      const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
      i ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.closePath();
  };
  EP.drawDaisy = (g, x, y, R, o = {}) => {
    g.save(); g.fillStyle = o.petal || EP.C.cream; EP.daisy(g, x, y, R, o.rot || 0, o.n || 14, 0.3); g.fill();
    if (o.line) { g.strokeStyle = o.line; g.lineWidth = o.lw || 3; g.stroke(); }
    g.fillStyle = o.center || EP.C.orange; g.beginPath(); g.arc(x, y, R * 0.3, 0, 7); g.fill();
    g.restore();
  };
  EP.vgrad = (g, y0, y1, stops) => { const gr = g.createLinearGradient(0, y0, 0, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  EP.fill = (g, col) => { g.fillStyle = col; g.fillRect(0, 0, W, H); };

  // ---------------------------------------------------------------- camera shakes (ported moves)
  // Motion Prompt #024 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#024
  // Impact shake after a landing at tau = 0: x 15 px·e^(−5τ)·sin(2π·5τ), y 11 px·e^(−5τ)·cos(2π·6.5τ), roll 0.02·e^(−5τ)·sin(2π·5τ+0.6), 1.1 s (card px × EP.SC).
  EP.impact = (tau, amt = 1) => {
    if (tau <= 0 || tau >= 1.1) return { dx: 0, dy: 0, rot: 0 };
    const e = Math.exp(-5 * tau), ph = EP.TAU * 5 * tau;
    return { dx: 15 * EP.SC * amt * e * Math.sin(ph), dy: 11 * EP.SC * amt * e * Math.cos(ph * 1.3), rot: 0.02 * amt * e * Math.sin(ph + 0.6) };
  };
  // Motion Prompt #034 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#034
  // Handheld: yaw/pitch/roll as sums of sines with integer multipliers (T = 2π·u/4.7); focal 330 card px → screen px.
  EP.handheld = (u, amt = 1) => {
    const T = EP.TAU * u / 4.7, f = 330 * EP.SC;
    const yaw = 0.016 * Math.sin(3 * T) + 0.008 * Math.sin(7 * T + 1) + 0.004 * Math.sin(13 * T + 2);
    const pitch = 0.012 * Math.sin(4 * T + 2) + 0.006 * Math.sin(9 * T + 0.5) + 0.003 * Math.sin(17 * T + 1.2);
    const roll = 0.02 * Math.sin(5 * T + 1) + 0.008 * Math.sin(11 * T + 3);
    return { dx: f * yaw * amt, dy: f * pitch * amt, rot: roll * amt };
  };
  // Apply a {dx, dy, rot, z} camera to the whole frame around its centre.
  EP.camApply = (g, c, z = 1) => { g.translate(W / 2 + (c.dx || 0), H / 2 + (c.dy || 0)); if (c.rot) g.rotate(c.rot); const zz = z * (c.z || 1); if (zz !== 1) g.scale(zz, zz); g.translate(-W / 2, -H / 2); };
})();
