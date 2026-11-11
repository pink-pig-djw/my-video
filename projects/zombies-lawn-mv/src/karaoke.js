// karaoke.js — the lyric line at the bottom of the frame with a little pink brain bouncing from word to word on the
// sung syllables (the reference video's device), plus speech bubbles for the zombies' lines.
'use strict';
(function () {
  const { W, H, clamp, lerp, P, eOut, backOut, TAU } = ZL;
  const T = ZL.T;
  const MAIN = T.lines.filter(l => l.who === 'S' && !l.echo);
  const SIZE = 66, BASE_Y = H - 64;
  const layoutCache = {};
  function layout(g, ln) {
    if (layoutCache[ln.i]) return layoutCache[ln.i];
    g.save(); g.font = `${SIZE}px ${ZL.F.lyric}`;
    const space = g.measureText(' ').width;
    const ws = ln.words.map(w => ({ w: w.w, t0: w.t0, t1: w.t1, width: g.measureText(w.w).width }));
    g.restore();
    const total = ws.reduce((s, w) => s + w.width, 0) + space * (ws.length - 1);
    let x = W / 2 - total / 2;
    for (const w of ws) { w.x = x; w.cx = x + w.width / 2; x += w.width + space; }
    return (layoutCache[ln.i] = { ws, total });
  }
  // which main line is on screen at t (from a little before it is sung until the next one takes over)
  function current(t) {
    let cur = null;
    for (let k = 0; k < MAIN.length; k++) {
      const ln = MAIN[k], nx = MAIN[k + 1];
      const a = ln.t0 - 0.45, b = Math.min(nx ? nx.t0 - 0.45 : 1e9, ln.t1 + 0.7);
      if (t >= a && t < b) cur = { ln, a, b };
    }
    return cur;
  }
  ZL.karaokeLine = current;

  // draw the bar; o: {alpha, y, band (dark band behind for busy pictures)}
  ZL.karaoke = (g, t, o = {}) => {
    const c = current(t); if (!c) return;
    const { ln, a, b } = c;
    const k = Math.min(P(t, a, a + 0.12), 1 - P(t, b - 0.12, b)) * (o.alpha ?? 1);
    if (k <= 0.01) return;
    const L = layout(g, ln), y = o.y ?? BASE_Y;
    g.save(); g.globalAlpha = k;
    if (o.band) {
      const gr = g.createLinearGradient(0, y - 110, 0, H);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${o.band})`);
      g.fillStyle = gr; g.fillRect(0, y - 110, W, H - y + 110);
    }
    for (const w of L.ws) {
      const sung = t >= w.t0;
      ZL.text(g, w.w, w.cx, y, { size: SIZE, fill: sung ? '#fff6a8' : '#ffffff', stroke: '#2a1a0c', lw: 11, shadow: 0.55 });
    }
    // the brain: lands on each word's top at its start time, arcs between words
    const ws = L.ws, top = y - SIZE * 0.78;
    let bx, by, sq = 0;
    const im = ZL.img.brain, bs = 44 / (im ? im.width : 44);
    if (t < ws[0].t0) {                                           // hops in from the left edge of the line
      const u = clamp((t - (ws[0].t0 - 0.45)) / 0.45);
      bx = lerp(ws[0].x - 90, ws[0].cx, u); by = top - Math.sin(u * Math.PI) * 60 - (1 - u) * 10;
    } else {
      let j = ws.length - 1;
      for (let q = 0; q < ws.length - 1; q++) if (t < ws[q + 1].t0) { j = q; break; }
      if (j === ws.length - 1) { bx = ws[j].cx; by = top; sq = Math.exp(-(t - ws[j].t0) * 12); }
      else {
        const u = clamp((t - ws[j].t0) / (ws[j + 1].t0 - ws[j].t0));
        const hgt = clamp((ws[j + 1].t0 - ws[j].t0) * 140, 26, 78);
        bx = lerp(ws[j].cx, ws[j + 1].cx, u); by = top - 4 * u * (1 - u) * hgt;
        sq = Math.exp(-(t - ws[j].t0) * 14);
      }
    }
    if (im) {
      g.save(); g.translate(bx, by);
      g.scale(1 + sq * 0.28, 1 - sq * 0.24);
      g.shadowColor = 'rgba(255,255,255,0.9)'; g.shadowBlur = 10;            // a light halo so it reads on busy crowds
      g.drawImage(im, -im.width * bs / 2, -im.height * bs, im.width * bs, im.height * bs);
      g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = 6; g.shadowOffsetY = 3;
      g.drawImage(im, -im.width * bs / 2, -im.height * bs, im.width * bs, im.height * bs);
      g.restore();
    }
    g.restore();
  };

  // ---------------------------------------------------------------- speech bubbles
  // A white rounded bubble with a tail pointing at (tx, ty); the text appears word by word on the sung word times
  // (words = [{w, t0}]). k = pop scale 0..1. o: {size, maxW, font, col}
  ZL.bubble = (g, x, y, tx, ty, words, t, k, o = {}) => {
    if (k <= 0.01) return;
    const size = o.size ?? 40, font = o.font ?? ZL.F.lyric, maxW = o.maxW ?? 360;
    g.save();
    g.font = `${size}px ${font}`;
    // wrap into lines
    const space = g.measureText(' ').width, rows = [[]]; let rw = 0;
    for (const w of words) {
      const ww = g.measureText(w.w).width;
      if (rw > 0 && rw + space + ww > maxW) { rows.push([]); rw = 0; }
      rows[rows.length - 1].push({ ...w, ww }); rw += (rw ? space : 0) + ww;
    }
    const lh = size * 1.12;
    const widths = rows.map(r => r.reduce((s, w) => s + w.ww, 0) + space * (r.length - 1));
    const bw = Math.max(...widths) + size * 1.1, bh = rows.length * lh + size * 0.7;
    g.translate(x, y); g.scale(k, k); g.translate(-x, -y);
    // tail
    const ang = Math.atan2(ty - y, tx - x), bx = x + Math.cos(ang) * Math.min(bw, bh) * 0.25, byy = y + Math.sin(ang) * bh * 0.3;
    g.fillStyle = o.fill || '#fff'; g.strokeStyle = o.stroke || '#222'; g.lineWidth = 4;
    g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 10; g.shadowOffsetY = 4;
    g.beginPath(); g.roundRect(x - bw / 2, y - bh / 2, bw, bh, Math.min(28, bh / 2)); g.fill();
    g.shadowColor = 'transparent';
    const perp = ang + Math.PI / 2, tw = Math.min(26, bw * 0.12);
    g.beginPath(); g.moveTo(bx + Math.cos(perp) * tw, byy + Math.sin(perp) * tw); g.lineTo(tx, ty); g.lineTo(bx - Math.cos(perp) * tw, byy - Math.sin(perp) * tw); g.closePath(); g.fill();
    g.beginPath(); g.roundRect(x - bw / 2, y - bh / 2, bw, bh, Math.min(28, bh / 2)); g.stroke();
    g.beginPath(); g.moveTo(bx + Math.cos(perp) * tw, byy + Math.sin(perp) * tw); g.lineTo(tx, ty); g.lineTo(bx - Math.cos(perp) * tw, byy - Math.sin(perp) * tw); g.stroke();
    g.fillStyle = o.fill || '#fff';
    g.beginPath(); g.roundRect(x - bw / 2 + 2, y - bh / 2 + 2, bw - 4, bh - 4, Math.min(26, bh / 2)); g.fill();
    // words
    g.textBaseline = 'middle'; g.textAlign = 'left';
    rows.forEach((r, ri) => {
      let cx = x - widths[ri] / 2; const cy = y - bh / 2 + size * 0.35 + lh * (ri + 0.5);
      for (const w of r) {
        const u = w.t0 == null ? 1 : clamp((t - w.t0 + 0.06) / 0.12);
        if (u > 0) {
          g.save(); g.globalAlpha *= u; g.translate(cx + w.ww / 2, cy); const s = 0.6 + 0.4 * backOut(u); g.scale(s, s);
          g.fillStyle = o.col || '#2a1a0c'; g.fillText(w.w, -w.ww / 2, 0); g.restore();
        }
        cx += w.ww + space;
      }
    });
    g.restore();
  };
  // words of lyric line i as bubble words (with their sung times)
  ZL.lineWords = i => T.lines[i].words.map(w => ({ w: w.w, t0: w.t0 }));
})();
