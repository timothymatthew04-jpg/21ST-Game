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
      g.gain.value = 0; // silent until its envelope begins (a start between samples could otherwise click)
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

    /** Brass: sawtooths whose filter opens as the note is blown (horns, war calls, low stabs). */
    brass(dest, midis, t, dur, vel = 0.1, { bright = 1, attack = 0.07 } = {}) {
      const ctx = this.ctx;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.Q.value = 1.5;
      const top = 500 + 1600 * bright;
      lp.frequency.setValueAtTime(top * 0.25, t);
      lp.frequency.linearRampToValueAtTime(top, t + attack * 1.6);
      lp.frequency.setTargetAtTime(top * 0.6, t + attack * 1.6, Math.max(0.05, dur * 0.3));
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vel, t + attack);
      g.gain.linearRampToValueAtTime(vel * 0.8, t + Math.max(attack + 0.01, dur * 0.75));
      g.gain.linearRampToValueAtTime(0, t + dur + 0.12);
      lp.connect(g).connect(dest);
      for (const m of midis) for (const det of [-5, 6]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(mtof(m) * 0.985, t);
        o.frequency.exponentialRampToValueAtTime(mtof(m), t + attack);
        o.detune.value = det;
        const og = ctx.createGain();
        og.gain.value = 1 / (midis.length * 2);
        o.connect(og).connect(lp);
        o.start(t);
        o.stop(t + dur + 0.2);
      }
    }

    /** A choir: many buzzing voices shaped into a vowel by formant filters, with a slow vibrato. */
    choir(dest, midis, t, dur, vel = 0.07, { vowel = 'a', attack = 0.9 } = {}) {
      const ctx = this.ctx;
      const [f1, f2] = VOWELS[vowel] || VOWELS.a;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vel, t + attack);
      g.gain.setValueAtTime(vel, t + Math.max(attack, dur - attack * 0.5));
      g.gain.linearRampToValueAtTime(0, t + dur + attack * 0.8);
      g.connect(dest);
      const src = ctx.createGain(); // all the voices, before the vowel shapes them
      for (const [type, f, q, amt] of [['bandpass', f1 * 1.08, 4, 2.2], ['bandpass', f2 * 1.08, 7, 1.4], ['bandpass', 2900, 5, 0.45], ['lowpass', 380, 0.7, 0.4]]) {
        const flt = ctx.createBiquadFilter();
        flt.type = type;
        flt.frequency.value = f;
        flt.Q.value = q;
        const fg = ctx.createGain();
        fg.gain.value = amt;
        src.connect(flt).connect(fg).connect(g);
      }
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 5.1;
      const end = t + dur + attack + 0.1;
      for (const m of midis) for (const det of [-11, 0, 10]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = mtof(m);
        o.detune.value = det + (Math.random() - 0.5) * 6;
        const lg = ctx.createGain();
        lg.gain.value = mtof(m) * 0.005;
        lfo.connect(lg).connect(o.frequency);
        const og = ctx.createGain();
        og.gain.value = 1 / (midis.length * 3);
        o.connect(og).connect(src);
        o.start(t);
        o.stop(end);
      }
      lfo.start(t);
      lfo.stop(end);
    }

    /** A bowed string (violin, cello, erhu): the bow's attack, a vibrato that blooms, a wooden body. */
    bowed(dest, midi, t, dur, vel = 0.1, { vib = 0.007, bright = 0.5, glide = 0, attack = 0.14 } = {}) {
      const ctx = this.ctx, f = mtof(midi);
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      if (glide) { o.frequency.setValueAtTime(mtof(midi + glide), t); o.frequency.exponentialRampToValueAtTime(f, t + 0.16); } else o.frequency.setValueAtTime(f, t);
      let lfo = null;
      if (vib) {
        lfo = ctx.createOscillator();
        lfo.frequency.value = 5.4;
        const lg = ctx.createGain();
        lg.gain.setValueAtTime(0, t);
        lg.gain.linearRampToValueAtTime(f * vib, t + Math.min(0.6, dur * 0.5));
        lfo.connect(lg).connect(o.frequency);
      }
      const body = ctx.createBiquadFilter();
      body.type = 'peaking';
      body.frequency.value = 420;
      body.Q.value = 1.2;
      body.gain.value = 5;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 900 + 2600 * bright;
      lp.Q.value = 0.6;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vel, t + attack);
      g.gain.linearRampToValueAtTime(vel * 0.85, t + Math.max(attack + 0.01, dur - 0.05));
      g.gain.linearRampToValueAtTime(0, t + dur + 0.2);
      o.connect(body).connect(lp).connect(g).connect(dest);
      o.start(t);
      o.stop(t + dur + 0.3);
      if (lfo) { lfo.start(t); lfo.stop(t + dur + 0.3); }
    }

    /** Timpani: a tuned drum, the orchestra's thunder. */
    timpani(dest, midi, t, vel = 0.5, dur = 1.8) {
      const ctx = this.ctx, f = mtof(midi);
      for (const [k, amt, d] of [[1, 1, dur], [1.5, 0.35, dur * 0.6], [1.98, 0.15, dur * 0.4]]) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.setValueAtTime(f * k * 1.03, t);
        o.frequency.exponentialRampToValueAtTime(f * k, t + 0.08);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vel * amt, t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g).connect(dest);
        o.start(t);
        o.stop(t + d + 0.05);
      }
      this.noise(dest, t, 0.12, { type: 'lowpass', f: 600, gain: vel * 0.6, attack: 0.002 });
    }

    /** A drum roll that swells from `from` to `to`. */
    roll(dest, midi, t, dur, from = 0.05, to = 0.4) {
      const n = Math.max(2, Math.floor(dur / 0.06));
      for (let i = 0; i < n; i++) this.timpani(dest, midi, t + i * 0.06 + Math.random() * 0.008, from + (to - from) * (i / (n - 1)), 0.45);
    }

    /** A snare drum: a rattle of wires over a short skin. */
    snare(dest, t, vel = 0.3) {
      this.noise(dest, t, 0.16, { type: 'highpass', f: 1800, gain: vel, attack: 0.001 });
      this.noise(dest, t, 0.08, { type: 'bandpass', f: 250, q: 1, gain: vel * 0.8, attack: 0.001 });
    }

    /** A cymbal: a crash, or (swell) a long rise into the next downbeat. */
    cymbal(dest, t, dur = 2.5, vel = 0.15, swell = false) {
      const d = Math.min(3.8, dur);
      this.noise(dest, t, d, { type: 'highpass', f: 5200, gain: vel, attack: swell ? d * 0.95 : 0.002 });
      this.noise(dest, t, d * 0.7, { type: 'bandpass', f: 8500, q: 1.5, gain: vel * 0.5, attack: swell ? d * 0.66 : 0.002 });
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
    syllable({ pitch = 120, muffle = 1100, breath = 0 }, vowel, vol, bend = 1, consonant = false, dest = null, when = 0) {
      const ctx = this.ctx;
      if (!dest && !this.voiceOut) {
        // voices skip the music's compressor, so speaking never pumps the music; a touch of the hall
        this.voiceOut = ctx.createGain();
        this.voiceOut.connect(ctx.destination);
        const send = ctx.createGain();
        send.gain.value = 0.1;
        this.voiceOut.connect(send).connect(this.reverb);
      }
      const t = Math.max(ctx.currentTime + 0.004, when);
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
      lp.connect(env).connect(dest || this.voiceOut);
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
    harmonic: [0, 2, 3, 5, 7, 8, 11], lydian: [0, 2, 4, 6, 7, 9, 11],
  };
  /** Where a bar falls in a track's form: plan = [['A', 8], ['B', 8], ...], repeating. */
  function form(bar, plan) {
    const total = plan.reduce((sum, p) => sum + p[1], 0);
    let pos = bar % total;
    const cycle = Math.floor(bar / total);
    for (const [part, len] of plan) {
      if (pos < len) return { part, i: pos, len, cycle, first: pos === 0, last: pos === len - 1 };
      pos -= len;
    }
    return { part: plan[0][0], i: 0, len: plan[0][1], cycle, first: true, last: false };
  }
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
    // Lavilledieu: a warm pastoral waltz, guitar and music box. The middle turns to the minor on
    // the guitar, and now and then the music takes a breath.
    town_theme: {
      bpm: 92, beats: 3, seed: 11, reverb: 0.3,
      bar(a, bar, t) {
        const S = a.synth, b = a.beat;
        const f = form(bar, [['A', 16], ['B', 8], ['A', 8], ['C', 4]]);
        const progA = [[62, 'major'], [59, 'minor'], [55, 'major'], [57, 'major'], [62, 'major'], [59, 'minor'], [64, 'minor'], [57, 'major']];
        const progB = [[59, 'minor'], [55, 'major'], [57, 'major'], [54, 'minor'], [59, 'minor'], [52, 'minor'], [55, 'major'], [57, 'major']];
        const [root, q] = (f.part === 'B' ? progB : progA)[bar % 8];
        const third = q === 'major' ? 4 : 3;
        if (f.part === 'C') {
          S.pad(a.out, [root - 12, root - 12 + third, root - 5], t, a.barDur, 0.03, { cutoff: 600 });
          if (f.i % 2 === 0) S.musicBox(a.out, root + 12 + third, t + b, 0.1);
          return;
        }
        S.pluck(a.out, root - 24, t, 0.5, { bright: 0.35 });
        for (const k of [1, 2]) for (const n of [root - 12 + 7, root + third]) S.pluck(a.out, n, t + k * b, 0.22, { bright: 0.45, dur: 1.4 });
        S.pad(a.out, [root - 12, root - 12 + third, root - 5], t, a.barDur, 0.035, { cutoff: 700 });
        const m = phraseMotif(a, f.part === 'B' ? 'melB' : 'mel', bar, 3, 2);
        if (f.part === 'B') {
          // the guitar takes the tune, and a cello hums underneath
          m.forEach((d, i) => S.pluck(a.out, deg(71, 'minor', d), t + i * b, 0.3, { bright: 0.75, dur: 2 }));
          S.bowed(a.out, root - 12, t, a.barDur * 0.95, 0.04, { vib: 0.004, bright: 0.3, attack: 0.4 });
        } else if (bar % 16 >= 2) {
          m.forEach((d, i) => { if (a.rng() < 0.85) S.musicBox(a.out, deg(74, 'major', d), t + i * b, 0.16); });
        }
      },
    },
    // Hélène: a tender piano theme over strings; a cello joins, then a violin sings a new tune
    helene_theme: {
      bpm: 68, beats: 4, seed: 23, reverb: 0.45,
      bar(a, bar, t) {
        const S = a.synth, b = a.beat;
        const f = form(bar, [['A', 8], ['A2', 8], ['B', 8], ['C', 4]]);
        const progA = [[57, 3], [53, 4], [60, 4], [55, 4], [57, 3], [53, 4], [60, 4], [52, 4]];
        const progB = [[53, 4], [55, 4], [52, 3], [57, 3], [50, 3], [52, 4], [53, 4], [52, 4]];
        const [root, third] = (f.part === 'B' ? progB : progA)[bar % 8];
        if (f.part === 'C') {
          // alone at the piano
          S.piano(a.out, root - 12, t, 0.22, 3.5);
          S.piano(a.out, root + third, t + b * 1.5, 0.12, 3);
          if (f.i % 2 === 1) S.piano(a.out, deg(69, 'minor', phraseMotif(a, 'c', bar, 2, 4)[0]), t + b * 2.5, 0.16, 3.5);
          return;
        }
        const pat = [0, 7, 12, third + 12, 12, 7, 12, third + 12];
        pat.forEach((iv, i) => S.piano(a.out, root - 12 + iv, t + i * b / 2, i === 0 ? 0.32 : 0.16, 2.2));
        S.pad(a.out, [root, root + third, root + 7], t, a.barDur, 0.03, { cutoff: 1100, vibrato: 0.003, type: 'triangle' });
        if (f.part === 'A2') S.bowed(a.out, root - 12 + (f.i % 2 ? 7 : 0), t, a.barDur * 0.95, 0.05, { vib: 0.005, bright: 0.3, attack: 0.5 });
        if (f.part === 'B') {
          const m = phraseMotif(a, 'vB', bar, 4, 4);
          const rh = bar % 2 ? [[0, 1.4], [1.5, 0.5], [2, 0.9], [3, 1]] : [[0, 1.9], [2, 0.9], [3, 0.5], [3.5, 0.5]];
          m.forEach((d, i) => S.bowed(a.out, deg(69, 'major', d), t + rh[i][0] * b, rh[i][1] * b, 0.07, { vib: 0.007, bright: 0.55, glide: i === 0 ? -1 : 0 }));
        } else if (bar >= 2) {
          const m = phraseMotif(a, 'mel', bar, 4, 4);
          const rhythm = bar % 2 ? [0, 1, 1.5, 2] : [0, 1.5, 2, 3];
          m.forEach((d, i) => S.piano(a.out, deg(69, 'minor', d), t + rhythm[i] * b, 0.24, 2.6));
        }
      },
    },
    // The long journey: a pulse that keeps moving, a flute looking ahead; a horn when the road lifts
    journey: {
      bpm: 94, beats: 4, seed: 37, reverb: 0.35,
      bar(a, bar, t) {
        const S = a.synth, b = a.beat;
        const f = form(bar, [['A', 8], ['B', 8], ['A2', 8], ['brk', 4]]);
        const up = f.part === 'B' ? 2 : 0;
        const prog = [52, 57, 52, 50, 48, 50, 52, 52];
        const root = prog[bar % 8] + up;
        for (let i = 0; i < 8; i++) S.pluck(a.out, root - 12 + (i % 4 === 3 ? 7 : 0), t + i * b / 2, i % 2 ? 0.14 : 0.24, { bright: 0.25, dur: 0.8 });
        S.pad(a.out, [root, root + 7, root + 10 + (bar % 2 ? 4 : 5)], t, a.barDur, 0.04, { cutoff: f.part === 'B' ? 1100 : 800 });
        if (f.part === 'brk') return;
        if (bar % 2 === 0) { S.taiko(a.out, t, f.part === 'B' ? 0.26 : 0.18, 1.3); S.taiko(a.out, t + 2 * b, 0.12, 1.4); }
        if (f.part === 'B' && f.i % 4 === 0) S.brass(a.out, [root + 7, root + 12], t + b, b * 2.5, 0.05, { bright: 0.6, attack: 0.3 });
        if (f.part === 'A2') S.bowed(a.out, deg(52, 'dorian', phraseMotif(a, 'cel', bar, 2, 4)[0]), t, a.barDur * 0.9, 0.05, { vib: 0.005, bright: 0.35, attack: 0.4 });
        if (bar % 4 !== 3 && bar >= 2) {
          const m = phraseMotif(a, 'fl', bar, 2, 4);
          S.flute(a.out, deg(64 + up, 'dorian', m[0]), t, b * 2.2, 0.12);
          S.flute(a.out, deg(64 + up, 'dorian', m[1]), t + b * 2.5, b * 1.4, 0.1);
        }
      },
    },
    // Japan: koto and bamboo flute over a drone, a temple bell far away; voices in the hills, then silence
    japan: {
      bpm: 60, beats: 4, seed: 41, reverb: 0.55,
      bar(a, bar, t) {
        const S = a.synth, b = a.beat, R = a.rng;
        const f = form(bar, [['A', 8], ['B', 8], ['C', 4]]);
        S.pad(a.out, [38, 45], t, a.barDur, 0.05, { cutoff: 500, attack: 2, type: 'triangle' });
        if (f.part === 'C') {
          if (f.i === 0) S.bell(a.out, 38, t, 0.2, 7);
          if (f.i === 2) S.flute(a.out, deg(62, 'in', R.pick([4, 5, 7])), t + b, b * 2.5, 0.12, { scoop: 1.4 });
          return;
        }
        if (f.part === 'B') S.choir(a.out, [50, 57], t, a.barDur, 0.03, { vowel: 'u', attack: 1.8 });
        if (bar % 2 === 0) {
          const up = [0, 1, 2, 3, 4, 5].map((n) => deg(62, 'in', n));
          up.forEach((m, i) => S.pluck(a.out, m, t + i * 0.09, 0.2 + i * 0.03, { bright: 0.7 }));
          S.pluck(a.out, deg(62, 'in', R.pick([5, 6, 7])), t + b * 2, 0.35, { bright: 0.7, bend: -1 });
        } else {
          for (const k of [0, 1.5, 2.5]) if (R() < 0.8) S.pluck(a.out, deg(62, 'in', R.pick([2, 3, 4, 5, 7])), t + k * b, 0.3, { bright: 0.7, bend: R() < 0.3 ? -1 : 0 });
          // in the B part the koto trembles on one string
          if (f.part === 'B') for (let i = 0; i < 6; i++) S.pluck(a.out, deg(62, 'in', 7), t + b * 3 + i * 0.08, 0.1, { bright: 0.8, dur: 0.6 });
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
    // Her: high, weightless, full of distance; in the second half a far choir and a harp
    her_theme: {
      bpm: 54, beats: 4, seed: 53, reverb: 0.7, level: 1.3,
      bar(a, bar, t) {
        const S = a.synth, b = a.beat, R = a.rng;
        const f = form(bar, [['A', 8], ['B', 8]]);
        S.pad(a.out, [69, 76, 81], t, a.barDur, 0.025, { cutoff: 2400, attack: 2.5, type: 'triangle', vibrato: 0.004 });
        S.pad(a.out, [45, 52], t, a.barDur, 0.035, { cutoff: 400, attack: 2 });
        if (f.part === 'B') {
          S.choir(a.out, [69, 76], t, a.barDur, 0.025, { vowel: 'u', attack: 2 });
          [0, 2, 3, 4, 7].forEach((d, i) => S.pluck(a.out, deg(57, 'hira', d), t + i * 0.14, 0.1, { bright: 0.9, dur: 2.5 }));
        }
        const m = phraseMotif(a, 'h', bar, 4, 7);
        m.forEach((d, i) => { if (R() < 0.75) S.pluck(a.out, deg(69, 'hira', d), t + i * b + R.r(0, 0.1), 0.22, { bright: 0.85, dur: 3 }); });
        if (bar % 4 === 2) S.flute(a.out, deg(69, 'hira', R.pick([7, 8, 9])), t + b, b * 2.5, 0.1, { scoop: 1.5 });
        if (bar % 2 === 1) S.musicBox(a.out, deg(81, 'hira', R.pick([0, 2, 3])), t + b * 3.5, 0.08);
      },
    },
    // War: drums and a low tremor, war horns and a snare in the second part, a choir when it breaks
    war: {
      bpm: 100, beats: 4, seed: 61, reverb: 0.35, level: 0.55,
      bar(a, bar, t) {
        const S = a.synth, b = a.beat, R = a.rng;
        const f = form(bar, [['A', 8], ['B', 8], ['C', 4]]);
        S.pad(a.out, [26, 33], t, a.barDur, 0.09, { cutoff: 300, attack: 0.3 });
        const hits = bar % 4 === 3 ? [0, 1, 2, 2.5, 3, 3.25, 3.5, 3.75] : [0, 1.5, 2, 3];
        hits.forEach((k, i) => S.taiko(a.out, t + k * b, i === 0 ? 0.7 : 0.4, i === 0 ? 0.9 : 1.1));
        for (let i = 0; i < 8; i++) S.pluck(a.out, deg(38, 'phrygian', i % 2 ? 1 : 0), t + i * b / 2, 0.16, { bright: 0.2, dur: 0.5 });
        if (f.part === 'B') {
          for (let i = 0; i < 8; i++) S.snare(a.out, t + i * b / 2, i % 2 ? 0.05 : 0.09);
          if (f.i % 2 === 0) S.brass(a.out, [50, 57], t, b * 1.5, 0.09, { bright: 0.7 });
          if (f.i % 2 === 1) S.brass(a.out, [51, 58], t + b * 2, b * 1.8, 0.08, { bright: 0.7 });
        }
        if (f.part === 'C') {
          S.choir(a.out, [62, 65, 69], t, a.barDur, 0.07, { vowel: 'a', attack: 0.4 });
          S.timpani(a.out, 38, t, 0.5);
          if (f.last) S.cymbal(a.out, t, a.barDur, 0.08, true);
        }
        if (bar % 4 === 1) S.flute(a.out, deg(74, 'phrygian', R.pick([0, 1, 4])), t, b * 3, 0.13, { scoop: 2, vib: 0.02 });
      },
    },
    // The truth: piano and strings, from minor into major; the choir opens up with the major
    letter: {
      bpm: 58, beats: 4, seed: 71, reverb: 0.5,
      bar(a, bar, t) {
        const S = a.synth, b = a.beat;
        const prog = [[50, 3], [46, 4], [53, 4], [48, 4], [50, 3], [46, 4], [43, 3], [45, 4], [53, 4], [48, 4], [50, 3], [46, 4], [53, 4], [48, 4], [46, 4], [48, 4]];
        const [root, third] = prog[bar % 16];
        [0, 7, 12, third + 12, 19, third + 12, 12, 7].forEach((iv, i) => S.piano(a.out, root - 12 + iv, t + i * b / 2, i === 0 ? 0.3 : 0.15, 2.4));
        S.pad(a.out, [root, root + third, root + 7, root + 12], t, a.barDur, 0.04, { cutoff: 1300, vibrato: 0.004, attack: 1.8 });
        if (bar % 16 >= 10) S.choir(a.out, [root + 12, root + 12 + third, root + 19], t, a.barDur, 0.03, { vowel: 'a', attack: 1.5 });
        if (bar >= 1) {
          const m = phraseMotif(a, 'l', bar, 3, 5);
          const sc = bar % 16 < 8 ? 'minor' : 'major';
          const base = bar % 16 < 8 ? 74 : 77;
          m.forEach((d, i) => S.piano(a.out, deg(base, sc, d), t + [0, 1.5, 2.5][i] * b, 0.26, 3));
        }
      },
    },
    // Home: a music box and piano, bittersweet; strings take the tune the second time
    home: {
      bpm: 62, beats: 4, seed: 83, reverb: 0.5,
      bar(a, bar, t) {
        const S = a.synth, b = a.beat;
        const f = form(bar, [['A', 8], ['B', 8]]);
        const prog = [[60, 4], [57, 3], [53, 4], [55, 4], [60, 4], [52, 3], [53, 4], [55, 4]];
        const [root, third] = prog[bar % 8];
        [0, 7, 12, 7].forEach((iv, i) => S.piano(a.out, root - 12 + iv, t + i * b, 0.18, 2.6));
        S.pad(a.out, [root, root + third, root + 7], t, a.barDur, 0.028, { cutoff: 1000, type: 'triangle', attack: 1.6 });
        const m = phraseMotif(a, 'hm', bar, 4, 4);
        if (f.part === 'B') m.forEach((d, i) => S.bowed(a.out, deg(60, 'major', d), t + i * b + (i === 3 ? b / 2 : 0), b * (i === 3 ? 0.5 : 0.95), 0.06, { vib: 0.006, bright: 0.5 }));
        else m.forEach((d, i) => { if (a.rng() < 0.8) S.musicBox(a.out, deg(72, 'major', d), t + i * b + (i === 3 ? b / 2 : 0), 0.14); });
      },
    },
    // Sorrow: very little — a low piano, space, a held string; then a cello mourns
    sorrow: {
      bpm: 50, beats: 4, seed: 97, reverb: 0.6, level: 1.4,
      bar(a, bar, t) {
        const S = a.synth, b = a.beat;
        const f = form(bar, [['A', 8], ['B', 8]]);
        const prog = [[45, 3], [41, 4], [48, 4], [43, 4]];
        const [root, third] = prog[bar % 4];
        S.piano(a.out, root - 12, t, 0.25, 4);
        S.piano(a.out, root + third, t + b, 0.12, 3);
        S.pad(a.out, [root, root + 7], t, a.barDur, 0.035, { cutoff: 700, attack: 2.5, vibrato: 0.003 });
        if (f.part === 'B') {
          const m = phraseMotif(a, 'vc', bar, 2, 2);
          S.bowed(a.out, deg(45, 'harmonic', m[0]), t, b * 2.4, 0.07, { vib: 0.006, bright: 0.3, glide: -1, attack: 0.4 });
          S.bowed(a.out, deg(45, 'harmonic', m[1]), t + b * 2.5, b * 1.4, 0.06, { vib: 0.006, bright: 0.3, attack: 0.3 });
        } else if (bar % 2 === 1) S.piano(a.out, deg(69, 'minor', phraseMotif(a, 's', bar, 2, 4)[0]), t + b * 2, 0.18, 4);
      },
    },

    // ---- intense ----
    // Battle: string ostinato, war drums, low brass, a choir; horn calls and snare when it surges
    battle: {
      bpm: 132, beats: 4, seed: 101, reverb: 0.3, level: 0.5,
      bar(a, bar, t) {
        const S = a.synth, b = a.beat;
        const f = form(bar, [['intro', 2], ['A', 8], ['B', 8], ['C', 4], ['A', 8], ['D', 8]]);
        const root = 38 + (f.part === 'D' ? 3 : 0); // the last surge climbs a minor third
        const P = (n, o = 0) => deg(root + 12 * o, 'phrygian', n);
        const chords = [[0, 2, 4], [0, 2, 4], [5, 7, 9], [1, 3, 5]]; // i i VI bII — the flat second is the threat
        const ch = chords[bar % 4].map((n) => P(n, 1));
        const r = ch[0] - 12;
        if (f.part !== 'C') [0, 0, 12, 0, 0, 12, 7, 12].forEach((iv, i) => S.bowed(a.out, r + iv, t + i * b / 2, b * 0.32, i % 2 ? 0.07 : 0.1, { vib: 0, attack: 0.015, bright: 0.35 }));
        const drums = f.part === 'intro' ? [0, 2] : f.part === 'C' ? [0, 2.5] : [0, 1.5, 2, 3, 3.5];
        drums.forEach((k, i) => S.taiko(a.out, t + k * b, i === 0 ? 0.75 : 0.45, i === 0 ? 0.8 : 1));
        if (f.part === 'B' || f.part === 'D') for (let i = 0; i < 16; i++) S.snare(a.out, t + i * b / 4, (i % 4 === 0 ? 0.14 : 0.06) * (0.8 + a.rng() * 0.4));
        if (f.first && f.part !== 'intro') S.cymbal(a.out, t, 2.5, 0.12);
        if (f.part !== 'intro') S.choir(a.out, ch.map((n) => n + 12), t, a.barDur, f.part === 'C' ? 0.09 : 0.05, { vowel: 'a', attack: 0.3 });
        if (f.part === 'A' || f.part === 'D') {
          S.brass(a.out, [r, r + 7], t, b * 0.8, 0.12, { bright: 0.6 });
          S.brass(a.out, [r, r + 7], t + 2.5 * b, b * 0.6, 0.1, { bright: 0.5 });
        }
        if (f.part === 'B' || f.part === 'D') {
          const m = phraseMotif(a, 'bh', bar, 3, 4);
          [[0, 1.5], [1.5, 1], [2.5, 1.5]].forEach(([k, d], i) => S.brass(a.out, [P(m[i], 2)], t + k * b, d * b, 0.08, { bright: 0.9 }));
        }
        if (f.part === 'C') {
          S.timpani(a.out, r, t, 0.6);
          S.brass(a.out, [r, r + 7, r + 12], t, b * 1.5, 0.13, { bright: 0.8 });
          if (f.last) { S.cymbal(a.out, t, a.barDur, 0.1, true); S.roll(a.out, r, t + 2 * b, 2 * b, 0.05, 0.4); }
        }
        if (f.last && f.part !== 'C' && f.part !== 'intro') S.roll(a.out, r, t + 3 * b, b, 0.08, 0.35);
      },
    },
    // Tension: a held breath — a low drone, a pulse, high strings rubbing against each other
    tension: {
      bpm: 76, beats: 4, seed: 113, reverb: 0.5, level: 0.9,
      bar(a, bar, t) {
        const S = a.synth, b = a.beat, R = a.rng;
        const f = form(bar, [['A', 8], ['B', 8], ['C', 4]]);
        const root = 40;
        S.pad(a.out, [root, root + 7], t, a.barDur, 0.06, { cutoff: 260, attack: 1.5 });
        S.taiko(a.out, t, 0.32, 0.6);
        S.taiko(a.out, t + 0.3, 0.2, 0.58);
        if (f.part !== 'A') { S.taiko(a.out, t + 2 * b, 0.28, 0.6); S.taiko(a.out, t + 2 * b + 0.3, 0.18, 0.58); }
        if (bar % 2 === 0 || f.part !== 'A') (f.part === 'C' ? [76, 77, 83] : [76, 77]).forEach((m) => S.bowed(a.out, m, t, a.barDur * 0.95, 0.022, { vib: 0.02, attack: 1.2, bright: 0.8 }));
        if (f.part !== 'A') for (let i = 0; i < 8; i++) S.noise(a.out, t + i * b / 2, 0.03, { type: 'bandpass', f: i % 2 ? 2400 : 3000, q: 8, gain: 0.1, attack: 0.001 });
        if (bar % 4 === 2) S.brass(a.out, [root + 12 + R.pick([0, 1, 3])], t + b, b * 2.5, 0.06, { bright: 0.3, attack: 0.5 });
        if (f.part === 'A' && f.first) S.timpani(a.out, root + 12, t, 0.45);
        if (f.part === 'C' && f.last) S.roll(a.out, root + 12, t + 2 * b, 2 * b, 0.03, 0.3);
        if (bar % 4 === 0) S.piano(a.out, R.pick([64, 65, 70]), t + b * 3, 0.13, 3);
      },
    },
    // Pursuit: running — a fast string ostinato, drums on the off-beat, a clock that won't stop
    pursuit: {
      bpm: 144, beats: 4, seed: 163, reverb: 0.3, level: 0.55,
      bar(a, bar, t) {
        const S = a.synth, b = a.beat;
        const f = form(bar, [['A', 4], ['B', 4]]);
        const r = [37, 37, 33, 35][bar % 4];
        for (let i = 0; i < 8; i++) S.bowed(a.out, r + (i % 4 === 3 ? 7 : i % 2 ? 12 : 0), t + i * b / 2, b * 0.3, 0.09, { vib: 0, attack: 0.012, bright: 0.3 });
        [0, 0.75, 1.5, 2, 2.75, 3.5].forEach((k, i) => S.taiko(a.out, t + k * b, i === 0 ? 0.5 : 0.28, 1.1));
        for (let i = 0; i < 8; i++) S.noise(a.out, t + i * b / 2, 0.025, { type: 'bandpass', f: 2800, q: 7, gain: 0.09, attack: 0.001 });
        if (f.part === 'B') {
          S.bowed(a.out, r + 36 + (bar % 2), t, a.barDur * 0.95, 0.022, { vib: 0.025, attack: 0.3, bright: 0.9 });
          S.brass(a.out, [r + 12, r + 19], t + 2 * b, b * 1.5, 0.08, { bright: 0.5 });
        }
      },
    },
    // Storm: the sea and the road turning against him — churning low strings, surging brass
    storm: {
      bpm: 112, beats: 4, seed: 171, reverb: 0.45, level: 0.75,
      bar(a, bar, t) {
        const S = a.synth, b = a.beat;
        const f = form(bar, [['A', 8], ['B', 8], ['C', 4]]);
        const [root, third] = [[48, 3], [44, 4], [46, 4], [43, 4]][bar % 4];
        [0, 7, 12, third + 12, 12, 7, 0, 7].forEach((iv, i) => S.bowed(a.out, root - 12 + iv, t + i * b / 2, b * 0.45, i % 4 === 0 ? 0.09 : 0.06, { vib: 0, attack: 0.02, bright: 0.35 }));
        S.pad(a.out, [root, root + third, root + 7], t, a.barDur, f.part === 'B' ? 0.05 : 0.035, { cutoff: f.part === 'B' ? 1400 : 800 });
        if (bar % 2 === 0) S.timpani(a.out, root - 12, t, 0.4);
        if (f.part === 'B') {
          const m = phraseMotif(a, 'st', bar, 2, 4);
          S.brass(a.out, [deg(60, 'minor', m[0])], t, b * 2, 0.08, { bright: 0.7 });
          S.brass(a.out, [deg(60, 'minor', m[1])], t + 2 * b, b * 2, 0.07, { bright: 0.7 });
        }
        if (f.part === 'A' && bar % 4 === 3) S.cymbal(a.out, t, a.barDur, 0.06, true);
        if (f.part === 'C') S.choir(a.out, [root + 12, root + 12 + third, root + 19], t, a.barDur, 0.05, { vowel: 'o', attack: 0.8 });
      },
    },

    // ---- emotional ----
    // Lament: a bowed voice like an erhu, sliding into its notes over a slow piano; a choir mourns with it
    lament: {
      bpm: 58, beats: 4, seed: 127, reverb: 0.6, level: 1.1,
      bar(a, bar, t) {
        const S = a.synth, b = a.beat, R = a.rng;
        const f = form(bar, [['A', 8], ['B', 8], ['C', 4]]);
        const [root, third] = [[45, 3], [41, 4], [48, 4], [43, 4], [45, 3], [50, 3], [40, 4], [45, 3]][bar % 8];
        [0, 7, 12 + third, 19].forEach((iv, i) => S.piano(a.out, root - 12 + iv, t + i * b, i === 0 ? 0.22 : 0.1, 3));
        S.pad(a.out, [root, root + third, root + 7], t, a.barDur, 0.025, { cutoff: 800, attack: 2, type: 'triangle' });
        if (f.part === 'C') { S.piano(a.out, deg(81, 'harmonic', R.pick([0, 2, 4])), t + b * 2, 0.12, 4); return; }
        const m = phraseMotif(a, 'lm', bar, 3, 4);
        [[0, 1.8], [2, 0.9], [3, 1]].forEach(([k, d], i) => S.bowed(a.out, deg(f.part === 'B' ? 69 : 57, 'harmonic', m[i]), t + k * b, d * b, 0.09, { glide: i === 0 ? -2 : -1, vib: 0.009, bright: 0.45, attack: 0.2 }));
        if (f.part === 'B') S.choir(a.out, [root + 12, root + 12 + third, root + 19], t, a.barDur, 0.04, { vowel: 'o', attack: 1.4 });
      },
    },
    // Farewell: it swells slowly — piano, then strings, then a violin, then everything
    farewell: {
      bpm: 64, beats: 4, seed: 131, reverb: 0.55,
      bar(a, bar, t) {
        const S = a.synth, b = a.beat;
        const f = form(bar, [['A', 8], ['B', 8], ['C', 8], ['D', 8]]);
        const [root, third] = [[48, 4], [55, 4], [57, 3], [53, 4], [48, 4], [53, 4], [50, 3], [55, 4]][bar % 8];
        const lift = { A: 0, B: 1, C: 2, D: 3 }[f.part];
        [0, 7, 12, third + 12, 19, third + 12, 12, 7].forEach((iv, i) => S.piano(a.out, root - 12 + iv, t + i * b / 2, i === 0 ? 0.24 : 0.11, 2.2));
        if (lift >= 1) S.pad(a.out, [root, root + third, root + 7, root + 12], t, a.barDur, 0.02 + 0.01 * lift, { cutoff: 900 + lift * 400, vibrato: 0.004, attack: 1.2 });
        const m = phraseMotif(a, 'fw', bar, 4, 4);
        const rh = bar % 2 ? [0, 1, 2, 2.5] : [0, 1.5, 2, 3];
        const durs = bar % 2 ? [0.9, 0.9, 0.45, 1.4] : [1.4, 0.45, 0.9, 0.9];
        if (lift === 0) m.forEach((d, i) => S.piano(a.out, deg(72, 'major', d), t + rh[i] * b, 0.24, 2.6));
        else m.forEach((d, i) => S.bowed(a.out, deg(lift >= 2 ? 84 : 72, 'major', d), t + rh[i] * b, durs[i] * b, 0.05 + lift * 0.01, { vib: 0.007, bright: 0.6, glide: i === 0 ? -1 : 0 }));
        if (lift >= 2) S.bowed(a.out, root - 12, t, a.barDur * 0.95, 0.06, { vib: 0.004, bright: 0.3, attack: 0.5 });
        if (lift === 3) {
          S.choir(a.out, [root + 12, root + 12 + third, root + 19], t, a.barDur, 0.045, { vowel: 'a', attack: 1 });
          if (bar % 4 === 0) S.timpani(a.out, root - 12, t, 0.28);
        }
        if (f.part === 'C' && f.last) S.cymbal(a.out, t, a.barDur, 0.06, true);
        if (f.part === 'D' && f.first) S.cymbal(a.out, t, 3, 0.06);
      },
    },
    // Reverie: a harp rising, a celesta, a far choir — a daydream of her
    reverie: {
      bpm: 72, beats: 4, seed: 139, reverb: 0.65,
      bar(a, bar, t) {
        const S = a.synth, b = a.beat, R = a.rng;
        const f = form(bar, [['A', 8], ['B', 8]]);
        const [root, third] = [[53, 4], [55, 4], [57, 3], [55, 4]][bar % 4];
        [0, 7, 12, third + 12, 19, 24, third + 24, 19].forEach((iv, i) => S.pluck(a.out, root - 12 + iv, t + i * b / 2, 0.13 + (i === 0 ? 0.08 : 0), { bright: 0.8, dur: 2.2 }));
        S.choir(a.out, [root + 12, root + 12 + third, root + 19], t, a.barDur, 0.028, { vowel: 'u', attack: 1.6 });
        const m = phraseMotif(a, 'rv', bar, 4, 4);
        if (f.part === 'A') m.forEach((d, i) => { if (R() < 0.85) S.musicBox(a.out, deg(77, 'lydian', d), t + i * b, 0.12); });
        else {
          S.flute(a.out, deg(77, 'lydian', m[0]), t, b * 1.8, 0.1, { scoop: 0.4 });
          S.flute(a.out, deg(77, 'lydian', m[2]), t + 2 * b, b * 1.8, 0.09, { scoop: 0.4 });
        }
      },
    },
    // Departure: setting out — pizzicato strings walking forward, a flute, a violin, brushed drums
    departure: {
      bpm: 104, beats: 4, seed: 149, reverb: 0.35,
      bar(a, bar, t) {
        const S = a.synth, b = a.beat;
        const f = form(bar, [['A', 8], ['B', 8], ['A', 8], ['C', 4]]);
        const [root, third] = [[55, 4], [50, 4], [52, 3], [48, 4], [55, 4], [47, 3], [48, 4], [50, 4]][bar % 8];
        [0, 7, 12, 7, 0, 7, third + 12, 7].forEach((iv, i) => S.pluck(a.out, root - 12 + iv, t + i * b / 2, i % 2 ? 0.12 : 0.2, { bright: 0.55, dur: 0.6 }));
        if (f.part !== 'C') { S.snare(a.out, t + b, 0.03); S.snare(a.out, t + 3 * b, 0.03); }
        S.pad(a.out, [root, root + third, root + 7], t, a.barDur, 0.03, { cutoff: 1100, vibrato: 0.003 });
        const m = phraseMotif(a, 'dp', bar, 4, 4);
        if (f.part === 'A') m.forEach((d, i) => S.flute(a.out, deg(79, 'major', d), t + i * b, b * 0.9, 0.09, { scoop: 0.3 }));
        else if (f.part === 'B') m.forEach((d, i) => S.bowed(a.out, deg(67, 'major', d), t + [0, 1.5, 2, 3][i] * b, b * 1.2, 0.07, { vib: 0.006, bright: 0.6 }));
        else S.piano(a.out, deg(79, 'major', m[0]), t, 0.2, 3);
        if (f.first && f.part === 'B') S.timpani(a.out, root - 12, t, 0.25);
      },
    },
    // Revelation: the truth arriving — a piano like a heartbeat, strings, then choir and timpani in the major
    revelation: {
      bpm: 60, beats: 4, seed: 157, reverb: 0.6,
      bar(a, bar, t) {
        const S = a.synth, b = a.beat;
        const f = form(bar, [['A', 8], ['B', 8], ['C', 8]]);
        const prog = f.part === 'A' ? [[50, 3], [46, 4], [41, 4], [48, 4]] : [[53, 4], [48, 4], [50, 3], [46, 4]];
        const [root, third] = prog[bar % 4];
        [0, 12, 7, 12].forEach((iv, i) => S.piano(a.out, root + iv, t + i * b, i === 0 ? 0.22 : 0.12, 2.4));
        if (f.part !== 'A') S.pad(a.out, [root - 12, root, root + third, root + 7], t, a.barDur, f.part === 'C' ? 0.05 : 0.035, { cutoff: f.part === 'C' ? 1800 : 1100, vibrato: 0.004 });
        const m = phraseMotif(a, 'rvl', bar, 3, 4);
        if (f.part === 'A') m.forEach((d, i) => S.piano(a.out, deg(74, 'minor', d), t + [0, 1.5, 2.5][i] * b, 0.2, 3));
        else m.forEach((d, i) => S.bowed(a.out, deg(f.part === 'C' ? 77 : 65, 'major', d), t + [0, 1.5, 2.5][i] * b, [1.4, 1, 1.4][i] * b, 0.08, { vib: 0.008, bright: 0.6 }));
        if (f.part === 'C') {
          S.choir(a.out, [root + 12, root + 12 + third, root + 19], t, a.barDur, 0.055, { vowel: 'a', attack: 0.8 });
          if (bar % 2 === 0) S.timpani(a.out, root - 12, t, 0.32);
          S.brass(a.out, [root, root + 7], t, a.barDur * 0.9, 0.035, { bright: 0.4, attack: 0.6 });
        }
        if (f.part === 'B' && f.last) S.cymbal(a.out, t, a.barDur, 0.08, true);
        if (f.part === 'C' && f.first) S.cymbal(a.out, t, 3, 0.1);
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

  // ---- the sounds of war
  const boom = (S, dest, t, size = 1) => {
    S.taiko(dest, t, 0.8 * size, 0.42);
    S.noise(dest, t, 2.4 + size, { type: 'lowpass', f: 160 + 80 * size, gain: 0.55 * size, attack: 0.004 });
    S.noise(dest, t, 0.25, { type: 'bandpass', f: 900, q: 0.8, gain: 0.25 * size, attack: 0.002 });
  };
  const crack = (S, dest, t, vol = 0.3) => {
    S.noise(dest, t, 0.05, { type: 'highpass', f: 1400, gain: vol, attack: 0.0005 });
    S.noise(dest, t, 0.35, { type: 'lowpass', f: 500, gain: vol * 0.5, attack: 0.002 });
  };
  const volley = (S, dest, t, n = 10, vol = 0.22, spread = 0.9) => {
    for (let i = 0; i < n; i++) crack(S, dest, t + Math.random() * spread, vol * (0.5 + Math.random() * 0.6));
  };
  const shell = (S, dest, t, size = 1.1) => {
    // a whistle falling out of the sky, then the ground answers
    const ctx = S.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(1900, t);
    o.frequency.exponentialRampToValueAtTime(520, t + 1.3);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + 0.3);
    g.gain.linearRampToValueAtTime(0, t + 1.3);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + 1.35);
    boom(S, dest, t + 1.3, size);
  };
  const shouts = (S, dest, t, n = 8, vol = 0.05) => {
    // a crowd of men shouting far away: muffled syllables from many throats
    for (let i = 0; i < n; i++) {
      const pitch = 130 + Math.random() * 120;
      for (let k = 0; k < 2 + Math.floor(Math.random() * 3); k++) {
        S.syllable({ pitch, muffle: 650, breath: 0.4 }, 'aoea'[Math.floor(Math.random() * 4)], vol * (0.6 + Math.random() * 0.6), 1.1 + Math.random() * 0.2, Math.random() < 0.5, dest, t + i * 0.18 + k * 0.16 + Math.random() * 0.08);
      }
    }
  };
  const horn = (S, dest, t, vol = 0.08, far = false) => {
    const notes = far ? [50, 57] : [50, 57, 62];
    notes.forEach((m, i) => S.brass(dest, [m], t + i * 0.55, i === notes.length - 1 ? 1.6 : 0.5, vol, { bright: far ? 0.25 : 0.7, attack: 0.06 }));
  };
  const drumline = (S, dest, t, vol = 0.1) => {
    for (let i = 0; i < 12; i++) S.snare(dest, t + i * 0.15 + (i % 2) * 0.03, vol * (i % 4 === 0 ? 1 : 0.55));
  };

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
    // The battle all around: guns, volleys, shells, shouting, drums and horns, and things burning
    battle(a) {
      a.bed({ type: 'lowpass', f: 120, gain: 0.14, lfo: 0.07, depth: 0.6 });
      AMBIENCES.wind(a);
      a.every(0.05, 0.25, (t) => crackle(a.synth, a.out, t));
      a.every(2.2, 6, (t) => boom(a.synth, a.out, t, 0.35 + Math.random() * 0.4));
      a.every(2.5, 7, (t) => volley(a.synth, a.out, t, 6 + Math.floor(Math.random() * 10), 0.14));
      a.every(9, 20, (t) => shell(a.synth, a.out, t, 0.6));
      a.every(4, 10, (t) => shouts(a.synth, a.out, t, 5 + Math.floor(Math.random() * 7)));
      a.every(8, 16, (t) => drumline(a.synth, a.out, t, 0.07));
      a.every(14, 30, (t) => horn(a.synth, a.out, t, 0.06));
    },
    // The same war, heard from the hills: far guns and the odd volley
    battle_far(a) {
      AMBIENCES.ruins(a);
      a.bed({ type: 'lowpass', f: 90, gain: 0.08, lfo: 0.05, depth: 0.7 });
      a.every(6, 16, (t) => boom(a.synth, a.out, t, 0.35));
      a.every(10, 25, (t) => volley(a.synth, a.out, t, 5 + Math.floor(Math.random() * 6), 0.07, 1.4));
      a.every(25, 50, (t) => horn(a.synth, a.out, t, 0.025, true));
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
    // war
    musket: (S, o, t) => { crack(S, o, t, 0.7); S.noise(o, t + 0.12, 0.8, { type: 'bandpass', f: 700, q: 0.7, gain: 0.12, attack: 0.01 }); },
    volley: (S, o, t) => volley(S, o, t, 14, 0.45, 0.7),
    explosion: (S, o, t) => { boom(S, o, t, 1.6); S.noise(o, t + 0.05, 1.2, { type: 'highpass', f: 2500, gain: 0.12, attack: 0.02 }); for (let i = 0; i < 10; i++) S.noise(o, t + 0.4 + Math.random() * 1.2, 0.05, { type: 'bandpass', f: 1500 + Math.random() * 2000, q: 3, gain: 0.08, attack: 0.001 }); },
    shell: (S, o, t) => shell(S, o, t),
    // a war rocket: a rising hiss that crackles as it burns, then a pop high in the air
    rocket: (S, o, t) => { const n = S.noise(o, t, 1.7, { type: 'bandpass', f: 700, q: 2.2, gain: 0.2, attack: 0.08 }); n.flt.frequency.exponentialRampToValueAtTime(3600, t + 1.5); for (let i = 0; i < 16; i++) crackle(S, o, t + 0.1 + Math.random() * 1.5); crack(S, o, t + 1.7, 0.22); },
    // ringing in the ears: two high tones beating against each other, fading slowly
    ringing: (S, o, t) => {
      for (const [f, v] of [[4100, 0.035], [4172, 0.03], [2050, 0.012]]) {
        const osc = S.ctx.createOscillator(), g = S.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(v, t + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 4.2);
        osc.connect(g).connect(o);
        osc.start(t);
        osc.stop(t + 4.3);
      }
    },
    // a paper fan snapped shut
    fan_snap: (S, o, t) => { S.noise(o, t, 0.06, { type: 'highpass', f: 2400, gain: 0.35, attack: 0.001 }); S.noise(o, t + 0.02, 0.12, { type: 'bandpass', f: 900, q: 3, gain: 0.2, attack: 0.002 }); },
    // something heavy hitting the ground: a stumble, a fall
    thud: (S, o, t) => { S.taiko(o, t, 0.7, 0.8); S.noise(o, t, 0.35, { type: 'lowpass', f: 300, gain: 0.5, attack: 0.004 }); },
    // a gun far across the valley: more rumble than bang
    cannon_far: (S, o, t) => { S.taiko(o, t, 0.45, 0.4); S.noise(o, t, 3.2, { type: 'lowpass', f: 150, gain: 0.45, attack: 0.03 }); },
    // a battery firing down the line
    battery: (S, o, t) => { for (let i = 0; i < 4; i++) { S.taiko(o, t + i * 0.55, 0.9, 0.5); S.noise(o, t + i * 0.55, 2.2, { type: 'lowpass', f: 240, gain: 0.5, attack: 0.005 }); } },
    horn: (S, o, t) => horn(S, o, t, 0.14),
    drumroll: (S, o, t) => { for (let i = 0; i < 24; i++) S.snare(o, t + i * 0.06, 0.05 + 0.25 * (i / 23)); S.timpani(o, 38, t + 1.45, 0.5); },
    shouts: (S, o, t) => shouts(S, o, t, 10, 0.1),
    sword: (S, o, t) => {
      // steel leaving its scabbard, and ringing
      const n = S.noise(o, t, 0.45, { type: 'bandpass', f: 2500, q: 3, gain: 0.25, attack: 0.3 });
      n.flt.frequency.exponentialRampToValueAtTime(6000, t + 0.45);
      [2350, 3710, 5230].forEach((f, i) => { const ctx = S.ctx, x = ctx.createOscillator(), g = ctx.createGain(); x.frequency.value = f; g.gain.setValueAtTime(0, t + 0.42); g.gain.linearRampToValueAtTime(0.05 / (i + 1), t + 0.44); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2); x.connect(g).connect(o); x.start(t + 0.42); x.stop(t + 2.3); });
    },
    // ---- a theme for each character, played when we first meet them (5 to 7 seconds)
    // Hervé: the traveller. A drum roll, horns, and a flute that climbs toward the horizon.
    theme_herve: (S, o, t) => {
      S.roll(o, 38, t, 0.8, 0.03, 0.26);
      S.cymbal(o, t + 0.8, 2.6, 0.08);
      S.brass(o, [50, 57, 62], t + 0.8, 1.6, 0.065, { bright: 0.8 });
      S.pad(o, [50, 54, 57, 62], t + 0.8, 4.6, 0.035, { cutoff: 1400, vibrato: 0.004 });
      [[69, 0.8, 0.9], [74, 1.7, 0.45], [76, 2.15, 0.45], [78, 2.6, 1.2], [76, 3.8, 0.6], [74, 4.4, 1.8]].forEach(([m, k, d]) => S.flute(o, m, t + k, d, 0.13, { scoop: 0.5 }));
      for (let i = 0; i < 10; i++) S.pluck(o, [38, 45, 50, 45][i % 4], t + 0.8 + i * 0.45, 0.2, { bright: 0.4, dur: 1 });
      S.timpani(o, 38, t + 4.4, 0.26);
    },
    // Hélène: home. A piano opening like a window, a music box, strings that turn from minor to major.
    theme_helene: (S, o, t) => {
      [45, 52, 57, 60, 64].forEach((m, i) => S.piano(o, m, t + i * 0.18, 0.2, 3));
      [[76, 0.9], [74, 1.35], [72, 1.8], [76, 2.25], [79, 3.1], [76, 3.55], [72, 4.0]].forEach(([m, k]) => S.musicBox(o, m, t + k, 0.14));
      S.pad(o, [57, 60, 64], t + 0.3, 2.6, 0.04, { cutoff: 1200, vibrato: 0.004, type: 'triangle' });
      S.pad(o, [60, 64, 67], t + 2.9, 3, 0.045, { cutoff: 1400, vibrato: 0.004, type: 'triangle' });
      S.bowed(o, 64, t + 2.9, 2.6, 0.06, { vib: 0.007, bright: 0.55, glide: -1 });
      S.choir(o, [72, 76], t + 3, 2.6, 0.025, { vowel: 'a', attack: 1.2 });
      [48, 55, 60, 64, 67].forEach((m, i) => S.piano(o, m, t + 2.9 + i * 0.16, 0.16, 3));
    },
    // Baldabiou: a bouncing waltz, oom-pah-pah, with a brass flourish at the end.
    theme_balbadiou: (S, o, t) => {
      const b = 0.36;
      for (let bar = 0; bar < 4; bar++) {
        const root = [43, 50, 43, 50][bar];
        S.pluck(o, root, t + bar * b * 3, 0.4, { bright: 0.4, dur: 0.9 });
        for (const k of [1, 2]) { S.pluck(o, root + 16, t + (bar * 3 + k) * b, 0.18, { bright: 0.6, dur: 0.5 }); S.pluck(o, root + 19, t + (bar * 3 + k) * b, 0.14, { bright: 0.6, dur: 0.5 }); }
        S.brass(o, [root + 12], t + bar * b * 3, b * 0.6, 0.06, { bright: 0.5 });
      }
      [[67, 0], [71, 1], [74, 2], [71, 3], [67, 4], [69, 5], [71, 6], [74, 7.5], [79, 9]].forEach(([m, k]) => S.musicBox(o, m, t + k * b, 0.14));
      S.brass(o, [62, 67, 71], t + 12 * b, 0.4, 0.1, { bright: 1 });
      S.brass(o, [67, 71, 74, 79], t + 13 * b, 1.4, 0.11, { bright: 1 });
      S.snare(o, t + 12 * b, 0.12); S.cymbal(o, t + 13 * b, 2, 0.07);
    },
    // Hara Kei: authority. Taiko, a low horn, a bamboo flute falling through the old scale, a gong.
    theme_harakei: (S, o, t) => {
      [[0, 0.42, 0.8], [0.55, 0.3, 0.9], [1.1, 0.5, 0.7]].forEach(([k, v, p]) => S.taiko(o, t + k, v, p));
      S.brass(o, [38, 45], t + 1.1, 3.4, 0.07, { bright: 0.35, attack: 0.4 });
      S.choir(o, [50, 57], t + 1.1, 3.6, 0.04, { vowel: 'o', attack: 1 });
      [[4, 1.4, 1.1], [3, 2.5, 0.6], [2, 3.1, 0.6], [0, 3.7, 1.6]].forEach(([d, k, dur]) => S.flute(o, [62, 63, 67, 69, 70, 74][d] + 12, t + k, dur, 0.14, { scoop: 1.6, vib: 0.02 }));
      S.bell(o, 33, t + 3.7, 0.24, 6);
      S.taiko(o, t + 3.7, 0.45, 0.7);
    },
    // Yukimura: a mystery. A koto sweeping upward, far bells, a flute that never quite lands.
    theme_woman: (S, o, t) => {
      [57, 59, 60, 64, 65, 69, 71, 72, 76, 77, 81].forEach((m, i) => S.pluck(o, m, t + i * 0.07, 0.16, { bright: 0.85, dur: 2.4 }));
      S.bell(o, 93, t + 0.8, 0.06, 3); S.bell(o, 88, t + 1.6, 0.05, 3);
      S.choir(o, [76, 81], t + 0.6, 4.4, 0.03, { vowel: 'u', attack: 1.8 });
      S.pad(o, [45, 52], t + 0.6, 4.6, 0.035, { cutoff: 500, attack: 1.6 });
      S.flute(o, 81, t + 1.2, 1.6, 0.11, { scoop: 1.8, vib: 0.018 });
      S.flute(o, 77, t + 2.9, 2.2, 0.1, { scoop: 1.2, vib: 0.02 });
      [[88, 4.6], [89, 4.75], [93, 4.9]].forEach(([m, k]) => S.musicBox(o, m, t + k, 0.06));
    },
    // Madame Blanche: the salon. A celesta, a harp, and a violin that slides into its notes.
    theme_blanche: (S, o, t) => {
      [52, 59, 64, 67, 71].forEach((m, i) => S.pluck(o, m, t + i * 0.12, 0.16, { bright: 0.8, dur: 2.6 }));
      [[83, 0.6], [81, 0.9], [79, 1.2], [78, 1.5], [79, 2.4], [83, 2.7]].forEach(([m, k]) => S.musicBox(o, m, t + k, 0.11));
      [[71, 0.9, 0.9, -2], [73, 1.8, 0.6, -1], [74, 2.4, 0.6, 0], [76, 3.0, 2.2, -2]].forEach(([m, k, d, g]) => S.bowed(o, m, t + k, d, 0.07, { vib: 0.009, bright: 0.6, glide: g }));
      S.pad(o, [52, 55, 59, 62], t + 0.4, 4.6, 0.035, { cutoff: 1100, vibrato: 0.004, type: 'triangle' });
      for (let i = 0; i < 8; i++) S.snare(o, t + 0.6 + i * 0.6, 0.02);
    },

    // hits and swells for dramatic moments
    sting: (S, o, t) => { S.brass(o, [38, 45, 50, 53], t, 1.2, 0.16, { bright: 0.9, attack: 0.02 }); S.taiko(o, t, 0.6, 0.6); S.timpani(o, 38, t, 0.45); S.cymbal(o, t, 2.5, 0.12); S.choir(o, [62, 65, 69], t, 1.2, 0.08, { vowel: 'a', attack: 0.05 }); },
    swell: (S, o, t) => { S.pad(o, [60, 64, 67, 72], t, 2.4, 0.07, { cutoff: 1500, attack: 2.2, vibrato: 0.004 }); S.cymbal(o, t, 2.6, 0.06, true); S.choir(o, [72, 76, 79], t + 0.6, 1.8, 0.04, { vowel: 'a', attack: 1.4 }); },
    dread: (S, o, t) => { S.pad(o, [28, 29], t, 3, 0.12, { cutoff: 220, attack: 1.2 }); S.bowed(o, 88, t, 3, 0.03, { vib: 0.03, attack: 1.5, bright: 0.9 }); S.bowed(o, 89, t, 3, 0.03, { vib: 0.03, attack: 1.5, bright: 0.9 }); },
    heartbeat_fast: (S, o, t) => { for (let i = 0; i < 4; i++) { S.taiko(o, t + i * 0.5, 0.5, 0.7); S.taiko(o, t + i * 0.5 + 0.2, 0.32, 0.65); } },
    // the army camp's morning
    bugle: (S, o, t) => {
      // a B-flat bugle, which has only the notes of its one tube (F, B-flat, D, F, B-flat): the colours going up
      const [F4, Bb4, D5, F5, Bb5] = [65, 70, 74, 77, 82];
      const call = [[F4, 0.3], [Bb4, 0.3], [D5, 0.8], [0, 0.15], [F5, 0.3], [D5, 0.3], [Bb4, 0.8], [0, 0.15], [D5, 0.22], [D5, 0.22], [F5, 0.45], [D5, 0.45], [Bb4, 0.45], [F4, 0.8], [0, 0.15], [Bb4, 0.3], [D5, 0.3], [F5, 0.3], [Bb5, 1.5], [0, 0.1], [F5, 0.4], [D5, 0.4], [Bb4, 1.4]];
      let k = 0;
      for (const [m, d] of call) { if (m) S.brass(o, [m], t + k, d * 0.9, 0.1, { bright: 1, attack: 0.03 }); k += d; }
    },
    whistle: (S, o, t) => {
      // a steam whistle, far off: a breathy chord that swoops up and holds, then a short second blast
      const ctx = S.ctx;
      const blast = (t0, dur) => {
        for (const f of [520, 660, 780]) {
          const x = ctx.createOscillator(), g = ctx.createGain();
          x.type = 'triangle';
          x.frequency.setValueAtTime(f * 0.9, t0);
          x.frequency.exponentialRampToValueAtTime(f, t0 + 0.12);
          x.frequency.setValueAtTime(f, t0 + dur);
          x.frequency.exponentialRampToValueAtTime(f * 0.94, t0 + dur + 0.15);
          g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.05, t0 + 0.1); g.gain.setValueAtTime(0.05, t0 + dur); g.gain.linearRampToValueAtTime(0, t0 + dur + 0.15);
          x.connect(g).connect(o); x.start(t0); x.stop(t0 + dur + 0.2);
        }
        S.noise(o, t0, dur, { type: 'bandpass', f: 1400, q: 3, gain: 0.08, attack: 0.08 });
      };
      blast(t, 1.1); blast(t + 1.45, 0.45);
    },
    chuff: (S, o, t) => S.noise(o, t, 0.16, { type: 'bandpass', f: 380 + Math.random() * 80, q: 0.9, gain: 0.35, attack: 0.01 }),
    drone: (S, o, t) => {
      // an airship's engine going over: a low throb with the propeller's beat in it, rising and fading
      const ctx = S.ctx, x = ctx.createOscillator(), lp = ctx.createBiquadFilter(), beat = ctx.createGain(), g = ctx.createGain(), am = ctx.createOscillator(), depth = ctx.createGain();
      x.type = 'sawtooth'; x.frequency.setValueAtTime(52, t); x.frequency.linearRampToValueAtTime(47, t + 7.5);
      lp.type = 'lowpass'; lp.frequency.value = 260;
      am.frequency.value = 7; depth.gain.value = 0.4; beat.gain.value = 0.6;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.14, t + 2.5); g.gain.setValueAtTime(0.14, t + 4.5); g.gain.linearRampToValueAtTime(0, t + 7.5);
      am.connect(depth).connect(beat.gain);
      x.connect(lp).connect(beat).connect(g).connect(o);
      x.start(t); am.start(t); x.stop(t + 7.6); am.stop(t + 7.6);
    },
    band: (S, o, t) => {
      // a regimental band practising somewhere across the camp: fifes over a side drum and a bass drum
      const b = 0.28;
      const tune = [72, 77, 77, 81, 77, 72, 77, 81, 84, 82, 81, 79, 77, 0, 72, 76, 77, 79, 81, 79, 77, 76, 77, 0];
      tune.forEach((m, i) => { if (m) S.flute(o, m, t + i * b, b * 0.85, 0.06, { scoop: 0.2, vib: 0.008 }); });
      for (let i = 0; i < tune.length; i++) { S.snare(o, t + i * b, i % 2 ? 0.02 : 0.035); if (i % 4 === 0) S.taiko(o, t + i * b, 0.05, 0.55); }
    },
    mutter: (S, o, t) => {
      // men talking, too far off to make out the words
      const pitch = 105 + Math.random() * 60;
      for (let k = 0, n = 4 + Math.floor(Math.random() * 4); k < n; k++) S.syllable({ pitch, muffle: 900, breath: 0.3 }, 'aoeiu'[Math.floor(Math.random() * 5)], 0.05, 1 + Math.random() * 0.15, Math.random() < 0.5, o, t + k * 0.14);
    },
    // the everyday
    step: (S, o, t) => S.noise(o, t, 0.07, { type: 'lowpass', f: 420 + Math.random() * 120, gain: 0.45, attack: 0.003 }),
    hoof: (S, o, t) => { S.noise(o, t, 0.06, { type: 'bandpass', f: 520, q: 2, gain: 0.5, attack: 0.002 }); S.noise(o, t + 0.09, 0.05, { type: 'bandpass', f: 460, q: 2, gain: 0.35, attack: 0.002 }); },
    footsteps: (S, o, t) => { for (let i = 0; i < 4; i++) S.noise(o, t + i * 0.42 + Math.random() * 0.04, 0.09, { type: 'lowpass', f: 380, gain: 0.5, attack: 0.004 }); },
    running: (S, o, t) => { for (let i = 0; i < 8; i++) S.noise(o, t + i * 0.2 + Math.random() * 0.03, 0.07, { type: 'lowpass', f: 450, gain: 0.45, attack: 0.003 }); },
    gallop: (S, o, t) => { for (let i = 0; i < 12; i++) S.noise(o, t + Math.floor(i / 3) * 0.42 + (i % 3) * 0.09, 0.06, { type: 'bandpass', f: 500, q: 2, gain: 0.5, attack: 0.002 }); },
    door: (S, o, t) => { SOUNDS.creak(S, o, t); S.noise(o, t + 0.9, 0.2, { type: 'lowpass', f: 300, gain: 0.8, attack: 0.002 }); },
    creak: (S, o, t) => {
      const ctx = S.ctx, x = ctx.createOscillator(), g = ctx.createGain(), bp = ctx.createBiquadFilter();
      x.type = 'sawtooth';
      x.frequency.setValueAtTime(70, t);
      x.frequency.linearRampToValueAtTime(110, t + 0.4);
      x.frequency.linearRampToValueAtTime(85, t + 0.8);
      bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 3;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.5, t + 0.1); g.gain.linearRampToValueAtTime(0, t + 0.85);
      x.connect(bp).connect(g).connect(o); x.start(t); x.stop(t + 0.9);
    },
    pour: (S, o, t) => { const n = S.noise(o, t, 1.6, { type: 'bandpass', f: 1200, q: 4, gain: 0.4, attack: 0.15 }); n.flt.frequency.linearRampToValueAtTime(700, t + 1.6); for (let i = 0; i < 8; i++) S.noise(o, t + 0.2 + i * 0.16, 0.05, { type: 'bandpass', f: 600 + Math.random() * 400, q: 8, gain: 0.3, attack: 0.005 }); },
    rustle: (S, o, t) => { for (let i = 0; i < 6; i++) S.noise(o, t + i * 0.06 + Math.random() * 0.05, 0.15, { type: 'highpass', f: 2200, gain: 0.07, attack: 0.02 }); },
    shatter: (S, o, t) => { S.noise(o, t, 0.08, { type: 'highpass', f: 3000, gain: 0.5, attack: 0.001 }); for (let i = 0; i < 9; i++) S.bell(o, 86 + Math.floor(Math.random() * 10), t + 0.04 + Math.random() * 0.5, 0.04, 0.5); },
    splash: (S, o, t) => { S.noise(o, t, 0.9, { type: 'bandpass', f: 1300, q: 0.8, gain: 0.3, attack: 0.01 }); S.noise(o, t, 0.3, { type: 'lowpass', f: 400, gain: 0.3, attack: 0.005 }); },
  };

  VN.Synth = Synth;
  VN.SYNTH_TRACKS = TRACKS;
  VN.SYNTH_AMBIENCES = AMBIENCES;
  VN.SYNTH_SOUNDS = SOUNDS;
})();
