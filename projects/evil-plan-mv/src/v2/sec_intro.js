// v2/sec_intro.js — intro (0 – 15.3 s). The desk lamp clicks on over the closed dossier; "Hi, I'm Claude" prints out
// of a label maker; the tabloid corkboard ("monster" in ransom letters, red string from a LAST SONG cassette to the
// clippings); "It's not." — Claude snips the strings; back at the folder a caret inserts "different"; "Do you wanna
// hear it?" ☑ YES, and the cover swings open onto page A.
'use strict';
(function () {
  const { W, H, clamp, lerp, P, eIO, eIOs, eOut, eOut5, eIn, backOut, spring, smooth, hash, noise, mod } = EP;
  const PA = EP.PA, STK = EP.STK, KT = EP.KT, WD = EP.WD, K = EP.K, F = EP.F, COL = PA.COL;
  const L = EP.L, Wd = EP.Wd;
  const spread = (id, x, y, w, h, mood, rot, draw, extra = {}) => WD.spreads.push(Object.assign({ id, x, y, w, h, mood, rot, draw }, extra));
  const hit = (lu, k = 1) => lu > 0 && lu < 0.3 ? 1 - 0.06 * k * Math.sin(Math.PI * lu / 0.3) : 1;
  const LAMP = 0.22, OPEN = Wd(5, 4) + 0.02;

  // ================================================================== the closed dossier (drawn above page A until it opens)
  const dC0 = { i: 0, x: -1060, y: -650, w: 1500, px: 100, style: 'label', tape: '#1E1B26', ink: '#FBF6EA', emph: { 2: { tape: COL.tangerine, ink: '#1E1B26' } }, zh: { px: 36, col: '#F4E1C0' } };
  const dC4 = { i: 4, x: -1060, y: 480, w: 1350, px: 58, style: 'type', col: '#2A2440', emph: { 3: { hide: true } }, zh: { px: 30, dy: 118 } };
  const dC5 = { i: 5, x: -770, y: -40, w: 420, px: 52, style: 'marker', col: '#2A2440', zh: { px: 26, dy: 190 } };
  function coverFront(g, t) {
    PA.drawCard(g, PA.card('COVERf', 2360, 1460, { tex: 'red', r: 16, edge: 0.4, blur: 22 }), 0, 0);
    g.save(); g.globalAlpha = 0.16; g.strokeStyle = '#FFE8D0'; g.lineWidth = 3; g.strokeRect(-1130, -680, 2260, 1360); g.restore();
    // the title, stencil-cut into the folder, and a confidential stamp by the tab
    EP.txt(g, 'EVIL PLAN', -1060, -235, { font: EP.font(400, 236, F.villain), color: '#2A0E0C', align: 'left', ls: '6px' });
    EP.txt(g, 'EVIL PLAN', -1064, -240, { font: EP.font(400, 236, F.villain), color: '#F4E1C0', align: 'left', ls: '6px' });
    PA.stamp(g, 'CONFIDENTIAL', 760, -560, 9, { px: 40, col: '#F4E1C0', rot: 0.1, comp: 'source-over', alpha: 0.8 });
    g.save(); g.strokeStyle = 'rgba(60,20,10,.35)'; g.lineWidth = 14; g.beginPath(); g.arc(-60, 300, 120, 0.4, 5.6); g.stroke(); g.lineWidth = 4; g.beginPath(); g.arc(-56, 304, 112, 0, 6.28); g.stroke(); g.restore();
    // "Hi, I'm Claude." from the label maker
    KT.draw(g, dC0, t);
    // the sticky note: do you wanna hear it?
    const sp = eOut5(P(t, L(5) - 0.4, L(5) - 0.05));
    if (sp > 0) {
      g.save(); g.translate(-560, 150 + (1 - sp) * 60); g.rotate(-0.04 + (1 - sp) * 0.2); g.globalAlpha *= sp;
      PA.sticky(g, 0, 0, 480, '#FFE37A', 0, 1 - sp); g.restore();
      KT.draw(g, dC5, t);
      [['YES', -770], ['NO', -560]].forEach(([s, x], k) => {
        if (t < L(5) + 0.1 + k * 0.08) return;
        g.strokeStyle = '#2A2440'; g.lineWidth = 5; g.strokeRect(x, 280, 46, 46);
        EP.txt(g, s, x + 62, 320, { font: EP.font(700, 48, F.hand), color: '#2A2440', align: 'left' });
      });
      const tk = P(t, Wd(5, 3) - 0.05, Wd(5, 3) + 0.25);
      if (tk > 0) PA.drawDoodle(g, 'check', -745, 300, 1.2, tk, { col: COL.marker, w: 10, seed: 501 });
    }
    // the strip for "I have a ^different evil plan."
    const st = eOut5(P(t, L(4) - 0.35, L(4) + 0.05));
    if (st > 0) {
      PA.drawCard(g, PA.card('stripC4', 1460, 300, { tex: 'white', torn: 'lr', sa: 0.45 }), lerp(-1900, -400, st), 540, -0.01);
      KT.draw(g, dC4, t);
      const a = KT.box(g, dC4, 2), b = KT.box(g, dC4, 4);
      if (a && b && t > Wd(4, 3) - 0.1) {
        const gx = (a.x + a.w + b.x) / 2, by = a.y;
        PA.ink(g, PA.hand([[gx - 26, by + 28], [gx, by - 4], [gx + 26, by + 28]], 2, 77), 0, eIO(P(t, Wd(4, 3) - 0.1, Wd(4, 3) + 0.12)), { col: COL.marker, w: 7 });
        const f = EP.font(700, 78, F.hand), pr = eOut(P(t, Wd(4, 3), Wd(4, 3) + 0.3));
        g.save(); g.font = f; const tw = g.measureText('different').width; g.beginPath(); g.rect(gx - tw / 2 - 10, by - 160, (tw + 20) * pr, 120); g.clip();
        EP.txt(g, 'different', gx, by - 70, { font: f, color: COL.marker }); g.restore();
      }
    }
    // Claude: waves hello, rubs her hands over the different plan, then points at you
    const pose = t < L(4) - 0.15 ? 0 : t < L(5) - 0.1 ? 1 : 2, names = ['spr_wave', 'spr_greedy', 'spr_pointcam'], ft = [0, L(4) - 0.15, L(5) - 0.1];
    const fp = pose < 2 ? P(t, ft[pose + 1] - 0.18, ft[pose + 1] + 0.18) : 0;
    STK.draw(g, names[pose], 720, 700, 1180, { t, peel: P(t, Wd(0, 0) - 0.1, Wd(0, 0) + 0.4), sway: 1, flip: fp > 0 && fp < 1 ? { to: names[pose + 1], p: fp } : undefined });
  }
  let BACK = null, FRONT = null;
  function coverBack() {
    if (BACK) return BACK;
    const c = EP.mk(2488, 1588), g = c.getContext('2d'); g.translate(1244, 794);
    PA.drawCard(g, PA.card('COVERb', 2360, 1460, { tex: 'kraft', r: 16, edge: 0.35, blur: 22 }), 0, 0);
    g.fillStyle = 'rgba(90,60,30,.22)'; g.beginPath(); g.moveTo(-1100, 200); g.lineTo(1100, 120); g.lineTo(1100, 680); g.lineTo(-1100, 680); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(70,45,20,.4)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-1100, 200); g.lineTo(1100, 120); g.stroke();
    EP.txt(g, 'property of: the night shift', -1040, 600, { font: EP.font(700, 54, F.hand), color: 'rgba(60,40,25,.6)', align: 'left' });
    return (BACK = c);
  }
  spread('COVER', 0, 0, 2360, 1460, 'night', -0.02, (g, t) => {
    const pr = P(t, OPEN, OPEN + 0.5);
    if (pr <= 0) { coverFront(g, t); return; }
    if (pr < 1) { if (!FRONT) FRONT = EP.mk(2488, 1588); const fg = FRONT.getContext('2d'); EP.reset(fg); fg.clearRect(0, 0, 2488, 1588); fg.translate(1244, 794); coverFront(fg, t); }
    K.hinge(g, FRONT || coverBack(), coverBack(), pr, -1244, 0, 2488, 1588, { per: 0.22, shade: 0.45 });
  }, {
    z: 1, thumbT: 13.3, img: ['cut/spr_wave', 'cut/spr_greedy', 'cut/spr_pointcam'],
    screen: (g, t) => {   // the room is dark until the lamp clicks on (with one flicker)
      const on = t < LAMP ? 0 : t < LAMP + 0.05 ? 1 : t < LAMP + 0.1 ? 0.25 : 1;
      const a = (1 - on) * 0.94 + on * 0.35 * (1 - P(t, LAMP, LAMP + 1.6));
      if (a <= 0.005) return;
      const gr = g.createRadialGradient(W * 0.42, H * 0.42, 60, W * 0.42, H * 0.42, W * 0.75);
      gr.addColorStop(0, `rgba(0,0,0,${a * (on ? 0.2 : 1)})`); gr.addColorStop(1, `rgba(0,0,0,${a})`); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    },
  });

  // ================================================================== the tabloid corkboard
  const NEWS = {};
  function news(id, w, h, head, o = {}) {
    if (NEWS[id]) return NEWS[id];
    const card = PA.card('news' + id, w, h, { tex: '#E8E2D4', torn: 'tblr', sa: 0.5, blur: 12 }), c = EP.mk(card.c.width, card.c.height), g = c.getContext('2d');
    g.drawImage(card.c, 0, 0); g.translate(card.pad, card.pad);
    const R = EP.rng(id.length * 31 + w);
    g.fillStyle = '#2A2830'; g.font = EP.font(800, 18, F.ui); g.letterSpacing = '3px'; g.fillText('DAILY PANIC · LATE EDITION', 26, 40); g.letterSpacing = '0px';
    g.fillRect(24, 50, w - 48, 3); g.fillRect(24, 56, w - 48, 1);
    const hp = EP.fitPx(g, head, 900, o.hpx || 96, F.serif, w - 52);
    g.font = EP.font(900, hp, F.serif); g.fillStyle = '#17151C'; g.fillText(head, 26, 66 + hp * 0.92);
    let y0 = 66 + hp * 1.15;
    if (o.photo) { const ph = o.ph || Math.round((h - y0) * 0.6), pw = w - 52; g.drawImage(K.halftone(o.photo, pw, ph, { k: 1.25, b: 0.12 }), 26, y0); g.strokeStyle = '#17151C'; g.lineWidth = 2; g.strokeRect(26, y0, pw, ph); y0 += ph + 18; }
    const cols = o.cols || 2, cw = (w - 52 - (cols - 1) * 22) / cols;
    for (let k = 0; k < cols; k++) for (let y = y0 + 6; y < h - 20; y += 15) { g.fillStyle = 'rgba(40,38,48,.55)'; g.fillRect(26 + k * (cw + 22), y, cw * (y > h - 40 ? 0.5 : 0.82 + R() * 0.18), 6); }
    return (NEWS[id] = { c, w: card.c.width, h: card.c.height });
  }
  function slamIn(g, N, x, y, rot, t, t0) {
    const lu = t - t0; if (lu < 0.02) return false;
    const hitT = 0.16, sc = lu < hitT ? lerp(1.7, 1, eIn(P(lu, 0.02, hitT))) : 1, sy = lu > hitT ? 1 - 0.1 * Math.exp(-11 * (lu - hitT)) : 1;
    g.save(); g.translate(x, y); g.rotate(rot + (lu < hitT ? (1 - lu / hitT) * 0.25 : 0)); g.scale(sc * (2 - sy), sc * sy); g.globalAlpha *= P(lu, 0.02, 0.08);
    g.drawImage(N.c, -N.w / 2, -N.h / 2); g.restore();
    return true;
  }
  function cassette(g, x, y, s, t, pop) {
    if (pop.sc <= 0.01) return;
    g.save(); g.translate(x, y); g.rotate(pop.rot * 0.5 - 0.06); g.scale(pop.sc * s, pop.sc * s);
    g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.roundRect(-160 + 8, -100 + 12, 320, 200, 16); g.fill();
    g.fillStyle = '#26232E'; g.beginPath(); g.roundRect(-160, -100, 320, 200, 16); g.fill();
    g.fillStyle = '#F4EADB'; g.beginPath(); g.roundRect(-140, -84, 280, 120, 8); g.fill();
    g.fillStyle = '#F07A2E'; g.fillRect(-140, -84, 280, 22);
    EP.txt(g, 'LAST SONG', 0, -24, { font: EP.font(700, 44, F.hand), color: '#2A2440' });
    g.fillStyle = '#0E0C12'; g.beginPath(); g.roundRect(-84, 4, 168, 56, 26); g.fill();
    [-56, 56].forEach((cx, k) => { g.save(); g.translate(cx, 32); g.rotate(t * 3 * (k ? 1 : 1)); g.fillStyle = '#F4EADB'; g.beginPath(); g.arc(0, 0, 22, 0, 7); g.fill(); g.fillStyle = '#0E0C12'; for (let i = 0; i < 6; i++) { g.save(); g.rotate(i / 6 * EP.TAU); g.fillRect(-3, -20, 6, 8); g.restore(); } g.beginPath(); g.arc(0, 0, 8, 0, 7); g.fill(); g.restore(); });
    g.restore();
  }
  const dB1 = { i: 1, x: -1060, y: -700, w: 1500, px: 60, style: 'type', col: '#1E1B26', emph: { 4: { hide: true } }, zh: { px: 30, dy: 132 } };
  const dB2 = { i: 2, x: -1010, y: 360, w: 930, px: 46, style: 'type', col: '#1E1B26', emph: { 'last': { circle: COL.marker }, 'song': { circle: COL.marker }, 'evil': { under: COL.marker }, 'plan': { under: COL.marker } }, zh: { px: 28 } };
  const dB3 = { i: 3, x: -560, y: -170, w: 1200, px: 130, style: 'serif', col: '#FFF6E8', glow: 'rgba(0,0,0,.75)', emph: { 1: { style: 'stamp', col: '#E0332A', big: 1.6, rot: -0.12 } }, zh: { px: 40, col: '#FFF6E8', dy: 270 } };
  const PINC = [-40, 130];
  const TARGETS = [[-620, -430], [330, -560], [740, -40], [580, 330]];
  const SNIP = Wd(3, 1) - 0.02;
  function strings(g, t) {
    TARGETS.forEach(([tx, ty], k) => {
      const t0 = Wd(2, 3) + k * 0.32, f = eIO(P(t, t0, t0 + 0.45)); if (f <= 0) return;
      const [cx, cy] = PINC, len = Math.hypot(tx - cx, ty - cy);
      if (t < SNIP) { K.line(g, K.sagPts(cx, cy, tx, ty, len * 0.06), 0, f, { col: '#C8261D', w: 6, tip: f < 1 ? '#FF8A70' : undefined }); return; }
      // cut: each half swings down from its pin (damped pendulum toward hanging straight down)
      const u = t - SNIP, half = len / 2;
      [[cx, cy, Math.atan2(ty - cy, tx - cx)], [tx, ty, Math.atan2(cy - ty, cx - tx)]].forEach(([px, py, a0], j) => {
        const down = Math.PI / 2, a = down + (a0 - down) * Math.exp(-3.2 * u) * Math.cos(7 * u + j);
        const ex = px + Math.cos(a) * half, ey = py + Math.sin(a) * half;
        K.line(g, K.sagPts(px, py, ex, ey, half * 0.08 * (1 - Math.exp(-4 * u))), 0, 1, { col: '#C8261D', w: 6 });
      });
    });
  }
  spread('BOARD', -2900, -150, 2300, 1450, 'night', 0.012, (g, t) => {
    PA.drawCard(g, PA.card('BOARD', 2300, 1450, { tex: '#9C6B40', r: 8, edge: 0.35, blur: 20 }), 0, 0);
    g.strokeStyle = '#4A2F1E'; g.lineWidth = 44; g.strokeRect(-1128, -703, 2256, 1406); g.strokeStyle = 'rgba(255,220,180,.12)'; g.lineWidth = 4; g.strokeRect(-1150, -725, 2300, 1450);
    // the clippings slam onto the board
    const N1 = news('AI', 760, 640, 'AI MONSTER?', { photo: 'bg_news', ph: 330 }), N2 = news('PH', 600, 300, "IT'S IN YOUR PHONE", { hpx: 70 }), N3 = news('EX', 560, 360, 'EXPERTS: BE AFRAID', { hpx: 66, cols: 3 });
    if (slamIn(g, N1, -620, -120, -0.04, t, Wd(1, 0) - 0.05)) PA.pin(g, -620, -430, '#D23A2C');
    if (slamIn(g, N2, 330, -430, 0.05, t, Wd(1, 1) + 0.05)) PA.pin(g, 330, -560, '#2B3990');
    if (slamIn(g, N3, 740, 120, -0.06, t, Wd(1, 3) + 0.05)) PA.pin(g, 740, -40, '#E8A62A');
    // "last song": a cassette pinned in the middle, red string to everything
    cassette(g, PINC[0], PINC[1] + 90, 1.1, t, EP.pop(t - (Wd(2, 3) - 0.15)));
    if (t > Wd(2, 3) - 0.1) PA.pin(g, PINC[0], PINC[1], '#F07A2E');
    const cp = EP.pop(t - (Wd(2, 9) - 0.1));
    if (cp.sc > 0.01) { g.save(); g.translate(580, 430); g.rotate(0.07 + cp.rot * 0.5); g.scale(cp.sc, cp.sc); PA.drawCard(g, PA.card('epq', 430, 220, { tex: 'white', lines: 54, r: 4, blur: 10 }), 0, 0); EP.txt(g, 'EVIL PLAN?', 0, 30, { font: EP.font(700, 74, F.hand), color: COL.marker }); g.restore(); PA.pin(g, 580, 330, '#D23A2C'); }
    strings(g, t);
    // the lyric strips
    const s1 = eOut5(P(t, L(1) - 0.3, L(1) + 0.05));
    if (s1 > 0) { PA.drawCard(g, PA.card('stripB1', 1700, 190, { tex: 'white', torn: 'lr', sa: 0.45 }), lerp(-2400, -230, s1), -630, 0.006); KT.draw(g, dB1, t); const b = KT.box(g, dB1, 3); if (b) K.ransom(g, 'MONSTER.', b.x + b.w + 30, b.y - 22, 64, t, Wd(1, 4) - 0.02, { seed: 3 }); }
    const s2 = eOut5(P(t, L(2) - 0.35, L(2)));
    if (s2 > 0) { PA.drawCard(g, PA.card('idxB2', 1060, 300, { tex: 'white', lines: 58, margin: 80, r: 4 }), -560, lerp(1200, 470, s2), -0.015); KT.draw(g, dB2, t); }
    // Claude with the scissors: snip
    const u = t - SNIP;
    STK.draw(g, 'spr_scissors', 860, 700, 900, { t, peel: P(t, L(3) - 0.75, L(3) - 0.3), sway: 0.8, sy: hit(u, 1.5) });
    if (u > 0 && u < 0.5) { const pp = EP.pop(u); g.save(); g.translate(300, 40); g.rotate(-0.2 + pp.rot); g.scale(pp.sc, pp.sc); EP.txt(g, 'snip!', 0, 0, { font: EP.font(700, 90, F.hand), color: '#FFF6E8', stroke: '#1E1B26', lw: 10 }); g.restore(); }
    KT.draw(g, dB3, t);
  }, { img: ['bg_news', 'cut/spr_scissors'] });

  // ================================================================== props, camera, impacts
  function lamp(g, t) {
    const on = t < LAMP ? 0 : t < LAMP + 0.05 ? 1 : t < LAMP + 0.1 ? 0.2 : 1;
    if (on > 0) { g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.3 * on; const gr = g.createRadialGradient(700, 760, 60, 760, 820, 1300); gr.addColorStop(0, 'rgba(255,214,150,.75)'); gr.addColorStop(0.5, 'rgba(255,180,100,.25)'); gr.addColorStop(1, 'rgba(255,160,80,0)'); g.fillStyle = gr; g.fillRect(-600, -500, 2800, 2800); g.restore(); }
    g.strokeStyle = '#2E3A30'; g.lineWidth = 34; g.lineCap = 'round'; g.beginPath(); g.moveTo(-420, -260); g.lineTo(-120, 60); g.lineTo(140, 150); g.stroke();
    g.save(); g.translate(200, 200); g.rotate(0.75);
    g.fillStyle = '#35473A'; g.beginPath(); g.moveTo(-70, -40); g.lineTo(70, -40); g.lineTo(140, 120); g.lineTo(-140, 120); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(-60, -34, 30, 140);
    if (on > 0) { g.globalCompositeOperation = 'screen'; EP.glowDot(g, 0, 130, 260, `rgba(255,236,190,${on})`, `rgba(255,190,110,${0.45 * on})`); }
    g.restore();
  }
  WD.props.push(
    { x: -1640, y: -1040, rot: 0, d: 0.12, blur: 2, draw: lamp, until: 24 },
    { x: -1500, y: 860, rot: -0.4, d: 0.1, blur: 3, draw: (g, t) => { g.fillStyle = 'rgba(0,0,0,.35)'; g.filter = 'blur(8px)'; g.fillRect(-300, 14, 600, 40); g.filter = 'none'; g.fillStyle = '#F2C230'; g.fillRect(-260, -22, 480, 44); g.fillStyle = '#E8C9A0'; g.beginPath(); g.moveTo(220, -22); g.lineTo(300, 0); g.lineTo(220, 22); g.closePath(); g.fill(); g.fillStyle = '#E88A9A'; g.beginPath(); g.roundRect(-330, -22, 72, 44, [14, 0, 0, 14]); g.fill(); } },
    { x: -4250, y: 760, rot: 0.3, d: 0.1, blur: 3, draw: (g, t) => { for (let i = 0; i < 3; i++) EP.drawDaisy(g, i * 70, (i % 2) * 40, 52 - i * 6, { rot: i + t * 0.05, petal: '#FBF6EA', center: '#E8B54A' }); } },
  );
  WD.keys.push(
    { t: 0, s: 'COVER', dx: -260, dy: -160, z: 0.64, drift: { z: 0.028 } },
    { t: 2.62, s: 'BOARD', dx: -40, dy: -50, z: 0.73, d: 0.62, drift: { z: 0.01 } },
    { t: 5.5, s: 'BOARD', dx: 40, dy: 50, z: 0.78, d: 0.6, drift: { z: 0.012 } },
    { t: 9.98, s: 'COVER', dx: -150, dy: 120, z: 0.74, d: 0.62, drift: { z: 0.012 } },
    { t: 13.6, s: 'COVER', dx: -60, dy: 140, z: 0.84, d: 0.45, drift: { z: 0.01 } },   // the question and Claude asking it
    { t: OPEN - 0.05, x: -60, y: 30, z: 0.8, d: 0.6, drift: { z: 0.012 } },
  );
  WD.shakes.push([Wd(1, 0) + 0.1, 0.3], [Wd(1, 1) + 0.2, 0.2], [Wd(1, 4) + 0.12, 0.35], [Wd(3, 1) + 0.15, 0.55], [OPEN + 0.32, 0.2]);
  WD.blooms.push([LAMP, 3.0, 0.22, 0.05, 0.8]);
})();
