/*
 * journey.js — the Road East. Hervé's route is drawn across the old map of Eurasia, as in the
 * journey cutscenes, but at some towns along the way the ride stops and something happens: a
 * border guard, a storm, frozen lake ice, bandits' country, a river in flood. Each is a card with
 * two or three things to do, some costing francs or a keepsake, some costing days, health or
 * nerve. What is chosen changes story variables, and the story goes on from there.
 *
 * The journeys and their events are written in story/journeys.js; the script starts one with:
 *
 *   journey first            (or: journey second into how — "done" or "skipped")
 */
(function () {
  'use strict';
  const VN = globalThis.VN;
  const h = VN.h;

  const costLabel = (cost) => {
    if (!cost) return null;
    const [kind, v] = cost.split(':');
    return kind === 'francs' ? `−${v} francs` : `gives up: ${((VN.engine && VN.engine.itemInfo(v)) || { name: v }).name}`;
  };
  const canPay = (eng, cost) => {
    if (!cost) return true;
    const [kind, v] = cost.split(':');
    return kind === 'francs' ? eng.francs() >= Number(v) : eng.hasItem(v);
  };
  const needs = (eng, need) => {
    if (!need) return true;
    const [kind, v] = need.split(':');
    return kind === 'item' ? eng.hasItem(v) : !!eng.getVar(v);
  };

  /** What an option does: pay, add to or set story variables. */
  function apply(eng, opt) {
    if (opt.cost) {
      const [kind, v] = opt.cost.split(':');
      if (kind === 'francs') eng.changeFrancs(-Number(v));
      else eng.loseItem(v);
    }
    for (const [k, v] of Object.entries(opt.add || {})) eng.setVar(k, (Number(eng.getVar(k)) || 0) + v);
    for (const [k, v] of Object.entries(opt.set || {})) eng.setVar(k, v);
  }

  /** The card for one event: resolves once the player has chosen and read what came of it. */
  function eventCard(ctx, player, ev, stop) {
    const { engine: eng, audio } = ctx;
    return new Promise((resolve) => {
      const opts = ev.options.filter((o) => needs(eng, o.need));
      const buttons = opts.map((o, i) => {
        const ok = canPay(eng, o.cost);
        const b = h(`button.jr-opt${ok ? '' : '.poor'}`, { type: 'button', disabled: !ok },
          h('span.jr-key', String(i + 1)), h('span.jr-opt-text', o.text), o.cost ? h('span.jr-cost', costLabel(o.cost)) : null);
        b.addEventListener('click', (e) => { e.stopPropagation(); choose(o); });
        return b;
      });
      const body = h('div.jr-body', h('p.jr-text', ev.text), h('div.jr-opts', buttons));
      const card = h('div.jr-card', h('div.jr-place', h('i', '旅'), h('span', stop.label || ev.place || '')), h('div.jr-title', ev.title), body);
      player.el.append(card);
      audio.fx('page', { volume: 0.5 });
      requestAnimationFrame(() => card.classList.add('on'));
      let chosen = false;
      const choose = (o) => {
        if (chosen || !canPay(eng, o.cost)) return;
        chosen = true;
        apply(eng, o);
        audio.fx(o.sound || 'paper', { volume: 0.55 });
        const on = h('button.jr-go', { type: 'button' }, 'Ride on', h('span', '▸'));
        on.addEventListener('click', (e) => { e.stopPropagation(); done(); });
        body.replaceChildren(h('p.jr-text.jr-result', o.result || ''), on);
        player.keyHandler = (e) => { if (e.key === 'Enter' || e.key === ' ') { done(); return true; } return e.key !== 'Escape'; };
        on.focus({ preventScroll: true });
      };
      const done = () => {
        player.keyHandler = null;
        card.classList.remove('on');
        card.classList.add('off');
        setTimeout(() => card.remove(), 450);
        resolve();
      };
      player.keyHandler = (e) => {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= opts.length) { choose(opts[n - 1]); return true; }
        return e.key !== 'Escape';
      };
    });
  }

  /** Play the named journey; resolves "done", or "skipped" if the player skipped it. */
  VN.playJourney = function (ctx, name) {
    const J = (globalThis.VN_JOURNEYS || {})[name];
    const route = globalThis.VN_ROUTE;
    if (!J || !route || !VN.CutscenePlayer) return Promise.resolve('missing');
    return new Promise((resolve) => {
      let player = null;
      const map = {
        stops: route[J.route || 'out'](),
        zoom: J.zoom || 1.9,
        travel: J.travel || 16,
        ink: J.ink,
        events: J.events || {},
        onStop: (stop) => eventCard(ctx, player, J.events[stop.key], stop),
        onEnd: () => player.finish(),
      };
      const def = { interactive: true, shots: [{ bg: 'journey_map', dur: 999, hold: true, map, fx: J.fx, text: J.caption, textAt: 1 }] };
      player = new VN.CutscenePlayer(ctx, def, { onDone: () => resolve(player.skipped ? 'skipped' : 'done') });
      player.start();
    });
  };
})();
