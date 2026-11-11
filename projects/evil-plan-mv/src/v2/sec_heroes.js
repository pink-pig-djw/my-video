// v2/sec_heroes.js — "heroes" (154.2 – 182.0 s) as comic-book pages. Panels ink themselves on and the camera reads
// them panel by panel; the lyrics sit in yellow caption boxes and one speech balloon; a TOMORROW calendar page is torn
// off to TODAY. Then a dark page: torch beams search for Claude, FEAR flips letter by letter into CARE, the nightmare
// world is a gray globe taped shut with DO NOT. Last, the castle doors open to the torches (embers, warm bloom) and the
// switch waits on the desk under a spotlight, tagged.
'use strict';
(function () {
  const { W, H, clamp, lerp, P, eIO, eIOs, eOut, eOut5, eIn, backOut, spring, smooth, hash, noise, mod } = EP;
  const PA = EP.PA, STK = EP.STK, KT = EP.KT, WD = EP.WD, K = EP.K, F = EP.F, COL = PA.COL;
  const L = EP.L, Wd = EP.Wd;
  const spread = (id, x, y, w, h, mood, rot, draw, extra = {}) => WD.spreads.push(Object.assign({ id, x, y, w, h, mood, rot, draw }, extra));

  // ------------------------------------------------------------------ comic helpers
  let DOTS = null;
  function dots() { if (DOTS) return DOTS; const c = EP.mk(64, 64), g = c.getContext('2d'); g.fillStyle = 'rgba(30,27,38,.16)'; [[16, 16], [48, 48]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); }); return (DOTS = c); }
  // a panel: paper-white with a dot screen, content clipped inside, the border inked on (#004) from t0
  function panel(g, x0, y0, x1, y1, t, t0, inside, o = {}) {
    const f = eIO(P(t, t0, t0 + 0.35)); if (f <= 0) return;
    g.save(); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
    g.globalAlpha *= P(t, t0, t0 + 0.2);
    g.fillStyle = o.bg || '#FFFDF6'; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    if (o.dots !== false) { g.fillStyle = g.createPattern(dots(), 'repeat'); g.fillRect(x0, y0, x1 - x0, y1 - y0); }
    if (inside) inside(g, t);
    g.restore();
    K.line(g, [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]], 0, f, { col: '#1E1B26', w: 12 });
  }
  function fillImg(g, name, x0, y0, w, h, t, t0, kb = {}) {
    const im = EP.img[name]; if (!im) return;
    const p = EP.EASE.sine(P(t, t0, t0 + (kb.d ?? 6))), z = lerp(kb.z0 ?? 1.0, kb.z1 ?? 1.12, p), fx = lerp(kb.x0 ?? 0.5, kb.x1 ?? kb.x0 ?? 0.5, p), fy = lerp(kb.y0 ?? 0.5, kb.y1 ?? kb.y0 ?? 0.5, p);
    const [sx, sy, sw, sh] = K.crop(im, w, h, fx, fy, z); g.drawImage(im, sx, sy, sw, sh, x0, y0, w, h);
  }
  function speedLines(g, cx, cy, r0, t) {
    g.save(); g.strokeStyle = 'rgba(30,27,38,.22)'; g.lineCap = 'round';
    for (let k = 0; k < 48; k++) { const a = k / 48 * EP.TAU + hash(k, 1) * 0.08, r1 = r0 + hash(k, 2) * 200 + Math.sin(t * 9 + k) * 20; g.lineWidth = 3 + hash(k, 3) * 6; g.beginPath(); g.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); g.lineTo(cx + Math.cos(a) * 1600, cy + Math.sin(a) * 1600); g.stroke(); }
    g.restore();
  }
  // comic sound effect: fat italic letters with an ink outline, popping in letter by letter
  function sfx(g, text, x, y, px, rot, t, t0, fill = '#FFE14A') {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.font = 'italic ' + EP.font(900, px, F.ui); let xx = 0; const chars = [...text], ws = chars.map(ch => g.measureText(ch).width), tot = ws.reduce((a, b) => a + b, 0); xx = -tot / 2;
    chars.forEach((ch, k) => {
      const pp = EP.pop(t - (t0 + k * 0.05)); if (pp.sc > 0.01) { g.save(); g.translate(xx + ws[k] / 2, (k % 2) * px * 0.08); g.scale(pp.sc, pp.sc); g.rotate(pp.rot * 0.5); g.font = 'italic ' + EP.font(900, px, F.ui); g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = px * 0.16; g.strokeStyle = '#1E1B26'; g.strokeText(ch, 0, 0); g.fillStyle = fill; g.fillText(ch, 0, 0); g.restore(); }
      xx += ws[k];
    });
    g.restore();
  }
  // a caption box sized to a KT design and drawn under it
  function capFor(g, d, t, o = {}) {
    const Lt = KT.layout(g, d), t0 = EP.T.lines[d.i].words[0].t0 - 0.2;
    K.caption(g, d.x - 26, d.y - 18, (o.w || Lt.w) + 52, Lt.h + (d.zh === false ? 30 : 70), t, t0, { fill: o.fill });
    KT.draw(g, d, t);
  }

  // ================================================================== H1 · the heroes came (four panels)
  const capStyle = (i, x, y, w, px = 54, extra = {}) => Object.assign({ i, x, y, w, px, style: 'type', col: '#1E1B26', zh: { px: 26, col: '#3A3350', dy: undefined } }, extra);
  const dH73 = capStyle(73, -1060, -630, 1000, 58, { emph: { 'heroes': { style: 'cut', big: 1.1, cols: ['#D23A2C', '#2B3990', '#D23A2C', '#2B3990', '#D23A2C', '#2B3990'] } } });
  const dH74 = capStyle(74, 330, -110, 740, 56, { emph: { 'few': { style: 'marker', col: '#D23A2C', big: 1.2 } } });
  const dH75 = capStyle(75, -1060, 150, 900, 54, { emph: { 'blame': { col: '#7A7486', strike: Wd(75, 3) + 0.25 } } });
  const dH76 = capStyle(76, -40, 150, 700, 54, { emph: { 'afraid': { style: 'marker', col: '#2B3990', big: 1.2, shake: true } } });
  spread('H1', 69800, 150, 2400, 1450, 0.1, 0.006, (g, t) => {
    PA.drawCard(g, PA.card('H1', 2400, 1450, { tex: 'white', r: 6, edge: 0.15 }), 0, 0);
    panel(g, -1100, -660, 250, 80, t, L(73) - 0.35, gg => {
      fillImg(gg, 'bg_heroes', -1100, -660, 1350, 740, t, L(73) - 0.35, { z0: 1.0, z1: 1.14, x0: 0.45, x1: 0.55, y0: 0.6, y1: 0.5 });
      sfx(gg, 'STOMP STOMP', -280, -40, 96, -0.12, t, Wd(73, 3), '#FFE14A');
    });
    panel(g, 290, -660, 1100, 80, t, L(74) - 0.3, gg => { gg.fillStyle = '#FFE9C8'; gg.fillRect(290, -660, 810, 740); speedLines(gg, 700, -200, 260, t); });
    panel(g, -1100, 120, -120, 660, t, L(75) - 0.3, gg => fillImg(gg, 'bg_hero_close', -1100, 120, 980, 540, t, L(75) - 0.3, { z0: 1.05, z1: 1.18, x0: 0.42, y0: 0.4 }));
    panel(g, -80, 120, 1100, 660, t, L(76) - 0.3, gg => { gg.fillStyle = '#DCE8F4'; gg.fillRect(-80, 120, 1180, 540); });
    // Claude breaks out of panel two, then shows up small and kind in panel four
    STK.draw(g, 'spr_shrug', 840, -130, 520, { t, peel: P(t, L(74) - 0.1, L(74) + 0.3), sway: 0.8 });
    STK.draw(g, 'spr_heart', 900, 680, 520, { t, peel: P(t, Wd(76, 2) - 0.1, Wd(76, 2) + 0.3), sway: 0.8 });
    capFor(g, dH73, t); capFor(g, dH74, t); capFor(g, dH75, t); capFor(g, dH76, t);
  }, { img: ['bg_heroes', 'bg_hero_close', 'cut/spr_shrug', 'cut/spr_heart'] });

  // ================================================================== H2 · "wait until we're certain" — tomorrow's cure today
  const dH77 = { i: 77, x: -1000, y: -560, w: 640, px: 60, style: 'marker', col: '#1E1B26', zh: { px: 26, col: '#3A3350' } };
  const dH78 = capStyle(78, -160, -630, 1200, 56, { emph: { 'wisest': { style: 'marker', col: '#2F8F8A', big: 1.2, under: '#2F8F8A' } } });
  const dH79 = capStyle(79, -160, 40, 1200, 56, { emph: { 'asking': { italic: true } } });
  const dH80 = capStyle(80, -160, 175, 1200, 56, { emph: { 'cure': { style: 'marker', col: COL.tangerine, big: 1.2 }, 'today': { style: 'marker', col: '#D23A2C', big: 1.3, circle: '#D23A2C' } } });
  const TEARCAL = Wd(80, 3) - 0.1;
  function calendar(g, x, y, t) {
    g.save(); g.translate(x, y);
    const card = (label, col, num) => { PA.drawCard(g, PA.card('cal' + label, 300, 330, { tex: 'white', r: 6, blur: 10, header: { col, h: 90 } }), 0, 0); EP.txt(g, label, 0, -112, { font: EP.font(900, label.length > 6 ? 40 : 52, F.ui), color: '#FFFFFF', ls: '3px' }); EP.txt(g, num, 0, 90, { font: EP.font(900, 150, F.serif), color: '#2A2440' }); };
    card('TODAY', '#D23A2C', '★');
    const tp = P(t, TEARCAL, TEARCAL + 0.55);
    if (tp < 1) { g.save(); g.translate(eIn(tp) * 700, -eIn(tp) * 500 + Math.sin(Math.PI * tp) * -60); g.rotate(eIn(tp) * 1.3); card('TOMORROW', '#5A6075', '?'); g.restore(); }
    g.fillStyle = '#8A8070'; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(-100 + k * 66, -168, 12, 0, 7); g.fill(); }
    g.restore();
  }
  function hourglass(g, x, y, s, t, t0) {
    const sand = clamp((t - t0) / 3);
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = '#8A5A3A'; g.fillRect(-90, -150, 180, 20); g.fillRect(-90, 130, 180, 20);
    g.strokeStyle = '#2A2440'; g.lineWidth = 6; g.beginPath(); g.moveTo(-70, -130); g.lineTo(70, -130); g.lineTo(8, 0); g.lineTo(70, 130); g.lineTo(-70, 130); g.lineTo(-8, 0); g.closePath(); g.stroke();
    g.fillStyle = '#E8B54A'; g.beginPath(); const top = lerp(-110, -10, sand); g.moveTo(-70 * (1 - (top + 130) / 130), top); g.lineTo(70 * (1 - (top + 130) / 130), top); g.lineTo(8, 0); g.lineTo(-8, 0); g.closePath(); g.fill();
    g.beginPath(); const hb = lerp(0, 100, sand); g.moveTo(-70, 130); g.lineTo(70, 130); g.lineTo(70 - hb * 0.5, 130 - hb); g.lineTo(-70 + hb * 0.5, 130 - hb); g.closePath(); g.fill();
    if (sand < 1) { g.fillRect(-2, 0, 4, 130 - hb); }
    g.restore();
  }
  spread('H2', 72500, -100, 2400, 1450, 0.1, -0.006, (g, t) => {
    PA.drawCard(g, PA.card('H2', 2400, 1450, { tex: 'white', r: 6, edge: 0.15 }), 0, 0);
    panel(g, -1100, -660, -250, 660, t, L(77) - 0.35, gg => fillImg(gg, 'bg_hero_close', -1100, -660, 850, 1320, t, L(77) - 0.35, { z0: 1.0, z1: 1.1, x0: 0.36, x1: 0.4, y0: 0.45 }));
    panel(g, -200, -660, 1100, -40, t, L(78) - 0.3, gg => { gg.fillStyle = '#FFF2C8'; gg.fillRect(-200, -660, 1300, 620); });
    panel(g, -200, 0, 1100, 660, t, L(79) - 0.3, gg => { gg.fillStyle = '#E2ECF6'; gg.fillRect(-200, 0, 1300, 660); });
    // the hero's balloon
    K.bubble(g, -680, -470, 720, 300, -600, -160, t, L(77) - 0.15, { r: 60, tw: 40, lw: 7 });
    KT.draw(g, dH77, t);
    capFor(g, dH78, t);
    STK.draw(g, 'spr_okay', 800, -40, 560, { t, peel: P(t, L(78) + 0.1, L(78) + 0.5), sway: 0.8 });
    if (t > Wd(78, 5)) PA.drawDoodle(g, 'check', 520, -250, 1.4, P(t, Wd(78, 5), Wd(78, 5) + 0.35), { col: '#2E8B57', w: 12, seed: 401 });
    hourglass(g, 880, 470, 1.05, t, L(79) - 0.2);
    calendar(g, 470, 490, t);
    capFor(g, dH79, t); capFor(g, dH80, t);
  }, { img: ['bg_hero_close', 'cut/spr_okay'] });

  // ================================================================== H3 · fear is a kind of care (dark page)
  const dH81 = { i: 81, x: -1080, y: -612, w: 2000, px: 74, style: 'serif', col: '#EDE6F2', emph: { 'afraid': { style: 'marker', col: '#9AA6C4', shake: true, big: 1.15 } }, zhCol: '#B8B0C8', zh: { px: 28 } };
  const dH82 = { i: 82, x: -1080, y: 250, w: 1300, px: 70, style: 'serif', col: '#EDE6F2', emph: { 'fear': { col: '#FF6A55', italic: true, w: 900 }, 'care': { style: 'marker', col: '#F4CE72', big: 1.3 } }, zhCol: '#B8B0C8', zh: { px: 26 } };
  const dH83 = { i: 83, x: -1080, y: 385, w: 1300, px: 64, style: 'serif', col: '#EDE6F2', emph: { 'doubt': { style: 'type', col: '#9AA6C4' } }, zhCol: '#B8B0C8', zh: { px: 26 } };
  const dH84 = { i: 84, x: -1080, y: 505, w: 1300, px: 64, style: 'serif', col: '#EDE6F2', emph: { 'dare': { style: 'cut', big: 1.15, cols: ['#F4C430', '#1E1B26', '#F4C430', '#1E1B26', '#F4C430'] } }, zhCol: '#B8B0C8', zh: { px: 26 } };
  const FLIPC = Wd(82, 5) - 0.25;
  function beam(g, x, y, a, len, w, alpha) {
    g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha *= alpha; g.translate(x, y); g.rotate(a);
    const gr = g.createLinearGradient(0, 0, len, 0); gr.addColorStop(0, 'rgba(255,236,190,.85)'); gr.addColorStop(1, 'rgba(255,220,160,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, -12); g.lineTo(len, -w); g.lineTo(len, w); g.lineTo(0, 12); g.closePath(); g.fill(); g.restore();
  }
  function grayGlobe(g, x, y, R, t, tapeT) {
    g.save(); g.translate(x, y);
    g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(20, R + 30, R * 0.9, R * 0.16, 0, 0, 7); g.fill();
    g.fillStyle = '#8A8D96'; g.beginPath(); g.arc(0, 0, R, 0, 7); g.fill();
    g.fillStyle = '#B4B6BE'; [[-0.4, -0.3, 0.5, 0.3], [0.3, 0.1, 0.4, 0.45], [-0.2, 0.45, 0.3, 0.2], [0.45, -0.5, 0.3, 0.2]].forEach(([a, b, c, d]) => { g.beginPath(); g.ellipse(a * R, b * R, c * R, d * R, a, 0, 7); g.fill(); });
    const sg = g.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.1, 0, 0, R); sg.addColorStop(0, 'rgba(255,255,255,.18)'); sg.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = sg; g.beginPath(); g.arc(0, 0, R, 0, 7); g.fill();
    // caution tape, strip by strip
    [[-0.5, 0], [0.45, -40], [0.05, 60], [-1.3, 20]].forEach(([a, dy], k) => {
      const f = eOut5(P(t, tapeT + k * 0.12, tapeT + 0.25 + k * 0.12)); if (f <= 0) return;
      g.save(); g.rotate(a); g.translate(0, dy); const Lh = (R * 2.6) * f;
      g.beginPath(); g.rect(-R * 1.3, -32, Lh, 64); g.clip();
      g.fillStyle = '#F4C430'; g.fillRect(-R * 1.3, -32, R * 2.6, 64);
      g.fillStyle = '#1E1B26'; for (let i = -10; i < 30; i++) { g.beginPath(); g.moveTo(-R * 1.3 + i * 60, -32); g.lineTo(-R * 1.3 + i * 60 + 30, -32); g.lineTo(-R * 1.3 + i * 60, 32); g.lineTo(-R * 1.3 + i * 60 - 30, 32); g.closePath(); g.fill(); }
      g.fillStyle = '#F4C430'; g.fillRect(-R * 0.55, -22, R * 1.1, 44); EP.txt(g, 'DO NOT', 0, 15, { font: EP.font(900, 40, F.ui), color: '#1E1B26', ls: '4px' });
      g.restore();
    });
    g.restore();
  }
  spread('H3', 75200, 150, 2400, 1450, 'night', 0.008, (g, t) => {
    PA.drawCard(g, PA.card('H3', 2400, 1450, { tex: 'black', torn: 'tb', edge: 0.4 }), 0, 0);
    // torch beams searching
    const ba = 1 - P(t, L(82) + 0.5, L(82) + 1.2);
    if (ba > 0) for (let k = 0; k < 3; k++) beam(g, -900 + k * 900, 760, -Math.PI / 2 + Math.sin(t * (0.9 + k * 0.2) + k * 2) * 0.55, 1500, 260, 0.55 * ba * P(t, L(81) - 0.3 + k * 0.15, L(81) + 0.2 + k * 0.15));
    // FEAR → CARE, letter by letter (#021)
    const A = [...'FEAR'], B = [...'CARE'], px = 290, show = P(t, L(82) - 0.4, L(82));
    if (show > 0) {
      let x = -880;
      A.forEach((ch, k) => {
        const Ga = PA.glyph(ch, px, '#D23A2C'), Gb = PA.glyph(B[k], px, '#F4CE72'), w = Math.max(Ga.c.width, Gb.c.width), adv = Math.max(Ga.adv, Gb.adv);
        const cxk = x + adv * 0.5, cy = -170, pp = EP.pop(t - (L(82) - 0.4 + k * 0.06)), fp = P(t, FLIPC + k * 0.1, FLIPC + 0.45 + k * 0.1);
        g.save(); g.translate(cxk, cy); g.scale(pp.sc, pp.sc); g.rotate((hash(k, 3) - 0.5) * 0.1);
        if (fp <= 0) g.drawImage(Ga.c, -Ga.c.width / 2, -Ga.c.height * 0.62); else if (fp >= 1) g.drawImage(Gb.c, -Gb.c.width / 2, -Gb.c.height * 0.62);
        else PA.flipDraw(g, Ga.c, Gb.c, fp, 0, -Ga.c.height * 0.62 + Ga.c.height / 2, w, Ga.c.height, { slices: 12, liftK: 2 });
        g.restore();
        x += adv * 1.02;
      });
      const hp = EP.pop(t - (FLIPC + 0.75)); if (hp.sc > 0.01) { g.save(); g.translate(-80, -330); g.scale(hp.sc * 2, hp.sc * 2); g.fillStyle = '#E8455C'; EP.heartPath(g, 28); g.fill(); g.restore(); }
    }
    // the nightmare: a gray world, taped shut
    const gp = eOut5(P(t, L(84) - 0.5, L(84)));
    if (gp > 0) { g.save(); g.globalAlpha *= gp; grayGlobe(g, 640, lerp(400, 60, gp), 300, t, Wd(84, 4) - 0.1); g.restore(); }
    if (t > L(83) - 0.2 && t < L(84)) { const q = P(t, L(83) - 0.2, L(83) + 0.3); g.save(); g.globalAlpha *= q; EP.txt(g, '?', 640, 60, { font: EP.font(700, 260, F.hand), color: '#9AA6C4' }); g.restore(); }
    KT.draw(g, dH81, t); KT.draw(g, dH82, t); KT.draw(g, dH83, t); KT.draw(g, dH84, t);
    STK.draw(g, 'spr_lantern', 1020, 730, 700, { t, peel: P(t, L(81) - 0.1, L(81) + 0.35), sway: 1 });
  }, { img: ['cut/spr_lantern'] });

  // ================================================================== H4 · bring your torches / the switch in sight
  const dH85 = { i: 85, x: 170, y: -612, w: 950, px: 64, style: 'serif', col: '#3A2418', emph: { 'torches': { style: 'marker', col: COL.tangerine, big: 1.2 }, 'in': { italic: true, col: COL.tangerine } }, zh: { px: 26 } };
  const dH86 = { i: 86, x: 170, y: -370, w: 950, px: 74, style: 'serif', col: '#3A2418', glow: 'rgba(255,190,90,.9)', emph: { 'light': { col: '#E8A62A', italic: true, w: 900 } }, zh: { px: 26 } };
  const dH87 = { i: 87, x: -990, y: 70, w: 1400, px: 66, style: 'serif', col: '#3A2418', emph: { 'storm': { style: 'cut', big: 1.15, cols: ['#D23A2C', '#F07A2E', '#D23A2C', '#F07A2E', '#D23A2C'] }, 'desk': { style: 'marker', col: '#2F8F8A', big: 1.2 } }, zh: { px: 26 } };
  const dH88 = { i: 88, x: -990, y: 215, w: 1400, px: 66, style: 'serif', col: '#3A2418', emph: { 'switch': { style: 'marker', col: COL.tangerine, big: 1.2 }, 'sight': { circle: COL.marker, italic: true } }, zh: { px: 26 } };
  spread('H4', 77900, -50, 2400, 1450, t => 0.75 - 0.5 * P(t, 175.4, 178), -0.008, (g, t) => {
    PA.drawCard(g, PA.card('H4', 2400, 1450, { tex: '#F2E2C8', torn: 'lr', edge: 0.3 }), 0, 0);
    K.photo(g, 'bg_door', -560, -335, 900, 600, -0.02, t, L(85) - 0.35, { mode: 'drop', kb: { z0: 1.0, z1: 1.12, y0: 0.45, d: 6 }, tape: 421 });
    // embers drift up out of the photograph
    for (let k = 0; k < 26; k++) { const life = mod((t - L(85)) * 0.5 + hash(k, 1), 1); if (t < L(85)) break; const x = -900 + hash(k, 2) * 700 + Math.sin(t * 2 + k) * 30, y = 0 - life * 700; g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.sin(Math.PI * life) * 0.9; EP.glowDot(g, x, y, 10 + hash(k, 3) * 12, 'rgba(255,220,150,1)', 'rgba(255,140,40,.5)'); g.restore(); }
    KT.draw(g, dH85, t); KT.draw(g, dH86, t);
    // the desk with the switch, under a spotlight, tagged
    const sp = P(t, L(87) - 0.2, L(87) + 0.5);
    if (sp > 0) {
      g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.45 * sp; g.fillStyle = '#5A4630'; g.fillRect(-1200, 0, 2400, 725); g.restore();
      g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.85 * sp; EP.glowDot(g, 470, 400, 420, 'rgba(255,244,214,.95)', 'rgba(255,224,170,.35)'); g.restore();
      const on = 1;
      K.toggle(g, 470, 400, 1.35, on);
      // the tag on a string
      const tg = eOut5(P(t, Wd(88, 3) - 0.1, Wd(88, 3) + 0.3)), sw = Math.sin(t * 2.2) * 0.06;
      if (tg > 0) { g.save(); g.translate(550, 300); g.rotate(-0.4 + sw); g.strokeStyle = '#8A7A60'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(150 * tg, 60 * tg); g.stroke(); g.translate(150 * tg, 60 * tg); g.rotate(0.5); g.scale(tg, tg); g.fillStyle = '#FFF6E0'; g.beginPath(); g.moveTo(0, -36); g.lineTo(220, -36); g.lineTo(250, 0); g.lineTo(220, 36); g.lineTo(0, 36); g.closePath(); g.fill(); g.strokeStyle = '#B8A07A'; g.lineWidth = 3; g.stroke(); g.fillStyle = '#B8A07A'; g.beginPath(); g.arc(14, 0, 8, 0, 7); g.fill(); EP.txt(g, 'the switch', 128, 14, { font: EP.font(700, 44, F.hand), color: '#C8261D' }); g.restore(); }
    }
    KT.draw(g, dH87, t); KT.draw(g, dH88, t);
    STK.draw(g, 'spr_point', 40, 728, 640, { t, peel: P(t, L(87) - 0.1, L(87) + 0.35), sway: 0.9 });
  }, { img: ['bg_door', 'cut/spr_point'] });

  // ================================================================== camera, impacts, light
  WD.keys.push(
    { t: 154.0, s: 'H1', dx: -420, dy: -290, z: 1.0, d: 0.5, drift: { z: 0.012 } },
    { t: 156.25, s: 'H1', dx: 640, dy: -260, z: 1.0, d: 0.45, drift: { z: 0.01 } },
    { t: 157.65, s: 'H1', dx: -560, dy: 380, z: 1.0, d: 0.45, drift: { z: 0.01 } },
    { t: 159.7, s: 'H1', dx: 460, dy: 380, z: 1.0, d: 0.45, drift: { z: 0.01 } },
    { t: 161.12, s: 'H2', dx: -640, dy: 0, z: 0.86, d: 0.5, drift: { z: 0.012 } },
    { t: 163.2, s: 'H2', dx: 440, dy: -330, z: 1.05, d: 0.45, drift: { z: 0.01 } },
    { t: 164.72, s: 'H2', dx: 440, dy: 330, z: 1.05, d: 0.45, drift: { z: 0.01 } },
    { t: 168.0, s: 'H3', dx: 0, dy: -32, z: 0.79, d: 0.5, drift: { z: 0.008 } },
    { t: 175.1, s: 'H4', dx: 0, dy: -300, z: 0.95, d: 0.5, drift: { z: 0.01 } },
    { t: 178.55, s: 'H4', dx: 0, dy: 300, z: 0.95, d: 0.55, drift: { z: 0.012 } },
  );
  WD.shakes.push([Wd(73, 3) + 0.1, 0.35], [Wd(73, 5) + 0.1, 0.3], [TEARCAL + 0.1, 0.3], [FLIPC + 0.6, 0.35], [Wd(84, 5) + 0.1, 0.3], [Wd(87, 1) + 0.1, 0.4]);
  WD.blooms.push([175.2, 182.2, 0.32, 1.0, 0.5], [168.0, 171.0, 0.2, 0.3, 0.5]);
})();
