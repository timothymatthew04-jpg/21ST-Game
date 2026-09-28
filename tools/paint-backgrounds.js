#!/usr/bin/env node
/*
 * Paints the pixel-art backgrounds in tools/paint/ and writes them to assets/bg/.
 *
 *   node tools/paint-backgrounds.js              every scene
 *   node tools/paint-backgrounds.js cemetery     just one (or several)
 *
 * Needs Playwright (npm i -g playwright) and a Chromium it can launch.
 * Set PREVIEW=some/folder to also save the small 480×270 originals there.
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const KIT = path.join(__dirname, 'paint');
const files = ['kit.js', ...fs.readdirSync(KIT).filter((f) => f.startsWith('scenes-')).sort()];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.setContent('<!doctype html><html><body></body></html>');
  for (const f of files) await page.addScriptTag({ content: fs.readFileSync(path.join(KIT, f), 'utf8') });
  const all = await page.evaluate(() => Object.keys(globalThis.SCENES));
  const wanted = process.argv.slice(2).length ? process.argv.slice(2) : all;
  for (const name of wanted) {
    if (!all.includes(name)) { console.error(`No scene called "${name}". Scenes: ${all.join(', ')}`); continue; }
    const out = await page.evaluate((name) => {
      const canvas = newCanvas();
      const c = canvas.getContext('2d');
      const opts = globalThis.SCENES[name](c) || {};
      pixelate(canvas, opts.colors || 60, opts.spread == null ? 16 : opts.spread);
      const big = enlarge(canvas, 4);
      return { webp: big.toDataURL('image/webp', 0.95), small: canvas.toDataURL('image/png') };
    }, name);
    const file = path.join(ROOT, 'assets', 'bg', `${name}.webp`);
    fs.writeFileSync(file, Buffer.from(out.webp.split(',')[1], 'base64'));
    if (process.env.PREVIEW) fs.writeFileSync(path.join(process.env.PREVIEW, `paint-${name}.png`), Buffer.from(out.small.split(',')[1], 'base64'));
    console.log(`${name}: ${Math.round(fs.statSync(file).size / 1024)} KB`);
  }
  await browser.close();
})();
