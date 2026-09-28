/* Paintings for the cutscenes and the close-up CGs: the journey map, the cup, the glove,
   the letter, the dying silkworms, the warships and the candle. */
/* global W, H, TAU, rng, vgrad, hgrad, rect, px, circle, ellipse, poly, line, glow, shade, vignette, shaft, speckle,
   stars, moon, sun, cloud, cloudBand, cumulus, ridge, hill, treeLine, crown, trunk, branch, tree, poplar, cypress, pine,
   frHouse, window_, jpHouse, reflect, texture, tufts, rock, sway, wrapped, candle, lamp */

globalThis.SCENES = globalThis.SCENES || {};

// ---------------------------------------------------------------- the journey map
/*
 * Mercator, one pixel per third of a degree of longitude. js/cutscene.js uses the same
 * numbers to draw Hervé's route on top, so keep them in step.
 */
const MAP = { lon0: -8, k: 3, latTop: 68.3 };
const mercDeg = (lat) => (Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) * 180) / Math.PI;
function mapXY(lon, lat) {
  if (lon < -60) lon += 360; // the far east of Russia wraps round past 180°
  return [(lon - MAP.lon0) * MAP.k, (mercDeg(MAP.latTop) - mercDeg(lat)) * MAP.k];
}

SCENES.journey_map = (c) => {
  const r = rng(1861);
  const data = (globalThis.PAINT_DATA || {}).eurasia;
  const polys = data ? data.polygons : [];
  const path = (ctx, rings) => {
    for (const ring of rings) {
      ring.forEach(([lon, lat], i) => { const [x, y] = mapXY(lon, lat); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
      ctx.closePath();
    }
  };
  // the sea: aged blue-green, darker toward the edges of the sheet
  vgrad(c, 0, 0, W, H, [[0, '#8fa89c'], [0.5, '#a3b8a8'], [1, '#8a9f92']]);
  texture(c, r, 0, 0, W, H, 0.05, 2);
  // engraved ripples hugging every coast, the way old charts drew them
  c.lineJoin = 'round';
  for (const [w, col] of [[9, '#9cb2a4'], [6, '#b2c4b2'], [3, '#c4d2bc']]) {
    c.strokeStyle = col; c.lineWidth = w;
    for (const p of polys) { c.beginPath(); path(c, p); c.stroke(); }
  }
  // the land: parchment
  c.fillStyle = '#e6d3a4';
  for (const p of polys) { c.beginPath(); path(c, p); c.fill('evenodd'); }
  c.save();
  c.beginPath(); for (const p of polys) path(c, p); c.clip('evenodd');
  texture(c, r, 0, 0, W, H, 0.07, 2);
  // warmer, drier toward the south; deserts and steppe a little darker
  vgrad(c, 0, 150, W, 120, [[0, 'rgba(200,150,80,0)'], [1, 'rgba(200,150,80,0.35)']]);
  for (const [lon, lat, rx, ry] of [[55, 45, 60, 12], [75, 44, 40, 10], [105, 43, 50, 14], [45, 25, 50, 20], [10, 25, 80, 20]]) {
    const [x, y] = mapXY(lon, lat);
    ellipse(c, x, y, rx, ry, 'rgba(196,160,96,0.35)');
  }
  // the taiga: a scatter of dark green across Siberia
  for (let i = 0; i < 520; i++) {
    const lon = r.r(28, 140), lat = r.r(52, 66);
    const [x, y] = mapXY(lon, lat);
    if (r() < 0.55) px(c, x, y, r() < 0.5 ? '#7a8a5a' : '#96a06a');
  }
  // mountain ranges, drawn as little peaks
  const peaks = (pts, n, s = 1) => {
    for (let i = 0; i < n; i++) {
      const t = i / Math.max(1, n - 1);
      const k = Math.min(pts.length - 2, Math.floor(t * (pts.length - 1)));
      const f = t * (pts.length - 1) - k;
      const lon = pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f + r.r(-0.8, 0.8);
      const lat = pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f + r.r(-0.8, 0.8);
      const [x, y] = mapXY(lon, lat);
      const hgt = r.r(3, 5) * s;
      poly(c, [[x - hgt * 0.8, y + 1], [x, y - hgt], [x + hgt * 0.8, y + 1]], '#b69a6a');
      poly(c, [[x, y - hgt], [x + hgt * 0.8, y + 1], [x + 1, y + 1]], '#8a6a44');
      if (s > 1.1) px(c, x, y - hgt + 1, '#f4ecd8');
    }
  };
  peaks([[6, 45.8], [10, 46.5], [14, 47]], 6);
  peaks([[19, 49], [24, 48], [26, 46], [23, 45.3]], 5, 0.8);
  peaks([[40, 43.5], [47, 41.5]], 4);
  peaks([[59, 67], [59.5, 60], [58.5, 54], [58, 51]], 9);
  peaks([[72, 36], [80, 32], [88, 28.5], [95, 28]], 10, 1.3);
  peaks([[70, 41], [80, 42], [88, 43]], 6);
  peaks([[85, 50], [90, 50.5], [98, 52]], 5);
  peaks([[108, 55], [115, 55.5]], 3, 0.8);
  peaks([[137.3, 36.5], [138.3, 35.8]], 2, 0.8);
  c.restore();
  // the coast itself, inked
  c.strokeStyle = '#6a4a2a'; c.lineWidth = 1;
  for (const p of polys) { c.beginPath(); path(c, p); c.stroke(); }
  // Lake Baikal and the great rivers
  const lake = [[103.8, 51.6], [105.5, 51.9], [107.5, 52.8], [109.3, 54.2], [109.9, 55.8], [109.2, 55.7], [108, 54.3], [106.2, 53.2], [104.4, 52.3]];
  c.fillStyle = '#9cb2a4'; c.strokeStyle = '#6a4a2a';
  c.beginPath(); lake.forEach(([lon, lat], i) => { const [x, y] = mapXY(lon, lat); if (i) c.lineTo(x, y); else c.moveTo(x, y); }); c.closePath(); c.fill(); c.stroke();
  const river = (pts) => { c.strokeStyle = '#7f9a94'; c.lineWidth = 1; c.beginPath(); pts.forEach(([lon, lat], i) => { const [x, y] = mapXY(lon, lat); if (i) c.lineTo(x, y); else c.moveTo(x, y); }); c.stroke(); };
  river([[120.9, 53.3], [124.8, 53.2], [127.5, 50.3], [130.5, 48.2], [135.1, 48.5], [137, 50.5], [140.7, 53.1]]);
  river([[36, 57.5], [42, 56.4], [47, 56.1], [49, 55.4], [48.3, 51.5], [46, 48.5], [47.9, 46.3]]);
  river([[9, 48], [16.4, 48.2], [19, 47.6], [19, 45.2], [22.5, 44.6], [26, 43.8], [29.6, 45.2]]);
  river([[103, 52.2], [101.5, 55], [98, 58], [93, 59], [90, 62], [87, 66]]);
  // a compass rose in the Arabian Sea, and a sea monster's wake of little waves
  const [cx, cy] = [234, 232];
  for (const [a, len, col] of [[0, 14, '#6a4a2a'], [Math.PI / 2, 14, '#6a4a2a'], [Math.PI, 14, '#6a4a2a'], [-Math.PI / 2, 18, '#a8321f'], [Math.PI / 4, 8, '#8a6a44'], [-Math.PI / 4, 8, '#8a6a44'], [3 * Math.PI / 4, 8, '#8a6a44'], [-3 * Math.PI / 4, 8, '#8a6a44']]) {
    const tx = cx + Math.cos(a) * len, ty = cy + Math.sin(a) * len;
    const nx = Math.cos(a + Math.PI / 2) * 2.5, ny = Math.sin(a + Math.PI / 2) * 2.5;
    poly(c, [[cx + nx, cy + ny], [tx, ty], [cx - nx, cy - ny]], col);
  }
  c.strokeStyle = '#6a4a2a'; c.beginPath(); c.arc(cx, cy, 9, 0, TAU); c.stroke();
  circle(c, cx, cy, 2, '#e6d3a4');
  for (let i = 0; i < 40; i++) {
    const x = r.r(10, 470), y = r.r(170, 262);
    const d = c.getImageData(Math.round(x), Math.round(y), 1, 1).data;
    if (d[1] > d[0] + 10) { line(c, x, y, x + 2, y - 1, '#7f978c', 1); line(c, x + 2, y - 1, x + 4, y, '#7f978c', 1); }
  }
  // the sheet: stains, darkened and burnt edges, a double ruled border
  for (let i = 0; i < 7; i++) ellipse(c, r.r(0, W), r.r(0, H), r.r(20, 60), r.r(14, 40), 'rgba(120,80,30,0.08)');
  c.save();
  const edge = c.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, 290);
  edge.addColorStop(0, 'rgba(60,30,10,0)'); edge.addColorStop(0.75, 'rgba(60,30,10,0.35)'); edge.addColorStop(1, 'rgba(40,18,6,0.85)');
  c.fillStyle = edge; c.fillRect(0, 0, W, H);
  c.restore();
  c.strokeStyle = '#4a2e18'; c.lineWidth = 1;
  c.strokeRect(4.5, 4.5, W - 9, H - 9); c.strokeRect(7.5, 7.5, W - 15, H - 15);
  return { colors: 56, spread: 10, vignette: [0.25, '30,14,0'] };
};

// ---------------------------------------------------------------- the cup (Chapter 3)
SCENES.the_cup = (c, L) => {
  const r = rng(303);
  // far behind: the night room, out of focus: blue screens, the moon's square of light
  vgrad(c, 0, 0, W, H, [[0, '#0e1836'], [0.6, '#1c2a52'], [1, '#141c38']]);
  for (let x = -10; x < W; x += 46) { rect(c, x, 0, 36, 150, '#243466'); rect(c, x, 0, 36, 2, '#30447a'); }
  rect(c, 300, 20, 120, 110, '#3a5494'); glow(c, 360, 70, 90, 'rgba(160,190,255,0.35)');
  for (let i = 0; i < 26; i++) crown(c, r, 300 + r() * 120, 20 + r() * 50, r.r(5, 10), r.r(4, 7), ['#3a3a70', '#6a5a9a', '#9a7ab8'], { x: 0.3, y: -1 }, 7);
  // a paper lantern far off, out of focus
  glow(c, 92, 104, 60, 'rgba(255,170,80,0.4)');
  ellipse(c, 92, 104, 12, 16, '#e8a060'); ellipse(c, 92, 104, 8, 12, '#ffd8a0'); rect(c, 84, 86, 16, 3, '#3a2a2a'); rect(c, 84, 120, 16, 3, '#3a2a2a');
  // the lacquered table, glossy black-red, running away from us
  const tb = L('table', { depth: 0.35 });
  poly(tb, [[0, 150], [W, 132], [W, H], [0, H]], '#2a0e0e');
  vgrad(tb, 0, 132, W, 138, [[0, 'rgba(120,30,20,0.9)'], [0.3, 'rgba(60,12,10,0.6)'], [1, 'rgba(10,2,2,0.3)']]);
  line(tb, 0, 150, W, 132, '#a8483a', 1);
  // a reflected sheen of the moon window and the lamp on the lacquer
  poly(tb, [[270, 150], [420, 142], [440, 170], [250, 180]], 'rgba(120,150,230,0.22)');
  ellipse(tb, 110, 170, 60, 10, 'rgba(255,170,90,0.25)');
  // the edge of her sleeve at the right, just drawn back: red silk with gold waves
  const sl = L('sleeve', { depth: 0.6, anim: { type: 'sway', a: 0.5, t: 7, ox: 1, oy: 0 } });
  sl.fillStyle = '#7a1822';
  sl.beginPath(); sl.moveTo(W, 0); sl.lineTo(410, 0); sl.bezierCurveTo(396, 70, 402, 150, 430, 220); sl.bezierCurveTo(446, 250, 470, 262, W, 266); sl.closePath(); sl.fill();
  sl.fillStyle = '#a82a32';
  sl.beginPath(); sl.moveTo(W, 0); sl.lineTo(424, 0); sl.bezierCurveTo(414, 70, 420, 146, 444, 206); sl.bezierCurveTo(456, 232, 470, 244, W, 250); sl.closePath(); sl.fill();
  // the hem, lined in pale silk
  sl.strokeStyle = '#f0dcc0'; sl.lineWidth = 3;
  sl.beginPath(); sl.moveTo(410, 0); sl.bezierCurveTo(396, 70, 402, 150, 430, 220); sl.bezierCurveTo(446, 250, 470, 262, W, 266); sl.stroke();
  // seigaiha waves in gold thread
  sl.strokeStyle = '#d8a848'; sl.lineWidth = 1;
  for (let y = 12; y < 250; y += 12) for (let x = 432 + ((y / 12) % 2) * 7; x < W; x += 14) {
    if (x < 420 + (y / 250) * 30) continue;
    sl.beginPath(); sl.arc(x, y, 6, Math.PI, 0); sl.stroke();
    sl.beginPath(); sl.arc(x, y, 3, Math.PI, 0); sl.stroke();
  }
  // the cup: plain white porcelain, a pale blue glaze pooling at the foot, still warm
  const cup = L('cup', { depth: 0.55 });
  ellipse(cup, 250, 232, 72, 12, 'rgba(0,0,0,0.55)');
  cup.fillStyle = '#e8e4dc';
  cup.beginPath(); cup.moveTo(190, 150); cup.bezierCurveTo(192, 200, 206, 226, 250, 228); cup.bezierCurveTo(294, 226, 308, 200, 310, 150); cup.closePath(); cup.fill();
  hgrad(cup, 190, 150, 120, 80, [[0, 'rgba(90,110,160,0.55)'], [0.35, 'rgba(255,255,255,0)'], [0.62, 'rgba(255,250,240,0.35)'], [1, 'rgba(60,70,120,0.6)']]);
  vgrad(cup, 196, 196, 108, 32, [[0, 'rgba(120,160,200,0)'], [1, 'rgba(110,150,200,0.55)']]);
  ellipse(cup, 250, 226, 30, 5, '#c8ccd8'); ellipse(cup, 250, 228, 26, 4, '#9aa4bc');
  ellipse(cup, 250, 150, 60, 12, '#f4f2ee'); ellipse(cup, 250, 151, 55, 9.5, '#4a2c14');
  ellipse(cup, 252, 153, 48, 7, '#6a4420'); ellipse(cup, 262, 151, 18, 3, '#b8905a');
  // the faint trace of her lips on the rim
  ellipse(cup, 206, 146, 8, 2.6, '#c8606e'); ellipse(cup, 206, 145.6, 5, 1.4, '#e0909a'); px(cup, 203, 145, '#f4c0c8');
  // a painted sprig of plum blossom on the side of the cup
  line(cup, 262, 176, 292, 164, '#5a4a6a', 1); line(cup, 276, 170, 282, 182, '#5a4a6a', 1);
  for (const [x, y] of [[270, 172], [288, 165], [282, 181]]) { circle(cup, x, y, 2.5, '#d86a8a'); px(cup, x, y, '#ffe8a0'); }
  glow(cup, 230, 175, 26, 'rgba(255,240,220,0.35)');
  return { colors: 60, vignette: [0.55, '6,4,20'] };
};

// ---------------------------------------------------------------- the glove (Chapter 6)
SCENES.the_glove = (c, L) => {
  const r = rng(606);
  // tatami in afternoon light
  vgrad(c, 0, 0, W, H, [[0, '#8a7040'], [1, '#6a5430']]);
  for (let y = 0; y < H; y += 2) line(c, 0, y, W, y + 6, y % 4 ? '#94784a' : '#7e663e', 1);
  rect(c, 0, 118, W, 5, '#3a2c1a'); rect(c, 0, 119, W, 1, '#1e160c');
  texture(c, r, 0, 0, W, H, 0.06, 2);
  // light through the paper screen: a warm square on the floor
  poly(c, [[60, 0], [360, 0], [420, 270], [0, 270]], 'rgba(255,220,150,0.22)');
  for (let i = 0; i < 5; i++) { const x = 90 + i * 66; poly(c, [[x, 0], [x + 4, 0], [x + 24, H], [x + 18, H]], 'rgba(60,40,10,0.18)'); }
  // her shawl: pale lilac silk, folded, with a woven pattern of little diamonds
  const cl = L('things', { depth: 0.45 });
  const shawl = [[70, 120], [300, 96], [360, 190], [110, 236]];
  poly(cl, shawl, '#b8a0c8');
  poly(cl, [[70, 120], [300, 96], [306, 108], [80, 134]], '#d6c4e2');
  poly(cl, [[110, 236], [360, 190], [362, 198], [114, 246]], '#8a6c9e');
  for (let i = 0; i < 90; i++) {
    const u = r(), v = r();
    const x = 70 + u * 230 + v * 40 + (1 - u) * v * 0, y = 120 - u * 24 + v * 116 - u * v * 22;
    poly(cl, [[x, y - 2], [x + 2, y], [x, y + 2], [x - 2, y]], r() < 0.5 ? '#9a82ae' : '#cab6d8');
  }
  for (let k = 0; k < 10; k++) line(cl, 112 + k * 25, 238 - k * 4.6, 118 + k * 25, 250 - k * 4.6, '#6a4c7e', 1);
  // the lacquered box, black with a gold spray of grasses
  poly(cl, [[340, 60], [440, 50], [460, 110], [356, 124]], '#1a1210');
  poly(cl, [[340, 60], [440, 50], [444, 58], [344, 68]], '#3a2a24');
  poly(cl, [[356, 124], [460, 110], [462, 124], [358, 138]], '#0e0a08');
  for (let k = 0; k < 8; k++) { const x = 360 + k * 11; line(cl, x, 112, x + r.r(-8, 8), 80 + r() * 16, '#c8a04a', 1); }
  circle(cl, 420, 76, 7, '#d8b060'); circle(cl, 420, 76, 5, '#1a1210');
  line(cl, 348, 62, 436, 53, '#8a7a6a', 1);
  // the glove: brown leather, fingers a little curled, laid across the silk
  const gl = L('glove', { depth: 0.6 });
  ellipse(gl, 212, 188, 50, 22, '#a890bc');
  gl.save();
  gl.translate(206, 176); gl.rotate(-0.55);
  gl.lineCap = 'round';
  const capsule = (x0, y0, x1, y1, w, fill, edge) => {
    gl.strokeStyle = edge; gl.lineWidth = w + 2; gl.beginPath(); gl.moveTo(x0, y0); gl.lineTo(x1, y1); gl.stroke();
    gl.strokeStyle = fill; gl.lineWidth = w; gl.beginPath(); gl.moveTo(x0, y0); gl.lineTo(x1, y1); gl.stroke();
  };
  const edge = '#3a1e0c', leather = '#7a4a28', lit = '#a06a3a';
  // the cuff, flaring, its silk lining showing at the opening
  poly(gl, [[-25, 26], [25, 26], [32, 62], [-32, 62]], edge);
  poly(gl, [[-23, 27], [23, 27], [29, 60], [-29, 60]], '#5a3218');
  rect(gl, -30, 58, 60, 3, '#e6d6b4');
  for (let k = -2; k <= 2; k++) line(gl, k * 10, 30, k * 12, 58, '#4a2812', 1);
  // the fingers
  for (const [x, len, ang] of [[-18, 32, -0.16], [-6, 40, -0.05], [6, 38, 0.05], [18, 29, 0.16]]) {
    const x1 = x + Math.sin(ang) * len, y1 = -18 - Math.cos(ang) * len;
    capsule(x, -14, x1, y1, 10, leather, edge);
    line(gl, x - 2, -16, x1 - 2, y1 + 2, lit, 1);
    line(gl, x + (x1 - x) * 0.55 - 3, -16 + (y1 + 16) * 0.55, x + (x1 - x) * 0.55 + 3, -16 + (y1 + 16) * 0.55, '#5a3218', 1);
  }
  // the back of the hand and the thumb
  capsule(-20, 10, -40, -8, 11, leather, edge);
  line(gl, -22, 8, -38, -8, lit, 1);
  gl.fillStyle = edge; gl.beginPath(); gl.roundRect(-26, -20, 52, 50, 12); gl.fill();
  gl.fillStyle = leather; gl.beginPath(); gl.roundRect(-24, -18, 48, 46, 11); gl.fill();
  hgrad(gl, -24, -18, 48, 46, [[0, 'rgba(180,120,70,0.5)'], [0.5, 'rgba(0,0,0,0)'], [1, 'rgba(40,20,5,0.4)']]);
  // stitching running down from the knuckles
  for (const x of [-10, 0, 10]) { for (let y = -14; y < 22; y += 4) px(gl, x, y, '#c89a60'); }
  gl.restore();
  return { colors: 60, vignette: [0.45, '30,14,0'] };
};

// ---------------------------------------------------------------- the letter (Chapter 14)
/** Vertical columns of calligraphy: short dark strokes, some heavy, some light. */
function calligraphy(c, r, x0, y0, w, h, ink = '#1a1210') {
  const colW = 9;
  for (let x = x0 + w - colW; x > x0 + 2; x -= colW + 2) {
    let y = y0 + 4;
    const end = y0 + h - 4 - r() * (r() < 0.2 ? h * 0.5 : 8);
    while (y < end) {
      const gh = r.r(5, 8);
      for (let k = 0; k < 3; k++) {
        const sx = x + r.r(0, colW - 3), sy = y + r.r(0, gh - 2);
        if (r() < 0.5) line(c, sx, sy, sx + r.r(2, 5), sy + r.r(-1, 1), ink, 1);
        else line(c, sx, sy, sx + r.r(-1, 2), sy + r.r(2, 4), ink, 1);
      }
      if (r() < 0.3) px(c, x + r.r(1, colW - 2), y + gh - 1, ink);
      y += gh + 2;
    }
  }
}

SCENES.the_letter = (c, L) => {
  const r = rng(1414);
  // Madame Blanche's table, dark polished wood, lamplight from the right
  vgrad(c, 0, 0, W, H, [[0, '#2a1810'], [1, '#1a0e08']]);
  for (let y = 0; y < H; y += 3) line(c, 0, y, W, y + r.r(-2, 2), r() < 0.5 ? '#301c12' : '#24140c', 1);
  glow(c, 420, 60, 220, 'rgba(255,170,80,0.45)');
  // seven sheets, overlapping, each covered in columns of black ink
  const sh = L('sheets', { depth: 0.45 });
  const sheets = [[40, 70, 120, 150, -0.12], [120, 50, 118, 150, 0.05], [200, 80, 116, 148, -0.04], [260, 40, 112, 146, 0.1], [70, 130, 116, 140, 0.08], [170, 120, 118, 140, -0.08], [270, 128, 112, 136, 0.03]];
  for (const [x, y, w, hh, rot] of sheets) {
    sh.save(); sh.translate(x + w / 2, y + hh / 2); sh.rotate(rot);
    rect(sh, -w / 2 + 3, -hh / 2 + 4, w, hh, 'rgba(0,0,0,0.5)');
    rect(sh, -w / 2, -hh / 2, w, hh, '#efe4c8');
    vgrad(sh, -w / 2, -hh / 2, w, hh, [[0, 'rgba(255,240,210,0.4)'], [1, 'rgba(120,80,40,0.2)']]);
    calligraphy(sh, r, -w / 2 + 6, -hh / 2 + 6, w - 12, hh - 12);
    sh.restore();
  }
  // the envelope with its Japanese stamps
  sh.save(); sh.translate(390, 214); sh.rotate(-0.16);
  rect(sh, -52, -30, 104, 60, '#d8c8a0'); poly(sh, [[-52, -30], [0, 6], [52, -30]], '#c8b88e');
  rect(sh, 26, -24, 16, 20, '#a83a2a'); rect(sh, 28, -22, 12, 16, '#e0a060'); circle(sh, 34, -14, 3, '#a83a2a');
  rect(sh, 8, -24, 16, 20, '#3a5a8a'); rect(sh, 10, -22, 12, 16, '#8ab0d8');
  sh.strokeStyle = 'rgba(40,20,10,0.6)'; sh.beginPath(); sh.arc(26, -8, 11, 0, TAU); sh.stroke();
  sh.restore();
  // the lamp: a brass oil lamp with a glass chimney
  const lp = L('lamp', { depth: 0.6 });
  ellipse(lp, 430, 150, 26, 6, '#6a4a1a'); rect(lp, 424, 110, 12, 40, '#a8782a'); rect(lp, 426, 110, 3, 40, '#e8c060');
  ellipse(lp, 430, 104, 20, 14, '#c8962e'); ellipse(lp, 426, 100, 8, 5, '#f0d078');
  rect(lp, 422, 40, 16, 58, 'rgba(255,240,200,0.5)'); rect(lp, 424, 40, 3, 58, '#fff6dc');
  ellipse(lp, 430, 78, 4, 10, '#ffd070'); ellipse(lp, 430, 80, 2, 6, '#fff8e0');
  glow(lp, 430, 76, 70, 'rgba(255,200,110,0.6)');
  return { colors: 58, vignette: [0.5, '20,8,0'] };
};

// ---------------------------------------------------------------- the silkworms dying (Prologue, Chapter 13)
SCENES.cs_worms = (c, L) => {
  const r = rng(1860);
  // a dim loft: grey light from a small window on the left
  vgrad(c, 0, 0, W, H, [[0, '#3a3a3e'], [1, '#1e1e22']]);
  shaft(c, [[0, 0], [70, 0], [300, 270], [140, 270]], 'rgba(200,210,230,1)', 0.12);
  // the round rearing tray of woven bamboo
  const tr = L('tray', { depth: 0.45 });
  ellipse(tr, 240, 170, 230, 96, '#4a3a26');
  ellipse(tr, 240, 164, 222, 90, '#8a7248');
  for (let k = 0; k < 18; k++) { tr.strokeStyle = k % 2 ? '#7a6440' : '#96805a'; tr.lineWidth = 1; tr.beginPath(); tr.ellipse(240, 164, 222 - k * 12, 90 - k * 4.9, 0, 0, TAU); tr.stroke(); }
  ellipse(tr, 240, 172, 200, 78, '#6e5a38');
  // a bed of mulberry leaves, some already yellowing and curling
  const leaf = (ctx, x, y, rot, sz, pal) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = pal[2];
    ctx.beginPath(); ctx.moveTo(-sz, 0); ctx.bezierCurveTo(-sz * 0.6, -sz * 0.75, sz * 0.5, -sz * 0.8, sz * 1.1, 0); ctx.bezierCurveTo(sz * 0.5, sz * 0.8, -sz * 0.6, sz * 0.75, -sz, 0); ctx.fill();
    ctx.fillStyle = pal[0];
    ctx.beginPath(); ctx.moveTo(-sz + 2, 0); ctx.bezierCurveTo(-sz * 0.6, -sz * 0.62, sz * 0.5, -sz * 0.66, sz, 0); ctx.bezierCurveTo(sz * 0.5, sz * 0.55, -sz * 0.6, sz * 0.5, -sz + 2, 0); ctx.fill();
    line(ctx, -sz + 2, 0, sz, 0, pal[1], 1);
    for (let k = -2; k <= 2; k++) { line(ctx, k * sz * 0.3, 0, k * sz * 0.3 + sz * 0.25, -sz * 0.45, pal[1], 1); line(ctx, k * sz * 0.3, 0, k * sz * 0.3 + sz * 0.25, sz * 0.4, pal[1], 1); }
    ctx.restore();
  };
  for (let i = 0; i < 70; i++) {
    const a = r() * TAU, d = Math.sqrt(r()) * 0.95;
    const pal = r() < 0.45 ? ['#5a6a30', '#7a8a40', '#3a4820'] : r() < 0.6 ? ['#8a8a36', '#aaa04a', '#5a5a24'] : ['#9a7a36', '#b8984a', '#6a4e20'];
    leaf(tr, 240 + Math.cos(a) * d * 190, 172 + Math.sin(a) * d * 66, r() * TAU, r.r(16, 26), pal);
  }
  // the worms: pale and grey, lying still on the leaves they stopped eating
  const wm = L('worms', { depth: 0.5 });
  for (let i = 0; i < 16; i++) {
    const a = r() * TAU, d = Math.sqrt(r()) * 0.85;
    const x = 240 + Math.cos(a) * d * 170, y = 172 + Math.sin(a) * d * 56;
    const ang = r() * TAU, len = r.r(22, 32), bend = r.r(-0.9, 0.9);
    const sick = r() < 0.5;
    const pts = [];
    for (let k = 0; k <= len; k += 1) { const t = k / len; pts.push([x + Math.cos(ang + bend * t) * k, y + Math.sin(ang + bend * t) * k * 0.7, t]); }
    for (const [wx, wy, t] of pts) circle(wm, wx, wy + 1, 4 - t * 1.2, '#4a4436');
    for (const [wx, wy, t] of pts) circle(wm, wx, wy, 3.6 - t * 1.2, sick ? '#b4ae9e' : '#d4d0c2');
    for (const [wx, wy, t] of pts) if (t < 0.9) px(wm, wx - 1, wy - 2, sick ? '#d0cabc' : '#eeeae0');
    pts.forEach(([wx, wy], k) => { if (k % 4 === 2) line(wm, wx - 2, wy - 2, wx + 2, wy + 2, sick ? '#8a8474' : '#a8a498', 1); });
    if (sick) for (let k = 0; k < 3; k++) { const p = pts[Math.floor(r() * pts.length)]; px(wm, p[0], p[1], '#6a5a44'); }
    circle(wm, pts[0][0], pts[0][1], 2.6, '#8a8272');
  }
  // an egg card: paper speckled with grey eggs that never hatched
  wm.save(); wm.translate(96, 214); wm.rotate(-0.2);
  rect(wm, -40, -24, 80, 48, '#d8d0bc'); for (let i = 0; i < 260; i++) px(wm, r.r(-36, 36), r.r(-20, 20), r() < 0.7 ? '#6a6a70' : '#8a8a90');
  wm.restore();
  return { colors: 56, vignette: [0.6, '0,0,0'] };
};

// ---------------------------------------------------------------- the warships (Chapters 9 and 10)
SCENES.cs_warships = (c, L) => {
  const r = rng(1863);
  // a sky the colour of rust, smoke drifting across it
  vgrad(c, 0, 0, W, 170, [[0, '#2a1a2a'], [0.5, '#8a3a2a'], [0.85, '#d87a3a'], [1, '#f0b060']]);
  sun(c, 380, 150, 16, '#ffd890', 'rgba(255,150,70,0.6)');
  for (let i = 0; i < 5; i++) cloudBand(c, r, r.r(-40, 400), r.r(30, 120), r.r(120, 200), r.r(8, 16), { body: '#4a2a34', rim: '#d8804a', shadow: '#2e1a24', hi: '#ffc080' });
  // the coast of Japan behind: hills, a castle, a town
  hill(c, r, -20, 260, 170, 40, '#3a2230');
  hill(c, r, 160, 500, 170, 28, '#4a2a34');
  // a castle on the hill, and the roofs of the port town along the shore
  const cy0 = 150;
  rect(c, 94, cy0 - 12, 24, 12, '#2a1624'); poly(c, [[88, cy0 - 12], [124, cy0 - 12], [116, cy0 - 20], [96, cy0 - 20]], '#1e0e1a');
  rect(c, 99, cy0 - 28, 14, 8, '#2a1624'); poly(c, [[94, cy0 - 28], [118, cy0 - 28], [112, cy0 - 35], [100, cy0 - 35]], '#1e0e1a');
  for (let i = 0; i < 16; i++) { const x = 10 + i * 14 + r.r(-3, 3), y = 164 + r.r(-2, 3); poly(c, [[x - 6, y], [x + 6, y], [x + 3, y - 4], [x - 3, y - 4]], '#24121e'); rect(c, x - 4, y, 8, 4, '#2e1a26'); if (r() < 0.3) px(c, x, y + 1, '#f0a050'); }
  // the sea
  vgrad(c, 0, 170, W, 100, [[0, '#8a4a3a'], [0.3, '#4a2a34'], [1, '#1a1020']]);
  for (let i = 0; i < 60; i++) { const y = 172 + r() * 96, x = r() * W; rect(c, x, y, r.r(6, 20), 1, r() < 0.4 ? '#e8905a' : '#6a3a3a'); }
  // the black ships, steam and sail, gun ports open
  const ship = (cx, yb, s, id, depth) => {
    const sp = L(id, { depth, anim: { type: 'bob', a: 0.7, t: 5 + s } });
    sp.fillStyle = '#120a10';
    sp.beginPath(); sp.moveTo(cx - 80 * s, yb - 20 * s); sp.lineTo(cx + 90 * s, yb - 22 * s); sp.lineTo(cx + 70 * s, yb); sp.lineTo(cx - 70 * s, yb); sp.closePath(); sp.fill();
    rect(sp, cx - 78 * s, yb - 24 * s, 164 * s, 4 * s, '#2a1a1e');
    for (let k = 0; k < 9; k++) rect(sp, cx - 60 * s + k * 15 * s, yb - 14 * s, 5 * s, 4 * s, k % 3 ? '#3a2a24' : '#f0a050');
    for (const [mx, mh] of [[-50, 90], [0, 104], [50, 86]]) {
      rect(sp, cx + mx * s, yb - (22 + mh) * s, 2 * s, mh * s, '#1e1216');
      for (let k = 1; k < 4; k++) rect(sp, cx + (mx - 16) * s, yb - (22 + mh * k / 4) * s, 34 * s, 1.5 * s, '#1e1216');
    }
    rect(sp, cx + 20 * s, yb - 52 * s, 12 * s, 30 * s, '#1a1016'); rect(sp, cx + 20 * s, yb - 52 * s, 12 * s, 3 * s, '#3a2a2a');
    line(sp, cx + 90 * s, yb - 22 * s, cx + 130 * s, yb - 60 * s, '#1e1216', Math.max(1, s));
  };
  ship(330, 206, 0.55, 'ship_far', 0.35);
  ship(150, 236, 0.9, 'ship_near', 0.6);
  return { colors: 60, vignette: [0.5, '20,0,10'] };
};

// ---------------------------------------------------------------- the candle (Chapter 15)
function candleScene(c, L, dawn) {
  const r = rng(1515);
  // the window behind: deep night with snow, or the first clear morning
  vgrad(c, 0, 0, W, H, dawn ? [[0, '#3a4a6a'], [1, '#2a2a3a']] : [[0, '#0c1024'], [1, '#141828']]);
  const win = [150, 16, 190, 150];
  vgrad(c, win[0], win[1], win[2], win[3], dawn ? [[0, '#6a8ac0'], [0.55, '#e8b890'], [1, '#ffe0a8']] : [[0, '#0a1430'], [1, '#22335e']]);
  if (dawn) { sun(c, 270, 150, 12, '#fff4d0', 'rgba(255,210,150,0.6)'); glow(c, 245, 120, 140, 'rgba(255,220,170,0.4)'); }
  else stars(c, r, 30, win[0], win[1], win[2], 90);
  hill(c, r, win[0], win[0] + win[2], win[1] + win[3], 22, dawn ? '#6a6a8a' : '#101a38');
  for (let i = 0; i < 6; i++) poplar(c, r, win[0] + 20 + i * 30, win[1] + win[3] - 6, r.r(30, 50), dawn ? { trunk: '#3a3a5a', leaves: ['#3a3a5a', '#4a4a6a', '#6a6a8a'] } : { trunk: '#0a1026', leaves: ['#0a1026', '#141c3a', '#1e2a4a'] });
  rect(c, win[0] - 6, win[1] - 6, win[2] + 12, 6, '#3a2a22'); rect(c, win[0] - 6, win[1] + win[3], win[2] + 12, 8, '#4a3428');
  rect(c, win[0] - 6, win[1], 6, win[3], '#3a2a22'); rect(c, win[0] + win[2], win[1], 6, win[3], '#3a2a22');
  rect(c, win[0] + win[2] / 2 - 2, win[1], 4, win[3], '#3a2a22'); rect(c, win[0], win[1] + win[3] / 2 - 2, win[2], 4, '#3a2a22');
  // curtains
  for (const x of [120, 340]) { vgrad(c, x, 0, 30, 190, [[0, '#6a4a5a'], [1, '#3a2a34']]); for (let k = 0; k < 4; k++) line(c, x + 4 + k * 7, 0, x + 4 + k * 7, 190, '#2a1a24', 1); }
  // the nightstand
  const ns = L('stand', { depth: 0.5 });
  poly(ns, [[40, 196], [440, 196], [470, 226], [10, 226]], dawn ? '#6a4a34' : '#3a2418');
  rect(ns, 10, 226, 460, 44, dawn ? '#4a3222' : '#24160e');
  line(ns, 40, 196, 440, 196, dawn ? '#a8805a' : '#6a4a30', 1);
  // a book, a glass of water, a folded handkerchief
  poly(ns, [[60, 208], [150, 202], [160, 216], [70, 222]], '#5a2a2a'); poly(ns, [[62, 206], [150, 200], [152, 204], [64, 210]], '#e8dcc0');
  rect(ns, 330, 168, 26, 40, dawn ? '#a8b4c8' : '#3a4468'); rect(ns, 332, 186, 22, 20, dawn ? '#8a9cc0' : '#2a3458'); rect(ns, 333, 170, 3, 36, dawn ? '#eef4ff' : '#8a9ad0'); rect(ns, 330, 168, 26, 2, dawn ? '#dde6f6' : '#5a6aa0');
  poly(ns, [[380, 206], [430, 202], [436, 214], [386, 218]], '#efe8dc');
  // the candle in its brass holder: burning, or burnt down and out
  ellipse(ns, 240, 206, 30, 7, '#8a6a2a'); ellipse(ns, 240, 204, 26, 5, '#d8b050');
  const top = dawn ? 150 : 110;
  rect(ns, 230, top, 20, 204 - top, '#efe6d0'); rect(ns, 230, top, 5, 204 - top, '#fff8e8'); rect(ns, 246, top, 4, 204 - top, '#c8bca0');
  for (let k = 0; k < 4; k++) { const x = 232 + r() * 14; rect(ns, x, top, 3, r.r(8, 26), '#f6eedc'); }
  ellipse(ns, 240, top, 10, 3, '#f8f0e0');
  rect(ns, 239, top - 7, 2, 7, '#2a2020');
  if (!dawn) {
    // the flame, and its warm light on the wall and the stand (painted on the room behind)
    glow(c, 240, top - 14, 110, 'rgba(255,170,80,0.45)');
    ellipse(ns, 240, top - 14, 4, 9, '#ffb040'); ellipse(ns, 240, top - 13, 2.5, 6, '#ffe8a0'); px(ns, 240, top - 10, '#ffffff');
    poly(ns, [[180, 196], [300, 196], [320, 226], [160, 226]], 'rgba(0,0,0,0)');
  }
  return { colors: 60, vignette: [dawn ? 0.35 : 0.6, dawn ? '30,20,20' : '0,0,10'] };
}
SCENES.cs_candle = (c, L) => candleScene(c, L, false);
SCENES.cs_candle_dawn = (c, L) => candleScene(c, L, true);
