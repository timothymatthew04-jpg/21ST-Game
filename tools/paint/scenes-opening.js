/*
 * The opening: Japan, before the story reaches it. A sea of clouds at dawn with the
 * mountain rising out of it, a field of silver grass in the afternoon wind, and the sea
 * at sunset with a gate standing in the water.
 */

// ---------------------------------------------------------------- above the clouds at dawn
SCENES.op_sky = (c, L) => {
  const r = rng(901);
  vgrad(c, 0, 0, W, H, [[0, '#141a44'], [0.22, '#2e3470'], [0.42, '#6a5a94'], [0.58, '#c07a9a'], [0.7, '#ffae84'], [0.78, '#ffd49c'], [0.86, '#fff0c8'], [1, '#ffe2b0']]);
  stars(c, r, 40, 0, 0, W, 60, '#dfe6ff');
  sun(c, 132, 196, 16, '#fff8dc', 'rgba(255,200,130,0.7)');
  // thin high cloud, lit from below by the sun that has not risen yet
  const hi = L('high', { depth: 0.03, anim: { type: 'drift', t: 420 } });
  wrapped(hi, 91, (cc, rr) => {
    cloudBand(cc, rr, 20, 58, 220, 4, { body: '#6a5486', rim: '#ffb088', shadow: '#4e4274', hi: '#ffe0c0', lightFromBelow: true });
    cloudBand(cc, rr, 250, 88, 200, 5, { body: '#8a6490', rim: '#ffc090', shadow: '#6a5080', hi: '#fff0d0', lightFromBelow: true });
    cloudBand(cc, rr, 120, 126, 160, 3, { body: '#b07890', rim: '#ffd0a0', shadow: '#906880', hi: '#fff4d8', lightFromBelow: true });
  });
  // the mountain, snow on its shoulders, lit from the left by the dawn
  const mt = L('mountain', { depth: 0.06 });
  const mx = 330, top = 96, base = 214;
  poly(mt, [[mx - 150, base], [mx - 60, top + 44], [mx - 16, top + 2], [mx + 16, top + 2], [mx + 64, top + 46], [mx + 160, base]], '#4a3e6e');
  poly(mt, [[mx - 150, base], [mx - 60, top + 44], [mx - 16, top + 2], [mx - 4, top + 4], [mx - 30, top + 60], [mx - 70, base]], '#7a5e8e');
  // the snowcap, its lower edge ragged where the snow gives out
  const cap = [[mx - 44, top + 34], [mx - 16, top + 2], [mx + 16, top + 2], [mx + 46, top + 36]];
  for (let x = mx + 46; x >= mx - 44; x -= 4) cap.push([x, top + 30 + Math.abs(Math.sin(x * 0.7)) * 12 + r.r(0, 6)]);
  poly(mt, cap, '#b8acd4');
  poly(mt, [[mx - 44, top + 34], [mx - 16, top + 2], [mx - 2, top + 3], [mx - 14, top + 30], [mx - 24, top + 44], [mx - 36, top + 40]], '#ffe8e0');
  for (let k = 0; k < 7; k++) line(mt, mx - 12 + k * 5, top + 8, mx - 22 + k * 7, top + 34 + (k % 3) * 5, 'rgba(90,70,130,0.35)', 1);
  rect(mt, mx - 16, top + 1, 32, 2, '#fff4ee');
  glow(mt, mx - 20, top + 20, 70, 'rgba(255,190,160,0.25)');
  // the sea of clouds: banks of billows sliding at different speeds, lit from the dawn side
  const billows = (cc, rr, y0, spread, n, size, pal) => {
    // pal: underside, body, lit crescent, rim; each billow is a few round puffs on a flat base
    const list = [];
    for (let i = 0; i < n; i++) list.push([rr.r(-40, W + 40), y0 + rr.r(0, spread), rr.r(size[0], size[1])]);
    list.sort((a, b) => a[1] - b[1]);
    for (const [x, y, w] of list) {
      ellipse(cc, x, y + w * 0.14, w * 0.66, w * 0.14, pal[0]);
      ellipse(cc, x, y + w * 0.06, w * 0.6, w * 0.13, pal[1]);
      const k = rr.i(4, 7);
      for (let j = 0; j < k; j++) {
        const t = (j + 0.5) / k;
        const env = Math.sin(Math.PI * t);
        const rad = w * rr.r(0.13, 0.2) * (0.6 + 0.4 * env);
        const px_ = x - w * 0.52 + t * w * 1.04, py = y - rad * 0.3 - env * w * 0.07;
        circle(cc, px_ - rad * 0.1, py - rad * 0.12, rad, pal[2]);
        circle(cc, px_ + rad * 0.16, py + rad * 0.18, rad * 0.88, pal[1]);
        if (rr() < 0.4) circle(cc, px_ - rad * 0.5, py - rad * 0.55, Math.max(1, rad * 0.16), pal[3]);
      }
    }
  };
  const back = L('sea_back', { depth: 0.1, anim: { type: 'drift', t: 380 } });
  wrapped(back, 93, (cc, rr) => {
    rect(cc, 0, 184, W, H - 184, '#9a80b0');
    billows(cc, rr, 172, 14, 30, [26, 48], ['#6a5890', '#9a80b0', '#f2bab4', '#ffe4cc']);
  });
  glow(back, 132, 184, 150, 'rgba(255,190,140,0.35)');
  const mid = L('sea_mid', { depth: 0.18, anim: { type: 'drift', t: 260 } });
  wrapped(mid, 94, (cc, rr) => {
    rect(cc, 0, 222, W, H - 222, '#8a70a4');
    billows(cc, rr, 202, 20, 22, [40, 70], ['#5a4a84', '#8a70a4', '#eaaab0', '#ffdcc4']);
  });
  const front = L('sea_front', { depth: 0.32, anim: { type: 'drift', t: 160 } });
  wrapped(front, 95, (cc, rr) => {
    rect(cc, 0, 256, W, H - 256, '#76609a');
    billows(cc, rr, 240, 20, 14, [64, 100], ['#4a3c74', '#76609a', '#dc9aa8', '#ffd4bc']);
  });
  return { colors: 80, vignette: [0.3, '20,10,40'] };
};

// ---------------------------------------------------------------- silver grass in the afternoon wind
SCENES.op_grass = (c, L) => {
  const r = rng(902);
  vgrad(c, 0, 0, W, 160, [[0, '#4a6aa8'], [0.35, '#8a98c0'], [0.65, '#e8c8a8'], [0.88, '#ffe0a8'], [1, '#fff2cc']]);
  sun(c, 372, 112, 13, '#fffbe8', 'rgba(255,220,150,0.75)');
  const cl = L('clouds', { depth: 0.04, anim: { type: 'drift', t: 300 } });
  wrapped(cl, 21, (cc, rr) => {
    cumulus(cc, rr, 30, 40, 110, 34, { dark: '#8a8ab0', mid: '#d0c8d8', lit: '#fff0dc', lx: 1 });
    cumulus(cc, rr, 200, 64, 80, 24, { dark: '#9a94b4', mid: '#dcd0d8', lit: '#fff4e0', lx: 1 });
    cloudBand(cc, rr, 300, 30, 170, 5, { body: '#a8a8c8', rim: '#fff0d0', shadow: '#8a8ab0', hi: '#ffffff', lightFromBelow: true });
  });
  // mountains fading into the haze
  const far = L('far', { depth: 0.07 });
  ridge(far, r, 150, 40, '#9aa0c4', { peak: [120, 50, 22] });
  hill(far, r, 180, 560, 160, 24, '#aeaccc');
  glow(far, 372, 140, 120, 'rgba(255,230,180,0.35)');
  const hills = L('hills', { depth: 0.14 });
  hill(hills, r, -40, 300, 170, 26, '#8e9a78');
  hill(hills, r, 200, 540, 172, 20, '#96a07a');
  treeLine(hills, r, 170, 0, 150, 4, ['#6e7a5a', '#808a64']);
  treeLine(hills, r, 172, 330, W, 4, ['#74805e', '#86906a']);
  // the field, gold where the light comes through
  const field = L('field', { depth: 0.25 });
  vgrad(field, 0, 164, W, H - 164, [[0, '#c8b878'], [0.2, '#b0a060'], [0.6, '#8a7a44'], [1, '#4a4224']]);
  texture(field, r, 0, 164, W, 106, 0.1, 2);
  for (let i = 0; i < 1400; i++) {
    const y = 166 + Math.pow(r(), 0.8) * 104, x = r() * W;
    const hh = 1 + (y - 164) * 0.05;
    line(field, x, y, x + r.r(-1, 2), y - hh, r.pick(['#d8c080', '#a89050', '#e8d49a', '#8a7a40']), 1);
  }
  glow(field, 372, 166, 90, 'rgba(255,220,150,0.35)');
  // a lone tree on a rise, and the path that goes past it
  const tr = L('tree', { depth: 0.2, anim: sway(0.6, 7, { oy: 1 }) });
  trunk(tr, 124, 170, 30, 3, 1.6, '#3a2e24', '#2a2018');
  crown(tr, r, 118, 138, 30, 17, ['#3e4a2a', '#5a6a36', '#8a9a4a', '#c8c878'], { x: 0.8, y: -0.4 }, 60);
  const path = L('path', { depth: 0.3 });
  const road = [[198, 172], [204, 172], [252, 226], [284, H], [240, H], [230, 226]];
  poly(path, road, '#a8905a');
  poly(path, [[200, 172], [203, 172], [246, 226], [270, H], [254, H], [236, 226]], '#c4a86c');
  texture(path, r, 196, 170, 100, 100, 0.18, 2, (cc) => { road.forEach(([x, y], i) => (i ? cc.lineTo(x, y) : cc.moveTo(x, y))); });
  // waves of lighter grass where the wind has laid it over
  for (let k = 0; k < 7; k++) {
    const y = 180 + k * 12 + r.r(-3, 3);
    for (let x = r.r(-40, 0); x < W; x += r.r(60, 110)) {
      field.globalAlpha = 0.16;
      ellipse(field, x, y, r.r(24, 50), 1.5 + k * 0.5, '#f0dca0');
    }
  }
  field.globalAlpha = 1;
  // plumes of silver grass, bending in the wind
  const plume = (cv, x, yb, hh, lean, col, lit) => {
    const tipx = x + lean * hh * 0.5;
    const stem = (t) => [x + lean * hh * 0.5 * t * t, yb - hh * t];
    for (let t = 0; t < 1; t += 1 / hh) { const [sx, sy] = stem(t); px(cv, sx, sy, col); }
    for (let k = 0; k < hh * 0.45; k++) {
      const t = 0.62 + (k / (hh * 0.45)) * 0.38;
      const [sx, sy] = stem(t);
      const f = (1 - Math.abs(t - 0.8) * 3) * 3 + 1;
      line(cv, sx, sy, sx + lean * f + r.r(0, 2), sy - r.r(0, 2), r() < 0.5 ? lit : col, 1);
    }
    return tipx;
  };
  const mid = L('susuki_mid', { depth: 0.45, anim: sway(1.1, 4.6, { oy: 1 }) });
  for (let i = 0; i < 70; i++) plume(mid, r() * W, 214 + r.r(0, 20), r.r(22, 36), r.r(0.4, 0.9), '#b8a878', '#fff0c8');
  const front = L('susuki_front', { depth: 0.85, anim: sway(2, 3.8, { oy: 1 }) });
  const bigPlume = (x, hh, lean) => {
    const stem = (t) => [x + lean * hh * 0.45 * t * t, H + 2 - hh * t];
    for (let t = 0; t < 1; t += 0.5 / hh) { const [sx, sy] = stem(t); rect(front, sx, sy, 2, 1, '#4a3e2a'); }
    for (let k = 0; k < hh * 0.9; k++) {
      const t = 0.55 + (k / (hh * 0.9)) * 0.45;
      const [sx, sy] = stem(t);
      const f = Math.sin(((t - 0.55) / 0.45) * Math.PI) * 7 + 1;
      for (const side of [-1, 1]) line(front, sx, sy, sx + lean * f * 0.9 + side * r.r(0, 3), sy - f * 0.5 * r.r(0.4, 1), r() < 0.45 ? '#fff6d8' : r() < 0.5 ? '#d8c89a' : '#8a7a58', 1);
    }
    // a long leaf curling from the base
    for (let t = 0; t < 1; t += 0.02) rect(front, x + t * lean * hh * 0.6 - t * 6, H + 2 - hh * 0.55 * Math.sin(t * 2.4), 1, 2, '#3a4a26');
  };
  for (let i = 0; i < 22; i++) bigPlume(i < 11 ? r.r(-10, 100) : r.r(380, W + 6), r.r(56, 92), r.r(0.5, 1));
  return { colors: 80, vignette: [0.28, '40,26,10'] };
};

// ---------------------------------------------------------------- the sea at sunset, a gate in the water
SCENES.op_sunset = (c, L) => {
  const r = rng(903);
  vgrad(c, 0, 0, W, 168, [[0, '#24183e'], [0.25, '#56305e'], [0.48, '#b04a6e'], [0.68, '#f07a5a'], [0.84, '#ffb066'], [0.95, '#ffd890'], [1, '#fff0c0']]);
  sun(c, 206, 150, 19, '#fff6d8', 'rgba(255,170,100,0.8)');
  const cl = L('clouds', { depth: 0.05, anim: { type: 'drift', t: 340 } });
  wrapped(cl, 31, (cc, rr) => {
    cloudBand(cc, rr, 10, 44, 200, 6, { body: '#5a2e5e', rim: '#ffa070', shadow: '#40224a', hi: '#ffd8a0', lightFromBelow: true });
    cloudBand(cc, rr, 260, 70, 210, 7, { body: '#7a3a64', rim: '#ffb07a', shadow: '#5a2a54', hi: '#ffe0b0', lightFromBelow: true });
    cloudBand(cc, rr, 90, 108, 150, 4, { body: '#a8506a', rim: '#ffc890', shadow: '#88405e', hi: '#fff0c8', lightFromBelow: true });
  });
  // islands and a far volcano, flat against the light
  const far = L('far', { depth: 0.08 });
  ridge(far, r, 168, 30, '#6a3462', { x0: 300, peak: [400, 36, 26] });
  ridge(far, r, 168, 12, '#5a2c58', { x1: 150 });
  rect(far, 0, 166, W, 3, '#8a4468');
  // the sea: the sun's road across it, broken into glitter
  const sea = L('sea', { depth: 0.12 });
  vgrad(sea, 0, 168, W, H - 168, [[0, '#ffa070'], [0.12, '#c05a6a'], [0.45, '#6a3060'], [1, '#2a1a3a']]);
  for (let y = 169; y < H; y += 1) {
    const d = (y - 168) / (H - 168);
    const half = 6 + d * 70;
    for (let k = 0; k < 2 + d * 8; k++) {
      const x = 206 + r.r(-half, half) * (0.3 + 0.7 * r());
      const len = r.r(2, 5 + d * 14);
      sea.globalAlpha = r.r(0.4, 1) * (1 - d * 0.5);
      rect(sea, x - len / 2, y, len, 1, r.pick(['#fff0c0', '#ffd090', '#ffb070']));
    }
  }
  sea.globalAlpha = 1;
  for (let i = 0; i < 120; i++) { const y = r.r(172, H); sea.globalAlpha = r.r(0.15, 0.4); rect(sea, r() * W, y, r.r(4, 16), 1, '#e888a0'); }
  sea.globalAlpha = 1;
  // fishing boats heading in
  for (const [x, y, s, t] of [[70, 186, 1, 5.5], [410, 194, 1.2, 6.5]]) {
    const b = L(`boat${x}`, { depth: 0.2, anim: { type: 'bob', a: 1, t } });
    poly(b, [[x - 12 * s, y], [x + 12 * s, y], [x + 8 * s, y + 3 * s], [x - 9 * s, y + 3 * s]], '#2a1830');
    line(b, x - 2 * s, y, x - 2 * s, y - 14 * s, '#2a1830', 1);
    poly(b, [[x - 1 * s, y - 13 * s], [x + 8 * s, y - 4 * s], [x - 1 * s, y - 3 * s]], '#6a3a52');
    rect(b, x + 5 * s, y - 5 * s, 2, 4 * s, '#2a1830');
    glow(b, x - 8 * s, y - 3, 6, 'rgba(255,200,120,0.8)');
    px(b, x - 8 * s, y - 3, '#ffe0a0');
  }
  // the great gate standing in the water, and its reflection
  const g = L('torii', { depth: 0.4 });
  const gx = 330, gb = 226, gh = 78, gw = 86;
  const red = '#a02030', dark = '#5a1424', rim = '#ff8a5a';
  const gate = (cv, flip, a) => {
    cv.save();
    cv.globalAlpha = a;
    if (flip) { cv.translate(0, gb + 1); cv.scale(1, -0.5); cv.translate(0, -gb); }
    for (const px_ of [gx - gw * 0.34, gx + gw * 0.34]) {
      poly(cv, [[px_ - 4, gb], [px_ - 3, gb - gh + 8], [px_ + 3, gb - gh + 8], [px_ + 4, gb]], dark);
      rect(cv, px_ - 3, gb - gh + 8, 1, gh - 8, rim);
      rect(cv, px_ - 5, gb - 4, 10, 4, '#2a0e18');
    }
    rect(cv, gx - gw * 0.46, gb - gh + 22, gw * 0.92, 5, red);
    rect(cv, gx - gw * 0.46, gb - gh + 22, gw * 0.92, 1, rim);
    rect(cv, gx - 3, gb - gh + 8, 6, 14, dark);
    // the curved top beam, sweeping up at both ends
    for (let x = -gw * 0.6; x <= gw * 0.6; x++) {
      const t = x / (gw * 0.6);
      const y = gb - gh + 4 - Math.pow(Math.abs(t), 3) * 7;
      rect(cv, gx + x, y, 1, 6, red);
      rect(cv, gx + x, y, 1, 1, rim);
      rect(cv, gx + x, y - 3, 1, 3, '#2a0e18');
    }
    cv.restore();
  };
  gate(g, false, 1);
  const refl = L('torii_reflection', { depth: 0.4, anim: { type: 'wave', a: 0.6, t: 3 } });
  gate(refl, true, 0.45);
  glow(g, gx, gb - gh * 0.5, 60, 'rgba(255,140,90,0.22)');
  for (const px_ of [gx - gw * 0.34, gx + gw * 0.34]) for (let k = 0; k < 3; k++) { g.globalAlpha = 0.5 - k * 0.12; ellipse(g, px_, gb + 1 + k, 7 + k * 4, 1, '#ffc890'); }
  g.globalAlpha = 1;
  // rocks and a pine at the shore in front, dark against the light
  const shore = L('shore', { depth: 0.7 });
  poly(shore, [[0, 222], [30, 214], [70, 218], [110, 232], [150, 248], [170, H], [0, H]], '#1e1224');
  rock(shore, r, 20, 222, 60, 26, { dark: '#1a0e20', mid: '#2e1a32', lit: '#6a3448' });
  rock(shore, r, 84, 236, 40, 20, { dark: '#1a0e20', mid: '#2e1a32', lit: '#6a3448' });
  const pine_ = L('pine', { depth: 0.8, anim: sway(0.8, 6.5, { ox: 0, oy: 1 }) });
  pine(pine_, r, 44, 226, 120, { trunk: '#1e1020', leaves: ['#1a1024', '#26162e', '#3a2238', '#6a3448'] }, 1);
  return { colors: 84, vignette: [0.35, '30,10,30'] };
};
