const hash = (a, b = 0, c = 0) => { let h = Math.imul(a | 0, 374761393) ^ Math.imul((b | 0) + 0x9E37, 668265263) ^ Math.imul((c | 0) + 0x85EB, 1274126177); h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
const W = 1920, walk0 = 74.2;
for (let i = 0; i < 12; i++) {
  const fromLeft = i % 2 === 0, y = 200 + (i * 83) % 820, d = hash(i, 5) * 1.6;
  const w = { t0: walk0 + d, x0: fromLeft ? -150 : W + 150, x1: fromLeft ? 760 + hash(i, 6) * 200 : 1160 - hash(i, 6) * 200, y: y + 120, s: 1.15 + hash(i, 7) * 0.3 };
  w.t1 = w.t0 + 6;
  const row = [];
  for (const t of [77.0, 77.1, 77.2, 77.3]) { const u = Math.min(1, Math.max(0, (t - w.t0) / (w.t1 - w.t0))); const x = w.x0 + (w.x1 - w.x0) * u; row.push(`${x.toFixed(0)}/f${Math.floor(Math.abs(x - w.x0) / w.s / 4.2) % 32}`); }
  console.log(i, 'y', w.y, 's', w.s.toFixed(2), row.join(' '));
}
