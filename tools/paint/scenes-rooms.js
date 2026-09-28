/* Interiors. One-point perspective rooms, lit by windows, lamps and fires. */
/* global W, H, TAU, rng, vgrad, hgrad, rect, px, circle, ellipse, poly, line, glow, shade, vignette, shaft, speckle,
   stars, moon, sun, cloud, cloudBand, cumulus, ridge, hill, treeLine, crown, trunk, branch, tree, poplar, cypress, pine,
   frHouse, window_, jpHouse, reflect, texture, tufts, rock */

globalThis.SCENES = globalThis.SCENES || {};

/** A room seen straight on: back wall, side walls, ceiling and a planked floor. */
function room(c, r, o) {
  const { bx0, by0, bx1, by1 } = o;
  const vx = (bx0 + bx1) / 2;
  poly(c, [[0, 0], [W, 0], [bx1, by0], [bx0, by0]], o.ceiling);
  poly(c, [[0, 0], [bx0, by0], [bx0, by1], [0, H]], o.left);
  poly(c, [[W, 0], [bx1, by0], [bx1, by1], [W, H]], o.right);
  rect(c, bx0, by0, bx1 - bx0, by1 - by0, o.back);
  poly(c, [[0, H], [bx0, by1], [bx1, by1], [W, H]], o.floor);
  const n = o.planks || 14;
  for (let i = 0; i <= n; i++) {
    const x = bx0 + ((bx1 - bx0) * i) / n;
    const t = (H - by1) / Math.max(1, by1 - (o.vy || by0 + (by1 - by0) * 0.45));
    line(c, x, by1, x + (x - vx) * t, H, o.plankLine, 1);
  }
  for (let k = 1; k < 7; k++) {
    const y = by1 + (H - by1) * Math.pow(k / 7, 1.6);
    c.globalAlpha = 0.35;
    line(c, 0, y, W, y, o.plankLine, 1);
  }
  c.globalAlpha = 1;
  // wall/floor seams and the shade in the corners
  line(c, bx0, by0, bx0, by1, o.seam, 1); line(c, bx1, by0, bx1, by1, o.seam, 1);
  line(c, 0, H, bx0, by1, o.seam, 1); line(c, W, H, bx1, by1, o.seam, 1);
  line(c, 0, 0, bx0, by0, o.seam, 1); line(c, W, 0, bx1, by0, o.seam, 1);
  rect(c, bx0, by1 - 3, bx1 - bx0, 3, o.skirting || o.seam);
  // light falls off toward the edges of the room: darker side walls, ceiling and near floor
  c.save();
  c.beginPath(); c.moveTo(0, 0); c.lineTo(bx0, by0); c.lineTo(bx0, by1); c.lineTo(0, H); c.closePath(); c.clip();
  hgrad(c, 0, 0, bx0, H, [[0, 'rgba(0,0,0,0.38)'], [1, 'rgba(0,0,0,0.05)']]);
  c.restore();
  c.save();
  c.beginPath(); c.moveTo(W, 0); c.lineTo(bx1, by0); c.lineTo(bx1, by1); c.lineTo(W, H); c.closePath(); c.clip();
  hgrad(c, bx1, 0, W - bx1, H, [[0, 'rgba(0,0,0,0.05)'], [1, 'rgba(0,0,0,0.38)']]);
  c.restore();
  vgrad(c, bx0, by0, bx1 - bx0, 18, [[0, 'rgba(0,0,0,0.25)'], [1, 'rgba(0,0,0,0)']]);
  vgrad(c, 0, by1, W, H - by1, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.3)']]);
  vgrad(c, bx0, by1 - 14, bx1 - bx0, 14, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.18)']]);
}

/** A point on the left or right wall: t = depth (0 at the front edge, 1 at the back wall), v = height (0 top, 1 floor). */
function wallPt(o, side, t, v) {
  const x = side < 0 ? o.bx0 * t : W - (W - o.bx1) * t;
  const top = o.by0 * t, bot = H - (H - o.by1) * t;
  return [x, top + (bot - top) * v];
}
function wallQuad(c, o, side, t0, t1, v0, v1, col) {
  poly(c, [wallPt(o, side, t0, v0), wallPt(o, side, t1, v0), wallPt(o, side, t1, v1), wallPt(o, side, t0, v1)], col);
}

/** A tall window with a view painted inside it. */
function viewWindow(c, x, y, w, h, paintView, o = {}) {
  c.save();
  c.beginPath();
  if (o.arch) { c.moveTo(x, y + h); c.lineTo(x, y + w / 2); c.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w, y + h); c.closePath(); }
  else c.rect(x, y, w, h);
  c.clip();
  paintView(x, y, w, h);
  c.restore();
  const fr = o.frame || '#4a3526';
  if (o.arch) {
    c.strokeStyle = fr; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + w / 2); c.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w, y + h); c.stroke();
  } else { c.strokeStyle = fr; c.lineWidth = 3; c.strokeRect(x, y, w, h); }
  rect(c, x + w / 2 - 1, y + (o.arch ? 2 : 0), 2, h, fr);
  for (let k = 1; k < (o.bars || 3); k++) rect(c, x, y + (h * k) / (o.bars || 3), w, 1.5, fr);
  rect(c, x - 3, y + h, w + 6, 3, o.sill || '#6b4c34');
}

function books(c, r, x, y, w, h, n) {
  let bx = x;
  while (bx < x + w - 2) {
    const bw = r.i(2, 4), bh = h * r.r(0.7, 1);
    rect(c, bx, y + h - bh, bw, bh, r.pick(['#7a2e2e', '#2e4a6b', '#5b6b2e', '#8a6b2e', '#4a2e5b', '#a0785a', '#2e5b52']));
    rect(c, bx, y + h - bh + 2, bw, 1, 'rgba(255,220,160,0.4)');
    bx += bw + (r() < 0.15 ? 2 : 0);
  }
}

function lamp(c, x, y, s = 1, lit = true) {
  rect(c, x - 3 * s, y, 6 * s, 2 * s, '#6b4c2a');
  rect(c, x - 1 * s, y - 6 * s, 2 * s, 6 * s, '#8a6a3a');
  ellipse(c, x, y - 9 * s, 4 * s, 5 * s, lit ? '#ffe2a0' : '#bfb6a0');
  ellipse(c, x, y - 9 * s, 2 * s, 3 * s, lit ? '#fff6d8' : '#d8d0c0');
  if (lit) { glow(c, x, y - 9 * s, 40 * s, 'rgba(255,190,100,0.55)'); glow(c, x, y - 9 * s, 12 * s, 'rgba(255,230,160,0.8)'); }
}

function candle(c, x, y, lit = true) {
  rect(c, x - 1, y - 6, 3, 6, '#efe6d0'); rect(c, x - 2, y, 5, 1, '#8a6a3a');
  if (lit) { rect(c, x, y - 9, 1, 3, '#ffd27a'); px(c, x, y - 10, '#fff4c8'); glow(c, x, y - 8, 26, 'rgba(255,180,90,0.5)'); }
}

// ---------------------------------------------------------------- the silk mill (full of life, or empty)
function millScene(c, empty) {
  const r = rng(empty ? 52 : 51);
  const o = { bx0: 120, by0: 44, bx1: 360, by1: 176 };
  const warm = !empty;
  room(c, r, {
    ...o,
    ceiling: warm ? '#4a3424' : '#2e3036', left: warm ? '#b99870' : '#6f727a', right: warm ? '#a8865e' : '#62666f',
    back: warm ? '#caa77a' : '#7d828c', floor: warm ? '#7a5a40' : '#4b4d55', plankLine: warm ? '#5e422d' : '#3a3c44', seam: warm ? '#6b4c34' : '#40434b',
  });
  texture(c, r, 0, 0, W, 180, 0.05, 3);
  // ceiling beams
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const y0 = o.by0 * t, x0 = o.bx0 * t, x1 = W - (W - o.bx1) * t;
    rect(c, x0, y0, x1 - x0, 3 + (1 - t) * 6, warm ? '#3a281b' : '#24262c');
  }
  // three arched windows on the back wall: spring hills and poplars, or a grey sky
  const view = (x, y, w, h) => {
    if (warm) {
      vgrad(c, x, y, w, h, [[0, '#8fc3ee'], [0.7, '#cfe6f2'], [1, '#e8f0dc']]);
      hill(c, r, x - 10, x + w + 10, y + h * 0.82, h * 0.25, '#8fb46a');
      for (let k = 0; k < 3; k++) poplar(c, r, x + 6 + k * (w / 3), y + h * 0.84, h * 0.4, { trunk: '#5a4a3a', leaves: ['#4f7a3a', '#7aa54a', '#c8e08a'] });
      vgrad(c, x, y + h * 0.82, w, h * 0.18, [[0, '#a8c878'], [1, '#86a860']]);
    } else {
      vgrad(c, x, y, w, h, [[0, '#9aa3b2'], [1, '#c6ccd4']]);
      hill(c, r, x - 10, x + w + 10, y + h * 0.84, h * 0.2, '#7c8690');
      for (let k = 0; k < 3; k++) { const px_ = x + 6 + k * (w / 3); rect(c, px_, y + h * 0.5, 1, h * 0.34, '#5d646e'); for (let b = 0; b < 5; b++) line(c, px_, y + h * (0.55 + b * 0.05), px_ + r.r(-4, 4), y + h * (0.5 + b * 0.05), '#5d646e', 1); }
    }
  };
  for (let i = 0; i < 3; i++) viewWindow(c, 148 + i * 66, 58, 50, 92, view, { arch: true, frame: warm ? '#5b3f29' : '#3a3d45', sill: warm ? '#8a6a4a' : '#5a5d66' });
  // side-wall windows, in perspective
  for (const t of [0.35, 0.7]) {
    wallQuad(c, o, -1, t, t + 0.15, 0.18, 0.5, warm ? '#dff0f6' : '#b5bcc6');
    wallQuad(c, o, 1, t, t + 0.15, 0.18, 0.5, warm ? '#e8f4f6' : '#b5bcc6');
  }
  // sunlight pouring through the back windows onto the floor
  if (warm) {
    for (let i = 0; i < 3; i++) shaft(c, [[148 + i * 66, 70], [198 + i * 66, 70], [150 + i * 78, 262], [70 + i * 78, 262]], 'rgba(255,236,190,1)', 0.22);
    for (let i = 0; i < 3; i++) glow(c, 173 + i * 66, 100, 50, 'rgba(255,245,210,0.35)');
  } else {
    for (let i = 0; i < 3; i++) shaft(c, [[148 + i * 66, 70], [198 + i * 66, 70], [150 + i * 78, 262], [70 + i * 78, 262]], 'rgba(200,215,235,1)', 0.12);
  }
  // rearing racks along both walls: tiers of trays, green with mulberry and worms, or brown and bare
  const rack = (side) => {
    for (let tier = 0; tier < 4; tier++) {
      const v = 0.36 + tier * 0.13;
      wallQuad(c, o, side, 0.05, 0.92, v, v + 0.035, warm ? '#6b4a30' : '#4a4a50');
      wallQuad(c, o, side, 0.05, 0.92, v - 0.05, v, warm ? '#5f8a3a' : '#7a6448');
      for (let k = 0; k < 40; k++) {
        const t = 0.06 + r() * 0.85;
        const [x, y] = wallPt(o, side, t, v - 0.04 + r() * 0.035);
        px(c, x, y, warm ? r.pick(['#f4f0e0', '#8fbf5a', '#3f6a2a']) : r.pick(['#5e4a36', '#8a7458']));
      }
    }
    for (const t of [0.05, 0.35, 0.65, 0.92]) {
      const [x0, y0] = wallPt(o, side, t, 0.28), [, y1] = wallPt(o, side, t, 1);
      rect(c, x0 - 1, y0, Math.max(1, 3 * (1 - t) + 1), y1 - y0, warm ? '#4a321f' : '#34343a');
    }
  };
  rack(-1);
  rack(1);
  // silk skeins hanging from a pole, glowing in the light
  line(c, 150, 40, 330, 40, warm ? '#3a281b' : '#24262c', 2);
  for (let x = 156; x < 330; x += 9) {
    if (!warm && r() < 0.75) { if (r() < 0.4) line(c, x, 41, x + 1, 41 + r.r(4, 12), '#b9b4a8', 1); continue; }
    ellipse(c, x, 50, 3, 9, warm ? '#f3dca2' : '#c9c2b0');
    ellipse(c, x, 50, 1.5, 7, warm ? '#fff3cf' : '#ddd6c6');
    px(c, x - 1, 44, warm ? '#c9a45a' : '#9a9486');
  }
  // a reeling wheel at the back
  const wx = 240, wy = 148;
  c.strokeStyle = warm ? '#5b3f29' : '#40434b'; c.lineWidth = 2; c.beginPath(); c.arc(wx, wy, 14, 0, TAU); c.stroke();
  for (let k = 0; k < 8; k++) line(c, wx, wy, wx + Math.cos(k * TAU / 8) * 14, wy + Math.sin(k * TAU / 8) * 14, warm ? '#6b4c34' : '#4b4e56', 1);
  rect(c, wx - 18, wy + 14, 36, 12, warm ? '#6b4c34' : '#45474f');
  if (warm) for (let k = 0; k < 6; k++) line(c, wx - 12 + k * 5, wy - 8, wx - 30 + k * 12, wy - 30, 'rgba(255,240,200,0.6)', 1);
  // baskets and a table in the foreground
  ellipse(c, 70, 250, 34, 10, warm ? '#8a6238' : '#5a5048');
  rect(c, 36, 232, 68, 18, warm ? '#9c7042' : '#625850');
  for (let x = 38; x < 104; x += 4) rect(c, x, 232, 1, 18, warm ? '#7a5430' : '#4c4440');
  if (warm) for (let k = 0; k < 30; k++) ellipse(c, 44 + r() * 52, 232 + r.r(-3, 1), 3, 1.5, r.pick(['#6fa04a', '#4f7a3a', '#8fbf5a']));
  if (empty) { line(c, 390, 250, 440, 236, '#5a5048', 3); rect(c, 400, 250, 50, 4, '#4a4440'); }
  // cobwebs in the empty mill
  if (empty) for (const [x, y, s] of [[0, 0, 1], [W, 0, -1]]) for (let k = 0; k < 5; k++) line(c, x, y + k * 6, x + s * (30 - k * 5), y, 'rgba(210,215,225,0.35)', 1);
  vignette(c, empty ? 0.55 : 0.35);
  return { colors: 64 };
}
SCENES.silk_mill = (c) => millScene(c, false);
SCENES.silk_mill_empty = (c) => millScene(c, true);

// ---------------------------------------------------------------- Balbadiou's office
SCENES.balbadiou_office = (c) => {
  const r = rng(61);
  const o = { bx0: 96, by0: 40, bx1: 384, by1: 180 };
  room(c, r, { ...o, ceiling: '#3a2a22', left: '#40523e', right: '#3a4b38', back: '#4a5e46', floor: '#5a3e2c', plankLine: '#442e20', seam: '#2e2018', skirting: '#3a281c' });
  // wood panelling on the lower walls, patterned paper above
  rect(c, o.bx0, 124, o.bx1 - o.bx0, 56, '#6b4a32');
  for (let x = o.bx0 + 6; x < o.bx1 - 20; x += 28) { rect(c, x, 130, 22, 42, '#5a3c28'); rect(c, x, 130, 22, 1, '#8a6444'); }
  wallQuad(c, o, -1, 0, 1, 0.6, 1, '#5e4230'); wallQuad(c, o, 1, 0, 1, 0.6, 1, '#5a3e2c');
  for (let y = o.by0 + 6; y < 120; y += 10) for (let x = o.bx0 + 4 + ((y / 10) % 2) * 6; x < o.bx1; x += 12) px(c, x, y, '#6a7e5e');
  // a map of the world, the route to Japan marked in red
  rect(c, 150, 56, 124, 62, '#3a281c'); rect(c, 153, 59, 118, 56, '#e8d6ae');
  for (const [x, y, w, h] of [[160, 66, 22, 18], [178, 88, 14, 22], [196, 64, 30, 18], [214, 82, 18, 16], [228, 64, 34, 24], [236, 92, 18, 10], [262, 72, 6, 12]]) ellipse(c, x + w / 2, y + h / 2, w / 2, h / 2, '#b9a47a');
  c.strokeStyle = '#b3262c'; c.lineWidth = 1; c.setLineDash([2, 1]); c.beginPath(); c.moveTo(200, 74); c.quadraticCurveTo(232, 60, 264, 76); c.stroke(); c.setLineDash([]);
  circle(c, 200, 74, 1.5, '#b3262c'); circle(c, 264, 77, 1.5, '#b3262c');
  // the window on the right wall: roofs of the town in the afternoon
  const winPts = [wallPt(o, 1, 0.3, 0.14), wallPt(o, 1, 0.75, 0.14), wallPt(o, 1, 0.75, 0.62), wallPt(o, 1, 0.3, 0.62)];
  c.save(); c.beginPath(); c.moveTo(...winPts[0]); for (const p of winPts.slice(1)) c.lineTo(...p); c.closePath(); c.clip();
  vgrad(c, 380, 20, 100, 150, [[0, '#8cc0e8'], [1, '#f2e2c0']]);
  for (let i = 0; i < 6; i++) frHouse(c, r, 384 + i * 16, 150, 16, 20 + r() * 20, { roofH: 8, windows: [[5, 6, 4, 5, { shutters: '#5a7a9a' }]] });
  rect(c, 440, 70, 8, 60, '#d9c7a4'); poly(c, [[438, 70], [450, 70], [444, 58]], '#8a3f29');
  c.restore();
  poly(c, winPts, 'rgba(0,0,0,0)');
  c.strokeStyle = '#3a281c'; c.lineWidth = 3; c.beginPath(); c.moveTo(...winPts[0]); for (const p of winPts.slice(1)) c.lineTo(...p); c.closePath(); c.stroke();
  line(c, (winPts[0][0] + winPts[1][0]) / 2, (winPts[0][1] + winPts[1][1]) / 2, (winPts[3][0] + winPts[2][0]) / 2, (winPts[3][1] + winPts[2][1]) / 2, '#3a281c', 2);
  // afternoon light across the floor
  shaft(c, [winPts[0], winPts[3], [150, H], [300, 150]], 'rgba(255,220,160,1)', 0.18);
  // bookshelves on the left wall
  for (let s = 0; s < 5; s++) {
    const v = 0.14 + s * 0.14;
    wallQuad(c, o, -1, 0.2, 0.85, v, v + 0.12, '#2e2018');
    const [x0, y0] = wallPt(o, -1, 0.3, v + 0.02), [x1] = wallPt(o, -1, 0.8, v);
    books(c, r, x0, y0, x1 - x0, 10 - s, 1);
    wallQuad(c, o, -1, 0.2, 0.85, v + 0.12, v + 0.13, '#6b4a32');
  }
  // a globe, a coat stand with a hat
  circle(c, 116, 186, 11, '#4f7a8a'); ellipse(c, 112, 182, 5, 7, '#c8b37a'); ellipse(c, 121, 190, 4, 3, '#c8b37a');
  c.strokeStyle = '#a07a3a'; c.lineWidth = 1; c.beginPath(); c.arc(116, 186, 13, -1.2, 2.2); c.stroke();
  rect(c, 115, 198, 2, 20, '#5a3c28'); rect(c, 108, 218, 16, 2, '#5a3c28');
  rect(c, 350, 120, 2, 80, '#3a281c'); ellipse(c, 351, 120, 8, 2, '#3a281c'); ellipse(c, 351, 116, 6, 4, '#2a1e18'); rect(c, 343, 126, 16, 30, '#3d3a44');
  // the rug and the desk, with the ledger, inkwell and a lit lamp
  poly(c, [[110, 250], [180, 196], [320, 196], [390, 250]], '#7a2e2a');
  poly(c, [[122, 246], [184, 200], [316, 200], [378, 246]], '#8f3c30');
  for (let i = 0; i < 40; i++) px(c, 140 + r() * 220, 204 + r() * 40, '#c9a45a');
  rect(c, 150, 186, 180, 10, '#5a3a24'); rect(c, 150, 186, 180, 2, '#8a5c3a');
  rect(c, 158, 196, 10, 40, '#4a301e'); rect(c, 312, 196, 10, 40, '#4a301e'); rect(c, 168, 196, 144, 26, '#553622');
  for (let k = 0; k < 3; k++) rect(c, 176 + k * 46, 200, 38, 18, '#4a301e');
  poly(c, [[190, 186], [236, 186], [232, 180], [194, 180]], '#e8dcc0'); line(c, 213, 180, 213, 186, '#b0a080', 1);
  for (let k = 0; k < 4; k++) line(c, 197, 182 + k, 210, 182 + k, 'rgba(60,40,30,0.4)', 1);
  rect(c, 250, 180, 5, 6, '#1c1c24'); line(c, 253, 180, 262, 170, '#f0e6d0', 1);
  for (let k = 0; k < 3; k++) rect(c, 270 + k * 3, 176 - k * 4, 14, 4, r.pick(['#e8dcc0', '#dccfb0']));
  lamp(c, 306, 186, 1.2, true);
  vignette(c, 0.45);
  return { colors: 64 };
};

// ---------------------------------------------------------------- the Joncour house: the sitting room at dusk
SCENES.joncour_home = (c) => {
  const r = rng(71);
  const o = { bx0: 110, by0: 42, bx1: 370, by1: 182 };
  room(c, r, { ...o, ceiling: '#3a2c30', left: '#6e5a66', right: '#665260', back: '#7a6470', floor: '#5a3e30', plankLine: '#453024', seam: '#3a2a2e', skirting: '#4a3430' });
  texture(c, r, 0, 0, W, 190, 0.04, 3);
  for (let y = o.by0 + 8; y < o.by1 - 8; y += 12) for (let x = o.bx0 + 6 + ((y / 12) % 2) * 7; x < o.bx1 - 4; x += 14) { px(c, x, y, '#8c7482'); px(c, x + 1, y + 1, '#6a5460'); }
  // the big window on the back wall: the garden at dusk, the first stars
  const view = (x, y, w, h) => {
    vgrad(c, x, y, w, h, [[0, '#2c2c5e'], [0.5, '#6b4f86'], [0.85, '#d98a7e'], [1, '#f2b082']]);
    stars(c, r, 30, x, y, w, h * 0.4);
    hill(c, r, x - 10, x + w + 10, y + h * 0.86, h * 0.18, '#4a3a5e');
    for (let k = 0; k < 5; k++) crown(c, r, x + 10 + k * (w / 5), y + h * 0.8, 10, 12, ['#2a2440', '#3a3050', '#5a4a6a'], { x: 0.5, y: -0.5 }, 12);
    rect(c, x, y + h * 0.88, w, h * 0.12, '#2e2a40');
  };
  viewWindow(c, 176, 56, 128, 104, view, { frame: '#e6d6c2', sill: '#cdb9a0', bars: 3 });
  // curtains
  for (const [x, s] of [[166, 1], [314, -1]]) {
    poly(c, [[x, 50], [x + s * 18, 50], [x + s * 14, 170], [x - s * 2, 176]], '#7a2e3e');
    for (let k = 0; k < 4; k++) line(c, x + s * (3 + k * 4), 52, x + s * (2 + k * 3.5), 172, '#5e2232', 1);
  }
  rect(c, 160, 48, 160, 3, '#c9a45a');
  // her reading chair by the window, turned toward the room, a book left open on the seat
  ellipse(c, 152, 222, 36, 7, 'rgba(30,20,20,0.45)');
  poly(c, [[128, 140], [170, 136], [174, 196], [130, 200]], '#7a3e3a');
  ellipse(c, 149, 140, 22, 8, '#7a3e3a');
  poly(c, [[134, 146], [164, 143], [166, 186], [136, 188]], '#8f4a44');
  for (let k = 0; k < 3; k++) px(c, 142 + k * 8, 160, '#5e2c2a');
  poly(c, [[122, 176], [180, 172], [186, 206], [118, 210]], '#8f4a44');
  poly(c, [[122, 176], [180, 172], [182, 180], [121, 184]], '#b0625a');
  ellipse(c, 124, 184, 7, 16, '#7a3e3a'); ellipse(c, 182, 180, 7, 16, '#6e3834');
  ellipse(c, 124, 172, 7, 4, '#a85a52'); ellipse(c, 182, 168, 7, 4, '#9a5049');
  rect(c, 124, 208, 3, 10, '#3a2418'); rect(c, 178, 204, 3, 10, '#3a2418');
  poly(c, [[142, 176], [152, 173], [162, 176], [152, 179]], '#efe6d2'); line(c, 152, 173, 152, 179, '#b0a080', 1);
  glow(c, 150, 150, 40, 'rgba(170,140,220,0.18)');
  // the fireplace on the right wall, burning
  const fp = [wallPt(o, 1, 0.45, 0.5), wallPt(o, 1, 0.8, 0.5), wallPt(o, 1, 0.8, 1), wallPt(o, 1, 0.45, 1)];
  poly(c, fp, '#9c8a82');
  const fi = [wallPt(o, 1, 0.52, 0.62), wallPt(o, 1, 0.74, 0.62), wallPt(o, 1, 0.74, 0.97), wallPt(o, 1, 0.52, 0.97)];
  poly(c, fi, '#1c1210');
  const fc = [(fi[0][0] + fi[1][0]) / 2, (fi[2][1] + fi[1][1]) / 2 + 4];
  ellipse(c, fc[0], fc[1] + 6, 12, 3, '#3a2218');
  for (let k = 0; k < 7; k++) ellipse(c, fc[0] + r.r(-8, 8), fc[1] + r.r(-6, 2), r.r(2, 4), r.r(4, 8), r.pick(['#ffb040', '#ff7a2a', '#ffd070']));
  ellipse(c, fc[0], fc[1], 4, 6, '#fff0b0');
  glow(c, fc[0], fc[1], 120, 'rgba(255,140,60,0.5)');
  glow(c, fc[0], fc[1], 30, 'rgba(255,200,100,0.7)');
  const mt = [wallPt(o, 1, 0.42, 0.48), wallPt(o, 1, 0.83, 0.48), wallPt(o, 1, 0.83, 0.52), wallPt(o, 1, 0.42, 0.52)];
  poly(c, mt, '#5a3c2c');
  const [mx, my] = wallPt(o, 1, 0.62, 0.47);
  rect(c, mx - 4, my - 12, 8, 12, '#c9a45a'); circle(c, mx, my - 8, 3, '#f4ecd6');
  candle(c, mx - 16, my, true); candle(c, mx + 14, my, true);
  // a painting and a bookcase on the left wall
  wallQuad(c, o, -1, 0.35, 0.7, 0.2, 0.42, '#c9a45a');
  wallQuad(c, o, -1, 0.38, 0.67, 0.23, 0.39, '#4a6a7a');
  for (let s = 0; s < 4; s++) {
    const v = 0.5 + s * 0.1;
    wallQuad(c, o, -1, 0.72, 0.98, v, v + 0.09, '#2e2018');
    const [x0, y0] = wallPt(o, -1, 0.75, v + 0.01), [x1] = wallPt(o, -1, 0.96, v);
    books(c, r, x0, y0, x1 - x0, 8, 1);
  }
  // a small table with tea things, the rug, warm light on the floor
  poly(c, [[80, 268], [150, 214], [330, 214], [400, 268]], '#6a3a3a');
  poly(c, [[96, 262], [156, 218], [324, 218], [384, 262]], '#7e4a44');
  for (let i = 0; i < 50; i++) px(c, 120 + r() * 240, 222 + r() * 36, '#c99a6a');
  ellipse(c, 290, 222, 24, 6, '#5a3a28'); rect(c, 288, 222, 4, 24, '#4a301e');
  ellipse(c, 282, 218, 4, 2, '#f0e8e0'); rect(c, 280, 214, 5, 4, '#f0e8e0'); ellipse(c, 296, 219, 5, 2, '#f0e8e0');
  shade(c, fc[0], 240, 150, 'rgba(255,150,70,0.18)');
  shaft(c, [[176, 160], [304, 160], [340, 260], [150, 260]], 'rgba(170,150,220,1)', 0.12);
  vignette(c, 0.5);
  return { colors: 64 };
};

// ---------------------------------------------------------------- Hélène's room in winter
SCENES.helene_sickroom = (c) => {
  const r = rng(81);
  const o = { bx0: 120, by0: 40, bx1: 360, by1: 176 };
  room(c, r, { ...o, ceiling: '#3e3e48', left: '#8a8a94', right: '#7e7e8a', back: '#9696a2', floor: '#5a4e4a', plankLine: '#463c3a', seam: '#55555f', skirting: '#6a6a74' });
  for (let y = o.by0 + 8; y < o.by1 - 8; y += 14) for (let x = o.bx0 + 8 + ((y / 14) % 2) * 9; x < o.bx1 - 6; x += 18) { px(c, x, y, '#a8a0b0'); px(c, x - 1, y + 1, '#b4a8b4'); px(c, x + 1, y + 1, '#8c9a8c'); }
  texture(c, r, 0, 0, W, 180, 0.04, 3);
  // the window: a snowy garden, bare trees, grey light
  const view = (x, y, w, h) => {
    vgrad(c, x, y, w, h, [[0, '#9aa6ba'], [1, '#d4dae4']]);
    hill(c, r, x - 10, x + w + 10, y + h * 0.8, h * 0.2, '#b8c0cc');
    for (let k = 0; k < 3; k++) {
      const tx = x + 14 + k * (w / 3), tb = y + h * 0.84;
      rect(c, tx, tb - h * 0.45, 2, h * 0.45, '#4a4a55');
      for (let b = 0; b < 6; b++) branch(c, tx + 1, tb - h * (0.2 + b * 0.05), tx + r.r(-12, 12), tb - h * (0.4 + b * 0.06), 1, '#4a4a55');
    }
    rect(c, x, y + h * 0.84, w, h * 0.16, '#eef2f6');
  };
  viewWindow(c, 150, 56, 90, 100, view, { frame: '#e8e6e2', sill: '#d0cdc8', bars: 3 });
  shaft(c, [[150, 70], [240, 70], [330, 262], [150, 262]], 'rgba(220,230,250,1)', 0.14);
  poly(c, [[142, 52], [156, 52], [152, 164], [140, 168]], '#b8a8b4'); poly(c, [[248, 52], [234, 52], [238, 164], [250, 168]], '#b8a8b4');
  // the bed, white and heavy, with its dark wooden frame
  poly(c, [[250, 150], [370, 150], [420, 214], [270, 214]], '#f0eef0');
  poly(c, [[250, 150], [370, 150], [372, 156], [252, 156]], '#dcdae4');
  poly(c, [[270, 214], [420, 214], [420, 236], [270, 236]], '#d6d4de');
  for (let k = 0; k < 6; k++) line(c, 282 + k * 22, 170, 290 + k * 24, 232, 'rgba(160,160,190,0.4)', 1);
  rect(c, 244, 116, 132, 34, '#4a3228'); rect(c, 244, 116, 132, 3, '#7a5444');
  for (let k = 0; k < 5; k++) rect(c, 256 + k * 24, 122, 12, 24, '#3a261e');
  ellipse(c, 290, 150, 22, 7, '#ffffff'); ellipse(c, 334, 150, 22, 7, '#f6f6fa');
  rect(c, 266, 214, 6, 30, '#3a261e'); rect(c, 414, 214, 6, 30, '#3a261e');
  poly(c, [[300, 176], [400, 176], [418, 212], [306, 212]], '#c8b4c8');
  // the nightstand: a candle, medicine, flowers
  rect(c, 206, 176, 36, 5, '#5a3c2c'); rect(c, 208, 181, 32, 38, '#4a3024'); rect(c, 212, 188, 24, 10, '#3a2418');
  candle(c, 216, 176, true);
  rect(c, 226, 168, 4, 8, '#6a8a9a'); rect(c, 231, 170, 3, 6, '#8a6a4a');
  rect(c, 234, 164, 5, 12, '#c8d8e0'); for (let k = 0; k < 7; k++) circle(c, 236 + r.r(-4, 4), 160 + r.r(-4, 3), 1.5, r.pick(['#e8b0c0', '#f4e0e8', '#c07a90']));
  // a chair beside the bed, a shawl over it; a crucifix
  rect(c, 150, 196, 34, 5, '#5a3c2c'); rect(c, 152, 201, 4, 30, '#4a3024'); rect(c, 178, 201, 4, 30, '#4a3024'); rect(c, 150, 160, 5, 40, '#4a3024');
  poly(c, [[150, 162], [168, 166], [170, 210], [154, 206]], '#8a7a9a');
  rect(c, 309, 72, 2, 16, '#3a2a24'); rect(c, 304, 77, 12, 2, '#3a2a24');
  vignette(c, 0.5, '20,20,40');
  return { colors: 60 };
};

// ---------------------------------------------------------------- Madame Blanche's salon, lamplit, at night
SCENES.blanche_salon = (c) => {
  const r = rng(91);
  const o = { bx0: 100, by0: 38, bx1: 380, by1: 180 };
  room(c, r, { ...o, ceiling: '#2a1418', left: '#5a1c24', right: '#521a22', back: '#6a2028', floor: '#3a2420', plankLine: '#2a1814', seam: '#2a0e12', skirting: '#3a1a14' });
  for (let y = o.by0 + 6; y < o.by1 - 6; y += 10) for (let x = o.bx0 + 5 + ((y / 10) % 2) * 6; x < o.bx1 - 4; x += 12) { px(c, x, y, '#a8643a'); px(c, x - 1, y + 1, '#7a3a28'); px(c, x + 1, y + 1, '#7a3a28'); }
  rect(c, o.bx0, 60, o.bx1 - o.bx0, 2, '#c9a45a');
  // the tall window on the right wall: roofs and chimneys under the moon
  const win = [wallPt(o, 1, 0.25, 0.1), wallPt(o, 1, 0.7, 0.1), wallPt(o, 1, 0.7, 0.72), wallPt(o, 1, 0.25, 0.72)];
  c.save(); c.beginPath(); c.moveTo(...win[0]); for (const p of win.slice(1)) c.lineTo(...p); c.closePath(); c.clip();
  vgrad(c, 380, 0, 100, 220, [[0, '#0e1636'], [1, '#2c3a6a']]);
  stars(c, r, 30, 380, 0, 100, 120);
  moon(c, 438, 40, 7, { seed: 3 });
  for (let i = 0; i < 6; i++) {
    const hx = 384 + i * 16, hh = 40 + r() * 40;
    rect(c, hx, 200 - hh, 16, hh, '#161a2e'); poly(c, [[hx - 1, 200 - hh], [hx + 17, 200 - hh], [hx + 8, 192 - hh]], '#10132a');
    rect(c, hx + 4, 196 - hh - 10, 3, 8, '#161a2e');
    if (r() < 0.7) rect(c, hx + 6, 212 - hh, 3, 4, '#ffc870');
  }
  c.restore();
  c.strokeStyle = '#2a1410'; c.lineWidth = 3; c.beginPath(); c.moveTo(...win[0]); for (const p of win.slice(1)) c.lineTo(...p); c.closePath(); c.stroke();
  poly(c, [win[0], [win[0][0] + 12, win[0][1] + 4], [win[3][0] + 14, win[3][1] + 10], win[3]], '#3a1a3a');
  // a folding screen with cranes on gold, Madame Blanche's own
  const sx = 128, sy = 70, pw = 26, ph = 104;
  for (let i = 0; i < 6; i++) {
    const x = sx + i * pw;
    const skew = i % 2 ? 4 : 0;
    poly(c, [[x, sy + skew], [x + pw, sy + 4 - skew], [x + pw, sy + ph + 4 - skew], [x, sy + ph + skew]], i % 2 ? '#c9a045' : '#d8b25a');
    rect(c, x, sy + skew, 1, ph, '#3a1a14');
  }
  for (let k = 0; k < 8; k++) { const cx = sx + 10 + r() * (pw * 6 - 20), cy = sy + 20 + r() * 50; ellipse(c, cx, cy, 5, 2, '#f4f0ea'); line(c, cx - 5, cy, cx - 9, cy - 3, '#f4f0ea', 1); px(c, cx + 5, cy - 1, '#b3262c'); line(c, cx + 5, cy, cx + 8, cy - 4, '#2a2a2a', 1); }
  for (let k = 0; k < 20; k++) ellipse(c, sx + r() * pw * 6, sy + ph - 10 - r() * 20, r.r(4, 10), 1.5, '#3a5a3a');
  hill(c, r, sx, sx + pw * 6, sy + ph, 26, 'rgba(60,70,90,0.6)');
  // a chaise longue in green velvet, a low table with a Japanese tea set, an incense burner
  ellipse(c, 250, 232, 80, 10, 'rgba(10,4,4,0.5)');
  poly(c, [[170, 196], [320, 196], [330, 226], [166, 226]], '#1f4a3c');
  poly(c, [[160, 170], [196, 172], [194, 200], [164, 200]], '#245446');
  rect(c, 170, 196, 150, 3, '#3a7a62');
  for (let k = 0; k < 6; k++) px(c, 180 + k * 24, 204, '#c9a45a');
  rect(c, 170, 226, 4, 12, '#2a1410'); rect(c, 322, 226, 4, 12, '#2a1410');
  poly(c, [[300, 240], [390, 240], [404, 252], [290, 252]], '#1a0c0a'); rect(c, 294, 252, 4, 12, '#1a0c0a'); rect(c, 396, 252, 4, 12, '#1a0c0a');
  ellipse(c, 330, 238, 7, 4, '#2a2a30'); rect(c, 326, 230, 8, 8, '#2a2a30'); rect(c, 329, 228, 2, 3, '#4a4a55');
  for (let k = 0; k < 3; k++) { ellipse(c, 350 + k * 10, 239, 3, 1.5, '#e8e0d4'); rect(c, 348 + k * 10, 235, 5, 4, '#e8e0d4'); }
  rect(c, 378, 232, 8, 8, '#8a6a3a'); rect(c, 381, 226, 2, 6, '#5a4a3a');
  // lamps: a standing lamp and candles on the mantel of the left wall
  rect(c, 110, 120, 2, 100, '#8a6a3a'); rect(c, 104, 218, 14, 3, '#8a6a3a');
  poly(c, [[100, 118], [122, 118], [116, 104], [106, 104]], '#e8b060'); glow(c, 111, 116, 70, 'rgba(255,170,90,0.55)'); glow(c, 111, 112, 16, 'rgba(255,230,170,0.8)');
  const [cx, cy] = wallPt(o, -1, 0.55, 0.5);
  wallQuad(c, o, -1, 0.35, 0.8, 0.5, 0.53, '#3a1a14');
  candle(c, cx - 10, cy, true); candle(c, cx, cy - 1, true); candle(c, cx + 9, cy - 2, true);
  // a potted palm and the rug
  poly(c, [[90, 270], [150, 232], [340, 232], [420, 270]], '#4a1a24');
  poly(c, [[108, 266], [156, 236], [334, 236], [402, 266]], '#6a2a32');
  for (let i = 0; i < 60; i++) px(c, 130 + r() * 250, 240 + r() * 24, '#c9a45a');
  rect(c, 430, 230, 18, 22, '#6a3a2a');
  for (let k = 0; k < 9; k++) branch(c, 439, 230, 439 + r.r(-26, 26), 230 - r.r(20, 44), 2, '#2e5a3a');
  shade(c, 111, 150, 170, 'rgba(255,150,80,0.16)');
  vignette(c, 0.55);
  return { colors: 64 };
};
