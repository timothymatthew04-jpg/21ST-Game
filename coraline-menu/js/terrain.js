// The land: a hill with the Pink Palace on its crown, worn stone steps up to the porch,
// scrub and long grass, a crooked fence, and a far forest fading into the mist.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng, fbm2, smoothstep, worldUV } from './util.js';

export const PLATEAU = { x: 25, z: -39, flat: 8.5, foot: 27, height: 7 };
export const STAIRS = { from: new THREE.Vector3(14.2, 0, -16.5), to: new THREE.Vector3(24.6, 0, -32.1), width: 1.7 };
const STAIR_DIR = new THREE.Vector3().subVectors(STAIRS.to, STAIRS.from).setY(0).normalize();
const STAIR_PERP = new THREE.Vector3(-STAIR_DIR.z, 0, STAIR_DIR.x);
const nearHouse = (x, z) => Math.hypot(x - PLATEAU.x, z - PLATEAU.z) < 7.8;

// A worn footpath from the foreground, past where Coraline stands, to the foot of the steps.
export const PATH = [[-0.2, 12], [-0.8, 7.5], [-1.2, 4.2], [-0.9, 1.2], [1.2, -2.5], [5.5, -8], [10.5, -13], [14.2, -16.5]]
  .map(([x, z]) => new THREE.Vector3(x, 0, z));
export function pathDistance(x, z) {
  let best = Infinity;
  for (let i = 0; i < PATH.length - 1; i++) best = Math.min(best, distToSegment(x, z, PATH[i], PATH[i + 1]).d);
  return best;
}

function distToSegment(x, z, a, b) {
  const abx = b.x - a.x, abz = b.z - a.z;
  const t = Math.max(0, Math.min(1, ((x - a.x) * abx + (z - a.z) * abz) / (abx * abx + abz * abz)));
  return { d: Math.hypot(x - (a.x + abx * t), z - (a.z + abz * t)), t };
}

export function terrainHeight(x, z) {
  const dx = (x - PLATEAU.x) * 0.85, dz = z - PLATEAU.z;
  const r = Math.hypot(dx, dz);
  let h = PLATEAU.height * smoothstep(PLATEAU.foot, PLATEAU.flat, r);
  // the hill runs on to the right, off the edge of the frame
  h += 3 * smoothstep(34, 70, x) * smoothstep(-90, -50, z) * smoothstep(-10, -35, z) * (0.6 + 0.8 * fbm2(x * 0.08, z * 0.08, 3));
  // rolling ground, calmer near the camera so the foreground stays readable
  const calm = smoothstep(2, -14, z) * 0.7 + 0.3;
  h += (fbm2(x * 0.06 + 40, z * 0.06, 4) - 0.5) * 2.2 * calm;
  h += (fbm2(x * 0.35, z * 0.35, 3) - 0.5) * 0.25;
  // far hills under the forest
  h += 9 * smoothstep(-80, -150, z) * (0.6 + 0.8 * fbm2(x * 0.02, 3, 3));
  // flatten the hilltop for the house and trench the stair line a little
  h = h * (1 - smoothstep(PLATEAU.flat, PLATEAU.flat - 3, r)) + PLATEAU.height * smoothstep(PLATEAU.flat, PLATEAU.flat - 3, r);
  const s = distToSegment(x, z, STAIRS.from, STAIRS.to);
  h -= 0.25 * smoothstep(2.2, 0.8, s.d) * smoothstep(0, 0.1, s.t) * smoothstep(1, 0.9, s.t);
  return h;
}

export function createTerrain(tx) {
  const size = 320, seg = 360;
  const g = new THREE.PlaneGeometry(size, size, seg, seg);
  g.rotateX(-Math.PI / 2);
  g.translate(10, 0, -130);
  const pos = g.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const y = terrainHeight(x, z);
    pos.setY(i, y);
    const dry = fbm2(x * 0.08 + 9, z * 0.08, 3);
    const dim = 0.62 + 0.38 * smoothstep(-20, 0, z);
    const worn = smoothstep(1.1, 0.35, pathDistance(x, z)) * (0.8 + 0.2 * dry);
    colors[i * 3] = ((0.75 + 0.35 * dry) * (1 - worn) + 1.25 * worn) * dim;
    colors[i * 3 + 1] = ((0.8 + 0.2 * dry) * (1 - worn) + 0.95 * worn) * dim;
    colors[i * 3 + 2] = (0.9 * (1 - worn) + 0.72 * worn) * dim;
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  worldUV(g, 6);
  const mat = new THREE.MeshStandardMaterial({
    map: tx.ground.map, bumpMap: tx.ground.bump, bumpScale: 1.5,
    roughness: 0.95, vertexColors: true,
  });
  const mesh = new THREE.Mesh(g, mat);
  mesh.receiveShadow = true;
  return mesh;
}

export function createSteps(tx) {
  const geos = [];
  const { from, to, width } = STAIRS;
  const n = 30;
  const r = rng(3);
  const dir = new THREE.Vector3().subVectors(to, from).setY(0);
  const run = dir.length();
  dir.normalize();
  const yaw = Math.atan2(dir.x, dir.z);
  let last = -1;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = from.x + (to.x - from.x) * t, z = from.z + (to.z - from.z) * t;
    let y = Math.max(terrainHeight(x, z) + 0.12, last + 0.04);
    if (i === n) y = PLATEAU.height + 0.12;
    last = y;
    const b = new THREE.BoxGeometry(width * r.range(0.92, 1.06), 0.55, run / n + 0.12);
    worldUV(b, 1.6);
    b.rotateY(yaw + r.range(-0.04, 0.04));
    b.translate(x + r.range(-0.05, 0.05), y - 0.275, z);
    geos.push(b);
  }
  const mat = new THREE.MeshStandardMaterial({ map: tx.stone.map, bumpMap: tx.stone.bump, bumpScale: 2, roughness: 0.9, color: 0xb8b8c4 });
  const mesh = new THREE.Mesh(mergeGeometries(geos), mat);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

// Shrubs: a dark core wrapped in leaf cards, scattered over the slopes but kept off the path and the house.
export function createBushes(leafTexture) {
  const r = rng(8);
  const spots = [];
  let tries = 0;
  while (spots.length < 150 && tries < 6000) {
    tries++;
    const x = PLATEAU.x + r.range(-30, 22), z = PLATEAU.z + r.range(-16, 26);
    const rr = Math.hypot((x - PLATEAU.x) * 0.85, z - PLATEAU.z);
    if (rr > PLATEAU.foot + 1) continue;
    if (nearHouse(x, z) && rr < 7) continue;
    if (distToSegment(x, z, STAIRS.from, STAIRS.to).d < 1.9) continue;
    spots.push({ x, z, s: r.range(0.5, 1.4) * (rr < 9 ? 0.7 : 1) });
  }
  const core = new THREE.IcosahedronGeometry(1, 2);
  const coreMesh = new THREE.InstancedMesh(core, new THREE.MeshStandardMaterial({ color: 0x0b120d, roughness: 1 }), spots.length);
  const perBush = 34;
  const leafMesh = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(0.42, 0.42),
    new THREE.MeshStandardMaterial({ map: leafTexture, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.8 }),
    spots.length * perBush,
  );
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), t = new THREE.Vector3();
  const col = new THREE.Color();
  let k = 0;
  spots.forEach(({ x, z, s }, i) => {
    const y = terrainHeight(x, z);
    t.set(x, y + s * 0.35, z);
    q.identity();
    sc.set(s * 0.85, s * 0.6, s * 0.85);
    m.compose(t, q, sc);
    coreMesh.setMatrixAt(i, m);
    for (let j = 0; j < perBush * s; j++) {
      const a = r() * Math.PI * 2, b = Math.acos(r.range(-0.2, 1));
      t.set(x + Math.cos(a) * Math.sin(b) * s * 0.95, y + s * 0.35 + Math.cos(b) * s * 0.65, z + Math.sin(a) * Math.sin(b) * s * 0.95);
      q.setFromEuler(new THREE.Euler(r() * 6.28, r() * 6.28, r() * 6.28));
      sc.setScalar(r.range(0.7, 1.3));
      m.compose(t, q, sc);
      leafMesh.setMatrixAt(k, m);
      col.setHSL(r.range(0.22, 0.4), r.range(0.25, 0.45), r.range(0.1, 0.2));
      if (r() < 0.12) col.setHSL(r.range(0.0, 0.06), 0.45, 0.14);
      leafMesh.setColorAt(k, col);
      k++;
    }
  });
  leafMesh.count = k;
  coreMesh.castShadow = leafMesh.castShadow = true;
  coreMesh.receiveShadow = leafMesh.receiveShadow = true;
  const g = new THREE.Group();
  g.add(coreMesh, leafMesh);
  return g;
}

// Tufts of long grass, each a fan of bent blades.
export function createGrass() {
  const blades = [];
  const r = rng(12);
  for (let b = 0; b < 10; b++) {
    const h = r.range(0.35, 0.8), w = r.range(0.018, 0.03);
    const lean = r.range(0.1, 0.5), a = r() * Math.PI * 2;
    const segs = 4;
    const verts = [], idx = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const bend = lean * t * t;
      const ww = w * (1 - t * 0.9);
      verts.push(-ww, t * h, bend * h, ww, t * h, bend * h);
      if (i < segs) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setIndex(idx);
    g.rotateY(a);
    g.translate(r.range(-0.08, 0.08), 0, r.range(-0.08, 0.08));
    g.computeVertexNormals();
    blades.push(g);
  }
  const tuft = mergeGeometries(blades);
  const mat = new THREE.MeshStandardMaterial({ color: 0x2f3a2c, roughness: 0.9, side: THREE.DoubleSide });
  const count = 2200;
  const mesh = new THREE.InstancedMesh(tuft, mat, count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), t = new THREE.Vector3();
  const col = new THREE.Color();
  let placed = 0, tries = 0;
  while (placed < count && tries < 20000) {
    tries++;
    const near = placed < 1500;
    const x = near ? r.range(-8, 14) : r.range(-6, 44);
    const z = near ? r.range(-6, 9.8) : r.range(-52, -6);
    if (distToSegment(x, z, STAIRS.from, STAIRS.to).d < 1.1) continue;
    if (nearHouse(x, z)) continue;
    if (pathDistance(x, z) < 0.75 + r() * 0.3) continue; // the worn path stays bare
    if (z > 3.2 && Math.abs(x + 0.9 - (z - 3.2) * 0.12) < 1.1) continue; // keep the view of Coraline clear
    const sc = r.range(0.7, 1.5);
    t.set(x, terrainHeight(x, z) - 0.02, z);
    q.setFromEuler(new THREE.Euler(0, r() * 6.28, 0));
    s.set(sc, sc * r.range(0.8, 1.3), sc);
    m.compose(t, q, s);
    mesh.setMatrixAt(placed, m);
    col.setHSL(r.range(0.2, 0.33), 0.3, r.range(0.25, 0.55));
    mesh.setColorAt(placed, col);
    placed++;
  }
  mesh.count = placed;
  mesh.receiveShadow = true;
  return mesh;
}

// A far forest of dark firs on the distant hills, as billboards; the fog turns it to a blue wall.
export function createForest(firTextures, camera) {
  const group = new THREE.Group();
  const r = rng(21);
  firTextures.forEach((map, variant) => {
    const mat = new THREE.MeshStandardMaterial({ map, alphaTest: 0.5, color: 0x121c18, roughness: 1, side: THREE.DoubleSide });
    const count = 420;
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.translate(0, 0.5, 0);
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), t = new THREE.Vector3();
    let placed = 0, tries = 0;
    while (placed < count && tries < 10000) {
      tries++;
      const x = r.range(-150, 190), z = r.range(-185, -62);
      // keep a gap behind the house so its roofline stands against the sky
      if (x > 8 && x < 44 && z > -135) continue;
      if (x > 8 && x < 44 && r() < 0.8) continue;
      const h = r.range(10, 24);
      t.set(x, terrainHeight(x, z) - 0.8, z);
      q.setFromEuler(new THREE.Euler(0, Math.atan2(camera.position.x - x, camera.position.z - z), 0));
      s.set(h * r.range(0.38, 0.5), h, 1);
      m.compose(t, q, s);
      mesh.setMatrixAt(placed++, m);
    }
    mesh.count = placed;
    group.add(mesh);
    group.userData[variant] = mesh;
  });
  return group;
}

// A crooked picket fence along the foot of the hill, and the old sign by the steps.
export function createFence(tx, signTexture) {
  const geos = [];
  const r = rng(40);
  const wood = new THREE.MeshStandardMaterial({ color: 0x4a4440, roughness: 0.95, map: tx.bark.map, bumpMap: tx.bark.bump, bumpScale: 1 });
  const base = STAIRS.from.clone().addScaledVector(STAIR_DIR, -1.2);
  const at = (s) => {
    const p = base.clone().addScaledVector(STAIR_PERP, s);
    p.addScaledVector(STAIR_DIR, Math.sin(s * 0.3) * 0.5 + s * 0.05);
    return p;
  };
  for (let s = -16; s < 14; s += 0.32) {
    if (Math.abs(s) < 1.4) continue; // the gap for the steps
    if (r() < 0.07) continue; // missing pickets
    const p = at(s);
    const h = r.range(0.9, 1.15);
    const b = new THREE.BoxGeometry(0.08, h, 0.04);
    b.translate(0, h / 2, 0);
    const tip = new THREE.ConeGeometry(0.057, 0.14, 4);
    tip.rotateY(Math.PI / 4);
    tip.translate(0, h + 0.07, 0);
    const pk = mergeGeometries([b, tip]);
    pk.rotateY(Math.atan2(STAIR_PERP.x, STAIR_PERP.z) + Math.PI / 2);
    pk.rotateZ(r.range(-0.12, 0.12));
    pk.translate(p.x, terrainHeight(p.x, p.z) - 0.1, p.z);
    geos.push(pk);
  }
  for (let s = -16; s < 14; s += 3) {
    if (Math.abs(s + 1.5) < 2.6) continue;
    const a = at(s), b = at(s + 3);
    for (const hh of [0.35, 0.8]) {
      const len = a.distanceTo(b);
      const rail = new THREE.BoxGeometry(len, 0.07, 0.035);
      rail.rotateY(-Math.atan2(b.z - a.z, b.x - a.x));
      rail.translate((a.x + b.x) / 2, (terrainHeight(a.x, a.z) + terrainHeight(b.x, b.z)) / 2 + hh - 0.1, (a.z + b.z) / 2);
      geos.push(rail);
    }
  }
  const fence = new THREE.Mesh(mergeGeometries(geos), wood);
  fence.castShadow = fence.receiveShadow = true;

  const group = new THREE.Group();
  group.add(fence);
  // the sign on two posts, just left of the steps, turned towards the path
  const sp = at(-2.6).addScaledVector(STAIR_DIR, -0.9);
  const signGroup = new THREE.Group();
  signGroup.position.set(sp.x, terrainHeight(sp.x, sp.z), sp.z);
  signGroup.rotation.y = -0.45;
  for (const dx of [-0.95, 0.95]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.1, 0.12), wood);
    post.position.set(dx, 1.0, 0);
    post.castShadow = true;
    signGroup.add(post);
  }
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(2.3, 0.8, 0.06),
    [wood, wood, wood, wood, new THREE.MeshStandardMaterial({ map: signTexture, roughness: 0.9 }), wood],
  );
  board.position.set(0, 1.45, 0.07);
  board.rotation.z = 0.035;
  board.castShadow = true;
  signGroup.add(board);
  group.add(signGroup);
  signGroup.updateMatrixWorld();
  group.userData.signTop = new THREE.Vector3(0.5, 1.87, 0.07).applyMatrix4(signGroup.matrixWorld);
  return group;
}
