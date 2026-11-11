// lyrics.js — bilingual lyric layer. Each line uses the Motion Prompt #005 mask-reveal timing (see EP.mr in mp.js):
// English rises from behind an orange divider, Chinese drops from above it, both leave the way #005 does.
// English words fill from cream to gold as they are sung (aligned word times from tools/align.py).
'use strict';
(function () {
  const { W, H, C, F, clamp, P, lerp } = EP;
  const LINES = EP.T.lines;
  const LEAD = 0.42;            // a line starts entering this long before it is sung
  const ENTER = 1.15, EXIT = 0.6, HOLD = 0.1;

  // Display windows [a, b]: from just before the line is sung until the next line takes over (or a short hold).
  const WIN = LINES.map((l, i) => {
    const a = l.t0 - LEAD;
    const nextA = i + 1 < LINES.length ? LINES[i + 1].t0 - LEAD : Infinity;
    return { a, b: Math.min(nextA, l.t1 + 1.5) };
  });
  EP.SUB = {};      // line index → 'full' (default) | 'zh' | 'none'
  EP.SUBPOS = {};   // line index → 'top'
  EP.SUBSTYLE = {}; // line index → 'italic'

  // Element time for line i at song time t. Entrance and exit keep #005's speed; only when the window is shorter
  // than entrance + exit is the whole move time-scaled (k < 1).
  function elemTime(i, t) {
    const { a, b } = WIN[i], end = b + 0.15, k = clamp((end - a) / (ENTER + EXIT + HOLD), 0.42, 1);
    const e0 = end - EXIT * k;
    if (t < e0) return Math.min((t - a) / k, 1.6);
    return 1.7 + (t - e0) / k;
  }

  const tokenCache = {};
  function layout(g, i, enFont) {
    const key = i + enFont;
    if (tokenCache[key]) return tokenCache[key];
    const l = LINES[i], toks = l.words.map(w => w.w), s = toks.join(' ');
    g.font = enFont; g.letterSpacing = '0px';
    const xs = [], ws = [];
    toks.forEach((tk, j) => { xs.push(g.measureText(toks.slice(0, j).join(' ') + (j ? ' ' : '')).width); ws.push(g.measureText(tk).width); });
    const total = g.measureText(s).width;
    return (tokenCache[key] = { s, xs, ws, total });
  }

  function drawLine(g, i, t, vis) {
    const mode = EP.SUB[i] || 'full';
    if (mode === 'none') return 0;
    const l = LINES[i], lu = elemTime(i, t), m = EP.mr(lu);
    if (lu <= 0 || lu >= 2.3) return 0;
    const top = EP.SUBPOS[i] === 'top', YL = top ? 150 : 948, italic = EP.SUBSTYLE[i] === 'italic';
    // fonts (shrink to fit)
    const enPx = EP.fitPx(g, l.en, 600, 50, F.serif, 1640), zhPx = EP.fitPx(g, l.zh, 400, 40, F.zh, 1640);
    const enFont = (italic ? 'italic ' : '') + EP.font(560, enPx, F.serif), zhFont = EP.font(400, zhPx, F.zh);
    const L = layout(g, i, enFont);
    g.font = zhFont; const zhW = g.measureText(l.zh).width;
    const lineW = Math.max(mode === 'zh' ? 0 : L.total, zhW) + 70;
    const showEN = mode !== 'zh';
    // divider
    if (m.lg > 0.005) {
      g.save(); g.fillStyle = C.orange; g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 8;
      EP.rr(g, W / 2 - lineW / 2 * m.lg, YL - 2.5, lineW * m.lg, 5, 2.5); g.fill(); g.restore();
    }
    // English: clipped above the divider
    if (showEN) {
      const y = YL - 20 + m.upIn * 64 - m.upOut * 80;
      g.save(); g.beginPath(); g.rect(0, YL - 96, W, 92); g.clip();
      const x0 = W / 2 - L.total / 2;
      g.font = enFont; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      g.shadowColor = 'rgba(8,6,20,.75)'; g.shadowBlur = 16; g.shadowOffsetY = 2;
      g.fillStyle = C.cream; g.fillText(L.s, x0, y);
      g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetY = 0;
      // karaoke fill
      let sung = 0;
      l.words.forEach((w, j) => { const f = P(t, w.t0, Math.max(w.t1, w.t0 + 0.08)); if (f > 0) sung = L.xs[j] + L.ws[j] * f; });
      if (sung > 0) {
        g.save(); g.beginPath(); g.rect(x0 - 4, YL - 96, sung + 4, 92); g.clip();
        g.fillStyle = '#FFC66B'; g.fillText(L.s, x0, y); g.restore();
      }
      g.restore();
    }
    // Chinese: clipped below the divider
    {
      const y = YL + 52 - m.dnIn * 75 + m.dnOut * 85;
      g.save(); g.beginPath(); g.rect(0, YL + 5, W, 76); g.clip();
      EP.txt(g, l.zh, W / 2, y, { font: zhFont, color: '#FFF1DC', shadow: 'rgba(8,6,20,.8)', blur: 14, oy: 2 });
      g.restore();
    }
    return clamp(Math.min(P(lu, 0, 0.3), 1 - P(lu, 2.05, 2.3)));
  }

  EP.drawLyrics = (g, t) => {
    let vis = 0, top = false;
    const act = [];
    for (let i = 0; i < LINES.length; i++) {
      const { a, b } = WIN[i];
      if (t < a - 0.05 || t > b + 0.4) continue;
      act.push(i);
      if (EP.SUB[i] !== 'none') { vis = Math.max(vis, clamp(Math.min((t - a) / 0.3, (b + 0.4 - t) / 0.4))); if (EP.SUBPOS[i] === 'top') top = true; }
    }
    if (vis > 0 && !EP.noBand) {   // soft band behind the lines for readability
      g.save(); g.globalAlpha = vis * 0.85;
      g.fillStyle = top ? EP.vgrad(g, 0, 300, [[0, 'rgba(6,5,16,.55)'], [1, 'rgba(6,5,16,0)']]) : EP.vgrad(g, 760, H, [[0, 'rgba(6,5,16,0)'], [1, 'rgba(6,5,16,.62)']]);
      top ? g.fillRect(0, 0, W, 300) : g.fillRect(0, 760, W, H - 760);
      g.restore();
    }
    for (const i of act) drawLine(g, i, t);
  };
  EP.lyricWindow = i => WIN[i];
})();
