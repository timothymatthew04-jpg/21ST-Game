// Coraline, seen from behind: a blue bob built from clumps of hair like a stop-motion puppet's,
// the dragonfly clip, and the yellow raincoat with its hood down, looking up at the house.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng, fbm2, noise3, taperedTube } from './util.js';

function strandTexture() {
  const W = 128, H = 256;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const img = g.createImageData(W, H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const v = 255 * Math.min(1, 0.3 + 0.7 * fbm2(x / 1.8, y / 40, 3, 71.11));
      const i = (y * W + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// A lathe from (radius, height) pairs, with an elliptical cross-section and noisy folds.
function lathe(profile, { segments = 48, depthScale = 1, fold = 0, foldCount = 7, seed = 0 } = {}) {
  const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), segments);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const a = Math.atan2(z, x);
    const f = 1 + fold * (Math.sin(a * foldCount + seed) * 0.5 + (noise3(Math.cos(a) * 3 + seed, y * 8, Math.sin(a) * 3) - 0.5));
    p.setXYZ(i, x * f, y, z * f * depthScale);
  }
  g.computeVertexNormals();
  return g;
}

// The bob: clumps sweep from the crown over the skull and fall straight to the jaw, flicking out.
function hairClumps() {
  const r = rng(314);
  const geos = [];
  const crown = new THREE.Vector3(0, 0.125, 0.02);
  const n = 130;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r.range(-0.04, 0.04);
    // local frame: +z is the back of her head (towards the camera), -z the face
    const dx = Math.sin(a), dz = Math.cos(a);
    const front = dz < -0.55;           // fringe over the forehead: short
    const len = front ? 0.35 : 1;
    const R = 0.122 + r.range(-0.004, 0.006);
    const pts = [];
    const steps = 7;
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const phi = (t * (front ? 0.55 : 1.0)) * Math.PI * 0.62;   // angle down from the crown
      const flare = t > 0.75 ? (t - 0.75) * 0.09 : 0;
      const rr = R * Math.sin(Math.max(0.08, phi)) + flare;
      let y = crown.y - (1 - Math.cos(phi)) * 0.15 - (t > 0.6 ? (t - 0.6) * 0.07 * len : 0);
      if (!front && t === 1) y -= r.range(0, 0.018);
      pts.push(new THREE.Vector3(dx * rr, y, crown.z * (1 - t) + dz * rr));
    }
    const w = r.range(0.018, 0.027);
    const { geometry } = taperedTube(pts, [w * 0.6, w, w, w * 0.95, w * 0.8, w * 0.35], { radial: 6, perSegment: 3, knot: 0.1, seed: i });
    geos.push(geometry);
  }
  // loose strands breaking the outline
  for (let i = 0; i < 16; i++) {
    const a = r.range(0.6, 5.7);
    const dx = Math.sin(a), dz = Math.cos(a);
    const pts = [
      new THREE.Vector3(dx * 0.12, 0.02, dz * 0.12),
      new THREE.Vector3(dx * 0.132, -0.05, dz * 0.132),
      new THREE.Vector3(dx * (0.14 + r.range(0, 0.02)), -0.1 - r.range(0, 0.02), dz * 0.14),
    ];
    geos.push(taperedTube(pts, [0.004, 0.003, 0.001], { radial: 4, perSegment: 3, knot: 0, seed: 100 + i }).geometry);
  }
  return mergeGeometries(geos);
}

export function createCoraline() {
  const girl = new THREE.Group();
  const coat = new THREE.MeshPhysicalMaterial({
    color: 0xe8a818, roughness: 0.55, clearcoat: 0.35, clearcoatRoughness: 0.45, emissive: 0x160d00,
  });
  const strands = strandTexture();
  const hairMat = new THREE.MeshPhysicalMaterial({
    color: 0x17236e, roughness: 0.68, bumpMap: strands, bumpScale: 3,
    sheen: 0.7, sheenColor: new THREE.Color(0x4a64d0), sheenRoughness: 0.4,
  });
  const skin = new THREE.MeshStandardMaterial({ color: 0xe8cbb9, roughness: 0.6 });
  const jeans = new THREE.MeshStandardMaterial({ color: 0x1d2433, roughness: 0.9 });

  // the raincoat: narrow child's shoulders, a stiff A-line flare to the hem
  const body = lathe([
    [0.0, 0.5], [0.2, 0.5], [0.207, 0.53], [0.19, 0.64], [0.172, 0.76], [0.162, 0.86],
    [0.158, 0.91], [0.14, 0.955], [0.095, 0.99], [0.058, 1.01], [0.0, 1.01],
  ], { depthScale: 0.68, fold: 0.035, foldCount: 9, seed: 2 });
  girl.add(new THREE.Mesh(body, coat));
  // a stand-up collar
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.07, 0.05, 24, 1, true), coat);
  collar.material = coat.clone();
  collar.material.side = THREE.DoubleSide;
  collar.position.y = 1.02;
  collar.scale.z = 0.85;
  girl.add(collar);
  // the hood, down and bunched between her shoulders
  const hoodGeo = lathe([[0.0, -0.06], [0.08, -0.05], [0.105, 0.0], [0.09, 0.05], [0.05, 0.075], [0.0, 0.08]], { segments: 24, fold: 0.08, foldCount: 5, seed: 9 });
  const hood = new THREE.Mesh(hoodGeo, coat);
  hood.scale.set(0.95, 0.8, 0.42);
  hood.position.set(0, 0.945, 0.078);
  hood.rotation.x = 0.35;
  girl.add(hood);
  // sleeves and hands
  for (const s of [-1, 1]) {
    const { geometry } = taperedTube(
      [new THREE.Vector3(s * 0.13, 0.94, 0.0), new THREE.Vector3(s * 0.165, 0.84, 0.01), new THREE.Vector3(s * 0.178, 0.72, -0.01), new THREE.Vector3(s * 0.18, 0.62, -0.035)],
      [0.048, 0.044, 0.041, 0.046], { radial: 14, perSegment: 5, knot: 0.08, seed: s + 5 },
    );
    girl.add(new THREE.Mesh(geometry, coat));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 10), skin);
    hand.scale.set(0.8, 1.25, 0.9);
    hand.position.set(s * 0.18, 0.575, -0.045);
    girl.add(hand);
  }
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.044, 0.4, 12), jeans);
    leg.position.set(s * 0.07, 0.3, 0);
    girl.add(leg);
  }
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.037, 0.08, 12), skin);
  neck.position.y = 1.06;
  girl.add(neck);

  const headGroup = new THREE.Group();
  headGroup.position.y = 1.18;
  girl.add(headGroup);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 18), skin);
  head.scale.set(0.96, 1.08, 1.02);
  headGroup.add(head);
  // a dark underlayer so no scalp shows between the clumps
  const under = new THREE.Mesh(
    lathe([[0.0, 0.118], [0.06, 0.11], [0.1, 0.075], [0.114, 0.02], [0.116, -0.04], [0.114, -0.085], [0.1, -0.09]], { segments: 40 }),
    new THREE.MeshStandardMaterial({ color: 0x141e60, roughness: 0.7, side: THREE.DoubleSide, bumpMap: strands, bumpScale: 2 }),
  );
  under.position.z = 0.006;
  headGroup.add(under);
  const hair = new THREE.Mesh(hairClumps(), hairMat);
  headGroup.add(hair);

  // dragonfly hair clip above her left ear
  const clip = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x7fd6c0, roughness: 0.3, metalness: 0.4, emissive: 0x12382f });
  const dfly = new THREE.Mesh(new THREE.CapsuleGeometry(0.005, 0.045, 4, 8), bodyMat);
  dfly.rotation.z = Math.PI / 2;
  clip.add(dfly);
  const wingMat = new THREE.MeshStandardMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.6, roughness: 0.2, side: THREE.DoubleSide, emissive: 0x1a2a3a });
  for (const [x, a] of [[0.008, 0.5], [0.008, -0.5], [-0.004, 0.35], [-0.004, -0.35]]) {
    const w = new THREE.Mesh(new THREE.CircleGeometry(0.018, 12), wingMat);
    w.scale.set(0.45, 1, 1);
    w.position.set(x, Math.sign(a) * 0.016, 0);
    w.rotation.z = a;
    clip.add(w);
  }
  clip.position.set(-0.122, 0.04, 0.02);
  clip.rotation.set(0.2, -1.3, 0.5);
  headGroup.add(clip);

  girl.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { girl, headGroup };
}
