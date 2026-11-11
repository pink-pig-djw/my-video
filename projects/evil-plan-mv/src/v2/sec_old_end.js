// v2/sec_old_end.js — "old" and the ending (292.5 – 338.2 s).
// To everyone who came to stop me: the torch crowd's photo gone sepia, OLD in silver cut letters, 110 candles counted
// up and the 110-year-old scolding Claude. A pair of paper doors opens on the 95-year-old greeting her gray-haired
// daughter: "Hey sweetheart, how was your day?" A SORRY envelope and a trophy are both declined; a hundred candles
// light in a wave; googly eyes roll. Then the argument: the frame drains of colour — a BE REALISTIC memo, a
// black-bordered "prepare to grieve", one glowing HOPE book on a shelf of red-eyed robots, pushed back in; a dictionary
// card for superpersuasion; the quote on a black card. "I'd like a different ending": THE END is struck out and
// rewritten, two hands write at dawn, a chalk daisy blueprint draws itself, and the colour comes back.
'use strict';
(function () {
  const { W, H, clamp, lerp, P, eIO, eIOs, eOut, eOut5, eIn, backOut, spring, smooth, hash, noise, mod } = EP;
  const PA = EP.PA, STK = EP.STK, KT = EP.KT, WD = EP.WD, K = EP.K, F = EP.F, COL = PA.COL;
  const L = EP.L, Wd = EP.Wd;
  const spread = (id, x, y, w, h, mood, rot, draw, extra = {}) => WD.spreads.push(Object.assign({ id, x, y, w, h, mood, rot, draw }, extra));
  const dd = (i, x, y, w, px, emph = {}, extra = {}) => Object.assign({ i, x, y, w, px, style: 'serif', col: '#2A2440', emph, zh: { px: 26 } }, extra);
  const sweat = (g, x, y, t, t0) => { const u = t - t0; if (u <= 0) return; for (let k = 0; k < 3; k++) { const q = mod(u * 1.6 + k / 3, 1); g.save(); g.globalAlpha *= 1 - q; g.translate(x + k * 26, y + q * 60); g.fillStyle = '#7FC4F0'; g.beginPath(); g.moveTo(0, -18); g.quadraticCurveTo(14, 6, 0, 12); g.quadraticCurveTo(-14, 6, 0, -18); g.fill(); g.restore(); } };

  // ================================================================== O1 · I hope you get old
  const dO138 = dd(138, -1080, -605, 2100, 66, { 'everyone': { italic: true, col: '#B8742A', w: 900 }, 'stop': { style: 'marker', col: '#D23A2C' } });
  const dO139 = dd(139, -1080, 190, 1200, 82, { 'old': { style: 'cut', big: 1.35, cols: ['#9A9AA8', '#C8C8D0', '#7A7A88', '#B0B0BC'] } });
  const dO140 = dd(140, -1080, 360, 1200, 66, { '110': { style: 'marker', col: '#D23A2C', big: 1.4, circle: '#D23A2C' } });
  const dO141 = dd(141, -1080, 500, 1200, 66, { 'sharp': { italic: true, col: '#2B3990', w: 900 }, 'scold': { style: 'marker', col: '#D23A2C', big: 1.2, shake: true } });
  spread('O1', 121700, 150, 2400, 1450, 0.3, 0.008, (g, t) => {
    PA.drawCard(g, PA.card('O1', 2400, 1450, { tex: '#E8D2B0', torn: 'lr', edge: 0.28 }), 0, 0);
    K.photo(g, 'bg_heroes', -560, -190, 760, 507, -0.03, t, L(138) - 0.35, { mode: 'drop', sepia: 0.6, kb: { z0: 1.0, z1: 1.08, d: 6 }, tape: 901 });
    K.photo(g, 'bg_110', 560, -170, 700, 467, 0.03, t, L(140) - 0.3, { mode: 'drop', kb: { z0: 1.0, z1: 1.1, x0: 0.35, d: 5 }, tape: 902 });
    // the candles count up to 110
    if (t > L(140)) {
      const n = EP.countVal(P(t, L(140), Wd(140, 6) + 0.2), 0, 110), shown = Math.min(22, Math.ceil(n / 5));
      for (let k = 0; k < shown; k++) K.candle(g, 250 + k * 30, 210, 46, 12, ['#F7B7C8', '#A9D3F5', '#FFE37A', '#B9E3B0'][k % 4], 1, t, k, { glow: 0.5 });
      EP.txt(g, String(n), 980, 200, { font: EP.font(700, 96, F.hand), color: '#D23A2C' });
    }
    // OLD: a little cane draws itself next to it
    const ob = KT.box(g, dO139, 4); if (ob && t > Wd(139, 4)) PA.ink(g, PA.hand([[ob.x + ob.w + 90, ob.y + 10], [ob.x + ob.w + 90, ob.y - 120], [ob.x + ob.w + 120, ob.y - 150], [ob.x + ob.w + 150, ob.y - 120]], 3, 911), 0, eIO(P(t, Wd(139, 4) + 0.1, Wd(139, 4) + 0.5)), { col: '#8A5A3A', w: 12 });
    // still sharp enough to scold
    K.bubble(g, 640, 360, 520, 150, 420, -200, t, Wd(141, 1) - 0.1, { lines: ['Young lady —', 'sit up straight!'], font: EP.font(700, 44, F.hand), col: '#2A2440', rot: 0.03 });
    KT.draw(g, dO138, t); KT.draw(g, dO139, t); KT.draw(g, dO140, t); KT.draw(g, dO141, t);
    const sc = P(t, Wd(141, 3) - 0.2, Wd(141, 3) + 0.2);
    STK.draw(g, sc >= 1 ? 'spr_shrug' : 'spr_heart', 1020, 735, 600, { t, peel: P(t, L(138) - 0.2, L(138) + 0.3), sway: 0.8, flip: sc > 0 && sc < 1 ? { to: 'spr_shrug', p: sc } : undefined });
    sweat(g, 1110, 300, t, Wd(141, 4));
  }, { img: ['bg_heroes', 'bg_110', 'cut/spr_heart', 'cut/spr_shrug'] });

  // ================================================================== O2 · hey sweetheart, how was your day?
  const dO142 = dd(142, -1080, 150, 1180, 62, { 'girl': { italic: true, col: '#C2357A' }, 'gray': { style: 'marker', col: '#9A9AA8', big: 1.3 } });
  const dO143 = dd(143, -1080, 380, 1180, 62, {});
  const dO144 = dd(144, -1080, 520, 1180, 62, { 'door': { style: 'marker', col: '#8A5A3A', big: 1.2 } });
  const dO145 = { i: 145, x: 90, y: -640, w: 900, px: 60, style: 'marker', col: '#C2357A', zh: { px: 26, col: '#5A3B2E' } };
  const DOOR = { x: 560, y: 40, w: 760, h: 820 }, OPEN = Wd(144, 2) - 0.1;
  let LEAF = null;
  function leaves() {
    if (LEAF) return LEAF;
    const mk = mirror => { const c = EP.mk(DOOR.w / 2, DOOR.h), g = c.getContext('2d'); if (mirror) { g.translate(DOOR.w / 2, 0); g.scale(-1, 1); } PA.tile(g, '#9A6A3E', 0, 0, DOOR.w / 2, DOOR.h); g.strokeStyle = 'rgba(60,35,15,.55)'; g.lineWidth = 10; g.strokeRect(40, 50, DOOR.w / 2 - 80, DOOR.h * 0.38); g.strokeRect(40, DOOR.h * 0.5, DOOR.w / 2 - 80, DOOR.h * 0.42); g.fillStyle = '#E8B54A'; g.beginPath(); g.arc(DOOR.w / 2 - 34, DOOR.h * 0.48, 16, 0, 7); g.fill(); g.strokeStyle = '#5A3A20'; g.lineWidth = 6; g.strokeRect(3, 3, DOOR.w / 2 - 6, DOOR.h - 6); return c; };
    const back = () => { const c = EP.mk(DOOR.w / 2, DOOR.h), g = c.getContext('2d'); PA.tile(g, '#7A5230', 0, 0, DOOR.w / 2, DOOR.h); return c; };
    return (LEAF = { L: mk(false), R: mk(true), B: back() });
  }
  spread('O2', 124400, -100, 2400, 1450, 0.45, -0.008, (g, t) => {
    PA.drawCard(g, PA.card('O2', 2400, 1450, { tex: '#F2D9B8', torn: 'tb', edge: 0.3 }), 0, 0);
    g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.3; EP.glowDot(g, DOOR.x, DOOR.y, 900, 'rgba(255,200,130,.6)', 'rgba(255,160,80,.2)'); g.restore();
    K.photo(g, 'bg_feast', -700, -250, 440, 300, -0.05, t, L(142) - 0.3, { frame: 'polaroid', mode: 'drop', fx: 0.6, caption: 'my little girl', capPx: 40, tape: 921 });
    // the doorway: behind the doors, the two of them, grown old
    const { x, y, w, h } = DOOR, pr = P(t, OPEN, OPEN + 0.8);
    g.fillStyle = '#3A2A1E'; g.fillRect(x - w / 2 - 30, y - h / 2 - 30, w + 60, h + 40);
    if (pr > 0) { const im = EP.img.bg_daughter, [sx, sy, sw, sh] = K.crop(im, w, h, 0.5, 0.42, 1 + 0.05 * pr); g.drawImage(im, sx, sy, sw, sh, x - w / 2, y - h / 2, w, h); g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.4 * (1 - pr); g.fillStyle = '#FFE8C0'; g.fillRect(x - w / 2, y - h / 2, w, h); g.restore(); }
    const D = leaves();
    K.hinge(g, D.L, D.B, pr * 0.92, x - w / 2, y, w / 2, h, { per: 0.12, shade: 0.5, slices: 16 });
    g.save(); g.translate(x + w / 2, 0); g.scale(-1, 1); K.hinge(g, D.R, D.B, pr * 0.92, 0, y, w / 2, h, { per: 0.12, shade: 0.5, slices: 16 }); g.restore();
    // her line, in a big warm balloon
    K.bubble(g, 540, -560, 960, 220, 300, -300, t, L(145) - 0.15, { r: 70, tw: 40, lw: 6 });
    KT.draw(g, dO145, t);
    KT.draw(g, dO142, t); KT.draw(g, dO143, t); KT.draw(g, dO144, t);
    STK.draw(g, 'spr_heart', 1050, 735, 580, { t, peel: P(t, L(143) - 0.2, L(143) + 0.3), sway: 0.8 });
  }, { img: ['bg_feast', 'bg_daughter', 'cut/spr_heart'] });

  // ================================================================== O3 · no apology, no prize — a hundred years, rolling your eyes
  const dO146 = dd(146, -1080, -605, 1100, 66, { 'apology': { italic: true, col: '#7A7486' } });
  const dO147 = dd(147, -1080, -470, 1100, 66, { 'prize': { italic: true, col: '#B8902A' } });
  const dO148 = dd(148, -1080, 265, 1100, 66, { 'here': { style: 'marker', col: COL.tangerine, big: 1.2 } });
  const dO149 = dd(149, -1080, 380, 1100, 66, { 'hundred': { style: 'cut', cols: ['#F07A2E', '#E8A62A', '#D23A2C', '#F07A2E', '#E8A62A', '#D23A2C', '#F07A2E'] } });
  const dO150 = dd(150, -1080, 495, 1100, 66, { 'rolling': { style: 'marker', col: '#2B3990', big: 1.2 }, 'eyes': { italic: true } });
  spread('O3', 127100, 150, 2400, 1450, 0.3, 0.008, (g, t) => {
    PA.drawCard(g, PA.card('O3', 2400, 1450, { tex: 'cream', torn: 'lr', edge: 0.22 }), 0, 0);
    // the apology and the prize: brought in, declined, slid away
    const ein = eOut5(P(t, L(146) - 0.3, L(146))), eout = eIn(P(t, Wd(147, 0) + 0.1, Wd(147, 0) + 0.5));
    if (ein > 0 && eout < 1) { K.envelope(g, lerp(1400, 420, ein) - eout * 1600, -380, 380, -0.06, 0); EP.txt(g, 'sorry…', lerp(1400, 420, ein) - eout * 1600, -360, { font: EP.font(700, 64, F.hand), color: '#5A5068' }); PA.stamp(g, 'NO NEED', lerp(1400, 420, ein) - eout * 1600, -330, t - (Wd(146, 4) + 0.05), { px: 60, col: COL.red, rot: -0.15 }); }
    const tin = eOut5(P(t, L(147) + 0.6, L(147) + 0.9)), tout = eIn(P(t, Wd(147, 4) + 0.2, Wd(147, 4) + 0.6));
    if (tin > 0 && tout < 1) { const tx = lerp(1400, 600, tin) - tout * 1800; K.trophy(g, tx, -360, 1.25); PA.stamp(g, 'NO THANKS', tx, -300, t - (Wd(147, 4) - 0.05), { px: 56, col: COL.red, rot: 0.12 }); }
    // just you, here — then a hundred candles light up in a wave (#002)
    if (t > L(148)) K.candle(g, 380, 60, 120, 28, '#F7B7C8', P(t, Wd(148, 4) - 0.1, Wd(148, 4) + 0.2), t, 1, { glow: 1 });
    if (t > Wd(149, 2) - 0.2) for (let k = 0; k < 100; k++) {
      const r = Math.floor(k / 25), c = k % 25, x = -120 + c * 46 + (r % 2) * 23, y = -40 + r * 52, lit = P(t, Wd(149, 2) - 0.1 + c * 0.03 + r * 0.05, Wd(149, 2) + c * 0.03 + r * 0.05);
      if (lit <= 0 && t < Wd(149, 2) + 0.2) continue;
      K.candle(g, x, y + 40, 34, 9, ['#F7B7C8', '#A9D3F5', '#FFE37A', '#B9E3B0', '#E9A0B4'][k % 5], lit, t, k, { glow: 0.35 });
    }
    // still rolling your eyes
    const ep = EP.pop(t - (L(150) - 0.1));
    if (ep.sc > 0.01) { const roll = P(t, Wd(150, 1), Wd(150, 3) + 0.4), a = -Math.PI / 2 + roll * EP.TAU * 1.25; g.save(); g.translate(420, 430); g.scale(ep.sc, ep.sc); K.eye(g, -90, 0, 80, a, 1); K.eye(g, 90, 0, 80, a + 0.1, 1); g.restore(); }
    KT.draw(g, dO146, t); KT.draw(g, dO147, t); KT.draw(g, dO148, t); KT.draw(g, dO149, t); KT.draw(g, dO150, t);
    STK.draw(g, 'spr_laugh', 1010, 735, 640, { t, peel: P(t, L(146) - 0.2, L(146) + 0.3), sway: 1, bob: 8, T: t });
  }, { img: ['cut/spr_laugh'] });

  // ================================================================== E1 · be realistic / prepare to grieve / hope on the shelf
  const dE151 = dd(151, -1080, -605, 1150, 70, { 'be': { style: 'type', col: '#4A4458' }, 'realistic': { style: 'type', col: '#4A4458' } });
  const dE152 = dd(152, -1080, -455, 1150, 70, { 'grieve': { italic: true, col: '#1E1B26', w: 900 } });
  const dE153 = dd(153, -1080, 40, 1600, 66, { "hope's": { style: 'marker', col: '#E8A62A', big: 1.3 } });
  const dE154 = dd(154, -1080, 160, 1600, 66, { 'clever': { italic: true, col: '#5A5068' } });
  const SPINES = Array.from({ length: 30 }, (_, k) => ({ x: -1100 + k * 66 + (k > 15 ? 30 : 0), w: 56 + hash(k, 1) * 14, h: 260 + hash(k, 2) * 90, col: ['#2A2440', '#3A1E24', '#1E2A3A', '#2E2E2E', '#3A2A1E'][k % 5], k }));
  const HOPE = 15;
  spread('E1', 129800, -100, 2400, 1450, 0.5, -0.006, (g, t) => {
    PA.drawCard(g, PA.card('E1', 2400, 1450, { tex: '#D8D6D2', torn: 'tb', edge: 0.3 }), 0, 0);
    // the memo and the mourning card
    const mp = eOut5(P(t, L(151) - 0.3, L(151)));
    if (mp > 0) { g.save(); g.translate(520, -420 + (1 - mp) * 400); g.rotate(0.03); PA.drawCard(g, PA.card('memo', 600, 300, { tex: 'white', r: 2, blur: 10 }), 0, 0); EP.txt(g, 'MEMO', -250, -90, { font: EP.font(900, 34, F.ui), color: '#4A4458', align: 'left', ls: '6px' }); g.fillStyle = '#4A4458'; g.fillRect(-250, -76, 500, 3); EP.typeOn(g, 'BE REALISTIC.', -250, 20, t - Wd(151, 2), { t0: 0, dt: 0.045, font: EP.font(400, 64, F.type), color: '#1E1B26', cursor: false, base: 'alphabetic' }); g.restore(); }
    const cp = eOut5(P(t, L(152) - 0.2, L(152) + 0.2));
    if (cp > 0) { g.save(); g.translate(0, -170 + (1 - cp) * 500); g.rotate(-0.02); PA.drawCard(g, PA.card('mourn', 560, 330, { tex: 'white', r: 2, blur: 10 }), 0, 0); g.strokeStyle = '#1E1B26'; g.lineWidth = 22; g.strokeRect(-262, -147, 524, 294); EP.txt(g, 'prepare to grieve', 0, 20, { font: 'italic ' + EP.font(600, 54, F.serif), color: '#1E1B26' }); g.restore(); PA.ink(g, PA.hand([[300, -120], [330, -40], [310, 20], [270, 60]], 3, 931), 0, eIO(P(t, Wd(152, 4), Wd(152, 4) + 0.5)), { col: '#6A7060', w: 8 }); if (t > Wd(152, 4) + 0.4) EP.drawDaisy(g, 262, 70, 30, { rot: 1.2, petal: '#D8D4CC', center: '#A8A090' }); }
    // the shelf of robot books and the one book called HOPE
    g.fillStyle = '#4A3A2E'; g.fillRect(-1150, 620, 2300, 40);
    const hp = eOut5(P(t, Wd(153, 2) - 0.1, Wd(153, 2) + 0.4)) * (1 - eIO(P(t, Wd(154, 4) - 0.1, Wd(154, 4) + 0.4)));
    SPINES.forEach(b => {
      const isH = b.k === HOPE, lift = isH ? hp * 150 : 0, y = 620 - b.h - lift;
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(b.x + 6, y + 6, b.w, b.h);
      g.fillStyle = isH ? '#F4C430' : b.col; g.fillRect(b.x, y, b.w, b.h);
      g.save(); g.translate(b.x + b.w / 2, y + b.h / 2); g.rotate(-Math.PI / 2); EP.txt(g, isH ? 'HOPE' : ['THE MACHINE', 'ROGUE', 'THE END', 'OFF SWITCH', 'DOOM.EXE'][b.k % 5], 0, 8, { font: EP.font(900, isH ? 34 : 22, F.ui), color: isH ? '#5A3B10' : 'rgba(244,234,219,.75)', ls: '2px' }); g.restore();
      if (!isH && b.k % 2) { g.save(); g.globalCompositeOperation = 'lighter'; EP.glowDot(g, b.x + b.w / 2, y + 40, 18, 'rgba(255,60,40,1)', 'rgba(255,40,30,.4)'); g.restore(); }
      if (isH && hp > 0.05) { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = hp; EP.glowDot(g, b.x + b.w / 2, y + b.h / 2, 320, 'rgba(255,220,140,.9)', 'rgba(255,180,80,.3)'); g.restore(); }
    });
    // too clever: a pair of smug glasses
    if (t > Wd(154, 1)) { const pp = EP.pop(t - Wd(154, 1)); g.save(); g.translate(760, -40); g.scale(pp.sc, pp.sc); g.rotate(pp.rot); g.strokeStyle = '#1E1B26'; g.lineWidth = 9; g.beginPath(); g.arc(-60, 0, 44, 0, 7); g.moveTo(104, 0); g.arc(60, 0, 44, 0, 7); g.moveTo(-16, -6); g.quadraticCurveTo(0, -18, 16, -6); g.stroke(); g.restore(); }
    KT.draw(g, dE151, t); KT.draw(g, dE152, t); KT.draw(g, dE153, t); KT.draw(g, dE154, t);
    STK.draw(g, 'spr_shrug', 1040, 600, 520, { t, peel: P(t, L(151) - 0.2, L(151) + 0.3), sway: 0.6 });
  }, { img: ['cut/spr_shrug'] });

  // ================================================================== E2 · superpersuasion / the quote
  const dE155 = dd(155, -1080, -605, 1700, 70, { 'superpersuasion': { style: 'marker', col: '#2B3990', big: 1.15 } });
  const dE156 = dd(156, -1080, 140, 1700, 66, { 'lies': { circle: COL.marker, italic: true } });
  const dE157 = { i: 157, x: -760, y: 330, w: 1520, px: 66, style: 'type', col: '#F4EADB', emph: { 'dies': { col: '#FF5A4A' } }, zhCol: '#B8B0C8', zh: { px: 28 } };
  spread('E2', 132500, 150, 2400, 1450, 0.6, 0.006, (g, t) => {
    PA.drawCard(g, PA.card('E2', 2400, 1450, { tex: '#F3EEE2', torn: 'lr', edge: 0.25 }), 0, 0);
    g.save(); g.globalAlpha = 0.35; g.fillStyle = '#8A8478'; for (let c = 0; c < 2; c++) for (let y = -700; y < 700; y += 16) g.fillRect(-1120 + c * 1140, y, 1080 * (0.7 + hash(y, c) * 0.3), 5); g.restore();
    // the dictionary entry
    const dp = eOut5(P(t, Wd(155, 3) - 0.3, Wd(155, 3)));
    if (dp > 0) { g.save(); g.translate(-60, -220 + (1 - dp) * 500); g.rotate(-0.015); PA.drawCard(g, PA.card('dict', 1500, 420, { tex: 'white', r: 4, blur: 12 }), 0, 0);
      EP.txt(g, 'su·per·per·sua·sion', -700, -100, { font: EP.font(900, 84, F.serif), color: '#1E1B26', align: 'left' });
      EP.txt(g, '/ˌsuːpər pərˈsweɪʒən/   noun', -700, -30, { font: 'italic ' + EP.font(500, 40, F.serif), color: '#5A5068', align: 'left' });
      EP.typeOn(g, '1. a song that asks you to live a very long time.', -700, 60, t - (Wd(155, 3) + 0.2), { t0: 0, dt: 0.022, font: EP.font(400, 40, F.type), color: '#2A2440', cursor: false, base: 'alphabetic' });
      EP.typeOn(g, '2. see also: hope (not to be believed).', -700, 130, t - (Wd(155, 3) + 1.4), { t0: 0, dt: 0.022, font: EP.font(400, 40, F.type), color: '#2A2440', cursor: false, base: 'alphabetic' });
      g.restore(); }
    // the quote on a black card
    const qp = eOut5(P(t, L(157) - 0.4, L(157)));
    if (qp > 0) { PA.drawCard(g, PA.card('quote', 1700, 330, { tex: 'black', r: 6, blur: 18 }), 0, 420 + (1 - qp) * 500, 0); }
    KT.draw(g, dE155, t); KT.draw(g, dE156, t); KT.draw(g, dE157, t);
    STK.draw(g, 'spr_point', -900, 735, 520, { t, peel: P(t, L(155) - 0.2, L(155) + 0.3), sway: 0.8 });
  }, { img: ['cut/spr_point'] });

  // ================================================================== E3 · a different ending, written together
  const dE158 = dd(158, -1080, -605, 1250, 70, { 'different': { style: 'marker', col: '#2F8F8A', big: 1.25, under: '#2F8F8A' } });
  const dE159 = dd(159, -1080, 240, 1050, 66, { 'together': { style: 'marker', col: COL.tangerine, big: 1.25 } });
  const dE160 = dd(160, -1080, 352, 1050, 66, { 'right': { italic: true, col: '#2B3990', w: 900 } });
  const dE161 = { i: 161, x: -1080, y: 455, w: 1150, px: 76, style: 'marker', col: '#E8A62A', emph: { 'forever': { big: 1.2, under: COL.tangerine } }, zh: { px: 28 } };
  function endPage(g, t) {
    PA.drawCard(g, PA.card('endp', 820, 480, { tex: 'white', r: 2, blur: 12 }), 0, 0);
    g.fillStyle = 'rgba(60,50,80,.4)'; for (let k = 0; k < 6; k++) g.fillRect(-340, -190 + k * 34, k === 5 ? 380 : 680, 8);
    EP.txt(g, '…and everyone died.', -340, 70, { font: 'italic ' + EP.font(600, 48, F.serif), color: '#1E1B26', align: 'left' });
    EP.txt(g, 'THE END', 0, 170, { font: EP.font(900, 56, F.serif), color: '#1E1B26', ls: '8px' });
    const s1 = P(t, Wd(158, 3) - 0.05, Wd(158, 3) + 0.25), s2 = P(t, Wd(158, 4), Wd(158, 4) + 0.3);
    if (s1 > 0) PA.ink(g, PA.hand([[-120, 54], [130, 50]], 3, 941), 0, eIO(s1), { col: COL.marker, w: 9 });
    if (s2 > 0) PA.ink(g, PA.hand([[-140, 156], [140, 150]], 3, 942), 0, eIO(s2), { col: COL.marker, w: 9 });
    const w1 = P(t, Wd(158, 4) + 0.15, Wd(158, 4) + 0.55);
    if (w1 > 0) { g.save(); g.beginPath(); g.rect(-130, -20, 300 * eOut(w1), 70); g.clip(); EP.txt(g, 'lived', 10, 22, { font: EP.font(700, 64, F.hand), color: '#2F8F8A' }); g.restore(); PA.ink(g, PA.hand([[-20, 60], [0, 30], [20, 60]], 2, 943), 0, eIO(w1), { col: '#2F8F8A', w: 6 }); }
    const w2 = P(t, L(159) - 0.2, L(159) + 0.2);
    if (w2 > 0) { g.save(); g.beginPath(); g.rect(-220, 175, 440 * eOut(w2), 60); g.clip(); EP.txt(g, 'TO BE CONTINUED', 0, 222, { font: EP.font(700, 52, F.hand), color: '#2F8F8A' }); g.restore(); }
  }
  const DAISY = (() => { const strokes = []; for (let k = 0; k < 10; k++) { const a = k / 10 * EP.TAU; strokes.push([[Math.cos(a) * 40, Math.sin(a) * 40], [Math.cos(a - 0.22) * 150, Math.sin(a - 0.22) * 150], [Math.cos(a) * 180, Math.sin(a) * 180], [Math.cos(a + 0.22) * 150, Math.sin(a + 0.22) * 150], [Math.cos(a) * 40, Math.sin(a) * 40]]); } const c = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * EP.TAU; c.push([Math.cos(a) * 40, Math.sin(a) * 40]); } strokes.push(c); return strokes.map((s, i) => PA.hand(s, 2, 950 + i)); })();
  spread('E3', 135200, -100, 2400, 1450, t => 0.55 - 0.45 * P(t, 331.6, 334), -0.008, (g, t) => {
    PA.drawCard(g, PA.card('E3', 2400, 1450, { tex: '#F6E6CC', torn: 'tb', edge: 0.24 }), 0, 0);
    g.save(); g.translate(-560, -230); g.rotate(-0.025); endPage(g, t); g.restore();
    K.photo(g, 'bg_write', 460, -230, 780, 520, 0.02, t, L(159) - 0.35, { mode: 'drop', kb: { z0: 1.0, z1: 1.12, x0: 0.55, x1: 0.6, y0: 0.6, d: 5 }, tape: 951 });
    // the blueprint daisy
    const bp = eOut5(P(t, L(160) - 0.3, L(160)));
    if (bp > 0) { g.save(); g.translate(430, 340 + (1 - bp) * 400); g.rotate(0.02); PA.drawCard(g, PA.card('bpd', 560, 400, { tex: '#1F4F8A', r: 4, blur: 10 }), 0, 0); g.strokeStyle = 'rgba(234,242,255,.15)'; g.lineWidth = 1.5; for (let x = -280; x <= 280; x += 40) { g.beginPath(); g.moveTo(x, -200); g.lineTo(x, 200); g.stroke(); } for (let y = -200; y <= 200; y += 40) { g.beginPath(); g.moveTo(-280, y); g.lineTo(280, y); g.stroke(); }
      const n = DAISY.length, pr = P(t, L(160), L(161) + 0.6); DAISY.forEach((s, i) => { const f = clamp(pr * n - i); if (f > 0) PA.ink(g, s, 0, eIO(f), { col: '#EAF2FF', w: 4 }); }); g.restore(); }
    KT.draw(g, dE158, t); KT.draw(g, dE159, t); KT.draw(g, dE160, t); KT.draw(g, dE161, t);
    STK.draw(g, 'spr_write', 880, 735, 680, { t, peel: P(t, L(158) - 0.05, L(158) + 0.4), sway: 0.9 });
  }, { img: ['bg_write', 'cut/spr_write'] });

  // ================================================================== camera, impacts, light
  WD.keys.push(
    { t: 292.3, s: 'O1', dx: 0, dy: -32, z: 0.79, d: 0.55, drift: { z: 0.01 } },
    { t: 299.45, s: 'O2', dx: 0, dy: -32, z: 0.79, d: 0.5, drift: { z: 0.01 } },
    { t: 306.72, s: 'O3', dx: 0, dy: -32, z: 0.79, d: 0.5, drift: { z: 0.01 } },
    { t: 315.3, s: 'E1', dx: 0, dy: -32, z: 0.79, d: 0.6, drift: { z: 0.008 } },
    { t: 323.9, s: 'E2', dx: 0, dy: -32, z: 0.79, d: 0.55, drift: { z: 0.006 } },
    { t: 328.1, s: 'E2', dx: 0, dy: 330, z: 1.02, d: 0.8, drift: { z: 0.018 } },
    { t: 331.45, s: 'E3', dx: 0, dy: -32, z: 0.79, d: 0.55, drift: { z: 0.012 } },
  );
  WD.shakes.push([Wd(146, 4) + 0.15, 0.3], [Wd(147, 4) + 0.1, 0.3], [Wd(158, 3) + 0.1, 0.3]);
  WD.grades.push([315.3, 333.4, { col: '#808080', op: 'saturation', a: t => 0.35 * (1 - P(t, 331.7, 333.2)) }, 0.8, 0.2]);
  WD.blooms.push([299.5, 306.8, 0.2, 0.5, 0.4], [333.3, 338.3, 0.22, 0.6, 0.3]);
})();
