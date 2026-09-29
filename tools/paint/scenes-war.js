/*
 * The war in Japan, for the cinematic in Chapter 11: a castle burning on the horizon at dusk
 * with an observation balloon over the lines, the battlefield between two armies, and a
 * battery of guns in the smoke. The armies, the guns firing, the shells, the rockets and the
 * gunfire along the horizon are drawn by the game on top (js/scenefx.js).
 */

/** A castle keep: a sloping stone base and white storeys under curving roofs. */
function castle(c, r, x, yb, s, o = {}) {
  const wall = o.wall || '#d8cfc4', roof = o.roof || '#2a2630', stone = o.stone || '#3a3034', lit = o.lit || '#ff9a5a';
  poly(c, [[x - 30 * s, yb], [x + 30 * s, yb], [x + 22 * s, yb - 14 * s], [x - 22 * s, yb - 14 * s]], stone);
  for (let k = 0; k < 5; k++) line(c, x - 28 * s + k * 2 * s, yb - k * 3 * s, x + 28 * s - k * 2 * s, yb - k * 3 * s, 'rgba(0,0,0,0.25)', 1);
  let y = yb - 14 * s;
  const tiers = [[20, 12], [15, 10], [10, 9]];
  tiers.forEach(([hw, hh], i) => {
    rect(c, x - hw * s, y - hh * s, hw * 2 * s, hh * s, wall);
    rect(c, x - hw * s, y - hh * s, 2, hh * s, lit);
    for (let k = -1; k <= 1; k++) rect(c, x + k * hw * 0.5 * s - 1, y - hh * s * 0.6, 2, 2, '#2a2020');
    const ov = (hw + 7) * s, top = y - hh * s;
    poly(c, [[x - ov - 3, top + 2], [x - ov, top - 1], [x - hw * 0.4 * s, top - 7 * s], [x + hw * 0.4 * s, top - 7 * s], [x + ov, top - 1], [x + ov + 3, top + 2]], roof);
    line(c, x - ov, top - 1, x - hw * 0.4 * s, top - 7 * s, lit, 1);
    y = top - 6 * s;
    if (i === tiers.length - 1) { rect(c, x - 2, y - 4 * s, 4, 4 * s, roof); px(c, x - 5 * s, y, '#e8c040'); px(c, x + 5 * s, y, '#e8c040'); }
  });
}

/** A tall column of smoke, leaning with the wind, lit orange from below. */
function smokeColumn(c, r, x, yb, h, lean, dark, lit) {
  // billows from the top down, so the lit ones near the fire sit in front
  for (let i = 90; i >= 0; i--) {
    const t = i / 90;
    const cx = x + lean * t * t + r.r(-2, 2) * (1 + t * 4), cy = yb - t * h;
    const rad = 3 + t * h * 0.16 + r.r(0, 2 + t * 4);
    ellipse(c, cx, cy, rad, rad * 0.85, dark);
    ellipse(c, cx - rad * 0.25, cy - rad * 0.25, rad * 0.55, rad * 0.45, t < 0.3 ? lit : 'rgba(255,255,255,0.06)');
    if (t < 0.4) ellipse(c, cx + rad * 0.1, cy + rad * 0.45, rad * 0.8, rad * 0.35, lit);
  }
}

/** A field gun: a long iron barrel on a wooden carriage with a spoked wheel. */
function fieldGun(c, x, yb, s, dir, o = {}) {
  const iron = o.iron || '#24242c', ironLit = o.ironLit || '#6a6a7a', wood = o.wood || '#4a3020', woodLit = o.woodLit || '#7a5234';
  // trail of the carriage, resting on the ground behind
  poly(c, [[x, yb - 12 * s], [x - dir * 40 * s, yb], [x - dir * 36 * s, yb + 2], [x + dir * 4 * s, yb - 9 * s]], wood);
  line(c, x, yb - 12 * s, x - dir * 40 * s, yb, woodLit, 1);
  // the barrel, raised a little
  const ang = -0.18, len = 46 * s;
  c.save();
  c.translate(x, yb - 16 * s);
  c.scale(dir, 1);
  c.rotate(ang);
  poly(c, [[-12 * s, -4 * s], [len, -2.2 * s], [len, 2.2 * s], [-12 * s, 4 * s]], iron);
  rect(c, -12 * s, -4 * s, len + 12 * s, 1.2 * s, ironLit);
  rect(c, len - 3 * s, -3 * s, 3 * s, 6 * s, iron);
  rect(c, len - 3 * s, -3 * s, 3 * s, 1, ironLit);
  circle(c, -12 * s, 0, 4 * s, iron);
  c.restore();
  // the wheel
  circle(c, x, yb - 11 * s, 11 * s, wood);
  circle(c, x, yb - 11 * s, 9 * s, 'rgba(0,0,0,0)');
  c.save();
  c.globalCompositeOperation = 'destination-out';
  circle(c, x, yb - 11 * s, 8.5 * s, '#000');
  c.restore();
  for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU; line(c, x, yb - 11 * s, x + Math.cos(a) * 9 * s, yb - 11 * s + Math.sin(a) * 9 * s, wood, Math.max(1, s)); }
  circle(c, x, yb - 11 * s, 2 * s, woodLit);
  c.strokeStyle = woodLit; c.lineWidth = 1; c.beginPath(); c.arc(x, yb - 11 * s, 10.5 * s, Math.PI * 1.1, Math.PI * 1.6); c.stroke();
  return { mx: x + dir * Math.cos(ang) * len, my: yb - 16 * s + Math.sin(ang) * len };
}

/** A soldier standing at the guns, in silhouette with a lit edge. */
function gunner(c, x, yb, s, col, lit, pose = 0) {
  rect(c, x - 2 * s, yb - 7 * s, 4 * s, 7 * s, col);
  rect(c, x - 2.5 * s, yb - 15 * s, 5 * s, 8 * s, col);
  circle(c, x, yb - 17 * s, 2.2 * s, col);
  rect(c, x - 3.5 * s, yb - 20 * s, 7 * s, 1.5 * s, col);
  rect(c, x - 2.5 * s, yb - 15 * s, 1, 8 * s, lit);
  if (pose === 1) line(c, x + 2 * s, yb - 13 * s, x + 16 * s, yb - 20 * s, col, Math.max(1, s));
  if (pose === 2) line(c, x - 2 * s, yb - 13 * s, x - 10 * s, yb - 6 * s, col, Math.max(1, s));
}

// ---------------------------------------------------------------- the horizon at dusk: a castle burning
SCENES.war_horizon = (c, L) => {
  const r = rng(1001);
  vgrad(c, 0, 0, W, 186, [[0, '#140a14'], [0.3, '#3a1420'], [0.55, '#7a2222'], [0.75, '#c44a24'], [0.9, '#ff8a3a'], [1, '#ffb860']]);
  // clouds of smoke across the whole sky, their undersides lit by the fires
  const sky = L('smoke_sky', { depth: 0.04, anim: { type: 'drift', t: 260 } });
  wrapped(sky, 11, (cc, rr) => {
    cloudBand(cc, rr, -20, 34, 300, 16, { body: '#26121a', rim: '#c8502a', shadow: '#180a10', hi: '#ff9a4a', lightFromBelow: true });
    cloudBand(cc, rr, 230, 60, 260, 14, { body: '#2e141a', rim: '#e0602a', shadow: '#1c0c12', hi: '#ffb060', lightFromBelow: true });
    cloudBand(cc, rr, 60, 104, 220, 9, { body: '#4a1c1e', rim: '#ff7a38', shadow: '#2e1216', hi: '#ffc070', lightFromBelow: true });
  });
  // the observation balloon over the lines, straining at its rope
  const bal = L('balloon', { depth: 0.08, anim: { type: 'bob', a: 1.5, t: 7 } });
  const bx = 104, by = 78;
  line(bal, bx, by + 22, bx + 18, 186, 'rgba(40,20,20,0.8)', 1);
  circle(bal, bx, by, 15, '#6a3a2e');
  for (let k = -2; k <= 2; k++) { bal.save(); bal.beginPath(); bal.arc(bx, by, 15, 0, TAU); bal.clip(); ellipse(bal, bx + k * 6, by, 2.2, 15, k % 2 ? '#8a4a34' : '#c8a080'); bal.restore(); }
  ellipse(bal, bx - 5, by - 6, 5, 4, 'rgba(255,190,120,0.45)');
  circle(bal, bx, by + 13, 3, '#6a3a2e');
  for (const dx of [-8, -3, 3, 8]) line(bal, bx + dx, by + 10, bx + dx * 0.4, by + 21, '#2a1614', 1);
  rect(bal, bx - 4, by + 21, 8, 5, '#3a2418');
  rect(bal, bx - 4, by + 21, 8, 1, '#8a5a30');
  // mountains, then the castle on its hill, burning
  const far = L('far', { depth: 0.06 });
  ridge(far, r, 186, 26, '#3a1622', { peak: [360, 60, 14] });
  glow(far, 330, 170, 130, 'rgba(255,120,50,0.45)');
  const town = L('town', { depth: 0.1 });
  hill(town, r, 250, 430, 188, 22, '#2a1018');
  castle(town, r, 334, 168, 1, { wall: '#c8b4a4', roof: '#221c24', stone: '#2e1e22', lit: '#ff9050' });
  for (let x = 6; x < 250; x += r.r(9, 16)) jpHouse(town, r, x, 188, r.r(8, 12), r.r(4, 6), { wood: '#1e0e12', plaster: '#3a1a1c', roof: '#1a0c10', roofLight: '#6a2a20' });
  for (let x = 420; x < W; x += r.r(9, 15)) jpHouse(town, r, x, 188, r.r(8, 12), r.r(4, 6), { wood: '#1e0e12', plaster: '#3a1a1c', roof: '#1a0c10', roofLight: '#6a2a20' });
  // fires in the town and the castle's upper floors
  for (const [x, y, s] of [[40, 182, 1], [96, 184, 1.4], [150, 181, 0.8], [210, 184, 1.2], [330, 132, 1], [344, 146, 0.8], [440, 184, 1.1]]) {
    glow(town, x, y - 4 * s, 26 * s, 'rgba(255,130,50,0.6)');
    for (let k = 0; k < 6; k++) ellipse(town, x + r.r(-4, 4) * s, y - r.r(0, 7) * s, r.r(1.5, 3) * s, r.r(3, 6) * s, r.pick(['#ffb040', '#ff7a2a', '#ffd070', '#e0502a']));
  }
  const smoke = L('smoke', { depth: 0.12 });
  smokeColumn(smoke, r, 336, 128, 120, 60, '#2a1418', '#8a3a24');
  smokeColumn(smoke, r, 100, 180, 90, 50, '#2e161a', '#7a3020');
  smokeColumn(smoke, r, 212, 182, 70, 40, '#321a1c', '#7a3020');
  // the plain before it, dark and trampled, a road running to the town
  const land = L('land', { depth: 0.3 });
  vgrad(land, 0, 186, W, H - 186, [[0, '#3a1a18'], [0.3, '#241012'], [1, '#0e0608']]);
  texture(land, r, 0, 186, W, 84, 0.12, 2);
  poly(land, [[236, 188], [244, 188], [300, 230], [340, H], [262, H], [252, 230]], '#3a2220');
  speckle(land, r, 0, 190, W, 80, ['#4a2420', '#2a1414', '#5a2a22'], 700);
  rect(land, 0, 186, W, 1, '#ff9a4a');
  for (const x of [30, 400, 452]) bareTree(land, r, x, 200 + (x % 7), 34, '#120808');
  const grass = L('grass', { depth: 0.7, anim: sway(1.6, 3.4) });
  tufts(grass, r, 0, 248, W, 22, 110, ['#1a0c0c', '#2e1614', '#4a2018']);
  return { colors: 84, vignette: [0.45, '20,4,6'] };
};

// ---------------------------------------------------------------- the battlefield between the armies
SCENES.war_field = (c, L) => {
  const r = rng(1002);
  vgrad(c, 0, 0, W, 170, [[0, '#3a2e30'], [0.35, '#6a5048'], [0.7, '#b07a52'], [1, '#e0a868']]);
  const sm = L('smoke_sky', { depth: 0.04, anim: { type: 'drift', t: 220 } });
  wrapped(sm, 21, (cc, rr) => {
    cloudBand(cc, rr, 0, 40, 240, 14, { body: '#4a3a38', rim: '#c89060', shadow: '#342a2c', hi: '#e8b880', lightFromBelow: true });
    cloudBand(cc, rr, 250, 76, 220, 12, { body: '#5a4640', rim: '#d09a66', shadow: '#3e3232', hi: '#f0c890', lightFromBelow: true });
  });
  const far = L('far', { depth: 0.07 });
  ridge(far, r, 170, 30, '#5a4648', { peak: [120, 40, 12] });
  hill(far, r, 250, 520, 172, 20, '#4e3e40');
  // a pagoda on the far hill, and smoke going up behind the right-hand lines
  const pg = [400, 150];
  for (let k = 0; k < 5; k++) { rect(far, pg[0] - 4 + k * 0.6, pg[1] - k * 7, 8 - k * 1.2, 5, '#3a2e32'); poly(far, [[pg[0] - 9 + k, pg[1] - k * 7], [pg[0] + 9 - k, pg[1] - k * 7], [pg[0] + 5 - k, pg[1] - k * 7 - 3], [pg[0] - 5 + k, pg[1] - k * 7 - 3]], '#2a2226'); }
  line(far, pg[0], pg[1] - 36, pg[0], pg[1] - 44, '#2a2226', 1);
  const smoke = L('smoke', { depth: 0.1 });
  smokeColumn(smoke, r, 330, 176, 100, 60, '#3a3032', '#8a6048');
  smokeColumn(smoke, r, 60, 178, 70, 44, '#403436', '#8a6048');
  // the field: trampled, cratered, a rampart on each side
  const land = L('land', { depth: 0.25 });
  vgrad(land, 0, 168, W, H - 168, [[0, '#7a6a44'], [0.3, '#5a5032'], [1, '#262214']]);
  texture(land, r, 0, 168, W, 102, 0.12, 2);
  speckle(land, r, 0, 170, W, 100, ['#8a7a4a', '#4a4228', '#6a5a34', '#3a3220'], 1100);
  for (let i = 0; i < 16; i++) {
    const x = r.r(60, 420), y = r.r(186, 250), w = r.r(6, 14) * (0.5 + (y - 170) / 80);
    ellipse(land, x, y + 1, w, w * 0.3, '#8a7a50');
    ellipse(land, x, y, w * 0.85, w * 0.24, '#2a2014');
  }
  // the imperial side: sandbags and baskets of earth
  for (let k = 0; k < 9; k++) for (let j = 0; j < 3; j++) ellipse(land, 8 + k * 11 + j * 5, 214 - j * 4, 6, 3, j % 2 ? '#8a7a58' : '#a8966a');
  for (let k = 0; k < 4; k++) { rect(land, 104 + k * 9, 200, 7, 12, '#5a4a30'); for (let y = 201; y < 212; y += 2) rect(land, 104 + k * 9, y, 7, 1, '#7a6440'); }
  // the old order's side: an earthwork with a palisade of sharpened stakes
  poly(land, [[330, 214], [350, 200], [W, 196], [W, 218]], '#4a3e28');
  for (let x = 348; x < W; x += 5) { poly(land, [[x, 202], [x + 3, 202], [x + 1.5, 188 + (x % 3)]], '#3a2a1a'); line(land, x, 202, x + 1, 190, '#6a5030', 1); }
  // a wrecked cart in the middle of it all
  const cart = [236, 226];
  poly(land, [[cart[0] - 14, cart[1] - 6], [cart[0] + 12, cart[1] - 9], [cart[0] + 14, cart[1] - 4], [cart[0] - 12, cart[1] - 1]], '#4a3020');
  circle(land, cart[0] - 8, cart[1] - 1, 5, '#2a1a10'); circle(land, cart[0] - 8, cart[1] - 1, 3.5, '#4a3020');
  // banners of the old order, whipping in the wind behind the palisade
  const banners = [[362, '#f0ece4', '#c83a2a'], [388, '#1a1a1a', '#f0ece4'], [414, '#f0ece4', '#c83a2a'], [446, '#e8c040', '#1a1a1a'], [470, '#f0ece4', '#1a1a1a']];
  for (const [x, cloth, mark] of banners) {
    rect(land, x, 150, 1, 50, '#2a1a10');
    const b = L(`banner${x}`, { depth: 0.26, anim: { type: 'wave', a: 1, t: r.r(1.4, 2.2) } });
    rect(b, x + 1, 152, 7, 26, cloth);
    rect(b, x + 1, 152, 7, 1, '#ffffff');
    circle(b, x + 4.5, 160, 2.2, mark);
    rect(b, x + 1, 150, 9, 2, '#2a1a10');
  }
  // the flag of the imperial army on the left: the sun on red brocade
  rect(land, 64, 146, 1, 60, '#2a1a10');
  const nishiki = L('nishiki', { depth: 0.26, anim: { type: 'wave', a: 1, t: 1.8 } });
  rect(nishiki, 65, 148, 16, 11, '#b8282e');
  circle(nishiki, 71, 153, 3, '#f0c040');
  for (let k = 0; k < 16; k += 3) px(nishiki, 65 + k, 158, '#e8b040');
  // the front: broken spears, a fallen banner, dark grass
  const front = L('front', { depth: 0.8, anim: sway(1.2, 3.6) });
  tufts(front, r, 0, 252, W, 18, 120, ['#1a1a0e', '#2a2814', '#3e3a1e']);
  line(front, 20, 268, 70, 240, '#3a2616', 2); px(front, 70, 240, '#c8c8d0');
  line(front, 400, 270, 452, 250, '#3a2616', 2);
  poly(front, [[452, 250], [470, 254], [466, 266], [446, 262]], '#d8d0c4');
  circle(front, 458, 258, 3, '#b8282e');
  return { colors: 84, vignette: [0.4, '20,10,6'] };
};

// ---------------------------------------------------------------- the guns
SCENES.war_guns = (c, L) => {
  const r = rng(1003);
  vgrad(c, 0, 0, W, 190, [[0, '#1e0e14'], [0.4, '#5a1c1e'], [0.75, '#b8442a'], [1, '#f08a44']]);
  const sm = L('smoke_sky', { depth: 0.04, anim: { type: 'drift', t: 180 } });
  wrapped(sm, 31, (cc, rr) => {
    cloudBand(cc, rr, 0, 50, 260, 18, { body: '#2a1418', rim: '#d8602a', shadow: '#1a0a10', hi: '#ffa050', lightFromBelow: true });
    cloudBand(cc, rr, 240, 96, 240, 12, { body: '#3e1a1c', rim: '#ff7a38', shadow: '#2a1014', hi: '#ffb866', lightFromBelow: true });
  });
  const far = L('far', { depth: 0.08 });
  ridge(far, r, 192, 22, '#3a1a20');
  for (const [x, s] of [[150, 1], [300, 1.3], [420, 0.8]]) { glow(far, x, 188, 30 * s, 'rgba(255,120,50,0.55)'); for (let k = 0; k < 5; k++) ellipse(far, x + r.r(-5, 5), 188 - r.r(0, 6), r.r(1.5, 3), r.r(3, 6), r.pick(['#ffb040', '#ff7a2a', '#e0502a'])); }
  const smoke = L('smoke', { depth: 0.1 });
  smokeColumn(smoke, r, 300, 186, 110, 70, '#2a1418', '#8a3a24');
  const land = L('land', { depth: 0.3 });
  vgrad(land, 0, 190, W, H - 190, [[0, '#3a1e18'], [1, '#120808']]);
  texture(land, r, 0, 190, W, 80, 0.12, 2);
  // the far gun and its crew
  const g2 = L('gun_far', { depth: 0.35 });
  fieldGun(g2, 330, 224, 1.3, 1, { iron: '#1e1a20', ironLit: '#7a5a50', wood: '#3a2418', woodLit: '#7a4a2a' });
  gunner(g2, 290, 226, 1.3, '#1a0e0e', '#d8602e', 1);
  gunner(g2, 400, 226, 1.3, '#1a0e0e', '#d8602e', 0);
  for (let k = 0; k < 6; k++) circle(g2, 430 + (k % 3) * 6 + (k > 2 ? 3 : 0), 222 - (k > 2 ? 5 : 0), 3, '#1a1418');
  // the near gun, big in front, its crew at work
  const g1 = L('gun_near', { depth: 0.55 });
  fieldGun(g1, 118, 262, 2.5, 1, { ironLit: '#8a6a60', woodLit: '#9a5a30' });
  gunner(g1, 40, 264, 2.4, '#140a0a', '#f07a40', 2);
  gunner(g1, 250, 266, 2.2, '#140a0a', '#f07a40', 1);
  // sandbags along the bottom
  const bags = L('bags', { depth: 0.8 });
  for (let k = 0; k < 26; k++) for (let j = 0; j < 2; j++) ellipse(bags, k * 20 + j * 10 - 4, 266 - j * 6, 11, 5, j % 2 ? '#5a4632' : '#6e5a3e');
  for (let k = 0; k < 26; k++) line(bags, k * 20 - 8, 262, k * 20 + 4, 262, '#8a7050', 1);
  return { colors: 80, vignette: [0.45, '20,4,6'] };
};
