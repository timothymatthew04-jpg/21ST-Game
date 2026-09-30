// The loop's clock, shared by the 3D scene and the menu overlay, so the menu can be laid over
// saved background frames and still react to the lightning exactly as it did.
const params = new URLSearchParams(location.search);
const num = (k, d) => (params.has(k) ? parseFloat(params.get(k)) : d);

export const LOOP = 16;   // seconds; every motion completes whole cycles in this time

// The storm: the hand reaches out of the cloud, later a bolt falls far behind the house,
// then the cloud there flickers once more without a bolt.
const STRIKES = [
  { t: 4.0, kind: 'hand', pulses: [[0, 1], [0.11, 0.55], [0.3, 0.95], [0.52, 0.4]] },
  { t: 10.6, kind: 'bolt', pulses: [[0, 1], [0.09, 0.5], [0.24, 0.8]] },
  { t: 13.3, kind: 'sheet', pulses: [[0, 0.35], [0.14, 0.2]] },
];

// each strike is a quick run of flickers
export function flashAt(t) {
  const out = { hand: 0, bolt: 0, sheet: 0 };
  for (const { t: s, kind, pulses } of STRIKES) {
    for (const [dt, amp] of pulses) {
      const x = (((t - s - dt) % LOOP) + LOOP) % LOOP;
      if (x < 1.2) out[kind] = Math.max(out[kind], amp * Math.exp(-x / 0.07));
    }
  }
  if (params.has('flash')) out.hand = num('flash', 0);
  if (params.has('flash2')) out.bolt = num('flash2', 0);
  return out;
}

// The CSS variables the menu animates with: the lightning glow, the crawling stitches, the pulse.
export function setOverlay(t) {
  const u = t / LOOP;
  const f = flashAt(t);
  const root = document.documentElement.style;
  root.setProperty('--flash', Math.max(f.hand, Math.max(f.bolt, f.sheet) * 0.5).toFixed(3));
  root.setProperty('--u', u.toFixed(4));
  root.setProperty('--pulse', (0.5 + 0.5 * Math.sin(u * Math.PI * 2 * 4)).toFixed(3));
}
