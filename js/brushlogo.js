/*
 * brushlogo.js — a glowing, hand-painted title logo (in the spirit of
 * "Ori and the Blind Forest"): thick lowercase brush strokes with dry-brush
 * edges and tapered flicks, a white-hot core, a golden-orange glow that
 * breathes, a gleam of light running across the letters, sparkles, embers
 * drifting off the strokes and warm smoke behind them.
 *
 * The letters are drawn stroke by stroke from the glyph table below, so the
 * lettering is real brush work rather than a font. Letters that aren't in the
 * table fall back to a brush font.
 *
 * Layers (so the expensive glow filter is rendered only once):
 *   canvas  smoke behind the letters
 *   svg     outer glow (breathing via opacity)
 *   svg     letters: rough brush edges, inner glow, white core, bristle streaks
 *   svg     gleam clipped to the letters
 *   canvas  sparkles and embers in front
 */
(function () {
  'use strict';
  const VN = (globalThis.VN = globalThis.VN || {});

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const rnd = (a, b) => a + Math.random() * (b - a);

  // Glyphs: x-height from y=190 to the baseline at y=376; ascenders reach y=40.
  // Each stroke: centreline points, brush width, start / end thickness (0..1).
  const GLYPHS = {
    s: { adv: 196, strokes: [
      { pts: [[168, 226], [150, 199], [106, 187], [60, 202], [44, 236], [68, 268], [118, 287], [160, 312], [172, 346], [148, 375], [98, 388], [48, 374], [18, 348]], w: 54, a: 0.5, b: 0.28 },
    ] },
    i: { adv: 96, strokes: [
      { pts: [[48, 212], [39, 292], [47, 372]], w: 58, a: 0.75, b: 0.6 },
      { pts: [[24, 170], [44, 138], [74, 114], [110, 100]], w: 44, a: 1, b: 0.04 },
    ] },
    l: { adv: 112, strokes: [
      { pts: [[56, 40], [43, 160], [40, 292], [52, 350], [94, 380]], w: 58, a: 0.4, b: 0.2 },
    ] },
    k: { adv: 196, strokes: [
      { pts: [[48, 40], [36, 210], [40, 376]], w: 58, a: 0.4, b: 0.7 },
      { pts: [[54, 294], [102, 252], [152, 206], [186, 190]], w: 46, a: 0.9, b: 0.14 },
      { pts: [[70, 280], [110, 314], [150, 352], [186, 380]], w: 50, a: 0.9, b: 0.28 },
    ] },
  };

  function catmull(pts, perSeg = 14) {
    const out = [];
    const P = [pts[0], ...pts, pts[pts.length - 1]];
    for (let i = 1; i < P.length - 2; i++) {
      const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
      for (let k = 0; k < perSeg; k++) {
        const t = k / perSeg, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }

  const smooth = (x) => x * x * (3 - 2 * x);

  /** Turn a centreline into a brush-stroke outline with tapered, ragged edges. */
  function brush(stroke, dx, seed) {
    const c = catmull(stroke.pts).map(([x, y]) => [x + dx, y]);
    const n = c.length;
    const ph = [seed * 1.7, seed * 2.9, seed * 4.3, seed * 5.1];
    const left = [], right = [];
    const halfAt = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const p = c[i], q = c[Math.min(n - 1, i + 1)], o = c[Math.max(0, i - 1)];
      let tx = q[0] - o[0], ty = q[1] - o[1];
      const len = Math.hypot(tx, ty) || 1;
      tx /= len; ty /= len;
      let prof = 1;
      if (t < 0.2) prof = stroke.a + (1 - stroke.a) * smooth(t / 0.2);
      if (t > 0.68) prof = 1 - (1 - stroke.b) * smooth((t - 0.68) / 0.32);
      // brush pressure: fuller through the middle, lighter at the lift
      prof *= 1 + 0.12 * Math.sin(Math.PI * t * 1.25);
      const half = (stroke.w / 2) * prof;
      halfAt.push(half);
      const jl = 1 + 0.06 * Math.sin(t * 23 + ph[0]) + 0.04 * Math.sin(t * 61 + ph[1]) + 0.025 * Math.sin(t * 131 + ph[2]);
      const jr = 1 + 0.06 * Math.sin(t * 19 + ph[3]) + 0.04 * Math.sin(t * 53 + ph[0]) + 0.025 * Math.sin(t * 149 + ph[1]);
      left.push([p[0] - ty * half * jl, p[1] + tx * half * jl]);
      right.push([p[0] + ty * half * jr, p[1] - tx * half * jr]);
    }
    // round caps
    const cap = (p, dir, half, from) => {
      const pts = [];
      const base = Math.atan2(dir[1], dir[0]);
      for (let k = 1; k < 8; k++) {
        const a = base + from + (k / 8) * Math.PI;
        pts.push([p[0] + Math.cos(a) * half, p[1] + Math.sin(a) * half]);
      }
      return pts;
    };
    const d0 = [c[0][0] - c[1][0], c[0][1] - c[1][1]];
    const dn = [c[n - 1][0] - c[n - 2][0], c[n - 1][1] - c[n - 2][1]];
    const L0 = Math.hypot(...d0) || 1, Ln = Math.hypot(...dn) || 1;
    const endCap = cap(c[n - 1], [dn[0] / Ln, dn[1] / Ln], halfAt[n - 1], -Math.PI / 2);
    const startCap = cap(c[0], [d0[0] / L0, d0[1] / L0], halfAt[0], -Math.PI / 2);
    const poly = [...left, ...endCap, ...right.reverse(), ...startCap];
    const toPath = (pts) => `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')} Z`;
    // Bristles: thin strands that run past the body and split apart where the
    // brush lifts off, giving the dry, feathered ends of real brush work.
    const bristles = [];
    for (let k = 0; k < 7; k++) {
      const off = -0.78 + (k / 6) * 1.56 + (Math.sin(seed * 7 + k * 3) * 0.08);
      const endT = 0.9 + 0.1 * Math.abs(Math.sin(seed * 3 + k * 5));
      const bw = 0.2 + 0.12 * Math.abs(Math.sin(seed + k * 2));
      const L = [], R = [];
      const last = Math.round(endT * (n - 1));
      for (let i = Math.round(n * 0.45); i <= last; i++) {
        const t = i / (n - 1);
        const p = c[i], q = c[Math.min(n - 1, i + 1)], o = c[Math.max(0, i - 1)];
        let tx = q[0] - o[0], ty = q[1] - o[1];
        const len = Math.hypot(tx, ty) || 1;
        tx /= len; ty /= len;
        const spread = 1 + 0.5 * smooth(Math.max(0, (t - 0.75) / 0.25)); // strands fan out at the tip
        const cxo = halfAt[i] * off * spread;
        const w = Math.max(0.6, halfAt[i] * bw * (1 - smooth(Math.max(0, (t - endT + 0.12) / 0.12))));
        L.push([p[0] - ty * (cxo - w), p[1] + tx * (cxo - w)]);
        R.push([p[0] - ty * (cxo + w), p[1] + tx * (cxo + w)]);
      }
      if (L.length > 2) bristles.push(toPath([...L, ...R.reverse()]));
    }
    const d = toPath(poly) + bristles.join(' ');
    // dry-brush bristle streaks along the stroke
    const streaks = [-0.5, 0.45].map((off, k) => {
      const from = Math.floor(n * (0.35 + 0.1 * k)), to = n - 1;
      const pts = [];
      for (let i = from; i <= to; i++) {
        const t = i / (n - 1);
        const p = c[i], q = c[Math.min(n - 1, i + 1)], o = c[Math.max(0, i - 1)];
        let tx = q[0] - o[0], ty = q[1] - o[1];
        const len = Math.hypot(tx, ty) || 1;
        tx /= len; ty /= len;
        const h = halfAt[i] * off * (1 + 0.1 * Math.sin(t * 30 + k));
        pts.push(`${(p[0] - ty * h).toFixed(1)} ${(p[1] + tx * h).toFixed(1)}`);
      }
      return `M${pts.join(' L')}`;
    });
    const centre = `M${c.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')}`;
    return { d, streaks, centre, points: c, halfAt };
  }

  function build(title, subtitle, { animate = true } = {}) {
    const uid = `bl${Math.random().toString(36).slice(2, 7)}`;
    const word = title.toLowerCase();
    let x = 0;
    const strokes = [];
    const fallback = [];
    let seed = 1;
    for (const ch of word) {
      const g = GLYPHS[ch];
      if (!g) {
        if (ch.trim()) fallback.push(`<text x="${x + 10}" y="376" font-size="250" font-family="Knewave, 'Kaushan Script', cursive">${esc(ch)}</text>`);
        x += ch.trim() ? 170 : 90;
        continue;
      }
      for (const s of g.strokes) strokes.push(brush(s, x, seed++));
      x += g.adv - 8;
    }
    const width = x;
    const sub = subtitle ? esc(subtitle.toUpperCase()) : '';
    // Viewbox leaves room around the letters for the glow.
    const VB = `viewBox="-110 -60 ${width + 220} 600"`;
    const shapes = strokes.map((s) => `<path d="${s.d}"/>`).join('');
    const streaks = strokes.map((s) => s.streaks.map((d) => `<path d="${d}"/>`).join('')).join('');
    const subtitleSvg = sub ? `<text x="${width / 2}" y="470" text-anchor="middle" font-family="'Julius Sans One', 'Josefin Sans', sans-serif" font-size="40" letter-spacing="7">${sub}</text>` : '';
    const reveal = strokes.map((s, i) => `<path class="bl-reveal" pathLength="1" d="${s.centre}" stroke-width="${Math.max(...s.halfAt) * 2 + 40}" style="animation-delay:${(0.25 + i * 0.22).toFixed(2)}s"/>`).join('');

    const wrap = VN.h('div.title-logo.brush-logo', { role: 'img', 'aria-label': [title, subtitle].filter(Boolean).join(': ') });
    wrap.innerHTML = `
<canvas class="bl-smoke" aria-hidden="true"></canvas>
<svg class="bl-layer bl-outer" ${VB} aria-hidden="true" focusable="false">
  <defs>
    <filter id="${uid}-outer" x="-40%" y="-60%" width="180%" height="220%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="9" result="b1"/>
      <feFlood flood-color="#ffd27a"/><feComposite in2="b1" operator="in" result="g1"/>
      <feGaussianBlur in="SourceAlpha" stdDeviation="24" result="b2"/>
      <feFlood flood-color="#ff9a2e" flood-opacity="0.95"/><feComposite in2="b2" operator="in" result="g2"/>
      <feGaussianBlur in="SourceAlpha" stdDeviation="60" result="b3"/>
      <feFlood flood-color="#ff6a00" flood-opacity="0.6"/><feComposite in2="b3" operator="in" result="g3"/>
      <feMerge><feMergeNode in="g3"/><feMergeNode in="g2"/><feMergeNode in="g2"/><feMergeNode in="g1"/></feMerge>
    </filter>
  </defs>
  <g filter="url(#${uid}-outer)" fill="#fff">${shapes}${fallback.join('')}</g>
</svg>
<svg class="bl-main" ${VB} aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="${uid}-core" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fffef8"/>
      <stop offset="0.6" stop-color="#fff6de"/>
      <stop offset="1" stop-color="#ffe2a6"/>
    </linearGradient>
    <filter id="${uid}-paint" x="-15%" y="-20%" width="130%" height="140%" color-interpolation-filters="sRGB">
      <!-- dry-brush edges -->
      <feTurbulence type="fractalNoise" baseFrequency="0.035 0.06" numOctaves="3" seed="4" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="12" xChannelSelector="R" yChannelSelector="G" result="rough"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" seed="9" result="fine"/>
      <feDisplacementMap in="rough" in2="fine" scale="4.5" xChannelSelector="R" yChannelSelector="G" result="ragged"/>
      <!-- tight golden rim glow -->
      <feGaussianBlur in="ragged" stdDeviation="3.5" result="rim"/>
      <feColorMatrix in="rim" type="matrix" values="0 0 0 0 1  0 0 0 0 0.82  0 0 0 0 0.45  0 0 0 1.4 0" result="rimGold"/>
      <feMerge><feMergeNode in="rimGold"/><feMergeNode in="ragged"/></feMerge>
    </filter>
    <filter id="${uid}-subglow" x="-10%" y="-60%" width="120%" height="220%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="b"/>
      <feFlood flood-color="#ffc05a"/><feComposite in2="b" operator="in" result="g"/>
      <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <mask id="${uid}-m2" maskUnits="userSpaceOnUse" x="-400" y="-400" width="${width + 800}" height="1400"><g fill="none" stroke="#fff" stroke-linecap="round">${reveal}</g><rect class="bl-reveal-sub" x="-400" y="400" width="${width + 800}" height="200" fill="#fff"/></mask>
  </defs>
  <g class="bl-masked" mask="url(#${uid}-m2)">
    <g filter="url(#${uid}-paint)" fill="url(#${uid}-core)">${shapes}${fallback.join('')}
      <g fill="none" stroke="#f6c46e" stroke-opacity="0.24" stroke-width="1.4" stroke-linecap="round">${streaks}</g>
    </g>
    <g filter="url(#${uid}-subglow)" fill="#fff8e6">${subtitleSvg}</g>
  </g>
</svg>
<svg class="bl-layer bl-front" ${VB} aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="${uid}-gleam" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="${uid}-clip">${shapes}</clipPath>
  </defs>
  <g clip-path="url(#${uid}-clip)"><rect class="bl-gleam" x="-300" y="-60" width="140" height="560" fill="url(#${uid}-gleam)"/></g>
</svg>
<canvas class="bl-sparks" aria-hidden="true"></canvas>`;

    const vb = { x: -110, y: -60, w: width + 220, h: 600 };
    // Once the letters have been painted in, drop the masks so the glow is rendered only once.
    setTimeout(() => wrap.querySelectorAll('.bl-masked').forEach((g) => g.removeAttribute('mask')), animate ? 3200 : 0);
    if (!animate) wrap.classList.add('still');
    startParticles(wrap, strokes, vb, animate);
    return wrap;
  }

  // ---- smoke behind, sparkles and embers in front ------------------------------------
  function startParticles(wrap, strokes, vb, animate) {
    const smoke = wrap.querySelector('.bl-smoke');
    const sparks = wrap.querySelector('.bl-sparks');
    const sx = smoke.getContext('2d');
    const kx = sparks.getContext('2d');
    // every point along the strokes, to spawn embers and sparkles from
    const spots = [];
    strokes.forEach((s) => s.points.forEach((p, i) => {
      const q = s.points[Math.min(s.points.length - 1, i + 1)], o = s.points[Math.max(0, i - 1)];
      const len = Math.hypot(q[0] - o[0], q[1] - o[1]) || 1;
      spots.push({ x: p[0], y: p[1], h: s.halfAt[i], nx: -(q[1] - o[1]) / len, ny: (q[0] - o[0]) / len });
    }));
    const spot = () => spots[Math.floor(Math.random() * spots.length)];

    const puffs = Array.from({ length: 16 }, () => ({
      x: rnd(vb.x + 260, vb.x + vb.w - 260), y: rnd(vb.y + 250, vb.y + vb.h - 250), r: rnd(110, 200),
      vx: rnd(4, 14), vy: rnd(-6, 2), ph: rnd(0, 6.28), dark: Math.random() < 0.72,
    }));
    const embers = [];
    const stars = [];
    let t = 0, last = 0, W = 0, H = 0, scale = 1;

    const size = () => {
      const r = sparks.getBoundingClientRect();
      if (!r.width) return false;
      const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
      W = Math.min(3200, Math.round(r.width * dpr));
      H = Math.round((W * vb.h) / vb.w);
      if (sparks.width !== W) { sparks.width = smoke.width = W; sparks.height = smoke.height = H; }
      scale = W / vb.w;
      return true;
    };

    const emberSprite = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 48;
      const x = c.getContext('2d'); const g = x.createRadialGradient(24, 24, 0, 24, 24, 24);
      g.addColorStop(0, 'rgba(255,255,235,1)'); g.addColorStop(0.2, 'rgba(255,214,120,0.95)'); g.addColorStop(0.5, 'rgba(255,150,50,0.4)'); g.addColorStop(1, 'rgba(255,110,20,0)');
      x.fillStyle = g; x.fillRect(0, 0, 48, 48); return c;
    })();
    const starSprite = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 96;
      const x = c.getContext('2d'); x.translate(48, 48);
      const g = x.createRadialGradient(0, 0, 0, 0, 0, 48);
      g.addColorStop(0, 'rgba(255,255,245,1)'); g.addColorStop(0.15, 'rgba(255,230,170,0.6)'); g.addColorStop(1, 'rgba(255,190,90,0)');
      x.fillStyle = g; x.fillRect(-48, -48, 96, 96);
      x.fillStyle = '#fff';
      x.beginPath();
      for (let i = 0; i < 8; i++) { const r = i % 2 ? 2.6 : 46; const a = (i / 8) * Math.PI * 2; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      x.fill();
      return c;
    })();

    const step = (now) => {
      if (!wrap.isConnected && t > 1) return;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      t += dt;
      if (!W && !size()) { requestAnimationFrame(step); return; }
      if (Math.random() < 0.02) size();
      const intro = Math.min(1, t / 2.6);

      // smoke: dark haze for contrast, with a warm smouldering edge
      sx.setTransform(1, 0, 0, 1, 0, 0);
      sx.clearRect(0, 0, W, H);
      sx.setTransform(scale, 0, 0, scale, -vb.x * scale, -vb.y * scale);
      for (const p of puffs) {
        p.x += (p.vx + Math.sin(t * 0.2 + p.ph) * 6) * dt;
        p.y += (p.vy + Math.cos(t * 0.17 + p.ph) * 4) * dt;
        // keep each puff fully inside the canvas: drift back when it nears an edge
        const minX = vb.x + p.r + 4, maxX = vb.x + vb.w - p.r - 4, minY = vb.y + p.r + 4, maxY = vb.y + vb.h - p.r - 4;
        if (p.x > maxX || p.x < minX) p.vx = -p.vx;
        if (p.y > maxY || p.y < minY) p.vy = -p.vy;
        p.x = Math.min(maxX, Math.max(minX, p.x));
        p.y = Math.min(maxY, Math.max(minY, p.y));
        const g = sx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        if (p.dark) { g.addColorStop(0, `rgba(18,8,3,${0.5 * intro})`); g.addColorStop(1, 'rgba(18,8,3,0)'); }
        else { g.addColorStop(0, `rgba(255,140,50,${0.13 * intro})`); g.addColorStop(1, 'rgba(255,120,30,0)'); }
        sx.fillStyle = g;
        sx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      }

      // embers drifting up and away from the strokes
      kx.setTransform(1, 0, 0, 1, 0, 0);
      kx.clearRect(0, 0, W, H);
      kx.setTransform(scale, 0, 0, scale, -vb.x * scale, -vb.y * scale);
      kx.globalCompositeOperation = 'lighter';
      if (animate && embers.length < 70 && Math.random() < 0.55 * intro) {
        const s = spot();
        const side = Math.random() < 0.5 ? -1 : 1;
        const out = s.h + rnd(4, 16);
        embers.push({ x: s.x + s.nx * out * side, y: s.y + s.ny * out * side, vx: s.nx * side * rnd(8, 22) + rnd(10, 34), vy: s.ny * side * rnd(8, 22) - rnd(18, 46), life: rnd(1.6, 3.4), age: 0, sz: rnd(3, 8), ph: rnd(0, 6.28) });
      }
      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i];
        e.age += dt;
        if (e.age > e.life) { embers.splice(i, 1); continue; }
        e.x += (e.vx + Math.sin(t * 2 + e.ph) * 14) * dt;
        e.y += e.vy * dt;
        const k = e.age / e.life;
        kx.globalAlpha = (k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85) * (0.6 + 0.4 * Math.sin(t * 9 + e.ph));
        const z = e.sz * (1 - k * 0.5);
        kx.drawImage(emberSprite, e.x - z, e.y - z, z * 2, z * 2);
      }

      // sparkles glinting on the letters
      if (animate && stars.length < 5 && Math.random() < 0.05 * intro) {
        const s = spot();
        stars.push({ x: s.x + rnd(-s.h * 0.6, s.h * 0.6), y: s.y + rnd(-s.h * 0.6, s.h * 0.6), age: 0, life: rnd(0.6, 1.1), sz: rnd(34, 70), rot: rnd(0, 0.8) });
      }
      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        s.age += dt;
        if (s.age > s.life) { stars.splice(i, 1); continue; }
        const k = Math.sin((s.age / s.life) * Math.PI);
        kx.globalAlpha = k;
        const z = s.sz * (0.3 + 0.7 * k);
        kx.save();
        kx.translate(s.x, s.y);
        kx.rotate(s.rot + s.age * 1.2);
        kx.drawImage(starSprite, -z / 2, -z / 2, z, z);
        kx.restore();
      }
      kx.globalAlpha = 1;
      kx.globalCompositeOperation = 'source-over';
      if (animate || t < 0.2) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  VN.buildBrushLogo = build;
})();
