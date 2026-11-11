// scenes/panels.js — the zombies introduce themselves (the reference's comic panels with speech bubbles): each zombie
// sings his own line (low voice, jaw keys Z_LIP) in a framed panel; the sunflower answers his line in a round porthole
// (her echoes, lip-synced); more zombies shuffle in from every side; WE ARE THE UNDEAD! slams down and every panel
// zombie shouts it; a close-up of a packed zombie crowd cuts into the next chorus.
'use strict';
(function () {
  const { W, H, clamp, lerp, P, eOut, eIn, eIO, backOut, smooth, hash, noise, TAU } = ZL;
  const S = ZL.SCENES;
  const pop = (t, t0, d = 0.35) => t < t0 ? 0 : backOut(clamp((t - t0) / d), 2.0);
  const Z1 = ZL.sec('zombies1'), Z2 = ZL.sec('zombies2');
  const line = i => ZL.T.lines[i];
  const lend = i => { const ws = line(i).words; return ws[ws.length - 1].t1; };

  // a framed panel: picture crop of a background (bg name, crop box in its px) and whatever is drawn inside
  // k = how far the panel has been wiped open, left to right (the original's panels open like this)
  function panel(g, r, k, bgName, crop, inside) {
    if (k <= 0.01) return;
    const [x, y, w, h] = r;
    g.save();
    g.beginPath(); g.rect(x - 40, y - 40, (w + 80) * k, h + 80); g.clip();
    g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 24; g.shadowOffsetY = 8;
    g.fillStyle = '#f4f0e6'; g.fillRect(x - 7, y - 7, w + 14, h + 14);
    g.shadowColor = 'transparent';
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    const bg = ZL.img[bgName];
    if (bg) { const [sx, sy, sw, sh] = crop; g.drawImage(bg, sx, sy, sw, sh, x, y, w, h); }
    inside(g);
    // a soft inner shade so the frame reads as a panel
    const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.18)');
    g.fillStyle = gr; g.fillRect(x, y, w, h);
    g.restore();
    g.restore();
  }
  // the sunflower's round porthole for her echoes
  function porthole(g, t, cx, cy, R, k, o = {}) {
    if (k <= 0.01) return;
    g.save(); g.translate(cx, cy); g.scale(k, k); g.translate(-cx, -cy);
    g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 24; g.shadowOffsetY = 8;
    g.fillStyle = '#f4f0e6'; g.beginPath(); g.arc(cx, cy, R + 8, 0, TAU); g.fill();
    g.shadowColor = 'transparent';
    g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.clip();
    const gr = g.createRadialGradient(cx, cy - R * 0.3, 0, cx, cy, R);
    gr.addColorStop(0, '#3a2a55'); gr.addColorStop(1, '#120c1e');
    g.fillStyle = gr; g.fillRect(cx - R, cy - R, R * 2, R * 2);
    ZL.glow(g, cx, cy - R * 0.2, R * 1.1, 'rgba(255,230,160,0.35)');
    const hs = R * 1.55 / 1207, base = ZL.sfBaseFor(cx, cy + R * 0.05, hs);
    ZL.sunflower(g, base.x, base.y, hs, { t, sing: true, sway: 0.25, seed: 9, tilt: o.tilt || 0, bend: o.bend || 0 });
    g.restore();
  }
  // a zombie in a panel, swaying a little; sings (jaw keys) while `singing` is true
  function panelZombie(g, name, x, y, s, t, singing, o = {}) {
    const sway = Math.sin(ZL.beatPos(t) * Math.PI) * 0.025;
    ZL.zombie(g, name, x, y, s, { t, sing: singing, rot: sway, flip: o.flip });
  }

  // one panel section: three zombies + the porthole + walkers + the UNDEAD title
  function section(cfg) {
    const { t0, t1, Z, cast, walk0 } = cfg;
    const L = k => Z + k;                                   // lines: Z+0 zombie A, +1 echo, +2 zombie B, +3 echo, +4 zombie C, +5 echo, +6 undead
    const undead = line(L(6)).t0 - 0.05;
    // [arrive x, feet y, start x]; starts off-screen or hidden behind a panel; they arrive just before "undead"
    const SLOTS = [[1790, 235, 2040], [1870, 395, 2040], [1790, 560, 2040], [1870, 720, 2040], [1790, 880, 2040], [1870, 1050, 2040],
      [1600, 632, 2040], [1400, 632, 2040], [1215, 632, 2040],
      [830, 215, 1320], [1050, 300, 1340], [930, 455, 1300], [1080, 600, 600], [800, 660, 560],
      [620, 175, -120], [95, 600, -120], [160, 760, -120], [95, 920, -120], [300, 1065, -120], [480, 1065, -120]];
    const FPS = 20;                                          // a brisk walk: one 12-frame cycle in 0.6 s
    const walkers = SLOTS.map(([x1, y, x0], i) => {
      const s = 1.12 + hash(i, 7) * 0.16, D = Math.abs(x1 - x0) / s;
      const dur = D / ZL.AN.zwalk12.ground[12] * 12 / FPS;
      const arrive = undead - 0.1 - hash(i, 5) * 0.9;
      return { t0: arrive - dur, x0, x1, y, s, fps: FPS, idle: true, ph: Math.floor(hash(i, 6) * 8) };
    }).sort((a, b) => a.y - b.y);
    S.push({
      id: cfg.id, t0, t1, img: cfg.img,
      draw(g, t) {
        g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
        // faint moving spot glow in the background
        ZL.glow(g, 960 + Math.sin(t * 0.7) * 300, 540, 700, 'rgba(60,70,90,0.35)');
        const shU = ZL.shake(t, undead + 0.1, 14, 0.6);
        g.save(); g.translate(shU.x, shU.y);
        // walkers (behind the panels)
        for (const w of walkers) ZL.walker(g, t, w);
        // panels and their zombies
        cast.forEach((c, k) => {
          const zi = L(k * 2), kk = eOut(P(t, line(zi).t0 - 0.6, line(zi).t0 - 0.2));
          const singing = (t >= line(zi).t0 - 0.1 && t <= lend(zi) + 0.2) || t >= undead;
          panel(g, c.rect, kk, c.bg, c.crop, gg => panelZombie(gg, c.name, c.zx, c.zy, c.zs, t, singing, c));
        });
        // the porthole with the sunflower and her echoes
        const ph = cfg.port, pk = pop(t, line(L(1)).t0 - 0.45, 0.4);
        const noShake = cfg.noShake ? cfg.noShake(t) : 0;
        porthole(g, t, ph[0], ph[1], ph[2], pk, { tilt: noShake });
        // bubbles: each zombie line from its start to the next zombie line; each echo from its start to the next line
        cast.forEach((c, k) => {
          const zi = L(k * 2), ei = L(k * 2 + 1);
          const a = line(zi).t0 - 0.15, b = line(L(k * 2 + 2)).t0 - 0.2;
          if (t >= a && t < b) {
            const kb = pop(t, a, 0.25) * (1 - P(t, b - 0.15, b));
            ZL.bubble(g, c.bub[0], c.bub[1], c.tail[0], c.tail[1], ZL.lineWords(zi), t, kb, { size: 46, maxW: 340 });
          }
          const ea = line(ei).t0 - 0.12, eb = line(L(k * 2 + 2)).t0 - 0.1;
          if (t >= ea && t < eb) {
            const kb = pop(t, ea, 0.25) * (1 - P(t, eb - 0.15, eb));
            const ws = ZL.lineWords(ei).map((w, j, arr) => ({ w: (j === 0 ? '(' : '') + w.w.replace(/[()]/g, '') + (j === arr.length - 1 ? ')' : ''), t0: w.t0 }));
            ZL.bubble(g, cfg.echoBub[0], cfg.echoBub[1], ph[0] + ph[2] * 0.55, ph[1] - ph[2] * 0.2, ws, t, kb, { size: 38, maxW: 300, col: '#7a4a00' });
          }
        });
        g.restore();
        // WE ARE THE UNDEAD!: the title slams down, little bubbles pop from the walkers
        if (t >= undead) {
          const k = P(t, undead, undead + 0.3), sc = lerp(2.4, 1, eOut(k));
          g.save(); g.translate(930, 935); g.scale(sc, sc);
          ZL.spr(g, 'title_undead', 0, 0, 0.5, { ax: 0.5, ay: 0.5, alpha: k });
          g.restore();
          const ws = ZL.lineWords(L(6));
          [[430, 250], [1500, 470], [760, 600], [1250, 230]].forEach(([bx, by], i) => {
            const tb = undead + 0.25 + i * 0.28, kb = pop(t, tb, 0.25);
            if (kb > 0) ZL.bubble(g, bx, by, bx + 40, by + 90, ws.map(w => ({ w: w.w.replace('!', ''), t0: null })), t, kb * 0.8, { size: 30, maxW: 400 });
          });
        }
        if (cfg.after) cfg.after(g, t);
      }
    });
  }

  // ---------------------------------------------------------------- section 1: football, cones, screen door
  // backgrounds in their upscaled px (3072 x 2048)
  section({
    id: 'panels1', t0: 62.6, t1: 78.95, Z: Z1, walk0: 74.2,
    img: [...ZL.SF_IMGS, ...ZL.zImgs('z_football'), ...ZL.zImgs('z_cone'), ...ZL.zImgs('z_door'), 'bg/bg_yard_day', 'bg/bg_yard_night', 'bg/t_lawn', 'zwalk12', 'zw_idle', 'title_undead'],
    port: [300, 250, 165], echoBub: [640, 250],
    cast: [
      { name: 'z_football', rect: [1180, 70, 520, 340], bg: 'bg/bg_yard_day', crop: [1300, 500, 1100, 720], zx: 1520, zy: 470, zs: 0.33, bub: [900, 150], tail: [1388, 180] },
      { name: 'z_cone', rect: [210, 470, 520, 340], bg: 'bg/bg_yard_night', crop: [900, 450, 1100, 720], zx: 470, zy: 900, zs: 0.31, bub: [1000, 540], tail: [385, 612] },
      { name: 'z_door', rect: [1160, 650, 520, 340], bg: 'bg/t_lawn', crop: [900, 700, 1100, 720], zx: 1460, zy: 1080, zs: 0.33, bub: [960, 720], tail: [1362, 752] }
    ]
  });

  // ---------------------------------------------------------------- section 2: tricycle, butter, dolphin
  section({
    id: 'panels2', t0: 116.45, t1: 133.6, Z: Z2, walk0: 129.6,
    img: [...ZL.SF_IMGS, ...ZL.zImgs('z_trike'), ...ZL.zImgs('z_butter'), ...ZL.zImgs('z_dolphin'), 'bg/bg_door', 'bg/bg_grid_night', 'bg/bg_yard_day', 'zwalk12', 'zw_idle', 'title_undead'],
    port: [300, 250, 165], echoBub: [640, 250],
    // "(no, no, no, no)": she shakes her head on each "no"
    noShake: t => { const i = Z2 + 5, ws = ZL.T.lines[i].words; if (t < ws[0].t0 - 0.05 || t > ws[ws.length - 1].t1 + 0.2) return 0; return Math.sin((t - ws[0].t0) * 14) * 0.16; },
    cast: [
      { name: 'z_trike', rect: [1180, 70, 520, 340], bg: 'bg/bg_door', crop: [200, 600, 1100, 720], zx: 1470, zy: 470, zs: 0.3, bub: [900, 150], tail: [1468, 202] },
      { name: 'z_butter', rect: [210, 470, 520, 340], bg: 'bg/bg_grid_night', crop: [1000, 700, 1100, 720], zx: 470, zy: 900, zs: 0.31, bub: [1000, 540], tail: [392, 610] },
      { name: 'z_dolphin', rect: [1160, 650, 520, 340], bg: 'bg/bg_yard_day', crop: [1100, 1380, 1100, 720], zx: 1420, zy: 940, zs: 0.31, bub: [960, 760], tail: [1362, 772] }
    ]
  });

  // ---------------------------------------------------------------- crowd close-up cuts into the next chorus
  function crowdCut(id, t0, t1) {
    S.push({
      id, t0, t1, img: ['bg/crowd_faces'],
      draw(g, t) {
        const im = ZL.img['bg/crowd_faces']; if (!im) return;
        const k = P(t, t0, t1), z = lerp(1.35, 1.0, eOut(k));
        g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2);
        g.drawImage(im, 0, (H - W * im.height / im.width) / 2, W, W * im.height / im.width);
        g.restore();
        ZL.flash(g, 1 - P(t, t0, t0 + 0.15));
        const sh = Math.sin(t * 40) * 3;
        ZL.vignette(g, 0.45);
        void sh;
      }
    });
  }
  crowdCut('crowd1', 78.95, 79.72);
  crowdCut('crowd2', 133.6, 134.28);
  // the faces dissolve into the concert (drawn over the chorus scenes)
  [[79.72, 80.3], [134.28, 134.9]].forEach(([a, b]) => ZL.OVER.push({
    t0: a, t1: b, img: ['bg/crowd_faces'],
    draw(g, t) {
      const im = ZL.img['bg/crowd_faces']; if (!im) return;
      g.globalAlpha = 1 - smooth(P(t, a, b));
      g.drawImage(im, 0, (H - W * im.height / im.width) / 2, W, W * im.height / im.width);
    }
  }));
})();
