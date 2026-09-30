/*
 * Lavilledieu, Hervé's home: an old stone town of the south of France on a bright autumn day.
 * Grey stone houses along the quay, moss in their joints and red creeper up their fronts, plane
 * trees and mulberries turned gold and orange, the silk mill and its wheel, the church and its
 * square; above the town a hill of stone houses in terraces, up to the twin-spired cathedral on
 * its platform; beyond, windmills on the ridges, a château and an abbey in the sun on the
 * foothills, and behind it all the snowy mountains. Used by the walk (tools/paint/walks.js) and
 * the backdrop (SCENES.lavilledieu). The boats, the fish, the birds, the wheel, the fountain,
 * the children and dogs, and (in the walk) the windmills' sails are the engine's.
 */
/* eslint-disable no-unused-vars */
const VIL = {
  walls: ['#b8b4ac', '#aaa69e', '#c4bfb4', '#a09c94', '#bcb6a8', '#b0aa9c', '#c8c0b0'],
  shutters: ['#4a6a8a', '#5a7a5a', '#8a3a2a', '#6a5a7a', '#3e6a6a', '#8a6a3a'],
  roof: '#a8583a', roofDark: '#7a3e28', slate: '#505668', slateDark: '#3a3e4e',
  stone: '#bab4a6', stoneDark: '#8e887a', stoneLit: '#dcd6c6',
  // the trees in autumn: orange, gold and red
  leaf: ['#7a3212', '#b8521c', '#e0842a', '#f4c056'],
  gold: ['#7a5214', '#b8841e', '#e0b03a', '#f8dc78'],
  red: ['#5e1a12', '#9a2a1a', '#c84a24', '#f07a3a'],
  moss: ['#46602a', '#62803a', '#86a24a'],
  creeper: ['#6a1a14', '#a02a1a', '#d04a24', '#e8763a'],
  flowers: ['#e0302a', '#f08a2a', '#f4d23a', '#ffffff', '#9a5ad0', '#c8305a', '#f4a03a'],
  stems: ['#6a6a2a', '#7a7030', '#8a6a2a'],
  lit: '#ffd88a',
};
/** One of the autumn palettes, mostly orange. */
const vAutumn = (r) => { const k = r(); return k < 0.45 ? VIL.leaf : k < 0.8 ? VIL.gold : VIL.red; };

function vRGB(col) {
  if (col[0] === '#') { const n = parseInt(col.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  return col.match(/\d+/g).slice(0, 3).map(Number);
}
/** Darker or lighter: mix a colour toward black (k < 0) or white (k > 0). */
function vShade(col, k) {
  const t = k < 0 ? 0 : 255, a = Math.abs(k), [R, G, B] = vRGB(col);
  const ch = (v) => Math.round(v * (1 - a) + t * a);
  return `rgb(${ch(R)},${ch(G)},${ch(B)})`;
}
/** Mix two colours (for the haze of distance). */
function vMix(a, b, t) {
  const A = vRGB(a), B = vRGB(b);
  return `rgb(${A.map((v, i) => Math.round(v * (1 - t) + B[i] * t)).join(',')})`;
}

/** A smooth ground line through control points [[x, y], ...]: returns y at any x. */
function vProfile(pts) {
  return (x) => {
    if (x <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      if (x <= x1) { const t = (x - x0) / (x1 - x0), k = (1 - Math.cos(Math.PI * t)) / 2; return y0 + (y1 - y0) * k; }
    }
    return pts[pts.length - 1][1];
  };
}
/** Fill the land under a profile, from x0 to x1, down to yb. */
function vLand(c, fn, x0, x1, yb, col) {
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(x0, yb);
  for (let x = x0; x <= x1; x++) c.lineTo(x, fn(x));
  c.lineTo(x1, yb);
  c.closePath();
  c.fill();
}

// ---------------------------------------------------------------- stone, moss and creeper
/** Stone laid in courses: blocks of slightly different greys, mortar between, the odd lit edge. */
function stoneFace(c, r, x, y, w, h, base, o = {}) {
  const course = o.course || 4, lit = vShade(base, 0.16);
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  rect(c, x, y, w, h, vShade(base, -0.2));
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  for (let yy = y, row = 0; yy < y + h; yy += course, row++) {
    let xx = x - (row % 2 ? r.i(1, 4) : 0);
    while (xx < x + w) {
      const bw = r.i(o.min || 4, o.max || 9);
      rect(c, xx, yy, bw - 1, course - 1, vShade(base, r.r(-0.07, 0.07)));
      if (r() < 0.3) rect(c, xx, yy, bw - 1, 1, lit);
      xx += bw;
    }
  }
  c.restore();
}

/** Moss in the joints and along the foot of a wall: thickest low down. */
function moss(c, r, x, y, w, h, n) {
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  for (let i = 0; i < n; i++) {
    const mx = x + r() * w, my = y + h * (1 - Math.pow(r(), 2.4)), s = r.r(0.8, 2.4);
    ellipse(c, mx, my, s + 0.6, s * 0.6 + 0.5, VIL.moss[0]);
    px(c, mx - 1, my - 1, VIL.moss[2]);
    if (r() < 0.6) px(c, mx + 1, my, VIL.moss[1]);
  }
  c.restore();
}

/** Autumn creeper climbing a wall from its foot, turned red and orange. */
function creeper(c, r, x, yb, w, hh) {
  c.save(); c.beginPath(); c.rect(x, yb - hh, w, hh); c.clip();
  for (let k = 0; k < 3; k++) branch(c, x + r.r(1, w * 0.5), yb, x + r.r(0, w * 0.8), yb - hh * r.r(0.5, 0.9), 1, '#4a2a1a');
  for (let i = 0; i < w * hh * 0.35; i++) {
    const t = Math.pow(r(), 0.8), vx = x + r() * w * (1 - t * 0.35), vy = yb - t * hh;
    const col = t > 0.7 ? r.pick(VIL.creeper.slice(2)) : r.pick(VIL.creeper);
    px(c, vx, vy, col);
    if (r() < 0.45) px(c, vx + 1, vy, col);
  }
  c.restore();
}

/** Fallen leaves on the ground. */
function leafLitter(c, r, x0, x1, y0, y1, n) {
  for (let i = 0; i < n; i++) {
    const x = r.r(x0, x1), y = r.r(y0, y1), col = r.pick(vAutumn(r).slice(1));
    px(c, x, y, col);
    if (r() < 0.5) px(c, x + 1, y, col);
  }
}

// ---------------------------------------------------------------- houses
/** A town house of old grey stone: courses and quoins, shuttered windows with stone lintels and
 *  flower boxes, a tiled or slate roof with moss on it, moss at its foot, creeper on some. */
function vHouse(c, r, x, yb, w, hh, o = {}) {
  const wall = o.wall || r.pick(VIL.walls), sh = o.shutters || r.pick(VIL.shutters);
  const roof = o.slate ? VIL.slate : VIL.roof, roofD = o.slate ? VIL.slateDark : VIL.roofDark;
  const top = yb - hh;
  stoneFace(c, r, x, top, w, hh, wall);
  rect(c, x, top, 2, hh, vShade(wall, 0.24));
  rect(c, x + w - 3, top, 3, hh, vShade(wall, -0.16));
  // quoins: big dressed stones at the corners, long and short in turn
  for (let y = top, k = 0; y < yb - 6; y += 5, k++) {
    rect(c, x, y, k % 2 ? 4 : 7, 4, vShade(wall, 0.18));
    rect(c, x + w - (k % 2 ? 7 : 4), y, k % 2 ? 7 : 4, 4, vShade(wall, -0.04));
  }
  rect(c, x, yb - 6, w, 6, vShade(wall, -0.22));
  // the roof: low and tiled, or steep slate with a dormer; moss on its lower tiles
  const rh = o.slate ? 16 : 9;
  poly(c, [[x - 3, top], [x + w + 3, top], [x + w - (o.slate ? 6 : 2), top - rh], [x + (o.slate ? 6 : 2), top - rh]], roof);
  for (let y = top - rh + 2; y < top; y += 2) line(c, x, y + 0.5, x + w, y + 0.5, roofD, 1);
  rect(c, x - 3, top, w + 6, 2, roofD);
  rect(c, x + (o.slate ? 6 : 2), top - rh, w - (o.slate ? 12 : 4), 1, vShade(roof, 0.25));
  if (o.moss !== 0) for (let i = 0; i < w * 0.5; i++) { const mx = x + r.r(0, w), my = top - r.r(1, rh * 0.5); px(c, mx, my, r.pick(VIL.moss)); if (r() < 0.4) px(c, mx + 1, my, VIL.moss[0]); }
  if (o.slate) { rect(c, x + w / 2 - 4, top - rh - 1, 8, 8, wall); poly(c, [[x + w / 2 - 6, top - rh], [x + w / 2 + 6, top - rh], [x + w / 2, top - rh - 7]], roof); rect(c, x + w / 2 - 2, top - rh + 1, 4, 5, '#3a4050'); }
  if (o.chimney !== false) { const cx = x + w * (o.chimney || 0.75); rect(c, cx, top - rh - 8, 5, 9, vShade(wall, -0.2)); rect(c, cx, top - rh - 8, 1, 9, vShade(wall, 0.1)); rect(c, cx - 1, top - rh - 9, 7, 2, '#6a5a50'); }
  // windows in rows, each in its stone surround, with shutters, some with a box of flowers, some lit
  const floors = Math.max(1, Math.floor((hh - (o.shop ? 26 : 12)) / 18));
  const cols = Math.max(1, Math.floor((w - 8) / 16));
  for (let f = 0; f < floors; f++) {
    for (let k = 0; k < cols; k++) {
      const wx = x + 8 + k * ((w - 16) / Math.max(1, cols - 1 || 1)) - (cols === 1 ? -w / 2 + 12 : 0), wy = top + 6 + f * 18;
      const lit = r() < 0.16;
      rect(c, wx - 2, wy - 3, 10, 2, vShade(wall, 0.2));
      rect(c, wx - 1, wy - 1, 8, 12, vShade(wall, -0.34));
      rect(c, wx, wy, 6, 10, lit ? VIL.lit : '#3a4a62');
      if (lit) { rect(c, wx, wy + 6, 6, 4, '#f2a84a'); glow(c, wx + 3, wy + 5, 10, 'rgba(255,200,110,0.4)'); }
      else { rect(c, wx, wy, 2, 10, '#5a6a86'); px(c, wx + 4, wy + 1, '#c8d8ec'); }
      rect(c, wx + 3, wy, 1, 10, vShade(wall, -0.34));
      rect(c, wx - 2, wy + 11, 10, 1, vShade(wall, 0.2));
      rect(c, wx - 4, wy - 1, 3, 12, sh); rect(c, wx + 7, wy - 1, 3, 12, sh);
      for (let y = wy + 1; y < wy + 10; y += 2) { rect(c, wx - 4, y, 3, 1, vShade(sh, -0.25)); rect(c, wx + 7, y, 3, 1, vShade(sh, -0.25)); }
      if (r() < 0.55) {
        rect(c, wx - 2, wy + 10, 10, 2, '#6a4a3a');
        for (let q = 0; q < 6; q++) px(c, wx - 2 + r.i(0, 9), wy + 9 - r.i(0, 1), r.pick(['#e0302a', '#f08a2a', '#e0302a', '#f4d23a', '#ffffff']));
        for (let q = 0; q < 4; q++) px(c, wx - 1 + r.i(0, 8), wy + 11 + r.i(0, 1), '#4a6a2e');
      }
    }
  }
  // the ground floor: a shop front with its awning and sign, or an arched door in dressed stone
  if (o.shop) {
    const aw = o.awning || ['#b83a3a', '#f4ece0'];
    rect(c, x + 3, yb - 25, w - 6, 20, vShade(wall, 0.14));
    rect(c, x + 4, yb - 24, w - 8, 18, '#3a2e2a');
    rect(c, x + 6, yb - 22, w - 12, 14, o.shopGlass || '#f2d8a0');
    glow(c, x + w / 2, yb - 15, w * 0.6, 'rgba(255,210,130,0.45)');
    for (let k = x + 8; k < x + w - 8; k += 4) rect(c, k, yb - 12, 3, 2, o.goods || '#c89048');
    for (let k = 0; k < w + 4; k += 4) poly(c, [[x - 2 + k, yb - 30], [x + 2 + k, yb - 30], [x + 2 + k, yb - 24], [x - 2 + k, yb - 23]], aw[(k / 4) % 2]);
    rect(c, x - 2, yb - 31, w + 4, 2, vShade(aw[0], -0.3));
    if (o.sign) { rect(c, x + w / 2 - o.sign * 2, yb - 40, o.sign * 4, 7, '#2a2230'); for (let k = 0; k < o.sign; k++) rect(c, x + w / 2 - o.sign * 2 + 2 + k * 4, yb - 38, 2, 3, '#f0c860'); }
  } else {
    const dx = Math.round(x + (o.doorAt == null ? w * 0.5 - 4 : o.doorAt));
    ellipse(c, dx + 4, yb - 20, 6, 4, vShade(wall, 0.18));
    rect(c, dx - 2, yb - 20, 12, 20, vShade(wall, 0.18));
    rect(c, dx - 1, yb - 20, 10, 20, vShade(wall, -0.34));
    rect(c, dx, yb - 19, 8, 19, o.door || vShade(sh, -0.1));
    ellipse(c, dx + 4, yb - 19, 4, 2.5, o.door || vShade(sh, -0.1));
    rect(c, dx + 3, yb - 19, 1, 19, vShade(o.door || sh, -0.3));
    px(c, dx + 6, yb - 10, '#e8c060');
  }
  // moss creeping up from the foot and under the eaves; creeper, roses or wisteria on some fronts
  if (o.moss !== 0) { moss(c, r, x, yb - 14, w, 14, Math.round(w * (o.moss || 0.3))); moss(c, r, x, top, w, 4, Math.round(w * 0.08)); }
  if (o.ivy) creeper(c, r, o.ivy === 'right' ? x + w * 0.45 : x, yb, w * 0.55, hh * 0.95);
  if (o.vine) {
    const cols2 = o.vine === 'wisteria' ? ['#8a6ad0', '#a88ae0', '#c8b0f0'] : ['#e0305a', '#f06a8a', '#ffa0b8', '#c8203a'];
    for (let i = 0; i < 80; i++) { const vx = x + r.r(0, w * 0.5), vy = yb - r.r(4, hh * 0.9); px(c, vx, vy, r() < 0.5 ? r.pick(cols2) : r.pick(['#3e5a2a', '#5a7a3a', '#8a7a2e'])); }
    line(c, x + 3, yb, x + 6, yb - hh * 0.8, '#5a4030', 1);
  }
}

/** A small house seen from afar, on a hillside: stone, a roof, a window or two, moss. */
function smallHouse(c, r, x, yb, w, hh, o = {}) {
  x = Math.round(x); yb = Math.round(yb); w = Math.round(w); hh = Math.round(hh);
  const wall = o.wall || r.pick(VIL.walls), roof = o.roof || (r() < 0.35 ? VIL.slate : VIL.roof);
  rect(c, x, yb - hh, w, hh, wall);
  for (let y = yb - hh + 3; y < yb; y += 3) for (let xx = x + 1 + (y % 2); xx < x + w - 2; xx += r.i(3, 5)) px(c, xx, y, vShade(wall, -0.14));
  rect(c, x, yb - hh, 1, hh, vShade(wall, 0.24));
  rect(c, x + w - 2, yb - hh, 2, hh, vShade(wall, -0.2));
  if (o.gable || (o.gable == null && r() < 0.4)) {
    poly(c, [[x - 1, yb - hh], [x + w + 1, yb - hh], [x + w / 2, yb - hh - w * 0.45]], roof);
    poly(c, [[x - 1, yb - hh], [x + w / 2, yb - hh - w * 0.45], [x + w / 2, yb - hh]], vShade(roof, 0.14));
  } else {
    poly(c, [[x - 1, yb - hh], [x + w + 1, yb - hh], [x + w - 2, yb - hh - 4], [x + 2, yb - hh - 4]], roof);
    rect(c, x + 2, yb - hh - 4, w - 4, 1, vShade(roof, 0.22));
  }
  if (r() < 0.5) rect(c, x + w * 0.7, yb - hh - 6, 2, 4, vShade(wall, -0.2));
  for (let k = x + 2; k < x + w - 3; k += 4) if (r() < 0.8) { const lit = r() < 0.15; rect(c, k, yb - hh + 3, 2, 2, lit ? VIL.lit : '#3a4658'); }
  if (hh > 10 && r() < 0.6) rect(c, x + w / 2 - 1, yb - 4, 2, 4, '#4a3a30');
  if (r() < 0.6) for (let i = 0; i < w * 0.4; i++) px(c, x + r() * w, yb - Math.pow(r(), 2) * hh * 0.5 - 1, r.pick(VIL.moss));
  if (r() < 0.2) for (let i = 0; i < w * hh * 0.3; i++) px(c, x + r() * w * 0.6, yb - Math.pow(r(), 0.8) * hh, r.pick(VIL.creeper));
}

/** A hillside town: houses stepping up (or down) the slope, set into it, never floating. */
function hillTown(c, r, fn, x0, x1, n, o = {}) {
  const hs = [];
  for (let i = 0; i < n; i++) {
    const w = r.i(o.wMin || 9, o.wMax || 16), x = r.r(x0, x1 - w), hh = r.i(o.hMin || 8, o.hMax || 13);
    const yb = Math.max(fn(x), fn(x + w)) + r.r(1, o.sink || 10);
    hs.push({ x, w, hh, yb });
  }
  hs.sort((a, b) => a.yb - b.yb);
  for (const h of hs) {
    smallHouse(c, r, h.x, h.yb, h.w, h.hh, o);
    // a scrap of garden or an autumn tree beside some of them
    if (r() < 0.25) { const tx = h.x + h.w + r.r(1, 4); crown(c, r, tx, h.yb - 4, r.r(3, 6), r.r(3, 5), vAutumn(r), { x: -0.7, y: -0.7 }, 8); }
  }
}

/** A terrace wall of stone under a platform: from ytop down to the ground, with buttresses. */
function terrace(c, r, x0, x1, ytop, fn, o = {}) {
  const base = o.col || VIL.stone;
  for (let x = Math.round(x0); x < x1; x++) {
    const yb = Math.max(ytop + 3, fn(x) + 3);
    rect(c, x, ytop, 1, yb - ytop, vShade(base, ((x * 7) % 5) * 0.012 - 0.05));
  }
  for (let y = ytop + 3; y < ytop + 60; y += 3) for (let x = x0 + ((y / 3) % 2) * 2; x < x1; x += r.i(4, 7)) if (y < fn(x) + 2) px(c, x, y, vShade(base, -0.22));
  for (let x = x0 + 6; x < x1 - 4; x += o.gap || 16) {
    const yb = fn(x) + 3;
    poly(c, [[x, ytop + 2], [x + 3, ytop + 2], [x + 5, yb], [x - 1, yb]], vShade(base, -0.1));
    rect(c, x, ytop + 2, 1, yb - ytop - 2, vShade(base, 0.2));
  }
  rect(c, x0 - 1, ytop - 2, x1 - x0 + 2, 2, VIL.stoneLit);
  for (let x = x0; x < x1; x += 3) rect(c, x, ytop - 5, 1, 3, VIL.stoneLit);
  rect(c, x0 - 1, ytop - 6, x1 - x0 + 2, 1, VIL.stoneLit);
  moss(c, r, x0, ytop, x1 - x0, 30, Math.round((x1 - x0) * 0.35));
  for (let i = 0; i < (x1 - x0) * 0.6; i++) { const x = r.r(x0, x1), y = fn(x) - r.r(0, 12); if (y > ytop + 2) px(c, x, y, r.pick(VIL.creeper)); }
}

// ---------------------------------------------------------------- trees and flowers, in autumn
/** A plane tree: a pale mottled trunk and a broad crown, gold and orange. */
function planeTree(c, r, x, yb, hh, pal = null) {
  trunk(c, x, yb, hh * 0.55, 6, 4, '#c8bca0', '#a89a7c');
  for (let i = 0; i < 12; i++) rect(c, x - 2 + r.r(-1, 2), yb - r.r(4, hh * 0.5), r.r(2, 4), r.r(2, 3), r.pick(['#8a8468', '#e0d8c0', '#a8a088']));
  for (let k = 0; k < 3; k++) branch(c, x, yb - hh * 0.45, x + r.r(-18, 18), yb - hh * r.r(0.62, 0.8), 2, '#a89a7c');
  const p = pal || (r() < 0.5 ? VIL.gold : VIL.leaf);
  crown(c, r, x, yb - hh * 0.75, hh * 0.46, hh * 0.3, p, { x: -0.7, y: -0.7 }, 44);
  // a few bare twigs through the thinning leaves, a few leaves falling
  for (let k = 0; k < 4; k++) { const a = r.r(-2.6, -0.5); line(c, x + Math.cos(a) * hh * 0.3, yb - hh * 0.75 + Math.sin(a) * hh * 0.2, x + Math.cos(a) * hh * 0.44, yb - hh * 0.75 + Math.sin(a) * hh * 0.3, '#8a7a60', 1); }
  for (let k = 0; k < 8; k++) px(c, x + r.r(-hh * 0.5, hh * 0.5), yb - r.r(4, hh * 0.4), r.pick(p.slice(1)));
}

/** A mulberry tree, the silkworms' food: a low round crown on a crooked trunk, bright yellow now. */
function mulberry(c, r, x, yb, hh) {
  branch(c, x, yb, x + r.r(-4, 4), yb - hh * 0.5, 4, '#5a4432');
  crown(c, r, x, yb - hh * 0.62, hh * 0.5, hh * 0.34, r() < 0.7 ? VIL.gold : VIL.leaf, { x: -0.7, y: -0.7 }, 36);
}

/** Wild flowers of autumn in the grass: asters, marigolds, poppies late in bloom, seed heads. */
function wildflowers(c, r, x0, x1, y0, y1, n, cols = VIL.flowers) {
  for (let i = 0; i < n; i++) {
    const x = r.r(x0, x1), y = r.r(y0, y1), hh = 2 + (y - y0) / Math.max(1, y1 - y0) * 5;
    line(c, x, y, x + r.r(-1, 1), y - hh, r.pick(VIL.stems), 1);
    const col = r.pick(cols);
    px(c, x, y - hh - 1, col);
    if (r() < 0.5) { px(c, x - 1, y - hh - 1, col); px(c, x + 1, y - hh - 1, col); px(c, x, y - hh - 2, col); }
  }
}

/** A row of lavender bushes, grey-green now, a few late flowers. */
function lavender(c, r, x0, x1, yb) {
  for (let x = x0; x < x1; x += r.r(6, 9)) {
    ellipse(c, x, yb - 3, 4, 3, '#5a6a50');
    for (let k = 0; k < 7; k++) { const sx = x + r.r(-4, 4); line(c, sx, yb - 3, sx + r.r(-1, 1), yb - r.r(6, 10), '#7a8a68', 1); px(c, sx, yb - r.r(7, 11), r.pick(['#8a6ad0', '#9a8aa0', '#7050b8', '#a89a8a'])); }
  }
}

/** A rose bush, still in flower: red and pink roses among bronzed leaves. */
function roseBush(c, r, x, yb, w) {
  crown(c, r, x, yb - w * 0.35, w * 0.5, w * 0.35, ['#2e4a22', '#4a5e2a', '#7a6a2a'], { x: -0.6, y: -0.8 }, 16);
  for (let i = 0; i < w * 1.2; i++) px(c, x + r.r(-w * 0.45, w * 0.45), yb - r.r(2, w * 0.65), r.pick(['#e0305a', '#f06a8a', '#ffc0cc', '#c8203a']));
}

// ---------------------------------------------------------------- the great buildings
/**
 * A Gothic cathedral with twin spires, like Cologne's: the west front's two towers of open
 * stonework rising to lace spires, a rose window and a deep portal between them; behind them
 * the long nave with its flying buttresses, a transept with its own rose, a slender spire over
 * the crossing, and the apse. Pale limestone, lit from the left, bright in the sun.
 * x is the left of the front and yb its foot; the nave runs to the right, 252 × s long in all.
 * Returns the points of its spires, for sparkles.
 */
function vCathedral(c, r, x, yb, s = 1, o = {}) {
  const u = (v) => v * s, X = (v) => x + u(v), Y = (v) => yb - u(v);
  const P = { hi: '#fbf6ea', lit: '#e8dfcc', mid: '#c6bca8', dark: '#978e7e', deep: '#5e564c', glass: '#34405a', glassLit: '#f4cc78', roof: '#4c5466', roofLit: '#737e96', ...o.pal };
  const R = (x0, y0, x1, y1, col) => rect(c, X(x0), Y(y1), u(x1 - x0), u(y1 - y0), col);
  const lancet = (cx, y0, y1, w, col) => { R(cx - w / 2, y0, cx + w / 2, y1, col); poly(c, [[X(cx - w / 2), Y(y1)], [X(cx + w / 2), Y(y1)], [X(cx), Y(y1 + w * 0.9)]], col); };
  const pinnacle = (cx, y0, h, w, col = P.lit) => { poly(c, [[X(cx - w / 2), Y(y0)], [X(cx + w / 2), Y(y0)], [X(cx), Y(y0 + h)]], col); px(c, X(cx), Y(y0 + h) - 1, P.hi); };
  // the nave: the clerestory with its tall windows, the steep slate roof
  R(60, 34, 230, 64, P.mid);
  R(60, 60, 230, 64, P.lit);
  for (let b = 66; b < 226; b += 14) lancet(b + 5, 40, 56, 5, r() < 0.3 ? P.glassLit : P.glass);
  poly(c, [[X(58), Y(64)], [X(232), Y(64)], [X(226), Y(86)], [X(64), Y(86)]], P.roof);
  poly(c, [[X(64), Y(86)], [X(226), Y(86)], [X(227), Y(83)], [X(63), Y(83)]], P.roofLit);
  for (let k = 66; k < 226; k += 4) px(c, X(k), Y(87), P.deep);
  // the aisle below, its windows and its lean-to roof, and the flying buttresses over it
  R(60, 0, 230, 34, P.mid);
  R(60, 32, 230, 34, P.lit);
  poly(c, [[X(60), Y(34)], [X(230), Y(34)], [X(230), Y(42)], [X(60), Y(42)]], P.roof);
  for (let b = 66; b < 226; b += 14) lancet(b + 7, 8, 24, 6, r() < 0.25 ? P.glassLit : P.glass);
  for (let b = 64; b <= 226; b += 14) {
    R(b, 0, b + 4, 50, P.dark);
    R(b, 0, b + 1.5, 50, P.lit);
    pinnacle(b + 2, 50, 10, 4);
    branch(c, X(b + 3), Y(46), X(b + 9), Y(58), Math.max(1, u(2)), P.dark);
    branch(c, X(b + 3), Y(47), X(b + 9), Y(59), 1, P.lit);
  }
  // the transept's front, with its portal, its rose window and its gable between two turrets
  R(146, 0, 178, 72, P.mid);
  R(146, 0, 156, 72, P.lit);
  R(174, 0, 178, 72, P.dark);
  poly(c, [[X(146), Y(72)], [X(178), Y(72)], [X(162), Y(98)]], P.mid);
  poly(c, [[X(146), Y(72)], [X(162), Y(98)], [X(162), Y(72)]], P.lit);
  circle(c, X(162), Y(52), u(10), P.dark);
  circle(c, X(162), Y(52), u(8), P.glass);
  for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; line(c, X(162), Y(52), X(162) + Math.cos(a) * u(8), Y(52) + Math.sin(a) * u(8), P.mid, 1); }
  circle(c, X(162), Y(52), u(2.5), P.glassLit);
  for (let k = 0; k < 5; k++) px(c, X(162) + r.r(-u(6), u(6)), Y(52) + r.r(-u(6), u(6)), P.glassLit);
  lancet(162, 0, 22, 10, P.deep);
  lancet(162, 0, 20, 7, '#4a3424');
  for (const tx of [144, 176]) { R(tx, 0, tx + 4, 92, P.dark); R(tx, 0, tx + 1.5, 92, P.lit); pinnacle(tx + 2, 92, 14, 4); }
  // the spire over the crossing
  R(186, 86, 194, 100, P.dark);
  R(186, 86, 189, 100, P.lit);
  poly(c, [[X(185), Y(100)], [X(195), Y(100)], [X(190), Y(140)]], P.roof);
  poly(c, [[X(185), Y(100)], [X(190), Y(140)], [X(190), Y(100)]], P.roofLit);
  rect(c, X(190) - 0.5, Y(146), 1, u(6), '#e0b050');
  // the apse at the east end, lower, round, with its own pinnacles
  poly(c, [[X(228), yb], [X(228), Y(58)], [X(240), Y(56)], [X(248), Y(48)], [X(252), Y(36)], [X(252), yb]], P.mid);
  poly(c, [[X(228), Y(58)], [X(240), Y(56)], [X(248), Y(48)], [X(250), Y(58)], [X(236), Y(74)], [X(228), Y(76)]], P.roof);
  for (const [ax, ah] of [[236, 30], [246, 24]]) lancet(ax, 10, 10 + ah, 4, P.glass);
  for (const px_ of [242, 250]) pinnacle(px_, 50, 10, 3, P.mid);
  // the west front: first the middle, between the towers
  R(24, 0, 50, 88, P.mid);
  R(24, 0, 32, 88, P.lit);
  // the great portal: pointed arches within arches, the doors deep inside
  lancet(37, 0, 26, 20, P.lit);
  lancet(37, 0, 25, 16, P.mid);
  lancet(37, 0, 24, 12, P.dark);
  lancet(37, 0, 22, 9, '#4a3424');
  R(36.5, 0, 37.5, 22, P.deep);
  poly(c, [[X(26), Y(36)], [X(48), Y(36)], [X(37), Y(50)]], P.lit);
  poly(c, [[X(30), Y(38)], [X(44), Y(38)], [X(37), Y(46)]], P.dark);
  // the great west window above it, full of tracery and the sun
  lancet(37, 50, 78, 16, P.dark);
  lancet(37, 51, 77, 14, P.glass);
  for (let k = 0; k < 3; k++) R(32 + k * 5, 51, 32.8 + k * 5, 77, P.mid);
  circle(c, X(37), Y(84), u(4), P.glassLit);
  for (let k = 0; k < 6; k++) px(c, X(37) + r.r(-u(6), u(6)), Y(r.r(54, 76)), P.glassLit);
  // the gable over the middle, with its gallery
  poly(c, [[X(24), Y(88)], [X(50), Y(88)], [X(37), Y(106)]], P.mid);
  poly(c, [[X(24), Y(88)], [X(37), Y(106)], [X(37), Y(88)]], P.lit);
  for (let k = 25; k < 50; k += 2) R(k, 88, k + 1, 91, P.hi);
  // the two towers
  for (const tx of [0, 50]) {
    // four stages: the portal, the tall windows, the belfry, the open octagon; the spire of lace on top
    R(tx, 0, tx + 24, 118, P.mid);
    R(tx, 0, tx + 8, 118, P.lit);
    R(tx + 18, 0, tx + 24, 118, P.dark);
    lancet(tx + 12, 0, 22, 10, P.lit);
    lancet(tx + 12, 0, 21, 7, '#4a3424');
    for (const wx of [7, 17]) { lancet(tx + wx, 46, 78, 4, P.deep); R(tx + wx - 0.3, 46, tx + wx + 0.3, 78, P.mid); }
    lancet(tx + 12, 88, 110, 9, P.deep);
    for (let y = 90; y < 108; y += 3) R(tx + 8, y, tx + 16, y + 1, P.dark);
    poly(c, [[X(tx + 6), Y(110)], [X(tx + 18), Y(110)], [X(tx + 12), Y(120)]], P.lit);
    // the string courses, and the buttresses up the corners with their pinnacles
    for (const y of [40, 84, 112]) { R(tx - 1, y, tx + 25, y + 1.5, P.hi); R(tx - 1, y - 1, tx + 25, y, P.dark); }
    for (const bx of [0, 21]) {
      R(tx + bx, 0, tx + bx + 3, 124, bx ? P.dark : P.lit);
      for (const y of [40, 84]) pinnacle(tx + bx + 1.5, y + 1.5, 7, 3, bx ? P.mid : P.hi);
      pinnacle(tx + bx + 1.5, 124, 14, 3, bx ? P.mid : P.hi);
    }
    // the octagon: narrower, open
    R(tx + 4, 118, tx + 20, 142, P.mid);
    R(tx + 4, 118, tx + 9, 142, P.lit);
    R(tx + 17, 118, tx + 20, 142, P.dark);
    for (const wx of [9, 15]) lancet(tx + wx, 121, 136, 3, P.deep);
    for (let k = 4; k <= 20; k += 4) pinnacle(tx + k, 142, 6, 2, k < 12 ? P.hi : P.mid);
    // the spire: stone lace, lit on its left, crockets climbing its edges, a finial at the point
    const sy0 = 142, sy1 = 210, sw = 8;
    poly(c, [[X(tx + 12 - sw), Y(sy0)], [X(tx + 12 + sw), Y(sy0)], [X(tx + 12), Y(sy1)]], P.mid);
    poly(c, [[X(tx + 12 - sw), Y(sy0)], [X(tx + 12), Y(sy1)], [X(tx + 12), Y(sy0)]], P.lit);
    for (let y = sy0 + 6; y < sy1 - 6; y += 7) {
      const hw = sw * (1 - (y - sy0) / (sy1 - sy0));
      line(c, X(tx + 12 - hw), Y(y), X(tx + 12 + hw), Y(y), P.dark, 1);
      for (let k = -hw + 2; k < hw - 1; k += 3) px(c, X(tx + 12 + k), Y(y + 3), P.deep);
    }
    for (let y = sy0 + 3; y < sy1 - 2; y += 5) {
      const hw = sw * (1 - (y - sy0) / (sy1 - sy0));
      px(c, X(tx + 12 - hw) - 1, Y(y), P.hi);
      px(c, X(tx + 12 + hw) + 1, Y(y), P.mid);
    }
    rect(c, X(tx + 12) - 0.5, Y(sy1 + 8), 1, u(8), P.hi);
    rect(c, X(tx + 12) - 1.5, Y(sy1 + 5), 3, 1, P.hi);
    px(c, X(tx + 12), Y(sy1 + 8) - 1, '#fff6d0');
  }
  // sunlight catching the stone: the brightest edges
  for (let k = 0; k < 40; k++) px(c, X(r.r(0, 8)), Y(r.r(0, 118)), P.hi);
  return [[X(12), Y(218)], [X(62), Y(218)], [X(190), Y(146)]];
}

/** A rock spur with a flat top to build on: a cliff lit on its left, ledges of autumn scrub. */
function vSpur(c, r, x, yb, w, h, P) {
  const top = yb - h;
  const pts = [[x - w * 0.5, yb], [x - w * 0.12, top + h * 0.35], [x, top + 2], [x + w, top + 2], [x + w * 1.12, top + h * 0.3], [x + w * 1.5, yb]];
  poly(c, pts, P.rock);
  poly(c, [[x - w * 0.5, yb], [x - w * 0.12, top + h * 0.35], [x, top + 2], [x + w * 0.3, top + 2], [x + w * 0.1, top + h * 0.5], [x - w * 0.1, yb]], P.rockLit);
  poly(c, [[x + w * 0.8, top + 2], [x + w, top + 2], [x + w * 1.12, top + h * 0.3], [x + w * 1.5, yb], [x + w * 0.9, yb]], P.rockDark);
  for (let k = 0; k < 10; k++) { const yy = top + r.r(6, h - 4); line(c, x + r.r(-w * 0.2, w * 0.6), yy, x + r.r(w * 0.3, w * 1.1), yy + r.r(-2, 2), P.rockDark, 1); }
  for (let k = 0; k < 14; k++) { const yy = top + r.r(4, h); crown(c, r, x + r.r(-w * 0.3, w * 1.3), yy, r.r(2, 5), r.r(1.5, 3), vAutumn(r).map((col) => vMix(col, P.haze, P.hazeK || 0)), { x: -0.7, y: -0.7 }, 6); }
  rect(c, x, top, w, 3, P.rockLit);
  return top + 1;
}

/** A château of the south on its rock: a round tower at each end with a pointed slate roof, a
 *  tall square keep flying its flag, curtain walls, and a wing with tall windows, in the sun. */
function vChateau(c, r, x, yb, s, P) {
  const u = (v) => v * s, X = (v) => x + u(v), Y = (v) => yb - u(v);
  const R = (x0, y0, x1, y1, col) => rect(c, X(x0), Y(y1), u(x1 - x0), u(y1 - y0), col);
  const cone = (cx, y0, w, h) => { poly(c, [[X(cx - w / 2 - 1), Y(y0)], [X(cx + w / 2 + 1), Y(y0)], [X(cx), Y(y0 + h)]], P.roof); poly(c, [[X(cx - w / 2 - 1), Y(y0)], [X(cx), Y(y0 + h)], [X(cx), Y(y0)]], P.roofLit); rect(c, X(cx) - 0.5, Y(y0 + h + 4), 1, u(4), '#e8c050'); };
  const tower = (x0, w, h) => { R(x0, 0, x0 + w, h, P.mid); R(x0, 0, x0 + w * 0.35, h, P.lit); R(x0 + w * 0.75, 0, x0 + w, h, P.dark); for (let y = 8; y < h - 4; y += 10) R(x0 + w / 2 - 1, y, x0 + w / 2 + 1, y + 4, P.glass); R(x0 - 1, h - 2, x0 + w + 1, h, P.lit); cone(x0 + w / 2, h, w, h * 0.55); };
  // the curtain wall along the rock, crenellated
  R(0, 0, 96, 16, P.mid); R(0, 0, 30, 16, P.lit);
  for (let k = 0; k < 96; k += 4) R(k, 16, k + 2, 18, k < 30 ? P.lit : P.mid);
  // the wing: tall windows, a steep roof, dormers
  R(16, 16, 62, 40, P.mid); R(16, 16, 30, 40, P.lit);
  for (let k = 20; k < 60; k += 7) { const lit = r() < 0.3; R(k, 22, k + 3, 32, lit ? P.glassLit : P.glass); R(k - 0.5, 32, k + 3.5, 33.5, P.lit); }
  poly(c, [[X(14), Y(40)], [X(64), Y(40)], [X(60), Y(52)], [X(18), Y(52)]], P.roof);
  poly(c, [[X(14), Y(40)], [X(18), Y(52)], [X(40), Y(52)], [X(40), Y(40)]], P.roofLit);
  for (let k = 22; k < 58; k += 10) { R(k, 42, k + 4, 48, P.lit); poly(c, [[X(k - 1), Y(48)], [X(k + 5), Y(48)], [X(k + 2), Y(52)]], P.roof); }
  // the keep with its flag
  R(60, 0, 78, 64, P.mid); R(60, 0, 66, 64, P.lit); R(74, 0, 78, 64, P.dark);
  for (let y = 20; y < 58; y += 12) R(67, y, 70, y + 5, P.glass);
  for (let k = 60; k < 78; k += 4) R(k, 64, k + 2, 67, k < 66 ? P.lit : P.mid);
  poly(c, [[X(59), Y(64)], [X(79), Y(64)], [X(69), Y(80)]], P.roof);
  poly(c, [[X(59), Y(64)], [X(69), Y(80)], [X(69), Y(64)]], P.roofLit);
  rect(c, X(69) - 0.5, Y(92), 1, u(12), '#3a3030');
  rect(c, X(69) + 0.5, Y(92), u(3), u(2.5), '#2e4a9a'); rect(c, X(69) + 0.5 + u(3), Y(92), u(3), u(2.5), '#f4f0e8'); rect(c, X(69) + 0.5 + u(6), Y(92), u(3), u(2.5), '#c83a3a');
  tower(-4, 16, 44);
  tower(86, 14, 38);
  for (let k = 0; k < 20; k++) px(c, X(r.r(-4, 30)), Y(r.r(0, 44)), P.hi);
}

/** An abbey among its trees: a Romanesque church with a square bell tower, and the long
 *  cloister buildings with their arcade. */
function vAbbey(c, r, x, yb, s, P) {
  const u = (v) => v * s, X = (v) => x + u(v), Y = (v) => yb - u(v);
  const R = (x0, y0, x1, y1, col) => rect(c, X(x0), Y(y1), u(x1 - x0), u(y1 - y0), col);
  // the cloister wing
  R(0, 0, 40, 16, P.mid); R(0, 0, 12, 16, P.lit);
  for (let k = 3; k < 38; k += 5) { R(k, 2, k + 3, 9, P.dark); ellipse(c, X(k + 1.5), Y(9), u(1.5), u(1.2), P.dark); }
  poly(c, [[X(-2), Y(16)], [X(42), Y(16)], [X(40), Y(22)], [X(0), Y(22)]], P.tile);
  // the church: nave, apse, and the bell tower at the crossing
  R(36, 0, 86, 28, P.mid); R(36, 0, 48, 28, P.lit);
  for (let k = 50; k < 84; k += 8) { R(k, 12, k + 3, 20, P.dark); ellipse(c, X(k + 1.5), Y(20), u(1.5), u(1.4), P.dark); }
  poly(c, [[X(34), Y(28)], [X(88), Y(28)], [X(84), Y(38)], [X(38), Y(38)]], P.tile);
  poly(c, [[X(34), Y(28)], [X(38), Y(38)], [X(60), Y(38)], [X(60), Y(28)]], vShade(P.tile, 0.15));
  R(62, 28, 76, 58, P.mid); R(62, 28, 67, 58, P.lit); R(73, 28, 76, 58, P.dark);
  for (const wx of [65, 70]) { R(wx, 46, wx + 2, 53, P.deep); ellipse(c, X(wx + 1), Y(53), u(1), u(1), P.deep); }
  poly(c, [[X(60), Y(58)], [X(78), Y(58)], [X(69), Y(66)]], P.tile);
  rect(c, X(69) - 0.5, Y(72), 1, u(6), '#3a3030'); rect(c, X(69) - 1.5, Y(70), 3, 1, '#3a3030');
  ellipse(c, X(88), Y(12), u(6), u(12), P.mid); R(86, 0, 94, 12, P.mid);
}

/** A tower windmill of Provence: a round stone tower, a door and a window, the wooden cap and the
 *  long tail pole that turns it into the wind. The sails are drawn apart (vSails, or the walk).
 *  Returns the hub. */
function vWindmill(c, r, x, yb, s, P) {
  const u = (v) => v * s;
  const t = yb - u(34);
  poly(c, [[x - u(8), yb], [x + u(8), yb], [x + u(6), t], [x - u(6), t]], P.mid);
  poly(c, [[x - u(8), yb], [x - u(2), yb], [x - u(1.5), t], [x - u(6), t]], P.lit);
  poly(c, [[x + u(4), yb], [x + u(8), yb], [x + u(6), t], [x + u(4), t]], P.dark);
  for (let y = t + u(4); y < yb; y += u(4)) line(c, x - u(7), y, x + u(7), y, vShade(P.mid, -0.12), 1);
  rect(c, x - u(2), yb - u(9), u(4), u(9), '#4a3424');
  ellipse(c, x, yb - u(9), u(2), u(1.2), '#4a3424');
  rect(c, x - u(1), t + u(8), u(2), u(3), '#3a3a48');
  // the cap and its tail pole reaching down behind
  ellipse(c, x, t, u(7.5), u(5), P.cap);
  rect(c, x - u(7.5), t, u(15), u(1.6), vShade(P.cap, -0.25));
  ellipse(c, x - u(2.5), t - u(2), u(3), u(2), vShade(P.cap, 0.2));
  line(c, x + u(5), t, x + u(16), yb - u(4), '#4a3424', Math.max(1, u(0.8)));
  if (P.moss) for (let i = 0; i < 16 * s; i++) px(c, x + r.r(-u(7), u(7)), yb - Math.pow(r(), 2) * u(14), r.pick(VIL.moss));
  return [x - u(1), t - u(1)];
}

/** The four sails of a windmill: lattice frames with their canvas, turned to angle a. */
function vSails(c, x, y, R, a, P = {}) {
  const wood = P.wood || '#5a4030', cloth = P.cloth || '#efe6d2', clothDark = P.clothDark || '#cfc4ae';
  for (let k = 0; k < 4; k++) {
    const q = a + k * Math.PI / 2, dx = Math.cos(q), dy = Math.sin(q), nx = -dy, ny = dx;
    const at = (d, w) => [x + dx * d + nx * w, y + dy * d + ny * w];
    poly(c, [at(R * 0.22, 0), at(R, 0), at(R, R * 0.3), at(R * 0.22, R * 0.3)], k % 2 ? clothDark : cloth);
    line(c, x, y, x + dx * R, y + dy * R, wood, 1);
    line(c, ...at(R * 0.22, R * 0.3), ...at(R, R * 0.3), wood, 1);
    for (let d = R * 0.22; d <= R + 0.1; d += R * 0.13) line(c, ...at(d, 0), ...at(d, R * 0.3), wood, 1);
  }
  circle(c, x, y, Math.max(1, R * 0.08), '#3a2a1e');
}

/** A mountain: lit on its left flank, shaded on its right, snow on it if it is high enough. */
function vPeak(c, r, px_, yb, h, w, P) {
  const jag = (i, n, a) => (i && i < n ? r.r(-a, a) : 0);
  const n = 9, L = [], Rr = [];
  for (let i = 0; i <= n; i++) { const t = i / n; L.push([px_ - w * (1 - t) + jag(i, n, w * 0.04), yb - h * Math.pow(t, 1.15) + jag(i, n, h * 0.05)]); }
  for (let i = n; i >= 0; i--) { const t = i / n; Rr.push([px_ + w * 0.9 * (1 - t) + jag(i, n, w * 0.04), yb - h * Math.pow(t, 1.25) + jag(i, n, h * 0.05)]); }
  const outline = [...L, ...Rr.slice(1)];
  poly(c, outline, P.shade);
  // the ridge from the peak down to the foot divides the sunlit face from the shaded one
  const ridge = [];
  for (let i = 0; i <= 6; i++) { const t = i / 6; ridge.push([px_ + w * 0.12 * t + (i ? r.r(-w * 0.04, w * 0.04) : 0), yb - h + h * t]); }
  const lit = [...L, ...ridge.slice(1)];
  poly(c, lit, P.lit);
  for (let k = 0; k < 5; k++) { const t = r.r(0.2, 0.7), sx = px_ - w * t * 0.5, sy = yb - h + h * t; line(c, sx, sy, sx - w * r.r(0.08, 0.2), sy + h * r.r(0.15, 0.35), P.shade, 1); }
  for (let k = 0; k < 4; k++) { const t = r.r(0.2, 0.7), sx = px_ + w * t * 0.5, sy = yb - h + h * t; line(c, sx, sy, sx + w * r.r(0.05, 0.15), sy + h * r.r(0.15, 0.3), P.deep || P.shade, 1); }
  // snow above the snowline, running down the gullies in tongues
  if (!P.snow || h < (P.snowAt || 0)) return;
  const sy = yb - h * (1 - (P.snowline || 0.36)), snow = [[px_ - w - 4, sy]];
  for (let x = px_ - w; x <= px_ + w; x += 3) snow.push([x, sy + (Math.sin(x * 0.35 + px_) > 0.2 ? r.r(3, h * 0.16) : r.r(-3, 2))]);
  snow.push([px_ + w + 4, sy], [px_ + w + 4, yb - h - 6], [px_ - w - 4, yb - h - 6]);
  const clip = (pts) => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const p of pts) c.lineTo(p[0], p[1]); c.closePath(); c.clip(); };
  c.save(); clip(outline); poly(c, snow, P.snowShade); clip(lit); poly(c, snow, P.snow); c.restore();
}

/** The silk mill: a long stone building of three storeys, rows of tall windows, a chimney. */
function vMill(c, r, x, yb, w, hh) {
  const wall = '#b4aea0';
  stoneFace(c, r, x, yb - hh, w, hh, wall, { min: 5, max: 11 });
  rect(c, x, yb - hh, 3, hh, vShade(wall, 0.24));
  for (let f = 0; f < 3; f++) for (let k = x + 8; k < x + w - 8; k += 14) {
    const y = yb - hh + 8 + f * 20, lit = r() < 0.35;
    ellipse(c, k + 4, y, 5, 4, vShade(wall, 0.2));
    rect(c, k - 1, y, 10, 13, vShade(wall, 0.2));
    ellipse(c, k + 4, y, 4, 3, '#5a5448');
    rect(c, k, y, 8, 12, '#5a5448');
    ellipse(c, k + 4, y, 3, 2, lit ? VIL.lit : '#3a4a62');
    rect(c, k + 1, y, 6, 11, lit ? VIL.lit : '#3a4a62');
    if (lit) glow(c, k + 4, y + 5, 12, 'rgba(255,200,110,0.4)');
    rect(c, k + 4, y, 1, 11, '#5a5448');
  }
  moss(c, r, x, yb - 18, w, 18, Math.round(w * 0.4));
  creeper(c, r, x + w - 50, yb, 46, hh * 0.8);
  poly(c, [[x - 4, yb - hh], [x + w + 4, yb - hh], [x + w - 10, yb - hh - 20], [x + 10, yb - hh - 20]], VIL.slate);
  for (let y = yb - hh - 18; y < yb - hh; y += 3) line(c, x + 4, y, x + w - 4, y, VIL.slateDark, 1);
  rect(c, x + 10, yb - hh - 20, w - 20, 1, vShade(VIL.slate, 0.25));
  for (let i = 0; i < w * 0.4; i++) px(c, x + r.r(4, w - 4), yb - hh - r.r(1, 9), r.pick(VIL.moss));
  rect(c, x + w * 0.2, yb - hh - 44, 9, 26, '#9a6a52');
  rect(c, x + w * 0.2, yb - hh - 44, 2, 26, '#b8826a');
  rect(c, x + w * 0.2 - 1, yb - hh - 46, 11, 3, '#6a4a3a');
  // the sign over the door: FILATURE, in gold on dark blue
  rect(c, x + w / 2 - 26, yb - hh + 2, 52, 8, '#24305a');
  for (let k = 0; k < 9; k++) rect(c, x + w / 2 - 22 + k * 5, yb - hh + 4, 3, 4, '#f0c860');
  rect(c, x + w / 2 - 10, yb - 24, 20, 24, vShade(wall, 0.2));
  ellipse(c, x + w / 2, yb - 24, 10, 5, vShade(wall, 0.2));
  rect(c, x + w / 2 - 8, yb - 22, 16, 22, '#4a3424');
  ellipse(c, x + w / 2, yb - 22, 8, 4, '#4a3424');
}

/** A covered wash-house at the water: a tiled roof on stone posts over a stone basin. */
function vLavoir(c, r, x, yb, w) {
  for (const px_ of [x + 1, x + w - 6]) { rect(c, px_, yb - 26, 5, 26, VIL.stone); rect(c, px_, yb - 26, 1, 26, VIL.stoneLit); }
  poly(c, [[x - 6, yb - 24], [x + w + 6, yb - 24], [x + w - 4, yb - 36], [x + 4, yb - 36]], VIL.roof);
  for (let y = yb - 34; y < yb - 24; y += 2) line(c, x, y, x + w, y, VIL.roofDark, 1);
  for (let i = 0; i < w * 0.5; i++) px(c, x + r.r(0, w), yb - r.r(25, 32), r.pick(VIL.moss));
  rect(c, x - 2, yb - 5, w + 4, 5, VIL.stone);
  rect(c, x - 2, yb - 5, w + 4, 1, VIL.stoneLit);
  moss(c, r, x - 2, yb - 5, w + 4, 5, 10);
  for (let k = x + 6; k < x + w - 6; k += 10) rect(c, k, yb - 9, 6, 4, r.pick(['#f4f0e8', '#e8e0f0', '#f0e0d0']));
}

/** A riverside guinguette: a wooden terrace, tables under strings of paper lanterns. */
function vGuinguette(c, r, x, yb, w) {
  rect(c, x, yb - 3, w, 3, '#7a5a3e');
  for (const k of [0, w * 0.5, w]) rect(c, x + k - 1, yb - 48, 3, 45, '#5a4030');
  for (const [a, b] of [[x, x + w * 0.5], [x + w * 0.5, x + w]]) {
    for (let t = 0; t <= 1; t += 0.02) px(c, a + (b - a) * t, yb - 46 + Math.sin(t * Math.PI) * 9, '#3a2a2a');
    for (let t = 0.12; t < 1; t += 0.19) {
      const lx = a + (b - a) * t, ly = yb - 44 + Math.sin(t * Math.PI) * 9, col = r.pick(['#ff6a4a', '#ffd04a', '#f08a3a', '#e84a3a', '#ffe08a']);
      ellipse(c, lx, ly + 2, 2, 2.6, col);
      glow(c, lx, ly + 2, 7, 'rgba(255,220,150,0.5)');
    }
  }
  for (let k = x + 10; k < x + w - 10; k += 26) {
    rect(c, k, yb - 12, 14, 2, '#f4ece0');
    for (let q = 0; q < 14; q += 2) rect(c, k + q, yb - 12, 1, 2, '#b83a3a');
    rect(c, k + 6, yb - 10, 2, 7, '#5a4030');
    rect(c, k - 4, yb - 9, 3, 6, '#6a4a30'); rect(c, k + 15, yb - 9, 3, 6, '#6a4a30');
    rect(c, k + 3, yb - 15, 2, 3, r.pick(['#8a2a4a', '#f0e0a0', '#e8a040']));
  }
}

/** A church: a grey stone front with a rose window and door, and its bell tower with a slate spire. */
function vChurch(c, r, x, yb, s = 1) {
  const u = (v) => v * s;
  const st = VIL.stone, dk = VIL.stoneDark, lt = VIL.stoneLit;
  const tx = x + u(62);
  stoneFace(c, r, tx, yb - u(120), u(26), u(120), st);
  rect(c, tx, yb - u(120), u(3), u(120), lt);
  rect(c, tx + u(23), yb - u(120), u(3), u(120), dk);
  for (const y of [34, 70]) { rect(c, tx + u(8), yb - u(120) + u(y - 20), u(10), u(16), '#2e3448'); ellipse(c, tx + u(13), yb - u(120) + u(y - 20), u(5), u(4), '#2e3448'); }
  rect(c, tx - u(2), yb - u(122), u(30), u(4), dk);
  poly(c, [[tx - u(2), yb - u(122)], [tx + u(28), yb - u(122)], [tx + u(13), yb - u(160)]], VIL.slate);
  poly(c, [[tx - u(2), yb - u(122)], [tx + u(13), yb - u(160)], [tx + u(8), yb - u(122)]], '#6e7690');
  rect(c, tx + u(12.5), yb - u(170), u(1.2), u(11), '#3a3a44'); rect(c, tx + u(10), yb - u(166), u(6), u(1.2), '#3a3a44');
  moss(c, r, tx, yb - u(30), u(26), u(30), 14);
  c.save();
  c.beginPath(); c.moveTo(x, yb); c.lineTo(x, yb - u(62)); c.lineTo(x + u(32), yb - u(84)); c.lineTo(x + u(64), yb - u(62)); c.lineTo(x + u(64), yb); c.closePath(); c.clip();
  stoneFace(c, r, x, yb - u(84), u(64), u(84), st);
  c.restore();
  poly(c, [[x, yb], [x, yb - u(62)], [x + u(4), yb - u(65)], [x + u(4), yb]], lt);
  line(c, x, yb - u(62), x + u(32), yb - u(84), lt, 1);
  rect(c, x + u(62), yb - u(62), u(2), u(62), dk);
  circle(c, x + u(32), yb - u(56), u(9), dk);
  circle(c, x + u(32), yb - u(56), u(7), '#5a4a8a');
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; line(c, x + u(32), yb - u(56), x + u(32) + Math.cos(a) * u(7), yb - u(56) + Math.sin(a) * u(7), dk, 1); }
  circle(c, x + u(32), yb - u(56), u(2), '#e8c060');
  ellipse(c, x + u(32), yb - u(26), u(10), u(9), dk);
  rect(c, x + u(22), yb - u(26), u(20), u(26), dk);
  ellipse(c, x + u(32), yb - u(26), u(8), u(7), '#4a3424');
  rect(c, x + u(24), yb - u(26), u(16), u(26), '#4a3424');
  rect(c, x + u(32), yb - u(32), u(1), u(32), '#2e1e14');
  for (const k of [6, 50]) { ellipse(c, x + u(k + 4), yb - u(40), u(3), u(3), '#3a4a62'); rect(c, x + u(k + 1), yb - u(40), u(6), u(14), '#3a4a62'); }
  moss(c, r, x, yb - u(16), u(64), u(16), 24);
  creeper(c, r, x, yb, u(18), u(50));
  return [tx + u(13), yb - u(170)];
}

/** A stone fountain in the square: a round basin and a column with its spouts. */
function vFountain(c, x, yb) {
  ellipse(c, x, yb - 3, 20, 4, VIL.stoneDark);
  rect(c, x - 20, yb - 9, 40, 6, VIL.stone);
  rect(c, x - 20, yb - 9, 40, 1, VIL.stoneLit);
  for (let k = -18; k < 18; k += 5) px(c, x + k, yb - 4, VIL.moss[1]);
  ellipse(c, x, yb - 9, 19, 2.5, '#6aa8d8');
  for (let k = 0; k < 6; k++) px(c, x - 14 + k * 5, yb - 9, VIL.leaf[2]);
  rect(c, x - 3, yb - 28, 6, 19, VIL.stone);
  rect(c, x - 3, yb - 28, 1, 19, VIL.stoneLit);
  ellipse(c, x, yb - 28, 7, 2, VIL.stoneDark);
  rect(c, x - 1, yb - 34, 2, 6, VIL.stone);
}

/** A low wall of dry stone along a field, moss on its top. */
function stoneWall(c, r, x0, x1, yb, hh) {
  for (let y = yb - hh; y < yb; y += 3) for (let x = x0 + (((y - yb) / 3) % 2 ? 0 : 3); x < x1; x += r.r(5, 8)) {
    rect(c, x, y, r.r(4, 7), 3, r.pick([VIL.stone, VIL.stoneDark, VIL.stoneLit, '#a8a294']));
  }
  for (let x = x0; x < x1; x += r.r(1, 3)) px(c, x, yb - hh - (r() < 0.3 ? 1 : 0), r.pick(VIL.moss));
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
  vgrad(c, 0, 0, W, H, [[0, '#2f6eba'], [0.22, '#5896d2'], [0.42, '#9cc2e2'], [0.56, '#e8dccc'], [1, '#f4e4c4']]);
  sun(c, 64, 32, 12, '#fffef0', 'rgba(255,240,200,0.7)');
  const hi = L('clouds_high', { depth: 0.02, anim: { type: 'drift', t: 700 } });
  wrapped(hi, 81, (cc, rr) => { for (let i = 0; i < 60; i++) { const x = rr.r(0, W), y = rr.r(6, 50); ellipse(cc, x, y, rr.r(3, 7), rr.r(1.5, 2.6), rr.pick(['#ffffff', '#f4f0ec', '#dce4f0'])); } });
  const cl = L('clouds', { depth: 0.04, anim: { type: 'drift', t: 420 } });
  wrapped(cl, 82, (cc, rr) => {
    cumulus(cc, rr, 150, 30, 110, 34, { dark: '#b8c0d8', mid: '#eceef6', lit: '#fffaf0', lx: -1 });
    cumulus(cc, rr, 360, 54, 80, 24, { dark: '#b8c0d8', mid: '#eceef6', lit: '#fffaf0', lx: -1 });
  });
  // the high mountains, snow on their peaks
  const pk = L('peaks', { depth: 0.01 });
  const PK = { lit: '#b8c0dc', shade: '#8c96bc', deep: '#7a84aa', snow: '#fbfcff', snowShade: '#ccd4e8', snowline: 0.4, snowAt: 70 };
  for (const [x, h, w] of [[-10, 88, 80], [84, 120, 100], [190, 96, 86], [290, 128, 110], [398, 106, 96], [494, 118, 100]]) vPeak(pk, r, x, 158, h, w, PK);
  pk.save(); pk.globalCompositeOperation = 'source-atop'; vgrad(pk, 0, 96, W, 62, [[0, 'rgba(236,228,220,0)'], [1, 'rgba(236,226,212,0.85)']]); pk.restore();
  // the foothills in their autumn woods, the château on its rock, the abbey on its knoll
  const rg = L('range', { depth: 0.03 });
  const RG = { lit: '#c8ac8c', shade: '#907870', deep: '#74605c', snow: '#fbfaf6', snowShade: '#d4d0d8', snowline: 0.22, snowAt: 70 };
  for (const [x, h, w] of [[20, 58, 70], [170, 74, 90], [330, 56, 70], [452, 70, 80]]) vPeak(rg, r, x, 172, h, w, RG);
  rg.save(); rg.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 420; i++) { const x = r.r(-10, W + 10), y = r.r(112, 174); crown(rg, r, x, y, r.r(3, 7), r.r(2, 4), vAutumn(r).map((col) => vMix(col, '#e0d0c0', 0.35)), { x: -0.7, y: -0.7 }, 6); }
  rg.restore();
  const CP = { lit: '#f4ecd8', mid: '#d4c8b0', dark: '#a89a84', hi: '#fffbee', roof: '#5a6278', roofLit: '#8a94ac', glass: '#4a5670', glassLit: '#f4cc78', rock: '#a08a78', rockLit: '#c8b098', rockDark: '#7a6660', haze: '#e0d0c0', hazeK: 0.3 };
  const cTop = vSpur(rg, r, 180, 176, 52, 72, CP);
  vChateau(rg, r, 182, cTop, 0.5, CP);
  rg.save(); rg.globalCompositeOperation = 'source-atop'; vgrad(rg, 0, 150, W, 26, [[0, 'rgba(232,220,200,0)'], [1, 'rgba(232,220,200,0.55)']]); rg.restore();
  // rolling hills of vineyards gone red and gold, windmills on the crests
  const hs = L('hills', { depth: 0.06 });
  const fnH = vProfile([[-10, 160], [56, 134], [104, 150], [150, 132], [204, 154], [260, 150], [330, 160], [410, 148], [490, 158]]);
  vLand(hs, fnH, -10, W + 10, 190, '#b89a58');
  hs.save(); hs.globalCompositeOperation = 'source-atop';
  for (let x = 0; x < W; x++) { const d = fnH(x + 2) - fnH(x - 2); if (d > 0.3) rect(hs, x, fnH(x), 1, 40, '#9a7e48'); else if (d < -0.3) rect(hs, x, fnH(x), 1, 30, '#ccae66'); }
  for (let y = 146; y < 190; y += 3) for (let x = 0; x < W; x += 2) if (Math.sin(x * 0.02 + y * 0.3) > 0.2) px(hs, x + (y % 2), y, r.pick(['#a83a22', '#c86a2a', '#d8a040', '#8a4a2a']));
  hs.restore();
  for (const x of [12, 30, 84, 118, 176, 222]) poplar(hs, r, x, fnH(x) + 3, r.r(20, 28), { trunk: '#5a4a3a', leaves: ['#b0782a', '#e0a83a', '#f8d870'] }, -1);
  const MP = { lit: '#f0e8d8', mid: '#d0c6b2', dark: '#a0947e', cap: '#7a5a3a', moss: true };
  const hubs = [56, 150].map((x) => vWindmill(hs, r, x, fnH(x) + 3, 0.9, MP));
  hubs.forEach(([hx, hy], i) => {
    const sl = L(`sails${i}`, { depth: 0.06, anim: { type: 'spin', t: 10 + i * 2, ox: 0.5, oy: 0.5 } });
    vSails(sl, hx, hy, 16, i * 0.4);
  });
  // the cathedral's hill: stone houses in terraces up to its platform, the cathedral on top
  const hl = L('hill', { depth: 0.12 });
  const fnC = vProfile([[150, 188], [200, 178], [240, 158], [280, 130], [306, 114], [322, 108], [440, 108], [462, 114], [490, 124]]);
  vLand(hl, fnC, 150, W + 10, 196, '#a88a4a');
  hl.save(); hl.globalCompositeOperation = 'source-atop';
  for (let x = 150; x < W; x++) { const d = fnC(x + 3) - fnC(x - 3); rect(hl, x, fnC(x), 1, 90, d < -1 ? '#bea05a' : d > 1 ? '#8a6e3c' : '#a88a4a'); }
  texture(hl, r, 150, 100, W - 150, 96, 0.08, 2);
  hl.restore();
  for (let i = 0; i < 40; i++) { const x = r.r(160, W), y = fnC(x) + r.r(4, 40); if (y > 186) continue; crown(hl, r, x, y - 3, r.r(4, 7), r.r(3, 5), vAutumn(r), { x: -0.7, y: -0.7 }, 10); }
  hillTown(hl, r, fnC, 196, 322, 46, { wMin: 9, wMax: 14, hMin: 8, hMax: 11, sink: 16 });
  hillTown(hl, r, fnC, 444, W + 6, 16, { wMin: 9, wMax: 14, hMin: 8, hMax: 11, sink: 14 });
  terrace(hl, r, 316, 450, 102, fnC, { gap: 14 });
  vCathedral(hl, r, 330, 102, 0.4);
  hillTown(hl, r, fnC, 270, 322, 12, { wMin: 10, wMax: 14, hMin: 9, hMax: 11, sink: 22 });
  // the quay: grey stone houses shoulder to shoulder along the water, plane trees before them
  const town = L('town', { depth: 0.2 });
  rect(town, 0, 166, W, 26, VIL.stone);
  let x = 196;
  while (x < W + 10) { const w = r.r(26, 40), hh = r.r(40, 58); vHouse(town, r, x, 184, w, hh, { slate: r() < 0.3, ivy: r() < 0.3 ? (r() < 0.5 ? 'left' : 'right') : null, vine: r() < 0.12 ? 'rose' : null, moss: r.r(0.2, 0.6), chimney: r() < 0.6 ? r.r(0.6, 0.8) : false }); x += w + r.r(0, 3); }
  for (const tx of [262, 350, 440]) planeTree(town, r, tx, 186, 50);
  // the wash-house on the quay between the mill and the houses
  vLavoir(town, r, 140, 184, 44);
  // the quay wall down to the water, moss and weeds in its cracks, leaves along its top
  rect(town, 0, 184, W, 12, '#a8a294');
  for (let k = 0; k < W; k += r.r(8, 16)) rect(town, k, 184 + r.i(0, 10), r.r(4, 8), 1, '#8a8478');
  for (let i = 0; i < 70; i++) px(town, r() * W, r.r(185, 195), r.pick([...VIL.moss, '#e0302a', '#f4d23a']));
  leafLitter(town, r, 0, W, 182, 186, 160);
  // the silk mill on the left with its wheel, and the bank before it
  vMill(town, r, 4, 184, 100, 46);
  const wheel = L('wheel', { depth: 0.2, anim: { type: 'spin', t: 7, ox: 0.5, oy: 0.5 } });
  circle(wheel, 112, 188, 14, '#6a4a30');
  wheel.save(); wheel.globalCompositeOperation = 'destination-out'; circle(wheel, 112, 188, 11, '#000'); wheel.restore();
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; line(wheel, 112, 188, 112 + Math.cos(a) * 14, 188 + Math.sin(a) * 14, '#8a6a44', 1); rect(wheel, 112 + Math.cos(a) * 14 - 1.5, 188 + Math.sin(a) * 14 - 1.5, 3, 3, '#5a3a24'); }
  circle(wheel, 112, 188, 2.5, '#3a2a1e');
  // the river: blue with the sky, the town and the autumn trees trembling in it
  const river = L('river', { depth: 0.3 });
  vgrad(river, 0, 196, W, 50, [[0, '#7aaad4'], [0.4, '#5a8ec0'], [1, '#3a68a0']]);
  for (let i = 0; i < 260; i++) { const y = r.r(197, 244); river.globalAlpha = r.r(0.3, 0.8); rect(river, r() * W, y, r.r(3, 12), 1, r.pick(['#c8c2b4', '#e0a050', '#c8702e', '#b8d8f0', '#ffffff', '#6aa0d0'])); }
  river.globalAlpha = 1;
  for (let y = 198; y < 244; y += 1) { const hw = 3 + (y - 198) * 0.8; for (let k = 0; k < 2; k++) rect(river, 64 + r.r(-hw, hw), y, r.r(2, 6), 1, r.pick(['#ffffff', '#fff6d8'])); }
  for (let i = 0; i < 40; i++) { const lx = r() * W, ly = r.r(200, 244); px(river, lx, ly, r.pick(VIL.leaf.slice(1))); px(river, lx + 1, ly, r.pick(VIL.leaf.slice(1))); }
  // boats on the water, rocking
  for (const [bx, by, s, sail, t] of [[250, 214, 1, true, 4.4], [400, 226, 0.8, false, 5.2]]) {
    const b = L(`boat${bx}`, { depth: 0.32, anim: { type: 'bob', a: 0.8, t } });
    vGabare(b, bx, by, s, sail);
  }
  // our bank in front: autumn grass full of asters and fallen leaves, bending in the breeze
  const bank = L('bank', { depth: 0.6, anim: sway(1.2, 4.6, { oy: 1 }) });
  poly(bank, [[0, 236], [120, 240], [260, 246], [W, 244], [W, H], [0, H]], '#a8903e');
  vgrad(bank, 0, 240, W, 30, [[0, 'rgba(180,150,70,0)'], [1, 'rgba(70,50,30,0.6)']]);
  wildflowers(bank, r, 0, W, 242, H, 600);
  leafLitter(bank, r, 0, W, 244, H, 400);
  for (let i = 0; i < 80; i++) { const fx = r() * W, fy = r.r(250, H), hh = r.r(8, 20); line(bank, fx, fy, fx + r.r(-2, 3), fy - hh, r.pick(VIL.stems), 1); ellipse(bank, fx, fy - hh, 2, 1.6, r.pick(['#9a5ad0', '#f08a2a', '#ffffff', '#f4d23a', '#e0302a'])); }
  return { colors: 120, vignette: [0.18, '40,30,20'] };
};
