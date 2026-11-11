// v2/kt.js — lyrics written onto the dossier pages, word by word as they are sung (aligned word times).
// A design d places one lyric line on a page: {i, x, y, w, px, style, col, align:'l'|'c'|'r', rot, lh, up,
//   emph: {word|index: {style, col, big, circle, under, hl, strike:time, shake, italic, w, cols, rot, tape}},
//   place: {index: {x, y, rot}} (manual positions), zh: {dx, dy, px, col} | false, dim: time, out: time, lead}
'use strict';
(function () {
  const { clamp, lerp, P, eIO, eOut, eOut5, eIn, backOut, spring, smooth, hash, noise } = EP;
  const PA = EP.PA, F = EP.F, T = EP.T;
  const KT = EP.KT = {};
  const norm = s => s.toLowerCase().replace(/[^a-z0-9']/g, '');
  const CUTCOLS = ['#F07A2E', '#F4CE72', '#D23A2C', '#FFF6E8', '#2F8F8A', '#E9A0B4'];

  function fontOf(st, px, em) {
    switch (st) {
      case 'serif': return (em && em.italic ? 'italic ' : '') + EP.font((em && em.w) || 780, px, F.serif);
      case 'type': return EP.font(400, px, F.type);
      case 'marker': return EP.font(700, px * 1.22, F.hand);
      case 'label': return EP.font(900, px * 0.74, F.ui);
      case 'stamp': return EP.font(900, px, F.ui);
      default: return EP.font(900, px, F.serif);
    }
  }
  function emphOf(d, w, j) { if (!d.emph) return null; return d.emph[j] || d.emph[norm(w.w)] || null; }

  KT.layout = (g, d) => {
    if (d._L) return d._L;
    const line = T.lines[d.i];
    const items = line.words.map((w, j) => {
      const em = emphOf(d, w, j), st = (em && em.style) || d.style, px = d.px * ((em && em.big) || 1);
      let text = w.w;
      if (st === 'label' || st === 'stamp' || d.up || (em && em.up)) text = text.toUpperCase();
      let wd;
      if (st === 'cut') { wd = [...text].reduce((s, ch) => s + PA.glyph(ch, px, '#F07A2E').adv + px * 0.06, 0); }
      else if (st === 'stamp') { wd = PA.stampImg(text, px, (em && em.col) || d.col || PA.COL.red).w * 0.92; }
      else { g.font = fontOf(st, px, em); g.letterSpacing = st === 'label' ? Math.round(px * 0.07) + 'px' : '0px'; wd = g.measureText(text).width + (st === 'label' ? px * 0.5 : 0); g.letterSpacing = '0px'; }
      return { j, w, text, st, px, em, wd };
    });
    const space = d.px * 0.3, rows = [];
    let row = [], rw = 0;
    for (const it of items) {
      if (it.em && it.em.hide) { it.x = 0; it.y = 0; continue; }   // hidden words take no room
      if (it.em && it.em.br && row.length) { rows.push({ items: row, w: rw }); row = []; rw = 0; }
      const add = (row.length ? space : 0) + it.wd;
      if (row.length && rw + add > d.w) { rows.push({ items: row, w: rw }); row = []; rw = 0; }
      rw += (row.length ? space : 0) + it.wd; row.push(it);
    }
    if (row.length) rows.push({ items: row, w: rw });
    let top = 0;
    for (const r of rows) {
      const rh = Math.max(...r.items.map(i => i.px * (i.st === 'marker' ? 1.1 : i.st === 'cut' ? 1.15 : 1))) * (d.lh || 1.12);
      const base = top + rh * 0.8;
      let x = d.align === 'c' ? -r.w / 2 : d.align === 'r' ? -r.w : 0;
      for (const it of r.items) { it.x = x; it.y = base; x += it.wd + space; }
      r.top = top; r.h = rh; top += rh;
    }
    if (d.place) for (const [j, p] of Object.entries(d.place)) { const it = items[+j]; if (it) { it.x = p.x; it.y = p.y; it.rot = p.rot; } }
    return (d._L = { items, rows, h: top, w: Math.max(...rows.map(r => r.w)) });
  };

  function drawWord(g, d, it, t) {
    const lu = t - (it.w.t0 - (d.lead ?? 0.05));
    if (lu < 0) return;
    const em = it.em || {}, col = em.col || d.col || PA.COL.ink, px = it.px, st = it.st;
    if (em.hide) return;
    const cx = it.x + it.wd / 2, cy = it.y - px * 0.36, dur = clamp(it.w.t1 - it.w.t0, 0.12, 0.42);
    g.save();
    if (it.rot) { g.translate(cx, cy); g.rotate(it.rot); g.translate(-cx, -cy); }
    if (em.shake) { g.translate(noise(t * 18, it.j) * px * 0.05, noise(t * 21, it.j + 9) * px * 0.04); }
    if (em.hl) PA.highlight(g, it.x - 10, it.y - px * 0.82, it.wd + 20, px * 0.98, eOut(P(lu, -0.04, 0.22)), em.hl === true ? PA.COL.hl : em.hl, it.j + 3);
    switch (st) {
      case 'serif': {   // #001 pop: scale spring 1 − e^(−6.5t)·cos(15t)
        const sc = spring(lu, 15, 6.5);
        g.save(); g.translate(cx, cy); g.scale(sc, sc); g.globalAlpha *= P(lu, 0, 0.05);
        EP.txt(g, it.text, 0, px * 0.36, { font: fontOf(st, px, em), color: col, align: 'center', shadow: d.glow, blur: d.glow ? 18 : 0 });
        g.restore(); break;
      }
      case 'type': {    // #006: characters one by one, each settling from 1.35×; time per char compressed to the word
        const chars = [...it.text], dt = clamp((it.w.t1 - it.w.t0) / Math.max(1, chars.length), 0.022, 0.06);
        g.font = fontOf(st, px, em); let x = it.x;
        chars.forEach((ch, k) => {
          const cw = g.measureText(ch).width, age = lu - k * dt;
          if (age >= 0) { const pop = 1 + 0.35 * Math.exp(-age * 16); g.save(); g.translate(x + cw / 2, it.y - px * 0.3 + (hash(it.j, k) - 0.5) * 2); g.scale(pop, pop); g.font = fontOf(st, px, em); g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.globalAlpha *= 0.82 + hash(k, it.j) * 0.18; g.fillText(ch, 0, px * 0.3); g.restore(); }
          x += cw;
        });
        break;
      }
      case 'marker': {  // written left → right with a nib riding the tip (#004 tip dot)
        const pr = eOut(P(lu, 0, dur)), f = fontOf(st, px, em);
        g.save(); g.beginPath(); g.rect(it.x - 10, it.y - px * 1.3, (it.wd + 24) * pr, px * 1.9); g.clip();
        EP.txt(g, it.text, it.x, it.y, { font: f, color: col, align: 'left' }); g.restore();
        if (pr < 1) { g.fillStyle = col; g.beginPath(); g.arc(it.x + it.wd * pr, it.y - px * 0.3 + Math.sin(lu * 40) * px * 0.12, px * 0.06, 0, 7); g.fill(); }
        break;
      }
      case 'label': {   // label-maker tape printing out (#005 mask reveal timing, compressed)
        const pr = eOut5(P(lu, 0, 0.25)), hh = px * 1.08, tape = em.tape || d.tape || '#1E1B26';
        g.save(); g.beginPath(); g.rect(it.x - 4, it.y - px * 1.2, (it.wd + 8) * pr, px * 2); g.clip();
        g.fillStyle = tape; g.beginPath(); g.roundRect(it.x, it.y - hh * 0.78, it.wd, hh, 6); g.fill();
        g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(it.x, it.y - hh * 0.78, it.wd, hh * 0.3);
        g.font = fontOf(st, px, em); g.letterSpacing = Math.round(px * 0.07) + 'px'; g.fillStyle = em.ink || d.ink || '#FBF6EA'; g.textAlign = 'left'; g.textBaseline = 'middle';
        g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowOffsetY = 1.5; g.shadowBlur = 0; g.fillText(it.text, it.x + px * 0.25, it.y - hh * 0.28); g.letterSpacing = '0px';
        g.restore(); break;
      }
      case 'stamp': PA.stamp(g, it.text, cx, cy, lu, { px, col, rot: em.rot ?? ((hash(it.j, d.i) - 0.5) * 0.2), comp: em.comp || d.comp }); break;
      case 'cut': {     // cut-paper letters dropping in: fall with cubic ease-in, then #024's 22 % squash over 0.3 s
        let x = it.x; const cols = em.cols || d.cols || CUTCOLS;
        [...it.text].forEach((ch, k) => {
          const G = PA.glyph(ch, px, cols[(k + it.j) % cols.length]), tc = lu - k * 0.035;
          if (tc >= 0) {
            const fall = 0.16, drop = (1 - eIn(P(tc, 0, fall))) * px * 1.3, tau = tc - fall;
            const sq = tau > 0 && tau < 0.3 ? 1 - 0.22 * Math.sin(tau / 0.3 * Math.PI) * Math.exp(-tau * 4) : 1, r = (hash(k, it.j + d.i) - 0.5) * 0.12;
            g.save(); g.translate(x + G.adv * 0.5, it.y - drop); g.rotate(r); g.scale(2 - sq, sq);
            g.drawImage(G.c, -G.w / 2, -G.h * 0.62); g.restore();
          }
          x += G.adv + px * 0.06;
        });
        break;
      }
    }
    // marks drawn on top
    if (em.circle) { const loop = PA.loop(cx, cy, it.wd / 2 + px * 0.32, px * 0.62, it.j + d.i); PA.ink(g, loop, 0, eIO(P(lu, 0.08, 0.68)), { col: em.circle === true ? PA.COL.marker : em.circle, w: Math.max(4, px * 0.075) }); }
    if (em.under) { const u = PA.hand([[it.x - 6, it.y + px * 0.16], [it.x + it.wd * 0.5, it.y + px * 0.2], [it.x + it.wd + 8, it.y + px * 0.12]], px * 0.04, it.j + 5); PA.ink(g, u, 0, eIO(P(lu, 0.1, 0.4)), { col: em.under === true ? PA.COL.marker : em.under, w: Math.max(4, px * 0.07) }); }
    if (em.strike !== undefined) { const s = PA.hand([[it.x - 10, it.y - px * 0.3], [it.x + it.wd + 12, it.y - px * 0.38]], px * 0.04, it.j + 11); PA.ink(g, s, 0, eIO(P(t, em.strike, em.strike + 0.25)), { col: em.strikeCol || PA.COL.marker, w: Math.max(6, px * 0.11) }); }
    g.restore();
  }

  function drawZh(g, d, L, t) {
    const line = T.lines[d.i], z = d.zh || {};
    const t0 = line.words[0].t0 + 0.12, dur = clamp((line.t1 - line.t0) * 0.6, 0.45, 1.2), pr = eOut(P(t, t0, t0 + dur));
    if (pr <= 0) return;
    const px = z.px || 34, f = EP.font(400, px, F.zh);
    g.font = f; const tw = g.measureText(line.zh).width;
    const ax = z.dx ?? 0, x0 = (z.align || d.align) === 'c' ? ax - tw / 2 : (z.align || d.align) === 'r' ? ax - tw : ax, y = z.dy ?? (L.h + px * 0.9);
    g.save(); g.beginPath(); g.rect(x0 - 6, y - px * 1.2, (tw + 12) * pr, px * 1.8); g.clip();
    EP.txt(g, line.zh, x0, y, { font: f, color: z.col || d.zhCol || PA.COL.pencil, align: 'left' });
    g.restore();
    if (pr < 1) { g.fillStyle = z.col || d.zhCol || PA.COL.pencil; g.globalAlpha *= 0.8; g.beginPath(); g.arc(x0 + tw * pr, y - px * 0.35, 3, 0, 7); g.fill(); }
  }

  KT.draw = (g, d, t) => {
    const line = T.lines[d.i];
    if (t < line.words[0].t0 - 0.3) return;
    const L = KT.layout(g, d);
    let a = 1;
    if (d.dim !== undefined) a *= 1 - 0.45 * smooth(P(t, d.dim, d.dim + 0.4));
    if (d.out !== undefined) a *= 1 - P(t, d.out, d.out + 0.3);
    if (a <= 0.01) return;
    g.save(); g.translate(d.x, d.y); if (d.rot) g.rotate(d.rot); g.globalAlpha *= a;
    for (const it of L.items) drawWord(g, d, it, t);
    if (d.zh !== false) drawZh(g, d, L, t);
    g.restore();
  };
  // word box in the design's local frame (for attaching effects to a word)
  KT.box = (g, d, j) => { const L = KT.layout(g, d), it = L.items[j]; return it ? { x: d.x + it.x, y: d.y + it.y, w: it.wd, px: it.px } : null; };
})();
