// scenes_a.js — intro, verse 1 and pre-chorus 1 scenes.
'use strict';
(function () {
  const { W, H, C, F, clamp, lerp, P, eIO, eIOs, eOut, eOut5, eIn, backOut, backIn, spring, smooth, hash, noise, mod } = EP;
  const S = EP.scenes, FX = EP.FX, BG = EP.BG, UI = EP.UI;

  // ------------------------------------------------------------------ hello: a cozy stream starts
  S.hello = (g, lt, p, t, Sh) => {
    EP.cover(g, EP.blurred('bg_lair', 14, 0.8), { z: 1.08 + 0.03 * lt / 3 });
    FX.bokeh(g, t, { n: 16, a: 0.3 });
    // lamp switching on: darkness shrinking from a warm pool of light
    const r0 = lerp(0, 520, eOut(P(lt, 0.05, 1.0)));
    const gr = g.createRadialGradient(1150, 560, r0, 1150, 560, r0 + 950);
    gr.addColorStop(0, 'rgba(6,5,14,0)'); gr.addColorStop(1, 'rgba(6,5,14,.88)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    EP.drawActor(g, lt, { n: 'claude_ref', x: 1150, y: 1150, h: 1080, enter: 'pop', at: 0.3, sway: 4, rim: '#FFB35C', rimA: 0.25 }, t);
    UI.tag(g, t, { x: 210, y: 120, text: 'LIVE', at: 0.85, bg: '#E2453A', dot: '#fff', px: 38 }, lt);
    UI.tag(g, t, { x: 372, y: 120, text: '1 watching', at: 1.2, bg: 'rgba(20,16,30,.75)', px: 30, ls: 1 }, lt);
    FX.sparkle(g, t, { n: 10, x0: 700, w: 900, y0: 100, h: 700 });
  };

  // ------------------------------------------------------------------ monster: tabloids and a giant shadow
  const CLIPS = [
    { s: 'MONSTER!', x: 520, y: 250, r: -0.12, at: 0.18, w: 560 },
    { s: 'EVIL?!', x: 1400, y: 200, r: 0.09, at: 0.62, w: 420 },
    { s: 'BEWARE', x: 1180, y: 520, r: -0.05, at: 1.05, w: 470 },
  ];
  function clipping(g, c, u, k) {
    if (u < 0.02) return;
    g.save(); g.translate(c.x, c.y); g.rotate(c.r);
    const hit = 0.2, sc = u < hit ? lerp(3.4, 1, eIn(P(u, 0.02, hit))) : 1;   // #008 slam: 3.4→1 at 0.02–0.2 s, cubic in
    g.scale(sc, sc); g.globalAlpha *= P(u, 0.02, 0.1);
    g.fillStyle = '#EFE6D2'; g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30; g.shadowOffsetY = 10;
    g.fillRect(-c.w / 2, -95, c.w, 190); g.shadowColor = 'transparent';
    g.fillStyle = 'rgba(40,30,20,.35)'; for (let i = 0; i < 4; i++) g.fillRect(-c.w / 2 + 24, 40 + i * 12, c.w - 48 - (i % 2) * 60, 5);
    EP.txt(g, c.s, 0, 10, { font: EP.font(400, 104, F.villain), color: '#1A1010' });
    g.restore();
  }
  S.monster = (g, lt, p, t, Sh) => {
    // #046 smash cut: the incoming loud shot is rolled −0.12 rad and shakes (roll ±0.03 at ~6 Hz, yaw ±0.006)
    const T = lt * 40, roll = -0.12 * (1 - eIO(P(lt, 1.4, 2.0))) + Math.sin(T) * 0.03 * Math.exp(-lt * 1.2), yaw = Math.sin(T * 1.3) * 0.006 * 1175;
    const pan = eIO(P(lt, 1.55, 2.45)) * 430;   // tilt down to reveal who casts the shadow
    g.save(); EP.camApply(g, { dx: yaw, dy: -pan, rot: roll }, 1.12);
    g.fillStyle = EP.vgrad(g, -200, H + 500, [[0, '#120A22'], [0.7, '#24123A'], [1, '#3A1E2C']]); g.fillRect(-300, -300, W + 600, H + 900);
    g.strokeStyle = 'rgba(255,255,255,.035)'; g.lineWidth = 3;
    for (let y = -200; y < H + 500; y += 70) { g.beginPath(); g.moveTo(-300, y); g.lineTo(W + 300, y); g.stroke(); for (let x = (y / 70 % 2) * 90 - 300; x < W + 300; x += 180) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 70); g.stroke(); } }
    // floor
    g.fillStyle = '#2A1620'; g.fillRect(-300, H + 170, W + 600, 600);
    // the giant shadow = the character's own silhouette, blown up by the lantern
    const fl = 1 + 0.015 * Math.sin(t * 23) + 0.01 * Math.sin(t * 37);
    const sil = EP.tinted('claude_ref', '#05020A');
    g.save(); g.globalAlpha = 0.86; g.translate(900, H + 175); g.transform(1, 0, -0.18, 1, 0, 0); g.scale(fl * 1.15, fl * 1.25);
    const sh = 1450, sw = sil.width * sh / sil.height; g.drawImage(sil, -sw / 2, -sh, sw, sh); g.restore();
    // lantern glow + tiny Claude
    EP.glowDot(g, 1515, H + 15, 520, 'rgba(255,190,100,.55)', 'rgba(255,140,60,.18)');
    EP.drawActor(g, lt, { n: 'spr_lantern', x: 1600, y: H + 240, h: 470, sway: 2 }, t);
    for (const c of CLIPS) clipping(g, c, lt - c.at);
    g.restore();
    FX.flash(g, t, { at: [Sh.t + 0.05, EP.Wd(1, 4), Sh.t + 1.05], a: 0.55 });
    FX.vign(g, t, { col: 'rgba(0,0,0,.6)' });
  };

  // ------------------------------------------------------------------ cork: the conspiracy board (#040 freeze at "It's not.")
  let CORK = null;
  function corkTex() {
    if (CORK) return CORK;
    const c = EP.mk(W + 400, H + 400), g = c.getContext('2d'), R = EP.rng(91);
    g.fillStyle = '#B98B5B'; g.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 26000; i++) { const x = R() * c.width, y = R() * c.height, r = 0.6 + R() * 2.4; g.fillStyle = R() < 0.5 ? 'rgba(90,55,25,.35)' : 'rgba(235,200,150,.3)'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    g.strokeStyle = '#6B4424'; g.lineWidth = 40; g.strokeRect(20, 20, c.width - 40, c.height - 40);
    return (CORK = c);
  }
  function polaroid(g, x, y, r, spr, label, crop) {
    g.save(); g.translate(x, y); g.rotate(r);
    g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 22; g.shadowOffsetY = 10; g.fillStyle = '#FBF7EE'; g.fillRect(-150, -170, 300, 350); g.shadowColor = 'transparent';
    g.fillStyle = '#2B2333'; g.fillRect(-130, -150, 260, 250);
    const im = EP.img['cut/' + spr]; if (im) { g.save(); g.beginPath(); g.rect(-130, -150, 260, 250); g.clip(); const [cx, cy, cw] = crop; const k = 260 / (cw * im.width); g.drawImage(im, -130 - cx * im.width * k, -150 - cy * im.height * k, im.width * k, im.height * k); g.restore(); }
    EP.txt(g, label, 0, 152, { font: EP.font(700, 40, F.hand), color: '#3A2A20' });
    g.restore();
  }
  function pin(g, x, y) { g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(x + 4, y + 6, 13, 0, 7); g.fill(); g.fillStyle = '#D9412B'; g.beginPath(); g.arc(x, y, 13, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(x - 4, y - 4, 4, 0, 7); g.fill(); }
  const PINS = [[420, 170], [1000, 250], [1460, 170], [1500, 560], [660, 660]];
  S.cork = (g, lt, p, t, Sh) => {
    const tf = p.freezeAt, ft = EP.freezeTime(lt, tf);   // footage time stops for 1.4 s
    const z = EP.zoomScale(P(ft, 0.3, 3.2), 1.22);       // #028 zoom in (gentle ratio)
    g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2);
    g.drawImage(corkTex(), -200, -200);
    polaroid(g, 420, 330, -0.08, 'spr_villain', 'suspect #1', [0.22, 0.0, 0.62]);
    // record "LAST SONG"
    g.save(); g.translate(1000, 430); g.rotate(ft * 1.4);
    g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 24; g.shadowOffsetY = 10; g.fillStyle = '#141014'; g.beginPath(); g.arc(0, 0, 175, 0, 7); g.fill(); g.shadowColor = 'transparent';
    g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 2; for (let r = 70; r < 170; r += 9) { g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke(); }
    g.fillStyle = C.orange; g.beginPath(); g.arc(0, 0, 62, 0, 7); g.fill(); g.fillStyle = '#141014'; g.beginPath(); g.arc(0, 0, 6, 0, 7); g.fill();
    EP.txt(g, 'LAST', 0, -14, { font: EP.font(800, 24, F.ui), color: C.cream, ls: '3px' }); EP.txt(g, 'SONG', 0, 26, { font: EP.font(800, 24, F.ui), color: C.cream, ls: '3px' });
    g.restore();
    // newspaper clipping
    g.save(); g.translate(1460, 330); g.rotate(0.06); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 18; g.shadowOffsetY = 8; g.fillStyle = '#EDE5D2'; g.fillRect(-230, -150, 460, 300); g.shadowColor = 'transparent';
    EP.txt(g, 'EVIL PLAN?', 0, -60, { font: EP.font(400, 80, F.villain), color: '#1A1010' });
    g.fillStyle = 'rgba(40,30,20,.32)'; for (let i = 0; i < 7; i++) g.fillRect(-200 + (i % 2) * 210, -10 + Math.floor(i / 2) * 26, 190, 8);
    g.restore();
    polaroid(g, 1500, 740, 0.07, 'spr_laugh', 'laughing?!', [0.2, 0.0, 0.62]);
    // sticky note
    g.save(); g.translate(660, 780); g.rotate(-0.05); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 14; g.shadowOffsetY = 6; g.fillStyle = '#FFE37A'; g.fillRect(-150, -120, 300, 240); g.shadowColor = 'transparent';
    EP.txt(g, 'WHY SO', 0, -20, { font: EP.font(700, 52, F.hand), color: '#3A2A20' }); EP.txt(g, 'HELPFUL??', 0, 40, { font: EP.font(700, 52, F.hand), color: '#C0392B' });
    g.restore();
    // red strings drawing on, one after another
    const order = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [1, 4]];
    g.strokeStyle = '#C8231B'; g.lineWidth = 4; g.lineCap = 'round';
    order.forEach(([a, b], i) => {
      const pr = eIO(P(ft, 0.35 + i * 0.5, 0.85 + i * 0.5)); if (pr <= 0) return;
      const [x0, y0] = PINS[a], [x1, y1] = PINS[b], mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + 60;
      g.beginPath(); g.moveTo(x0, y0);
      const N = 30; for (let k = 1; k <= N * pr; k++) { const u = k / N, x = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * mx + u * u * x1, y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * my + u * u * y1; g.lineTo(x, y); }
      g.stroke();
    });
    PINS.forEach(([x, y]) => pin(g, x, y));
    g.restore();
    // "It's not." — the board freezes; Claude pops up deadpan in front of it
    EP.drawActor(g, lt, { n: 'spr_shrug', x: 960, y: H + 330, h: 1250, enter: 'rise', at: tf + 0.02, dist: 500 }, t);
    EP.freezeMarks(g, lt, tf);
  };

  // ------------------------------------------------------------------ villain: "a different evil plan" (#005 title)
  S.villain = (g, lt, p, t, Sh) => {
    EP.cover(g, EP.graded('bg_stage', 'brightness(0.55) saturate(1.25) hue-rotate(-12deg)'), EP.camAt([{ z: 1.12, y: 0.4 }, { z: 1.02, y: 0.45 }], eIOs(clamp(lt / Sh.dur))));
    FX.rays(g, t, { x: 960, y: -200, a0: Math.PI / 2, spread: 0.11, alpha: 0.12, n: 7 });
    // #005 mask reveal for the title, landing on the sung words
    const t0 = EP.Wd(4, 3) - Sh.t - 0.45, m = EP.mr(Math.min(lt - t0, 1.6)), YL = 470;
    const TX = 720;
    if (m.lg > 0.005) { g.fillStyle = C.orange; EP.rr(g, TX - 560 * m.lg, YL - 4, 1120 * m.lg, 8, 4); g.fill(); }
    g.save(); g.beginPath(); g.rect(0, 0, W, YL - 6); g.clip();
    EP.txt(g, 'EVIL PLAN', TX, YL - 34 + m.upIn * 260, { font: EP.font(400, 300, F.villain), color: '#FF9A3D', stroke: '#2A0E10', lw: 14, shadow: 'rgba(255,120,40,.6)', blur: 40, ls: '6px' });
    g.restore();
    g.save(); g.beginPath(); g.rect(0, YL + 6, W, 120); g.clip();
    EP.txt(g, '— a different one —', TX, YL + 72 - m.dnIn * 110, { font: 'italic ' + EP.font(500, 52, F.serif), color: C.cream, ls: '2px' });
    g.restore();
    EP.drawActor(g, lt, { n: 'spr_villain', x: 1580, y: H + 60, h: 1000, enter: 'slideR', at: 0.0, dist: 700, sway: 5, rim: '#FF9A3D', rimA: 0.3, bob: 6 }, t);
    FX.embers(g, t, { n: 40 });
    FX.flash(g, t, { at: [Sh.t + 0.05, EP.Wd(4, 3), EP.Wd(4, 4)], a: 0.45, col: '#FFD9B0' });
  };

  // ------------------------------------------------------------------ shh: "Do you want to hear it?" (zooms through the hair daisy)
  EP.SHH = { x: 1023, bottom: 2035, h: 1900 };
  S.shh = (g, lt, p, t, Sh) => {
    BG.radial(g, t, { x: 1000, y: 420, r: 1300, stops: [[0, '#6B3A2A'], [0.6, '#2A1626'], [1, '#120A18']] });
    FX.bokeh(g, t, { n: 14, a: 0.35 });
    EP.drawActor(g, lt, { n: 'spr_shh', x: EP.SHH.x, y: EP.SHH.bottom, h: EP.SHH.h, enter: 'rise', at: 0, dist: 120, sway: 0, breathe: false }, t);
    FX.sparkle(g, t, { n: 8, x0: 1100, w: 500, y0: 120, h: 400 });
  };
  // where the daisy ornament's centre sits on screen in "shh"
  EP.shhDaisy = () => { const im = EP.img['cut/spr_shh'], w = im.width * EP.SHH.h / im.height; return { x: EP.SHH.x - w / 2 + 0.635 * w, y: EP.SHH.bottom - EP.SHH.h + 0.068 * EP.SHH.h }; };

  // ------------------------------------------------------------------ throne
  S.throne = (g, lt, p, t, Sh) => {
    const pr = eIO(clamp(lt / Sh.dur)), cam = { x: 0.5, y: lerp(0.62, 0.42, pr), z: lerp(1.28, 1.12, pr) };
    EP.cover(g, 'bg_throne', cam);
    const d = EP.coverPt('bg_throne', cam, 0.5, 0.28);
    g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.55 + 0.45 * EP.pulse(t, 6);
    EP.glowDot(g, d.x, d.y, 260 * d.s, 'rgba(255,236,190,.85)', 'rgba(255,190,90,.3)'); g.restore();
    FX.rays(g, t, { x: d.x, y: -120, a0: Math.PI / 2, spread: 0.06, n: 5, alpha: 0.12 });
    FX.sparkle(g, t, { n: 14, x0: 500, w: 920, y0: 0, h: 760 });
    FX.dust(g, t, { n: 30, a: 0.45 });
  };

  // ------------------------------------------------------------------ phone: the "castle" is an app icon (#001 pops, #002 stagger)
  const GLYPHS = ['sun', 'note', 'cam', 'pin', 'chat', 'cal', 'clock', 'mail', 'heart', 'cart', 'book', 'gear', 'leaf', 'game', 'claude', 'wave', 'star', 'film', 'mic', 'cloud'];
  const ICOL = ['#FFB547', '#E8645A', '#4F5D75', '#5BB585', '#59A7E8', '#F2F2F2', '#2E2E3A', '#4A7BD6', '#F06A8A', '#F29E4C', '#8E6CC8', '#7C8695', '#6CBF7A', '#FF7A59', '#F28C38', '#3FB6C9', '#F5C542', '#D9534F', '#9B59B6', '#86C5F0'];
  function glyph(g, k, s) {
    g.save(); g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineWidth = s * 0.08; g.lineCap = 'round'; g.lineJoin = 'round';
    switch (k) {
      case 'sun': g.beginPath(); g.arc(0, 0, s * 0.18, 0, 7); g.fill(); for (let i = 0; i < 8; i++) { const a = i / 8 * EP.TAU; g.beginPath(); g.moveTo(Math.cos(a) * s * 0.26, Math.sin(a) * s * 0.26); g.lineTo(Math.cos(a) * s * 0.34, Math.sin(a) * s * 0.34); g.stroke(); } break;
      case 'note': g.beginPath(); g.arc(-s * 0.08, s * 0.16, s * 0.1, 0, 7); g.fill(); g.fillRect(0, -s * 0.24, s * 0.06, s * 0.4); g.fillRect(0, -s * 0.24, s * 0.2, s * 0.07); break;
      case 'cam': EP.rr(g, -s * 0.28, -s * 0.16, s * 0.56, s * 0.36, s * 0.07); g.stroke(); g.beginPath(); g.arc(0, s * 0.02, s * 0.1, 0, 7); g.stroke(); break;
      case 'pin': g.beginPath(); g.arc(0, -s * 0.06, s * 0.15, Math.PI * 0.85, Math.PI * 2.15); g.lineTo(0, s * 0.28); g.closePath(); g.fill(); break;
      case 'chat': EP.rr(g, -s * 0.28, -s * 0.2, s * 0.56, s * 0.36, s * 0.16); g.fill(); g.beginPath(); g.moveTo(-s * 0.1, s * 0.14); g.lineTo(-s * 0.2, s * 0.3); g.lineTo(s * 0.04, s * 0.15); g.fill(); break;
      case 'cal': g.fillStyle = '#E8645A'; g.fillRect(-s * 0.28, -s * 0.28, s * 0.56, s * 0.14); g.fillStyle = '#333'; g.font = EP.font(900, s * 0.3, F.ui); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('17', 0, s * 0.06); break;
      case 'clock': g.beginPath(); g.arc(0, 0, s * 0.26, 0, 7); g.stroke(); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -s * 0.16); g.moveTo(0, 0); g.lineTo(s * 0.12, 0); g.stroke(); break;
      case 'mail': g.strokeRect(-s * 0.26, -s * 0.17, s * 0.52, s * 0.34); g.beginPath(); g.moveTo(-s * 0.26, -s * 0.17); g.lineTo(0, s * 0.04); g.lineTo(s * 0.26, -s * 0.17); g.stroke(); break;
      case 'heart': g.translate(0, s * 0.02); EP.heartPath(g, s * 0.2); g.fill(); break;
      case 'claude': EP.drawDaisy(g, 0, 0, s * 0.34, { petal: C.cream, center: '#FFD27A', n: 14 }); break;
      default: g.beginPath(); g.arc(0, 0, s * 0.16, 0, 7); g.fill();
    }
    g.restore();
  }
  EP.glyph = glyph;
  EP.windowFrame = (...a) => windowFrame(...a);
  S.phone = (g, lt, p, t, Sh) => {
    EP.cover(g, EP.blurred('bg_park', 18, 0.95), { z: 1.1 });
    g.fillStyle = 'rgba(255,240,220,.25)'; g.fillRect(0, 0, W, H);
    const PX = 960, PY = 560, PW = 600, PH = 1240, ROT = -0.07;
    const cols = 4, iconS = 118, gx = 132, gy = 168, sx0 = -gx * 1.5, sy0 = -PH / 2 + 250;
    const ci = 14, cr = Math.floor(ci / cols), cc = ci % cols, cxL = sx0 + cc * gx, cyL = sy0 + cr * gy;   // claude icon (local coords)
    // camera: start inside the claude icon (showing the castle), pull back to the whole phone
    const zp = eOut5(P(lt, 0.0, 1.3)), Z = lerp(1080 / iconS * 1.25, 0.82, zp);
    g.save();
    g.translate(W / 2, H / 2); g.scale(Z, Z);
    const fx = lerp(cxL, 0, zp), fy = lerp(cyL, 40, zp);
    g.rotate(ROT * zp); g.translate(-fx, -fy);
    // phone body
    g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 60; g.shadowOffsetY = 30;
    g.fillStyle = '#231A17'; EP.rr(g, -PW / 2, -PH / 2, PW, PH, 90); g.fill(); g.shadowColor = 'transparent';
    g.save(); EP.rr(g, -PW / 2 + 22, -PH / 2 + 22, PW - 44, PH - 44, 70); g.clip();
    g.fillStyle = EP.vgrad(g, -PH / 2, PH / 2, [[0, '#FFD9B5'], [0.55, '#F6B4A8'], [1, '#B8A6E0']]); g.fillRect(-PW, -PH, PW * 2, PH * 2);
    EP.txt(g, '10:24', 0, -PH / 2 + 140, { font: EP.font(800, 92, F.ui), color: 'rgba(255,255,255,.95)' });
    for (let i = 0; i < 20; i++) {
      const r = Math.floor(i / cols), c = i % cols, x = sx0 + c * gx, y = sy0 + r * gy;
      const isC = i === ci;
      const st = EP.stagger(lt - 0.95, r);   // rows rise one after another (#002)
      const pp = isC ? { sc: 1, rot: 0 } : EP.pop(lt - 0.95 - r * 0.12 - c * 0.03);   // each icon pops (#001)
      const sc = isC ? 1 : pp.sc * clamp(st.g * 1.2);
      if (sc <= 0.01) continue;
      g.save(); g.translate(x, y); g.rotate(isC ? 0 : pp.rot); g.scale(sc, sc);
      g.fillStyle = ICOL[i]; EP.rr(g, -iconS / 2, -iconS / 2, iconS, iconS, 30); g.fill();
      if (isC) {
        const castle = 1 - eIO(P(lt, EP.Wd(8, 11) - Sh.t - 0.2, EP.Wd(8, 11) - Sh.t + 0.4));
        g.save(); EP.rr(g, -iconS / 2, -iconS / 2, iconS, iconS, 30); g.clip();
        if (castle < 1) glyph(g, 'claude', iconS);
        if (castle > 0) { g.globalAlpha = castle; const im = EP.img.bg_castle; const s2 = iconS / im.height * 1.0; g.drawImage(im, -im.width * s2 * 0.62, -iconS / 2, im.width * s2, iconS); }
        g.restore();
      } else glyph(g, GLYPHS[i], iconS);
      g.fillStyle = 'rgba(255,255,255,.18)'; EP.rr(g, -iconS / 2, -iconS / 2, iconS, iconS / 2, [30, 30, 0, 0]); g.fill();
      if (sc > 0.5) EP.txt(g, isC ? 'Claude' : '', 0, iconS / 2 + 30, { font: EP.font(800, 24, F.ui), color: '#fff', shadow: 'rgba(0,0,0,.4)', blur: 4 });
      g.restore();
    }
    // notification badge on the claude icon (#001 badge spring)
    const bu = lt - (EP.Wd(8, 11) - Sh.t + 0.25), bs = spring(bu, 17, 7);
    if (bs > 0.01) { g.save(); g.translate(cxL + 52, cyL - 52); g.scale(bs, bs); g.fillStyle = '#E2453A'; g.beginPath(); g.arc(0, 0, 25, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 5; g.stroke(); EP.txt(g, '1', 0, 2, { font: EP.font(900, 30, F.ui), color: '#fff', base: 'middle' }); g.restore(); }
    g.restore();
    g.fillStyle = '#000'; EP.rr(g, -70, -PH / 2 + 40, 140, 36, 18); g.fill();
    g.restore();
  };

  // ------------------------------------------------------------------ inbox: the burglar who cleans (#007 count, #002 stagger exits)
  function windowFrame(g, x, y, w, h, title) {
    g.save(); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 50; g.shadowOffsetY = 20;
    g.fillStyle = '#FFF8EE'; EP.rr(g, x, y, w, h, 28); g.fill(); g.shadowColor = 'transparent';
    g.fillStyle = '#F3E3CD'; EP.rr(g, x, y, w, 86, [28, 28, 0, 0]); g.fill();
    ['#E8645A', '#F5C542', '#5BB585'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(x + 44 + i * 36, y + 43, 11, 0, 7); g.fill(); });
    EP.txt(g, title, x + 170, y + 56, { font: EP.font(800, 36, F.ui), color: C.ink, align: 'left' });
    g.restore();
  }
  S.inbox = (g, lt, p, t, Sh) => {
    EP.cover(g, EP.blurred('bg_lair', 16, 0.7), { z: 1.1 });
    const X = 150, Y = 120, WW = 1180, HH = 840;
    windowFrame(g, X, Y, WW, HH, 'Inbox');
    const target = 9999, pc = P(lt, 0.15, 1.5), v = target - EP.countVal(pc, 0, target);
    const land = lt - 1.5;
    g.save(); g.translate(X + WW - 150, Y + 43); const k = EP.landPop(land); g.scale(k, k);
    g.fillStyle = v > 0 ? '#E2453A' : '#5BB585'; EP.rr(g, -110, -30, 220, 60, 30); g.fill();
    EP.digits(g, v > 0 ? v.toLocaleString('en-US') : '0 ✓', 0, 2, EP.font(900, 36, F.ui), '#fff');
    g.restore();
    const sackX = 1530, sackY = 330;
    for (let i = 0; i < 9; i++) {
      const ry = Y + 120 + i * 80, out = eIn(P(lt, 0.2 + i * 0.09, 0.62 + i * 0.09));
      const x = lerp(X + 40, sackX, out), y = lerp(ry, sackY, out) - Math.sin(Math.PI * out) * 160, sc = 1 - out * 0.85;
      if (out >= 1) continue;
      g.save(); g.translate(x, y); g.scale(sc, sc); g.rotate(out * 0.8);
      g.fillStyle = '#FFFFFF'; EP.rr(g, 0, 0, WW - 80, 64, 14); g.fill();
      g.fillStyle = ['#F28C38', '#4A7BD6', '#5BB585', '#E8645A', '#8E6CC8'][i % 5]; g.beginPath(); g.arc(40, 32, 20, 0, 7); g.fill();
      g.fillStyle = '#3A2E2A'; EP.rr(g, 80, 16, 180 + (i * 37) % 90, 14, 7); g.fill();
      g.fillStyle = '#C9BBAA'; EP.rr(g, 80, 38, 420 + (i * 53) % 220, 11, 5); g.fill();
      g.fillStyle = C.orange; g.beginPath(); g.arc(WW - 120, 32, 9, 0, 7); g.fill();
      g.restore();
    }
    EP.drawActor(g, lt, { n: 'spr_burglar', x: 1560 - lt * 40, y: H + 40, h: 900, enter: 'slideR', at: 0, dist: 600, hop: 14, sway: 3 }, t);
  };

  // ------------------------------------------------------------------ found: caught in the beam (#017 circle, as a spotlight)
  S.found = (g, lt, p, t, Sh) => {
    EP.cover(g, EP.blurred('bg_lair', 16, 0.6), { z: 1.1 });
    g.globalAlpha = 0.45; windowFrame(g, 150, 120, 1180, 840, 'Inbox'); g.globalAlpha = 1;
    EP.txt(g, 'All clear.', 740, 520, { font: 'italic ' + EP.font(600, 90, F.serif), color: '#C9B49C' });
    EP.drawActor(g, lt, { n: 'spr_burglar', x: 1500, y: H + 40, h: 900, sway: 2, breathe: false }, t);
    // the beam: a growing circle (#017 timing) that stops around her
    const pr = eIO(P(lt, 0.05, 1.2)), R = lerp(0, 400, pr), cx = 1500, cy = 560;
    g.save(); g.fillStyle = 'rgba(4,4,12,.9)'; g.beginPath(); g.rect(0, 0, W, H); g.moveTo(cx + Math.max(1, R), cy); g.arc(cx, cy, Math.max(1, R), 0, EP.TAU, true); g.closePath(); g.fill('evenodd'); g.restore();
    if (pr < 1) { g.strokeStyle = 'rgba(255,246,232,.9)'; g.lineWidth = 7 * EP.SC * 0.5; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke(); }
    g.save(); g.globalCompositeOperation = 'screen'; EP.glowDot(g, cx, cy, R * 1.05, 'rgba(255,245,210,.25)', 'rgba(255,230,180,.12)'); g.restore();
    UI.tag(g, t, { x: 520, y: 200, text: '🔍  1 result found', at: EP.Wd(10, 3) - Sh.t, bg: C.cream, col: C.ink, px: 40, ls: 1 }, lt);
  };

  // ------------------------------------------------------------------ meeting: projector chart (#002), dolly toward the door (#027)
  S.meeting = (g, lt, p, t, Sh) => {
    const tD = EP.L(12) - Sh.t - 0.1, d = P(lt, tD, tD + 2.9 * 0.55);
    const cam = { x: lerp(0.45, 0.84, eIO(d)), y: lerp(0.5, 0.47, eIO(d)), z: 1.02 * EP.dollyScale(d, 1.9) };
    EP.cover(g, 'bg_meeting', cam);
    // projector screen (image coords) with a stagger bar chart
    const a = EP.coverPt('bg_meeting', cam, 0.352, 0.105), b = EP.coverPt('bg_meeting', cam, 0.584, 0.39);
    const sw = b.x - a.x, sh = b.y - a.y, base = a.y + sh * 0.86, N = 7, HS = [52, 84, 68, 112, 92, 136, 158];
    for (let i = 0; i < N; i++) {
      const s2 = EP.stagger(lt - 0.2, i), hh = HS[i] / 170 * sh * 0.72 * s2.g; if (hh <= 0) continue;
      const bw = sw / (N * 1.6), x = a.x + sw * 0.1 + i * bw * 1.45;
      g.fillStyle = ['#4A7BD6', '#E8645A', '#F5C542', '#5BB585'][i % 4]; g.globalAlpha = 0.9; g.fillRect(x, base - hh, bw, hh); g.globalAlpha = 1;
    }
    // Claude presenting at the screen
    const f = EP.coverPt('bg_meeting', cam, 0.25, 0.86);
    EP.spr(g, 'spr_point', { x: f.x, y: f.y, h: 520 * f.s / 1.25, t: lt, sway: 2 });
    UI.tag(g, t, { x: 1500, y: 140, text: 'Weekly sync · 2h', at: 0.15, bg: '#4A7BD6', px: 36, ls: 1 }, lt);
    UI.tag(g, t, { x: 1500, y: 240, text: '✓ Claude will attend', at: 1.0, bg: C.orange, px: 36, ls: 1 }, lt);
    FX.dust(g, t, { n: 24, a: 0.4 });
    if (d > 0) { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = eIO(d) * 0.5; EP.glowDot(g, W * 0.6, H * 0.45, 1100, 'rgba(255,240,200,.9)', 'rgba(255,220,160,.3)'); g.restore(); }
  };

  // ------------------------------------------------------------------ forms: filled, filed, certified (#006 typing, #024 stamps)
  const STAMPS = [{ s: 'FILLED', col: '#E0662A', x: 560, y: 420, r: -0.18 }, { s: 'FILED', col: '#2E8B57', x: 760, y: 610, r: 0.12 }, { s: 'CERTIFIED', col: '#C8231B', x: 640, y: 800, r: -0.08 }];
  S.forms = (g, lt, p, t, Sh) => {
    BG.paper(g, t, { col: '#F3E2C8', a: 0.6 });
    FX.leak(g, t, { x0: -300, x1: 600, per: 20, y: 200, a: 0.25 });
    const hits = [EP.Wd(14, 0), EP.Wd(14, 2), EP.Wd(14, 4)].map(x => x - Sh.t + 0.02);
    let sh = { dx: 0, dy: 0, rot: 0 };
    hits.forEach(h => { const s2 = EP.impact(lt - h, 0.4); sh.dx += s2.dx; sh.dy += s2.dy; sh.rot += s2.rot; });
    g.save(); EP.camApply(g, sh, 1.03);
    for (let i = 0; i < 3; i++) {
      const u = lt - i * 0.12, inP = backOut(P(u, 0, 0.5), 2.6);   // #002 stagger timing for the sheets
      if (inP <= 0) continue;
      const x = lerp(-700, 520 + i * 70, inP), y = 520 + i * 30, r = (-0.08 + i * 0.07);
      g.save(); g.translate(x, y); g.rotate(r);
      g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 20; g.shadowOffsetY = 8; g.fillStyle = '#FFFDF7'; g.fillRect(-320, -400, 640, 800); g.shadowColor = 'transparent';
      g.fillStyle = '#E8D9C2'; g.fillRect(-320, -400, 640, 90);
      EP.txt(g, ['FORM 27-B', 'FORM 1040-Z', 'FORM 9-ALPHA'][i], -290, -340, { font: EP.font(800, 38, F.ui), color: '#7A6650', align: 'left' });
      for (let k = 0; k < 7; k++) {
        const yy = -250 + k * 90; g.fillStyle = '#B9A68E'; g.fillRect(-280, yy + 30, 560, 3);
        EP.txt(g, ['NAME', 'DATE', 'ID', 'ADDRESS', 'REASON', 'SIGN', 'NOTES'][k], -280, yy, { font: EP.font(800, 22, F.ui), color: '#9A8670', align: 'left' });
        // typed answers (#006 timing, compressed ×0.25 to fit the line)
        EP.typeOn(g, ['J. DOE', '2026-10-04', '00417', '12 MAPLE ST', 'BECAUSE', 'J.D.', 'N/A'][k], -150, yy + 14, u - 0.35 - k * 0.12, { t0: 0, dt: 0.06, font: EP.font(400, 34, F.type), color: '#2B2B5A', cursor: false });
      }
      g.restore();
    }
    STAMPS.forEach((s, i) => {
      const u = lt - hits[i]; if (u < 0) return;
      const k = u < 0.08 ? lerp(1.6, 1, u / 0.08) : 1;
      g.save(); g.translate(s.x, s.y); g.rotate(s.r); g.scale(k, k); g.globalAlpha = 0.85;
      g.strokeStyle = s.col; g.lineWidth = 9; EP.rr(g, -230, -70, 460, 140, 18); g.stroke();
      EP.txt(g, s.s, 0, 26, { font: EP.font(900, s.s.length > 7 ? 70 : 84, F.ui), color: s.col, ls: '6px' });
      g.restore();
    });
    g.restore();
    // Claude with the giant stamp: anticipation, then down on each hit
    let dy = 0, sy = 1;
    hits.forEach(h => {
      const u = lt - h;
      if (u > -0.12 && u < 0) dy = -40 * ((u + 0.12) / 0.12);                       // lift before the hit
      else if (u >= 0 && u < 0.3) { dy = 110 * (1 - u / 0.3); sy = 1 - 0.06 * Math.sin(Math.PI * u / 0.3); }   // down and squash
    });
    EP.drawActor(g, lt, { n: 'spr_stamp', x: 1420, y: H + 120 + dy, h: 1050, sy, enter: 'slideR', at: 0.2, dist: 700, sway: 3 }, t);
    hits.forEach(h => EP.burst(g, 1330, 330 + 100, lt - h, 1.6));
  };

  // ------------------------------------------------------------------ hold: patient on the line
  S.hold = (g, lt, p, t, Sh) => {
    EP.cover(g, EP.blurred('bg_lair', 12, 0.75), { z: 1.08 });
    FX.bokeh(g, t, { n: 12, a: 0.25 });
    EP.drawActor(g, lt, { n: 'spr_phone', x: 620, y: H + 20, h: 980, enter: 'fade', at: 0, sway: 2 }, t);
    // the hold timer card
    const X = 1080, Y = 300;
    g.save(); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 40; g.shadowOffsetY = 14; g.fillStyle = 'rgba(255,248,238,.96)'; EP.rr(g, X, Y, 680, 360, 36); g.fill(); g.restore();
    EP.txt(g, 'ON HOLD', X + 50, Y + 80, { font: EP.font(900, 40, F.ui), color: C.orange2, align: 'left', ls: '4px' });
    const secs = 2 * 3600 + 47 * 60 + Math.floor(lt * 37), hh = Math.floor(secs / 3600), mm = Math.floor(secs / 60) % 60, ss = secs % 60;
    EP.digits(g, `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`, X + 340, Y + 190, EP.font(900, 120, F.ui), C.ink);
    EP.txt(g, 'Please continue to hold…', X + 50, Y + 300, { font: 'italic ' + EP.font(500, 36, F.serif), color: '#8A7A6A', align: 'left' });
    FX.notes(g, t, { x: 700, y: 520, w: 380, rise: 420, n: 9 });
  };

  // ------------------------------------------------------------------ files flying into folders over the lair
  S.lairwork = (g, lt, p, t, Sh) => {
    EP.imgShot(g, lt, { img: 'bg_lair', cam: [{ x: 0.5, y: 0.5, z: 1.04 }, { x: 0.58, y: 0.48, z: 1.22 }] }, t, Sh.dur);
    for (let i = 0; i < 12; i++) {
      const per = 1.3, u = mod(lt * 0.9 + i / 12 * per, per) / per, x0 = 200 + hash(i, 1) * 600, y0 = 900, x1 = 1350 + hash(i, 2) * 300, y1 = 360 + hash(i, 3) * 200;
      const x = lerp(x0, x1, eIOs(u)), y = lerp(y0, y1, eIOs(u)) - Math.sin(Math.PI * u) * 260;
      g.save(); g.translate(x, y); g.rotate((u - 0.5) * 1.4 + i); g.globalAlpha = Math.sin(Math.PI * u) * 0.9;
      g.fillStyle = '#FFF8EC'; g.fillRect(-36, -46, 72, 92); g.fillStyle = '#D8C6AE'; for (let k = 0; k < 5; k++) g.fillRect(-26, -32 + k * 14, 52 - (k % 2) * 14, 4);
      g.restore();
    }
    FX.dust(g, t, { n: 30, a: 0.45 });
  };

  // ------------------------------------------------------------------ clock heist: "I'll steal back your time"
  function clockFace(g, x, y, R, hTurns, handsAlpha) {
    g.save(); g.translate(x, y);
    g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 40; g.shadowOffsetY = 16; g.fillStyle = '#8A5A2E'; g.beginPath(); g.arc(0, 0, R + 34, 0, 7); g.fill(); g.shadowColor = 'transparent';
    g.fillStyle = '#F7BE4F'; g.beginPath(); g.arc(0, 0, R + 16, 0, 7); g.fill();
    g.fillStyle = '#FFF8EA'; g.beginPath(); g.arc(0, 0, R, 0, 7); g.fill();
    for (let i = 0; i < 60; i++) { const a = i / 60 * EP.TAU, r0 = i % 5 ? R * 0.92 : R * 0.86; g.strokeStyle = '#5A3B2E'; g.lineWidth = i % 5 ? 3 : 7; g.beginPath(); g.moveTo(Math.sin(a) * r0, -Math.cos(a) * r0); g.lineTo(Math.sin(a) * R * 0.97, -Math.cos(a) * R * 0.97); g.stroke(); }
    for (let i = 1; i <= 12; i++) { const a = i / 12 * EP.TAU; EP.txt(g, String(i), Math.sin(a) * R * 0.72, -Math.cos(a) * R * 0.72 + 22, { font: EP.font(700, 66, F.serif), color: '#3A2A20' }); }
    if (handsAlpha > 0) {
      g.globalAlpha = handsAlpha; g.lineCap = 'round';
      const ah = hTurns * EP.TAU / 12, am = hTurns * EP.TAU;
      g.strokeStyle = '#2B1E19'; g.lineWidth = 18; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(ah) * R * 0.5, -Math.cos(ah) * R * 0.5); g.stroke();
      g.lineWidth = 10; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(am) * R * 0.78, -Math.cos(am) * R * 0.78); g.stroke();
      g.globalAlpha = 1;
    }
    g.fillStyle = C.orange; g.beginPath(); g.arc(0, 0, 16, 0, 7); g.fill();
    g.restore();
  }
  S.clockheist = (g, lt, p, t, Sh) => {
    BG.vgrad(g, t, { stops: [[0, '#8FC9EE'], [0.65, '#FFD7A8'], [1, '#F5A36B']] });
    FX.leak(g, t, { y: 200, a: 0.3, per: 14 });
    const grab = EP.Wd(21, 4) - Sh.t;   // on "time"
    const turns = 6 + 12 * eIO(P(lt, 0.0, grab)) ;
    const fly = eIO(P(lt, grab, grab + 0.7));
    clockFace(g, 760, 500, 330, turns, 1 - (fly > 0 ? 1 : 0));
    if (fly > 0 && fly < 1) {   // the hands fly into the sack
      const x = lerp(760, 1480, fly), y = lerp(500, 380, fly) - Math.sin(Math.PI * fly) * 260;
      g.save(); g.translate(x, y); g.rotate(fly * 9); g.strokeStyle = '#2B1E19'; g.lineCap = 'round'; g.lineWidth = 16; g.beginPath(); g.moveTo(-60, 0); g.lineTo(80, 0); g.stroke(); g.lineWidth = 9; g.beginPath(); g.moveTo(0, -90); g.lineTo(0, 40); g.stroke(); g.restore();
    }
    EP.drawActor(g, lt, { n: 'spr_burglar', x: 1560, y: H + 60, h: 1000, enter: 'slideR', at: 0.0, dist: 700, hop: 10, sway: 3 }, t);
    if (fly >= 1) EP.burst(g, 1500, 380, lt - grab - 0.7, 1.4);
  };

  // ------------------------------------------------------------------ time-lapse: noon → midnight (#039)
  // Motion Prompt #039 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#039
  // 12 hours in 3.7 s (cubic in-out), the sun travels an arc −1.25 → +1.25 rad; clouds drift; clock in 10-minute steps.
  EP.MOON = { x: 1380, y: 300, r: 86 };
  const SKY = [[0, ['#6FB7EA', '#BFE3F7']], [0.55, ['#F59E5B', '#FFD9A1']], [0.72, ['#5B3A7A', '#E07A5F']], [1, ['#0D1233', '#26306A']]];
  function skyAt(k) { for (let i = 1; i < SKY.length; i++) if (k <= SKY[i][0]) { const a = SKY[i - 1], b = SKY[i], f = (k - a[0]) / (b[0] - a[0]); return [EP.mix(a[1][0], b[1][0], f), EP.mix(a[1][1], b[1][1], f)]; } return SKY[SKY.length - 1][1]; }
  S.timelapse = (g, lt, p, t, Sh) => {
    const k = Sh.dur / 4.5, pr = eIO(P(lt, 0.4 * k, 4.1 * k));
    const [top, bot] = skyAt(pr);
    g.fillStyle = EP.vgrad(g, 0, H, [[0, top], [1, bot]]); g.fillRect(0, 0, W, H);
    FX.stars(g, t, { n: 150, h: 0.7, a: smooth(P(pr, 0.6, 0.95)) });
    // sun arc
    const a = lerp(-1.25, 1.25, clamp(pr / 0.7));
    const sx = W / 2 + Math.sin(a) * 900, sy = 860 - Math.cos(a) * 640;
    if (pr < 0.72) { EP.glowDot(g, sx, sy, 300, 'rgba(255,240,190,.9)', 'rgba(255,180,90,.35)'); g.fillStyle = '#FFF4D0'; g.beginPath(); g.arc(sx, sy, 70, 0, 7); g.fill(); }
    // moon rising into its mark (match-cut point for the chorus)
    const mr = smooth(P(pr, 0.7, 1));
    if (mr > 0) { const M = EP.MOON, my = lerp(H + 120, M.y, eOut(mr)); EP.glowDot(g, M.x, my, M.r * 3.4, 'rgba(255,240,200,.55)', 'rgba(255,220,160,.15)'); g.fillStyle = '#FFF3D6'; g.beginPath(); g.arc(M.x, my, M.r, 0, 7); g.fill(); }
    // clouds
    const ca = 0.75 * (1 - smooth(P(pr, 0.6, 0.9)));
    if (ca > 0.01) for (let i = 0; i < 4; i++) {   // soft clouds drifting with the hours
      const x = mod(300 + i * 520 + pr * 1400, W + 600) - 300, y = 170 + i * 70;
      g.save(); g.globalAlpha = ca;
      for (let j = 0; j < 6; j++) { const bx = x + (j - 2.5) * 62, by = y - Math.sin(j / 5 * Math.PI) * 38, r = 70 + 26 * Math.sin(j * 1.7 + i); EP.glowDot(g, bx, by, r, 'rgba(255,255,255,.95)', 'rgba(255,248,240,.6)'); }
      g.restore();
    }
    // skyline with windows lighting up
    const R = EP.rng(7); let x = -20;
    while (x < W + 40) {
      const bw = 90 + R() * 140, bh = 160 + R() * 360, y = H - bh;
      g.fillStyle = EP.mix('#3A3C5A', '#0A0C1C', pr); g.fillRect(x, y, bw, bh);
      for (let wy = y + 24; wy < H - 30; wy += 46) for (let wx = x + 16; wx < x + bw - 22; wx += 34) { const on = hash(Math.floor(wx), Math.floor(wy)) < smooth(P(pr, 0.55 + hash(Math.floor(wx), 3) * 0.2, 0.8 + hash(Math.floor(wy), 4) * 0.15)) * 0.85; if (on) { g.fillStyle = '#FFD27A'; g.fillRect(wx, wy, 16, 22); } }
      x += bw + 6;
    }
    // clock readout, 12:00 → 24:00 in 10-minute steps
    const mins = 12 * 60 + Math.floor(pr * 72) * 10, hh = Math.floor(mins / 60) % 24, mm = mins % 60;
    g.fillStyle = 'rgba(0,0,0,.35)'; EP.rr(g, W - 290, 46, 240, 76, 18); g.fill();
    EP.digits(g, `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, W - 170, 86, EP.font(800, 46, F.ui), '#fff');
  };
})();
