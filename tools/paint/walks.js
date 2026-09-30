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
// France at its proudest: the regiment's headquarters, ramparts and watchtowers, tents and guns,
// and on the horizon the citadels, barracks, domes and towers of a military nation. The
// airships and balloons, the waving flags, the soldiers, the smoke and the fire are drawn by
// the walk itself (story/walks.js says where).
WALKS.camp = (c, L) => {
  const r = rng(401);
  // a pink dawn, the sun just up on the left
  vgrad(c, 0, 0, 480, WY, [[0, '#56588e'], [0.28, '#9a78aa'], [0.52, '#e296ae'], [0.74, '#f7b4a4'], [0.9, '#ffd6b0'], [1, '#fff0d4']]);
  stars(c, r, 16, 0, 0, 480, 34, '#f4ecff');
  sun(c, 118, 150, 15, '#fff6e6', 'rgba(255,150,170,0.55)');
  c.clearRect(0, WY, 480, H - WY);
  // heavy clouds drifting over, lit pink from below by the rising sun
  const cl = L('clouds', { depth: 0.05, anim: { type: 'drift', t: 420 } });
  wrapped(cl, 71, (cc, rr) => {
    frCloud(cc, rr, 10, 20, 150, 38, {});
    frCloud(cc, rr, 200, 44, 110, 30, { light: -1 });
    frCloud(cc, rr, 330, 14, 130, 34, {});
    frCloud(cc, rr, 120, 92, 90, 16, { body: '#c4a8c0', shadow: '#9a86a8' });
    frCloud(cc, rr, 380, 100, 80, 14, { body: '#c4a8c0', shadow: '#9a86a8' });
  });
  // the horizon: citadels and barracks in front, Paris behind, smoke from the arsenals
  const far = L('far', { depth: 0.12 });
  const fx1 = S(0.12);
  const hz = { col: '#9a7896', lit: '#d8a4b4', dark: '#6a5070', roof: '#7a5a80' };
  // (everything stands on a far rise, so it shows above the camp's ramparts)
  const B = 172;
  hill(far, r, -40, fx1 + 40, B + 4, 14, '#a88aa4');
  rect(far, 0, B + 2, fx1, 30, '#a88aa4');
  frBarracks(far, r, 6, B, 60, 13, hz.col, hz.roof, hz.lit);
  frStack(far, 72, B, 34, hz.col, hz.lit); frSmoke(far, r, 72, B - 36, 12, 'rgba(226,200,214,0.6)', 1);
  frCathedral(far, 90, B, 1.2, hz.col, hz.lit);
  frDome(far, 180, B, 1.05, hz.col, hz.lit);
  const k1 = frCitadel(far, r, 214, 340, B, 16, hz.col, hz.lit, hz.dark);
  rect(far, k1[0], k1[1], 4, 2, FR.blue); rect(far, k1[0] + 4, k1[1], 4, 2, FR.white); rect(far, k1[0] + 8, k1[1], 4, 2, FR.red);
  frArch(far, 350, B, 1.05, hz.col, hz.lit);
  frBarracks(far, r, 384, B, 70, 14, hz.col, hz.roof, hz.lit);
  for (const x of [400, 426, 452]) { frStack(far, x, B - 12, 24, hz.col, hz.lit); frSmoke(far, r, x, B - 38, 10, 'rgba(226,200,214,0.55)', 1); }
  const k2 = frCitadel(far, r, 466, 604, B, 18, hz.col, hz.lit, hz.dark);
  rect(far, k2[0], k2[1], 4, 2, FR.blue); rect(far, k2[0] + 4, k2[1], 4, 2, FR.white); rect(far, k2[0] + 8, k2[1], 4, 2, FR.red);
  // a semaphore tower, the telegraph of the army, arms raised
  rect(far, 616, B - 40, 3, 40, hz.col); rect(far, 608, B - 40, 19, 2, hz.col); line(far, 608, B - 40, 604, B - 46, hz.col, 1); line(far, 627, B - 39, 632, B - 33, hz.col, 1);
  far.save(); far.globalCompositeOperation = 'source-atop'; vgrad(far, 0, 110, fx1, 76, [[0, 'rgba(255,190,200,0.05)'], [1, 'rgba(255,200,205,0.35)']]); far.restore();
  // nearer: the outer works of the fortress, poplars along the road, the garrison town's roofs
  const mid = L('mid', { depth: 0.38 });
  const mx1 = S(0.38);
  vgrad(mid, 0, 184, mx1, 12, [[0, '#9a8a78'], [1, '#7e7058']]);
  const pts = [[0, 196], [0, 186]];
  for (let x = 0; x < mx1; x += 70) pts.push([x + 10, 186], [x + 30, 186], [x + 38, 181], [x + 46, 186], [x + 70, 186]);
  pts.push([mx1, 186], [mx1, 196]);
  poly(mid, pts, '#8a6e82');
  for (let x = 0; x < mx1; x += 70) { poly(mid, [[x + 30, 186], [x + 38, 181], [x + 38, 196]], '#b08e9e'); px(mid, x + 36, 184, '#3a2e3a'); px(mid, x + 42, 184, '#3a2e3a'); }
  for (let x = 12; x < mx1; x += r.r(26, 52)) poplar(mid, r, x, 188, r.r(30, 44), { trunk: '#4a3a44', leaves: ['#56604a', '#6e7a56', '#a0a070'] }, -1);
  for (const x of [150, 420, 700]) {
    frHouse(mid, r, x, 190, 28, 14, { wall: '#d8bcb4', wallDark: '#b09098', roof: '#6e6c8e', roofDark: '#4e4c6e', roofH: 8, windows: [[6, 4, 3, 4, { lit: true }], [18, 4, 3, 4]] });
    frHouse(mid, r, x + 30, 190, 22, 12, { wall: '#e0c4b4', wallDark: '#b89a98', roof: '#a8583e', roofDark: '#7a3e2c', roofH: 7, windows: [[8, 4, 3, 4]] });
  }
  // the camp itself
  const g = L('ground', { depth: 1 });
  vgrad(g, 0, 184, W, 22, [[0, '#b89478'], [1, '#8e6c52']]);
  texture(g, r, 0, 184, W, 22, 0.06, 2);
  bank(g, r, 0, W, { grass0: '#94885a', grass1: '#6e6a40', tip: '#bcb070', earth: '#6e5042', dark: '#3a2a26', stone: '#a88c8c' });
  frRampart(g, r, 0, 1198, 188, 22, { lamps: [300, 560, 960] });
  // tents in rows before the wall
  for (const [x, s] of [[176, 18], [214, 21], [254, 17], [470, 19], [506, 17], [1152, 17]]) frTent(g, x, GY - 3, s, { pennant: s > 20 });
  frTent(g, 1104, GY - 3, 24, { pennant: true });
  // the west watchtower and the great flag
  frTower(g, r, 94, GY - 2);
  rect(g, 140, GY - 92, 2, 90, '#3a2e2a'); rect(g, 140, GY - 92, 1, 90, '#7a6a60'); circle(g, 141, GY - 93, 2, FR.gold.lit);
  // the armoury, the shooting range and the band
  frBannerPole(g, 196, GY - 2); frBannerCloth(g, 196, GY - 2, 'rifles');
  frRifles(g, 232, GY - 1);
  for (const x of [356, 380]) {
    line(g, x - 5, GY - 2, x - 3, GY - 16, FR.wood.mid, 1); line(g, x + 5, GY - 2, x + 3, GY - 16, FR.wood.mid, 1);
    circle(g, x, GY - 18, 6, '#f2eadc'); circle(g, x, GY - 18, 4.5, '#c83a3a'); circle(g, x, GY - 18, 3, '#f2eadc'); circle(g, x, GY - 18, 1.5, '#2a2030');
    rect(g, x - 7, GY - 6, 14, 5, '#d8b860'); rect(g, x - 7, GY - 6, 14, 1, '#f0d890');
  }
  frBannerPole(g, 446, GY - 2); frBannerCloth(g, 446, GY - 2, 'drum');
  frRifles(g, 612, GY - 1);
  // the headquarters, with the regiment's colours either side
  const hq = frHQ(g, r, 752, GY - 2);
  for (const x of [646, 858]) { rect(g, x, GY - 70, 2, 68, '#3a2e2a'); circle(g, x + 1, GY - 72, 2.5, FR.gold.lit); poly(g, [[x - 2, GY - 74], [x + 1, GY - 79], [x + 4, GY - 74]], FR.gold.mid); }
  // the fire before the steps
  ellipse(g, 752, GY - 1, 16, 3, '#3a2a26');
  for (let k = 0; k < 6; k++) line(g, 740 + k * 5, GY - 1, 747 + k * 3, GY - 8, '#5a3a24', 2);
  glow(g, 752, GY - 10, 46, 'rgba(255,150,80,0.45)');
  // stores, the artillery park, the drill ground
  for (const [x, w, hh] of [[866, 18, 12], [884, 14, 18], [872, 12, 8]]) { rect(g, x, GY - 2 - hh, w, hh, '#7a5a3a'); rect(g, x, GY - 2 - hh, w, 2, '#b08a5a'); line(g, x, GY - 2 - hh, x + w, GY - 2, '#5a3e28', 1); }
  for (const x of [902, 910]) { ellipse(g, x, GY - 8, 4, 7, '#6a4a2e'); rect(g, x - 4, GY - 10, 8, 1, '#3a2a1e'); rect(g, x - 4, GY - 5, 8, 1, '#3a2a1e'); }
  frBannerPole(g, 924, GY - 2); frBannerCloth(g, 924, GY - 2, 'cannon');
  frGun(g, 1030, GY - 1, 1); frGun(g, 1074, GY - 1, 1); frShot(g, 1050, GY - 1);
  // the supply wagon
  rect(g, 1126, GY - 26, 56, 16, '#6a4a2a'); rect(g, 1126, GY - 26, 56, 2, '#8a6a3a');
  poly(g, [[1122, GY - 26], [1186, GY - 26], [1176, GY - 46], [1132, GY - 46]], '#ece0d0'); poly(g, [[1154, GY - 46], [1176, GY - 46], [1186, GY - 26], [1160, GY - 26]], '#c8b4b0');
  for (const x of [1138, 1170]) { circle(g, x, GY - 8, 8, '#3a2a1a'); circle(g, x, GY - 8, 6, '#6a4a2a'); circle(g, x, GY - 8, 2, '#3a2a1a'); }
  // the gate: stone pillars, the iron gates standing open, and the east watchtower inside
  frTower(g, r, 1182, GY - 2);
  for (const x of [1200, 1246]) {
    rect(g, x, GY - 52, 12, 50, FR.stone.mid); rect(g, x, GY - 52, 4, 50, FR.stone.hi); rect(g, x + 9, GY - 52, 3, 50, FR.stone.shade);
    poly(g, [[x - 2, GY - 52], [x + 14, GY - 52], [x + 6, GY - 62]], FR.slate.mid);
    for (let y = GY - 48; y < GY - 4; y += 6) rect(g, x, y, 12, 1, FR.stone.line);
    rect(g, x + 4, GY - 68, 4, 5, FR.lit); glow(g, x + 6, GY - 66, 12, 'rgba(255,200,120,0.55)');
  }
  for (const [x, s] of [[1212, 1], [1246, -1]]) for (let k = 0; k < 7; k++) line(g, x + s * k * 2, GY - 4, x + s * k * 2 - s * 3, GY - 40 + k, '#2e2a34', 1);
  // outside: the road north between poplars, a fence, the milestone and the signpost
  for (let x = 1266; x < W; x += 16) rect(g, x, GY - 16, 2, 14, '#6a4a2a');
  rect(g, 1266, GY - 14, W - 1266, 2, '#8a6a3a'); rect(g, 1266, GY - 8, W - 1266, 2, '#8a6a3a');
  for (const x of [1290, 1330, 1420]) poplar(g, r, x, GY - 4, r.r(52, 64), { trunk: '#4a3a3a', leaves: ['#4e5a3a', '#6a7644', '#9aa05a'] }, -1);
  rect(g, 1360, GY - 34, 3, 32, '#5a3a24'); poly(g, [[1348, GY - 34], [1392, GY - 34], [1398, GY - 30], [1392, GY - 26], [1348, GY - 26]], '#c8a878');
  rect(g, 1312, GY - 12, 6, 10, '#d8d0c4'); rect(g, 1312, GY - 12, 6, 2, '#c83a3a');
  const fr = L('front', { depth: 1.3, anim: sway(3, 3.4) });
  reeds(fr, r, ['#4a4a2a', '#66663a', '#8a8a4a']);
  return { colors: 96, vignette: [0.25, '40,20,40'], anchors: { flag: hq.flag, chimneys: hq.chimneys } };
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

// ---------------------------------------------------------------- the road from the coast, through the war
WALKS.crossing = (c, L) => {
  const r = rng(461);
  vgrad(c, 0, 0, 480, WY, [[0, '#140c14'], [0.35, '#3a1622'], [0.65, '#8a2e24'], [0.88, '#e0602a'], [1, '#ffa050']]);
  const cl = L('clouds', { depth: 0.05, anim: { type: 'drift', t: 140 } });
  for (let x = 0; x < S(0.1); x += 170) cloudBand(cl, r, x + r.r(0, 60), r.r(18, 100), r.r(170, 250), r.r(10, 16), { body: '#2e1418', rim: '#e0602a', shadow: '#1e0c10', hi: '#ffa050', lightFromBelow: true });
  const far = L('far', { depth: 0.12 });
  ridge(far, r, 176, 40, '#2e1420', { x1: S(0.12) });
  // fires along the far hills, and smoke going up from them
  for (let x = 30; x < S(0.12); x += r.r(90, 160)) {
    glow(far, x, 172, 30, 'rgba(255,120,50,0.55)');
    for (let k = 0; k < 5; k++) ellipse(far, x + r.r(-5, 5), 172 - r.r(0, 6), r.r(1.5, 3), r.r(3, 6), r.pick(['#ffb040', '#ff7a2a', '#e0502a']));
    for (let i = 0; i < 22; i++) { const t = i / 22; ellipse(far, x + t * t * 40 + r.r(-2, 2), 168 - t * 90, 3 + t * 14, 3 + t * 11, t < 0.2 ? '#6a2a20' : '#241016'); }
  }
  const mid = L('mid', { depth: 0.4 });
  for (let x = 0; x < S(0.4); x += r.r(50, 110)) {
    bareTree(mid, r, x, 198, r.r(28, 46), '#140a0c', null);
    if (r() < 0.4) { glow(mid, x, 170, 16, 'rgba(255,120,40,0.6)'); for (let k = 0; k < 4; k++) ellipse(mid, x + r.r(-6, 6), 168 - r.r(0, 14), r.r(1.5, 3), r.r(3, 6), r.pick(['#ffb040', '#ff7a2a'])); }
  }
  const g = L('ground', { depth: 1 });
  vgrad(g, 0, 188, W, 16, [[0, '#3a2020'], [1, '#2a1616']]);
  bank(g, r, 0, W, { grass0: '#3a2a22', grass1: '#2a1c18', tip: '#5a3a2a', earth: '#221412', dark: '#100808', stone: '#4a3632' });
  // craters, a broken fence, a signpost, a field gun left behind
  for (let x = 90; x < W; x += r.r(110, 190)) { ellipse(g, x, GY - 1, r.r(10, 16), 3, '#140a0a'); ellipse(g, x, GY - 2, r.r(7, 12), 2, '#0a0606'); for (let k = 0; k < 5; k++) rect(g, x + r.r(-14, 14), GY - r.r(2, 5), 2, 1, '#4a3024'); }
  for (let x = 240; x < 420; x += 12) { rect(g, x, GY - 14 + (x % 3), 2, 14, '#2a1a14'); if (x % 24 === 0) line(g, x, GY - 10, x + 12, GY - 8 - (x % 5), '#2a1a14', 1); }
  rect(g, 700, GY - 30, 2, 30, '#2a1a14'); rect(g, 692, GY - 30, 22, 6, '#4a3020'); rect(g, 692, GY - 30, 22, 1, '#7a5234');
  rect(g, 1030, GY - 12, 26, 3, '#1e1a20'); circle(g, 1036, GY - 5, 5, '#2a1a10'); circle(g, 1036, GY - 5, 3, '#4a3020'); line(g, 1044, GY - 10, 1060, GY - 16, '#1e1a20', 3);
  const fr = L('front', { depth: 1.3, anim: sway(2, 3.6) });
  reeds(fr, r, ['#1a0e0c', '#2a1814', '#3e2218'], 80);
  return { colors: 64, vignette: [0.5, '24,4,4'] };
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
