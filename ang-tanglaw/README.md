# Ang Tanglaw: logo reveal

A 9-second animated reveal of the Ang Tanglaw logo: **tanglaw** means a light that shows the way,
so the logo is revealed by its own light.

| File | What it is |
| --- | --- |
| `export/ang-tanglaw.mp4` | The reveal with sound (1920×1080, 60 fps, 9 s, 3.8 MB) |
| `export/ang-tanglaw-silent.mp4` | The same picture without sound, for laying your own music under it |
| `export/ang-tanglaw.wav` | The sound on its own (48 kHz stereo) |

![Storyboard](previews/storyboard.jpg)

## What happens

| Time | Picture | Sound |
| --- | --- | --- |
| 0.2 s | In the dark, a spark climbs the torch handle, lighting the wood as it passes | A fuse fizzes and rises |
| 1.4 s | It lands on the cup and the phoenix flame catches, burning up through its feathers with white-hot edges; light rays and sparks burst out | A low boom and a whoomp of air |
| 1.5 s | The light spreads across the frame, turning the dark maroon | The fire crackles on; a warm D chord swells |
| 1.75 s | The camera pulls back from the flame to the whole logo | |
| 3.45 s | **ANG** drifts into focus, its letters closing in | A breath of air |
| 3.7 s | **TANGLAW** rises out of its baseline, letter by letter | Each letter rings in as it lands; the chord opens to major |
| 5.0 s | A sheen crosses the logo, and the phoenix's eye catches the light | Air sweeps across; a bell |
| 6 to 9 s | The logo holds while the flame sways gently and sheds embers | The chord fades out |

The last frames are your logo exactly as designed (same layout, colours and lettering), with a
soft glow around the flame and a gentle vignette.

## Using it

* **Canva, PowerPoint, Google Slides, Keynote:** upload the MP4 and stretch it to fill a 16:9 page.
  Start your next slide from the logo so the cut is seamless.
* **Before a video or a stream:** put it first and cut on the last frame, or let it run into a fade.
* **Social media:** it uploads as it is (H.264, 60 fps). For a square or vertical post, place it on a
  maroon `#711610` background.

## How it was made

Nothing is redrawn. The Canva PDF holds the logo as one picture with a soft mask; it is split into
the flame, the torch and every letter of ANG and TANGLAW, which are then animated separately. Where
the handle runs behind the "LA" of TANGLAW, its hidden part is rebuilt from its two straight sides,
so the torch is whole before the name arrives. The fire spreads through the flame along the shape of
its feathers, measured from the spot where the spark lands.

```sh
python3 tools/prep.py "Draw - Bridge.pdf"   # split the logo into layers (numpy, scipy, opencv, pillow)
python3 tools/audio.py export/ang-tanglaw.wav
python3 tools/render.py --frames frames/ --mp4 export/ang-tanglaw.mp4 --audio export/ang-tanglaw.wav \
    --silent export/ang-tanglaw-silent.mp4
python3 tools/render.py --stills 1.5,4.2,8.9 --out previews/   # or just a few frames
```

`prep.py` needs `pdfimages` (poppler) for a PDF, or re-runs from `assets/source.png` with no argument.
Every frame depends only on its time, so `render.py` draws them in parallel; the timing lives at the
top of `render.py`, and `audio.py` follows it.

| File | What it does |
| --- | --- |
| `tools/prep.py` | Pulls the logo out of the PDF and splits it into layers in `assets/` |
| `tools/render.py` | Draws every frame and encodes the MP4 |
| `tools/audio.py` | Synthesises the sound to the same timeline |
