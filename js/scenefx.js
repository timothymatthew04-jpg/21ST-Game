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
    for (const fx of running) fx.frame(dt, now / 1000);
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

  // ---------------------------------------------------------------- the per-background controller
  class SceneFx {
    constructor(bgEl, specs, settings) {
      this.bg = bgEl;
      this.reduce = !!(settings && settings.reduceMotion);
      this.frameEl = h('div.bg-frame');
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
        this.frameEl.prepend(this.canvas);
        this.ro = new ResizeObserver(() => this.size());
        this.ro.observe(this.frameEl);
        start(this);
      }
      bgEl.append(this.frameEl);
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
      return h('div.bg-rays', { style: { left: `${x * 100}%`, top: `${y * 100}%`, '--c': s.color || '#fff2c4', '--s': String(spread), '--o': String(strength) } });
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
      if (this.canvas.width === W && this.canvas.height === H) return;
      this.canvas.width = W;
      this.canvas.height = H;
      for (const s of this.systems) s.resize(W, H);
    }

    frame(dt, t) {
      if (!this.bg.isConnected) { this.destroy(); return; }
      if (!this.canvas.width) return;
      const c = this.ctx;
      c.clearRect(0, 0, this.canvas.width, this.canvas.height);
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
