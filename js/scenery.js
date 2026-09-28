/*
 * scenery.js — the painted backgrounds, built from layers that move.
 *
 * tools/paint-backgrounds.js paints each scene as a stack of small pixel-art
 * layers (the sky, the land, drifting clouds, trees that sway, a boat that
 * bobs...) and describes them in story/scenery.js. Here each layer is enlarged
 * with crisp pixels onto a canvas and given its motion:
 *
 *   drift  clouds sliding past, seamlessly     sway   trees, grass, curtains
 *   bob    boats and lanterns on water          wave   banners and cloth
 *   pulse  lights breathing                      spin   wheels
 *
 * Every layer also has a depth: the view follows the mouse a little, and near
 * layers move more than far ones.
 */
(function () {
  'use strict';
  const VN = globalThis.VN;
  const h = VN.h;

  const NW = 480;
  const NH = 270;
  const UNIT = 720 / NH; // one scene pixel, in stage units
  const images = new Map();

  const data = () => globalThis.VN_SCENERY || {};
  const url = (src) => (globalThis.VN_EMBEDDED_ASSETS || {})[src] || src;
  const pct = (v) => `${v * 100}%`;

  function loadImage(src) {
    if (!images.has(src)) {
      images.set(src, new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url(src);
      }));
    }
    return images.get(src);
  }

  /** How many screen pixels each scene pixel should become, for crisp art without waste. */
  function scaleFactor() {
    const stage = document.getElementById('stage');
    const k = stage ? parseFloat(stage.style.getPropertyValue('--k')) || 1 : 1;
    const dev = 720 * k * (window.devicePixelRatio || 1);
    return Math.max(2, Math.min(4, Math.ceil(dev / NH)));
  }

  function motion(cv, a) {
    const T = a.t || 6;
    cv.style.setProperty('--a', String(a.type === 'bob' ? (a.a || 1) * UNIT : a.a == null ? 1 : a.a));
    cv.style.setProperty('--r', String(a.r || 0));
    cv.style.setProperty('--lo', String(a.lo == null ? 0.55 : a.lo));
    cv.style.transformOrigin = `${(a.ox == null ? 0.5 : a.ox) * 100}% ${(a.oy == null ? 1 : a.oy) * 100}%`;
    const ease = a.type === 'drift' || a.type === 'spin' ? 'linear' : 'ease-in-out';
    return `art-${a.type} ${T}s ${ease} ${a.type === 'drift' ? 0 : -(Math.random() * T).toFixed(2)}s infinite`;
  }

  const Scenery = {
    has(name) { return !!data()[name]; },

    /** The whole picture in one small image (save thumbnails, the soft backdrop). */
    flatUrl(name) {
      const s = data()[name];
      return s ? url(s.flat) : null;
    },

    /** Start (or wait for) loading every layer of a scene. */
    load(name) {
      const s = data()[name];
      return s ? Promise.all(s.layers.map((l) => loadImage(l.src))) : Promise.resolve();
    },

    /** Build the scene inside a background element; returns the frame the layers live in. */
    build(bgEl, name, { reduce = false } = {}) {
      const s = data()[name];
      const frame = h('div.bg-frame.bg-scenery', { style: { '--ar': String(NW / NH) } });
      const k = scaleFactor();
      for (const l of s.layers) {
        const drift = l.anim && l.anim.type === 'drift';
        const layer = h('div.bg-layer', {
          style: { left: pct(l.x / NW), top: pct(l.y / NH), width: pct(l.w / NW), height: pct(l.h / NH), '--d': String(l.depth) },
        });
        const cv = h('canvas.bg-art');
        const reps = drift ? 2 : 1;
        cv.width = l.w * k * reps;
        cv.height = l.h * k;
        if (drift) cv.style.width = '200%';
        if (l.anim && !reduce) cv.style.animation = motion(cv, l.anim);
        loadImage(l.src).then((img) => {
          if (!img) return;
          const c = cv.getContext('2d');
          c.imageSmoothingEnabled = false;
          for (let i = 0; i < reps; i++) c.drawImage(img, i * l.w * k, 0, l.w * k, l.h * k);
        });
        layer.append(cv);
        frame.append(layer);
      }
      const [va, vc] = s.vignette || [0.4, '0,0,0'];
      bgEl.append(frame, h('div.bg-vignette', { style: { background: `radial-gradient(ellipse 75% 70% at 50% 45%, rgba(${vc},0) 40%, rgba(${vc},${va}) 100%)` } }));
      return frame;
    },
  };

  VN.Scenery = Scenery;
})();
