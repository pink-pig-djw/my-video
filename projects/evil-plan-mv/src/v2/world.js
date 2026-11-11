// v2/world.js — the dossier as one continuous world: a dark desk with pages ("spreads") laid on it, a camera gliding
// between them, depth layers, lamp light at night and soft daylight by day.
'use strict';
(function () {
  const { W, H, clamp, lerp, P, eIO, eIOs, eOut, eOut5, smooth, hash, noise } = EP;
  const PA = EP.PA;
  const WD = EP.WD = { spreads: [], keys: [], shakes: [], props: [], hand: 0.1, punch: null, punches: [], blooms: [], grades: [], byId: {} };

  // Camera keys: {t, x, y, z, r, d (move seconds; 0 = cut), e (easing), drift: {x, y, z, r} per second while holding}.
  // A key may name a spread instead of a position: {s: 'B', dx, dy} = that spread's centre plus an offset.
  function settle(k, until) { const h = Math.max(0, until - (k.t + (k.d || 0))), dr = k.drift || {}; return { x: k.x + (dr.x || 0) * h, y: k.y + (dr.y || 0) * h, z: k.z * (1 + (dr.z || 0) * h), r: (k.r || 0) + (dr.r || 0) * h }; }
  WD.cam = t => {
    const K = WD.keys; let i = 0;
    while (i + 1 < K.length && K[i + 1].t <= t) i++;
    const k = K[i], to = settle(k, t);
    if (i === 0 || !k.d) return to;
    const from = settle(K[i - 1], k.t), p = (EP.EASE[k.e || 'io'])(P(t, k.t, k.t + k.d));
    return { x: lerp(from.x, to.x, p), y: lerp(from.y, to.y, p), z: from.z * Math.pow(to.z / from.z, p), r: lerp(from.r, to.r, p) };
  };
  // world → screen for depth d (d > 0 is closer to the lens, so it is larger and moves faster)
  WD.apply = (g, c, d = 0) => {
    const s = c.z * (1 + d);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.translate(W / 2 + c.sx, H / 2 + c.sy); g.rotate(c.r + c.sr); g.scale(s, s); g.translate(-c.x, -c.y);
  };
  // inside a spread's draw: switch to another depth, keeping the spread's own transform
  WD.layer = (g, d) => { const { c, s } = WD.cur; WD.apply(g, c, d); g.translate(s.x, s.y); if (s.rot) g.rotate(s.rot); };
  WD.toScreen = (c, x, y, d = 0) => { const s = c.z * (1 + d), dx = (x - c.x) * s, dy = (y - c.y) * s, cr = Math.cos(c.r + c.sr), sr = Math.sin(c.r + c.sr); return [W / 2 + c.sx + dx * cr - dy * sr, H / 2 + c.sy + dx * sr + dy * cr]; };

  // Resolve spread-relative keys, order keys and spreads, and work out when each spread can be on screen.
  WD.finalize = () => {
    if (WD._done) return; WD._done = true;
    WD.spreads.forEach((s, i) => { s._i = i; WD.byId[s.id] = s; });
    WD.spreads.sort((a, b) => ((a.z || 0) - (b.z || 0)) || (a._i - b._i));
    for (const k of WD.keys) if (k.s) { const S = WD.byId[k.s]; if (!S) throw new Error('camera key names unknown spread ' + k.s); k.x = S.x + (k.dx || 0); k.y = S.y + (k.dy || 0); }
    WD.keys.sort((a, b) => a.t - b.t);
    WD.shakes.sort((a, b) => a[0] - b[0]);
    const dur = EP.T.duration;
    for (const s of WD.spreads) {
      if (s.win) continue;
      const R = Math.hypot(s.w, s.h) / 2 + 250;
      let a = Infinity, b = -Infinity;
      for (let t = 0; t <= dur + 0.05; t += 0.05) {
        const c = WD.cam(t), hw = W / 2 / c.z + 300, hh = H / 2 / c.z + 300;
        if (Math.abs(s.x - c.x) < hw + R && Math.abs(s.y - c.y) < hh + R) { a = Math.min(a, t); b = Math.max(b, t); }
      }
      s.win = isFinite(a) ? [Math.max(s.from ?? -1, a - 0.4), Math.min(s.until ?? 1e9, b + 0.4)] : [1e9, -1e9];
    }
  };
  WD.visible = (s, t) => !s.win || (t >= s.win[0] && t <= s.win[1]);

  function frameCam(t) {
    const c = WD.cam(t);
    let sx = 0, sy = 0, sr = 0;
    for (const [ti, a] of WD.shakes) { if (ti > t) break; const s = EP.impact(t - ti, a); sx += s.dx; sy += s.dy; sr += s.rot; }
    const hh = EP.handheld(t, WD.hand); sx += hh.dx; sy += hh.dy; sr += hh.rot * 0.5;
    if (WD.punch) c.z *= 1 + WD.punch(t);
    for (const [a, b, amp] of WD.punches) if (t > a && t < b) c.z *= 1 + amp * EP.dpulse(t, 6);
    c.sx = sx; c.sy = sy; c.sr = sr;
    return c;
  }
  WD.frameCam = frameCam;

  // how "night" the view is: weighted by distance to each spread's centre (blends during glides). A spread's mood is
  // 'night' | 'day' | 'stage' or a number (0 = day … 1 = night), or a function of t returning one of those.
  function moodAt(c, t) {
    let wsum = 0, night = 0, stage = 0;
    for (const s of WD.spreads) {
      if (!WD.visible(s, t)) continue;
      const d = Math.hypot(s.x - c.x, s.y - c.y), w = 1 / Math.pow(d + 400, 3), m = typeof s.mood === 'function' ? s.mood(t) : s.mood;
      const n = typeof m === 'number' ? m : (m === 'night' || m === 'stage' ? 1 : 0);
      wsum += w; night += w * n; stage += w * (m === 'stage' ? 1 : 0);
    }
    return wsum > 0 ? { night: night / wsum, stage: stage / wsum } : { night: 1, stage: 0 };
  }
  WD.moodAt = moodAt;

  let VIG = null;
  function vignette() {
    if (VIG) return VIG;
    const c = EP.mk(W, H), g = c.getContext('2d'), gr = g.createRadialGradient(W * 0.48, H * 0.44, H * 0.28, W / 2, H / 2, H * 1.05);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    return (VIG = c);
  }

  WD.render = (g, t) => {
    const c = frameCam(t), c2 = WD.cam(t + 1 / 30);
    EP.reset(g); g.fillStyle = '#140E0B'; g.fillRect(0, 0, W, H);
    // desk (slower, further away)
    WD.apply(g, c, -0.06);
    const vw = W / (c.z * 0.94) + 600, vh = H / (c.z * 0.94) + 600, T0 = PA.tex('desk'), S = 1024;
    const x0 = Math.floor((c.x - vw / 2) / S) * S, y0 = Math.floor((c.y - vh / 2) / S) * S;
    for (let y = y0; y < c.y + vh / 2; y += S) for (let x = x0; x < c.x + vw / 2; x += S) g.drawImage(T0, x, y, S, S);
    if (WD.under) { WD.apply(g, c, 0); g.save(); WD.under(g, t, c); g.restore(); }
    // spreads
    for (const s of WD.spreads) {
      if (!WD.visible(s, t)) continue;
      const R = Math.hypot(s.w, s.h) / 2 + 300, d = Math.hypot(s.x - c.x, s.y - c.y);
      if (d - R > Math.hypot(W, H) / 2 / c.z + 200) continue;
      WD.cur = { c, s };
      WD.apply(g, c, 0); g.translate(s.x, s.y); if (s.rot) g.rotate(s.rot);
      g.save(); s.draw(g, t, c); g.restore();
    }
    // desk props on a closer layer: they slide past faster during glides (a little out of focus)
    for (const pr of WD.props) {
      if ((pr.from !== undefined && t < pr.from) || (pr.until !== undefined && t > pr.until)) continue;
      const d = Math.hypot(pr.x - c.x, pr.y - c.y);
      if (d > Math.hypot(W, H) / c.z) continue;
      WD.apply(g, c, pr.d || 0.1); g.translate(pr.x, pr.y); if (pr.rot) g.rotate(pr.rot);
      g.save(); if (pr.blur) g.filter = `blur(${pr.blur}px)`; pr.draw(g, t); g.restore();
    }
    // light
    EP.reset(g);
    const m = moodAt(c, t);
    g.globalAlpha = lerp(0.3, 0.72, m.night); g.drawImage(vignette(), 0, 0); g.globalAlpha = 1;
    if (m.night > 0.02) {
      g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.16 * m.night * (1 - m.stage);
      const lp = g.createRadialGradient(W * 0.46, H * 0.36, 0, W * 0.46, H * 0.36, 1050); lp.addColorStop(0, 'rgba(255,190,110,1)'); lp.addColorStop(1, 'rgba(255,150,80,0)');
      g.fillStyle = lp; g.fillRect(0, 0, W, H); g.restore();
      EP.FX.dust(g, t, { n: 22, a: 0.35 * m.night });
    }
    if (m.night < 0.98) {
      g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.09 * (1 - m.night); g.fillStyle = '#FFF2DC'; g.fillRect(0, 0, W, H); g.restore();
      EP.FX.rays(g, t, { x: W * 0.95, y: -160, a0: 2.15, spread: 0.07, n: 7, alpha: 0.07 * (1 - m.night) });
    }
    // speed streaks on fast glides
    const sp = Math.hypot((c2.x - c.x) * c.z, (c2.y - c.y) * c.z) * 30;
    if (sp > 900) {
      const a = clamp((sp - 900) / 3000) * 0.5, dir = Math.atan2((c2.y - c.y), (c2.x - c.x));
      g.save(); g.translate(W / 2, H / 2); g.rotate(dir); g.strokeStyle = `rgba(255,248,235,${a})`; g.lineCap = 'round';
      for (let i = 0; i < 26; i++) { const y = (hash(i, 3) - 0.5) * H * 1.3, L = 120 + hash(i, 4) * 420 * a * 2, x = (hash(i, 5) - 0.5) * W * 1.2; g.lineWidth = 1 + hash(i, 6) * 3; g.beginPath(); g.moveTo(x - L / 2, y); g.lineTo(x + L / 2, y); g.stroke(); }
      g.restore();
    }
    // screen-space extras of the spread nearest the camera (confetti and the like)
    let near = null, nd = Infinity; for (const s of WD.spreads) { if (!WD.visible(s, t)) continue; const d = Math.hypot(s.x - c.x, s.y - c.y); if (d < nd) { nd = d; near = s; } }
    if (near && near.screen) { EP.reset(g); near.screen(g, t, c); }
    WD.lastMood = m;
    return c;
  };

  // value of a list of [t0, t1, amount, fadeIn?, fadeOut?] ranges at t (soft edges)
  WD.rangeVal = (list, t) => { let v = 0; for (const [a, b, amt, fi = 0.4, fo = 0.4] of list) { if (t < a - 0.001 || t > b) continue; v = Math.max(v, amt * Math.min(P(t, a, a + fi), 1 - P(t, b - fo, b))); } return v; };
})();
