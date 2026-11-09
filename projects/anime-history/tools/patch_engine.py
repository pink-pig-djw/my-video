s=open('film.js',encoding='utf-8').read()
a=s.index("const IMG = {};"); b=s.index("function silhouette(img, col)")
s=s[:a]+r'''const IMG = {};
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
  return cover(g, f, fx, fy, z, rot, ox, oy);
}
'''+s[b:]
s=s.replace("""const flash = (g, a, col""","""let paperC = null;
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
const flash = (g, a, col""",1)
a=s.index("function under(g, T) {"); b=s.index("function title95(g, T)")
s=s[:a]+r'''function under(g, T) {
  const u = prog(T, 60, 63.5);
  clip(g, 'test_under', (T - 60) * .9 + .3, { step: 12, z: lerp(1.03, 1.12, io(u)), rot: Math.sin(T * .6) * .008 + .00001 });
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
  flash(g, 1 - prog(T, 60, 61.0), '#000');
}
'''+s[b:]
a=s.index("// ---------- 2020 年代 ----------"); b=s.index("boot().catch(")
s=s[:a]+open('film_part2.js',encoding='utf-8').read()+s[b:]
s=s.replace("  IMG.spinBlack = silhouette(IMG['20_spin'], '#0b0b0d');\n  IMG.spinCream = silhouette(IMG['20_spin'], '#f4ead6');\n","")
open('film.js','w',encoding='utf-8').write(s)
