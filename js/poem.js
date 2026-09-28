/*
 * poem.js — the word-picking minigame (Doki Doki Literature Club's poem game).
 *
 * The script defines a word bank in a `poemwords` block, where each word gives
 * points to one or more characters. The player picks words; the character who
 * likes a word most hops. When the page is full, the engine stores:
 *   poem_<id>     points each character earned this round
 *   poem_winner   id of the character with the most points
 *   poem_text     the words the player chose, in order
 */
(function () {
  'use strict';
  const VN = (globalThis.VN = globalThis.VN || {});
  const h = VN.h;

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  class PoemGame {
    constructor(ui, story, audio) {
      this.ui = ui;
      this.story = story;
      this.audio = audio;
      this.entry = null;
    }

    participants() {
      const ids = [];
      for (const w of this.story.poemWords) for (const id of Object.keys(w.scores)) if (!ids.includes(id)) ids.push(id);
      return ids;
    }

    makeChibi(id) {
      const ch = this.story.characters[id] || { name: id, color: '#ccc' };
      const el = h('div.chibi', { style: { '--c': ch.color } });
      const body = h('div.chibi-body', h('div.chibi-head', VN.plainName(ch.name).charAt(0)), h('div.chibi-torso'));
      el.append(body, h('div.chibi-name', VN.plainName(ch.name)));
      VN.assets.resolve('chibi', ch.chibi || id).then((url) => {
        if (url) body.replaceChildren(h('img.chibi-img', { src: url, alt: '' }));
      });
      return el;
    }

    run({ words = 20, title } = {}) {
      const bank = this.story.poemWords;
      if (!bank.length) return Promise.reject(new Error('The poem minigame needs a poemwords block in the script'));
      const ids = this.participants();
      const totals = Object.fromEntries(ids.map((id) => [id, 0]));
      const chosen = [];
      const perPage = Math.min(10, bank.length);

      return new Promise((resolve) => {
        const count = h('div.poem-count', `0 / ${words}`);
        const grid = h('div.poem-words');
        const written = h('div.poem-written');
        const chibis = {};
        const chibiRow = h('div.poem-chibis', ids.map((id) => (chibis[id] = this.makeChibi(id))));
        const paper = h('div.poem-paper',
          h('div.poem-head', h('h2', title || 'Write a poem'), count),
          h('p.poem-hint', 'Pick the words that feel right. Someone may like them.'),
          grid,
          written);
        const el = h('div.overlay.poem', chibiRow, paper);
        let busy = false;

        const draw = () => {
          const fresh = bank.filter((w) => !chosen.includes(w.word));
          const pool = shuffle((fresh.length >= perPage ? fresh : bank).slice()).slice(0, perPage);
          grid.replaceChildren(...pool.map((w, i) => {
            const b = h('button.poem-word', { type: 'button', style: { animationDelay: `${i * 25}ms` } }, h('span.poem-key', String((i + 1) % 10)), w.word);
            b.addEventListener('click', (e) => { e.stopPropagation(); pick(w); });
            b.addEventListener('mouseenter', () => b.focus({ preventScroll: true }));
            return b;
          }));
          const first = grid.querySelector('button');
          if (first && document.activeElement && grid.contains(document.activeElement) === false && el.contains(document.activeElement)) first.focus();
        };

        const pick = (w) => {
          if (busy) return;
          chosen.push(w.word);
          let best = 0;
          for (const [id, pts] of Object.entries(w.scores)) {
            totals[id] = (totals[id] || 0) + pts;
            best = Math.max(best, pts);
          }
          for (const [id, pts] of Object.entries(w.scores)) {
            if (pts === best && best > 0 && chibis[id]) {
              chibis[id].animate([
                { transform: 'translateY(0)' }, { transform: 'translateY(-26px)', offset: 0.35 },
                { transform: 'translateY(0)', offset: 0.6 }, { transform: 'translateY(-10px)', offset: 0.8 }, { transform: 'translateY(0)' },
              ], { duration: 520, easing: 'ease-out' });
            }
          }
          this.audio.ui('pick');
          count.textContent = `${chosen.length} / ${words}`;
          written.append(h('span', `${w.word} `));
          if (chosen.length >= words) {
            busy = true;
            grid.classList.add('done');
            paper.append(h('div.poem-finished', 'Finished.'));
            this.audio.ui('chime');
            setTimeout(() => {
              if (this.entry) { this.ui.close(this.entry); this.entry = null; }
              let winner = ids[0];
              for (const id of ids) if (totals[id] > totals[winner]) winner = id;
              resolve({ totals, winner, text: chosen.join(' ') });
            }, 1400);
          } else draw();
        };

        draw();
        this.entry = this.ui.open(el, {
          onBack: () => this.ui.openMenu('save'),
          onKey: (e) => {
            if (/^[0-9]$/.test(e.key)) {
              const n = e.key === '0' ? 9 : parseInt(e.key, 10) - 1;
              const b = grid.querySelectorAll('button')[n];
              if (b) b.click();
              return true;
            }
            return false;
          },
        });
      });
    }

    cancel() {
      if (this.entry) { this.ui.close(this.entry); this.entry = null; }
    }
  }

  VN.PoemGame = PoemGame;
})();
