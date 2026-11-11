// scenes/chorus.js — the three choruses as one backyard concert seen from above (the reference's crowd shots): the stage
// with the singing sunflower on the lawn, a crowd of zombies dancing in sync to the beat, duck-ring zombies bobbing in
// the pool. Chorus 1 by day, chorus 2 at night (sweeping lights, beat flashes, fog rolling in over the pool), chorus 3
// on the roof (a bungee zombie drops in, the giant robot's foot stomps down), ending on the glowing lawn.
'use strict';
(function () {
  const { W, H, clamp, lerp, P, eOut, eIn, eIO, backOut, smooth, hash, noise, TAU } = ZL;
  const S = ZL.SCENES;
  // stage sprite geometry (fractions of the cut): platform surface, lamps
  const ST = { floor: 0.74, speakers: [[0.06, 0.43, 0.165, 0.72], [0.835, 0.43, 0.94, 0.72]], lamps: [[0.299, 0.228, [255, 70, 60]], [0.43, 0.228, [70, 170, 255]], [0.569, 0.23, [255, 220, 60]], [0.701, 0.228, [80, 255, 120]]] };

  // ---------------------------------------------------------------- the concert world
  // world px = the upscaled background's px (3072 x 2048 for the 1536 x 1024 paintings)
  function stageAt(g, sx, sy, ss, t, o = {}) {
    const im = ZL.img.stage; if (!im) return null;
    const w = im.width * ss, h = im.height * ss, x0 = sx - w / 2, y0 = sy - h;
    // lamp beams behind? no — in front, after the singer
    ZL.spr(g, 'stage', sx, sy, ss);
    const b = ZL.beat(t), k = Math.exp(-b.dt * 5.5);
    if (k > 0.02 && b.i >= 0) {
      const box = ST.speakers[b.i % 2];
      const bx = x0 + w * box[0], by = y0 + h * box[1], bw = w * (box[2] - box[0]), bh = h * (box[3] - box[1]);
      g.save(); g.beginPath(); g.rect(bx, by, bw, bh); g.clip();
      g.globalCompositeOperation = 'screen';
      const gr = g.createRadialGradient(bx + bw / 2, by + bh * 0.62, 0, bx + bw / 2, by + bh * 0.62, bh * 0.75);
      gr.addColorStop(0, `rgba(255,70,70,${0.95 * k})`); gr.addColorStop(1, `rgba(255,40,40,${0.35 * k})`);
      g.fillStyle = gr; g.fillRect(bx, by, bw, bh); g.restore();
    }
    const fx = sx, fy = y0 + h * ST.floor;
    return { x0, y0, w, h, fx, fy };
  }
  function singerOn(g, st, t, ss, o = {}) {
    const s = ss * 0.25;     // sunflower head px -> world px
    const res = ZL.sunflower(g, st.fx + 6 * ss / 0.75, st.fy, s, { t, sing: true, sway: 0.8, seed: 5 });
    if (res) ZL.lastFace = { x: res.nx, y: res.ny - 215 * s };   // face centre: 215 head px above the neck
    // the mic stands to her left, the head of the mic near her chin
    ZL.spr(g, 'mic', st.fx - 150 * ss / 0.75, st.fy + 14 * ss / 0.75, 0.21 * ss / 0.75);
  }
  function lampBeams(g, st, t, k, night) {
    if (!st) return;
    const bp = ZL.beatPos(t), pulse = ZL.pulse(t, 6);
    ST.lamps.forEach(([u, v, col], i) => {
      const lx = st.x0 + st.w * u, ly = st.y0 + st.h * v;
      const swing = Math.sin(bp * Math.PI * 0.5 + i * 1.7) * 0.55 + (i - 1.5) * 0.18;
      const a = k * (night ? 0.75 + pulse * 0.25 : 0.32 + pulse * 0.2);
      ZL.sweep(g, lx, ly, night ? 1500 : 900, swing, night ? 210 : 150, col, a);
      // the lamp lens glows
      g.save(); g.globalCompositeOperation = 'screen';
      const gr = g.createRadialGradient(lx, ly, 0, lx, ly, 46);
      gr.addColorStop(0, `rgba(${col},${0.9 * k})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(lx - 46, ly - 46, 92, 92); g.restore();
    });
  }
  function followSpots(g, t, n) {
    for (let i = 0; i < n; i++) {
      const fx = 1720 + Math.sin(t * 0.55 + i * 2.4) * 950 + Math.sin(t * 0.21 + i) * 180;
      const fy = 1080 + Math.sin(t * 0.43 + i * 1.3) * 170;
      ZL.spot(g, fx + (i - 1) * 260, -300, fx, fy, 230, { a: 0.85, ry: 70, w0: 70, col: [245, 250, 255] });
    }
  }
  ZL.followSpots = followSpots;
  function ripples(g, x, y, s, t, i) {
    g.save(); g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 3;
    for (let k = 0; k < 2; k++) {
      const ph = ((t * 0.7 + hash(i, 4) + k * 0.5) % 1);
      g.globalAlpha = 0.6 * (1 - ph);
      g.beginPath(); g.ellipse(x, y - 8 * s, (60 + ph * 70) * s, (14 + ph * 16) * s, 0, 0, TAU); g.stroke();
    }
    g.restore();
  }
  // the yard concert (chorus 1 and 2, and the final lawn)
  function makeYard(seed) {
    const crowd = ZL.varyCrowd(ZL.layoutCrowd(seed, [[560, 900], [2960, 900], [3040, 1270], [470, 1270]], 4, 12, 1.85, 2.2, { grow: 2 }), 61);
    const ducks = ZL.layoutCrowd(seed + 3, [[560, 1470], [2950, 1470], [2950, 1860], [560, 1860]], 3, 7, 1.7, 1.9, {});
    return { crowd, ducks };
  }
  const YARD = makeYard(11);
  // the crowd dances the calm head-bobbing groove of the original (one move for everybody, in sync)
  const danceAt = () => 'zdance_c';

  function drawYard(g, t, cfg) {
    const cam = cfg.cam(t);
    cam.z *= 1 + 0.016 * ZL.dpulse(t, 6);                  // a small punch on every downbeat
    g.save();
    ZL.camApply(g, cam);
    const bg = ZL.img[cfg.bg];
    if (bg) g.drawImage(bg, 0, 0, 3072, 2048);
    if (cfg.night) { g.fillStyle = 'rgba(10,14,50,0.0)'; g.fillRect(0, 0, 3072, 2048); }
    const st = stageAt(g, 1720, 790, 0.78, t);
    singerOn(g, st, t, 0.78);
    // duck zombies in the pool (behind nothing)
    for (const [i, m] of YARD.ducks.entries()) {
      const bob = Math.sin(t * 1.6 + i) * 3;
      ripples(g, m.x, m.y + bob, m.s, t, i);
      ZL.anim(g, 'zduck2', Math.floor((ZL.beatPos(t) + Math.floor(hash(i, 71) * 4)) * 2 + 1), m.x, m.y + bob, m.s, { flip: hash(i, 72) < 0.2 });
    }
    // the crowd
    const anim = danceAt(t, cfg.swaps || []);
    ZL.crowd(g, YARD.crowd, t, { anim, fpb: 2, foff: 1, hop: 0, shadowA: cfg.night ? 0.6 : 1 });
    if (cfg.spots) followSpots(g, t, cfg.spots);
    lampBeams(g, st, t, cfg.beams ?? 1, cfg.night);
    if (cfg.after) cfg.after(g, t, cam);
    g.restore();
    if (cfg.screen) cfg.screen(g, t);
  }

  // ---------------------------------------------------------------- chorus 1 (day)
  const C1 = ZL.sec('chorus1');                   // first line of chorus 1
  const C1L = [C1, C1 + 1, C1 + 3, C1 + 4];       // the four sung lines (C1+2 and C1+5 are the backing "yeah"s)
  const cam1 = t => {
    const k = ZL.camKeys([
      [25.09, { x: 1760, y: 700, z: 0.92 }],
      [28.6, { x: 1700, y: 700, z: 1.05 }],
      [29.4, { x: 1745, y: 460, z: 2.5 }],
      [32.6, { x: 1735, y: 480, z: 2.3 }],
      [33.7, { x: 1700, y: 900, z: 0.95 }],
      [36.9, { x: 1640, y: 1400, z: 0.98 }],
      [40.6, { x: 1700, y: 1060, z: 0.66 }],
      [42.2, { x: 1700, y: 1010, z: 0.7 }]
    ], t);
    const d = ZL.drift(t, 6, 0.003);
    return { ...k, sx: d.sx, sy: d.sy, r: d.r };
  };
  S.push({
    id: 'chorus1', t0: 25.09, t1: 42.19, img: ['bg/bg_yard_day', 'stage', 'mic', ...ZL.SF_IMGS, 'zdance_c', 'zw_idle', 'zduck2'],
    draw(g, t) {
      drawYard(g, t, {
        bg: 'bg/bg_yard_day', cam: cam1,
        screen(g, t) {
          ZL.flash(g, 1 - eOut(P(t, 25.09, 25.6)));
          ZL.karaoke(g, t, { band: 0.35 });
        }
      });
    }
  });
  ZL.yard = { drawYard, YARD, stageAt, singerOn, lampBeams };
})();
