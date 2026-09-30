// The old tree that frames the menu, bare trees on the hill, and the dark leaves that fall
// everywhere, all on a seamless loop.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng, taperedTube, lerp } from './util.js';
import { terrainHeight } from './terrain.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// Grow side branches off a curve, recursively, each one more crooked and thinner than its parent.
function sprout(r, curve, radiusAt, level, maxLevel, geos, tips, opts) {
  const count = level === 0 ? opts.firstCount : r.range(2, 4) | 0;
  for (let i = 0; i < count; i++) {
    const t = r.range(0.3, 0.95);
    const p = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    const rad = radiusAt(t) * r.range(0.45, 0.7);
    if (rad < 0.012) continue;
    const axis = V(r() - 0.5, r() - 0.5, r() - 0.5).normalize();
    const dir = tan.clone().applyAxisAngle(axis, r.range(0.5, 1.1));
    dir.y += opts.rise * r.range(0.2, 1);
    dir.normalize();
    const len = Math.min(3.2, curve.getLength() * r.range(0.3, 0.5));
    const n = 5;
    const pts = [p.clone()];
    const d = dir.clone();
    for (let k = 1; k <= n; k++) {
      d.add(V(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(opts.gnarl)).normalize();
      d.y -= opts.droop * k / n;
      d.normalize();
      pts.push(pts[k - 1].clone().addScaledVector(d, len / n));
    }
    const radii = [rad, rad * 0.75, rad * 0.5, rad * 0.3, rad * 0.16, Math.max(0.006, rad * 0.06)];
    const { geometry, curve: c } = taperedTube(pts, radii, { radial: rad > 0.08 ? 9 : 5, perSegment: 3, knot: 0.22, seed: r() * 1e6 | 0 });
    geos.push(geometry);
    const rAt = (tt) => lerp(rad, rad * 0.06, tt);
    if (level + 1 < maxLevel) sprout(r, c, rAt, level + 1, maxLevel, geos, tips, opts);
    else for (const tt of [0.55, 0.75, 1]) tips.push(c.getPointAt(tt));
  }
}

function limb(r, pts, radii, geos, tips, maxLevel, opts) {
  const { geometry, curve } = taperedTube(pts.map((p) => V(...p)), radii, { radial: 14, perSegment: 5, knot: 0.25, seed: r() * 1e6 | 0 });
  geos.push(geometry);
  const rAt = (t) => {
    const x = t * (radii.length - 1), i = Math.floor(x), j = Math.min(radii.length - 1, i + 1);
    return lerp(radii[i], radii[j], x - i);
  };
  sprout(r, curve, rAt, 0, maxLevel, geos, tips, opts);
  for (const tt of [0.85, 1]) tips.push(curve.getPointAt(tt));
}

export function createBigTree(tx, leafTexture) {
  const r = rng(101);
  const geos = [], tips = [];
  const opts = { firstCount: 5, gnarl: 0.55, droop: 0.12, rise: 0.4 };
  limb(r, [[0, -0.6, 0], [0.25, 1.2, 0.1], [0.1, 2.6, 0], [0.7, 3.9, -0.2], [1.3, 4.8, -0.3]], [0.95, 0.66, 0.56, 0.5, 0.42], geos, tips, 2, { ...opts, firstCount: 2 });
  // the long arm that reaches over the top of the frame
  limb(r, [[1.2, 4.7, -0.3], [2.4, 6.0, -0.7], [4.2, 6.9, -1.3], [6.2, 7.5, -2.1], [8.2, 8.2, -2.9], [9.6, 9.3, -3.5]], [0.4, 0.33, 0.26, 0.19, 0.12, 0.06], geos, tips, 3, { ...opts, firstCount: 9, droop: 0.2 });
  limb(r, [[1.1, 4.6, -0.2], [0.5, 6.2, 0.3], [-0.3, 7.7, 0.2], [-0.8, 9.4, 0.7]], [0.36, 0.28, 0.18, 0.08], geos, tips, 3, opts);
  limb(r, [[0.9, 4.2, 0], [1.3, 5.3, 1.2], [1.6, 6.4, 2.2], [1.9, 7.6, 2.8]], [0.3, 0.22, 0.14, 0.05], geos, tips, 2, opts);
  // a limb snapped off long ago, leaving a jagged stub
  limb(r, [[0.3, 2.6, 0], [0.9, 2.95, -0.1], [1.35, 3.1, -0.25]], [0.3, 0.24, 0.16], geos, tips, 1, { ...opts, firstCount: 1, droop: 0.3 });
  // roots clawing into the ground
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + r.range(-0.3, 0.3);
    const len = r.range(1.4, 2.6);
    const pts = [V(0, 0.9, 0), V(Math.cos(a) * 0.6, 0.3, Math.sin(a) * 0.6), V(Math.cos(a) * len * 0.6, -0.05, Math.sin(a) * len * 0.6), V(Math.cos(a) * len, -0.3, Math.sin(a) * len)];
    geos.push(taperedTube(pts, [0.4, 0.28, 0.14, 0.04], { radial: 9, perSegment: 4, knot: 0.3, seed: i + 7 }).geometry);
  }
  const bark = new THREE.MeshStandardMaterial({ map: tx.bark.map, bumpMap: tx.bark.bump, bumpScale: 1.6, roughness: 0.95, color: 0x8a8490 });
  const trunk = new THREE.Mesh(mergeGeometries(geos), bark);
  trunk.castShadow = trunk.receiveShadow = true;

  const group = new THREE.Group();
  group.add(trunk);
  group.add(leafClusters(r, tips, leafTexture, 7));
  return group;
}

export function createBareTree(seed, scale) {
  const r = rng(seed);
  const geos = [], tips = [];
  const lean = r.range(-0.4, 0.4);
  limb(r, [[0, -0.3, 0], [lean * 0.3, 1.5, 0], [lean, 3, 0.2], [lean * 1.4, 4.6, 0.1]], [0.28, 0.2, 0.15, 0.08], geos, tips, 3, { firstCount: 5, gnarl: 0.7, droop: 0.05, rise: 0.8 });
  const mesh = new THREE.Mesh(mergeGeometries(geos), new THREE.MeshStandardMaterial({ color: 0x1a1716, roughness: 1 }));
  mesh.scale.setScalar(scale);
  mesh.castShadow = true;
  return mesh;
}

const LEAF_COLOURS = [[0.0, 0.55, 0.12], [0.98, 0.5, 0.09], [0.03, 0.45, 0.15], [0.9, 0.3, 0.08], [0.06, 0.35, 0.11], [0.0, 0.2, 0.05]];
function leafColour(r, col) {
  const [h, s, l] = r.pick(LEAF_COLOURS);
  return col.setHSL(h, s, l * r.range(0.8, 1.2));
}

function leafMaterial(leafTexture) {
  return new THREE.MeshStandardMaterial({ map: leafTexture, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.7, emissive: 0x1c0406 });
}

function leafClusters(r, tips, leafTexture, perTip) {
  const geo = new THREE.PlaneGeometry(0.2, 0.2);
  const mesh = new THREE.InstancedMesh(geo, leafMaterial(leafTexture), tips.length * perTip);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const col = new THREE.Color();
  let n = 0;
  for (const tip of tips) {
    if (r() < 0.25) continue; // half-bare: autumn has taken a good share already
    for (let i = 0; i < perTip; i++) {
      p.copy(tip).add(V(r.range(-0.35, 0.35), r.range(-0.3, 0.2), r.range(-0.35, 0.35)));
      q.setFromEuler(new THREE.Euler(r() * 6.28, r() * 6.28, r() * 6.28));
      s.setScalar(r.range(0.7, 1.3));
      m.compose(p, q, s);
      mesh.setMatrixAt(n, m);
      mesh.setColorAt(n, leafColour(r, col));
      n++;
    }
  }
  mesh.count = n;
  mesh.castShadow = true;
  return mesh;
}

// Leaves already fallen, scattered on the ground and the steps near the camera.
export function createFallenLeaves(leafTexture) {
  const r = rng(55);
  const count = 1400;
  const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.2, 0.2), leafMaterial(leafTexture), count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const col = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const x = r.range(-10, 12), z = r.range(-8, 9.5);
    p.set(x, terrainHeight(x, z) + 0.03, z);
    q.setFromEuler(new THREE.Euler(-Math.PI / 2 + r.range(-0.3, 0.3), 0, r() * 6.28));
    s.setScalar(r.range(0.8, 1.4));
    m.compose(p, q, s);
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, leafColour(r, col).multiplyScalar(0.8));
  }
  mesh.receiveShadow = true;
  return mesh;
}

// Falling leaves. Every motion is a whole number of cycles per loop, so the last frame meets the first.
export function createFallingLeaves(leafTexture, loop) {
  const r = rng(66);
  const count = 320;
  const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.2, 0.2), leafMaterial(leafTexture), count);
  const col = new THREE.Color();
  const leaves = [];
  for (let i = 0; i < count; i++) {
    const near = i < 40;
    const z = near ? r.range(5, 9) : r.range(-18, 6);
    const x = near ? r.range(-4, 5) : r.range(-12, 22);
    leaves.push({
      x, z,
      top: near ? r.range(4, 6) : r.range(7, 11),
      fall: near ? r.range(4.5, 6.5) : r.range(8, 12),
      cycles: r.pick([1, 1, 2]),
      phase: r(),
      sway: r.range(0.3, 1.1),
      swayCycles: r.pick([3, 4, 5, 6]),
      drift: r.range(1.5, 4),
      spin: [r.pick([-3, -2, 2, 3]), r.pick([-4, -3, 3, 4]), r.pick([-2, -1, 1, 2])],
      spinPhase: [r() * 6.28, r() * 6.28, r() * 6.28],
      scale: near ? r.range(1.2, 1.8) : r.range(0.9, 1.4),
    });
    mesh.setColorAt(i, leafColour(r, col));
  }
  mesh.castShadow = true;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), e = new THREE.Euler();
  const update = (time) => {
    const u = time / loop;
    leaves.forEach((L, i) => {
      const f = (u * L.cycles + L.phase) % 1;
      const w = Math.PI * 2 * (u * L.swayCycles + L.phase);
      p.set(L.x + L.drift * f + Math.sin(w) * L.sway, L.top - L.fall * f, L.z + Math.cos(w * 0.5) * L.sway * 0.4);
      e.set(L.spinPhase[0] + Math.PI * 2 * u * L.spin[0], L.spinPhase[1] + Math.PI * 2 * u * L.spin[1], L.spinPhase[2] + Math.PI * 2 * u * L.spin[2]);
      q.setFromEuler(e);
      // shrink to nothing at the very top and bottom of each fall so the wrap is invisible
      const fadeIn = Math.min(1, f * 12, (1 - f) * 12);
      s.setScalar(L.scale * fadeIn);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  update(0);
  return { mesh, update };
}
