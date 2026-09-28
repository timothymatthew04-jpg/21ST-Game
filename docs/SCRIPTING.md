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
notify "Hélène will remember that."    # small pop-up in the corner
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

Files are found by name, see the asset folders below. Anything missing is silent.

## Game-wide settings (top of the script)

```text
title "SILK" "A choice simulation"
emblem "絹"
credits "Adapted from Silk by Alessandro Baricco"
titlemusic title
titlebackground title_cover       # picture behind the title screen (assets/bg/title_cover.webp)
artstyle mixed                    # pixel | smooth | mixed (see below)
warning "Text shown once, the first time the game is opened."
background hara_kei_estate "assets/bg/some-other-name.jpg"   # only if a file doesn't follow the naming rule
```

`artstyle` decides how pictures are scaled. `pixel` keeps every pixel crisp (for pixel art),
`smooth` scales everything softly (for painted or high-resolution art), and `mixed` (the default)
keeps backgrounds and CGs crisp but draws character sprites smoothly.

## Where the art and sound go

Drop files into these folders with these names and they appear the next time you open the game.
Until then, the game draws placeholders.

| What | Where | Notes |
| --- | --- | --- |
| Backgrounds | `assets/bg/<name>.png` (or `.jpg`, `.webp`) | 1280×720 or 1920×1080 |
| Character sprites | `assets/sprites/<character>/<expression>.png` | transparent PNG, about 720–1000 px tall, feet at the bottom edge; `neutral.png` is the default |
| Event pictures (CGs) | `assets/cg/<name>.png` | 1280×720 or larger, 16:9 |
| Word-game chibis | `assets/chibi/<character>.png` | small transparent PNG |
| Music | `assets/music/<name>.mp3` (or `.ogg`, `.m4a`) | loops automatically |
| Sound effects | `assets/sfx/<name>.mp3` | |

For example, `show helene sad` looks for `assets/sprites/helene/sad.png`.

## Testing a chapter quickly

Open the game with the label name after a `#` to start straight from it:
`index.html#chapter7`. Press the `` ` `` key (top-left of the keyboard) in game to see every
variable's current value.
