// v2/print.js — painted keyframes as clean prints and instant photos; the character as die-cut paper
// stickers. All bitmaps are built once and cached; animation only moves/reveals them.
'use strict';
(function () {
  const { clamp, lerp, P, eIO, eIOs, eOut, eOut5, eIn, backOut, spring, smooth, hash } = EP;
  const PA = EP.PA;
  const RISO = EP.RISO = {};
  const CACHE = {};

  function cropBox(im, w, h, o) {
    if (o.crop) return [o.crop.x * im.width, o.crop.y * im.height, o.crop.w * im.width, o.crop.h * im.height];
    const ar = w / h, iar = im.width / im.height;
    if (iar > ar) { const ch = im.height, cw = ch * ar; return [(im.width - cw) * (o.fx ?? 0.5), 0, cw, ch]; }
    const cw = im.width, ch = cw / ar; return [0, (im.height - ch) * (o.fy ?? 0.5), cw, ch];
  }
  // A clean full-colour print on white stock with a thin margin. The keyframes are kept sharp: no halftone or
  // re-inking (that blurred them); only a faint paper grain so they sit on the page instead of floating over it.
  RISO.print = (name, w, h, o = {}) => {
    const key = ['p', name, w, h, o.fx, o.fy, o.crop && JSON.stringify(o.crop)].join('|');
    if (CACHE[key]) return CACHE[key];
    const im = EP.img[name], m = o.margin ?? 18;
    const [cx, cy, cw, ch] = cropBox(im, w, h, o);
    const c = EP.mk(w + m * 2, h + m * 2), g = c.getContext('2d');
    PA.tile(g, 'white', 0, 0, c.width, c.height);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(im, cx, cy, cw, ch, m, m, w, h);
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.1; PA.tile(g, 'cream', m, m, w, h);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 1.5; g.strokeRect(m, m, w, h);
    return (CACHE[key] = { c, w: c.width, h: c.height });
  };
  // Full-colour instant photo with a white frame (wider at the bottom).
  RISO.photo = (name, w, h, o = {}) => {
    const key = ['f', name, w, h, o.fx, o.fy, o.crop && JSON.stringify(o.crop)].join('|');
    if (CACHE[key]) return CACHE[key];
    const im = EP.img[name], m = 26, mb = 96, c = EP.mk(w + m * 2, h + m + mb), g = c.getContext('2d');
    PA.tile(g, 'white', 0, 0, c.width, c.height); g.imageSmoothingQuality = 'high';
    const [cx, cy, cw, ch] = cropBox(im, w, h, o);
    g.drawImage(im, cx, cy, cw, ch, m, m, w, h);
    g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(255,236,210,.22)'; g.fillRect(m, m, w, h);
    g.globalCompositeOperation = 'source-over';
    const vg = g.createRadialGradient(m + w / 2, m + h / 2, Math.min(w, h) * 0.3, m + w / 2, m + h / 2, Math.hypot(w, h) * 0.62); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(30,15,0,.35)'); g.fillStyle = vg; g.fillRect(m, m, w, h);
    return (CACHE[key] = { c, w: c.width, h: c.height, m, mb, iw: w, ih: h });
  };
  // Draw a print/photo centred at (x, y). reveal: {mode:'roller'|'develop'|'drop', p}
  RISO.draw = (g, pr, x, y, rot = 0, o = {}) => {
    const p = o.p ?? 1, mode = o.mode || 'roller';
    if (p <= 0 && mode !== 'develop') return;
    g.save(); g.translate(x, y); g.rotate(rot); if (o.sc) g.scale(o.sc, o.sc);
    const w = pr.w, h = pr.h, x0 = -w / 2, y0 = -h / 2;
    // contact shadow
    g.save(); g.fillStyle = 'rgba(0,0,0,.42)'; g.filter = 'blur(14px)'; g.fillRect(x0 + 8, y0 + 14, w, h); g.restore();
    if (mode === 'roller') {
      const ww = w * eOut(clamp(p));
      g.save(); g.beginPath(); g.rect(x0, y0, ww, h); g.clip(); g.drawImage(pr.c, x0, y0); g.restore();
      if (p < 1) { g.fillStyle = 'rgba(255,250,235,.95)'; g.fillRect(x0 + ww - 3, y0 - 6, 6, h + 12); }
    } else if (mode === 'develop') {
      g.drawImage(pr.c, x0, y0);
      const d = 1 - eIOs(clamp(p));
      if (d > 0.001 && pr.iw) {
        const ix = x0 + pr.m, iy = y0 + pr.m;
        g.save(); g.globalCompositeOperation = 'saturation'; g.globalAlpha = d; g.fillStyle = '#808080'; g.fillRect(ix, iy, pr.iw, pr.ih); g.restore();
        g.fillStyle = `rgba(38,32,40,${Math.pow(d, 1.3) * 0.95})`; g.fillRect(ix, iy, pr.iw, pr.ih);
      }
    } else g.drawImage(pr.c, x0, y0);
    g.restore();
  };

  // ------------------------------------------------------------------ die-cut stickers of the character
  const STK = EP.STK = {};
  const SCACHE = {};
  STK.get = (name, h) => {
    const hq = clamp(Math.round(h / 100) * 100, 200, 1600), key = name + '|' + hq;
    if (SCACHE[key]) return SCACHE[key];
    const im = EP.img['cut/' + name], s = hq / im.height, w = Math.round(im.width * s), r = Math.max(5, hq * 0.013), pad = Math.ceil(r * 2 + 6);
    const c = EP.mk(w + pad * 2, hq + pad * 2), g = c.getContext('2d');
    const sil = EP.tinted(name, '#FFFDF7');
    for (let k = 0; k < 20; k++) { const a = k / 20 * EP.TAU; g.drawImage(sil, pad + Math.cos(a) * r, pad + Math.sin(a) * r, w, hq); }
    for (let k = 0; k < 10; k++) { const a = k / 10 * EP.TAU; g.drawImage(sil, pad + Math.cos(a) * r * 0.5, pad + Math.sin(a) * r * 0.5, w, hq); }
    g.globalCompositeOperation = 'source-atop'; g.globalAlpha = 0.25; PA.tile(g, 'cream', 0, 0, c.width, c.height); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.drawImage(im, pad, pad, w, hq);
    // drop-shadow silhouette (blurred), built once
    const sc = EP.mk(c.width + 80, c.height + 80), sg = sc.getContext('2d');
    sg.filter = `blur(${Math.max(6, hq * 0.012)}px)`; sg.drawImage(c, 40, 40); sg.filter = 'none';
    sg.globalCompositeOperation = 'source-in'; sg.fillStyle = 'rgba(12,8,20,1)'; sg.fillRect(0, 0, sc.width, sc.height);
    return (SCACHE[key] = { c, sh: sc, w: c.width, h: c.height, pad, s: hq, hq });
  };
  // Draw a sticker standing at (x, y) = bottom-centre, height h. o: {t, rot, lift, alpha, sway, bob, peel, flip:{to, p}, sx, sy, ay}
  STK.draw = (g, name, x, y, h, o = {}) => {
    if (o.flip && o.flip.p >= 1) return STK.draw(g, o.flip.to, x, y, h, Object.assign({}, o, { flip: undefined }));
    // rasterise at the size it will have on screen (sharp close-ups); never below the page size
    const cz = EP.WD && EP.WD.cur && EP.WD.cur.c ? EP.WD.cur.c.z : 1, hres = Math.max(h, h * cz * 1.15);
    const S = STK.get(name, hres), k = h / S.hq, t = o.t ?? 0;
    let rot = o.rot || 0, lift = o.lift || 0, sc = 1, alpha = o.alpha ?? 1, yy = y;
    if (o.peel !== undefined) {   // sticker laid down: lands from a lifted, turned, slightly larger state
      const p = eOut5(clamp(o.peel)); if (o.peel <= 0) return;
      sc *= lerp(1.14, 1, p); rot += lerp(o.peelRot ?? 0.22, 0, p); lift = Math.max(lift, 1 - p); alpha *= clamp(o.peel * 6);
    }
    if (o.sway) rot += o.sway * Math.sin(t * 2.1 + (o.ph || 0)) * 0.025;
    if (o.bob) { const b = EP.pulse(o.T ?? t, 9); yy -= o.bob * b; }
    const ay = o.ay ?? 1, dw = S.w * k * sc, dh = S.h * k * sc, padK = S.pad * k * sc, fh = dh - 2 * padK;
    const bx = -dw / 2, by = -padK - ay * fh;   // the figure (inside the pad) is anchored at ay of its height
    g.save(); g.translate(x, yy); g.rotate(rot); g.globalAlpha *= alpha;
    // shadow (offset grows as the sticker lifts off the page)
    g.save(); g.globalAlpha *= 0.42 - lift * 0.12; const so = 10 + lift * 34, kk = k * sc;
    const fw = o.flip && o.flip.p > 0 && o.flip.p < 1 ? Math.max(0.04, Math.abs(PA.flipState(o.flip.p).c)) : 1;   // the shadow turns with the sticker
    if (fw < 1) { g.translate(so * 0.6, 0); g.scale(fw, 1); g.translate(-so * 0.6, 0); }
    g.drawImage(S.sh, bx - 40 * kk + so * 0.6, by - 40 * kk + so, S.sh.width * kk, S.sh.height * kk); g.restore();
    if (o.flip && o.flip.p > 0 && o.flip.p < 1) {
      const B = STK.get(o.flip.to, hres);
      PA.flipDraw(g, S.c, B.c, o.flip.p, 0, by + dh / 2, dw * (o.sx || 1), dh * (o.sy || 1), { slices: 10, liftK: 3 });
    } else {
      g.drawImage(S.c, bx, by, dw, dh);
      if (o.sing !== false && EP.LIP) EP.LIP.draw(g, name, bx + padK, by + padK, dw - 2 * padK, fh, t);
    }
    g.restore();
  };
})();
