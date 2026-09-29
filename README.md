# SILK

A branching visual novel adapted from Alessandro Baricco's *Silk*, built on a small web engine with
*Doki Doki Literature Club*-style mechanics: an animated ginkgo title screen with a glowing brush
logo, and Japanese visual-novel dialogue on washi paper with lacquer and gold.

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

* **Japanese-style text box**: a translucent washi panel with a vermilion and gold frame and
  seigaiha waves, a black-lacquer name plate, the speaker's face at its corner (for Hervé and for
  voices heard off-scene), and save / load tabs at its side. Clean Zen Maru Gothic text, with
  Hervé's thoughts in a plum serif.
* **Typewriter dialogue** with natural pauses at punctuation, text effects (shake, wave, glitch,
  colour, pauses), and a speed setting.
* **Karma you feel, not see.** No meters or numbers: when a choice matters, a line like "Hélène will
  remember that." drifts in along a coloured thread, the scene glows warmly or darkens with a
  heartbeat, and the music dips. While you decide, the scene dims and the music quietens. At the
  ending, **See your choices** reveals every choice you made and what each one set in motion.
* **Choices** that change hidden variables: Hélène Trust, Business, Obsession, Fascination,
  Intimacy, Danger and Mystery.
* **Choices under pressure.** A silk thread burns down above every choice (no numbers); when it is
  gone, Hervé hesitates, and silence has consequences of its own. Each option glows with its
  feeling (tender, warm, honest, cold, dutiful, obsessive, dangerous, curious, quiet), and
  considering one previews how it would be said: the words tremble, shimmer or fade, and the text
  box takes on its colour. Settings can relax or switch off the timer.
* **Francs and keepsakes.** Balbadiou's purse, a father's watch, Hélène's handkerchief, a pressed
  blossom, Hara Kei's pass… The kinder choice often costs something real: paying instead of
  threatening, giving up the watch, sending for the doctor from Nîmes. What Hervé gives away is
  noticed later.
* **Minigames**: the tea ceremony, sorting the eggs, bargaining with Hara Kei, hiding from soldiers
  in the burned village, and mending the torn letter. Short and forgiving, and none can stop the story.
* **Routes you can feel.** At every chapter the story works out where Hervé's heart is heading:
  devoted, torn or lost. The chapter card turns to dawn rose and petals or to crimson, ash and a
  crack; the text box warms or darkens; and characters speak to him differently.
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
* **Japanese chapter cards** in the title menu's style: an ink wash, the chapter number brushed in
  vertical kanji (序章, 第一章 … 終章), the chapter's name glowing over a vermilion brush stroke, and a
  red seal with the chapter's own character (旅, 杯, 手袋 …) stamped in with a burst of gold sparks.
* **Cutscenes** for every chapter and ending: short cinematic moments with letterbox bars, slow
  camera moves, captions and sound. Hervé's route drawn across an old map of Eurasia, the cup and
  the glove in close-up, the note and the letter written out in calligraphy, the black ships, the
  burned village, the candle going out at dawn, and the truth in Hélène's own handwriting. Click to
  move on, Esc to skip.
* Scene transitions (dissolve, fade, flash), tints, filters and screen effects.
* **Settings** for text speed, auto speed, music and sound volume, text beeps, speaker highlight
  and reduced motion.
* **Animated title screen** on the ginkgo courtyard painting (`assets/bg/title_cover.webp`): golden
  leaves tumbling with depth of field, gusts of wind that tear leaves from the swaying tree, shimmering
  sun-dapples, glints, light rays and pollen, a slow camera drift and mouse parallax. The logo is
  glowing hand-painted brush lettering in the spirit of *Ori and the Blind Forest*: it paints itself
  in stroke by stroke, then breathes, gleams, sparkles and sheds embers. Moving leaf shadows and
  soft cast shadows give the scene depth, and the menu has its own music (`assets/music/title.mp3`),
  which loops with a crossfade so there is never a gap.
* **Fills any screen.** The game widens to the window's shape (from 16:10 up to 21:9), so there are
  no black bars on laptops, desktops or ultrawide monitors. Unusual shapes, such as a phone held
  upright, get a soft blurred copy of the picture around the game instead of bars.
* **Living backgrounds** for every place in the story, all painted in one pixel-art style, from the
  silk mill in Lavilledieu across the steppe and the night sea to Hara Kei's moonlit village. Each
  is built from layers that move: clouds drift, trees and curtains sway, boats bob, the mill wheel
  turns, and the view shifts a little with the mouse. On top, sakura petals and autumn leaves fall,
  lanterns and fires flicker, water glints, fireflies wander, smoke and steam rise and birds cross
  the sky. The name of each new place fades in at the top of the screen when the story arrives.
* **Music and sound composed in code**: nine pieces (a waltz for the town, Hélène's piano, koto and
  bamboo flute for Japan, drums for the war…), a sound for every place (the sea, the mill, a
  ticking clock, crickets, a fire, the harbour, rain and thunder) and effects at the key moments.
  A recording with the same name in `assets/` always takes over.
* **Characters who feel alive**: Hélène, Balbadiou, Hara Kei, the woman and Madame Blanche breathe,
  sway a little, blink now and then, nod while they talk, react to their mood, and take on the light
  of the place they stand in (firelight, dusk, moonlight, grey rain). Hervé's face is in the text box.
* **Painted close-ups** of the cup, the glove and the letter.

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
  scenefx.js          living backgrounds (petals, lanterns, water, smoke, birds...)
  scenery.js          the painted backgrounds' moving layers
  cutscene.js         cutscenes: camera moves, captions, the journey map, letters
  minigames.js        the minigames (tea, eggs, bargain, hide, letter)
  strand.js           the press-start screen: a glowing thread of silk
  audio.js            music, sounds, menu beeps
  synth.js            the music, ambience and sound effects, composed in code
  main.js             start-up, keyboard/mouse input, screen scaling
story/script.js       THE STORY: edit this to change the game
story/cutscenes.js    the cutscenes (shots, camera moves, captions)
story/scenery.js      how each painted background's layers move (generated)
story/blinks.js       where each character's eyes are, for blinking (generated)
docs/SCRIPTING.md     how to write the story script
docs/ASSETS.md        every background, sprite, CG and track the story uses
assets/               drop art and audio here (see docs/ASSETS.md)
tools/check-script.js checks the story for mistakes:  node tools/check-script.js
tools/paint-backgrounds.js  paints the pixel-art scenes in tools/paint/ into assets/scenes/
tools/paint-blinks.js       paints the characters' blinking eyelids
tools/extract-map.js        extracts the journey map's coastlines from Natural Earth data
```

## Adding art and music

Put files in `assets/` using the names listed in [`docs/ASSETS.md`](docs/ASSETS.md). For example,
`assets/sprites/helene/sad.png` replaces Hélène's "sad" placeholder. Reload the page to see them.
