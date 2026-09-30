/*
 * The opening: Japan, before the story reaches it, the way Hervé will first see it. A lone rider
 * (Hervé, in his travelling coat) crosses the country through its seasons: a snow-capped
 * mountain under a storm, with wild horses running; a castle on a misty cliff seen through
 * autumn maples; an avenue of cherry trees in bloom; and a field of golden grass under a blazing
 * sun, where the title comes up. The herd and the galloping rider are drawn by the scene's
 * effects (js/scenefx.js: herd, rider); everything else is painted here.
 */

// ---------------------------------------------------------------- the rider
/** A horse standing side-on, facing right, with Hervé on its back: feet at yb, `s` pixels to the unit. */
function riderSide(c, x, yb, s, p) {
  const u = (v) => v * s;
  c.save();
  c.shadowColor = p.outline || '#3a3430';
  c.shadowOffsetX = 1;
  c.shadowOffsetY = 1;
  c.shadowBlur = 0;
  for (const [lx, col] of [[-6.2, p.dark], [5.6, p.dark], [-7.6, p.coat], [7, p.coat]]) {
    rect(c, x + u(lx), yb - u(9), u(1.6), u(8.4), col);
    rect(c, x + u(lx) - 0.5, yb - u(1.2), u(2), u(1.2), '#2a2220');
  }
  ellipse(c, x - u(0.5), yb - u(12), u(9), u(3.8), p.coat);
  ellipse(c, x - u(7), yb - u(12.8), u(3.6), u(3.8), p.coat);
  ellipse(c, x + u(6.5), yb - u(12.6), u(3.2), u(3.6), p.coat);
  ellipse(c, x - u(0.5), yb - u(9.6), u(8), u(1.4), p.dark);
  ellipse(c, x - u(3), yb - u(14.6), u(6), u(1), p.hi);
  poly(c, [[x + u(5.5), yb - u(15)], [x + u(9.6), yb - u(14.2)], [x + u(12.4), yb - u(22)], [x + u(9.2), yb - u(23.4)]], p.coat);
  poly(c, [[x + u(9.4), yb - u(24.4)], [x + u(12.6), yb - u(23.4)], [x + u(16.4), yb - u(18.6)], [x + u(15), yb - u(17)], [x + u(11), yb - u(19.6)]], p.coat);
  poly(c, [[x + u(10), yb - u(24.2)], [x + u(10.8), yb - u(26.6)], [x + u(11.6), yb - u(24)]], p.coat);
  poly(c, [[x + u(8.6), yb - u(23.6)], [x + u(10.4), yb - u(24.4)], [x + u(6.4), yb - u(15.2)], [x + u(5), yb - u(15.6)]], p.mane);
  px(c, x + u(13), yb - u(21.6), '#1a1412');
  rect(c, x + u(15.2), yb - u(18.4), u(1.2), u(0.8), p.dark);
  poly(c, [[x - u(10.2), yb - u(14.6)], [x - u(8.8), yb - u(14.8)], [x - u(10.6), yb - u(5)], [x - u(12.4), yb - u(5.6)]], p.mane);
  c.restore();
  // Hervé: boot in the stirrup, coat, the reins, his hat
  rect(c, x - u(3.6), yb - u(15.4), u(5), u(2), p.cloth);
  poly(c, [[x - u(1.2), yb - u(16)], [x + u(1.2), yb - u(16)], [x + u(1.6), yb - u(9.6)], [x - u(0.2), yb - u(9.6)]], p.riderDark);
  rect(c, x - u(0.4), yb - u(10), u(2.2), u(1), '#1a1412');
  poly(c, [[x - u(2.6), yb - u(26)], [x + u(2), yb - u(26)], [x + u(2.4), yb - u(16)], [x - u(4.4), yb - u(15.4)]], p.rider);
  rect(c, x - u(2.6), yb - u(26), u(1), u(10), p.riderHi);
  poly(c, [[x + u(0.8), yb - u(24)], [x + u(2.2), yb - u(24.4)], [x + u(5.4), yb - u(19)], [x + u(4.4), yb - u(18.4)]], p.riderDark);
  rect(c, x + u(4.4), yb - u(19.4), u(1.2), u(1.2), p.skin);
  line(c, x + u(5.2), yb - u(18.8), x + u(14.6), yb - u(18.4), '#2a2220', 1);
  rect(c, x - u(1.2), yb - u(29.6), u(3), u(3.8), p.skin);
  rect(c, x - u(1.4), yb - u(29.8), u(1.2), u(3), p.hair);
  rect(c, x - u(1.6), yb - u(34.4), u(3.6), u(4.6), p.hat);
  rect(c, x - u(2.8), yb - u(30.2), u(6), u(0.9), p.hat);
}

/** A horse seen from behind and a little to the left, Hervé on its back looking out at the view. */
function riderBack(c, x, yb, s, p) {
  const u = (v) => v * s;
  // a dark edge under and behind the horse's shapes, so it stands clear of the view
  c.save();
  c.shadowColor = p.outline || '#3a2e2a';
  c.shadowOffsetX = Math.max(1, Math.round(s));
  c.shadowOffsetY = Math.max(1, Math.round(s));
  c.shadowBlur = 0;
  // the far foreleg and the neck and head, turned to the left
  rect(c, x - u(11), yb - u(20), u(2.4), u(19), p.dark);
  poly(c, [[x - u(9), yb - u(33)], [x - u(3), yb - u(34)], [x - u(12), yb - u(50)], [x - u(18), yb - u(47)]], p.coat);
  poly(c, [[x - u(18.4), yb - u(47.6)], [x - u(11.6), yb - u(51)], [x - u(18), yb - u(58)], [x - u(24), yb - u(53)]], p.coat);
  poly(c, [[x - u(15), yb - u(54)], [x - u(14), yb - u(59)], [x - u(12.4), yb - u(53)]], p.coat);
  poly(c, [[x - u(9.6), yb - u(35)], [x - u(6), yb - u(35)], [x - u(12.6), yb - u(50.6)], [x - u(15), yb - u(49)]], p.mane);
  // the hind legs, hocks and hooves
  for (const [lx, col] of [[-8.4, p.coat], [3.4, p.dark]]) {
    poly(c, [[x + u(lx), yb - u(24)], [x + u(lx + 5), yb - u(24)], [x + u(lx + 4), yb - u(12)], [x + u(lx + 3.4), yb - u(1)], [x + u(lx + 1), yb - u(1)], [x + u(lx + 1.4), yb - u(12)]], col);
    rect(c, x + u(lx + 0.6), yb - u(1.4), u(3.4), u(1.4), '#2a2220');
  }
  // the rump, round and lit from the left, and the tail hanging down its middle
  ellipse(c, x, yb - u(30), u(11.5), u(9.5), p.coat);
  ellipse(c, x + u(4), yb - u(28), u(6.5), u(7.5), p.dark);
  ellipse(c, x - u(4.5), yb - u(33), u(5), u(4.5), p.hi);
  poly(c, [[x - u(1.6), yb - u(38)], [x + u(1.8), yb - u(38)], [x + u(2.6), yb - u(12)], [x + u(0.4), yb - u(9)], [x - u(2.4), yb - u(13)]], p.mane);
  line(c, x, yb - u(36), x + u(0.6), yb - u(12), p.maneHi || p.hi, 1);
  c.restore();
  // Hervé: a boot on either side, the travelling bag, his back in the long coat, his hat
  poly(c, [[x - u(12.4), yb - u(40)], [x - u(8.6), yb - u(40)], [x - u(9.4), yb - u(28)], [x - u(11.8), yb - u(28)]], p.riderDark);
  poly(c, [[x + u(8.6), yb - u(40)], [x + u(12.2), yb - u(40)], [x + u(11.4), yb - u(28)], [x + u(9), yb - u(28)]], p.riderDark);
  rect(c, x + u(6), yb - u(42), u(6), u(7), p.bag);
  rect(c, x + u(6), yb - u(42), u(6), u(1), p.bagHi);
  poly(c, [[x - u(9), yb - u(38)], [x + u(9), yb - u(38)], [x + u(8), yb - u(58)], [x + u(5), yb - u(61)], [x - u(5), yb - u(61)], [x - u(8), yb - u(58)]], p.rider);
  poly(c, [[x - u(9), yb - u(38)], [x - u(5.4), yb - u(38)], [x - u(3.4), yb - u(60)], [x - u(5), yb - u(61)], [x - u(8), yb - u(58)]], p.riderHi);
  line(c, x + u(0.4), yb - u(60), x + u(0.8), yb - u(38), p.riderDark, 1);
  rect(c, x - u(2.6), yb - u(66), u(5.2), u(5.6), p.hair);
  rect(c, x - u(2.6), yb - u(62), u(1), u(2), p.skin);
  rect(c, x - u(6), yb - u(66.4), u(12), u(1.4), p.hat);
  rect(c, x - u(3.4), yb - u(74), u(6.8), u(8), p.hat);
  rect(c, x - u(3.4), yb - u(74), u(1.2), u(8), p.hatHi || p.riderHi);
}

/** A castle keep of Japan: a stone base, white storeys under sweeping roofs, gold at the ridge. */
function tenshu(c, x, yb, s, p) {
  const u = (v) => v * s;
  poly(c, [[x - u(17), yb], [x + u(17), yb], [x + u(13), yb - u(10)], [x - u(13), yb - u(10)]], p.stone);
  for (let k = 1; k < 4; k++) line(c, x - u(17 - k), yb - u(k * 2.6), x + u(17 - k), yb - u(k * 2.6), p.stoneDark, 1);
  let y = yb - u(10);
  const tiers = [[24, 7], [19, 6.5], [14, 6], [9.5, 6]];
  tiers.forEach(([w, hh], i) => {
    rect(c, x - u(w / 2), y - u(hh), u(w), u(hh), p.wall);
    rect(c, x - u(w / 2), y - u(hh), u(1.2), u(hh), p.wallLit);
    rect(c, x + u(w / 2 - 1.4), y - u(hh), u(1.4), u(hh), p.wallShade);
    for (let k = -w / 2 + 2.5; k < w / 2 - 1; k += 3) rect(c, x + u(k), y - u(hh * 0.6), u(1.2), u(1.6), p.window);
    // the roof over each storey, its eaves flaring up at the corners
    const ew = w / 2 + 3.2;
    poly(c, [[x - u(ew), y - u(hh) + u(0.6)], [x - u(ew - 1.2), y - u(hh) - u(1.4)], [x + u(ew - 1.2), y - u(hh) - u(1.4)], [x + u(ew), y - u(hh) + u(0.6)], [x + u(w / 2), y - u(hh) - u(0.4)], [x - u(w / 2), y - u(hh) - u(0.4)]], p.roof);
    rect(c, x - u(ew - 1.2), y - u(hh) - u(1.4), u((ew - 1.2) * 2), u(0.6), p.roofLit);
    if (i === 1) poly(c, [[x - u(4), y - u(hh) - u(1.4)], [x + u(4), y - u(hh) - u(1.4)], [x, y - u(hh) - u(4.4)]], p.roof);
    y -= u(hh) + u(1.4);
  });
  poly(c, [[x - u(6), y + u(0.2)], [x + u(6), y + u(0.2)], [x + u(2), y - u(3.6)], [x - u(2), y - u(3.6)]], p.roof);
  for (const k of [-2.4, 2]) rect(c, x + u(k), y - u(4.6), u(0.8), u(1.2), p.gold);
  return y - u(4.6);
}

/** A five-storeyed pagoda: narrow storeys, wide eaves, a tall spire of rings. */
function pagoda(c, x, yb, s, col, lit) {
  const u = (v) => v * s;
  let y = yb;
  for (let i = 0; i < 5; i++) {
    const w = 7 - i * 0.8, ew = w + 3.6 - i * 0.3, hh = 4.4;
    rect(c, x - u(w / 2), y - u(hh), u(w), u(hh), col);
    poly(c, [[x - u(ew), y - u(hh) + u(0.6)], [x - u(w / 2), y - u(hh) - u(1.2)], [x + u(w / 2), y - u(hh) - u(1.2)], [x + u(ew), y - u(hh) + u(0.6)]], col);
    rect(c, x - u(ew) + 1, y - u(hh) + u(0.2), u(ew * 2) - 2, 1, lit);
    y -= u(hh) + u(1.2);
  }
  rect(c, x - u(0.4), y - u(9), u(0.8), u(9), col);
  for (let k = 1; k < 6; k++) rect(c, x - u(1), y - u(k * 1.5), u(2), 1, col);
}

/** Mist in pixels: long thin streaks of pale colour, broken and overlapping, thicker in the middle. */
function mistStreaks(c, r, x0, x1, y0, y1, n, cols) {
  for (let i = 0; i < n; i++) {
    const y = y0 + (y1 - y0) * (0.5 + (r() - 0.5) * r() * 1.2), x = r.r(x0 - 40, x1), len = r.r(20, 110);
    rect(c, x, y, len, 1, r.pick(cols));
    if (r() < 0.5) rect(c, x + r.r(4, 12), y + 1, len * r.r(0.4, 0.8), 1, r.pick(cols));
  }
}

// ---------------------------------------------------------------- 1. the mountain, under a storm
SCENES.op_mountain = (c, L) => {
  const r = rng(911);
  vgrad(c, 0, 0, W, 184, [[0, '#2a2f3a'], [0.3, '#454b58'], [0.58, '#737985'], [0.8, '#b4b8b8'], [0.93, '#e2e0d2'], [1, '#f2ecd6']]);
  glow(c, 80, 170, 170, 'rgba(255,246,214,0.4)');
  // heavy clouds rolling over, and a lower, lighter bank round the peak
  const hi = L('storm_high', { depth: 0.02, anim: { type: 'drift', t: 560 } });
  wrapped(hi, 41, (cc, rr) => {
    const o = { body: '#383d48', rim: '#8e949c', shadow: '#282c36', hi: '#bcc0c6', lightFromBelow: true };
    cloudBand(cc, rr, -30, 16, 310, 30, o);
    cloudBand(cc, rr, 210, 10, 320, 34, o);
    cloudBand(cc, rr, 40, 44, 260, 22, { ...o, body: '#434854' });
    cloudBand(cc, rr, 300, 50, 230, 20, { ...o, body: '#434854' });
  });
  const lo = L('storm_low', { depth: 0.04, anim: { type: 'drift', t: 380 } });
  wrapped(lo, 42, (cc, rr) => {
    const o = { body: '#5e6470', rim: '#c4c8cc', shadow: '#4a505c', hi: '#e2e4e4', lightFromBelow: true };
    cloudBand(cc, rr, 10, 82, 190, 12, o);
    cloudBand(cc, rr, 250, 76, 240, 14, o);
  });
  // the mountain: a great cone with snow on its shoulders, lit from the bright west
  const mt = L('mountain', { depth: 0.06 });
  const mx = 300, top = 74, base = 178, half = 230;
  const prof = (x) => top + (base - top) * (1 - Math.pow(1 - Math.min(1, Math.abs(x - mx) / half), 1.9));
  const pts = [];
  for (let x = mx - half; x <= mx + half; x += 2) pts.push([x, Math.max(top + 1, prof(x))]);
  pts.push([mx + half, base + 4], [mx - half, base + 4]);
  poly(mt, pts, '#4a5654');
  poly(mt, pts.filter((q, i) => i < pts.length / 2 - 3 || i >= pts.length - 2).concat([[mx - 6, base + 4]]), '#62706a');
  const snowline = (x) => 112 + Math.abs(Math.sin(x * 0.19)) * 12 + Math.abs(Math.sin(x * 0.05)) * 6;
  const snow = [];
  for (let x = mx - 70; x <= mx + 70; x += 2) snow.push([x, Math.max(top + 1, prof(x))]);
  for (let x = mx + 70; x >= mx - 70; x -= 2) snow.push([x, Math.max(prof(x) + 1, snowline(x))]);
  poly(mt, snow, '#c6ced6');
  poly(mt, snow.filter(([x]) => x <= mx + 4), '#eef2f4');
  for (let k = 0; k < 16; k++) { const gx = mx - 60 + k * 8 + r.r(-2, 2); line(mt, gx, snowline(gx) - 4, gx + r.r(-6, 6), snowline(gx) + r.r(8, 18), 'rgba(60,70,72,0.5)', 1); }
  for (let k = 0; k < 9; k++) { const gx = mx - 40 + k * 10; line(mt, gx * 0.9 + mx * 0.1, top + 8, gx, snowline(gx) - 2, 'rgba(150,160,176,0.5)', 1); }
  hill(mt, r, mx - half, mx + half, base + 2, 22, '#344034');
  treeLine(mt, r, base + 2, mx - half + 20, mx + half - 20, 3, ['#2e3a2e', '#3e4c3a']);
  // the plain beyond: fields, the white-blossom orchards at the mountain's foot
  const far = L('far', { depth: 0.1 });
  rect(far, 0, 176, W, 20, '#7a8a58');
  hill(far, r, -40, 260, 180, 8, '#6e8050');
  for (let x = 250; x < W + 10; x += r.r(9, 15)) {
    const yb = 180 + r.r(-2, 4), hh = r.r(10, 18);
    trunk(far, x, yb, hh * 0.5, 1.4, 1, '#4a3a34');
    crown(far, r, x, yb - hh * 0.7, hh * 0.55, hh * 0.38, ['#a8b0ac', '#d8dcd6', '#f2f2ea', '#ffffff'], { x: -0.7, y: -0.6 }, 16);
  }
  for (let x = 0; x < 200; x += r.r(12, 22)) { const hh = r.r(6, 10); crown(far, r, x, 181 - hh * 0.5, hh * 0.5, hh * 0.4, ['#3e4c34', '#56643e', '#7a8850'], { x: -0.7, y: -0.6 }, 10); }
  // the grassland, gold and green, a stream winding through it
  const mid = L('plain', { depth: 0.16 });
  vgrad(mid, 0, 186, W, 40, [[0, '#8a9a5a'], [0.5, '#7a8e4a'], [1, '#6a7c3e']]);
  texture(mid, r, 0, 186, W, 40, 0.1, 2);
  for (let i = 0; i < 26; i++) { mid.globalAlpha = 0.5; ellipse(mid, r() * W, r.r(190, 222), r.r(20, 60), r.r(2, 4), r.pick(['#c8b868', '#b8a858', '#9aa860'])); }
  mid.globalAlpha = 1;
  const stream = (cv, y0, amp, w0, w1) => {
    for (let x = -4; x < W + 4; x += 1) {
      const t = x / W, y = y0 + Math.sin(x * 0.018 + 1.2) * amp + t * 6, w = w0 + (w1 - w0) * t;
      rect(cv, x, y - w / 2, 1, w, '#3e6e74');
      rect(cv, x, y - w / 2, 1, 1, '#2e4e50');
      if (r() < 0.25) rect(cv, x, y - w / 2 + 1 + r() * (w - 2), r.r(1, 4), 1, r.pick(['#9ac8c8', '#cfe6e2', '#6a9ea2']));
    }
  };
  stream(mid, 206, 7, 3, 8);
  rock(mid, r, 390, 200, 12, 7, { dark: '#3a3e3a', mid: '#5a5e58', lit: '#8a8e84' });
  // the near grass: tall, golden, laid over by the wind
  const near = L('near', { depth: 0.28, anim: sway(0.5, 5, { oy: 1 }) });
  vgrad(near, 0, 214, W, H - 214, [[0, '#b8a050'], [0.4, '#a08a40'], [1, '#6a5a2a']]);
  for (let i = 0; i < 1500; i++) {
    const y = 216 + Math.pow(r(), 0.8) * 54, x = r() * W, hh = 2 + (y - 214) * 0.12;
    line(near, x, y, x + r.r(0, 3), y - hh, r.pick(['#e2cc7a', '#c8ae5a', '#f0e0a0', '#8a7438']), 1);
  }
  stream(near, 262, 4, 10, 18);
  // Hervé on a pale horse, watching the mountain
  const rd = L('rider', { depth: 0.3, anim: { type: 'bob', a: 0.4, t: 3.4 } });
  riderSide(rd, 110, 240, 2.1, { coat: '#e8dcc8', dark: '#bca890', hi: '#f8f0e2', mane: '#f2eadc', cloth: '#7a2a2a', rider: '#2a2832', riderDark: '#1a1820', riderHi: '#46444e', skin: '#e8c0a0', hair: '#3a2a20', hat: '#16141a' });
  const front = L('front', { depth: 0.7, anim: sway(1.6, 4.2, { oy: 1 }) });
  for (let i = 0; i < 90; i++) {
    const x = i < 60 ? r.r(-10, 170) : r.r(380, W + 10), hh = r.r(18, 46), lean = r.r(0.2, 0.9);
    for (let t = 0; t < 1; t += 1 / hh) px(front, x + lean * hh * 0.4 * t * t, H + 1 - hh * t, t > 0.7 ? '#f4e2a0' : r() < 0.5 ? '#b89a4a' : '#8a7036');
  }
  return { colors: 92, vignette: [0.32, '20,22,30'] };
};

// ---------------------------------------------------------------- 2. the castle on the cliff, through autumn maples
SCENES.op_autumn = (c, L) => {
  const r = rng(912);
  vgrad(c, 0, 0, W, H, [[0, '#5a5a62'], [0.18, '#8a8a92'], [0.42, '#c8c8c8'], [0.7, '#e2e0da'], [1, '#d6d2c8']]);
  const cl = L('clouds', { depth: 0.03, anim: { type: 'drift', t: 420 } });
  wrapped(cl, 51, (cc, rr) => {
    const o = { body: '#4e4e58', rim: '#9e9ea6', shadow: '#3e3e48', hi: '#c8c8cc', lightFromBelow: true };
    cloudBand(cc, rr, 0, 14, 300, 24, o);
    cloudBand(cc, rr, 240, 22, 280, 20, o);
  });
  // the cliff, sheer and grey, the keep on its brow, the walls running off along the top
  const cliff = L('cliff', { depth: 0.07 });
  const C = { col: '#8a8a94', lit: '#b2b2ba', dark: '#70707c', deep: '#585868' };
  // the mass of rock, craggy at its edges
  const out = [[132, 198]];
  for (let y = 196; y > 96; y -= 6) out.push([150 + (196 - y) * 0.3 + r.r(-4, 4), y]);
  out.push([184, 86], [214, 80], [260, 84], [320, 88], [370, 90], [392, 98]);
  for (let y = 104; y < 198; y += 6) out.push([396 + (y - 104) * 0.1 + r.r(-3, 5), y]);
  out.push([414, 198]);
  poly(cliff, out, C.col);
  // its faces: the lit western one, hollows in shadow, crevices running down, ledges across
  poly(cliff, [[134, 198], [150, 150], [166, 110], [184, 88], [202, 86], [192, 124], [184, 164], [180, 198]], C.lit);
  for (let k = 0; k < 8; k++) { const x = r.r(204, 372), y = r.r(98, 150); poly(cliff, [[x, y], [x + r.r(10, 22), y + r.r(4, 10)], [x + r.r(4, 14), y + r.r(30, 60)], [x - r.r(4, 10), y + r.r(20, 40)]], C.dark); }
  for (let k = 0; k < 16; k++) { let x = r.r(188, 396), y = r.r(90, 118); while (y < 196) { const nx = x + r.r(-2, 2), ny = y + r.r(3, 7); line(cliff, x, y, nx, ny, C.deep, 1); x = nx; y = ny; } }
  for (let k = 0; k < 9; k++) { const y = r.r(104, 186), x = r.r(170, 330); line(cliff, x, y, x + r.r(18, 56), y + r.r(-1, 2), '#a4a4ae', 1); }
  texture(cliff, r, 130, 78, 290, 122, 0.08, 2, (cc) => { out.forEach(([x, y], i) => (i ? cc.lineTo(x, y) : cc.moveTo(x, y))); });
  const kp = { stone: '#7a7a82', stoneDark: '#5a5a64', wall: '#e4e0d8', wallLit: '#f6f2ea', wallShade: '#b8b4ae', window: '#4a4650', roof: '#3e3e4a', roofLit: '#6a6a78', gold: '#c8a060' };
  tenshu(cliff, 214, 82, 1.35, kp);
  for (let x = 250; x < 370; x += 3) rect(cliff, x, 84 + (x - 250) * 0.06, 3, 4, '#d6d2ca');
  rect(cliff, 250, 83, 120, 1, '#3e3e4a');
  for (const [x, y] of [[296, 87], [352, 90]]) { rect(cliff, x - 4, y - 9, 8, 9, '#dcd8d0'); poly(cliff, [[x - 6, y - 8], [x + 6, y - 8], [x + 3, y - 12], [x - 3, y - 12]], '#3e3e4a'); }
  // the waterfall pouring off the cliff's western side
  for (let y = 104; y < 196; y++) { const w = 2 + (y - 104) * 0.04; rect(cliff, 152 + (196 - y) * 0.26 - 2, y, w, 1, r() < 0.3 ? '#ffffff' : '#dfe6ee'); }
  // mist lying in the valley and round the cliff's foot
  const mist = L('mist', { depth: 0.09, anim: { type: 'drift', t: 240 } });
  wrapped(mist, 52, (cc, rr) => mistStreaks(cc, rr, 0, W, 150, 198, 60, ['#d4d4d6', '#dcdcdc', '#e2e2e0']));
  // the valley below, full of red trees in the haze
  const vale = L('valley', { depth: 0.13 });
  for (let y = 184; y < 244; y += 5) for (let x = -10; x < W + 10; x += r.r(10, 16)) crown(vale, r, x, y + r.r(-3, 3), r.r(8, 14), r.r(5, 8), y < 206 ? ['#b8887a', '#cc9a84', '#e0b09a', '#f0cab4'] : ['#a0583e', '#bc6a48', '#d88a62', '#f0ae84'], { x: -0.6, y: -0.7 }, 12);
  mistStreaks(vale, r, 0, W, 186, 204, 50, ['#e6e2dc', '#dcd6d0']);
  // a knoll where the rider has stopped
  const knoll = L('knoll', { depth: 0.22 });
  hill(knoll, r, 150, 520, 238, 32, '#9a4a2a');
  for (let i = 0; i < 40; i++) crown(knoll, r, r.r(170, 490), r.r(214, 236), r.r(6, 12), r.r(3, 6), ['#8a3418', '#b04824', '#d06230', '#f0904a'], { x: -0.5, y: -0.8 }, 10);
  const rd = L('rider', { depth: 0.3, anim: { type: 'bob', a: 0.35, t: 3.8 } });
  riderBack(rd, 318, 256, 1.5, { coat: '#e4cc9a', dark: '#b89a68', hi: '#f6e6c0', mane: '#f0dca8', maneHi: '#fff4d8', rider: '#262430', riderDark: '#16141c', riderHi: '#3e3c48', skin: '#e0b898', hair: '#2e2420', hat: '#141218', hatHi: '#2e2c36', bag: '#8a5a34', bagHi: '#b07a4a' });
  // the maples framing the view: slim trunks on the left, a mass of leaves on the right
  const maple = ['#7a2410', '#b03a18', '#d85a26', '#f48a44'];
  const left = L('maples_left', { depth: 0.45, anim: sway(0.7, 6, { oy: 1 }) });
  for (const [x, lean] of [[18, 0.1], [46, -0.06], [84, 0.12]]) {
    branch(left, x, H, x + lean * 120, 0, 3, '#3a2a24');
    for (let k = 0; k < 5; k++) { const y = r.r(10, 160); branch(left, x + lean * (H - y) * 0.45, y, x + lean * (H - y) * 0.45 + r.r(10, 36), y - r.r(10, 26), 1, '#3a2a24'); }
  }
  for (let i = 0; i < 16; i++) crown(left, r, r.r(-20, 120), r.r(-10, 120), r.r(14, 30), r.r(8, 18), maple, { x: 0.6, y: -0.6 }, 20);
  const right = L('maples_right', { depth: 0.5, anim: sway(0.6, 6.8, { oy: 1 }) });
  branch(right, 470, H, 440, 40, 5, '#3a2a24');
  branch(right, 452, 120, 380, 70, 2, '#3a2a24');
  for (let i = 0; i < 24; i++) crown(right, r, r.r(380, W + 30), r.r(-20, 200), r.r(18, 34), r.r(10, 20), maple, { x: -0.6, y: -0.6 }, 22);
  for (let i = 0; i < 6; i++) crown(right, r, r.r(340, 400), r.r(20, 90), r.r(10, 18), r.r(6, 10), maple, { x: -0.6, y: -0.6 }, 12);
  // the undergrowth in front, burning with colour
  const brush = L('brush', { depth: 0.72, anim: sway(1.2, 4.6, { oy: 1 }) });
  for (let i = 0; i < 60; i++) {
    const x = r.r(-20, W + 20), y = r.r(236, 290);
    crown(brush, r, x, y, r.r(16, 34), r.r(10, 18), ['#6a1c0c', '#a0321a', '#d05426', '#f68a4a'], { x: -0.3, y: -0.9 }, 18);
  }
  return { colors: 92, vignette: [0.3, '40,20,10'] };
};

// ---------------------------------------------------------------- 3. the cherry trees in bloom
SCENES.op_sakura = (c, L) => {
  const r = rng(913);
  vgrad(c, 0, 0, W, 180, [[0, '#2e5ea8'], [0.45, '#5a8ccc'], [0.8, '#9cc0e6'], [1, '#cfe0f0']]);
  const cl = L('clouds', { depth: 0.03, anim: { type: 'drift', t: 360 } });
  wrapped(cl, 61, (cc, rr) => {
    cumulus(cc, rr, 40, 30, 70, 20, { dark: '#9ab0d0', mid: '#d6e2f2', lit: '#ffffff', lx: -1 });
    cumulus(cc, rr, 300, 50, 50, 14, { dark: '#9ab0d0', mid: '#d6e2f2', lit: '#ffffff', lx: -1 });
  });
  // blue mountains, the castle white against them, the river bright on the left
  const mts = L('mountains', { depth: 0.05 });
  hill(mts, r, 60, 560, 170, 72, '#6a86b4', { sharp: 1.4 });
  hill(mts, r, -80, 300, 172, 34, '#7e98c2');
  const town = L('castle', { depth: 0.08 });
  rect(town, 0, 166, W, 14, '#6a9a60');
  for (let x = 0; x < 230; x += 1) { const y = 170 + Math.sin(x * 0.03) * 2; rect(town, x, y, 1, 5, '#c4dcf2'); if (r() < 0.2) px(town, x, y + r.i(0, 4), '#ffffff'); }
  const kp = { stone: '#8a8e96', stoneDark: '#6a6e78', wall: '#f4f2ee', wallLit: '#ffffff', wallShade: '#c8ccd4', window: '#4a5468', roof: '#4e5a74', roofLit: '#7a88a4', gold: '#e8c060' };
  tenshu(town, 318, 168, 0.95, kp);
  for (let x = 262; x < 380; x += 2) rect(town, x, 164, 2, 4, '#e8e8ea');
  rect(town, 262, 163, 118, 1, '#4e5a74');
  for (let x = 0; x < W; x += r.r(7, 12)) { const y = r.r(164, 172); crown(town, r, x, y, r.r(5, 9), r.r(3, 5), ['#d88ca8', '#eaa4bc', '#f8c4d4', '#ffe4ec'], { x: -0.6, y: -0.7 }, 10); }
  // the meadow, and the carpet of fallen petals running down the avenue
  const field = L('field', { depth: 0.16 });
  vgrad(field, 0, 176, W, 76, [[0, '#7aa868'], [1, '#5a8a4a']]);
  poly(field, [[248, 178], [322, 178], [490, 252], [10, 252]], '#f2b4c8');
  for (let i = 0; i < 500; i++) { const y = r.r(178, 236); px(field, r() * W, y, r.pick(['#f8c8d8', '#e89ab4', '#ffe0ea', '#6a9a58'])); }
  for (let i = 0; i < 18; i++) { const x = r.r(0, W), y = r.r(196, 232); for (let k = -3; k <= 3; k++) line(field, x, y, x + k * 2.4, y - r.r(3, 6), r.pick(['#2e5a2e', '#3e6e36']), 1); }
  // cherry trees along the avenue
  const blossom = ['#c87090', '#e490ac', '#f6b8cc', '#ffe2ec'];
  const mid = L('trees_mid', { depth: 0.24, anim: sway(0.5, 6.4, { oy: 1 }) });
  for (const [x, yb, hh] of [[110, 196, 50], [372, 196, 54], [60, 202, 60], [424, 204, 64]]) {
    trunk(mid, x, yb, hh * 0.6, 4, 2.4, '#3e2e2e', '#2a1e20');
    for (let k = 0; k < 3; k++) branch(mid, x, yb - hh * 0.45, x + r.r(-18, 18), yb - hh * r.r(0.7, 0.9), 2, '#3e2e2e');
    crown(mid, r, x, yb - hh * 0.8, hh * 0.55, hh * 0.3, blossom, { x: -0.6, y: -0.7 }, 30);
  }
  // Hervé on a white horse beneath the trees
  const rd = L('rider', { depth: 0.32, anim: { type: 'bob', a: 0.35, t: 3.6 } });
  riderBack(rd, 196, 256, 1.35, { coat: '#f4f2ee', dark: '#c8c8c8', hi: '#ffffff', mane: '#e8e6e0', maneHi: '#ffffff', rider: '#26242e', riderDark: '#16141c', riderHi: '#3e3c48', skin: '#e0b898', hair: '#2e2420', hat: '#141218', hatHi: '#2e2c36', bag: '#8a5a34', bagHi: '#b07a4a' });
  // the great trees in front, their canopies closing overhead
  const big = L('trees_big', { depth: 0.5, anim: sway(0.4, 7, { oy: 1 }) });
  for (const [x, lean] of [[36, 0.25], [446, -0.22]]) {
    for (let y = H; y > 70; y -= 1) { const t = (H - y) / (H - 70), w = 12 - t * 6; rect(big, x + lean * (H - y) * 0.5 - w / 2, y, w, 1, '#3a2a2a'); rect(big, x + lean * (H - y) * 0.5 - w / 2, y, 2, 1, '#6a5250'); }
    for (let k = 0; k < 5; k++) branch(big, x + lean * 80, 110 - k * 8, x + lean * 80 + (lean > 0 ? 1 : -1) * r.r(30, 90), r.r(20, 70), 3 - k * 0.4, '#3a2a2a');
  }
  for (let i = 0; i < 22; i++) crown(big, r, i < 11 ? r.r(-30, 170) : r.r(310, W + 30), r.r(-20, 70), r.r(20, 40), r.r(12, 22), blossom, { x: -0.6, y: -0.6 }, 26);
  const floor = L('floor', { depth: 0.75 });
  poly(floor, [[0, 244], [W, 248], [W, H], [0, H]], '#e8a0b8');
  for (let i = 0; i < 400; i++) px(floor, r() * W, r.r(244, H), r.pick(['#f8c8d8', '#d8889e', '#ffe4ec', '#f2b4c8']));
  for (let i = 0; i < 12; i++) { const x = r.pick([r.r(0, 120), r.r(360, W)]), y = r.r(250, 268); for (let k = -4; k <= 4; k++) line(floor, x, y, x + k * 3, y - r.r(5, 10), r.pick(['#244a26', '#2e5a2e', '#3e6e36']), 1); }
  return { colors: 92, vignette: [0.25, '30,20,40'] };
};

// ---------------------------------------------------------------- 4. the golden field, and the title
SCENES.op_gold = (c, L) => {
  const r = rng(914);
  vgrad(c, 0, 0, W, 170, [[0, '#c8a868'], [0.3, '#e8cc88'], [0.6, '#f6e2a8'], [0.85, '#fff0c8'], [1, '#f2d8a0']]);
  sun(c, 150, 58, 17, '#fffcee', 'rgba(255,236,170,0.8)');
  glow(c, 150, 58, 200, 'rgba(255,240,190,0.45)');
  // mountains far off in the haze, a dark wooded hill, the pagoda in the mist on the right
  const far = L('far', { depth: 0.04 });
  hill(far, r, -60, 300, 140, 40, '#dcc496', { sharp: 1.2 });
  hill(far, r, 180, 560, 138, 56, '#d2b688', { sharp: 1.3 });
  // wooded hills, dark against the light, the sun catching their crowns
  const hill_ = L('hill', { depth: 0.08 });
  hill(hill_, r, -40, 330, 160, 44, '#6e5638', { sharp: 0.9 });
  hill(hill_, r, 240, 540, 158, 38, '#5e4a32', { sharp: 0.9 });
  for (let x = -10; x < W + 10; x += r.r(5, 9)) {
    const top = x < 300 ? 160 - 44 * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, (x + 40) / 370))), 0.9) * 0.8 : 158 - 38 * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, (x - 240) / 300))), 0.9) * 0.8;
    crown(hill_, r, x, top + r.r(0, 6), r.r(4, 8), r.r(4, 7), ['#4e3c28', '#6a5236', '#a8844e', '#e8c47a'], { x: -0.8, y: -0.6 }, 10);
  }
  pagoda(hill_, 430, 128, 1.5, '#4e3c2c', '#a88a5a');
  const haze = L('haze', { depth: 0.1, anim: { type: 'drift', t: 300 } });
  wrapped(haze, 71, (cc, rr) => mistStreaks(cc, rr, 0, W, 132, 160, 70, ['#f0dcae', '#e8d0a0', '#f6e6c0', '#fff0d0']));
  // the field: gold as far as the eye goes, dotted with white tufts that catch the light
  const field = L('field', { depth: 0.14 });
  vgrad(field, 0, 150, W, H - 150, [[0, '#e8c070'], [0.3, '#dcae58'], [0.7, '#c8943e'], [1, '#a8742a']]);
  texture(field, r, 0, 150, W, H - 150, 0.1, 2);
  for (let i = 0; i < 2400; i++) {
    const y = 152 + Math.pow(r(), 1.3) * 118, x = r() * W, sz = 0.5 + (y - 150) * 0.018;
    if (r() < 0.55) px(field, x, y, r.pick(['#f6d890', '#e8b860', '#b88838']));
    else ellipse(field, x, y, sz, sz * 0.7, r.pick(['#fffaf0', '#fff0d0', '#f8e4b8']));
  }
  glow(field, 150, 160, 200, 'rgba(255,230,160,0.4)');
  // the near stalks, swaying, with their white heads
  const near = L('near', { depth: 0.55, anim: sway(1.4, 4.4, { oy: 1 }) });
  for (let i = 0; i < 160; i++) {
    const x = r.r(-10, W + 10), yb = H + 2, hh = r.r(16, 44), lean = r.r(-0.2, 0.6);
    for (let t = 0; t < 1; t += 1 / hh) px(near, x + lean * hh * 0.3 * t * t, yb - hh * t, r() < 0.5 ? '#c89a48' : '#a8782e');
    const tx = x + lean * hh * 0.3, ty = yb - hh;
    ellipse(near, tx, ty, r.r(2, 3.6), r.r(1.6, 2.6), '#fff8e8');
    px(near, tx - 1, ty - 1, '#ffffff');
  }
  return { colors: 90, vignette: [0.28, '60,40,10'] };
};
