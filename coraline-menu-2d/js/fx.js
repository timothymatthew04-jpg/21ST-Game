// Everything drawn on 2D canvases: the lightning strikes (cyan, branching like the hand outside the
// window in the film), the cobwebs that only show in a flash, the Other Mother in the attic window,
// and the moving creatures (falling leaves, crows across the moon, dragonfly lights, the cat).
export const W = 1920, H = 1080;

export function rng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.range = (lo, hi) => lo + (hi - lo) * next();
  next.sign = () => (next() < 0.5 ? -1 : 1);
  return next;
}

function canvas(w = W, h = H) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

// --- lightning ---------------------------------------------------------------------------------

// Lightning strokes, drawn sharp: a faint cyan sheath, a bright cyan body, a white-hot core.
// The soft glow around them is added by the shader from blurred copies of this layer.
function strokeBolts(g, segs, scale = 1) {
  const pass = (color, widthMul) => {
    g.strokeStyle = color;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (const { pts, w } of segs) {
      g.lineWidth = Math.max(0.7, w * widthMul * scale);
      g.beginPath();
      pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.stroke();
    }
  };
  g.globalCompositeOperation = 'lighter';
  pass('rgba(40,150,255,0.35)', 2.6);
  pass('rgba(90,215,255,0.7)', 1.3);
  pass('rgba(235,252,255,1)', 0.5);
  g.globalCompositeOperation = 'source-over';
}

// A crooked jagged path: heading wanders, kinks at knuckles, droops, may curl at the end.
function crooked(r, segs, start, heading, length, { steps = 18, w0 = 6, w1 = 1, kink = 0.35, droop = 0.02, curl = 0, jitter = 4, knuckles = 3 } = {}) {
  const pts = [start];
  let [x, y] = start, h = heading;
  const kinks = new Set(Array.from({ length: knuckles }, (_, i) => Math.round(((i + 1) / (knuckles + 1)) * steps)));
  for (let k = 1; k <= steps; k++) {
    const t = k / steps;
    h += droop * Math.max(-1, Math.min(1, Math.PI / 2 - h));
    if (kinks.has(k)) h += r.sign() * kink * r.range(0.5, 1.1);
    if (t > 0.75) h += curl;
    h += r.range(-0.12, 0.12);
    x += Math.cos(h) * (length / steps) + r.range(-jitter, jitter);
    y += Math.sin(h) * (length / steps) + r.range(-jitter, jitter);
    pts.push([x, y]);
  }
  for (let i = 0; i < pts.length - 1; i++) {
    const t = i / (pts.length - 1);
    segs.push({ pts: [pts[i], pts[i + 1]], w: w0 + (w1 - w0) * t });
  }
  return pts;
}

// A hand of lightning: a wrist out of the cloud, a knot of a palm, long splayed crooked fingers.
function drawHand(g, r, { x, y, size, angle = Math.PI / 2, fingers = 5, spread = 1.5, curl = 0.1 }) {
  const segs = [];
  const wristLen = size * 0.55;
  const top = [x - Math.cos(angle) * wristLen, y - Math.sin(angle) * wristLen];
  crooked(r, segs, top, angle, wristLen, { steps: 10, w0: 7.5, w1: 6.5, kink: 0.25, knuckles: 2, jitter: 3 });
  const palm = segs[segs.length - 1].pts[1];
  for (let i = 0; i < 6; i++) {
    const a = r() * Math.PI * 2;
    segs.push({ pts: [palm, [palm[0] + Math.cos(a) * size * 0.05, palm[1] + Math.sin(a) * size * 0.05]], w: 4 });
  }
  for (let f = 0; f < fingers; f++) {
    const a = angle + (f / (fingers - 1) - 0.5) * spread + r.range(-0.08, 0.08);
    const outer = Math.abs(f / (fingers - 1) - 0.5) * 2;
    const len = size * (0.75 + 0.35 * (1 - outer)) * r.range(0.9, 1.1);
    const c = (f / (fingers - 1) - 0.5) * -2 * curl;
    const pts = crooked(r, segs, palm, a, len, { steps: 20, w0: 5.5, w1: 0.8, kink: 0.32, droop: 0.02, curl: c, jitter: 3, knuckles: 3 });
    for (let k = 0; k < 2; k++) {
      const p = pts[Math.round(r.range(0.25, 0.75) * (pts.length - 1))];
      crooked(r, segs, p, a + r.sign() * r.range(0.4, 0.9), len * r.range(0.12, 0.22), { steps: 5, w0: 1.6, w1: 0.6, kink: 0.3, knuckles: 1, jitter: 2 });
    }
  }
  // feeders spidering back into the cloud
  for (let i = 0; i < 4; i++) {
    const p = segs[Math.floor(r() * 6)].pts[0];
    crooked(r, segs, p, angle + Math.PI + r.range(-1.2, 1.2), size * r.range(0.25, 0.5), { steps: 8, w0: 1.4, w1: 0.6, kink: 0.4, knuckles: 2, jitter: 3 });
  }
  strokeBolts(g, segs, size / 260);
}

// A plain forked bolt.
function drawBolt(g, r, { x, y, length, angle = Math.PI / 2, width = 4 }) {
  const segs = [];
  const channel = (sx, sy, h0, len, w, depth) => {
    const steps = Math.max(6, Math.round(len / 18));
    const pts = [[sx, sy]];
    let px = sx, py = sy;
    for (let i = 0; i < steps; i++) {
      const h = h0 + r.range(-0.6, 0.6);
      px += Math.cos(h) * (len / steps);
      py += Math.sin(h) * (len / steps);
      pts.push([px, py]);
      if (depth < 3 && r() < 0.18) channel(px, py, h0 + r.sign() * r.range(0.4, 0.9), len * r.range(0.2, 0.4), w * 0.45, depth + 1);
    }
    for (let i = 0; i < pts.length - 1; i++) segs.push({ pts: [pts[i], pts[i + 1]], w: w * (1 - (i / pts.length) * 0.5) });
  };
  channel(x, y, angle, length, width, 0);
  strokeBolts(g, segs, Math.max(0.6, length / 500));
}

// The six strikes of the loop, one every two seconds. Each is a full-frame layer the shader shows
// only where there is open sky, so the bolts pass behind the tree, the title and the house.
export const STRIKES = [
  { t: 0.3, amp: 0.55, focus: [1700, 200], draw: (g, r) => drawBolt(g, r, { x: 1700, y: 0, length: 520, angle: Math.PI / 2 + 0.15, width: 4 }) },
  { t: 2.3, amp: 0.8, focus: [430, 250], draw: (g, r) => drawHand(g, r, { x: 430, y: 250, size: 260, angle: Math.PI / 2 + 0.25, fingers: 5, spread: 1.7, curl: 0.12 }) },
  { t: 4.3, amp: 0.75, focus: [1200, 150], draw: (g, r) => drawHand(g, r, { x: 1200, y: 150, size: 190, angle: Math.PI / 2 - 0.2, fingers: 4, spread: 1.4, curl: 0.1 }) },
  { t: 6.3, amp: 1.0, scare: true, focus: [1560, 240], draw: (g, r) => drawHand(g, r, { x: 1560, y: 240, size: 330, angle: Math.PI / 2, fingers: 5, spread: 1.9, curl: 0.16 }) },
  { t: 8.3, amp: 0.4, focus: [820, 450], draw: (g, r) => drawBolt(g, r, { x: 820, y: 360, length: 300, angle: Math.PI / 2 + 0.3, width: 2.4 }) },
  { t: 10.3, amp: 0.85, focus: [760, 170], draw: (g, r) => drawHand(g, r, { x: 760, y: 170, size: 230, angle: Math.PI / 2 + 0.1, fingers: 5, spread: 1.6, curl: 0.14 }) },
];

export function strikeLayers() {
  return STRIKES.map((s, i) => {
    const c = canvas();
    const g = c.getContext('2d');
    s.draw(g, rng(1000 + i * 77));
    return c;
  });
}

// --- cobwebs, invisible until the lightning catches them ------------------------------------

function web(g, r, cx, cy, R, spokes, torn) {
  const angles = Array.from({ length: spokes }, (_, i) => (i / spokes) * Math.PI * 2 + r.range(-0.22, 0.22));
  const ends = angles.map(() => R * r.range(0.6, 1.2));
  g.lineCap = 'round';
  for (let i = 0; i < spokes; i++) {
    if (r() < torn * 0.4) continue;
    g.globalAlpha = r.range(0.5, 1);
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(cx, cy);
    const bend = r.range(-6, 6);
    const ex = cx + Math.cos(angles[i]) * ends[i] * 1.1, ey = cy + Math.sin(angles[i]) * ends[i] * 1.1;
    g.quadraticCurveTo((cx + ex) / 2 + bend, (cy + ey) / 2 + Math.abs(bend), ex, ey);
    g.stroke();
  }
  g.lineWidth = 0.7;
  let ring = 0.18;
  while (ring < 1) {
    for (let i = 0; i < spokes; i++) {
      if (r() < torn) continue;
      const j = (i + 1) % spokes;
      const a = [cx + Math.cos(angles[i]) * ends[i] * ring, cy + Math.sin(angles[i]) * ends[i] * ring];
      const b = [cx + Math.cos(angles[j]) * ends[j] * ring, cy + Math.sin(angles[j]) * ends[j] * ring];
      const sag = [cx + ((a[0] + b[0]) / 2 - cx) * 0.88, cy + ((a[1] + b[1]) / 2 - cy) * 0.88 + 3];
      g.globalAlpha = r.range(0.35, 0.9);
      g.beginPath();
      g.moveTo(...a);
      g.quadraticCurveTo(...sag, ...b);
      g.stroke();
    }
    ring += r.range(0.06, 0.12);
  }
  g.globalAlpha = 1;
}

export function webLayer() {
  const c = canvas();
  const g = c.getContext('2d');
  g.strokeStyle = 'rgba(225,238,255,0.7)';
  const r = rng(9);
  web(g, r, 300, 205, 105, 9, 0.35);
  web(g, r, 1335, 262, 60, 8, 0.4);
  web(g, r, 178, 640, 80, 8, 0.45);
  web(g, r, 1050, 118, 52, 7, 0.45);
  return c;
}

// --- the Other Mother in the attic window, with button eyes ----------------------------------

export function apparitionLayer(at, size) {
  const c = canvas();
  const g = c.getContext('2d');
  const [x, y] = at;
  const [w, h] = size;
  // the pane lit pale and cold from inside
  const glow = g.createRadialGradient(x, y - h * 0.1, 2, x, y, h * 0.7);
  glow.addColorStop(0, 'rgba(200,235,255,0.95)');
  glow.addColorStop(1, 'rgba(90,140,170,0.6)');
  g.fillStyle = glow;
  g.fillRect(x - w / 2, y - h / 2, w, h);
  // her silhouette: tall bun, long thin neck, sharp shoulders
  g.fillStyle = 'rgba(4,5,10,0.97)';
  const s = h / 50;
  g.beginPath();
  g.ellipse(x, y - 15 * s, 6.5 * s, 8 * s, 0, 0, Math.PI * 2);   // head
  g.fill();
  g.beginPath();
  g.ellipse(x, y - 25 * s, 4.5 * s, 4 * s, 0, 0, Math.PI * 2);   // bun
  g.fill();
  g.fillRect(x - 2 * s, y - 9 * s, 4 * s, 9 * s);                  // neck
  g.beginPath();
  g.moveTo(x - 13 * s, y + 25 * s);
  g.quadraticCurveTo(x - 12 * s, y + 2 * s, x, y);
  g.quadraticCurveTo(x + 12 * s, y + 2 * s, x + 13 * s, y + 25 * s);
  g.fill();
  // two button eyes catching the light
  for (const dx of [-2.6, 2.6]) {
    g.beginPath();
    g.arc(x + dx * s, y - 15.5 * s, 1.9 * s, 0, Math.PI * 2);
    g.fillStyle = 'rgba(10,10,14,1)';
    g.fill();
    g.lineWidth = 0.9 * s;
    g.strokeStyle = 'rgba(235,240,255,0.95)';
    g.stroke();
  }
  // window bars over it all
  g.fillStyle = 'rgba(10,10,18,0.9)';
  g.fillRect(x - 1, y - h / 2, 2, h);
  g.fillRect(x - w / 2, y - 2, w, 2);
  return c;
}

// --- creatures, drawn each frame on the overlay canvas -----------------------------------------

function leafShape(g, s) {
  g.beginPath();
  g.moveTo(0, -s);
  g.bezierCurveTo(s * 0.7, -s * 0.5, s * 0.6, s * 0.5, 0, s);
  g.bezierCurveTo(-s * 0.6, s * 0.5, -s * 0.7, -s * 0.5, 0, -s);
  g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.6)';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(0, -s); g.lineTo(0, s * 1.25);
  g.stroke();
}

function crow(g, x, y, size, flap, dir) {
  g.save();
  g.translate(x, y);
  g.scale(dir * size / 40, size / 40);
  g.fillStyle = '#05050a';
  const wing = Math.sin(flap) * 14;
  g.beginPath();
  g.ellipse(0, 0, 14, 5, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.moveTo(12, -2); g.lineTo(22, 0); g.lineTo(12, 3);             // head and beak
  g.fill();
  g.beginPath();
  g.moveTo(-12, 0); g.lineTo(-24, -4); g.lineTo(-24, 5);            // tail
  g.fill();
  for (const side of [1, -1]) {
    g.beginPath();
    g.moveTo(-4, 0);
    g.quadraticCurveTo(-2, -wing * side - 6, -16, -wing * side * 1.6 - 4);
    g.quadraticCurveTo(-2, -wing * side * 0.6, 6, 0);
    g.fill();
  }
  g.restore();
}

export function createCreatures(LOOP, layout) {
  const r = rng(44);
  const leaves = Array.from({ length: 34 }, (_, i) => ({
    x0: r.range(-80, 1350),
    y0: r.range(40, 260),
    fall: r.range(700, 1050),
    drift: r.range(120, 380),
    cycles: r() < 0.5 ? 1 : 2,
    phase: r(),
    sway: r.range(20, 60),
    swayK: 2 + Math.floor(r() * 4),
    spinK: (1 + Math.floor(r() * 3)) * r.sign(),
    size: r.range(8, 15),
    tone: r.range(0, 1),
  }));
  const crows = [
    { y: 175, dir: -1, size: 34, start: 0.18, span: 0.32, flapK: 26, bob: 6 },
    { y: 215, dir: -1, size: 26, start: 0.22, span: 0.34, flapK: 30, bob: 8 },
    { y: 150, dir: -1, size: 22, start: 0.27, span: 0.36, flapK: 34, bob: 5 },
  ];
  const flies = Array.from({ length: 5 }, (_, i) => ({
    cx: r.range(80, 760), cy: r.range(760, 1000), ax: r.range(40, 120), ay: r.range(20, 60),
    kx: 1 + Math.floor(r() * 2), ky: 2 + Math.floor(r() * 2), ph: r() * Math.PI * 2, size: r.range(0.8, 1.2),
  }));
  const [catX, catY] = layout.cat;

  return function draw(g, t, flash) {
    const u = t / LOOP;
    g.clearRect(0, 0, W, H);
    // dark leaves drifting down from the old tree
    for (const L of leaves) {
      const f = (u * L.cycles + L.phase) % 1;
      const w = Math.PI * 2 * (u * L.swayK + L.phase);
      const x = L.x0 + L.drift * f + Math.sin(w) * L.sway;
      const y = L.y0 + L.fall * f;
      const a = Math.min(1, f * 10, (1 - f) * 10);
      g.save();
      g.globalAlpha = a * 0.92;
      g.translate(x, y);
      g.rotate(Math.PI * 2 * (u * L.spinK + L.phase));
      g.scale(1, 0.35 + 0.65 * Math.abs(Math.sin(w * 1.5)));
      const lit = 10 + flash * 60;
      g.fillStyle = `rgb(${Math.round(lit + 26 * L.tone)},${Math.round(lit * 0.5)},${Math.round(lit * 0.6)})`;
      leafShape(g, L.size);
      g.restore();
    }
    // crows crossing the moon, right to left
    for (const c of crows) {
      const p = (u - c.start + 1) % 1;
      if (p > c.span) continue;
      const k = p / c.span;
      const x = 2000 - k * 1100;
      const y = c.y + Math.sin(k * Math.PI * 3) * c.bob - k * 30;
      crow(g, x, y, c.size, Math.PI * 2 * c.flapK * p, c.dir);
    }
    // dragonfly lights from the Other Mother's garden, drifting near the weeds
    g.globalCompositeOperation = 'lighter';
    flies.forEach((d) => {
      const x = d.cx + Math.sin(Math.PI * 2 * u * d.kx + d.ph) * d.ax;
      const y = d.cy + Math.sin(Math.PI * 2 * u * d.ky + d.ph * 1.7) * d.ay;
      const pulse = 0.6 + 0.4 * Math.sin(Math.PI * 2 * u * 6 + d.ph);
      const grad = g.createRadialGradient(x, y, 0, x, y, 34 * d.size);
      grad.addColorStop(0, `rgba(200,255,245,${0.95 * pulse})`);
      grad.addColorStop(0.12, `rgba(110,235,235,${0.6 * pulse})`);
      grad.addColorStop(0.45, `rgba(40,150,200,${0.18 * pulse})`);
      grad.addColorStop(1, 'rgba(20,80,120,0)');
      g.fillStyle = grad;
      g.beginPath(); g.arc(x, y, 34 * d.size, 0, Math.PI * 2); g.fill();
      g.fillStyle = `rgba(200,240,255,${0.35 * pulse})`;
      const flap = Math.sin(Math.PI * 2 * u * 90 + d.ph) * 0.5 + 0.5;
      for (const s of [-1, 1]) {
        g.beginPath(); g.ellipse(x + s * 4 * d.size, y - 1, 4.5 * d.size, (1 + flap) * d.size, s * 0.3, 0, Math.PI * 2); g.fill();
      }
    });
    g.globalCompositeOperation = 'source-over';
    // the black cat on the title, eyes glowing, blinking twice a loop
    g.save();
    g.translate(catX, catY);
    g.fillStyle = '#03040a';
    g.beginPath(); g.ellipse(0, 14, 11, 17, 0, 0, Math.PI * 2); g.fill();          // body
    g.beginPath(); g.arc(0, -6, 8, 0, Math.PI * 2); g.fill();                         // head
    g.beginPath(); g.moveTo(-7, -9); g.lineTo(-6, -19); g.lineTo(-1, -12); g.fill();  // ears
    g.beginPath(); g.moveTo(7, -9); g.lineTo(6, -19); g.lineTo(1, -12); g.fill();
    g.lineWidth = 3.5; g.strokeStyle = '#03040a'; g.lineCap = 'round';
    g.beginPath(); g.moveTo(8, 28); g.quadraticCurveTo(22, 26, 18, 8); g.stroke();   // tail
    g.strokeStyle = `rgba(120,150,220,${0.35 + flash * 0.5})`;                        // moonlit rim
    g.lineWidth = 1;
    g.beginPath(); g.arc(0, -6, 8, -1.2, 0.6); g.stroke();
    g.beginPath(); g.ellipse(0, 14, 11, 17, 0, -1.3, 0.4); g.stroke();
    const blink = [0.31, 0.79].some((b) => Math.abs(u - b) < 0.012) ? 0.15 : 1;
    for (const s of [-1, 1]) {
      const ex = s * 3.4, ey = -6;
      const eg = g.createRadialGradient(ex, ey, 0, ex, ey, 6);
      eg.addColorStop(0, 'rgba(220,255,120,0.9)');
      eg.addColorStop(1, 'rgba(160,220,60,0)');
      g.fillStyle = eg;
      g.beginPath(); g.arc(ex, ey, 6, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#e8ff9a';
      g.beginPath(); g.ellipse(ex, ey, 1.7, 1.7 * blink, 0, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  };
}
