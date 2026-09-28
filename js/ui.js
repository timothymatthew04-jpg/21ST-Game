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
      this.crt = h('div.crt');
      stageEl.append(this.gameLayer, this.overlayRoot, this.toastEl, this.crt);

      this.textbox = new VN.Textbox(this.uiLayer, settings, audio);
      this.uiLayer.append(this.choicesEl, this.quickmenu, this.indicators);
      this.choice = null;
      this.applySettings();
    }

    bind(engine) { this.engine = engine; }

    applySettings() {
      this.crt.classList.toggle('on', !!this.settings.crt);
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
      return h('div.quickmenu', { onclick: (e) => e.stopPropagation() },
        btn('Back', 'Go back one line (mouse wheel up)', () => this.engine.rollback()),
        btn('History', 'Dialogue history (L)', () => this.openMenu('history')),
        this.qmSkip,
        this.qmAuto,
        btn('Save', 'Save (S)', () => this.openMenu('save')),
        btn('Load', 'Load', () => this.openMenu('load')),
        btn('Q.Save', 'Quick save (Q)', () => this.engine.quickSave()),
        btn('Q.Load', 'Quick load', () => this.engine.quickLoad()),
        btn('Settings', 'Settings', () => this.openMenu('settings')),
        btn('Hide', 'Hide the text box (H)', () => this.setHidden(true)));
    }

    setModes({ skip, auto }) {
      this.qmSkip.classList.toggle('active', !!skip);
      this.qmAuto.classList.toggle('active', !!auto);
      this.indicators.replaceChildren(
        ...(skip ? [h('span.ind.ind-skip', 'SKIP ▸▸')] : []),
        ...(auto ? [h('span.ind.ind-auto', 'AUTO ▸')] : []));
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
      setTimeout(() => entry.el.remove(), 220);
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
          this.story.emblem && h('div.splash-kanji', { 'aria-hidden': 'true' }, this.story.emblem),
          h('div.splash-title', this.story.title),
          h('div.splash-press', 'PRESS START'),
          h('div.splash-hint', 'click · tap · any key'));
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

      const stars = h('div.title-stars', { 'aria-hidden': 'true' });
      for (let i = 0; i < 48; i++) {
        stars.append(h('i', { style: { left: `${Math.random() * 100}%`, top: `${Math.random() * 62}%`, animationDelay: `${(Math.random() * 4).toFixed(2)}s`, opacity: String(0.3 + Math.random() * 0.7) } }));
      }
      const bg = h('div.title-bg');
      if (this.story.titleBackground) bg.append(eng.stage.makeBg(this.story.titleBackground));
      const threads = h('div.title-threads', { 'aria-hidden': 'true' }, h('i'), h('i'), h('i'));
      const el = h('div.overlay.title-screen',
        bg, stars, threads,
        this.story.emblem && h('div.title-kanji', { 'aria-hidden': 'true' }, this.story.emblem),
        h('div.title-block',
          h('h1.title-logo', { 'data-text': this.story.title }, this.story.title),
          this.story.subtitle && h('div.title-sub', this.story.subtitle)),
        h('nav.title-menu', items),
        h('div.title-foot',
          h('span', this.story.credits || ''),
          h('span', endingsFound ? `${endingsFound} of ${this.story.endings.length} endings found` : '↑ ↓ to choose · Enter to confirm')));
      if (eng.persistent.vars && eng.persistent.vars.title_variant) el.classList.add(`variant-${eng.persistent.vars.title_variant}`);
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
          setTimeout(() => {
            this.choicesEl.replaceChildren();
            this.choicesEl.classList.remove('on');
            this.choice = null;
            resolve(i);
          }, 380);
        };
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
    chapterCard(title, subtitle, { fast } = {}) {
      return new Promise((resolve) => {
        const letters = h('div.card-title');
        [...title].forEach((c, i) => letters.append(h('span', { style: { animationDelay: `${i * 45}ms` } }, c === ' ' ? ' ' : c)));
        const el = h('div.overlay.card', letters, h('div.card-rule'), subtitle && h('div.card-sub', subtitle));
        let entry;
        const finish = () => {
          if (!entry) return;
          const e = entry;
          entry = null;
          this.cardEntry = null;
          this.cardFinish = null;
          clearTimeout(timer);
          this.close(e);
          resolve();
        };
        el.addEventListener('click', finish);
        entry = this.open(el, { onKey: (e) => { if ([' ', 'Enter', 'Escape'].includes(e.key)) finish(); return true; }, onBack: finish, focus: false });
        this.cardEntry = entry;
        this.cardFinish = finish;
        const timer = setTimeout(finish, fast ? 700 : 3200);
      });
    }

    endingScreen(ending, found, total) {
      return new Promise((resolve) => {
        let entry;
        const btn = this.button('Return to title', () => { this.close(entry); resolve(); }, '.primary');
        btn.setAttribute('autofocus', '');
        const el = h(`div.overlay.ending.kind-${ending.kind || 'neutral'}`,
          h('div.ending-eyebrow', 'ENDING'),
          h('div.ending-title', ending.title),
          h('div.ending-rule'),
          h('div.ending-count', `${found} of ${total} endings found`),
          h('div.row', btn));
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
            toggle('set-blips', 'Text blips', 'textBlips', 'Retro beeps while text types')),
          h('section.set-group',
            h('h3', 'Display'),
            toggle('set-focus', 'Highlight the speaker', 'focus'),
            toggle('set-crt', 'CRT scanlines', 'crt'),
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
