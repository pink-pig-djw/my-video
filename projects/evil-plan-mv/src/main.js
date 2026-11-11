// main.js — frame renderer, post pass, boot and preview player.
'use strict';
(function () {
  const { W, H, clamp, P, C } = EP;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  EP.ctx = ctx;
  const SH = EP.SHOTS;
  const startOf = S => S.t - ((S.tr && S.tr.lead) || 0);
  const trDur = tr => tr.d ?? ((EP.TR[tr.type] && EP.TR[tr.type].dur || 0.5) * (tr.k || 1));
  function shotIndex(t) { let lo = 0, hi = SH.length - 1, r = 0; while (lo <= hi) { const m = (lo + hi) >> 1; if (startOf(SH[m]) <= t) { r = m; lo = m + 1; } else hi = m - 1; } return r; }

  const warned = {};
  EP.drawShot = (g, S, t) => {
    EP.reset(g);
    const fn = EP.scenes[S.s];
    if (!fn) { EP.fill(g, '#300'); if (!warned[S.s]) { console.error('missing scene ' + S.s); warned[S.s] = 1; } return; }
    g.save();
    try { fn(g, t - S.t, S.p || {}, t, S); }
    catch (e) { if (!warned[S.s + 'x']) { console.error('scene ' + S.s + ' @' + t.toFixed(2) + ': ' + (e && e.stack || e)); warned[S.s + 'x'] = 1; } }
    g.restore();
    EP.reset(g);
  };

  // ---------------------------------------------------------------- post: grain, vignette, letterbox, fades
  const GRAIN = [];
  (function makeGrain() {
    for (let k = 0; k < 4; k++) {
      const c = EP.mk(640, 360), g = c.getContext('2d'), im = g.createImageData(640, 360), d = im.data, R = EP.rng(77 + k * 13);
      for (let i = 0; i < d.length; i += 4) { const v = 128 + (R() - 0.5) * 120; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
      g.putImageData(im, 0, 0); GRAIN.push(c);
    }
  })();
  const VIG = (() => { const c = EP.mk(W, H), g = c.getContext('2d'); const gr = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); return c; })();
  EP.post = (g, t) => {
    const S = SH[shotIndex(t)], p = S.p || {};
    EP.reset(g);
    // vignette
    g.globalAlpha = p.vig ?? 0.42; g.drawImage(VIG, 0, 0); g.globalAlpha = 1;
    // grain (overlay)
    g.globalCompositeOperation = 'overlay'; g.globalAlpha = p.grain ?? 0.10;
    g.drawImage(GRAIN[Math.floor(t * 24) % 4], 0, 0, W, H);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    // letterbox
    const lb = EP.letterbox ? EP.letterbox(t) : 0;
    if (lb > 0) { g.fillStyle = '#000'; const bh = 104 * lb; g.fillRect(0, 0, W, bh); g.fillRect(0, H - bh, W, bh); }
    // global fades
    const fin = 1 - P(t, 0, 0.5), fout = P(t, EP.TOTAL - 1.2, EP.TOTAL);
    const f = Math.max(fin, fout, EP.blackAt ? EP.blackAt(t) : 0);
    if (f > 0) { g.globalAlpha = f; g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
  };

  EP.renderFrame = t => {
    const g = ctx; EP.reset(g);
    const i = shotIndex(t), S = SH[i], tr = S.tr, ts = startOf(S);
    if (i > 0 && tr && tr.type !== 'cut' && t < ts + trDur(tr)) {
      const A = EP.buf(0), B = EP.buf(1);
      EP.drawShot(A.g, SH[i - 1], t);
      EP.drawShot(B.g, S, t);
      EP.reset(g);
      try { EP.TR[tr.type](g, A.c, B.c, t - ts, tr); } catch (e) { console.error('transition ' + tr.type + ': ' + e.stack); g.drawImage(B.c, 0, 0); }
    } else EP.drawShot(g, S, t);
    EP.reset(g);
    if (!(S.p && S.p.noLyrics)) EP.drawLyrics(g, t);
    EP.post(g, t);
  };
  EP.shotAt = t => SH[shotIndex(t)];

  // ---------------------------------------------------------------- boot
  const q = new URLSearchParams(location.search);
  if (q.has('render')) document.body.classList.add('render');
  async function boot() {
    try {
      const list = [];
      for (const n of EP.ASSETS.gen) list.push([n, '../assets/gen/' + n + '.png']);
      for (const n of EP.ASSETS.cut) list.push(['cut/' + n, '../assets/cut/' + n + '.png']);
      await EP.load(list);
      const fams = ['560 40px Fraunces', 'italic 560 40px Fraunces', '900 40px Fraunces', 'italic 900 40px Fraunces', '700 40px Fraunces', '40px "Pirata One"', '600 40px Caveat', '700 40px Caveat', '40px "Special Elite"', '800 40px Nunito', '600 40px Nunito'];
      await Promise.all(fams.map(f => document.fonts.load(f, 'AaBb09')));
      const zh = EP.T.lines.map(l => l.zh).join('') + (EP.ZH_EXTRA || '');
      await document.fonts.load('400 40px "LXGW WenKai"', zh);
      await document.fonts.ready;
      if (EP.prepare) await EP.prepare();
      window.__total = EP.TOTAL;
      window.__ready = true;
      const t0 = parseFloat(q.get('t'));
      draw(isNaN(t0) ? 0 : t0);
    } catch (e) { window.__bootFailed = String(e && e.stack || e); console.error(window.__bootFailed); }
  }
  window.renderFrame = t => EP.renderFrame(t);
  window.__canvas = cv;

  // ---------------------------------------------------------------- preview player (silent unless ?sound)
  const seek = document.getElementById('seek'), tc = document.getElementById('tc'), pp = document.getElementById('pp');
  let audio = null, playing = false, cur = 0;
  function draw(t) { cur = t; EP.renderFrame(t); seek.value = t; tc.textContent = t.toFixed(2); }
  seek.max = String(EP.TOTAL);
  seek.addEventListener('input', () => { draw(parseFloat(seek.value)); if (audio) audio.currentTime = cur; });
  pp.addEventListener('click', () => {
    if (!audio) { audio = new Audio('../audio/song.mp3'); audio.muted = !q.has('sound'); }
    playing = !playing; pp.textContent = playing ? '❚❚' : '▶';
    if (playing) { audio.currentTime = cur; audio.play().catch(() => {}); loop(); } else audio.pause();
  });
  function loop() { if (!playing) return; draw(audio.currentTime); requestAnimationFrame(loop); }
  boot();
})();
