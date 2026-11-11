// v2/main_web.js — the web version's boot (built by tools/build_web.py from main_full.js): the same frame renderer
// with film grain, bloom and colour grade, a loader with progress, and the player driven by the song.
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
  EP.ASSETS = EP.ASSETS || [];
  EP.overlays = EP.overlays || [];
  const F = window.WEBFILES || {};
  const src = n => { const i = n.indexOf('/'), d = i < 0 ? 'gen' : n.slice(0, i), k = d + '/' + (i < 0 ? n : n.slice(i + 1)); return 'img/' + k + (F[k] || '.png'); };
  const $ = id => document.getElementById(id);
  const ui = { stage: $('stage'), load: $('load'), bar: $('loadbar'), count: $('loadcount'), big: $('big'), pp: $('pp'), seek: $('seek'), fill: $('fill'), cur: $('tcur'), dur: $('tdur'), fs: $('fs'), chap: $('chapters'), now: $('nowchap') };
  const fmt = s => { s = Math.max(0, s); return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0'); };
  const CHAPTERS = window.CHAPTERS || [];
  let audio = null, playing = false, cur = 1.6, ready = false;
  function draw(t) {
    cur = t; EP.renderFrame(t);
    const p = t / EP.T.duration; ui.fill.style.width = (p * 100).toFixed(3) + '%'; ui.seek.value = t; ui.cur.textContent = fmt(t);
    let c = 0; for (let k = 0; k < CHAPTERS.length; k++) if (CHAPTERS[k][0] <= t) c = k;
    if (ui.now.dataset.k !== String(c)) { ui.now.dataset.k = String(c); ui.now.textContent = CHAPTERS[c] ? CHAPTERS[c][1] : '';
      ui.chap.querySelectorAll('button').forEach((b, k) => b.setAttribute('aria-current', k === c ? 'true' : 'false')); }
  }
  function setPlaying(on) {
    if (!ready) return;
    if (!audio) { audio = new Audio('audio/song.mp3'); audio.preload = 'auto'; audio.addEventListener('ended', () => { setPlaying(false); draw(EP.T.duration - 0.05); }); }
    playing = on; document.body.classList.toggle('playing', on); if (on) document.body.classList.add('started'); ui.pp.setAttribute('aria-label', on ? '暂停' : '播放');
    if (on) { if (cur >= EP.T.duration - 0.2) cur = 0; audio.currentTime = cur; audio.play().catch(() => { playing = false; document.body.classList.remove('playing'); }); requestAnimationFrame(loop); }
    else audio.pause();
  }
  // Each scene builds its caches (stickers, cards, text) the first time it is drawn, which can take a few hundred ms.
  // Warm the film ahead of the playhead in the background: in batches while paused, one spare frame per display frame
  // while playing; the current frame is always drawn last, so a warm-up frame is never what gets shown.
  let warmT = 0, lastCost = 0;
  const warmOne = () => { if (warmT < cur + 1.5) warmT = cur + 1.5; if (warmT >= EP.T.duration) return false; EP.renderFrame(warmT); warmT += 0.5; return true; };
  function idleWarm() {
    if (!ready) return;
    if (!playing) { const a = performance.now(); let any = false; while (performance.now() - a < 40 && warmOne()) any = true; if (any) draw(cur); }
    if (warmT < EP.T.duration) setTimeout(idleWarm, playing ? 400 : 30);
  }
  function loop() {
    if (!playing) return;
    if (lastCost < 12 && warmT < EP.T.duration) warmOne();
    const a = performance.now(); draw(audio.currentTime); lastCost = performance.now() - a; lastFrame = a;
    requestAnimationFrame(loop);
  }
  // if animation frames stall (a throttled or embedded view), keep the picture following the song at ~5 fps
  let lastFrame = 0;
  setInterval(() => { if (playing && performance.now() - lastFrame > 400) { draw(audio.currentTime); lastFrame = performance.now(); } }, 200);
  function seekTo(t) { t = Math.min(EP.T.duration - 0.05, Math.max(0, t)); if (audio) audio.currentTime = t; if (!playing) draw(t); else cur = t; }
  ui.big.addEventListener('click', () => setPlaying(true));
  ui.pp.addEventListener('click', () => setPlaying(!playing));
  ui.seek.addEventListener('input', () => seekTo(parseFloat(ui.seek.value)));
  ui.fs.addEventListener('click', () => { const el = ui.stage; if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); else if (el.requestFullscreen) el.requestFullscreen().catch(() => {}); });
  document.addEventListener('keydown', e => {
    if (!ready || e.target.closest('button') && e.key === ' ') return;
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); setPlaying(!playing); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); seekTo(cur + 5); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); seekTo(cur - 5); }
    else if (e.key === 'f') ui.fs.click();
  });
  CHAPTERS.forEach(([t, name], k) => {
    const b = document.createElement('button'); b.type = 'button'; b.innerHTML = '<span class="ct">' + fmt(t) + '</span><span class="cn">' + name + '</span>';
    b.addEventListener('click', () => { seekTo(t + 0.01); if (!playing) setPlaying(true); }); ui.chap.appendChild(b);
    const m = document.createElement('i'); m.className = 'tick'; m.style.left = (t / 375.94 * 100) + '%'; ui.seek.parentNode.appendChild(m);
  });
  async function boot() {
    try {
      WD.finalize();
      const need = new Set(EP.ASSETS);
      for (const s of WD.spreads) (typeof s.img === 'function' ? s.img() : s.img || []).forEach(n => need.add(n));
      const list = [...need]; let done = 0;
      const tick = () => { done++; ui.bar.style.width = (done / list.length * 100).toFixed(1) + '%'; ui.count.textContent = done + ' / ' + list.length; };
      await Promise.all(list.map(n => new Promise(res => {
        const im = new Image(), url = src(n);
        im.onload = () => { EP.img[n] = im; tick(); res(); if (im.decode) im.decode().catch(() => {}); };   // decode() can wait for a visible tab
        im.onerror = () => { console.error('image failed: ' + url); tick(); res(); };
        im.src = url;
      })));
      const fams = ['780 40px Fraunces', '900 40px Fraunces', 'italic 900 40px Fraunces', 'italic 780 40px Fraunces', '700 40px Caveat', '40px "Special Elite"', '800 40px Nunito', '900 40px Nunito', '400 40px "Pirata One"'];
      await Promise.all(fams.map(f => document.fonts.load(f, 'AaBb09')));
      await document.fonts.load('400 40px "LXGW WenKai"', EP.T.lines.map(l => l.zh).join('') + (EP.ZH_EXTRA || ''));
      await document.fonts.ready;
      ui.dur.textContent = fmt(EP.T.duration); ui.seek.max = String(EP.T.duration);
      ready = true; document.body.classList.add('ready'); draw(cur); setTimeout(idleWarm, 200);
    } catch (e) { console.error(e); ui.count.textContent = '载入失败，请刷新重试'; }
  }
  window.renderFrame = t => EP.renderFrame(t);
  boot();
})();
