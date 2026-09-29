/*
 * textbox.js — the dialogue box and its typewriter.
 *
 * Text tags (inside quoted lines):
 *   {b}bold{/b}  {i}italic{/i}  {u}underline{/u}  {s}strike{/s}
 *   {color=#ff7eb6}tinted{/color}   {size=40}big{/size}
 *   {shake}trembling{/shake}  {wave}floaty{/wave}  {glitch}corrupted{/glitch}
 *   {w=0.5}  pause half a second      {w}  wait for a click mid-line
 *   {speed=0.5}slower{/speed}         {nw}  continue without waiting
 *   {{ and }} print literal braces.
 */
(function () {
  'use strict';
  const VN = (globalThis.VN = globalThis.VN || {});
  const h = VN.h;

  const GLITCH_GLYPHS = '█▓▒░#@$%&?!/\\<>{}アイウエオカキクケコ';

  /** Break a tagged string into characters with styles, plus pause markers. */
  function parseTagged(text) {
    const steps = [];
    const stack = [];
    let noWait = false;
    let speed = 1;
    const style = () => {
      const s = { cls: [], css: {} };
      for (const t of stack) {
        if (t.name === 'b') s.css.fontWeight = '700';
        else if (t.name === 'i') s.css.fontStyle = 'italic';
        else if (t.name === 'u') s.css.textDecoration = 'underline';
        else if (t.name === 's') s.css.textDecoration = 'line-through';
        else if (t.name === 'color') s.css.color = t.value;
        else if (t.name === 'size') s.css.fontSize = /^\d+$/.test(t.value) ? `${t.value}px` : t.value;
        else if (t.name === 'shake' || t.name === 'wave' || t.name === 'glitch') s.cls.push(`fx-${t.name}`);
      }
      return s;
    };
    let i = 0;
    while (i < text.length) {
      const c = text[i];
      if (c === '{' && text[i + 1] === '{') { steps.push({ ch: '{', style: style(), speed }); i += 2; continue; }
      if (c === '}' && text[i + 1] === '}') { steps.push({ ch: '}', style: style(), speed }); i += 2; continue; }
      if (c === '{') {
        const end = text.indexOf('}', i);
        if (end < 0) { steps.push({ ch: c, style: style(), speed }); i++; continue; }
        const tag = text.slice(i + 1, end).trim();
        i = end + 1;
        if (tag.startsWith('/')) {
          const name = tag.slice(1);
          if (name === 'speed') speed = 1;
          for (let k = stack.length - 1; k >= 0; k--) if (stack[k].name === name) { stack.splice(k, 1); break; }
          continue;
        }
        const [name, value] = tag.split('=');
        if (name === 'w') steps.push(value ? { wait: parseFloat(value) * 1000 } : { click: true });
        else if (name === 'nw') noWait = true;
        else if (name === 'speed') speed = parseFloat(value) || 1;
        else stack.push({ name, value });
        continue;
      }
      steps.push({ ch: c, style: style(), speed });
      i++;
    }
    return { steps, noWait };
  }

  /** Plain text version of a tagged line (for history, save previews). */
  function stripTags(text) {
    return text.replace(/\{\{/g, '\u0001').replace(/\}\}/g, '\u0002').replace(/\{[^}]*\}/g, '').replace(/\u0001/g, '{').replace(/\u0002/g, '}');
  }

  VN.stripTags = stripTags;
  VN.plainName = (s) => stripTags(s || '');

  class Typer {
    /**
     * @param container element to type into (emptied first)
     * @param text tagged text
     * @param opts {cps, instant, onChar(ch)}
     */
    constructor(container, text, opts = {}) {
      this.container = container;
      this.opts = opts;
      const { steps, noWait } = parseTagged(text);
      this.noWait = noWait;
      this.finished = false;
      this.pausedForClick = false;
      this.raf = 0;
      this.glitchTimer = 0;
      this.plan = [];
      this.glitchSpans = [];
      this.done = new Promise((r) => (this.resolveDone = r));
      this.build(steps);
      this.idx = 0;
      this.budget = 0;
      this.waitUntil = 0;
      this.last = performance.now();
      if (opts.instant || !opts.cps || opts.cps >= 200) this.revealTo(this.plan.length, true);
      else this.raf = requestAnimationFrame((t) => this.tick(t));
    }

    build(steps) {
      const frag = document.createDocumentFragment();
      let word = null;
      let index = 0;
      const flushWord = () => { if (word) { frag.append(word); word = null; } };
      for (const s of steps) {
        if (s.wait !== undefined || s.click) { this.plan.push(s); continue; }
        if (s.ch === '\n') { flushWord(); frag.append(h('br')); continue; }
        const span = h('span.ch');
        span.textContent = s.ch;
        Object.assign(span.style, s.style.css);
        if (s.style.cls.length) {
          span.classList.add(...s.style.cls);
          span.style.setProperty('--i', String(index));
          if (s.style.cls.includes('fx-glitch')) { span.dataset.orig = s.ch; this.glitchSpans.push(span); }
        }
        index++;
        if (s.ch === ' ') { flushWord(); frag.append(span); }
        else {
          if (!word) word = h('span.word');
          word.append(span);
        }
        this.plan.push({ el: span, ch: s.ch, speed: s.speed });
      }
      flushWord();
      this.container.replaceChildren(frag);
      if (this.glitchSpans.length) {
        this.glitchTimer = setInterval(() => {
          for (const sp of this.glitchSpans) {
            sp.textContent = Math.random() < 0.28 ? GLITCH_GLYPHS[Math.floor(Math.random() * GLITCH_GLYPHS.length)] : sp.dataset.orig;
          }
        }, 80);
      }
    }

    tick(now) {
      if (this.finished || this.pausedForClick) return;
      const dt = Math.min(100, now - this.last);
      this.last = now;
      if (now < this.waitUntil) { this.raf = requestAnimationFrame((t) => this.tick(t)); return; }
      this.budget += (dt / 1000) * this.opts.cps;
      while (this.idx < this.plan.length) {
        const p = this.plan[this.idx];
        if (p.click) { this.idx++; this.pausedForClick = true; if (this.opts.onPause) this.opts.onPause(); return; }
        if (p.wait !== undefined) { this.idx++; this.waitUntil = now + p.wait; this.budget = 0; break; }
        const cost = 1 / (p.speed || 1);
        if (this.budget < cost) break;
        this.budget -= cost;
        this.show(p);
        this.idx++;
        // Natural pauses after punctuation make the text breathe.
        const next = this.plan[this.idx];
        const endOfClause = !next || (next.ch === ' ' || next.ch === undefined);
        if (endOfClause && /[.!?…]/.test(p.ch)) { this.budget -= 5; }
        else if (endOfClause && /[,;:—–]/.test(p.ch)) { this.budget -= 2.5; }
      }
      if (this.idx >= this.plan.length) { this.complete(); return; }
      this.raf = requestAnimationFrame((t) => this.tick(t));
    }

    show(p) {
      p.el.classList.add('on');
      if (this.opts.onChar && p.ch.trim()) this.opts.onChar(p.ch);
    }

    revealTo(end, all) {
      while (this.idx < end) {
        const p = this.plan[this.idx];
        if (p.click && !all) { this.idx++; break; }
        if (p.el) p.el.classList.add('on');
        this.idx++;
      }
      if (this.idx >= this.plan.length) this.complete();
    }

    /** Player clicked: resume after {w}, or reveal up to the next {w}. Returns true if consumed. */
    advance() {
      if (this.finished) return false;
      cancelAnimationFrame(this.raf);
      if (this.pausedForClick) {
        this.pausedForClick = false;
      } else {
        let end = this.idx;
        while (end < this.plan.length && !this.plan[end].click) end++;
        this.revealTo(end, false);
        if (this.finished) return true;
        if (end < this.plan.length) { this.idx = end + 1; this.pausedForClick = true; if (this.opts.onPause) this.opts.onPause(); return true; }
      }
      this.last = performance.now();
      this.waitUntil = 0;
      this.budget = 0;
      this.raf = requestAnimationFrame((t) => this.tick(t));
      return true;
    }

    /** Reveal everything immediately (skip mode). */
    finish() {
      if (this.finished) return;
      cancelAnimationFrame(this.raf);
      this.pausedForClick = false;
      this.revealTo(this.plan.length, true);
    }

    complete() {
      if (this.finished) return;
      this.finished = true;
      cancelAnimationFrame(this.raf);
      this.resolveDone();
    }

    destroy() {
      cancelAnimationFrame(this.raf);
      clearInterval(this.glitchTimer);
      this.finished = true;
      this.resolveDone();
    }
  }

  class Textbox {
    constructor(root, settings, audio) {
      this.settings = settings;
      this.audio = audio;
      this.name = h('div.namebox');
      this.face = h('div.tb-face', { 'aria-hidden': 'true' });
      this.text = h('div.tb-text');
      this.next = h('div.tb-next', { 'aria-hidden': 'true' });
      // The panel is drawn separately so the portrait and name plate can overhang its frame.
      const panel = h('div.tb-panel', ...['tl', 'tr', 'bl', 'br'].map((c) => h(`i.tb-corner.${c}`)));
      this.box = h('div.textbox.hidden', panel, this.face, this.name, this.text, this.next);
      this.faceKey = null;
      this.faceWho = null;
      this.centeredText = h('div.centered-text');
      this.centered = h('div.centered.hidden', this.centeredText);
      root.append(this.centered, this.box);
      this.typer = null;
    }

    showBox() {
      this.box.classList.remove('hidden');
    }

    hideBox() {
      this.box.classList.add('hidden');
    }

    get visible() {
      return !this.box.classList.contains('hidden');
    }

    say({ name, color, text, italic, instant, voice, face, who }) {
      this.stop();
      this.hideCentered();
      this.showBox();
      this.hideNext();
      this.setFace(face, who);
      if (name) {
        this.name.textContent = name;
        this.name.style.setProperty('--name-color', color || '#fff');
        this.name.classList.add('on');
      } else this.name.classList.remove('on');
      this.text.classList.toggle('italic', !!italic);
      this.text.classList.toggle('narration', !name);
      this.typer = new Typer(this.text, text, {
        cps: this.settings.textSpeed,
        instant,
        // a character's muffled voice while they talk; narration gets a soft typing sound
        onChar: this.audio.voiceLine(!instant && voice) ? (ch) => this.audio.voiceChar(ch) : (ch) => this.audio.typeTick(ch),
        onPause: () => { this.showNext(); if (this.onPause) this.onPause(); },
      });
      return this.typer;
    }

    /**
     * The speaker's portrait: a picture url, or { url, rect } — their face cut from the sprite, so
     * it can be any of their expressions (rect: x and size as fractions of the sprite's width, y of
     * its height, a = height / width).
     */
    setFace(face, who) {
      const url = face ? (typeof face === 'string' ? face : face.url) : null;
      this.box.classList.toggle('has-face', !!url);
      const key = face ? (typeof face === 'string' ? face : `${face.url}|${face.rect.x},${face.rect.y}`) : null;
      if (key === this.faceKey) return;
      const sameSpeaker = !!who && who === this.faceWho && !!this.faceKey;
      this.faceKey = key;
      this.faceWho = who || null;
      if (!url) return;
      const st = this.face.style;
      if (typeof face === 'string') {
        st.backgroundImage = `url("${url}")`;
        st.backgroundSize = '';
        st.backgroundPosition = '';
      } else {
        // the square of the sprite that holds the face, filling the portrait box
        const box = this.face.offsetWidth || 236;
        const w = box / face.rect.s, hgt = w * (face.rect.a || 850 / 400);
        st.backgroundImage = `url("${url}")`;
        st.backgroundSize = `${w}px ${hgt}px`;
        st.backgroundPosition = `${-face.rect.x * w}px ${-face.rect.y * hgt}px`;
      }
      this.face.classList.remove('enter', 'swap');
      void this.face.offsetWidth;
      // a new speaker's portrait slides in; the same speaker changing their face just melts
      this.face.classList.add(sameSpeaker ? 'swap' : 'enter');
    }

    sayCentered({ text, instant }) {
      this.stop();
      this.hideBox();
      this.centered.classList.remove('hidden');
      this.typer = new Typer(this.centeredText, text, {
        cps: this.settings.textSpeed * 0.8,
        instant,
        onChar: (ch) => this.audio.typeTick(ch),
        onPause: () => { this.showNext(); if (this.onPause) this.onPause(); },
      });
      return this.typer;
    }

    hideCentered() {
      this.centered.classList.add('hidden');
    }

    showNext(mode) {
      this.next.className = `tb-next on${mode ? ` ${mode}` : ''}`;
      this.centered.classList.add('waiting');
    }

    hideNext() {
      this.next.className = 'tb-next';
      this.centered.classList.remove('waiting');
    }

    stop() {
      if (this.typer) this.typer.destroy();
      this.typer = null;
    }

    clear() {
      this.stop();
      this.text.replaceChildren();
      this.name.classList.remove('on');
      this.setFace(null);
      this.hideNext();
      this.hideBox();
      this.hideCentered();
    }
  }

  VN.Typer = Typer;
  VN.Textbox = Textbox;
  VN.parseTagged = parseTagged;
})();
