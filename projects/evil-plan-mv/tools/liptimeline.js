// Exports the film's mouth timeline (the same code as the page: data/timing.js, data/lipkeys.js if present, v2/lip.js,
// v2/sec_sing.js) at 100 Hz for checking against the voice: node tools/liptimeline.js render/lipcheck/timeline.json [--old]
// (--old: ignore data/lipkeys.js, i.e. the word-timing estimate)
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), rd = f => fs.readFileSync(path.join(root, f), 'utf8');
global.window = {};
eval(rd('src/data/timing.js'));
const NOKEYS = process.argv.includes('--old');
if (!NOKEYS && fs.existsSync(path.join(root, 'src/data/lipkeys.js'))) eval(rd('src/data/lipkeys.js'));
const T = window.TIMING;
global.EP = { T, L: i => T.lines[i].t0, E: i => T.lines[i].t1, ASSETS: [], WD: { keys: [] } };
window.MOUTHS = {};
eval(rd('src/v2/lip.js'));
eval(rd('src/v2/sec_sing.js'));
const LIP = EP.LIP, out = [];
for (let k = 0; k < Math.ceil(T.duration * 100); k++) {
  const t = k / 100, on = LIP.on(t, '*') || [...LIP.PLAN.values()].some(s => s && [...s].some(p => LIP.on(t, p)));
  out.push(on ? LIP.shapeAt(t) : '');
}
fs.mkdirSync(path.dirname(path.resolve(process.argv[2])), { recursive: true });
fs.writeFileSync(process.argv[2], JSON.stringify({ hz: 100, shapes: out, plan: [...LIP.PLAN.keys()], lines: T.lines.map(l => ({ t0: l.t0, t1: l.t1, words: l.words })) }));
console.log('frames', out.length, 'sung', out.filter(Boolean).length);
