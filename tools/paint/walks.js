/*
 * The walking areas: wide scenes, several screens long, painted in layers that the walk
 * engine (js/walk.js) scrolls at different speeds. Everyone walks along the bank at GY; below
 * WY is water, where the engine draws the reflection of everything above it.
 *
 * Layer depths are how fast each layer scrolls: 0 stays put (the sky), 1 moves with the
 * ground, more than 1 passes in front of the walkers. A layer that scrolls at depth f only ever
 * shows its first 480 + f × (width − 480) pixels, so that is all that is painted of it.
 */
globalThis.WALKS = {};
const GY = 204; // where feet touch the ground
const WY = 211; // where the water begins
const S = (f) => Math.min(W, Math.round(480 + f * (W - 480)) + 40);

/** The strip of bank everyone walks on, and its edge down to the water. */
function bank(g, r, x0, x1, o) {
  vgrad(g, x0, GY - 10, x1 - x0, 12, [[0, o.grass0], [1, o.grass1]]);
  texture(g, r, x0, GY - 10, x1 - x0, 12, 0.08, 2);
  rect(g, x0, GY + 2, x1 - x0, WY - GY - 2, o.earth);
  rect(g, x0, WY - 2, x1 - x0, 2, o.dark);
  for (let x = x0; x < x1; x += r.r(2, 5)) rect(g, x, GY - 12 - r.i(0, 3), 1, r.i(2, 4), r.pick([o.grass0, o.grass1, o.tip || o.grass0]));
  for (let x = x0; x < x1; x += r.r(18, 50)) ellipse(g, x, WY - 2, r.r(3, 7), r.r(1.5, 3), r.pick([o.stone || '#6a6a70', o.dark]));
  for (let x = x0; x < x1; x += r.r(6, 14)) rect(g, x, GY + r.i(3, 5), r.i(2, 4), 1, o.dark);
}

/** Reeds and tall grass along the bottom edge, in front of everything. */
function reeds(f, r, cols, n = 90) {
  for (let i = 0; i < n; i++) {
    const x = r() * W, h = r.r(10, 34), lean = r.r(-4, 4);
    line(f, x, H, x + lean, H - h, r.pick(cols), 1);
    if (r() < 0.3) ellipse(f, x + lean, H - h, 1.5, 4, cols[0]);
  }
}

// ---------------------------------------------------------------- the army camp, at dawn
WALKS.camp = (c, L) => {
  const r = rng(401);
  vgrad(c, 0, 0, 480, WY, [[0, '#3c4a7a'], [0.35, '#8a7ea0'], [0.66, '#e8a47a'], [0.86, '#ffd29a'], [1, '#fff0c0']]);
  sun(c, 150, 164, 13, '#fff4d0', 'rgba(255,190,120,0.6)');
  const cl = L('clouds', { depth: 0.05, anim: { type: 'drift', t: 300 } });
  for (let x = 0; x < S(0.1); x += 260) cloudBand(cl, r, x + r.r(0, 80), r.r(28, 90), r.r(160, 260), r.r(5, 9), { body: '#7a6488', rim: '#ffc090', shadow: '#5e4e74', hi: '#ffe6c0', lightFromBelow: true });
  const far = L('far', { depth: 0.15 });
  ridge(far, r, 176, 34, '#7a6a88', { x1: S(0.15) });
  ridge(far, r, 182, 20, '#6e6082', { x1: S(0.15) });
  treeLine(far, r, 184, 0, S(0.15), 5, ['#5a4e70', '#665a7a']);
  const mid = L('mid', { depth: 0.45 });
  vgrad(mid, 0, 182, S(0.45), 20, [[0, '#a09a60'], [1, '#7a7a44']]);
  for (let x = 20; x < S(0.45); x += r.r(40, 90)) poplar(mid, r, x, 190, r.r(26, 40), { trunk: '#4a3a3a', leaves: ['#4e5a3a', '#6a7644', '#9aa05a'] }, -1);
  for (const x of [260, 700]) frHouse(mid, r, x, 192, 30, 16, { wall: '#d8c0a0', wallDark: '#b09878', roof: '#a85a3c', roofDark: '#7a3e28', roofH: 8, windows: [[8, 5, 4, 5, { lit: true }]] });
  const g = L('ground', { depth: 1 });
  vgrad(g, 0, 188, W, 16, [[0, '#8a8a4a'], [1, '#6a7038']]);
  bank(g, r, 0, W, { grass0: '#7a8a3a', grass1: '#5a6a2a', tip: '#a0a85a', earth: '#6a5238', dark: '#3a2c20', stone: '#8a8478' });
  const tent = (x, s) => {
    const yb = GY - 4;
    ellipse(g, x, yb + 1, s * 1.2, s * 0.14, 'rgba(40,30,30,0.35)');
    poly(g, [[x - s, yb], [x, yb - s * 0.9], [x + s, yb]], '#e6dcc4');
    poly(g, [[x, yb - s * 0.9], [x + s, yb], [x + s * 0.2, yb]], '#b8aa90');
    poly(g, [[x - s * 0.18, yb], [x, yb - s * 0.45], [x + s * 0.18, yb]], '#4a3a30');
    line(g, x, yb - s * 0.9, x, yb - s * 1.05, '#5a4a3a', 1);
  };
  for (let x = 50; x < W - 200; x += r.r(110, 170)) tent(x, r.r(16, 22));
  const rifles = (x) => { line(g, x - 8, GY - 3, x, GY - 26, '#3a2c24', 2); line(g, x + 8, GY - 3, x, GY - 26, '#3a2c24', 2); line(g, x, GY - 3, x, GY - 26, '#4a382c', 2); rect(g, x - 1, GY - 28, 3, 3, '#8a8a90'); };
  for (const x of [230, 610, 980]) rifles(x);
  // the fire, the drum, crates and a supply wagon
  ellipse(g, 520, GY - 2, 18, 4, '#3a2a22');
  for (let k = 0; k < 6; k++) line(g, 506 + k * 6, GY - 1, 514 + k * 4, GY - 10, '#5a3a24', 2);
  glow(g, 520, GY - 10, 50, 'rgba(255,150,70,0.4)');
  ellipse(g, 420, GY - 3, 11, 4, '#8a2e2e'); rect(g, 409, GY - 15, 22, 12, '#b83a3a'); ellipse(g, 420, GY - 15, 11, 4, '#e8dcc8');
  for (const [x, w, hh] of [[850, 22, 14], [870, 16, 20]]) { rect(g, x, GY - 3 - hh, w, hh, '#7a5a3a'); rect(g, x, GY - 3 - hh, w, 2, '#b08a5a'); }
  rect(g, 1080, GY - 30, 60, 18, '#6a4a2a'); poly(g, [[1076, GY - 30], [1144, GY - 30], [1134, GY - 52], [1086, GY - 52]], '#e8dcc0');
  for (const x of [1090, 1128]) { circle(g, x, GY - 8, 8, '#3a2a1a'); circle(g, x, GY - 8, 3, '#6a4a2a'); }
  // flags on their poles
  for (const x of [140, 760]) { rect(g, x, GY - 60, 2, 58, '#4a3a2a'); rect(g, x + 2, GY - 60, 8, 11, '#2e4a9a'); rect(g, x + 10, GY - 60, 8, 11, '#f0ece4'); rect(g, x + 18, GY - 60, 8, 11, '#c83a3a'); }
  // the edge of camp: a gate in a rail fence, and the road away to the north
  for (let x = 1230; x < W; x += 16) { rect(g, x, GY - 16, 2, 14, '#6a4a2a'); }
  rect(g, 1230, GY - 14, 60, 2, '#8a6a3a'); rect(g, 1330, GY - 14, W - 1330, 2, '#8a6a3a'); rect(g, 1230, GY - 8, 60, 2, '#8a6a3a'); rect(g, 1330, GY - 8, W - 1330, 2, '#8a6a3a');
  rect(g, 1360, GY - 34, 3, 32, '#5a3a24'); poly(g, [[1348, GY - 34], [1392, GY - 34], [1398, GY - 30], [1392, GY - 26], [1348, GY - 26]], '#c8a878');
  const fr = L('front', { depth: 1.3, anim: sway(3, 3.4) });
  reeds(fr, r, ['#3a4a22', '#566a2e', '#78883e']);
  return { colors: 64, vignette: [0.3, '30,20,30'] };
};

// ---------------------------------------------------------------- across the steppe, at sunset
WALKS.steppe = (c, L) => {
  const r = rng(411);
  vgrad(c, 0, 0, 480, WY, [[0, '#2a2a5e'], [0.4, '#7a4e7a'], [0.7, '#e2866a'], [0.9, '#ffc27a'], [1, '#ffe2a8']]);
  sun(c, 330, 168, 16, '#fff0c8', 'rgba(255,160,90,0.6)');
  stars(c, r, 30, 0, 0, 480, 60);
  const cl = L('clouds', { depth: 0.05, anim: { type: 'drift', t: 260 } });
  for (let x = 0; x < S(0.1); x += 220) cloudBand(cl, r, x + r.r(0, 60), r.r(26, 100), r.r(140, 240), r.r(5, 9), { body: '#6a4a72', rim: '#ffa878', shadow: '#503a60', hi: '#ffd8a8', lightFromBelow: true });
  const far = L('far', { depth: 0.12 });
  ridge(far, r, 172, 44, '#6a4a6e', { x1: S(0.12), peak: [320, 60, 18] });
  ridge(far, r, 182, 22, '#5e4262', { x1: S(0.12) });
  const mid = L('mid', { depth: 0.4 });
  vgrad(mid, 0, 180, S(0.4), 24, [[0, '#b08a5a'], [1, '#806838']]);
  for (let x = 0; x < S(0.4); x += r.r(24, 60)) if (r() < 0.6) birch(mid, r, x, 190, r.r(20, 34), ['#3a4a2a', '#5a6a34', '#8a9a4a']);
  // a village of wooden houses and a church with an onion dome, halfway across Russia
  for (const [x, w] of [[600, 26], [640, 22], [700, 30]]) { rect(mid, x, 176, w, 14, '#6a4a30'); poly(mid, [[x - 3, 176], [x + w + 3, 176], [x + w / 2, 164]], '#4a3a2a'); rect(mid, x + w / 2 - 2, 180, 4, 5, '#ffcf72'); glow(mid, x + w / 2, 182, 10, 'rgba(255,190,90,0.5)'); }
  rect(mid, 670, 150, 14, 40, '#e8e0d0'); ellipse(mid, 677, 148, 9, 9, '#3a8a6a'); poly(mid, [[677, 132], [673, 142], [681, 142]], '#3a8a6a'); rect(mid, 676, 126, 2, 7, '#e8c040'); rect(mid, 674, 128, 6, 1, '#e8c040');
  const g = L('ground', { depth: 1 });
  vgrad(g, 0, 190, W, 14, [[0, '#a88a50'], [1, '#806a3a']]);
  bank(g, r, 0, W, { grass0: '#a0904a', grass1: '#7a6a34', tip: '#d0b870', earth: '#6a4e34', dark: '#3a2a1e', stone: '#8a7a6a' });
  // milestones, a caravan's cart, a shrine at a crossroads, a raft on the river, then the harbour
  for (let x = 160; x < W - 300; x += 360) { rect(g, x, GY - 14, 5, 12, '#a8a090'); rect(g, x, GY - 14, 5, 2, '#d8d0c0'); }
  rect(g, 820, GY - 22, 44, 12, '#6a4a2a'); for (const x of [828, 856]) { circle(g, x, GY - 8, 6, '#3a2a1a'); circle(g, x, GY - 8, 2, '#8a6a3a'); }
  poly(g, [[818, GY - 22], [866, GY - 22], [858, GY - 38], [826, GY - 38]], '#c8b890');
  rect(g, 1240, GY - 26, 3, 24, '#5a3a24'); rect(g, 1234, GY - 26, 16, 10, '#7a5a3a'); rect(g, 1238, GY - 22, 8, 5, '#e8c070');
  // Lake Baikal: the water opens up wide
  for (let x = 1500; x < 1900; x += 3) rect(g, x, GY - 2 - Math.max(0, Math.sin((x - 1500) / 400 * Math.PI) * 6), 3, 4, '#c8b888');
  // the harbour at the edge of the continent: a pier and the smuggler's boat
  rect(g, 2180, GY - 4, W - 2180, 4, '#5a3e2a');
  for (let x = 2190; x < W; x += 30) rect(g, x, GY - 2, 4, 18, '#3a2a1e');
  poly(g, [[2290, GY + 4], [2380, GY + 2], [2372, GY + 14], [2300, GY + 14]], '#2a1e1a');
  rect(g, 2330, GY - 50, 2, 52, '#2a1e1a'); poly(g, [[2332, GY - 48], [2362, GY - 40], [2332, GY - 8]], '#d8ccb0');
  for (const x of [2220, 2400]) { rect(g, x, GY - 30, 2, 28, '#2a1e1a'); ellipse(g, x + 1, GY - 30, 4, 5, '#ffb050'); glow(g, x + 1, GY - 30, 16, 'rgba(255,160,70,0.5)'); }
  const fr = L('front', { depth: 1.3, anim: sway(4, 3) });
  reeds(fr, r, ['#6a5a2a', '#8a7a3a', '#b0a050'], 140);
  return { colors: 64, vignette: [0.35, '30,10,30'] };
};

// ---------------------------------------------------------------- Hara Kei's village, at night
WALKS.village = (c, L) => {
  const r = rng(421);
  vgrad(c, 0, 0, 480, WY, [[0, '#070b24'], [0.55, '#18265a'], [1, '#3a4a80']]);
  stars(c, r, 140, 0, 0, 480, 120);
  moon(c, 110, 50, 12, { seed: 7 });
  const cl = L('clouds', { depth: 0.04, anim: { type: 'drift', t: 320 } });
  for (let x = 0; x < S(0.1); x += 240) cloudBand(cl, r, x + r.r(0, 80), r.r(40, 110), r.r(140, 220), r.r(4, 7), { body: '#1c2654', rim: '#6f8ac2', shadow: '#141c44', hi: '#b9cdf5' });
  const far = L('far', { depth: 0.14 });
  ridge(far, r, 170, 50, '#1c2a5a', { x1: S(0.14) });
  ridge(far, r, 182, 26, '#16224a', { x1: S(0.14) });
  treeLine(far, r, 186, 0, S(0.14), 6, ['#101a3a', '#16224a']);
  const mid = L('mid', { depth: 0.45 });
  for (let x = 0; x < S(0.45); x += r.r(28, 60)) pine(mid, r, x, 196, r.r(34, 54), { trunk: '#1a1624', leaves: ['#101a2e', '#18263e', '#2a3e5e'] }, r() < 0.5 ? 1 : -1);
  const g = L('ground', { depth: 1 });
  vgrad(g, 0, 190, W, 14, [[0, '#2a3440'], [1, '#1c2430']]);
  bank(g, r, 0, W, { grass0: '#2a3a3a', grass1: '#1e2a2e', tip: '#3a5050', earth: '#2a2220', dark: '#14100e', stone: '#4a4e5a' });
  // a torii at the entrance to the village
  const torii = (x) => { rect(g, x - 20, GY - 44, 4, 42, '#b83a2a'); rect(g, x + 16, GY - 44, 4, 42, '#b83a2a'); rect(g, x - 28, GY - 48, 56, 4, '#b83a2a'); rect(g, x - 30, GY - 52, 60, 3, '#2a1a1a'); rect(g, x - 22, GY - 38, 44, 3, '#b83a2a'); };
  torii(120);
  // houses with lit windows, stone lanterns between them, and Hara Kei's house at the end
  for (const [x, w, hh] of [[260, 50, 22], [380, 40, 20], [540, 56, 24], [700, 44, 20], [860, 50, 22]]) jpHouse(g, r, x, GY - 2, w, hh, { windows: [[w * 0.3, hh * 0.35, w * 0.4, hh * 0.35, true]], roofH: hh * 0.8 });
  const lantern = (x) => { rect(g, x - 2, GY - 12, 4, 10, '#6a6a70'); rect(g, x - 5, GY - 18, 10, 6, '#7a7a80'); rect(g, x - 3, GY - 17, 6, 4, '#ffcf72'); poly(g, [[x - 7, GY - 18], [x + 7, GY - 18], [x, GY - 24]], '#5a5a60'); glow(g, x, GY - 15, 18, 'rgba(255,190,90,0.55)'); };
  for (const x of [200, 340, 480, 640, 800, 960, 1060]) lantern(x);
  jpHouse(g, r, 1150, GY - 2, 200, 44, { windows: [[30, 14, 40, 16, true], [90, 14, 40, 16, true], [150, 14, 30, 16, true]], roofH: 34, over: 30 });
  rect(g, 1236, GY - 26, 28, 24, '#2a1e1a'); glow(g, 1250, GY - 14, 40, 'rgba(255,200,110,0.45)');
  for (const x of [1180, 1320]) { rect(g, x, GY - 40, 3, 38, '#3a2a22'); ellipse(g, x + 1, GY - 40, 5, 7, '#d8402a'); glow(g, x + 1, GY - 40, 16, 'rgba(255,120,70,0.55)'); }
  const fr = L('front', { depth: 1.3, anim: sway(3, 3.8) });
  reeds(fr, r, ['#141e28', '#1e2c36', '#2a3a44'], 110);
  return { colors: 64, vignette: [0.45, '0,4,20'] };
};

// ---------------------------------------------------------------- the aviary behind Hara Kei's house, by day
WALKS.aviary = (c, L) => {
  const r = rng(431);
  vgrad(c, 0, 0, 480, WY, [[0, '#6a8ac8'], [0.6, '#b8c8e0'], [1, '#f0e0c8']]);
  sun(c, 380, 40, 10, '#fffbe6', 'rgba(255,240,200,0.5)');
  const cl = L('clouds', { depth: 0.05, anim: { type: 'drift', t: 200 } });
  for (let x = 0; x < S(0.1); x += 200) cumulus(cl, r, x + r.r(0, 60), r.r(20, 70), r.r(80, 140), r.r(14, 22), { dark: '#a4acc8', mid: '#dcdcea', lit: '#fff6e6', lx: -1 });
  const far = L('far', { depth: 0.15 });
  ridge(far, r, 168, 40, '#8a9ab8', { x1: S(0.15) });
  treeLine(far, r, 182, 0, S(0.15), 6, ['#6a7e5a', '#7a8e64']);
  const mid = L('mid', { depth: 0.45 });
  for (let x = 10; x < S(0.45); x += r.r(40, 70)) tree(mid, r, x, 196, r.r(34, 50), { trunk: '#4a3230', trunkDark: '#3a2628', leaves: ['#d88aa8', '#f0b0c8', '#ffd8e4'] });
  const g = L('ground', { depth: 1 });
  vgrad(g, 0, 190, W, 14, [[0, '#8aa05a'], [1, '#6a8040']]);
  bank(g, r, 0, W, { grass0: '#7a9a4a', grass1: '#5a7a34', tip: '#a8c060', earth: '#6a5238', dark: '#3a2c20', stone: '#9a9890' });
  // the great cage: a frame of dark wood, walls of paper lattice, taller than a house
  const ax0 = 200, ax1 = 640, top = GY - 110;
  rect(g, ax0, top, ax1 - ax0, GY - 2 - top, 'rgba(240,232,210,0.35)');
  for (let x = ax0; x <= ax1; x += 10) rect(g, x, top, 1, GY - 2 - top, '#5a4632');
  for (let y = top; y <= GY - 2; y += 10) rect(g, ax0, y, ax1 - ax0, 1, '#5a4632');
  for (const x of [ax0, ax0 + 110, ax0 + 220, ax0 + 330, ax1]) rect(g, x - 2, top - 6, 5, GY - top + 4, '#3a2a1e');
  poly(g, [[ax0 - 14, top], [ax1 + 14, top], [(ax0 + ax1) / 2 + 60, top - 30], [(ax0 + ax1) / 2 - 60, top - 30]], '#39424f');
  for (let k = 0; k < 3; k++) line(g, ax0 - 10 + k * 3, top - 2 - k * 9, ax1 + 10 - k * 3, top - 2 - k * 9, '#5b6878', 1);
  // a koi pond with a little bridge, then the house, where her room is
  ellipse(g, 740, GY + 2, 50, 6, '#3a6a8a'); for (const x of [724, 752]) ellipse(g, x, GY + 2, 4, 1.5, '#ff8a3a');
  poly(g, [[700, GY - 2], [780, GY - 2], [770, GY - 10], [710, GY - 10]], '#b83a2a');
  jpHouse(g, r, 820, GY - 2, 130, 40, { windows: [[20, 12, 34, 16], [74, 12, 34, 16]], roofH: 30, over: 20 });
  rect(g, 870, GY - 28, 30, 26, '#e8dcc0'); for (let k = 0; k < 4; k++) rect(g, 870 + k * 8, GY - 28, 1, 26, '#6a4428');
  const fr = L('front', { depth: 1.3, anim: sway(3, 4) });
  reeds(fr, r, ['#3a5a2a', '#5a7a34', '#8aa050'], 80);
  for (let i = 0; i < 40; i++) ellipse(fr, r() * W, H - r.r(2, 30), 2, 1.4, r.pick(['#f0b0c8', '#ffd8e4']));
  return { colors: 64, vignette: [0.3, '30,20,20'] };
};

// ---------------------------------------------------------------- the burned village
WALKS.ruins = (c, L) => {
  const r = rng(441);
  vgrad(c, 0, 0, 480, WY, [[0, '#1c1214'], [0.4, '#3e1e1e'], [0.75, '#8a3a24'], [1, '#c86a3a']]);
  const cl = L('clouds', { depth: 0.05, anim: { type: 'drift', t: 160 } });
  for (let x = 0; x < S(0.1); x += 180) cloudBand(cl, r, x + r.r(0, 60), r.r(20, 110), r.r(160, 240), r.r(8, 14), { body: '#3a2424', rim: '#a8503a', shadow: '#2a1a1c', hi: '#d88a5a', lightFromBelow: true });
  const far = L('far', { depth: 0.14 });
  ridge(far, r, 172, 44, '#2a1a1e', { x1: S(0.14) });
  ridge(far, r, 184, 22, '#221416', { x1: S(0.14) });
  const mid = L('mid', { depth: 0.45 });
  for (let x = 0; x < S(0.45); x += r.r(40, 90)) bareTree(mid, r, x, 196, r.r(30, 50), '#1a1012', null);
  const g = L('ground', { depth: 1 });
  vgrad(g, 0, 190, W, 14, [[0, '#3a2a26'], [1, '#2a1e1c']]);
  bank(g, r, 0, W, { grass0: '#3a302a', grass1: '#2a221e', tip: '#5a4a3a', earth: '#241a18', dark: '#120c0a', stone: '#4a3e3a' });
  // burned houses: black beams standing against the glow, embers still red in the ash
  const burned = (x, w, hh) => {
    rect(g, x, GY - hh, w, hh, '#1c1414');
    for (let k = 0; k < w; k += r.r(6, 12)) rect(g, x + k, GY - hh - r.r(4, 20), 3, hh + r.r(4, 20), '#120c0c');
    line(g, x - 6, GY - hh + 4, x + w * 0.7, GY - hh - 16, '#140e0e', 3);
    for (let i = 0; i < 6; i++) { const ex = x + r() * w, ey = GY - r() * hh * 0.5; rect(g, ex, ey, 2, 1, r.pick(['#ff6a2a', '#ffa040'])); glow(g, ex, ey, 8, 'rgba(255,110,50,0.5)'); }
  };
  for (const [x, w, hh] of [[160, 60, 28], [340, 50, 24], [520, 70, 30], [980, 56, 26], [1140, 50, 22]]) burned(x, w, hh);
  // the empty aviary: its frame still standing, the paper all gone, the door hanging open
  const ax0 = 680, ax1 = 900, top = GY - 90;
  for (let x = ax0; x <= ax1; x += 14) rect(g, x, top + r.r(0, 20), 2, GY - top, '#140e0e');
  for (let y = top + 10; y <= GY - 2; y += 16) line(g, ax0, y, ax1, y + r.r(-4, 4), '#1a1212', 1);
  poly(g, [[ax0 + 60, GY - 2], [ax0 + 80, GY - 40], [ax0 + 96, GY - 36], [ax0 + 76, GY + 2]], '#1c1414');
  // the last wall standing, where a man could hide from the lanterns
  rect(g, 1300, GY - 34, 90, 32, '#2a201e'); rect(g, 1300, GY - 34, 90, 3, '#3a2e2a');
  for (let k = 0; k < 8; k++) rect(g, 1302 + k * 11, GY - 30 + (k % 2) * 8, 9, 5, '#221a18');
  const fr = L('front', { depth: 1.3, anim: sway(2, 4) });
  reeds(fr, r, ['#1a1210', '#2a1e1a', '#3a2a22'], 70);
  return { colors: 64, vignette: [0.5, '20,4,0'] };
};

// ---------------------------------------------------------------- the cemetery by the river, at dusk
WALKS.cemetery = (c, L) => {
  const r = rng(451);
  vgrad(c, 0, 0, 480, WY, [[0, '#2b2654'], [0.38, '#794f7a'], [0.68, '#d9806e'], [0.88, '#f6b26f'], [1, '#ffe0a0']]);
  sun(c, 160, 176, 12, '#fff2c8', 'rgba(255,170,100,0.6)');
  const cl = L('clouds', { depth: 0.05, anim: { type: 'drift', t: 260 } });
  for (let x = 0; x < S(0.1); x += 220) cloudBand(cl, r, x + r.r(0, 60), r.r(30, 100), r.r(140, 220), r.r(5, 9), { body: '#5e3f6e', rim: '#ffac80', shadow: '#4a3160', hi: '#ffe0b0', lightFromBelow: true });
  const far = L('far', { depth: 0.14 });
  ridge(far, r, 178, 30, '#8f607c', { x1: S(0.14) });
  // Lavilledieu on the far bank: roofs, the church tower
  for (let x = 30; x < S(0.14) - 40; x += r.r(24, 40)) frHouse(far, r, x, 188, r.r(16, 24), r.r(8, 12), { wall: '#a8747e', wallDark: '#80586a', roof: '#7a3f4e', roofDark: '#6a3444', roofH: 5, windows: [[5, 3, 3, 3, { lit: r() < 0.6, frame: '#80586a' }]] });
  rect(far, 300, 140, 14, 48, '#a8747e'); poly(far, [[297, 140], [317, 140], [307, 118]], '#7a3f4e');
  const mid = L('mid', { depth: 0.45 });
  for (let x = 20; x < S(0.45); x += r.r(50, 90)) cypress(mid, r, x, 196, r.r(40, 70), ['#1e2a22', '#3d4c2c']);
  const g = L('ground', { depth: 1 });
  vgrad(g, 0, 190, W, 14, [[0, '#8a7a48'], [1, '#6a6a3a']]);
  bank(g, r, 0, W, { grass0: '#7a7a3a', grass1: '#5a5a2a', tip: '#a8a060', earth: '#5a4636', dark: '#2a2018', stone: '#a0968e' });
  // the iron gate, a low wall, rows of stones, the old plane tree, and her grave at the end
  for (let x = 40; x < 90; x += 4) rect(g, x, GY - 26, 1, 24, '#2c2430');
  rect(g, 36, GY - 28, 4, 26, '#6a5e5a'); rect(g, 90, GY - 28, 4, 26, '#6a5e5a'); rect(g, 40, GY - 20, 50, 1, '#2c2430');
  rect(g, 94, GY - 10, W - 94, 8, '#8b7f7a'); rect(g, 94, GY - 10, W - 94, 2, '#d8bda2');
  const stone = (x, s, kind) => {
    if (kind === 0) { rect(g, x - s * 0.5, GY - 2 - s * 1.5, s, s * 1.5, '#a0968e'); ellipse(g, x, GY - 2 - s * 1.5, s * 0.5, s * 0.34, '#a0968e'); rect(g, x - s * 0.5, GY - 2 - s * 1.5, s * 0.3, s * 1.5, '#f0cfa2'); }
    else { rect(g, x - s * 0.13, GY - 2 - s * 2.1, s * 0.26 + 1, s * 2.1, '#a0968e'); rect(g, x - s * 0.55, GY - 2 - s * 1.55, s * 1.1, s * 0.26 + 1, '#a0968e'); }
  };
  for (let x = 130; x < 760; x += r.r(34, 60)) stone(x, r.r(7, 10), r.i(0, 1));
  trunk(g, 640, GY - 2, 70, 10, 6, '#5b4a3e', '#3f332c');
  crown(g, r, 620, GY - 90, 60, 36, ['#2e3a24', '#5b6b2e', '#c8a14c', '#ffd98a'], { x: -0.9, y: -0.3 }, 60);
  // Hélène's grave, with flowers
  stone(880, 13, 0);
  for (let i = 0; i < 30; i++) px(g, 866 + r() * 28, GY - 4 + r() * 4, r.pick(['#f4a7b9', '#ffffff', '#e27a9a', '#ffd0dc']));
  const fr = L('front', { depth: 1.3, anim: sway(3, 3.6) });
  reeds(fr, r, ['#3a3a22', '#56562e', '#77703c'], 90);
  return { colors: 64, vignette: [0.35, '30,10,20'] };
};
