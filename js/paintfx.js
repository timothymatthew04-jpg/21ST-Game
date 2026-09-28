/*
 * paintfx.js — brings a painted (non-pixel) title picture to life:
 *
 *   - ginkgo leaves tumbling in 3D, with depth of field (near leaves blurred)
 *   - gusts of wind every few seconds: leaves tear off the canopy, streaks of
 *     air rush past, the tree sways harder and the light flickers
 *   - sun-dapples shimmering on the ground and walls, glints on the leaves,
 *     soft light rays and drifting pollen
 *
 * Everything is drawn at the screen's real resolution (up to 4K), so the
 * effects stay sharp however large the window is. Where the light falls is
 * read from the picture itself (bright spots get dapples, bright leaves get
 * glints), so it works with any painting.
 *
 * Story script:  titlefx ginkgo sun=0.3,-0.15 sway=0.3,0.22,0.34,0.3 pivot=0.36,0.7
 *   sun    where the light comes from (fractions of the screen; may be off-screen)
 *   sway   ellipse of canopy that moves in the wind: centre x,y and radius x,y
 *   pivot  the point the canopy sways around (the base of the trunk)
 */
(function () {
  'use strict';
  const VN = (globalThis.VN = globalThis.VN || {});

  const PRESETS = {
    ginkgo: { leaves: ['#ffd84a', '#f7c236', '#f2a72c', '#ffe27a', '#e98f22', '#fbd35a'], light: [255, 226, 160], count: 58 },
    sakura: { leaves: ['#ffd1dc', '#ffc0cf', '#fbe3ea', '#f6a9bd'], light: [255, 236, 240], count: 70 },
    maple: { leaves: ['#d9432a', '#e8622c', '#c7331f', '#f08a34'], light: [255, 210, 150], count: 52 },
  };

  const rnd = (a, b) => a + Math.random() * (b - a);
  const TAU = Math.PI * 2;

  // ---- sprites (drawn once, stamped many times) ----------------------------------
  function leafSprite(color, blur) {
    // drawn at 2x so leaves stay sharp on 4K screens
    const S = 192;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const x = c.getContext('2d');
    x.translate(S / 2, S / 2 + 12);
    x.scale(2, 2);
    if (blur) x.filter = `blur(${blur * 2}px)`;
    // ginkgo fan
    const g = x.createRadialGradient(0, 18, 2, 0, -8, 34);
    g.addColorStop(0, shade(color, -0.35));
    g.addColorStop(0.55, color);
    g.addColorStop(1, shade(color, 0.25));
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(0, 14);
    x.bezierCurveTo(-10, 8, -30, -2, -30, -16);
    x.quadraticCurveTo(-18, -32, -4, -26);
    x.lineTo(0, -16);
    x.lineTo(4, -26);
    x.quadraticCurveTo(18, -32, 30, -16);
    x.bezierCurveTo(30, -2, 10, 8, 0, 14);
    x.fill();
    // veins
    x.strokeStyle = 'rgba(150, 80, 10, 0.25)';
    x.lineWidth = 0.8;
    for (let a = -1; a <= 1; a += 0.25) {
      x.beginPath();
      x.moveTo(0, 12);
      x.lineTo(Math.sin(a) * 26, 12 - Math.cos(a) * 34);
      x.stroke();
    }
    // stem
    x.strokeStyle = shade(color, -0.45);
    x.lineWidth = 2;
    x.beginPath();
    x.moveTo(0, 12);
    x.quadraticCurveTo(2, 22, -1, 30);
    x.stroke();
    return c;
  }

  function glowSprite(r, g, b, size, core) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const x = c.getContext('2d');
    const gr = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gr.addColorStop(0, `rgba(255,255,255,${core})`);
    gr.addColorStop(0.2, `rgba(${r},${g},${b},0.8)`);
    gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
    x.fillStyle = gr;
    x.fillRect(0, 0, size, size);
    return c;
  }

  function starSprite() {
    const S = 64;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const x = c.getContext('2d');
    x.translate(S / 2, S / 2);
    const halo = x.createRadialGradient(0, 0, 0, 0, 0, S / 2);
    halo.addColorStop(0, 'rgba(255,250,225,0.9)');
    halo.addColorStop(0.25, 'rgba(255,225,150,0.35)');
    halo.addColorStop(1, 'rgba(255,210,120,0)');
    x.fillStyle = halo;
    x.fillRect(-S / 2, -S / 2, S, S);
    x.fillStyle = '#fffdf2';
    x.beginPath();
    for (let i = 0; i < 8; i++) {
      const r = i % 2 ? 2.2 : 26;
      const a = (i / 8) * TAU;
      x.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    x.fill();
    return c;
  }

  function darker(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.round(v * (1 - k)).toString(16).padStart(2, '0');
    return `#${f((n >> 16) & 255)}${f((n >> 8) & 255)}${f(n & 255)}`;
  }

  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (k < 0) { r *= 1 + k; g *= 1 + k; b *= 1 + k; } else { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
    return `rgb(${r | 0},${g | 0},${b | 0})`;
  }

  class PaintFx {
    /**
     * @param host  element to fill (the title's effects layer)
     * @param options  { preset, sun:[x,y], image: url of the picture, sway: [elements] }
     */
    constructor(host, options, settings) {
      this.opts = options;
      this.preset = PRESETS[options.preset] || PRESETS.ginkgo;
      this.reduced = !!(settings && settings.reduceMotion) ||
        (globalThis.matchMedia && globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches);
      this.light = VN.h('canvas.title-fx.fx-light', { 'aria-hidden': 'true' });
      this.canvas = VN.h('canvas.title-fx.fx-leaves', { 'aria-hidden': 'true' });
      host.append(this.light, this.canvas);
      this.lx = this.light.getContext('2d');
      this.cx = this.canvas.getContext('2d');
      this.host = host;
      this.W = 1328;
      this.H = 768;
      this.t = 0;
      this.last = 0;
      this.gust = 0;
      this.nextGust = rnd(2.5, 4);
      this.gustT = -1;

      const [lr, lg, lb] = this.preset.light;
      this.sprites = {
        // front and (darker) back of each leaf colour, sharp / soft / blurred
        leaves: this.preset.leaves.map((c) => ({
          front: [0, 2.5, 5].map((b) => leafSprite(c, b)),
          back: [0, 2.5, 5].map((b) => leafSprite(darker(c, 0.2), b)),
        })),
        mote: glowSprite(lr, lg, lb, 32, 0.95),
        dapple: glowSprite(255, 240, 200, 128, 0.55),
        star: starSprite(),
      };
      const sun = options.sun || [0.3, -0.15];
      this.sun = { x: sun[0] * this.W, y: sun[1] * this.H };
      this.rays = Array.from({ length: 8 }, (_, i) => ({ a: 0.55 + i * 0.13 + rnd(-0.03, 0.03), w: rnd(0.025, 0.06), ph: rnd(0, TAU), sp: rnd(0.15, 0.4), k: rnd(0.5, 1) }));
      this.dapples = [];
      this.glints = [];
      this.motes = Array.from({ length: this.reduced ? 15 : 55 }, () => this.newMote(true));
      this.leaves = Array.from({ length: this.reduced ? 12 : this.preset.count }, () => this.newLeaf(true)).sort((a, b) => a.z - b.z);
      this.streaks = [];
      this.swayEls = [];
      if (options.image && options.sway && options.swayHost && !this.reduced) this.makeSway(options.swayHost, options.image, options.sway, options.pivot);

      if (options.image) this.readLight(options.image);
      this.resize();
      this.ro = globalThis.ResizeObserver ? new ResizeObserver(() => this.resize()) : null;
      if (this.ro) this.ro.observe(this.canvas);
      this.frame = this.frame.bind(this);
      this.raf = requestAnimationFrame(this.frame);
    }

    /**
     * Cut the canopy out of the painting once (soft edges baked in) so it can
     * sway with a cheap transform instead of a live CSS mask.
     */
    makeSway(host, url, sway, pivot) {
      const img = new Image();
      img.onload = () => {
        const W = host.offsetWidth, H = host.offsetHeight;
        if (!W) return;
        const [cx, cy, rx, ry] = sway;
        const [px, py] = pivot || [cx, cy + ry * 2];
        const s = Math.max(W / img.width, H / img.height); // same framing as background-size: cover
        const ox = (W - img.width * s) / 2, oy = (H - img.height * s) / 2;
        const bx = Math.max(0, (cx - rx) * W), by = Math.max(0, (cy - ry) * H);
        const bw = Math.min(W, (cx + rx) * W) - bx, bh = Math.min(H, (cy + ry) * H) - by;
        const dpr = 2;
        const c = document.createElement('canvas');
        c.width = Math.round(bw * dpr); c.height = Math.round(bh * dpr);
        const x = c.getContext('2d');
        x.scale(dpr, dpr);
        x.drawImage(img, ox - bx, oy - by, img.width * s, img.height * s);
        // feather the edges into an ellipse
        x.globalCompositeOperation = 'destination-in';
        x.setTransform(dpr * rx * W, 0, 0, dpr * ry * H, dpr * (cx * W - bx), dpr * (cy * H - by));
        const g = x.createRadialGradient(0, 0, 0, 0, 0, 1);
        g.addColorStop(0, '#000'); g.addColorStop(0.55, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = g;
        x.fillRect(-1, -1, 2, 2);
        c.className = 'title-sway';
        Object.assign(c.style, { left: `${bx}px`, top: `${by}px`, width: `${bw}px`, height: `${bh}px`, transformOrigin: `${px * W - bx}px ${py * H - by}px` });
        host.append(c);
        this.swayEls.push(c);
      };
      img.src = url;
    }

    /** Find where light already falls in the painting, to place dapples and glints. */
    readLight(url) {
      const img = new Image();
      img.onload = () => {
        const w = 160, h = 90;
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const x = c.getContext('2d');
        x.drawImage(img, 0, 0, w, h);
        const d = x.getImageData(0, 0, w, h).data;
        const ground = [], canopy = [];
        for (let y = 2; y < h - 2; y++) for (let X = 2; X < w - 2; X++) {
          const i = (y * w + X) * 4;
          const lum = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
          const pt = { x: (X / w) * this.W, y: (y / h) * this.H, lum };
          // dapples go where sunlight already falls and the screen isn't shaded for the menu
          if (y > h * 0.45 && y < h * 0.86 && X > w * 0.45 && lum > 200) ground.push(pt);
          if (y < h * 0.55 && lum > 215) canopy.push(pt);
        }
        const pick = (arr, n) => Array.from({ length: Math.min(n, arr.length) }, () => arr[Math.floor(Math.random() * arr.length)]);
        this.dapples = pick(ground, 22).map((p) => ({ ...p, r: rnd(12, 30), ph: rnd(0, TAU), sp: rnd(0.6, 1.6), k: rnd(0.2, 0.42), sx: rnd(1.3, 2.2) }));
        this.glints = pick(canopy, 26).map((p) => ({ ...p, next: rnd(0, 6), life: 0 }));
      };
      img.src = url;
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      if (!rect.width) return;
      this.W = this.host.offsetWidth || 1328;
      this.H = this.host.offsetHeight || 768;
      const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
      const w = Math.min(3840, Math.round(rect.width * dpr));
      const h = Math.round((w * this.H) / this.W);
      if (this.canvas.width !== w) { this.canvas.width = w; this.canvas.height = h; }
      const lw = Math.round(w / 2), lh = Math.round(h / 2);
      if (this.light.width !== lw) { this.light.width = lw; this.light.height = lh; }
    }

    newMote(anywhere) {
      return {
        x: rnd(0, this.W), y: anywhere ? rnd(0, this.H) : this.H + 10,
        vx: rnd(-6, 6), vy: rnd(-14, -4), ph: rnd(0, TAU), s: rnd(3, 9), tw: rnd(1, 3),
      };
    }

    newLeaf(anywhere, fromTree) {
      const z = Math.random() ** 1.3;
      return {
        z,
        sprite: Math.floor(Math.random() * this.preset.leaves.length),
        x: fromTree ? rnd(0.02, 0.62) * this.W : anywhere ? rnd(-60, this.W) : rnd(-120, this.W * 0.8),
        y: fromTree ? rnd(0.02, 0.42) * this.H : anywhere ? rnd(-40, this.H) : rnd(-80, -30),
        size: 14 + z ** 1.5 * 56,
        vy: rnd(28, 48) * (0.55 + z * 0.7),
        drift: rnd(8, 22),
        rot: rnd(0, TAU),
        spin: rnd(-1.8, 1.8),
        flipF: rnd(1.5, 4.5),
        ph: rnd(0, TAU),
        sway: rnd(14, 34),
      };
    }

    frame(now) {
      if (!this.canvas.isConnected && this.last) { this.stop(); return; }
      const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 0.016;
      this.last = now;
      this.t += dt;
      this.updateWind(dt);
      this.drawLight();
      this.drawLeaves(dt);
      this.swayCanopy();
      this.raf = requestAnimationFrame(this.frame);
    }

    updateWind(dt) {
      if (this.reduced) { this.gust = 0; return; }
      this.nextGust -= dt;
      if (this.nextGust <= 0 && this.gustT < 0) {
        this.gustT = 0;
        this.nextGust = rnd(7, 12);
        // a gust tears a handful of leaves from the canopy
        for (let i = 0; i < 10; i++) {
          const k = Math.floor(Math.random() * this.leaves.length);
          const z = this.leaves[k].z;
          this.leaves[k] = Object.assign(this.newLeaf(false, true), { z, size: 14 + z ** 1.5 * 56 });
        }
        for (let i = 0; i < 16; i++) this.streaks.push({ x: rnd(-300, this.W * 0.6), y: rnd(0.05, 0.95) * this.H, len: rnd(160, 420), sp: rnd(700, 1200), a: rnd(0.25, 0.6), bend: rnd(-30, 30), w: rnd(0.8, 2.2) });
      }
      if (this.gustT >= 0) {
        this.gustT += dt;
        const T = this.gustT;
        // ease in, hold, ease out
        this.gust = T < 0.9 ? (T / 0.9) ** 2 : T < 2.4 ? 1 : Math.max(0, 1 - (T - 2.4) / 1.8);
        if (T > 4.2) this.gustT = -1;
      } else this.gust = 0;
    }

    drawLight() {
      const x = this.lx;
      const s = this.light.width / this.W;
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.clearRect(0, 0, this.light.width, this.light.height);
      x.setTransform(s, 0, 0, s, 0, 0);
      const t = this.t, g = this.gust;
      const [lr, lg, lb] = this.preset.light;
      x.globalCompositeOperation = 'lighter';

      // soft sun rays through the leaves
      const L = this.W * 1.3;
      for (const r of this.rays) {
        const a = r.a + Math.sin(t * 0.05 + r.ph) * 0.03;
        const alpha = r.k * (0.035 + 0.09 * (0.5 + 0.5 * Math.sin(t * r.sp + r.ph)) ** 2) * (1 - g * 0.35);
        const gr = x.createRadialGradient(this.sun.x, this.sun.y, 0, this.sun.x, this.sun.y, L);
        gr.addColorStop(0.1, `rgba(${lr},${lg},${lb},${alpha})`);
        gr.addColorStop(0.7, `rgba(${lr},${lg},${lb},${alpha * 0.4})`);
        gr.addColorStop(1, `rgba(${lr},${lg},${lb},0)`);
        x.fillStyle = gr;
        x.beginPath();
        x.moveTo(this.sun.x, this.sun.y);
        x.lineTo(this.sun.x + Math.cos(a - r.w) * L, this.sun.y + Math.sin(a - r.w) * L);
        x.lineTo(this.sun.x + Math.cos(a + r.w) * L, this.sun.y + Math.sin(a + r.w) * L);
        x.fill();
      }

      // sun-dapples shimmering as the leaves above them move
      x.globalCompositeOperation = 'screen';
      for (const d of this.dapples) {
        const flick = 0.5 + 0.5 * Math.sin(t * d.sp * (1 + g * 3) + d.ph) * Math.sin(t * d.sp * 0.37 + d.ph * 2);
        const a = d.k * (0.25 + 0.75 * flick) * (0.8 + g * 0.5);
        const jx = Math.sin(t * 1.3 + d.ph) * (3 + g * 10);
        const jy = Math.cos(t * 1.1 + d.ph) * (2 + g * 5);
        x.globalAlpha = Math.min(1, a);
        const w = d.r * d.sx, h = d.r;
        x.drawImage(this.sprites.dapple, d.x - w + jx, d.y - h + jy, w * 2, h * 2);
      }
      x.globalAlpha = 1;
      x.globalCompositeOperation = 'source-over';
    }

    drawLeaves(dt) {
      const x = this.cx;
      const s = this.canvas.width / this.W;
      const t = this.t, g = this.gust;
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.clearRect(0, 0, this.canvas.width, this.canvas.height);
      x.setTransform(s, 0, 0, s, 0, 0);

      // glints on the leaves catching the sun
      x.globalCompositeOperation = 'lighter';
      for (const gl of this.glints) {
        gl.next -= dt * (1 + g * 4);
        if (gl.next <= 0 && gl.life <= 0) { gl.life = 1; gl.next = rnd(2, 7); gl.sz = rnd(18, 40); }
        if (gl.life > 0) {
          gl.life -= dt * 1.6;
          const k = Math.sin(Math.max(0, gl.life) * Math.PI);
          x.globalAlpha = k;
          const z = gl.sz * (0.4 + 0.6 * k);
          x.save();
          x.translate(gl.x, gl.y);
          x.rotate(t * 0.8);
          x.drawImage(this.sprites.star, -z / 2, -z / 2, z, z);
          x.restore();
        }
      }

      // pollen and dust floating in the light
      for (let i = 0; i < this.motes.length; i++) {
        const m = this.motes[i];
        m.x += (m.vx + Math.sin(t * 0.7 + m.ph) * 8 + g * 160) * dt;
        m.y += (m.vy + Math.cos(t * 0.5 + m.ph) * 4) * dt;
        if (m.y < -20 || m.x > this.W + 20 || m.x < -20) { this.motes[i] = this.newMote(false); if (m.x > this.W) this.motes[i].x = rnd(-20, this.W * 0.3); continue; }
        x.globalAlpha = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * m.tw + m.ph));
        x.drawImage(this.sprites.mote, m.x - m.s, m.y - m.s, m.s * 2, m.s * 2);
      }

      // streaks of wind during a gust
      if (this.streaks.length) {
        x.lineCap = 'round';
        for (let i = this.streaks.length - 1; i >= 0; i--) {
          const st = this.streaks[i];
          st.x += st.sp * dt;
          if (st.x - st.len > this.W) { this.streaks.splice(i, 1); continue; }
          const gr = x.createLinearGradient(st.x - st.len, 0, st.x, 0);
          gr.addColorStop(0, 'rgba(255,248,225,0)');
          gr.addColorStop(0.7, `rgba(255,248,225,${st.a * Math.max(0.2, g)})`);
          gr.addColorStop(1, 'rgba(255,248,225,0)');
          x.strokeStyle = gr;
          x.lineWidth = st.w;
          x.beginPath();
          x.moveTo(st.x - st.len, st.y);
          x.quadraticCurveTo(st.x - st.len / 2, st.y + st.bend, st.x, st.y + st.bend * 0.3);
          x.stroke();
        }
      }
      x.globalAlpha = 1;
      x.globalCompositeOperation = 'source-over';

      // leaves tumbling (far ones first)
      const wind = 18 + Math.sin(t * 0.3) * 8 + g * 260;
      for (let i = 0; i < this.leaves.length; i++) {
        const f = this.leaves[i];
        f.y += f.vy * (1 - g * 0.25) * dt;
        f.x += (f.drift + wind * (0.4 + f.z) + Math.sin(t * 1.2 + f.ph) * f.sway) * dt;
        f.rot += f.spin * (1 + g * 2.5) * dt;
        if (f.y > this.H + 60 || f.x > this.W + 80) {
          const z = f.z;
          this.leaves[i] = Object.assign(this.newLeaf(false, Math.random() < 0.35), { z, size: 14 + z ** 1.5 * 56 });
          continue;
        }
        const flip = Math.cos(t * f.flipF + f.ph);
        const blur = f.z > 0.82 ? 2 : f.z < 0.18 ? 1 : 0;
        const img = this.sprites.leaves[f.sprite][flip < 0 ? 'back' : 'front'][blur];
        const sz = f.size;
        x.globalAlpha = 0.55 + f.z * 0.45;
        x.save();
        x.translate(f.x, f.y);
        x.rotate(f.rot);
        x.scale(Math.max(0.12, Math.abs(flip)) * (flip < 0 ? -1 : 1), 1);
        x.drawImage(img, -sz / 2, -sz / 2, sz, sz);
        x.restore();
      }
      x.globalAlpha = 1;
    }

    swayCanopy() {
      if (!this.swayEls.length || this.reduced) return;
      const t = this.t, g = this.gust;
      this.swayEls.forEach((el, i) => {
        const a = Math.sin(t * (0.8 + i * 0.23) + i) * (0.22 + g * 0.55) + Math.sin(t * 2.7 + i * 2) * g * 0.25;
        const sk = Math.sin(t * (0.6 + i * 0.3) + 1 + i) * (0.25 + g * 0.6);
        el.style.transform = `rotate(${a.toFixed(3)}deg) skewX(${sk.toFixed(3)}deg)`;
      });
    }

    stop() {
      cancelAnimationFrame(this.raf);
      if (this.ro) this.ro.disconnect();
    }
  }

  /** A small tile of film grain, generated once (used over painted title art). */
  let grainUrl = null;
  VN.noiseTile = () => {
    if (grainUrl) return grainUrl;
    const c = document.createElement('canvas');
    c.width = c.height = 160;
    const x = c.getContext('2d');
    const d = x.createImageData(160, 160);
    for (let i = 0; i < d.data.length; i += 4) {
      const v = 128 + (Math.random() - 0.5) * 110;
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
      d.data[i + 3] = 255;
    }
    x.putImageData(d, 0, 0);
    grainUrl = c.toDataURL('image/png');
    return grainUrl;
  };

  VN.PaintFx = PaintFx;
  VN.PAINT_PRESETS = PRESETS;
})();
