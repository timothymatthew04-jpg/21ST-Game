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
function millScene(c, L, empty) {
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
  const sk = L('skeins', { depth: 0.5, anim: sway(warm ? 2.2 : 3.5, warm ? 4.5 : 6, { oy: 0 }) });
  for (let x = 156; x < 330; x += 9) {
    if (!warm && r() < 0.75) { if (r() < 0.4) line(sk, x, 41, x + 1, 41 + r.r(4, 12), '#b9b4a8', 1); continue; }
    ellipse(sk, x, 50, 3, 9, warm ? '#f3dca2' : '#c9c2b0');
    ellipse(sk, x, 50, 1.5, 7, warm ? '#fff3cf' : '#ddd6c6');
    px(sk, x - 1, 44, warm ? '#c9a45a' : '#9a9486');
  }
  // a reeling wheel at the back
  const wx = 240, wy = 148;
  rect(c, wx - 18, wy + 14, 36, 12, warm ? '#6b4c34' : '#45474f');
  // (the wheel turns while the mill is alive)
  const wl = warm ? L('wheel', { depth: 0.5, anim: { type: 'spin', t: 9, ox: 0.5, oy: 0.5 } }) : c;
  wl.strokeStyle = warm ? '#5b3f29' : '#40434b'; wl.lineWidth = 2; wl.beginPath(); wl.arc(wx, wy, 14, 0, TAU); wl.stroke();
  for (let k = 0; k < 8; k++) line(wl, wx, wy, wx + Math.cos(k * TAU / 8) * 14, wy + Math.sin(k * TAU / 8) * 14, warm ? '#6b4c34' : '#4b4e56', 1);
  circle(wl, wx, wy, 2, warm ? '#3a281b' : '#34343a');
  if (warm) for (let k = 0; k < 6; k++) line(c, wx - 12 + k * 5, wy - 8, wx - 30 + k * 12, wy - 30, 'rgba(255,240,200,0.6)', 1);
  // baskets and a table in the foreground
  ellipse(c, 70, 250, 34, 10, warm ? '#8a6238' : '#5a5048');
  rect(c, 36, 232, 68, 18, warm ? '#9c7042' : '#625850');
  for (let x = 38; x < 104; x += 4) rect(c, x, 232, 1, 18, warm ? '#7a5430' : '#4c4440');
  if (warm) for (let k = 0; k < 30; k++) ellipse(c, 44 + r() * 52, 232 + r.r(-3, 1), 3, 1.5, r.pick(['#6fa04a', '#4f7a3a', '#8fbf5a']));
  if (empty) { line(c, 390, 250, 440, 236, '#5a5048', 3); rect(c, 400, 250, 50, 4, '#4a4440'); }
  // cobwebs in the empty mill
  if (empty) for (const [x, y, s] of [[0, 0, 1], [W, 0, -1]]) for (let k = 0; k < 5; k++) line(c, x, y + k * 6, x + s * (30 - k * 5), y, 'rgba(210,215,225,0.35)', 1);
  return { colors: 64, vignette: empty ? [0.55, '10,14,24'] : [0.35, '30,16,0'] };
}
SCENES.silk_mill = (c, L) => millScene(c, L, false);
SCENES.silk_mill_empty = (c, L) => millScene(c, L, true);

// ---------------------------------------------------------------- Balbadiou's office
SCENES.balbadiou_office = (c, L) => {
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
  // a tall wall clock, its pendulum swinging
  rect(c, 302, 64, 22, 74, '#4a301e'); rect(c, 302, 64, 22, 2, '#8a5c3a'); circle(c, 313, 78, 8, '#e8dcc0'); circle(c, 313, 78, 7, '#f4ecd6');
  line(c, 313, 78, 313, 73, '#2a1e18', 1); line(c, 313, 78, 317, 79, '#2a1e18', 1); rect(c, 306, 90, 14, 44, '#2a1a12');
  const pd = L('pendulum', { depth: 0.5, anim: sway(9, 2, { oy: 0 }) });
  line(pd, 313, 90, 313, 124, '#c9a45a', 1); circle(pd, 313, 126, 3.5, '#d8b05a'); circle(pd, 312, 125, 1.2, '#fff0b0');
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
  return { colors: 64, vignette: [0.45, '20,10,0'] };
};

// ---------------------------------------------------------------- the Joncour house: the sitting room at dusk
SCENES.joncour_home = (c, L) => {
  // Hélène's corner of the Joncour house on an autumn morning: sun pouring in through the tall
  // window onto the plants, a wall of books, a day-bed heaped with knitted throws and cushions, a
  // rug, her basket of silk threads. Through the window, the garden's trees in orange and gold (the
  // leaves falling past it, the dust turning in the sunbeams and the birds are the scene's effects).
  const r = rng(71);
  const o = { bx0: 118, by0: 28, bx1: 382, by1: 186 };
  room(c, r, { ...o, ceiling: '#e6d2b4', left: '#d4b692', right: '#c6a682', back: '#e6ceac', floor: '#b27c4a', plankLine: '#8a5a34', seam: '#c8a882', skirting: '#a07850' });
  texture(c, r, 0, 0, W, 186, 0.035, 3);
  for (let i = 0; i < 220; i++) px(c, o.bx0 + r() * (o.bx1 - o.bx0), o.by0 + r() * (o.by1 - o.by0), r.pick(['#ecd6b6', '#dcc29e']));
  // old oak beams across the ceiling
  for (const t of [0.35, 0.7]) { const y0 = o.by0 * t, xl = o.bx0 * t, xr = W - (W - o.bx1) * t; poly(c, [[xl, y0 - 3], [xr, y0 - 3], [xr, y0 + 4], [xl, y0 + 4]], '#8a5a34'); rect(c, xl, y0 + 3, xr - xl, 1, '#5a3a20'); }
  // on the left wall: a painting of the sea in a gilt frame, a little shelf with a candle and a jug of dried flowers
  wallQuad(c, o, -1, 0.3, 0.62, 0.2, 0.42, '#c9a45a');
  wallQuad(c, o, -1, 0.33, 0.59, 0.23, 0.39, '#6a9ab8');
  wallQuad(c, o, -1, 0.33, 0.59, 0.33, 0.39, '#3a6a8a');
  wallQuad(c, o, -1, 0.66, 0.92, 0.5, 0.52, '#7a4a28');
  { const [sx, sy] = wallPt(o, -1, 0.72, 0.5); candle(c, sx, sy, false); const [jx, jy] = wallPt(o, -1, 0.84, 0.5); rect(c, jx - 3, jy - 7, 6, 7, '#d8c8a8'); for (let k = 0; k < 7; k++) px(c, jx + r.r(-5, 5), jy - r.r(8, 14), r.pick(['#c8a060', '#b85a3a', '#e8d8b8', '#8a6ad0'])); }
  // the tall window, and the autumn garden through it
  const view = (x, y, w, h) => {
    vgrad(c, x, y, w, h, [[0, '#8cc0ea'], [0.55, '#cfe4f2'], [1, '#f4ecd8']]);
    for (let k = 0; k < 3; k++) ellipse(c, x + 14 + k * 26, y + 14 + (k % 2) * 8, 12, 4, '#ffffff');
    rect(c, x, y + h * 0.62, w, h * 0.4, '#c8b070');
    for (let k = 0; k < 3; k++) { const hx = x + 8 + k * 30; rect(c, hx, y + h * 0.5, 20, 16, '#bab4a6'); poly(c, [[hx - 2, y + h * 0.5], [hx + 22, y + h * 0.5], [hx + 10, y + h * 0.5 - 8]], '#a8583a'); rect(c, hx + 4, y + h * 0.5 + 5, 3, 4, '#3a4a62'); }
    for (let k = 0; k < 6; k++) { const tx = x + r.r(0, w), ty = y + h * r.r(0.3, 0.62); branch(c, tx, ty + 30, tx + r.r(-3, 3), ty, 2, '#5a4030'); crown(c, r, tx, ty, r.r(12, 20), r.r(10, 15), r.pick([VIL.gold, VIL.leaf, VIL.red]), { x: -0.7, y: -0.7 }, 26); }
    for (let k = 0; k < 40; k++) px(c, x + r() * w, y + h * r.r(0.7, 1), r.pick(VIL.leaf.slice(1)));
    for (let xx = x; xx < x + w; xx += 5) rect(c, xx, y + h * 0.8, 2, 12, '#f0ece2');
    rect(c, x, y + h * 0.83, w, 2, '#e0dacc');
  };
  const WX = 138, WY_ = 42, WW = 96, WH = 124;
  rect(c, WX - 6, WY_ - 6, WW + 12, WH + 10, '#f2e6d2');
  viewWindow(c, WX, WY_, WW, WH, view, { frame: '#f6f0e4', sill: '#e8dcc6', bars: 4 });
  rect(c, WX - 8, WY_ + WH, WW + 16, 4, '#f2e8d6');
  rect(c, WX - 8, WY_ + WH + 4, WW + 16, 2, '#c8b494');
  // the sun on the sill and pots of herbs and a small fern on it
  for (const [px_, col] of [[WX + 6, '#c06a3a'], [WX + 30, '#d88a58'], [WX + 70, '#b8603a']]) {
    rect(c, px_, WY_ + WH - 8, 10, 8, col); rect(c, px_ - 1, WY_ + WH - 9, 12, 2, vShade(col, 0.2));
    crown(c, r, px_ + 5, WY_ + WH - 14, 8, 7, ['#2e5a26', '#4a7a32', '#6aa04a', '#a8d070'], { x: -0.8, y: -0.6 }, 18);
  }
  // trailing plants hanging down over the top of the window from the rail
  rect(c, WX - 14, WY_ - 12, WW + 28, 3, '#8a5a34');
  const vine = (x0, y0, len, sway_) => {
    let x = x0, y = y0;
    for (let k = 0; k < len; k++) {
      x += Math.sin(k * 0.5 + sway_) * 0.8; y += 1.6;
      px(c, x, y, '#4a6a2a');
      if (k % 3 === 0) { const s = k % 2 ? 1 : -1; ellipse(c, x + s * 3, y, 3, 2, r.pick(['#3e6e2a', '#5a8a3a', '#7aaa4a'])); px(c, x + s * 4, y - 1, '#a8d070'); }
    }
  };
  for (const [vx, vl, vs] of [[WX - 10, 44, 0], [WX + 4, 30, 1], [WX + 22, 18, 2], [WX + WW - 18, 26, 3], [WX + WW + 6, 50, 1.4], [WX + WW - 2, 36, 2.2]]) vine(vx, WY_ - 10, vl, vs);
  crown(c, r, WX + 6, WY_ - 12, 16, 7, ['#2e5a26', '#4a7a32', '#6aa04a', '#a8d070'], { x: -0.8, y: -0.6 }, 30);
  crown(c, r, WX + WW - 4, WY_ - 12, 18, 7, ['#2e5a26', '#4a7a32', '#6aa04a', '#a8d070'], { x: -0.8, y: -0.6 }, 30);
  // a macramé hanging between the window and the books
  rect(c, 242, 50, 14, 2, '#8a5a34');
  for (let k = 0; k < 5; k++) for (let y = 52; y < 96; y += 3) px(c, 243 + k * 3 + (((y / 3) + k) % 2), y, '#f0e4cc');
  for (let y = 58; y < 96; y += 9) poly(c, [[243, y], [249, y + 4], [255, y], [249, y + 6]], '#e8d8b8');
  for (let k = 0; k < 7; k++) line(c, 243 + k * 2, 96, 243 + k * 2, 108 + (k % 3) * 2, '#e8dcc4', 1);
  // the wall of books on the right of the back wall, in dark oak, with its odds and ends
  const bx0 = 262, bx1 = 378, by0 = 40;
  rect(c, bx0 - 4, by0 - 6, bx1 - bx0 + 8, o.by1 - by0 + 6, '#7a4a28');
  rect(c, bx0 - 4, by0 - 6, 3, o.by1 - by0 + 6, '#9a6438');
  for (let sy = by0; sy < o.by1 - 20; sy += 27) {
    rect(c, bx0, sy, bx1 - bx0, 24, '#4a2c18');
    rect(c, bx0, sy + 24, bx1 - bx0, 3, '#9a6438');
    let x = bx0 + 1;
    while (x < bx1 - 4) {
      if (r() < 0.12) {
        const kind = r.i(0, 5) % 4 === 3 && r() < 0.4 ? 3 : r.i(0, 2);
        if (kind === 0) { rect(c, x + 2, sy + 10, 9, 14, '#e8dcc0'); rect(c, x + 3, sy + 11, 7, 12, r.pick(['#6a8aa0', '#a87a5a', '#7a9a6a'])); x += 13; }
        else if (kind === 1) { ellipse(c, x + 5, sy + 18, 4, 6, r.pick(['#d8e4e8', '#c06a3a', '#e8d0a0'])); crown(c, r, x + 5, sy + 10, 6, 5, ['#2e5a26', '#4a7a32', '#6aa04a', '#a8d070'], { x: -0.8, y: -0.6 }, 12); x += 11; }
        else if (kind === 2) { for (let k = 0; k < 4; k++) rect(c, x + 1, sy + 20 - k * 3, 12, 3, r.pick(['#8a3a2a', '#2e4a6b', '#c8a060', '#5b6b2e'])); x += 14; }
        else { circle(c, x + 5, sy + 17, 5, '#c8a050'); circle(c, x + 5, sy + 17, 3.6, '#f4ecd6'); line(c, x + 5, sy + 17, x + 5, sy + 14, '#3a2a1e', 1); x += 11; }
        continue;
      }
      const bw = r.i(2, 5), bh = r.i(15, 23);
      rect(c, x, sy + 24 - bh, bw, bh, r.pick(['#7a2e2e', '#2e4a6b', '#5b6b2e', '#8a6b2e', '#4a2e5b', '#a0785a', '#2e5b52', '#c8a060', '#b84a3a', '#e8d8b8']));
      rect(c, x, sy + 26 - bh, bw, 1, 'rgba(255,230,170,0.45)');
      x += bw + (r() < 0.1 ? 1 : 0);
    }
  }
  // a trailing plant spilling from the top of the shelves
  crown(c, r, 300, by0 - 8, 14, 6, ['#2e5a26', '#4a7a32', '#6aa04a', '#a8d070'], { x: -0.8, y: -0.6 }, 22);
  for (const [vx, vl, vs] of [[292, 30, 0.5], [306, 44, 1.7], [318, 22, 2.9]]) vine(vx, by0 - 6, vl, vs);
  // her day-bed below the books: a round mattress heaped with knitted throws and cushions
  const DB = { x: 312, y: 214 };
  ellipse(c, DB.x, DB.y + 12, 96, 16, 'rgba(90,50,24,0.35)');
  ellipse(c, DB.x, DB.y + 4, 92, 20, '#c89a60');
  ellipse(c, DB.x, DB.y, 90, 18, '#e0bc84');
  const knit = (cx, cy, rx, ry, base, alt) => {
    ellipse(c, cx, cy, rx, ry, base);
    c.save(); c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, TAU); c.clip();
    for (let y = cy - ry; y < cy + ry; y += 2) for (let x = cx - rx + ((y / 2) % 2); x < cx + rx; x += 3) px(c, x, y, alt);
    c.restore();
  };
  knit(DB.x + 10, DB.y - 2, 70, 13, '#f2e8d4', '#dcceb2');
  poly(c, [[DB.x - 40, DB.y + 6], [DB.x + 70, DB.y + 2], [DB.x + 76, DB.y + 18], [DB.x - 30, DB.y + 22]], '#ece0c8');
  for (let x = DB.x - 36; x < DB.x + 72; x += 4) { px(c, x, DB.y + 20 - (x - DB.x + 36) * 0.02, '#d8c8a8'); px(c, x + 1, DB.y + 21, '#f6eee0'); }
  knit(DB.x - 50, DB.y - 18, 20, 16, '#f4ecdc', '#ded2ba');
  knit(DB.x - 20, DB.y - 22, 20, 17, '#b8622e', '#d8864a');
  for (let k = -14; k < 14; k += 4) { px(c, DB.x - 20 + k, DB.y - 22, '#f0c890'); px(c, DB.x - 20 + k + 1, DB.y - 18, '#7a3a1a'); }
  knit(DB.x + 14, DB.y - 20, 22, 16, '#efe4cc', '#d8cab0');
  knit(DB.x + 44, DB.y - 14, 16, 12, '#c8a070', '#e0bc8a');
  // a stool with her tea, and the basket of silk skeins she embroiders with
  ellipse(c, 214, 212, 14, 4, '#7a4a28'); rect(c, 212, 212, 4, 20, '#5a341c');
  rect(c, 206, 206, 7, 6, '#f4ece0'); rect(c, 213, 207, 2, 3, '#f4ece0'); ellipse(c, 222, 209, 5, 2, '#f4ece0');
  ellipse(c, 400, 238, 20, 7, '#9a6a3a'); rect(c, 380, 226, 40, 12, '#b07a44');
  for (let k = 0; k < 9; k++) ellipse(c, 386 + k * 4, 226 - (k % 2) * 2, 3, 2.5, r.pick(['#d8304a', '#f0c040', '#3a7ad0', '#f4ecf0', '#8a4ac0', '#40a870', '#f08a3a']));
  for (let y = 229; y < 238; y += 2) line(c, 380, y, 420, y, '#8a5a30', 1);
  // the rug: a woven kilim in madder red, indigo and ochre
  const rug = [[26, 268], [96, 214], [290, 214], [340, 268]];
  poly(c, rug, '#9a3a2e');
  poly(c, [[40, 264], [102, 218], [286, 218], [328, 264]], '#2e3e6a');
  poly(c, [[60, 258], [110, 222], [278, 222], [314, 258]], '#b84a36');
  c.save(); c.beginPath(); c.moveTo(60, 258); c.lineTo(110, 222); c.lineTo(278, 222); c.lineTo(314, 258); c.closePath(); c.clip();
  for (let y = 226; y < 260; y += 8) for (let x = 60; x < 320; x += 16) { const k = (x + y) % 32 < 16; poly(c, [[x, y + 4], [x + 6, y], [x + 12, y + 4], [x + 6, y + 8]], k ? '#e0b060' : '#2e3e6a'); px(c, x + 6, y + 4, '#f4ecd8'); }
  c.restore();
  for (let x = 28; x < 340; x += 5) { line(c, x, 268, x - 1, 270, '#e8d8b8', 1); }
  // a big leafy plant in a terracotta pot in the near corner, and a smaller one by the window
  const pot = (x, yb, w, hh, col) => { poly(c, [[x - w / 2, yb - hh], [x + w / 2, yb - hh], [x + w * 0.38, yb], [x - w * 0.38, yb]], col); rect(c, x - w / 2 - 1, yb - hh - 3, w + 2, 4, vShade(col, 0.15)); poly(c, [[x - w / 2, yb - hh], [x - w * 0.2, yb - hh], [x - w * 0.12, yb], [x - w * 0.38, yb]], vShade(col, 0.12)); };
  const bigLeaf = (x, y, ang, len, col) => {
    const dx = Math.cos(ang), dy = Math.sin(ang);
    line(c, x, y, x + dx * len, y + dy * len, '#4a6a2a', 1);
    ellipse(c, x + dx * len, y + dy * len, len * 0.42, len * 0.22, col, ang);
    ellipse(c, x + dx * len - dy, y + dy * len + dx - 1, len * 0.18, len * 0.08, vShade(col, 0.25), ang);
  };
  pot(56, 262, 40, 30, '#b8603a');
  for (let k = 0; k < 22; k++) bigLeaf(56 + r.r(-6, 6), 232, -Math.PI / 2 + r.r(-1.2, 1.2), r.r(22, 44), r.pick(['#2e5a26', '#3e6e2a', '#4a7a32', '#5a8a3a']));
  pot(112, 188, 22, 18, '#c8784a');
  for (let k = 0; k < 12; k++) bigLeaf(112, 170, -Math.PI / 2 + r.r(-1.1, 1.1), r.r(10, 22), r.pick(['#3e6e2a', '#5a8a3a', '#6a9a3e']));
  // the sun: shafts from the window across the floor and onto the day-bed, a warm patch on the rug
  shaft(c, [[WX, WY_ + 10], [WX + WW, WY_], [360, 250], [150, 270]], 'rgba(255,226,160,1)', 0.16);
  poly(c, [[150, 214], [230, 212], [300, 250], [190, 256]], 'rgba(255,214,140,0.22)');
  glow(c, WX + WW / 2, WY_ + WH / 2, 110, 'rgba(255,236,190,0.35)');
  return { colors: 110, vignette: [0.3, '60,34,14'] };
};

// ---------------------------------------------------------------- Hélène's room in winter
SCENES.helene_sickroom = (c, L) => {
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
  const cl = L('curtainL', { depth: 0.5, anim: sway(1.4, 6, { oy: 0 }) });
  poly(cl, [[142, 52], [156, 52], [152, 164], [140, 168]], '#b8a8b4'); line(cl, 147, 54, 146, 164, '#a090a0', 1);
  const cr = L('curtainR', { depth: 0.5, anim: sway(1.2, 7, { oy: 0 }) });
  poly(cr, [[248, 52], [234, 52], [238, 164], [250, 168]], '#b8a8b4'); line(cr, 243, 54, 244, 164, '#a090a0', 1);
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
  return { colors: 60, vignette: [0.5, '20,20,40'] };
};

// ---------------------------------------------------------------- Madame Blanche's salon, lamplit, at night
SCENES.blanche_salon = (c, L) => {
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
  const dr = L('drape', { depth: 0.5, anim: sway(1, 7, { oy: 0 }) });
  poly(dr, [win[0], [win[0][0] + 12, win[0][1] + 4], [win[3][0] + 14, win[3][1] + 10], win[3]], '#3a1a3a');
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
  const palm = L('palm', { depth: 0.55, anim: sway(2.5, 5) });
  for (let k = 0; k < 9; k++) { const tx = 439 + r.r(-26, 26), ty = 230 - r.r(20, 44); branch(palm, 439, 230, tx, ty, 2, '#2e5a3a'); branch(palm, 439, 230, tx + 1, ty + 1, 1, '#4a8a5a'); }
  rect(c, 430, 230, 18, 22, '#6a3a2a');
  shade(c, 111, 150, 170, 'rgba(255,150,80,0.16)');
  return { colors: 64, vignette: [0.55, '20,4,6'] };
};

// ---------------------------------------------------------------- Hara Kei's house: the moonlit room where tea is served
SCENES.estate_tearoom = (c, L) => {
  const r = rng(161);
  // the view: night garden, roofs and a pagoda, the moon
  vgrad(c, 0, 0, W, 200, [[0, '#0a1a44'], [0.55, '#1e3a80'], [1, '#3a5aa0']]);
  stars(c, r, 60, 0, 0, W, 90);
  moon(c, 330, 44, 22, { seed: 5, lit: '#eef4ff', mare: '#b4c2e2' });
  hill(c, r, 60, 440, 132, 26, '#2a4480');
  for (const [x, yb, w, hh, rh] of [[96, 162, 70, 18, 16], [180, 150, 50, 14, 12], [300, 150, 60, 16, 14], [352, 164, 44, 14, 12]]) {
    jpHouse(c, r, x, yb, w, hh, { roof: '#18264e', roofLight: '#5a78b8', plaster: '#3a5088', wood: '#101a38', roofH: rh, windows: [[w * 0.4, 4, 6, 6, x === 300]] });
  }
  rect(c, 236, 70, 8, 84, '#142042');
  for (let k = 0; k < 5; k++) { const y = 76 + k * 16, w = 30 - k * 4; poly(c, [[240 - w / 2 - 4, y], [240 + w / 2 + 4, y], [240 + w / 2, y - 5], [240 - w / 2, y - 5]], '#101a3a'); line(c, 240 - w / 2 - 4, y, 240 + w / 2 + 4, y, '#4a64a8', 1); }
  vgrad(c, 0, 160, W, 40, [[0, '#1a2a5a'], [1, '#101a3a']]);
  for (let i = 0; i < 30; i++) crown(c, r, 80 + r() * 320, 170 + r() * 20, r.r(6, 12), r.r(4, 8), ['#0e1a3a', '#1a2e60', '#3a5a9a'], { x: 0.3, y: -1 }, 8);
  c.fillStyle = '#6a8ad0'; c.beginPath(); c.moveTo(150, 190); c.bezierCurveTo(220, 180, 250, 186, 330, 178); c.lineTo(330, 182); c.bezierCurveTo(250, 190, 220, 186, 150, 194); c.fill();
  for (let i = 0; i < 20; i++) px(c, 160 + r() * 170, 180 + r() * 10, '#e8f0ff');
  rect(c, 356, 118, 6, 12, '#ffd88a'); rect(c, 355, 116, 8, 2, '#1a2440'); rect(c, 358, 130, 2, 20, '#1a2440'); glow(c, 359, 124, 14, 'rgba(255,200,120,0.6)');
  // the cherry trees outside, swaying and dropping petals
  const bl = L('blossoms', { depth: 0.3, anim: sway(1, 6, { ox: 0, oy: 0 }) });
  branch(bl, -10, 30, 150, 60, 7, '#1a1426'); branch(bl, 60, 44, 200, 10, 4, '#1a1426'); branch(bl, 120, 55, 240, 90, 3, '#1a1426'); branch(bl, 30, 38, 90, 130, 3, '#1a1426');
  const pink = ['#7a3a6a', '#c8709a', '#f0a8c8', '#ffe0ee'];
  for (let i = 0; i < 70; i++) { const t = r(); crown(bl, r, -10 + t * 250 + r.r(-18, 18), 30 + t * 40 + r.r(-26, 22), r.r(6, 13), r.r(5, 9), pink, { x: 0.4, y: -0.8 }, 9); }
  const bl2 = L('blossoms2', { depth: 0.3, anim: sway(1.6, 5) });
  trunk(bl2, 390, 170, 70, 5, 3, '#1a1426');
  for (let k = 0; k < 5; k++) branch(bl2, 390, 120, 390 + r.r(-30, 30), 90 + r.r(-20, 10), 2, '#1a1426');
  for (let i = 0; i < 16; i++) crown(bl2, r, 390 + r.r(-30, 30), 96 + r.r(-22, 20), r.r(6, 11), r.r(5, 8), pink, { x: -0.4, y: -0.8 }, 8);
  // the room around the window, dark wood and paper screens
  const rm = L('room', { depth: 0.5 });
  rect(rm, 0, 0, W, H, '#10182e');
  for (let x = 6; x < 64; x += 16) { rect(rm, x, 0, 12, 200, '#1e2c50'); for (let y = 10; y < 200; y += 22) rect(rm, x, y, 12, 1, '#10182e'); }
  for (let x = 408; x < W; x += 16) { rect(rm, x, 0, 12, 200, '#2a3c6a'); for (let y = 10; y < 200; y += 22) rect(rm, x, y, 12, 1, '#16223e'); }
  rm.clearRect(72, 0, 200, 190);
  rm.clearRect(292, 0, 108, 176);
  rect(rm, 66, 0, 8, 196, '#0a0f20'); rect(rm, 270, 0, 22, 196, '#0a0f20'); rect(rm, 398, 0, 8, 196, '#0a0f20'); rect(rm, 272, 0, 2, 196, '#3a4a78');
  rect(rm, 292, 174, 108, 10, '#0a0f20'); rect(rm, 66, 188, 340, 8, '#0a0f20'); rect(rm, 66, 188, 340, 1, '#4a5a90');
  // the low table: tea, a teapot, an open book, fallen petals
  vgrad(rm, 0, 196, W, 74, [[0, '#1e2a4a'], [1, '#0c1226']]);
  for (let k = 0; k < 9; k++) line(rm, 0, 200 + k * k * 1.1, W, 202 + k * k * 1.2, '#16203a', 1);
  shaft(rm, [[72, 190], [272, 190], [360, 270], [120, 270]], 'rgba(150,180,255,1)', 0.14);
  ellipse(rm, 236, 244, 32, 8, '#3a4a78'); ellipse(rm, 236, 243, 28, 6.5, '#52649a');
  rect(rm, 220, 216, 32, 26, '#46588c'); ellipse(rm, 236, 242, 16, 4, '#46588c'); ellipse(rm, 236, 216, 16, 4, '#6a80bc'); ellipse(rm, 236, 216, 13, 3, '#1c2644');
  rect(rm, 220, 216, 4, 26, '#6a80bc'); line(rm, 252, 222, 258, 230, '#46588c', 2);
  ellipse(rm, 312, 218, 26, 18, '#232a44'); ellipse(rm, 306, 212, 14, 10, '#34406a'); ellipse(rm, 312, 206, 18, 5, '#3a4670'); rect(rm, 306, 196, 12, 6, '#232a44'); circle(rm, 312, 195, 3, '#5a6aa0');
  for (let k = 0; k < 70; k++) px(rm, 290 + r() * 44, 204 + r() * 28, r() < 0.5 ? '#46527e' : '#161c30');
  rm.strokeStyle = '#8a9ad0'; rm.lineWidth = 1; rm.beginPath(); rm.arc(312, 218, 25, Math.PI * 1.05, Math.PI * 1.45); rm.stroke();
  line(rm, 336, 214, 350, 204, '#1a2034', 3); rm.strokeStyle = '#1a2034'; rm.lineWidth = 2; rm.beginPath(); rm.arc(312, 192, 20, Math.PI * 1.1, Math.PI * 1.9); rm.stroke();
  ellipse(rm, 312, 234, 30, 4, 'rgba(0,0,0,0.3)');
  poly(rm, [[350, 262], [390, 236], [470, 238], [440, 266]], '#9aaad0'); poly(rm, [[390, 236], [410, 232], [474, 234], [470, 238]], '#c8d4ee');
  line(rm, 392, 237, 440, 266, '#6a7aa8', 1);
  for (let k = 0; k < 7; k++) { line(rm, 360 + k * 3, 258 - k * 3, 392 + k * 3, 240 - k * 3, '#5a6a98', 1); line(rm, 412 + k * 4, 242 + k * 1.5, 452 + k * 3, 242 + k * 3, '#5a6a98', 1); }
  for (let i = 0; i < 14; i++) { const x = r() * W, y = 206 + r() * 60; ellipse(rm, x, y, 2.5, 1.5, r.pick(['#f4b0cc', '#e890b8'])); }
  return { colors: 64, vignette: [0.5, '0,6,30'] };
};

// ---------------------------------------------------------------- Hara Kei's house: the empty tatami room, the lake and the bamboo
SCENES.estate_room = (c, L) => {
  const r = rng(171);
  // the view through the open screens: a moonlit lake on the left, bamboo in the mist
  vgrad(c, 0, 0, W, 200, [[0, '#0c1c48'], [1, '#2a4a8a']]);
  stars(c, r, 30, 80, 20, 60, 60);
  moon(c, 104, 66, 11, { seed: 3 });
  hill(c, r, 70, 150, 150, 16, '#1a2c5a');
  vgrad(c, 80, 150, 60, 36, [[0, '#2a4a8a'], [1, '#12234e']]);
  for (let i = 0; i < 14; i++) rect(c, 96 + r.r(-6, 6), 152 + i * 2.2, r.r(3, 8), 1, '#dce8ff');
  vgrad(c, 130, 0, 350, 200, [[0, '#9ab86a'], [0.6, '#c8d890'], [1, '#6a8a4a']]);
  for (let i = 0; i < 40; i++) { const x = 130 + r() * 350; rect(c, x, 0, r.r(2, 4), 200, r.pick(['#b0c878', '#c8d890', '#a0b868'])); }
  for (let i = 0; i < 30; i++) crown(c, r, 140 + r() * 330, 150 + r() * 40, r.r(10, 18), r.r(6, 10), ['#4a6a2e', '#6a8a3e', '#9ab85a'], { x: 0, y: -1 }, 10);
  const bb = L('bamboo', { depth: 0.25, anim: sway(1.3, 5.5) });
  for (let i = 0; i < 18; i++) {
    const x = 132 + r() * 340, w = r.r(3, 5);
    rect(bb, x, 0, w, 196, '#3e6a2a'); rect(bb, x + w - 1, 0, 1, 196, '#8ab050');
    for (let y = r() * 30; y < 196; y += r.r(22, 30)) rect(bb, x - 1, y, w + 2, 1, '#2a4a1e');
    for (let k = 0; k < 4; k++) { const y = r() * 150; line(bb, x, y, x + r.r(-16, 16), y + r.r(4, 10), '#4a7a2e', 1); }
  }
  // the room: warm paper screens, dark posts, a tatami floor catching the light
  const rm = L('room', { depth: 0.5 });
  rect(rm, 0, 0, W, H, '#8a5a34');
  rect(rm, 0, 0, W, 30, '#5a3a22');
  for (let x = 0; x < W; x += 30) { rect(rm, x, 0, 2, 30, '#3a2414'); }
  rect(rm, 0, 30, W, 10, '#6a4428');
  const shoji = (x0, x1, y0, y1) => {
    vgrad(rm, x0, y0, x1 - x0, y1 - y0, [[0, '#f6d8a0'], [1, '#e8b870']]);
    for (let x = x0; x <= x1; x += 13) rect(rm, x, y0, 2, y1 - y0, '#6a4428');
    for (let y = y0; y <= y1; y += 18) rect(rm, x0, y, x1 - x0, 2, '#6a4428');
    shade(rm, (x0 + x1) / 2, y1, (x1 - x0), 'rgba(80,40,10,0.25)');
  };
  shoji(0, 76, 44, 186); shoji(204, 264, 58, 176); shoji(276, 330, 58, 176); shoji(434, W, 44, 186);
  rm.clearRect(80, 42, 124, 144);
  rm.clearRect(334, 44, 96, 142);
  for (const x of [76, 200, 266, 330, 430]) { rect(rm, x, 30, 6, 160, '#3a2414'); rect(rm, x, 30, 2, 160, '#a87a4a'); }
  rect(rm, 80, 184, 124, 4, '#3a2414'); rect(rm, 334, 184, 96, 4, '#3a2414');
  // tatami, in perspective, with a patch of light
  poly(rm, [[0, 190], [W, 190], [W, H], [0, H]], '#b89a5a');
  const fl = (x0, y0, x1, y1) => line(rm, x0, y0, x1, y1, '#6a4a28', 2);
  fl(0, 214, W, 206); fl(0, 244, W, 236); fl(120, 190, 40, H); fl(270, 190, 290, H); fl(400, 190, 470, H); fl(200, 214, 180, 244);
  texture(rm, r, 0, 190, W, 80, 0.05, 3);
  poly(rm, [[120, 200], [300, 200], [340, 236], [140, 236]], 'rgba(255,230,160,0.45)');
  vgrad(rm, 0, 186, W, 12, [[0, 'rgba(60,30,10,0.4)'], [1, 'rgba(60,30,10,0)']]);
  return { colors: 64, vignette: [0.4, '30,14,0'] };
};
