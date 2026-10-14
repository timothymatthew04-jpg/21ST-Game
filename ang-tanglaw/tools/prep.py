#!/usr/bin/env python3
"""Splits the Ang Tanglaw logo into the layers the animation moves.

    python3 tools/prep.py path/to/Draw-Bridge.pdf     # the Canva export
    python3 tools/prep.py                             # re-run from assets/source.png

Canva exports the whole logo as one picture with a soft mask, placed on a maroon page. This takes
that picture (clipped like the page clips it), and writes to assets/:

  source.png        the logo picture as the page shows it
  layers/flame.png  the phoenix flame
  layers/body.png   cup, bowl, handle and rings, with the handle filled in behind the lettering
  layers/arrival.png  when each part of the flame catches fire (16-bit, 0 at the spark)
  layers/letter-*.png  every letter of ANG and TANGLAW on its own
  layout.json       where everything sits, in picture pixels

Needs numpy, scipy, opencv-python and pillow (and pdfimages from poppler for a PDF).
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from scipy.sparse import coo_matrix
from scipy.ndimage import distance_transform_edt
from scipy.sparse.csgraph import dijkstra

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'assets'
LAYERS = ASSETS / 'layers'

# Where the PDF places the picture on its 1440 x 810 pt page: scale, x, y (from the content stream),
# and the page's clip, which hides a credit line under the logo.
PLACE = {'scale': 0.570833, 'x': 189.012419, 'y': -42.475298}
PAGE = {'width': 1440, 'height': 810, 'clipBottom': 729.273438}
BACKGROUND = [113, 22, 16]          # rgb(44.31%, 8.63%, 6.27%)
CREAM = np.array([248, 246, 242], np.float32)


def load(arg):
    if arg is None:
        return np.array(Image.open(ASSETS / 'source.png').convert('RGBA'))
    if arg.lower().endswith('.pdf'):
        with tempfile.TemporaryDirectory() as tmp:
            subprocess.run(['pdfimages', '-png', arg, f'{tmp}/img'], check=True)
            rgb = np.array(Image.open(f'{tmp}/img-000.png').convert('RGB'))
            mask = np.array(Image.open(f'{tmp}/img-001.png').convert('L'))
        img = np.dstack([rgb, mask])
    else:
        img = np.array(Image.open(arg).convert('RGBA'))
    bottom = int(np.ceil((PAGE['clipBottom'] - PLACE['y']) / PLACE['scale']))
    return img[:bottom].copy()


def save(name, rgba):
    Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), 'RGBA').save(LAYERS / name, optimize=True)


def crop_box(mask, pad):
    ys, xs = np.where(mask)
    h, w = mask.shape
    return [max(int(xs.min()) - pad, 0), max(int(ys.min()) - pad, 0),
            min(int(xs.max()) + pad + 1, w), min(int(ys.max()) + pad + 1, h)]


def main():
    img = load(sys.argv[1] if len(sys.argv) > 1 else None)
    ASSETS.mkdir(exist_ok=True)
    LAYERS.mkdir(exist_ok=True)
    Image.fromarray(img, 'RGBA').save(ASSETS / 'source.png', optimize=True)

    rgb = img[..., :3].astype(np.float32)
    alpha = img[..., 3].astype(np.float32) / 255
    h, w = alpha.shape
    yy, xx = np.mgrid[0:h, 0:w]

    # The flame floats a few pixels above the cup: split at the middle of that empty band.
    rows = (alpha > 0.02).sum(1)
    empty = [y for y in range(h // 4, h // 2) if rows[y] == 0]
    split = (empty[0] + empty[-1]) // 2
    below = yy >= split

    # Lettering: the cream pixels below the flame (the phoenix's white eye is above it).
    strong = (rgb.min(2) > 200) & (alpha > 0.5) & below
    n, lab, stats, _ = cv2.connectedComponentsWithStats(strong.astype(np.uint8), 8)
    comps = [i for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] > 500]
    tops = sorted({int(stats[i, cv2.CC_STAT_TOP]) for i in comps})
    line_top = {'ANG': tops[0], 'TANGLAW': tops[-1]}
    words = {}
    for word in ('ANG', 'TANGLAW'):
        mine = [i for i in comps if abs(stats[i, cv2.CC_STAT_TOP] - line_top[word]) < 40]
        words[word] = [lab == i for i in sorted(mine, key=lambda i: stats[i, cv2.CC_STAT_LEFT])]

    # L and A of TANGLAW touch at the baseline: cut them apart along the A's left edge.
    if len(words['TANGLAW']) == 6:
        k = max(range(6), key=lambda i: np.ptp(np.where(words['TANGLAW'][i])[1]))
        both = words['TANGLAW'][k]
        ys, xs = np.where(both)
        top, height = ys.min(), np.ptp(ys)
        edge = []
        for y in range(top + 8, top + int(height * 0.6)):
            run = np.where(both[y])[0]
            gaps = np.where(np.diff(run) > 1)[0]
            if len(gaps):
                edge.append((y, run[gaps[0] + 1]))
        m, c = np.polyfit([e[0] for e in edge], [e[1] for e in edge], 1)
        right = xx >= m * yy + c - 0.5
        words['TANGLAW'][k:k + 1] = [both & ~right, both & right]

    # How much of each pixel is lettering: lettering over the handle is mixed with the handle's
    # brown, elsewhere it is cream with the picture's own alpha.
    letters = words['ANG'] + words['TANGLAW']
    handle_color = np.median(rgb[below & (alpha > 0.95) & (rgb.sum(2) < 160)], 0)
    d = CREAM - handle_color
    unmix = np.clip(((rgb - handle_color) @ d) / (d @ d), 0, 1)
    coverage = alpha * unmix
    dist = np.stack([cv2.distanceTransform((~m).astype(np.uint8), cv2.DIST_L2, 5) for m in letters])
    owner = dist.argmin(0)
    near = dist.min(0) <= 4
    text_cov = np.where(near & below, coverage, 0)

    layout = {
        'page': PAGE, 'place': PLACE, 'background': BACKGROUND, 'cream': CREAM.tolist(),
        'size': [w, h], 'split': split, 'letters': [],
    }
    for i, m in enumerate(letters):
        word = 'ANG' if i < len(words['ANG']) else 'TANGLAW'
        cov = np.where(owner == i, text_cov, 0)
        box = crop_box(cov > 0.01, 3)
        x0, y0, x1, y1 = box
        piece = np.zeros((y1 - y0, x1 - x0, 4), np.float32)
        piece[..., :3] = CREAM
        piece[..., 3] = cov[y0:y1, x0:x1] * 255
        name = f'letter-{i:02d}.png'
        save(name, piece)
        ys, xs = np.where(m)
        layout['letters'].append({
            'file': name, 'word': word, 'box': box,
            'ink': [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1],
        })
    text_any = cv2.dilate((text_cov > 0.002).astype(np.uint8), np.ones((3, 3), np.uint8)) > 0

    # Torch body. The handle runs down behind "LA": rebuild its hidden part as the convex hull of
    # what shows (it is one flat colour), and lay it under the letters.
    handle = below & (alpha > 0.95) & ~text_any & (np.abs(rgb - handle_color).max(2) < 18)
    # Its two sides are straight: fit them where nothing covers them (above the lettering, between
    # the rings), and round off the bottom where the last of it shows between L and A.
    hy, hx = np.where(handle)
    clear = hy < line_top['TANGLAW'] - 4
    edges = {'left': [], 'right': []}
    for y in np.unique(hy[clear]):
        run = hx[hy == y]
        if np.ptp(run) + 1 == len(run):          # one unbroken run: both sides show
            edges['left'].append((y, run.min()))
            edges['right'].append((y, run.max() + 1))
    side = {}
    for name, pts in edges.items():
        y_, x_ = np.array(pts, np.float64).T
        fit = np.polyfit(y_, x_, 1)
        keep = np.abs(np.polyval(fit, y_) - x_) < 1.5
        side[name] = np.polyfit(y_[keep], x_[keep], 1)
    top, bottom, r = hy.min() - 2, hy.max() + 1, 14
    ys = np.linspace(top, bottom - r, 40)
    arc = np.linspace(0, np.pi / 2, 12)
    lb, rb = np.polyval(side['left'], bottom - r), np.polyval(side['right'], bottom - r)
    outline = ([(np.polyval(side['left'], y), y) for y in ys]
               + [(lb + r - r * np.cos(t), bottom - r + r * np.sin(t)) for t in arc]
               + [(rb - r + r * np.sin(t), bottom - r + r * np.cos(t)) for t in arc]
               + [(np.polyval(side['right'], y), y) for y in ys[::-1]])
    big = np.zeros((h * 4, w * 4), np.uint8)
    cv2.fillPoly(big, [np.round((np.array(outline) * 4 - 0.5) * 16).astype(np.int32)], 255,
                 lineType=cv2.LINE_AA, shift=4)
    hull_a = cv2.resize(big, (w, h), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    body = np.zeros((h, w, 4), np.float32)
    body[..., :3] = np.where(text_any[..., None], handle_color, rgb)
    body[..., 3] = np.where(text_any, hull_a, alpha) * below
    body[..., 3][~below] = 0
    body_box = crop_box(body[..., 3] > 0.01, 4)
    x0, y0, x1, y1 = body_box
    body[..., 3] *= 255
    save('body.png', body[y0:y1, x0:x1])

    # Flame: everything above the split.
    flame_a = np.where(below, 0, alpha)
    flame_box = crop_box(flame_a > 0.01, 6)
    fx0, fy0, fx1, fy1 = flame_box
    flame = np.dstack([rgb, flame_a * 255])[fy0:fy1, fx0:fx1]
    save('flame.png', flame)

    # The spark lands on the middle of the cup's rim; fire spreads from there through the flame,
    # faster upwards than sideways, so the tips of the feathers and the phoenix's beak light last.
    rim = np.where(alpha[split + 8] > 0.5)[0]
    ignite = [float((rim.min() + rim.max()) / 2), float(split)]
    s = 2
    fa = cv2.resize(flame_a[fy0:fy1, fx0:fx1], None, fx=1 / s, fy=1 / s, interpolation=cv2.INTER_AREA)
    inside = cv2.dilate((fa > 0.25).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    idx = -np.ones(inside.shape, np.int64)
    idx[inside] = np.arange(inside.sum())
    src, dst, cost = [], [], []
    # 16 directions, so the fire spreads in rounded fronts rather than octagons
    for dy, dx in ((0, 1), (1, 0), (1, 1), (1, -1), (1, 2), (2, 1), (1, -2), (2, -1)):
        a0 = idx[max(-dy, 0):inside.shape[0] - max(dy, 0), max(-dx, 0):inside.shape[1] - max(dx, 0)]
        a1 = idx[max(dy, 0):, max(dx, 0):][:a0.shape[0], :a0.shape[1]]
        ok = (a0 >= 0) & (a1 >= 0)
        step = np.hypot(dx, dy)
        src += [a0[ok], a1[ok]]
        dst += [a1[ok], a0[ok]]
        # going up (towards a smaller y) is cheaper than coming down
        cost += [np.full(ok.sum(), step * (1.3 if dy else 1.0)), np.full(ok.sum(), step * (0.75 if dy else 1.0))]
    graph = coo_matrix((np.concatenate(cost), (np.concatenate(src), np.concatenate(dst))),
                       shape=(inside.sum(),) * 2).tocsr()
    sy, sx = np.where(inside)
    seed = np.argmin(np.hypot(sx - (ignite[0] - fx0) / s, sy - (ignite[1] - fy0) / s))
    far = dijkstra(graph, indices=seed)
    arr = np.full(inside.shape, np.nan, np.float32)
    arr[inside] = far
    arr /= np.nanpercentile(arr, 99.5)
    # outside the flame, take the nearest value inside it, so its edges light with it
    near_in = distance_transform_edt(np.isnan(arr), return_distances=False, return_indices=True)
    arr = arr[tuple(near_in)]
    arr = cv2.resize(arr, (fx1 - fx0, fy1 - fy0), interpolation=cv2.INTER_LINEAR)
    # soften it, and let the front waver a little, as fire does
    arr = cv2.GaussianBlur(arr, (0, 0), 5)
    rng = np.random.default_rng(3)
    wobble = cv2.resize(rng.standard_normal(((fy1 - fy0) // 28 + 2, (fx1 - fx0) // 28 + 2)).astype(np.float32),
                        (fx1 - fx0, fy1 - fy0), interpolation=cv2.INTER_CUBIC)
    arr = arr + 0.03 * wobble
    Image.fromarray((np.clip(arr / 1.2, 0, 1) * 65535).astype(np.uint16)).save(LAYERS / 'arrival.png')

    eye = (rgb.min(2) > 235) & (alpha > 0.5) & ~below
    ey, ex = np.where(eye)
    layout.update({
        'flame': {'file': 'flame.png', 'box': flame_box, 'arrival': 'arrival.png', 'arrivalMax': 1.2},
        'body': {'file': 'body.png', 'box': body_box},
        'ignite': ignite,
        'handleTip': [float((lb + rb) / 2), float(bottom)],
        'eye': [float(ex.mean()), float(ey.mean())],
        'baseline': {word: max(l['ink'][3] for l in layout['letters'] if l['word'] == word) for word in words},
    })
    (ASSETS / 'layout.json').write_text(json.dumps(layout, indent=1))
    print(f'split at y={split}, {len(letters)} letters, flame {flame_box}, body {body_box}, ignite {ignite}')


if __name__ == '__main__':
    main()
