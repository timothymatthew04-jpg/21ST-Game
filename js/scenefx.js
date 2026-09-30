/*
 * scenefx.js — brings backgrounds to life: falling petals and leaves, rain and
 * snow, fireflies, dust in the light, glints on water, twinkling stars, smoke,
 * steam, embers, birds, flickering lanterns, glowing moons, light rays, drifting
 * mist and a boat's gentle rocking.
 *
 * Effects are declared per background in the story script (see docs/SCRIPTING.md):
 *
 *   bgfx hara_kei_estate leaves flame=0.287,0.665,0.03 glints=0.24,0.8,0.54,0.18
 *
 * Positions and sizes are fractions of the picture, so they stay on the lantern
 * or the pond whatever shape the window is. Particles are drawn on a small canvas
 * that is scaled up without smoothing, so they read as pixel art like the scenes.
 */
(function () {
  'use strict';
  const VN = globalThis.VN;
  const h = VN.h;

  const PX = 720 / 270; // one pixel of the pixel-art scenes, in stage units
  const SUB = 2; // the particle canvas has SUB×SUB canvas pixels for every art pixel
  const TAU = Math.PI * 2;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  // ---------------------------------------------------------------- the shared animation loop
  const running = new Set();
  let raf = 0;
  let last = 0;
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    // a slow-motion moment slows the particles too (VN.fxTimeScale)
    const k = VN.fxTimeScale == null ? 1 : VN.fxTimeScale;
    for (const fx of running) fx.frame(dt * k, now / 1000);
    raf = running.size ? requestAnimationFrame(loop) : 0;
  }
  function start(fx) {
    running.add(fx);
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
  }

  // ---------------------------------------------------------------- falling things
  const FALL = {
    petals: { n: 28, colors: ['#f9c9dc', '#f2a9c8', '#ffe0ec', '#e68db5'], size: [2, 3], vx: [10, 22], vy: [7, 14], sway: 8, alpha: 0.95 },
    leaves: { n: 20, colors: ['#e0803a', '#c95a2c', '#efb341', '#a8452a', '#d9962f'], size: [2, 3], vx: [8, 20], vy: [9, 16], sway: 10, alpha: 0.95 },
    foliage: { n: 16, colors: ['#a7c95c', '#e2cf6a', '#7fa847', '#f0e08a'], size: [2, 2], vx: [4, 12], vy: [6, 11], sway: 9, alpha: 0.85 },
    snow: { n: 70, colors: ['#ffffff', '#e8eefc', '#d6e0f5'], size: [1, 2], vx: [-3, 5], vy: [8, 16], sway: 5, alpha: 0.9 },
    ash: { n: 50, colors: ['#8d8480', '#6f6664', '#b3a8a0', '#4f4846'], size: [1, 2], vx: [2, 9], vy: [4, 10], sway: 7, alpha: 0.8 },
  };

  /** Optional region (fractions of the picture) that particles stay inside, e.g. a window. */
  function regionOf(nums, from) {
    return nums.length >= from + 4 ? { x: nums[from], y: nums[from + 1], w: nums[from + 2], h: nums[from + 3] } : null;
  }
  function clipTo(c, box) {
    if (!box) return;
    c.save();
    c.beginPath();
    c.rect(box.x, box.y, box.w, box.h);
    c.clip();
  }
  function scaleBox(reg, W, H) {
    return reg ? { x: reg.x * W, y: reg.y * H, w: reg.w * W, h: reg.h * H } : null;
  }

  class Falling {
    constructor(kind, density, region) {
      this.k = FALL[kind];
      this.region = region;
      this.n = Math.max(1, Math.round(this.k.n * (density || 1) * (region ? Math.max(0.15, region.w * region.h * 1.5) : 1)));
      this.p = [];
    }
    resize(W, H) {
      const first = !this.W;
      this.W = W;
      this.H = H;
      this.box = scaleBox(this.region, W, H);
      if (first) for (let i = 0; i < this.n; i++) this.p.push(this.spawn(true));
    }
    spawn(anywhere) {
      const k = this.k;
      const b = this.box || { x: 0, y: 0, w: this.W, h: this.H };
      const fromSide = !anywhere && !this.box && Math.random() < 0.45;
      return {
        x: anywhere ? b.x + rnd(0, b.w) : fromSide ? rnd(-12, -2) : b.x + rnd(-b.w * 0.2, b.w * 0.95),
        y: anywhere ? b.y + rnd(0, b.h) : fromSide ? rnd(-10, this.H * 0.55) : b.y + rnd(-12, -2),
        vx: rnd(k.vx[0], k.vx[1]),
        vy: rnd(k.vy[0], k.vy[1]),
        ph: rnd(0, TAU),
        sw: rnd(0.6, 1.6),
        tumble: rnd(1.5, 4),
        c: pick(k.colors),
        s: Math.round(rnd(k.size[0], k.size[1] + 0.99)),
        a: anywhere ? 1 : 0,
      };
    }
    step(dt, t) {
      for (let i = 0; i < this.p.length; i++) {
        const p = this.p[i];
        p.a = Math.min(1, p.a + dt / 0.8);
        p.x += (p.vx + Math.sin(t * p.sw + p.ph) * this.k.sway) * dt;
        p.y += p.vy * dt;
        const b = this.box;
        if (b ? p.y > b.y + b.h + 2 || p.x > b.x + b.w + 4 : p.y > this.H + 4 || p.x > this.W + 6) this.p[i] = this.spawn(false);
      }
    }
    draw(c, t) {
      clipTo(c, this.box);
      for (const p of this.p) {
        c.globalAlpha = p.a * this.k.alpha;
        c.fillStyle = p.c;
        // tumbling: the petal narrows to a sliver and opens again
        const f = Math.abs(Math.cos(t * p.tumble + p.ph));
        const w = f > 0.45 ? p.s : 1;
        c.fillRect(Math.round(p.x), Math.round(p.y), w, p.s > 1 && f > 0.8 ? p.s - 1 : 1 + (p.s > 2 ? 1 : 0));
      }
      if (this.box) c.restore();
    }
  }

  class Rain {
    constructor(density, region) {
      this.region = region;
      this.n = Math.round(140 * (density || 1) * (region ? Math.max(0.15, region.w * region.h * 1.5) : 1));
      this.p = [];
    }
    resize(W, H) {
      const first = !this.W;
      this.W = W;
      this.H = H;
      this.box = scaleBox(this.region, W, H) || { x: 0, y: 0, w: W, h: H };
      if (first) for (let i = 0; i < this.n; i++) this.p.push(this.spawn(true));
    }
    spawn(anywhere) {
      const b = this.box;
      return { x: b.x + rnd(-10, b.w + 20), y: anywhere ? b.y + rnd(0, b.h) : b.y - rnd(4, 30), v: rnd(170, 240), len: Math.round(rnd(3, 6)), a: rnd(0.25, 0.55) };
    }
    step(dt) {
      for (let i = 0; i < this.p.length; i++) {
        const p = this.p[i];
        p.y += p.v * dt;
        p.x -= p.v * 0.18 * dt;
        if (p.y > this.box.y + this.box.h + 6) this.p[i] = this.spawn(false);
      }
    }
    draw(c) {
      clipTo(c, this.region ? this.box : null);
      c.fillStyle = '#b9cdf0';
      for (const p of this.p) {
        c.globalAlpha = p.a;
        for (let i = 0; i < p.len; i++) c.fillRect(Math.round(p.x + i * 0.18), Math.round(p.y - i), 1, 1);
      }
      if (this.region) c.restore();
    }
  }

  // ---------------------------------------------------------------- things that live in one region
  /**
   * The northern lights: curtains of light rippling slowly across the sky, bright green at their
   * feet, teal and violet as they rise, shimmering with rays. `aurora=top,height[,strength,flip]`:
   * with flip, the curtains hang downward from `top` instead, fainter: their reflection in water.
   */
  class Aurora {
    constructor(nums) {
      const [top = 0.05, hh = 0.4, strength = 1, flip = 0] = nums;
      this.o = { top, hh, strength, flip: !!flip };
      this.bands = [0, 1, 2].map((i) => ({ at: 0.55 + i * 0.18, height: 0.55 + i * 0.12, alpha: [0.55, 0.42, 0.3][i], ph: Math.random() * TAU, k: 0.012 + i * 0.006, w: 0.12 + i * 0.05 }));
      this.strip = document.createElement('canvas');
      this.strip.width = 1; this.strip.height = 64;
      const g = this.strip.getContext('2d'), gr = g.createLinearGradient(0, 64, 0, 0);
      gr.addColorStop(0, 'rgba(150,255,190,1)'); gr.addColorStop(0.12, 'rgba(90,240,160,0.95)'); gr.addColorStop(0.4, 'rgba(60,200,170,0.6)');
      gr.addColorStop(0.72, 'rgba(90,110,240,0.3)'); gr.addColorStop(1, 'rgba(170,80,220,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 1, 64);
    }
    resize(W, H) { this.W = W; this.H = H; }
    step() {}
    draw(c, t) {
      const { top, hh, strength, flip } = this.o, W = this.W, H = this.H;
      c.globalCompositeOperation = 'lighter';
      for (const b of this.bands) {
        for (let x = 0; x < W; x += 1) {
          const wave = Math.sin(x * b.k + t * b.w + b.ph) * H * 0.05 + Math.sin(x * b.k * 2.7 - t * b.w * 1.6 + b.ph * 2) * H * 0.02;
          const ch = H * hh * b.height * (0.55 + 0.45 * Math.sin(x * b.k * 1.9 + t * b.w * 0.7 + b.ph * 3));
          const fold = Math.pow(0.5 + 0.5 * Math.sin(x * b.k * 3.3 + t * 0.35 + b.ph), 1.5);
          const rays = 0.65 + 0.35 * Math.sin(x * 0.9 + t * 2.2 + b.ph) * Math.sin(x * 0.37 - t * 1.3);
          const a = strength * b.alpha * fold * rays * (flip ? 0.4 : 1);
          if (a < 0.02) continue;
          c.globalAlpha = Math.min(1, a);
          if (!flip) { const base = H * (top + hh * b.at) + wave; c.drawImage(this.strip, x, base - ch, 1, ch); }
          else { const base = H * top - wave * 0.3; c.save(); c.translate(0, base * 2); c.scale(1, -1); c.drawImage(this.strip, x, base - ch * 0.6, 1, ch * 0.6); c.restore(); }
        }
      }
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
    }
  }

  class Region {
    constructor(nums, fallbackN) {
      const [x = 0, y = 0, w = 1, hh = 1, n = fallbackN] = nums;
      this.r = { x, y, w, h: hh };
      this.n = n;
      this.p = [];
    }
    resize(W, H) {
      const r = this.r;
      this.box = { x: r.x * W, y: r.y * H, w: r.w * W, h: r.h * H };
      if (!this.p.length) for (let i = 0; i < this.n; i++) this.p.push(this.spawn());
      else for (const p of this.p) Object.assign(p, this.place(p));
    }
    place() { return { x: this.box.x + Math.random() * this.box.w, y: this.box.y + Math.random() * this.box.h }; }
  }

  class Fireflies extends Region {
    constructor(nums) { super(nums, 14); }
    spawn() { return { ...this.place(), vx: rnd(-4, 4), vy: rnd(-3, 3), ph: rnd(0, TAU), sp: rnd(0.8, 2) }; }
    step(dt) {
      const b = this.box;
      for (const p of this.p) {
        p.vx += rnd(-12, 12) * dt;
        p.vy += rnd(-10, 10) * dt;
        p.vx = Math.max(-6, Math.min(6, p.vx));
        p.vy = Math.max(-5, Math.min(5, p.vy));
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < b.x || p.x > b.x + b.w) p.vx *= -1;
        if (p.y < b.y || p.y > b.y + b.h) p.vy *= -1;
      }
    }
    draw(c, t) {
      c.globalCompositeOperation = 'lighter';
      for (const p of this.p) {
        const k = Math.max(0, Math.sin(t * p.sp + p.ph));
        if (k < 0.05) continue;
        const x = Math.round(p.x), y = Math.round(p.y);
        c.globalAlpha = 0.22 * k;
        c.fillStyle = '#b8f25a';
        c.fillRect(x - 1, y - 1, 3, 3);
        c.globalAlpha = k;
        c.fillStyle = '#f6ffc4';
        c.fillRect(x, y, 1, 1);
      }
      c.globalCompositeOperation = 'source-over';
    }
  }

  class Motes extends Region {
    constructor(nums, color) { super(nums, 22); this.color = color || '#fff0c8'; }
    spawn() { return { ...this.place(), vx: rnd(-2, 2), vy: rnd(-3, -0.5), ph: rnd(0, TAU), sp: rnd(0.5, 1.5) }; }
    step(dt) {
      const b = this.box;
      for (const p of this.p) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.y < b.y) { p.y = b.y + b.h; p.x = b.x + Math.random() * b.w; }
        if (p.x < b.x) p.x += b.w;
        if (p.x > b.x + b.w) p.x -= b.w;
      }
    }
    draw(c, t) {
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = this.color;
      for (const p of this.p) {
        c.globalAlpha = 0.25 + 0.3 * Math.max(0, Math.sin(t * p.sp + p.ph));
        c.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
      }
      c.globalCompositeOperation = 'source-over';
    }
  }

  class Glints extends Region {
    constructor(nums, color) { super(nums, 18); this.color = color || '#eef6ff'; }
    spawn() { return { ...this.place(), life: rnd(0, 1.2), dur: rnd(0.4, 1.1) }; }
    step(dt) {
      for (const p of this.p) {
        p.life += dt;
        if (p.life > p.dur) Object.assign(p, this.place(), { life: 0, dur: rnd(0.4, 1.1) });
      }
    }
    draw(c) {
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = this.color;
      for (const p of this.p) {
        const k = Math.sin((p.life / p.dur) * Math.PI);
        const x = Math.round(p.x), y = Math.round(p.y);
        c.globalAlpha = k * 0.9;
        c.fillRect(x, y, 2, 1);
        if (k > 0.75) { c.globalAlpha = (k - 0.75) * 2.4; c.fillRect(x - 1, y, 4, 1); c.fillRect(x + 1, y - 1, 1, 3); }
      }
      c.globalCompositeOperation = 'source-over';
    }
  }

  class Stars extends Region {
    constructor(nums) { super(nums, 26); }
    spawn() { return { ...this.place(), ph: rnd(0, TAU), sp: rnd(0.6, 2.2), big: Math.random() < 0.15 }; }
    step() {}
    draw(c, t) {
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = '#eef3ff';
      for (const p of this.p) {
        const k = 0.5 + 0.5 * Math.sin(t * p.sp + p.ph);
        const x = Math.round(p.x), y = Math.round(p.y);
        c.globalAlpha = 0.15 + 0.75 * k;
        c.fillRect(x, y, 1, 1);
        if (p.big && k > 0.7) { c.globalAlpha = (k - 0.7) * 1.6; c.fillRect(x - 1, y, 3, 1); c.fillRect(x, y - 1, 1, 3); }
      }
      c.globalCompositeOperation = 'source-over';
    }
  }

  // ---------------------------------------------------------------- things that rise from a point
  class Rising {
    constructor(kind, nums, color) {
      const [x = 0.5, y = 0.5, scale = 1] = nums;
      this.kind = kind;
      this.at = { x, y };
      this.scale = scale;
      this.color = color;
      this.n = { smoke: 14, steam: 8, embers: 22 }[kind];
      this.p = [];
    }
    resize(W, H) {
      this.W = W;
      this.H = H;
      this.o = { x: this.at.x * W, y: this.at.y * H };
      if (!this.p.length) for (let i = 0; i < this.n; i++) { const p = this.spawn(); p.age = rnd(0, p.life); this.p.push(p); }
    }
    spawn() {
      const s = this.scale;
      if (this.kind === 'embers') return { x: this.o.x + rnd(-6, 6) * s, y: this.o.y, vx: rnd(-4, 4), vy: rnd(-26, -12) * s, age: 0, life: rnd(1, 2.4), ph: rnd(0, TAU) };
      if (this.kind === 'steam') return { x: this.o.x + rnd(-1.5, 1.5) * s, y: this.o.y, vx: rnd(-1, 1), vy: rnd(-7, -4) * s, age: 0, life: rnd(1.8, 3), r0: 1.2 * s, r1: rnd(4, 6) * s, ph: rnd(0, TAU) };
      return { x: this.o.x + rnd(-2, 2) * s, y: this.o.y, vx: rnd(2, 6), vy: rnd(-13, -8) * s, age: 0, life: rnd(7, 10), r0: 2 * s, r1: rnd(14, 22) * s, ph: rnd(0, TAU) };
    }
    step(dt) {
      for (let i = 0; i < this.p.length; i++) {
        const p = this.p[i];
        p.age += dt;
        p.x += (p.vx + Math.sin(p.age * 1.7 + p.ph) * (this.kind === 'embers' ? 6 : 1.5)) * dt;
        p.y += p.vy * dt;
        if (p.age > p.life) this.p[i] = this.spawn();
      }
    }
    draw(c) {
      if (this.kind === 'embers') {
        c.globalCompositeOperation = 'lighter';
        for (const p of this.p) {
          const k = 1 - p.age / p.life;
          c.globalAlpha = k * (0.6 + 0.4 * Math.sin(p.age * 20 + p.ph));
          c.fillStyle = k > 0.6 ? '#ffe08a' : k > 0.3 ? '#ff9a3c' : '#d9482b';
          c.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
        }
        c.globalCompositeOperation = 'source-over';
        return;
      }
      const col = this.color || (this.kind === 'steam' ? '#f4f6ff' : '#8d8f98');
      const peak = this.kind === 'steam' ? 0.16 : 0.3;
      for (const p of this.p) {
        const k = p.age / p.life;
        const r = p.r0 + (p.r1 - p.r0) * k;
        const a = Math.min(1, p.age / 0.6) * (1 - k) * peak;
        const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, col);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        c.globalAlpha = a;
        c.fillStyle = g;
        c.fillRect(p.x - r, p.y - r, r * 2, r * 2);
      }
    }
  }

  // ---------------------------------------------------------------- birds
  const WINGS = [
    [[-2, -2], [-1, -1], [0, 0], [1, -1], [2, -2]],
    [[-2, -1], [-1, -1], [0, 0], [1, -1], [2, -1]],
    [[-2, 0], [-1, -1], [0, 0], [1, -1], [2, 0]],
  ];
  class Birds {
    constructor(nums) { const [n = 4, y0 = 0.06, y1 = 0.4] = nums; this.n = n; this.y = [y0, y1]; this.p = []; }
    resize(W, H) {
      const first = !this.W;
      this.W = W;
      this.H = H;
      if (first) for (let i = 0; i < this.n; i++) { const b = this.spawn(); b.x = rnd(-60, W); this.p.push(b); }
    }
    spawn() {
      return { x: rnd(-160, -10), y: rnd(this.y[0], this.y[1]) * this.H, vx: rnd(18, 30), ph: rnd(0, TAU), fl: rnd(7, 10), bob: rnd(0, TAU) };
    }
    step(dt) {
      for (let i = 0; i < this.p.length; i++) {
        const b = this.p[i];
        b.x += b.vx * dt;
        b.bob += dt;
        if (b.x > this.W + 8) this.p[i] = this.spawn();
      }
    }
    draw(c, t) {
      c.globalAlpha = 0.85;
      c.fillStyle = '#1c1b28';
      for (const b of this.p) {
        const f = WINGS[Math.floor((t * b.fl + b.ph) % 3)];
        const x = Math.round(b.x), y = Math.round(b.y + Math.sin(b.bob * 2) * 1.5);
        for (const [dx, dy] of f) c.fillRect(x + dx, y + dy, 1, 1);
      }
    }
  }

  // birds fluttering inside a cage
  class Flutter extends Region {
    constructor(nums) { super(nums, 16); }
    spawn() {
      return { ...this.place(), vx: 0, vy: 0, rest: rnd(0, 3), ph: rnd(0, TAU), c: pick(['#f2d15a', '#e2553f', '#6fb7e8', '#f4f1ea', '#9bd46a', '#f08bb0']) };
    }
    step(dt) {
      const b = this.box;
      for (const p of this.p) {
        if (p.rest > 0) {
          p.rest -= dt;
          if (p.rest <= 0) { p.vx = rnd(-26, 26); p.vy = rnd(-18, 8); p.fly = rnd(0.5, 1.6); }
          continue;
        }
        p.fly -= dt;
        p.vy += 6 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < b.x || p.x > b.x + b.w) { p.vx *= -1; p.x = Math.max(b.x, Math.min(b.x + b.w, p.x)); }
        if (p.y < b.y || p.y > b.y + b.h) { p.vy *= -0.6; p.y = Math.max(b.y, Math.min(b.y + b.h, p.y)); }
        if (p.fly <= 0) p.rest = rnd(0.8, 3.5);
      }
    }
    draw(c, t) {
      for (const p of this.p) {
        const x = Math.round(p.x), y = Math.round(p.y);
        c.globalAlpha = 0.95;
        c.fillStyle = p.c;
        if (p.rest > 0) { c.fillRect(x, y, 2, 1); c.fillRect(x + 1, y - 1, 1, 1); continue; }
        const f = WINGS[Math.floor((t * 12 + p.ph) % 3)];
        for (const [dx, dy] of f) c.fillRect(x + dx, y + dy, 1, 1);
      }
    }
  }

  // ---------------------------------------------------------------- grass in the wind
  /** Mix two #rrggbb colours: t = 0 gives a, 1 gives b. */
  function mix(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = (sh) => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t);
    return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
  }

  /**
   * grass=y,h,density,plumes,gap0,gap1,#tip — blades rooted from y (a fraction of the picture) to the
   * bottom, up to h tall, nearer ones taller, none between gap0 and gap1 (a path, some steps). A steady breeze, and every few seconds a gust that runs across
   * the field and lays the grass over as it passes. Some blades carry silver-grass plumes.
   */
  class Grass {
    constructor(nums, color) {
      const [y = 0.8, hh = 0.2, density = 1, plumes = 0.25, gap0 = 0, gap1 = 0] = nums;
      Object.assign(this, { y0: y, hh, density, plumes, gap0, gap1, tip: color || '#e8d49a' });
      this.gust = { x: -200, v: 110, next: rnd(1, 4) };
    }
    resize(W, H) {
      this.W = W;
      this.H = H;
      const top = this.y0 * H;
      const n = Math.round(W * 0.85 * this.density);
      const base = '#2e3418';
      this.blades = [];
      for (let i = 0; i < n; i++) {
        const d = Math.pow(Math.random(), 0.65);
        const by = top + d * (H - top + 3);
        const x = rnd(-6, W + 6);
        if (this.gap1 > this.gap0 && x > this.gap0 * W && x < this.gap1 * W) continue;
        this.blades.push({
          x, y: by, d,
          len: this.hh * H * (0.35 + 0.65 * d) * rnd(0.6, 1.1),
          flex: rnd(0.7, 1.3), ph: rnd(0, TAU),
          plume: Math.random() < this.plumes,
          bucket: Math.min(3, Math.floor(d * 4)),
        });
      }
      this.blades.sort((a, b) => a.y - b.y);
      // four depths, far ones hazier and lighter, near ones darker; tips catch the light
      this.cols = [0, 1, 2, 3].map((k) => mix(this.tip, base, 0.25 + k * 0.17));
      this.tipCols = [0, 1, 2, 3].map((k) => mix(this.tip, '#ffffff', 0.25 - k * 0.06));
    }
    wind(x, t) {
      const g = this.gust;
      const gust = Math.exp(-Math.pow((x - g.x) / 55, 2)) * 1.3;
      return 0.35 + 0.28 * Math.sin(t * 1.15 + x * 0.028) + 0.14 * Math.sin(t * 2.4 + x * 0.071) + gust;
    }
    step(dt) {
      if (!this.blades) return;
      const g = this.gust;
      if (g.x > this.W + 200) { g.next -= dt; if (g.next <= 0) { g.x = -150; g.v = rnd(90, 150); g.next = rnd(4, 8); } }
      else g.x += g.v * dt;
    }
    draw(c, t) {
      if (!this.blades) return;
      c.lineWidth = 1;
      c.globalAlpha = 1;
      for (let k = 0; k < 4; k++) {
        c.strokeStyle = this.cols[k];
        c.beginPath();
        for (const b of this.blades) {
          if (b.bucket !== k) continue;
          const w = this.wind(b.x, t) * b.flex + Math.sin(t * 3 + b.ph) * 0.06;
          const tx = b.x + w * b.len * 0.55, ty = b.y - b.len * (1 - 0.18 * w * w);
          c.moveTo(b.x, b.y);
          c.quadraticCurveTo(b.x + w * b.len * 0.08, b.y - b.len * 0.6, tx, ty);
          b.tx = tx; b.ty = ty; b.w = w;
        }
        c.stroke();
        // the light on the tips, and the plumes
        c.strokeStyle = this.tipCols[k];
        c.beginPath();
        for (const b of this.blades) {
          if (b.bucket !== k) continue;
          if (b.plume) {
            const s = 2 + b.d * 4;
            for (let j = 0; j < 4; j++) {
              const f = j / 4;
              const px = b.tx - b.w * s * f * 0.8, py = b.ty + s * f;
              c.moveTo(px, py);
              c.lineTo(px + b.w * s * 0.7 + 1, py - s * 0.35);
            }
          } else {
            c.moveTo(b.tx, b.ty);
            c.lineTo(b.tx - b.w * 1.5, b.ty + 2);
          }
        }
        c.stroke();
      }
    }
  }

  // ---------------------------------------------------------------- war
  const FIRE = ['#fff6d0', '#ffe08a', '#ffb04a', '#ff7a2a'];
  /** Short-lived bits shared by the war effects: smoke puffs (back), debris, then fire and sparks (front). */
  /** A hard-edged disc, row by row, so smoke and fire read as pixel art. */
  function disc(c, cx, cy, r) {
    const R = Math.max(0.5, r), x0 = Math.round(cx), y0 = Math.round(cy), n = Math.floor(R);
    for (let dy = -n; dy <= n; dy++) { const w = Math.floor(Math.sqrt(R * R - dy * dy)); c.fillRect(x0 - w, y0 + dy, w * 2 + 1, 1); }
  }
  class Bits {
    constructor() { this.z = [[], [], []]; }
    add(z, o) { o.age = 0; this.z[z].push(o); }
    step(dt) {
      for (const list of this.z) {
        for (let i = list.length - 1; i >= 0; i--) {
          const b = list[i];
          b.age += dt;
          if (b.age > b.life) { list.splice(i, 1); continue; }
          if (b.g) b.vy += b.g * dt;
          if (b.drag) { const k = Math.max(0, 1 - b.drag * dt); b.vx *= k; b.vy *= k; }
          b.x += (b.vx || 0) * dt;
          b.y += (b.vy || 0) * dt;
          if (b.grow) b.r += b.grow * dt;
        }
      }
    }
    draw(c) {
      for (const list of this.z) {
        for (const b of list) {
          const k = 1 - b.age / b.life;
          const a = (b.a == null ? 1 : b.a) * (b.fadeIn ? Math.min(1, b.age / b.fadeIn) : 1) * (b.hold ? Math.min(1, k * 3) : k);
          if (a <= 0.01) continue;
          if (b.glow) {
            c.globalCompositeOperation = 'lighter';
            const g = c.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
            g.addColorStop(0, b.col);
            g.addColorStop(1, 'rgba(255,120,40,0)');
            c.globalAlpha = a;
            c.fillStyle = g;
            c.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
            c.globalCompositeOperation = 'source-over';
            continue;
          }
          c.globalAlpha = a;
          c.fillStyle = b.col;
          if (b.r) {
            disc(c, b.x, b.y, b.r);
            if (b.hi && b.r > 2) { c.fillStyle = b.hi; disc(c, b.x - b.r * 0.3, b.y - b.r * 0.32, b.r * 0.55); }
          } else c.fillRect(Math.round(b.x), Math.round(b.y), b.s || 1, b.s || 1);
        }
      }
      c.globalAlpha = 1;
    }
  }
  /** An explosion at x, y: a flash, a fireball, dirt thrown up, sparks, and a column of smoke. */
  function blast(bits, x, y, size = 1, smoke = '#3a3030') {
    bits.add(2, { x, y, r: 16 * size, col: 'rgba(255,240,200,0.95)', glow: true, life: 0.22 });
    bits.add(2, { x, y, r: 1.5 * size, grow: 16 * size, col: pick(FIRE.slice(2)), hi: FIRE[1], a: 0.95, life: 0.34 });
    bits.add(2, { x, y: y - 1, r: 1 * size, grow: 9 * size, col: FIRE[0], a: 0.9, life: 0.2 });
    for (let i = 0; i < 12 * size; i++) bits.add(1, { x, y, vx: rnd(-34, 34) * size, vy: rnd(-70, -24) * size, g: 110, col: pick(['#2e2018', '#4a3426', '#6a4a30', '#1e1612']), life: rnd(0.6, 1.3), s: Math.random() < 0.3 ? 2 : 1 });
    for (let i = 0; i < 8; i++) bits.add(2, { x, y, vx: rnd(-40, 40) * size, vy: rnd(-60, -10) * size, g: 70, col: pick(FIRE), life: rnd(0.25, 0.6) });
    for (let i = 0; i < 6; i++) bits.add(0, { x: x + rnd(-3, 3) * size, y: y - rnd(0, 6) * size, r: 2 * size, grow: rnd(4, 7) * size, vx: rnd(1, 5), vy: -rnd(5, 12), drag: 0.25, col: smoke, hi: '#6e5e58', a: rnd(0.55, 0.8), life: rnd(2.5, 4.5), fadeIn: 0.12 });
  }

  /** boom=x,y,at,size — one explosion at x, y, `at` seconds after the picture appears (for cutscenes, in time with a sound). */
  class Boom {
    constructor(nums, color) {
      const [x = 0.5, y = 0.7, at = 1, size = 1.4] = nums;
      Object.assign(this, { xf: x, yf: y, at, size, smoke: color || '#3a3030', t: 0, done: false, bits: new Bits() });
    }
    resize(W, H) { this.W = W; this.H = H; }
    step(dt) {
      if (!this.W) return;
      this.t += dt;
      if (!this.done && this.t >= this.at) { this.done = true; blast(this.bits, this.xf * this.W, this.yf * this.H, this.size, this.smoke); }
      this.bits.step(dt);
    }
    draw(c) { this.bits.draw(c); }
  }

  /** gunfire=y,x0,x1,rate,size — muzzle flashes twinkling along a line (a far battle), with volleys. */
  class Gunfire {
    constructor(nums, color) {
      const [y = 0.66, x0 = 0, x1 = 1, rate = 14, size = 1] = nums;
      Object.assign(this, { yf: y, x0, x1, rate, size, col: color || '#ffe8b0', bits: new Bits(), volley: rnd(1, 3) });
    }
    resize(W, H) { this.W = W; this.H = H; }
    flash(x, y) {
      this.bits.add(2, { x, y, r: 3 * this.size, col: 'rgba(255,230,170,0.9)', glow: true, life: rnd(0.06, 0.14) });
      this.bits.add(2, { x, y, col: this.col, life: rnd(0.05, 0.12), s: this.size > 1.4 ? 2 : 1 });
      if (Math.random() < 0.6) this.bits.add(0, { x, y: y - 1, r: 0.7 * this.size, grow: 1.4 * this.size, vx: rnd(1, 3), vy: -rnd(1, 3), col: '#8a7a78', a: 0.4, life: rnd(1.2, 2.4), fadeIn: 0.1 });
    }
    step(dt) {
      if (!this.W) return;
      const X = (f) => f * this.W;
      const n = this.rate * dt;
      for (let k = 0; k < Math.floor(n) + (Math.random() < n % 1 ? 1 : 0); k++) this.flash(rnd(X(this.x0), X(this.x1)), this.yf * this.H + rnd(-1.5, 1.5));
      this.volley -= dt;
      if (this.volley <= 0) {
        this.volley = rnd(2.5, 5);
        const cx = rnd(X(this.x0), X(this.x1)), len = rnd(14, 40);
        for (let k = 0; k < 16; k++) this.flash(cx + rnd(-len / 2, len / 2), this.yf * this.H + rnd(-1, 1));
      }
      this.bits.step(dt);
    }
    draw(c) { this.bits.draw(c); }
  }

  /** cannon=x,y,period,offset,dir,size — a gun firing every few seconds: flash, fire, and a rolling cloud of smoke. */
  class Cannon {
    constructor(nums) {
      const [x = 0.3, y = 0.6, period = 3, offset = 0.8, dir = 1, size = 1] = nums;
      Object.assign(this, { xf: x, yf: y, period, dir: dir < 0 ? -1 : 1, size, next: offset, bits: new Bits() });
    }
    resize(W, H) { this.W = W; this.H = H; }
    step(dt) {
      if (!this.W) return;
      this.next -= dt;
      if (this.next <= 0) {
        this.next += this.period;
        const x = this.xf * this.W, y = this.yf * this.H, d = this.dir, z = this.size;
        this.bits.add(2, { x: x + d * 6 * z, y, r: 34 * z, col: 'rgba(255,236,190,1)', glow: true, life: 0.2 });
        for (let k = 0; k < 5; k++) this.bits.add(2, { x: x + d * k * 4 * z, y: y + rnd(-1, 1), r: (4 - k * 0.5) * z, grow: 10 * z, vx: d * 40 * z, col: pick(FIRE), a: 0.95, life: 0.12 + k * 0.03 });
        for (let k = 0; k < 12; k++) this.bits.add(0, { x: x + d * 4 * z, y, r: 2.5 * z, grow: rnd(5, 9) * z, vx: d * rnd(30, 100) * z, vy: rnd(-12, 4), drag: 1.6, col: pick(['#b8aea8', '#a09692', '#8a807e']), hi: '#ece6e0', a: rnd(0.65, 0.9), life: rnd(2.8, 4.2), fadeIn: 0.05 });
        for (let k = 0; k < 10; k++) this.bits.add(2, { x: x + d * 6 * z, y, vx: d * rnd(40, 120), vy: rnd(-40, 20), g: 60, col: pick(FIRE), life: rnd(0.2, 0.5) });
      }
      this.bits.step(dt);
    }
    draw(c) { this.bits.draw(c); }
  }

  /** shells=rate,y0,y1,x0,x1 — shells arcing in from either side and bursting on the ground between y0 and y1. */
  class Shells {
    constructor(nums) {
      const [rate = 0.6, y0 = 0.6, y1 = 0.8, x0 = 0.1, x1 = 0.9] = nums;
      Object.assign(this, { rate, y0, y1, x0, x1, list: [], bits: new Bits(), wait: rnd(0.3, 1) });
    }
    resize(W, H) { this.W = W; this.H = H; }
    step(dt) {
      if (!this.W) return;
      this.wait -= dt;
      if (this.wait <= 0) {
        this.wait = rnd(0.5, 1.5) / this.rate;
        const side = Math.random() < 0.5 ? -1 : 1;
        const tx = rnd(this.x0, this.x1) * this.W, ty = rnd(this.y0, this.y1) * this.H;
        this.list.push({ sx: side < 0 ? -8 : this.W + 8, sy: rnd(0.05, 0.3) * this.H, tx, ty, u: 0, T: rnd(1, 1.6), arc: rnd(20, 50), trail: [] });
      }
      for (let i = this.list.length - 1; i >= 0; i--) {
        const s = this.list[i];
        s.u += dt / s.T;
        const u = Math.min(1, s.u);
        s.x = s.sx + (s.tx - s.sx) * u;
        s.y = s.sy + (s.ty - s.sy) * u * u - Math.sin(Math.PI * u) * s.arc * 0.4;
        s.trail.push([s.x, s.y]);
        if (s.trail.length > 7) s.trail.shift();
        if (s.u >= 1) { this.list.splice(i, 1); blast(this.bits, s.tx, s.ty, 0.7 + (s.ty / this.H) * 0.7); }
      }
      this.bits.step(dt);
    }
    draw(c) {
      for (const s of this.list) {
        s.trail.forEach(([x, y], k) => { c.globalAlpha = (k / s.trail.length) * 0.35; c.fillStyle = '#d8d0c8'; c.fillRect(Math.round(x), Math.round(y), 1, 1); });
        c.globalAlpha = 1;
        c.fillStyle = '#1a1414';
        c.fillRect(Math.round(s.x), Math.round(s.y), 2, 2);
      }
      this.bits.draw(c);
    }
  }

  /** blasts=rate,y0,y1,x0,x1 — explosions bursting across a stretch of ground (nearer ones bigger). */
  class Blasts {
    constructor(nums, color) {
      const [rate = 0.8, y0 = 0.6, y1 = 0.85, x0 = 0, x1 = 1] = nums;
      Object.assign(this, { rate, y0, y1, x0, x1, smoke: color || '#3a3030', bits: new Bits(), wait: rnd(0.2, 0.8) });
    }
    resize(W, H) { this.W = W; this.H = H; }
    step(dt) {
      if (!this.W) return;
      this.wait -= dt;
      if (this.wait <= 0) {
        this.wait = rnd(0.4, 1.6) / this.rate;
        const y = rnd(this.y0, this.y1) * this.H;
        blast(this.bits, rnd(this.x0, this.x1) * this.W, y, 0.6 + (y / this.H) * 0.9, this.smoke);
      }
      this.bits.step(dt);
    }
    draw(c) { this.bits.draw(c); }
  }

  /** rockets=rate,y — war rockets launched from the ground at y, screaming up in arcs with fire trails. */
  class Rockets {
    constructor(nums) {
      const [rate = 0.5, y = 0.75, x0 = 0.05, x1 = 0.95] = nums;
      Object.assign(this, { rate, yf: y, x0, x1, list: [], bits: new Bits(), wait: rnd(0.2, 1) });
    }
    resize(W, H) { this.W = W; this.H = H; }
    step(dt) {
      if (!this.W) return;
      this.wait -= dt;
      if (this.wait <= 0) {
        this.wait = rnd(0.6, 1.8) / this.rate;
        const dir = Math.random() < 0.5 ? -1 : 1;
        this.list.push({ x: rnd(this.x0, this.x1) * this.W, y: this.yf * this.H, vx: dir * rnd(25, 60), vy: -rnd(70, 110), life: rnd(1.4, 2.4), age: 0 });
      }
      for (let i = this.list.length - 1; i >= 0; i--) {
        const r = this.list[i];
        r.age += dt;
        r.vy += 28 * dt;
        r.x += r.vx * dt;
        r.y += r.vy * dt;
        for (let k = 0; k < 2; k++) this.bits.add(2, { x: r.x - r.vx * dt * k * 0.5, y: r.y - r.vy * dt * k * 0.5, vx: rnd(-6, 6), vy: rnd(-4, 8), g: 30, col: pick(FIRE), life: rnd(0.3, 0.7) });
        if (Math.random() < 0.8) this.bits.add(0, { x: r.x, y: r.y, r: 0.8, grow: 1.8, vx: rnd(-2, 2), vy: rnd(-2, 1), col: '#b0a4a0', a: 0.45, life: rnd(1.2, 2) });
        if (r.age > r.life) {
          this.list.splice(i, 1);
          for (let k = 0; k < 16; k++) { const a = rnd(0, TAU), v = rnd(15, 45); this.bits.add(2, { x: r.x, y: r.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 35, col: pick(FIRE), life: rnd(0.4, 0.8) }); }
          this.bits.add(2, { x: r.x, y: r.y, r: 10, col: 'rgba(255,220,160,0.9)', glow: true, life: 0.18 });
        }
      }
      this.bits.step(dt);
    }
    draw(c) {
      this.bits.draw(c);
      for (const r of this.list) {
        c.globalCompositeOperation = 'lighter';
        const g = c.createRadialGradient(r.x, r.y, 0, r.x, r.y, 10);
        g.addColorStop(0, 'rgba(255,236,170,1)');
        g.addColorStop(1, 'rgba(255,120,40,0)');
        c.fillStyle = g;
        c.fillRect(r.x - 10, r.y - 10, 20, 20);
        c.globalCompositeOperation = 'source-over';
        c.fillStyle = '#fffbe8';
        c.fillRect(Math.round(r.x), Math.round(r.y), 2, 2);
      }
    }
  }

  /**
   * army=y,dir,speed,count,type,scale,x0,x1,fire — soldiers marching in ranks across the field.
   * type 0: the imperial army (dark coats, rifles with bayonets, officers in the red "shaguma" wig);
   * type 1: samurai of the old order (lacquered armour, spears, a small banner on every back);
   * type 2: French infantry (blue coats, red trousers, kepis).
   * fire: how often the front rank lets off a volley (per second).
   */
  const ARMY = [
    { coat: '#1e2438', legs: '#15151e', hat: '#0e0e12', face: '#c89a78', arm: '#b8bcc8', flag: null },
    { coat: '#6a2a22', legs: '#2a1a18', hat: '#1a1414', face: '#c89a78', arm: '#8a7050', flag: ['#f0ece4', '#c83a2a', '#e8c040'] },
    { coat: '#2e4a9a', legs: '#b8363a', hat: '#2a3a6a', face: '#e0b090', arm: '#c8ccd8', flag: null },
  ];
  class Army {
    constructor(nums) {
      const [y = 0.7, dir = 1, speed = 8, count = 30, type = 0, scale = 1, x0 = 0, x1 = 1, fire = 0] = nums;
      Object.assign(this, { yf: y, dir: dir < 0 ? -1 : 1, speed, count, look: ARMY[type] || ARMY[0], type, sc: Math.max(1, Math.round(scale)), x0, x1, fire, bits: new Bits(), wait: rnd(0.5, 2) });
    }
    resize(W, H) {
      const first = !this.W;
      this.W = W;
      this.H = H;
      if (!first) return;
      this.men = [];
      const ranks = 3, per = Math.ceil(this.count / ranks), gap = 5 * this.sc;
      const span = (this.x1 - this.x0) * W;
      // a column crossing the whole view starts somewhere along its way, not off-screen
      const off = this.x0 < 0 || this.x1 > 1 ? rnd(0, span * 0.6) : 0;
      for (let r = 0; r < ranks; r++) {
        for (let i = 0; i < per; i++) {
          this.men.push({
            x: this.x0 * W + off + ((i * gap + r * 2 * this.sc + rnd(-1, 1)) % Math.max(gap, span)),
            r, ph: rnd(0, TAU), chief: this.type === 0 && Math.random() < 0.08, flag: this.look.flag ? pick(this.look.flag) : null,
          });
        }
      }
      this.men.sort((a, b) => a.r - b.r);
    }
    step(dt, t) {
      if (!this.men) return;
      const lo = this.x0 * this.W - 12, hi = this.x1 * this.W + 12;
      for (const m of this.men) {
        m.x += this.dir * this.speed * dt;
        if (this.dir > 0 && m.x > hi) m.x -= hi - lo;
        if (this.dir < 0 && m.x < lo) m.x += hi - lo;
      }
      if (this.fire) {
        this.wait -= dt;
        if (this.wait <= 0) {
          this.wait = rnd(0.6, 1.4) / this.fire;
          const front = this.men.filter((m) => m.r === 2);
          const from = Math.floor(rnd(0, Math.max(1, front.length - 8)));
          for (const m of front.slice(from, from + 8)) {
            const x = m.x + this.dir * 3 * this.sc, y = this.yf * this.H + 4 * this.sc - 7 * this.sc;
            this.bits.add(2, { x, y, r: 3 * this.sc, col: 'rgba(255,230,170,0.9)', glow: true, life: rnd(0.06, 0.14) });
            this.bits.add(0, { x, y, r: 1 * this.sc, grow: 3 * this.sc, vx: this.dir * rnd(4, 10), vy: -rnd(1, 4), col: '#c8c0b8', a: 0.5, life: rnd(1.5, 2.5), fadeIn: 0.05 });
          }
        }
      }
      this.bits.step(dt);
    }
    draw(c, t) {
      if (!this.men) return;
      const L = this.look, s = this.sc, d = this.dir;
      const P = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w * s, h * s); };
      c.globalAlpha = 1;
      for (const m of this.men) {
        const base = this.yf * this.H + m.r * 2 * s;
        const step = Math.floor(t * 4 + m.ph) % 2;
        const x = m.x, y = base - 8 * s - (step ? 0 : s * 0.5);
        // legs, striding
        if (step) { P(x - s, y + 6 * s, 1, 2, L.legs); P(x + s, y + 6 * s, 1, 2, L.legs); } else P(x, y + 6 * s, 1, 2, L.legs);
        P(x - s, y + 2 * s, 3, 4, L.coat);
        P(x, y + s, 1, 1, L.face);
        if (this.type === 0 || this.type === 2) {
          P(x - s, y, 3, 1, L.hat);
          if (this.type === 2) P(x, y - s, 1, 1, '#b8363a');
          if (m.chief) { P(x - s, y - s, 3, 1, '#d83a2a'); P(x + d * -2 * s, y, 1, 3, '#d83a2a'); }
          P(x + d * 2 * s, y - 2 * s, 1, 5, '#3a2a1e');
          P(x + d * 2 * s, y - 3 * s, 1, 1, L.arm);
        } else {
          P(x - s, y, 3, 1, L.hat);
          P(x, y - s, 1, 1, '#c8a040');
          P(x + d * 2 * s, y - 5 * s, 1, 9, '#4a3420');
          P(x + d * 2 * s, y - 6 * s, 1, 1, L.arm);
          if (m.flag) { P(x - d * 2 * s, y - 4 * s, 1, 6, '#2a1a10'); P(x - d * 2 * s - (d > 0 ? 2 * s : -s), y - 4 * s, 2, 3, m.flag); }
        }
      }
      this.bits.draw(c);
    }
  }

  // ---------------------------------------------------------------- small life in the scenes
  /** People going about their day, in the dress of the place. */
  const FOLK = [
    // the south of France: coats and waistcoats, long skirts, bonnets and hats
    [{ top: '#4a3a2e', legs: '#2e2a26', hat: '#2a2220', skirt: false }, { top: '#6a4a3a', legs: '#3a2e28', hat: '#3a2e24', skirt: false }, { top: '#8a5a5a', legs: '#5a3a3a', hat: '#e8dcc8', skirt: true }, { top: '#4a5a7a', legs: '#3a4460', hat: '#e8dcc8', skirt: true }, { top: '#7a6a4a', legs: '#5a4a34', hat: '#3a3024', skirt: false }],
    // Japan: kimono in indigo, brown and rose, straw hats, a pole across the shoulders
    [{ top: '#2e3a5a', legs: '#2e3a5a', hat: '#c8a860', skirt: true, pole: true }, { top: '#6a4a34', legs: '#4a3424', hat: '#c8a860', skirt: false }, { top: '#8a4a5a', legs: '#8a4a5a', hat: '#1a1414', skirt: true }, { top: '#4a5a4a', legs: '#3a4034', hat: '#c8a860', skirt: false, pole: true }],
    // the docks: shirtsleeves, caps, a crate on the shoulder
    [{ top: '#c8c0b0', legs: '#3a3a44', hat: '#2a2a30', skirt: false, load: true }, { top: '#5a6a7a', legs: '#2e2e36', hat: '#2a2a30', skirt: false }, { top: '#8a7a60', legs: '#3a3228', hat: '#4a3a2a', skirt: false, load: true }],
  ];
  /** walkers=y,x0,x1,count,kind,scale,depth — people strolling back and forth along a path, stopping now and then. */
  class Walkers {
    constructor(nums) {
      const [y = 0.8, x0 = 0, x1 = 1, count = 4, kind = 0, scale = 1, depth = 0.02] = nums;
      Object.assign(this, { yf: y, x0, x1, count, looks: FOLK[kind] || FOLK[0], sc: Math.max(1, Math.round(scale)), dy: depth });
    }
    resize(W, H) {
      const first = !this.W;
      this.W = W;
      this.H = H;
      if (!first) return;
      this.p = [];
      for (let i = 0; i < this.count; i++) {
        this.p.push({ x: rnd(this.x0, this.x1) * W, y: (this.yf + rnd(0, this.dy)) * H, dir: Math.random() < 0.5 ? -1 : 1, v: rnd(4, 9), wait: rnd(0, 3), ph: rnd(0, TAU), look: pick(this.looks) });
      }
      this.p.sort((a, b) => a.y - b.y);
    }
    step(dt) {
      if (!this.p) return;
      const lo = this.x0 * this.W, hi = this.x1 * this.W;
      for (const w of this.p) {
        if (w.wait > 0) { w.wait -= dt; continue; }
        w.x += w.dir * w.v * dt;
        if (w.x < lo || w.x > hi) { w.dir *= -1; w.x = Math.max(lo, Math.min(hi, w.x)); w.wait = rnd(0.5, 2.5); }
        else if (Math.random() < dt * 0.08) w.wait = rnd(1, 4);
      }
    }
    draw(c, t) {
      if (!this.p) return;
      const s = this.sc;
      const P = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w * s, h * s); };
      c.globalAlpha = 1;
      for (const w of this.p) {
        const L = w.look, moving = w.wait <= 0, step = moving ? Math.floor(t * 5 + w.ph) % 2 : 0;
        const x = w.x, y = w.y - 7 * s - (step ? s * 0.5 : 0);
        if (L.skirt) P(x - s, y + 4 * s, 3, 3, L.legs);
        else if (step) { P(x - s, y + 5 * s, 1, 2, L.legs); P(x + s, y + 5 * s, 1, 2, L.legs); } else P(x, y + 5 * s, 1, 2, L.legs);
        P(x - s, y + 2 * s, 3, 3, L.top);
        P(x, y + s, 1, 1, '#d8b090');
        P(x - s, y, 3, 1, L.hat);
        if (L.pole) { P(x - 3 * s, y + 2 * s, 7, 1, '#6a4a2a'); P(x - 3 * s, y + 3 * s, 1, 2, '#8a6a3a'); P(x + 3 * s, y + 3 * s, 1, 2, '#8a6a3a'); }
        if (L.load) P(x - s + w.dir * s, y - s, 3, 2, '#8a6a40');
      }
    }
  }

  /** ripples=x,y,w,h,rate,#color — rings spreading on still water (a fish, a raindrop, a falling leaf). */
  class Ripples {
    constructor(nums, color) {
      const [x = 0, y = 0.7, w = 1, h = 0.2, rate = 0.8] = nums;
      Object.assign(this, { box: { x, y, w, h }, rate, col: color || '#dfe8ff', list: [], wait: rnd(0, 1) });
    }
    resize(W, H) { this.W = W; this.H = H; }
    step(dt) {
      if (!this.W) return;
      this.wait -= dt;
      if (this.wait <= 0) {
        this.wait = rnd(0.4, 1.6) / this.rate;
        const b = this.box;
        this.list.push({ x: (b.x + Math.random() * b.w) * this.W, y: (b.y + Math.random() * b.h) * this.H, age: 0, life: rnd(1.4, 2.4), size: rnd(5, 10) });
      }
      for (let i = this.list.length - 1; i >= 0; i--) { const r = this.list[i]; r.age += dt; if (r.age > r.life) this.list.splice(i, 1); }
    }
    draw(c) {
      c.fillStyle = this.col;
      for (const r of this.list) {
        const k = r.age / r.life;
        for (const [f, a] of [[1, 0.7], [0.55, 0.45]]) {
          const rx = 1 + r.size * k * f, ry = rx * 0.3;
          c.globalAlpha = (1 - k) * a;
          const n = Math.max(8, Math.round(rx * 3));
          for (let i = 0; i < n; i++) { const t = (i / n) * TAU; c.fillRect(Math.round(r.x + Math.cos(t) * rx), Math.round(r.y + Math.sin(t) * ry), 1, 1); }
        }
      }
      c.globalAlpha = 1;
    }
  }

  /** shade=y,h,count,alpha — the shadows of clouds sliding slowly over the land. */
  class Shade {
    constructor(nums, color) {
      const [y = 0.6, h = 0.4, count = 3, alpha = 0.12] = nums;
      Object.assign(this, { yf: y, hf: h, count, alpha, col: color || '#0e1420' });
    }
    resize(W, H) {
      const first = !this.W;
      this.W = W;
      this.H = H;
      if (!first) return;
      this.list = [];
      for (let i = 0; i < this.count; i++) this.list.push({ x: rnd(-0.2, 1.1) * W, y: (this.yf + rnd(0.1, 0.9) * this.hf) * H, r: rnd(0.08, 0.16) * W, v: rnd(3, 6) });
    }
    step(dt) {
      if (!this.list) return;
      for (const s of this.list) { s.x += s.v * dt; if (s.x - s.r * 1.6 > this.W) { s.x = -s.r * 1.6; s.y = (this.yf + rnd(0.1, 0.9) * this.hf) * this.H; } }
    }
    draw(c) {
      if (!this.list) return;
      c.save();
      c.beginPath();
      c.rect(0, this.yf * this.H, this.W, this.hf * this.H);
      c.clip();
      c.fillStyle = this.col;
      for (const s of this.list) {
        for (const [dx, dy, f] of [[0, 0, 1], [s.r * 0.7, s.r * 0.08, 0.7], [-s.r * 0.6, s.r * 0.05, 0.6]]) {
          c.globalAlpha = this.alpha;
          c.beginPath();
          c.ellipse(s.x + dx, s.y + dy, s.r * f, s.r * f * 0.3, 0, 0, TAU);
          c.fill();
        }
      }
      c.restore();
      c.globalAlpha = 1;
    }
  }

  /** lightning=rate — now and then the sky whitens, twice, and a bolt forks down to the hills. */
  class Lightning {
    constructor(nums) {
      const [rate = 0.1, horizon = 0.55] = nums;
      Object.assign(this, { rate, horizon, wait: rnd(2, 6), t: 99, bolt: null });
    }
    resize(W, H) { this.W = W; this.H = H; }
    step(dt) {
      if (!this.W) return;
      this.t += dt;
      this.wait -= dt;
      if (this.wait <= 0) {
        this.wait = rnd(0.5, 1.5) / this.rate;
        this.t = 0;
        const pts = [];
        let x = rnd(0.15, 0.85) * this.W, y = 0;
        while (y < this.horizon * this.H) { pts.push([x, y]); x += rnd(-5, 5); y += rnd(3, 7); }
        this.bolt = pts;
      }
    }
    draw(c) {
      if (!this.W || this.t > 0.6) return;
      // two flashes: a bright one, then a weaker echo
      const f = this.t < 0.08 ? 1 : this.t > 0.18 && this.t < 0.26 ? 0.55 : 0;
      if (f) { c.globalAlpha = 0.3 * f; c.fillStyle = '#e8f0ff'; c.fillRect(0, 0, this.W, this.H); }
      if (this.bolt && this.t < 0.3) {
        c.globalAlpha = f ? 1 : 0.4;
        c.fillStyle = '#ffffff';
        for (const [x, y] of this.bolt) c.fillRect(Math.round(x), Math.round(y), 1, 4);
      }
      c.globalAlpha = 1;
    }
  }

  /** splashes=y,h,rate — raindrops bursting on the puddles and paving. */
  class Splashes {
    constructor(nums, color) {
      const [y = 0.8, h = 0.2, rate = 30] = nums;
      Object.assign(this, { yf: y, hf: h, rate, col: color || '#c8d4ea', list: [] });
    }
    resize(W, H) { this.W = W; this.H = H; }
    step(dt) {
      if (!this.W) return;
      const n = this.rate * dt;
      for (let k = 0; k < Math.floor(n) + (Math.random() < n % 1 ? 1 : 0); k++) this.list.push({ x: Math.random() * this.W, y: (this.yf + Math.random() * this.hf) * this.H, age: 0 });
      for (let i = this.list.length - 1; i >= 0; i--) { this.list[i].age += dt; if (this.list[i].age > 0.25) this.list.splice(i, 1); }
    }
    draw(c) {
      c.fillStyle = this.col;
      for (const s of this.list) {
        const k = s.age / 0.25;
        c.globalAlpha = 0.7 * (1 - k);
        const x = Math.round(s.x), y = Math.round(s.y);
        if (k < 0.4) c.fillRect(x, y - 1, 1, 1);
        else { c.fillRect(x - 1, y - 1, 1, 1); c.fillRect(x + 1, y - 1, 1, 1); c.fillRect(x - 2, y, 1, 1); c.fillRect(x + 2, y, 1, 1); }
      }
      c.globalAlpha = 1;
    }
  }

  // ---------------------------------------------------------------- the sky of an empire
  /** airship=y,dir,speed,scale,x — a steam airship crossing the sky, its propeller turning, smoke trailing. */
  class Airship {
    constructor(nums) {
      const [y = 0.2, dir = -1, speed = 5, scale = 1, x = 0.5] = nums;
      Object.assign(this, { yf: y, dir: dir < 0 ? -1 : 1, speed, s: scale, xf: x });
    }
    resize(W, H) { if (this.x == null) this.x = this.xf * W; this.W = W; this.H = H; }
    step(dt) {
      if (!this.W) return;
      this.x += this.dir * this.speed * dt;
      const m = 45 * this.s;
      if (this.dir < 0 && this.x < -m) this.x = this.W + m;
      if (this.dir > 0 && this.x > this.W + m) this.x = -m;
    }
    draw(c, t) {
      if (!this.W) return;
      const s = this.s, dir = this.dir, x = this.x, y = this.yf * this.H + Math.sin(t * 0.5 + this.xf * 9) * 1.2;
      const P = (px, py, w, hh, col) => { c.fillStyle = col; c.fillRect(x + px * dir - (dir < 0 ? w : 0), y + py, w, hh); };
      const L = 34 * s, H2 = 8 * s;
      for (let yy = -H2; yy <= H2; yy += 0.5) {
        const k = yy / H2;
        const half = L * Math.sqrt(Math.max(0, 1 - k * k));
        const col = k < -0.55 ? '#fff6f0' : k < 0.2 ? '#eee0d8' : k < 0.6 ? '#d6c0c2' : '#b8a0aa';
        P(-half, yy, half * (2 - 0.15 * (1 - Math.abs(k))), 0.5, col);
      }
      P(-L * 0.62, -H2 * 0.85, 2 * s, H2 * 1.7, '#2e4a9a');
      P(-L * 0.62 + 2 * s, -H2 * 0.9, 2 * s, H2 * 1.8, '#f2eee6');
      P(-L * 0.62 + 4 * s, -H2 * 0.85, 2 * s, H2 * 1.7, '#c83a3a');
      for (let k = 0; k < 7 * s; k += 0.5) P(-L - 2 * s - k * 0.4, -k, 3 * s, 0.5, k < 3.5 * s ? '#c83a3a' : '#2e4a9a');
      P(-L * 0.75, H2 + 4 * s, L * 1.5, 0.7, '#5a4a50');
      for (let k = -0.7; k <= 0.7; k += 0.2) P(L * k, H2 * 0.9, 0.5, 3.2 * s, 'rgba(90,70,80,0.8)');
      P(-6 * s, H2 + 4.5 * s, 12 * s, 3 * s, '#6a4a3a');
      P(-4 * s, H2 + 5.2 * s, 1.5, 1.2, '#ffd28a'); P(0, H2 + 5.2 * s, 1.5, 1.2, '#ffd28a');
      if (Math.floor(t * 16) % 2) P(-L * 0.78, H2 + 2 * s, 0.8, 5 * s, '#3a2e2a');
      else P(-L * 0.78 - 2 * s, H2 + 4 * s, 4 * s, 0.8, '#3a2e2a');
      for (let k = 0; k < 4; k++) {
        const age = (t * 0.8 + k * 0.25) % 1, r = (1 + age * 3) * s;
        c.fillStyle = `rgba(230,220,228,${(0.5 * (1 - age)).toFixed(2)})`;
        c.fillRect(x - dir * (6 * s + age * 26 * s) - r, y + H2 + 3 * s - age * 3 - r * 0.6, r * 2, r * 1.2);
      }
    }
  }
  /** balloon=x,y,scale,tether,colours — an observation balloon, bobbing on its tether above the lines. */
  class Balloon {
    constructor(nums) {
      const [x = 0.5, y = 0.3, scale = 1, tether = 0.62, kind = 0] = nums;
      Object.assign(this, { xf: x, yf: y, s: scale, tf: tether, cols: kind ? ['#f2e6dc', '#2e4a9a'] : ['#f2e6dc', '#c83a3a'] });
    }
    resize(W, H) { this.W = W; this.H = H; }
    step() {}
    draw(c, t) {
      if (!this.W) return;
      const s = this.s, R = 8 * s, x = this.xf * this.W, y = this.yf * this.H + Math.sin(t * 0.7 + this.xf * 7) * 1.5;
      for (let yy = -R; yy <= R; yy += 0.5) {
        const w = Math.sqrt(Math.max(0, R * R - yy * yy)) * (yy > R * 0.3 ? 1 - (yy - R * 0.3) / (R * 1.3) : 1);
        for (let xx = -w; xx < w; xx += 1) {
          const gore = Math.floor(((Math.asin(Math.max(-1, Math.min(1, xx / Math.max(1, w)))) / Math.PI) + 0.5) * 6);
          let col = this.cols[gore % 2];
          if (xx > w * 0.35 || yy > R * 0.45) col = gore % 2 ? '#9a2a34' : '#c8b0b4';
          if (xx < -w * 0.4 && yy < 0) col = gore % 2 ? '#e05050' : '#fff8f0';
          c.fillStyle = col;
          c.fillRect(x + xx, y + yy, 1, 0.5);
        }
      }
      c.fillStyle = 'rgba(70,50,60,0.9)';
      for (const k of [-0.5, 0.5]) c.fillRect(x + k * R * 0.9, y + R * 0.8, 0.5, 5 * s);
      c.fillStyle = '#6a4a3a'; c.fillRect(x - 2.5 * s, y + R + 4 * s, 5 * s, 3 * s);
      c.fillStyle = '#2e4a8a'; c.fillRect(x - 1.5 * s, y + R + 3 * s, 1, 1); c.fillRect(x + s, y + R + 3 * s, 1, 1);
      c.fillStyle = 'rgba(70,50,60,0.55)';
      const y0 = y + R + 7 * s, y1 = this.tf * this.H;
      for (let yy = y0; yy < y1; yy += 1) c.fillRect(x + (yy - y0) * 0.08, yy, 0.5, 1);
    }
  }

  // ---------------------------------------------------------------- the per-background controller
  // ---------------------------------------------------------------- a river town's
  /** fish=x,y,w,h,rate — fish leaping out of the water and back, with rings and a spray of drops. */
  class Fish {
    constructor(nums) {
      const [x = 0, y = 0.75, w = 1, h = 0.15, rate = 0.5] = nums;
      Object.assign(this, { box: { x, y, w, h }, rate, list: [], wait: rnd(0.5, 1.5) });
    }
    resize(W, H) { this.W = W; this.H = H; }
    step(dt) {
      if (!this.W) return;
      this.wait -= dt;
      if (this.wait <= 0) {
        this.wait = rnd(0.6, 1.6) / this.rate;
        const b = this.box;
        this.list.push({ x: (b.x + Math.random() * b.w) * this.W, y: (b.y + Math.random() * b.h) * this.H, t: 0, dur: rnd(0.6, 0.9), h: rnd(5, 10), dir: Math.random() < 0.5 ? -1 : 1 });
      }
      for (const f of this.list) f.t += dt;
      this.list = this.list.filter((f) => f.t < f.dur + 0.7);
    }
    draw(c, t) {
      for (const f of this.list) {
        const p = f.t / f.dur;
        if (p <= 1) {
          const x = f.x + f.dir * p * 9, y = f.y - Math.sin(Math.PI * p) * f.h;
          c.globalAlpha = 1;
          c.fillStyle = '#d8e4f0'; c.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 1.5);
          c.fillStyle = '#5a6a80'; c.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 0.5);
          if (Math.sin(t * 30) > 0) { c.fillStyle = '#ffffff'; c.fillRect(Math.round(x), Math.round(y) - 1, 1, 1); }
        }
        for (const [sx, st] of [[f.x, f.t], [f.x + f.dir * 9, f.t - f.dur]]) {
          if (st < 0 || st > 0.7) continue;
          const k = st / 0.7;
          c.globalAlpha = 0.7 * (1 - k);
          c.fillStyle = '#ffffff';
          for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; c.fillRect(Math.round(sx + Math.cos(a) * (1.5 + k * 6)), Math.round(f.y + Math.sin(a) * (0.5 + k * 1.2)), 1, 0.5); }
        }
      }
      c.globalAlpha = 1;
    }
  }

  /** flock=count,y0,y1 — flocks of birds going over in loose V shapes, now and then. */
  class Flock {
    constructor(nums) {
      const [every = 14, y0 = 0.05, y1 = 0.3] = nums;
      Object.assign(this, { every, y: [y0, y1], list: [], wait: rnd(1, 4) });
    }
    resize(W, H) { this.W = W; this.H = H; }
    step(dt) {
      if (!this.W) return;
      this.wait -= dt;
      if (this.wait <= 0) {
        this.wait = rnd(this.every * 0.7, this.every * 1.3);
        const n = Math.round(rnd(5, 9)), birds = [];
        for (let i = 0; i < n; i++) { const k = Math.ceil(i / 2); birds.push({ dx: -k * 5, dy: k * 2.5 * (i % 2 ? 1 : 0.8), ph: rnd(0, 6) }); }
        this.list.push({ x: -40, y: rnd(this.y[0], this.y[1]) * this.H, v: rnd(18, 26), birds });
      }
      for (const f of this.list) f.x += f.v * dt;
      this.list = this.list.filter((f) => f.x < this.W + 60);
    }
    draw(c, t) {
      c.globalAlpha = 0.9;
      c.fillStyle = '#26303e';
      for (const f of this.list) for (const b of f.birds) {
        const fr = WINGS[Math.floor((t * 9 + b.ph) % 3)];
        const x = Math.round(f.x + b.dx), y = Math.round(f.y + b.dy + Math.sin(t * 1.3 + b.ph));
        for (const [dx, dy] of fr) c.fillRect(x + dx, y + dy, 1, 1);
      }
      c.globalAlpha = 1;
    }
  }

  // ---------------------------------------------------------------- horses at the gallop
  const COATS = [
    { coat: '#8a5a34', dark: '#5e3a20', mane: '#2a1a12' },
    { coat: '#5a3a26', dark: '#3a2418', mane: '#1a1210' },
    { coat: '#e8e0d4', dark: '#b8aea4', mane: '#f4f0e8' },
    { coat: '#2e2622', dark: '#1c1614', mane: '#0e0a0a' },
    { coat: '#b8925a', dark: '#8a6a40', mane: '#4a3420' },
  ];
  /**
   * A horse at the gallop, facing `dir`, feet at (x, y), `s` art pixels to its unit, legs at phase
   * `ph`; with a rider on its back (dark coat, top hat, coat-tails flying) if asked.
   */
  function gallop(c, x, y, s, ph, coat, dir, rider) {
    const P = (dx, dy, w, hh, col) => { c.fillStyle = col; c.fillRect(Math.round((dir > 0 ? x + dx * s : x - (dx + w) * s) * 2) / 2, Math.round((y + dy * s) * 2) / 2, Math.max(0.5, Math.round(w * s * 2) / 2), Math.max(0.5, Math.round(hh * s * 2) / 2)); };
    const lift = Math.abs(Math.sin(ph)) * 0.8;
    const by = -lift;
    // the legs, the far pair darker: each swings about its hip, the lower leg folding back as it lifts
    const leg = (hx, a, col) => {
      const kx = hx + Math.sin(a) * 2.6, ky = by - 5 + Math.cos(a) * 2.6;
      const fold = Math.max(0, -Math.sin(a)) * 1.6 + 0.4;
      const fx = kx + Math.sin(a - fold) * 2.6, fy = Math.min(0, ky + Math.cos(a - fold) * 2.6);
      for (let t = 0; t <= 1; t += 0.2) P(hx + (kx - hx) * t - 0.4, by - 5 + (ky - by + 5) * t - 0.4, 1, 1, col);
      for (let t = 0; t <= 1; t += 0.2) P(kx + (fx - kx) * t - 0.35, ky + (fy - ky) * t - 0.35, 0.8, 0.8, col);
      P(fx - 0.5, fy - 0.6, 1.1, 0.6, '#1a1210');
    };
    leg(-3, Math.sin(ph + 0.6) * 0.9 - 0.2, coat.dark);
    leg(3.5, Math.sin(ph + Math.PI + 0.6) * 0.9 + 0.2, coat.dark);
    // the tail streaming out behind, the body, the neck stretched forward, the head
    const tw = Math.sin(ph * 2) * 0.4;
    P(-7.5, by - 7.6 + tw, 3, 1, coat.mane); P(-9, by - 7.2 + tw * 1.5, 2, 1, coat.mane);
    P(-4.5, by - 8.2, 9.5, 3.6, coat.coat);
    P(-4, by - 8.4, 8, 0.8, coat.coat);
    P(-4.5, by - 5, 9.5, 0.6, coat.dark);
    P(4.2, by - 10, 2.2, 3.4, coat.coat);
    P(5.4, by - 11.2, 2, 2, coat.coat);
    P(6.6, by - 11.4, 2.8, 1.8, coat.coat);
    P(8.6, by - 10.6, 1, 1, coat.dark);
    P(3.8, by - 10.6, 1.4, 2.4, coat.mane);
    P(5, by - 11.8, 1, 1, coat.mane);
    P(7.2, by - 11.2, 0.6, 0.6, '#1a1210');
    leg(-2, Math.sin(ph) * 0.9 - 0.2, coat.coat);
    leg(4.5, Math.sin(ph + Math.PI) * 0.9 + 0.2, coat.coat);
    if (rider) {
      // Hervé, leaning into the ride
      const flap = Math.sin(ph * 2 + 1) * 0.6;
      P(-3.6 - flap, by - 10.4, 3, 1.2, '#1e1c26');
      P(-4.4 - flap, by - 9.8, 1.2, 1, '#1e1c26');
      P(-0.4, by - 9.6, 1.2, 3, '#141218');
      P(-1, by - 14.4, 2.6, 5, '#26242e');
      P(-1, by - 14.4, 0.8, 5, '#3a3844');
      P(1.2, by - 12.6, 2.4, 0.9, '#26242e');
      P(3.2, by - 12.4, 0.8, 0.8, '#e8c0a0');
      P(-0.2, by - 16.2, 1.8, 1.8, '#e8c0a0');
      P(-0.6, by - 16.6, 2.6, 0.6, '#141218');
      P(-0.2, by - 19, 1.8, 2.5, '#141218');
    }
  }

  /** herd=y,count,speed,scale,dir,spread — wild horses galloping across in a loose group, round and round. */
  class Herd {
    constructor(nums) {
      const [y = 0.7, count = 8, speed = 24, scale = 1, dir = -1, spread = 0.06] = nums;
      Object.assign(this, { yf: y, count, speed, sc: scale, dir: dir < 0 ? -1 : 1, spread });
    }
    resize(W, H) {
      const first = !this.W;
      this.W = W;
      this.H = H;
      if (!first) return;
      this.lead = W * (this.dir < 0 ? 0.62 : 0.38);
      this.p = [];
      for (let i = 0; i < this.count; i++) this.p.push({ dx: -this.dir * rnd(0, 26 + this.count * 4) * this.sc, dy: rnd(-1, 1) * this.spread * H, ph: rnd(0, TAU), rate: rnd(11, 14), coat: pick(COATS), v: rnd(0.92, 1.08) });
      this.p.sort((a, b) => a.dy - b.dy);
    }
    step(dt) {
      if (!this.p) return;
      this.lead += this.dir * this.speed * dt;
      const tail = Math.max(...this.p.map((h) => Math.abs(h.dx))) + 20 * this.sc;
      if (this.dir < 0 && this.lead + tail < -10) this.lead = this.W + 20;
      if (this.dir > 0 && this.lead - tail > this.W + 10) this.lead = -20;
      for (const h of this.p) { h.ph += h.rate * dt; h.dx += (h.v - 1) * this.speed * dt * 0.3; if (Math.abs(h.dx) > 60 * this.sc) h.v = 0.96; else if (Math.abs(h.dx) < 2) h.v = 1.04; }
    }
    draw(c) {
      if (!this.p) return;
      c.globalAlpha = 1;
      for (const h of this.p) gallop(c, this.lead + h.dx, this.yf * this.H + h.dy, this.sc, h.ph, h.coat, this.dir, false);
    }
  }

  /** rider=y,x0,x1,dur,scale,delay — Hervé at a gallop, from x0 to x1 (fractions of the picture) in dur seconds. */
  class Rider {
    constructor(nums) {
      const [y = 0.8, x0 = -0.1, x1 = 1.1, dur = 10, scale = 3, delay = 0] = nums;
      Object.assign(this, { yf: y, x0, x1, dur, sc: scale, delay, t: 0, ph: 0 });
      this.coat = { coat: '#f2ece2', dark: '#c8bcae', mane: '#fbf6ee' };
    }
    resize(W, H) { this.W = W; this.H = H; }
    step(dt) { this.t += dt; this.ph += dt * 12; }
    draw(c) {
      if (!this.W) return;
      const k = (this.t - this.delay) / this.dur;
      if (k < 0 || k > 1.2) return;
      const x = (this.x0 + (this.x1 - this.x0) * k) * this.W;
      gallop(c, x, this.yf * this.H, this.sc, this.ph, this.coat, this.x1 >= this.x0 ? 1 : -1, true);
    }
  }

  class SceneFx {
    constructor(bgEl, specs, settings, frame = null) {
      this.bg = bgEl;
      this.reduce = !!(settings && settings.reduceMotion);
      this.frameEl = frame || h('div.bg-frame');
      this.systems = [];
      const lights = [];
      for (const s of specs) {
        const n = s.nums || [];
        const lite = this.reduce ? 0.5 : 1;
        switch (s.type) {
          case 'petals': case 'leaves': case 'foliage': case 'snow': case 'ash':
            this.systems.push(new Falling(s.type, (n[0] || 1) * lite, regionOf(n, 1))); break;
          case 'rain': this.systems.push(new Rain((n[0] || 1) * lite, regionOf(n, 1))); break;
          case 'fireflies': this.systems.push(new Fireflies(n)); break;
          case 'motes': this.systems.push(new Motes(n, s.color)); break;
          case 'glints': this.systems.push(new Glints(n, s.color)); break;
          case 'stars': this.systems.push(new Stars(n)); break;
          case 'smoke': case 'steam': case 'embers': this.systems.push(new Rising(s.type, n, s.color)); break;
          case 'birds': this.systems.push(new Birds(n)); break;
          case 'flutter': this.systems.push(new Flutter(n)); break;
          case 'grass': this.systems.push(new Grass(n, s.color)); break;
          case 'gunfire': this.systems.push(new Gunfire(n, s.color)); break;
          case 'cannon': this.systems.push(new Cannon(n)); break;
          case 'boom': this.systems.push(new Boom(n, s.color)); break;
          case 'shells': this.systems.push(new Shells(n)); break;
          case 'blasts': this.systems.push(new Blasts(n, s.color)); break;
          case 'rockets': this.systems.push(new Rockets(n)); break;
          case 'army': this.systems.push(new Army(n)); break;
          case 'airship': this.systems.push(new Airship(n)); break;
          case 'balloon': this.systems.push(new Balloon(n)); break;
          case 'walkers': this.systems.push(new Walkers(n)); break;
          case 'ripples': this.systems.push(new Ripples(n, s.color)); break;
          case 'shade': this.systems.push(new Shade(n, s.color)); break;
          case 'lightning': if (!this.reduce) this.systems.push(new Lightning(n)); break;
          case 'splashes': this.systems.push(new Splashes(n, s.color)); break;
          case 'herd': this.systems.push(new Herd(n)); break;
          case 'fish': this.systems.push(new Fish(n)); break;
          case 'flock': this.systems.push(new Flock(n)); break;
          case 'aurora': this.systems.push(new Aurora(n)); break;
          case 'rider': this.systems.push(new Rider(n)); break;
          case 'glow': case 'flame': lights.push(this.light(s)); break;
          case 'rays': lights.push(this.rays(s)); break;
          case 'mist': lights.push(this.mist(s)); break;
          case 'rock': if (!this.reduce) bgEl.classList.add('bg-rock'); break;
          default: break;
        }
      }
      this.frameEl.append(...lights);
      if (this.systems.length) {
        this.canvas = h('canvas.bg-particles');
        this.ctx = this.canvas.getContext('2d');
        if (frame) this.frameEl.append(this.canvas); else this.frameEl.prepend(this.canvas);
        this.ro = new ResizeObserver(() => this.size());
        this.ro.observe(this.frameEl);
        start(this);
      }
      if (!frame) bgEl.append(this.frameEl);
    }

    /** The picture's shape, so the frame covers the stage exactly as the picture does. */
    setAspect(ar) {
      this.frameEl.style.setProperty('--ar', String(ar));
    }

    light(s) {
      const [x = 0.5, y = 0.5, r = 0.05] = s.nums || [];
      const el = h(`div.bg-light.${s.type}`, {
        style: {
          left: `${x * 100}%`, top: `${y * 100}%`, width: `${r * 200}%`,
          '--c': s.color || (s.type === 'flame' ? '#ffc766' : '#cfe0ff'),
          animationDuration: `${s.type === 'flame' ? rnd(1.3, 2.1) : rnd(5, 8)}s`,
          animationDelay: `${-rnd(0, 5)}s`,
        },
      });
      return el;
    }

    rays(s) {
      const [x = 0.5, y = 0, spread = 1, strength = 1] = s.nums || [];
      // painted once onto a small canvas (cheaper than a masked gradient), then swayed
      const cv = h('canvas.bg-rays', { style: { left: `${x * 100}%`, top: `${y * 100}%`, '--s': String(spread), '--o': String(strength) } });
      cv.width = cv.height = 256;
      const c = cv.getContext('2d');
      const g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
      const col = s.color || '#fff2c4';
      g.addColorStop(0, col);
      g.addColorStop(0.35, `${col}88`);
      g.addColorStop(0.8, `${col}00`);
      c.fillStyle = g;
      c.globalAlpha = 0.34;
      for (const [deg, w] of [[119, 3], [133, 5], [148, 2.5], [161, 5], [174, 3], [187, 5], [200, 3], [214, 5], [228, 3.5], [241, 4]]) {
        const a0 = ((deg - 90 - w / 2) * Math.PI) / 180, a1 = ((deg - 90 + w / 2) * Math.PI) / 180;
        c.beginPath(); c.moveTo(128, 128); c.arc(128, 128, 128, a0, a1); c.closePath(); c.fill();
      }
      return cv;
    }

    mist(s) {
      const [y = 0.6, hh = 0.3, a = 0.35] = s.nums || [];
      return h('div.bg-mist', { style: { top: `${y * 100}%`, height: `${hh * 100}%`, opacity: String(a), '--c': s.color || '#e6ecff' } });
    }

    size() {
      const w = this.frameEl.clientWidth;
      const hh = this.frameEl.clientHeight;
      if (!w || !hh) return;
      const W = Math.round(w / PX), H = Math.round(hh / PX);
      // drawn at twice the art's resolution, so its pixels stay crisp when a camera zooms in
      if (this.W === W && this.H === H) return;
      this.W = W;
      this.H = H;
      this.canvas.width = W * SUB;
      this.canvas.height = H * SUB;
      for (const s of this.systems) s.resize(W, H);
    }

    frame(dt, t) {
      if (!this.bg.isConnected) { this.destroy(); return; }
      if (!this.W) return;
      const c = this.ctx;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, this.canvas.width, this.canvas.height);
      c.setTransform(SUB, 0, 0, SUB, 0, 0);
      for (const s of this.systems) { s.step(dt, t); s.draw(c, t); }
      c.globalAlpha = 1;
    }

    destroy() {
      running.delete(this);
      if (this.ro) this.ro.disconnect();
    }
  }

  VN.SceneFx = SceneFx;
})();
