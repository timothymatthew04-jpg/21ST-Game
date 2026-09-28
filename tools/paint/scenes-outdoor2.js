/* More outdoor scenes, as moving layers: the garden, the aviary, the burned village, the
   forest camp, Hara Kei's village (three moods) and the torii path through the forest. */
/* global W, H, TAU, rng, vgrad, hgrad, rect, px, circle, ellipse, poly, line, glow, shade, shaft, speckle,
   stars, moon, sun, cloudBand, cumulus, hill, treeLine, crown, trunk, branch, tree, poplar, cypress, pine,
   frHouse, window_, jpHouse, reflect, texture, tufts, rock, wrapped, sway, bareTree */

globalThis.SCENES = globalThis.SCENES || {};

// ---------------------------------------------------------------- Hélène's garden: summer evening, or deep winter
function gardenScene(c, L, winter) {
  const r = rng(101);
  vgrad(c, 0, 0, W, 132, winter ? [[0, '#6c6f8e'], [0.6, '#a8a6bc'], [1, '#d8d2da']] : [[0, '#56639f'], [0.4, '#b98aa6'], [0.75, '#f3b98a'], [1, '#ffe4ae']]);
  if (!winter) sun(c, 392, 112, 10, '#fff6d6', 'rgba(255,190,120,0.55)');
  const cl = L('clouds', { depth: 0.05, anim: { type: 'drift', t: 230 } });
  wrapped(cl, 3, (cc, rr) => {
    if (winter) { cloudBand(cc, rr, 0, 24, 260, 16, { body: '#8e8ea8', rim: '#c4c2d2', shadow: '#7c7c98', hi: '#e0deea', lightFromBelow: false }); cloudBand(cc, rr, 240, 60, 260, 12, { body: '#9c9cb4', rim: '#cfcddc', shadow: '#8a8aa4', hi: '#ecebf2', lightFromBelow: false }); }
    else { cloudBand(cc, rr, 40, 30, 200, 8, { body: '#8a76a6', rim: '#ffc79a', shadow: '#76629a', hi: '#fff0d0' }); cloudBand(cc, rr, 260, 60, 190, 6, { body: '#a47ea0', rim: '#ffd0a0', shadow: '#906c94', hi: '#fff4d6' }); }
  });
  const far = L('far', { depth: 0.12 });
  hill(far, r, -40, 300, 132, 26, winter ? '#9a9cb4' : '#8b8a9e');
  hill(far, r, 180, 540, 132, 20, winter ? '#a4a4ba' : '#94869e');
  for (let i = 0; i < 12; i++) {
    if (winter) bareTree(far, r, 180 + i * 26 + r.r(-6, 6), 134, r.r(26, 40), '#6a6a80', '#f4f4fa');
    else poplar(far, r, 180 + i * 26 + r.r(-6, 6), 134, r.r(26, 40), { trunk: '#5a4a4a', leaves: ['#5f6e56', '#8a9460', '#f0d08a'] }, 1);
  }
  const g = L('land', { depth: 0.35 });
  vgrad(g, 0, 132, W, H - 132, winter ? [[0, '#e8ecf4'], [0.4, '#cdd4e4'], [1, '#8a92ac']] : [[0, '#a9b25e'], [0.3, '#7d9448'], [1, '#34401f']]);
  texture(g, r, 0, 134, W, 136, 0.06, 3);
  if (winter) speckle(g, r, 0, 134, W, 136, ['#ffffff', '#dfe4f2'], 700);
  frHouse(g, r, 10, 170, 120, 62, { roofH: 26, chimney: 0.7, side: 26, roof: winter ? '#e8ecf4' : '#b2583a', roofDark: winter ? '#b8c0d4' : '#8a3f29', windows: [[16, 16, 10, 14, { lit: true, shutters: '#5a7a8a' }], [48, 16, 10, 14, { lit: true, shutters: '#5a7a8a' }], [16, 40, 10, 14, { shutters: '#5a7a8a', lit: winter }], [72, 40, 10, 14, { lit: true, shutters: '#5a7a8a' }]], door: [48, 12, 20] });
  if (!winter) for (let i = 0; i < 40; i++) { const x = 92 + r() * 34, y = 118 + r() * 50; px(g, x, y, r() < 0.5 ? '#3f5a2a' : r.pick(['#f4a7b9', '#e27a9a', '#ffd0dc'])); }
  rect(g, 130, 150, W - 130, 10, winter ? '#b8b0b0' : '#c9ae8a'); rect(g, 130, 150, W - 130, 2, winter ? '#ffffff' : '#f0d6aa'); texture(g, r, 130, 152, W - 130, 8, 0.15, 2);
  g.fillStyle = winter ? '#dcdcea' : '#d8c2a0'; g.beginPath(); g.moveTo(150, H); g.bezierCurveTo(170, 230, 90, 200, 60, 172); g.lineTo(72, 172); g.bezierCurveTo(118, 198, 214, 228, 222, H); g.closePath(); g.fill();
  if (!winter) texture(g, r, 50, 170, 180, 100, 0.12, 2, (cc) => { cc.moveTo(150, H); cc.bezierCurveTo(170, 230, 90, 200, 60, 172); cc.lineTo(72, 172); cc.bezierCurveTo(118, 198, 214, 228, 222, H); });
  g.save(); g.beginPath(); g.ellipse(320, 196, 84, 20, 0, 0, TAU); g.clip();
  vgrad(g, 236, 176, 170, 40, winter ? [[0, '#e6eef8'], [1, '#aab8d4']] : [[0, '#ffe0a8'], [0.4, '#d99aa8'], [1, '#5a6aa0']]);
  if (winter) for (let i = 0; i < 8; i++) line(g, 250 + r() * 140, 180 + r() * 30, 260 + r() * 140, 184 + r() * 30, '#c4d0e6', 1);
  else {
    for (let i = 0; i < 40; i++) { g.globalAlpha = 0.5; rect(g, 240 + r() * 160, 180 + r() * 34, r.r(4, 12), 1, '#fff0c8'); }
    g.globalAlpha = 1;
    for (let i = 0; i < 6; i++) { ellipse(g, 270 + r() * 100, 190 + r() * 16, 5, 1.8, '#4f7a3a'); if (r() < 0.5) px(g, 272 + r() * 100, 190 + r() * 16, '#f4c0d0'); }
  }
  g.restore();
  g.strokeStyle = winter ? '#9aa0b4' : '#8a7a5a'; g.lineWidth = 2; g.beginPath(); g.ellipse(320, 196, 84, 20, 0, 0, TAU); g.stroke();
  for (let i = 0; i < 20; i++) { const a = r() * TAU; rock(g, r, 320 + Math.cos(a) * 84 - 4, 196 + Math.sin(a) * 20 - 3, 8, 5, winter ? { dark: '#7a7a8e', mid: '#a4a4b8', lit: '#ffffff' } : { dark: '#6a6050', mid: '#9a8c74', lit: '#e8d0a8' }); }
  rect(g, 150, 184, 40, 4, '#7a5234'); rect(g, 150, 176, 40, 3, '#8a6240'); rect(g, 152, 188, 3, 10, '#5a3a24'); rect(g, 185, 188, 3, 10, '#5a3a24');
  if (winter) { rect(g, 150, 183, 40, 1, '#ffffff'); rect(g, 150, 175, 40, 1, '#ffffff'); }
  // the trees: young ones on stakes, and the old lime by the bench
  const leaves = ['#4a6a2e', '#7a9a3e', '#d8c46a', '#fff0a0'];
  for (const [i, [x, yb, hh]] of [[250, 170, 40], [390, 168, 44], [440, 178, 50], [210, 176, 36]].entries()) {
    rect(g, x + 3, yb - hh * 0.6, 1, hh * 0.6, '#8a6a4a');
    ellipse(g, x - 8, yb, hh * 0.35, 3, winter ? 'rgba(120,130,170,0.35)' : 'rgba(40,50,20,0.35)');
    const t = L(`young${i}`, { depth: 0.35, anim: sway(1.8, r.r(4, 6)) });
    if (winter) bareTree(t, r, x, yb, hh, '#5a4a40', '#ffffff');
    else tree(t, r, x, yb, hh, { trunk: '#6a5040', trunkDark: '#4a3a30', leaves }, { light: { x: 0.9, y: -0.4 }, wide: 0.34, n: 20 });
  }
  const lime = L('lime', { depth: 0.38, anim: sway(0.9, 7) });
  if (winter) bareTree(lime, r, 186, 188, 110, '#4a3a30', '#ffffff');
  else tree(lime, r, 186, 188, 110, { trunk: '#5a4636', trunkDark: '#3e3026', leaves: ['#3a5226', '#6a8a36', '#d8c46a', '#fff0a0'] }, { light: { x: 0.9, y: -0.3 }, wide: 0.5 });
  // lavender and roses in the foreground, nodding
  const fl = L('flowers', { depth: 0.55, anim: sway(4, 3.6) });
  for (let row = 0; row < 3; row++) for (let x = 250 + row * 8; x < W; x += 6) {
    const y = 226 + row * 12;
    ellipse(fl, x, y, 4, 6, winter ? '#8a8ea8' : '#5a4a7a');
    for (let k = 0; k < 4; k++) px(fl, x + r.r(-2, 2), y - 5 + r.r(-2, 2), winter ? '#ffffff' : r.pick(['#a88ad8', '#c8a8f0', '#8a6ac0']));
  }
  for (let i = 0; i < 12; i++) {
    const x = r() * 130, y = 222 + r() * 40;
    crown(fl, r, x, y, 10, 7, winter ? ['#6a7090', '#8a90aa', '#ffffff'] : ['#2e4a22', '#4a6a2e', '#6a8a3e'], { x: 0.8, y: -0.6 }, 10);
    if (!winter) for (let k = 0; k < 6; k++) circle(fl, x + r.r(-7, 7), y + r.r(-5, 3), 1.5, r.pick(['#f4a7b9', '#e27a9a', '#fff0f4']));
  }
  tufts(fl, r, 0, 244, W, 26, 80, winter ? ['#8a90aa', '#a4aac0', '#c4c8d8'] : ['#2a3a1a', '#3e5226', '#5a6a2e']);
  return { colors: 64, vignette: winter ? [0.4, '30,34,60'] : [0.35, '30,20,10'] };
}
SCENES.helene_garden = (c, L) => gardenScene(c, L, false);
SCENES.garden_winter = (c, L) => gardenScene(c, L, true);

// ---------------------------------------------------------------- the aviary behind Hara Kei's house
SCENES.aviary = (c, L) => {
  const r = rng(111);
  vgrad(c, 0, 0, W, 150, [[0, '#6f8fc4'], [0.5, '#b8c4d8'], [0.85, '#f1d8a8'], [1, '#ffe4b0']]);
  sun(c, 90, 40, 9, '#fffbe6', 'rgba(255,230,170,0.5)');
  const cl = L('clouds', { depth: 0.05, anim: { type: 'drift', t: 240 } });
  wrapped(cl, 9, (cc, rr) => { cumulus(cc, rr, 250, 34, 150, 30, { dark: '#9aa2c4', mid: '#d6d6e6', lit: '#fff6e6', lx: -1 }); cumulus(cc, rr, 20, 70, 90, 18, { dark: '#a4acc8', mid: '#dcdcea', lit: '#fff6e6', lx: -1 }); });
  const far = L('far', { depth: 0.12 });
  hill(far, r, -40, 300, 150, 60, '#8c96b8');
  hill(far, r, 200, 540, 150, 44, '#7e88ac');
  for (let i = 0; i < 16; i++) crown(far, r, i * 32 + r.r(-8, 8), 150 - r.r(0, 16), r.r(16, 24), r.r(12, 18), ['#8a3a26', '#c9582e', '#f09a44', '#ffd07a'], { x: -0.8, y: -0.6 }, 16);
  const g = L('land', { depth: 0.35 });
  vgrad(g, 0, 146, W, H - 146, [[0, '#6f7e44'], [0.4, '#4f5e32'], [1, '#232a18']]);
  texture(g, r, 0, 146, W, 124, 0.07, 3);
  jpHouse(g, r, -30, 196, 120, 56, { roof: '#2f3444', roofLight: '#6a7690', plaster: '#e6ddc8', wood: '#3a2a22', roofH: 34, windows: [[40, 12, 22, 26, false], [74, 12, 22, 26, false]] });
  const ax = 170, aw = 170, top = 60, base = 204;
  vgrad(g, ax, top, aw, base - top, [[0, '#3c4a30'], [1, '#26301e']]);
  for (let i = 0; i < 6; i++) { branch(g, ax + 10 + i * 28, base - 40, ax + 20 + i * 26, base - 110 + r() * 30, 3, '#3a2a1e'); crown(g, r, ax + 24 + i * 26, base - 110 + r() * 20, 14, 8, ['#2e4a26', '#4a6a2e', '#8aa04a'], { x: -0.7, y: -0.6 }, 10); }
  shaft(g, [[ax, top], [ax + 60, top], [ax + 120, base], [ax + 40, base]], 'rgba(255,240,200,1)', 0.18);
  for (let x = ax; x <= ax + aw; x += 10) rect(g, x, top, 2, base - top, '#6a4a30');
  for (let y = top + 8; y < base; y += 12) rect(g, ax, y, aw, 1, '#7a5a3a');
  for (let x = ax; x <= ax + aw; x += 10) rect(g, x, top, 1, base - top, '#a8805a');
  rect(g, ax - 2, base - 30, aw + 4, 30, '#efe6d0');
  for (let x = ax; x <= ax + aw; x += 14) rect(g, x, base - 30, 2, 30, '#5a3a24');
  for (let y = base - 22; y < base; y += 8) rect(g, ax, y, aw, 1, '#8a6a4a');
  rect(g, ax - 4, base - 2, aw + 8, 4, '#3a2a1e');
  poly(g, [[ax - 26, top + 4], [ax - 16, top - 4], [ax + 30, top - 34], [ax + aw - 30, top - 34], [ax + aw + 16, top - 4], [ax + aw + 26, top + 4]], '#2f3444');
  for (let k = 0; k < 5; k++) line(g, ax - 18 + k * 5, top - 2 - k * 6, ax + aw + 18 - k * 5, top - 2 - k * 6, '#6a7690', 1);
  rect(g, ax + 26, top - 38, aw - 52, 4, '#6a7690');
  rect(g, ax - 20, top + 2, aw + 40, 3, '#1f2230');
  for (let i = 0; i < 7; i++) { const t = i / 6; ellipse(g, 250 - t * 20 + r.r(-6, 6), 266 - t * 58, 14 - t * 8, 5 - t * 2.5, '#9c9486'); ellipse(g, 250 - t * 20, 264 - t * 58, 10 - t * 6, 2, '#c8c0b0'); }
  for (const [x, y, s] of [[130, 214, 1], [390, 214, 1], [440, 250, 1.4]]) {
    rect(g, x - 3 * s, y - 20 * s, 6 * s, 20 * s, '#8a8478'); rect(g, x - 7 * s, y - 24 * s, 14 * s, 4 * s, '#9c968a'); rect(g, x - 5 * s, y - 32 * s, 10 * s, 8 * s, '#7a7468');
    rect(g, x - 3 * s, y - 30 * s, 6 * s, 4 * s, '#2a2620'); poly(g, [[x - 9 * s, y - 32 * s], [x + 9 * s, y - 32 * s], [x, y - 40 * s]], '#6a6458');
  }
  for (let i = 0; i < 140; i++) px(g, r() * W, 200 + r() * 70, r.pick(['#c9582e', '#f09a44', '#8a3a26', '#ffd07a']));
  for (const [i, [x, yb, hh]] of [[440, 196, 120], [36, 250, 80]].entries()) {
    const m = L(`maple${i}`, { depth: 0.4, anim: sway(1, r.r(5.5, 7.5)) });
    trunk(m, x, yb, hh * 0.5, 8, 5, '#3a2a22', '#2a1e18');
    crown(m, r, x, yb - hh * 0.6, hh * 0.5, hh * 0.32, ['#7a2e20', '#b84a28', '#ec8a3a', '#ffc870'], { x: -0.8, y: -0.5 }, 40);
  }
  tufts(L('grass', { depth: 0.55, anim: sway(5, 3.4) }), r, 0, 240, W, 30, 60, ['#1f2a14', '#34421e', '#4f5e2e']);
  return { colors: 64, vignette: [0.32, '20,20,10'] };
};

// ---------------------------------------------------------------- what was left of the village
SCENES.burned_village = (c, L) => {
  const r = rng(121);
  vgrad(c, 0, 0, W, 160, [[0, '#1e1418'], [0.35, '#4a1e1e'], [0.7, '#a8401e'], [0.9, '#e87a2e'], [1, '#ffb050']]);
  const cl = L('smokeclouds', { depth: 0.05, anim: { type: 'drift', t: 80 } });
  wrapped(cl, 17, (cc, rr) => {
    cloudBand(cc, rr, -20, 30, 260, 16, { body: '#2e1c1c', rim: '#c85a28', shadow: '#1e1214', hi: '#ff9a4a' });
    cloudBand(cc, rr, 200, 56, 300, 14, { body: '#3a2020', rim: '#e0702e', shadow: '#2a1818', hi: '#ffb060' });
    cloudBand(cc, rr, 60, 96, 220, 10, { body: '#5a2a22', rim: '#ff9a44', shadow: '#442020', hi: '#ffd080' });
  });
  const far = L('far', { depth: 0.12 });
  hill(far, r, -40, 300, 160, 40, '#2e1a1c');
  hill(far, r, 180, 540, 160, 30, '#26161a');
  const g = L('land', { depth: 0.35 });
  vgrad(g, 0, 158, W, H - 158, [[0, '#4a2a22'], [0.3, '#34201c'], [1, '#140c0c']]);
  glow(g, 240, 162, 160, 'rgba(255,120,40,0.3)');
  texture(g, r, 0, 158, W, 112, 0.05, 4);
  speckle(g, r, 0, 160, W, 110, ['#5a4a46', '#3a2a26'], 260);
  for (let i = 0; i < 14; i++) ellipse(g, r() * W, 200 + r() * 70, r.r(10, 30), r.r(2, 4), 'rgba(20,10,10,0.35)');
  const ruin = (x, yb, w, hh) => {
    poly(g, [[x - 6, yb], [x + w * 0.2, yb - hh * 0.4], [x + w * 0.5, yb - hh * 0.25], [x + w * 0.75, yb - hh * 0.5], [x + w + 8, yb]], '#1a1010');
    for (let k = 0; k < 5; k++) {
      const px_ = x + (k / 4) * w, ph = hh * r.r(0.4, 1.05);
      rect(g, px_, yb - ph, 3, ph, '#140c0c'); rect(g, px_ + 2, yb - ph, 1, ph, '#8a3a1e');
      if (r() < 0.7) px(g, px_ + 1, yb - ph, '#ff9a3c');
    }
    line(g, x, yb - hh * 0.9, x + w * 0.6, yb - hh * r.r(0.4, 0.8), '#140c0c', 3);
    line(g, x + w * 0.3, yb - hh * 0.8, x + w, yb - hh * 0.3, '#140c0c', 2);
    for (let k = 0; k < 16; k++) px(g, x + r() * w, yb - r() * hh * 0.35, r.pick(['#ff9a3c', '#ffcf70', '#d8482a']));
    glow(g, x + w / 2, yb - 4, w * 0.6, 'rgba(255,110,40,0.4)');
  };
  ruin(40, 196, 80, 60); ruin(300, 190, 70, 52); ruin(390, 206, 90, 70); ruin(170, 176, 50, 36); ruin(250, 172, 40, 30);
  rect(g, 214, 116, 4, 64, '#1a0e0e'); rect(g, 250, 116, 4, 64, '#1a0e0e'); poly(g, [[204, 118], [264, 118], [268, 112], [200, 112]], '#1a0e0e'); rect(g, 208, 126, 52, 3, '#1a0e0e');
  line(g, 204, 112, 268, 112, '#9a3a1e', 1);
  for (const [x, yb, hh] of [[140, 200, 90], [456, 190, 110], [10, 214, 120]]) {
    trunk(g, x, yb, hh, 7, 3, '#1a1010');
    for (let k = 0; k < 6; k++) branch(g, x, yb - hh * r.r(0.4, 0.95), x + r.r(-30, 30), yb - hh * r.r(0.8, 1.2), 2, '#1a1010');
  }
  g.strokeStyle = '#1a1010'; g.lineWidth = 2; g.beginPath(); g.arc(300, 236, 12, 0, TAU); g.stroke();
  for (let k = 0; k < 6; k++) line(g, 300, 236, 300 + Math.cos(k) * 12, 236 + Math.sin(k) * 12, '#1a1010', 1);
  for (let i = 0; i < 30; i++) rect(g, r() * W, 220 + r() * 50, r.i(2, 4), 1, '#3a2a2a');
  return { colors: 60, vignette: [0.55, '10,0,0'] };
};

// ---------------------------------------------------------------- Hara Kei's camp in the forest at night
SCENES.forest_camp_night = (c, L) => {
  const r = rng(131);
  vgrad(c, 0, 0, W, H, [[0, '#0a1024'], [0.5, '#132040'], [1, '#0a0f1e']]);
  stars(c, r, 40, 120, 0, 240, 50);
  moon(c, 300, 26, 9, { seed: 6, halo: 'rgba(150,180,240,0.3)' });
  const far = L('far', { depth: 0.1 });
  const trunks = (cc, n, y0, w0, col, lit) => {
    for (let i = 0; i < n; i++) {
      const x = r() * W, w = w0 * r.r(0.7, 1.3);
      rect(cc, x, 0, w, y0, col);
      if (lit) rect(cc, x + w - Math.max(1, w * 0.2), 0, Math.max(1, w * 0.2), y0, lit);
    }
  };
  trunks(far, 26, 200, 5, '#2a3a5a', '#3e5278');
  vgrad(far, 0, 120, W, 80, [[0, 'rgba(120,150,200,0)'], [1, 'rgba(120,150,200,0.35)']]);
  const mid = L('mid', { depth: 0.25 });
  trunks(mid, 14, 214, 10, '#18223a', '#2e4064');
  shaft(mid, [[270, 0], [300, 0], [260, 230], [200, 230]], 'rgba(170,200,255,1)', 0.14);
  const g = L('land', { depth: 0.35 });
  vgrad(g, 0, 196, W, H - 196, [[0, '#1a2430'], [0.4, '#141a22'], [1, '#080a10']]);
  texture(g, r, 0, 196, W, 74, 0.08, 3);
  for (const [x, w] of [[26, 34], [430, 40]]) {
    rect(g, x - w / 2, 0, w, 250, '#0e1220');
    for (let k = 0; k < 20; k++) rect(g, x - w / 2 + r() * w, r() * 240, 1, r.r(8, 30), '#1a2236');
    poly(g, [[x - w / 2 - 10, 250], [x - w / 2, 220], [x + w / 2, 220], [x + w / 2 + 12, 250]], '#0e1220');
  }
  const tent = (x, yb, w, hh, col, dark, lit) => {
    poly(g, [[x, yb], [x + w / 2, yb - hh], [x + w, yb]], col);
    poly(g, [[x + w / 2, yb - hh], [x + w, yb], [x + w * 0.62, yb]], dark);
    if (lit) { poly(g, [[x + w * 0.4, yb], [x + w / 2, yb - hh * 0.55], [x + w * 0.6, yb]], '#ffb860'); glow(g, x + w / 2, yb - 8, 26, 'rgba(255,170,90,0.45)'); }
    line(g, x + w / 2, yb - hh - 4, x + w / 2, yb, '#2a1e18', 1);
  };
  tent(70, 222, 70, 44, '#5a4a52', '#3a2e38', true);
  tent(340, 218, 64, 40, '#4a4460', '#302c44', false);
  tent(150, 206, 40, 24, '#3e3848', '#2a2634', false);
  rect(g, 300, 128, 2, 92, '#2a1e18');
  rect(g, 240, 224, 20, 14, '#4a3424'); rect(g, 240, 224, 20, 1, '#c07a40'); rect(g, 262, 228, 14, 10, '#3e2c20');
  ellipse(g, 150, 238, 12, 6, '#5a4430'); ellipse(g, 150, 236, 10, 3, '#7a5c3c');
  const fx = 206, fy = 232;
  glow(g, fx, fy - 10, 150, 'rgba(255,130,50,0.4)');
  glow(g, fx, fy - 10, 60, 'rgba(255,170,80,0.5)');
  for (let k = 0; k < 6; k++) { const a = k * TAU / 6; rock(g, r, fx + Math.cos(a) * 16 - 4, fy + Math.sin(a) * 5 - 2, 8, 6, { dark: '#2a2220', mid: '#5a4438', lit: '#e8a060' }); }
  line(g, fx - 12, fy + 2, fx + 12, fy - 4, '#3a2418', 3); line(g, fx - 10, fy - 4, fx + 12, fy + 2, '#4a2e1e', 3);
  vgrad(g, 0, 206, W, 30, [[0, 'rgba(140,160,200,0)'], [1, 'rgba(140,160,200,0.18)']]);
  // the house banner stirring in the night air
  const b = L('banner', { depth: 0.35, anim: { type: 'wave', a: 3, t: 3.2, ox: 0, oy: 0.2 } });
  rect(b, 302, 132, 16, 44, '#e8e0d0'); rect(b, 302, 132, 16, 2, '#b8b0a0');
  circle(b, 310, 150, 5, '#2a2a3a'); circle(b, 310, 150, 3, '#e8e0d0'); rect(b, 309, 146, 2, 8, '#2a2a3a');
  // the canopy overhead, moving a little
  const cp = L('canopy', { depth: 0.2, anim: sway(0.6, 9, { oy: 0 }) });
  for (let i = 0; i < 26; i++) crown(cp, r, r() * W, r.r(-10, 40), r.r(30, 50), r.r(14, 24), ['#0c1428', '#142038', '#1e2e4e'], { x: 0.2, y: 1 }, 14);
  return { colors: 60, vignette: [0.55, '0,0,10'] };
};

// ---------------------------------------------------------------- Hara Kei's village: moonlit, golden afternoon, or with fires on the hills
function estateScene(c, L, mood) {
  const r = rng(141);
  const night = mood === 'night', day = mood === 'day', unrest = mood === 'unrest';
  const P = {
    night: { sky: [[0, '#081030'], [0.5, '#12256a'], [1, '#1e3a8a']], wood: '#4a2e22', woodLit: '#8a5a3a', plaster: '#d8cdb8', plasterShade: '#8c8aa0', roof: '#2c3a5a', roofLit: '#6a82b0', ground: [[0, '#2a3a36'], [1, '#101a1a']], rockC: { dark: '#1c2232', mid: '#343c54', lit: '#7a88b0' }, maple: ['#5a2018', '#a8401e', '#e07a2e', '#ffb050'], water: [[0, '#1a3060'], [1, '#0a1430']] },
    day: { sky: [[0, '#6f98d0'], [0.6, '#b8d0e6'], [1, '#f4e2c0']], wood: '#5a3a28', woodLit: '#b07a4a', plaster: '#f2e8d4', plasterShade: '#c8bca4', roof: '#3a4458', roofLit: '#8a9ab8', ground: [[0, '#7a8a4a'], [1, '#34401e']], rockC: { dark: '#5a5448', mid: '#8a8474', lit: '#d8d0bc' }, maple: ['#8a2e1e', '#c8502a', '#f09a44', '#ffd07a'], water: [[0, '#8ab4d8'], [1, '#3a6a9a']] },
    unrest: { sky: [[0, '#1a1426'], [0.5, '#4a2438'], [0.85, '#a8402e'], [1, '#d86a3a']], wood: '#3a2420', woodLit: '#8a4a2e', plaster: '#c8a898', plasterShade: '#7a5a5a', roof: '#2a2434', roofLit: '#8a5a5a', ground: [[0, '#3a2a26'], [1, '#140c0c']], rockC: { dark: '#231a1e', mid: '#3e2c30', lit: '#a0685a' }, maple: ['#4a1812', '#8a2e1a', '#c8502a', '#f08a40'], water: [[0, '#4a2a38'], [1, '#140c18']] },
  }[mood];
  vgrad(c, 0, 0, W, 190, P.sky);
  if (night) { stars(c, r, 120, 0, 0, W, 110); moon(c, 209, 43, 26, { seed: 2, lit: '#f2f6ff', mare: '#b6c4e4' }); }
  if (day) sun(c, 90, 36, 10, '#fffbe8', 'rgba(255,240,200,0.5)');
  if (unrest) { glow(c, 380, 170, 140, 'rgba(255,90,40,0.45)'); moon(c, 90, 40, 9, { seed: 8, lit: '#f0c8a8', mare: '#c89880', halo: 'rgba(255,140,90,0.3)' }); }
  if (!night) {
    const cl = L('clouds', { depth: 0.05, anim: { type: 'drift', t: unrest ? 110 : 250 } });
    wrapped(cl, 19, (cc, rr) => {
      if (day) { cumulus(cc, rr, 280, 20, 140, 26, { dark: '#9fb0cc', mid: '#dfe6f0', lit: '#fffaf0', lx: -1 }); cumulus(cc, rr, 120, 60, 80, 14, { dark: '#a8b8d0', mid: '#e4eaf2', lit: '#fffaf0', lx: -1 }); }
      else { cloudBand(cc, rr, 0, 30, 280, 16, { body: '#2e1e2c', rim: '#c8603a', shadow: '#1e1420', hi: '#ff9a5a' }); cloudBand(cc, rr, 220, 70, 280, 12, { body: '#3e2432', rim: '#e0763e', shadow: '#2a1a26', hi: '#ffb070' }); }
    });
  }
  // dark pines and hills behind, and (in the troubles) smoke from fires on the ridge
  const far = L('far', { depth: 0.12 });
  hill(far, r, -40, 520, 150, 30, night ? '#0e1a36' : day ? '#7a8cb0' : '#2a1a26');
  for (const x of [120, 150, 300, 330, 360]) { const hh = r.r(40, 60); poly(far, [[x, 150 - hh], [x + 10, 150], [x - 10, 150]], night ? '#0c1830' : day ? '#4a6a5a' : '#1e141c'); }
  if (unrest) for (const x of [60, 380, 440]) { glow(far, x, 148, 30, 'rgba(255,120,40,0.6)'); }
  // dark pines standing behind the halls
  const pines = L('pines', { depth: 0.3, anim: sway(0.5, 9) });
  for (const [x, hh] of [[70, 90], [236, 70], [446, 96]]) pine(pines, r, x, 196, hh, { trunk: P.wood, leaves: night ? ['#0c1a22', '#16303a', '#3a5a70'] : day ? ['#1e3a2a', '#2e5a3e', '#8ab07a'] : ['#1a1418', '#2a1e22', '#6a3a3a'] }, 1);
  const g = L('land', { depth: 0.35 });
  vgrad(g, 0, 150, W, H - 150, P.ground);
  texture(g, r, 0, 150, W, 120, 0.06, 3);
  // the left hall
  const hall = (x, yb, w, hh, rh, lit) => {
    rect(g, x, yb - hh, w, hh, P.plaster);
    rect(g, x, yb - hh, w, hh * 0.3, P.plasterShade);
    for (let i = 0; i <= w; i += 10) rect(g, x + i - 1, yb - hh, 2, hh, P.wood);
    rect(g, x, yb - 3, w, 3, P.wood);
    for (let i = 5; i < w - 6; i += 20) { rect(g, x + i, yb - hh * 0.62, 10, hh * 0.45, lit ? '#ffcf7a' : P.plasterShade); for (let k = 1; k < 4; k++) rect(g, x + i + k * 2.5, yb - hh * 0.62, 1, hh * 0.45, P.wood); if (lit) glow(g, x + i + 5, yb - hh * 0.4, 16, 'rgba(255,180,90,0.5)'); }
    const ov = w * 0.1;
    poly(g, [[x - ov - 4, yb - hh], [x - ov, yb - hh - 4], [x + w * 0.2, yb - hh - rh], [x + w * 0.8, yb - hh - rh], [x + w + ov, yb - hh - 4], [x + w + ov + 4, yb - hh]], P.roof);
    for (let k = 0; k < 5; k++) line(g, x - ov + k * 2, yb - hh - 3 - k * rh * 0.18, x + w + ov - k * 2, yb - hh - 3 - k * rh * 0.18, P.roofLit, 1);
    rect(g, x + w * 0.18, yb - hh - rh - 2, w * 0.64, 3, P.roofLit);
  };
  hall(90, 186, 120, 34, 28, !day);
  hall(214, 178, 60, 20, 14, false);
  // the main hall: two storeys, a balcony, its door glowing
  hall(270, 196, 170, 44, 30, true);
  rect(g, 280, 118, 150, 4, P.wood);
  for (let x = 282; x < 430; x += 6) rect(g, x, 110, 1, 8, P.wood);
  rect(g, 300, 82, 110, 30, P.plaster);
  for (let i = 0; i <= 110; i += 11) rect(g, 300 + i - 1, 82, 2, 30, P.wood);
  for (let i = 8; i < 100; i += 22) { rect(g, 300 + i, 88, 10, 18, !day ? '#ffcf7a' : P.plasterShade); if (!day) glow(g, 305 + i, 97, 14, 'rgba(255,180,90,0.45)'); }
  poly(g, [[280, 84], [290, 80], [322, 50], [388, 50], [420, 80], [430, 84]], P.roof);
  for (let k = 0; k < 5; k++) line(g, 288 + k * 3, 80 - k * 6, 422 - k * 3, 80 - k * 6, P.roofLit, 1);
  poly(g, [[346, 50], [355, 36], [364, 50]], P.roof);
  rect(g, 336, 160, 38, 36, '#ffcf7a'); rect(g, 354, 160, 2, 36, P.wood); glow(g, 355, 178, 50, 'rgba(255,190,100,0.55)');
  rect(g, 344, 146, 22, 8, P.wood); rect(g, 346, 148, 18, 4, '#d8c090');
  // steps, stone paths and rocks
  for (let k = 0; k < 5; k++) rect(g, 330 - k * 3, 196 + k * 3, 50 + k * 6, 3, k % 2 ? P.rockC.mid : P.rockC.lit);
  for (let i = 0; i < 26; i++) rock(g, r, r() * W, 200 + r() * 20, r.r(10, 22), r.r(6, 12), P.rockC);
  // the pond, holding the halls and the lanterns upside down
  g.save(); g.beginPath(); g.moveTo(40, 226); g.bezierCurveTo(140, 208, 330, 214, 440, 222); g.lineTo(460, H); g.lineTo(20, H); g.closePath(); g.clip();
  vgrad(g, 0, 208, W, 62, P.water);
  g.restore();
  for (let i = 0; i < 16; i++) rock(g, r, 30 + r() * 420, 212 + r() * 14, r.r(12, 24), r.r(6, 10), P.rockC);
  // stone lanterns, lit in the dark
  for (const [x, yb, s] of [[138, 206, 1], [206, 196, 0.8], [282, 206, 1], [368, 206, 1], [450, 238, 1.5]]) {
    rect(g, x - 2 * s, yb - 14 * s, 4 * s, 14 * s, P.rockC.mid); rect(g, x - 5 * s, yb - 22 * s, 10 * s, 8 * s, P.rockC.dark);
    rect(g, x - 3 * s, yb - 20 * s, 6 * s, 4 * s, day ? '#3a3228' : '#ffd88a'); poly(g, [[x - 7 * s, yb - 22 * s], [x + 7 * s, yb - 22 * s], [x, yb - 28 * s]], P.rockC.mid);
    if (!day) glow(g, x, yb - 18 * s, 18 * s, 'rgba(255,190,100,0.6)');
  }
  // the reflections in the water
  const rf = L('reflection', { depth: 0.35, anim: { type: 'pulse', lo: 0.7, t: 4 } });
  rf.save(); rf.beginPath(); rf.moveTo(40, 226); rf.bezierCurveTo(140, 208, 330, 214, 440, 222); rf.lineTo(460, H); rf.lineTo(20, H); rf.closePath(); rf.clip();
  for (const [x, w] of [[90, 120], [270, 170]]) for (let y = 228; y < H; y += 2) { rf.globalAlpha = 0.55 * (1 - (y - 228) / 50); rect(rf, x + Math.sin(y) * 2, y, w, 1, day ? '#c8b89a' : '#3a3444'); }
  if (!day) for (const x of [138, 282, 368, 355]) for (let y = 230; y < 262; y += 3) { rf.globalAlpha = 0.8 * (1 - (y - 230) / 34); rect(rf, x - 3 + Math.sin(y * 0.8) * 2, y, 6, 1, '#ffc870'); }
  rf.restore();
  // a small cherry in blossom, and autumn maples framing the court
  const ch = L('cherry', { depth: 0.35, anim: sway(1.4, 6) });
  trunk(ch, 262, 204, 30, 4, 2, '#3a2420');
  for (let k = 0; k < 5; k++) branch(ch, 262, 186, 262 + r.r(-22, 22), 170 + r.r(-10, 6), 1.5, '#3a2420');
  for (let k = 0; k < 90; k++) px(ch, 262 + r.r(-24, 24), 172 + r.r(-12, 10), r.pick(['#f4b0c8', '#ffd0e0', '#e890b0']));
  // autumn maples at the edges of the court
  for (const [i, [x, yb, hh, side]] of [[20, 200, 120, -1], [470, 206, 116, 1]].entries()) {
    const m = L(`maple${i}`, { depth: 0.45, anim: sway(0.8, r.r(6, 8), { ox: side < 0 ? 0.2 : 0.8 }) });
    trunk(m, x, yb + 30, hh * 0.6, 10, 5, P.wood);
    crown(m, r, x - side * 16, yb - hh * 0.62, hh * 0.42, hh * 0.3, P.maple, { x: side * -0.7, y: -0.6 }, 50);
  }
  tufts(L('grass', { depth: 0.55, anim: sway(4, 3.8) }), r, 0, 246, W, 24, 60, night ? ['#0e1a1a', '#1a2a28', '#2a3e3a'] : day ? ['#2a3a18', '#3e5226', '#5a6a2e'] : ['#1a1010', '#2a1c18', '#3a2a22']);
  return { colors: 64, vignette: night ? [0.45, '0,4,24'] : day ? [0.3, '30,20,10'] : [0.5, '20,4,4'] };
}
SCENES.hara_kei_estate = (c, L) => estateScene(c, L, 'night');
SCENES.estate_day = (c, L) => estateScene(c, L, 'day');
SCENES.estate_unrest = (c, L) => estateScene(c, L, 'unrest');

// ---------------------------------------------------------------- the torii on the forest path, light pouring through
SCENES.japan_path = (c, L) => {
  const r = rng(151);
  vgrad(c, 0, 0, W, H, [[0, '#9ec4d8'], [0.3, '#e8e2b8'], [0.55, '#fff0b8'], [1, '#c8b060']]);
  moon(c, 246, 38, 22, { seed: 13, lit: '#f0f6ff', mare: '#b8c8e4', halo: 'rgba(230,240,255,0.35)' });
  glow(c, 240, 150, 150, 'rgba(255,240,180,0.7)');
  // the far forest, pale with light
  const far = L('far', { depth: 0.1 });
  for (let i = 0; i < 30; i++) { const x = 150 + r() * 180, w = r.r(2, 5); rect(far, x, 40 + r() * 30, w, 200, r.pick(['#d8c890', '#c8b878', '#e0d4a0'])); }
  for (let i = 0; i < 26; i++) crown(far, r, 150 + r() * 180, 40 + r() * 70, r.r(14, 24), r.r(10, 18), ['#c8c070', '#e0d890', '#f8f0b8'], { x: 0, y: -1 }, 12);
  // the mid forest: darker trunks, leaves catching the sun
  const mid = L('mid', { depth: 0.2 });
  for (let i = 0; i < 16; i++) { const x = r() < 0.5 ? r() * 150 : 330 + r() * 150, w = r.r(6, 12); rect(mid, x, 0, w, 240, '#6a5238'); rect(mid, x + w - 2, 0, 2, 240, '#b08a58'); }
  for (let i = 0; i < 30; i++) crown(mid, r, r() < 0.5 ? r() * 170 : 310 + r() * 170, r() * 120, r.r(18, 30), r.r(12, 22), ['#3a5a2a', '#6a8a3a', '#b8c060', '#f0e8a0'], { x: r() < 0.5 ? 0.7 : -0.7, y: -0.6 }, 16);
  for (let i = 0; i < 6; i++) shaft(mid, [[230 + i * 6, 40], [250 + i * 6, 40], [150 + i * 40, 250], [120 + i * 40, 250]], 'rgba(255,245,200,1)', 0.12);
  // the path: mossy stone steps climbing to the gate
  const g = L('land', { depth: 0.35 });
  vgrad(g, 0, 200, W, 70, [[0, '#4a5a2e'], [1, '#1e2a14']]);
  texture(g, r, 0, 200, W, 70, 0.06, 3);
  poly(g, [[140, H], [196, 210], [284, 210], [340, H]], '#6a6a50');
  for (let k = 0; k < 9; k++) {
    const t = k / 8, y = 212 + Math.pow(t, 1.2) * 58, w0 = 90 + t * 110;
    rect(g, 240 - w0 / 2, y, w0, 3 + t * 5, k % 2 ? '#8a8a6a' : '#a8a888');
    rect(g, 240 - w0 / 2, y, w0, 1, '#e8e0b0');
    for (let m = 0; m < 10; m++) px(g, 240 - w0 / 2 + r() * w0, y + r() * 4, r.pick(['#5a7a3a', '#7a9a4a']));
  }
  // the torii
  const red = '#c8402a', redDark = '#8a2a1e', redLit = '#f07a4a';
  rect(g, 196, 86, 8, 128, red); rect(g, 196, 86, 2, 128, redLit); rect(g, 202, 86, 2, 128, redDark);
  rect(g, 276, 86, 8, 128, red); rect(g, 276, 86, 2, 128, redLit); rect(g, 282, 86, 2, 128, redDark);
  rect(g, 190, 104, 100, 6, red); rect(g, 190, 104, 100, 1, redLit);
  rect(g, 236, 88, 8, 16, red);
  poly(g, [[178, 80], [302, 80], [296, 88], [184, 88]], red); poly(g, [[172, 74], [308, 74], [302, 80], [178, 80]], '#2a2420'); line(g, 172, 74, 308, 74, '#5a5040', 1);
  rect(g, 194, 210, 12, 6, '#3a3028'); rect(g, 274, 210, 12, 6, '#3a3028');
  // stone lanterns
  for (const [x, yb, s] of [[120, 222, 1.3], [362, 222, 1.3], [158, 200, 0.6]]) {
    rect(g, x - 5 * s, yb - 4 * s, 10 * s, 4 * s, '#6a6a58'); rect(g, x - 2 * s, yb - 20 * s, 4 * s, 16 * s, '#8a8a74');
    rect(g, x - 6 * s, yb - 24 * s, 12 * s, 4 * s, '#9a9a84'); rect(g, x - 4 * s, yb - 32 * s, 8 * s, 8 * s, '#7a7a64'); rect(g, x - 2.5 * s, yb - 30 * s, 5 * s, 4 * s, '#ffe0a0');
    poly(g, [[x - 8 * s, yb - 32 * s], [x + 8 * s, yb - 32 * s], [x, yb - 40 * s]], '#6a6a58'); circle(g, x, yb - 41 * s, 1.5 * s, '#6a6a58');
    for (let m = 0; m < 12; m++) px(g, x + r.r(-6, 6) * s, yb - r() * 30 * s, '#5a7a3a');
  }
  // two great cedars framing the path, and leaves overhead that move in the breeze
  for (const [x, w] of [[30, 56], [452, 60]]) {
    rect(g, x - w / 2, 0, w, 240, '#4a3424');
    for (let k = 0; k < 40; k++) rect(g, x - w / 2 + r() * w, r() * 230, 1, r.r(6, 24), r.pick(['#6a4a30', '#3a2818', '#8a6a40']));
    rect(g, x + (x < 240 ? w / 2 - 6 : -w / 2), 0, 6, 240, x < 240 ? '#a8805a' : '#2e2016');
    for (let k = 0; k < 16; k++) px(g, x - w / 2 + r() * w, r() * 230, '#5a7a3a');
  }
  const leaves = L('leaves', { depth: 0.5, anim: sway(1.2, 6, { oy: 0 }) });
  for (let i = 0; i < 16; i++) crown(leaves, r, r() < 0.5 ? r() * 120 : 360 + r() * 120, r.r(-10, 50), r.r(24, 40), r.r(14, 24), ['#1e3a1a', '#3a6a2a', '#8ab04a', '#e0f0a0'], { x: 0, y: 1 }, 18);
  const fl = L('flowers', { depth: 0.55, anim: sway(4, 3.4) });
  for (const [x0, x1] of [[0, 150], [330, W]]) for (let i = 0; i < 26; i++) {
    const x = x0 + r() * (x1 - x0), y = 222 + r() * 44;
    crown(fl, r, x, y, 9, 6, ['#1e3a1a', '#2e5a22', '#4a7a2e'], { x: 0, y: -1 }, 8);
    for (let k = 0; k < 4; k++) px(fl, x + r.r(-6, 6), y - 5 + r.r(-3, 3), r.pick(['#e890c0', '#c8a0f0', '#ffffff', '#f0c040', '#e86040']));
  }
  for (let i = 0; i < 6; i++) { const x = r() < 0.5 ? r.r(10, 130) : r.r(350, 470); for (let k = 0; k < 8; k++) px(fl, x, 240 - k * 2, r.pick(['#c070d0', '#a050b0', '#e0a0f0'])); line(fl, x, 256, x, 240, '#2e5a22', 1); }
  return { colors: 64, vignette: [0.35, '10,20,0'] };
};
