/*
 * minigames.js — short, simple games woven into the story.
 *
 *   minigame tea into tea_result      the script waits for the game, then stores its result
 *
 *   tea      Chapter 3: watch her serve the tea, then repeat her movements in order
 *   eggs     Chapter 4: sort the sick eggs from the healthy before the thread burns out
 *   patience Chapter 6: choose your words while Hara Kei's fan tells you how he takes them
 *   bargain  Chapter 5: stop the brush on a fair price while Hara Kei weighs you
 *   hide     Chapter 11: run from wall to wall while the soldier's lantern looks away
 *   letter   Final chapter: put the torn letter back together, strip by strip
 *
 * Each game resolves to a word the script can test ("win", "lose", "good"...). None of
 * them can stop the story: the ones that can be failed offer another try, or let the
 * moment pass (and the story remembers how it went).
 */
(function () {
  'use strict';
  const VN = globalThis.VN;
  const h = VN.h;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ---------------------------------------------------------------- the frame every game sits in
  class Shell {
    constructor(ui, { title, kanji, hint }) {
      this.ui = ui;
      this.audio = ui.audio;
      this.reduce = !!ui.settings.reduceMotion;
      this.area = h('div.mg-area');
      this.msg = h('div.mg-msg', hint || '');
      this.buttons = h('div.mg-buttons');
      this.el = h('div.overlay.minigame',
        h('div.mg-wash'),
        h('div.mg-panel',
          h('div.mg-head', kanji ? h('span.mg-kanji', kanji) : null, h('div.mg-title', title)),
          this.area,
          this.msg,
          this.buttons));
      this.keys = null;
      this.entry = ui.open(this.el, { onKey: (e) => (this.keys ? this.keys(e) : false) || true, onBack: () => {}, focus: false });
      this.entry.removeAfter = 600;
    }

    say(text, cls = '') { this.msg.className = `mg-msg ${cls}`; this.msg.textContent = text; }

    /** Offer buttons and wait for one: choose([['Try again', 'retry'], ['Let it pass', 'pass']]) */
    choose(list) {
      return new Promise((resolve) => {
        this.buttons.replaceChildren(...list.map(([label, value], i) => {
          const b = this.ui.button(label, () => { this.buttons.replaceChildren(); resolve(value); }, i === 0 ? '.mg-btn.primary' : '.mg-btn');
          return b;
        }));
        setTimeout(() => { const b = this.buttons.querySelector('button'); if (b) b.focus({ preventScroll: true }); }, 30);
      });
    }

    close() { this.ui.close(this.entry); }
  }

  /** A silk-thread timer like the choices': resolves true when it runs out, unless stopped. */
  function thread(parent, seconds, ui) {
    const el = h('div.choice-timer.mg-timer', h('span.ct-thread'), h('span.ct-ember.l'), h('span.ct-ember.r'));
    parent.prepend(el);
    let left = seconds, last = performance.now(), raf = 0, done = false, beat = false;
    const p = new Promise((resolve) => {
      const tick = (now) => {
        if (done) return;
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        if (!document.hidden) left -= dt;
        const k = Math.max(0, left / seconds);
        el.style.setProperty('--p', k.toFixed(4));
        if (!beat && k < 0.3) { beat = true; el.classList.add('urgent'); ui.audio.fx('heartbeat', { volume: 0.35 }); }
        if (left <= 0) { done = true; resolve(true); return; }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    p.stop = () => { done = true; cancelAnimationFrame(raf); el.classList.add('stopped'); };
    return p;
  }

  // ---------------------------------------------------------------- the tea ceremony
  const TEA = [
    { id: 'cloth', name: 'Wipe the scoop', icon: '<path d="M4 16c4-2 8-2 16 0v3c-8-2-12-2-16 0z" fill="#b8323a"/><path d="M5 12l14-6 1.5 2-14 6z" fill="#c8a060"/>' },
    { id: 'scoop', name: 'Scoop the tea', icon: '<path d="M3 15c3 0 5-1 7-3l10-6 1 1.5-10 6.5c-2 1.4-4 2.5-7 2.5z" fill="#c8a060"/><circle cx="6" cy="15" r="2.6" fill="#6a9a3a"/>' },
    { id: 'water', name: 'Pour the water', icon: '<path d="M4 6h9l-1 3H5z" fill="#8a6a4a"/><rect x="12" y="6" width="9" height="2" rx="1" fill="#8a6a4a"/><path d="M8 10c0 3-2 4-2 6a2 2 0 0 0 4 0c0-2-2-3-2-6z" fill="#8ac0e8"/>' },
    { id: 'whisk', name: 'Whisk it', icon: '<rect x="10.5" y="3" width="3" height="8" rx="1" fill="#d8c090"/><path d="M7 11h10l-2 9H9z" fill="#e8d8a8"/><g stroke="#b89a60" stroke-width="0.8">' + [8.5, 10, 11.5, 13, 14.5].map((x) => `<line x1="${x}" y1="11" x2="${x + (x - 12) * 0.2}" y2="19.5"/>`).join('') + '</g>' },
    { id: 'turn', name: 'Turn the bowl', icon: '<path d="M4 11h16c0 5-3.5 8-8 8s-8-3-8-8z" fill="#3a3a4a"/><path d="M5 11h14" stroke="#6a9a3a" stroke-width="2"/><path d="M19 6a5 5 0 0 0-8-1" stroke="#fff4dc" stroke-width="1.4" fill="none"/><path d="M10 3l1 2.5L13.5 5" fill="none" stroke="#fff4dc" stroke-width="1.4"/>' },
    { id: 'offer', name: 'Offer it with both hands', icon: '<path d="M4 12h16c0 4-3.5 6.5-8 6.5S4 16 4 12z" fill="#3a3a4a"/><path d="M2 17c3 3 6 3 10 3s7 0 10-3" stroke="#f2d6c4" stroke-width="2.4" fill="none" stroke-linecap="round"/>' },
  ];
  const teaIcon = (t) => `<svg viewBox="0 0 24 24" aria-hidden="true">${t.icon}</svg>`;

  async function tea(ui) {
    const sh = new Shell(ui, { title: 'The Tea Ceremony', kanji: '茶', hint: 'Watch how she serves the tea.' });
    const steps = TEA.slice();
    const order = shuffle(steps.slice()).slice(0, 4);
    const notes = [74, 76, 79, 81, 83, 86];
    const tiles = steps.map((t) => {
      const b = h('button.mg-tile', { type: 'button', html: `${teaIcon(t)}<span>${t.name}</span>` });
      b.dataset.id = t.id;
      return b;
    });
    sh.area.append(h('div.mg-tea', tiles));
    const light = async (id, ms = 700) => {
      const b = tiles.find((t) => t.dataset.id === id);
      b.classList.add('lit');
      ui.audio.fx('chime', { volume: 0.3 });
      await wait(ms);
      b.classList.remove('lit');
      await wait(180);
    };
    let tries = 0;
    for (;;) {
      tiles.forEach((b) => { b.disabled = true; });
      sh.say(tries ? 'Watch again. Slowly, the way she does it.' : 'Watch how she serves the tea.');
      await wait(700);
      for (const t of order) await light(t.id, sh.reduce ? 900 : 750);
      sh.say('Now you. The same movements, in the same order.');
      tiles.forEach((b) => { b.disabled = false; });
      const ok = await new Promise((resolve) => {
        let k = 0;
        const onClick = (e) => {
          const b = e.currentTarget;
          if (b.dataset.id === order[k].id) {
            b.classList.add('done');
            ui.audio.fx('cup', { volume: 0.5 });
            k++;
            if (k === order.length) { tiles.forEach((t) => t.removeEventListener('click', onClick)); resolve(true); }
          } else {
            b.classList.add('wrong');
            setTimeout(() => b.classList.remove('wrong'), 450);
            ui.audio.ui('error');
            tiles.forEach((t) => t.removeEventListener('click', onClick));
            resolve(false);
          }
        };
        tiles.forEach((t) => t.addEventListener('click', onClick));
        sh.keys = (e) => { const n = parseInt(e.key, 10); if (n >= 1 && n <= tiles.length && !tiles[n - 1].disabled) { tiles[n - 1].click(); return true; } return false; };
      });
      tiles.forEach((b) => b.classList.remove('done'));
      if (ok) {
        sh.say('She lowers her eyes, just for a moment. It was done well.', 'good');
        ui.audio.fx('sparkle', { volume: 0.6 });
        await wait(1400);
        sh.close();
        return 'win';
      }
      tries++;
      sh.say('The bowl is not where it should be. Hara Kei watches your hands.', 'bad');
      const next = await sh.choose(tries < 3 ? [['Try again', 'retry'], ['Let it pass', 'pass']] : [['Let it pass', 'pass']]);
      if (next === 'pass') { sh.close(); return 'lose'; }
    }
  }

  // ---------------------------------------------------------------- sorting the eggs
  async function eggs(ui, arg) {
    const dead = arg === 'dead'; // Chapter 13: almost none of them will live
    const sh = new Shell(ui, { title: dead ? 'The Last Eggs' : 'Sorting the Eggs', kanji: '卵', hint: dead ? 'Find the eggs that are still alive.' : 'Pick out the grey, sick eggs before they spoil the rest.' });
    const n = 20;
    // how the eggs were kept on the way home (story/journeys.js): cared for, fewer have gone grey
    const care = Number(VN.engine && VN.engine.getVar('eggs_care')) || 0;
    const sickN = dead ? 17 : Math.max(3, Math.min(11, 6 - care * 2));
    const sick = new Set(shuffle([...Array(n).keys()]).slice(0, sickN));
    const card = h('div.mg-eggcard');
    const eggsEl = [...Array(n).keys()].map((i) => {
      const b = h(`button.mg-egg${sick.has(i) ? '.sick' : ''}`, { type: 'button', 'aria-label': 'egg', style: { '--r': `${(Math.random() * 40 - 20).toFixed(0)}deg` } });
      card.append(b);
      return b;
    });
    sh.area.append(card);
    if (!dead && care) sh.say(care > 0 ? 'The eggs travelled well. Only a few have gone grey.' : 'The road was hard on them. Many more have gone grey than should have.');
    if (dead) {
      // there is nothing to win here: only a handful left alive, found one by one
      sh.say('Tap each egg to hold it to the light.');
      let alive = 0, looked = 0;
      await new Promise((resolve) => {
        eggsEl.forEach((b, i) => b.addEventListener('click', () => {
          if (b.classList.contains('seen')) return;
          b.classList.add('seen');
          looked++;
          if (!sick.has(i)) { alive++; ui.audio.fx('chime', { volume: 0.4 }); } else ui.audio.fx('ink', { volume: 0.5 });
          if (looked >= 10) resolve();
        }));
      });
      sh.say(alive ? `${alive === 1 ? 'One was' : `${alive} were`} still alive. The rest had died on the way.` : 'Every one you held to the light was grey.', 'bad');
      await wait(2200);
      sh.close();
      return 'dead';
    }
    const timer = thread(sh.area, 16, ui);
    let mistakes = 0, found = 0;
    const result = await new Promise((resolve) => {
      eggsEl.forEach((b, i) => b.addEventListener('click', () => {
        if (b.classList.contains('gone') || b.classList.contains('cracked')) return;
        if (sick.has(i)) {
          b.classList.add('gone');
          found++;
          ui.audio.fx('paper', { volume: 0.4 });
          if (found === sick.size) resolve('done');
        } else {
          b.classList.add('cracked');
          mistakes++;
          ui.audio.ui('error');
        }
      }));
      timer.then(() => resolve('time'));
    });
    timer.stop();
    const good = result === 'done' && mistakes <= 1;
    sh.say(good ? 'The card is clean. These will live.' : result === 'done' ? 'You found them all, but crushed a few good ones.' : 'Some of the sick ones are still there.', good ? 'good' : 'bad');
    ui.audio.fx(good ? 'sparkle' : 'breath', { volume: 0.6 });
    await wait(1600);
    sh.close();
    return good ? 'win' : 'lose';
  }

  // ---------------------------------------------------------------- bargaining with Hara Kei
  // ---------------------------------------------------------------- Hara Kei's patience
  /**
   * Before the price: three things Hara Kei says, and three ways to answer each. No numbers; only
   * his fan, steady while he is content, slowing as his patience wears thin, and snapped shut when
   * it is gone. Resolves "calm", "tested" or "lost" (the bargain that follows is easier or harder).
   */
  async function patience(ui) {
    const sh = new Shell(ui, { title: 'Hara Kei\'s Patience', kanji: '忍', hint: 'Choose your words carefully. Watch his fan.' });
    const fan = h('div.mg-fan', h('i.mg-fan-leaf'), h('span.mg-fan-rivet'));
    const said = h('div.mg-said');
    sh.area.append(h('div.mg-duel', fan, said));
    let p = 3;
    const rounds = [
      { says: 'Last year you paid what I asked. This year the eggs are fewer, and the roads are worse.', options: [
        ['“The eggs are worth what they were last year.”', 0],
        ['“Everyone knows your roads are safe. It is your price that isn\'t.”', -2],
        ['Say nothing, and bow.', 1],
      ] },
      { says: 'You came back sooner than I expected, Monsieur Joncour. Men who come back quickly want something.', options: [
        ['“I want eggs.”', 0],
        ['“I wanted to see your house again.”', -1, { danger: 1, fascination: 1 }],
        ['“What any merchant wants: to be trusted.”', 1],
      ] },
      { says: 'Name your price.', options: [
        ['“You name it, and I will answer.”', 1],
        ['“Half of what you asked last year.”', -2],
        ['“The same as last year, and my word that I will come back.”', 0],
      ] },
    ];
    const show = () => {
      fan.style.setProperty('--fan', String(Math.max(0, Math.min(3, p - 1))));
      fan.classList.toggle('shut', p <= 0);
    };
    show();
    for (const r of rounds) {
      said.replaceChildren(h('div.mg-harakei', h('b', 'Hara Kei'), h('span', r.says)));
      const [, delta, add] = r.options[await sh.choose(r.options.map((o, i) => [o[0], i]))];
      p += delta;
      if (add && VN.engine) for (const [k, v] of Object.entries(add)) VN.engine.setVar(k, (Number(VN.engine.getVar(k)) || 0) + v);
      ui.audio.fx(delta > 0 ? 'chime' : delta < 0 ? 'fan_snap' : 'paper', { volume: 0.5 });
      show();
      await wait(700);
      if (p <= 0) break;
    }
    const how = p >= 5 ? 'calm' : p > 0 ? 'tested' : 'lost';
    sh.say({ calm: 'His fan moves slowly, evenly. He is ready to deal.', tested: 'His fan has slowed. He will deal, but he will not be generous.', lost: 'The fan snaps shut. The next words will cost you.' }[how], how === 'lost' ? 'bad' : how === 'calm' ? 'good' : '');
    await wait(1800);
    sh.close();
    return how;
  }

  async function bargain(ui) {
    const sh = new Shell(ui, { title: 'The Price of the Eggs', kanji: '値', hint: 'Stop the brush on a fair price. Too low insults him; too high wastes the town\'s money.' });
    const bar = h('div.mg-scale', h('span.zone.insult', 'insult'), h('span.zone.fair', 'fair'), h('span.zone.generous', 'too generous'), h('span.mg-needle'));
    const rounds = h('div.mg-rounds');
    sh.area.append(bar, rounds);
    const needle = bar.querySelector('.mg-needle');
    const results = [];
    const mood = VN.engine ? VN.engine.getVar('patience') : null;
    const w = mood === 'calm' ? 0.03 : mood === 'lost' ? -0.03 : 0;
    const bands = [[0.36 - w, 0.64 + w], [0.4 - w, 0.6 + w], [0.43 - w, 0.57 + w]]; // the fair band narrows each round
    for (let r = 0; r < 3; r++) {
      const [lo, hi] = bands[r];
      bar.style.setProperty('--lo', lo);
      bar.style.setProperty('--hi', hi);
      sh.say(['Hara Kei names a price. You answer.', 'He waits. Another offer.', 'Last offer. He is losing patience.'][r]);
      const speed = [0.55, 0.75, 0.95][r] * (sh.reduce ? 0.7 : 1) * (mood === 'lost' ? 1.2 : 1);
      const t0 = performance.now();
      let x = 0, raf = 0;
      const pos = await new Promise((resolve) => {
        const tick = (now) => {
          const t = (now - t0) / 1000;
          x = 0.5 + 0.5 * Math.sin(t * Math.PI * speed * 1.6 - Math.PI / 2 + r);
          needle.style.left = `${x * 100}%`;
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        const stop = () => { cancelAnimationFrame(raf); resolve(x); };
        const btn = ui.button('Offer', stop, '.mg-btn.primary');
        sh.buttons.replaceChildren(btn);
        setTimeout(() => btn.focus({ preventScroll: true }), 30);
        sh.keys = (e) => { if (e.key === ' ' || e.key === 'Enter') { stop(); return true; } return false; };
      });
      sh.buttons.replaceChildren();
      sh.keys = null;
      const zone = pos < lo ? 'insult' : pos > hi ? 'generous' : 'fair';
      results.push(zone);
      rounds.append(h(`span.mg-round.${zone}`, zone === 'fair' ? '◯' : zone === 'insult' ? '✕' : '△'));
      ui.audio.fx(zone === 'fair' ? 'cup' : zone === 'insult' ? 'knock' : 'paper', { volume: 0.6 });
      sh.say({ fair: 'He nods, almost imperceptibly.', insult: 'His face does not move. The room grows colder.', generous: 'He accepts at once. Too quickly.' }[zone], zone === 'fair' ? 'good' : 'bad');
      await wait(1300);
    }
    const fair = results.filter((z) => z === 'fair').length;
    const insults = results.filter((z) => z === 'insult').length;
    const outcome = insults >= 2 ? 'insult' : fair >= 2 ? 'good' : fair === 1 ? 'fair' : 'poor';
    sh.say({ good: 'A good price, and his respect with it.', fair: 'A fair price. No more, no less.', poor: 'You paid too much, and he knows it.', insult: 'You have the eggs. You do not have his goodwill.' }[outcome], outcome === 'good' || outcome === 'fair' ? 'good' : 'bad');
    await wait(1800);
    sh.close();
    return outcome;
  }

  // ---------------------------------------------------------------- hiding from the soldiers
  async function hide(ui) {
    const sh = new Shell(ui, { title: 'Soldiers on the Road', kanji: '隠', hint: 'Run for the next wall when the lantern looks away.' });
    const COVERS = [0.08, 0.32, 0.56, 0.8, 0.97];
    const field = h('div.mg-field');
    const walls = COVERS.slice(0, 4).map((x) => h('span.mg-wall', { style: { left: `${x * 100}%` } }));
    const forest = h('span.mg-forest');
    const beam = h('span.mg-beam');
    const soldier = h('span.mg-soldier');
    const herve = h('span.mg-herve', { style: { left: `${COVERS[0] * 100}%` } });
    field.append(forest, ...walls, beam, soldier, herve);
    sh.area.append(field);
    let at = 0, running = false, caught = false, raf = 0;
    const t0 = performance.now();
    let beamX = 0.5;
    const period = sh.reduce ? 5.2 : 4.2;
    const tick = (now) => {
      const t = (now - t0) / 1000;
      beamX = 0.5 + 0.46 * Math.sin((t / period) * Math.PI * 2);
      beam.style.left = `${beamX * 100}%`;
      // in the open, inside the beam: seen
      if (running && Math.abs(beamX - parseFloat(herve.dataset.x || COVERS[at])) < 0.1) caught = true;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const run = () => new Promise((resolve) => {
      running = true;
      caught = false;
      const from = COVERS[at], to = COVERS[at + 1];
      herve.classList.add('running');
      ui.audio.fx('wind_gust', { volume: 0.25 });
      const s0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - s0) / 650);
        const x = from + (to - from) * k;
        herve.dataset.x = x;
        herve.style.left = `${x * 100}%`;
        if (caught) { running = false; herve.classList.remove('running'); resolve(false); return; }
        if (k < 1) requestAnimationFrame(step);
        else { running = false; herve.classList.remove('running'); at++; resolve(true); }
      };
      requestAnimationFrame(step);
    });
    sh.say('The lantern sweeps the road. Wait for it to turn away.');
    let result = 'safe';
    while (at < COVERS.length - 1) {
      const go = await new Promise((resolve) => {
        const btn = ui.button(at === COVERS.length - 2 ? 'Run for the trees' : 'Run', () => resolve(true), '.mg-btn.primary');
        sh.buttons.replaceChildren(btn);
        setTimeout(() => btn.focus({ preventScroll: true }), 30);
        sh.keys = (e) => { if (e.key === ' ' || e.key === 'Enter') { resolve(true); return true; } return false; };
      });
      sh.buttons.replaceChildren();
      sh.keys = null;
      if (!go) break;
      const ok = await run();
      if (!ok) {
        result = 'caught';
        field.classList.add('caught');
        ui.audio.fx('heartbeat', { volume: 0.8 });
        sh.say('"Tomare!" The lantern is on your face.', 'bad');
        await wait(1800);
        break;
      }
      ui.audio.fx('breath', { volume: 0.4 });
      sh.say(at === COVERS.length - 1 ? 'The trees close around you. They did not see.' : 'Behind the wall. Breathe.', at === COVERS.length - 1 ? 'good' : '');
    }
    cancelAnimationFrame(raf);
    await wait(result === 'safe' ? 1400 : 200);
    sh.close();
    return result;
  }

  // ---------------------------------------------------------------- mending the torn letter
  // Four torn strips, and four places on the page that still show a faint trace of the ink that
  // belongs there. Pick a strip, then the place it fits; a strip that fits stays and glows.
  const LETTER = [
    ['世界を渡った', 'you crossed the world'],
    ['私を見るため', 'to look at me'],
    ['美しい物語で', 'let me be a lovely story'],
    ['隣の人を見て', 'look at the one beside you'],
  ];

  async function letter(ui) {
    const sh = new Shell(ui, { title: 'The Torn Letter', kanji: '文', hint: 'Pick a strip, then the place on the page whose faint trace it matches. Japanese is read from the right.' });
    const paper = h('div.mg-letter.slots');
    const tray = h('div.mg-tray');
    // the page: the first column is on the right, as Japanese is read
    const slots = LETTER.map(([text], i) => {
      const b = h('button.mg-slot', { type: 'button', 'aria-label': `Place ${i + 1}` }, h('span.mg-ghost', text));
      b.dataset.i = i;
      return b;
    });
    paper.append(...slots); // the page is laid out right to left
    let order = shuffle(LETTER.map((_, i) => i));
    while (order.every((v, k) => v === k)) order = shuffle(order);
    const strips = order.map((i) => {
      const b = h('button.mg-strip', { type: 'button', style: { '--tear': `${(i * 37) % 11}` } }, h('span', LETTER[i][0]), h('small', LETTER[i][1]));
      b.dataset.i = i;
      return b;
    });
    tray.append(...strips);
    sh.area.append(h('div.mg-mend', tray, h('div.mg-arrow', { 'aria-hidden': 'true' }, '→'), paper));
    let held = null;
    let misses = 0;
    let placed = 0;
    const hint = () => {
      // after a few misses, the next strip to place starts to glow, and so does its place
      const next = LETTER.findIndex((_, i) => !slots[i].classList.contains('filled'));
      if (next < 0) return;
      strips.find((b) => +b.dataset.i === next).classList.add('hinted');
      slots[next].classList.add('hinted');
    };
    await new Promise((resolve) => {
      const pickStrip = (b) => {
        if (b.classList.contains('placed')) return;
        if (held) held.classList.remove('held');
        held = held === b ? null : b;
        if (held) { held.classList.add('held'); ui.audio.fx('paper', { volume: 0.4 }); }
      };
      const tryPlace = (slot) => {
        if (!held || slot.classList.contains('filled')) return;
        if (+held.dataset.i === +slot.dataset.i) {
          slot.classList.add('filled');
          slot.classList.remove('hinted');
          slot.replaceChildren(h('span.mg-ink', LETTER[+slot.dataset.i][0]));
          held.classList.remove('held', 'hinted');
          held.classList.add('placed');
          held = null;
          placed++;
          ui.audio.fx('paper', { volume: 0.55 });
          ui.audio.fx('chime', { volume: 0.35 });
          if (placed === LETTER.length) resolve();
        } else {
          misses++;
          const b = held;
          // the strip slips back to the table
          held = null;
          b.classList.remove('held', 'shake');
          void b.offsetWidth;
          b.classList.add('shake');
          slot.classList.add('nope');
          setTimeout(() => slot.classList.remove('nope'), 400);
          ui.audio.fx('paper', { volume: 0.25 });
          if (misses === 1) sh.say('That strip belongs somewhere else. Look at the shapes of the faint ink.');
          if (misses >= 3) hint();
        }
      };
      sh.area.addEventListener('click', (e) => {
        const strip = e.target.closest('.mg-strip');
        if (strip) { pickStrip(strip); return; }
        const slot = e.target.closest('.mg-slot');
        if (slot) {
          // clicking a place first also works: take the matching strip if one is held, else wait for one
          if (held) tryPlace(slot);
          else sh.say('Pick a strip first, then its place on the page.');
        }
      });
    });
    paper.classList.add('whole');
    tray.classList.add('empty');
    ui.audio.fx('sparkle', { volume: 0.7 });
    sh.say(`The seams meet, and the ink runs on unbroken: “${LETTER.map((l) => l[1]).join(' … ')}.”`, 'good');
    await wait(2600);
    sh.close();
    return 'win';
  }

  const GAMES = { tea, eggs, bargain, patience, hide, letter };

  /** Play a minigame; resolves to its result word. */
  VN.playMinigame = function (ui, name, arg) {
    const g = GAMES[name];
    return g ? g(ui, arg) : Promise.resolve('none');
  };
  VN.MINIGAMES = Object.keys(GAMES);
})();
