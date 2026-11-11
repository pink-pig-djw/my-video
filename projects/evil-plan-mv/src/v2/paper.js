// v2/paper.js — paper-world toolkit for the "Evil Plan dossier" look: textures, torn cards, tape, sticky notes,
// hand-drawn ink marks, rubber stamps, card flips and page tears. Everything is cached or a pure function of time.
'use strict';
(function () {
  const { W, H, clamp, lerp, P, eIO, eIOs, eOut, eOut5, eIn, backOut, backIn, spring, smooth, hash, noise, mod } = EP;
  const PA = EP.PA = {};
  PA.COL = {
    cream: '#F4EADB', cream2: '#E9DBC4', indigo: '#1C2453', indigo2: '#283272', ink: '#272238', gold: '#E8B54A', goldInk: '#F4CE72',
    tangerine: '#F07A2E', red: '#D23A2C', teal: '#2F8F8A', kraft: '#C7A57B', pencil: '#5A6075', marker: '#C8261D', hl: '#FFD84D', sky: '#8EC9EE'
  };

  // ------------------------------------------------------------------ textures
  const TEX = {};
  const BASE = { cream: '#F4EADB', indigo: '#1C2453', kraft: '#C7A57B', desk: '#2B1D17', grid: '#F3EEE3', felt: '#141938', white: '#FBF8F1', red: '#B8322A', blue: '#2E5FA8', black: '#1A1820' };
  PA.tex = kind => {
    if (TEX[kind]) return TEX[kind];
    const S = 512, c = EP.mk(S, S), g = c.getContext('2d', { willReadFrequently: true }), R = EP.rng(kind.length * 977 + kind.charCodeAt(0));
    g.fillStyle = BASE[kind] || kind; g.fillRect(0, 0, S, S);
    const dark = ['indigo', 'felt', 'desk', 'black', 'blue', 'red'].includes(kind);
    const im = g.getImageData(0, 0, S, S), d = im.data, amp = kind === 'desk' ? 10 : dark ? 12 : 16;
    for (let i = 0; i < d.length; i += 4) { const n = (R() - 0.5) * amp; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    g.putImageData(im, 0, 0);
    if (kind === 'desk') {   // walnut grain
      for (let y = 0; y < S; y++) { const v = 0.5 + 0.5 * Math.sin(y * 0.045 + 2.4 * Math.sin(y * 0.011) + Math.sin(y * 0.19) * 0.3); g.fillStyle = `rgba(0,0,0,${0.06 + v * 0.12})`; g.fillRect(0, y, S, 1); }
      g.globalAlpha = 0.05; g.fillStyle = '#E0A070'; for (let i = 0; i < 40; i++) { g.fillRect(0, R() * S, S, 1 + R() * 2); } g.globalAlpha = 1;
    } else {
      g.globalAlpha = dark ? 0.08 : 0.06; g.strokeStyle = dark ? '#AAB4F0' : '#7A5A3A';
      for (let i = 0; i < 240; i++) { g.lineWidth = 0.4 + R() * 0.9; g.beginPath(); const x = R() * S, y = R() * S, a = R() * 6.28, l = 6 + R() * 26; g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + R() * 4, y + Math.sin(a) * l * 0.5 + R() * 4, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
      g.globalAlpha = 1;
    }
    if (kind === 'grid') { g.strokeStyle = 'rgba(70,110,200,.16)'; g.lineWidth = 1; for (let x = 0; x <= S; x += 32) { g.beginPath(); g.moveTo(x + .5, 0); g.lineTo(x + .5, S); g.stroke(); } for (let y = 0; y <= S; y += 32) { g.beginPath(); g.moveTo(0, y + .5); g.lineTo(S, y + .5); g.stroke(); } }
    return (TEX[kind] = c);
  };
  // fill a rect with a tiled texture (pattern anchored to the rect's own origin)
  PA.tile = (g, kind, x, y, w, h) => {
    const t = PA.tex(kind), S = t.width;
    for (let yy = 0; yy < h; yy += S) for (let xx = 0; xx < w; xx += S) {
      const ww = Math.min(S, w - xx), hh = Math.min(S, h - yy);
      g.drawImage(t, 0, 0, ww, hh, x + xx, y + yy, ww, hh);
    }
  };

  // ------------------------------------------------------------------ edges and cards
  function edgePath(g, w, h, o, seed) {
    const R = EP.rng(seed), torn = o.torn || '', step = 9;
    const jag = side => torn.includes(side);
    g.beginPath(); g.moveTo(0, 0);
    for (let x = step; x <= w; x += step) g.lineTo(Math.min(x, w), jag('t') ? (R() - 0.3) * 7 : 0);
    for (let y = step; y <= h; y += step) g.lineTo(jag('r') ? w + (R() - 0.7) * 7 : w, Math.min(y, h));
    for (let x = w - step; x >= 0; x -= step) g.lineTo(Math.max(x, 0), jag('b') ? h + (R() - 0.7) * 7 : h);
    for (let y = h - step; y >= 0; y -= step) g.lineTo(jag('l') ? (R() - 0.3) * 7 : 0, Math.max(y, 0));
    g.closePath();
  }
  const CARDS = {};
  // A paper card with baked drop shadow. o: {tex, torn:'tb', lines, margin, grid, holes, header:{col,h}, blur, sx, sy, r}
  PA.card = (id, w, h, o = {}) => {
    if (CARDS[id]) return CARDS[id];
    const pad = 64, c = EP.mk(Math.ceil(w + pad * 2), Math.ceil(h + pad * 2)), g = c.getContext('2d'), seed = id.length * 131 + w + h;
    const shape = gg => { if (o.r && !o.torn) { gg.beginPath(); gg.roundRect(0, 0, w, h, o.r); } else edgePath(gg, w, h, o, seed); };
    if (o.shadow !== false) { g.save(); g.filter = `blur(${o.blur || 16}px)`; g.fillStyle = `rgba(0,0,0,${o.sa ?? 0.5})`; g.translate(pad + (o.sx ?? 6), pad + (o.sy ?? 14)); shape(g); g.fill(); g.restore(); }
    g.save(); g.translate(pad, pad); shape(g); g.clip();
    PA.tile(g, o.tex || 'cream', 0, 0, w, h);
    if (o.header) { g.fillStyle = o.header.col; g.fillRect(0, 0, w, o.header.h); }
    if (o.lines) { g.strokeStyle = o.lineCol || 'rgba(70,110,190,.28)'; g.lineWidth = 2; for (let y = o.lines; y < h; y += o.lines) { g.beginPath(); g.moveTo(0, y + .5); g.lineTo(w, y + .5); g.stroke(); } }
    if (o.margin) { g.strokeStyle = 'rgba(210,60,50,.45)'; g.lineWidth = 3; g.beginPath(); g.moveTo(o.margin, 0); g.lineTo(o.margin, h); g.stroke(); }
    if (o.holes) { g.fillStyle = 'rgba(0,0,0,.55)'; for (let y = 60; y < h - 30; y += 120) { g.beginPath(); g.arc(28, y, 11, 0, 7); g.fill(); } }
    // soft inner edge shading, so the paper reads as a sheet
    const eg = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) * 0.62);
    eg.addColorStop(0, 'rgba(0,0,0,0)'); eg.addColorStop(1, `rgba(40,25,10,${o.edge ?? 0.18})`); g.fillStyle = eg; g.fillRect(0, 0, w, h);
    g.restore();
    return (CARDS[id] = { c, pad, w, h });
  };
  PA.drawCard = (g, card, x, y, rot = 0, sc = 1, alpha = 1) => {
    g.save(); g.translate(x, y); if (rot) g.rotate(rot); if (sc !== 1) g.scale(sc, sc); if (alpha < 1) g.globalAlpha *= alpha;
    g.drawImage(card.c, -card.w / 2 - card.pad, -card.h / 2 - card.pad); g.restore();
  };

  // ------------------------------------------------------------------ tape, sticky notes, paper clips, pins
  PA.tape = (g, x, y, w, rot, col = 'rgba(244,206,120,.78)', hh = 44, seed = 1) => {
    const R = EP.rng(seed * 31 + 7), hw = w / 2, h2 = hh / 2;
    g.save(); g.translate(x, y); g.rotate(rot);
    g.beginPath(); g.moveTo(-hw, -h2);
    for (let i = 0; i <= 6; i++) g.lineTo(-hw + (R() - 0.5) * 7, -h2 + i * hh / 6);
    for (let i = 0; i <= 6; i++) g.lineTo(hw + (R() - 0.5) * 7, h2 - i * hh / 6);
    g.closePath(); g.fillStyle = col; g.fill();
    g.globalAlpha = 0.18; g.fillStyle = '#fff'; g.fillRect(-hw, -h2, w, hh * 0.28); g.globalAlpha = 1;
    g.restore();
  };
  PA.sticky = (g, x, y, s, col, rot = 0, lift = 0) => {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = `rgba(0,0,0,${0.28 + lift * 0.1})`; g.filter = `blur(${6 + lift * 10}px)`; g.fillRect(-s / 2 + 6 + lift * 8, -s / 2 + 10 + lift * 14, s, s); g.filter = 'none';
    const gr = g.createLinearGradient(0, -s / 2, 0, s / 2); gr.addColorStop(0, col); gr.addColorStop(1, EP.mix(col.startsWith('#') ? col : '#FFE37A', '#000000', 0.08));
    g.fillStyle = gr; g.beginPath(); g.moveTo(-s / 2, -s / 2); g.lineTo(s / 2, -s / 2); g.lineTo(s / 2, s / 2 - 22); g.quadraticCurveTo(s / 2 - 6, s / 2 - 4, s / 2 - 26, s / 2); g.lineTo(-s / 2, s / 2); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,.07)'; g.fillRect(-s / 2, -s / 2, s, s * 0.12);
    g.restore();
  };
  PA.pin = (g, x, y, col = '#D23A2C') => { g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(x + 4, y + 6, 12, 0, 7); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.arc(x - 4, y - 4, 4, 0, 7); g.fill(); };

  // ------------------------------------------------------------------ hand-drawn ink (trim paths)
  // Motion Prompt #004 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#004
  // Line draw: strokes are trim paths (the visible range start→end animates, cubic in-out); a dot rides the leading
  // tip while drawing; a circle is drawn around a point clockwise from the top in 0.6 s.
  function smoothPath(pts, n = 10) { const out = []; for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)]; for (let j = 0; j < n; j++) { const t = j / n, t2 = t * t, t3 = t2 * t; out.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } } out.push(pts[pts.length - 1]); return out; }
  function pathLen(pts) { const c = [0]; for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return c; }
  function ptAt(pts, cum, f) { const L = cum[cum.length - 1] * clamp(f); let i = 1; while (i < cum.length - 1 && cum[i] < L) i++; const t = (L - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]); return [lerp(pts[i - 1][0], pts[i][0], t), lerp(pts[i - 1][1], pts[i][1], t), Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])]; }
  function trim(g, pts, cum, f0, f1) { if (f1 - f0 <= 0.0005) return; const L = cum[cum.length - 1], a = L * f0, b = L * f1; g.beginPath(); const s = ptAt(pts, cum, f0); g.moveTo(s[0], s[1]); for (let i = 1; i < pts.length - 1; i++) if (cum[i] > a && cum[i] < b) g.lineTo(pts[i][0], pts[i][1]); const e = ptAt(pts, cum, f1); g.lineTo(e[0], e[1]); g.stroke(); }
  PA.path = (pts, smoothN = 10) => { const p = smoothPath(pts, smoothN); return { p, c: pathLen(p) }; };
  // Wobbly hand-drawn version of a polyline (deterministic jitter).
  PA.hand = (pts, amp = 3, seed = 1) => { const R = EP.rng(seed), out = pts.map(([x, y]) => [x + (R() - 0.5) * amp * 2, y + (R() - 0.5) * amp * 2]); return PA.path(out, 8); };
  // stroke a prepared path from f0 to f1; o: {col, w, tip (colour of the riding dot), alpha, comp}
  PA.ink = (g, path, f0, f1, o = {}) => {
    if (f1 <= f0) return;
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = o.col || PA.COL.marker; g.lineWidth = o.w || 8;
    if (o.alpha !== undefined) g.globalAlpha *= o.alpha; if (o.comp) g.globalCompositeOperation = o.comp;
    trim(g, path.p, path.c, f0, f1);
    if (o.tip && f1 > 0 && f1 < 1) { const e = ptAt(path.p, path.c, f1); g.fillStyle = o.tip; g.beginPath(); g.arc(e[0], e[1], (o.w || 8) * 0.9, 0, 7); g.fill(); }
    g.restore();
  };
  const LOOPS = {};
  // hand-drawn loop around a word: slightly more than a full turn, so the ends overlap like a real marker circle
  PA.loop = (cx, cy, rx, ry, seed = 1) => {
    const key = [cx, cy, rx, ry, seed].map(v => Math.round(v)).join(',');
    if (LOOPS[key]) return LOOPS[key];
    const R = EP.rng(seed * 17 + 3), pts = [], N = 28, turn = 1.12;
    for (let i = 0; i <= N; i++) { const a = -Math.PI / 2 - 0.3 + i / N * EP.TAU * turn, k = 1 + (R() - 0.5) * 0.08 + i / N * 0.06; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    return (LOOPS[key] = PA.path(pts, 6));
  };
  // highlighter swipe (multiply), rough-edged, revealed left → right
  PA.highlight = (g, x, y, w, h, pr, col = PA.COL.hl, seed = 1) => {
    if (pr <= 0) return;
    const R = EP.rng(seed), ww = w * clamp(pr);
    g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha *= 0.75; g.fillStyle = col;
    g.beginPath(); g.moveTo(x, y + (R() - 0.5) * 6);
    for (let i = 1; i <= 8; i++) g.lineTo(x + ww * i / 8, y + (R() - 0.5) * 6);
    for (let i = 8; i >= 0; i--) g.lineTo(x + ww * i / 8, y + h + (R() - 0.5) * 6);
    g.closePath(); g.fill(); g.restore();
  };

  // ------------------------------------------------------------------ doodles (hand-drawn icons as point lists)
  const DOO = {};
  function ring(cx, cy, r, n = 24, a0 = -Math.PI / 2) { const a = []; for (let i = 0; i <= n; i++) { const t = a0 + i / n * EP.TAU; a.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r]); } return a; }
  PA.doodle = (kind, s = 1, seed = 1) => {
    const key = kind + s + '|' + seed;
    if (DOO[key]) return DOO[key];
    const S = v => v.map(([x, y]) => [x * s, y * s]);
    let strokes = [];
    switch (kind) {
      case 'sun': strokes = [ring(0, 0, 40)]; for (let i = 0; i < 10; i++) { const a = i / 10 * EP.TAU; strokes.push([[Math.cos(a) * 58, Math.sin(a) * 58], [Math.cos(a) * 86, Math.sin(a) * 86]]); } break;
      case 'daisy': for (let i = 0; i < 9; i++) { const a = i / 9 * EP.TAU, b = a + 0.28; strokes.push([[Math.cos(a - 0.3) * 18, Math.sin(a - 0.3) * 18], [Math.cos(a) * 70, Math.sin(a) * 70], [Math.cos(b) * 72, Math.sin(b) * 72], [Math.cos(b + 0.3) * 18, Math.sin(b + 0.3) * 18]]); } strokes.push(ring(0, 0, 18, 14)); break;
      case 'moon': { const a = []; for (let i = 0; i <= 20; i++) { const t = -1.9 + i / 20 * 3.8; a.push([Math.cos(t) * 60, Math.sin(t) * 60]); } for (let i = 0; i <= 14; i++) { const t = 1.6 - i / 14 * 3.2; a.push([28 + Math.cos(t) * 42 - 14, Math.sin(t) * 46]); } strokes = [a]; break; }
      case 'star': { const a = []; for (let i = 0; i <= 10; i++) { const r = i % 2 ? 22 : 54, t = -Math.PI / 2 + i * Math.PI / 5; a.push([Math.cos(t) * r, Math.sin(t) * r]); } strokes = [a]; break; }
      case 'heart': { const a = []; for (let i = 0; i <= 30; i++) { const t = i / 30 * EP.TAU; a.push([16 * Math.pow(Math.sin(t), 3) * 3.4, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 3.4]); } strokes = [a]; break; }
      case 'note': strokes = [ring(-14, 36, 14, 12), [[0, 36], [0, -40], [34, -30], [34, 14]], ring(20, 18, 14, 12)]; break;
      case 'arrow': strokes = [[[-120, 20], [-40, -10], [40, -6], [110, -30]], [[80, -52], [112, -30], [86, 0]]]; break;
      case 'cloud': strokes = [[[-70, 20], [-80, -4], [-56, -24], [-30, -20], [-16, -46], [18, -50], [36, -26], [62, -30], [80, -6], [70, 20], [-70, 20]]]; break;
      case 'bolt': strokes = [[[10, -40], [-14, 4], [8, 4], [-10, 44]]]; break;
      case 'rain': for (let i = 0; i < 5; i++) strokes.push([[-50 + i * 24, 34], [-58 + i * 24, 58]]); break;
      case 'check': strokes = [[[-26, 0], [-6, 22], [30, -28]]]; break;
      case 'door': strokes = [[[-40, 70], [-40, -80], [40, -80], [40, 70]], ring(24, 0, 5, 8)]; break;
      case 'clock': strokes = [ring(0, 0, 70), [[0, 0], [0, -46]], [[0, 0], [34, 12]]]; break;
      case 'envelope': strokes = [[[-60, -38], [60, -38], [60, 38], [-60, 38], [-60, -38]], [[-60, -38], [0, 8], [60, -38]]]; break;
    }
    return (DOO[key] = strokes.map((st, i) => PA.hand(S(st), 2.2 * s, seed * 7 + i)));
  };
  // draw a doodle's strokes progressively (pr 0..1 across all strokes)
  PA.drawDoodle = (g, kind, x, y, s, pr, o = {}) => {
    const strokes = PA.doodle(kind, s, o.seed || 1), n = strokes.length;
    g.save(); g.translate(x, y); if (o.rot) g.rotate(o.rot);
    strokes.forEach((st, i) => { const f = clamp(pr * n - i); if (f > 0) PA.ink(g, st, 0, eIO(f), { col: o.col || PA.COL.goldInk, w: (o.w || 6), alpha: o.alpha }); });
    g.restore();
  };

  // ------------------------------------------------------------------ rubber stamps (ink-textured, cached)
  let SPECK = null;
  function speckle() {
    if (SPECK) return SPECK;
    const c = EP.mk(512, 512), g = c.getContext('2d'), R = EP.rng(4242);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(0,0,0,${0.3 + R() * 0.7})`; g.beginPath(); g.arc(R() * 512, R() * 512, 0.6 + R() * 2.6, 0, 7); g.fill(); }
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(R() * 512, R() * 512, 30 + R() * 120, 1 + R() * 2); }
    return (SPECK = c);
  }
  const STAMPS = {};
  PA.stampImg = (text, px, col, o = {}) => {
    const key = text + px + col + (o.sub || '') + (o.border !== false);
    if (STAMPS[key]) return STAMPS[key];
    const m = EP.mk(10, 10).getContext('2d'); m.font = EP.font(900, px, EP.F.ui); m.letterSpacing = Math.round(px * 0.08) + 'px';
    const tw = m.measureText(text).width, padX = px * 0.45, padY = px * 0.32, subPx = px * 0.28;
    const w = Math.ceil(tw + padX * 2), h = Math.ceil(px * 1.05 + padY * 2 + (o.sub ? subPx * 1.3 : 0));
    const c = EP.mk(w + 20, h + 20), g = c.getContext('2d');
    g.translate(10, 10); g.strokeStyle = col; g.fillStyle = col;
    if (o.border !== false) { g.lineWidth = px * 0.09; g.beginPath(); g.roundRect(px * 0.05, px * 0.05, w - px * 0.1, h - px * 0.1, px * 0.18); g.stroke(); g.lineWidth = px * 0.035; g.beginPath(); g.roundRect(px * 0.17, px * 0.17, w - px * 0.34, h - px * 0.34, px * 0.12); g.stroke(); }
    g.font = EP.font(900, px, EP.F.ui); g.letterSpacing = Math.round(px * 0.08) + 'px'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, w / 2, padY + px * 0.55); g.letterSpacing = '0px';
    if (o.sub) { g.font = EP.font(800, subPx, EP.F.ui); g.fillText(o.sub, w / 2, h - padY - subPx * 0.3); }
    g.globalCompositeOperation = 'destination-out'; g.drawImage(speckle(), 0, 0, 512, 512, -10, -10, Math.max(w, h) + 20, Math.max(w, h) + 20);
    return (STAMPS[key] = { c, w, h });
  };
  // Motion Prompt #008 (slam) + #024 (impact) · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#008
  // A stamp lands like the slam: scale 3.4→1 at 0.02–0.2 s (cubic in) with a vertical squash 20 %·e^(−11t) after impact.
  PA.stamp = (g, text, x, y, lu, o = {}) => {
    if (lu < 0.02) return;
    const S = PA.stampImg(text, o.px || 90, o.col || PA.COL.red, o), hit = 0.2, tt = lu - hit;
    const sc = tt < 0 ? lerp(3.4, 1, eIn(P(lu, 0.02, hit))) : 1, sy = tt > 0 ? 1 - 0.2 * Math.exp(-11 * tt) : 1;
    g.save(); g.translate(x, y); g.rotate(o.rot || 0); g.scale(sc * (2 - sy), sc * sy);
    g.globalAlpha *= P(lu, 0.02, 0.1) * (o.alpha ?? 0.92); g.globalCompositeOperation = o.comp || 'multiply';
    g.drawImage(S.c, -S.w / 2 - 10, -S.h / 2 - 10); g.restore();
  };

  // ------------------------------------------------------------------ card flip (#021)
  // Motion Prompt #021 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#021
  // Flip: 180° with backOut (s = 1.5) going slightly past and back; width × |cos θ|; faces swap at 90°; thin vertical
  // slices get up to ±20 %·sin θ perspective; the card lifts (scale +8 %) on a sine; a dark overlay 0.34·|sin θ| shades it.
  PA.flipState = pr => { const th = Math.PI * backOut(clamp(pr), 1.5); return { c: Math.cos(th), s: Math.sin(th), front: Math.cos(th) >= 0, lift: Math.sin(Math.PI * clamp(pr)) }; };
  // draw canvas A (front) / B (back) flipping around the vertical axis at (x, y); w,h = drawn size
  // o.opaque: shade with the #021 quad overlay (for solid cards); otherwise (cut-out stickers) dim with brightness.
  PA.flipDraw = (g, A, B, pr, x, y, w, h, o = {}) => {
    const f = PA.flipState(pr), img = f.front ? A : B, sc = 1 + 0.08 * f.lift, ww = w * Math.abs(f.c) * sc, per = 0.2 * f.s * (f.front ? 1 : -1);
    if (ww < 1) return;
    const N = o.slices || 24, iw = img.width, ih = img.height, sh = Math.abs(f.s), lift = 6 * f.lift * (h / 156) * (o.liftK ?? 1), yy = y - lift;
    g.save();
    if (!o.opaque && sh > 0.02) g.filter = `brightness(${1 - 0.34 * sh})`;
    for (let k = 0; k < N; k++) {
      const fm = (k + 0.5) / N, dx = x - ww / 2 + k / N * ww, hh = h * sc * (1 + per * (fm - 0.5) * 2);
      g.drawImage(img, iw * k / N, 0, iw / N + 0.5, ih, dx, yy - hh / 2, ww / N + 0.8, hh);
    }
    g.restore();
    if (o.opaque && sh > 0.02) {
      const hl = h * sc * (1 - per), hr = h * sc * (1 + per);
      g.save(); g.fillStyle = `rgba(8,10,30,${0.34 * sh})`;
      g.beginPath(); g.moveTo(x - ww / 2, yy - hl / 2); g.lineTo(x + ww / 2, yy - hr / 2); g.lineTo(x + ww / 2, yy + hr / 2); g.lineTo(x - ww / 2, yy + hl / 2); g.closePath(); g.fill();
      g.restore();
    }
  };

  // ------------------------------------------------------------------ page tear (rip line), in the current transform
  const RIPS = {};
  PA.rip = (seed, x0, y0, x1, y1) => {
    const key = [seed, x0, y0, x1, y1].join(',');
    if (RIPS[key]) return RIPS[key];
    const R = EP.rng(seed), pts = [], N = 70;
    for (let i = 0; i <= N; i++) { const t = i / N, nx = -(y1 - y0), ny = (x1 - x0), L = Math.hypot(nx, ny), j = (R() - 0.5) * 26 + Math.sin(t * 13 + seed) * 12; pts.push([lerp(x0, x1, t) + nx / L * j, lerp(y0, y1, t) + ny / L * j]); }
    return (RIPS[key] = pts);
  };
  // draw `drawPage` torn into two halves along the rip, pulled apart by pr (0..1)
  PA.tornDraw = (g, drawPage, rip, pr, o = {}) => {
    const big = 6000, dist = (o.dist || 900) * eIO(pr), rot = (o.rot || 0.12) * eIO(pr);
    const half = side => {
      g.save();
      const [ax, ay] = rip[0], [bx, by] = rip[rip.length - 1], mx = (ax + bx) / 2, my = (ay + by) / 2, nx = -(by - ay), ny = bx - ax, L = Math.hypot(nx, ny);
      g.translate(side * nx / L * dist, side * ny / L * dist * 0.3); g.translate(mx, my); g.rotate(side * rot); g.translate(-mx, -my);
      g.beginPath(); g.moveTo(rip[0][0], rip[0][1]); for (const [x, y] of rip) g.lineTo(x, y);
      g.lineTo(bx + side * nx / L * big, by + side * ny / L * big); g.lineTo(ax + side * nx / L * big, ay + side * ny / L * big); g.closePath();
      g.save(); g.clip(); drawPage(g); g.restore();
      // the torn fibrous white edge
      g.strokeStyle = 'rgba(250,246,236,.95)'; g.lineWidth = 9; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(rip[0][0], rip[0][1]); for (const [x, y] of rip) g.lineTo(x + side * 3, y); g.stroke();
      g.restore();
    };
    half(-1); half(1);
  };

  // ------------------------------------------------------------------ cut-paper letters (glyph cards with thickness)
  const GLY = {};
  PA.glyph = (ch, px, fill, o = {}) => {
    const key = ch + px + fill + (o.fam || '');
    if (GLY[key]) return GLY[key];
    const fam = o.fam || EP.F.serif, m = EP.mk(10, 10).getContext('2d'); m.font = EP.font(900, px, fam);
    const tw = Math.max(px * 0.3, m.measureText(ch).width), pad = px * 0.22, w = Math.ceil(tw + pad * 2), h = Math.ceil(px * 1.25 + pad * 2);
    const c = EP.mk(w, h + px * 0.12), g = c.getContext('2d');
    g.font = EP.font(900, px, fam); g.textAlign = 'center'; g.textBaseline = 'middle';
    const cx = w / 2, cy = h / 2;
    // paper thickness: darker copies stepping down
    for (let k = 4; k >= 1; k--) { g.fillStyle = EP.mix(fill, '#000000', 0.35); g.lineWidth = px * 0.12; g.strokeStyle = '#E8E0D0'; g.lineJoin = 'round'; g.strokeText(ch, cx, cy + k * px * 0.025); g.fillText(ch, cx, cy + k * px * 0.025); }
    g.lineWidth = px * 0.12; g.strokeStyle = '#FFFBF2'; g.lineJoin = 'round'; g.strokeText(ch, cx, cy);
    g.fillStyle = fill; g.fillText(ch, cx, cy);
    // paper grain on the letter face
    g.globalCompositeOperation = 'source-atop'; g.globalAlpha = 0.18; g.drawImage(PA.tex('cream'), 0, 0, w, h); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    return (GLY[key] = { c, w, h, adv: tw });
  };
})();
