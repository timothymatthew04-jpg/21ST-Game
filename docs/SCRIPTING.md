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
| `cg name` / `cg hide` | a full-screen event picture |
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
chapter "Chapter 3" "The Cup"   # title card; also names the save file
pause 1.5                       # wait (a click skips it); "pause" alone waits for a click
notify "Hélène will remember that."    # a line at the top of the screen, like a karma line
call some_label / return        # run a shared scene and come back
ending home_beside "Home — Beside Me All Along" true    # true | good | bad | neutral
end                             # back to the title without an ending screen
rollback off / rollback on      # stop players from going back (e.g. after a big reveal)
```

Every `ending` in the script is listed on the Endings screen automatically, locked until found.

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
play sound door
stop music fadeout 2
titlemusic title                  # at the top of the script
```

Files are found by name, see the asset folders below. Anything missing is silent. Music and ambience
loop seamlessly: the last few seconds of each pass crossfade into the next. `titlemusic` plays only
on the title screen; starting or loading a game fades it out.

## Game-wide settings (top of the script)

```text
title "SILK" "A choice simulation"
emblem "絹"
credits "Adapted from Silk by Alessandro Baricco"
titlemusic title
titlebackground title_cover       # picture behind the title screen (assets/bg/title_cover.webp)
titlefx ginkgo sun=0.3,-0.25 sway=0.28,0.22,0.34,0.3 pivot=0.4,0.85   # animate the title screen (see below)
titlelogo brush                   # glowing brush lettering (or: carved)
artstyle mixed                    # pixel | smooth | mixed (see below)
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
