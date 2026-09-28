/* Outdoor scenes. Each function paints on a 480×270 context. */
/* global W, H, TAU, rng, vgrad, hgrad, rect, px, circle, ellipse, poly, line, glow, shade, vignette, shaft, speckle,
   stars, moon, sun, cloud, cloudBand, cumulus, ridge, hill, treeLine, crown, trunk, branch, tree, poplar, cypress, pine,
   frHouse, window_, jpHouse, reflect, texture, tufts, rock */

globalThis.SCENES = globalThis.SCENES || {};

// The long road east: across the steppe at sunset, birches and a telegraph line.
SCENES.road_east = (c) => {
  const r = rng(11);
  vgrad(c, 0, 0, W, 160, [[0, '#22285a'], [0.3, '#4e4583'], [0.58, '#b0667f'], [0.8, '#ef946a'], [1, '#ffd592']]);
  sun(c, 318, 147, 9, '#fff6d6', 'rgba(255,170,100,0.55)');
  cloudBand(c, r, 10, 30, 200, 9, { body: '#56427c', rim: '#ffae78', shadow: '#40336a', hi: '#ffe1ad' });
  cloudBand(c, r, 250, 20, 240, 11, { body: '#56427c', rim: '#ffae78', shadow: '#40336a', hi: '#ffe1ad' });
  cloudBand(c, r, 110, 66, 180, 7, { body: '#7b5288', rim: '#ffc084', shadow: '#643f78', hi: '#fff0c0' });
  cloudBand(c, r, 330, 92, 160, 6, { body: '#935a86', rim: '#ffd08e', shadow: '#7a4a7a', hi: '#fff4cc' });
  cloudBand(c, r, -20, 108, 150, 5, { body: '#9c5d84', rim: '#ffcf8e', shadow: '#814c78', hi: '#fff4cc' });
  // distant ranges, hazy with the evening
  hill(c, r, -60, 300, 152, 34, '#8b6c99');
  hill(c, r, 170, 540, 152, 24, '#83679a');
  hill(c, r, -40, 520, 154, 12, '#6b5487', { sharp: 0.3 });
  glow(c, 318, 150, 130, 'rgba(255,160,90,0.35)');
  // the steppe, in bands of low rises
  vgrad(c, 0, 152, W, H - 152, [[0, '#c39463'], [0.2, '#9a7447'], [0.55, '#654e33'], [1, '#2c2419']]);
  hill(c, r, -40, 260, 172, 7, '#8a6841', { sharp: 0.4 });
  hill(c, r, 280, 540, 178, 8, '#80613d', { sharp: 0.4 });
  hill(c, r, -60, 200, 206, 12, '#6a5234', { sharp: 0.4 });
  texture(c, r, 0, 152, W, 118, 0.1, 2);
  speckle(c, r, 0, 156, W, 30, ['#d8a870', '#a67f50'], 500);
  // the road, winding off to the sun, with ruts and a puddle full of sky
  const road = (col, inset) => {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(150 + inset, H); c.bezierCurveTo(210 + inset, 225, 350, 205, 300 + inset * 0.3, 180); c.bezierCurveTo(275, 166, 305, 158, 316, 153);
    c.lineTo(320, 153); c.bezierCurveTo(314, 160, 292, 168, 318 - inset * 0.3, 182); c.bezierCurveTo(390, 214, 300, 236, 350 - inset, H);
    c.closePath(); c.fill();
  };
  road('#a4815d', 0);
  road('#c4a07a', 18);
  texture(c, r, 150, 150, 240, 120, 0.12, 2, (cc) => { cc.rect(150, 150, 240, 120); });
  for (let i = 0; i < 2; i++) {
    c.strokeStyle = '#8d6d4d'; c.lineWidth = 1.5; c.beginPath();
    c.moveTo(205 + i * 50, H); c.bezierCurveTo(250 + i * 28, 228, 330 + i * 8, 208, 305 + i * 5, 182); c.stroke();
  }
  ellipse(c, 262, 238, 16, 3, '#f0a878'); ellipse(c, 262, 238, 10, 1.5, '#ffd9a0');
  glow(c, 316, 160, 60, 'rgba(255,200,130,0.5)');
  // telegraph poles marching to the horizon, wires sagging between them
  const poles = [];
  for (let i = 0; i < 10; i++) {
    const t = Math.pow(i / 9, 1.7);
    poles.push([440 - t * 118, 262 - t * 105, 76 * (1 - t) + 7]);
  }
  for (let i = 0; i < poles.length - 1; i++) {
    const [x0, y0, h0] = poles[i], [x1, y1, h1] = poles[i + 1];
    for (const f of [0.95, 0.84]) {
      c.strokeStyle = 'rgba(46,30,40,0.75)'; c.lineWidth = 1; c.beginPath();
      c.moveTo(x0, y0 - h0 * f); c.quadraticCurveTo((x0 + x1) / 2, (y0 - h0 * f + y1 - h1 * f) / 2 + 5 * (1 - i / 10), x1, y1 - h1 * f); c.stroke();
    }
  }
  for (const [x, y, hh] of poles) {
    const w = Math.max(1, hh / 22);
    rect(c, x, y - hh, w, hh, '#3a2828'); rect(c, x - hh * 0.13, y - hh * 0.93, hh * 0.26 + 1, Math.max(1, hh / 40), '#3a2828');
    if (w > 1.5) rect(c, x, y - hh, 1, hh, '#e0906a');
  }
  // birches along the left of the road
  for (let i = 0; i < 8; i++) {
    const t = Math.pow(i / 7, 1.6);
    const x = 30 + t * 230, yb = 270 - t * 112, hh = 160 * (1 - t) + 12;
    const tw = Math.max(1, hh * 0.05);
    rect(c, x, yb - hh * 0.8, tw, hh * 0.8, '#efe6d6');
    if (tw > 2) rect(c, x + tw * 0.6, yb - hh * 0.8, tw * 0.4, hh * 0.8, '#c9a98f');
    for (let k = 0; k < hh * 0.14; k++) rect(c, x, yb - r() * hh * 0.8, Math.max(1, tw * r.r(0.4, 1)), 1, '#3b3533');
    crown(c, r, x + 2, yb - hh * 0.84, hh * 0.22, hh * 0.3, ['#4c5a2c', '#88903a', '#d9b45a', '#ffe79a'], { x: 0.85, y: -0.25 }, 24);
    ellipse(c, x + hh * 0.2, yb, hh * 0.25, hh * 0.03, 'rgba(40,24,20,0.35)');
  }
  // foreground grass and a few wildflowers
  tufts(c, r, 0, 240, 150, 30, 70, ['#2c261b', '#4a3c26', '#6a5530']);
  tufts(c, r, 350, 236, 130, 34, 60, ['#2c261b', '#4a3c26', '#6a5530']);
  speckle(c, r, 0, 225, 150, 40, ['#c8a6e8', '#ffe08a', '#f4b3c6'], 40);
  speckle(c, r, 360, 225, 120, 40, ['#c8a6e8', '#ffe08a', '#f4b3c6'], 30);
  vignette(c, 0.35);
  return { colors: 64 };
};

// A smuggler's boat at night, seen from its own deck: moon, silver sea, a dark coast, no lights.
SCENES.smuggler_boat = (c) => {
  const r = rng(21);
  vgrad(c, 0, 0, W, 142, [[0, '#060b22'], [0.45, '#13224c'], [1, '#3a5687']]);
  stars(c, r, 180, 0, 0, W, 125);
  moon(c, 300, 56, 16, { seed: 4 });
  cloudBand(c, r, 200, 78, 220, 8, { body: '#16244f', rim: '#8fa8dc', shadow: '#101a3c', hi: '#cfe0ff', lightFromBelow: false });
  cloudBand(c, r, -10, 40, 170, 8, { body: '#121f46', rim: '#5d78b0', shadow: '#0d1636', hi: '#a9bff0', lightFromBelow: false });
  cloudBand(c, r, 360, 30, 140, 6, { body: '#121f46', rim: '#6f8ac2', shadow: '#0d1636', hi: '#b9cdf5', lightFromBelow: false });
  // far coasts, fading into the dark
  hill(c, r, -40, 250, 142, 18, '#0d1632');
  hill(c, r, 330, 540, 142, 7, '#0f1a38');
  // the sea
  vgrad(c, 0, 141, W, H - 141, [[0, '#2b4878'], [0.3, '#16284f'], [1, '#060d22']]);
  for (let i = 0; i < 700; i++) {
    const y = 142 + Math.pow(r(), 1.5) * 128;
    const w = 2 + (y - 140) * 0.14 * r();
    c.globalAlpha = r.r(0.2, 0.6);
    rect(c, r() * W, y, w, 1, r() < 0.55 ? '#3f5f96' : '#081330');
  }
  c.globalAlpha = 1;
  // the moon's path on the water
  for (let i = 0; i < 110; i++) {
    const y = 143 + Math.pow(r(), 1.3) * 60;
    const spread = 4 + (y - 142) * 0.55;
    c.globalAlpha = r.r(0.4, 1);
    rect(c, 300 + r.r(-1, 1) * spread, y, r.r(2, 3 + (y - 142) * 0.1), 1, r() < 0.3 ? '#ffffff' : '#bcd0f4');
  }
  c.globalAlpha = 1;
  glow(c, 300, 150, 90, 'rgba(150,180,240,0.25)');
  // the deck, narrowing to the bow; moonlight on the rails
  const bow = [318, 196];
  poly(c, [[0, 232], bow, [W, 246], [W, H], [0, H]], '#241e2e');
  for (let i = -8; i <= 14; i++) line(c, bow[0], bow[1], bow[0] + i * 40, H, i % 3 ? '#1c1725' : '#2e2839', 1);
  shade(c, 300, 214, 120, 'rgba(90,110,170,0.22)');
  // rails
  poly(c, [[0, 224], bow, [0, 234]], '#15111c');
  poly(c, [[W, 236], bow, [W, 248]], '#15111c');
  line(c, 0, 224, bow[0], bow[1], '#8aa2d4', 1); line(c, W, 236, bow[0], bow[1], '#6a82b6', 1);
  for (let i = 1; i < 7; i++) { const t = i / 7; rect(c, bow[0] * t, 224 + (bow[1] - 224) * t, 2, 10 * (1 - t) + 2, '#15111c'); }
  for (let i = 1; i < 5; i++) { const t = i / 5; rect(c, W - (W - bow[0]) * t, 236 + (bow[1] - 236) * t, 2, 12 * (1 - t) + 2, '#15111c'); }
  // the bowsprit and the forestay
  line(c, bow[0], bow[1] - 1, 404, 170, '#2a2233', 2); line(c, bow[0], bow[1] - 2, 404, 169, '#7f97c9', 1);
  line(c, 404, 170, 78, 0, 'rgba(130,150,200,0.5)', 1);
  // the mast, a furled sail along its boom, a lantern kept dark
  rect(c, 70, 0, 7, 236, '#1d1826'); rect(c, 75, 0, 2, 236, '#6d84b6');
  line(c, 73, 150, 250, 205, '#1d1826', 3); line(c, 74, 149, 250, 204, '#6d84b6', 1);
  for (let k = 0; k < 14; k++) { const t = k / 14; ellipse(c, 80 + t * 165, 146 + t * 55, 7, 4, k % 2 ? '#2d2c44' : '#3c3d5c'); }
  line(c, 73, 20, 0, 170, 'rgba(120,140,190,0.45)', 1);
  rect(c, 84, 118, 1, 12, '#15111c'); rect(c, 79, 130, 11, 13, '#15111c'); rect(c, 81, 132, 7, 7, '#2c3350'); rect(c, 78, 129, 13, 2, '#3a3a55');
  // coiled rope, a crate and a barrel on deck
  for (let k = 0; k < 5; k++) ellipse(c, 150, 252 - k * 1.2, 22 - k * 3.6, 5 - k * 0.8, k % 2 ? '#473a37' : '#6b574a');
  rect(c, 372, 224, 40, 30, '#2c2231'); rect(c, 372, 224, 40, 2, '#7a8fbe'); rect(c, 372, 238, 40, 1, '#1c1621'); rect(c, 390, 224, 1, 30, '#1c1621');
  ellipse(c, 432, 246, 16, 20, '#2a2030'); rect(c, 416, 238, 32, 2, '#48405a'); rect(c, 416, 252, 32, 2, '#48405a'); rect(c, 443, 228, 2, 36, '#7a8fbe');
  vignette(c, 0.5);
  return { colors: 56 };
};

// The west coast of Japan at first light: pines on the rocks, a fishing village.
SCENES.japan_coast = (c) => {
  const r = rng(31);
  vgrad(c, 0, 0, W, 150, [[0, '#131942'], [0.42, '#433a78'], [0.72, '#b3687e'], [0.9, '#f0a076'], [1, '#ffd49c']]);
  stars(c, r, 80, 0, 0, W, 70);
  moon(c, 64, 38, 8, { seed: 9, halo: 'rgba(170,190,255,0.25)' });
  cloudBand(c, r, 180, 56, 230, 8, { body: '#5e4a82', rim: '#ffb294', shadow: '#4a3b72', hi: '#ffe0c0' });
  cloudBand(c, r, 320, 96, 170, 6, { body: '#8a5a86', rim: '#ffc79a', shadow: '#744c7c', hi: '#fff0d0' });
  cloudBand(c, r, 60, 86, 130, 5, { body: '#6e4f82', rim: '#ffb294', shadow: '#5b4376', hi: '#ffe0c0' });
  glow(c, 410, 150, 170, 'rgba(255,170,110,0.45)');
  // mountains behind the village, with mist lying in their folds
  hill(c, r, 160, 560, 150, 58, '#56467f');
  hill(c, r, 230, 520, 150, 34, '#443a6e', { sharp: 0.6 });
  vgrad(c, 180, 132, 300, 18, [[0, 'rgba(255,200,190,0)'], [1, 'rgba(255,200,190,0.35)']]);
  // the sea, holding the sky
  vgrad(c, 0, 149, W, 70, [[0, '#e7a07e'], [0.2, '#8a6488'], [1, '#2b3163']]);
  reflect(c, 150, 212, { dark: 0.55, tint: [40, 44, 90], wave: 1.5, ripples: 110, rippleCol: '#f3b690', seed: 5 });
  // the village on its low bank, in two rows with trees between; a pier
  poly(c, [[222, 192], [236, 180], [480, 176], [480, 196], [222, 198]], '#3a3150');
  for (const [x, yb, w, hh, rh] of [[262, 178, 22, 8, 7], [300, 177, 30, 10, 9], [352, 176, 22, 8, 7], [398, 175, 34, 11, 10], [446, 176, 26, 9, 8]]) {
    jpHouse(c, r, x, yb, w, hh, { roof: '#262a40', roofLight: '#6f6a92', plaster: '#9d8aa0', wood: '#2a2233', roofH: rh, windows: [[w * 0.35, 3, 4, 4, r() < 0.5]] });
  }
  pine(c, r, 290, 184, 22, { trunk: '#1a1522', leaves: ['#1d2a34', '#324a52', '#e8a07e'] }, 1);
  pine(c, r, 388, 182, 20, { trunk: '#1a1522', leaves: ['#1d2a34', '#324a52', '#e8a07e'] }, -1);
  for (const [x, yb, w, hh, rh] of [[240, 194, 36, 13, 12], [318, 193, 30, 12, 10], [364, 194, 40, 14, 13], [426, 193, 32, 12, 11]]) {
    jpHouse(c, r, x, yb, w, hh, { roof: '#2c2f45', roofLight: '#9a8db4', plaster: '#c9aebb', wood: '#2a2233', roofH: rh, windows: [[w * 0.2, 4, 6, 5, r() < 0.7], [w * 0.62, 4, 6, 5, r() < 0.4]] });
  }
  for (let x = 236; x < 300; x += 9) rect(c, x, 197, 1, 12, '#2a2233');
  rect(c, 232, 197, 70, 2, '#4a3c52'); rect(c, 232, 197, 70, 1, '#c79a92');
  // beach, wet sand holding the dawn, foam
  vgrad(c, 0, 196, W, H - 196, [[0, '#f0b8a0'], [0.12, '#c99a94'], [0.5, '#8a6f7c'], [1, '#43374c']]);
  texture(c, r, 0, 196, W, 74, 0.06, 3);
  speckle(c, r, 0, 204, W, 66, ['#b0909a', '#7e6b80', '#e3c3b8'], 700);
  for (let i = 0; i < 4; i++) { c.globalAlpha = 0.7 - i * 0.12; c.fillStyle = '#fbe6dc'; c.beginPath(); c.moveTo(0, 197 + i * 4); for (let x = 0; x <= W; x += 8) c.lineTo(x, 197 + i * 4 + Math.sin(x * 0.05 + i) * 1.2); c.lineTo(W, 198 + i * 4); c.lineTo(0, 198 + i * 4); c.fill(); }
  c.globalAlpha = 1;
  for (const [x, y, w] of [[300, 214, 34], [352, 222, 28], [262, 230, 26]]) {
    poly(c, [[x, y], [x + w, y - 2], [x + w - 4, y + 6], [x + 4, y + 6]], '#3a2c34');
    line(c, x + 2, y, x + w - 2, y - 2, '#c79a92', 1);
    ellipse(c, x + w / 2, y + 8, w * 0.55, 2, 'rgba(40,30,50,0.4)');
  }
  // nets drying on poles
  for (let i = 0; i < 3; i++) rect(c, 400 + i * 22, 200, 1, 22, '#3a2c34');
  for (let y = 202; y < 216; y += 2) line(c, 400, y, 444, y + 1, 'rgba(60,50,70,0.6)', 1);
  // the rocky headland, its pines catching the dawn
  poly(c, [[0, 118], [36, 110], [84, 124], [130, 146], [168, 170], [196, 196], [180, 226], [0, 238]], '#26223c');
  rock(c, r, 104, 140, 72, 54, { dark: '#26223c', mid: '#3e375c', lit: '#c08a90' });
  rock(c, r, 10, 112, 96, 52, { dark: '#26223c', mid: '#3c3659', lit: '#b08292' });
  rock(c, r, 40, 160, 80, 60, { dark: '#221f36', mid: '#37315a', lit: '#8f6f88' });
  rock(c, r, 150, 190, 40, 28, { dark: '#1f1c33', mid: '#352f50', lit: '#a97c8c' });
  rock(c, r, 192, 204, 22, 12, { dark: '#1f1c33', mid: '#352f50', lit: '#c3918f' });
  for (let i = 0; i < 3; i++) { c.globalAlpha = 0.8; ellipse(c, 200 - i * 14, 216 + i * 6, 13, 1.5, '#fbe6dc'); }
  c.globalAlpha = 1;
  pine(c, r, 64, 110, 100, { trunk: '#1a1522', leaves: ['#17262c', '#2b4a4a', '#f0a888'] }, 1);
  pine(c, r, 138, 142, 62, { trunk: '#1a1522', leaves: ['#17262c', '#2b4a4a', '#f0a888'] }, 1);
  // a small stone lantern on the rocks
  rect(c, 176, 166, 7, 3, '#4c4560'); rect(c, 177, 169, 5, 6, '#3a3350'); rect(c, 178, 170, 3, 3, '#ffcf80'); rect(c, 175, 165, 9, 1, '#6d6590'); rect(c, 178, 175, 3, 6, '#3a3350');
  glow(c, 179, 171, 9, 'rgba(255,190,110,0.6)');
  vignette(c, 0.35);
  return { colors: 64 };
};

// The cemetery at Lavilledieu at dusk: cypresses, crosses, the church beyond.
SCENES.cemetery = (c) => {
  const r = rng(41);
  vgrad(c, 0, 0, W, 172, [[0, '#2b2654'], [0.38, '#794f7a'], [0.68, '#d9806e'], [0.88, '#f6b26f'], [1, '#ffe0a0']]);
  sun(c, 132, 164, 11, '#fff2c8', 'rgba(255,170,100,0.6)');
  cloudBand(c, r, 170, 36, 240, 10, { body: '#5e3f6e', rim: '#ffac80', shadow: '#4a3160', hi: '#ffe0b0' });
  cloudBand(c, r, 0, 78, 170, 7, { body: '#8a5076', rim: '#ffbe88', shadow: '#733f6a', hi: '#fff0c8' });
  cloudBand(c, r, 330, 104, 150, 5, { body: '#a45a74', rim: '#ffcc90', shadow: '#8c4a6a', hi: '#fff0c8' });
  // hills, the village and its church
  hill(c, r, -60, 300, 170, 30, '#8f607c');
  hill(c, r, 200, 540, 170, 22, '#7d5470');
  hill(c, r, -40, 520, 174, 8, '#6a4868', { sharp: 0.3 });
  treeLine(c, r, 172, 150, 290, 5, ['#4d3a4a', '#6b4f5e']);
  for (const [x, w, hh] of [[296, 22, 12], [322, 18, 10], [424, 20, 11], [446, 26, 13]]) frHouse(c, r, x, 173, w, hh, { wall: '#a8747e', wallDark: '#80586a', wallLight: '#c08a92', roof: '#7a3f4e', roofDark: '#5e2f3e', roofH: 6, windows: [[w * 0.35, 3, 3, 4, { lit: r() < 0.7, frame: '#5e3a48' }]] });
  rect(c, 346, 146, 52, 27, '#865c6e'); poly(c, [[342, 146], [402, 146], [394, 134], [350, 134]], '#5e2f3e');
  for (let i = 0; i < 3; i++) window_(c, 354 + i * 12, 152, 3, 7, { lit: true, frame: '#5e3a48' });
  rect(c, 384, 100, 16, 73, '#946676'); rect(c, 396, 100, 4, 73, '#7a5262'); poly(c, [[381, 100], [403, 100], [392, 74]], '#5e2f3e');
  rect(c, 389, 110, 6, 8, '#2e1f2a'); rect(c, 391, 112, 2, 4, '#ffcf80'); glow(c, 392, 114, 12, 'rgba(255,190,110,0.5)');
  rect(c, 391, 68, 1, 7, '#5e2f3e'); rect(c, 389, 70, 5, 1, '#5e2f3e');
  // the ground, warm in the last light, with long shadows
  vgrad(c, 0, 172, W, H - 172, [[0, '#a08c50'], [0.3, '#727040'], [1, '#2a2a1c']]);
  texture(c, r, 0, 172, W, 98, 0.12, 2);
  speckle(c, r, 0, 174, W, 96, ['#b8a05a', '#7d7640', '#5a5530', '#d4b870'], 1400);
  // a gravel path up to her grave
  poly(c, [[196, H], [228, 232], [252, 232], [296, H]], '#a8927a');
  texture(c, r, 196, 232, 100, 38, 0.18, 2, (cc) => { cc.moveTo(196, H); cc.lineTo(228, 232); cc.lineTo(252, 232); cc.lineTo(296, H); });
  c.globalAlpha = 0.32;
  for (let i = 0; i < 9; i++) { const y = 186 + r() * 70; poly(c, [[r() * 200 + 150, y], [W, y + 8 + r() * 20], [W, y + 12 + r() * 22]], '#2b2438'); }
  c.globalAlpha = 1;
  // the low stone wall and its iron gate
  rect(c, 0, 176, W, 9, '#8b7f7a'); rect(c, 0, 176, W, 2, '#d8bda2'); texture(c, r, 0, 178, W, 7, 0.2, 2);
  rect(c, 58, 158, 6, 27, '#7a6f6a'); rect(c, 58, 158, 2, 27, '#d8bda2'); rect(c, 100, 158, 6, 27, '#7a6f6a'); rect(c, 100, 158, 2, 27, '#d8bda2');
  for (let x = 66; x < 100; x += 4) { rect(c, x, 162, 1, 23, '#2c2430'); px(c, x, 161, '#2c2430'); }
  rect(c, 64, 166, 36, 1, '#2c2430'); rect(c, 64, 176, 36, 1, '#2c2430');
  // a small family chapel for depth
  rect(c, 140, 170, 26, 18, '#9c8c86'); rect(c, 140, 170, 8, 18, '#e0bfa0'); poly(c, [[137, 170], [169, 170], [153, 158]], '#6e5a5c'); rect(c, 150, 177, 6, 11, '#3a2c34');
  // cypresses
  for (const [x, yb, hh] of [[20, 192, 134], [44, 188, 98], [452, 194, 142], [426, 188, 92]]) cypress(c, r, x, yb, hh, ['#1e2a22', '#3d4c2c']);
  // an old plane tree leaning in from the right
  trunk(c, 468, 250, 120, 16, 9, '#5b4a3e', '#3f332c');
  branch(c, 466, 150, 420, 110, 5, '#4f4036');
  crown(c, r, 440, 94, 70, 44, ['#2e3a24', '#5b6b2e', '#c8a14c', '#ffd98a'], { x: -0.9, y: -0.3 }, 60);
  // graves in rows, lit on the sunward side
  const grave = (x, yb, s, kind) => {
    const st = '#a0968e', lit = '#f0cfa2', dark = '#5e5660';
    ellipse(c, x + s * 1.1, yb, s * 1.4, s * 0.22, 'rgba(40,30,50,0.45)');
    if (kind === 0) {
      rect(c, x - s * 0.5, yb - s * 1.5, s, s * 1.5, st); ellipse(c, x, yb - s * 1.5, s * 0.5, s * 0.34, st);
      rect(c, x - s * 0.5, yb - s * 1.5, s * 0.3, s * 1.5, lit); rect(c, x + s * 0.3, yb - s * 1.5, s * 0.2, s * 1.5, dark);
    } else if (kind === 1) {
      rect(c, x - s * 0.13, yb - s * 2.1, s * 0.26 + 1, s * 2.1, st); rect(c, x - s * 0.55, yb - s * 1.55, s * 1.1, s * 0.26 + 1, st);
      rect(c, x - s * 0.13, yb - s * 2.1, 1, s * 2.1, lit); rect(c, x - s * 0.55, yb - s * 1.55, s * 1.1, 1, lit);
    } else {
      rect(c, x - s * 0.8, yb - s * 0.5, s * 1.6, s * 0.5, st); rect(c, x - s * 0.8, yb - s * 0.5, s * 1.6, 1, lit);
      rect(c, x - s * 0.1, yb - s * 1.4, s * 0.2 + 1, s * 0.9, '#3a3440'); rect(c, x - s * 0.45, yb - s * 1.15, s * 0.9, 1, '#3a3440');
    }
  };
  for (const [y, s, n] of [[194, 4, 13], [208, 6, 10], [226, 9, 7], [252, 13, 5]]) {
    for (let i = 0; i < n; i++) {
      const x = 40 + (i + 0.5) * ((W - 80) / n) + r.r(-8, 8);
      if (y > 220 && x > 170 && x < 320) continue;
      grave(x, y + r.r(-2, 2), s, r.i(0, 2));
    }
  }
  // her grave, with fresh flowers and a small lantern
  grave(240, 238, 12, 0);
  for (let i = 0; i < 34; i++) px(c, 226 + r() * 28, 236 + r() * 5, r.pick(['#f4a7b9', '#ffffff', '#e27a9a', '#ffd0dc']));
  for (let i = 0; i < 16; i++) px(c, 226 + r() * 28, 238 + r() * 4, '#4e6b35');
  rect(c, 256, 230, 5, 7, '#3a3036'); rect(c, 257, 231, 3, 4, '#ffcf80'); rect(c, 255, 229, 7, 1, '#5a4c52');
  glow(c, 258, 233, 10, 'rgba(255,190,110,0.6)');
  tufts(c, r, 0, 238, W, 32, 90, ['#3a3a22', '#56562e', '#77703c']);
  vignette(c, 0.4);
  return { colors: 64 };
};
