// core.js — namespace, math, beat clock, assets and drawing helpers for the "Zombies on Your Lawn" MV.
// Every frame is a pure function of song time t (no clock reads, no Math.random at draw time), so the live preview
// and the frame-by-frame export give identical pictures.
'use strict';
(function () {
  const ZL = window.ZL = {};
  const W = ZL.W = 1920, H = ZL.H = 1080;
  ZL.SCENES = [];   // {id, t0, t1, img, draw(g, t)} — filled by scenes/*.js
  ZL.OVER = [];     // screen overlays drawn after the scenes

  // Motion Prompt #001-024 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#001
  // Easing and shape helpers below are copied from the "motion" pack kit (as in the Evil Plan MV).
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
  Object.assign(ZL, { clamp, lerp, P, eIO, eIOs, eOut, eOut5, eIn, smooth, mod, backOut, backIn, spring, star, heartPath });
  // ---- end of kit-derived helpers

  ZL.TAU = Math.PI * 2;
  ZL.hash = (a, b = 0, c = 0) => {
    let h = Math.imul(a | 0, 374761393) ^ Math.imul((b | 0) + 0x9E37, 668265263) ^ Math.imul((c | 0) + 0x85EB, 1274126177);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
  ZL.noise = (x, s = 0) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(ZL.hash(i, s), ZL.hash(i + 1, s), u) * 2 - 1; };
  ZL.rng = seed => { let s = seed >>> 0 || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };
  ZL.F = {
    lyric: '"Gochi Hand", "Patrick Hand", "Comic Sans MS", cursive',
    hand: '"Patrick Hand", "Gochi Hand", cursive',
    bubbly: '"Chewy", "Fredoka", sans-serif',
    round: '"Fredoka", "Segoe UI", sans-serif',
    creep: '"Creepster", "Chewy", sans-serif'
  };

  // ---------------------------------------------------------------- timing / beat clock
  const T = ZL.T = window.TIMING;
  // word times from the forced alignment (tools/lipkeys.py) replace the whisper-based ones
  for (const [i, wt] of Object.entries(window.WORDT || {})) {
    const ln = T.lines[+i]; if (!ln || wt.length !== ln.words.length) continue;
    ln.words.forEach((w, j) => { w.t0 = wt[j][0]; w.t1 = wt[j][1]; });
    ln.t0 = ln.words[0].t0; ln.t1 = ln.words[ln.words.length - 1].t1;
  }
  const BEATS = T.beats, DOWNS = T.downbeats;
  function lastLE(arr, t) { let lo = 0, hi = arr.length - 1, r = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (arr[m] <= t) { r = m; lo = m + 1; } else hi = m - 1; } return r; }
  ZL.lastLE = lastLE;
  ZL.BEAT = 60 / T.tempo;
  ZL.beat = t => {
    const i = lastLE(BEATS, t), t0 = i >= 0 ? BEATS[i] : 0, t1 = i + 1 < BEATS.length ? BEATS[i + 1] : t0 + ZL.BEAT;
    return { i, t0, dt: t - t0, ph: clamp((t - t0) / (t1 - t0)) };
  };
  // continuous beat count (beat index + phase); before the first beat it runs on the nominal tempo
  ZL.beatPos = t => {
    if (t < BEATS[0]) return (t - BEATS[0]) / ZL.BEAT;
    const b = ZL.beat(t); return b.i + b.ph;
  };
  ZL.pulse = (t, k = 7) => { const i = lastLE(BEATS, t); return i < 0 ? 0 : Math.exp(-k * (t - BEATS[i])); };
  ZL.dpulse = (t, k = 4) => { const i = lastLE(DOWNS, t); return i < 0 ? 0 : Math.exp(-k * (t - DOWNS[i])); };
  ZL.energy = t => { const a = T.rms_db, x = t * 10, i = Math.floor(x), f = x - i; const v = lerp(a[clamp(i, 0, a.length - 1)], a[clamp(i + 1, 0, a.length - 1)], f); return clamp((v + 26) / 24); };
  ZL.line = i => T.lines[i];
  ZL.L = i => T.lines[i].t0;
  ZL.E = i => T.lines[i].t1;
  ZL.Wd = (i, j) => T.lines[i].words[Math.min(j, T.lines[i].words.length - 1)].t0;
  ZL.WdE = (i, j) => T.lines[i].words[Math.min(j, T.lines[i].words.length - 1)].t1;
  // first line (index) of a section, e.g. ZL.sec('chorus2') → 22
  ZL.sec = (name, k = 0) => T.lines.filter(l => l.sec === name)[k].i;

  // ---------------------------------------------------------------- canvases and buffers
  ZL.mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const BUFS = [];
  ZL.buf = (i, w = W, h = H) => {
    if (!BUFS[i] || BUFS[i].c.width !== w || BUFS[i].c.height !== h) { const c = ZL.mk(w, h); BUFS[i] = { c, g: c.getContext('2d') }; }
    const b = BUFS[i]; ZL.reset(b.g); b.g.clearRect(0, 0, w, h); return b;
  };
  ZL.reset = g => { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none'; g.shadowColor = 'transparent'; g.shadowBlur = 0; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; };

  // ---------------------------------------------------------------- images and sprites
  ZL.img = {};
  ZL.load = list => Promise.all(list.map(([name, src]) => new Promise(res => {
    const im = new Image();
    im.onload = () => { (im.decode ? im.decode() : Promise.resolve()).catch(() => {}).then(() => { ZL.img[name] = im; res(); }); };
    im.onerror = () => { console.error('image failed: ' + src); res(); };
    im.src = src;
  })));
  const VAR = {};
  ZL.variant = (name, key, fn) => {
    const id = name + '|' + key;
    if (!VAR[id]) { const im = ZL.img[name]; if (!im) return null; const c = ZL.mk(im.width, im.height), g = c.getContext('2d'); fn(g, im, c); VAR[id] = c; }
    return VAR[id];
  };
  ZL.graded = (name, filter) => ZL.variant(name, filter, (g, im) => { g.filter = filter; g.drawImage(im, 0, 0); g.filter = 'none'; });
  // silhouette tinted with one colour (rim lights, shadows)
  ZL.tinted = (name, col) => ZL.variant(name, 'tint' + col, (g, im, c) => { g.drawImage(im, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height); });

  // window.SPRITES[name] = {w, h, ax, ay, pts?}: cut sprite size in px and its anchor (fractions of w/h);
  // drawn with ZL.spr(g, name, x, y, s) so that the anchor lands on (x, y) and the sprite is s * its own px size.
  ZL.SP = window.SPRITES || {};
  ZL.spr = (g, name, x, y, s = 1, o = {}) => {
    const im = ZL.img[name] || (o.src && ZL.img[o.src]);
    if (!im) return;
    const sp = ZL.SP[name] || { ax: 0.5, ay: 1 };
    const ax = o.ax ?? sp.ax, ay = o.ay ?? sp.ay;
    const w = im.width * s, h = im.height * s;
    g.save();
    g.translate(x, y);
    if (o.rot) g.rotate(o.rot);
    if (o.sx || o.sy) g.scale(o.sx || 1, o.sy || 1);
    if (o.flip) g.scale(-1, 1);
    if (o.alpha != null) g.globalAlpha *= o.alpha;
    g.drawImage(o.img || im, -ax * w, -ay * h, w, h);
    g.restore();
  };
  // point of a sprite (fractions u, v of its box) in screen space for an un-rotated draw at (x, y, s)
  ZL.sprPt = (name, x, y, s, u, v, flip = false) => {
    const im = ZL.img[name], sp = ZL.SP[name] || { ax: 0.5, ay: 1 };
    const dx = (u - sp.ax) * im.width * s;
    return { x: x + (flip ? -dx : dx), y: y + (v - sp.ay) * im.height * s };
  };

  // window.ANIMS[name] = {src, k, frames: [[x, y, w, h, ax, ay], ...]}: frame atlases (dance cycles, walks).
  // Frames are drawn so that their anchor (ax, ay, atlas px) lands on (x, y); s = screen px per logical unit,
  // k = logical units per atlas px.
  ZL.AN = window.ANIMS || {};
  ZL.anim = (g, name, i, x, y, s = 1, o = {}) => {
    const A = ZL.AN[name], im = ZL.img[A.src];
    if (!A || !im) return;
    const n = A.frames.length, f = A.frames[mod(Math.floor(i), n)];
    const k = A.k * s;
    g.save();
    g.translate(x, y);
    if (o.rot) g.rotate(o.rot);
    if (o.flip) g.scale(-1, 1);
    if (o.alpha != null) g.globalAlpha *= o.alpha;
    g.drawImage(o.img || im, f[0], f[1], f[2], f[3], -f[4] * k, -f[5] * k, f[2] * k, f[3] * k);
    g.restore();
  };

  // ---------------------------------------------------------------- text
  // outlined text with a soft drop shadow; returns the width
  ZL.text = (g, str, x, y, o = {}) => {
    const { size = 60, font = ZL.F.lyric, fill = '#fff', stroke = '#1d1408', lw = size * 0.16, align = 'center', base = 'alphabetic', shadow = 0.5, weight = '' } = o;
    g.save();
    g.font = `${weight} ${size}px ${font}`;
    g.textAlign = align; g.textBaseline = base; g.lineJoin = 'round'; g.miterLimit = 2;
    if (shadow) { g.shadowColor = `rgba(0,0,0,${shadow})`; g.shadowBlur = size * 0.18; g.shadowOffsetY = size * 0.06; }
    if (lw > 0) { g.strokeStyle = stroke; g.lineWidth = lw; g.strokeText(str, x, y); }
    g.shadowColor = 'transparent';
    g.fillStyle = fill; g.fillText(str, x, y);
    const w = g.measureText(str).width;
    g.restore();
    return w;
  };
  ZL.measure = (g, str, size, font = ZL.F.lyric, weight = '') => { g.save(); g.font = `${weight} ${size}px ${font}`; const w = g.measureText(str).width; g.restore(); return w; };

  // ---------------------------------------------------------------- camera
  // A camera looks at world point (x, y) with zoom z (screen px per world px) and roll r.
  ZL.camApply = (g, cam) => {
    g.translate(W / 2 + (cam.sx || 0), H / 2 + (cam.sy || 0));
    if (cam.r) g.rotate(cam.r);
    g.scale(cam.z, cam.z);
    g.translate(-cam.x, -cam.y);
  };
  // keyframed camera: keys [[t, {x, y, z, r}], ...], eased between keys (zoom interpolates exponentially)
  ZL.camKeys = (keys, t, ease = eIO) => {
    if (t <= keys[0][0]) return { ...keys[0][1] };
    for (let i = 0; i < keys.length - 1; i++) {
      const [ta, a] = keys[i], [tb, b] = keys[i + 1];
      if (t <= tb) {
        const u = ease(P(t, ta, tb)), o = {};
        for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
          const va = a[k] ?? b[k], vb = b[k] ?? a[k];
          o[k] = k === 'z' ? va * Math.pow(vb / va, u) : lerp(va, vb, u);
        }
        return o;
      }
    }
    return { ...keys[keys.length - 1][1] };
  };
  // handheld drift (#034-style, deterministic)
  ZL.drift = (t, amp = 6, rot = 0.004, seed = 3) => ({ sx: ZL.noise(t * 0.45, seed) * amp, sy: ZL.noise(t * 0.38, seed + 9) * amp * 0.7, r: ZL.noise(t * 0.3, seed + 17) * rot });
  // impact shake that decays after t0
  ZL.shake = (t, t0, amp = 18, dur = 0.45, f = 31) => {
    if (t < t0 || t > t0 + dur) return { x: 0, y: 0 };
    const k = 1 - (t - t0) / dur, d = amp * k * k;
    return { x: Math.sin((t - t0) * f * 6.1) * d, y: Math.cos((t - t0) * f * 4.7) * d * 0.8 };
  };
})();
