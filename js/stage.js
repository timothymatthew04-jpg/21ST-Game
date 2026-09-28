/*
 * stage.js — draws the scene: background, character sprites, CGs, tints and
 * screen effects. Rendering is driven entirely by the saved scene state, so a
 * save, a load or a rollback always redraws exactly what the player saw.
 *
 * Missing art never breaks anything: backgrounds, sprites and CGs fall back
 * to styled placeholders until real image files are dropped into assets/.
 */
(function () {
  'use strict';
  const VN = (globalThis.VN = globalThis.VN || {});
  const h = VN.h;

  const AUTO_SLOTS = { 1: [50], 2: [32, 68], 3: [20, 50, 80], 4: [14, 38, 62, 86] };

  // When a character has no picture for an expression, their neutral picture is
  // used and the pose reacts instead: a small lift for happy moods, a sink for sad ones.
  const MOODS = { smile: 'up', happy: 'up', soft: 'soft', sad: 'down', hurt: 'down', tired: 'down', worried: 'down', cold: 'cold', stern: 'cold', serious: 'cold', gaze: 'soft' };

  const aspects = new Map();
  /** A picture's width / height, so animation layers can line up with it. */
  function pictureAspect(url) {
    if (!aspects.has(url)) {
      aspects.set(url, new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img.naturalWidth / img.naturalHeight || 16 / 9);
        img.onerror = () => resolve(16 / 9);
        img.src = url;
      }));
    }
    return aspects.get(url);
  }

  /** Synchronous: {url, fallback}, null (no art at all) or undefined (not checked yet). */
  function spriteLookup(folder, expr) {
    const exact = VN.assets.lookup('sprite', `${folder}/${expr}`);
    if (exact) return { url: exact, fallback: false };
    if (expr === 'neutral' || exact === undefined) return exact;
    const base = VN.assets.lookup('sprite', `${folder}/neutral`);
    return base ? { url: base, fallback: true } : base;
  }

  async function resolveSprite(folder, expr) {
    const exact = await VN.assets.resolve('sprite', `${folder}/${expr}`);
    if (exact) return { url: exact, fallback: false };
    if (expr === 'neutral') return null;
    const base = await VN.assets.resolve('sprite', `${folder}/neutral`);
    return base ? { url: base, fallback: true } : null;
  }

  // Placeholder palettes chosen by keywords in the background's name.
  const BG_THEMES = [
    [/night|dark|midnight/, ['#0b0d26', '#27204a', '#5a4b8a']],
    [/war|fire|burn|ruin|smoke/, ['#160707', '#5a1a12', '#c2522a']],
    [/sea|ship|boat|ocean|harbor|harbour|coast|port/, ['#0c2436', '#1f5a78', '#8cc7d9']],
    [/snow|winter|frost/, ['#8ea3bf', '#cfdbe9', '#f6f8fc']],
    [/grave|cemetery|tomb/, ['#161b1e', '#3a4644', '#8a9a93']],
    [/garden|park|mulberry|field/, ['#1c3a2a', '#4f7d55', '#b9d59a']],
    [/aviary|bird/, ['#173230', '#3d6b5f', '#e1cf9f']],
    [/lake|river|water/, ['#10283a', '#2f6680', '#9fd1dc']],
    [/estate|japan|temple|shrine|village_jp|kyoto/, ['#2a1420', '#7a3240', '#e39a86']],
    [/mill|factory|office|warehouse|shop/, ['#22212b', '#4c4758', '#a79fb5']],
    [/road|journey|steppe|mountain|path|travel/, ['#2c2319', '#6e5536', '#d8b477']],
    [/paris|city|salon|house_blanche|brothel/, ['#1f1a2d', '#4f3f6e', '#c3a6e0']],
    [/home|house|room|bedroom|study|kitchen|parlor|parlour/, ['#2a1c1c', '#6b4a42', '#d9ab8e']],
    [/town|village|street|square|market/, ['#27253a', '#58506e', '#c9a79a']],
    [/sunset|evening|dusk/, ['#2b1640', '#8a3d62', '#ff9a6b']],
    [/morning|dawn|day/, ['#f2b89a', '#f7dcc0', '#fff4e3']],
  ];

  const TINTS = {
    night: ['#1a2366', 0.5],
    dusk: ['#5e2f86', 0.35],
    sunset: ['#ff7438', 0.3],
    dawn: ['#ffc08a', 0.22],
    memory: ['#d8b88a', 0.3],
    red: ['#9a1414', 0.35],
    cold: ['#3a6ea8', 0.3],
  };

  const FILTERS = {
    sepia: 'sepia(0.75) contrast(0.95) brightness(1.02)',
    grayscale: 'grayscale(1) contrast(1.05)',
    faded: 'saturate(0.45) contrast(0.9) brightness(1.06)',
    dream: 'saturate(1.25) brightness(1.08) blur(1.2px)',
    dark: 'brightness(0.6) saturate(0.8)',
  };

  const KAOMOJI = [
    [/happy|smile|glad|laugh|joy/, '^_^'],
    [/sad|cry|tear|grief/, 'T_T'],
    [/angry|mad|annoyed|stern/, '>_<'],
    [/surprise|shock|gasp/, 'O_O'],
    [/worr|nervous|anx|scared|afraid/, '°~°'],
    [/blush|shy|embarrass|flustered/, '^///^'],
    [/serious|cold|firm|grave/, '-_-'],
    [/think|curious|puzzl|confus/, '?_?'],
    [/tired|sleep|weary|ill|sick/, 'u_u'],
    [/soft|gentle|warm|tender|calm/, '·ᴗ·'],
  ];

  function hashHue(s) {
    let x = 0;
    for (const c of s) x = (x * 31 + c.charCodeAt(0)) % 360;
    return x;
  }

  function bgPalette(name) {
    for (const [re, pal] of BG_THEMES) if (re.test(name)) return pal;
    const hue = hashHue(name);
    return [`hsl(${hue} 35% 12%)`, `hsl(${hue} 30% 32%)`, `hsl(${(hue + 30) % 360} 45% 70%)`];
  }

  function kaomoji(expr) {
    if (!expr) return '·_·';
    for (const [re, face] of KAOMOJI) if (re.test(expr)) return face;
    return '·_·';
  }

  function prettyName(name) {
    return name.replace(/_/g, ' ');
  }

  class Stage {
    constructor(root, story, settings) {
      this.story = story;
      this.settings = settings;
      this.root = root;
      this.scene = h('div.scene');
      this.content = h('div.scene-content');
      this.bgStack = h('div.bg-stack');
      this.spriteLayer = h('div.sprite-layer');
      this.cgLayer = h('div.cg-layer');
      this.tintEl = h('div.tint');
      this.vignetteEl = h('div.vignette');
      this.content.append(this.bgStack, this.spriteLayer, this.cgLayer);
      this.scene.append(this.content, this.tintEl, this.vignetteEl);
      this.fader = h('div.fader');
      this.flashEl = h('div.flash');
      this.fxCanvas = h('canvas.fx-canvas', { width: 320, height: 180 });
      root.append(this.scene, this.fxCanvas, this.flashEl, this.fader);

      this.rendered = { bg: null, sprites: {}, cg: null };
      this.spriteEls = {};
      this.speaker = null;
      this.fxRaf = 0;
    }

    // ---- element builders (also used for save thumbnails) -------------------
    makeBg(name, live = true) {
      const el = h('div.bg');
      if (name === 'black' || name === 'white') {
        el.style.background = name === 'black' ? '#000' : '#fff';
        return el;
      }
      // painted scenes are built from moving layers (js/scenery.js)
      if (VN.Scenery && VN.Scenery.has(name)) {
        if (!live) {
          el.style.backgroundImage = `url("${VN.Scenery.flatUrl(name)}")`;
          el.style.imageRendering = 'auto';
          return el;
        }
        el.classList.add('bg-layered');
        const frame = VN.Scenery.build(el, name, { reduce: !!this.settings.reduceMotion });
        const specs = this.story.bgFx && this.story.bgFx[name];
        if (specs && specs.length && VN.SceneFx) new VN.SceneFx(el, specs, this.settings, frame);
        return el;
      }
      const apply = (url) => {
        el.classList.remove('bg-ph');
        el.replaceChildren();
        el.style.backgroundImage = `url("${url}")`;
        // the picture's own animation: petals, lanterns, water... (not in save thumbnails)
        const specs = live && this.story.bgFx && this.story.bgFx[name];
        if (specs && specs.length && VN.SceneFx) {
          const fx = new VN.SceneFx(el, specs, this.settings);
          pictureAspect(url).then((ar) => fx.setAspect(ar));
        }
      };
      const known = VN.assets.lookup('bg', name);
      if (known) {
        apply(known);
        return el;
      }
      const [a, b, c] = bgPalette(name);
      el.classList.add('bg-ph');
      el.style.setProperty('--ph-a', a);
      el.style.setProperty('--ph-b', b);
      el.style.setProperty('--ph-c', c);
      el.append(h('div.bg-ph-sun'), h('div.bg-ph-hills'), h('div.bg-ph-label', `BG · ${prettyName(name)}`));
      if (known === undefined) {
        VN.assets.resolve('bg', name).then((url) => { if (url) apply(url); });
      }
      return el;
    }

    makeSprite(id, expr) {
      const ch = this.story.characters[id] || { name: id, color: '#cccccc' };
      const el = h('div.sprite', { 'data-id': id });
      const inner = h('div.sprite-inner');
      el.append(inner);
      el.style.setProperty('--c', ch.color);
      this.setSpriteExpr(el, id, expr);
      return el;
    }

    setSpriteExpr(el, id, expr) {
      const ch = this.story.characters[id] || { name: id, sprite: null };
      const inner = el.firstChild;
      const folder = ch.sprite || id;
      const key = `${folder}/${expr || 'neutral'}`;
      if (el.dataset.key === key) return;
      el.dataset.key = key;
      const showImage = (url, fallback) => {
        if (el.dataset.key !== key) return;
        let img = inner.firstChild;
        if (!img || img.tagName !== 'IMG') {
          img = h('img.sprite-img', { alt: '', draggable: 'false' });
          inner.replaceChildren(img);
        }
        if (img.getAttribute('src') !== url) img.src = url;
        // One picture for every mood: let the pose itself react a little instead.
        const mood = fallback ? MOODS[expr] || '' : '';
        if (img.dataset.mood !== mood || mood === 'up') {
          img.dataset.mood = '';
          if (mood) { void img.offsetWidth; img.dataset.mood = mood; }
        }
      };
      const known = spriteLookup(folder, expr || 'neutral');
      if (known) return showImage(known.url, known.fallback);
      // Still looking the picture up: keep the current one rather than flashing a placeholder.
      const hasArt = inner.firstChild && inner.firstChild.tagName === 'IMG';
      if (!(known === undefined && hasArt)) {
        inner.replaceChildren(
          h('div.ph-sprite',
            h('div.ph-hair'),
            h('div.ph-head', h('span.ph-face', kaomoji(expr))),
            h('div.ph-body'),
            h('div.ph-tag', h('b', VN.plainName ? VN.plainName(ch.name) : ch.name), h('span', expr || 'neutral')))
        );
      }
      if (known === undefined) resolveSprite(folder, expr || 'neutral').then((r) => { if (r) showImage(r.url, r.fallback); });
    }

    makeCg(name) {
      const el = h('div.cg');
      const known = VN.assets.lookup('cg', name);
      const apply = (url) => {
        el.classList.remove('cg-ph');
        el.replaceChildren();
        el.style.backgroundImage = `url("${url}")`;
      };
      if (known) { apply(known); return el; }
      el.classList.add('cg-ph');
      el.append(h('div.cg-ph-frame', h('span', 'CG'), h('b', prettyName(name))));
      if (known === undefined) VN.assets.resolve('cg', name).then((url) => { if (url) apply(url); });
      return el;
    }

    static layout(sprites) {
      const list = Object.entries(sprites).sort((a, b) => a[1].order - b[1].order);
      const autos = list.filter(([, s]) => s.at == null);
      const n = autos.length;
      const slots = AUTO_SLOTS[n] || autos.map((_, i) => ((i + 1) * 100) / (n + 1));
      const pos = {};
      autos.forEach(([id], i) => (pos[id] = slots[i]));
      list.forEach(([id, s]) => { if (s.at != null) pos[id] = s.at; });
      return { order: list.map(([id]) => id), pos };
    }

    // ---- preloading ----------------------------------------------------------
    preload(ins) {
      if (ins.op === 'scene' && ins.bg !== 'black' && ins.bg !== 'white') {
        if (VN.Scenery && VN.Scenery.has(ins.bg)) VN.Scenery.load(ins.bg);
        else VN.assets.resolve('bg', ins.bg);
      }
      if (ins.op === 'show') {
        const ch = this.story.characters[ins.id];
        resolveSprite((ch && ch.sprite) || ins.id, ins.expr || 'neutral');
      }
      if (ins.op === 'say' && ins.expr && ins.who) {
        const ch = this.story.characters[ins.who];
        resolveSprite((ch && ch.sprite) || ins.who, ins.expr);
      }
      if (ins.op === 'cg' && ins.name) VN.assets.resolve('cg', ins.name);
    }

    /** Wait (briefly) for the images a scene needs, so transitions show real art. */
    async prepare(scene) {
      const jobs = [];
      if (scene.bg && scene.bg !== 'black' && scene.bg !== 'white') {
        if (VN.Scenery && VN.Scenery.has(scene.bg)) jobs.push(Promise.race([VN.Scenery.load(scene.bg), new Promise((r) => setTimeout(r, 900))]));
        else jobs.push(VN.assets.resolveWithin('bg', scene.bg, 600));
      }
      for (const [id, s] of Object.entries(scene.sprites)) {
        const ch = this.story.characters[id];
        jobs.push(Promise.race([resolveSprite((ch && ch.sprite) || id, s.expr || 'neutral'), new Promise((r) => setTimeout(r, 600))]));
      }
      if (scene.cg) jobs.push(VN.assets.resolveWithin('cg', scene.cg, 600));
      await Promise.all(jobs);
    }

    // ---- rendering -----------------------------------------------------------
    /** Hard redraw with no animation (used after load / rollback). */
    reset(scene) {
      this.stopFx();
      this.bgStack.replaceChildren();
      this.spriteLayer.replaceChildren();
      this.cgLayer.replaceChildren();
      this.spriteEls = {};
      this.rendered = { bg: null, sprites: {}, cg: null };
      this.fader.getAnimations().forEach((a) => a.cancel());
      this.fader.style.opacity = 0;
      this.scene.getAnimations().forEach((a) => a.cancel());
      this.sync(scene, { instant: true });
    }

    /**
     * Bring the DOM in line with `scene`. Returns how long the animation takes
     * (ms) so the engine can wait for it.
     */
    sync(scene, { instant = false, duration = 500, bgTransition = 'dissolve' } = {}) {
      const d = instant ? 0 : duration;
      let longest = 0;

      if (scene.bg !== this.rendered.bg) {
        this.setBg(scene.bg, instant || bgTransition === 'none' ? 0 : d);
        this.rendered.bg = scene.bg;
        if (!instant && bgTransition !== 'none') longest = Math.max(longest, d);
      }

      // Sprites: remove, add, update.
      const { order, pos } = Stage.layout(scene.sprites);
      for (const id of Object.keys(this.spriteEls)) {
        if (!scene.sprites[id]) {
          const el = this.spriteEls[id];
          delete this.spriteEls[id];
          if (d) {
            el.style.transitionDuration = `${d}ms`;
            el.classList.add('leaving');
            setTimeout(() => el.remove(), d + 50);
            longest = Math.max(longest, d);
          } else el.remove();
        }
      }
      order.forEach((id, z) => {
        const s = scene.sprites[id];
        let el = this.spriteEls[id];
        if (!el) {
          el = this.makeSprite(id, s.expr);
          el.style.left = `${pos[id]}%`;
          this.spriteEls[id] = el;
          this.spriteLayer.append(el);
          if (d) {
            el.classList.add('entering');
            el.style.transitionDuration = `${d}ms`;
            void el.offsetWidth;
            el.classList.remove('entering');
            longest = Math.max(longest, d);
          }
        } else {
          this.setSpriteExpr(el, id, s.expr);
          const left = `${pos[id]}%`;
          if (el.style.left !== left) {
            el.style.transitionDuration = instant ? '0ms' : '';
            el.style.left = left;
            if (!instant) longest = Math.max(longest, 450);
          }
        }
        el.style.zIndex = String(10 + z);
      });
      this.rendered.sprites = VN.clone(scene.sprites);
      this.applySpeaker();

      // CG
      if ((scene.cg || null) !== this.rendered.cg) {
        const old = [...this.cgLayer.children];
        old.forEach((el) => {
          if (d) { el.style.transitionDuration = `${d}ms`; el.classList.add('leaving'); setTimeout(() => el.remove(), d + 50); } else el.remove();
        });
        if (scene.cg) {
          const el = this.makeCg(scene.cg);
          this.cgLayer.append(el);
          if (d) {
            el.classList.add('entering');
            el.style.transitionDuration = `${d}ms`;
            void el.offsetWidth;
            el.classList.remove('entering');
          }
        }
        this.rendered.cg = scene.cg || null;
        if (d) longest = Math.max(longest, d);
      }

      this.applyLook(scene, instant);
      return longest;
    }

    setBg(name, d) {
      // the soft backdrop shown around the stage on unusually shaped windows
      if (VN.setAmbient) {
        const flat = VN.Scenery && VN.Scenery.has(name) ? VN.Scenery.flatUrl(name) : VN.assets.lookup('bg', name);
        VN.setAmbient(name === 'black' || name === 'white' ? null : flat || null);
      }
      const el = this.makeBg(name);
      const old = [...this.bgStack.children];
      this.bgStack.append(el);
      if (d) {
        el.style.opacity = '0';
        el.style.transition = `opacity ${d}ms ease`;
        void el.offsetWidth;
        el.style.opacity = '1';
        setTimeout(() => old.forEach((o) => o.remove()), d + 50);
      } else old.forEach((o) => o.remove());
    }

    applyLook(scene, instant) {
      const t = instant ? '0ms' : '';
      const tint = scene.tint;
      this.tintEl.style.transitionDuration = t;
      if (tint && tint.color !== 'none') {
        const preset = TINTS[tint.color];
        this.tintEl.style.background = preset ? preset[0] : tint.color;
        this.tintEl.style.opacity = String(tint.opacity != null ? tint.opacity : preset ? preset[1] : 0.3);
      } else this.tintEl.style.opacity = '0';
      this.content.style.transitionDuration = t;
      this.content.style.filter = (scene.filter && FILTERS[scene.filter]) || 'none';
      this.vignetteEl.style.transitionDuration = t;
      this.vignetteEl.style.opacity = scene.vignette ? '1' : '0';
    }

    setSpeaker(id) {
      this.speaker = id;
      this.applySpeaker();
    }

    applySpeaker() {
      const focusOn = this.settings.focus && this.speaker && this.spriteEls[this.speaker];
      for (const [id, el] of Object.entries(this.spriteEls)) {
        el.classList.toggle('speaking', !!focusOn && id === this.speaker);
        el.classList.toggle('dim', !!focusOn && id !== this.speaker);
      }
    }

    // ---- full-screen fades ---------------------------------------------------
    fadeTo(opacity, ms, color = '#000') {
      this.fader.style.background = color;
      const from = getComputedStyle(this.fader).opacity;
      this.fader.getAnimations().forEach((a) => a.cancel());
      this.fader.style.opacity = String(opacity);
      if (ms > 0) this.fader.animate([{ opacity: from }, { opacity }], { duration: ms, easing: 'ease-in-out' });
      return ms;
    }

    // ---- screen effects --------------------------------------------------------
    effect(kind, seconds, color, audio) {
      const reduce = this.settings.reduceMotion;
      const ms = Math.max(50, (seconds || { shake: 0.5, flash: 0.5, glitch: 0.8, static: 1.2, pulse: 1.2 }[kind] || 0.6) * 1000);
      switch (kind) {
        case 'shake': {
          const amp = reduce ? 3 : 14;
          const frames = [];
          for (let i = 0; i <= 12; i++) {
            const k = 1 - i / 12;
            frames.push({ transform: i === 12 ? 'none' : `translate(${(Math.random() * 2 - 1) * amp * k}px, ${(Math.random() * 2 - 1) * amp * k * 0.6}px)` });
          }
          this.scene.animate(frames, { duration: ms, easing: 'linear' });
          return;
        }
        case 'pulse': {
          const s = reduce ? 1.01 : 1.035;
          this.scene.animate(
            [{ transform: 'scale(1)' }, { transform: `scale(${s})`, offset: 0.15 }, { transform: 'scale(1)', offset: 0.35 }, { transform: `scale(${s})`, offset: 0.5 }, { transform: 'scale(1)' }],
            { duration: ms, easing: 'ease-out' });
          return;
        }
        case 'flash': {
          this.flashEl.style.background = color || '#fff';
          this.flashEl.animate([{ opacity: reduce ? 0.35 : 0.9 }, { opacity: 0 }], { duration: ms, easing: 'ease-out' });
          return;
        }
        case 'glitch':
        case 'static': {
          if (audio) audio.noise(Math.min(ms / 1000, 1.2), kind === 'glitch' ? 0.07 : 0.05);
          if (kind === 'glitch' && !reduce) {
            const frames = [];
            for (let i = 0; i < 10; i++) {
              frames.push({
                transform: `translate(${(Math.random() * 2 - 1) * 18}px, 0) skewX(${(Math.random() * 2 - 1) * 4}deg)`,
                filter: `hue-rotate(${Math.random() * 90 - 45}deg) contrast(${1 + Math.random()}) saturate(${1 + Math.random() * 2})`,
              });
            }
            frames.push({ transform: 'none', filter: 'none' });
            this.scene.animate(frames, { duration: ms, easing: 'steps(10)' });
          }
          this.runCanvasFx(kind, reduce ? Math.min(ms, 400) : ms, reduce);
          return;
        }
      }
    }

    runCanvasFx(kind, ms, reduce) {
      const cv = this.fxCanvas;
      const ctx = cv.getContext('2d');
      const W = cv.width, H = cv.height;
      const img = ctx.createImageData(W, H);
      const t0 = performance.now();
      cancelAnimationFrame(this.fxRaf);
      cv.style.opacity = kind === 'static' ? (reduce ? '0.25' : '0.55') : '0.9';
      const draw = (now) => {
        const k = (now - t0) / ms;
        if (k >= 1) { this.stopFx(); return; }
        ctx.clearRect(0, 0, W, H);
        if (kind === 'static') {
          const d = img.data;
          for (let i = 0; i < d.length; i += 4) {
            const v = Math.random() * 255;
            d[i] = d[i + 1] = d[i + 2] = v;
            d[i + 3] = 255;
          }
          ctx.putImageData(img, 0, 0);
        } else {
          const bands = 6 + Math.floor(Math.random() * 8);
          for (let b = 0; b < bands; b++) {
            const y = Math.random() * H;
            const bh = 1 + Math.random() * 10;
            const x = (Math.random() * 2 - 1) * 40;
            const hue = [0, 180, 300, 120][Math.floor(Math.random() * 4)];
            ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${0.25 + Math.random() * 0.4})`;
            ctx.fillRect(x, y, W, bh);
            if (Math.random() < 0.4) {
              ctx.fillStyle = 'rgba(0,0,0,0.85)';
              ctx.fillRect(Math.random() * W, y, Math.random() * 80, bh);
            }
          }
        }
        this.fxRaf = requestAnimationFrame(draw);
      };
      this.fxRaf = requestAnimationFrame(draw);
    }

    stopFx() {
      cancelAnimationFrame(this.fxRaf);
      const ctx = this.fxCanvas.getContext('2d');
      ctx.clearRect(0, 0, this.fxCanvas.width, this.fxCanvas.height);
      this.fxCanvas.style.opacity = '0';
    }

    // ---- save thumbnails -------------------------------------------------------
    renderThumb(container, scene) {
      const box = h('div.thumb-scene');
      const content = h('div.scene-content');
      content.style.filter = (scene.filter && FILTERS[scene.filter]) || 'none';
      if (scene.bg) content.append(this.makeBg(scene.bg, false));
      const { order, pos } = Stage.layout(scene.sprites || {});
      order.forEach((id, z) => {
        const el = this.makeSprite(id, scene.sprites[id].expr);
        el.style.left = `${pos[id]}%`;
        el.style.zIndex = String(10 + z);
        content.append(el);
      });
      if (scene.cg) content.append(this.makeCg(scene.cg));
      box.append(content);
      if (scene.tint && scene.tint.color !== 'none') {
        const preset = TINTS[scene.tint.color];
        box.append(h('div.tint', { style: { background: preset ? preset[0] : scene.tint.color, opacity: String(scene.tint.opacity != null ? scene.tint.opacity : preset ? preset[1] : 0.3) } }));
      }
      container.replaceChildren(box);
      const fit = () => { if (container.clientWidth) box.style.setProperty('--thumb-k', String(container.clientWidth / 1280)); };
      fit();
      requestAnimationFrame(fit);
    }
  }

  VN.Stage = Stage;
})();
