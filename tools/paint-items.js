#!/usr/bin/env node
/*
 * Paints the keepsake icons as small pixel-art pictures:
 *
 *   assets/ui/items/<id>.png   32×32, shown enlarged with crisp pixels
 *
 *   node tools/paint-items.js
 *   PREVIEW=some/folder node tools/paint-items.js   also saves an enlarged sheet
 *
 * Needs Playwright (npm i -g playwright) and a Chromium it can launch.
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const OUT = path.join(root, 'assets/ui/items');

function paintAll() {
  // runs in the page: every icon is drawn at 32×32
  const S = 32;
  const cv = () => { const c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; };
  const rect = (x, px, py, w, h, col) => { x.fillStyle = col; x.fillRect(px, py, w, h); };
  const circ = (x, cx, cy, r, col) => { x.fillStyle = col; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); };
  const line = (x, x0, y0, x1, y1, col, w = 1) => { x.strokeStyle = col; x.lineWidth = w; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); };
  const poly = (x, pts, col) => { x.fillStyle = col; x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fill(); };
  const icons = {
    francs(x) {
      circ(x, 16, 17, 11, '#6a4a10'); circ(x, 16, 16, 11, '#e8b84a'); circ(x, 16, 16, 8.5, '#c8962e'); circ(x, 15, 15, 8, '#f0cc6a');
      x.fillStyle = '#8a6010'; x.font = 'bold 12px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('F', 16, 16.5);
      rect(x, 10, 9, 3, 1, '#fff4c8');
    },
    handkerchief(x) {
      poly(x, [[5, 12], [22, 5], [28, 20], [10, 27]], '#b8b0c0');
      poly(x, [[4, 11], [21, 4], [27, 19], [9, 26]], '#f6f2ec');
      poly(x, [[4, 11], [21, 4], [22, 6], [5, 13]], '#ffffff');
      for (let i = 0; i < 6; i++) rect(x, 5 + i * 3, 11 - i * 1.2, 1, 1, '#d8c8e0');
      x.fillStyle = '#b8323a'; x.font = 'italic bold 8px serif'; x.fillText('HJ', 12, 22);
    },
    watch(x) {
      line(x, 16, 2, 16, 7, '#c8962e', 2); circ(x, 16, 3, 2, '#e8b84a');
      circ(x, 16, 18, 11, '#6a4a10'); circ(x, 16, 17, 11, '#e8b84a'); circ(x, 16, 17, 8.5, '#f8f0dc');
      line(x, 16, 17, 16, 11, '#2a1a10', 1.5); line(x, 16, 17, 20, 19, '#2a1a10', 1.5);
      for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; rect(x, 16 + Math.cos(a) * 7 - 0.5, 17 + Math.sin(a) * 7 - 0.5, 1, 1, '#8a6a4a'); }
      rect(x, 9, 11, 3, 1, '#fff8dc');
    },
    egg_box(x) {
      poly(x, [[3, 12], [24, 8], [29, 13], [8, 18]], '#b8844a');
      rect(x, 3, 12, 5, 13, '#7a5028'); poly(x, [[8, 18], [29, 13], [29, 22], [8, 27]], '#9a6a38');
      poly(x, [[5, 12], [23, 9], [26, 12], [8, 15]], '#efe6cc');
      for (let i = 0; i < 26; i++) rect(x, 7 + (i % 9) * 2 + Math.floor(i / 9), 11.5 + Math.floor(i / 9) * 1.3 - (i % 9) * 0.35, 1, 1, '#6a6a70');
      line(x, 8, 22, 29, 17, '#6a4020', 1);
    },
    glove(x) {
      x.save(); x.translate(16, 17); x.rotate(-0.5);
      for (const [fx, len] of [[-6, 9], [-2, 11], [2, 10.5], [6, 8]]) { x.strokeStyle = '#3a1e0c'; x.lineWidth = 4.2; x.lineCap = 'round'; x.beginPath(); x.moveTo(fx, -2); x.lineTo(fx * 1.1, -2 - len); x.stroke(); x.strokeStyle = '#8a5430'; x.lineWidth = 2.6; x.stroke(); }
      x.strokeStyle = '#3a1e0c'; x.lineWidth = 4.2; x.beginPath(); x.moveTo(-6, 4); x.lineTo(-11, -1); x.stroke(); x.strokeStyle = '#8a5430'; x.lineWidth = 2.6; x.stroke();
      rect(x, -8, -3, 16, 11, '#3a1e0c'); rect(x, -7, -2, 14, 9, '#8a5430'); rect(x, -7, -2, 3, 9, '#a8703e');
      rect(x, -8, 7, 16, 6, '#5a3218'); rect(x, -8, 12, 16, 1, '#e6d6b4');
      x.restore();
    },
    note(x) {
      poly(x, [[8, 4], [24, 6], [23, 28], [7, 26]], '#b8ae96');
      poly(x, [[7, 3], [23, 5], [22, 27], [6, 25]], '#f2ead6');
      for (let c = 0; c < 2; c++) for (let k = 0; k < 5; k++) { rect(x, 17 - c * 6, 8 + k * 3.5, 2, 1, '#1a1210'); if (k % 2) rect(x, 18 - c * 6, 9 + k * 3.5, 1, 2, '#1a1210'); }
      line(x, 7, 14, 23, 16, '#d8ccb0', 1);
    },
    pass(x) {
      poly(x, [[10, 3], [22, 3], [24, 6], [24, 28], [8, 28], [8, 6]], '#5a3a20');
      poly(x, [[11, 4], [21, 4], [23, 7], [23, 27], [9, 27], [9, 7]], '#c8965a');
      circ(x, 16, 7, 1.5, '#3a2410');
      for (let k = 0; k < 4; k++) rect(x, 15, 11 + k * 3, 2, 2, '#2a1a10');
      rect(x, 12, 21, 8, 5, '#b42a1c'); rect(x, 13, 22, 6, 3, '#e0503a'); rect(x, 15, 22, 2, 3, '#fbe9dc');
    },
    blossom(x) {
      poly(x, [[6, 6], [26, 5], [27, 27], [5, 26]], '#d8ccb4');
      poly(x, [[5, 5], [25, 4], [26, 26], [4, 25]], '#f4ecda');
      line(x, 10, 22, 22, 10, '#6a4a3a', 1);
      for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 - 1.2; circ(x, 16 + Math.cos(a) * 4, 15 + Math.sin(a) * 4, 3, '#f0a0bc'); }
      circ(x, 16, 15, 2, '#ffe8a0'); circ(x, 22, 9, 2, '#f4b4c8');
    },
    letter(x) {
      for (const [dx, dy, r] of [[2, 2, -0.12], [0, 0, 0.06]]) {
        x.save(); x.translate(16 + dx, 16 + dy); x.rotate(r);
        rect(x, -9, -12, 18, 23, '#b8ae96'); rect(x, -10, -13, 18, 23, '#f2ead6');
        for (let c = 0; c < 3; c++) for (let k = 0; k < 6; k++) rect(x, 3 - c * 5, -10 + k * 3.5, 2, 1, '#1a1210');
        x.restore();
      }
      rect(x, 3, 22, 12, 7, '#c8b88e'); poly(x, [[3, 22], [9, 26], [15, 22]], '#b8a87e'); rect(x, 12, 23, 2, 3, '#a83a2a');
    },
    helene_letter(x) {
      // a small folded letter in cream paper, sealed with a pink wax heart
      poly(x, [[5, 9], [27, 8], [28, 25], [4, 26]], '#c8b8a0');
      poly(x, [[4, 8], [26, 7], [27, 24], [3, 25]], '#fbf2e2');
      poly(x, [[4, 8], [15, 17], [26, 7]], '#eadcc4');
      line(x, 4, 8, 15, 17, '#c8b8a0', 1); line(x, 26, 7, 15, 17, '#c8b8a0', 1);
      circ(x, 15, 17, 3.5, '#c2476a'); circ(x, 14, 16, 1.5, '#f4a7b9');
      for (let k = 0; k < 3; k++) rect(x, 7 + k * 5, 21, 3, 1, '#b89a8a');
    },
    feather(x) {
      // a white feather, curving, with a pale quill
      x.save(); x.translate(16, 16); x.rotate(-0.75);
      for (let k = -11; k <= 9; k++) {
        const w = 5.5 * Math.sin(((k + 11) / 21) * Math.PI) + 0.5;
        rect(x, -w, k, w, 1, k % 4 === 0 ? '#d8dce8' : '#f4f6fb');
        rect(x, 0, k, w * 0.85, 1, k % 3 === 0 ? '#cfd4e2' : '#ffffff');
      }
      line(x, 0.5, -12, 0.5, 14, '#b8a88a', 1.2);
      x.restore();
      rect(x, 11, 10, 1, 1, '#ffffff');
    },
    hairpin(x) {
      // a lacquered kanzashi: two gold prongs and a red flower at the top
      line(x, 9, 27, 21, 9, '#8a6a1c', 2.4); line(x, 13, 28, 23, 12, '#8a6a1c', 2.4);
      line(x, 9, 27, 21, 9, '#f0c85a', 1.2); line(x, 13, 28, 23, 12, '#f0c85a', 1.2);
      for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 - 0.4; circ(x, 23 + Math.cos(a) * 3.6, 9 + Math.sin(a) * 3.6, 2.8, '#b8232e'); }
      circ(x, 23, 9, 2.2, '#f4c542'); rect(x, 21, 6, 2, 1, '#ff8a8a');
      line(x, 19, 13, 17, 21, '#f4c542', 1); circ(x, 17, 22, 1.4, '#f4c542');
    },
    flowers(x) {
      // wildflowers: poppies, cornflowers and small white ones, tied together
      for (const [ex, ey] of [[9, 8], [14, 5], [20, 7], [24, 11], [7, 14]]) line(x, 16, 27, ex, ey + 2, '#4a7a34', 1.2);
      for (const [cx, cy] of [[9, 8], [20, 7]]) { circ(x, cx, cy, 3.4, '#d8322a'); circ(x, cx - 1, cy - 1, 1.6, '#f06048'); circ(x, cx, cy, 1, '#1a1010'); }
      for (const [cx, cy] of [[14, 5], [24, 11]]) { for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; circ(x, cx + Math.cos(a) * 2.2, cy + Math.sin(a) * 2.2, 1.3, '#4a7ad8'); } circ(x, cx, cy, 1, '#1a2a60'); }
      circ(x, 7, 14, 2.4, '#ffffff'); circ(x, 7, 14, 0.9, '#f4d040'); circ(x, 12, 12, 1.8, '#ffffff');
      rect(x, 14, 20, 5, 3, '#c8a878'); rect(x, 14, 21, 5, 1, '#8a6a40');
    },
    journal(x) {
      rect(x, 6, 4, 20, 25, '#3a2014'); rect(x, 7, 5, 18, 23, '#6a2a2a'); rect(x, 7, 5, 3, 23, '#4a1a1a');
      rect(x, 12, 10, 10, 6, '#e8d8b0'); line(x, 13, 12, 21, 12, '#8a6a4a', 1); line(x, 13, 14, 19, 14, '#8a6a4a', 1);
      rect(x, 25, 8, 2, 18, '#efe6d0');
    },
  };
  const out = {};
  for (const [id, fn] of Object.entries(icons)) {
    const [c, x] = cv();
    fn(x);
    // crisp pixels: snap every edge to fully on or off, and add a dark outline for legibility
    const img = x.getImageData(0, 0, S, S);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) d[i + 3] = d[i + 3] > 110 ? 255 : 0;
    const solid = (px, py) => px >= 0 && py >= 0 && px < S && py < S && d[(py * S + px) * 4 + 3] === 255;
    const edge = [];
    for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) {
      if (solid(px, py)) continue;
      if (solid(px - 1, py) || solid(px + 1, py) || solid(px, py - 1) || solid(px, py + 1)) edge.push((py * S + px) * 4);
    }
    for (const i of edge) { d[i] = 26; d[i + 1] = 14; d[i + 2] = 8; d[i + 3] = 255; }
    x.putImageData(img, 0, 0);
    out[id] = c.toDataURL('image/png');
  }
  // an enlarged sheet to check them by eye
  const ids = Object.keys(out);
  const sheet = document.createElement('canvas');
  sheet.width = ids.length * 132; sheet.height = 132;
  const sx = sheet.getContext('2d');
  sx.fillStyle = '#20140c'; sx.fillRect(0, 0, sheet.width, 132);
  sx.imageSmoothingEnabled = false;
  return Promise.all(ids.map((id, i) => new Promise((res) => { const im = new Image(); im.onload = () => { sx.drawImage(im, i * 132 + 2, 2, 128, 128); res(); }; im.src = out[id]; })))
    .then(() => ({ icons: out, sheet: sheet.toDataURL('image/png') }));
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const { icons, sheet } = await page.evaluate(paintAll);
  fs.mkdirSync(OUT, { recursive: true });
  for (const [id, url] of Object.entries(icons)) fs.writeFileSync(path.join(OUT, `${id}.png`), Buffer.from(url.split(',')[1], 'base64'));
  if (process.env.PREVIEW) fs.writeFileSync(path.join(process.env.PREVIEW, 'items-sheet.png'), Buffer.from(sheet.split(',')[1], 'base64'));
  console.log(`painted ${Object.keys(icons).length} icons into assets/ui/items/`);
  await browser.close();
})();
