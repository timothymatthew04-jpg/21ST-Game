// Every surface is painted here on canvases (siding, shingles, bark, stone, leaves, the lit
// windows, the lightning hand), so the menu needs no downloaded images.
import * as THREE from 'three';
import { rng, fbm2, noise2, clamp, smoothstep } from './util.js';

let maxAniso = 4;
export const setAnisotropy = (n) => { maxAniso = n; };

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

// Fill a colour canvas and a matching height canvas from one per-pixel function.
function paint(w, h, fn) {
  const col = canvas(w, h), hgt = canvas(w, h);
  const cctx = col.getContext('2d'), hctx = hgt.getContext('2d');
  const cimg = cctx.createImageData(w, h), himg = hctx.createImageData(w, h);
  const out = [0, 0, 0, 0];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      fn(x, y, out);
      const i = (y * w + x) * 4;
      cimg.data[i] = clamp(out[0], 0, 255);
      cimg.data[i + 1] = clamp(out[1], 0, 255);
      cimg.data[i + 2] = clamp(out[2], 0, 255);
      cimg.data[i + 3] = 255;
      const hv = clamp(out[3], 0, 1) * 255;
      himg.data[i] = himg.data[i + 1] = himg.data[i + 2] = hv;
      himg.data[i + 3] = 255;
    }
  }
  cctx.putImageData(cimg, 0, 0);
  hctx.putImageData(himg, 0, 0);
  return { col, hgt };
}

function tex(c, { srgb = true, repeat = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = maxAniso;
  return t;
}

function pair({ col, hgt }) {
  return { map: tex(col), bump: tex(hgt, { srgb: false }) };
}

// Faded pink clapboard: 25 boards per tile (4 m), grime running down, paint peeling to grey wood.
export function siding() {
  const W = 1024, rows = 25, bh = W / rows;
  const r = rng(11);
  const tint = Array.from({ length: rows }, () => r.range(-10, 10));
  const seams = Array.from({ length: rows }, () => [r() * W, r() < 0.5 ? r() * W : -1]);
  return pair(paint(W, W, (x, y, o) => {
    const row = Math.floor(y / bh), v = (y % bh) / bh;
    const grime = fbm2(x / 128, y / 32, 4, 8);
    const streak = fbm2(x / 20, y / 256, 3, 51.2);
    const peel = fbm2(x / 64 + 30, y / 64, 5, 16);
    const peeled = peel > 0.66;
    let shade = 0.72 + 0.28 * v;
    if (v < 0.14) shade *= 0.45 + 3.9 * v;
    const [s1, s2] = seams[row];
    if (Math.abs(x - s1) < 1.2 || (s2 >= 0 && Math.abs(x - s2) < 1.2)) shade *= 0.55;
    let R = 206 + tint[row], G = 138 + tint[row] * 0.7, B = 162 + tint[row] * 0.8;
    if (peeled) { R = 104; G = 97; B = 94; }
    const dirt = 0.62 + 0.38 * grime - 0.25 * smoothstep(0.55, 0.8, streak);
    o[0] = R * shade * dirt; o[1] = G * shade * dirt; o[2] = B * shade * dirt;
    o[3] = 0.25 + 0.7 * v - (v < 0.08 ? 0.3 : 0) - (peeled ? 0.12 : 0);
  }));
}

// Fish-scale shingles for the gable ends, in the same tired pink.
export function fishScale() {
  const W = 512, rows = 8, rh = W / rows, cols = 8, cw = W / cols;
  return pair(paint(W, W, (x, y, o) => {
    const row = Math.floor(y / rh);
    const off = (row % 2) * cw * 0.5;
    const cx = (((x + off) % cw) + cw) % cw - cw / 2;
    const cy = (y % rh);
    const d = Math.hypot(cx, cy - rh * 0.25) / (cw * 0.52);
    const inScale = d < 1;
    let shade = inScale ? 0.95 - 0.35 * d * d : 0.5;
    if (!inScale && cy < rh * 0.4) shade = 0.6;
    const grime = fbm2(x / 64, y / 24, 4, 8);
    const dirt = 0.6 + 0.4 * grime;
    o[0] = 200 * shade * dirt; o[1] = 134 * shade * dirt; o[2] = 160 * shade * dirt;
    o[3] = inScale ? 1 - d * 0.7 : 0.1;
  }));
}

// Slate shingles, staggered, with moss creeping between rows.
export function shingles() {
  const W = 1024, rows = 16, rh = W / rows;
  const r = rng(23);
  const cuts = [];
  for (let i = 0; i < rows; i++) {
    const xs = [0];
    while (xs[xs.length - 1] < W) xs.push(xs[xs.length - 1] + r.range(48, 96));
    xs[xs.length - 1] = W;
    cuts.push({ xs, tones: xs.map(() => r.range(-14, 14)) });
  }
  return pair(paint(W, W, (x, y, o) => {
    const row = Math.floor(y / rh), v = (y % rh) / rh;
    const { xs, tones } = cuts[row];
    let k = 0;
    while (xs[k + 1] <= x) k++;
    const gap = Math.min(x - xs[k], xs[k + 1] - x) < 2;
    let shade = 0.7 + 0.3 * v;
    if (v > 0.92) shade *= 0.5;
    if (gap) shade *= 0.35;
    const moss = smoothstep(0.55, 0.75, fbm2(x / 90, y / 90, 5, 11.378));
    const wear = fbm2(x / 16, y / 16, 3, 64);
    const t = tones[k];
    let R = 62 + t, G = 58 + t, B = 72 + t;
    R = R * (1 - moss) + 44 * moss; G = G * (1 - moss) + 54 * moss; B = B * (1 - moss) + 40 * moss;
    const m = shade * (0.8 + 0.4 * wear);
    o[0] = R * m; o[1] = G * m; o[2] = B * m;
    o[3] = gap ? 0 : 0.3 + 0.6 * v;
  }));
}

// Deeply fissured bark for the old tree.
export function bark() {
  const W = 512, H = 1024;
  return pair(paint(W, H, (x, y, o) => {
    const ridge = fbm2(x / 20, y / 110, 5, 25.6);
    const fine = fbm2(x / 5, y / 18, 3, 102.4);
    const fissure = smoothstep(0.35, 0.55, ridge);
    const lichen = smoothstep(0.62, 0.72, fbm2(x / 40 + 7, y / 40, 4, 12.8));
    const m = (0.35 + 0.65 * fissure) * (0.8 + 0.4 * fine);
    o[0] = (58 + 30 * lichen) * m; o[1] = (50 + 34 * lichen) * m; o[2] = (48 + 20 * lichen) * m;
    o[3] = fissure * 0.8 + fine * 0.2;
  }));
}

// Night grass and bare earth.
export function ground() {
  const W = 1024;
  return pair(paint(W, W, (x, y, o) => {
    const patch = fbm2(x / 160, y / 160, 5, 6.4);
    const blades = noise2(x / 1.6, y / 5, 640);
    const clump = fbm2(x / 12, y / 12, 3, 85.33);
    const dirt = smoothstep(0.55, 0.7, patch);
    let R = 30 + 18 * clump, G = 40 + 22 * clump, B = 30 + 10 * clump;
    R = R * (1 - dirt) + 52 * dirt; G = G * (1 - dirt) + 44 * dirt; B = B * (1 - dirt) + 36 * dirt;
    const m = 0.7 + 0.5 * blades;
    o[0] = R * m; o[1] = G * m; o[2] = B * m;
    o[3] = 0.3 + 0.4 * blades + 0.3 * clump;
  }));
}

// Coursed stone for the foundation, steps and gate posts.
export function stone() {
  const W = 512, rows = 6, rh = W / rows;
  const r = rng(31);
  const courses = [];
  for (let i = 0; i < rows; i++) {
    const xs = [0];
    while (xs[xs.length - 1] < W) xs.push(xs[xs.length - 1] + r.range(70, 150));
    xs[xs.length - 1] = W;
    courses.push({ xs, tones: xs.map(() => r.range(-16, 16)) });
  }
  return pair(paint(W, W, (x, y, o) => {
    const row = Math.floor(y / rh), v = (y % rh);
    const { xs, tones } = courses[row];
    let k = 0;
    while (xs[k + 1] <= x) k++;
    const edge = Math.min(x - xs[k], xs[k + 1] - x, v, rh - v);
    const mortar = edge < 3;
    const round = smoothstep(0, 10, edge);
    const grain = fbm2(x / 14, y / 14, 4, 36.57);
    const moss = smoothstep(0.6, 0.75, fbm2(x / 60, y / 60, 4, 8.533));
    const t = tones[k];
    let R = 92 + t, G = 92 + t, B = 100 + t;
    if (mortar) { R = 40; G = 40; B = 44; }
    R = R * (1 - moss) + 50 * moss; G = G * (1 - moss) + 62 * moss; B = B * (1 - moss) + 46 * moss;
    const m = (0.65 + 0.5 * grain) * (mortar ? 1 : 0.7 + 0.3 * round);
    o[0] = R * m; o[1] = G * m; o[2] = B * m;
    o[3] = mortar ? 0 : 0.4 + 0.4 * round + 0.2 * grain;
  }));
}

// A single serrated leaf with veins; instance colours tint it the deep reds and near-blacks of the tree.
export function leaf() {
  const S = 128;
  const c = canvas(S, S);
  const g = c.getContext('2d');
  // a narrow, pointed, saw-edged leaf on a short stalk, curling slightly at the tip
  const outline = (side) => {
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;                         // 0 at the stalk, 1 at the tip
      const w = Math.sin(Math.pow(t, 0.8) * Math.PI) * (1 - 0.35 * t) * 0.23;
      const tooth = i % 2 ? 1 : 0.8;
      const bend = Math.sin(t * Math.PI) * 0.05 + t * t * 0.06;
      pts.push([S / 2 + (bend + side * w * tooth) * S, S * (0.84 - t * 0.78)]);
    }
    return pts;
  };
  const right = outline(1), left = outline(-1).reverse();
  g.beginPath();
  [...right, ...left].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  const grad = g.createLinearGradient(0, S, S, 0);
  grad.addColorStop(0, '#cfc6c2');
  grad.addColorStop(1, '#a0948f');
  g.fillStyle = grad;
  g.fill();
  g.save();
  g.clip();
  g.strokeStyle = 'rgba(255,245,240,0.6)';
  g.lineWidth = 1.5;
  g.beginPath();
  right.forEach(([x], i) => {
    const y = S * (0.84 - (i / 40) * 0.78);
    const mx = (x + left[40 - i][0]) / 2;
    i ? g.lineTo(mx, y) : g.moveTo(mx, y);
  });
  g.stroke();
  g.lineWidth = 0.8;
  for (let i = 4; i < 36; i += 4) {
    const [xr, yr] = right[i + 3], [xl, yl] = left[40 - i - 3];
    const y = S * (0.84 - (i / 40) * 0.78);
    const mx = (right[i][0] + left[40 - i][0]) / 2;
    g.beginPath(); g.moveTo(mx, y); g.lineTo(xr, yr); g.stroke();
    g.beginPath(); g.moveTo(mx, y); g.lineTo(xl, yl); g.stroke();
  }
  g.restore();
  g.strokeStyle = '#9a8e8a';
  g.lineWidth = 2.2;
  g.beginPath(); g.moveTo(S / 2, S * 0.84); g.quadraticCurveTo(S / 2 - 2, S * 0.93, S / 2 - 6, S * 0.99); g.stroke();
  return tex(c, { repeat: false });
}

// Warm lit rooms behind the Pink Palace windows. Some hold the silhouettes of Coraline's parents.
export function windowRoom(kind, seed = 1) {
  const W = 256, H = 448;
  const c = canvas(W, H);
  const g = c.getContext('2d');
  const r = rng(seed);
  const glow = g.createRadialGradient(W * 0.5, H * 0.42, 10, W * 0.5, H * 0.5, H * 0.75);
  glow.addColorStop(0, '#fff0c0');
  glow.addColorStop(0.35, '#ffc26a');
  glow.addColorStop(0.75, '#c7762a');
  glow.addColorStop(1, '#5a2c10');
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);
  // wallpaper stripes, barely there
  g.globalAlpha = 0.08;
  g.fillStyle = '#5a2c10';
  for (let x = 0; x < W; x += 22) g.fillRect(x, 0, 9, H);
  g.globalAlpha = 1;
  // a picture frame on the back wall
  if (r() < 0.7) {
    g.fillStyle = 'rgba(70,30,10,0.55)';
    const fx = r.range(30, 150);
    g.fillRect(fx, 70, 60, 74);
    g.fillStyle = 'rgba(255,220,160,0.35)';
    g.fillRect(fx + 8, 78, 44, 58);
  }
  const ink = '#1a0c05';
  g.fillStyle = ink;
  if (kind === 'mother') {
    // Mel at her desk in profile: chin-length bob, neck brace, hunched towards the monitor.
    g.fillRect(0, 330, W, 24);
    g.fillRect(24, 354, 10, 100);
    g.beginPath();
    g.moveTo(150, 330); g.lineTo(150, 250); g.lineTo(236, 240); g.lineTo(236, 330); g.closePath(); g.fill();
    g.fillStyle = 'rgba(150,190,255,0.45)';
    g.fillRect(156, 256, 72, 64);
    g.fillStyle = ink;
    g.beginPath();
    g.moveTo(20, 448); g.bezierCurveTo(22, 360, 40, 318, 70, 300);
    g.lineTo(96, 296); g.lineTo(106, 302); g.bezierCurveTo(118, 318, 122, 360, 124, 448);
    g.fill();
    g.fillRect(70, 262, 38, 40); // the neck brace
    g.beginPath();
    g.ellipse(92, 232, 30, 34, -0.15, 0, Math.PI * 2); g.fill();
    g.beginPath(); // nose and chin pointing at the screen
    g.moveTo(118, 222); g.lineTo(128, 238); g.lineTo(116, 244); g.lineTo(114, 258); g.lineTo(104, 262); g.fill();
    g.beginPath(); // bob hair
    g.moveTo(58, 210); g.bezierCurveTo(60, 180, 110, 176, 122, 206);
    g.lineTo(112, 214); g.lineTo(98, 212); g.lineTo(90, 258); g.lineTo(58, 256); g.closePath(); g.fill();
    g.fillRect(118, 300, 36, 12); // arm to the keyboard
  } else if (kind === 'father') {
    // Charlie standing at the window, facing out, very still: messy hair, glasses, a mug.
    g.beginPath();
    g.moveTo(40, 448); g.bezierCurveTo(40, 350, 56, 300, 100, 288);
    g.lineTo(156, 288); g.bezierCurveTo(200, 300, 216, 350, 216, 448); g.fill();
    g.fillRect(114, 250, 28, 44);
    g.beginPath(); g.ellipse(128, 214, 34, 42, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); // tufted hair
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI + (i / 12) * Math.PI;
      const rr = 40 + (i % 2 ? 10 : 0) + r.range(-3, 3);
      g.lineTo(128 + Math.cos(a) * rr, 206 + Math.sin(a) * rr);
    }
    g.fill();
    g.fillStyle = 'rgba(255,225,170,0.55)'; // lamp light caught in his glasses
    g.fillRect(106, 208, 18, 12); g.fillRect(132, 208, 18, 12);
    g.fillStyle = ink;
    g.fillRect(178, 350, 26, 30); // mug
    g.beginPath(); g.arc(206, 364, 8, -1.2, 1.2); g.lineWidth = 5; g.strokeStyle = ink; g.stroke();
  } else if (kind === 'lamp') {
    g.beginPath();
    g.moveTo(84, 300); g.lineTo(172, 300); g.lineTo(150, 238); g.lineTo(106, 238); g.closePath();
    g.fillStyle = 'rgba(120,50,15,0.8)'; g.fill();
    g.fillStyle = ink; g.fillRect(124, 300, 8, 90); g.fillRect(96, 388, 64, 10);
  } else if (kind === 'stairs') {
    g.globalAlpha = 0.6;
    for (let i = 0; i < 8; i++) g.fillRect(0, 440 - i * 36, 60 + i * 26, 12);
    g.globalAlpha = 1;
  }
  // curtains gathered at the edges
  for (const side of [0, 1]) {
    const cw = r.range(34, 52);
    const cg = g.createLinearGradient(side ? W - cw : 0, 0, side ? W : cw, 0);
    cg.addColorStop(side ? 1 : 0, 'rgba(60,18,10,0.95)');
    cg.addColorStop(side ? 0 : 1, 'rgba(90,30,12,0.15)');
    g.fillStyle = cg;
    g.fillRect(side ? W - cw : 0, 0, cw, H);
  }
  g.fillStyle = 'rgba(60,18,10,0.9)';
  g.fillRect(0, 0, W, 22);
  return tex(c, { repeat: false });
}

// The lightning: the Other Mother's hand reaching down out of the clouds, needle-fingered.
export function lightningHand() {
  const S = 1024;
  const c = canvas(S, S);
  const g = c.getContext('2d');
  g.fillStyle = '#000';
  g.fillRect(0, 0, S, S);
  const r = rng(77);
  const bolts = [];
  // jagged polyline between two points
  const jag = (a, b, rough, steps) => {
    const pts = [a];
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const nx = -(b[1] - a[1]), ny = b[0] - a[0];
      const len = Math.hypot(nx, ny) || 1;
      const off = r.range(-1, 1) * rough;
      pts.push([a[0] + (b[0] - a[0]) * t + (nx / len) * off, a[1] + (b[1] - a[1]) * t + (ny / len) * off]);
    }
    pts.push(b);
    return pts;
  };
  const add = (pts, w) => bolts.push({ pts, w });
  const chain = (points, rough, w0, w1) => {
    for (let i = 0; i < points.length - 1; i++) {
      const w = w0 + (w1 - w0) * (i / Math.max(1, points.length - 2));
      add(jag(points[i], points[i + 1], rough, 5), w);
    }
  };
  const joints = [];
  // A skeletal hand, reaching down: two forearm bones out of the cloud, a knot of wrist bones,
  // five metacarpals, and long three-jointed fingers that end in needle points.
  chain([[488, 0], [492, 150], [497, 290]], 6, 8, 7);
  chain([[542, 0], [538, 150], [534, 290]], 6, 8, 7);
  add(jag([497, 290], [534, 290], 3, 3), 5);
  add(jag([490, 300], [540, 345], 3, 4), 4);
  add(jag([540, 300], [488, 342], 3, 4), 4);
  const fingers = [
    { base: [474, 348], pts: [[392, 468], [356, 570], [332, 652], [320, 724]], tip: [316, 796] },
    { base: [502, 352], pts: [[468, 498], [454, 610], [444, 702], [438, 778]], tip: [436, 856] },
    { base: [530, 352], pts: [[550, 498], [564, 606], [574, 692], [580, 762]], tip: [582, 830] },
    { base: [556, 346], pts: [[626, 466], [664, 548], [690, 614], [704, 668]], tip: [710, 720] },
  ];
  fingers.forEach(({ base, pts, tip }) => {
    chain([base, pts[0]], 4, 6.5, 6.5);
    chain(pts, 4, 6, 4);
    add(jag(pts[3], tip, 1, 2), 1.8);
    pts.slice(0, 3).forEach((p) => joints.push(p));
    if (r() < 0.8) add(jag(pts[1], [pts[1][0] + r.range(-50, 50), pts[1][1] + r.range(15, 45)], 4, 4), 1.2);
  });
  // the thumb, from the side of the wrist
  chain([[468, 324], [404, 378], [350, 420], [306, 466]], 4, 6, 4);
  add(jag([306, 466], [288, 516], 1, 2), 1.8);
  joints.push([404, 378], [350, 420]);
  // a few feeders up into the cloud
  for (let i = 0; i < 4; i++) {
    const st = [515 + r.range(-25, 25), r.range(30, 180)];
    add(jag(st, [st[0] + r.range(-200, 200), st[1] + r.range(-30, 70)], 10, 6), 1.1);
  }
  const stroke = (color, blur, scale) => {
    g.strokeStyle = color;
    g.shadowColor = color;
    g.shadowBlur = blur;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (const { pts, w } of bolts) {
      g.lineWidth = w * scale;
      g.beginPath();
      pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.stroke();
    }
  };
  g.globalCompositeOperation = 'lighter';
  stroke('rgba(90,110,255,0.28)', 46, 2.6);
  stroke('rgba(160,180,255,0.7)', 16, 1.5);
  stroke('rgba(240,244,255,1)', 4, 1.05);
  g.fillStyle = 'rgba(245,248,255,1)';
  g.shadowColor = 'rgba(170,185,255,0.9)';
  g.shadowBlur = 14;
  for (const [x, y] of joints) { g.beginPath(); g.arc(x, y, 5.5, 0, Math.PI * 2); g.fill(); }
  // the wrist emerges from inside the cloud
  g.globalCompositeOperation = 'source-over';
  g.shadowBlur = 0;
  const fadeTop = g.createLinearGradient(0, 0, 0, 220);
  fadeTop.addColorStop(0, 'rgba(0,0,0,1)');
  fadeTop.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = fadeTop;
  g.fillRect(0, 0, S, 220);
  const t = tex(c, { repeat: false });
  return t;
}

// Soft drifting mist, tileable left to right, fading out at top and bottom.
export function mist() {
  const W = 512, H = 128;
  const c = canvas(W, H);
  const g = c.getContext('2d');
  const img = g.createImageData(W, H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const n = fbm2(x / 64, y / 32, 5, 8);
      const band = Math.sin((y / H) * Math.PI);
      const a = smoothstep(0.35, 0.75, n) * band * band;
      const i = (y * W + x) * 4;
      img.data[i] = 200; img.data[i + 1] = 212; img.data[i + 2] = 235;
      img.data[i + 3] = a * 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = tex(c);
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

// The weathered sign at the foot of the steps.
export function sign() {
  const W = 1024, H = 360;
  const c = canvas(W, H);
  const g = c.getContext('2d');
  const r = rng(5);
  for (let i = 0; i < 3; i++) {
    const y0 = i * (H / 3);
    const grad = g.createLinearGradient(0, y0, 0, y0 + H / 3);
    const t = r.range(-10, 10);
    grad.addColorStop(0, `rgb(${92 + t},${78 + t},${70 + t})`);
    grad.addColorStop(1, `rgb(${70 + t},${58 + t},${52 + t})`);
    g.fillStyle = grad;
    g.fillRect(0, y0, W, H / 3 - 3);
    g.fillStyle = 'rgba(20,14,10,0.9)';
    g.fillRect(0, y0 + H / 3 - 3, W, 3);
    g.strokeStyle = 'rgba(30,20,15,0.25)';
    for (let k = 0; k < 14; k++) {
      g.lineWidth = r.range(0.5, 2);
      g.beginPath();
      const yy = y0 + r.range(4, H / 3 - 6);
      g.moveTo(0, yy);
      for (let x = 0; x <= W; x += 64) g.lineTo(x, yy + Math.sin(x / 90 + k) * 2);
      g.stroke();
    }
  }
  g.textAlign = 'center';
  g.fillStyle = 'rgba(232,205,200,0.92)';
  g.font = '92px "Fell SC"';
  g.fillText('Pink Palace', W / 2, 150);
  g.font = '60px "Fell SC"';
  g.fillStyle = 'rgba(214,160,170,0.85)';
  g.fillText('~ Apartments ~', W / 2, 262);
  // flaking paint over the lettering
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(0,0,0,${r.range(0.2, 0.6)})`;
    g.fillRect(r() * W, r() * H, r.range(2, 12), r.range(1, 5));
  }
  g.globalCompositeOperation = 'destination-over';
  g.fillStyle = '#4a3c35';
  g.fillRect(0, 0, W, H);
  return tex(c, { repeat: false });
}

// A distant fir, drawn as a ragged silhouette for billboards in the far forest.
export function fir(seed = 1) {
  const W = 256, H = 512;
  const c = canvas(W, H);
  const g = c.getContext('2d');
  const r = rng(seed);
  g.fillStyle = '#fff';
  g.fillRect(W / 2 - 5, H * 0.75, 10, H * 0.25);
  const tiers = 26;
  for (let i = 0; i < tiers; i++) {
    const t = i / (tiers - 1);
    const y = 14 + t * H * 0.8;
    const half = (6 + t * (W * 0.42)) * r.range(0.75, 1.1);
    g.beginPath();
    g.moveTo(W / 2, y - 18 - t * 10);
    const steps = 7;
    for (let k = 0; k <= steps; k++) {
      const x = W / 2 - half + (2 * half * k) / steps;
      const droop = 14 + Math.abs(k - steps / 2) * 3 + r.range(-6, 10);
      g.lineTo(x + r.range(-6, 6), y + droop * (0.6 + t));
    }
    g.closePath();
    g.fill();
  }
  const t = tex(c, { repeat: false });
  return t;
}
