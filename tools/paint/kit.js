/*
 * kit.js — a small toolkit for painting the game's pixel-art backgrounds in code.
 * Scenes are painted on a 480×270 canvas with soft shapes and gradients, then
 * reduced to a limited palette with ordered dithering (which is what makes them
 * read as pixel art), and finally enlarged 4× without smoothing to 1920×1080.
 *
 * Runs in a browser page; tools/paint-backgrounds.js drives it with Playwright.
 */
/* eslint-disable no-unused-vars */
const W = 480;
const H = 270;
const TAU = Math.PI * 2;

function rng(seed) {
  let s = seed >>> 0;
  const f = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  f.r = (a, b) => a + f() * (b - a);
  f.i = (a, b) => Math.floor(a + f() * (b - a + 1));
  f.pick = (list) => list[Math.floor(f() * list.length)];
  return f;
}

function newCanvas(w = W, h = H) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// ---------------------------------------------------------------- basic shapes
function vgrad(c, x, y, w, h, stops) {
  const g = c.createLinearGradient(0, y, 0, y + h);
  for (const [p, col] of stops) g.addColorStop(p, col);
  c.fillStyle = g;
  c.fillRect(x, y, w, h);
}
function hgrad(c, x, y, w, h, stops) {
  const g = c.createLinearGradient(x, 0, x + w, 0);
  for (const [p, col] of stops) g.addColorStop(p, col);
  c.fillStyle = g;
  c.fillRect(x, y, w, h);
}
function rect(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function px(c, x, y, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), 1, 1); }
function circle(c, x, y, r, col) { c.fillStyle = col; c.beginPath(); c.arc(x, y, Math.max(0.5, r), 0, TAU); c.fill(); }
function ellipse(c, x, y, rx, ry, col, rot = 0) { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), rot, 0, TAU); c.fill(); }
function poly(c, pts, col) {
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  c.closePath();
  c.fill();
}
function line(c, x0, y0, x1, y1, col, w = 1) {
  c.strokeStyle = col;
  c.lineWidth = w;
  c.beginPath();
  c.moveTo(x0, y0);
  c.lineTo(x1, y1);
  c.stroke();
}

/** Soft light: a radial gradient added on top ("screen" keeps colours rich). */
function glow(c, x, y, r, col, a = 1, mode = 'screen') {
  c.save();
  c.globalCompositeOperation = mode;
  c.globalAlpha = a;
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
  c.restore();
}

/** Darken (or tint) with a radial gradient: shadows, vignettes. */
function shade(c, x, y, r, col, a = 1) {
  c.save();
  c.globalAlpha = a;
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
  c.restore();
}

function vignette(c, a = 0.5, col = '0,0,0') {
  const g = c.createRadialGradient(W / 2, H * 0.45, H * 0.35, W / 2, H * 0.45, W * 0.7);
  g.addColorStop(0, `rgba(${col},0)`);
  g.addColorStop(1, `rgba(${col},${a})`);
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
}

/** A beam of light between two edges, fading along its length. */
function shaft(c, pts, col, a = 0.25) {
  c.save();
  c.globalCompositeOperation = 'screen';
  c.globalAlpha = a;
  const [p0, p1, p2, p3] = pts;
  const g = c.createLinearGradient((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p2[0] + p3[0]) / 2, (p2[1] + p3[1]) / 2);
  g.addColorStop(0, col);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  poly(c, pts, g);
  c.restore();
}

function speckle(c, r, x, y, w, h, cols, n) {
  for (let i = 0; i < n; i++) px(c, x + r() * w, y + r() * h, r.pick(cols));
}

// ---------------------------------------------------------------- sky
function stars(c, r, n, x = 0, y = 0, w = W, h = H * 0.5, col = '#eef2ff') {
  for (let i = 0; i < n; i++) {
    c.globalAlpha = r.r(0.25, 1);
    px(c, x + r() * w, y + Math.pow(r(), 1.4) * h, col);
  }
  c.globalAlpha = 1;
}

function moon(c, x, y, rad, o = {}) {
  glow(c, x, y, rad * 6, o.halo || 'rgba(170,200,255,0.35)', 1);
  glow(c, x, y, rad * 2.2, o.halo2 || 'rgba(210,225,255,0.45)', 1);
  circle(c, x, y, rad, o.lit || '#eef2ff');
  const r = rng(o.seed || 7);
  // soft grey seas, off-centre like the real moon's, never a face
  for (let i = 0; i < 16; i++) {
    const a = r.r(-0.4, 2.6), d = r.r(0.15, 0.7) * rad;
    circle(c, x + Math.cos(a) * d * 0.9, y - Math.sin(a) * d * 0.6 - rad * 0.1, rad * r.r(0.08, 0.2), o.mare || '#b6c2de');
  }
  circle(c, x - rad * 0.25, y - rad * 0.25, rad * 0.35, 'rgba(255,255,255,0.35)');
}

function sun(c, x, y, rad, col = '#fff1c2', halo = 'rgba(255,200,120,0.55)') {
  glow(c, x, y, rad * 9, halo, 1);
  glow(c, x, y, rad * 3, 'rgba(255,230,170,0.6)', 1);
  circle(c, x, y, rad, col);
}

/** Soft cloud bank: many overlapping ellipses, lit from one side. */
function cloud(c, r, x, y, w, h, dark, lit, light = { x: 0, y: -1 }) {
  for (let i = 0; i < 16; i++) {
    const cx = x + r() * w, cy = y + h * 0.5 + r.r(-0.3, 0.3) * h;
    ellipse(c, cx, cy, r.r(0.12, 0.26) * w, r.r(0.3, 0.55) * h, dark);
  }
  for (let i = 0; i < 12; i++) {
    const cx = x + r() * w, cy = y + h * 0.5 + r.r(-0.35, 0.1) * h;
    ellipse(c, cx + light.x * 2, cy + light.y * 2, r.r(0.08, 0.18) * w, r.r(0.2, 0.4) * h, lit);
  }
}

// ---------------------------------------------------------------- land
/** A ridge line (mountains, hills, tree lines) filled down to the bottom. */
function ridge(c, r, y0, amp, col, o = {}) {
  const freqs = o.freqs || [0.006, 0.017, 0.043, 0.11];
  const amps = o.amps || [1, 0.5, 0.22, 0.08];
  const ph = freqs.map(() => r() * TAU);
  const x0 = o.x0 || 0, x1 = o.x1 == null ? W : o.x1;
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(x0, o.bottom || H);
  const tot = amps.reduce((a, b) => a + b, 0);
  for (let x = x0; x <= x1; x += 1) {
    let v = 0;
    for (let k = 0; k < freqs.length; k++) v += amps[k] * Math.sin(x * freqs[k] + ph[k]);
    const peak = o.peak ? Math.exp(-Math.pow((x - o.peak[0]) / o.peak[1], 2)) * o.peak[2] : 0;
    c.lineTo(x, y0 - amp * (0.5 + 0.5 * v / tot) - peak);
  }
  c.lineTo(x1, o.bottom || H);
  c.closePath();
  c.fill();
}

/** Rows of small rounded tree tops, like a distant wood. */
function treeLine(c, r, y0, x0, x1, size, cols) {
  for (let x = x0; x < x1; x += size * r.r(0.5, 0.9)) {
    const s = size * r.r(0.7, 1.3);
    ellipse(c, x, y0 - s * 0.6, s * 0.7, s, cols[0]);
    ellipse(c, x - s * 0.2, y0 - s * 0.9, s * 0.35, s * 0.5, cols[1] || cols[0]);
  }
}

// ---------------------------------------------------------------- trees
/** A leafy crown built from clusters: dark underneath, lit on the light side. */
function crown(c, r, x, y, rx, ry, pal, light = { x: -0.6, y: -0.8 }, n = 38) {
  const [dark, mid, lit, hi] = pal;
  for (let i = 0; i < n; i++) {
    const a = r() * TAU, d = Math.sqrt(r());
    const cx = x + Math.cos(a) * rx * d * 0.85, cy = y + Math.sin(a) * ry * d * 0.85;
    ellipse(c, cx, cy, rx * r.r(0.22, 0.4), ry * r.r(0.22, 0.4), dark);
  }
  for (let i = 0; i < n * 0.8; i++) {
    const a = r() * TAU, d = Math.sqrt(r());
    const cx = x + Math.cos(a) * rx * d * 0.75 + light.x * rx * 0.18, cy = y + Math.sin(a) * ry * d * 0.75 + light.y * ry * 0.18;
    ellipse(c, cx, cy, rx * r.r(0.15, 0.3), ry * r.r(0.15, 0.3), mid);
  }
  for (let i = 0; i < n * 0.55; i++) {
    const a = r() * TAU, d = Math.sqrt(r());
    const cx = x + Math.cos(a) * rx * d * 0.6 + light.x * rx * 0.38, cy = y + Math.sin(a) * ry * d * 0.6 + light.y * ry * 0.38;
    ellipse(c, cx, cy, rx * r.r(0.08, 0.18), ry * r.r(0.08, 0.18), lit);
  }
  if (hi) for (let i = 0; i < n * 0.6; i++) {
    const a = r() * TAU, d = Math.sqrt(r());
    px(c, x + Math.cos(a) * rx * d * 0.7 + light.x * rx * 0.45, y + Math.sin(a) * ry * d * 0.7 + light.y * ry * 0.45, hi);
  }
}

function trunk(c, x, yb, h, w0, w1, col, dark) {
  poly(c, [[x - w0 / 2, yb], [x + w0 / 2, yb], [x + w1 / 2, yb - h], [x - w1 / 2, yb - h]], col);
  if (dark) poly(c, [[x + w0 * 0.1, yb], [x + w0 / 2, yb], [x + w1 / 2, yb - h], [x + w1 * 0.1, yb - h]], dark);
}

function branch(c, x0, y0, x1, y1, w, col) {
  c.strokeStyle = col;
  c.lineCap = 'round';
  c.lineWidth = w;
  c.beginPath();
  c.moveTo(x0, y0);
  c.quadraticCurveTo((x0 + x1) / 2 + (y1 - y0) * 0.15, (y0 + y1) / 2, x1, y1);
  c.stroke();
}

function tree(c, r, x, yb, h, pal, o = {}) {
  const tw = o.trunkW || h * 0.09;
  trunk(c, x, yb, h * 0.55, tw, tw * 0.55, pal.trunk, pal.trunkDark);
  crown(c, r, x + (o.lean || 0), yb - h * 0.62, h * (o.wide || 0.42), h * 0.36, pal.leaves, o.light, o.n);
}

function poplar(c, r, x, yb, h, pal, light = -1) {
  trunk(c, x, yb, h * 0.2, h * 0.05, h * 0.04, pal.trunk);
  const w = h * 0.13;
  for (let i = 0; i < 26; i++) {
    const t = r();
    const yy = yb - h * 0.12 - t * h * 0.86;
    const ww = w * Math.sin(Math.PI * (0.15 + 0.85 * (1 - t))) * r.r(0.6, 1);
    ellipse(c, x + r.r(-0.3, 0.3) * w, yy, ww, h * 0.07, pal.leaves[0]);
  }
  for (let i = 0; i < 18; i++) {
    const t = r();
    const yy = yb - h * 0.15 - t * h * 0.8;
    ellipse(c, x + light * w * 0.35 + r.r(-0.2, 0.2) * w, yy, w * 0.4 * r.r(0.5, 1), h * 0.05, pal.leaves[1]);
  }
  for (let i = 0; i < 10; i++) {
    const t = r();
    px(c, x + light * w * 0.55 + r.r(-0.2, 0.2) * w, yb - h * 0.2 - t * h * 0.75, pal.leaves[2]);
  }
}

function cypress(c, r, x, yb, h, cols) {
  const w = h * 0.11;
  poly(c, [[x, yb - h], [x + w * 0.6, yb - h * 0.75], [x + w, yb - h * 0.3], [x + w * 0.7, yb], [x - w * 0.7, yb], [x - w, yb - h * 0.3], [x - w * 0.6, yb - h * 0.75]], cols[0]);
  for (let i = 0; i < 14; i++) {
    const t = r();
    ellipse(c, x - w * 0.3 + r.r(-0.2, 0.2) * w, yb - h * (0.1 + 0.8 * t), w * 0.35 * (1 - t * 0.6), h * 0.04, cols[1]);
  }
}

/** Japanese pine: layered flat clouds of needles on a leaning trunk. */
function pine(c, r, x, yb, h, pal, lean = 1) {
  const pts = [[x, yb], [x + lean * h * 0.12, yb - h * 0.4], [x + lean * h * 0.05, yb - h * 0.7], [x + lean * h * 0.22, yb - h]];
  for (let i = 0; i < pts.length - 1; i++) branch(c, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], h * 0.05 * (1 - i * 0.25), pal.trunk);
  const pads = [[0.2, 0.42, 0.34], [0.05, 0.62, 0.3], [0.28, 0.8, 0.24], [0.12, 0.98, 0.2], [-0.12, 0.55, 0.22]];
  for (const [dx, dy, s] of pads) {
    const cx = x + lean * h * dx, cy = yb - h * dy;
    ellipse(c, cx, cy, h * s, h * s * 0.28, pal.leaves[0]);
    ellipse(c, cx - h * s * 0.15, cy - h * s * 0.1, h * s * 0.7, h * s * 0.16, pal.leaves[1]);
    for (let i = 0; i < 6; i++) px(c, cx + r.r(-0.6, 0.4) * h * s, cy - h * s * 0.15 + r.r(-0.05, 0.05) * h, pal.leaves[2]);
  }
}

// ---------------------------------------------------------------- buildings
/** A stone house of the south of France: pale walls, terracotta roof, shutters. */
function frHouse(c, r, x, yb, w, hw, o = {}) {
  const wall = o.wall || '#d9c7a4', wallD = o.wallDark || '#b9a37e', roof = o.roof || '#b2583a', roofD = o.roofDark || '#8a3f29';
  rect(c, x, yb - hw, w, hw, wall);
  for (let i = 0; i < w * hw * 0.06; i++) rect(c, x + r() * (w - 3), yb - hw + r() * (hw - 2), r.i(2, 4), 1, r() < 0.5 ? wallD : o.wallLight || '#e8dab9');
  if (o.side) rect(c, x + w - (o.side || 0), yb - hw, o.side, hw, wallD);
  const rh = o.roofH || w * 0.28;
  poly(c, [[x - 3, yb - hw], [x + w + 3, yb - hw], [x + w - w * 0.08, yb - hw - rh], [x + w * 0.08, yb - hw - rh]], roof);
  for (let yy = yb - hw - rh + 2; yy < yb - hw; yy += 3) line(c, x, yy + 0.5, x + w, yy + 0.5, roofD, 1);
  rect(c, x - 3, yb - hw, w + 6, 2, roofD);
  if (o.chimney) rect(c, x + w * o.chimney, yb - hw - rh - 7, 5, 9, wallD);
  for (const win of o.windows || []) window_(c, x + win[0], yb - hw + win[1], win[2] || 6, win[3] || 9, win[4] || {});
  if (o.door) {
    const [dx, dw, dh] = o.door;
    rect(c, x + dx, yb - dh, dw, dh, o.doorCol || '#5b3a26');
    rect(c, x + dx, yb - dh, dw, 1, '#3a2418');
  }
}

function window_(c, x, y, w, h, o = {}) {
  rect(c, x - 1, y - 1, w + 2, h + 2, o.frame || '#7d6a52');
  rect(c, x, y, w, h, o.glass || (o.lit ? '#ffcf72' : '#2e3446'));
  if (o.lit) { rect(c, x, y + h * 0.55, w, h * 0.45, '#f2a94e'); glow(c, x + w / 2, y + h / 2, w * 2.4, 'rgba(255,190,90,0.55)'); }
  rect(c, x + Math.floor(w / 2), y, 1, h, o.frame || '#7d6a52');
  rect(c, x, y + Math.floor(h / 2), w, 1, o.frame || '#7d6a52');
  if (o.shutters) { rect(c, x - 3, y - 1, 2, h + 2, o.shutters); rect(c, x + w + 1, y - 1, 2, h + 2, o.shutters); }
}

/** A Japanese house: dark timber, white plaster, a tiled roof with lifted eaves. */
function jpHouse(c, r, x, yb, w, hw, o = {}) {
  const wood = o.wood || '#3a2a22', plaster = o.plaster || '#d8d2c4', roof = o.roof || '#39424f', roofL = o.roofLight || '#5b6878';
  rect(c, x, yb - hw, w, hw, plaster);
  for (let i = 0; i <= w; i += Math.max(6, Math.round(w / 6))) rect(c, x + i - 1, yb - hw, 2, hw, wood);
  rect(c, x, yb - hw, w, 2, wood);
  rect(c, x, yb - 3, w, 3, wood);
  for (const win of o.windows || []) {
    rect(c, x + win[0], yb - hw + win[1], win[2], win[3], win[4] ? '#ffd58a' : '#c9c1ae');
    for (let k = 2; k < win[2]; k += 3) rect(c, x + win[0] + k, yb - hw + win[1], 1, win[3], wood);
    if (win[4]) glow(c, x + win[0] + win[2] / 2, yb - hw + win[1] + win[3] / 2, win[2] * 1.6, 'rgba(255,190,100,0.55)');
  }
  const rh = o.roofH || hw * 0.9, ov = o.over || w * 0.12;
  poly(c, [[x - ov - 3, yb - hw - 1], [x - ov, yb - hw - 4], [x + w * 0.2, yb - hw - rh], [x + w * 0.8, yb - hw - rh], [x + w + ov, yb - hw - 4], [x + w + ov + 3, yb - hw - 1]], roof);
  for (let k = 0; k < 4; k++) line(c, x - ov + k * 2, yb - hw - 3 - k * rh * 0.22, x + w + ov - k * 2, yb - hw - 3 - k * rh * 0.22, roofL, 1);
  rect(c, x + w * 0.18, yb - hw - rh - 1, w * 0.64, 2, roofL);
}

// ---------------------------------------------------------------- water & reflections
/** Mirror everything above `yLine` into the water below it, rippled and darkened. */
function reflect(c, yLine, y1, o = {}) {
  const src = c.getImageData(0, 0, W, H);
  const out = c.getImageData(0, 0, W, H);
  const r = rng(o.seed || 3);
  for (let y = yLine; y < y1; y++) {
    const d = y - yLine;
    const sy = Math.max(0, yLine - d - 1);
    const wob = Math.round(Math.sin(y * 0.9 + r() * 0.5) * (o.wave || 1.2) * (0.3 + d / (y1 - yLine)));
    for (let x = 0; x < W; x++) {
      if (o.x0 != null && (x < o.x0 || x > o.x1)) continue;
      const sx = Math.min(W - 1, Math.max(0, x + wob));
      const i = (y * W + x) * 4, j = (sy * W + sx) * 4;
      const k = o.dark == null ? 0.62 : o.dark;
      const tint = o.tint || [20, 34, 60];
      out.data[i] = src.data[j] * k + tint[0] * (1 - k);
      out.data[i + 1] = src.data[j + 1] * k + tint[1] * (1 - k);
      out.data[i + 2] = src.data[j + 2] * k + tint[2] * (1 - k);
    }
  }
  c.putImageData(out, 0, 0);
  // ripple lines
  for (let i = 0; i < (o.ripples || 60); i++) {
    const y = r.r(yLine + 2, y1);
    c.globalAlpha = r.r(0.15, 0.4);
    rect(c, r() * W, y, r.r(4, 14), 1, o.rippleCol || '#9fb6dd');
  }
  c.globalAlpha = 1;
}

// ---------------------------------------------------------------- finishing: palette + dithering
function medianCut(data, n) {
  const pts = [];
  for (let i = 0; i < data.length; i += 4 * 3) pts.push([data[i], data[i + 1], data[i + 2]]);
  let boxes = [pts];
  while (boxes.length < n) {
    let bi = -1, best = -1, ch = 0;
    boxes.forEach((b, k) => {
      if (b.length < 2) return;
      for (let cc = 0; cc < 3; cc++) {
        let lo = 255, hi = 0;
        for (const p of b) { if (p[cc] < lo) lo = p[cc]; if (p[cc] > hi) hi = p[cc]; }
        const range = (hi - lo) * (cc === 1 ? 1.2 : 1) * Math.sqrt(b.length);
        if (range > best) { best = range; bi = k; ch = cc; }
      }
    });
    if (bi < 0) break;
    const b = boxes[bi].sort((p, q) => p[ch] - q[ch]);
    const mid = b.length >> 1;
    boxes.splice(bi, 1, b.slice(0, mid), b.slice(mid));
  }
  return boxes.map((b) => {
    const s = [0, 0, 0];
    for (const p of b) { s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; }
    return s.map((v) => Math.round(v / b.length));
  });
}

const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
function pixelate(canvas, colors = 56, spread = 18) {
  const c = canvas.getContext('2d');
  const img = c.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  const pal = medianCut(d, colors);
  const cache = new Map();
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      const off = (BAYER[y & 3][x & 3] / 16 - 0.47) * spread;
      const R = Math.max(0, Math.min(255, d[i] + off)), G = Math.max(0, Math.min(255, d[i + 1] + off)), B = Math.max(0, Math.min(255, d[i + 2] + off));
      const key = ((R >> 2) << 12) | ((G >> 2) << 6) | (B >> 2);
      let best = cache.get(key);
      if (!best) {
        let bd = 1e9;
        for (const p of pal) {
          const dr = R - p[0], dg = G - p[1], db = B - p[2];
          const dd = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11 + Math.abs(dr - dg) * 0 ;
          if (dd < bd) { bd = dd; best = p; }
        }
        cache.set(key, best);
      }
      d[i] = best[0]; d[i + 1] = best[1]; d[i + 2] = best[2]; d[i + 3] = 255;
    }
  }
  c.putImageData(img, 0, 0);
  return canvas;
}

function enlarge(canvas, k = 4) {
  const out = newCanvas(canvas.width * k, canvas.height * k);
  const c = out.getContext('2d');
  c.imageSmoothingEnabled = false;
  c.drawImage(canvas, 0, 0, out.width, out.height);
  return out;
}

// ---------------------------------------------------------------- richer surfaces
/** Painterly variation: blotches of lighter and darker value over a region. */
function texture(c, r, x, y, w, h, amt = 0.06, cell = 3, clip = null) {
  c.save();
  if (clip) { c.beginPath(); clip(c); c.clip(); }
  for (let yy = y; yy < y + h; yy += cell) {
    for (let xx = x; xx < x + w; xx += cell) {
      const v = r() - 0.5;
      if (Math.abs(v) < 0.18) continue;
      c.globalAlpha = Math.abs(v) * amt * 2;
      c.fillStyle = v > 0 ? '#ffffff' : '#000000';
      c.fillRect(xx, yy, cell, cell);
    }
  }
  c.restore();
}

/** A band of cloud: a violet body, a warm lit rim on the side facing the light, a few bright tufts. */
function cloudBand(c, r, x, y, w, h, o = {}) {
  const body = o.body || '#5b4a7e', rim = o.rim || '#ffb77a', shadow = o.shadow || '#3b3160', hi = o.hi || '#ffe0a8';
  const dir = o.lightFromBelow === false ? -1 : 1;
  const blobs = [];
  for (let i = 0; i < w / 5; i++) {
    const t = i / (w / 5);
    const env = Math.sin(Math.PI * t);
    blobs.push([x + t * w + r.r(-3, 3), y + r.r(-0.25, 0.25) * h * env, (h * 0.35 + h * 0.65 * env) * r.r(0.55, 1), w * 0.06 + r.r(0, w * 0.05)]);
  }
  for (const [bx, by, bh, bw] of blobs) ellipse(c, bx, by + dir * 1.6, bw, bh * 0.55, rim);
  for (const [bx, by, bh, bw] of blobs) ellipse(c, bx, by, bw, bh * 0.5, body);
  for (const [bx, by, bh, bw] of blobs) if (r() < 0.6) ellipse(c, bx + r.r(-2, 2), by - dir * bh * 0.2, bw * 0.6, bh * 0.25, shadow);
  for (const [bx, by, bh, bw] of blobs) if (r() < 0.18) rect(c, bx - bw * 0.3, by + dir * bh * 0.3, bw * 0.6, 1, hi);
}

/** Puffy cumulus lit from one side. */
function cumulus(c, r, x, y, w, h, o = {}) {
  const dark = o.dark || '#6b6a95', mid = o.mid || '#a9a4c9', lit = o.lit || '#f3d6c4', lx = o.lx == null ? 1 : o.lx;
  const puffs = [];
  for (let i = 0; i < 9; i++) {
    const t = (i + 0.5) / 9;
    puffs.push([x + t * w, y + h * 0.65 - Math.sin(Math.PI * t) * h * r.r(0.3, 0.6), w * r.r(0.09, 0.15)]);
  }
  for (const [px_, py, pr] of puffs) circle(c, px_, py + pr * 0.25, pr, dark);
  rect(c, x + w * 0.05, y + h * 0.6, w * 0.9, h * 0.35, dark);
  for (const [px_, py, pr] of puffs) circle(c, px_ + lx * pr * 0.2, py - pr * 0.1, pr * 0.8, mid);
  for (const [px_, py, pr] of puffs) circle(c, px_ + lx * pr * 0.4, py - pr * 0.3, pr * 0.45, lit);
}

/** A ridge that fades into the ground at both ends instead of stopping in a wall. */
function hill(c, r, x0, x1, yb, hgt, col, o = {}) {
  const ph = [r() * TAU, r() * TAU, r() * TAU];
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(x0, yb + 1);
  for (let x = x0; x <= x1; x++) {
    const t = (x - x0) / (x1 - x0);
    const env = Math.pow(Math.sin(Math.PI * t), o.sharp || 0.8);
    const v = 0.65 + 0.2 * Math.sin(x * 0.03 + ph[0]) + 0.1 * Math.sin(x * 0.09 + ph[1]) + 0.05 * Math.sin(x * 0.27 + ph[2]);
    c.lineTo(x, yb - hgt * env * v);
  }
  c.lineTo(x1, yb + 1);
  c.closePath();
  c.fill();
}

/** Grass tufts: a few blades in two tones. */
function tufts(c, r, x, y, w, h, n, cols) {
  for (let i = 0; i < n; i++) {
    const tx = x + r() * w, ty = y + r() * h, hh = r.r(2, 5) * (0.5 + (ty - y) / Math.max(1, h));
    for (let k = -1; k <= 1; k++) line(c, tx + k, ty, tx + k * 2 + r.r(-1, 1), ty - hh * r.r(0.6, 1), cols[(k + 1) % cols.length], 1);
  }
}

/** Rocks with a lit top face and a dark flank. */
function rock(c, r, x, y, w, h, o = {}) {
  const dark = o.dark || '#2b2a3d', mid = o.mid || '#4a4763', lit = o.lit || '#8d86a8';
  poly(c, [[x, y + h], [x + w * 0.1, y + h * 0.3], [x + w * 0.4, y], [x + w * 0.75, y + h * 0.1], [x + w, y + h * 0.55], [x + w * 0.95, y + h]], dark);
  poly(c, [[x + w * 0.1, y + h * 0.35], [x + w * 0.4, y + h * 0.04], [x + w * 0.72, y + h * 0.14], [x + w * 0.6, y + h * 0.45], [x + w * 0.2, y + h * 0.55]], mid);
  poly(c, [[x + w * 0.2, y + h * 0.28], [x + w * 0.4, y + h * 0.08], [x + w * 0.6, y + h * 0.16], [x + w * 0.42, y + h * 0.26]], lit);
}

// ---------------------------------------------------------------- layered scenes
/*
 * A scene paints on several layers so parts of it can move: `c` is the first
 * layer (usually the sky); `L(id, opts)` starts another one on top and returns
 * its context. opts: { depth: 0..1 (parallax), anim: { type, ... } }.
 * Every layer shares one palette; transparent pixels stay transparent.
 */
function applyPalette(canvas, pal, spread, opaque) {
  const c = canvas.getContext('2d');
  const img = c.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  const cache = new Map();
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      if (!opaque && d[i + 3] < 128) { d[i + 3] = 0; continue; }
      const a = d[i + 3] / 255;
      const off = (BAYER[y & 3][x & 3] / 16 - 0.47) * spread;
      const R = Math.max(0, Math.min(255, d[i] / (opaque ? 1 : a) + off)), G = Math.max(0, Math.min(255, d[i + 1] / (opaque ? 1 : a) + off)), B = Math.max(0, Math.min(255, d[i + 2] / (opaque ? 1 : a) + off));
      const key = ((R >> 2) << 12) | ((G >> 2) << 6) | (B >> 2);
      let best = cache.get(key);
      if (!best) {
        let bd = 1e9;
        for (const p of pal) {
          const dr = R - p[0], dg = G - p[1], db = B - p[2];
          const dd = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11;
          if (dd < bd) { bd = dd; best = p; }
        }
        cache.set(key, best);
      }
      d[i] = best[0]; d[i + 1] = best[1]; d[i + 2] = best[2]; d[i + 3] = 255;
    }
  }
  c.putImageData(img, 0, 0);
}

function bbox(canvas) {
  const d = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
  let x0 = canvas.width, y0 = canvas.height, x1 = -1, y1 = -1;
  for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
    if (d[(y * canvas.width + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** Raw RGBA pixels of part of a canvas, base64-encoded, for the PNG writer in Node. */
function rawOf(canvas, box) {
  const d = canvas.getContext('2d').getImageData(box.x, box.y, box.w, box.h).data;
  let s = '';
  for (let i = 0; i < d.length; i += 0x8000) s += String.fromCharCode.apply(null, d.subarray(i, i + 0x8000));
  return { w: box.w, h: box.h, rgba: btoa(s) };
}

/** Paint everything a scene function draws into each layer's own canvas, then flatten and pixelate. */
function paintScene(fn) {
  const layers = [];
  const first = newCanvas();
  layers.push({ id: 'sky', cv: first, o: { depth: 0 } });
  const L = (id, o = {}) => {
    const cv = newCanvas();
    layers.push({ id, cv, o });
    return cv.getContext('2d');
  };
  const opts = fn(first.getContext('2d'), L) || {};
  const flat = newCanvas();
  const fc = flat.getContext('2d');
  for (const l of layers) fc.drawImage(l.cv, 0, 0);
  const pal = medianCut(fc.getImageData(0, 0, W, H).data, opts.colors || 60);
  const spread = opts.spread == null ? 16 : opts.spread;
  for (const [i, l] of layers.entries()) applyPalette(l.cv, pal, spread, i === 0);
  fc.clearRect(0, 0, W, H);
  for (const l of layers) fc.drawImage(l.cv, 0, 0);
  const out = [];
  for (const [i, l] of layers.entries()) {
    let box = i === 0 ? { x: 0, y: 0, w: W, h: H } : bbox(l.cv);
    if (!box) continue;
    if (l.o.anim && l.o.anim.type === 'drift') box = { x: 0, y: box.y, w: W, h: box.h };
    out.push({ id: l.id, ...box, depth: l.o.depth == null ? 0.5 : l.o.depth, anim: l.o.anim || null, png: rawOf(l.cv, box) });
  }
  return { flat: rawOf(flat, { x: 0, y: 0, w: W, h: H }), preview: enlarge(flat, 2).toDataURL('image/png'), layers: out, vignette: opts.vignette || [0.4, '0,0,0'] };
}

/** Draw something so it tiles across the left/right edge (for drifting clouds). */
function wrapped(c, seed, fn) {
  for (const dx of [-W, 0, W]) { c.save(); c.translate(dx, 0); fn(c, rng(seed)); c.restore(); }
}

// ---------------------------------------------------------------- shared scene pieces
/** Layer options for something that sways (trees, grass, cloth): a = degrees, t = seconds. */
function sway(a, t, o = {}) { return { type: 'sway', a, t, ...o }; }

/** A bare tree: trunk and forking branches, with snow on them if asked. */
function bareTree(c, r, x, yb, h, col, snow) {
  trunk(c, x, yb, h * 0.5, h * 0.06, h * 0.035, col);
  const limb = (x0, y0, ang, len, w, depth) => {
    const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len;
    branch(c, x0, y0, x1, y1, Math.max(1, w), col);
    if (snow && w > 1) line(c, x0, y0 - 1, x1, y1 - 1, snow, 1);
    if (depth > 0) for (let k = 0; k < 2; k++) limb(x1, y1, ang + r.r(-0.6, 0.6), len * r.r(0.55, 0.75), w * 0.6, depth - 1);
  };
  for (let k = 0; k < 4; k++) limb(x, yb - h * (0.45 + k * 0.1), -Math.PI / 2 + r.r(-0.8, 0.8), h * 0.3, h * 0.025, 3);
}

function birch(c, r, x, yb, hh, leaves) {
  const tw = Math.max(1, hh * 0.05);
  rect(c, x, yb - hh * 0.8, tw, hh * 0.8, '#efe6d6');
  if (tw > 2) rect(c, x + tw * 0.6, yb - hh * 0.8, tw * 0.4, hh * 0.8, '#c9a98f');
  for (let k = 0; k < hh * 0.14; k++) rect(c, x, yb - r() * hh * 0.8, Math.max(1, tw * r.r(0.4, 1)), 1, '#3b3533');
  if (leaves) crown(c, r, x + 2, yb - hh * 0.84, hh * 0.22, hh * 0.3, leaves, { x: 0.85, y: -0.25 }, 24);
}

