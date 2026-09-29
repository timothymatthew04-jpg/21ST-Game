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

  // ---- choice tones -----------------------------------------------------------------------------
  // Each tone has an emblem, a pace for its words and a way of moving (see css "choice tones").
  const svg = (body) => `<svg viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
  const TONES = {
    tender: { cps: 26, icon: svg('<g fill="currentColor">' + [0, 72, 144, 216, 288].map((a) => `<ellipse cx="12" cy="6.5" rx="3.2" ry="4.6" transform="rotate(${a} 12 12)"/>`).join('') + '</g><circle cx="12" cy="12" r="2" fill="#fff6c8"/>') },
    warm: { cps: 38, icon: svg('<circle cx="12" cy="12" r="4.5" fill="currentColor"/>' + [0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="11.2" y="1.5" width="1.6" height="4" rx="0.8" fill="currentColor" transform="rotate(${a} 12 12)"/>`).join('')) },
    honest: { cps: 40, icon: svg('<path d="M12 2.5c3.6 5 6 8.3 6 11.3a6 6 0 0 1-12 0c0-3 2.4-6.3 6-11.3z" fill="currentColor"/><path d="M9.2 14.5a3 3 0 0 0 2.6 2.8" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round"/>') },
    cold: { cps: 70, icon: svg('<g stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none">' + [0, 60, 120].map((a) => `<g transform="rotate(${a} 12 12)"><path d="M12 2v20"/><path d="M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5"/></g>`).join('') + '</g>') },
    duty: { cps: 55, icon: svg('<circle cx="12" cy="12" r="8.5" fill="currentColor"/><rect x="9.5" y="9.5" width="5" height="5" fill="#241407"/><circle cx="12" cy="12" r="6.6" fill="none" stroke="#241407" stroke-width="0.8" opacity="0.5"/>') },
    obsession: { cps: 34, icon: svg('<path d="M12 20.5C6 16 3 12.5 3 9a4.5 4.5 0 0 1 9-1.2A4.5 4.5 0 0 1 21 9c0 3.5-3 7-9 11.5z" fill="currentColor"/><path d="M3 21c4-3 6-1 9-4s5-3 9-1" stroke="currentColor" stroke-width="1.2" fill="none"/>') },
    danger: { cps: 60, icon: svg('<path d="M12 2c1 4 5 5.5 5 11a5 5 0 0 1-10 0c0-2.4 1.2-3.8 2.3-5 .2 1.7.9 2.6 1.8 3C11 8.5 11.2 5.5 12 2z" fill="currentColor"/>') },
    curious: { cps: 36, icon: svg('<path d="M15.5 3.2A9 9 0 1 0 20.8 15 7 7 0 0 1 15.5 3.2z" fill="currentColor"/><circle cx="18" cy="5" r="1" fill="currentColor"/><circle cx="21" cy="9" r="0.7" fill="currentColor"/>') },
    quiet: { cps: 18, icon: svg('<g fill="currentColor"><circle cx="6" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8" opacity="0.7"/><circle cx="18" cy="12" r="1.8" opacity="0.4"/></g>') },
    neutral: { cps: 44, icon: svg('<path d="M12 3 21 12 12 21 3 12z" fill="currentColor"/>') },
  };

  /** The words of a choice arriving at the pace (and with the movement) of its tone. */
  function revealWords(el, text, tone, reduce) {
    const cps = (TONES[tone] || TONES.neutral).cps;
    el.replaceChildren();
    if (reduce) { el.textContent = text; return; }
    [...text].forEach((ch, i) => {
      el.append(h('span.cw', { style: { animationDelay: `${Math.round((i * 1000) / cps)}ms`, '--i': String(i % 7) } }, ch === ' ' ? ' ' : ch));
    });
  }

  /** A keepsake's little picture (assets/items/<id>.png), or a knot of thread until there is one. */
  function itemIcon(id) {
    const el = h('i.item-icon', '✦');
    VN.assets.resolve('ui', `items/${id}`).then((url) => { if (url) { el.textContent = ''; el.style.backgroundImage = `url("${url}")`; } });
    return el;
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

  /** Gold sparks: a few always drifting up, and a burst on demand (or petals falling, or ash). */
  function sparkField(cv, kind = 'sparks', tint = null) {
    if (kind === 'tinted' && !tint) kind = 'sparks';
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
    const stops = {
      sparks: ['rgba(255,250,225,1)', 'rgba(255,214,130,0.9)', 'rgba(255,140,40,0.25)', 'rgba(255,120,30,0)'],
      petals: ['rgba(255,244,248,1)', 'rgba(255,176,204,0.9)', 'rgba(240,110,160,0.25)', 'rgba(240,110,160,0)'],
      ash: ['rgba(255,190,160,0.9)', 'rgba(200,60,50,0.7)', 'rgba(90,20,20,0.3)', 'rgba(60,10,10,0)'],
      // sparks in a character's own colour ("r,g,b")
      tinted: ['rgba(255,255,250,1)', `rgba(${tint},0.9)`, `rgba(${tint},0.28)`, `rgba(${tint},0)`],
    }[kind];
    g.addColorStop(0, stops[0]);
    g.addColorStop(0.25, stops[1]);
    g.addColorStop(0.6, stops[2]);
    g.addColorStop(1, stops[3]);
    d.fillStyle = g;
    if (kind === 'petals') { d.translate(16, 16); d.scale(1, 0.55); d.translate(-16, -16); }
    d.fillRect(0, 0, 32, 32);
    const fall = kind !== 'sparks'; // petals and ash drift down instead of rising
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
          if (fall) add(Math.random() * W * 1.1 - W * 0.05, -10 * unit, (kind === 'petals' ? 15 : -8 + Math.random() * 16) * unit, (25 + Math.random() * 45) * unit, 4 + Math.random() * 3, (kind === 'petals' ? 5 + Math.random() * 6 : 3 + Math.random() * 5) * unit);
          else add(Math.random() * W, H * (0.55 + Math.random() * 0.5), (Math.random() - 0.5) * 20 * unit, -(30 + Math.random() * 60) * unit, 2.5 + Math.random() * 2.5, (3 + Math.random() * 6) * unit);
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
          p.vy = p.vy * drag - (p.burst ? 40 : fall ? -2 : 6) * unit * dt;
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

  /** "#e0503c" -> "224,80,60" */
  function hexRgb(hex) {
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return '244,197,66';
    let x = m[1];
    if (x.length === 3) x = x.split('').map((c) => c + c).join('');
    return [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16)).join(',');
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
      this.noticeEl = h('div.item-notices', { 'aria-live': 'polite' });
      this.uiLayer.prepend(this.veil, this.pulseEl);
      this.uiLayer.append(this.choicesEl, this.quickmenu, this.indicators, this.whisperEl, this.noticeEl);
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

    /** The road the player is on colours the frame of the story a little (and the chapter cards a lot). */
    setRoute(route) {
      if (route) this.gameLayer.dataset.route = route; else delete this.gameLayer.dataset.route;
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
      if (this.story.splash === 'strand' && VN.StrandSplash) return this.strandSplash();
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

    /** Press start: a glowing thread of silk; on a click it branches into light and the menu opens. */
    strandSplash() {
      return new Promise((resolve) => {
        const cv = h('canvas.strand-canvas');
        const el = h('div.overlay.splash.strand-splash',
          cv,
          h('div.strand-press', 'Click to begin'),
          h('div.strand-hint', 'or press any key'),
          h('div.strand-flash'));
        let entry;
        let fx;
        const go = () => {
          if (!entry) return;
          const e = entry;
          entry = null;
          this.audio.unlock();
          setTimeout(() => {
            this.audio.fx('whoosh', { volume: 0.9 });
            this.audio.fx('sparkle', { volume: 0.8, delay: 0.15 });
            this.audio.fx('chime', { volume: 0.6, delay: 0.35 });
          }, 60);
          el.classList.add('bursting');
          if (fx) fx.burst();
          // the light swells until the whole screen is bright; the menu is built underneath,
          // and then the light slowly draws back to reveal it
          const reduce = this.settings.reduceMotion;
          setTimeout(() => {
            el.style.zIndex = '50';
            el.classList.add('bloomed');
            resolve();
            setTimeout(() => {
              e.removeAfter = reduce ? 400 : 2000;
              this.close(e);
              setTimeout(() => fx && fx.stop(), e.removeAfter);
            }, reduce ? 50 : 260);
          }, reduce ? 250 : 1050);
        };
        el.addEventListener('click', go);
        entry = this.open(el, { onKey: (ev) => { if (!ev.repeat && ev.key !== 'Tab') go(); return true; }, focus: false });
        requestAnimationFrame(() => {
          fx = new VN.StrandSplash(cv, { reduce: !!this.settings.reduceMotion });
          fx.start();
        });
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
    /**
     * Show the options. Each has a tone (tender, cold, obsession...) that decides its glow,
     * its emblem and how its words arrive; hovering one previews that feeling in the text
     * box. With a time, a silk thread burns down from both ends; when it is gone, Hervé
     * hesitates and the promise resolves to -1.
     */
    showChoices(options, { time = 0 } = {}) {
      this.cancelChoices();
      const list = options.map((o) => (typeof o === 'string' ? { text: o, tone: 'neutral' } : o));
      return new Promise((resolve, reject) => {
        const tb = this.textbox.box;
        const preview = (tone) => { if (tone) tb.dataset.tone = tone; else delete tb.dataset.tone; };
        const buttons = list.map((o, i) => {
          const tone = TONES[o.tone] ? o.tone : 'neutral';
          const words = h('span.choice-text');
          const chips = [];
          if (o.cost) chips.push(h(`span.choice-chip.cost${o.cost.ok ? '' : '.short'}`, h('i', o.cost.kind === 'francs' ? '◎' : '✦'), o.cost.kind === 'francs' ? `−${o.cost.n} francs` : `Give up: ${o.cost.label}`));
          if (o.needs) chips.push(h(`span.choice-chip.needs${o.needs.ok ? '' : '.short'}`, h('i', '✦'), o.needs.ok ? `With ${o.needs.label}` : `Needs ${o.needs.label}`));
          if (o.gain) chips.push(h('span.choice-chip.gain', h('i', '+'), o.gain.kind === 'francs' ? `${o.gain.n} francs` : o.gain.label));
          const b = h(`button.choice.tone-${tone}${o.locked ? '.locked' : ''}`, { type: 'button', style: { animationDelay: `${i * 70}ms` }, 'aria-disabled': o.locked ? 'true' : null },
            h('span.choice-glow'),
            h('span.choice-emblem', { html: TONES[tone].icon }),
            h('span.choice-key', String(i + 1)),
            h('span.choice-body', words, chips.length ? h('span.choice-chips', chips) : null));
          const plain = VN.stripTags(o.text);
          b._reveal = () => revealWords(words, plain, tone, this.settings.reduceMotion);
          b._reveal();
          b.addEventListener('click', (e) => { e.stopPropagation(); pick(i); });
          b.addEventListener('mouseenter', () => { b.focus({ preventScroll: true }); });
          b.addEventListener('focus', () => {
            if (done) return;
            this.audio.ui('hover');
            preview(tone);
            if (b !== lastFocus) { lastFocus = b; b._reveal(); }
          });
          return b;
        });
        let done = false;
        let lastFocus = null;
        let raf = 0;
        const finish = (i) => {
          cancelAnimationFrame(raf);
          preview(null);
          this.veil.classList.remove('urgent');
          this.choicesEl.replaceChildren();
          this.choicesEl.classList.remove('on');
          this.choice = null;
          resolve(i);
        };
        const pick = (i) => {
          if (done || list[i].locked) { if (!done && list[i].locked) { this.audio.ui('error'); buttons[i].animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }], { duration: 260 }); } return; }
          done = true;
          this.audio.ui('select');
          buttons.forEach((b, j) => b.classList.add(j === i ? 'picked' : 'dropped'));
          timer.classList.add('stopped');
          // the chosen line lingers a moment, so the choice is felt before the story moves on
          const hold = this.engine && this.engine.isSkipping() ? 200 : 620;
          setTimeout(() => finish(i), hold);
        };
        const hesitate = () => {
          if (done) return;
          done = true;
          this.choicesEl.classList.add('hesitating');
          this.audio.fx('breath', { volume: 0.8 });
          this.whisper('You hesitated, and the moment passed.', '#b9ab93');
          setTimeout(() => { this.choicesEl.classList.remove('hesitating'); finish(-1); }, this.settings.reduceMotion ? 300 : 1100);
        };
        // the timer: a silk thread burning down from both ends
        const timer = h('div.choice-timer', { 'aria-hidden': 'true' }, h('span.ct-thread'), h('span.ct-ember.l'), h('span.ct-ember.r'));
        if (time > 0) {
          let left = time;
          let last = performance.now();
          const beats = [0.3, 0.12];
          const tick = (now) => {
            const dt = Math.min(0.1, (now - last) / 1000);
            last = now;
            if (done) return;
            // the clock stops while a menu is open or the page is hidden
            if (!this.modalOpen && !document.hidden) left -= dt;
            const p = Math.max(0, left / time);
            timer.style.setProperty('--p', p.toFixed(4));
            if (beats.length && p <= beats[0]) {
              beats.shift();
              this.audio.fx('heartbeat', { volume: 0.45 });
              this.veil.classList.add('urgent');
              timer.classList.add('urgent');
            }
            if (left <= 0) { hesitate(); return; }
            raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        } else timer.classList.add('none');
        this.pulseEl.classList.remove('on');
        this.veil.classList.add('on');
        clearTimeout(this.unduckTimer);
        this.audio.music.duck(0.6, 0.8);
        this.choicesEl.replaceChildren(timer, ...buttons);
        this.choicesEl.classList.add('on');
        this.choice = {
          buttons,
          pick,
          reject,
          cancel: () => { done = true; cancelAnimationFrame(raf); preview(null); this.veil.classList.remove('urgent'); },
          key: (e) => {
            const n = parseInt(e.key, 10);
            if (n >= 1 && n <= buttons.length) { pick(n - 1); return true; }
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              const i = buttons.indexOf(document.activeElement);
              const next = e.key === 'ArrowDown' ? (i + 1) % buttons.length : (i - 1 + buttons.length) % buttons.length;
              buttons[i < 0 ? 0 : next].focus({ preventScroll: true });
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

    /** A keepsake or money changing hands: a small card slides in at the top right. */
    itemNotice(item, kind) {
      const money = item.id === 'francs';
      const card = h(`div.item-notice.${kind}${money ? '.money' : ''}`,
        h('span.in-icon', itemIcon(money ? 'francs' : item.id)),
        h('span.in-text', h('small', kind === 'gain' ? (money ? 'Received' : 'Keepsake') : money ? 'Spent' : 'Parted with'), h('b', item.name)));
      this.noticeEl.append(card);
      this.audio.fx(kind === 'gain' ? 'chime' : 'paper', { volume: 0.6 });
      setTimeout(() => card.classList.add('out'), 3200);
      setTimeout(() => card.remove(), 3900);
    }

    cancelChoices() {
      if (!this.choice) return;
      if (this.choice.cancel) this.choice.cancel();
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
      if (this.cardEntry) {
        if (this.cardEntry.cleanup) this.cardEntry.cleanup();
        this.close(this.cardEntry);
        this.cardEntry = null;
      }
    }

    // ---- chapter card & ending -----------------------------------------------------------------
    /**
     * The chapter card, in the style of the title menu: an ink wash, the chapter number
     * as big brushed kanji, the name glowing over a vermilion brush stroke, and a red
     * seal stamped at the end in a burst of gold sparks.
     */
    chapterCard(title, subtitle, { fast, seal, kanji, mood = 'torn', turned = null } = {}) {
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
        // where the heart has turned since the last chapter, said once, softly
        const TURNS = {
          devoted: 'Your heart is turning toward home.',
          torn: 'You stand between two shores.',
          lost: 'Something in you is drifting east.',
        };
        const el = h(`div.overlay.card.jcard.mood-${mood}${fast ? '.fast' : ''}${reduce ? '.still' : ''}`,
          h('div.jc-wash'), inkBlot(), h('div.jc-rays'), h('div.jc-grain'), sparks,
          h('div.jc-group', main, kanjiCol),
          turned && TURNS[mood] ? h('div.jc-turn', TURNS[mood]) : null,
          h('div.jc-crack'),
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
        if (mood === 'lost') {
          this.audio.fx('heartbeat', { volume: 0.7, delay: 0.9 });
          this.audio.fx('gong', { volume: 0.45, delay: 1.95 });
        } else if (mood === 'devoted') {
          this.audio.fx('chime', { volume: 0.7, delay: 2.0 });
        } else this.audio.fx('sparkle', { volume: 0.9, delay: 2.0 });
        if (reduce) return;
        // gold sparks drifting up (petals on a kind road, ash on a dark one), and a burst when the seal lands
        const field = sparkField(sparks, mood === 'devoted' ? 'petals' : mood === 'lost' ? 'ash' : 'sparks');
        const loop = (t) => { field.step(t); raf = requestAnimationFrame(loop); };
        raf = requestAnimationFrame(loop);
        stampTimer = setTimeout(() => {
          const r = sealEl.getBoundingClientRect(), c = sparks.getBoundingClientRect();
          if (c.width) field.burst((r.left + r.width / 2 - c.left) / c.width, (r.top + r.height / 2 - c.top) / c.height);
        }, 1980);
      });
    }

    /**
     * The first time we meet someone: the scene dims, a band of their colour sweeps across with a
     * streak of light and silk threads, their portrait slides in, their name rises letter by letter
     * and a seal is stamped beside who they are. Click to move on; it also ends by itself.
     */
    introCard({ id, name, color = '#f4c542', subtitle = '', kanji = null, sound = null, face = null }) {
      return new Promise((resolve) => {
        const reduce = this.settings.reduceMotion;
        const rgb = hexRgb(color);
        const title = name || '???';
        const size = Math.round(Math.min(96, 1100 / (Math.max(title.length, 5) * 0.72)));
        const nameEl = h('div.in-name', { style: { fontSize: `${size}px` } },
          [...title].map((c, i) => h('span', { style: { animationDelay: `${620 + i * 55}ms` } }, c === ' ' ? '\u00a0' : c)));
        const threads = VN.h('div.in-threads', {
          html: `<svg viewBox="0 0 1280 300" preserveAspectRatio="none" aria-hidden="true">${[0, 1, 2, 3, 4].map((i) => {
            const y = 60 + i * 45, a = 18 + i * 7;
            return `<path d="M-40 ${y} C 260 ${y - a}, 520 ${y + a}, 820 ${y - a * 0.6} S 1180 ${y + a}, 1330 ${y}" style="animation-delay:${180 + i * 90}ms"/>`;
          }).join('')}</svg>`,
        });
        const sealEl = kanji ? h('div.in-seal', [...kanji].slice(0, 2).map((c) => h('span', c))) : null;
        const sparks = h('canvas.in-sparks');
        const el = h(`div.overlay.intro${reduce ? '.still' : ''}`, { style: { '--c': color, '--c-rgb': rgb } },
          h('div.in-dim'),
          h('div.in-band', h('div.in-band-fill'), threads, h('i.in-edge.top'), h('i.in-edge.bottom'), h('i.in-streak')),
          sparks,
          face ? h('div.in-portrait', h('div.in-portrait-img', { style: { backgroundImage: `url("${face}")` } }), h('i.in-portrait-shine')) : null,
          h('div.in-text',
            h('div.in-eyebrow', h('span.in-deai', '出会い'), h('span', 'A FIRST MEETING')),
            nameEl,
            h('div.in-rule'),
            h('div.in-sub', subtitle),
            sealEl),
          h('div.in-flash'));
        let entry;
        let raf = 0;
        const born = performance.now();
        const timers = [];
        const finish = () => {
          if (!entry) return;
          const e = entry;
          entry = null;
          this.cardEntry = null;
          timers.forEach(clearTimeout);
          e.removeAfter = reduce ? 300 : 650;
          this.close(e);
          setTimeout(() => cancelAnimationFrame(raf), e.removeAfter);
          resolve();
        };
        // a click that was meant for the previous line shouldn't skip the moment at once
        const tryFinish = () => { if (performance.now() - born > 550) finish(); };
        el.addEventListener('click', tryFinish);
        entry = this.open(el, { onKey: (e) => { if ([' ', 'Enter', 'Escape'].includes(e.key)) tryFinish(); return true; }, onBack: tryFinish, focus: false });
        entry.cleanup = () => { timers.forEach(clearTimeout); cancelAnimationFrame(raf); };
        this.cardEntry = entry;
        timers.push(setTimeout(finish, reduce ? 3200 : 4300));
        this.audio.fx('whoosh', { volume: 0.9 });
        this.audio.fx('sparkle', { volume: 0.6, delay: 0.35 });
        if (kanji) this.audio.fx('stamp', { volume: 0.8, delay: 1.75 });
        this.audio.fx(sound || 'chime', { volume: 0.75, delay: 1.8 });
        if (reduce) return;
        const field = sparkField(sparks, 'tinted', rgb);
        const loop = (t) => { field.step(t); raf = requestAnimationFrame(loop); };
        raf = requestAnimationFrame(loop);
        const burstAt = (node, when) => timers.push(setTimeout(() => {
          const r = node.getBoundingClientRect(), c = sparks.getBoundingClientRect();
          if (c.width && r.width) field.burst((r.left + r.width / 2 - c.left) / c.width, (r.top + r.height / 2 - c.top) / c.height);
        }, when));
        burstAt(nameEl, 380);
        if (sealEl) burstAt(sealEl, 1780);
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
        ? [['keepsakes', 'Keepsakes'], ['history', 'History'], ['save', 'Save'], ['load', 'Load'], ['settings', 'Settings'], ['endings', 'Endings'], ['help', 'Help']]
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
      const titles = { keepsakes: 'Keepsakes', history: 'History', save: 'Save', load: 'Load', settings: 'Settings', endings: 'Endings', help: 'Help' };
      this.menuTitle.textContent = titles[tab] || '';
      const body = this.menuBody;
      body.scrollTop = 0;
      if (tab === 'save' || tab === 'load') this.renderSlots(body, tab);
      else if (tab === 'settings') this.renderSettings(body);
      else if (tab === 'history') this.renderHistory(body);
      else if (tab === 'keepsakes') this.renderKeepsakes(body);
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

    /** What Hervé carries: his money, and the keepsakes he has gathered (or given away). */
    renderKeepsakes(body) {
      const eng = this.engine;
      const items = eng.state.items || [];
      body.replaceChildren(h('div.keepsakes',
        h('div.ks-purse', itemIcon('francs'), h('div.ks-text', h('b', `${eng.francs()} francs`), h('p', 'What is left of the money for the journey.'))),
        items.length
          ? h('div.ks-grid', items.map((id) => {
            const it = eng.itemInfo(id);
            return h('div.ks-card', itemIcon(id), h('div.ks-text', h('b', it.name), it.desc ? h('p', it.desc) : null));
          }))
          : h('p.muted', 'Nothing yet. Hervé travels light.')));
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
            slider('set-timer', 'Choice timer', 0, 2, 1, () => (s.choiceTimer == null ? 2 : s.choiceTimer), (v) => { s.choiceTimer = v; }, (v) => ['Off', 'Relaxed', 'Normal'][v]),
            toggle('set-unseen', 'Skip unread text', 'skipUnseen', 'Off: skipping stops at lines you haven\'t read'),
            toggle('set-afterchoice', 'Keep skipping after choices', 'skipAfterChoices')),
          h('section.set-group',
            h('h3', 'Sound'),
            slider('set-music', 'Music volume', 0, 1, 0.05, () => s.musicVolume, (v) => { s.musicVolume = v; this.audio.refreshVolumes(); }, (v) => `${Math.round(v * 100)}%`),
            slider('set-sfx', 'Sound volume', 0, 1, 0.05, () => s.sfxVolume, (v) => { s.sfxVolume = v; }, (v) => `${Math.round(v * 100)}%`),
            toggle('set-ui', 'Menu sounds', 'uiSounds'),
            toggle('set-blips', 'Text blips', 'textBlips', 'Soft ticks while narration types')),
          this.voiceSettings(slider, toggle, commit),
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

  /** Settings: the characters' muffled voices and the narrator. */
  UI.prototype.voiceSettings = function (slider, toggle, commit) {
    const s = this.settings;
    const nar = this.audio.narrator;
    const pick = h('select#set-voice', { 'aria-label': 'Narrator voice' });
    const fill = () => {
      const list = nar.english();
      const best = nar.pick();
      // "Microsoft Ryan Online (Natural) - English (United Kingdom)" -> "Ryan (Natural), en-GB"
      const short = (v) => `${v.name.replace(/^(Microsoft|Google|Apple)\s+/, '').replace(/\s*-\s*English.*$/, '').replace(/\bOnline\s*/, '')}`;
      pick.replaceChildren(h('option', { value: '' }, best ? `Automatic: ${short(best)}` : 'Automatic'),
        ...list.map((v) => h('option', { value: v.voiceURI }, `${short(v)}, ${v.lang}`)));
      pick.value = list.some((v) => v.voiceURI === s.narratorVoice) ? s.narratorVoice : '';
    };
    fill();
    if (nar.tts) { try { nar.tts.addEventListener('voiceschanged', fill); } catch (e) { /* older browsers */ } }
    pick.addEventListener('change', () => { s.narratorVoice = pick.value; commit(); nar.speak('The mulberry trees were bare, and the whole valley waited.'); });
    const hear = this.button('Listen', () => nar.speak('That year, the silkworms began to die.'));
    return h('section.set-group',
      h('h3', 'Voices'),
      slider('set-voicevol', 'Voice volume', 0, 1, 0.05, () => (s.voiceVolume == null ? 0.8 : s.voiceVolume), (v) => { s.voiceVolume = v; }, (v) => `${Math.round(v * 100)}%`),
      toggle('set-charvoices', 'Character voices', 'charVoices', 'A murmur of speech while someone talks'),
      toggle('set-narrator', 'Narrator voice', 'narrator', nar.tts ? 'Narration read aloud by your browser\'s voice' : 'This browser has no voices'),
      h('div.set-row.voice-row', h('label', { for: 'set-voice' }, 'Narrator', h('small', 'Voices depend on your browser and device')), pick, hear),
      slider('set-rate', 'Narrator speed', 0.7, 1.3, 0.05, () => s.narratorRate || 1, (v) => { s.narratorRate = v; }, (v) => `${Math.round(v * 100)}%`));
  };

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
