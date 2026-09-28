# Art and audio checklist

Every file the Silk story asks for. Until a file exists, the game shows a placeholder (or plays
silence), so art can be added one piece at a time in any order.

Regenerate this list after editing the story with `node tools/check-script.js --assets`.

## Backgrounds: painted in code, `assets/scenes/<name>/`

Every background is pixel art painted by `tools/paint-backgrounds.js` from the scenes in
`tools/paint/`, all in one style. Each is saved as layers (`assets/scenes/<name>/<layer>.png`, plus
`flat.png` for thumbnails), and `story/scenery.js` says how each layer moves. Hara Kei's village,
the tea room, the tatami room and the torii path were repainted from your four reference
illustrations (kept in `docs/reference-art/`), keeping their layout.

To change one, edit its scene in `tools/paint/` and run `node tools/paint-backgrounds.js <name>`. A
picture saved as `assets/bg/<name>.png` (or `.jpg`, `.webp`) is used only for backgrounds that have
no painted version.

| Scene | Where it's used |
| --- | --- |
| `lavilledieu` | Prologue: the town, the river and the mill wheel |
| `silk_mill`, `silk_mill_empty` | Prologue, Chapter 4; Chapter 13 after the eggs fail |
| `balbadiou_office` | Prologue, Chapters 5 and 10 |
| `joncour_home` | Chapters 1 and 14: Hervé and Hélène's house |
| `road_east`, `road_winter`, `road_rain` | The journeys across Europe and Russia |
| `smuggler_boat` | The night crossing to Japan |
| `china_dock` | Chapter 10: the harbour in China |
| `japan_coast` | Chapter 2: arriving in Japan |
| `japan_path` | Chapter 2: led inland through the forest, past a torii |
| `hara_kei_estate`, `estate_day`, `estate_unrest` | Hara Kei's village: at night, by day, in troubled times |
| `estate_tearoom` | Chapter 3: the moonlit room where tea is served |
| `estate_room` | Chapter 6: the room with her belongings |
| `aviary` | Chapter 6: Hara Kei's great bird cage |
| `helene_garden`, `garden_winter` | Chapters 4, 8 and 15: the garden Hervé makes for Hélène |
| `blanche_salon` | Chapters 7 and 14, Final Chapter: Madame Blanche's house |
| `burned_village` | Chapter 11: the abandoned village |
| `forest_camp_night` | Chapter 12: Hara Kei's camp in the forest |
| `helene_sickroom` | Chapter 15 |
| `cemetery`, `cemetery_grey`, `cemetery_night` | The three endings |

The cutscenes use a few more paintings: `journey_map` (Europe to Japan, drawn from Natural Earth
coastlines), `cs_worms` (the dying silkworms), `cs_warships` (the black ships), `cs_candle` and
`cs_candle_dawn`, and the close-ups `the_cup`, `the_glove` and `the_letter`, which are also the
event pictures (CGs).

The title screen uses `title_cover` (already added: the ginkgo courtyard painting, 2000×1117 at its
original resolution with a gentle contrast curve for deeper shadows). It is sharp at 1080p; on 1440p
and 4K screens it is enlarged a little. A larger original (3840×2160 is ideal) can simply replace
`assets/bg/title_cover.webp`. The leaves, light, wind and logo are drawn by the game at the screen's
full resolution, so they stay sharp at any size.

The story uses `artstyle smooth`: the backgrounds are pixel art drawn at high resolution, so they
are scaled smoothly and stay sharp at any window size (see docs/SCRIPTING.md).

## Character sprites: `assets/sprites/<character>/<expression>.png`

Transparent PNG, about 720–1000 px tall, feet touching the bottom edge. All six characters are in
(`neutral.png` for each, cut to a common scale so their heights match). Until a character has a
picture for an expression, their neutral one is used and the pose reacts instead: it lifts for
happy moods and sinks for sad ones. Expression pictures can be added one at a time.

Each character also has `blink.png`: their eyes half closed and closed, painted from their own
skin and lash colours by `tools/paint-blinks.js`, which lays them over the eyes every few seconds.
If a new `neutral.png` moves the face, update the eye positions in that tool and run it again.

Hervé is the player, so he never stands in a scene, like the protagonist in DDLC. His picture is
used for his face in the text box.

Text-box faces are in `assets/faces/<character>.png`: square head-and-shoulders crops of the
sprites. A hand-drawn portrait can simply replace any of them.

| Character | Folder | Expressions |
| --- | --- | --- |
| Hervé | `herve/` | `neutral` (used for his text-box face) |
| Hélène | `helene/` | `neutral`, `soft`, `smile`, `sad`, `hurt`, `tired` |
| Balbadiou | `balbadiou/` | `neutral`, `serious`, `happy`, `worried` |
| Hara Kei | `harakei/` | `neutral`, `stern`, `cold` |
| The woman | `woman/` | `neutral`, `gaze`, `smile`, `soft` |
| Madame Blanche | `blanche/` | `neutral`, `serious`, `soft` |

## Event pictures (CGs)

The three key moments are painted close-ups (see above). A picture saved as `assets/cg/<name>.png`
is used only for a CG that has no painted version.

| File | Moment |
| --- | --- |
| `the_cup` | Chapter 3: the teacup set down in front of Hervé |
| `the_glove` | Chapter 6: the glove among her belongings |
| `the_letter` | Chapter 14 and Final Chapter: the seven pages of black ink |

## Word-game chibis: `assets/chibi/<character>.png`

Small transparent PNGs (about 110 px wide) for Hervé's Journal: `helene`, `woman`, `balbadiou`.

## Music, ambience and sounds

All of them are composed in code (js/synth.js) except the title music, `assets/music/title.mp3`.
To use a recording instead, save it under the same name and it takes over: music and ambience in
`assets/music/<name>.mp3`, sounds in `assets/sfx/<name>.mp3` (`.ogg` and `.m4a` work too).

| Music | Mood / where |
| --- | --- |
| `title` | Title screen (a recording). Plays on the menu only and stops when a game starts |
| `town_theme` | The town, the mill, Balbadiou: a waltz for guitar and music box |
| `helene_theme` | Scenes with Hélène: piano over strings |
| `journey` | The long journeys: a steady pulse, a flute looking ahead |
| `japan` | Japan: koto and bamboo flute over a drone, a far temple bell |
| `her_theme` | The woman, the cup, the note, the letter: high and weightless |
| `war` | Chapter 10: drums and a crying flute |
| `sorrow` | The empty mill, the sickroom |
| `letter` | Final Chapter: the truth, from minor into major |
| `home` | The endings: music box and piano |

Each place's ambience is set by the `bgsound` lines at the top of the story script; the full list
of ambiences and sounds is in docs/SCRIPTING.md.
