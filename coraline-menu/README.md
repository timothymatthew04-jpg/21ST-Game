# Coraline main menu

An animated, full-screen main menu in a Coraline mood, exported as a seamless 16-second video loop
(`export/coraline-main-menu.mp4`, 1920×1080, 15 fps) for Canva.

The background is a real 3D scene made in code with three.js. The Pink Palace stands on a misty
hill under the moon, which is the only real light. Coraline's parents are silhouetted in the yellow
windows, and a black cat sits on the "Pink Palace Apartments" sign. An old tree drops dark red
leaves across the frame while the clouds drift past the moon. Coraline stands on the worn path in
her yellow raincoat and boots, with the dowsing stick in her hand, looking up at the house.

The storm has its own timeline, repeating every loop:

| Time | What happens |
| --- | --- |
| 4.0 s | Lightning in the shape of the Other Mother's hand (the knotted branch-hand from the film poster) reaches out of the cloud over Coraline |
| 10.6 s | A forked bolt falls far behind the house |
| 13.3 s | The cloud there flickers once more |

In front of the scene sit the title in the olive-mustard yellow of the reference, with a sewn
button for its "o", and a frosted-glass panel with a red stitched border and sewn-on buttons
holding two items, Start Adventure and Options. The items are for looks only: in Canva, put
hyperlinks over them. They never move, so the links always line up.

| Item | Position in the 1920×1080 frame (x, y, width, height) |
| --- | --- |
| Start Adventure | 734, 536, 452, 76 |
| Options | 734, 612, 452, 76 |

## Look at it

Serve the folder and open it in a browser:

```sh
python3 -m http.server 8000     # then open http://localhost:8000/coraline-menu/
```

Useful URL options: `?t=6` freezes the loop at 6 seconds, `&flash=0.9` forces the hand of
lightning, and `&flash2=0.9` forces the distant bolt.

## Render stills and video

`tools/render.mjs` drives headless Chromium (Playwright) and captures exact frames. Every motion
completes whole cycles in 16 seconds, so the last frame runs straight back into the first.

```sh
node tools/render.mjs --still 6 --out previews/calm.png
node tools/render.mjs --fps 15 --workers 2 --out frames/ --mp4 export/coraline-main-menu.mp4
```

Set `FFMPEG` to an ffmpeg binary if it is not on the PATH. Rendering in software WebGL takes a
few seconds per frame; on a machine with a GPU, open the page instead and it runs live.

## Where things are

| File | What it makes |
| --- | --- |
| `js/main.js` | Camera, lights, fog, post-processing, the storm timeline |
| `js/sky.js` | Sky gradient, moon, seamless drifting clouds, the lightning cards |
| `js/house.js` | The Pink Palace |
| `js/terrain.js` | Hill, footpath, steps, shrubs, grass, far forest, fence and sign |
| `js/tree.js` | The framing tree, bare trees, falling and fallen leaves |
| `js/coraline.js` | Coraline, seen from behind |
| `js/textures.js` | Every texture, painted on canvases, including the lightning hand and bolt |
| `css/menu.css` | Title, glass panel and buttons |

Fonts: Griffy, Henny Penny and IM Fell English (SIL Open Font License). three.js is vendored under `vendor/`
(MIT).
