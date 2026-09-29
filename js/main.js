/*
 * main.js — boots the game: compiles the story, builds the systems, wires up
 * keyboard / mouse / touch input and keeps the stage fitted to the window.
 *
 * The stage is always 720 units tall; its width follows the window's shape
 * (from 16:10 up to 21:9), so it fills the screen with no bars. Only unusual
 * shapes (a phone held upright, say) leave a margin, and that margin shows a
 * soft, blurred copy of the picture instead of flat bars.
 */
(function () {
  'use strict';
  const VN = globalThis.VN;
  const H = 720;
  const MIN_W = 1152; // 16:10
  const MAX_W = 1720; // 21:9 (2560×1080 and 3440×1440 monitors)

  function slug(s) {
    return (s || 'game').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'game';
  }

  function fitStage(stageEl) {
    const viewport = stageEl.parentElement;
    const ambient = VN.h('div.ambient', { 'aria-hidden': 'true' });
    viewport.prepend(ambient);
    VN.setAmbient = (url) => { ambient.style.backgroundImage = url ? `url("${url}")` : 'none'; };
    const fit = () => {
      const vv = window.visualViewport;
      const vw = vv ? vv.width : window.innerWidth;
      const vh = vv ? vv.height : window.innerHeight;
      // fractional widths are fine, and keep the stage edges exactly on the window edges
      const w = Math.min(MAX_W, Math.max(MIN_W, (H * vw) / vh));
      const k = Math.min(vw / w, vh / H);
      stageEl.style.setProperty('--w', `${w}px`);
      stageEl.style.setProperty('--k', String(k));
      // on small screens the stage is scaled down a lot: enlarge the small buttons so they stay tappable
      stageEl.classList.toggle('compact', k < 0.7);
      viewport.classList.toggle('letterboxed', Math.abs(vw - w * k) > 1.5 || Math.abs(vh - H * k) > 1.5);
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
    stageEl.classList.add(`art-${story.artStyle}`);
    for (const [name, path] of Object.entries(story.backgrounds)) VN.assets.override('bg', name, path);
    // Start loading the cover art now so it's ready when the title screen appears.
    if (story.titleBackground) VN.assets.resolve('bg', story.titleBackground);
    // Text-box portraits are small; fetch them all up front so they never pop in late.
    for (const ch of Object.values(story.characters)) if (ch.face) VN.assets.resolve('face', ch.face);

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
    // The painted scenes follow the mouse a little, near layers more than far ones.
    let parallax = 0;
    game.addEventListener('pointermove', (e) => {
      if (parallax || e.pointerType === 'touch') return;
      parallax = requestAnimationFrame(() => {
        parallax = 0;
        const r = stageEl.getBoundingClientRect();
        stageEl.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
        stageEl.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
      });
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
    // "Before you begin" greets the player every time the game starts
    if (story.warning) await ui.warning(story.warning);
    const jump = decodeURIComponent((location.hash || '').slice(1));
    if (jump && jump in story.labels) engine.newGame(jump);
    else engine.returnToTitle();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
