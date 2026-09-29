#!/usr/bin/env node
/*
 * Checks the story script without opening a browser:
 *   node tools/check-script.js
 * Prints any errors (with line numbers), plus a summary of labels, choices,
 * variables and endings, and warns about labels nothing ever jumps to.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const ctx = { console, window: {} };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['js/expr.js', 'js/parser.js', 'js/synth.js', 'story/script.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
}
const source = ctx.window.STORY_SCRIPT;
const story = ctx.VN.parse(source);

const lines = story.program;
const menus = lines.filter((i) => i.op === 'menu');
const vars = new Set();
for (const i of lines) {
  if (i.op === 'set') vars.add(i.name);
  if (i.op === 'menu') i.options.forEach((o) => o.effects.forEach((e) => vars.add(e.name)));
}
const targets = new Set();
for (const i of lines) {
  if (i.target != null) targets.add(i.target);
  if (i.op === 'menu') i.options.forEach((o) => targets.add(o.target));
}
// Every music, ambience and sound needs a recording in assets/ or a synthesized version.
const hasFile = (dir, name) => ['mp3', 'ogg', 'm4a', 'wav'].some((e) => fs.existsSync(path.join(root, 'assets', dir, `${name}.${e}`)));
const soundChecks = [];
for (const i of lines) {
  if (i.op !== 'play') continue;
  if (i.channel === 'sound') soundChecks.push([i.name, 'sfx', ctx.VN.SYNTH_SOUNDS, i.line]);
  else soundChecks.push([i.name, 'music', i.channel === 'music' ? ctx.VN.SYNTH_TRACKS : ctx.VN.SYNTH_AMBIENCES, i.line]);
}
for (const [bg, a] of Object.entries(story.bgSound || {})) soundChecks.push([a.name, 'music', ctx.VN.SYNTH_AMBIENCES, `bgsound ${bg}`]);
for (const [name, dir, synth, where] of soundChecks) {
  if (!hasFile(dir, name) && !(synth && synth[name])) story.warnings.push({ line: where, msg: `no assets/${dir}/${name}.mp3 and no synthesized "${name}"` });
}

// Every timed choice should say what happens when the player hesitates.
for (const i of lines) {
  if (i.op !== 'menu') continue;
  const time = i.time != null ? i.time : story.choiceTime || 0;
  if (time > 0 && !i.hesitate) story.warnings.push({ line: i.line, msg: 'timed menu has no "- hesitate" option (the first option is used when time runs out)' });
}

const unreachable = Object.entries(story.labels).filter(([name, idx]) => {
  if (name === 'start' || targets.has(idx)) return false;
  // falls through from the previous instruction?
  const prev = lines[idx - 1];
  return prev && ['jump', 'return', 'end', 'ending'].includes(prev.op);
});

if (process.argv.includes('--assets')) {
  const bgs = new Set(), cgs = new Set(), music = new Set(), sounds = new Set(), sprites = {};
  const addSprite = (id, expr) => { (sprites[id] = sprites[id] || new Set()).add(expr || 'neutral'); };
  for (const i of lines) {
    if (i.op === 'scene' && i.bg !== 'black' && i.bg !== 'white') bgs.add(i.bg);
    if (i.op === 'show') addSprite(i.id, i.expr);
    if (i.op === 'say' && i.expr && i.who) addSprite(i.who, i.expr);
    if (i.op === 'cg' && i.name) cgs.add(i.name);
    if (i.op === 'play') (i.channel === 'sound' ? sounds : music).add(i.name);
  }
  if (story.titleMusic) music.add(story.titleMusic);
  const chibis = new Set(story.poemWords.flatMap((w) => Object.keys(w.scores)));
  console.log('Backgrounds  assets/bg/');
  for (const b of bgs) console.log(`  ${b}`);
  console.log('Sprites      assets/sprites/<character>/');
  for (const [id, set] of Object.entries(sprites)) console.log(`  ${id}: ${[...set].join(', ')}`);
  console.log('CGs          assets/cg/');
  for (const c of cgs) console.log(`  ${c}`);
  console.log('Chibis       assets/chibi/');
  for (const c of chibis) console.log(`  ${c}`);
  console.log('Music        assets/music/');
  for (const m of music) console.log(`  ${m}`);
  console.log('Sounds       assets/sfx/');
  for (const s of sounds) console.log(`  ${s}`);
  process.exit(story.errors.length ? 1 : 0);
}

console.log(`Title:      ${story.title}`);
console.log(`Lines:      ${lines.filter((i) => i.op === 'say').length} lines of text, ${menus.length} choices`);
console.log(`Labels:     ${Object.keys(story.labels).length}`);
console.log(`Characters: ${Object.keys(story.characters).join(', ')}`);
console.log(`Variables:  ${[...vars].sort().join(', ')}`);
console.log(`Endings:    ${story.endings.map((e) => `${e.id} ("${e.title}")`).join(', ') || 'none'}`);
for (const w of story.warnings) console.log(`warning  line ${w.line}: ${w.msg}`);
for (const [name] of unreachable) console.log(`warning  label "${name}" is never jumped to`);
if (story.errors.length) {
  for (const e of story.errors) console.log(`ERROR    line ${e.line}: ${e.msg}`);
  process.exit(1);
}
console.log('OK — no errors.');
