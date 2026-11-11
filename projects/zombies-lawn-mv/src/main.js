// main.js — boot (loads only the images the requested time range needs), the frame renderer (scenes in time order,
// screen overlays, colour grade, film grain) and the preview player.
'use strict';
(function () {
  const { W, H, P, clamp } = ZL;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  ZL.ctx = ctx;
  // scenes: {id, t0, t1, img: [names], draw(g, t)}; overlays: {t0, t1, draw(g, t)} drawn after all scenes
  ZL.SCENES = ZL.SCENES || [];
  ZL.OVER = ZL.OVER || [];
  ZL.ALWAYS = ['brain'];
  const GRAIN = [];
  for (let k = 0; k < 4; k++) {
    const c = ZL.mk(640, 360), g = c.getContext('2d'), im = g.createImageData(640, 360), d = im.data, R = ZL.rng(91 + k * 7);
    for (let i = 0; i < d.length; i += 4) { const v = 128 + (R() - 0.5) * 90; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    g.putImageData(im, 0, 0); GRAIN.push(c);
  }
  ZL.renderFrame = t => {
    const g = ctx; ZL.reset(g);
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    for (const s of ZL.SCENES) {
      if (t < s.t0 || t >= s.t1) continue;
      ZL.reset(g); g.save(); s.draw(g, t); g.restore();
    }
    for (const o of ZL.OVER) {
      if (t < o.t0 || t >= o.t1) continue;
      ZL.reset(g); g.save(); o.draw(g, t); g.restore();
    }
    ZL.reset(g);
    g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.05; g.drawImage(GRAIN[Math.floor(t * 24) % 4], 0, 0, W, H);
    ZL.reset(g);
    const end = ZL.T.duration, f = P(t, end - 0.6, end - 0.05);
    if (f > 0) { g.globalAlpha = f; g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
  };
  const q = new URLSearchParams(location.search);
  if (q.has('render')) document.body.classList.add('render');
  const src = n => n.startsWith('anim/') ? '../assets/' + n + '.png' : n.startsWith('bg/') ? '../assets/' + n + '.jpg'
    : n.startsWith('sfm_') || n.startsWith('sfe_') ? '../assets/mouth/' + n + '.png' : '../assets/cut/' + n + '.png';
  async function boot() {
    try {
      const r0 = parseFloat(q.get('t0')), r1 = parseFloat(q.get('t1')), all = isNaN(r0) || isNaN(r1);
      const need = new Set(ZL.ALWAYS);
      for (const s of [...ZL.SCENES, ...ZL.OVER]) if (all || (s.t1 >= r0 - 0.5 && s.t0 <= r1 + 0.5)) (typeof s.img === 'function' ? s.img() : s.img || []).forEach(n => need.add(n));
      for (const n of [...need]) if (ZL.AN[n]) { need.delete(n); need.add(ZL.AN[n].src); }
      await ZL.load([...need].map(n => [n, src(n)]));
      const fams = [`40px "Gochi Hand"`, `40px "Patrick Hand"`, `40px "Chewy"`, `40px "Creepster"`, `500 40px "Fredoka"`, `700 40px "Fredoka"`];
      await Promise.all(fams.map(f => document.fonts.load(f, 'AaBb09')));
      await document.fonts.ready;
      for (const s of ZL.SCENES) if (s.init) s.init();
      window.__total = ZL.T.duration; window.__assets = need.size;
      window.__ready = true;
      const t0 = parseFloat(q.get('t')); draw(isNaN(t0) ? (all ? 14 : r0) : t0);
    } catch (e) { window.__bootFailed = String(e && e.stack || e); console.error(window.__bootFailed); }
  }
  window.renderFrame = t => ZL.renderFrame(t);
  window.__canvas = cv;
  const seek = document.getElementById('seek'), tc = document.getElementById('tc'), pp = document.getElementById('pp');
  let audio = null, playing = false, cur = 0;
  function draw(t) { cur = t; ZL.renderFrame(t); seek.value = t; tc.textContent = t.toFixed(2); }
  seek.max = String(ZL.T.duration);
  seek.addEventListener('input', () => { draw(parseFloat(seek.value)); if (audio) audio.currentTime = cur; });
  pp.addEventListener('click', () => {
    if (!audio) { audio = new Audio('../audio/song.mp3'); audio.muted = !q.has('sound'); }
    playing = !playing; pp.textContent = playing ? '❚❚' : '▶';
    if (playing) { audio.currentTime = cur; audio.play().catch(() => {}); loop(); } else audio.pause();
  });
  function loop() { if (!playing) return; draw(audio.currentTime); requestAnimationFrame(loop); }
  boot();
})();
