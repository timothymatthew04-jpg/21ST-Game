# Coraline main menu (animated painting)

The main menu as a seamless 12-second loop for Canva: `export/coraline-main-menu.mp4` (1920×1080,
30 fps, 18 MB, with sound) and `export/coraline-main-menu.gif` (1280×720, 12 fps, 29 MB, no sound).

It animates the reference painting itself, so its art style and its "Coraline" title stay exactly
as they are. Nothing is redrawn: the painting is masked into sky, tree, house, windows, title,
Coraline and hill, and each part moves on its own.

## What moves

| Part | What it does |
| --- | --- |
| Sky | Clouds drift across and over the moon, moonbeams turn slowly, the moon's glow breathes |
| House | Every lit window flickers on its own like an old bulb; one fails now and then |
| Wind | The tree branches, the weeds, the bushes on the hill and Coraline's hair sway |
| Leaves | Dark red leaves fall from the old tree and drift across the frame |
| Fog | Creeps along the hill, the stairs and the foot of the frame |
| Crows | Three crows flap across the moon and over the house |
| Dragonflies | Glowing blue lights drift near the weeds, as in the Other Mother's garden |
| Title | A slow candle glow, a glint sweeping across twice a loop, lit up by the lightning |
| Cat | The black cat on the title watches with glowing eyes and blinks |
| Button | "Enter the story" with a gold stitched border that crawls round, a slow pulse, and the little black key from the film |
| Cobwebs | Strung through the tree; you only see them when the lightning catches them |
| Rain | Seen only in the flashes |
| Camera | The scene breathes in and out once a loop, behind the fixed button |

## The storm: lightning every two seconds

| Time | Strike |
| --- | --- |
| 0.3 s | A forked bolt behind the house, beside the moon |
| 2.3 s | A hand of lightning in the top left, behind the branches |
| 4.3 s | A hand high in the sky, over the title |
| 6.3 s | The big one: a hand over the house. The screen shakes, every light in the house dies, the moon shows a button's four holes, and the Other Mother stands in the attic window, button eyes catching the light |
| 8.3 s | A distant fork low over the hills |
| 10.3 s | A hand reaching down from the top towards the house |

The lightning only shows where there is open sky, so every bolt passes behind the tree, the title
and the house.

## Sound

Howling wind with a wavering whistle, thunder timed to every strike (near strikes crack, far ones
rumble later and softer), and an original music-box lullaby in D minor whose pitch wavers like a
warped record. It loops with the picture.

## In Canva

1. Upload `coraline-main-menu.mp4` and stretch it to fill a 1920×1080 page.
2. Draw a rectangle over the button, set its transparency to 0, and link it to your game.
   The button sits at **x 715, y 482, width 480, height 100** on a 1920×1080 page and never moves.
3. Links work when you present the design, share it as a view link, or publish it as a Canva
   website. A Canva design downloaded as MP4 or GIF loses the link.

## Make it again

```sh
python3 tools/prep.py                 # clean the painting, paint the masks (numpy, opencv, pillow)
python3 tools/audio.py export/menu-sound.wav
node tools/render.mjs --fps 30 --out frames/ --mp4 export/coraline-main-menu.mp4 --audio export/menu-sound.wav
node tools/render.mjs --fps 30 --out frames/ --gif export/coraline-main-menu.gif
```

`render.mjs` drives headless Chromium (Playwright); set `FFMPEG` if ffmpeg is not on the PATH.
Open `index.html` through any local web server to watch it live.

| File | What it does |
| --- | --- |
| `tools/prep.py` | Trims the screenshot, paints out the old button, fits 16:9, builds the masks |
| `js/shader.js` | The one shader that animates the painting |
| `js/fx.js` | Lightning, cobwebs, the Other Mother, leaves, crows, dragonflies, the cat |
| `js/main.js` | The loop: the storm timeline, the window flicker, the frame-exact render hook |
| `css/menu.css` | The button |
| `tools/audio.py` | The sound |

Font: Special Elite (Apache License 2.0).
