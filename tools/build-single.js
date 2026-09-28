#!/usr/bin/env node
/*
 * Packs the whole game (engine, story, styles and every file in assets/)
 * into a single HTML file that runs anywhere, even offline:
 *
 *   node tools/build-single.js              → dist/silk.html
 *   node tools/build-single.js --fragment   → dist/silk-fragment.html
 *                                             (no <html>/<head>/<body> wrapper,
 *                                             for hosts that add their own)
 */
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const fragment = process.argv.includes('--fragment');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const index = read('index.html');
const between = (a, b) => {
  const i = index.indexOf(a);
  const j = index.indexOf(b);
  if (i < 0 || j < 0) throw new Error(`index.html is missing the ${a} marker`);
  return index.slice(i + a.length, j);
};

const scripts = [...between('<!-- scripts:start -->', '<!-- scripts:end -->').matchAll(/src="([^"]+)"/g)].map((m) => m[1]);
const body = between('<!-- stage:start -->', '<!-- stage:end -->').trim();
const title = (index.match(/<title>([^<]*)<\/title>/) || [, 'Game'])[1];
const fonts = [...index.matchAll(/<link rel="stylesheet" href="(https:\/\/fonts[^"]+)">/g)].map((m) => m[1]);

const MIME = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif',
  mp3: 'audio/mpeg', ogg: 'audio/ogg', m4a: 'audio/mp4', wav: 'audio/wav',
};
const embedded = {};
let bytes = 0;
(function walk(dir) {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(rel);
    else {
      const mime = MIME[entry.name.split('.').pop().toLowerCase()];
      if (!mime) continue;
      const data = fs.readFileSync(path.join(root, rel));
      bytes += data.length;
      embedded[rel] = `data:${mime};base64,${data.toString('base64')}`;
    }
  }
})('assets');

const safe = (js) => js.replace(/<\/script/gi, '<\\/script');
const js = [
  `window.VN_EMBEDDED_ONLY = true;\nwindow.VN_EMBEDDED_ASSETS = ${JSON.stringify(embedded)};`,
  ...scripts.map((src) => `/* ---- ${src} ---- */\n${read(src)}`),
].map(safe).join('\n');

const head = [
  `<title>${title}</title>`,
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  ...fonts.map((href) => `<link rel="stylesheet" href="${href}">`),
  `<style>\n${read('css/game.css')}\n</style>`,
].filter(Boolean).join('\n');

const html = fragment
  ? `${head}\n${body}\n<script>\n${js}\n</script>\n`
  : `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${head}\n</head>\n<body>\n${body}\n<script>\n${js}\n</script>\n</body>\n</html>\n`;

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
const out = path.join(root, 'dist', fragment ? 'silk-fragment.html' : 'silk.html');
fs.writeFileSync(out, html);
console.log(`Wrote ${path.relative(root, out)}: ${(html.length / 1024).toFixed(0)} KB, ${Object.keys(embedded).length} assets (${(bytes / 1024).toFixed(0)} KB raw)`);
