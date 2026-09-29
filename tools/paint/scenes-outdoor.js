/*
 * Outdoor scenes, painted as layers so they can move (see paintScene in kit.js).
 * `c` starts as the sky; L(id, {depth, anim}) begins a new layer on top.
 */
/* global W, H, TAU, rng, vgrad, hgrad, rect, px, circle, ellipse, poly, line, glow, shade, shaft, speckle,
   stars, moon, sun, cloudBand, cumulus, hill, treeLine, crown, trunk, branch, tree, poplar, cypress, pine,
   frHouse, window_, jpHouse, reflect, texture, tufts, rock, wrapped */

globalThis.SCENES = globalThis.SCENES || {};

// ---------------------------------------------------------------- the road east, in three moods
function roadScene(c, L, mood) {
  const r = rng(11);
  const P = {
    sunset: { sky: [[0, '#22285a'], [0.3, '#4e4583'], [0.58, '#b0667f'], [0.8, '#ef946a'], [1, '#ffd592']], cloud: ['#56427c', '#ffae78', '#40336a', '#ffe1ad'],
      hills: ['#8b6c99', '#83679a', '#6b5487'], ground: [[0, '#c39463'], [0.2, '#9a7447'], [0.55, '#654e33'], [1, '#2c2419']], bands: ['#8a6841', '#80613d', '#6a5234'],
      road: ['#a4815d', '#c4a07a', '#8d6d4d'], pole: '#3a2828', leaves: ['#4c5a2c', '#88903a', '#d9b45a', '#ffe79a'], grass: ['#2c261b', '#4a3c26', '#6a5530'], puddle: ['#f0a878', '#ffd9a0'] },
    winter: { sky: [[0, '#5d6184'], [0.45, '#8f8fae'], [0.8, '#c9c2d2'], [1, '#e8e0e2']], cloud: ['#8a8aa6', '#e8e4ee', '#76779a', '#ffffff'],
      hills: ['#a9adc6', '#9da2bf', '#8a90b2'], ground: [[0, '#e6e8f0'], [0.3, '#c9cfe0'], [0.7, '#a4abc4'], [1, '#6e7592']], bands: ['#d5d9e8', '#cdd2e4', '#b8bfd6'],
      road: ['#8f8e9c', '#b9b8c4', '#6e6c7c'], pole: '#3a3642', leaves: null, grass: ['#6e7592', '#8a90aa', '#5a6080'], puddle: ['#c9cfe6', '#eef0f8'] },
    rain: { sky: [[0, '#151a26'], [0.45, '#2c3242'], [0.8, '#4a5061'], [1, '#6b6f78']], cloud: ['#232837', '#5b6272', '#1a1e2a', '#7a8090'],
      hills: ['#3a3f52', '#343a4c', '#2a2f40'], ground: [[0, '#4c4a42'], [0.3, '#3a3a33'], [0.7, '#2a2a25'], [1, '#141410']], bands: ['#44423a', '#403e36', '#34332c'],
      road: ['#4f4a44', '#6a645c', '#3e3a35'], pole: '#1c1a1e', leaves: ['#1e2a1c', '#34462a', '#4f6a3a', '#7e9a5a'], grass: ['#141410', '#23241c', '#34362a'], puddle: ['#6b7384', '#9aa2b4'] },
  }[mood];
  vgrad(c, 0, 0, W, 160, P.sky);
  if (mood === 'sunset') sun(c, 318, 147, 9, '#fff6d6', 'rgba(255,170,100,0.55)');
  if (mood === 'winter') { glow(c, 300, 110, 60, 'rgba(255,245,230,0.5)'); circle(c, 300, 110, 8, '#f6f0ea'); }
  const cl = L('clouds', { depth: 0.05, anim: { type: 'drift', t: mood === 'rain' ? 90 : 200 } });
  wrapped(cl, 5, (cc, rr) => {
    const [body, rim, shadowC, hi] = P.cloud;
    const bands = mood === 'rain' ? [[0, 12, 260, 20], [200, 40, 280, 18], [60, 76, 240, 14], [300, 100, 200, 10]] : [[10, 30, 200, 9], [250, 20, 240, 11], [110, 66, 180, 7], [330, 92, 160, 6], [-20, 108, 150, 5]];
    for (const [x, y, w, hh] of bands) cloudBand(cc, rr, x, y, w, hh, { body, rim, shadow: shadowC, hi, lightFromBelow: mood === 'sunset' });
  });
  const far = L('far', { depth: 0.12 });
  hill(far, r, -60, 300, 152, 34, P.hills[0]);
  hill(far, r, 170, 540, 152, 24, P.hills[1]);
  hill(far, r, -40, 520, 154, 12, P.hills[2], { sharp: 0.3 });
  if (mood === 'winter') for (let i = 0; i < 90; i++) px(far, r() * W, 124 + r() * 30, '#eef0f8');
  // the steppe, in bands of low rises
  const g = L('land', { depth: 0.35 });
  vgrad(g, 0, 150, W, H - 150, P.ground);
  if (mood === 'sunset') glow(g, 318, 158, 120, 'rgba(255,160,90,0.35)');
  hill(g, r, -40, 260, 172, 7, P.bands[0], { sharp: 0.4 });
  hill(g, r, 280, 540, 178, 8, P.bands[1], { sharp: 0.4 });
  hill(g, r, -60, 200, 206, 12, P.bands[2], { sharp: 0.4 });
  texture(g, r, 0, 152, W, 118, 0.08, 3);
  if (mood === 'winter') speckle(g, r, 0, 156, W, 110, ['#ffffff', '#dfe4f2', '#b6bdd6'], 900);
  else speckle(g, r, 0, 156, W, 30, [P.bands[0], P.ground[1][1]], 500);
  const road = (col, inset) => {
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(150 + inset, H); g.bezierCurveTo(210 + inset, 225, 350, 205, 300 + inset * 0.3, 180); g.bezierCurveTo(275, 166, 305, 158, 316, 153);
    g.lineTo(320, 153); g.bezierCurveTo(314, 160, 292, 168, 318 - inset * 0.3, 182); g.bezierCurveTo(390, 214, 300, 236, 350 - inset, H);
    g.closePath(); g.fill();
  };
  road(P.road[0], 0);
  road(P.road[1], 18);
  texture(g, r, 150, 150, 240, 120, 0.1, 2, (cc) => { cc.rect(150, 150, 240, 120); });
  for (let i = 0; i < 2; i++) {
    g.strokeStyle = P.road[2]; g.lineWidth = 1.5; g.beginPath();
    g.moveTo(205 + i * 50, H); g.bezierCurveTo(250 + i * 28, 228, 330 + i * 8, 208, 305 + i * 5, 182); g.stroke();
  }
  for (const [x, y, w] of mood === 'rain' ? [[262, 238, 18], [300, 214, 12], [236, 252, 22], [320, 196, 8]] : [[262, 238, 16]]) {
    ellipse(g, x, y, w, 3, P.puddle[0]); ellipse(g, x, y, w * 0.6, 1.5, P.puddle[1]);
  }
  if (mood === 'sunset') glow(g, 316, 160, 60, 'rgba(255,200,130,0.5)');
  // telegraph poles marching to the horizon, wires sagging between them
  const poles = [];
  for (let i = 0; i < 10; i++) {
    const t = Math.pow(i / 9, 1.7);
    poles.push([440 - t * 118, 262 - t * 105, 76 * (1 - t) + 7]);
  }
  for (let i = 0; i < poles.length - 1; i++) {
    const [x0, y0, h0] = poles[i], [x1, y1, h1] = poles[i + 1];
    for (const f of [0.95, 0.84]) {
      g.strokeStyle = mood === 'winter' ? 'rgba(60,56,70,0.7)' : 'rgba(46,30,40,0.75)'; g.lineWidth = 1; g.beginPath();
      g.moveTo(x0, y0 - h0 * f); g.quadraticCurveTo((x0 + x1) / 2, (y0 - h0 * f + y1 - h1 * f) / 2 + 5 * (1 - i / 10), x1, y1 - h1 * f); g.stroke();
    }
  }
  for (const [x, y, hh] of poles) {
    const w = Math.max(1, hh / 22);
    rect(g, x, y - hh, w, hh, P.pole); rect(g, x - hh * 0.13, y - hh * 0.93, hh * 0.26 + 1, Math.max(1, hh / 40), P.pole);
    if (w > 1.5 && mood === 'sunset') rect(g, x, y - hh, 1, hh, '#e0906a');
    if (mood === 'winter') rect(g, x - hh * 0.13, y - hh * 0.93 - 1, hh * 0.26 + 1, 1, '#ffffff');
  }
  if (mood === 'winter') {
    // a sleigh far off on the road
    rect(g, 304, 170, 6, 2, '#2e2a36'); rect(g, 311, 168, 3, 3, '#3a3040'); px(g, 314, 167, '#3a3040'); line(g, 303, 172, 311, 172, '#2e2a36', 1);
  }
  // birches along the left of the road, each swaying on its own
  for (let i = 0; i < 8; i++) {
    const t = Math.pow(i / 7, 1.6);
    const x = 30 + t * 230, yb = 270 - t * 112, hh = 160 * (1 - t) + 12;
    const tl = L(`birch${i}`, { depth: 0.35, anim: sway(mood === 'rain' ? 2.4 : 1.1, r.r(4.5, 7)) });
    if (P.leaves) birch(tl, r, x, yb, hh, P.leaves);
    else { birch(tl, r, x, yb, hh, null); bareTree(tl, r, x + 1, yb - hh * 0.4, hh * 0.7, '#6a5a5a', '#ffffff'); }
    ellipse(g, x + hh * 0.2, yb, hh * 0.25, hh * 0.03, mood === 'winter' ? 'rgba(90,96,130,0.35)' : 'rgba(40,24,20,0.35)');
  }
  // foreground grass, nodding in the wind
  const gr = L('grass', { depth: 0.6, anim: sway(mood === 'rain' ? 9 : 5, 3.4) });
  tufts(gr, r, 0, 240, 150, 30, 70, P.grass);
  tufts(gr, r, 350, 236, 130, 34, 60, P.grass);
  if (mood === 'sunset') { speckle(gr, r, 0, 238, 150, 30, ['#c8a6e8', '#ffe08a', '#f4b3c6'], 30); speckle(gr, r, 360, 236, 120, 30, ['#c8a6e8', '#ffe08a', '#f4b3c6'], 24); }
  return { colors: 64, vignette: mood === 'rain' ? [0.55, '5,8,16'] : mood === 'winter' ? [0.35, '40,40,70'] : [0.4, '20,10,20'] };
}
SCENES.road_east = (c, L) => roadScene(c, L, 'sunset');
SCENES.road_winter = (c, L) => roadScene(c, L, 'winter');
SCENES.road_rain = (c, L) => roadScene(c, L, 'rain');

// ---------------------------------------------------------------- a smuggler's boat at night, seen from its own deck
SCENES.smuggler_boat = (c, L) => {
  const r = rng(21);
  vgrad(c, 0, 0, W, 142, [[0, '#060b22'], [0.45, '#13224c'], [1, '#3a5687']]);
  stars(c, r, 180, 0, 0, W, 125);
  moon(c, 300, 56, 16, { seed: 4 });
  const cl = L('clouds', { depth: 0.04, anim: { type: 'drift', t: 240 } });
  wrapped(cl, 8, (cc, rr) => {
    cloudBand(cc, rr, 200, 78, 220, 8, { body: '#16244f', rim: '#8fa8dc', shadow: '#101a3c', hi: '#cfe0ff', lightFromBelow: false });
    cloudBand(cc, rr, -10, 40, 170, 8, { body: '#121f46', rim: '#5d78b0', shadow: '#0d1636', hi: '#a9bff0', lightFromBelow: false });
    cloudBand(cc, rr, 360, 30, 140, 6, { body: '#121f46', rim: '#6f8ac2', shadow: '#0d1636', hi: '#b9cdf5', lightFromBelow: false });
  });
  const sea = L('sea', { depth: 0.1 });
  hill(sea, r, -40, 250, 142, 18, '#0d1632');
  hill(sea, r, 330, 540, 142, 7, '#0f1a38');
  vgrad(sea, 0, 141, W, H - 141, [[0, '#2b4878'], [0.3, '#16284f'], [1, '#060d22']]);
  for (let i = 0; i < 700; i++) {
    const y = 142 + Math.pow(r(), 1.5) * 128;
    sea.globalAlpha = r.r(0.2, 0.6);
    rect(sea, r() * W, y, 2 + (y - 140) * 0.14 * r(), 1, r() < 0.55 ? '#3f5f96' : '#081330');
  }
  sea.globalAlpha = 1;
  for (let i = 0; i < 110; i++) {
    const y = 143 + Math.pow(r(), 1.3) * 60;
    const spread = 4 + (y - 142) * 0.55;
    sea.globalAlpha = r.r(0.4, 1);
    rect(sea, 300 + r.r(-1, 1) * spread, y, r.r(2, 3 + (y - 142) * 0.1), 1, r() < 0.3 ? '#ffffff' : '#bcd0f4');
  }
  sea.globalAlpha = 1;
  glow(sea, 300, 160, 70, 'rgba(150,180,240,0.25)');
  // the deck rises and falls on the swell
  const d = L('deck', { depth: 0.8, anim: { type: 'bob', a: 1.6, r: 0.55, t: 7, oy: 1 } });
  const bow = [318, 196];
  poly(d, [[0, 232], bow, [W, 246], [W, H + 8], [0, H + 8]], '#241e2e');
  for (let i = -8; i <= 14; i++) line(d, bow[0], bow[1], bow[0] + i * 40, H, i % 3 ? '#1c1725' : '#2e2839', 1);
  poly(d, [[0, 224], bow, [0, 234]], '#15111c');
  poly(d, [[W, 236], bow, [W, 248]], '#15111c');
  line(d, 0, 224, bow[0], bow[1], '#8aa2d4', 1); line(d, W, 236, bow[0], bow[1], '#6a82b6', 1);
  for (let i = 1; i < 7; i++) { const t = i / 7; rect(d, bow[0] * t, 224 + (bow[1] - 224) * t, 2, 10 * (1 - t) + 2, '#15111c'); }
  for (let i = 1; i < 5; i++) { const t = i / 5; rect(d, W - (W - bow[0]) * t, 236 + (bow[1] - 236) * t, 2, 12 * (1 - t) + 2, '#15111c'); }
  line(d, bow[0], bow[1] - 1, 404, 170, '#2a2233', 2); line(d, bow[0], bow[1] - 2, 404, 169, '#7f97c9', 1);
  line(d, 404, 170, 78, 0, 'rgba(130,150,200,0.7)', 1);
  rect(d, 70, 0, 7, 236, '#1d1826'); rect(d, 75, 0, 2, 236, '#6d84b6');
  line(d, 73, 150, 250, 205, '#1d1826', 3); line(d, 74, 149, 250, 204, '#6d84b6', 1);
  for (let k = 0; k < 14; k++) { const t = k / 14; ellipse(d, 80 + t * 165, 146 + t * 55, 7, 4, k % 2 ? '#2d2c44' : '#3c3d5c'); }
  line(d, 73, 20, 0, 170, 'rgba(120,140,190,0.7)', 1);
  rect(d, 84, 118, 1, 12, '#15111c'); rect(d, 79, 130, 11, 13, '#15111c'); rect(d, 81, 132, 7, 7, '#2c3350'); rect(d, 78, 129, 13, 2, '#3a3a55');
  for (let k = 0; k < 5; k++) ellipse(d, 150, 252 - k * 1.2, 22 - k * 3.6, 5 - k * 0.8, k % 2 ? '#473a37' : '#6b574a');
  rect(d, 372, 224, 40, 30, '#2c2231'); rect(d, 372, 224, 40, 2, '#7a8fbe'); rect(d, 372, 238, 40, 1, '#1c1621'); rect(d, 390, 224, 1, 30, '#1c1621');
  ellipse(d, 432, 246, 16, 20, '#2a2030'); rect(d, 416, 238, 32, 2, '#48405a'); rect(d, 416, 252, 32, 2, '#48405a'); rect(d, 443, 228, 2, 36, '#7a8fbe');
  return { colors: 56, vignette: [0.5, '0,4,20'] };
};

// ---------------------------------------------------------------- the west coast of Japan at first light
SCENES.japan_coast = (c, L) => {
  const r = rng(31);
  vgrad(c, 0, 0, W, 150, [[0, '#131942'], [0.42, '#433a78'], [0.72, '#b3687e'], [0.9, '#f0a076'], [1, '#ffd49c']]);
  stars(c, r, 80, 0, 0, W, 70);
  moon(c, 64, 38, 8, { seed: 9, halo: 'rgba(170,190,255,0.25)' });
  glow(c, 410, 150, 170, 'rgba(255,170,110,0.45)');
  hill(c, r, 160, 560, 150, 58, '#56467f');
  hill(c, r, 230, 520, 150, 34, '#443a6e', { sharp: 0.6 });
  vgrad(c, 180, 132, 300, 18, [[0, 'rgba(255,200,190,0)'], [1, 'rgba(255,200,190,0.35)']]);
  vgrad(c, 0, 149, W, 70, [[0, '#e7a07e'], [0.2, '#8a6488'], [1, '#2b3163']]);
  reflect(c, 150, 212, { dark: 0.55, tint: [40, 44, 90], wave: 1.5, ripples: 110, rippleCol: '#f3b690', seed: 5 });
  const cl = L('clouds', { depth: 0.05, anim: { type: 'drift', t: 220 } });
  wrapped(cl, 12, (cc, rr) => {
    cloudBand(cc, rr, 180, 56, 230, 8, { body: '#5e4a82', rim: '#ffb294', shadow: '#4a3b72', hi: '#ffe0c0' });
    cloudBand(cc, rr, 320, 96, 170, 6, { body: '#8a5a86', rim: '#ffc79a', shadow: '#744c7c', hi: '#fff0d0' });
    cloudBand(cc, rr, 60, 86, 130, 5, { body: '#6e4f82', rim: '#ffb294', shadow: '#5b4376', hi: '#ffe0c0' });
  });
  const g = L('land', { depth: 0.4 });
  poly(g, [[222, 192], [236, 180], [480, 176], [480, 196], [222, 198]], '#3a3150');
  for (const [x, yb, w, hh, rh] of [[262, 178, 22, 8, 7], [300, 177, 30, 10, 9], [352, 176, 22, 8, 7], [398, 175, 34, 11, 10], [446, 176, 26, 9, 8]]) {
    jpHouse(g, r, x, yb, w, hh, { roof: '#262a40', roofLight: '#6f6a92', plaster: '#9d8aa0', wood: '#2a2233', roofH: rh, windows: [[w * 0.35, 3, 4, 4, r() < 0.5]] });
  }
  for (const [x, yb, w, hh, rh] of [[240, 194, 36, 13, 12], [318, 193, 30, 12, 10], [364, 194, 40, 14, 13], [426, 193, 32, 12, 11]]) {
    jpHouse(g, r, x, yb, w, hh, { roof: '#2c2f45', roofLight: '#9a8db4', plaster: '#c9aebb', wood: '#2a2233', roofH: rh, windows: [[w * 0.2, 4, 6, 5, r() < 0.7], [w * 0.62, 4, 6, 5, r() < 0.4]] });
  }
  for (let x = 236; x < 300; x += 9) rect(g, x, 197, 1, 12, '#2a2233');
  rect(g, 232, 197, 70, 2, '#4a3c52'); rect(g, 232, 197, 70, 1, '#c79a92');
  vgrad(g, 0, 196, W, H - 196, [[0, '#f0b8a0'], [0.12, '#c99a94'], [0.5, '#8a6f7c'], [1, '#43374c']]);
  texture(g, r, 0, 196, W, 74, 0.06, 3);
  speckle(g, r, 0, 204, W, 66, ['#b0909a', '#7e6b80', '#e3c3b8'], 700);
  for (let i = 0; i < 4; i++) { g.globalAlpha = 0.7 - i * 0.12; g.fillStyle = '#fbe6dc'; g.beginPath(); g.moveTo(0, 197 + i * 4); for (let x = 0; x <= W; x += 8) g.lineTo(x, 197 + i * 4 + Math.sin(x * 0.05 + i) * 1.2); g.lineTo(W, 198 + i * 4); g.lineTo(0, 198 + i * 4); g.fill(); }
  g.globalAlpha = 1;
  for (const [x, y, w] of [[300, 214, 34], [352, 222, 28], [262, 230, 26]]) {
    poly(g, [[x, y], [x + w, y - 2], [x + w - 4, y + 6], [x + 4, y + 6]], '#3a2c34');
    line(g, x + 2, y, x + w - 2, y - 2, '#c79a92', 1);
    ellipse(g, x + w / 2, y + 8, w * 0.55, 2, 'rgba(40,30,50,0.4)');
  }
  for (let i = 0; i < 3; i++) rect(g, 400 + i * 22, 200, 1, 22, '#3a2c34');
  for (let y = 202; y < 216; y += 2) line(g, 400, y, 444, y + 1, 'rgba(60,50,70,0.6)', 1);
  poly(g, [[0, 118], [36, 110], [84, 124], [130, 146], [168, 170], [196, 196], [180, 226], [0, 238]], '#26223c');
  rock(g, r, 104, 140, 72, 54, { dark: '#26223c', mid: '#3e375c', lit: '#c08a90' });
  rock(g, r, 10, 112, 96, 52, { dark: '#26223c', mid: '#3c3659', lit: '#b08292' });
  rock(g, r, 40, 160, 80, 60, { dark: '#221f36', mid: '#37315a', lit: '#8f6f88' });
  rock(g, r, 150, 190, 40, 28, { dark: '#1f1c33', mid: '#352f50', lit: '#a97c8c' });
  rock(g, r, 192, 204, 22, 12, { dark: '#1f1c33', mid: '#352f50', lit: '#c3918f' });
  for (let i = 0; i < 3; i++) { g.globalAlpha = 0.8; ellipse(g, 200 - i * 14, 216 + i * 6, 13, 1.5, '#fbe6dc'); }
  g.globalAlpha = 1;
  rect(g, 176, 166, 7, 3, '#4c4560'); rect(g, 177, 169, 5, 6, '#3a3350'); rect(g, 178, 170, 3, 3, '#ffcf80'); rect(g, 175, 165, 9, 1, '#6d6590'); rect(g, 178, 175, 3, 6, '#3a3350');
  glow(g, 179, 171, 9, 'rgba(255,190,110,0.6)');
  pine(L('pine1', { depth: 0.4, anim: sway(1.2, 7, { ox: 0.3 }) }), r, 64, 110, 100, { trunk: '#1a1522', leaves: ['#17262c', '#2b4a4a', '#f0a888'] }, 1);
  pine(L('pine2', { depth: 0.4, anim: sway(1.5, 6, { ox: 0.3 }) }), r, 138, 142, 62, { trunk: '#1a1522', leaves: ['#17262c', '#2b4a4a', '#f0a888'] }, 1);
  pine(L('pine3', { depth: 0.4, anim: sway(2, 5) }), r, 350, 181, 24, { trunk: '#1a1522', leaves: ['#1d2a34', '#324a52', '#e8a07e'] }, -1);
  return { colors: 64, vignette: [0.35, '10,10,30'] };
};

// ---------------------------------------------------------------- the cemetery at Lavilledieu, in three moods
function cemeteryScene(c, L, mood, opt = {}) {
  const r = rng(41);
  const dusk = mood === 'dusk', night = mood === 'night';
  const P = {
    dusk: { sky: [[0, '#2b2654'], [0.38, '#794f7a'], [0.68, '#d9806e'], [0.88, '#f6b26f'], [1, '#ffe0a0']], hills: ['#8f607c', '#7d5470', '#6a4868'],
      ground: [[0, '#a08c50'], [0.3, '#727040'], [1, '#2a2a1c']], speck: ['#b8a05a', '#7d7640', '#5a5530', '#d4b870'], stone: ['#a0968e', '#f0cfa2', '#5e5660'], wall: ['#8b7f7a', '#d8bda2'],
      house: ['#a8747e', '#80586a', '#7a3f4e'], cyp: ['#1e2a22', '#3d4c2c'], plane: ['#2e3a24', '#5b6b2e', '#c8a14c', '#ffd98a'], grass: ['#3a3a22', '#56562e', '#77703c'], path: '#a8927a' },
    grey: { sky: [[0, '#4b4f5e'], [0.5, '#7a7d8c'], [1, '#aeb0b8']], hills: ['#6f7280', '#666978', '#5c5f6e'],
      ground: [[0, '#6e7260'], [0.3, '#555a48'], [1, '#22241c']], speck: ['#7a7e6a', '#4e5242', '#8a8e7a'], stone: ['#8a8a8e', '#b4b4b8', '#4e4e56'], wall: ['#76767a', '#9a9aa0'],
      house: ['#7e7a80', '#65626a', '#56464e'], cyp: ['#1c2420', '#2e3a2c'], plane: ['#262e22', '#3a4630', '#5e6a46', '#7e8a66'], grass: ['#23261c', '#343a28', '#4a5236'], path: '#7e7c76' },
    night: { sky: [[0, '#070b20'], [0.5, '#15204a'], [1, '#2e3c6e']], hills: ['#1c2446', '#18203e', '#141a36'],
      ground: [[0, '#2a3450'], [0.3, '#1e2640'], [1, '#0a0e1a']], speck: ['#34405e', '#1c2440', '#445274'], stone: ['#5c6680', '#a8b8dc', '#2a3044'], wall: ['#3e4660', '#8a9ac0'],
      house: ['#2e3452', '#242a44', '#1e2238'], cyp: ['#0c1220', '#18223a'], plane: ['#0e1626', '#1a2640', '#3a4e78', '#7890c0'], grass: ['#0a0e18', '#141c2c', '#1e2a40'], path: '#3e4660' },
  }[mood];
  vgrad(c, 0, 0, W, 172, P.sky);
  if (dusk) sun(c, 132, 164, 11, '#fff2c8', 'rgba(255,170,100,0.6)');
  if (night) { stars(c, r, 170, 0, 0, W, 140); moon(c, 360, 50, 13, { seed: 11 }); }
  const cl = L('clouds', { depth: 0.05, anim: { type: 'drift', t: mood === 'grey' ? 120 : 230 } });
  wrapped(cl, 14, (cc, rr) => {
    const sets = {
      dusk: [[170, 36, 240, 10, '#5e3f6e', '#ffac80', '#4a3160', '#ffe0b0'], [0, 78, 170, 7, '#8a5076', '#ffbe88', '#733f6a', '#fff0c8'], [330, 104, 150, 5, '#a45a74', '#ffcc90', '#8c4a6a', '#fff0c8']],
      grey: [[0, 20, 300, 22, '#5a5d6c', '#8a8d9a', '#4a4d5a', '#9a9daa'], [220, 60, 300, 18, '#686b7a', '#9a9ca8', '#585b68', '#aeb0ba'], [40, 100, 240, 12, '#7a7d8a', '#a8aab4', '#6a6d7a', '#babcc4']],
      night: [[40, 60, 200, 7, '#141d40', '#5d74b0', '#0f1634', '#a9bff0'], [300, 84, 170, 6, '#16204a', '#6f8ac2', '#101838', '#b9cdf5']],
    }[mood];
    for (const [x, y, w, hh, body, rim, shadowC, hi] of sets) cloudBand(cc, rr, x, y, w, hh, { body, rim, shadow: shadowC, hi, lightFromBelow: dusk });
  });
  const far = L('far', { depth: 0.12 });
  hill(far, r, -60, 300, 170, 30, P.hills[0]);
  hill(far, r, 200, 540, 170, 22, P.hills[1]);
  hill(far, r, -40, 520, 174, 8, P.hills[2], { sharp: 0.3 });
  treeLine(far, r, 172, 150, 290, 5, [P.hills[2], P.hills[1]]);
  const lit = !(mood === 'grey');
  for (const [x, w, hh] of [[296, 22, 12], [322, 18, 10], [424, 20, 11], [446, 26, 13]]) frHouse(far, r, x, 173, w, hh, { wall: P.house[0], wallDark: P.house[1], wallLight: P.house[0], roof: P.house[2], roofDark: P.house[1], roofH: 6, windows: [[w * 0.35, 3, 3, 4, { lit: lit && r() < 0.7, frame: P.house[1] }]] });
  rect(far, 346, 146, 52, 27, P.house[1]); poly(far, [[342, 146], [402, 146], [394, 134], [350, 134]], P.house[2]);
  for (let i = 0; i < 3; i++) window_(far, 354 + i * 12, 152, 3, 7, { lit, frame: P.house[1] });
  rect(far, 384, 100, 16, 73, P.house[0]); rect(far, 396, 100, 4, 73, P.house[1]); poly(far, [[381, 100], [403, 100], [392, 74]], P.house[2]);
  rect(far, 389, 110, 6, 8, '#2e1f2a'); rect(far, 391, 112, 2, 4, lit ? '#ffcf80' : '#6a6a70');
  rect(far, 391, 68, 1, 7, P.house[2]); rect(far, 389, 70, 5, 1, P.house[2]);
  const g = L('land', { depth: 0.35 });
  vgrad(g, 0, 172, W, H - 172, P.ground);
  texture(g, r, 0, 172, W, 98, 0.1, 3);
  speckle(g, r, 0, 174, W, 96, P.speck, 1200);
  poly(g, [[196, H], [228, 232], [252, 232], [296, H]], P.path);
  texture(g, r, 196, 232, 100, 38, 0.15, 2, (cc) => { cc.moveTo(196, H); cc.lineTo(228, 232); cc.lineTo(252, 232); cc.lineTo(296, H); });
  if (dusk) { g.globalAlpha = 0.32; for (let i = 0; i < 9; i++) { const y = 186 + r() * 70; poly(g, [[r() * 200 + 150, y], [W, y + 8 + r() * 20], [W, y + 12 + r() * 22]], '#2b2438'); } g.globalAlpha = 1; }
  rect(g, 0, 176, W, 9, P.wall[0]); rect(g, 0, 176, W, 2, P.wall[1]); texture(g, r, 0, 178, W, 7, 0.2, 2);
  rect(g, 58, 158, 6, 27, P.wall[0]); rect(g, 58, 158, 2, 27, P.wall[1]); rect(g, 100, 158, 6, 27, P.wall[0]); rect(g, 100, 158, 2, 27, P.wall[1]);
  for (let x = 66; x < 100; x += 4) { rect(g, x, 162, 1, 23, '#2c2430'); px(g, x, 161, '#2c2430'); }
  rect(g, 64, 166, 36, 1, '#2c2430'); rect(g, 64, 176, 36, 1, '#2c2430');
  rect(g, 140, 170, 26, 18, P.stone[0]); rect(g, 140, 170, 8, 18, P.stone[1]); poly(g, [[137, 170], [169, 170], [153, 158]], P.stone[2]); rect(g, 150, 177, 6, 11, '#3a2c34');
  const [st, stLit, stDark] = P.stone;
  const grave = (x, yb, s, kind) => {
    ellipse(g, x + s * 1.1, yb, s * 1.4, s * 0.22, 'rgba(20,16,30,0.45)');
    if (kind === 0) {
      rect(g, x - s * 0.5, yb - s * 1.5, s, s * 1.5, st); ellipse(g, x, yb - s * 1.5, s * 0.5, s * 0.34, st);
      rect(g, x - s * 0.5, yb - s * 1.5, s * 0.3, s * 1.5, stLit); rect(g, x + s * 0.3, yb - s * 1.5, s * 0.2, s * 1.5, stDark);
    } else if (kind === 1) {
      rect(g, x - s * 0.13, yb - s * 2.1, s * 0.26 + 1, s * 2.1, st); rect(g, x - s * 0.55, yb - s * 1.55, s * 1.1, s * 0.26 + 1, st);
      rect(g, x - s * 0.13, yb - s * 2.1, 1, s * 2.1, stLit); rect(g, x - s * 0.55, yb - s * 1.55, s * 1.1, 1, stLit);
    } else {
      rect(g, x - s * 0.8, yb - s * 0.5, s * 1.6, s * 0.5, st); rect(g, x - s * 0.8, yb - s * 0.5, s * 1.6, 1, stLit);
      rect(g, x - s * 0.1, yb - s * 1.4, s * 0.2 + 1, s * 0.9, '#3a3440'); rect(g, x - s * 0.45, yb - s * 1.15, s * 0.9, 1, '#3a3440');
    }
  };
  for (const [y, s, n] of [[194, 4, 13], [208, 6, 10], [226, 9, 7], [252, 13, 5]]) {
    for (let i = 0; i < n; i++) {
      const x = 40 + (i + 0.5) * ((W - 80) / n) + r.r(-8, 8);
      if (y > 220 && x > 170 && x < 320) continue;
      grave(x, y + r.r(-2, 2), s, r.i(0, 2));
    }
  }
  // the grave at the heart of the picture (two side by side, many years later)
  const hearts = opt.two ? [222, 260] : [240];
  for (const hx of hearts) {
    grave(hx, 238, 12, 0);
    for (let i = 0; i < 34; i++) px(g, hx - 14 + r() * 28, 236 + r() * 5, r.pick(night ? ['#c8a0d0', '#e0e0f0', '#a07ab0'] : ['#f4a7b9', '#ffffff', '#e27a9a', '#ffd0dc']));
    for (let i = 0; i < 16; i++) px(g, hx - 14 + r() * 28, 238 + r() * 4, '#4e6b35');
  }
  const lx = opt.two ? 239 : 256;
  rect(g, lx, 230, 5, 7, '#3a3036'); rect(g, lx + 1, 231, 3, 4, mood === 'grey' ? '#8a8078' : '#ffcf80'); rect(g, lx - 1, 229, 7, 1, '#5a4c52');
  if (mood !== 'grey') glow(g, lx + 2, 233, 10, 'rgba(255,190,110,0.6)');
  for (const [i, [x, yb, hh]] of [[22, 192, 134], [44, 188, 98], [452, 194, 142], [426, 188, 92]].entries()) cypress(L(`cypress${i}`, { depth: 0.35, anim: sway(0.9, r.r(6, 9)) }), r, x, yb, hh, P.cyp);
  const pl = L('plane', { depth: 0.45, anim: sway(0.7, 8, { ox: 0.7 }) });
  trunk(pl, 468, 250, 120, 16, 9, '#5b4a3e', '#3f332c');
  branch(pl, 466, 150, 420, 110, 5, '#4f4036');
  crown(pl, r, 440, 94, 70, 44, P.plane, { x: -0.9, y: -0.3 }, 60);
  const gr = L('grass', { depth: 0.55, anim: sway(5, 3.6) });
  tufts(gr, r, 0, 238, W, 32, 90, P.grass);
  return { colors: 64, vignette: night ? [0.5, '0,4,20'] : mood === 'grey' ? [0.45, '20,22,30'] : [0.4, '30,10,20'] };
}
SCENES.cemetery = (c, L) => cemeteryScene(c, L, 'dusk');
SCENES.cemetery_grey = (c, L) => cemeteryScene(c, L, 'grey');
SCENES.cemetery_night = (c, L) => cemeteryScene(c, L, 'night');

// ---------------------------------------------------------------- a harbour in China at dusk: junks with ribbed sails
SCENES.china_dock = (c, L) => {
  const r = rng(51);
  vgrad(c, 0, 0, W, 150, [[0, '#2a2548'], [0.4, '#6a4466'], [0.75, '#c8665a'], [1, '#f2a060']]);
  sun(c, 150, 142, 12, '#ffe6b0', 'rgba(255,150,90,0.6)');
  hill(c, r, 200, 560, 150, 40, '#5a3a5a');
  // a walled city and a pagoda on the far shore
  for (let x = 250; x < 470; x += 14) rect(c, x, 150 - r.r(8, 18), 14, 20, '#4a2e4c');
  rect(c, 380, 104, 12, 46, '#3e2644');
  for (let k = 0; k < 5; k++) poly(c, [[372 + k, 110 + k * 8], [400 - k, 110 + k * 8], [396 - k, 104 + k * 8], [376 + k, 104 + k * 8]], '#2e1c34');
  vgrad(c, 0, 149, W, H - 149, [[0, '#e28a6a'], [0.3, '#7a4a6a'], [1, '#221a34']]);
  reflect(c, 150, 230, { dark: 0.55, tint: [50, 30, 60], wave: 1.8, ripples: 140, rippleCol: '#ffb080', seed: 7 });
  const cl = L('clouds', { depth: 0.05, anim: { type: 'drift', t: 210 } });
  wrapped(cl, 21, (cc, rr) => {
    cloudBand(cc, rr, 40, 40, 260, 10, { body: '#553a66', rim: '#ffa070', shadow: '#40304f', hi: '#ffd8a8' });
    cloudBand(cc, rr, 300, 80, 200, 7, { body: '#7a4a6a', rim: '#ffb080', shadow: '#643a5a', hi: '#ffe0b0' });
  });
  // junks on the water, each rocking on its own
  const junk = (id, x, y, s, d) => {
    const j = L(id, { depth: d, anim: { type: 'bob', a: 0.8 + s * 0.6, r: 0.8, t: r.r(5, 7) } });
    poly(j, [[x - 24 * s, y], [x + 26 * s, y - 2 * s], [x + 20 * s, y + 7 * s], [x - 18 * s, y + 7 * s]], '#2a1a22');
    rect(j, x - 22 * s, y - 1, 46 * s, 1.5 * s, '#c07a5a');
    for (const [mx, mh, mw] of [[-6, 34, 16], [10, 26, 12]]) {
      rect(j, x + mx * s, y - mh * s, Math.max(1, 1.5 * s), mh * s, '#2a1a22');
      poly(j, [[x + mx * s + 1, y - mh * s], [x + (mx + mw) * s, y - (mh - 4) * s], [x + (mx + mw - 2) * s, y - 6 * s], [x + mx * s + 1, y - 5 * s]], '#8a3a30');
      for (let k = 1; k < 6; k++) line(j, x + mx * s + 1, y - mh * s + k * (mh - 5) * s / 6, x + (mx + mw - 1) * s, y - (mh - 4) * s + k * (mh - 10) * s / 6, '#4a1e1e', 1);
    }
  };
  junk('junk1', 90, 186, 1, 0.2);
  junk('junk2', 300, 176, 0.6, 0.15);
  junk('junk3', 200, 200, 1.4, 0.3);
  // the dock in front: planks, bollards, crates, lanterns on poles
  const d = L('dock', { depth: 0.6 });
  poly(d, [[0, 226], [W, 214], [W, H], [0, H]], '#3a2828');
  for (let x = -40; x < W; x += 16) line(d, x, 226 - x * 0.025, x + 30, H, '#2a1c1c', 1);
  rect(d, 0, 222, W, 3, '#6a4a3a');
  for (const x of [40, 180, 330, 450]) { rect(d, x, 210, 7, 16, '#2a1c1c'); ellipse(d, x + 3.5, 210, 5, 2, '#4a3434'); }
  for (const [x, y, w, hh] of [[250, 210, 26, 18], [272, 200, 20, 28], [380, 214, 30, 14]]) { rect(d, x, y, w, hh, '#5a3e2c'); rect(d, x, y, w, 2, '#c8906a'); line(d, x, y, x + w, y + hh, '#3e2a1e', 1); }
  for (const x of [120, 420]) { rect(d, x, 150, 2, 64, '#2a1c1c'); rect(d, x - 4, 150, 10, 2, '#2a1c1c'); ellipse(d, x + 1, 160, 5, 7, '#d8402a'); rect(d, x - 1, 153, 5, 2, '#2a1c1c'); glow(d, x + 1, 160, 16, 'rgba(255,120,70,0.5)'); }
  return { colors: 64, vignette: [0.45, '20,8,20'] };
};

// ---------------------------------------------------------------- Lavilledieu: the town in its valley, the mill on the river
SCENES.lavilledieu = (c, L) => {
  const r = rng(61);
  vgrad(c, 0, 0, W, 140, [[0, '#6f9ad0'], [0.55, '#a9c6e0'], [0.9, '#f2dcc0'], [1, '#ffe8c8']]);
  sun(c, 390, 44, 9, '#fffbe8', 'rgba(255,240,200,0.5)');
  const cl = L('clouds', { depth: 0.05, anim: { type: 'drift', t: 260 } });
  wrapped(cl, 31, (cc, rr) => {
    cumulus(cc, rr, 40, 30, 110, 22, { dark: '#9fb0cc', mid: '#dfe6f0', lit: '#fffaf0', lx: 1 });
    cumulus(cc, rr, 230, 16, 150, 28, { dark: '#9fb0cc', mid: '#dfe6f0', lit: '#fffaf0', lx: 1 });
    cumulus(cc, rr, 400, 54, 90, 16, { dark: '#a8b8d0', mid: '#e4eaf2', lit: '#fffaf0', lx: 1 });
  });
  const far = L('far', { depth: 0.12 });
  hill(far, r, -60, 280, 140, 44, '#7e98b4');
  hill(far, r, 160, 540, 140, 36, '#7490ac');
  hill(far, r, -40, 520, 146, 18, '#6a8a8e', { sharp: 0.4 });
  const g = L('land', { depth: 0.35 });
  vgrad(g, 0, 138, W, H - 138, [[0, '#9ab66a'], [0.4, '#7a9a4a'], [1, '#3a4a24']]);
  hill(g, r, -80, 250, 170, 26, '#8aa85a');
  hill(g, r, 230, 560, 176, 22, '#86a456');
  texture(g, r, 0, 138, W, 132, 0.06, 3);
  // rows of mulberry trees: the town's living
  for (let row = 0; row < 4; row++) for (let i = 0; i < 12; i++) {
    const x = 30 + i * 18 + row * 6, y = 160 + row * 8;
    if (x > 250) continue;
    crown(g, r, x, y, 5 + row, 4 + row * 0.6, ['#3e5a2a', '#5e7e36', '#9ab85a'], { x: 0.6, y: -0.6 }, 8);
  }
  // the river, and the mill with its wheel
  g.fillStyle = '#7fa6c8'; g.beginPath(); g.moveTo(240, 146); g.bezierCurveTo(300, 170, 200, 210, 300, H); g.lineTo(360, H); g.bezierCurveTo(250, 214, 350, 170, 262, 146); g.closePath(); g.fill();
  for (let i = 0; i < 40; i++) rect(g, 250 + r() * 90, 150 + r() * 120, r.r(3, 8), 1, '#c8e0f0');
  frHouse(g, r, 312, 214, 70, 34, { roofH: 18, wall: '#d6c09c', side: 14, chimney: 0.7, windows: [[8, 8, 6, 8, { shutters: '#6a7a5a' }], [22, 8, 6, 8, { shutters: '#6a7a5a' }], [36, 8, 6, 8, { shutters: '#6a7a5a' }], [8, 22, 6, 8, {}], [36, 22, 6, 8, {}]], door: [22, 8, 12] });
  // the town clustered round its church
  for (const [x, yb, w, hh] of [[330, 168, 22, 14], [354, 166, 18, 12], [376, 170, 24, 15], [402, 166, 20, 12], [424, 170, 26, 16], [450, 168, 22, 13], [340, 182, 26, 16], [370, 186, 22, 14], [440, 186, 26, 15]]) {
    frHouse(g, r, x, yb, w, hh, { roofH: 7, windows: [[w * 0.3, 4, 3, 4, { shutters: r.pick(['#5a7a9a', '#7a8a5a', '#8a5a4a']) }]] });
  }
  rect(g, 400, 120, 12, 48, '#d9c7a4'); rect(g, 408, 120, 4, 48, '#b9a37e'); poly(g, [[398, 120], [414, 120], [406, 98]], '#8a3f29'); rect(g, 404, 128, 4, 6, '#3a2a22');
  // poplars along the river
  for (const [i, [x, yb, hh]] of [[238, 176, 50], [228, 196, 60], [290, 150, 34], [212, 226, 74]].entries()) poplar(L(`poplar${i}`, { depth: 0.35, anim: sway(1.4, r.r(4, 6)) }), r, x, yb, hh, { trunk: '#5a4a3a', leaves: ['#3f6a2e', '#6a9a3e', '#c8e08a'] }, 1);
  // the mill wheel, turning in the stream
  const wh = L('wheel', { depth: 0.35, anim: { type: 'spin', t: 14, ox: 0.5, oy: 0.5 } });
  const wx = 302, wy = 212, wr = 14;
  wh.strokeStyle = '#4a3222'; wh.lineWidth = 2; wh.beginPath(); wh.arc(wx, wy, wr, 0, TAU); wh.stroke();
  for (let k = 0; k < 10; k++) { const a = k * TAU / 10; line(wh, wx, wy, wx + Math.cos(a) * wr, wy + Math.sin(a) * wr, '#5a3e28', 1); rect(wh, wx + Math.cos(a) * wr - 1.5, wy + Math.sin(a) * wr - 1.5, 3, 3, '#6a4a30'); }
  circle(wh, wx, wy, 2, '#3a2418');
  const gr = L('grass', { depth: 0.6, anim: sway(5, 3.8) });
  tufts(gr, r, 0, 244, 220, 26, 60, ['#2e3a1c', '#46562a', '#62763a']);
  speckle(gr, r, 0, 244, 220, 26, ['#f4f0e0', '#ffe08a', '#e8a0c0'], 30);
  return { colors: 64, vignette: [0.3, '20,30,20'] };
};
