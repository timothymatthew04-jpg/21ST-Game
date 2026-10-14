#!/usr/bin/env python3
"""Renders the Ang Tanglaw logo reveal.

A comet of fire tears up the dark torch, heating its edges like metal, and slams into the cup: the
phoenix flame erupts, its light floods the frame maroon and the phoenix opens a blazing eye. The
camera pulls back. A blade of fire cuts TANGLAW open in molten letters and ANG slams down above it.
A sheen crosses the logo, then everything lands at once: the flame flares, the eye blazes and the
logo holds, burning hard, until one last flare ends it.

    python3 tools/render.py --stills 0.5,0.95,1.35,2.75,4.15,8.9 --out previews/
    python3 tools/render.py --frames frames/ --mp4 export/ang-tanglaw.mp4 --audio export/ang-tanglaw.wav \\
        --silent export/ang-tanglaw-silent.mp4

Every frame depends only on its time, so frames render in parallel and in any order.
Needs numpy, opencv-python and pillow, and ffmpeg for the MP4.
"""
import argparse
import json
import os
import subprocess
from multiprocessing import Pool
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
W, H, FPS, DURATION = 1920, 1080, 60, 9.0

# Timeline, in seconds
LAUNCH = 0.15                      # a comet of fire tears up the torch...
IGNITE = 0.85                      # ...and slams into the cup: the flame erupts
FLAME_GROW = 0.55
EYE_FLARE = 1.30                   # the phoenix opens a blazing eye
PULL_START, PULL_LEN = 1.05, 1.6   # the camera pulls back to the whole torch
SLASH, SLASH_LEN = 2.60, 0.30      # a blade of fire cuts TANGLAW open
ANG_START, ANG_FALL = 2.95, 0.26   # ANG slams down, letter by letter
SWEEP_START, SWEEP_LEN = 3.35, 0.6
LOCK = 4.10                        # everything lands: the flame flares, the eye blazes
TWINKLE = 6.45                     # the eye glints again while the logo holds
BUTTON = 8.55                      # one last flare to end on

SLASH_X = (300.0, 1470.0)          # where the blade enters and leaves, picture px


def ang_landing(j):
    return ANG_START + 0.06 * j + ANG_FALL


HOT = np.array([1.0, 0.93, 0.76], np.float32)
WARM = np.array([1.0, 0.56, 0.22], np.float32)
EMBER = np.array([1.0, 0.5, 0.14], np.float32)
DEEP = np.array([0.85, 0.2, 0.07], np.float32)
DARK = np.array([0.012, 0.006, 0.005], np.float32)
FIRE = [np.array(c, np.float32) for c in ((0.80, 0.15, 0.07), (0.97, 0.40, 0.11), (1.0, 0.72, 0.26))]
MOLTEN = np.array([1.0, 0.52, 0.16], np.float32)


# ---------------------------------------------------------------- easing

def clamp01(x):
    return np.clip(x, 0.0, 1.0)


def smooth(e0, e1, x):
    u = clamp01((x - e0) / (e1 - e0))
    return u * u * (3 - 2 * u)


def out_cubic(u):
    return 1 - (1 - clamp01(u)) ** 3


def out_expo(u):
    u = clamp01(u)
    return 1 - 2 ** (-10 * u) if u < 1 else 1.0


def in_cubic(u):
    return clamp01(u) ** 3


def in_out_sine(u):
    return 0.5 - 0.5 * np.cos(np.pi * clamp01(u))


def out_back(u, s=1.2):
    u = clamp01(u) - 1
    return 1 + (s + 1) * u ** 3 + s * u ** 2


def bezier(x1, y1, x2, y2):
    """CSS cubic-bezier easing."""
    def f(u):
        u = float(clamp01(u))
        t = u
        for _ in range(8):
            x = 3 * (1 - t) ** 2 * t * x1 + 3 * (1 - t) * t * t * x2 + t ** 3 - u
            dx = 3 * (1 - t) ** 2 * x1 + 6 * (1 - t) * t * (x2 - x1) + 3 * t * t * (1 - x2)
            if abs(dx) < 1e-6:
                break
            t = min(max(t - x / dx, 0.0), 1.0)
        return 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t * t * y2 + t ** 3
    return f


comet_ease = bezier(0.55, 0.0, 0.85, 0.75)   # launches, then still accelerating when it hits
pull_ease = bezier(0.6, 0.0, 0.2, 1.0)       # a hard pull that settles with authority


def after(t, t0, tau):
    """A decay that starts at t0."""
    return float(np.exp(-(t - t0) / tau)) if t >= t0 else 0.0


# ---------------------------------------------------------------- assets and geometry

def load_layer(name):
    rgba = np.array(Image.open(ROOT / 'assets' / 'layers' / name).convert('RGBA')).astype(np.float32) / 255
    return rgba[..., :3].copy(), rgba[..., 3].copy()


class Logo:
    def __init__(self):
        lay = json.loads((ROOT / 'assets' / 'layout.json').read_text())
        self.lay = lay
        self.k = lay['place']['scale'] * W / lay['page']['width']          # picture px -> frame px
        self.o = np.array([lay['place']['x'], lay['place']['y']]) * W / lay['page']['width']
        self.maroon = np.array(lay['background'], np.float32) / 255
        self.cream = np.array(lay['cream'], np.float32) / 255

        # the picture-space canvas everything is composed on, with room for the letters to move
        self.cx0, self.cy0, self.cx1, self.cy1 = 180, 60, 1480, 1345
        self.cw, self.ch = self.cx1 - self.cx0, self.cy1 - self.cy0

        self.body_rgb, self.body_a = load_layer(lay['body']['file'])
        self.body_box = lay['body']['box']
        bx0, by0, bx1, by1 = self.body_box
        self.body_xy = np.meshgrid(np.arange(bx0, bx1) + 0.5, np.arange(by0, by1) + 0.5)
        shifted = np.zeros_like(self.body_a)
        shifted[5:] = self.body_a[:-5]
        self.rim_edge = cv2.GaussianBlur(np.clip(self.body_a - shifted, 0, 1), (0, 0), 1.2)
        inner = cv2.erode(self.body_a, np.ones((7, 7), np.uint8))
        self.outline = cv2.GaussianBlur(np.clip(self.body_a - inner, 0, 1), (0, 0), 1.0)

        rgb, a = load_layer(lay['flame']['file'])
        self.flame = np.dstack([rgb * a[..., None], a])            # premultiplied
        arrival = np.array(Image.open(ROOT / 'assets' / 'layers' / lay['flame']['arrival'])).astype(np.float32)
        arrival = arrival / 65535 * lay['flame']['arrivalMax']
        eye = ((rgb.min(2) > 0.9) & (a > 0.5)).astype(np.float32)
        eye = cv2.GaussianBlur(cv2.dilate(eye, np.ones((3, 3), np.uint8)), (0, 0), 1.2)
        self.flame_aux = np.dstack([arrival, eye])                 # when each part catches; the eye
        fx0, fy0, fx1, fy1 = lay['flame']['box']
        pad = 60
        self.flame_box = (fx0 - pad, fy0 - pad, fx1 + pad, fy1 + pad)
        gx, gy = np.meshgrid(np.arange(self.flame_box[0], self.flame_box[2], dtype=np.float32),
                             np.arange(self.flame_box[1], self.flame_box[3], dtype=np.float32))
        self.fgx, self.fgy = gx, gy
        self.ignite = np.array(lay['ignite'], np.float32) - (0, 2)
        # the feathers sway more towards their tips; the phoenix's head holds still
        self.sway = (clamp01((self.ignite[1] - gy) / (self.ignite[1] - fy0)) ** 1.4) * (1 - smooth(1075, 1140, gx))

        # live fire around the flame: its silhouette smeared upwards, at half resolution
        ax0, ay0, ax1, ay1 = 520, -380, 1560, 760
        full = np.zeros((ay1 - ay0, ax1 - ax0), np.float32)
        full[fy0 - ay0:fy1 - ay0, fx0 - ax0:fx1 - ax0] = a
        small = cv2.resize(full, None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA)
        # a thin gap keeps the fire off the logo's own silhouette, so the phoenix always reads
        keep_out = cv2.GaussianBlur(cv2.dilate((small > 0.5).astype(np.float32), np.ones((9, 9), np.uint8)), (0, 0), 1.2)
        half = cv2.GaussianBlur(small, (0, 0), 9)
        decay = np.exp(-1 / 135)
        for r in range(half.shape[0] - 2, -1, -1):
            half[r] = np.maximum(half[r], half[r + 1] * decay)
        half = cv2.GaussianBlur(half, (0, 0), sigmaX=5, sigmaY=3)
        cols = ax0 + 2 * np.arange(half.shape[1]) + 1
        half *= 1 - 0.85 * smooth(1080, 1170, cols)[None, :]    # the fire rises off the feathers, not the head
        self.aura_maps = np.dstack([half / half.max(), keep_out]).astype(np.float32)
        self.aura_origin = (ax0, ay0)
        rng = np.random.default_rng(21)
        spec = np.fft.fft2(rng.standard_normal((256, 256)))
        fy_, fx_ = np.fft.fftfreq(256)[:, None], np.fft.fftfreq(256)[None, :]
        tex = np.real(np.fft.ifft2(spec * np.exp(-(fx_ ** 2 + fy_ ** 2) / (2 * 0.035 ** 2))))
        self.noise = ((tex - tex.min()) / np.ptp(tex)).astype(np.float32)

        self.letters = []
        for l in lay['letters']:
            _, a = load_layer(l['file'])
            self.letters.append({**l, 'a': a})
        tang = [l for l in self.letters if l['word'] == 'TANGLAW']
        self.slash_y = (min(l['ink'][1] for l in tang) + max(l['ink'][3] for l in tang)) / 2
        for word in ('ANG', 'TANGLAW'):
            for j, l in enumerate([l for l in self.letters if l['word'] == word]):
                l['index'] = j
        for l in tang:          # each letter opens as the blade passes its middle
            f = ((l['ink'][0] + l['ink'][2]) / 2 - SLASH_X[0]) / (SLASH_X[1] - SLASH_X[0])
            l['open'] = SLASH + SLASH_LEN * (1 - (1 - f) ** (1 / 3))
        self.eye = np.array(lay['eye'], np.float32) + (4, 0)
        self.tip = np.array(lay['handleTip'], np.float32) - (0, 16)
        self.flame_center = np.array([1030, 420], np.float32)
        self.torch_center = np.array([1048, 700], np.float32)

        # when the comet passes each row of the torch
        ts = np.linspace(LAUNCH, IGNITE, 800)
        ys = np.array([comet_pos(self, s)[1] for s in ts])
        self.t_pass = np.interp(np.arange(by0, by1) + 0.5, ys[::-1], ts[::-1])[:, None]

        # frame-space grids (continuous coordinates, pixel centres at +0.5)
        qy, qx = np.mgrid[0:H // 4, 0:W // 4].astype(np.float32)
        self.qx, self.qy = qx * 4 + 2, qy * 4 + 2
        r = np.hypot((self.qx - W / 2) / (W / 2), (self.qy - H / 2) / (H / 2)) / np.sqrt(2)
        self.vignette = 1 - 0.26 * r ** 2.2
        hy, hx = np.mgrid[0:H // 2, 0:W // 2].astype(np.float32)
        self.hx, self.hy = hx * 2 + 1, hy * 2 + 1
        fy2, fx2 = np.mgrid[0:H, 0:W].astype(np.float32)
        self.fx, self.fy = fx2, fy2

        self.particles = make_particles(self)

    def layout(self, p):
        return self.o + self.k * np.asarray(p, np.float32)


def comet_pos(logo, t):
    """Where the comet is (picture px) as it tears up the handle."""
    u = comet_ease((t - LAUNCH) / (IGNITE - LAUNCH))
    p = logo.tip + (logo.ignite - logo.tip) * u
    return p + (8 * np.sin(2 * np.pi * u) * np.sin(np.pi * u), 0)


def head_x(t):
    return SLASH_X[0] + (SLASH_X[1] - SLASH_X[0]) * out_cubic((t - SLASH) / SLASH_LEN)


def flame_scale(t):
    return 0.55 + 0.45 * out_back((t - IGNITE) / FLAME_GROW * 1.05, 1.5)


# ---------------------------------------------------------------- particles

def sparks(rng, n, t0, origin, angle, speed, drag, grav, life, gain):
    """A group of sparks: arrays of when and where they start and how they fly (layout px)."""
    t0 = np.broadcast_to(np.asarray(t0, float), (n,)).copy()
    origin = np.broadcast_to(np.asarray(origin, float), (n, 2)).copy()
    ang = rng.uniform(*angle, n)
    sp = rng.uniform(*speed, n)
    return dict(t0=t0, p0=origin, v=np.stack([np.cos(ang) * sp, np.sin(ang) * sp], 1),
                drag=rng.uniform(*drag, n), grav=np.full(n, float(grav)), life=rng.uniform(*life, n),
                gain=rng.uniform(*gain, n), flick=rng.uniform(8, 24, n), phase=rng.uniform(0, 6.3, n))


def make_particles(logo):
    rng = np.random.default_rng(11)
    lay = logo.layout
    ign = lay(logo.ignite)
    groups = []
    # sparks thrown off the comet as it climbs, falling away
    te = np.sort(rng.uniform(LAUNCH, IGNITE, 150))
    org = np.array([lay(comet_pos(logo, s)) for s in te]) + rng.uniform(-6, 6, (150, 2))
    g = sparks(rng, 150, te, org, (-np.pi, np.pi), (90, 520), (2.0, 3.2), 700, (0.25, 0.6), (0.5, 1.1))
    g['v'][:, 1] = np.abs(g['v'][:, 1]) * 0.6
    groups.append(g)
    # the eruption
    groups.append(sparks(rng, 190, IGNITE + rng.uniform(0, 0.08, 190), ign + rng.uniform(-30, 30, (190, 2)) * (1, 0.2),
                         (-np.pi * 0.95, -np.pi * 0.05), (300, 1500), (1.8, 3.2), -90, (0.4, 1.4), (0.7, 1.6)))
    # the blade throws sparks back and down as it cuts
    te = np.sort(rng.uniform(SLASH, SLASH + SLASH_LEN * 0.85, 100))
    org = np.array([lay((head_x(s), logo.slash_y)) for s in te])
    g = sparks(rng, 100, te, org, (np.pi * 0.75, np.pi * 1.35), (200, 900), (2.0, 3.0), 850, (0.3, 0.8), (0.6, 1.4))
    groups.append(g)
    # each letter of ANG lands with a few sparks
    for l in logo.letters:
        if l['word'] != 'ANG':
            continue
        base = lay(((l['ink'][0] + l['ink'][2]) / 2, l['ink'][3]))
        groups.append(sparks(rng, 14, ang_landing(l['index']) + rng.uniform(0, 0.03, 14),
                             base + rng.uniform(-40, 40, (14, 2)) * (1, 0), (-np.pi * 0.95, -np.pi * 0.05),
                             (120, 420), (2.5, 3.5), 900, (0.25, 0.5), (0.4, 0.9)))
    # the lockup and the last flare burst out of the flame
    for t0, n, s in ((LOCK, 130, 1.0), (BUTTON, 70, 0.8)):
        org = np.array([lay((rng.uniform(850, 1230), rng.uniform(260, 560))) for _ in range(n)])
        groups.append(sparks(rng, n, t0 + rng.uniform(0, 0.05, n), org, (-np.pi * 0.92, -np.pi * 0.08),
                             (200, 950 * s), (2.2, 3.2), -60, (0.5, 1.2), (0.6, 1.3)))
    # while it holds, the flame spits now and then
    t = LOCK + 0.9
    while t < DURATION - 0.3:
        org = lay((rng.uniform(860, 1180), rng.uniform(200, 330)))
        groups.append(sparks(rng, 12, t + rng.uniform(0, 0.05, 12), org + rng.uniform(-10, 10, (12, 2)),
                             (-np.pi * 0.8, -np.pi * 0.2), (150, 520), (1.8, 2.6), 380, (0.5, 0.9), (0.4, 0.8)))
        t += rng.uniform(0.9, 1.4)
    # embers drifting up off the flame
    n = 150
    fx0, fy0, fx1, fy1 = logo.lay['flame']['box']
    embers = dict(t0=np.sort(rng.uniform(IGNITE + 0.2, DURATION, n)),
                  p0=np.array([lay((rng.uniform(fx0 + 80, fx1 - 110), rng.uniform(fy0 + 60, fy1 - 150))) for _ in range(n)]),
                  vy=-rng.uniform(55, 150, n), sway=rng.uniform(6, 22, n), freq=rng.uniform(0.4, 1.1, n),
                  phase=rng.uniform(0, 6.3, n), life=rng.uniform(1.0, 2.4, n), gain=rng.uniform(0.35, 0.9, n),
                  flick=rng.uniform(5, 13, n))
    # fire puffs that blow out of the cup on ignition
    m = 40
    puffs = dict(t0=IGNITE + rng.uniform(0, 0.12, m), p0=ign + np.stack([rng.uniform(-90, 90, m), rng.uniform(-25, 5, m)], 1),
                 v=np.stack([rng.uniform(-280, 280, m), -rng.uniform(350, 1050, m)], 1), drag=rng.uniform(2.4, 3.4, m),
                 life=rng.uniform(0.3, 0.75, m), size=rng.uniform(6, 13, m), gain=rng.uniform(0.15, 0.32, m))
    return groups, embers, puffs


def spark_points(g, t, samples=8):
    """Positions (layout px) along each live spark's streak this frame, with colour and weight."""
    tau = t - g['t0']
    live = (tau >= 0) & (tau < g['life'])
    if not live.any():
        return None
    tau = tau[live]
    span = np.linspace(0, 0.5 / FPS, samples)                     # half-frame shutter
    ts = np.maximum(tau[:, None] - span[None, :], 0)
    k = g['drag'][live][:, None]
    e = (1 - np.exp(-k * ts)) / k
    x = g['p0'][live, 0][:, None] + g['v'][live, 0][:, None] * e
    y = g['p0'][live, 1][:, None] + g['v'][live, 1][:, None] * e + 0.5 * g['grav'][live][:, None] * ts * ts
    f = (tau / g['life'][live])[:, None]
    col = HOT + (EMBER - HOT) * np.minimum(f * 2.5, 1) + (DEEP - EMBER) * np.clip(f * 2 - 1, 0, 1)
    gain = g['gain'][live][:, None] * (1 - f) ** 1.4 * (0.8 + 0.2 * np.sin(g['flick'][live][:, None] * tau[:, None]
                                                                          + g['phase'][live][:, None]))
    return (x.ravel(), y.ravel(), np.repeat(col, samples, 0), np.repeat(gain, samples, 1).ravel() / samples)


def deposit(buf, xs, ys, cols, ws):
    """Add points with bilinear weights into a frame buffer (continuous frame coordinates)."""
    h, w = buf.shape[:2]
    fx, fy = xs - 0.5, ys - 0.5
    x0, y0 = np.floor(fx).astype(int), np.floor(fy).astype(int)
    ax, ay = fx - x0, fy - y0
    for ox, oy, wt in ((0, 0, (1 - ax) * (1 - ay)), (1, 0, ax * (1 - ay)), (0, 1, (1 - ax) * ay), (1, 1, ax * ay)):
        xi, yi = x0 + ox, y0 + oy
        ok = (xi >= 0) & (xi < w) & (yi >= 0) & (yi < h)
        np.add.at(buf, (yi[ok], xi[ok]), cols[ok] * (ws * wt)[ok][:, None])


# ---------------------------------------------------------------- the camera

SHAKES = [(LAUNCH, 4, 0.16), (IGNITE, 13, 0.3), (SLASH + SLASH_LEN * 0.5, 5, 0.18), (LOCK, 11, 0.28), (BUTTON, 6, 0.22)]


class Cam:
    def __init__(self, logo, zoom, rot, centre, shake):
        c, s = np.cos(rot), np.sin(rot)
        r = np.array([[c, -s], [s, c]])
        self.logo, self.zoom, self.zk = logo, zoom, zoom * logo.k
        self.A = r * self.zk                                          # picture px -> frame px
        self.b = r @ (zoom * (logo.o - centre)) + (W / 2, H / 2) + shake

    def src(self, p):
        return np.asarray(p, float) @ self.A.T + self.b

    def lay(self, p):
        return self.src((np.asarray(p, float) - self.logo.o) / self.logo.k)

    def canvas_matrix(self, scale=1.0):
        """Canvas pixel -> frame pixel (OpenCV convention), for a frame `scale` times full size."""
        c0 = np.array([self.logo.cx0 + 0.5, self.logo.cy0 + 0.5])
        return np.float32(np.hstack([self.A * scale, ((self.A @ c0 + self.b) * scale - 0.5)[:, None]]))


def camera(logo, t):
    ign = logo.layout(logo.ignite)
    follow = logo.layout(comet_pos(logo, max(t - 0.07, LAUNCH))) if t < IGNITE + 0.1 else ign
    close = follow - (0, 140)
    if t <= IGNITE:
        z = 2.75 - 0.45 * in_out_sine(t / IGNITE)
    else:
        z = 2.3 + 0.08 * out_cubic((t - IGNITE) / 0.6)
    rot = np.radians(-6 + 3.5 * in_out_sine(t / IGNITE))
    pull = pull_ease((t - PULL_START) / PULL_LEN)
    zoom = z + (1 - z) * pull
    rot *= 1 - pull
    centre = close + (np.array([W / 2, H / 2]) - close) * pull
    # lean in before the lockup, then slam back into place on it
    if 3.3 <= t < LOCK:
        zoom *= 1 + 0.04 * in_cubic((t - 3.3) / (LOCK - 3.3))
    elif t >= LOCK:
        zoom *= 1 + 0.04 * (1 - out_expo((t - LOCK) / 0.3))
    shake = np.zeros(2)
    for t0, amp, tau in SHAKES:
        if t >= t0:
            k = t - t0
            shake += amp * np.exp(-k / tau) * np.array([np.sin(2 * np.pi * 21 * k), np.sin(2 * np.pi * 16 * k + 0.4)])
    return Cam(logo, zoom, rot, centre, shake)


# ---------------------------------------------------------------- picture-space layers

def paste(logo, canvas, rgb_pre, a, x0, y0):
    """Composite a premultiplied layer onto the (rgb, alpha) canvas at picture px (x0, y0)."""
    cx0, cy0 = x0 - logo.cx0, y0 - logo.cy0
    h, w = a.shape
    sx0, sy0 = max(0, -cx0), max(0, -cy0)
    dx0, dy0 = max(0, cx0), max(0, cy0)
    dx1, dy1 = min(logo.cw, cx0 + w), min(logo.ch, cy0 + h)
    if dx1 <= dx0 or dy1 <= dy0:
        return None
    sl = (slice(dy0, dy1), slice(dx0, dx1))
    src = (slice(sy0, sy0 + dy1 - dy0), slice(sx0, sx0 + dx1 - dx0))
    keep = 1 - a[src]
    canvas[0][sl] = rgb_pre[src] + canvas[0][sl] * keep[..., None]
    canvas[1][sl] = a[src] + canvas[1][sl] * keep
    return sl, src


def lit_by_front(t, d):
    """How far the light flooding out from the flame has reached a point d frame px away."""
    if t < IGNITE:
        return np.zeros_like(d) if isinstance(d, np.ndarray) else 0.0
    r = 3000 * out_cubic((t - IGNITE) / 1.3)
    return 1 - smooth(r - 500, r + 500, d)


def draw_body(logo, canvas, glow, t, cam):
    bx, by = logo.body_xy
    light = np.zeros_like(bx, dtype=np.float32)
    heat = np.zeros((bx.shape[0], 1), np.float32)
    if t >= LAUNCH:
        since = t - logo.t_pass                                   # per row
        light = np.maximum(light, 0.5 * smooth(0, 0.12, since))  # the torch stays lit where the comet passed
        heat = 1.5 * np.exp(-np.maximum(since, 0) / 0.5) * (since >= 0)
        if t < IGNITE + 0.3:
            cp = comet_pos(logo, min(t, IGNITE))
            d = cam.zk * np.hypot(bx - cp[0], by - cp[1])
            fade = smooth(LAUNCH, LAUNCH + 0.05, t) * (1 - smooth(IGNITE, IGNITE + 0.3, t))
            light = light + fade * (1.8 * np.exp(-(d / 170) ** 2) + 0.3 * np.exp(-(d / 520) ** 2))
    if t >= IGNITE:
        d = cam.zk * np.hypot(bx - logo.ignite[0], by - logo.ignite[1])
        flash = 1.2 * after(t, IGNITE, 0.3) * smooth(0, 0.04, t - IGNITE) * np.exp(-(d / 420) ** 2)
        light = np.maximum(light, lit_by_front(t, d)) + flash
        heat = heat + 0.9 * after(t, IGNITE, 0.4)
    heat = heat + 0.9 * after(t, LOCK, 0.3) + 0.6 * after(t, BUTTON, 0.28)
    rgb = logo.body_rgb * light[..., None]
    edge = (logo.outline * heat)[..., None] * EMBER
    rgb = rgb + edge
    if t >= IGNITE:
        catch = 0.14 + 0.9 * after(t, IGNITE, 0.45) + 0.5 * after(t, LOCK, 0.3)
        rgb = rgb + logo.rim_edge[..., None] * HOT * catch
    a = logo.body_a
    placed = paste(logo, canvas, rgb * a[..., None], a, logo.body_box[0], logo.body_box[1])
    if placed:
        sl, src = placed
        glow[sl] += (edge * a[..., None])[src] * 1.2


def eye_level(t):
    """How brightly the phoenix's eye shines: it opens on EYE_FLARE and keeps glowing."""
    g = smooth(EYE_FLARE - 0.08, EYE_FLARE + 0.1, t) * (1 + 0.2 * np.sin(2 * np.pi * 0.9 * t))
    for t0, s in ((EYE_FLARE, 3.0), (LOCK, 3.5), (TWINKLE, 1.2), (BUTTON, 2.5)):
        g += s * after(t, t0, 0.25)
    return g


def draw_flame(logo, canvas, glow, t):
    if t < IGNITE:
        return
    u = (t - IGNITE) / FLAME_GROW
    p = -0.04 + 1.25 * out_cubic(u)                # fire front, in arrival units
    scale = flame_scale(t)
    amp = 5.5 * (0.5 + 0.5 * smooth(0, 1, u))      # sway, picture px at the tips
    gx, gy, sw = logo.fgx, logo.fgy, logo.sway * amp
    ph = gx * 0.004
    dx = sw * (0.55 * np.sin(0.020 * gy + 6.8 * t + ph) + 0.30 * np.sin(0.046 * gy + 10.9 * t + 1.7 + ph)
               + 0.15 * np.sin(0.090 * gy + 16.7 * t + 4.1 + 3 * ph))
    dy = sw * 0.45 * (np.sin(0.031 * gy + 9.2 * t + 2.2 + 2 * ph) + 0.4 * np.sin(0.071 * gy + 13.9 * t + 0.9))
    ix, iy = logo.ignite
    fx0, fy0 = logo.lay['flame']['box'][:2]
    mx = (ix + (gx - ix) / scale - dx - fx0).astype(np.float32)
    my = (iy + (gy - iy) / scale - dy - fy0).astype(np.float32)
    f = cv2.remap(logo.flame, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    aux = cv2.remap(logo.flame_aux, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    arr, eye = aux[..., 0], aux[..., 1]
    a = f[..., 3]
    rgb = f[..., :3] / np.maximum(a, 1e-4)[..., None]
    vis = clamp01((p - arr) / 0.07 + 0.5)
    heat = np.exp(-np.maximum(p - arr, 0) / 0.065) * vis
    for t0, s in ((LOCK, 0.75), (BUTTON, 0.5)):    # flares race up through the feathers again
        if 0 <= t - t0 < 0.9:
            pf = -0.05 + 1.3 * out_cubic((t - t0) / 0.5)
            heat = np.maximum(heat, s * np.exp(-np.maximum(pf - arr, 0) / 0.09) * clamp01((pf - arr) / 0.07 + 0.5))
    rgb = rgb + (HOT - rgb) * (0.72 * heat)[..., None]
    a = a * vis
    pre = rgb * a[..., None]
    placed = paste(logo, canvas, pre, a, logo.flame_box[0], logo.flame_box[1])
    if placed:
        sl, src = placed
        emit = pre * 0.55 + HOT * (1.6 * heat * a + eye * eye_level(t) * 1.4)[..., None]
        glow[sl] += emit[src]


def molten(logo, h):
    """Letter colour as it cools: white-hot, orange, then the logo's cream."""
    return (logo.cream + (MOLTEN - logo.cream) * smooth(0.0, 0.4, h)
            + (HOT - MOLTEN) * smooth(0.4, 0.85, h)).astype(np.float32)


def draw_letters(logo, canvas, glow, t, cam):
    flash = 0.7 * after(t, LOCK, 0.16) * smooth(LOCK, LOCK + 0.035, t) + 0.45 * after(t, BUTTON, 0.16) * smooth(BUTTON, BUTTON + 0.035, t)
    for l in logo.letters:
        x0, y0 = l['box'][:2]
        a = l['a']
        if l['word'] == 'TANGLAW':                # opens up out of the blade's cut
            v = (t - l['open']) / 0.26
            if v <= 0:
                continue
            sy = out_back(v, 1.8)
            if sy < 0.02:
                continue
            heat = np.exp(-(t - l['open']) / 0.42)
            pivot, dy, vy = logo.slash_y, 0.0, 0.0
        else:                                    # falls and slams down
            j = l['index']
            u = (t - ANG_START - 0.06 * j) / ANG_FALL
            if u <= 0:
                continue
            land = ang_landing(j)
            if u < 1:
                dy, vy = -130 * (1 - u * u), 260 * u / (ANG_FALL * FPS)
                heat = 0.35 * u
            else:
                dy, vy = 0.0, 0.0
                heat = 0.9 * np.exp(-(t - land) / 0.32)
            sy, pivot = 1.0, 0.0
            a = a * smooth(0, 0.3, u)
        smear = abs(vy) * 0.5
        pad = int(smear + 6)
        ap = cv2.copyMakeBorder(a, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=0)
        if smear > 1:
            ap = cv2.blur(ap, (1, int(smear) // 2 * 2 + 1))
        hp, wp = ap.shape
        top = y0 - pad
        if l['word'] == 'TANGLAW':
            y_top = pivot + (top - pivot) * sy
            y_bot = pivot + (top + hp - pivot) * sy
        else:
            y_top, y_bot = top + dy, top + hp + dy
        oy = int(np.floor(y_top)) - 1
        ox = x0 - pad
        out_h = int(np.ceil(y_bot)) - oy + 2
        ty = (pivot + (top + 0.5 - pivot) * sy if l['word'] == 'TANGLAW' else top + 0.5 + dy) - oy - 0.5
        m = np.float32([[1, 0, 0], [0, sy, ty]])
        a2 = cv2.warpAffine(ap, m, (wp, max(out_h, 1)), flags=cv2.INTER_LINEAR)
        col = molten(logo, heat)
        placed = paste(logo, canvas, col * a2[..., None], a2, ox, oy)
        if placed:
            sl, src = placed
            glow[sl] += (col * (a2 * (1.4 * heat + flash))[..., None])[src]


def draw_slash(logo, canvas, glow, t):
    """The blade of fire: a white-hot line with a long burning tail."""
    if not SLASH <= t < SLASH + SLASH_LEN + 0.4:
        return
    head = head_x(t)
    fade = 1.0 if t < SLASH + SLASH_LEN else float(np.exp(-(t - SLASH - SLASH_LEN) / 0.1))
    y_s = logo.slash_y
    y0, y1 = int(y_s - 90), int(y_s + 90)
    x0, x1 = int(SLASH_X[0] - 40), int(min(head + 120, logo.cx1))
    xx = np.arange(x0, x1) + 0.5
    yy = (np.arange(y0, y1) + 0.5)[:, None]
    behind = np.maximum(head - xx, 0)
    along = np.where(xx <= head, 0.75 * np.exp(-behind / 240) + 0.25 * np.exp(-behind / 900), np.exp(-(xx - head) / 5))
    core = np.exp(-((yy - y_s) / 2.0) ** 2)
    haze = np.exp(-((yy - y_s) / 13) ** 2)
    light = (core * along)[..., None] * HOT * 1.7 + (haze * along)[..., None] * WARM * 0.4
    r2 = (xx[None, :] - head) ** 2 + (yy - y_s) ** 2
    light += (np.exp(-r2 / (2 * 9 ** 2)) * 1.4)[..., None] * HOT + (np.exp(-r2 / (2 * 38 ** 2)) * 0.45)[..., None] * WARM
    light *= fade
    sl = (slice(y0 - logo.cy0, y1 - logo.cy0), slice(x0 - logo.cx0, x1 - logo.cx0))
    canvas[0][sl] += light
    glow[sl] += light * 0.8


def draw_sweep(logo, canvas, glow, t):
    u = (t - SWEEP_START) / SWEEP_LEN
    if not 0 < u < 1:
        return
    yy, xx = np.mgrid[0:logo.ch, 0:logo.cw].astype(np.float32)
    n = np.array([np.cos(np.radians(25)), np.sin(np.radians(25))])
    s = (xx + logo.cx0) * n[0] + (yy + logo.cy0) * n[1]
    lo, hi = 330 * n[0] + 150 * n[1] - 200, 1450 * n[0] + 1340 * n[1] + 200
    pos = lo + (hi - lo) * in_out_sine(u)
    band = 0.32 * np.exp(-((s - pos) / 95) ** 2) + 0.3 * np.exp(-((s - pos) / 16) ** 2)
    add = (band * canvas[1])[..., None] * np.float32(np.sin(np.pi * u) ** 0.5)
    canvas[0][...] += add
    glow += add * 0.8


# ---------------------------------------------------------------- frame-space effects

def splat(img, x, y, sigma, color, gain):
    h, w = img.shape[:2]
    r = int(3 * sigma + 1.5)
    xi, yi = int(round(x)), int(round(y))
    x0, x1, y0, y1 = max(xi - r, 0), min(xi + r + 1, w), max(yi - r, 0), min(yi + r + 1, h)
    if x1 <= x0 or y1 <= y0:
        return
    gx = np.exp(-((np.arange(x0, x1) + 0.5 - x) / sigma) ** 2 / 2)
    gy = np.exp(-((np.arange(y0, y1) + 0.5 - y) / sigma) ** 2 / 2)
    img[y0:y1, x0:x1] += (gy[:, None] * gx[None, :] * gain)[..., None] * color


def aura_gain(t):
    if t < IGNITE:
        return 0.0
    g = smooth(IGNITE, IGNITE + 0.06, t) * (1.12 + 0.75 * after(t, IGNITE, 0.35))
    g += 0.55 * after(t, LOCK, 0.4) * smooth(LOCK, LOCK + 0.04, t) + 0.4 * after(t, BUTTON, 0.35) * smooth(BUTTON, BUTTON + 0.04, t)
    return g * (1 + 0.06 * np.sin(2 * np.pi * 0.7 * t) + 0.04 * np.sin(2 * np.pi * 1.9 * t + 1))


def aura(logo, t, cam):
    """Flat flame tongues licking up around and behind the phoenix, at half resolution."""
    g = aura_gain(t)
    if g <= 0:
        return None
    inv = np.linalg.inv(cam.A)
    X, Y = logo.hx - cam.b[0], logo.hy - cam.b[1]
    sx = inv[0, 0] * X + inv[0, 1] * Y
    sy = inv[1, 0] * X + inv[1, 1] * Y
    ix, iy = logo.ignite
    sc = flame_scale(t)
    sx, sy = ix + (sx - ix) / sc, iy + (sy - iy) / sc
    ax0, ay0 = logo.aura_origin
    maps = cv2.remap(logo.aura_maps, ((sx - ax0) / 2 - 0.5).astype(np.float32), ((sy - ay0) / 2 - 0.5).astype(np.float32),
                     cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    U, K = maps[..., 0], maps[..., 1]

    def tex(x, y):
        return cv2.remap(logo.noise, np.mod(x, 256).astype(np.float32), np.mod(y, 256).astype(np.float32),
                         cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
    # tall, narrow tongues racing upwards
    warp = tex(sx / 9 + 40, (sy + 140 * t) / 12)
    wx = sx + 30 * (warp - 0.5)
    n1 = tex(wx / 4.2, (sy + 340 * t) / 9.0)
    n2 = tex(wx / 2.2 + 90, (sy + 540 * t) / 4.5 + 17)
    d = U * (0.3 + 0.95 * n1) * (0.6 + 0.6 * n2) * g
    alpha = smooth(0.40, 0.47, d) * 0.92 * (1 - K * smooth(IGNITE + 0.3, IGNITE + 0.7, t))
    mid, core = smooth(0.62, 0.68, d), smooth(0.86, 0.92, d)
    col = FIRE[0] + (FIRE[1] - FIRE[0]) * mid[..., None] + (FIRE[2] - FIRE[1]) * core[..., None]
    return col * alpha[..., None], alpha


def background(logo, t, cam):
    qx, qy = logo.qx, logo.qy
    ign, fc = cam.src(logo.ignite), cam.src(logo.flame_center)
    d_i = np.hypot(qx - ign[0], qy - ign[1])
    lit_amt = lit_by_front(t, d_i)
    d_f = np.hypot(qx - fc[0], qy - fc[1]) / cam.zoom
    near = (0.17 + 0.05 * (aura_gain(t) - 1)) * (1 + 0.05 * np.sin(2 * np.pi * 0.55 * t))
    lit = logo.maroon * ((0.98 + near * np.exp(-(d_f / 560) ** 2)) * logo.vignette)[..., None]
    bg = DARK + (lit - DARK) * np.asarray(lit_amt, np.float32)[..., None]
    if t >= IGNITE:
        k = t - IGNITE
        bg += WARM * (1.0 * np.exp(-k / 0.25) * smooth(0, 0.04, k) * np.exp(-(d_i / 420) ** 2))[..., None]
    for t0, s in ((LOCK, 0.45), (BUTTON, 0.3)):
        if t >= t0:
            bg += WARM * (s * after(t, t0, 0.22) * smooth(t0, t0 + 0.035, t) * np.exp(-(d_f / 700) ** 2))[..., None]
    if LAUNCH <= t < IGNITE + 0.05:
        cp = cam.src(comet_pos(logo, min(t, IGNITE)))
        d_s = np.hypot(qx - cp[0], qy - cp[1])
        fade = smooth(LAUNCH, LAUNCH + 0.05, t)
        bg += WARM * (fade * (0.16 * np.exp(-(d_s / 90) ** 2) + 0.05 * np.exp(-(d_s / 320) ** 2)))[..., None]
    return cv2.resize(bg, (W, H), interpolation=cv2.INTER_CUBIC)


def draw_comet(logo, img, fire_h, t, cam):
    if not LAUNCH <= t <= IGNITE + 0.02:
        return
    fade = smooth(LAUNCH, LAUNCH + 0.05, t)
    n = 120
    for k in range(n - 1, -1, -1):                     # a burning tail, drawn into the half-size fire layer
        age = k / (n - 1) * 0.16
        tk = t - age
        if tk < LAUNCH:
            continue
        f = age / 0.16
        p = comet_pos(logo, tk) + (7 * np.sin(55 * age + 31 * t) * f, 0)
        x, y = cam.src(p) / 2
        col = HOT + (WARM - HOT) * min(f * 3, 1) + (DEEP - WARM) * max(f * 1.5 - 0.5, 0)
        splat(fire_h, x, y, 0.8 + 6 * f, col, (1 - f) ** 1.5 * 0.35 * fade)
    x, y = cam.src(comet_pos(logo, t))
    flick = 1 + 0.12 * np.sin(t * 71) + 0.08 * np.sin(t * 43 + 1)
    splat(img, x, y, 36, EMBER, 0.22 * fade * flick)
    splat(img, x, y, 12, WARM, 0.9 * fade * flick)
    splat(img, x, y, 3.4, HOT, 3.0 * fade * flick)


def draw_puffs(logo, fire_h, t, cam):
    p = logo.particles[2]
    tau = t - p['t0']
    for i in np.where((tau >= 0) & (tau < p['life']))[0]:
        k = p['drag'][i]
        e = (1 - np.exp(-k * tau[i])) / k
        pos = p['p0'][i] + p['v'][i] * e + (0, -0.5 * 150 * tau[i] ** 2)
        f = tau[i] / p['life'][i]
        x, y = cam.lay(pos) / 2
        col = HOT + (WARM - HOT) * min(f * 2.5, 1) + (DEEP - WARM) * max(f * 2 - 1, 0)
        splat(fire_h, x, y, p['size'][i] * (1 + 2.5 * f) * cam.zoom / 2, col, p['gain'][i] * (1 - f) ** 1.5)


def draw_sparks(logo, img, t, cam):
    groups, embers, _ = logo.particles
    xs, ys, cols, ws = [], [], [], []
    for g in groups:
        pts = spark_points(g, t)
        if pts:
            for lst, v in zip((xs, ys, cols, ws), pts):
                lst.append(v)
    tau = t - embers['t0']
    live = (tau >= 0) & (tau < embers['life'])
    if live.any():
        tl = tau[live]
        f = tl / embers['life'][live]
        x = embers['p0'][live, 0] + embers['sway'][live] * (np.sin(2 * np.pi * embers['freq'][live] * tl + embers['phase'][live])
                                                          - np.sin(embers['phase'][live]))
        y = embers['p0'][live, 1] + embers['vy'][live] * tl
        gain = embers['gain'][live] * smooth(0, 0.15, f) * (1 - smooth(0.45, 1, f)) * (0.75 + 0.25 * np.sin(embers['flick'][live] * tl))
        xs.append(x)
        ys.append(y)
        cols.append(np.repeat(EMBER[None], len(x), 0))
        ws.append(gain * 0.7)
    if not xs:
        return
    pts = cam.lay(np.stack([np.concatenate(xs), np.concatenate(ys)], 1))
    buf = np.zeros((H, W, 3), np.float32)
    deposit(buf, pts[:, 0], pts[:, 1], np.concatenate(cols).astype(np.float32), np.concatenate(ws) * 9)
    img += cv2.GaussianBlur(buf, (0, 0), 0.9)
    half = cv2.resize(buf, (W // 2, H // 2), interpolation=cv2.INTER_AREA) * 4
    img += cv2.resize(cv2.GaussianBlur(half, (0, 0), 3), (W, H), interpolation=cv2.INTER_LINEAR) * 0.3


EYE_GLINTS = [(EYE_FLARE, 1.0, 0.8), (LOCK - 0.02, 1.3, 1.0), (TWINKLE, 0.45, 0.6), (BUTTON, 0.9, 0.8)]


def draw_eye(logo, img, t, cam):
    """The phoenix's eye: a steady shine once it opens, and star-bursts with a lens streak."""
    x, y = cam.src(logo.eye)
    g = smooth(EYE_FLARE - 0.08, EYE_FLARE + 0.1, t) * (1 + 0.2 * np.sin(2 * np.pi * 0.9 * t))
    if g > 0:
        splat(img, x, y, 4.5, HOT, 0.55 * g)
        splat(img, x, y, 16, WARM, 0.14 * g)
    for t0, s, dur in EYE_GLINTS:
        u = (t - t0) / dur
        if not 0 <= u < 1:
            continue
        e = float(smooth(0, 0.1, u) * (1 - u) ** 1.7)
        size = (80 + 110 * s) * (0.65 + 0.35 * np.sin(np.pi * min(u * 1.6, 1)))
        rot = 0.6 * u
        r = int(size + 14)
        xi, yi = int(x), int(y)
        y0, y1, x0, x1 = max(yi - r, 0), min(yi + r + 1, H), max(xi - r, 0), min(xi + r + 1, W)
        if y1 > y0 and x1 > x0:
            gy, gx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
            gx += 0.5 - x
            gy += 0.5 - y
            val = np.zeros_like(gx)
            for kk, length in ((0, size), (1, size), (2, size * 0.42), (3, size * 0.42)):
                th = rot + (kk % 2) * np.pi / 2 + (kk >= 2) * np.pi / 4
                along = gx * np.cos(th) + gy * np.sin(th)
                across = -gx * np.sin(th) + gy * np.cos(th)
                val += np.exp(-np.abs(along) / (length / 3.0)) * np.exp(-(across / 1.3) ** 2)
            rr = np.hypot(gx, gy)
            val += 1.4 * np.exp(-(rr / 4.5) ** 2) + 0.4 * np.exp(-(rr / 16) ** 2) + 0.12 * np.exp(-(rr / 45) ** 2)
            img[y0:y1, x0:x1] += (val * e * 1.4 * s ** 0.5)[..., None] * HOT
        # an anamorphic streak right across the frame
        length = 700 * s
        sy0, sy1 = max(yi - 10, 0), min(yi + 11, H)
        sx0, sx1 = max(int(x - 3 * length), 0), min(int(x + 3 * length), W)
        if sy1 > sy0 and sx1 > sx0:
            gx = np.arange(sx0, sx1) + 0.5 - x
            gy = (np.arange(sy0, sy1) + 0.5 - y)[:, None]
            streak = np.exp(-np.abs(gx) / length)[None, :] * np.exp(-(gy / 1.6) ** 2) * 0.75 * e * s
            img[sy0:sy1, sx0:sx1] += streak[..., None] * np.array([1.0, 0.8, 0.6], np.float32)


def rays(logo, glow_half, t, cam):
    """Shafts of light streaming out from the flame."""
    if t < IGNITE:
        return 0.0
    k = t - IGNITE
    gain = (1.0 * np.exp(-k / 0.5) * smooth(0, 0.05, k) + 0.2 * smooth(0.3, 1.2, k)
            + 0.6 * after(t, LOCK, 0.4) + 0.35 * after(t, BUTTON, 0.35))
    cx, cy = cam.src(logo.flame_center) / 4
    q = cv2.resize(glow_half, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    near = np.exp(-(np.hypot(logo.qx / 4 - cx, logo.qy / 4 - cy) / (110 * cam.zoom)) ** 2)
    q = cv2.GaussianBlur(q * near[..., None], (0, 0), 2.5)
    acc = np.zeros_like(q)
    total = 0.0
    for i in range(26):
        sc = 1 - i * 0.024
        w = 0.9 ** i
        m = np.float32([[sc, 0, cx * (1 - sc)], [0, sc, cy * (1 - sc)]])
        acc += w * cv2.warpAffine(q, m, (W // 4, H // 4), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP)
        total += w
    return cv2.resize(acc / total, (W, H), interpolation=cv2.INTER_LINEAR) * gain


def bloom(glow_half):
    b1 = cv2.GaussianBlur(glow_half, (0, 0), 4)
    q = cv2.resize(glow_half, (W // 8, H // 8), interpolation=cv2.INTER_AREA)
    b2 = cv2.GaussianBlur(q, (0, 0), 3)
    e = cv2.resize(glow_half, (W // 16, H // 16), interpolation=cv2.INTER_AREA)
    b3 = cv2.GaussianBlur(e, (0, 0), 4)
    up = lambda b: cv2.resize(b, (W, H), interpolation=cv2.INTER_LINEAR)
    return 0.42 * up(b1) + 0.38 * up(b2) + 0.32 * up(b3)


def glow_gain(t):
    if t < LAUNCH:
        return 0.0
    g = 1.0 + 1.4 * after(t, IGNITE, 0.25) * smooth(IGNITE, IGNITE + 0.04, t)
    g += 1.0 * after(t, LOCK, 0.22) * smooth(LOCK, LOCK + 0.035, t) + 0.6 * after(t, BUTTON, 0.22) * smooth(BUTTON, BUTTON + 0.035, t)
    return g * (1 + 0.07 * np.sin(2 * np.pi * 0.55 * t) + 0.04 * np.sin(2 * np.pi * 1.37 * t + 1.3))


def ripple(logo, img, t, cam):
    """Shockwaves of heat that bend the picture as they pass."""
    dx = dy = None
    for t0, centre, s in ((IGNITE, logo.ignite, 1.0), (LOCK, logo.torch_center, 0.9), (BUTTON, logo.torch_center, 0.5)):
        u = (t - t0) / 0.85
        if not 0 <= u < 1:
            continue
        c = cam.src(centre)
        ddx, ddy = logo.qx - c[0], logo.qy - c[1]
        d = np.hypot(ddx, ddy) + 1e-3
        r = 30 + 1700 * out_cubic(u)
        z = (d - r) / (28 + 70 * u)
        disp = 11 * s * (1 - u) ** 2 * z * np.exp(-z * z) * 2.33
        dx = (0 if dx is None else dx) + disp * ddx / d
        dy = (0 if dy is None else dy) + disp * ddy / d
    if dx is None:
        return img
    dx = cv2.resize(dx.astype(np.float32), (W, H), interpolation=cv2.INTER_LINEAR)
    dy = cv2.resize(dy.astype(np.float32), (W, H), interpolation=cv2.INTER_LINEAR)
    return cv2.remap(img, logo.fx - dx, logo.fy - dy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


# ---------------------------------------------------------------- one frame

LOGO = None


def render(t, seed=0):
    global LOGO
    if LOGO is None:
        LOGO = Logo()
    logo = LOGO
    cam = camera(logo, t)

    canvas = (np.zeros((logo.ch, logo.cw, 3), np.float32), np.zeros((logo.ch, logo.cw), np.float32))
    glow = np.zeros((logo.ch, logo.cw, 3), np.float32)
    draw_body(logo, canvas, glow, t, cam)
    draw_flame(logo, canvas, glow, t)
    draw_letters(logo, canvas, glow, t, cam)
    draw_slash(logo, canvas, glow, t)
    draw_sweep(logo, canvas, glow, t)

    layer = np.dstack([canvas[0], canvas[1]])
    if cam.zk < 0.999:
        layer = cv2.GaussianBlur(layer, (0, 0), 0.5)
    layer = cv2.warpAffine(layer, cam.canvas_matrix(), (W, H), flags=cv2.INTER_LINEAR,
                           borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    img = background(logo, t, cam)
    gh = cv2.warpAffine(glow, cam.canvas_matrix(0.5), (W // 2, H // 2), flags=cv2.INTER_LINEAR,
                        borderMode=cv2.BORDER_CONSTANT, borderValue=0)

    fire = aura(logo, t, cam)                      # behind the logo
    if fire is not None:
        col, al = fire
        img = img * (1 - cv2.resize(al, (W, H), interpolation=cv2.INTER_LINEAR)[..., None]) \
            + cv2.resize(col, (W, H), interpolation=cv2.INTER_LINEAR)
        gh += col * 0.25
    img = img * (1 - layer[..., 3:4]) + layer[..., :3]

    fire_h = np.zeros((H // 2, W // 2, 3), np.float32)
    draw_comet(logo, img, fire_h, t, cam)
    draw_puffs(logo, fire_h, t, cam)
    gh += fire_h * 0.6

    gain = glow_gain(t)
    if gain > 0:
        # after the eruption the glow lights the air around the logo but leaves its colours alone
        keep = 0.9 * smooth(IGNITE + 0.15, IGNITE + 0.6, t) * (1 - 0.55 * after(t, LOCK, 0.25))
        spill = 1 - keep * layer[..., 3:4]
        img += bloom(gh) * gain * spill
        img += rays(logo, gh, t, cam) * spill
    img += cv2.resize(fire_h, (W, H), interpolation=cv2.INTER_LINEAR)

    draw_sparks(logo, img, t, cam)
    draw_eye(logo, img, t, cam)
    img = ripple(logo, img, t, cam)

    rng = np.random.default_rng(1000 + seed)
    img += rng.standard_normal((H, W), np.float32)[..., None] * 0.006     # a fine dither against banding
    # roll the brightest light off softly instead of clipping it flat
    img = np.where(img > 0.97, 0.97 + 0.03 * np.tanh((img - 0.97) / 0.03), img)
    return (np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)


def write_frame(job):
    i, path = job
    if not os.path.exists(path):
        img = render(i / FPS, seed=i)
        cv2.imwrite(path, cv2.cvtColor(img, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_PNG_COMPRESSION, 1])
    return i


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--stills', help='comma-separated times, in seconds')
    ap.add_argument('--out', default='previews')
    ap.add_argument('--frames', help='folder for every frame')
    ap.add_argument('--workers', type=int, default=os.cpu_count())
    ap.add_argument('--mp4')
    ap.add_argument('--audio')
    ap.add_argument('--silent', help='also write a copy of the MP4 without sound here')
    args = ap.parse_args()

    if args.stills:
        os.makedirs(args.out, exist_ok=True)
        for s in args.stills.split(','):
            t = float(s)
            path = os.path.join(args.out, f't{t:05.2f}.png')
            Image.fromarray(render(t, seed=int(t * FPS))).save(path)
            print('wrote', path)
        return

    if args.frames:
        os.makedirs(args.frames, exist_ok=True)
        total = int(round(DURATION * FPS))
        jobs = [(i, os.path.join(args.frames, f'f{i:05d}.png')) for i in range(total)]
        with Pool(args.workers) as pool:
            for n, _ in enumerate(pool.imap_unordered(write_frame, jobs, chunksize=4), 1):
                if n % 60 == 0:
                    print(f'{n}/{total} frames')
        print(f'rendered {total} frames to {args.frames}')
        if args.mp4:
            os.makedirs(os.path.dirname(args.mp4) or '.', exist_ok=True)
            audio = ['-i', args.audio] if args.audio else []
            cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', os.path.join(args.frames, 'f%05d.png'),
                   *audio, '-vf', 'scale=out_color_matrix=bt709:out_range=tv:flags=lanczos+accurate_rnd+full_chroma_int,format=yuv420p',
                   # dark-scene adaptive quantisation keeps the black opening free of blocks;
                   # level 4.2 is the lowest that allows 1080p at 60 fps
                   '-c:v', 'libx264', '-preset', 'slow', '-tune', 'film', '-crf', '19',
                   '-x264-params', 'aq-mode=3:aq-strength=0.9', '-profile:v', 'high', '-level:v', '4.2',
                   '-maxrate', '30M', '-bufsize', '45M',
                   '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
                   *(['-c:a', 'aac', '-b:a', '256k', '-shortest'] if audio else []), '-movflags', '+faststart', args.mp4]
            subprocess.run(cmd, check=True)
            print('wrote', args.mp4)
            if args.silent:
                subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', args.mp4, '-map', '0:v', '-c', 'copy',
                                '-movflags', '+faststart', args.silent], check=True)
                print('wrote', args.silent)


if __name__ == '__main__':
    main()
