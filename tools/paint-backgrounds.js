#!/usr/bin/env node
/*
 * Paints the game's pixel-art backgrounds (the scenes in tools/paint/) as layers,
 * so parts of each picture can move, and writes:
 *
 *   assets/scenes/<name>/<layer>.png   the layers, at their native 480×270 pixel size
 *   assets/scenes/<name>/flat.png      the whole picture in one (thumbnails, backdrop)
 *   story/scenery.js                   how the layers stack and move (read by js/scenery.js)
 *
 *   node tools/paint-backgrounds.js              every scene
 *   node tools/paint-backgrounds.js cemetery     just one (or several)
 *
 * Needs Playwright (npm i -g playwright) and a Chromium it can launch.
 * Set PREVIEW=some/folder to also save 960×540 previews there.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { chromium } = require('playwright');

// ---- a small indexed-colour PNG writer: the scenes use at most a few dozen colours,
// so a palette PNG is several times smaller than a full-colour one.
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
function crc32(buf) { let c = -1; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function indexedPng(w, h, rgba) {
  const index = new Map();
  const colors = [];
  const pix = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const a = rgba[i * 4 + 3];
    const key = a < 128 ? -1 : (rgba[i * 4] << 16) | (rgba[i * 4 + 1] << 8) | rgba[i * 4 + 2];
    let k = index.get(key);
    if (k === undefined) { k = colors.length; index.set(key, k); colors.push(key); }
    pix[i] = k;
  }
  if (colors.length > 256) throw new Error(`too many colours (${colors.length})`);
  const plte = Buffer.alloc(colors.length * 3);
  const trns = Buffer.alloc(colors.length, 255);
  colors.forEach((key, k) => {
    if (key === -1) { trns[k] = 0; return; }
    plte[k * 3] = key >> 16; plte[k * 3 + 1] = (key >> 8) & 255; plte[k * 3 + 2] = key & 255;
  });
  // each row with the filter that leaves the smallest numbers (none, sub or up)
  const raw = Buffer.alloc((w + 1) * h);
  for (let y = 0; y < h; y++) {
    const row = pix.subarray(y * w, (y + 1) * w);
    const prev = y ? pix.subarray((y - 1) * w, y * w) : null;
    const cands = [row, row.map((v, x) => (v - (x ? row[x - 1] : 0)) & 255), prev ? row.map((v, x) => (v - prev[x]) & 255) : null];
    let best = 0, bestSum = Infinity;
    cands.forEach((cnd, f) => { if (!cnd) return; let sum = 0; for (const v of cnd) sum += v < 128 ? v : 256 - v; if (sum < bestSum) { bestSum = sum; best = f; } });
    raw[y * (w + 1)] = best;
    raw.set(cands[best], y * (w + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 3;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('PLTE', plte), ...(colors.includes(-1) ? [chunk('tRNS', trns.subarray(0, colors.indexOf(-1) + 1))] : []),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ]);
}

const ROOT = path.join(__dirname, '..');
const KIT = path.join(__dirname, 'paint');
const MANIFEST = path.join(ROOT, 'story', 'scenery.js');
const files = ['kit.js', ...fs.readdirSync(KIT).filter((f) => f.startsWith('scenes-')).sort()];

function readManifest() {
  if (!fs.existsSync(MANIFEST)) return {};
  const m = fs.readFileSync(MANIFEST, 'utf8').match(/window\.VN_SCENERY = (\{[\s\S]*\});/);
  return m ? JSON.parse(m[1]) : {};
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.setContent('<!doctype html><html><body></body></html>');
  for (const f of files) await page.addScriptTag({ content: fs.readFileSync(path.join(KIT, f), 'utf8') });
  const all = await page.evaluate(() => Object.keys(globalThis.SCENES));
  const wanted = process.argv.slice(2).length ? process.argv.slice(2) : all;
  const manifest = readManifest();
  for (const name of wanted) {
    if (!all.includes(name)) { console.error(`No scene called "${name}". Scenes: ${all.join(', ')}`); continue; }
    const out = await page.evaluate((name) => paintScene(globalThis.SCENES[name]), name);
    const dir = path.join(ROOT, 'assets', 'scenes', name);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const save = (file, img) => fs.writeFileSync(path.join(dir, file), indexedPng(img.w, img.h, Buffer.from(img.rgba, 'base64')));
    save('flat.png', out.flat);
    let bytes = fs.statSync(path.join(dir, 'flat.png')).size;
    const layers = out.layers.map((l) => {
      save(`${l.id}.png`, l.png);
      bytes += fs.statSync(path.join(dir, `${l.id}.png`)).size;
      const { png, ...rest } = l;
      return { ...rest, src: `assets/scenes/${name}/${l.id}.png` };
    });
    manifest[name] = { flat: `assets/scenes/${name}/flat.png`, vignette: out.vignette, layers };
    // a layered scene replaces any old single-picture version of it
    for (const ext of ['png', 'jpg', 'webp']) fs.rmSync(path.join(ROOT, 'assets', 'bg', `${name}.${ext}`), { force: true });
    if (process.env.PREVIEW) fs.writeFileSync(path.join(process.env.PREVIEW, `paint-${name}.png`), Buffer.from(out.preview.split(',')[1], 'base64'));
    console.log(`${name}: ${layers.length} layers, ${Math.round(bytes / 1024)} KB`);
  }
  const sorted = Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]));
  fs.writeFileSync(MANIFEST, `/* Generated by tools/paint-backgrounds.js: how each painted background's layers stack and move. */\nwindow.VN_SCENERY = ${JSON.stringify(sorted, null, 1)};\n`);
  await browser.close();
})();
