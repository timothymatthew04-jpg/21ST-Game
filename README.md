# SILK

A branching visual novel adapted from Alessandro Baricco's *Silk*, built on a small web engine with
*Doki Doki Literature Club*-style mechanics and an indie pixel-art look: a Cinzel title logo,
wooden sign plates, and Kavoon / Pixelify Sans type.

You play Hervé Joncour. Your choices shape his marriage to Hélène, his commitment to the silk trade,
and his obsession with a woman in Japan. The great events of the novel stay the same; what changes
is the dialogue, Hervé's inner voice, several scenes only some players see, and the ending.

## Play it

Open `index.html` in a browser. There is nothing to install or build.

If your browser blocks local files, serve the folder instead:

```sh
python3 -m http.server 8000     # then open http://localhost:8000
```

The game also runs on GitHub Pages: in the repository settings, set Pages to deploy from the main
branch, root folder.

## Controls

| Input | Action |
| --- | --- |
| Click, Space, Enter | Advance the text (a first click finishes the line) |
| Mouse wheel up, ← | Go back one line (rollback) |
| Tab / hold Ctrl | Skip text you've already read |
| A | Auto-advance |
| H, middle click | Hide the text box |
| L | History |
| S | Save screen |
| Q | Quick save |
| Esc, right click | Game menu |
| 1–9 | Pick a choice |
| F | Fullscreen |
| `` ` `` | Show story variables (for testing) |

On a phone, tap to advance and use the buttons under the text box.

## Mechanics

* **Typewriter dialogue** with a speaker name tag, natural pauses at punctuation, text effects
  (shake, wave, glitch, colour, pauses), and a speed setting.
* **Choices** that change hidden variables: Hélène Trust, Business, Obsession, Fascination,
  Intimacy, Danger and Mystery.
* **Scenes only some players see.** Many choices open a short scene of their own, and later
  chapters change their dialogue based on the variables and on earlier choices.
* **Three endings**, variations of the novel's ending "Home", tracked on an Endings screen.
* **Hervé's Journal**, a word-picking minigame in the style of DDLC's poem game. The words he
  chooses pull him toward Hélène, toward Japan, or toward the business.
* **Memory across playthroughs.** After you learn the truth once, the next playthrough reveals a
  detail in the letter you couldn't see before.
* **Save and load** with 24 slots, a quick save and five rotating autosaves (at every choice and
  chapter), each with a picture of the scene.
* **Rollback**, **skip read text**, **auto-advance**, **history log** and **hide text box**, as in
  Ren'Py games.
* **Chapter title cards**, scene transitions (dissolve, fade, flash), tints, filters and screen
  effects.
* **Settings** for text speed, auto speed, music and sound volume, text beeps, speaker highlight
  and reduced motion.
* **Animated title screen** on the ginkgo courtyard painting (`assets/bg/title_cover.webp`): golden
  leaves tumbling with depth of field, gusts of wind that tear leaves from the swaying tree, shimmering
  sun-dapples, glints, light rays and pollen, a slow camera drift and mouse parallax. The logo is
  glowing hand-painted brush lettering in the spirit of *Ori and the Blind Forest*: it paints itself
  in stroke by stroke, then breathes, gleams, sparkles and sheds embers.
* **Placeholder art.** Every background, character and event picture has a styled stand-in until
  the real art is added.

## Project layout

```text
index.html            the page
css/game.css          all styling (colours and fonts are variables at the top)
js/                   the engine
  parser.js           reads the story script
  expr.js             conditions like  helene_trust >= 3
  engine.js           runs the story: state, saves, rollback, skip/auto
  stage.js            backgrounds, sprites, transitions, effects
  textbox.js          dialogue box and typewriter
  ui.js               title screen, menus, choices, save/load, settings
  poem.js             the word minigame
  titlefx.js          the animated title screen (leaves, light, mist)
  titlelogo.js        the carved title logo (alternative style)
  paintfx.js          the animated painted title (leaves, wind, light)
  brushlogo.js        the glowing brush-lettered title logo
  audio.js            music, sounds, menu beeps
  main.js             start-up, keyboard/mouse input, screen scaling
story/script.js       THE STORY: edit this to change the game
docs/SCRIPTING.md     how to write the story script
docs/ASSETS.md        every background, sprite, CG and track the story uses
assets/               drop art and audio here (see docs/ASSETS.md)
tools/check-script.js checks the story for mistakes:  node tools/check-script.js
```

## Adding art and music

Put files in `assets/` using the names listed in [`docs/ASSETS.md`](docs/ASSETS.md). For example,
`assets/sprites/helene/sad.png` replaces Hélène's "sad" placeholder. Reload the page to see them.
