/* 《百年一线》画面引擎。每帧都是时间的纯函数，renderFrame(t) 由 tools/render.py 逐帧调用。 */
const W = 1920, H = 1080, TAU = Math.PI * 2;
const RED = '#e0301e';
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
window.__canvas = cv;
window.__total = 150;
const acc = document.createElement('canvas');
acc.width = W; acc.height = H;
const tmp = acc.getContext('2d');
const tvc = document.createElement('canvas');
tvc.width = W; tvc.height = H;
const tv = tvc.getContext('2d');
const SANS = '"Segoe UI Light","Microsoft YaHei Light","Microsoft YaHei",sans-serif';
const BOLD = '"Microsoft YaHei",sans-serif';

// ---------- 基础 ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const io = u => u * u * (3 - 2 * u);
const inx = (u, p = 3) => Math.pow(u, p);
const outx = (u, p = 3) => 1 - Math.pow(1 - u, p);
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const q = (t, fps) => Math.floor(t * fps + 1e-6) / fps;

const IMG = {};
const BG = ['63_eye', '95_eye', '20_eye', '63_room', '63_city', '63_face', '63_hand', '95_corridor', '95_rain', '79_fleet', '88_neon', '10_wall', '16_sky'];
const CUT = ['63_run_a', '63_run_b'];
function load(src) {
  return new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
}
async function boot() {
  await Promise.all([
    ...BG.map(async n => { IMG[n] = await load(`../assets/bg/${n}.jpg`).catch(() => load(`../assets/key/${n}.png`)); }),
    ...CUT.map(async n => { IMG[n] = await load(`../assets/cut/${n}.png`); }),
  ]);
  try { window.CLIPS = await (await fetch('../assets/frames/index.json')).json(); } catch (e) { window.CLIPS = {}; }
  try { window.KNOTS = await (await fetch('../assets/frames/knots.json')).json(); } catch (e) { window.KNOTS = {}; }
  makePaper();
  window.__ready = true;
  const p = new URLSearchParams(location.search);
  if (!p.get('render')) renderFrame(parseFloat(p.get('t') || '17'));
}
// 视频逐帧读取：画面先记录缺哪些帧，加载后重画一次。
const FR = new Map(); let missing = new Set();
function frame(name, sec, step = 24) {
  const n = (CLIPS[name] || 0);
  if (!n) return null;
  const st = Math.floor(sec * step + 1e-6) / step;
  const i = clamp(Math.floor(st * 24) + 1, 1, n);
  const k = `${name}/${String(i).padStart(4, '0')}`;
  const f = FR.get(k);
  if (f) { FR.delete(k); FR.set(k, f); return f; }
  missing.add(k);
  return null;
}
async function fetchMissing() {
  const ks = [...missing]; missing = new Set();
  await Promise.all(ks.map(async k => { FR.set(k, await load(`../assets/frames/${k}.jpg`)); }));
  while (FR.size > 90) FR.delete(FR.keys().next().value);
}
/** 播放一段素材。step 是每秒张数：12 就是一拍二的手绘节奏；摄影机由代码在 24 帧上运动。 */
function clip(g, name, sec, o = {}) {
  const { step = 12, fx = .5, fy = .5, z = 1, rot = 0, ox = 0, oy = 0 } = o;
  const f = frame(name, sec, step);
  if (!f) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); return (x, y) => [x * W, y * H]; }
  const m = cover(g, f, fx, fy, z, rot, ox, oy);
  const k = (window.KNOTS || {})[name];
  if (k) { const i = clamp(Math.floor(Math.floor(sec * step + 1e-6) / step * 24), 0, k.length - 1); m.knot = m(k[i][0], k[i][1]); }
  return m;
}
function silhouette(img, col) {
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = col;
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

/** 让图像上的 (fx,fy) 落在画面中心，返回把图像坐标映射到屏幕的函数。 */
function cover(g, img, fx, fy, z = 1, rot = 0, ox = 0, oy = 0) {
  const iw = img.width, ih = img.height;
  const s = Math.max(W / iw, H / ih) * z;
  if (Math.abs(rot) < .12) {                             // 小角度时把取景框限制在图内，留出旋转余量
    const c0 = Math.abs(Math.cos(rot)), s0 = Math.abs(Math.sin(rot));
    const hw = (W * c0 + H * s0) / 2 / s / iw, hh = (W * s0 + H * c0) / 2 / s / ih;
    fx = hw < .5 ? clamp(fx, hw, 1 - hw) : .5; fy = hh < .5 ? clamp(fy, hh, 1 - hh) : .5;
  }
  g.save();
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.translate(W / 2 + ox, H / 2 + oy); g.rotate(rot); g.scale(s, s);
  g.drawImage(img, -fx * iw, -fy * ih);
  g.restore();
  const c = Math.cos(rot), n = Math.sin(rot);
  return (x, y) => {
    const a = (x - fx) * iw * s, b = (y - fy) * ih * s;
    return [W / 2 + ox + a * c - b * n, H / 2 + oy + a * n + b * c];
  };
}
/** 贴人物：(ax,ay) 是图上的锚点，落在屏幕 (x,y)，高度 h。返回图上坐标到屏幕的映射。 */
function sprite(g, img, x, y, h, ax = .5, ay = 1, rot = 0, flip = false, sx = 1) {
  const s = h / img.height;
  g.save();
  g.imageSmoothingQuality = 'high';
  g.translate(x, y); g.rotate(rot); g.scale((flip ? -s : s) * sx, s);
  g.drawImage(img, -ax * img.width, -ay * img.height);
  g.restore();
  const c = Math.cos(rot), n = Math.sin(rot);
  return (u, v) => {
    const a = (u - ax) * img.width * s * (flip ? -1 : 1) * sx, b = (v - ay) * img.height * s;
    return [x + a * c - b * n, y + a * n + b * c];
  };
}
/** 红线：逐段变宽的折线，始终由代码绘制，任何缩放下都清晰。 */
function cord(g, pts, w0 = 7, w1 = 2, glow = 0, col = RED) {
  g.save();
  g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = col;
  if (glow) { g.shadowColor = 'rgba(255,70,40,.75)'; g.shadowBlur = glow; }
  const n = pts.length - 1;
  for (let i = 0; i < n; i++) {
    g.lineWidth = lerp(w0, w1, i / n);
    g.beginPath(); g.moveTo(pts[i][0], pts[i][1]); g.lineTo(pts[i + 1][0], pts[i + 1][1]); g.stroke();
  }
  g.restore();
}
function wave(x, y, ang, len, t, o = {}) {
  const { amp = 60, f = 1.6, sp = 4, n = 60, curl = 0 } = o;
  const dx = Math.cos(ang), dy = Math.sin(ang), pts = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n, d = s * len;
    const off = amp * s * (Math.sin(TAU * f * s - sp * t) + .4 * Math.sin(TAU * f * 2.3 * s - sp * 1.7 * t + 1));
    const c = curl * s * s * len;
    pts.push([x + dx * d - dy * (off + c), y + dy * d + dx * (off + c)]);
  }
  return pts;
}
/** 向镜头飞来的粒子，画成带速度的短线。 */
function flyers(g, t, o) {
  const { n = 80, speed = .5, seed = 1, cx = W / 2, cy = H / 2, col = '#ffb050', w = 2.4, len = .08, wind = 0, spread = 1.2 } = o;
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a = hash(i * 1.3 + seed) * 2 - 1, b = hash(i * 2.7 + seed) * 2 - 1;
    const z = (hash(i * 3.1 + seed) + t * speed * (.7 + .6 * hash(i + seed))) % 1;
    const p0 = 1 / (1.04 - z), p1 = 1 / (1.04 - Math.max(0, z - len));
    const x = cx + a * W * .28 * spread * p0 + wind * z, y = cy + b * H * .28 * spread * p0;
    const x1 = cx + a * W * .28 * spread * p1 + wind * (z - len), y1 = cy + b * H * .28 * spread * p1;
    g.globalAlpha = clamp(z * 3) * clamp((1 - z) * 6);
    g.strokeStyle = col; g.lineWidth = w * Math.min(p0, 9) * .45;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x1, y1); g.stroke();
  }
  g.restore();
}
function caption(g, T, a, b, year, line, sub, o = {}) {
  if (T < a || T > b) return;
  const u = outx(prog(T, a, a + .5)) * (1 - prog(T, b - .4, b));
  const { x = 120, y = H - 150, col = '#fff', shadow = 'rgba(0,0,0,.65)' } = o;
  g.save();
  g.globalAlpha = u;
  const pg = g.createLinearGradient(x - 90, 0, x + 700, 0);
  pg.addColorStop(0, 'rgba(0,0,0,0)'); pg.addColorStop(.14, 'rgba(0,0,0,.5)'); pg.addColorStop(.6, 'rgba(0,0,0,.36)'); pg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = pg;
  for (let i = 0; i < 30; i++) {                         // 上下也柔和淡出，看不出底板的边
    g.globalAlpha = u * Math.pow(Math.sin((i + .5) / 30 * Math.PI), 1.4);
    g.fillRect(x - 90, y - 130 + i * 10, 790, 10);
  }
  g.globalAlpha = u;
  g.fillStyle = col;
  g.shadowColor = shadow; g.shadowBlur = 18;
  g.textBaseline = 'alphabetic';
  g.font = `200 92px ${SANS}`;
  g.fillText(year, x, y);
  g.shadowBlur = 0;
  g.fillStyle = RED;
  g.fillRect(x + 2, y + 18, 300 * u, 4);
  g.shadowBlur = 14;
  g.fillStyle = col;
  g.font = `400 34px ${BOLD}`;
  g.fillText(line, x, y + 68);
  if (sub) { g.globalAlpha = u * .8; g.font = `300 24px ${BOLD}`; g.fillText(sub, x, y + 106); }
  g.restore();
}
let paperC = null;
function makePaper() {
  paperC = document.createElement('canvas'); paperC.width = W; paperC.height = H;
  const g = paperC.getContext('2d');
  g.fillStyle = '#f3efe4'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 5200; i++) {                     // 纸纤维
    g.strokeStyle = `rgba(${90 + hash(i) * 60},${80 + hash(i + 1) * 50},60,${.02 + hash(i + 2) * .05})`;
    const x = hash(i * 3) * W, y = hash(i * 5) * H, a = hash(i * 7) * TAU, l = 6 + hash(i * 9) * 30;
    g.lineWidth = .7; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
}
const flash = (g, a, col = '#fff') => { if (a <= 0) return; g.save(); g.globalAlpha = clamp(a); g.fillStyle = col; g.fillRect(0, 0, W, H); g.restore(); };

// ---------- 1963 ----------
function city(g, T) {
  const t = q(T, 8);                                  // 一拍三：每秒 8 张
  const img = IMG['63_city'], sc = H / img.height, tw = img.width * sc;
  const off = (t * 1500) % (tw * 2);
  g.fillStyle = '#ddd'; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 4; k++) {
    const x = k * tw - off;
    g.save();
    if (k % 2) { g.translate(x + tw, 0); g.scale(-sc, sc); } else { g.translate(x, 0); g.scale(sc, sc); }
    g.drawImage(img, 0, 0);
    g.restore();
  }
  const a = Math.floor(t * 8) % 2 === 0;
  const hgt = 690, X = 1120, Y = 1030 - (a ? 0 : 24);
  const pm = a ? sprite(g, IMG['63_run_a'], X, Y, hgt, .63, 1) : sprite(g, IMG['63_run_b'], X, Y, hgt * .973, .65, 1);
  const [wx, wy] = a ? pm(.29, .37) : pm(.37, .49);
  cord(g, wave(wx, wy, Math.PI + .08, 1500, t, { amp: 90, f: 1.1, sp: 9 }), 9, 5);
  g.save();                                            // 最近的一层：路灯杆，跑得最快
  for (let i = 0; i < 3; i++) {
    const x = W + 200 - ((t * 3600 + i * 880) % (W + 700));
    g.fillStyle = '#111'; g.fillRect(x, 0, 46, H);
  }
  g.strokeStyle = 'rgba(20,20,20,.55)';
  for (let i = 0; i < 12; i++) {
    const y = 80 + hash(i + Math.floor(t * 8) * 7) * 920, l = 180 + hash(i * 3 + t) * 420;
    const x = hash(i * 9 + t * 3) * W;
    g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y); g.stroke();
  }
  g.restore();
}
function room(g, T) {
  const u1 = io(prog(T, 16.05, 17.1)), u2 = inx(prog(T, 17.6, 19), 3);
  const lz = Math.log(8.4);
  const z = Math.exp(lz * (1 - u1) + lz * u2) * (1 + .03 * prog(T, 17.1, 17.6));
  const fx = .4902, fy = .4112;
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const m = cover(g, IMG['63_room'], fx, fy, z, 0.00001);
  city(tv, T);
  const [x0, y0] = m(660 / 1536, 350 / 1024), [x1, y1] = m(846 / 1536, 493 / 1024);
  const sw = x1 - x0, sh = y1 - y0;
  g.save();
  g.beginPath();
  g.roundRect(x0, y0, sw, sh, sw * .07);
  g.clip();
  const ar = sw / sh, cw = H * ar;
  g.drawImage(tvc, (W - cw) / 2 - 170, 0, cw, H, x0, y0, sw, sh);
  g.fillStyle = 'rgba(0,0,0,.13)';
  const step = Math.max(3, sh / 240);
  for (let y = y0; y < y1; y += step * 2) g.fillRect(x0, y, sw, step);
  g.restore();
  g.save();                                            // 屏幕的光洒回房间
  g.globalCompositeOperation = 'lighter';
  const fl = .13 + .05 * hash(Math.floor(T * 8));
  const r = g.createRadialGradient(x0 + sw / 2, y0 + sh / 2, sw * .3, x0 + sw / 2, y0 + sh / 2, sw * 3.2);
  r.addColorStop(0, `rgba(200,215,240,${fl})`); r.addColorStop(1, 'rgba(200,215,240,0)');
  g.fillStyle = r; g.fillRect(0, 0, W, H);
  g.restore();
}
const HITS = [[20, 'face', 1.04, 0], [21, 'hand', 1.0, 0], [22, 'face', 1.34, 0], [23, 'hand', 1.5, 0]];
function hits(g, T) {
  let h = HITS[0];
  for (const c of HITS) if (T >= c[0]) h = c;
  const d = T - h[0], t = q(T, 8);
  const jx = (hash(Math.floor(t * 8)) - .5) * 14, jy = (hash(Math.floor(t * 8) + 5) - .5) * 14;
  if (h[1] === 'face') {
    cover(g, IMG['63_face'], .5, .43, h[2] + d * .05, 0, jx, jy);
    cord(g, wave(-40, 930 + jy, -.08, 2100, t, { amp: 130, f: .8, sp: 8 }), 16, 9);
  } else {
    const m = cover(g, IMG['63_hand'], .56, .6, h[2] + d * .05, 0, jx, jy);
    const [kx, ky] = m(.58, .70);
    cord(g, wave(kx, ky, .35, 1700, t, { amp: 170, f: .9, sp: 9 }), 16, 8);
  }
  flash(g, 1 - d / .09);
}
function sheets(g, T) {
  g.fillStyle = '#17181c'; g.fillRect(0, 0, W, H);
  const N = 44, a = 23.9, b = 26.5;
  g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = N - 1; i >= 0; i--) {
    const ti = a + (b - a) * Math.pow(i / (N - 1), .8);
    const d = (ti - T) * 1.1;
    if (d < -.28 || d > 2.6) continue;
    const p = 1 / (d + .3);
    const x = W / 2 + (hash(i) - .5) * 1500 * p * .9, y = H / 2 + (hash(i + 9) - .5) * 900 * p * .9;
    const r = (hash(i + 3) - .5) * .5 + d * .4;
    const w = 300 * p, h = 400 * p;
    g.save();
    g.translate(x, y); g.rotate(r);
    g.globalAlpha = clamp((2.6 - d) * 1.5);
    g.fillStyle = '#efeee9'; g.fillRect(-w / 2, -h / 2, w, h);
    g.strokeStyle = '#222'; g.lineWidth = 5 * p; g.strokeRect(-w / 2 + 12 * p, -h / 2 + 12 * p, w - 24 * p, h - 24 * p);
    g.fillStyle = '#16161a';
    g.font = `700 ${34 * p}px ${BOLD}`; g.fillText('第', 0, -h * .32);
    g.font = `400 ${118 * p}px Impact,${BOLD}`; g.fillText(String(Math.round(1 + Math.pow(i / (N - 1), 1.7) * 192)), 0, 0);
    g.font = `700 ${34 * p}px ${BOLD}`; g.fillText('话', 0, h * .32);
    g.restore();
  }
  g.restore();
  const pts = [];
  for (let i = 0; i <= 60; i++) {                     // 红线穿过所有纸页，消失在深处
    const s = i / 60, p = 1 / (s * 2.4 + .3);
    pts.push([W / 2 + (Math.sin(s * 9 - T * 7) * 300 - 240) * p * .4, H / 2 + (Math.cos(s * 7 - T * 5) * 180 + 260) * p * .4]);
  }
  cord(g, pts, 18, 2);
  const u = prog(T, 24.1, 24.3) * (1 - prog(T, 26.1, 26.4));
  if (u > 0) {
    g.save();
    g.globalAlpha = u;
    g.fillStyle = '#0d0d10'; g.fillRect(0, H / 2 - 170, W, 340);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
    g.font = `400 170px Impact,${BOLD}`; g.fillText('1963', W / 2, H / 2 - 44);
    g.font = `700 46px ${BOLD}`; g.fillText('每周一集，动画走进每个家庭', W / 2, H / 2 + 88);
    g.font = `300 26px ${BOLD}`; g.globalAlpha = u * .75; g.fillText('《铁臂阿童木》 全 193 话', W / 2, H / 2 + 138);
    g.restore();
  }
}
function eye63(g, T) {
  const u = prog(T, 26.5, 27.8), z = Math.exp(inx(u, 2.2) * 2.5);
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const m = cover(g, IMG['63_eye'], .51, .59, z, 0.00001);
  const [px, py] = m(.51, .6);
  const pts = [];
  for (let i = 0; i <= 50; i++) {
    const s = i / 50;
    pts.push([lerp(-60, px, s) + Math.sin(s * 8 + T * 6) * 40 * (1 - s), lerp(H + 40, py, io(s)) + Math.sin(s * 5 - T * 5) * 30 * (1 - s)]);
  }
  cord(g, pts, 14, 3);
}
function s1963(g, T) {
  if (T < 19) room(g, T);
  else if (T < 20) { city(g, T); }
  else if (T < 24) hits(g, T);
  else if (T < 26.5) sheets(g, T);
  else eye63(g, T);
  if (T < 26.5 && T > 19) { g.save(); g.fillStyle = `rgba(0,0,0,${.03 * hash(Math.floor(T * 24))})`; g.fillRect(0, 0, W, H); g.restore(); }
}

// ---------- 1995 ----------
function bubbles(g, T, seed, n, big) {
  g.save();
  for (let i = 0; i < n; i++) {
    const sp = 40 + hash(i + seed) * 90, r = (big ? 16 + hash(i * 2) * 26 : 2 + hash(i * 2 + seed) * 7);
    const y = H + 60 - ((hash(i * 5 + seed) * H * 1.2 + T * sp * (big ? 2 : 1)) % (H + 120));
    const x = hash(i * 7 + seed) * W + Math.sin(T * 1.3 + i) * 18;
    g.strokeStyle = `rgba(210,240,240,${big ? .22 : .42})`; g.lineWidth = big ? 2 : 1.2;
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke();
    g.fillStyle = 'rgba(235,255,255,.5)';
    g.beginPath(); g.arc(x - r * .35, y - r * .35, r * .16, 0, TAU); g.fill();
  }
  g.restore();
}
function under(g, T) {
  const u = prog(T, 60, 63.5);
  const mU = clip(g, 'test_under', (T - 60) * .9 + .3, { step: 12, z: lerp(1.03, 1.12, io(u)), rot: Math.sin(T * .6) * .008 + .00001 });
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) {
    const x = W * (.25 + .17 * i) + Math.sin(T * .5 + i * 2) * 70, w = 50 + 40 * hash(i);
    const gr = g.createLinearGradient(0, 0, 0, H * .8);
    gr.addColorStop(0, `rgba(170,235,225,${.06 + .03 * Math.sin(T * 1.7 + i)})`); gr.addColorStop(1, 'rgba(170,235,225,0)');
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(x - w, 0); g.lineTo(x + w, 0); g.lineTo(x + w * 2.4 + 120 * (i - 1.5), H * .8); g.lineTo(x - w * 2.4 + 120 * (i - 1.5), H * .8); g.fill();
  }
  g.restore();
  bubbles(g, T, 8, 5, true);
  if (mU.knot) cord(g, wave(mU.knot[0], mU.knot[1], -1.15, 860, T, { amp: 66, f: 1, sp: 1.1, curl: .22 }), 4.5, 2);
  flash(g, 1 - prog(T, 60, 61.0), '#000');
}
function title95(g, T) {
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  g.save();
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#f2f2f2';
  g.font = `200 260px ${SANS}`; g.fillText('1995', W / 2, H / 2 - 50);
  const u = prog(T, 64.3, 66.8);
  g.fillStyle = RED; g.fillRect(W / 2 - 330 * u, H / 2 + 92, 660 * u, 3);
  const a = prog(T, 64.6, 65.3);
  g.globalAlpha = a; g.fillStyle = '#ddd';
  g.font = `300 38px ${BOLD}`; g.fillText('动画开始向内看', W / 2, H / 2 + 158);
  g.globalAlpha = a * .7;
  g.font = `300 25px ${BOLD}`; g.fillText('《新世纪福音战士》  《攻壳机动队》', W / 2, H / 2 + 212);
  g.restore();
}
function corridor(g, T) {
  const u = prog(T, 67, 70.5);
  const m = cover(g, IMG['95_corridor'], .5, .53, lerp(1.02, 1.05, u), 0.00001);
  const [a0, a1] = m(.487, .6), [b0, b1] = m(.49, .705), [c0, c1] = m(.43, .86), [d0, d1] = m(.36, 1.04);
  const pts = [];
  for (let i = 0; i <= 50; i++) {                      // 红线从她手腕垂到地面，一路伸到镜头脚下
    const s = i / 50, r = 1 - s;
    const x = r * r * r * a0 + 3 * r * r * s * b0 + 3 * r * s * s * c0 + s * s * s * d0;
    const y = r * r * r * a1 + 3 * r * r * s * b1 + 3 * r * s * s * c1 + s * s * s * d1;
    pts.push([x + Math.sin(s * 6 + T * .5) * 2 * s, y]);
  }
  cord(g, pts, 1.4, 9);
  const off = (T > 68.1 && T < 68.17) || (T > 68.31 && T < 68.44) || (T > 69.62 && T < 69.68);
  if (off) { g.save(); g.fillStyle = 'rgba(6,10,20,.34)'; g.fillRect(0, 0, W, H); g.restore(); }
}
function rain(g, T) {
  const u = prog(T, 70.5, 72);
  cover(g, IMG['95_rain'], lerp(.46, .54, u), .5, 1.1, 0.00001);
  g.save();
  g.strokeStyle = 'rgba(205,225,240,.28)'; g.lineWidth = 1.2;
  for (let i = 0; i < 150; i++) {                      // 窗外的雨
    const sp = 1500 + hash(i) * 900, x = hash(i * 3) * W;
    const y = (hash(i * 5) * H + T * sp) % (H + 100) - 60;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x - 6, y + 46); g.stroke();
  }
  for (let i = 0; i < 28; i++) {                       // 玻璃上慢慢滑落的水珠，离镜头最近
    const x = hash(i * 11) * W, y = ((hash(i * 13) * H + T * (70 + 120 * hash(i))) % (H + 200)) - 80, r = 4 + hash(i * 17) * 8;
    const gr = g.createLinearGradient(x, y - 110, x, y);
    gr.addColorStop(0, 'rgba(225,240,250,0)'); gr.addColorStop(1, 'rgba(225,240,250,.3)');
    g.strokeStyle = gr; g.lineWidth = r * .8;
    g.beginPath(); g.moveTo(x + 4, y - 110); g.lineTo(x, y); g.stroke();
    g.fillStyle = 'rgba(235,245,255,.5)';
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  g.restore();
}
function eye95(g, T) {
  const u = prog(T, 72, 73.65), z = Math.exp(inx(u, 2.6) * 3.15);
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const m = cover(g, IMG['95_eye'], .51, .52, z, 0.00001);
  const [px, py] = m(.51, .52);
  if (Math.floor(T * 4) % 2 === 0) {                   // 瞳孔里闪动的光标
    const s = Math.max(10, 17 * Math.min(z, 3));
    g.fillStyle = '#e8f4ff'; g.fillRect(px - s * .35, py - s * .8, s * .7, s * 1.6);
  }
  flash(g, prog(T, 73.45, 73.65), '#000');
  if (T > 73.45 && Math.floor(T * 4) % 2 === 0) { g.fillStyle = '#e8f4ff'; g.fillRect(W / 2 - 18, H / 2 - 40, 36, 80); }
}
function s1995(g, T) {
  if (T < 64) under(g, T);
  else if (T < 67) title95(g, T);
  else if (T < 70.5) corridor(g, T);
  else if (T < 72) rain(g, T);
  else eye95(g, T);
}

// ---------- 开场 ----------
function pencil(g, x, y, a = -1.05) {
  g.save();
  g.translate(x, y); g.rotate(a);
  g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(16, 26, 520, 30);
  g.fillStyle = '#e8b52c'; g.fillRect(40, -15, 520, 30);
  g.fillStyle = '#c9951a'; g.fillRect(40, 5, 520, 10);
  g.fillStyle = '#e9cfa6'; g.beginPath(); g.moveTo(0, 0); g.lineTo(44, -15); g.lineTo(44, 15); g.fill();
  g.fillStyle = '#2b2b2e'; g.beginPath(); g.moveTo(0, 0); g.lineTo(14, -5); g.lineTo(14, 5); g.fill();
  g.restore();
}
function opening(g, T) {
  const z = 1 + .02 * T + inx(prog(T, 4.6, 6), 3) * 9;
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  g.save();
  g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2);
  g.drawImage(paperC, 0, 0);
  const u = outx(prog(T, 3.0, 4.7), 2), pts = [];
  const n = Math.floor(u * 90);
  for (let i = 0; i <= n; i++) {                       // 手画的红线：微微抖动，由左向中心
    const s = i / 90;
    pts.push([lerp(150, W / 2, s), H / 2 + Math.sin(s * 5) * 22 * (1 - s) + (hash(i) - .5) * 2.4]);
  }
  if (pts.length > 1) cord(g, pts, 5, 7);
  const tip = pts.length ? pts[pts.length - 1] : [150, H / 2];
  const py = lerp(-500, 0, outx(prog(T, 1.4, 3.0), 4));
  if (T < 5) pencil(g, tip[0], tip[1] + py, -1.05 + Math.sin(T * 9) * .012);
  g.restore();
  flash(g, 1 - prog(T, 0, 1), '#000');
  flash(g, prog(T, 5.55, 6), '#111');
}

// ---------- 1917–1958 ----------
function filmStrip(g, T) {
  const d = T - 10.0, sp = 2600 * (1 + d);
  g.fillStyle = '#0b0b0b'; g.fillRect(0, 0, W, H);
  const fh = 500, off = (d * sp) % fh;
  for (let k = -1; k < 4; k++) {
    const y = k * fh + off - 60;
    const f = frame('c_paper', (k * .5 + 1 + d) % 2.3, 8);
    g.save(); g.beginPath(); g.rect(360, y + 14, 1200, fh - 28); g.clip();
    if (f) g.drawImage(f, 360, y + 14, 1200, 675);
    g.restore();
    for (let i = 0; i < 6; i++) {
      g.fillStyle = '#e8e4da';
      g.fillRect(240, y + 18 + i * 80, 60, 46); g.fillRect(1620, y + 18 + i * 80, 60, 46);
    }
  }
  g.save();
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
  g.shadowColor = '#000'; g.shadowBlur = 30;
  g.font = `200 240px ${SANS}`; g.fillText('1917', W / 2, H / 2 - 20);
  g.font = `400 40px ${BOLD}`; g.fillText('第一批日本动画短片', W / 2, H / 2 + 120);
  g.restore();
}
function s1917(g, T) {
  if (T < 10) {
    const u = prog(T, 6, 10);
    const m = clip(g, 'c_paper', (T - 6) * .6, { step: 8, z: lerp(1.1, 1.02, u), fx: lerp(.42, .55, u) });
    const q8 = q(T, 8);
    const [hx, hy] = m(.47, .71);
    cord(g, wave(-40, H * .74, -.03, hx + 80, q8, { amp: 16, f: 2, sp: 5 }), 6, 5);
    flash(g, 1 - prog(T, 6, 6.5), '#111');
    if (hash(Math.floor(T * 8)) > .84) flash(g, .08, '#fff');
    return;
  }
  if (T < 11.6) { filmStrip(g, T); return; }
  const f = frame('c_lotus', (T - 11.6) * .68, 12);
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  if (f) {
    const z = lerp(1.03, 1.12, prog(T, 11.6, 16));
    g.save(); g.filter = 'grayscale(1)'; cover(g, f, .5, .55, z, 0.00001); g.restore();
    const r = 40 + outx(prog(T, 12.1, 14.2), 2) * 1500;   // 颜色从中心像墨一样渗开
    g.save(); g.beginPath();
    for (let i = 0; i <= 60; i++) {
      const a = i / 60 * TAU, rr = r * (1 + .1 * Math.sin(a * 7 + 1) + .06 * Math.sin(a * 13 + T));
      g.lineTo(W * .55 + Math.cos(a) * rr, H * .55 + Math.sin(a) * rr);
    }
    g.closePath(); g.clip();
    cover(g, f, .5, .55, z, 0.00001);
    g.restore();
  }
  caption(g, T, 13, 15.6, '1958', '日本第一部彩色动画长片', '《白蛇传》');
  const ir = prog(T, 15.4, 16);                          // 光圈收拢，进入电视屏
  if (ir > 0) {
    g.save(); g.fillStyle = '#000';
    g.beginPath(); g.rect(0, 0, W, H); g.arc(W / 2, H / 2, (1 - io(ir)) * 1150, 0, TAU, true); g.fill();
    g.restore();
  }
}

// ---------- 1974–1979 ----------
function fleet(g, T) {
  const u = prog(T, 28, 32);
  g.fillStyle = '#02030a'; g.fillRect(0, 0, W, H);
  const a = clamp((T - 28) / .35);
  g.save(); g.globalAlpha = a;
  const m = cover(g, IMG['79_fleet'], .5, lerp(.22, .68, io(u)), lerp(1.55, 1.4, io(u)), Math.sin(T * .9) * .012 + .00001);
  g.restore();
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const ex of [.46, .5, .54]) {                    // 引擎喷口的光
    const [x, y] = m(ex, .955), r = 90 + 34 * hash(Math.floor(T * 24) + ex * 9);
    const gr = g.createRadialGradient(x, y, 4, x, y, r * 2.2);
    gr.addColorStop(0, 'rgba(255,225,160,.85)'); gr.addColorStop(1, 'rgba(255,120,30,0)');
    g.fillStyle = gr; g.fillRect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4);
  }
  g.restore();
  flyers(g, T, { n: 70, speed: .5, seed: 21, col: '#dfe8ff', w: 2, len: .04 });
  for (let i = 0; i < 3; i++) {                          // 远处掠过的炮光
    const t0 = 29 + i * .9, v = prog(T, t0, t0 + .28);
    if (v > 0 && v < 1) {
      g.save(); g.strokeStyle = '#ffe48a'; g.lineWidth = 5; g.shadowColor = '#ffb030'; g.shadowBlur = 22;
      const y = 160 + i * 240;
      g.beginPath(); g.moveTo(-200 + v * 2400, y); g.lineTo(-700 + v * 2400, y + 90); g.stroke();
      g.restore();
    }
  }
}
function cockpit(g, T) {
  const d = T - 35.5;
  cover(g, IMG['79_fleet'], .5, lerp(.62, .5, prog(T, 35.5, 38.5)), lerp(1.05, 1.22, prog(T, 35.5, 38.5)), Math.sin(T * .8) * .02 + .00001);
  g.save(); g.fillStyle = 'rgba(4,8,22,.32)'; g.fillRect(0, 0, W, H); g.restore();
  flyers(g, T, { n: 60, speed: .3, seed: 33, col: '#c9d6ff', w: 2, len: .03, cy: 300 });
  const shake = Math.sin(T * 47) * 2.4;
  g.save(); g.translate(0, shake);
  g.fillStyle = '#20232b';
  g.beginPath(); g.moveTo(0, 0); g.lineTo(290, 0); g.lineTo(120, 640); g.lineTo(0, 640); g.fill();
  g.beginPath(); g.moveTo(W, 0); g.lineTo(W - 290, 0); g.lineTo(W - 120, 640); g.lineTo(W, 640); g.fill();
  g.fillStyle = '#343843'; g.fillRect(0, 610, W, 480);
  g.fillStyle = '#23262f'; g.beginPath(); g.moveTo(0, 860); g.lineTo(W, 760); g.lineTo(W, H); g.lineTo(0, H); g.fill();
  g.fillStyle = '#596071'; g.fillRect(0, 610, W, 9);
  g.fillStyle = '#14161c'; g.fillRect(0, 619, W, 16);
  g.fillStyle = '#50586a';
  g.beginPath(); g.moveTo(290, 0); g.lineTo(304, 0); g.lineTo(134, 640); g.lineTo(120, 640); g.fill();
  g.beginPath(); g.moveTo(W - 290, 0); g.lineTo(W - 304, 0); g.lineTo(W - 134, 640); g.lineTo(W - 120, 640); g.fill();
  // 雷达
  const rx = W / 2, ry = 830, rr = 170;
  g.fillStyle = '#06210f'; g.beginPath(); g.arc(rx, ry, rr, 0, TAU); g.fill();
  g.strokeStyle = '#4cf08a'; g.lineWidth = 2;
  for (const f of [.33, .66, 1]) { g.beginPath(); g.arc(rx, ry, rr * f, 0, TAU); g.stroke(); }
  const a = T * 3.4;
  for (let i = 0; i < 24; i++) {
    g.strokeStyle = `rgba(76,240,138,${(1 - i / 24) * .6})`; g.lineWidth = 5;
    g.beginPath(); g.moveTo(rx, ry); g.lineTo(rx + Math.cos(a - i * .03) * rr, ry + Math.sin(a - i * .03) * rr); g.stroke();
  }
  // 依次亮起的开关，跟着节拍
  const beat = .5;
  const on = Math.floor(d / (beat / 2));
  for (let i = 0; i < 44; i++) {
    const side = i % 2 ? 1 : -1, c = Math.floor(i / 2), x = W / 2 + side * (260 + (c % 6) * 88), y = 700 + Math.floor(c / 6) * 74;
    const lit = i < on;
    g.fillStyle = lit ? (i % 7 === 0 ? '#ff4630' : i % 3 === 0 ? '#ffc23a' : '#54e08c') : '#3b3e47';
    if (lit) { g.shadowColor = g.fillStyle; g.shadowBlur = 18; }
    g.fillRect(x - 28, y - 16, 56, 32); g.shadowBlur = 0;
  }
  g.restore();
  caption(g, T, 35.7, 38.3, '1979', '机器人有了战争和重量', '《宇宙战舰大和号》1974   《机动战士高达》1979', { y: 170 });
}
function launch(g, T) {
  const u = prog(T, 38.5, 42), sp = .15 + inx(u, 2.2) * 2.6;
  g.fillStyle = '#02030a'; g.fillRect(0, 0, W, H);
  const ph = 1.2 * Math.pow(u, 3.2) * 6;
  flyers(g, ph, { n: 240, speed: 1, seed: 40, col: '#e2ebff', w: 2.8, len: .02 + u * .34, spread: 1.6 });
  flyers(g, ph * .8, { n: 90, speed: 1, seed: 44, col: '#7fb6ff', w: 3.2, len: .03 + u * .3, spread: 1.8 });
  const pts = wave(W / 2, H / 2, 1.9, 1400, T, { amp: 90 * (1 - u), f: 1, sp: 7 });
  cord(g, pts.reverse(), 16, 2);
  flash(g, inx(prog(T, 40.9, 42), 2.4));
}

// ---------- 1984–1988 ----------
function s1984(g, T) {
  if (T < 46) {
    const u = prog(T, 42, 46);
    clip(g, 'c_grass', T - 42, { step: 24, z: lerp(1.03, 1.22, u), fy: lerp(.6, .5, u), oy: Math.sin(T * 1.9) * 7, rot: Math.sin(T * .8) * .012 + .00001 });
    flyers(g, T, { n: 34, speed: .55, seed: 52, col: 'rgba(255,255,235,.8)', w: 1.8, len: .05, cy: H * .72 });
    flash(g, 1 - prog(T, 42, 42.7));
    caption(g, T, 43, 45.8, '1984', '手绘开始飞翔', '《风之谷》   吉卜力工作室成立于 1985');
    return;
  }
  if (T < 50) {
    const u = prog(T, 46, 50);
    const mG = clip(g, 'c_glider', T - 46, { step: 12, z: lerp(1.16, 1.05, io(u)), fx: lerp(.58, .47, io(u)), oy: Math.sin(T * 1.4) * 12, rot: Math.sin(T * .9) * .018 + .00001 });
    flyers(g, T, { n: 26, speed: .8, seed: 56, col: 'rgba(255,255,255,.75)', w: 2, len: .08, wind: -900 });
    if (mG.knot) cord(g, wave(mG.knot[0], mG.knot[1], Math.PI + .1, 1500, T, { amp: 70, f: 1.5, sp: 7 }), 6, 3);
    return;
  }
  const u = prog(T, 50, 55.5), z = 1.45 * Math.exp(io(u) * .95);
  g.fillStyle = '#04030a'; g.fillRect(0, 0, W, H);
  const rot = Math.sin(u * 2.2) * .2 + .00001;
  const m = cover(g, IMG['88_neon'], .62, .46, z, rot, Math.sin(T * 13) * 3, 0);
  const [cx, cy] = m(.76, .44);
  flyers(g, T, { n: 150, speed: 1.1, seed: 60, col: '#ff3a2a', w: 3.4, len: .17, cx, cy });
  flyers(g, T, { n: 60, speed: .9, seed: 64, col: '#39e6d0', w: 2.4, len: .14, cx, cy });
  flash(g, 1 - prog(T, 50, 50.35));
  // 手绘光球：一圈圈线条向外吞没画面
  const v = prog(T, 54.2, 58);
  if (v > 0) {
    const R = 30 + inx(v, 2.2) * 1500;
    g.save();
    const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, R);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(.72, '#fff4ea'); gr.addColorStop(.92, 'rgba(255,160,120,.9)'); gr.addColorStop(1, 'rgba(255,60,40,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(W / 2, H / 2, R, 0, TAU); g.fill();
    g.strokeStyle = '#ff5238'; g.lineWidth = 4;
    for (let i = 0; i < 7; i++) {
      const rr = R * (1 + i * .05) + Math.sin(T * 30 + i) * 5;
      g.globalAlpha = .6 - i * .07;
      g.beginPath(); g.arc(W / 2, H / 2, rr, 0, TAU); g.stroke();
    }
    g.restore();
  }
  caption(g, T, 53.2, 56, '1988', '手绘的极限', '《阿基拉》', { col: '#fff', y: 180 });
  if (T >= 58) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); bubbles(g, T, 3, Math.floor(prog(T, 58.4, 60) * 26), false); }
}

// ---------- 2000 年代 ----------
function pixelIn(g, T) {
  const c = 96, cols = W / c, rows = Math.ceil(H / c), u = prog(T, 74, 75);
  g.save();
  g.fillStyle = '#000';
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const d = Math.hypot(x - cols / 2, y - rows / 2) / 12 + hash(x * 31 + y) * .25;
    if (d > u * 1.5) g.fillRect(x * c, y * c, c + 1, c + 1);
    else if (d > u * 1.5 - .12) { g.fillStyle = ['#ff5a7a', '#42c8ff', '#ffe14a', '#fff'][(x + y) % 4]; g.fillRect(x * c, y * c, c + 1, c + 1); g.fillStyle = '#000'; }
  }
  g.restore();
}
const WALL = ['c_class', 'c_glider', 'c_slope', 'c_night', 'test_under', 'c_lotus', 'c_swing', 'c_grass', 'c_hangar'];
function channels(g, T) {
  const bt = .5, n = Math.floor((T - 85) / bt), d = T - 85;
  const grid = n < 4 ? 2 : 3, cw = W / grid, ch = H / grid;
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < grid * grid; i++) {
    const c = WALL[(i * 2 + n * (i % 2 ? 1 : 3)) % WALL.length];
    const f = frame(c, (d + i * .37) % 2.9, 12);
    const x = (i % grid) * cw, y = Math.floor(i / grid) * ch;
    if (f) g.drawImage(f, x + 3, y + 3, cw - 6, ch - 6);
  }
  flash(g, .55 - ((T - 85) % bt) / .1);
  g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = 'rgba(0,0,0,.72)'; g.fillRect(0, H / 2 - 92, W, 184);
  g.fillStyle = '#fff'; g.font = `700 62px ${BOLD}`; g.fillText('深夜动画，一季几十部', W / 2, H / 2 - 16);
  g.font = `300 28px ${BOLD}`; g.fillText('动画从孩子的节目，变成了所有人的日常', W / 2, H / 2 + 46);
  g.restore();
}
function s2000(g, T) {
  if (T < 80) {
    const mC = clip(g, 'c_class', (T - 74.4) * .7, { step: 12, z: lerp(1.02, 1.1, prog(T, 74, 80)), fy: .46 });
    if (mC.knot) cord(g, wave(mC.knot[0], mC.knot[1], 1.4, 420, T, { amp: 26, f: 1, sp: 2 }), 3.5, 2);
    pixelIn(g, T);
    caption(g, T, 75.2, 79.4, '2000', '从赛璐璐到数字', null, { col: '#fff' });
    return;
  }
  if (T < 85) {
    const u = prog(T, 80, 85);
    clip(g, 'c_slope', (T - 80) * .8, { step: 12, z: lerp(1.08, 1.22, u), oy: Math.abs(Math.sin(T * 9)) * 12, rot: Math.sin(T * 4.5) * .008 + .00001 });
    flyers(g, T, { n: 24, speed: .9, seed: 72, col: 'rgba(255,255,255,.7)', w: 2, len: .08, cy: H * .6 });
    return;
  }
  if (T < 88) { channels(g, T); return; }
  clip(g, 'c_night', (T - 88) * .74, { step: 12, z: lerp(1.05, 1.18, prog(T, 88, 92)), fx: .62 });
  flash(g, prog(T, 91.5, 92), '#000');
}

// ---------- 2010 年代 ----------
function wallShot(g, T) {
  const u = prog(T, 92, 98), beat = (T - 92) % 1, kick = Math.exp(-beat * 6);
  const m = cover(g, IMG['10_wall'], .5, lerp(.74, .3, io(u)), 1.28, Math.sin(T * .4) * .004 + .00001, Math.sin(T * 31) * 5 * kick, Math.cos(T * 27) * 7 * kick);
  g.save();
  for (let i = 0; i < 80; i++) {                         // 震落的灰尘
    const x = hash(i * 3) * W, y = (hash(i * 5) * H + T * (40 + 90 * hash(i))) % H, r = 1 + hash(i * 7) * 3;
    g.fillStyle = `rgba(230,214,190,${.1 + hash(i * 11) * .24 + kick * .1})`;
    g.beginPath(); g.arc(x + Math.sin(T + i) * 14, y, r, 0, TAU); g.fill();
  }
  g.restore();
  flash(g, 1 - prog(T, 92, 92.5), '#000');
}
function cloudPuffs(g, T, seed, n, col = 'rgba(255,240,226,') {
  for (let i = 0; i < n; i++) {
    const z = (hash(i * 3 + seed) + T * .3) % 1, p = 1 / (1.06 - z);
    const x = W / 2 + (hash(i + seed) * 2 - 1) * W * .4 * p, y = H / 2 + (hash(i * 7 + seed) * 2 - 1) * H * .3 * p, r = 90 * p;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, col + `${.55 * clamp(z * 4) * clamp((1 - z) * 4)})`); gr.addColorStop(1, col + '0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
}
function sky(g, T) {
  const u = prog(T, 102, 112), sun = inx(prog(T, 109.4, 112), 2.2);
  const m = cover(g, IMG['16_sky'], lerp(.55, .3, sun), lerp(.28, .88, io(prog(T, 102, 109.4)) * .7 + sun * .3), lerp(1.2, 1.3, u) * Math.exp(sun * 1.9), 0.00001);
  g.save();
  g.globalCompositeOperation = 'lighter';
  const [sx, sy] = m(.39, .335);                         // 彗星头
  const v = prog(T, 102, 109);
  for (let i = 0; i < 90; i++) {                         // 彗尾的光尘
    const s = hash(i), [tx, ty] = m(.39 + s * .47, .335 - s * .25), x = tx + (hash(i * 3) - .5) * 34, y = ty + (hash(i * 5) - .5) * 34;
    const tw = .4 + .6 * Math.pow(.5 + .5 * Math.sin(T * 7 + i), 3);
    g.fillStyle = `rgba(210,230,255,${tw * (1 - s) * .9})`;
    g.fillRect(x, y, 2.6, 2.6);
  }
  const gr = g.createRadialGradient(sx, sy, 1, sx, sy, 70 + 16 * Math.sin(T * 5));
  gr.addColorStop(0, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(190,210,255,0)');
  g.fillStyle = gr; g.fillRect(sx - 100, sy - 100, 200, 200);
  for (let k = 0; k < 4; k++) {                          // 偶尔划过的流星
    const t0 = 103 + k * 1.7, w = prog(T, t0, t0 + .5);
    if (w > 0 && w < 1) {
      g.strokeStyle = `rgba(255,250,235,${Math.sin(w * Math.PI)})`; g.lineWidth = 2.4;
      const x0 = 1500 - k * 330 - w * 620, y0 = 90 + k * 40 + w * 240;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + 150, y0 - 58); g.stroke();
    }
  }
  g.restore();
  caption(g, T, 103.6, 108.8, '2016', '光和云，把动画推向大众', '《你的名字。》', { x: 120, y: H - 170 });
  // 两条红线在黄昏里靠近
  const c = io(prog(T, 109.4, 111.6));
  if (c > 0) {
    const yy = H * .56;
    cord(g, wave(-30, yy, 0, (W / 2 - 40) * c + 30, T, { amp: 24, f: 1.4, sp: 6 }), 7, 4, 16);
    cord(g, wave(W + 30, yy, Math.PI, (W / 2 - 40) * c + 30, T, { amp: 24, f: 1.4, sp: 6 }), 7, 4, 16);
  }
  flash(g, 1 - prog(T, 102, 102.5));
  flash(g, inx(prog(T, 111.3, 112), 2));
}
function s2010(g, T) {
  if (T < 98) { wallShot(g, T); return; }
  if (T < 102) {
    const u = prog(T, 98, 101.4);
    clip(g, 'c_swing', T - 98, { step: 12, z: lerp(1.05, 1.2, u), rot: Math.sin(T * 1.8) * .03 + .00001, oy: Math.sin(T * 3.4) * 14 });
    flyers(g, T, { n: 34, speed: .9, seed: 80, col: 'rgba(255,245,225,.8)', w: 2.4, len: .1, cy: H * .62 });
    caption(g, T, 98.3, 101.2, '2013', '世界变大，也变残酷', '《进击的巨人》', { x: W - 620, y: 180 });
    const v = prog(T, 101.2, 102);                        // 冲进云层
    if (v > 0) { cloudPuffs(g, T * 3, 3, 26, 'rgba(255,255,255,'); flash(g, inx(v, 2)); }
    return;
  }
  sky(g, T);
}

// ---------- 2020 年代 ----------
function neg(g) { g.save(); g.globalCompositeOperation = 'difference'; g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.restore(); }
function slashes(g, T) {
  const d = T - 122, n = Math.floor(d / .5), e = d - n * .5;
  const ang = (hash(n * 7 + 2) - .5) * 2.2, nx = Math.cos(ang + Math.PI / 2), ny = Math.sin(ang + Math.PI / 2);
  const gap = outx(clamp(e / .16)) * 120;
  const c = [W / 2 + (hash(n) - .5) * 300, H / 2 + (hash(n + 1) - .5) * 200], L = 2600;
  const dx = Math.cos(ang) * L, dy = Math.sin(ang) * L;
  const src = ['c_fight', 'c_blade', 'c_fight', 'c_fall'][n % 4], t0 = [1.1, .7, 3.6, 1.5][n % 4];
  for (const sgn of [1, -1]) {                           // 一刀把正在动的画面切开并错位
    g.save();
    g.beginPath();
    g.moveTo(c[0] - dx, c[1] - dy); g.lineTo(c[0] + dx, c[1] + dy);
    g.lineTo(c[0] + dx + nx * L * sgn, c[1] + dy + ny * L * sgn); g.lineTo(c[0] - dx + nx * L * sgn, c[1] - dy + ny * L * sgn);
    g.closePath(); g.clip();
    g.translate(Math.cos(ang) * gap * sgn + nx * gap * .35 * sgn, Math.sin(ang) * gap * sgn + ny * gap * .35 * sgn);
    clip(g, src, t0 + e * 1.4, { step: 12, z: 1.16 + e * .3 });
    if (n % 4 === 1) neg(g);
    g.restore();
  }
  g.save();
  g.strokeStyle = '#fff8ec'; g.lineWidth = 26 * (1 - clamp(e / .35)) + 3; g.shadowColor = RED; g.shadowBlur = 42;
  g.beginPath(); g.moveTo(c[0] - dx, c[1] - dy); g.lineTo(c[0] + dx, c[1] + dy); g.stroke();
  g.restore();
  flash(g, .9 - e / .07);
  g.save();
  g.textBaseline = 'alphabetic'; g.fillStyle = '#fff'; g.shadowColor = 'rgba(0,0,0,.9)'; g.shadowBlur = 22;
  g.font = `400 150px Impact,${BOLD}`; g.fillText('2020', 110, H - 170);
  g.font = `700 40px ${BOLD}`; g.fillText('动画电影登顶日本影史票房', 114, H - 104);
  g.font = `300 26px ${BOLD}`; g.fillText('《鬼灭之刃 无限列车篇》', 114, H - 62);
  g.restore();
}
function eye20(g, T) {
  const d = T - 124, u = prog(T, 124, 127), v = prog(T, 127, 127.48);
  const kick = Math.exp(-(d % .5) * 9);
  const z = lerp(1.02, 2.1, inx(u, 1.5)) * Math.exp(inx(v, 2) * 2.1) * (1 + kick * .012);
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const m = cover(g, IMG['20_eye'], .499, .49, z, Math.sin(d * 1.2) * .012 + .00001, Math.sin(T * 37) * 5 * kick, Math.cos(T * 29) * 5 * kick);
  const [px, py] = m(.499, .49);
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 22; i++) {                         // 虹膜里跳动的火星
    const a = hash(i) * TAU, r = (.08 + .08 * hash(i * 3)) * W * z;
    const tw = Math.pow(.5 + .5 * Math.sin(T * (5 + hash(i * 5) * 8) + i), 5);
    const x = px + Math.cos(a) * r, y = py + Math.sin(a) * r, s = (5 + 22 * tw) * Math.min(z, 3);
    g.strokeStyle = `rgba(255,214,150,${tw * .9})`; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(x - s, y); g.lineTo(x + s, y); g.moveTo(x, y - s); g.lineTo(x, y + s); g.stroke();
  }
  g.restore();
  flyers(g, T, { n: 40, speed: .45, seed: 12, col: '#ff9a3c', w: 2.6, len: .05, cx: px, cy: py });
  flash(g, prog(T, 127.3, 127.48));
}
function s2020(g, T) {
  if (T < 115) {
    const u = prog(T, 112, 115);
    clip(g, 'c_fall', T - 112, { step: 12, z: 1.06 * Math.exp(u * .8), rot: u * .5 + .00001, ox: Math.sin(T * 29) * 6 * u });
    flyers(g, T, { n: 90, speed: 1.3, seed: 2, col: '#ffe0b8', w: 3, len: .14, spread: 1.5 });
    flash(g, 1 - prog(T, 112, 112.4));
    flash(g, inx(prog(T, 114.6, 115), 2));
    return;
  }
  if (T < 120) {
    const beat = (T - 115) % .5, kick = Math.exp(-beat * 10);
    clip(g, 'c_fight', T - 115, { step: 12, z: 1.05 + kick * .02, ox: Math.sin(T * 41) * 6 * kick, oy: Math.cos(T * 37) * 6 * kick });
    flyers(g, T, { n: 50, speed: .6, seed: 9, col: '#ffb25a', w: 3, len: .07 });
    flash(g, .35 - (T - 115) / .12);
    return;
  }
  if (T < 122) {
    clip(g, 'c_blade', (T - 120) * 1.45, { step: 12, z: lerp(1.04, 1.16, prog(T, 120, 122)) });
    flash(g, .5 - (T - 120) / .1);
    return;
  }
  if (T < 124) { slashes(g, T); return; }
  if (T < 127.5) { eye20(g, T); return; }
  if (T < 128) { g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); return; }
  if (T < 133) {
    const mW = clip(g, 'c_walk', T - 128, { step: 12, z: lerp(1.03, 1.12, prog(T, 128, 133)), fy: .54 });
    if (mW.knot) {
      const [wx, wy] = mW.knot, pts = [];
      for (let i = 0; i <= 60; i++) { const r = i / 60; pts.push([lerp(wx, W * .44, io(r)) + Math.sin(r * 7 - T * 1.6) * 24 * r, lerp(wy, H + 30, Math.pow(r, .8))]); }
      cord(g, pts, 2.5, 8);
    }
    petals(g, T, 1, 30, .7);
    flash(g, 1 - prog(T, 128, 129));
    return;
  }
  const mT = clip(g, 'test_turn', T - 133, { step: 12, z: lerp(1.02, 1.1, prog(T, 133, 138)), fx: .5, fy: .42 });
  if (mT.knot) cord(g, wave(mT.knot[0], mT.knot[1], 1.2, 700, T, { amp: 40, f: 1, sp: 1.4 }), 3.8, 2.5);
  petals(g, T, 4, 22, .7);
  caption(g, T, 134.1, 137.7, '2023', '安静，也能动人', '《葬送的芙莉莲》', { x: 120, y: H - 200 });
}
function petals(g, T, seed, n, a = .85) {
  g.save();
  for (let i = 0; i < n; i++) {
    const z = (hash(i * 3 + seed) + T * .05 * (.6 + hash(i))) % 1, p = 1 / (1.08 - z);
    const x = W / 2 + (hash(i + seed) * 2 - 1) * W * .36 * p + Math.sin(T * .8 + i) * 34 * p - z * 260;
    const y = H * .54 + (hash(i * 7 + seed) * 2 - 1) * H * .32 * p + Math.sin(T * 1.1 + i * 2) * 16 * p;
    const s = 3.4 * p;
    g.save();
    g.translate(x, y); g.rotate(T * (.6 + hash(i)) + i); g.scale(1, .45 + .4 * Math.sin(T * 2 + i));
    g.globalAlpha = a * clamp(z * 4) * clamp((1 - z) * 5);
    g.fillStyle = i % 5 === 0 ? '#cfe4ff' : '#fffdf6';
    g.beginPath(); g.ellipse(0, 0, s * 1.5, s, 0, 0, TAU); g.fill();
    g.restore();
  }
  g.restore();
}

// ---------- 收尾：沿红线倒飞，穿过每个时代仍在动的画面 ----------
const BACK = ['test_turn', 'c_blade', 'c_swing', 'c_slope', 'c_class', 'test_under', 'c_glider', 'c_hangar', 'c_lotus', 'c_paper'];
function ending(g, T) {
  if (T < 144.6) {
    g.fillStyle = '#07070a'; g.fillRect(0, 0, W, H);
    flyers(g, 200 - T, { n: 120, speed: .22, seed: 90, col: 'rgba(255,235,205,.7)', w: 2, len: .02 });
    const d = T - 138, sp = BACK.length / 6.2;
    const pts = [];
    for (let i = 0; i <= 80; i++) {
      const s = i / 80, p = 1 / (s * 3 + .22);
      pts.push([W / 2 + Math.sin(s * 8 + d * 1.2) * 420 * p * .36, H / 2 + Math.cos(s * 6 + d) * 240 * p * .36]);
    }
    for (let i = BACK.length - 1; i >= 0; i--) {
      const dist = (i + .9 - d * sp) * .62;
      if (dist < -.16 || dist > 2.6) continue;
      const p = 1 / (dist + .3), w = 1240 * p * .62, h = w * 9 / 16;
      const side = i % 2 ? 1 : -1;
      const x = W / 2 + side * 420 * p * .62, y = H / 2 + Math.sin(i * 1.7) * 180 * p * .62;
      const f = frame(BACK[i], (d * .8 + i * .2) % 2.9, 12);
      g.save();
      g.translate(x, y); g.rotate(side * .05);
      g.globalAlpha = clamp((2.6 - dist) * 1.6) * clamp((dist + .16) * 8);
      g.fillStyle = '#f3efe4'; g.fillRect(-w / 2 - 10 * p, -h / 2 - 10 * p, w + 20 * p, h + 20 * p);
      if (f) g.drawImage(f, -w / 2, -h / 2, w, h);
      g.restore();
    }
    cord(g, pts, 14, 2, 14);
    flash(g, 1 - prog(T, 138, 138.7), '#000');
    flash(g, inx(prog(T, 144, 144.6), 2), '#f3efe4');
    return;
  }
  // 回到白纸：红线收成一笔，铅笔落下，留下“下一笔”
  g.drawImage(paperC, 0, 0);
  const u = io(prog(T, 144.6, 146.6)), pts = [];
  for (let i = 0; i <= 90; i++) {
    const s = i / 90;
    pts.push([lerp(150, W / 2 + 60, s), H / 2 + Math.sin(s * 5 + (1 - u) * 6) * (22 + 120 * (1 - u)) * (1 - s)]);
  }
  cord(g, pts, 5, 7);
  const v = prog(T, 146.8, 148.2);
  const tip = pts[90];
  pencil(g, tip[0] + 8, tip[1] + lerp(-560, 0, outx(v, 4)), -1.05);
  const c = prog(T, 147.4, 148.4) * (1 - prog(T, 149.2, 149.9));
  if (c > 0) {
    g.save(); g.globalAlpha = c; g.fillStyle = '#2b2b2e'; g.textAlign = 'center';
    g.font = `300 60px ${BOLD}`; g.fillText('下一笔', W / 2, H / 2 + 150);
    g.restore();
  }
  flash(g, 1 - prog(T, 144.6, 145.2), '#f3efe4');
  flash(g, prog(T, 149.2, 150), '#000');
}

function draw(g, T) {
  if (T < 6) opening(g, T);
  else if (T < 16) s1917(g, T);
  else if (T < 28) s1963(g, T);
  else if (T < 35.5) {
    if (T < 31.5) fleet(g, T);
    else {
      const u = prog(T, 31.5, 35.5);
      clip(g, 'c_hangar', T - 31.5, { step: 12, z: lerp(1.3, 1.04, io(u)), fy: lerp(.75, .4, io(u)), ox: Math.sin(T * 23) * 2.4 });
      flash(g, 1 - prog(T, 31.5, 31.8), '#fff');
    }
  } else if (T < 38.5) cockpit(g, T);
  else if (T < 42) launch(g, T);
  else if (T < 60) s1984(g, T);
  else if (T < 74) s1995(g, T);
  else if (T < 92) s2000(g, T);
  else if (T < 112) s2010(g, T);
  else if (T < 138) s2020(g, T);
  else ending(g, T);
}
/** 快镜头做多重采样运动模糊。 */
function shutter(T) {
  if (T >= 112 && T < 115) return 3;
  if (T >= 127 && T < 127.5) return 4;
  if (T >= 10 && T < 11.6) return 3;
  if (T >= 17.6 && T < 19) return 3;
  if (T >= 24 && T < 26.5) return 3;
  if (T >= 26.5 && T < 27.8) return 3;
  if (T >= 38.5 && T < 42) return 3;
  if (T >= 50 && T < 54.5) return 3;
  if (T >= 72.9 && T < 73.6) return 3;
  return 1;
}
async function paint(g, T) {
  for (let pass = 0; pass < 3; pass++) {
    draw(g, T);
    if (!missing.size) return;
    await fetchMissing();
  }
}
window.renderFrame = async T => {
  const k = shutter(T);
  if (k === 1) { await paint(ctx, T); return; }
  for (let i = 0; i < k; i++) {
    await paint(tmp, T + (i / k) * (.5 / 24));
    ctx.globalAlpha = 1 / (i + 1);
    ctx.drawImage(acc, 0, 0);
  }
  ctx.globalAlpha = 1;
};
boot().catch(e => { window.__bootFailed = String(e); console.error(e); });
