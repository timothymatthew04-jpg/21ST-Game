/* More outdoor scenes: the garden, the aviary, the burned village and the forest camp. */
/* global W, H, TAU, rng, vgrad, hgrad, rect, px, circle, ellipse, poly, line, glow, shade, vignette, shaft, speckle,
   stars, moon, sun, cloud, cloudBand, cumulus, ridge, hill, treeLine, crown, trunk, branch, tree, poplar, cypress, pine,
   frHouse, window_, jpHouse, reflect, texture, tufts, rock */

globalThis.SCENES = globalThis.SCENES || {};

// The garden Hervé made for Hélène, in the golden hour: paths, a pond, young trees.
SCENES.helene_garden = (c) => {
  const r = rng(101);
  vgrad(c, 0, 0, W, 132, [[0, '#56639f'], [0.4, '#b98aa6'], [0.75, '#f3b98a'], [1, '#ffe4ae']]);
  sun(c, 392, 112, 10, '#fff6d6', 'rgba(255,190,120,0.55)');
  cloudBand(c, r, 40, 30, 200, 8, { body: '#8a76a6', rim: '#ffc79a', shadow: '#76629a', hi: '#fff0d0' });
  cloudBand(c, r, 260, 60, 190, 6, { body: '#a47ea0', rim: '#ffd0a0', shadow: '#906c94', hi: '#fff4d6' });
  // hills and poplars of the valley
  hill(c, r, -40, 300, 132, 26, '#8b8a9e');
  hill(c, r, 180, 540, 132, 20, '#94869e');
  for (let i = 0; i < 12; i++) poplar(c, r, 180 + i * 26 + r.r(-6, 6), 134, r.r(26, 40), { trunk: '#5a4a4a', leaves: ['#5f6e56', '#8a9460', '#f0d08a'] }, 1);
  vgrad(c, 0, 128, W, 10, [[0, 'rgba(255,220,170,0)'], [1, 'rgba(255,220,170,0.4)']]);
  // the lawn
  vgrad(c, 0, 134, W, H - 134, [[0, '#a9b25e'], [0.3, '#7d9448'], [1, '#34401f']]);
  texture(c, r, 0, 134, W, 136, 0.07, 3);
  // the house at the left, its windows lit, roses on a trellis
  frHouse(c, r, 10, 170, 120, 62, { roofH: 26, chimney: 0.7, side: 26, windows: [[16, 16, 10, 14, { lit: true, shutters: '#5a7a8a' }], [48, 16, 10, 14, { lit: true, shutters: '#5a7a8a' }], [16, 40, 10, 14, { shutters: '#5a7a8a' }], [72, 40, 10, 14, { lit: true, shutters: '#5a7a8a' }]], door: [48, 12, 20] });
  glow(c, 120, 150, 60, 'rgba(255,200,130,0.3)');
  for (let i = 0; i < 40; i++) { const x = 92 + r() * 34, y = 118 + r() * 50; px(c, x, y, r() < 0.5 ? '#3f5a2a' : r.pick(['#f4a7b9', '#e27a9a', '#ffd0dc'])); }
  // the garden wall and a gate at the back
  rect(c, 130, 150, W - 130, 10, '#c9ae8a'); rect(c, 130, 150, W - 130, 2, '#f0d6aa'); texture(c, r, 130, 152, W - 130, 8, 0.15, 2);
  // the gravel path curving from the front to the house door
  c.fillStyle = '#d8c2a0'; c.beginPath(); c.moveTo(150, H); c.bezierCurveTo(170, 230, 90, 200, 60, 172); c.lineTo(72, 172); c.bezierCurveTo(118, 198, 214, 228, 222, H); c.closePath(); c.fill();
  texture(c, r, 50, 170, 180, 100, 0.12, 2, (cc) => { cc.moveTo(150, H); cc.bezierCurveTo(170, 230, 90, 200, 60, 172); cc.lineTo(72, 172); cc.bezierCurveTo(118, 198, 214, 228, 222, H); });
  // the pond, holding the sky
  c.save(); c.beginPath(); c.ellipse(320, 196, 84, 20, 0, 0, TAU); c.clip();
  vgrad(c, 236, 176, 170, 40, [[0, '#ffe0a8'], [0.4, '#d99aa8'], [1, '#5a6aa0']]);
  for (let i = 0; i < 40; i++) { c.globalAlpha = 0.5; rect(c, 240 + r() * 160, 180 + r() * 34, r.r(4, 12), 1, '#fff0c8'); }
  c.globalAlpha = 1;
  for (let i = 0; i < 6; i++) { ellipse(c, 270 + r() * 100, 190 + r() * 16, 5, 1.8, '#4f7a3a'); if (r() < 0.5) px(c, 272 + r() * 100, 190 + r() * 16, '#f4c0d0'); }
  c.restore();
  c.strokeStyle = '#8a7a5a'; c.lineWidth = 2; c.beginPath(); c.ellipse(320, 196, 84, 20, 0, 0, TAU); c.stroke();
  for (let i = 0; i < 20; i++) { const a = r() * TAU; rock(c, r, 320 + Math.cos(a) * 84 - 4, 196 + Math.sin(a) * 20 - 3, 8, 5, { dark: '#6a6050', mid: '#9a8c74', lit: '#e8d0a8' }); }
  // young trees on stakes, a bench under the old lime tree
  for (const [x, yb, hh] of [[250, 170, 40], [390, 168, 44], [440, 178, 50], [210, 176, 36]]) {
    rect(c, x + 3, yb - hh * 0.6, 1, hh * 0.6, '#8a6a4a');
    tree(c, r, x, yb, hh, { trunk: '#6a5040', trunkDark: '#4a3a30', leaves: ['#4a6a2e', '#7a9a3e', '#d8c46a', '#fff0a0'] }, { light: { x: 0.9, y: -0.4 }, wide: 0.34, n: 20 });
    ellipse(c, x - 8, yb, hh * 0.35, 3, 'rgba(40,50,20,0.35)');
  }
  tree(c, r, 186, 188, 110, { trunk: '#5a4636', trunkDark: '#3e3026', leaves: ['#3a5226', '#6a8a36', '#d8c46a', '#fff0a0'] }, { light: { x: 0.9, y: -0.3 }, wide: 0.5 });
  rect(c, 150, 184, 40, 4, '#7a5234'); rect(c, 150, 176, 40, 3, '#8a6240'); rect(c, 152, 188, 3, 10, '#5a3a24'); rect(c, 185, 188, 3, 10, '#5a3a24');
  // beds of lavender and roses in the foreground
  for (let row = 0; row < 3; row++) for (let x = 250 + row * 8; x < W; x += 6) { const y = 226 + row * 12; ellipse(c, x, y, 4, 6, '#5a4a7a'); for (let k = 0; k < 4; k++) px(c, x + r.r(-2, 2), y - 5 + r.r(-2, 2), r.pick(['#a88ad8', '#c8a8f0', '#8a6ac0'])); }
  for (let i = 0; i < 12; i++) { const x = r() * 130, y = 222 + r() * 40; crown(c, r, x, y, 10, 7, ['#2e4a22', '#4a6a2e', '#6a8a3e'], { x: 0.8, y: -0.6 }, 10); for (let k = 0; k < 6; k++) circle(c, x + r.r(-7, 7), y + r.r(-5, 3), 1.5, r.pick(['#f4a7b9', '#e27a9a', '#fff0f4'])); }
  tufts(c, r, 0, 244, W, 26, 80, ['#2a3a1a', '#3e5226', '#5a6a2e']);
  shade(c, 470, 110, 260, 'rgba(255,190,120,0.16)');
  vignette(c, 0.35);
  return { colors: 64 };
};

// The aviary behind Hara Kei's house: a cage of wood and paper taller than a house.
SCENES.aviary = (c) => {
  const r = rng(111);
  vgrad(c, 0, 0, W, 150, [[0, '#6f8fc4'], [0.5, '#b8c4d8'], [0.85, '#f1d8a8'], [1, '#ffe4b0']]);
  sun(c, 90, 40, 9, '#fffbe6', 'rgba(255,230,170,0.5)');
  cumulus(c, r, 250, 34, 150, 30, { dark: '#9aa2c4', mid: '#d6d6e6', lit: '#fff6e6', lx: -1 });
  // mountains and the maples of the estate
  hill(c, r, -40, 300, 150, 60, '#8c96b8');
  hill(c, r, 200, 540, 150, 44, '#7e88ac');
  for (let i = 0; i < 16; i++) crown(c, r, i * 32 + r.r(-8, 8), 150 - r.r(0, 16), r.r(16, 24), r.r(12, 18), ['#8a3a26', '#c9582e', '#f09a44', '#ffd07a'], { x: -0.8, y: -0.6 }, 16);
  vgrad(c, 0, 146, W, H - 146, [[0, '#6f7e44'], [0.4, '#4f5e32'], [1, '#232a18']]);
  texture(c, r, 0, 146, W, 124, 0.07, 3);
  // the corner of Hara Kei's house at the left
  jpHouse(c, r, -30, 196, 120, 56, { roof: '#2f3444', roofLight: '#6a7690', plaster: '#e6ddc8', wood: '#3a2a22', roofH: 34, windows: [[40, 12, 22, 26, false], [74, 12, 22, 26, false]] });
  // the aviary: a tall lattice cage under a curved roof, paper panels round its base
  const ax = 170, aw = 170, top = 60, base = 204;
  vgrad(c, ax, top, aw, base - top, [[0, '#3c4a30'], [1, '#26301e']]);
  for (let i = 0; i < 6; i++) { branch(c, ax + 10 + i * 28, base - 40, ax + 20 + i * 26, base - 110 + r() * 30, 3, '#3a2a1e'); crown(c, r, ax + 24 + i * 26, base - 110 + r() * 20, 14, 8, ['#2e4a26', '#4a6a2e', '#8aa04a'], { x: -0.7, y: -0.6 }, 10); }
  for (let k = 0; k < 16; k++) { const bx = ax + 14 + r() * (aw - 28), by = top + 30 + r() * 90; rect(c, bx, by, 3, 2, r.pick(['#f2d15a', '#e2553f', '#6fb7e8', '#f4f1ea', '#9bd46a'])); px(c, bx + 2, by - 1, '#2a2a2a'); }
  shaft(c, [[ax, top], [ax + 60, top], [ax + 120, base], [ax + 40, base]], 'rgba(255,240,200,1)', 0.18);
  for (let x = ax; x <= ax + aw; x += 10) rect(c, x, top, 2, base - top, '#6a4a30');
  for (let y = top + 8; y < base; y += 12) rect(c, ax, y, aw, 1, '#7a5a3a');
  for (let x = ax; x <= ax + aw; x += 10) rect(c, x, top, 1, base - top, '#a8805a');
  rect(c, ax - 2, base - 30, aw + 4, 30, '#efe6d0');
  for (let x = ax; x <= ax + aw; x += 14) rect(c, x, base - 30, 2, 30, '#5a3a24');
  for (let y = base - 22; y < base; y += 8) rect(c, ax, y, aw, 1, '#8a6a4a');
  rect(c, ax - 4, base - 2, aw + 8, 4, '#3a2a1e');
  poly(c, [[ax - 26, top + 4], [ax - 16, top - 4], [ax + 30, top - 34], [ax + aw - 30, top - 34], [ax + aw + 16, top - 4], [ax + aw + 26, top + 4]], '#2f3444');
  for (let k = 0; k < 5; k++) line(c, ax - 18 + k * 5, top - 2 - k * 6, ax + aw + 18 - k * 5, top - 2 - k * 6, '#6a7690', 1);
  rect(c, ax + 26, top - 38, aw - 52, 4, '#6a7690');
  rect(c, ax - 20, top + 2, aw + 40, 3, '#1f2230');
  glow(c, ax + aw / 2, top - 30, 50, 'rgba(255,230,170,0.25)');
  // a stepping-stone path, stone lanterns, fallen maple leaves
  for (let i = 0; i < 7; i++) { const t = i / 6; ellipse(c, 250 - t * 20 + r.r(-6, 6), 266 - t * 58, 14 - t * 8, 5 - t * 2.5, '#9c9486'); ellipse(c, 250 - t * 20, 264 - t * 58, 10 - t * 6, 2, '#c8c0b0'); }
  for (const [x, y, s] of [[130, 214, 1], [390, 214, 1], [440, 250, 1.4]]) {
    rect(c, x - 3 * s, y - 20 * s, 6 * s, 20 * s, '#8a8478'); rect(c, x - 7 * s, y - 24 * s, 14 * s, 4 * s, '#9c968a'); rect(c, x - 5 * s, y - 32 * s, 10 * s, 8 * s, '#7a7468');
    rect(c, x - 3 * s, y - 30 * s, 6 * s, 4 * s, '#2a2620'); poly(c, [[x - 9 * s, y - 32 * s], [x + 9 * s, y - 32 * s], [x, y - 40 * s]], '#6a6458');
  }
  for (let i = 0; i < 140; i++) px(c, r() * W, 200 + r() * 70, r.pick(['#c9582e', '#f09a44', '#8a3a26', '#ffd07a']));
  for (const [x, yb, hh] of [[440, 196, 120], [36, 250, 80]]) {
    trunk(c, x, yb, hh * 0.5, 8, 5, '#3a2a22', '#2a1e18');
    crown(c, r, x, yb - hh * 0.6, hh * 0.5, hh * 0.32, ['#7a2e20', '#b84a28', '#ec8a3a', '#ffc870'], { x: -0.8, y: -0.5 }, 40);
  }
  tufts(c, r, 0, 240, W, 30, 60, ['#1f2a14', '#34421e', '#4f5e2e']);
  vignette(c, 0.35);
  return { colors: 64 };
};

// What was left of the village: charred frames, smoke, a sky red with fire.
SCENES.burned_village = (c) => {
  const r = rng(121);
  vgrad(c, 0, 0, W, 160, [[0, '#1e1418'], [0.35, '#4a1e1e'], [0.7, '#a8401e'], [0.9, '#e87a2e'], [1, '#ffb050']]);
  cloudBand(c, r, -20, 30, 260, 16, { body: '#2e1c1c', rim: '#c85a28', shadow: '#1e1214', hi: '#ff9a4a' });
  cloudBand(c, r, 200, 56, 300, 14, { body: '#3a2020', rim: '#e0702e', shadow: '#2a1818', hi: '#ffb060' });
  cloudBand(c, r, 60, 96, 220, 10, { body: '#5a2a22', rim: '#ff9a44', shadow: '#442020', hi: '#ffd080' });
  hill(c, r, -40, 300, 160, 40, '#2e1a1c');
  hill(c, r, 180, 540, 160, 30, '#26161a');
  glow(c, 240, 160, 200, 'rgba(255,120,40,0.35)');
  // scorched ground, ash and embers
  vgrad(c, 0, 158, W, H - 158, [[0, '#4a2a22'], [0.3, '#34201c'], [1, '#140c0c']]);
  texture(c, r, 0, 158, W, 112, 0.05, 4);
  speckle(c, r, 0, 160, W, 110, ['#5a4a46', '#3a2a26'], 260);
  for (let i = 0; i < 14; i++) ellipse(c, r() * W, 200 + r() * 70, r.r(10, 30), r.r(2, 4), 'rgba(20,10,10,0.35)');
  // the ruined houses: black posts, broken beams, the fallen roofs smouldering
  const ruin = (x, yb, w, hh) => {
    poly(c, [[x - 6, yb], [x + w * 0.2, yb - hh * 0.4], [x + w * 0.5, yb - hh * 0.25], [x + w * 0.75, yb - hh * 0.5], [x + w + 8, yb]], '#1a1010');
    for (let k = 0; k < 5; k++) {
      const px_ = x + (k / 4) * w, ph = hh * r.r(0.4, 1.05);
      rect(c, px_, yb - ph, 3, ph, '#140c0c'); rect(c, px_ + 2, yb - ph, 1, ph, '#8a3a1e');
      if (r() < 0.7) px(c, px_ + 1, yb - ph, '#ff9a3c');
    }
    line(c, x, yb - hh * 0.9, x + w * 0.6, yb - hh * r.r(0.4, 0.8), '#140c0c', 3);
    line(c, x + w * 0.3, yb - hh * 0.8, x + w, yb - hh * 0.3, '#140c0c', 2);
    for (let k = 0; k < 16; k++) px(c, x + r() * w, yb - r() * hh * 0.35, r.pick(['#ff9a3c', '#ffcf70', '#d8482a']));
    glow(c, x + w / 2, yb - 4, w * 0.8, 'rgba(255,110,40,0.4)');
  };
  ruin(40, 196, 80, 60); ruin(300, 190, 70, 52); ruin(390, 206, 90, 70); ruin(170, 176, 50, 36); ruin(250, 172, 40, 30);
  // a torii still standing, blackened
  rect(c, 214, 116, 4, 64, '#1a0e0e'); rect(c, 250, 116, 4, 64, '#1a0e0e'); poly(c, [[204, 118], [264, 118], [268, 112], [200, 112]], '#1a0e0e'); rect(c, 208, 126, 52, 3, '#1a0e0e');
  line(c, 204, 112, 268, 112, '#9a3a1e', 1);
  // dead trees
  for (const [x, yb, hh] of [[140, 200, 90], [456, 190, 110], [10, 214, 120]]) {
    trunk(c, x, yb, hh, 7, 3, '#1a1010');
    for (let k = 0; k < 6; k++) branch(c, x, yb - hh * r.r(0.4, 0.95), x + r.r(-30, 30), yb - hh * r.r(0.8, 1.2), 2, '#1a1010');
  }
  // debris: a cart wheel, broken tiles
  c.strokeStyle = '#1a1010'; c.lineWidth = 2; c.beginPath(); c.arc(300, 236, 12, 0, TAU); c.stroke();
  for (let k = 0; k < 6; k++) line(c, 300, 236, 300 + Math.cos(k) * 12, 236 + Math.sin(k) * 12, '#1a1010', 1);
  for (let i = 0; i < 30; i++) rect(c, r() * W, 220 + r() * 50, r.i(2, 4), 1, '#3a2a2a');
  vignette(c, 0.55, '10,0,0');
  return { colors: 60 };
};

// Hara Kei's camp in the forest at night: cedars, a fire, a few tents.
SCENES.forest_camp_night = (c) => {
  const r = rng(131);
  vgrad(c, 0, 0, W, H, [[0, '#0a1024'], [0.5, '#132040'], [1, '#0a0f1e']]);
  stars(c, r, 40, 120, 0, 240, 50);
  moon(c, 300, 26, 9, { seed: 6, halo: 'rgba(150,180,240,0.3)' });
  // layers of cedar trunks, pale in the mist far away, dark close by
  const trunks = (n, y0, w0, col, lit) => {
    for (let i = 0; i < n; i++) {
      const x = r() * W, w = w0 * r.r(0.7, 1.3);
      rect(c, x, 0, w, y0, col);
      if (lit) rect(c, x + w - Math.max(1, w * 0.2), 0, Math.max(1, w * 0.2), y0, lit);
    }
  };
  trunks(26, 200, 5, '#2a3a5a', '#3e5278');
  vgrad(c, 0, 120, W, 90, [[0, 'rgba(120,150,200,0)'], [1, 'rgba(120,150,200,0.35)']]);
  trunks(14, 214, 10, '#18223a', '#2e4064');
  for (let i = 0; i < 26; i++) crown(c, r, r() * W, r.r(-10, 40), r.r(30, 50), r.r(14, 24), ['#0c1428', '#142038', '#1e2e4e'], { x: 0.2, y: 1 }, 14);
  // moonlight through the canopy
  shaft(c, [[270, 0], [300, 0], [260, 230], [200, 230]], 'rgba(170,200,255,1)', 0.14);
  shaft(c, [[340, 0], [356, 0], [330, 220], [300, 220]], 'rgba(170,200,255,1)', 0.1);
  // the forest floor
  vgrad(c, 0, 196, W, H - 196, [[0, '#1a2430'], [0.4, '#141a22'], [1, '#080a10']]);
  texture(c, r, 0, 196, W, 74, 0.08, 3);
  // two great cedars framing the camp
  for (const [x, w] of [[26, 34], [430, 40]]) {
    rect(c, x - w / 2, 0, w, 250, '#0e1220');
    for (let k = 0; k < 20; k++) rect(c, x - w / 2 + r() * w, r() * 240, 1, r.r(8, 30), '#1a2236');
    poly(c, [[x - w / 2 - 10, 250], [x - w / 2, 220], [x + w / 2, 220], [x + w / 2 + 12, 250]], '#0e1220');
  }
  // the tents: cloth over poles, one lit from inside
  const tent = (x, yb, w, hh, col, dark, lit) => {
    poly(c, [[x, yb], [x + w / 2, yb - hh], [x + w, yb]], col);
    poly(c, [[x + w / 2, yb - hh], [x + w, yb], [x + w * 0.62, yb]], dark);
    if (lit) { poly(c, [[x + w * 0.4, yb], [x + w / 2, yb - hh * 0.55], [x + w * 0.6, yb]], '#ffb860'); glow(c, x + w / 2, yb - 8, 30, 'rgba(255,170,90,0.45)'); }
    line(c, x + w / 2, yb - hh - 4, x + w / 2, yb, '#2a1e18', 1);
  };
  tent(70, 222, 70, 44, '#5a4a52', '#3a2e38', true);
  tent(340, 218, 64, 40, '#4a4460', '#302c44', false);
  tent(150, 206, 40, 24, '#3e3848', '#2a2634', false);
  // a banner with the house crest
  rect(c, 300, 128, 2, 92, '#2a1e18'); rect(c, 302, 132, 16, 44, '#e8e0d0'); rect(c, 302, 132, 16, 44, 'rgba(0,0,0,0)');
  circle(c, 310, 150, 5, '#2a2a3a'); circle(c, 310, 150, 3, '#e8e0d0'); rect(c, 309, 146, 2, 8, '#2a2a3a');
  // crates, baskets and a rolled mat by the fire
  rect(c, 240, 224, 20, 14, '#4a3424'); rect(c, 240, 224, 20, 1, '#c07a40'); rect(c, 262, 228, 14, 10, '#3e2c20');
  ellipse(c, 150, 238, 12, 6, '#5a4430'); ellipse(c, 150, 236, 10, 3, '#7a5c3c');
  // the fire itself, and its light on everything near it
  const fx = 206, fy = 232;
  glow(c, fx, fy - 10, 170, 'rgba(255,130,50,0.42)');
  glow(c, fx, fy - 10, 60, 'rgba(255,170,80,0.5)');
  for (let k = 0; k < 6; k++) { const a = k * TAU / 6; rock(c, r, fx + Math.cos(a) * 16 - 4, fy + Math.sin(a) * 5 - 2, 8, 6, { dark: '#2a2220', mid: '#5a4438', lit: '#e8a060' }); }
  line(c, fx - 12, fy + 2, fx + 12, fy - 4, '#3a2418', 3); line(c, fx - 10, fy - 4, fx + 12, fy + 2, '#4a2e1e', 3);
  for (let k = 0; k < 9; k++) ellipse(c, fx + r.r(-7, 7), fy - 6 - r.r(0, 6), r.r(2, 4), r.r(4, 9), r.pick(['#ffb040', '#ff7a2a', '#ffd070']));
  ellipse(c, fx, fy - 7, 3, 6, '#fff0b0');
  vgrad(c, 0, 206, W, 30, [[0, 'rgba(140,160,200,0)'], [1, 'rgba(140,160,200,0.18)']]);
  vignette(c, 0.55, '0,0,10');
  return { colors: 60 };
};
