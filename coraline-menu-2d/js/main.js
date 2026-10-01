// Coraline main menu: animates the painting with a WebGL shader, draws the creatures on an overlay
// canvas, and exposes window.__render(t) so the video renderer can capture any frame exactly.
import { VERT, FRAG } from './shader.js';
import { STRIKES, strikeLayers, webLayer, apparitionLayer, createCreatures, W, H } from './fx.js';

export const LOOP = 12;   // seconds: six strikes of lightning, one every two seconds
const params = new URLSearchParams(location.search);
const TAU = Math.PI * 2;

const loadImage = (src) => new Promise((res, rej) => {
  const img = new Image();
  img.onload = () => res(img);
  img.onerror = () => rej(new Error('could not load ' + src));
  img.src = src;
});

const [base, maskA, maskB, maskC, layout] = await Promise.all([
  loadImage('assets/base.png'), loadImage('assets/maskA.png'), loadImage('assets/maskB.png'), loadImage('assets/maskC.png'),
  fetch('assets/layout.json').then((r) => r.json()),
]);

// --- WebGL ------------------------------------------------------------------------------------
const canvas = document.getElementById('scene');
const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false });
if (!gl) throw new Error('WebGL2 is not available');

function shader(type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}
const prog = gl.createProgram();
gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
gl.linkProgram(prog);
if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
gl.useProgram(prog);

const buf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
const aPos = gl.getAttribLocation(prog, 'aPos');
gl.enableVertexAttribArray(aPos);
gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
function texture(src) {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return t;
}
const tex = {
  uBase: texture(base), uMaskA: texture(maskA), uMaskB: texture(maskB), uMaskC: texture(maskC),
  uWeb: texture(webLayer()), uApp: texture(apparitionLayer(layout.attic, layout.atticSize)),
};
const strikeTex = strikeLayers().map((c) => {
  const t = texture(c);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  return t;
});
// tileable value noise for the clouds, fog and moonbeams
{
  const n = new Uint8Array(256 * 256 * 4);
  let a = 99;
  for (let i = 0; i < 256 * 256; i++) {
    a = (a * 1664525 + 1013904223) >>> 0;
    n.fill(a >>> 24, i * 4, i * 4 + 4);
  }
  tex.uNoise = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex.uNoise);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, n);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
}
const units = ['uBase', 'uMaskA', 'uMaskB', 'uMaskC', 'uStrike', 'uWeb', 'uApp', 'uNoise'];
units.forEach((name, i) => gl.uniform1i(gl.getUniformLocation(prog, name), i));
const U = (name) => gl.getUniformLocation(prog, name);
const loc = Object.fromEntries(['uU', 'uFlash', 'uBolt', 'uScare', 'uZoom', 'uGlint', 'uPulse', 'uWinAvg', 'uBreath', 'uShake', 'uFlashPos', 'uMoon', 'uWin'].map((n) => [n, U(n)]));
gl.uniform3f(loc.uMoon, layout.moon.x, layout.moon.y, layout.moon.r);
gl.viewport(0, 0, W, H);

// --- timeline --------------------------------------------------------------------------------
const PULSES = [[0, 1], [0.08, 0.5], [0.2, 0.85], [0.4, 0.3]];
const wrap = (x) => ((x % LOOP) + LOOP) % LOOP;
function strikeEnvelope(t, s) {
  let e = 0;
  for (const [dt, a] of PULSES) {
    const x = wrap(t - s.t - dt);
    if (x < 1.5) e = Math.max(e, a * Math.exp(-x / 0.06));
  }
  return e * s.amp;
}
function storm(t) {
  let best = { flash: 0, index: 0 };
  STRIKES.forEach((s, i) => {
    const f = strikeEnvelope(t, s);
    if (f > best.flash) best = { flash: f, index: i };
  });
  // the Other Mother lingers after the big strike, then fades
  const big = STRIKES.find((s) => s.scare);
  const since = wrap(t - big.t);
  const scare = since < 1.6 ? Math.min(1, since / 0.04) * (1 - Math.min(1, Math.max(0, (since - 0.9) / 0.7))) : 0;
  const shake = since < 0.6 ? 4.5 * Math.exp(-since / 0.15) : 0;
  return { ...best, scare, shake, since };
}

// Each window flickers like an old bulb; one fails now and then; all die for a moment on the big strike.
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
function windowLights(t, st) {
  const u = t / LOOP;
  const out = new Float32Array(16);
  let sum = 0;
  for (let id = 1; id < 16; id++) {
    let f = 0.92 + 0.06 * Math.sin(TAU * (3 + id) * u + id) + 0.06 * (hash(Math.floor(u * 90) * 7 + id * 13) - 0.5);
    if (id === 2 && u > 0.36 && u < 0.43) f *= 0.25 + 0.75 * (hash(Math.floor(u * 400) + 5) > 0.55 ? 1 : 0);  // a failing bulb
    if (id === 5 && u > 0.7 && u < 0.76) f *= 0.3 + 0.7 * hash(Math.floor(u * 300) + 9);
    if (id === 4) f *= 0.9 + 0.1 * Math.sin(TAU * 11 * u);
    if (st.since < 0.7) f *= 0.08 + 0.92 * Math.min(1, Math.max(0, (st.since - 0.45) / 0.25)); // the power cut
    out[id] = f;
    if (id <= layout.windows.length) sum += f;
  }
  return { values: out, avg: sum / Math.max(1, layout.windows.length) };
}

const fx = document.getElementById('fx');
const fxg = fx.getContext('2d');
const drawCreatures = createCreatures(LOOP, layout);
const grain = document.getElementById('grain');
const root = document.documentElement.style;

function render(t) {
  t = wrap(t);
  const u = t / LOOP;
  const st = storm(t);
  const win = windowLights(t, st);
  const strike = STRIKES[st.index];
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex.uBase);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tex.uMaskA);
  gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, tex.uMaskB);
  gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, tex.uMaskC);
  gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, strikeTex[st.index]);
  gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_2D, tex.uWeb);
  gl.activeTexture(gl.TEXTURE6); gl.bindTexture(gl.TEXTURE_2D, tex.uApp);
  gl.activeTexture(gl.TEXTURE7); gl.bindTexture(gl.TEXTURE_2D, tex.uNoise);
  const flash = params.has('flash') ? parseFloat(params.get('flash')) : st.flash;
  gl.uniform1f(loc.uU, u);
  gl.uniform1f(loc.uFlash, flash);
  gl.uniform1f(loc.uBolt, Math.min(1, flash * 1.6));
  gl.uniform1f(loc.uScare, params.has('scare') ? parseFloat(params.get('scare')) : st.scare);
  const breath = 0.5 - 0.5 * Math.cos(TAU * u);
  gl.uniform1f(loc.uZoom, 1 + 0.014 * breath);
  gl.uniform1f(loc.uBreath, breath);
  // a glint runs across the title twice a loop
  const g1 = (u - 0.05) / 0.09, g2 = (u - 0.55) / 0.09;
  const g = g1 >= 0 && g1 <= 1 ? g1 : g2 >= 0 && g2 <= 1 ? g2 : -1;
  gl.uniform1f(loc.uGlint, g < 0 ? -2000 : 640 + g * 680);
  gl.uniform1f(loc.uPulse, 0.5 + 0.5 * Math.sin(TAU * 3 * u));
  gl.uniform1f(loc.uWinAvg, win.avg);
  gl.uniform1fv(loc.uWin, win.values);
  gl.uniform2f(loc.uShake, Math.sin(t * 97.3) * st.shake, Math.cos(t * 131.7) * st.shake);
  const fp = strike.focus || [W / 2, 200];
  gl.uniform2f(loc.uFlashPos, fp[0], fp[1]);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  drawCreatures(fxg, t, flash);
  root.setProperty('--flash', flash.toFixed(3));
  root.setProperty('--u', u.toFixed(4));
  root.setProperty('--pulse', (0.5 + 0.5 * Math.sin(TAU * 4 * u)).toFixed(3));
  grain.style.backgroundPosition = `${Math.floor(hash(t * 31) * 256)}px ${Math.floor(hash(t * 17 + 3) * 256)}px`;
  return true;
}

window.__render = (t) => render(t);
window.__loop = LOOP;
await document.fonts.ready;
if (params.has('t')) {
  render(parseFloat(params.get('t')));
} else if (!params.has('still')) {
  const start = performance.now();
  const tick = () => { render((performance.now() - start) / 1000); requestAnimationFrame(tick); };
  tick();
}
window.__ready = true;
