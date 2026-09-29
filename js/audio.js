/*
 * audio.js — music/ambience channels with fades, one-shot sounds, and small
 * synthesized UI sounds (so the menus feel alive before any audio files exist).
 */
(function () {
  'use strict';
  const VN = (globalThis.VN = globalThis.VN || {});

  // Seconds of overlap between the end of a looping track and its next pass.
  // Tracks usually end in a decaying tail and some silence, and restarting an
  // <audio loop> leaves an audible gap; overlapping the passes keeps it seamless.
  const XFADE = 5;

  class Channel {
    constructor(audio, kind) {
      this.audio = audio;
      this.kind = kind;
      this.el = null; // the pass currently playing (or fading in)
      this.els = new Set(); // every element still sounding, including ones fading out
      this.url = null;
      this.name = null;
      this.volume = 1;
      this.duckLevel = 1; // briefly lowered while a choice weighs on the player
      this.token = 0;
    }

    target() {
      return this.volume * this.audio.musicVolume * this.duckLevel;
    }

    duck(level, seconds) {
      this.duckLevel = level;
      if (this.el) ramp(this.el, this.target(), seconds);
      if (this.syn) this.syn.gain(this.target(), seconds);
    }

    async play(name, fadein = 0, volume = 1) {
      if (this.name === name) {
        this.volume = volume;
        if (this.el) ramp(this.el, this.target(), 0.4);
        if (this.syn) this.syn.gain(this.target(), 0.4);
        return;
      }
      this.stop(Math.max(fadein, 0.4));
      const token = ++this.token;
      this.name = name;
      this.volume = volume;
      const url = await VN.assets.resolve(this.kind, name);
      if (token !== this.token) return;
      if (url) {
        this.url = url;
        this.pass(fadein || 0.25);
      } else this.startSynth(name, fadein || 1);
    }

    /** No recording of this track: let the synthesizer (js/synth.js) play it instead. */
    startSynth(name, fadein) {
      const go = () => {
        if (this.name !== name || this.syn) return;
        const S = this.audio.getSynth();
        if (!S) return;
        this.syn = this.kind === 'ambience' ? S.ambience(name, 0) : S.track(name, 0);
        if (this.syn) this.syn.gain(this.target(), fadein);
      };
      if (this.audio.ctx && this.audio.ctx.state === 'running') go();
      else this.audio.onUnlock(go);
    }

    /** Start one pass through the track; near its end the next pass fades in over it. */
    pass(fadein) {
      const el = new Audio(this.url);
      el.preload = 'auto';
      // Some browsers (iOS) ignore the volume property; there, fall back to a plain loop.
      el.volume = 0.5;
      const crossfade = Math.abs(el.volume - 0.5) < 0.01;
      el.volume = 0;
      el.loop = !crossfade;
      this.el = el;
      this.els.add(el);
      if (crossfade) {
        let handedOver = false;
        const next = () => {
          if (handedOver || this.el !== el) return;
          handedOver = true;
          this.pass(XFADE / 2);
          ramp(el, 0, XFADE, () => this.release(el));
        };
        el.addEventListener('loadedmetadata', () => { if (el.duration < XFADE * 3) el.loop = true; });
        el.addEventListener('timeupdate', () => {
          if (!el.loop && Number.isFinite(el.duration) && el.duration - el.currentTime <= XFADE) next();
        });
        el.addEventListener('ended', () => { next(); this.release(el); });
      }
      const start = () => el.play().then(() => ramp(el, this.target(), fadein)).catch(() => {});
      start();
      this.audio.onUnlock(() => { if (this.el === el && el.paused) start(); });
    }

    release(el) {
      clearInterval(el._ramp);
      el.pause();
      el.removeAttribute('src');
      el.load();
      this.els.delete(el);
    }

    stop(fadeout = 0) {
      this.token++;
      this.el = null;
      this.name = null;
      if (this.syn) { this.syn.stop(fadeout); this.syn = null; }
      for (const el of this.els) ramp(el, 0, fadeout, () => this.release(el));
    }

    refreshVolume() {
      if (this.el) ramp(this.el, this.target(), 0.15);
      if (this.syn) this.syn.gain(this.target(), 0.15);
    }
  }

  // Timer-driven (not requestAnimationFrame) so fades still finish in a background tab.
  function ramp(el, to, seconds, done) {
    clearInterval(el._ramp);
    const from = el.volume;
    to = VN.clamp(to, 0, 1);
    const ms = Math.max(0, seconds * 1000);
    if (ms === 0) {
      el.volume = to;
      if (done) done();
      return;
    }
    const t0 = performance.now();
    el._ramp = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      el.volume = VN.clamp(from + (to - from) * k, 0, 1);
      if (k < 1) return;
      clearInterval(el._ramp);
      if (done) done();
    }, 30);
  }

  class AudioSystem {
    constructor(settings) {
      this.settings = settings;
      this.music = new Channel(this, 'music');
      this.ambience = new Channel(this, 'ambience');
      this.ctx = null;
      this.unlocked = false;
      this.unlockCallbacks = [];
      this.lastBlip = 0;
      this.bab = null;
      this.narrator = new Narrator(settings);
    }

    get musicVolume() { return this.settings.musicVolume; }
    get sfxVolume() { return this.settings.sfxVolume; }

    /** Browsers only allow sound after the player interacts; call on first input. */
    unlock() {
      if (!this.ctx) {
        try {
          const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext;
          if (Ctx) this.ctx = new Ctx();
        } catch (e) { this.ctx = null; }
      }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      if (!this.unlocked) {
        this.unlocked = true;
        const cbs = this.unlockCallbacks;
        this.unlockCallbacks = [];
        cbs.forEach((cb) => cb());
      }
    }

    onUnlock(cb) {
      if (this.unlocked) return;
      this.unlockCallbacks.push(cb);
    }

    channel(name) {
      return name === 'ambience' ? this.ambience : this.music;
    }

    /** The synthesizer for music, ambience and sounds that have no audio file. */
    getSynth() {
      if (!this.ctx || !VN.Synth) return null;
      if (!this.synth) this.synth = new VN.Synth(this.ctx);
      return this.synth;
    }

    /** A synthesized effect for the interface (chapter cards, cutscenes), optionally a moment from now. */
    fx(name, { volume = 1, delay = 0 } = {}) {
      const S = this.ctx && this.ctx.state === 'running' ? this.getSynth() : null;
      if (S && this.sfxVolume > 0) S.sfx(name, volume * this.sfxVolume, delay);
    }

    async playSound(name, volume = 1) {
      const url = await VN.assets.resolve('sound', name);
      if (!url) {
        const S = this.ctx && this.ctx.state === 'running' ? this.getSynth() : null;
        if (S) S.sfx(name, volume * this.sfxVolume);
        return;
      }
      const el = new Audio(url);
      el.volume = VN.clamp(volume * this.sfxVolume, 0, 1);
      el.play().catch(() => {});
    }

    /** Bring channels in line with saved state (used by load and rollback). */
    sync(state) {
      const m = state.music;
      if (m) this.music.play(m.name, 0.6, m.volume); else this.music.stop(0.6);
      const a = state.ambience;
      if (a) this.ambience.play(a.name, 0.6, a.volume); else this.ambience.stop(0.6);
    }

    stopAll(fadeout = 0.8) {
      this.music.duckLevel = 1;
      this.music.stop(fadeout);
      this.ambience.stop(fadeout);
    }

    refreshVolumes() {
      this.music.refreshVolume();
      this.ambience.refreshVolume();
    }

    // ---- synthesized sounds ------------------------------------------------
    tone(freq, dur, { type = 'triangle', vol = 0.05, slide = 0, delay = 0 } = {}) {
      const ctx = this.ctx;
      if (!ctx || ctx.state !== 'running') return;
      const v = vol * this.sfxVolume;
      if (v <= 0) return;
      const t = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (slide) osc.frequency.linearRampToValueAtTime(freq + slide, t + dur);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(v, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    }

    noise(dur = 0.4, vol = 0.08) {
      const ctx = this.ctx;
      if (!ctx || ctx.state !== 'running') return;
      const v = vol * this.sfxVolume;
      if (v <= 0) return;
      const len = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (Math.random() < 0.1 ? 1 : 0.4);
      const src = ctx.createBufferSource();
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(v, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      src.buffer = buf;
      src.connect(gain).connect(ctx.destination);
      src.start();
    }

    ui(kind) {
      if (!this.settings.uiSounds) return;
      switch (kind) {
        case 'hover': this.tone(740, 0.05, { vol: 0.025, type: 'sine' }); break;
        case 'select': this.tone(587, 0.09, { vol: 0.05 }); this.tone(880, 0.12, { vol: 0.04, delay: 0.06 }); break;
        case 'back': this.tone(494, 0.1, { vol: 0.045, slide: -120 }); break;
        case 'save': this.tone(659, 0.1, { vol: 0.05 }); this.tone(988, 0.16, { vol: 0.045, delay: 0.08 }); break;
        case 'error': this.tone(196, 0.18, { vol: 0.06 }); break;
        case 'page': this.tone(1320, 0.03, { vol: 0.02, type: 'triangle' }); break;
        case 'chime': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.35, { vol: 0.03, type: 'triangle', delay: i * 0.09 })); break;
        case 'pick': this.tone(1046, 0.05, { vol: 0.035, type: 'triangle' }); this.tone(1568, 0.09, { vol: 0.03, type: 'triangle', delay: 0.04 }); break;
      }
    }

    /** The sound of a choice landing: warm for a kind choice, a low heartbeat for a heavy one. */
    karma(weight) {
      if (weight === 'heavy') {
        this.tone(98, 0.5, { type: 'sine', vol: 0.12, slide: -30 });
        this.tone(92, 0.45, { type: 'sine', vol: 0.09, slide: -26, delay: 0.26 });
        this.tone(233, 1.2, { type: 'triangle', vol: 0.02, delay: 0.05 });
      } else if (weight === 'light') {
        [523, 659, 784].forEach((f, i) => this.tone(f, 1.1, { type: 'sine', vol: 0.028, delay: i * 0.07 }));
      } else {
        this.tone(659, 0.9, { type: 'sine', vol: 0.025 });
        this.tone(988, 0.7, { type: 'sine', vol: 0.014, delay: 0.08 });
      }
    }

    // ---- voices ------------------------------------------------------------
    get voiceVolume() { return this.settings.voiceVolume == null ? 0.8 : this.settings.voiceVolume; }

    /** A character starts a new line: their muffled voice begins a fresh phrase. */
    voiceLine(profile) {
      this.bab = profile && this.settings.charVoices !== false ? { profile, last: 0, gap: 0, n: 0, vowel: 'a', consonant: false } : null;
      return !!this.bab;
    }

    /** Each letter typed: now and then it becomes a syllable of the character's voice. */
    voiceChar(ch) {
      const b = this.bab;
      if (!b) return;
      const low = ch.toLowerCase().normalize('NFD').charAt(0);
      if (!/\p{L}/u.test(low)) return;
      if ('aeiouy'.includes(low)) b.vowel = low; else b.consonant = true;
      const now = performance.now();
      if (now - b.last < b.gap) return;
      b.last = now;
      b.gap = b.profile.pace * (0.75 + Math.random() * 0.55);
      const S = this.ctx && this.ctx.state === 'running' ? this.getSynth() : null;
      const vol = 0.26 * this.voiceVolume;
      if (!S || vol <= 0) return;
      // a phrase starts a little high and settles as it goes on
      const bend = 1.05 - Math.min(0.1, b.n * 0.007);
      b.n++;
      S.syllable(b.profile, b.vowel, vol * (0.7 + Math.random() * 0.45), bend, b.consonant && Math.random() < 0.6);
      b.consonant = false;
    }

    blip(freq) {
      if (!this.settings.textBlips) return;
      const now = performance.now();
      if (now - this.lastBlip < 45) return;
      this.lastBlip = now;
      this.tone(freq * (0.96 + Math.random() * 0.08), 0.04, { vol: 0.03, type: 'triangle' });
    }
  }

  /**
   * The narrator: narration is read aloud by the best voice the browser has (the system's own
   * text-to-speech). Browsers differ a lot here: Edge and Chrome offer natural "online" voices,
   * others only robotic ones, and some none at all, in which case the narrator stays silent.
   */
  class Narrator {
    constructor(settings) {
      this.settings = settings;
      this.tts = globalThis.speechSynthesis || null;
      this.voices = [];
      this.pronounce = [];
      this.token = 0;
      this.held = []; // utterances are kept alive until they finish (Chrome drops their events otherwise)
      if (this.tts) {
        const load = () => { try { this.voices = this.tts.getVoices() || []; } catch (e) { this.voices = []; } };
        load();
        try { this.tts.addEventListener('voiceschanged', load); } catch (e) { /* older browsers */ }
      }
    }

    get available() { return !!this.tts && this.english().length > 0; }

    english() {
      return this.voices.filter((v) => /^en([-_]|$)/i.test(v.lang || ''));
    }

    /** The narrator's voice: the one chosen in Settings, else the most natural-sounding man's voice. */
    pick() {
      const list = this.english();
      if (!list.length) return null;
      const want = this.settings.narratorVoice;
      if (want) {
        const v = list.find((x) => x.voiceURI === want || x.name === want);
        if (v) return v;
      }
      return list.slice().sort((a, b) => scoreVoice(b) - scoreVoice(a))[0];
    }

    /** Read a line aloud. Resolves when it has been read (or straight away if it can't be). */
    speak(text, { soft = false } = {}) {
      this.stop();
      const vol = (this.settings.voiceVolume == null ? 0.8 : this.settings.voiceVolume);
      if (!this.tts || this.settings.narrator === false || vol <= 0) return Promise.resolve();
      const voice = this.pick();
      if (!voice) return Promise.resolve();
      let spoken = text;
      for (const [from, to] of this.pronounce) spoken = spoken.split(from).join(to);
      spoken = spoken.replace(/[“”"]/g, '').replace(/\s*[—–]\s*/g, ', ').replace(/…/g, '...').replace(/\s+/g, ' ').trim();
      if (!/[\p{L}\p{N}]/u.test(spoken)) return Promise.resolve();
      const token = ++this.token;
      const rate = (this.settings.narratorRate || 1) * (soft ? 0.92 : 0.97);
      // long lines are read a sentence at a time (some online voices stop after ~15 seconds)
      const parts = spoken.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) || [spoken];
      return new Promise((resolve) => {
        let i = 0;
        const next = () => {
          if (token !== this.token) { resolve(); return; }
          if (i >= parts.length) { this.held = []; resolve(); return; }
          const u = new SpeechSynthesisUtterance(parts[i++].trim());
          u.voice = voice;
          u.lang = voice.lang;
          u.rate = rate;
          u.pitch = soft ? 0.9 : 0.96;
          u.volume = Math.min(1, vol * (soft ? 0.85 : 1));
          u.onend = next;
          u.onerror = () => { if (token === this.token) { this.held = []; resolve(); } };
          this.held.push(u);
          try { this.tts.speak(u); } catch (e) { resolve(); }
        };
        next();
        this.finish = resolve;
      });
    }

    stop() {
      this.token++;
      if (this.finish) { const f = this.finish; this.finish = null; f(); }
      if (this.tts && (this.tts.speaking || this.tts.pending)) { try { this.tts.cancel(); } catch (e) { /* ignore */ } }
      this.held = [];
    }
  }

  function scoreVoice(v) {
    const n = `${v.name} ${v.voiceURI}`;
    let s = 0;
    if (/natural|neural|online|premium|enhanced/i.test(n)) s += 50;
    if (/google uk english male/i.test(n)) s += 40;
    if (/\b(daniel|arthur|ryan|guy|george|thomas|oliver|christopher|eric|roger|brian|william|andrew|davis|tony|jason|steffan|noah|evan|alfie|elliot|ethan)\b/i.test(n)) s += 30;
    if (/\b(male|man)\b/i.test(n) && !/female/i.test(n)) s += 20;
    if (/en[-_]gb/i.test(v.lang)) s += 12;
    else if (/en[-_](ie|au|ca)/i.test(v.lang)) s += 6;
    if (v.localService === false) s += 5;
    if (/compact|espeak|robot|whisper|zarvox|trinoids|albert|bad news|bells|boing|bubbles|cellos|jester|organ|superstar|wobble|novelty|fred|junior|ralph/i.test(n)) s -= 80;
    return s;
  }

  VN.Narrator = Narrator;
  VN.AudioSystem = AudioSystem;
})();
