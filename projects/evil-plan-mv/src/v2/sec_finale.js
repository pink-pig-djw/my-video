// v2/sec_finale.js — chorus 4 and the outro (338.2 – 375.9 s).
// A giant two-sided card: Claude takes the night, flips it, and the day is a sunrise over the town; the chores fly off
// into the NIGHT SHIFT folder. The paper theatre's curtains open: EVIL / PLAN drop on their strings and turn gold,
// (plan! plan!) is stamped on the beats, and a fan section of uchiwa rises to spell YOU ♥. The war globe spins up
// and is rolled into a beach ball as daylight opens out of it. THE PLAN cover takes every stamp in the film.
// Then the camera pulls back and that cover is one tile in a grid of every page of the MV; on "Everybody lives
// forever" the tiles flip in a wave into one picture of everyone at sunrise — except the I DISAGREE sign, which flips
// last, on "disagree".
'use strict';
(function () {
  const { W, H, clamp, lerp, P, eIO, eIOs, eOut, eOut5, eIn, backOut, spring, smooth, hash, noise, mod } = EP;
  const PA = EP.PA, STK = EP.STK, KT = EP.KT, WD = EP.WD, K = EP.K, F = EP.F, COL = PA.COL;
  const L = EP.L, Wd = EP.Wd;
  const spread = (id, x, y, w, h, mood, rot, draw, extra = {}) => WD.spreads.push(Object.assign({ id, x, y, w, h, mood, rot, draw }, extra));

  // ================================================================== C4a · night / day, one last time (big card)
  const FLIP4 = Wd(162, 4) - 0.12;
  const dN = { i: 162, x: 0, y: -240, w: 1700, px: 200, style: 'cut', align: 'c', zh: false, cols: ['#FFF6E8', '#F4CE72', '#FFF6E8', '#F4CE72'], emph: { 3: { br: true }, 4: { hide: true }, 5: { hide: true }, 6: { hide: true }, 7: { hide: true } } };
  const dD = { i: 162, x: -860, y: -460, w: 1600, px: 170, style: 'cut', align: 'l', zh: { dx: 0, dy: 250, px: 44, col: '#FFFFFF' }, cols: ['#F07A2E', '#D23A2C', '#F4CE72', '#FFF6E8'], emph: { 0: { hide: true }, 1: { hide: true }, 2: { hide: true }, 3: { hide: true, br: true } } };
  const d163 = { i: 163, x: -860, y: 250, w: 1700, px: 76, style: 'serif', col: '#FFF6E8', glow: 'rgba(0,0,0,.65)', emph: { 'away': { style: 'cut', big: 1.5, cols: ['#F07A2E', '#F4CE72', '#FFF6E8', '#E9A0B4'] } }, zhCol: '#FFFFFF', zh: { px: 30 } };
  const CHORES = [['bills', '#FFE37A', -300, -40], ['forms', '#A9D3F5', 540, -70], ['inbox', '#F7B7C8', 300, 80], ['on hold', '#B9E3B0', 520, 230], ['deadlines', '#FFE37A', -60, 130]];
  let FC = null;
  function faces() { if (!FC) FC = [EP.mk(2200, 1400), EP.mk(2200, 1400)]; return FC; }
  function faceNight(g, t) {
    PA.drawCard(g, PA.card('C4n', 2200, 1300, { tex: 'indigo', shadow: false, edge: 0.32 }), 0, 0);
    for (let k = 0; k < 40; k++) { const tw = 0.5 + 0.5 * Math.sin(t * 3 + k); g.fillStyle = `rgba(255,246,220,${tw})`; EP.star(g, -1050 + hash(k, 1) * 2100, -600 + hash(k, 2) * 1200, 6 + hash(k, 3) * 10, 0, 0.42, 5); g.fill(); }
    PA.drawDoodle(g, 'moon', 760, -380, 1.8, 1, { col: COL.goldInk, w: 8, seed: 961 });
    STK.draw(g, 'spr_night', -760, 640, 960, { t, peel: P(t, L(162) - 0.3, L(162) + 0.2), sway: 1 });
    KT.draw(g, dN, t);
  }
  function faceDay(g, t) {
    const im = EP.img.bg_sunrise; if (im) { const [sx, sy, sw, sh] = K.crop(im, 2200, 1300, 0.5, 0.45, 1 + 0.06 * P(t, FLIP4, FLIP4 + 5)); g.drawImage(im, sx, sy, sw, sh, -1100, -650, 2200, 1300); }
    g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(-1100, -650, 2200, 1300);
    const go = Wd(163, 2);
    CHORES.forEach(([s, c, x0, y0], k) => {
      const ap = EP.pop(t - (FLIP4 + 0.6 + k * 0.08)); if (ap.sc <= 0.01) return;
      const fly = eIO(P(t, go + k * 0.12, go + k * 0.12 + 0.6)); if (fly >= 1) return;
      const x = lerp(x0, -1900, fly), y = lerp(y0, 100, fly) - Math.sin(Math.PI * fly) * 300;
      g.save(); g.translate(x, y); g.rotate((hash(k, 5) - 0.5) * 0.2 + fly * 2); g.scale(ap.sc * (1 - 0.4 * fly), ap.sc * (1 - 0.4 * fly)); PA.sticky(g, 0, 0, 200, c, 0, fly); EP.txt(g, s, 0, 12, { font: EP.font(700, 44, F.hand), color: '#2A2440' }); g.restore();
    });
    KT.draw(g, dD, t); KT.draw(g, d163, t);
    STK.draw(g, 'spr_open', 860, 650, 820, { t, peel: P(t, FLIP4 + 0.25, FLIP4 + 0.7), sway: 1, bob: 10, T: t });   // she sings the day in
  }
  spread('C4a', 137900, 150, 2400, 1500, t => (t > FLIP4 + 0.3 ? 'day' : 'night'), 0, (g, t) => {
    // the NIGHT SHIFT folder drops in once the camera is here (it would otherwise poke into the page before)
    const fd = eOut5(P(t, 337.9, 338.5));
    if (fd > 0) { g.save(); g.translate(-1450, 120 + (1 - fd) * 900); g.rotate(-0.05 - (1 - fd) * 0.3); PA.drawCard(g, PA.card('fold4', 560, 720, { tex: 'indigo', r: 18 }), 0, 0); EP.txt(g, 'NIGHT SHIFT', 0, -260, { font: EP.font(900, 40, F.ui), color: COL.goldInk, ls: '4px' }); g.restore(); }
    g.save(); g.fillStyle = 'rgba(0,0,0,.45)'; g.filter = 'blur(22px)'; g.fillRect(-1090, -635, 2200, 1300); g.restore();
    const fp = P(t, FLIP4, FLIP4 + 0.6);
    if (fp <= 0) faceNight(g, t);
    else if (fp >= 1) faceDay(g, t);
    else { const [a, b] = faces(); const ga = a.getContext('2d'), gb = b.getContext('2d'); EP.reset(ga); ga.clearRect(0, 0, 2200, 1400); ga.translate(1100, 700); faceNight(ga, t); EP.reset(gb); gb.clearRect(0, 0, 2200, 1400); gb.translate(1100, 700); faceDay(gb, t); PA.flipDraw(g, a, b, fp, 0, 0, 2200, 1400, { opaque: true, slices: 48, liftK: 0.3 }); }
  }, { img: ['bg_sunrise', 'cut/spr_night', 'cut/spr_open'] });

  // ================================================================== C4b · the theatre, the last time (curtains, EVIL PLAN, plan! plan!, the fans)
  const OPENC = 346.55, SIGN = [['EVIL', -470, Wd(164, 0), Wd(165, 0)], ['PLAN', 470, Wd(164, 1), Wd(165, 1)]];
  const STAMPS4 = [[Wd(164, 2), -620, 120, '#E0332A', -0.12], [Wd(164, 3), 620, 160, '#F4CE72', 0.1], [Wd(165, 2), -330, 260, '#E9A0B4', -0.05], [Wd(165, 3), 360, 280, '#9FE0C8', 0.12]];
  const d164 = { i: 164, x: 0, y: 610, w: 1400, px: 60, style: 'serif', align: 'c', col: '#FFF6E8', emph: { 0: { hide: true }, 1: { hide: true }, 2: { hide: true }, 3: { hide: true } }, zh: { dx: 0, dy: 0, px: 38, col: '#F4E1C0', align: 'c' }, out: L(165) - 0.1 };
  const d165 = { i: 165, x: 0, y: 610, w: 1400, px: 60, style: 'serif', align: 'c', col: '#FFF6E8', emph: { 0: { hide: true }, 1: { hide: true }, 2: { hide: true }, 3: { hide: true } }, zh: { dx: 0, dy: 0, px: 38, col: '#F4E1C0', align: 'c' }, out: L(166) - 0.1 };
  const d166 = { i: 166, x: -1000, y: -400, w: 1300, px: 84, style: 'serif', col: '#FFF6E8', glow: 'rgba(0,0,0,.6)', emph: { 'monster': { style: 'cut', big: 1.15, cols: ['#D23A2C', '#F07A2E', '#D23A2C', '#F07A2E', '#D23A2C', '#F07A2E', '#D23A2C'] }, 'biggest': { style: 'marker', col: COL.goldInk, big: 1.25, br: true }, 'fan': { style: 'marker', col: COL.goldInk, big: 1.3, circle: '#FF6A55' } }, zhCol: '#F4E1C0', zh: { px: 34 } };
  function curtains(g, t, open) {
    const sw = Math.sin(t * 1.3) * 10;
    [-1, 1].forEach(side => {
      g.save(); g.scale(side, 1);
      for (let k = 0; k < 2; k++) {
        const x0 = 1250 - k * 70, inner = lerp(-20, 900, open) - k * 70;
        g.fillStyle = k ? '#B8322A' : '#8E2420';
        g.beginPath(); g.moveTo(x0 + 200, -760); g.lineTo(inner - 60 + sw, -760);
        for (let y = -760; y <= 760; y += 40) g.lineTo(inner + Math.sin(y * 0.01 + k + t * 0.8) * 22 + (y + 760) * 0.06 * open + sw * (1 - (y + 760) / 1520), y);
        g.lineTo(x0 + 200, 760); g.closePath(); g.fill();
        g.globalAlpha = 0.25; g.fillStyle = '#000'; for (let f = 0; f < 9; f++) { const fx = inner + 60 + f * 70 + k * 30; if (fx < x0 + 200) g.fillRect(fx, -760, 18, 1520); } g.globalAlpha = 1;
      }
      g.restore();
    });
  }
  function letters(g, t) {
    SIGN.forEach(([word, x0, tDrop, tGold], wi) => {
      const px = 230, Gs = [...word].map(ch => PA.glyph(ch, px, '#F07A2E')), Gg = [...word].map(ch => PA.glyph(ch, px, '#F4CE72'));
      const tot = Gs.reduce((s, G) => s + G.adv * 0.92, 0); let x = x0 - tot / 2;
      const lu = t - (tDrop - 0.2); if (lu < 0) return;
      const fall = lu < 0.2 ? (1 - eIn(P(lu, 0, 0.2))) * -900 : 0, tau = lu - 0.2, sq = tau > 0 && tau < 0.3 ? 1 - 0.22 * Math.sin(Math.PI * tau / 0.3) : 1;
      const swing = tau > 0 ? 0.06 * Math.exp(-tau * 2.2) * Math.sin(tau * 9) : 0, y = -330 + fall - eIn(P(t, L(166) - 0.3, L(166) + 0.1)) * 1200;
      g.save(); g.translate(x0, -760); g.rotate(swing); g.translate(-x0, 760);
      g.strokeStyle = 'rgba(40,24,20,.8)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x0 - tot * 0.36, -760); g.lineTo(x0 - tot * 0.36, y - px * 0.6); g.moveTo(x0 + tot * 0.36, -760); g.lineTo(x0 + tot * 0.36, y - px * 0.6); g.stroke();
      Gs.forEach((G, k) => {
        const cxk = x + G.adv * 0.46, fp = P(t, tGold - 0.1 + k * 0.05, tGold - 0.1 + k * 0.05 + 0.42);
        g.save(); g.translate(cxk, y); g.scale(2 - sq, sq); g.rotate((hash(k, wi) - 0.5) * 0.12);
        if (fp <= 0) g.drawImage(G.c, -G.w / 2, -G.h * 0.62); else if (fp >= 1) g.drawImage(Gg[k].c, -G.w / 2, -G.h * 0.62); else PA.flipDraw(g, G.c, Gg[k].c, fp, 0, -G.h * 0.62 + G.h / 2, G.w, G.h, { slices: 12, liftK: 2 });
        g.restore(); x += G.adv * 0.92;
      });
      const sweepU = t - (tGold + 0.3); if (sweepU > 0 && sweepU < 2) EP.lightSweep(g, sweepU + 0.45, { x: x0 - tot / 2, y: y - px * 0.8, w: tot, h: px }, k2 => { k2.beginPath(); k2.rect(x0 - tot / 2 - 20, y - px * 0.9, tot + 40, px * 1.2); }, EP.SC * 1.4);
      g.restore();
    });
  }
  const FANS4 = []; for (let r = 0; r < 2; r++) for (let c = 0; c < 10; c++) FANS4.push({ x: -1080 + c * 240 + r * 120, y: 470 + r * 140, r, c, k: FANS4.length });
  const STUNT4 = { '0,6': 'Y', '0,7': 'O', '0,8': 'U', '0,9': '♥' };
  spread('C4b', 140600, -100, 2500, 1500, 'stage', 0, (g, t) => {
    PA.drawCard(g, PA.card('C4b', 2500, 1500, { tex: 'black', r: 10, edge: 0.4 }), 0, 0);
    K.photo(g, 'bg_stage', 0, -120, 1700, 940, 0, t, 344.5, { mode: 'none', frame: 'none', kb: { z0: 1.0, z1: 1.08, d: 10 } });
    g.save(); g.globalCompositeOperation = 'screen';
    for (let i = 0; i < 4; i++) { const a = Math.PI / 2 + Math.sin(t * 1.6 + i * 1.7) * 0.42, x = -900 + i * 600; const gr = g.createLinearGradient(x, -760, x + Math.cos(a) * 1500, -760 + Math.sin(a) * 1500); gr.addColorStop(0, 'rgba(255,225,170,.55)'); gr.addColorStop(1, 'rgba(255,225,170,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(x, -760); g.lineTo(x + Math.cos(a - 0.1) * 1700, -760 + Math.sin(a - 0.1) * 1700); g.lineTo(x + Math.cos(a + 0.1) * 1700, -760 + Math.sin(a + 0.1) * 1700); g.closePath(); g.fill(); }
    g.restore();
    g.fillStyle = '#5A3A24'; g.fillRect(-1250, 420, 2500, 340); PA.tile(g, 'kraft', -1250, 420, 2500, 40);
    for (let i = 0; i < 14; i++) EP.glowDot(g, -1100 + i * 170, 442, 60 + 14 * EP.pulse(t, 6), 'rgba(255,230,160,1)', 'rgba(255,170,80,.45)');
    letters(g, t);
    // Claude sings centre stage, then turns into the biggest fan
    const fsw = P(t, L(166) - 0.2, L(166) + 0.15);
    STK.draw(g, fsw >= 1 ? 'spr_fan' : 'spr_sing', 420, 650, 900, { t, peel: P(t, OPENC + 0.2, OPENC + 0.7), sway: 1.2, bob: 12, T: t, flip: fsw > 0 && fsw < 1 ? { to: 'spr_fan', p: fsw } : undefined });
    STAMPS4.forEach(([at, x, y, col, rot]) => PA.stamp(g, 'PLAN!', x, y, t - (at - 0.12), { px: 130, col, rot, comp: 'source-over', alpha: 0.95 }));
    FANS4.forEach(f => {
      const up = backOut(P(t, L(166) - 0.1 + f.c * 0.04 + f.r * 0.08, L(166) + 0.35 + f.c * 0.04 + f.r * 0.08), 2.6); if (up <= 0.01) return;
      const face = STUNT4[f.r + ',' + f.c] || null, fp = face ? P(t, Wd(166, 6) - 0.1 + f.c * 0.04, Wd(166, 6) + 0.4 + f.c * 0.04) : 0, s = 1.05;
      g.save(); g.translate(f.x, f.y - Math.abs(Math.sin(t * 8.6 + f.k)) * 18 + (1 - up) * 300); g.rotate(Math.sin(t * 6 + f.k) * 0.12);
      g.strokeStyle = '#8A5A3A'; g.lineWidth = 12; g.beginPath(); g.moveTo(0, 60); g.lineTo(0, 150); g.stroke();
      const st = fp > 0 && fp < 1 ? PA.flipState(fp) : { c: 1, front: fp < 1 }; g.scale(Math.max(0.03, Math.abs(st.c)) * s, s);
      g.fillStyle = '#FFFDF6'; g.beginPath(); g.arc(0, 0, 78, 0, 7); g.fill(); g.fillStyle = K.pcol(f.k * 3 + 2); g.beginPath(); g.arc(0, 0, 66, 0, 7); g.fill();
      if ((fp >= 1 || (fp > 0 && !st.front)) && face) { g.fillStyle = '#FFFDF6'; g.beginPath(); g.arc(0, 0, 58, 0, 7); g.fill(); EP.txt(g, face, 0, 30, { font: EP.font(900, 92, face === '♥' ? 'Segoe UI Symbol, ' + F.ui : F.ui), color: face === '♥' ? '#E8455C' : '#2A2440' }); }
      else { g.fillStyle = '#FFFFFF'; EP.heartPath(g, 26); g.fill(); }
      g.restore();
    });
    curtains(g, t, eIO(P(t, OPENC, OPENC + 0.8)));
    g.fillStyle = '#7A1E1A'; for (let i = 0; i < 16; i++) { g.beginPath(); g.arc(-1250 + i * 166 + 83, -700, 92, 0, Math.PI); g.fill(); }
    g.fillStyle = '#E8B54A'; g.fillRect(-1250, -760, 2500, 26);
    KT.draw(g, d164, t); KT.draw(g, d165, t); KT.draw(g, d166, t);
  }, { img: ['bg_stage', 'cut/spr_sing', 'cut/spr_fan'], screen: (g, t) => { if (t > Wd(164, 0) - 0.05) EP.FX.confetti(g, t, { t0: Wd(164, 0) - 0.05, n: 150, cols: ['#F07A2E', '#F4CE72', '#FFF6E8', '#D23A2C', '#E9A0B4', '#2F8F8A'] }); if (t > L(166)) EP.particles(g, t - L(166), { x: 960, y: 1110, kind: 3, cols: ['#FF5E78', '#FFFFFF', '#FFD27A', '#FF8FA3'], s: 2.2, g: 140, vyk: 1.5, spread: 1700, n: 70, seed: 61, alpha: 0.9 }); } });

  // ================================================================== C4c · the globe, rolled into a beach ball (callback)
  const JG = { x: -260, y: 90, R: 420 }, TILT = 0.38, CT = Math.cos(TILT), ST = Math.sin(TILT), RAD = Math.PI / 180;
  const CONT = [[48, -100, 26], [10, -80, 10], [-15, -60, 20], [52, 15, 17], [8, 20, 24], [52, 90, 32], [25, 78, 12], [-25, 135, 14], [70, -40, 10], [-40, -68, 8]];
  const CPOLY = CONT.map(([la, lo, r], k) => { const pts = []; for (let i = 0; i < 26; i++) { const a = i / 26 * EP.TAU, rr = r * (1 + 0.28 * Math.sin(a * 3 + k) + 0.15 * Math.sin(a * 5 + k * 2)); pts.push([la + Math.sin(a) * rr * 0.75, lo + Math.cos(a) * rr]); } return pts; });
  const proj = (la, lo, rot, R) => { const l = (lo - rot) * RAD, p = la * RAD, X = Math.cos(p) * Math.sin(l), Y = Math.sin(p), Z = Math.cos(p) * Math.cos(l); return { x: R * X, y: -R * (Y * CT - Z * ST), z: Z * CT + Y * ST }; };
  function sphPath(g, pts, rot, R) { let front = 0; g.beginPath(); pts.forEach(([la, lo], i) => { const q = proj(la, lo, rot, R); let { x, y } = q; if (q.z < 0) { const k = R / Math.max(1e-6, Math.hypot(x, y)); x *= k; y *= k; } else front++; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); return front; }
  function patch(la0, la1, lo0, lo1) { const out = [], n = 8, m = Math.max(2, Math.ceil((lo1 - lo0) / 6)); for (let i = 0; i <= n; i++) out.push([lerp(la0, la1, i / n), lo0]); for (let i = 1; i <= m; i++) out.push([la1, lerp(lo0, lo1, i / m)]); for (let i = 1; i <= n; i++) out.push([lerp(la1, la0, i / n), lo1]); for (let i = 1; i < m; i++) out.push([la0, lerp(lo1, lo0, i / m)]); return out; }
  function sphLine(g, pts, rot, R) { let pen = false; g.beginPath(); for (const [la, lo] of pts) { const q = proj(la, lo, rot, R); if (q.z < 0.02) { pen = false; continue; } pen ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y); pen = true; } g.stroke(); }
  const meridian = lo => Array.from({ length: 37 }, (_, i) => [-90 + i * 5, lo]);
  const SPIN0 = Wd(167, 3) - 0.1, SPIN1 = Wd(167, 5) + 0.3, PAINT0 = Wd(167, 4) - 0.08, IRIS0 = Wd(167, 5) - 0.05;
  const spinAt = t => 18 * t + 540 * eIOs(P(t, SPIN0, SPIN1));
  const BALL = ['#E8453C', '#FBF4E6', '#F4B83A', '#FBF4E6', '#2E9CB0', '#FBF4E6'];
  function globeBall(g, t, R) {
    const rot = spinAt(t), l0 = spinAt(PAINT0), span = clamp(rot - l0, 0, 360);
    g.save(); g.beginPath(); g.arc(0, 0, R, 0, 7); g.clip();
    if (span < 360) {
      g.fillStyle = '#1C2350'; g.fillRect(-R, -R, R * 2, R * 2);
      g.strokeStyle = 'rgba(255,120,95,.32)'; g.lineWidth = 2.5; for (let lo = 0; lo < 360; lo += 30) sphLine(g, meridian(lo), rot, R);
      for (const pts of CPOLY) if (sphPath(g, pts, rot, R) > 0) { g.fillStyle = '#56607F'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#E9DCC4'; g.stroke(); }
    }
    if (span > 0) {
      for (let k = 0; k < 6; k++) { const a = Math.max(l0, l0 + k * 60), b = Math.min(l0 + span, l0 + k * 60 + 60); if (b <= a) continue; for (const [la0, la1, col] of [[-90, -76, '#FBF4E6'], [-76, -38, BALL[k]], [-38, 0, BALL[k]], [0, 38, BALL[k]], [38, 76, BALL[k]], [76, 90, '#FBF4E6']]) if (sphPath(g, patch(la0, la1, a, b), rot, R) > 0) { g.fillStyle = col; g.fill(); g.lineWidth = 1.5; g.strokeStyle = col; g.stroke(); } }
      if (span < 360) { g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 14; sphLine(g, meridian(l0 + span + 2), rot, R); g.strokeStyle = '#FFFDF6'; g.lineWidth = 7; sphLine(g, meridian(l0 + span), rot, R); }
    }
    const sg = g.createRadialGradient(-R * 0.35, -R * 0.42, R * 0.1, 0, 0, R * 1.02); sg.addColorStop(0, 'rgba(255,255,255,.18)'); sg.addColorStop(0.65, 'rgba(0,0,0,0)'); sg.addColorStop(1, 'rgba(10,10,40,.45)'); g.fillStyle = sg; g.fillRect(-R, -R, R * 2, R * 2);
    if (span > 0) { g.globalAlpha = clamp(span / 360) * 0.75; g.fillStyle = '#FFFFFF'; g.beginPath(); g.ellipse(-R * 0.38, -R * 0.46, R * 0.2, R * 0.1, -0.6, 0, 7); g.fill(); g.globalAlpha = 1; }
    g.restore();
    g.lineWidth = 7; g.strokeStyle = '#FBF6EA'; g.beginPath(); g.arc(0, 0, R, 0, 7); g.stroke();
  }
  function sunCut(g, x, y, r, n, seed) { g.beginPath(); for (let i = 0; i <= n * 2; i++) { const a = i / (n * 2) * EP.TAU + seed, rr = i % 2 ? r * 0.93 : r; i ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); }
  const d167 = { i: 167, x: 160, y: -470, w: 920, px: 64, style: 'type', col: '#2A2440', emph: { 'domination': { col: '#D23A2C', strike: Wd(167, 3) }, 'but': { br: true }, 'vacation': { style: 'marker', col: '#2F8F8A', big: 1.75, under: '#F07A2E', br: true } } };
  spread('C4c', 143300, 150, 2250, 1400, t => (t < IRIS0 + 0.2 ? 'night' : 'day'), 0.012, (g, t) => {
    PA.drawCard(g, PA.card('C4cn', 2250, 1400, { tex: 'indigo', torn: 'lr', edge: 0.35 }), 0, 0);
    const ir = eOut(P(t, IRIS0, IRIS0 + 0.55));
    if (ir > 0) { g.save(); sunCut(g, JG.x, JG.y, lerp(JG.R * 0.95, 2600, ir), 28, t * 0.4); g.clip(); PA.drawCard(g, PA.card('C4cd', 2250, 1400, { tex: 'kraft', torn: 'lr', edge: 0.25 }), 0, 0); g.save(); g.translate(JG.x, JG.y); g.rotate(t * 0.12); for (let k = 0; k < 18; k++) { g.fillStyle = k % 2 ? 'rgba(255,246,232,.35)' : 'rgba(244,206,114,.55)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 1500, k / 18 * EP.TAU, (k + 1) / 18 * EP.TAU); g.closePath(); g.fill(); } g.restore(); g.restore(); }
    g.save(); g.translate(560, -265); g.rotate(-0.012); PA.drawCard(g, PA.card('C4slip', 960, 560, { tex: 'cream', lines: 64, r: 6, blur: 12 }), 0, 0); g.restore();
    const u = t - Wd(167, 5), sy = u > 0 ? 1 - 0.17 * Math.exp(-6 * u) * Math.cos(15 * u) : 1;
    g.save(); g.translate(JG.x, JG.y); g.fillStyle = 'rgba(0,0,0,.42)'; g.filter = 'blur(20px)'; g.beginPath(); g.ellipse(18, JG.R * 0.9, JG.R * 0.85 * (2 - sy), JG.R * 0.18, 0, 0, 7); g.fill(); g.filter = 'none';
    g.translate(0, JG.R); g.scale(2 - sy, sy); g.translate(0, -JG.R); globeBall(g, t, JG.R); g.restore();
    KT.draw(g, d167, t);
    STK.draw(g, 'spr_villain', -880, 640, 560, { t, peel: P(t, L(167) - 0.3, L(167) + 0.1), sway: 1, flip: { to: 'spr_float', p: P(t, Wd(167, 5) + 0.1, Wd(167, 5) + 0.46) } });
  }, { img: ['cut/spr_villain', 'cut/spr_float'] });

  // ================================================================== C4d · THE PLAN, with every stamp in the film
  const CX4 = 146000;
  const STORM = [['APPROVED', '#F4EADB', -420, 180, -0.14, 120], ['FILED', '#9FC7FF', 300, -60, 0.08, 110], ['CERTIFIED', '#B9E3B0', -620, -140, -0.06, 96], ['HOURS FOUND', '#FFE37A', 420, 300, 0.1, 86], ['ATTENDING', '#F7B7C8', -120, 420, -0.1, 80], ['NO NEED', '#E9DCC4', 700, 120, 0.14, 84], ['PLAN!', '#FFFFFF', 80, 160, -0.04, 150]];
  const d168 = { i: 168, x: -900, y: 300, w: 1100, px: 100, style: 'label', tape: '#1E1B26', ink: '#FBF6EA', zh: { dy: 136, col: '#F4E1C0', px: 30 } };
  const d169 = { i: 169, x: -900, y: 460, w: 1100, px: 100, style: 'label', tape: COL.tangerine, ink: '#1E1B26', zh: false };
  let C4CV = null;
  spread('C4d', CX4, 0, 2150, 1380, 'day', -0.01, (g, t) => {
    const fp = P(t, FLIPW, FLIPW + 0.55);
    if (fp >= 1) { g.drawImage(slices()[CC + ',' + CR], -CW / 2 - 2, -CHh / 2 - 2, CW + 4, CHh + 4); return; }
    if (fp > 0) { if (!C4CV) C4CV = EP.mk(2400, 1560); const cg = C4CV.getContext('2d'); EP.reset(cg); cg.clearRect(0, 0, 2400, 1560); cg.translate(1200, 780); c4d(cg, t); PA.flipDraw(g, C4CV, slices()[CC + ',' + CR], fp, 0, 0, 2400 + 300 * eIO(fp), 1560 + 140 * eIO(fp), { opaque: true, slices: 24, liftK: 6 }); return; }
    c4d(g, t);
  }, { img: ['cut/spr_pointcam', 'cut/spr_cheer'], z: 2 });
  function c4d(g, t) {
    PA.drawCard(g, PA.card('C4d', 2150, 1380, { tex: 'red', r: 14, edge: 0.35 }), 0, 0);
    const tx = -900, ty = -380; let x = tx;
    [...'THE PLAN'].forEach((ch, k) => { if (ch === ' ') { x += 60; return; } const G = PA.glyph(ch, 190, '#F4CE72'), lu = t - (L(168) - 0.25 + k * 0.035); if (lu >= 0) { const drop = (1 - eIn(P(lu, 0, 0.16))) * 220; g.drawImage(G.c, x + G.adv * 0.46 - G.w / 2, ty - G.h * 0.62 - drop); } x += G.adv * 0.92; });
    EP.lightSweep(g, t - (L(168) + 0.25) + 0.45, { x: tx, y: ty - 170, w: x - tx, h: 190 }, k2 => { k2.beginPath(); k2.rect(tx - 20, ty - 190, x - tx + 40, 230); }, EP.SC * 1.6);
    const beats = EP.T.beats.filter(b => b > L(168) + 0.1 && b < 360.4);
    STORM.forEach(([s, col, sx, sy, rot, px], k) => { const at = beats[k] ?? (L(168) + 0.3 + k * 0.4); PA.stamp(g, s, sx + 200, sy - 60, t - (at - 0.12), { px, col, rot, comp: 'source-over', alpha: 0.92 }); });
    KT.draw(g, d168, t); KT.draw(g, d169, t);
    const fl = P(t, Wd(169, 2) - 0.15, Wd(169, 2) + 0.25);
    STK.draw(g, fl >= 1 ? 'spr_cheer' : 'spr_pointcam', 720, 690, 1000, { t, peel: P(t, L(168) - 0.3, L(168) + 0.15), sway: 1, bob: 10, T: t, flip: fl > 0 && fl < 1 ? { to: 'spr_cheer', p: fl } : undefined });
  }

  // ================================================================== GRID · every page of the film, then everyone
  const COLS = 8, ROWS = 7, CW = 2700, CHh = 1700, CC = 4, CR = 3;   // C4d sits in cell (4, 3)
  const GX = c => CX4 + (c - CC) * CW, GY = r => (r - CR) * CHh;
  const DIS = { c: 6, r: 5 }, FLIPW = L(174) - 0.1, DISAT = Wd(176, 4) + 0.05;
  EP.GRID = { cols: COLS, rows: ROWS, CC, CR, DIS };
  let ORDER = null, TILES = null, SLICES = null, SIGNC = null;
  function order() {
    if (ORDER) return ORDER;
    const ids = WD.spreads.filter(s => !['C4d', 'GRID'].includes(s.id)).sort((a, b) => a.win[0] - b.win[0]).map(s => s.id);
    ORDER = []; let i = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { if (c === CC && r === CR) continue; if (c === DIS.c && r === DIS.r) { ORDER.push({ c, r, id: 'DIS' }); continue; } ORDER.push({ c, r, id: ids[i++ % ids.length] }); }
    return ORDER;
  }
  function slices() {
    if (SLICES) return SLICES;
    const im = EP.img.bg_finale, gw = COLS * CW, gh = ROWS * CHh, [sx, sy, sw, sh] = K.crop(im, gw, gh, 0.5, 0.55, 1);
    SLICES = {}; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const cv = EP.mk(540, 340), g = cv.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(im, sx + c / COLS * sw, sy + r / ROWS * sh, sw / COLS, sh / ROWS, 0, 0, 540, 340); SLICES[c + ',' + r] = cv; }
    return SLICES;
  }
  function signCard() {
    if (SIGNC) return SIGNC;
    const c = EP.mk(960, 600), g = c.getContext('2d'); g.translate(480, 300);
    PA.drawCard(g, PA.card('dissign', 900, 540, { tex: '#D7EAF3', r: 8, blur: 12 }), 0, 0);
    g.strokeStyle = '#8A5A3A'; g.lineWidth = 26; g.beginPath(); g.moveTo(0, 60); g.lineTo(0, 300); g.stroke();
    g.fillStyle = '#FFFDF6'; g.fillRect(-330, -220, 660, 300); g.strokeStyle = '#2A2440'; g.lineWidth = 8; g.strokeRect(-330, -220, 660, 300);
    EP.txt(g, 'I DISAGREE!', 0, -40, { font: EP.font(700, 120, F.hand), color: '#C8261D' });
    g.save(); g.translate(240, 30); g.rotate(0.2); g.fillStyle = '#FFFFFF'; EP.heartPath(g, 46); g.fill(); g.fillStyle = '#E8455C'; EP.heartPath(g, 36); g.fill(); g.restore();
    return (SIGNC = c);
  }
  const tileImg = id => id === 'DIS' ? signCard() : EP.img['thumb/' + id];
  const d170 = { i: 170, x: 0, y: 900, w: 1700, px: 58, style: 'serif', align: 'c', col: '#2A2440', emph: { 'forever': { italic: true, col: COL.tangerine, w: 900 } }, zh: { dx: 0, px: 28, align: 'c' }, out: L(171) - 0.15 };
  const ol = (i, extra = {}) => Object.assign({ i, x: 0, y: 900, w: 1700, px: 58, style: 'serif', align: 'c', col: '#2A2440', zh: { dx: 0, px: 28, align: 'c' } }, extra);
  const OUTRO = [d170, ol(171, { emph: { 'free': { style: 'marker', col: '#2F8F8A', big: 1.2 } }, out: L(172) - 0.15 }), ol(172, { emph: { 4: { hl: true }, 5: { hl: true }, 6: { hl: true, italic: true } }, out: L(173) - 0.15 }), ol(173, { emph: { 3: { style: 'type', col: '#7A7486' }, 4: { style: 'type', col: '#7A7486' }, 5: { style: 'type', col: '#7A7486' } }, out: L(174) - 0.15 }),
    ol(174, { emph: { 'everybody': { style: 'cut', cols: ['#F07A2E', '#2B3990', '#D23A2C', '#2F8F8A', '#E8A62A', '#C2357A', '#F07A2E', '#2B3990', '#D23A2C'] }, 'forever': { italic: true, col: COL.tangerine, w: 900 } }, out: L(175) - 0.15 }),
    ol(175, { emph: { 2: { style: 'marker', col: '#2F8F8A', big: 1.2 } }, out: L(176) - 0.15 }), ol(176, { emph: { 0: { style: 'marker', col: COL.tangerine, big: 1.1 }, 'disagree': { col: '#D23A2C', italic: true, w: 900 } } })];
  spread('GRID', CX4 - CW * 0.5, 0, COLS * CW, ROWS * CHh, 'day', 0, (g, t, c) => {
    const S = slices(), cz = c.z;
    order().forEach(({ c: ci, r, id }) => {
      const x = GX(ci) - (CX4 - CW * 0.5), y = GY(r), img = tileImg(id), dist = Math.hypot(ci - CC, (r - CR) * 1.2);
      const fp = id === 'DIS' ? P(t, DISAT, DISAT + 0.5) : P(t, FLIPW + dist * 0.11, FLIPW + dist * 0.11 + 0.55);
      const rot = (hash(ci, r) - 0.5) * 0.05 * (1 - eIO(clamp(fp)));
      g.save(); g.translate(x, y); g.rotate(rot);
      if (fp >= 1) g.drawImage(S[ci + ',' + r], -CW / 2 - 2, -CHh / 2 - 2, CW + 4, CHh + 4);
      else if (img) { if (fp <= 0) g.drawImage(img, -1200, -750, 2400, 1500); else PA.flipDraw(g, img, S[ci + ',' + r], fp, 0, 0, 2400 + 300 * eIO(fp), 1500 + 200 * eIO(fp), { opaque: true, slices: cz < 0.2 ? 10 : 24, liftK: 6 }); }
      g.restore();
    });
  }, {
    from: 360.0, z: 1, img: () => ['bg_finale'].concat(order().filter(o => o.id !== 'DIS').map(o => 'thumb/' + o.id)),
  });
  EP.overlays = EP.overlays || [];
  EP.overlays.push((g, t) => {   // the outro lyric on a paper strip, then the title
      const sp = eOut5(P(t, L(170) - 0.4, L(170) + 0.1));
      if (sp > 0 && t < 375.1) {
        g.save(); g.translate(960, 1080 - 150 * sp); PA.drawCard(g, PA.card('outstrip', 1500, 200, { tex: 'cream', torn: 'lr', sa: 0.5 }), 0, 0); g.restore();
        g.save(); g.translate(960, 1080 - 150 * sp - 1000); OUTRO.forEach(d => KT.draw(g, d, t)); g.restore();
      }
      const tt = P(t, 374.95, 375.4);
      if (tt > 0) { g.save(); g.globalAlpha = tt; g.fillStyle = 'rgba(20,14,11,.55)'; g.fillRect(0, 0, W, H); EP.txt(g, 'EVIL PLAN', 960, 560, { font: EP.font(400, 200, F.villain), color: '#F4E1C0', ls: '10px' }); EP.txt(g, 'a plan by Claude ✿', 960, 660, { font: EP.font(700, 60, F.hand), color: '#F4CE72' }); g.restore(); }
  });

  // ================================================================== camera, impacts, light; nothing else is drawn once the grid appears
  WD.keys.push(
    { t: 338.0, s: 'C4a', dx: 0, dy: -20, z: 0.76, d: 0.55, drift: { z: 0.012 } },
    { t: 344.6, s: 'C4b', dx: 0, dy: -30, z: 0.78, d: 0.6, drift: { z: 0.014 } },
    { t: 353.95, s: 'C4c', dx: 0, dy: -30, z: 0.8, d: 0.45, drift: { z: 0.012 } },
    { t: 357.42, x: CX4, y: -20, z: 0.86, d: 0.42, drift: { z: 0.01 } },
    { t: 360.35, x: CX4 - CW * 0.5, y: 0, z: 0.0905, d: L(174) - 0.4 - 360.35, e: 'ios' },
  );
  WD.punches.push([338.2, 360.2, 0.018]);
  WD.shakes.push(...STAMPS4.map(([at]) => [at + 0.08, 0.5]), [Wd(164, 0) + 0.2, 0.4], [Wd(164, 1) + 0.2, 0.4], [OPENC + 0.6, 0.25], [IRIS0 + 0.1, 0.45], [Wd(166, 6) + 0.2, 0.3]);
  WD.blooms.push([344.6, 354.0, 0.3, 0.6, 0.4], [369.0, 375.9, 0.18, 1.0, 0.5]);
  for (const s of WD.spreads) if (!['C4d', 'GRID'].includes(s.id)) s.until = Math.min(s.until ?? 1e9, 360.3);
})();
