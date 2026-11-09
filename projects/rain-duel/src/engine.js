/* 《雨烬》画面引擎：基础工具、素材加载、特效、后期。每帧都是时间的纯函数，镜头在 shots.js。 */
const W = 1920, H = 1080, TAU = Math.PI * 2;
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
window.__canvas = cv;
function mk(w = W, h = H) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const SC = mk(), sc = SC.getContext('2d');           // 镜头画在这里
const SNAP = mk(), snap = SNAP.getContext('2d');     // 后期用的拷贝
const ACC = mk(), acc = ACC.getContext('2d');        // 快门累积
const SMALL = mk(480, 270), small = SMALL.getContext('2d');
const AUX = mk(), aux = AUX.getContext('2d');
const SERIF = '"STKaiti","KaiTi","SimKai","STSong","SimSun",serif';
const SANS = '"Segoe UI","Microsoft YaHei",sans-serif';
const JIN = { core: '#fff3d6', mid: '#ffb03a', out: '#ff3a14', rgb: '255,120,40' };
const LING = { core: '#f2fdff', mid: '#7fe8ff', out: '#1f8cff', rgb: '120,220,255' };

// ---------- 数学 ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const io = u => u * u * (3 - 2 * u);
const inx = (u, p = 3) => Math.pow(clamp(u), p);
const outx = (u, p = 3) => 1 - Math.pow(1 - clamp(u), p);
const outExpo = u => u >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(u));
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const sn = (x, s = 0) => Math.sin(x * 1.7 + s) * .5 + Math.sin(x * 2.9 + s * 1.3) * .3 + Math.sin(x * 5.3 + s * .7) * .2;   // 平滑噪声
const q = (t, fps) => Math.floor(t * fps + 1e-6) / fps;

// ---------- 素材 ----------
const IMG = {}, SPR = {};
let CUES = null, CLIPS = {};
function load(src) { return new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('missing ' + src)); i.src = src; }); }
async function loadPlate(n) {
  try { IMG[n] = await load(`../assets/bg/${n}.jpg`); } catch (e) { IMG[n] = await load(`../assets/gen/${n}.png`).catch(() => null); }
}
const FR = new Map(); let missing = new Set();
function frameOf(name, sec, step = 12) {
  const n = CLIPS[name] || 0;
  if (!n) return null;
  const st = Math.floor(sec * step + 1e-6) / step;
  const i = clamp(Math.floor(st * 24 + 1e-6) + 1, 1, n);
  const k = `${name}/${String(i).padStart(4, '0')}`;
  const f = FR.get(k);
  if (f) { FR.delete(k); FR.set(k, f); return f; }
  missing.add(k);
  return null;
}
async function fetchMissing() {
  const ks = [...missing]; missing = new Set();
  await Promise.all(ks.map(async k => { FR.set(k, await load(`../assets/frames/${k}.jpg`)); }));
  while (FR.size > 120) FR.delete(FR.keys().next().value);
}

// ---------- 摄影机 ----------
/** 让图像上的 (fx,fy) 落在画面中心；返回图像坐标 → 屏幕坐标的映射。 */
function cover(g, img, fx = .5, fy = .5, z = 1, rot = 0, ox = 0, oy = 0, flip = false) {
  const iw = img.width, ih = img.height;
  const s = Math.max(W / iw, H / ih) * z;
  const hw = W / 2 / s / iw, hh = H / 2 / s / ih;
  if (Math.abs(rot) < .02) { fx = hw < .5 ? clamp(fx, hw, 1 - hw) : .5; fy = hh < .5 ? clamp(fy, hh, 1 - hh) : .5; }
  g.save();
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.translate(W / 2 + ox, H / 2 + oy); g.rotate(rot); g.scale(flip ? -s : s, s);
  g.drawImage(img, -fx * iw, -fy * ih);
  g.restore();
  const c = Math.cos(rot), n = Math.sin(rot), sx = flip ? -1 : 1;
  const m = (x, y) => { const a = (x - fx) * iw * s * sx, b = (y - fy) * ih * s; return [W / 2 + ox + a * c - b * n, H / 2 + oy + a * n + b * c]; };
  m.s = s * iw; return m;
}
/** 画一张底图；cam = {fx,fy,z,rot,ox,oy,flip,blur,bright}。 */
function plate(g, name, cam = {}) {
  const img = IMG[name];
  if (!img) { g.fillStyle = '#05070c'; g.fillRect(0, 0, W, H); return (x, y) => [x * W, y * H]; }
  const { fx = .5, fy = .5, z = 1, rot = 0, ox = 0, oy = 0, flip = false, blur = 0, bright = 1, sat = 1 } = cam;
  if (blur || bright !== 1 || sat !== 1) g.filter = `${blur ? `blur(${blur}px) ` : ''}brightness(${bright}) saturate(${sat})`;
  const m = cover(g, img, fx, fy, z, rot, ox, oy, flip);
  g.filter = 'none';
  return m;
}
/** 片段帧（没有片段时退回到首帧静图，作为预演）。 */
function clipOr(g, clip, sec, still, cam = {}, step = 12) {
  const f = frameOf(clip, sec, step);
  if (f) {
    const { fx = .5, fy = .5, z = 1, rot = 0, ox = 0, oy = 0, flip = false } = cam;
    return cover(g, f, fx, fy, z, rot, ox, oy, flip);
  }
  if (CLIPS[clip]) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); return (x, y) => [x * W, y * H]; }
  return plate(g, still, cam);
}
/** 贴精灵：(ax,ay) 是精灵上的锚点，落在屏幕 (x,y)，高 h 像素。 */
function sprite(g, name, x, y, h, o = {}) {
  const img = SPR[name];
  if (!img) return;
  const { ax = .5, ay = .5, rot = 0, flip = false, alpha = 1, blur = 0, sil = null } = o;
  const s = h / img.height;
  g.save();
  g.globalAlpha = alpha;
  if (blur) g.filter = `blur(${blur}px)`;
  g.translate(x, y); g.rotate(rot); g.scale(flip ? -s : s, s);
  g.imageSmoothingQuality = 'high';
  g.drawImage(sil ? silhouette(name, sil) : img, -ax * img.width, -ay * img.height);
  g.restore();
}
/**
 * 让精灵“活”起来：按横条（或竖条）做正弦错位，越远离锚点幅度越大，衣摆和头发会飘。
 * dir='x' 时横条左右摆（适合竖直的人），'y' 时竖条上下摆（适合横躺/冲刺的人）。返回画好的离屏画布。
 */
const WARP = { c: null };
function warpSprite(name, T, o = {}) {
  const img = SPR[name];
  if (!img) return null;
  const { amp = 10, freq = 2.2, speed = 9, dir = 'x', from = .25, step = 3 } = o;
  const pad = Math.ceil(amp * 2) + 4;
  const w = img.width + pad * 2, h = img.height + pad * 2;
  if (!WARP.c || WARP.c.width < w || WARP.c.height < h) { WARP.c = mk(Math.max(w, WARP.c ? WARP.c.width : 0), Math.max(h, WARP.c ? WARP.c.height : 0)); }
  const g = WARP.c.getContext('2d');
  g.clearRect(0, 0, WARP.c.width, WARP.c.height);
  if (dir === 'x') {
    for (let y = 0; y < img.height; y += step) {
      const v = y / img.height, k = Math.max(0, (v - from) / (1 - from));
      const off = amp * k * k * Math.sin(v * freq * TAU - T * speed) + amp * .4 * k * Math.sin(v * freq * 2.7 * TAU - T * speed * 1.6);
      g.drawImage(img, 0, y, img.width, step, pad + off, pad + y, img.width, step);
    }
  } else {
    for (let x = 0; x < img.width; x += step) {
      const v = x / img.width, k = Math.max(0, (v - from) / (1 - from));
      const off = amp * k * k * Math.sin(v * freq * TAU - T * speed) + amp * .4 * k * Math.sin(v * freq * 2.7 * TAU - T * speed * 1.6);
      g.drawImage(img, x, 0, step, img.height, pad + x, pad + off, step, img.height);
    }
  }
  WARP.pad = pad; WARP.w = w; WARP.h = h; WARP.iw = img.width; WARP.ih = img.height;
  return WARP.c;
}
/** 画一个会飘动的精灵（参数同 sprite，另加 warp 选项）。 */
function spriteW(g, name, x, y, h, o = {}, T = 0, wo = {}) {
  const c = warpSprite(name, T, wo);
  if (!c) return;
  const { ax = .5, ay = .5, rot = 0, flip = false, alpha = 1, blur = 0 } = o;
  const s = h / WARP.ih, p = WARP.pad;
  g.save(); g.globalAlpha = alpha; if (blur) g.filter = `blur(${blur}px)`;
  g.translate(x, y); g.rotate(rot); g.scale(flip ? -s : s, s); g.imageSmoothingQuality = 'high';
  g.drawImage(c, 0, 0, WARP.w, WARP.h, -ax * WARP.iw - p, -ay * WARP.ih - p, WARP.w, WARP.h);
  g.restore();
}
/** 方向运动模糊：沿速度方向多画几次。 */
function spriteBlur(g, name, x, y, h, vx, vy, o = {}, n = 6) {
  for (let i = n - 1; i >= 0; i--) sprite(g, name, x - vx * i / n, y - vy * i / n, h, { ...o, alpha: (o.alpha ?? 1) * (i ? .22 : 1) });
}
const SIL = {};
function silhouette(name, col) {
  const k = name + col;
  if (SIL[k]) return SIL[k];
  const img = SPR[name], c = mk(img.width, img.height), g = c.getContext('2d');
  g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
  return (SIL[k] = c);
}

// ---------- 事件（来自 cues.json） ----------
const SHAKE_W = { clash: .55, hit: 1, boom: .45, thunder: .25, crack: .5, splash: .25, slash: .8, needle: .3, vortex: .2, train: .35 };
function shakeAt(T) {
  let x = 0, y = 0, r = 0;
  for (const e of CUES.events) {
    const d = T - e.t;
    if (d < 0 || d > 1.2) continue;
    const w = (SHAKE_W[e.kind] || 0) * e.gain;
    if (!w) continue;
    const a = w * Math.exp(-d * 7.5);
    x += a * 30 * sn(T * 31, e.t * 7); y += a * 24 * sn(T * 29, e.t * 3 + 1); r += a * .012 * sn(T * 23, e.t);
  }
  return [x, y, r];
}
function lastEv(T, kinds, win = 2) {
  let best = null;
  for (const e of CUES.events) if (kinds.includes(e.kind) && e.t <= T + 1e-6 && T - e.t < win && (!best || e.t > best.t)) best = e;
  return best;
}
const B = b => b * CUES.beat;

// ---------- 雨 ----------
/** 对时间做分段变速积分：segs = [[开始(秒), 速率], ...]，速率之间线性过渡 0.35 s。 */
function warp(t, segs, ramp = .35) {
  let tau = 0, n = Math.max(8, Math.ceil(t * 60)), dt = t / n;
  const rate = x => { let r = segs[0][1]; for (let i = 1; i < segs.length; i++) { const [s, v] = segs[i]; const p = prog(x, s, s + ramp); r = lerp(r, v, io(p)); } return r; };
  for (let i = 0; i < n; i++) tau += rate((i + .5) * dt) * dt;
  return [tau, rate(t)];
}
/**
 * 三层深度的雨。tau 是雨的时间（可变速），slow 是当前速率（决定雨丝长短，0 时变成悬停的水珠）。
 * hole = [x,y,r]：这个圆里没有雨（被热气蒸发或冲击波推开）。push = [x,y,r,amt]：径向推开。
 */
function rain(g, tau, o = {}) {
  const { n = 420, seed = 1, ang = .1, speed = 2300, len = 80, w = 1.5, a = .32, col = '205,228,255', z0 = .25, z1 = 1,
    slow = 1, hole = null, push = null, tint = null, glint = 0 } = o;
  const L0 = len * Math.max(slow, .02), sa = Math.sin(ang), ca = Math.cos(ang);
  const buckets = [[], [], [], []];
  const beads = [];
  for (let i = 0; i < n; i++) {
    const z = lerp(z0, z1, Math.pow(hash(i * 7.13 + seed), 1.6));
    const sp = speed * (.55 + .75 * z), L = Math.max(2, L0 * (.35 + .9 * z));
    const span = H + 400;
    let y = ((hash(i * 3.31 + seed) * span + tau * sp) % span) - 200;
    let x = hash(i * 1.77 + seed) * (W + 600) - 300 + y * sa / ca;
    x = ((x + 300) % (W + 600) + W + 600) % (W + 600) - 300;
    if (hole) { const dx = x - hole[0], dy = y - hole[1]; if (dx * dx + dy * dy < hole[2] * hole[2]) continue; }
    if (push) { const dx = x - push[0], dy = y - push[1], d = Math.hypot(dx, dy) + 1; if (d < push[2]) { const k = push[3] * (1 - d / push[2]); x += dx / d * k; y += dy / d * k; } }
    buckets[Math.min(3, Math.floor(z * 4))].push([x, y, L]);
    if (slow < .35 && glint) beads.push([x, y, z]);
  }
  g.save(); g.lineCap = 'round';
  buckets.forEach((bk, k) => {
    const z = (k + .5) / 4;
    g.strokeStyle = `rgba(${tint || col},${a * (.35 + .75 * z) * (slow < .35 ? .4 + slow * 1.7 : 1)})`;
    g.lineWidth = Math.max(.7, w * (.45 + 1.4 * z));
    g.beginPath();
    for (const [x, y, L] of bk) { g.moveTo(x, y); g.lineTo(x - L * sa, y - L * ca); }
    g.stroke();
  });
  if (beads.length) {
    const ga = glint * (1 - slow / .35);
    g.globalCompositeOperation = 'lighter';
    for (const [x, y, z] of beads) {
      const r = 1.2 + 3.2 * z, tw = .6 + .4 * Math.sin(x * .07 + y * .05 + tau * 9);
      g.globalAlpha = ga * tw * (.35 + .65 * z);
      g.drawImage(BEAD, x - r * 2, y - r * 2, r * 4, r * 4);
    }
  }
  g.restore();
}
/** 悬停的水珠场（有纵深视差）。cx,cy 是视点偏移，用于摄影机推移。 */
function beadField(g, T, o = {}) {
  const { n = 900, seed = 4, a = .9, drift = 1, ox = 0, oy = 0, zoom = 1, col = null, area = [0, 0, W, H] } = o;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const z = Math.pow(hash(i * 5.7 + seed), 2.2);
    const par = .25 + 1.6 * z;
    let x = area[0] + hash(i * 2.3 + seed) * area[2], y = area[1] + hash(i * 9.1 + seed) * area[3];
    x = W / 2 + (x - W / 2) * (1 + (zoom - 1) * par) + ox * par + drift * 6 * sn(T * .7 + i, i);
    y = H / 2 + (y - H / 2) * (1 + (zoom - 1) * par) + oy * par + drift * 5 * sn(T * .6 + i * 1.3, i + 2);
    if (x < -40 || x > W + 40 || y < -40 || y > H + 40) continue;
    const r = 1 + 7 * z, tw = .55 + .45 * Math.sin(T * (3 + 4 * hash(i)) + i);
    g.globalAlpha = a * tw * (.25 + .75 * z);
    g.drawImage(col === 'ember' ? EMBERDOT : BEAD, x - r * 2, y - r * 2, r * 4, r * 4);
  }
  g.restore();
}
/** 地面溅起的水花：把地面区域 [x0,y0,x1,y1] 当作有透视的平面（越靠下越大）。 */
function splashes(g, T, o = {}) {
  const { n = 60, seed = 2, box = [0, H * .6, W, H], a = .5, size = 1, rate = 1 } = o;
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const per = .5 + hash(i * 3.9 + seed) * .7;
    const ph = (T * rate / per + hash(i * 8.1 + seed)) % 1;
    const cyc = Math.floor(T * rate / per + hash(i * 8.1 + seed));
    const x = box[0] + hash(i * 1.3 + cyc * 7.7 + seed) * (box[2] - box[0]);
    const v = hash(i * 4.1 + cyc * 3.3 + seed), y = lerp(box[1], box[3], v);
    const s = (.35 + v * 1.4) * size;
    if (ph > .35) continue;
    const u = ph / .35;
    g.globalAlpha = a * (1 - u);
    g.strokeStyle = 'rgba(215,235,255,1)'; g.lineWidth = 1.4 * s;
    g.beginPath(); g.ellipse(x, y, 18 * s * outx(u), 5 * s * outx(u), 0, 0, TAU); g.stroke();
    g.fillStyle = 'rgba(225,240,255,1)';
    for (let k = 0; k < 4; k++) {
      const ang = -Math.PI / 2 + (k - 1.5) * .45, vv = 60 * s;
      const px = x + Math.cos(ang) * vv * u * .5, py = y + Math.sin(ang) * vv * u - (-120 * s) * u * u * .5 * -1 + 120 * s * u * u * .5;
      g.beginPath(); g.arc(px, py, 1.6 * s, 0, TAU); g.fill();
    }
  }
  g.restore();
}
/** 水面涟漪。 */
function ripples(g, T, o = {}) {
  const { n = 30, seed = 3, box = [0, H * .7, W, H], a = .35, rate = 1, persp = .28 } = o;
  g.save(); g.strokeStyle = 'rgba(200,225,255,1)';
  for (let i = 0; i < n; i++) {
    const per = 1 + hash(i * 2.2 + seed);
    const ph = (T * rate / per + hash(i * 5.5 + seed)) % 1, cyc = Math.floor(T * rate / per + hash(i * 5.5 + seed));
    const v = hash(i * 7.3 + cyc + seed), x = box[0] + hash(i * 3.7 + cyc * 1.9 + seed) * (box[2] - box[0]), y = lerp(box[1], box[3], v);
    const s = .3 + v;
    g.globalAlpha = a * (1 - ph) * s; g.lineWidth = 1.2;
    g.beginPath(); g.ellipse(x, y, 60 * s * ph, 60 * s * ph * persp, 0, 0, TAU); g.stroke();
  }
  g.restore();
}

// ---------- 粒子 ----------
let BEAD, EMBERDOT, GLOW, PUFFS = [], GRAIN = [], VIG;
function makeSprites() {
  const dot = (rgb, core) => {
    const c = mk(64, 64), g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, core); gr.addColorStop(.18, `rgba(${rgb},.9)`); gr.addColorStop(.45, `rgba(${rgb},.25)`); gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c;
  };
  BEAD = dot('150,225,255', 'rgba(255,255,255,1)');
  EMBERDOT = dot('255,130,40', 'rgba(255,240,200,1)');
  GLOW = dot('255,255,255', 'rgba(255,255,255,1)');
  for (let k = 0; k < 5; k++) {
    const c = mk(256, 256), g = c.getContext('2d');
    for (let i = 0; i < 26; i++) {
      const a = hash(i * 3.1 + k * 17) * TAU, r = hash(i * 7.7 + k) * 70, x = 128 + Math.cos(a) * r, y = 128 + Math.sin(a) * r, rr = 30 + hash(i * 5.3 + k * 3) * 60;
      const gr = g.createRadialGradient(x, y, 0, x, y, rr);
      gr.addColorStop(0, 'rgba(255,255,255,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    }
    PUFFS.push(c);
  }
  for (let k = 0; k < 6; k++) {
    const c = mk(960, 540), g = c.getContext('2d'), d = g.createImageData(960, 540);
    let s = 1234 + k * 999;
    for (let i = 0; i < d.data.length; i += 4) { s = (s * 1103515245 + 12345) & 0x7fffffff; const v = 128 + ((s >> 8) % 90) - 45; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    g.putImageData(d, 0, 0); GRAIN.push(c);
  }
  VIG = mk(); const g = VIG.getContext('2d'), gr = g.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * 1.05);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.62)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
}
/** 一次爆发的火花（t0 时刻在 (x,y)）。 */
function sparks(g, T, t0, x, y, o = {}) {
  const { n = 60, seed = 1, ang = -Math.PI / 2, spread = Math.PI, v0 = 700, v1 = 2200, grav = 1600, life = .55, w = 2.4, drag = 2.2, col = '255,200,110', hot = '255,250,225', scale = 1 } = o;
  const dt = T - t0;
  if (dt < 0 || dt > life * 1.6) return;
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const li = life * (.4 + 1.1 * hash(i * 2.7 + seed));
    if (dt > li) continue;
    const a = ang + (hash(i * 1.9 + seed) - .5) * spread, v = lerp(v0, v1, Math.pow(hash(i * 4.3 + seed), 1.5)) * scale;
    const p = t => { const e = (1 - Math.exp(-drag * t)) / drag; return [x + Math.cos(a) * v * e, y + Math.sin(a) * v * e + .5 * grav * scale * t * t]; };
    const [x1, y1] = p(dt), [x0, y0] = p(Math.max(0, dt - .03));
    const f = 1 - dt / li;
    g.strokeStyle = `rgba(${col},${.5 * f})`; g.lineWidth = w * 3 * scale;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    g.strokeStyle = `rgba(${hot},${f})`; g.lineWidth = w * scale;
    g.stroke();
  }
  g.restore();
}
/** 连续喷出的火花流（比如刀尖拖地），每 1/40 秒一小簇。 */
function sparkStream(g, T, t0, t1, posAt, o = {}) {
  for (let t = Math.max(t0, T - .9); t <= Math.min(t1, T); t += 1 / 40) {
    const k = Math.round(t * 40);
    const [x, y] = posAt(t);
    sparks(g, T, t, x, y, { n: o.n || 6, seed: k * 1.37, ...o });
  }
}
/** 余烬：缓慢上升、闪烁。 */
function embers(g, T, o = {}) {
  const { n = 80, seed = 9, box = [0, 0, W, H], rise = 120, a = .9, size = 1, col = 'ember', wind = 20 } = o;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const per = 2 + 3 * hash(i * 3.3 + seed), ph = (T / per + hash(i * 6.1 + seed)) % 1;
    const x = box[0] + hash(i * 1.1 + seed) * box[2] + wind * T + 40 * sn(T * .8 + i, i);
    const y = box[1] + box[3] - ph * (box[3] + rise * per * .2);
    const r = (1.2 + 3 * hash(i * 9.9 + seed)) * size, fl = .5 + .5 * Math.sin(T * 13 + i * 3);
    g.globalAlpha = a * fl * Math.sin(ph * Math.PI);
    g.drawImage(col === 'ember' ? EMBERDOT : BEAD, x - r * 2.5, y - r * 2.5, r * 5, r * 5);
  }
  g.restore();
}
/** 一团蒸汽。 */
function puff(g, x, y, r, a, k = 0) {
  g.save(); g.globalAlpha = clamp(a); g.drawImage(PUFFS[k % PUFFS.length], x - r, y - r, r * 2, r * 2); g.restore();
}
/** 从 (x,y) 炸开的蒸汽。 */
function steam(g, T, t0, x, y, o = {}) {
  const { n = 14, seed = 5, r0 = 60, r1 = 380, life = 2.2, a = .7, rise = 140, spread = 1, tint = null } = o;
  const dt = T - t0;
  if (dt < 0 || dt > life) return;
  for (let i = 0; i < n; i++) {
    const ang = hash(i * 2.1 + seed) * TAU, d = hash(i * 3.7 + seed) * r1 * .8 * spread * outx(dt / life, 2);
    const r = lerp(r0, r1, outx(dt / life, 2)) * (.6 + .6 * hash(i * 5.1 + seed));
    puff(g, x + Math.cos(ang) * d, y + Math.sin(ang) * d * .6 - rise * dt, r, a * (1 - dt / life) * (.6 + .4 * hash(i)), i + Math.floor(seed));
  }
}
/** 发光圆。 */
function glow(g, x, y, r, a, rgb = '255,255,255') {
  g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(.25, `rgba(${rgb},${a * .45})`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
}
/** 横向的变形镜头光斑。 */
function flare(g, x, y, len, a, rgb = '150,200,255') {
  g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createLinearGradient(x - len, 0, x + len, 0);
  gr.addColorStop(0, `rgba(${rgb},0)`); gr.addColorStop(.5, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.fillRect(x - len, y - 3, len * 2, 6);
  g.globalAlpha = .4; g.fillRect(x - len * .6, y - 14, len * 1.2, 28);
  g.restore();
  glow(g, x, y, len * .18, a, rgb);
}

// ---------- 闪电 ----------
function boltPts(seed, x0, y0, x1, y1, disp, depth = 7) {
  let pts = [[x0, y0], [x1, y1]];
  for (let d = 0; d < depth; d++) {
    const np = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
      const nx = -(by - ay), ny = bx - ax, l = Math.hypot(nx, ny) || 1;
      const off = (hash(seed * 13.1 + d * 7.7 + i * 3.3) - .5) * disp / Math.pow(1.85, d);
      np.push([(ax + bx) / 2 + nx / l * off, (ay + by) / 2 + ny / l * off], pts[i + 1]);
    }
    pts = np;
  }
  return pts;
}
function bolt(g, seed, x0, y0, x1, y1, a = 1, o = {}) {
  const { disp = 260, w = 3, rgb = '170,190,255', branches = 5 } = o;
  const draw = (pts, ww, aa) => {
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineJoin = 'round'; g.lineCap = 'round';
    for (const [lw, al, c] of [[ww * 9, .08, rgb], [ww * 3.5, .25, rgb], [ww, 1, '255,255,255']]) {
      g.strokeStyle = `rgba(${c},${al * aa})`; g.lineWidth = lw;
      g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
    }
    g.restore();
  };
  const pts = boltPts(seed, x0, y0, x1, y1, disp);
  draw(pts, w, a);
  for (let b = 0; b < branches; b++) {
    const i = Math.floor(pts.length * (.15 + .6 * hash(seed + b * 3.1)));
    const [sx, sy] = pts[i], ang = Math.atan2(y1 - y0, x1 - x0) + (hash(seed + b * 5.3) - .5) * 1.8, L = Math.hypot(x1 - x0, y1 - y0) * (.15 + .3 * hash(seed + b));
    draw(boltPts(seed + b * 17, sx, sy, sx + Math.cos(ang) * L, sy + Math.sin(ang) * L, disp * .5, 5), w * .5, a * .7);
  }
}

// ---------- 刀光 ----------
/**
 * 弧形刀光：圆心 (cx,cy)，半径 r，从角度 a0 扫到 a1。u 是扫动进度（0..1，可以 >1 表示消散），pal 是 JIN / LING。
 */
function slashArc(g, cx, cy, r, a0, a1, u, pal = JIN, o = {}) {
  const { width = 70, tail = .55, sq = .55, fade = 1 } = o;
  const head = clamp(u), t0 = Math.max(0, head - tail), dis = clamp(u - 1, 0, 1);
  if (head <= 0 || dis >= 1) return;
  const N = 48;
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  for (const [k, col, al] of [[1.0, pal.out, .35], [.55, pal.mid, .7], [.18, pal.core, 1]]) {
    for (let i = 0; i < N; i++) {
      const s0 = lerp(t0, head, i / N), s1 = lerp(t0, head, (i + 1) / N);
      const p = (i + .5) / N;
      const ww = width * k * Math.sin(p * Math.PI * .5 + .02) * (1 - dis) ;
      const A0 = lerp(a0, a1, s0), A1 = lerp(a0, a1, s1);
      g.strokeStyle = col; g.globalAlpha = al * fade * (1 - dis) * Math.pow(p, .6);
      g.lineWidth = Math.max(1, ww);
      g.beginPath(); g.moveTo(cx + Math.cos(A0) * r, cy + Math.sin(A0) * r * sq); g.lineTo(cx + Math.cos(A1) * r, cy + Math.sin(A1) * r * sq); g.stroke();
    }
  }
  g.restore();
}
/** 直线刀光（快速划过的一道光）。 */
function slashLine(g, x0, y0, x1, y1, u, pal = JIN, w = 30) {
  const head = outExpo(clamp(u * 1.4)), dis = clamp((u - .45) / .55);
  if (u <= 0 || dis >= 1) return;
  const hx = lerp(x0, x1, head), hy = lerp(y0, y1, head), tx = lerp(x0, x1, dis), ty = lerp(y0, y1, dis);
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  for (const [k, col, al] of [[3, pal.out, .3], [1.4, pal.mid, .7], [.45, pal.core, 1]]) {
    g.strokeStyle = col; g.globalAlpha = al * (1 - dis * .7); g.lineWidth = w * k * (1 - dis * .8);
    g.beginPath(); g.moveTo(tx, ty); g.lineTo(hx, hy); g.stroke();
  }
  g.restore();
}

// ---------- 动漫语法 ----------
/** 集中线。 */
function focusLines(g, T, cx, cy, o = {}) {
  const { n = 90, r0 = 380, a = .55, col = '255,255,255', fps = 12, seed = 7, w = 1 } = o;
  const k = Math.floor(T * fps);
  g.save(); g.fillStyle = `rgba(${col},${a})`;
  for (let i = 0; i < n; i++) {
    const ang = (i + hash(i * 3 + k * 7.7 + seed)) / n * TAU, rr = r0 * (.7 + .8 * hash(i * 9 + k * 1.3 + seed)), ww = (.004 + .012 * hash(i * 5 + k)) * w;
    const R = 2400;
    g.beginPath();
    g.moveTo(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr);
    g.lineTo(cx + Math.cos(ang - ww) * R, cy + Math.sin(ang - ww) * R);
    g.lineTo(cx + Math.cos(ang + ww) * R, cy + Math.sin(ang + ww) * R);
    g.fill();
  }
  g.restore();
}
/** 平行速度线。 */
function speedLines(g, T, ang, o = {}) {
  const { n = 60, a = .35, col = '255,255,255', speed = 5000, len = 600, seed = 3, w = 2, box = [0, 0, W, H] } = o;
  const ca = Math.cos(ang), sa = Math.sin(ang);
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const off = (hash(i * 2.9 + seed) - .5) * (W + H) * 1.2;
    const L = len * (.4 + hash(i * 7.1 + seed));
    const span = W + H + L * 2;
    const s = ((hash(i * 4.4 + seed) * span + T * speed * (.6 + .8 * hash(i))) % span) - span / 2;
    const x = W / 2 + ca * s - sa * off, y = H / 2 + sa * s + ca * off;
    g.strokeStyle = `rgba(${col},${a * (.4 + .6 * hash(i * 8.8))})`; g.lineWidth = w * (.5 + hash(i * 6.6 + seed) * 1.5);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x - ca * L, y - sa * L); g.stroke();
  }
  g.restore();
}
/** 冲击波：圆环 + 环内画面折射（需要 g 的当前内容）。 */
function shockwave(g, x, y, r, a = 1, o = {}) {
  const { w = 60, k = .06, rgb = '255,255,255', sq = 1, ring = .4 } = o;
  if (a <= 0 || r <= 0) return;
  snap.drawImage(g.canvas, 0, 0);
  g.save();
  g.beginPath(); g.ellipse(x, y, r + w, (r + w) * sq, 0, 0, TAU); g.ellipse(x, y, Math.max(1, r - w), Math.max(1, r - w) * sq, 0, 0, TAU, true); g.clip('evenodd');
  const sc = 1 + Math.min(k * a, 16 * a / Math.max(r, 60));   // 折射位移最多 16 px，不出重影
  g.translate(x, y); g.scale(sc, sc); g.translate(-x, -y);
  g.drawImage(SNAP, 0, 0);
  g.restore();
  g.save(); g.globalCompositeOperation = 'lighter';
  g.strokeStyle = `rgba(${rgb},${ring * a})`; g.lineWidth = w * .18;
  g.beginPath(); g.ellipse(x, y, r, r * sq, 0, 0, TAU); g.stroke();
  g.strokeStyle = `rgba(${rgb},${ring * .35 * a})`; g.lineWidth = w;
  g.stroke();
  g.restore();
}
/** 热浪：把区域内的画面按横条左右扭动。 */
function heatHaze(g, T, box, amt = 6) {
  snap.drawImage(g.canvas, 0, 0);
  const [x, y, w, h] = box, step = 6;
  for (let yy = y; yy < y + h; yy += step) {
    const off = amt * Math.sin(yy * .045 + T * 9) * Math.sin(yy * .013 - T * 3.1);
    g.drawImage(SNAP, x, yy, w, step, x + off, yy, w, step);
  }
}

// ---------- 冲击帧 / 后期 ----------
function invert(g) { g.save(); g.globalCompositeOperation = 'difference'; g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.restore(); }
function mono(g, c = 6, b = 1.15) { snap.drawImage(g.canvas, 0, 0); g.save(); g.filter = `grayscale(1) contrast(${c}) brightness(${b})`; g.drawImage(SNAP, 0, 0); g.restore(); }
function duo(g, col, c = 5) {
  mono(g, c, 1.1);
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = col; g.fillRect(0, 0, W, H); g.restore();
}
function flash(g, a, col = '#fff') { if (a <= 0) return; g.save(); g.globalAlpha = clamp(a); g.fillStyle = col; g.fillRect(0, 0, W, H); g.restore(); }
function dim(g, a) { flash(g, a, '#000'); }
function tint(g, col, a, mode = 'soft-light') { if (a <= 0) return; g.save(); g.globalCompositeOperation = mode; g.globalAlpha = clamp(a); g.fillStyle = col; g.fillRect(0, 0, W, H); g.restore(); }
function chroma(g, px) {
  if (px < .5) return;
  snap.drawImage(g.canvas, 0, 0);
  aux.globalCompositeOperation = 'copy'; aux.drawImage(SNAP, 0, 0);
  aux.globalCompositeOperation = 'multiply'; aux.fillStyle = '#f00'; aux.fillRect(0, 0, W, H);
  aux.globalCompositeOperation = 'source-over';
  g.save();
  g.globalCompositeOperation = 'multiply'; g.fillStyle = '#0ff'; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'lighter';
  g.translate(W / 2, H / 2); g.scale(1 + px / W * 2, 1 + px / H * 2); g.translate(-W / 2, -H / 2);
  g.drawImage(AUX, 0, 0);
  g.restore();
}
/** 名字卡：大字逐笔显出。 */
function nameCard(g, lt, ch, roman, sub, pal, x, y, align = 'left') {
  const u = outExpo(prog(lt, .05, .55));
  g.save();
  g.textAlign = align; g.textBaseline = 'alphabetic';
  g.font = `400 300px ${SERIF}`;
  const tw = g.measureText(ch).width;
  const x0 = align === 'left' ? x : x - tw;
  g.beginPath(); g.rect(x0 - 40, y - 330, (tw + 80) * u, 420); g.clip();
  g.shadowColor = pal.out; g.shadowBlur = 40;
  g.fillStyle = pal.core; g.fillText(ch, x, y);
  g.shadowBlur = 0; g.globalAlpha = .9; g.fillStyle = pal.mid;
  g.globalCompositeOperation = 'multiply'; g.fillText(ch, x, y);
  g.restore();
  g.save();
  const v = outx(prog(lt, .3, .8));
  g.globalAlpha = v; g.textAlign = align; g.fillStyle = '#fff';
  g.font = `600 30px ${SANS}`;
  if (g.letterSpacing !== undefined) g.letterSpacing = '18px';
  g.fillText(roman, x + (align === 'left' ? 6 : -6), y + 70);
  g.font = `400 26px ${SERIF}`; if (g.letterSpacing !== undefined) g.letterSpacing = '8px';
  g.globalAlpha = v * .8; g.fillText(sub, x + (align === 'left' ? 6 : -6), y + 118);
  g.fillStyle = pal.mid; g.globalAlpha = v;
  g.fillRect(align === 'left' ? x + 6 : x - 6 - 260 * v, y + 88, 260 * v, 3);
  g.restore();
}
