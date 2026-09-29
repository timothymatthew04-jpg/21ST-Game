# SILK

A branching visual novel adapted from Alessandro Baricco's *Silk*, built on a small web engine with
*Doki Doki Literature Club*-style mechanics: an animated ginkgo title screen with a glowing brush
logo, and Japanese visual-novel dialogue on washi paper with lacquer and gold.

You play Hervé Joncour. Your choices shape his marriage to Hélène, his commitment to the silk trade,
and his obsession with a woman in Japan. From the very first choice (stay in the army, or follow
Baldabiou into the silk trade) the story branches across seventeen chapters and an interlude into
six endings, and a flowchart shows where you have been and which roads are still unexplored.

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

In the walking areas: ← → or A/D to walk (or hold a side of the screen), Shift to run, and E, Space,
Enter or a click to look, take or talk. Esc opens the game menu, and Skip moves straight on.

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
* **Francs and keepsakes.** Baldabiou's purse, a father's watch, Hélène's handkerchief, a pressed
  blossom, Hara Kei's pass… The kinder choice often costs something real: paying instead of
  threatening, giving up the watch, sending for the doctor from Nîmes. What Hervé gives away is
  noticed later.
* **Minigames**: the tea ceremony, sorting the eggs, bargaining with Hara Kei, hiding from soldiers
  in the burned village, and mending the torn letter (four strips, each matched to the faint trace
  of its words on the page). Short and forgiving, and none can stop the story.
* **Voices.** Characters murmur as they talk: a muffled, wordless voice of their own (Hara Kei low,
  slow and firm, Baldabiou quick and loud, Hélène gentle, the woman barely above a whisper), so you
  hear that someone is speaking without hearing words. Narration and Hervé's thoughts come with a
  soft tap as the words appear, like a nib touching paper. Both can be turned off in Settings.
* **First meetings.** The first time we meet each character, the screen shakes, speed lines and a
  band of their colour sweep across with a streak of light, sparks and silk threads; their portrait
  slides in, their name rises letter by letter, a seal is stamped beside a line about who they are,
  and their own theme plays (Hervé's marching drum, Hélène's music box, Baldabiou's brass, Hara Kei's
  temple bell and koto, a lone flute for the woman). The woman in Japan is only "???" until a letter
  gives her name away; then her card plays again and the name is brushed in.
* **Walking areas**, in the style of *Kingdom Two Crowns*: at the army camp, across the steppe on
  horseback, through Hara Kei's village at night, the aviary, the burned village and the cemetery,
  Hervé walks through a wide painted place that scrolls in layers and is mirrored in the water
  below, with snow, ash, petals or fireflies drifting through. Pick up francs and keepsakes (a white
  feather, a hairpin in the ashes, wildflowers for a grave), look at things, and talk to the people
  on the way; what you find can change a line later. Choices, cutscenes and minigames all stay: the
  walks are short passages between them, and each can be skipped.
* **Routes you can feel.** At every chapter the story works out where Hervé's heart is heading:
  devoted, torn or lost. The chapter card turns to dawn rose and petals or to crimson, ash and a
  crack; the text box warms or darkens; and characters speak to him differently.
* **Scenes only some players see.** Many choices open a short scene of their own, and later
  chapters change their dialogue based on the variables and on earlier choices.
* **Six endings**, each with a Japanese name: *Hidamari — A Quiet Life*, *Wagaya — A House of Our
  Own*, *Yukue Shirezu — Lost Without Goodbye*, *Owaranu Tabi — The Journey That Never Ended*,
  *Utsusemi — The Life He Left Behind* and *Kikyō — Home*. Each is revealed with its own seal, colours
  and music, followed by end credits that roll over every place you saw, then a last screen to go
  back to the title, open the flowchart, or quit the game. Endings not yet found show a hint.
* **The Road East.** Each journey is played on the old map of Eurasia: the ride stops for a border
  guard at Metz, a storm on the steppe, the ice of Lake Baikal, two roads past the Urals (one with
  riders on it), a river in flood, the smugglers of Sabirk. Pay, give up a keepsake, lose days, or
  risk fever and danger. On the way home the eggs must be kept cool, dry and warm, and how well they
  were kept shows when they are sorted.
* **Action in the walks**: hiding from soldiers' lanterns in the burned village (crouch behind walls
  while their light sweeps past), outriding bandits across the steppe (jump the logs, duck the
  branches), and crossing a road under shellfire. Getting caught changes the story, never ends it.
* **Hara Kei's patience.** Before the price is set, a duel of words: three things he says, three
  ways to answer each, and only his fan to show how they were taken (steady, slowing, snapped shut).
  How it goes makes the bargaining easier or harder.
* **Slow-motion choices** at the soldiers' barrier and in the forest: the colour drains, everything
  slows, the music falls away and a heartbeat takes its place. **Silence** right before the truth,
  and a **ringing in the ears** after the war and after a shell lands too close.
* **Hélène's side of the story.** After the first ending, three scenes of her own appear where they
  happened: watching the road the day he leaves, asking Madame Blanche for lessons, and writing the
  letter by candlelight.
* **The seasons turn**: montages of the garden through spring, autumn and winter while Hervé stays
  in France, and the years passing before the end.
* **Clues to the letter.** Seven small things can be noticed along the way, if the player looks.
  Before the truth, a board asks who wrote the letter, who helped, and why; seeing it first gives the
  Home ending a scene of its own.
* **A camera in dialogue**: close-ups, a slow push in, a cut-in on the eyes, and a split screen with
  Hélène in France and Hervé on the road at once.
* **A cinematic opening** that plays by itself (a sea of clouds, silver grass in the wind, a gate in
  the sea at sunset, the logo painting itself in), and **a war** that looks like one: a castle
  burning, armies marching, rockets, guns, warships firing broadsides.
* **Flowchart** of every chapter, choice and option (on the title screen and in the game menu):
  the options you chose on this journey are lit, ones taken on earlier journeys are marked, and
  where an untried option leads stays "???" until you take it.
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
* **Game menu** in the title screen's style: lacquer, gold and a vermilion seal, with Resume and
  Exit to Title, the save and load screens, settings, history and the flowchart.
* **Settings** for text speed, auto speed, the choice timer, music, sound and voice volume, the
  character voices, the typing sound, speaker highlight and reduced motion.
* **A thread of silk to begin.** Before the menu, a single glowing strand flows across the dark;
  click and it branches into a burst of light that swells until the whole screen is bright, then
  slowly draws back to reveal the menu.
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
* **Music and sound composed in code**: eighteen pieces with strings, brass, choir, piano, koto,
  flute and drums, from a waltz for the town and Hélène's piano to a battle, a chase through the
  ruins, a storm, a lament, a farewell that swells slowly, and the truth arriving in the major. Each
  piece moves through sections instead of looping one phrase. Every place has its own sound (the
  sea, the mill, a ticking clock, crickets, a fire, the harbour, rain and thunder), the war is heard
  all around (cannon, volleys, falling shells, shouting, drums and horns), and effects mark the key
  moments. A recording with the same name in `assets/` always takes over.
* **Characters who feel alive**: Hélène, Baldabiou, Hara Kei, the woman and Madame Blanche breathe,
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
  walk.js             the walking areas: scrolling, water, people, weather, things to take
  flowchart.js        the flowchart of choices, worked out from the script
  journey.js          the Road East: the route across the map, and the events along it
  strand.js           the press-start screen: a glowing thread of silk
  audio.js            music, sounds, menu beeps
  synth.js            the music, ambience and sound effects, composed in code
  main.js             start-up, keyboard/mouse input, screen scaling
story/script.js       THE STORY: edit this to change the game
story/cutscenes.js    the cutscenes (shots, camera moves, captions)
story/walks.js        the walking areas: what is where, and what Hervé and others say
story/journeys.js     the journeys east and home, and what happens along the way
story/clues.js        the clue board: the questions, and what the answers mean
story/walkscenery.js  the walking areas' painted layers (generated)
story/scenery.js      how each painted background's layers move (generated)
story/blinks.js       where each character's eyes are, for blinking (generated)
docs/SCRIPTING.md     how to write the story script
docs/ASSETS.md        every background, sprite, CG and track the story uses
assets/               drop art and audio here (see docs/ASSETS.md)
tools/check-script.js checks the story for mistakes:  node tools/check-script.js
tools/paint-backgrounds.js  paints the pixel-art scenes in tools/paint/ into assets/scenes/
tools/paint-walks.js        paints the wide walking-area scenes into assets/walks/
tools/paint-items.js        paints the keepsake icons into assets/ui/items/
tools/paint-blinks.js       paints the characters' blinking eyelids
tools/extract-map.js        extracts the journey map's coastlines from Natural Earth data
```

## Adding art and music

Put files in `assets/` using the names listed in [`docs/ASSETS.md`](docs/ASSETS.md). For example,
`assets/sprites/helene/sad.png` replaces Hélène's "sad" placeholder. Reload the page to see them.
