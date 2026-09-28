/*
 * titlefx.js — brings the title screen's cover art to life: sun glow and
 * shifting light rays, drifting mist, glowing specks of light, and pixel
 * leaves that tumble down on the wind.
 *
 * Everything is drawn on a small canvas (480×270) that is scaled up with
 * crisp pixels, so the particles match the pixel art underneath.
 *
 * Turned on from the story script:
 *   titlefx autumn sun=0.28,0.45 rays=-0.1,-0.3
 *     sun   where the sun glows in the picture (x,y as fractions of the screen)
 *     rays  where the light shafts come from (can be off-screen)
 * Presets: autumn (maple leaves), spring (cherry petals), summer (green leaves), none.
 */
(function () {
  'use strict';
  const VN = (globalThis.VN = globalThis.VN || {});

  const W = 480;
  const H = 270;

  const PRESETS = {
    autumn: {
      leaves: [['#b8321d', '#7e1f14'], ['#d9482a', '#95301b'], ['#ec7a2c', '#a8501c'], ['#f4a93a', '#b8762a'], ['#c9402a', '#842716']],
      light: [255, 206, 140],
      mote: '#ffe7b0',
      mist: [255, 222, 186],
      count: 64,
    },
    spring: {
      leaves: [['#f7c9d6', '#d99aae'], ['#fbe1e8', '#e2b3c1'], ['#f2a9c0', '#c97a93']],
      light: [255, 236, 214],
      mote: '#fff4f8',
      mist: [255, 240, 246],
      count: 54,
    },
    summer: {
      leaves: [['#8fcb5a', '#4f8a33'], ['#b7dc6b', '#6f9c3a'], ['#6aae4a', '#3d7430']],
      light: [255, 244, 200],
      mote: '#fffbd8',
      mist: [236, 250, 230],
      count: 30,
    },
  };

  // Leaf sprites (1 = main colour, 2 = shade). Drawn squashed sideways to tumble.
  const SHAPES = [
    [[1, 1]],
    [[0, 1, 0], [1, 1, 2], [0, 2, 0]],
    [[0, 1, 1, 0], [1, 1, 1, 2], [0, 1, 2, 0]],
    [[0, 0, 1, 0, 0], [1, 0, 1, 0, 1], [1, 1, 1, 1, 2], [0, 1, 1, 2, 0], [0, 0, 2, 0, 0]],
  ];

  const rnd = (a, b) => a + Math.random() * (b - a);

  class TitleFx {
    constructor(host, options, settings) {
      this.preset = PRESETS[options.preset] || PRESETS.autumn;
      this.sun = options.sun || [0.3, 0.4];
      this.rayFrom = options.rays || [this.sun[0] - 0.4, -0.3];
      this.reduced = !!(settings && settings.reduceMotion) ||
        (globalThis.matchMedia && globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches);
      this.canvas = VN.h('canvas.title-fx', { width: W, height: H, 'aria-hidden': 'true' });
      host.append(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      this.t = 0;
      this.last = 0;
      this.raf = 0;

      this.sx = this.sun[0] * W;
      this.sy = this.sun[1] * H;
      this.rx = this.rayFrom[0] * W;
      this.ry = this.rayFrom[1] * H;
      // Light shafts fanning across the scene from the light source.
      const toward = Math.atan2(H * 0.6 - this.ry, W * 0.55 - this.rx);
      this.rays = Array.from({ length: 11 }, (_, i) => ({
        angle: toward + (i - 5) * 0.075 + rnd(-0.02, 0.02),
        width: rnd(0.008, 0.024),
        speed: rnd(0.2, 0.55),
        phase: rnd(0, Math.PI * 2),
        strength: rnd(0.55, 1),
      }));
      this.mist = Array.from({ length: 3 }, (_, i) => ({ x: rnd(0, W), y: H * (0.52 + i * 0.12), w: rnd(160, 260), speed: rnd(3, 7) * (i % 2 ? -1 : 1), a: rnd(0.05, 0.09) }));
      this.motes = Array.from({ length: this.reduced ? 12 : 42 }, () => this.newMote(true));
      const count = this.reduced ? 10 : this.preset.count;
      this.leaves = Array.from({ length: count }, () => this.newLeaf(true)).sort((a, b) => a.z - b.z);
      this.frame = this.frame.bind(this);
      this.raf = requestAnimationFrame(this.frame);
    }

    newMote(anywhere) {
      // Specks gather in the sunlight, so spawn them around the sun.
      const r = rnd(10, 190);
      const a = rnd(-0.6, 2.2);
      return {
        x: anywhere ? this.sx + Math.cos(a) * r : rnd(0, W),
        y: anywhere ? this.sy + Math.sin(a) * r * 0.7 : H + 4,
        vx: rnd(-2.5, 2.5),
        vy: rnd(-5, -1.5),
        phase: rnd(0, Math.PI * 2),
        tw: rnd(1.5, 3.5),
        big: Math.random() < 0.2,
      };
    }

    newLeaf(anywhere) {
      const z = Math.random() ** 1.6; // most leaves are far away
      const shape = z < 0.25 ? 0 : z < 0.55 ? 1 : z < 0.85 ? 2 : 3;
      const fromRight = Math.random() < 0.35;
      return {
        z,
        shape,
        colors: this.preset.leaves[Math.floor(Math.random() * this.preset.leaves.length)],
        x: anywhere ? rnd(-10, W + 40) : fromRight ? W + rnd(4, 30) : rnd(0, W + 60),
        y: anywhere ? rnd(-20, H) : fromRight ? rnd(-10, H * 0.55) : rnd(-24, -6),
        vy: rnd(8, 14) * (0.45 + z),
        vx: rnd(-9, -3) * (0.5 + z),
        sway: rnd(4, 12) * (0.4 + z),
        swayF: rnd(0.8, 1.8),
        flipF: rnd(1.2, 4),
        phase: rnd(0, Math.PI * 2),
      };
    }

    frame(now) {
      if (!this.canvas.isConnected && this.last) return this.stop();
      const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 0.016;
      this.last = now;
      this.t += dt;
      this.draw(dt);
      this.raf = requestAnimationFrame(this.frame);
    }

    draw(dt) {
      const { ctx, t } = this;
      const [lr, lg, lb] = this.preset.light;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';

      // Sun glow, breathing slowly.
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.7);
      const glowR = 70 + pulse * 14;
      let g = ctx.createRadialGradient(this.sx, this.sy, 0, this.sx, this.sy, glowR);
      g.addColorStop(0, `rgba(${lr},${lg},${lb},${0.34 + pulse * 0.08})`);
      g.addColorStop(0.35, `rgba(${lr},${lg},${lb},0.12)`);
      g.addColorStop(1, `rgba(${lr},${lg},${lb},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(this.sx - glowR, this.sy - glowR, glowR * 2, glowR * 2);

      // Light shafts sweeping slowly and shimmering in and out.
      const L = 760;
      const { rx, ry } = this;
      for (const r of this.rays) {
        const a = r.angle + Math.sin(t * 0.07 + r.phase) * 0.025;
        const alpha = r.strength * (0.03 + 0.15 * (0.5 + 0.5 * Math.sin(t * r.speed + r.phase)) ** 2);
        g = ctx.createRadialGradient(rx, ry, 0, rx, ry, L);
        g.addColorStop(0, `rgba(${lr},${lg},${lb},0)`);
        g.addColorStop(0.3, `rgba(${lr},${lg},${lb},${alpha})`);
        g.addColorStop(0.75, `rgba(${lr},${lg},${lb},${alpha * 0.45})`);
        g.addColorStop(1, `rgba(${lr},${lg},${lb},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx + Math.cos(a - r.width) * L, ry + Math.sin(a - r.width) * L);
        ctx.lineTo(rx + Math.cos(a + r.width) * L, ry + Math.sin(a + r.width) * L);
        ctx.closePath();
        ctx.fill();
      }

      // Mist drifting across the valley.
      ctx.globalCompositeOperation = 'screen';
      const [mr, mg, mb] = this.preset.mist;
      for (const m of this.mist) {
        m.x += m.speed * dt;
        if (m.x > W + m.w) m.x = -m.w;
        if (m.x < -m.w) m.x = W + m.w;
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.scale(1, 0.22);
        g = ctx.createRadialGradient(0, 0, 0, 0, 0, m.w);
        g.addColorStop(0, `rgba(${mr},${mg},${mb},${m.a})`);
        g.addColorStop(1, `rgba(${mr},${mg},${mb},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(-m.w, -m.w, m.w * 2, m.w * 2);
        ctx.restore();
      }

      // Specks of light floating in the sunbeams.
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = this.preset.mote;
      for (let i = 0; i < this.motes.length; i++) {
        const p = this.motes[i];
        p.x += (p.vx + Math.sin(t * 0.9 + p.phase) * 3) * dt;
        p.y += p.vy * dt;
        if (p.y < -4 || p.x < -4 || p.x > W + 4) { this.motes[i] = this.newMote(Math.random() < 0.7); continue; }
        const near = Math.max(0.15, 1 - Math.hypot(p.x - this.sx, (p.y - this.sy) * 1.4) / 260);
        ctx.globalAlpha = near * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * p.tw + p.phase)));
        const s = p.big ? 2 : 1;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), s, s);
      }
      ctx.globalAlpha = 1;

      // Leaves tumbling on the wind (gusts every so often).
      ctx.globalCompositeOperation = 'source-over';
      const gust = Math.max(0, Math.sin(t * 0.21)) ** 4 * 26 + Math.max(0, Math.sin(t * 0.53 + 1)) ** 6 * 10;
      for (let i = 0; i < this.leaves.length; i++) {
        const f = this.leaves[i];
        f.y += f.vy * dt;
        f.x += (f.vx - gust * (0.4 + f.z) + Math.sin(t * f.swayF + f.phase) * f.sway) * dt;
        if (f.y > H + 8 || f.x < -14) { this.leaves[i] = Object.assign(this.newLeaf(false), { z: f.z, shape: f.shape }); continue; }
        this.drawLeaf(f, Math.cos(t * f.flipF + f.phase));
      }
    }

    drawLeaf(f, flip) {
      const ctx = this.ctx;
      const shape = SHAPES[f.shape];
      const cols = shape[0].length;
      const px = f.z > 0.7 ? 2 : 1; // the closest leaves are drawn with bigger pixels
      const w = Math.max(1, Math.round(cols * Math.abs(flip)));
      const back = flip < 0;
      const x0 = Math.round(f.x - (w * px) / 2);
      const y0 = Math.round(f.y);
      ctx.globalAlpha = 0.6 + f.z * 0.4;
      for (let row = 0; row < shape.length; row++) {
        for (let c = 0; c < w; c++) {
          const src = Math.min(cols - 1, Math.floor((c / w) * cols));
          const v = shape[row][back ? cols - 1 - src : src];
          if (!v) continue;
          ctx.fillStyle = (v === 2) !== back ? f.colors[1] : f.colors[0];
          ctx.fillRect(x0 + c * px, y0 + row * px, px, px);
        }
      }
      ctx.globalAlpha = 1;
    }

    stop() {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  VN.TitleFx = TitleFx;
})();
