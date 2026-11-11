// scenes/verse.js — the two verses on the dark stage, each line illustrated like the reference: the zombie "type", the
// petal ring chomped petal by petal, the house door and the slime title, suns and a peashooter infantry, the brain, the
// no-zombies sign; verse 2: the plate piling up with brains, "fig. 1" (brain → gullet → worried heart), a zombie losing
// his head and walking on, raining suns, and the lawn defence switching from day to night.
'use strict';
(function () {
  const { W, H, clamp, lerp, P, eOut, eIn, eIO, backOut, smooth, spring, hash, noise, TAU } = ZL;
  const S = ZL.SCENES;
  const V1 = ZL.sec('verse1'), V2 = ZL.sec('verse2');
  const kar = (g, t) => ZL.karaoke(g, t, {});
  // pop-in scale (#001 style overshoot) for something appearing at t0
  const pop = (t, t0, d = 0.35) => t < t0 ? 0 : backOut(clamp((t - t0) / d), 2.2);

  // The sunflower in her spotlight on the black stage (left side unless told otherwise).
  function spotSinger(g, t, o = {}) {
    const x = o.x ?? 520, y = o.y ?? 880, s = o.s ?? 0.3, k = o.k ?? 1;
    ZL.spot(g, x - 140, -80, x, y, 240, { a: k, dust: 26, t, seed: o.seed ?? 4 });
    ZL.sunflower(g, x, y, s, { t, sing: true, sway: o.sway ?? 0.7, seed: 2, tilt: o.tilt || 0, bend: o.bend || 0 });
  }
  ZL.spotSinger = spotSinger;
  // a push-in camera around a point (screen space), z from 1 to zoom between t0 and t1
  function pushIn(g, t, t0, t1, cx, cy, zoom) {
    const z = lerp(1, zoom, eIO(P(t, t0, t1)));
    g.translate(cx, cy); g.scale(z, z); g.translate(-cx, -cy);
  }

  // ================================================================ verse 1
  // 42.19–48.49: the zombie "type" and the petal ring
  const ring = (() => {
    const n = 16, out = [];
    for (let i = 0; i < n; i++) out.push({ a: i / n * TAU - Math.PI / 2, v: i % 6 });
    return out;
  })();
  S.push({
    id: 'v1_type', t0: 42.19, t1: 48.49, img: [...ZL.SF_IMGS, ...ZL.zImgs('z_basic'), 'zwalk12', 'petal_0', 'petal_1', 'petal_2', 'petal_3', 'petal_4', 'petal_5', 'jaws_0', 'jaws_1'],
    draw(g, t) {
      ZL.blackStage(g);
      const L9 = V1, L10 = V1 + 1;
      spotSinger(g, t, { k: ZL.lampK(t, 42.22) });
      // the zombie walks into his own light: tall (stretches), dark (light dims), dead (green-grey light)
      const wTall = ZL.Wd(L9, 4), wDark = ZL.Wd(L9, 5), wDead = ZL.Wd(L9, 7);
      const zy = 900, wk = { t0: 42.3, t1: 44.0, x0: 2160, x1: 1380, y: zy, s: 5.0 }, ws_ = ZL.walkPos(t, wk);
      const zx = ws_.done ? wk.x1 : ws_.x, out = P(t, 45.5, 46.2);
      if (t < 46.3) {
        const dark = P(t, wDark - 0.05, wDark + 0.15) * (1 - P(t, wDead - 0.05, wDead + 0.1));
        const col = t > wDead ? [190, 255, 190] : [235, 240, 255];
        ZL.spot(g, zx + 160, -80, zx - 20, zy, 230, { a: ZL.lampK(t, 42.6) * (1 - dark * 0.85) * (1 - out), col, dust: 18, t, seed: 9 });
        g.save(); g.globalAlpha = (1 - out) * (1 - dark * 0.7);
        const walking = !ws_.done;
        if (walking) ZL.walker(g, t, wk);
        else {
          const tall = spring(Math.max(0, t - wTall), 16, 6) * (1 - P(t, wDark, wDark + 0.3));
          ZL.zombie(g, 'z_basic', zx + out * 300, zy, 0.42, { sq: tall * 0.16, rot: Math.sin(ZL.beatPos(t) * Math.PI) * 0.03 });
        }
        g.restore();
      }
      // her own head, petals and all, floats in at "want"; the zombie's jaws bite one petal off per sung word from
      // "bite" on, and the last ones drop off together on "head"
      const form = P(t, ZL.Wd(L10, 1) - 0.15, ZL.Wd(L10, 1) + 0.35);
      if (form > 0) {
        const ws = ZL.T.lines[L10].words, endT = ws[ws.length - 1].t0 + 0.12;
        const bites = []; for (let j = 3; j < ws.length - 1; j++) bites.push(ws[j].t0);
        const ORDER = ring.map((_, i) => (i * 5) % ring.length);     // eaten around the head in big steps
        const petals = ring.map((p, i) => {
          const rank = ORDER.indexOf(i);
          const tb = rank < bites.length ? bites[rank] : endT + (rank - bites.length) * 0.03;
          return { a: p.a, v: p.v, rot: (hash(i, 2) - 0.5) * 9, gone: clamp((t - tb) / 0.7) };
        });
        let cur = -1; for (let q = 0; q < bites.length; q++) if (t >= bites[q] - 0.14) cur = q;
        const hx = 1370, hy = 500 + (1 - eOut(form)) * -700, hs = 0.42;
        const scared = cur >= 0 && t < endT + 0.6;
        ZL.petalHead(g, hx, hy, hs, petals, { shape: scared ? (Math.floor(t * 6) % 2 ? 'oh' : 'oo') : 'rest', blink: false });
        // the jaws: hover over the petal being eaten and chomp on the word
        if (cur >= 0 && t < endT + 0.25) {
          const tb = bites[cur], u = clamp((t - (tb - 0.14)) / 0.28), open = u < 0.5 ? 1 : 1 - eOut((u - 0.5) * 2);
          const pi = ORDER.indexOf(cur) >= 0 ? ring.findIndex((_, i) => ORDER.indexOf(i) === cur) : 0;
          const pa = ring[Math.max(0, pi)].a, d = 322 * hs * 2.05;
          const jx = hx + Math.cos(pa) * d, jy = hy + Math.sin(pa) * d;
          const fade = Math.min(P(t, bites[0] - 0.3, bites[0] - 0.1), 1 - P(t, endT, endT + 0.25));
          g.save(); g.globalAlpha = fade; g.translate(jx, jy); g.rotate(pa + Math.PI / 2);
          ZL.spr(g, 'jaws_0', 0, -8 - open * 60, 0.3, { ax: 0.5, ay: 1 });
          ZL.spr(g, 'jaws_1', 0, 8 + open * 60, 0.3, { ax: 0.5, ay: 0 });
          g.restore();
        }
      }
      kar(g, t);
    }
  });

  // 48.49–50.05: "And then eat the brains of" — push in on her face
  S.push({
    id: 'v1_brainsof', t0: 48.49, t1: 50.05, img: [...ZL.SF_IMGS],
    draw(g, t) {
      ZL.blackStage(g);
      g.save(); pushIn(g, t, 48.49, 50.05, 960, 520, 1.55);
      spotSinger(g, t, { x: 960, y: 900, s: 0.36, sway: 0.4 });
      g.restore();
      kar(g, t);
    }
  });

  // 50.05–52.63: "the one who planted me here": a zombie walks up the deck and in through the open door; the title
  S.push({
    id: 'v1_door', t0: 50.05, t1: 52.63, img: ['bg/bg_door', 'zwalk12', 'title_brains'],
    draw(g, t) {
      const bg = ZL.img['bg/bg_door'];
      // close on the deck and the door while he walks in, then pull back to the yard as the title grows
      const pb = smooth(P(t, 51.1, 51.9)), z = lerp(1.55, 1.12, pb);
      const fx = lerp(640, W / 2, pb), fy = lerp(380, H / 2, pb);   // focus kept far enough in that no edge shows
      g.save();
      g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-fx, -fy);
      if (bg) g.drawImage(bg, 0, 0, W, W * bg.height / bg.width);
      // The zombie crosses the deck to the open back door and walks in, gone before the title (as in the original).
      // Points measured on the painting (1536 px wide), drawn at W px wide: x1.25.
      const PS = W / 1536, pt = (x, y) => [x * PS, y * PS];
      const P0 = pt(505, 402), P1 = pt(368, 303), P2 = pt(338, 280);   // on the deck -> threshold -> inside
      const DOOR = [330 * PS, 78 * PS, 72 * PS, 226 * PS];             // the doorway opening (x, y, w, h)
      const w0 = 50.05, w1 = 50.95, w2 = 51.25;
      if (t < w2) {
        const d01 = Math.hypot(P1[0] - P0[0], P1[1] - P0[1]), d12 = Math.hypot(P2[0] - P1[0], P2[1] - P1[1]);
        // one steady walk over both legs of the path; the body moves by the foot-locked ground track
        const wk = { t0: w0, t1: w1, x0: 0, x1: d01, s: 1.9 };
        const fps = ZL.walkPos(w0, wk) && (Math.abs(d01) / 1.9) / ZL.AN.zwalk12.ground[12] * 12 / (w1 - w0);
        const st = ZL.walkPos(t, { t0: w0, x0: 0, x1: d01 + d12, s: 1.9, fps });
        const f = st.f, dd = st.x, inU = clamp((dd - d01) / d12);
        const [x, y] = dd < d01 ? [lerp(P0[0], P1[0], dd / d01), lerp(P0[1], P1[1], dd / d01)] : [lerp(P1[0], P2[0], inU), lerp(P1[1], P2[1], inU)];
        const sc = dd < d01 ? lerp(1.95, 1.85, dd / d01) : lerp(1.85, 1.72, inU);
        const gone = st.done || t > w2 - 0.02;
        if (!gone) {
        g.save();
        if (dd < d01) {                                           // a soft shadow on the deck boards
          g.globalAlpha = 0.25; g.fillStyle = '#000'; g.beginPath(); g.ellipse(x, y, 34 * sc, 8 * sc, 0, 0, TAU); g.fill(); g.globalAlpha = 1;
        } else {                                                  // through the door: only what is inside the doorway shows, fading into the dark room
          g.beginPath(); g.rect(DOOR[0], DOOR[1], DOOR[2], DOOR[3] + 8); g.clip();
          g.filter = `brightness(${lerp(1, 0.2, inU)})`;
          g.globalAlpha = 1 - P(inU, 0.6, 1);
        }
        ZL.anim(g, 'zwalk12', f, x, y, sc);
        g.restore();
        }
      }
      g.restore();
      // THE ZOMBIES ATE YOUR BRAINS! grows out of the middle of the picture, as in the original
      const tt = 51.25, k = P(t, tt, tt + 0.8);
      if (k > 0) {
        const sc = lerp(0.03, 1, backOut(k, 1.1)) * (1 + 0.012 * Math.sin((t - tt) * 7));
        g.save(); g.fillStyle = `rgba(0,0,0,${0.3 * k})`; g.fillRect(0, 0, W, H);
        g.translate(W / 2, H / 2 - 20); g.scale(sc, sc);
        ZL.spr(g, 'title_brains', 0, 0, 0.95, { ax: 0.5, ay: 0.5, alpha: clamp(k * 3) });
        g.restore();
      }
      kar(g, t);
    }
  });

  // 52.63–57.39: "I'm just a sunflower / But see me power an entire infantry": suns pop out of her, fly to their
  // places and turn into peashooters (the original's sun -> plant), rank after rank, until an army stands around her
  const SFX = 960, SFY = 700;
  const army = (() => {
    const out = [];
    for (let r = 0; r < 3; r++) for (let c = -3; c <= 3; c++) {
      const x = SFX + c * 250 + (r % 2 ? 125 : 0) - (r % 2 ? 0 : 0), y = 560 + r * 140;
      if (Math.abs(x - SFX) < 190) continue;                 // keep her stem clear
      if (x < 120 || x > W - 120) continue;
      out.push({ x, y, s: 0.105 + r * 0.012, kind: r === 0 && Math.abs(c) === 3 ? 'plants_a_1' : 'peashooter', d: hash(r, c) });
    }
    // the closest places fill first
    return out.sort((p, q) => (Math.abs(p.x - SFX) + Math.abs(p.y - SFY) * 0.6) - (Math.abs(q.x - SFX) + Math.abs(q.y - SFY) * 0.6));
  })();
  S.push({
    id: 'v1_infantry', t0: 52.63, t1: 57.39, img: [...ZL.SF_IMGS, 'sun', 'peashooter', 'plants_a_1'],
    draw(g, t) {
      ZL.blackStage(g);
      const L13 = V1 + 4, see = ZL.Wd(L13, 1), last = ZL.Wd(L13, 6) + 0.25;
      ZL.spot(g, SFX, -100, SFX, SFY, 240, { a: ZL.lampK(t, 52.66), dust: 30, t, seed: 5, col: [255, 240, 200] });
      const n = army.length;
      // launches: the first two on "see" and "me", the rest spread to the end of "infantry"
      const launch = i => i < 2 ? ZL.Wd(L13, 1 + i) - 0.05 : lerp(ZL.Wd(L13, 3), last, Math.pow((i - 2) / (n - 3), 0.8));
      const plants = [], suns = [];
      army.forEach((m, i) => {
        const t0 = launch(i), fly = 0.42, hold = i < 2 ? 0.55 : 0.18, tt = t0 + fly + hold;   // tt: the sun becomes a plant
        if (t < t0) return;
        if (t < tt) suns.push({ m, u: clamp((t - t0) / fly), t0, tt });
        else plants.push({ m, tt });
      });
      // plants (back to front), each with a puff of light where its sun was
      plants.sort((p, q) => p.m.y - q.m.y).forEach(({ m, tt }) => {
        const k = pop(t, tt, 0.32), bob = Math.abs(Math.sin((ZL.beatPos(t) + m.d) * Math.PI)) * 5;
        g.save(); g.globalAlpha = 0.28; g.fillStyle = '#000'; g.beginPath(); g.ellipse(m.x, m.y, 52, 11, 0, 0, TAU); g.fill(); g.restore();
        ZL.spr(g, m.kind, m.x, m.y - bob, m.s * k);
        const age = t - tt;
        if (age < 0.35) {
          g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = 1 - age / 0.35;
          g.strokeStyle = '#fff6c0'; g.lineWidth = 8 * (1 - age / 0.35) + 1;
          g.beginPath(); g.arc(m.x, m.y - 55, 30 + age * 260, 0, TAU); g.stroke(); g.restore();
          ZL.glow(g, m.x, m.y - 55, 120, `rgba(255,240,170,${0.8 * (1 - age / 0.35)})`);
        }
      });
      ZL.sunflower(g, SFX, SFY, 0.24, { t, sing: true, sway: 0.6, seed: 3 });
      // suns in flight / hovering in place (in front of everything)
      suns.forEach(({ m, u, t0, tt }) => {
        const sx = SFX, sy = SFY - 270, ex = m.x, ey = m.y - 60;
        const x = lerp(sx, ex, eOut(u)), y = lerp(sy, ey, eOut(u)) - 4 * u * (1 - u) * 170;
        const k = pop(t, t0, 0.25), wob = 1 + 0.08 * Math.sin((t - t0) * 18) * (t > tt - 0.2 ? 1 : 0);
        ZL.glow(g, x, y, 95, 'rgba(255,220,80,0.5)');
        ZL.spr(g, 'sun', x, y, 0.1 * k * wob, { ax: 0.5, ay: 0.5, rot: t * 1.2 });
      });
      kar(g, t);
    }
  });

  // 57.39–62.6: "You like the taste of brains" (a juicy brain; zombie hands reach for it) / "we don't like zombies"
  S.push({
    id: 'v1_brain', t0: 57.39, t1: 62.6, img: ['brain', 'zparts2_0', 'zparts2_1'],
    draw(g, t) {
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      const L14 = V1 + 5, no = ZL.Wd(L14, 6) - 0.25, dont = ZL.Wd(L14, 7);
      const k = pop(t, 57.45, 0.5), gone = P(t, no, no + 0.25);
      if (k > 0 && gone < 1) {
        const pulse = 1 + ZL.pulse(t, 8) * 0.05;
        g.save(); g.globalAlpha = 1 - gone;
        ZL.glow(g, 960, 470, 420, 'rgba(255,120,170,0.25)');
        ZL.spr(g, 'brain', 960, 470 + Math.sin(t * 2.2) * 10, 0.42 * k * pulse, { ax: 0.5, ay: 0.5, rot: Math.sin(t * 1.3) * 0.05 });
        ZL.sparkles(g, 960, 470, 300, 14, t, 1, 7);
        // zombie arms reach in from the bottom corners
        const reach = eOut(P(t, 57.9, 58.9));
        ZL.spr(g, 'zparts2_1', lerp(-200, 330, reach), 960, 0.55, { ax: 0.1, ay: 0.5, rot: -0.55 });
        ZL.spr(g, 'zparts2_1', lerp(W + 200, W - 330, reach), 960, 0.55, { ax: 0.1, ay: 0.5, rot: -0.55 + Math.PI, flip: false, sy: -1 });
        g.restore();
      }
      // the no-zombies sign slams on "don't"
      if (t >= no) {
        const kk = pop(t, no, 0.3), slam = P(t, dont - 0.05, dont + 0.12);
        const sh = ZL.shake(t, dont + 0.1, 20, 0.45);
        const out = P(t, 61.6, 62.4);
        g.save(); g.translate(960 + sh.x, 480 + sh.y); g.rotate(out * 4); g.scale(kk * (1 - out), kk * (1 - out));
        ZL.spr(g, 'zparts2_0', 0, 0, 0.75, { ax: 0.5, ay: 0.5 });
        if (slam > 0) {
          const sc = lerp(2.2, 1, eOut(slam));
          g.scale(sc, sc); g.globalAlpha = slam;
          g.lineWidth = 46; g.strokeStyle = '#e8241c'; g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 16;
          g.beginPath(); g.arc(0, 0, 250, 0, TAU); g.stroke();
          g.beginPath(); g.moveTo(-176, -176); g.lineTo(176, 176); g.stroke();
        }
        g.restore();
      }
      kar(g, t);
    }
  });

  // ================================================================ verse 2
  // 96.4–100.35: "Maybe it's time to reevaluate" — her spotlight after the fog
  S.push({
    id: 'v2_reeval', t0: 96.4, t1: 100.35, img: [...ZL.SF_IMGS],
    draw(g, t) {
      ZL.blackStage(g);
      g.save(); pushIn(g, t, 96.6, 100.35, 600, 560, 1.25);
      spotSinger(g, t, { k: ZL.lampK(t, 96.45), tilt: Math.sin(t * 1.1) * 0.05 });
      g.restore();
      kar(g, t);
    }
  });
  // 100.35–103.4: the plate fills up with brains
  S.push({
    id: 'v2_plate', t0: 100.35, t1: 103.4, img: [...ZL.SF_IMGS, 'plate', 'brain'],
    draw(g, t) {
      ZL.blackStage(g);
      const L29 = V2 + 1;
      spotSinger(g, t, { x: 470 });
      const px = 1320, py = 760, k = pop(t, 100.45, 0.4);
      ZL.spot(g, px + 120, -80, px, py, 300, { a: ZL.lampK(t, 100.4), col: [255, 245, 230] });
      if (k > 0) ZL.spr(g, 'plate', px, py, 0.42 * k, { ax: 0.5, ay: 0.5 });
      const drops = [ZL.Wd(L29, 7), ZL.Wd(L29, 9), ZL.Wd(L29, 10) - 0.15, ZL.Wd(L29, 10) + 0.1];
      drops.forEach((t0, i) => {
        if (t < t0 - 0.3) return;
        const u = clamp((t - (t0 - 0.3)) / 0.3), land = py - 60 - i * 95;
        const y = u < 1 ? lerp(-200, land, eIn(u)) : land - Math.abs(Math.sin((t - t0) * 12)) * 18 * Math.exp(-(t - t0) * 6);
        const sq = Math.exp(-Math.max(0, t - t0) * 10);
        ZL.spr(g, 'brain', px + (i % 2 ? 18 : -14), y, 0.2, { ax: 0.5, ay: 0.6, sx: 1 + sq * 0.2, sy: 1 - sq * 0.18 });
      });
      kar(g, t);
    }
  });
  // 103.4–107.3: "fig. 1" — the brain goes down the gullet and the heart is not happy about it
  S.push({
    id: 'v2_fig1', t0: 103.4, t1: 107.3, img: ['jaws_0', 'jaws_1', 'brain', 'heart'],
    draw(g, t) {
      // old textbook page
      g.fillStyle = '#efe6cf'; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(120,150,170,0.25)'; g.lineWidth = 2;
      for (let x = 0; x < W; x += 48) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
      for (let y = 0; y < H; y += 48) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      ZL.vignette(g, 0.35, '90,70,40');
      ZL.text(g, 'fig. 1', 120, 120, { size: 64, font: 'Georgia, serif', fill: '#3a2c1c', lw: 0, align: 'left', shadow: 0 });
      // the gullet: a fat cream tube from the mouth (top left) down to the heart (bottom right)
      const pts = [[520, 300], [600, 520], [900, 520], [1080, 380], [1300, 420], [1380, 640], [1420, 760]];
      const path = new Path2D(); path.moveTo(...pts[0]);
      for (let i = 1; i < pts.length - 1; i++) { const m = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2]; path.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); }
      path.lineTo(...pts[pts.length - 1]);
      const draw = P(t, 103.5, 104.3);
      g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
      g.setLineDash([4000]); g.lineDashOffset = 4000 * (1 - draw);
      g.strokeStyle = '#4a2f1a'; g.lineWidth = 92; g.stroke(path);
      g.strokeStyle = '#f2d6a2'; g.lineWidth = 76; g.stroke(path);
      g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 18; g.setLineDash([]); if (draw >= 1) g.stroke(path);
      g.restore();
      // jaws at the top of the tube: the brain drops in, two chomps ("quite", "rich"), then it is swallowed
      const L30 = V2 + 2, c1 = ZL.Wd(L30, 2), c2 = ZL.Wd(L30, 3);
      const chompK = tc => { const u = (t - (tc - 0.08)) / 0.22; return u < 0 || u > 1 ? 0 : Math.sin(u * Math.PI); };
      const op = t < c2 + 0.14 ? 1 - Math.max(chompK(c1), chompK(c2)) : clamp(1 - (t - c2 - 0.14) / 0.12);
      ZL.spr(g, 'jaws_0', 520, 250 - op * 60, 0.26, { ax: 0.5, ay: 1 });
      if (t < c2 + 0.2) {
        const bs = 0.14 * (t < c1 ? 1 : t < c2 ? 0.8 : 0.55);
        ZL.spr(g, 'brain', 520, lerp(40, 262, eOut(P(t, 103.45, 103.85))), bs, { ax: 0.5, ay: 0.5 });
      }
      ZL.spr(g, 'jaws_1', 520, 270 + op * 40, 0.26, { ax: 0.5, ay: 0 });
      const chomp = c2 + 0.2;
      // a pink lump travels down the tube; yellow cholesterol globs pile up inside
      const trav = P(t, chomp + 0.15, 105.9);
      if (trav > 0 && trav < 1) {
        const len = 1500, tmp = document.createElementNS ? null : null;
        // sample the path by drawing a short dashed segment at the travel point
        g.save(); g.lineCap = 'round'; g.setLineDash([1, 4000]); g.lineDashOffset = -trav * len;
        g.strokeStyle = '#f78bb0'; g.lineWidth = 64; g.stroke(path); g.restore();
      }
      const globs = P(t, 104.6, 106.0);
      for (let i = 0; i < 9; i++) {
        if (globs * 9 < i) break;
        const u = 0.55 + i * 0.05;
        g.save(); g.setLineDash([1, 4000]); g.lineDashOffset = -u * 1500; g.lineCap = 'round';
        g.strokeStyle = '#ffd94a'; g.lineWidth = 26 + (i % 3) * 6; g.stroke(path); g.restore();
      }
      // the heart: worried, then pale and shaking when the lump arrives
      const hk = pop(t, 103.9, 0.4), hit = P(t, 105.9, 106.2);
      if (hk > 0) {
        const sh = hit > 0 ? Math.sin(t * 60) * 7 * (1 - P(t, 106.6, 107.2)) : 0;
        const beat = 1 + ZL.pulse(t, 9) * 0.06 * (1 + hit);
        g.save(); g.filter = hit > 0 ? `saturate(${1 - hit * 0.6}) brightness(${1 + hit * 0.15})` : 'none';
        ZL.spr(g, 'heart', 1420 + sh, 800, 0.3 * hk * beat, { ax: 0.5, ay: 0.5 });
        g.restore();
      }
      ZL.text(g, 'brain', 330, 230, { size: 44, font: ZL.F.hand, fill: '#3a2c1c', lw: 0, shadow: 0, alpha: draw });
      if (hk > 0) ZL.text(g, 'heart', 1650, 980, { size: 44, font: ZL.F.hand, fill: '#3a2c1c', lw: 0, shadow: 0 });
      kar(g, t);
    }
  });
  // 107.3–110.0: "You're dead, so it doesn't matter" — one of three walkers loses his head and walks on
  S.push({
    id: 'v2_dead', t0: 107.3, t1: 110.0, img: ['zwalk12', 'zwalk12_head', 'zparts2_0', 'melon_0', 'melon_1', 'melon_2', 'melon_3', 'melon_4', 'melon_5', 'melon_6', 'melon_7', 'melon_8'],
    draw(g, t) {
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      const L31 = V2 + 3, hit = ZL.Wd(L31, 4);                   // smashes on "doesn't"
      const rows = [[250, 0], [520, 0.4], [790, 0.15]];
      const sh = ZL.shake(t, hit, 10, 0.3);
      g.save(); g.translate(sh.x, sh.y);
      let head = null;
      rows.forEach(([y, d], i) => {
        const w = { t0: 106.8 - d, t1: 111, x0: 1720, x1: 900, y: y + 150, s: 2.7 };
        if (i === 2) head = { x: ZL.walkPos(hit, w).x - 30, y: y + 150 - 236, feet: y + 150 };
        if (i === 2 && t >= hit) {
          ZL.walker(g, t, { ...w, anim: 'zwalk12_head' });
          const age = t - hit;
          const hx = head.x + 10 + age * 210, hy0 = head.y + age * age * 1500 - age * 380;
          const land = head.feet - 30, hy = Math.min(hy0, land) - (hy0 > land ? Math.abs(Math.sin((age - 0.55) * 9)) * 50 * Math.exp(-(age - 0.55) * 3) : 0);
          ZL.spr(g, 'zparts2_0', hx, hy, 0.4, { ax: 0.5, ay: 0.7, rot: age * 7 });
        } else ZL.walker(g, t, w);
      });
      // the melon: lobbed from the left in a high arc
      const fly = 0.85, l0 = hit - fly;
      const m0 = ZL.img.melon_0;
      if (t >= l0 && t < hit && m0) {
        const u = (t - l0) / fly, x = lerp(-120, head.x, u), y = lerp(head.y - 60, head.y, u) - 4 * u * (1 - u) * 520;
        ZL.spr(g, 'melon_0', x, y, 130 / m0.width, { ax: 0.5, ay: 0.5, rot: u * 4 });
      }
      // the splat: chunks and juice fly out, a red flash
      if (t >= hit && t < hit + 1.3) {
        const age = t - hit;
        if (age < 0.18) ZL.glow(g, head.x, head.y, 210, `rgba(255,60,60,${0.7 * (1 - age / 0.18)})`);
        ['melon_1', 'melon_3', 'melon_5', 'melon_6', 'melon_7', 'melon_8', 'melon_2', 'melon_4', 'melon_6', 'melon_8'].forEach((nm, j) => {
          const im = ZL.img[nm]; if (!im) return;
          const ang = -Math.PI * (0.1 + 0.8 * j / 9) + (hash(j, 5) - 0.5) * 0.4, sp = 380 + hash(j, 6) * 420;
          const x = head.x + Math.cos(ang) * sp * age, y = head.y + Math.sin(ang) * sp * age + 1300 * age * age;
          const sz = (j < 6 ? 70 : 40) + hash(j, 7) * 25;
          ZL.spr(g, nm, x, y, sz / im.width, { ax: 0.5, ay: 0.5, rot: age * (hash(j, 8) - 0.5) * 14, alpha: clamp(1.4 - age) });
        });
      }
      g.restore();
      kar(g, t);
    }
  });
  // 110.0–112.3: "Instead, we'll use this solar power" — suns rain down on her
  S.push({
    id: 'v2_solar', t0: 110.0, t1: 112.3, img: [...ZL.SF_IMGS, 'sun'],
    draw(g, t) {
      ZL.blackStage(g);
      const glow = P(t, 110.4, 112.0);
      ZL.glow(g, 960, 560, 700, `rgba(255,210,80,${0.35 * glow})`);
      for (let i = 0; i < 22; i++) {
        const t0 = 110.0 + hash(i, 1) * 1.6, age = t - t0;
        if (age < 0) continue;
        const x = 200 + hash(i, 2) * 1520, y = -120 + age * (700 + hash(i, 3) * 300);
        if (y > H + 100) continue;
        g.save(); g.globalCompositeOperation = 'screen';
        const gr = g.createLinearGradient(x, y - 260, x, y); gr.addColorStop(0, 'rgba(255,230,120,0)'); gr.addColorStop(1, 'rgba(255,230,120,0.55)');
        g.fillStyle = gr; g.fillRect(x - 10, y - 260, 20, 260); g.restore();
        ZL.spr(g, 'sun', x, y, 0.09, { ax: 0.5, ay: 0.5, rot: age * 3 });
      }
      ZL.spot(g, 960, -100, 960, 900, 280, { a: 1, col: [255, 236, 170], dust: 30, t, seed: 8 });
      ZL.sunflower(g, 960, 900, 0.33, { t, sing: true, sway: 0.7, seed: 6 });
      kar(g, t);
    }
  });
  // 112.3–116.4: "To make a lawn defense at any hour" — the lawn fills with plants; "any hour": day turns to night
  // one plant kind per column, as a player would plant it (sun makers at the back, the wall-nut line in front); each
  // plant scaled to its in-game height in px — puff-shroom and young sun-shroom are small, as in the original
  const DAYP = ['sunflower_small', 'sunflower_small', 'peashooter', 'plants_a_1', 'plants_a_0', 'plants_a_2', 'wallnut'];
  const NIGHTP = ['plants_b_2', 'plants_b_2', 'plants_b_0', 'plants_b_1', 'plants_b_1', 'plants_b_0', 'wallnut'];
  const PH = { sunflower_small: 118, peashooter: 104, plants_a_0: 104, plants_a_1: 104, plants_a_2: 112, wallnut: 100, plants_b_0: 50, plants_b_1: 96, plants_b_2: 58 };
  S.push({
    id: 'v2_lawn', t0: 112.3, t1: 116.45, img: ['bg/t_lawn', 'bg/bg_grid_night', ...new Set([...DAYP, ...NIGHTP])],
    draw(g, t) {
      const L33 = V2 + 5, hour = ZL.Wd(L33, 6) - 0.2;
      const nk = P(t, hour, hour + 0.5);
      const day = ZL.img['bg/t_lawn'], night = ZL.img['bg/bg_grid_night'];
      const z = lerp(1.0, 1.06, P(t, 112.3, 116.45));
      g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2);
      if (day) g.drawImage(day, 0, 0, W, W * day.height / day.width);
      if (night && nk > 0) {                                  // night sweeps in from the right like a curtain
        g.save(); g.beginPath(); g.rect(W * (1 - eIO(nk)), 0, W, H); g.clip();
        g.drawImage(night, 0, 0, W, W * night.height / night.width); g.restore();
      }
      // the 9 x 5 checkerboard: cell centres measured on the painting (as drawn here, before the zoom)
      const edge = W * (1 - eIO(nk));
      for (let c = 0; c < DAYP.length; c++) for (let r = 0; r < 5; r++) {
        const cx = 343 + c * 142.6, base = 261 + r * 158.8 + 50;
        const isNight = cx > edge;
        const kind = (isNight ? NIGHTP : DAYP)[c];
        const t0 = isNight ? hour + 0.05 + (6 - c) * 0.05 + r * 0.03 : 112.45 + c * 0.16 + r * 0.04;
        const k = pop(t, t0, 0.3);
        if (k <= 0) continue;
        const im = ZL.img[kind]; if (!im) continue;
        const bob = Math.sin((ZL.beatPos(t) + c * 0.13) * Math.PI) * 2;
        g.save(); g.globalAlpha = 0.22; g.fillStyle = '#000'; g.beginPath(); g.ellipse(cx, base, 46, 11, 0, 0, TAU); g.fill(); g.restore();
        ZL.spr(g, kind, cx, base + bob, PH[kind] / im.height * k);
      }
      g.restore();
      kar(g, t, {});
    }
  });
})();
