/*
 * walk.js — the walking areas, in the spirit of Kingdom Two Crowns: a side view of a long
 * painted place, layers sliding past at different speeds, the whole world mirrored in the
 * water below, and Hervé walking (or riding) through it. Things along the way can be picked up
 * (francs, keepsakes), looked at, or talked to; reaching the goal hands the story back.
 *
 * The places are painted by tools/paint-walks.js (story/walkscenery.js says how the layers
 * stack); what happens in each is written in story/walks.js. The script starts one with:
 *
 *   walk camp
 *
 * Controls: ← → or A D to walk, Shift to run, E / Space / Enter to look, pick up or talk,
 * or hold the mouse (or a finger) on either side of the screen; click something to go to it.
 */
(function () {
  'use strict';
  const VN = (globalThis.VN = globalThis.VN || {});
  const h = VN.h;

  const LW = 480, LH = 270, GY = 204, WY = 211, SS = 2; // the painted size, ground line, water line, supersampling
  const REACH = 24; // how close Hervé must be to something to use it
  const url = (src) => (globalThis.VN_EMBEDDED_ASSETS || {})[src] || src;
  const images = new Map();
  function image(src) {
    if (!images.has(src)) {
      images.set(src, new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url(src);
      }));
    }
    return images.get(src);
  }

  // ---------------------------------------------------------------- little people, drawn in pixels
  // Each look is a few colours and a hat; the figures are about 24 pixels tall, like Kingdom's.
  const LOOKS = {
    soldier: { coat: '#2e4a8a', coatDark: '#22386a', legs: '#b83a3a', boots: '#1a1412', skin: '#e8c0a0', hat: 'kepi', hatCol: '#b83a3a', belt: '#e8dcc0' },
    traveller: { coat: '#5a3e2a', coatDark: '#42301f', legs: '#3a3440', boots: '#1a1412', skin: '#e8c0a0', hat: 'tophat', hatCol: '#1e1a1e', scarf: '#e8dcc8' },
    mourner: { coat: '#1e1e26', coatDark: '#141418', legs: '#26262e', boots: '#101014', skin: '#e0bca0', hat: 'tophat', hatCol: '#101014' },
    baldabiou: { coat: '#6a4a2e', coatDark: '#50381f', legs: '#4a3a2a', boots: '#2a1e14', skin: '#e8b898', hat: 'hat', hatCol: '#e8dcc0', wide: 1, beard: '#8a8a8a' },
    drummer: { coat: '#2e4a8a', coatDark: '#22386a', legs: '#b83a3a', boots: '#1a1412', skin: '#f0c8a8', hat: 'kepi', hatCol: '#b83a3a', small: 1, drum: 1 },
    villager: { coat: '#6a6258', coatDark: '#4e483f', legs: '#3a342e', boots: '#2a2018', skin: '#e0b494', hat: 'fur', hatCol: '#4a3a2a', beard: '#6a5a4a' },
    merchant: { coat: '#8a3a2a', coatDark: '#6a2a1e', legs: '#3a2a22', boots: '#2a1e14', skin: '#d8a888', hat: 'fur', hatCol: '#2a2020' },
    guard: { coat: '#2a2a3a', coatDark: '#1c1c2a', legs: '#1c1c2a', boots: '#141418', skin: '#e0b898', hat: 'topknot', hatCol: '#141418', sword: 1 },
    servant: { coat: '#8a5a7a', coatDark: '#6a4460', legs: '#6a4460', boots: '#e8e0d0', skin: '#f0d0b8', hat: 'bun', hatCol: '#1a1418', robe: 1 },
    boy: { coat: '#6a5a3a', coatDark: '#50442a', legs: '#50442a', boots: '#e8c0a0', skin: '#e8c0a0', hat: 'none', hatCol: '#1a1414', small: 1 },
    patrol: { coat: '#3a3a2a', coatDark: '#2a2a1e', legs: '#2a2a1e', boots: '#141410', skin: '#d8b090', hat: 'jingasa', hatCol: '#2a2420', lantern: 1 },
    bandit: { coat: '#3a3028', coatDark: '#2a221c', legs: '#2a221c', boots: '#141010', skin: '#c89878', hat: 'fur', hatCol: '#1a1410', beard: '#3a2a20' },
    // the French army of the 1860s: line infantry with rifles, officers, gunners and Zouaves
    rifleman: { coat: '#2e4a8a', coatDark: '#22386a', legs: '#b83a3a', boots: '#1a1412', skin: '#e8c0a0', hat: 'kepi', hatCol: '#b83a3a', belt: '#e8dcc0', rifle: 1 },
    officer: { coat: '#1e2e5a', coatDark: '#141f40', legs: '#b83a3a', boots: '#1a1412', skin: '#e8c0a0', hat: 'kepi', hatCol: '#1e2e5a', belt: '#e8c050', epaulette: '#f0c050', sword: 1, beard: '#5a3a2a' },
    gunner: { coat: '#1e2a4a', coatDark: '#141c34', legs: '#1e2a4a', stripe: '#c83a3a', boots: '#1a1412', skin: '#e0b898', hat: 'kepi', hatCol: '#1e2a4a', belt: '#e8dcc0' },
    zouave: { coat: '#2a3a7a', coatDark: '#1e2a5a', legs: '#c83a3a', wideLegs: 1, boots: '#e8dcc0', skin: '#d8a888', hat: 'fez', hatCol: '#c83a3a', sash: '#3a6ab0', beard: '#3a2a20' },
    bugler: { coat: '#2e4a8a', coatDark: '#22386a', legs: '#b83a3a', boots: '#1a1412', skin: '#f0c8a8', hat: 'kepi', hatCol: '#b83a3a', belt: '#e8dcc0', bugle: 1 },
    // cuirassiers: steel breastplates, and helmets with a horsehair mane; the trumpeter's plume is white
    cuirassier: { coat: '#1e2a5a', coatDark: '#141c40', legs: '#b83a3a', boots: '#141010', skin: '#e8c0a0', hat: 'helmet', hatCol: '#aeb4c2', cuirass: '#aeb4c2', sword: 1, saddle: '#1e2a5a' },
    cuirassierOfficer: { coat: '#1e2a5a', coatDark: '#141c40', legs: '#b83a3a', boots: '#141010', skin: '#e8c0a0', hat: 'helmet', hatCol: '#c0c6d2', cuirass: '#c0c6d2', sword: 1, saddle: '#1e2a5a', epaulette: '#f0c050', beard: '#4a3020' },
    trumpeter: { coat: '#1e2a5a', coatDark: '#141c40', legs: '#b83a3a', boots: '#141010', skin: '#f0c8a8', hat: 'helmet', hatCol: '#aeb4c2', cuirass: '#aeb4c2', saddle: '#1e2a5a', plume: '#f2eee6', trumpet: 1 },
    // the people of Lavilledieu
    woman: { coat: '#c86a7a', coatDark: '#9a4a5a', legs: '#9a4a5a', boots: '#3a2a2a', skin: '#f0c8a8', hat: 'bonnet', hatCol: '#f4e0b0', robe: 1, hair: '#6a4030', apron: '#f4ece0' },
    lady: { coat: '#6a8ac8', coatDark: '#4a6aa8', legs: '#4a6aa8', boots: '#2a2a3a', skin: '#f0c8a8', hat: 'bonnet', hatCol: '#e8c8d8', robe: 1, hair: '#3a2a20' },
    girl: { coat: '#f0a0b0', coatDark: '#d07a8a', legs: '#d07a8a', boots: '#6a4a3a', skin: '#f4d0b0', hat: 'none', hatCol: '#8a5a30', robe: 1, small: 1, hair: '#8a5a30' },
    baker: { coat: '#f4f0e8', coatDark: '#d8d0c0', legs: '#3a3440', boots: '#2a2020', skin: '#f0c0a0', hat: 'toque', hatCol: '#ffffff', wide: 1 },
    fisherman: { coat: '#5a6a4a', coatDark: '#465438', legs: '#4a4a5a', boots: '#2a2018', skin: '#d8a888', hat: 'straw', hatCol: '#e0c878', beard: '#8a7a6a' },
    washer: { coat: '#6a7a9a', coatDark: '#4e5c7a', legs: '#4e5c7a', boots: '#3a2a2a', skin: '#e8b898', hat: 'scarf', hatCol: '#f0e4d0', robe: 1, apron: '#f4ece0' },
    priest: { coat: '#1e1c24', coatDark: '#141218', legs: '#141218', boots: '#101014', skin: '#e8c0a0', hat: 'hat', hatCol: '#1e1c24', robe: 1 },
    oldman: { coat: '#6a5a4a', coatDark: '#50443a', legs: '#4a4038', boots: '#2a2018', skin: '#e0b898', hat: 'beret', hatCol: '#2a2a3a', beard: '#d8d8d8', cane: 1 },
    fiddler: { coat: '#8a3a2a', coatDark: '#6a2a1e', legs: '#3a3440', boots: '#2a2018', skin: '#e8c0a0', hat: 'straw', hatCol: '#e8d090', belt: '#f0c860' },
    // Hara Kei's town in the last years of the shoguns
    samurai: { coat: '#2a2a3c', coatDark: '#1c1c2a', legs: '#4a4a5a', wideLegs: 1, boots: '#e8e2d6', skin: '#e0b898', hat: 'topknot', hatCol: '#141418', sword: 1, sash: '#6a2a2a' },
    samurai2: { coat: '#4a3a2e', coatDark: '#34281e', legs: '#5a5a66', wideLegs: 1, boots: '#e8e2d6', skin: '#dcb090', hat: 'topknot', hatCol: '#141418', sword: 1, sash: '#2a3a5a' },
    ronin: { coat: '#2e2a2a', coatDark: '#1e1a1a', legs: '#2e2a2a', wideLegs: 1, boots: '#6a5a48', skin: '#d8a888', hat: 'jingasa', hatCol: '#8a7a58', sword: 1, beard: '#2a2020' },
    archer: { coat: '#eceae4', coatDark: '#c4c0b8', legs: '#22222e', wideLegs: 1, boots: '#eceae4', skin: '#e0b898', hat: 'topknot', hatCol: '#141418' },
    shonin: { coat: '#6a5a3a', coatDark: '#4a3e28', legs: '#4a3e28', robe: 1, boots: '#6a5040', skin: '#dcb090', hat: 'hachimaki', hatCol: '#f0ece4', apron: '#2a3a6a' },
    geisha: { coat: '#8a2436', coatDark: '#5a1826', legs: '#5a1826', robe: 1, boots: '#f0ece4', skin: '#f6f2ee', hat: 'shimada', hatCol: '#141418', sash: '#e0b040', parasol: '#d84a4a' },
    geisha2: { coat: '#3e2a66', coatDark: '#2a1c46', legs: '#2a1c46', robe: 1, boots: '#f0ece4', skin: '#f6f2ee', hat: 'shimada', hatCol: '#141418', sash: '#e8c8d8', parasol: '#f0e0c8' },
    townswoman: { coat: '#4a5a7a', coatDark: '#34405a', legs: '#34405a', robe: 1, boots: '#e8e2d6', skin: '#e8c4a4', hat: 'bun', hatCol: '#141418', sash: '#c8a060' },
    taiko: { coat: '#26345e', coatDark: '#1a2444', legs: '#1a1a24', boots: '#e8e2d6', skin: '#dcb090', hat: 'hachimaki', hatCol: '#e8e2d6', belt: '#e8e2d6' },
    juggler: { coat: '#c8703a', coatDark: '#9a5028', legs: '#3a2a2a', wideLegs: 1, boots: '#e8e2d6', skin: '#dcb090', hat: 'hachimaki', hatCol: '#d83a3a' },
    dancer: { coat: '#ecd8e8', coatDark: '#c0a8c0', legs: '#c0a8c0', robe: 1, boots: '#f0ece4', skin: '#f6f2ee', hat: 'kitsune', hatCol: '#141418', sash: '#c83a3a' },
    // armies seen at a distance through the smoke, all but silhouettes
    farSoldier: { coat: '#2a2026', coatDark: '#1e161c', legs: '#2a2026', boots: '#140c10', skin: '#5a3e3a', hat: 'kepi', hatCol: '#1e161c', rifle: 1 },
    farSamurai: { coat: '#241c22', coatDark: '#1a1418', legs: '#2a2228', wideLegs: 1, boots: '#140c10', skin: '#5a3e3a', hat: 'jingasa', hatCol: '#1a1418', rifle: 1, sword: 1 },
    // the Imperial Navy: sailors in the striped marinière and the red-pompom cap, and a captain
    sailor: { coat: '#f0ece4', coatDark: '#c8c2b8', legs: '#2a3a6a', boots: '#1a1412', skin: '#e0b494', hat: 'pompom', hatCol: '#f2eee6', scarf: '#2e4a9a', stripes: '#2e4a9a' },
    captain: { coat: '#1e2a4a', coatDark: '#141c34', legs: '#1e2a4a', boots: '#141010', skin: '#e8c0a0', hat: 'bicorne', hatCol: '#141414', epaulette: '#f0c050', sword: 1, beard: '#6a5a4a' },
    lad: { coat: '#4a6a9a', coatDark: '#34507a', legs: '#5a4a3a', boots: '#3a2a1e', skin: '#f0c8a8', hat: 'beret', hatCol: '#2a2a3a', small: 1 },
    lass: { coat: '#e0b040', coatDark: '#b88a2a', legs: '#b88a2a', boots: '#4a3a2a', skin: '#f4d0b0', hat: 'none', hatCol: '#c87a3a', robe: 1, small: 1, hair: '#c87a3a' },
    helene: { coat: '#b89ac8', coatDark: '#8a6a9a', legs: '#8a6a9a', boots: '#3a2a2a', skin: '#f4d0b8', hat: 'flowerhat', hatCol: '#5a4a3a', robe: 1, hair: '#5a3a24' },
  };
  // horses by their coats; the trumpeters of the cavalry rode greys
  const HORSES = {
    bay: { coat: '#6a4630', dark: '#4a3020', mane: '#2a1a14', hi: '#7a5640' },
    black: { coat: '#2e2622', dark: '#1e1816', mane: '#0e0a0a', hi: '#463a34' },
    grey: { coat: '#c8c2be', dark: '#9a928e', mane: '#eeeae6', hi: '#e2dcd8' },
  };

  function rect(c, x, y, w, hh, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(hh)); }

  /** A person standing (or walking) with their feet at (x, y), facing right; flip the canvas to face left. */
  function drawPerson(c, L, t, moving, running, crouch = false, pose = null) {
    if (pose === 'sit' || pose === 'wash') crouch = true;
    const k = L.small ? 0.8 : 1;
    const legH = Math.round((crouch ? 3 : 8) * k), bodyH = Math.round((crouch ? 8 : 10) * k), w = Math.round((L.wide ? 8 : 6) * k);
    const ph = t * (running ? 16 : 10);
    const swing = moving ? Math.sin(ph) : 0;
    const bob = moving ? Math.round(Math.abs(Math.sin(ph)) * 1) : 0;
    const y = -bob;
    // legs (a long robe hides them)
    if (L.robe) {
      rect(c, -w / 2 - 1, y - legH - 1, w + 2, legH + 1, L.coatDark);
      rect(c, -w / 2 + swing, y - 2, 3, 2, L.boots); rect(c, w / 2 - 3 - swing, y - 2, 3, 2, L.boots);
    } else if (L.wideLegs) {
      rect(c, -3 + Math.round(swing * 2), y - legH, 3, legH - 1, L.legs);
      rect(c, 1 - Math.round(swing * 2), y - legH, 3, legH - 1, L.legs);
      rect(c, -2 + Math.round(swing * 2), y - 2, 3, 2, L.boots);
      rect(c, 1 - Math.round(swing * 2), y - 2, 3, 2, L.boots);
    } else {
      rect(c, -2 + Math.round(swing * 2), y - legH, 2, legH, L.legs);
      rect(c, 1 - Math.round(swing * 2), y - legH, 2, legH, L.legs);
      if (L.stripe) { rect(c, -2 + Math.round(swing * 2), y - legH, 1, legH - 2, L.stripe); rect(c, 2 - Math.round(swing * 2), y - legH, 1, legH - 2, L.stripe); }
      rect(c, -2 + Math.round(swing * 2), y - 2, 3, 2, L.boots);
      rect(c, 1 - Math.round(swing * 2), y - 2, 3, 2, L.boots);
    }
    // the coat, darker at the back, with its tail swinging a little
    const top = y - legH - bodyH;
    const hy = top - 5;
    rect(c, -w / 2, top, w, bodyH + 2, L.coat);
    rect(c, -w / 2, top, 2, bodyH + 2, L.coatDark);
    if (!L.robe) rect(c, -w / 2 - 1 + (moving ? Math.round(-swing) : 0), top + bodyH - 1, 2, 3, L.coatDark);
    if (L.stripes) for (let yy = top + 3; yy < top + bodyH + 1; yy += 2) rect(c, -w / 2 + 2, yy, w - 2, 1, L.stripes);
    if (L.belt) rect(c, -w / 2, top + bodyH - 4, w, 1, L.belt);
    if (L.sash) rect(c, -w / 2, top + bodyH - 4, w, 2, L.sash);
    if (L.scarf) rect(c, -w / 2 + 1, top, w - 1, 2, L.scarf);
    if (L.apron) rect(c, -w / 2 + 1, top + 5, w - 2, bodyH - 3 + (L.robe ? legH : 0), L.apron);
    if (L.cuirass) { rect(c, -w / 2, top + 1, w, bodyH - 4, L.cuirass); rect(c, -w / 2 + 1, top + 1, 1, bodyH - 4, '#dfe3ec'); rect(c, -w / 2, top + bodyH - 3, w, 1, '#8a8e9a'); }
    if (L.epaulette) { rect(c, -w / 2 - 1, top, 2, 1, L.epaulette); rect(c, w / 2 - 1, top, 2, 1, L.epaulette); }
    // an arm: swinging opposite to the legs, raised as they talk, or holding the rifle up in front
    if (pose === 'talk') {
      const up = Math.sin(t * 7) > 0 ? 1 : 0;
      rect(c, 1, top + 3 - up, 2, 4, L.coatDark);
      rect(c, 3, top + 1 - up, 2, 2, L.skin);
    } else if (pose === 'bugle') {
      // the bugle up to the lips, its bell raised
      rect(c, 1, top + 1, 2, 4, L.coatDark);
      rect(c, 2, hy + 3, 2, 2, L.skin);
      rect(c, 3, hy + 2, 6, 1, '#f0c050');
      rect(c, 4, hy + 3, 3, 1, '#c8902e');
      rect(c, 9, hy, 2, 5, '#f0c050');
      rect(c, 10, hy + 1, 1, 3, '#fff0a8');
    } else if (pose === 'wash') {
      // scrubbing linen on the stone
      const sc = Math.sin(t * 6) > 0 ? 0 : 2;
      rect(c, 1 + sc, top + 4, 4, 2, L.coatDark);
      rect(c, 4 + sc, top + 5, 2, 2, L.skin);
      rect(c, 3, top + 7, 6, 2, '#f4f0e8');
    } else if (pose === 'fish') {
      // a rod out over the water, its line hanging down
      rect(c, 1, top + 3, 3, 3, L.coatDark);
      rect(c, 3, top + 5, 2, 2, L.skin);
      for (let k = 0; k < 14; k++) rect(c, 4 + k, top + 5 - Math.round(k * 0.9), 1, 1, '#6a4a2a');
      c.fillStyle = 'rgba(235,235,235,0.6)';
      c.fillRect(17, top - 8, 0.5, 40);
    } else if (pose === 'fiddle') {
      // the fiddle under the chin, the bow sawing
      const bow = Math.round(Math.sin(t * 8) * 2);
      rect(c, 1, top + 1, 4, 2, '#6a3a1e');
      rect(c, 4, top, 2, 3, '#8a4a24');
      rect(c, -2 + bow, top + 3, 7, 1, '#e0d0b0');
      rect(c, -1, top + 3, 2, 4, L.coatDark);
    } else if (pose === 'wave') {
      // an arm up, waving
      const up = Math.sin(t * 9) > 0 ? 0 : 1;
      rect(c, 2, top - 4 + up, 2, 6, L.coatDark);
      rect(c, 2 + up, top - 6 + up, 2, 2, L.skin);
    } else if (pose === 'haul') {
      // hand over hand on the halyard
      const pull = Math.sin(t * 5) > 0 ? 0 : 2;
      rect(c, 3, top - 6 + pull, 2, 9, L.coatDark);
      rect(c, 3, top - 8 + pull, 2, 2, L.skin);
    } else if (pose === 'draw') {
      // the bow drawn: the bow arm straight out, the string pulled back to the cheek, an arrow nocked
      rect(c, 1, top + 3, 6, 2, L.coatDark);
      rect(c, 6, top + 2, 2, 2, L.skin);
      for (let k = -9; k <= 9; k++) rect(c, 8 + Math.round(2 - Math.abs(k) * 0.22), top + 3 + k, 1, 1, '#5a3a22');
      for (let k = 0; k <= 9; k++) { rect(c, 8 - Math.round(k * 0.7), top - 6 + k, 1, 1, '#e8e2d6'); rect(c, 8 - Math.round(k * 0.7), top + 12 - k, 1, 1, '#e8e2d6'); }
      rect(c, 1, top + 3, 12, 1, '#8a6a4a');
      rect(c, 13, top + 3, 1, 1, '#c8c8d0');
      rect(c, 1, hy + 3, 2, 2, L.skin);
    } else if (pose === 'taiko') {
      // beating the great drum on its stand, the sticks flying
      const up = Math.sin(t * 9) > 0;
      rect(c, 6, top + 3, 9, 10, '#8a4a2a'); rect(c, 6, top + 3, 9, 1, '#b86a3a'); rect(c, 14, top + 3, 2, 10, '#e8dcc0');
      for (let k = 0; k < 3; k++) rect(c, 7 + k * 3, top + 5, 1, 7, '#5a2e1a');
      rect(c, 8, top + 13, 1, legH, '#3a2a1e'); rect(c, 13, top + 13, 1, legH, '#3a2a1e');
      rect(c, 2, top + (up ? -2 : 2), 2, 6, L.coatDark); rect(c, 3, top + (up ? -4 : 1), 5, 1, '#c8a060');
      rect(c, 4, top + (up ? 3 : -1), 2, 5, L.coatDark); rect(c, 5, top + (up ? 1 : -3), 6, 1, '#c8a060');
    } else if (pose === 'juggle') {
      // three balls going round over his hands
      const alt = Math.sin(t * 6) > 0 ? 0 : 1;
      rect(c, -1, top - 1 + alt, 2, 5, L.coatDark); rect(c, 4, top - alt, 2, 5, L.coatDark);
      for (let k = 0; k < 3; k++) { const a = t * 5 + k * 2.09; rect(c, Math.round(2 + Math.cos(a) * 4), Math.round(top - 5 - Math.abs(Math.sin(a)) * 9), 2, 2, ['#e83a3a', '#f0c040', '#3a8ae8'][k]); }
    } else if (pose === 'dance') {
      // a slow dance with an open fan, the arm raised and falling
      const sw_ = Math.sin(t * 2.4);
      rect(c, 2, top - 3 + Math.round(sw_ * 2), 2, 6, L.coatDark);
      rect(c, 1, top - 8 + Math.round(sw_ * 2), 6, 3, '#e8c040'); rect(c, 2, top - 9 + Math.round(sw_ * 2), 4, 1, '#d83a3a');
      rect(c, -4, top + 3, 3, 2, L.coatDark);
    } else if (pose === 'parasol') {
      // under a paper parasol, its ribs showing
      const pc = L.parasol || '#d84a4a';
      rect(c, 1, top + 3, 2, 3, L.coatDark); rect(c, 2, hy - 6, 1, top - hy + 10, '#5a3a22');
      rect(c, -5, hy - 9, 15, 2, pc); rect(c, -3, hy - 11, 11, 2, pc); rect(c, 0, hy - 12, 5, 1, pc);
      for (let k = -5; k < 10; k += 3) rect(c, k, hy - 8, 1, 1, '#3a2a22');
    } else if (pose === 'aim') {
      // the rifle levelled, cheek to the stock, sighting down the barrel
      rect(c, 1, top + 3, 3, 2, L.coatDark);
      rect(c, 4, top + 4, 2, 2, L.skin);
      rect(c, -2, top + 4, 16, 1, '#4a3424');
      rect(c, 10, top + 3, 5, 1, '#8a8a94');
    } else if (pose === 'present' && L.rifle) {
      rect(c, 2, top + 3, 2, 5, L.coatDark);
      rect(c, 3, top - 9, 1, 19, '#4a3424');
      rect(c, 3, top - 13, 1, 4, '#d0d0d8');
      rect(c, 2, top + 5, 2, 2, L.skin);
    } else {
      rect(c, 0 - Math.round(swing * 2), top + 2, 2, 7, L.coatDark);
      rect(c, 0 - Math.round(swing * 2), top + 8, 2, 2, L.skin);
    }
    // a rifle on the shoulder, bayonet fixed
    if (L.rifle && pose !== 'present' && pose !== 'aim') {
      for (let k = 0; k < 16; k++) rect(c, -3 + Math.round(k * 0.18), top + 9 - k, 1, 1, '#4a3424');
      rect(c, 0, top - 10, 1, 4, '#d0d0d8');
    }
    // the head, and whatever is on it
    rect(c, -2, hy, 5, 5, L.skin);
    if (L.hair) rect(c, -3, hy, 2, 8, L.hair);
    rect(c, 2, hy + 2, 1, 1, '#2a1a14');
    if (L.beard) rect(c, -2, hy + 3, 5, 2, L.beard);
    const hc = L.hatCol;
    if (L.hat === 'kepi') { rect(c, -2, hy - 2, 5, 3, hc); rect(c, 1, hy + 1, 3, 1, '#1a1412'); rect(c, -2, hy - 2, 5, 1, '#2e2a4a'); }
    else if (L.hat === 'tophat') { rect(c, -2, hy - 5, 5, 5, hc); rect(c, -3, hy - 1, 7, 1, hc); }
    else if (L.hat === 'hat') { rect(c, -4, hy - 1, 9, 1, hc); rect(c, -2, hy - 3, 5, 2, hc); rect(c, -2, hy - 2, 5, 1, '#8a5a3a'); }
    else if (L.hat === 'fur') { rect(c, -3, hy - 3, 7, 3, hc); }
    else if (L.hat === 'topknot') { rect(c, -2, hy - 1, 5, 2, hc); rect(c, -1, hy - 3, 2, 2, hc); }
    else if (L.hat === 'bun') { rect(c, -3, hy - 1, 6, 3, hc); rect(c, -4, hy - 3, 3, 3, hc); }
    else if (L.hat === 'jingasa') { rect(c, -5, hy - 1, 11, 1, hc); rect(c, -3, hy - 2, 7, 1, hc); }
    else if (L.hat === 'fez') { rect(c, -1, hy - 3, 4, 3, hc); rect(c, -2, hy - 1, 1, 2, '#1a2a5a'); }
    else if (L.hat === 'bonnet') { rect(c, -3, hy - 2, 6, 3, hc); rect(c, -3, hy + 1, 1, 3, hc); rect(c, 2, hy - 1, 2, 1, hc); rect(c, -2, hy + 1, 5, 1, '#c85a6a'); }
    else if (L.hat === 'scarf') { rect(c, -3, hy - 2, 6, 3, hc); rect(c, -3, hy, 2, 4, hc); }
    else if (L.hat === 'toque') { rect(c, -2, hy - 6, 5, 6, hc); rect(c, -3, hy - 7, 7, 2, hc); rect(c, -2, hy - 1, 5, 1, '#d8d0c0'); }
    else if (L.hat === 'straw') { rect(c, -5, hy - 1, 11, 1, hc); rect(c, -2, hy - 3, 5, 2, hc); rect(c, -2, hy - 2, 5, 1, '#8a3a2a'); }
    else if (L.hat === 'hachimaki') { rect(c, -2, hy - 1, 5, 1, '#141418'); rect(c, -2, hy, 5, 1, hc); rect(c, -4, hy, 2, 1, hc); rect(c, -5, hy + 1, 1, 2, hc); }
    else if (L.hat === 'shimada') { rect(c, -3, hy - 3, 7, 4, hc); rect(c, -4, hy - 2, 2, 4, hc); rect(c, -1, hy - 4, 3, 1, hc); rect(c, -2, hy - 4, 1, 1, '#e8c040'); rect(c, 3, hy - 3, 1, 1, '#d84a4a'); rect(c, 1, hy - 5, 1, 1, '#f0e0e0'); }
    else if (L.hat === 'kitsune') { rect(c, -3, hy, 2, 6, hc); rect(c, -2, hy - 1, 5, 6, '#f4f0ea'); rect(c, -2, hy - 2, 1, 1, '#f4f0ea'); rect(c, 2, hy - 2, 1, 1, '#f4f0ea'); rect(c, 1, hy + 1, 1, 1, '#d83a3a'); rect(c, 2, hy + 3, 1, 1, '#d83a3a'); rect(c, -1, hy + 1, 1, 1, '#d83a3a'); }
    else if (L.hat === 'pompom') { rect(c, -3, hy - 2, 6, 2, hc); rect(c, -3, hy - 1, 6, 1, '#1e2a50'); rect(c, 0, hy - 3, 2, 1, '#d8303a'); }
    else if (L.hat === 'bicorne') { rect(c, -5, hy - 2, 11, 2, hc); rect(c, -2, hy - 4, 5, 2, hc); rect(c, 1, hy - 3, 2, 1, '#c83a3a'); rect(c, -4, hy - 2, 9, 1, '#3a3a40'); }
    else if (L.hat === 'beret') { rect(c, -3, hy - 2, 6, 2, hc); rect(c, 0, hy - 3, 1, 1, hc); }
    else if (L.hat === 'flowerhat') { rect(c, -5, hy - 1, 11, 1, hc); rect(c, -2, hy - 3, 6, 2, hc); rect(c, -1, hy - 4, 2, 1, '#f08aa8'); rect(c, 1, hy - 4, 2, 1, '#e8607a'); rect(c, 3, hy - 3, 1, 1, '#f08aa8'); }
    else if (L.hat === 'helmet') {
      // the steel helmet, its brass crest, the black mane streaming behind and the plume
      rect(c, -2, hy - 2, 5, 3, hc); rect(c, -1, hy - 2, 2, 1, '#dfe3ec');
      rect(c, -2, hy - 3, 4, 1, '#e0b050');
      rect(c, -5, hy - 3, 3, 1, '#141010'); rect(c, -5, hy - 2, 2, 5, '#141010');
      rect(c, 1, hy - 6, 1, 3, L.plume || '#c83a3a');
    }
    else rect(c, -2, hy - 1, 5, 2, hc);
    if (L.sword) rect(c, -w / 2 - 1, top + bodyH - 3, 8, 1, '#8a8a90');
    if (L.drum) { rect(c, 2, top + 5, 5, 5, '#b83a3a'); rect(c, 2, top + 5, 5, 1, '#e8dcc8'); }
    if (L.cane) rect(c, 4, top + 6, 1, legH + bodyH - 6, '#5a3a24');
    if ((L.bugle && pose !== 'bugle') || L.trumpet) { rect(c, -4, top + 5, 2, 2, '#f0c050'); rect(c, -5, top + 6, 1, 2, '#c8902e'); }
    if (L.lantern) { rect(c, 4, top + 4, 1, 4, '#3a2a22'); rect(c, 3, top + 8, 3, 4, '#ffcf72'); }
  }

  /** A strip of soft fog that tiles left to right: blobs of mist, thickest along the middle. */
  function fogTexture(col, th = 40) {
    const tw = 320;
    const cv = document.createElement('canvas');
    cv.width = tw * SS; cv.height = th * SS;
    const x = cv.getContext('2d');
    for (let i = 0; i < 90; i++) {
      const bx = Math.random() * tw, by = th / 2 + (Math.random() - 0.5) * th * 0.5, br = (0.15 + Math.random() * 0.4) * th;
      for (const ox of [-tw, 0, tw]) {
        const g = x.createRadialGradient((bx + ox) * SS, by * SS, 0, (bx + ox) * SS, by * SS, br * SS);
        g.addColorStop(0, `rgba(${col},0.42)`); g.addColorStop(1, `rgba(${col},0)`);
        x.fillStyle = g; x.fillRect((bx + ox - br) * SS, (by - br) * SS, br * 2 * SS, br * 2 * SS);
      }
    }
    return cv;
  }

  // the town's dogs and cats, by their coats
  const DOGS = {
    spaniel: { coat: '#8a5a34', dark: '#6a4226', patch: '#f0e8dc', ear: '#5a3620' },
    black: { coat: '#2e2a28', dark: '#1a1614', patch: '#4a4440', ear: '#1a1614' },
    white: { coat: '#ece6dc', dark: '#c8c0b4', patch: '#d8a070', ear: '#c89060' },
    gold: { coat: '#c8883a', dark: '#a0682a', patch: '#ecc888', ear: '#8a5424' },
  };
  const CATS = {
    ginger: { coat: '#d8843a', dark: '#b0642a', stripe: '#f0a860' },
    black: { coat: '#2a2626', dark: '#1a1616', stripe: '#3a3434', white: '#f0ece6' },
    tabby: { coat: '#8a8078', dark: '#6a625a', stripe: '#4e4842' },
  };

  /** A dog trotting, running (tongue out) or sitting, facing right, its tail going. */
  function drawDog(c, t, moving, running, D, sit) {
    const ph = t * (running ? 20 : 12), sw = moving ? Math.round(Math.sin(ph) * 1.5) : 0;
    const y = moving ? -Math.round(Math.abs(Math.sin(ph))) : 0;
    const wag = Math.sin(t * (moving ? 16 : 11)) > 0 ? 1 : 0;
    if (sit) {
      rect(c, -4, y - 4, 6, 4, D.coat);
      rect(c, -5, y - 1, 3, 1, D.dark);
      rect(c, 0, y - 8, 4, 8, D.coat);
      rect(c, 2, y - 3, 1, 3, D.dark);
      rect(c, 1, y - 7, 2, 4, D.patch);
      rect(c, 1, y - 12, 5, 4, D.coat);
      rect(c, 6, y - 10, 2, 2, D.coat);
      rect(c, 7, y - 10, 1, 1, '#1a1210');
      rect(c, 4, y - 11, 1, 1, '#1a1210');
      rect(c, 1, y - 12, 2, 4, D.ear);
      rect(c, -7 + wag, y - 1, 3, 1, D.coat);
      return;
    }
    rect(c, 3 + sw, y - 3, 1, 3, D.dark); rect(c, 4 - sw, y - 3, 1, 3, D.coat);
    rect(c, -4 - sw, y - 3, 1, 3, D.dark); rect(c, -3 + sw, y - 3, 1, 3, D.coat);
    rect(c, -5, y - 7, 11, 4, D.coat);
    rect(c, -5, y - 4, 11, 1, D.dark);
    rect(c, -2, y - 7, 4, 2, D.patch);
    rect(c, 4, y - 10, 4, 4, D.coat);
    rect(c, 8, y - 8, 2, 2, D.coat);
    rect(c, 9, y - 8, 1, 1, '#1a1210');
    rect(c, 6, y - 9, 1, 1, '#1a1210');
    rect(c, 4, y - 10, 2, 4, D.ear);
    if (running) rect(c, 8, y - 6, 1, 1, '#e87a8a');
    rect(c, -7, y - 9 + wag, 2, 1, D.coat); rect(c, -6, y - 8, 1, 2, D.coat);
  }

  /** A cat walking with its tail up, or sitting with its tail round its feet. */
  function drawCat(c, t, moving, C, sit) {
    const sw = moving ? Math.round(Math.sin(t * 10)) : 0, flick = Math.sin(t * 1.7) > 0.6 ? 1 : 0;
    if (sit) {
      rect(c, -3, -5, 5, 5, C.coat);
      rect(c, -3, -1, 5, 1, C.dark);
      rect(c, -2, -5, 1, 3, C.stripe);
      rect(c, 0, -8, 4, 3, C.coat);
      rect(c, 0, -9, 1, 1, C.coat); rect(c, 3, -9, 1, 1, C.coat);
      rect(c, 2, -7, 1, 1, '#e8d040');
      if (C.white) rect(c, 1, -4, 2, 3, C.white);
      rect(c, -5, -1, 4, 1, C.coat); rect(c, -6, -3 + flick, 1, 2, C.coat);
      return;
    }
    rect(c, 2 + sw, -2, 1, 2, C.dark); rect(c, 3 - sw, -2, 1, 2, C.coat);
    rect(c, -3 - sw, -2, 1, 2, C.dark); rect(c, -2 + sw, -2, 1, 2, C.coat);
    rect(c, -4, -5, 8, 3, C.coat);
    rect(c, -4, -3, 8, 1, C.dark);
    for (let k = 0; k < 3; k++) rect(c, -3 + k * 2, -5, 1, 2, C.stripe);
    rect(c, 3, -7, 3, 3, C.coat);
    rect(c, 3, -8, 1, 1, C.coat); rect(c, 5, -8, 1, 1, C.coat);
    rect(c, 5, -6, 1, 1, '#e8d040');
    if (C.white) rect(c, 3, -5, 2, 1, C.white);
    rect(c, -5, -8, 1, 4, C.coat); rect(c, -6 + flick, -9, 1, 1, C.coat);
  }

  /** A child's hoop, bowled along with a stick. */
  function drawHoop(c, x) {
    const a0 = x * 0.25;
    for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; rect(c, 9 + Math.cos(a) * 4.5, -4.5 + Math.sin(a) * 4.5, 1, 1, k % 6 ? '#c89048' : '#6a4a2a'); }
    rect(c, 9 + Math.cos(a0) * 4.5, -4.5 + Math.sin(a0) * 4.5, 1, 1, '#fff0c0');
    for (let k = 0; k < 5; k++) rect(c, 2 + k, -8 + Math.round(k * 0.6), 1, 1, '#5a4030');
  }

  /** A horse at a walk or a gallop, facing right, with its rider. */
  function drawHorse(c, t, moving, running, rider, duck = false, hc = HORSES.bay) {
    const ph = t * (running ? 14 : 8);
    const gait = moving ? Math.sin(ph) : 0;
    const bob = moving ? Math.round(Math.abs(Math.sin(ph)) * (running ? 2 : 1)) : 0;
    const y = -bob;
    const { coat, dark, mane } = hc;
    // four legs, in two pairs that move against each other
    const leg = (x, a) => { rect(c, x + Math.round(a * 2), y - 9, 2, 9, dark); rect(c, x + Math.round(a * 2), y - 2, 2, 2, '#1a1412'); };
    leg(-8, gait); leg(-5, -gait); leg(5, -gait); leg(8, gait);
    rect(c, -10, y - 17, 21, 9, coat); // the body
    rect(c, -10, y - 17, 21, 2, hc.hi);
    if (rider && rider.saddle) { rect(c, -6, y - 17, 11, 6, rider.saddle); rect(c, -6, y - 12, 11, 1, '#f0c050'); }
    rect(c, 9, y - 23, 4, 9, coat); // the neck
    rect(c, 11, y - 25, 7, 4, coat); // the head
    rect(c, 16, y - 23, 2, 2, dark);
    rect(c, 9, y - 25, 3, 8, mane);
    rect(c, 15, y - 24, 1, 1, '#1a1412');
    rect(c, -13, y - 16 + Math.round(gait), 3, 7, mane); // the tail
    if (rider) {
      c.save();
      c.translate(0, y - 13 + (duck ? 3 : 0));
      drawPerson(c, { ...rider, legs: rider.coatDark }, 0, false, false, duck);
      c.restore();
    }
  }

  // ---------------------------------------------------------------- the army's train
  // A Crampton engine and its tender, guns on flat wagons, men in covered wagons, the officers'
  // carriage and the guard's van (lengths in pixels at the viaduct's distance)
  const TRAIN = [{ kind: 'loco', w: 20 }, { kind: 'tender', w: 9 }, { kind: 'gun', w: 14 }, { kind: 'guns', w: 14 }, { kind: 'wagon', w: 12 }, { kind: 'wagon', w: 12 }, { kind: 'coach', w: 13 }, { kind: 'van', w: 9 }];
  const TRAIN_LEN = TRAIN.reduce((n, car) => n + car.w + 1.5, -1.5);

  // ---------------------------------------------------------------- weather and light
  function makeWeather(kind, n) {
    const parts = [];
    for (let i = 0; i < n; i++) parts.push({ x: Math.random() * LW, y: Math.random() * LH, v: 0.5 + Math.random(), p: Math.random() * 6 });
    return { kind, parts };
  }
  const LEAVES = ['#e0842a', '#f4c056', '#c84a24', '#b8521c', '#f07a3a', '#e0b03a'];
  function stepWeather(c, wx, dt, t, camDx) {
    for (const p of wx.parts) {
      if (wx.kind === 'snow') { p.y += dt * 12 * p.v; p.x += Math.sin(t + p.p) * dt * 6 - camDx * 0.8; }
      else if (wx.kind === 'ash' || wx.kind === 'petals') { p.y += dt * 9 * p.v; p.x += Math.sin(t * 0.8 + p.p) * dt * 10 - camDx * 0.8; }
      else if (wx.kind === 'embers') { p.y -= dt * 14 * p.v; p.x += Math.sin(t + p.p) * dt * 8 - camDx; }
      else if (wx.kind === 'fireflies') { p.x += Math.sin(t * 0.7 + p.p) * dt * 8 - camDx * 0.9; p.y += Math.cos(t * 0.9 + p.p) * dt * 5; }
      else if (wx.kind === 'breeze') { p.x += (14 + Math.sin(t * 0.9 + p.p) * 8) * dt * p.v - camDx * 0.9; p.y += Math.sin(t * 1.3 + p.p * 2) * dt * 8 + dt * 2; }
      else if (wx.kind === 'sakura') { p.x += (6 + Math.sin(t * 0.6 + p.p) * 9) * dt * p.v - camDx * 0.9; p.y += (5 + Math.sin(t * 1.8 + p.p * 3) * 4) * dt * p.v; }
      else if (wx.kind === 'autumn') { p.x += (12 + Math.sin(t * 0.7 + p.p) * 10) * dt * p.v - camDx * 0.9; p.y += (7 + Math.sin(t * 2.2 + p.p * 3) * 6) * dt * p.v; }
      else { p.y -= dt * 3 * p.v; p.x += Math.sin(t * 0.5 + p.p) * dt * 4 - camDx * 0.6; } // motes
      if (p.y > WY + 4) { p.y = -4; p.x = Math.random() * LW; }
      if (p.y < -6) { p.y = WY; p.x = Math.random() * LW; }
      if (p.x < -6) p.x += LW + 12;
      if (p.x > LW + 6) p.x -= LW + 12;
      const tw = 0.5 + 0.5 * Math.sin(t * 3 + p.p * 5);
      if (wx.kind === 'snow') { c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillRect(p.x * SS, p.y * SS, SS, SS); }
      else if (wx.kind === 'ash') { c.fillStyle = 'rgba(180,160,150,0.7)'; c.fillRect(p.x * SS, p.y * SS, SS, SS); }
      else if (wx.kind === 'petals') { c.fillStyle = 'rgba(255,190,210,0.9)'; c.fillRect(p.x * SS, p.y * SS, SS * 2, SS); }
      else if (wx.kind === 'embers') { c.fillStyle = `rgba(255,${130 + tw * 80},60,${0.5 + tw * 0.5})`; c.fillRect(p.x * SS, p.y * SS, SS, SS); }
      else if (wx.kind === 'fireflies') { c.fillStyle = `rgba(220,255,140,${0.25 + tw * 0.75})`; c.fillRect(p.x * SS, p.y * SS, SS, SS); }
      else if (wx.kind === 'sakura') {
        // cherry petals, pink and white, turning as they fall
        c.fillStyle = ['#f4c2d4', '#ffffff', '#e89ab8', '#f8e4ec'][Math.floor(p.p * 10) % 4];
        const flat = Math.sin(t * 4 + p.p * 7) > 0;
        c.fillRect(p.x * SS, p.y * SS, flat ? SS * 2 : SS, SS);
      }
      else if (wx.kind === 'autumn') {
        // leaves coming down, orange, gold and red, turning over as they fall
        c.fillStyle = LEAVES[Math.floor(p.p * 10) % LEAVES.length];
        const flat = Math.sin(t * 5 + p.p * 7) > 0;
        c.fillRect(p.x * SS, p.y * SS, flat ? SS * 2 : SS, flat ? SS : SS * 2);
      }
      else if (wx.kind === 'breeze') {
        // petals of every colour, and the down of dandelion seeds
        const k = Math.floor(p.p * 10) % 5;
        c.fillStyle = ['#ffffff', '#ffd0dc', '#fff4a8', '#f8f8f0', '#e8c0ff'][k];
        c.fillRect(p.x * SS, p.y * SS, k === 0 || k === 3 ? SS : SS * 2, SS);
        if (k === 0 || k === 3) { c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect((p.x - 1) * SS, (p.y - 1) * SS, SS, SS); }
      }
      else { c.fillStyle = `rgba(255,240,200,${0.2 + tw * 0.4})`; c.fillRect(p.x * SS, p.y * SS, SS, SS); }
    }
  }

  // ---------------------------------------------------------------- fire and smoke, for the shelling
  const FIRE = ['#fff6d0', '#ffd070', '#ff9a3a', '#e0502a'];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const rnd = (a, b) => a + Math.random() * (b - a);
  function burst(parts, x, y, size = 1) {
    parts.push({ x, y: y - 4, r: 10 * size, grow: 30, col: '#fff4d8', a: 0.9, life: 0.12, age: 0, z: 2 });
    parts.push({ x, y: y - 3, r: 3 * size, grow: 18 * size, col: pick(FIRE.slice(1)), a: 0.95, life: 0.35, age: 0, z: 2 });
    for (let i = 0; i < 14 * size; i++) parts.push({ x, y, vx: rnd(-40, 40) * size, vy: rnd(-90, -30) * size, g: 140, col: pick(['#2e2018', '#4a3426', '#6a4a30']), s: Math.random() < 0.3 ? 2 : 1, life: rnd(0.6, 1.2), age: 0, z: 1 });
    for (let i = 0; i < 8; i++) parts.push({ x, y, vx: rnd(-50, 50), vy: rnd(-70, -10), g: 80, col: pick(FIRE), s: 1, life: rnd(0.25, 0.6), age: 0, z: 2 });
    for (let i = 0; i < 6; i++) parts.push({ x: x + rnd(-4, 4), y: y - rnd(0, 6), r: 3 * size, grow: rnd(6, 10), vx: rnd(-4, 6), vy: -rnd(6, 14), col: '#3a3030', hi: '#6a5a56', a: 0.7, life: rnd(2, 3.5), age: 0, z: 0 });
  }

  // ---------------------------------------------------------------- the walk itself
  /** Layers are scaled up once, so every frame is a plain copy (much cheaper than scaling). */
  function prescale(img) {
    if (!img) return img;
    const cv = document.createElement('canvas');
    cv.width = img.width * SS;
    cv.height = img.height * SS;
    const cx = cv.getContext('2d');
    cx.imageSmoothingEnabled = false;
    cx.drawImage(img, 0, 0, cv.width, cv.height);
    return cv;
  }

  class Walk {
    constructor(ctx, def, scenery) {
      Object.assign(this, ctx);
      this.def = def;
      this.scenery = scenery;
      this.W = scenery.w;
      this.x = def.start == null ? 40 : def.start;
      this.facing = 1;
      this.vx = 0;
      this.camX = 0;
      this.keys = { left: false, right: false, run: false };
      this.pointer = 0;
      this.target = null;
      this.t = 0;
      this.done = false;
      this.talking = null;
      this.picked = [];
      this.stepAcc = 0;
      this.reduce = !!this.settings.reduceMotion;
      this.hero = LOOKS[def.hero] || LOOKS.traveller;
      this.things = (def.things || []).map((th, i) => ({ ...th, id: i, used: false, bob: Math.random() * 6 }))
        .filter((th) => !(th.kind === 'item' && th.item && this.engine.hasItem(th.item)));
      this.weather = def.weather ? makeWeather(def.weather, def.weatherCount || 60) : null;
      // the action some walks have: cover to crouch behind, lanterns on patrol, a chase, falling shells
      this.cover = def.cover || [];
      this.crouch = false;
      this.stun = 0;
      this.shake = 0;
      this.parts = [];
      this.patrols = (def.patrols || []).map((p) => ({ ...p, x: p.start != null ? p.start : p.x0, dir: p.dir || 1, wait: 0, look: LOOKS[p.look || 'patrol'] }));
      this.alert = 0;
      if (def.chase) {
        const ch = def.chase;
        const obstacles = [];
        for (let x = ch.from || 260; x < (ch.to || this.W - 200); x += rnd(ch.spacing ? ch.spacing[0] : 150, ch.spacing ? ch.spacing[1] : 230)) obstacles.push({ x, kind: pick(ch.kinds || ['log', 'rock', 'branch']), done: false });
        this.chase = { ...ch, gap: ch.gap || 110, obstacles, jumpY: 0, vy: 0 };
      }
      if (def.shelling) this.shelling = { ...def.shelling, list: [], wait: def.shelling.first || 2.2, hits: 0 };
      // life that is only there to be seen: groups talking, men marching, a drill, sentries on
      // their towers, flags, smoke, fires, and airships and balloons in the sky
      this.crowd = (def.crowd || []).map((g) => ({ ...g, k: 0, timer: 0.4 + Math.random(), showing: -1, bubble: null }));
      this.marchers = (def.marchers || []).map((m) => ({ ...m, x: m.start != null ? m.start : m.x0, dir: m.dir || 1, wait: 0, look: LOOKS[m.look || 'rifleman'] }));
      if (def.drill) this.drill = { ...def.drill, k: -1, timer: 1.5, pose: null, bubble: null };
      this.flags = (def.flags || []).map((f) => ({ ...f }));
      this.fires = def.fires || [];
      this.smokes = (def.smoke || []).map((sm) => ({ ...sm, acc: Math.random() }));
      this.puffs = [];
      this.sky = def.airships || [];
      // a train now and then on the viaduct, cavalry riding through, the colours going up at dawn
      if (def.train) this.train = { depth: 0.2, deck: 146, speed: 34, pause: [24, 40], dir: -1, ...def.train, x: null, dist: 0, wait: def.train.first == null ? 6 : def.train.first, puffs: [], chuff: 0, heard: false, armed: def.train.afterMove == null };
      if (def.cavalry) this.cavalry = { n: 4, gap: 26, speed: 40, pause: 20, y: GY - 3, ...def.cavalry, dir: -1, x: def.cavalry.from, wait: def.cavalry.first == null ? 10 : def.cavalry.first, step: 0 };
      if (def.colours) this.colours = { delay: 1.5, dur: 10.4, hold: 3, ...def.colours, t: 0, stage: 0, called: false };
      this.hum = { drone: rnd(6, 12), band: def.band ? def.band.first || 30 : 0 };
      // a river town: boats about their trade, fish leaping, ducks, the sun's glitter, a mill wheel
      // turning, a fountain, and flocks of birds going over
      this.boats = (def.boats || []).map((b) => ({ ...b, ph: Math.random() * 6 }));
      this.fish = def.fish ? { ...def.fish, list: [], wait: 1.5 } : null;
      this.glitter = def.glitter || null;
      this.ducks = (def.ducks || []).map((d) => ({ ...d, x: d.x0, dir: 1, wait: 0 }));
      this.wheels = def.wheels || [];
      this.fountains = (def.fountains || []).map((f) => ({ ...f, drops: [], acc: 0 }));
      this.flockDef = def.flocks || null;
      this.flocks = [];
      // windmills' sails turning far off, glints of sun on spires and gilding
      // a shooting range: riflemen on the firing step, each in turn taking aim and firing at the targets
      this.range = def.range ? { period: [1.1, 1.8], pause: [2.5, 4], ...def.range, k: 0, t: 2, aim: -1, flash: 0, fired: -1 } : null;
      this.windmills = def.windmills || [];
      this.beacons = def.beacons || [];
      // a battlefield: red lightning, the fighting on the horizon, two lines trading volleys, burning
      // houses falling in as Hervé passes, and an airship coming down in flames
      this.lightning = def.lightning ? { every: [3, 7], col: '255,60,40', volume: 0.3, z: 0.06, horizon: 150, ...def.lightning, wait: 2, t: 99, bolt: null } : null;
      this.battle = def.battle ? { rate: 3, cannons: 0.25, ...def.battle, flashes: [], smoke: [], acc: 0 } : null;
      this.skirmish = (def.skirmish || []).map((k) => ({ scale: 0.6, n: 6, gap: 7, every: [2.5, 4.5], ...k, wait: rnd(1, 3), firing: -1, flash: 0, smoke: [] }));
      this.collapses = (def.collapses || []).map((b) => ({ near: 150, h: 40, ...b, state: 'up', chunks: [], t: 0 }));
      this.crash = def.crash ? { depth: 0.3, dur: 6, s: 1.2, lean: 0.6, ...def.crash, state: 'wait', t: 0, smoke: [], sparks: [] } : null;
      // bands of fog lying between the painted layers (and one low over the street, in front)
      this.fog = (def.fog || []).map((f) => ({ ...f, tex: fogTexture(f.col || '220,210,224', Math.round(f.h)) }));
      this.sparkles = (def.sparkles || []).map((s) => ({ ...s, ph: s.ph == null ? Math.random() * 6 : s.ph }));
      // children at their games and the town's dogs and cats, running about
      this.runners = (def.runners || []).map((u) => ({ speed: u.kind === 'cat' ? 9 : u.kind === 'dog' ? 40 : 32, ...u, x: u.start != null ? u.start : u.x0 != null ? (u.x0 + u.x1) / 2 : 0, dir: Math.random() < 0.5 ? 1 : -1, face: 1, wait: Math.random() * 2, moving: false, t: Math.random() * 5 }));
      for (const u of this.runners) if (u.follow != null && u.start == null) u.x = this.runners[u.follow].x - (u.gap || 10);
      if (this.flockDef) this.flockWait = this.flockDef.first == null ? 3 : this.flockDef.first;
    }

    inCover(x = this.x) { return this.cover.some((cv) => x >= cv.x0 && x <= cv.x1); }

    dismissGoal() {
      this.goalGone = true;
      this.goalCard.classList.add('gone');
      this.hint.classList.add('on');
    }

    async start() {
      this.layers = [];
      for (const l of this.scenery.layers) this.layers.push({ ...l, img: prescale(await image(l.src)) });
      // what moves in among the painted layers, each at its own distance: airships and balloons, trains
      this.slots = this.sky.map((a) => ({ z: a.z == null ? 0.1 : a.z, draw: (c, cam) => this.drawSkyItem(c, a, cam) }));
      if (this.train) this.slots.push({ z: this.train.depth + 0.001, draw: (c, cam) => this.drawTrain(c, cam) });
      if (this.flockDef) this.slots.push({ z: 0.09, draw: (c) => this.drawFlocks(c) });
      for (const m of this.windmills) this.slots.push({ z: m.depth + 0.001, draw: (c, cam) => this.drawSails(c, m, cam) });
      if (this.lightning) this.slots.push({ z: this.lightning.z, draw: (c) => this.drawLightning(c) });
      if (this.battle) this.slots.push({ z: this.battle.depth + 0.001, draw: (c, cam) => this.drawBattle(c, cam) });
      for (const k of this.skirmish) this.slots.push({ z: k.depth + 0.001, draw: (c, cam) => this.drawSkirmish(c, k, cam) });
      if (this.crash) this.slots.push({ z: this.crash.depth + 0.001, draw: (c, cam) => this.drawCrash(c, cam) });
      for (const f of this.fog) if (!f.front) this.slots.push({ z: f.z, draw: (c, cam) => this.drawFogBand(c, f, cam) });
      for (const b of this.beacons) this.slots.push({ z: b.depth + 0.002, draw: (c, cam) => this.drawBeacon(c, b, cam) });
      for (const s of this.sparkles) this.slots.push({ z: s.depth + 0.002, draw: (c, cam) => this.drawSparkle(c, s, cam) });
      this.slots.sort((a, b) => a.z - b.z);
      // the band above the waterline, flipped, for the reflection
      this.mirror = document.createElement('canvas');
      this.mirror.width = LW * SS;
      this.mirror.height = (LH - WY) * SS;
      this.mc = this.mirror.getContext('2d');
      this.buf = document.createElement('canvas');
      this.buf.width = LW * SS;
      this.buf.height = LH * SS;
      this.bc = this.buf.getContext('2d');
      this.bc.imageSmoothingEnabled = false;
      this.canvas = h('canvas.wk-canvas');
      this.prompt = h('div.wk-prompt');
      this.say = h('div.wk-say', h('div.wk-say-name'), h('div.wk-say-text'), h('div.wk-say-next', '▼'));
      // the goal: said plainly on a card as the walk begins, then kept in a banner at the top
      const goal = (this.def.goal || this.def.hint || '').replace(/\s*→\s*$/, '');
      this.hint = h('div.wk-hint', h('span.wk-hint-tag', 'Goal'), h('span', `${goal} →`));
      this.notices = h('div.item-notices.wk-notices', { 'aria-live': 'polite' });
      this.purse = h('div.wk-purse', h('span.wk-coin'), h('b', String(this.engine.francs())));
      const skip = h('button.wk-skip', { type: 'button' }, 'Skip ▸▸');
      skip.addEventListener('click', (e) => { e.stopPropagation(); this.finish('skipped'); });
      const help = this.def.chase
        ? h('div.wk-help', h('span', h('kbd', '↑'), ' jump'), h('span', h('kbd', '↓'), ' duck'), h('span', h('kbd', '←'), h('kbd', '→'), ' rein in · spur on'))
        : h('div.wk-help', h('span', h('kbd', '←'), h('kbd', '→'), ' walk'), h('span', h('kbd', 'Shift'), ' run'), this.cover.length ? h('span', h('kbd', '↓'), ' crouch') : null, h('span', h('kbd', 'E'), ' look · take · talk'));
      this.alertEl = this.patrols.length ? h('div.wk-alert', h('span.wk-alert-eye', '目'), h('span.wk-alert-text', 'Unseen')) : null;
      this.chaseEl = this.chase ? h('div.wk-chase', h('span.wk-chase-label', 'The riders'), h('div.wk-chase-track', h('i.wk-chase-them'), h('i.wk-chase-you'))) : null;
      this.hurtEl = h('div.wk-hurt');
      this.bubbles = h('div.wk-bubbles');
      this.goalCard = h('div.wk-goal',
        h('div.wk-goal-tag', this.def.chase ? 'Ride!' : 'Explore'),
        h('div.wk-goal-place', this.def.title || ''),
        this.def.region ? h('div.wk-goal-region', this.def.region) : null,
        h('div.wk-goal-rule', h('i'), h('b'), h('i')),
        h('div.wk-goal-label', 'Your goal'),
        h('div.wk-goal-text', goal),
        h('div.wk-goal-keys', ...[...help.children].map((k) => k.cloneNode(true)), this.def.chase ? null : h('span.wk-goal-click', 'or hold the mouse on either side')),
        h('div.wk-goal-go', this.def.chase ? 'It starts now!' : 'Start walking to begin'));
      this.el = h('div.overlay.walk', this.canvas, h('div.wk-vignette'), this.bubbles, this.prompt, this.goalCard, this.hint, this.purse, this.notices, help, this.alertEl, this.chaseEl, this.hurtEl, this.say, skip, h('div.wk-flash'), h('div.wk-fade'));
      this.el.style.setProperty('--wk-accent', this.def.accent || '255,214,140');
      if (this.def.bright) this.el.classList.add('wk-bright');
      this.say.addEventListener('click', (e) => { e.stopPropagation(); this.use(); });
      return new Promise((resolve) => {
        this.resolve = resolve;
        VN.currentWalk = this;
        this.entry = this.ui.open(this.el, {
          onKey: (e) => this.key(e, true),
          onBack: () => this.ui.openMenu('save'),
          focus: false,
        });
        this.entry.removeAfter = 900;
        this.entry.cleanup = () => this.stop();
        this.ui.cardEntry = this.entry;
        this.onUp = (e) => this.key(e, false);
        document.addEventListener('keyup', this.onUp);
        this.canvas.addEventListener('pointerdown', (e) => this.press(e));
        this.onRelease = () => { this.pointer = 0; };
        window.addEventListener('pointerup', this.onRelease);
        this.resize();
        this.onResize = () => this.resize();
        window.addEventListener('resize', this.onResize);
        this.last = performance.now();
        // the camera begins further along and glides back to Hervé, showing the way ahead
        if (!this.reduce && !this.def.chase) this.camX = VN.clamp(this.x + 200, 0, this.W - LW);
        this.raf = requestAnimationFrame((t) => this.frame(t));
        this.audio.fx('whoosh', { volume: 0.5 });
      });
    }

    resize() {
      const r = this.canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      this.canvas.width = Math.max(1, Math.round(r.width * dpr));
      this.canvas.height = Math.max(1, Math.round(r.height * dpr));
      this.cssW = this.el.offsetWidth || 1280;
      this.cssH = this.el.offsetHeight || 720;
      // cover: the painted view fills the screen, cropping a little where the shapes differ
      const k = Math.max(this.cssW / LW, this.cssH / LH);
      this.view = { k, ox: (this.cssW - LW * k) / 2, oy: (this.cssH - LH * k) / 2 };
      const cx = this.canvas.getContext('2d');
      cx.imageSmoothingEnabled = false;
    }

    /** From painted pixels to the overlay's coordinates. */
    toCss(lx, ly) { return [this.view.ox + lx * this.view.k, this.view.oy + ly * this.view.k]; }

    key(e, down) {
      const k = e.key;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') { this.keys.left = down; this.target = null; return true; }
      if (k === 'ArrowRight' || k === 'd' || k === 'D') { this.keys.right = down; this.target = null; return true; }
      if (k === 'Shift') { this.keys.run = down; return true; }
      if (k === 'ArrowDown' || k === 's' || k === 'S') { this.keys.down = down; return true; }
      if (this.chase && (k === 'ArrowUp' || k === 'w' || k === 'W' || k === ' ')) { if (down && !e.repeat) this.jump(); return true; }
      if (!down) return false;
      if (k === 'e' || k === 'E' || k === ' ' || k === 'Enter' || k === 'ArrowUp' || k === 'w' || k === 'W') { if (!e.repeat) this.use(); return true; }
      if (k === 'Escape') { this.ui.openMenu('save'); return true; }
      if (k === 'Tab') return true;
      return false;
    }

    press(e) {
      if (this.talking) { this.use(); return; }
      const r = this.canvas.getBoundingClientRect();
      const fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
      const lx = (fx * this.cssW - this.view.ox) / this.view.k + this.camX;
      const ly = (fy * this.cssH - this.view.oy) / this.view.k;
      // clicked on something: walk to it and use it
      const hit = this.things.find((th) => !th.used && Math.abs(th.x - lx) < 14 && ly > GY - 40 && ly < GY + 8);
      if (hit) { this.target = hit; return; }
      this.pointer = fx < 0.4 ? -1 : fx > 0.6 ? 1 : 0;
      if (!this.pointer) this.use();
    }

    near() {
      let best = null, bd = REACH;
      for (const th of this.things) {
        if (th.used) continue;
        const d = Math.abs(th.x - this.x);
        if (d < bd) { bd = d; best = th; }
      }
      return best;
    }

    use(th = this.near()) {
      if (this.talking) { this.advance(); return; }
      if (!th) return;
      this.target = null;
      this.facing = th.x >= this.x ? 1 : -1;
      const lines = (th.lines || []).slice();
      if (th.kind === 'coin') {
        th.used = true;
        this.engine.changeFrancs(th.amount || 5, { quiet: true });
        this.purse.querySelector('b').textContent = String(this.engine.francs());
        this.purse.classList.remove('pop'); void this.purse.offsetWidth; this.purse.classList.add('pop');
        this.fly = { x: th.x, y: GY - 10, t: 0, label: `+${th.amount || 5} francs` };
        this.audio.fx('sparkle', { volume: 0.6 });
        this.picked.push(`francs:${th.amount || 5}`);
      } else if (th.kind === 'item') {
        th.used = true;
        // the keepsake's card slides in here, over the walk (the usual place is underneath it)
        if (!this.engine.hasItem(th.item)) this.engine.gainItem(th.item, { into: this.notices });
        this.fly = { x: th.x, y: GY - 10, t: 0, label: th.label || '' };
        this.picked.push(th.item);
      } else if (th.kind === 'look' || th.kind === 'talk') {
        if (th.once) th.used = true;
      }
      if (th.set) for (const [name, value] of Object.entries(th.set)) this.engine.setVar(name, value);
      if (th.sound) this.audio.fx(th.sound, { volume: 0.6 });
      if (th.kind === 'goal') {
        if (lines.length) this.talk(th, lines, () => this.finish('arrived'));
        else this.finish('arrived');
        return;
      }
      if (lines.length) this.talk(th, lines);
    }

    /** Words in the little box at the bottom: a character's, or Hervé's own thoughts. */
    talk(th, lines, then) {
      this.talking = { th, lines, i: -1, then };
      // (a key still held when the words end walks on; a held click or tap does not)
      this.pointer = 0;
      this.say.classList.add('on');
      this.advance();
    }

    advance() {
      const tk = this.talking;
      if (!tk) return;
      if (this.typer && !this.typer.finished) { this.typer.finish(); return; }
      tk.i++;
      if (tk.i >= tk.lines.length) {
        this.talking = null;
        this.say.classList.remove('on');
        if (tk.then) tk.then();
        return;
      }
      const line = tk.lines[tk.i];
      const [who, text] = Array.isArray(line) ? line : [null, line];
      const ch = who ? this.story.characters[who] : null;
      const name = ch ? VN.plainName(this.engine.interp(ch.name)) : who || '';
      const nameEl = this.say.querySelector('.wk-say-name');
      nameEl.textContent = name;
      nameEl.style.color = (ch && ch.color) || '#f3d58e';
      nameEl.classList.toggle('on', !!name);
      const textEl = this.say.querySelector('.wk-say-text');
      textEl.classList.toggle('thought', !who);
      if (this.typer) this.typer.destroy();
      const voice = ch && ch.voice && this.audio.voiceLine(ch.voice);
      this.typer = new VN.Typer(textEl, this.engine.interp(text), {
        cps: this.settings.textSpeed,
        onChar: (c) => (voice ? this.audio.voiceChar(c) : this.audio.typeTick(c)),
      });
    }

    frame(now) {
      if (this.done) return;
      this.raf = requestAnimationFrame((t) => this.frame(t));
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      // hold still while a menu is open on top
      if (this.ui.overlays[this.ui.overlays.length - 1] !== this.entry) return;
      this.t += dt;
      this.update(dt);
      this.draw(dt);
    }

    jump() {
      const ch = this.chase;
      if (!ch || this.talking || this.stun > 0 || ch.jumpY < 0) return;
      ch.vy = -150;
      this.audio.fx('whoosh', { volume: 0.25 });
    }

    /** Someone caught Hervé: they say so, and the walk ends that way. */
    caught(lines) {
      if (this.isCaught) return;
      this.isCaught = true;
      this.keys.left = this.keys.right = this.keys.down = false;
      this.audio.fx('shouts', { volume: 0.6 });
      this.hurtEl.classList.remove('on'); void this.hurtEl.offsetWidth; this.hurtEl.classList.add('on');
      this.talk(null, lines && lines.length ? lines : ['They had me.'], () => this.finish('caught'));
    }

    action(dt) {
      if (this.stun > 0) this.stun -= dt;
      if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 2.5);
      this.crouch = !!this.keys.down && !this.def.ride && !this.talking;
      // lanterns on patrol: they walk their stretch of road, stop, look back, and walk on
      for (const p of this.patrols) {
        if (p.wait > 0) { p.wait -= dt; if (p.wait <= 0) p.dir *= -1; continue; }
        p.x += p.dir * (p.speed || 16) * dt;
        if ((p.dir > 0 && p.x >= p.x1) || (p.dir < 0 && p.x <= p.x0)) { p.x = VN.clamp(p.x, p.x0, p.x1); p.wait = p.pause || 1.8; }
      }
      if (this.patrols.length && !this.talking && !this.isCaught) {
        let seen = 0, heard = 0;
        const hidden = this.crouch && this.inCover();
        for (const p of this.patrols) {
          const dx = this.x - p.x, len = p.reach || 92;
          if (Math.sign(dx) === p.dir && Math.abs(dx) < len && !hidden) seen = Math.max(seen, 1.3 - (Math.abs(dx) / len) * 0.8);
          if (this.running && Math.abs(dx) < 120) heard = 0.45;
        }
        const was = this.alert;
        this.alert = VN.clamp(this.alert + dt * (seen || heard || -0.28), 0, 1);
        if (was < 0.5 && this.alert >= 0.5) this.audio.fx('heartbeat_fast', { volume: 0.4 });
        this.alertEl.style.setProperty('--a', this.alert.toFixed(3));
        this.alertEl.classList.toggle('on', this.alert > 0.02);
        this.alertEl.classList.toggle('high', this.alert > 0.6);
        this.alertEl.querySelector('.wk-alert-text').textContent = this.alert > 0.6 ? 'Seen!' : this.alert > 0.02 ? 'Careful' : 'Unseen';
        if (this.alert >= 1) this.caught(this.def.caughtLines);
      }
      // the chase: the horse gallops on by itself; jump, duck, and keep ahead of the riders
      const ch = this.chase;
      if (ch && !this.talking && !this.isCaught) {
        ch.vy += 460 * dt;
        ch.jumpY = Math.min(0, ch.jumpY + ch.vy * dt);
        if (ch.jumpY === 0) ch.vy = 0;
        const base = ch.speed || 110;
        const mine = this.stun > 0 ? base * 0.35 : base * (this.keys.right ? 1.12 : this.keys.left ? 0.85 : 1);
        ch.gap = Math.min(170, ch.gap + (mine - base * 0.98) * dt);
        for (const o of ch.obstacles) {
          if (o.done || Math.abs(o.x - this.x) > 6) continue;
          o.done = true;
          const clear = o.kind === 'branch' ? this.keys.down : ch.jumpY < -9;
          if (clear) continue;
          o.hit = true;
          this.stun = 0.8;
          this.shake = 1;
          ch.gap -= 26;
          this.audio.fx('thud', { volume: 0.7 });
          this.hurtEl.classList.remove('on'); void this.hurtEl.offsetWidth; this.hurtEl.classList.add('on');
        }
        this.chaseEl.style.setProperty('--gap', String(VN.clamp(ch.gap / 170, 0, 1).toFixed(3)));
        this.chaseEl.classList.toggle('close', ch.gap < 50);
        if (ch.gap < 14) this.caught(this.def.caughtLines);
        else if (this.x >= (ch.to || this.W - 200) + 40) { this.isCaught = true; this.talk(null, this.def.escapedLines || ['I left them behind in the dust.'], () => this.finish('escaped')); }
      }
      // shells: a shadow grows where one will land, and then it does
      const sh = this.shelling;
      if (sh && !this.talking) {
        sh.wait -= dt;
        if (sh.wait <= 0 && this.x < (sh.until || this.W - 120)) {
          sh.wait = rnd(1.6, 2.8) / (sh.rate || 1);
          sh.list.push({ x: VN.clamp(this.x + rnd(-30, 110), 20, this.W - 20), t: 0 });
          this.audio.fx('shell', { volume: 0.55 });
        }
        for (let i = sh.list.length - 1; i >= 0; i--) {
          const s = sh.list[i];
          s.t += dt;
          if (s.t < 1.3) continue;
          sh.list.splice(i, 1);
          burst(this.parts, s.x, GY, 1.2);
          this.shake = Math.max(this.shake, Math.abs(s.x - this.x) < 80 ? 1 : 0.4);
          if (Math.abs(s.x - this.x) < 26 && !(this.crouch && this.inCover())) {
            this.stun = 1.3;
            this.vx = Math.sign(this.x - s.x || 1) * 60;
            sh.hits++;
            if (sh.set) this.engine.setVar(sh.set, sh.hits);
            this.hurtEl.classList.remove('on'); void this.hurtEl.offsetWidth; this.hurtEl.classList.add('on');
          }
        }
      }
      // the bits of the explosions
      for (let i = this.parts.length - 1; i >= 0; i--) {
        const b = this.parts[i];
        b.age += dt;
        if (b.age > b.life) { this.parts.splice(i, 1); continue; }
        if (b.g) b.vy += b.g * dt;
        b.x += (b.vx || 0) * dt;
        b.y += (b.vy || 0) * dt;
        if (b.grow) b.r += b.grow * dt;
        if (b.g && b.y > GY) { b.y = GY; b.vx *= 0.5; b.vy = 0; }
      }
    }

    update(dt) {
      this.action(dt);
      const riding = !!this.def.ride;
      let dir = 0;
      if (!this.talking && this.stun <= 0 && !this.isCaught) {
        if (this.keys.left || this.pointer < 0) dir -= 1;
        if (this.keys.right || this.pointer > 0) dir += 1;
        if (!dir && this.target) {
          const d = this.target.x - this.x;
          if (Math.abs(d) < REACH * 0.6) { const th = this.target; this.target = null; this.use(th); }
          else dir = Math.sign(d);
        }
      }
      const run = (this.keys.run || (this.target && Math.abs(this.target.x - this.x) > 120)) && !this.crouch;
      let speed = (riding ? (run ? 190 : 120) : (run ? 105 : this.crouch ? 26 : 58)) * dir;
      // in a chase the horse runs on its own (slower for a moment after a stumble)
      if (this.chase && !this.talking && !this.isCaught) { dir = 1; speed = (this.stun > 0 ? 0.35 : this.keys.right ? 1.12 : this.keys.left ? 0.85 : 1) * (this.chase.speed || 110); }
      if (this.stun > 0 && !this.chase) speed = 0;
      this.vx += (speed - this.vx) * Math.min(1, dt * (this.stun > 0 && !this.chase ? 3 : 8));
      if (Math.abs(this.vx) < 1 && !dir) this.vx = 0;
      if (dir) this.facing = dir;
      this.x = VN.clamp(this.x + this.vx * dt, 14, this.W - 14);
      this.moving = Math.abs(this.vx) > 4;
      this.running = Math.abs(this.vx) > (riding ? 150 : 80);
      // footsteps (hooves on horseback)
      if (this.moving) {
        this.stepAcc += dt * (this.running ? 3.6 : 2.4);
        if (this.stepAcc > 1) { this.stepAcc = 0; this.audio.fx(riding ? (this.def.wet ? 'hoof_wet' : 'hoof') : this.def.ground ? `step_${this.def.ground}` : 'step', { volume: this.running ? 0.35 : 0.25 }); }
      }
      // the camera leads a little in the direction of travel
      const lead = this.facing * (this.chase ? 120 : this.moving ? 70 : 40);
      const want = VN.clamp(this.x - LW / 2 + lead, 0, this.W - LW);
      const before = this.camX;
      this.camX += (want - this.camX) * Math.min(1, dt * 2.2);
      this.camDx = this.camX - before;
      // an automatic goal ends the walk as soon as Hervé gets there
      for (const th of this.things) if (th.kind === 'goal' && th.auto && !th.used && Math.abs(th.x - this.x) < 10) { th.used = true; this.use(th); }
      const n = this.talking || this.chase ? null : this.near();
      this.showPrompt(n);
      // the goal card goes once Hervé sets off (or after a while), leaving the banner at the top
      if (!this.goalGone && (this.moving || this.talking || this.t > (this.def.chase ? 3 : 12))) this.dismissGoal();
      this.life(dt);
    }

    /** The camp going about its morning: talk, marching, drill, smoke. */
    life(dt) {
      const quiet = !!this.talking || this.done;
      // one conversation on the ground at a time (the nearest one), and none where a prompt is
      // showing; the sentries up on their towers talk over everyone's heads
      const low = (g) => !g.people || !g.people.some((p) => p.y && p.y < GY - 20);
      let nearest = null, best = Infinity;
      const cands = [...this.crowd.filter(low), ...(this.drill ? [this.drill] : [])];
      for (const g of cands) {
        const gx = g === this.drill ? g.x + (g.officer || 0) : g.x;
        const d = Math.abs(this.x - gx);
        if (d < (g.near || 150) && d < best) { best = d; nearest = g; }
      }
      const blocked = (gx) => this.promptFor && Math.abs(this.promptFor.x - gx) < 70;
      this.talkingGroup = nearest;
      // the colours going up: the call, the bugle, the flag climbing its pole; the camp falls silent
      const cl = this.colours;
      if (cl && cl.stage < 3) {
        cl.t += dt;
        const g = this.crowd[cl.group], f = this.flags[cl.flag];
        if (f) {
          if (f.top == null) f.top = f.y;
          f.rope = true;
          f.cur = cl.from + (f.top - cl.from) * VN.clamp((cl.t - cl.delay) / cl.dur, 0, 1);
        }
        if (!cl.called && cl.t > 0.3 && g) { cl.called = true; g.showing = cl.caller; this.showBubble(g, cl.call); }
        if (cl.stage === 0 && cl.t >= cl.delay) { cl.stage = 1; this.audio.fx('bugle', { volume: 0.9 }); }
        if (cl.stage === 1 && g && g.showing >= 0 && cl.t > cl.delay + 1.2) this.hideBubble(g);
        if (cl.stage === 1 && cl.t >= cl.delay + cl.dur) cl.stage = 2;
        if (cl.stage === 2 && cl.t >= cl.delay + cl.dur + cl.hold) { cl.stage = 3; if (g) g.timer = 2; }
      }
      const rite = cl && cl.stage < 3 ? this.crowd[cl.group] : null;
      const hush = !!cl && cl.stage < 2;
      for (const g of this.crowd) {
        if (g === rite) continue;
        const near = !quiet && !hush && Math.abs(this.x - g.x) < (g.near || 150) && (!low(g) || g === nearest) && !blocked(g.x);
        g.timer -= dt;
        if (!near) { if (g.showing >= 0) this.hideBubble(g); g.timer = Math.max(g.timer, 0.3); continue; }
        if (g.timer > 0) continue;
        if (g.showing >= 0) { this.hideBubble(g); g.timer = 0.9; continue; }
        const [who, text] = g.lines[g.k % g.lines.length];
        g.k++;
        g.showing = who;
        g.timer = 1.8 + text.length * 0.05;
        this.showBubble(g, text);
      }
      this.stepRunners(dt);
      this.stepRange(dt);
      this.stepWar(dt);
      // the drums of the street players and the like, heard when Hervé is near
      for (const g of this.crowd) {
        if (!g.sound) continue;
        g.soundT = (g.soundT == null ? rnd(0.5, 2) : g.soundT) - dt;
        if (g.soundT > 0) continue;
        g.soundT = rnd(g.sound.every[0], g.sound.every[1]);
        const d = Math.abs(this.x - g.x), near = g.sound.near || 180;
        if (d < near && !this.done && !this.talking) this.audio.fx(g.sound.name, { volume: (g.sound.volume || 0.4) * (1 - d / near) });
      }
      for (const m of this.marchers) {
        if (m.wait > 0) { m.wait -= dt; continue; }
        m.x += m.dir * (m.speed || 20) * dt;
        if ((m.dir > 0 && m.x > m.x1) || (m.dir < 0 && m.x < m.x0)) { m.x = VN.clamp(m.x, m.x0, m.x1); m.dir *= -1; m.wait = m.pause || 1.6; }
      }
      const d = this.drill;
      if (d) {
        d.timer -= dt;
        if (d.timer <= 0) {
          d.k++;
          const call = d.calls[d.k % d.calls.length];
          d.pose = call.pose || null;
          d.timer = d.period || 4.5;
          if (!quiet && !hush && d === this.talkingGroup && !blocked(d.x + (d.officer || 0))) this.showBubble(d, call.text, d.x + (d.officer || 0), GY);
          else if (d.bubble) this.hideBubble(d);
        } else if (d.bubble && (d.timer < (d.period || 4.5) - 2.6 || d !== this.talkingGroup)) this.hideBubble(d);
      }
      for (const sm of this.smokes) {
        sm.acc += dt * (sm.rate || 1.4);
        while (sm.acc > 1) {
          sm.acc -= 1;
          this.puffs.push({ x: sm.x + rnd(-1, 1), y: sm.y, vx: rnd(2, 6) * (sm.lean || 1), vy: -rnd(6, 10), r: rnd(1.2, 2), grow: rnd(1.2, 2), age: 0, life: rnd(4, 6), col: sm.col || '236,222,230', a: sm.a || 0.55 });
        }
      }
      for (const p of this.puffs) { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy *= 0.995; p.r += p.grow * dt; }
      this.puffs = this.puffs.filter((p) => p.age < p.life);
      // the train: out across the viaduct, whistling as it comes into view, steam trailing behind;
      // then a while with the line empty, and back the other way
      const tr = this.train;
      if (tr) {
        const ext = LW + (this.W - LW) * tr.depth;
        if (tr.x == null) {
          // (the first train can wait for Hervé to set off: afterMove seconds after he first moves)
          if (!tr.armed) { if (this.moving) { tr.armed = true; tr.wait = tr.afterMove; } }
          else tr.wait -= dt;
          if (tr.armed && tr.wait <= 0) {
            // in at the edge of what can be seen, so it is never missed
            const view = this.camX * tr.depth;
            tr.x = tr.dir > 0 ? view - 12 : view + LW + 12;
            tr.heard = false;
          }
        } else {
          tr.x += tr.dir * tr.speed * dt;
          tr.dist += tr.speed * dt;
          const sx = tr.x - this.camX * tr.depth;
          const seen = sx > -20 && sx < LW + 20;
          if (seen && !tr.heard) { tr.heard = true; this.audio.fx('whistle', { volume: 0.45 }); }
          tr.chuff += dt * 3.2;
          if (tr.chuff > 1) {
            tr.chuff -= 1;
            for (let k = 0; k < 2; k++) tr.puffs.push({ x: tr.x - tr.dir * 1.8 + rnd(-0.5, 0.5), y: tr.deck - 13, vx: rnd(2, 6), vy: -rnd(7, 11), r: rnd(0.9, 1.4), grow: rnd(1.4, 2), age: 0, life: rnd(2.2, 3.2), a: 0.85 });
            if (seen) this.audio.fx('chuff', { volume: 0.03 + 0.1 * Math.max(0, 1 - Math.abs(sx - LW / 2) / (LW * 0.8)) });
          }
          const tail = tr.x - tr.dir * TRAIN_LEN;
          if ((tr.dir > 0 && tail > ext + 10) || (tr.dir < 0 && tail < -10)) { tr.x = null; tr.dir *= -1; tr.wait = rnd(tr.pause[0], tr.pause[1]); }
        }
        for (const p of tr.puffs) { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy *= 0.99; p.r += p.grow * dt; }
        tr.puffs = tr.puffs.filter((p) => p.age < p.life);
      }
      // the cuirassiers: in by the north road, the length of the camp at a walk, out, and back again
      const cv = this.cavalry;
      if (cv) {
        if (cv.wait > 0) cv.wait -= dt;
        else {
          cv.x += cv.dir * cv.speed * dt;
          const tail = cv.x - cv.dir * (cv.n - 1) * cv.gap;
          if (cv.dir < 0 && tail < cv.to) { cv.dir = 1; cv.x = cv.to; cv.wait = cv.pause; }
          else if (cv.dir > 0 && tail > cv.from) { cv.dir = -1; cv.x = cv.from; cv.wait = cv.pause; }
          const d = Math.abs(cv.x - cv.dir * (cv.n - 1) * cv.gap / 2 - this.x);
          if (d < 240) { cv.step += dt * 4.5; if (cv.step > 1) { cv.step -= 1; this.audio.fx('hoof', { volume: 0.45 * (1 - d / 240) }); } }
        }
      }
      // the river and the town going about their day
      for (const b of this.boats) {
        b.x += (b.dir || 1) * (b.speed || 0) * dt;
        if (b.x > this.W + 120) b.x -= this.W + 240; else if (b.x < -120) b.x += this.W + 240;
      }
      const fs = this.fish;
      if (fs) {
        fs.wait -= dt;
        if (fs.wait <= 0) {
          fs.wait = rnd(0.6, 1.6) / (fs.rate || 1);
          fs.list.push({ x: this.camX + rnd(30, LW - 30), y: rnd(fs.y0 || 220, fs.y1 || 252), t: 0, dur: rnd(0.7, 1), h: rnd(8, 16), dir: Math.random() < 0.5 ? -1 : 1 });
        }
        for (const f of fs.list) f.t += dt;
        fs.list = fs.list.filter((f) => f.t < f.dur + 0.8);
      }
      for (const d of this.ducks) {
        if (d.wait > 0) { d.wait -= dt; continue; }
        d.x += d.dir * (d.speed || 5) * dt;
        if ((d.dir > 0 && d.x > d.x1) || (d.dir < 0 && d.x < d.x0)) { d.dir *= -1; d.wait = rnd(1, 3); }
      }
      for (const f of this.fountains) {
        f.acc += dt * 30;
        while (f.acc > 1) { f.acc -= 1; f.drops.push({ x: f.x + rnd(-0.5, 0.5), y: f.y, vx: rnd(-7, 7), vy: -rnd(10, 16) }); }
        for (const p of f.drops) { p.x += p.vx * dt; p.vy += 38 * dt; p.y += p.vy * dt; }
        f.drops = f.drops.filter((p) => p.y < f.basin);
      }
      if (this.flockDef) {
        const fd = this.flockDef;
        this.flockWait -= dt;
        if (this.flockWait <= 0) {
          this.flockWait = rnd(fd.every ? fd.every[0] : 14, fd.every ? fd.every[1] : 26);
          const n = Math.round(rnd(5, 10)), dir = Math.random() < 0.7 ? 1 : -1, y = rnd(fd.y ? fd.y[0] : 18, fd.y ? fd.y[1] : 90);
          const birds = [];
          for (let i = 0; i < n; i++) { const k = Math.ceil(i / 2); birds.push({ dx: -k * 7 * dir + rnd(-2, 2), dy: k * 3.5 * (i % 2 ? 1 : 0.8) + rnd(-1.5, 1.5), ph: rnd(0, 6) }); }
          this.flocks.push({ x: dir > 0 ? -60 : LW + 60, y, dir, v: rnd(26, 38), birds });
        }
        for (const f of this.flocks) f.x += f.dir * f.v * dt - (this.camDx || 0) * 0.15;
        this.flocks = this.flocks.filter((f) => f.x > -150 && f.x < LW + 150);
      }
      // now and then an airship's engines overhead, and the band practising across the camp
      if (!quiet) {
        this.hum.drone -= dt;
        if (this.hum.drone <= 0) { this.hum.drone = rnd(16, 26); if (this.sky.some((a) => a.kind !== 'balloon')) this.audio.fx('drone', { volume: 0.5 }); }
        if (this.def.band) { this.hum.band -= dt; if (this.hum.band <= 0) { this.hum.band = rnd(40, 70); this.audio.fx('band', { volume: this.def.band.volume || 0.35 }); } }
      }
    }

    /** A few words over someone's head, as the camp talks among itself. */
    showBubble(g, text, x, y) {
      if (!g.bubble) {
        g.bubble = h('div.wk-bubble', h('span'));
        this.bubbles.append(g.bubble);
      }
      g.bubble.firstChild.textContent = text;
      g.bubbleAt = x != null ? [x, y] : null;
      this.audio.fx('mutter', { volume: 0.3 });
      g.bubble.classList.remove('on');
      void g.bubble.offsetWidth;
      g.bubble.classList.add('on');
    }

    hideBubble(g) {
      g.showing = -1;
      if (g.bubble) g.bubble.classList.remove('on');
    }

    /** Where each bubble sits: over the speaker's head, following the camera. */
    placeBubbles() {
      const put = (g, lx, ly) => {
        const [cx, cy] = this.toCss(lx - this.camX, ly);
        g.bubble.style.transform = `translate(${cx.toFixed(0)}px, ${cy.toFixed(0)}px) translate(-50%, -100%)`;
      };
      for (const g of this.crowd) {
        if (!g.bubble || g.showing < 0) continue;
        const p = g.people[g.showing] || g.people[0];
        put(g, g.x + (p.dx || 0), (p.y || GY) - 30);
      }
      if (this.drill && this.drill.bubble && this.drill.bubbleAt) put(this.drill, this.drill.bubbleAt[0], this.drill.bubbleAt[1] - 30);
    }

    showPrompt(th) {
      if (!th) { this.prompt.classList.remove('on'); this.promptFor = null; return; }
      if (this.promptFor !== th) {
        this.promptFor = th;
        const verb = { coin: 'Take', item: 'Take', look: 'Look', talk: 'Talk', goal: th.verb || 'Go' }[th.kind] || 'Look';
        this.prompt.replaceChildren(h('kbd', 'E'), h('span', `${verb}${th.label ? ` · ${th.label}` : ''}`));
      }
      const [cx, cy] = this.toCss(th.x - this.camX, GY - (th.kind === 'talk' || th.look ? 34 : 22));
      this.prompt.style.transform = `translate(${cx.toFixed(0)}px, ${cy.toFixed(0)}px) translate(-50%, -100%)`;
      this.prompt.classList.add('on');
    }

    draw(dt) {
      const c = this.bc;
      const cam = this.camX;
      c.clearRect(0, 0, LW * SS, LH * SS);
      const behind = this.layers.filter((l) => l.depth <= 1);
      const front = this.layers.filter((l) => l.depth > 1);
      // the layers, far to near, with whatever moves among them drawn at its own distance
      let si = 0;
      for (const l of behind) {
        while (si < this.slots.length && this.slots[si].z < l.depth) this.slots[si++].draw(c, cam);
        this.layer(c, l, cam);
      }
      while (si < this.slots.length) this.slots[si++].draw(c, cam);
      this.drawPuffs(c, cam);
      for (const f of this.flags) this.drawFlag(c, f, cam);
      for (const f of this.fires) this.drawFire(c, f, cam);
      this.drawFountains(c, cam);
      // the camp's people, then the things along the way
      this.drawLife(c, cam);
      for (const th of this.things) this.thing(c, th, cam);
      this.drawShadows(c, cam);
      for (const p of this.patrols) this.drawPatrol(c, p, cam);
      if (this.chase) this.drawChase(c, cam, false);
      c.save();
      const ch = this.chase;
      c.translate(Math.round((this.x - cam) * SS), Math.round((GY + (ch ? ch.jumpY : 0)) * SS));
      c.scale(SS * this.facing, SS);
      if (this.stun > 0 && !ch) c.rotate(-0.25 * Math.sin(Math.min(1, this.stun) * Math.PI));
      if (this.def.ride) drawHorse(c, this.t, this.moving, this.running, this.hero, ch ? !!this.keys.down : false);
      else drawPerson(c, this.hero, this.t, this.moving, this.running, this.crouch);
      c.restore();
      for (const cv of this.cover) this.drawCover(c, cv, cam);
      if (this.chase) this.drawChase(c, cam, true);
      this.drawParts(c, cam);
      if (this.fly) {
        this.fly.t += dt;
        const a = Math.max(0, 1 - this.fly.t / 1.2);
        c.globalAlpha = a;
        c.fillStyle = '#ffe9a0';
        c.font = `bold ${7 * SS}px Georgia, serif`;
        c.textAlign = 'center';
        c.fillText(this.fly.label, (this.fly.x - cam) * SS, (this.fly.y - this.fly.t * 22) * SS);
        c.globalAlpha = 1;
        if (a <= 0) this.fly = null;
      }
      for (const f of this.fog) if (f.front) this.drawFogBand(c, f, cam);
      // the water: everything above it, upside down, trembling
      this.water(c);
      this.drawWaterLife(c, cam);
      for (const l of front) this.layer(c, l, cam);
      if (this.weather && !this.reduce) stepWeather(c, this.weather, dt, this.t, this.camDx || 0);
      this.placeBubbles();
      // onto the screen
      const out = this.canvas.getContext('2d');
      out.imageSmoothingEnabled = false;
      const sx = this.canvas.width / this.cssW;
      out.clearRect(0, 0, this.canvas.width, this.canvas.height);
      const jolt = this.shake > 0 && !this.reduce ? this.shake * 6 : 0;
      out.drawImage(this.buf, this.view.ox * sx + rnd(-jolt, jolt), this.view.oy * sx + rnd(-jolt, jolt), LW * this.view.k * sx, LH * this.view.k * sx);
    }

    /** Someone standing about: at (x, y), facing `face`, in a pose. */
    figure(c, look, x, y, face, t, moving, pose) {
      if (x < -20 || x > LW + 20) return;
      c.save();
      c.translate(Math.round(x * SS), Math.round(y * SS));
      c.scale(SS * face, SS);
      drawPerson(c, look, t, moving, false, false, pose);
      c.restore();
    }

    drawLife(c, cam) {
      const cv = this.cavalry;
      if (cv) {
        for (let i = 0; i < cv.n; i++) {
          const x = cv.x - cv.dir * i * cv.gap - cam;
          if (x < -30 || x > LW + 30) continue;
          const rd = cv.riders[i % cv.riders.length];
          c.save();
          c.translate(Math.round(x * SS), Math.round(cv.y * SS));
          c.scale(SS * cv.dir, SS);
          drawHorse(c, this.t + i * 0.31, cv.wait <= 0, false, LOOKS[rd.look], false, HORSES[rd.horse]);
          c.restore();
        }
      }
      const cl = this.colours;
      this.crowd.forEach((g, gi) => {
        const rite = cl && cl.stage < 3 && gi === cl.group ? cl : null;
        g.people.forEach((p, i) => {
          const face = p.face || 1;
          let pose = g.showing === i ? 'talk' : p.pose || null;
          if (rite && p.rite) pose = p.rite === 'present' ? 'present' : rite.stage === 1 ? p.rite : pose;
          // the townsfolk who stop to stare at the stranger as he passes
          const f = p.watch ? (this.x < g.x + (p.dx || 0) ? -1 : 1) : p.turn ? (Math.sin(this.t * 0.4 + i) > 0 ? 1 : -1) : face;
          this.figure(c, LOOKS[p.look || 'soldier'], g.x + (p.dx || 0) - cam, p.y || GY, f, this.t + i, false, pose);
        });
      });
      for (const b of this.collapses) this.drawCollapse(c, b, cam);
      this.drawRunners(c, cam);
      this.drawRange(c, cam);
      for (const m of this.marchers) {
        for (let i = 0; i < (m.n || 2); i++) this.figure(c, m.look, m.x - m.dir * i * (m.gap || 9) - cam, GY, m.dir, this.t, m.wait <= 0, m.pose || null);
      }
      const d = this.drill;
      if (d) {
        for (let i = 0; i < (d.n || 5); i++) this.figure(c, LOOKS[d.look || 'rifleman'], d.x + i * (d.gap || 9) - cam, GY, d.face || 1, 0, false, d.pose);
        if (d.officer != null) this.figure(c, LOOKS.officer, d.x + d.officer - cam, GY, -(d.face || 1), this.t, false, d.bubble && d.bubble.classList.contains('on') ? 'talk' : null);
      }
    }

    /** A flag waving on its pole: every column rides the wind a little later than the last. */
    drawFlag(c, f, cam) {
      const x0 = f.x - cam * (f.depth == null ? 1 : f.depth);
      if (x0 < -40 || x0 > LW + 10) return;
      const w = f.w || 24, hh = f.h || 11;
      const cols = f.colors || ['#2e4a9a', '#f2eee6', '#c83a3a'];
      const fy = f.cur == null ? f.y : f.cur;
      if (f.rope) { c.fillStyle = 'rgba(236,226,214,0.75)'; c.fillRect(Math.round(x0 * SS), Math.round(f.top * SS), 1, Math.round((GY - 16 - f.top) * SS)); }
      for (let i = 0; i < w; i++) {
        const k = i / w;
        const dy = Math.sin(this.t * 4.2 - i * 0.42) * k * 1.8;
        const slope = Math.cos(this.t * 4.2 - i * 0.42);
        const col = cols[Math.min(cols.length - 1, Math.floor(k * cols.length))];
        c.fillStyle = col;
        c.fillRect(Math.round((x0 + i) * SS), Math.round((fy + dy) * SS), SS, Math.round(hh * SS));
        if (Math.abs(slope) > 0.55) { c.fillStyle = slope > 0 ? 'rgba(255,240,240,0.18)' : 'rgba(40,20,50,0.2)'; c.fillRect(Math.round((x0 + i) * SS), Math.round((fy + dy) * SS), SS, Math.round(hh * SS)); }
        if (f.fringe && i % 2 === 0) { c.fillStyle = '#f0c050'; c.fillRect(Math.round((x0 + i) * SS), Math.round((fy + dy + hh) * SS), SS, SS); }
      }
    }

    /** A camp fire: flames that never hold still, and the light they throw. */
    drawFire(c, f, cam) {
      const x = f.x - cam;
      if (x < -40 || x > LW + 40) return;
      const g = c.createRadialGradient(x * SS, (f.y - 6) * SS, 0, x * SS, (f.y - 6) * SS, 34 * SS);
      g.addColorStop(0, `rgba(255,170,90,${0.22 + Math.sin(this.t * 9) * 0.05})`);
      g.addColorStop(1, 'rgba(255,140,70,0)');
      c.fillStyle = g;
      c.fillRect((x - 34) * SS, (f.y - 40) * SS, 68 * SS, 68 * SS);
      for (let k = 0; k < 7; k++) {
        const fx = x - 6 + k * 2, hgt = 4 + Math.abs(Math.sin(this.t * (7 + k) + k * 1.7)) * (k === 3 ? 9 : 6);
        c.fillStyle = '#ff7a2a'; c.fillRect(Math.round(fx * SS), Math.round((f.y - 2 - hgt) * SS), 2 * SS, Math.round(hgt * SS));
        c.fillStyle = '#ffd070'; c.fillRect(Math.round(fx * SS), Math.round((f.y - 2 - hgt * 0.55) * SS), SS, Math.round(hgt * 0.55 * SS));
      }
    }

    drawPuffs(c, cam) {
      for (const p of this.puffs) {
        const x = p.x - cam;
        if (x < -30 || x > LW + 30) continue;
        const k = 1 - p.age / p.life;
        c.fillStyle = `rgba(${p.col},${(p.a * k).toFixed(3)})`;
        const R = p.r, n = Math.ceil(R);
        for (let dy = -n; dy <= n; dy++) { const w = Math.floor(Math.sqrt(Math.max(0, R * R - dy * dy))); c.fillRect(Math.round((x - w) * SS), Math.round((p.y + dy) * SS), (w * 2 + 1) * SS, SS); }
      }
    }

    /** The sky of an industrious empire: steam airships crossing, observation balloons on their tethers. */
    drawSkyItem(c, a, cam) {
      const s = a.s || 1;
      if (a.kind === 'balloon') {
        const x = a.x - cam * (a.depth == null ? 0.12 : a.depth);
        if (x < -30 || x > LW + 30) return;
        this.drawBalloon(c, x, a.y + Math.sin(this.t * 0.7 + a.x) * 1.5, s, a);
        return;
      }
      const span = LW + 160 * s;
      const raw = a.x - cam * (a.depth == null ? 0.04 : a.depth) + (a.dir || -1) * this.t * (a.speed || 5);
      const x = ((raw % span) + span) % span - 80 * s;
      const y = a.y + Math.sin(this.t * 0.5 + a.x) * 1.2;
      if (a.kind === 'giant') this.drawGiant(c, x, y, s, a.dir || -1, a);
      else this.drawAirship(c, x, y, s, a.dir || -1);
    }

    /**
     * The great airship, far beyond Paris: painted off to one side, then veiled in the colour of
     * the sky, so all the air in between softens it and it never outshines the camp.
     */
    drawGiant(c, x, y, s, dir, a) {
      const L = 34 * s, H2 = 8 * s, pad = 46 * s;
      const cw = Math.ceil((L + pad) * 2 * SS), ch = Math.ceil((H2 * 2 + 30 * s) * SS);
      if (!this.giantCv) this.giantCv = document.createElement('canvas');
      const cv = this.giantCv;
      if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
      const g = cv.getContext('2d');
      g.clearRect(0, 0, cw, ch);
      const ox = L + pad, oy = H2 + 12 * s;
      this.paintGiant(g, ox, oy, s, dir);
      g.save();
      g.globalCompositeOperation = 'source-atop';
      const hz = g.createLinearGradient(0, 0, 0, ch);
      const [top, bottom] = a.haze || ['rgba(178,138,186,0.5)', 'rgba(230,160,182,0.5)'];
      hz.addColorStop(0, top);
      hz.addColorStop(1, bottom);
      g.fillStyle = hz;
      g.fillRect(0, 0, cw, ch);
      g.restore();
      c.drawImage(cv, Math.round((x - ox) * SS), Math.round((y - oy) * SS));
    }

    /** A great rigid airship: a long rounded hull, tail fins in the colours of France, a gondola, two engine cars. */
    paintGiant(c, x, y, s, dir) {
      const P = (px, py, w, hh, col) => { c.fillStyle = col; c.fillRect(Math.round((x + px * dir) * SS - (dir < 0 ? Math.round(w * SS) : 0)), Math.round((y + py) * SS), Math.max(1, Math.round(w * SS)), Math.max(1, Math.round(hh * SS))); };
      const L = 34 * s, H2 = 7 * s;
      const hullAt = (px) => H2 * Math.pow(Math.max(0, 1 - (px / L) * (px / L)), 0.8); // half the hull's height at px
      // the engines' steam, trailing out behind
      for (const ex of [-0.28, 0.2]) {
        for (let k = 0; k < 6; k++) {
          const age = (this.t * 0.32 + k / 6 + ex) % 1;
          const r = (1 + age * 3.5) * s;
          c.globalAlpha = 0.4 * (1 - age);
          P(ex * L - 3 * s - age * 34 * s - r, H2 + 2 * s - age * 4 * s - r * 0.6, r * 2, r * 1.2, '#efe4ea');
        }
      }
      c.globalAlpha = 1;
      // the fins at the tail: above and below, the rudders striped blue, white and red
      for (const sg of [-1, 1]) {
        for (let px = -L * 0.72; px > -L * 0.99; px -= 0.5) {
          const t = (-L * 0.72 - px) / (L * 0.27);
          const h0 = hullAt(px), h1 = h0 + 6 * s * Math.min(1, t * 1.6);
          const col = px < -L * 0.93 ? '#c83a3a' : px < -L * 0.88 ? '#f2eee6' : px < -L * 0.83 ? '#2e4a9a' : '#d8c6c8';
          P(px, sg < 0 ? -h1 : h0, 0.5, h1 - h0, col);
        }
      }
      P(-L * 1.02, -0.4 * s, L * 0.32, 0.8 * s, '#b8a4ae');
      // the hull: lighter on top, shadowed beneath, its seams and its girders showing through
      for (let yy = -H2; yy <= H2; yy += 0.5) {
        // a rounded bow, the stern drawn out to a point
        const k = yy / H2, bow = L * 0.97 * Math.sqrt(Math.max(0, 1 - k * k)), stern = L * Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(k), 1.3)));
        const col = k < -0.6 ? '#fbf2ea' : k < -0.2 ? '#f0e2da' : k < 0.3 ? '#e2d0cc' : k < 0.65 ? '#ccb6be' : '#b098a6';
        P(-stern, yy, stern + bow, 0.5, col);
      }
      for (let g = -6; g <= 6; g++) { const gx = g * L / 7.5, hh = hullAt(gx) * 0.96; P(gx, -hh, 0.5, hh * 2, 'rgba(150,120,140,0.3)'); }
      P(-L * 0.85, -H2 * 0.1, L * 1.7, 0.5, 'rgba(160,130,150,0.35)');
      // the tricolour round the hull, and the Emperor's golden eagle on a medallion near the bow
      for (const [dx, col] of [[0, '#2e4a9a'], [2.4, '#f2eee6'], [4.8, '#c83a3a']]) { const gx = -L * 0.56 + dx * s, hh = hullAt(gx) * 0.97; P(gx, -hh, 2.4 * s, hh * 2, col); }
      for (let yy = -1.6 * s; yy <= 1.6 * s; yy += 0.5) { const w = Math.sqrt(Math.max(0, 2.56 * s * s - yy * yy)); P(L * 0.5 - w, -H2 * 0.2 + yy, w * 2, 0.5, Math.abs(yy) > 1.1 * s ? '#c8a060' : '#e8c878'); }
      P(L * 0.5 - 1.1 * s, -H2 * 0.2 - 0.3 * s, 2.2 * s, 0.6 * s, '#a07848');
      // the gondola, slung close beneath, its windows lit; the struts that hold it
      for (const sx of [-0.18, 0, 0.18]) P(sx * L, H2 * 0.92, 0.5, 2.2 * s, '#6a5a60');
      P(-L * 0.24, H2 + 1.8 * s, L * 0.48, 2.8 * s, '#6a4a3a');
      P(-L * 0.24, H2 + 1.8 * s, L * 0.48, 0.6 * s, '#9a7a5a');
      P(L * 0.24, H2 + 2.2 * s, 1.6 * s, 2 * s, '#6a4a3a');
      for (let k = -L * 0.2; k < L * 0.2; k += 2.4 * s) P(k, H2 + 2.8 * s, 1 * s, 1 * s, Math.round(k / s) % 3 ? '#ffd28a' : '#3a2a30');
      // two engine cars, their propellers turning
      for (const ex of [-0.28, 0.2]) {
        P(ex * L - 3 * s, H2 * 0.9 + 1 * s, 6 * s, 2.2 * s, '#5a4a4a');
        P(ex * L - 3 * s, H2 * 0.9 + 1 * s, 6 * s, 0.5 * s, '#8a7a72');
        const px = ex * L - 3.6 * s;
        if (Math.floor(this.t * 12 + ex * 7) % 2) P(px, H2 * 0.9 - 0.6 * s, 0.7 * s, 5 * s, '#3a2e2a');
        else P(px - 0.5 * s, H2 * 0.9 + 1.8 * s, 1.7 * s, 0.7 * s, '#3a2e2a');
      }
      // and a long pennant from the top of the tail fin
      const fx = -L * 0.97, fy = -hullAt(fx) - 6 * s;
      for (let k = 0; k < 14 * s; k += 0.5) P(fx - k, fy + Math.sin(this.t * 3 - k * 0.35) * 1.1 * s * (k / (14 * s)), 0.5, 1.1 * s * (1 - k / (18 * s)), k < 4.6 * s ? '#2e4a9a' : k < 9.3 * s ? '#f2eee6' : '#c83a3a');
    }

    /** The train on the viaduct, and the steam it leaves hanging over the line. */
    drawTrain(c, cam) {
      const tr = this.train;
      const off = cam * tr.depth;
      if (tr.x != null) {
        let x = tr.x;
        for (const car of TRAIN) {
          const x0 = (tr.dir > 0 ? x - car.w : x) - off;
          if (x0 < LW + 4 && x0 + car.w > -4) this.drawCar(c, car, x0, tr.deck, tr.dir, tr.dist);
          x -= tr.dir * (car.w + 1.5);
        }
      }
      for (const p of tr.puffs) {
        const x = p.x - off;
        if (x < -20 || x > LW + 20) continue;
        const k = 1 - p.age / p.life;
        c.fillStyle = `rgba(248,238,242,${(p.a * k).toFixed(3)})`;
        const R = p.r, n = Math.ceil(R);
        for (let dy = -n; dy <= n; dy++) { const w = Math.floor(Math.sqrt(Math.max(0, R * R - dy * dy))); c.fillRect(Math.round((x - w) * SS), Math.round((p.y + dy) * SS), (w * 2 + 1) * SS, SS); }
      }
    }

    /** One vehicle of the train, `x0` its left end on screen, drawn facing the way the train goes. */
    drawCar(c, car, x0, yb, dir, dist) {
      const w = car.w;
      const R = (px, py, ww, hh, col) => { c.fillStyle = col; const X = dir > 0 ? x0 + px : x0 + w - px - ww; c.fillRect(Math.round(X * SS), Math.round((yb + py) * SS), Math.max(1, Math.round(ww * SS)), Math.max(1, Math.round(hh * SS))); };
      const disc = (px, cy, r, col) => { for (let dy = -r; dy < r; dy += 0.5) { const hw = Math.sqrt(Math.max(0, r * r - (dy + 0.25) * (dy + 0.25))); R(px - hw, cy + dy, hw * 2, 0.5, col); } };
      const wheel = (px, r = 1.25) => { disc(px, -r, r, '#2a2226'); const a = dist / r; R(px + Math.cos(a) * r * 0.5 - 0.25, -r + Math.sin(a) * r * 0.5 - 0.25, 0.5, 0.5, '#8a7a70'); };
      if (car.kind !== 'loco') R(w, -3, 1.5, 0.5, '#2a2226');
      if (car.kind === 'loco') {
        // a Crampton engine: one great driving wheel under the cab, a long low boiler, a tall stack
        disc(4, -3, 3, '#7a2a26'); disc(4, -3, 1, '#d8b060');
        const a = dist / 3; R(4 + Math.cos(a) * 2 - 0.25, -3 + Math.sin(a) * 2 - 0.25, 0.5, 0.5, '#f0d080');
        R(0.5, -6.5, 7, 0.5, '#d8b060');
        wheel(12.5); wheel(17);
        R(1, -3.5, 19, 0.5, '#2a2226');
        R(5, -7.5, 13, 4, '#3e5e4e'); R(5, -7.5, 13, 0.5, '#7a9a82'); R(5, -4, 13, 0.5, '#2a4034');
        for (const bx of [8.5, 12, 15.5]) R(bx, -7.5, 0.5, 4, '#d8b060');
        R(17.5, -8, 2, 4.5, '#2a2a30');
        R(17.5, -12.5, 1.5, 4.5, '#2a2a30'); R(17, -13, 2.5, 1, '#b07a4a');
        R(11, -9, 2, 1.5, '#d8b060'); R(6.5, -8.5, 1, 1, '#d8b060');
        R(0, -10.5, 5, 7, '#2e4a3e'); R(-0.5, -11, 6, 1, '#1e2a26'); R(1, -9.5, 2, 2, '#ffc070');
        R(19.5, -5, 1, 1.5, '#c83a3a');
        // a little tricolour on the cab, streaming back
        R(2.5, -14.5, 0.5, 3.5, '#2a2a30'); R(1.5, -14.5, 1, 1.2, '#2e4a9a'); R(0.5, -14.5 + Math.sin(dist * 0.3) * 0.25, 1, 1.2, '#f2eee6'); R(-0.5, -14.5, 1, 1.2, '#c83a3a');
      } else if (car.kind === 'tender') {
        wheel(2); wheel(7);
        R(0, -6.5, 9, 4, '#2e4a3e'); R(0, -6.5, 9, 0.5, '#5a7a66'); R(0.5, -7.5, 8, 1, '#1a1a1c');
      } else if (car.kind === 'gun' || car.kind === 'guns') {
        // a flat wagon with a field gun lashed down (and its ammunition chest), a gunner riding along
        wheel(2.5); wheel(11.5);
        R(0, -3.5, 14, 1, '#5a3e2a'); R(0, -3.5, 14, 0.5, '#8a6a4a');
        disc(6, -5.5, 1.8, '#6a4a2e'); disc(6, -5.5, 0.6, '#3a2a1e');
        R(4.5, -6.8, 7.5, 1, '#8a6a3a'); R(11.5, -7.2, 1, 1.6, '#6a4a2a'); R(2, -4.5, 4, 0.5, '#5a3e2a');
        if (car.kind === 'guns') { R(9, -6.5, 4.5, 3, '#4e5c3c'); R(9, -6.5, 4.5, 0.5, '#6e7c56'); }
        else { R(1, -6.5, 1, 0.8, '#c83a3a'); R(1, -5.7, 1, 1, '#e8c0a0'); R(0.8, -4.7, 1.5, 1.2, '#1e2a4a'); }
      } else if (car.kind === 'wagon') {
        // a covered wagon with the door slid open, and soldiers looking out
        wheel(2.5); wheel(9.5);
        R(0, -8.5, 12, 6, '#7a3a2e'); R(0, -8.5, 12, 0.5, '#9a5a44'); R(-0.5, -9, 13, 0.5, '#3a2a2a');
        R(4, -7.5, 4, 4.5, '#2a1a1a');
        for (const hx of [4.5, 6.5]) { R(hx, -7, 1, 0.6, '#c83a3a'); R(hx, -6.4, 1, 1, '#e8c0a0'); }
        R(4.2, -5.4, 3.6, 2, '#2e4a8a');
      } else if (car.kind === 'coach') {
        // the officers' carriage, blue and gold, a red kepi at the window
        wheel(2.5); wheel(10.5);
        R(0, -8.5, 13, 6, '#2e4a8a'); R(0, -8.5, 13, 0.5, '#5a76b0'); R(-0.5, -9.5, 14, 1, '#3a3040');
        for (const [k, lit] of [[1.5, true], [5.2, false], [8.9, true]]) R(k, -7.5, 2.6, 2, lit ? '#ffd28a' : '#1e2a44');
        R(5.7, -7.5, 1, 0.6, '#c83a3a'); R(5.7, -6.9, 1, 1, '#e8c0a0');
        R(0, -4.5, 13, 0.5, '#d8b060');
      } else {
        // the guard's van at the back, its lookout and its red lamp
        wheel(2); wheel(7);
        R(0, -8, 9, 5.5, '#6a4a3a'); R(-0.5, -8.5, 10, 0.5, '#3a2a2a'); R(3, -10, 3, 1.5, '#6a4a3a'); R(3.5, -9.7, 2, 0.8, '#ffd28a');
        R(0, -6.5, 0.5, 1, '#ff4a3a');
      }
    }

    drawAirship(c, x, y, s, dir, plain = false) {
      const P = (px, py, w, hh, col) => { c.fillStyle = col; c.fillRect(Math.round((x + px * dir) * SS - (dir < 0 ? Math.round(w * SS) : 0)), Math.round((y + py) * SS), Math.round(w * SS), Math.round(hh * SS)); };
      const L = 34 * s, H2 = 8 * s;
      // the envelope, a long cigar pointed at the front, lighter on top, with its seams
      for (let yy = -H2; yy <= H2; yy += 0.5) {
        const k = yy / H2;
        const half = L * Math.sqrt(Math.max(0, 1 - k * k));
        const nose = half * (1 - 0.15 * (1 - Math.abs(k)));
        const col = k < -0.55 ? '#fff6f0' : k < 0.2 ? '#eee0d8' : k < 0.6 ? '#d6c0c2' : '#b8a0aa';
        P(-half, yy, half + nose, 0.5, col);
      }
      P(-L * 0.9, -1, L * 1.8, 0.5, '#d8c4c4');
      P(-L * 0.8, H2 * 0.45, L * 1.6, 0.5, '#c0aab2');
      // the tricolour band near the tail, and the rudder (a plain ship carries no colours)
      if (!plain) {
        P(-L * 0.62, -H2 * 0.85, 2 * s, H2 * 1.7, '#2e4a9a');
        P(-L * 0.62 + 2 * s, -H2 * 0.9, 2 * s, H2 * 1.8, '#f2eee6');
        P(-L * 0.62 + 4 * s, -H2 * 0.85, 2 * s, H2 * 1.7, '#c83a3a');
      }
      for (let k = 0; k < 7 * s; k += 0.5) P(-L - 2 * s - k * 0.4, -k, 3 * s, 0.5, plain ? '#8a7a7e' : k < 3.5 * s ? '#c83a3a' : '#2e4a9a');
      // the keel, the rigging and the gondola, with its engine's propeller turning
      P(-L * 0.75, H2 + 4 * s, L * 1.5, 0.7, '#5a4a50');
      for (let k = -0.7; k <= 0.7; k += 0.2) P(L * k, H2 * 0.9, 0.5, 3.2 * s, 'rgba(90,70,80,0.8)');
      P(-6 * s, H2 + 4.5 * s, 12 * s, 3 * s, '#6a4a3a');
      P(-4 * s, H2 + 5.2 * s, 1.5, 1.2, '#ffd28a'); P(0, H2 + 5.2 * s, 1.5, 1.2, '#ffd28a');
      if (Math.floor(this.t * 16) % 2) P(-L * 0.78, H2 + 2 * s, 0.8, 5 * s, '#3a2e2a');
      else P(-L * 0.78 - 2 * s, H2 + 4 * s, 4 * s, 0.8, '#3a2e2a');
      // the steam engine's smoke, trailing behind
      for (let k = 0; k < 4; k++) {
        const age = ((this.t * 0.8 + k * 0.25) % 1);
        c.fillStyle = `rgba(230,220,228,${(0.5 * (1 - age)).toFixed(2)})`;
        const r = (1 + age * 3) * s;
        const px = x - dir * (6 * s + age * 26 * s), py = y + H2 + 3 * s - age * 3;
        c.fillRect(Math.round((px - r) * SS), Math.round((py - r * 0.6) * SS), Math.round(r * 2 * SS), Math.round(r * 1.2 * SS));
      }
    }

    drawBalloon(c, x, y, s, a) {
      const R = 8 * s;
      const cols = a.colors || ['#f2e6dc', '#c83a3a'];
      for (let yy = -R; yy <= R; yy += 0.5) {
        const w = Math.sqrt(Math.max(0, R * R - yy * yy)) * (yy > R * 0.3 ? 1 - (yy - R * 0.3) / (R * 1.3) : 1);
        for (let xx = -w; xx < w; xx += 1) {
          const gore = Math.floor(((Math.asin(Math.max(-1, Math.min(1, xx / Math.max(1, w)))) / Math.PI) + 0.5) * 6);
          let col = cols[gore % cols.length];
          if (xx > w * 0.35 || yy > R * 0.45) col = gore % 2 ? '#9a2a34' : '#c8b0b4';
          if (xx < -w * 0.4 && yy < 0) col = gore % 2 ? '#e05050' : '#fff8f0';
          c.fillStyle = col;
          c.fillRect(Math.round((x + xx) * SS), Math.round((y + yy) * SS), SS, Math.ceil(0.5 * SS));
        }
      }
      // ropes, the basket with two observers, and the tether down to the fort
      c.fillStyle = 'rgba(70,50,60,0.9)';
      for (const k of [-0.5, 0.5]) c.fillRect(Math.round((x + k * R * 0.9) * SS), Math.round((y + R * 0.8) * SS), SS / 2, Math.round(5 * s * SS));
      c.fillStyle = '#6a4a3a'; c.fillRect(Math.round((x - 2.5 * s) * SS), Math.round((y + R + 4 * s) * SS), Math.round(5 * s * SS), Math.round(3 * s * SS));
      c.fillStyle = '#2e4a8a'; c.fillRect(Math.round((x - 1.5 * s) * SS), Math.round((y + R + 3 * s) * SS), SS, SS); c.fillRect(Math.round((x + 1 * s) * SS), Math.round((y + R + 3 * s) * SS), SS, SS);
      if (a.tether) {
        c.fillStyle = 'rgba(70,50,60,0.55)';
        const y0 = y + R + 7 * s, y1 = a.tether;
        for (let yy = y0; yy < y1; yy += 1) c.fillRect(Math.round((x + (yy - y0) * 0.08) * SS), Math.round(yy * SS), 1, SS);
      }
    }

    /** Birds going over in a loose V, their wings beating. */
    drawFlocks(c) {
      c.fillStyle = '#26303e';
      for (const f of this.flocks) for (const b of f.birds) {
        const x = f.x + b.dx, y = f.y + b.dy + Math.sin(this.t * 1.3 + b.ph) * 1.2;
        const fr = Math.floor(this.t * 9 + b.ph) % 3;
        const P = (dx, dy) => c.fillRect(Math.round((x + dx) * SS), Math.round((y + dy) * SS), SS, SS);
        P(0, 0);
        const wy = fr === 0 ? -1 : fr === 1 ? 0 : 1;
        P(-1, wy); P(-2, wy * 2 || 0); P(1, wy); P(2, wy * 2 || 0);
      }
    }

    drawFountains(c, cam) {
      c.fillStyle = 'rgba(210,236,255,0.9)';
      for (const f of this.fountains) {
        if (f.x - cam < -30 || f.x - cam > LW + 30) continue;
        for (const p of f.drops) c.fillRect(Math.round((p.x - cam) * SS), Math.round(p.y * SS), SS, SS);
      }
    }

    /** What lives on the water: the sun's glitter, ducks, boats about their trade, fish leaping, the mill wheel. */
    drawWaterLife(c, cam) {
      const R = (x, y, w, hh, col) => { c.fillStyle = col; c.fillRect(Math.round(x * SS), Math.round(y * SS), Math.max(1, Math.round(w * SS)), Math.max(1, Math.round(hh * SS))); };
      const gl = this.glitter;
      if (gl && !this.reduce) {
        // the sun's road on the water, broken into sparkles that come and go
        for (let i = 0; i < (gl.n || 60); i++) {
          const seed = i * 97.13, yf = ((i * 37) % 100) / 100, y = WY + 2 + yf * (LH - WY - 4);
          const x = (gl.x || 80) + Math.sin(seed) * (8 + yf * 60);
          const tw = Math.sin(this.t * (2 + (i % 5)) + seed);
          if (tw < 0.2) continue;
          c.globalAlpha = Math.min(1, tw);
          R(x - 1, y, 2 + (i % 3), 0.5, i % 4 ? '#ffffff' : '#fff2c0');
        }
        c.globalAlpha = 1;
      }
      for (const d of this.ducks) this.drawDucks(c, d, cam, R);
      for (const b of this.boats) this.drawBoat(c, b, cam);
      if (this.fish) for (const f of this.fish.list) this.drawFish(c, f, cam, R);
      for (const w of this.wheels) this.drawWheel(c, w, cam);
    }

    drawBoat(c, b, cam) {
      const s = b.s || 1, dir = b.dir || 1;
      const x0 = b.x - cam, y = b.y + Math.sin(this.t * 1.4 + b.ph) * 0.6;
      if (x0 < -90 * s || x0 > LW + 90 * s) return;
      const P = (px, py, w, hh, col) => { c.fillStyle = col; c.fillRect(Math.round((x0 + (dir > 0 ? px : -px - w) * s) * SS), Math.round((y + py * s) * SS), Math.max(1, Math.round(w * s * SS)), Math.max(1, Math.round(hh * s * SS))); };
      // its reflection, dark and broken by the ripples, then the boat
      const len = b.kind === 'barge' ? 76 : b.kind === 'rowboat' ? 24 : 50;
      for (let k = 0; k < 4; k++) { c.globalAlpha = 0.3 - k * 0.06; P(-len / 2 + Math.sin(this.t * 3 + k) * 1.5, 1.5 + k * 1.3, len, 1, '#1e2a3a'); }
      c.globalAlpha = 1;
      if (b.kind === 'barge') {
        P(-38, -6, 76, 6, '#2e3a2e'); P(-38, -6, 76, 1.2, '#c83a3a'); P(-36, 0, 72, 1.5, '#1e2420');
        P(-30, -12, 40, 6, '#c8b48a'); for (let k = -30; k < 10; k += 8) P(k, -12, 1, 6, '#a8946a');
        P(18, -14, 14, 8, '#f0ece2'); P(20, -12, 3, 3, '#ffd88a'); P(26, -12, 3, 3, '#3a4a62'); P(17, -15, 16, 1.5, '#8a3a2a');
        P(-36, -18, 1, 12, '#4a3424'); P(-35, -18, 5, 3, '#2e4a8a');
        P(34, -16, 3, 7, '#3a4a6a'); P(34, -19, 3, 3, '#e8c0a0'); P(33, -20, 5, 1, '#e0c878');
        for (let k = 0; k < 16; k++) P(38 - k * 0.3, -18 + k * 1.3, 1, 1, '#6a4a2a');
      } else if (b.kind === 'rowboat') {
        P(-12, -4, 24, 4, '#8a5a34'); P(-12, -4, 24, 1, '#b07a4a'); P(-10, 0, 20, 1, '#5a3a24');
        P(-2, -11, 4, 7, '#5a6a4a'); P(-2, -14, 4, 3, '#d8a888'); P(-4, -15, 8, 1, '#e0c878');
        for (let k = 0; k < 14; k++) P(2 + k, -10 - k * 0.8, 1, 1, '#6a4a2a');
        for (let k = 0; k < 14; k++) P(16, -21 + k * 1.5, 0.5, 1, 'rgba(230,230,230,0.7)');
      } else {
        // a gabare: barrels in the hold, the square sail full of the breeze, the helmsman at the sweep
        P(-24, -5, 50, 5, '#6a4a30'); P(-24, -5, 50, 1.5, '#9a7048'); P(-20, 0, 42, 1.5, '#4a3020');
        for (let k = -16; k < 12; k += 5) { P(k, -9, 4, 4, '#8a5a34'); P(k, -9, 4, 1, '#5a3a24'); }
        P(2, -38, 1.2, 33, '#4a3424');
        const bil = Math.sin(this.t * 1.6 + b.ph);
        P(-9, -35, 23 + bil, 22, '#f4ead6'); P(-9, -28, 23 + bil, 3, '#c84a3a'); P(-9, -35, 1, 22, '#d8cbb0');
        P(-24, -12, 1, 8, '#4a3424'); P(-26, -13, 3, 2, '#2e4a8a');
        P(-30, -3, 10, 1, '#6a4a2a');
        P(-22, -12, 3, 7, '#6a3a2a'); P(-22, -15, 3, 3, '#e0b898'); P(-23, -16, 5, 1, '#3a3040');
      }
    }

    drawFish(c, f, cam, R) {
      const x0 = f.x - cam, p = f.t / f.dur;
      if (x0 < -20 || x0 > LW + 20) return;
      if (p <= 1) {
        // a silver fish, arcing out and back, the light catching its side
        const x = x0 + f.dir * p * 14, y = f.y - Math.sin(Math.PI * p) * f.h, tilt = Math.cos(Math.PI * p);
        R(x - 2, y - 1 - tilt, 4, 2, '#d8e4f0');
        R(x - 2, y - 1 - tilt, 4, 0.8, '#5a6a80');
        R(x - f.dir * 3 - 0.5, y - 0.5 + tilt, 2, 2, '#9aaabc');
        if (Math.sin(this.t * 30) > 0) R(x, y - 1, 1, 1, '#ffffff');
      }
      // rings and a spray of drops where it leaves the water and where it goes back in
      for (const [sx, st] of [[x0, f.t], [x0 + f.dir * 14, f.t - f.dur]]) {
        if (st < 0 || st > 0.8) continue;
        const k = st / 0.8, rx = 2 + k * 8, ry = 0.6 + k * 1.6;
        c.globalAlpha = 0.7 * (1 - k);
        for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; R(sx + Math.cos(a) * rx, f.y + Math.sin(a) * ry, 1, 0.5, '#ffffff'); }
        if (st < 0.3) for (let i = 0; i < 4; i++) R(sx + (i - 1.5) * 2, f.y - st * 22 * (1 + (i % 2)) + st * st * 60, 0.5, 0.5, '#ffffff');
        c.globalAlpha = 1;
      }
    }

    drawDucks(c, d, cam, R) {
      for (let i = 0; i <= (d.n || 4); i++) {
        const f = d.dir, x = d.x - f * (i * 6 + (i ? 3 : 0)) - cam, y = d.y + Math.sin(this.t * 2 + i) * 0.4;
        if (x < -10 || x > LW + 10) continue;
        if (i === 0) {
          R(x - 3, y - 2, 6, 2.5, '#8a6a4a'); R(x - 3, y - 2, 6, 0.8, '#a8886a');
          R(x + (f > 0 ? 2 : -4), y - 4.5, 2, 2.5, '#2e6a3a'); R(x + (f > 0 ? 4 : -5), y - 3.5, 1.2, 0.8, '#f0b030');
          R(x + (f > 0 ? -4 : 3), y - 2.5, 1.2, 1, '#6a4a30');
        } else { R(x - 1.5, y - 1.5, 3, 1.8, '#f4d860'); R(x + (f > 0 ? 1 : -2), y - 2.6, 1.2, 1.2, '#f4d860'); }
        c.globalAlpha = 0.5; R(x - f * 5, y + 0.5, 3, 0.5, '#ffffff'); c.globalAlpha = 1;
      }
    }

    /** The mill wheel, turning with the river, spilling water from its paddles. */
    /**
     * Children and animals: each runs to and fro between x0 and x1, pausing now and then (a cat
     * sits a long while). One with `follow` keeps to its own side of the one it follows, `gap`
     * behind (or ahead, if that one turns and comes at it): a game of tag, or a dog at the heels.
     */
    stepRunners(dt) {
      for (const u of this.runners) {
        u.t += dt;
        let vx = 0;
        const lead = u.follow != null ? this.runners[u.follow] : null;
        if (lead) {
          const side = u.x < lead.x ? 1 : -1, d = lead.x - side * (u.gap || 10) - u.x;
          if (Math.abs(d) > 1.5) vx = Math.sign(d) * Math.min(u.speed, Math.abs(d) * 5);
          u.wait = vx ? 0 : u.wait + dt;
        } else if (u.wait > 0) u.wait -= dt;
        else {
          vx = u.dir * u.speed;
          const nx = u.x + vx * dt;
          if (nx > u.x1 || nx < u.x0 || Math.random() < dt * (u.turn || 0.1)) {
            u.dir = nx > u.x1 ? -1 : nx < u.x0 ? 1 : -u.dir;
            vx = 0;
            const k = Math.random();
            u.wait = u.kind === 'cat' ? rnd(3, 9) : k < 0.55 ? rnd(0.5, 2.2) : 0;
            u.pose = u.kind == null && Math.random() < 0.35 ? 'wave' : null;
          }
        }
        u.x += vx * dt;
        u.moving = Math.abs(vx) > 1;
        if (u.moving) u.face = vx > 0 ? 1 : -1;
      }
    }

    drawRunners(c, cam) {
      for (const u of this.runners) {
        const x = u.x - cam;
        if (x < -20 || x > LW + 20) continue;
        c.save();
        c.translate(Math.round(x * SS), Math.round((u.y || GY) * SS));
        c.scale(SS * u.face, SS);
        if (u.kind === 'dog') drawDog(c, u.t, u.moving, u.moving && u.speed > 30, DOGS[u.coat || 'spaniel'], !u.moving && u.wait > 0.6);
        else if (u.kind === 'cat') drawCat(c, u.t, u.moving, CATS[u.coat || 'ginger'], !u.moving);
        else {
          drawPerson(c, LOOKS[u.look || 'boy'], u.t, u.moving, u.moving, false, u.moving ? null : u.pose || null);
          if (u.hoop) drawHoop(c, u.x);
        }
        c.restore();
      }
    }

    stepWar(dt) {
      const L = this.lightning;
      if (L) {
        L.t += dt; L.wait -= dt;
        if (L.wait <= 0) {
          L.wait = rnd(L.every[0], L.every[1]); L.t = 0;
          const pts = [];
          let x = rnd(40, LW - 40), y = 0;
          while (y < L.horizon) { pts.push([x, y]); x += rnd(-6, 6); y += rnd(4, 9); }
          L.bolt = pts;
          const at = Math.floor(pts.length * rnd(0.3, 0.5)), side = Math.random() < 0.5 ? -1 : 1;
          L.fork = pts.slice(at, at + 7).map(([px_, py], i) => [px_ + side * i * rnd(3, 6), py + i * 1.5]);
          if (!this.done) { const d = rnd(0.15, 0.7); this.audio.fx('thunder', { volume: L.volume, delay: d }); if (Math.random() < 0.5) this.audio.fx('thunder', { volume: L.volume * 0.6, delay: d + rnd(0.6, 1.4) }); }
        }
      }
      const B = this.battle;
      if (B) {
        B.acc += dt * B.rate;
        while (B.acc > 1) {
          B.acc -= 1;
          const big = Math.random() < B.cannons, x = rnd(B.x0, B.x1), y = B.y + rnd(-3, 3);
          B.flashes.push({ x, y, t: 0, big });
          if (big) { B.smoke.push({ x, y, r: 1.5, life: 0, max: rnd(3, 5) }); if (Math.random() < 0.35 && !this.done) this.audio.fx('cannon_far', { volume: 0.14 }); }
        }
        for (const f of B.flashes) f.t += dt;
        B.flashes = B.flashes.filter((f) => f.t < (f.big ? 0.22 : 0.12));
        for (const s_ of B.smoke) { s_.life += dt; s_.y -= dt * 3; s_.r += dt * 2.2; }
        B.smoke = B.smoke.filter((s_) => s_.life < s_.max);
      }
      for (const k of this.skirmish) {
        k.flash = Math.max(0, k.flash - dt);
        if (k.firing >= 0) {
          k.ft -= dt;
          if (k.ft <= 0) {
            k.flash = 0.1; k.firing = -1; k.wait = rnd(k.every[0], k.every[1]);
            for (let i = 0; i < k.n; i++) if (Math.random() < 0.8) k.smoke.push({ x: k.x0 + i * k.gap + k.dir * 15 * k.scale, y: k.y - 13 * k.scale, r: 1, life: 0, max: rnd(1.5, 2.5) });
            const d = Math.abs(this.x - (k.x0 + this.camX * (1 - k.depth)));
            if (!this.done && d < 400) this.audio.fx('volley', { volume: 0.12 });
          }
        } else if ((k.wait -= dt) <= 0) { k.firing = 1; k.ft = 0.7; }
        for (const s_ of k.smoke) { s_.life += dt; s_.y -= dt * 2; s_.x += dt * 3 * k.dir; s_.r += dt * 1.6; }
        k.smoke = k.smoke.filter((s_) => s_.life < s_.max);
      }
      for (const b of this.collapses) {
        if (b.state === 'up' && this.x > b.x - b.near) {
          // the house gives way: its timbers and tiles tumble down into a burning heap
          b.state = 'falling';
          const cols = ['#3a2620', '#2a1a16', '#6a4a3a', '#4a3a36', '#2a2630', '#1e1a22'];
          for (let yy = 0; yy < b.h; yy += 6) for (let xx = 0; xx < b.w; xx += 6) {
            const roof = yy < 12;
            b.chunks.push({ x: b.x + xx, y: GY - 3 - b.h + yy, w: 6, h: roof ? 4 : 6, col: roof ? cols[4 + (xx / 6) % 2] : cols[(xx / 6 + yy / 6) % 4], vx: rnd(-26, 26) + (xx - b.w / 2) * 0.6, vy: rnd(-50, -5), a: 0, va: rnd(-6, 6), floor: GY - 3 - rnd(0, Math.min(12, b.h * 0.3)), rest: false });
          }
          for (let i = 0; i < 14; i++) this.puffs.push({ x: b.x + rnd(0, b.w), y: GY - rnd(2, b.h * 0.7), vx: rnd(-10, 10), vy: -rnd(3, 9), r: rnd(1.2, 2.4), grow: rnd(1.2, 2.4), age: 0, life: rnd(1.6, 3), col: '64,44,42', a: 0.5 });
          if (!this.done) { this.audio.fx('explosion', { volume: 0.45 }); this.audio.fx('thud', { volume: 0.5, delay: 0.3 }); }
        }
        if (b.state === 'falling') {
          let moving = false;
          for (const ch of b.chunks) {
            if (ch.rest) continue;
            moving = true;
            ch.vy += 260 * dt; ch.x += ch.vx * dt; ch.y += ch.vy * dt; ch.a += ch.va * dt;
            if (ch.y >= ch.floor) { ch.y = ch.floor; if (Math.abs(ch.vy) > 40) { ch.vy *= -0.3; ch.vx *= 0.5; ch.va *= 0.4; } else { ch.rest = true; ch.a = Math.round(ch.a / (Math.PI / 2)) * (Math.PI / 2) + rnd(-0.3, 0.3); } }
          }
          if (!moving) b.state = 'down';
        }
      }
      const C = this.crash;
      if (C) {
        const pos = (p) => [C.from[0] + (C.to[0] - C.from[0]) * p, C.from[1] + (C.to[1] - C.from[1]) * p * p];
        if (C.state === 'wait') { if (this.x >= C.trigger) { C.state = 'fall'; C.t = 0; if (!this.done) this.audio.fx('rocket', { volume: 0.3 }); } }
        else if (C.state === 'fall') {
          C.t += dt;
          const p = Math.min(1, C.t / C.dur), [x, y] = pos(p);
          if (Math.random() < dt * 30) C.smoke.push({ x: x - 6, y, r: 2, life: 0, max: rnd(2.5, 4), dark: true });
          if (p >= 1) {
            C.state = 'wreck'; C.boom = 0;
            for (let i = 0; i < 50; i++) C.sparks.push({ x, y, vx: rnd(-70, 70), vy: rnd(-90, -10), life: 0, max: rnd(0.6, 1.5) });
            if (!this.done) { this.audio.fx('explosion', { volume: 0.9 }); this.audio.fx('cannon', { volume: 0.6, delay: 0.15 }); }
          }
        } else {
          C.boom += dt;
          if (Math.random() < dt * 9) C.smoke.push({ x: C.to[0] + rnd(-30, 30) * C.s, y: C.to[1] - 8 * C.s, r: 2, life: 0, max: rnd(5, 8), dark: true });
        }
        for (const s_ of C.smoke) { s_.life += dt; s_.y -= dt * 7; s_.x += dt * 4; s_.r += dt * 3.5; }
        C.smoke = C.smoke.filter((s_) => s_.life < s_.max);
        for (const s_ of C.sparks) { s_.life += dt; s_.x += s_.vx * dt; s_.y += s_.vy * dt; s_.vy += 120 * dt; }
        C.sparks = C.sparks.filter((s_) => s_.life < s_.max);
      }
    }

    /** Red lightning: the sky flashes the colour of blood, a bolt forks down behind the hills. */
    drawLightning(c) {
      const L = this.lightning;
      if (!L || L.t > 0.45 || this.reduce) return;
      // a flicker: a bright stroke, a second, a fading afterglow
      const f = L.t < 0.07 ? 1 : L.t < 0.12 ? 0.25 : L.t < 0.2 ? 0.8 : L.t < 0.45 ? 0.35 * (1 - (L.t - 0.2) / 0.25) : 0;
      if (f > 0) {
        const g = c.createLinearGradient(0, 0, 0, L.horizon * SS);
        g.addColorStop(0, `rgba(${L.col},${(0.34 * f).toFixed(3)})`);
        g.addColorStop(1, `rgba(${L.col},${(0.14 * f).toFixed(3)})`);
        c.fillStyle = g; c.fillRect(0, 0, LW * SS, L.horizon * SS);
      }
      if (L.bolt && L.t < 0.32) {
        const path = (pts) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x * SS, y * SS) : c.moveTo(x * SS, y * SS))); c.stroke(); };
        c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
        for (const [pts, wide] of [[L.bolt, 1], [L.fork, 0.6]]) {
          if (!pts) continue;
          c.strokeStyle = `rgba(${L.col},${(0.45 * Math.max(f, 0.3)).toFixed(3)})`; c.lineWidth = 5 * wide * SS; path(pts);
          c.strokeStyle = f > 0.5 ? '#ffe8e0' : `rgba(255,200,190,${(0.4 + f * 0.4).toFixed(3)})`; c.lineWidth = Math.max(1, 1.4 * wide * SS); path(pts);
        }
        c.restore();
      }
    }

    /** The fighting on the horizon: musket flashes up and down the line, the guns, their smoke. */
    drawBattle(c, cam) {
      const B = this.battle, off = cam * B.depth;
      const D = (x, y, w, hh, col) => { c.fillStyle = col; c.fillRect(Math.round(x * SS), Math.round(y * SS), Math.max(1, Math.round(w * SS)), Math.max(1, Math.round(hh * SS))); };
      for (const s_ of B.smoke) { const x = s_.x - off; if (x < -20 || x > LW + 20) continue; c.fillStyle = `rgba(60,40,44,${(0.6 * (1 - s_.life / s_.max)).toFixed(3)})`; c.beginPath(); c.arc(x * SS, s_.y * SS, s_.r * SS, 0, Math.PI * 2); c.fill(); }
      for (const f of B.flashes) {
        const x = f.x - off;
        if (x < -10 || x > LW + 10) continue;
        if (f.big) { D(x - 2, f.y - 1, 5, 3, '#ffd080'); D(x - 1, f.y - 2, 3, 5, '#fff4c0'); c.fillStyle = 'rgba(255,170,90,0.25)'; c.beginPath(); c.arc(x * SS, f.y * SS, 10 * SS, 0, Math.PI * 2); c.fill(); }
        else { D(x, f.y, 1, 1, '#fff0b0'); D(x + 1, f.y, 1, 1, '#ffb050'); }
      }
    }

    /** Two lines of soldiers far off, trading volleys through the smoke. */
    drawSkirmish(c, k, cam) {
      const off = cam * k.depth;
      for (let i = 0; i < k.n; i++) {
        const x = k.x0 + i * k.gap - off;
        if (x < -20 || x > LW + 20) continue;
        c.save();
        c.translate(Math.round(x * SS), Math.round(k.y * SS));
        c.scale(SS * k.scale * k.dir, SS * k.scale);
        drawPerson(c, LOOKS[k.look || 'farSoldier'], this.t + i, false, false, false, k.firing >= 0 ? 'aim' : null);
        c.restore();
        if (k.flash > 0) { c.fillStyle = '#ffe090'; c.fillRect(Math.round((x + k.dir * 15 * k.scale) * SS), Math.round((k.y - 13 * k.scale) * SS), SS * 2, SS); }
      }
      for (const s_ of k.smoke) { const x = s_.x - off; c.fillStyle = `rgba(200,180,176,${(0.5 * (1 - s_.life / s_.max)).toFixed(3)})`; c.beginPath(); c.arc(x * SS, s_.y * SS, s_.r * SS, 0, Math.PI * 2); c.fill(); }
    }

    /** Tongues of flame along a line: tapered, leaning with the wind, each flickering on its own. */
    flameTongues(c, x, y, w, n, hgt, seed = 0) {
      for (let k = 0; k < n; k++) {
        const fx = x + (k + 0.5) * (w / n) + Math.sin(this.t * 3 + k * 5.1 + seed) * 1.2;
        const fh = hgt * (0.45 + 0.55 * Math.abs(Math.sin(this.t * (4.5 + (k % 3)) + k * 1.9 + seed))) * (k % 3 === 1 ? 1.3 : 1);
        const bw = Math.max(2, w / n * 1.3), lean = Math.sin(this.t * 2.2 + k + seed) * fh * 0.25 + fh * 0.15;
        const tongue = (sc, col) => { c.fillStyle = col; c.beginPath(); c.moveTo((fx - bw / 2 * sc) * SS, y * SS); c.quadraticCurveTo((fx - bw * 0.3 * sc) * SS, (y - fh * 0.5 * sc) * SS, (fx + lean * sc) * SS, (y - fh * sc) * SS); c.quadraticCurveTo((fx + bw * 0.4 * sc) * SS, (y - fh * 0.45 * sc) * SS, (fx + bw / 2 * sc) * SS, y * SS); c.closePath(); c.fill(); };
        tongue(1, k % 2 ? '#e0501e' : '#ff7a2a'); tongue(0.62, '#ffb040'); tongue(0.3, '#fff0a0');
      }
    }

    /** A soft round glow of firelight. */
    fireGlow(c, x, y, rad, a = 0.35) {
      const g = c.createRadialGradient(x * SS, y * SS, 0, x * SS, y * SS, rad * SS);
      g.addColorStop(0, `rgba(255,140,60,${(a * (0.85 + 0.15 * Math.sin(this.t * 9))).toFixed(3)})`);
      g.addColorStop(1, 'rgba(255,110,40,0)');
      c.fillStyle = g; c.fillRect((x - rad) * SS, (y - rad) * SS, rad * 2 * SS, rad * 2 * SS);
    }

    /** A townhouse on fire, and after it has given way, its heap of timbers and tiles still burning. */
    drawCollapse(c, b, cam) {
      const x0 = b.x - cam;
      if (x0 > LW + 30 || x0 + b.w < -40) return;
      const R = (x, y, w, hh, col) => { c.fillStyle = col; c.fillRect(Math.round(x * SS), Math.round(y * SS), Math.max(1, Math.round(w * SS)), Math.max(1, Math.round(hh * SS))); };
      const yb = GY - 3, top = yb - b.h, f1 = Math.round(b.h * 0.5);
      if (b.state === 'up') {
        this.fireGlow(c, x0 + b.w / 2, top + b.h * 0.4, b.w * 1.1, 0.4);
        // the ground floor: dark timber and lattice, its doorway full of fire
        R(x0, yb - f1, b.w, f1, '#2a1a18');
        for (let k = 2; k < b.w - 2; k += 2) R(x0 + k, yb - f1 + 2, 1, f1 - 4, '#3e2622');
        const dx = x0 + b.w * 0.55, dw = Math.min(12, b.w * 0.3), fl = Math.sin(this.t * 11) > 0;
        R(dx, yb - f1 + 3, dw, f1 - 3, fl ? '#ff8a3a' : '#ffa848'); R(dx + 2, yb - f1 + 5, dw - 4, f1 - 7, '#ffd070');
        // the little roof between the floors, tiles slipping
        R(x0 - 3, yb - f1 - 2, b.w + 6, 3, '#26222c'); for (let k = 0; k < b.w; k += 3) R(x0 + k, yb - f1 - 2, 1, 1, '#4a3a3a');
        // the upper floor: soot-stained plaster, a hole burned through it with the fire showing
        R(x0 + 2, top + 6, b.w - 4, b.h - f1 - 8, '#7a6a64'); R(x0 + 2, top + 6, 2, b.h - f1 - 8, '#9a8478');
        for (let k = 0; k < 4; k++) R(x0 + 4 + k * (b.w / 4), top + 6, b.w / 5, 3 + k % 2 * 2, '#3a2a2a');
        R(x0 + b.w * 0.25, top + 9, b.w * 0.3, b.h - f1 - 13, fl ? '#ffa040' : '#ff7a2a');
        // the main roof, sagging, tiles missing, its eave lit from below
        c.fillStyle = '#221e28'; c.beginPath(); c.moveTo((x0 - 5) * SS, (top + 7) * SS); c.lineTo((x0 + b.w + 5) * SS, (top + 7) * SS); c.lineTo((x0 + b.w - 3) * SS, (top - 2) * SS); c.lineTo((x0 + b.w * 0.5) * SS, (top + 1) * SS); c.lineTo((x0 + 3) * SS, (top - 2) * SS); c.closePath(); c.fill();
        for (let k = -3; k < b.w + 3; k += 2) R(x0 + k, top + 7, 1, 1, '#c8603a');
        R(x0 + b.w * 0.58, top + 1, 7, 5, '#ff7a2a');
        this.flameTongues(c, x0 + 2, top + 2, b.w - 4, Math.max(4, Math.round(b.w / 6)), 14, b.x);
        this.flameTongues(c, x0 + b.w * 0.25, top + b.h - f1 - 4, b.w * 0.3, 3, 6, b.x + 3);
      } else {
        this.fireGlow(c, x0 + b.w / 2, yb - 6, b.w * 0.9, 0.35);
        for (const ch of b.chunks) {
          c.save();
          c.translate(Math.round((ch.x - cam + ch.w / 2) * SS), Math.round((ch.y + ch.h / 2) * SS));
          c.rotate(ch.a);
          c.fillStyle = ch.col;
          c.fillRect(Math.round(-ch.w / 2 * SS), Math.round(-ch.h / 2 * SS), Math.round(ch.w * SS), Math.round(ch.h * SS));
          c.restore();
        }
        this.flameTongues(c, x0, yb - 1, b.w, Math.max(4, Math.round(b.w / 6)), b.state === 'down' ? 9 : 13, b.x);
      }
    }

    /** The airship coming down on fire, its explosion, and the wreck left burning where it fell. */
    drawCrash(c, cam) {
      const C = this.crash, off = cam * C.depth, u = C.s;
      const pos = (p) => [C.from[0] + (C.to[0] - C.from[0]) * p, C.from[1] + (C.to[1] - C.from[1]) * p * p];
      for (const s_ of C.smoke) { const x = s_.x - off; if (x < -40 || x > LW + 40) continue; c.fillStyle = `rgba(34,22,26,${(0.65 * (1 - s_.life / s_.max)).toFixed(3)})`; c.beginPath(); c.arc(x * SS, s_.y * SS, s_.r * SS, 0, Math.PI * 2); c.fill(); }
      const R = (x, y, w, hh, col) => { c.fillStyle = col; c.fillRect(Math.round(x * SS), Math.round(y * SS), Math.max(1, Math.round(w * SS)), Math.max(1, Math.round(hh * SS))); };
      if (C.state === 'fall') {
        const p = Math.min(1, C.t / C.dur), [x, y] = pos(p), [x2, y2] = pos(Math.min(1, p + 0.02));
        const sx = x - off, ang = Math.atan2(y2 - y, x2 - x);
        c.save();
        c.translate(sx * SS, y * SS); c.rotate(ang); c.translate(-sx * SS, -y * SS);
        this.drawAirship(c, sx, y, u, 1, true);
        this.fireGlow(c, sx - 4 * u, y - 4 * u, 34 * u, 0.45);
        this.flameTongues(c, sx - 30 * u, y - 5 * u, 44 * u, 11, 12 * u, 7);
        c.restore();
      } else if (C.state === 'wreck') {
        const sx = C.to[0] - off, y = C.to[1];
        if (C.boom < 0.14) { c.fillStyle = `rgba(255,210,160,${(0.45 * (1 - C.boom / 0.14)).toFixed(3)})`; c.fillRect(0, 0, LW * SS, LH * SS); }
        // the wreck: the airship driven nose-first into the ground, its skeleton rising at a slant, ribs
        // and girders lit by the fire inside, rags of its skin hanging, the tail fins high above the ruins
        const ang = C.lean, ca = Math.cos(ang), sa = Math.sin(ang), len = 64;
        const hw = (k) => 8.5 * u * Math.sqrt(Math.max(0, 1 - Math.pow((k + len / 2) / (len / 2), 2))) * (k > -14 ? 0.55 + 0.45 * (-k / 14) : 1);
        const at = (k, v) => [sx + k * u * ca - v * sa, y + k * u * sa + v * ca];
        this.fireGlow(c, ...at(-len * 0.45, 0), 50 * u, 0.5);
        c.save();
        c.translate(sx * SS, y * SS); c.rotate(ang);
        const Q = (x, yy, w, hh, col) => { c.fillStyle = col; c.fillRect(Math.round(x * SS), Math.round(yy * SS), Math.max(1, Math.round(w * SS)), Math.max(1, Math.round(hh * SS))); };
        for (let k = -len; k <= 2; k += 1) { const h_ = hw(k); Q(k * u, -h_, u, 1.2 * u, '#2e1a1c'); Q(k * u, -h_, u, 0.5 * u, '#e8884a'); Q(k * u, h_ - 1.2 * u, u, 1.2 * u, '#2e1a1c'); if (k % 2 === 0) Q(k * u, -0.6 * u, u, 1.2 * u, '#3a2020'); }
        for (let k = -len + 2; k <= 0; k += 5) { const h_ = hw(k); Q(k * u, -h_, 1.3 * u, h_ * 2, '#2e1a1c'); Q(k * u, -h_, 0.5 * u, h_ * 2, '#d06a3a'); }
        for (const [k, v, hh] of [[-50, -6, 7], [-36, -8, 9], [-22, -7, 6], [-10, -4, 5]]) { Q(k * u, v * u, 4 * u, hh * u, '#8a6a66'); Q(k * u, v * u, 4 * u, 0.8 * u, '#d0a89e'); Q((k + 1) * u, (v + hh) * u, 2 * u, 2 * u, '#6a4e4e'); }
        // the tail fins, still whole
        c.fillStyle = '#2e1a1c';
        c.beginPath(); c.moveTo((-len + 8) * u * SS, -hw(-len + 8) * SS); c.lineTo((-len - 6) * u * SS, -14 * u * SS); c.lineTo((-len - 2) * u * SS, -hw(-len + 3) * SS); c.closePath(); c.fill();
        c.beginPath(); c.moveTo((-len + 8) * u * SS, hw(-len + 8) * SS); c.lineTo((-len - 6) * u * SS, 14 * u * SS); c.lineTo((-len - 2) * u * SS, hw(-len + 3) * SS); c.closePath(); c.fill();
        Q((-len - 5) * u, -13 * u, 7 * u, 0.6 * u, '#e8884a');
        c.restore();
        // the gondola crushed at its foot, and fire all along the frame, climbing it
        R(sx - 16 * u, y - 4 * u, 14 * u, 4 * u, '#3a2422'); R(sx - 16 * u, y - 4 * u, 14 * u, 0.8 * u, '#a8603a');
        this.flameTongues(c, sx - 30 * u, y - 1, 44 * u, 10, 12 * u, 3);
        for (let k = -len + 6, i = 0; k < -4; k += 7, i++) { const [fx, fy] = at(k, -hw(k)); this.flameTongues(c, fx - 4 * u, fy + 2 * u, 8 * u, 3, (6 + (i % 3) * 3) * u, i * 7); }
        if (C.boom < 1.2) {
          const k = C.boom / 1.2;
          c.fillStyle = `rgba(255,240,190,${(0.95 * (1 - k)).toFixed(2)})`; c.beginPath(); c.arc(sx * SS, (y - 10 * u) * SS, (8 + k * 36) * u * SS, 0, Math.PI * 2); c.fill();
          c.fillStyle = `rgba(255,120,40,${(0.85 * (1 - k)).toFixed(2)})`; c.beginPath(); c.arc(sx * SS, (y - 8 * u) * SS, (5 + k * 24) * u * SS, 0, Math.PI * 2); c.fill();
        }
      }
      for (const s_ of C.sparks) { const x = s_.x - off; R(x, s_.y, 1, 1, s_.life < 0.3 ? '#fff0a0' : '#ff8a3a'); }
    }

    /** A band of fog, drifting on the wind at its own distance. */
    drawFogBand(c, f, cam) {
      const tw = 320, off = (((cam * (f.z == null ? 1 : f.z)) + this.t * (this.reduce ? 0 : f.speed || 4)) % tw + tw) % tw;
      c.save();
      c.globalAlpha = f.alpha || 0.4;
      for (let x = -off; x < LW; x += tw) c.drawImage(f.tex, Math.round(x * SS), Math.round((f.y - f.h / 2) * SS));
      c.restore();
    }

    stepRange(dt) {
      const rg = this.range;
      if (!rg) return;
      // arrows in flight, and the ones stuck in the targets
      for (const a of rg.arrows || []) {
        a.t += dt;
        if (a.t >= a.dur && !a.hit) {
          a.hit = true;
          (rg.stuck || (rg.stuck = [])).push({ x: a.tx, y: a.ty, life: 3 });
          this.puffs.push({ x: a.tx, y: a.ty, vx: rnd(-2, 2), vy: -rnd(2, 5), r: 0.8, grow: 1.6, age: 0, life: 0.7, col: '200,180,150', a: 0.6 });
          const d = Math.abs(this.x - a.tx);
          if (d < 280 && !this.done) this.audio.fx('thud', { volume: 0.2 * (1 - d / 280) });
        }
      }
      if (rg.arrows) rg.arrows = rg.arrows.filter((a) => !a.hit);
      if (rg.stuck) { for (const s_ of rg.stuck) s_.life -= dt; rg.stuck = rg.stuck.filter((s_) => s_.life > 0); }
      rg.t -= dt;
      rg.flash = Math.max(0, rg.flash - dt);
      if (rg.t > 0) return;
      if (rg.aim < 0) { rg.aim = rg.k % rg.x.length; rg.t = rnd(0.6, 0.9); return; }
      const sx = rg.x[rg.aim], tx = rg.targets[rg.aim % rg.targets.length], my = rg.y - 14;
      if (rg.kind === 'bow') {
        // the string let go: the arrow flies to the target
        (rg.arrows || (rg.arrows = [])).push({ x: sx + 12, y: my, tx: tx - 3, ty: rg.ty + rnd(-2, 2), t: 0, dur: Math.max(0.2, (tx - sx) / 300) });
        const d = Math.abs(this.x - sx);
        if (d < 280 && !this.done) this.audio.fx('whoosh', { volume: 0.12 * (1 - d / 280) });
        rg.fired = rg.aim; rg.flash = 0; rg.k++; rg.aim = -1;
        rg.t = rg.k % rg.x.length === 0 ? rnd(rg.pause[0], rg.pause[1]) : rnd(rg.period[0], rg.period[1]);
        return;
      }
      // bang: a flash at the muzzle, smoke drifting off, dust thrown up at the target
      rg.flash = 0.09; rg.fired = rg.aim;
      for (let i = 0; i < 3; i++) this.puffs.push({ x: sx + 16 + i * 2, y: my + rnd(-1, 1), vx: rnd(6, 12), vy: -rnd(1, 4), r: rnd(1.2, 2), grow: rnd(2.5, 4), age: 0, life: rnd(1.4, 2.2), col: '240,232,236', a: 0.7 });
      for (let i = 0; i < 2; i++) this.puffs.push({ x: tx + rnd(-3, 3), y: rg.ty + rnd(-3, 3), vx: rnd(-3, 3), vy: -rnd(3, 7), r: 1, grow: rnd(2, 3), age: 0, life: rnd(0.8, 1.2), col: '176,146,112', a: 0.7 });
      const d = Math.abs(this.x - sx);
      if (d < 320 && !this.done) this.audio.fx('musket', { volume: 0.35 * (1 - d / 320) });
      rg.k++;
      rg.aim = -1;
      rg.t = rg.k % rg.x.length === 0 ? rnd(rg.pause[0], rg.pause[1]) : rnd(rg.period[0], rg.period[1]);
    }

    drawRange(c, cam) {
      const rg = this.range;
      if (!rg) return;
      rg.x.forEach((x, i) => {
        const aiming = rg.aim === i || (rg.fired === i && rg.flash > 0);
        this.figure(c, LOOKS[rg.look || 'rifleman'], x - cam, rg.y, 1, this.t + i, false, aiming ? (rg.kind === 'bow' ? 'draw' : 'aim') : null);
      });
      const D = (x, y, col) => { c.fillStyle = col; c.fillRect(Math.round(x * SS), Math.round(y * SS), SS, SS); };
      for (const a of rg.arrows || []) {
        const p = Math.min(1, a.t / a.dur), x = a.x + (a.tx - a.x) * p - cam, y = a.y + (a.ty - a.y) * p - Math.sin(Math.PI * p) * 5;
        for (let k = 0; k < 7; k++) D(x - k, y + (k > 4 ? (k % 2 ? -1 : 1) : 0), k === 0 ? '#d0d0d8' : k > 4 ? '#f0ece4' : '#8a6a4a');
      }
      for (const s_ of rg.stuck || []) for (let k = 0; k < 5; k++) D(s_.x - k - cam, s_.y, k > 2 ? '#f0ece4' : '#8a6a4a');
      if (rg.flash > 0 && rg.fired >= 0) {
        const mx = rg.x[rg.fired] + 15 - cam, my = rg.y - 14;
        const D = (dx, dy, col) => { c.fillStyle = col; c.fillRect(Math.round((mx + dx) * SS), Math.round((my + dy) * SS), SS, SS); };
        D(0, 0, '#fffbe8'); D(1, 0, '#ffe08a'); D(2, 0, '#ffb040'); D(1, -1, '#ffd070'); D(1, 1, '#ffd070'); D(3, 0, '#ff8a3a');
      }
    }

    /** A windmill's four sails, lattice and canvas, turning in the wind far off. */
    drawSails(c, m, cam) {
      const x = m.x - cam * m.depth, R = m.r || 14;
      if (x < -R - 4 || x > LW + R + 4) return;
      const a0 = this.t * (m.speed || 0.6) + (m.ph || 0);
      const D = (px_, py, col) => { c.fillStyle = col; c.fillRect(Math.round(px_ * SS), Math.round(py * SS), SS, SS); };
      for (let k = 0; k < 4; k++) {
        const q = a0 + k * Math.PI / 2, dx = Math.cos(q), dy = Math.sin(q), nx = -dy, ny = dx, w = R * 0.3;
        const cloth = k % 2 ? '#d8ceb8' : '#f0e8d4';
        for (let d = R * 0.22; d <= R; d += 0.6) for (let e = 0; e <= w; e += 0.6) D(x + dx * d + nx * e, m.y + dy * d + ny * e, cloth);
        for (let d = R * 0.22; d <= R + 0.1; d += R * 0.195) for (let e = 0; e <= w; e += 0.6) D(x + dx * d + nx * e, m.y + dy * d + ny * e, '#6a4a34');
        for (let d = R * 0.22; d <= R; d += 0.6) D(x + dx * d + nx * w, m.y + dy * d + ny * w, '#6a4a34');
        for (let d = 0; d <= R; d += 0.6) D(x + dx * d, m.y + dy * d, '#4a3424');
      }
      D(x - 0.5, m.y - 0.5, '#2a1e14');
    }

    /** A lighthouse's lamp turning: its beam swings out to one side and back, foreshortening as it
     *  comes round, and the lamp flares when the beam faces us. */
    drawBeacon(c, b, cam) {
      const x = b.x - cam * b.depth, y = b.y;
      if (x < -140 || x > LW + 140) return;
      const a = this.t * (b.speed || 0.8) + (b.ph || 0), side = Math.cos(a), face = Math.sin(a);
      const len = (b.reach || 120) * Math.abs(side), dir = Math.sign(side);
      c.save();
      c.globalCompositeOperation = 'lighter';
      if (len > 6) {
        const g = c.createLinearGradient(x * SS, 0, (x + dir * len) * SS, 0);
        g.addColorStop(0, `rgba(255,242,200,${(b.strength || 0.3).toFixed(2)})`);
        g.addColorStop(1, 'rgba(255,242,200,0)');
        c.fillStyle = g;
        c.beginPath();
        c.moveTo(x * SS, (y - 1.5) * SS); c.lineTo((x + dir * len) * SS, (y - 9) * SS); c.lineTo((x + dir * len) * SS, (y + 9) * SS); c.lineTo(x * SS, (y + 1.5) * SS);
        c.closePath(); c.fill();
      }
      const k = Math.pow(Math.max(0, face), 5);
      const D = (dx, dy, al) => { c.fillStyle = `rgba(255,246,210,${al.toFixed(2)})`; c.fillRect(Math.round((x + dx) * SS), Math.round((y + dy) * SS), SS, SS); };
      D(0, 0, 0.5 + 0.5 * k);
      if (k > 0.05) { const n = Math.round(2 + k * 6); for (let i = 1; i <= n; i++) { const al = k * (1 - i / (n + 1)); D(i, 0, al); D(-i, 0, al); D(0, i * 0.6, al * 0.7); D(0, -i * 0.6, al * 0.7); } }
      c.restore();
    }

    /** A glint of sun on a spire or a gilded finial: a little star that flares and fades. */
    drawSparkle(c, s, cam) {
      const x = s.x - cam * s.depth;
      if (x < -6 || x > LW + 6) return;
      const k = Math.pow(Math.max(0, Math.sin(this.t * (s.speed || 1.1) + s.ph)), 8);
      if (k < 0.05) return;
      const D = (dx, dy, a) => { c.fillStyle = `rgba(255,250,225,${a.toFixed(2)})`; c.fillRect(Math.round((x + dx) * SS), Math.round((s.y + dy) * SS), SS, SS); };
      D(0, 0, k);
      const n = Math.round(1 + k * (s.size || 3));
      for (let i = 1; i <= n; i++) { const a = k * (1 - i / (n + 1)); D(i, 0, a); D(-i, 0, a); D(0, i, a); D(0, -i, a); }
    }

    drawWheel(c, w, cam) {
      const x = w.x - cam;
      if (x < -40 || x > LW + 40) return;
      const r = w.r || 14, a0 = this.t * (w.speed || 0.8);
      const D = (px_, py, sz, col) => { c.fillStyle = col; c.fillRect(Math.round((px_ - sz / 2) * SS), Math.round((py - sz / 2) * SS), Math.round(sz * SS), Math.round(sz * SS)); };
      for (let i = 0; i < 56; i++) { const a = (i / 56) * Math.PI * 2; D(x + Math.cos(a) * r, w.y + Math.sin(a) * r, 1.5, '#6a4a30'); }
      for (let k = 0; k < 10; k++) {
        const a = a0 + (k / 10) * Math.PI * 2;
        for (let d = 2; d < r; d += 1) D(x + Math.cos(a) * d, w.y + Math.sin(a) * d, 1, '#8a6a44');
        const px_ = x + Math.cos(a) * (r + 1.5), py = w.y + Math.sin(a) * (r + 1.5);
        D(px_, py, 3, '#5a3a24');
        if (py > WY - 1 && !this.reduce) D(px_ + rnd(-2, 2), WY + rnd(-3, 0), 1, 'rgba(255,255,255,0.8)');
      }
      D(x, w.y, 4, '#3a2a1e');
    }

    /** Somewhere to hide: a charred wall, a heap of rubble, sandbags, an overturned cart. */
    drawCover(c, cv, cam) {
      const x0 = cv.x0 - cam, x1 = cv.x1 - cam;
      if (x1 < -10 || x0 > LW + 10) return;
      const R = (x, y, w, hh, col) => { c.fillStyle = col; c.fillRect(Math.round(x * SS), Math.round(y * SS), Math.round(w * SS), Math.round(hh * SS)); };
      const w = x1 - x0, kind = cv.kind || 'wall';
      if (kind === 'wall') {
        R(x0, GY - 16, w, 16, '#2a1c1a');
        for (let x = 0; x < w; x += 5) R(x0 + x, GY - 16 - ((x * 7) % 4), 5, 4, '#2a1c1a');
        R(x0, GY - 16, w, 1, '#6a4a3a');
        for (let x = 3; x < w; x += 9) R(x0 + x, GY - 10, 1, 8, '#1a1010');
      } else if (kind === 'sandbags') {
        for (let j = 0; j < 3; j++) for (let x = 0; x < w; x += 7) R(x0 + x + (j % 2) * 3, GY - 5 - j * 5, 6, 5, j % 2 ? '#8a7a58' : '#a8966a');
      } else if (kind === 'cart') {
        R(x0, GY - 14, w, 10, '#4a3020'); R(x0, GY - 14, w, 1, '#7a5234');
        c.fillStyle = '#2a1a10'; c.beginPath(); c.arc((x0 + w * 0.3) * SS, (GY - 4) * SS, 5 * SS, 0, Math.PI * 2); c.fill();
      } else {
        for (let k = 0; k < w / 3; k++) R(x0 + ((k * 13) % w), GY - 4 - ((k * 7) % 12), 6, 5, k % 3 ? '#3a2a24' : '#5a4034');
        R(x0 - 2, GY - 13, w + 4, 2, '#2a1a14');
      }
    }

    /** A soldier with a lantern, and the light it throws along the road. */
    drawPatrol(c, p, cam) {
      const x = p.x - cam;
      if (x < -120 || x > LW + 120) return;
      const len = p.reach || 92, lx = x + p.dir * 5, ly = GY - 12;
      c.save();
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(lx * SS, ly * SS, 2, lx * SS, ly * SS, len * SS);
      g.addColorStop(0, 'rgba(255,214,130,0.42)');
      g.addColorStop(0.6, 'rgba(255,190,100,0.16)');
      g.addColorStop(1, 'rgba(255,170,80,0)');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(lx * SS, ly * SS);
      c.lineTo((lx + p.dir * len) * SS, (GY - 38) * SS);
      c.lineTo((lx + p.dir * len) * SS, (GY + 5) * SS);
      c.closePath();
      c.fill();
      c.restore();
      c.save();
      c.translate(Math.round(x * SS), GY * SS);
      c.scale(SS * p.dir, SS);
      drawPerson(c, p.look, this.t, p.wait <= 0, false);
      c.restore();
    }

    /** The chase: what lies ahead on the road, and the riders behind. */
    drawChase(c, cam, front) {
      const ch = this.chase;
      const R = (x, y, w, hh, col) => { c.fillStyle = col; c.fillRect(Math.round(x * SS), Math.round(y * SS), Math.round(w * SS), Math.round(hh * SS)); };
      if (!front) {
        for (let i = 0; i < 2; i++) {
          const x = this.x - ch.gap - i * 24 - cam;
          if (x < -30 || x > LW + 30) continue;
          c.save();
          c.translate(Math.round(x * SS), GY * SS);
          c.scale(SS, SS);
          drawHorse(c, this.t + i * 0.37, true, true, LOOKS.bandit);
          c.restore();
        }
        return;
      }
      for (const o of ch.obstacles) {
        const x = o.x - cam;
        if (x < -20 || x > LW + 20) continue;
        if (o.kind === 'log') { R(x - 9, GY - 6, 18, 6, '#4a3020'); R(x - 9, GY - 6, 18, 1, '#7a5234'); R(x + 7, GY - 6, 3, 6, '#c8a878'); }
        else if (o.kind === 'rock') { R(x - 7, GY - 7, 14, 7, '#5a5660'); R(x - 5, GY - 9, 9, 3, '#7a7680'); R(x - 5, GY - 9, 4, 1, '#9a96a0'); }
        else {
          R(x - 1, GY - 70, 3, 36, '#2a1e14');
          R(x - 12, GY - 38, 26, 3, '#2a1e14');
          for (let k = 0; k < 6; k++) R(x - 12 + k * 5, GY - 42 + (k % 2) * 2, 5, 4, k % 2 ? '#3a5a2a' : '#4a6a34');
        }
      }
    }

    /** Where a shell is about to land: a shadow that grows, then a streak from the sky. */
    drawShadows(c, cam) {
      const sh = this.shelling;
      if (!sh) return;
      for (const s of sh.list) {
        const x = s.x - cam, k = Math.min(1, s.t / 1.3);
        c.globalAlpha = 0.2 + k * 0.4;
        c.fillStyle = '#100808';
        c.beginPath();
        c.ellipse(x * SS, GY * SS, (4 + k * 14) * SS, (1 + k * 2.5) * SS, 0, 0, Math.PI * 2);
        c.fill();
        if (s.t > 1.0) { c.globalAlpha = 0.9; c.fillStyle = '#1a1414'; const y = GY - (1.3 - s.t) * 400; c.fillRect(Math.round(x * SS), Math.round(y * SS), 2 * SS, 3 * SS); }
        c.globalAlpha = 1;
      }
    }

    drawParts(c, cam) {
      for (let z = 0; z < 3; z++) {
        for (const b of this.parts) {
          if (b.z !== z) continue;
          const k = 1 - b.age / b.life;
          c.globalAlpha = (b.a == null ? 1 : b.a) * k;
          c.fillStyle = b.col;
          const x = b.x - cam;
          if (b.r) {
            const R = Math.max(1, b.r), n = Math.floor(R);
            for (let dy = -n; dy <= n; dy++) { const w = Math.floor(Math.sqrt(R * R - dy * dy)); c.fillRect(Math.round((x - w) * SS), Math.round((b.y + dy) * SS), (w * 2 + 1) * SS, SS); }
            if (b.hi && R > 3) { c.fillStyle = b.hi; const r2 = R * 0.5, m = Math.floor(r2); for (let dy = -m; dy <= m; dy++) { const w = Math.floor(Math.sqrt(r2 * r2 - dy * dy)); c.fillRect(Math.round((x - R * 0.3 - w) * SS), Math.round((b.y - R * 0.3 + dy) * SS), (w * 2 + 1) * SS, SS); } }
          } else c.fillRect(Math.round(x * SS), Math.round(b.y * SS), (b.s || 1) * SS, (b.s || 1) * SS);
        }
      }
      c.globalAlpha = 1;
    }

    layer(c, l, cam) {
      if (!l.img) return;
      let x = l.x - l.depth * cam;
      if (l.anim && l.anim.type === 'drift') {
        const span = Math.max(l.w, LW);
        x = ((l.x - l.depth * cam - (this.t * span) / (l.anim.t || 200)) % span + span) % span - span;
        c.drawImage(l.img, Math.round(x * SS), l.y * SS, l.w * SS, l.h * SS);
        c.drawImage(l.img, Math.round((x + span) * SS), l.y * SS, l.w * SS, l.h * SS);
        return;
      }
      if (l.anim && l.anim.type === 'sway' && !this.reduce) x += Math.sin(this.t * (6.28 / (l.anim.t || 4))) * 0.8;
      if (x > LW || x + l.w < 0) return;
      // something afloat rides the water, rising and settling
      const dy = l.anim && l.anim.type === 'bob' && !this.reduce ? Math.round(Math.sin(this.t * (6.28 / (l.anim.t || 5))) * (l.anim.a || 1) * SS) : 0;
      // only the part on screen
      const dx = Math.round(x * SS);
      const sx = Math.max(0, -dx);
      const sw = Math.min(l.img.width - sx, LW * SS - Math.max(0, dx));
      if (sw > 0) c.drawImage(l.img, sx, 0, sw, l.img.height, Math.max(0, dx), l.y * SS + dy, sw, l.img.height);
    }

    thing(c, th, cam) {
      const x = th.x - cam;
      if (x < -30 || x > LW + 30) return;
      const t = this.t + th.bob;
      if (th.look && LOOKS[th.look] && !(th.kind === 'item' && th.used)) {
        c.save();
        c.translate(Math.round(x * SS), GY * SS);
        const face = th.facing || (this.x > th.x ? 1 : -1);
        c.scale(SS * face, SS);
        if (th.ride) drawHorse(c, t, false, false, LOOKS[th.look]);
        else drawPerson(c, LOOKS[th.look], t, !!th.pace, false, false, th.nearPose && Math.abs(this.x - th.x) < (th.nearAt || 100) ? th.nearPose : th.pose || null);
        c.restore();
      }
      if (th.used && th.kind !== 'talk' && th.kind !== 'look') return;
      const glint = 0.5 + 0.5 * Math.sin(t * 4);
      if (th.kind === 'coin') {
        const y = GY - 4 - Math.round(Math.abs(Math.sin(t * 2)) * 2);
        c.fillStyle = '#8a5a1a'; c.fillRect((x - 2) * SS, y * SS, 5 * SS, 3 * SS);
        c.fillStyle = '#f3c542'; c.fillRect((x - 2) * SS, (y - 1) * SS, 5 * SS, 2 * SS);
        c.fillStyle = `rgba(255,255,220,${glint})`; c.fillRect((x + 1) * SS, (y - 2) * SS, SS, SS);
      } else if (th.kind === 'item' || th.kind === 'goal' || (th.kind === 'look' && !th.used)) {
        // a soft shimmer marks something worth a look
        const y = GY - (th.kind === 'goal' ? 30 : 12) - Math.sin(t * 2) * 2;
        const g = c.createRadialGradient(x * SS, y * SS, 0, x * SS, y * SS, (th.kind === 'goal' ? 18 : 7) * SS);
        const col = th.kind === 'goal' ? (this.def.accent || '255,214,140') : th.kind === 'item' ? '255,236,190' : '220,230,255';
        g.addColorStop(0, `rgba(${col},${0.55 + glint * 0.35})`);
        g.addColorStop(1, `rgba(${col},0)`);
        c.fillStyle = g;
        c.fillRect((x - 20) * SS, (y - 20) * SS, 40 * SS, 40 * SS);
        if (th.kind === 'goal') { c.fillStyle = `rgba(${col},0.18)`; c.fillRect((x - 1) * SS, (GY - 90) * SS, 3 * SS, 90 * SS); }
        c.fillStyle = `rgba(255,255,255,${0.6 + glint * 0.4})`;
        c.fillRect(x * SS, y * SS, SS, SS);
      }
    }

    water(c) {
      const top = WY * SS, rows = (LH - WY) * SS;
      const [c0, c1] = this.def.water || ['rgba(40,60,90,0.55)', 'rgba(10,16,30,0.85)'];
      // mirror the band just above the waterline, row by row, with a travelling ripple
      const m = this.mc;
      m.save();
      m.clearRect(0, 0, LW * SS, rows);
      m.translate(0, rows);
      m.scale(1, -1);
      m.drawImage(this.buf, 0, top - rows, LW * SS, rows, 0, 0, LW * SS, rows);
      m.restore();
      if (this.reduce) c.drawImage(this.mirror, 0, top);
      else {
        for (let r = 0; r < rows; r += SS * 2) {
          const depth = r / rows;
          const dx = Math.round(Math.sin(r * 0.21 + this.t * 2.4) * (1 + depth * 3) * SS * 0.6);
          c.drawImage(this.mirror, 0, r, LW * SS, SS * 2, dx, top + r, LW * SS, SS * 2);
        }
      }
      const g = c.createLinearGradient(0, top, 0, LH * SS);
      g.addColorStop(0, c0);
      g.addColorStop(1, c1);
      c.fillStyle = g;
      c.fillRect(0, top, LW * SS, rows);
      // glints on the surface
      if (!this.reduce) {
        c.fillStyle = 'rgba(255,255,255,0.25)';
        for (let i = 0; i < 26; i++) {
          const gx = ((i * 97 + this.t * (8 + (i % 5) * 3) - this.camX * 0.9) % LW + LW) % LW;
          const gy = WY + 3 + ((i * 37) % (LH - WY - 6));
          c.fillRect(gx * SS, gy * SS, (3 + (i % 4) * 2) * SS, SS / 2);
        }
      }
    }

    finish(how) {
      if (this.done) return;
      this.done = true;
      this.stop();
      this.el.classList.add('leaving');
      setTimeout(() => {
        if (this.ui.cardEntry === this.entry) this.ui.cardEntry = null;
        this.ui.close(this.entry);
        this.resolve({ how, picked: this.picked });
      }, 700);
    }

    stop() {
      this.done = true;
      if (VN.currentWalk === this) VN.currentWalk = null;
      cancelAnimationFrame(this.raf);
      if (this.typer) this.typer.destroy();
      document.removeEventListener('keyup', this.onUp);
      window.removeEventListener('pointerup', this.onRelease);
      window.removeEventListener('resize', this.onResize);
    }
  }

  /** Play a walking area; resolves with { how: 'arrived' | 'skipped', picked: [...] }. */
  VN.playWalk = function (ctx, name) {
    const def = (globalThis.VN_WALKS || {})[name];
    const scenery = (globalThis.VN_WALKSCENERY || {})[def ? def.scene || name : name];
    if (!def || !scenery) return Promise.resolve({ how: 'missing', picked: [] });
    return new Walk(ctx, def, scenery).start();
  };
  VN.WALK_LOOKS = LOOKS;
})();
