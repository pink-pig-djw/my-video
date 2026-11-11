// v2/kit.js — reusable pieces for the full MV: clean photo prints (slow Ken Burns drift, entrances, develop, gray and
// sepia), speech bubbles and comic captions, clocks, tally marks, candle and torch flames, red string, hinged covers and
// doors, tiny paper people, paper birds, hot-air balloons, ransom-note letters and text-shaped crowds.
// Everything is a pure function of t; bitmaps are cached.
'use strict';
(function () {
  const { W, H, clamp, lerp, P, eIO, eIOs, eOut, eOut5, eIn, backOut, spring, smooth, hash, noise, mod } = EP;
  const PA = EP.PA, F = EP.F, COL = PA.COL;
  const K = EP.K = {};

  // ------------------------------------------------------------------ photos
  // source rect that covers a w:h window at zoom z (≥ 1) around the focus (fx, fy) in image units
  K.crop = (im, w, h, fx = 0.5, fy = 0.5, z = 1) => {
    const ar = w / h, iar = im.width / im.height;
    let sw, sh; if (iar > ar) { sh = im.height; sw = sh * ar; } else { sw = im.width; sh = sw / ar; }
    sw /= z; sh /= z;
    return [clamp(fx * im.width - sw / 2, 0, im.width - sw), clamp(fy * im.height - sh / 2, 0, im.height - sh), sw, sh];
  };
  // A sharp photo on the page. frame: 'print' | 'polaroid' | 'none'. mode (entrance): 'drop' | 'pop' | 'slide' | 'fade' | 'develop' | 'none'.
  // o: {fx, fy, kb: {z0, z1, x0, x1, y0, y1, d}, out, from, spin, gray, sepia, dark, filter, tape, caption, capCol, devDur}
  K.photo = (g, name, x, y, w, h, rot, t, t0, o = {}) => {
    const im = EP.img[name]; if (!im) return null;
    const mode = o.mode || 'drop', u = t - t0;
    if (u < 0 && mode !== 'none') return null;
    const fr = o.frame || 'print', m = fr === 'none' ? 0 : fr === 'polaroid' ? 24 : 16, mb = fr === 'polaroid' ? 92 : m;
    const fw = w + m * 2, fh = h + m + mb;
    let ox = 0, oy = 0, sc = 1, rr = 0, alpha = 1;
    if (mode === 'drop') { const p = eOut5(P(u, 0, 0.55)); oy = (1 - p) * (o.from ?? 900); rr = (1 - p) * (o.spin ?? 0.35); sc = 1 + 0.05 * Math.sin(Math.PI * P(u, 0, 0.55)); }
    else if (mode === 'pop') { const pp = EP.pop(u); sc = pp.sc; rr = pp.rot; }
    else if (mode === 'slide') { const p = eOut5(P(u, 0, 0.5)); ox = (1 - p) * (o.from ?? -1400); rr = (1 - p) * (o.spin ?? -0.2); }
    else if (mode === 'fade' || mode === 'develop') alpha = P(u, 0, mode === 'fade' ? 0.4 : 0.15);
    if (o.out !== undefined) { const q = eIn(P(t, o.out, o.out + 0.4)); if (q >= 1) return null; oy -= q * (o.outDist ?? 1100); rr += q * 0.3; }
    if (sc <= 0.01 || alpha <= 0) return null;
    g.save(); g.translate(x + ox, y + oy); g.rotate(rot + rr); if (sc !== 1) g.scale(sc, sc); if (alpha < 1) g.globalAlpha *= alpha;
    const top = -fh / 2, ix = -w / 2, iy = top + m;
    if (fr !== 'none') PA.drawCard(g, PA.card('ph' + fr + Math.round(fw) + 'x' + Math.round(fh), fw, fh, { tex: 'white', r: 3, blur: 14, sa: 0.5 }), 0, 0);
    else { g.save(); g.fillStyle = 'rgba(0,0,0,.4)'; g.filter = 'blur(14px)'; g.fillRect(ix + 8, iy + 14, w, h); g.restore(); }
    const kb = o.kb || {}, kp = EP.EASE.sine(P(t, t0, t0 + (kb.d ?? 9)));
    const z = lerp(kb.z0 ?? 1.0, kb.z1 ?? 1.07, kp), fx = lerp(kb.x0 ?? o.fx ?? 0.5, kb.x1 ?? kb.x0 ?? o.fx ?? 0.5, kp), fy = lerp(kb.y0 ?? o.fy ?? 0.5, kb.y1 ?? kb.y0 ?? o.fy ?? 0.5, kp);
    const [sx, sy, sw, sh] = K.crop(im, w, h, fx, fy, z);
    if (o.filter) g.filter = o.filter;
    g.drawImage(im, sx, sy, sw, sh, ix, iy, w, h);
    g.filter = 'none';
    const dev = mode === 'develop' ? 1 - eIOs(P(u, 0.15, 0.15 + (o.devDur ?? 1.2))) : 0;
    const gray = Math.max(o.gray || 0, dev);
    if (gray > 0.001) { g.save(); g.globalCompositeOperation = 'saturation'; g.globalAlpha = gray; g.fillStyle = '#808080'; g.fillRect(ix, iy, w, h); g.restore(); }
    if (o.sepia > 0.001) { g.save(); g.globalCompositeOperation = 'color'; g.globalAlpha = o.sepia; g.fillStyle = '#A0784C'; g.fillRect(ix, iy, w, h); g.globalCompositeOperation = 'multiply'; g.globalAlpha = o.sepia * 0.25; g.fillStyle = '#E8C89A'; g.fillRect(ix, iy, w, h); g.restore(); }
    const dark = Math.max(o.dark || 0, dev > 0 ? Math.pow(dev, 1.3) * 0.95 : 0);
    if (dark > 0.001) { g.fillStyle = `rgba(38,32,40,${dark})`; g.fillRect(ix, iy, w, h); }
    g.strokeStyle = 'rgba(0,0,0,.14)'; g.lineWidth = 1.5; g.strokeRect(ix, iy, w, h);
    if (o.caption && fr === 'polaroid') { const cu = u - (o.capAt ?? 0.6); if (cu > 0) { g.save(); g.beginPath(); g.rect(ix, iy + h + 8, w * eOut(clamp(cu / 0.5)), mb); g.clip(); EP.txt(g, o.caption, 0, iy + h + mb * 0.62, { font: EP.font(700, o.capPx || 46, F.hand), color: o.capCol || '#3A3350' }); g.restore(); } }
    if (o.tape !== false && fr !== 'none' && u > 0.3) { const s = o.tape || 3; PA.tape(g, -fw / 2 + 36, top + 4, 140, -0.6, o.tapeCol, 40, s); PA.tape(g, fw / 2 - 36, top + 4, 140, 0.6, o.tapeCol, 40, s + 1); }
    g.restore();
    return { fw, fh, ix: x + ix, iy: y + iy };
  };
  // a framed photo baked into a canvas (for flips and tears); returns {c, w, h} with the frame centred in c
  const PCV = {};
  K.photoCanvas = (name, w, h, o = {}) => {
    const fr = o.frame || 'print', key = name + w + 'x' + h + fr + (o.fx ?? '') + (o.fy ?? '') + (o.z ?? '') + (o.sepia ?? '');
    if (PCV[key]) return PCV[key];
    const m = fr === 'polaroid' ? 24 : 16, mb = fr === 'polaroid' ? 92 : m, fw = w + m * 2, fh = h + m + mb;
    const card = PA.card('ph' + fr + Math.round(fw) + 'x' + Math.round(fh), fw, fh, { tex: 'white', r: 3, blur: 14, sa: 0.5 });
    const c = EP.mk(card.c.width, card.c.height), g = c.getContext('2d'); g.drawImage(card.c, 0, 0);
    const im = EP.img[name], [sx, sy, sw, sh] = K.crop(im, w, h, o.fx ?? 0.5, o.fy ?? 0.5, o.z ?? 1);
    g.imageSmoothingQuality = 'high'; g.drawImage(im, sx, sy, sw, sh, card.pad + m, card.pad + m, w, h);
    if (o.sepia) { g.globalCompositeOperation = 'color'; g.globalAlpha = o.sepia; g.fillStyle = '#A0784C'; g.fillRect(card.pad + m, card.pad + m, w, h); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; }
    g.strokeStyle = 'rgba(0,0,0,.14)'; g.lineWidth = 1.5; g.strokeRect(card.pad + m, card.pad + m, w, h);
    return (PCV[key] = { c, w: c.width, h: c.height, dy: (mb - m) / 2 });
  };
  // flip one framed photo into another in place (#021), centred at x, y
  K.photoFlip = (g, A, B, pr, x, y, rot = 0) => {
    g.save(); g.translate(x, y); g.rotate(rot);
    if (pr <= 0) g.drawImage(A.c, -A.w / 2, -A.h / 2);
    else if (pr >= 1) g.drawImage(B.c, -B.w / 2, -B.h / 2);
    else PA.flipDraw(g, A.c, B.c, pr, 0, 0, A.w, A.h, { opaque: false, slices: 36, liftK: 1.2 });
    g.restore();
  };
  // where image point (px, py in 0..1 of the source) lands inside a K.photo drawn without entrance/rotation offsets
  K.photoPt = (name, x, y, w, h, t, t0, o, px, py) => {
    const im = EP.img[name], kb = o.kb || {}, kp = EP.EASE.sine(P(t, t0, t0 + (kb.d ?? 9)));
    const z = lerp(kb.z0 ?? 1.0, kb.z1 ?? 1.07, kp), fx = lerp(kb.x0 ?? o.fx ?? 0.5, kb.x1 ?? kb.x0 ?? o.fx ?? 0.5, kp), fy = lerp(kb.y0 ?? o.fy ?? 0.5, kb.y1 ?? kb.y0 ?? o.fy ?? 0.5, kp);
    const [sx, sy, sw, sh] = K.crop(im, w, h, fx, fy, z), fr = o.frame || 'print', m = fr === 'none' ? 0 : fr === 'polaroid' ? 24 : 16, mb = fr === 'polaroid' ? 92 : m, fh = h + m + mb;
    return [x - w / 2 + (px * im.width - sx) / sw * w, y - fh / 2 + m + (py * im.height - sy) / sh * h, w / sw * im.width];
  };

  // One-ink newsprint halftone of an image (used only where it means "newspaper photo"), cached.
  const HT = {};
  K.halftone = (name, w, h, o = {}) => {
    const key = 'ht' + name + w + 'x' + h + (o.fx ?? '') + (o.fy ?? ''); if (HT[key]) return HT[key];
    const im = EP.img[name], cell = o.cell || 6, [cx, cy, cw, ch] = K.crop(im, w, h, o.fx ?? 0.5, o.fy ?? 0.5, o.z || 1);
    const sw = Math.ceil(w / 2), sh = Math.ceil(h / 2), s = EP.mk(sw, sh), sg = s.getContext('2d', { willReadFrequently: true });
    sg.drawImage(im, cx, cy, cw, ch, 0, 0, sw, sh); const data = sg.getImageData(0, 0, sw, sh).data;
    const c = EP.mk(w, h), g = c.getContext('2d'); g.fillStyle = o.paper || '#E6E0D2'; g.fillRect(0, 0, w, h);
    g.fillStyle = o.ink || '#17151C'; g.beginPath();
    const ang = 0.785, ca = Math.cos(ang), sa = Math.sin(ang), D = Math.hypot(w, h) / 2 + cell * 2;
    for (let u = -D; u <= D; u += cell) for (let v = -D; v <= D; v += cell) {
      const x = w / 2 + u * ca - v * sa, y = h / 2 + u * sa + v * ca; if (x < -cell || y < -cell || x > w + cell || y > h + cell) continue;
      const ix = clamp(Math.floor(x / 2), 0, sw - 1), iy = clamp(Math.floor(y / 2), 0, sh - 1), i = (iy * sw + ix) * 4;
      const lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255, val = clamp((1 - lum) * (o.k ?? 1.1) - (o.b ?? 0.05));
      if (val < 0.03) continue; const r = cell * 0.64 * Math.sqrt(val); g.moveTo(x + r, y); g.arc(x, y, r, 0, 6.2832);
    }
    g.fill(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.35; PA.tile(g, 'cream', 0, 0, w, h);
    return (HT[key] = c);
  };

  // ------------------------------------------------------------------ hinged covers and doors
  // Draw canvas A (front) turning about a vertical hinge at its left edge (hx, hy = hinge middle) to show B (back) on the
  // other side. pr 0 → closed, 1 → fully open (lying flat to the left). The far edge grows as it lifts toward the lens.
  K.hinge = (g, A, B, pr, hx, hy, w, h, o = {}) => {
    const th = Math.PI * (o.ease ? o.ease(clamp(pr)) : eIO(clamp(pr))), c = Math.cos(th), s = Math.sin(th);
    const img = c >= 0 ? A : B, ww = w * Math.abs(c), N = o.slices || 32;
    if (ww < 1) return;
    const per = (o.per ?? 0.28) * s, iw = img.width, ih = img.height;
    g.save();
    for (let k = 0; k < N; k++) {
      // front: slices run right from the hinge; back (as the viewer sees it once open): slices run from the far left to
      // the hinge. In both cases the edge farthest from the hinge is closest to the lens, so it is drawn taller.
      const f = c >= 0 ? (k + 0.5) / N : 1 - (k + 0.5) / N, hh = h * (1 + per * f);
      const dx = c >= 0 ? hx + k / N * ww : hx - ww + k / N * ww;
      g.drawImage(img, iw * k / N, 0, iw / N + 0.5, ih, dx, hy - hh / 2, ww / N + 0.8, hh);
    }
    if (s > 0.02) {   // shade the turning sheet
      const x0 = c >= 0 ? hx : hx - ww, x1 = c >= 0 ? hx + ww : hx, hl = c >= 0 ? h : h * (1 + per), hr = c >= 0 ? h * (1 + per) : h;
      g.fillStyle = `rgba(10,8,20,${(o.shade ?? 0.38) * s})`; g.beginPath(); g.moveTo(x0, hy - hl / 2); g.lineTo(x1, hy - hr / 2); g.lineTo(x1, hy + hr / 2); g.lineTo(x0, hy + hl / 2); g.closePath(); g.fill();
    }
    g.restore();
  };

  // ------------------------------------------------------------------ speech bubbles, comic captions
  function bubblePath(g, w, h, tx, ty, r = 28, tw = 34) {
    // rounded box centred at 0,0 with a tail whose base sits on the edge facing (tx, ty)
    const x0 = -w / 2, y0 = -h / 2, side = Math.abs(ty) / h > Math.abs(tx) / w ? (ty > 0 ? 'b' : 't') : (tx > 0 ? 'r' : 'l');
    g.beginPath(); g.moveTo(x0 + r, y0);
    if (side === 't') { const bx = clamp(tx, x0 + r + tw, -x0 - r - tw); g.lineTo(bx - tw, y0); g.lineTo(tx, ty); g.lineTo(bx + tw * 0.2, y0); }
    g.lineTo(-x0 - r, y0); g.quadraticCurveTo(-x0, y0, -x0, y0 + r);
    if (side === 'r') { const by = clamp(ty, y0 + r + tw, -y0 - r - tw); g.lineTo(-x0, by - tw); g.lineTo(tx, ty); g.lineTo(-x0, by + tw * 0.2); }
    g.lineTo(-x0, -y0 - r); g.quadraticCurveTo(-x0, -y0, -x0 - r, -y0);
    if (side === 'b') { const bx = clamp(tx, x0 + r + tw, -x0 - r - tw); g.lineTo(bx + tw, -y0); g.lineTo(tx, ty); g.lineTo(bx - tw * 0.2, -y0); }
    g.lineTo(x0 + r, -y0); g.quadraticCurveTo(x0, -y0, x0, -y0 - r);
    if (side === 'l') { const by = clamp(ty, y0 + r + tw, -y0 - r - tw); g.lineTo(x0, by + tw); g.lineTo(tx, ty); g.lineTo(x0, by - tw * 0.2); }
    g.lineTo(x0, y0 + r); g.quadraticCurveTo(x0, y0, x0 + r, y0); g.closePath();
  }
  // o: {text, font, col, fill, stroke, lw, typed (char time), rot, outAt, align, lines: [...]}
  K.bubble = (g, x, y, w, h, tx, ty, t, t0, o = {}) => {
    const u = t - t0; if (u < 0) return;
    const pp = EP.pop(u, o.outAt ?? Infinity); if (pp.sc <= 0.01) return;
    g.save(); g.translate(x, y); g.rotate((o.rot || 0) + pp.rot * 0.25); g.scale(pp.sc, pp.sc);
    g.save(); g.translate(8, 10); bubblePath(g, w, h, tx - x - 8, ty - y - 10, o.r, o.tw); g.fillStyle = 'rgba(0,0,0,.28)'; g.fill(); g.restore();
    bubblePath(g, w, h, tx - x, ty - y, o.r, o.tw); g.fillStyle = o.fill || '#FFFDF6'; g.fill();
    g.lineJoin = 'round'; g.lineWidth = o.lw ?? 5; g.strokeStyle = o.stroke || '#272238'; g.stroke();
    const lines = o.lines || (o.text ? [o.text] : []);
    if (lines.length) {
      const font = o.font || EP.font(700, 52, F.hand), lh = o.lh || parseFloat(font.match(/(\d+)px/)[1]) * 1.15;
      g.font = font; g.fillStyle = o.col || '#272238'; g.textAlign = 'center'; g.textBaseline = 'middle';
      let shown = Infinity; if (o.typed) shown = Math.floor(Math.max(0, u - 0.12) / o.typed);
      let used = 0;
      lines.forEach((ln, i) => { const s = [...ln].slice(0, Math.max(0, shown - used)).join(''); used += [...ln].length; g.fillText(s, (o.dx || 0), (i - (lines.length - 1) / 2) * lh + (o.dy || 0)); });
    }
    g.restore();
  };
  // comic caption box (yellow, inked border) that wipes open left → right
  K.caption = (g, x, y, w, h, t, t0, o = {}) => {
    const p = eOut5(P(t, t0, t0 + 0.3)); if (p <= 0) return;
    g.save(); g.translate(x, y); if (o.rot) g.rotate(o.rot);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(8, 10, w * p, h);
    g.fillStyle = o.fill || '#FFE680'; g.fillRect(0, 0, w * p, h);
    g.lineWidth = 5; g.strokeStyle = '#1E1B26'; g.strokeRect(0, 0, w * p, h);
    g.restore();
  };

  // ------------------------------------------------------------------ clocks, tally marks
  // analog clock; mins = minutes after twelve o'clock (fractions ok); o: {face, ink, hand, pr (draw-on 0..1), num}
  K.clock = (g, x, y, r, mins, o = {}) => {
    const pr = o.pr ?? 1; if (pr <= 0) return;
    g.save(); g.translate(x, y); g.scale(eOut(pr), eOut(pr));
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(8, 12, r * 1.04, 0, 7); g.fill();
    g.fillStyle = o.face || '#FBF4E6'; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
    g.lineWidth = r * 0.06; g.strokeStyle = o.ink || '#2A2440'; g.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * EP.TAU; g.lineWidth = i % 3 ? r * 0.02 : r * 0.04; g.beginPath(); g.moveTo(Math.sin(a) * r * 0.78, -Math.cos(a) * r * 0.78); g.lineTo(Math.sin(a) * r * 0.9, -Math.cos(a) * r * 0.9); g.stroke(); }
    if (o.num) { g.font = EP.font(800, r * 0.16, F.serif); g.fillStyle = o.ink || '#2A2440'; g.textAlign = 'center'; g.textBaseline = 'middle'; for (let i = 1; i <= 12; i++) { const a = i / 12 * EP.TAU; g.fillText(String(i), Math.sin(a) * r * 0.64, -Math.cos(a) * r * 0.64); } }
    const ha = mins / 720 * EP.TAU, ma = mins / 60 * EP.TAU;
    g.lineCap = 'round'; g.strokeStyle = o.hand || '#2A2440';
    g.lineWidth = r * 0.07; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(ha) * r * 0.5, -Math.cos(ha) * r * 0.5); g.stroke();
    g.lineWidth = r * 0.045; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(ma) * r * 0.74, -Math.cos(ma) * r * 0.74); g.stroke();
    g.fillStyle = o.accent || '#D23A2C'; g.beginPath(); g.arc(0, 0, r * 0.06, 0, 7); g.fill();
    g.restore();
  };
  // tally marks (groups of five), n strokes, drawn progressively over strokes (pr = number of strokes shown, fractional)
  K.tally = (g, x, y, n, shown, o = {}) => {
    const sp = o.sp || 26, gh = o.h || 110, col = o.col || '#2A2440', w = o.w || 8;
    for (let i = 0; i < n; i++) {
      const f = clamp(shown - i); if (f <= 0) break;
      const grp = Math.floor(i / 5), k = i % 5, gx = x + grp * (sp * 4 + 46);
      let pts;
      if (k < 4) pts = [[gx + k * sp, y], [gx + k * sp + 4, y + gh * 0.5], [gx + k * sp + 1, y + gh]];
      else pts = [[gx - 14, y + gh * 0.8], [gx + sp * 1.5, y + gh * 0.55], [gx + sp * 3 + 16, y + gh * 0.22]];
      PA.ink(g, PA.hand(pts, 2, 300 + i), 0, eIO(f), { col, w });
    }
  };

  // ------------------------------------------------------------------ flames, candles
  K.flame = (g, x, y, s, t, seed = 0, a = 1, glow = 1) => {
    const fl = 0.86 + 0.14 * noise(t * 9 + seed * 1.7, seed) + 0.06 * Math.sin(t * 23 + seed), sway = noise(t * 3.1 + seed * 3, seed + 7);
    g.save(); g.translate(x, y); g.globalAlpha *= a;
    if (glow > 0) { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha *= 0.75 * glow; EP.glowDot(g, 0, -s * 0.8, s * 6.5 * fl, 'rgba(255,205,120,.75)', 'rgba(255,140,50,.22)'); g.restore(); }
    g.rotate(sway * 0.22); g.scale(1, fl);
    const tear = (k) => { g.beginPath(); g.moveTo(0, -s * 2.0 * k); g.bezierCurveTo(s * 0.75 * k, -s * 0.9 * k, s * 0.62 * k, 0, 0, s * 0.18); g.bezierCurveTo(-s * 0.62 * k, 0, -s * 0.75 * k, -s * 0.9 * k, 0, -s * 2.0 * k); g.closePath(); };
    const gr = g.createLinearGradient(0, -s * 2, 0, s * 0.2); gr.addColorStop(0, 'rgba(255,120,40,0.9)'); gr.addColorStop(0.6, '#FF9E3A'); gr.addColorStop(1, '#FFD27A');
    tear(1); g.fillStyle = gr; g.fill();
    tear(0.55); g.fillStyle = '#FFF4C8'; g.fill();
    g.restore();
  };
  K.candle = (g, x, y, h, w, col, lit, t, seed = 0, o = {}) => {
    g.save(); g.translate(x, y);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-w / 2 + 4, -h + 6, w, h);
    g.fillStyle = col; g.fillRect(-w / 2, -h, w, h);
    g.fillStyle = 'rgba(255,255,255,.35)'; for (let k = 0; k < h; k += w * 1.4) { g.save(); g.beginPath(); g.rect(-w / 2, -h, w, h); g.clip(); g.translate(0, -h + k); g.rotate(-0.6); g.fillRect(-w, 0, w * 3, w * 0.35); g.restore(); }
    g.strokeStyle = '#3A2A20'; g.lineWidth = Math.max(2, w * 0.12); g.beginPath(); g.moveTo(0, -h); g.lineTo(0, -h - w * 0.5); g.stroke();
    g.restore();
    if (lit > 0) K.flame(g, x, y - h - w * 0.45, w * 0.6, t, seed, lit, o.glow ?? 1);
  };

  // ------------------------------------------------------------------ lines: string (with sag), generic progressive polyline
  K.line = (g, pts, f0, f1, o = {}) => {
    if (f1 <= f0 || pts.length < 2) return;
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    PA.ink(g, { p: pts, c: cum }, f0, f1, o);
  };
  K.sagPts = (x0, y0, x1, y1, sag, n = 24) => { const out = []; for (let i = 0; i <= n; i++) { const f = i / n; out.push([lerp(x0, x1, f), lerp(y0, y1, f) + sag * 4 * f * (1 - f)]); } return out; };

  // ------------------------------------------------------------------ paper people, birds, balloons
  const PCOLS = ['#F07A2E', '#2F8F8A', '#D23A2C', '#2B3990', '#E8A62A', '#C2357A', '#5BB585', '#8E6CC8', '#59A7E8'];
  K.pcol = i => PCOLS[i % PCOLS.length];
  // a tiny cut-paper person standing at (x, y = feet), height ≈ 40·s; pose: 0 stand, 1 wave, 2 cheer, 3 run (with t)
  K.person = (g, x, y, s, col, t, seed = 0, pose = 0) => {
    const bob = pose === 3 ? Math.abs(Math.sin(t * 14 + seed)) * 4 * s : pose ? Math.abs(Math.sin(t * 8 + seed)) * 2.5 * s : 0;
    g.save(); g.translate(x, y - bob);
    const skin = ['#F2C9A8', '#D9A47E', '#A8704C', '#7A4E34', '#F5D7BE'][seed % 5];
    g.lineCap = 'round'; g.lineJoin = 'round';
    // white paper outline first
    g.strokeStyle = '#FFFBF2'; g.lineWidth = 6 * s;
    const draw = (fill) => {
      g.beginPath(); g.roundRect(-6 * s, -30 * s, 12 * s, 20 * s, 5 * s); fill ? (g.fillStyle = col, g.fill()) : g.stroke();
      g.beginPath(); g.arc(0, -37 * s, 6.2 * s, 0, 7); fill ? (g.fillStyle = skin, g.fill()) : g.stroke();
    };
    draw(false);
    // legs and arms
    const a = pose === 3 ? Math.sin(t * 14 + seed) : 0;
    g.strokeStyle = '#3A3350'; g.lineWidth = 3.4 * s;
    g.beginPath(); g.moveTo(-3 * s, -11 * s); g.lineTo(-4 * s - a * 5 * s, 0); g.moveTo(3 * s, -11 * s); g.lineTo(4 * s + a * 5 * s, 0); g.stroke();
    g.strokeStyle = col; g.lineWidth = 3.6 * s; g.beginPath();
    if (pose === 1) { const w = Math.sin(t * 10 + seed) * 4 * s; g.moveTo(-5 * s, -26 * s); g.lineTo(-11 * s, -14 * s); g.moveTo(5 * s, -26 * s); g.lineTo(12 * s + w, -40 * s); }
    else if (pose === 2) { g.moveTo(-5 * s, -26 * s); g.lineTo(-12 * s, -42 * s); g.moveTo(5 * s, -26 * s); g.lineTo(12 * s, -42 * s); }
    else { g.moveTo(-5 * s, -26 * s); g.lineTo(-9 * s - a * 6 * s, -13 * s); g.moveTo(5 * s, -26 * s); g.lineTo(9 * s + a * 6 * s, -13 * s); }
    g.stroke();
    draw(true);
    g.restore();
  };
  // paper bird (two folded wings), flapping
  K.bird = (g, x, y, s, t, seed = 0, col = '#FFF6E8') => {
    const fl = Math.sin(t * 13 + seed * 2.3);
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(6, 30, 18, 4, 0, 0, 7); g.fill();
    g.fillStyle = EP.mix(col, '#000000', 0.18); g.beginPath(); g.moveTo(-4, 0); g.lineTo(-30, -26 * fl - 4); g.lineTo(6, -2); g.closePath(); g.fill();
    g.fillStyle = col; g.beginPath(); g.moveTo(-22, 2); g.lineTo(26, -4); g.lineTo(34, -10); g.lineTo(18, 6); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(-2, 0); g.lineTo(-24, -30 * fl); g.lineTo(10, -2); g.closePath(); g.fill();
    g.restore();
  };
  // hot-air balloon made of paper gores; cols = gore colours
  K.balloon = (g, x, y, s, t, cols = ['#F07A2E', '#FFF6E8'], seed = 0) => {
    const sw = Math.sin(t * 1.1 + seed) * 0.04;
    g.save(); g.translate(x, y); g.rotate(sw); g.scale(s, s);
    const env = () => { g.beginPath(); g.moveTo(0, 70); g.bezierCurveTo(-62, 30, -92, -40, -70, -86); g.bezierCurveTo(-46, -138, 46, -138, 70, -86); g.bezierCurveTo(92, -40, 62, 30, 0, 70); g.closePath(); };
    g.fillStyle = 'rgba(0,0,0,.18)'; g.save(); g.translate(8, 10); env(); g.fill(); g.restore();
    g.save(); env(); g.clip();
    const n = 6; for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; g.beginPath(); g.ellipse(0, -30, 100 * (1 - i / n) + 4, 120, 0, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(-30, -70, 16, 34, -0.4, 0, 7); g.fill();
    g.restore();
    env(); g.lineWidth = 3; g.strokeStyle = 'rgba(60,40,30,.35)'; g.stroke();
    g.strokeStyle = '#5A3B2E'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(-18, 66); g.lineTo(-12, 96); g.moveTo(18, 66); g.lineTo(12, 96); g.stroke();
    g.fillStyle = '#8A5A3A'; g.fillRect(-16, 94, 32, 22); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(-16, 94, 32, 5);
    g.restore();
  };

  // ------------------------------------------------------------------ ransom-note letters
  const RCACHE = {};
  const RFONTS = [[900, F.serif], [900, F.ui], [400, F.type], [400, F.villain], [700, F.hand], [780, F.serif]];
  const RPAPER = [['#FBF6EA', '#1E1B26'], ['#1E1B26', '#FBF6EA'], ['#D23A2C', '#FFF6E8'], ['#F4CE72', '#1E1B26'], ['#E9DCC4', '#2B3990'], ['#FFFFFF', '#D23A2C']];
  K.ransomGlyph = (ch, px, k) => {
    const key = ch + px + '|' + k; if (RCACHE[key]) return RCACHE[key];
    const [fw, fam] = RFONTS[k % RFONTS.length], [bg, fg] = RPAPER[(k * 7 + 3) % RPAPER.length], m = EP.mk(8, 8).getContext('2d');
    const size = px * (0.85 + hash(k, 41) * 0.35); m.font = EP.font(fw, size, fam); const tw = m.measureText(ch).width;
    const w = Math.ceil(tw + px * 0.36), h = Math.ceil(px * 1.3), c = EP.mk(w + 12, h + 12), g = c.getContext('2d'), R = EP.rng(k * 13 + 5);
    g.translate(6, 6); g.fillStyle = bg; g.beginPath(); g.moveTo(R() * 6, R() * 6); g.lineTo(w - R() * 6, R() * 5); g.lineTo(w - R() * 5, h - R() * 6); g.lineTo(R() * 6, h - R() * 5); g.closePath(); g.fill();
    g.globalAlpha = 0.25; g.drawImage(PA.tex('cream'), 0, 0, w, h); g.globalAlpha = 1;
    g.font = EP.font(fw, size, fam); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, w / 2, h / 2 + px * 0.04);
    return (RCACHE[key] = { c, w: w + 12, h: h + 12, adv: w + px * 0.06 });
  };
  // ransom-note word: letters slam in one by one (#008 slam timing, per letter 0.05 s apart); returns width
  K.ransom = (g, text, x, y, px, t, t0, o = {}) => {
    const chars = [...text]; let xx = x, k0 = o.seed || 0;
    const tot = chars.reduce((s, ch, k) => s + (ch === ' ' ? px * 0.4 : K.ransomGlyph(ch, px, k + k0).adv), 0);
    if (o.align === 'c') xx -= tot / 2;
    chars.forEach((ch, k) => {
      if (ch === ' ') { xx += px * 0.4; return; }
      const G = K.ransomGlyph(ch, px, k + k0), lu = t - (t0 + k * (o.dt ?? 0.05));
      if (lu >= 0.02) {
        const hit = 0.14, tt = lu - hit, sc = tt < 0 ? lerp(2.6, 1, eIn(P(lu, 0.02, hit))) : 1, sy = tt > 0 ? 1 - 0.18 * Math.exp(-12 * tt) : 1;
        g.save(); g.translate(xx + G.w / 2, y); g.rotate((hash(k + k0, 77) - 0.5) * 0.3); g.scale(sc * (2 - sy), sc * sy); g.globalAlpha *= P(lu, 0.02, 0.08);
        g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-G.w / 2 + 5, -G.h / 2 + 7, G.w - 6, G.h - 6);
        g.drawImage(G.c, -G.w / 2, -G.h / 2); g.restore();
      }
      xx += G.adv;
    });
    return tot;
  };

  // ------------------------------------------------------------------ text-shaped point clouds (crowds that spell words)
  const TP = {};
  K.textPoints = (text, px, fam, step, seed = 1) => {
    const key = text + px + fam + step; if (TP[key]) return TP[key];
    const m = EP.mk(10, 10).getContext('2d'); m.font = EP.font(900, px, fam); const tw = Math.ceil(m.measureText(text).width) + 40, th = Math.ceil(px * 1.3);
    const c = EP.mk(tw, th), g = c.getContext('2d', { willReadFrequently: true }); g.font = EP.font(900, px, fam); g.textBaseline = 'middle'; g.fillStyle = '#000'; g.fillText(text, 20, th / 2);
    const d = g.getImageData(0, 0, tw, th).data, R = EP.rng(seed), pts = [];
    for (let y = 0; y < th; y += step) for (let x = 0; x < tw; x += step) { const jx = x + (R() - 0.5) * step * 0.6, jy = y + (R() - 0.5) * step * 0.6, ix = clamp(Math.round(jx), 0, tw - 1), iy = clamp(Math.round(jy), 0, th - 1); if (d[(iy * tw + ix) * 4 + 3] > 128) pts.push([jx - tw / 2, jy - th / 2, R()]); }
    return (TP[key] = pts);
  };

  // ------------------------------------------------------------------ objects
  // closed book seen from the front: o: {col, title, sub, robot, spine, glow}
  K.book = (g, x, y, w, h, rot, o = {}) => {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-w / 2 + 6, -h / 2 + 9, w, h);
    g.fillStyle = o.col || '#2A2440'; g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 4); g.fill();
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-w / 2, -h / 2, w * 0.09, h);
    g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(-w / 2 + w * 0.09, -h / 2, w * 0.02, h);
    if (o.robot) {   // a red-eyed robot face, the cliché cover
      const rx = w * 0.05, ry = -h * 0.06, rw = w * 0.5, rh = h * 0.34;
      g.fillStyle = '#5A6070'; g.beginPath(); g.roundRect(rx - rw / 2, ry - rh / 2, rw, rh, rw * 0.12); g.fill();
      g.fillStyle = '#1A1820'; g.fillRect(rx - rw * 0.36, ry - rh * 0.16, rw * 0.72, rh * 0.32);
      g.save(); g.globalCompositeOperation = 'lighter'; EP.glowDot(g, rx - rw * 0.18, ry, rw * 0.22, 'rgba(255,60,40,1)', 'rgba(255,40,30,.4)'); EP.glowDot(g, rx + rw * 0.18, ry, rw * 0.22, 'rgba(255,60,40,1)', 'rgba(255,40,30,.4)'); g.restore();
    }
    if (o.title) EP.txt(g, o.title, w * 0.05, h * 0.3, { font: EP.font(900, Math.min(w * 0.16, (w * 0.82) / Math.max(4, o.title.length) * 1.7), o.fam || F.ui), color: o.ink || '#F4EADB', ls: '2px' });
    if (o.sub) EP.txt(g, o.sub, w * 0.05, h * 0.42, { font: EP.font(700, w * 0.065, F.ui), color: o.subCol || 'rgba(244,234,219,.7)' });
    if (o.glow) { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha *= o.glow; EP.glowDot(g, 0, 0, Math.max(w, h) * 1.1, 'rgba(255,220,140,.9)', 'rgba(255,170,80,.3)'); g.restore(); }
    g.restore();
  };
  // laptop seen from the front-ish: open 0..1 (lid angle), glow = screen light
  K.laptop = (g, x, y, w, open, glow = 1, o = {}) => {
    const h = w * 0.62 * open;
    g.save(); g.translate(x, y);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(10, w * 0.1, w * 0.62, w * 0.07, 0, 0, 7); g.fill();
    g.fillStyle = '#B8BCC8'; g.beginPath(); g.moveTo(-w * 0.56, w * 0.08); g.lineTo(w * 0.56, w * 0.08); g.lineTo(w * 0.5, 0); g.lineTo(-w * 0.5, 0); g.closePath(); g.fill();
    if (h > 2) {
      g.fillStyle = '#8A8F9C'; g.beginPath(); g.roundRect(-w / 2, -h, w, h, 10); g.fill();
      g.fillStyle = o.screen || '#9FC7FF'; g.fillRect(-w / 2 + w * 0.04, -h + w * 0.035, w * 0.92, h - w * 0.07);
      if (glow > 0) { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha *= glow * 0.6; EP.glowDot(g, 0, -h * 0.5, w * 1.2, 'rgba(150,200,255,.8)', 'rgba(110,160,255,.25)'); g.restore(); }
    }
    g.restore();
  };
  // a big toggle switch on a plate; on 0..1
  K.toggle = (g, x, y, s, on, o = {}) => {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.roundRect(-70 + 8, -110 + 12, 140, 220, 22); g.fill();
    const gr = g.createLinearGradient(-70, -110, 70, 110); gr.addColorStop(0, '#E8E2D6'); gr.addColorStop(1, '#B8B0A0'); g.fillStyle = gr; g.beginPath(); g.roundRect(-70, -110, 140, 220, 22); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 3; g.stroke();
    [[0, -88], [0, 88]].forEach(([a, b]) => { g.fillStyle = '#8A8070'; g.beginPath(); g.arc(a, b, 7, 0, 7); g.fill(); });
    g.fillStyle = '#2A2440'; g.beginPath(); g.roundRect(-22, -40, 44, 80, 20); g.fill();
    const ang = lerp(0.55, -0.55, on);
    g.save(); g.rotate(ang); const lg = g.createLinearGradient(-14, 0, 14, 0); lg.addColorStop(0, '#F07A2E'); lg.addColorStop(1, '#C8561C'); g.fillStyle = lg; g.beginPath(); g.roundRect(-14, -96, 28, 96, 14); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-8, -88, 6, 70); g.restore();
    g.restore();
  };
  // a little gold trophy
  K.trophy = (g, x, y, s) => {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(8, 112, 90, 14, 0, 0, 7); g.fill();
    const gr = g.createLinearGradient(-80, 0, 80, 0); gr.addColorStop(0, '#C8901E'); gr.addColorStop(0.45, '#FFE08A'); gr.addColorStop(1, '#B07A14'); g.fillStyle = gr;
    g.beginPath(); g.moveTo(-70, -100); g.lineTo(70, -100); g.bezierCurveTo(70, -10, 30, 20, 12, 30); g.lineTo(12, 70); g.lineTo(46, 70); g.lineTo(46, 100); g.lineTo(-46, 100); g.lineTo(-46, 70); g.lineTo(-12, 70); g.lineTo(-12, 30); g.bezierCurveTo(-30, 20, -70, -10, -70, -100); g.closePath(); g.fill();
    g.lineWidth = 12; g.strokeStyle = '#D9A63A'; g.beginPath(); g.arc(-74, -56, 30, Math.PI * 0.5, Math.PI * 1.5); g.stroke(); g.beginPath(); g.arc(74, -56, 30, -Math.PI * 0.5, Math.PI * 0.5); g.stroke();
    g.fillStyle = '#1E1B26'; g.fillRect(-36, 78, 72, 14);
    g.restore();
  };
  // an envelope, closed (flap 0) or open (flap 1)
  K.envelope = (g, x, y, w, rot, flap = 0, col = '#FBF6EA') => {
    const h = w * 0.62;
    g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-w / 2 + 6, -h / 2 + 9, w, h);
    g.fillStyle = col; g.fillRect(-w / 2, -h / 2, w, h);
    g.strokeStyle = 'rgba(90,80,70,.45)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-w / 2, h / 2); g.lineTo(0, 0); g.lineTo(w / 2, h / 2); g.stroke();
    g.fillStyle = EP.mix(col, '#000000', 0.07); g.beginPath(); g.moveTo(-w / 2, -h / 2); g.lineTo(0, -h / 2 + h * 0.62 * (1 - 2 * flap)); g.lineTo(w / 2, -h / 2); g.closePath(); g.fill(); g.stroke();
    g.restore();
  };
  // googly eye (white with a pupil that rolls by angle a)
  K.eye = (g, x, y, r, a, roll = 0) => {
    g.save(); g.translate(x, y);
    g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.lineWidth = r * 0.12; g.strokeStyle = '#1E1B26'; g.stroke();
    const pr = r * 0.48, d = r - pr - r * 0.1; g.fillStyle = '#1E1B26'; g.beginPath(); g.arc(Math.cos(a) * d * roll, Math.sin(a) * d * roll, pr, 0, 7); g.fill();
    g.restore();
  };

  // ------------------------------------------------------------------ calligram: a sticker silhouette written out of words
  const CAL = {};
  K.calligram = (name, h, words, o = {}) => {
    const key = name + h + (o.col || ''); if (CAL[key]) return CAL[key];
    const im = EP.img['cut/' + name], s = h / im.height, w = Math.round(im.width * s);
    const c = EP.mk(w, h), g = c.getContext('2d'), R = EP.rng(4321);
    const rows = []; let y = 14;
    while (y < h) { const px = (o.px0 || 22) + R() * (o.pxr || 16); rows.push([y, px]); y += px * 1.04; }
    g.textBaseline = 'alphabetic';
    const fams = [F.hand, F.serif, F.type, F.ui, F.zh];
    let wi = 0;
    for (const [yy, px] of rows) { let x = -R() * 60; while (x < w) { const wd = words[wi++ % words.length], fam = /[^\x00-\x7F]/.test(wd) ? F.zh : fams[wi % 4]; g.font = EP.font(fam === F.hand ? 700 : 600, px, fam); g.fillStyle = (o.cols || ['#D23A2C', '#F07A2E', '#2B3990', '#2F8F8A', '#C2357A', '#5A3B2E'])[wi % 6]; g.fillText(wd, x, yy); x += g.measureText(wd).width + px * 0.45; } }
    g.globalCompositeOperation = 'destination-in'; g.drawImage(im, 0, 0, w, h);
    return (CAL[key] = c);
  };
})();
