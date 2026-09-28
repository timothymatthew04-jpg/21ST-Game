/*
 * ui.js — every screen that isn't the scene itself: splash, title, choices,
 * the game menu (save / load / settings / history / endings / help),
 * confirmations, name input, chapter cards and the ending screen.
 */
(function () {
  'use strict';
  const VN = (globalThis.VN = globalThis.VN || {});
  const h = VN.h;

  const SLOT_PAGES = [
    { id: 'A', label: 'Auto', slots: ['quick', 'auto-1', 'auto-2', 'auto-3', 'auto-4', 'auto-5'] },
    { id: '1', label: '1' }, { id: '2', label: '2' }, { id: '3', label: '3' }, { id: '4', label: '4' },
  ];
  SLOT_PAGES.forEach((p) => { if (!p.slots) p.slots = Array.from({ length: 6 }, (_, i) => `${p.id}-${i + 1}`); });

  function slotLabel(slot) {
    if (slot === 'quick') return 'Quick save';
    if (slot.startsWith('auto-')) return `Autosave ${slot.slice(5)}`;
    const [page, n] = slot.split('-');
    return `Slot ${(parseInt(page, 10) - 1) * 6 + parseInt(n, 10)}`;
  }

  function formatDate(t) {
    const d = new Date(t);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // ---- chapter card pieces ---------------------------------------------------------------------
  const KANJI_DIGITS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
    'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty'];

  /** "Chapter 12" → 第十二章, "Prologue" → 序章, "Final Chapter" → 終章. */
  function chapterKanji(title) {
    if (/prologue/i.test(title)) return '序章';
    if (/final|epilogue|last/i.test(title)) return '終章';
    const m = title.match(/\d+/);
    if (!m) return '章';
    const n = parseInt(m[0], 10);
    if (n >= 100) return `第${m[0]}章`;
    const tens = Math.floor(n / 10), ones = n % 10;
    return `第${tens ? `${tens > 1 ? KANJI_DIGITS[tens] : ''}十` : ''}${KANJI_DIGITS[ones]}章`;
  }

  /** "Chapter 3" → "Chapter Three". */
  function spellChapter(title) {
    return title.replace(/\d+/, (d) => WORDS[parseInt(d, 10)] || d);
  }

  let svgId = 0;
  function svgEl(markup, cls) {
    const wrap = h(cls);
    wrap.innerHTML = markup;
    return wrap;
  }

  /** A vermilion stroke of a wide brush: a wet body and dry bristles, drawn left to right. */
  function brushStroke() {
    const id = `jc${++svgId}`;
    const bristles = [];
    for (let k = -4; k <= 4; k++) {
      const y = 80 + k * 9;
      const end = 760 + ((k * 37) % 90 + 90) % 90 + (Math.abs(k) > 2 ? -60 : 40);
      bristles.push(`<path class="jc-bristle" pathLength="1" style="animation-delay:${520 + Math.abs(k) * 25}ms" d="M${48 + Math.abs(k) * 6} ${y + 6} C 240 ${y - 16}, 520 ${y - 18}, ${end} ${y - 8}" stroke-width="${Math.abs(k) > 2 ? 5 : 9}" opacity="${Math.abs(k) > 3 ? 0.55 : 0.85}"/>`);
    }
    return svgEl(`<svg viewBox="0 0 900 160" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <filter id="${id}r" x="-4%" y="-40%" width="108%" height="180%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.16" numOctaves="3" seed="${svgId * 7}" result="n"/>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="16" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
        <linearGradient id="${id}g" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stop-color="#7d1810"/><stop offset="0.2" stop-color="#c12e1c"/>
          <stop offset="0.75" stop-color="#d8432a"/><stop offset="1" stop-color="#a3261a"/>
        </linearGradient>
      </defs>
      <g filter="url(#${id}r)" stroke="url(#${id}g)" fill="none" stroke-linecap="round">
        <path class="jc-body" pathLength="1" d="M52 88 C 240 66, 520 62, 820 72" stroke-width="58"/>
        ${bristles.join('')}
      </g>
    </svg>`, 'div.jc-brush');
  }

  /** A blot of ink spreading through wet paper behind everything. */
  function inkBlot() {
    const id = `jc${++svgId}`;
    return svgEl(`<svg viewBox="0 0 400 400" aria-hidden="true">
      <defs>
        <filter id="${id}b" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="4" seed="${svgId * 3}" result="n"/>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="60" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
        <radialGradient id="${id}f">
          <stop offset="0" stop-color="#000" stop-opacity="0.9"/>
          <stop offset="0.55" stop-color="#140d0a" stop-opacity="0.75"/>
          <stop offset="0.85" stop-color="#2a1a14" stop-opacity="0.35"/>
          <stop offset="1" stop-color="#2a1a14" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="170" fill="url(#${id}f)" filter="url(#${id}b)"/>
    </svg>`, 'div.jc-blot');
  }

  /** Gold sparks: a few always drifting up, and a burst on demand. */
  function sparkField(cv) {
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const rect = cv.getBoundingClientRect();
    const W = (cv.width = Math.max(1, Math.round(rect.width * dpr)));
    const H = (cv.height = Math.max(1, Math.round(rect.height * dpr)));
    const c = cv.getContext('2d');
    const unit = H / 720; // one stage pixel
    const dot = document.createElement('canvas');
    dot.width = dot.height = 32;
    const d = dot.getContext('2d');
    const g = d.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,250,225,1)');
    g.addColorStop(0.25, 'rgba(255,214,130,0.9)');
    g.addColorStop(0.6, 'rgba(255,140,40,0.25)');
    g.addColorStop(1, 'rgba(255,120,30,0)');
    d.fillStyle = g;
    d.fillRect(0, 0, 32, 32);
    const parts = [];
    let last = 0;
    let acc = 0;
    const add = (x, y, vx, vy, life, size, burst = false) => parts.push({ x, y, vx, vy, life, age: 0, size, burst, tw: Math.random() * 6 });
    return {
      burst(fx, fy) {
        for (let i = 0; i < 90; i++) {
          const a = Math.random() * Math.PI * 2, s = (160 + Math.random() * 620) * unit;
          add(fx * W, fy * H, Math.cos(a) * s, Math.sin(a) * s * 0.7 - 40 * unit, 0.9 + Math.random() * 1.4, (5 + Math.random() * 9) * unit, true);
        }
      },
      step(t) {
        const dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016;
        last = t;
        acc += dt * 26;
        while (acc > 1) {
          acc--;
          add(Math.random() * W, H * (0.55 + Math.random() * 0.5), (Math.random() - 0.5) * 20 * unit, -(30 + Math.random() * 60) * unit, 2.5 + Math.random() * 2.5, (3 + Math.random() * 6) * unit);
        }
        c.clearRect(0, 0, W, H);
        c.globalCompositeOperation = 'lighter';
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i];
          p.age += dt;
          if (p.age >= p.life) { parts.splice(i, 1); continue; }
          // burst sparks slow down quickly; then, like the drifting ones, they float upward
          const drag = p.burst ? Math.pow(0.08, dt) : 1;
          p.vx *= drag;
          p.vy = p.vy * drag - (p.burst ? 40 : 6) * unit * dt;
          p.x += p.vx * dt + Math.sin(t / 700 + p.tw) * 10 * unit * dt;
          p.y += p.vy * dt;
          const k = p.age / p.life;
          const a = Math.min(1, p.age * 4) * (1 - k) * (0.6 + 0.4 * Math.sin(t / 90 + p.tw));
          if (a <= 0.01) continue;
          c.globalAlpha = a;
          const s = p.size * (1 - k * 0.5) * 2;
          c.drawImage(dot, p.x - s / 2, p.y - s / 2, s, s);
        }
        c.globalAlpha = 1;
      },
    };
  }

  class UI {
    constructor(stageEl, story, settings, audio) {
      this.story = story;
      this.settings = settings;
      this.audio = audio;
      this.engine = null;
      this.overlays = [];

      this.stageEl = stageEl;
      this.gameLayer = h('div.game-layer.inactive');
      this.sceneRoot = h('div.scene-root');
      this.uiLayer = h('div.ui-layer');
      this.choicesEl = h('div.choices', { role: 'listbox', 'aria-label': 'Choices' });
      this.indicators = h('div.indicators');
      this.quickmenu = this.buildQuickMenu();
      this.gameLayer.append(this.sceneRoot, this.uiLayer);
      this.overlayRoot = h('div.overlays');
      this.toastEl = h('div.toasts', { 'aria-live': 'polite' });
      stageEl.append(this.gameLayer, this.overlayRoot, this.toastEl);

      this.textbox = new VN.Textbox(this.uiLayer, settings, audio);
      // Karma is felt, not shown: the scene dims while a choice is weighed, and glows
      // (or darkens) in the colour of whatever the choice touched.
      this.veil = h('div.choice-veil');
      this.pulseEl = h('div.karma-pulse');
      this.whisperEl = h('div.whispers', { 'aria-live': 'polite' });
      this.uiLayer.prepend(this.veil, this.pulseEl);
      this.uiLayer.append(this.choicesEl, this.quickmenu, this.indicators, this.whisperEl);
      this.choice = null;
      this.applySettings();
    }

    bind(engine) { this.engine = engine; }

    applySettings() {
      this.stageEl.classList.toggle('reduce-motion', !!this.settings.reduceMotion);
    }

    setInGame(on) {
      this.gameLayer.classList.toggle('inactive', !on);
    }

    setHidden(on) {
      this.gameLayer.classList.toggle('ui-hidden', on);
    }

    get uiHidden() { return this.gameLayer.classList.contains('ui-hidden'); }

    // ---- quick menu ------------------------------------------------------------
    buildQuickMenu() {
      const btn = (label, title, fn, key) => {
        const b = h('button.qm-btn', { type: 'button', tabindex: '-1', title, 'data-key': key || '' }, label);
        b.addEventListener('click', (e) => { e.stopPropagation(); b.blur(); this.audio.ui('select'); fn(); });
        return b;
      };
      this.qmSkip = btn('Skip', 'Skip read text (Tab, or hold Ctrl)', () => this.engine.toggleSkip(), 'skip');
      this.qmAuto = btn('Auto', 'Auto-advance (A)', () => this.engine.setAuto(!this.engine.auto), 'auto');
      const tab = (label, title, fn) => {
        const b = btn(label, title, fn);
        b.classList.add('qm-tab');
        return b;
      };
      return h('div.quickmenu', { onclick: (e) => e.stopPropagation() },
        h('div.qm-row',
          btn('Back', 'Go back one line (mouse wheel up)', () => this.engine.rollback()),
          btn('History', 'Dialogue history (L)', () => this.openMenu('history')),
          this.qmSkip,
          this.qmAuto,
          btn('Config', 'Settings', () => this.openMenu('settings')),
          btn('Hide', 'Hide the text box (H)', () => this.setHidden(true))),
        h('div.qm-tabs',
          tab('Q.Save', 'Quick save (Q)', () => this.engine.quickSave()),
          tab('Q.Load', 'Quick load', () => this.engine.quickLoad()),
          tab('Save', 'Save (S)', () => this.openMenu('save')),
          tab('Load', 'Load', () => this.openMenu('load'))));
    }

    setModes({ skip, auto }) {
      this.qmSkip.classList.toggle('active', !!skip);
      this.qmAuto.classList.toggle('active', !!auto);
      this.indicators.replaceChildren(
        ...(skip ? [h('span.ind.ind-skip', 'SKIP ▸▸')] : []),
        ...(auto ? [h('span.ind.ind-auto', 'AUTO ▸')] : []));
    }

    // ---- karma ------------------------------------------------------------------
    /** Where the story has arrived: a small caption at the top of the screen. */
    placeCaption({ name, region }) {
      if (this.placeEl) this.placeEl.remove();
      const el = h('div.place', { 'aria-live': 'polite' },
        region ? h('div.place-region', region) : null,
        h('div.place-rule'),
        h('div.place-name', name));
      this.placeEl = el;
      this.uiLayer.append(el);
      setTimeout(() => el.classList.add('out'), 3800);
      setTimeout(() => { el.remove(); if (this.placeEl === el) this.placeEl = null; }, 4700);
    }

    /** A short line that says a choice mattered, drawn in along a thread of its colour. */
    whisper(text, color, { quiet = false, delay = 0 } = {}) {
      const w = h('div.whisper', { style: { '--c': color, animationDelay: `${delay}ms` } },
        h('span.whisper-thread'), h('span.whisper-text', text));
      this.whisperEl.append(w);
      const stay = (quiet ? 1400 : 3800) + delay;
      setTimeout(() => w.classList.add('out'), stay);
      setTimeout(() => w.remove(), stay + 700);
    }

    /** After a choice lands: whispers, a glow or darkening in the thread's colour, a sound, the music dips. */
    feelKarma(felt, { quiet = false } = {}) {
      this.settleChoice(quiet ? 0.4 : 2.6);
      felt.forEach((f, i) => this.whisper(f.text, f.color, { quiet, delay: i * 450 }));
      if (quiet) return;
      const weight = felt.some((f) => f.weight === 'heavy') ? 'heavy' : felt[0].weight;
      const lead = felt.find((f) => f.weight === weight) || felt[0];
      const p = this.pulseEl;
      p.style.setProperty('--c', lead.color);
      p.className = `karma-pulse ${weight}`;
      void p.offsetWidth;
      p.classList.add('on');
      this.audio.karma(weight);
      this.audio.music.duck(weight === 'heavy' ? 0.25 : 0.45, 0.25);
      clearTimeout(this.unduckTimer);
      this.unduckTimer = setTimeout(() => this.audio.music.duck(1, 2.6), weight === 'heavy' ? 1400 : 900);
      if (weight === 'heavy' && !this.settings.reduceMotion) {
        this.sceneRoot.animate(
          [{ transform: 'scale(1)' }, { transform: 'scale(1.018)', offset: 0.14 }, { transform: 'scale(1)', offset: 0.32 }, { transform: 'scale(1.012)', offset: 0.46 }, { transform: 'scale(1)' }],
          { duration: 1300, easing: 'ease-out' });
      }
    }

    /** The moment of choosing is over: lift the veil and bring the music back. */
    settleChoice(seconds = 1.2) {
      this.veil.classList.remove('on');
      if (this.audio.music.duckLevel !== 1 && !this.pulseEl.classList.contains('on')) this.audio.music.duck(1, seconds);
    }

    toast(text, kind) {
      const t = h(`div.toast${kind ? `.${kind}` : ''}`, text);
      this.toastEl.append(t);
      setTimeout(() => t.classList.add('out'), 1900);
      setTimeout(() => t.remove(), 2400);
    }

    // ---- overlays ----------------------------------------------------------------
    get modalOpen() { return this.overlays.length > 0; }

    open(el, { onKey, onBack, focus = true } = {}) {
      const entry = { el, onKey, onBack };
      this.overlays.push(entry);
      this.overlayRoot.append(el);
      el.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); if (entry.onBack) entry.onBack(); });
      requestAnimationFrame(() => el.classList.add('shown'));
      if (focus) setTimeout(() => this.focusFirst(el), 30);
      if (this.onOverlayChange) this.onOverlayChange();
      return entry;
    }

    close(entry) {
      const i = this.overlays.indexOf(entry);
      if (i < 0) return;
      this.overlays.splice(i, 1);
      entry.el.classList.remove('shown');
      entry.el.classList.add('closing');
      setTimeout(() => entry.el.remove(), entry.removeAfter || 220);
      const top = this.overlays[this.overlays.length - 1];
      if (top) setTimeout(() => { if (!top.el.contains(document.activeElement)) this.focusFirst(top.el); }, 30);
      else if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      if (this.onOverlayChange) this.onOverlayChange();
    }

    closeAll() {
      [...this.overlays].forEach((o) => this.close(o));
    }

    focusFirst(el) {
      const target = el.querySelector('[autofocus]') || el.querySelector('.active-default') || el.querySelector('button:not([disabled]), input');
      if (target) target.focus({ preventScroll: true });
    }

    /** Keyboard handling for the top overlay. Returns true when consumed. */
    handleKey(e) {
      const top = this.overlays[this.overlays.length - 1];
      if (!top) return false;
      if (top.onKey && top.onKey(e)) return true;
      if (e.key === 'Escape') { if (top.onBack) top.onBack(); return true; }
      if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key) && e.target.tagName !== 'INPUT') {
        const items = [...top.el.querySelectorAll('button:not([disabled]), input[type=range]')].filter((b) => b.offsetParent !== null);
        if (!items.length) return true;
        if (e.target.type === 'range' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) return false;
        const i = items.indexOf(document.activeElement);
        const dir = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
        const next = items[(i + dir + items.length) % items.length] || items[0];
        next.focus({ preventScroll: false });
        this.audio.ui('hover');
        e.preventDefault();
        return true;
      }
      return false;
    }

    button(label, onClick, cls = '') {
      const b = h(`button.btn${cls}`, { type: 'button' }, label);
      b.addEventListener('click', (e) => { e.stopPropagation(); this.audio.ui('select'); onClick(e); });
      b.addEventListener('mouseenter', () => { this.audio.ui('hover'); });
      return b;
    }

    // ---- splash & warning ----------------------------------------------------------
    splash() {
      return new Promise((resolve) => {
        const el = h('div.overlay.splash',
          this.story.titleLogo === 'brush' && VN.buildBrushLogo
            ? VN.buildBrushLogo(this.story.title, '', { animate: !this.settings.reduceMotion })
            : [this.story.emblem && h('div.splash-seal', { 'aria-hidden': 'true' }, this.story.emblem),
              h('div.splash-title', { 'data-text': this.story.title }, this.story.title)],
          h('div.splash-press', 'Click to begin'),
          h('div.splash-hint', 'or press any key'));
        let entry;
        const go = () => {
          if (!entry) return;
          const e = entry;
          entry = null;
          this.audio.unlock();
          this.audio.ui('chime');
          this.close(e);
          resolve();
        };
        el.addEventListener('click', go);
        entry = this.open(el, { onKey: (ev) => { if (!ev.repeat && ev.key !== 'Tab') go(); return true; }, focus: false });
      });
    }

    warning(text) {
      return new Promise((resolve) => {
        let entry;
        const ok = this.button('I understand', () => { this.close(entry); resolve(); }, '.primary');
        ok.setAttribute('autofocus', '');
        const el = h('div.overlay.warning',
          h('div.panel.warning-panel',
            h('div.eyebrow', 'Before you begin'),
            h('p.warning-text', text),
            h('div.row', ok)));
        entry = this.open(el, { onBack: () => {} });
      });
    }

    // ---- title screen ----------------------------------------------------------------
    showTitle() {
      if (this.titleEntry) return;
      const eng = this.engine;
      const endingsFound = Object.keys(eng.persistent.endings).length;
      const hasSaves = eng.latestSave() != null;
      const items = [
        hasSaves && this.button('Continue', () => eng.continueGame(), '.title-item.active-default'),
        this.button('New Game', () => eng.newGame(), `.title-item${hasSaves ? '' : '.active-default'}`),
        this.button('Load', () => this.openMenu('load', { fromTitle: true }), '.title-item'),
        this.story.endings.length && this.button(`Endings  ${endingsFound}/${this.story.endings.length}`, () => this.openMenu('endings', { fromTitle: true }), '.title-item'),
        this.button('Settings', () => this.openMenu('settings', { fromTitle: true }), '.title-item'),
        this.button('Help', () => this.openMenu('help', { fromTitle: true }), '.title-item'),
      ].filter(Boolean);

      // Cover art, slowly drifting, with the animated light / leaves layer on top.
      const fx = this.story.titleFx;
      const painted = fx && VN.PAINT_PRESETS && VN.PAINT_PRESETS[fx.preset];
      const drift = h('div.title-drift');
      if (this.story.titleBackground) drift.append(eng.stage.makeBg(this.story.titleBackground));
      const bg = h('div.title-bg', drift);
      // Light and leaves sit in front of the shading, on their own parallax layer.
      const fxLayer = h('div.title-fxlayer');
      const coverUrl = this.story.titleBackground ? VN.assets.lookup('bg', this.story.titleBackground) : null;
      if (VN.setAmbient) VN.setAmbient(coverUrl || null);
      if (fx && painted) {
        // light, shade and the swaying canopy live in the picture layer; leaves in front
        requestAnimationFrame(() => new VN.PaintFx(fxLayer, { ...fx, image: coverUrl, imageHost: drift }, this.settings));
      } else if (fx && VN.TitleFx) new VN.TitleFx(fxLayer, fx, this.settings);
      // The title logo: glowing brush lettering, or carved letters (see brushlogo.js / titlelogo.js).
      const logoOpts = { animate: !this.settings.reduceMotion };
      const logo = this.story.titleLogo === 'brush' && VN.buildBrushLogo
        ? VN.buildBrushLogo(this.story.title, this.story.subtitle, logoOpts)
        : VN.buildTitleLogo(this.story.title, this.story.subtitle, logoOpts);
      const el = h(`div.overlay.title-screen${painted ? '.painted' : ''}${this.story.titleLogo === 'brush' ? '.glow-ui' : ''}`,
        bg, h('div.title-shade'), fxLayer,
        h('div.title-block', logo),
        h('nav.title-menu', items),
        h('div.title-foot',
          h('span', this.story.credits || ''),
          h('span', endingsFound ? `${endingsFound} of ${this.story.endings.length} endings found` : '')));
      if (eng.persistent.vars && eng.persistent.vars.title_variant) el.classList.add(`variant-${eng.persistent.vars.title_variant}`);
      // Gentle parallax: the picture leans away from the pointer.
      if (!this.settings.reduceMotion) {
        el.addEventListener('pointermove', (e) => {
          const r = el.getBoundingClientRect();
          const dx = ((e.clientX - r.left) / r.width) - 0.5;
          const dy = ((e.clientY - r.top) / r.height) - 0.5;
          bg.style.setProperty('--px', `${dx * -18}px`);
          bg.style.setProperty('--py', `${dy * -12}px`);
          fxLayer.style.setProperty('--px', `${dx * -34}px`);
          fxLayer.style.setProperty('--py', `${dy * -22}px`);
        });
      }
      this.titleEntry = this.open(el, { onBack: () => {} });
    }

    hideTitle() {
      if (this.titleEntry) { this.close(this.titleEntry); this.titleEntry = null; }
    }

    // ---- choices -------------------------------------------------------------------------
    showChoices(options) {
      this.cancelChoices();
      return new Promise((resolve, reject) => {
        const buttons = options.map((text, i) => {
          const b = h('button.choice', { type: 'button', style: { animationDelay: `${i * 60}ms` } },
            h('span.choice-key', String(i + 1)), h('span.choice-text', VN.stripTags(text)));
          b.addEventListener('click', (e) => { e.stopPropagation(); pick(i); });
          b.addEventListener('mouseenter', () => { b.focus({ preventScroll: true }); this.audio.ui('hover'); });
          return b;
        });
        let done = false;
        const pick = (i) => {
          if (done) return;
          done = true;
          this.audio.ui('select');
          buttons.forEach((b, j) => b.classList.add(j === i ? 'picked' : 'dropped'));
          // the chosen line lingers a moment, so the choice is felt before the story moves on
          const hold = this.engine && this.engine.isSkipping() ? 200 : 620;
          setTimeout(() => {
            this.choicesEl.replaceChildren();
            this.choicesEl.classList.remove('on');
            this.choice = null;
            resolve(i);
          }, hold);
        };
        this.pulseEl.classList.remove('on');
        this.veil.classList.add('on');
        clearTimeout(this.unduckTimer);
        this.audio.music.duck(0.6, 0.8);
        this.choicesEl.replaceChildren(...buttons);
        this.choicesEl.classList.add('on');
        this.choice = {
          buttons,
          pick,
          reject,
          key: (e) => {
            const n = parseInt(e.key, 10);
            if (n >= 1 && n <= buttons.length) { pick(n - 1); return true; }
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              const i = buttons.indexOf(document.activeElement);
              const next = e.key === 'ArrowDown' ? (i + 1) % buttons.length : (i - 1 + buttons.length) % buttons.length;
              buttons[i < 0 ? 0 : next].focus({ preventScroll: true });
              this.audio.ui('hover');
              return true;
            }
            if ((e.key === 'Enter' || e.key === ' ') && buttons.includes(document.activeElement)) {
              pick(buttons.indexOf(document.activeElement));
              return true;
            }
            return false;
          },
        };
      });
    }

    cancelChoices() {
      if (!this.choice) return;
      this.choice = null;
      this.settleChoice(0.4);
      this.choicesEl.replaceChildren();
      this.choicesEl.classList.remove('on');
    }

    // ---- confirm & input -------------------------------------------------------------------
    confirm(message, { yes = 'Yes', no = 'No' } = {}) {
      return new Promise((resolve) => {
        let entry;
        const finish = (v) => { if (!entry) return; const e = entry; entry = null; this.close(e); resolve(v); };
        const noBtn = this.button(no, () => finish(false));
        const yesBtn = this.button(yes, () => finish(true), '.primary');
        noBtn.setAttribute('autofocus', '');
        const el = h('div.overlay.dim.confirm', h('div.panel.confirm-panel', h('p', message), h('div.row', noBtn, yesBtn)));
        entry = this.open(el, {
          onBack: () => finish(false),
          onKey: (e) => {
            if (e.key === 'y' || e.key === 'Y') { finish(true); return true; }
            if (e.key === 'n' || e.key === 'N') { finish(false); return true; }
            return false;
          },
        });
      });
    }

    ask(prompt, def, max) {
      let entry;
      const promise = new Promise((resolve) => {
        const input = h('input.text-input', { id: 'vn-name-input', type: 'text', maxlength: String(max || 16), value: '', placeholder: def || '', autocomplete: 'off', spellcheck: 'false', autofocus: true });
        const submit = () => {
          const v = input.value.trim() || def || '';
          if (!v) { input.classList.add('shake'); this.audio.ui('error'); setTimeout(() => input.classList.remove('shake'), 400); return; }
          const e = entry;
          entry = null;
          this.close(e);
          resolve(v);
        };
        const form = h('form.panel.input-panel', h('label', { for: 'vn-name-input' }, prompt), input, h('div.row', this.button('OK', submit, '.primary')));
        form.addEventListener('submit', (e) => { e.preventDefault(); submit(); });
        const el = h('div.overlay.dim.input', form);
        entry = this.open(el, { onBack: () => {} });
      });
      promise.cancel = () => { if (entry) { this.close(entry); entry = null; } };
      this.pendingAsk = promise;
      return promise;
    }

    cancelTransient() {
      this.cancelChoices();
      if (this.pendingAsk) { this.pendingAsk.cancel(); this.pendingAsk = null; }
      if (this.cardEntry) { this.close(this.cardEntry); this.cardEntry = null; }
    }

    // ---- chapter card & ending -----------------------------------------------------------------
    /**
     * The chapter card, in the style of the title menu: an ink wash, the chapter number
     * as big brushed kanji, the name glowing over a vermilion brush stroke, and a red
     * seal stamped at the end in a burst of gold sparks.
     */
    chapterCard(title, subtitle, { fast, seal, kanji } = {}) {
      return new Promise((resolve) => {
        const reduce = this.settings.reduceMotion;
        const eyebrow = spellChapter(title);
        const sub = subtitle || '';
        const subSize = Math.round(Math.min(64, 820 / (Math.max(sub.length, 6) * 0.86)));
        const letters = (text, cls, step, from) => h(cls, [...text].map((c, i) => h('span', { style: { animationDelay: `${from + i * step}ms` } }, c === ' ' ? ' ' : c)));
        const kanjiCol = h('div.jc-kanji', [...(kanji || chapterKanji(title))].map((c, i) => h('span', { style: { animationDelay: `${250 + i * 170}ms` } }, c)));
        const sealChars = [...(seal || '絹')].slice(0, 2);
        const sealEl = h(`div.jc-seal${sealChars.length > 1 ? '.two' : ''}`, h('div.jc-seal-face', sealChars.map((c) => h('span', c))));
        const main = h('div.jc-main',
          letters(eyebrow.toUpperCase(), 'div.jc-eyebrow', 32, 650),
          h('div.jc-line',
            brushStroke(),
            h('div.jc-sub', { style: { fontSize: `${subSize}px` } },
              letters(sub.toUpperCase(), 'span.jc-sub-text', 45, 950),
              h('span.jc-shine', { 'aria-hidden': 'true' }, sub.toUpperCase())),
            sealEl));
        const sparks = h('canvas.jc-sparks');
        const el = h(`div.overlay.card.jcard${fast ? '.fast' : ''}${reduce ? '.still' : ''}`,
          h('div.jc-wash'), inkBlot(), h('div.jc-rays'), h('div.jc-grain'), sparks,
          h('div.jc-group', main, kanjiCol),
          h('div.jc-flash'));
        let entry;
        let raf = 0;
        let stampTimer = 0;
        const finish = () => {
          if (!entry) return;
          const e = entry;
          entry = null;
          this.cardEntry = null;
          this.cardFinish = null;
          clearTimeout(timer);
          clearTimeout(stampTimer);
          e.removeAfter = fast ? 250 : 800;
          this.close(e);
          setTimeout(() => cancelAnimationFrame(raf), e.removeAfter);
          resolve();
        };
        el.addEventListener('click', finish);
        entry = this.open(el, { onKey: (e) => { if ([' ', 'Enter', 'Escape'].includes(e.key)) finish(); return true; }, onBack: finish, focus: false });
        this.cardEntry = entry;
        this.cardFinish = finish;
        const timer = setTimeout(finish, fast ? 700 : 4400);
        if (fast) return;
        this.audio.fx('whoosh', { volume: 0.8 });
        this.audio.fx('ink', { volume: 0.9, delay: 0.3 });
        this.audio.fx('ink', { volume: 0.7, delay: 0.6 });
        this.audio.fx('stamp', { delay: 1.95 });
        this.audio.fx('sparkle', { volume: 0.9, delay: 2.0 });
        if (reduce) return;
        // gold sparks drifting up, and a burst when the seal lands
        const field = sparkField(sparks);
        const loop = (t) => { field.step(t); raf = requestAnimationFrame(loop); };
        raf = requestAnimationFrame(loop);
        stampTimer = setTimeout(() => {
          const r = sealEl.getBoundingClientRect(), c = sparks.getBoundingClientRect();
          if (c.width) field.burst((r.left + r.width / 2 - c.left) / c.width, (r.top + r.height / 2 - c.top) / c.height);
        }, 1980);
      });
    }

    endingScreen(ending, found, total, choices = []) {
      return new Promise((resolve) => {
        let entry;
        const finish = () => { this.close(entry); resolve(); };
        const back = this.button('Return to title', finish, choices.length ? '' : '.primary');
        const buttons = [back];
        // The ending reveals what the story never showed as numbers: each choice, and how it was felt.
        const recap = h('div.recap',
          h('div.recap-eyebrow', 'THE THREADS YOU WOVE'),
          h('ol.recap-list', { style: { '--rows': String(Math.ceil(choices.length / 2)) } }, choices.map((c, i) => {
            const felt = c.felt || [];
            return h('li.recap-item', { style: { '--c': felt[0] ? felt[0].color : '#b9ab93', animationDelay: `${200 + i * 110}ms` } },
              h('span.recap-knot'),
              h('div.recap-body',
                h('div.recap-chapter', (c.chapter || '').replace(' · ', ' — ')),
                h('div.recap-choice', `“${c.text.replace(/^[“"]|[”"]$/g, '')}”`),
                felt.length ? h('div.recap-felt', felt.map((f) => h('span', { style: { color: f.color } }, f.text))) : null));
          })),
          h('div.row', this.button('Return to title', finish, '.primary')));
        if (choices.length) {
          const show = this.button('See your choices', () => { el.classList.add('show-recap'); this.audio.ui('page'); setTimeout(() => this.focusFirst(recap), 60); }, '.primary');
          buttons.unshift(show);
          show.setAttribute('autofocus', '');
        } else back.setAttribute('autofocus', '');
        const el = h(`div.overlay.ending.kind-${ending.kind || 'neutral'}`,
          h('div.ending-main',
            h('div.ending-eyebrow', 'ENDING'),
            h('div.ending-title', ending.title),
            h('div.ending-rule'),
            h('div.ending-count', `${found} of ${total} endings found`),
            h('div.row', buttons)),
          choices.length ? recap : null);
        entry = this.open(el, { onBack: () => {} });
      });
    }

    // ---- errors ---------------------------------------------------------------------------------
    showErrors(title, errors) {
      const el = h('div.overlay.errors',
        h('div.panel.error-panel',
          h('div.eyebrow', 'Story script problem'),
          h('h2', title),
          h('ul', errors.slice(0, 30).map((e) => h('li', e.line ? h('b', `Line ${e.line}: `) : null, e.msg))),
          h('p.muted', 'Fix these in story/script.js and reload the page.')));
      this.open(el, { onBack: () => {} });
    }

    // ---- game menu --------------------------------------------------------------------------------
    openMenu(tab, { fromTitle = false } = {}) {
      if (this.menuEntry) { this.showTab(tab); return; }
      const eng = this.engine;
      const inGame = eng.inGame && !fromTitle;
      const tabs = inGame
        ? [['history', 'History'], ['save', 'Save'], ['load', 'Load'], ['settings', 'Settings'], ['endings', 'Endings'], ['help', 'Help']]
        : [['load', 'Load'], ['settings', 'Settings'], ['endings', 'Endings'], ['help', 'Help']];
      if (!this.story.endings.length) tabs.splice(tabs.findIndex((t) => t[0] === 'endings'), 1);
      this.menuTabs = {};
      const nav = h('nav.menu-nav');
      const closeMenu = () => {
        this.audio.ui('back');
        this.close(this.menuEntry);
        this.menuEntry = null;
      };
      nav.append(this.button('Return', closeMenu, '.nav-return'));
      for (const [id, label] of tabs) {
        const b = this.button(label, () => this.showTab(id), '.nav-item');
        this.menuTabs[id] = b;
        nav.append(b);
      }
      if (inGame) {
        nav.append(this.button('Main Menu', async () => {
          if (await this.confirm('Return to the main menu? Anything since your last save will be lost.')) {
            closeMenu();
            eng.returnToTitle();
          }
        }, '.nav-main'));
      }
      this.menuBody = h('div.menu-body');
      this.menuTitle = h('div.menu-title');
      const el = h('div.overlay.menu', h('div.menu-side', h('div.menu-logo', this.story.title), nav), h('div.menu-main', this.menuTitle, this.menuBody));
      this.menuEntry = this.open(el, {
        onBack: closeMenu,
        onKey: (e) => {
          if (this.menuTab === 'history' && (e.key === 'l' || e.key === 'L')) { closeMenu(); return true; }
          if ((e.key === 'PageDown' || e.key === 'PageUp') && this.savePageSwitch) { this.savePageSwitch(e.key === 'PageDown' ? 1 : -1); return true; }
          return false;
        },
        focus: false,
      });
      this.menuFromTitle = !inGame;
      this.showTab(tab);
    }

    showTab(tab) {
      this.menuTab = tab;
      this.savePageSwitch = null;
      for (const [id, b] of Object.entries(this.menuTabs)) b.classList.toggle('current', id === tab);
      const titles = { history: 'History', save: 'Save', load: 'Load', settings: 'Settings', endings: 'Endings', help: 'Help' };
      this.menuTitle.textContent = titles[tab] || '';
      const body = this.menuBody;
      body.scrollTop = 0;
      if (tab === 'save' || tab === 'load') this.renderSlots(body, tab);
      else if (tab === 'settings') this.renderSettings(body);
      else if (tab === 'history') this.renderHistory(body);
      else if (tab === 'endings') this.renderEndings(body);
      else if (tab === 'help') this.renderHelp(body);
      setTimeout(() => { if (this.menuTabs[tab]) this.menuTabs[tab].focus({ preventScroll: true }); }, 20);
    }

    renderSlots(body, mode) {
      const eng = this.engine;
      let pageIdx = VN.store.get('ui.savePage', 1);
      if (mode === 'load' && eng.latestSave() && pageIdx === 1 && !SLOT_PAGES[1].slots.some((s) => eng.readSave(s))) pageIdx = 0;
      pageIdx = VN.clamp(pageIdx, 0, SLOT_PAGES.length - 1);
      const pager = h('div.pager');
      const grid = h('div.slot-grid');
      const note = h('div.slot-note');
      const draw = () => {
        VN.store.set('ui.savePage', pageIdx);
        pager.replaceChildren(...SLOT_PAGES.map((p, i) => {
          const b = this.button(p.label, () => { pageIdx = i; this.audio.ui('page'); draw(); }, `.page-btn${i === pageIdx ? '.current' : ''}`);
          b.setAttribute('aria-label', `Page ${p.label}`);
          return b;
        }));
        const page = SLOT_PAGES[pageIdx];
        note.textContent = page.id === 'A' ? 'Autosaves are made at every choice and chapter.' : '';
        grid.replaceChildren(...page.slots.map((slot) => this.slotButton(slot, mode, draw)));
      };
      this.savePageSwitch = (d) => { pageIdx = (pageIdx + d + SLOT_PAGES.length) % SLOT_PAGES.length; draw(); };
      draw();
      body.replaceChildren(pager, grid, note);
    }

    slotButton(slot, mode, redraw) {
      const eng = this.engine;
      const data = eng.readSave(slot);
      const auto = slot === 'quick' || slot.startsWith('auto-');
      const thumb = h('div.slot-thumb');
      const info = h('div.slot-info', h('b', slotLabel(slot)));
      if (data) {
        eng.stage.renderThumb(thumb, data.state.scene);
        info.append(h('span.slot-date', formatDate(data.time)), h('span.slot-chapter', data.chapter || ''), h('span.slot-line', data.preview || ''));
      } else {
        thumb.classList.add('empty');
        info.append(h('span.slot-empty', 'Empty'));
      }
      const disabled = (mode === 'load' && !data) || (mode === 'save' && auto && slot !== 'quick');
      const b = h('button.slot', { type: 'button', disabled: disabled || null }, thumb, info);
      b.addEventListener('mouseenter', () => this.audio.ui('hover'));
      b.addEventListener('click', async (e) => {
        e.stopPropagation();
        this.audio.ui('select');
        if (mode === 'save') {
          if (data && !(await this.confirm(`Overwrite ${slotLabel(slot).toLowerCase()}?`))) return;
          if (eng.save(slot)) { this.audio.ui('save'); this.toast('Saved'); }
          redraw();
        } else if (data) {
          if (eng.inGame && !this.menuFromTitle && !(await this.confirm('Load this save? Anything since your last save will be lost.'))) return;
          this.close(this.menuEntry);
          this.menuEntry = null;
          eng.load(slot);
        }
      });
      const wrap = h('div.slot-wrap', b);
      if (data && !auto) {
        const del = h('button.slot-del', { type: 'button', title: 'Delete this save', 'aria-label': `Delete ${slotLabel(slot)}` }, '✕');
        del.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (await this.confirm(`Delete ${slotLabel(slot).toLowerCase()}? This can't be undone.`)) { eng.deleteSave(slot); redraw(); }
        });
        wrap.append(del);
      }
      return wrap;
    }

    renderHistory(body) {
      const items = this.engine.history.map((e) => {
        if (e.choice) return h('div.hist.hist-choice', h('span.hist-mark', '▸'), h('span', e.text));
        return h('div.hist', e.who ? h('b.hist-name', { style: { color: e.color } }, e.who) : h('b.hist-name.narr', ''), h('span', { class: e.italic ? 'italic' : '' }, e.text));
      });
      const list = h('div.history', items.length ? items : [h('p.muted', 'Nothing yet.')]);
      body.replaceChildren(list);
      requestAnimationFrame(() => { body.scrollTop = body.scrollHeight; });
    }

    renderEndings(body) {
      const found = this.engine.persistent.endings;
      const cards = this.story.endings.map((e, i) => {
        const got = found[e.id];
        return h(`div.ending-card${got ? `.got.kind-${e.kind}` : '.locked'}`,
          h('span.ending-num', String(i + 1).padStart(2, '0')),
          h('b', got ? e.title : '? ? ?'),
          h('span', got ? `Found ${formatDate(got.time)}` : 'Not found yet'));
      });
      const count = Object.keys(found).filter((id) => this.story.endings.some((e) => e.id === id)).length;
      body.replaceChildren(h('p.endings-count', `${count} / ${this.story.endings.length} found`), h('div.ending-grid', cards));
    }

    renderHelp(body) {
      const rows = [
        ['Click · Space · Enter', 'Advance the text'],
        ['Mouse wheel up · ←', 'Go back one line'],
        ['Tab', 'Toggle skip (read text only, see Settings)'],
        ['Hold Ctrl', 'Skip while held'],
        ['A', 'Toggle auto-advance'],
        ['H · middle click', 'Hide the text box'],
        ['L', 'History'],
        ['S', 'Save menu'],
        ['Q', 'Quick save'],
        ['F', 'Fullscreen'],
        ['Esc · right click', 'Game menu'],
        ['1–9', 'Pick a choice'],
      ];
      body.replaceChildren(h('div.help', h('table', rows.map(([k, v]) => h('tr', h('th', k), h('td', v))))));
    }

    renderSettings(body) {
      const s = this.settings;
      const eng = this.engine;
      const commit = () => { eng.saveSettings(); this.applySettings(); };
      const slider = (id, label, min, max, step, get, set, fmt) => {
        const out = h('output', { for: id }, fmt(get()));
        const input = h('input', { id, type: 'range', min, max, step, value: get() });
        input.addEventListener('input', () => { set(parseFloat(input.value)); out.textContent = fmt(get()); commit(); });
        return h('div.set-row.has-range', h('label', { for: id }, label), input, out);
      };
      const toggle = (id, label, key, hint) => {
        const b = h('button.toggle', { id, type: 'button', role: 'switch', 'aria-checked': String(!!s[key]) }, h('span.knob'));
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          s[key] = !s[key];
          b.setAttribute('aria-checked', String(!!s[key]));
          this.audio.ui('select');
          commit();
        });
        return h('div.set-row', h('label', { for: id }, label, hint && h('small', hint)), b);
      };
      const preview = h('div.set-preview');
      let previewTyper = null;
      const runPreview = () => {
        if (previewTyper) previewTyper.destroy();
        previewTyper = new VN.Typer(preview, 'The mulberry trees were bare, and the whole valley waited for word from Japan.', { cps: s.textSpeed });
      };
      const speedFmt = (v) => (v >= 200 ? 'Instant' : `${Math.round(v)} cps`);
      const textSpeed = slider('set-speed', 'Text speed', 10, 200, 5, () => s.textSpeed, (v) => { s.textSpeed = v; }, speedFmt);
      textSpeed.querySelector('input').addEventListener('change', runPreview);

      const fsBtn = this.button(document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen', () => { toggleFullscreen(); setTimeout(() => this.renderSettings(body), 250); });
      const resetBtn = this.button('Delete all saves & progress', async () => {
        if (await this.confirm('Delete every save, every ending you found, and all settings? This can\'t be undone.', { yes: 'Delete everything' })) {
          eng.wipeAll();
          this.toast('All data deleted');
          this.renderSettings(body);
        }
      }, '.danger');

      body.replaceChildren(
        h('div.settings',
          h('section.set-group',
            h('h3', 'Text'),
            textSpeed,
            preview,
            slider('set-auto', 'Auto-advance delay', 0.5, 6, 0.25, () => s.autoDelay, (v) => { s.autoDelay = v; }, (v) => `${v.toFixed(2)} s`),
            toggle('set-unseen', 'Skip unread text', 'skipUnseen', 'Off: skipping stops at lines you haven\'t read'),
            toggle('set-afterchoice', 'Keep skipping after choices', 'skipAfterChoices')),
          h('section.set-group',
            h('h3', 'Sound'),
            slider('set-music', 'Music volume', 0, 1, 0.05, () => s.musicVolume, (v) => { s.musicVolume = v; this.audio.refreshVolumes(); }, (v) => `${Math.round(v * 100)}%`),
            slider('set-sfx', 'Sound volume', 0, 1, 0.05, () => s.sfxVolume, (v) => { s.sfxVolume = v; }, (v) => `${Math.round(v * 100)}%`),
            toggle('set-ui', 'Menu sounds', 'uiSounds'),
            toggle('set-blips', 'Text blips', 'textBlips', 'Soft ticks while text types')),
          h('section.set-group',
            h('h3', 'Display'),
            toggle('set-focus', 'Highlight the speaker', 'focus'),
            toggle('set-motion', 'Reduce motion & flashes', 'reduceMotion'),
            h('div.set-row', h('label', 'Screen'), fsBtn)),
          h('section.set-group',
            h('h3', 'Data'),
            h('p.muted', VN.store.persistentAvailable ? 'Saves live in this browser only.' : 'This browser is blocking storage, so saves last until you close the page.'),
            h('div.set-row', resetBtn))));
      runPreview();
    }
  }

  function toggleFullscreen() {
    try {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else document.documentElement.requestFullscreen().catch(() => {});
    } catch (e) { /* not supported here */ }
  }

  VN.UI = UI;
  VN.SLOT_PAGES = SLOT_PAGES;
  VN.toggleFullscreen = toggleFullscreen;
})();
