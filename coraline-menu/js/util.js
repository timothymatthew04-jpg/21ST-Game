// Seeded randomness and noise shared by every generator, so each render of the menu is identical.
import * as THREE from 'three';

export function rng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.range = (lo, hi) => lo + (hi - lo) * next();
  next.pick = (arr) => arr[Math.floor(next() * arr.length)];
  next.sign = () => (next() < 0.5 ? -1 : 1);
  return next;
}

// Value noise on an integer lattice that wraps every `period` cells, so textures tile seamlessly.
const PERM = new Uint8Array(512);
{
  const r = rng(1337);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
}
const lattice = (x, y) => PERM[(PERM[x & 255] + y) & 255] / 255;
const lattice3 = (x, y, z) => PERM[(PERM[(PERM[x & 255] + y) & 255] + z) & 255] / 255;
const fade = (t) => t * t * (3 - 2 * t);

export function noise2(x, y, period = 256) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = fade(x - xi), yf = fade(y - yi);
  const m = (v) => ((v % period) + period) % period;
  const x0 = m(xi), x1 = m(xi + 1), y0 = m(yi), y1 = m(yi + 1);
  const a = lattice(x0, y0), b = lattice(x1, y0), c = lattice(x0, y1), d = lattice(x1, y1);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
}

export function fbm2(x, y, octaves = 5, period = 256) {
  let sum = 0, amp = 0.5, norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise2(x, y, period);
    norm += amp;
    x *= 2; y *= 2; period *= 2; amp *= 0.5;
  }
  return sum / norm;
}

export function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi);
  const l = (dx, dy, dz) => lattice3(xi + dx, yi + dy, zi + dz);
  const lerp = (a, b, t) => a + (b - a) * t;
  return lerp(
    lerp(lerp(l(0, 0, 0), l(1, 0, 0), xf), lerp(l(0, 1, 0), l(1, 1, 0), xf), yf),
    lerp(lerp(l(0, 0, 1), l(1, 0, 1), xf), lerp(l(0, 1, 1), l(1, 1, 1), xf), yf),
    zf,
  );
}

export function fbm3(x, y, z, octaves = 4) {
  let sum = 0, amp = 0.5, norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise3(x, y, z);
    norm += amp;
    x *= 2.03; y *= 2.03; z *= 2.03; amp *= 0.5;
  }
  return sum / norm;
}

export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const smoothstep = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
export const lerp = (a, b, t) => a + (b - a) * t;

// Box-projected UVs in metres, so a texture keeps the same scale on every wall, step and roof.
export function worldUV(geometry, metresPerRepeat = 1) {
  const pos = geometry.attributes.position;
  const nor = geometry.attributes.normal;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const ax = Math.abs(nor.getX(i)), ay = Math.abs(nor.getY(i)), az = Math.abs(nor.getZ(i));
    let u, v;
    if (ax >= ay && ax >= az) { u = z; v = y; }
    else if (ay >= az) { u = x; v = z; }
    else { u = x; v = y; }
    uv[i * 2] = u / metresPerRepeat;
    uv[i * 2 + 1] = v / metresPerRepeat;
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geometry;
}

// A tube whose radius tapers along a curve, with knotty bumps: used for tree limbs and roots.
export function taperedTube(points, radii, { radial = 10, perSegment = 4, knot = 0.18, seed = 1 } = {}) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  const steps = Math.max(2, (points.length - 1) * perSegment);
  const frames = curve.computeFrenetFrames(steps, false);
  const positions = [], normals = [], uvs = [], index = [];
  const r = rng(seed);
  const phase = r() * 100;
  const length = curve.getLength();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = curve.getPointAt(t);
    const n = frames.normals[i], b = frames.binormals[i];
    const ri = t * (radii.length - 1);
    const i0 = Math.floor(ri), i1 = Math.min(radii.length - 1, i0 + 1);
    const baseR = lerp(radii[i0], radii[i1], ri - i0);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const bump = 1 + knot * (noise3(Math.cos(a) * 1.3 + phase, Math.sin(a) * 1.3, t * length * 1.7) - 0.5) * 2;
      const rr = baseR * bump;
      const nx = Math.cos(a) * n.x + Math.sin(a) * b.x;
      const ny = Math.cos(a) * n.y + Math.sin(a) * b.y;
      const nz = Math.cos(a) * n.z + Math.sin(a) * b.z;
      positions.push(p.x + nx * rr, p.y + ny * rr, p.z + nz * rr);
      normals.push(nx, ny, nz);
      uvs.push((j / radial) * Math.max(1, Math.round(baseR * 6.28 / 0.6)), (t * length) / 1.2);
    }
  }
  for (let i = 0; i < steps; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j, b = a + radial + 1;
      index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(index);
  g.computeVertexNormals();
  return { geometry: g, curve };
}
