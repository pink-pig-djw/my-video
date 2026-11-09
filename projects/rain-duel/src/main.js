/* 启动、镜头调度、后期合成。 */
const PLATES = ['bg_wide', 'bg_deck', 'bg_sky', 'bg_below', 's_standoff', 's_clash', 's_jin_eye', 's_ling_eye', 's_jin_eye_c', 's_ling_eye_c',
  's_bell', 's_jin_thumb', 's_ling_hand', 's_jin_name', 's_ling_name', 's_im_a', 's_ling_cheek', 's_ling_field', 's_jin_glare', 'train_front',
  's_overhead', 's_jin_slash', 's_flash', 's_ling_eye_under', 's_jin_whitehot', 's_combo_a', 's_leap', 's_final', 's_blade', 's_dawn',
  'k_jin_walk', 'k_ling_stand', 'k_jin_dash', 'k_ling_dash', 'k_exchange_a', 'k_exchange_b', 'k_jin_swing', 'k_ling_dive', 'k_jin_deflect',
  'k_ling_fall', 'k_train_a', 'k_train_b', 'k_ling_under', 'k_ling_rise', 'k_jin_vortex'];
const SPRITES = ['sp_jin_0', 'sp_jin_1', 'sp_jin_2', 'sp_jin_3', 'sp_ling_0', 'sp_ling_1', 'sp_ling_2', 'sp_ling_3', 'sp_braid_0'];
let SHOTS = [];

async function boot() {
  CUES = await (await fetch('cues.json')).json();
  window.__total = CUES.total;
  SHOTS = CUES.shots.map(s => ({ ...s, d: s.t1 - s.t0 }));
  try { CLIPS = await (await fetch('../assets/frames/index.json')).json(); } catch (e) { CLIPS = {}; }
  makeSprites();
  await Promise.all([
    ...PLATES.map(loadPlate),
    ...SPRITES.map(async n => { SPR[n] = await load(`../assets/cut/${n}.png`).catch(() => null); }),
  ]);
  await document.fonts.load(`300px ${SERIF}`, '烬澪雨').catch(() => 0);
  window.__ready = true;
  const p = new URLSearchParams(location.search);
  if (!p.get('render')) {
    const t = parseFloat(p.get('t') || '0');
    if (p.get('play')) play(t); else window.renderFrame(t);
  }
}
function shotAt(T) {
  let lo = 0, hi = SHOTS.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (SHOTS[m].t0 <= T + 1e-9) lo = m; else hi = m - 1; }
  return SHOTS[lo];
}
function drawShot(g, T) {
  const S = shotAt(T);
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none';
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const f = SH[S.id];
  if (f) f(g, T - S.t0, S, T);
  g.restore();
}
async function paint(g, T) {
  for (let pass = 0; pass < 3; pass++) {
    drawShot(g, T);
    if (!missing.size) return;
    await fetchMissing();
  }
}
/** 遮幅：2.39:1，决战段打开到全画幅，最后一刀收回。 */
function barH(T) {
  const full = (H - W / 2.39) / 2;
  const open = outx(prog(T, B(160), B(160) + .3), 3) * (1 - (T >= B(212) ? 1 : 0));
  return full * (1 - open);
}
function post(T, S, src) {
  const [sx, sy, sr] = shakeAt(T);
  const mul = S.id === 's56' || S.id === 's44' ? 0 : 1;
  ctx.save();
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.translate(W / 2 + sx * mul, H / 2 + sy * mul); ctx.rotate(sr * mul);
  const z = 1 + .03 * mul * Math.min(1, Math.hypot(sx, sy) / 10);
  ctx.scale(z, z);
  ctx.drawImage(src, -W / 2, -H / 2);
  ctx.restore();
  // 冲击时的色散
  let ca = 0;
  for (const e of CUES.events) if (['clash', 'hit', 'slash'].includes(e.kind) && T >= e.t && T - e.t < .5) ca = Math.max(ca, 16 * e.gain * Math.exp(-(T - e.t) * 9));
  chroma(ctx, ca);
  // 光晕：只取亮部
  small.filter = 'brightness(.62) contrast(3.2) blur(5px)';
  small.drawImage(cv, 0, 0, 480, 270);
  small.filter = 'none';
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = .5; ctx.drawImage(SMALL, 0, 0, W, H); ctx.restore();
  // 暗角和颗粒
  ctx.drawImage(VIG, 0, 0);
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = .14;
  ctx.drawImage(GRAIN[Math.floor(T * 24) % GRAIN.length], 0, 0, W, H); ctx.restore();
  const bh = barH(T);
  if (bh > .5) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bh); ctx.fillRect(0, H - bh, W, bh); }
}
SHUT.s15 = 3; SHUT.s13 = 2; SHUT.s14 = 2; SHUT.s37 = 2; SHUT.s50 = 2; SHUT.s21 = 2; SHUT.s27 = 2;
window.renderFrame = async T => {
  const S = shotAt(T);
  const k = SHUT[S.id] || 1;
  if (k === 1) { await paint(sc, T); post(T, S, SC); return; }
  for (let i = 0; i < k; i++) {
    await paint(sc, T + (i / k) * (.5 / 24));
    acc.globalAlpha = 1 / (i + 1); acc.drawImage(SC, 0, 0);
  }
  acc.globalAlpha = 1;
  post(T, S, ACC);
};
window.__shotList = () => SHOTS.map(s => [s.id, s.t0, s.t1]);
async function play(t0) {
  const a = new Audio('../audio/song.wav'); a.currentTime = t0; await a.play().catch(() => 0);
  const st = performance.now() - t0 * 1000;
  const step = async () => { const t = (performance.now() - st) / 1000; if (t > CUES.total) return; await window.renderFrame(t); requestAnimationFrame(step); };
  step();
}
boot().catch(e => { window.__bootFailed = String(e && e.stack || e); console.error(e); });
