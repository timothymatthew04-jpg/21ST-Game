/*
 * audio.js — music/ambience channels with fades, one-shot sounds, and small
 * synthesized UI sounds (so the menus feel alive before any audio files exist).
 */
(function () {
  'use strict';
  const VN = (globalThis.VN = globalThis.VN || {});

  class Channel {
    constructor(audio, kind) {
      this.audio = audio;
      this.kind = kind;
      this.el = null;
      this.name = null;
      this.volume = 1;
      this.token = 0;
    }

    target() {
      return this.volume * this.audio.musicVolume;
    }

    async play(name, fadein = 0, volume = 1) {
      if (this.name === name) {
        this.volume = volume;
        if (this.el) fade(this.el, this.target(), 0.4);
        return;
      }
      this.stop(Math.max(fadein, 0.4));
      const token = ++this.token;
      this.name = name;
      this.volume = volume;
      const url = await VN.assets.resolve(this.kind, name);
      if (!url || token !== this.token) return;
      const el = new Audio(url);
      el.loop = true;
      el.volume = 0;
      this.el = el;
      const start = () => el.play().then(() => fade(el, this.target(), fadein || 0.25)).catch(() => {});
      start();
      this.audio.onUnlock(() => { if (this.el === el && el.paused) start(); });
    }

    stop(fadeout = 0) {
      this.token++;
      const el = this.el;
      this.el = null;
      this.name = null;
      if (el) fade(el, 0, fadeout, () => { el.pause(); el.src = ''; });
    }

    refreshVolume() {
      if (this.el) fade(this.el, this.target(), 0.15);
    }
  }

  function fade(el, to, seconds, done) {
    cancelAnimationFrame(el._fadeRaf);
    const from = el.volume;
    const ms = Math.max(0, seconds * 1000);
    if (ms === 0) {
      el.volume = VN.clamp(to, 0, 1);
      if (done) done();
      return;
    }
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      el.volume = VN.clamp(from + (to - from) * k, 0, 1);
      if (k < 1) el._fadeRaf = requestAnimationFrame(step);
      else if (done) done();
    };
    el._fadeRaf = requestAnimationFrame(step);
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
      this.music.stop(fadeout);
      this.ambience.stop(fadeout);
    }

    refreshVolumes() {
      this.music.refreshVolume();
      this.ambience.refreshVolume();
    }

    // ---- synthesized sounds ------------------------------------------------
    tone(freq, dur, { type = 'square', vol = 0.05, slide = 0, delay = 0 } = {}) {
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
        case 'hover': this.tone(880, 0.04, { vol: 0.02 }); break;
        case 'select': this.tone(660, 0.06, { vol: 0.04 }); this.tone(990, 0.08, { vol: 0.04, delay: 0.05 }); break;
        case 'back': this.tone(520, 0.07, { vol: 0.035, slide: -180 }); break;
        case 'save': this.tone(784, 0.07, { vol: 0.04 }); this.tone(1175, 0.12, { vol: 0.04, delay: 0.07 }); break;
        case 'error': this.tone(180, 0.15, { vol: 0.05, type: 'sawtooth' }); break;
        case 'page': this.tone(1320, 0.03, { vol: 0.02, type: 'triangle' }); break;
        case 'chime': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.35, { vol: 0.03, type: 'triangle', delay: i * 0.09 })); break;
        case 'pick': this.tone(1046, 0.05, { vol: 0.035, type: 'triangle' }); this.tone(1568, 0.09, { vol: 0.03, type: 'triangle', delay: 0.04 }); break;
      }
    }

    blip(freq) {
      if (!this.settings.textBlips) return;
      const now = performance.now();
      if (now - this.lastBlip < 45) return;
      this.lastBlip = now;
      this.tone(freq * (0.96 + Math.random() * 0.08), 0.035, { vol: 0.025, type: 'square' });
    }
  }

  VN.AudioSystem = AudioSystem;
})();
