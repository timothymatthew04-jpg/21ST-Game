#!/usr/bin/env node
/*
 * Paints blinking eyelids for the character sprites, so they blink now and then:
 *
 *   assets/sprites/<id>/blink.png   the eyes half closed (top) and closed (bottom),
 *                                   cropped to the eyes
 *   story/blinks.js                 where each crop sits on its sprite (read by js/stage.js)
 *
 *   node tools/paint-blinks.js            every character
 *   PREVIEW=some/folder node ...          also save enlarged before/after pictures
 *
 * Each eye is described by its two corners and a point on the upper and the lower
 * lid, in the sprite's own pixels. The lid is painted in skin sampled from under the
 * eye, and closed with a curved lash line in the colour of the lashes.
 * Needs Playwright (npm i -g playwright) and a Chromium it can launch.
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');

// Where the eyes are: story/expressions.js (written by tools/import-sprites.js from
// tools/paint/data/eyes.json) gives, per character, each eye's corners (a outer, b inner) and a
// point on the upper (up) and lower (low) lid, in the sprite's own pixels.
function loadEyes() {
  const src = fs.readFileSync(path.join(root, 'story/expressions.js'), 'utf8');
  const m = src.match(/=\s*(\{[\s\S]*\});/);
  const all = m ? JSON.parse(m[1]) : {};
  const out = {};
  for (const [id, v] of Object.entries(all)) if (v.eyes && v.eyes.length) out[id] = v.eyes;
  return out;
}
const EYES = loadEyes();

function paint(spec) {
  // runs in the page
  return new Promise(async (resolve) => {
    const img = new Image();
    img.src = spec.src;
    await img.decode();
    const W = img.naturalWidth, H = img.naturalHeight;
    const src = document.createElement('canvas');
    src.width = W; src.height = H;
    const s = src.getContext('2d', { willReadFrequently: true });
    s.drawImage(img, 0, 0);
    const px = (x, y) => s.getImageData(Math.round(x), Math.round(y), 1, 1).data;
    const pad = 5;
    const xs = spec.eyes.flatMap((e) => [e.a[0], e.b[0], e.up[0], e.low[0]]);
    const ys = spec.eyes.flatMap((e) => [e.a[1], e.b[1], e.up[1], e.low[1]]);
    const box = { x: Math.floor(Math.min(...xs) - pad), y: Math.floor(Math.min(...ys) - pad) };
    box.w = Math.ceil(Math.max(...xs) + pad) - box.x;
    box.h = Math.ceil(Math.max(...ys) + pad) - box.y;
    const out = document.createElement('canvas');
    out.width = box.w; out.height = box.h * 2;
    const o = out.getContext('2d');
    const through = (p0, p2, t) => [2 * t[0] - (p0[0] + p2[0]) / 2, 2 * t[1] - (p0[1] + p2[1]) / 2];
    const lerp = (p, q, k) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];

    const frames = [0.55, 1]; // how far the lid has come down
    frames.forEach((close, f) => {
      o.save();
      o.translate(-box.x, -box.y + f * box.h);
      o.beginPath();
      o.rect(box.x, box.y, box.w, box.h);
      o.clip();
      for (const e of spec.eyes) {
        // skin from under the eye: the median of a small patch below the lower lid
        const samples = [];
        for (let dx = -4; dx <= 4; dx += 2) for (let dy = 5; dy <= 8; dy++) samples.push(px(e.low[0] + dx, e.low[1] + dy));
        const lum = (c) => c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11;
        samples.sort((p, q) => lum(p) - lum(q));
        const skin = samples[Math.floor(samples.length * 0.6)];
        // the lashes: the darkest pixel along the upper lid
        let lash = [60, 40, 40, 255], dark = 999;
        for (let k = 0.2; k <= 0.8; k += 0.05) {
          const p = lerp(e.a, e.b, k);
          for (let dy = -3; dy <= 4; dy++) { const c = px(p[0], Math.min(p[1], e.up[1] + 3) + dy); if (c[3] > 200 && lum(c) < dark) { dark = lum(c); lash = c; } }
        }
        const rgb = (c, m = 1) => `rgb(${Math.round(c[0] * m)},${Math.round(c[1] * m)},${Math.round(c[2] * m)})`;
        // the lid: from the upper lid down to where it has closed to
        const upC = through(e.a, e.b, e.up);
        const lowT = lerp(e.up, e.low, close * 0.9 + 0.05);
        const lidEnd = close >= 1 ? through(e.a, e.b, [lowT[0], lowT[1] - 1.2]) : through(e.a, e.b, lowT);
        const g = o.createLinearGradient(0, e.up[1] - 2, 0, lowT[1] + 1);
        g.addColorStop(0, rgb(skin, 0.95));
        g.addColorStop(0.7, rgb(skin, 0.985));
        g.addColorStop(1, rgb(skin));
        o.fillStyle = g;
        o.beginPath();
        o.moveTo(e.a[0], e.a[1]);
        o.quadraticCurveTo(upC[0], upC[1] - 3.4, e.b[0], e.b[1]);
        if (close >= 1) {
          // closed: cover the whole eye, down past the lower lid
          const lowC = through(e.a, e.b, [e.low[0], e.low[1] + 1.2]);
          o.quadraticCurveTo(lowC[0], lowC[1], e.a[0], e.a[1]);
        } else o.quadraticCurveTo(lidEnd[0], lidEnd[1], e.a[0], e.a[1]);
        o.fill();
        o.lineWidth = 2.4;
        o.lineJoin = 'round';
        o.strokeStyle = g;
        o.stroke();
        // the lash line where the lid has come to rest: thick in the middle, thin at the ends
        const rest = close >= 1 ? lerp(e.up, e.low, 0.62) : lowT;
        const c1 = through(e.a, e.b, rest);
        const c2 = through(e.a, e.b, [rest[0], rest[1] + (close >= 1 ? 2.6 : 2.2)]);
        o.fillStyle = rgb(lash);
        o.beginPath();
        o.moveTo(e.a[0], e.a[1]);
        o.quadraticCurveTo(c1[0], c1[1], e.b[0], e.b[1]);
        o.quadraticCurveTo(c2[0], c2[1], e.a[0], e.a[1]);
        o.fill();
        if (e.flick) {
          // a little flick of lashes at the outer corner
          const dir = e.a[0] < e.b[0] ? -1 : 1;
          o.strokeStyle = rgb(lash);
          o.lineWidth = 1.4;
          o.lineCap = 'round';
          o.beginPath();
          o.moveTo(e.a[0] - dir * 1, e.a[1] + 1);
          o.quadraticCurveTo(e.a[0] + dir * 2, e.a[1] + 1, e.a[0] + dir * 4, e.a[1] + (close >= 1 ? 3 : 1));
          o.stroke();
        }
      }
      o.restore();
    });
    const preview = document.createElement('canvas');
    const S = 6;
    preview.width = box.w * S * 3; preview.height = box.h * S;
    const p = preview.getContext('2d');
    p.imageSmoothingEnabled = false;
    for (let k = 0; k < 3; k++) {
      p.drawImage(src, box.x, box.y, box.w, box.h, k * box.w * S, 0, box.w * S, box.h * S);
      if (k) p.drawImage(out, 0, (k - 1) * box.h, box.w, box.h, k * box.w * S, 0, box.w * S, box.h * S);
    }
    resolve({ png: out.toDataURL('image/png'), preview: preview.toDataURL('image/png'), box, W, H });
  });
}

(async () => {
  const only = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const manifest = {};
  const old = path.join(root, 'story/blinks.js');
  if (fs.existsSync(old)) {
    const m = fs.readFileSync(old, 'utf8').match(/=\s*(\{[\s\S]*\});/);
    if (m) Object.assign(manifest, JSON.parse(m[1]));
  }
  for (const [id, eyes] of Object.entries(EYES)) {
    if (only.length && !only.includes(id)) continue;
    const file = ['webp', 'png'].map((e) => path.join(root, `assets/sprites/${id}/neutral.${e}`)).find((f) => fs.existsSync(f));
    const src = `data:image/${file.endsWith('webp') ? 'webp' : 'png'};base64,${fs.readFileSync(file).toString('base64')}`;
    const r = await page.evaluate(paint, { src, eyes });
    fs.writeFileSync(path.join(root, `assets/sprites/${id}/blink.png`), Buffer.from(r.png.split(',')[1], 'base64'));
    if (process.env.PREVIEW) fs.writeFileSync(path.join(process.env.PREVIEW, `blink-${id}.png`), Buffer.from(r.preview.split(',')[1], 'base64'));
    const f = (v, d) => +(v / d).toFixed(5);
    manifest[id] = { x: f(r.box.x, r.W), y: f(r.box.y, r.H), w: f(r.box.w, r.W), h: f(r.box.h, r.H) };
    console.log(`${id}: ${r.box.w}×${r.box.h} at ${r.box.x},${r.box.y}`);
  }
  await browser.close();
  const body = Object.entries(manifest).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n');
  fs.writeFileSync(old, `/*
 * Where each character's eyes are on their sprite, as fractions of the picture, so
 * assets/sprites/<id>/blink.png (half closed above, closed below) can be laid over
 * them for a blink. Generated by tools/paint-blinks.js.
 */
window.VN_BLINKS = {
${body}
};
`);
})();
