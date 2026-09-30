// Coraline, full length, seen from behind and to her right: a blue bob built from clumps of hair
// like a stop-motion puppet's, the dragonfly clip, a yellow vinyl raincoat with the hood down,
// yellow rain boots, and the forked dowsing stick in her hand. She looks up at the house.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng, fbm2, noise3, taperedTube, smoothstep } from './util.js';

function grayTexture(W, H, fn) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const img = g.createImageData(W, H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const v = 255 * Math.max(0, Math.min(1, fn(x, y)));
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

const strandTexture = () => grayTexture(128, 256, (x, y) => 0.3 + 0.7 * fbm2(x / 1.8, y / 40, 3, 71.11));
// soft creases for the vinyl: long diagonal wrinkles and fine crinkle
const creaseTexture = () => grayTexture(256, 256, (x, y) => {
  const long = fbm2((x + y * 0.35) / 22, (y - x * 0.2) / 70, 4, 11.64);
  const fine = fbm2(x / 6, y / 6, 2, 42.67);
  return 0.5 + 0.8 * (long - 0.5) + 0.15 * (fine - 0.5);
});

// A body lofted through superellipse cross-sections: [height, half-width, half-depth, squareness].
function loft(sections, { segments = 64, fold = null } = {}) {
  const pos = [], idx = [], uvs = [];
  const rings = sections.length;
  for (let i = 0; i < rings; i++) {
    const [y, a, b, n] = sections[i];
    for (let j = 0; j <= segments; j++) {
      const th = (j / segments) * Math.PI * 2;
      const c = Math.cos(th), s = Math.sin(th);
      let x = a * Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
      let z = b * Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
      if (fold) {
        const f = fold(th, y);
        x *= f; z *= f;
      }
      pos.push(x, y, z);
      uvs.push((j / segments) * 3, y * 3);
    }
  }
  for (let i = 0; i < rings - 1; i++) {
    for (let j = 0; j < segments; j++) {
      const a = i * (segments + 1) + j, b = a + segments + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function lathe(profile, { segments = 48, depthScale = 1 } = {}) {
  const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), segments);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) * depthScale);
  g.computeVertexNormals();
  return g;
}

// The bob: clumps sweep from the crown over the skull and fall straight to the jaw, flicking out.
function hairClumps() {
  const r = rng(314);
  const geos = [];
  const crown = new THREE.Vector3(0, 0.125, 0.02);
  const n = 140;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r.range(-0.04, 0.04);
    const dx = Math.sin(a), dz = Math.cos(a);   // +z is the back of her head
    const front = dz < -0.55;                    // the fringe: short
    const len = front ? 0.35 : 1;
    const R = 0.124 + r.range(-0.004, 0.006) + (dz > 0 ? 0.006 * dz : 0);
    const pts = [];
    const steps = 7;
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const phi = (t * (front ? 0.55 : 1.0)) * Math.PI * 0.62;
      const flare = t > 0.72 ? (t - 0.72) * 0.08 : 0;
      const rr = R * Math.sin(Math.max(0.08, phi)) + flare;
      let y = crown.y - (1 - Math.cos(phi)) * 0.15 - (t > 0.6 ? (t - 0.6) * 0.07 * len : 0);
      if (!front && t === 1) y -= r.range(0, 0.014);
      pts.push(new THREE.Vector3(dx * rr, y, crown.z * (1 - t) + dz * rr));
    }
    const w = r.range(0.02, 0.028);
    geos.push(taperedTube(pts, [w * 0.6, w, w, w * 0.95, w * 0.8, w * 0.4], { radial: 6, perSegment: 3, knot: 0.1, seed: i }).geometry);
  }
  for (let i = 0; i < 18; i++) {
    const a = r.range(0.6, 5.7);
    const dx = Math.sin(a), dz = Math.cos(a);
    const pts = [
      new THREE.Vector3(dx * 0.122, 0.03, dz * 0.122),
      new THREE.Vector3(dx * 0.136, -0.05, dz * 0.136),
      new THREE.Vector3(dx * (0.142 + r.range(0, 0.018)), -0.1 - r.range(0, 0.018), dz * 0.142),
    ];
    geos.push(taperedTube(pts, [0.004, 0.003, 0.001], { radial: 4, perSegment: 3, knot: 0, seed: 100 + i }).geometry);
  }
  return mergeGeometries(geos);
}

export function createCoraline() {
  const girl = new THREE.Group();
  const crease = creaseTexture();
  const vinyl = (color) => new THREE.MeshPhysicalMaterial({
    color, roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.14,
    bumpMap: crease, bumpScale: 1.2, emissive: 0x120a00,
  });
  const coat = vinyl(0xf0ae1c);
  const lining = new THREE.MeshStandardMaterial({ color: 0x8a5a10, roughness: 0.8, side: THREE.BackSide });
  const boots = vinyl(0xe9a015);
  const hairMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a2878, roughness: 0.62, bumpMap: strandTexture(), bumpScale: 3,
    sheen: 0.8, sheenColor: new THREE.Color(0x5670e0), sheenRoughness: 0.4,
  });
  const skin = new THREE.MeshStandardMaterial({ color: 0xeccfbd, roughness: 0.55 });
  const tights = new THREE.MeshStandardMaterial({ color: 0x2c2f44, roughness: 0.85 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x5a4332, roughness: 0.9 });

  // --- raincoat: A-line to mid-thigh, square little shoulders, soft vertical folds ---------------
  const coatGeo = loft([
    [0.47, 0.205, 0.158, 2.1], [0.5, 0.2, 0.152, 2.1], [0.58, 0.188, 0.14, 2.2], [0.68, 0.174, 0.126, 2.3],
    [0.77, 0.166, 0.116, 2.4], [0.85, 0.166, 0.11, 2.6], [0.905, 0.17, 0.104, 3.2], [0.94, 0.16, 0.097, 3.2],
    [0.968, 0.128, 0.086, 2.6], [0.99, 0.08, 0.066, 2.2], [1.0, 0.062, 0.058, 2],
  ], {
    segments: 80,
    fold: (th, y) => {
      const below = smoothstep(0.82, 0.5, y);
      return 1 + below * (0.028 * Math.sin(th * 9 + 1.3) + 0.022 * (noise3(Math.cos(th) * 3, y * 6, Math.sin(th) * 3) - 0.5))
        + 0.012 * (noise3(Math.cos(th) * 5 + 4, y * 14, Math.sin(th) * 5) - 0.5);
    },
  });
  const coatMat = coat.clone();
  coatMat.side = THREE.DoubleSide;
  girl.add(new THREE.Mesh(coatGeo, coatMat));
  // the stiff turned hem and a yoke seam across the shoulder blades
  const hemPts = [];
  for (let j = 0; j <= 64; j++) {
    const th = (j / 64) * Math.PI * 2;
    hemPts.push(new THREE.Vector3(Math.cos(th) * 0.207, 0.475, Math.sin(th) * 0.16));
  }
  girl.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hemPts, true), 64, 0.007, 6, true), coat));
  const yoke = [];
  for (let j = 0; j <= 20; j++) {
    const th = Math.PI * (0.12 + 0.76 * (j / 20));
    yoke.push(new THREE.Vector3(Math.cos(th) * 0.172, 0.875 + Math.sin(th) * 0.012, Math.sin(th) * 0.109));
  }
  girl.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(yoke), 24, 0.0035, 5), coat));
  // stand-up collar
  girl.add(new THREE.Mesh(lathe([[0.062, 0.995], [0.064, 1.02], [0.07, 1.045], [0.074, 1.05]], { segments: 32, depthScale: 0.92 }), coatMat));
  // the hood, down: a collapsed bowl of vinyl lying on her upper back, lining showing at the rim
  const hoodGroup = new THREE.Group();
  const bowl = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const bp = bowl.attributes.position;
  for (let i = 0; i < bp.count; i++) {
    const x = bp.getX(i), y = bp.getY(i), z = bp.getZ(i);
    const f = 1 + 0.08 * (noise3(x * 3, y * 3, z * 3) - 0.5);
    bp.setXYZ(i, x * f, y * f * (y < 0.3 ? 0.7 : 1), z * f);
  }
  bowl.computeVertexNormals();
  const hoodOuter = new THREE.Mesh(bowl, coat);
  const hoodInner = new THREE.Mesh(bowl, lining);
  hoodInner.scale.setScalar(0.94);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(Math.sin(Math.PI * 0.55), 0.06, 8, 40), coat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = Math.cos(Math.PI * 0.55);
  hoodGroup.add(hoodOuter, hoodInner, rim);
  // the bowl's axis points out of her back: wide, tall and shallow, lying flat below the collar
  hoodGroup.scale.set(0.12, 0.05, 0.1);
  hoodGroup.rotation.x = Math.PI / 2 - 0.15;
  hoodGroup.position.set(0, 0.885, 0.092);
  girl.add(hoodGroup);

  // --- arms: sleeves bent a little at the elbow, cuffs, small hands ------------------------------
  const arm = (s) => {
    const shoulder = new THREE.Vector3(s * 0.15, 0.925, 0.0);
    const elbow = new THREE.Vector3(s * 0.19, 0.76, 0.02);
    const wrist = new THREE.Vector3(s * 0.2, 0.615, s > 0 ? -0.07 : -0.02);
    const mid1 = shoulder.clone().lerp(elbow, 0.5).add(new THREE.Vector3(s * 0.01, 0, 0));
    const { geometry } = taperedTube([shoulder, mid1, elbow, elbow.clone().lerp(wrist, 0.5), wrist],
      [0.05, 0.048, 0.045, 0.044, 0.048], { radial: 16, perSegment: 5, knot: 0.1, seed: s + 5 });
    girl.add(new THREE.Mesh(geometry, coat));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.032, 14, 10), skin);
    hand.scale.set(0.75, 1.2, 0.95);
    hand.position.copy(wrist).add(new THREE.Vector3(0, -0.035, -0.008));
    girl.add(hand);
    return hand.position.clone();
  };
  arm(-1);
  const grip = arm(1);   // her right hand (+x when she faces -z) holds the stick
  // the dowsing stick: a forked twig, held loosely, pointing ahead and down
  {
    const tip = grip.clone().add(new THREE.Vector3(0.05, -0.2, -0.3));
    const fork = grip.clone().add(new THREE.Vector3(0.01, -0.01, -0.03));
    const g1 = taperedTube([grip.clone().add(new THREE.Vector3(-0.02, 0.06, 0.05)), fork, fork.clone().lerp(tip, 0.5).add(new THREE.Vector3(0.01, 0.01, 0)), tip], [0.009, 0.008, 0.007, 0.004], { radial: 6, perSegment: 4, knot: 0.25, seed: 71 });
    const g2 = taperedTube([fork, fork.clone().add(new THREE.Vector3(0.07, 0.05, -0.02)), fork.clone().add(new THREE.Vector3(0.1, 0.12, -0.01))], [0.006, 0.005, 0.003], { radial: 5, perSegment: 4, knot: 0.25, seed: 72 });
    girl.add(new THREE.Mesh(mergeGeometries([g1.geometry, g2.geometry]), wood));
  }

  // --- legs and rain boots ------------------------------------------------------------------------
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.043, 0.036, 0.3, 14), tights);
    leg.position.set(s * 0.065, 0.4, 0);
    girl.add(leg);
    const boot = new THREE.Mesh(lathe([[0.0, 0.0], [0.05, 0.0], [0.056, 0.02], [0.052, 0.12], [0.05, 0.22], [0.054, 0.265], [0.05, 0.27], [0.044, 0.27]], { segments: 28, depthScale: 1.1 }), boots);
    boot.position.set(s * 0.068, 0, 0.01);
    girl.add(boot);
    const toe = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), boots);
    toe.scale.set(0.048, 0.07, 0.1);
    toe.position.set(s * 0.068, 0.0, -0.05);
    girl.add(toe);
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.21), new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.9 }));
    sole.position.set(s * 0.068, 0.01, -0.035);
    girl.add(sole);
  }

  // --- head, neck, hair, clip ---------------------------------------------------------------------
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.036, 0.09, 12), skin);
  neck.position.y = 1.06;
  girl.add(neck);
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.18;
  girl.add(headGroup);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 28, 20), skin);
  head.scale.set(0.95, 1.08, 1.02);
  headGroup.add(head);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), skin);
    ear.scale.set(0.5, 1, 0.8);
    ear.position.set(s * 0.094, 0.0, 0.005);
    headGroup.add(ear);
  }
  const under = new THREE.Mesh(
    lathe([[0.0, 0.118], [0.06, 0.11], [0.1, 0.075], [0.114, 0.02], [0.116, -0.04], [0.114, -0.085], [0.1, -0.09]], { segments: 40 }),
    new THREE.MeshStandardMaterial({ color: 0x151f62, roughness: 0.7, side: THREE.DoubleSide, bumpMap: hairMat.bumpMap, bumpScale: 2 }),
  );
  under.position.z = 0.006;
  headGroup.add(under);
  const hair = new THREE.Mesh(hairClumps(), hairMat);
  headGroup.add(hair);
  // the dragonfly clip, above her right ear where the camera can catch it
  const clip = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x86e0c8, roughness: 0.25, metalness: 0.5, emissive: 0x143c32 });
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
  clip.position.set(0.124, 0.045, 0.01);
  clip.rotation.set(0.2, 1.3, -0.5);
  headGroup.add(clip);

  girl.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { girl, headGroup, hair };
}
