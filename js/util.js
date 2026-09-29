/*
 * util.js — small shared helpers: DOM builder, storage, asset lookup.
 */
(function () {
  'use strict';
  const VN = (globalThis.VN = globalThis.VN || {});

  /** h('div.box#id', {onclick}, child, 'text') → element */
  function h(sel, attrs, ...children) {
    const m = sel.match(/^([a-z0-9]+)?((?:[.#][\w-]+)*)$/i);
    const el = document.createElement((m && m[1]) || 'div');
    if (m && m[2]) {
      for (const part of m[2].match(/[.#][\w-]+/g)) {
        if (part[0] === '.') el.classList.add(part.slice(1));
        else el.id = part.slice(1);
      }
    }
    if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) {
      children.unshift(attrs);
      attrs = null;
    }
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
        else if (k === 'style' && typeof v === 'object') {
          for (const [prop, val] of Object.entries(v)) {
            if (prop.startsWith('--')) el.style.setProperty(prop, val);
            else el.style[prop] = val;
          }
        }
        else if (k === 'text') el.textContent = v;
        else if (k === 'html') el.innerHTML = v;
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return el;
  }

  const clone = (o) => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---------------------------------------------------------------------------
  // Storage — localStorage when available, in-memory otherwise (private mode,
  // sandboxed frames). Every access is guarded so a blocked store never breaks
  // the game.
  // ---------------------------------------------------------------------------
  const memory = new Map();
  let prefix = 'vn:';
  let ls = null;
  try {
    ls = globalThis.localStorage;
    const k = '__vn_test__';
    ls.setItem(k, '1');
    ls.removeItem(k);
  } catch (e) {
    ls = null;
  }

  const store = {
    setPrefix(p) { prefix = p; },
    get persistentAvailable() { return !!ls; },
    get(key, fallback) {
      try {
        const raw = ls ? ls.getItem(prefix + key) : memory.get(prefix + key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      const raw = JSON.stringify(value);
      try {
        if (ls) ls.setItem(prefix + key, raw);
        else memory.set(prefix + key, raw);
        return true;
      } catch (e) {
        memory.set(prefix + key, raw);
        return false;
      }
    },
    remove(key) {
      try { if (ls) ls.removeItem(prefix + key); } catch (e) { /* ignore */ }
      memory.delete(prefix + key);
    },
    /** Remove every key that starts with `start` (e.g. "save."). */
    clearStarting(start) {
      const full = prefix + start;
      try {
        if (ls) {
          const doomed = [];
          for (let i = 0; i < ls.length; i++) { const k = ls.key(i); if (k && k.startsWith(full)) doomed.push(k); }
          doomed.forEach((k) => ls.removeItem(k));
        }
      } catch (e) { /* ignore */ }
      for (const k of [...memory.keys()]) if (k.startsWith(full)) memory.delete(k);
    },
    clearAll() {
      try {
        if (ls) {
          const doomed = [];
          for (let i = 0; i < ls.length; i++) { const k = ls.key(i); if (k && k.startsWith(prefix)) doomed.push(k); }
          doomed.forEach((k) => ls.removeItem(k));
        }
      } catch (e) { /* ignore */ }
      for (const k of [...memory.keys()]) if (k.startsWith(prefix)) memory.delete(k);
    },
  };

  // ---------------------------------------------------------------------------
  // Assets — art and audio are found by naming convention, so dropping a file
  // into the right folder is all it takes. Missing files fall back to
  // placeholders (images) or silence (audio).
  //
  //   assets/bg/<name>.png|jpg|webp
  //   assets/sprites/<character>/<expression>.png|webp
  //   assets/cg/<name>.png|jpg|webp
  //   assets/chibi/<character>.png|webp
  //   assets/faces/<character>.png|webp   (portrait in the text box)
  //   assets/music/<name>.mp3|ogg|m4a|wav
  //   assets/sfx/<name>.mp3|ogg|wav
  // ---------------------------------------------------------------------------
  const IMAGE_EXT = ['png', 'jpg', 'webp'];
  const AUDIO_EXT = ['mp3', 'ogg', 'm4a', 'wav'];
  const cache = new Map(); // path-stem → url | null
  const pending = new Map();
  const overrides = {}; // "bg:name" → explicit path

  function probeImage(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  function probeAudio(url) {
    return new Promise((resolve) => {
      const a = new Audio();
      let settled = false;
      const done = (ok) => { if (!settled) { settled = true; resolve(ok); } };
      a.preload = 'metadata';
      a.addEventListener('loadedmetadata', () => done(true), { once: true });
      a.addEventListener('error', () => done(false), { once: true });
      setTimeout(() => done(false), 4000);
      a.src = url;
    });
  }

  function stemFor(kind, name) {
    switch (kind) {
      case 'bg': return `assets/bg/${name}`;
      case 'sprite': return `assets/sprites/${name}`; // name = "char/expression"
      case 'cg': return `assets/cg/${name}`;
      case 'chibi': return `assets/chibi/${name}`;
      case 'face': return `assets/faces/${name}`;
      case 'ui': return `assets/ui/${name}`;
      case 'music': return `assets/music/${name}`;
      case 'sound': return `assets/sfx/${name}`;
      case 'ambience': return `assets/music/${name}`;
    }
    return name;
  }

  const embedded = () => globalThis.VN_EMBEDDED_ASSETS || {};

  const assets = {
    /** Explicitly map an asset (e.g. from `background name "path"`). */
    override(kind, name, path) { overrides[`${kind}:${name}`] = path; },

    /** Synchronous lookup: url, null (known missing) or undefined (not checked yet). */
    lookup(kind, name) {
      return cache.get(`${kind}:${name}`);
    },

    /** Resolve an asset to a usable url, or null if it doesn't exist. Cached. */
    resolve(kind, name) {
      const key = `${kind}:${name}`;
      if (cache.has(key)) return Promise.resolve(cache.get(key));
      if (pending.has(key)) return pending.get(key);
      const isAudio = kind === 'music' || kind === 'sound' || kind === 'ambience';
      const p = (async () => {
        const emb = embedded();
        const explicit = overrides[key];
        // sprites and portraits are webp (tools/import-sprites.js), apart from the painted eyelids
        const imageExt = (kind === 'sprite' || kind === 'face') && !/\/blink$/.test(name) ? ['webp', 'png', 'jpg'] : IMAGE_EXT;
        const candidates = explicit ? [explicit] : (isAudio ? AUDIO_EXT : imageExt).map((e) => `${stemFor(kind, name)}.${e}`);
        if (isAudio && !explicit) {
          // Try formats this browser can actually play first.
          const probe = new Audio();
          candidates.sort((a, b) => (probe.canPlayType(mime(b)) ? 1 : 0) - (probe.canPlayType(mime(a)) ? 1 : 0));
        }
        for (const url of candidates) {
          if (emb[url]) return emb[url];
          // Single-file builds carry every asset inline; nothing to fetch.
          if (globalThis.VN_EMBEDDED_ONLY) continue;
          const ok = isAudio ? await probeAudio(url) : await probeImage(url);
          if (ok) return url;
        }
        return null;
      })().then((url) => {
        cache.set(key, url);
        pending.delete(key);
        return url;
      });
      pending.set(key, p);
      return p;
    },

    /** Resolve with a time limit, so a slow network never stalls the story. */
    resolveWithin(kind, name, ms) {
      return Promise.race([assets.resolve(kind, name), new Promise((r) => setTimeout(() => r(undefined), ms))]);
    },
  };

  function mime(url) {
    const ext = url.split('.').pop();
    return { mp3: 'audio/mpeg', ogg: 'audio/ogg', m4a: 'audio/mp4', wav: 'audio/wav' }[ext] || '';
  }

  VN.h = h;
  VN.clone = clone;

  /** Wait until a picture is decoded and ready to draw (or `ms` have passed), so it never pops in late. */
  VN.decodeImage = (url, ms = 600) => {
    if (!url) return Promise.resolve();
    const img = new Image();
    img.src = url;
    const ready = img.decode ? img.decode().catch(() => {}) : new Promise((r) => { img.onload = img.onerror = r; });
    return Promise.race([ready, new Promise((r) => setTimeout(r, ms))]);
  };
  VN.clamp = clamp;
  VN.store = store;
  VN.assets = assets;
})();
