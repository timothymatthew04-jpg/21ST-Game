// Renders the animated menu to PNG frames, then to an MP4 (with sound) and a GIF, in headless Chromium.
//
//   node tools/render.mjs --still 6.35 --out previews/still.png
//   node tools/render.mjs --fps 30 --out frames/ [--workers 2] [--from 0 --to 12]
//   node tools/render.mjs --fps 30 --out frames/ --mp4 export/coraline-main-menu.mp4 --audio export/menu-sound.wav
//   node tools/render.mjs --fps 30 --out frames/ --gif export/coraline-main-menu.gif     (reuses frames)
//
// Every frame is rendered at an exact time on the loop, so the result is deterministic and seamless.
// Set FFMPEG to an ffmpeg binary if it is not on the PATH.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
  if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]);
  return acc;
}, []));
const ffmpeg = process.env.FFMPEG || 'ffmpeg';

const types = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.json': 'application/json' };
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
  const errors = [];
  page.on('pageerror', (e) => { errors.push(e.message); console.error('page error:', e.message); });
  await page.goto(base, { waitUntil: 'commit', timeout: 120000 });
  await page.waitForFunction('window.__ready === true || window.__failed', null, { timeout: 300000 }).catch(() => {});
  if (errors.length) throw new Error('page failed: ' + errors.join('; '));
  // warm up: the first frame compiles the shader, which can be slow in software rendering
  await page.evaluate(() => window.__render(0));
  await page.screenshot({ timeout: 600000 });
  return { browser, page };
}

async function shoot(page, t, file) {
  await page.evaluate((tt) => window.__render(tt), t);
  await page.screenshot({ path: file });
}

function run(cmdArgs) {
  const res = spawnSync(ffmpeg, ['-y', '-loglevel', 'error', ...cmdArgs], { stdio: 'inherit' });
  if (res.status !== 0) throw new Error(`ffmpeg failed (${res.status ?? res.error})`);
}

const fps = parseFloat(args.fps || 30);
if (args.stills) {
  // several stills from one page: --stills 2.3,6.3 --out dir/
  const { browser, page } = await openPage();
  fs.mkdirSync(args.out, { recursive: true });
  for (const t of String(args.stills).split(',').map(Number)) {
    const file = path.join(args.out, `t${t.toFixed(2)}.png`);
    await shoot(page, t, file);
    console.log('wrote', file);
  }
  await browser.close();
} else if (args.still !== undefined) {
  const { browser, page } = await openPage();
  await shoot(page, parseFloat(args.still), args.out || 'still.png');
  console.log('wrote', args.out || 'still.png');
  await browser.close();
} else {
  const out = args.out || 'frames';
  fs.mkdirSync(out, { recursive: true });
  const probe = await openPage();
  const loop = await probe.page.evaluate('window.__loop');
  await probe.browser.close();
  const from = parseFloat(args.from || 0), to = parseFloat(args.to || loop);
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
      if (done % 30 === 0) {
        const per = (Date.now() - t0) / done / 1000;
        console.log(`${done}/${total} frames, ${per.toFixed(2)} s/frame, ~${Math.ceil(per * (total - done) / 60)} min left`);
      }
    }
    await browser.close();
  }));
  console.log(`rendered ${total} frames to ${out}`);
  const input = ['-framerate', String(fps), '-i', path.join(out, 'f%05d.png')];
  if (args.mp4) {
    const audio = typeof args.audio === 'string' ? ['-i', args.audio] : [];
    run([...input, ...audio, '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
      ...(audio.length ? ['-c:a', 'aac', '-b:a', '192k', '-shortest'] : []), '-movflags', '+faststart', args.mp4]);
    console.log('wrote', args.mp4);
  }
  if (args.gif) {
    // 1280 wide at 12 fps; grain is smoothed first and only changed areas are stored, which keeps
    // the file near 30 MB instead of 75
    const vf = 'fps=12,scale=1280:-1:flags=lanczos,hqdn3d=4:4:8:8,split[a][b];[a]palettegen=max_colors=200:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle';
    run([...input, '-vf', vf, '-loop', '0', args.gif]);
    console.log('wrote', args.gif);
  }
}
server.close();
