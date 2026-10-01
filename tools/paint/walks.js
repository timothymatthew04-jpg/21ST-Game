/*
 * The walking areas: wide scenes, several screens long, painted in layers that the walk
 * engine (js/walk.js) scrolls at different speeds. Everyone walks along the bank at GY; below
 * WY is water, where the engine draws the reflection of everything above it.
 *
 * Layer depths are how fast each layer scrolls: 0 stays put (the sky), 1 moves with the
 * ground, more than 1 passes in front of the walkers. A layer that scrolls at depth f only ever
 * shows its first 480 + f × (width − 480) pixels, so that is all that is painted of it.
 */
globalThis.WALKS = {};
const GY = 204; // where feet touch the ground
const WY = 211; // where the water begins
const S = (f) => Math.min(W, Math.round(480 + f * (W - 480)) + 40);

/** The strip of bank everyone walks on, and its edge down to the water. */
function bank(g, r, x0, x1, o) {
  vgrad(g, x0, GY - 10, x1 - x0, 12, [[0, o.grass0], [1, o.grass1]]);
  texture(g, r, x0, GY - 10, x1 - x0, 12, 0.08, 2);
  rect(g, x0, GY + 2, x1 - x0, WY - GY - 2, o.earth);
  rect(g, x0, WY - 2, x1 - x0, 2, o.dark);
  for (let x = x0; x < x1; x += r.r(2, 5)) rect(g, x, GY - 12 - r.i(0, 3), 1, r.i(2, 4), r.pick([o.grass0, o.grass1, o.tip || o.grass0]));
  for (let x = x0; x < x1; x += r.r(18, 50)) ellipse(g, x, WY - 2, r.r(3, 7), r.r(1.5, 3), r.pick([o.stone || '#6a6a70', o.dark]));
  for (let x = x0; x < x1; x += r.r(6, 14)) rect(g, x, GY + r.i(3, 5), r.i(2, 4), 1, o.dark);
}

/** Reeds and tall grass along the bottom edge, in front of everything. */
function reeds(f, r, cols, n = 90) {
  for (let i = 0; i < n; i++) {
    const x = r() * W, h = r.r(10, 34), lean = r.r(-4, 4);
    line(f, x, H, x + lean, H - h, r.pick(cols), 1);
    if (r() < 0.3) ellipse(f, x + lean, H - h, 1.5, 4, cols[0]);
  }
}

// ---------------------------------------------------------------- the army camp, at dawn
// France at its proudest: the regiment's headquarters, ramparts and watchtowers, tents and guns,
// and on the horizon the citadels, barracks, domes and towers of a military nation. The
// airships and balloons, the waving flags, the soldiers, the smoke and the fire are drawn by
// the walk itself (story/walks.js says where).
WALKS.camp = (c, L) => {
  const r = rng(401);
  // a pink dawn, the sun just up on the left
  vgrad(c, 0, 0, 480, WY, [[0, '#56588e'], [0.28, '#9a78aa'], [0.52, '#e296ae'], [0.74, '#f7b4a4'], [0.9, '#ffd6b0'], [1, '#fff0d4']]);
  stars(c, r, 16, 0, 0, 480, 34, '#f4ecff');
  sun(c, 118, 150, 15, '#fff6e6', 'rgba(255,150,170,0.55)');
  c.clearRect(0, WY, 480, H - WY);
  // heavy clouds drifting over, lit pink from below by the rising sun
  const cl = L('clouds', { depth: 0.05, anim: { type: 'drift', t: 420 } });
  wrapped(cl, 71, (cc, rr) => {
    frCloud(cc, rr, 10, 20, 150, 38, {});
    frCloud(cc, rr, 200, 44, 110, 30, { light: -1 });
    frCloud(cc, rr, 330, 14, 130, 34, {});
    frCloud(cc, rr, 120, 92, 90, 16, { body: '#c4a8c0', shadow: '#9a86a8' });
    frCloud(cc, rr, 380, 100, 80, 14, { body: '#c4a8c0', shadow: '#9a86a8' });
  });
  // Paris on the horizon, as it stood in the 1860s: the Tour Saint-Jacques, Notre-Dame with its new
  // spire, the Panthéon, the Vendôme column cast from captured cannon, the new Opera going up in
  // scaffolding, the Arc de Triomphe, and the new boulevards' apartment blocks between them
  const pa = L('paris', { depth: 0.08 });
  const px1 = S(0.08);
  const P = { col: '#b898b2', lit: '#e6c0cc', dark: '#9e7c98', deep: '#8e6e8a', roof: '#aa8eae', win: '#ffdcb0', gap: '#e6b2c0' };
  const G = { hi: '#fff0c4', lit: '#f2cc8a', mid: '#d8a87c', shade: '#b48474' };
  const BP = 168;
  frBlocks(pa, r, -10, px1 + 10, BP, P, 16, 28);
  frTourStJacques(pa, 8, BP, 1.2, P);
  frNotreDame(pa, 30, BP, 1.15, P);
  frPantheon(pa, 196, BP, 1.25, P);
  frVendome(pa, 380, BP, 1.15, P, '#a0808a');
  frOperaWorks(pa, r, 404, BP, 1.15, P, '#9a7c80');
  frArcTriomphe(pa, 452, BP, 1.3, P);
  frDome(pa, 560, BP, 1, P.col, P.lit);
  frBlocks(pa, r, 600, px1 + 10, BP, P, 16, 26);
  pa.save(); pa.globalCompositeOperation = 'source-atop'; vgrad(pa, 0, 60, px1, 110, [[0, 'rgba(255,200,215,0.08)'], [1, 'rgba(255,196,206,0.4)']]); pa.restore();
  // the giants of France nearer in: the fortress-city on its rock at the heart of it all, the iron
  // tower, the Louvre of the Emperor, and the gilded dome of the Invalides over the old soldiers
  const gi = L('giants', { depth: 0.1 });
  const gx1 = S(0.1);
  const GP = { col: '#b890aa', lit: '#f2c8cc', dark: '#946c8e', deep: '#74547a', roof: '#8a7098', roofLit: '#b8a0c0', win: '#ffd8a0', hi: '#ffe8e0', gap: '#e6b2c0' };
  frEiffel(gi, 70, 170, 128, { col: '#8e6078', lit: '#dca4ac', dark: '#6c4664', glint: '#fff0d0' });
  frLouvre(gi, r, 158, 170, 1.2, GP, G);
  const CP = { rock: '#9a7a8e', rockLit: '#c8a2ac', rockDark: '#76587a', scrub: '#8a7870', wall: '#dab4b4', wallLit: '#f8dcd0', wallDark: '#aa8294', roof: '#c4506a', roofLit: '#ec7c8c', win: '#ffd8a0', winDark: '#7a5a78' };
  const cf = frCastleRock(gi, r, 322, 170, 0.76, CP);
  rect(gi, cf[0], cf[1], 4, 2, FR.blue); rect(gi, cf[0] + 4, cf[1], 4, 2, FR.white); rect(gi, cf[0] + 8, cf[1], 4, 2, FR.red);
  frInvalides(gi, r, 520, 170, 1.55, GP, G);
  gi.save(); gi.globalCompositeOperation = 'source-atop'; vgrad(gi, 0, 30, gx1, 140, [[0, 'rgba(255,210,220,0.02)'], [1, 'rgba(255,196,206,0.3)']]); gi.restore();
  // in front, the military France: citadels bristling with siege guns and mortars (for show), the
  // keep of Vincennes, barracks and the arsenals' stacks
  const far = L('far', { depth: 0.12 });
  const fx1 = S(0.12);
  const hz = { col: '#9a7896', lit: '#d8a4b4', dark: '#6a5070', roof: '#7a5a80', deep: '#5e4664' };
  const AP = { wood: '#7a5a74', dark: '#5a4462', iron: '#5e4a66', lit: '#caa2b6', bronze: '#9a7a78' };
  // (everything stands on a far rise, so it shows above the camp's ramparts)
  const B = 172;
  hill(far, r, -40, fx1 + 40, B + 4, 14, '#a88aa4');
  rect(far, 0, B + 2, fx1, 30, '#a88aa4');
  frBarracks(far, r, 0, B, 64, 13, hz.col, hz.roof, hz.lit);
  frStack(far, 14, B - 12, 22, hz.col, hz.lit); frSmoke(far, r, 14, B - 36, 9, 'rgba(226,200,214,0.55)', 1);
  const k1 = frCitadel(far, r, 130, 250, B, 15, hz.col, hz.lit, hz.dark);
  const v = frVincennes(far, k1[0] - 8, B - 12, 0.9, { col: hz.col, lit: hz.lit, dark: hz.dark, deep: hz.deep, roof: hz.roof });
  rect(far, v[0], v[1], 4, 2, FR.blue); rect(far, v[0] + 4, v[1], 4, 2, FR.white); rect(far, v[0] + 8, v[1], 4, 2, FR.red);
  frBarracks(far, r, 262, B, 58, 12, hz.col, hz.roof, hz.lit);
  const k2 = frCitadel(far, r, 410, 560, B, 16, hz.col, hz.lit, hz.dark);
  rect(far, k2[0], k2[1], 4, 2, FR.blue); rect(far, k2[0] + 4, k2[1], 4, 2, FR.white); rect(far, k2[0] + 8, k2[1], 4, 2, FR.red);
  // the batteries: raised gun platforms on the walls, so the guns show over the camp's ramparts
  const battery = (x, top, kind, dir) => {
    poly(far, [[x - 12, top], [x - 9, top - 20], [x + 9, top - 20], [x + 12, top]], hz.col);
    poly(far, [[x - 12, top], [x - 9, top - 20], [x - 5, top - 20], [x - 8, top]], hz.lit);
    rect(far, x - 9, top - 20, 18, 1, hz.lit);
    if (kind === 'gun') frSiegeGun(far, x, top - 20, 0.6, AP, dir); else frMortar(far, x, top - 20, 0.65, AP);
  };
  for (const [x, kind] of [[142, 'gun'], [166, 'mortar'], [214, 'gun'], [238, 'mortar']]) battery(x, B - 15, kind, -1);
  for (const [x, kind] of [[424, 'gun'], [446, 'mortar'], [468, 'gun'], [518, 'mortar'], [544, 'gun']]) battery(x, B - 16, kind, 1);
  for (const x of [576, 598]) { frStack(far, x, B - 10, 24, hz.col, hz.lit); frSmoke(far, r, x, B - 36, 10, 'rgba(226,200,214,0.55)', 1); }
  frCitadel(far, r, 620, fx1 + 20, B, 14, hz.col, hz.lit, hz.dark);
  for (const x of [644, 672, 700]) battery(x, B - 14, x === 672 ? 'mortar' : 'gun', 1);
  // a semaphore tower, the telegraph of the army, arms raised
  rect(far, 356, B - 40, 3, 40, hz.col); rect(far, 348, B - 40, 19, 2, hz.col); line(far, 348, B - 40, 344, B - 46, hz.col, 1); line(far, 367, B - 39, 372, B - 33, hz.col, 1);
  far.save(); far.globalCompositeOperation = 'source-atop'; vgrad(far, 0, 110, fx1, 76, [[0, 'rgba(255,190,200,0.05)'], [1, 'rgba(255,200,205,0.35)']]); far.restore();
  // the railway on its viaduct across the valley (the trains are the walk's: story/walks.js)
  const rl = L('rail', { depth: 0.2 });
  const rx1 = S(0.2);
  const RP = { col: '#bc98a6', lit: '#e0bcc4', dark: '#94748a', rail: '#5a4658', pole: '#6e5664', wire: '#8a7084' };
  frViaduct(rl, -8, rx1 + 8, 146, 200, 20, RP);
  frTelegraph(rl, 6, rx1, 146, 44, RP);
  // a disc signal by the line
  rect(rl, 268, 133, 1, 13, RP.pole); circle(rl, 268.5, 133, 2.2, '#c83a3a'); px(rl, 268, 132, '#ffd8c8');
  rl.save(); rl.globalCompositeOperation = 'source-atop'; vgrad(rl, 0, 140, rx1, 30, [[0, 'rgba(255,196,206,0.12)'], [1, 'rgba(255,196,206,0.25)']]); rl.restore();
  // nearer: the outer works of the fortress with big guns on the bastions, poplars, the garrison town
  const mid = L('mid', { depth: 0.38 });
  const mx1 = S(0.38);
  const MP = { wood: '#6a4e62', dark: '#4a3a52', iron: '#4e3e5a', lit: '#b894aa', bronze: '#8a6e6a' };
  vgrad(mid, 0, 184, mx1, 12, [[0, '#9a8a78'], [1, '#7e7058']]);
  const pts = [[0, 196], [0, 186]];
  for (let x = 0; x < mx1; x += 70) pts.push([x + 10, 186], [x + 30, 186], [x + 38, 181], [x + 46, 186], [x + 70, 186]);
  pts.push([mx1, 186], [mx1, 196]);
  poly(mid, pts, '#8a6e82');
  for (let x = 0, k = 0; x < mx1; x += 70, k++) {
    poly(mid, [[x + 30, 186], [x + 38, 181], [x + 38, 196]], '#b08e9e'); px(mid, x + 36, 184, '#3a2e3a'); px(mid, x + 42, 184, '#3a2e3a');
    if (k % 3 === 1) frSiegeGun(mid, x + 38, 182, 0.7, MP, k % 2 ? 1 : -1); else if (k % 3 === 2) frMortar(mid, x + 38, 182, 0.7, MP);
  }
  for (let x = 12; x < mx1; x += r.r(26, 52)) poplar(mid, r, x, 188, r.r(30, 44), { trunk: '#4a3a44', leaves: ['#56604a', '#6e7a56', '#a0a070'] }, -1);
  for (const x of [150, 420, 700, 940]) {
    frHouse(mid, r, x, 190, 28, 14, { wall: '#d8bcb4', wallDark: '#b09098', roof: '#6e6c8e', roofDark: '#4e4c6e', roofH: 8, windows: [[6, 4, 3, 4, { lit: true }], [18, 4, 3, 4]] });
    frHouse(mid, r, x + 30, 190, 22, 12, { wall: '#e0c4b4', wallDark: '#b89a98', roof: '#a8583e', roofDark: '#7a3e2c', roofH: 7, windows: [[8, 4, 3, 4]] });
  }
  // the harbour basin behind the quay: the naval arsenal along the far side, the water, the crane
  const hb = L('harbour', { depth: 1 });
  const arsenal = [[642, 58, 22, 'store'], [700, 64, 16, 'rope'], [764, 46, 30, 'clock'], [810, 82, 24, 'store'], [892, 70, 30, 'slip'], [962, 80, 20, 'store'], [1042, 62, 24, 'store']];
  for (const [ax, aw, ah, kind] of arsenal) {
    const top = 167 - ah;
    vgrad(hb, ax, top, aw, ah, [[0, FR.stone.lit], [1, FR.stone.mid]]);
    rect(hb, ax, top, 2, ah, FR.stone.hi); rect(hb, ax + aw - 2, top, 2, ah, FR.stone.shade);
    if (kind === 'slip') {
      hb.fillStyle = FR.slate.mid; hb.beginPath(); hb.moveTo(ax - 2, top); hb.quadraticCurveTo(ax + aw / 2, top - 22, ax + aw + 2, top); hb.closePath(); hb.fill();
      for (let k = 4; k < aw; k += 6) line(hb, ax + k, top, ax + aw / 2, top - 14, FR.slate.dark, 1);
      ellipse(hb, ax + aw / 2, 167, aw * 0.36, ah * 0.7, '#3a2e3a'); rect(hb, ax + aw * 0.14, 150, aw * 0.72, 17, '#3a2e3a');
    } else {
      poly(hb, [[ax - 2, top], [ax + aw + 2, top], [ax + aw - 4, top - 7], [ax + 4, top - 7]], FR.slate.mid);
      rect(hb, ax + 4, top - 7, aw - 8, 1, FR.slate.hi);
      for (let k = ax + 6; k < ax + aw - 6; k += 9) { ellipse(hb, k + 2, 167 - 8, 2.5, 2.5, '#3a2e3a'); rect(hb, k - 0.5, 167 - 8, 5, 8, '#3a2e3a'); if (ah > 18) { rect(hb, k, top + 4, 4, 5, r() < 0.3 ? FR.lit : FR.glass); } }
      if (kind === 'rope') for (let k = ax + 4; k < ax + aw - 4; k += 4) px(hb, k, top + 3, FR.stone.deep);
    }
    if (kind === 'clock') {
      rect(hb, ax + aw / 2 - 7, top - 26, 14, 26, FR.stone.lit); rect(hb, ax + aw / 2 - 7, top - 26, 3, 26, FR.stone.hi);
      circle(hb, ax + aw / 2, top - 18, 4, '#f4ecd8'); line(hb, ax + aw / 2, top - 18, ax + aw / 2, top - 21, '#2e2830', 1); line(hb, ax + aw / 2, top - 18, ax + aw / 2 + 2, top - 18, '#2e2830', 1);
      poly(hb, [[ax + aw / 2 - 9, top - 26], [ax + aw / 2 + 9, top - 26], [ax + aw / 2, top - 38]], FR.slate.mid);
      rect(hb, ax + aw / 2, top - 46, 1, 9, '#3a2e2a');
    }
  }
  rect(hb, 642, 166, 462, 5, FR.stone.mid); rect(hb, 642, 166, 462, 1, FR.stone.hi);
  for (let x = 650; x < 1100; x += 34) { rect(hb, x, 163, 3, 4, '#3a3440'); rect(hb, x - 1, 163, 5, 1, '#5a5460'); }
  vgrad(hb, 642, 171, 462, 25, [[0, '#caa0b8'], [0.5, '#a07a98'], [1, '#7a5a7a']]);
  for (let i = 0; i < 170; i++) rect(hb, r.r(642, 1100), r.r(172, 195), r.r(3, 10), 1, r.pick(['#e8c0cc', '#f4d0c4', '#8a6a8a', '#b890a8']));
  // the ship's dark reflection trembling under her hull
  for (let y = 187; y < 196; y++) for (let x = 690; x < 990; x += r.r(3, 7)) if (r() < 0.75 - (y - 187) * 0.06) rect(hb, x, y, r.r(2, 6), 1, r() < 0.8 ? '#3a2e3e' : '#e8dcd0');
  // the dock crane on the far quay, a crate on its hook
  line(hb, 1050, 166, 1050, 118, FR.wood.mid, 3); line(hb, 1050, 122, 1010, 132, FR.wood.mid, 2); line(hb, 1050, 140, 1030, 128, FR.wood.dark, 1);
  line(hb, 1012, 132, 1012, 148, '#3a3030', 1); rect(hb, 1007, 148, 10, 7, FR.wood.lit); rect(hb, 1007, 148, 10, 1, FR.wood.hi);
  // the ship of the line herself, afloat, riding a little on the water (the layer bobs)
  const sh = L('ship', { depth: 1, anim: { type: 'bob', a: 0.6, t: 5.5 } });
  const ship = frWarship(sh, r, 700, 186, 0.9);
  // the camp itself
  const g = L('ground', { depth: 1 });
  vgrad(g, 0, 184, W, 22, [[0, '#b89478'], [1, '#8e6c52']]);
  texture(g, r, 0, 184, W, 22, 0.06, 2);
  bank(g, r, 0, W, { grass0: '#94885a', grass1: '#6e6a40', tip: '#bcb070', earth: '#6e5042', dark: '#3a2a26', stone: '#a88c8c' });
  // ---- the west of the camp: the ramparts, barbed wire along their top, lamps all the way
  frRampart(g, r, 0, 630, 188, 22, { lamps: [60, 180, 300, 420, 540] });
  frBarbedWire(g, r, 0, 622, 163);
  frTurret(g, 566, 166, 1, 1);
  // tents in rows before the wall
  for (const [x, s] of [[176, 18], [214, 21], [254, 17], [476, 19], [512, 17]]) frTent(g, x, GY - 3, s, { pennant: s > 20 });
  // the west watchtower and the great flag
  frTower(g, r, 94, GY - 2);
  rect(g, 140, GY - 92, 2, 90, '#3a2e2a'); rect(g, 140, GY - 92, 1, 90, '#7a6a60'); circle(g, 141, GY - 93, 2, FR.gold.lit);
  // the armoury, and the shooting range: a step of sandbags for the firing line, the targets on
  // their earth butt (the riflemen and their shots are the walk's)
  frBannerPole(g, 196, GY - 2); frBannerCloth(g, 196, GY - 2, 'rifles');
  frRifles(g, 232, GY - 1);
  for (let row = 0; row < 2; row++) for (let x = 290 + row * 3; x < 338 - row * 3; x += 6) { ellipse(g, x + 3, GY - 2 - row * 3, 3.4, 1.8, row ? '#c8b080' : '#a89060'); px(g, x + 1, GY - 3 - row * 3, '#e0cc98'); }
  poly(g, [[392, GY - 1], [398, GY - 24], [458, GY - 26], [466, GY - 1]], '#8a6a4a');
  poly(g, [[392, GY - 1], [398, GY - 24], [420, GY - 25], [410, GY - 1]], '#a8845a');
  texture(g, r, 392, GY - 26, 74, 26, 0.1, 2);
  for (const x of [406, 428, 450]) {
    line(g, x - 5, GY - 2, x - 3, GY - 16, FR.wood.mid, 1); line(g, x + 5, GY - 2, x + 3, GY - 16, FR.wood.mid, 1);
    circle(g, x, GY - 18, 6, '#f2eadc'); circle(g, x, GY - 18, 4.5, '#c83a3a'); circle(g, x, GY - 18, 3, '#f2eadc'); circle(g, x, GY - 18, 1.5, '#2a2030');
  }
  rect(g, 386, GY - 40, 1, 38, '#3a2e2a'); poly(g, [[387, GY - 40], [397, GY - 37], [387, GY - 34]], '#d83a3a');
  frBannerPole(g, 592, GY - 2); frBannerCloth(g, 592, GY - 2, 'drum');
  frRifles(g, 612, GY - 1);
  // ---- the harbour: the ramparts open onto a basin where a ship of the line lies moored
  for (const bx of [622, 1104]) {
    vgrad(g, bx, 150, 20, 40, [[0, FR.stone.hi], [0.5, FR.stone.lit], [1, FR.stone.mid]]);
    rect(g, bx, 150, 4, 40, FR.stone.hi); rect(g, bx + 16, 150, 4, 40, FR.stone.shade);
    for (let xx = bx - 1; xx < bx + 21; xx += 4) rect(g, xx, 145, 3, 5, FR.stone.mid);
    frLampPost(g, bx + 9, 146, 8);
  }
  // (the ground opens here onto the basin and the ship, which are layers of their own, behind)
  g.clearRect(642, 0, 462, 195);
  // the water lapping at her waterline
  for (let i = 0; i < 110; i++) rect(g, r.r(646, 1000), r.r(185, 189), r.r(2, 7), 1, r.pick(['#e8c4cc', '#f4dcd4', '#b890a8']));
  // the near quay the camp walks along: paving, bollards, mooring lines, the gangplank, stores
  rect(g, 630, 195, 480, 11, '#b8a0a4');
  rect(g, 630, 195, 480, 2, '#dcc4c4');
  for (let x = 632; x < 1110; x += 9) rect(g, x, 197 + ((x / 9) % 2) * 4, 1, 4, '#9a8290');
  rect(g, 630, 201, 480, 1, '#9a8290');
  for (const bx of [668, 760, 880, 1000, 1080]) { rect(g, bx, 191, 4, 5, '#2e2a34'); rect(g, bx - 1, 191, 6, 1, '#5a5460'); }
  line(g, 670, 192, 690, 170, '#6a5a4a', 1); line(g, 1002, 192, 985, 170, '#6a5a4a', 1);
  line(g, 902, 196, 936, 156, FR.wood.lit, 2); line(g, 902, 193, 936, 153, FR.wood.dark, 1);
  for (const [x, w, hh] of [[640, 12, 9], [652, 9, 6], [1022, 14, 10], [1038, 10, 7]]) { rect(g, x, 195 - hh, w, hh, FR.wood.lit); rect(g, x, 195 - hh, w, 1, FR.wood.hi); line(g, x, 195 - hh, x + w, 195, FR.wood.dark, 1); }
  frShot(g, 1060, 195); frShot(g, 700, 195);
  for (const x of [718, 734]) { ellipse(g, x, 190, 4, 6, '#6a4a2e'); rect(g, x - 4, 188, 8, 1, '#3a2a1e'); }
  for (const x of [646, 820, 960, 1096]) frLampPost(g, x, 196, 30);
  // ---- the east of the camp (the old camp, moved along to make room for the harbour)
  g.save(); g.translate(480, 0);
  frRampart(g, r, 630, 1198, 188, 22, { lamps: [700, 820, 960, 1080] });
  frBarbedWire(g, r, 638, 1190, 163);
  frTurret(g, 900, 166, 1, -1);
  frTurret(g, 1130, 166, 1, 1);
  // the headquarters, with the regiment's colours either side
  const hq = frHQ(g, r, 752, GY - 2);
  for (const x of [646, 858]) { rect(g, x, GY - 70, 2, 68, '#3a2e2a'); circle(g, x + 1, GY - 72, 2.5, FR.gold.lit); poly(g, [[x - 2, GY - 74], [x + 1, GY - 79], [x + 4, GY - 74]], FR.gold.mid); }
  // the fire before the steps
  ellipse(g, 752, GY - 1, 16, 3, '#3a2a26');
  for (let k = 0; k < 6; k++) line(g, 740 + k * 5, GY - 1, 747 + k * 3, GY - 8, '#5a3a24', 2);
  glow(g, 752, GY - 10, 46, 'rgba(255,150,80,0.45)');
  // stores, the artillery park with its guns and a great mortar, the drill ground
  for (const [x, w, hh] of [[866, 18, 12], [884, 14, 18], [872, 12, 8]]) { rect(g, x, GY - 2 - hh, w, hh, '#7a5a3a'); rect(g, x, GY - 2 - hh, w, 2, '#b08a5a'); line(g, x, GY - 2 - hh, x + w, GY - 2, '#5a3e28', 1); }
  for (const x of [902, 910]) { ellipse(g, x, GY - 8, 4, 7, '#6a4a2e'); rect(g, x - 4, GY - 10, 8, 1, '#3a2a1e'); rect(g, x - 4, GY - 5, 8, 1, '#3a2a1e'); }
  frBannerPole(g, 924, GY - 2); frBannerCloth(g, 924, GY - 2, 'cannon');
  frGun(g, 1030, GY - 1, 1); frGun(g, 1074, GY - 1, 1); frShot(g, 1050, GY - 1);
  frMortar(g, 1100, GY - 1, 1.3, { wood: FR.wood.mid, dark: '#2e2a30', lit: '#e0b070', bronze: '#a87a44' });
  for (const x of [700, 1000]) frLampPost(g, x, GY - 2, 32);
  // the supply wagon
  rect(g, 1126, GY - 26, 56, 16, '#6a4a2a'); rect(g, 1126, GY - 26, 56, 2, '#8a6a3a');
  poly(g, [[1122, GY - 26], [1186, GY - 26], [1176, GY - 46], [1132, GY - 46]], '#ece0d0'); poly(g, [[1154, GY - 46], [1176, GY - 46], [1186, GY - 26], [1160, GY - 26]], '#c8b4b0');
  for (const x of [1138, 1170]) { circle(g, x, GY - 8, 8, '#3a2a1a'); circle(g, x, GY - 8, 6, '#6a4a2a'); circle(g, x, GY - 8, 2, '#3a2a1a'); }
  frTent(g, 1104, GY - 3, 24, { pennant: true });
  // the great gate: two towers and the arch between, sentries on top, lamps, a flagstaff
  const gate = frGatehouse(g, r, 1236, GY - 2);
  // outside: the road north between poplars, hedgehogs along it, a barbed-wire fence, the signpost
  frBarbedWire(g, r, 1284, W - 480, GY - 3, { gap: 16, h: 13, post: '#5a4030' });
  for (const x of [1300, 1340, 1430]) poplar(g, r, x, GY - 4, r.r(52, 64), { trunk: '#4a3a3a', leaves: ['#4e5a3a', '#6a7644', '#9aa05a'] }, -1);
  rect(g, 1360, GY - 34, 3, 32, '#5a3a24'); poly(g, [[1348, GY - 34], [1392, GY - 34], [1398, GY - 30], [1392, GY - 26], [1348, GY - 26]], '#c8a878');
  rect(g, 1312, GY - 12, 6, 10, '#d8d0c4'); rect(g, 1312, GY - 12, 6, 2, '#c83a3a');
  for (const x of [1288, 1302, 1318, 1334, 1376, 1404, 1420, 1438]) frHedgehog(g, x, GY - 1, x % 3 ? 1 : 1.2);
  g.restore();
  const fr = L('front', { depth: 1.3, anim: sway(3, 3.4) });
  reeds(fr, r, ['#4a4a2a', '#66663a', '#8a8a4a']);
  return { colors: 150, vignette: [0.25, '40,20,40'], anchors: { flag: hq.flag, chimneys: hq.chimneys, ship, gate } };
};

// ---------------------------------------------------------------- Lavilledieu, home, on a bright autumn day
// Out of the meadows, past the silk mill and the washerwomen, along the quay under the plane trees,
// by the guinguette and the church, home to the Joncour house, where Hélène is in the garden. Above
// the town the cathedral stands on its hill among the stone houses; beyond, windmills on the ridges,
// a château and an abbey on the foothills, and the snowy mountains. The boats, the fish, the birds,
// the windmills' sails, the children and dogs, the mill wheel and the fountain are the walk's
// (story/walks.js), which also knows where the windmills' hubs and the cathedral's spires are.
WALKS.lavilledieu = (c, L) => {
  const r = rng(1301);
  vgrad(c, 0, 0, 480, WY, [[0, '#2f6eba'], [0.28, '#5896d2'], [0.54, '#9cc2e2'], [0.76, '#e2dccc'], [1, '#f4e4c4']]);
  sun(c, 80, 34, 13, '#fffef0', 'rgba(255,240,200,0.7)');
  c.clearRect(0, WY, 480, H - WY);
  // little high clouds in rows, and big white ones drifting lower down, warm in the autumn sun
  const hi = L('clouds_high', { depth: 0.02, anim: { type: 'drift', t: 700 } });
  wrapped(hi, 131, (cc, rr) => { for (let i = 0; i < 70; i++) { const x = rr.r(0, 480), y = rr.r(8, 56); ellipse(cc, x, y, rr.r(3, 7), rr.r(1.4, 2.4), rr.pick(['#ffffff', '#f4f0ec', '#dce4f0'])); } });
  const cl = L('clouds', { depth: 0.05, anim: { type: 'drift', t: 420 } });
  wrapped(cl, 132, (cc, rr) => {
    cumulus(cc, rr, 170, 26, 120, 36, { dark: '#b8c0d8', mid: '#eceef6', lit: '#fffaf0', lx: -1 });
    cumulus(cc, rr, 380, 52, 80, 24, { dark: '#b8c0d8', mid: '#eceef6', lit: '#fffaf0', lx: -1 });
    cumulus(cc, rr, 20, 66, 70, 20, { dark: '#b8c0d8', mid: '#eceef6', lit: '#fffaf0', lx: -1 });
  });
  // the high mountains, far off, snow on their peaks
  const pk = L('peaks', { depth: 0.03 });
  const PK = { lit: '#b8c0dc', shade: '#8c96bc', deep: '#7a84aa', snow: '#fbfcff', snowShade: '#ccd4e8', snowline: 0.4, snowAt: 70 };
  for (const [x, h, w] of [[-20, 96, 90], [70, 132, 110], [170, 104, 90], [262, 140, 120], [370, 112, 96], [470, 128, 110], [560, 100, 90]]) vPeak(pk, r, x, 178, h, w, PK);
  pk.save(); pk.globalCompositeOperation = 'source-atop'; vgrad(pk, 0, 110, S(0.03), 70, [[0, 'rgba(236,228,220,0)'], [1, 'rgba(236,226,212,0.85)']]); pk.restore();
  // the foothills: forests turned red and gold, a château in the sun on its rock, an abbey
  const rg = L('range', { depth: 0.07 });
  const RG = { lit: '#c8ac8c', shade: '#907870', deep: '#74605c', snow: '#fbfaf6', snowShade: '#d4d0d8', snowline: 0.22, snowAt: 84 };
  for (const [x, h, w] of [[30, 70, 80], [230, 88, 100], [330, 64, 70], [520, 86, 100], [640, 70, 80]]) vPeak(rg, r, x, 190, h, w, RG);
  rg.save(); rg.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 520; i++) { const x = r.r(-10, S(0.07)), y = r.r(128, 190); crown(rg, r, x, y, r.r(3, 7), r.r(2, 4), vAutumn(r).map((col) => vMix(col, '#e0d0c0', 0.35)), { x: -0.7, y: -0.7 }, 6); }
  vgrad(rg, 0, 150, S(0.07), 40, [[0, 'rgba(232,220,200,0)'], [1, 'rgba(232,220,200,0.6)']]);
  rg.restore();
  const CP = { lit: '#f4ecd8', mid: '#d4c8b0', dark: '#a89a84', hi: '#fffbee', roof: '#5a6278', roofLit: '#8a94ac', glass: '#4a5670', glassLit: '#f4cc78', rock: '#a08a78', rockLit: '#c8b098', rockDark: '#7a6660', haze: '#e0d0c0', hazeK: 0.3 };
  const cTop = vSpur(rg, r, 104, 190, 60, 58, CP);
  vChateau(rg, r, 106, cTop, 0.62, CP);
  vAbbey(rg, r, 408, 162, 0.5, { ...CP, tile: '#a86a4a', deep: '#5a5048' });
  rg.save(); rg.globalCompositeOperation = 'source-atop'; vgrad(rg, 0, 170, S(0.07), 20, [[0, 'rgba(232,220,200,0)'], [1, 'rgba(232,220,200,0.5)']]); rg.restore();
  // rolling hills with vineyards gone red and gold, windmills on the crests, poplars
  const hs = L('hills', { depth: 0.13 });
  const hx1 = S(0.13);
  const fnH = vProfile([[-10, 176], [60, 158], [140, 170], [210, 156], [300, 172], [380, 164], [470, 150], [560, 168], [620, 156], [hx1, 170]]);
  vLand(hs, fnH, -10, hx1, 200, '#b89a58');
  hs.save(); hs.globalCompositeOperation = 'source-atop';
  for (let x = 0; x < hx1; x++) { const d = fnH(x + 2) - fnH(x - 2); if (d > 0.3) rect(hs, x, fnH(x), 1, 40, '#9a7e48'); else if (d < -0.3) rect(hs, x, fnH(x), 1, 30, '#ccae66'); }
  for (let y = 150; y < 200; y += 3) for (let x = 0; x < hx1; x += 2) if (Math.sin(x * 0.02 + y * 0.3) > 0.2) px(hs, x + (y % 2), y, r.pick(['#a83a22', '#c86a2a', '#d8a040', '#8a4a2a']));
  vgrad(hs, 0, 170, hx1, 30, [[0, 'rgba(160,120,70,0)'], [1, 'rgba(140,100,60,0.5)']]);
  hs.restore();
  for (const x of [26, 118, 250, 340, 430, 520, 600, 680]) poplar(hs, r, x, fnH(x) + 3, r.r(22, 30), { trunk: '#5a4a3a', leaves: ['#b0782a', '#e0a83a', '#f8d870'] }, -1);
  const MP = { lit: '#f0e8d8', mid: '#d0c6b2', dark: '#a0947e', cap: '#7a5a3a', moss: true };
  for (const x of [66, 212, 472, 622]) vWindmill(hs, r, x, fnH(x) + 3, 0.9, MP);
  for (const [x0, x1] of [[150, 196], [300, 360], [540, 580]]) for (let x = x0; x < x1; x += r.r(8, 14)) smallHouse(hs, r, x, fnH(x) + 4, r.i(7, 10), r.i(5, 7), { gable: false });
  // the cathedral's hill: stone houses in terraces up to its platform, the cathedral on top
  const hl = L('hill', { depth: 0.22 });
  const cx1 = S(0.22);
  const fnC = vProfile([[250, 198], [330, 190], [400, 170], [450, 146], [500, 122], [530, 112], [556, 110], [650, 110], [680, 114], [720, 126], [770, 136], [cx1, 146]]);
  vLand(hl, fnC, 250, cx1, 204, '#a88a4a');
  hl.save(); hl.globalCompositeOperation = 'source-atop';
  for (let x = 250; x < cx1; x++) { const d = fnC(x + 3) - fnC(x - 3); rect(hl, x, fnC(x), 1, 90, d < -1 ? '#bea05a' : d > 1 ? '#8a6e3c' : '#a88a4a'); }
  texture(hl, r, 250, 100, cx1 - 250, 104, 0.08, 2);
  hl.restore();
  // a limestone outcrop on the lower slope
  poly(hl, [[372, 192], [384, 166], [404, 156], [426, 160], [434, 180], [430, 194]], '#c8bca4');
  poly(hl, [[372, 192], [384, 166], [404, 156], [398, 176], [388, 194]], '#e0d6c0');
  for (let k = 0; k < 8; k++) line(hl, r.r(384, 428), r.r(160, 168), r.r(384, 428), r.r(176, 190), '#a89c84', 1);
  // trees on the slopes, rooted in them
  for (let i = 0; i < 70; i++) { const x = r.r(270, cx1), y = fnC(x) + r.r(4, 50); if (y > 200) continue; crown(hl, r, x, y - 3, r.r(4, 8), r.r(3, 6), vAutumn(r), { x: -0.7, y: -0.7 }, 10); }
  // the houses, stepping up the slope toward the cathedral and down the far side
  hillTown(hl, r, fnC, 360, 540, 70, { wMin: 9, wMax: 15, hMin: 8, hMax: 12, sink: 18 });
  hillTown(hl, r, fnC, 676, cx1, 46, { wMin: 9, wMax: 15, hMin: 8, hMax: 12, sink: 16 });
  // the platform and its terrace wall, and the cathedral on it
  terrace(hl, r, 540, 682, 104, fnC, { gap: 14 });
  const spires = vCathedral(hl, r, 556, 104, 0.44);
  hillTown(hl, r, fnC, 470, 548, 16, { wMin: 10, wMax: 14, hMin: 9, hMax: 12, sink: 24 });
  // nearer: poplars along the fields, a farm among its mulberries, the town's back rooftops
  const mid = L('mid', { depth: 0.5 });
  const mx1 = S(0.5);
  hill(mid, r, -40, 420, 196, 22, '#a8903e');
  // where the river opens toward the sea: the lighthouse on its pillar of rock, the water breaking round it
  const inlet = [[-40, 196], [-26, 164], [8, 158], [70, 158], [96, 170], [108, 196]];
  mid.save(); mid.beginPath(); mid.moveTo(inlet[0][0], inlet[0][1]); for (const p of inlet) mid.lineTo(p[0], p[1]); mid.closePath(); mid.clip();
  vgrad(mid, -40, 158, 150, 38, [[0, '#8ab8dc'], [1, '#5a8ec0']]);
  for (let i = 0; i < 60; i++) rect(mid, r.r(-30, 100), r.r(159, 195), r.r(3, 9), 1, r.pick(['#ffffff', '#cfe4f4', '#4a7aa8']));
  mid.restore();
  const lamp = vLighthouse(mid, r, 32, 180, 0.95, { rock: '#8a7a6a', rockLit: '#b8a488', rockDark: '#5e5048', wall: '#d8c09a', wallLit: '#f0dcb8', wallDark: '#a88c6a', glass: '#fff0c0', glassLit: '#ffffff', dome: '#6a6e7e' });
  for (let i = 0; i < 50; i++) { const a = r.r(-1, 1); ellipse(mid, 32 + a * 30 + r.r(-3, 3), 179 - r.r(0, 5), r.r(2, 5), r.r(1, 2.2), r.pick(['#ffffff', '#eef6fc', '#cfe4f4'])); }
  for (let x = 150; x < 300; x += r.r(22, 40)) poplar(mid, r, x, 192, r.r(40, 56), { trunk: '#5a4a3a', leaves: ['#a86a1e', '#e0a030', '#f8d468'] }, -1);
  frHouse(mid, r, 150, 190, 40, 20, { wall: '#b8b2a4', wallDark: '#948e80', wallLight: '#d0cabc', roof: '#a8583a', roofDark: '#7a3e28', windows: [[8, 5, 5, 7, { frame: '#8a8478' }], [26, 5, 5, 7, { frame: '#8a8478' }]], chimney: 0.7 });
  moss(mid, r, 150, 180, 40, 10, 14);
  for (const x of [120, 206, 236]) mulberry(mid, r, x, 194, r.r(20, 28));
  for (let x = 380; x < mx1; x += r.r(26, 44)) {
    const w = r.r(24, 40), hh = r.r(30, 50), wall = r.pick(VIL.walls);
    stoneFace(mid, r, x, 196 - hh, w, hh, vShade(wall, -0.06), { course: 3, min: 3, max: 6 });
    rect(mid, x, 196 - hh, 1, hh, vShade(wall, 0.18));
    poly(mid, [[x - 2, 196 - hh], [x + w + 2, 196 - hh], [x + w - 2, 188 - hh], [x + 2, 188 - hh]], r() < 0.4 ? VIL.slate : VIL.roof);
    for (let i = 0; i < w * 0.4; i++) px(mid, x + r.r(0, w), 196 - hh - r.r(1, 6), r.pick(VIL.moss));
    rect(mid, x + w * 0.7, 184 - hh, 4, 8, vShade(wall, -0.25));
    if (r() < 0.5) crown(mid, r, x + w / 2, 200 - hh, r.r(10, 16), r.r(7, 10), vAutumn(r), { x: -0.7, y: -0.7 }, 14);
  }
  // the town itself
  const g = L('ground', { depth: 1 });
  bank(g, r, 0, W, { grass0: '#b4a04a', grass1: '#94823a', tip: '#dcc86e', earth: '#7a6448', dark: '#4a3a2a', stone: '#9a9284' });
  // the meadow: a path through the autumn flowers, mulberry trees, a dry stone wall, bee hives
  vgrad(g, 0, 184, 440, 20, [[0, '#b09a48'], [1, '#98843c']]);
  rect(g, 0, GY - 3, 440, 4, '#c0ac84');
  stoneWall(g, r, 70, 230, GY - 4, 12);
  for (const [x, hh] of [[30, 54], [150, 46], [270, 58], [390, 48]]) mulberry(g, r, x, GY - 4, hh);
  for (const x of [196, 212]) { rect(g, x, GY - 14, 10, 10, '#f4ece0'); rect(g, x - 1, GY - 16, 12, 3, '#a8a294'); for (let k = 0; k < 3; k++) rect(g, x, GY - 12 + k * 3, 10, 1, '#d8ccb8'); rect(g, x + 4, GY - 6, 2, 1, '#3a2a1e'); }
  wildflowers(g, r, 0, 440, GY - 16, GY - 2, 900);
  leafLitter(g, r, 0, 440, GY - 6, GY + 1, 500);
  rect(g, 330, GY - 28, 3, 26, VIL.stone); rect(g, 324, GY - 22, 15, 3, VIL.stone);
  for (let i = 0; i < 8; i++) px(g, 324 + r.r(0, 15), GY - 22 + r.r(0, 3), VIL.moss[r.i(0, 2)]);
  // the silk mill, and the wash-house by the water
  vMill(g, r, 440, GY - 2, 190, 76);
  vLavoir(g, r, 672, GY - 2, 62);
  // the quay: paving, and the town houses shoulder to shoulder
  rect(g, 440, GY - 3, 1160, 5, '#b8b2a2');
  for (let x = 440; x < 1600; x += 6) rect(g, x, GY - 3 + ((x / 6) % 2), 5, 1, '#9a9484');
  rect(g, 440, GY + 2, 1160, WY - GY - 2, '#948e80');
  for (let x = 440; x < 1600; x += r.r(10, 18)) rect(g, x, GY + r.i(3, 6), r.r(5, 9), 1, '#7a7466');
  for (let x = 440; x < 1600; x += r.r(3, 9)) px(g, x, GY + r.i(2, 7), r.pick(VIL.moss));
  const plan = [[52, 70, { ivy: 'left', moss: 0.5 }], [66, 84, { shop: true, sign: 11, awning: ['#b83a3a', '#f4ece0'], goods: '#d8a050' }], [54, 76, { slate: true, ivy: 'right' }], [60, 90, { moss: 0.6 }], [72, 78, { shop: true, sign: 4, awning: ['#3a7a5a', '#f4ece0'], shopGlass: '#f8e0b0', goods: '#8a5a3a' }], [50, 72, { vine: 'rose' }], [62, 94, { slate: true, ivy: 'left', moss: 0.5 }], [56, 80, {}], [60, 72, { shop: true, sign: 6, awning: ['#3a5aa8', '#f4ece0'], goods: '#e8a04a' }]];
  let hx = 748;
  for (const [w, hh, o] of plan) { vHouse(g, r, hx, GY - 3, w, hh, o); hx += w + 2; }
  // tables outside the café, lamps along the quay, and plane trees shading it all
  for (const x of [1034, 1062]) { rect(g, x, GY - 12, 12, 2, '#f4ece0'); rect(g, x + 5, GY - 10, 2, 7, '#3a3030'); rect(g, x - 4, GY - 9, 2, 6, '#3a3030'); rect(g, x + 14, GY - 9, 2, 6, '#3a3030'); rect(g, x + 3, GY - 15, 2, 3, '#c83a3a'); }
  for (const x of [870, 1010, 1160]) { rect(g, x, GY - 40, 2, 38, '#2e3440'); rect(g, x - 2, GY - 46, 6, 7, '#3a4050'); rect(g, x - 1, GY - 45, 4, 5, '#ffe6a8'); glow(g, x + 1, GY - 42, 12, 'rgba(255,220,140,0.45)'); }
  for (const x of [800, 944, 1096, 1240]) planeTree(g, r, x, GY - 3, r.r(88, 100));
  leafLitter(g, r, 740, 1600, GY - 4, GY + 2, 700);
  for (const x of [830, 1126]) { rect(g, x, GY - 8, 20, 2, '#6a4a30'); rect(g, x, GY - 12, 20, 2, '#6a4a30'); rect(g, x + 1, GY - 6, 2, 4, '#3a2a20'); rect(g, x + 17, GY - 6, 2, 4, '#3a2a20'); }
  // the guinguette on the water's edge under its lanterns
  vGuinguette(g, r, 1300, GY - 2, 104);
  // the church and its square, the fountain
  vChurch(g, r, 1418, GY - 3, 1);
  vFountain(g, 1560, GY - 2);
  // home: the garden fence and gate, the Joncour house under its roses, the garden, a mulberry
  vHouse(g, r, 1690, GY - 3, 112, 86, { wall: '#c4bfb4', shutters: '#4a6a8a', slate: true, vine: 'rose', door: '#4a5e86', doorAt: 50, chimney: 0.8, moss: 0.4 });
  for (let x = 1604; x < 1916; x += 6) { if (x > 1640 && x < 1660) continue; rect(g, x, GY - 14, 3, 12, '#f0ece2'); poly(g, [[x, GY - 14], [x + 3, GY - 14], [x + 1.5, GY - 16]], '#f0ece2'); }
  rect(g, 1604, GY - 11, 312, 2, '#dcd6ca'); rect(g, 1604, GY - 6, 312, 2, '#dcd6ca');
  rect(g, 1640, GY - 18, 2, 16, '#c8c0b0'); rect(g, 1660, GY - 18, 2, 16, '#c8c0b0');
  for (const [x, w] of [[1620, 16], [1672, 14], [1818, 18], [1860, 16]]) roseBush(g, r, x, GY - 2, w);
  lavender(g, r, 1804, 1900, GY - 2);
  rect(g, 1838, GY - 9, 22, 2, '#8a6a4a'); rect(g, 1838, GY - 14, 22, 2, '#8a6a4a'); rect(g, 1840, GY - 7, 2, 5, '#5a4030'); rect(g, 1856, GY - 7, 2, 5, '#5a4030');
  mulberry(g, r, 1896, GY - 3, 64);
  wildflowers(g, r, 1600, 1920, GY - 6, GY - 1, 160, ['#e0305a', '#f06a8a', '#ffffff', '#f08a2a', '#f4d23a']);
  leafLitter(g, r, 1600, 1920, GY - 4, GY + 2, 260);
  // tall grasses and asters at the water's edge, nearest of all, bending in the breeze
  const fr = L('front', { depth: 1.3, anim: sway(2.4, 3.8) });
  for (let i = 0; i < 70; i++) {
    const x = r() * W, hh = r.r(12, 36);
    if (r() < 0.5) {
      line(fr, x, H, x + r.r(-3, 3), H - hh, '#6a6a2a', 1);
      ellipse(fr, x, H - hh, 2.2, 1.8, r.pick(['#9a5ad0', '#f08a2a', '#ffffff', '#f4d23a', '#e0302a', '#c8305a']));
      px(fr, x, H - hh, '#3a2a1e');
    } else line(fr, x, H, x + r.r(-4, 4), H - hh, r.pick(['#8a7a3a', '#a8904a', '#c8a85a']), 1);
  }
  return { colors: 150, vignette: [0.16, '40,30,20'], anchors: { spires, lamp } };
};

// ---------------------------------------------------------------- across the steppe, at sunset
WALKS.steppe = (c, L) => {
  const r = rng(411);
  vgrad(c, 0, 0, 480, WY, [[0, '#2a2a5e'], [0.4, '#7a4e7a'], [0.7, '#e2866a'], [0.9, '#ffc27a'], [1, '#ffe2a8']]);
  sun(c, 330, 168, 16, '#fff0c8', 'rgba(255,160,90,0.6)');
  stars(c, r, 30, 0, 0, 480, 60);
  const cl = L('clouds', { depth: 0.05, anim: { type: 'drift', t: 260 } });
  for (let x = 0; x < S(0.1); x += 220) cloudBand(cl, r, x + r.r(0, 60), r.r(26, 100), r.r(140, 240), r.r(5, 9), { body: '#6a4a72', rim: '#ffa878', shadow: '#503a60', hi: '#ffd8a8', lightFromBelow: true });
  const far = L('far', { depth: 0.12 });
  ridge(far, r, 172, 44, '#6a4a6e', { x1: S(0.12), peak: [320, 60, 18] });
  ridge(far, r, 182, 22, '#5e4262', { x1: S(0.12) });
  const mid = L('mid', { depth: 0.4 });
  vgrad(mid, 0, 180, S(0.4), 24, [[0, '#b08a5a'], [1, '#806838']]);
  for (let x = 0; x < S(0.4); x += r.r(24, 60)) if (r() < 0.6) birch(mid, r, x, 190, r.r(20, 34), ['#3a4a2a', '#5a6a34', '#8a9a4a']);
  // a village of wooden houses and a church with an onion dome, halfway across Russia
  for (const [x, w] of [[600, 26], [640, 22], [700, 30]]) { rect(mid, x, 176, w, 14, '#6a4a30'); poly(mid, [[x - 3, 176], [x + w + 3, 176], [x + w / 2, 164]], '#4a3a2a'); rect(mid, x + w / 2 - 2, 180, 4, 5, '#ffcf72'); glow(mid, x + w / 2, 182, 10, 'rgba(255,190,90,0.5)'); }
  rect(mid, 670, 150, 14, 40, '#e8e0d0'); ellipse(mid, 677, 148, 9, 9, '#3a8a6a'); poly(mid, [[677, 132], [673, 142], [681, 142]], '#3a8a6a'); rect(mid, 676, 126, 2, 7, '#e8c040'); rect(mid, 674, 128, 6, 1, '#e8c040');
  const g = L('ground', { depth: 1 });
  vgrad(g, 0, 190, W, 14, [[0, '#a88a50'], [1, '#806a3a']]);
  bank(g, r, 0, W, { grass0: '#a0904a', grass1: '#7a6a34', tip: '#d0b870', earth: '#6a4e34', dark: '#3a2a1e', stone: '#8a7a6a' });
  // milestones, a caravan's cart, a shrine at a crossroads, a raft on the river, then the harbour
  for (let x = 160; x < W - 300; x += 360) { rect(g, x, GY - 14, 5, 12, '#a8a090'); rect(g, x, GY - 14, 5, 2, '#d8d0c0'); }
  rect(g, 820, GY - 22, 44, 12, '#6a4a2a'); for (const x of [828, 856]) { circle(g, x, GY - 8, 6, '#3a2a1a'); circle(g, x, GY - 8, 2, '#8a6a3a'); }
  poly(g, [[818, GY - 22], [866, GY - 22], [858, GY - 38], [826, GY - 38]], '#c8b890');
  rect(g, 1240, GY - 26, 3, 24, '#5a3a24'); rect(g, 1234, GY - 26, 16, 10, '#7a5a3a'); rect(g, 1238, GY - 22, 8, 5, '#e8c070');
  // Lake Baikal: the water opens up wide
  for (let x = 1500; x < 1900; x += 3) rect(g, x, GY - 2 - Math.max(0, Math.sin((x - 1500) / 400 * Math.PI) * 6), 3, 4, '#c8b888');
  // the harbour at the edge of the continent: a pier and the smuggler's boat
  rect(g, 2180, GY - 4, W - 2180, 4, '#5a3e2a');
  for (let x = 2190; x < W; x += 30) rect(g, x, GY - 2, 4, 18, '#3a2a1e');
  poly(g, [[2290, GY + 4], [2380, GY + 2], [2372, GY + 14], [2300, GY + 14]], '#2a1e1a');
  rect(g, 2330, GY - 50, 2, 52, '#2a1e1a'); poly(g, [[2332, GY - 48], [2362, GY - 40], [2332, GY - 8]], '#d8ccb0');
  for (const x of [2220, 2400]) { rect(g, x, GY - 30, 2, 28, '#2a1e1a'); ellipse(g, x + 1, GY - 30, 4, 5, '#ffb050'); glow(g, x + 1, GY - 30, 16, 'rgba(255,160,70,0.5)'); }
  const fr = L('front', { depth: 1.3, anim: sway(4, 3) });
  reeds(fr, r, ['#6a5a2a', '#8a7a3a', '#b0a050'], 140);
  return { colors: 64, vignette: [0.35, '30,10,30'] };
};

// ---------------------------------------------------------------- Hara Kei's village, at dusk in the fog
// A town of the shoguns' Japan in the hills, and it feels wrong to be here: the white castle above
// it all in the mist, pagodas and temple roofs, the upper town on its terraces, then the street:
// a torii, thatched farmhouses, stalls and townhouses under their lanterns, a stage for the street
// players, an archery butt, the walls of the samurai quarter and, at the end, Hara Kei's gate.
// The fog, the falling petals, the people, the arrows and the drums are the walk's.
WALKS.village = (c, L) => {
  const r = rng(421);
  const HAZE = (a) => `rgba(140,84,100,${a})`;
  // the last of the sunset, gone the colour of wine; a pale moon with a reddish ring
  vgrad(c, 0, 0, 480, WY, [[0, '#120c20'], [0.28, '#2a1834'], [0.5, '#4e2238'], [0.7, '#80343a'], [0.86, '#b45a3c'], [1, '#d07a48']]);
  glow(c, 240, 190, 260, 'rgba(255,120,60,0.28)');
  circle(c, 414, 38, 8, '#ecd4cc'); circle(c, 416, 37, 7, '#f4e2da'); glow(c, 414, 38, 46, 'rgba(240,170,150,0.32)');
  stars(c, r, 14, 0, 0, 480, 40, '#e8d8e8');
  c.clearRect(0, WY, 480, H - WY);
  const cl = L('clouds', { depth: 0.04, anim: { type: 'drift', t: 360 } });
  wrapped(cl, 141, (cc, rr) => {
    for (const [x, y, w, h] of [[20, 26, 180, 8], [250, 58, 200, 7], [390, 16, 130, 5], [110, 84, 150, 5]]) cloudBand(cc, rr, x, y, w, h, { body: '#2a1626', rim: '#c0583a', shadow: '#1a0e1a', hi: '#e8884a', lightFromBelow: true });
  });
  // Mount Yōtei, filling the far sky: snow on its shoulders catching the last light
  const pk = L('peaks', { depth: 0.03 });
  const px1 = S(0.03);
  ridge(pk, r, 176, 34, '#4a2a40', { x1: px1 });
  jpYotei(pk, r, 206, 170, 480, 146, { rock: '#2e2030', rockMid: '#43283a', rockLit: '#5a3040', snow: '#b48c9a', snowLit: '#eab4a8', snowShade: '#6a5a7c', forest: '#1e1422', haze: HAZE(0.85) });
  ridge(pk, r, 182, 18, '#3a2234', { x1: px1 });
  pk.save(); pk.globalCompositeOperation = 'source-atop'; vgrad(pk, 0, 140, px1, 50, [[0, HAZE(0)], [1, HAZE(0.7)]]); pk.restore();
  // the castle hill: pines and cherry trees in blossom, the white keep and its little keep, the walls
  // with their turrets, two pagodas, temple roofs on the terraces; lights coming on everywhere
  const ca = L('castle', { depth: 0.08 });
  const cx1 = S(0.08);
  const fnK = vProfile([[-10, 186], [80, 166], [150, 150], [250, 126], [310, 112], [410, 112], [480, 132], [560, 150], [cx1 + 10, 168]]);
  vLand(ca, fnK, -10, cx1 + 10, 200, '#2e2232');
  for (let i = 0; i < 70; i++) { const x = r.r(0, cx1), y = fnK(x) + r.r(4, 46); pine(ca, r, x, y, r.r(10, 18), { trunk: '#1e1622', leaves: ['#1e1a28', '#2a2434', '#3a3244'] }, r() < 0.5 ? 1 : -1); }
  for (let i = 0; i < 60; i++) { const x = r.r(0, cx1), y = fnK(x) + r.r(6, 50); crown(ca, r, x, y, r.r(5, 10), r.r(4, 7), r() < 0.6 ? ['#6a3048', '#a8587a', '#d88aa8', '#f4c0d0'] : ['#6a6070', '#a8a0b0', '#d8d0dc', '#f4eef4'], { x: -0.6, y: -0.8 }, 16); }
  // terraced walls up the hill
  for (const [x0, x1, y] of [[140, 290, 152], [200, 300, 136], [420, 560, 140], [430, 520, 126]]) { rect(ca, x0, y, x1 - x0, 3, '#6a5e6a'); rect(ca, x0, y, x1 - x0, 1, '#8a7e86'); }
  // temple roofs on the terraces
  for (const [x, y, w] of [[168, 150, 30], [236, 134, 26], [470, 138, 34], [520, 152, 26]]) { rect(ca, x, y - 6, w, 6, '#4a3a44'); poly(ca, [[x - 4, y - 6], [x + w + 4, y - 6], [x + w - 2, y - 11], [x + 2, y - 11]], '#221a26'); jpLights(ca, r, x + 2, y - 3, w - 4, 2); }
  const CP = { stone: '#6e6270', stoneLit: '#8e8290', stoneDark: '#4e4452', wall: '#d6c8cc', wallLit: '#ecdcdc', wallShade: '#a4949e', board: '#241c28', window: '#3a2e3a', lit: '#ffb860', roof: '#2a2434', roofLit: '#5a4e62', gold: '#e0a848' };
  const ct = jpCastle(ca, r, 384, 112, 0.92, CP);
  jpCastle(ca, r, 284, 128, 0.5, CP);
  jpLights(ca, r, 352, 76, 64, 10, { cols: ['#ffb050', '#ff8a3a'] });
  // the walls along the crest, with corner turrets
  rect(ca, 250, 114, 180, 3, CP.wall); rect(ca, 250, 112, 180, 2, CP.roof);
  for (const [yx, yy] of [[250, 120], [430, 120], [470, 132]]) { rect(ca, yx - 8, yy - 12, 16, 12, CP.wall); rect(ca, yx - 8, yy - 4, 16, 4, CP.board); poly(ca, [[yx - 11, yy - 12], [yx + 11, yy - 12], [yx + 6, yy - 17], [yx - 6, yy - 17]], CP.roof); rect(ca, yx - 2, yy - 9, 4, 2, '#ffb050'); }
  pagoda(ca, 104, fnK(104) + 2, 3.4, '#2a2232', '#6a4a5a');
  pagoda(ca, 560, fnK(560) + 2, 2.8, '#2a2232', '#6a4a5a');
  for (const px_ of [104, 560]) for (let k = 0; k < 6; k++) rect(ca, px_ - 1, fnK(px_) - 6 - k * 9.5, 2, 1, '#ffb050');
  jpTorii(ca, 196, fnK(196) + 2, 0.7);
  jpLights(ca, r, 0, 150, cx1, 50, {});
  for (let i = 0; i < 26; i++) { const x = r.r(0, cx1); glow(ca, x, fnK(x) + r.r(8, 40), 8, 'rgba(255,130,50,0.4)'); }
  ca.save(); ca.globalCompositeOperation = 'source-atop'; vgrad(ca, 0, 110, cx1, 90, [[0, HAZE(0.08)], [1, HAZE(0.75)]]); ca.restore();
  // the upper town on its terraces: roofs crowding up the slope, nearly every window lit, cherry
  // and white blossom between the roofs, strings of lanterns, a temple and a third pagoda
  const up = L('uptown', { depth: 0.2 });
  const ux1 = S(0.2);
  const fnU = vProfile([[-10, 176], [120, 160], [260, 150], [400, 156], [560, 146], [700, 158], [ux1 + 10, 164]]);
  vLand(up, fnU, -10, ux1 + 10, 205, '#3a2c3a');
  for (let x = 0; x < ux1; x += 50) { rect(up, x, fnU(x) + 6, 46, 2, '#5a4a58'); }
  const roofs = [];
  for (let i = 0; i < 95; i++) { const w = r.i(12, 22), x = r.r(-10, ux1), yb = Math.max(fnU(x), fnU(x + w)) + r.r(4, 34); roofs.push([x, w, yb]); }
  roofs.sort((p, q) => p[2] - q[2]);
  for (const [x, w, yb] of roofs) {
    const hh = r.i(7, 11);
    rect(up, x, yb - hh, w, hh, '#7a6a76');
    if (r() < 0.8) { const lw = r.i(3, 6); rect(up, x + 2, yb - hh + 2, lw, 3, r() < 0.85 ? r.pick(['#ffb050', '#ff9a40', '#ffc870']) : '#3a2e3a'); if (r() < 0.4 && w > 14) rect(up, x + w - 6, yb - hh + 2, 3, 3, '#ffa848'); if (r() < 0.5) glow(up, x + 4, yb - hh + 3, 10, 'rgba(255,130,50,0.35)'); }
    poly(up, [[x - 3, yb - hh], [x + w + 3, yb - hh], [x + w - 2, yb - hh - 5], [x + 2, yb - hh - 5]], '#2a2232');
    if (r() < 0.3) jpCrow(up, x + r.r(3, w - 3), yb - hh - 5, r() < 0.5 ? 1 : -1);
    if (r() < 0.42) crown(up, r, x + w + 4, yb - 9, r.r(6, 11), r.r(5, 8), r() < 0.6 ? JP.sakura : JP.blossomWhite, { x: -0.6, y: -0.8 }, 16);
  }
  rect(up, 300, fnU(300) - 2, 60, 14, '#5a4a54'); poly(up, [[292, fnU(300) - 2], [368, fnU(300) - 2], [356, fnU(300) - 14], [304, fnU(300) - 14]], '#221a28'); jpLights(up, r, 304, fnU(300) + 4, 52, 6);
  pagoda(up, 652, fnU(652) + 6, 3, '#2a2232', '#6a4a5a');
  for (let x = 20; x < ux1 - 60; x += r.r(80, 140)) jpLanternString(up, x, fnU(x) + 8, x + 50, fnU(x + 50) + 9, 6, ['#e8402e', '#ff8a3a', '#f4ecd8']);
  up.save(); up.globalCompositeOperation = 'source-atop'; vgrad(up, 0, 130, ux1, 80, [[0, HAZE(0.12)], [1, HAZE(0.55)]]); up.restore();
  // nearer: the town's roofs, the temple and its pagoda, the fire-watch tower, cherry and white
  // blossom thick between them, pines, red lanterns at the doors, crows on the ridges
  const mid = L('mid', { depth: 0.45 });
  const mx1 = S(0.45);
  vgrad(mid, 0, 176, mx1, 20, [[0, '#3e3040'], [1, '#2e2432']]);
  for (let x = -10; x < mx1; x += r.r(24, 46)) {
    const w = r.r(22, 44), hh = r.r(16, 26), yb = 190;
    rect(mid, x, yb - hh, w, hh, '#5a4a58');
    if (r() < 0.85) { rect(mid, x + w * 0.3, yb - hh + 4, w * 0.4, 5, r() < 0.85 ? '#ffaa50' : '#3a2e3a'); glow(mid, x + w * 0.5, yb - hh + 6, 14, 'rgba(255,140,60,0.35)'); }
    poly(mid, [[x - 4, yb - hh], [x + w + 4, yb - hh], [x + w - 3, yb - hh - 8], [x + 3, yb - hh - 8]], '#241c2a');
    rect(mid, x + 2, yb - hh - 9, w - 4, 1, '#4e4054');
    if (r() < 0.45) jpChochin(mid, x + w * 0.2, yb - hh + 2, '#d8402e', 0.8);
    if (r() < 0.25) jpCrow(mid, x + r.r(4, w - 4), yb - hh - 9, r() < 0.5 ? 1 : -1);
  }
  pagoda(mid, 96, 186, 4, '#241c2a', '#5a4658');
  for (let k = 0; k < 5; k++) rect(mid, 96 - 2, 186 - 12 - k * 22.4, 4, 2, '#ffb050');
  // the temple hall: a great roof
  rect(mid, 640, 150, 90, 40, '#4e4250'); for (let k = 650; k < 725; k += 12) rect(mid, k, 162, 6, 20, '#ffa850');
  glow(mid, 685, 172, 50, 'rgba(255,140,60,0.4)');
  poly(mid, [[620, 152], [750, 152], [728, 126], [642, 126]], '#241c2a'); rect(mid, 642, 124, 86, 3, '#4e4054');
  poly(mid, [[616, 154], [624, 146], [630, 152]], '#241c2a'); poly(mid, [[754, 154], [746, 146], [740, 152]], '#241c2a');
  jpChochin(mid, 632, 156, '#d8402e', 1.2); jpChochin(mid, 738, 156, '#d8402e', 1.2);
  // the fire-watch tower with its bell
  for (const k of [-6, 6]) line(mid, 520 + k, 190, 520 + k * 0.4, 110, '#221c28', 2);
  for (let y = 120; y < 188; y += 10) line(mid, 514, y, 526, y + 8, '#221c28', 1);
  rect(mid, 512, 106, 16, 3, '#221c28'); poly(mid, [[510, 106], [530, 106], [520, 98]], '#241c2a'); ellipse(mid, 520, 103, 2, 2.4, '#b8903a');
  jpCrow(mid, 520, 97, 1);
  // a second pagoda further in, and a torii at the shrine steps
  pagoda(mid, 960, 186, 3.2, '#241c2a', '#5a4658');
  jpTorii(mid, 880, 190, 0.9);
  for (let x = 14; x < mx1; x += r.r(46, 80)) { if (Math.abs(x - 96) < 26 || (x > 610 && x < 760) || Math.abs(x - 960) < 22) continue; if (r() < 0.72) jpSakura(mid, r, x, 192, r.r(44, 62), r() < 0.55 ? JP.sakura : JP.blossomWhite); else pine(mid, r, x, 192, r.r(36, 50), { trunk: '#1c1620', leaves: ['#1a1e28', '#242a34', '#343c48'] }, r() < 0.5 ? 1 : -1); }
  mid.save(); mid.globalCompositeOperation = 'source-atop'; vgrad(mid, 0, 100, mx1, 96, [[0, HAZE(0.06)], [1, HAZE(0.3)]]); mid.restore();
  // the street itself
  const g = L('ground', { depth: 1 });
  vgrad(g, 0, 186, W, 20, [[0, '#4a4046'], [1, '#342c32']]);
  bank(g, r, 0, W, { grass0: '#4a4a44', grass1: '#34342e', tip: '#6a6a5a', earth: '#3a2e2a', dark: '#1a1414', stone: '#6a6670' });
  // the road, packed earth, then stones set in it through the town
  rect(g, 0, GY - 4, W, 5, '#6a5c56');
  for (let x = 200; x < 1700; x += r.r(7, 12)) { rect(g, x, GY - 4 + r.i(0, 2), r.r(5, 9), 3, r.pick(['#7a7280', '#6a6470', '#8a8290'])); }
  // the outskirts: a Jizo with his red bib, a stone lantern, pines, bamboo
  for (let x = 0; x < 140; x += 5) { rect(g, x, GY - r.r(40, 70), 2, 70, r.pick(['#3a5a3a', '#4a6a44', '#2e4a30'])); }
  rect(g, 40, GY - 12, 8, 10, '#8a8690'); circle(g, 44, GY - 15, 4, '#8a8690'); rect(g, 40, GY - 11, 8, 4, '#c83a3a');
  jpStoneLantern(g, 110, GY - 2, 1);
  jpTorii(g, 160, GY - 2, 1.2);
  // the first houses: thatched farmhouses, sake barrels, a well
  jpMinka(g, r, 196, GY - 2, 70, 24);
  jpBarrels(g, 272, GY - 2, 3);
  jpMinka(g, r, 310, GY - 2, 60, 22);
  rect(g, 382, GY - 12, 14, 10, JP.stone); for (const k of [382, 394]) rect(g, k, GY - 30, 2, 18, JP.wood); rect(g, 380, GY - 32, 18, 2, JP.wood); circle(g, 389, GY - 27, 2, JP.woodLit);
  // the merchants' street: townhouses behind, stalls before them, banners
  let hx = 420;
  for (const [w, hh, o] of [[56, 46, { shop: true, sign: true }], [48, 42, { shop: true, noren: '#6a2430' }], [60, 48, { shop: true, sign: true, noren: '#2e5044' }], [52, 44, { shop: true }]]) { jpMachiya(g, r, hx, GY - 2, w, hh, o); hx += w + 2; }
  jpStall(g, r, 428, GY - 2, 30, 'fish'); jpStall(g, r, 484, GY - 2, 30, 'cloth'); jpStall(g, r, 540, GY - 2, 28, 'masks'); jpStall(g, r, 594, GY - 2, 28, 'food');
  for (const [x, col] of [[418, '#26345e'], [526, '#6a2430'], [634, '#e8e0d0']]) jpNobori(g, r, x, GY - 2, 50, col, col === '#e8e0d0' ? '#26345e' : '#f4ecd8');
  jpStoneLantern(g, 646, GY - 2, 1.1);
  // the square where the street players perform, lanterns strung over it
  jpStage(g, 690, GY - 2, 80);
  for (const x of [668, 792]) jpNobori(g, r, x, GY - 2, 56, x < 700 ? '#c8303a' : '#26345e');
  jpLanternString(g, 660, GY - 62, 730, GY - 64, 6, ['#d8402e', '#f4ecd8']);
  jpLanternString(g, 730, GY - 64, 800, GY - 62, 6, ['#f4ecd8', '#d8402e']);
  hx = 806;
  for (const [w, hh] of [[44, 42], [52, 46]]) { jpMachiya(g, r, hx, GY - 2, w, hh, { shop: r() < 0.5 }); hx += w + 2; }
  // the archery butt (the archers and their arrows are the walk's)
  jpAzuchi(g, 990, GY - 2, 56, [1004, 1018, 1032]);
  rect(g, 890, GY - 3, 50, 2, JP.woodLit);
  jpNobori(g, r, 950, GY - 2, 46, '#e8e0d0', '#6a2430');
  // the samurai quarter: cherries over a walled lane, then more townhouses and a little shrine
  for (const x of [1100, 1170, 1240]) jpSakura(g, r, x, GY - 30, 62, x === 1170 ? JP.blossomWhite : JP.sakura);
  jpWall(g, r, 1070, 1300, GY - 2, 12, 22);
  jpStoneLantern(g, 1310, GY - 2, 1);
  rect(g, 1322, GY - 14, 14, 12, JP.wood); poly(g, [[1319, GY - 14], [1339, GY - 14], [1329, GY - 22]], JP.roof); rect(g, 1326, GY - 11, 6, 5, JP.lit);
  hx = 1350;
  for (const [w, hh, o] of [[50, 44, { shop: true }], [46, 40, {}], [58, 48, { sign: true }], [48, 42, { shop: true }], [52, 44, {}], [46, 40, { shop: true }]]) { jpMachiya(g, r, hx, GY - 2, w, hh, o); hx += w + 2; }
  jpSakura(g, r, 1500, GY - 2, 70, JP.blossomWhite);
  jpSakura(g, r, 1640, GY - 2, 64, JP.sakura);
  // Hara Kei's estate: the long wall, the great gate, the house's roof above the wall, lanterns
  poly(g, [[1720, GY - 36], [1920, GY - 36], [1900, GY - 62], [1740, GY - 62]], JP.roof);
  rect(g, 1740, GY - 64, 160, 3, JP.roofLit);
  for (let k = 1750; k < 1890; k += 3) px(g, k, GY - 50, JP.roofDark);
  jpWall(g, r, 1700, 1774, GY - 2, 10, 24);
  jpWall(g, r, 1826, 1920, GY - 2, 10, 24);
  jpGate(g, r, 1800, GY - 2);
  for (const x of [1760, 1840]) { rect(g, x, GY - 40, 3, 38, '#3a2a22'); jpChochin(g, x + 1, GY - 40, '#d8402e', 1.2); }
  jpSakura(g, r, 1690, GY - 30, 56, JP.sakura);
  // dark grasses at the water's edge, nearest of all
  const fr = L('front', { depth: 1.3, anim: sway(3, 3.8) });
  reeds(fr, r, ['#1a1a22', '#262632', '#343444'], 110);
  return { colors: 150, vignette: [0.42, '10,6,20'], anchors: { castle: ct } };
};

// ---------------------------------------------------------------- the aviary behind Hara Kei's house, by day
WALKS.aviary = (c, L) => {
  const r = rng(431);
  vgrad(c, 0, 0, 480, WY, [[0, '#6a8ac8'], [0.6, '#b8c8e0'], [1, '#f0e0c8']]);
  sun(c, 380, 40, 10, '#fffbe6', 'rgba(255,240,200,0.5)');
  const cl = L('clouds', { depth: 0.05, anim: { type: 'drift', t: 200 } });
  for (let x = 0; x < S(0.1); x += 200) cumulus(cl, r, x + r.r(0, 60), r.r(20, 70), r.r(80, 140), r.r(14, 22), { dark: '#a4acc8', mid: '#dcdcea', lit: '#fff6e6', lx: -1 });
  const far = L('far', { depth: 0.15 });
  ridge(far, r, 168, 40, '#8a9ab8', { x1: S(0.15) });
  treeLine(far, r, 182, 0, S(0.15), 6, ['#6a7e5a', '#7a8e64']);
  const mid = L('mid', { depth: 0.45 });
  for (let x = 10; x < S(0.45); x += r.r(40, 70)) tree(mid, r, x, 196, r.r(34, 50), { trunk: '#4a3230', trunkDark: '#3a2628', leaves: ['#d88aa8', '#f0b0c8', '#ffd8e4'] });
  const g = L('ground', { depth: 1 });
  vgrad(g, 0, 190, W, 14, [[0, '#8aa05a'], [1, '#6a8040']]);
  bank(g, r, 0, W, { grass0: '#7a9a4a', grass1: '#5a7a34', tip: '#a8c060', earth: '#6a5238', dark: '#3a2c20', stone: '#9a9890' });
  // the great cage: a frame of dark wood, walls of paper lattice, taller than a house
  const ax0 = 200, ax1 = 640, top = GY - 110;
  rect(g, ax0, top, ax1 - ax0, GY - 2 - top, 'rgba(240,232,210,0.35)');
  for (let x = ax0; x <= ax1; x += 10) rect(g, x, top, 1, GY - 2 - top, '#5a4632');
  for (let y = top; y <= GY - 2; y += 10) rect(g, ax0, y, ax1 - ax0, 1, '#5a4632');
  for (const x of [ax0, ax0 + 110, ax0 + 220, ax0 + 330, ax1]) rect(g, x - 2, top - 6, 5, GY - top + 4, '#3a2a1e');
  poly(g, [[ax0 - 14, top], [ax1 + 14, top], [(ax0 + ax1) / 2 + 60, top - 30], [(ax0 + ax1) / 2 - 60, top - 30]], '#39424f');
  for (let k = 0; k < 3; k++) line(g, ax0 - 10 + k * 3, top - 2 - k * 9, ax1 + 10 - k * 3, top - 2 - k * 9, '#5b6878', 1);
  // a koi pond with a little bridge, then the house, where her room is
  ellipse(g, 740, GY + 2, 50, 6, '#3a6a8a'); for (const x of [724, 752]) ellipse(g, x, GY + 2, 4, 1.5, '#ff8a3a');
  poly(g, [[700, GY - 2], [780, GY - 2], [770, GY - 10], [710, GY - 10]], '#b83a2a');
  jpHouse(g, r, 820, GY - 2, 130, 40, { windows: [[20, 12, 34, 16], [74, 12, 34, 16]], roofH: 30, over: 20 });
  rect(g, 870, GY - 28, 30, 26, '#e8dcc0'); for (let k = 0; k < 4; k++) rect(g, 870 + k * 8, GY - 28, 1, 26, '#6a4428');
  const fr = L('front', { depth: 1.3, anim: sway(3, 4) });
  reeds(fr, r, ['#3a5a2a', '#5a7a34', '#8aa050'], 80);
  for (let i = 0; i < 40; i++) ellipse(fr, r() * W, H - r.r(2, 30), 2, 1.4, r.pick(['#f0b0c8', '#ffd8e4']));
  return { colors: 64, vignette: [0.3, '30,20,20'] };
};

// ---------------------------------------------------------------- the burned village
WALKS.ruins = (c, L) => {
  const r = rng(441);
  vgrad(c, 0, 0, 480, WY, [[0, '#1c1214'], [0.4, '#3e1e1e'], [0.75, '#8a3a24'], [1, '#c86a3a']]);
  const cl = L('clouds', { depth: 0.05, anim: { type: 'drift', t: 160 } });
  for (let x = 0; x < S(0.1); x += 180) cloudBand(cl, r, x + r.r(0, 60), r.r(20, 110), r.r(160, 240), r.r(8, 14), { body: '#3a2424', rim: '#a8503a', shadow: '#2a1a1c', hi: '#d88a5a', lightFromBelow: true });
  const far = L('far', { depth: 0.14 });
  ridge(far, r, 172, 44, '#2a1a1e', { x1: S(0.14) });
  ridge(far, r, 184, 22, '#221416', { x1: S(0.14) });
  const mid = L('mid', { depth: 0.45 });
  for (let x = 0; x < S(0.45); x += r.r(40, 90)) bareTree(mid, r, x, 196, r.r(30, 50), '#1a1012', null);
  const g = L('ground', { depth: 1 });
  vgrad(g, 0, 190, W, 14, [[0, '#3a2a26'], [1, '#2a1e1c']]);
  bank(g, r, 0, W, { grass0: '#3a302a', grass1: '#2a221e', tip: '#5a4a3a', earth: '#241a18', dark: '#120c0a', stone: '#4a3e3a' });
  // burned houses: black beams standing against the glow, embers still red in the ash
  const burned = (x, w, hh) => {
    rect(g, x, GY - hh, w, hh, '#1c1414');
    for (let k = 0; k < w; k += r.r(6, 12)) rect(g, x + k, GY - hh - r.r(4, 20), 3, hh + r.r(4, 20), '#120c0c');
    line(g, x - 6, GY - hh + 4, x + w * 0.7, GY - hh - 16, '#140e0e', 3);
    for (let i = 0; i < 6; i++) { const ex = x + r() * w, ey = GY - r() * hh * 0.5; rect(g, ex, ey, 2, 1, r.pick(['#ff6a2a', '#ffa040'])); glow(g, ex, ey, 8, 'rgba(255,110,50,0.5)'); }
  };
  for (const [x, w, hh] of [[160, 60, 28], [340, 50, 24], [520, 70, 30], [980, 56, 26], [1140, 50, 22]]) burned(x, w, hh);
  // the empty aviary: its frame still standing, the paper all gone, the door hanging open
  const ax0 = 680, ax1 = 900, top = GY - 90;
  for (let x = ax0; x <= ax1; x += 14) rect(g, x, top + r.r(0, 20), 2, GY - top, '#140e0e');
  for (let y = top + 10; y <= GY - 2; y += 16) line(g, ax0, y, ax1, y + r.r(-4, 4), '#1a1212', 1);
  poly(g, [[ax0 + 60, GY - 2], [ax0 + 80, GY - 40], [ax0 + 96, GY - 36], [ax0 + 76, GY + 2]], '#1c1414');
  // the last wall standing, where a man could hide from the lanterns
  rect(g, 1300, GY - 34, 90, 32, '#2a201e'); rect(g, 1300, GY - 34, 90, 3, '#3a2e2a');
  for (let k = 0; k < 8; k++) rect(g, 1302 + k * 11, GY - 30 + (k % 2) * 8, 9, 5, '#221a18');
  const fr = L('front', { depth: 1.3, anim: sway(2, 4) });
  reeds(fr, r, ['#1a1210', '#2a1e1a', '#3a2a22'], 70);
  return { colors: 64, vignette: [0.5, '20,4,0'] };
};

// ---------------------------------------------------------------- the road from the coast, through the war
WALKS.crossing = (c, L) => {
  const r = rng(461);
  // a sky gone the colour of the fires, black smoke rolling over it
  vgrad(c, 0, 0, 480, WY, [[0, '#0e060c'], [0.3, '#2e0e18'], [0.55, '#6a1c1e'], [0.78, '#c8401e'], [0.92, '#f07a2a'], [1, '#ffb050']]);
  glow(c, 120, 180, 150, 'rgba(255,110,40,0.45)'); glow(c, 380, 176, 130, 'rgba(255,90,40,0.4)');
  const cl = L('clouds', { depth: 0.05, anim: { type: 'drift', t: 90 } });
  for (let x = 0; x < S(0.1); x += 120) cloudBand(cl, r, x + r.r(0, 50), r.r(10, 110), r.r(150, 240), r.r(12, 20), { body: '#241016', rim: '#e8582a', shadow: '#160a10', hi: '#ff9a4a', lightFromBelow: true });
  // silhouettes lit from below by fire
  const burnt = (cc, rr, x, yb, w, hh, col, fire) => {
    // a house burned to its frame: a jagged broken wall, the stumps of its posts, a window full of fire
    const top = yb - hh, pts = [[x, yb]];
    for (let k = 0; k <= w; k += 3) pts.push([x + k, top + rr.r(0, hh * 0.55) * (k > w * 0.3 ? 1 : 0.4)]);
    pts.push([x + w, yb]);
    poly(cc, pts, col);
    for (let k = x + 2; k < x + w; k += rr.r(5, 9)) rect(cc, k, top - rr.r(0, hh * 0.35), 2, hh * 0.6, col);
    if (fire) {
      glow(cc, x + w / 2, top + hh * 0.4, w * 0.9, 'rgba(255,120,40,0.5)');
      for (let k = 0; k < w / 6; k++) rect(cc, x + rr.r(3, w - 5), top + hh * rr.r(0.4, 0.8), rr.r(2, 4), rr.r(2, 4), rr.pick(['#ffb040', '#ff7a2a', '#ffe080']));
    }
  };
  const smokeCol = (cc, rr, x, yb, hh, lean, dark = '#1e0c12') => {
    for (let i = 0; i < 26; i++) { const t = i / 26; ellipse(cc, x + t * t * lean + rr.r(-2, 2), yb - t * hh, 3 + t * 16, 3 + t * 12, t < 0.12 ? '#7a2a1e' : t < 0.3 ? '#3a1618' : dark); }
  };
  const flames = (cc, rr, x, yb, w, hh) => {
    glow(cc, x + w / 2, yb - hh / 2, w + 10, 'rgba(255,130,50,0.55)');
    for (let k = 0; k < w; k += 2) { const fh = hh * rr.r(0.3, 1); poly(cc, [[x + k - 1, yb], [x + k + 2, yb], [x + k + 0.5 + rr.r(-1, 1), yb - fh]], rr.pick(['#ff7a2a', '#ff9a3a', '#e0502a'])); if (rr() < 0.5) rect(cc, x + k, yb - fh * 0.4, 1, fh * 0.4, '#ffd070'); }
  };

  // far: the burning town on its hill, the castle in flames, a pagoda broken in half, columns of smoke
  const far = L('far', { depth: 0.1 });
  const fx1 = S(0.1), FAR = '#2a0e16', FARL = '#4a1a1c';
  ridge(far, r, 180, 20, FAR, { x1: fx1 });
  const fc = { stone: '#3a1a1e', stoneLit: '#5a2a24', stoneDark: '#240e14', wall: '#4a2222', wallLit: '#7a3a2a', wallShade: '#341618', board: '#1a0a10', window: '#1a0a10', lit: '#ffa040', roof: '#1e0c12', roofLit: '#5a2420', gold: '#a86a30' };
  smokeCol(far, r, 318, 120, 120, 70);
  const ct = jpCastle(far, r, 300, 174, 0.72, fc);
  flames(far, r, 284, 146, 18, 16); flames(far, r, 306, 132, 12, 12);
  smokeCol(far, r, 116, 150, 110, -40);
  // the pagoda, its top three storeys gone
  pagoda(far, 116, 176, 2.2, FARL, '#8a3a24');
  far.clearRect(96, 100, 42, 44); flames(far, r, 106, 146, 20, 12);
  for (let x = 10; x < fx1; x += r.r(12, 22)) { if (Math.abs(x - 300) < 40 || Math.abs(x - 116) < 20) continue; burnt(far, r, x, 180, r.r(10, 18), r.r(6, 12), FAR, r() < 0.4); }
  for (let x = 40; x < fx1; x += r.r(70, 130)) { if (Math.abs(x - 300) < 30) continue; smokeCol(far, r, x, 176, r.r(60, 110), r.r(20, 60)); flames(far, r, x - 6, 178, 12, r.r(6, 12)); }
  glow(far, 300, 178, 180, 'rgba(255,90,30,0.28)');

  // the field: rolling ground where the lines are fighting, broken walls, burnt trees, guns
  const fld = L('field', { depth: 0.25 });
  const fl1 = S(0.25);
  ridge(fld, r, 190, 8, '#24101a', { x1: fl1 });
  for (let x = 20; x < fl1; x += r.r(60, 110)) bareTree(fld, r, x, 188, r.r(18, 30), '#170a10', null);
  for (let x = 80; x < fl1; x += r.r(90, 160)) burnt(fld, r, x, 189, r.r(22, 34), r.r(10, 16), '#1e0c14', true);
  for (const gx of [190, 470, 690]) { rect(fld, gx, 182, 12, 3, '#160a10'); circle(fld, gx + 3, 186, 3.5, '#160a10'); line(fld, gx + 10, 183, gx + 20, 178, '#160a10', 2); }
  for (let x = 0; x < fl1; x += r.r(40, 80)) glow(fld, x, 188, 20, 'rgba(255,110,40,0.3)');

  // mid: the edge of the town, ruined townhouses burning, a torii still standing, charred trees
  const mid = L('mid', { depth: 0.45 });
  const mx1 = S(0.45), MID = '#1a0a10';
  const ruinMachiya = (x, w, hh, fire) => {
    // what is left of a townhouse: the ground floor's posts, half the upper wall, a roof sliding off
    const yb = 196, top = yb - hh;
    rect(mid, x, yb - hh * 0.5, w, hh * 0.5, '#2a1418');
    for (let k = x; k < x + w; k += 5) rect(mid, k, top + r.r(0, hh * 0.3), 2, hh, MID);
    const pts = [[x, yb - hh * 0.5]];
    for (let k = 0; k <= w; k += 4) pts.push([x + k, top + hh * 0.1 + r.r(0, hh * 0.4) * (k / w)]);
    pts.push([x + w, yb - hh * 0.5]);
    poly(mid, pts, '#2e161a');
    poly(mid, [[x - 6, top + 4], [x + w * 0.6, top - 4], [x + w * 0.7, top + 1], [x - 2, top + 10]], MID);
    for (let k = x - 4; k < x + w * 0.6; k += 3) px(mid, k, top + 3 - (k - x) * 0.12, '#5a2420');
    if (fire) { flames(mid, r, x + 3, top + hh * 0.5, w - 6, hh * 0.5); for (let k = 0; k < 3; k++) rect(mid, x + 4 + k * (w / 3), yb - hh * 0.35, 5, 6, '#ff8a3a'); }
    else for (let k = 0; k < 3; k++) rect(mid, x + 4 + k * (w / 3), yb - hh * 0.35, 5, 6, '#3a1a1a');
  };
  for (let x = 10; x < mx1; x += r.r(70, 120)) ruinMachiya(x, r.r(30, 44), r.r(30, 44), r() < 0.6);
  jpTorii(mid, 520, 196, 1.1);
  for (let x = 60; x < mx1; x += r.r(90, 150)) bareTree(mid, r, x, 197, r.r(26, 40), '#12070c', null);
  vgrad(mid, 0, 192, mx1, 8, [[0, '#2a1216'], [1, '#1e0c10']]);

  // ground: the road, rubble, craters, burnt houses; the signpost at 700, the abandoned gun at 1040
  const g = L('ground', { depth: 1 });
  vgrad(g, 0, 192, W, 14, [[0, '#3a2020'], [1, '#2a1616']]);
  bank(g, r, 0, W, { grass0: '#3a2a22', grass1: '#2a1c18', tip: '#5a3a2a', earth: '#221412', dark: '#100808', stone: '#4a3632' });
  for (let x = 90; x < W; x += r.r(110, 190)) { ellipse(g, x, GY - 1, r.r(10, 16), 3, '#140a0a'); ellipse(g, x, GY - 2, r.r(7, 12), 2, '#0a0606'); for (let k = 0; k < 5; k++) rect(g, x + r.r(-14, 14), GY - r.r(2, 5), 2, 1, '#4a3024'); }
  const ruin = (x, w, hh) => {
    // a burned house by the road: charred posts, a jagged wall, fallen beams and tiles, embers
    const top = GY - 2 - hh;
    const pts = [[x, GY - 2]];
    for (let k = 0; k <= w; k += 3) pts.push([x + k, top + r.r(0, hh * 0.6)]);
    pts.push([x + w, GY - 2]);
    poly(g, pts, '#2e1a1a');
    texture(g, r, x, top, w, hh, 0.1, 2);
    for (let k = x + 2; k < x + w; k += r.r(6, 10)) { rect(g, k, top - r.r(0, 10), 3, hh + 10, '#140a0a'); px(g, k + 1, top + r.r(4, hh), '#ff7a2a'); }
    line(g, x - 4, GY - 3, x + w * 0.6, top + 4, '#1a0e0c', 3);
    line(g, x + w * 0.4, GY - 3, x + w + 6, top + hh * 0.5, '#1a0e0c', 2);
    for (let k = 0; k < w / 2; k++) rect(g, x + r.r(-6, w + 6), GY - r.r(2, 6), r.r(2, 4), r.r(1, 2), r.pick(['#2a2630', '#1e1a22', '#3a2620', '#4a3024']));
    glow(g, x + w / 2, GY - hh * 0.4, w * 0.8, 'rgba(255,110,40,0.3)');
  };
  for (const [x, w, hh] of [[34, 70, 40], [200, 80, 46], [652, 30, 24], [960, 60, 38], [1290, 80, 44]]) ruin(x, w, hh);
  for (let x = 10; x < W; x += r.r(20, 40)) for (let k = 0; k < 3; k++) rect(g, x + r.r(0, 12), GY - r.r(2, 4), r.r(2, 5), 2, r.pick(['#2a2630', '#3a2620', '#4a3632']));
  rect(g, 700, GY - 30, 2, 30, '#2a1a14'); rect(g, 692, GY - 30, 22, 6, '#4a3020'); rect(g, 692, GY - 30, 22, 1, '#7a5234');
  rect(g, 1030, GY - 12, 26, 3, '#1e1a20'); circle(g, 1036, GY - 5, 5, '#2a1a10'); circle(g, 1036, GY - 5, 3, '#4a3020'); line(g, 1044, GY - 10, 1060, GY - 16, '#1e1a20', 3);
  const fr = L('front', { depth: 1.3, anim: sway(2, 3.6) });
  reeds(fr, r, ['#1a0e0c', '#2a1814', '#3e2218'], 80);
  return { colors: 80, vignette: [0.5, '24,4,4'] };
};

// ---------------------------------------------------------------- the cemetery by the river, at dusk
WALKS.cemetery = (c, L) => {
  const r = rng(451);
  vgrad(c, 0, 0, 480, WY, [[0, '#2b2654'], [0.38, '#794f7a'], [0.68, '#d9806e'], [0.88, '#f6b26f'], [1, '#ffe0a0']]);
  sun(c, 160, 176, 12, '#fff2c8', 'rgba(255,170,100,0.6)');
  const cl = L('clouds', { depth: 0.05, anim: { type: 'drift', t: 260 } });
  for (let x = 0; x < S(0.1); x += 220) cloudBand(cl, r, x + r.r(0, 60), r.r(30, 100), r.r(140, 220), r.r(5, 9), { body: '#5e3f6e', rim: '#ffac80', shadow: '#4a3160', hi: '#ffe0b0', lightFromBelow: true });
  const far = L('far', { depth: 0.14 });
  ridge(far, r, 178, 30, '#8f607c', { x1: S(0.14) });
  // Lavilledieu on the far bank: roofs, the church tower
  for (let x = 30; x < S(0.14) - 40; x += r.r(24, 40)) frHouse(far, r, x, 188, r.r(16, 24), r.r(8, 12), { wall: '#a8747e', wallDark: '#80586a', roof: '#7a3f4e', roofDark: '#6a3444', roofH: 5, windows: [[5, 3, 3, 3, { lit: r() < 0.6, frame: '#80586a' }]] });
  rect(far, 300, 140, 14, 48, '#a8747e'); poly(far, [[297, 140], [317, 140], [307, 118]], '#7a3f4e');
  const mid = L('mid', { depth: 0.45 });
  for (let x = 20; x < S(0.45); x += r.r(50, 90)) cypress(mid, r, x, 196, r.r(40, 70), ['#1e2a22', '#3d4c2c']);
  const g = L('ground', { depth: 1 });
  vgrad(g, 0, 190, W, 14, [[0, '#8a7a48'], [1, '#6a6a3a']]);
  bank(g, r, 0, W, { grass0: '#7a7a3a', grass1: '#5a5a2a', tip: '#a8a060', earth: '#5a4636', dark: '#2a2018', stone: '#a0968e' });
  // the iron gate, a low wall, rows of stones, the old plane tree, and her grave at the end
  for (let x = 40; x < 90; x += 4) rect(g, x, GY - 26, 1, 24, '#2c2430');
  rect(g, 36, GY - 28, 4, 26, '#6a5e5a'); rect(g, 90, GY - 28, 4, 26, '#6a5e5a'); rect(g, 40, GY - 20, 50, 1, '#2c2430');
  rect(g, 94, GY - 10, W - 94, 8, '#8b7f7a'); rect(g, 94, GY - 10, W - 94, 2, '#d8bda2');
  const stone = (x, s, kind) => {
    if (kind === 0) { rect(g, x - s * 0.5, GY - 2 - s * 1.5, s, s * 1.5, '#a0968e'); ellipse(g, x, GY - 2 - s * 1.5, s * 0.5, s * 0.34, '#a0968e'); rect(g, x - s * 0.5, GY - 2 - s * 1.5, s * 0.3, s * 1.5, '#f0cfa2'); }
    else { rect(g, x - s * 0.13, GY - 2 - s * 2.1, s * 0.26 + 1, s * 2.1, '#a0968e'); rect(g, x - s * 0.55, GY - 2 - s * 1.55, s * 1.1, s * 0.26 + 1, '#a0968e'); }
  };
  for (let x = 130; x < 760; x += r.r(34, 60)) stone(x, r.r(7, 10), r.i(0, 1));
  trunk(g, 640, GY - 2, 70, 10, 6, '#5b4a3e', '#3f332c');
  crown(g, r, 620, GY - 90, 60, 36, ['#2e3a24', '#5b6b2e', '#c8a14c', '#ffd98a'], { x: -0.9, y: -0.3 }, 60);
  // Hélène's grave, with flowers
  stone(880, 13, 0);
  for (let i = 0; i < 30; i++) px(g, 866 + r() * 28, GY - 4 + r() * 4, r.pick(['#f4a7b9', '#ffffff', '#e27a9a', '#ffd0dc']));
  const fr = L('front', { depth: 1.3, anim: sway(3, 3.6) });
  reeds(fr, r, ['#3a3a22', '#56562e', '#77703c'], 90);
  return { colors: 64, vignette: [0.35, '30,10,20'] };
};
