/*
 * flowchart.js — the map of choices. It is worked out from the story itself: every chapter,
 * every choice in it and every option, and where each option leads (on to the next chapter,
 * or to one of the endings). The player sees all the options; what an untried one leads to
 * stays "???" until some playthrough has taken it.
 */
(function () {
  'use strict';
  const VN = (globalThis.VN = globalThis.VN || {});
  const h = VN.h;

  /** Follow the story from pc until it reaches an ending or the next chapter. */
  function follow(program, pc) {
    const menus = [];
    const seen = new Set();
    let steps = 0;
    while (pc != null && pc < program.length && steps++ < 4000) {
      if (seen.has(pc)) break;
      seen.add(pc);
      const ins = program[pc];
      if (ins.op === 'ending') return { ending: ins.id, menus };
      if (ins.op === 'chapter') return { ending: null, menus };
      if (ins.op === 'end' || ins.op === 'return') break;
      if (ins.op === 'jump') { pc = ins.target; continue; }
      if (ins.op === 'menu') { menus.push(pc); pc = ins.end; continue; }
      pc++;
    }
    return { ending: null, menus };
  }

  /** The last line said before a choice: what the choice is answering. */
  function contextOf(program, pc) {
    for (let p = pc - 1; p >= 0 && p > pc - 40; p--) {
      const ins = program[p];
      if (ins.op === 'menu' || ins.op === 'chapter') break;
      if (ins.op === 'say' && ins.text) return VN.stripTags(ins.text);
    }
    return '';
  }

  /** Build the map once: chapters in order, each with its choices; endings hang off options. */
  function build(story) {
    const program = story.program;
    const chapters = [];
    let current = null;
    const optionInfo = (menu, o, index) => {
      const res = follow(program, o.target);
      return { index, text: o.text, tone: o.tone, ending: res.ending, branchMenus: res.menus };
    };
    const menus = new Map();
    for (let pc = 0; pc < program.length; pc++) {
      const ins = program[pc];
      if (ins.op === 'chapter') {
        current = { title: ins.title, subtitle: ins.subtitle || '', seal: ins.seal || '', choices: [] };
        chapters.push(current);
      } else if (ins.op === 'menu') {
        const options = ins.options.map((o, i) => optionInfo(ins, o, i));
        if (ins.hesitate) options.push({ ...optionInfo(ins, ins.hesitate, 'h'), text: '(let the moment pass)', hesitate: true });
        menus.set(pc, { key: ins.key, pc, context: contextOf(program, pc), options, chapter: current });
      }
    }
    // choices that only happen on the road to an ending belong to that ending's branch
    const inBranch = new Set();
    for (const m of menus.values()) for (const o of m.options) if (o.ending) for (const b of o.branchMenus) inBranch.add(b);
    for (const m of menus.values()) {
      if (inBranch.has(m.pc) || !m.chapter) continue;
      m.chapter.choices.push(m);
    }
    for (const m of menus.values()) for (const o of m.options) o.branch = o.ending ? o.branchMenus.filter((b) => inBranch.has(b)).map((b) => menus.get(b)).filter(Boolean) : [];
    return { chapters, endings: story.endings };
  }

  /** The flowchart, drawn into a container. */
  function render(ui, body, { inGame }) {
    const eng = ui.engine;
    const flow = ui.flow || (ui.flow = build(ui.story));
    const tried = eng.persistent.flow || {};
    const reached = eng.persistent.chapters || {};
    const picks = inGame ? eng.state.picks || {} : {};
    const foundEndings = eng.persistent.endings || {};
    const hereTitle = inGame ? (eng.state.chapter || '').split(' · ')[0] : null;
    const endingOf = (id) => flow.endings.find((e) => e.id === id);

    const optionPill = (m, o) => {
      const mine = picks[m.key] === o.index;
      const known = (tried[m.key] || []).includes(o.index) || mine;
      const cls = `.fc-opt${mine ? '.mine' : known ? '.known' : '.unknown'}${o.hesitate ? '.hes' : ''}${o.tone ? `.tone-${o.tone}` : ''}`;
      let outcome;
      if (!known) outcome = h('span.fc-out.q', '???');
      else if (o.ending) {
        const e = endingOf(o.ending);
        const found = e && foundEndings[e.id];
        const [jp] = e ? e.title.split(/\s+—\s+/) : ['?'];
        outcome = h(`span.fc-out.end${found ? '.found' : ''}`, h('i.fc-mini-seal', found ? e.kanji || '終' : '？'), found ? `Ending: ${jp}` : 'An ending');
      } else outcome = h('span.fc-out', 'the story goes on');
      return h(`div${cls}`,
        h('span.fc-knot'),
        h('span.fc-text', o.text.replace(/^[“"]|[”"]$/g, '')),
        outcome,
        o.ending && known && o.branch.length ? h('div.fc-branch', o.branch.map((bm) => choiceRow(bm, true))) : null);
    };
    const choiceRow = (m, nested = false) => h(`div.fc-choice${nested ? '.nested' : ''}`,
      m.context ? h('div.fc-context', `“${m.context.length > 90 ? `${m.context.slice(0, 88)}…` : m.context}”`) : null,
      h('div.fc-opts', m.options.map((o) => optionPill(m, o))));

    const nodes = flow.chapters.map((c, i) => {
      const was = reached[c.title] || (hereTitle && hereTitle === c.title);
      const here = hereTitle === c.title;
      return h(`section.fc-chapter${was ? '.reached' : '.unreached'}${here ? '.here' : ''}`,
        h('div.fc-head',
          h('span.fc-seal', c.seal || '章'),
          h('div.fc-names', h('span.fc-num', c.title.toUpperCase()), h('b', c.subtitle || c.title)),
          here ? h('span.fc-here', 'YOU ARE HERE') : null),
        c.choices.length ? h('div.fc-choices', c.choices.map((m) => choiceRow(m))) : null);
    });
    const endingsRow = h('section.fc-endings',
      h('div.fc-endings-title', 'THE SIX ENDINGS'),
      h('div.fc-endings-grid', flow.endings.map((e) => {
        const got = foundEndings[e.id];
        const [jp, en] = e.title.split(/\s+—\s+/);
        return h(`div.fc-ending${got ? '.got' : ''}`,
          h('span.fc-seal', got ? e.kanji || '終' : '？'),
          h('div.fc-names', h('b', got ? jp : '? ? ?'), h('span', got ? en || '' : e.hint || '')));
      })));
    const legend = h('div.fc-legend',
      h('span.lg.mine', 'this journey'), h('span.lg.known', 'taken before'), h('span.lg.unknown', 'not yet taken'));
    body.replaceChildren(h('div.flowchart', legend, h('div.fc-thread'), ...nodes, endingsRow));
    const here = body.querySelector('.fc-chapter.here');
    if (here) setTimeout(() => here.scrollIntoView({ block: 'center' }), 60);
  }

  VN.Flow = { build, render, follow };
})();
