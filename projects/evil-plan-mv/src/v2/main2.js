// v2/main2.js — boot, frame renderer and preview for the dossier-style sample.
'use strict';
(function () {
  const { W, H, P } = EP;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  EP.ctx = ctx;
  const GRAIN = [];
  for (let k = 0; k < 4; k++) {
    const c = EP.mk(640, 360), g = c.getContext('2d'), im = g.createImageData(640, 360), d = im.data, R = EP.rng(77 + k * 13);
    for (let i = 0; i < d.length; i += 4) { const v = 128 + (R() - 0.5) * 110; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    g.putImageData(im, 0, 0); GRAIN.push(c);
  }
  EP.renderFrame = t => {
    const g = ctx; EP.reset(g);
    EP.WD.render(g, t);
    EP.reset(g);
    g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.09; g.drawImage(GRAIN[Math.floor(t * 24) % 4], 0, 0, W, H);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    const S = EP.SAMPLE, f = Math.max(1 - P(t, S.from, S.from + 0.45), P(t, S.to - 0.5, S.to));
    if (f > 0) { g.globalAlpha = f; g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
  };
  const q = new URLSearchParams(location.search);
  if (q.has('render')) document.body.classList.add('render');
  const GEN = ['bg_castle', 'bg_throne', 'bg_meeting', 'bg_park', 'bg_lair', 'bg_hands', 'bg_stage'];
  const CUT = ['spr_hips', 'spr_laugh', 'spr_burglar', 'spr_point', 'spr_stamp', 'spr_phone', 'spr_villain', 'spr_heart', 'spr_jar', 'spr_peace', 'spr_open', 'spr_dance', 'spr_fan', 'spr_float', 'spr_pointcam'];
  async function boot() {
    try {
      await EP.load(GEN.map(n => [n, '../assets/gen/' + n + '.png']).concat(CUT.map(n => ['cut/' + n, '../assets/cut/' + n + '.png'])));
      const fams = ['780 40px Fraunces', '900 40px Fraunces', 'italic 900 40px Fraunces', 'italic 780 40px Fraunces', '700 40px Caveat', '40px "Special Elite"', '800 40px Nunito', '900 40px Nunito'];
      await Promise.all(fams.map(f => document.fonts.load(f, 'AaBb09')));
      await document.fonts.load('400 40px "LXGW WenKai"', EP.T.lines.slice(5, 32).map(l => l.zh).join(''));
      await document.fonts.ready;
      window.__total = EP.SAMPLE.to; window.__start = EP.SAMPLE.from;
      window.__ready = true;
      const t0 = parseFloat(q.get('t')); draw(isNaN(t0) ? EP.SAMPLE.from + 1 : t0);
    } catch (e) { window.__bootFailed = String(e && e.stack || e); console.error(window.__bootFailed); }
  }
  window.renderFrame = t => EP.renderFrame(t);
  window.__canvas = cv;
  const seek = document.getElementById('seek'), tc = document.getElementById('tc'), pp = document.getElementById('pp');
  let audio = null, playing = false, cur = 0;
  function draw(t) { cur = t; EP.renderFrame(t); seek.value = t; tc.textContent = t.toFixed(2); }
  seek.min = String(EP.SAMPLE.from); seek.max = String(EP.SAMPLE.to);
  seek.addEventListener('input', () => { draw(parseFloat(seek.value)); if (audio) audio.currentTime = cur; });
  pp.addEventListener('click', () => {
    if (!audio) { audio = new Audio('../audio/song.mp3'); audio.muted = !q.has('sound'); }
    playing = !playing; pp.textContent = playing ? '❚❚' : '▶';
    if (playing) { audio.currentTime = cur; audio.play().catch(() => {}); loop(); } else audio.pause();
  });
  function loop() { if (!playing) return; draw(audio.currentTime); requestAnimationFrame(loop); }
  boot();
})();
