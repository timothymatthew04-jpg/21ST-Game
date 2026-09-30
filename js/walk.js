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
    bandit: { coat: '#3a3028', coatDark: '#2a221c', legs: '#2a221c', boots: '#141010', skin: '#c89878', hat: 'fur', hatCol: '#1a1410', beard: '#3a2a20' },
    // the French army of the 1860s: line infantry with rifles, officers, gunners and Zouaves
    rifleman: { coat: '#2e4a8a', coatDark: '#22386a', legs: '#b83a3a', boots: '#1a1412', skin: '#e8c0a0', hat: 'kepi', hatCol: '#b83a3a', belt: '#e8dcc0', rifle: 1 },
    officer: { coat: '#1e2e5a', coatDark: '#141f40', legs: '#b83a3a', boots: '#1a1412', skin: '#e8c0a0', hat: 'kepi', hatCol: '#1e2e5a', belt: '#e8c050', epaulette: '#f0c050', sword: 1, beard: '#5a3a2a' },
    gunner: { coat: '#1e2a4a', coatDark: '#141c34', legs: '#1e2a4a', stripe: '#c83a3a', boots: '#1a1412', skin: '#e0b898', hat: 'kepi', hatCol: '#1e2a4a', belt: '#e8dcc0' },
    zouave: { coat: '#2a3a7a', coatDark: '#1e2a5a', legs: '#c83a3a', wideLegs: 1, boots: '#e8dcc0', skin: '#d8a888', hat: 'fez', hatCol: '#c83a3a', sash: '#3a6ab0', beard: '#3a2a20' },
  };

  function rect(c, x, y, w, hh, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(hh)); }

  /** A person standing (or walking) with their feet at (x, y), facing right; flip the canvas to face left. */
  function drawPerson(c, L, t, moving, running, crouch = false, pose = null) {
    if (pose === 'sit') crouch = true;
    const k = L.small ? 0.8 : 1;
    const legH = Math.round((crouch ? 3 : 8) * k), bodyH = Math.round((crouch ? 8 : 10) * k), w = Math.round((L.wide ? 8 : 6) * k);
    const ph = t * (running ? 16 : 10);
    const swing = moving ? Math.sin(ph) : 0;
    const bob = moving ? Math.round(Math.abs(Math.sin(ph)) * 1) : 0;
    const y = -bob;
    // legs (a long robe hides them)
    if (L.robe) {
      rect(c, -w / 2 - 1, y - legH - 1, w + 2, legH + 1, L.coatDark);
      rect(c, -w / 2 + swing, y - 2, 3, 2, L.boots); rect(c, w / 2 - 3 - swing, y - 2, 3, 2, L.boots);
    } else if (L.wideLegs) {
      rect(c, -3 + Math.round(swing * 2), y - legH, 3, legH - 1, L.legs);
      rect(c, 1 - Math.round(swing * 2), y - legH, 3, legH - 1, L.legs);
      rect(c, -2 + Math.round(swing * 2), y - 2, 3, 2, L.boots);
      rect(c, 1 - Math.round(swing * 2), y - 2, 3, 2, L.boots);
    } else {
      rect(c, -2 + Math.round(swing * 2), y - legH, 2, legH, L.legs);
      rect(c, 1 - Math.round(swing * 2), y - legH, 2, legH, L.legs);
      if (L.stripe) { rect(c, -2 + Math.round(swing * 2), y - legH, 1, legH - 2, L.stripe); rect(c, 2 - Math.round(swing * 2), y - legH, 1, legH - 2, L.stripe); }
      rect(c, -2 + Math.round(swing * 2), y - 2, 3, 2, L.boots);
      rect(c, 1 - Math.round(swing * 2), y - 2, 3, 2, L.boots);
    }
    // the coat, darker at the back, with its tail swinging a little
    const top = y - legH - bodyH;
    rect(c, -w / 2, top, w, bodyH + 2, L.coat);
    rect(c, -w / 2, top, 2, bodyH + 2, L.coatDark);
    if (!L.robe) rect(c, -w / 2 - 1 + (moving ? Math.round(-swing) : 0), top + bodyH - 1, 2, 3, L.coatDark);
    if (L.belt) rect(c, -w / 2, top + bodyH - 4, w, 1, L.belt);
    if (L.sash) rect(c, -w / 2, top + bodyH - 4, w, 2, L.sash);
    if (L.scarf) rect(c, -w / 2 + 1, top, w - 1, 2, L.scarf);
    if (L.epaulette) { rect(c, -w / 2 - 1, top, 2, 1, L.epaulette); rect(c, w / 2 - 1, top, 2, 1, L.epaulette); }
    // an arm: swinging opposite to the legs, raised as they talk, or holding the rifle up in front
    if (pose === 'talk') {
      const up = Math.sin(t * 7) > 0 ? 1 : 0;
      rect(c, 1, top + 3 - up, 2, 4, L.coatDark);
      rect(c, 3, top + 1 - up, 2, 2, L.skin);
    } else if (pose === 'present' && L.rifle) {
      rect(c, 2, top + 3, 2, 5, L.coatDark);
      rect(c, 3, top - 9, 1, 19, '#4a3424');
      rect(c, 3, top - 13, 1, 4, '#d0d0d8');
      rect(c, 2, top + 5, 2, 2, L.skin);
    } else {
      rect(c, 0 - Math.round(swing * 2), top + 2, 2, 7, L.coatDark);
      rect(c, 0 - Math.round(swing * 2), top + 8, 2, 2, L.skin);
    }
    // a rifle on the shoulder, bayonet fixed
    if (L.rifle && pose !== 'present') {
      for (let k = 0; k < 16; k++) rect(c, -3 + Math.round(k * 0.18), top + 9 - k, 1, 1, '#4a3424');
      rect(c, 0, top - 10, 1, 4, '#d0d0d8');
    }
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
    else if (L.hat === 'fez') { rect(c, -1, hy - 3, 4, 3, hc); rect(c, -2, hy - 1, 1, 2, '#1a2a5a'); }
    else rect(c, -2, hy - 1, 5, 2, hc);
    if (L.sword) rect(c, -w / 2 - 1, top + bodyH - 3, 8, 1, '#8a8a90');
    if (L.drum) { rect(c, 2, top + 5, 5, 5, '#b83a3a'); rect(c, 2, top + 5, 5, 1, '#e8dcc8'); }
    if (L.lantern) { rect(c, 4, top + 4, 1, 4, '#3a2a22'); rect(c, 3, top + 8, 3, 4, '#ffcf72'); }
  }

  /** A horse at a walk or a gallop, facing right, with its rider. */
  function drawHorse(c, t, moving, running, rider, duck = false) {
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
      c.translate(0, y - 13 + (duck ? 3 : 0));
      drawPerson(c, { ...rider, legs: rider.coatDark }, 0, false, false, duck);
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

  // ---------------------------------------------------------------- fire and smoke, for the shelling
  const FIRE = ['#fff6d0', '#ffd070', '#ff9a3a', '#e0502a'];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const rnd = (a, b) => a + Math.random() * (b - a);
  function burst(parts, x, y, size = 1) {
    parts.push({ x, y: y - 4, r: 10 * size, grow: 30, col: '#fff4d8', a: 0.9, life: 0.12, age: 0, z: 2 });
    parts.push({ x, y: y - 3, r: 3 * size, grow: 18 * size, col: pick(FIRE.slice(1)), a: 0.95, life: 0.35, age: 0, z: 2 });
    for (let i = 0; i < 14 * size; i++) parts.push({ x, y, vx: rnd(-40, 40) * size, vy: rnd(-90, -30) * size, g: 140, col: pick(['#2e2018', '#4a3426', '#6a4a30']), s: Math.random() < 0.3 ? 2 : 1, life: rnd(0.6, 1.2), age: 0, z: 1 });
    for (let i = 0; i < 8; i++) parts.push({ x, y, vx: rnd(-50, 50), vy: rnd(-70, -10), g: 80, col: pick(FIRE), s: 1, life: rnd(0.25, 0.6), age: 0, z: 2 });
    for (let i = 0; i < 6; i++) parts.push({ x: x + rnd(-4, 4), y: y - rnd(0, 6), r: 3 * size, grow: rnd(6, 10), vx: rnd(-4, 6), vy: -rnd(6, 14), col: '#3a3030', hi: '#6a5a56', a: 0.7, life: rnd(2, 3.5), age: 0, z: 0 });
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
      // the action some walks have: cover to crouch behind, lanterns on patrol, a chase, falling shells
      this.cover = def.cover || [];
      this.crouch = false;
      this.stun = 0;
      this.shake = 0;
      this.parts = [];
      this.patrols = (def.patrols || []).map((p) => ({ ...p, x: p.start != null ? p.start : p.x0, dir: p.dir || 1, wait: 0, look: LOOKS[p.look || 'patrol'] }));
      this.alert = 0;
      if (def.chase) {
        const ch = def.chase;
        const obstacles = [];
        for (let x = ch.from || 260; x < (ch.to || this.W - 200); x += rnd(ch.spacing ? ch.spacing[0] : 150, ch.spacing ? ch.spacing[1] : 230)) obstacles.push({ x, kind: pick(ch.kinds || ['log', 'rock', 'branch']), done: false });
        this.chase = { ...ch, gap: ch.gap || 110, obstacles, jumpY: 0, vy: 0 };
      }
      if (def.shelling) this.shelling = { ...def.shelling, list: [], wait: def.shelling.first || 2.2, hits: 0 };
      // life that is only there to be seen: groups talking, men marching, a drill, sentries on
      // their towers, flags, smoke, fires, and airships and balloons in the sky
      this.crowd = (def.crowd || []).map((g) => ({ ...g, k: 0, timer: 0.4 + Math.random(), showing: -1, bubble: null }));
      this.marchers = (def.marchers || []).map((m) => ({ ...m, x: m.start != null ? m.start : m.x0, dir: m.dir || 1, wait: 0, look: LOOKS[m.look || 'rifleman'] }));
      if (def.drill) this.drill = { ...def.drill, k: -1, timer: 1.5, pose: null, bubble: null };
      this.flags = def.flags || [];
      this.fires = def.fires || [];
      this.smokes = (def.smoke || []).map((sm) => ({ ...sm, acc: Math.random() }));
      this.puffs = [];
      this.sky = def.airships || [];
    }

    inCover(x = this.x) { return this.cover.some((cv) => x >= cv.x0 && x <= cv.x1); }

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
      this.notices = h('div.item-notices.wk-notices', { 'aria-live': 'polite' });
      this.purse = h('div.wk-purse', h('span.wk-coin'), h('b', String(this.engine.francs())));
      const skip = h('button.wk-skip', { type: 'button' }, 'Skip ▸▸');
      skip.addEventListener('click', (e) => { e.stopPropagation(); this.finish('skipped'); });
      const help = this.def.chase
        ? h('div.wk-help', h('span', h('kbd', '↑'), ' jump'), h('span', h('kbd', '↓'), ' duck'), h('span', h('kbd', '←'), h('kbd', '→'), ' rein in · spur on'))
        : h('div.wk-help', h('span', h('kbd', '←'), h('kbd', '→'), ' walk'), h('span', h('kbd', 'Shift'), ' run'), this.cover.length ? h('span', h('kbd', '↓'), ' crouch') : null, h('span', h('kbd', 'E'), ' look · take · talk'));
      this.alertEl = this.patrols.length ? h('div.wk-alert', h('span.wk-alert-eye', '目'), h('span.wk-alert-text', 'Unseen')) : null;
      this.chaseEl = this.chase ? h('div.wk-chase', h('span.wk-chase-label', 'The riders'), h('div.wk-chase-track', h('i.wk-chase-them'), h('i.wk-chase-you'))) : null;
      this.hurtEl = h('div.wk-hurt');
      this.bubbles = h('div.wk-bubbles');
      const title = h('div.wk-title', h('b', this.def.title || ''), h('span', this.def.region || ''));
      this.el = h('div.overlay.walk', this.canvas, h('div.wk-vignette'), this.bubbles, this.prompt, title, this.hint, this.purse, this.notices, help, this.alertEl, this.chaseEl, this.hurtEl, this.say, skip, h('div.wk-fade'));
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
      if (k === 'ArrowDown' || k === 's' || k === 'S') { this.keys.down = down; return true; }
      if (this.chase && (k === 'ArrowUp' || k === 'w' || k === 'W' || k === ' ')) { if (down && !e.repeat) this.jump(); return true; }
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
        // the keepsake's card slides in here, over the walk (the usual place is underneath it)
        if (!this.engine.hasItem(th.item)) {
          this.engine.gainItem(th.item, { quiet: true });
          this.ui.itemNotice(this.engine.itemInfo(th.item), 'gain', this.notices);
        }
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

    jump() {
      const ch = this.chase;
      if (!ch || this.talking || this.stun > 0 || ch.jumpY < 0) return;
      ch.vy = -150;
      this.audio.fx('whoosh', { volume: 0.25 });
    }

    /** Someone caught Hervé: they say so, and the walk ends that way. */
    caught(lines) {
      if (this.isCaught) return;
      this.isCaught = true;
      this.keys.left = this.keys.right = this.keys.down = false;
      this.audio.fx('shouts', { volume: 0.6 });
      this.hurtEl.classList.remove('on'); void this.hurtEl.offsetWidth; this.hurtEl.classList.add('on');
      this.talk(null, lines && lines.length ? lines : ['They had me.'], () => this.finish('caught'));
    }

    action(dt) {
      if (this.stun > 0) this.stun -= dt;
      if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 2.5);
      this.crouch = !!this.keys.down && !this.def.ride && !this.talking;
      // lanterns on patrol: they walk their stretch of road, stop, look back, and walk on
      for (const p of this.patrols) {
        if (p.wait > 0) { p.wait -= dt; if (p.wait <= 0) p.dir *= -1; continue; }
        p.x += p.dir * (p.speed || 16) * dt;
        if ((p.dir > 0 && p.x >= p.x1) || (p.dir < 0 && p.x <= p.x0)) { p.x = VN.clamp(p.x, p.x0, p.x1); p.wait = p.pause || 1.8; }
      }
      if (this.patrols.length && !this.talking && !this.isCaught) {
        let seen = 0, heard = 0;
        const hidden = this.crouch && this.inCover();
        for (const p of this.patrols) {
          const dx = this.x - p.x, len = p.reach || 92;
          if (Math.sign(dx) === p.dir && Math.abs(dx) < len && !hidden) seen = Math.max(seen, 1.3 - (Math.abs(dx) / len) * 0.8);
          if (this.running && Math.abs(dx) < 120) heard = 0.45;
        }
        const was = this.alert;
        this.alert = VN.clamp(this.alert + dt * (seen || heard || -0.28), 0, 1);
        if (was < 0.5 && this.alert >= 0.5) this.audio.fx('heartbeat_fast', { volume: 0.4 });
        this.alertEl.style.setProperty('--a', this.alert.toFixed(3));
        this.alertEl.classList.toggle('on', this.alert > 0.02);
        this.alertEl.classList.toggle('high', this.alert > 0.6);
        this.alertEl.querySelector('.wk-alert-text').textContent = this.alert > 0.6 ? 'Seen!' : this.alert > 0.02 ? 'Careful' : 'Unseen';
        if (this.alert >= 1) this.caught(this.def.caughtLines);
      }
      // the chase: the horse gallops on by itself; jump, duck, and keep ahead of the riders
      const ch = this.chase;
      if (ch && !this.talking && !this.isCaught) {
        ch.vy += 460 * dt;
        ch.jumpY = Math.min(0, ch.jumpY + ch.vy * dt);
        if (ch.jumpY === 0) ch.vy = 0;
        const base = ch.speed || 110;
        const mine = this.stun > 0 ? base * 0.35 : base * (this.keys.right ? 1.12 : this.keys.left ? 0.85 : 1);
        ch.gap = Math.min(170, ch.gap + (mine - base * 0.98) * dt);
        for (const o of ch.obstacles) {
          if (o.done || Math.abs(o.x - this.x) > 6) continue;
          o.done = true;
          const clear = o.kind === 'branch' ? this.keys.down : ch.jumpY < -9;
          if (clear) continue;
          o.hit = true;
          this.stun = 0.8;
          this.shake = 1;
          ch.gap -= 26;
          this.audio.fx('thud', { volume: 0.7 });
          this.hurtEl.classList.remove('on'); void this.hurtEl.offsetWidth; this.hurtEl.classList.add('on');
        }
        this.chaseEl.style.setProperty('--gap', String(VN.clamp(ch.gap / 170, 0, 1).toFixed(3)));
        this.chaseEl.classList.toggle('close', ch.gap < 50);
        if (ch.gap < 14) this.caught(this.def.caughtLines);
        else if (this.x >= (ch.to || this.W - 200) + 40) { this.isCaught = true; this.talk(null, this.def.escapedLines || ['I left them behind in the dust.'], () => this.finish('escaped')); }
      }
      // shells: a shadow grows where one will land, and then it does
      const sh = this.shelling;
      if (sh && !this.talking) {
        sh.wait -= dt;
        if (sh.wait <= 0 && this.x < (sh.until || this.W - 120)) {
          sh.wait = rnd(1.6, 2.8) / (sh.rate || 1);
          sh.list.push({ x: VN.clamp(this.x + rnd(-30, 110), 20, this.W - 20), t: 0 });
          this.audio.fx('shell', { volume: 0.55 });
        }
        for (let i = sh.list.length - 1; i >= 0; i--) {
          const s = sh.list[i];
          s.t += dt;
          if (s.t < 1.3) continue;
          sh.list.splice(i, 1);
          burst(this.parts, s.x, GY, 1.2);
          this.shake = Math.max(this.shake, Math.abs(s.x - this.x) < 80 ? 1 : 0.4);
          if (Math.abs(s.x - this.x) < 26 && !(this.crouch && this.inCover())) {
            this.stun = 1.3;
            this.vx = Math.sign(this.x - s.x || 1) * 60;
            sh.hits++;
            if (sh.set) this.engine.setVar(sh.set, sh.hits);
            this.hurtEl.classList.remove('on'); void this.hurtEl.offsetWidth; this.hurtEl.classList.add('on');
          }
        }
      }
      // the bits of the explosions
      for (let i = this.parts.length - 1; i >= 0; i--) {
        const b = this.parts[i];
        b.age += dt;
        if (b.age > b.life) { this.parts.splice(i, 1); continue; }
        if (b.g) b.vy += b.g * dt;
        b.x += (b.vx || 0) * dt;
        b.y += (b.vy || 0) * dt;
        if (b.grow) b.r += b.grow * dt;
        if (b.g && b.y > GY) { b.y = GY; b.vx *= 0.5; b.vy = 0; }
      }
    }

    update(dt) {
      this.action(dt);
      const riding = !!this.def.ride;
      let dir = 0;
      if (!this.talking && this.stun <= 0 && !this.isCaught) {
        if (this.keys.left || this.pointer < 0) dir -= 1;
        if (this.keys.right || this.pointer > 0) dir += 1;
        if (!dir && this.target) {
          const d = this.target.x - this.x;
          if (Math.abs(d) < REACH * 0.6) { const th = this.target; this.target = null; this.use(th); }
          else dir = Math.sign(d);
        }
      }
      const run = (this.keys.run || (this.target && Math.abs(this.target.x - this.x) > 120)) && !this.crouch;
      let speed = (riding ? (run ? 190 : 120) : (run ? 105 : this.crouch ? 26 : 58)) * dir;
      // in a chase the horse runs on its own (slower for a moment after a stumble)
      if (this.chase && !this.talking && !this.isCaught) { dir = 1; speed = (this.stun > 0 ? 0.35 : this.keys.right ? 1.12 : this.keys.left ? 0.85 : 1) * (this.chase.speed || 110); }
      if (this.stun > 0 && !this.chase) speed = 0;
      this.vx += (speed - this.vx) * Math.min(1, dt * (this.stun > 0 && !this.chase ? 3 : 8));
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
      const lead = this.facing * (this.chase ? 120 : this.moving ? 70 : 40);
      const want = VN.clamp(this.x - LW / 2 + lead, 0, this.W - LW);
      const before = this.camX;
      this.camX += (want - this.camX) * Math.min(1, dt * 2.2);
      this.camDx = this.camX - before;
      // an automatic goal ends the walk as soon as Hervé gets there
      for (const th of this.things) if (th.kind === 'goal' && th.auto && !th.used && Math.abs(th.x - this.x) < 10) { th.used = true; this.use(th); }
      const n = this.talking || this.chase ? null : this.near();
      this.showPrompt(n);
      this.life(dt);
    }

    /** The camp going about its morning: talk, marching, drill, smoke. */
    life(dt) {
      const quiet = !!this.talking || this.done;
      // one conversation on the ground at a time (the nearest one), and none where a prompt is
      // showing; the sentries up on their towers talk over everyone's heads
      const low = (g) => !g.people || !g.people.some((p) => p.y && p.y < GY - 20);
      let nearest = null, best = Infinity;
      const cands = [...this.crowd.filter(low), ...(this.drill ? [this.drill] : [])];
      for (const g of cands) {
        const gx = g === this.drill ? g.x + (g.officer || 0) : g.x;
        const d = Math.abs(this.x - gx);
        if (d < (g.near || 150) && d < best) { best = d; nearest = g; }
      }
      const blocked = (gx) => this.promptFor && Math.abs(this.promptFor.x - gx) < 70;
      this.talkingGroup = nearest;
      for (const g of this.crowd) {
        const near = !quiet && Math.abs(this.x - g.x) < (g.near || 150) && (!low(g) || g === nearest) && !blocked(g.x);
        g.timer -= dt;
        if (!near) { if (g.showing >= 0) this.hideBubble(g); g.timer = Math.max(g.timer, 0.3); continue; }
        if (g.timer > 0) continue;
        if (g.showing >= 0) { this.hideBubble(g); g.timer = 0.9; continue; }
        const [who, text] = g.lines[g.k % g.lines.length];
        g.k++;
        g.showing = who;
        g.timer = 1.8 + text.length * 0.05;
        this.showBubble(g, text);
      }
      for (const m of this.marchers) {
        if (m.wait > 0) { m.wait -= dt; continue; }
        m.x += m.dir * (m.speed || 20) * dt;
        if ((m.dir > 0 && m.x > m.x1) || (m.dir < 0 && m.x < m.x0)) { m.x = VN.clamp(m.x, m.x0, m.x1); m.dir *= -1; m.wait = m.pause || 1.6; }
      }
      const d = this.drill;
      if (d) {
        d.timer -= dt;
        if (d.timer <= 0) {
          d.k++;
          const call = d.calls[d.k % d.calls.length];
          d.pose = call.pose || null;
          d.timer = d.period || 4.5;
          if (!quiet && d === this.talkingGroup && !blocked(d.x + (d.officer || 0))) this.showBubble(d, call.text, d.x + (d.officer || 0), GY);
          else if (d.bubble) this.hideBubble(d);
        } else if (d.bubble && (d.timer < (d.period || 4.5) - 2.6 || d !== this.talkingGroup)) this.hideBubble(d);
      }
      for (const sm of this.smokes) {
        sm.acc += dt * (sm.rate || 1.4);
        while (sm.acc > 1) {
          sm.acc -= 1;
          this.puffs.push({ x: sm.x + rnd(-1, 1), y: sm.y, vx: rnd(2, 6) * (sm.lean || 1), vy: -rnd(6, 10), r: rnd(1.2, 2), grow: rnd(1.2, 2), age: 0, life: rnd(4, 6), col: sm.col || '236,222,230', a: sm.a || 0.55 });
        }
      }
      for (const p of this.puffs) { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy *= 0.995; p.r += p.grow * dt; }
      this.puffs = this.puffs.filter((p) => p.age < p.life);
    }

    /** A few words over someone's head, as the camp talks among itself. */
    showBubble(g, text, x, y) {
      if (!g.bubble) {
        g.bubble = h('div.wk-bubble', h('span'));
        this.bubbles.append(g.bubble);
      }
      g.bubble.firstChild.textContent = text;
      g.bubbleAt = x != null ? [x, y] : null;
      g.bubble.classList.remove('on');
      void g.bubble.offsetWidth;
      g.bubble.classList.add('on');
    }

    hideBubble(g) {
      g.showing = -1;
      if (g.bubble) g.bubble.classList.remove('on');
    }

    /** Where each bubble sits: over the speaker's head, following the camera. */
    placeBubbles() {
      const put = (g, lx, ly) => {
        const [cx, cy] = this.toCss(lx - this.camX, ly);
        g.bubble.style.transform = `translate(${cx.toFixed(0)}px, ${cy.toFixed(0)}px) translate(-50%, -100%)`;
      };
      for (const g of this.crowd) {
        if (!g.bubble || g.showing < 0) continue;
        const p = g.people[g.showing] || g.people[0];
        put(g, g.x + (p.dx || 0), (p.y || GY) - 30);
      }
      if (this.drill && this.drill.bubble && this.drill.bubbleAt) put(this.drill, this.drill.bubbleAt[0], this.drill.bubbleAt[1] - 30);
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
      // the airships and balloons fly between the clouds and the horizon
      let skyDone = !this.sky.length;
      for (const l of behind) {
        if (!skyDone && l.depth > 0.1) { this.drawSky(c, cam); skyDone = true; }
        this.layer(c, l, cam);
      }
      if (!skyDone) this.drawSky(c, cam);
      this.drawPuffs(c, cam);
      for (const f of this.flags) this.drawFlag(c, f, cam);
      for (const f of this.fires) this.drawFire(c, f, cam);
      // the camp's people, then the things along the way
      this.drawLife(c, cam);
      for (const th of this.things) this.thing(c, th, cam);
      this.drawShadows(c, cam);
      for (const p of this.patrols) this.drawPatrol(c, p, cam);
      if (this.chase) this.drawChase(c, cam, false);
      c.save();
      const ch = this.chase;
      c.translate(Math.round((this.x - cam) * SS), Math.round((GY + (ch ? ch.jumpY : 0)) * SS));
      c.scale(SS * this.facing, SS);
      if (this.stun > 0 && !ch) c.rotate(-0.25 * Math.sin(Math.min(1, this.stun) * Math.PI));
      if (this.def.ride) drawHorse(c, this.t, this.moving, this.running, this.hero, ch ? !!this.keys.down : false);
      else drawPerson(c, this.hero, this.t, this.moving, this.running, this.crouch);
      c.restore();
      for (const cv of this.cover) this.drawCover(c, cv, cam);
      if (this.chase) this.drawChase(c, cam, true);
      this.drawParts(c, cam);
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
      this.placeBubbles();
      // onto the screen
      const out = this.canvas.getContext('2d');
      out.imageSmoothingEnabled = false;
      const sx = this.canvas.width / this.cssW;
      out.clearRect(0, 0, this.canvas.width, this.canvas.height);
      const jolt = this.shake > 0 && !this.reduce ? this.shake * 6 : 0;
      out.drawImage(this.buf, this.view.ox * sx + rnd(-jolt, jolt), this.view.oy * sx + rnd(-jolt, jolt), LW * this.view.k * sx, LH * this.view.k * sx);
    }

    /** Someone standing about: at (x, y), facing `face`, in a pose. */
    figure(c, look, x, y, face, t, moving, pose) {
      if (x < -20 || x > LW + 20) return;
      c.save();
      c.translate(Math.round(x * SS), Math.round(y * SS));
      c.scale(SS * face, SS);
      drawPerson(c, look, t, moving, false, false, pose);
      c.restore();
    }

    drawLife(c, cam) {
      for (const g of this.crowd) {
        g.people.forEach((p, i) => {
          const face = p.face || 1;
          const pose = g.showing === i ? 'talk' : p.pose || null;
          this.figure(c, LOOKS[p.look || 'soldier'], g.x + (p.dx || 0) - cam, p.y || GY, p.turn ? (Math.sin(this.t * 0.4 + i) > 0 ? 1 : -1) : face, this.t + i, false, pose);
        });
      }
      for (const m of this.marchers) {
        for (let i = 0; i < (m.n || 2); i++) this.figure(c, m.look, m.x - m.dir * i * (m.gap || 9) - cam, GY, m.dir, this.t, m.wait <= 0, null);
      }
      const d = this.drill;
      if (d) {
        for (let i = 0; i < (d.n || 5); i++) this.figure(c, LOOKS[d.look || 'rifleman'], d.x + i * (d.gap || 9) - cam, GY, d.face || 1, 0, false, d.pose);
        if (d.officer != null) this.figure(c, LOOKS.officer, d.x + d.officer - cam, GY, -(d.face || 1), this.t, false, d.bubble && d.bubble.classList.contains('on') ? 'talk' : null);
      }
    }

    /** A flag waving on its pole: every column rides the wind a little later than the last. */
    drawFlag(c, f, cam) {
      const x0 = f.x - cam * (f.depth == null ? 1 : f.depth);
      if (x0 < -40 || x0 > LW + 10) return;
      const w = f.w || 24, hh = f.h || 11;
      const cols = f.colors || ['#2e4a9a', '#f2eee6', '#c83a3a'];
      for (let i = 0; i < w; i++) {
        const k = i / w;
        const dy = Math.sin(this.t * 4.2 - i * 0.42) * k * 1.8;
        const slope = Math.cos(this.t * 4.2 - i * 0.42);
        const col = cols[Math.min(cols.length - 1, Math.floor(k * cols.length))];
        c.fillStyle = col;
        c.fillRect(Math.round((x0 + i) * SS), Math.round((f.y + dy) * SS), SS, Math.round(hh * SS));
        if (Math.abs(slope) > 0.55) { c.fillStyle = slope > 0 ? 'rgba(255,240,240,0.18)' : 'rgba(40,20,50,0.2)'; c.fillRect(Math.round((x0 + i) * SS), Math.round((f.y + dy) * SS), SS, Math.round(hh * SS)); }
        if (f.fringe && i % 2 === 0) { c.fillStyle = '#f0c050'; c.fillRect(Math.round((x0 + i) * SS), Math.round((f.y + dy + hh) * SS), SS, SS); }
      }
    }

    /** A camp fire: flames that never hold still, and the light they throw. */
    drawFire(c, f, cam) {
      const x = f.x - cam;
      if (x < -40 || x > LW + 40) return;
      const g = c.createRadialGradient(x * SS, (f.y - 6) * SS, 0, x * SS, (f.y - 6) * SS, 34 * SS);
      g.addColorStop(0, `rgba(255,170,90,${0.22 + Math.sin(this.t * 9) * 0.05})`);
      g.addColorStop(1, 'rgba(255,140,70,0)');
      c.fillStyle = g;
      c.fillRect((x - 34) * SS, (f.y - 40) * SS, 68 * SS, 68 * SS);
      for (let k = 0; k < 7; k++) {
        const fx = x - 6 + k * 2, hgt = 4 + Math.abs(Math.sin(this.t * (7 + k) + k * 1.7)) * (k === 3 ? 9 : 6);
        c.fillStyle = '#ff7a2a'; c.fillRect(Math.round(fx * SS), Math.round((f.y - 2 - hgt) * SS), 2 * SS, Math.round(hgt * SS));
        c.fillStyle = '#ffd070'; c.fillRect(Math.round(fx * SS), Math.round((f.y - 2 - hgt * 0.55) * SS), SS, Math.round(hgt * 0.55 * SS));
      }
    }

    drawPuffs(c, cam) {
      for (const p of this.puffs) {
        const x = p.x - cam;
        if (x < -30 || x > LW + 30) continue;
        const k = 1 - p.age / p.life;
        c.fillStyle = `rgba(${p.col},${(p.a * k).toFixed(3)})`;
        const R = p.r, n = Math.ceil(R);
        for (let dy = -n; dy <= n; dy++) { const w = Math.floor(Math.sqrt(Math.max(0, R * R - dy * dy))); c.fillRect(Math.round((x - w) * SS), Math.round((p.y + dy) * SS), (w * 2 + 1) * SS, SS); }
      }
    }

    /** The sky of an industrious empire: steam airships crossing, observation balloons on their tethers. */
    drawSky(c, cam) {
      for (const a of this.sky) {
        const s = a.s || 1;
        if (a.kind === 'balloon') {
          const x = a.x - cam * (a.depth == null ? 0.12 : a.depth);
          if (x < -30 || x > LW + 30) continue;
          const y = a.y + Math.sin(this.t * 0.7 + a.x) * 1.5;
          this.drawBalloon(c, x, y, s, a);
          continue;
        }
        const span = LW + 160 * s;
        const raw = a.x - cam * (a.depth == null ? 0.04 : a.depth) + (a.dir || -1) * this.t * (a.speed || 5);
        const x = ((raw % span) + span) % span - 80 * s;
        this.drawAirship(c, x, a.y + Math.sin(this.t * 0.5 + a.x) * 1.2, s, a.dir || -1);
      }
    }

    drawAirship(c, x, y, s, dir) {
      const P = (px, py, w, hh, col) => { c.fillStyle = col; c.fillRect(Math.round((x + px * dir) * SS - (dir < 0 ? Math.round(w * SS) : 0)), Math.round((y + py) * SS), Math.round(w * SS), Math.round(hh * SS)); };
      const L = 34 * s, H2 = 8 * s;
      // the envelope, a long cigar pointed at the front, lighter on top, with its seams
      for (let yy = -H2; yy <= H2; yy += 0.5) {
        const k = yy / H2;
        const half = L * Math.sqrt(Math.max(0, 1 - k * k));
        const nose = half * (1 - 0.15 * (1 - Math.abs(k)));
        const col = k < -0.55 ? '#fff6f0' : k < 0.2 ? '#eee0d8' : k < 0.6 ? '#d6c0c2' : '#b8a0aa';
        P(-half, yy, half + nose, 0.5, col);
      }
      P(-L * 0.9, -1, L * 1.8, 0.5, '#d8c4c4');
      P(-L * 0.8, H2 * 0.45, L * 1.6, 0.5, '#c0aab2');
      // the tricolour band near the tail, and the rudder
      P(-L * 0.62, -H2 * 0.85, 2 * s, H2 * 1.7, '#2e4a9a');
      P(-L * 0.62 + 2 * s, -H2 * 0.9, 2 * s, H2 * 1.8, '#f2eee6');
      P(-L * 0.62 + 4 * s, -H2 * 0.85, 2 * s, H2 * 1.7, '#c83a3a');
      for (let k = 0; k < 7 * s; k += 0.5) P(-L - 2 * s - k * 0.4, -k, 3 * s, 0.5, k < 3.5 * s ? '#c83a3a' : '#2e4a9a');
      // the keel, the rigging and the gondola, with its engine's propeller turning
      P(-L * 0.75, H2 + 4 * s, L * 1.5, 0.7, '#5a4a50');
      for (let k = -0.7; k <= 0.7; k += 0.2) P(L * k, H2 * 0.9, 0.5, 3.2 * s, 'rgba(90,70,80,0.8)');
      P(-6 * s, H2 + 4.5 * s, 12 * s, 3 * s, '#6a4a3a');
      P(-4 * s, H2 + 5.2 * s, 1.5, 1.2, '#ffd28a'); P(0, H2 + 5.2 * s, 1.5, 1.2, '#ffd28a');
      if (Math.floor(this.t * 16) % 2) P(-L * 0.78, H2 + 2 * s, 0.8, 5 * s, '#3a2e2a');
      else P(-L * 0.78 - 2 * s, H2 + 4 * s, 4 * s, 0.8, '#3a2e2a');
      // the steam engine's smoke, trailing behind
      for (let k = 0; k < 4; k++) {
        const age = ((this.t * 0.8 + k * 0.25) % 1);
        c.fillStyle = `rgba(230,220,228,${(0.5 * (1 - age)).toFixed(2)})`;
        const r = (1 + age * 3) * s;
        const px = x - dir * (6 * s + age * 26 * s), py = y + H2 + 3 * s - age * 3;
        c.fillRect(Math.round((px - r) * SS), Math.round((py - r * 0.6) * SS), Math.round(r * 2 * SS), Math.round(r * 1.2 * SS));
      }
    }

    drawBalloon(c, x, y, s, a) {
      const R = 8 * s;
      const cols = a.colors || ['#f2e6dc', '#c83a3a'];
      for (let yy = -R; yy <= R; yy += 0.5) {
        const w = Math.sqrt(Math.max(0, R * R - yy * yy)) * (yy > R * 0.3 ? 1 - (yy - R * 0.3) / (R * 1.3) : 1);
        for (let xx = -w; xx < w; xx += 1) {
          const gore = Math.floor(((Math.asin(Math.max(-1, Math.min(1, xx / Math.max(1, w)))) / Math.PI) + 0.5) * 6);
          let col = cols[gore % cols.length];
          if (xx > w * 0.35 || yy > R * 0.45) col = gore % 2 ? '#9a2a34' : '#c8b0b4';
          if (xx < -w * 0.4 && yy < 0) col = gore % 2 ? '#e05050' : '#fff8f0';
          c.fillStyle = col;
          c.fillRect(Math.round((x + xx) * SS), Math.round((y + yy) * SS), SS, Math.ceil(0.5 * SS));
        }
      }
      // ropes, the basket with two observers, and the tether down to the fort
      c.fillStyle = 'rgba(70,50,60,0.9)';
      for (const k of [-0.5, 0.5]) c.fillRect(Math.round((x + k * R * 0.9) * SS), Math.round((y + R * 0.8) * SS), SS / 2, Math.round(5 * s * SS));
      c.fillStyle = '#6a4a3a'; c.fillRect(Math.round((x - 2.5 * s) * SS), Math.round((y + R + 4 * s) * SS), Math.round(5 * s * SS), Math.round(3 * s * SS));
      c.fillStyle = '#2e4a8a'; c.fillRect(Math.round((x - 1.5 * s) * SS), Math.round((y + R + 3 * s) * SS), SS, SS); c.fillRect(Math.round((x + 1 * s) * SS), Math.round((y + R + 3 * s) * SS), SS, SS);
      if (a.tether) {
        c.fillStyle = 'rgba(70,50,60,0.55)';
        const y0 = y + R + 7 * s, y1 = a.tether;
        for (let yy = y0; yy < y1; yy += 1) c.fillRect(Math.round((x + (yy - y0) * 0.08) * SS), Math.round(yy * SS), 1, SS);
      }
    }

    /** Somewhere to hide: a charred wall, a heap of rubble, sandbags, an overturned cart. */
    drawCover(c, cv, cam) {
      const x0 = cv.x0 - cam, x1 = cv.x1 - cam;
      if (x1 < -10 || x0 > LW + 10) return;
      const R = (x, y, w, hh, col) => { c.fillStyle = col; c.fillRect(Math.round(x * SS), Math.round(y * SS), Math.round(w * SS), Math.round(hh * SS)); };
      const w = x1 - x0, kind = cv.kind || 'wall';
      if (kind === 'wall') {
        R(x0, GY - 16, w, 16, '#2a1c1a');
        for (let x = 0; x < w; x += 5) R(x0 + x, GY - 16 - ((x * 7) % 4), 5, 4, '#2a1c1a');
        R(x0, GY - 16, w, 1, '#6a4a3a');
        for (let x = 3; x < w; x += 9) R(x0 + x, GY - 10, 1, 8, '#1a1010');
      } else if (kind === 'sandbags') {
        for (let j = 0; j < 3; j++) for (let x = 0; x < w; x += 7) R(x0 + x + (j % 2) * 3, GY - 5 - j * 5, 6, 5, j % 2 ? '#8a7a58' : '#a8966a');
      } else if (kind === 'cart') {
        R(x0, GY - 14, w, 10, '#4a3020'); R(x0, GY - 14, w, 1, '#7a5234');
        c.fillStyle = '#2a1a10'; c.beginPath(); c.arc((x0 + w * 0.3) * SS, (GY - 4) * SS, 5 * SS, 0, Math.PI * 2); c.fill();
      } else {
        for (let k = 0; k < w / 3; k++) R(x0 + ((k * 13) % w), GY - 4 - ((k * 7) % 12), 6, 5, k % 3 ? '#3a2a24' : '#5a4034');
        R(x0 - 2, GY - 13, w + 4, 2, '#2a1a14');
      }
    }

    /** A soldier with a lantern, and the light it throws along the road. */
    drawPatrol(c, p, cam) {
      const x = p.x - cam;
      if (x < -120 || x > LW + 120) return;
      const len = p.reach || 92, lx = x + p.dir * 5, ly = GY - 12;
      c.save();
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(lx * SS, ly * SS, 2, lx * SS, ly * SS, len * SS);
      g.addColorStop(0, 'rgba(255,214,130,0.42)');
      g.addColorStop(0.6, 'rgba(255,190,100,0.16)');
      g.addColorStop(1, 'rgba(255,170,80,0)');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(lx * SS, ly * SS);
      c.lineTo((lx + p.dir * len) * SS, (GY - 38) * SS);
      c.lineTo((lx + p.dir * len) * SS, (GY + 5) * SS);
      c.closePath();
      c.fill();
      c.restore();
      c.save();
      c.translate(Math.round(x * SS), GY * SS);
      c.scale(SS * p.dir, SS);
      drawPerson(c, p.look, this.t, p.wait <= 0, false);
      c.restore();
    }

    /** The chase: what lies ahead on the road, and the riders behind. */
    drawChase(c, cam, front) {
      const ch = this.chase;
      const R = (x, y, w, hh, col) => { c.fillStyle = col; c.fillRect(Math.round(x * SS), Math.round(y * SS), Math.round(w * SS), Math.round(hh * SS)); };
      if (!front) {
        for (let i = 0; i < 2; i++) {
          const x = this.x - ch.gap - i * 24 - cam;
          if (x < -30 || x > LW + 30) continue;
          c.save();
          c.translate(Math.round(x * SS), GY * SS);
          c.scale(SS, SS);
          drawHorse(c, this.t + i * 0.37, true, true, LOOKS.bandit);
          c.restore();
        }
        return;
      }
      for (const o of ch.obstacles) {
        const x = o.x - cam;
        if (x < -20 || x > LW + 20) continue;
        if (o.kind === 'log') { R(x - 9, GY - 6, 18, 6, '#4a3020'); R(x - 9, GY - 6, 18, 1, '#7a5234'); R(x + 7, GY - 6, 3, 6, '#c8a878'); }
        else if (o.kind === 'rock') { R(x - 7, GY - 7, 14, 7, '#5a5660'); R(x - 5, GY - 9, 9, 3, '#7a7680'); R(x - 5, GY - 9, 4, 1, '#9a96a0'); }
        else {
          R(x - 1, GY - 70, 3, 36, '#2a1e14');
          R(x - 12, GY - 38, 26, 3, '#2a1e14');
          for (let k = 0; k < 6; k++) R(x - 12 + k * 5, GY - 42 + (k % 2) * 2, 5, 4, k % 2 ? '#3a5a2a' : '#4a6a34');
        }
      }
    }

    /** Where a shell is about to land: a shadow that grows, then a streak from the sky. */
    drawShadows(c, cam) {
      const sh = this.shelling;
      if (!sh) return;
      for (const s of sh.list) {
        const x = s.x - cam, k = Math.min(1, s.t / 1.3);
        c.globalAlpha = 0.2 + k * 0.4;
        c.fillStyle = '#100808';
        c.beginPath();
        c.ellipse(x * SS, GY * SS, (4 + k * 14) * SS, (1 + k * 2.5) * SS, 0, 0, Math.PI * 2);
        c.fill();
        if (s.t > 1.0) { c.globalAlpha = 0.9; c.fillStyle = '#1a1414'; const y = GY - (1.3 - s.t) * 400; c.fillRect(Math.round(x * SS), Math.round(y * SS), 2 * SS, 3 * SS); }
        c.globalAlpha = 1;
      }
    }

    drawParts(c, cam) {
      for (let z = 0; z < 3; z++) {
        for (const b of this.parts) {
          if (b.z !== z) continue;
          const k = 1 - b.age / b.life;
          c.globalAlpha = (b.a == null ? 1 : b.a) * k;
          c.fillStyle = b.col;
          const x = b.x - cam;
          if (b.r) {
            const R = Math.max(1, b.r), n = Math.floor(R);
            for (let dy = -n; dy <= n; dy++) { const w = Math.floor(Math.sqrt(R * R - dy * dy)); c.fillRect(Math.round((x - w) * SS), Math.round((b.y + dy) * SS), (w * 2 + 1) * SS, SS); }
            if (b.hi && R > 3) { c.fillStyle = b.hi; const r2 = R * 0.5, m = Math.floor(r2); for (let dy = -m; dy <= m; dy++) { const w = Math.floor(Math.sqrt(r2 * r2 - dy * dy)); c.fillRect(Math.round((x - R * 0.3 - w) * SS), Math.round((b.y - R * 0.3 + dy) * SS), (w * 2 + 1) * SS, SS); } }
          } else c.fillRect(Math.round(x * SS), Math.round(b.y * SS), (b.s || 1) * SS, (b.s || 1) * SS);
        }
      }
      c.globalAlpha = 1;
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
