/*
 * engine.js — runs the compiled story.
 *
 * The whole game state (position, variables, what's on screen, music) is one
 * plain object. Before every line or choice the engine snapshots it, which is
 * what makes saving, loading and rolling back exact and cheap.
 */
(function () {
  'use strict';
  const VN = (globalThis.VN = globalThis.VN || {});

  const ABORT = { abort: true };
  const SKIP_DELAY = 45; // ms per line while skipping
  const TRANS_MS = { dissolve: 500, fade: 1000, flash: 700, slow: 1600, none: 0 };

  VN.DEFAULT_SETTINGS = {
    textSpeed: 42,
    autoDelay: 1.75,
    musicVolume: 0.7,
    sfxVolume: 0.8,
    uiSounds: true,
    typeSound: true, // a soft tap as narration types
    skipUnseen: false,
    skipAfterChoices: false,
    focus: true,
    reduceMotion: false,
    choiceTimer: 2, // 0 off, 1 relaxed, 2 normal
    charVoices: true, // muffled "speech" while characters talk
    voiceVolume: 0.8,
  };

  // How long a choice waits, by the "Choice timer" setting.
  const TIMER_FACTOR = [0, 1.8, 1];

  // A choice's emotional tone, guessed from what it does when the script doesn't say.
  const TONE_OF = { helene_trust: ['tender', 'cold'], intimacy: ['tender', null], obsession: ['obsession', 'honest'], danger: ['danger', 'quiet'], business: ['duty', null], mystery: ['curious', 'honest'], fascination: ['curious', null] };

  const FUNCTIONS = {
    max: (e, a) => Math.max(...a),
    min: (e, a) => Math.min(...a),
    abs: (e, a) => Math.abs(a[0]),
    round: (e, a) => Math.round(a[0]),
    floor: (e, a) => Math.floor(a[0]),
    ceil: (e, a) => Math.ceil(a[0]),
    random: (e, a) => (a.length >= 2 ? a[0] + Math.floor(Math.random() * (a[1] - a[0] + 1)) : Math.random()),
    /** top("trust", "obsession") → name of the variable with the highest value */
    top: (e, a) => a.reduce((best, n) => ((e.getVar(n) || 0) > (e.getVar(best) || 0) ? n : best), a[0]),
    visited: (e, a) => (e.state.visited[a[0]] || 0),
    seen_ending: (e, a) => !!e.persistent.endings[a[0]],
    /** route() → "devoted", "torn" or "lost": where Hervé's heart is heading */
    route: (e) => e.route(),
    /** has("watch") → whether Hervé carries that keepsake */
    has: (e, a) => e.hasItem(a[0]),
    endings: (e) => Object.keys(e.persistent.endings).length,
  };

  class Engine {
    constructor({ story, ui, stage, audio, poem, settings }) {
      this.story = story;
      this.program = story.program;
      this.ui = ui;
      this.stage = stage;
      this.audio = audio;
      this.poem = poem;
      this.settings = settings;
      this.persistent = Object.assign({ vars: {}, seen: {}, endings: {}, warned: false, autoIndex: 0 }, VN.store.get('persistent', {}));

      // A new edition of the story (different chapters and endings): old saves can't be followed
      // into it, so they are cleared once, along with the old endings; settings are kept.
      const edition = story.edition || 1;
      if ((this.persistent.edition || 1) !== edition) {
        const hadAny = Object.keys(this.persistent.endings).length > 0 || Object.keys(this.persistent.seen).length > 0;
        VN.store.clearStarting('save.');
        this.persistent = { vars: {}, seen: {}, endings: {}, warned: this.persistent.warned, autoIndex: 0, edition };
        VN.store.set('persistent', this.persistent);
        this.editionReset = hadAny;
      }
      this.persistent.edition = edition;
      this.gen = 0;
      this.newAbortSignal();
      this.state = this.freshState();
      this.history = [];
      this.rollbackStack = [];
      this.current = null;
      this.inGame = false;
      this.line = null;
      this.waiter = null;
      this.skipToggle = false;
      this.skipHeld = false;
      this.skipBlocked = false;
      this.auto = false;
      this.instantNext = false;
      this.autosavePending = false;
      this.onStep = null;

      this.exprCtx = {
        get: (name) => {
          const v = this.getVar(name);
          return v === undefined ? 0 : v;
        },
        call: (name, args) => {
          const fn = FUNCTIONS[name];
          if (!fn) throw new Error(`Unknown function "${name}()"`);
          return fn(this, args);
        },
      };
      ui.onOverlayChange = () => this.onOverlayChange();
    }

    freshState() {
      return {
        pc: this.story.labels.start || 0,
        label: 'start',
        callStack: [],
        vars: {},
        visited: {},
        scene: { bg: 'black', sprites: {}, nextOrder: 0, cg: null, tint: null, filter: null, vignette: false },
        music: null,
        ambience: null,
        chapter: '',
        noRollback: false,
        choices: [], // what the player chose and how it was felt, for the ending recap
        items: [], // the keepsakes Hervé carries (money is the variable "francs")
        met: {}, // characters already introduced in this playthrough
      };
    }

    // ---- the route: where the player's choices are taking Hervé ------------------------
    route() {
      if (!this.story.routeScore) return 'torn';
      let score = 0;
      try { score = Number(this.evaluate(this.story.routeScore)) || 0; } catch (e) { score = 0; }
      const [lost, devoted] = this.story.routeBounds || [-4, 3];
      return score >= devoted ? 'devoted' : score <= lost ? 'lost' : 'torn';
    }

    /** Keep the route in a variable (for the script) and on the stage (for the look). */
    updateRoute() {
      const r = this.route();
      const before = this.state.vars.route;
      this.state.vars.route = r;
      this.ui.setRoute(r);
      return { route: r, changed: before && before !== r ? before : null };
    }

    // ---- keepsakes and money --------------------------------------------------------
    hasItem(id) { return (this.state.items || []).includes(id); }

    itemInfo(id) { return (this.story.items && this.story.items[id]) || { id, name: id.replace(/_/g, ' '), desc: '' }; }

    gainItem(id, { quiet = false } = {}) {
      if (!this.state.items) this.state.items = [];
      if (this.hasItem(id)) return;
      this.state.items.push(id);
      if (!quiet) this.ui.itemNotice(this.itemInfo(id), 'gain');
    }

    loseItem(id, { quiet = false } = {}) {
      if (!this.hasItem(id)) return;
      this.state.items = this.state.items.filter((i) => i !== id);
      if (!quiet) this.ui.itemNotice(this.itemInfo(id), 'lose');
    }

    francs() { return Number(this.getVar('francs')) || 0; }

    changeFrancs(delta, { quiet = false } = {}) {
      const before = this.francs();
      const after = Math.max(0, before + delta);
      this.setVar('francs', after);
      if (!quiet && after !== before) this.ui.itemNotice({ id: 'francs', name: `${Math.abs(after - before)} francs`, desc: '' }, after > before ? 'gain' : 'lose');
    }

    /** "francs:40" / "item:watch" → what it is and whether Hervé has it. */
    parseCost(spec) {
      if (!spec) return null;
      const [kind, what] = spec.split(':');
      if (kind === 'francs') { const n = parseInt(what, 10) || 0; return { kind, n, ok: this.francs() >= n, label: `${n} francs` }; }
      return { kind: 'item', id: what, ok: this.hasItem(what), label: this.itemInfo(what).name, item: this.itemInfo(what) };
    }

    payCost(c) {
      if (!c) return;
      if (c.kind === 'francs') this.changeFrancs(-c.n); else this.loseItem(c.id);
    }

    guessTone(opt) {
      let best = null, size = 0;
      for (const a of opt.effects || []) {
        const map = TONE_OF[a.name];
        if (!map) continue;
        let v = 0;
        try { v = Number(this.evaluate(a.value)) || 0; } catch (e) { v = 0; }
        if (a.assign === '-=') v = -v;
        if (a.assign !== '+=' && a.assign !== '-=') continue;
        const tone = v > 0 ? map[0] : map[1];
        if (tone && Math.abs(v) > size) { size = Math.abs(v); best = tone; }
      }
      return best || 'neutral';
    }

    // ---- variables & expressions ---------------------------------------------------
    getVar(name) {
      if (name.startsWith('persistent.')) return this.persistent.vars[name.slice(11)];
      return this.state.vars[name];
    }

    setVar(name, value) {
      if (name.startsWith('persistent.')) {
        this.persistent.vars[name.slice(11)] = value;
        this.savePersistent();
      } else this.state.vars[name] = value;
    }

    evaluate(src) {
      return VN.expr.compile(src)(this.exprCtx);
    }

    test(src) {
      return !!this.evaluate(src);
    }

    assign({ name, assign, value }) {
      const v = this.evaluate(value);
      const cur = this.getVar(name) || 0;
      switch (assign) {
        case '=': this.setVar(name, v); break;
        case '+=': this.setVar(name, cur + v); break;
        case '-=': this.setVar(name, cur - v); break;
        case '*=': this.setVar(name, cur * v); break;
        case '/=': this.setVar(name, cur / v); break;
      }
    }

    // ---- karma: choices are felt, never shown as numbers ------------------------------------
    karmaSnapshot() {
      const snap = {};
      for (const k of this.story.karma) snap[k.name] = Number(this.getVar(k.name)) || 0;
      return snap;
    }

    /** Compare with a snapshot and let the player feel the (at most two) biggest threads that moved. */
    karmaFelt(before) {
      const felt = [];
      for (const k of this.story.karma) {
        const d = (Number(this.getVar(k.name)) || 0) - before[k.name];
        if (!d) continue;
        const dir = d > 0 ? 'up' : 'down';
        if (!k[dir]) continue;
        felt.push({ text: this.interp(k[dir]), color: k.color, weight: k.heavy === dir ? 'heavy' : k.heavy ? 'light' : 'soft' });
        if (felt.length === 2) break;
      }
      if (felt.length) this.ui.feelKarma(felt, { quiet: this.isSkipping() });
      return felt;
    }

    /** Several "set" lines in a row are felt together, once. */
    queueKarma(before) {
      if (!this.karmaBefore) {
        this.karmaBefore = before;
        const gen = this.gen;
        setTimeout(() => {
          const snap = this.karmaBefore;
          this.karmaBefore = null;
          if (gen === this.gen && this.inGame) this.karmaFelt(snap);
        }, 0);
      }
    }

    /** Replace [variable] with its value; [[ prints a literal bracket. */
    interp(text) {
      return text.replace(/\[\[/g, '\u0001').replace(/\[([A-Za-z_][\w.]*)\]/g, (_, n) => {
        const v = this.getVar(n);
        return v === undefined || v === null ? '' : String(v);
      }).replace(/\u0001/g, '[');
    }

    // ---- persistence -------------------------------------------------------------------
    savePersistent() {
      clearTimeout(this.persistTimer);
      this.persistTimer = setTimeout(() => VN.store.set('persistent', this.persistent), 250);
    }

    saveSettings() {
      VN.store.set('settings', this.settings);
      this.audio.refreshVolumes();
      this.stage.applySpeaker();
    }

    // ---- async control -------------------------------------------------------------------
    newAbortSignal() {
      this.abortSignal = new Promise((_, reject) => { this.abortReject = reject; });
      this.abortSignal.catch(() => {});
    }

    /** Stop whatever the story is doing (used by load, rollback, return to title). */
    abort() {
      this.gen++;
      const reject = this.abortReject;
      this.newAbortSignal();
      reject(ABORT);
      if (this.line) { clearTimeout(this.line.autoTimer); clearTimeout(this.line.skipTimer); }
      this.line = null;
      this.waiter = null;
    }

    guard(p) {
      const g = this.gen;
      return Promise.race([p, this.abortSignal]).then((v) => {
        if (g !== this.gen) throw ABORT;
        return v;
      });
    }

    sleep(ms) {
      return this.guard(new Promise((r) => setTimeout(r, ms)));
    }

    start() {
      const gen = this.gen;
      this.loop(gen);
    }

    async loop(gen) {
      let ins = null;
      try {
        while (gen === this.gen) {
          ins = this.program[this.state.pc];
          if (!ins) { await this.endGame(); return; }
          const op = this[`op_${ins.op}`];
          if (!op) throw new Error(`Unknown instruction ${ins.op}`);
          await op.call(this, ins);
        }
      } catch (e) {
        if (e === ABORT) return;
        console.error(e);
        this.setSkip(false);
        this.setAuto(false);
        this.ui.showErrors('The story hit a problem', [{ line: ins && ins.line, msg: e.message }]);
      }
    }

    // ---- snapshots, rollback ------------------------------------------------------------------
    checkpoint() {
      const snap = VN.clone(this.state);
      snap.historyLen = this.history.length;
      this.current = snap;
      if (!this.state.noRollback) {
        this.rollbackStack.push(snap);
        if (this.rollbackStack.length > 150) this.rollbackStack.shift();
      }
      if (this.autosavePending) { this.autosavePending = false; this.autosave(); }
      for (let i = this.state.pc; i < Math.min(this.program.length, this.state.pc + 40); i++) this.stage.preload(this.program[i]);
      if (this.onStep) this.onStep();
    }

    rollback() {
      if (!this.inGame || this.ui.modalOpen) return;
      if (this.state.noRollback) { this.ui.toast("You can't go back here"); return; }
      if (this.rollbackStack.length < 2) { this.ui.toast("You can't go back any further"); return; }
      this.rollbackStack.pop();
      const prev = this.rollbackStack.pop();
      this.setSkip(false);
      this.history.length = Math.min(this.history.length, prev.historyLen);
      const st = VN.clone(prev);
      delete st.historyLen;
      this.audio.ui('back');
      this.restore(st);
    }

    restore(state, { instant = true } = {}) {
      this.abort();
      this.state = state;
      this.shownPlace = null;
      this.ui.cancelTransient();
      this.poem.cancel();
      this.ui.textbox.clear();
      this.ui.setHidden(false);
      this.stage.setSpeaker(null);
      this.stage.reset(state.scene);
      this.ui.setRoute((state.vars && state.vars.route) || null);
      this.audio.sync(state);
      this.instantNext = instant;
      this.start();
    }

    // ---- showing lines ----------------------------------------------------------------------------
    isSkipping() {
      return (this.skipToggle || this.skipHeld) && !this.ui.modalOpen;
    }

    async showLine(ins, opts) {
      const seen = !!this.persistent.seen[ins.key];
      const instant = this.instantNext;
      this.instantNext = false;
      const tb = this.ui.textbox;
      tb.onPause = () => this.onTyperPause();
      const typer = opts.centered ? tb.sayCentered({ text: opts.text, instant }) : tb.say({ ...opts, instant });
      const line = { typer, seen, started: performance.now(), autoTimer: 0, skipTimer: 0, resolve: null };
      const done = new Promise((r) => { line.resolve = r; });
      this.line = line;
      if (!opts.centered && !instant && !this.isSkipping()) this.stage.setTalking(true);
      typer.done.then(() => { if (this.line === line || !this.line) this.stage.setTalking(false); this.onTyped(line); });
      this.updateSkip();
      await this.guard(done);
      this.persistent.seen[ins.key] = 1;
      this.savePersistent();
    }

    onTyped(line) {
      if (this.line !== line) return;
      if (line.typer.noWait && !line.typer.destroyed) { this.resolveLine(line); return; }
      this.ui.textbox.showNext(this.auto ? 'auto' : '');
      this.scheduleAuto();
    }

    onTyperPause() {
      const line = this.line;
      if (line && this.auto && !this.ui.modalOpen) {
        clearTimeout(line.autoTimer);
        line.autoTimer = setTimeout(() => { if (this.line === line) { line.typer.advance(); this.ui.textbox.hideNext(); } }, this.settings.autoDelay * 1000);
      }
    }

    resolveLine(line = this.line) {
      if (!line || this.line !== line) return;
      clearTimeout(line.autoTimer);
      clearTimeout(line.skipTimer);
      this.line = null;
      this.ui.textbox.hideNext();
      this.stage.setTalking(false);
      line.resolve();
    }

    /** Click / Space / Enter. */
    userAdvance() {
      if (!this.inGame) return;
      if (this.ui.uiHidden) { this.ui.setHidden(false); return; }
      if (this.ui.modalOpen || this.ui.choice) return;
      if (this.skipToggle) { this.setSkip(false); return; }
      if (this.waiter) { const w = this.waiter; this.waiter = null; w(); return; }
      const line = this.line;
      if (!line) return;
      const typer = line.typer;
      if (!typer.finished || typer.pausedForClick) {
        // A click in the first moments of a line is usually a double-click; don't eat the line.
        if (performance.now() - line.started < 120 && !typer.pausedForClick) return;
        typer.advance();
        if (!typer.pausedForClick && !typer.finished) this.ui.textbox.hideNext();
        return;
      }
      this.resolveLine(line);
    }

    scheduleAuto() {
      const line = this.line;
      if (!line || !this.auto || this.ui.modalOpen || !line.typer.finished) return;
      clearTimeout(line.autoTimer);
      const chars = line.typer.plan.length;
      line.autoTimer = setTimeout(() => this.resolveLine(line), (this.settings.autoDelay + chars * 0.022) * 1000);
    }

    updateSkip() {
      const line = this.line;
      if (!line || !this.isSkipping()) return;
      if (!line.seen && !this.settings.skipUnseen) {
        if (this.skipHeld) this.skipBlocked = true;
        this.skipHeld = false;
        if (this.skipToggle) this.setSkip(false);
        this.ui.setModes({ skip: false, auto: this.auto });
        this.ui.toast('Skipping stopped at new text');
        return;
      }
      line.typer.finish();
      clearTimeout(line.skipTimer);
      line.skipTimer = setTimeout(() => this.resolveLine(line), SKIP_DELAY);
    }

    setSkip(on) {
      this.skipToggle = !!on;
      this.ui.setModes({ skip: this.skipToggle || this.skipHeld, auto: this.auto });
      if (on) {
        if (this.ui.cardFinish) this.ui.cardFinish();
        if (this.waiter) { const w = this.waiter; this.waiter = null; w(); }
        this.updateSkip();
      }
    }

    toggleSkip() {
      this.setSkip(!this.skipToggle);
    }

    setSkipHeld(on) {
      if (!on) this.skipBlocked = false;
      if (on && this.skipBlocked) return;
      if (this.skipHeld === !!on) return;
      this.skipHeld = !!on;
      this.ui.setModes({ skip: this.skipToggle || this.skipHeld, auto: this.auto });
      if (on) {
        if (this.waiter) { const w = this.waiter; this.waiter = null; w(); }
        this.updateSkip();
      }
    }

    setAuto(on) {
      this.auto = !!on;
      this.ui.setModes({ skip: this.skipToggle || this.skipHeld, auto: this.auto });
      const line = this.line;
      if (!line) return;
      if (on) {
        if (line.typer.pausedForClick) this.onTyperPause();
        else this.scheduleAuto();
        if (line.typer.finished) this.ui.textbox.showNext('auto');
      } else {
        clearTimeout(line.autoTimer);
        if (line.typer.finished) this.ui.textbox.showNext('');
      }
    }

    onOverlayChange() {
      const line = this.line;
      if (!line) return;
      if (this.ui.modalOpen) {
        clearTimeout(line.autoTimer);
        clearTimeout(line.skipTimer);
      } else {
        this.scheduleAuto();
        this.updateSkip();
      }
    }

    // ---- instructions -------------------------------------------------------------------------------
    op_label(ins) {
      this.state.visited[ins.name] = (this.state.visited[ins.name] || 0) + 1;
      this.state.label = ins.name;
      this.state.pc++;
    }

    op_jump(ins) { this.state.pc = ins.target; }

    op_jumpIf(ins) { this.state.pc = this.test(ins.cond) ? ins.target : this.state.pc + 1; }

    op_jumpIfNot(ins) { this.state.pc = this.test(ins.cond) ? this.state.pc + 1 : ins.target; }

    op_call(ins) {
      this.state.callStack.push(this.state.pc + 1);
      this.state.pc = ins.target;
    }

    async op_return() {
      if (this.state.callStack.length) this.state.pc = this.state.callStack.pop();
      else await this.endGame();
    }

    async op_end() { await this.endGame(); }

    op_set(ins) {
      const felt = ins.assign !== '=' && this.story.karma.some((k) => k.name === ins.name);
      const before = felt ? this.karmaSnapshot() : null;
      this.assign(ins);
      if (felt) this.queueKarma(before);
      this.state.pc++;
    }

    async op_say(ins) {
      this.checkpoint();
      const st = this.state;
      const ch = ins.who ? this.story.characters[ins.who] : null;
      if (ins.expr && st.scene.sprites[ins.who]) {
        st.scene.sprites[ins.who].expr = ins.expr;
        this.stage.sync(st.scene, { instant: true });
      }
      this.stage.setSpeaker(ins.centered ? null : ins.who);
      const name = ch ? VN.plainName(this.interp(ch.name)) : '';
      const text = this.interp(ins.text);
      // Speakers who aren't standing in the scene (Hervé, voices over a CG) get their face in the text box.
      const face = ch && ch.face && !ins.centered && !st.scene.sprites[ins.who] ? VN.assets.lookup('face', ch.face) || null : null;
      this.history.push({ who: name, color: ch && ch.color, italic: !!(ch && ch.italic), text: VN.stripTags(text) });
      // characters murmur as they talk; narration and thoughts get the soft typing sound
      const voice = name && !ins.centered ? ch.voice : null;
      await this.showLine(ins, { name, color: ch && ch.color, italic: ch && ch.italic, voice, text, centered: ins.centered, face });
      this.state.pc++;
    }

    async op_menu(ins) {
      this.checkpoint();
      // Autosave once per arrival at a choice (not again after rolling back to it).
      const autoKey = `${this.state.pc}:${this.history.length}`;
      if (this.lastAutoKey !== autoKey) { this.lastAutoKey = autoKey; this.autosave(); }
      if (!this.settings.skipAfterChoices) this.setSkip(false);
      const options = ins.options.filter((o) => !o.cond || this.test(o.cond));
      if (!options.length) { this.state.pc = ins.end; return; }
      if (ins.prompt) {
        const text = this.interp(ins.prompt);
        this.ui.textbox.say({ name: '', text, instant: this.isSkipping() });
        this.history.push({ who: '', text: VN.stripTags(text) });
      }
      this.ui.textbox.hideNext();
      this.instantNext = false;
      // what each option costs or needs, and how it feels
      const shown = options.map((o) => {
        const cost = this.parseCost(o.cost);
        const needs = this.parseCost(o.needs);
        const gain = o.gain ? this.parseCost(o.gain) : null;
        return { text: this.interp(o.text), tone: o.tone || this.guessTone(o), cost, needs, gain, locked: !!((cost && !cost.ok) || (needs && !needs.ok)) };
      });
      // never leave the player without a way forward
      if (shown.every((o) => o.locked)) shown[0].locked = false;
      const base = ins.time != null ? ins.time : this.story.choiceTime != null ? this.story.choiceTime : 0;
      const factor = TIMER_FACTOR[this.settings.choiceTimer == null ? 2 : this.settings.choiceTimer] || 0;
      const time = this.isSkipping() ? 0 : base * factor;
      const idx = await this.guard(this.ui.showChoices(shown, { time }));
      // letting the time run out is a choice too
      const hesitated = idx < 0;
      const opt = hesitated ? ins.hesitate || options[0] : options[idx];
      const picked = hesitated ? '(You hesitated, and said nothing.)' : VN.stripTags(this.interp(opt.text));
      this.history.push({ choice: true, text: picked });
      const before = this.karmaSnapshot();
      if (!hesitated) {
        const s = shown[idx];
        if (s.cost && s.cost.ok) this.payCost(s.cost);
        if (s.gain) { if (s.gain.kind === 'francs') this.changeFrancs(s.gain.n); else this.gainItem(s.gain.id); }
      }
      for (const a of opt.effects) this.assign(a);
      const felt = this.karmaFelt(before);
      if (!felt.length) this.ui.settleChoice();
      this.state.choices = [...(this.state.choices || []), { chapter: this.state.chapter, text: picked, felt, tone: hesitated ? 'quiet' : shown[idx].tone }];
      this.state.lastTone = hesitated ? 'hesitate' : shown[idx].tone;
      // the flowchart: what was taken in this journey, and in every journey so far
      const taken = hesitated ? 'h' : ins.options.indexOf(opt);
      this.state.picks = { ...(this.state.picks || {}), [ins.key]: taken };
      const flow = this.persistent.flow || (this.persistent.flow = {});
      if (!(flow[ins.key] || []).includes(taken)) flow[ins.key] = [...(flow[ins.key] || []), taken];
      this.persistent.seen[ins.key] = 1;
      this.state.pc = opt.target;
      if (this.onStep) this.onStep();
    }

    async op_input(ins) {
      this.checkpoint();
      this.setSkip(false);
      const value = await this.guard(this.ui.ask(this.interp(ins.prompt), ins.default, ins.max));
      this.setVar(ins.name, value);
      this.state.pc++;
    }

    async op_poem(ins) {
      this.checkpoint();
      this.setSkip(false);
      this.ui.textbox.hideBox();
      const result = await this.guard(this.poem.run({ words: ins.words, title: ins.title && this.interp(ins.title) }));
      for (const [id, pts] of Object.entries(result.totals)) this.setVar(`poem_${id}`, pts);
      this.setVar('poem_winner', result.winner);
      this.setVar('poem_text', result.text);
      this.history.push({ choice: true, text: `Wrote: ${result.text}` });
      this.state.pc++;
      if (this.onStep) this.onStep();
    }

    transition(ins, fallback) {
      const fast = this.isSkipping();
      const kind = fast ? 'none' : ins.with || fallback;
      const ms = fast ? 0 : ins.duration != null ? ins.duration * 1000 : TRANS_MS[kind];
      return { kind, ms };
    }

    async op_scene(ins) {
      const sc = this.state.scene;
      sc.bg = ins.bg;
      // the places this playthrough has passed through (the end credits show them again)
      const seen = this.state.seenBgs || (this.state.seenBgs = []);
      if (ins.bg !== 'black' && !seen.includes(ins.bg)) seen.push(ins.bg);
      sc.sprites = {};
      sc.cg = null;
      this.stage.setSpeaker(null);
      this.ui.textbox.hideBox();
      this.ui.textbox.hideCentered();
      const { kind, ms } = this.transition(ins, 'dissolve');
      await this.guard(this.stage.prepare(sc));
      if (kind === 'fade' || kind === 'flash') {
        const color = kind === 'flash' ? '#fff' : '#000';
        await this.sleep(this.stage.fadeTo(1, ms / 2, color));
        this.stage.sync(sc, { instant: true });
        await this.sleep(this.stage.fadeTo(0, ms / 2, color));
      } else {
        await this.sleep(this.stage.sync(sc, { instant: kind === 'none', duration: ms }));
      }
      // Every place has its own sound (wind, the sea, the mill...), unless the script says otherwise.
      const amb = this.story.bgSound[ins.bg];
      if (amb) {
        if (!this.state.ambience || this.state.ambience.name !== amb.name) {
          this.state.ambience = { name: amb.name, volume: amb.volume };
          this.audio.channel('ambience').play(amb.name, 2.5, amb.volume);
        }
      } else if (this.state.ambience && this.story.bgSound && Object.keys(this.story.bgSound).length) {
        this.state.ambience = null;
        this.audio.channel('ambience').stop(2);
      }
      // Arriving somewhere new: say where we are.
      const place = this.story.places[ins.bg];
      const key = place ? `${place.name}|${place.region}` : null;
      if (place && key !== this.shownPlace && !this.isSkipping()) this.ui.placeCaption(place);
      if (place || ins.bg === 'black') this.shownPlace = key;
      this.state.pc++;
    }

    async op_show(ins) {
      const sc = this.state.scene;
      const cur = sc.sprites[ins.id];
      if (cur) {
        if (ins.expr) cur.expr = ins.expr;
        if (ins.at != null) cur.at = ins.at;
      } else {
        sc.nextOrder = (sc.nextOrder || 0) + 1;
        sc.sprites[ins.id] = { expr: ins.expr || 'neutral', at: ins.at, order: sc.nextOrder };
      }
      const { kind, ms } = this.transition(ins, 'dissolve');
      await this.guard(this.stage.prepare(sc));
      const d = kind === 'none' ? 0 : ins.duration != null ? ms : kind === 'slow' ? 1200 : 320;
      const took = this.stage.sync(sc, { instant: d === 0, duration: d });
      // Let the next line start while the sprite is still settling in.
      await this.sleep(Math.min(took, 160));
      this.state.pc++;
    }

    async op_hide(ins) {
      const sc = this.state.scene;
      if (ins.id === 'all') sc.sprites = {};
      else delete sc.sprites[ins.id];
      const { kind, ms } = this.transition(ins, 'dissolve');
      const d = kind === 'none' ? 0 : ins.duration != null ? ms : kind === 'slow' ? 1200 : 280;
      const took = this.stage.sync(sc, { instant: d === 0, duration: d });
      await this.sleep(Math.min(took, 160));
      this.state.pc++;
    }

    async op_cg(ins) {
      const sc = this.state.scene;
      sc.cg = ins.name;
      if (ins.name) this.ui.textbox.hideBox();
      const { kind, ms } = this.transition(ins, 'dissolve');
      await this.guard(this.stage.prepare(sc));
      await this.sleep(this.stage.sync(sc, { instant: kind === 'none', duration: kind === 'slow' ? 1600 : ms || 0 }));
      this.state.pc++;
    }

    op_tint(ins) {
      this.state.scene.tint = ins.color === 'none' ? null : { color: ins.color, opacity: ins.opacity };
      this.stage.applyLook(this.state.scene, this.isSkipping());
      this.state.pc++;
    }

    op_filter(ins) {
      this.state.scene.filter = ins.value === 'none' ? null : ins.value;
      this.stage.applyLook(this.state.scene, this.isSkipping());
      this.state.pc++;
    }

    op_vignette(ins) {
      this.state.scene.vignette = ins.on;
      this.stage.applyLook(this.state.scene, this.isSkipping());
      this.state.pc++;
    }

    op_effect(ins) {
      if (!this.isSkipping()) this.stage.effect(ins.kind, ins.duration, ins.color, this.audio);
      this.state.pc++;
    }

    op_window(ins) {
      if (ins.show) this.ui.textbox.showBox(); else this.ui.textbox.hideBox();
      this.state.pc++;
    }

    async op_chapter(ins) {
      this.state.chapter = ins.subtitle ? `${ins.title} · ${ins.subtitle}` : ins.title;
      this.state.chaptersSeen = (this.state.chaptersSeen || 0) + 1;
      (this.persistent.chapters || (this.persistent.chapters = {}))[ins.title] = 1;
      this.savePersistent();
      this.ui.textbox.hideBox();
      this.ui.textbox.hideCentered();
      this.autosavePending = true;
      // the card wears the mood of the road the player is on
      const { route, changed } = this.updateRoute();
      await this.guard(this.ui.chapterCard(this.interp(ins.title), this.interp(ins.subtitle), { fast: this.isSkipping(), seal: ins.seal, kanji: ins.kanji, mood: route, turned: changed }));
      this.state.pc++;
    }

    async op_minigame(ins) {
      this.checkpoint();
      this.setSkip(false);
      this.ui.textbox.hideBox();
      this.stage.setSpeaker(null);
      const result = await this.guard(VN.playMinigame(this.ui, ins.name, ins.arg));
      this.setVar(ins.into, result);
      this.state.pc++;
    }

    op_item(ins) {
      if (ins.gain) this.gainItem(ins.id, { quiet: this.isSkipping() }); else this.loseItem(ins.id, { quiet: this.isSkipping() });
      this.state.pc++;
    }

    op_francs(ins) {
      this.changeFrancs(ins.delta, { quiet: this.isSkipping() });
      this.state.pc++;
    }

    async op_cutscene(ins) {
      this.ui.textbox.hideBox();
      this.ui.textbox.hideCentered();
      this.stage.setSpeaker(null);
      if (!this.isSkipping() && (globalThis.VN_CUTSCENES || {})[ins.name]) {
        const ctx = { ui: this.ui, stage: this.stage, audio: this.audio, settings: this.settings, story: this.story };
        await this.guard(VN.playCutscene(ctx, ins.name));
      }
      this.state.pc++;
    }

    /** The first time we meet someone: a moment that presents them, then the conversation goes on. */
    async op_introduce(ins) {
      const met = this.state.met || (this.state.met = {});
      const ch = this.story.characters[ins.id];
      if (!met[ins.id] && ch) {
        met[ins.id] = 1;
        if (!this.isSkipping()) {
          const intro = this.story.intros[ins.id] || {};
          this.ui.textbox.hideBox();
          this.ui.textbox.hideCentered();
          this.stage.setSpeaker(this.state.scene.sprites[ins.id] ? ins.id : null);
          await this.guard(this.ui.introCard({
            id: ins.id,
            name: VN.plainName(this.interp(ch.name)),
            color: ch.color,
            subtitle: intro.subtitle ? this.interp(intro.subtitle) : '',
            kanji: intro.kanji,
            sound: intro.sound,
            face: ch.face ? VN.assets.lookup('face', ch.face) : null,
          }));
        }
      }
      this.state.pc++;
    }

    /** A name at last: the character's card again, the old name giving way to the new one. */
    async op_reveal(ins) {
      const ch = this.story.characters[ins.id];
      if (ch && !this.isSkipping()) {
        const intro = this.story.intros[ins.id] || {};
        this.ui.textbox.hideBox();
        this.ui.textbox.hideCentered();
        await this.guard(this.ui.introCard({
          id: ins.id,
          name: VN.plainName(this.interp(ch.name)),
          color: ch.color,
          subtitle: ins.text ? this.interp(ins.text) : 'A name, at last.',
          kanji: intro.kanji,
          sound: 'temple_bell',
          face: ch.face ? VN.assets.lookup('face', ch.face) : null,
          reveal: '???',
        }));
      }
      this.state.pc++;
    }

    op_notify(ins) {
      this.ui.whisper(this.interp(ins.text), '#e9c46a', { quiet: this.isSkipping() });
      this.state.pc++;
    }

    async op_pause(ins) {
      if (!this.isSkipping()) {
        await this.guard(new Promise((resolve) => {
          this.waiter = resolve;
          if (ins.seconds != null) setTimeout(() => { if (this.waiter === resolve) { this.waiter = null; resolve(); } }, ins.seconds * 1000);
        }));
      }
      this.state.pc++;
    }

    op_play(ins) {
      if (ins.channel === 'sound') {
        if (!this.isSkipping()) this.audio.playSound(ins.name, ins.volume);
      } else {
        this.state[ins.channel] = { name: ins.name, volume: ins.volume };
        this.audio.channel(ins.channel).play(ins.name, ins.fadein, ins.volume);
      }
      this.state.pc++;
    }

    op_stop(ins) {
      if (ins.channel === 'music' || ins.channel === 'ambience') {
        this.state[ins.channel] = null;
        this.audio.channel(ins.channel).stop(ins.fadeout);
      }
      this.state.pc++;
    }

    op_rollback(ins) {
      this.state.noRollback = !ins.on;
      if (!ins.on) this.rollbackStack = [];
      this.state.pc++;
    }

    async op_ending(ins) {
      this.setSkip(false);
      this.setAuto(false);
      this.persistent.endings[ins.id] = { time: Date.now(), title: ins.title };
      VN.store.set('persistent', this.persistent);
      this.ui.textbox.hideBox();
      this.ui.textbox.hideCentered();
      this.stage.setSpeaker(null);
      // each ending has its own music: the kind of ending decides, unless the script names one
      const music = ins.music || { good: 'home', true: 'revelation', tragic: 'lament', bad: 'sorrow' }[ins.kind] || 'home';
      this.audio.ambience.stop(2);
      this.audio.music.play(music, 3, 1);
      this.state.music = { name: music, volume: 1 };
      await this.sleep(this.stage.fadeTo(1, 1400));
      const endings = this.story.endings;
      const found = endings.filter((e) => this.persistent.endings[e.id]).length;
      const index = Math.max(0, endings.findIndex((e) => e.id === ins.id));
      await this.guard(this.ui.endingReveal(ins, { index, total: endings.length, found }));
      const st = this.state;
      const items = (st.items || []).map((id) => this.itemInfo(id)).filter(Boolean).map((it) => it.name);
      const cast = ['herve', 'helene', 'balbadiou', 'harakei', 'woman', 'blanche']
        .map((id) => this.story.characters[id]).filter(Boolean).map((ch) => VN.plainName(this.interp(ch.name)));
      await this.guard(this.ui.credits(ins, {
        scenes: (st.seenBgs || []).slice(),
        chapters: st.chaptersSeen || 0,
        choices: (st.choices || []).length,
        items,
        francs: this.getVar('francs') || 0,
        cast,
      }));
      const next = await this.guard(this.ui.endingScreen(ins, found, endings.length, st.choices || []));
      if (next === 'exit') await this.guard(this.ui.farewell());
      this.returnToTitle();
    }

    async endGame() {
      this.ui.textbox.hideBox();
      this.audio.stopAll(2);
      await this.sleep(this.stage.fadeTo(1, 1200));
      this.returnToTitle();
    }

    // ---- game lifecycle -------------------------------------------------------------------------------
    enterGame() {
      this.ui.closeAll();
      this.ui.titleEntry = null;
      this.ui.menuEntry = null;
      this.ui.setInGame(true);
      this.inGame = true;
      this.setSkip(false);
      this.setAuto(false);
    }

    newGame(label) {
      this.abort();
      this.enterGame();
      this.history = [];
      this.rollbackStack = [];
      this.current = null;
      this.audio.stopAll(0.8);
      const st = this.freshState();
      if (label && label in this.story.labels) { st.pc = this.story.labels[label]; st.label = label; }
      this.restore(st, { instant: false });
    }

    continueGame() {
      const slot = this.latestSave();
      if (slot) this.load(slot);
    }

    returnToTitle() {
      this.abort();
      this.inGame = false;
      this.setSkip(false);
      this.setAuto(false);
      this.skipHeld = false;
      this.ui.cancelTransient();
      this.poem.cancel();
      this.ui.closeAll();
      this.ui.titleEntry = null;
      this.ui.menuEntry = null;
      this.ui.textbox.clear();
      this.ui.setHidden(false);
      this.ui.setInGame(false);
      this.state = this.freshState();
      this.stage.setSpeaker(null);
      this.stage.reset(this.state.scene);
      this.audio.stopAll(1);
      if (this.story.titleMusic) this.audio.music.play(this.story.titleMusic, 1.5, 1);
      this.ui.showTitle();
    }

    // ---- saving ---------------------------------------------------------------------------------------
    allSlots() {
      return VN.SLOT_PAGES.flatMap((p) => p.slots);
    }

    readSave(slot) {
      const data = VN.store.get(`save.${slot}`, null);
      return data && data.state ? data : null;
    }

    latestSave() {
      let best = null, bestTime = -1;
      for (const slot of this.allSlots()) {
        const d = this.readSave(slot);
        if (d && d.time > bestTime) { best = slot; bestTime = d.time; }
      }
      return best;
    }

    previewFor(snap) {
      const ins = this.program[snap.pc];
      if (!ins) return '';
      if (ins.op === 'say') {
        const ch = ins.who && this.story.characters[ins.who];
        const who = ch ? `${VN.plainName(this.interp(ch.name))}: ` : '';
        return (who + VN.stripTags(this.interp(ins.text))).slice(0, 140);
      }
      if (ins.op === 'menu') return 'At a choice';
      if (ins.op === 'poem') return 'Writing';
      return '';
    }

    save(slot) {
      const snap = this.current;
      if (!snap || !this.inGame) { this.ui.toast("There's nothing to save yet"); return false; }
      const state = VN.clone(snap);
      delete state.historyLen;
      const base = this.story.labels[state.label];
      const data = {
        v: 1,
        time: Date.now(),
        hash: this.story.hash,
        label: state.label,
        offset: base != null ? state.pc - base : 0,
        chapter: state.chapter,
        preview: this.previewFor(snap),
        state,
        history: this.history.slice(0, snap.historyLen).slice(-120),
      };
      if (!VN.store.set(`save.${slot}`, data) && VN.store.persistentAvailable) {
        this.ui.toast('Saving failed: browser storage is full', 'error');
        return false;
      }
      return true;
    }

    autosave() {
      if (!this.inGame) return;
      const n = (this.persistent.autoIndex % 5) + 1;
      this.persistent.autoIndex++;
      this.savePersistent();
      this.save(`auto-${n}`);
    }

    load(slot) {
      const data = this.readSave(slot);
      if (!data) return;
      const state = VN.clone(data.state);
      if (data.hash !== this.story.hash) {
        // The script changed since this save; find the same spot by label.
        const base = this.story.labels[data.label];
        if (base != null) state.pc = Math.min(base + (data.offset || 0), this.program.length - 1);
      }
      this.abort();
      this.enterGame();
      this.history = (data.history || []).slice();
      this.rollbackStack = [];
      this.current = null;
      this.restore(state);
      this.ui.toast('Loaded');
    }

    quickSave() {
      if (this.save('quick')) { this.audio.ui('save'); this.ui.toast('Quick saved'); }
    }

    async quickLoad() {
      if (!this.readSave('quick')) { this.ui.toast('No quick save yet'); return; }
      if (await this.ui.confirm('Load your quick save? Anything since then will be lost.')) this.load('quick');
    }

    deleteSave(slot) {
      VN.store.remove(`save.${slot}`);
    }

    wipeAll() {
      VN.store.clearAll();
      this.persistent = { vars: {}, seen: {}, endings: {}, warned: true, autoIndex: 0, edition: this.story.edition || 1 };
      VN.store.set('persistent', this.persistent);
      Object.assign(this.settings, VN.DEFAULT_SETTINGS);
      this.saveSettings();
      this.ui.applySettings();
    }
  }

  VN.Engine = Engine;
  VN.ABORT = ABORT;
})();
