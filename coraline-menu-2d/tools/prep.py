"""Prepare the painting for animation.

Turns the reference screenshot into a clean 1920x1080 base image (web-page chrome trimmed, the
old flat button painted out, dark faded bands added top and bottom so nothing is cropped away)
and paints the masks the shader uses to animate it: where the sky is, where the windows glow,
what sways in the wind, where the title and the moon are.

    python3 tools/prep.py
"""
import json
import cv2
import numpy as np
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
A = ROOT / 'assets'
W, H = 1920, 1080

# The painting inside the screenshot (no nav bar, scrollbar or pink tab lines), and where it lands.
CROP = (0, 26, 1890, 894)          # x0, y0, x1, y1 in the screenshot
SCALE = 1.12
OX, OY = -98, 54                   # placement of the scaled painting in the 1920x1080 frame


def to_frame(x, y):
    """Screenshot coordinates -> output frame coordinates."""
    return (x - CROP[0]) * SCALE + OX, (y - CROP[1]) * SCALE + OY


def smooth(m, k):
    k = int(k) | 1
    return cv2.GaussianBlur(m, (k, k), 0)


def poly_mask(points, feather=0):
    m = np.zeros((H, W), np.float32)
    pts = np.array([to_frame(x, y) for x, y in points], np.int32)
    cv2.fillPoly(m, [pts], 1.0)
    return smooth(m, feather) if feather else m


def main():
    src = cv2.imread(str(A / 'source.png'))
    x0, y0, x1, y1 = CROP
    paint = src[y0:y1, x0:x1]
    paint = cv2.resize(paint, None, fx=SCALE, fy=SCALE, interpolation=cv2.INTER_LANCZOS4)
    # a gentle unsharp mask to win back what the upscale and JPEG softened
    blur = cv2.GaussianBlur(paint, (0, 0), 1.2)
    paint = cv2.addWeighted(paint, 1.35, blur, -0.35, 0)

    base = np.zeros((H, W, 3), np.uint8)
    ph, pw = paint.shape[:2]
    sx0 = -OX
    base[OY:OY + ph, :] = paint[:, sx0:sx0 + W][:H - OY]
    # Fill the bands above and below with a mirrored, blurred, darkened copy of the edge, fading to black.
    for top in (True, False):
        band = OY if top else H - (OY + ph)
        if band <= 0:
            continue
        if top:
            edge = base[OY:OY + band][::-1]
        else:
            edge = base[OY + ph - band:OY + ph][::-1]
        edge = cv2.GaussianBlur(edge, (0, 0), 6).astype(np.float32)
        fade = np.linspace(0.75, 0.05, band)[:, None, None]
        if top:
            base[:band] = (edge * fade[::-1]).astype(np.uint8)
        else:
            base[OY + ph:] = (edge * fade).astype(np.uint8)
    # soften the seams where the bands meet the painting
    for yy in (OY, OY + ph):
        seam = base[max(0, yy - 6):yy + 6].astype(np.float32)
        base[max(0, yy - 6):yy + 6] = cv2.GaussianBlur(seam, (0, 0), 2.5).astype(np.uint8)

    # Paint out the old "Enter the story" box with sky (the new animated button goes here).
    bx0, by0 = to_frame(834, 416)
    bx1, by1 = to_frame(1047, 490)
    hole = np.zeros((H, W), np.uint8)
    cv2.rectangle(hole, (int(bx0), int(by0)), (int(bx1), int(by1)), 255, -1)
    base = cv2.inpaint(base, hole, 14, cv2.INPAINT_TELEA)
    # let the patch carry the painting's faint texture so it doesn't read as a smooth smear
    rng = np.random.default_rng(3)
    noise = cv2.GaussianBlur(rng.normal(0, 3.0, (H, W)).astype(np.float32), (0, 0), 1.4)
    hm = smooth(hole.astype(np.float32) / 255, 21)[..., None]
    base = np.clip(base.astype(np.float32) + noise[..., None] * hm, 0, 255).astype(np.uint8)
    cv2.imwrite(str(A / 'base.png'), base)

    f = base.astype(np.float32) / 255
    b, g, r = f[..., 0], f[..., 1], f[..., 2]
    lum = 0.299 * r + 0.587 * g + 0.114 * b

    # --- regions drawn by hand (screenshot coordinates) -------------------------------------
    house = poly_mask([(1330, 330), (1420, 250), (1520, 230), (1600, 225), (1700, 290), (1760, 420),
                       (1770, 600), (1700, 640), (1330, 640)], 5)
    coraline = poly_mask([(345, 600), (380, 555), (450, 540), (540, 552), (585, 600), (590, 690),
                          (575, 760), (600, 830), (610, 900), (330, 900), (345, 800), (352, 700)], 5)
    hair = poly_mask([(345, 600), (380, 555), (450, 540), (540, 552), (585, 600), (590, 690),
                      (560, 745), (470, 760), (390, 745), (352, 700)], 9)
    title_box = poly_mask([(700, 235), (1170, 235), (1170, 375), (700, 375)])
    # the land: everything under the horizon line of hills, bushes and the house's hill
    land = poly_mask([(0, 700), (300, 690), (600, 700), (900, 690), (1150, 640), (1250, 600), (1320, 590),
                      (1380, 560), (1760, 560), (1890, 610), (1890, 894), (0, 894)], 25)
    land[int(OY + 868 * SCALE):] = 1

    # --- Coraline, cut out of the painting with GrabCut ---------------------------------------
    gc = np.full((H, W), cv2.GC_BGD, np.uint8)
    gc[poly_mask([(300, 510), (640, 510), (650, 894), (300, 894)]) > 0.5] = cv2.GC_PR_BGD
    gc[coraline > 0.5] = cv2.GC_PR_FGD
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(base, gc, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
    cor_fg = ((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD)).astype(np.uint8)
    cor_fg = cv2.morphologyEx(cor_fg, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    coraline = smooth(cv2.dilate(cor_fg, np.ones((5, 5), np.uint8)).astype(np.float32), 5)
    hair = hair * coraline

    # --- sky: blue, not too dark, and smooth (branches, roofs and walls all carry texture) ----
    mu = cv2.blur(lum, (7, 7))
    std = np.sqrt(np.clip(cv2.blur(lum * lum, (7, 7)) - mu * mu, 0, None))
    smoothness = np.clip((0.03 - std) / 0.018, 0, 1)
    blueness = np.clip((b - np.maximum(r, g)) * 9.0, 0, 1)
    bright = np.clip((lum - 0.018) * 30.0, 0, 1)
    blueness = np.clip((b - np.maximum(r, g)) * 14.0, 0, 1)
    sky = np.maximum(blueness * bright, np.clip((lum - 0.35) * 3, 0, 1)) * smoothness
    sky = cv2.morphologyEx(sky, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    # the house walls are smooth and blue-grey too, so block them with a shape drawn just inside
    # the roofline; the outline itself comes from the texture test above
    hx, hy = 1320, 210
    inset = [(50, 395), (45, 300), (60, 215), (100, 185), (112, 160), (112, 95), (135, 92), (138, 165), (160, 170),
             (200, 60), (212, 60), (250, 120), (258, 45), (285, 45), (292, 110), (330, 100), (372, 80), (384, 80),
             (415, 235), (410, 330), (440, 375), (470, 400), (470, 440), (50, 440)]
    house_in = poly_mask([(hx + x, hy + y) for x, y in inset], 7)
    sky *= (1 - house_in) * (1 - coraline) * (1 - land)
    sky = smooth(sky, 11)
    sky[:OY] = 0.6                                                           # the faded top band is sky
    sky = np.clip(sky, 0, 1)

    # --- windows: warm, bright pixels on the house; each lit pane gets its own id ------------
    warm = ((r > 0.36) & (g > 0.26) & (r - b > 0.16) & (house > 0.5)).astype(np.uint8)
    warm = cv2.morphologyEx(warm, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    n, labels, stats, cents = cv2.connectedComponentsWithStats(warm)
    win_core = np.zeros((H, W), np.float32)
    win_id = np.zeros((H, W), np.float32)
    windows = []
    k = 0
    for i in range(1, n):
        x, y, w, h, area = stats[i]
        if area < 25:
            continue
        k += 1
        m = (labels == i)
        win_core[m] = np.clip((lum[m] - 0.25) * 2.2, 0.3, 1)
        grow = cv2.dilate(m.astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)
        win_id[grow] = k / 32.0
        windows.append({'id': k, 'x': int(cents[i][0]), 'y': int(cents[i][1]), 'w': int(w), 'h': int(h)})
    win_glow = smooth(cv2.dilate(win_core, np.ones((5, 5), np.uint8)), 61) * 2.2

    # --- wind: how far each pixel sways ------------------------------------------------------
    # tree: the branchy upper-left and the arch of branches across the top, more at the tips
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    trunk = np.array(to_frame(110, 760))
    dist = np.hypot(xx - trunk[0], yy - trunk[1])
    tree_zone = poly_mask([(0, 26), (1500, 26), (1500, 120), (1150, 140), (800, 160), (520, 260),
                           (330, 420), (260, 600), (0, 700)], 151)
    # the twiggy branch hanging over the house roof
    tree_zone = np.maximum(tree_zone, poly_mask([(1150, 110), (1480, 110), (1480, 330), (1150, 330)], 101) * 0.8)
    tree_flex = tree_zone * np.clip((dist - 250) / 900, 0, 1)
    # plants: the weeds and flowers along the bottom, swaying more towards their tips
    plants = poly_mask([(0, 640), (330, 640), (345, 900), (0, 900)], 101) + \
        poly_mask([(600, 760), (900, 760), (900, 894), (600, 894)], 101) * 0.8
    plant_flex = np.clip(plants, 0, 1) * (1 - coraline) * 0.9
    hill = poly_mask([(1150, 640), (1330, 590), (1890, 600), (1890, 894), (900, 894)], 101) * (1 - house)
    flex = np.clip(tree_flex + plant_flex + hill * 0.25, 0, 1)

    # --- title: the olive-mustard letters --------------------------------------------------
    titled = ((r - b > 0.12) & (g - b > 0.1) & (r > 0.25)).astype(np.float32) * title_box
    title = smooth(titled, 3)
    title_glow = smooth(cv2.dilate(titled, np.ones((5, 5), np.uint8)), 41) * 1.6

    # --- moon ---------------------------------------------------------------------------------
    moon_area = poly_mask([(1630, 90), (1790, 90), (1790, 250), (1630, 250)])
    moonm = (lum > 0.55).astype(np.float32) * moon_area
    ys, xs = np.nonzero(moonm)
    moon = {'x': float(xs.mean()), 'y': float(ys.mean()), 'r': float(np.sqrt(len(xs) / np.pi))}

    def pack(*chs):
        return np.dstack([np.clip(c, 0, 1) for c in chs])

    def save(name, img):
        cv2.imwrite(str(A / name), (cv2.cvtColor(img.astype(np.float32), cv2.COLOR_RGBA2BGRA) * 255).astype(np.uint8))

    save('maskA.png', pack(sky, np.clip(win_glow, 0, 1), flex, title))
    save('maskB.png', pack(win_core, win_id, hair * 0.6, np.clip(title_glow, 0, 1)))
    save('maskC.png', pack(land, house, coraline, moonm))

    # where things are, for the page
    def pt(x, y):
        X, Y = to_frame(x, y)
        return [round(X, 1), round(Y, 1)]
    layout = {
        'moon': {'x': moon['x'], 'y': moon['y'], 'r': moon['r']},
        'windows': windows,
        'attic': pt(1531, 358),          # the dark gable window: the Other Mother appears here
        'atticSize': [26 * SCALE, 44 * SCALE],
        'cat': pt(1047, 247),
        'button': [round((bx0 + bx1) / 2, 1), round((by0 + by1) / 2, 1)],
        'titleCenter': pt(935, 300),
        'tree': pt(110, 760),
        'coraline': pt(470, 650),
    }
    (A / 'layout.json').write_text(json.dumps(layout, indent=1))
    print(json.dumps(layout))
    # a debug view of the masks over the painting
    dbg = base.astype(np.float32)
    dbg[..., 0] += sky * 120
    dbg[..., 2] += flex * 120
    dbg[..., 1] += np.clip(win_glow, 0, 1) * 160 + title * 160
    cv2.imwrite(str(ROOT / 'previews' / 'debug-masks.png'), np.clip(dbg, 0, 255).astype(np.uint8))


if __name__ == '__main__':
    main()
