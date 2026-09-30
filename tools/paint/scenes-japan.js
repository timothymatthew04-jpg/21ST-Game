/*
 * Japan in the last years of the shoguns, for Hara Kei's village at dusk in the fog: the white
 * castle on its stone base above the town, pagodas, townhouses (machiya) with their lattices,
 * noren and paper lanterns, street stalls, banners, stone lanterns, a torii, an archery butt, a
 * stage for the street players, the stone walls of the samurai quarter and Hara Kei's gate, and
 * the cherry trees in blossom, pink and white. Used by the village walk (tools/paint/walks.js).
 * The fog, the petals, the people and the arrows are the walk's.
 */
/* eslint-disable no-unused-vars */
const JP = {
  plaster: '#cfc8c2', plasterLit: '#e4ddd4', plasterShade: '#a49e9a',
  wood: '#3a2a28', woodLit: '#5e463a', woodDark: '#221818',
  roof: '#363c4c', roofLit: '#5c6476', roofDark: '#242834',
  stone: '#76747e', stoneLit: '#9a98a2', stoneDark: '#55525e',
  lit: '#ffc870', litDeep: '#f09a48',
  noren: ['#26345e', '#6a2430', '#2e5044', '#3e2e56'],
  sakura: ['#9a5a78', '#d88eaa', '#f4c2d4', '#fff0f4'],
  blossomWhite: ['#8e8a9c', '#cfc8d6', '#ece8f0', '#ffffff'],
  pine: { trunk: '#2a2024', leaves: ['#1c2626', '#2a3834', '#3e5048'] },
  vermilion: '#b8402e', vermilionDark: '#7e2a22',
  gold: '#d8b050',
};

/** A paper lantern, red or white, glowing, with its black caps. */
function jpChochin(c, x, y, col = '#d8402e', s = 1) {
  const u = (v) => v * s;
  line(c, x, y - u(6), x, y - u(3.5), '#1a1414', 1);
  ellipse(c, x, y, u(2.8), u(3.6), col);
  ellipse(c, x - u(0.8), y - u(0.6), u(1.2), u(2.2), vShade(col, 0.35));
  rect(c, x - u(2), y - u(3.6), u(4), u(1), '#1a1414');
  rect(c, x - u(2), y + u(2.8), u(4), u(1), '#1a1414');
  for (let k = -2; k <= 2; k += 2) px(c, x - u(2.4), y + u(k * 0.6), vShade(col, -0.2));
  glow(c, x, y, u(14), col === '#f4ecd8' ? 'rgba(255,230,170,0.55)' : 'rgba(255,140,80,0.55)');
}

/** A string of lanterns swagged between two points. */
function jpLanternString(c, x0, y0, x1, y1, n, cols) {
  for (let t = 0; t <= 1; t += 0.02) px(c, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * 8, '#1a1414');
  for (let k = 1; k < n; k++) { const t = k / n; jpChochin(c, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * 8 + 5, cols[k % cols.length], 0.8); }
}

/** A tall banner (nobori) on its pole, with characters down it. */
function jpNobori(c, r, x, yb, h, col, ink = '#f4ecd8') {
  rect(c, x, yb - h, 1.5, h, '#2a2020');
  rect(c, x + 1.5, yb - h + 3, 7, h * 0.72, col);
  rect(c, x + 1.5, yb - h + 3, 7, 2, vShade(col, -0.3));
  for (let y = yb - h + 8; y < yb - h + 3 + h * 0.72 - 4; y += 5) { rect(c, x + 4, y, 2, 1, ink); px(c, x + r.i(3, 6), y + 2, ink); px(c, x + 5, y + 1, ink); }
  for (let y = yb - h + 3; y < yb - h + 3 + h * 0.72; y += 6) px(c, x + 1.5, y, '#f4ecd8');
}

/** A torii, vermilion and black. */
function jpTorii(c, x, yb, s = 1) {
  const u = (v) => v * s;
  for (const k of [-16, 13]) { rect(c, x + u(k), yb - u(44), u(3.5), u(44), JP.vermilion); rect(c, x + u(k), yb - u(44), u(1), u(44), '#d86a4e'); rect(c, x + u(k) - u(1), yb - u(4), u(5.5), u(4), '#1a1414'); }
  rect(c, x - u(22), yb - u(38), u(44), u(3), JP.vermilion);
  poly(c, [[x - u(28), yb - u(47)], [x + u(28), yb - u(47)], [x + u(25), yb - u(44)], [x - u(25), yb - u(44)]], JP.vermilion);
  poly(c, [[x - u(30), yb - u(50)], [x + u(30), yb - u(50)], [x + u(28), yb - u(47)], [x - u(28), yb - u(47)]], '#1a1414');
  rect(c, x - u(2), yb - u(45), u(4), u(7), JP.vermilionDark);
}

/** A stone lantern (toro), its window lit. */
function jpStoneLantern(c, x, yb, s = 1) {
  const u = (v) => v * s;
  rect(c, x - u(5), yb - u(3), u(10), u(3), JP.stoneDark);
  rect(c, x - u(1.5), yb - u(12), u(3), u(9), JP.stone);
  rect(c, x - u(4.5), yb - u(15), u(9), u(3), JP.stone);
  rect(c, x - u(3.5), yb - u(21), u(7), u(6), JP.stone);
  rect(c, x - u(2), yb - u(20), u(4), u(4), JP.lit);
  glow(c, x, yb - u(18), u(14), 'rgba(255,190,110,0.55)');
  poly(c, [[x - u(7), yb - u(21)], [x + u(7), yb - u(21)], [x + u(3), yb - u(25)], [x - u(3), yb - u(25)]], JP.stoneDark);
  rect(c, x - u(1), yb - u(27), u(2), u(2), JP.stone);
  rect(c, x - u(3.5), yb - u(21), u(1.2), u(6), JP.stoneLit);
}

/** A cherry tree in blossom: a dark gnarled trunk, a wide cloud of flowers, petals fallen under it. */
function jpSakura(c, r, x, yb, hh, pal = JP.sakura) {
  branch(c, x, yb, x + r.r(-6, 6), yb - hh * 0.45, Math.max(3, hh * 0.08), '#2e2226');
  for (let k = 0; k < 5; k++) branch(c, x, yb - hh * 0.4, x + r.r(-hh * 0.55, hh * 0.55), yb - hh * r.r(0.55, 0.85), Math.max(1, hh * 0.03), '#2e2226');
  crown(c, r, x, yb - hh * 0.72, hh * 0.62, hh * 0.3, pal, { x: -0.6, y: -0.8 }, 60);
  for (let i = 0; i < hh * 0.8; i++) px(c, x + r.r(-hh * 0.6, hh * 0.6), yb - r.r(0, 3), r.pick(pal.slice(1)));
}

/** A townhouse of two storeys: lattice front, noren over the door, a little roof between the
 *  floors, slatted windows above, the tiled roof; lanterns and a sign for a shop. */
function jpMachiya(c, r, x, yb, w, hh, o = {}) {
  const f1 = Math.round(hh * 0.52), top = yb - hh;
  // the upper floor: plaster, a slatted window lit from within
  rect(c, x + 2, top, w - 4, hh - f1, o.plaster || JP.plaster);
  rect(c, x + 2, top, 2, hh - f1, JP.plasterLit);
  rect(c, x + w - 5, top, 3, hh - f1, JP.plasterShade);
  const ww = Math.min(w - 16, 26), wx = x + (w - ww) / 2, wy = top + 4;
  rect(c, wx, wy, ww, hh - f1 - 9, r() < 0.7 ? JP.lit : '#4a4452');
  for (let k = wx + 1; k < wx + ww; k += 2) rect(c, k, wy, 1, hh - f1 - 9, JP.wood);
  // the little roof between the floors
  poly(c, [[x - 3, yb - f1 + 1], [x + w + 3, yb - f1 + 1], [x + w, yb - f1 - 4], [x, yb - f1 - 4]], JP.roof);
  for (let k = x; k < x + w; k += 3) px(c, k, yb - f1 - 2, JP.roofLit);
  rect(c, x - 3, yb - f1 + 1, w + 6, 1, JP.roofDark);
  // the ground floor: lattice, a door with its noren, the glow of the shop inside
  rect(c, x, yb - f1 + 2, w, f1 - 2, JP.wood);
  const dx = x + (o.doorAt == null ? w * 0.55 : o.doorAt), dw = Math.min(16, w * 0.34);
  rect(c, dx, yb - f1 + 4, dw, f1 - 4, o.shop ? JP.lit : '#2a1e1e');
  if (o.shop) { glow(c, dx + dw / 2, yb - f1 / 2, dw * 1.6, 'rgba(255,180,90,0.5)'); for (let k = 0; k < 5; k++) rect(c, dx + 2 + k * 3, yb - 6, 2, 3, r.pick(['#8a5a3a', '#c8a060', '#6a8aa0', '#b84a3a'])); }
  const nc = o.noren || r.pick(JP.noren);
  for (let k = 0; k < 3; k++) { rect(c, dx + 1 + k * (dw / 3), yb - f1 + 4, dw / 3 - 1, f1 * 0.42, nc); }
  circle(c, dx + dw / 2, yb - f1 + 4 + f1 * 0.2, 2, '#f4ecd8');
  for (let k = x + 2; k < x + w - 2; k += 2) { if (k > dx - 1 && k < dx + dw + 1) continue; rect(c, k, yb - f1 + 4, 1, f1 - 6, JP.woodLit); }
  rect(c, x, yb - 3, w, 3, JP.woodDark);
  // the main roof, tiled, its ridge and the ends of the tiles along the eave
  const rh = o.roofH || 9;
  poly(c, [[x - 4, top + 1], [x + w + 4, top + 1], [x + w - 2, top - rh], [x + 2, top - rh]], JP.roof);
  for (let y = top - rh + 2; y < top; y += 2) line(c, x, y, x + w, y, JP.roofDark, 1);
  rect(c, x + 1, top - rh - 1, w - 2, 2, JP.roofLit);
  for (let k = x - 3; k < x + w + 3; k += 2) px(c, k, top + 1, JP.roofLit);
  if (o.lanterns !== false) { jpChochin(c, dx - 3, yb - f1 + 2, o.lanternCol || '#d8402e'); if (w > 40) jpChochin(c, dx + dw + 3, yb - f1 + 2, o.lanternCol || '#f4ecd8'); }
  if (o.sign) { rect(c, x + 3, yb - f1 - 18, 5, 16, '#2a1e18'); for (let y = yb - f1 - 16; y < yb - f1 - 4; y += 4) rect(c, x + 4, y, 3, 2, '#f0d890'); }
}

/** A thatched farmhouse (minka): a steep heavy roof of straw over dark timber and paper. */
function jpMinka(c, r, x, yb, w, hh) {
  rect(c, x, yb - hh, w, hh, JP.wood);
  for (let k = x + 4; k < x + w - 4; k += 12) { rect(c, k, yb - hh + 3, 9, hh - 6, r() < 0.5 ? '#e8d8b0' : '#d8ccb4'); for (let q = 1; q < 9; q += 3) rect(c, k + q, yb - hh + 3, 1, hh - 6, JP.wood); }
  glow(c, x + w * 0.4, yb - hh / 2, w * 0.4, 'rgba(255,190,110,0.35)');
  const rh = hh * 1.3;
  poly(c, [[x - 8, yb - hh + 2], [x + w + 8, yb - hh + 2], [x + w - 6, yb - hh - rh], [x + 6, yb - hh - rh]], '#6a5a42');
  for (let i = 0; i < w * 3; i++) { const t = r(); line(c, x - 6 + t * (w + 12), yb - hh + 1, x - 4 + t * (w + 8), yb - hh - r.r(4, rh * 0.8), r.pick(['#7a6a4e', '#5a4a36', '#8a7a58']), 1); }
  rect(c, x + 4, yb - hh - rh - 3, w - 8, 4, JP.roof);
  for (let k = x + 8; k < x + w - 8; k += 6) rect(c, k, yb - hh - rh - 6, 2, 3, JP.roofDark);
  for (let i = 0; i < 20; i++) px(c, r.r(x, x + w), yb - hh - r.r(0, rh * 0.6), '#5a6a3a');
}

/** A street stall: a cloth awning on poles over a counter of goods. */
function jpStall(c, r, x, yb, w, kind) {
  for (const k of [0, w - 2]) rect(c, x + k, yb - 26, 2, 26, JP.woodLit);
  const cloth = { fish: '#26345e', cloth: '#6a2430', masks: '#2e5044', food: '#e8e0d0' }[kind] || '#26345e';
  poly(c, [[x - 4, yb - 22], [x + w + 4, yb - 22], [x + w + 1, yb - 28], [x - 1, yb - 28]], cloth);
  for (let k = x - 2; k < x + w + 2; k += 6) rect(c, k, yb - 22, 3, 2, vShade(cloth, 0.3));
  rect(c, x - 1, yb - 10, w + 2, 3, JP.woodLit);
  rect(c, x, yb - 7, w, 7, JP.wood);
  if (kind === 'fish') for (let k = x + 2; k < x + w - 4; k += 5) { ellipse(c, k + 2, yb - 11, 2.5, 1, '#b8c0cc'); px(c, k + 4, yb - 11, '#e8f0f4'); }
  if (kind === 'cloth') for (let k = x + 1; k < x + w - 3; k += 4) rect(c, k, yb - 14, 3, 4, r.pick(['#c83a4a', '#e8c040', '#3a6ab0', '#f4ecf0', '#8a4ac0', '#40a870']));
  if (kind === 'masks') { for (let k = x + 3; k < x + w - 4; k += 7) { ellipse(c, k + 2, yb - 17, 2.6, 3, r.pick(['#f4f0ec', '#d83a2a', '#f0c040'])); px(c, k + 1, yb - 18, '#1a1414'); px(c, k + 3, yb - 18, '#1a1414'); } }
  if (kind === 'food') { for (let k = x + 2; k < x + w - 3; k += 4) { line(c, k, yb - 11, k + 1, yb - 17, '#c8a060', 1); ellipse(c, k + 1, yb - 15, 1.5, 2, '#8a4a2a'); } glow(c, x + w / 2, yb - 12, 12, 'rgba(255,170,90,0.45)'); }
  jpChochin(c, x + w / 2, yb - 19, kind === 'food' ? '#d8402e' : '#f4ecd8', 0.8);
}

/** The white castle on its battered stone base: three storeys under sweeping roofs, triangular and
 *  curved gables, a balcony at the top, gold fish at the ridge. x is the centre. Returns the top. */
function jpCastle(c, r, x, yb, s, P) {
  const u = (v) => v * s, X = (v) => x + u(v), Y = (v) => yb - u(v);
  // the stone base, its sides curving in as they rise
  const base = [[X(-40), yb]];
  for (let t = 0; t <= 1; t += 0.1) base.push([X(-40 + 8 * Math.pow(t, 0.6)), Y(24 * t)]);
  for (let t = 1; t >= 0; t -= 0.1) base.push([X(40 - 8 * Math.pow(t, 0.6)), Y(24 * t)]);
  poly(c, base, P.stone);
  c.save(); c.beginPath(); c.moveTo(base[0][0], base[0][1]); for (const p of base) c.lineTo(p[0], p[1]); c.closePath(); c.clip();
  for (let y = 0; y < 24; y += 2.2) for (let k = -42 + (Math.round(y) % 4); k < 42; k += r.r(3, 6)) rect(c, X(k), Y(y + 2), u(r.r(2.5, 5)), u(1.8), r.pick([P.stone, P.stoneLit, P.stoneDark]));
  c.restore();
  // the storeys: white walls, black boards at their feet, windows; roofs with flared eaves
  let y = 24;
  const tiers = [[60, 14], [46, 12], [30, 11]];
  tiers.forEach(([w, hh], i) => {
    rect(c, X(-w / 2), Y(y + hh), u(w), u(hh), P.wall);
    rect(c, X(-w / 2), Y(y + hh), u(3), u(hh), P.wallLit);
    rect(c, X(w / 2) - u(3), Y(y + hh), u(3), u(hh), P.wallShade);
    rect(c, X(-w / 2), Y(y + 3.5), u(w), u(3.5), P.board);
    for (let k = -w / 2 + 4; k < w / 2 - 3; k += 6) { rect(c, X(k), Y(y + hh - 3), u(3), u(4), r() < 0.3 ? P.lit : P.window); rect(c, X(k + 1.4), Y(y + hh - 3), 1, u(4), P.board); }
    const ew = w / 2 + 6;
    poly(c, [[X(-ew - 2), Y(y + hh - 1)], [X(-ew + 2), Y(y + hh + 1.5)], [X(-w / 2 + 3), Y(y + hh + 5)], [X(w / 2 - 3), Y(y + hh + 5)], [X(ew - 2), Y(y + hh + 1.5)], [X(ew + 2), Y(y + hh - 1)], [X(ew - 1), Y(y + hh + 0.2)], [X(-ew + 1), Y(y + hh + 0.2)]], P.roof);
    rect(c, X(-w / 2 + 3), Y(y + hh + 5), u(w - 6), u(1), P.roofLit);
    // gables: two triangular ones on the first roof, a curved one on the second
    if (i === 0) for (const gx of [-16, 16]) { poly(c, [[X(gx - 8), Y(y + hh + 4)], [X(gx + 8), Y(y + hh + 4)], [X(gx), Y(y + hh + 12)]], P.roof); poly(c, [[X(gx - 5), Y(y + hh + 4.5)], [X(gx + 5), Y(y + hh + 4.5)], [X(gx), Y(y + hh + 10)]], P.wall); px(c, X(gx), Y(y + hh + 11), P.gold); }
    if (i === 1) { c.fillStyle = P.roof; c.beginPath(); c.moveTo(X(-10), Y(y + hh + 4)); c.quadraticCurveTo(X(0), Y(y + hh + 13), X(10), Y(y + hh + 4)); c.closePath(); c.fill(); c.fillStyle = P.gold; c.fillRect(X(-8), Y(y + hh + 4.6), u(16), 1); }
    y += hh + 5;
  });
  // the balcony and the top roof, the gold fish at either end of the ridge
  rect(c, X(-17), Y(y - 1), u(34), u(1.2), P.board);
  for (let k = -16; k < 17; k += 2.5) rect(c, X(k), Y(y + 1), 1, u(2), P.board);
  poly(c, [[X(-22), Y(y + 1)], [X(22), Y(y + 1)], [X(12), Y(y + 9)], [X(-12), Y(y + 9)]], P.roof);
  rect(c, X(-12), Y(y + 9.5), u(24), u(1.2), P.roofLit);
  for (const k of [-12, 12]) { rect(c, X(k) - u(1), Y(y + 12), u(2), u(3), P.gold); px(c, X(k), Y(y + 12.5), '#fff0b0'); }
  return [X(0), Y(y + 12)];
}

/** A stone wall of the samurai quarter: battered stone below, a white plaster wall with a tiled cap. */
function jpWall(c, r, x0, x1, yb, stoneH, wallH) {
  for (let y = yb - stoneH; y < yb; y += 3) for (let x = x0 + ((y / 3) % 2) * 2; x < x1; x += r.r(4, 8)) rect(c, x, y, r.r(3, 7), 2.5, r.pick([JP.stone, JP.stoneLit, JP.stoneDark]));
  rect(c, x0, yb - stoneH - wallH, x1 - x0, wallH, JP.plaster);
  rect(c, x0, yb - stoneH - 4, x1 - x0, 4, JP.plasterShade);
  for (let x = x0 + 12; x < x1 - 4; x += 24) { rect(c, x, yb - stoneH - wallH + 4, 6, 3, '#3a3040'); }
  poly(c, [[x0 - 2, yb - stoneH - wallH], [x1 + 2, yb - stoneH - wallH], [x1 - 1, yb - stoneH - wallH - 5], [x0 + 1, yb - stoneH - wallH - 5]], JP.roof);
  for (let k = x0; k < x1; k += 2) px(c, k, yb - stoneH - wallH, JP.roofLit);
}

/** The archery butt: a bank of sand under its own little roof, the round targets before it. */
function jpAzuchi(c, x, yb, w, targets) {
  poly(c, [[x, yb], [x + 6, yb - 26], [x + w - 6, yb - 26], [x + w, yb]], '#8a7a60');
  poly(c, [[x, yb], [x + 6, yb - 26], [x + 16, yb - 26], [x + 10, yb]], '#a89878');
  for (const k of [2, w - 5]) rect(c, x + k, yb - 40, 3, 40, JP.wood);
  poly(c, [[x - 6, yb - 38], [x + w + 6, yb - 38], [x + w - 2, yb - 46], [x + 2, yb - 46]], JP.roof);
  rect(c, x - 6, yb - 38, w + 12, 1, JP.roofDark);
  for (let k = x + 2; k < x + w - 2; k += 12) rect(c, k, yb - 38, 6, 3, '#e8e0d0');
  for (const tx of targets) { circle(c, tx, yb - 14, 5.5, '#f4f0ea'); circle(c, tx, yb - 14, 4, '#1a1414'); circle(c, tx, yb - 14, 2.8, '#f4f0ea'); circle(c, tx, yb - 14, 1.4, '#1a1414'); rect(c, tx - 0.5, yb - 8, 1, 7, JP.wood); }
}

/** A stage for the street players: a wooden platform, a striped red and white curtain, lanterns. */
function jpStage(c, x, yb, w) {
  rect(c, x, yb - 8, w, 8, JP.woodLit);
  rect(c, x, yb - 8, w, 1, '#8a6a4a');
  for (let k = x + 3; k < x + w - 2; k += 10) rect(c, k, yb - 7, 2, 7, JP.wood);
  for (const k of [0, w - 3]) rect(c, x + k, yb - 50, 3, 42, JP.wood);
  rect(c, x - 2, yb - 52, w + 4, 3, JP.wood);
  for (let k = 3; k < w - 3; k += 6) rect(c, x + k, yb - 49, 6, 26, k % 12 < 6 ? '#c8303a' : '#f4ecf0');
  for (let k = 3; k < w - 3; k += 6) rect(c, x + k, yb - 24, 6, 1, '#1a1414');
  jpChochin(c, x + 2, yb - 44, '#d8402e');
  jpChochin(c, x + w - 2, yb - 44, '#d8402e');
}

/** Sake barrels in straw, stacked, their brewers' marks in red. */
function jpBarrels(c, x, yb, n = 3) {
  for (let row = 0; row < 2; row++) for (let k = 0; k < n - row; k++) {
    const bx = x + k * 10 + row * 5, by = yb - row * 9;
    rect(c, bx, by - 9, 9, 9, '#c8b890'); rect(c, bx, by - 9, 9, 1, '#e8dcb8'); rect(c, bx, by - 5, 9, 1, '#8a7a58');
    rect(c, bx + 3, by - 8, 3, 3, '#c83a3a');
  }
}

/** Hara Kei's gate: a great roofed gate in the estate's long wall, its doors open on the lit house. */
function jpGate(c, r, x, yb) {
  rect(c, x - 26, yb - 40, 52, 40, '#2a1e1c');
  glow(c, x, yb - 20, 36, 'rgba(255,190,110,0.45)');
  rect(c, x - 14, yb - 30, 28, 30, '#5a3a24');
  rect(c, x - 12, yb - 26, 24, 26, JP.lit);
  for (let k = x - 12; k < x + 12; k += 3) rect(c, k, yb - 26, 1, 26, JP.wood);
  for (const k of [-26, -18, 16, 23]) rect(c, x + k, yb - 42, 3, 42, JP.woodLit);
  rect(c, x - 30, yb - 44, 60, 4, JP.wood);
  poly(c, [[x - 40, yb - 44], [x + 40, yb - 44], [x + 32, yb - 58], [x - 32, yb - 58]], JP.roof);
  for (let y = yb - 56; y < yb - 44; y += 2) line(c, x - 36, y, x + 36, y, JP.roofDark, 1);
  poly(c, [[x - 44, yb - 43], [x - 38, yb - 46], [x - 36, yb - 43]], JP.roof); poly(c, [[x + 44, yb - 43], [x + 38, yb - 46], [x + 36, yb - 43]], JP.roof);
  rect(c, x - 30, yb - 60, 60, 3, JP.roofLit);
  rect(c, x - 8, yb - 54, 16, 7, '#2a1e18'); for (let k = 0; k < 3; k++) rect(c, x - 6 + k * 5, yb - 52, 3, 3, '#f0d890');
}
