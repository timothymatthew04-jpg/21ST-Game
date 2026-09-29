/*
 * strand.js — the "press start" screen: a single glowing thread of silk drifting
 * through the dark, lights running along it. When the player clicks, the thread
 * branches into many threads of light that race across the screen, and the title
 * menu opens behind the flash.
 */
(function () {
  'use strict';
  const VN = globalThis.VN;
  const TAU = Math.PI * 2;
  const rnd = (a, b) => a + Math.random() * (b - a);

  class StrandSplash {
    constructor(canvas, { reduce = false } = {}) {
      this.cv = canvas;
      this.c = canvas.getContext('2d');
      this.reduce = reduce;
      this.t0 = performance.now();
      this.sparks = [];
      this.branches = [];
      this.burstAt = 0;
      this.raf = 0;
      this.dot = this.makeDot();
      this.resize();
    }

    makeDot() {
      const d = document.createElement('canvas');
      d.width = d.height = 64;
      const c = d.getContext('2d');
      const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,252,236,1)');
      g.addColorStop(0.18, 'rgba(255,226,150,0.85)');
      g.addColorStop(0.5, 'rgba(255,150,50,0.22)');
      g.addColorStop(1, 'rgba(255,120,30,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, 64, 64);
      return d;
    }

    resize() {
      const r = this.cv.getBoundingClientRect();
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      this.W = this.cv.width = Math.max(1, Math.round(r.width * dpr));
      this.H = this.cv.height = Math.max(1, Math.round(r.height * dpr));
      this.u = this.H / 720; // one stage pixel
    }

    /** The thread at time t: x from off-screen left to off-screen right, a slow travelling wave. */
    point(s, t) {
      const W = this.W, H = this.H;
      const x = -0.08 * W + s * 1.16 * W;
      const y = H * 0.5
        + Math.sin(s * 5.2 + t * 0.55) * H * 0.07
        + Math.sin(s * 11.5 - t * 0.9) * H * 0.022
        + Math.sin(s * 2.1 + t * 0.21) * H * 0.05;
      return [x, y];
    }

    strokeThread(t, width, alpha, color, offset = 0) {
      const c = this.c;
      c.beginPath();
      for (let i = 0; i <= 120; i++) {
        const [x, y] = this.point(i / 120, t + offset);
        if (i) c.lineTo(x, y); else c.moveTo(x, y);
      }
      c.strokeStyle = color;
      c.globalAlpha = alpha;
      c.lineWidth = width * this.u;
      c.stroke();
    }

    start() {
      const loop = (now) => { this.frame(now); this.raf = requestAnimationFrame(loop); };
      this.raf = requestAnimationFrame(loop);
    }

    stop() { cancelAnimationFrame(this.raf); }

    frame(now) {
      const c = this.c, W = this.W, H = this.H, u = this.u;
      const t = this.reduce ? 0 : (now - this.t0) / 1000;
      const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 0.016;
      this.last = now;
      c.globalCompositeOperation = 'source-over';
      c.globalAlpha = 1;
      c.clearRect(0, 0, W, H);
      c.globalCompositeOperation = 'lighter';
      c.lineCap = 'round';
      c.lineJoin = 'round';
      const burst = this.burstAt ? (now - this.burstAt) / 1000 : 0;
      const swell = this.burstAt ? 1 + Math.min(1, burst * 3) * 1.4 : 1;
      // the thread: a wide soft glow, a warm body, a bright core; a fainter twin just behind
      this.strokeThread(t, 26 * swell, 0.05, '#ff8a2a');
      this.strokeThread(t, 12 * swell, 0.12, '#ffb04a');
      this.strokeThread(t, 5, 0.35, '#ffd890');
      this.strokeThread(t, 1.8, 0.95, '#fff6e2');
      this.strokeThread(t, 1.2, 0.35, '#ffe0a8', -0.35);
      // lights running along it
      for (let k = 0; k < 5; k++) {
        const s = ((t * 0.12 + k / 5) % 1);
        const [x, y] = this.point(s, t);
        const size = (22 + 10 * Math.sin(t * 3 + k)) * u * swell;
        c.globalAlpha = 0.9;
        c.drawImage(this.dot, x - size, y - size, size * 2, size * 2);
      }
      // sparks shed from the thread, drifting up
      if (!this.reduce && Math.random() < 0.5) {
        const s = Math.random();
        const [x, y] = this.point(s, t);
        this.sparks.push({ x, y, vx: rnd(-10, 10) * u, vy: rnd(-40, -12) * u, life: rnd(1.5, 3), age: 0, size: rnd(3, 7) * u });
      }
      // the branching, once clicked
      for (const b of this.branches) this.growBranch(b, dt, burst);
      for (let i = this.sparks.length - 1; i >= 0; i--) {
        const p = this.sparks[i];
        p.age += dt;
        if (p.age > p.life) { this.sparks.splice(i, 1); continue; }
        p.vx *= p.drag || 1; p.vy = p.vy * (p.drag || 1) - 6 * u * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        const k = p.age / p.life;
        c.globalAlpha = Math.min(1, p.age * 5) * (1 - k);
        const s = p.size * (1 - k * 0.5);
        c.drawImage(this.dot, p.x - s, p.y - s, s * 2, s * 2);
      }
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
    }

    growBranch(b, dt, burst) {
      const c = this.c, u = this.u;
      if (burst > b.delay && b.len < b.max) {
        const step = b.speed * dt;
        b.len += step;
        b.ang += rnd(-1, 1) * b.wiggle * dt * 6;
        const [x, y] = b.pts[b.pts.length - 1];
        b.pts.push([x + Math.cos(b.ang) * step, y + Math.sin(b.ang) * step]);
        if (b.depth < 3 && Math.random() < dt * 2.2 * (3 - b.depth)) {
          this.branches.push(this.newBranch(b.pts[b.pts.length - 1], b.ang + rnd(0.35, 0.9) * (Math.random() < 0.5 ? -1 : 1), b.depth + 1, burst));
        }
      }
      const fade = Math.max(0, 1 - Math.max(0, burst - b.delay - 0.7) * 1.2);
      if (fade <= 0 || b.pts.length < 2) return;
      for (const [w, a, col] of [[9, 0.1, '#ff9a3a'], [3.5, 0.35, '#ffd080'], [1.3, 0.95, '#fff6e2']]) {
        c.beginPath();
        b.pts.forEach(([x, y], i) => { if (i) c.lineTo(x, y); else c.moveTo(x, y); });
        c.strokeStyle = col;
        c.globalAlpha = a * fade;
        c.lineWidth = w * u * (1 - b.depth * 0.22);
        c.stroke();
      }
      const [hx, hy] = b.pts[b.pts.length - 1];
      const s = 14 * u * (1 - b.depth * 0.2);
      c.globalAlpha = fade;
      c.drawImage(this.dot, hx - s, hy - s, s * 2, s * 2);
    }

    newBranch(from, ang, depth, burst) {
      return { pts: [from.slice()], ang, depth, len: 0, max: rnd(0.25, 0.6) * this.W / (depth + 1), speed: rnd(700, 1300) * this.u / (1 + depth * 0.3), wiggle: rnd(0.2, 0.6), delay: burst + (depth ? 0 : rnd(0, 0.18)) };
    }

    /** Branch into light. */
    burst() {
      const now = performance.now();
      this.burstAt = now;
      const t = this.reduce ? 0 : (now - this.t0) / 1000;
      for (let k = 0; k < 16; k++) {
        const s = 0.06 + (k / 15) * 0.88 + rnd(-0.02, 0.02);
        const p = this.point(s, t);
        // threads of light spray up and down from all along the strand
        const up = k % 2 ? -1 : 1;
        this.branches.push(this.newBranch(p, up * Math.PI / 2 + rnd(-0.9, 0.9), 0, 0));
      }
      for (let i = 0; i < 160; i++) {
        const s = Math.random();
        const [x, y] = this.point(s, t);
        const a = rnd(0, TAU), v = rnd(80, 520) * this.u;
        this.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 0.94, life: rnd(0.6, 1.6), age: 0, size: rnd(4, 11) * this.u });
      }
    }
  }

  VN.StrandSplash = StrandSplash;
})();
