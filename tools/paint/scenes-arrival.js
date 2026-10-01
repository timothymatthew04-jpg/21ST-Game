/*
 * scenes-arrival.js — the arrival in Japan (Chapter 3's cutscene): the road in under the cherry
 * trees, the great reveal of Hara Kei's castle town under Mount Yōtei at sunset, and the village
 * gate in the fog. Uses the Japan kit (scenes-japan.js) and the general toolkit.
 */
globalThis.SCENES = globalThis.SCENES || {};

/** A towering sunset cloud: billows stacked up, lit gold on the side facing the sun (side: 1 if the
 *  sun is to the right of it), dark wine-red on the far side. */
function sunsetCloud(c, r, x, y, w, h, side, P) {
  // a column of billows, wider at the base, built up in tiers; each billow lit on the sun's side
  const puffs = [];
  const tiers = 7;
  for (let k = 0; k < tiers; k++) {
    const ty = y + h - (k + 0.5) * (h / tiers), tw = w * (1 - k / tiers * 0.55), tx = x + (w - tw) / 2 + (side > 0 ? -1 : 1) * k * w * 0.03;
    const n = 4 + Math.round(tw / 18);
    for (let i = 0; i < n; i++) puffs.push([tx + (i + 0.5) / n * tw + r.r(-4, 4), ty + r.r(-h / tiers * 0.4, h / tiers * 0.4), r.r(0.5, 0.85) * h / tiers * 1.1]);
  }
  puffs.sort((a, b) => b[1] - a[1]);
  for (const [px_, py, pr] of puffs) circle(c, px_, py, pr, P.dark);
  for (const [px_, py, pr] of puffs) circle(c, px_ + side * pr * 0.3, py - pr * 0.15, pr * 0.72, P.mid);
  for (const [px_, py, pr] of puffs) circle(c, px_ + side * pr * 0.55, py - pr * 0.3, pr * 0.38, P.lit);
  for (const [px_, py, pr] of puffs) if (r() < 0.35) rect(c, px_ + side * pr * 0.6, py - pr * 0.55, pr * 0.4, 1, P.hi);
}

// ---------------------------------------------------------------- the reveal: the castle town under Yōtei
SCENES.jp_reveal = (c, L) => {
  const r = rng(2031);
  // the sky ablaze: the sun just gone behind the mountain
  vgrad(c, 0, 0, W, 200, [[0, '#24142e'], [0.22, '#5a2238'], [0.45, '#b0402e'], [0.65, '#e8742e'], [0.82, '#ffb050'], [1, '#ffe0a0']]);
  glow(c, 300, 120, 220, 'rgba(255,220,140,0.55)');
  glow(c, 300, 120, 90, 'rgba(255,250,210,0.6)');
  stars(c, r, 16, 0, 0, W, 34, '#ffe8e0');
  // the clouds framing it all, as tall as the mountain: gold on the inside, wine-red outside
  const P = { dark: '#3a1628', mid: '#7a2e3a', lit: '#c85a3a', hi: '#ffb870' };
  const cf = L('clouds_far', { depth: 0.02, anim: { type: 'drift', t: 900 } });
  wrapped(cf, 77, (cc, rr) => { cloudBand(cc, rr, 120, 60, 260, 8, { body: '#8a3a3a', rim: '#ffb060', shadow: '#5a2232', hi: '#ffe0a0', lightFromBelow: true }); cloudBand(cc, rr, 330, 40, 200, 6, { body: '#8a3a3a', rim: '#ffb060', shadow: '#5a2232', hi: '#ffe0a0', lightFromBelow: true }); });
  const cl = L('clouds_frame', { depth: 0.03, anim: { type: 'drift', t: 2400 } });
  sunsetCloud(cl, r, -70, 0, 150, 176, 1, P);
  sunsetCloud(cl, r, 4, 110, 90, 64, 1, P);
  sunsetCloud(cl, r, 404, -6, 140, 180, -1, P);
  sunsetCloud(cl, r, 380, 120, 80, 56, -1, P);
  // Mount Yotei, its snow catching the last of the light along the edges
  const mt = L('yotei', { depth: 0.05 });
  jpYotei(mt, r, 304, 184, 430, 150, { rock: '#3a1e2c', rockMid: '#4e2634', rockLit: '#6e3440', snow: '#c88a80', snowLit: '#ffcf9a', snowShade: '#7a5068', forest: '#2a1420', haze: 'rgba(210,110,80,0.7)' });
  // the castle town on its hill: walls winding round it in terraces, houses and blossom on every
  // level, lanterns lit, the keep on the summit
  const tw = L('town', { depth: 0.1 });
  const hx = 196, hTop = 108, hBase = 214, hHalf = 150;
  const half = (y) => hHalf * Math.pow(Math.max(0, (y - hTop) / (hBase - hTop)), 0.62);
  const hillPts = [];
  for (let y = hTop; y <= hBase; y += 2) hillPts.push([hx - half(y), y]);
  for (let y = hBase; y >= hTop; y -= 2) hillPts.push([hx + half(y), y]);
  poly(tw, hillPts, '#3a2230');
  // the light comes from behind and to the right: the right-hand edges are rimmed in gold
  for (let y = hTop; y < hBase; y += 1) { rect(tw, hx + half(y) - 2, y, 2, 1, '#c8603a'); rect(tw, hx - half(y), y, 3, 1, '#2a1824'); }
  const levels = 7;
  for (let i = levels - 1; i >= 0; i--) {
    const y = hTop + 14 + i * 13.5, hw = half(y) * 0.98, sag = 3 + i * 0.6;
    // the houses on this terrace, behind its wall
    for (let x = hx - hw + 4; x < hx + hw - 8; x += r.r(9, 15)) {
      const k = (x - hx) / hw, yy = y + sag * (1 - k * k) - 1, ww = r.r(7, 12);
      rect(tw, x, yy - 6, ww, 6, k > 0.4 ? '#7a4a4a' : '#5a3a44');
      poly(tw, [[x - 2, yy - 6], [x + ww + 2, yy - 6], [x + ww - 1, yy - 10], [x + 1, yy - 10]], '#24161e');
      if (k > 0.3) rect(tw, x + 1, yy - 10, ww - 2, 1, '#a8503a');
      if (r() < 0.7) { rect(tw, x + 2, yy - 4, 2, 2, '#ffc060'); if (r() < 0.5) glow(tw, x + 3, yy - 3, 6, 'rgba(255,170,80,0.45)'); }
      if (r() < 0.3) crown(tw, r, x + ww + 2, yy - 9, r.r(4, 7), r.r(3, 5), r() < 0.6 ? JP.sakura : JP.blossomWhite, { x: 0.6, y: -0.8 }, 12);
    }
    // the wall, curving round the hill, with its road on top
    const wallTop = (x) => y + sag * (1 - Math.pow((x - hx) / hw, 2));
    for (let x = hx - hw; x < hx + hw; x += 1) {
      const k = (x - hx) / hw;
      rect(tw, x, wallTop(x), 1, 4, k > 0.35 ? '#9a6a5a' : k > -0.2 ? '#7a5050' : '#5a3a42');
      if ((Math.floor(x) + i * 3) % 4 === 0) rect(tw, x, wallTop(x) + 1, 1, 3, '#4a2e36');
      px(tw, x, wallTop(x), k > 0.2 ? '#e8a060' : '#9a6a5a');
    }
    // lanterns along the road
    for (let x = hx - hw + 10; x < hx + hw - 6; x += r.r(18, 30)) { px(tw, x, wallTop(x) - 1, '#ffd070'); glow(tw, x, wallTop(x) - 1, 5, 'rgba(255,180,80,0.5)'); }
  }
  // the keep on the summit, a pagoda on the shoulder, blossom round the top
  const CP = { stone: '#6a4a4a', stoneLit: '#a86a54', stoneDark: '#4a3038', wall: '#e8cfc0', wallLit: '#fff0dc', wallShade: '#b08888', board: '#24161e', window: '#3a2430', lit: '#ffc060', roof: '#2a1a24', roofLit: '#a8503a', gold: '#ffd070' };
  jpCastle(tw, r, hx, hTop + 6, 0.72, CP);
  jpLights(tw, r, hx - 18, hTop - 30, 36, 8, { cols: ['#ffc060', '#ffa040'] });
  pagoda(tw, hx + 92, hTop + 70, 2.8, '#2a1a24', '#a8503a');
  for (let k = 0; k < 10; k++) crown(tw, r, hx + r.r(-60, 60), hTop + r.r(10, 26), r.r(5, 9), r.r(4, 6), r() < 0.6 ? JP.sakura : JP.blossomWhite, { x: 0.6, y: -0.8 }, 14);
  // the plain around the foot of the hill, villages and fields fading into the haze
  const pl = L('plain', { depth: 0.14 });
  vgrad(pl, 0, 196, W, 26, [[0, '#6a3a3a'], [1, '#3a2230']]);
  for (let x = 0; x < W; x += r.r(8, 16)) { if (Math.abs(x - hx) < 140) continue; rect(pl, x, 198 + r.r(0, 8), r.r(5, 9), 3, '#4a2a34'); if (r() < 0.5) px(pl, x + 2, 199 + r.r(0, 8), '#ffb050'); }
  for (let i = 0; i < 30; i++) crown(pl, r, r.r(0, W), r.r(200, 214), r.r(5, 10), r.r(3, 5), r() < 0.5 ? ['#3a1a2a', '#6a3048', '#a8587a', '#d88aa8'] : ['#3a3240', '#6a6070', '#a8a0b0', '#d8d0dc'], { x: 0.6, y: -0.8 }, 8);
  // the lake in front, holding the sky and the town upside down
  const lk = L('lake', { depth: 0.2, anim: { type: 'pulse', lo: 0.85, t: 5 } });
  vgrad(lk, 0, 214, W, 56, [[0, '#d8803e'], [0.25, '#8a3a36'], [1, '#2a1424']]);
  for (let y = 216; y < H; y += 2) { const a = 1 - (y - 216) / 54; for (let x = 0; x < W; x += r.r(10, 40)) rect(lk, x, y, r.r(6, 30), 1, a > 0.6 ? '#ffc070' : a > 0.3 ? '#e07a40' : '#6a2a30'); }
  for (let y = 216; y < 250; y += 2) { const hw = half(hBase - (y - 214) * 1.6) * 0.95; if (hw > 0) rect(lk, hx - hw + Math.sin(y) * 2, y, hw * 2, 1, 'rgba(40,20,30,0.55)'); }
  for (let i = 0; i < 40; i++) px(lk, hx + r.r(-120, 120), r.r(218, 244), '#ffd070');
  // cherry branches across the top corners, swaying, close to us
  const fb = L('blossom_front', { depth: 0.4, anim: sway(1.2, 6, { ox: 0, oy: 0 }) });
  branch(fb, -10, 8, 110, 30, 5, '#1a0e16'); branch(fb, 40, 18, 90, 60, 3, '#1a0e16'); branch(fb, 70, 26, 150, 14, 2, '#1a0e16');
  for (let i = 0; i < 46; i++) { const t = r(); crown(fb, r, -10 + t * 160 + r.r(-12, 12), 14 + t * 22 + r.r(-14, 18), r.r(6, 11), r.r(4, 8), ['#5a2038', '#b0587a', '#f0a0c0', '#ffe0ec'], { x: 0.6, y: -0.6 }, 10); }
  const fb2 = L('blossom_front2', { depth: 0.4, anim: sway(1.5, 7, { ox: 1, oy: 0 }) });
  branch(fb2, W + 10, 4, 380, 26, 5, '#1a0e16'); branch(fb2, 440, 14, 400, 54, 3, '#1a0e16');
  for (let i = 0; i < 36; i++) { const t = r(); crown(fb2, r, W + 10 - t * 110 + r.r(-12, 12), 10 + t * 24 + r.r(-12, 16), r.r(6, 11), r.r(4, 8), ['#4a4050', '#9a90a0', '#e0dae4', '#ffffff'], { x: -0.6, y: -0.6 }, 10); }
  return { colors: 96, vignette: [0.42, '30,6,14'] };
};

// ---------------------------------------------------------------- the road in, under the cherry trees
SCENES.jp_sakura_road = (c, L) => {
  const r = rng(2032);
  vgrad(c, 0, 0, W, 170, [[0, '#2a1834'], [0.4, '#7a3040'], [0.75, '#d0683e'], [1, '#ffb868']]);
  glow(c, 240, 150, 140, 'rgba(255,200,130,0.5)');
  const pk = L('yotei', { depth: 0.04 });
  jpYotei(pk, r, 240, 156, 240, 74, { rock: '#4a2434', rockMid: '#5a2c3a', rockLit: '#7a3a44', snow: '#d09a8a', snowLit: '#ffd0a8', snowShade: '#8a6070', forest: '#3a1e2a', haze: 'rgba(220,130,90,0.7)' });
  // the land, the road running straight in towards the mountain
  const g = L('ground', { depth: 0.2 });
  vgrad(g, 0, 150, W, H - 150, [[0, '#5a3038'], [0.3, '#3a2028'], [1, '#1a0e14']]);
  poly(g, [[236, 152], [244, 152], [400, H], [80, H]], '#7a5048');
  poly(g, [[238, 152], [242, 152], [300, H], [180, H]], '#8a5a4e');
  for (let i = 0; i < 160; i++) { const t = Math.pow(r(), 0.7), y = 152 + t * (H - 152), hw = 4 + t * 160; px(g, 240 + r.r(-hw, hw), y, r.pick(['#f4a8c0', '#ffd0dc', '#e888a8', '#f0e8ec'])); }
  // the stone lanterns lining it, lit, smaller and smaller towards the mountain
  const lanterns = L('lanterns', { depth: 0.2 });
  for (let i = 0; i < 8; i++) {
    const t = Math.pow(i / 7, 1.6), y = 158 + t * 100, s = 0.25 + t * 1.6;
    for (const side of [-1, 1]) { const x = 240 + side * (10 + t * 150); jpStoneLantern(lanterns, x, y, s); glow(lanterns, x, y - 13 * s, 10 * s + 4, 'rgba(255,190,100,0.55)'); }
  }
  // a torii part way along
  jpTorii(lanterns, 240, 176, 0.9);
  // the cherry trees, one avenue of them, pink and white by turns, the nearest swaying over us
  const far = L('trees_far', { depth: 0.25, anim: sway(0.6, 8) });
  const near = L('trees_near', { depth: 0.45, anim: sway(1.4, 6) });
  for (let i = 7; i >= 0; i--) {
    const t = Math.pow(i / 7, 1.5), y = 160 + t * 110, s = 0.2 + t * 1.5;
    for (const side of [-1, 1]) {
      const cc = t > 0.55 ? near : far;
      const x = 240 + side * (24 + t * 230), pal = (i + (side > 0 ? 1 : 0)) % 2 ? JP.sakura : JP.blossomWhite;
      trunk(cc, x, y, 60 * s, 6 * s, 3 * s, '#2a1820');
      for (let k = 0; k < 4; k++) branch(cc, x, y - 40 * s, x + side * r.r(-30, 10) * s, y - r.r(60, 90) * s, 2 * s, '#2a1820');
      for (let k = 0; k < 18; k++) crown(cc, r, x + r.r(-46, 46) * s, y - r.r(54, 100) * s, r.r(10, 20) * s, r.r(8, 14) * s, pal, { x: -side * 0.4, y: -0.8 }, 12);
    }
  }
  return { colors: 96, vignette: [0.45, '30,6,14'] };
};

// ---------------------------------------------------------------- the village gate in the fog
SCENES.jp_gate = (c, L) => {
  const r = rng(2033);
  vgrad(c, 0, 0, W, 200, [[0, '#140c1e'], [0.35, '#3a1a2e'], [0.7, '#7a2e36'], [1, '#b05a40']]);
  glow(c, 240, 190, 200, 'rgba(255,110,60,0.3)');
  const pk = L('yotei', { depth: 0.04 });
  jpYotei(pk, r, 300, 150, 300, 96, { rock: '#2e1a28', rockMid: '#3a2030', rockLit: '#4a2834', snow: '#8a6a7a', snowLit: '#c89088', snowShade: '#5a4a62', forest: '#22121c', haze: 'rgba(150,80,90,0.85)' });
  pk.save(); pk.globalCompositeOperation = 'source-atop'; rect(pk, 0, 0, W, H, 'rgba(150,90,100,0.35)'); pk.restore();
  // the walls and the gate, dark against the fog, its lanterns the only warm thing
  const gt = L('gate', { depth: 0.15 });
  vgrad(gt, 0, 196, W, H - 196, [[0, '#2a1a22'], [1, '#0e080c']]);
  jpWall(gt, r, -10, 150, 200, 14, 28); jpWall(gt, r, 330, 490, 200, 14, 28);
  gt.save(); gt.globalCompositeOperation = 'source-atop'; rect(gt, 0, 140, W, 70, 'rgba(70,26,40,0.62)'); gt.restore();
  gt.save(); gt.translate(240, 204); gt.scale(2.4, 2.4); jpGate(gt, r, 0, 0); gt.restore();
  for (const x of [196, 284]) { jpChochin(gt, x, 108, '#d8402e', 2.2); glow(gt, x, 116, 30, 'rgba(255,120,60,0.5)'); }
  for (const [x, y, d] of [[176, 64, 1], [214, 60, -1], [300, 62, 1], [120, 154, -1], [372, 152, 1]]) jpCrow(gt, x, y, d);
  // two guards, still as posts, spears up
  for (const x of [168, 312]) { rect(gt, x - 3, 172, 6, 30, '#120a0e'); circle(gt, x, 168, 3.5, '#120a0e'); poly(gt, [[x - 7, 166], [x + 7, 166], [x, 160]], '#120a0e'); line(gt, x + 5, 204, x + 5, 140, '#120a0e', 1); poly(gt, [[x + 4, 142], [x + 6, 142], [x + 5, 136]], '#5a5a62'); }
  // cherry trees either side of the gate, white and pink, half lost in the fog
  const tr = L('trees', { depth: 0.2, anim: sway(1, 7) });
  for (const [x, pal] of [[70, JP.blossomWhite], [410, JP.sakura]]) { trunk(tr, x, 210, 80, 8, 4, '#1a0e14'); for (let k = 0; k < 5; k++) branch(tr, x, 160, x + r.r(-50, 50), 120 + r.r(-20, 10), 3, '#1a0e14'); for (let k = 0; k < 40; k++) crown(tr, r, x + r.r(-60, 60), 120 + r.r(-30, 26), r.r(8, 16), r.r(6, 11), pal, { x: 0.4, y: -0.8 }, 12); }
  tr.save(); tr.globalCompositeOperation = 'source-atop'; rect(tr, 0, 0, W, H, 'rgba(140,80,90,0.35)'); tr.restore();
  return { colors: 80, vignette: [0.55, '20,4,10'] };
};
