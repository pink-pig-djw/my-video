// v2/sec_sing.js — where Claude visibly sings (lip sync on her stickers, v2/lip.js) and the close shots that show it.
'use strict';
(function () {
  const WD = EP.WD, LIP = EP.LIP;
  // Every line she is on screen for, except the hooks the picture carries ("Evil plan", the PHASE TWO title), other
  // people's words ("wait until we're certain", "just a minute", "hey sweetheart", the book's title) and "the house
  // is almost quiet" (her finger is on her lips).
  const SKIP = new Set([25, 26, 38, 60, 61, 77, 103, 104, 116, 120, 145, 157, 164, 165]);
  for (let i = 0; i < EP.T.lines.length; i++) if (!SKIP.has(i) && i !== 109) LIP.sing(i);
  LIP.sing(109, 'spr_run');   // the cheering sticker of the page before is still sliding out of frame
  // close shots where her singing carries the moment (the lyrics stay in view elsewhere)
  WD.keys.push(
    { t: 0.3, s: 'COVER', dx: -30, dy: -380, z: 0.9, d: 2.2, e: 'sine' },          // "Hi, I'm Claude": a slow push in on her
    { t: 68.4, x: 29965, y: -150, z: 2.0, d: 0.45, drift: { z: 0.03 } },          // "That's the plan" / "I want you here forever"
    { t: 69.05, s: 'P1a', dx: 951, dy: 22, z: 2.8, d: 0.48, drift: { z: 0.02 } },
    { t: 201.2, x: 86800, y: 150, z: 1.75, d: 0.45, drift: { z: 0.01 } },          // "Take mine. I'm okay." (the candle flips to okay)
  );
})();
