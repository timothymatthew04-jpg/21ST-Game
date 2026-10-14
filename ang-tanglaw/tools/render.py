#!/usr/bin/env python3
"""Renders the Ang Tanglaw logo reveal.

A spark climbs the dark torch and lands on the cup; the phoenix flame catches and burns up through
its feathers; its light floods the frame with the maroon of the logo while the camera pulls back;
ANG drifts into focus, TANGLAW rises letter by letter, a sheen crosses the logo and the phoenix's
eye catches the light. Then it holds, the flame breathing and shedding embers.

    python3 tools/render.py --stills 0.9,1.6,2.4,4.2,8.9 --out previews/
    python3 tools/render.py --frames frames/ --mp4 export/ang-tanglaw.mp4 --audio export/ang-tanglaw.wav \
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
SPARK_ON, IGNITE = 0.2, 1.4          # the spark climbs the handle, then lands on the cup
FLAME_GROW = 1.0                     # fire spreads through the feathers
PULL_START, PULL_LEN = 1.75, 2.35    # the camera pulls back to the whole logo
ANG_START, TANGLAW_START = 3.45, 3.7
SWEEP_START, SWEEP_LEN = 5.0, 0.95   # a sheen crosses the logo
GLINT_START, GLINT_LEN = 5.15, 0.75  # ... and the phoenix's eye catches it

HOT = np.array([1.0, 0.93, 0.76], np.float32)
WARM = np.array([1.0, 0.56, 0.22], np.float32)
EMBER = np.array([1.0, 0.62, 0.24], np.float32)
DARK = np.array([0.012, 0.006, 0.005], np.float32)


# ---------------------------------------------------------------- easing

def clamp01(x):
    return np.clip(x, 0.0, 1.0)


def smooth(e0, e1, x):
    u = clamp01((x - e0) / (e1 - e0))
    return u * u * (3 - 2 * u)


def out_cubic(u):
    return 1 - (1 - clamp01(u)) ** 3


def out_quart(u):
    return 1 - (1 - clamp01(u)) ** 4


def out_quint(u):
    return 1 - (1 - clamp01(u)) ** 5


def in_out_sine(u):
    return 0.5 - 0.5 * np.cos(np.pi * clamp01(u))


def in_out_cubic(u):
    u = clamp01(u)
    return 4 * u ** 3 if u < 0.5 else 1 - (-2 * u + 2) ** 3 / 2


def in_out_quart(u):
    u = clamp01(u)
    return 8 * u ** 4 if u < 0.5 else 1 - (-2 * u + 2) ** 4 / 2


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


rise = bezier(0.16, 1.0, 0.3, 1.0)    # long, soft landing


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
        self.cx0, self.cy0, self.cx1, self.cy1 = 180, 100, 1480, 1345
        self.cw, self.ch = self.cx1 - self.cx0, self.cy1 - self.cy0

        self.body_rgb, self.body_a = load_layer(lay['body']['file'])
        self.body_box = lay['body']['box']
        bx0, by0, bx1, by1 = self.body_box
        self.body_xy = np.meshgrid(np.arange(bx0, bx1) + 0.5, np.arange(by0, by1) + 0.5)
        # top edges of the cup and rings, which catch the light of the flame above them
        shifted = np.zeros_like(self.body_a)
        shifted[5:] = self.body_a[:-5]
        self.rim_edge = cv2.GaussianBlur(np.clip(self.body_a - shifted, 0, 1), (0, 0), 1.2)

        rgb, a = load_layer(lay['flame']['file'])
        self.flame = np.dstack([rgb * a[..., None], a])            # premultiplied
        arrival = np.array(Image.open(ROOT / 'assets' / 'layers' / lay['flame']['arrival'])).astype(np.float32)
        self.arrival = arrival / 65535 * lay['flame']['arrivalMax']
        fx0, fy0, fx1, fy1 = lay['flame']['box']
        self.fpad = 40
        self.flame_box = (fx0 - self.fpad, fy0 - self.fpad, fx1 + self.fpad, fy1 + self.fpad)
        gx, gy = np.meshgrid(np.arange(self.flame_box[0], self.flame_box[2], dtype=np.float32),
                             np.arange(self.flame_box[1], self.flame_box[3], dtype=np.float32))
        self.fgx, self.fgy = gx, gy
        self.ignite = np.array(lay['ignite'], np.float32) - (0, 2)
        flame_h = self.ignite[1] - fy0
        # the feathers sway more towards their tips; the phoenix's head holds still
        self.sway = (clamp01((self.ignite[1] - gy) / flame_h) ** 1.4) * (1 - smooth(1075, 1140, gx))

        self.letters = []
        for l in lay['letters']:
            _, a = load_layer(l['file'])
            self.letters.append({**l, 'a': a})
        for word in ('ANG', 'TANGLAW'):
            mine = [l for l in self.letters if l['word'] == word]
            x0 = min(l['ink'][0] for l in mine)
            x1 = max(l['ink'][2] for l in mine)
            for j, l in enumerate(mine):
                l['index'] = j
                l['spread'] = ((l['ink'][0] + l['ink'][2]) / 2 - (x0 + x1) / 2)
        self.baseline = lay['baseline']
        self.eye = np.array(lay['eye'], np.float32) + (4, 0)
        self.tip = np.array(lay['handleTip'], np.float32) - (0, 16)
        self.flame_center = np.array([1030, 420], np.float32)

        # screen-space helpers
        qy, qx = np.mgrid[0:H // 4, 0:W // 4].astype(np.float32)
        self.qx, self.qy = qx * 4 + 1.5, qy * 4 + 1.5
        r = np.hypot((self.qx - W / 2) / (W / 2), (self.qy - H / 2) / (H / 2)) / np.sqrt(2)
        self.vignette = 1 - 0.26 * r ** 2.2

        self.particles = make_particles(self)

    def layout(self, p):
        return self.o + self.k * np.asarray(p, np.float32)


def make_particles(logo):
    rng = np.random.default_rng(11)
    ign = logo.layout(logo.ignite)
    burst = []
    for _ in range(90):
        ang = rng.uniform(-np.pi * 0.93, -np.pi * 0.07)
        speed = rng.uniform(220, 980) * (1.15 if abs(ang + np.pi / 2) < 0.6 else 1.0)
        burst.append(dict(
            t0=IGNITE + rng.uniform(0, 0.06), p0=ign + (rng.uniform(-14, 14), rng.uniform(-6, 2)),
            v=np.array([np.cos(ang), np.sin(ang)]) * speed, drag=rng.uniform(1.8, 3.2), lift=-rng.uniform(40, 140),
            life=rng.uniform(0.45, 1.35), size=rng.uniform(0.9, 1.9), gain=rng.uniform(0.7, 1.5),
            flick=rng.uniform(9, 24), phase=rng.uniform(0, 6.3)))
    embers = []
    fx0, fy0, fx1, fy1 = logo.lay['flame']['box']
    for t0 in np.sort(rng.uniform(IGNITE + 0.35, DURATION, 70)):
        start = logo.layout((rng.uniform(fx0 + 90, fx1 - 120), rng.uniform(fy0 + 90, fy1 - 120)))
        embers.append(dict(
            t0=t0, p0=start, vy=-rng.uniform(40, 105), sway=rng.uniform(6, 20), freq=rng.uniform(0.35, 0.95),
            phase=rng.uniform(0, 6.3), life=rng.uniform(1.4, 3.0), size=rng.uniform(0.8, 1.5),
            gain=rng.uniform(0.35, 0.85), flick=rng.uniform(5, 13)))
    motes = []
    tip = logo.layout(logo.tip)
    for _ in range(55):
        p = np.array([rng.uniform(ign[0] - 420, ign[0] + 420), rng.uniform(ign[1] - 160, tip[1] + 140)])
        motes.append(dict(p0=p, v=rng.uniform(-9, 9, 2) + (0, -4), size=rng.uniform(0.6, 1.3),
                          gain=rng.uniform(0.3, 1.0), phase=rng.uniform(0, 6.3)))
    return burst, embers, motes


# ---------------------------------------------------------------- the story, as functions of time

def spark_pos(logo, t):
    """Where the spark is (picture px) while it climbs, and how far it has come."""
    u = in_out_cubic((t - SPARK_ON) / (IGNITE - SPARK_ON))
    p = logo.tip + (logo.ignite - logo.tip) * u
    p = p + (10 * np.sin(2 * np.pi * u) * np.sin(np.pi * u), 0)
    return p, u


def camera(logo, t):
    """Zoom and the layout point at the centre of the frame."""
    z_pre = 1.95 + 0.15 * (1 - (1 - min(t / PULL_START, 1)) ** 2)   # a slow push in, easing to rest
    # follow the spark up the handle a beat behind it, keeping it low in the frame
    p_climb = logo.layout(spark_pos(logo, max(t - 0.12, SPARK_ON))[0]) - (0, 150)
    pull = in_out_quart((t - PULL_START) / PULL_LEN)
    zoom = z_pre + (1 - z_pre) * pull
    centre = p_climb + (np.array([W / 2, H / 2]) - p_climb) * pull
    return zoom, centre


def affine(logo, zoom, centre):
    """Picture px -> frame px: frame = a * p + b."""
    return zoom * logo.k, zoom * (logo.o - centre) + (W / 2, H / 2)


FRONT_SOFT = 1000


def lit_by_front(t, d):
    """How far the light spreading from the flame has reached a point d frame px from it."""
    if t < IGNITE:
        return np.zeros_like(d) if isinstance(d, np.ndarray) else 0.0
    r = 2700 * out_cubic((t - IGNITE) / 2.6)
    return 1 - smooth(r - FRONT_SOFT / 2, r + FRONT_SOFT / 2, d)


def glow_gain(t):
    """How strongly the flame blooms: a flash on ignition, then a slow breath."""
    if t < IGNITE:
        return 0.0
    breath = 1 + 0.07 * np.sin(2 * np.pi * 0.55 * t) + 0.04 * np.sin(2 * np.pi * 1.37 * t + 1.3)
    return (0.8 + 1.9 * np.exp(-(t - IGNITE) / 0.26)) * breath * smooth(IGNITE, IGNITE + 0.08, t)


# ---------------------------------------------------------------- picture-space layers

def paste(canvas, rgb_pre, a, x0, y0):
    """Composite a premultiplied layer onto the (rgb, alpha) canvas at picture px (x0, y0)."""
    cx0, cy0 = x0 - LOGO.cx0, y0 - LOGO.cy0
    h, w = a.shape
    sx0, sy0 = max(0, -cx0), max(0, -cy0)
    dx0, dy0 = max(0, cx0), max(0, cy0)
    dx1, dy1 = min(LOGO.cw, cx0 + w), min(LOGO.ch, cy0 + h)
    if dx1 <= dx0 or dy1 <= dy0:
        return
    sl = (slice(dy0, dy1), slice(dx0, dx1))
    src = (slice(sy0, sy0 + dy1 - dy0), slice(sx0, sx0 + dx1 - dx0))
    keep = 1 - a[src]
    canvas[0][sl] = rgb_pre[src] + canvas[0][sl] * keep[..., None]
    canvas[1][sl] = a[src] + canvas[1][sl] * keep


def draw_body(logo, canvas, t, a_):
    bx, by = logo.body_xy
    light = np.zeros_like(bx, dtype=np.float32)
    if SPARK_ON <= t < IGNITE + 0.25:
        sp, _ = spark_pos(logo, min(t, IGNITE))
        d = a_ * np.hypot(bx - sp[0], by - sp[1])
        fade = smooth(SPARK_ON, SPARK_ON + 0.3, t) * (1 - smooth(IGNITE, IGNITE + 0.25, t))
        light += fade * (1.25 * np.exp(-(d / 125) ** 2) + 0.22 * np.exp(-(d / 420) ** 2))
    if t >= IGNITE:
        d = a_ * np.hypot(bx - logo.ignite[0], by - logo.ignite[1])
        flash = 1.1 * np.exp(-(t - IGNITE) / 0.3) * smooth(0, 0.05, t - IGNITE) * np.exp(-(d / 380) ** 2)
        light = np.maximum(light, lit_by_front(t, d)) + flash
    rgb = logo.body_rgb * light[..., None]
    # the cup's top edges catch the flame: bright at ignition, a faint warm line after
    if t >= IGNITE:
        catch = 0.12 + 0.9 * np.exp(-(t - IGNITE) / 0.45)
        rgb = rgb + logo.rim_edge[..., None] * HOT * catch * smooth(IGNITE, IGNITE + 0.1, t)
    a = logo.body_a
    paste(canvas, rgb * a[..., None], a, logo.body_box[0], logo.body_box[1])


def draw_flame(logo, canvas, glow, t):
    if t < IGNITE:
        return
    u = (t - IGNITE) / FLAME_GROW
    p = -0.04 + 1.22 * out_cubic(u)                # fire front, in arrival units
    scale = 0.7 + 0.3 * out_back(u * 1.1, 1.1)     # the flame stretches up out of the cup
    amp = 4.2 * (0.45 + 0.55 * smooth(0, 1, u))    # sway, picture px at the tips
    gx, gy, sw = logo.fgx, logo.fgy, logo.sway * amp
    ph = gx * 0.004
    dx = sw * (0.55 * np.sin(0.020 * gy + 6.3 * t + ph) + 0.30 * np.sin(0.046 * gy + 10.1 * t + 1.7 + ph)
               + 0.15 * np.sin(0.090 * gy + 15.7 * t + 4.1 + 3 * ph))
    dy = sw * 0.45 * (np.sin(0.031 * gy + 8.6 * t + 2.2 + 2 * ph) + 0.4 * np.sin(0.071 * gy + 12.9 * t + 0.9))
    ix, iy = logo.ignite
    fx0, fy0 = logo.lay['flame']['box'][:2]
    mx = (ix + (gx - ix) / scale - dx - fx0).astype(np.float32)
    my = (iy + (gy - iy) / scale - dy - fy0).astype(np.float32)
    f = cv2.remap(logo.flame, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    arr = cv2.remap(logo.arrival, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    a = f[..., 3]
    rgb = f[..., :3] / np.maximum(a, 1e-4)[..., None]
    vis = clamp01((p - arr) / 0.07 + 0.5)
    heat = np.exp(-np.maximum(p - arr, 0) / 0.065) * vis
    rgb = rgb + (HOT - rgb) * (0.72 * heat)[..., None]
    a = a * vis
    pre = rgb * a[..., None]
    paste(canvas, pre, a, logo.flame_box[0], logo.flame_box[1])
    x0, y0 = logo.flame_box[0] - logo.cx0, logo.flame_box[1] - logo.cy0
    h, w = a.shape
    glow[y0:y0 + h, x0:x0 + w] += pre * 0.55 + (HOT * (1.6 * heat * a)[..., None])


def draw_letters(logo, canvas, t, a_):
    for l in logo.letters:
        j = l['index']
        if l['word'] == 'ANG':
            u = (t - ANG_START - 0.085 * j) / 1.15
            if u <= 0:
                continue
            opacity = out_cubic(u / 0.75)
            blur = 16 * (1 - out_quart(u))                      # frame px
            dx, dy = l['spread'] * 0.3 * (1 - out_quint(u)), 0.0
            vy = 0.0
        else:
            u = (t - TANGLAW_START - 0.06 * j) / 0.95
            if u <= 0:
                continue
            height = l['ink'][3] - l['ink'][1]
            dy = 1.1 * height * (1 - rise(u))
            vy = 1.1 * height * (rise(u) - rise(u - 1 / (FPS * 0.95)))   # px per frame
            opacity = clamp01(u / 0.2)
            blur, dx = 2.5 * (1 - out_quart(u)), 0.0
        if opacity <= 0.002:
            continue
        a = l['a']
        sigma = blur / a_
        smear = abs(vy) * 0.5                                    # half-frame shutter
        pad = int(3 * sigma + smear + 4)
        if pad:
            a = cv2.copyMakeBorder(a, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=0)
        if sigma > 0.3:
            a = cv2.GaussianBlur(a, (0, 0), sigma)
        if smear > 1:
            a = cv2.blur(a, (1, int(smear) // 2 * 2 + 1))
        x0 = l['box'][0] - pad + dx
        y0 = l['box'][1] - pad + dy
        ix, iy = int(np.floor(x0)), int(np.floor(y0))
        m = np.float32([[1, 0, x0 - ix], [0, 1, y0 - iy]])
        a = cv2.warpAffine(a, m, (a.shape[1] + 1, a.shape[0] + 1), flags=cv2.INTER_LINEAR) * opacity
        if l['word'] == 'TANGLAW':                               # rises out of the baseline
            cut = logo.baseline['TANGLAW'] + 2 - iy
            if cut < a.shape[0]:
                a[max(cut, 0):] = 0
        paste(canvas, logo.cream * a[..., None], a, ix, iy)


def draw_sweep(logo, canvas, glow, t):
    u = (t - SWEEP_START) / SWEEP_LEN
    if not 0 < u < 1:
        return
    yy, xx = np.mgrid[0:logo.ch, 0:logo.cw].astype(np.float32)
    xx += logo.cx0
    yy += logo.cy0
    n = np.array([np.cos(np.radians(25)), np.sin(np.radians(25))])
    s = xx * n[0] + yy * n[1]
    lo, hi = 330 * n[0] + 150 * n[1] - 200, 1450 * n[0] + 1340 * n[1] + 200
    pos = lo + (hi - lo) * in_out_sine(u)
    band = 0.24 * np.exp(-((s - pos) / 120) ** 2) + 0.10 * np.exp(-((s - pos) / 26) ** 2)
    band *= np.sin(np.pi * u) ** 0.5
    add = band[..., None] * canvas[1][..., None] * np.float32(1.0)
    canvas[0][...] += add
    glow += add * 0.8


# ---------------------------------------------------------------- frame-space light

def splat(img, x, y, sigma, color, gain):
    r = int(3 * sigma + 1.5)
    xi, yi = int(round(x)), int(round(y))
    x0, x1, y0, y1 = max(xi - r, 0), min(xi + r + 1, W), max(yi - r, 0), min(yi + r + 1, H)
    if x1 <= x0 or y1 <= y0:
        return
    gx = np.exp(-((np.arange(x0, x1) - x) / sigma) ** 2 / 2)
    gy = np.exp(-((np.arange(y0, y1) - y) / sigma) ** 2 / 2)
    img[y0:y1, x0:x1] += (gy[:, None] * gx[None, :] * gain)[..., None] * color


def background(logo, t, a_, b_, zoom):
    to = lambda p: a_ * np.asarray(p) + b_
    qx, qy = logo.qx, logo.qy
    ign = to(logo.ignite)
    fc = to(logo.flame_center)
    d_i = np.hypot(qx - ign[0], qy - ign[1])
    lit_amt = lit_by_front(t, d_i)
    breath = 1 + 0.05 * np.sin(2 * np.pi * 0.55 * t)
    d_f = np.hypot(qx - fc[0], qy - fc[1]) / zoom
    lit = logo.maroon * ((0.98 + 0.14 * breath * np.exp(-(d_f / 560) ** 2)) * logo.vignette)[..., None]
    bg = DARK + (lit - DARK) * np.asarray(lit_amt, np.float32)[..., None]
    zf = np.sqrt(zoom)
    if t >= IGNITE:                                   # the flash
        k = t - IGNITE
        bg += WARM * (0.75 * np.exp(-k / 0.28) * smooth(0, 0.05, k) * np.exp(-(d_i / (330 * zf)) ** 2))[..., None]
    if SPARK_ON <= t < IGNITE + 0.1:                  # the spark lights the air around it
        sp = to(spark_pos(logo, min(t, IGNITE))[0])
        d_s = np.hypot(qx - sp[0], qy - sp[1])
        fade = smooth(SPARK_ON, SPARK_ON + 0.3, t)
        bg += WARM * (fade * (0.10 * np.exp(-(d_s / (70 * zf)) ** 2) + 0.035 * np.exp(-(d_s / (260 * zf)) ** 2)))[..., None]
    return cv2.resize(bg, (W, H), interpolation=cv2.INTER_CUBIC)


def draw_spark(logo, img, t, a_, b_, zoom):
    if not SPARK_ON <= t <= IGNITE + 0.02:
        return
    to = lambda p: a_ * np.asarray(p) + b_
    fade = smooth(SPARK_ON, SPARK_ON + 0.25, t)
    zf = np.sqrt(zoom / 2)
    flick = 1 + 0.12 * np.sin(t * 61) + 0.08 * np.sin(t * 37 + 1)
    n = 150
    for k in range(n, 0, -1):                      # the trail, sampled finer than it is wide
        tk = t - k * 0.0016
        if tk < SPARK_ON:
            continue
        x, y = to(spark_pos(logo, tk)[0])
        w = (1 - k / (n + 1)) ** 2.4
        splat(img, x, y, 1.7 * zf * (0.55 + 0.45 * w), WARM * 0.55 + HOT * 0.45, 0.16 * w * fade)
    x, y = to(spark_pos(logo, t)[0])
    splat(img, x, y, 14 * zf, WARM, 0.5 * fade * flick)
    splat(img, x, y, 4.5 * zf, WARM * 0.5 + HOT * 0.5, 0.8 * fade * flick)
    splat(img, x, y, 2.4 * zf, HOT, 2.6 * fade * flick)


def draw_particles(logo, img, t, a_, b_, zoom):
    to = lambda p: a_ / logo.k * (np.asarray(p) - logo.o) + b_      # layout px -> frame px
    burst, embers, motes = logo.particles
    zf = np.sqrt(zoom)
    sub = 3
    for q in burst:
        for j in range(sub):
            tau = t - q['t0'] - j / (FPS * sub * 1.6)
            if not 0 <= tau < q['life']:
                continue
            e = (1 - np.exp(-q['drag'] * tau)) / q['drag']
            p = q['p0'] + q['v'] * e + (0, 0.5 * q['lift'] * tau * tau)
            f = tau / q['life']
            col = HOT + (EMBER - HOT) * min(f * 2.2, 1) + (np.array([0.85, 0.22, 0.08]) - EMBER) * max(f * 2 - 1, 0)
            gain = q['gain'] * (1 - f) ** 1.6 * (0.8 + 0.2 * np.sin(q['flick'] * tau + q['phase'])) / sub * 1.8
            x, y = to(p)
            splat(img, x, y, q['size'] * zf * 0.8, col.astype(np.float32), gain)
    for q in embers:
        tau = t - q['t0']
        if not 0 <= tau < q['life']:
            continue
        f = tau / q['life']
        p = q['p0'] + (q['sway'] * np.sin(2 * np.pi * q['freq'] * tau + q['phase']) - q['sway'] * np.sin(q['phase']),
                       q['vy'] * tau)
        gain = q['gain'] * smooth(0, 0.15, f) * (1 - smooth(0.45, 1, f)) * (0.75 + 0.25 * np.sin(q['flick'] * tau))
        x, y = to(p)
        splat(img, x, y, q['size'] * zf * 0.8, EMBER, gain)
        splat(img, x, y, q['size'] * zf * 3.5, EMBER, gain * 0.08)
    if t < IGNITE + 1.2:                             # dust in the dark, lit as the spark passes
        sp = a_ * spark_pos(logo, min(t, IGNITE))[0] + b_
        flame_lit = 0.0 if t < IGNITE else 0.5 * np.exp(-(t - IGNITE) / 0.5)
        for q in motes:
            x, y = to(q['p0'] + q['v'] * t)
            d = np.hypot(x - sp[0], y - sp[1])
            fade = smooth(SPARK_ON, SPARK_ON + 0.4, t) * (1 - smooth(IGNITE + 0.4, IGNITE + 1.2, t))
            gain = q['gain'] * fade * (0.9 * np.exp(-(d / 190) ** 2) + flame_lit) * (0.7 + 0.3 * np.sin(3 * t + q['phase']))
            if gain > 0.01:
                splat(img, x, y, q['size'] * zf * 0.7, EMBER * 0.6 + HOT * 0.4, gain)


def draw_glint(logo, img, t, a_, b_):
    u = (t - GLINT_START) / GLINT_LEN
    if not 0 < u < 1:
        return
    x, y = a_ * logo.eye + b_
    e = np.sin(np.pi * u) ** 2
    size = 58 * (0.55 + 0.45 * np.sin(np.pi * u))
    rot = 0.45 * u
    r = int(size + 12)
    xi, yi = int(x), int(y)
    gy, gx = np.mgrid[yi - r:yi + r + 1, xi - r:xi + r + 1].astype(np.float32)
    gx -= x
    gy -= y
    val = np.zeros_like(gx)
    for k, length in ((0, size), (1, size), (2, size * 0.42), (3, size * 0.42)):
        th = rot + (k % 2) * np.pi / 2 + (k >= 2) * np.pi / 4
        along = gx * np.cos(th) + gy * np.sin(th)
        across = -gx * np.sin(th) + gy * np.cos(th)
        val += np.exp(-np.abs(along) / (length / 3.2)) * np.exp(-(across / 1.15) ** 2)
    rr = np.hypot(gx, gy)
    val += 1.1 * np.exp(-(rr / 3.5) ** 2) + 0.28 * np.exp(-(rr / 13) ** 2)
    y0, y1, x0, x1 = yi - r, yi + r + 1, xi - r, xi + r + 1
    if y0 < 0 or x0 < 0 or y1 > H or x1 > W:
        return
    img[y0:y1, x0:x1] += (val * e * 1.25)[..., None] * HOT


def rays(logo, glow_half, t, a_, b_):
    """Shafts of light streaming out from the flame, strongest just after it catches."""
    k = t - IGNITE
    gain = 0.75 * np.exp(-k / 0.55) * smooth(0, 0.08, k) + 0.16 * smooth(0.3, 1.5, k)
    q = cv2.resize(glow_half, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    cx, cy = (a_ * logo.flame_center + b_) / 4
    acc = np.zeros_like(q)
    total = 0.0
    for i in range(18):
        sc = 1 - i * 0.035
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


# ---------------------------------------------------------------- one frame

LOGO = None


def render(t, seed=0):
    global LOGO
    if LOGO is None:
        LOGO = Logo()
    logo = LOGO
    zoom, centre = camera(logo, t)
    a_, b_ = affine(logo, zoom, centre)

    canvas = (np.zeros((logo.ch, logo.cw, 3), np.float32), np.zeros((logo.ch, logo.cw), np.float32))
    glow = np.zeros((logo.ch, logo.cw, 3), np.float32)
    draw_body(logo, canvas, t, a_)
    draw_flame(logo, canvas, glow, t)
    draw_letters(logo, canvas, t, a_)
    draw_sweep(logo, canvas, glow, t)

    # picture canvas -> frame
    # (pixel centres sit at +0.5 in both spaces)
    cx = a_ * (logo.cx0 + 0.5) + b_[0] - 0.5
    cy = a_ * (logo.cy0 + 0.5) + b_[1] - 0.5
    m = np.float32([[a_, 0, cx], [0, a_, cy]])
    layer = np.dstack([canvas[0], canvas[1]])
    if a_ < 0.999:
        layer = cv2.GaussianBlur(layer, (0, 0), 0.5)
    layer = cv2.warpAffine(layer, m, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    img = background(logo, t, a_, b_, zoom)
    img = img * (1 - layer[..., 3:4]) + layer[..., :3]

    gain = glow_gain(t)
    if gain > 0:
        mh = np.float32([[a_ / 2, 0, (a_ * (logo.cx0 + 0.5) + b_[0]) / 2 - 0.5],
                         [0, a_ / 2, (a_ * (logo.cy0 + 0.5) + b_[1]) / 2 - 0.5]])
        gh = cv2.warpAffine(glow, mh, (W // 2, H // 2), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        # once the flash has passed, the glow lights the air around the flame but leaves the
        # logo's own colours alone
        keep = 0.9 * smooth(IGNITE + 0.15, IGNITE + 0.85, t)
        spill = 1 - keep * layer[..., 3:4]
        img += bloom(gh) * gain * spill
        img += rays(logo, gh, t, a_, b_) * spill

    draw_spark(logo, img, t, a_, b_, zoom)
    draw_particles(logo, img, t, a_, b_, zoom)
    draw_glint(logo, img, t, a_, b_)

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
