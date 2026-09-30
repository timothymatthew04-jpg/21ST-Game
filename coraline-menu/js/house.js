// The Pink Palace: a tall, tired Victorian in faded pink with a corner turret, a front gable,
// a sagging porch and slate roofs. A few rooms are lit; Coraline's parents stand in two of them.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { worldUV } from './util.js';
import { windowRoom } from './textures.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// A slab spanning edge vectors u and v from `origin`, `t` thick, textured in metres.
function slab(origin, u, v, t, uvScale) {
  const lu = u.length(), lv = v.length();
  const g = new THREE.BoxGeometry(lu, lv, t);
  g.translate(lu / 2, lv / 2, -t / 2);
  worldUV(g, uvScale);
  const xu = u.clone().normalize(), xv = v.clone().normalize();
  const xn = new THREE.Vector3().crossVectors(xu, xv).normalize();
  g.applyMatrix4(new THREE.Matrix4().makeBasis(xu, xv, xn).setPosition(origin));
  return g;
}

function box(w, h, d, x, y, z, uvScale = 4) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return worldUV(g, uvScale);
}

function triangle(base, height, depth, uvScale) {
  const s = new THREE.Shape();
  s.moveTo(-base / 2, 0); s.lineTo(base / 2, 0); s.lineTo(0, height); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
  g.translate(0, 0, -depth);
  g.computeVertexNormals();
  return worldUV(g, uvScale);
}

export function createHouse(tx) {
  const house = new THREE.Group();
  const parts = { siding: [], fish: [], roof: [], trim: [], stone: [], dark: [], brick: [] };
  const lights = [];
  const windows = [];

  const G = 0.9;       // floor level above the foundation
  const E = 9.2;       // eave height
  const RIDGE = 14.4;  // main ridge
  const W = 9, D = 8;

  // foundation and main block
  parts.stone.push(box(W + 0.4, G, D + 0.4, 0, G / 2, 0, 1.6));
  parts.siding.push(box(W, E - G, D, 0, (E + G) / 2, 0));
  // corner boards and the frieze under the eaves
  for (const [x, z] of [[-W / 2, D / 2], [W / 2, D / 2], [-W / 2, -D / 2], [W / 2, -D / 2]]) {
    parts.trim.push(box(0.22, E - G, 0.22, x, (E + G) / 2, z, 2));
  }
  parts.trim.push(box(W + 0.12, 0.35, D + 0.12, 0, E - 0.18, 0, 2));
  parts.trim.push(box(W + 0.1, 0.12, D + 0.1, 0, 4.1, 0, 2));
  parts.trim.push(box(W + 0.1, 0.12, D + 0.1, 0, 7.1, 0, 2));

  // main gable roof, ridge running left to right, with deep overhangs
  const oh = 0.6;
  const run = D / 2 + oh, rise = (RIDGE - E) * (run / (D / 2));
  parts.roof.push(slab(V(-W / 2 - oh, RIDGE, 0), V(W + 2 * oh, 0, 0), V(0, -rise, run), 0.18, 3));
  parts.roof.push(slab(V(W / 2 + oh, RIDGE, 0), V(-W - 2 * oh, 0, 0), V(0, -rise, -run), 0.18, 3));
  parts.trim.push(box(W + 2 * oh + 0.1, 0.16, 0.2, 0, RIDGE + 0.06, 0, 2));
  for (const side of [-1, 1]) {
    const tri = triangle(D, RIDGE - E, 0.2, 2);
    tri.rotateY(side * Math.PI / 2);
    tri.translate(side * W / 2, E, 0);
    parts.fish.push(tri);
  }

  // front wing with its own tall gable
  const wx0 = 0.6, wx1 = W / 2, wz = D / 2 + 1.6, wcx = (wx0 + wx1) / 2, ww = wx1 - wx0;
  const WR = 13.2;
  parts.stone.push(box(ww + 0.3, G, 1.8, wcx, G / 2, D / 2 + 0.8, 1.6));
  parts.siding.push(box(ww, E - G, 1.8, wcx, (E + G) / 2, D / 2 + 0.7));
  parts.trim.push(box(0.22, E - G, 0.22, wx0, (E + G) / 2, wz - 0.05, 2));
  parts.trim.push(box(0.22, E - G, 0.22, wx1, (E + G) / 2, wz - 0.05, 2));
  parts.trim.push(box(ww + 0.12, 0.35, 1.9, wcx, E - 0.18, D / 2 + 0.7, 2));
  const wtri = triangle(ww, WR - E, 0.2, 2);
  wtri.translate(wcx, E, wz);
  parts.fish.push(wtri);
  const wrun = ww / 2 + 0.45, wrise = (WR - E) * (wrun / (ww / 2));
  const wlen = D / 2 + 1.6 + 0.5 + 1.0;
  parts.roof.push(slab(V(wcx, WR, wz + 0.5), V(0, 0, -wlen), V(-wrun, -wrise, 0), 0.18, 3));
  parts.roof.push(slab(V(wcx, WR, wz + 0.5 - wlen), V(0, 0, wlen), V(wrun, -wrise, 0), 0.18, 3));
  // bargeboards and a spiked finial on the gable
  for (const s of [-1, 1]) {
    const bb = slab(V(wcx, WR + 0.02, wz + 0.52), V(s * wrun, -wrise, 0), V(0, 0, -0.08), 0.32, 2);
    parts.trim.push(bb);
  }
  const fin = new THREE.ConeGeometry(0.07, 1.3, 6);
  fin.translate(wcx, WR + 0.65, wz + 0.45);
  parts.dark.push(fin);

  // the corner turret
  const TX = -W / 2 + 0.2, TZ = D / 2 - 0.1, TR = 1.75, TTOP = 11.6;
  const tower = new THREE.CylinderGeometry(TR, TR, TTOP - G, 8, 1);
  tower.rotateY(Math.PI / 8);
  tower.translate(TX, (TTOP + G) / 2, TZ);
  parts.siding.push(worldUV(tower, 4));
  const tbase = new THREE.CylinderGeometry(TR + 0.2, TR + 0.2, G, 8);
  tbase.rotateY(Math.PI / 8);
  tbase.translate(TX, G / 2, TZ);
  parts.stone.push(worldUV(tbase, 1.6));
  for (const y of [4.1, 7.1, TTOP - 0.2]) {
    const band = new THREE.CylinderGeometry(TR + 0.06, TR + 0.06, y > 10 ? 0.4 : 0.12, 8);
    band.rotateY(Math.PI / 8);
    band.translate(TX, y, TZ);
    parts.trim.push(worldUV(band, 2));
  }
  const troof = new THREE.ConeGeometry(TR + 0.45, 5.4, 8, 6);
  troof.rotateY(Math.PI / 8);
  troof.translate(TX, TTOP + 2.7, TZ);
  parts.roof.push(worldUV(troof, 3));
  const tfin = new THREE.ConeGeometry(0.06, 1.8, 6);
  tfin.translate(TX, TTOP + 5.4 + 0.8, TZ);
  parts.dark.push(tfin);
  const tball = new THREE.SphereGeometry(0.14, 8, 6);
  tball.translate(TX, TTOP + 5.45, TZ);
  parts.dark.push(tball);

  // the porch between turret and wing
  const px0 = TX + TR - 0.1, px1 = wx0, pz = D / 2 + 2.3;
  parts.stone.push(box(px1 - px0, G, pz - D / 2, (px0 + px1) / 2, G / 2, (D / 2 + pz) / 2, 1.6));
  const cols = [px0 + 0.15, (px0 + px1) / 2, px1 - 0.15];
  for (const x of cols) parts.trim.push(box(0.2, 3.0, 0.2, x, G + 1.5, pz - 0.15, 2));
  parts.roof.push(slab(V(px0 - 0.2, 4.35, D / 2), V(px1 - px0 + 0.4, 0, 0), V(0, -0.55, pz - D / 2 + 0.35), 0.14, 3));
  parts.trim.push(box(px1 - px0, 0.3, 0.12, (px0 + px1) / 2, G + 2.9, pz - 0.12, 2));
  parts.trim.push(box(px1 - px0, 0.08, 0.08, (px0 + px1) / 2, G + 0.95, pz - 0.15, 2));
  for (let x = px0 + 0.3; x < px1 - 0.2; x += 0.22) {
    if (Math.abs(x - (px0 + px1) / 2) < 0.6) continue; // the opening to the steps
    parts.trim.push(box(0.05, 0.9, 0.05, x, G + 0.5, pz - 0.15, 2));
  }
  for (let i = 0; i < 3; i++) {
    parts.stone.push(box(1.6, 0.3, 0.4, (px0 + px1) / 2, G - 0.15 - i * 0.3, pz + 0.2 + i * 0.4, 1.6));
  }

  // a dormer on the front slope, over the porch
  const dx = -1.4, dz = 2.3, dy = RIDGE - rise * ((dz + 0.6) / run) - 0.2;
  parts.siding.push(box(1.5, 1.8, 2.4, dx, dy + 0.9, dz - 0.6));
  const dtri = triangle(1.5, 0.9, 2.6, 2);
  dtri.translate(dx, dy + 1.8, dz + 0.65);
  parts.fish.push(dtri);
  parts.roof.push(slab(V(dx, dy + 2.75, dz + 0.8), V(0, 0, -2.8), V(-0.95, -1.0, 0), 0.12, 3));
  parts.roof.push(slab(V(dx, dy + 2.75, dz + 0.8 - 2.8), V(0, 0, 2.8), V(0.95, -1.0, 0), 0.12, 3));

  // chimneys
  for (const [x, z, h] of [[-2.8, -1.4, 16.2], [3.2, -2.2, 16.6]]) {
    parts.brick.push(box(0.9, h - 11, 0.9, x, (h + 11) / 2, z, 1.2));
    parts.brick.push(box(1.1, 0.25, 1.1, x, h, z, 1.2));
  }

  // windows ---------------------------------------------------------------
  const litMats = new Map();
  const roomMat = (kind, seed) => {
    const key = kind + seed;
    if (!litMats.has(key)) {
      litMats.set(key, new THREE.MeshBasicMaterial({ map: windowRoom(kind, seed), color: new THREE.Color(2.4, 2.1, 1.7) }));
    }
    return litMats.get(key);
  };
  const darkGlass = new THREE.MeshStandardMaterial({ color: 0x05070d, roughness: 0.12, metalness: 0.2, emissive: 0x070b18 });

  // Place a window on a wall: `frame` gives the wall's position and outward direction.
  function addWindow(frame, u, y, w, h, kind, seed = 1) {
    const g = new THREE.Group();
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), kind ? roomMat(kind, seed) : darkGlass);
    pane.position.z = 0.03;
    g.add(pane);
    const t = 0.1, trimGeos = [];
    trimGeos.push(box(w + 2 * t, t, 0.1, 0, h / 2 + t / 2, 0.06, 2));
    trimGeos.push(box(w + 2 * t, t, 0.1, 0, -h / 2 - t / 2, 0.06, 2));
    trimGeos.push(box(t, h, 0.1, -w / 2 - t / 2, 0, 0.06, 2));
    trimGeos.push(box(t, h, 0.1, w / 2 + t / 2, 0, 0.06, 2));
    trimGeos.push(box(w + 0.45, 0.08, 0.22, 0, -h / 2 - t - 0.04, 0.1, 2)); // sill
    trimGeos.push(box(w + 0.5, 0.16, 0.16, 0, h / 2 + t + 0.1, 0.08, 2));  // cap
    const capTri = triangle(w + 0.5, 0.32, 0.12, 2);
    capTri.translate(0, h / 2 + t + 0.18, 0.14);
    trimGeos.push(capTri);
    trimGeos.push(box(0.04, h, 0.04, 0, 0, 0.06, 2)); // muntins
    trimGeos.push(box(w, 0.05, 0.05, 0, 0.02, 0.06, 2));
    const trimMesh = new THREE.Mesh(mergeGeometries(trimGeos.map((q) => (q.index ? q.toNonIndexed() : q))), trimMat);
    trimMesh.castShadow = true;
    g.add(trimMesh);
    g.position.copy(frame.origin).addScaledVector(frame.along, u);
    g.position.y = y;
    g.rotation.y = Math.atan2(frame.out.x, frame.out.z);
    house.add(g);
    windows.push({ group: g, pane, kind });
    if (kind) {
      const l = new THREE.PointLight(0xffa850, 3.2, 8, 1.7);
      l.position.copy(g.position).addScaledVector(frame.out, 0.9);
      l.position.y -= 0.3;
      house.add(l);
      lights.push(l);
    }
    return g;
  }

  const trimMat = new THREE.MeshStandardMaterial({ color: 0xcfc3bd, roughness: 0.75 });
  const front = { origin: V(0, 0, D / 2), along: V(1, 0, 0), out: V(0, 0, 1) };
  const wingFront = { origin: V(0, 0, wz), along: V(1, 0, 0), out: V(0, 0, 1) };
  const left = { origin: V(-W / 2, 0, 0), along: V(0, 0, 1), out: V(-1, 0, 0) };
  const right = { origin: V(W / 2, 0, 0), along: V(0, 0, -1), out: V(1, 0, 0) };

  addWindow(front, -0.9, 5.6, 0.95, 1.8, 'father', 3);
  addWindow(wingFront, 1.6, 2.5, 1.0, 2.0, 'mother', 4);
  addWindow(wingFront, 3.5, 2.5, 1.0, 2.0, null);
  addWindow(wingFront, 1.6, 5.6, 1.0, 1.9, null);
  addWindow(wingFront, 3.5, 5.6, 1.0, 1.9, 'lamp', 7);
  addWindow(wingFront, wcx, 10.2, 0.7, 1.1, null);
  addWindow(left, -2.6, 2.5, 1.0, 2.0, null);
  addWindow(left, 0.4, 2.5, 1.0, 2.0, 'stairs', 9);
  addWindow(left, -2.6, 5.6, 1.0, 1.9, null);
  addWindow(left, 0.4, 5.6, 1.0, 1.9, null);
  addWindow(right, 1.5, 2.5, 1.0, 2.0, 'lamp', 12);
  addWindow({ origin: V(dx, 0, dz + 0.65), along: V(1, 0, 0), out: V(0, 0, 1) }, 0, dy + 1.0, 0.7, 1.0, null);
  // turret windows on three faces, three floors
  for (const [a, floors] of [[0, ['lamp', null, null]], [-Math.PI / 4, [null, null, null]], [-Math.PI / 2, [null, 'lamp', null]]]) {
    const out = V(Math.sin(a), 0, Math.cos(a));
    const ap = TR * Math.cos(Math.PI / 8);
    const origin = V(TX, 0, TZ).addScaledVector(out, ap);
    const along = V(out.z, 0, -out.x);
    [2.5, 5.6, 8.7].forEach((y, i) => addWindow({ origin, along, out }, 0, y, 0.7, 1.7, floors[i], 20 + i));
  }

  // the front door with a lit fanlight, and a dim porch lamp
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.3, 0.1), new THREE.MeshStandardMaterial({ color: 0x2a1512, roughness: 0.6 }));
  door.position.set((px0 + px1) / 2, G + 1.15, D / 2 + 0.05);
  house.add(door);
  parts.trim.push(box(1.4, 0.12, 0.14, door.position.x, G + 2.36, D / 2 + 0.07, 2));
  const fan = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.4), roomMat('lamp', 31));
  fan.position.set(door.position.x, G + 2.62, D / 2 + 0.04);
  house.add(fan);
  const porchLight = new THREE.PointLight(0xffa24a, 7, 8, 1.7);
  porchLight.position.set(door.position.x + 0.9, G + 2.5, D / 2 + 0.8);
  house.add(porchLight);
  lights.push(porchLight);
  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 2.6, 1.1) }));
  lantern.position.set(door.position.x + 0.85, G + 2.2, D / 2 + 0.18);
  house.add(lantern);

  // assemble ---------------------------------------------------------------
  const mats = {
    siding: new THREE.MeshStandardMaterial({ map: tx.siding.map, bumpMap: tx.siding.bump, bumpScale: 3, roughness: 0.88 }),
    fish: new THREE.MeshStandardMaterial({ map: tx.fish.map, bumpMap: tx.fish.bump, bumpScale: 3, roughness: 0.88 }),
    roof: new THREE.MeshStandardMaterial({ map: tx.shingles.map, bumpMap: tx.shingles.bump, bumpScale: 4, roughness: 0.8, color: 0xb4acc4 }),
    trim: trimMat,
    stone: new THREE.MeshStandardMaterial({ map: tx.stone.map, bumpMap: tx.stone.bump, bumpScale: 3, roughness: 0.92, color: 0xa0a0aa }),
    dark: new THREE.MeshStandardMaterial({ color: 0x15151a, roughness: 0.4, metalness: 0.6 }),
    brick: new THREE.MeshStandardMaterial({ map: tx.stone.map, bumpMap: tx.stone.bump, bumpScale: 3, roughness: 0.9, color: 0xa86a5c }),
  };
  for (const [k, geos] of Object.entries(parts)) {
    if (!geos.length) continue;
    const merged = mergeGeometries(geos.map((q) => (q.index ? q.toNonIndexed() : q)));
    const mesh = new THREE.Mesh(merged, mats[k]);
    mesh.castShadow = mesh.receiveShadow = true;
    house.add(mesh);
  }
  return { house, lights, windows };
}
