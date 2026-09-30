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

// ---------------------------------------------------------------- Paris, as it stood in the 1860s
// Seen far off in the dawn haze, so each is painted in a few flat tones: `P` is the haze palette
// ({ col, lit, dark, deep, roof, win, gap }), lit on the left where the sun comes up.

/** A row of the new boulevards' apartment blocks: six storeys, zinc mansards, chimney pots. */
function frBlocks(c, r, x0, x1, yb, P, hMin = 14, hMax = 24) {
  let x = x0;
  while (x < x1) {
    const w = Math.round(r.r(12, 24)), h = Math.round(r.r(hMin, hMax));
    rect(c, x, yb - h, w, h, P.col);
    rect(c, x, yb - h, 1, h, P.lit);
    poly(c, [[x - 0.5, yb - h], [x + w + 0.5, yb - h], [x + w - 2, yb - h - 4], [x + 2, yb - h - 4]], P.roof);
    for (const k of [1, w - 3]) rect(c, x + k, yb - h - 6, 2, 3, P.dark);
    for (let yy = yb - h + 3; yy < yb - 2; yy += 3) for (let xx = x + 2; xx < x + w - 1; xx += 3) if (r() < 0.1) px(c, xx, yy, P.win);
    x += w;
  }
}

/** Notre-Dame: the square towers of the west front, the nave's long roof, and the new spire (1859). */
function frNotreDame(c, x, yb, s, P) {
  const tw = 13 * s, th = 44 * s, gap = 11 * s, fw = tw * 2 + gap;
  // the nave running back, its flying buttresses, the transept and the apse
  const nx0 = x + fw - 2, nx1 = x + fw + 58 * s, ny = yb - 26 * s;
  rect(c, nx0, ny, nx1 - nx0, yb - ny, P.col);
  poly(c, [[nx0, ny], [nx1, ny], [nx1 - 3, ny - 8 * s], [nx0, ny - 8 * s]], P.roof);
  for (let k = nx0 + 5; k < nx1 - 2; k += 7 * s) { line(c, k, yb - 12 * s, k + 4 * s, ny + 1, P.dark, 1); rect(c, k + 4 * s, ny - 3, 1, 4, P.col); }
  ellipse(c, nx1, yb - 13 * s, 9 * s, 13 * s, P.col);
  const sx = x + fw + 32 * s;
  poly(c, [[sx - 6 * s, ny], [sx + 6 * s, ny], [sx, ny - 11 * s]], P.col);
  // the spire over the crossing: a needle on a lantern of pinnacles
  rect(c, sx - 2 * s, ny - 16 * s, 4 * s, 7 * s, P.dark);
  for (const k of [-2.5, 2]) poly(c, [[sx + k * s, ny - 16 * s], [sx + k * s + 1, ny - 16 * s], [sx + k * s + 0.5, ny - 21 * s]], P.dark);
  poly(c, [[sx - 1.5 * s, ny - 16 * s], [sx + 1.5 * s, ny - 16 * s], [sx, ny - 46 * s]], P.dark);
  // the west front: two towers, the gallery between them, the rose window, three portals
  for (const k of [0, tw + gap]) {
    rect(c, x + k, yb - th, tw, th, P.col);
    rect(c, x + k, yb - th, Math.max(1, tw * 0.22), th, P.lit);
    for (const o of [3, tw - 5]) rect(c, x + k + o * 1, yb - th + 5 * s, 2 * s, 11 * s, P.deep);
    rect(c, x + k - 1, yb - th - 1, tw + 2, 2, P.col);
    for (let q = 0; q < tw; q += 3) px(c, x + k + q, yb - th - 2, P.col);
  }
  rect(c, x + tw, yb - th * 0.78, gap, th * 0.78, P.col);
  for (let q = 1; q < gap; q += 2) rect(c, x + tw + q, yb - th * 0.78 + 1, 1, 4 * s, P.deep);
  rect(c, x, yb - th * 0.6, fw, 1, P.dark);
  circle(c, x + tw + gap / 2, yb - th * 0.46, 3.6 * s, P.deep);
  circle(c, x + tw + gap / 2, yb - th * 0.46, 2.2 * s, P.win);
  for (const k of [tw / 2, tw + gap / 2, fw - tw / 2]) { ellipse(c, x + k, yb - 9 * s, 3 * s, 3 * s, P.deep); rect(c, x + k - 3 * s, yb - 9 * s, 6 * s, 9 * s, P.deep); }
}

/** The Panthéon: a portico with its pediment, a tall drum ringed by columns, a stone dome. */
function frPantheon(c, x, yb, s, P) {
  const bw = 20 * s, bh = 17 * s;
  rect(c, x - bw, yb - bh, bw * 2, bh, P.col);
  rect(c, x - bw, yb - bh, 2 * s, bh, P.lit);
  for (let k = -9; k <= 9; k += 3) rect(c, x + k * s, yb - bh + 5 * s, 1, bh - 5 * s, P.dark);
  poly(c, [[x - 11 * s, yb - bh + 4 * s], [x + 11 * s, yb - bh + 4 * s], [x, yb - bh - 3 * s]], P.col);
  line(c, x - 9 * s, yb - bh + 3 * s, x, yb - bh - 1 * s, P.lit, 1);
  const dw = 9 * s, dy = yb - bh - 3 * s, dh = 15 * s;
  rect(c, x - dw - 2 * s, dy - 1 * s, dw * 2 + 4 * s, 4 * s, P.col);
  rect(c, x - dw, dy - dh, dw * 2, dh, P.col);
  rect(c, x - dw, dy - dh, 2 * s, dh, P.lit);
  for (let k = -dw + 3 * s; k < dw - 1; k += 2.5 * s) rect(c, x + k, dy - dh + 3 * s, 1, dh - 4 * s, P.dark);
  rect(c, x - dw - 1, dy - dh - 2 * s, dw * 2 + 2, 2 * s, P.col);
  const top = dy - dh - 2 * s;
  c.save(); c.beginPath(); c.rect(x - dw - 2, top - 12 * s, dw * 2 + 4, 12 * s); c.clip();
  ellipse(c, x, top, 8 * s, 10 * s, P.col);
  ellipse(c, x - 3 * s, top - 2 * s, 3 * s, 7 * s, P.lit);
  c.restore();
  rect(c, x - 1.5 * s, top - 15 * s, 3 * s, 5 * s, P.col);
  ellipse(c, x, top - 15 * s, 2 * s, 2 * s, P.col);
  rect(c, x, top - 20 * s, 1, 4 * s, P.dark);
}

/**
 * The Invalides: the long old soldiers' hospital in front, and over its church the great dome,
 * gilded, catching the sun before anything else in Paris. `G` is the haze-softened gold.
 */
function frInvalides(c, r, x, yb, s, P, G) {
  const ww = 52 * s, wh = 11 * s;
  rect(c, x - ww, yb - wh, ww * 2, wh, P.col);
  rect(c, x - ww, yb - wh, 1, wh, P.lit);
  poly(c, [[x - ww - 1, yb - wh], [x + ww + 1, yb - wh], [x + ww - 2, yb - wh - 4 * s], [x - ww + 2, yb - wh - 4 * s]], P.roof);
  for (let k = x - ww + 3; k < x + ww - 2; k += 4 * s) { px(c, k, yb - wh - 2 * s, P.dark); if (r() < 0.25) px(c, k, yb - wh + 4 * s, P.win); }
  // the church's front, in two orders under a pediment
  const fw = 15 * s, fh = 22 * s;
  rect(c, x - fw, yb - fh, fw * 2, fh, P.col);
  rect(c, x - fw, yb - fh, 2 * s, fh, P.lit);
  for (let k = -fw + 3 * s; k < fw - 1; k += 3 * s) rect(c, x + k, yb - fh + 3 * s, 1, fh - 4 * s, P.dark);
  rect(c, x - fw, yb - fh * 0.5, fw * 2, 1, P.dark);
  poly(c, [[x - 7 * s, yb - fh], [x + 7 * s, yb - fh], [x, yb - fh - 4 * s]], P.col);
  // the drum, ringed with columns, and the attic above it
  const dw = 11 * s, dh = 12 * s, dy = yb - fh - 3 * s;
  rect(c, x - dw, dy - dh, dw * 2, dh + 3 * s, P.col);
  rect(c, x - dw, dy - dh, 2 * s, dh, P.lit);
  for (let k = -dw + 2.5 * s; k < dw; k += 2.5 * s) rect(c, x + k, dy - dh + 2 * s, 1, dh - 3 * s, P.dark);
  rect(c, x - dw + 1, dy - dh - 3 * s, dw * 2 - 2, 3 * s, P.col);
  // the dome: gold ribs and trophies, lit from the left
  const R = 10 * s, db = dy - dh - 3 * s;
  c.save(); c.beginPath(); c.rect(x - R - 1, db - 17 * s, R * 2 + 2, 17 * s); c.clip();
  ellipse(c, x, db, R, 16 * s, G.mid);
  ellipse(c, x - 3 * s, db - 2 * s, R * 0.55, 13 * s, G.lit);
  for (let k = -R + 2.5 * s; k < R; k += 2.5 * s) line(c, x + k, db, x + k * 0.25, db - 15 * s, G.shade, 1);
  line(c, x - 5 * s, db - 2 * s, x - 2 * s, db - 13 * s, G.hi, 1);
  c.restore();
  for (let k = -R + 3 * s; k < R - 1; k += 4 * s) px(c, x + k, db - 2 * s, G.hi);
  // the lantern, its spire, and the cross
  rect(c, x - 2 * s, db - 22 * s, 4 * s, 6 * s, G.mid);
  rect(c, x - 2 * s, db - 22 * s, 1, 6 * s, G.hi);
  poly(c, [[x - 2 * s, db - 22 * s], [x + 2 * s, db - 22 * s], [x, db - 34 * s]], G.lit);
  rect(c, x, db - 38 * s, 1, 5 * s, G.hi);
  rect(c, x - 1, db - 36 * s, 3, 1, G.hi);
  return [x, db - 38 * s];
}

/** The Vendôme column, cast from the cannon taken at Austerlitz, the Emperor on top. */
function frVendome(c, x, yb, s, P, bronze) {
  rect(c, x - 4 * s, yb - 8 * s, 8 * s, 8 * s, P.col);
  rect(c, x - 4 * s, yb - 8 * s, 1, 8 * s, P.lit);
  rect(c, x - 1.5 * s, yb - 44 * s, 3 * s, 36 * s, bronze);
  for (let y = yb - 42 * s; y < yb - 9 * s; y += 3 * s) line(c, x - 1.5 * s, y + 1.5 * s, x + 1.5 * s, y, P.deep, 1);
  rect(c, x - 2.5 * s, yb - 46 * s, 5 * s, 2 * s, bronze);
  rect(c, x - 1 * s, yb - 49 * s, 2 * s, 3 * s, bronze);
  rect(c, x - 0.5, yb - 53 * s, 1, 4 * s, bronze);
}

/** The Arc de Triomphe, its great arch open to the sky beyond. */
function frArcTriomphe(c, x, yb, s, P) {
  const w = 30 * s, h = 32 * s;
  rect(c, x, yb - h, w, h, P.col);
  rect(c, x, yb - h, 3 * s, h, P.lit);
  rect(c, x - 1, yb - h, w + 2, 2 * s, P.col);
  rect(c, x, yb - h + 2 * s, w, 1, P.dark);
  rect(c, x, yb - h + 7 * s, w, 1, P.dark);
  const aw = 11 * s, ax = x + (w - aw) / 2, at = yb - h + 11 * s;
  ellipse(c, ax + aw / 2, at + aw / 2, aw / 2, aw / 2, P.gap);
  rect(c, ax, at + aw / 2, aw, yb - at - aw / 2, P.gap);
  for (const k of [2 * s, w - 7 * s]) rect(c, x + k, yb - 17 * s, 5 * s, 7 * s, P.lit);
}

/** The Tour Saint-Jacques: a lone Gothic bell tower, pinnacles at its corners. */
function frTourStJacques(c, x, yb, s, P) {
  const w = 9 * s, h = 40 * s;
  rect(c, x, yb - h, w, h, P.col);
  rect(c, x, yb - h, 2 * s, h, P.lit);
  for (const k of [2 * s, w - 3 * s]) rect(c, x + k, yb - h + 2, 1, h - 2, P.dark);
  rect(c, x + w / 2 - 1 * s, yb - h + 6 * s, 2 * s, 12 * s, P.deep);
  rect(c, x - 1, yb - h - 1, w + 2, 2, P.col);
  for (const k of [-1, w / 2 - 1, w - 1]) poly(c, [[x + k, yb - h - 1], [x + k + 2, yb - h - 1], [x + k + 1, yb - h - 6 * s]], P.col);
  rect(c, x - 1, yb - h - 8 * s, 3 * s, 7 * s, P.col);
  rect(c, x, yb - h - 11 * s, 1, 3 * s, P.dark);
}

/** The new Opera going up: its arcade built, the stage house still a cage of scaffolding and cranes. */
function frOperaWorks(c, r, x, yb, s, P, wood) {
  const fw = 34 * s, fh = 16 * s;
  rect(c, x, yb - fh, fw, fh, P.col);
  rect(c, x, yb - fh, 2 * s, fh, P.lit);
  for (let k = 3 * s; k < fw - 3 * s; k += 5 * s) { ellipse(c, x + k + 1.5 * s, yb - 7 * s, 1.5 * s, 1.5 * s, P.deep); rect(c, x + k, yb - 7 * s, 3 * s, 7 * s, P.deep); }
  for (let k = 2 * s; k < fw - 1; k += 3 * s) rect(c, x + k, yb - fh + 2 * s, 1, 5 * s, P.dark);
  // the stage house: built to half its height, then poles and ledgers and a few braces
  const sx = x + 8 * s, sw = 22 * s, built = 10 * s, full = 32 * s;
  rect(c, sx, yb - fh - built, sw, built, P.col);
  rect(c, sx, yb - fh - built, 1, built, P.lit);
  for (let k = 0; k <= sw; k += 4 * s) rect(c, sx + k, yb - fh - full, 1, full - built, wood);
  for (let y = yb - fh - built - 4 * s; y > yb - fh - full; y -= 4 * s) rect(c, sx - 1, y, sw + 2, 1, wood);
  line(c, sx, yb - fh - built, sx + sw * 0.5, yb - fh - full + 2, wood, 1);
  line(c, sx + sw, yb - fh - built, sx + sw * 0.5, yb - fh - full + 2, wood, 1);
  // two cranes, each with a stone hanging from its jib
  for (const [cx, hh, jib] of [[x - 2 * s, 40 * s, 14 * s], [x + fw + 2 * s, 34 * s, -12 * s]]) {
    rect(c, cx, yb - hh, 1.5, hh, wood);
    line(c, cx, yb - hh + 1, cx + jib, yb - hh + 4 * s, wood, 1);
    line(c, cx, yb - hh + 1, cx - jib * 0.35, yb - hh + 3 * s, wood, 1);
    line(c, cx + jib * 0.95, yb - hh + 4 * s, cx + jib * 0.95, yb - hh + 12 * s, P.deep, 1);
    rect(c, cx + jib * 0.95 - 1.5 * s, yb - hh + 12 * s, 3 * s, 2 * s, P.lit);
  }
}

/** The keep of Vincennes, the army's fortress: a tall square tower, a turret at each corner. */
function frVincennes(c, x, yb, s, P) {
  const w = 14 * s, h = 46 * s;
  rect(c, x, yb - h, w, h, P.col);
  rect(c, x, yb - h, 2 * s, h, P.lit);
  for (const k of [-2 * s, w - 2 * s]) {
    rect(c, x + k, yb - h - 3 * s, 4 * s, h * 0.9, P.col);
    rect(c, x + k, yb - h - 3 * s, 1, h * 0.9, k < 0 ? P.lit : P.dark);
    poly(c, [[x + k - 0.5, yb - h - 3 * s], [x + k + 4 * s + 0.5, yb - h - 3 * s], [x + k + 2 * s, yb - h - 9 * s]], P.roof);
  }
  rect(c, x - 1, yb - h + 3 * s, w + 2, 2 * s, P.col);
  for (let k = 0; k < w; k += 2 * s) px(c, x + k, yb - h + 5 * s, P.deep);
  for (const [dx, dy] of [[5, 12], [8, 22], [5, 30]]) rect(c, x + dx * s, yb - h + dy * s, 1.5 * s, 3 * s, P.deep);
  rect(c, x + w / 2, yb - h - 12 * s, 1, 12 * s, P.dark);
  return [x + w / 2 + 1, yb - h - 12 * s];
}

// ---------------------------------------------------------------- the railway
/**
 * A stone viaduct carrying the railway across the valley: the deck and its parapet at `deck`,
 * round arches between tall piers that go down out of sight, lit on the faces turned to the sun.
 */
function frViaduct(c, x0, x1, deck, yb, span, P) {
  const pier = Math.max(3, Math.round(span * 0.2)), aw = span - pier, crown = deck + 3;
  rect(c, x0, deck, x1 - x0, yb - deck, P.col);
  c.save();
  c.globalCompositeOperation = 'destination-out';
  for (let x = x0 + pier; x < x1; x += span) {
    ellipse(c, x + aw / 2, crown + aw / 2, aw / 2, aw / 2, '#000');
    rect(c, x, crown + aw / 2, aw, yb - crown, '#000');
  }
  c.restore();
  for (let x = x0 + pier; x < x1; x += span) {
    rect(c, x + aw, crown + aw / 2, 1, yb - crown, P.lit);
    rect(c, x - 1, crown + aw / 2, 1, yb - crown, P.dark);
    px(c, x + aw / 2, crown - 1, P.dark);
  }
  rect(c, x0, deck, x1 - x0, 2, P.lit);
  rect(c, x0, deck + 2, x1 - x0, 1, P.dark);
  rect(c, x0, deck - 1, x1 - x0, 1, P.rail);
}

/** The telegraph along the line: poles every so often, their wires sagging between. */
function frTelegraph(c, x0, x1, yb, gap, P) {
  let prev = null;
  for (let x = x0; x <= x1; x += gap) {
    rect(c, x, yb - 9, 1, 9, P.pole);
    rect(c, x - 1, yb - 9, 3, 1, P.pole);
    if (prev != null) for (let k = 0; k <= gap; k += 1) { const t = k / gap; px(c, prev + k, yb - 9 + Math.round(Math.sin(t * Math.PI) * 2), P.wire); }
    prev = x;
  }
}

// ---------------------------------------------------------------- the camp's grandeur (and a little alt-history)
/**
 * A fortress-city on its rock, the heart of the army: a craggy mound, a curtain wall ringed with
 * round towers under red pointed roofs, an inner ring higher up, and the great keep rising in
 * tiers to its spire; an arched causeway steps down on the right. x is the centre, yb the rock's
 * foot. Returns the top of the flagstaff.
 */
function frCastleRock(c, r, x, yb, s, P) {
  const u = (v) => v * s, X = (v) => x + u(v), Y = (v) => yb - u(v);
  // the rock: a heaped, craggy mound, lit on its left
  const rock = [[X(-116), yb]];
  for (let k = -110; k <= 110; k += 10) rock.push([X(k + r.r(-3, 3)), Y(44 * Math.pow(Math.cos((k / 118) * Math.PI / 2), 0.7) + r.r(-3, 4))]);
  rock.push([X(118), yb]);
  poly(c, rock, P.rock);
  c.save(); c.beginPath(); c.moveTo(rock[0][0], rock[0][1]); for (const p of rock) c.lineTo(p[0], p[1]); c.closePath(); c.clip();
  for (let i = 0; i < 70; i++) { const a = X(r.r(-116, 20)), b = Y(r.r(0, 44)); poly(c, [[a, b], [a + u(r.r(4, 10)), b - u(r.r(2, 5))], [a + u(r.r(8, 16)), b + u(r.r(0, 3))]], P.rockLit); }
  for (let i = 0; i < 60; i++) { const a = X(r.r(-20, 116)), b = Y(r.r(0, 40)); poly(c, [[a, b], [a + u(r.r(4, 10)), b - u(r.r(2, 5))], [a + u(r.r(8, 16)), b + u(r.r(0, 3))]], P.rockDark); }
  for (let i = 0; i < 90; i++) px(c, X(r.r(-110, 110)), Y(r.r(0, 40)), r.pick([P.scrub, P.rockDark, P.rockLit]));
  c.restore();
  const tower = (tx, base, h, w, roofH) => {
    rect(c, X(tx - w / 2), Y(base + h), u(w), u(h), P.wall);
    rect(c, X(tx - w / 2), Y(base + h), u(w * 0.35), u(h), P.wallLit);
    rect(c, X(tx + w / 2) - u(w * 0.25), Y(base + h), u(w * 0.25), u(h), P.wallDark);
    for (let y = base + 5; y < base + h - 3; y += 7) rect(c, X(tx) - 0.5, Y(y + 3), 1, u(3), P.win);
    rect(c, X(tx - w / 2 - 0.8), Y(base + h + 1), u(w + 1.6), u(1.5), P.wallLit);
    poly(c, [[X(tx - w / 2 - 1), Y(base + h + 1)], [X(tx + w / 2 + 1), Y(base + h + 1)], [X(tx), Y(base + h + 1 + roofH)]], P.roof);
    poly(c, [[X(tx - w / 2 - 1), Y(base + h + 1)], [X(tx), Y(base + h + 1 + roofH)], [X(tx), Y(base + h + 1)]], P.roofLit);
    rect(c, X(tx) - 0.5, Y(base + h + roofH + 5), 1, u(4), P.wallDark);
  };
  const wall = (x0, x1, base, h) => {
    rect(c, X(x0), Y(base + h), u(x1 - x0), u(h), P.wall);
    rect(c, X(x0), Y(base + h), u((x1 - x0) * 0.3), u(h), P.wallLit);
    for (let k = x0; k < x1; k += 3) rect(c, X(k), Y(base + h + 2), u(1.6), u(2), k < x0 + (x1 - x0) * 0.3 ? P.wallLit : P.wall);
    for (let y = base + 3; y < base + h; y += 3.5) line(c, X(x0), Y(y), X(x1), Y(y), P.wallDark, 1);
  };
  // the outer curtain and its towers
  wall(-84, 76, 34, 20);
  for (const [tx, h] of [[-84, 30], [-60, 26], [-34, 28], [-8, 26], [18, 28], [44, 26], [72, 32]]) tower(tx, 34, h, 8, 11);
  // the inner ring, higher up the rock
  wall(-56, 50, 54, 18);
  for (const [tx, h] of [[-54, 26], [-30, 30], [26, 30], [48, 26]]) tower(tx, 54, h, 7, 12);
  // the great keep in tiers, and its spire
  for (const [w, b, h] of [[34, 54, 26], [24, 80, 22], [16, 102, 18], [10, 120, 14]]) {
    rect(c, X(-w / 2), Y(b + h), u(w), u(h), P.wall);
    rect(c, X(-w / 2), Y(b + h), u(w * 0.35), u(h), P.wallLit);
    rect(c, X(w / 2) - u(w * 0.22), Y(b + h), u(w * 0.22), u(h), P.wallDark);
    for (let k = -w / 2 + 3; k < w / 2 - 2; k += 4) { rect(c, X(k), Y(b + h - 4), u(1.5), u(4), P.win); rect(c, X(k), Y(b + h * 0.45), u(1.5), u(3), P.winDark); }
    for (let k = -w / 2; k < w / 2; k += 3) rect(c, X(k), Y(b + h + 1.5), u(1.6), u(1.5), k < -w / 6 ? P.wallLit : P.wall);
  }
  for (const [tx, b] of [[-17, 80], [15, 80], [-12, 102], [10, 102]]) tower(tx, b, 10, 5, 9);
  poly(c, [[X(-6), Y(134)], [X(6), Y(134)], [X(0), Y(162)]], P.roof);
  poly(c, [[X(-6), Y(134)], [X(0), Y(162)], [X(0), Y(134)]], P.roofLit);
  rect(c, X(0) - 0.5, Y(176), 1, u(15), P.wallDark);
  // the causeway: arches stepping down to the right, and a gate tower at their foot
  for (const [ax, ab, ah] of [[88, 18, 26], [104, 8, 26], [120, 0, 24]]) {
    rect(c, X(ax - 7), Y(ab + ah), u(14), u(ah), P.wall);
    rect(c, X(ax - 7), Y(ab + ah), u(3), u(ah), P.wallLit);
    ellipse(c, X(ax), Y(ab + ah * 0.55), u(4), u(5), P.winDark);
    rect(c, X(ax - 4), Y(ab + ah * 0.55), u(8), u(ah * 0.55), P.winDark);
    for (const k of [-7, 5]) poly(c, [[X(ax + k), Y(ab + ah)], [X(ax + k + 2), Y(ab + ah)], [X(ax + k + 1), Y(ab + ah + 5)]], P.wallLit);
  }
  tower(128, 0, 20, 7, 9);
  return [X(0) + 0.5, Y(176)];
}

/** An iron tower of lattice girders on four splayed legs, three platforms and a lantern on top. */
function frEiffel(c, x, yb, h, P) {
  const hw = (t) => h * (0.215 * Math.pow(1 - t, 2.6) + 0.011);
  const L = [], R = [];
  for (let t = 0; t <= 1.0001; t += 0.02) { L.push([x - hw(t), yb - h * t]); R.push([x + hw(t), yb - h * t]); }
  poly(c, [...L, ...R.reverse()], P.col);
  // the great arch between the legs, and the gap up to the second platform
  c.save(); c.globalCompositeOperation = 'destination-out';
  ellipse(c, x, yb, hw(0) * 0.62, h * 0.15, '#000');
  poly(c, [[x - hw(0.21) * 0.5, yb - h * 0.2], [x + hw(0.21) * 0.5, yb - h * 0.2], [x + 0.6, yb - h * 0.45], [x - 0.6, yb - h * 0.45]], '#000');
  c.restore();
  // the girders' lattice, the lit edge of the legs
  c.save(); c.beginPath(); c.moveTo(L[0][0], L[0][1]); for (const p of [...L, ...R]) c.lineTo(p[0], p[1]); c.closePath(); c.clip();
  for (let k = -h; k < h; k += 3.5) { line(c, x + k, yb, x + k + h * 0.6, yb - h * 0.6, P.dark, 1); line(c, x + k, yb, x + k - h * 0.6, yb - h * 0.6, P.dark, 1); }
  c.restore();
  for (let t = 0; t < 0.96; t += 0.02) { px(c, x - hw(t), yb - h * t, P.lit); px(c, x - hw(t) + 1, yb - h * t, P.lit); }
  // the platforms and the lantern
  for (const [t, ext] of [[0.2, 3], [0.47, 2], [0.88, 1]]) { rect(c, x - hw(t) - ext, yb - h * t - 1, (hw(t) + ext) * 2, 2, P.dark); rect(c, x - hw(t) - ext, yb - h * t - 2, (hw(t) + ext) * 2, 1, P.lit); }
  rect(c, x - 1.5, yb - h - 4, 3, 4, P.col); rect(c, x - 0.5, yb - h - 10, 1, 7, P.dark);
  px(c, x, yb - h - 3, P.glint || '#fff0c8');
}

/** The Louvre of the Second Empire: long wings on an arcade, windows aglow, mansard roofs, and the
 *  great pavilion in the middle with its sculpted front and square dome. x is the centre. */
function frLouvre(c, r, x, yb, s, P, G) {
  const u = (v) => v * s, X = (v) => x + u(v), Y = (v) => yb - u(v);
  const R = (x0, y0, x1, y1, col) => rect(c, X(x0), Y(y1), u(x1 - x0), u(y1 - y0), col);
  // the wings: an arcade below, two floors of tall windows, a mansard with dormers
  R(-50, 0, 50, 17, P.col); R(-50, 0, -40, 17, P.lit);
  for (let k = -48; k < 48; k += 4) { ellipse(c, X(k + 1.5), Y(5), u(1.3), u(1.3), P.deep); R(k + 0.3, 0, k + 2.7, 5, P.deep); if (Math.abs(k) > 12) { R(k + 0.6, 8, k + 2.2, 11.5, r() < 0.5 ? P.win : P.dark); R(k + 0.6, 12.5, k + 2.2, 15.5, r() < 0.3 ? P.win : P.dark); } }
  poly(c, [[X(-51), Y(17)], [X(51), Y(17)], [X(49), Y(22)], [X(-49), Y(22)]], P.roof);
  for (let k = -46; k < 46; k += 6) if (Math.abs(k) > 12) { R(k, 18, k + 2, 21, P.col); px(c, X(k + 1), Y(19.5), P.win); }
  // the corner pavilions
  for (const px_ of [-50, 42]) { R(px_, 0, px_ + 8, 24, P.col); R(px_, 0, px_ + 2.5, 24, P.lit); poly(c, [[X(px_ - 1), Y(24)], [X(px_ + 9), Y(24)], [X(px_ + 7), Y(30)], [X(px_ + 1), Y(30)]], P.roof); R(px_ + 3, 14, px_ + 5, 20, P.win); }
  // the great pavilion: columns in pairs, a sculpted pediment, caryatids, the square dome
  R(-12, 0, 12, 30, P.col); R(-12, 0, -7, 30, P.lit); R(9, 0, 12, 30, P.dark);
  ellipse(c, X(0), Y(9), u(4), u(4), P.deep); R(-4, 0, 4, 9, P.deep);
  for (const k of [-11, -8, 6, 9]) R(k, 2, k + 1.2, 28, P.hi);
  for (const k of [-5, 3]) { R(k, 14, k + 2.5, 22, P.win); ellipse(c, X(k + 1.25), Y(22), u(1.25), u(1.25), P.win); }
  poly(c, [[X(-12), Y(30)], [X(12), Y(30)], [X(0), Y(36)]], P.col);
  poly(c, [[X(-9), Y(30.8)], [X(9), Y(30.8)], [X(0), Y(34.6)]], P.dark);
  for (let k = -6; k <= 6; k += 3) px(c, X(k), Y(32), P.hi);
  // the dome, curved like a bell, gilded ribs, oculi, statues at its corners
  c.fillStyle = P.roof; c.beginPath(); c.moveTo(X(-11), Y(36));
  c.quadraticCurveTo(X(-11), Y(52), X(0), Y(55)); c.quadraticCurveTo(X(11), Y(52), X(11), Y(36)); c.closePath(); c.fill();
  c.fillStyle = P.roofLit; c.beginPath(); c.moveTo(X(-11), Y(36)); c.quadraticCurveTo(X(-11), Y(52), X(0), Y(55)); c.lineTo(X(-3), Y(36)); c.closePath(); c.fill();
  for (const k of [-7, 0, 7]) line(c, X(k), Y(37), X(k * 0.4), Y(53), G.lit, 1);
  for (const k of [-5, 5]) { ellipse(c, X(k), Y(43), u(1.4), u(1.8), P.win); }
  R(-1, 55, 1, 60, G.mid); px(c, X(0), Y(60) - 1, G.hi);
  for (const k of [-12, 11]) { R(k, 36, k + 1.2, 40, P.hi); }
}

/** A great siege gun on its slab carriage, its long barrel raised: shown, not fired. */
function frSiegeGun(c, x, yb, s, P, dir = 1) {
  const u = (v) => v * s;
  poly(c, [[x - dir * u(8), yb], [x + dir * u(8), yb], [x + dir * u(6), yb - u(5)], [x - dir * u(6), yb - u(6)]], P.wood);
  circle(c, x - dir * u(3), yb - u(3), u(3.2), P.dark);
  circle(c, x - dir * u(3), yb - u(3), u(1.2), P.wood);
  const a = -0.34, L = u(22);
  const bx = x - dir * u(2), by = yb - u(7);
  line(c, bx, by, bx + dir * Math.cos(a) * L, by + Math.sin(a) * L, P.iron, Math.max(2, u(3)));
  line(c, bx, by - 0.5, bx + dir * Math.cos(a) * L, by + Math.sin(a) * L - 0.5, P.lit, 1);
  circle(c, bx + dir * Math.cos(a) * L, by + Math.sin(a) * L, Math.max(1, u(1.8)), P.iron);
}

/** A siege mortar: a squat bronze barrel raised steeply on its timber bed. */
function frMortar(c, x, yb, s, P) {
  const u = (v) => v * s;
  rect(c, x - u(6), yb - u(3), u(12), u(3), P.wood);
  rect(c, x - u(6), yb - u(3), u(12), 1, P.lit);
  poly(c, [[x - u(4), yb - u(3)], [x + u(2), yb - u(3)], [x + u(6), yb - u(11)], [x + u(1), yb - u(13)]], P.bronze);
  poly(c, [[x - u(4), yb - u(3)], [x - u(1), yb - u(3)], [x + u(3), yb - u(12)], [x + u(1), yb - u(13)]], P.lit);
  ellipse(c, x + u(3.5), yb - u(12), u(2.8), u(1.4), P.dark, -1);
  for (let k = 0; k < 3; k++) circle(c, x - u(8) - k * u(2.6), yb - u(1.2), u(1.2), P.dark);
}

/** An iron gun turret on the ramparts: a riveted drum, its gun run out through the port. */
function frTurret(c, x, yb, s, dir = 1) {
  const u = (v) => v * s, iron = '#4a4452', lit = '#7c7688', dark = '#2e2a36';
  rect(c, x - u(11), yb - u(3), u(22), u(3), '#a88c9c');
  rect(c, x - u(10), yb - u(13), u(20), u(10), iron);
  rect(c, x - u(10), yb - u(13), u(5), u(10), lit);
  rect(c, x + u(7), yb - u(13), u(3), u(10), dark);
  ellipse(c, x, yb - u(13), u(10), u(2.2), '#5e5868');
  ellipse(c, x - u(3), yb - u(13.5), u(4), u(1), lit);
  for (let k = -9; k <= 9; k += 3) { px(c, x + u(k), yb - u(11), '#9a94a8'); px(c, x + u(k), yb - u(5), '#9a94a8'); }
  rect(c, x - u(2), yb - u(15), u(4), u(2), dark);
  rect(c, x + dir * u(8) - (dir < 0 ? u(4) : 0), yb - u(10), u(4), u(4), dark);
  line(c, x + dir * u(10), yb - u(8), x + dir * u(24), yb - u(9.5), '#3a3442', Math.max(2, u(2.6)));
  line(c, x + dir * u(10), yb - u(9), x + dir * u(24), yb - u(10.5), lit, 1);
  rect(c, x + dir * u(23) - 1, yb - u(11), u(2), u(3.5), dark);
}

/** Barbed wire along a wall top: iron stakes, three sagging strands, barbs every few inches. */
function frBarbedWire(c, r, x0, x1, y, o = {}) {
  const gap = o.gap || 14, hh = o.h || 9, wire = o.wire || '#3a3440', barb = o.barb || '#6a6070';
  for (let x = x0; x <= x1; x += gap) { line(c, x, y, x + (o.lean || 0), y - hh, o.post || '#4a3e3a', 1); px(c, x + (o.lean || 0), y - hh - 1, barb); }
  for (const f of [0.35, 0.65, 0.95]) {
    for (let x = x0; x < x1; x += gap) {
      for (let t = 0; t <= 1; t += 0.08) {
        const xx = x + gap * t, yy = y - hh * f + Math.sin(t * Math.PI) * 1.4;
        px(c, xx, yy, wire);
        if (Math.round(xx) % 4 === 0) { px(c, xx - 1, yy - 1, barb); px(c, xx + 1, yy + 1, barb); px(c, xx + 1, yy - 1, barb); px(c, xx - 1, yy + 1, barb); }
      }
    }
  }
}

/** A Czech hedgehog: three steel angle-girders crossed, to stop anything coming down the road. */
function frHedgehog(c, x, yb, s = 1) {
  const u = (v) => v * s, iron = '#3e3a44', lit = '#8a8494', rust = '#7a4a34';
  const beam = (x0, y0, x1, y1) => { line(c, x0, y0, x1, y1, iron, Math.max(2, u(2))); line(c, x0 - 0.5, y0 - 0.5, x1 - 0.5, y1 - 0.5, lit, 1); };
  beam(x - u(7), yb, x + u(6), yb - u(13));
  beam(x + u(7), yb, x - u(6), yb - u(13));
  beam(x - u(9), yb - u(8), x + u(9), yb - u(5));
  px(c, x - u(3), yb - u(4), rust); px(c, x + u(4), yb - u(10), rust); px(c, x + u(1), yb - u(7), rust);
}

/** The camp's great gate: two massive towers with machicolations and crenels, the arch between
 *  with its portcullis raised, gun loops, lamps, and a flagstaff on top. Returns the staff's top. */
function frGatehouse(c, r, x, yb, o = {}) {
  const S_ = FR.stone, tw = 26, th = 84, bh = 64, aw = 26, ah = 42;
  const block = (x0, w, h) => {
    vgrad(c, x0, yb - h, w, h, [[0, S_.hi], [0.5, S_.lit], [1, S_.mid]]);
    for (let y = yb - h + 4, k = 0; y < yb; y += 5, k++) { rect(c, x0, y, w, 1, S_.line); for (let xx = x0 + (k % 2) * 5; xx < x0 + w; xx += 10) rect(c, xx, y, 1, 5, S_.line); }
    rect(c, x0, yb - h, 3, h, S_.hi);
    rect(c, x0 + w - 4, yb - h, 4, h, S_.shade);
    for (let xx = x0 - 2; xx < x0 + w + 2; xx += 4) { rect(c, xx, yb - h - 4, 3, 4, S_.mid); rect(c, xx, yb - h - 6, 3, 2, S_.lit); }
    rect(c, x0 - 3, yb - h, w + 6, 3, S_.lit);
    for (let xx = x0 - 2; xx < x0 + w + 2; xx += 4) rect(c, xx, yb - h + 3, 2, 3, S_.deep);
    for (let yy = yb - h + 18; yy < yb - 16; yy += 18) { rect(c, x0 + w / 2 - 1, yy, 2, 8, S_.deep); rect(c, x0 + w / 2 - 3, yy + 3, 6, 2, S_.deep); }
  };
  // the middle, with the arch and the portcullis
  block(x - tw / 2 - aw / 2 - 4, aw + 8 + tw, bh);
  ellipse(c, x, yb - ah, aw / 2 + 2, 10, S_.hi);
  rect(c, x - aw / 2 - 2, yb - ah, aw + 4, ah, S_.hi);
  ellipse(c, x, yb - ah, aw / 2, 9, '#2a2230');
  rect(c, x - aw / 2, yb - ah, aw, ah, '#2a2230');
  for (let k = -aw / 2 + 2; k < aw / 2; k += 4) { rect(c, x + k, yb - ah - 7, 1, 17, '#5a5460'); poly(c, [[x + k - 1, yb - ah + 10], [x + k + 2, yb - ah + 10], [x + k + 0.5, yb - ah + 13]], '#6a6470'); }
  for (let y = yb - ah - 4; y < yb - ah + 10; y += 4) rect(c, x - aw / 2, y, aw, 1, '#5a5460');
  rect(c, x - aw / 2, yb - 3, aw, 3, '#4a3e3a');
  rect(c, x - 12, yb - bh + 8, 24, 7, '#2a2e5a'); for (let k = 0; k < 5; k++) rect(c, x - 10 + k * 4.5, yb - bh + 10, 3, 3, FR.gold.lit);
  // the two towers
  for (const tx of [x - aw / 2 - 4 - tw, x + aw / 2 + 4]) block(tx, tw, th);
  // lamps either side of the arch
  for (const lx of [x - aw / 2 - 8, x + aw / 2 + 6]) { rect(c, lx, yb - 30, 2, 4, '#2e2830'); rect(c, lx - 1, yb - 36, 4, 6, FR.lit); glow(c, lx + 1, yb - 33, 14, 'rgba(255,200,120,0.55)'); }
  rect(c, x, yb - bh - 30, 2, 26, '#3a2e2a'); circle(c, x + 1, yb - bh - 31, 2, FR.gold.lit);
  return [x + 1, yb - bh - 29];
}

/** A lamp post of the camp: an iron column, a glazed lantern, its light. */
function frLampPost(c, x, yb, h = 30) {
  rect(c, x - 2, yb - 3, 5, 3, '#2e2830');
  rect(c, x, yb - h, 1.5, h, '#2e2830');
  rect(c, x - 2, yb - h - 1, 6, 1, '#2e2830');
  rect(c, x - 1.5, yb - h - 7, 5, 6, '#3a3444');
  rect(c, x - 0.5, yb - h - 6, 3, 4, FR.lit);
  poly(c, [[x - 2.5, yb - h - 7], [x + 4.5, yb - h - 7], [x + 1, yb - h - 10]], '#2e2830');
  glow(c, x + 1, yb - h - 4, 14, 'rgba(255,205,130,0.55)');
}

/** A steam ship of the line of the Imperial Navy, moored: a black hull banded in white with two
 *  tiers of guns run out, the carved stern with its lit gallery, three masts with yards and furled
 *  sails, shrouds and stays, and the funnel amidships. x is the bow, yb the waterline; the stern is
 *  to the right. Returns where the walk's flags and funnel smoke go. */
function frWarship(c, r, x, yb, s = 1) {
  const u = (v) => v * s, X = (v) => x + u(v), Y = (v) => yb - u(v), L = 300;
  const deck = (t) => 34 + 7 * Math.pow(2 * t - 1, 2);
  const hull = '#221e28', hullLit = '#3e3848', band = '#e8dfd2', bandShade = '#b8ae9e', port = '#141018', muzzle = '#5a5664';
  // masts first (behind the hull), with their yards, furled sails, tops and the shrouds
  const masts = [[76, 150], [156, 166], [232, 122]], tops = [];
  for (const [mx, mh] of masts) {
    const base = Y(deck(mx / L));
    rect(c, X(mx) - 1.5, Y(deck(mx / L) + mh), 3, u(mh), '#5a4030');
    rect(c, X(mx) - 1.5, Y(deck(mx / L) + mh), 1, u(mh), '#8a6a4a');
    for (const [f, yw] of [[0.3, 40], [0.55, 32], [0.76, 24], [0.92, 16]]) {
      const yy = Y(deck(mx / L) + mh * f);
      rect(c, X(mx - yw / 2), yy, u(yw), 1.5, '#4a3424');
      ellipse(c, X(mx), yy + 2, u(yw / 2), 2.2, '#efe6d2');
      for (let k = -yw / 2 + 2; k < yw / 2; k += 5) px(c, X(mx + k), yy + 3, '#c8bca4');
    }
    for (const f of [0.42, 0.7]) rect(c, X(mx - 6), Y(deck(mx / L) + mh * f), u(12), 1.5, '#4a3424');
    for (const side of [-1, 1]) for (let k = 0; k < 3; k++) line(c, X(mx + side * (10 + k * 3)), base, X(mx) + side, Y(deck(mx / L) + mh * (0.42 + k * 0.14)), '#4a3e3a', 1);
    tops.push([X(mx), Y(deck(mx / L) + mh)]);
  }
  // the stays, running fore and aft, and the bowsprit
  line(c, tops[0][0], tops[0][1], X(-54), Y(deck(0) + 34), '#4a3e3a', 1);
  line(c, tops[1][0], tops[1][1], tops[0][0], Y(deck(0.25) + 60), '#4a3e3a', 1);
  line(c, tops[2][0], tops[2][1], tops[1][0], Y(deck(0.5) + 70), '#4a3e3a', 1);
  line(c, X(2), Y(deck(0) + 2), X(-58), Y(deck(0) + 36), '#5a4030', Math.max(2, u(2.5)));
  line(c, X(-30), Y(deck(0) + 20), X(-58), Y(deck(0) + 36), '#8a6a4a', 1);
  // the funnel amidships
  const fx = 116;
  rect(c, X(fx - 5), Y(deck(fx / L) + 44), u(10), u(44), '#1e1a20');
  rect(c, X(fx - 5), Y(deck(fx / L) + 44), u(3), u(44), '#4a4452');
  rect(c, X(fx - 5.5), Y(deck(fx / L) + 44), u(11), u(3), '#6a4a3a');
  // the hull: black, the white bands of the gun decks, the ports and guns, copper at the waterline
  const top = [], n = 40;
  for (let i = 0; i <= n; i++) { const t = i / n; top.push([X(t * L), Y(deck(t))]); }
  poly(c, [[X(8), yb], [X(-4), Y(12)], [X(-10), Y(deck(0) + 4)], ...top, [X(L + 14), Y(deck(1) + 4)], [X(L + 8), Y(20)], [X(L), yb]], hull);
  poly(c, [[X(-10), Y(deck(0) + 4)], [X(-4), Y(12)], [X(8), yb], [X(30), yb], [X(20), Y(deck(0.05))]], hullLit);
  for (const [b0, b1] of [[10, 15], [21, 26]]) {
    c.save(); c.beginPath(); c.rect(X(2), Y(b1 + 6), u(L), u(b1 - b0 + 12)); c.clip();
    for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n, sag = (t) => deck(t) - 34; poly(c, [[X(t0 * L), Y(b1 + sag(t0))], [X(t1 * L), Y(b1 + sag(t1))], [X(t1 * L), Y(b0 + sag(t1))], [X(t0 * L), Y(b0 + sag(t0))]], band); }
    c.restore();
    for (let k = 14; k < L - 10; k += 11) {
      const t = k / L, py = Y(b1 + deck(t) - 34);
      rect(c, X(k), py + 1, u(4), u(b1 - b0 - 1.5), port);
      rect(c, X(k) - 1, py + u((b1 - b0) / 2), u(2), 1.5, muzzle);
      px(c, X(k) - 1, py + u((b1 - b0) / 2), '#8a8698');
    }
    line(c, X(2), Y(b0 + 0.5), X(L), Y(b0 + 0.5), bandShade, 1);
  }
  rect(c, X(4), yb - 2, u(L - 2), 2, '#a8683a');
  rect(c, X(4), yb - 2, u(L - 2), 1, '#d8905a');
  // the bulwark rail, the carved and gilded stern, its gallery of lit windows, the lantern
  for (let i = 0; i < n; i++) { const t = i / n; rect(c, X(t * L), Y(deck(t)) - 1, u(L / n) + 1, 1.5, '#5a4a4a'); }
  poly(c, [[X(L - 6), Y(deck(1) + 12)], [X(L + 16), Y(deck(1) + 10)], [X(L + 14), Y(10)], [X(L - 2), Y(10)]], '#3a2e36');
  for (let row = 0; row < 2; row++) for (let k = 0; k < 4; k++) { rect(c, X(L - 2 + k * 4.2), Y(deck(1) + 6 - row * 10), u(2.6), u(4), FR.lit); }
  rect(c, X(L - 4), Y(deck(1) + 12), u(20), 1.5, FR.gold.mid);
  rect(c, X(L - 4), Y(deck(1) - 8), u(20), 1, FR.gold.mid);
  circle(c, X(L + 12), Y(deck(1) + 16), u(2), FR.lit); glow(c, X(L + 12), Y(deck(1) + 16), 10, 'rgba(255,200,120,0.5)');
  // the figurehead, gilded, and the anchor hanging at the bow
  circle(c, X(-8), Y(deck(0) - 2), u(2.2), FR.gold.lit);
  line(c, X(4), Y(deck(0) - 10), X(6), Y(8), '#4a4452', 1);
  poly(c, [[X(2), Y(10)], [X(10), Y(10)], [X(6), Y(4)]], '#4a4452');
  // the ensign staff at the stern
  rect(c, X(L + 12), Y(deck(1) + 40), 1, u(28), '#5a4030');
  return { funnel: [X(fx), Y(deck(fx / L) + 44)], ensign: [X(L + 13), Y(deck(1) + 40)], main: tops[1], fore: tops[0], mizzen: tops[2], deck: Y(34) };
}
