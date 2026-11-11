// scenes/intro.js — 0–25.1 s: credits on black (a sun drops in as the label logo), then a dark stage: one spotlight
// clicks on and the sunflower sings her name; a second light finds a zombie who counts in; on her "ooh" the stage lights
// explode into chorus 1.
'use strict';
(function () {
  const { W, H, clamp, lerp, P, eOut, eIn, backOut, smooth, hash, noise, TAU } = ZL;
  const S = ZL.SCENES;

  // black stage floor: a faint warm floor plane so the pools of light have something to land on
  ZL.blackStage = (g, k = 1) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    const gr = g.createLinearGradient(0, H * 0.55, 0, H);
    gr.addColorStop(0, 'rgba(30,22,16,0)'); gr.addColorStop(1, `rgba(34,26,20,${0.55 * k})`);
    g.fillStyle = gr; g.fillRect(0, H * 0.55, W, H * 0.45);
  };
  // a spotlight that flickers on at t0 (lamp click) and off at t1
  ZL.lampK = (t, t0, t1 = 1e9) => {
    if (t < t0 || t > t1 + 0.12) return 0;
    const on = t - t0;
    let k = on < 0.05 ? 0.9 : on < 0.09 ? 0.15 : on < 0.16 ? 1 : on < 0.2 ? 0.55 : 1;
    if (t > t1) k *= 1 - (t - t1) / 0.12;
    return k;
  };

  S.push({
    id: 'credits', t0: 0, t1: 13.3, img: ['sun', 'zparts2_1'],
    draw(g, t) {
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      // before the music: a zombie hand creeps up from the bottom edge, waves, and sinks back
      if (t > 1.0 && t < 4.7) {
        const up = eOut(P(t, 1.0, 2.0)) * (1 - eIn(P(t, 3.9, 4.6)));
        const wave = Math.sin((t - 1.0) * 7) * 0.12 * P(t, 1.8, 2.2) * (1 - P(t, 3.6, 3.9));
        ZL.glow(g, W / 2, H + 40, 420, `rgba(120,140,110,${0.18 * up})`);
        ZL.spr(g, 'zparts2_1', W / 2, H + 70 + (1 - up) * 430, 0.62, { ax: 0.97, ay: 0.5, rot: Math.PI / 2 - 0.08 + wave });
      }
      // label logo: a sun drops, bounces and glows; SUNFLOWER RECORDS / presents
      const a0 = 4.85, a1 = 8.55;
      if (t >= a0 && t < a1) {
        const k = Math.min(P(t, a0, a0 + 0.3), 1 - P(t, a1 - 0.45, a1));
        const u = P(t, a0, a0 + 0.75);
        const y = u < 1 ? lerp(-120, 430, eIn(u)) : 430 - Math.abs(Math.sin((t - a0 - 0.75) * 7)) * 46 * Math.exp(-(t - a0 - 0.75) * 4.5);
        g.globalAlpha = k;
        ZL.glow(g, W / 2, y, 260 + 30 * Math.sin(t * 3), `rgba(255,220,90,${0.35 * k})`);
        const sun = ZL.img.sun;
        if (sun) { g.save(); g.translate(W / 2, y); g.rotate(t * 0.6); const s = 170 / sun.width; g.drawImage(sun, -sun.width * s / 2, -sun.height * s / 2, sun.width * s, sun.height * s); g.restore(); }
        const tk = P(t, a0 + 0.9, a0 + 1.4);
        g.globalAlpha = k * tk;
        ZL.text(g, 'SUNFLOWER RECORDS', W / 2, 620, { size: 74, font: ZL.F.bubbly, fill: '#ffd84a', stroke: '#3b2508', lw: 10 });
        g.globalAlpha = k * P(t, a0 + 1.6, a0 + 2.1);
        ZL.text(g, 'presents', W / 2, 700, { size: 54, fill: '#ffffff', lw: 0, shadow: 0 });
        g.globalAlpha = 1;
      }
      // "a music video starring ..."
      const b0 = 9.0, b1 = 12.95;
      if (t >= b0 && t < b1) {
        const k = Math.min(P(t, b0, b0 + 0.5), 1 - P(t, b1 - 0.5, b1));
        g.globalAlpha = k;
        ZL.text(g, 'a music video starring', W / 2, 520, { size: 64, lw: 0, shadow: 0 });
        ZL.text(g, 'some plants and some zombies', W / 2, 600, { size: 64, lw: 0, shadow: 0 });
        g.globalAlpha = 1;
      }
    }
  });

  // ---------------------------------------------------------------- the dark stage
  const SF = { x: 960, y: 800, s: 0.3 };
  const ZB = { x: 470, y: 1010, s: 0.352 };                     // bottom left, as in the original
  S.push({
    id: 'stage_intro', t0: 13.3, t1: 25.09, img: [...ZL.SF_IMGS, ...ZL.zImgs('z_basic'), 'zwalk12'],
    draw(g, t) {
      ZL.blackStage(g, P(t, 13.3, 14));
      const z0 = ZL.L(1) - 0.55;                                   // the second lamp, just before "one"
      // a slow push-in on her through the instrumental, eased back out when the second lamp comes on
      const push = smooth(P(t, 14.2, 22.2)) * (1 - smooth(P(t, z0 - 0.1, z0 + 0.6)));
      const zoom = 1 + 0.24 * push, burst = P(t, ZL.L(2) - 0.05, 25.05);
      g.save();
      g.translate(SF.x, SF.y - 230); g.scale(zoom, zoom); g.translate(-SF.x, -(SF.y - 230));
      const d = ZL.drift(t, 4); g.translate(d.sx, d.sy);
      const k1 = ZL.lampK(t, 13.32);
      ZL.spot(g, SF.x, -100, SF.x, SF.y, 260, { a: k1, dust: 34, t, seed: 3 });
      if (k1 > 0) {
        g.save(); g.globalAlpha = clamp(0.25 + k1 * 0.75);
        ZL.sunflower(g, SF.x, SF.y, SF.s, { t, sing: true, sway: t < 14.4 ? 0.25 : 0.7, seed: 1 });
        g.restore();
      }
      const k2 = ZL.lampK(t, z0);
      if (k2 > 0) {
        ZL.spot(g, ZB.x - 120, -100, ZB.x + 20, ZB.y, 210, { a: k2, col: [225, 240, 255], dust: 20, t, seed: 7 });
        g.save(); g.globalAlpha = clamp(0.2 + k2 * 0.8);
        if (t < z0 + 0.9) ZL.walker(g, t, { t0: z0 - 0.75, t1: z0 + 0.9, x0: ZB.x - 600, x1: ZB.x, y: ZB.y, s: 4.3 });   // walks in
        else ZL.zombie(g, 'z_basic', ZB.x, ZB.y, ZB.s, { rot: Math.sin(ZL.beatPos(t) * Math.PI) * 0.02, flip: true });
        g.restore();
      }
      g.restore();
      // "ooh": every light on the rig bursts open
      if (burst > 0) {
        ZL.burst(g, W / 2, -120, eIn(burst) * 0.9, t, { rays: 16, R: 2200 });
        ZL.flash(g, eIn(P(t, 24.8, 25.08)) * 0.95);
      }
    }
  });
})();
