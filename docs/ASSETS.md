# Art and audio checklist

Every file the Silk story asks for. Until a file exists, the game shows a placeholder (or plays
silence), so art can be added one piece at a time in any order.

Regenerate this list after editing the story with `node tools/check-script.js --assets`.

## Backgrounds: `assets/bg/<name>.png`

1280×720 or 1920×1080 (16:9). `.jpg` and `.webp` work too.

| File | Where it's used |
| --- | --- |
| `silk_mill` | Prologue, Chapters 4 and 13: the town's silk mill |
| `balbadiou_office` | Prologue, Chapters 5 and 10 |
| `joncour_home` | Chapters 1 and 14: Hervé and Hélène's house |
| `road_east` | The long journeys across Europe and Russia |
| `smuggler_boat` | The night crossing to Japan, and the dock in China |
| `japan_coast` | Chapter 2: arriving in Japan |
| `hara_kei_estate` | Chapters 2, 5, 7 and 9: Hara Kei's village in the hills |
| `estate_tearoom` | Chapters 3 and 6: the room where the cup scene happens |
| `helene_garden` | Chapters 4, 8 and 15: the garden Hervé makes for Hélène |
| `aviary` | Chapter 6: Hara Kei's great bird cage |
| `blanche_salon` | Chapters 7 and 14, Final Chapter: Madame Blanche's house |
| `burned_village` | Chapter 11: the abandoned village |
| `forest_camp_night` | Chapter 12: Hara Kei's camp in the forest |
| `silk_mill_empty` | Chapter 13: the mill after the eggs fail |
| `helene_sickroom` | Chapter 15 |
| `cemetery` | Ending: Hélène's grave |

The title screen uses `title_cover` (already added: the temple in autumn). The falling leaves,
light and mist on top of it are drawn by the game, so the picture itself can stay a still image.

Backgrounds and CGs are drawn pixel-crisp to match the cover. If they turn out to be painted or
high-resolution instead, change `artstyle` at the top of the script (see docs/SCRIPTING.md).

## Character sprites: `assets/sprites/<character>/<expression>.png`

Transparent PNG, about 720–1000 px tall, feet touching the bottom edge. The game scales them to the
screen height. Hervé is the player, so he has no sprite, like the protagonist in DDLC.

| Character | Folder | Expressions |
| --- | --- | --- |
| Hélène | `helene/` | `neutral`, `soft`, `smile`, `sad`, `hurt`, `tired` |
| Balbadiou | `balbadiou/` | `neutral`, `serious`, `happy`, `worried` |
| Hara Kei | `harakei/` | `neutral`, `stern`, `cold` |
| The woman | `woman/` | `neutral`, `gaze`, `smile`, `soft` |
| Madame Blanche | `blanche/` | `neutral`, `serious`, `soft` |

## Event pictures (CGs): `assets/cg/<name>.png`

Full-screen 16:9 illustrations for the key moments.

| File | Moment |
| --- | --- |
| `the_cup` | Chapter 3: the teacup set down in front of Hervé |
| `the_glove` | Chapter 6: the glove among her belongings |
| `the_letter` | Chapter 14 and Final Chapter: the seven pages of black ink |

## Word-game chibis: `assets/chibi/<character>.png`

Small transparent PNGs (about 110 px wide) for Hervé's Journal: `helene`, `woman`, `balbadiou`.

## Music: `assets/music/<name>.mp3`

Loops automatically. `.ogg` and `.m4a` work too.

| File | Mood / where |
| --- | --- |
| `title` | Title screen |
| `town_theme` | The town, the mill, Balbadiou |
| `helene_theme` | Scenes with Hélène |
| `journey` | The long journeys |
| `japan` | Hara Kei's estate |
| `her_theme` | The woman, the note, the letter |
| `war` | Chapter 10 |
| `letter` | Final Chapter: the truth |
| `home` | Ending |

## Ambience: `assets/music/<name>.mp3`

Quiet background loops layered under the music: `waves`, `birds`, `wind`.
