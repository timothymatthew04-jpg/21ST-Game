/*
 * parser.js — compiles the story script (see docs/SCRIPTING.md) into a flat
 * list of instructions the engine can run, save and roll back.
 */
(function () {
  'use strict';
  const VN = (globalThis.VN = globalThis.VN || {});

  const TRANSITIONS = ['none', 'dissolve', 'fade', 'flash', 'slow'];
  const POSITIONS = { farleft: 14, left: 28, center: 50, right: 72, farright: 86 };
  const ASSIGN_RE = /^([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)?)\s*(\+=|-=|\*=|\/=|=)\s*(.+)$/;
  const IDENT_RE = /^[A-Za-z_]\w*$/;
  const BG_FX = ['petals', 'leaves', 'foliage', 'snow', 'ash', 'rain', 'fireflies', 'motes', 'glints', 'stars', 'smoke', 'steam', 'embers', 'birds', 'flutter', 'glow', 'flame', 'rays', 'mist', 'rock'];

  /** Split a line into bare words and "quoted strings" (with \" and \n escapes). */
  function tokenizeLine(text) {
    const out = [];
    let i = 0;
    while (i < text.length) {
      const c = text[i];
      if (c === ' ' || c === '\t') { i++; continue; }
      if (c === '"') {
        let s = '';
        i++;
        while (i < text.length && text[i] !== '"') {
          if (text[i] === '\\' && i + 1 < text.length) {
            const n = text[i + 1];
            s += n === 'n' ? '\n' : n;
            i += 2;
          } else s += text[i++];
        }
        if (text[i] !== '"') throw new Error('Missing closing quote');
        i++;
        out.push({ t: 'str', v: s });
      } else {
        let w = '';
        while (i < text.length && text[i] !== ' ' && text[i] !== '\t' && text[i] !== '"') w += text[i++];
        out.push({ t: 'word', v: w });
      }
    }
    return out;
  }

  /** Split "a += 1, b = true; c -= 2" on top-level commas / semicolons. */
  function splitList(s) {
    const parts = [];
    let depth = 0, quote = null, cur = '';
    for (const ch of s) {
      if (quote) { cur += ch; if (ch === quote) quote = null; continue; }
      if (ch === '"' || ch === "'") { quote = ch; cur += ch; continue; }
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if ((ch === ',' || ch === ';') && depth === 0) { if (cur.trim()) parts.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    if (cur.trim()) parts.push(cur.trim());
    return parts;
  }

  function parse(source) {
    const story = {
      title: 'Untitled', subtitle: '', emblem: '', artStyle: 'mixed', titleFx: null, titleLogo: 'carved', titleMusic: null, titleBackground: null, warning: null, credits: null,
      characters: {}, backgrounds: {}, poemWords: [], karma: [], bgFx: {}, places: {}, bgSound: {}, bgLight: {}, items: {},
      program: [], labels: {}, endings: [], errors: [], warnings: [],
      hash: hashString(source),
    };
    const program = story.program;
    const errors = story.errors;

    const lines = [];
    source.replace(/\r\n?/g, '\n').split('\n').forEach((raw, idx) => {
      const text = raw.trim();
      if (!text || text.startsWith('#') || text.startsWith('//')) return;
      const indent = raw.match(/^[ \t]*/)[0].replace(/\t/g, '    ').length;
      lines.push({ text, indent, n: idx + 1 });
    });

    const err = (line, msg) => errors.push({ line: line ? line.n : 0, msg });
    const expr = (line, src) => {
      try { VN.expr.compile(src); } catch (e) { err(line, e.message); }
      return src;
    };
    const assignment = (line, src) => {
      const m = src.match(ASSIGN_RE);
      if (!m) {
        if (/^[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)?$/.test(src)) return { name: src, assign: '=', value: 'true' };
        err(line, `Can't read "${src}". Use something like: trust += 1`);
        return null;
      }
      return { name: m[1], assign: m[2], value: expr(line, m[3]) };
    };

    // Pass 1: character definitions, so dialogue lines can be recognised anywhere.
    for (const L of lines) {
      if (!/^character\s/.test(L.text)) continue;
      try {
        const tk = tokenizeLine(L.text);
        const id = tk[1] && tk[1].t === 'word' ? tk[1].v : null;
        if (!id || !IDENT_RE.test(id)) { err(L, 'character needs an id, e.g. character helene "Hélène" color=#f4a7b9'); continue; }
        const ch = { id, name: tk[2] && tk[2].t === 'str' ? tk[2].v : id, color: '#ffffff', blip: 520, italic: false, sprite: null, face: id };
        for (const t of tk.slice(3)) {
          const [k, v] = t.v.split('=');
          if (k === 'color') ch.color = v;
          else if (k === 'blip') ch.blip = parseFloat(v) || 520;
          else if (k === 'italic' || k === 'thought') ch.italic = true;
          else if (k === 'sprite') ch.sprite = v;
          else if (k === 'chibi') ch.chibi = v;
          else if (k === 'face') ch.face = v === 'none' ? null : v;
          // voice=120 pace=130 muffle=1100 breath=0.3 — the muffled "speech" heard while they talk
          else if (k === 'voice') ch.voice = v === 'none' ? null : Object.assign(ch.voice || { pace: 125, muffle: 1100, breath: 0 }, { pitch: parseFloat(v) || 120 });
          else if (k === 'pace' || k === 'muffle' || k === 'breath') {
            ch.voice = ch.voice || { pitch: 120, pace: 125, muffle: 1100, breath: 0 };
            ch.voice[k] = parseFloat(v) || 0;
          }
          else err(L, `Unknown character option "${t.v}"`);
        }
        story.characters[id] = ch;
      } catch (e) { err(L, e.message); }
    }

    let currentLabel = '(start)';
    let sayCount = 0;

    const emit = (L, ins) => {
      ins.line = L ? L.n : 0;
      program.push(ins);
      return ins;
    };

    function kwargs(tokens, from, allowed, L) {
      const pos = [];
      const kw = {};
      for (let i = from; i < tokens.length; i++) {
        const t = tokens[i];
        if (t.t === 'word' && allowed.includes(t.v) && i + 1 < tokens.length) {
          kw[t.v] = tokens[++i].v;
          // "with fade 1.5" → optional duration right after the transition
          if (t.v === 'with' && tokens[i + 1] && /^\d+(\.\d+)?$/.test(tokens[i + 1].v)) kw.duration = parseFloat(tokens[++i].v);
        } else if (t.t === 'word' && t.v.includes('=')) {
          const [k, v] = t.v.split('=');
          if (allowed.includes(k)) kw[k] = v; else err(L, `Unknown option "${k}"`);
        } else pos.push(t);
      }
      if (kw.with && !TRANSITIONS.includes(kw.with)) err(L, `Unknown transition "${kw.with}" (use ${TRANSITIONS.join(', ')})`);
      return { pos, kw };
    }

    function parsePosition(L, v) {
      if (v === undefined) return null;
      if (v in POSITIONS) return POSITIONS[v];
      const n = parseFloat(v);
      if (!isNaN(n)) return n;
      err(L, `Unknown position "${v}" (use ${Object.keys(POSITIONS).join(', ')} or a number 0-100)`);
      return null;
    }

    function compileBlock(i0, i1) {
      const ifStack = [];
      let i = i0;
      while (i < i1) {
        const L = lines[i];
        const text = L.text;
        const cmd = text.split(/\s+/)[0];

        try {
          // ---- block structures -------------------------------------------------
          if (cmd === 'menu') {
            let j = i + 1;
            while (j < i1 && lines[j].indent > L.indent) j++;
            compileMenu(L, i + 1, j);
            i = j;
            continue;
          }
          if (cmd === 'poemwords') {
            let j = i + 1;
            while (j < i1 && lines[j].text !== 'endpoemwords') {
              const tk = lines[j].text.split(/\s+/);
              const entry = { word: tk[0].replace(/_/g, ' '), scores: {} };
              for (const p of tk.slice(1)) {
                const [k, v] = p.split('=');
                if (!story.characters[k]) err(lines[j], `Unknown character "${k}" in poemwords`);
                entry.scores[k] = parseFloat(v) || 0;
              }
              story.poemWords.push(entry);
              j++;
            }
            if (j >= i1) err(L, 'poemwords block is missing "endpoemwords"');
            i = j + 1;
            continue;
          }

          if (cmd === 'if') {
            const m = text.match(/^if\s+(.+?)\s*->\s*([A-Za-z_]\w*)$/);
            if (m) {
              emit(L, { op: 'jumpIf', cond: expr(L, m[1]), label: m[2] });
            } else {
              const cond = text.replace(/^if\s+/, '').replace(/:$/, '');
              const ins = emit(L, { op: 'jumpIfNot', cond: expr(L, cond), target: null });
              ifStack.push({ line: L, pending: ins, ends: [] });
            }
            i++;
            continue;
          }
          if (cmd === 'elif' || cmd === 'else' || cmd === 'endif') {
            const f = ifStack[ifStack.length - 1];
            if (!f) { err(L, `"${cmd}" without a matching "if"`); i++; continue; }
            if (cmd === 'endif') {
              if (f.pending) f.pending.target = program.length;
              f.ends.forEach((j) => (j.target = program.length));
              ifStack.pop();
            } else {
              if (!f.pending) { err(L, `"${cmd}" after "else"`); i++; continue; }
              f.ends.push(emit(L, { op: 'jump', target: null }));
              f.pending.target = program.length;
              f.pending = null;
              if (cmd === 'elif') {
                const cond = text.replace(/^elif\s+/, '').replace(/:$/, '');
                f.pending = emit(L, { op: 'jumpIfNot', cond: expr(L, cond), target: null });
              }
            }
            i++;
            continue;
          }

          if (cmd === 'set' || cmd === '$') {
            const a = assignment(L, text.replace(/^(set|\$)\s+/, ''));
            if (a) emit(L, { op: 'set', ...a });
            i++;
            continue;
          }

          compileSimple(L);
        } catch (e) {
          err(L, e.message);
        }
        i++;
      }
      for (const f of ifStack) err(f.line, '"if" block is missing "endif"');
    }

    const TONES = ['tender', 'warm', 'honest', 'cold', 'duty', 'obsession', 'danger', 'curious', 'quiet', 'neutral'];

    function compileMenu(L, j0, j1) {
      const tk = tokenizeLine(L.text);
      const prompt = tk[1] && tk[1].t === 'str' ? tk[1].v : null;
      // menu time 8 → this choice waits 8 seconds; menu notime → no timer for this one
      const tm0 = L.text.match(/\btime\s+(\d+(?:\.\d+)?)\s*$/);
      const time = /\bnotime\s*$/.test(L.text) ? 0 : tm0 ? parseFloat(tm0[1]) : null;
      const menu = emit(L, { op: 'menu', prompt, time, options: [], hesitate: null, end: null, key: `${currentLabel}:menu${sayCount++}` });
      const ends = [];
      let k = j0;
      while (k < j1) {
        const O = lines[k];
        let e = k + 1;
        while (e < j1 && lines[e].indent > O.indent) e++;
        // "- hesitate": what happens when the player lets the time run out
        const hm = O.text.match(/^-\s*hesitate\b\s*(.*)$/);
        const m = hm ? [null, '', hm[1]] : O.text.match(/^-\s*"((?:[^"\\]|\\.)*)"\s*(.*)$/);
        if (!m) {
          err(O, 'Menu options look like:  - "Choice text" tone=tender -> label [trust += 1]');
          k = e;
          continue;
        }
        const opt = { text: m[1].replace(/\\(.)/g, (_, c) => (c === 'n' ? '\n' : c)), cond: null, effects: [], target: null, label: null, tone: null, cost: null, needs: null, gain: null };
        let rest = m[2].trim();
        // tone=tender  cost=francs:40  cost=item:watch  needs=item:note  gain=item:glove
        rest = rest.replace(/(?:^|\s)(tone|cost|needs|gain)=(\S+)/g, (_, key, val) => {
          if (key === 'tone' && !TONES.includes(val)) err(O, `Unknown tone "${val}" (use ${TONES.join(', ')})`);
          opt[key] = val;
          return ' ';
        }).trim();
        const ifm = rest.match(/(?:^|\s)if\s+(.+)$/);
        if (ifm) { opt.cond = expr(O, ifm[1]); rest = rest.slice(0, ifm.index).trim(); }
        const em = rest.match(/\[(.*)\]/);
        if (em) {
          opt.effects = splitList(em[1]).map((s) => assignment(O, s)).filter(Boolean);
          rest = (rest.slice(0, em.index) + rest.slice(em.index + em[0].length)).trim();
        }
        const tm = rest.match(/^->\s*([A-Za-z_]\w*)$/);
        if (tm) { opt.label = tm[1]; rest = ''; }
        if (rest) err(O, `Don't understand "${rest}" in this menu option`);

        if (e > k + 1) {
          opt.target = program.length;
          compileBlock(k + 1, e);
          if (opt.label) { emit(O, { op: 'jump', label: opt.label }); opt.label = null; }
          else ends.push(emit(O, { op: 'jump', target: null }));
        } else if (!opt.label) {
          opt.target = 'END';
        }
        if (hm) { if (menu.hesitate) err(O, 'A menu can only have one "- hesitate"'); menu.hesitate = opt; } else menu.options.push(opt);
        k = e;
      }
      if (!menu.options.length) err(L, 'menu has no options');
      menu.end = program.length;
      ends.forEach((j) => (j.target = program.length));
      menu.options.forEach((o) => { if (o.target === 'END') o.target = program.length; });
      if (menu.hesitate && menu.hesitate.target === 'END') menu.hesitate.target = program.length;
    }

    function compileSimple(L) {
      const tk = tokenizeLine(L.text);
      const w0 = tk[0];

      // "Narration."
      if (w0.t === 'str') {
        if (tk.length > 1) throw new Error('Unexpected text after the quoted line');
        emit(L, { op: 'say', who: null, text: w0.v, key: `${currentLabel}:${sayCount++}` });
        return;
      }
      const cmd = w0.v;

      // character [expression] "Dialogue."
      if (story.characters[cmd]) {
        const strIdx = tk.findIndex((t) => t.t === 'str');
        if (strIdx < 0) throw new Error(`${cmd}: dialogue needs quoted text`);
        if (strIdx > 2 || tk.length > strIdx + 1) throw new Error(`Write dialogue as: ${cmd} [expression] "text"`);
        emit(L, { op: 'say', who: cmd, expr: strIdx === 2 ? tk[1].v : null, text: tk[strIdx].v, key: `${currentLabel}:${sayCount++}` });
        return;
      }

      const need = (n, usage) => { if (tk.length < n) throw new Error(`Usage: ${usage}`); };
      const str = (t, usage) => { if (!t || t.t !== 'str') throw new Error(`Usage: ${usage}`); return t.v; };

      switch (cmd) {
        // ---- definitions (no instruction emitted) ----
        case 'character': return;
        case 'title':
          story.title = str(tk[1], 'title "Game Title" ["Subtitle"]');
          if (tk[2]) story.subtitle = tk[2].v;
          return;
        case 'warning': story.warning = str(tk[1], 'warning "Text shown once before the title screen"'); return;
        case 'credits': story.credits = str(tk[1], 'credits "Made by ..."'); return;
        case 'emblem': story.emblem = str(tk[1], 'emblem "絹"'); return;
        case 'karma': {
          const usage = 'karma variable color=#f4a7b9 [heavy=up|down] up="Line when it rises." [down="Line when it falls."]';
          if (!tk[1] || tk[1].t !== 'word' || !IDENT_RE.test(tk[1].v)) throw new Error(`Usage: ${usage}`);
          const k = { name: tk[1].v, color: '#f4c542', heavy: null, up: '', down: '' };
          for (let i = 2; i < tk.length; i++) {
            const t = tk[i];
            let key, val;
            if (t.t === 'word' && t.v.endsWith('=') && tk[i + 1] && tk[i + 1].t === 'str') { key = t.v.slice(0, -1); val = tk[++i].v; }
            else if (t.t === 'word' && t.v.includes('=')) [key, val] = t.v.split('=');
            else throw new Error(`Usage: ${usage}`);
            if (key === 'color') k.color = val;
            else if (key === 'heavy' && (val === 'up' || val === 'down')) k.heavy = val;
            else if (key === 'up' || key === 'down') k[key] = val;
            else throw new Error(`Unknown karma option "${key}". ${usage}`);
          }
          if (!story.karma.find((x) => x.name === k.name)) story.karma.push(k);
          return;
        }
        case 'titlefx': {
          const fx = { preset: tk[1] ? tk[1].v : 'autumn' };
          for (const t of tk.slice(2)) {
            const [k, v] = t.v.split('=');
            const nums = v ? v.split(',').map(Number) : [];
            if (!['sun', 'rays', 'sway', 'pivot'].includes(k) || !nums.length || nums.some(isNaN)) {
              throw new Error('Usage: titlefx autumn|spring|summer|ginkgo|sakura|maple|none [sun=x,y] [rays=x,y] [sway=cx,cy,rx,ry] [pivot=x,y]');
            }
            fx[k] = nums;
          }
          story.titleFx = fx.preset === 'none' ? null : fx;
          return;
        }
        case 'splash':
          // splash strand — the press-start screen is a glowing thread of silk that branches into light
          if (!tk[1] || !['strand', 'logo'].includes(tk[1].v)) throw new Error('Usage: splash strand|logo');
          story.splash = tk[1].v;
          return;
        case 'item': {
          // item watch "Pocket watch" "His father's; it has never lost a minute."
          need(3, 'item id "Name" ["Description"]');
          story.items[tk[1].v] = { id: tk[1].v, name: str(tk[2], 'item id "Name"'), desc: tk[3] ? tk[3].v : '' };
          return;
        }
        case 'gain':
        case 'lose': {
          // gain item watch / lose item watch / gain francs 40 / lose francs 40
          need(3, `${w0.v} item name | ${w0.v} francs amount`);
          if (tk[1].v === 'francs') emit(L, { op: 'francs', delta: (w0.v === 'gain' ? 1 : -1) * (parseInt(tk[2].v, 10) || 0) });
          else if (tk[1].v === 'item') emit(L, { op: 'item', id: tk[2].v, gain: w0.v === 'gain' });
          else throw new Error(`Usage: ${w0.v} item name | ${w0.v} francs amount`);
          return;
        }
        case 'routescore':
          // routescore helene_trust * 2 - obsession * 0.6 — where Hervé's heart is heading
          need(2, 'routescore expression');
          story.routeScore = L.text.replace(/^routescore\s+/, '');
          return;
        case 'routes':
          // routes -4 3 — at or below the first number the route is "lost", at or above the second "devoted"
          need(3, 'routes lostAtOrBelow devotedAtOrAbove');
          story.routeBounds = [parseFloat(tk[1].v), parseFloat(tk[2].v)];
          return;
        case 'pronounce':
          // pronounce "Hervé" "Air-vay" — how the narrator's voice should say a name
          need(3, 'pronounce "Word" "How to say it"');
          (story.pronounce = story.pronounce || []).push([str(tk[1], 'pronounce "Word" "Say it"'), str(tk[2], 'pronounce "Word" "Say it"')]);
          return;
        case 'choicetime':
          // choicetime 14 — how many seconds every choice waits before Hervé hesitates (0 = no timer)
          need(2, 'choicetime seconds');
          story.choiceTime = parseFloat(tk[1].v) || 0;
          return;
        case 'titlelogo':
          if (!tk[1] || !['brush', 'carved'].includes(tk[1].v)) throw new Error('Usage: titlelogo brush|carved');
          story.titleLogo = tk[1].v;
          return;
        case 'artstyle':
          if (!tk[1] || !['pixel', 'smooth', 'mixed'].includes(tk[1].v)) throw new Error('Usage: artstyle pixel|smooth|mixed');
          story.artStyle = tk[1].v;
          return;
        case 'titlemusic': need(2, 'titlemusic track_name'); story.titleMusic = tk[1].v; return;
        case 'titlebackground': need(2, 'titlebackground bg_name'); story.titleBackground = tk[1].v; return;
        case 'background': {
          need(3, 'background name "path/to/image.png"');
          story.backgrounds[tk[1].v] = str(tk[2], 'background name "path/to/image.png"');
          return;
        }
        case 'bgfx': {
          const usage = 'bgfx background effect[=numbers,#color] ... (see docs/SCRIPTING.md)';
          need(3, usage);
          const list = story.bgFx[tk[1].v] || (story.bgFx[tk[1].v] = []);
          for (const t of tk.slice(2)) {
            const [type, val] = t.v.split('=');
            if (!BG_FX.includes(type)) throw new Error(`Unknown background effect "${type}" (use ${BG_FX.join(', ')})`);
            const parts = val ? val.split(',') : [];
            const nums = parts.filter((p) => !p.startsWith('#')).map(Number);
            if (nums.some(isNaN)) throw new Error(`Usage: ${usage}`);
            list.push({ type, nums, color: parts.find((p) => p.startsWith('#')) || null });
          }
          return;
        }
        case 'bgsound':
          need(3, 'bgsound background ambience [volume]');
          story.bgSound[tk[1].v] = { name: tk[2].v, volume: tk[3] ? parseFloat(tk[3].v) || 1 : 1 };
          return;
        case 'bglight':
          // bglight background day|warm|fire|dusk|night|moon|grey|dim|ash (or any CSS filter)
          need(3, 'bglight background day|warm|fire|dusk|night|moon|grey|dim|ash');
          story.bgLight[tk[1].v] = tk.slice(2).map((t) => t.v).join(' ');
          return;
        case 'place':
          need(3, 'place background "Name of the place" ["Region"]');
          story.places[tk[1].v] = { name: str(tk[2], 'place background "Name of the place" ["Region"]'), region: tk[3] ? tk[3].v : '' };
          return;
        case 'endpoemwords': throw new Error('"endpoemwords" without "poemwords"');

        // ---- flow ----
        case 'label': {
          need(2, 'label name');
          const name = tk[1].v.replace(/:$/, '');
          if (!IDENT_RE.test(name)) throw new Error(`Bad label name "${name}"`);
          if (name in story.labels) throw new Error(`Label "${name}" is defined twice`);
          story.labels[name] = program.length;
          currentLabel = name;
          sayCount = 0;
          emit(L, { op: 'label', name });
          return;
        }
        case 'jump': need(2, 'jump label'); emit(L, { op: 'jump', label: tk[1].v }); return;
        case 'call': need(2, 'call label'); emit(L, { op: 'call', label: tk[1].v }); return;
        case 'return': emit(L, { op: 'return' }); return;
        case 'end': emit(L, { op: 'end' }); return;

        // ---- visuals ----
        case 'scene': {
          need(2, 'scene background [with fade]');
          const { pos, kw } = kwargs(tk, 1, ['with'], L);
          emit(L, { op: 'scene', bg: pos[0].v, with: kw.with || 'dissolve', duration: kw.duration });
          return;
        }
        case 'show': {
          need(2, 'show character [expression] [at left] [with dissolve]');
          const { pos, kw } = kwargs(tk, 1, ['at', 'with'], L);
          const id = pos[0].v;
          if (!story.characters[id]) story.warnings.push({ line: L.n, msg: `show: "${id}" is not a defined character` });
          emit(L, { op: 'show', id, expr: pos[1] ? pos[1].v : null, at: parsePosition(L, kw.at), with: kw.with || 'dissolve', duration: kw.duration });
          return;
        }
        case 'hide': {
          need(2, 'hide character [with dissolve]');
          const { pos, kw } = kwargs(tk, 1, ['with'], L);
          emit(L, { op: 'hide', id: pos[0].v, with: kw.with || 'dissolve', duration: kw.duration });
          return;
        }
        case 'cg': {
          need(2, 'cg image_name [with dissolve]   or   cg hide');
          const { pos, kw } = kwargs(tk, 1, ['with'], L);
          emit(L, { op: 'cg', name: pos[0].v === 'hide' ? null : pos[0].v, with: kw.with || 'dissolve', duration: kw.duration });
          return;
        }
        case 'tint': {
          need(2, 'tint night|sunset|dawn|#hex|none [opacity]');
          emit(L, { op: 'tint', color: tk[1].v, opacity: tk[2] ? parseFloat(tk[2].v) : null });
          return;
        }
        case 'filter': need(2, 'filter sepia|grayscale|faded|dream|none'); emit(L, { op: 'filter', value: tk[1].v }); return;
        case 'vignette': emit(L, { op: 'vignette', on: tk[1] ? tk[1].v !== 'off' : true }); return;
        case 'effect': {
          need(2, 'effect shake|flash|glitch|static|pulse [seconds] [color]');
          emit(L, { op: 'effect', kind: tk[1].v, duration: tk[2] ? parseFloat(tk[2].v) : null, color: tk[3] ? tk[3].v : null });
          return;
        }
        case 'window': emit(L, { op: 'window', show: tk[1] && tk[1].v === 'show' }); return;

        // ---- text ----
        case 'centered': emit(L, { op: 'say', who: null, centered: true, text: str(tk[1], 'centered "text"'), key: `${currentLabel}:${sayCount++}` }); return;
        case 'minigame': {
          // minigame tea [into tea_result] / minigame eggs dead into last_eggs
          need(2, 'minigame name [argument] [into variable]');
          const { pos, kw } = kwargs(tk, 2, ['into'], L);
          emit(L, { op: 'minigame', name: tk[1].v, arg: pos[0] ? pos[0].v : null, into: kw.into || `${tk[1].v}_result` });
          return;
        }
        case 'cutscene':
          // cutscene name — plays a cinematic sequence from story/cutscenes.js
          need(2, 'cutscene name');
          emit(L, { op: 'cutscene', name: tk[1].v });
          return;
        case 'chapter': {
          // chapter "Chapter 3" "The Cup" seal 杯 — the seal is a kanji or two stamped on the card
          const { pos, kw } = kwargs(tk, 2, ['seal', 'kanji'], L);
          emit(L, { op: 'chapter', title: str(tk[1], 'chapter "Chapter 1" ["Subtitle"] [seal 字]'), subtitle: pos[0] ? pos[0].v : '', seal: kw.seal || '', kanji: kw.kanji || '' });
          return;
        }
        case 'notify': emit(L, { op: 'notify', text: str(tk[1], 'notify "text"') }); return;
        case 'pause': emit(L, { op: 'pause', seconds: tk[1] ? parseFloat(tk[1].v) : null }); return;

        // ---- sound ----
        case 'play': {
          need(3, 'play music|sound name [fadein 2] [volume 0.8]');
          const { kw } = kwargs(tk, 3, ['fadein', 'volume', 'loop'], L);
          if (tk[1].v !== 'music' && tk[1].v !== 'sound' && tk[1].v !== 'ambience') throw new Error('play music|sound|ambience name');
          emit(L, { op: 'play', channel: tk[1].v, name: tk[2].v, fadein: kw.fadein ? parseFloat(kw.fadein) : 0, volume: kw.volume ? parseFloat(kw.volume) : 1 });
          return;
        }
        case 'stop': {
          need(2, 'stop music|sound|ambience [fadeout 2]');
          const { kw } = kwargs(tk, 2, ['fadeout'], L);
          emit(L, { op: 'stop', channel: tk[1].v, fadeout: kw.fadeout ? parseFloat(kw.fadeout) : 0 });
          return;
        }

        // ---- interaction ----
        case 'input': {
          need(3, 'input variable "Prompt" [default "Name"] [max 12]');
          const { kw } = kwargs(tk, 3, ['default', 'max'], L);
          emit(L, { op: 'input', name: tk[1].v, prompt: str(tk[2], 'input variable "Prompt"'), default: kw.default || '', max: parseInt(kw.max, 10) || 16 });
          return;
        }
        case 'poem': {
          const { kw } = kwargs(tk, 1, ['words', 'title'], L);
          emit(L, { op: 'poem', words: parseInt(kw.words, 10) || 20, title: kw.title || null });
          return;
        }
        case 'ending': {
          need(3, 'ending id "Ending Title" [good|bad|neutral|true]');
          const id = tk[1].v;
          const title = str(tk[2], 'ending id "Ending Title"');
          const kind = tk[3] ? tk[3].v : 'neutral';
          if (!story.endings.find((e) => e.id === id)) story.endings.push({ id, title, kind });
          emit(L, { op: 'ending', id, title, kind });
          return;
        }
        case 'rollback': emit(L, { op: 'rollback', on: !tk[1] || tk[1].v !== 'off' }); return;
      }
      throw new Error(`Unknown command "${cmd}". Dialogue needs a defined character: character ${cmd} "Name"`);
    }

    compileBlock(0, lines.length);

    // Resolve label references.
    const resolve = (ins, name) => {
      if (!(name in story.labels)) { errors.push({ line: ins.line, msg: `Label "${name}" doesn't exist` }); return 0; }
      return story.labels[name];
    };
    for (const ins of program) {
      if ((ins.op === 'jump' || ins.op === 'call' || ins.op === 'jumpIf') && ins.label) ins.target = resolve(ins, ins.label);
      if (ins.op === 'menu') for (const o of [...ins.options, ins.hesitate].filter(Boolean)) if (o.label) o.target = resolve(ins, o.label);
    }
    if (!('start' in story.labels)) errors.push({ line: 0, msg: 'The script needs a "label start" where the game begins' });
    return story;
  }

  function hashString(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  }

  VN.parse = parse;
  VN.POSITIONS = POSITIONS;
  VN.hashString = hashString;
})();
