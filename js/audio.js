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
    }

    async play(name, fadein = 0, volume = 1) {
      if (this.name === name) {
        this.volume = volume;
        if (this.el) ramp(this.el, this.target(), 0.4);
        return;
      }
      this.stop(Math.max(fadein, 0.4));
      const token = ++this.token;
      this.name = name;
      this.volume = volume;
      const url = await VN.assets.resolve(this.kind, name);
      if (!url || token !== this.token) return;
      this.url = url;
      this.pass(fadein || 0.25);
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
      for (const el of this.els) ramp(el, 0, fadeout, () => this.release(el));
    }

    refreshVolume() {
      if (this.el) ramp(this.el, this.target(), 0.15);
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

    async playSound(name, volume = 1) {
      const url = await VN.assets.resolve('sound', name);
      if (!url) return;
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

    blip(freq) {
      if (!this.settings.textBlips) return;
      const now = performance.now();
      if (now - this.lastBlip < 45) return;
      this.lastBlip = now;
      this.tone(freq * (0.96 + Math.random() * 0.08), 0.04, { vol: 0.03, type: 'triangle' });
    }
  }

  VN.AudioSystem = AudioSystem;
})();
