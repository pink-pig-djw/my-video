// v2/lip.js — lip sync for the character stickers, by switching painted mouth shapes.
// Each singing pose has mouth patches repainted by Codex in the sprite's own art style (assets/mouth/<pose>_<shape>.png:
// 'closed', 'a', 'o'; the sprite's original open smile serves as 'e/i', or an extra 'e' patch where that smile is closed). The shape timeline comes from the aligned word
// timings: every word is split into syllables, each syllable's vowel picks a shape, m/b/p/f/v close the lips, w rounds
// them, and short gaps between words close the mouth. Shapes switch instantly, like a cel-animated lip flap.
// When data/lipkeys.js is present (tools/lipkeys.py: letter-level forced alignment to the isolated vocal, mouth closed
// only where the voice stops) its keys and per-line windows are used instead of the word-timing estimate below.
'use strict';
(function () {
  const LIP = EP.LIP = {};
  const MOUTHS = window.MOUTHS || {};
  EP.ASSETS = EP.ASSETS || [];
  for (const [pose, m] of Object.entries(MOUTHS)) for (const s of m.shapes) EP.ASSETS.push('mouth/' + pose + '_' + s);

  function sylls(word) {
    const w = word.toLowerCase().replace(/[^a-z']/g, '').replace(/'/g, '');
    const groups = []; const re = /[aeiouy]+/g; let m;
    while ((m = re.exec(w))) groups.push({ v: m[0], i: m.index });
    if (groups.length > 1) { const g = groups[groups.length - 1]; if (g.v === 'e' && g.i === w.length - 1 && !/[^aeiou]le$/.test(w)) groups.pop(); }
    if (groups.length && groups[0].i === 0 && w[0] === 'y' && groups[0].v.length > 1) { groups[0].v = groups[0].v.slice(1); groups[0].i = 1; }
    if (!groups.length) return [{ shape: 'closed', onset: null }];
    return groups.map((g, k) => {
      const prevEnd = k ? groups[k - 1].i + groups[k - 1].v.length : 0, onset = w.slice(prevEnd, g.i);
      const v = g.v[0] === 'y' && g.v.length > 1 ? g.v[1] : g.v[0];
      let shape = { a: 'a', e: 'base', i: 'base', o: 'o', u: 'o', y: 'base' }[v] || 'base';
      if (/^oo|^ew|^ue|^ou|^ow/.test(g.v)) shape = 'o';
      else if (/^ee|^ea|^ie|^ai|^ay|^ei/.test(g.v)) shape = 'base';
      else if (g.v === 'i' && /[^aeiou]e$/.test(w) && /^[^aeiou]*$/.test(w.slice(g.i + 1, -1))) shape = 'a';   // "-ine", "-ice" sound "ai"
      if (/igh/.test(w) && v === 'i') shape = 'a';
      const last = onset.slice(-1);
      return { shape, onset: /[mbpfv]/.test(last) ? 'closed' : /w/.test(last) ? 'o' : null };
    });
  }
  // keys: [t, shape]
  const KEYS = window.LIPKEYS ? window.LIPKEYS.map(k => k.slice()) : [];
  if (!window.LIPKEYS) EP.T.lines.forEach((ln, li, lines) => {
    const ws = ln.words;
    ws.forEach((wd, j) => {
      let t0 = wd.t0, t1 = Math.max(wd.t1, wd.t0 + 0.12);
      const next = j + 1 < ws.length ? ws[j + 1].t0 : (li + 1 < lines.length ? lines[li + 1].t0 : 1e9);
      if (t1 > next - 0.02) t1 = Math.max(t0 + 0.08, next - 0.02);
      const sy = sylls(wd.w), n = sy.length, dur = t1 - t0, base = Math.min(0.2, dur / n);
      sy.forEach((s, k) => {
        const a = t0 + k * base, b = k === n - 1 ? t1 : a + base, L = b - a;
        if (s.onset) { KEYS.push([a - 0.02, s.onset]); KEYS.push([a + Math.min(0.08, L * 0.4), s.shape]); }
        else KEYS.push([a + Math.min(0.03, L * 0.2), s.shape]);
        if (L > 0.55 && s.shape !== 'base') KEYS.push([b - 0.12, 'base']);    // a long note relaxes before it ends
      });
      if (next - t1 > 0.1) KEYS.push([t1 + 0.03, 'closed']);
    });
  });
  KEYS.sort((p, q) => p[0] - q[0]);
  LIP.shapeAt = t => {
    let lo = 0, hi = KEYS.length - 1;
    if (!KEYS.length || t < KEYS[0][0]) return 'base';
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (KEYS[m][0] <= t) lo = m; else hi = m - 1; }
    return KEYS[lo][1];
  };

  // ------------------------------------------------------------------ which lines she visibly sings
  // Not every line: only where the shot is about her. Elsewhere the sticker keeps its painted mouth.
  // LIP.sing(lines) lets any sticker on screen sing them; LIP.sing(lines, pose) only that pose (two stickers in view).
  LIP.PLAN = new Map();
  LIP.sing = (ids, pose) => { for (const i of [].concat(ids)) { if (!pose) { LIP.PLAN.set(i, null); continue; } const s = LIP.PLAN.get(i) || new Set(); s.add(pose); LIP.PLAN.set(i, s); } };
  const LW = window.LIPLINES || {}, lo = i => LW[i] ? LW[i][0] : EP.L(i) - 0.08, hi = i => LW[i] ? LW[i][1] : EP.E(i) + 0.12;
  LIP.on = (t, name) => { for (const [i, ps] of LIP.PLAN) if (t > lo(i) && t < hi(i) && (!ps || ps.has(name))) return true; return false; };

  // Draw the current mouth patch onto a sticker figure whose cut image is drawn at (fx, fy, fw, fh).
  LIP.draw = (g, name, fx, fy, fw, fh, t) => {
    const M = MOUTHS[name]; if (!M || !LIP.on(t, name)) return;
    let shape = LIP.shapeAt(t);
    if (shape === 'base') { if (!M.shapes.includes('e')) return; shape = 'e'; }
    const im = EP.img['mouth/' + name + '_' + shape], cut = EP.img['cut/' + name]; if (!im || !cut) return;
    const sx = fw / cut.width, sy = fh / cut.height;
    g.drawImage(im, fx + M.x * sx, fy + M.y * sy, M.w * sx, M.h * sy);
  };
})();
