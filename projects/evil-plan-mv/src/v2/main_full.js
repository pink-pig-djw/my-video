// v2/main_full.js — boot for the full MV (loads only the images the requested time range needs), the frame renderer
// with film grain, bloom and colour grade, and the preview player.
'use strict';
(function () {
  const { W, H, P, clamp, lerp } = EP;
  const WD = EP.WD;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  EP.ctx = ctx;
  const GRAIN = [];
  for (let k = 0; k < 4; k++) {
    const c = EP.mk(640, 360), g = c.getContext('2d'), im = g.createImageData(640, 360), d = im.data, R = EP.rng(77 + k * 13);
    for (let i = 0; i < d.length; i += 4) { const v = 128 + (R() - 0.5) * 110; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    g.putImageData(im, 0, 0); GRAIN.push(c);
  }
  // bloom: bright parts of the frame, blurred at quarter size, screened back on
  const BA = EP.mk(480, 270), BB = EP.mk(480, 270), ba = BA.getContext('2d'), bb = BB.getContext('2d');
  function bloom(g, amt) {
    ba.filter = 'brightness(0.72) contrast(3.2)'; ba.drawImage(cv, 0, 0, 480, 270); ba.filter = 'none';
    bb.clearRect(0, 0, 480, 270); bb.filter = 'blur(9px)'; bb.drawImage(BA, 0, 0); bb.filter = 'none';
    g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = amt; g.drawImage(BB, 0, 0, W, H); g.globalAlpha = amt * 0.6; g.drawImage(BB, -20, -12, W + 40, H + 24); g.restore();
  }
  EP.renderFrame = t => {
    const g = ctx; EP.reset(g);
    EP.WD.render(g, t);
    EP.reset(g);
    // colour grade ranges: [t0, t1, {col, op, a}, fadeIn, fadeOut]
    for (const [a, b, gr, fi = 0.5, fo = 0.5] of WD.grades) {
      if (t < a || t > b) continue;
      const k = Math.min(P(t, a, a + fi), 1 - P(t, b - fo, b)) * (typeof gr.a === 'function' ? gr.a(t) : gr.a);
      if (k <= 0.002) continue;
      g.globalCompositeOperation = gr.op || 'soft-light'; g.globalAlpha = k; g.fillStyle = gr.col; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    }
    const bl = WD.rangeVal(WD.blooms, t);
    if (bl > 0.01) bloom(g, bl);
    g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.09; g.drawImage(GRAIN[Math.floor(t * 24) % 4], 0, 0, W, H);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    const end = EP.T.duration, f = Math.max(1 - P(t, 0, 0.12), P(t, end - 0.7, end - 0.1));
    if (f > 0) { g.globalAlpha = f; g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    for (const f of EP.overlays) { EP.reset(g); f(g, t); }
  };
  const q = new URLSearchParams(location.search);
  if (q.has('render')) document.body.classList.add('render');
  EP.ASSETS = EP.ASSETS || [];   // always loaded
  EP.overlays = EP.overlays || [];   // screen-space passes drawn last (e.g. the lamp going out)
  const src = n => n.startsWith('cut/') ? '../assets/cut/' + n.slice(4) + '.png' : n.startsWith('thumb/') ? '../assets/thumbs/' + n.slice(6) + '.png' : n.startsWith('mouth/') ? '../assets/mouth/' + n.slice(6) + '.png' : '../assets/gen/' + n + '.png';
  async function boot() {
    try {
      WD.finalize();
      const r0 = parseFloat(q.get('t0')), r1 = parseFloat(q.get('t1')), all = isNaN(r0) || isNaN(r1);
      const need = new Set(EP.ASSETS);
      for (const s of WD.spreads) if (all || (s.win[1] >= r0 - 0.5 && s.win[0] <= r1 + 0.5)) (typeof s.img === 'function' ? s.img() : s.img || []).forEach(n => need.add(n));
      if (q.has('thumbs')) { for (const s of WD.spreads) if (typeof s.img === 'function') s.img().filter(n => n.startsWith('thumb/')).forEach(n => need.delete(n)); }
      await EP.load([...need].map(n => [n, src(n)]));
      const fams = ['780 40px Fraunces', '900 40px Fraunces', 'italic 900 40px Fraunces', 'italic 780 40px Fraunces', '700 40px Caveat', '40px "Special Elite"', '800 40px Nunito', '900 40px Nunito', '400 40px "Pirata One"'];
      await Promise.all(fams.map(f => document.fonts.load(f, 'AaBb09')));
      await document.fonts.load('400 40px "LXGW WenKai"', EP.T.lines.map(l => l.zh).join('') + (EP.ZH_EXTRA || ''));
      await document.fonts.ready;
      window.__total = EP.T.duration; window.__start = 0; window.__assets = need.size;
      window.__ready = true;
      const t0 = parseFloat(q.get('t')); draw(isNaN(t0) ? (all ? 1 : r0) : t0);
    } catch (e) { window.__bootFailed = String(e && e.stack || e); console.error(window.__bootFailed); }
  }
  window.renderFrame = t => EP.renderFrame(t);
  // every page drawn once at its finished state, for the outro grid (tools/render.py --thumbs saves them)
  window.__makeThumbs = () => {
    const out = [];
    for (const s of WD.spreads) {
      if (['GRID', 'C4d'].includes(s.id) || s.win[0] > s.win[1]) continue;
      const c = EP.mk(960, 600), g = c.getContext('2d'), tr = s.thumbT ?? Math.max(s.win[0] + 0.5, s.win[1] - 0.9), cam = { x: s.x, y: s.y, z: 0.4, r: 0, sx: 0, sy: 0, sr: 0 };
      EP.reset(g); g.translate(480, 300); g.scale(0.4, 0.4); if (s.rot) g.rotate(s.rot);
      WD.cur = { c: cam, s };
      try { g.save(); s.draw(g, tr, cam); g.restore(); out.push({ id: s.id, t: tr, data: c.toDataURL('image/png') }); } catch (e) { out.push({ id: s.id, error: String(e) }); }
    }
    return out;
  };
  window.__canvas = cv;
  const seek = document.getElementById('seek'), tc = document.getElementById('tc'), pp = document.getElementById('pp');
  let audio = null, playing = false, cur = 0;
  function draw(t) { cur = t; EP.renderFrame(t); seek.value = t; tc.textContent = t.toFixed(2); }
  seek.min = '0'; seek.max = String(EP.T.duration);
  seek.addEventListener('input', () => { draw(parseFloat(seek.value)); if (audio) audio.currentTime = cur; });
  pp.addEventListener('click', () => {
    if (!audio) { audio = new Audio('../audio/song.mp3'); audio.muted = !q.has('sound'); }
    playing = !playing; pp.textContent = playing ? '❚❚' : '▶';
    if (playing) { audio.currentTime = cur; audio.play().catch(() => {}); loop(); } else audio.pause();
  });
  function loop() { if (!playing) return; draw(audio.currentTime); requestAnimationFrame(loop); }
  boot();
})();
