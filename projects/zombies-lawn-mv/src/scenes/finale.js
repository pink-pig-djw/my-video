// scenes/finale.js — chorus 2 (the yard at night: searchlights, beat flashes, fog rolling over the pool), chorus 3 on the
// roof (a bungee zombie drops in, the giant robot's foot stomps down), the glowing lawn, the iris closing on the
// sunflower, and the end card.
'use strict';
(function () {
  const { W, H, clamp, lerp, P, eOut, eIn, eIO, backOut, smooth, hash, noise, TAU } = ZL;
  const S = ZL.SCENES;
  const Y = ZL.yard;
  const C2 = ZL.sec('chorus2'), C3 = ZL.sec('chorus3');
  const L = (base, k) => ZL.T.lines.filter(l => l.sec === ZL.T.lines[base].sec && !l.opt)[k];

  // ---------------------------------------------------------------- chorus 2: night
  const cam2 = t => {
    const l2 = L(C2, 1), l3 = L(C2, 2);
    const k = ZL.camKeys([
      [79.72, { x: 1720, y: 640, z: 1.25 }],
      [82.5, { x: 1700, y: 700, z: 0.95 }],
      [l2.t0 - 0.6, { x: 1700, y: 700, z: 0.98 }],
      [l2.t0, { x: 1745, y: 460, z: 2.45 }],
      [l3.t0 - 0.7, { x: 1735, y: 480, z: 2.25 }],
      [l3.t0 + 0.2, { x: 1680, y: 1150, z: 0.85 }],
      [96.4, { x: 1650, y: 1450, z: 0.95 }]
    ], t);
    const d = ZL.drift(t, 6, 0.003);
    return { ...k, sx: d.sx, sy: d.sy, r: d.r };
  };
  S.push({
    id: 'chorus2', t0: 79.72, t1: 96.4, img: ['bg/bg_yard_night', 'stage', 'mic', ...ZL.SF_IMGS, 'zdance_c', 'zw_idle', 'zduck2', 'fog_0', 'fog_1', 'fog_2', 'fog_3', 'fog_4', 'fog_5'],
    draw(g, t) {
      const fogIn = P(t, L(C2, 2).t0 + 0.6, 95.9);
      Y.drawYard(g, t, {
        bg: 'bg/bg_yard_night', night: true, cam: cam2, spots: 3,
        screen(g, t) {
          // a white strobe on every bar, like the original's night show
          ZL.flash(g, 0.62 * ZL.dpulse(t, 7.5) * (1 - fogIn), '#eef2ff');
          ZL.haze(g, t, fogIn, { top: H * 0.34, a: 0.8 });
          ZL.flash(g, P(t, 95.95, 96.4), '#000');
          ZL.karaoke(g, t, { band: 0.4 });
        }
      });
    }
  });

  // ---------------------------------------------------------------- chorus 3: the roof
  // roof world px (3072 x 2048): ridge from (444, 480) to (3072, 138); stage sits on the slope to the right
  const ROOF = {
    crowd: ZL.varyCrowd(ZL.layoutCrowd(23, [[330, 1060], [2950, 860], [3000, 1880], [260, 1960]], 5, 12, 1.6, 2.0, { grow: 1, skip: (u, v) => u > 0.55 && v < 0.12 }), 83),
    stage: [2250, 900]
  };
  const cam3 = t => {
    const l2 = L(C3, 1), l3 = L(C3, 2);
    const k = ZL.camKeys([
      [134.28, { x: 1650, y: 1100, z: 1.2 }],
      [137.0, { x: 1750, y: 1050, z: 0.86 }],
      [l2.t0 - 0.4, { x: 1800, y: 1000, z: 0.9 }],
      [l2.t0 + 0.2, { x: 2275, y: 590, z: 2.4 }],
      [l3.t0 - 0.9, { x: 2265, y: 600, z: 2.2 }],
      [l3.t0, { x: 1700, y: 1050, z: 0.75 }],
      [147.36, { x: 1650, y: 1080, z: 0.72 }]
    ], t);
    const d = ZL.drift(t, 6, 0.003);
    const st = ZL.shake(t, ROOF.stomp + 0.02, 30, 0.7);
    return { ...k, sx: d.sx + st.x, sy: d.sy + st.y, r: d.r };
  };
  ROOF.bungee = () => L(C3, 2).t0 + 0.25;      // drops once the camera has pulled back for line 3
  ROOF.stomp = 145.0;
  S.push({
    id: 'chorus3', t0: 134.28, t1: 147.36, img: ['bg/bg_roof', 'stage', 'mic', ...ZL.SF_IMGS, 'zdance_c', 'zw_idle', 'z_bungee', 'robot_foot'],
    draw(g, t) {
      const cam = cam3(t);
      cam.z *= 1 + 0.016 * ZL.dpulse(t, 6);
      g.save(); ZL.camApply(g, cam);
      const bg = ZL.img['bg/bg_roof']; if (bg) g.drawImage(bg, 0, 0, 3072, 2048);
      const st = Y.stageAt(g, ROOF.stage[0], ROOF.stage[1], 0.78, t);
      Y.singerOn(g, st, t, 0.78);
      ZL.crowd(g, ROOF.crowd, t, { anim: 'zdance_c', fpb: 2, foff: 1, hop: 0 });
      Y.lampBeams(g, st, t, 1, false);
      // the bungee zombie: drops on its cord over the crowd, bounces, waves to the beat, is yanked back up
      const b0 = ROOF.bungee(), b1 = b0 + 2.3;
      if (t > b0 - 0.6 && t < b1 + 0.6) {
        const drop = P(t, b0 - 0.6, b0), up = P(t, b1, b1 + 0.6);
        const bounce = drop >= 1 ? Math.sin((t - b0) * 11) * 90 * Math.exp(-(t - b0) * 2.4) : 0;
        const by = lerp(-1200, 620, eIn(drop)) + bounce - eIn(up) * 2000 + Math.sin(ZL.beatPos(t) * Math.PI) * 12;
        const bx = 1250;
        g.save(); g.strokeStyle = '#2a2a2a'; g.lineWidth = 10; g.beginPath(); g.moveTo(bx, -400); g.lineTo(bx, by + 10); g.stroke(); g.restore();
        ZL.spr(g, 'z_bungee', bx, by, 0.55, { ax: 0.5, ay: 0.0, rot: Math.sin(t * 3) * 0.06 });
      }
      // the robot's foot stomps down at the right edge of the roof
      const s0 = ROOF.stomp, s1 = 146.75;
      if (t > s0 - 0.5 && t < s1 + 0.6) {
        const down = P(t, s0 - 0.5, s0), lift = P(t, s1, s1 + 0.6);
        const fy = lerp(-900, 1500, eIn(down)) - eIn(lift) * 2400;
        ZL.spr(g, 'robot_foot', 2900, fy, 1.25, { ax: 0.5, ay: 1 });
        if (t > s0) {                                            // dust puffs
          for (let i = 0; i < 10; i++) {
            const age = t - s0, a = clamp(1 - age / 1.2);
            if (a <= 0) break;
            const dir = (i / 9 - 0.5) * 2.4;
            g.save(); g.globalAlpha = a * 0.7; g.fillStyle = '#d9c7b0';
            g.beginPath(); g.arc(2900 + Math.sin(dir) * age * 700, 1480 - Math.cos(dir) * age * 160, 60 + age * 120, 0, TAU); g.fill(); g.restore();
          }
        }
      }
      g.restore();
      ZL.karaoke(g, t, { band: 0.35 });
    }
  });

  // ---------------------------------------------------------------- the glowing lawn, the iris, the wink
  // The iris closes to a ring around her face, she winks and the picture freezes, then the iris shuts (the original's
  // ending: ring at 2:32.9, wink, frozen until 2:35.1, closed by 2:35.4).
  const IRIS0 = 151.75, IRIS_RING = 152.9, WINK = 153.1, FREEZE = 153.25, SHUT0 = 155.1, SHUT1 = 155.4;
  const camF = t => {
    const k = ZL.camKeys([
      [147.36, { x: 1700, y: 900, z: 0.7 }],
      [150.5, { x: 1710, y: 820, z: 0.8 }],
      [IRIS0, { x: 1735, y: 560, z: 1.2 }],
      [IRIS_RING, { x: 1745, y: 520, z: 2.0 }]
    ], t);
    return { ...k, ...{ sx: 0, sy: 0, r: 0 } };
  };
  S.push({
    id: 'final', t0: 147.36, t1: SHUT1 + 0.05, img: ['bg/bg_yard_day', 'stage', 'mic', ...ZL.SF_IMGS, 'zdance_c', 'zw_idle', 'zduck2'],
    draw(g, t) {
      const tt = Math.min(t, FREEZE);                              // the picture stops at FREEZE
      ZL.SF_FORCE = t >= WINK ? { eyes: 'wink', shape: 'rest' } : null;
      let face = null;
      Y.drawYard(g, tt, {
        bg: 'bg/bg_yard_day', cam: camF, beams: 1.4, spots: 3,
        after() { face = ZL.lastFace && { ...ZL.lastFace }; },
        screen(g) {
          // the lawn glows green; white follow-spots roam the crowd and a white strobe hits every bar
          g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = 'rgba(80,255,90,0.4)'; g.fillRect(0, 0, W, H); g.restore();
          ZL.flash(g, 0.58 * ZL.dpulse(tt, 7.5) * (1 - P(t, IRIS0, IRIS0 + 0.4)), '#f2fff2');
          ZL.flash(g, 1 - eOut(P(t, 147.36, 147.7)));
          ZL.karaoke(g, tt, { band: 0.35, alpha: 1 - P(t, IRIS0 - 0.2, IRIS0 + 0.3) });
        }
      });
      ZL.SF_FORCE = null;
      // her face on screen (world -> screen with the frozen camera)
      const cam = camF(tt); cam.z *= 1 + 0.016 * ZL.dpulse(tt, 6);
      const fx = face ? (face.x - cam.x) * cam.z + W / 2 : W / 2, fy = face ? (face.y - cam.y) * cam.z + H / 2 : H / 2;
      // a little twinkle by the winking eye
      if (t >= WINK && t < WINK + 0.5) ZL.sparkles(g, fx + 95, fy - 70, 40, 3, t - WINK, 1 - P(t, WINK + 0.3, WINK + 0.5), 5);
      const R = 330;
      if (t >= IRIS0) {
        const r = t < SHUT0 ? lerp(1300, R, eIO(P(t, IRIS0, IRIS_RING))) : lerp(R, 0, eIn(P(t, SHUT0, SHUT1)));
        ZL.iris(g, lerp(W / 2, fx, eIO(P(t, IRIS0, IRIS_RING))), lerp(H / 2, fy, eIO(P(t, IRIS0, IRIS_RING))), r);
      }
    }
  });

  // ---------------------------------------------------------------- end card
  S.push({
    id: 'end', t0: SHUT1 + 0.05, t1: 161.0, img: ['title_end'],
    draw(g, t) {
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      const k = backOut(clamp((t - 155.75) / 0.6), 1.6);
      if (k > 0) ZL.spr(g, 'title_end', W / 2, 440, 0.82 * k, { ax: 0.5, ay: 0.5 });
      const a1 = P(t, 156.4, 156.9), a2 = P(t, 157.4, 157.9);
      g.save(); g.globalAlpha = a1;
      ZL.text(g, 'song: "Zombies on Your Lawn" by Laura Shigihara', W / 2, 760, { size: 46, lw: 0, shadow: 0 });
      g.globalAlpha = a2;
      ZL.text(g, 'a Plants vs. Zombies fan music video  ·  2026.10.27', W / 2, 840, { size: 40, lw: 0, shadow: 0, fill: '#c9c9c9' });
      g.restore();
    }
  });
})();
