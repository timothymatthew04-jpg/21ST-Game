/*
 * synth.js — the game's music, ambience and sound effects, composed in code.
 *
 * Nothing here is a recording. Instruments are built from Web Audio oscillators,
 * noise and a plucked-string model (koto, guitar), all sent through a hall reverb.
 * Each music track is a small generative piece: a chord progression, an
 * accompaniment pattern and a melody made of motifs that return and vary, so it
 * never sounds like a short loop. Ambiences (sea, wind, rain, fire, birds,
 * crickets, the mill...) are shaped noise and little random events.
 *
 * The game asks for music and sounds by name; a real file of that name in
 * assets/ always wins, and the synth only plays when there is none.
 */
(function () {
  'use strict';
  const VN = globalThis.VN;

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function seeded(seed) {
    let s = seed >>> 0;
    const f = () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    f.pick = (a) => a[Math.floor(f() * a.length)];
    f.r = (a, b) => a + f() * (b - a);
    return f;
  }

  // ---------------------------------------------------------------- the engine: buses, reverb, instruments
  class Synth {
    constructor(ctx) {
      this.ctx = ctx;
      this.out = ctx.createDynamicsCompressor();
      this.out.threshold.value = -14;
      this.out.ratio.value = 4;
      this.out.connect(ctx.destination);
      this.reverb = ctx.createConvolver();
      this.reverb.buffer = this.impulse(3.4, 2.6);
      this.wet = ctx.createGain();
      this.wet.gain.value = 0.9;
      this.reverb.connect(this.wet).connect(this.out);
      this.noiseBuf = this.makeNoise(4);
      this.plucks = new Map();
    }

    impulse(seconds, decay) {
      const sr = this.ctx.sampleRate, n = Math.floor(sr * seconds);
      const buf = this.ctx.createBuffer(2, n, sr);
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay) * (i < sr * 0.012 ? i / (sr * 0.012) : 1);
      }
      return buf;
    }

    makeNoise(seconds) {
      const sr = this.ctx.sampleRate, n = Math.floor(sr * seconds);
      const buf = this.ctx.createBuffer(1, n, sr);
      const d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      return buf;
    }

    /** A bus: dry to `dest`, plus a send to the reverb. */
    bus(dest, send = 0.35) {
      const g = this.ctx.createGain();
      g.connect(dest);
      const s = this.ctx.createGain();
      s.gain.value = send;
      g.connect(s).connect(this.reverb);
      return g;
    }

    noise(dest, t, dur, { type = 'bandpass', f = 1000, q = 1, gain = 0.3, attack = 0.005, loop = false } = {}) {
      const ctx = this.ctx;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      src.loop = loop;
      const flt = ctx.createBiquadFilter();
      flt.type = type;
      flt.frequency.value = f;
      flt.Q.value = q;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain, t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(flt).connect(g).connect(dest);
      src.start(t, loop ? Math.random() * 3 : Math.random() * Math.max(0, 3.9 - dur));
      src.stop(t + dur + 0.05);
      return { src, flt, g };
    }

    /** A plucked string (Karplus-Strong), rendered once per pitch and cached. */
    pluckBuffer(midi, bright) {
      const key = `${midi}:${bright}`;
      if (this.plucks.has(key)) return this.plucks.get(key);
      const sr = this.ctx.sampleRate, f = mtof(midi);
      const n = Math.floor(sr * 3.2), N = Math.max(2, Math.round(sr / f));
      const buf = this.ctx.createBuffer(1, n, sr);
      const d = buf.getChannelData(0);
      const ring = new Float32Array(N);
      for (let i = 0; i < N; i++) ring[i] = (Math.random() * 2 - 1) * (0.6 + 0.4 * bright);
      // the string: each pass round the loop averages neighbours (dulling the tone) and loses a little energy
      const decay = 0.9965;
      const keep = 0.15 + bright * 0.5;
      let idx = 0;
      for (let i = 0; i < n; i++) {
        const cur = ring[idx];
        const nxt = ring[(idx + 1) % N];
        ring[idx] = (keep * cur + (1 - keep) * 0.5 * (cur + nxt)) * decay;
        d[i] = cur * 0.6;
        idx = (idx + 1) % N;
      }
      this.plucks.set(key, buf);
      return buf;
    }

    pluck(dest, midi, t, vel = 0.5, { bright = 0.5, dur = 2.8, bend = 0 } = {}) {
      const ctx = this.ctx;
      const src = ctx.createBufferSource();
      src.buffer = this.pluckBuffer(midi, bright);
      if (bend) { src.playbackRate.setValueAtTime(Math.pow(2, bend / 12), t); src.playbackRate.linearRampToValueAtTime(1, t + 0.18); }
      const g = ctx.createGain();
      g.gain.setValueAtTime(vel, t);
      g.gain.setTargetAtTime(0, t + dur * 0.8, dur * 0.2);
      src.connect(g).connect(dest);
      src.start(t);
      src.stop(t + dur + 0.5);
    }

    /** A soft felt piano: a few sine partials, each dying away at its own rate. */
    piano(dest, midi, t, vel = 0.4, dur = 2.5) {
      const ctx = this.ctx, f = mtof(midi);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 900 + vel * 3500;
      lp.connect(dest);
      for (const [k, a, d] of [[1, 0.55, dur], [2, 0.22, dur * 0.5], [3.004, 0.1, dur * 0.25], [4.01, 0.05, dur * 0.12]]) {
        const o = ctx.createOscillator();
        o.frequency.value = f * k;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vel * a, t + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g).connect(lp);
        o.start(t);
        o.stop(t + d + 0.05);
      }
    }

    musicBox(dest, midi, t, vel = 0.3) {
      const ctx = this.ctx, f = mtof(midi);
      for (const [k, a, d] of [[1, 1, 1.6], [3, 0.18, 0.5], [5.4, 0.06, 0.2]]) {
        const o = ctx.createOscillator();
        o.frequency.value = f * k;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vel * a, t + 0.003);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g).connect(dest);
        o.start(t);
        o.stop(t + d + 0.05);
      }
    }

    bell(dest, midi, t, vel = 0.3, dur = 4) {
      const ctx = this.ctx, f = mtof(midi);
      const car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
      car.frequency.value = f;
      mod.frequency.value = f * 2.76;
      mg.gain.setValueAtTime(f * 2.2, t);
      mg.gain.exponentialRampToValueAtTime(f * 0.05, t + dur * 0.6);
      mod.connect(mg).connect(car.frequency);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vel, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      car.connect(g).connect(dest);
      car.start(t); mod.start(t);
      car.stop(t + dur + 0.1); mod.stop(t + dur + 0.1);
    }

    /** A breathy bamboo flute: sine and triangle, a scoop up into the note, vibrato, breath noise. */
    flute(dest, midi, t, dur, vel = 0.2, { scoop = 0.6, vib = 0.012 } = {}) {
      const ctx = this.ctx, f = mtof(midi);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vel, t + Math.min(0.25, dur * 0.3));
      g.gain.setValueAtTime(vel, t + dur * 0.7);
      g.gain.linearRampToValueAtTime(0, t + dur);
      const lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = 5.2;
      lg.gain.setValueAtTime(0, t);
      lg.gain.linearRampToValueAtTime(f * vib, t + dur * 0.5);
      lfo.connect(lg);
      for (const [type, a] of [['sine', 1], ['triangle', 0.35]]) {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.setValueAtTime(f * Math.pow(2, -scoop / 12), t);
        o.frequency.exponentialRampToValueAtTime(f, t + 0.12);
        lg.connect(o.frequency);
        const og = ctx.createGain();
        og.gain.value = a;
        o.connect(og).connect(g);
        o.start(t);
        o.stop(t + dur + 0.05);
      }
      lfo.start(t);
      lfo.stop(t + dur + 0.05);
      const br = this.noise(g, t, dur, { type: 'bandpass', f: f * 2, q: 2, gain: 0.25, attack: 0.08 });
      br.g.gain.setValueAtTime(0.25, t + 0.1);
      g.connect(dest);
    }

    /** Sustained chord: detuned saws through a soft filter, slow in and out. */
    pad(dest, midis, t, dur, vel = 0.08, { cutoff = 900, attack = 1.2, vibrato = 0, type = 'sawtooth' } = {}) {
      const ctx = this.ctx;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = cutoff;
      lp.Q.value = 0.4;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vel, t + attack);
      g.gain.setValueAtTime(vel, t + Math.max(attack, dur - attack));
      g.gain.linearRampToValueAtTime(0, t + dur + attack * 0.5);
      lp.connect(g).connect(dest);
      let lfo;
      if (vibrato) { lfo = ctx.createOscillator(); lfo.frequency.value = 4.6; }
      for (const m of midis) for (const det of [-7, 6]) {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.value = mtof(m);
        o.detune.value = det;
        if (lfo) { const lg = ctx.createGain(); lg.gain.value = mtof(m) * vibrato; lfo.connect(lg).connect(o.frequency); }
        const og = ctx.createGain();
        og.gain.value = 1 / (midis.length * 2);
        o.connect(og).connect(lp);
        o.start(t);
        o.stop(t + dur + attack + 0.1);
      }
      if (lfo) { lfo.start(t); lfo.stop(t + dur + attack + 0.1); }
    }

    taiko(dest, t, vel = 0.6, pitch = 1) {
      const ctx = this.ctx;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(95 * pitch, t);
      o.frequency.exponentialRampToValueAtTime(48 * pitch, t + 0.35);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vel, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      o.connect(g).connect(dest);
      o.start(t);
      o.stop(t + 1);
      this.noise(dest, t, 0.18, { type: 'lowpass', f: 900, gain: vel * 0.5, attack: 0.002 });
    }

    // ---------------------------------------------------------------- music
    /** Start a named track; returns a handle with stop(fade) and gain(v). */
    track(name, volume) {
      const def = TRACKS[name];
      if (!def) return null;
      const ctx = this.ctx;
      const level = def.level || 1;
      const out = ctx.createGain();
      out.gain.setValueAtTime(0, ctx.currentTime);
      out.connect(this.out);
      const dry = this.bus(out, def.reverb == null ? 0.4 : def.reverb);
      const state = { bar: 0, next: ctx.currentTime + 0.15, rng: seeded(def.seed || 7), memo: {} };
      const beat = 60 / def.bpm, barDur = beat * def.beats;
      const api = { synth: this, out: dry, beat, barDur, s: state, rng: state.rng };
      const schedule = () => {
        while (state.next < ctx.currentTime + 1.6) {
          try { def.bar(api, state.bar, state.next); } catch (e) { console.warn('synth', e); }
          state.next += barDur;
          state.bar++;
        }
      };
      schedule();
      const timer = setInterval(schedule, 250);
      const handle = {
        gain(v, seconds = 0.4) { out.gain.cancelScheduledValues(ctx.currentTime); out.gain.setTargetAtTime(v * level, ctx.currentTime, Math.max(0.01, seconds / 3)); },
        stop(seconds = 1) {
          clearInterval(timer);
          out.gain.cancelScheduledValues(ctx.currentTime);
          out.gain.setTargetAtTime(0, ctx.currentTime, Math.max(0.02, seconds / 3));
          setTimeout(() => out.disconnect(), seconds * 1000 + 3000);
        },
      };
      handle.gain(volume, 1);
      return handle;
    }

    // ---------------------------------------------------------------- ambience
    ambience(name, volume) {
      const def = AMBIENCES[name];
      if (!def) return null;
      const ctx = this.ctx;
      const out = ctx.createGain();
      out.gain.setValueAtTime(0, ctx.currentTime);
      out.connect(this.out);
      const dry = this.bus(out, def.reverb == null ? 0.2 : def.reverb);
      const nodes = [];
      const timers = [];
      const api = {
        synth: this, out: dry, ctx,
        /** a looping, filtered noise bed whose level (and filter) drift slowly */
        bed: ({ type = 'lowpass', f = 800, q = 0.7, gain = 0.2, lfo = 0.1, depth = 0.5, fLfo = 0, fDepth = 0 }) => {
          const src = ctx.createBufferSource();
          src.buffer = this.noiseBuf;
          src.loop = true;
          const flt = ctx.createBiquadFilter();
          flt.type = type; flt.frequency.value = f; flt.Q.value = q;
          const g = ctx.createGain();
          g.gain.value = gain;
          const l = ctx.createOscillator(), lg = ctx.createGain();
          l.frequency.value = lfo; lg.gain.value = gain * depth;
          l.connect(lg).connect(g.gain);
          if (fLfo) { const fl = ctx.createOscillator(), fg = ctx.createGain(); fl.frequency.value = fLfo; fg.gain.value = fDepth; fl.connect(fg).connect(flt.frequency); fl.start(); nodes.push(fl); }
          src.connect(flt).connect(g).connect(dry);
          src.start(0, Math.random() * 3);
          l.start();
          nodes.push(src, l);
        },
        /** something that happens now and then */
        every: (min, max, fn) => {
          const job = { id: 0, stopped: false, stop() { this.stopped = true; clearTimeout(this.id); } };
          const loop = () => {
            if (job.stopped) return;
            try { fn(ctx.currentTime + 0.05); } catch (e) { /* one missed event is fine */ }
            job.id = setTimeout(loop, (min + Math.random() * (max - min)) * 1000);
          };
          job.id = setTimeout(loop, Math.random() * max * 500);
          timers.push(job);
        },
      };
      def(api);
      const handle = {
        gain(v, seconds = 0.4) { out.gain.cancelScheduledValues(ctx.currentTime); out.gain.setTargetAtTime(v, ctx.currentTime, Math.max(0.01, seconds / 3)); },
        stop(seconds = 1) {
          for (const job of timers) job.stop();
          out.gain.cancelScheduledValues(ctx.currentTime);
          out.gain.setTargetAtTime(0, ctx.currentTime, Math.max(0.02, seconds / 3));
          setTimeout(() => { for (const n of nodes) { try { n.stop(); } catch (e) { /* already stopped */ } } out.disconnect(); }, seconds * 1000 + 1500);
        },
      };
      handle.gain(volume, 1.5);
      return handle;
    }

    // ---------------------------------------------------------------- one-shot sounds
    sfx(name, volume = 1, delay = 0) {
      const def = SOUNDS[name];
      if (!def) return false;
      const out = this.bus(this.out, 0.3);
      out.gain.value = volume;
      def(this, out, this.ctx.currentTime + 0.02 + delay);
      setTimeout(() => out.disconnect(), (delay + 12) * 1000);
      return true;
    }

    // -------------------------------------------------------------- muffled voices
    /**
     * One syllable of a character's voice, heard as if through a wall: a buzzing source shaped by
     * the two formants of a vowel, then low-passed, so it sounds like speech without words.
     * `profile` is { pitch (Hz), muffle (low-pass Hz), breath (0..1) }; `bend` shifts the pitch
     * for intonation, and `consonant` adds a soft click before the vowel.
     */
    syllable({ pitch = 120, muffle = 1100, breath = 0 }, vowel, vol, bend = 1, consonant = false) {
      const ctx = this.ctx;
      if (!this.voiceOut) {
        // voices skip the music's compressor, so speaking never pumps the music; a touch of the hall
        this.voiceOut = ctx.createGain();
        this.voiceOut.connect(ctx.destination);
        const send = ctx.createGain();
        send.gain.value = 0.1;
        this.voiceOut.connect(send).connect(this.reverb);
      }
      const t = ctx.currentTime + 0.004;
      const [f1, f2] = VOWELS[vowel] || VOWELS.a;
      const tract = pitch > 165 ? 1.17 : 1; // a shorter voice has higher formants
      const dur = 0.075 + Math.random() * 0.06;
      const f0 = pitch * bend * (0.95 + Math.random() * 0.1);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = muffle;
      lp.Q.value = 0.6;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(vol, t + 0.02);
      env.gain.setValueAtTime(vol, t + dur * 0.55);
      env.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.06);
      lp.connect(env).connect(this.voiceOut);
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f0 * 1.03, t);
      osc.frequency.exponentialRampToValueAtTime(f0 * 0.96, t + dur + 0.05);
      // the chest of the voice, and the two formants of the vowel
      for (const [type, f, q, g] of [['lowpass', 320, 0.7, 0.5], ['bandpass', f1 * tract, 5, 2.2], ['bandpass', f2 * tract, 8, 1.3]]) {
        const flt = ctx.createBiquadFilter();
        flt.type = type;
        flt.frequency.value = f;
        flt.Q.value = q;
        const gg = ctx.createGain();
        gg.gain.value = g;
        osc.connect(flt).connect(gg).connect(lp);
      }
      osc.start(t);
      osc.stop(t + dur + 0.1);
      if (breath > 0) this.noise(lp, t, dur, { f: f2 * tract, q: 2, gain: 0.35 * breath, attack: 0.02 });
      if (consonant) this.noise(lp, t - 0.002, 0.03, { f: 1800 + Math.random() * 1500, q: 1.2, gain: 0.5, attack: 0.002 });
    }
  }

  // Formants (Hz) of the vowels a man's voice makes; accented letters count as their plain vowel.
  const VOWELS = { a: [730, 1090], e: [530, 1840], i: [300, 2250], o: [570, 840], u: [320, 900], y: [300, 2000] };

  // ---------------------------------------------------------------- composition helpers
  const SCALES = {
    major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10],
    in: [0, 1, 5, 7, 8], hira: [0, 2, 3, 7, 8], yo: [0, 2, 5, 7, 9],
  };
  /** Note n steps up the scale from a root (n may be negative or past an octave). */
  function deg(root, scale, n) {
    const s = SCALES[scale], len = s.length;
    const o = Math.floor(n / len);
    return root + o * 12 + s[((n % len) + len) % len];
  }
  /** A short melody: mostly steps, the odd leap, landing on a chord tone. */
  function motif(rng, len, start = 0, range = [-3, 7]) {
    const out = [start];
    let cur = start;
    for (let i = 1; i < len; i++) {
      const step = rng() < 0.7 ? rng.pick([-1, 1, 1, -1, 2, -2]) : rng.pick([3, -3, 4, 2]);
      cur = Math.max(range[0], Math.min(range[1], cur + step));
      out.push(cur);
    }
    return out;
  }
  /** Vary a motif a little: move one note, or answer by ending elsewhere. */
  function vary(rng, m) {
    const v = m.slice();
    const i = 1 + Math.floor(rng() * (v.length - 1));
    v[i] += rng.pick([-1, 1, 2, -2]);
    return v;
  }
  /** Phrase shape across 8 bars: A A' B A''. */
  function phraseMotif(api, key, bar, len, start) {
    const m = api.s.memo;
    const block = Math.floor(bar / 16);
    if (m[`${key}block`] !== block) {
      m[`${key}block`] = block;
      m[`${key}A`] = motif(api.rng, len, start);
      m[`${key}B`] = motif(api.rng, len, start + api.rng.pick([2, 3, 4]));
    }
    const pos = bar % 8;
    if (pos === 4 || pos === 5) return m[`${key}B`];
    if (pos % 2 === 1) return vary(api.rng, m[`${key}A`]);
    return m[`${key}A`];
  }

  // ---------------------------------------------------------------- the tracks
  const TRACKS = {
    // Lavilledieu: a warm pastoral waltz, guitar and music box
    town_theme: {
      bpm: 92, beats: 3, seed: 11, reverb: 0.3,
      bar(a, bar, t) {
        const S = a.synth, b = a.beat;
        const prog = [[62, 'major', 0], [59, 'minor', 0], [55, 'major', 0], [57, 'major', 0], [62, 'major', 0], [59, 'minor', 0], [64, 'minor', 0], [57, 'major', 0]];
        const [root, q] = prog[bar % 8];
        const third = q === 'major' ? 4 : 3;
        S.pluck(a.out, root - 24, t, 0.5, { bright: 0.35 });
        for (const k of [1, 2]) for (const n of [root - 12 + 7, root + third]) S.pluck(a.out, n, t + k * b, 0.22, { bright: 0.45, dur: 1.4 });
        S.pad(a.out, [root - 12, root - 12 + third, root - 5], t, a.barDur, 0.035, { cutoff: 700 });
        if (bar % 16 >= 2) {
          const m = phraseMotif(a, 'mel', bar, 3, 2);
          m.forEach((d, i) => { if (a.rng() < 0.85) S.musicBox(a.out, deg(74, 'major', d), t + i * b, 0.16); });
        }
      },
    },
    // Hélène: a tender piano theme over strings
    helene_theme: {
      bpm: 68, beats: 4, seed: 23, reverb: 0.45,
      bar(a, bar, t) {
        const S = a.synth, b = a.beat;
        const prog = [[57, 3], [53, 4], [60, 4], [55, 4], [57, 3], [53, 4], [60, 4], [52, 4]];
        const [root, third] = prog[bar % 8];
        const pat = [0, 7, 12, third + 12, 12, 7, 12, third + 12];
        pat.forEach((iv, i) => S.piano(a.out, root - 12 + iv, t + i * b / 2, i === 0 ? 0.32 : 0.16, 2.2));
        S.pad(a.out, [root, root + third, root + 7], t, a.barDur, 0.03, { cutoff: 1100, vibrato: 0.003, type: 'triangle' });
        if (bar >= 2) {
          const m = phraseMotif(a, 'mel', bar, 4, 4);
          const rhythm = bar % 2 ? [0, 1, 1.5, 2] : [0, 1.5, 2, 3];
          m.forEach((d, i) => S.piano(a.out, deg(69, 'minor', d), t + rhythm[i] * b, 0.24, 2.6));
        }
      },
    },
    // The long journey: a pulse that keeps moving, a flute looking ahead
    journey: {
      bpm: 94, beats: 4, seed: 37, reverb: 0.35,
      bar(a, bar, t) {
        const S = a.synth, b = a.beat;
        const prog = [52, 57, 52, 50, 48, 50, 52, 52];
        const root = prog[bar % 8];
        for (let i = 0; i < 8; i++) S.pluck(a.out, root - 12 + (i % 4 === 3 ? 7 : 0), t + i * b / 2, i % 2 ? 0.14 : 0.24, { bright: 0.25, dur: 0.8 });
        S.pad(a.out, [root, root + 7, root + 10 + (bar % 2 ? 4 : 5)], t, a.barDur, 0.04, { cutoff: 800 });
        if (bar % 2 === 0) { S.taiko(a.out, t, 0.18, 1.3); S.taiko(a.out, t + 2 * b, 0.12, 1.4); }
        if (bar % 4 !== 3 && bar >= 2) {
          const m = phraseMotif(a, 'fl', bar, 2, 4);
          S.flute(a.out, deg(64, 'dorian', m[0]), t, b * 2.2, 0.12);
          S.flute(a.out, deg(64, 'dorian', m[1]), t + b * 2.5, b * 1.4, 0.1);
        }
      },
    },
    // Japan: koto and bamboo flute over a drone, a temple bell far away
    japan: {
      bpm: 60, beats: 4, seed: 41, reverb: 0.55,
      bar(a, bar, t) {
        const S = a.synth, b = a.beat, R = a.rng;
        S.pad(a.out, [38, 45], t, a.barDur, 0.05, { cutoff: 500, attack: 2, type: 'triangle' });
        if (bar % 2 === 0) {
          const up = [0, 1, 2, 3, 4, 5].map((n) => deg(62, 'in', n));
          up.forEach((m, i) => S.pluck(a.out, m, t + i * 0.09, 0.2 + i * 0.03, { bright: 0.7 }));
          S.pluck(a.out, deg(62, 'in', R.pick([5, 6, 7])), t + b * 2, 0.35, { bright: 0.7, bend: -1 });
        } else {
          for (const k of [0, 1.5, 2.5]) if (R() < 0.8) S.pluck(a.out, deg(62, 'in', R.pick([2, 3, 4, 5, 7])), t + k * b, 0.3, { bright: 0.7, bend: R() < 0.3 ? -1 : 0 });
        }
        if (bar % 4 === 1) {
          const m = phraseMotif(a, 'sh', bar, 3, 5);
          S.flute(a.out, deg(62, 'in', m[0]), t + 0.2, b * 1.6, 0.16, { scoop: 1.2 });
          S.flute(a.out, deg(62, 'in', m[1]), t + b * 2, b * 1, 0.13, { scoop: 0.8 });
          S.flute(a.out, deg(62, 'in', m[2]), t + b * 3, b * 1.8, 0.14, { scoop: 1 });
        }
        if (bar % 8 === 0) S.bell(a.out, 38, t, 0.18, 6);
      },
    },
    // Her: high, weightless, full of distance
    her_theme: {
      bpm: 54, beats: 4, seed: 53, reverb: 0.7, level: 1.3,
      bar(a, bar, t) {
        const S = a.synth, b = a.beat, R = a.rng;
        S.pad(a.out, [69, 76, 81], t, a.barDur, 0.025, { cutoff: 2400, attack: 2.5, type: 'triangle', vibrato: 0.004 });
        S.pad(a.out, [45, 52], t, a.barDur, 0.035, { cutoff: 400, attack: 2 });
        const m = phraseMotif(a, 'h', bar, 4, 7);
        m.forEach((d, i) => { if (R() < 0.75) S.pluck(a.out, deg(69, 'hira', d), t + i * b + R.r(0, 0.1), 0.22, { bright: 0.85, dur: 3 }); });
        if (bar % 4 === 2) S.flute(a.out, deg(69, 'hira', R.pick([7, 8, 9])), t + b, b * 2.5, 0.1, { scoop: 1.5 });
        if (bar % 2 === 1) S.musicBox(a.out, deg(81, 'hira', R.pick([0, 2, 3])), t + b * 3.5, 0.08);
      },
    },
    // War: drums, a low tremor, a flute that cries
    war: {
      bpm: 100, beats: 4, seed: 61, reverb: 0.35, level: 0.5,
      bar(a, bar, t) {
        const S = a.synth, b = a.beat, R = a.rng;
        S.pad(a.out, [26, 33], t, a.barDur, 0.09, { cutoff: 300, attack: 0.3 });
        const hits = bar % 4 === 3 ? [0, 1, 2, 2.5, 3, 3.25, 3.5, 3.75] : [0, 1.5, 2, 3];
        hits.forEach((k, i) => S.taiko(a.out, t + k * b, i === 0 ? 0.7 : 0.4, i === 0 ? 0.9 : 1.1));
        for (let i = 0; i < 8; i++) S.pluck(a.out, deg(38, 'phrygian', i % 2 ? 1 : 0), t + i * b / 2, 0.16, { bright: 0.2, dur: 0.5 });
        if (bar % 4 === 1) S.flute(a.out, deg(74, 'phrygian', R.pick([0, 1, 4])), t, b * 3, 0.13, { scoop: 2, vib: 0.02 });
      },
    },
    // The truth: piano and strings, from minor into major
    letter: {
      bpm: 58, beats: 4, seed: 71, reverb: 0.5,
      bar(a, bar, t) {
        const S = a.synth, b = a.beat;
        const prog = [[50, 3], [46, 4], [53, 4], [48, 4], [50, 3], [46, 4], [43, 3], [45, 4], [53, 4], [48, 4], [50, 3], [46, 4], [53, 4], [48, 4], [46, 4], [48, 4]];
        const [root, third] = prog[bar % 16];
        [0, 7, 12, third + 12, 19, third + 12, 12, 7].forEach((iv, i) => S.piano(a.out, root - 12 + iv, t + i * b / 2, i === 0 ? 0.3 : 0.15, 2.4));
        S.pad(a.out, [root, root + third, root + 7, root + 12], t, a.barDur, 0.04, { cutoff: 1300, vibrato: 0.004, attack: 1.8 });
        if (bar >= 1) {
          const m = phraseMotif(a, 'l', bar, 3, 5);
          const sc = bar % 16 < 8 ? 'minor' : 'major';
          const base = bar % 16 < 8 ? 74 : 77;
          m.forEach((d, i) => S.piano(a.out, deg(base, sc, d), t + [0, 1.5, 2.5][i] * b, 0.26, 3));
        }
      },
    },
    // Home: a music box and piano, bittersweet
    home: {
      bpm: 62, beats: 4, seed: 83, reverb: 0.5,
      bar(a, bar, t) {
        const S = a.synth, b = a.beat;
        const prog = [[60, 4], [57, 3], [53, 4], [55, 4], [60, 4], [52, 3], [53, 4], [55, 4]];
        const [root, third] = prog[bar % 8];
        [0, 7, 12, 7].forEach((iv, i) => S.piano(a.out, root - 12 + iv, t + i * b, 0.18, 2.6));
        S.pad(a.out, [root, root + third, root + 7], t, a.barDur, 0.028, { cutoff: 1000, type: 'triangle', attack: 1.6 });
        const m = phraseMotif(a, 'hm', bar, 4, 4);
        m.forEach((d, i) => { if (a.rng() < 0.8) S.musicBox(a.out, deg(72, 'major', d), t + i * b + (i === 3 ? b / 2 : 0), 0.14); });
      },
    },
    // Sorrow: very little — a low piano, space, a held string
    sorrow: {
      bpm: 50, beats: 4, seed: 97, reverb: 0.6, level: 1.4,
      bar(a, bar, t) {
        const S = a.synth, b = a.beat;
        const prog = [[45, 3], [41, 4], [48, 4], [43, 4]];
        const [root, third] = prog[bar % 4];
        S.piano(a.out, root - 12, t, 0.25, 4);
        S.piano(a.out, root + third, t + b, 0.12, 3);
        S.pad(a.out, [root, root + 7], t, a.barDur, 0.035, { cutoff: 700, attack: 2.5, vibrato: 0.003 });
        if (bar % 2 === 1) S.piano(a.out, deg(69, 'minor', phraseMotif(a, 's', bar, 2, 4)[0]), t + b * 2, 0.18, 4);
      },
    },
  };

  // ---------------------------------------------------------------- ambiences
  const chirp = (S, dest, t, base) => {
    const ctx = S.ctx, n = 2 + Math.floor(Math.random() * 5), f0 = base * (0.8 + Math.random() * 0.5);
    for (let i = 0; i < n; i++) {
      const o = ctx.createOscillator(), g = ctx.createGain(), tt = t + i * (0.07 + Math.random() * 0.06);
      o.frequency.setValueAtTime(f0 * (1 + Math.random() * 0.2), tt);
      o.frequency.exponentialRampToValueAtTime(f0 * (1.4 + Math.random() * 0.5), tt + 0.05);
      g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(0.09, tt + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.07);
      o.connect(g).connect(dest); o.start(tt); o.stop(tt + 0.09);
    }
  };
  const cricket = (S, dest, t, f) => {
    const ctx = S.ctx;
    for (let i = 0; i < 3; i++) {
      const o = ctx.createOscillator(), g = ctx.createGain(), tt = t + i * 0.055;
      o.frequency.value = f;
      g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(0.03, tt + 0.008); g.gain.linearRampToValueAtTime(0, tt + 0.035);
      o.connect(g).connect(dest); o.start(tt); o.stop(tt + 0.05);
    }
  };
  const drop = (S, dest, t, gain = 0.05) => S.noise(dest, t, 0.03 + Math.random() * 0.03, { type: 'bandpass', f: 1500 + Math.random() * 3000, q: 4, gain, attack: 0.001 });
  const crackle = (S, dest, t) => S.noise(dest, t, 0.02 + Math.random() * 0.05, { type: 'highpass', f: 1200 + Math.random() * 2000, gain: 0.04 + Math.random() * 0.12, attack: 0.001 });

  const AMBIENCES = {
    waves(a) {
      a.bed({ type: 'lowpass', f: 500, gain: 0.15, lfo: 0.09, depth: 0.8 });
      a.bed({ type: 'highpass', f: 2500, gain: 0.03, lfo: 0.09, depth: 0.9 });
    },
    wind(a) {
      a.bed({ type: 'bandpass', f: 500, q: 1.3, gain: 0.16, lfo: 0.06, depth: 0.8, fLfo: 0.05, fDepth: 300 });
      a.bed({ type: 'bandpass', f: 1400, q: 3, gain: 0.03, lfo: 0.11, depth: 0.9, fLfo: 0.07, fDepth: 500 });
    },
    birds(a) {
      a.bed({ type: 'highpass', f: 3000, gain: 0.006, lfo: 0.05 });
      a.every(0.6, 3.5, (t) => chirp(a.synth, a.out, t, a.synth.ctx && [2600, 3400, 4200][Math.floor(Math.random() * 3)]));
    },
    rain(a) {
      a.bed({ type: 'highpass', f: 1800, gain: 0.08, lfo: 0.13, depth: 0.2 });
      a.bed({ type: 'lowpass', f: 400, gain: 0.05, lfo: 0.07, depth: 0.3 });
      a.every(0.02, 0.09, (t) => drop(a.synth, a.out, t, 0.02 + Math.random() * 0.05));
    },
    storm(a) {
      AMBIENCES.rain(a);
      AMBIENCES.wind(a);
      a.every(9, 22, (t) => a.synth.noise(a.out, t, 3 + Math.random() * 2, { type: 'lowpass', f: 160, gain: 0.5, attack: 0.3 }));
    },
    fire(a) {
      a.bed({ type: 'lowpass', f: 300, gain: 0.08, lfo: 0.3, depth: 0.4 });
      a.every(0.04, 0.3, (t) => crackle(a.synth, a.out, t));
    },
    crickets(a) {
      a.bed({ type: 'highpass', f: 4000, gain: 0.004, lfo: 0.05 });
      for (const f of [4200, 4700, 3900]) a.every(0.5, 1.4, (t) => cricket(a.synth, a.out, t, f));
    },
    night(a) {
      AMBIENCES.crickets(a);
      a.bed({ type: 'bandpass', f: 350, q: 1, gain: 0.05, lfo: 0.05, depth: 0.8 });
      a.every(12, 30, (t) => { for (const [k, f] of [[0, 380], [0.45, 360]]) a.synth.flute(a.out, 55 + (f > 370 ? 12 : 11), t + k, 0.35, 0.05, { scoop: 1, vib: 0 }); });
    },
    temple(a) {
      AMBIENCES.crickets(a);
      a.every(4, 11, (t) => { const n = [74, 76, 79, 81, 86][Math.floor(Math.random() * 5)]; a.synth.bell(a.out, n + 12, t, 0.03, 2.5); });
      a.every(25, 45, (t) => a.synth.bell(a.out, 38, t, 0.12, 7));
    },
    forest(a) {
      AMBIENCES.night(a);
      a.bed({ type: 'bandpass', f: 800, q: 0.8, gain: 0.03, lfo: 0.04, depth: 0.9 });
    },
    camp(a) {
      AMBIENCES.night(a);
      a.bed({ type: 'lowpass', f: 260, gain: 0.06, lfo: 0.3, depth: 0.4 });
      a.every(0.06, 0.4, (t) => crackle(a.synth, a.out, t));
    },
    unrest(a) {
      AMBIENCES.wind(a);
      // far-off war drums, and now and then a gun from the harbour
      a.every(7, 15, (t) => { for (let i = 0; i < 4; i++) a.synth.taiko(a.out, t + i * 0.42, 0.07 + (i === 0 ? 0.04 : 0), 0.8); });
      a.every(18, 40, (t) => a.synth.noise(a.out, t, 2.5, { type: 'lowpass', f: 140, gain: 0.25, attack: 0.01 }));
    },
    aviary(a) {
      AMBIENCES.birds(a);
      a.every(0.4, 2, (t) => chirp(a.synth, a.out, t, [1900, 2400, 3000, 5000][Math.floor(Math.random() * 4)]));
      // wings
      a.every(1.5, 5, (t) => { for (let i = 0; i < 5; i++) a.synth.noise(a.out, t + i * 0.07, 0.06, { type: 'bandpass', f: 900, q: 0.8, gain: 0.05, attack: 0.02 }); });
    },
    mill(a) {
      a.bed({ type: 'lowpass', f: 200, gain: 0.1, lfo: 0.2, depth: 0.2 });
      let beat = 0;
      a.every(0.26, 0.3, (t) => { beat++; a.synth.noise(a.out, t, 0.05, { type: 'bandpass', f: beat % 2 ? 700 : 950, q: 6, gain: 0.25, attack: 0.001 }); });
      a.every(6, 14, (t) => { const ctx = a.ctx, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(90, t); o.frequency.linearRampToValueAtTime(70, t + 0.6); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.1); g.gain.linearRampToValueAtTime(0, t + 0.7); const lp = ctx.createBiquadFilter(); lp.frequency.value = 500; o.connect(lp).connect(g).connect(a.out); o.start(t); o.stop(t + 0.8); });
    },
    clock(a) {
      let tick = 0;
      a.every(1, 1, (t) => { tick++; a.synth.noise(a.out, t, 0.04, { type: 'bandpass', f: tick % 2 ? 2600 : 3200, q: 8, gain: 0.35, attack: 0.001 }); });
    },
    room(a) {
      AMBIENCES.clock(a);
      a.bed({ type: 'lowpass', f: 300, gain: 0.03, lfo: 0.03 });
    },
    city(a) {
      a.bed({ type: 'bandpass', f: 450, q: 0.6, gain: 0.05, lfo: 0.05, depth: 0.6 });
      a.every(5, 12, (t) => { for (let i = 0; i < 6; i++) a.synth.noise(a.out, t + i * 0.24 + (i % 2) * 0.08, 0.04, { type: 'bandpass', f: 1100, q: 5, gain: 0.025, attack: 0.001 }); });
      AMBIENCES.clock(a);
    },
    harbour(a) {
      AMBIENCES.waves(a);
      a.every(3, 9, (t) => { const ctx = a.ctx, o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(1500, t); o.frequency.exponentialRampToValueAtTime(900, t + 0.4); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.025, t + 0.05); g.gain.linearRampToValueAtTime(0, t + 0.45); o.connect(g).connect(a.out); o.start(t); o.stop(t + 0.5); });
    },
    boat(a) {
      AMBIENCES.waves(a);
      a.every(4, 9, (t) => { const ctx = a.ctx, o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.setValueAtTime(120, t); o.frequency.linearRampToValueAtTime(95, t + 0.9); lp.frequency.value = 600; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.025, t + 0.2); g.gain.linearRampToValueAtTime(0, t + 1); o.connect(lp).connect(g).connect(a.out); o.start(t); o.stop(t + 1.1); });
    },
    stream(a) {
      a.bed({ type: 'bandpass', f: 1800, q: 1.5, gain: 0.05, lfo: 1.3, depth: 0.5, fLfo: 0.9, fDepth: 600 });
      AMBIENCES.birds(a);
    },
    ruins(a) {
      AMBIENCES.wind(a);
      a.every(0.1, 0.6, (t) => crackle(a.synth, a.out, t));
      a.every(8, 18, (t) => a.synth.noise(a.out, t, 1.5, { type: 'lowpass', f: 250, gain: 0.12, attack: 0.05 }));
    },
  };

  // ---------------------------------------------------------------- one-shot sounds
  const SOUNDS = {
    bell: (S, o, t) => S.bell(o, 43, t, 0.45, 7),
    temple_bell: (S, o, t) => { S.bell(o, 36, t, 0.5, 9); S.bell(o, 48, t, 0.12, 5); },
    chime: (S, o, t) => [79, 83, 86, 91].forEach((m, i) => S.bell(o, m, t + i * 0.12, 0.08, 2.5)),
    heartbeat: (S, o, t) => { S.taiko(o, t, 0.5, 0.7); S.taiko(o, t + 0.28, 0.35, 0.65); },
    thunder: (S, o, t) => { S.noise(o, t, 4, { type: 'lowpass', f: 180, gain: 0.8, attack: 0.1 }); S.noise(o, t, 0.4, { type: 'bandpass', f: 700, gain: 0.3, attack: 0.005 }); },
    cannon: (S, o, t) => { S.taiko(o, t, 0.9, 0.5); S.noise(o, t, 2.5, { type: 'lowpass', f: 220, gain: 0.6, attack: 0.005 }); },
    page: (S, o, t) => S.noise(o, t, 0.25, { type: 'highpass', f: 2500, gain: 0.12, attack: 0.03 }),
    paper: (S, o, t) => { for (let i = 0; i < 4; i++) S.noise(o, t + i * 0.07, 0.08, { type: 'highpass', f: 3000, gain: 0.08, attack: 0.01 }); },
    knock: (S, o, t) => { for (const k of [0, 0.22, 0.4]) S.noise(o, t + k, 0.08, { type: 'bandpass', f: 400, q: 3, gain: 1.2, attack: 0.001 }); },
    cup: (S, o, t) => { S.bell(o, 91, t, 0.16, 1.4); S.bell(o, 98, t + 0.002, 0.05, 0.8); S.noise(o, t, 0.05, { type: 'bandpass', f: 3500, q: 6, gain: 0.25, attack: 0.001 }); },
    gong: (S, o, t) => { S.bell(o, 33, t, 0.5, 8); S.bell(o, 40, t + 0.01, 0.2, 6); },
    wind_gust: (S, o, t) => S.noise(o, t, 3, { type: 'bandpass', f: 600, q: 1, gain: 0.3, attack: 1 }),
    breath: (S, o, t) => S.noise(o, t, 1.4, { type: 'bandpass', f: 900, q: 1, gain: 0.12, attack: 0.5 }),
    ink: (S, o, t) => S.noise(o, t, 0.5, { type: 'bandpass', f: 1800, q: 2, gain: 0.15, attack: 0.1 }),
    whoosh: (S, o, t) => { const n = S.noise(o, t, 0.9, { type: 'bandpass', f: 400, q: 1.5, gain: 0.3, attack: 0.35 }); n.flt.frequency.exponentialRampToValueAtTime(3000, t + 0.8); },
    stamp: (S, o, t) => { S.taiko(o, t, 0.35, 1.8); S.noise(o, t, 0.1, { type: 'lowpass', f: 1200, gain: 0.3, attack: 0.001 }); },
    sparkle: (S, o, t) => [88, 91, 95, 100].forEach((m, i) => S.musicBox(o, m, t + i * 0.06, 0.05)),
    candle_out: (S, o, t) => S.noise(o, t, 0.6, { type: 'bandpass', f: 700, q: 1.2, gain: 0.35, attack: 0.05 }),
  };

  VN.Synth = Synth;
  VN.SYNTH_TRACKS = TRACKS;
  VN.SYNTH_AMBIENCES = AMBIENCES;
  VN.SYNTH_SOUNDS = SOUNDS;
})();
