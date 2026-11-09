/* 《雨烬》逐镜头。每个镜头是 (g, lt, S, T) → 画面，lt 是镜头内时间，S.d 是镜头时长，T 是全片时间。 */
const RAIN = (g, T, o = {}) => rain(g, T, { n: 520, ...o });
const RAIN_NEAR = (g, T, o = {}) => rain(g, T, { n: 40, z0: 1, z1: 1.5, len: 230, w: 2.4, a: .16, seed: 11, speed: 2900, ...o });
const F = 1 / 24;
/** 冲击帧：te 之后的头两帧做反色 / 高反差黑白 / 双色。 */
function imp(g, T, te, style = 'inv', col = '#ff5a2a') {
  const d = T - te;
  if (d < -1e-6 || d >= 2 * F - 1e-6) return;
  if (style === 'inv') invert(g);
  else if (style === 'mono') mono(g);
  else if (style === 'duo') duo(g, col);
  else if (style === 'invmono') { if (d < F) invert(g); else mono(g); }
}
const punch = (T, te, amt = .12, k = 9) => T < te ? 0 : amt * Math.exp(-(T - te) * k);
const fl = (T, te, a = 1, k = 8) => T < te ? 0 : a * Math.exp(-(T - te) * k);
/** 冲击帧之后才开始的白闪（冲击帧本身保持干净的反色/黑白）。 */
const flAfter = (T, te, a = 1, k = 8) => T < te + 2 * F - 1e-6 ? 0 : a * Math.exp(-(T - te - 2 * F) * k);

const SH = {};
const SHUT = {};   // 需要多重采样运动模糊的镜头

// ================= A 冷开场 =================
SH.s01 = (g, lt, S, T) => {
  const u = lt / S.d, tl = B(2.6);
  const m = plate(g, 'bg_wide', { fx: .5, fy: .52, z: lerp(1.0, 1.07, io(u)) });
  ripples(g, T, { n: 70, box: [0, H * .7, W, H], a: .4, persp: .18 });
  embers(g, T, { n: 0 });
  const [sx, sy] = m(.49, .33);
  glow(g, sx, sy, 60 + 10 * Math.sin(T * 5), .55, '255,40,30');
  for (let i = 0; i < 4; i++) { const [nx, ny] = m([.18, .3, .74, .9][i], [.78, .8, .82, .76][i]); glow(g, nx, ny, 90, .18 * (.6 + .4 * Math.sin(T * (7 + i * 3) + i)), i % 2 ? '60,230,255' : '255,60,90'); }
  for (let k = 0; k < 6; k++) puff(g, ((k * 420 + T * 40) % (W + 800)) - 400, H * (.55 + .06 * (k % 3)), 420, .08, k);
  RAIN(g, T, { n: 650, z1: .8, a: .3 });
  const fu = fl(T, tl, 1, 5);
  if (T >= tl && T < tl + .45) bolt(g, 41, W * .63, -20, W * .6, H * .34, (1 - prog(T, tl, tl + .45)) * (T - tl < .06 || (T - tl > .12 && T - tl < .2) ? 1 : .4), { disp: 200 });
  tint(g, '#9fb4ff', fu * .6, 'screen');
  dim(g, T < tl ? lerp(1, .55, prog(lt, 0, .5)) : lerp(.55, .2, prog(T, tl, tl + .4)) - fu * .4);
};
SH.s02 = (g, lt, S, T) => {
  const u = lt / S.d;
  clipOr(g, 'v_jin_walk', .4 + lt, 'k_jin_walk', { fx: .5, fy: .5, z: lerp(1.0, 1.05, u), oy: lerp(140, 150, u) });
  splashes(g, T, { n: 40, box: [W * .15, H * .82, W * .85, H * 1.02], a: .55, size: 1.3 });
  RAIN(g, T, { a: .26 }); RAIN_NEAR(g, T);
  dim(g, .08);
};
SH.s03 = (g, lt, S, T) => {
  const u = lt / S.d;
  clipOr(g, 'v_ling_stand', .5 + lt, 'k_ling_stand', { fx: .5, fy: .5, z: lerp(1.0, 1.08, io(u)), oy: lerp(130, 40, io(u)) });
  RAIN(g, T, { a: .28, seed: 3 }); RAIN_NEAR(g, T, { seed: 5 });
};
SH.s04 = (g, lt, S, T) => {
  const te = B(21.6) - S.t0, u = lt / S.d;
  const m = plate(g, 's_bell', { fx: .55, fy: .62, z: lerp(1.25, 1.33, u) });
  const [bx, by] = m(.57, .73), [dx, dy] = m(.535, .47);
  const fy = lt < te ? lerp(dy, by - 70, inx(lt / te, 2)) : null;
  if (fy !== null) { g.save(); g.fillStyle = 'rgba(220,240,255,.9)'; g.beginPath(); g.ellipse(dx + 6, fy, 7, 11, 0, 0, TAU); g.fill(); g.restore(); glow(g, dx + 4, fy - 4, 14, .7); }
  sparks(g, T, S.t0 + te, bx - 10, by - 70, { n: 26, v0: 120, v1: 520, grav: 2200, life: .45, col: '170,215,255', hot: '235,250,255', w: 2, spread: 2.4 });
  glow(g, bx + 18, by - 22, 120, fl(lt, te, .9, 4), '255,210,140');
  flare(g, bx + 18, by - 22, 420, fl(lt, te, .5, 3), '255,200,140');
  RAIN(g, T, { n: 260, a: .18, z1: .6, speed: 1600 });
};

// ================= B 对峙 =================
SH.s05 = (g, lt, S, T) => {
  const u = lt / S.d;
  const m = plate(g, 's_standoff', { fx: .5, fy: .45, z: lerp(1.08, 1.0, io(u)) });
  const [sx, sy] = m(.5, .21), blink = Math.sin(T * 2 * Math.PI * .9) > -.2 ? 1 : .25;
  glow(g, sx, sy, 140, .5 * blink, '255,30,20'); flare(g, sx, sy, 340, .35 * blink, '255,60,50');
  ripples(g, T, { n: 50, box: [0, H * .78, W, H], a: .35, persp: .15 });
  RAIN(g, T, { n: 620, a: .28 });
  if (lt > .9 && lt < 1.15) tint(g, '#b0c0ff', .25 * (1 - prog(lt, .9, 1.15)), 'screen');
};
function eyeShot(g, lt, S, T, closed, open, te, pal, eyes) {
  const u = lt / S.d;
  const name = lt < te ? closed : open;
  const z = lerp(1.04, 1.12, io(u)) + punch(lt, te, .05, 6);
  const m = plate(g, name, { fx: .5, fy: .55, z });
  if (lt >= te && lt < te + F) { g.save(); g.globalAlpha = .5; plate(g, closed, { fx: .5, fy: .55, z }); g.restore(); }
  const k = fl(lt, te, 1, 3);
  for (const [ex, ey] of eyes) { const [x, y] = m(ex, ey); glow(g, x, y, 160, .45 * k, pal.rgb); }
  RAIN_NEAR(g, T, { n: 26, a: .2 });
  rain(g, T, { n: 120, a: .14, z0: .2, z1: .5 });
}
SH.s06 = (g, lt, S, T) => eyeShot(g, lt, S, T, 's_jin_eye_c', 's_jin_eye', B(29) - S.t0, JIN, [[.33, .55], [.69, .55]]);
SH.s07 = (g, lt, S, T) => eyeShot(g, lt, S, T, 's_ling_eye_c', 's_ling_eye', B(32) - S.t0, LING, [[.3, .58], [.7, .58]]);
SH.s08 = (g, lt, S, T) => {
  const te = B(34.6) - S.t0, u = lt / S.d;
  const m = plate(g, 's_jin_thumb', { fx: .45, fy: .45, z: lerp(1.08, 1.18, io(u)) + punch(lt, te, .04) });
  const [bx, by] = m(.43, .5);
  glow(g, bx, by, 260, .3 + .5 * outx(prog(lt, te, te + .3)), JIN.rgb);
  for (let k = 0; k < 10; k++) steam(g, T, S.t0 + te + k * .07, bx + (k % 3 - 1) * 40, by - 20, { n: 4, seed: 3 + k, r0: 30, r1: 160, life: 1.1, a: .35, rise: 160 });
  sparks(g, T, S.t0 + te, bx, by, { n: 20, v0: 200, v1: 900, life: .4 });
  RAIN(g, T, { n: 300, a: .2 }); RAIN_NEAR(g, T, { n: 18 });
};
SH.s09 = (g, lt, S, T) => {
  const u = lt / S.d;
  const m = plate(g, 's_ling_hand', { fx: .62, fy: .45, z: lerp(1.05, 1.13, io(u)) });
  const [tau, rate] = warp(lt, [[0, 1], [.15, 0]], .5);
  rain(g, 30 + tau, { n: 700, a: .32, slow: rate, glint: 1.4, col: '190,235,255', seed: 21 });
  const [hx, hy] = m(.78, .4);
  glow(g, hx, hy, 260, .25 + .15 * Math.sin(T * 6), LING.rgb);
};
SH.s10 = (g, lt, S, T) => {
  const u = lt / S.d;
  plate(g, 's_jin_name', { fx: .4, fy: .45, z: lerp(1.04, 1.1, u), ox: lerp(20, -20, u) });
  embers(g, T, { n: 70, box: [0, H * .2, W * .6, H * .8], a: .9 });
  RAIN(g, T, { n: 380, a: .22, seed: 8 });
  dim(g, .05);
  nameCard(g, lt, '烬', 'J I N', '余 烬 之 刃', JIN, W * .6, H * .62);
};
SH.s11 = (g, lt, S, T) => {
  const u = lt / S.d;
  plate(g, 's_ling_name', { fx: .6, fy: .45, z: lerp(1.04, 1.1, u), ox: lerp(-20, 20, u) });
  beadField(g, T, { n: 260, seed: 12, a: .7, area: [0, 0, W * .6, H] });
  RAIN(g, T, { n: 380, a: .22, seed: 9 });
  nameCard(g, lt, '澪', 'L I N G', '止 雨 之 人', LING, W * .4, H * .62, 'right');
};
SH.s12 = (g, lt, S, T) => {
  const u = lt / S.d, te = 0;
  plate(g, 'bg_deck', { fx: .5, fy: .5, z: lerp(1.0, 1.25, inx(u, 2)) });
  RAIN(g, T, { n: 500, a: .3 });
  const px = W * .5, py = H * .66;
  if (lt < .3) bolt(g, 77, W * .52, -40, px, py, 1 - lt / .3, { disp: 300, w: 5 });
  glow(g, px, py, 420, fl(lt, 0, 1, 4), '200,210,255');
  sparks(g, T, S.t0, px, py, { n: 90, v0: 500, v1: 2400, life: .6 });
  steam(g, T, S.t0 + .05, px, py, { n: 12, r1: 420, a: .5 });
  imp(g, T, S.t0, 'inv');
  tint(g, '#c8d4ff', flAfter(lt, 0, 1, 6), 'screen');
};

// ================= C 初交锋 =================
SH.s13 = (g, lt, S, T) => {
  const u = lt / S.d;
  clipOr(g, 'v_jin_dash', .2 + lt * 1.2, 'k_jin_dash', { fx: .55, fy: .3, z: lerp(1.0, 1.45, inx(u, 2)), oy: 130 * (1 - inx(u, 2)) });
  splashes(g, T, { n: 50, box: [W * .2, H * .78, W * .9, H], a: .6, size: 1.6, rate: 2 });
  speedLines(g, T, Math.PI / 2 + .1, { n: 30, a: .12, len: 500 });
  RAIN(g, T, { slow: 1, a: .3 }); RAIN_NEAR(g, T);
};
SH.s14 = (g, lt, S, T) => {
  const u = lt / S.d;
  clipOr(g, 'v_ling_dash', .2 + lt * 1.2, 'k_ling_dash', { fx: .45, fy: .3, z: lerp(1.0, 1.45, inx(u, 2)), oy: 120 * (1 - inx(u, 2)) });
  splashes(g, T, { n: 50, box: [W * .1, H * .78, W * .8, H], a: .6, size: 1.6, rate: 2, seed: 7 });
  RAIN(g, T, { a: .3, seed: 6 }); RAIN_NEAR(g, T, { seed: 9 });
};
SH.s15 = (g, lt, S, T) => {
  const u = lt / S.d;
  for (let i = 0; i < 5; i++) plate(g, 's_standoff', { fx: .5 + i * .004, fy: .44, z: 2.1, blur: 2, bright: .8 - i * .05 });
  speedLines(g, T, 0, { n: 70, a: .25, speed: 9000, len: 900 });
  const xj = lerp(-W * .15, W * .36, outx(u, 1.6)), xl = lerp(W * 1.15, W * .64, outx(u, 1.6));
  spriteBlur(g, 'sp_jin_0', xj, H * .62, 520, 220, 0);
  spriteBlur(g, 'sp_ling_0', xl, H * .62, 500, -220, 0);
  for (const [x, s] of [[xj - 120, 3], [xl + 120, 4]]) sparks(g, T, S.t0 + lt - .01, x, H * .86, { n: 0 });
  splashes(g, T, { n: 40, box: [0, H * .82, W, H * .9], a: .6, size: 1.4, rate: 3 });
  RAIN(g, T, { ang: .5, a: .3, speed: 3000 });
};
SH.s16 = (g, lt, S, T) => {
  const te = S.t0, u = lt / S.d;
  const z = 1.12 + punch(T, te, .18, 7) - .05 * u;
  const m = plate(g, 's_clash', { fx: .52, fy: .4, z });
  const [cx, cy] = m(.52, .32);
  RAIN(g, T, { n: 600, a: .3, push: [cx, cy, 900, 500 * outx(prog(lt, 0, .3))] });
  shockwave(g, cx, cy, lerp(40, 1500, outx(prog(lt, 0, .6), 2)), 1 - prog(lt, .2, .7), { w: 90, k: .08 });
  sparks(g, T, te, cx, cy, { n: 140, v0: 600, v1: 3000, spread: TAU, life: .7, w: 2.8 });
  glow(g, cx, cy, 500, flAfter(lt, 0, 1, 5), '255,220,170');
  imp(g, T, te, 'invmono');
  flash(g, flAfter(lt, 0, .7, 14));
};
SH.s17 = (g, lt, S, T) => {
  const u = lt / S.d;
  const m = plate(g, 'bg_wide', { fx: .5, fy: .45, z: 1.18 - .04 * u });
  const [cx, cy] = m(.47, .4);
  const r = lerp(30, 1000, outx(prog(lt, 0, .8), 2.5));
  RAIN(g, T, { n: 700, a: .3, hole: [cx, cy, r * .85] });
  shockwave(g, cx, cy, r, 1 - prog(lt, .25, .8), { w: 50, sq: .5, k: .07, rgb: '220,235,255', ring: .12 });
  for (let i = 0; i < 220; i++) {                       // 被推开的水雾
    const a = hash(i * 2.3) * TAU, rr = r * (.75 + .35 * hash(i * 5.1));
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * .5 - 40 * hash(i);
    g.fillStyle = `rgba(215,235,255,${.5 * (1 - prog(lt, .2, .8)) * hash(i * 7.7)})`;
    g.beginPath(); g.arc(x, y, 1.5 + 3 * hash(i * 9.1), 0, TAU); g.fill();
  }
  steam(g, T, S.t0, cx, cy, { n: 16, r0: 40, r1: 420, a: .35, rise: 20, spread: 1.4 });
  sparks(g, T, S.t0, cx, cy, { n: 70, v0: 300, v1: 1200, spread: TAU, life: .6, scale: .6 });
  glow(g, cx, cy, 220, fl(lt, 0, .8, 4), '255,200,150');
};
SH.s18 = (g, lt, S, T) => {
  const u = lt / S.d;
  // 片段 1.25 s 和 2.5 s 是两次刀刃相碰，按 1.5 倍速放，让它们落在第 59、61 拍
  const still = lt < 1.25 ? 'k_exchange_a' : 'k_exchange_b';
  clipOr(g, 'v_exchange', .625 + 1.5 * lt, still, { fx: .5, fy: .42, z: lerp(1.06, 1.0, u) });
  for (const b of [59, 61]) glow(g, W * .62, H * .38, 420, fl(T, B(b), .6, 7), '255,210,150');
  RAIN_NEAR(g, T, { n: 20, a: .14 });
  rain(g, T, { n: 220, a: .16, z1: .6 });
};
SH.s19 = (g, lt, S, T) => {
  const m = plate(g, 's_clash', { fx: .27, fy: .36, z: 2.0 + .08 * lt });
  const flick = .5 + .5 * Math.sin(T * 50) * Math.sin(T * 23);
  tint(g, '#ff9a40', .35 * flick, 'soft-light');
  sparks(g, T, S.t0, W * .8, H * .45, { n: 80, ang: Math.PI, spread: 1.3, v0: 900, v1: 2600, life: .6 });
  RAIN_NEAR(g, T, { n: 20 });
};
SH.s20 = (g, lt, S, T) => {
  plate(g, 's_clash', { fx: .73, fy: .32, z: 2.0 + .08 * lt });
  const flick = .5 + .5 * Math.sin(T * 47) * Math.sin(T * 19);
  tint(g, '#ffb070', .3 * flick, 'soft-light');
  sparks(g, T, S.t0, W * .15, H * .45, { n: 80, ang: 0, spread: 1.3, v0: 900, v1: 2600, life: .6, seed: 4 });
  RAIN_NEAR(g, T, { n: 20, seed: 3 });
};
SH.s21 = (g, lt, S, T) => {
  const u = lt / S.d, d = outx(prog(lt, 0, 1.4), 2.2);
  plate(g, 's_standoff', { fx: lerp(.6, .45, d), fy: .43, z: 2.3, blur: 1.5 });
  const x = lerp(W * .85, W * .3, d), y = H * .6;
  const pos = t => [lerp(W * .85, W * .3, outx(prog(t - S.t0, 0, 1.4), 2.2)) - 255, y + 175];
  sparkStream(g, T, S.t0, S.t0 + 1.3, pos, { n: 7, ang: -Math.PI * .85, spread: .8, v0: 400, v1: 1500, life: .45 });
  spriteW(g, 'sp_jin_1', x, y, 820, { ax: .55, ay: .55 }, T, { amp: 14, dir: 'y', from: .35, speed: 14, freq: 1.6 });
  splashes(g, T, { n: 60, box: [x - 200, y + 230, x + 300, y + 280], a: .7, size: 1.6, rate: 3 });
  glow(g, pos(T)[0], pos(T)[1], 160, .7 * (1 - prog(lt, 1.2, 1.5)), JIN.rgb);
  flash(g, fl(lt, 0, .6, 12));
  RAIN(g, T, { a: .28 });
};
SH.s22 = (g, lt, S, T) => {
  const te = B(73.5) - S.t0, u = lt / S.d;
  // 片段里刀光在 ~1.1 s 成形，对到第 73.5 拍
  const has = !!CLIPS.v_jin_swing;
  clipOr(g, 'v_jin_swing', .5 + lt, 'k_jin_swing', { fx: .5, fy: .5, z: lerp(1.08, 1.0, u), oy: 60 });
  if (!has) slashArc(g, W * .5, H * .58, W * .48, Math.PI * 1.05, Math.PI * 2.1, prog(lt, te - .12, te + .1) + prog(lt, te + .1, te + .5), JIN, { width: 110, sq: .35 });
  embers(g, T, { n: 60, box: [W * .1, H * .3, W * .8, H * .5], a: .8 * prog(lt, te, te + .2) });
  glow(g, W * .5, H * .55, 700, fl(lt, te, .45, 4), JIN.rgb);
  RAIN_NEAR(g, T, { n: 16, a: .14 });
};
SH.s23 = (g, lt, S, T) => {
  const u = lt / S.d;
  const m = plate(g, 'bg_deck', { fx: .5, fy: .5, z: 1.08 });
  // 月牙刀光向远处飞，切断右侧电线杆
  const cut = B(77) - S.t0, k = prog(lt, cut, cut + .4);
  const [px0, py0] = m(.93, .0), [px1, py1] = m(.93, .58);
  if (lt > cut) {
    snap.drawImage(g.canvas, 0, 0);
    g.save(); g.fillStyle = '#0b1220'; g.globalAlpha = .9; g.fillRect(px0 - 120, py0, 240, py1 * .42); g.restore();
    g.save(); g.beginPath(); g.rect(px0 - 140, 0, 280, H * .4); g.clip();
    g.translate(140 * k, 260 * inx(k, 2)); g.rotate(.18 * k); g.drawImage(SNAP, 0, 0); g.restore();
    sparks(g, T, S.t0 + cut, px0, H * .4, { n: 60, v0: 300, v1: 1300, spread: TAU, life: .5 });
  }
  const ax = lerp(W * .1, W * 1.05, prog(lt, 0, .5)), ay = lerp(H * .62, H * .4, prog(lt, 0, .5));
  slashArc(g, ax, ay, 260, -1.3, 1.3, 1, JIN, { width: 70 * (1 - prog(lt, .4, .6)), tail: .9, sq: 1 });
  embers(g, T, { n: 40, box: [ax - 300, ay - 200, 400, 400], a: .9 * (1 - prog(lt, .4, .8)) });
  const ly = H * .55 - 380 * Math.sin(Math.PI * clamp(u * 1.1));
  spriteW(g, 'sp_ling_1', lerp(W * .3, W * .7, u), ly, 420, { rot: lerp(-.8, .8, u) }, T, { amp: 10, dir: 'x', from: 0, speed: 14 });
  RAIN(g, T, { a: .3, hole: [ax, ay, 200] });
};
SH.s24 = (g, lt, S, T) => {
  const u = lt / S.d;
  plate(g, 'bg_sky', { fx: .5, fy: .5, z: 1.15 + .05 * u, blur: 1 });
  const [tau, rate] = warp(lt, [[0, .15]]);
  rain(g, 40 + tau, { n: 500, a: .3, slow: .15, glint: 1, ang: 0 });
  spriteW(g, 'sp_ling_1', W * .5, H * .5, 760, { rot: Math.PI * .1 + lt * .4 }, T * .35, { amp: 14, dir: 'x', from: .0, speed: 10, freq: 1.2 });
  beadField(g, T, { n: 120, a: .6, seed: 33 });
};
SH.s25 = (g, lt, S, T) => {
  const u = lt / S.d;
  clipOr(g, 'v_ling_dive', .6 + lt * 1.4, 'k_ling_dive', CLIPS.v_ling_dive ? { fx: .5, fy: .5, z: 1.02, oy: 40 } : { fx: .5, fy: lerp(.35, .55, u), z: lerp(1.05, 1.5, inx(u, 2)) });
  RAIN_NEAR(g, T, { ang: -.05, a: .14 });
  if (lt > S.d - .3) speedLines(g, T, Math.PI / 2, { n: 50, a: .3 * prog(lt, S.d - .3, S.d) });
};
SH.s26 = (g, lt, S, T) => {
  const k = Math.min(3, Math.floor(lt / B(1) + 1e-6)), te = S.t0 + k * B(1), l = T - te;
  const shots = [['s_im_a', .48, .44, 1.3, false], ['s_clash', .52, .32, 1.9, false], ['s_im_a', .52, .44, 1.6, true], ['k_exchange_a', .78, .3, 2.1, false]];
  const [n, fx, fy, z, flip] = shots[k];
  const m = plate(g, n, { fx, fy, z: z + punch(l, 0, .15, 8), flip });
  const [cx, cy] = [W / 2, H / 2];
  sparks(g, T, te, cx, cy, { n: 120, v0: 700, v1: 2800, spread: TAU, life: .55, seed: k * 7 });
  glow(g, cx, cy, 380, fl(l, 0, 1, 7), '255,215,160');
  focusLines(g, T, cx, cy, { a: .35 * (1 - prog(l, .1, .35)), r0: 300 });
  imp(g, T, te, k % 2 ? 'inv' : 'mono');
};
SH.s27 = (g, lt, S, T) => {
  const d = outx(prog(lt, 0, 1.5), 2);
  plate(g, 'bg_deck', { fx: lerp(.6, .4, d), fy: .6, z: 1.3, blur: 2 });
  const x = lerp(W * .9, W * .35, d), y = H * .66;
  splashes(g, T, { n: 80, box: [x - 250, y + 160, x + 350, y + 260], a: .7, size: 2, rate: 3 });
  spriteW(g, 'sp_ling_3', x, y, 640, { ax: .5, ay: .55 }, T, { amp: 12, dir: 'y', from: .1, speed: 13, freq: 1.4 });
  const pos = t => [lerp(W * .9, W * .35, outx(prog(t - S.t0, 0, 1.5), 2)) + 320, y - 40];
  sparkStream(g, T, S.t0, S.t0 + 1.2, pos, { n: 4, ang: -.3, spread: .8, v0: 300, v1: 900, life: .4, col: '150,220,255', hot: '230,250,255' });
  flash(g, fl(lt, 0, .5, 10));
  RAIN(g, T, { a: .3 });
};
SH.s28 = (g, lt, S, T) => {
  const u = lt / S.d;
  plate(g, 's_ling_cheek', { fx: .45, fy: .4, z: lerp(1.05, 1.18, io(u)) });
  RAIN(g, T, { a: .25 }); RAIN_NEAR(g, T, { n: 22 });
  glow(g, W * .42, H * .42, 90, .25 + .2 * Math.sin(T * 3), '255,120,120');
};

// ================= D 升级 =================
SH.s29 = (g, lt, S, T) => {
  const u = lt / S.d;
  const [tau, rate] = warp(lt, [[0, 1], [.05, 0]], .6);
  const z = lerp(1.0, 1.1, io(u));
  plate(g, 's_ling_field', { fx: .5, fy: .5, z });
  rain(g, 60 + tau, { n: 900, a: .35, slow: rate, glint: 1.6, seed: 31, col: '200,240,255' });
  beadField(g, T, { n: 700, a: .9 * prog(lt, .3, 1.2), zoom: z, seed: 7 });
  tint(g, '#5fe0ff', .12 + .06 * Math.sin(T * 4), 'soft-light');
};
SH.s30 = (g, lt, S, T) => {
  const u = lt / S.d;
  plate(g, 's_jin_glare', { fx: .55, fy: .4, z: lerp(1.1, 1.22, u) });
  beadField(g, T, { n: 260, a: .8, seed: 9, drift: .4 });
  embers(g, T, { n: 40, box: [0, H * .5, W, H * .5], a: .7 });
};
SH.s31 = (g, lt, S, T) => {
  const te = B(102.5) - S.t0, u = lt / S.d;
  const z = lerp(1.05, 1.0, u) + punch(lt, te, .06);
  plate(g, 'bg_deck', { fx: .5, fy: .45, z, bright: .85 });
  if (lt < te) beadField(g, T, { n: 1100, a: 1, seed: 7, drift: .3 });
  else {
    // 水珠拉长成冰针，朝镜头射来
    const k = lt - te;
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    for (let i = 0; i < 360; i++) {
      const a = hash(i * 1.3) * 2 - 1, b = hash(i * 2.9) * 2 - 1, d0 = .2 + .8 * hash(i * 4.4);
      const z0 = clamp((k * (1.2 + hash(i) * 1.6) - d0 * .4) * 1.1, -1, 1.05);
      if (z0 <= 0) continue;
      const p = 1 / (1.06 - z0), p1 = 1 / (1.06 - Math.max(0, z0 - .12));
      const x = W / 2 + a * W * .5 * p * .4, y = H * .48 + b * H * .45 * p * .4, x1 = W / 2 + a * W * .5 * p1 * .4, y1 = H * .48 + b * H * .45 * p1 * .4;
      g.strokeStyle = `rgba(190,240,255,${.8 * clamp(z0 * 3)})`; g.lineWidth = Math.min(1 + p * .9, 12);
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x, y); g.stroke();
    }
    g.restore();
    beadField(g, T, { n: 500, a: 1 - prog(k, 0, .3), seed: 7 });
  }
  focusLines(g, T, W / 2, H * .48, { a: .18 * prog(lt, te, te + .2), col: '200,240,255', r0: 420 });
  tint(g, '#7ad8ff', .15, 'soft-light');
  flash(g, prog(lt, S.d - .15, S.d) * .9);
};
SH.s32 = (g, lt, S, T) => {
  const u = lt / S.d;
  const has = !!CLIPS.v_jin_deflect;
  clipOr(g, 'v_jin_deflect', .3 + lt * 1.3, 'k_jin_deflect', { fx: .48, fy: .5, z: lerp(1.08, 1.0, u), oy: 50 });
  const cx = W * .47, cy = H * .6;
  for (let k = 0; k < 14; k++) {
    const t0 = S.t0 + k * .1, d = T - t0;
    if (d < 0) continue;
    const yy = cy + (hash(k * 3.3) - .5) * 300;
    if (d < .12) { if (!has) slashLine(g, W * 1.05, yy - 80, cx + 120, yy, d / .12, LING, 6); continue; }
    steam(g, T, t0 + .12, cx + 160 + hash(k) * 80, yy, { n: 4, seed: k, r0: 30, r1: 200, life: 1, a: .3, rise: 80 });
    sparks(g, T, t0 + .12, cx + 160, yy, { n: 12, v0: 300, v1: 1100, spread: 2, ang: 0, life: .3, seed: k * 3 });
  }
  if (!has) slashArc(g, cx, cy, 300, lt * 22, lt * 22 + 4.2, 1, JIN, { width: 26, tail: 1, sq: .5 });
  RAIN_NEAR(g, T, { n: 16, a: .14 });
};
SH.s33 = (g, lt, S, T) => {
  const u = lt / S.d;
  plate(g, 'bg_deck', { fx: .5, fy: .5, z: 1.2, bright: .35, blur: 3 });
  // 被刀光从里面照亮的蒸汽：先画白色烟团，再按“中心橙红、边缘深蓝”上色
  aux.globalCompositeOperation = 'source-over'; aux.clearRect(0, 0, W, H);
  for (let i = 0; i < 46; i++) puff(aux, W * hash(i * 2.1) + (hash(i) - .5) * 300 * lt, H * (.05 + .9 * hash(i * 5.5)) - 90 * lt * (.5 + hash(i * 7)), 120 + 260 * hash(i * 3.3), .3 + .25 * hash(i * 9), i);
  aux.globalCompositeOperation = 'source-in';
  const gr = aux.createRadialGradient(W * .45, H * .58, 50, W * .45, H * .58, 1100);
  gr.addColorStop(0, 'rgba(255,175,100,1)'); gr.addColorStop(.3, 'rgba(200,80,45,.9)'); gr.addColorStop(.7, 'rgba(90,60,70,.8)'); gr.addColorStop(1, 'rgba(40,55,80,.7)');
  aux.fillStyle = gr; aux.fillRect(0, 0, W, H); aux.globalCompositeOperation = 'source-over';
  g.drawImage(AUX, 0, 0);
  glow(g, W * .45, H * .58, 260, .35 + .12 * Math.sin(T * 11), JIN.rgb);
  embers(g, T, { n: 50, box: [W * .2, H * .3, W * .5, H * .5], a: .8 });
  const k = inx(u, 2.5);
  glow(g, W * .5, H * .45, 200 + 600 * k, .9 * k, '255,245,225');
  flare(g, W * .5, H * .45, 1200 * k, .5 * k, '170,210,255');
};
SH.s34 = (g, lt, S, T) => {
  const u = lt / S.d;
  const m = plate(g, 'train_front', { fx: .5, fy: .52, z: lerp(1.0, 1.55, inx(u, 1.6)) });
  const [hx, hy] = m(.49, .52);
  RAIN(g, T, { n: 700, a: .32, tint: '255,245,220' });
  glow(g, hx, hy, 300 + 500 * u, .6 + .4 * u, '255,240,210');
  flare(g, hx, hy, 900 + 600 * u, .6, '170,210,255');
  g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(hx, hy, 0, hx, hy, 900); gr.addColorStop(0, 'rgba(255,240,210,.25)'); gr.addColorStop(1, 'rgba(255,240,210,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
  for (let i = 0; i < 3; i++) if (hash(Math.floor(T * 12) + i) > .7) bolt(g, Math.floor(T * 12) * 3 + i, W * (.35 + .3 * hash(i + Math.floor(T * 12))), H * .02, W * (.4 + .2 * hash(i * 7)), H * .2, .6, { disp: 80, w: 1.5, branches: 1, rgb: '120,180,255' });
  flash(g, prog(lt, S.d - .12, S.d), '#fff6e0');
};
function trainCars(g, T, t0, x0 = 0) {
  const sp = 5200, car = 1500, gap = 140;
  const off = ((T - t0) * sp) % (car + gap);
  g.save();
  for (let k = -1; k < 3; k++) {
    const x = -off + k * (car + gap) + x0;
    g.fillStyle = '#10141c'; g.fillRect(x, H * .08, car, H * .8);
    for (let w = 0; w < 7; w++) {
      const wx = x + 80 + w * 200;
      const gr = g.createLinearGradient(wx, 0, wx + 150, 0);
      gr.addColorStop(0, 'rgba(255,225,170,.0)'); gr.addColorStop(.3, 'rgba(255,225,170,.85)'); gr.addColorStop(1, 'rgba(255,225,170,.2)');
      g.fillStyle = gr; g.fillRect(wx - 60, H * .25, 260, H * .22);
    }
    g.fillStyle = 'rgba(90,110,140,.35)'; g.fillRect(x, H * .52, car, 6); g.fillRect(x, H * .78, car, 10);
  }
  g.restore();
  return k => -off + k * (car + gap) + car + x0;
}
SH.s35 = (g, lt, S, T) => {
  plate(g, lt < 1.2 ? 'k_ling_stand' : 'bg_deck', lt < 1.2 ? { fx: .5, fy: .28, z: 1.25 } : { fx: .62, fy: .5, z: 1.5 });
  RAIN(g, T, { a: .3 });
  const sp = 4200, car = 1700, gap = 300, off = (lt * sp) % (car + gap);
  for (let k = -1; k < 3; k++) {
    const x = -off + k * (car + gap);
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#06080d'); gr.addColorStop(.2, '#121822'); gr.addColorStop(.22, '#090c12'); gr.addColorStop(.78, '#0c1018'); gr.addColorStop(1, '#040509');
    g.fillStyle = gr; g.fillRect(x, 0, car, H);
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let w = 0; w < 8; w++) {                        // 车窗被运动模糊拉成软边的光带
      const wx = x + 40 + w * 205, ww = 210;
      const hg = g.createLinearGradient(wx, 0, wx + ww, 0);
      const c = `255,${205 + 25 * hash(w + k * 9)},${140 + 40 * hash(w * 3 + k)}`;
      hg.addColorStop(0, `rgba(${c},0)`); hg.addColorStop(.35, `rgba(${c},.42)`); hg.addColorStop(.65, `rgba(${c},.42)`); hg.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = hg; g.fillRect(wx, H * .27, ww, H * .2);
    }
    const band = g.createLinearGradient(0, H * .22, 0, H * .55);
    band.addColorStop(0, 'rgba(255,200,130,0)'); band.addColorStop(.5, 'rgba(255,200,130,.12)'); band.addColorStop(1, 'rgba(255,200,130,0)');
    g.fillStyle = band; g.fillRect(x, H * .22, car, H * .33);
    g.fillStyle = 'rgba(150,180,220,.16)'; g.fillRect(x, H * .62, car, 3); g.fillRect(x, H * .86, car, 7);
    g.restore();
    for (const [ex, dir] of [[x, 1], [x + car, -1]]) {   // 车厢两端暗一点，缝隙边缘也带模糊
      const eg = g.createLinearGradient(ex, 0, ex + dir * 120, 0); eg.addColorStop(0, 'rgba(0,0,0,.9)'); eg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = eg; g.fillRect(Math.min(ex, ex + dir * 120), 0, 120, H);
    }
  }
  for (let k = 0; k < 14; k++) sparks(g, T, S.t0 + k * .12, W * hash(k * 3), H * .93, { n: 10, ang: -Math.PI * .7, spread: .6, v0: 400, v1: 1200, life: .3, seed: k });
  speedLines(g, T, Math.PI, { n: 40, a: .1, speed: 9000, len: 1200 });
};
SH.s36 = (g, lt, S, T) => {
  const u = lt / S.d;
  const m = plate(g, 'bg_deck', { fx: .5, fy: lerp(.55, .2, inx(prog(lt, .7, S.d), 2)), z: 1.15 });
  const [vx, vy] = m(.5, .45);
  const k = prog(lt, 0, 1.2);
  glow(g, vx, vy, 60 * (1 - k), .8 * (1 - k), '255,40,30');
  RAIN(g, T, { a: .3 }); RAIN_NEAR(g, T, { n: 16 });
  if (lt > 1.1) { const d = prog(lt, 1.1, S.d); sprite(g, 'sp_ling_1', W * .52, lerp(-60, H * .2, d), lerp(60, 160, d), { sil: '#05070c', rot: lt * 4 }); }
};
SH.s37 = (g, lt, S, T) => {
  const u = lt / S.d;
  clipOr(g, 'v_ling_fall', .2 + lt * 1.4, 'k_ling_fall', CLIPS.v_ling_fall ? { fx: .5, fy: .5, z: lerp(1.0, 1.1, u), oy: 40 } : { fx: .5, fy: .45, z: lerp(1.0, 1.4, inx(u, 2)) });
  flyers(g, T, { n: 120, speed: 1.2, col: '200,230,255' });
  RAIN_NEAR(g, T, { ang: 0, speed: 4200 });
};
function flyers(g, T, o) {
  const { n = 80, speed = .5, seed = 1, cx = W / 2, cy = H / 2, col = '255,255,255', w = 2, len = .06, a = .6 } = o;
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const aa = hash(i * 1.3 + seed) * 2 - 1, b = hash(i * 2.7 + seed) * 2 - 1;
    const z = (hash(i * 3.1 + seed) + T * speed * (.7 + .6 * hash(i + seed))) % 1;
    const p0 = 1 / (1.04 - z), p1 = 1 / (1.04 - Math.max(0, z - len));
    g.strokeStyle = `rgba(${col},${a * clamp(z * 3) * clamp((1 - z) * 6)})`; g.lineWidth = w * Math.min(p0, 9) * .45;
    g.beginPath(); g.moveTo(cx + aa * W * .3 * p0, cy + b * H * .3 * p0); g.lineTo(cx + aa * W * .3 * p1, cy + b * H * .3 * p1); g.stroke();
  }
  g.restore();
}
SH.s38 = (g, lt, S, T) => {
  const te = S.t0;
  const m = plate(g, 's_overhead', { fx: .48, fy: .5, z: 1.1 + punch(T, te, .2, 6) });
  const [cx, cy] = m(.42, .4), [fx, fy] = m(.38, .93);
  RAIN(g, T, { a: .3, push: [cx, cy, 900, 400 * outx(prog(lt, 0, .3))] });
  g.save(); g.strokeStyle = 'rgba(255,200,140,.8)'; g.lineWidth = 3; g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 9; i++) { const pts = boltPts(i * 9 + 3, fx, fy, fx + Math.cos(Math.PI * (.95 + i * .12)) * 900 * outx(prog(lt, 0, .3)), fy + 30 + i * 6, 120, 5); g.beginPath(); pts.forEach(([x, y], j) => j ? g.lineTo(x, y) : g.moveTo(x, y)); g.globalAlpha = 1 - prog(lt, .2, .8); g.stroke(); }
  g.restore();
  for (let k = 0; k < 3; k++) splashes(g, T, { n: 0 });
  sparks(g, T, te, fx, fy - 30, { n: 120, v0: 500, v1: 1800, ang: -Math.PI / 2, spread: 2.6, life: .7, grav: 2400, col: '200,225,255', hot: '235,245,255', w: 3 });
  sparks(g, T, te, cx, cy, { n: 120, v0: 700, v1: 2600, spread: TAU, life: .6 });
  shockwave(g, fx, fy, lerp(20, 1300, outx(prog(lt, 0, .7), 2)), 1 - prog(lt, .2, .8), { sq: .3, w: 80 });
  imp(g, T, te, 'inv');
  flash(g, flAfter(lt, 0, .8, 12));
};
SH.s39 = (g, lt, S, T) => {
  const u = lt / S.d;
  const still = lt < 1.25 ? 'k_train_a' : 'k_train_b';
  clipOr(g, 'v_train', .3 + lt * 1.5, still, { fx: .5, fy: .5, z: 1.03, oy: 40 });
  speedLines(g, T, Math.PI, { n: 50, a: .2, speed: 7000, len: 900, box: [0, H * .6, W, H * .4] });
  for (const b of [131, 132.5, 134, 135]) glow(g, W * .52, H * .4, 360, fl(T, B(b), .45, 7), '220,235,255');
  RAIN(g, T, { a: .3, ang: 1.1, speed: 3400, len: 140 }); RAIN_NEAR(g, T, { ang: 1.2, speed: 4800 });
};

// ================= E 坠落 =================
SH.s40 = (g, lt, S, T) => {
  const te = B(137) - S.t0;
  if (lt < te) {
    const m = plate(g, 'k_jin_swing', { fx: .62, fy: .3, z: 1.4 + .1 * lt });
    const [bx, by] = m(.32, .14);
    glow(g, bx, by, 500, .4 + .6 * prog(lt, 0, te), '255,240,220');
    embers(g, T, { n: 60, box: [0, 0, W, H], a: .8 });
    RAIN(g, T, { a: .28 });
  } else {
    const l = lt - te;
    const m = plate(g, 's_jin_slash', { fx: .5, fy: .45, z: 1.12 - .06 * l + punch(l, 0, .1) });
    heatHaze(g, T, [0, 0, W, H * .55], 7);
    embers(g, T, { n: 120, box: [0, 0, W, H * .7], a: 1, wind: 80, size: 1.3 });
    RAIN(g, T, { a: .25, hole: [W * .5, H * .25, 600] });
    imp(g, T, S.t0 + te, 'duo', '#ff6a2a');
    flash(g, flAfter(l, 0, .9, 10), '#fff2d0');
  }
};
SH.s41 = (g, lt, S, T) => {
  const u = lt / S.d;
  plate(g, 'bg_below', { fx: .5, fy: .45, z: 1.1 + .08 * u });
  embers(g, T, { n: 50, box: [0, 0, W, H * .5], a: .6, rise: -60 });
  rain(g, T * .35, { n: 600, a: .3, slow: .35, speed: 2300 });
  spriteW(g, 'sp_ling_2', W * .5 + 40 * Math.sin(lt * 2), lerp(H * .15, H * .62, io(u)), lerp(260, 900, inx(u, 1.6)), { rot: Math.PI + .3 + lt * .35 }, T * .4, { amp: 18, dir: 'x', from: .3, speed: 8, freq: 1.3 });
  RAIN_NEAR(g, T * .35, { n: 20 });
};
SH.s42 = (g, lt, S, T) => {
  const te = B(142.3) - S.t0;
  plate(g, 'bg_below', { fx: .5, fy: .9, z: 1.5, bright: .75 });
  ripples(g, T, { n: 40, box: [0, H * .78, W, H], a: .4, persp: .18 });
  if (lt < te) spriteW(g, 'sp_ling_2', W * .5, lerp(H * .05, H * .72, lt / te), 1300, { rot: Math.PI + .5, alpha: .95 }, T, { amp: 16, dir: 'x', from: .3 });
  const k = lt - te;
  if (k >= 0) {
    const cx = W / 2, cy = H * .8, up = outx(prog(k, 0, .35), 2) * (1 - inx(prog(k, .35, .8), 2) * .6);
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    for (let i = 0; i < 46; i++) {                       // 水冠：一片片向外翻的水幕
      const a = -Math.PI / 2 + (i / 45 - .5) * 2.6, len = (300 + 700 * hash(i * 3.7)) * up, w = 6 + 16 * hash(i * 5.3);
      const x1 = cx + Math.cos(a) * len * .9, y1 = cy + Math.sin(a) * len;
      const gr = g.createLinearGradient(cx, cy, x1, y1); gr.addColorStop(0, 'rgba(200,230,255,.05)'); gr.addColorStop(.7, 'rgba(225,242,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,.0)');
      g.strokeStyle = gr; g.lineWidth = w * (1 - prog(k, .4, .9));
      g.beginPath(); g.moveTo(cx + Math.cos(a) * 40, cy); g.quadraticCurveTo(cx + Math.cos(a) * len * .5, cy + Math.sin(a) * len * .8, x1, y1); g.stroke();
    }
    g.restore();
    for (let i = 0; i < 220; i++) {
      const a = -Math.PI / 2 + (hash(i * 3.1) - .5) * 2.4, v = 500 + 2600 * hash(i * 5.7), t = k;
      const x = cx + Math.cos(a) * v * t, y = cy + Math.sin(a) * v * t + 2200 * t * t, r = 2 + 7 * hash(i);
      g.fillStyle = `rgba(225,242,255,${.85 * (1 - prog(k, .35, .8))})`; g.beginPath(); g.ellipse(x, y, r * .7, r * 1.4, a + Math.PI / 2, 0, TAU); g.fill();
    }
    for (let j = 0; j < 5; j++) puff(g, cx + (j - 2) * 160, cy - 120 - 260 * outx(prog(k, 0, .6)), 380, .45 * (1 - prog(k, .25, .8)), j);
    flash(g, fl(k, 0, .7, 12));
  }
};
SH.s43 = (g, lt, S, T) => {
  const u = lt / S.d;
  clipOr(g, 'v_ling_under', .3 + lt * .9, 'k_ling_under', { fx: .5, fy: .5, z: lerp(1.02, 1.1, u) });
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 18; i++) {
    const x = W * hash(i * 2.2) + 120 * Math.sin(T * .8 + i), w = 40 + 90 * hash(i * 3.3);
    const gr = g.createLinearGradient(x, 0, x + w * 2, H);
    gr.addColorStop(0, `rgba(140,220,255,${.12 + .06 * Math.sin(T * 2 + i)})`); gr.addColorStop(1, 'rgba(140,220,255,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + w, 0); g.lineTo(x + w * 3 + 200, H); g.lineTo(x + 200, H); g.fill();
  }
  g.restore();
  for (let i = 0; i < 40; i++) { const y = H - ((T * (60 + 90 * hash(i)) + hash(i * 3) * H) % (H + 50)); g.strokeStyle = 'rgba(200,240,255,.45)'; g.lineWidth = 1.5; g.beginPath(); g.arc(W * hash(i * 7.7) + 10 * Math.sin(T * 3 + i), y, 2 + 6 * hash(i * 2), 0, TAU); g.stroke(); }
  tint(g, '#0a3550', .35, 'multiply');
};
SH.s44 = (g, lt, S, T) => {
  const u = lt / S.d;
  plate(g, 's_flash', { fx: .5, fy: .48, z: lerp(1.03, 1.1, u) });
  g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createLinearGradient(0, 0, W, 0); const p = .3 + .5 * u;
  gr.addColorStop(clamp(p - .3), 'rgba(255,170,90,0)'); gr.addColorStop(p, 'rgba(255,170,90,.22)'); gr.addColorStop(clamp(p + .3), 'rgba(255,170,90,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
  tint(g, '#ffd8a0', .25, 'soft-light');
  dim(g, .55 * (1 - prog(lt, 0, .35)) + .7 * prog(lt, S.d - .3, S.d));
};
SH.s45 = (g, lt, S, T) => {
  const te = B(154.6) - S.t0;
  if (lt < te) { g.fillStyle = '#021018'; g.fillRect(0, 0, W, H); }
  else {
    const l = lt - te;
    const m = plate(g, 's_ling_eye_under', { fx: .5, fy: .5, z: 1.15 - .05 * l + punch(l, 0, .08) });
    for (const [ex, ey] of [[.33, .5], [.66, .5]]) { const [x, y] = m(ex, ey); glow(g, x, y, 260, fl(l, 0, 1, 2) + .3, LING.rgb); flare(g, x, y, 600, fl(l, 0, .6, 3), LING.rgb); }
    flash(g, fl(l, 0, .6, 10), '#bff4ff');
  }
  for (let i = 0; i < 30; i++) { const y = H - ((T * (90 + 90 * hash(i)) + hash(i * 3) * H) % (H + 50)); g.strokeStyle = 'rgba(200,240,255,.5)'; g.lineWidth = 1.5; g.beginPath(); g.arc(W * hash(i * 7.7), y, 2 + 5 * hash(i * 2), 0, TAU); g.stroke(); }
};
SH.s46 = (g, lt, S, T) => {
  plate(g, 'bg_below', { fx: .5, fy: .55, z: 1.15 });
  RAIN(g, T, { a: .26 });
  const base = H * .92, top = lerp(base, -200, outx(prog(lt, .05, .7), 2)), cx = W * .5;
  for (let j = 0; j < 14; j++) puff(g, cx + (hash(j) - .5) * 260, lerp(base, top, j / 13) + 40 * Math.sin(T * 4 + j), 200 + 120 * hash(j * 3), .35, j);
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  for (let i = 0; i < 320; i++) {
    const s = hash(i * 1.7), y = lerp(base, top, s), sw = 90 + 140 * s, x = cx + (hash(i * 3.3) - .5) * sw * 2;
    g.strokeStyle = `rgba(180,235,255,${.5 * (1 - s * .4)})`; g.lineWidth = 2 + 4 * hash(i * 5.1);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (x - cx) * .08, y + 50 + 140 * hash(i * 9)); g.stroke();
  }
  g.restore();
  for (let k = 0; k < 10; k++) sparks(g, T, S.t0 + .05 + k * .08, cx + (hash(k) - .5) * 200, lerp(base, top, .6), { n: 14, v0: 300, v1: 900, spread: 2.4, ang: -Math.PI / 2, grav: 1800, life: .6, col: '170,230,255', hot: '235,250,255', seed: k });
  sprite(g, 'sp_ling_0', cx, top + 120, 380, { rot: -Math.PI / 2, sil: '#e6fbff', alpha: .85 });
  glow(g, cx, top + 120, 420, .6, LING.rgb);
  for (let k = 0; k < 3; k++) puff(g, cx + (k - 1) * 320, base - 30, 420, .45 * (1 - lt / S.d), k);
};
SH.s47 = (g, lt, S, T) => {
  const u = lt / S.d;
  const m = clipOr(g, 'v_ling_rise', .1 + lt * .9, 'k_ling_rise', { fx: .5, fy: .5, z: lerp(1.12, 1.02, outx(u)) });
  const [cx, cy] = [W * .5, H * .55];
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 260; i++) {
    const r = 200 + 700 * hash(i * 2.3), a = hash(i * 5.1) * TAU + lt * (1.4 - r / 1400) * 2.2, h = (hash(i * 7.7) - .5) * 900;
    const x = cx + Math.cos(a) * r, y = cy + h * .6 + Math.sin(a) * r * .25;
    const s = 1 + 4 * hash(i);
    g.globalAlpha = .7 * prog(lt, .2, .8); g.drawImage(BEAD, x - s * 2, y - s * 2, s * 4, s * 4);
  }
  g.restore();
  splashes(g, T, { n: 60, box: [0, H * .78, W, H], a: .5, size: 1.5 });
  RAIN(g, T, { a: .3 });
  flash(g, fl(lt, 0, .5, 8), '#bff4ff');
};
SH.s48 = (g, lt, S, T) => {
  const u = lt / S.d;
  const m = plate(g, 's_jin_whitehot', { fx: .5, fy: .45, z: lerp(1.08, 1.16, u) });
  const [cx, cy] = m(.5, .42);
  heatHaze(g, T, [0, 0, W, H], 5);
  RAIN(g, T, { a: .3, hole: [cx, cy, 620] });
  for (let k = 0; k < 18; k++) { const a = k / 18 * TAU + T; steam(g, T, S.t0 + (k % 6) * .15, cx + Math.cos(a) * 600, cy + Math.sin(a) * 420, { n: 2, seed: k, r0: 40, r1: 180, life: .9, a: .45, rise: 60 }); }
  embers(g, T, { n: 140, box: [0, 0, W, H], a: 1, rise: 260, size: 1.2 });
  glow(g, cx, cy, 700, .35 + .15 * Math.sin(T * 14), '255,230,190');
};
SH.s49 = (g, lt, S, T) => {
  const u = lt / S.d;
  plate(g, 'bg_sky', { fx: .5, fy: .5, z: lerp(1.0, 1.12, u) });
  for (let i = 0; i < 5; i++) {
    const t0 = i * .22, d = lt - t0;
    if (d < 0 || d > .25) continue;
    bolt(g, 300 + i * 11, W * (.15 + .7 * hash(i * 3)), -50, W * (.2 + .6 * hash(i * 7)), H * (.5 + .4 * hash(i * 2)), 1 - d / .25, { disp: 320, w: 3 });
    tint(g, '#c8d0ff', .5 * (1 - d / .25), 'screen');
  }
  rain(g, T, { n: 600, a: .3, ang: 0 });
};
SH.s50 = (g, lt, S, T) => {
  const half = B(2), j = lt < half, l = j ? lt : lt - half, u = l / half;
  clipOr(g, j ? 'v_jin_dash' : 'v_ling_dash', 1.5 + l * 1.3, j ? 'k_jin_dash' : 'k_ling_dash', { fx: .5, fy: .52, z: lerp(1.25, 1.7, inx(u, 2)), flip: false });
  speedLines(g, T, Math.PI / 2, { n: 50, a: .2, speed: 8000 });
  focusLines(g, T, W / 2, H / 2, { a: .25, r0: 520, col: j ? '255,180,120' : '170,230,255' });
  RAIN(g, T, { a: .3, speed: 3600, len: 140 });
};

// ---- 连击段：18 拍，每拍一切 ----
const COMBO = [
  ['still', 's_combo_a', .5, .45, 1.15, 0, 'inv'],
  ['sil', 'sp_jin_2', JIN, 'r'],
  ['still', 'k_exchange_b', .5, .72, 1.9, 0, 'mono'],
  ['still', 's_ling_name', .66, .3, 1.8, 0, 'duo'],
  ['still', 's_im_a', .5, .44, 1.5, 1, 'inv'],
  ['sil', 'sp_ling_1', LING, 'l'],
  ['still', 'k_exchange_a', .3, .35, 1.9, 0, 'mono'],
  ['still', 's_jin_glare', .6, .35, 1.6, 0, 'duo'],
  ['still', 's_clash', .52, .3, 2.2, 0, 'inv'],
  ['sky', 'sp_jin_3'],
  ['still', 's_overhead', .45, .38, 1.7, 0, 'mono'],
  ['geo'],
  ['still', 'k_exchange_a', .8, .4, 1.7, 0, 'inv'],
  ['still', 's_jin_slash', .55, .3, 1.3, 0, 'duo'],
  ['sil', 'sp_ling_0', LING, 'l2'],
  ['still', 's_combo_a', .55, .3, 1.7, 1, 'mono'],
  ['eyes'],
  ['still', 's_im_a', .5, .45, 1.2, 0, 'invmono'],
];
SH.s51 = (g, lt, S, T) => {
  const k = Math.min(17, Math.floor(lt / B(1) + 1e-6)), te = S.t0 + k * B(1), l = T - te, c = COMBO[k];
  const pal = k % 2 ? LING : JIN;
  if (c[0] === 'still') {
    const [, n, fx, fy, z, flip, st] = c;
    plate(g, n, { fx, fy, z: z + punch(l, 0, .14, 8) - .03 * l, flip: !!flip });
    sparks(g, T, te, W / 2, H / 2, { n: 90, v0: 600, v1: 2600, spread: TAU, life: .5, seed: k * 5 });
    RAIN(g, T, { a: .25, speed: 3200 });
    imp(g, T, te, st, k % 2 ? '#38c8ff' : '#ff5a2a');
  } else if (c[0] === 'sil') {
    const sp = c[2];
    g.fillStyle = sp === JIN ? '#d8261a' : '#1aa8e8'; g.fillRect(0, 0, W, H);
    speedLines(g, T, c[3] === 'r' ? 0 : Math.PI, { n: 60, a: .5, col: '255,255,255', speed: 9000, len: 1000 });
    const x = lerp(c[3] === 'r' ? W * .3 : W * .7, W * .5, outx(l / B(1)));
    sprite(g, c[1], x, H * .5, 820, { sil: '#05060a', rot: c[3] === 'l' ? l * 3 : 0 });
    slashLine(g, -100, H * .9, W + 100, H * .1, l / B(1) * 1.5, sp === JIN ? LING : JIN, 26);
  } else if (c[0] === 'sky') {
    plate(g, 'bg_sky', { fx: .5, fy: .5, z: 1.3, bright: .95 });
    bolt(g, 900 + k, W * .7, -40, W * .65, H * .9, 1, { disp: 260, w: 4 });
    tint(g, '#d8deff', fl(l, 0, .4, 10), 'screen');
    spriteW(g, c[1], W * .42, H * .55, 880, { }, T, { amp: 10, dir: 'x', from: .4 });
    g.save(); g.globalCompositeOperation = 'source-atop'; g.restore();
    sprite(g, c[1], W * .42, H * .55, 880, { sil: '#030308', alpha: .92 });
  } else if (c[0] === 'geo') {
    g.fillStyle = '#05060a'; g.fillRect(0, 0, W, H);
    const s = outx(l / B(1) * 1.6);
    g.fillStyle = '#e02818'; g.beginPath(); g.moveTo(0, 0); g.lineTo(W * .55 * s + W * .1, 0); g.lineTo(W * .35 * s, H); g.lineTo(0, H); g.fill();
    g.fillStyle = '#18a0e0'; g.beginPath(); g.moveTo(W, 0); g.lineTo(W - W * .4 * s, 0); g.lineTo(W - W * .6 * s - W * .1, H); g.lineTo(W, H); g.fill();
    glow(g, W * .5, H * .5, 700, 1, '255,255,255');
    focusLines(g, T, W / 2, H / 2, { a: .8, r0: 150, n: 120 });
  } else if (c[0] === 'eyes') {
    g.save(); g.beginPath(); g.moveTo(0, 0); g.lineTo(W * .58, 0); g.lineTo(W * .42, H); g.lineTo(0, H); g.clip();
    plate(g, 's_jin_eye', { fx: .4, fy: .55, z: 1.5, ox: -W * .2 }); g.restore();
    g.save(); g.beginPath(); g.moveTo(W * .58, 0); g.lineTo(W, 0); g.lineTo(W, H); g.lineTo(W * .42, H); g.clip();
    plate(g, 's_ling_eye', { fx: .62, fy: .58, z: 1.5, ox: W * .2 }); g.restore();
    slashLine(g, W * .6, -50, W * .4, H + 50, .5, k % 2 ? LING : JIN, 20);
  }
  flash(g, flAfter(l, 0, .3, 16));
};
SH.s52 = (g, lt, S, T) => {
  const u = lt / S.d;
  clipOr(g, 'v_jin_vortex', .1 + lt * .62, 'k_jin_vortex', { fx: .5, fy: .5, z: lerp(1.0, 1.12, io(u)), oy: 50 });   // 1.7 s 之后刀变形，不用
  const cx = W * .5, cy = H * .55;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 700; i++) {
    const r = 250 + 900 * hash(i * 2.3) * (1 - .25 * u), sp = (1.5 + 3 * u * u) * (900 / r);
    const a = hash(i * 5.1) * TAU + lt * sp, h = (hash(i * 7.7) - .5) * 1100;
    const x = cx + Math.cos(a) * r, y = cy + h * .7 + Math.sin(a) * r * .22;
    const x1 = cx + Math.cos(a - .05 * sp) * r, y1 = cy + h * .7 + Math.sin(a - .05 * sp) * r * .22;
    g.strokeStyle = `rgba(160,230,255,${.55 * (Math.sin(a) > 0 ? 1 : .5)})`; g.lineWidth = 1.5 + 3 * hash(i);
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x, y); g.stroke();
  }
  g.restore();
  speedLines(g, T, 0, { n: 30, a: .12 * u });
  glow(g, cx, cy - 100, 500, .3 + .3 * u, JIN.rgb);
};
SH.s53 = (g, lt, S, T) => {
  const u = lt / S.d;
  clipOr(g, 'v_jin_vortex', 1.6, 'k_jin_vortex', { fx: .5, fy: .5, z: 1.12 + punch(lt, 0, .15, 5), oy: 50 });
  const cx = W * .5, cy = H * .5, r = lerp(50, 2200, outx(prog(lt, 0, .9), 2));
  const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r);
  const a = 1 - prog(lt, .15, .8);
  gr.addColorStop(0, `rgba(255,255,245,${a})`); gr.addColorStop(.35, `rgba(255,200,120,${a * .85})`); gr.addColorStop(.7, `rgba(255,90,30,${a * .4})`); gr.addColorStop(1, 'rgba(255,60,20,0)');
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
  shockwave(g, cx, cy, r * .8, 1 - prog(lt, .3, 1), { w: 120, k: .1 });
  steam(g, T, S.t0 + .05, cx, cy, { n: 30, r0: 100, r1: 1100, life: 1.7, a: .6, rise: 40, spread: 1.8 });
  embers(g, T, { n: 160, box: [0, 0, W, H], a: 1, wind: 120, size: 1.4 });
  sparks(g, T, S.t0, cx, cy, { n: 200, v0: 800, v1: 3600, spread: TAU, life: .9, w: 3 });
  imp(g, T, S.t0, 'inv');
  flash(g, flAfter(lt, 0, 1, 9), '#fff4e0');
};
SH.s54 = (g, lt, S, T) => {
  const u = lt / S.d;
  const m = plate(g, 's_leap', { fx: .5, fy: .45, z: lerp(1.0, 1.12, io(u)) });
  if (lt < .1) mono(g, 3, .6);
  bolt(g, 501, W * .52, -40, W * .5, H * .7, 1 - prog(lt, 0, .5), { disp: 260, w: 5 });
  tint(g, '#d0d8ff', fl(lt, 0, .8, 4), 'screen');
  embers(g, T, { n: 80, box: [0, H * .2, W * .5, H * .6], a: .9 });
  beadField(g, T, { n: 200, a: .8, area: [W * .5, H * .2, W * .5, H * .6], seed: 44 });
  RAIN(g, T, { a: .3, speed: 3000 });
};
SH.s55 = (g, lt, S, T) => {
  const a = B(1.5), b = B(3);
  if (lt < a) {
    const m = plate(g, 's_jin_eye', { fx: .5, fy: .55, z: 1.15 + lt * .12 });
    for (const [ex, ey] of [[.33, .55], [.69, .55]]) { const [x, y] = m(ex, ey); glow(g, x, y, 200, .4 + .6 * lt / a, JIN.rgb); }
    embers(g, T, { n: 50, a: .8 });
  } else if (lt < b) {
    const l = lt - a;
    const m = plate(g, 's_ling_eye', { fx: .5, fy: .58, z: 1.15 + l * .12 });
    for (const [ex, ey] of [[.3, .58], [.7, .58]]) { const [x, y] = m(ex, ey); glow(g, x, y, 200, .4 + .6 * l / a, LING.rgb); }
    beadField(g, T, { n: 160, a: .7, seed: 19 });
  } else {
    const l = lt - b, u = l / (S.d - b);
    g.save(); g.beginPath(); g.rect(0, 0, W / 2, H); g.clip(); plate(g, 's_jin_eye', { fx: .5, fy: .55, z: 1.25 + u * .2, ox: -W / 4 }); g.restore();
    g.save(); g.beginPath(); g.rect(W / 2, 0, W / 2, H); g.clip(); plate(g, 's_ling_eye', { fx: .5, fy: .58, z: 1.25 + u * .2, ox: W / 4 }); g.restore();
    g.fillStyle = '#000'; g.fillRect(W / 2 - 3, 0, 6, H);
    glow(g, W * .25, H * .5, 600, .3 * u, JIN.rgb); glow(g, W * .75, H * .5, 600, .3 * u, LING.rgb);
    flash(g, inx(u, 3) * .9);
  }
};

// ================= G 一刀 =================
SH.s56 = (g, lt, S, T) => {
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const te = B(212.3) - S.t0, l = lt - te;
  if (l < 0) return;
  const u = outExpo(prog(l, 0, .08));
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const [h, a, c] of [[60, .15, '255,200,150'], [16, .5, '255,240,220'], [3, 1, '255,255,255']]) {
    g.fillStyle = `rgba(${c},${a * (1 - prog(l, .15, .7))})`; g.fillRect(-20, H / 2 - h / 2, (W + 40) * u, h);
  }
  g.restore();
  glow(g, W * u, H / 2, 300, .8 * (1 - prog(l, 0, .3)));
};
SH.s57 = (g, lt, S, T) => {
  const u = lt / S.d, tr = B(217) - S.t0;
  plate(g, 's_final', { fx: .5, fy: .5, z: lerp(1.12, 1.04, io(u)) });
  const [tau, rate] = warp(lt, [[0, 0], [tr, 1]], .45);
  rain(g, 80 + tau, { n: 800, a: .32, slow: rate, glint: 1.5, seed: 77 });
  dim(g, .25 * (1 - prog(lt, 0, .6)));
};

// ================= H 余烬 =================
SH.s58 = (g, lt, S, T) => {
  const tc = B(221) - S.t0, tf = B(222.4) - S.t0, u = lt / S.d;
  const cam = { fx: .34, fy: .58, z: 1.55 + .05 * u };
  const m = plate(g, 's_blade', cam);
  const [cx, cy] = m(.218, .658), [hx, hy] = m(.68, .42), [tx, ty] = m(.02, .76);
  const ang = Math.atan2(ty - hy, tx - hx), dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
  glow(g, cx, cy, 260, .35 * (1 - u), JIN.rgb);
  const k = prog(lt, tc, tc + .15);
  if (k > 0) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(255,190,110,${.95 * (1 - prog(lt, tf, tf + .6))})`; g.lineWidth = 2.5;
    const pts = boltPts(5, cx - nx * 30 * k, cy - ny * 30 * k, cx + nx * 30 * k, cy + ny * 30 * k, 14, 4);
    g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.restore();
    glow(g, cx, cy, 90, .8 * k * (1 - prog(lt, tf, tf + .5)), '255,200,120');
  }
  if (lt > tf) {                                        // 刀尖断落：只切下刀身这一窄条，原处用模糊的背景补上
    snap.drawImage(g.canvas, 0, 0);
    const d = lt - tf, hw = 30, L = Math.hypot(tx - cx, ty - cy) + 60;
    const strip = gg => { gg.beginPath(); gg.moveTo(cx + nx * hw, cy + ny * hw); gg.lineTo(cx - nx * hw, cy - ny * hw); gg.lineTo(cx - nx * hw + dx * L, cy - ny * hw + dy * L); gg.lineTo(cx + nx * hw + dx * L, cy + ny * hw + dy * L); gg.closePath(); };
    g.save(); strip(g); g.clip(); plate(g, 's_blade', { ...cam, blur: 14, bright: .8 }); g.restore();
    g.save(); g.translate(cx, cy); g.rotate(-1.4 * d * d); g.translate(-cx - 80 * d, -cy + 1200 * d * d); strip(g); g.clip(); g.drawImage(SNAP, 0, 0); g.restore();
    sparks(g, T, S.t0 + tf, cx, cy, { n: 30, v0: 200, v1: 700, spread: TAU, life: .4 });
  }
  for (let i = 0; i < 6; i++) puff(g, cx + 200 + i * 90, cy - 80 - lt * 60, 160, .16 * (1 - u), i);
  RAIN(g, T, { a: .22, n: 360 });
};
SH.s59 = (g, lt, S, T) => {
  const th = B(225.6) - S.t0;
  plate(g, 'bg_deck', { fx: .5, fy: .88, z: 2.0, blur: 5, bright: .7 });
  ripples(g, T, { n: 25, box: [0, H * .6, W, H], a: .3, persp: .25 });
  if (lt < th) {
    const y = lerp(-260, H * .66, inx(lt / th, 1.6));
    spriteW(g, 'sp_braid_0', W * .52, y, 620, { rot: .25 + lt * 1.1 }, T, { amp: 8, dir: 'x', from: .2, speed: 7 });
  } else {
    const d = lt - th;
    sprite(g, 'sp_braid_0', W * .52, H * .7 + 6 * Math.sin(d * 9) * Math.exp(-d * 4), 520, { rot: .55 + .04 * Math.sin(d * 7) * Math.exp(-d * 3), alpha: .95 });
    for (let k = 0; k < 5; k++) { const r = d * 520 - k * 80; if (r > 0) { g.strokeStyle = `rgba(220,240,255,${.6 * (1 - d / (S.d - th))})`; g.lineWidth = 2.5; g.beginPath(); g.ellipse(W * .62, H * .74, r, r * .24, 0, 0, TAU); g.stroke(); } }
    sparks(g, T, S.t0 + th, W * .62, H * .73, { n: 30, v0: 200, v1: 700, ang: -Math.PI / 2, spread: 1.6, grav: 2400, life: .5, col: '200,230,255', hot: '240,250,255' });
    glow(g, W * .62, H * .72, 260, fl(lt, th, .7, 2.5), '255,210,140');
    flare(g, W * .62, H * .72, 500, fl(lt, th, .4, 2.5), '255,210,150');
  }
  RAIN(g, T, { a: .18, n: 260 });
};
SH.s60 = (g, lt, S, T) => {
  const u = lt / S.d;
  const m = plate(g, 's_dawn', { fx: .5, fy: .5, z: lerp(1.15, 1.03, io(u)) });
  const lvl = 1 - prog(T, 94.6, 97.0);
  if (lvl > 0) RAIN(g, T, { a: .25 * lvl, n: Math.round(520 * lvl) });
  const [sx, sy] = m(.66, .34);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (i - 4) * .16 + .03 * Math.sin(T * .5 + i), w = .03 + .03 * hash(i);
    g.fillStyle = `rgba(255,210,150,${(.06 + .04 * Math.sin(T + i)) * prog(lt, 0, 1.2)})`;
    g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(a - w) * 2000, sy - Math.sin(a - w) * -2000); g.lineTo(sx + Math.cos(a + w) * 2000, sy - Math.sin(a + w) * -2000); g.fill();
  }
  g.restore();
  tint(g, '#ffcc88', .2 * prog(lt, 0, 1.5), 'soft-light');
};
SH.s61 = (g, lt, S, T) => {
  const u = lt / S.d;
  plate(g, 's_dawn', { fx: .5, fy: .5, z: 1.03 + .03 * u, blur: lerp(0, 6, prog(lt, 0, .8)), bright: lerp(1, .55, prog(lt, 0, .8)) });
  embers(g, T, { n: 60, a: .8, size: 1.1 });
  beadField(g, T, { n: 160, a: .6, seed: 61 });
  const v = outx(prog(lt, .2, 1.2));
  g.save(); g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.globalAlpha = v; g.font = `400 210px ${SERIF}`;
  g.shadowColor = 'rgba(255,140,60,.8)'; g.shadowBlur = 40; g.fillStyle = '#fff6ea';
  g.fillText('雨', W / 2 - 115, H * .56); g.shadowColor = 'rgba(90,210,255,.8)'; g.fillText('烬', W / 2 + 115, H * .56);
  g.shadowBlur = 0; g.font = `500 28px ${SANS}`; if (g.letterSpacing !== undefined) g.letterSpacing = '22px';
  g.globalAlpha = outx(prog(lt, .7, 1.6)) * .85; g.fillText('RAIN  ·  EMBER', W / 2 + 11, H * .56 + 80);
  g.restore();
  dim(g, prog(lt, S.d - .9, S.d));
};
