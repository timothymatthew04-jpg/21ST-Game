#!/usr/bin/env node
/*
 * Extracts the coastlines the journey map needs (Europe to Japan) from Natural Earth
 * land polygons, simplified and rounded, into tools/paint/data/eurasia.json.
 *
 *   npm pack world-atlas@2 && tar xzf world-atlas-*.tgz
 *   node tools/extract-map.js package/land-50m.json
 *
 * Natural Earth is in the public domain; world-atlas (ISC) packages it as TopoJSON.
 */
const fs = require('fs');
const path = require('path');

const [src] = process.argv.slice(2);
if (!src) { console.error('usage: node tools/extract-map.js land-50m.json'); process.exit(1); }
const topo = JSON.parse(fs.readFileSync(src, 'utf8'));
const BOX = { w: -16, e: 156, s: -6, n: 74 };
const TOLERANCE = 0.12; // degrees

// decode the delta-encoded, quantized arcs
const { scale, translate } = topo.transform;
const arcs = topo.arcs.map((arc) => {
  let x = 0, y = 0;
  return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * scale[0] + translate[0], y * scale[1] + translate[1]]; });
});
const ring = (ids) => {
  const out = [];
  for (const id of ids) {
    const a = id < 0 ? arcs[~id].slice().reverse() : arcs[id];
    out.push(...(out.length ? a.slice(1) : a));
  }
  return out;
};

function simplify(pts, tol) {
  if (pts.length < 4) return pts;
  // a closed ring: split it at the point farthest from its start, and simplify each half
  const [sx, sy] = pts[0], [ex, ey] = pts[pts.length - 1];
  if (sx === ex && sy === ey) {
    let m = 1, far = -1;
    pts.forEach(([x, y], i) => { const d = Math.hypot(x - sx, y - sy); if (d > far) { far = d; m = i; } });
    return [...simplify(pts.slice(0, m + 1), tol), ...simplify(pts.slice(m), tol).slice(1)];
  }
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let best = -1, bi = -1;
    const [x1, y1] = pts[a], [x2, y2] = pts[b];
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1e-9;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / len;
      if (d > best) { best = d; bi = i; }
    }
    if (best > tol) { keep[bi] = 1; stack.push([a, bi], [bi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

const polys = [];
const geoms = topo.objects.land.geometries || [topo.objects.land];
for (const g of geoms) {
  const list = g.type === 'Polygon' ? [g.arcs] : g.type === 'MultiPolygon' ? g.arcs : [];
  for (const poly of list) {
    const outer = ring(poly[0]);
    const lons = outer.map((p) => p[0]), lats = outer.map((p) => p[1]);
    if (Math.max(...lons) < BOX.w || Math.min(...lons) > BOX.e || Math.max(...lats) < BOX.s || Math.min(...lats) > BOX.n) continue;
    const rings = poly.map((ids) => simplify(ring(ids), TOLERANCE)).filter((r) => r.length >= 4);
    // skip specks
    if (!rings.length) continue;
    const area = Math.abs(rings[0].reduce((s, p, i) => { const q = rings[0][(i + 1) % rings[0].length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2);
    if (!rings.length || area < 0.4) continue;
    polys.push(rings.map((r) => r.map(([x, y]) => [+x.toFixed(2), +y.toFixed(2)])));
  }
}
const out = path.join(__dirname, 'paint/data/eurasia.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ source: 'Natural Earth 1:50m land (public domain), via world-atlas', polygons: polys }));
console.log(`${polys.length} polygons, ${fs.statSync(out).size} bytes`);
