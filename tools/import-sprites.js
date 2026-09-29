#!/usr/bin/env node
/*
 * Turns the character art in art/characters/<id>/<expression>.png (the artist's 1000×1000
 * canvases) into the game's sprites and portraits:
 *
 *   assets/sprites/<id>/<expression>.webp   cropped to the character, 12px of air around them,
 *                                           850px tall with the feet 12px from the bottom
 *   assets/faces/<id>.webp                  the text-box / introduction portrait (neutral)
 *   story/expressions.js                    which expressions each character has, where their
 *                                           face is (for portraits of any expression), and which
 *                                           expressions can blink with the painted eyelids
 *
 *   node tools/import-sprites.js              every character
 *   node tools/import-sprites.js helene       just one
 *   PREVIEW=some/folder node ...              also save a contact sheet per character
 *
 * Every expression of a character is the same drawing with a different face, so they are all cut
 * with the same box and swap without the body moving. The woman is put together: her faces are
 * laid (mirrored) onto her full-length picture, _body.png. (A graft can also take another
 * character's faces, `from`, onto a picture: Hervé's civilian faces did not sit cleanly on his
 * uniform, so in uniform he has the one face.)
 * After importing, run tools/paint-blinks.js to paint the eyelids for the new neutral faces.
 * Needs Playwright (npm i -g playwright) and a Chromium it can launch.
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const ART = path.join(root, 'art/characters');
const QUALITY = 0.93;

// Where the portrait sits, as a square on the neutral sprite (x, y, size in its pixels).
const PORTRAIT = {
  balbadiou: [42, 84, 308],
  blanche: [85, 149, 281],
  harakei: [-12, 110, 297],
  helene: [62, 52, 322],
  herve: [0, 27, 331],
  herve_army: [-4, 60, 300],
  woman: [48, 165, 275],
};

// Graft settings.
const GRAFT = {
  // her faces, mirrored, onto the full-length body; the face is an ellipse on the body picture
  woman: { body: '_body.png', flip: true, guess: [-280, -256], ellipse: [210, 292, 62, 50], boxes: [[171, 249, 252, 334], [164, 262, 256, 297]] },
};

function run(job) {
  // runs in the page
  return (async () => {
    const load = async (src) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext('2d', { willReadFrequently: true }).drawImage(img, 0, 0);
      return c;
    };
    const data = (c) => c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height);
    const bbox = (c) => {
      const d = data(c).data;
      let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
      return { x0, y0, x1, y1 };
    };
    const flip = (c) => {
      const o = document.createElement('canvas');
      o.width = c.width; o.height = c.height;
      const x = o.getContext('2d');
      x.setTransform(-1, 0, 0, 1, c.width, 0);
      x.drawImage(c, 0, 0);
      return o;
    };
    // how far `b` must move to lie on `a`, searched around a guess over a region of `a`
    const align = (a, b, region, guess, reach) => {
      const A = data(a), B = data(b);
      let best = null;
      for (let ty = guess[1] - reach; ty <= guess[1] + reach; ty++) for (let tx = guess[0] - reach; tx <= guess[0] + reach; tx++) {
        let s = 0, n = 0;
        for (let y = region[1]; y < region[3]; y += 2) for (let x = region[0]; x < region[2]; x += 2) {
          const X = x - tx, Y = y - ty;
          if (X < 0 || Y < 0 || X >= b.width || Y >= b.height) continue;
          const i = (y * a.width + x) * 4, j = (Y * b.width + X) * 4;
          if (A.data[i + 3] < 128 && B.data[j + 3] < 128) continue;
          s += Math.abs(A.data[i] - B.data[j]) + Math.abs(A.data[i + 1] - B.data[j + 1]) + Math.abs(A.data[i + 2] - B.data[j + 2]) + Math.abs(A.data[i + 3] - B.data[j + 3]);
          n++;
        }
        const v = s / Math.max(1, n);
        if (!best || v < best.v) best = { v, tx, ty };
      }
      return best;
    };
    // a soft mask canvas from a function (x, y) -> 0..1
    const maskFrom = (w, h, f) => {
      const m = document.createElement('canvas');
      m.width = w; m.height = h;
      const x = m.getContext('2d');
      const img = x.createImageData(w, h);
      for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) {
        const k = (y * w + i) * 4;
        img.data[k] = img.data[k + 1] = img.data[k + 2] = 255;
        img.data[k + 3] = Math.round(255 * Math.max(0, Math.min(1, f(i, y))));
      }
      x.putImageData(img, 0, 0);
      return m;
    };
    // `over` drawn onto `base` (a copy) through a mask, both already in the same coordinates
    const blend = (base, over, mask) => {
      const t = document.createElement('canvas');
      t.width = base.width; t.height = base.height;
      const tx = t.getContext('2d');
      tx.drawImage(over, 0, 0);
      tx.globalCompositeOperation = 'destination-in';
      tx.drawImage(mask, 0, 0);
      const o = document.createElement('canvas');
      o.width = base.width; o.height = base.height;
      const ox = o.getContext('2d');
      // the masked face over the picture: at a soft edge each is part of the colour, and it stays opaque
      ox.drawImage(base, 0, 0);
      ox.drawImage(t, 0, 0);
      return o;
    };
    const shifted = (c, tx, ty, w, h) => {
      const o = document.createElement('canvas');
      o.width = w; o.height = h;
      o.getContext('2d').drawImage(c, tx, ty);
      return o;
    };

    const srcs = {};
    for (const [k, v] of Object.entries(job.files)) srcs[k] = await load(v);
    const names = Object.keys(job.files).filter((k) => !k.startsWith('_'));
    let canvases = {};
    const info = { notes: [] };

    if (job.graft && job.graft.body) {
      // ---- the woman: faces onto her full-length picture
      const body = srcs[job.graft.body.replace('.png', '')];
      const flipped = {};
      for (const n of names) flipped[n] = job.graft.flip ? flip(srcs[n]) : srcs[n];
      const [cx, cy, rx, ry] = job.graft.ellipse;
      const region = [cx - rx, cy - ry, cx + rx, cy + ry];
      const fit = align(body, flipped.neutral, region, job.graft.guess, 10);
      info.notes.push(`face lies at ${fit.tx},${fit.ty} (difference ${fit.v.toFixed(1)})`);
      // only where her faces differ from the body picture's face (brows, eyes, mouth), inside the ellipse
      const W = body.width, H = body.height;
      const placed = {};
      for (const n of names) placed[n] = shifted(flipped[n], fit.tx, fit.ty, W, H);
      const B = data(body).data;
      const all = Object.values(placed).map((c) => data(c).data);
      const change = new Uint8Array(W * H);
      // the face between her side locks: brows to chin, a little wider at the eyes
      const inside = (x, y) => job.graft.boxes.some(([x0, y0, x1, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (!inside(x, y)) continue;
        const k = (y * W + x) * 4;
        for (const F of all) if (Math.abs(F[k] - B[k]) + Math.abs(F[k + 1] - B[k + 1]) + Math.abs(F[k + 2] - B[k + 2]) > 45) { change[y * W + x] = 1; break; }
      }
      const grow = (src, r) => {
        const out = new Uint8Array(W * H);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          if (!src[y * W + x]) continue;
          for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
            const X = x + dx, Y = y + dy;
            if (dx * dx + dy * dy <= r * r && X >= 0 && Y >= 0 && X < W && Y < H) out[Y * W + X] = 1;
          }
        }
        return out;
      };
      const core = grow(change, 3), edge = grow(core, 2);
      const mask = maskFrom(W, H, (x, y) => (!inside(x, y) ? 0 : core[y * W + x] ? 1 : edge[y * W + x] ? 0.45 : 0));
      for (const n of names) canvases[n] = blend(body, placed[n], mask);
      info.crop = { x: 0, y: 0, w: body.width, h: body.height, direct: true };
    } else if (job.graft && job.graft.from) {
      // ---- Hervé's uniform: his changing features onto the uniform picture
      const base = srcs.neutral;
      const faces = {};
      for (const [k, v] of Object.entries(job.faceFiles)) faces[k] = await load(v);
      const [bx0, by0, bx1, by1] = job.graft.box;
      // line the civilian face up with the uniform one on the nose and cheeks (the parts that never change)
      const fit = align(base, faces.neutral, [bx0, by0 + 40, bx1, by1 - 10], job.graft.guess, 16);
      info.notes.push(`civilian face lies at ${fit.tx},${fit.ty} on the uniform (difference ${fit.v.toFixed(1)})`);
      info.eyeShift = [fit.tx, fit.ty];
      // where his faces differ from each other, or from the uniform's own face: that is the part to replace
      const N = data(shifted(faces.neutral, fit.tx, fit.ty, base.width, base.height)).data;
      const U = data(base).data;
      const W = base.width, H = base.height;
      const change = new Float32Array(W * H);
      const diff = (P, Q, k) => Math.abs(P[k] - Q[k]) + Math.abs(P[k + 1] - Q[k + 1]) + Math.abs(P[k + 2] - Q[k + 2]);
      const shiftedFaces = {};
      for (const [k, f] of Object.entries(faces)) shiftedFaces[k] = shifted(f, fit.tx, fit.ty, W, H);
      const all = Object.values(shiftedFaces).map((c) => data(c).data);
      for (let y = by0; y < by1; y++) for (let x = bx0; x < bx1; x++) {
        const k = (y * W + x) * 4;
        let m = 0;
        for (const F of all) if (diff(F, N, k) > 60) m = 1;
        change[y * W + x] = m;
      }
      // grow the region a little and soften its edge
      const grow = (src, r) => {
        const out = new Float32Array(W * H);
        for (let y = by0; y < by1; y++) for (let x = bx0; x < bx1; x++) {
          let v = 0;
          for (let dy = -r; dy <= r && !v; dy++) for (let dx = -r; dx <= r; dx++) {
            if (dx * dx + dy * dy > r * r) continue;
            const X = x + dx, Y = y + dy;
            if (X >= 0 && Y >= 0 && X < W && Y < H && src[Y * W + X]) { v = 1; break; }
          }
          out[y * W + x] = v;
        }
        return out;
      };
      const grown = grow(change, 3);
      const soft = grow(grown, 2);
      const mask = maskFrom(W, H, (x, y) => (grown[y * W + x] ? 1 : soft[y * W + x] ? 0.5 : 0));
      canvases.neutral = base;
      for (const [k, f] of Object.entries(shiftedFaces)) if (k !== 'neutral') canvases[k] = blend(base, f, mask);
      if (job.graft.keepNeutral === false) canvases.neutral = blend(base, shiftedFaces.neutral, mask);
    } else {
      for (const n of names) canvases[n] = srcs[n];
    }

    // ---- one box for every expression
    let crop = info.crop;
    if (!crop) {
      let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      for (const c of Object.values(canvases)) {
        const b = bbox(c);
        x0 = Math.min(x0, b.x0); y0 = Math.min(y0, b.y0); x1 = Math.max(x1, b.x1); y1 = Math.max(y1, b.y1);
      }
      crop = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
    }
    const PAD = 12, H = 850;
    const out = {};
    const finals = {};
    for (const [n, c] of Object.entries(canvases)) {
      const o = document.createElement('canvas');
      if (crop.direct) {
        o.width = c.width; o.height = c.height;
        o.getContext('2d').drawImage(c, 0, 0);
      } else {
        o.width = crop.w + PAD * 2; o.height = Math.max(H, crop.h + PAD + 2);
        o.getContext('2d').drawImage(c, crop.x, crop.y, crop.w, crop.h, PAD, o.height - PAD - crop.h, crop.w, crop.h);
      }
      finals[n] = o;
      out[n] = o.toDataURL('image/webp', job.quality);
    }
    // where a point of the artist's canvas lands on the sprite
    const off = crop.direct ? { x: 0, y: 0 } : { x: PAD - crop.x, y: finals.neutral.height - PAD - crop.h - crop.y };

    // ---- the portrait of the neutral face
    const [px, py, ps] = job.portrait;
    const f = document.createElement('canvas');
    f.width = ps; f.height = ps;
    f.getContext('2d').drawImage(finals.neutral, -px, -py);
    const portrait = f.toDataURL('image/webp', job.quality);

    // ---- the eyes, moved onto the sprite
    const sh = info.eyeShift || [0, 0];
    const mv = (p) => [+(p[0] + sh[0] + off.x).toFixed(1), +(p[1] + sh[1] + off.y).toFixed(1)];
    const spriteEyes = (job.eyes || []).map((e) => ({ ...e, a: mv(e.a), b: mv(e.b), up: mv(e.up), low: mv(e.low) }));
    // ---- which expressions keep their eyes where the neutral face has them (so they can blink)
    const eyes = {};
    if (spriteEyes.length) {
      const N = data(finals.neutral).data, W = finals.neutral.width;
      for (const n of Object.keys(finals)) {
        const D = data(finals[n]).data;
        let s = 0, k = 0;
        for (const e of spriteEyes) {
          const xs = [e.a[0], e.b[0]], ys = [e.up[1], e.low[1]];
          for (let y = Math.floor(Math.min(...ys)) - 6; y <= Math.max(...ys) + 2; y++) for (let x = Math.floor(Math.min(...xs)); x <= Math.max(...xs); x++) {
            const i = (y * W + x) * 4;
            s += Math.abs(N[i] - D[i]) + Math.abs(N[i + 1] - D[i + 1]) + Math.abs(N[i + 2] - D[i + 2]);
            k++;
          }
        }
        eyes[n] = s / Math.max(1, k);
      }
    }

    // ---- a contact sheet
    let sheet = null;
    if (job.preview) {
      const list = Object.keys(finals);
      const cw = finals.neutral.width, ch = finals.neutral.height;
      const S = 0.5;
      const c = document.createElement('canvas');
      c.width = Math.ceil(cw * S) * list.length + ps * 0.6 * list.length; c.height = Math.ceil(ch * S);
      const x = c.getContext('2d');
      x.fillStyle = '#dcd4c8'; x.fillRect(0, 0, c.width, c.height);
      list.forEach((n, i) => {
        const X = i * (Math.ceil(cw * S) + ps * 0.6);
        x.drawImage(finals[n], X, 0, cw * S, ch * S);
        x.drawImage(finals[n], px, py, ps, ps, X + cw * S, 0, ps * 0.6, ps * 0.6);
        x.fillStyle = '#222'; x.font = '16px sans-serif'; x.fillText(n, X + 4, c.height - 8);
      });
      sheet = c.toDataURL('image/png');
    }
    const size = { w: finals.neutral.width, h: finals.neutral.height };
    return { out, portrait, sheet, size, off, eyes, spriteEyes, notes: info.notes };
  })();
}

(async () => {
  const only = process.argv.slice(2);
  const ids = fs.readdirSync(ART).filter((d) => fs.statSync(path.join(ART, d)).isDirectory()).sort();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const manifestFile = path.join(root, 'story/expressions.js');
  const manifest = {};
  if (fs.existsSync(manifestFile)) {
    const m = fs.readFileSync(manifestFile, 'utf8').match(/=\s*(\{[\s\S]*\});/);
    if (m) Object.assign(manifest, JSON.parse(m[1]));
  }
  const uri = (f) => `data:image/png;base64,${fs.readFileSync(f).toString('base64')}`;
  const eyesAll = JSON.parse(fs.readFileSync(path.join(root, 'tools/paint/data/eyes.json'), 'utf8'));
  for (const id of ids) {
    if (only.length && !only.includes(id)) continue;
    const dir = path.join(ART, id);
    const files = {};
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.png')).sort()) files[f.replace('.png', '')] = uri(path.join(dir, f));
    const graft = GRAFT[id] || null;
    const faceFiles = {};
    if (graft && graft.from) for (const f of fs.readdirSync(path.join(ART, graft.from)).filter((f) => f.endsWith('.png'))) faceFiles[f.replace('.png', '')] = uri(path.join(ART, graft.from, f));
    const eyes = eyesAll[id] || (graft && graft.from && eyesAll[graft.from]) || null;
    const r = await page.evaluate(run, { files, faceFiles, graft, quality: QUALITY, portrait: PORTRAIT[id], eyes, preview: !!process.env.PREVIEW });
    const outDir = path.join(root, 'assets/sprites', id);
    fs.mkdirSync(outDir, { recursive: true });
    // the old pictures go: every expression is a webp now
    for (const f of fs.readdirSync(outDir)) if (/\.(png|webp)$/.test(f) && f !== 'blink.png') fs.unlinkSync(path.join(outDir, f));
    let bytes = 0;
    for (const [n, d] of Object.entries(r.out)) {
      const buf = Buffer.from(d.split(',')[1], 'base64');
      bytes += buf.length;
      fs.writeFileSync(path.join(outDir, `${n}.webp`), buf);
    }
    for (const ext of ['png', 'webp']) { const old = path.join(root, `assets/faces/${id}.${ext}`); if (fs.existsSync(old)) fs.unlinkSync(old); }
    fs.writeFileSync(path.join(root, `assets/faces/${id}.webp`), Buffer.from(r.portrait.split(',')[1], 'base64'));
    if (r.sheet && process.env.PREVIEW) fs.writeFileSync(path.join(process.env.PREVIEW, `sprites-${id}.png`), Buffer.from(r.sheet.split(',')[1], 'base64'));
    const [px, py, ps] = PORTRAIT[id];
    const f = (v, d) => +(v / d).toFixed(5);
    const blink = Object.entries(r.eyes).filter(([, v]) => v < 9).map(([n]) => n).sort();
    manifest[id] = {
      expressions: Object.keys(r.out).sort(),
      blink,
      face: { x: f(px, r.size.w), y: f(py, r.size.h), s: f(ps, r.size.w), a: f(r.size.h, r.size.w) },
      eyes: r.spriteEyes,
    };
    console.log(`${id}: ${Object.keys(r.out).length} expressions, ${Math.round(bytes / 1024)} KB, ${r.size.w}×${r.size.h}; blink on ${blink.join(', ') || 'none'}`);
    console.log(`   eye change: ${Object.entries(r.eyes).map(([n, v]) => `${n} ${v.toFixed(1)}`).join(', ')}`);
    for (const n of r.notes) console.log(`   ${n}`);
  }
  await browser.close();
  const body = Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n');
  fs.writeFileSync(manifestFile, `/*
 * Each character's expressions (assets/sprites/<id>/<expression>.webp), which of them can
 * blink with the painted eyelids, where the face is on the sprite for the portrait in the text
 * box (a square: x and size as fractions of the sprite's width, y of its height; a is the
 * sprite's height / width), and where the eyes are (for tools/paint-blinks.js).
 * Generated by tools/import-sprites.js.
 */
window.VN_EXPRESSIONS = {
${body}
};
`);
})();
