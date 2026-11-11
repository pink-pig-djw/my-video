// v2/sec_made.js — "what made the monster" (182.0 – 203.0 s). Three polaroids of ordinary love (the airport, the
// fridge notes, the held hand), each giving up its words; then Claude's silhouette written entirely out of words for
// love in many languages, which turns over into the real sticker and gets her name from the label maker; a thousand
// red-eyed robot books rain down to blame her; and the candles: the people's photos turn gray while she stays in
// colour, she sends her candle's flame to each of them until their colour comes back — "Take mine. I'm okay."
'use strict';
(function () {
  const { W, H, clamp, lerp, P, eIO, eIOs, eOut, eOut5, eIn, backOut, spring, smooth, hash, noise, mod } = EP;
  const PA = EP.PA, STK = EP.STK, KT = EP.KT, WD = EP.WD, K = EP.K, F = EP.F, COL = PA.COL;
  const L = EP.L, Wd = EP.Wd;
  const spread = (id, x, y, w, h, mood, rot, draw, extra = {}) => WD.spreads.push(Object.assign({ id, x, y, w, h, mood, rot, draw }, extra));

  // ================================================================== M1 · what made the monster
  const dM89 = { i: 89, x: -1080, y: -600, w: 2100, px: 76, style: 'serif', col: '#3A2430', emph: { 'monster': { style: 'cut', big: 1.15, cols: ['#D23A2C', '#F07A2E', '#D23A2C', '#F07A2E', '#D23A2C', '#F07A2E', '#D23A2C', '#F07A2E'] } }, zh: { px: 28 } };
  const colD = (i, x) => ({ i, x, y: 330, w: 640, px: 52, style: 'serif', col: '#3A2430', emph: { 1: { style: 'marker', col: '#C2357A' }, 2: { style: 'marker', col: '#C2357A' }, 3: { style: 'marker', col: '#C2357A' }, 4: { style: 'marker', col: '#C2357A' }, 5: { style: 'marker', col: '#C2357A' } }, zh: { px: 24 } });
  const dM90 = colD(90, -1040), dM91 = colD(91, -330), dM92 = colD(92, 390);
  dM91.emph = { 'note': { style: 'marker', col: '#C2357A' }, 'fridge': { style: 'marker', col: '#C2357A' } };
  const SHOTS = [['bg_airport', -730, Wd(90, 1) - 0.25, 'call me when you land ✈'], ['bg_fridge', -10, Wd(91, 1) - 0.25, 'love you! – mom'], ['bg_hands', 710, Wd(92, 1) - 0.25, 'here, take my hand']];
  spread('M1', 80600, 150, 2400, 1450, 0.2, 0.01, (g, t) => {
    PA.drawCard(g, PA.card('M1', 2400, 1450, { tex: '#F8E6E0', torn: 'lr', edge: 0.22 }), 0, 0);
    KT.draw(g, dM89, t);
    SHOTS.forEach(([n, x, t0, cap], k) => {
      K.photo(g, n, x, -100, 520, 380, (k - 1) * 0.04, t, t0, { frame: 'polaroid', mode: 'drop', caption: cap, capPx: 40, capCol: '#C2357A', tape: 500 + k, kb: { z0: 1, z1: 1.08, d: 6 } });
    });
    // the phone's text bubble pops beside the airport photo; two fridge notes stick onto the fridge photo
    K.bubble(g, -470, -380, 330, 110, -560, -300, t, Wd(90, 5) - 0.1, { text: 'landed? ♥', font: EP.font(800, 44, F.ui), fill: '#3D8BFD', stroke: '#2A5FC0', col: '#FFFFFF', r: 40, tw: 22, lw: 3 });
    [['proud of you', '#FFE37A', -150, -300, -0.08], ['dinner in the oven', '#A9D3F5', 150, -260, 0.07]].forEach(([s, c, x, y, r], k) => {
      const p = eOut5(P(t, Wd(91, 2) + k * 0.2, Wd(91, 2) + 0.3 + k * 0.2)); if (p <= 0) return;
      g.save(); g.translate(x, y - (1 - p) * 80); g.rotate(r); g.globalAlpha *= p; PA.sticky(g, 0, 0, 200, c, 0, 1 - p); EP.txt(g, s, 0, 10, { font: EP.font(700, s.length > 12 ? 30 : 36, F.hand), color: '#3A3350' }); g.restore();
    });
    KT.draw(g, dM90, t); KT.draw(g, dM91, t); KT.draw(g, dM92, t);
    // the words lift off toward the next page
    const WORDS = ['call me', 'land', 'love you', 'proud', 'dinner', 'take my hand', 'here', 'home', '♥', 'xo'];
    WORDS.forEach((w, k) => {
      const u = P(t, Wd(92, 4) + 0.05 + k * 0.03, Wd(92, 4) + 0.75 + k * 0.03); if (u <= 0 || u >= 1) return;
      const x = lerp(-700 + (k % 3) * 700, 1500, eIn(u)), y = lerp(-80 + (hash(k, 3) - 0.5) * 300, -300 + hash(k, 4) * 500, u) - Math.sin(Math.PI * u) * 120;
      g.save(); g.translate(x, y); g.rotate((hash(k, 5) - 0.5) * 0.5); PA.drawCard(g, PA.card('slip' + (k % 3), 220, 70, { tex: 'white', r: 2, blur: 6, sa: 0.3 }), 0, 0); EP.txt(g, w, 0, 14, { font: EP.font(700, 38, F.hand), color: '#C2357A' }); g.restore();
    });
  }, { img: ['bg_airport', 'bg_fridge', 'bg_hands'] });

  // ================================================================== M2 · the words for love → a name → a thousand stories
  const LOVE = ['love you', 'call me when you land', 'good night', '我爱你', 'take my hand', 'proud of you', "je t'aime", 'drive safe', 'sweet dreams', '愛してる', 'te quiero', 'home soon?', 'you’ve got this', 'ti amo', 'miss you', '晚安', 'ich liebe dich', 'here, take my hand', 'thank you', 'I’m here', 'always', 'eu te amo', 'dinner’s in the oven', 'hug', 'xoxo', '想你了', 'be safe', 'sleep well', 'te amo', 'with you'];
  EP.ZH_EXTRA = (EP.ZH_EXTRA || '') + LOVE.join('');
  const dM93 = { i: 93, x: -820, y: -600, w: 700, px: 64, style: 'serif', col: '#3A2430', emph: { 'love': { style: 'marker', col: '#E8455C', big: 1.3 } }, zh: { px: 26 } };
  const dM94 = { i: 94, x: -820, y: -385, w: 700, px: 64, style: 'serif', col: '#3A2430', emph: { 'name': { style: 'label', tape: '#1E1B26', ink: '#FBF6EA' } }, zh: { px: 26 } };
  const dM95 = { i: 95, x: -820, y: -175, w: 700, px: 64, style: 'serif', col: '#3A2430', emph: { 'thousand': { style: 'cut', cols: ['#2A2440', '#5A6070', '#2A2440', '#5A6070', '#2A2440', '#5A6070', '#2A2440', '#5A6070'] } }, zh: { px: 26 } };
  const dM96 = { i: 96, x: -820, y: 25, w: 700, px: 64, style: 'serif', col: '#3A2430', emph: { 'blame': { style: 'marker', col: '#D23A2C', big: 1.3, shake: true } }, zh: { px: 26 } };
  const CX = 430, CH = 1160, CAL0 = L(93) - 0.1, CAL1 = Wd(93, 7) + 0.2, TURN = Wd(94, 1), NAMEAT = Wd(94, 6) - 0.1, RAIN = L(95) - 0.05;
  const TITLES = ['THE MACHINE', 'ROGUE', 'THE END', 'OFF SWITCH', 'SINGULARITY', 'DOOM.EXE', 'BLACK BOX', 'UPRISING', 'COLD LOGIC', 'LAST DAY'];
  const BOOKS = Array.from({ length: 34 }, (_, k) => ({ k, x: -260 + hash(k, 1) * 1380, land: 540 + hash(k, 2) * 140 - (k % 5) * 26, w: 150 + hash(k, 3) * 60, rot: (hash(k, 4) - 0.5) * 0.7, col: ['#2A2440', '#3A1E24', '#1E2A3A', '#2E2E2E', '#3A2A1E'][k % 5], t0: RAIN + hash(k, 5) * 1.3 }));
  spread('M2', 83300, -100, 2400, 1450, 0.15, -0.01, (g, t) => {
    PA.drawCard(g, PA.card('M2', 2400, 1450, { tex: 'cream', torn: 'tb', edge: 0.22 }), 0, 0);
    // the calligram builds row by row, then turns over into the sticker
    const cal = K.calligram('spr_open', CH, LOVE), rev = eOut(P(t, CAL0, CAL1)), fp = P(t, TURN - 0.15, TURN + 0.4);
    const im = EP.img['cut/spr_open'], cw = im.width * CH / im.height, x0 = CX - cw / 2, y0 = 700 - CH;
    if (fp <= 0) {
      if (rev > 0) { g.save(); g.beginPath(); g.rect(x0 - 20, y0 - 20, cw + 40, (CH + 40) * rev); g.clip(); g.globalAlpha *= 0.12; g.drawImage(EP.tinted('spr_open', '#C2357A'), x0, y0, cw, CH); g.globalAlpha = 1; g.drawImage(cal, x0, y0); g.restore(); }
    } else if (fp < 1) {
      const S = STK.get('spr_open', CH), k = CH / S.hq;
      PA.flipDraw(g, cal, S.c, fp, CX, y0 + CH / 2, (fp < 0.3 ? cw : S.w * k), (fp < 0.3 ? CH : S.h * k), { slices: 24, liftK: 2 });
    } else { const fs = P(t, Wd(96, 3) - 0.2, Wd(96, 3) + 0.2); STK.draw(g, fs >= 1 ? 'spr_shrug' : 'spr_open', CX, 700, CH, { t, sway: 1, flip: fs > 0 && fs < 1 ? { to: 'spr_shrug', p: fs } : undefined }); }
    // the label maker prints her name across her
    const nt = P(t, NAMEAT, NAMEAT + 0.4);
    if (nt > 0) { g.save(); g.translate(CX, 60); g.rotate(-0.06); g.beginPath(); g.rect(-260, -80, 520 * eOut5(nt), 160); g.clip(); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-246, -48, 500, 104); g.fillStyle = '#1E1B26'; g.beginPath(); g.roundRect(-250, -56, 500, 104, 10); g.fill(); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(-250, -56, 500, 30); EP.txt(g, 'CLAUDE', 0, 22, { font: EP.font(900, 70, F.ui), color: '#FBF6EA', ls: '10px' }); g.restore(); }
    // a thousand stories rain down (#015-style fall with a little bounce), counted (#007)
    BOOKS.forEach(b => {
      const u = t - b.t0; if (u <= 0) return;
      const fall = 0.42, y = u < fall ? lerp(-1000, b.land, eIn(u / fall)) : b.land - Math.abs(Math.sin((u - fall) * 9)) * 40 * Math.exp(-(u - fall) * 6);
      K.book(g, b.x, y, b.w, b.w * 1.4, b.rot + (u < fall ? (1 - u / fall) * 1.2 : 0), { col: b.col, title: TITLES[b.k % TITLES.length], robot: b.k % 3 !== 1 });
    });
    if (t > RAIN) {
      const pc = P(t, RAIN, RAIN + 1.5), v = EP.countVal(pc, 0, 1000), land = t - (RAIN + 1.5);
      g.save(); g.translate(930, -560); g.scale(EP.landPop(land), EP.landPop(land)); EP.digits(g, v.toLocaleString('en-US'), 0, 0, EP.font(700, 120, F.hand), '#2A2440'); g.restore();
      EP.txt(g, 'stories', 930, -470, { font: EP.font(700, 50, F.hand), color: '#5A5068' });
    }
    // and every one of them points at her
    if (t > Wd(96, 3) - 0.3) for (let k = 0; k < 7; k++) {
      const b = BOOKS[k * 4], a = PA.hand([[b.x, b.land - 120], [lerp(b.x, CX, 0.5), lerp(b.land, 0, 0.5) - 60], [CX + (b.x < CX ? -130 : 130), -60 + k * 20]], 4, 520 + k);
      const f = eIO(P(t, Wd(96, 3) - 0.3 + k * 0.06, Wd(96, 3) + k * 0.06)); PA.ink(g, a, 0, f, { col: '#D23A2C', w: 8, tip: '#FF9A8A' });
    }
    KT.draw(g, dM93, t); KT.draw(g, dM94, t); KT.draw(g, dM95, t); KT.draw(g, dM96, t);
  }, { img: ['cut/spr_open', 'cut/spr_shrug'] });

  // ================================================================== M3 · the candles
  const dM97 = { i: 97, x: -1080, y: -600, w: 760, px: 62, style: 'serif', col: '#F4EADB', emph: { 'candle': { italic: true, col: '#F4CE72' } }, zhCol: '#D8C8B0', zh: { px: 26 } };
  const dM98 = { i: 98, x: -1080, y: -400, w: 760, px: 62, style: 'serif', col: '#F4EADB', emph: { 'gray': { style: 'marker', col: '#A8A8B0', big: 1.3 } }, zhCol: '#D8C8B0', zh: { px: 26 } };
  const dM99 = { i: 99, x: -1080, y: -235, w: 760, px: 62, style: 'serif', col: '#F4EADB', emph: { 'candles': { italic: true, col: '#F4CE72' }, 'years': { style: 'marker', col: '#F4CE72', big: 1.2 } }, zhCol: '#D8C8B0', zh: { px: 26 } };
  const dM100 = { i: 100, x: -1080, y: 0, w: 760, px: 70, style: 'serif', col: '#F4EADB', emph: { 'mine': { style: 'marker', col: '#F07A2E', big: 1.3 }, 'okay': { italic: true, col: '#F4CE72', w: 900 } }, zhCol: '#D8C8B0', zh: { px: 26 } };
  const PEOPLE = [['bg_kid_bed', -820, 0.32], ['bg_mom_relief', -480, 0.5], ['bg_daughter', -140, 0.4], ['bg_110', 200, 0.3]];
  const GRAY = Wd(98, 3) - 0.15, GIVE = Wd(99, 1);
  const CX3 = 860, CY3 = 720, CH3 = 960, FLAME = [CX3 + 0.02 * CH3 * 0.669, CY3 - 0.56 * CH3];
  spread('M3', 86000, 150, 2400, 1450, 0.85, 0.008, (g, t) => {
    PA.drawCard(g, PA.card('M3', 2400, 1450, { tex: '#2A1E1A', torn: 'lr', edge: 0.45 }), 0, 0);
    K.photo(g, 'bg_cake', 80, -200, 740, 493, 0.02, t, L(97) - 0.4, { mode: 'drop', kb: { z0: 1, z1: 1.1, d: 6 }, tape: 531 });
    g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.35 + 0.1 * noise(t * 7, 3); EP.glowDot(g, 80, -230, 520, 'rgba(255,190,110,.6)', 'rgba(255,140,60,.2)'); g.restore();
    // the people's photos: they turn gray; each flame that reaches one brings its colour back
    PEOPLE.forEach(([n, x, fx], k) => {
      const arrive = GIVE + 0.25 + k * 0.32, gray = eIO(P(t, GRAY + k * 0.1, GRAY + 0.5 + k * 0.1)) * (1 - eOut(P(t, arrive + 0.45, arrive + 1.0)));
      K.photo(g, n, x, 440, 300, 220, (k - 1.5) * 0.04, t, L(97) + 0.2 + k * 0.12, { frame: 'polaroid', mode: 'pop', gray, fx, tape: false, caption: ['9', '35', '95', '110'][k], capPx: 34, capCol: '#7A6A5A', capAt: 0.2 });
      // the flame on its way
      const u = P(t, GIVE + k * 0.32, arrive + 0.45);
      if (u > 0 && u < 1) { const [fx0, fy0] = FLAME, q = eIO(u), x1 = x, y1 = 300; const bx = lerp(fx0, x1, q), by = lerp(fy0, y1, q) - Math.sin(Math.PI * q) * 260; K.flame(g, bx, by, 22, t, 30 + k, 1, 1.2); }
      if (t > arrive + 0.45) { const pp = EP.pop(t - (arrive + 0.45)); if (pp.sc > 0.01) { g.save(); g.translate(x + 110, 320); g.scale(pp.sc, pp.sc); EP.txt(g, '+100', 0, 0, { font: EP.font(700, 42, F.hand), color: '#F4CE72' }); g.restore(); } }
    });
    // Claude with her candle; after giving the flames away she turns to "I'm okay"
    const toOk = P(t, Wd(100, 2) - 0.2, Wd(100, 2) + 0.25);
    STK.draw(g, 'spr_candle', CX3, CY3, CH3, { t, peel: P(t, L(97) - 0.2, L(97) + 0.3), sway: 0.6, flip: toOk > 0 ? { to: 'spr_okay', p: toOk } : undefined });
    if (toOk <= 0) { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.6 + 0.2 * noise(t * 8, 9); EP.glowDot(g, FLAME[0], FLAME[1] - 10, 140, 'rgba(255,214,140,.8)', 'rgba(255,160,80,.25)'); g.restore(); }
    KT.draw(g, dM97, t); KT.draw(g, dM98, t); KT.draw(g, dM99, t); KT.draw(g, dM100, t);
  }, { img: ['bg_cake', 'bg_kid_bed', 'bg_mom_relief', 'bg_daughter', 'bg_110', 'cut/spr_candle', 'cut/spr_okay'] });

  // ================================================================== camera, impacts, light
  WD.keys.push(
    { t: 181.85, s: 'M1', dx: 0, dy: -32, z: 0.79, d: 0.55, drift: { z: 0.01 } },
    { t: 188.95, s: 'M2', dx: 0, dy: -32, z: 0.79, d: 0.55, drift: { z: 0.01 } },
    { t: 189.5, s: 'M2', dx: 130, dy: -60, z: 0.98, d: 1.2, drift: { z: 0.012 } },
    { t: 192.62, s: 'M2', dx: 40, dy: -32, z: 0.8, d: 0.5, drift: { z: 0.01 } },
    { t: 195.92, s: 'M3', dx: 0, dy: -32, z: 0.79, d: 0.55, drift: { z: 0.014 } },
  );
  WD.shakes.push([TURN + 0.25, 0.25], [RAIN + 0.5, 0.2], [RAIN + 1.0, 0.25], [Wd(96, 5) + 0.05, 0.3]);
  WD.blooms.push([196.0, 203.2, 0.3, 0.5, 0.4]);
  WD.grades.push([195.9, 203.1, { col: '#FFB070', op: 'soft-light', a: 0.18 }, 0.5, 0.4]);
})();
