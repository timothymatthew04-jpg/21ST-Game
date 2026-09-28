/*
 * main.js — boots the game: compiles the story, builds the systems, wires up
 * keyboard / mouse / touch input and keeps the 16:9 stage fitted to the window.
 */
(function () {
  'use strict';
  const VN = globalThis.VN;
  const W = 1280, H = 720;

  function slug(s) {
    return (s || 'game').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'game';
  }

  function fitStage(stageEl) {
    const fit = () => {
      const vv = window.visualViewport;
      const vw = vv ? vv.width : window.innerWidth;
      const vh = vv ? vv.height : window.innerHeight;
      const k = Math.min(vw / W, vh / H);
      stageEl.style.setProperty('--k', String(k));
    };
    window.addEventListener('resize', fit);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', fit);
    fit();
  }

  function buildDebugPanel(stageEl, engine) {
    const panel = VN.h('div.debug', { hidden: true });
    stageEl.append(panel);
    const render = () => {
      if (panel.hidden) return;
      const st = engine.state;
      const rows = Object.entries(st.vars).sort(([a], [b]) => a.localeCompare(b));
      const pRows = Object.entries(engine.persistent.vars);
      panel.replaceChildren(
        VN.h('b', 'Variables'),
        VN.h('div.debug-sub', `label: ${st.label} · line ${engine.program[st.pc] ? engine.program[st.pc].line : '-'}`),
        ...rows.map(([k, v]) => VN.h('div.debug-row', VN.h('span', k), VN.h('span', String(v)))),
        pRows.length ? VN.h('b', 'Persistent') : null,
        ...pRows.map(([k, v]) => VN.h('div.debug-row', VN.h('span', k), VN.h('span', String(v)))),
        VN.h('div.debug-sub', '` to close'));
    };
    engine.onStep = render;
    return {
      toggle() { panel.hidden = !panel.hidden; render(); },
      render,
    };
  }

  async function boot() {
    const stageEl = document.getElementById('stage');
    fitStage(stageEl);

    const story = VN.parse(globalThis.STORY_SCRIPT || '');
    VN.story = story;
    VN.store.setPrefix(`vn.${slug(story.title)}.`);
    document.title = story.title;
    for (const [name, path] of Object.entries(story.backgrounds)) VN.assets.override('bg', name, path);

    const settings = Object.assign({}, VN.DEFAULT_SETTINGS, VN.store.get('settings', {}));
    const audio = new VN.AudioSystem(settings);
    const ui = new VN.UI(stageEl, story, settings, audio);
    const stage = new VN.Stage(ui.sceneRoot, story, settings);
    const poem = new VN.PoemGame(ui, story, audio);
    const engine = new VN.Engine({ story, ui, stage, audio, poem, settings });
    ui.bind(engine);
    VN.engine = engine;
    const debug = buildDebugPanel(stageEl, engine);

    if (story.errors.length) {
      ui.showErrors(`${story.errors.length} problem${story.errors.length > 1 ? 's' : ''} in the story script`, story.errors);
      return;
    }
    story.warnings.forEach((w) => console.warn(`Line ${w.line}: ${w.msg}`));

    // ---- input -------------------------------------------------------------------------------
    const game = ui.gameLayer;
    game.addEventListener('click', (e) => {
      if (e.button !== 0) return;
      audio.unlock();
      engine.userAdvance();
    });
    game.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (!engine.inGame) return;
      if (ui.uiHidden) ui.setHidden(false);
      else ui.openMenu('save');
    });
    game.addEventListener('auxclick', (e) => {
      if (e.button === 1 && engine.inGame) { e.preventDefault(); ui.setHidden(!ui.uiHidden); }
    });
    let lastWheel = 0;
    game.addEventListener('wheel', (e) => {
      e.preventDefault();
      const now = performance.now();
      if (now - lastWheel < 200 || Math.abs(e.deltaY) < 4) return;
      lastWheel = now;
      if (e.deltaY < 0) engine.rollback(); else engine.userAdvance();
    }, { passive: false });

    let lastKeyAdvance = 0;
    document.addEventListener('keydown', (e) => {
      audio.unlock();
      if (e.key === 'Control' && !ui.modalOpen && engine.inGame) { engine.setSkipHeld(true); return; }
      if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'text') {
        // Let the player type; only Escape means something here.
        if (e.key === 'Escape' && ui.handleKey(e)) e.preventDefault();
        return;
      }
      if (e.key === '`') { debug.toggle(); return; }
      if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey) { VN.toggleFullscreen(); return; }
      if (ui.handleKey(e)) { e.preventDefault(); return; }
      // Menus and dialogs: Enter / Space press the focused button natively.
      if (ui.modalOpen) return;
      if (!engine.inGame || e.ctrlKey || e.metaKey || e.altKey) return;
      if (ui.choice && ui.choice.key(e)) { e.preventDefault(); return; }
      switch (e.key) {
        case ' ':
        case 'Enter':
        case 'ArrowRight':
        case 'PageDown': {
          e.preventDefault();
          const now = performance.now();
          if (e.repeat && now - lastKeyAdvance < 90) return;
          lastKeyAdvance = now;
          engine.userAdvance();
          break;
        }
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          engine.rollback();
          break;
        case 'Tab': e.preventDefault(); engine.toggleSkip(); break;
        case 'a': case 'A': engine.setAuto(!engine.auto); ui.toast(engine.auto ? 'Auto on' : 'Auto off'); break;
        case 'h': case 'H': ui.setHidden(!ui.uiHidden); break;
        case 'l': case 'L': ui.openMenu('history'); break;
        case 's': case 'S': ui.openMenu('save'); break;
        case 'q': case 'Q': engine.quickSave(); break;
        case 'Escape': ui.uiHidden ? ui.setHidden(false) : ui.openMenu('save'); break;
      }
    });
    document.addEventListener('keyup', (e) => { if (e.key === 'Control') engine.setSkipHeld(false); });
    window.addEventListener('blur', () => engine.setSkipHeld(false));
    document.addEventListener('pointerdown', () => audio.unlock(), { once: true });

    // ---- start -----------------------------------------------------------------------------
    await ui.splash();
    if (story.warning && !engine.persistent.warned) {
      await ui.warning(story.warning);
      engine.persistent.warned = true;
      VN.store.set('persistent', engine.persistent);
    }
    const jump = decodeURIComponent((location.hash || '').slice(1));
    if (jump && jump in story.labels) engine.newGame(jump);
    else engine.returnToTitle();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
