#!/usr/bin/env node
/*
 * Paints the wide scenes for the walking areas (tools/paint/walks.js), in the same pixel-art
 * style and with the same toolkit as the backgrounds, only several screens wide:
 *
 *   assets/walks/<area>/<layer>.png   the layers (the walk engine scrolls them at different speeds)
 *   story/walkscenery.js              how the layers stack (read by js/walk.js)
 *
 *   node tools/paint-walks.js            every area
 *   node tools/paint-walks.js camp       just one (or several)
 *
 * Set PREVIEW=some/folder to also save a preview of each whole panorama there.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { chromium } = require('playwright');

// how wide each area is, in pixels at the scenes' 270-pixel height (one screen is 480)
const WIDTHS = { camp: 1920, lavilledieu: 1920, steppe: 2400, village: 1920, aviary: 960, ruins: 1440, cemetery: 960, crossing: 1440 };

// ---- the same small palette-PNG writer the backgrounds use
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
const MANIFEST = path.join(ROOT, 'story', 'walkscenery.js');

function readManifest() {
  if (!fs.existsSync(MANIFEST)) return {};
  const m = fs.readFileSync(MANIFEST, 'utf8').match(/window\.VN_WALKSCENERY = (\{[\s\S]*\});/);
  return m ? JSON.parse(m[1]) : {};
}

(async () => {
  const browser = await chromium.launch();
  const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(WIDTHS);
  const manifest = readManifest();
  const kit = fs.readFileSync(path.join(KIT, 'kit.js'), 'utf8');
  const extras = fs.readdirSync(KIT).filter((f) => f.startsWith('scenes-')).sort().map((f) => fs.readFileSync(path.join(KIT, f), 'utf8'));
  const walks = fs.readFileSync(path.join(KIT, 'walks.js'), 'utf8');
  for (const name of wanted) {
    const width = WIDTHS[name];
    if (!width) { console.error(`No walk area called "${name}". Areas: ${Object.keys(WIDTHS).join(', ')}`); continue; }
    const page = await browser.newPage();
    page.on('pageerror', (e) => console.error('page error:', e.message));
    await page.setContent('<!doctype html><html><body></body></html>');
    // the toolkit, told that this picture is `width` pixels wide
    await page.addScriptTag({ content: kit.replace(/const W = 480;/, `const W = ${width};`) });
    for (const x of extras) await page.addScriptTag({ content: x });
    await page.addScriptTag({ content: walks });
    const out = await page.evaluate((name) => paintScene(globalThis.WALKS[name]), name);
    await page.close();
    const dir = path.join(ROOT, 'assets', 'walks', name);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    let bytes = 0;
    const layers = out.layers.map((l) => {
      const file = path.join(dir, `${l.id}.png`);
      let rgba = Buffer.from(l.png.rgba, 'base64');
      // the sky never scrolls, so only its first screen is kept
      if (l.depth === 0 && l.png.w > 480) {
        const cut = Buffer.alloc(480 * l.png.h * 4);
        for (let y = 0; y < l.png.h; y++) rgba.copy(cut, y * 480 * 4, y * l.png.w * 4, y * l.png.w * 4 + 480 * 4);
        rgba = cut;
        l.png.w = 480;
        l.w = 480;
      }
      fs.writeFileSync(file, indexedPng(l.png.w, l.png.h, rgba));
      bytes += fs.statSync(file).size;
      const { png, ...rest } = l;
      return { ...rest, src: `assets/walks/${name}/${l.id}.png` };
    });
    manifest[name] = { w: width, h: 270, layers };
    if (process.env.PREVIEW) fs.writeFileSync(path.join(process.env.PREVIEW, `walk-${name}.png`), Buffer.from(out.preview.split(',')[1], 'base64'));
    console.log(`${name}: ${width}px wide, ${layers.length} layers, ${Math.round(bytes / 1024)} KB`);
  }
  const sorted = Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]));
  fs.writeFileSync(MANIFEST, `/* Generated by tools/paint-walks.js: the layers of each walking area. */\nwindow.VN_WALKSCENERY = ${JSON.stringify(sorted, null, 1)};\n`);
  await browser.close();
})();
