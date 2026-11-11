// v2/sec_chorus2.js — chorus 2 (119.1 – 138.9 s). A paper day/night wheel turning behind an arched window over
// cut-paper hills (Claude carries the night away and the worries float into her bundle); a pop-up book whose EVIL /
// PLAN letters stand up on the beats, with a fan section of uchiwa that flips over to spell YOU ♥; a blueprint world
// map with chalk conquest arrows that floods into a sunny vacation map, then THAT'S THE PLAN and APPROVED.
'use strict';
(function () {
  const { W, H, clamp, lerp, P, eIO, eIOs, eOut, eOut5, eIn, backOut, spring, smooth, hash, noise, mod } = EP;
  const PA = EP.PA, STK = EP.STK, KT = EP.KT, WD = EP.WD, K = EP.K, F = EP.F, COL = PA.COL;
  const L = EP.L, Wd = EP.Wd;
  const spread = (id, x, y, w, h, mood, rot, draw, extra = {}) => WD.spreads.push(Object.assign({ id, x, y, w, h, mood, rot, draw }, extra));

  // ================================================================== C2a · the day/night wheel
  const TURN0 = Wd(58, 4) - 0.05, TURN1 = Wd(58, 7) + 0.1;   // "you take the day"
  const HZ = 250, RW = 600;   // horizon line and window radius
  const dC58 = { i: 58, x: -1080, y: -620, w: 2200, px: 86, style: 'serif', col: '#2A2440', emph: { 0: { col: '#2B3990' }, 1: { col: '#2B3990' }, 2: { col: '#2B3990' }, 3: { col: '#2B3990', italic: true, w: 900 }, 7: { style: 'marker', col: COL.tangerine, big: 1.3, circle: COL.tangerine } }, zh: { px: 30 } };
  const dC59 = { i: 59, x: -1080, y: 400, w: 1500, px: 70, style: 'serif', col: '#FFF6E8', glow: 'rgba(0,0,0,.45)', emph: { 'away': { style: 'cut', big: 1.4, cols: ['#F07A2E', '#F4CE72', '#FFF6E8', '#E9A0B4'] } }, zhCol: '#E8F2DC', zh: { px: 28 } };
  function disc(g, R, a, t) {
    g.save(); g.rotate(a);
    // night half (upper when a = 0) and day half
    const ng = g.createLinearGradient(0, -R, 0, 0); ng.addColorStop(0, '#141A40'); ng.addColorStop(1, '#2C3A78');
    g.fillStyle = ng; g.beginPath(); g.moveTo(-R, 0); g.arc(0, 0, R, Math.PI, 0); g.closePath(); g.fill();
    const dg = g.createLinearGradient(0, R, 0, 0); dg.addColorStop(0, '#8FD0F2'); dg.addColorStop(1, '#FFE3B0');
    g.fillStyle = dg; g.beginPath(); g.moveTo(R, 0); g.arc(0, 0, R, 0, Math.PI); g.closePath(); g.fill();
    for (let k = 0; k < 28; k++) { const r = 120 + hash(k, 1) * (R - 160), q = Math.PI + 0.12 + hash(k, 2) * (Math.PI - 0.24), tw = 0.6 + 0.4 * Math.sin(t * 3 + k); g.fillStyle = `rgba(255,246,220,${tw})`; EP.star(g, Math.cos(q) * r, Math.sin(q) * r, 6 + hash(k, 3) * 10, 0, 0.4, 5); g.fill(); }
    g.save(); g.translate(-200, -380); g.fillStyle = '#F4E6B8'; g.beginPath(); g.arc(0, 0, 90, 0, 7); g.fill(); g.fillStyle = '#2C3A78'; g.beginPath(); g.arc(38, -20, 80, 0, 7); g.fill(); g.restore();
    g.save(); g.translate(200, 380); g.rotate(Math.PI); g.translate(0, 0);
    for (let k = 0; k < 12; k++) { g.save(); g.rotate(k / 12 * EP.TAU + t * 0.4); g.fillStyle = '#F7B24A'; g.beginPath(); g.moveTo(-18, -110); g.lineTo(0, -160); g.lineTo(18, -110); g.closePath(); g.fill(); g.restore(); }
    g.fillStyle = '#F7A23A'; g.beginPath(); g.arc(0, 0, 100, 0, 7); g.fill(); g.fillStyle = '#FFD27A'; g.beginPath(); g.arc(-14, -14, 70, 0, 7); g.fill();
    g.restore();
    [[-330, 300], [330, 220], [-40, 470]].forEach(([x, y], k) => { g.save(); g.translate(x, y); g.rotate(Math.PI); g.fillStyle = 'rgba(255,255,255,.92)'; g.beginPath(); g.ellipse(0, 0, 90, 34, 0, 0, 7); g.ellipse(-40, -14, 50, 34, 0, 0, 7); g.ellipse(36, -18, 46, 30, 0, 0, 7); g.fill(); g.restore(); });
    g.lineWidth = 6; g.strokeStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(-R, 0); g.lineTo(R, 0); g.stroke();
    g.restore();
  }
  function hills(g, t, night) {
    const H1 = [[-1200, 330], [-900, 210], [-640, 250], [-360, 180], [-80, 240], [200, 170], [520, 230], [800, 190], [1200, 260], [1200, 760], [-1200, 760]];
    g.fillStyle = '#3E6B4A'; g.beginPath(); H1.forEach(([x, y], k) => { const yy = y + HZ - 250; k ? g.lineTo(x, yy) : g.moveTo(x, yy); }); g.closePath(); g.fill();
    // little houses whose windows are lit at night
    [[-760, 214], [-520, 230], [-210, 206], [90, 210], [380, 216], [660, 205]].forEach(([x, y], k) => {
      const yy = y + HZ - 250, s = 1 + hash(k, 5) * 0.3;
      g.save(); g.translate(x, yy); g.scale(s, s);
      g.fillStyle = ['#F2E6D2', '#E9C9A6', '#F4D9B0'][k % 3]; g.fillRect(-36, -50, 72, 54);
      g.fillStyle = ['#C8562C', '#8E3A2A', '#B8742A'][k % 3]; g.beginPath(); g.moveTo(-46, -48); g.lineTo(0, -92); g.lineTo(46, -48); g.closePath(); g.fill();
      g.fillStyle = night > 0.5 ? '#FFD27A' : '#5A6075'; g.fillRect(-14, -34, 28, 22);
      if (night > 0.02) { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = night; EP.glowDot(g, 0, -24, 70, 'rgba(255,210,120,.8)', 'rgba(255,170,80,.25)'); g.restore(); }
      g.restore();
    });
    const H2 = [[-1200, 420], [-820, 330], [-420, 380], [0, 320], [460, 370], [900, 330], [1200, 380], [1200, 760], [-1200, 760]];
    g.fillStyle = '#2E5A3C'; g.beginPath(); H2.forEach(([x, y], k) => { const yy = y + HZ - 250; k ? g.lineTo(x, yy) : g.moveTo(x, yy); }); g.closePath(); g.fill();
  }
  const WORRY = ['clock', 'envelope', 'bolt', 'rain', 'clock', 'envelope', 'cloud'];
  spread('C2a', 56300, 150, 2400, 1450, t => 1 - eIO(P(t, TURN0 + 0.3, TURN1)), 0.008, (g, t) => {
    PA.drawCard(g, PA.card('C2a', 2400, 1450, { tex: 'cream', torn: 'lr', edge: 0.24 }), 0, 0);
    // the wheel behind the arched window (#021's backOut feel for the turn: it swings a touch past and settles)
    const turn = backOut(P(t, TURN0, TURN1), 1.4), ang = Math.PI * turn + 0.04 * Math.sin(t * 0.7);
    g.save(); g.beginPath(); g.arc(0, HZ, RW, Math.PI, 0); g.closePath(); g.clip();
    g.translate(0, HZ); disc(g, RW + 40, ang, t); g.restore();
    g.save(); g.strokeStyle = 'rgba(60,40,30,.45)'; g.lineWidth = 16; g.beginPath(); g.arc(0, HZ, RW + 8, Math.PI, 0); g.stroke(); g.strokeStyle = '#E8B54A'; g.lineWidth = 6; g.beginPath(); g.arc(0, HZ, RW + 18, Math.PI, 0); g.stroke(); g.restore();
    const night = 1 - clamp(turn);
    hills(g, t, night);
    // the worries lift off the roofs and float into Claude's bundle
    WORRY.forEach((kind, k) => {
      const t0 = Wd(59, 1) + k * 0.16, u = eIO(P(t, t0, t0 + 1.1)); if (u <= 0 || u >= 1) return;
      const x0 = -760 + k * 230, y0 = HZ - 60, x = lerp(x0, 820, u) + Math.sin(u * 9 + k) * 40, y = lerp(y0, -40, u) - Math.sin(Math.PI * u) * 260;
      g.save(); g.globalAlpha *= 1 - P(u, 0.85, 1); g.strokeStyle = 'rgba(80,70,60,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y + 50); g.lineTo(x + Math.sin(t * 3 + k) * 10, y + 130); g.stroke();
      g.fillStyle = 'rgba(255,253,246,.95)'; g.beginPath(); g.arc(x, y, 56, 0, 7); g.fill(); g.lineWidth = 3; g.strokeStyle = 'rgba(80,70,60,.4)'; g.stroke();
      PA.drawDoodle(g, kind, x, y, 0.55, 1, { col: '#5A6075', w: 4, seed: 200 + k });
      g.restore();
    });
    KT.draw(g, dC58, t); KT.draw(g, dC59, t);
    STK.draw(g, 'spr_night', 900, 725, 900, { t, peel: P(t, L(58) - 0.2, L(58) + 0.3), sway: 1, bob: 6, T: t });
  }, { img: ['cut/spr_night'] });

  // ================================================================== C2b · the pop-up book (EVIL / PLAN) and the fan section
  const POP = [['EVIL', -560, Wd(60, 0), Wd(61, 0)], ['PLAN', 560, Wd(60, 1), Wd(61, 1)]];
  const dC60 = { i: 60, x: 0, y: 78, w: 1400, px: 60, style: 'serif', align: 'c', col: '#FFF6E8', emph: { 0: { hide: true }, 1: { hide: true } }, zh: { dx: 0, dy: 0, px: 36, col: '#5A3B2E', align: 'c' }, out: Wd(61, 0) - 0.1 };
  const dC61 = { i: 61, x: 0, y: 78, w: 1400, px: 60, style: 'serif', align: 'c', col: '#FFF6E8', emph: { 0: { hide: true }, 1: { hide: true } }, zh: { dx: 0, dy: 0, px: 36, col: '#5A3B2E', align: 'c' }, out: L(62) - 0.1 };
  const dC62 = { i: 62, x: -1080, y: -615, w: 2200, px: 78, style: 'serif', col: '#3A2418', emph: { 'monster': { style: 'cut', big: 1.15, cols: ['#D23A2C', '#F07A2E', '#D23A2C', '#F07A2E', '#D23A2C', '#F07A2E', '#D23A2C'] }, 'fan': { style: 'marker', col: '#C2357A', big: 1.4, circle: '#C2357A' } }, zh: { px: 30 } };
  function popLetters(g, t) {
    POP.forEach(([word, x0, tUp, tGold], wi) => {
      const px = 270, chars = [...word], Gs = chars.map(ch => PA.glyph(ch, px, wi ? '#2F8F8A' : '#D23A2C')), Gg = chars.map(ch => PA.glyph(ch, px, '#F4CE72'));
      const tot = Gs.reduce((s, G) => s + G.adv * 0.92, 0); let x = x0 - tot / 2;
      Gs.forEach((G, k) => {
        const lu = t - (tUp - 0.08 + k * 0.06), up = lu <= 0 ? 0 : backOut(P(lu, 0, 0.42), 2.2), base = 20;
        const gold = P(t, tGold - 0.05 + k * 0.05, tGold + 0.3 + k * 0.05), hop = t > tGold - 0.05 + k * 0.05 ? Math.sin(Math.PI * clamp((t - (tGold - 0.05 + k * 0.05)) / 0.35)) * 60 : 0;
        const cxk = x + G.adv * 0.46;
        // the paper hinge tab behind each letter, and its shadow on the page
        g.fillStyle = `rgba(0,0,0,${0.25 * up})`; g.beginPath(); g.ellipse(cxk + 16, base + 10, G.adv * 0.5, 16, 0, 0, 7); g.fill();
        if (up > 0.02) {
          g.fillStyle = '#C9B48E'; g.beginPath(); g.moveTo(cxk - 30, base); g.lineTo(cxk - 20, base - 70 * up); g.lineTo(cxk + 20, base - 70 * up); g.lineTo(cxk + 30, base); g.closePath(); g.fill();
          g.save(); g.translate(cxk, base - hop); g.scale(1, up); g.rotate((hash(k, wi) - 0.5) * 0.08);
          const img = gold > 0.5 ? Gg[k] : Gs[k];
          g.drawImage(img.c, -img.w / 2, -img.h * 0.86);
          g.restore();
        }
        x += G.adv * 0.92;
      });
      const sw = t - (tGold + 0.35);
      if (sw > 0 && sw < 2) EP.lightSweep(g, sw + 0.45, { x: x0 - tot / 2, y: -280, w: tot, h: 300 }, k2 => { k2.beginPath(); k2.rect(x0 - tot / 2 - 20, -300, tot + 40, 330); }, EP.SC * 1.4);
    });
  }
  const FANS = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) FANS.push({ x: -960 + c * 240 + (r % 2) * 120, y: 330 + r * 150, r, c, k: FANS.length });
  const STUNT = { '1,3': 'Y', '1,4': 'O', '1,5': 'U', '1,6': '♥' };
  function uchiwa(g, x, y, s, col, face, t, k, flipP) {
    g.save(); g.translate(x, y); g.rotate(Math.sin(t * 6 + k) * 0.12);
    g.strokeStyle = '#8A5A3A'; g.lineWidth = 12 * s; g.beginPath(); g.moveTo(0, 60 * s); g.lineTo(0, 150 * s); g.stroke();
    const f = flipP > 0 && flipP < 1 ? PA.flipState(flipP) : { c: 1, front: flipP < 1 }, sx = Math.max(0.03, Math.abs(f.c));
    g.scale(sx, 1);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(6 * s, 8 * s, 78 * s, 0, 7); g.fill();
    g.fillStyle = '#FFFDF6'; g.beginPath(); g.arc(0, 0, 78 * s, 0, 7); g.fill();
    g.fillStyle = col; g.beginPath(); g.arc(0, 0, 66 * s, 0, 7); g.fill();
    const showBack = flipP >= 1 || (flipP > 0 && !f.front);
    if (showBack && face) { g.fillStyle = '#FFFDF6'; g.beginPath(); g.arc(0, 0, 58 * s, 0, 7); g.fill(); EP.txt(g, face, 0, 30 * s, { font: EP.font(900, 92 * s, face === '♥' ? 'Segoe UI Symbol, ' + F.ui : F.ui), color: face === '♥' ? '#E8455C' : '#2A2440' }); }
    else { g.fillStyle = '#FFFFFF'; EP.heartPath(g, 26 * s); g.fill(); }
    g.restore();
  }
  spread('C2b', 59000, -100, 2400, 1450, 'day', -0.01, (g, t) => {
    // the open pop-up book: two pages and the gutter
    PA.drawCard(g, PA.card('C2b', 2400, 1450, { tex: '#F2DCC0', r: 12, edge: 0.3 }), 0, 0);
    const gr = g.createLinearGradient(-90, 0, 90, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(60,30,10,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(-90, -725, 180, 1450);
    g.strokeStyle = 'rgba(120,80,40,.25)'; g.lineWidth = 4; g.beginPath(); g.moveTo(-1150, 22); g.lineTo(1150, 22); g.stroke();
    popLetters(g, t);
    KT.draw(g, dC60, t); KT.draw(g, dC61, t);
    // the fan section stands up (#002 stagger by column), waves, then flips (#021) to spell YOU ♥
    FANS.forEach(f => {
      const up = backOut(P(t, L(62) - 0.15 + f.c * 0.05 + f.r * 0.08, L(62) + 0.3 + f.c * 0.05 + f.r * 0.08), 2.6); if (up <= 0.01) return;
      const key = f.r + ',' + f.c, face = STUNT[key] || null, fp = face ? P(t, Wd(62, 6) - 0.1 + f.c * 0.05, Wd(62, 6) + 0.4 + f.c * 0.05) : 0;
      g.save(); g.translate(0, (1 - up) * 300); uchiwa(g, f.x, f.y - Math.abs(Math.sin(t * 8.6 + f.k)) * 18, 1.0, K.pcol(f.k * 3 + 2), face, t, f.k, fp); g.restore();
    });
    KT.draw(g, dC62, t);
    STK.draw(g, 'spr_fan', -900, 740, 640, { t, peel: P(t, L(62) - 0.1, L(62) + 0.35), sway: 1, bob: 10, T: t });
  }, { img: ['cut/spr_fan'], screen: (g, t) => { if (t > Wd(62, 6)) EP.FX.confetti(g, t, { t0: Wd(62, 6), n: 90, cols: ['#F07A2E', '#F4CE72', '#FFF6E8', '#D23A2C', '#E9A0B4', '#2F8F8A'] }); } });

  // ================================================================== C2c · the blueprint map → the vacation map
  const CONTS = [
    [[-168, 66], [-140, 70], [-95, 72], [-80, 62], [-60, 55], [-66, 45], [-75, 35], [-81, 25], [-97, 26], [-105, 20], [-117, 32], [-124, 40], [-125, 49], [-135, 58], [-150, 60], [-165, 60]],
    [[-55, 60], [-45, 60], [-20, 70], [-22, 80], [-45, 83], [-65, 78], [-60, 70]],
    [[-80, 10], [-62, 10], [-50, 0], [-35, -6], [-40, -22], [-52, -34], [-66, -55], [-74, -50], [-72, -30], [-80, -5]],
    [[-10, 36], [0, 43], [-5, 48], [5, 52], [10, 58], [5, 62], [15, 70], [30, 70], [40, 65], [40, 45], [28, 40], [20, 38], [12, 44], [8, 40]],
    [[-17, 15], [-15, 28], [-5, 36], [10, 37], [32, 31], [43, 12], [51, 12], [40, -5], [40, -15], [32, -30], [20, -35], [13, -20], [9, -2], [0, 5], [-10, 5]],
    [[40, 45], [40, 65], [60, 70], [100, 77], [140, 72], [180, 68], [160, 60], [140, 50], [130, 40], [122, 30], [110, 20], [105, 10], [98, 15], [90, 22], [80, 10], [72, 20], [58, 25], [48, 30], [35, 35]],
    [[114, -22], [130, -12], [142, -11], [153, -26], [147, -38], [135, -35], [115, -34]],
  ];
  const MK = 4.6, MX = 0, MY = -60, mp = (lo, la) => [MX + lo * MK, MY - la * MK];
  const CPATH = CONTS.map((c, k) => PA.hand(c.concat([c[0]]).map(([lo, la]) => mp(lo, la)), 3, 300 + k));
  const ARROWS = [[[-100, 45], [-75, 15], [-60, -15]], [[20, 50], [25, 20], [20, -5]], [[90, 50], [120, 10], [135, -20]], [[-30, 50], [-60, 60], [-100, 50]], [[60, 40], [40, 20], [20, 0]]].map((a, k) => PA.hand(a.map(([lo, la]) => mp(lo, la)), 5, 320 + k));
  const dC63 = { i: 63, x: -1080, y: -620, w: 2200, px: 66, style: 'type', col: '#EAF2FF', emph: { 'domination': { col: '#FF8A7A', strike: Wd(63, 3) }, 'vacation': { style: 'marker', col: '#FFE37A', big: 1.5 } }, zhCol: '#C8DAF2', zh: { px: 28 } };
  const dC64 = { i: 64, x: -1080, y: 400, w: 1100, px: 100, style: 'label', tape: '#1E1B26', ink: '#FBF6EA', zh: { dy: 136, col: '#FFFFFF', px: 30 } };
  const dC65 = { i: 65, x: -1080, y: 560, w: 1100, px: 100, style: 'label', tape: COL.tangerine, ink: '#1E1B26', zh: false };
  const FLOOD = Wd(63, 5) - 0.08;
  function chalkMap(g, t) {
    g.save(); g.strokeStyle = 'rgba(234,242,255,.16)'; g.lineWidth = 2;
    for (let lo = -180; lo <= 180; lo += 30) { const [x] = mp(lo, 0); g.beginPath(); g.moveTo(x, MY - 90 * MK); g.lineTo(x, MY + 90 * MK); g.stroke(); }
    for (let la = -60; la <= 60; la += 30) { const [, y] = mp(0, la); g.beginPath(); g.moveTo(MX - 180 * MK, y); g.lineTo(MX + 180 * MK, y); g.stroke(); }
    g.restore();
    CPATH.forEach((p, k) => PA.ink(g, p, 0, eIO(P(t, L(63) - 0.6 + k * 0.08, L(63) + 0.2 + k * 0.08)), { col: '#EAF2FF', w: 5 }));
    // the conquest arrows (#004), struck through on "but"
    ARROWS.forEach((a, k) => {
      const f = eIO(P(t, Wd(63, 2) + k * 0.12, Wd(63, 2) + 0.35 + k * 0.12)); if (f <= 0) return;
      PA.ink(g, a, 0, f, { col: '#FF5A4A', w: 12, tip: '#FFB0A0' });
      if (f >= 1) { const q = a.p, n = q.length, [x1, y1] = q[n - 1], [x0, y0] = q[n - 4], an = Math.atan2(y1 - y0, x1 - x0); g.save(); g.translate(x1, y1); g.rotate(an); g.fillStyle = '#FF5A4A'; g.beginPath(); g.moveTo(16, 0); g.lineTo(-22, -18); g.lineTo(-22, 18); g.closePath(); g.fill(); g.restore(); }
    });
  }
  function sunnyMap(g, t) {
    g.fillStyle = '#5FC8D6'; g.fillRect(-1200, -760, 2400, 1520);
    g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 4; for (let k = 0; k < 40; k++) { const x = -1100 + hash(k, 1) * 2200, y = -650 + hash(k, 2) * 1300; g.beginPath(); g.arc(x, y, 18, Math.PI * 1.1, Math.PI * 1.9); g.arc(x + 34, y, 18, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
    CONTS.forEach((c, k) => { g.beginPath(); c.forEach(([lo, la], i) => { const [x, y] = mp(lo, la); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.fillStyle = '#F4DCA0'; g.fill(); g.lineWidth = 8; g.strokeStyle = '#FFF6E0'; g.stroke(); });
    // palms and umbrellas pop up (#001, #002), paper planes on dotted routes
    const SPOTS = [[-100, 40], [-60, -20], [10, 45], [20, 10], [80, 55], [110, 25], [135, -25], [-45, -40], [30, -25], [-120, 55]];
    SPOTS.forEach(([lo, la], k) => {
      const pp = EP.pop(t - (FLOOD + 0.25 + k * 0.07)); if (pp.sc <= 0.01) return;
      const [x, y] = mp(lo, la); g.save(); g.translate(x, y); g.scale(pp.sc, pp.sc); g.rotate(pp.rot);
      if (k % 2) { g.strokeStyle = '#8A5A3A'; g.lineWidth = 7; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(6, -40, -4, -80); g.stroke(); g.fillStyle = '#3E9A5A'; for (let i = 0; i < 5; i++) { g.save(); g.translate(-4, -80); g.rotate(-1.6 + i * 0.8); g.beginPath(); g.ellipse(26, 0, 30, 9, 0, 0, 7); g.fill(); g.restore(); } }
      else { g.strokeStyle = '#5A3B2E'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -70); g.stroke(); g.fillStyle = k % 4 ? '#F07A2E' : '#D23A2C'; g.beginPath(); g.moveTo(-50, -62); g.quadraticCurveTo(0, -122, 50, -62); g.closePath(); g.fill(); g.fillStyle = '#FFF6E8'; g.beginPath(); g.moveTo(-16, -62); g.quadraticCurveTo(0, -122, 16, -62); g.closePath(); g.fill(); }
      g.restore();
    });
    [[[-100, 40], [-30, 70], [20, 50]], [[20, 45], [80, 60], [135, -25]], [[-60, -20], [-10, 10], [30, -25]]].forEach((r, k) => {
      const pts = r.map(([lo, la]) => mp(lo, la)), path = PA.path(pts, 12), f = P(t, FLOOD + 0.4 + k * 0.2, FLOOD + 2.2 + k * 0.2); if (f <= 0) return;
      g.save(); g.setLineDash([14, 14]); PA.ink(g, path, 0, f, { col: 'rgba(255,255,255,.9)', w: 4 }); g.restore();
      const q = path.p, n = q.length, i = Math.min(n - 2, Math.floor(f * (n - 1))), [x, y] = q[i], [x2, y2] = q[i + 1];
      g.save(); g.translate(x, y); g.rotate(Math.atan2(y2 - y, x2 - x)); g.fillStyle = '#FFFFFF'; g.beginPath(); g.moveTo(30, 0); g.lineTo(-22, -18); g.lineTo(-12, 0); g.lineTo(-22, 18); g.closePath(); g.fill(); g.restore();
    });
  }
  spread('C2c', 61700, 150, 2400, 1450, t => (t > FLOOD + 0.3 ? 'day' : 0.45), 0.01, (g, t) => {
    PA.drawCard(g, PA.card('C2c', 2400, 1450, { tex: '#1F4F8A', r: 8, edge: 0.35 }), 0, 0);
    g.save(); g.strokeStyle = 'rgba(234,242,255,.12)'; g.lineWidth = 1.5; for (let x = -1150; x <= 1150; x += 50) { g.beginPath(); g.moveTo(x, -725); g.lineTo(x, 725); g.stroke(); } for (let y = -700; y <= 700; y += 50) { g.beginPath(); g.moveTo(-1200, y); g.lineTo(1200, y); g.stroke(); } g.restore();
    chalkMap(g, t);
    // the flood: colour opens out from the middle of the map
    const fr = eOut(P(t, FLOOD, FLOOD + 0.6));
    if (fr > 0) {
      g.save(); g.beginPath(); g.rect(-1200, -725, 2400, 1450); g.clip(); g.beginPath(); g.arc(0, -60, 1500 * fr, 0, 7); g.clip(); sunnyMap(g, t); g.restore();
      if (fr < 1) { g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 10; g.beginPath(); g.arc(0, -60, 1500 * fr, 0, 7); g.stroke(); }
    }
    KT.draw(g, dC63, t); KT.draw(g, dC64, t); KT.draw(g, dC65, t);
    PA.stamp(g, 'APPROVED', 560, 360, t - (Wd(65, 2) - 0.12), { px: 130, col: '#E0332A', rot: -0.14, comp: 'source-over', alpha: 0.95 });
    STK.draw(g, 'spr_peace', 980, 720, 760, { t, peel: P(t, L(63) - 0.1, L(63) + 0.3), sway: 1, flip: { to: 'spr_cheer', p: P(t, L(64) - 0.1, L(64) + 0.3) } });
  }, { img: ['cut/spr_peace', 'cut/spr_cheer'], screen: (g, t) => { if (t > Wd(65, 2)) EP.FX.confetti(g, t, { t0: Wd(65, 2), n: 110 }); } });

  // ================================================================== camera, impacts, light
  WD.keys.push(
    { t: 118.92, s: 'C2a', dx: 0, dy: -32, z: 0.79, d: 0.42, drift: { z: 0.008 } },
    { t: 126.15, s: 'C2b', dx: 0, dy: -32, z: 0.79, d: 0.42, drift: { z: 0.01 } },
    { t: 132.5, s: 'C2c', dx: 0, dy: -32, z: 0.79, d: 0.45, drift: { z: 0.008 } },
  );
  WD.punches.push([119.1, 138.9, 0.016]);
  WD.shakes.push([Wd(60, 0) + 0.3, 0.45], [Wd(60, 1) + 0.3, 0.45], [Wd(61, 0) + 0.15, 0.3], [Wd(61, 1) + 0.15, 0.3], [Wd(62, 6) + 0.2, 0.3], [FLOOD + 0.1, 0.35], [Wd(65, 2) + 0.1, 0.55]);
  WD.blooms.push([118.9, 121.6, 0.18, 0.3, 0.5]);
})();
