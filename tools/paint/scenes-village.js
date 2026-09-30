/*
 * Lavilledieu, Hervé's home: a river town of the south of France on a sunny day, with a breeze.
 * Pastel houses along the quay with shutters and flower boxes, plane trees, a bakery and a café,
 * a riverside guinguette under its lanterns, the silk mill and its wheel, the church and its
 * square, houses climbing the hill to the church on top, vineyards beyond, and flowers
 * everywhere. Used by the walk (tools/paint/walks.js) and the backdrop (SCENES.lavilledieu).
 * The boats, the fish, the birds, the wheel turning and the fountain are the engine's.
 */
/* eslint-disable no-unused-vars */
const VIL = {
  walls: ['#f0b8a8', '#f4cc96', '#f2dc98', '#e8b878', '#b8c8d8', '#bcd6b4', '#f4e8d2', '#e8c4c8'],
  shutters: ['#4a78a8', '#5a8a5a', '#b04a3a', '#8a78b0', '#3e8a8a'],
  roof: '#c0603c', roofDark: '#9a4428', slate: '#5a6278', slateDark: '#40485c',
  stone: '#d8c8a8', stoneDark: '#b4a282', stoneLit: '#ece0c6',
  leaf: ['#3e6a2e', '#5a8a3a', '#86b24e', '#c4dc7a'],
  flowers: ['#e0302a', '#f06a8a', '#ffffff', '#f4d23a', '#8a6ad0', '#f08a2a', '#4a7ae0'],
  lit: '#ffd88a',
};

/** Darker or lighter: mix a #rrggbb colour toward black (k < 0) or white (k > 0). */
function vShade(col, k) {
  const n = parseInt(col.slice(1), 16), t = k < 0 ? 0 : 255, a = Math.abs(k);
  const ch = (s) => Math.round(((n >> s) & 255) * (1 - a) + t * a);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

/** A town house of the south: a pastel wall, tall shuttered windows with flower boxes, a tiled roof. */
function vHouse(c, r, x, yb, w, hh, o = {}) {
  const wall = o.wall || r.pick(VIL.walls), sh = o.shutters || r.pick(VIL.shutters);
  const roof = o.slate ? VIL.slate : VIL.roof, roofD = o.slate ? VIL.slateDark : VIL.roofDark;
  rect(c, x, yb - hh, w, hh, wall);
  rect(c, x, yb - hh, 2, hh, vShade(wall, 0.25));
  rect(c, x + w - 3, yb - hh, 3, hh, vShade(wall, -0.12));
  for (let i = 0; i < w * hh * 0.04; i++) rect(c, x + r() * (w - 3), yb - hh + r() * (hh - 2), r.i(2, 4), 1, vShade(wall, r() < 0.5 ? -0.07 : 0.1));
  rect(c, x, yb - 6, w, 6, vShade(wall, -0.18));
  // the roof: low and tiled, or steep slate with a dormer
  const rh = o.slate ? 16 : 9;
  poly(c, [[x - 3, yb - hh], [x + w + 3, yb - hh], [x + w - (o.slate ? 6 : 2), yb - hh - rh], [x + (o.slate ? 6 : 2), yb - hh - rh]], roof);
  for (let y = yb - hh - rh + 2; y < yb - hh; y += 2) line(c, x, y + 0.5, x + w, y + 0.5, roofD, 1);
  rect(c, x - 3, yb - hh, w + 6, 2, roofD);
  if (o.slate) { rect(c, x + w / 2 - 4, yb - hh - rh - 1, 8, 8, wall); poly(c, [[x + w / 2 - 6, yb - hh - rh], [x + w / 2 + 6, yb - hh - rh], [x + w / 2, yb - hh - rh - 7]], roof); rect(c, x + w / 2 - 2, yb - hh - rh + 1, 4, 5, '#3a4050'); }
  if (o.chimney !== false) { const cx = x + w * (o.chimney || 0.75); rect(c, cx, yb - hh - rh - 8, 5, 9, vShade(wall, -0.2)); rect(c, cx - 1, yb - hh - rh - 9, 7, 2, '#8a5a40'); }
  // windows in rows, each with its shutters, some with a box of geraniums, some lit
  const floors = Math.max(1, Math.floor((hh - (o.shop ? 26 : 12)) / 18));
  const cols = Math.max(1, Math.floor((w - 8) / 16));
  for (let f = 0; f < floors; f++) {
    for (let k = 0; k < cols; k++) {
      const wx = x + 8 + k * ((w - 16) / Math.max(1, cols - 1 || 1)) - (cols === 1 ? -w / 2 + 12 : 0), wy = yb - hh + 6 + f * 18;
      const lit = r() < 0.18;
      rect(c, wx - 1, wy - 1, 8, 12, vShade(wall, -0.3));
      rect(c, wx, wy, 6, 10, lit ? VIL.lit : '#3a4a62');
      if (lit) { rect(c, wx, wy + 6, 6, 4, '#f2a84a'); glow(c, wx + 3, wy + 5, 10, 'rgba(255,200,110,0.4)'); }
      else rect(c, wx, wy, 2, 10, '#5a6a86');
      rect(c, wx + 3, wy, 1, 10, vShade(wall, -0.3));
      rect(c, wx - 4, wy - 1, 3, 12, sh); rect(c, wx + 7, wy - 1, 3, 12, sh);
      for (let y = wy + 1; y < wy + 10; y += 2) { rect(c, wx - 4, y, 3, 1, vShade(sh, -0.25)); rect(c, wx + 7, y, 3, 1, vShade(sh, -0.25)); }
      if (r() < 0.6) {
        rect(c, wx - 2, wy + 10, 10, 2, '#8a5a3a');
        for (let q = 0; q < 6; q++) px(c, wx - 2 + r.i(0, 9), wy + 9 - r.i(0, 1), r.pick(['#e0302a', '#f06a8a', '#e0302a', '#ffffff']));
        for (let q = 0; q < 4; q++) px(c, wx - 1 + r.i(0, 8), wy + 11 + r.i(0, 1), '#4a7a2e');
      }
    }
  }
  // the ground floor: a shop front with its awning and sign, or a door
  if (o.shop) {
    const aw = o.awning || ['#c83a3a', '#fff4e8'];
    rect(c, x + 4, yb - 24, w - 8, 18, '#3a2e2a');
    rect(c, x + 6, yb - 22, w - 12, 14, o.shopGlass || '#f2d8a0');
    glow(c, x + w / 2, yb - 15, w * 0.6, 'rgba(255,210,130,0.45)');
    for (let k = x + 8; k < x + w - 8; k += 4) rect(c, k, yb - 12, 3, 2, o.goods || '#c89048');
    for (let k = 0; k < w + 4; k += 4) { poly(c, [[x - 2 + k, yb - 30], [x + 2 + k, yb - 30], [x + 2 + k, yb - 24], [x - 2 + k, yb - 23]], aw[(k / 4) % 2]); }
    rect(c, x - 2, yb - 31, w + 4, 2, vShade(aw[0], -0.3));
    if (o.sign) { rect(c, x + w / 2 - o.sign * 2, yb - 40, o.sign * 4, 7, '#2a2230'); for (let k = 0; k < o.sign; k++) rect(c, x + w / 2 - o.sign * 2 + 2 + k * 4, yb - 38, 2, 3, '#f0c860'); }
  } else {
    const dx = x + (o.doorAt == null ? w * 0.5 - 4 : o.doorAt);
    rect(c, dx - 1, yb - 20, 10, 20, vShade(wall, -0.3));
    rect(c, dx, yb - 19, 8, 19, o.door || sh);
    rect(c, dx + 3, yb - 19, 1, 19, vShade(o.door || sh, -0.3));
    ellipse(c, dx + 4, yb - 19, 4, 2, vShade(wall, -0.3));
  }
  // climbing roses or wisteria over some fronts
  if (o.vine) {
    const cols2 = o.vine === 'wisteria' ? ['#8a6ad0', '#a88ae0', '#c8b0f0'] : ['#e0305a', '#f06a8a', '#ffa0b8'];
    for (let i = 0; i < 70; i++) { const vx = x + r.r(0, w * 0.5), vy = yb - r.r(4, hh * 0.9); px(c, vx, vy, r() < 0.5 ? r.pick(cols2) : r.pick(VIL.leaf)); }
    line(c, x + 3, yb, x + 6, yb - hh * 0.8, '#5a4030', 1);
  }
}

/** A plane tree: a pale mottled trunk and a broad, light crown. */
function planeTree(c, r, x, yb, hh) {
  trunk(c, x, yb, hh * 0.55, 6, 4, '#c8bca0', '#a89a7c');
  for (let i = 0; i < 12; i++) rect(c, x - 2 + r.r(-1, 2), yb - r.r(4, hh * 0.5), r.r(2, 4), r.r(2, 3), r.pick(['#8a8468', '#e0d8c0', '#a8a088']));
  for (let k = 0; k < 3; k++) branch(c, x, yb - hh * 0.45, x + r.r(-18, 18), yb - hh * r.r(0.62, 0.8), 2, '#a89a7c');
  crown(c, r, x, yb - hh * 0.75, hh * 0.46, hh * 0.3, VIL.leaf, { x: -0.7, y: -0.7 }, 44);
}

/** A mulberry tree, the silkworms' food: a low round crown on a crooked trunk. */
function mulberry(c, r, x, yb, hh) {
  branch(c, x, yb, x + r.r(-4, 4), yb - hh * 0.5, 4, '#5a4432');
  crown(c, r, x, yb - hh * 0.62, hh * 0.5, hh * 0.34, ['#2e5a26', '#4a7a32', '#6a9a3e', '#a8c86a'], { x: -0.7, y: -0.7 }, 36);
  for (let i = 0; i < 10; i++) px(c, x + r.r(-hh * 0.4, hh * 0.4), yb - hh * r.r(0.4, 0.8), '#4a1a3a');
}

/** Wild flowers in the grass: poppies, cornflowers, daisies, buttercups and lavender. */
function wildflowers(c, r, x0, x1, y0, y1, n, cols = VIL.flowers) {
  for (let i = 0; i < n; i++) {
    const x = r.r(x0, x1), y = r.r(y0, y1), hh = 2 + (y - y0) / Math.max(1, y1 - y0) * 5;
    line(c, x, y, x + r.r(-1, 1), y - hh, r.pick(['#4a7a2e', '#5a8a3a']), 1);
    const col = r.pick(cols);
    px(c, x, y - hh - 1, col);
    if (r() < 0.5) { px(c, x - 1, y - hh - 1, col); px(c, x + 1, y - hh - 1, col); px(c, x, y - hh - 2, col); }
  }
}

/** A row of lavender bushes, purple in the sun. */
function lavender(c, r, x0, x1, yb) {
  for (let x = x0; x < x1; x += r.r(6, 9)) {
    ellipse(c, x, yb - 3, 4, 3, '#4a6a4a');
    for (let k = 0; k < 7; k++) { const sx = x + r.r(-4, 4); line(c, sx, yb - 3, sx + r.r(-1, 1), yb - r.r(6, 10), '#5a7a50', 1); px(c, sx, yb - r.r(7, 11), r.pick(['#8a6ad0', '#a88ae0', '#7050b8'])); }
  }
}

/** A rose bush, red and pink. */
function roseBush(c, r, x, yb, w) {
  crown(c, r, x, yb - w * 0.35, w * 0.5, w * 0.35, ['#2e5a26', '#3e6a2e', '#5a8a3a'], { x: -0.6, y: -0.8 }, 16);
  for (let i = 0; i < w * 1.2; i++) px(c, x + r.r(-w * 0.45, w * 0.45), yb - r.r(2, w * 0.65), r.pick(['#e0305a', '#f06a8a', '#ffc0cc', '#c8203a']));
}

/** A church: a pale stone front with a rose window and door, and its bell tower with a slate spire. */
function vChurch(c, r, x, yb, s = 1) {
  const u = (v) => v * s;
  const st = VIL.stone, dk = VIL.stoneDark, lt = VIL.stoneLit;
  // the bell tower at the side, its spire and cross
  const tx = x + u(62);
  rect(c, tx, yb - u(120), u(26), u(120), st);
  rect(c, tx, yb - u(120), u(3), u(120), lt);
  rect(c, tx + u(23), yb - u(120), u(3), u(120), dk);
  for (const y of [34, 70]) { rect(c, tx + u(8), yb - u(120) + u(y - 20), u(10), u(16), '#2e3448'); ellipse(c, tx + u(13), yb - u(120) + u(y - 20), u(5), u(4), '#2e3448'); }
  rect(c, tx - u(2), yb - u(122), u(30), u(4), dk);
  poly(c, [[tx - u(2), yb - u(122)], [tx + u(28), yb - u(122)], [tx + u(13), yb - u(160)]], VIL.slate);
  poly(c, [[tx - u(2), yb - u(122)], [tx + u(13), yb - u(160)], [tx + u(8), yb - u(122)]], '#78809a');
  rect(c, tx + u(12.5), yb - u(170), u(1.2), u(11), '#3a3a44'); rect(c, tx + u(10), yb - u(166), u(6), u(1.2), '#3a3a44');
  // the nave's front, gabled, with its rose window and round-arched door
  poly(c, [[x, yb], [x, yb - u(62)], [x + u(32), yb - u(84)], [x + u(64), yb - u(62)], [x + u(64), yb]], st);
  poly(c, [[x, yb], [x, yb - u(62)], [x + u(32), yb - u(84)], [x + u(8), yb - u(62)], [x + u(8), yb]], lt);
  rect(c, x + u(62), yb - u(62), u(2), u(62), dk);
  circle(c, x + u(32), yb - u(56), u(9), dk);
  circle(c, x + u(32), yb - u(56), u(7), '#5a4a8a');
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; line(c, x + u(32), yb - u(56), x + u(32) + Math.cos(a) * u(7), yb - u(56) + Math.sin(a) * u(7), dk, 1); }
  circle(c, x + u(32), yb - u(56), u(2), '#e8c060');
  ellipse(c, x + u(32), yb - u(26), u(10), u(9), dk);
  rect(c, x + u(22), yb - u(26), u(20), u(26), dk);
  ellipse(c, x + u(32), yb - u(26), u(8), u(7), '#5a3a2a');
  rect(c, x + u(24), yb - u(26), u(16), u(26), '#5a3a2a');
  rect(c, x + u(32), yb - u(32), u(1), u(32), '#3a2418');
  for (const k of [6, 50]) { ellipse(c, x + u(k + 4), yb - u(40), u(3), u(3), '#3a4a62'); rect(c, x + u(k + 1), yb - u(40), u(6), u(14), '#3a4a62'); }
  return [tx + u(13), yb - u(170)];
}

/** The silk mill: a long stone building of three storeys, rows of tall windows, a chimney. */
function vMill(c, r, x, yb, w, hh) {
  rect(c, x, yb - hh, w, hh, '#e6d6b4');
  rect(c, x, yb - hh, 3, hh, '#f2e6cc');
  for (let i = 0; i < w * hh * 0.05; i++) rect(c, x + r() * (w - 3), yb - hh + r() * (hh - 2), r.i(2, 5), 1, r() < 0.5 ? '#cfbe98' : '#f2e6cc');
  for (let f = 0; f < 3; f++) for (let k = x + 8; k < x + w - 8; k += 14) {
    const y = yb - hh + 8 + f * 20, lit = r() < 0.35;
    ellipse(c, k + 4, y, 4, 3, '#8a7a5a');
    rect(c, k, y, 8, 12, '#8a7a5a');
    ellipse(c, k + 4, y, 3, 2, lit ? VIL.lit : '#3a4a62');
    rect(c, k + 1, y, 6, 11, lit ? VIL.lit : '#3a4a62');
    if (lit) glow(c, k + 4, y + 5, 12, 'rgba(255,200,110,0.4)');
    rect(c, k + 4, y, 1, 11, '#8a7a5a');
  }
  poly(c, [[x - 4, yb - hh], [x + w + 4, yb - hh], [x + w - 10, yb - hh - 20], [x + 10, yb - hh - 20]], VIL.slate);
  for (let y = yb - hh - 18; y < yb - hh; y += 3) line(c, x + 4, y, x + w - 4, y, VIL.slateDark, 1);
  rect(c, x + w * 0.2, yb - hh - 44, 9, 26, '#b86a4a');
  rect(c, x + w * 0.2 - 1, yb - hh - 46, 11, 3, '#8a4a30');
  // the sign over the door: FILATURE, in gold on dark blue
  rect(c, x + w / 2 - 26, yb - hh + 2, 52, 8, '#24305a');
  for (let k = 0; k < 9; k++) rect(c, x + w / 2 - 22 + k * 5, yb - hh + 4, 3, 4, '#f0c860');
  rect(c, x + w / 2 - 8, yb - 22, 16, 22, '#5a3a2a');
  ellipse(c, x + w / 2, yb - 22, 8, 4, '#5a3a2a');
}

/** A covered wash-house at the water: a tiled roof on posts over a stone basin. */
function vLavoir(c, r, x, yb, w) {
  for (const px_ of [x + 2, x + w - 5]) rect(c, px_, yb - 26, 3, 26, '#8a6a4a');
  poly(c, [[x - 6, yb - 24], [x + w + 6, yb - 24], [x + w - 4, yb - 36], [x + 4, yb - 36]], VIL.roof);
  for (let y = yb - 34; y < yb - 24; y += 2) line(c, x, y, x + w, y, VIL.roofDark, 1);
  rect(c, x - 2, yb - 5, w + 4, 5, VIL.stone);
  rect(c, x - 2, yb - 5, w + 4, 1, VIL.stoneLit);
  for (let k = x + 6; k < x + w - 6; k += 10) rect(c, k, yb - 9, 6, 4, r.pick(['#f4f0e8', '#e8e0f0', '#f0e0d0']));
}

/** A riverside guinguette: a wooden terrace, tables under strings of paper lanterns. */
function vGuinguette(c, r, x, yb, w) {
  rect(c, x, yb - 3, w, 3, '#8a6a4a');
  for (const k of [0, w * 0.5, w]) { rect(c, x + k - 1, yb - 48, 3, 45, '#6a4a30'); }
  // the lanterns, strung in swags between the posts
  for (const [a, b] of [[x, x + w * 0.5], [x + w * 0.5, x + w]]) {
    for (let t = 0; t <= 1; t += 0.02) px(c, a + (b - a) * t, yb - 46 + Math.sin(t * Math.PI) * 9, '#3a2a2a');
    for (let t = 0.12; t < 1; t += 0.19) {
      const lx = a + (b - a) * t, ly = yb - 44 + Math.sin(t * Math.PI) * 9, col = r.pick(['#ff6a4a', '#ffd04a', '#f08ab8', '#6ad0ff', '#9aff6a']);
      ellipse(c, lx, ly + 2, 2, 2.6, col);
      glow(c, lx, ly + 2, 7, 'rgba(255,220,150,0.5)');
    }
  }
  // tables with checked cloths, and chairs
  for (let k = x + 10; k < x + w - 10; k += 26) {
    rect(c, k, yb - 12, 14, 2, '#f4ece0');
    for (let q = 0; q < 14; q += 2) rect(c, k + q, yb - 12, 1, 2, '#c83a3a');
    rect(c, k + 6, yb - 10, 2, 7, '#5a4030');
    rect(c, k - 4, yb - 9, 3, 6, '#6a4a30'); rect(c, k + 15, yb - 9, 3, 6, '#6a4a30');
    rect(c, k + 3, yb - 15, 2, 3, r.pick(['#8a2a4a', '#f0e0a0', '#a8d0e0']));
  }
}

/** A stone fountain in the square: a round basin and a column with its spouts. */
function vFountain(c, x, yb) {
  ellipse(c, x, yb - 3, 20, 4, VIL.stoneDark);
  rect(c, x - 20, yb - 9, 40, 6, VIL.stone);
  rect(c, x - 20, yb - 9, 40, 1, VIL.stoneLit);
  ellipse(c, x, yb - 9, 19, 2.5, '#6aa8d8');
  rect(c, x - 3, yb - 28, 6, 19, VIL.stone);
  rect(c, x - 3, yb - 28, 1, 19, VIL.stoneLit);
  ellipse(c, x, yb - 28, 7, 2, VIL.stoneDark);
  rect(c, x - 1, yb - 34, 2, 6, VIL.stone);
}

/** A low wall of dry stone along a field. */
function stoneWall(c, r, x0, x1, yb, hh) {
  for (let y = yb - hh; y < yb; y += 3) for (let x = x0 + (((y - yb) / 3) % 2 ? 0 : 3); x < x1; x += r.r(5, 8)) {
    rect(c, x, y, r.r(4, 7), 3, r.pick([VIL.stone, VIL.stoneDark, VIL.stoneLit, '#c8b890']));
  }
}

/** A cargo boat of the rivers (a gabare), painted still for a backdrop: hull, barrels, square sail. */
function vGabare(c, x, y, s, sail = true) {
  const u = (v) => v * s;
  poly(c, [[x - u(22), y - u(4)], [x + u(24), y - u(5)], [x + u(20), y + u(2)], [x - u(18), y + u(2)]], '#6a4a30');
  rect(c, x - u(20), y - u(5), u(42), u(1.5), '#9a7048');
  for (let k = -12; k < 10; k += 5) { ellipse(c, x + u(k), y - u(7), u(2.2), u(2.8), '#8a5a34'); rect(c, x + u(k) - u(2), y - u(8), u(4), u(0.8), '#5a3a24'); }
  if (sail) {
    rect(c, x + u(2), y - u(36), u(1.2), u(31), '#4a3424');
    poly(c, [[x - u(10), y - u(33)], [x + u(14), y - u(33)], [x + u(12), y - u(11)], [x - u(8), y - u(11)]], '#f4ead6');
    rect(c, x - u(10), y - u(26), u(24), u(3), '#c84a3a');
    line(c, x + u(12), y - u(33), x + u(14), y - u(11), '#c8b89a', 1);
  }
  rect(c, x - u(20), y - u(12), u(1), u(8), '#4a3424');
  rect(c, x - u(21), y - u(15), u(2), u(3), '#2e4a8a');
}

// ---------------------------------------------------------------- the backdrop: the town from across the river
SCENES.lavilledieu = (c, L) => {
  const r = rng(1201);
  vgrad(c, 0, 0, W, H, [[0, '#3474c4'], [0.22, '#6aa4dc'], [0.44, '#b4d6f0'], [0.56, '#e8f4f8'], [1, '#e8f4f8']]);
  sun(c, 70, 34, 12, '#fffef0', 'rgba(255,248,210,0.7)');
  const hi = L('clouds_high', { depth: 0.02, anim: { type: 'drift', t: 700 } });
  wrapped(hi, 81, (cc, rr) => { for (let i = 0; i < 60; i++) { const x = rr.r(0, W), y = rr.r(8, 60); ellipse(cc, x, y, rr.r(3, 7), rr.r(1.5, 2.6), rr.pick(['#ffffff', '#eef4fc', '#dce8f6'])); } });
  const cl = L('clouds', { depth: 0.04, anim: { type: 'drift', t: 420 } });
  wrapped(cl, 82, (cc, rr) => {
    cumulus(cc, rr, 150, 36, 110, 34, { dark: '#b8c8e0', mid: '#e8f0fa', lit: '#ffffff', lx: -1 });
    cumulus(cc, rr, 360, 62, 80, 24, { dark: '#b8c8e0', mid: '#e8f0fa', lit: '#ffffff', lx: -1 });
  });
  // far hills with their vineyards, and an old bridge of many arches across the valley
  const far = L('far', { depth: 0.06 });
  hill(far, r, -60, 300, 150, 40, '#86aabc', { sharp: 1.1 });
  hill(far, r, 180, 560, 148, 34, '#7aa0b0');
  for (let y = 124; y < 150; y += 3) line(far, 190, y, 330, y + 6, 'rgba(90,130,110,0.5)', 1);
  // the hill with its houses climbing to the church on top, a limestone cliff at its flank
  const hl = L('hill', { depth: 0.12 });
  hill(hl, r, 120, 620, 170, 118, '#5e9046', { sharp: 0.7 });
  hill(hl, r, 100, 330, 172, 52, '#6e9e50');
  poly(hl, [[196, 170], [206, 128], [236, 112], [270, 116], [286, 136], [276, 170]], '#dccfb2');
  poly(hl, [[196, 170], [206, 128], [236, 112], [230, 140], [218, 170]], '#ece2ca');
  for (let k = 0; k < 12; k++) line(hl, r.r(206, 280), r.r(118, 130), r.r(206, 280), r.r(146, 168), '#b8a888', 1);
  const ridgeAt = (x) => 170 - 118 * 0.82 * Math.pow(Math.max(0, Math.sin(Math.PI * (x - 120) / 500)), 0.7);
  for (let i = 0; i < 46; i++) { const x = r.r(140, 480); crown(hl, r, x, r.r(ridgeAt(x) + 8, 166), r.r(5, 10), r.r(4, 7), VIL.leaf, { x: -0.7, y: -0.7 }, 10); }
  // houses in tiers up the slope
  const slope = (x) => 150 - Math.max(0, Math.min(1, (x - 290) / 120)) * 76;
  for (let i = 0; i < 60; i++) {
    const x = r.r(284, 470), y = slope(x) + r.r(-6, 22);
    const w = r.r(10, 16), hh = r.r(8, 12), wall = r.pick(['#f2e8d4', '#ecdcc0', '#f4e0d0', '#e8d4b4']);
    rect(hl, x, y - hh, w, hh, wall);
    rect(hl, x + w - 2, y - hh, 2, hh, vShade(wall, -0.12));
    poly(hl, [[x - 1, y - hh], [x + w + 1, y - hh], [x + w - 2, y - hh - 4], [x + 2, y - hh - 4]], r() < 0.5 ? VIL.slate : VIL.roof);
    px(hl, x + 3, y - hh + 3, r() < 0.2 ? VIL.lit : '#3a4a62'); px(hl, x + w - 5, y - hh + 3, '#3a4a62');
  }
  vChurch(hl, r, 396, 76, 0.5);
  // the quay: pastel houses shoulder to shoulder along the water, plane trees before them
  const town = L('town', { depth: 0.2 });
  rect(town, 0, 166, W, 26, VIL.stone);
  let x = 150;
  while (x < W + 10) { const w = r.r(26, 40), hh = r.r(40, 58); vHouse(town, r, x, 184, w, hh, { slate: r() < 0.3, vine: r() < 0.25 ? (r() < 0.5 ? 'rose' : 'wisteria') : null, chimney: r() < 0.6 ? r.r(0.6, 0.8) : false }); x += w + r.r(0, 3); }
  for (const tx of [176, 262, 350, 440]) planeTree(town, r, tx, 186, 50);
  // the quay wall down to the water, weeds and flowers in its cracks
  rect(town, 0, 184, W, 12, '#b8a888');
  for (let k = 0; k < W; k += r.r(8, 16)) rect(town, k, 184 + r.i(0, 10), r.r(4, 8), 1, '#9a8a6a');
  for (let i = 0; i < 40; i++) px(town, r() * W, r.r(185, 195), r.pick(['#4a7a2e', '#e0302a', '#f4d23a']));
  // the silk mill on the left with its wheel, and the green bank before it
  vMill(town, r, 10, 184, 120, 56);
  const wheel = L('wheel', { depth: 0.2, anim: { type: 'spin', t: 7, ox: 0.5, oy: 0.5 } });
  circle(wheel, 136, 188, 14, '#6a4a30'); circle(wheel, 136, 188, 11, 'rgba(0,0,0,0)');
  wheel.save(); wheel.globalCompositeOperation = 'destination-out'; circle(wheel, 136, 188, 11, '#000'); wheel.restore();
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; line(wheel, 136, 188, 136 + Math.cos(a) * 14, 188 + Math.sin(a) * 14, '#8a6a44', 1); rect(wheel, 136 + Math.cos(a) * 14 - 1.5, 188 + Math.sin(a) * 14 - 1.5, 3, 3, '#5a3a24'); }
  circle(wheel, 136, 188, 2.5, '#3a2a1e');
  // the river: blue, bright with the sky, the town's reflection trembling in it
  const river = L('river', { depth: 0.3 });
  vgrad(river, 0, 196, W, 50, [[0, '#7ab0dc'], [0.4, '#5a94c8'], [1, '#3a6ea8']]);
  for (let i = 0; i < 260; i++) { const y = r.r(197, 244); river.globalAlpha = r.r(0.3, 0.8); rect(river, r() * W, y, r.r(3, 12), 1, r.pick(['#f2e0c8', '#e8b8a8', '#b8d8f0', '#ffffff', '#6aa0d0'])); }
  river.globalAlpha = 1;
  for (let y = 198; y < 244; y += 1) { const hw = 3 + (y - 198) * 0.8; for (let k = 0; k < 2; k++) rect(river, 70 + r.r(-hw, hw), y, r.r(2, 6), 1, r.pick(['#ffffff', '#fff6d8'])); }
  // boats on the water, rocking
  for (const [bx, by, s, sail, t] of [[250, 214, 1, true, 4.4], [400, 226, 0.8, false, 5.2]]) {
    const b = L(`boat${bx}`, { depth: 0.32, anim: { type: 'bob', a: 0.8, t } });
    vGabare(b, bx, by, s, sail);
  }
  // our bank in front: grass full of wild flowers, bending in the breeze
  const bank = L('bank', { depth: 0.6, anim: sway(1.2, 4.6, { oy: 1 }) });
  poly(bank, [[0, 236], [120, 240], [260, 246], [W, 244], [W, H], [0, H]], '#6a9a3e');
  vgrad(bank, 0, 240, W, 30, [[0, 'rgba(120,170,70,0)'], [1, 'rgba(40,70,30,0.6)']]);
  wildflowers(bank, r, 0, W, 242, H, 700);
  for (let i = 0; i < 80; i++) { const fx = r() * W, fy = r.r(250, H), hh = r.r(8, 20); line(bank, fx, fy, fx + r.r(-2, 3), fy - hh, '#4a7a2e', 1); ellipse(bank, fx, fy - hh, 2, 1.6, r.pick(['#e0302a', '#e0302a', '#ffffff', '#8a6ad0', '#f4d23a'])); }
  return { colors: 110, vignette: [0.18, '20,40,60'] };
};
