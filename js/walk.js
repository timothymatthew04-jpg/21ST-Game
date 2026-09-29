/*
 * walk.js — the walking areas, in the spirit of Kingdom Two Crowns: a side view of a long
 * painted place, layers sliding past at different speeds, the whole world mirrored in the
 * water below, and Hervé walking (or riding) through it. Things along the way can be picked up
 * (francs, keepsakes), looked at, or talked to; reaching the goal hands the story back.
 *
 * The places are painted by tools/paint-walks.js (story/walkscenery.js says how the layers
 * stack); what happens in each is written in story/walks.js. The script starts one with:
 *
 *   walk camp
 *
 * Controls: ← → or A D to walk, Shift to run, E / Space / Enter to look, pick up or talk,
 * or hold the mouse (or a finger) on either side of the screen; click something to go to it.
 */
(function () {
  'use strict';
  const VN = (globalThis.VN = globalThis.VN || {});
  const h = VN.h;

  const LW = 480, LH = 270, GY = 204, WY = 211, SS = 2; // the painted size, ground line, water line, supersampling
  const REACH = 24; // how close Hervé must be to something to use it
  const url = (src) => (globalThis.VN_EMBEDDED_ASSETS || {})[src] || src;
  const images = new Map();
  function image(src) {
    if (!images.has(src)) {
      images.set(src, new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url(src);
      }));
    }
    return images.get(src);
  }

  // ---------------------------------------------------------------- little people, drawn in pixels
  // Each look is a few colours and a hat; the figures are about 24 pixels tall, like Kingdom's.
  const LOOKS = {
    soldier: { coat: '#2e4a8a', coatDark: '#22386a', legs: '#b83a3a', boots: '#1a1412', skin: '#e8c0a0', hat: 'kepi', hatCol: '#b83a3a', belt: '#e8dcc0' },
    traveller: { coat: '#5a3e2a', coatDark: '#42301f', legs: '#3a3440', boots: '#1a1412', skin: '#e8c0a0', hat: 'tophat', hatCol: '#1e1a1e', scarf: '#e8dcc8' },
    mourner: { coat: '#1e1e26', coatDark: '#141418', legs: '#26262e', boots: '#101014', skin: '#e0bca0', hat: 'tophat', hatCol: '#101014' },
    baldabiou: { coat: '#6a4a2e', coatDark: '#50381f', legs: '#4a3a2a', boots: '#2a1e14', skin: '#e8b898', hat: 'hat', hatCol: '#e8dcc0', wide: 1, beard: '#8a8a8a' },
    drummer: { coat: '#2e4a8a', coatDark: '#22386a', legs: '#b83a3a', boots: '#1a1412', skin: '#f0c8a8', hat: 'kepi', hatCol: '#b83a3a', small: 1, drum: 1 },
    villager: { coat: '#6a6258', coatDark: '#4e483f', legs: '#3a342e', boots: '#2a2018', skin: '#e0b494', hat: 'fur', hatCol: '#4a3a2a', beard: '#6a5a4a' },
    merchant: { coat: '#8a3a2a', coatDark: '#6a2a1e', legs: '#3a2a22', boots: '#2a1e14', skin: '#d8a888', hat: 'fur', hatCol: '#2a2020' },
    guard: { coat: '#2a2a3a', coatDark: '#1c1c2a', legs: '#1c1c2a', boots: '#141418', skin: '#e0b898', hat: 'topknot', hatCol: '#141418', sword: 1 },
    servant: { coat: '#8a5a7a', coatDark: '#6a4460', legs: '#6a4460', boots: '#e8e0d0', skin: '#f0d0b8', hat: 'bun', hatCol: '#1a1418', robe: 1 },
    boy: { coat: '#6a5a3a', coatDark: '#50442a', legs: '#50442a', boots: '#e8c0a0', skin: '#e8c0a0', hat: 'none', hatCol: '#1a1414', small: 1 },
    patrol: { coat: '#3a3a2a', coatDark: '#2a2a1e', legs: '#2a2a1e', boots: '#141410', skin: '#d8b090', hat: 'jingasa', hatCol: '#2a2420', lantern: 1 },
  };

  function rect(c, x, y, w, hh, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(hh)); }

  /** A person standing (or walking) with their feet at (x, y), facing right; flip the canvas to face left. */
  function drawPerson(c, L, t, moving, running) {
    const k = L.small ? 0.8 : 1;
    const legH = Math.round(8 * k), bodyH = Math.round(10 * k), w = Math.round((L.wide ? 8 : 6) * k);
    const ph = t * (running ? 16 : 10);
    const swing = moving ? Math.sin(ph) : 0;
    const bob = moving ? Math.round(Math.abs(Math.sin(ph)) * 1) : 0;
    const y = -bob;
    // legs (a long robe hides them)
    if (L.robe) {
      rect(c, -w / 2 - 1, y - legH - 1, w + 2, legH + 1, L.coatDark);
      rect(c, -w / 2 + swing, y - 2, 3, 2, L.boots); rect(c, w / 2 - 3 - swing, y - 2, 3, 2, L.boots);
    } else {
      rect(c, -2 + Math.round(swing * 2), y - legH, 2, legH, L.legs);
      rect(c, 1 - Math.round(swing * 2), y - legH, 2, legH, L.legs);
      rect(c, -2 + Math.round(swing * 2), y - 2, 3, 2, L.boots);
      rect(c, 1 - Math.round(swing * 2), y - 2, 3, 2, L.boots);
    }
    // the coat, darker at the back, with its tail swinging a little
    const top = y - legH - bodyH;
    rect(c, -w / 2, top, w, bodyH + 2, L.coat);
    rect(c, -w / 2, top, 2, bodyH + 2, L.coatDark);
    if (!L.robe) rect(c, -w / 2 - 1 + (moving ? Math.round(-swing) : 0), top + bodyH - 1, 2, 3, L.coatDark);
    if (L.belt) rect(c, -w / 2, top + bodyH - 4, w, 1, L.belt);
    if (L.scarf) rect(c, -w / 2 + 1, top, w - 1, 2, L.scarf);
    // an arm swinging opposite to the legs
    rect(c, 0 - Math.round(swing * 2), top + 2, 2, 7, L.coatDark);
    rect(c, 0 - Math.round(swing * 2), top + 8, 2, 2, L.skin);
    // the head, and whatever is on it
    const hy = top - 5;
    rect(c, -2, hy, 5, 5, L.skin);
    rect(c, 2, hy + 2, 1, 1, '#2a1a14');
    if (L.beard) rect(c, -2, hy + 3, 5, 2, L.beard);
    const hc = L.hatCol;
    if (L.hat === 'kepi') { rect(c, -2, hy - 2, 5, 3, hc); rect(c, 1, hy + 1, 3, 1, '#1a1412'); rect(c, -2, hy - 2, 5, 1, '#2e2a4a'); }
    else if (L.hat === 'tophat') { rect(c, -2, hy - 5, 5, 5, hc); rect(c, -3, hy - 1, 7, 1, hc); }
    else if (L.hat === 'hat') { rect(c, -4, hy - 1, 9, 1, hc); rect(c, -2, hy - 3, 5, 2, hc); rect(c, -2, hy - 2, 5, 1, '#8a5a3a'); }
    else if (L.hat === 'fur') { rect(c, -3, hy - 3, 7, 3, hc); }
    else if (L.hat === 'topknot') { rect(c, -2, hy - 1, 5, 2, hc); rect(c, -1, hy - 3, 2, 2, hc); }
    else if (L.hat === 'bun') { rect(c, -3, hy - 1, 6, 3, hc); rect(c, -4, hy - 3, 3, 3, hc); }
    else if (L.hat === 'jingasa') { rect(c, -5, hy - 1, 11, 1, hc); rect(c, -3, hy - 2, 7, 1, hc); }
    else rect(c, -2, hy - 1, 5, 2, hc);
    if (L.sword) rect(c, -w / 2 - 1, top + bodyH - 3, 8, 1, '#8a8a90');
    if (L.drum) { rect(c, 2, top + 5, 5, 5, '#b83a3a'); rect(c, 2, top + 5, 5, 1, '#e8dcc8'); }
    if (L.lantern) { rect(c, 4, top + 4, 1, 4, '#3a2a22'); rect(c, 3, top + 8, 3, 4, '#ffcf72'); }
  }

  /** A horse at a walk or a gallop, facing right, with its rider. */
  function drawHorse(c, t, moving, running, rider) {
    const ph = t * (running ? 14 : 8);
    const gait = moving ? Math.sin(ph) : 0;
    const bob = moving ? Math.round(Math.abs(Math.sin(ph)) * (running ? 2 : 1)) : 0;
    const y = -bob;
    const coat = '#6a4630', dark = '#4a3020', mane = '#2a1a14';
    // four legs, in two pairs that move against each other
    const leg = (x, a) => { rect(c, x + Math.round(a * 2), y - 9, 2, 9, dark); rect(c, x + Math.round(a * 2), y - 2, 2, 2, '#1a1412'); };
    leg(-8, gait); leg(-5, -gait); leg(5, -gait); leg(8, gait);
    rect(c, -10, y - 17, 21, 9, coat); // the body
    rect(c, -10, y - 17, 21, 2, '#7a5640');
    rect(c, 9, y - 23, 4, 9, coat); // the neck
    rect(c, 11, y - 25, 7, 4, coat); // the head
    rect(c, 16, y - 23, 2, 2, dark);
    rect(c, 9, y - 25, 3, 8, mane);
    rect(c, 15, y - 24, 1, 1, '#1a1412');
    rect(c, -13, y - 16 + Math.round(gait), 3, 7, mane); // the tail
    if (rider) {
      c.save();
      c.translate(0, y - 13);
      drawPerson(c, { ...rider, legs: rider.coatDark }, 0, false, false);
      c.restore();
    }
  }

  // ---------------------------------------------------------------- weather and light
  function makeWeather(kind, n) {
    const parts = [];
    for (let i = 0; i < n; i++) parts.push({ x: Math.random() * LW, y: Math.random() * LH, v: 0.5 + Math.random(), p: Math.random() * 6 });
    return { kind, parts };
  }
  function stepWeather(c, wx, dt, t, camDx) {
    for (const p of wx.parts) {
      if (wx.kind === 'snow') { p.y += dt * 12 * p.v; p.x += Math.sin(t + p.p) * dt * 6 - camDx * 0.8; }
      else if (wx.kind === 'ash' || wx.kind === 'petals') { p.y += dt * 9 * p.v; p.x += Math.sin(t * 0.8 + p.p) * dt * 10 - camDx * 0.8; }
      else if (wx.kind === 'embers') { p.y -= dt * 14 * p.v; p.x += Math.sin(t + p.p) * dt * 8 - camDx; }
      else if (wx.kind === 'fireflies') { p.x += Math.sin(t * 0.7 + p.p) * dt * 8 - camDx * 0.9; p.y += Math.cos(t * 0.9 + p.p) * dt * 5; }
      else { p.y -= dt * 3 * p.v; p.x += Math.sin(t * 0.5 + p.p) * dt * 4 - camDx * 0.6; } // motes
      if (p.y > WY + 4) { p.y = -4; p.x = Math.random() * LW; }
      if (p.y < -6) { p.y = WY; p.x = Math.random() * LW; }
      if (p.x < -6) p.x += LW + 12;
      if (p.x > LW + 6) p.x -= LW + 12;
      const tw = 0.5 + 0.5 * Math.sin(t * 3 + p.p * 5);
      if (wx.kind === 'snow') { c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillRect(p.x * SS, p.y * SS, SS, SS); }
      else if (wx.kind === 'ash') { c.fillStyle = 'rgba(180,160,150,0.7)'; c.fillRect(p.x * SS, p.y * SS, SS, SS); }
      else if (wx.kind === 'petals') { c.fillStyle = 'rgba(255,190,210,0.9)'; c.fillRect(p.x * SS, p.y * SS, SS * 2, SS); }
      else if (wx.kind === 'embers') { c.fillStyle = `rgba(255,${130 + tw * 80},60,${0.5 + tw * 0.5})`; c.fillRect(p.x * SS, p.y * SS, SS, SS); }
      else if (wx.kind === 'fireflies') { c.fillStyle = `rgba(220,255,140,${0.25 + tw * 0.75})`; c.fillRect(p.x * SS, p.y * SS, SS, SS); }
      else { c.fillStyle = `rgba(255,240,200,${0.2 + tw * 0.4})`; c.fillRect(p.x * SS, p.y * SS, SS, SS); }
    }
  }

  // ---------------------------------------------------------------- the walk itself
  /** Layers are scaled up once, so every frame is a plain copy (much cheaper than scaling). */
  function prescale(img) {
    if (!img) return img;
    const cv = document.createElement('canvas');
    cv.width = img.width * SS;
    cv.height = img.height * SS;
    const cx = cv.getContext('2d');
    cx.imageSmoothingEnabled = false;
    cx.drawImage(img, 0, 0, cv.width, cv.height);
    return cv;
  }

  class Walk {
    constructor(ctx, def, scenery) {
      Object.assign(this, ctx);
      this.def = def;
      this.scenery = scenery;
      this.W = scenery.w;
      this.x = def.start == null ? 40 : def.start;
      this.facing = 1;
      this.vx = 0;
      this.camX = 0;
      this.keys = { left: false, right: false, run: false };
      this.pointer = 0;
      this.target = null;
      this.t = 0;
      this.done = false;
      this.talking = null;
      this.picked = [];
      this.stepAcc = 0;
      this.reduce = !!this.settings.reduceMotion;
      this.hero = LOOKS[def.hero] || LOOKS.traveller;
      this.things = (def.things || []).map((th, i) => ({ ...th, id: i, used: false, bob: Math.random() * 6 }))
        .filter((th) => !(th.kind === 'item' && th.item && this.engine.hasItem(th.item)));
      this.weather = def.weather ? makeWeather(def.weather, def.weatherCount || 60) : null;
    }

    async start() {
      this.layers = [];
      for (const l of this.scenery.layers) this.layers.push({ ...l, img: prescale(await image(l.src)) });
      // the band above the waterline, flipped, for the reflection
      this.mirror = document.createElement('canvas');
      this.mirror.width = LW * SS;
      this.mirror.height = (LH - WY) * SS;
      this.mc = this.mirror.getContext('2d');
      this.buf = document.createElement('canvas');
      this.buf.width = LW * SS;
      this.buf.height = LH * SS;
      this.bc = this.buf.getContext('2d');
      this.bc.imageSmoothingEnabled = false;
      this.canvas = h('canvas.wk-canvas');
      this.prompt = h('div.wk-prompt');
      this.say = h('div.wk-say', h('div.wk-say-name'), h('div.wk-say-text'), h('div.wk-say-next', '▼'));
      this.hint = h('div.wk-hint', this.def.hint || '');
      this.purse = h('div.wk-purse', h('span.wk-coin'), h('b', String(this.engine.francs())));
      const skip = h('button.wk-skip', { type: 'button' }, 'Skip ▸▸');
      skip.addEventListener('click', (e) => { e.stopPropagation(); this.finish('skipped'); });
      const help = h('div.wk-help', h('span', h('kbd', '←'), h('kbd', '→'), ' walk'), h('span', h('kbd', 'Shift'), ' run'), h('span', h('kbd', 'E'), ' look · take · talk'));
      const title = h('div.wk-title', h('b', this.def.title || ''), h('span', this.def.region || ''));
      this.el = h('div.overlay.walk', this.canvas, h('div.wk-vignette'), this.prompt, title, this.hint, this.purse, help, this.say, skip, h('div.wk-fade'));
      this.el.style.setProperty('--wk-accent', this.def.accent || '255,214,140');
      this.say.addEventListener('click', (e) => { e.stopPropagation(); this.use(); });
      return new Promise((resolve) => {
        this.resolve = resolve;
        VN.currentWalk = this;
        this.entry = this.ui.open(this.el, {
          onKey: (e) => this.key(e, true),
          onBack: () => this.ui.openMenu('save'),
          focus: false,
        });
        this.entry.removeAfter = 900;
        this.entry.cleanup = () => this.stop();
        this.ui.cardEntry = this.entry;
        this.onUp = (e) => this.key(e, false);
        document.addEventListener('keyup', this.onUp);
        this.canvas.addEventListener('pointerdown', (e) => this.press(e));
        this.onRelease = () => { this.pointer = 0; };
        window.addEventListener('pointerup', this.onRelease);
        this.resize();
        this.onResize = () => this.resize();
        window.addEventListener('resize', this.onResize);
        this.last = performance.now();
        this.raf = requestAnimationFrame((t) => this.frame(t));
        this.audio.fx('whoosh', { volume: 0.5 });
      });
    }

    resize() {
      const r = this.canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      this.canvas.width = Math.max(1, Math.round(r.width * dpr));
      this.canvas.height = Math.max(1, Math.round(r.height * dpr));
      this.cssW = this.el.offsetWidth || 1280;
      this.cssH = this.el.offsetHeight || 720;
      // cover: the painted view fills the screen, cropping a little where the shapes differ
      const k = Math.max(this.cssW / LW, this.cssH / LH);
      this.view = { k, ox: (this.cssW - LW * k) / 2, oy: (this.cssH - LH * k) / 2 };
      const cx = this.canvas.getContext('2d');
      cx.imageSmoothingEnabled = false;
    }

    /** From painted pixels to the overlay's coordinates. */
    toCss(lx, ly) { return [this.view.ox + lx * this.view.k, this.view.oy + ly * this.view.k]; }

    key(e, down) {
      const k = e.key;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') { this.keys.left = down; this.target = null; return true; }
      if (k === 'ArrowRight' || k === 'd' || k === 'D') { this.keys.right = down; this.target = null; return true; }
      if (k === 'Shift') { this.keys.run = down; return true; }
      if (!down) return false;
      if (k === 'e' || k === 'E' || k === ' ' || k === 'Enter' || k === 'ArrowUp' || k === 'w' || k === 'W') { if (!e.repeat) this.use(); return true; }
      if (k === 'Escape') { this.ui.openMenu('save'); return true; }
      if (k === 'Tab') return true;
      return false;
    }

    press(e) {
      if (this.talking) { this.use(); return; }
      const r = this.canvas.getBoundingClientRect();
      const fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
      const lx = (fx * this.cssW - this.view.ox) / this.view.k + this.camX;
      const ly = (fy * this.cssH - this.view.oy) / this.view.k;
      // clicked on something: walk to it and use it
      const hit = this.things.find((th) => !th.used && Math.abs(th.x - lx) < 14 && ly > GY - 40 && ly < GY + 8);
      if (hit) { this.target = hit; return; }
      this.pointer = fx < 0.4 ? -1 : fx > 0.6 ? 1 : 0;
      if (!this.pointer) this.use();
    }

    near() {
      let best = null, bd = REACH;
      for (const th of this.things) {
        if (th.used) continue;
        const d = Math.abs(th.x - this.x);
        if (d < bd) { bd = d; best = th; }
      }
      return best;
    }

    use(th = this.near()) {
      if (this.talking) { this.advance(); return; }
      if (!th) return;
      this.target = null;
      this.facing = th.x >= this.x ? 1 : -1;
      const lines = (th.lines || []).slice();
      if (th.kind === 'coin') {
        th.used = true;
        this.engine.changeFrancs(th.amount || 5, { quiet: true });
        this.purse.querySelector('b').textContent = String(this.engine.francs());
        this.purse.classList.remove('pop'); void this.purse.offsetWidth; this.purse.classList.add('pop');
        this.fly = { x: th.x, y: GY - 10, t: 0, label: `+${th.amount || 5} francs` };
        this.audio.fx('sparkle', { volume: 0.6 });
        this.picked.push(`francs:${th.amount || 5}`);
      } else if (th.kind === 'item') {
        th.used = true;
        this.engine.gainItem(th.item);
        this.fly = { x: th.x, y: GY - 10, t: 0, label: th.label || '' };
        this.picked.push(th.item);
      } else if (th.kind === 'look' || th.kind === 'talk') {
        if (th.once) th.used = true;
      }
      if (th.set) for (const [name, value] of Object.entries(th.set)) this.engine.setVar(name, value);
      if (th.sound) this.audio.fx(th.sound, { volume: 0.6 });
      if (th.kind === 'goal') {
        if (lines.length) this.talk(th, lines, () => this.finish('arrived'));
        else this.finish('arrived');
        return;
      }
      if (lines.length) this.talk(th, lines);
    }

    /** Words in the little box at the bottom: a character's, or Hervé's own thoughts. */
    talk(th, lines, then) {
      this.talking = { th, lines, i: -1, then };
      // (a key still held when the words end walks on; a held click or tap does not)
      this.pointer = 0;
      this.say.classList.add('on');
      this.advance();
    }

    advance() {
      const tk = this.talking;
      if (!tk) return;
      if (this.typer && !this.typer.finished) { this.typer.finish(); return; }
      tk.i++;
      if (tk.i >= tk.lines.length) {
        this.talking = null;
        this.say.classList.remove('on');
        if (tk.then) tk.then();
        return;
      }
      const line = tk.lines[tk.i];
      const [who, text] = Array.isArray(line) ? line : [null, line];
      const ch = who ? this.story.characters[who] : null;
      const name = ch ? VN.plainName(this.engine.interp(ch.name)) : who || '';
      const nameEl = this.say.querySelector('.wk-say-name');
      nameEl.textContent = name;
      nameEl.style.color = (ch && ch.color) || '#f3d58e';
      nameEl.classList.toggle('on', !!name);
      const textEl = this.say.querySelector('.wk-say-text');
      textEl.classList.toggle('thought', !who);
      if (this.typer) this.typer.destroy();
      const voice = ch && ch.voice && this.audio.voiceLine(ch.voice);
      this.typer = new VN.Typer(textEl, this.engine.interp(text), {
        cps: this.settings.textSpeed,
        onChar: (c) => (voice ? this.audio.voiceChar(c) : this.audio.typeTick(c)),
      });
    }

    frame(now) {
      if (this.done) return;
      this.raf = requestAnimationFrame((t) => this.frame(t));
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      // hold still while a menu is open on top
      if (this.ui.overlays[this.ui.overlays.length - 1] !== this.entry) return;
      this.t += dt;
      this.update(dt);
      this.draw(dt);
    }

    update(dt) {
      const riding = !!this.def.ride;
      let dir = 0;
      if (!this.talking) {
        if (this.keys.left || this.pointer < 0) dir -= 1;
        if (this.keys.right || this.pointer > 0) dir += 1;
        if (!dir && this.target) {
          const d = this.target.x - this.x;
          if (Math.abs(d) < REACH * 0.6) { const th = this.target; this.target = null; this.use(th); }
          else dir = Math.sign(d);
        }
      }
      const run = this.keys.run || (this.target && Math.abs(this.target.x - this.x) > 120);
      const speed = (riding ? (run ? 190 : 120) : (run ? 105 : 58)) * dir;
      this.vx += (speed - this.vx) * Math.min(1, dt * 8);
      if (Math.abs(this.vx) < 1 && !dir) this.vx = 0;
      if (dir) this.facing = dir;
      this.x = VN.clamp(this.x + this.vx * dt, 14, this.W - 14);
      this.moving = Math.abs(this.vx) > 4;
      this.running = Math.abs(this.vx) > (riding ? 150 : 80);
      // footsteps (hooves on horseback)
      if (this.moving) {
        this.stepAcc += dt * (this.running ? 3.6 : 2.4);
        if (this.stepAcc > 1) { this.stepAcc = 0; this.audio.fx(riding ? 'hoof' : 'step', { volume: this.running ? 0.35 : 0.25 }); }
      }
      // the camera leads a little in the direction of travel
      const lead = this.facing * (this.moving ? 70 : 40);
      const want = VN.clamp(this.x - LW / 2 + lead, 0, this.W - LW);
      const before = this.camX;
      this.camX += (want - this.camX) * Math.min(1, dt * 2.2);
      this.camDx = this.camX - before;
      // an automatic goal ends the walk as soon as Hervé gets there
      for (const th of this.things) if (th.kind === 'goal' && th.auto && !th.used && Math.abs(th.x - this.x) < 10) { th.used = true; this.use(th); }
      const n = this.talking ? null : this.near();
      this.showPrompt(n);
    }

    showPrompt(th) {
      if (!th) { this.prompt.classList.remove('on'); this.promptFor = null; return; }
      if (this.promptFor !== th) {
        this.promptFor = th;
        const verb = { coin: 'Take', item: 'Take', look: 'Look', talk: 'Talk', goal: th.verb || 'Go' }[th.kind] || 'Look';
        this.prompt.replaceChildren(h('kbd', 'E'), h('span', `${verb}${th.label ? ` · ${th.label}` : ''}`));
      }
      const [cx, cy] = this.toCss(th.x - this.camX, GY - (th.kind === 'talk' || th.look ? 34 : 22));
      this.prompt.style.transform = `translate(${cx.toFixed(0)}px, ${cy.toFixed(0)}px) translate(-50%, -100%)`;
      this.prompt.classList.add('on');
    }

    draw(dt) {
      const c = this.bc;
      const cam = this.camX;
      c.clearRect(0, 0, LW * SS, LH * SS);
      const behind = this.layers.filter((l) => l.depth <= 1);
      const front = this.layers.filter((l) => l.depth > 1);
      for (const l of behind) this.layer(c, l, cam);
      // the things along the way, and the people
      for (const th of this.things) this.thing(c, th, cam);
      c.save();
      c.translate(Math.round((this.x - cam) * SS), GY * SS);
      c.scale(SS * this.facing, SS);
      if (this.def.ride) drawHorse(c, this.t, this.moving, this.running, this.hero);
      else drawPerson(c, this.hero, this.t, this.moving, this.running);
      c.restore();
      if (this.fly) {
        this.fly.t += dt;
        const a = Math.max(0, 1 - this.fly.t / 1.2);
        c.globalAlpha = a;
        c.fillStyle = '#ffe9a0';
        c.font = `bold ${7 * SS}px Georgia, serif`;
        c.textAlign = 'center';
        c.fillText(this.fly.label, (this.fly.x - cam) * SS, (this.fly.y - this.fly.t * 22) * SS);
        c.globalAlpha = 1;
        if (a <= 0) this.fly = null;
      }
      // the water: everything above it, upside down, trembling
      this.water(c);
      for (const l of front) this.layer(c, l, cam);
      if (this.weather && !this.reduce) stepWeather(c, this.weather, dt, this.t, this.camDx || 0);
      // onto the screen
      const out = this.canvas.getContext('2d');
      out.imageSmoothingEnabled = false;
      const sx = this.canvas.width / this.cssW;
      out.clearRect(0, 0, this.canvas.width, this.canvas.height);
      out.drawImage(this.buf, this.view.ox * sx, this.view.oy * sx, LW * this.view.k * sx, LH * this.view.k * sx);
    }

    layer(c, l, cam) {
      if (!l.img) return;
      let x = l.x - l.depth * cam;
      if (l.anim && l.anim.type === 'drift') {
        const span = Math.max(l.w, LW);
        x = ((l.x - l.depth * cam - (this.t * span) / (l.anim.t || 200)) % span + span) % span - span;
        c.drawImage(l.img, Math.round(x * SS), l.y * SS, l.w * SS, l.h * SS);
        c.drawImage(l.img, Math.round((x + span) * SS), l.y * SS, l.w * SS, l.h * SS);
        return;
      }
      if (l.anim && l.anim.type === 'sway' && !this.reduce) x += Math.sin(this.t * (6.28 / (l.anim.t || 4))) * 0.8;
      if (x > LW || x + l.w < 0) return;
      // only the part on screen
      const dx = Math.round(x * SS);
      const sx = Math.max(0, -dx);
      const sw = Math.min(l.img.width - sx, LW * SS - Math.max(0, dx));
      if (sw > 0) c.drawImage(l.img, sx, 0, sw, l.img.height, Math.max(0, dx), l.y * SS, sw, l.img.height);
    }

    thing(c, th, cam) {
      const x = th.x - cam;
      if (x < -30 || x > LW + 30) return;
      const t = this.t + th.bob;
      if (th.look && LOOKS[th.look] && !(th.kind === 'item' && th.used)) {
        c.save();
        c.translate(Math.round(x * SS), GY * SS);
        const face = th.facing || (this.x > th.x ? 1 : -1);
        c.scale(SS * face, SS);
        if (th.ride) drawHorse(c, t, false, false, LOOKS[th.look]);
        else drawPerson(c, LOOKS[th.look], t, !!th.pace, false);
        c.restore();
      }
      if (th.used && th.kind !== 'talk' && th.kind !== 'look') return;
      const glint = 0.5 + 0.5 * Math.sin(t * 4);
      if (th.kind === 'coin') {
        const y = GY - 4 - Math.round(Math.abs(Math.sin(t * 2)) * 2);
        c.fillStyle = '#8a5a1a'; c.fillRect((x - 2) * SS, y * SS, 5 * SS, 3 * SS);
        c.fillStyle = '#f3c542'; c.fillRect((x - 2) * SS, (y - 1) * SS, 5 * SS, 2 * SS);
        c.fillStyle = `rgba(255,255,220,${glint})`; c.fillRect((x + 1) * SS, (y - 2) * SS, SS, SS);
      } else if (th.kind === 'item' || th.kind === 'goal' || (th.kind === 'look' && !th.used)) {
        // a soft shimmer marks something worth a look
        const y = GY - (th.kind === 'goal' ? 30 : 12) - Math.sin(t * 2) * 2;
        const g = c.createRadialGradient(x * SS, y * SS, 0, x * SS, y * SS, (th.kind === 'goal' ? 18 : 7) * SS);
        const col = th.kind === 'goal' ? (this.def.accent || '255,214,140') : th.kind === 'item' ? '255,236,190' : '220,230,255';
        g.addColorStop(0, `rgba(${col},${0.55 + glint * 0.35})`);
        g.addColorStop(1, `rgba(${col},0)`);
        c.fillStyle = g;
        c.fillRect((x - 20) * SS, (y - 20) * SS, 40 * SS, 40 * SS);
        if (th.kind === 'goal') { c.fillStyle = `rgba(${col},0.18)`; c.fillRect((x - 1) * SS, (GY - 90) * SS, 3 * SS, 90 * SS); }
        c.fillStyle = `rgba(255,255,255,${0.6 + glint * 0.4})`;
        c.fillRect(x * SS, y * SS, SS, SS);
      }
    }

    water(c) {
      const top = WY * SS, rows = (LH - WY) * SS;
      const [c0, c1] = this.def.water || ['rgba(40,60,90,0.55)', 'rgba(10,16,30,0.85)'];
      // mirror the band just above the waterline, row by row, with a travelling ripple
      const m = this.mc;
      m.save();
      m.clearRect(0, 0, LW * SS, rows);
      m.translate(0, rows);
      m.scale(1, -1);
      m.drawImage(this.buf, 0, top - rows, LW * SS, rows, 0, 0, LW * SS, rows);
      m.restore();
      if (this.reduce) c.drawImage(this.mirror, 0, top);
      else {
        for (let r = 0; r < rows; r += SS * 2) {
          const depth = r / rows;
          const dx = Math.round(Math.sin(r * 0.21 + this.t * 2.4) * (1 + depth * 3) * SS * 0.6);
          c.drawImage(this.mirror, 0, r, LW * SS, SS * 2, dx, top + r, LW * SS, SS * 2);
        }
      }
      const g = c.createLinearGradient(0, top, 0, LH * SS);
      g.addColorStop(0, c0);
      g.addColorStop(1, c1);
      c.fillStyle = g;
      c.fillRect(0, top, LW * SS, rows);
      // glints on the surface
      if (!this.reduce) {
        c.fillStyle = 'rgba(255,255,255,0.25)';
        for (let i = 0; i < 26; i++) {
          const gx = ((i * 97 + this.t * (8 + (i % 5) * 3) - this.camX * 0.9) % LW + LW) % LW;
          const gy = WY + 3 + ((i * 37) % (LH - WY - 6));
          c.fillRect(gx * SS, gy * SS, (3 + (i % 4) * 2) * SS, SS / 2);
        }
      }
    }

    finish(how) {
      if (this.done) return;
      this.done = true;
      this.stop();
      this.el.classList.add('leaving');
      setTimeout(() => {
        if (this.ui.cardEntry === this.entry) this.ui.cardEntry = null;
        this.ui.close(this.entry);
        this.resolve({ how, picked: this.picked });
      }, 700);
    }

    stop() {
      this.done = true;
      if (VN.currentWalk === this) VN.currentWalk = null;
      cancelAnimationFrame(this.raf);
      if (this.typer) this.typer.destroy();
      document.removeEventListener('keyup', this.onUp);
      window.removeEventListener('pointerup', this.onRelease);
      window.removeEventListener('resize', this.onResize);
    }
  }

  /** Play a walking area; resolves with { how: 'arrived' | 'skipped', picked: [...] }. */
  VN.playWalk = function (ctx, name) {
    const def = (globalThis.VN_WALKS || {})[name];
    const scenery = (globalThis.VN_WALKSCENERY || {})[def ? def.scene || name : name];
    if (!def || !scenery) return Promise.resolve({ how: 'missing', picked: [] });
    return new Walk(ctx, def, scenery).start();
  };
  VN.WALK_LOOKS = LOOKS;
})();
