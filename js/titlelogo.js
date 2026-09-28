/*
 * titlelogo.js — the animated title logo, in the style of a big adventure
 * game: carved ivory-and-gold letters with a worn texture, an oversized first
 * letter, a gleam of light that sweeps across the letters, glints that
 * twinkle on the edges, and a silk ribbon rippling behind the name.
 *
 * The carving is an SVG filter that is rendered once; everything that moves
 * (the gleam, the glints, the ribbon) is cheap to animate.
 */
(function () {
  'use strict';
  const VN = (globalThis.VN = globalThis.VN || {});

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Where the ribbon flows: a cubic curve from the lower left, through the
  // first letter, behind the name, dipping under the subtitle.
  const P = [[-60, 300], [150, 40], [420, 360], [900, 150]];

  function bezier(t) {
    const u = 1 - t;
    const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
    const x = a * P[0][0] + b * P[1][0] + c * P[2][0] + d * P[3][0];
    const y = a * P[0][1] + b * P[1][1] + c * P[2][1] + d * P[3][1];
    const dx = 3 * u * u * (P[1][0] - P[0][0]) + 6 * u * t * (P[2][0] - P[1][0]) + 3 * t * t * (P[3][0] - P[2][0]);
    const dy = 3 * u * u * (P[1][1] - P[0][1]) + 6 * u * t * (P[2][1] - P[1][1]) + 3 * t * t * (P[3][1] - P[2][1]);
    const len = Math.hypot(dx, dy) || 1;
    return { x, y, nx: -dy / len, ny: dx / len };
  }

  function build(title, subtitle, { animate = true } = {}) {
    const first = esc(title.charAt(0));
    const rest = esc(title.slice(1));
    const sub = subtitle ? esc(subtitle) : '';
    const uid = `lg${Math.random().toString(36).slice(2, 7)}`;
    const letters = `
      <text x="4" y="276" font-size="300">${first}</text>
      <text x="206" y="196" font-size="192" letter-spacing="4">${rest}</text>
      ${sub ? `<text x="808" y="262" font-size="45" font-weight="700" text-anchor="end" letter-spacing="2">${sub}</text>` : ''}`;
    const glints = [[92, 74], [232, 62], [418, 194], [590, 66], [742, 228]]
      .map(([x, y], i) => `<g transform="translate(${x} ${y})"><g class="lg-glint" style="animation-delay:${(i * 1.37).toFixed(2)}s"><circle r="14" fill="url(#${uid}-halo)"/><path fill="#fffdf0" d="M0 -16 L3 -3 L16 0 L3 3 L0 16 L-3 3 L-16 0 L-3 -3 Z"/></g></g>`).join('');

    const wrap = VN.h('div.title-logo', { role: 'img', 'aria-label': [title, subtitle].filter(Boolean).join(': ') });
    // Three stacked layers: the ribbon behind, the carved letters (static, so the
    // expensive filter renders once), and the gleam + glints in front.
    const VB = 'viewBox="-20 -10 860 340" aria-hidden="true" focusable="false"';
    const FONT = `font-family="Cinzel, 'Trajan Pro', Georgia, serif" font-weight="900"`;
    wrap.innerHTML = `
<svg class="lg-layer lg-back" ${VB}>
  <defs>
    <linearGradient id="${uid}-silk" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#6d0f12" stop-opacity="0"/>
      <stop offset="0.12" stop-color="#8f1b1a"/>
      <stop offset="0.45" stop-color="#c8332a"/>
      <stop offset="0.7" stop-color="#e45a3c"/>
      <stop offset="0.92" stop-color="#a82420"/>
      <stop offset="1" stop-color="#6d0f12" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <path class="lg-ribbon-body" fill="url(#${uid}-silk)"/>
  <path class="lg-ribbon-sheen" fill="none" stroke="#ffc9a8" stroke-linecap="round"/>
</svg>
<svg class="lg-main" ${VB}>
  <defs>
    <linearGradient id="${uid}-face" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fffdf5"/>
      <stop offset="0.42" stop-color="#f8ead0"/>
      <stop offset="0.5" stop-color="#e7c88e"/>
      <stop offset="0.72" stop-color="#f5deb0"/>
      <stop offset="1" stop-color="#c99a5a"/>
    </linearGradient>
    <filter id="${uid}-carve" x="-5%" y="-10%" width="110%" height="125%" color-interpolation-filters="sRGB">
      <!-- bevel: light from the upper left catches the rounded edges -->
      <feGaussianBlur in="SourceAlpha" stdDeviation="2.4" result="soft"/>
      <feSpecularLighting in="soft" surfaceScale="5" specularConstant="1" specularExponent="16" lighting-color="#fff3d2" result="spec">
        <feDistantLight azimuth="235" elevation="42"/>
      </feSpecularLighting>
      <feComposite in="spec" in2="SourceAlpha" operator="in" result="shine"/>
      <feDiffuseLighting in="soft" surfaceScale="4" diffuseConstant="1" lighting-color="#ffffff" result="diffuse">
        <feDistantLight azimuth="235" elevation="55"/>
      </feDiffuseLighting>
      <feComposite in="SourceGraphic" in2="diffuse" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="shaded"/>
      <!-- worn texture -->
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="11" result="noise"/>
      <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0.32  0 0 0 0 0.2  0 0 0 0 0.1  0.9 0 0 0 -0.5" result="grain"/>
      <feComposite in="grain" in2="SourceAlpha" operator="in" result="grainIn"/>
      <!-- dark carved outline + drop shadow -->
      <feMorphology in="SourceAlpha" operator="dilate" radius="3.5" result="thick"/>
      <feFlood flood-color="#2b1207" result="ink"/>
      <feComposite in="ink" in2="thick" operator="in" result="outline"/>
      <feGaussianBlur in="thick" stdDeviation="7" result="shadowBlur"/>
      <feOffset in="shadowBlur" dy="10" result="shadowOff"/>
      <feFlood flood-color="#0c0503" flood-opacity="0.72"/>
      <feComposite in2="shadowOff" operator="in" result="shadow"/>
      <feMerge>
        <feMergeNode in="shadow"/>
        <feMergeNode in="outline"/>
        <feMergeNode in="shaded"/>
        <feMergeNode in="grainIn"/>
        <feMergeNode in="shine"/>
      </feMerge>
    </filter>
  </defs>
  <g filter="url(#${uid}-carve)" fill="url(#${uid}-face)" ${FONT}>${letters}</g>
</svg>
<svg class="lg-layer lg-front" ${VB}>
  <defs>
    <linearGradient id="${uid}-gleam" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#fffbe8" stop-opacity="0.85"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="${uid}-halo"><stop offset="0" stop-color="#fff6d8" stop-opacity="0.9"/><stop offset="1" stop-color="#ffd9a0" stop-opacity="0"/></radialGradient>
    <clipPath id="${uid}-clip"><g ${FONT}>${letters}</g></clipPath>
  </defs>
  <g clip-path="url(#${uid}-clip)">
    <rect class="lg-gleam" x="-260" y="-20" width="170" height="360" fill="url(#${uid}-gleam)"/>
  </g>
  <g class="lg-glints">${glints}</g>
</svg>`;

    if (animate) animateRibbon(wrap);
    else drawRibbon(wrap, 0);
    return wrap;
  }

  function drawRibbon(wrap, time) {
    const body = wrap.querySelector('.lg-ribbon-body');
    const sheen = wrap.querySelector('.lg-ribbon-sheen');
    if (!body) return;
    const N = 90;
    const top = [], bottom = [], mid = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const p = bezier(t);
      const wave = Math.sin(t * 9 - time * 1.6) * 16 * Math.sin(Math.PI * t);
      // the ribbon twists as it flows, so its width swells and narrows
      const twist = 0.3 + 0.7 * Math.abs(Math.cos(t * 5.5 - time * 0.9));
      const half = (3 + 12 * Math.sin(Math.PI * t)) * twist;
      const cx = p.x + p.nx * wave, cy = p.y + p.ny * wave;
      top.push(`${(cx + p.nx * half).toFixed(1)} ${(cy + p.ny * half).toFixed(1)}`);
      bottom.push(`${(cx - p.nx * half).toFixed(1)} ${(cy - p.ny * half).toFixed(1)}`);
      mid.push(`${(cx + p.nx * half * 0.35).toFixed(1)} ${(cy + p.ny * half * 0.35).toFixed(1)}`);
    }
    body.setAttribute('d', `M${top.join(' L')} L${bottom.reverse().join(' L')} Z`);
    sheen.setAttribute('d', `M${mid.join(' L')}`);
    sheen.setAttribute('stroke-width', '1.6');
    sheen.setAttribute('stroke-opacity', String(0.35 + 0.25 * Math.sin(time * 0.8)));
  }

  function animateRibbon(wrap) {
    const t0 = performance.now();
    const step = (now) => {
      if (!wrap.isConnected && now - t0 > 1000) return;
      drawRibbon(wrap, (now - t0) / 1000);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  VN.buildTitleLogo = build;
})();
