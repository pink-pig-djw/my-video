// actors.js — the singing sunflower (bendable stem, head on the beat, Codex-painted mouth frames switched from the
// phoneme keys like cel animation), zombies with mouth frames, the dance crowd and walkers.
'use strict';
(function () {
  const { clamp, lerp, P, eOut, backOut, TAU, hash, noise, lastLE } = ZL;
  const MO = window.MOUTHS || {};       // patch boxes per sprite (tools/mouths.py)

  // ---------------------------------------------------------------- lip keys
  // window.SF_LIP = [[t, shape], ...] (sunflower visemes from tools/lipkeys.py), window.Z_LIP = [[t, shape], ...] (zombie
  // jaw for the male voice). Shapes switch instantly at their key time.
  const SF = window.SF_LIP || [], ZK = window.Z_LIP || [];
  const SFt = SF.map(k => k[0]), ZKt = ZK.map(k => k[0]);
  ZL.sfShape = t => { const i = lastLE(SFt, t); return i < 0 ? 'rest' : SF[i][1]; };
  ZL.zShape = t => { const i = lastLE(ZKt, t); return i < 0 ? 'mid' : ZK[i][1]; };
  // blinks: every 2.6–4.6 s, 0.13 s long; eyes also close where the keys say so (held notes)
  const EYES = window.SF_EYES || [];
  const EYt = EYES.map(k => k[0]);
  ZL.sfBlink = (t, seed = 0) => {
    const i = lastLE(EYt, t);
    if (i >= 0 && EYES[i][1] === 'closed') return true;
    let tb = 1.3 + hash(seed, 1) * 2;
    for (let k = 0; k < 200 && tb < t + 1; k++) {
      if (t >= tb && t < tb + 0.13) return true;
      tb += 2.6 + hash(seed, k + 2) * 2.0;
    }
    return false;
  };

  // ---------------------------------------------------------------- sunflower
  // Draw the sunflower with its base (ground point) at (x, y); s = screen px per sprite px of the head image.
  // o: {t, sing (use the lip keys), shape (force a mouth), sway (0..1 amount), bend (extra stem bend, px), tilt (rad),
  //     bob (0..1), blink, alpha, seed, look ('front')}
  ZL.sunflower = (g, x, y, s, o = {}) => {
    const t = o.t ?? 0, seed = o.seed ?? 0;
    const body = ZL.img.sf_body, head = ZL.img.sf_head;
    if (!body || !head) return;
    const SB = ZL.SP.sf_body, SH = ZL.SP.sf_head;
    const bs = s * (SB.scale || 1);              // body px are drawn at their own relative scale
    const bw = body.width * bs, bh = body.height * bs;
    // stem bend: a smooth sway on the beat plus any extra bend; the leaves (bottom) stay put
    const bp = ZL.beatPos(t);
    const sw = o.sway ?? 0.6;
    const bend = (o.bend || 0) + sw * Math.sin(bp * Math.PI) * 22 * s / 0.35 * 0.35 + noise(t * 0.7, seed + 5) * 6 * s;
    const bob = (o.bob ?? 0.6) * Math.pow(1 - ZL.beat(t).ph, 3);
    g.save();
    if (o.alpha != null) g.globalAlpha *= o.alpha;
    // body in horizontal slices, each shifted by bend * v^2 (v = height above the leaves)
    const N = 36, top = y - bh;
    for (let k = 0; k < N; k++) {
      const v0 = k / N, v1 = (k + 1) / N;            // from the top
      const hgt = 1 - (v0 + v1) / 2;                   // 1 at the top, 0 at the base
      const dx = bend * Math.pow(clamp((hgt - 0.25) / 0.75), 2);
      const sy0 = body.height * v0, sh = body.height / N;
      g.drawImage(body, 0, sy0, body.width, sh + 0.6, x - bw * SB.ax + dx, top + bh * v0, bw, bh / N + 0.6);
    }
    // neck point (stem tip) after the bend
    const nx = x + (SB.neck[0] - SB.ax) * bw + bend, ny = top + SB.neck[1] * bh + bob * 6 * s / 0.35;
    const tilt = (o.tilt || 0) + sw * Math.sin(bp * Math.PI) * 0.07 + noise(t * 0.5, seed + 11) * 0.03;
    g.translate(nx, ny);
    g.rotate(tilt);
    const sq = 1 + bob * 0.025;
    g.scale(s / sq, s * sq);
    const hx = -SH.ax * head.width, hy = -SH.ay * head.height;
    g.drawImage(head, hx, hy);
    // eyes (blink) and mouth patches, in head pixels
    const M = MO.sf_head || {};
    const F = ZL.SF_FORCE || {};                     // a scene can force her eyes/mouth (the final wink)
    const eyes = F.eyes || o.eyes || ((o.blink ?? ZL.sfBlink(t, seed)) ? 'closed' : null);
    if (eyes && M.eyes && ZL.img['sfe_' + eyes]) g.drawImage(ZL.img['sfe_' + eyes], hx + M.eyes.x, hy + M.eyes.y, M.eyes.w, M.eyes.h);
    const shape = F.shape || o.shape || (o.sing ? ZL.sfShape(t) : 'rest');
    if (shape !== 'rest' && M.mouth) {
      const m = ZL.img['sfm_' + shape];
      if (m) g.drawImage(m, hx + M.mouth.x, hy + M.mouth.y, M.mouth.w, M.mouth.h);
    }
    g.restore();
    return { nx, ny, hs: s, headW: head.width * s, headH: head.height * s };
  };

  // ---------------------------------------------------------------- zombies with mouths
  // Single zombie sprite with optional mouth patches zm_<name>_<shape> ('closed', 'wide'; the painted mouth is 'mid').
  ZL.zombie = (g, name, x, y, s, o = {}) => {
    const shape = o.shape || (o.sing ? ZL.zShape(o.t) : 'mid');
    // closed / wide are whole baked sprite variants (tools/mouths.py), the painted sprite is the 'mid' gape
    const im = (shape !== 'mid' && ZL.img[name + '__' + shape]) || ZL.img[name]; if (!im) return;
    const sp = ZL.SP[name] || { ax: 0.5, ay: 1 };
    g.save();
    g.translate(x, y);
    if (o.rot) g.rotate(o.rot);
    const sq = o.sq || 0;
    g.scale(s * (o.flip ? -1 : 1) * (1 - sq * 0.5), s * (1 + sq));
    if (o.alpha != null) g.globalAlpha *= o.alpha;
    g.drawImage(im, -sp.ax * im.width, -sp.ay * im.height);
    g.restore();
  };

  // Her head as a loose face disc + separate petals (so the zombie can bite them off one by one).
  // (x, y) = face centre, s = head px scale; petals: [{a (rad), v (sprite 0-5), gone (0..1 how far it has flown), rot}]
  const FACE = { cx: 607, cy: 568, r: 322 };          // face disc in sf_head cut px
  ZL.petalHead = (g, x, y, s, petals, o = {}) => {
    const head = ZL.img.sf_head; if (!head) return;
    g.save(); g.translate(x, y); g.scale(s, s);
    for (const p of petals) {
      if (p.gone >= 1) continue;
      const im = ZL.img['petal_' + p.v]; if (!im) continue;
      const d = FACE.r * 0.88 + p.gone * 900;
      g.save(); g.globalAlpha = 1 - p.gone;
      g.translate(Math.cos(p.a) * d, Math.sin(p.a) * d + p.gone * p.gone * 1400);
      g.rotate(p.a + Math.PI / 2 + (p.rot || 0) * p.gone);
      const ps = 330 / im.height;
      g.drawImage(im, -im.width * ps / 2, -im.height * ps * 0.92, im.width * ps, im.height * ps);
      g.restore();
    }
    g.beginPath(); g.arc(0, 0, FACE.r, 0, TAU); g.save(); g.clip();
    const hx = -FACE.cx, hy = -FACE.cy;
    g.drawImage(head, hx, hy);
    const M = (window.MOUTHS || {}).sf_head || {};
    if (o.shape && o.shape !== 'rest' && M.mouth && ZL.img['sfm_' + o.shape]) g.drawImage(ZL.img['sfm_' + o.shape], hx + M.mouth.x, hy + M.mouth.y, M.mouth.w, M.mouth.h);
    if (o.blink && M.eyes && ZL.img.sfe_closed) g.drawImage(ZL.img.sfe_closed, hx + M.eyes.x, hy + M.eyes.y, M.eyes.w, M.eyes.h);
    g.restore();
    g.lineWidth = 16; g.strokeStyle = '#2a1606'; g.beginPath(); g.arc(0, 0, FACE.r - 4, 0, TAU); g.stroke();
    g.restore();
  };
  // place a whole sunflower so that her face centre lands on (x, y) with head scale s; returns the base point
  ZL.sfBaseFor = (x, y, s) => {
    const SH = ZL.SP.sf_head, SB = ZL.SP.sf_body, head = ZL.img.sf_head, body = ZL.img.sf_body;
    if (!SH || !head || !body) return { x, y };
    const neckY = y + (SH.ay * head.height - FACE.cy) * s;          // neck below the face centre
    return { x: x - (SB.neck[0] - SB.ax) * body.width * s, y: neckY + (1 - SB.neck[1]) * body.height * s };
  };
  ZL.zImgs = name => [name, name + '__closed', name + '__wide'];
  ZL.SF_IMGS = ['sf_head', 'sf_body', 'sfe_closed', 'sfe_wink', ...['mbp', 'fv', 'small', 'ah', 'ahh', 'eh', 'ee', 'oh', 'oo', 'l', 'r'].map(m => 'sfm_' + m)];

  // ---------------------------------------------------------------- crowd
  // A dancing crowd: members [{x, y, s, ph, move, flip}] in world px; frames follow the beat (8 frames per 2 beats).
  ZL.crowd = (g, members, t, o = {}) => {
    const bp = ZL.beatPos(t);
    const list = members.slice().sort((a, b) => a.y - b.y);
    for (const m of list) {
      const anim = m.anim || o.anim || 'zdance_a';
      const fpb = o.fpb ?? 4;                                   // frames per beat
      const f = Math.floor((bp + (m.ph || 0)) * fpb + (o.foff || 0));
      const hop = o.hop ? Math.abs(Math.sin((bp + (m.ph || 0)) * Math.PI)) * o.hop * m.s : 0;
      if (o.shadow !== false) {
        g.save(); g.globalAlpha = 0.22 * (o.shadowA ?? 1); g.fillStyle = '#000';
        g.beginPath(); g.ellipse(m.x, m.y, 34 * m.s, 9 * m.s, 0, 0, TAU); g.fill(); g.restore();
      }
      ZL.anim(g, anim, f, m.x, m.y - hop, m.s, { flip: m.flip, img: o.img && o.img(anim) });
    }
  };
  ZL.varyCrowd = (members, seed, o = {}) => members.map((m, i) => ({
    ...m,
    ph: Math.floor(hash(i, seed) * 4) + (hash(i, seed + 1) - 0.5) * 0.18,
    anim: hash(i, seed + 2) < (o.idle ?? 0.27) ? 'zw_idle' : undefined,
    flip: hash(i, seed + 3) < (o.flip ?? 0.16),
    s: m.s * (0.93 + hash(i, seed + 4) * 0.14)
  }));
  // lay out a crowd inside a quad (tl, tr, br, bl in world px), rows get bigger toward the bottom (perspective)
  ZL.layoutCrowd = (seed, quad, rows, cols, sTop, sBot, o = {}) => {
    const R = ZL.rng(seed), out = [];
    const [tl, tr, br, bl] = quad;
    for (let r = 0; r < rows; r++) {
      const v = rows === 1 ? 0.5 : r / (rows - 1);
      const n = cols + (o.grow ? Math.round(v * o.grow) : 0);
      for (let c = 0; c < n; c++) {
        const u = (c + 0.5 + (r % 2 ? 0.35 : -0.15) + (R() - 0.5) * 0.45) / n;
        if (u < 0 || u > 1) continue;
        const lx = lerp(tl[0], tr[0], u), ly = lerp(tl[1], tr[1], u), rx = lerp(bl[0], br[0], u), ry = lerp(bl[1], br[1], u);
        const vv = clamp(v + (R() - 0.5) * (0.5 / rows));
        if (o.skip && o.skip(u, vv)) continue;
        out.push({ x: lerp(lx, rx, vv), y: lerp(ly, ry, vv), s: lerp(sTop, sBot, vv) * (0.94 + R() * 0.12), ph: o.sync === false ? R() * 2 : 0, flip: o.flipSome ? R() < o.flipSome : false, anim: o.anims ? o.anims[Math.floor(R() * o.anims.length)] : undefined });
      }
    }
    return out;
  };

  // ---------------------------------------------------------------- walkers
  // Walk frames play at a steady rate and the body moves by the walk's foot-locked ground track (ANIMS[anim].ground,
  // tools/footlock.py: cumulative ground units per frame), so the shoe on the ground stays put while the other swings.
  // w: {t0, x0, x1, y, s, anim, fps (frames/s) or t1}; returns {x, f, done, t1}.
  ZL.WALK = 'zwalk12';
  ZL.walkPos = (t, w) => {
    const anim = w.anim || ZL.WALK, A = ZL.AN[anim];
    const n = A.frames.length, G = A.ground || Array.from({ length: n + 1 }, (_, i) => i * 49.8 / 32);
    const D = Math.abs(w.x1 - w.x0) / w.s;
    const fps = w.fps || D / G[n] * n / (w.t1 - w.t0);
    const t1 = w.t0 + D / G[n] * n / fps;
    const f = Math.floor(clamp(t - w.t0, 0, t1 - w.t0) * fps + 1e-6);
    const dist = Math.min(D, Math.floor(f / n) * G[n] + G[f % n]);
    return { x: w.x0 + Math.sign(w.x1 - w.x0) * dist * w.s, f, done: t >= t1, t1 };
  };
  // Draw a walker; after arriving it stands and sways (the game's idle) if w.idle, else holds its last frame.
  ZL.walker = (g, t, w) => {
    if (t < w.t0) return null;
    const anim = w.anim || ZL.WALK, st = ZL.walkPos(t, w);
    const face = w.x1 > w.x0;                                   // the sprites face left; flip to walk right
    if (st.done && w.idle && ZL.AN.zw_idle) ZL.anim(g, 'zw_idle', Math.floor(ZL.beatPos(t) * 2 + (w.ph || 0)), st.x, w.y, w.s * 0.93, { flip: face, alpha: w.alpha });
    else ZL.anim(g, anim, st.f, st.x, w.y, w.s, { flip: face, alpha: w.alpha });
    return { x: st.x, y: w.y, done: st.done };
  };
})();
