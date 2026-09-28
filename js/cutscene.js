/*
 * cutscene.js — short cinematic sequences between the lines of the story.
 *
 * A cutscene is a list of shots (defined in story/cutscenes.js). Each shot shows a
 * painted scene through a slowly moving camera, with letterbox bars, a caption, extra
 * effects and sounds, and fades or cuts into the next. Two kinds of shot draw more
 * than a picture:
 *
 *   map     Hervé's route crossing the journey map, the camera following it
 *   letter  a sheet of paper and its words being written, column by column
 *
 * Click (or Space) moves on to the next shot; Esc, right-click or "Skip" ends it.
 */
(function () {
  'use strict';
  const VN = globalThis.VN;
  const h = VN.h;

  // ---- the journey map's projection: must match tools/paint/scenes-cutscenes.js
  const MAP = { lon0: -8, k: 3, latTop: 68.3, w: 480, h: 270 };
  const mercDeg = (lat) => (Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) * 180) / Math.PI;
  const mapXY = (lon, lat) => [(lon - MAP.lon0) * MAP.k, (mercDeg(MAP.latTop) - mercDeg(lat)) * MAP.k];

  const FX_TYPES = ['petals', 'leaves', 'foliage', 'snow', 'ash', 'rain', 'fireflies', 'motes', 'glints', 'stars', 'smoke', 'steam', 'embers', 'birds', 'flutter', 'glow', 'flame', 'rays', 'mist', 'rock'];
  /** "snow=1.2 flame=0.5,0.4,0.03,#ffc070" → effect specs, as in the script's bgfx lines. */
  function parseFx(str) {
    if (!str) return [];
    return str.trim().split(/\s+/).map((t) => {
      const [type, val] = t.split('=');
      if (!FX_TYPES.includes(type)) return null;
      const parts = val ? val.split(',') : [];
      return { type, nums: parts.filter((p) => !p.startsWith('#')).map(Number), color: parts.find((p) => p.startsWith('#')) || null };
    }).filter(Boolean);
  }

  /** Where the camera looks: [zoom, x, y], x and y the point to centre (fractions of the view). */
  function camTransform([z, x, y]) {
    const lim = (z - 1) / 2;
    const tx = Math.max(-lim, Math.min(lim, -z * (x - 0.5)));
    const ty = Math.max(-lim, Math.min(lim, -z * (y - 0.5)));
    return `translate(${(tx * 100).toFixed(3)}%, ${(ty * 100).toFixed(3)}%) scale(${z})`;
  }

  // Catmull-Rom through the stops, sampled every pixel, so the route curves naturally.
  function routePath(stops) {
    const P = stops.map((s) => mapXY(s.lon, s.lat));
    const out = [];
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
      const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const n = Math.max(2, Math.ceil(len));
      for (let k = 0; k < n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        out.push({ x: f(p0[0], p1[0], p2[0], p3[0]), y: f(p0[1], p1[1], p2[1], p3[1]), sea: !!stops[i + 1].sea, stop: k === 0 ? i : -1 });
      }
    }
    const last = P[P.length - 1];
    out.push({ x: last[0], y: last[1], sea: false, stop: P.length - 1 });
    let s = 0;
    out.forEach((p, i) => { if (i) s += Math.hypot(p.x - out[i - 1].x, p.y - out[i - 1].y); p.s = s; });
    return out;
  }

  const SHIP = ['..#....', '.###...', '#####.#', '.#####.'];

  class Player {
    constructor({ ui, stage, audio, settings, story }, def, { onDone }) {
      Object.assign(this, { ui, stage, audio, settings, story, def, onDone });
      this.timers = [];
      this.rafs = new Set();
      this.index = -1;
      this.current = null;
      this.done = false;
      this.reduce = !!settings.reduceMotion;
    }

    start() {
      this.view = h('div.cs-view');
      this.caption = h('div.cs-caption');
      this.flashEl = h('div.cs-flash');
      const skip = h('button.cs-skip', { type: 'button' }, 'Skip', h('span', '▸▸'));
      skip.addEventListener('click', (e) => { e.stopPropagation(); this.finish(); });
      this.el = h('div.overlay.cutscene', this.view, this.flashEl, h('div.cs-bar.top'), h('div.cs-bar.bottom', this.caption), skip);
      this.el.addEventListener('click', () => this.next());
      this.entry = this.ui.open(this.el, {
        onKey: (e) => {
          if (e.key === ' ' || e.key === 'Enter') this.next();
          else if (e.key === 'Escape') this.finish();
          return true;
        },
        onBack: () => this.finish(),
        focus: false,
      });
      this.entry.removeAfter = 900;
      this.entry.cleanup = () => this.stop();
      this.ui.cardEntry = this.entry;
      this.next();
    }

    later(ms, fn) { const id = setTimeout(() => { if (!this.done) fn(); }, ms); this.timers.push(id); return id; }

    next() {
      if (this.done) return;
      this.index++;
      const shots = this.def.shots || [];
      if (this.index >= shots.length) { this.finish(); return; }
      this.show(shots[this.index]);
    }

    show(shot) {
      for (const id of this.shotTimers || []) clearTimeout(id);
      this.shotTimers = [];
      const at = (sec, fn) => { const id = this.later(sec * 1000, fn); this.shotTimers.push(id); };
      const dur = (shot.dur || 5) * (this.reduce ? 0.8 : 1);
      const prev = this.current;
      const el = h('div.cs-shot');
      const cam = h('div.cs-cam');
      el.append(cam);
      // the picture
      if (shot.letter) cam.append(this.letter(shot.letter, dur));
      else {
        const bg = this.stage.makeBg(shot.bg || 'black', true, { fx: shot.nofx !== true });
        cam.append(bg);
        const extra = parseFx(shot.fx);
        const frame = bg.querySelector('.bg-frame');
        if (extra.length && VN.SceneFx) new VN.SceneFx(bg, extra, this.settings, frame || null);
        if (shot.map && frame) this.route(frame, cam, shot.map, dur);
        for (const sp of shot.sprites || []) cam.append(this.sprite(sp, dur));
      }
      if (shot.tint) el.append(h('div.cs-tint', { style: { background: shot.tint } }));
      if (shot.title) el.append(h('div.cs-title', { style: { animationDelay: `${shot.titleAt || 0.5}s` } }, shot.title));
      if (shot.kanji) el.append(h('div.cs-kanji', [...shot.kanji].map((c, i) => h('span', { style: { animationDelay: `${0.4 + i * 0.25}s` } }, c))));
      // the camera
      const moves = shot.cam ? (Array.isArray(shot.cam[0]) ? shot.cam : [shot.cam, shot.cam]) : [[1.1, 0.5, 0.5], [1.02, 0.5, 0.5]];
      if (!shot.map) {
        cam.style.transform = camTransform(moves[0]);
        if (!this.reduce && cam.animate) cam.animate([{ transform: camTransform(moves[0]) }, { transform: camTransform(moves[1]) }], { duration: (dur + 1.2) * 1000, easing: shot.ease || 'cubic-bezier(0.4, 0.05, 0.4, 1)', fill: 'forwards' });
        else cam.style.transform = camTransform(moves[1]);
      }
      // in with it, out with the last one
      const trans = prev ? shot.trans || 'fade' : 'cut';
      this.view.append(el);
      if (trans === 'cut') { if (prev) prev.remove(); }
      else if (trans === 'white' || trans === 'black') {
        this.flash(trans === 'white' ? '#fff' : '#000', 0.9);
        el.style.opacity = '0';
        at(0.35, () => { el.style.opacity = '1'; if (prev) prev.remove(); });
      } else {
        el.style.opacity = '0';
        el.style.transition = `opacity ${shot.fade || 1.1}s ease`;
        void el.offsetWidth;
        el.style.opacity = '1';
        if (prev) at((shot.fade || 1.1) + 0.1, () => prev.remove());
      }
      this.current = el;
      // words, sounds, flashes and shakes
      this.caption.classList.remove('on');
      if (shot.text) {
        at(shot.textAt == null ? 0.7 : shot.textAt, () => { this.caption.textContent = shot.text; this.caption.classList.add('on'); });
        at(Math.max(1.5, dur - 0.7), () => this.caption.classList.remove('on'));
      }
      for (const snd of [].concat(shot.sound || [])) {
        const [name, delay = 0, volume = 1] = Array.isArray(snd) ? snd : [snd];
        this.audio.fx(name, { delay, volume });
      }
      for (const t of [].concat(shot.flash || [])) at(t, () => this.flash('#fff6e0', 0.5));
      for (const s of [].concat(shot.shake || [])) {
        const [t, amt = 1] = Array.isArray(s) ? s : [s];
        at(t, () => { if (this.reduce) return; this.view.animate([{ transform: 'none' }, { transform: `translate(${6 * amt}px, ${3 * amt}px)` }, { transform: `translate(${-5 * amt}px, ${-2 * amt}px)` }, { transform: `translate(${3 * amt}px, ${1 * amt}px)` }, { transform: 'none' }], { duration: 420, easing: 'ease-out' }); });
      }
      at(dur, () => this.next());
    }

    flash(color, seconds) {
      this.flashEl.style.background = color;
      this.flashEl.animate([{ opacity: 0.9 }, { opacity: 0 }], { duration: seconds * 1000, easing: 'ease-out' });
    }

    sprite(sp, dur) {
      const img = h('img.cs-sprite', { alt: '', draggable: 'false', style: { left: `${(sp.x == null ? 0.5 : sp.x) * 100}%`, bottom: `${(sp.y || 0) * 100}%`, height: `${(sp.h || 0.8) * 100}%`, filter: sp.filter || '', opacity: String(sp.opacity == null ? 1 : sp.opacity) } });
      if (sp.flip) img.style.scale = '-1 1';
      VN.assets.resolve('sprite', `${sp.id}/${sp.expr || 'neutral'}`).then((url) => {
        if (url) img.src = url;
        else VN.assets.resolve('sprite', `${sp.id}/neutral`).then((u) => { if (u) img.src = u; });
      });
      if (sp.to != null && img.animate && !this.reduce) img.animate([{ left: `${sp.x * 100}%` }, { left: `${sp.to * 100}%` }], { duration: dur * 1000, easing: 'ease-in-out', fill: 'forwards' });
      return img;
    }

    /** A sheet of paper, its columns (or lines) of writing appearing one after another. */
    letter(L, dur) {
      const ja = L.lang !== 'fr';
      const paper = h(`div.cs-paper${ja ? '.ja' : '.fr'}`);
      const lines = L.lines || [];
      const step = L.step || Math.min(1.6, (dur - 1.2) / Math.max(1, lines.length));
      lines.forEach((text, i) => {
        const line = h('div.cs-writing', { style: { animationDelay: `${(L.at || 0.6) + i * step}s`, animationDuration: `${Math.max(0.8, step * 0.9)}s` } }, text);
        paper.append(line);
        if (!this.reduce) this.audio.fx('ink', { delay: (L.at || 0.6) + i * step, volume: 0.8 });
      });
      if (L.seal) paper.append(h('div.cs-paper-seal', L.seal));
      const desk = h('div.cs-desk', paper);
      if (L.underlay) desk.classList.add('underlay');
      return desk;
    }

    /** Hervé's route across the map: ink drawn behind a marker, towns named as he passes. */
    route(frame, cam, M, dur) {
      const stops = M.stops;
      const path = routePath(stops);
      const total = path[path.length - 1].s;
      const cv = h('canvas.cs-route', { width: MAP.w, height: MAP.h });
      const c = cv.getContext('2d');
      frame.append(cv);
      const labels = stops.map((s) => {
        const [x, y] = mapXY(s.lon, s.lat);
        const el = h(`div.cs-place${s.label ? '' : '.quiet'}${s.big ? '.big' : ''}${s.side ? `.${s.side}` : ''}`, { style: { left: `${(x / MAP.w) * 100}%`, top: `${(y / MAP.h) * 100}%` } }, h('i'), s.label ? h('span', s.label) : null);
        frame.append(el);
        return el;
      });
      const zoom = M.zoom || 2.1;
      const t0 = performance.now();
      const travel = (M.travel || dur - 1.6) * 1000;
      const delay = (M.delay || 0.6) * 1000;
      // the camera follows the head of the route, smoothly (measured once the shot is on screen)
      let geo = null;
      const measure = () => {
        const keep = cam.style.transform;
        cam.style.transform = 'none';
        const view = cam.getBoundingClientRect(), fr = frame.getBoundingClientRect();
        cam.style.transform = keep;
        return view.width && fr.width ? { view, fr } : null;
      };
      const toView = (px, py) => [(geo.fr.left - geo.view.left + (px / MAP.w) * geo.fr.width) / geo.view.width, (geo.fr.top - geo.view.top + (py / MAP.h) * geo.fr.height) / geo.view.height];
      let camPos = null;
      let camZ = M.startZoom || zoom * 0.75;
      let lastStop = -1;
      const draw = (now) => {
        if (this.done) return;
        if (!cv.isConnected || !(geo || (geo = measure()))) { this.rafs.add(requestAnimationFrame(draw)); return; }
        if (!camPos) camPos = toView(path[0].x, path[0].y);
        const k = Math.max(0, Math.min(1, (now - t0 - delay) / travel));
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        const head = e * total;
        c.clearRect(0, 0, MAP.w, MAP.h);
        let hp = path[0];
        for (const p of path) {
          if (p.s > head) break;
          hp = p;
          if (p.stop >= 0 && p.stop > lastStop) {
            lastStop = p.stop;
            labels[p.stop].classList.add('on');
            if (stops[p.stop].sound) this.audio.fx(stops[p.stop].sound, { volume: 0.7 });
          }
          const dash = p.sea ? Math.floor(p.s / 2) % 3 === 0 : Math.floor(p.s / 3) % 3 !== 2;
          if (!dash) continue;
          c.fillStyle = M.ink || '#9a2a1a';
          c.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
          if (!p.sea) { c.fillStyle = 'rgba(154,42,26,0.35)'; c.fillRect(Math.round(p.x), Math.round(p.y) + 1, 1, 1); }
        }
        // the traveller: a ship at sea, a red point on land, with a ring pulsing out from it
        const x = Math.round(hp.x), y = Math.round(hp.y);
        if (hp.sea) {
          c.fillStyle = '#3a2a1a';
          SHIP.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '#') c.fillRect(x - 3 + i, y - 3 + j + (Math.sin(now / 300) > 0 ? 0 : 1), 1, 1); }));
        } else {
          const ring = (now / 900) % 1;
          c.globalAlpha = 1 - ring;
          c.strokeStyle = '#c0301c';
          c.beginPath(); c.arc(x + 0.5, y + 0.5, 2 + ring * 6, 0, Math.PI * 2); c.stroke();
          c.globalAlpha = 1;
          c.fillStyle = '#fff4dc'; c.fillRect(x - 2, y - 1, 5, 3); c.fillRect(x - 1, y - 2, 3, 5);
          c.fillStyle = '#c0301c'; c.fillRect(x - 1, y - 1, 3, 3);
        }
        const [vx, vy] = toView(hp.x, hp.y);
        camPos = [camPos[0] + (vx - camPos[0]) * 0.06, camPos[1] + (vy - camPos[1]) * 0.06];
        const targetZ = k >= 1 && M.endZoom ? M.endZoom : zoom;
        camZ += (targetZ - camZ) * 0.03;
        cam.style.transform = this.reduce ? camTransform([1.25, 0.62, 0.5]) : camTransform([camZ, camPos[0], camPos[1]]);
        const id = requestAnimationFrame(draw);
        this.rafs.add(id);
      };
      this.rafs.add(requestAnimationFrame(draw));
    }

    stop() {
      this.done = true;
      for (const id of this.timers) clearTimeout(id);
      for (const id of this.rafs) cancelAnimationFrame(id);
      this.caption.classList.remove('on');
    }

    finish() {
      if (this.done) return;
      this.stop();
      if (this.ui.cardEntry === this.entry) this.ui.cardEntry = null;
      this.ui.close(this.entry);
      this.onDone();
    }
  }

  /** Play the named cutscene; resolves when it ends or is skipped. */
  VN.playCutscene = function (ctx, name) {
    const def = (globalThis.VN_CUTSCENES || {})[name];
    if (!def) return Promise.resolve();
    return new Promise((resolve) => new Player(ctx, def, { onDone: resolve }).start());
  };
  VN.CUTSCENE_MAP = { MAP, mapXY };
})();
