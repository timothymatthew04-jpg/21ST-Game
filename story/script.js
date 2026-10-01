/*
 * ============================================================================
 *  SILK — story script
 *  A choice-simulation adaptation of Alessandro Baricco's novel.
 * ============================================================================
 *
 *  This file is the whole story. The engine reads it when the page loads.
 *  The language is explained in docs/SCRIPTING.md; the short version:
 *
 *    label name                 a place the story can jump to
 *    scene bg_name with fade    change the background
 *    show helene soft           show a character (with an expression)
 *    helene "Text."             a character speaks
 *    "Text."                    narration (Hervé's inner voice)
 *    menu                       a choice; each option starts with -
 *      - "Option" [trust += 1]
 *    set x += 1                 change a variable
 *    if x >= 3 ... endif        branch on a variable
 *
 *  Keep everything between the two backticks below, and don't type a
 *  backtick or a dollar sign followed by { inside the story.
 */
window.STORY_SCRIPT = String.raw`

title "SILK" "A Choice Simulation"
emblem "絹"
titlebackground title_cover
titlefx ginkgo sun=0.3,-0.25 sway=0.28,0.22,0.34,0.3 pivot=0.4,0.85
titlelogo brush
# The press-start screen: a glowing thread of silk that branches into light when clicked.
splash strand
# Every choice waits this many seconds; if the player takes longer, Hervé hesitates
# (a menu's "- hesitate" option says what happens then). "menu time 8" changes one menu.
choicetime 14
# The story's edition: saves made with another edition are cleared when the game opens.
edition 2
# Where Hervé's heart is heading, worked out at every chapter: toward Hélène ("devoted"),
# pulled east ("lost"), or in between ("torn"). The chapter card and the text box take on
# that mood, and scenes can ask:  if route() == "lost"
routescore helene_trust * 2 - obsession * 0.6 - danger * 0.4
routes -4 3
# The backgrounds are detailed pixel art at high resolution, so everything is scaled smoothly.
artstyle smooth
credits "Adapted from Silk by Alessandro Baricco"
titlemusic title
warning "SILK is a branching story adapted from Alessandro Baricco's novel.\n\nYour choices shape Hervé's life: whom he loves, how far he travels, and how his story ends. There are six endings, and some of them come sooner than you think.\n\nChoices wait only so long. If you take too long, Hervé hesitates, and silence is a choice too."

# ---------------------------------------------------------------- characters
# Hervé is the player. His spoken lines use "herve"; his inner thoughts use "inner".
character herve     "Hervé"          color=#e9c46a voice=112 pace=125 muffle=1500
character inner     ""               color=#cbbef0 italic face=none
character helene    "Hélène"         color=#f4a7b9 voice=215 pace=120 muffle=1700 breath=0.2 volume=0.9
character balbadiou "Baldabiou"      color=#9ccf9f voice=98 pace=100 muffle=1700 volume=1.15
character harakei   "Hara Kei"       color=#e0503c voice=86 pace=165 muffle=1300 volume=1.05
character woman     "[woman_name]"   color=#f6ecdb voice=240 pace=150 muffle=1400 breath=0.45 volume=0.8
character blanche   "Madame Blanche" color=#b7c4ff voice=185 pace=135 muffle=1600 breath=0.15 volume=0.95
# Hélène's own thoughts, in the chapters seen through her eyes
character hinner    "Hélène"         color=#f4a7b9 italic face=helene
# The woman in Japan is "???" until her name is revealed (set woman_name, then "reveal woman").

# Characters murmur while they talk, a muffled voice with no words: voice= is the pitch in Hz,
# pace= the milliseconds between syllables, muffle= how clear it is (lower is more muffled),
# breath= how breathy (0-1) and volume= how loud next to the others (1 is normal).

# The first time we meet each character, "introduce <id>" presents them with these words.
intro herve     "A young soldier from Lavilledieu. This is his story, and every choice in it is yours." kanji 旅 sound chime
intro balbadiou "Silk merchant of Lavilledieu. He built the town's trade with his own two hands, and he never takes no for an answer." kanji 商 sound bell
intro helene    "The woman waiting for Hervé in Lavilledieu. Her voice is the thing people remember about her." kanji 妻 sound chime
intro harakei   "Master of a village in the hills. Nothing moves on his roads without his knowing." kanji 主 sound gong
intro woman     "The young woman at Hara Kei's side. No one ever says her name." kanji 謎 sound temple_bell
intro blanche   "The one person in France who can read Japanese, and who keeps what she reads to herself." kanji 文 sound bell

# Each character's pictures are assets/sprites/<id>/<expression>.webp, one per face (see
# story/expressions.js for who has which), made by tools/import-sprites.js from the art in
# art/characters/. A line like  helene sad "..."  or  show helene surprised  changes the face,
# and it stays until it changes again. Any feeling can be named: someone with no face for it
# shows their nearest one ("tired" is a sad face). The face in the text box appears when they
# speak without standing in the scene (always for Hervé, who is the player), and follows their
# feelings too:  herve angry "..."
# What someone wears:  outfit herve army  (sprites/herve_army/), until  outfit herve.

# ---------------------------------------------------------------- places and living backgrounds
# "place" names where a background is; the name appears at the top of the screen the
# first time the story arrives there. "bgfx" brings a background to life; positions are
# fractions of the picture (see docs/SCRIPTING.md for every effect).
place lavilledieu       "Lavilledieu"            "The south of France · 1861"
place silk_mill         "The Silk Mill"          "Lavilledieu · France"
place silk_mill_empty   "The Silk Mill"          "Lavilledieu · France"
place balbadiou_office  "Baldabiou's Office"     "Lavilledieu · France"
place joncour_home      "The Joncour House"      "Lavilledieu · France"
place helene_garden     "Hélène's Garden"        "Lavilledieu · France"
place garden_winter     "Hélène's Garden"        "Lavilledieu · Winter"
place helene_sickroom   "Hélène's Room"          "Lavilledieu · France"
place cemetery          "The Cemetery"           "Lavilledieu · France"
place road_east         "The Road East"          "Across Europe and Russia"
place road_winter       "The Road East"          "The Russian winter"
place road_rain         "The Road East"          "Across the steppe, in the rain"
place smuggler_boat     "A Smuggler's Boat"      "The eastern sea, at night"
place china_dock        "A Harbour in China"     "The far side of the world"
place japan_coast       "The West Coast"         "Japan"
place japan_path        "The Road into the Hills" "Japan"
place hara_kei_estate   "Hara Kei's Village"     "The hills of Japan"
place estate_day        "Hara Kei's Village"     "The hills of Japan"
place estate_unrest     "Hara Kei's Village"     "Japan, in troubled times"
place estate_tearoom    "Hara Kei's House"       "The hills of Japan"
place estate_room       "Hara Kei's House"       "The hills of Japan"
place aviary            "The Aviary"             "Behind Hara Kei's house"
place burned_village    "The Burned Village"     "The hills of Japan"
place forest_camp_night "Hara Kei's Camp"        "The forest, at night"
place blanche_salon     "Madame Blanche's House" "In the city"
place army_camp         "The Army Camp"          "The south of France · 1861"
place joncour_bedroom   "The Joncour House"      "Lavilledieu · Night"
place cemetery_two      "The Cemetery"           "Lavilledieu · Many years later"
place yuki_house        "A House in the Hills"   "Japan · Years later"

bgfx lavilledieu smoke=0.06,0.34,0.6,#f4f4f8 glints=0.04,0.74,0.3,0.16,26,#ffffff flock=10,0.04,0.3 fish=0.25,0.76,0.7,0.12,0.7 leaves=0.3 motes=0.1,0.3,0.8,0.5,14,#fff6d8
bgfx lavilledieu glow=0.9375,0.481,0.05,#fff4c8 glints=0.694,0.045,0.01,0.04,2,#fffbe8 glints=0.736,0.045,0.01,0.04,2,#fffbe8 glints=0.705,0.25,0.025,0.06,2,#fff4c8
bgfx silk_mill glow=0.36,0.38,0.08,#fff4d0 glow=0.498,0.38,0.08,#fff4d0 glow=0.635,0.38,0.08,#fff4d0 motes=0.15,0.25,0.55,0.7,45
bgfx silk_mill_empty motes=0.15,0.25,0.55,0.7,20,#c8d4e6 rain=0.5,0.308,0.215,0.105,0.34 rain=0.5,0.446,0.215,0.105,0.34 rain=0.5,0.583,0.215,0.105,0.34
bgfx balbadiou_office flame=0.6375,0.648,0.05,#ffc070 glow=0.87,0.35,0.1,#fff0d0 motes=0.5,0.3,0.45,0.6,30
bgfx joncour_home leaves=0.9,0.29,0.155,0.2,0.45 motes=0.3,0.3,0.45,0.6,26,#fff2c8 glow=0.385,0.4,0.16,#fff4d8
bgfx helene_sickroom snow=1,0.3125,0.207,0.1875,0.37 flame=0.45,0.622,0.03,#ffc070 motes=0.3,0.25,0.4,0.7,18,#dde6ff
bgfx blanche_salon flame=0.231,0.415,0.07,#ffb070 flame=0.094,0.414,0.013 flame=0.115,0.41,0.013 flame=0.133,0.406,0.013 steam=0.796,0.83,0.8 steam=0.6875,0.84,0.6 glow=0.9125,0.148,0.03 stars=0.8,0.04,0.12,0.4,8
bgfx helene_garden glow=0.817,0.415,0.09,#ffd08a glow=0.065,0.485,0.03,#ffc070 glow=0.131,0.485,0.03,#ffc070 glow=0.181,0.574,0.03,#ffc070 glints=0.49,0.67,0.33,0.12 fireflies=0.05,0.45,0.9,0.4,14 petals=0.35 birds=3,0.05,0.25
bgfx garden_winter snow=1.1 smoke=0.196,0.278,0.6,#d8dce8 glow=0.065,0.485,0.03,#ffc070 glow=0.131,0.485,0.03,#ffc070 glow=0.065,0.574,0.03,#ffc070 glow=0.181,0.574,0.03,#ffc070
bgfx cemetery glow=0.275,0.607,0.09,#ffc07a flame=0.817,0.422,0.02 flame=0.5375,0.863,0.025 birds=3,0.08,0.3 motes=0.1,0.5,0.8,0.4,30,#ffe0a0 fireflies=0.05,0.62,0.9,0.3,10 foliage=0.4
bgfx cemetery_grey rain=0.8 mist=0.55,0.2,0.3,#c8ccd8
bgfx cemetery_night glow=0.75,0.185,0.05,#cfe0ff flame=0.817,0.422,0.02 flame=0.5375,0.863,0.03 stars=0,0,1,0.45,24 fireflies=0.05,0.6,0.9,0.3,12 mist=0.6,0.15,0.2,#a8b8e8
bgfx road_east glow=0.6625,0.544,0.07,#ffd08a rays=0.6625,0.54,0.8,0.8,#ffd49a birds=5,0.08,0.4 motes=0.4,0.45,0.5,0.3,30,#ffe0a0
bgfx road_winter snow=1.2 glow=0.625,0.407,0.05,#fff6e8 mist=0.5,0.12,0.3,#ffffff
bgfx road_rain rain=1.3 mist=0.52,0.14,0.3,#9aa4b8
bgfx smuggler_boat aurora=0.02,0.42,1 aurora=0.527,0.2,0.8,1 glow=0.1375,0.133,0.035,#cfe0ff glints=0.15,0.54,0.7,0.2,34,#b8ffd8 stars=0,0,1,0.45,30 mist=0.5,0.1,0.2,#8ad8c0
bgfx china_dock glow=0.3125,0.526,0.09,#ffc080 flame=0.252,0.593,0.03,#ff7050 flame=0.877,0.593,0.03,#ff7050 glints=0,0.56,1,0.25,26 birds=3,0.08,0.3
bgfx japan_coast glow=0.133,0.141,0.03,#cfe0ff glow=0.85,0.55,0.25,#ffb080 glints=0.3,0.56,0.7,0.2,26 flame=0.373,0.633,0.02 birds=4,0.1,0.35 mist=0.42,0.12,0.3,#ffd0d0 stars=0,0,1,0.25,14
bgfx japan_path rays=0.5,0.37,1.2,0.6,#fff0b0 motes=0.3,0.2,0.4,0.6,40,#fff0c0 fireflies=0,0.65,0.35,0.3,8 fireflies=0.65,0.65,0.35,0.3,8 foliage=0.6 glow=0.5125,0.14,0.07,#e8f0ff flame=0.25,0.687,0.02,#ffd28a flame=0.754,0.687,0.02,#ffd28a flame=0.329,0.678,0.012,#ffd28a
bgfx hara_kei_estate glow=0.875,0.111,0.06,#ffd0c0 flame=0.2875,0.696,0.03 flame=0.429,0.673,0.025 flame=0.5875,0.696,0.03 flame=0.767,0.696,0.03 flame=0.9375,0.781,0.045 glow=0.74,0.66,0.06,#ffcf7a
bgfx hara_kei_estate mist=0.6,0.2,0.5,#c08890 mist=0.8,0.12,0.35,#b07a84 glints=0.1,0.8,0.8,0.18,22 petals=1 stars=0.05,0.02,0.9,0.3,14 fireflies=0.05,0.6,0.9,0.2,8
bgfx estate_day glints=0.1,0.8,0.8,0.18,22 petals=1 birds=3,0.05,0.3 motes=0.2,0.4,0.6,0.4,20,#fff6d8
bgfx estate_unrest flame=0.2875,0.696,0.03 flame=0.429,0.673,0.025 flame=0.5875,0.696,0.03 flame=0.767,0.696,0.03 flame=0.9375,0.781,0.045 smoke=0.125,0.548,1.2,#2e2020 smoke=0.79,0.548,1.3,#2e2020 smoke=0.917,0.548,1,#2e2020 ash=0.6 petals=0.3
bgfx estate_tearoom petals=1.2 glow=0.733,0.111,0.05,#ffd0c0 steam=0.4917,0.785,0.9 steam=0.65,0.711,0.8 glints=0.31,0.66,0.38,0.05,10 flame=0.748,0.459,0.02,#ffd28a
bgfx estate_room glow=0.408,0.193,0.03,#ffd0c0 glints=0.17,0.56,0.12,0.13,10 fireflies=0.27,0.15,0.15,0.5,8 fireflies=0.696,0.16,0.2,0.5,10 motes=0.25,0.74,0.46,0.13,20
bgfx aviary flutter=0.365,0.25,0.33,0.38,18 leaves=0.8 rays=0.19,0.15,0.8,0.8,#fff2c4 motes=0.3,0.3,0.4,0.5,25,#fff0c8
bgfx burned_village smoke=0.167,0.65,1.3,#2e2020 smoke=0.7,0.64,1,#2e2020 smoke=0.906,0.67,1.2,#2e2020 smoke=0.41,0.62,0.7,#3a2a28 embers=0.167,0.7,1 embers=0.906,0.726,1 embers=0.406,0.63,0.6 ash=1 flame=0.167,0.71,0.08,#ff7a30 flame=0.7,0.69,0.07,#ff7a30 flame=0.906,0.75,0.08,#ff7a30
bgfx army_camp flame=0.4625,0.87,0.06,#ff9a40 embers=0.4625,0.86,0.8 smoke=0.4625,0.84,0.9,#9a8a8a birds=4,0.06,0.3 motes=0.1,0.5,0.8,0.4,24,#fff0c8
bgfx joncour_bedroom flame=0.842,0.695,0.018,#ffc070 glow=0.545,0.285,0.04,#cfe0ff motes=0.42,0.55,0.3,0.35,18,#dde6ff fireflies=0.4,0.25,0.2,0.2,4
bgfx cemetery_two glow=0.275,0.607,0.09,#ffc07a flame=0.817,0.422,0.02 flame=0.502,0.863,0.025 birds=3,0.08,0.3 motes=0.1,0.5,0.8,0.4,30,#ffe0a0 fireflies=0.05,0.62,0.9,0.3,10 petals=0.5 foliage=0.4
bgfx yuki_house rain=1.1,0.208,0.14,0.583,0.585 mist=0.62,0.15,0.3,#b8c4c8 glow=0.144,0.748,0.05,#ffd08a
# the painted close-ups shown with "cg"
bgfx the_cup steam=0.52,0.54,0.9 glow=0.19,0.385,0.06,#ffc070 petals=0.3,0.62,0.07,0.25,0.25
bgfx the_glove motes=0.1,0,0.7,0.8,22,#fff0c8 rays=0.3,0,1.2,0.5,#fff0c0
bgfx the_letter flame=0.896,0.29,0.03,#ffc070 motes=0.6,0.1,0.3,0.5,14,#ffe0a0
# the scenes come alive: grass in the wind, people about their day, rings on the water,
# the shadows of clouds, and storms that flash
bgfx lavilledieu ripples=0.3,0.76,0.6,0.12,0.9,#e8f4ff walkers=0.665,0.34,0.98,5,0,1,0.015 grass=0.9,0.08,0.8,0,0,0,#d8c070 shade=0.62,0.3,3,0.08
bgfx army_camp army=0.735,1,6,16,2,1,-0.1,1.1,0 grass=0.92,0.08,0.8,0,0.62,0.8,#9aa858 shade=0.6,0.4,2,0.08
# the sky of the Second Empire over the camp: steam airships crossing, balloons on their tethers, smoke from the headquarters
bgfx army_camp airship=0.13,-1,4,0.9,0.7 airship=0.06,1,2.5,0.5,0.2 balloon=0.62,0.27,0.7,0.6,0 balloon=0.9,0.2,0.5,0.6,1 smoke=0.135,0.49,0.5,#e8dce4 smoke=0.365,0.49,0.5,#e8dce4
bgfx helene_garden ripples=0.53,0.65,0.22,0.07,0.8,#f8e0f8 flutter=0.03,0.72,0.3,0.18,4 grass=0.92,0.08,0.7,0,0.25,0.62,#9ac070
bgfx cemetery grass=0.88,0.12,0.9,0.1,0.42,0.6,#c8c078
bgfx cemetery_two grass=0.88,0.12,0.9,0.1,0.42,0.6,#c8c078
bgfx cemetery_night grass=0.88,0.12,0.9,0.05,0.42,0.6,#5a6a8a
bgfx cemetery_grey splashes=0.72,0.28,24
bgfx road_east grass=0.84,0.16,1,0.15,0.36,0.78,#d0b878 shade=0.62,0.38,2,0.08
bgfx road_rain splashes=0.7,0.3,34 lightning=0.08,0.42
bgfx china_dock ripples=0,0.6,1,0.2,0.7,#ffc8a0 walkers=0.86,0.05,0.95,5,2,1,0.04
bgfx japan_coast ripples=0.48,0.76,0.48,0.2,0.6,#f0d0e0 walkers=0.71,0.52,0.95,3,1,1,0.02
bgfx japan_path grass=0.9,0.1,0.8,0,0.34,0.66,#78a848
bgfx hara_kei_estate ripples=0.1,0.83,0.82,0.14,0.7,#e8b0a0
bgfx estate_day ripples=0.12,0.83,0.76,0.14,0.9,#e8f4ff walkers=0.79,0.26,0.74,2,1,1,0.02
bgfx smuggler_boat ripples=0,0.52,1,0.25,0.6,#c8d8ff
bgfx op_mountain grass=0.86,0.1,0.8,0.2,#f0dca0 birds=4,0.3,0.45
bgfx op_autumn mist=0.62,0.2,0.3,#eeeeea
bgfx op_sakura birds=3,0.1,0.3
bgfx op_gold grass=0.9,0.08,0.6,0.5,#fff4d8
bgfx forest_camp_night flame=0.429,0.82,0.12,#ff9a40 embers=0.429,0.8,1 smoke=0.429,0.78,0.8,#6a7288 fireflies=0,0.55,1,0.3,14 mist=0.7,0.2,0.3,#b8c8ff rays=0.6,0,0.9,0.45,#b8d0ff flame=0.219,0.79,0.05,#ffb860 glow=0.625,0.096,0.03,#cfe0ff

# Each place has its own sound, which starts when the story arrives there and fades
# when it leaves: "bgsound background ambience [volume]". A recording in
# assets/music/<ambience>.mp3 is used if there is one; otherwise it is synthesized.
bgsound lavilledieu       stream
bgsound silk_mill         mill
bgsound silk_mill_empty   rain 0.6
bgsound balbadiou_office  clock
bgsound joncour_home      birds 0.5
bgsound helene_garden     birds
bgsound garden_winter     wind 0.7
bgsound helene_sickroom   room
bgsound cemetery          birds 0.8
bgsound cemetery_grey     rain
bgsound cemetery_night    crickets
bgsound road_east         wind 0.6
bgsound road_winter       wind
bgsound road_rain         storm
bgsound smuggler_boat     boat
bgsound china_dock        harbour
bgsound japan_coast       waves
bgsound japan_path        forest 0.8
bgsound hara_kei_estate   temple
bgsound estate_day        birds 0.8
bgsound estate_unrest     unrest
bgsound estate_tearoom    temple 0.7
bgsound estate_room       night 0.7
bgsound aviary            aviary
bgsound burned_village    battle_far
bgsound forest_camp_night camp
bgsound blanche_salon     city 0.8
bgsound army_camp         camp
bgsound joncour_bedroom   crickets 0.6
bgsound cemetery_two      birds 0.8
bgsound yuki_house        rain 0.7

# How the light of each place falls on the characters: "bglight background look",
# where look is day, warm, fire, dusk, night, moon, grey, dim or ash.
bglight balbadiou_office  warm
bglight joncour_home      warm
bglight helene_sickroom   dim
bglight blanche_salon     warm
bglight road_east         dusk
bglight road_rain         grey
bglight smuggler_boat     moon
bglight china_dock        dusk
bglight japan_coast       dusk
bglight hara_kei_estate   night
bglight estate_unrest     fire
bglight estate_tearoom    warm
bglight estate_room       moon
bglight burned_village    ash
bglight forest_camp_night fire
bglight silk_mill_empty   grey
bglight cemetery          dusk
bglight cemetery_grey     grey
bglight cemetery_night    moon
bglight garden_winter     grey
bglight army_camp         day
bglight joncour_bedroom   moon
bglight cemetery_two      dusk
bglight yuki_house        dim

# ---------------------------------------------------------------- keepsakes and money
# What Hervé can carry. "gain item watch" gives him one and "lose item watch" takes it
# away; a choice can ask for one: cost=item:watch (given up), needs=item:pass (shown, kept),
# gain=item:blossom. Money is the variable "francs": gain francs 40, cost=francs:40.
item watch        "Father's pocket watch" "Gold and heavy, never a minute wrong. It was his father's."
item handkerchief "Hélène's handkerchief" "White silk. His initials, sewn in the corner by her hand."
item journal      "Hervé's journal"       "Where the journeys are written down, and where they are not."
item egg_box      "The box of eggs"       "Thousands of silkworm eggs on sheets of paper, packed in mulberry leaves."
item blossom      "A pressed blossom"     "A cherry blossom from the hills of Japan, pressed flat for Hélène."
item pass         "Hara Kei's pass"       "A wooden tag with his red seal. His men let its bearer through."
item note         "The note"              "A few lines of Japanese in black ink. He cannot read a single character."
item letter       "The seven sheets"      "A long letter in Japanese, seven sheets of black ink."
item helene_letter "A letter from Hélène" "Folded small, in her handwriting, tucked into his coat. He has not opened it."
item feather      "A white feather"       "From the one bird that sat still in Hara Kei's aviary."
item hairpin      "A lacquered hairpin"   "Red and gold, found in the ashes of the burned village. He has seen it before, in her hair."
item flowers      "Wildflowers"           "Picked by the cemetery wall: poppies, cornflowers, and the small white ones."

# ---------------------------------------------------------------- karma
# Choices are felt, never shown as numbers. When a choice (or a "set" line) moves one
# of these, a short line appears in its colour, the scene glows or darkens and the
# music dips. "heavy" is the direction that costs Hervé something. Threads listed
# first speak first (at most two per choice). The ending reveals every choice.
karma helene_trust color=#f4a7b9 heavy=down up="Hélène will remember that." down="Something in Hélène goes quiet."
karma obsession    color=#e2553f heavy=up   up="Japan pulls at you a little harder." down="The pull of Japan loosens, for now."
karma danger       color=#b02a2a heavy=up   up="Somewhere, Hara Kei takes note." down="You step back from the edge."
karma intimacy     color=#c9a0ff up="Something unspoken passed between you."
karma fascination  color=#f2d492 up="She will stay in your thoughts."
karma business     color=#9ccf9f up="Baldabiou would be pleased."
karma mystery      color=#9fb4ff up="The mystery deepens." down="A little of the mystery fades."

# ---------------------------------------------------------------- journal words
# The DDLC-style word game in Chapter 5. Each word pulls Hervé's heart toward
# Hélène, toward the woman in Japan, or toward the silk business.
poemwords
  garden       helene=3 woman=1
  window       helene=3 woman=1
  voice        helene=3 woman=1
  home         helene=3
  morning      helene=2 balbadiou=1
  laughter     helene=3
  patience     helene=2 woman=1
  linen        helene=2 balbadiou=1
  letters      helene=2 woman=2
  waiting      helene=3 woman=1
  eyes         woman=3 helene=1
  silence      woman=3 helene=1
  water        woman=3
  cup          woman=3
  white        woman=2 helene=1
  lantern      woman=3
  mist         woman=3
  ink          woman=2 balbadiou=1
  snow         woman=2 helene=1
  secret       woman=3
  ledger       balbadiou=3
  eggs         balbadiou=3 woman=1
  contract     balbadiou=3
  harvest      balbadiou=2 helene=1
  mulberry     balbadiou=2 helene=1
  cargo        balbadiou=3
  price        balbadiou=3
  route        balbadiou=2 woman=1
  profit       balbadiou=3
  mill         balbadiou=3
endpoemwords


# ============================================================================
label start
  set helene_trust = 0
  set business = 0
  set obsession = 0
  set fascination = 0
  set intimacy = 0
  set danger = 0
  set mystery = 0
  set francs = 0
  set woman_name = "???"
  # found_hairpin is set by the walk through the burned village (story/walks.js)
  set found_hairpin = false
  set wounded = 0
  set truth_seen = ""
  # the Road East (story/journeys.js)
  set days = 0
  set fever = 0
  set eggs_care = 0
  set road = ""
  set chase_how = ""
  set patience = ""
  scene black with none
  # the opening plays on its own, straight into the story (click to hurry it, Esc to skip)
  play music japan fadein 3
  cutscene opening


# ============================================================================
#  CHAPTER 1 — THE CHOICE
# ============================================================================
label chapter1
  chapter "Chapter 1" "The Choice" seal 選
  scene army_camp with fade
  # in the army, Hervé wears the uniform (until he goes home)
  outfit herve army
  play music camp fadein 3 volume 0.8
  play sound horn volume 0.4
  cutscene camp
  introduce herve
  "I was a soldier then. Young enough to believe that following orders was the same thing as having a life."
  "Every morning, the same drum. The same drill. The same road out of camp — the road that led, if you followed it far enough, back to Lavilledieu. Back to Hélène."
  "That morning, the sentries said a rider was asking for me."
  walk camp
  scene army_camp with fade
  "The morning Baldabiou came, I had never fired my rifle at anyone."
  play sound gallop volume 0.5
  show balbadiou neutral
  introduce balbadiou
  "He had ridden two days to find me, and he did not waste a word of the journey on small talk."
  balbadiou neutral "You've spent enough time following orders, Hervé. I have another kind of work for you."
  herve surprised "What kind of work?"
  balbadiou serious "Silk. Japan. Eggs. A journey most men would never dare to make."
  "Then he told me why."
  cutscene prologue
  show balbadiou worried
  "The silkworms were dying. First in one village, then in the next — all over Europe. The eggs turned grey before they could hatch."
  "Our whole town lived on silk. If the worms died, so would Lavilledieu — only more slowly."
  balbadiou serious "Japan is the one place the sickness hasn't reached. Somebody has to go to the end of the world and bring the eggs back."
  show balbadiou uneasy
  "I looked toward the road leading back to my home."
  balbadiou neutral "You can stay in the army. Or you can come work for me."
  menu time 20
    - "Stay in the army." tone=duty
        set ch1_choice = "army"
        jump quiet_life
    - "Join Baldabiou." tone=curious [business += 1]
        herve happy "When do we leave?"
        balbadiou happy "You don't. Not yet. First, go home."
        herve surprised "To Hélène?"
        balbadiou happy "To the woman you're going to marry."
        set ch1_choice = "join"
        jump wedding
    - hesitate [business += 1]
        show balbadiou uneasy
        "I said nothing. I looked at the road for so long that Baldabiou started to laugh."
        balbadiou happy "A man who wanted to stay would have said so by now. Pack your things, soldier."
        balbadiou neutral "Not for Japan. Not yet. First, go home — to the woman you're going to marry."
        set ch1_choice = "join"
        jump wedding


# ---- ENDING: A QUIET LIFE ----------------------------------------------------
label quiet_life
  herve "I think I'll stay, Baldabiou. I know this life."
  balbadiou surprised "..."
  balbadiou neutral "Then I'll find another man for Japan. I hope he's half as lucky as you're going to be."
  hide balbadiou
  "I chose the familiar life. When my years of service were done, I walked that road all the way home."
  # out of the uniform at last
  outfit herve
  scene joncour_home with fade
  play music helene_theme fadein 2
  show helene surprised
  introduce helene
  helene surprised "You're home."
  show helene neutral
  herve happy "I promised I would come back."
  helene smile "I know. I was only waiting."
  cutscene wedding
  "We married that spring and began building our life together, one ordinary day at a time."
  "I studied at night and worked by day. It took years, but I became a designer: of houses, and of the rooms other people would live their lives inside."
  scene helene_garden with fade
  "Years later, we bought our first house, with a strip of wild land behind it."
  show helene sad
  helene sad "It still doesn't feel like ours."
  herve neutral "Give it time."
  helene neutral "And the garden?"
  herve happy "I'll design it myself."
  menu
    - "Plant a cherry tree by the window." tone=tender [helene_trust += 1]
        show helene surprised
        "I planted a cherry tree where she could see it from the window. Every spring it flowered for exactly one week, and every spring she said it was the best week of the year."
        show helene happy
        set garden = "cherry"
    - "Dig a pond, with a bench beside it." tone=warm [helene_trust += 1]
        "I dug a pond and set a bench beside it. By the second summer there were frogs, and she named every one of them."
        show helene happy
        set garden = "pond"
    - "Plant a row of mulberry trees." tone=duty [business += 1]
        helene surprised "Mulberries? For silkworms?"
        herve neutral "For shade. And in case the town ever needs them."
        show helene happy
        "The town never did. The children climbed them instead."
        set garden = "mulberry"
    - hesitate
        show helene upset
        "I couldn't decide, so she decided for me: roses, everywhere, far too many roses."
        show helene happy
        set garden = "roses"
  hide helene
  "We had two children. The house filled up with memories, laughter, muddy boots, and the garden I had designed."
  "I never went to Japan. Some other man carried the eggs across the world, and I never learned his name."
  "Many years later, Hélène and I died of old age, a winter apart, and were buried beside each other."
  cutscene end_quiet_life
  ending quiet_life "Hidamari — A Quiet Life" good kanji 陽 music home hint "What if he never left the army?"


# ---- THE WEDDING ----------------------------------------------------------
label wedding
  hide balbadiou
  # home, out of the uniform
  outfit herve
  scene lavilledieu with fade
  play music village fadein 3
  "So I went home. Not to Japan — home, to Lavilledieu, with my discharge papers in one pocket of my coat and Baldabiou's purse in the other."
  gain francs 200
  "Money for the road, he had said. For the smugglers, and for whatever else the road would ask. Every franc that comes back is the town's."
  # the walk home through the town, to Hélène in the garden (story/walks.js)
  walk lavilledieu
  scene joncour_home with fade
  play music helene_theme fadein 2
  show helene surprised
  introduce helene
  helene smile "You're home early. Did the army finally throw you out?"
  herve happy "I left. Baldabiou has work for me."
  helene sad "Baldabiou always has work for someone."
  camera close helene
  herve uneasy "It means I don't have to wait five years to marry you."
  show helene surprised
  menu
    - "Ask her properly, on one knee." tone=tender [helene_trust += 1]
        show helene happy
        "I went down on one knee on her mother's kitchen floor. She laughed so hard she had to sit down, and then she said yes, and then she cried."
        show helene upset
        set proposal = "knee"
    - "Ask her plainly: “Marry me.”" tone=warm
        herve neutral "Marry me."
        helene upset "That's not a question, Hervé."
        herve uneasy "Will you marry me?"
        helene smile "That's better. Yes."
        set proposal = "plain"
    - hesitate [helene_trust -= 1]
        "I had the words ready, and they would not come out."
        helene soft "Are you trying to ask me something?"
        show helene happy
        "In the end, she asked me. I said yes before she had finished the question."
        set proposal = "her"
  camera wide
  cutscene wedding
  "We were married in the spring, in the little church at Lavilledieu. The whole town came. Baldabiou cried more than anyone."
  "One week later, I had to leave for Japan."
  jump chapter2


# ============================================================================
#  CHAPTER 2 — THE FIRST JOURNEY
# ============================================================================
label chapter2
  chapter "Chapter 2" "The First Journey" seal 旅
  scene joncour_home with fade
  tint dawn
  play music helene_theme fadein 2
  "Morning. The house still smelled of wedding flowers."
  "Hélène and I sat together at breakfast."
  show helene neutral
  helene "You're quiet."
  herve sad "I have to leave this afternoon."
  show helene surprised
  "She stopped eating."
  helene surprised "Leave?"
  herve uneasy "Japan. Baldabiou needs me to bring back silk eggs."
  helene hurt "You've only been home a week."
  herve sad "I know."
  menu
    - "I'll be back before you know it." tone=warm [helene_trust += 1]
        herve happy "I'll be back before you know it."
        show helene happy
        "She gave me a small smile."
        helene soft "You always say that."
        herve happy "And I always come back."
        show helene sad
        "She looked down at her breakfast."
        helene sad "That’s not what I meant."
        set ch2_choice = "promise"
    - "It's necessary for the business." tone=duty [business += 1, helene_trust -= 1]
        herve neutral "It's necessary for the business."
        helene upset "Everything is always about the silk."
        herve uneasy "It’s how we live."
        helene sad "I know."
        "She became quiet."
        set ch2_choice = "business"
    - "Do you want me to stay?" tone=tender [helene_trust += 1]
        "I studied her face."
        herve sad "Do you want me to stay?"
        show helene surprised
        "She looked at me."
        helene sad "No."
        herve surprised "No?"
        helene soft "I want you to want to stay."
        "I had no answer."
        set ch2_choice = "stay"
    - hesitate [helene_trust -= 1]
        "I opened my mouth, and nothing came out. Japan, the eggs, the town: none of it sounded like an answer."
        helene upset "{speed=0.6}You don't know either, do you.{/speed}"
        show helene sad
        "She went back to her breakfast. She didn't eat any of it."
        set ch2_choice = "silent"
  "That afternoon, I wound my father's watch, the way he had before every march. It had crossed half of Europe in his pocket. Now it would cross the rest in mine."
  gain item watch
  if ch2_choice == "stay"
    show helene sad
    "Hélène walked with me to the end of the road. She didn't say anything. She held my hand until the last house, and then she let go of it very carefully, the way you set down something that might break."
    "In my palm she had left a handkerchief. White silk. She had sewn my initials in the corner."
    helene soft "So you have something of home to hold."
  elif ch2_choice == "business"
    "Hélène didn't come down to see me off. I saw her shape at the upstairs window, and then I didn't."
    "In my coat I found a handkerchief I had not packed: white silk, my initials sewn in the corner. She had come down in the night after all."
  elif ch2_choice == "silent"
    "Hélène was in the garden when I left, and did not turn around. On my bag she had left a handkerchief, white silk, my initials sewn in the corner. No note."
  else
    show helene sad
    helene "Write to me."
    herve happy "I will."
    show helene neutral
    "We both knew there would be nowhere to post a letter from where I was going."
    "She tucked a handkerchief into my breast pocket, white silk with my initials sewn in the corner, and patted it flat, the way you close a book."
  endif
  hide helene
  gain item handkerchief
  tint none
  play music departure fadein 3
  journey first
  if persistent.any_ending
    call helene_window
  endif
  scene road_east with slow
  split joncour_home road_east helene herve "Lavilledieu" "The road east"
  "I crossed France by train, then the Alps. Austria. Hungary. Then Russia, where the roads stopped being roads."
  split off
  "I bought a horse at the edge of the steppe, and rode east."
  walk steppe
  "Weeks of steppe. Lake Baikal, which the people there call the sea. Rivers I crossed on rafts, and villages that had never seen a Frenchman and saw no reason to start."
  scene smuggler_boat with dissolve
  play music aurora fadein 3
  "At the edge of the continent, a man who asked no questions and wanted a great deal of money put me on a smuggler's boat."
  "On the last night he came to me with his hand out. The price, it seemed, had gone up."
  menu
    - "Pay him what he asks." tone=duty cost=francs:80
        "I counted the notes into his palm. He counted them again, and grinned."
        set smuggler = "paid"
    - "Give him your father's watch instead." tone=quiet cost=item:watch
        "He held the watch to the lantern, turned it over, and put it in his pocket without a word."
        inner "My father had carried it through a war. It went into the dark in a smuggler's coat."
        set smuggler = "watch"
    - "Remind him who is waiting for this cargo." tone=danger [danger += 2]
        herve angry "We agreed a price. We keep to it, or you can explain to Hara Kei why his buyer never arrived."
        "He looked at me for a long time. Then he laughed, and let it go. I did not sleep that night."
        set smuggler = "threat"
    - hesitate [danger += 1]
        "I said nothing. He took my silence for a yes, and helped himself to my purse."
        lose francs 50
        set smuggler = "robbed"
  "It sailed at night, with no lights, toward a country that did not want me."
  jump chapter3


# ============================================================================
#  CHAPTER 3 — JAPAN
# ============================================================================
label chapter3
  chapter "Chapter 3" "Japan" seal 日本
  scene japan_coast with fade
  play music japan fadein 3
  cutscene arrival
  "I came ashore on the west coast, the unofficial way, where foreigners were not supposed to come ashore at all."
  if fever >= 1
    inner "I came ashore thinner than I had set out, with a cough the steppe had given me and the sea had kept."
  endif
  scene japan_path with dissolve
  "Men I never saw clearly led me inland for days, blindfolded for part of the way. Nobody explained anything. I learned very quickly not to ask."
  "On the last night they took the blindfold off at the edge of a village, and left me to walk the rest of the way."
  walk village
  scene hara_kei_estate with fade
  play sound temple_bell volume 0.6
  "At last I was brought to a village in the hills, and before the man who controlled everything there: Hara Kei."
  show harakei neutral at center
  introduce harakei
  "He sat perfectly still. He was younger than I had imagined, and he looked at me as if I were a piece of weather he was waiting to pass."
  harakei speaking "You came for the eggs."
  herve uneasy "Yes."
  if smuggler == "threat"
    harakei stern "The boatman says you threatened him with my name."
    "He let the words sit there. I understood that everything that happened on his roads came back to him."
  endif
  show harakei neutral at left
  show woman neutral at right
  "Among the people around Hara Kei, I noticed a young woman. Her eyes were not Asian — that was the first strange thing. The second was that she did not lower them."
  eyes woman heartbeat
  camera close woman
  "She watched me without saying anything."
  introduce woman
  inner "She was not beautiful in the way people usually mean beautiful. She simply looked at me."
  menu
    - "Look away." tone=quiet [danger -= 1]
        "I lowered my eyes."
        show harakei amused
        "Hara Kei noticed."
        harakei amused "You are a respectful man."
        show harakei neutral
        "I said nothing."
        show woman surprised
        "The woman continued watching me."
        show woman neutral
        inner "I wondered why she continued looking at me when I had already looked away."
        set ch3_choice = "away"
    - "Continue looking at her." tone=obsession [fascination += 2]
        "I continued looking."
        show woman worried
        "Neither of us looked away."
        show harakei stern
        "Hara Kei noticed the exchange, but said nothing."
        show woman neutral
        inner "I did not know her name. But I remembered her eyes."
        set ch3_choice = "look"
    - "Ask Hara Kei who she is." tone=danger [danger += 2, mystery += 1]
        "I looked toward Hara Kei."
        herve uneasy "Who is she?"
        show woman surprised
        show harakei stern at left
        "Hara Kei slowly turned toward me, the way a door opens in an empty house."
        harakei angry "That is not a question you should ask."
        show harakei stern
        "I understood immediately that I had crossed a boundary."
        show woman neutral
        "The woman continued staring at me."
        set asked_who = true
        set ch3_choice = "ask"
    - hesitate [fascination += 1]
        "I meant to look away. I didn't. I didn't do anything at all."
        show woman sad
        "At last it was she who lowered her eyes, and I understood that she had decided when it would end, not me."
        set ch3_choice = "frozen"
  camera wide
  jump chapter4


# ============================================================================
#  CHAPTER 4 — THE CUP
# ============================================================================
label chapter4
  chapter "Chapter 4" "The Cup" seal 杯
  scene estate_tearoom with dissolve
  play music her_theme fadein 4
  show harakei neutral at left
  show woman neutral at right
  "Later, tea was served. The young woman prepared it herself, and I watched her hands."
  play sound pour volume 0.8
  minigame tea into tea_result
  if tea_result == "win"
    show woman smile
    "When the bowl came to me, I did as she had done, in the same order, turning it the same way."
    harakei amused "You watch carefully, Monsieur Joncour."
    show harakei neutral
    show woman neutral
    set danger -= 1
    set fascination += 1
  else
    show woman worried
    "When the bowl came to me, my hands did everything in the wrong order. It knocked against the tray."
    harakei stern "In this house, we are careful with small things."
    show woman neutral
    set danger += 1
  endif
  show harakei speaking
  "Hara Kei was talking, and for a moment no one was looking at anyone."
  "I found myself near her."
  "She lifted a small cup and drank from it."
  cutscene the_cup
  "Then, silently, she offered it to me."
  camera push
  show woman gaze at right
  "I looked at it. Then at her."
  menu time 10
    - "Drink it." tone=obsession [fascination += 2, intimacy += 1]
        cg the_cup with dissolve
        "I picked up the cup and drank."
        "Our eyes met."
        "Neither of us spoke."
        cg hide with dissolve
        show woman smile
        inner "I didn't know what she wanted. But I wanted to understand."
        set ch4_choice = "drink"
    - "Ignore it." tone=cold [mystery += 2]
        "I looked at the cup."
        "Then at her."
        herve uneasy "I don't understand."
        show woman sad at right
        "She took the cup back without a word."
        show woman cold
        "Her expression remained unreadable."
        inner "Perhaps it was nothing. Perhaps it was everything."
        set ch4_choice = "ignore"
    - "Drink from a different side." tone=tender [fascination += 1, intimacy += 2]
        cg the_cup with dissolve
        "I noticed where she had drunk."
        "I slowly turned the cup, and drank from another side."
        cg hide with dissolve
        show woman smile at right
        "She smiled."
        "It was the first clear expression I had seen from her."
        inner "For the first time, I thought she had understood me."
        set ch4_choice = "turn"
    - hesitate [mystery += 1]
        "I sat there looking at the cup for too long."
        show woman cold at right
        "Her hand came back for it, unhurried. She drank what was left herself, and did not look at me again that evening."
        set ch4_choice = "ignore"
  camera wide
  if ch4_choice != "ignore"
    show harakei stern
    "Hara Kei did not seem to notice. Or he noticed everything, and chose to say nothing. With him, it was the same thing."
  endif
  jump chapter5


# ============================================================================
#  CHAPTER 5 — RETURN TO FRANCE
# ============================================================================
label chapter5
  chapter "Chapter 5" "Return to France" seal 帰
  play music journey fadein 2
  journey home
  scene road_east with fade
  "Hara Kei sold me the eggs: thousands of them, pressed onto sheets of paper and packed in wooden boxes lined with mulberry leaves."
  gain item egg_box
  "I carried them back across the whole world, watching the weather, keeping them cool, counting the days."
  "Somewhere past the Urals I opened the boxes, afraid of what I would find."
  minigame eggs into eggs_result
  if eggs_result == "win"
    "I picked out every egg that had turned grey, one by one, before the sickness could spread."
    set business += 1
  else
    "Some of the grey ones stayed on the cards. I told myself it would not matter."
  endif
  scene joncour_home with fade
  play music helene_theme fadein 2
  show helene surprised
  if helene_trust >= 2
    helene smile "You came back."
    herve happy "I told you I would."
    helene upset "You did."
    show helene happy
  elif helene_trust < 0
    helene sad "You're back."
    "She said it politely, the way you greet a guest."
  else
    helene soft "You're thinner. And you smell of the sea."
  endif
  if has("handkerchief")
    helene surprised "You kept it. The handkerchief. I thought you might lose it at the first border."
    show helene happy
  endif
  hide helene
  "At night, when the house was quiet, my thoughts went back across the world, to a room in the hills and a cup held out to me."
  if fascination >= 2
    inner "Her eyes. I could still see them if I closed mine."
  endif
  "One evening I sat down with my journal to write about the journey."
  gain item journal
  "The words did not go where I meant them to."
  poem words 10 title "Hervé's Journal"
  if poem_winner == "helene"
    set helene_trust += 1
    inner "When I read it back, it was full of home. Full of her."
  elif poem_winner == "woman"
    set fascination += 1
    set obsession += 1
    inner "When I read it back, it was full of Japan. Full of someone whose name I didn't know."
  else
    set business += 1
    inner "When I read it back, it read like a ledger. Safer that way."
  endif
  scene silk_mill with fade
  play music village fadein 2
  lose item egg_box
  if eggs_result == "win"
    "In spring, the eggs hatched. They were healthy. Every one of them."
  else
    "In spring, the eggs hatched. Nearly all of them. Enough."
  endif
  "The town came out into the streets. For a while, everyone in Lavilledieu wanted to shake my hand."
  show balbadiou happy
  "Baldabiou congratulated me."
  balbadiou happy "You did well."
  herve uneasy "Was it enough?"
  balbadiou happy "Enough to make me another offer."
  "I looked at him."
  balbadiou serious "You can stay here and work in the factory. Or you can continue making the journeys."
  if eggs_result == "win"
    balbadiou happy "Either way — here's your share. Not one bad card in the lot. You earned it twice."
    gain francs 80
  else
    balbadiou happy "Either way — here's your share. A few more like this and we'll all be rich."
    gain francs 40
  endif
  if route() == "devoted"
    balbadiou happy "Though I know which one your wife would pick."
  elif route() == "lost"
    balbadiou worried "Though I think you've already picked, haven't you? You've been looking east since you got back."
  endif
  show balbadiou serious
  menu time 20
    - "Stay in France." tone=tender
        set ch5_choice = "stay"
        jump our_house
    - "Continue the journeys." tone=obsession [obsession += 1, business += 1]
        herve neutral "I'll go again."
        balbadiou happy "I thought you might say that."
        set ch5_choice = "continue"
    - hesitate [obsession += 1]
        show balbadiou uneasy
        "I turned the glass in my hand and didn't answer."
        balbadiou happy "I'll take that as a yes. You always did say yes by saying nothing."
        set ch5_choice = "continue"
  "I began to prepare for another journey."
  balbadiou serious "Japan is becoming familiar to you."
  "I paused."
  herve uneasy "Perhaps."
  hide balbadiou
  jump chapter6


# ---- ENDING: A HOUSE OF OUR OWN ---------------------------------------------
label our_house
  herve happy "I think I've travelled enough."
  balbadiou surprised "And Hélène?"
  herve happy "She deserves to have me home."
  balbadiou happy "Then go home to her. I'll find someone else to break his back on the steppe."
  hide balbadiou
  "I returned to Hélène."
  "With my share of the eggs, I bought a house for us: small and yellow, at the edge of town, with a garden that ran down to the river."
  scene helene_garden with fade
  play music home fadein 3
  show helene surprised
  helene surprised "You bought a house?"
  herve happy "Our house."
  helene upset "You really are staying?"
  herve happy "Yes."
  show helene happy
  menu
    - "“I'm staying.”" tone=tender [helene_trust += 1]
        herve happy "I'm staying. Every morning. For the rest of it."
        helene smile "Say that again in ten years, and I'll believe you."
        "Ten years later, I said it again. She believed me."
    - "Show her the garden." tone=warm [helene_trust += 1]
        "I took her hand and walked her down to the river, and showed her where the pond would go, and the cherry trees, and the bench."
        helene surprised "You've thought about this."
        herve happy "The whole way home."
        show helene happy
    - hesitate
        "I didn't say anything. I just stood there beside her, in our own garden, and she leaned her head on my shoulder, and that was the answer."
  hide helene
  "We lived happily together, and in time we had two children."
  "Sometimes, at the bottom of a teacup, I remembered a pair of eyes in a room in the hills. Then Hélène would laugh in the next room, and it was gone."
  "We grew old together, and we were buried beside each other."
  cutscene end_our_house
  ending our_house "Wagaya — A House of Our Own" good kanji 家 music home hint "What if one journey had been enough?"


# ============================================================================
#  CHAPTER 6 — THE SECOND JOURNEY
# ============================================================================
label chapter6
  chapter "Chapter 6" "The Second Journey" seal 再
  play music journey fadein 2
  journey second
  scene road_winter with fade
  "Baldabiou sent me back to Japan for more eggs."
  "The same trains. The same steppe. The same boat without lights."
  "It was easier the second time. That frightened me a little. It meant I was getting used to it."
  if road == "north"
    play music pursuit fadein 1
    walk chase into chase_how
  endif
  if chase_how == "caught"
    if francs >= 60
      lose francs 60
    endif
    "I reached the coast poorer than I had left it, and a good deal more careful."
    set danger += 1
  endif
  scene estate_day with fade
  play music japan fadein 2
  show harakei neutral
  "I saw Hara Kei again."
  harakei speaking "You have returned."
  herve neutral "I have."
  harakei amused "For the eggs?"
  show harakei neutral
  "I looked toward the aviary."
  menu
    - "“For the eggs.”" tone=duty [business += 1]
        herve neutral "For the eggs."
        "Hara Kei studied me."
        harakei speaking "Then you have come for business."
        herve neutral "Yes."
        show harakei amused
        "Hara Kei gave a faint smile."
        harakei amused "Good."
        show harakei neutral
        set ch6_choice = "eggs"
    - "“I wanted to return.”" tone=obsession [obsession += 2, danger += 1]
        "I looked toward the place where I had last seen her."
        herve sad "I wanted to return."
        show harakei stern
        "Hara Kei's expression changed."
        harakei angry "Japan is not a place to return to without reason."
        herve uneasy "Perhaps I have a reason."
        show harakei stern
        "Hara Kei said nothing."
        set ch6_choice = "return"
    - hesitate [obsession += 1]
        "I didn't answer. I didn't know which answer was true."
        harakei stern "A man who does not know why he travels should travel less, Monsieur Joncour."
        show harakei neutral
        set ch6_choice = "silent"
  "Then we came to the price."
  minigame patience into patience
  minigame bargain into price
  if price == "good"
    harakei amused "You bargain like a man who means to come back. Take this."
    "He slid a wooden tag across the mat, marked with his red seal."
    harakei speaking "My men will let you through. Do not lose it."
    show harakei neutral
    gain item pass
    gain francs 50
    set danger -= 1
  elif price == "fair"
    "We agreed on a price that insulted neither of us."
    gain francs 20
  elif price == "insult"
    harakei furious "In my country, a man who haggles like that is telling you something else."
    show harakei stern
    set danger += 2
  else
    show harakei amused
    "I paid too much. Baldabiou would have wept."
    lose francs 40
  endif
  hide harakei
  "The eggs would be ready in a few days."
  "I did not see her those first days. I looked for her in every doorway."
  "On the last evening, the cherry trees along the estate wall came into flower."
  menu
    - "Press a blossom in your journal, for Hélène." tone=tender gain=item:blossom [helene_trust += 1]
        "I chose the most ordinary one I could find, so it would look like home, and pressed it between two pages."
        inner "She would like it. She would ask exactly where it had grown."
    - "Walk the wall, hoping to see her." tone=obsession [obsession += 1, fascination += 1]
        "I walked the length of the wall three times. The petals fell on my shoulders. She did not come."
    - "See to the eggs." tone=duty [business += 1]
        "I spent the evening with the eggs, as I should have. It was easier than the blossoms."
    - hesitate
        "I stood under the trees until the light was gone, and did nothing at all."
  jump chapter7


# ============================================================================
#  CHAPTER 7 — THE GLOVE
# ============================================================================
label chapter7
  chapter "Chapter 7" "The Glove" seal 手袋
  scene aviary with fade
  play music her_theme fadein 3
  "Behind Hara Kei's house there was an aviary: a great cage of wood and paper, taller than a house, full of birds from every corner of Asia."
  "My thoughts returned to her. About how you can keep something beautiful by never letting it leave."
  walk aviary
  scene estate_room with dissolve
  "On the way back, I passed the room where she had been sitting that first day. Her belongings were there — a shawl, a small lacquered box, nobody watching."
  "I removed one of my gloves."
  cutscene the_glove
  cg the_glove with dissolve
  "A glove. A stupid, ordinary thing. A message with no words in it."
  menu time 12
    - "Leave it." tone=obsession [intimacy += 1, obsession += 1]
        cg hide with dissolve
        "I quietly placed the glove among her belongings."
        "I looked back once."
        inner "I did not know what I expected. I only knew I wanted her to know I had been there."
        "I left."
        set glove = "left"
    - "Take it back." tone=quiet [danger -= 1, mystery += 1]
        cg hide with dissolve
        "I reached toward the glove."
        "I hesitated."
        "Then I took it back."
        inner "This was foolish. Whatever I had imagined, it had to end here."
        "I left."
        set glove = "taken"
    - hesitate [intimacy += 1]
        cg hide with dissolve
        "Footsteps in the corridor. I walked away without deciding — and without my glove."
        "That night I understood that I had decided after all."
        set glove = "left"
  jump interlude


# ============================================================================
#  INTERLUDE — THE LETTER
# ============================================================================
label interlude
  chapter "Interlude" "The Letter" seal 便
  play music reverie fadein 3
  scene joncour_home with fade
  "I returned to France with the eggs at the end of the summer."
  if glove == "left"
    "When I arrived home, there was a letter waiting for me on the hall table."
    "No stamp I recognised. And on the envelope, in careful Western letters, as if someone had copied them out of a book, a single word."
    play sound paper
    set woman_name = "Yukimura"
    reveal woman
    "It was from Yukimura."
    "I held it carefully, the way you hold something that might fly away."
    herve surprised "Who are you?"
    "I could not stop myself from wondering whether she had written it."
  else
    "Later, unpacking, I discovered a folded letter inside the pocket of my coat — a pocket I never used."
    "I recognised the handwriting."
    "It was from Hélène."
    gain item helene_letter
    "I stared at it."
    herve surprised "Hélène...?"
    "I did not open it. Not yet. I put it back in the pocket, and buttoned the pocket, as if it might get out."
  endif
  jump chapter8


# ============================================================================
#  CHAPTER 8 — THE NOTE
# ============================================================================
label chapter8
  chapter "Chapter 8" "The Note" seal 文
  if glove == "left"
    "Inside the envelope there was only a note: a few lines of Japanese, in black ink. I couldn't read a single character."
  else
    "Weeks later, sorting the boxes that had come back from Japan, a tiny folded paper fell out from between the pages of my journal. I had not put it there."
    "A few lines of Japanese, in black ink. I couldn't read a single character."
  endif
  play sound paper
  gain item note
  set mystery += 1
  "I was unable to understand it. So I went to the one person in France I knew who could."
  scene blanche_salon with fade
  play music reverie fadein 3
  show blanche neutral
  introduce blanche
  "Madame Blanche kept a fine house in the city and asked very few questions. She took the note and studied it carefully."
  cutscene the_note
  herve uneasy "What does it say?"
  show blanche surprised
  "Madame Blanche looked at me."
  blanche grave "It speaks of desire."
  herve surprised "Desire?"
  blanche soft "Something wanted but forbidden."
  "I became uneasy."
  herve uneasy "Who wrote it?"
  blanche neutral "That is not something the words can tell you."
  "She returned the note."
  blanche grave "Lust is a forbidden fruit. You must remind yourself of your true intentions in Japan."
  herve uneasy "What do you mean?"
  blanche soft "You have a home here in France."
  "I looked at the note."
  blanche smile "That should be enough."
  menu
    - "“It is enough.”" tone=honest [helene_trust += 1, obsession -= 1]
        herve neutral "It is enough."
        blanche smile "Then say it again on the way home, Monsieur. Say it until it's true."
    - "“Then why doesn't it feel like enough?”" tone=obsession [obsession += 2]
        herve angry "Then why doesn't it feel like enough?"
        blanche grave "Because you are a man, Monsieur Joncour, and the thing in your hand is a door."
    - "Fold the note away without a word." tone=quiet [mystery += 1]
        show blanche grave
        "I folded the note very small, and put it in my waistcoat pocket, next to my heart. Madame Blanche watched me do it."
    - hesitate [obsession += 1]
        show blanche soft
        "I didn't answer her. I was reading the note again, as if the characters might rearrange themselves into French."
  set obsession += 2
  hide blanche
  play sound heartbeat
  effect pulse 1.2
  "I left confused."
  "But instead of letting go of the note, I became more eager than ever to return to Japan."
  if woman_name == "Yukimura"
    inner "If it was from Yukimura, then perhaps she was waiting for me."
  else
    inner "If it was from her, then perhaps she was waiting for me."
  endif
  jump chapter9


# ============================================================================
#  CHAPTER 9 — HÉLÈNE
# ============================================================================
label chapter9
  chapter "Chapter 9" "Hélène" seal 夜
  scene helene_garden with fade
  play music helene_theme fadein 2
  cutscene garden
  cutscene seasons
  "I stayed in France for a while."
  "I spent my days with Hélène. We walked in the garden in the evenings, and the trees were a little taller every time. But my thoughts kept drifting toward Japan."
  show helene sad
  helene sad "You're quiet since you came back. Quieter than the first time."
  if days >= 10
    helene upset "I counted the days, you know. Every time. You were gone longer than you said."
    show helene sad
  endif
  clue paper 0.37 0.6 "Rice paper in her sewing basket" "Thin sheets of it, the kind the eggs came wrapped in from Japan. I thought she was cutting patterns."
  if not has("handkerchief")
    helene surprised "The handkerchief I gave you. I haven't seen it since you came back."
    herve uneasy "I must have lost it on the road."
    helene upset "{speed=0.6}On the road.{/speed}"
    show helene sad
    set helene_trust -= 1
  endif
  menu
    - "Give her the blossom you pressed in Japan." tone=warm cost=item:blossom [helene_trust += 2, obsession -= 1]
        "I took the journal from my coat and opened it at the page. The blossom had gone thin and pale, like paper."
        helene surprised "Oh."
        helene soft "Where did it grow?"
        herve happy "On a wall, in the hills. I thought it looked like here."
        "She pressed it into her own book, the one she was always reading, and for the rest of her life I never once saw her lose that page."
    - "Tell her about the woman in Japan." tone=honest [helene_trust += 1, mystery -= 1]
        "I don't know why I told her. Maybe because keeping it was heavier than the journey."
        show helene surprised
        "I told her about the woman beside Hara Kei. About her eyes. About the note."
        "I did not tell her about the cup."
        show helene hurt
        "She was quiet for a long time. Then she asked only one thing."
        helene upset "Who translated it for you?"
        herve uneasy "Madame Blanche."
        helene sad "I see."
        set told_helene = true
    - "Take her hand, and try to be here." tone=tender [helene_trust += 1]
        show helene surprised
        "I took her hand, and made myself notice things: the cut grass, the pond, the weight of her head on my shoulder."
        helene smile "There you are."
    - hesitate [helene_trust -= 1]
        helene sad "Never mind. Look — the roses have come back."
        show helene happy
        "She talked about the roses. I let her."
  hide helene
  scene joncour_bedroom with fade
  play music sorrow fadein 3
  "At night, we lay together in bed."
  show helene sad
  "Hélène looked at me."
  helene sad "You're somewhere else again."
  herve uneasy "I'm here."
  helene upset "Your body is."
  show helene sad
  "I remained silent."
  "Hélène turned toward me."
  helene soft "I don't need you to explain everything."
  "A pause."
  helene upset "Just don't disappear while you're still beside me."
  show helene sad
  menu time 12
    - "Space out." tone=obsession [obsession += 2, helene_trust -= 1]
        "I stared into the darkness."
        "My thoughts returned to Japan: a cup, a glove, a few lines of ink."
        hinner "And if Hélène mentally notes all the time Hervé spaces out in bed, nobody has to know."
        "She closed her eyes."
        set ch9_choice = "space"
    - "Sleep it off, facing your back to Hélène." tone=cold [helene_trust -= 2]
        "I turned away."
        helene upset "Good night."
        herve sad "Good night."
        "Neither of us spoke again."
        hide helene
        scene joncour_bedroom with slow
        tint dawn
        play music lament fadein 3
        "..."
        hinner "The next morning, I woke to an empty bed."
        hinner "I reached across the sheets."
        hinner "Nothing."
        effect pulse 0.8
        "A tear fell from her eye."
        hinner "I closed my eyes again, and imagined him coming home to me."
        tint none
        set ch9_choice = "turn"
    - "Pull her close." tone=tender [helene_trust += 2, obsession -= 1]
        show helene surprised
        "I didn't say anything. I pulled her close, and held on, and stayed awake until her breathing slowed."
        helene soft "{speed=0.7}There you are.{/speed}"
        inner "For one night, Japan was very far away."
        set ch9_choice = "hold"
    - hesitate [obsession += 1]
        "I meant to answer her. The silence answered first."
        hinner "And if Hélène mentally notes all the time Hervé spaces out in bed, nobody has to know."
        set ch9_choice = "space"
  if persistent.any_ending
    call helene_blanche
  endif
  jump chapter10


# ============================================================================
#  CHAPTER 10 — THE THIRD JOURNEY
# ============================================================================
label chapter10
  chapter "Chapter 10" "The Third Journey" seal 雨
  scene joncour_home with fade
  play music helene_theme fadein 2
  "I decided to return to Japan."
  "Before I left, Hélène watched me prepare."
  show helene surprised
  clue ink 0.5 0.55 "Ink on her fingers" "Black ink, not the blue she kept the accounts in. When she saw me look, she folded her hands."
  helene surprised "Another journey?"
  herve neutral "Yes."
  helene sad "And how long will you be gone?"
  herve sad "I don't know."
  "She nodded."
  helene upset "You never do."
  show helene sad
  "I looked at her."
  camera close helene
  helene soft "Come home, Hervé."
  "I said nothing."
  camera wide
  hide helene
  play music storm fadein 2
  journey third
  scene road_rain with fade
  if obsession >= 8
    "I told Baldabiou it was for the eggs. I told Hélène it was for the eggs. I stopped believing it somewhere in Russia."
  else
    "It was for the eggs. I told myself that every morning, like a prayer."
  endif
  "At the coast, soldiers had put a barrier across the road. The officer wanted to know my business, and then he wanted money."
  menu slow
    - "Show him Hara Kei's pass." tone=honest needs=item:pass
        "The officer looked at the red seal and stepped back as if it were hot."
        set danger -= 1
    - "Pay him." tone=duty cost=francs:60
        "He took the money without counting it, which told me I had paid too much."
    - "Talk your way through." tone=danger [danger += 2]
        "I talked. He listened. Then he let me through, and wrote my name in a book."
    - hesitate [danger += 1]
        "I stood in the rain with nothing to say. He searched my bags and kept what he liked."
        lose francs 30
  scene estate_unrest with fade
  play music tension fadein 2
  cutscene warships
  "The country had changed. Foreign ships had come into the ports with their guns, and the old order was cracking. There were soldiers on the roads."
  show harakei stern
  harakei speaking "It is not a good time to be a foreigner here."
  if danger >= 2
    harakei stern "It is a worse time to be a foreigner who asks questions."
  endif
  if route() == "lost"
    harakei angry "You come back too often, Monsieur Joncour. Men notice. I notice."
  elif route() == "devoted"
    harakei amused "You look like a man with a home. Keep it in your mind on these roads."
  endif
  show harakei stern
  "He sold me the eggs anyway. But he did not invite me to stay."
  hide harakei
  "I saw her once. Across a courtyard, for the length of a breath."
  if woman_name == "???"
    show woman gaze
    show woman surprised
    "Someone called to her from the house. Her name. The first time I had ever heard it."
    set woman_name = "Yukimura"
    reveal woman
    show woman neutral
    "Yukimura."
    hide woman
  elif intimacy >= 3
    show woman surprised
    "She stopped when she saw me. She pressed one hand flat against her own chest — just once, very lightly — and then she was gone."
    show woman smile
    hide woman
  else
    show woman gaze
    "She looked at me the way she had the first day. Then she turned away."
    show woman sad
    hide woman
  endif
  "I had crossed the world to look at a woman for one second. And the practical reason for all of it — the eggs, the trade, the town — suddenly felt like an excuse I had invented for myself."
  jump chapter11


# ============================================================================
#  CHAPTER 11 — WAR
# ============================================================================
label chapter11
  chapter "Chapter 11" "War" seal 戦
  play music war_dread fadein 1
  play ambience battle
  cutscene war
  effect ringing
  scene balbadiou_office with fade
  play music war_dread fadein 3 volume 0.55
  show balbadiou worried
  "The next year, war had changed everything. Japan was no longer the safe destination it had once been."
  "Baldabiou spoke to me in his office, with the door closed."
  balbadiou worried "The routes are dangerous now."
  herve neutral "I can still go."
  balbadiou serious "You don't have to."
  herve uneasy "What is the alternative?"
  balbadiou serious "China."
  "I hesitated."
  menu time 20
    - "Go to China." tone=duty [obsession -= 1]
        herve sad "China, then."
        balbadiou happy "It's safer."
        herve uneasy "And Japan?"
        balbadiou angry "Forget Japan."
        show balbadiou serious
        set ch11_choice = "china"
        jump lost_without_goodbye
    - "Go to Japan anyway." tone=danger [obsession += 3, danger += 3]
        herve angry "I have to go."
        balbadiou angry "You don't understand what you're risking."
        herve neutral "I understand."
        balbadiou worried "Then why?"
        "I looked toward Japan."
        herve sad "Because I need to know."
        show balbadiou uneasy
        set ch11_choice = "japan"
    - hesitate [obsession += 2, danger += 2]
        "I didn't answer. Baldabiou read the answer in my face anyway."
        balbadiou worried "God help you, then. Go. I won't pretend I didn't see it coming."
        set ch11_choice = "japan"
  hide balbadiou
  jump chapter12


# ---- ENDING: LOST WITHOUT GOODBYE -------------------------------------------
label lost_without_goodbye
  hide balbadiou
  scene china_dock with fade
  play music tension fadein 3
  "I travelled toward China."
  "At the harbour, two traders met me off the boat. Good coats, good French, good papers with red stamps. They knew Baldabiou's name. They knew mine."
  "They took me inland to see their eggs, they said. The finest in the province."
  play sound footsteps
  "The road got narrower. The traders stopped talking."
  play sound sword volume 0.8
  play music battle fadein 0.5
  effect shake 0.8
  "I understood too late what they were."
  play sound sting
  scene black with flash
  stop music fadeout 2
  "..."
  scene joncour_home with slow
  play music sorrow fadein 4
  "Back in France, Hélène received no news."
  show helene sad
  hinner "He stayed in Japan. That's what they'll say. That he found something there, and stayed."
  "She waited."
  show helene sad
  "Weeks became months."
  show helene surprised
  hinner "Every carriage on the road. Every knock at the door."
  show helene sad
  "Eventually, her hope disappeared."
  show helene upset
  helene upset "He didn't even say goodbye."
  hide helene with slow
  "Her grief consumed her, and she died believing I had chosen another life."
  cutscene end_no_goodbye
  ending no_goodbye "Yukue Shirezu — Lost Without Goodbye" tragic kanji 消 music lament hint "What if he took the safer road?"


# ============================================================================
#  CHAPTER 12 — THE ABANDONED VILLAGE
# ============================================================================
label chapter12
  chapter "Chapter 12" "The Abandoned Village" seal 灰
  play music war_dread fadein 1 volume 0.8
  walk crossing
  if wounded
    effect ringing
  endif
  scene burned_village with fade
  stop music fadeout 3
  cutscene ashes
  "I arrived in Japan."
  "The places I once knew had changed. The village was nearly abandoned."
  play sound wind_gust
  effect shake 0.6
  "Burned houses. Black beams against the sky. No birds. The great aviary was empty, its door hanging open."
  herve uneasy "Hara Kei?"
  "No answer."
  "I continued searching."
  if wounded
    "My shoulder still ached where a shell had thrown me into the ditch. I did not look at it."
  endif
  walk ruins into ruins_how
  if ruins_how == "caught"
    set danger += 1
  endif
  scene burned_village with fade
  inner "I had crossed an ocean for a place that no longer seemed to exist."
  if found_hairpin
    inner "Her hairpin was in my pocket. It was warm from the ashes, or from my hand."
  endif
  "The lanterns came up the road. Soldiers, going from ruin to ruin."
  play sound shouts volume 0.6
  play music pursuit fadein 1
  minigame hide into hide_result
  if hide_result == "caught"
    play sound sting
    play music tension fadein 1
    play sound heartbeat_fast
    "A soldier dragged me into the light. He shouted a question I didn't understand, and put his hand on his sword."
    menu time 8
      - "Show him Hara Kei's pass." tone=honest cost=item:pass
          "He looked at the seal, then at me. He spat, and let me go. He kept the pass."
      - "Give him your purse." tone=duty cost=francs:80
          "He weighed the purse in his hand, and decided I was worth more alive than dead."
      - "Give him your father's watch." tone=quiet cost=item:watch
          "He held the watch to his ear, listening to it tick, and smiled like a child."
          inner "I watched my father's watch go into a stranger's pocket, and I was grateful. That was the worst of it."
      - "Run." tone=danger [danger += 3]
          play sound running
          play sound musket
          "I ran. A shot cracked past me into the dark, then another. I did not stop until the trees."
          play sound musket volume 0.6
      - hesitate [danger += 2]
          "I froze. He struck me once, hard, and left me in the ashes. When I could stand again, my purse was lighter."
          lose francs 40
  else
    "I pressed myself into the shadow of a burned wall, and the lanterns passed."
  endif
  play music lament fadein 6
  "I searched for days. For Hara Kei. For her. For anyone."
  "Then, on the fourth day, a boy found me and led me into the forest, without a word."
  jump chapter13


# ============================================================================
#  CHAPTER 13 — HARA KEI'S WARNING
# ============================================================================
label chapter13
  chapter "Chapter 13" "Hara Kei's Warning" seal 森
  scene forest_camp_night with fade
  play music japan fadein 3
  cutscene forest
  "I finally found Hara Kei, camped in the forest with what was left of his people."
  show harakei angry
  "He looked at me with anger."
  harakei angry "You should not have come."
  herve uneasy "I need the eggs."
  harakei furious "You need to leave."
  herve angry "I came for the eggs."
  harakei stern "No. You came for something else."
  "I remained silent."
  if route() == "lost"
    harakei furious "{shake}Every time you come, something burns.{/shake}"
  endif
  show harakei stern
  menu time 16 slow
    - "Leave." tone=quiet [danger -= 2, obsession -= 1]
        herve sad "Give me the eggs."
        "Hara Kei handed them to me."
        gain item egg_box
        harakei speaking "Then go."
        set ch13_choice = "leave"
    - "Stay." tone=danger [danger += 3, obsession += 2]
        set ch13_choice = "stay"
        jump endless_journey
    - "Ask about the woman." tone=obsession [obsession += 2, mystery += 1]
        herve uneasy "What happened to her?"
        show harakei angry
        "Hara Kei looked at me coldly."
        if woman_name == "Yukimura"
          herve sad "Yukimura. Where is she?"
        else
          herve sad "The woman who sat beside you. Where is she?"
        endif
        show harakei stern
        "Hara Kei did not answer."
        herve sad "Please."
        "Hara Kei turned away."
        harakei angry "Take the eggs."
        gain item egg_box
        "His men pushed me out of the camp."
        set ch13_choice = "ask"
    - hesitate [obsession += 1]
        "I didn't answer. The fire cracked between us."
        harakei speaking "Silence. You were always better at looking than at speaking. Take the eggs, and go home, Monsieur Joncour."
        gain item egg_box
        set ch13_choice = "leave"
  hide harakei
  if ch13_choice == "ask"
    "I left Japan with the eggs, but without the answer I wanted."
  else
    "I left with the eggs."
    "I searched for another route to find her — every road, every village that would still open its door to a foreigner. I could not find her."
    if woman_name == "Yukimura"
      herve sad "Where did you go, Yukimura?"
    else
      herve sad "Where did you go?"
    endif
    "After searching without success, I finally gave up, and began my journey home."
  endif
  "At the edge of the forest, the boy who had found me in the ruins was waiting. He had not said a word in four days."
  menu
    - "Give him your father's watch." tone=warm cost=item:watch [danger -= 1]
        "He held it to his ear the way children do. For the first time, he smiled."
        inner "My father would have liked that. Hélène would have liked it more."
    - "Give him some money." tone=duty cost=francs:20
        "He took the coins gravely, bowed, and was gone among the trees."
    - "Nod to him, and go." tone=quiet
        "I nodded to him. He nodded back. It seemed to be enough for both of us."
    - hesitate
        "By the time I had decided what to give him, he was gone."
  jump chapter14


# ---- ENDING: THE JOURNEY THAT NEVER ENDED -----------------------------------
label endless_journey
  herve angry "I am not leaving."
  show harakei stern
  "Hara Kei looked at his men."
  harakei furious "Then you have chosen."
  play music battle fadein 0.5
  play sound sword
  "I realised too late what I had done."
  play sound sting
  effect shake 1
  "Hara Kei and his men came for me."
  scene black with flash
  stop music fadeout 3
  "I died in Japan, in a forest whose name I never learned."
  scene joncour_home with slow
  play music sorrow fadein 4
  show helene sad
  "Hélène never learned the truth."
  show helene upset
  hinner "He's with her. Whoever she is. He chose her, and he didn't have the courage to write and tell me so."
  show helene sad
  "She believed I had abandoned her."
  hide helene with slow
  "She eventually died, consumed by sadness."
  cutscene end_endless_journey
  ending endless_journey "Owaranu Tabi — The Journey That Never Ended" tragic kanji 旅 music lament hint "What if he refused to leave the forest?"


# ============================================================================
#  CHAPTER 14 — THE LAST EGGS
# ============================================================================
label chapter14
  chapter "Chapter 14" "The Last Eggs" seal 卵
  play music journey fadein 2
  cutscene last_eggs
  scene road_winter with fade
  "I returned to France."
  "The eggs had travelled too far, too slowly, through too much."
  scene silk_mill_empty with fade
  play music sorrow fadein 3
  cutscene no_hatch
  "In spring, I held every card up to the window, one by one, looking for a single living egg."
  minigame eggs dead into last_eggs
  lose item egg_box
  "The eggs failed."
  "The silk trade in our town went on declining, a little more every month."
  show balbadiou uneasy
  "Baldabiou looked at the failed eggs."
  balbadiou worried "It's over."
  herve surprised "What?"
  balbadiou worried "The silk."
  if route() == "lost"
    balbadiou angry "You weren't even looking for eggs any more, were you. Not really."
    show balbadiou serious
    "I didn't answer. He was the only one who ever asked me straight out."
  endif
  hide balbadiou
  "I looked down."
  "The journeys, the danger, and everything I had sacrificed had produced nothing."
  "And yet I still thought about Japan."
  jump chapter15


# ============================================================================
#  CHAPTER 15 — THE FINAL LETTER
# ============================================================================
label chapter15
  chapter "Chapter 15" "The Final Letter" seal 手紙
  if persistent.any_ending
    call helene_candle
  endif
  scene joncour_home with fade
  play music her_theme fadein 3
  play sound paper
  "One day, I received another letter: a thick envelope with Japanese stamps, seven sheets covered in black ink."
  clue postmark 0.5 0.52 "No postmark" "Japanese stamps, and not a single postmark. It had never been through a post office."
  gain item letter
  "I immediately brought it to Madame Blanche."
  scene blanche_salon with fade
  show blanche surprised
  clue cups 0.74 0.6 "Two cups on the table" "Madame Blanche's tray held two cups, and one was still warm. Someone had left just before I came."
  herve uneasy "Please translate it."
  show blanche neutral
  "Madame Blanche read silently."
  clue primer 0.2 0.58 "A primer with a pink ribbon" "On her side table, a French–Japanese primer, much used. A pink ribbon marked a page halfway through."
  show blanche grave
  "Her expression changed."
  herve uneasy "What does it say?"
  blanche grave "Are you certain you want to know?"
  herve neutral "Yes."
  "She looked at me."
  blanche soft "It is a farewell."
  "I took the letter."
  herve surprised "From her?"
  show blanche grave
  "Madame Blanche did not answer directly."
  blanche soft "Some things are easier to desire when they remain impossible."
  "Then she read it to me, in French, slowly, without looking up."
  hide blanche
  cutscene final_letter
  cg the_letter with dissolve
  clue lavender 0.55 0.42 "Lavender on the paper" "The pages smelled faintly of lavender. Hélène grew it along the garden wall."
  window show
  if persistent.knows_truth
    woman "You crossed the whole world to look at me. I know what that journey costs. I have {color=#c2476a}waited at a window{/color} for every mile of it."
    woman "I will not ask you to come back. I ask you instead to stay where you are, in your house, in your {color=#c2476a}garden that will grow long after both of us{/color}."
    woman "Let me be a story someone told you once. Beautiful, and finished."
    woman "And if some evening you feel {color=#c2476a}a hand on your arm on the garden path{/color}, don't look for me in it. Look at whoever is beside you."
    woman "Goodbye, my love. We will not see each other again."
  else
    woman "You crossed the whole world to look at me. I know what that journey costs. I have waited at a window for every mile of it."
    woman "I will not ask you to come back. I ask you instead to stay where you are, in your house, in your garden that will grow long after both of us."
    woman "Let me be a story someone told you once. Beautiful, and finished."
    woman "And if some evening you feel a hand on your arm on the garden path, don't look for me in it. Look at whoever is beside you."
    woman "Goodbye, my love. We will not see each other again."
  endif
  cg hide with slow
  "I read the letter."
  "For the first time, I understood that my longing for Japan had consumed years of my life."
  "I now faced one final decision."
  menu time 20
    - "Give up, and stay with Hélène." tone=tender [helene_trust += 1, obsession -= 2]
        herve sad "I have to go home."
        set ch15_choice = "stay"
    - "Go to Japan, and stay." tone=obsession [obsession += 3]
        set ch15_choice = "japan"
        jump left_behind
    - hesitate [helene_trust += 1]
        "I sat with the seven sheets in my hands until Madame Blanche took them gently away, folded them, and gave them back."
        blanche soft "Go home, Monsieur Joncour."
        "I did."
        set ch15_choice = "stay"
  scene joncour_home with fade
  play music helene_theme fadein 3
  "I returned to Hélène."
  "We remained together, but something between us had changed. Something had been said, although neither of us had said it."
  "I retired from the silk trade, and built a quiet life."
  "I put the letter in a drawer."
  jump chapter16


# ---- ENDING: THE LIFE HE LEFT BEHIND ----------------------------------------
label left_behind
  "I looked at the letter again."
  herve angry "I have to see her."
  "I left France."
  "This time, I did not plan to return."
  play music storm fadein 2
  cutscene journey_three
  scene yuki_house with fade
  play music japan fadein 3
  "I learned Japanese in secret, word by word, so that I could avoid Hara Kei's men and survive in a country at war."
  "And eventually, I found her."
  show woman surprised
  if woman_name == "???"
    set woman_name = "Yukimura"
    reveal woman
    "Her name was Yukimura."
  endif
  show woman smile
  "I believed I had finally found the life I wanted."
  "For a while, we lived together, in a house in the hills with paper walls, where the rain sounded like someone whispering."
  hide woman
  scene yuki_house with slow
  filter faded
  play music lament fadein 4
  "But years later, I became sick."
  show woman worried
  "Yukimura sat beside me."
  herve sad "Will you stay?"
  show woman sad
  "Yukimura looked away."
  woman sad "I’m sorry, Hervé. I cannot stay and take care of you."
  "I struggled to sit up."
  herve angry "After everything I left behind for you?"
  show woman worried
  "Yukimura looked at me sadly."
  woman sad "You chose to leave your life behind."
  "A pause."
  woman cold "I never asked you to."
  hide woman with slow
  "She left."
  "I was left alone."
  "I thought of France. Of Hélène. Of the home I had abandoned."
  "Of all the years I had spent chasing something I could never truly possess."
  inner "I had crossed the world for a woman who had never asked me to come."
  "The room became silent."
  filter none
  cutscene end_left_behind
  ending left_behind "Utsusemi — The Life He Left Behind" bad kanji 空 music sorrow hint "What if he followed the last letter east?"


# ============================================================================
#  CHAPTER 16 — HÉLÈNE'S DEATH
# ============================================================================
label chapter16
  chapter "Chapter 16" "Hélène's Death" seal 別
  cutscene years
  scene garden_winter with fade
  play music helene_theme fadein 3
  "Years passed. The trees in the garden grew tall. I learned the names of the birds that came to the pond."
  "Then, one winter, Hélène became ill."
  scene helene_sickroom with fade
  play music farewell fadein 4
  filter faded
  show helene tired
  "I stayed beside her."
  clue ticket 0.8 0.56 "A coach ticket to the city" "Folded small in her prayer book: a coach ticket to the city, from the spring before the last letter came. She had never said she'd gone."
  "The town doctor shook his head. There was a physician in Nîmes, people said, who had saved patients the town had given up on. He was not cheap."
  menu time 12
    - "Send for him, whatever it costs." tone=tender cost=francs:150 [helene_trust += 2]
        "He came. He could not save her. But she slept without pain for the first time in weeks, and she knew what it had cost, and she held my hand as if it had been worth it."
        set doctor = "paid"
    - "Sell your father's watch to pay him." tone=tender cost=item:watch [helene_trust += 2]
        "I sold my father's watch to a jeweller in Nîmes, and the doctor came the same night."
        "He could not save her. But she slept without pain, and when she saw my empty waistcoat pocket she understood, and did not say anything, and held my hand."
        set doctor = "watch"
    - "There is nothing more anyone can do." tone=cold [helene_trust -= 1]
        "I told myself it was the truth. I think it was. I have never been sure it was the reason."
        set doctor = "none"
    - hesitate [helene_trust -= 1]
        "I kept meaning to write to Nîmes. By the time I did, it no longer mattered."
        set doctor = "late"
  helene tired "You're here."
  herve sad "I'm not going anywhere."
  show helene neutral
  "She smiled weakly."
  helene soft "You used to say that."
  "I took her hand."
  herve sad "I mean it now."
  if helene_trust >= 3
    helene soft "I know. I can tell the difference, you know. When you're here."
  elif helene_trust < 0
    helene tired "{speed=0.7}I know. I got used to talking to you when you were somewhere else.{/speed}"
  endif
  show helene sad
  silence 1.2
  cutscene candle
  "Hélène died peacefully, at the beginning of September, on a morning with a clear sky."
  filter none
  hide helene with slow
  scene black with slow
  stop music fadeout 4
  centered "I buried her in the town cemetery.\nAfterwards, I was left alone with the memories of our life together."
  jump chapter17


# ============================================================================
#  CHAPTER 17 — THE TRUTH
# ============================================================================
label chapter17
  chapter "Chapter 17" "The Truth" seal 真
  scene joncour_home with fade
  play music letter fadein 4
  "After Hélène's death, I went through her belongings."
  "In the bottom of her sewing box, under the silk thread, there were sheets of paper, torn into strips."
  "Japanese characters. The same few lines, copied again and again, in a careful, unsteady hand that was learning as it went."
  play sound heartbeat
  "I knew those characters. I had carried them across the world."
  clueboard into truth_seen
  if truth_seen == "all"
    inner "I did not need to read them. I read them anyway."
  endif
  silence 1.8
  minigame letter into letter_result
  play music revelation fadein 2
  cutscene truth
  "It was the letter."
  "I recognised the words. The handwriting. The message."
  cg the_letter with dissolve
  effect glitch 0.9
  filter sepia
  helene "You crossed the whole world to look at me. I know what that journey costs. I have {color=#c2476a}waited at a window{/color} for every mile of it."
  helene "Let me be a story someone told you once. Beautiful, and finished."
  helene soft "Look at whoever is beside you."
  filter none
  cg hide with slow
  set persistent.knows_truth = true
  "The letter I had believed came from her was written by Hélène."
  "The woman I had spent years longing for had never written it."
  "Hélène had."
  "She had understood me. She had understood my longing."
  "And despite everything, she had still loved me."
  if has("helene_letter")
    "My hand went to the inside pocket of my coat. Her other letter was still there, unopened after all these years."
    lose item helene_letter
    helene soft "{speed=0.8}Whatever you find there, I will be here when you come home. I will always be here. — H.{/speed}"
  endif
  if told_helene
    inner "Who translated it for you? — she had asked me, in the garden. And I had told her."
  endif
  "I sat silently."
  menu time 16
    - "“Why didn't she tell me?”" tone=honest
        herve surprised "Why didn't she tell me?"
        "I looked at the letter."
        herve sad "Why did you let me believe it was her?"
        effect pulse 1
        "I began to cry."
        set final_choice = "tell"
    - "“Why did she help me?”" tone=warm
        herve sad "Why did she help me?"
        "I realised that Hélène had given me something I had spent years searching for elsewhere."
        "Understanding."
        "Love."
        "Forgiveness."
        set final_choice = "help"
    - "Say nothing." tone=quiet
        "I said nothing."
        "I simply held the letter."
        "For once, there was nothing left to say."
        set final_choice = "silent"
    - hesitate
        "I meant to say something. The words never came."
        "I simply held the letter. For once, there was nothing left to say."
        set final_choice = "silent"
  jump ending


# ============================================================================
#  ENDING — HOME
# ============================================================================
label ending
  scene cemetery with slow
  play music home fadein 4
  "I returned to Hélène's grave."
  walk cemetery
  scene cemetery with fade
  "I stood quietly beside it."
  if has("flowers")
    "I laid the wildflowers down on the stone. The small white ones. She never did learn their name. Neither did I."
    lose item flowers
  endif
  if has("blossom")
    "In my journal, pressed between two pages, was the blossom I had brought back from Japan for her and never given."
    menu
      - "Leave it on her grave." tone=tender cost=item:blossom [helene_trust += 1]
          "It was too late to give it to her. I gave it to her anyway."
      - "Keep it." tone=quiet
          "I kept it. It was the last thing from Japan I had, and I was not ready."
      - hesitate
          "I held it for a long time, and then put it back between the pages."
  endif
  herve sad "I spent so many years looking for something I couldn't have."
  "I placed the letter beside the grave."
  herve sad "And you were here the whole time."
  if truth_seen == "all"
    # the scene only a player who saw it coming gets: every clue was in front of him
    scene helene_garden with flash
    play sound swell
    show helene soft
    camera push
    "I remembered her at the garden gate, the summer before the last letter came. Ink on her fingers. Lavender on her sleeves. A coach ticket she never mentioned."
    helene soft "You're home."
    "Every piece of it had been in front of me. At the end, at least, I had let myself see."
    hide helene with slow
    scene cemetery with slow
  endif
  play sound wind_gust volume 0.6
  "The wind moved through the trees."
  if final_choice == "tell"
    inner "I asked her again why she hadn't told me. The wind didn't answer. It didn't need to. She had told me, in the only way I would ever have listened."
  elif final_choice == "help"
    inner "She had given me back to myself, and hoped I would bring it home. It took me a lifetime. I brought it home."
  else
    inner "I didn't say anything more. She had said it all already, better, in a language I couldn't read."
  endif
  if helene_trust >= 3
    play sound swell
    helene soft "{i}Look at whoever is beside you.{/i}"
    "For the first time in many years, I was exactly where I was."
  endif
  "I remained there."
  "The journey was finally over."
  cutscene end_home
  ending home "Kikyō — Home" true kanji 帰 music farewell hint "What if he came home, stayed, and learned the truth?"


# ============================================================================
#  HÉLÈNE — her side of the story (on later playthroughs, once any ending has been seen)
# ============================================================================
label helene_window
  scene joncour_home with fade
  play music helene_theme fadein 2
  tint night
  show helene sad
  hinner "He left at three o'clock. I know because I watched the clock, and not the road. The road I watched afterwards."
  show helene surprised
  hinner "Every carriage that comes over the hill is him, for exactly as long as it takes to see that it isn't."
  helene sad "Japan."
  hinner "I found it in the atlas. It is the last thing on the page. After it there is only the edge of the paper."
  show helene neutral
  hinner "I will learn where every one of those places is. Kiev. The Urals. The lake they call a sea. So that when he tells me about them, I will already know."
  hide helene with slow
  tint none
  return

label helene_blanche
  scene blanche_salon with fade
  play music reverie fadein 2
  show blanche neutral at right
  show helene neutral at left
  blanche surprised "Madame Joncour. You came alone."
  helene soft "I would like you to teach me something. A little Japanese."
  blanche grave "That is a strange thing for a wife in Lavilledieu to want."
  helene sad "My husband goes to the end of the world. I would like to be able to write to it."
  show blanche soft
  "Madame Blanche looked at her for a long time. Then she poured a second cup of tea, and did not ask anything else."
  show blanche smile
  hide blanche
  hide helene
  return

label helene_candle
  scene joncour_bedroom with fade
  play music her_theme fadein 2
  show helene tired
  hinner "The characters will not sit still. Each one is a little house, and I keep leaving the doors open."
  play sound ink
  hinner "Madame Blanche says my hand is getting better. She says it without looking at me."
  helene soft "{i}You crossed the whole world to look at me.{/i}"
  show helene sad
  hinner "It is not a lie. It is only not mine. Or it is mine, and he will never know it."
  hinner "Seven sheets. Stamps soaked off the letters that came with the eggs. No post office between this room and his hands."
  show helene neutral
  hinner "I pressed a sprig of lavender between the pages, the way I do with everything I mean to keep. That much, at least, is only mine."
  play sound candle_out
  hide helene with slow
  return
`;
