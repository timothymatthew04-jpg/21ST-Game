# Coraline main menu

An animated, full-screen main menu in a Coraline mood, built to be exported as a looping video for
Canva. The background is a real 3D scene made in code with three.js. The Pink Palace stands on a
misty hill under the moon, which is the only real light, with Coraline's parents silhouetted in the
yellow windows. An old tree drops dark leaves across the frame, and the clouds drift. Now and then a
lightning flash forms the Other Mother's needle-fingered hand. Coraline stands in the foreground,
looking up at the house.

In front of the scene sit the title, a frosted-glass panel with a red stitched border and
sewn-on buttons, and the menu items. The items are for looks only: in Canva, put hyperlinks
over them. They stay in the same place for the whole loop.

## Look at it

Serve the folder and open it in a browser:

```sh
python3 -m http.server 8000     # then open http://localhost:8000/coraline-menu/
```

Useful URL options: `?t=6` freezes the loop at 6 seconds, and `&flash=0.9` forces a lightning
flash.

## Render stills and video

`tools/render.mjs` drives headless Chromium (Playwright) and captures exact frames:

```sh
node tools/render.mjs --still 6 --out previews/calm.png
node tools/render.mjs --still 6 --query "flash=0.9" --out previews/lightning.png
node tools/render.mjs --fps 30 --out frames/        # the whole 16-second loop
```

## Where things are

| File | What it makes |
| --- | --- |
| `js/main.js` | Camera, lights, fog, post-processing, the loop timeline |
| `js/sky.js` | Sky gradient, moon, drifting clouds, the lightning hand card |
| `js/house.js` | The Pink Palace |
| `js/terrain.js` | Hill, steps, shrubs, grass, far forest, fence and sign |
| `js/tree.js` | The framing tree, bare trees, falling and fallen leaves |
| `js/coraline.js` | Coraline, seen from behind |
| `js/textures.js` | Every texture, painted on canvases |
| `css/menu.css` | Title, glass panel and buttons |

Fonts: Griffy and IM Fell English (SIL Open Font License). three.js is vendored under `vendor/`
(MIT).
