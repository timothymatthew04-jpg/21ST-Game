/*
 * The scenes added with the branching story: the army camp where it begins, the Joncours'
 * bedroom at night, the cemetery where two people are buried side by side, and the house in
 * the hills where Hervé lives out the life he left France for.
 */

// ---------------------------------------------------------------- the army camp at dawn
// The regiment's camp, France at its proudest: the headquarters under its dome and flag, the
// ramparts with a watchtower at the gate, tents, the fire, and beyond the walls the citadels,
// barracks and domes of a military nation. The airships and balloons, the marching column and
// the fire's smoke are the scene's living effects (bgfx army_camp in the story script).
SCENES.army_camp = (c, L) => {
  const r = rng(301);
  vgrad(c, 0, 0, W, 172, [[0, '#56588e'], [0.3, '#9a78aa'], [0.56, '#e296ae'], [0.78, '#f7b4a4'], [0.92, '#ffd6b0'], [1, '#fff0d4']]);
  stars(c, r, 14, 0, 0, W, 30, '#f4ecff');
  sun(c, 92, 150, 13, '#fff6e6', 'rgba(255,150,170,0.55)');
  const cl = L('clouds', { depth: 0.05, anim: { type: 'drift', t: 260 } });
  wrapped(cl, 33, (cc, rr) => {
    frCloud(cc, rr, 20, 18, 140, 34, {});
    frCloud(cc, rr, 250, 34, 120, 28, {});
    frCloud(cc, rr, 150, 84, 80, 14, { body: '#c4a8c0', shadow: '#9a86a8' });
    frCloud(cc, rr, 400, 70, 70, 14, { body: '#c4a8c0', shadow: '#9a86a8' });
  });
  // the horizon: citadels, barracks and stacks, and the domes and towers of Paris
  const far = L('far', { depth: 0.1 });
  const hz = { col: '#9a7896', lit: '#d8a4b4', dark: '#6a5070', roof: '#7a5a80' };
  const B = 168;
  hill(far, r, -40, W + 40, B + 3, 10, '#a88aa4');
  rect(far, 0, B + 1, W, 12, '#a88aa4');
  frBarracks(far, r, 180, B, 56, 10, hz.col, hz.roof, hz.lit);
  frCathedral(far, 246, B, 0.9, hz.col, hz.lit);
  frDome(far, 300, B, 0.95, hz.col, hz.lit);
  const k1 = frCitadel(far, r, 330, 460, B, 12, hz.col, hz.lit, hz.dark);
  rect(far, k1[0], k1[1], 3, 2, FR.blue); rect(far, k1[0] + 3, k1[1], 3, 2, FR.white); rect(far, k1[0] + 6, k1[1], 3, 2, FR.red);
  for (const x of [196, 214, 470]) { frStack(far, x, B - 8, 20, hz.col, hz.lit); frSmoke(far, r, x, B - 30, 9, 'rgba(226,200,214,0.55)', 1); }
  far.save(); far.globalCompositeOperation = 'source-atop'; vgrad(far, 0, 110, W, 70, [[0, 'rgba(255,190,200,0.05)'], [1, 'rgba(255,200,205,0.3)']]); far.restore();
  // the ramparts, with the gate where the road runs out of camp to the north
  const walls = L('walls', { depth: 0.22 });
  vgrad(walls, 0, 172, W, 12, [[0, '#b0947c'], [1, '#9a7e68']]);
  frRampart(walls, r, -10, 318, 180, 13, { lamps: [120, 250] });
  frRampart(walls, r, 346, W + 10, 180, 13, { lamps: [420] });
  for (const x of [312, 346]) {
    rect(walls, x, 150, 9, 30, FR.stone.mid); rect(walls, x, 150, 3, 30, FR.stone.hi); rect(walls, x + 7, 150, 2, 30, FR.stone.shade);
    poly(walls, [[x - 1, 150], [x + 10, 150], [x + 4.5, 143]], FR.slate.mid);
    rect(walls, x + 3, 139, 3, 3, FR.lit); glow(walls, x + 4, 140, 9, 'rgba(255,200,120,0.55)');
  }
  // the land inside the walls: the parade ground, trodden pink-brown in the dawn
  const g = L('land', { depth: 0.3 });
  vgrad(g, 0, 180, W, H - 180, [[0, '#b89478'], [0.3, '#a0846a'], [1, '#5a4636']]);
  texture(g, r, 0, 180, W, 90, 0.07, 3);
  speckle(g, r, 0, 182, W, 88, ['#c8a488', '#8a6e58', '#7a7a4a'], 700);
  // the road north, out through the gate
  poly(g, [[322, 180], [340, 180], [410, H], [300, H]], '#d2b48e');
  texture(g, r, 300, 180, 110, 90, 0.1, 2, (cc) => { cc.moveTo(322, 180); cc.lineTo(340, 180); cc.lineTo(410, H); cc.lineTo(300, H); });
  for (let i = 0; i < 5; i++) poplar(g, r, 352 + i * 14 + i * i * 3, 186 + i * 10, 22 + i * 7, { trunk: '#4a3a3a', leaves: ['#4e5a3a', '#6a7644', '#9aa05a'] }, -1);
  // the headquarters, a little way off across the parade ground, and the watchtower by the gate
  const hq = L('hq', { depth: 0.32 });
  hq.save(); hq.translate(120, 190); hq.scale(0.72, 0.72); frHQ(hq, r, 0, 0); hq.restore();
  hq.save(); hq.translate(292, 192); hq.scale(0.8, 0.8); frTower(hq, r, 0, 0); hq.restore();
  // the regiment's colours on the dome, and the tricolour on its tall mast
  const fl = L('flagHQ', { depth: 0.32, anim: sway(3, 1.8, { ox: 0, oy: 0 }) });
  frTricolour(fl, 121, 87, 13, 8);
  // rows of tents
  const tents = L('tents', { depth: 0.4 });
  for (const [x, y, s] of [[200, 196, 10], [228, 198, 11], [258, 196, 10], [440, 196, 10], [466, 199, 11], [20, 196, 10]]) frTent(tents, x, y, s);
  for (const [x, y, s] of [[30, 232, 20], [96, 240, 23], [462, 238, 22]]) frTent(tents, x, y, s, { pennant: true });
  // stacked rifles, the drum, crates, the fire, a field gun and its shot
  const camp = L('camp', { depth: 0.5 });
  frRifles(camp, 160, 238); frRifles(camp, 186, 240);
  ellipse(camp, 272, 240, 12, 4, '#8a2e2e'); rect(camp, 260, 228, 24, 12, '#b83a3a'); ellipse(camp, 272, 228, 12, 4, '#e8dcc8');
  for (let k = 0; k < 5; k++) line(camp, 262 + k * 5, 229, 265 + k * 5, 239, '#e8d8a0', 1);
  for (const [x, y, w, hh] of [[132, 244, 20, 12], [146, 236, 16, 20]]) { rect(camp, x, y, w, hh, '#7a5a3a'); rect(camp, x, y, w, 2, '#b08a5a'); line(camp, x, y, x + w, y + hh, '#5a3e28', 1); }
  ellipse(camp, 222, 246, 20, 5, '#3a2a22');
  for (let k = 0; k < 6; k++) line(camp, 206 + k * 6, 248, 214 + k * 4, 238, '#5a3a24', 2);
  for (let k = 0; k < 6; k++) ellipse(camp, 222 + r.r(-7, 7), 238 + r.r(-5, 2), r.r(2, 4), r.r(3, 7), r.pick(['#ffb040', '#ff7a2a', '#ffd070']));
  glow(camp, 222, 238, 60, 'rgba(255,150,70,0.45)');
  camp.save(); camp.translate(420, 250); camp.scale(1.3, 1.3); frGun(camp, 0, 0, -1); camp.restore();
  frShot(camp, 440, 252);
  // the great flagpole and the regiment's banner
  rect(camp, 10, 118, 2, 128, '#3a2e2a'); rect(camp, 10, 118, 1, 128, '#7a6a60'); circle(camp, 11, 117, 2, FR.gold.lit);
  const f1 = L('flag10', { depth: 0.5, anim: sway(3, 2, { ox: 0, oy: 0 }) });
  frTricolour(f1, 12, 119, 26, 14);
  frBannerPole(camp, 356, 244, 64);
  const f2 = L('banner356', { depth: 0.5, anim: sway(1.5, 2.6, { ox: 0, oy: 0 }) });
  frBannerCloth(f2, 356, 244, 'eagle', 64);
  const gr = L('grass', { depth: 0.6, anim: sway(4, 3.2) });
  tufts(gr, r, 0, 248, W, 22, 90, ['#3a3a22', '#56562e', '#78783e']);
  return { colors: 80, vignette: [0.3, '40,20,40'] };
};

// ---------------------------------------------------------------- the Joncours' bedroom at night
SCENES.joncour_bedroom = (c, L) => {
  const r = rng(311);
  const o = { bx0: 100, by0: 40, bx1: 380, by1: 176 };
  room(c, r, { ...o, ceiling: '#1c1a2e', left: '#2e2c48', right: '#2a2842', back: '#34324f', floor: '#2e2230', plankLine: '#221826', seam: '#1a1626', skirting: '#221c2e' });
  texture(c, r, 0, 0, W, 190, 0.04, 3);
  for (let y = o.by0 + 8; y < o.by1 - 8; y += 12) for (let x = o.bx0 + 6 + ((y / 12) % 2) * 7; x < o.bx1 - 4; x += 14) px(c, x, y, '#44426a');
  // the window: the garden under the moon
  const view = (x, y, w, h) => {
    vgrad(c, x, y, w, h, [[0, '#0a1030'], [0.6, '#1e2a5a'], [1, '#3a4a7a']]);
    stars(c, r, 26, x, y, w, h * 0.5);
    moon(c, x + w * 0.7, y + h * 0.28, 7, { seed: 5 });
    for (let k = 0; k < 4; k++) crown(c, r, x + 12 + k * (w / 4), y + h * 0.84, 10, 12, ['#0e1428', '#18203c', '#2a3a60'], { x: 0.5, y: -0.6 }, 10);
    rect(c, x, y + h * 0.9, w, h * 0.1, '#10162a');
  };
  viewWindow(c, 186, 52, 108, 90, view, { frame: '#8a8aa8', sill: '#6a6a86', bars: 3 });
  for (const [x, s] of [[176, 1], [304, -1]]) {
    const cu = L(`curtain${x}`, { depth: 0.5, anim: sway(0.9, r.r(6, 8), { oy: 0 }) });
    poly(cu, [[x, 46], [x + s * 16, 46], [x + s * 12, 156], [x - s * 2, 160]], '#3a3a6a');
    for (let k = 0; k < 3; k++) line(cu, x + s * (3 + k * 4), 48, x + s * (2 + k * 3.5), 156, '#2a2a52', 1);
  }
  // moonlight falling across the bed
  shaft(c, [[190, 142], [292, 142], [360, 250], [200, 250]], 'rgba(180,200,255,1)', 0.14);
  // the bed: a carved headboard, two pillows, a pale cover thrown back
  const bed = L('bed', { depth: 0.55 });
  rect(bed, 150, 150, 180, 36, '#4a3040'); rect(bed, 150, 150, 180, 4, '#6a4a5a');
  for (let k = 0; k < 5; k++) rect(bed, 160 + k * 34, 158, 20, 22, '#3a2432');
  poly(bed, [[136, 186], [344, 186], [372, 244], [108, 244]], '#e4e0f0');
  poly(bed, [[136, 186], [344, 186], [350, 198], [130, 198]], '#c8c4dc');
  ellipse(bed, 196, 192, 30, 9, '#f4f2fa'); ellipse(bed, 286, 192, 30, 9, '#f4f2fa');
  poly(bed, [[112, 214], [368, 210], [376, 244], [106, 248]], '#8a86b0');
  for (let k = 0; k < 6; k++) line(bed, 120 + k * 42, 214, 116 + k * 44, 246, '#6e6a96', 1);
  rect(bed, 104, 244, 274, 6, '#3a2432');
  rect(bed, 108, 250, 6, 14, '#2a1a24'); rect(bed, 368, 250, 6, 14, '#2a1a24');
  // the nightstand and a candle burning low
  rect(bed, 386, 198, 40, 30, '#4a3040'); rect(bed, 386, 198, 40, 3, '#6a4a5a'); rect(bed, 392, 228, 4, 20, '#2a1a24'); rect(bed, 416, 228, 4, 20, '#2a1a24');
  candle(bed, 404, 196, true);
  glow(bed, 405, 190, 22, 'rgba(255,170,90,0.22)');
  rect(bed, 412, 194, 10, 3, '#e8e0c8');
  return { colors: 60, vignette: [0.5, '4,6,24'] };
};

// ---------------------------------------------------------------- the cemetery, two graves side by side
SCENES.cemetery_two = (c, L) => cemeteryScene(c, L, 'dusk', { two: true });

// ---------------------------------------------------------------- a house in the hills of Japan, in the rain
SCENES.yuki_house = (c, L) => {
  const r = rng(321);
  // outside the open screens: a garden drowning in rain
  vgrad(c, 0, 0, W, 200, [[0, '#3a4450'], [0.6, '#5a6a70'], [1, '#6a7a70']]);
  hill(c, r, 60, 470, 120, 30, '#4a5a5e');
  for (let i = 0; i < 26; i++) crown(c, r, 100 + r() * 300, 150 + r() * 40, r.r(10, 18), r.r(6, 10), ['#2e4234', '#3e5440', '#5a6e52'], { x: 0, y: -1 }, 10);
  rect(c, 110, 176, 280, 24, '#3a4a44');
  for (let i = 0; i < 20; i++) rect(c, 120 + r() * 260, 182 + r() * 14, r.r(4, 12), 1, '#8a9aa0');
  const maple = L('maple', { depth: 0.2, anim: sway(1, 6) });
  trunk(maple, 170, 190, 60, 7, 4, '#3a2a24', '#2a1e1a');
  crown(maple, r, 176, 110, 46, 30, ['#6a2a24', '#9a3a2a', '#c85a3a'], { x: -0.5, y: -0.7 }, 40);
  // the room: dark wood, paper screens pushed open, a futon on the tatami
  const rm = L('room', { depth: 0.5 });
  rect(rm, 0, 0, W, H, '#5a3a24');
  rect(rm, 0, 0, W, 28, '#3a2416'); for (let x = 0; x < W; x += 30) rect(rm, x, 0, 2, 28, '#26160c');
  rect(rm, 0, 28, W, 8, '#4a2e1c');
  const shoji = (x0, x1, y0, y1) => {
    vgrad(rm, x0, y0, x1 - x0, y1 - y0, [[0, '#cfc6b0'], [1, '#aaa290']]);
    for (let x = x0; x <= x1; x += 13) rect(rm, x, y0, 2, y1 - y0, '#4a2e1c');
    for (let y = y0; y <= y1; y += 18) rect(rm, x0, y, x1 - x0, 2, '#4a2e1c');
  };
  shoji(0, 96, 40, 196); shoji(384, W, 40, 196);
  rm.clearRect(100, 38, 280, 158);
  for (const x of [96, 236, 380]) { rect(rm, x, 28, 6, 172, '#26160c'); rect(rm, x, 28, 2, 172, '#7a5a3a'); }
  rect(rm, 100, 194, 280, 4, '#26160c');
  poly(rm, [[0, 200], [W, 200], [W, H], [0, H]], '#8a7a4e');
  const fl = (x0, y0, x1, y1) => line(rm, x0, y0, x1, y1, '#5a4a2a', 2);
  fl(0, 222, W, 216); fl(0, 250, W, 244); fl(140, 200, 60, H); fl(300, 200, 330, H);
  texture(rm, r, 0, 200, W, 70, 0.05, 3);
  // the futon, a folded quilt, a low table with a teapot, and a paper lamp
  poly(rm, [[150, 214], [330, 210], [350, 250], [132, 256]], '#d8d2c0');
  poly(rm, [[150, 214], [330, 210], [334, 220], [148, 224]], '#bab4a0');
  poly(rm, [[200, 222], [346, 218], [352, 250], [196, 254]], '#5a6a8a');
  for (let k = 0; k < 5; k++) line(rm, 210 + k * 28, 222, 206 + k * 30, 252, '#4a5876', 1);
  ellipse(rm, 170, 222, 16, 6, '#f0ecdc');
  rect(rm, 390, 226, 52, 6, '#3a2416'); rect(rm, 394, 232, 4, 12, '#26160c'); rect(rm, 434, 232, 4, 12, '#26160c');
  ellipse(rm, 412, 222, 7, 5, '#3a4a3a'); rect(rm, 418, 219, 5, 2, '#3a4a3a');
  rect(rm, 60, 190, 18, 26, '#e8d8b0'); rect(rm, 60, 190, 18, 2, '#3a2416'); rect(rm, 60, 214, 18, 2, '#3a2416');
  for (let k = 1; k < 3; k++) rect(rm, 60 + k * 6, 192, 1, 22, '#c8b890');
  glow(rm, 69, 202, 60, 'rgba(255,200,120,0.35)');
  vgrad(rm, 0, 196, W, 12, [[0, 'rgba(20,10,4,0.4)'], [1, 'rgba(20,10,4,0)']]);
  return { colors: 60, vignette: [0.5, '10,14,20'] };
};
