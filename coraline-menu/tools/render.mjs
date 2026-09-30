// Renders the menu to PNG frames (and optionally an MP4) in headless Chromium.
//
//   node tools/render.mjs --still 6 --out previews/calm.png
//   node tools/render.mjs --fps 30 --out frames/ [--from 0 --to 16] [--workers 3] [--query "flash=1"]
//   node tools/render.mjs --fps 30 --out frames/ --mp4 coraline-menu.mp4
//
// Every frame is rendered at an exact time on the loop, so the result is deterministic.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = (await import('node:module')).createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
  if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]);
  return acc;
}, []));

const types = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(0);
await new Promise((r) => server.on('listening', r));
const base = `http://localhost:${server.address().port}/index.html?still=1${args.query ? '&' + args.query : ''}`;

async function openPage() {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto(base, { waitUntil: 'commit', timeout: 120000 });
  await page.waitForFunction('window.__ready === true', null, { timeout: 600000 });
  await page.evaluate('document.fonts.ready');
  return { browser, page };
}

async function shoot(page, t, file) {
  await page.evaluate((tt) => window.__render(tt), t);
  await page.screenshot({ path: file });
}

if (args.still !== undefined) {
  const { browser, page } = await openPage();
  await shoot(page, parseFloat(args.still), args.out || 'still.png');
  console.log('wrote', args.out || 'still.png');
  await browser.close();
} else {
  const fps = parseFloat(args.fps || 30);
  const loop = 16;
  const from = parseFloat(args.from || 0), to = parseFloat(args.to || loop);
  const out = args.out || 'frames';
  fs.mkdirSync(out, { recursive: true });
  const total = Math.round((to - from) * fps);
  const workers = parseInt(args.workers || 2, 10);
  const t0 = Date.now();
  let done = 0;
  await Promise.all(Array.from({ length: workers }, async (_, w) => {
    const { browser, page } = await openPage();
    for (let i = w; i < total; i += workers) {
      const file = path.join(out, `f${String(i).padStart(5, '0')}.png`);
      if (!fs.existsSync(file)) await shoot(page, from + i / fps, file);
      done++;
      if (done % 10 === 0) {
        const per = (Date.now() - t0) / done / 1000;
        console.log(`${done}/${total} frames, ${per.toFixed(2)} s/frame, ~${Math.round(per * (total - done) / 60)} min left`);
      }
    }
    await browser.close();
  }));
  console.log(`rendered ${total} frames to ${out}`);
  if (args.mp4) {
    // H.264 for Canva; set FFMPEG if ffmpeg is not on the PATH
    const { spawnSync } = await import('node:child_process');
    const ffmpeg = process.env.FFMPEG || 'ffmpeg';
    const res = spawnSync(ffmpeg, [
      '-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(out, 'f%05d.png'),
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart', args.mp4,
    ], { stdio: 'inherit' });
    if (res.status !== 0) throw new Error(`ffmpeg failed (${res.status ?? res.error})`);
    console.log('wrote', args.mp4);
  }
}
server.close();
