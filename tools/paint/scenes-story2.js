/*
 * The scenes added with the branching story: the army camp where it begins, the Joncours'
 * bedroom at night, the cemetery where two people are buried side by side, and the house in
 * the hills where Hervé lives out the life he left France for.
 */

// ---------------------------------------------------------------- the army camp at dawn
SCENES.army_camp = (c, L) => {
  const r = rng(301);
  vgrad(c, 0, 0, W, 160, [[0, '#3c4a7a'], [0.35, '#8a7ea0'], [0.7, '#e8a47a'], [0.92, '#ffd29a'], [1, '#fff0c0']]);
  sun(c, 86, 150, 12, '#fff4d0', 'rgba(255,190,120,0.6)');
  const cl = L('clouds', { depth: 0.05, anim: { type: 'drift', t: 200 } });
  wrapped(cl, 31, (cc, rr) => {
    cloudBand(cc, rr, 180, 36, 260, 9, { body: '#7a6488', rim: '#ffc090', shadow: '#5e4e74', hi: '#ffe6c0', lightFromBelow: true });
    cloudBand(cc, rr, 10, 84, 180, 6, { body: '#a07890', rim: '#ffcc98', shadow: '#846078', hi: '#fff0d0', lightFromBelow: true });
  });
  const far = L('far', { depth: 0.1 });
  hill(far, r, -60, 280, 160, 34, '#7a6a88');
  hill(far, r, 160, 540, 160, 26, '#6e6082');
  treeLine(far, r, 160, 0, W, 5, ['#5a4e70', '#665a7a']);
  // the road home, winding away to the north
  const g = L('land', { depth: 0.3 });
  vgrad(g, 0, 158, W, H - 158, [[0, '#b0a068'], [0.25, '#86864a'], [1, '#2e3620']]);
  texture(g, r, 0, 158, W, 112, 0.08, 3);
  speckle(g, r, 0, 160, W, 110, ['#c8b070', '#7a7a42', '#5a6034'], 900);
  poly(g, [[300, 160], [312, 160], [372, 206], [430, H], [330, H], [322, 206]], '#c8b088');
  texture(g, r, 300, 160, 130, 110, 0.12, 2, (cc) => { cc.moveTo(300, 160); cc.lineTo(312, 160); cc.lineTo(372, 206); cc.lineTo(430, H); cc.lineTo(330, H); cc.lineTo(322, 206); });
  for (let i = 0; i < 6; i++) poplar(g, r, 326 + i * 9 + (i % 2) * 4, 168 - i * 1.5, 30 - i * 3, { trunk: '#4a3a3a', leaves: ['#4e5a3a', '#6a7644', '#9aa05a'] }, -1);
  // rows of canvas tents
  const tent = (cv, x, yb, s) => {
    ellipse(cv, x, yb, s * 1.2, s * 0.18, 'rgba(40,30,30,0.35)');
    poly(cv, [[x - s, yb], [x, yb - s * 0.9], [x + s, yb]], '#e6dcc4');
    poly(cv, [[x, yb - s * 0.9], [x + s, yb], [x + s * 0.2, yb]], '#b8aa90');
    poly(cv, [[x - s * 0.18, yb], [x, yb - s * 0.45], [x + s * 0.18, yb]], '#4a3a30');
    line(cv, x, yb - s * 0.9, x, yb - s * 1.05, '#5a4a3a', 1);
    line(cv, x - s, yb, x - s * 1.25, yb + 1, '#8a7a60', 1);
  };
  const tents = L('tents', { depth: 0.4 });
  for (const [x, y, s] of [[40, 178, 12], [80, 180, 13], [124, 177, 12], [168, 181, 14], [214, 178, 12], [258, 182, 13], [420, 180, 13], [462, 177, 11]]) tent(tents, x, y, s);
  for (const [x, y, s] of [[26, 214, 20], [96, 220, 22], [250, 218, 21], [454, 222, 24]]) tent(tents, x, y, s);
  // stacked rifles, a drum, crates, and the fire
  const camp = L('camp', { depth: 0.5 });
  for (const x of [160, 186]) { line(camp, x - 8, 238, x, 214, '#3a2c24', 2); line(camp, x + 8, 238, x, 214, '#3a2c24', 2); line(camp, x, 238, x, 214, '#4a382c', 2); rect(camp, x - 1, 212, 3, 3, '#8a8a90'); }
  ellipse(camp, 322, 236, 13, 5, '#8a2e2e'); rect(camp, 309, 224, 26, 12, '#b83a3a'); ellipse(camp, 322, 224, 13, 5, '#e8dcc8');
  for (let k = 0; k < 5; k++) line(camp, 310 + k * 6, 225, 313 + k * 6, 235, '#e8d8a0', 1);
  line(camp, 316, 218, 330, 212, '#6a4a2a', 1); line(camp, 320, 218, 334, 214, '#6a4a2a', 1);
  for (const [x, y, w, hh] of [[360, 226, 22, 14], [378, 218, 18, 22]]) { rect(camp, x, y, w, hh, '#7a5a3a'); rect(camp, x, y, w, 2, '#b08a5a'); line(camp, x, y, x + w, y + hh, '#5a3e28', 1); }
  ellipse(camp, 222, 246, 20, 5, '#3a2a22');
  for (let k = 0; k < 6; k++) line(camp, 206 + k * 6, 248, 214 + k * 4, 238, '#5a3a24', 2);
  for (let k = 0; k < 6; k++) ellipse(camp, 222 + r.r(-7, 7), 238 + r.r(-5, 2), r.r(2, 4), r.r(3, 7), r.pick(['#ffb040', '#ff7a2a', '#ffd070']));
  glow(camp, 222, 238, 60, 'rgba(255,150,70,0.45)');
  // flags on poles, stirring in the morning wind
  for (const [x, y, hh] of [[138, 150, 36], [440, 150, 40]]) {
    rect(camp, x, y, 2, hh, '#4a3a2a');
    const f = L(`flag${x}`, { depth: 0.45, anim: sway(3, r.r(1.6, 2.2), { ox: 0, oy: 0 }) });
    rect(f, x + 2, y, 8, 12, '#2e4a9a'); rect(f, x + 10, y, 8, 12, '#f0ece4'); rect(f, x + 18, y, 8, 12, '#c83a3a');
  }
  const gr = L('grass', { depth: 0.6, anim: sway(4, 3.2) });
  tufts(gr, r, 0, 244, W, 26, 90, ['#2a3418', '#44522a', '#66703a']);
  return { colors: 64, vignette: [0.35, '30,20,30'] };
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
