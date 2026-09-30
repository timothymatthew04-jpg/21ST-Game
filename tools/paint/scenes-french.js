/*
 * French military pieces, for the army camp where the story begins: the headquarters, the
 * ramparts, wooden watchtowers, bell tents, field guns, regimental banners, and on the horizon
 * the military France of the 1860s: citadels and barracks in front, the domes and towers of
 * Paris behind. Used by the walk (tools/paint/walks.js), the Chapter 1 backdrop and the camp
 * cutscene. Everything is lit by a pink dawn from the left.
 */
/* eslint-disable no-unused-vars */
const FR = {
  stone: { hi: '#f6e4d8', lit: '#e8d0c6', mid: '#d2b6b2', shade: '#b0939e', deep: '#86697e', line: '#a38896' },
  slate: { hi: '#9a98b8', lit: '#76769a', mid: '#5c5c80', dark: '#44446a' },
  gold: { hi: '#fff0a8', lit: '#f0c050', mid: '#c8902e', dark: '#8a5a22' },
  wood: { hi: '#b07e52', lit: '#8a5a3a', mid: '#6a4430', dark: '#44281e' },
  blue: '#2e4a9a', blueDark: '#22346e', white: '#f2eee6', red: '#c83a3a', redDark: '#8e2426',
  glass: '#3a3350', lit: '#ffd28a',
};

/** A tall window: frame, panes, and sometimes the lamplight of someone already up. */
function frWindow(c, r, x, y, w, h, o = {}) {
  rect(c, x - 1, y - 1, w + 2, h + 2, o.frame || FR.stone.deep);
  const lit = o.lit != null ? o.lit : r() < 0.28;
  rect(c, x, y, w, h, lit ? FR.lit : FR.glass);
  if (lit) rect(c, x, y + h - 2, w, 2, '#ffb060');
  else rect(c, x, y, Math.max(1, Math.round(w / 3)), h, '#4a4468');
  rect(c, x + Math.floor(w / 2), y, 1, h, o.bar || '#6a5a70');
  rect(c, x, y + Math.floor(h * 0.45), w, 1, o.bar || '#6a5a70');
  if (o.arch) ellipse(c, x + w / 2, y, w / 2 + 1, 2, o.frame || FR.stone.deep);
  if (o.balcony) { rect(c, x - 2, y + h + 1, w + 4, 1, '#3a2e3a'); for (let k = 0; k <= w + 2; k += 2) rect(c, x - 1 + k, y + h - 2, 1, 3, '#3a2e3a'); }
  if (o.pediment) poly(c, [[x - 2, y - 2], [x + w + 2, y - 2], [x + w / 2, y - 5]], o.frame || FR.stone.shade);
  return lit;
}

/** A mansard roof: steep slate below with dormers, shallow above, iron cresting on the ridge. */
function frMansard(c, r, x0, x1, y, h, o = {}) {
  const inset = o.inset || 4;
  poly(c, [[x0 - 2, y], [x1 + 2, y], [x1 - inset, y - h * 0.75], [x0 + inset, y - h * 0.75]], FR.slate.mid);
  hgrad(c, x0 - 2, y - h * 0.75, 6, h * 0.75, [[0, 'rgba(255,220,220,0.18)'], [1, 'rgba(255,220,220,0)']]);
  for (let x = x0 + 2; x < x1; x += 3) line(c, x + 0.5, y - 1, x + 0.5 + (x < (x0 + x1) / 2 ? 1 : -1), y - h * 0.72, FR.slate.dark, 1);
  poly(c, [[x0 + inset, y - h * 0.75], [x1 - inset, y - h * 0.75], [x1 - inset * 2, y - h], [x0 + inset * 2, y - h]], FR.slate.dark);
  rect(c, x0 + inset, y - h * 0.75, x1 - x0 - inset * 2, 1, FR.slate.hi);
  for (let x = x0 + inset * 2; x < x1 - inset * 2; x += 3) px(c, x, y - h - 1, '#2e2a3a');
  rect(c, x0 - 3, y, x1 - x0 + 6, 2, FR.stone.hi);
  rect(c, x0 - 3, y + 2, x1 - x0 + 6, 1, FR.stone.deep);
  // dormers with little pediments
  const n = o.dormers == null ? Math.max(1, Math.round((x1 - x0) / 20)) : o.dormers;
  for (let i = 0; i < n; i++) {
    const dx = x0 + (x1 - x0) * (i + 0.5) / n - 3;
    rect(c, dx - 1, y - h * 0.62, 8, 9, FR.stone.lit);
    poly(c, [[dx - 2, y - h * 0.62], [dx + 8, y - h * 0.62], [dx + 3, y - h * 0.62 - 4]], FR.stone.hi);
    frWindow(c, r, dx + 1, y - h * 0.62 + 2, 4, 5, { frame: FR.stone.shade });
  }
  const chim = [];
  for (const k of o.chimneys || []) {
    const cx = x0 + (x1 - x0) * k;
    rect(c, cx - 2, y - h - 8, 5, 9, FR.stone.mid);
    rect(c, cx - 2, y - h - 8, 2, 9, FR.stone.lit);
    rect(c, cx - 3, y - h - 9, 7, 2, FR.stone.shade);
    chim.push([cx + 0.5, y - h - 10]);
  }
  return chim;
}

/**
 * The headquarters: two wings under mansard roofs, a central pavilion with columns, a clock,
 * the eagle in the pediment, a square dome with a lantern, and the flag above it all.
 * Returns where the flag, the chimneys and the lamps are, for the moving parts.
 */
function frHQ(c, r, cx, yb, o = {}) {
  const ww = o.wing || 64, pw = o.pavilion || 48, hb = o.height || 50;
  const x0 = cx - pw / 2 - ww, x1 = cx + pw / 2 + ww;
  const out = { chimneys: [], lamps: [] };
  // wings
  for (const [a, b] of [[x0, cx - pw / 2], [cx + pw / 2, x1]]) {
    vgrad(c, a, yb - hb, b - a, hb, [[0, FR.stone.hi], [0.5, FR.stone.lit], [1, FR.stone.mid]]);
    rect(c, b - 3, yb - hb, 3, hb, FR.stone.shade);
    for (let y = yb - 16; y < yb; y += 4) rect(c, a, y, b - a, 1, FR.stone.line);
    for (let y = yb - 16, k = 0; y < yb; y += 4, k++) for (let x = a + (k % 2) * 5; x < b; x += 10) rect(c, x, y, 1, 4, FR.stone.line);
    rect(c, a, yb - 17, b - a, 2, FR.stone.hi);
    rect(c, a, yb - hb + 16, b - a, 1, FR.stone.shade);
    const n = Math.round((b - a) / 16);
    for (let i = 0; i < n; i++) {
      const wx = a + (b - a) * (i + 0.5) / n - 3;
      frWindow(c, r, wx, yb - 14, 6, 11, { arch: true });
      frWindow(c, r, wx, yb - hb + 20, 6, 12, { balcony: true, pediment: i % 2 === 0 });
      frWindow(c, r, wx + 0.5, yb - hb + 5, 5, 7, {});
    }
    out.chimneys.push(...frMansard(c, r, a, b, yb - hb, 18, { chimneys: [0.18, 0.82] }));
  }
  // the central pavilion, standing forward and taller, with quoins at its corners
  const px0 = cx - pw / 2, ph = hb + 22;
  vgrad(c, px0, yb - ph, pw, ph, [[0, FR.stone.hi], [0.6, FR.stone.lit], [1, FR.stone.mid]]);
  rect(c, px0 + pw - 3, yb - ph, 3, ph, FR.stone.shade);
  for (let y = yb - ph; y < yb; y += 5) { rect(c, px0, y, 4 + ((y / 5) % 2) * 2, 4, FR.stone.hi); rect(c, px0 + pw - 6 - ((y / 5) % 2) * 2, y, 4 + ((y / 5) % 2) * 2, 4, FR.stone.mid); }
  // columns, the entablature and the doors
  for (const k of [-19, -13, 10, 16]) {
    rect(c, cx + k, yb - 34, 3, 32, FR.stone.hi);
    rect(c, cx + k + 2, yb - 34, 1, 32, FR.stone.shade);
    rect(c, cx + k - 1, yb - 36, 5, 2, FR.stone.hi);
    rect(c, cx + k - 1, yb - 3, 5, 2, FR.stone.shade);
  }
  rect(c, cx - 22, yb - 40, 44, 4, FR.stone.hi);
  rect(c, cx - 22, yb - 36, 44, 1, FR.stone.deep);
  rect(c, cx - 7, yb - 26, 14, 24, FR.stone.deep);
  ellipse(c, cx, yb - 26, 7, 4, FR.stone.deep);
  rect(c, cx - 6, yb - 25, 12, 23, '#26344e');
  ellipse(c, cx, yb - 25, 6, 3, '#26344e');
  rect(c, cx, yb - 25, 1, 23, '#162238');
  for (const k of [-4, 2]) for (let y = yb - 20; y < yb - 4; y += 4) px(c, cx + k, y, FR.gold.lit);
  // steps down to the parade ground
  for (let k = 0; k < 3; k++) rect(c, cx - 12 - k * 4, yb - 2 + k, 24 + k * 8, 1, k % 2 ? FR.stone.mid : FR.stone.hi);
  // the tall window over the door, with its balcony and two flags crossed above it
  frWindow(c, r, cx - 4, yb - 58, 8, 14, { lit: true, balcony: true, arch: true });
  for (const s of [-1, 1]) {
    line(c, cx + s * 3, yb - 44, cx + s * 16, yb - 62, FR.wood.dark, 1);
    rect(c, cx + s * 16 - (s < 0 ? 6 : 0), yb - 64, 2, 5, FR.blue);
    rect(c, cx + s * 16 - (s < 0 ? 4 : -2), yb - 64, 2, 5, FR.white);
    rect(c, cx + s * 16 - (s < 0 ? 2 : -4), yb - 64, 2, 5, FR.red);
  }
  // the clock and the pediment with the golden eagle
  circle(c, cx, yb - ph + 9, 6, FR.gold.mid);
  circle(c, cx, yb - ph + 9, 5, '#f8f0e0');
  line(c, cx, yb - ph + 9, cx, yb - ph + 5.5, '#2a2030', 1);
  line(c, cx, yb - ph + 9, cx + 2.5, yb - ph + 9, '#2a2030', 1);
  poly(c, [[px0 - 3, yb - ph], [px0 + pw + 3, yb - ph], [cx, yb - ph - 15]], FR.stone.hi);
  poly(c, [[px0 + 3, yb - ph - 1], [px0 + pw - 3, yb - ph - 1], [cx, yb - ph - 12]], FR.stone.mid);
  rect(c, px0 - 3, yb - ph, pw + 6, 2, FR.stone.deep);
  // the eagle: wings spread, gold
  poly(c, [[cx - 9, yb - ph - 5], [cx - 2, yb - ph - 8], [cx, yb - ph - 10], [cx + 2, yb - ph - 8], [cx + 9, yb - ph - 5], [cx + 3, yb - ph - 4], [cx, yb - ph - 2], [cx - 3, yb - ph - 4]], FR.gold.lit);
  px(c, cx, yb - ph - 10, FR.gold.hi); rect(c, cx - 8, yb - ph - 5, 3, 1, FR.gold.hi);
  // the square dome behind the pediment, its lantern and the flagpole
  const dy = yb - ph - 14;
  rect(c, cx - 16, dy - 14, 32, 14, FR.slate.mid);
  ellipse(c, cx, dy - 14, 16, 9, FR.slate.mid);
  hgrad(c, cx - 16, dy - 22, 10, 22, [[0, 'rgba(255,215,215,0.22)'], [1, 'rgba(255,215,215,0)']]);
  for (let x = cx - 14; x < cx + 16; x += 4) line(c, x + 0.5, dy, x + 0.5 + (x - cx) * 0.25, dy - 20, FR.slate.dark, 1);
  rect(c, cx - 4, dy - 30, 8, 9, FR.stone.lit);
  rect(c, cx - 2, dy - 28, 4, 5, FR.lit);
  poly(c, [[cx - 5, dy - 30], [cx + 5, dy - 30], [cx, dy - 36]], FR.slate.dark);
  rect(c, cx, dy - 58, 1, 23, '#3a2e2a');
  circle(c, cx + 0.5, dy - 58, 1.2, FR.gold.lit);
  out.flag = [cx + 1, dy - 57];
  // lamps on iron posts either side of the steps
  for (const s of [-1, 1]) {
    const lx = cx + s * 34;
    rect(c, lx, yb - 22, 1, 20, '#2e2830');
    rect(c, lx - 2, yb - 26, 5, 5, '#2e2830');
    rect(c, lx - 1, yb - 25, 3, 3, FR.lit);
    glow(c, lx, yb - 24, 14, 'rgba(255,200,120,0.55)');
    out.lamps.push([lx, yb - 24]);
  }
  return out;
}

/** The ramparts behind the camp: dressed stone, a coping, embrasures, buttresses. */
function frRampart(c, r, x0, x1, yb, h = 30, o = {}) {
  vgrad(c, x0, yb - h, x1 - x0, h, [[0, '#c8a8b0'], [0.4, '#a88c9c'], [1, '#7a627a']]);
  for (let y = yb - h + 4, k = 0; y < yb; y += 5, k++) {
    rect(c, x0, y, x1 - x0, 1, '#8a7088');
    for (let x = x0 + (k % 2) * 6; x < x1; x += 12) rect(c, x, y, 1, 5, '#8a7088');
  }
  for (let i = 0; i < (x1 - x0) * h * 0.02; i++) rect(c, x0 + r() * (x1 - x0), yb - h + r() * h, r.i(2, 5), 1, r() < 0.5 ? '#c0a0ac' : '#90768c');
  rect(c, x0, yb - h - 3, x1 - x0, 3, '#dcc0c4');
  rect(c, x0, yb - h, x1 - x0, 1, '#6a5270');
  for (let x = x0 + 8; x < x1 - 8; x += 22) { c.clearRect(Math.round(x), Math.round(yb - h - 3), 6, 5); rect(c, x, yb - h + 1, 6, 1, '#6a5270'); }
  for (let x = x0 + 40; x < x1 - 20; x += 110) {
    rect(c, x, yb - h - 5, 12, h + 5, '#b89aa6');
    rect(c, x, yb - h - 5, 3, h + 5, '#d8bcc2');
    rect(c, x + 9, yb - h - 5, 3, h + 5, '#8a7088');
    rect(c, x - 1, yb - h - 7, 14, 2, '#e4ccd0');
  }
  // grime and moss at the foot, and a few lamps on brackets
  for (let x = x0; x < x1; x += 2) if (r() < 0.5) rect(c, x, yb - r.i(1, 5), 2, r.i(1, 5), r() < 0.6 ? '#5e5a4a' : '#6a7050');
  for (const lx of o.lamps || []) { rect(c, lx, yb - h + 8, 4, 1, '#2e2830'); rect(c, lx + 3, yb - h + 5, 3, 4, FR.lit); glow(c, lx + 4, yb - h + 7, 10, 'rgba(255,200,120,0.5)'); }
}

/** A wooden watchtower with a roof; a rifleman stands on it (the walk draws him). Returns the platform's top. */
function frTower(c, r, x, yb, o = {}) {
  const top = yb - (o.h || 46);
  for (const s of [-1, 1]) {
    line(c, x + s * 12, yb, x + s * 9, top, FR.wood.mid, 2);
    line(c, x + s * 12 - s, yb, x + s * 9 - s, top, FR.wood.dark, 1);
  }
  for (let y = top + 6; y < yb - 4; y += 12) { line(c, x - 11, y, x + 11, y + 10, FR.wood.dark, 1); line(c, x + 11, y, x - 11, y + 10, FR.wood.dark, 1); }
  // the ladder
  line(c, x - 3, yb, x - 3, top, FR.wood.lit, 1); line(c, x + 1, yb, x + 1, top, FR.wood.lit, 1);
  for (let y = top + 3; y < yb; y += 4) rect(c, x - 3, y, 5, 1, FR.wood.lit);
  // platform, railing and roof
  rect(c, x - 15, top, 30, 3, FR.wood.lit);
  rect(c, x - 15, top + 3, 30, 1, FR.wood.dark);
  rect(c, x - 15, top - 8, 30, 1, FR.wood.hi);
  rect(c, x - 15, top - 4, 30, 1, FR.wood.mid);
  for (const k of [-15, -8, 7, 14]) rect(c, x + k, top - 8, 1, 8, FR.wood.mid);
  for (const k of [-15, 14]) rect(c, x + k, top - 22, 1, 14, FR.wood.dark);
  poly(c, [[x - 19, top - 21], [x + 19, top - 21], [x, top - 33]], FR.slate.mid);
  poly(c, [[x - 19, top - 21], [x, top - 33], [x - 2, top - 21]], FR.slate.hi);
  rect(c, x - 19, top - 21, 38, 1, FR.slate.dark);
  rect(c, x, top - 41, 1, 9, '#3a2e2a');
  rect(c, x + 1, top - 41, 3, 3, FR.blue); rect(c, x + 4, top - 41, 3, 3, FR.white); rect(c, x + 7, top - 41, 3, 3, FR.red);
  rect(c, x + 12, top - 15, 3, 4, FR.lit); glow(c, x + 13, top - 13, 10, 'rgba(255,200,120,0.5)');
  return top;
}

/** A bell tent of army canvas, lit on the left. */
function frTent(c, x, yb, s, o = {}) {
  ellipse(c, x + 2, yb + 1, s * 1.25, s * 0.16, 'rgba(50,30,50,0.35)');
  poly(c, [[x - s, yb], [x, yb - s * 1.1], [x + s, yb]], '#f2e6dc');
  poly(c, [[x, yb - s * 1.1], [x + s, yb], [x + s * 0.15, yb]], '#c8b2b2');
  poly(c, [[x - s, yb], [x, yb - s * 1.1], [x - s * 0.55, yb]], '#fff6ec');
  rect(c, x - s, yb - 2, s * 2, 2, '#b8a0a4');
  poly(c, [[x - s * 0.2, yb], [x, yb - s * 0.5], [x + s * 0.22, yb]], '#4a3440');
  line(c, x, yb - s * 1.1, x, yb - s * 1.1 - 4, FR.wood.dark, 1);
  line(c, x - s, yb, x - s * 1.35, yb + 1, '#9a8a80', 1);
  line(c, x + s, yb, x + s * 1.35, yb + 1, '#9a8a80', 1);
  if (o.pennant) { rect(c, x + 1, yb - s * 1.1 - 4, 3, 2, FR.blue); rect(c, x + 4, yb - s * 1.1 - 4, 3, 2, FR.red); }
}

/** A field gun on its carriage, and a pyramid of shot. */
function frGun(c, x, yb, dir = 1) {
  line(c, x, yb - 7, x - dir * 18, yb - 1, FR.wood.mid, 3);
  rect(c, x - dir * 20 - (dir > 0 ? 0 : -1), yb - 3, 3, 3, FR.wood.dark);
  poly(c, [[x - dir * 2, yb - 11], [x + dir * 22, yb - 13], [x + dir * 22, yb - 10], [x - dir * 2, yb - 7]], '#8a6a3a');
  line(c, x - dir * 2, yb - 11, x + dir * 22, yb - 13, '#d8a858', 1);
  rect(c, x + dir * 22 - (dir > 0 ? 0 : 2), yb - 14, 2, 5, '#6a4a2a');
  circle(c, x, yb - 7, 7, FR.wood.dark);
  circle(c, x, yb - 7, 6, FR.wood.lit);
  circle(c, x, yb - 7, 4.5, FR.wood.dark);
  for (let a = 0; a < 6; a++) line(c, x, yb - 7, x + Math.cos(a * Math.PI / 3) * 5, yb - 7 + Math.sin(a * Math.PI / 3) * 5, FR.wood.lit, 1);
  circle(c, x, yb - 7, 1.5, '#3a2e2a');
}
function frShot(c, x, yb) {
  for (let row = 0; row < 3; row++) for (let k = 0; k < 3 - row; k++) { circle(c, x + k * 4 + row * 2, yb - 2 - row * 3.4, 2, '#2e2a30'); px(c, x + k * 4 + row * 2 - 1, yb - 3 - row * 3.4, '#6a6470'); }
}

/** A regimental banner on a pole: blue band, cream cloth, red fringe, and an emblem. */
function frBannerPole(c, x, yb, h = 58) {
  rect(c, x, yb - h, 2, h, FR.wood.mid);
  rect(c, x, yb - h, 1, h, FR.wood.hi);
  rect(c, x - 9, yb - h + 2, 20, 2, FR.wood.dark);
  circle(c, x + 1, yb - h, 1.5, FR.gold.lit);
}
function frBannerCloth(c, x, yb, icon, h = 58) {
  const bx = x - 8, by = yb - h + 4, bw = 18, bh = 26;
  rect(c, bx, by, bw, bh, '#f0e6d8');
  rect(c, bx + bw - 3, by, 3, bh, '#d4c4bc');
  rect(c, bx, by, bw, 3, FR.blue);
  for (let k = 0; k < bw; k += 3) rect(c, bx + k, by + bh, 2, 3, FR.red);
  const ix = bx + bw / 2 - 1, iy = by + 14;
  const ink = FR.blueDark;
  if (icon === 'rifles') { line(c, ix - 5, iy + 6, ix + 5, iy - 6, ink, 1); line(c, ix + 5, iy + 6, ix - 5, iy - 6, ink, 1); rect(c, ix - 6, iy + 5, 2, 2, FR.wood.mid); rect(c, ix + 4, iy + 5, 2, 2, FR.wood.mid); }
  else if (icon === 'cannon') { rect(c, ix - 5, iy - 2, 11, 3, ink); circle(c, ix - 1, iy + 3, 3, ink); circle(c, ix - 1, iy + 3, 1, '#f0e6d8'); }
  else if (icon === 'drum') { rect(c, ix - 4, iy - 3, 9, 7, FR.red); rect(c, ix - 4, iy - 3, 9, 1, ink); rect(c, ix - 4, iy + 3, 9, 1, ink); line(c, ix - 4, iy - 3, ix + 4, iy + 3, '#f0e6d8', 1); line(c, ix - 3, iy - 7, ix + 1, iy - 3, FR.wood.dark, 1); }
  else if (icon === 'horse') { rect(c, ix - 4, iy - 5, 2, 10, ink); rect(c, ix + 3, iy - 5, 2, 10, ink); rect(c, ix - 4, iy + 3, 9, 2, ink); }
  else { poly(c, [[ix - 6, iy - 1], [ix - 1, iy - 3], [ix, iy - 6], [ix + 1, iy - 3], [ix + 6, iy - 1], [ix + 2, iy], [ix, iy + 3], [ix - 2, iy]], FR.gold.mid); px(c, ix, iy - 6, FR.gold.hi); }
}

/** Stacked rifles, bayonets up. */
function frRifles(c, x, yb) {
  line(c, x - 8, yb - 3, x, yb - 26, '#3a2c24', 2);
  line(c, x + 8, yb - 3, x, yb - 26, '#3a2c24', 2);
  line(c, x, yb - 3, x, yb - 26, '#4a382c', 2);
  for (const k of [-1, 1]) line(c, x + k, yb - 26, x + k * 2, yb - 32, '#c8c8d0', 1);
  rect(c, x - 1, yb - 28, 3, 3, '#8a8a90');
}

/** A flag of France (drawn on its own swaying layer). */
function frTricolour(c, x, y, w = 24, h = 11) {
  const t = w / 3;
  rect(c, x, y, t, h, FR.blue); rect(c, x + t, y, t, h, FR.white); rect(c, x + t * 2, y, w - t * 2, h, FR.red);
  rect(c, x, y + h - 1, w, 1, 'rgba(40,20,40,0.25)');
}

// ---------------------------------------------------------------- the horizon
/** Twin towers and a rose window, in the manner of Notre-Dame. */
function frCathedral(c, x, yb, s, col, lit) {
  const tw = 12 * s, th = 40 * s, gap = 12 * s;
  for (const k of [0, tw + gap]) {
    rect(c, x + k, yb - th, tw, th, col);
    rect(c, x + k, yb - th, Math.max(1, tw * 0.25), th, lit);
    for (let y = yb - th + 4 * s; y < yb - th + 16 * s; y += 6 * s) rect(c, x + k + tw * 0.35, y, tw * 0.3, 4 * s, '#5a4060');
  }
  rect(c, x + tw, yb - th * 0.72, gap, th * 0.72, col);
  poly(c, [[x + tw, yb - th * 0.72], [x + tw + gap, yb - th * 0.72], [x + tw + gap / 2, yb - th * 0.88]], col);
  circle(c, x + tw + gap / 2, yb - th * 0.52, 3 * s, '#ffd8a8');
  line(c, x + tw + gap / 2, yb - th * 0.9, x + tw + gap / 2, yb - th * 1.3, col, 1);
}
/** A gilded dome on a drum of columns, with a lantern and spire, in the manner of the Invalides. */
function frDome(c, x, yb, s, col, lit) {
  // the long front, the drum ringed with columns, a ribbed dome gilded in the haze, lantern, spire
  rect(c, x - 22 * s, yb - 12 * s, 44 * s, 12 * s, col);
  rect(c, x - 22 * s, yb - 12 * s, 4 * s, 12 * s, lit);
  rect(c, x - 10 * s, yb - 22 * s, 20 * s, 10 * s, col);
  for (let k = -8; k <= 8; k += 3) rect(c, x + k * s, yb - 21 * s, 1, 8 * s, lit);
  c.save();
  c.beginPath(); c.rect(x - 12 * s, yb - 40 * s, 24 * s, 18 * s); c.clip();
  ellipse(c, x, yb - 22 * s, 9.5 * s, 13 * s, '#c8a070');
  ellipse(c, x - 3 * s, yb - 25 * s, 4 * s, 9 * s, '#e8c890');
  for (let k = -7; k <= 7; k += 3.5) line(c, x + k * s, yb - 22 * s, x + k * s * 0.3, yb - 34 * s, '#a88060', 1);
  c.restore();
  rect(c, x - 1.5 * s, yb - 39 * s, 3 * s, 5 * s, '#d8b078');
  line(c, x, yb - 39 * s, x, yb - 48 * s, '#e8c890', 1);
}
/** A triumphal arch. */
function frArch(c, x, yb, s, col, lit) {
  rect(c, x, yb - 26 * s, 26 * s, 26 * s, col);
  rect(c, x - 1, yb - 29 * s, 26 * s + 2, 4 * s, col);
  rect(c, x, yb - 26 * s, 4 * s, 26 * s, lit);
  ellipse(c, x + 13 * s, yb - 14 * s, 5 * s, 6 * s, '#caa0b4');
  rect(c, x + 8 * s, yb - 14 * s, 10 * s, 14 * s, '#caa0b4');
}
/** A long barracks block with a mansard roof and chimneys (smoke painted above). */
function frBarracks(c, r, x, yb, w, h, col, roof, lit) {
  rect(c, x, yb - h, w, h, col);
  rect(c, x, yb - h, 2, h, lit);
  poly(c, [[x - 1, yb - h], [x + w + 1, yb - h], [x + w - 3, yb - h - 6], [x + 3, yb - h - 6]], roof);
  for (let k = 5; k < w - 3; k += 6) for (let y = yb - h + 3; y < yb - 2; y += 5) if (r() < 0.3) px(c, x + k, y, '#ffcf92');
  for (let k = 8; k < w; k += 22) rect(c, x + k, yb - h - 10, 2, 5, col);
}
/** A star-shaped citadel: angled bastions, a gatehouse, a keep with its flag. */
function frCitadel(c, r, x0, x1, yb, h, col, lit, dark) {
  const pts = [[x0, yb]];
  const n = Math.max(2, Math.round((x1 - x0) / 60));
  for (let i = 0; i < n; i++) {
    const a = x0 + (x1 - x0) * i / n, b = x0 + (x1 - x0) * (i + 1) / n, m = (a + b) / 2;
    pts.push([a + 4, yb - h], [m - 10, yb - h], [m, yb - h - 5], [m + 10, yb - h], [b - 4, yb - h]);
  }
  pts.push([x1, yb]);
  poly(c, pts, col);
  for (let i = 0; i < n; i++) {
    const m = x0 + (x1 - x0) * (i + 0.5) / n;
    poly(c, [[m - 10, yb - h], [m, yb - h - 5], [m, yb]], lit);
    for (let k = -7; k <= 7; k += 5) px(c, m + k, yb - h + 2, dark);
  }
  const kx = (x0 + x1) / 2;
  rect(c, kx - 14, yb - h - 20, 28, 20, col);
  rect(c, kx - 14, yb - h - 20, 4, 20, lit);
  for (let k = -12; k < 14; k += 5) rect(c, kx + k, yb - h - 23, 3, 3, col);
  rect(c, kx, yb - h - 38, 1, 16, '#3a2e3a');
  return [kx + 1, yb - h - 37];
}
/** A factory chimney stack, for the smoke of an industrious nation. */
function frStack(c, x, yb, h, col, lit) {
  poly(c, [[x - 3, yb], [x + 3, yb], [x + 2, yb - h], [x - 2, yb - h]], col);
  rect(c, x - 3, yb - h - 2, 6, 2, col);
  rect(c, x - 3, yb - h, 1, h, lit);
}
/** Painted smoke drifting from a chimney: soft puffs growing as they rise and lean. */
function frSmoke(c, r, x, y, n, col, lean = 1) {
  for (let i = 0; i < n; i++) {
    const t = i / n;
    ellipse(c, x + lean * t * 30 + r.r(-2, 2), y - t * 40, 2 + t * 7, 1.6 + t * 4, col);
  }
}

/**
 * A heavy dawn cloud, in the manner of Kingdom's: a mass of soft lumps with a flat underside,
 * shadowed on the far side, lit on the edges facing the sun, and glowing pink from below.
 * Painted off to one side and laid on, so the lighting only touches the cloud itself.
 */
function frCloud(c, r, x, y, w, h, o = {}) {
  const pad = 12;
  const cv = newCanvas(Math.ceil(w + pad * 2), Math.ceil(h + pad * 2));
  const k = cv.getContext('2d');
  const lumps = [];
  const n = Math.max(6, Math.round(w / 9));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const top = Math.pow(Math.sin(Math.PI * t), 0.7);
    const rad = h * (0.22 + 0.4 * top) * r.r(0.75, 1.15);
    lumps.push([pad + t * w + r.r(-3, 3), pad + h - rad * 0.9 - top * h * 0.35 * r.r(0.6, 1), rad]);
  }
  for (let i = 0; i < n * 0.6; i++) { const t = r(); lumps.push([pad + t * w, pad + h * r.r(0.55, 0.8), h * r.r(0.18, 0.3)]); }
  // the whole mass in its lit colour, then the body laid over it a little down and away from the
  // sun, so the light only survives as a rim along the edges that face it (no round highlights)
  const lx0 = o.light == null ? -1 : o.light;
  for (const [lx, ly, lr] of lumps) ellipse(k, lx, ly, lr * 1.25, lr, o.lit || '#ffd8d0');
  k.clearRect(0, pad + h, cv.width, pad);
  k.save();
  k.globalCompositeOperation = 'source-atop';
  for (const [lx, ly, lr] of lumps) ellipse(k, lx - lx0 * 2, ly + 2, lr * 1.25, lr, o.body || '#b6a6c4');
  // the shadowed side and belly, then the pink light from below
  for (const [lx, ly, lr] of lumps) ellipse(k, lx - lx0 * (lr * 0.45 + 2), ly + lr * 0.35 + 2, lr * 1.1, lr * 0.75, o.shadow || '#8a7aa0');
  vgrad(k, 0, pad + h * 0.62, cv.width, h * 0.38 + 1, [[0, 'rgba(255,170,180,0)'], [1, o.under || 'rgba(255,176,170,0.8)']]);
  k.restore();
  c.drawImage(cv, Math.round(x - pad), Math.round(y - pad));
}
