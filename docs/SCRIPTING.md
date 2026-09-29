# Writing the story

The whole story lives in [`story/script.js`](../story/script.js), written in a small script language
modeled on Ren'Py, the engine *Doki Doki Literature Club* was made in. You don't have to touch any
engine code to change the story, add chapters, or add choices.

Check the script after editing:

```sh
node tools/check-script.js
```

It lists any mistakes with their line numbers. The game also shows them on screen if you open it
with a broken script.

---

## Basics

```text
# Lines starting with # are comments.

label start                         # the game begins at "label start"
  scene joncour_home with fade      # background + transition
  show helene soft                  # a character appears (expression "soft")
  "Hélène was reading by the window."   # narration: Hervé's inner voice
  helene "You're leaving again."        # dialogue
  helene sad "You've never seen it."    # dialogue + change her expression
  inner "She simply looked at me."      # Hervé's thoughts (italic, no name tag)
  jump chapter1                     # go to another label
```

Indentation is only for readability, except inside `menu` blocks (see below).

## Characters

```text
character helene "Hélène" color=#f4a7b9 blip=620
character inner  ""       color=#cbbef0 italic
```

* `color` is the colour of the name tag.
* `blip` is the pitch of the optional text beeps (Settings → Text blips).
* `italic` renders the lines in italics (used for inner thoughts).
* An empty name (`""`) hides the name tag.
* `sprite=folder` uses a different sprite folder than the character's id.
* `face=id` picks the portrait shown in the text box (`assets/faces/<id>.png`, the character's id by
  default); `face=none` turns it off. The portrait appears when the character speaks without
  standing in the scene: always for Hervé, who is the player, and for voices heard over a CG.
* `voice=120` gives the character a muffled, wordless voice that murmurs while their lines type:
  the number is its pitch in Hz (about 85–120 for men, 180–250 for women). `pace=130` is the time
  between syllables in milliseconds, `muffle=1100` how muffled it is (lower is more muffled) and
  `breath=0.3` how breathy (0–1). Characters without `voice=` use the text beeps instead.

### Voices and the narrator

Lines with no speaker, `inner` thoughts and `centered` text are read aloud by the browser's own
text-to-speech, preferring natural "online" voices. The next line cuts the reading off, and
auto-advance waits for it to finish. To help it with names, add `pronounce` lines at the top:

```text
pronounce "Hervé"   "Air-vay"
pronounce "Hélène"  "Ay-lenn"
```

### First meetings

```text
intro helene "Hervé's wife. Her voice is the thing people remember about her." kanji 妻 sound chime
...
show helene neutral
introduce helene
```

`intro` (at the top) says how a character is presented: a line about who they are, a seal of one or
two kanji, and a sound. `introduce` plays the first-meeting animation at that moment, once per
playthrough; it is skipped while skipping, and a click moves on.

## Choices

```text
menu
  - "I'll be back before you know it." [helene_trust += 1]
      helene "You always say that."
      herve "And I always come back."
  - "It's necessary for the business." [business += 1, helene_trust -= 1]
      helene "Everything is always about the silk."
  - "Go to Japan anyway." -> japan_route [obsession += 3]
  - "Ask about the woman." if asked_who
      harakei "You asked me that once already."
```

* Each option starts with `-` and its text in quotes.
* `[ ... ]` holds the variable changes, separated by commas.
* Lines indented under an option are a **scene only that choice sees**. After it, the story continues
  after the menu.
* `-> label` jumps somewhere else instead.
* `if condition` hides the option unless the condition is true.
* `menu "Prompt text"` shows a line of narration together with the choices.

Choices trigger an autosave, so players can always go back to them.

### Timed choices and hesitation

```text
choicetime 14                       # at the top: every choice waits 14 seconds
menu time 8                         # this one waits 8 (menu notime: no timer at all)
  - "Look away." tone=quiet [danger -= 1]
  - "Ask Hara Kei who she is." tone=danger [danger += 2]
  - hesitate [fascination += 1]
      "I meant to look away. I didn't. I didn't do anything at all."
```

A silk thread above the choices burns down from both ends; near the end it turns vermilion, the
scene reddens and a heartbeat sounds. When it is gone, Hervé **hesitates**: the `- hesitate` option
(never shown) runs, with its own changes and scene. Silence is a choice too. The clock stops while
a menu is open, and players can set the timer to Relaxed or Off in Settings.
`node tools/check-script.js` warns about timed menus without a `- hesitate`.

### Tones

`tone=` gives an option its feeling, and with it a look: `tender` (rose, petals), `warm` (gold),
`honest` (clear blue), `cold` (frosted glass), `duty` (bronze, a coin), `obsession` (crimson lacquer, a
red thread), `danger` (black and embers), `curious` (midnight, stars), `quiet` (faded) or `neutral`.
Without one, the tone is guessed from what the option changes (Hélène's trust up is tender, obsession
up is obsession, and so on). While the player considers an option, its words move the way they would
be said (a wave, a tremble, a shimmer, a fade) and the text box glows, shakes, cools or fades with it.

### Costs, keepsakes and money

```text
item watch "Father's pocket watch" "Gold and heavy, never a minute wrong."   # at the top
gain item watch                # Hervé now carries it (a card slides in at the top right)
lose item watch
gain francs 300                # money is the variable "francs"
lose francs 40
menu
  - "Pay him what he asks." cost=francs:80
  - "Give him your father's watch instead." cost=item:watch
  - "Show him Hara Kei's pass." needs=item:pass
  - "Press a blossom for Hélène." gain=item:blossom [helene_trust += 1]
```

`cost=` is given up when the option is chosen; `needs=` must be carried but is kept; `gain=` is
received. Options the player can't afford are shown but locked, with what they lack; a menu never
locks every option. `has("watch")` tests for a keepsake in conditions, and `francs >= 100` for money.
The Keepsakes page in the game menu shows everything Hervé carries; icons live in
`assets/ui/items/<id>.png` (painted by `tools/paint-items.js`).

### Minigames

```text
minigame tea into tea_result
if tea_result == "win"
  harakei "You watch carefully, Monsieur Joncour."
endif
```

| Game | Result | What the player does |
| --- | --- | --- |
| `tea` | `win` / `lose` | watches her serve the tea, then repeats the movements in order |
| `eggs` | `win` / `lose` | picks out the grey, sick eggs before the thread burns out (`minigame eggs dead`: the last eggs, where nothing can be won) |
| `bargain` | `good` / `fair` / `poor` / `insult` | stops a brush on a fair price, three rounds |
| `hide` | `safe` / `caught` | runs from wall to wall while the soldier's lantern looks away |
| `letter` | `win` | puts four torn strips back on the page, each where the faint trace of its words shows (a wrong strip slips back; after three misses the right one glows) |

Games that can be failed offer another try or let the moment pass; none can stop the story. The
script decides what each result costs or brings.

### Routes

```text
routescore helene_trust * 2 - obsession * 0.6 - danger * 0.4
routes -4 3
```

At every chapter the score says where Hervé's heart is heading: at or below the first number the
route is `lost`, at or above the second `devoted`, otherwise `torn`. The chapter card takes on that
mood (dawn rose and petals, or crimson, ash and a crack), a line marks the moment the route changes,
and the text box's rim warms or darkens during play. Scenes can ask `if route() == "lost"`.

## Karma: making choices felt

The variables a choice changes are never shown as numbers. Instead, declare which ones matter at
the top of the script, and the game makes the player *feel* them:

```text
karma helene_trust color=#f4a7b9 heavy=down up="Hélène will remember that." down="Something in Hélène goes quiet."
karma obsession    color=#e2553f heavy=up   up="Japan pulls at you a little harder."
```

* When a choice (or a `set x += …` line) moves one of these, its line fades in at the top of the
  screen along a thread of its `color`. At most two show per choice; threads declared first speak first.
* `heavy` is the direction that costs something. A heavy moment darkens the scene with a heartbeat
  and a low tone; the opposite direction glows warmly with a soft chord. The music dips either way.
* While the player is deciding, the scene dims and the music quietens; the chosen line lingers a
  moment before the story moves on.
* At the ending, **See your choices** lists every choice the player made, chapter by chapter, with
  the lines each one caused.

## Variables and conditions

```text
set obsession += 5
set glove = "left"
set told_helene = true        # "set told_helene" on its own also means true

if helene_trust >= 3
  helene "You came back."
elif helene_trust < 0
  helene "It's a beautiful garden."
else
  helene "It's a strange thing, a garden."
endif

if went_china -> china_scene   # one-line conditional jump
```

Conditions understand `== != < <= > >=`, `and or not`, `+ - * / %`, parentheses, `"strings"`,
`true`/`false`, and a few helpers:

| Helper | What it gives you |
| --- | --- |
| `top("helene_trust", "obsession")` | name of the variable with the highest value |
| `visited("chapter6")` | how many times the player passed that label |
| `seen_ending("home_beside")` | true once the player has reached that ending |
| `endings()` | number of different endings reached |
| `random(1, 6)` | a whole number from 1 to 6 |
| `max(a, b)`, `min(a, b)`, `abs`, `round`, `floor`, `ceil` | maths |

A variable that was never set counts as `0` (or false).

### Persistent variables (memory across playthroughs)

Variables starting with `persistent.` survive "New Game", like the files *DDLC* leaves behind:

```text
set persistent.knows_truth = true      # set in the final chapter

if persistent.knows_truth              # on the next playthrough...
  woman "I have {color=#f4a7b9}waited at a window{/color}..."
endif
```

### Showing variables in text

`[name]` prints a variable: `"You have [trust] trust."`. Write `[[` for a literal `[`.

## Visuals

| Command | Example |
| --- | --- |
| `scene name [with transition]` | `scene japan_coast with fade`. It clears the characters. `black` and `white` are built in. |
| `show id [expression] [at position] [with transition]` | `show helene soft at left` |
| `hide id` / `hide all` | `hide woman with slow` |
| `cg name` / `cg hide` | a full-screen event picture (the painted close-ups `the_cup`, `the_glove`, `the_letter` move like backgrounds) |
| `cutscene name` | play a cutscene from story/cutscenes.js (see below) |
| `tint night` / `tint #ff8800 0.3` / `tint none` | colour over the scene: `night dusk sunset dawn memory red cold` |
| `filter sepia` / `filter none` | `sepia grayscale faded dream dark` |
| `vignette on` / `vignette off` | darken the edges |
| `effect shake [seconds]` | also `flash`, `glitch`, `static`, `pulse` (heartbeat) |
| `window hide` / `window show` | hide the text box (it comes back on the next line) |

Transitions: `dissolve` (default), `fade` (through black), `flash` (through white), `slow`, `none`.
Add seconds to override the length: `scene cemetery with fade 3`.

Positions: `farleft left center right farright`, or a number from 0 to 100. Without `at`, characters
share the screen automatically and slide over when someone joins or leaves.

The character who is talking is highlighted and the others dim slightly (Settings → Highlight the speaker).

## Text effects

Inside any line:

| Tag | Effect |
| --- | --- |
| `{b}…{/b}` `{i}…{/i}` `{u}…{/u}` `{s}…{/s}` | bold, italic, underline, strike |
| `{color=#f4a7b9}…{/color}` | colour |
| `{size=40}…{/size}` | size in pixels |
| `{shake}…{/shake}` | trembling letters |
| `{wave}…{/wave}` | floating letters |
| `{glitch}…{/glitch}` | letters that corrupt and flicker |
| `{w=0.5}` | pause for half a second |
| `{w}` | wait for a click in the middle of a line |
| `{speed=0.5}…{/speed}` | type slower (or faster, e.g. `2`) |
| `{nw}` | go to the next line without waiting for a click |

`centered "Text"` shows a line alone, centered on a dark screen (for dates and dramatic moments).

## Structure

```text
chapter "Chapter 3" "The Cup" seal 杯   # title card; also names the save file
pause 1.5                       # wait (a click skips it); "pause" alone waits for a click
notify "Hélène will remember that."    # a line at the top of the screen, like a karma line
call some_label / return        # run a shared scene and come back
ending home_beside "Home — Beside Me All Along" true    # true | good | bad | neutral
end                             # back to the title without an ending screen
rollback off / rollback on      # stop players from going back (e.g. after a big reveal)
```

Every `ending` in the script is listed on the Endings screen automatically, locked until found.

The chapter card turns the title into a kanji chapter number by itself ("Prologue" → 序章,
"Chapter 12" → 第十二章, "Final Chapter" → 終章). `seal` is the character (or two) stamped on the
card; `kanji 第三章` overrides the number.

## Cutscenes

`cutscene name` plays one of the cutscenes defined in `story/cutscenes.js`. A cutscene is a list of
shots; each shows a painted scene through a slowly moving camera, with letterbox bars and a caption:

```js
the_cup: {
  shots: [
    { bg: 'estate_tearoom', dur: 3.5, cam: [[1.0, 0.5, 0.5], [1.28, 0.5, 0.78]] },
    { bg: 'the_cup', dur: 6.5, cam: [[1.7, 0.43, 0.55], [1.2, 0.5, 0.58]], sound: [['cup', 0.5, 1]] },
  ],
},
```

`cam` is `[zoom, x, y]`: the point to look at, as fractions of the picture, and how close; two of
them make a move. A shot can also have `text` (a caption), `title` (big words across the middle),
`kanji` (large brushed characters), `fx` (extra effects written like a `bgfx` line), `sound`,
`flash`, `shake`, `tint`, `sprites` (characters standing in the shot), `trans` (`fade`, `cut`,
`white`, `black`), a `map` (Hervé's route drawn across the journey map, the camera following it) or
a `letter` (a sheet of paper whose words are written out, in Japanese columns or French
handwriting). Every option is described at the top of `story/cutscenes.js`.

Players click to move to the next shot and press Esc (or Skip) to end the cutscene; skip mode passes
cutscenes by.

## The word game (DDLC's poem game)

Define a word bank, then call `poem` where you want it:

```text
poemwords
  garden   helene=3 woman=1
  eggs     balbadiou=3 woman=1
  silence  woman=3 helene=1
endpoemwords

poem words 10 title "Hervé's Journal"
if poem_winner == "helene"
  set helene_trust += 1
endif
```

Each word gives points to characters. The character who likes a word most hops when it's picked.
Afterwards the game sets `poem_<id>` (points per character), `poem_winner` and `poem_text`.

## Music and sound

```text
play music japan fadein 3
play ambience waves fadein 2      # a second looping layer (rain, sea, birds)
play sound cup volume 0.8
stop music fadeout 2
titlemusic title                  # at the top of the script
bgsound japan_coast waves         # at the top: the sound of a place, started whenever the story arrives there
```

Files are found by name, see the asset folders below. When there is no file, the game plays its own
music and sounds, composed in code (js/synth.js):

* **Music**: `town_theme`, `helene_theme`, `journey`, `japan`, `her_theme`, `war`, `letter`, `home`,
  `sorrow`; intense: `battle`, `tension`, `pursuit`, `storm`; emotional: `lament`, `farewell`,
  `reverie`, `departure`, `revelation`.
* **Ambience**: `waves`, `wind`, `birds`, `rain`, `storm`, `fire`, `crickets`, `night`, `temple`,
  `forest`, `camp`, `mill`, `clock`, `room`, `city`, `harbour`, `boat`, `stream`, `ruins`, `unrest`,
  `aviary`, `battle` (the war all around), `battle_far` (the war heard from the hills).
* **Sounds**: `bell`, `temple_bell`, `chime`, `heartbeat`, `heartbeat_fast`, `thunder`, `cannon`,
  `page`, `paper`, `knock`, `cup`, `gong`, `wind_gust`, `breath`, `ink`, `whoosh`, `stamp`,
  `sparkle`, `candle_out`; war: `musket`, `volley`, `explosion`, `shell`, `horn`, `drumroll`,
  `shouts`, `sword`; drama: `sting` (an orchestral hit), `swell`, `dread`; everyday: `footsteps`,
  `running`, `gallop`, `door`, `creak`, `pour`, `rustle`, `shatter`, `splash`.

Music and ambience loop seamlessly: recordings crossfade the last few seconds of each pass into the
next, and the composed pieces never repeat exactly. `titlemusic` plays only on the title screen;
starting or loading a game fades it out. `node tools/check-script.js` warns about any name that has
neither a file nor a composed version.

## Game-wide settings (top of the script)

```text
title "SILK" "A choice simulation"
emblem "絹"
credits "Adapted from Silk by Alessandro Baricco"
titlemusic title
titlebackground title_cover       # picture behind the title screen (assets/bg/title_cover.webp)
titlefx ginkgo sun=0.3,-0.25 sway=0.28,0.22,0.34,0.3 pivot=0.4,0.85   # animate the title screen (see below)
titlelogo brush                   # glowing brush lettering (or: carved)
splash strand                     # press start: a glowing thread of silk that branches into light (or: logo)
choicetime 14                     # every choice waits this long before Hervé hesitates (0: no timer)
routescore helene_trust * 2 - obsession * 0.6 - danger * 0.4   # where the heart is heading
routes -4 3                       # at or below: "lost"; at or above: "devoted"; between: "torn"
artstyle smooth                   # pixel | smooth | mixed (see below)
warning "Text shown once, the first time the game is opened."
background hara_kei_estate "assets/bg/some-other-name.jpg"   # only if a file doesn't follow the naming rule
```

`titlefx` brings the title picture to life. For **painted** art use `ginkgo`, `sakura` or `maple`:
leaves tumbling in 3D with depth of field, gusts of wind every few seconds (leaves tear off the tree,
streaks of air rush past, the canopy sways harder), sun-dapples shimmering where light already falls
in the painting, glints on the leaves, light rays and drifting pollen. `sun` is where the light comes
from; `sway` is the ellipse of canopy that moves (centre x,y and radius x,y) and `pivot` is the point
it sways around (the base of the trunk); both are fractions of the picture, so they stay on the tree
at any screen shape. Moving leaf shadows fall on the walls and ground, and the nearest leaves cast
soft shadows of their own. For **pixel** art use `autumn`, `spring` or `summer` (pixel leaves, light
shafts, mist); there `rays` sets where the shafts come from. `sun` and `rays` are fractions of the
screen (0,0 is the top-left corner; values outside 0–1 are off-screen).

`titlelogo brush` draws the title as glowing hand-painted brush strokes with a breathing halo, a gleam
running across the letters, sparkles, embers and a warm haze, and a soft shadow under the letters
keeps them readable on bright art (the letters s, i, l and k are hand-drawn in js/brushlogo.js; other
letters fall back to a brush font). `titlelogo carved` draws carved stone
lettering instead. The title itself is drawn
as a carved logo: the first letter oversized, spanning the name and the subtitle, with a sweeping
gleam, glints and a silk ribbon (js/titlelogo.js).

### Places and living backgrounds

```text
place hara_kei_estate "Hara Kei's Village" "The hills of Japan"
bgfx hara_kei_estate glow=0.435,0.16,0.09,#cfe0ff flame=0.287,0.665,0.03 leaves glints=0.24,0.8,0.54,0.19
```

```text
bgsound hara_kei_estate temple            # the place's own sound (and an optional volume)
bglight hara_kei_estate night             # how its light falls on the characters
```

`bgsound` starts the place's sound whenever the story arrives there and fades it when it leaves, so
scripts don't need `play ambience` lines. `bglight` tints the characters standing in a place:
`day`, `warm`, `fire`, `dusk`, `night`, `moon`, `grey`, `dim` or `ash` (or any CSS filter).

`place` names where a background is. The first time the story arrives there, the name fades in at
the top of the screen (with the region above it), so the player always knows where Hervé has gone.

`bgfx` brings a background to life. Several `bgfx` lines for the same background add up. All
positions and sizes are fractions of the picture (0,0 is its top-left corner), so they stay on the
lantern or the pond at any window shape; `#colour` is optional everywhere.

| Effect | Numbers | What it does |
| --- | --- | --- |
| `petals`, `leaves`, `foliage`, `snow`, `ash` | density [, x,y,w,h] | falling sakura petals, autumn leaves, green-gold leaves, snow, ash; with a region (e.g. a window) they only fall there |
| `rain` | density [, x,y,w,h] | slanting rain, optionally only inside a window |
| `fireflies`, `motes`, `glints`, `stars` | x,y,w,h [, count] | fireflies wandering, dust drifting in light, sparkles on water, twinkling stars, inside a region |
| `smoke`, `steam`, `embers` | x,y [, scale] | rising from a point: chimney or fire smoke, steam from tea, sparks |
| `birds` | count [, top, bottom] | birds crossing the sky between two heights |
| `flutter` | x,y,w,h [, count] | birds hopping and flying inside a cage |
| `glow` | x,y,radius | a slow, breathing light: a moon, a window |
| `flame` | x,y,radius | a flickering light: a lantern, a candle, a fire |
| `rays` | x,y [, spread, strength] | shafts of light fanning down from a point, swaying |
| `mist` | y,height [, opacity] | a band of fog drifting across |
| `rock` | | the whole picture rocks gently, like a boat |

`artstyle` decides how pictures are scaled. `pixel` keeps every pixel crisp (for pixel art),
`smooth` scales everything softly (for painted or high-resolution art), and `mixed` (the default)
keeps backgrounds and CGs crisp but draws character sprites smoothly.

## Where the art and sound go

Drop files into these folders with these names and they appear the next time you open the game.
Until then, the game draws placeholders.

| What | Where | Notes |
| --- | --- | --- |
| Backgrounds | `assets/bg/<name>.png` (or `.jpg`, `.webp`) | 1280×720 or 1920×1080 |
| Character sprites | `assets/sprites/<character>/<expression>.png` | transparent PNG, about 720–1000 px tall, feet at the bottom edge; `neutral.png` is the default and stands in for any expression without its own picture |
| Text-box portraits | `assets/faces/<character>.png` | square transparent PNG of the head and shoulders |
| Event pictures (CGs) | `assets/cg/<name>.png` | 1280×720 or larger, 16:9 |
| Word-game chibis | `assets/chibi/<character>.png` | small transparent PNG |
| Music | `assets/music/<name>.mp3` (or `.ogg`, `.m4a`) | loops automatically |
| Sound effects | `assets/sfx/<name>.mp3` | |

For example, `show helene sad` looks for `assets/sprites/helene/sad.png`.

## Testing a chapter quickly

Open the game with the label name after a `#` to start straight from it:
`index.html#chapter7`. Press the `` ` `` key (top-left of the keyboard) in game to see every
variable's current value.
