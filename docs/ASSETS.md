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
| `blanche_salon` | Chapters 8 and 15: Madame Blanche's house |
| `burned_village` | Chapter 11: the abandoned village |
| `forest_camp_night` | Chapter 12: Hara Kei's camp in the forest |
| `helene_sickroom` | Chapter 15 |
| `cemetery`, `cemetery_grey`, `cemetery_night` | The three endings |

The cutscenes use a few more paintings: `journey_map` (Europe to Japan, drawn from Natural Earth
coastlines), `cs_worms` (the dying silkworms), `cs_warships` (the black ships), `cs_candle` and
`cs_candle_dawn`, and the close-ups `the_cup`, `the_glove` and `the_letter`, which are also the
event pictures (CGs). The opening has four of its own, a lone rider (Hervé) crossing Japan through its
seasons: `op_mountain` (a snow-capped peak under a storm, wild horses running across the plain),
`op_autumn` (a castle on a misty cliff seen through red maples), `op_sakura` (an avenue of cherry
trees in bloom) and `op_gold` (a field of golden grass under a blazing sun, where the title comes up). The war in Chapter 11 has `war_horizon` (a castle
burning at dusk, an observation balloon over the lines), `war_field` (the battlefield between the
two armies' earthworks) and `war_guns` (a battery in the smoke). The armies, guns, shells, rockets
and gunfire are drawn by the game over them (see the scene effects in docs/SCRIPTING.md).

The title screen uses `title_cover` (already added: the ginkgo courtyard painting, 2000×1117 at its
original resolution with a gentle contrast curve for deeper shadows). It is sharp at 1080p; on 1440p
and 4K screens it is enlarged a little. A larger original (3840×2160 is ideal) can simply replace
`assets/bg/title_cover.webp`. The leaves, light, wind and logo are drawn by the game at the screen's
full resolution, so they stay sharp at any size.

The story uses `artstyle smooth`: the backgrounds are pixel art drawn at high resolution, so they
are scaled smoothly and stay sharp at any window size (see docs/SCRIPTING.md).

## Walking areas: painted in code, `assets/walks/<area>/`

The army camp, where the game begins, shows France at its proudest at a pink dawn, as the heart of
the nation's military power: the regiment's headquarters (mansard roofs, a clock, the eagle in the
pediment, a square dome and the flag), ramparts topped with barbed wire and lined with lamps, iron
gun turrets, bell tents, the armoury, a shooting range with its firing step and earth butt, an
artillery park with field guns and a great mortar, and a harbour where a steam ship of the line of
the Imperial Navy lies moored, riding on the water of the basin (two white-banded gun decks, three
masts, a funnel, a carved stern), the naval arsenal's warehouses, clock tower and slipway beyond.
At the end is the great gate, two towers and a portcullis, with Czech hedgehogs along the road
north. Behind the camp a railway viaduct crosses the valley; beyond it stand citadels with siege
guns and mortars on raised batteries, the keep of Vincennes, barracks and the arsenals' stacks.
On the horizon stand the giants: a fortress-city on its rock (the main landmark), the Eiffel
Tower (an alt-history touch, like the airships), the Louvre of Napoleon III, and a great gilded
Invalides; behind them, the rest of 1860s Paris (the Tour Saint-Jacques, Notre-Dame, the
Panthéon, the Vendôme column, the Opera in scaffolding, the Arc de Triomphe, the boulevards). The
French buildings are drawn by `tools/paint/scenes-french.js`, shared with the Chapter 1 backdrop
(`army_camp`) and its cutscene.

Lavilledieu, the walk home, is an old stone river town on a bright autumn day: a meadow of late
flowers with mulberry trees turned gold, the silk mill and its wheel, a wash-house, grey stone
houses along the quay with moss in their joints and red creeper up their fronts, shutters and
geraniums, plane trees in orange and gold, a bakery and a café, a guinguette under paper
lanterns, the church and its fountain, and the Joncour house in its garden of roses and lavender.
Above the town, stone houses climb a hill in terraces to a twin-spired Gothic cathedral on its
platform (after Cologne's); beyond are windmills on the ridges (their sails turned by the walk),
a château on its rock and an abbey in the autumn woods of the foothills, and snowy mountains
behind it all. Every house and the cathedral sit on an explicit ground line (`vProfile`), so none
floats. Where the river opens toward the sea, a lighthouse stands on a sea-worn pillar of rock
(its lamp turning, its beam sweeping in the walk). It is drawn by `tools/paint/scenes-village.js`,
shared with the Lavilledieu backdrop.

The Joncour house (`joncour_home`), where Hélène is first met, is her sunlit corner on an autumn
morning: a tall window onto the garden's orange and gold trees (leaves drifting past it), trailing
plants, a wall of books, a day-bed heaped with knitted throws and cushions, a kilim rug, and her
basket of silk threads.

The eight walking areas (`camp`, `lavilledieu`, `steppe`, `village`, `aviary`, `ruins`, `crossing`, `cemetery`) are painted by
`tools/paint-walks.js` from `tools/paint/walks.js`, with the same toolkit and style as the
backgrounds but two to five screens wide. Each is saved as layers: the sky (one screen, it never
scrolls), drifting clouds, far and middle distance (scrolling slower than Hervé walks), the ground
he walks on, and plants in front that sway. `story/walkscenery.js` says how they stack. The people,
the horse, the water's reflection and the weather are drawn by the game itself (js/walk.js). To
change a place, edit it in `tools/paint/walks.js` and run `node tools/paint-walks.js <area>`; what
is where along the way is in `story/walks.js`.

## Character sprites: `assets/sprites/<character>/<expression>.webp`

The artist's pictures are kept in `art/characters/<character>/<expression>.png` (1000×1000
canvases, every face of a character the same drawing in the same place). `tools/import-sprites.js`
turns them into the game's sprites: cut to the character with one box for all their faces (so
only the face moves when it changes), 850 px tall with the feet 12 px from the bottom, saved as
webp. It also cuts each character's portrait (`assets/faces/<character>.webp`) and writes
`story/expressions.js`: who has which faces, where the face is on the sprite (the text box cuts
the portrait of any expression from it), which faces can blink, and where the eyes are.

    node tools/import-sprites.js            every character (or name one: ... helene)
    node tools/paint-blinks.js              then the eyelids for the neutral faces

To add a face, save it as `art/characters/<character>/<feeling>.png` and run both. The script can
name any feeling: a character without that face shows their nearest one (see docs/SCRIPTING.md).

The woman's new faces are a closer, turned pose cut off at the knees, so the tool lays them,
mirrored, onto her full-length picture (`art/characters/woman/_body.png`), only where the face
changes. Hervé's army uniform is `herve_army/`, worn with `outfit herve army`; it has one face
(his civilian faces did not sit cleanly on the uniform's head), so in uniform he reacts with his
pose instead.

Each character also has `blink.png`: their eyes half closed and closed, painted from their own
skin and lash colours by `tools/paint-blinks.js`, laid over the eyes every few seconds on the faces
whose eyes sit where the neutral face has them. The eye positions are in
`tools/paint/data/eyes.json` (on the artist's canvas).

Hervé is the player, so he rarely stands in a scene, like the protagonist in DDLC. His faces are
used for his portrait in the text box, which follows his feelings line by line.

| Character | Folder | Faces |
| --- | --- | --- |
| Hervé | `herve/` | `neutral` (brooding), `happy`, `sad`, `surprised`, `uneasy`, `angry` |
| Hervé in uniform | `herve_army/` | `neutral` |
| Hélène | `helene/` | `neutral` (smiling), `sad`, `upset`, `surprised` |
| Baldabiou | `balbadiou/` | `neutral` (his grin), `serious`, `worried`, `uneasy`, `surprised`, `angry` |
| Hara Kei | `harakei/` | `neutral`, `speaking`, `amused`, `stern`, `angry`, `furious` |
| The woman | `woman/` | `neutral`, `smile`, `sad`, `worried`, `surprised`, `cold` |
| Madame Blanche | `blanche/` | `neutral`, `soft`, `smile`, `grave`, `surprised` |

## Event pictures (CGs)

The three key moments are painted close-ups (see above). A picture saved as `assets/cg/<name>.png`
is used only for a CG that has no painted version.

| File | Moment |
| --- | --- |
| `the_cup` | Chapter 3: the teacup set down in front of Hervé |
| `the_glove` | Chapter 6: the glove among her belongings |
| `the_letter` | Chapter 14 and Final Chapter: the seven pages of black ink |

## Keepsake icons: `assets/ui/items/<id>.png`

32×32 pixel-art icons for the Keepsakes page and the cards that slide in when Hervé gains or parts
with something, painted by `tools/paint-items.js`: `francs`, `watch`, `handkerchief`, `journal`,
`egg_box`, `blossom`, `pass`, `note`, `letter`, `helene_letter`, and the three found on walks:
`feather`, `hairpin` and `flowers`. A new keepsake needs an `item` line at the top of
the story script and, ideally, an icon here (until then it shows a small knot).

## Word-game chibis: `assets/chibi/<character>.png`

Small transparent PNGs (about 110 px wide) for Hervé's Journal: `helene`, `woman`, `balbadiou`.

## Music, ambience and sounds

All of them are composed in code (js/synth.js) except the title music, `assets/music/title.mp3`.
To use a recording instead, save it under the same name and it takes over: music and ambience in
`assets/music/<name>.mp3`, sounds in `assets/sfx/<name>.mp3` (`.ogg` and `.m4a` work too).

| Music | Mood / where |
| --- | --- |
| `title` | Title screen (a recording). Plays on the menu only and stops when a game starts |
| `town_theme` | The town, the mill, Baldabiou: a waltz for guitar and music box |
| `helene_theme` | Scenes with Hélène: piano over strings |
| `journey` | The long journeys: a steady pulse, a flute looking ahead |
| `japan` | Japan: koto and bamboo flute over a drone, a far temple bell |
| `her_theme` | The woman, the cup, the note, the letter: high and weightless |
| `war` | Chapter 10: drums, war horns and a crying flute |
| `sorrow` | The empty mill, the grey ending |
| `letter` | Final Chapter: the truth, from minor into major |
| `home` | The endings: music box and piano |
| `departure` | Chapter 1: setting out, pizzicato strings and a flute |
| `reverie` | Chapter 7: a harp, a celesta and a far choir |
| `storm` | Chapter 9: the third journey through the rain |
| `tension` | Chapter 9 and 11: Japan in turmoil, soldiers close by |
| `battle` | Chapter 10: the war, with brass, choir, strings and drums |
| `pursuit` | Chapter 11: hiding from the soldiers' lanterns |
| `lament` | Chapter 11 and the far-shore ending: a bowed voice like an erhu |
| `farewell` | Chapter 15: the sickroom, swelling slowly |
| `revelation` | Final Chapter: the truth arriving |

Each place's ambience is set by the `bgsound` lines at the top of the story script; the full list
of ambiences and sounds is in docs/SCRIPTING.md.
