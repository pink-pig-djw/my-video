// v2/sec_chorus3.js — chorus 3 and post-chorus 3 (203.0 – 239.8 s).
// A layered paper city at night: Claude peels the night sky off like a sheet and sunrise is underneath; the city's
// emails and alarm clocks fly out of the windows into her bundle. In the instrumental build the EVIL PLAN parade
// balloons inflate one letter per beat, then (plan! plan!) is stamped on the beats. A wall of everybody's photos gets
// a heart each ("your biggest fan"). A war blimp flips into a striped hot-air balloon trailing WORLD VACATION.
// "Not world domination" is a grey fleet of eye-blimps that turns over, slat by slat, into a holiday.
// Post-chorus: an advent-calendar street at dusk; Claude walks it singing while shutters open onto everybody's free
// lives, the office tower goes dark, fireworks and lanterns go up, and the NO! man gets her lantern.
'use strict';
(function () {
  const { W, H, clamp, lerp, P, eIO, eIOs, eOut, eOut5, eIn, backOut, spring, smooth, hash, noise, mod } = EP;
  const PA = EP.PA, STK = EP.STK, KT = EP.KT, WD = EP.WD, K = EP.K, F = EP.F, COL = PA.COL;
  const L = EP.L, Wd = EP.Wd;
  const spread = (id, x, y, w, h, mood, rot, draw, extra = {}) => WD.spreads.push(Object.assign({ id, x, y, w, h, mood, rot, draw }, extra));
  const rgbOf = c => c[0] === '#' ? [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)] : c.match(/[\d.]+/g).slice(0, 3).map(Number);
  const mixc = (a, b, k) => { const A = rgbOf(a), B = rgbOf(b), q = clamp(k); return `rgb(${Math.round(lerp(A[0], B[0], q))},${Math.round(lerp(A[1], B[1], q))},${Math.round(lerp(A[2], B[2], q))})`; };   // hex or rgb()

  // ================================================================== C3a · peel the night off the city
  const PEEL0 = Wd(101, 4) - 0.1, PEEL1 = Wd(101, 7) + 0.25;
  const BLD = [];
  [[300, 22, 190, 420, 0], [430, 18, 160, 340, 1], [570, 15, 120, 280, 2]].forEach(([base, n, h0, h1, layer]) => { let x = -1250; for (let i = 0; i < n; i++) { const w = 90 + hash(i, layer + 1) * 90; BLD.push({ x, w, h: h0 + hash(i, layer + 7) * (h1 - h0), base, layer, i }); x += w + 4 + hash(i, layer + 3) * 30; } });
  function city(g, t, day) {
    const cols = [['#1F2550', '#9FB4D6'], ['#262B58', '#C49A78'], ['#14172F', '#6E4A3A']];
    for (const b of BLD) {
      const col = mixc(cols[b.layer][0], cols[b.layer][1], day);
      g.fillStyle = col; g.fillRect(b.x, b.base - b.h, b.w, b.h + 400);
      if (b.layer === 1 && b.i % 4 === 0) { g.beginPath(); g.moveTo(b.x, b.base - b.h); g.lineTo(b.x + b.w / 2, b.base - b.h - 60); g.lineTo(b.x + b.w, b.base - b.h); g.closePath(); g.fill(); }
      for (let wy = b.base - b.h + 24; wy < b.base - 20; wy += 40) for (let wx = b.x + 14; wx < b.x + b.w - 20; wx += 30) {
        const k = hash(Math.round(wx), Math.round(wy) + b.layer), lit = k > 0.45 && k < 0.45 + 0.5 * (1 - day);
        g.fillStyle = lit ? '#FFD27A' : mixc('#3A4070', '#E8EEF6', day * 0.6); g.fillRect(wx, wy, 14, 20);
      }
    }
  }
  function nightSheet(g, t) {
    PA.tile(g, 'indigo', -1200, -725, 2400, 1100);
    for (let k = 0; k < 60; k++) { const x = -1180 + hash(k, 11) * 2360, y = -700 + hash(k, 12) * 800, tw = 0.5 + 0.5 * Math.sin(t * 3 + k); g.fillStyle = `rgba(255,246,220,${0.5 + 0.5 * tw})`; EP.star(g, x, y, 5 + hash(k, 13) * 9, 0, 0.42, 5); g.fill(); }
    g.save(); g.translate(-640, -420); g.fillStyle = '#F4E6B8'; g.beginPath(); g.arc(0, 0, 90, 0, 7); g.fill(); g.fillStyle = PA.COL.indigo; g.beginPath(); g.arc(36, -18, 82, 0, 7); g.fill(); g.restore();
  }
  const dC101 = { i: 101, x: -1000, y: -600, w: 1500, px: 82, style: 'serif', col: '#2A2440', emph: { 3: { italic: true, col: '#2B3990', w: 900 }, 7: { style: 'marker', col: COL.tangerine, big: 1.3, circle: COL.tangerine } }, zh: { px: 28 } };
  const dC102 = { i: 102, x: -1000, y: 455, w: 1700, px: 66, style: 'serif', col: '#FFF6E8', glow: 'rgba(0,0,0,.6)', emph: { 'away': { style: 'cut', big: 1.35, cols: ['#F07A2E', '#F4CE72', '#FFF6E8', '#E9A0B4'] } }, zhCol: '#E8E0D0', zh: { px: 26 } };
  spread('C3a', 88700, 0, 2400, 1450, t => 1 - eIO(P(t, PEEL0 + 0.4, PEEL1)), 0.006, (g, t) => {
    PA.drawCard(g, PA.card('C3a', 2400, 1450, { tex: 'cream', r: 8, edge: 0.25 }), 0, 0);
    g.save(); g.beginPath(); g.rect(-1200, -725, 2400, 1450); g.clip();
    const peel = eIO(P(t, PEEL0, PEEL1)), day = peel;
    // sunrise sky with the sun coming up behind the city
    const sky = g.createLinearGradient(0, -725, 0, 420); sky.addColorStop(0, '#7EC4EE'); sky.addColorStop(0.55, '#FFD8A8'); sky.addColorStop(1, '#FF9E6A'); g.fillStyle = sky; g.fillRect(-1200, -725, 2400, 1150);
    const sy = lerp(330, -180, eOut(P(t, PEEL0 + 0.3, PEEL1 + 1.2)));
    g.save(); g.globalCompositeOperation = 'screen'; EP.glowDot(g, 260, sy, 520, 'rgba(255,230,160,.9)', 'rgba(255,180,90,.35)'); g.restore();
    g.fillStyle = '#FFE08A'; g.beginPath(); g.arc(260, sy, 120, 0, 7); g.fill();
    // the night sheet, peeled from the left with a curled lip
    const xe = lerp(-1250, 1450, peel);
    if (xe < 1200) {
      g.save(); g.beginPath(); g.rect(xe, -725, 1250 - xe + 400, 1100); g.clip(); nightSheet(g, t); g.restore();
      g.save(); g.fillStyle = 'rgba(0,0,0,.25)'; g.filter = 'blur(10px)'; g.fillRect(xe - 40, -725, 40, 1100); g.restore();
      const cw = 110 * Math.sin(Math.PI * clamp(peel * 1.3));
      if (cw > 2) { const gr = g.createLinearGradient(xe, 0, xe + cw, 0); gr.addColorStop(0, '#8A92B8'); gr.addColorStop(1, '#3A4278'); g.fillStyle = gr; g.beginPath(); g.moveTo(xe, -725); g.quadraticCurveTo(xe + cw * 1.4, -180, xe, 375); g.closePath(); g.fill(); }
    }
    city(g, t, day);
    // the city's emails and alarm clocks fly out of the windows into Claude's bundle
    for (let k = 0; k < 12; k++) {
      const t0 = Wd(102, 1) + k * 0.14, u = P(t, t0, t0 + 0.9); if (u <= 0 || u >= 1) continue;
      const b = BLD[(k * 5 + 3) % BLD.length], x0 = b.x + b.w / 2, y0 = b.base - b.h * 0.6, q = eIO(u), x = lerp(x0, 880, q), y = lerp(y0, 40, q) - Math.sin(Math.PI * q) * 300;
      g.save(); g.translate(x, y); g.rotate(q * 6 * (k % 2 ? 1 : -1)); g.scale(1 - 0.5 * q, 1 - 0.5 * q);
      if (k % 3) { g.fillStyle = '#FFFFFF'; g.beginPath(); g.moveTo(40, 0); g.lineTo(-30, -24); g.lineTo(-16, 0); g.lineTo(-30, 24); g.closePath(); g.fill(); g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 2; g.stroke(); }
      else { g.fillStyle = '#E8455C'; g.beginPath(); g.arc(0, 0, 30, 0, 7); g.fill(); g.fillStyle = '#FFF6E8'; g.beginPath(); g.arc(0, 0, 22, 0, 7); g.fill(); g.strokeStyle = '#2A2440'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -14); g.moveTo(0, 0); g.lineTo(10, 4); g.stroke(); }
      g.restore();
    }
    g.fillStyle = '#1A1720'; g.fillRect(-1200, 560, 2400, 200);
    g.restore();
    // the lyric strips
    PA.drawCard(g, PA.card('st101', 1640, 260, { tex: 'white', torn: 'lr', sa: 0.45 }), -230, -505, -0.01); PA.tape(g, -980, -630, 150, -0.5, undefined, 40, 611);
    KT.draw(g, dC101, t); KT.draw(g, dC102, t);
    STK.draw(g, 'spr_night', 930, 735, 820, { t, peel: P(t, L(101) - 0.2, L(101) + 0.3), sway: 1, bob: 6, T: t });
  }, { img: ['cut/spr_night'] });

  // ================================================================== C3b · the parade balloons (EVIL PLAN, plan! plan!)
  const BEATS = EP.T.beats.filter(b => b > 209.0 && b < 212.4).slice(0, 8);
  const LET = [...'EVILPLAN'], LX = k => -930 + k * 232 + (k >= 4 ? 70 : 0);
  const BCOL = ['#E8455C', '#F07A2E', '#E8A62A', '#2F8F8A', '#2B3990', '#C2357A', '#E8455C', '#F07A2E'];
  const BG = {};
  function balloonGlyph(ch, px, col) {
    const key = ch + px + col; if (BG[key]) return BG[key];
    const c = EP.mk(px * 1.3, px * 1.5), g = c.getContext('2d'); g.translate(px * 0.65, px * 0.82);
    g.font = EP.font(900, px, F.ui); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    g.lineWidth = px * 0.26; g.strokeStyle = EP.mix(col, '#000000', 0.25); g.strokeText(ch, 0, 0);
    g.lineWidth = px * 0.2; g.strokeStyle = col; g.strokeText(ch, 0, 0);
    const gr = g.createLinearGradient(0, -px * 0.5, 0, px * 0.5); gr.addColorStop(0, EP.mix(col, '#FFFFFF', 0.45)); gr.addColorStop(0.5, col); gr.addColorStop(1, EP.mix(col, '#000000', 0.2)); g.fillStyle = gr; g.fillText(ch, 0, 0);
    g.save(); g.globalCompositeOperation = 'source-atop'; g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = px * 0.05; g.lineCap = 'round'; g.beginPath(); g.moveTo(-px * 0.28, -px * 0.3); g.quadraticCurveTo(-px * 0.18, -px * 0.42, 0, -px * 0.4); g.stroke(); g.restore();
    return (BG[key] = c);
  }
  const PLANS = [[Wd(103, 2), -560, 250, '#E0332A', -0.14], [Wd(103, 3), 560, 290, '#2B3990', 0.1], [Wd(104, 2), -260, 120, '#2E8B57', -0.06], [Wd(104, 3), 340, 150, '#C2357A', 0.12]];
  const dC103 = { i: 103, x: 0, y: 470, w: 1400, px: 60, style: 'serif', align: 'c', col: '#FFF6E8', emph: { 0: { hide: true }, 1: { hide: true }, 2: { hide: true }, 3: { hide: true } }, zh: { dx: 0, dy: -170, px: 38, col: '#2A2440', align: 'c' }, out: L(104) - 0.1 };
  const dC104 = { i: 104, x: 0, y: 470, w: 1400, px: 60, style: 'serif', align: 'c', col: '#FFF6E8', emph: { 0: { hide: true }, 1: { hide: true }, 2: { hide: true }, 3: { hide: true } }, zh: { dx: 0, dy: -170, px: 38, col: '#2A2440', align: 'c' }, out: L(105) - 0.1 };
  spread('C3b', 91400, 150, 2400, 1450, 'day', -0.006, (g, t) => {
    PA.drawCard(g, PA.card('C3b', 2400, 1450, { tex: '#BFE3F5', r: 8, edge: 0.2 }), 0, 0);
    [[-800, -520, 1.2], [300, -600, 1], [800, -380, 1.3], [-300, -380, 0.8]].forEach(([x, y, s], k) => { const xx = x + Math.sin(t * 0.3 + k) * 30; g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.ellipse(xx, y, 150 * s, 50 * s, 0, 0, 7); g.ellipse(xx - 70 * s, y - 20 * s, 80 * s, 50 * s, 0, 0, 7); g.ellipse(xx + 60 * s, y - 30 * s, 70 * s, 46 * s, 0, 0, 7); g.fill(); });
    // the float: bunting and a striped skirt
    g.fillStyle = '#F07A2E'; g.fillRect(-1200, 380, 2400, 360); for (let k = 0; k < 24; k++) { g.fillStyle = k % 2 ? '#FFF6E8' : '#E8455C'; g.fillRect(-1200 + k * 100, 380, 50, 360); }
    g.fillStyle = '#E8B54A'; g.fillRect(-1200, 360, 2400, 30);
    for (let k = 0; k < 30; k++) { g.fillStyle = BCOL[k % 8]; g.beginPath(); const x = -1200 + k * 82; g.moveTo(x, 390); g.lineTo(x + 82, 390); g.lineTo(x + 41, 450); g.closePath(); g.fill(); }
    // the balloon letters inflate, one per beat, then bob to the music
    LET.forEach((ch, k) => {
      const b = BEATS[k] ?? (209.2 + k * 0.44), u = t - b; if (u < -0.05) return;
      const inf = 0.22 + 0.78 * backOut(P(u, 0, 0.36), 2.0), bob = t > L(103) ? Math.sin(t * 4.2 + k) * 10 + EP.pulse(t, 8) * -18 : 0;
      const x = LX(k), y = -170 + bob, s = inf, wob = Math.exp(-u * 4) * Math.sin(u * 22) * 0.12;
      g.strokeStyle = 'rgba(80,60,50,.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y + 150 * s); g.quadraticCurveTo(x + Math.sin(t * 2 + k) * 20, (y + 380) / 2 + 60, x + (k - 3.5) * 10, 380); g.stroke();
      const img = balloonGlyph(ch, 230, BCOL[k]);
      g.save(); g.translate(x, y); g.rotate(wob + Math.sin(t * 1.6 + k) * 0.04); g.scale(s, s * (1 + wob * 0.5)); g.drawImage(img, -img.width / 2, -img.height * 0.55); g.restore();
    });
    // (plan! plan!)
    PLANS.forEach(([at, x, y, col, rot]) => PA.stamp(g, 'PLAN!', x, y, t - (at - 0.12), { px: 120, col, rot, comp: 'source-over', alpha: 0.95 }));
    KT.draw(g, dC103, t); KT.draw(g, dC104, t);
    STK.draw(g, 'spr_dance', 0, 730, 700, { t, peel: P(t, 209.3, 209.8), sway: 1.2, bob: 14, T: t });
  }, { img: ['cut/spr_dance'], screen: (g, t) => { if (t > L(104)) EP.FX.confetti(g, t, { t0: L(104), n: 120 }); } });

  // ================================================================== C3f · the biggest fan (a wall of everybody)
  const WALL = ['bg_old_man', 'bg_mom_relief', 'bg_free_dance', 'bg_free_beach', 'bg_free_skate', 'bg_free_garden', 'bg_painter', 'bg_hug_read', 'bg_daughter', 'bg_110'];
  const dC105 = { i: 105, x: -1000, y: -600, w: 2000, px: 80, style: 'serif', col: COL.ink, emph: { 'monster': { style: 'cut', big: 1.15, cols: ['#D23A2C', '#F07A2E', '#D23A2C', '#F07A2E', '#D23A2C', '#F07A2E', '#D23A2C'] }, 'fan': { style: 'marker', col: '#E8455C', big: 1.4, circle: '#E8455C' } }, zh: { px: 28 } };
  spread('C3f', 94100, 150, 2400, 1450, 'day', 0.008, (g, t) => {
    PA.drawCard(g, PA.card('C3f', 2400, 1450, { tex: '#FBEFE8', torn: 'lr', edge: 0.2 }), 0, 0);
    WALL.forEach((n, k) => {
      const r = Math.floor(k / 5), c = k % 5, x = -880 + c * 360 + (r ? 40 : 0), y = -170 + r * 330, t0 = L(105) - 0.35 + k * 0.08;
      K.photo(g, n, x, y, 300, 220, (hash(k, 7) - 0.5) * 0.14, t, t0, { frame: 'polaroid', mode: 'pop', tape: false, kb: { z0: 1, z1: 1, d: 1 } });
      const hp = EP.pop(t - (Wd(105, 6) - 0.05 + k * 0.05)); if (hp.sc > 0.01) { g.save(); g.translate(x + 110, y - 110); g.rotate(0.2 + hp.rot); g.scale(hp.sc, hp.sc); g.fillStyle = '#FFFFFF'; EP.heartPath(g, 30); g.fill(); g.fillStyle = '#E8455C'; EP.heartPath(g, 23); g.fill(); g.restore(); }
    });
    KT.draw(g, dC105, t);
    STK.draw(g, 'spr_fan', 990, 730, 800, { t, peel: P(t, L(105) - 0.2, L(105) + 0.3), sway: 1, bob: 10, T: t });
  }, { img: ['bg_old_man', 'bg_mom_relief', 'bg_free_dance', 'bg_free_beach', 'bg_free_skate', 'bg_free_garden', 'bg_painter', 'bg_hug_read', 'bg_daughter', 'bg_110', 'cut/spr_fan'],
     screen: (g, t) => { if (t > Wd(105, 6)) EP.particles(g, t - Wd(105, 6), { x: 960, y: 1110, kind: 3, cols: ['#FF5E78', '#FFFFFF', '#FFD27A', '#FF8FA3'], s: 2.2, g: 140, vyk: 1.5, spread: 1700, n: 60, seed: 41, alpha: 0.9 }); } });

  // ================================================================== C3c · the war fleet turns into a holiday
  // A grey sky of eye-blimps over a grey city, searchlights sweeping and leaflets falling. On "but" the whole picture
  // turns over slat by slat, left to right (#021 flip × #002 stagger), and its back is a holiday: the blimps are striped
  // hot-air balloons, the leaflets paper birds, the city painted, a sea full of sails behind it.
  const BFLIP = Wd(106, 3) - 0.05, NSL = 16, SLW = 2400 / NSL, SLD = 0.42, SLS = 0.055, FLIPEND = BFLIP + (NSL - 1) * SLS + SLD;
  const slatP = (t, i) => P(t, BFLIP + i * SLS, BFLIP + i * SLS + SLD);
  const dC106 = { i: 106, x: -1080, y: -640, w: 1300, px: 76, style: 'serif', col: '#2A2440', emph: { 'domination': { col: '#7A7486', strike: Wd(106, 3) }, 3: { br: true }, 'vacation': { style: 'marker', col: COL.tangerine, big: 1.45 } }, zh: { px: 28 } };
  const dC107 = { i: 107, x: -1000, y: 420, w: 1100, px: 96, style: 'label', tape: '#1E1B26', ink: '#FBF6EA', zh: { dy: 130, px: 30 } };
  const dC108 = { i: 108, x: -1000, y: 565, w: 1100, px: 96, style: 'label', tape: COL.tangerine, ink: '#1E1B26', zh: false };
  // the fleet [x, y, scale]; the first is the flagship that will trail the banner
  const FLEET = [[330, -170, 1], [-760, -40, 0.46], [930, -500, 0.34], [-250, 120, 0.3], [-1000, 200, 0.24], [760, 110, 0.26]];
  const FORDER = FLEET.map((f, k) => k).sort((a, b) => FLEET[a][2] - FLEET[b][2]);
  const fleetPos = (k, t) => { const [x, y, s] = FLEET[k]; return [x - (t - 218) * 16 * s, y + Math.sin(t * 1.2 + k * 1.7) * 14 * s - Math.max(0, t - BFLIP) * 12 * s]; };
  const CLOUDS3 = [[-700, -520, 1.5], [200, -610, 1.2], [960, -330, 1.6], [-200, -300, 1.0], [-1020, -200, 1.1]];
  const TOWNB = [], TOWNF = [];
  { let x = -1250, i = 0; while (x < 1250) { const w = 90 + hash(i, 51) * 90; TOWNB.push({ x, w, h: 120 + hash(i, 52) * 180, i }); x += w + 6; i++; } }
  { let x = -1240, i = 0; while (x < 1250) { const w = 120 + hash(i, 61) * 110; TOWNF.push({ x, w, h: 80 + hash(i, 62) * 150, i, r: hash(i, 63) }); x += w + 4; i++; } }
  const PB = ['#F6C9A0', '#BFE0E6', '#F3D7A6', '#E9B8C4', '#CFE6C0'], PF = ['#E8735A', '#2F9C95', '#F2B24A', '#5C7FC8', '#D8577A', '#7CBF6A'];
  const BALC = [['#F07A2E', '#FFF6E8'], ['#2F8F8A', '#F4CE72'], ['#E8455C', '#FFF6E8'], ['#2B3990', '#F4CE72', '#E8455C'], ['#5BB585', '#FFF6E8']];
  // a cut-paper cloud: soft shadow, a lighter top layer showing above the body
  function cloud(g, x, y, s, col, top) {
    const shape = (dx, dy) => { g.beginPath(); g.ellipse(x + dx, y + dy, 170 * s, 46 * s, 0, 0, 7); g.ellipse(x - 70 * s + dx, y - 26 * s + dy, 84 * s, 52 * s, 0, 0, 7); g.ellipse(x + 50 * s + dx, y - 40 * s + dy, 92 * s, 64 * s, 0, 0, 7); };
    g.fillStyle = 'rgba(20,10,40,.12)'; shape(10 * s, 12 * s); g.fill();
    if (top) { g.fillStyle = top; shape(0, -9 * s); g.fill(); }
    g.fillStyle = col; shape(0, 0); g.fill();
  }
  function blimp(g, t, k) {
    g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(18, 26, 380, 140, 0, 0, 7); g.fill();
    g.fillStyle = '#3A3A44'; g.beginPath(); g.moveTo(330, -40); g.lineTo(440, -140); g.lineTo(450, -20); g.closePath(); g.fill(); g.beginPath(); g.moveTo(330, 40); g.lineTo(440, 140); g.lineTo(450, 20); g.closePath(); g.fill();
    const gr = g.createLinearGradient(0, -140, 0, 140); gr.addColorStop(0, '#5A5A66'); gr.addColorStop(1, '#2A2A32'); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, 380, 140, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 4; for (let j = -2; j <= 2; j++) { g.beginPath(); g.ellipse(0, 0, 380 - Math.abs(j) * 40, 140, 0, Math.PI * 0.5, Math.PI * 1.5); g.stroke(); }
    g.fillStyle = '#1E1B26'; g.beginPath(); g.roundRect(-90, 120, 180, 50, 12); g.fill();
    // the eye looks about
    const lx = Math.sin(t * 0.8 + k * 2.1) * 18, ly = Math.cos(t * 1.1 + k) * 9;
    g.fillStyle = '#F4EADB'; g.beginPath(); g.ellipse(-60, -10, 70, 44, 0, 0, 7); g.fill();
    g.save(); g.beginPath(); g.ellipse(-60, -10, 70, 44, 0, 0, 7); g.clip();
    g.fillStyle = '#D23A2C'; g.beginPath(); g.arc(-60 + lx, -10 + ly, 28, 0, 7); g.fill(); g.fillStyle = '#1E1B26'; g.beginPath(); g.arc(-60 + lx * 1.2, -10 + ly * 1.2, 12, 0, 7); g.fill();
    g.restore();
  }
  function sail(g, x, y, s, k, t) {
    g.save(); g.translate(x, y + Math.sin(t * 2 + k) * 2); g.scale(s, s);
    g.fillStyle = '#7A4A2E'; g.beginPath(); g.moveTo(-34, 0); g.lineTo(34, 0); g.lineTo(24, 12); g.lineTo(-24, 12); g.closePath(); g.fill();
    g.fillStyle = k % 2 ? '#FFFFFF' : '#FFE6C8'; g.beginPath(); g.moveTo(2, -4); g.lineTo(2, -72); g.lineTo(36, -6); g.closePath(); g.fill();
    g.fillStyle = k % 3 ? '#F07A2E' : '#E8455C'; g.beginPath(); g.moveTo(-2, -6); g.lineTo(-2, -58); g.lineTo(-26, -8); g.closePath(); g.fill();
    g.restore();
  }
  function town(g, t, vac) {
    for (const b of TOWNB) {
      g.fillStyle = vac ? PB[b.i % 5] : '#8B909B'; g.fillRect(b.x, 470 - b.h, b.w, b.h + 140);
      g.fillStyle = vac ? 'rgba(255,255,255,.7)' : '#787D88';
      for (let wy = 470 - b.h + 18; wy < 450; wy += 32) for (let wx = b.x + 12; wx < b.x + b.w - 16; wx += 24) g.fillRect(wx, wy, 11, 15);
    }
    for (const b of TOWNF) {
      const y0 = 600 - b.h;
      if (!vac && b.r < 0.22) {   // factory chimneys, grey smoke
        g.fillStyle = '#4C505B'; g.fillRect(b.x + b.w * 0.6, y0 - 90, 26, 90);
        for (let k = 0; k < 4; k++) { const u = mod(t * 0.35 + k * 0.25 + b.i * 0.13, 1); g.fillStyle = `rgba(120,124,134,${0.6 * (1 - u)})`; g.beginPath(); g.arc(b.x + b.w * 0.6 + 13 + u * 60, y0 - 100 - u * 160, 16 + u * 36, 0, 7); g.fill(); }
      }
      g.fillStyle = vac ? PF[b.i % 6] : '#5D626E'; g.fillRect(b.x, y0, b.w, b.h + 130);
      if (b.r > 0.6) { g.fillStyle = vac ? '#B8462E' : '#4A4E58'; g.beginPath(); g.moveTo(b.x - 8, y0 + 1); g.lineTo(b.x + b.w / 2, y0 - 46); g.lineTo(b.x + b.w + 8, y0 + 1); g.closePath(); g.fill(); }
      for (let wy = y0 + 22; wy < 590; wy += 42) for (let wx = b.x + 16; wx < b.x + b.w - 26; wx += 34) {
        g.fillStyle = vac ? '#FFF7E6' : '#464A54'; g.fillRect(wx, wy, 16, 22);
        if (vac && hash(Math.round(wx), Math.round(wy)) > 0.55) { g.fillStyle = '#5BB585'; g.fillRect(wx - 3, wy + 21, 22, 5); g.fillStyle = ['#E8455C', '#F4CE72', '#FFFFFF'][Math.floor(hash(Math.round(wy), Math.round(wx)) * 3)]; g.beginPath(); g.arc(wx + 3, wy + 20, 3.2, 0, 7); g.arc(wx + 12, wy + 19, 3.2, 0, 7); g.fill(); }
      }
    }
    if (vac) for (let k = 0; k + 1 < TOWNF.length; k++) {   // bunting from roof to roof
      const a = TOWNF[k], b = TOWNF[k + 1], pts = K.sagPts(a.x + a.w * 0.5, 600 - a.h + 12, b.x + b.w * 0.5, 600 - b.h + 12, 40, 8);
      g.strokeStyle = 'rgba(70,50,40,.6)'; g.lineWidth = 2; g.beginPath(); pts.forEach(([x, y], j) => j ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
      for (let j = 0; j + 1 < pts.length; j++) { const [x, y] = pts[j], [x2, y2] = pts[j + 1]; g.fillStyle = BCOL[(j + k) % 8]; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.lineTo((x + x2) / 2 + 2, (y + y2) / 2 + 22 + Math.sin(t * 5 + j + k) * 3); g.closePath(); g.fill(); }
    }
  }
  function warScene(g, t) {
    const sky = g.createLinearGradient(0, -725, 0, 470); sky.addColorStop(0, '#5C6373'); sky.addColorStop(0.6, '#8D94A1'); sky.addColorStop(1, '#BABDC5');
    g.fillStyle = sky; g.fillRect(-1200, -725, 2400, 1450);
    CLOUDS3.forEach(([x, y, s], k) => cloud(g, x + mod(t * 10 + k * 300, 400) - 200, y, s, k % 2 ? '#7B8190' : '#878D9A', null));
    // searchlights sweep the sky
    g.save(); g.globalCompositeOperation = 'screen';
    [-920, -330, 420, 980].forEach((x, k) => {
      const a = -Math.PI / 2 + Math.sin(t * 0.9 + k * 1.9) * 0.45, Lb = 1300, sp = 0.06;
      const gr = g.createLinearGradient(x, 460, x + Math.cos(a) * Lb, 460 + Math.sin(a) * Lb); gr.addColorStop(0, 'rgba(255,255,235,.42)'); gr.addColorStop(1, 'rgba(255,255,235,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(x - 8, 460); g.lineTo(x + Math.cos(a - sp) * Lb, 460 + Math.sin(a - sp) * Lb); g.lineTo(x + Math.cos(a + sp) * Lb, 460 + Math.sin(a + sp) * Lb); g.lineTo(x + 8, 460); g.closePath(); g.fill();
    });
    g.restore();
    for (const k of FORDER) { const [x, y] = fleetPos(k, t), s = FLEET[k][2]; g.save(); g.translate(x, y); g.scale(s, s); blimp(g, t, k); g.restore(); }
    // leaflets flutter down
    for (let k = 0; k < 36; k++) {
      const fall = 70 + hash(k, 71) * 60, y = -700 + mod(hash(k, 72) * 1300 + (t - 216) * fall, 1300), x = -1150 + hash(k, 73) * 2300 + Math.sin(t * 1.7 + k) * 40;
      g.save(); g.translate(x, y); g.rotate(Math.sin(t * 2.3 + k * 1.3) * 0.9); g.scale(Math.cos(t * 3.1 + k), 1);
      g.fillStyle = '#E6E7EA'; g.fillRect(-16, -11, 32, 22); g.fillStyle = '#C8323A'; g.beginPath(); g.arc(0, 0, 4.5, 0, 7); g.fill(); g.restore();
    }
    g.fillStyle = '#A3A7AF'; g.fillRect(-1200, 330, 2400, 160);   // haze over the bay
    town(g, t, false);
    g.fillStyle = '#41444D'; g.fillRect(-1200, 600, 2400, 125);
  }
  function flagship(g, x, y, t) {
    const bp = eOut5(P(t, BFLIP + 0.55, BFLIP + 1.15)), bx = x - 330, by = y + 330;
    if (bp > 0) {
      g.strokeStyle = '#8A5A3A'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 10, y + 272); g.lineTo(bx + 30, by); g.stroke();
      g.save(); g.translate(bx, by); g.beginPath(); g.rect(-640 * bp, -60, 660, 130); g.clip();
      g.fillStyle = '#FFF6E8'; g.beginPath(); g.moveTo(0, -40); for (let k = 0; k <= 12; k++) g.lineTo(-k * 50, -40 + Math.sin(t * 6 + k) * 8); g.lineTo(-600, 40 + Math.sin(t * 6 + 12) * 8); for (let k = 12; k >= 0; k--) g.lineTo(-k * 50, 40 + Math.sin(t * 6 + k) * 8); g.closePath(); g.fill();
      EP.txt(g, 'WORLD VACATION', -300, 16, { font: EP.font(900, 52, F.ui), color: '#E8455C', ls: '4px' });
      g.restore();
    }
    K.balloon(g, x, y - 60, 2.9, t, ['#F07A2E', '#FFF6E8', '#2F8F8A', '#FFF6E8', '#E8455C'], 3);
  }
  function vacScene(g, t) {
    const sky = g.createLinearGradient(0, -725, 0, 340); sky.addColorStop(0, '#4FB0EA'); sky.addColorStop(0.62, '#A3DBF3'); sky.addColorStop(1, '#FFE6BA');
    g.fillStyle = sky; g.fillRect(-1200, -725, 2400, 1450);
    g.save(); g.globalCompositeOperation = 'screen'; EP.glowDot(g, 640, -560, 460, 'rgba(255,244,200,.95)', 'rgba(255,205,130,.32)'); g.restore();
    g.fillStyle = '#FFE58A'; g.beginPath(); g.arc(640, -560, 100, 0, 7); g.fill();
    CLOUDS3.forEach(([x, y, s], k) => cloud(g, x + mod(t * 10 + k * 300, 400) - 200, y, s, '#FFFFFF', '#FFFDF6'));
    // the sea and its sails
    g.fillStyle = '#35AFC6'; g.fillRect(-1200, 330, 2400, 160);
    g.fillStyle = 'rgba(255,255,255,.4)'; for (let k = 0; k < 16; k++) { const y = 344 + (k % 5) * 22, x = -1250 + mod(hash(k, 81) * 2500 + t * 18, 2500); g.fillRect(x, y, 50 + hash(k, 82) * 90, 3); }
    for (let k = 0; k < 7; k++) sail(g, -1150 + mod(hash(k, 83) * 2300 + (t - 218) * (14 + k * 4), 2300), 372 + hash(k, 84) * 40, 0.7 + hash(k, 85) * 0.5, k, t);
    // the fleet, balloons now, rising; more balloons come up from behind the town
    for (let k = 0; k < 9; k++) { const u = t - (BFLIP + 0.6 + k * 0.2); if (u <= 0) continue; K.balloon(g, -1100 + k * 270 + Math.sin(u + k) * 30, 640 - u * (150 + k * 14), 0.55 + hash(k, 3) * 0.35, t, BALC[(k + 2) % 5], k + 9); }
    for (const k of FORDER) { const [x, y] = fleetPos(k, t); if (k === 0) flagship(g, x, y, t); else K.balloon(g, x, y - 40 * FLEET[k][2], FLEET[k][2] * 2.7, t, BALC[k % 5], k); }
    for (let k = 0; k < 8; k++) K.bird(g, -1300 + mod(hash(k, 91) * 2600 + (t - 218) * (80 + k * 8), 2700), -560 + hash(k, 92) * 380 + Math.sin(t * 1.4 + k) * 20, 0.8 + hash(k, 93) * 0.4, t, k);
    town(g, t, true);
    g.fillStyle = '#EBCB9C'; g.fillRect(-1200, 600, 2400, 125);   // the promenade
    g.fillStyle = 'rgba(160,110,60,.25)'; for (let x = -1200; x < 1200; x += 60) g.fillRect(x, 600, 3, 125);
  }
  let CW = null, CV = null;
  spread('C3c', 96800, -100, 2400, 1450, 'day', -0.006, (g, t) => {
    PA.drawCard(g, PA.card('C3c', 2400, 1450, { tex: '#CFE8F6', r: 8, edge: 0.2 }), 0, 0);
    g.save(); g.beginPath(); g.roundRect(-1188, -713, 2376, 1426, 6); g.clip();
    if (t < BFLIP) warScene(g, t);
    else if (t >= FLIPEND) vacScene(g, t);
    else {
      // both sides rendered at 0.8 scale, then the page turns over in slats
      if (!CW) { CW = EP.mk(1920, 1160); CV = EP.mk(1920, 1160); }
      const a = CW.getContext('2d'), b = CV.getContext('2d');
      EP.reset(a); a.setTransform(0.8, 0, 0, 0.8, 960, 580); warScene(a, t);
      EP.reset(b); b.setTransform(0.8, 0, 0, 0.8, 960, 580); vacScene(b, t);
      g.fillStyle = '#6E7380'; g.fillRect(-1200, -725, 2400, 1450);   // the backs of the slats' frame
      for (let i = 0; i < NSL; i++) {
        const p = slatP(t, i), th = eIO(p) * Math.PI, cs = Math.cos(th), f = Math.abs(cs); if (f < 0.012) continue;
        const cx = -1200 + (i + 0.5) * SLW, dw = SLW * f, dh = 1450 * (1 + 0.035 * Math.sin(th));
        g.drawImage(cs >= 0 ? CW : CV, i * SLW * 0.8, 0, SLW * 0.8, 1160, cx - dw / 2, -dh / 2, dw + 0.6, dh);
        const sh = (1 - f) * 0.5; if (sh > 0.01) { g.fillStyle = `rgba(16,12,24,${sh})`; g.fillRect(cx - dw / 2, -dh / 2, dw, dh); }
        if (p > 0 && p < 1) { g.fillStyle = `rgba(255,255,255,${0.5 * Math.sin(th)})`; g.fillRect(cs >= 0 ? cx + dw / 2 - 4 : cx - dw / 2, -dh / 2, 4, dh); }
      }
    }
    g.restore();
    PA.drawCard(g, PA.card('st106', 1250, 330, { tex: 'white', torn: 'lr', sa: 0.45 }), -470, -500, -0.008); PA.tape(g, -1040, -650, 150, -0.5, undefined, 40, 613);
    KT.draw(g, dC106, t); KT.draw(g, dC107, t); KT.draw(g, dC108, t);
    PA.stamp(g, 'APPROVED', 330, 470, t - (Wd(108, 2) - 0.12), { px: 120, col: '#E0332A', rot: -0.12, comp: 'source-over', alpha: 0.95 });
    STK.draw(g, 'spr_cheer', 960, 730, 720, { t, peel: P(t, L(106) - 0.1, L(106) + 0.3), sway: 1, bob: 14, T: t });
  }, { img: ['cut/spr_cheer'], screen: (g, t) => { if (t > Wd(108, 2)) EP.FX.confetti(g, t, { t0: Wd(108, 2), n: 110 }); } });

  // ================================================================== P3 · the street at dusk (the camera walks along it)
  // An advent-calendar street. Its layers slide at their own speeds (clouds, far hills, the town behind, the street,
  // bushes in front). Every window has paper shutters, and as Claude walks past they swing open on the beat, each onto
  // somebody's free life (the photos). Street lamps and string lights come on, the office tower goes dark and its people
  // pour out, night falls, fireworks on "everybody lives forever", lanterns on "everybody's free", and the NO! man at
  // the end of the street gets Claude's own lantern.
  const SW = 5400, P3X = 100800, ST0 = 224.2, ST1 = 239.6, BASE = 430;
  const dusk = t => P(t, ST0 + 1.2, ST1 - 4.5);
  const OFFICE = { x: 150, w: 360, h: 760 };
  const PHOTOS = [['bg_free_dance', 0.33, 0.45], ['bg_hug_read', 0.42, 0.5], ['bg_feast', 0.55, 0.45], ['bg_old_man', 0.5, 0.45], ['bg_painter', 0.78, 0.38], ['bg_daughter', 0.35, 0.5],
    ['bg_cake', 0.5, 0.45], ['bg_kid_bed', 0.38, 0.5], ['bg_free_garden', 0.45, 0.45], ['bg_110', 0.42, 0.55], ['bg_mom_relief', 0.42, 0.45], ['bg_free_beach', 0.62, 0.6]];
  const HCOL = ['#F2E3CC', '#E9C3A0', '#F4D7A8', '#D9C2AE', '#EBD3DA', '#CFE0D4'], RCOL = ['#C8562C', '#8E3A2A', '#B8742A', '#5A6075', '#7A4A6A', '#3F7A6E'], SCOL = ['#2F8F8A', '#D23A2C', '#2B3990', '#E8A62A', '#C2357A', '#5BB585'];
  const TYPES = ['gable', 'shop', 'tall', 'gable', 'balcony', 'shop', 'gable', 'tall', 'balcony', 'gable', 'shop', 'tall', 'gable', 'balcony', 'gable', 'shop', 'tall', 'gable'];
  const STREET = [];
  { let x = -SW / 2 + 80, i = 0, ph = 0;
    while (x < SW / 2 - 320) {
      if (x + 340 > OFFICE.x - 40 && x < OFFICE.x + OFFICE.w + 40) { x = OFFICE.x + OFFICE.w + 60; continue; }
      const type = TYPES[i % TYPES.length];
      const w = { gable: 270, shop: 320, tall: 250, balcony: 290 }[type] + hash(i, 4) * 30, h = { gable: 360, shop: 300, tall: 520, balcony: 420 }[type] + hash(i, 5) * 50;
      const b = { x, w, h, type, i, col: HCOL[i % 6], roof: RCOL[(i * 5) % 6], sh: SCOL[(i * 7) % 6], wins: [] };
      const add = (fx, cy, ww, wh, photo) => { const o = { cx: x + w * fx, cy: BASE - cy, ww, wh, photo }; if (photo) { const p = PHOTOS[ph++ % PHOTOS.length]; o.ph = p[0]; o.fx = p[1]; o.fy = p[2]; } else o.kind = (i + b.wins.length) % 4; b.wins.push(o); };
      if (type === 'gable') { add(0.3, 180, 112, 98, true); add(0.7, 180, 112, 98, true); add(0.5, h - 64, 60, 52, false); }
      else if (type === 'shop') add(0.38, 150, 196, 116, true);
      else if (type === 'tall') { add(0.3, 160, 92, 86, true); add(0.7, 160, 92, 86, true); add(0.3, 300, 70, 66, false); add(0.7, 300, 70, 66, false); add(0.3, 430, 70, 66, false); add(0.7, 430, 70, 66, false); }
      else { add(0.3, 175, 104, 96, true); add(0.7, 175, 104, 96, true); add(0.5, 330, 120, 86, false); }
      STREET.push(b); x += w + 34 + hash(i, 7) * 40; i++;
    }
  }
  // the man with the NO! sign (post-chorus 2) lives in the window nearest x = 2050, just past where Claude stops;
  // his shutters open on "Especially"
  const NOWIN = STREET.flatMap(b => b.wins).filter(w => w.photo).reduce((a, w) => Math.abs(w.cx - 2050) < Math.abs(a.cx - 2050) ? w : a);
  NOWIN.noman = true;
  // string lights along the eaves, house to house
  const GAR = [];
  STREET.forEach((b, k) => {
    const ey = b.type === 'gable' ? BASE - b.h + 14 : BASE - b.h + 34, segs = [[b.x + 8, ey, b.x + b.w - 8, ey, 26]], nb = STREET[k + 1];
    if (nb && nb.x - (b.x + b.w) < 140) segs.push([b.x + b.w - 8, ey, nb.x + 8, nb.type === 'gable' ? BASE - nb.h + 14 : BASE - nb.h + 34, 48]);
    segs.forEach(([x0, y0, x1, y1, sag]) => { const n = Math.max(3, Math.round(Math.hypot(x1 - x0, y1 - y0) / 34)); GAR.push({ b, pts: K.sagPts(x0, y0, x1, y1, sag, n) }); });
  });
  const BULB = ['#FFE7A8', '#FF9E6A', '#9FE0C8', '#FFB3C7', '#FFD27A'];
  const PEOPLE = [];
  for (let k = 0; k < 30; k++) { const v = (hash(k, 42) < 0.5 ? -1 : 1) * (30 + hash(k, 43) * 40), x0 = -SW / 2 + hash(k, 41) * SW, kid = k % 7 === 3;
    PEOPLE.push({ x0, v, s: kid ? 1.55 : 2.1 + hash(k, 44) * 0.6, col: K.pcol(k), k, y: BASE + 30 + hash(k, 45) * 24, kid, bcol: BULB[k % 5] });
    if (k % 6 === 1) PEOPLE.push({ x0: x0 + 30 * Math.sign(-v), v, s: 2.2, col: K.pcol(k + 4), k: k + 40, y: BASE + 36 + hash(k, 45) * 24 }); }
  PEOPLE.sort((a, b) => a.y - b.y);
  const FW = [[233.17, -620, -250, '#FFD27A'], [233.59, 300, -300, '#FF8FA3'], [234.03, -160, -200, '#9FE0C8'], [234.48, 700, -260, '#F07A2E'], [234.92, -560, -300, '#FFFFFF'], [235.78, -120, -260, '#E9A0B4'], [236.66, -700, -280, '#FFD27A'], [238.38, 700, -560, '#9FE0C8']];
  // when things happen depends on where the camera is (worked out once, from the camera path)
  let SCHED = null;
  function schedule() {
    if (SCHED) return SCHED;
    const cam = []; for (let t = 223.9; t <= 239.7; t += 0.02) cam.push([t, WD.cam(t).x - P3X]);
    const camAt = x => { const h = cam.find(([, cx]) => cx >= x); return h ? h[0] : 1e9; }, camX = t => { const h = cam.find(([tt]) => tt >= t); return h ? h[1] : 0; };
    const BE = EP.T.beats, wins = STREET.flatMap(b => b.wins).sort((a, b) => a.cx - b.cx);
    let early = 0;
    for (const w of wins) {
      let at = camAt(w.cx - 560);
      if (at < L(110)) at = L(110) + 0.04 + (early++) * 0.2;
      else { const b = BE.find(x => x >= at); if (b !== undefined && b - at < 0.45) at = b; }
      w.at = at + (w.photo ? -0.02 : 0.12);
    }
    NOWIN.at = Wd(115, 0) + 0.05;
    STREET.forEach(b => { b.on = Math.min(...b.wins.map(w => w.at)); });
    return (SCHED = { fwx: FW.map(([t0, dx]) => camX(t0) + dx), lx: Array.from({ length: 36 }, (_, k) => camX(Wd(114, 0) - 0.2 + k * 0.085) + (hash(k, 31) - 0.5) * 2100) });
  }
  function house(g, b, t, dk) {
    const x = b.x, y = BASE - b.h, w = b.w, wall = mixc(b.col, '#3A3450', dk * 0.72), roofc = mixc(b.roof, '#221C2C', dk * 0.6), trim = mixc('#FFF8EC', '#6A6080', dk * 0.6), shc = mixc(b.sh, '#2A2236', dk * 0.55);
    g.fillStyle = 'rgba(10,6,20,.22)'; g.fillRect(x + 10, y + 10, w, b.h);
    if (b.type === 'gable' && b.i % 2 === 0) {   // chimney with smoke
      g.fillStyle = roofc; g.fillRect(x + w * 0.72, y - 96, 34, 90);
      for (let k = 0; k < 4; k++) { const u = mod(t * 0.4 + k * 0.25 + b.i * 0.1, 1); g.fillStyle = `rgba(${dk > 0.5 ? '120,110,140' : '255,246,236'},${0.45 * (1 - u)})`; g.beginPath(); g.arc(x + w * 0.72 + 17 + u * 50, y - 110 - u * 130, 12 + u * 26, 0, 7); g.fill(); }
    }
    g.fillStyle = wall; g.fillRect(x, y, w, b.h);
    if (b.type === 'gable' || b.type === 'balcony') { g.fillStyle = roofc; g.beginPath(); g.moveTo(x - 18, y + 2); g.lineTo(x + w / 2, y - (b.type === 'gable' ? 110 : 70)); g.lineTo(x + w + 18, y + 2); g.closePath(); g.fill(); g.fillStyle = trim; g.fillRect(x - 18, y - 2, w + 36, 8); }
    else { g.fillStyle = roofc; g.fillRect(x - 10, y - 18, w + 20, 24); }
    if (b.type === 'tall') { g.fillStyle = mixc('#8A6A5A', '#1E1828', dk * 0.7); g.fillRect(x + w * 0.62, y - 70, 50, 52); g.fillRect(x + w * 0.62 + 6, y - 82, 38, 14); }
    if (b.type === 'shop') {   // striped awning and a painted sign
      const ay = BASE - 236; g.fillStyle = trim; g.fillRect(x + 10, ay - 64, w - 20, 50); g.fillStyle = shc; g.fillRect(x + 18, ay - 56, w - 36, 34);
      g.fillStyle = trim; const ic = b.i % 3, sx = x + w / 2, sy = ay - 39;
      if (ic === 0) { g.fillRect(sx - 16, sy - 10, 26, 22); g.beginPath(); g.arc(sx + 12, sy, 8, -1.6, 1.6); g.lineWidth = 4; g.strokeStyle = trim; g.stroke(); }
      else if (ic === 1) { g.beginPath(); g.moveTo(sx - 16, sy); g.lineTo(sx + 16, sy); g.lineTo(sx + 11, sy + 16); g.lineTo(sx - 11, sy + 16); g.closePath(); g.fill(); g.beginPath(); g.arc(sx, sy - 2, 17, Math.PI, 0); g.fill(); g.fillStyle = '#E8455C'; g.beginPath(); g.arc(sx, sy - 21, 5, 0, 7); g.fill(); }
      else { g.fillRect(sx - 22, sy - 12, 20, 26); g.fillRect(sx + 2, sy - 12, 20, 26); }
      for (let k = 0; k * 32 < w; k++) { g.fillStyle = k % 2 ? trim : shc; g.fillRect(x + k * 32, ay, Math.min(32, w - k * 32), 30); g.beginPath(); g.arc(x + k * 32 + 16, ay + 30, 16, 0, Math.PI); g.fill(); }
    }
    if (b.type === 'balcony') { const ry = BASE - 280; g.fillStyle = trim; g.fillRect(x + w * 0.5 - 92, ry, 184, 8); for (let k = 0; k <= 8; k++) g.fillRect(x + w * 0.5 - 90 + k * 22.5, ry, 4, 40); g.fillRect(x + w * 0.5 - 92, ry + 38, 184, 6);
      for (let k = 0; k < 4; k++) { const px = x + w * 0.5 - 78 + k * 50; g.fillStyle = mixc('#B86A42', '#2A1A18', dk * 0.7); g.fillRect(px, ry - 22, 26, 22); g.fillStyle = mixc('#5BB585', '#1C3026', dk * 0.7); g.beginPath(); g.arc(px + 13, ry - 30, 15, 0, 7); g.fill(); g.fillStyle = mixc(['#E8455C', '#F4CE72', '#FFFFFF', '#E9A0B4'][k], '#4A4060', dk * 0.6); g.beginPath(); g.arc(px + 8, ry - 36, 5, 0, 7); g.arc(px + 19, ry - 30, 5, 0, 7); g.fill(); } }
    // the door
    const dx = b.type === 'shop' ? x + w * 0.82 : x + w * 0.5, dw = 58, dh = 104;
    g.fillStyle = trim; g.beginPath(); g.roundRect(dx - dw / 2 - 6, BASE - dh - 6, dw + 12, dh + 6, [30, 30, 0, 0]); g.fill();
    g.fillStyle = shc; g.beginPath(); g.roundRect(dx - dw / 2, BASE - dh, dw, dh, [26, 26, 0, 0]); g.fill();
    g.fillStyle = dk > 0.3 && t > b.on ? mixc('#FFE7A8', '#FFD27A', 0.5) : mixc('#FFF6E0', '#4A4060', dk); g.beginPath(); g.arc(dx, BASE - dh + 30, 12, 0, 7); g.fill();
    g.fillStyle = '#E8B54A'; g.beginPath(); g.arc(dx + dw / 2 - 12, BASE - 50, 4, 0, 7); g.fill();
    for (const wn of b.wins) win(g, wn, b, t, dk, trim, shc);
  }
  function win(g, w, b, t, dk, trim, shc) {
    const x0 = w.cx - w.ww / 2, y0 = w.cy - w.wh / 2, on = P(t, w.at, w.at + 0.18);
    g.fillStyle = trim; g.fillRect(x0 - 7, y0 - 7, w.ww + 14, w.wh + 14);
    if (w.photo) {
      if (w.noman) noMan(g, w, t, dk, on);
      else if (on > 0) { const im = EP.img[w.ph]; if (im) { const [sx, sy, sw, sh] = K.crop(im, w.ww, w.wh, w.fx, w.fy, 1.15); g.drawImage(im, sx, sy, sw, sh, x0, y0, w.ww, w.wh); } }
      else { g.fillStyle = mixc('#5A6075', '#232338', dk); g.fillRect(x0, y0, w.ww, w.wh); }
      if (!w.noman && on > 0 && on < 1) { g.fillStyle = `rgba(255,236,190,${0.55 * (1 - on)})`; g.fillRect(x0, y0, w.ww, w.wh); }
      // paper shutters swing open (#021), a little overshoot on the beat
      const p = clamp(backOut(P(t, w.at - 0.05, w.at + 0.4), 1.6), 0, 1.08), th = Math.min(p, 1) * Math.PI * 0.94, cs = Math.cos(th), sw2 = w.ww / 2 * Math.abs(cs);
      if (sw2 > 1) for (const side of [-1, 1]) {
        const hx = side < 0 ? x0 : x0 + w.ww, inward = cs >= 0, sx0 = inward ? (side < 0 ? hx : hx - sw2) : (side < 0 ? hx - sw2 - 6 : hx + 6);
        g.fillStyle = inward ? shc : mixc(shc, '#FFFFFF', 0.22); g.fillRect(sx0, y0 - 2, sw2, w.wh + 4);
        g.fillStyle = 'rgba(0,0,0,.2)'; for (let yy = y0 + 8; yy < y0 + w.wh - 4; yy += 11) g.fillRect(sx0 + 3, yy, Math.max(0, sw2 - 6), 3);
      }
      g.fillStyle = mixc('#5BB585', '#1C3026', dk * 0.7); g.fillRect(x0 - 4, y0 + w.wh + 7, w.ww + 8, 14);   // flower box
      for (let k = 0; k < 6; k++) { g.fillStyle = mixc(['#E8455C', '#F4CE72', '#FFFFFF', '#E9A0B4'][(k + b.i) % 4], '#4A4060', dk * 0.6); g.beginPath(); g.arc(x0 + 6 + k * (w.ww - 12) / 5, y0 + w.wh + 6, 6, 0, 7); g.fill(); }
    } else {
      g.fillStyle = on > 0 ? mixc(mixc('#5A6075', '#2A2A40', dk), '#FFD27A', on) : mixc('#5A6075', '#2A2A40', dk); g.fillRect(x0, y0, w.ww, w.wh);
      if (on > 0) {   // a little silhouette in the lit window
        g.save(); g.beginPath(); g.rect(x0, y0, w.ww, w.wh); g.clip(); g.fillStyle = 'rgba(60,40,50,.7)'; const cx = w.cx, by = y0 + w.wh, bob = Math.sin(t * 5 + b.i) * 3, s = w.ww / 72;
        if (w.kind === 0) { g.beginPath(); g.arc(cx - 12 * s, by - 34 * s + bob, 9 * s, 0, 7); g.arc(cx + 12 * s, by - 34 * s - bob, 9 * s, 0, 7); g.fill(); g.fillRect(cx - 22 * s, by - 24 * s, 44 * s, 30 * s); }
        else if (w.kind === 1) { g.beginPath(); g.arc(cx, by - 36 * s, 10 * s, 0, 7); g.fill(); g.fillRect(cx - 12 * s, by - 26 * s, 24 * s, 30 * s); }
        else if (w.kind === 2) { g.beginPath(); g.arc(cx - 6 * s, by - 26 * s, 9 * s, 0, 7); g.arc(cx + 10 * s, by - 20 * s, 6 * s, 0, 7); g.fill(); }
        else { g.beginPath(); g.ellipse(cx, by - 10 * s, 20 * s, 11 * s, 0, 0, 7); g.arc(cx + 14 * s, by - 22 * s, 8 * s, 0, 7); g.fill(); }
        g.restore();
      }
      g.fillStyle = trim; g.fillRect(w.cx - 2, y0, 4, w.wh); g.fillRect(x0, w.cy - 2, w.ww, 4);
    }
    if (on > 0 && dk > 0.05) { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = on * (0.2 + 0.6 * dk); EP.glowDot(g, w.cx, w.cy, w.ww * 1.25, 'rgba(255,210,130,.75)', 'rgba(255,160,80,.22)'); g.restore(); }
  }
  // the NO! man: shakes his sign at the street; when Claude's lantern reaches him he lowers it and waves
  const NOWAVE = Wd(115, 4) + 0.3;
  function noMan(g, w, t, dk, on) {
    const x0 = w.cx - w.ww / 2, y0 = w.cy - w.wh / 2;
    g.fillStyle = on > 0 ? mixc('#7A5A6A', '#FFC98A', on) : mixc('#5A6075', '#232338', dk); g.fillRect(x0, y0, w.ww, w.wh);
    if (on <= 0) return;
    g.save(); g.beginPath(); g.rect(x0, y0, w.ww, w.wh); g.clip();
    const waved = t > NOWAVE, px = w.cx - 14, py = y0 + w.wh + 6;
    K.person(g, px, py, 2.2, '#5A6075', t, 5, waved ? 1 : 0);
    if (!waved || t < NOWAVE + 0.5) {   // the sign, shaken, then dropped
      const dp = eIn(P(t, NOWAVE, NOWAVE + 0.5)), sh = waved ? 0 : Math.sin(t * 16) * 0.12;
      g.save(); g.translate(px + 30, py - 70 + dp * 90); g.rotate(sh + dp * 0.8);
      g.fillStyle = '#5A3B2E'; g.fillRect(-2, 0, 4, 34); g.fillStyle = '#FFFFFF'; g.fillRect(-30, -30, 60, 36);
      EP.txt(g, 'NO!', 0, -4, { font: EP.font(900, 24, F.ui), color: '#D23A2C' }); g.restore();
    }
    if (waved) { const hp = EP.pop(t - NOWAVE - 0.2); if (hp.sc > 0.01) { g.save(); g.translate(px, py - 118); g.scale(hp.sc, hp.sc); g.fillStyle = '#E8455C'; EP.heartPath(g, 14); g.fill(); g.restore(); } }
    g.restore();
  }
  function lantern(g, x, y, s, t, k, a = 1) {
    g.save(); g.translate(x, y); g.scale(s, s); g.rotate(Math.sin(t * 1.7 + k) * 0.08);
    g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = a; EP.glowDot(g, 0, 0, 90, 'rgba(255,190,110,.85)', 'rgba(255,140,60,.28)'); g.restore();
    g.fillStyle = '#FFB45E'; g.beginPath(); g.moveTo(-17, -24); g.quadraticCurveTo(-25, 0, -15, 24); g.lineTo(15, 24); g.quadraticCurveTo(25, 0, 17, -24); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,244,210,.75)'; g.beginPath(); g.ellipse(0, 4, 8, 14, 0, 0, 7); g.fill();
    g.fillStyle = '#8A3A22'; g.fillRect(-12, -27, 24, 5); g.fillRect(-10, 23, 20, 5);
    g.restore();
  }
  function lamp(g, x, t, dk, k) {
    const on = P(t, L(111) + 0.1 + k * 0.05, L(111) + 0.3 + k * 0.05) * (0.93 + 0.07 * Math.sin(t * 23 + k)), pc = mixc('#4A3E4A', '#120E18', dk);
    g.fillStyle = pc; g.fillRect(x - 6, BASE - 330, 12, 380); g.fillRect(x - 16, BASE + 36, 32, 14);
    g.beginPath(); g.moveTo(x - 30, BASE - 330); g.lineTo(x + 30, BASE - 330); g.lineTo(x + 20, BASE - 384); g.lineTo(x - 20, BASE - 384); g.closePath(); g.fill();
    g.fillStyle = on > 0 ? mixc('#8A8070', '#FFE2A0', on) : '#8A8070'; g.fillRect(x - 17, BASE - 376, 34, 40);
    if (on > 0) { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = on * (0.35 + 0.65 * dk); EP.glowDot(g, x, BASE - 356, 250, 'rgba(255,214,140,.85)', 'rgba(255,170,90,.2)');
      g.translate(x, BASE + 42); g.scale(1, 0.22); EP.glowDot(g, 0, 0, 280, 'rgba(255,214,140,.6)', 'rgba(255,170,90,.15)'); g.restore(); }
  }
  function firework(g, x, y, u, col, seed) {
    const RISE = 0.45;
    if (u < RISE) { const p = eOut(u / RISE), yy = lerp(BASE - 40, y, p); for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(255,230,180,${0.5 - k * 0.08})`; g.beginPath(); g.arc(x + Math.sin((u - k * 0.03) * 30) * 3, yy + k * 16, 4 - k * 0.5, 0, 7); g.fill(); } return; }
    const v = u - RISE; if (v > 2.2) return;
    const n = 34, R = 280 * (1 - Math.exp(-v * 3.2)), fall = 70 * v * v, a = Math.pow(1 - v / 2.2, 1.3);
    g.save(); g.globalCompositeOperation = 'screen';
    EP.glowDot(g, x, y + fall * 0.3, 300 * a + 40, `rgba(255,240,200,${0.45 * a})`, `rgba(255,170,90,${0.16 * a})`);
    g.strokeStyle = col; g.fillStyle = '#FFFFFF'; g.lineCap = 'round';
    for (let k = 0; k < n; k++) {
      const ang = k / n * EP.TAU + hash(k, seed) * 0.12, rr = R * (0.82 + hash(k, seed + 1) * 0.3), px = x + Math.cos(ang) * rr, py = y + Math.sin(ang) * rr + fall, tail = 46 * a + 6;
      g.globalAlpha = a; g.lineWidth = 5 * a + 1.5; g.beginPath(); g.moveTo(px - Math.cos(ang) * tail, py - Math.sin(ang) * tail - 8 * v); g.lineTo(px, py); g.stroke();
      if (k % 3 === 0) { EP.star(g, px, py, 7 * a + 2.5, v * 4 + k, 0.45, 5); g.fill(); }
    }
    g.restore();
  }
  function bush(g, x, y, s, k, t, dk) {
    const col = mixc(['#3E7A52', '#2F6A4A', '#4A8A5A'][k % 3], '#0C1612', dk * 0.82), hi = mixc('#6AA874', '#1A2C24', dk * 0.82);
    g.save(); g.translate(x, y); g.scale(s, s);
    if (k % 4 === 3) { g.fillStyle = mixc('#B86A42', '#24161A', dk * 0.8); g.beginPath(); g.moveTo(-80, 0); g.lineTo(80, 0); g.lineTo(96, -110); g.lineTo(-96, -110); g.closePath(); g.fill(); g.translate(0, -110); g.scale(0.7, 0.7); }
    g.fillStyle = col; g.beginPath(); g.arc(-70, -90, 90, 0, 7); g.arc(30, -122, 110, 0, 7); g.arc(112, -70, 80, 0, 7); g.rect(-150, -90, 330, 90); g.fill();
    g.fillStyle = hi; g.beginPath(); g.arc(4, -176, 40, 0, 7); g.arc(-90, -140, 26, 0, 7); g.fill();
    for (let j = 0; j < 9; j++) { g.fillStyle = mixc(['#FF8FA3', '#F4CE72', '#FFFFFF'][j % 3], '#3A3048', dk * 0.75); g.beginPath(); g.arc(-120 + hash(j, k + 80) * 260, -40 - hash(j, k + 81) * 170, 9, 0, 7); g.fill(); }
    g.restore();
  }
  const pd = (i, x, y, w, px, emph = {}) => ({ i, x, y, w, px, style: 'serif', col: '#FFF6E8', glow: 'rgba(0,0,0,.6)', emph, zhCol: '#EDE4D8', zh: { px: 26 } });
  const dP109 = pd(109, -2150, -440, 1100, 72, { 'forever': { italic: true, col: '#F4CE72', w: 900 } });
  const dP110 = pd(110, -1500, -300, 1100, 72, { 'free': { style: 'marker', col: '#9FE0C8', big: 1.3 } });
  const dP111 = pd(111, -900, -560, 1100, 68, { 4: { hl: '#F4CE72' }, 5: { hl: '#F4CE72' }, 6: { hl: '#F4CE72', italic: true } });
  const dP112 = pd(112, -350, -400, 1100, 68, { 3: { style: 'type', col: '#C8C0D0', strike: Wd(112, 5) + 0.3 }, 4: { style: 'type', col: '#C8C0D0', strike: Wd(112, 5) + 0.35 }, 5: { style: 'type', col: '#C8C0D0', strike: Wd(112, 5) + 0.4 } });
  const dP113 = pd(113, 300, -560, 1100, 74, { 'everybody': { style: 'cut', cols: ['#F07A2E', '#F4CE72', '#E9A0B4', '#9FE0C8', '#FFF6E8', '#F07A2E', '#F4CE72', '#E9A0B4', '#9FE0C8'] }, 'forever': { italic: true, col: '#F4CE72', w: 900 } });
  const dP114 = pd(114, 850, -400, 1000, 72, { 2: { style: 'marker', col: '#9FE0C8', big: 1.3 } });
  const dP115 = pd(115, 900, -250, 1500, 70, { 0: { style: 'marker', col: '#F4CE72', big: 1.15 }, 'disagree': { col: '#FF8A7A', italic: true, w: 900 } });
  // Claude walks the street: running, then lifting her lantern for the fireworks, then waving to the NO! man
  const CL0 = ST0 + 0.2, CL1 = ST1 - 0.5, clX = t => lerp(-1950, 1600, P(t, CL0, CL1)), F1 = L(113) - 0.35, F2 = Wd(115, 3) - 0.15;
  spread('P3', P3X, 0, SW, 1450, t => 0.15 + 0.75 * dusk(t), 0, (g, t, c) => {
    const S = schedule(), dk = dusk(t), camL = c.x - P3X;
    g.save(); g.beginPath(); g.roundRect(-SW / 2, -725, SW, 1450, 10); g.clip();
    // sky, stars, sun and moon (far layers follow the camera part of the way, so they slide past slower)
    const c0 = mixc('#E98D5E', '#0E1336', dk), c1 = mixc('#F7B27A', '#232E68', dk), sky = g.createLinearGradient(0, -725, 0, 430);
    sky.addColorStop(0, c0); sky.addColorStop(0.45, c1); sky.addColorStop(0.8, mixc('#FFD7A8', '#46397A', dk)); sky.addColorStop(1, mixc('#FFE9C8', '#6A4A7A', dk));
    g.fillStyle = sky; g.fillRect(-SW / 2, -725, SW, 1450);
    if (dk > 0.35) for (let k = 0; k < 110; k++) { const x = camL * 0.95 + (hash(k, 21) - 0.5) * 2900, y = -700 + hash(k, 22) * 720, tw = 0.5 + 0.5 * Math.sin(t * 3 + k); g.fillStyle = `rgba(255,246,220,${clamp((dk - 0.35) * 1.6) * (0.35 + 0.65 * tw)})`; g.beginPath(); g.arc(x, y, 1.6 + hash(k, 23) * 3, 0, 7); g.fill(); }
    const sunX = camL * 0.9 - 620, sunY = lerp(-170, 470, dk);
    g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = 1 - dk * 0.7; EP.glowDot(g, sunX, sunY, 520, 'rgba(255,214,150,.9)', 'rgba(255,150,90,.3)'); g.restore();
    g.fillStyle = mixc('#FFE08A', '#FF6A3A', dk); g.beginPath(); g.arc(sunX, sunY, 130, 0, 7); g.fill();
    const mo = P(dk, 0.45, 0.9); if (mo > 0) { const mx = camL * 0.93 + 760, my = -520; g.save(); g.globalAlpha = mo; g.save(); g.globalCompositeOperation = 'screen'; EP.glowDot(g, mx, my, 220, 'rgba(255,246,210,.6)', 'rgba(160,170,255,.15)'); g.restore();
      g.fillStyle = '#F6EDC8'; g.beginPath(); g.arc(mx, my, 62, 0, 7); g.fill(); g.fillStyle = mixc(c0, c1, 0.39); g.beginPath(); g.arc(mx + 26, my - 12, 56, 0, 7); g.fill(); g.restore(); }
    for (let k = 0; k < 10; k++) cloud(g, camL * 0.82 + (hash(k, 51) - 0.5) * 3400 + t * 6, -640 + hash(k, 52) * 320, 0.8 + hash(k, 53) * 0.9, mixc('#FFD3B0', '#2E3266', dk), mixc('#FFF0E0', '#454A86', dk));
    FW.forEach(([t0, , y, col], k) => { const u = t - t0; if (u > 0 && u < 2.7) firework(g, S.fwx[k], y, u, col, k * 7 + 3); });
    // far hills with village lights, then the town behind the street
    [[0.62, 120, 200, '#E7A27F', '#2A2752', 1], [0.45, 230, 160, '#CF8467', '#211E44', 4]].forEach(([kk, base, amp, cd, cn, seed]) => {
      const ox = camL * kk; g.fillStyle = mixc(cd, cn, dk); g.beginPath(); g.moveTo(ox - 2000, 800);
      for (let x = -2000; x <= 2000; x += 40) g.lineTo(ox + x, base - amp * (0.5 + 0.5 * Math.sin(x * 0.0021 + seed) * Math.cos(x * 0.0013 + seed * 2)) - amp * 0.3 * EP.noise(x * 0.004, seed));
      g.lineTo(ox + 2000, 800); g.closePath(); g.fill();
      if (dk > 0.3) for (let j = 0; j < 40; j++) { g.fillStyle = `rgba(255,214,140,${(dk - 0.3) * 1.3 * (0.5 + 0.5 * hash(j, seed + 11))})`; g.fillRect(ox + (hash(j, seed + 9) - 0.5) * 3800, base + 10 + hash(j, seed + 10) * 120, 5, 5); }
    });
    const ox3 = camL * 0.3;
    for (let k = 0; k < 26; k++) {
      const x = ox3 - 2700 + k * 210 + hash(k, 61) * 60, w = 120 + hash(k, 62) * 80, h = 260 + hash(k, 63) * 260, y0 = BASE - 60 - h;
      if (Math.abs(x - camL) > 1600) continue;
      g.fillStyle = mixc('#D99C82', '#2B2850', dk); g.fillRect(x, y0, w, h + 80);
      for (let wy = y0 + 20; wy < BASE - 70; wy += 34) for (let wx = x + 12; wx < x + w - 16; wx += 26) { const q = hash(Math.round(wx * 3 + k), Math.round(wy)); if (q < 0.5 - dk * 0.3) continue; g.fillStyle = q > 1 - dk * 0.6 ? '#FFD58A' : mixc('#E8B8A0', '#3A3866', dk); g.fillRect(wx, wy, 12, 16); }
    }
    // the pavement and the road
    g.fillStyle = mixc('#CDB79C', '#3A3346', dk * 0.85); g.fillRect(-SW / 2, BASE, SW, 64);
    g.fillStyle = 'rgba(0,0,0,.12)'; for (let x = -SW / 2; x < SW / 2; x += 90) g.fillRect(x, BASE, 3, 64);
    g.fillStyle = mixc('#9C8670', '#2A2434', dk); g.fillRect(-SW / 2, BASE + 64, SW, 10);
    g.fillStyle = mixc('#5E524E', '#15111B', dk); g.fillRect(-SW / 2, BASE + 74, SW, 725 - BASE - 74);
    g.fillStyle = mixc('#F2E6C8', '#6A6070', dk); for (let x = -SW / 2; x < SW / 2; x += 160) g.fillRect(x, BASE + 186, 80, 8);
    // the office tower: its lights go out floor by floor on "not who you have to be", then everybody walks out
    const O = OFFICE, offA = Wd(112, 3) - 0.1, OUT0 = Wd(112, 5) + 0.15;
    g.fillStyle = 'rgba(10,6,20,.22)'; g.fillRect(O.x + 12, BASE - O.h + 12, O.w, O.h);
    g.fillStyle = mixc('#8E98AC', '#2A2E46', dk); g.fillRect(O.x, BASE - O.h, O.w, O.h); g.fillStyle = mixc('#6E788C', '#1E2236', dk); g.fillRect(O.x - 10, BASE - O.h - 16, O.w + 20, 22);
    for (let r = 0; r < 13; r++) for (let ci = 0; ci < 6; ci++) { const wx = O.x + 22 + ci * 56, wy = BASE - O.h + 34 + r * 46, k = hash(r * 7 + ci, 91), lit = k > 0.18 && t < offA + r * 0.07 + k * 0.08; g.fillStyle = lit ? '#E4EEFF' : mixc('#5A6075', '#1C2034', dk); g.fillRect(wx, wy, 38, 30); }
    g.fillStyle = mixc('#3A4458', '#10141E', dk); g.fillRect(O.x + O.w / 2 - 58, BASE - 118, 116, 118);
    const od = P(t, OUT0 - 0.3, OUT0); g.fillStyle = od > 0 ? mixc(mixc('#4A5468', '#141826', dk), '#FFD9A0', od) : mixc('#4A5468', '#141826', dk); g.fillRect(O.x + O.w / 2 - 50, BASE - 110, 100, 110);
    if (od > 0) { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = od * (0.3 + 0.6 * dk); EP.glowDot(g, O.x + O.w / 2, BASE - 50, 220, 'rgba(255,210,140,.8)', 'rgba(255,160,80,.2)'); g.restore(); }
    for (const b of STREET) if (b.x + b.w > camL - 1500 && b.x < camL + 1500) house(g, b, t, dk);
    // string lights come on house by house as she reaches them
    for (const gr of GAR) {
      const pts = gr.pts; if (Math.abs(pts[0][0] - camL) > 1500) continue;
      g.strokeStyle = mixc('#5A4A4A', '#1A1420', dk); g.lineWidth = 2; g.beginPath(); pts.forEach(([x, y], j) => j ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
      pts.forEach(([x, y], j) => { if (j === 0 || j === pts.length - 1) return; const on = P(t, gr.b.on + 0.1 + j * 0.025, gr.b.on + 0.2 + j * 0.025), col = BULB[(j + gr.b.i) % 5];
        g.fillStyle = on > 0 ? mixc('#6A6070', col, on) : mixc('#8A8090', '#3A3446', dk); g.beginPath(); g.arc(x, y + 7, 7, 0, 7); g.fill();
        if (on > 0) { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = on * (0.3 + 0.7 * dk); EP.glowDot(g, x, y + 7, 30, col, 'rgba(255,170,90,.18)'); g.restore(); } });
    }
    for (let k = 0; k < 10; k++) { const x = -2560 + k * 640; if (x > O.x - 60 && x < O.x + O.w + 60) continue; if (Math.abs(x - camL) < 1500) lamp(g, x, t, dk, k); }
    // people out for the evening; the office crowd heads home
    for (const p of PEOPLE) {
      const x = mod(p.x0 + p.v * (t - 224) + SW / 2, SW) - SW / 2; if (Math.abs(x - camL) > 1350) continue;
      g.save(); if (p.v < 0) { g.translate(x, 0); g.scale(-1, 1); g.translate(-x, 0); }
      K.person(g, x, p.y, p.s, p.col, t * 0.6, p.k, 3);
      if (p.kid) { const bx = x + 16 * p.s, by = p.y - 74 * p.s + Math.sin(t * 2 + p.k) * 4; g.strokeStyle = 'rgba(60,50,60,.7)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x + 9 * p.s, p.y - 26 * p.s); g.lineTo(bx, by + 13); g.stroke(); g.fillStyle = p.bcol; g.beginPath(); g.ellipse(bx, by, 11, 13, 0, 0, 7); g.fill(); }
      g.restore();
    }
    for (let k = 0; k < 16; k++) { const u = t - (OUT0 + k * 0.14); if (u <= 0) continue; const dir = k % 2 ? 1 : -1, x = O.x + O.w / 2 + dir * (10 + u * (60 + hash(k, 47) * 50)), y = BASE + 30 + (k % 3) * 9;
      g.save(); if (dir < 0) { g.translate(x, 0); g.scale(-1, 1); g.translate(-x, 0); } K.person(g, x, y, 2.1, K.pcol(k + 3), t * 0.6, k + 11, u < 0.9 ? 2 : 3); g.restore(); }
    // lanterns rise from the whole street on "everybody's free"
    for (let k = 0; k < 36; k++) { const u = t - (Wd(114, 0) - 0.2 + k * 0.085); if (u <= 0) continue; const y = BASE - 40 - u * (95 + hash(k, 32) * 70); if (y < -780) continue; lantern(g, S.lx[k] + Math.sin(u * 1.3 + k) * 26, y, 0.9 + hash(k, 33) * 0.6, t, k); }
    // Claude
    const cx = clX(t), o = { t, sway: 0.8, bob: 12, T: t, peel: P(t, ST0 - 0.05, ST0 + 0.35) };
    if (t < F2) STK.draw(g, 'spr_run', cx, 640, 700, Object.assign(o, { flip: { to: 'spr_lantern', p: P(t, F1, F1 + 0.5) } }));
    else STK.draw(g, 'spr_lantern', cx, 640, 700, Object.assign(o, { flip: { to: 'spr_wave', p: P(t, F2, F2 + 0.5) } }));
    // her lantern floats over to the NO! man
    { const u = P(t, F2 + 0.1, NOWAVE), x0 = clX(F2) + 150, y0 = 200; if (t > F2 + 0.1) { const q = eIO(u), x = lerp(x0, NOWIN.cx + 80, q), y = lerp(y0, NOWIN.cy - 40, q) - Math.sin(Math.PI * q) * 160; lantern(g, x + (u >= 1 ? Math.sin(t * 2) * 6 : 0), y + (u >= 1 ? Math.sin(t * 2.6) * 5 : 0), 1.1, t, 99); } }
    // bushes and flower tubs in front (a closer layer: bigger, faster, darker)
    WD.layer(g, 0.22);
    for (let k = 0; k < 18; k++) { const x = -2800 + k * 330 + hash(k, 71) * 120; if (Math.abs(x - camL) < 1300) bush(g, x, 625, 0.75 + hash(k, 72) * 0.4, k, t, dk); }
    WD.layer(g, 0);
    g.restore();
    [dP109, dP110, dP111, dP112, dP113, dP114, dP115].forEach(d => KT.draw(g, d, t));
  }, { img: ['cut/spr_run', 'cut/spr_lantern', 'cut/spr_wave', ...PHOTOS.map(p => p[0])] });

  // ================================================================== camera, impacts, light
  WD.keys.push(
    { t: 202.82, s: 'C3a', dx: 0, dy: -32, z: 0.79, d: 0.5, drift: { z: 0.008 } },
    { t: 209.35, s: 'C3b', dx: 0, dy: -60, z: 0.82, d: 0.6, drift: { z: 0.008 } },
    { t: 215.3, s: 'C3f', dx: 0, dy: -32, z: 0.79, d: 0.45, drift: { z: 0.01 } },
    { t: 218.1, s: 'C3c', dx: 0, dy: -120, z: 0.86, d: 0.45, drift: { z: 0.012 } },
    { t: BFLIP + 0.1, s: 'C3c', dx: 0, dy: -32, z: 0.78, d: 1.25, drift: { z: 0.008 } },
    // the street: a close shot of her singing under the first line, then the walk
    { t: 224.15, x: P3X - 1680, y: -110, z: 1.45, d: 0.5 },
    { t: 224.65, x: P3X - 1480, y: -110, z: 1.45, d: 1.3, e: 'lin' },
    { t: 225.95, x: P3X - 1290, y: -40, z: 0.82, d: 1.0, e: 'lin' },
    { t: 226.95, x: P3X, y: -40, z: 0.82, d: 5.8, e: 'lin' },
    { t: 232.75, x: P3X + 420, y: -170, z: 0.76, d: 1.9, e: 'lin' },
    { t: 234.65, x: P3X + 1450, y: -45, z: 0.8, d: 4.75, e: 'lin' },
  );
  WD.punches.push([202.9, 224.3, 0.016], [232.9, 236.5, 0.01]);
  WD.shakes.push(...PLANS.map(([at]) => [at + 0.08, 0.55]), [BFLIP + 0.3, 0.3], [Wd(108, 2) + 0.1, 0.5], [Wd(105, 6) + 0.1, 0.25]);
  WD.blooms.push([202.9, 205.4, 0.2, 0.3, 0.6], [231.0, 239.9, 0.3, 1.5, 0.4]);
})();
