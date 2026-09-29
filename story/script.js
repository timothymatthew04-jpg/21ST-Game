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
# Where Hervé's heart is heading, worked out at every chapter: toward Hélène ("devoted"),
# pulled east ("lost"), or in between ("torn"). The chapter card and the text box take on
# that mood, and scenes can ask:  if route() == "lost"
routescore helene_trust * 2 - obsession * 0.6 - danger * 0.4
routes -4 3
# The backgrounds are detailed pixel art at high resolution, so everything is scaled smoothly.
artstyle smooth
credits "Adapted from Silk by Alessandro Baricco"
titlemusic title
warning "SILK is a branching story adapted from Alessandro Baricco's novel.\n\nYour choices shape Hervé's relationships, his obsession and his memories — the great events of his life stay the same.\n\nChoices wait only so long. If you take too long, Hervé hesitates, and silence is a choice too."

# ---------------------------------------------------------------- characters
# Hervé is the player. His spoken lines use "herve"; his inner thoughts use "inner".
character herve     "Hervé"          color=#e9c46a blip=440 voice=112 pace=125
character inner     ""               color=#cbbef0 italic face=none
character helene    "Hélène"         color=#f4a7b9 blip=620 voice=215 pace=120 breath=0.2
character balbadiou "Balbadiou"      color=#9ccf9f blip=380 voice=98 pace=100 muffle=1250
character harakei   "Hara Kei"       color=#e0503c blip=300 voice=86 pace=165 muffle=950
character woman     "???"            color=#f6ecdb blip=700 voice=240 pace=150 breath=0.45 muffle=1000
character blanche   "Madame Blanche" color=#b7c4ff blip=520 voice=185 pace=135 breath=0.15

# Characters murmur while they talk (voice= pitch in Hz, pace= ms per syllable, muffle= how
# muffled, breath= how breathy). Narration is read aloud by the browser's own voice; these lines
# tell it how to say the French names.
pronounce "Hervé"       "Air-vay"
pronounce "Joncour"     "Zhon-coor"
pronounce "Hélène"      "Ay-lenn"
pronounce "Balbadiou"   "Bal-ba-dyoo"
pronounce "Lavilledieu" "La-veel-dyuh"
pronounce "Blanche"     "Blonsh"

# Each character's picture is assets/sprites/<id>/neutral.png, and their face in the
# text box is assets/faces/<id>.png. The face appears when they speak without standing
# in the scene: always for Hervé, who is the player.

# ---------------------------------------------------------------- places and living backgrounds
# "place" names where a background is; the name appears at the top of the screen the
# first time the story arrives there. "bgfx" brings a background to life; positions are
# fractions of the picture (see docs/SCRIPTING.md for every effect).
place lavilledieu       "Lavilledieu"            "The south of France · 1861"
place silk_mill         "The Silk Mill"          "Lavilledieu · France"
place silk_mill_empty   "The Silk Mill"          "Lavilledieu · France"
place balbadiou_office  "Balbadiou's Office"     "Lavilledieu · France"
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

bgfx lavilledieu smoke=0.752,0.574,0.6 glints=0.52,0.56,0.19,0.44,16 birds=4,0.06,0.3 motes=0.1,0.4,0.8,0.4,20,#fff6d8
bgfx silk_mill glow=0.36,0.38,0.08,#fff4d0 glow=0.498,0.38,0.08,#fff4d0 glow=0.635,0.38,0.08,#fff4d0 motes=0.15,0.25,0.55,0.7,45
bgfx silk_mill_empty motes=0.15,0.25,0.55,0.7,20,#c8d4e6 rain=0.5,0.308,0.215,0.105,0.34 rain=0.5,0.446,0.215,0.105,0.34 rain=0.5,0.583,0.215,0.105,0.34
bgfx balbadiou_office flame=0.6375,0.648,0.05,#ffc070 glow=0.87,0.35,0.1,#fff0d0 motes=0.5,0.3,0.45,0.6,30
bgfx joncour_home flame=0.856,0.642,0.07,#ff9a40 embers=0.856,0.63,0.4 flame=0.825,0.393,0.014 flame=0.887,0.393,0.014 stars=0.37,0.21,0.26,0.14,10 fireflies=0.37,0.47,0.26,0.1,5
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
bgfx smuggler_boat glow=0.625,0.207,0.05,#cfe0ff glints=0.5,0.53,0.25,0.25,30 stars=0,0,1,0.45,30 mist=0.48,0.12,0.25
bgfx china_dock glow=0.3125,0.526,0.09,#ffc080 flame=0.252,0.593,0.03,#ff7050 flame=0.877,0.593,0.03,#ff7050 glints=0,0.56,1,0.25,26 birds=3,0.08,0.3
bgfx japan_coast glow=0.133,0.141,0.03,#cfe0ff glow=0.85,0.55,0.25,#ffb080 glints=0.3,0.56,0.7,0.2,26 flame=0.373,0.633,0.02 birds=4,0.1,0.35 mist=0.42,0.12,0.3,#ffd0d0 stars=0,0,1,0.25,14
bgfx japan_path rays=0.5,0.37,1.2,0.6,#fff0b0 motes=0.3,0.2,0.4,0.6,40,#fff0c0 fireflies=0,0.65,0.35,0.3,8 fireflies=0.65,0.65,0.35,0.3,8 foliage=0.6 glow=0.5125,0.14,0.07,#e8f0ff flame=0.25,0.687,0.02,#ffd28a flame=0.754,0.687,0.02,#ffd28a flame=0.329,0.678,0.012,#ffd28a
bgfx hara_kei_estate glow=0.435,0.159,0.1,#cfe0ff flame=0.2875,0.696,0.03 flame=0.429,0.673,0.025 flame=0.5875,0.696,0.03 flame=0.767,0.696,0.03 flame=0.9375,0.781,0.045 glow=0.74,0.66,0.06,#ffcf7a
bgfx hara_kei_estate glints=0.1,0.8,0.8,0.18,22 leaves=0.8 petals=0.25 stars=0.05,0.02,0.9,0.3,14 fireflies=0.05,0.6,0.9,0.2,8
bgfx estate_day glints=0.1,0.8,0.8,0.18,22 leaves=1 petals=0.3 birds=3,0.05,0.3 motes=0.2,0.4,0.6,0.4,20,#fff6d8
bgfx estate_unrest flame=0.2875,0.696,0.03 flame=0.429,0.673,0.025 flame=0.5875,0.696,0.03 flame=0.767,0.696,0.03 flame=0.9375,0.781,0.045 smoke=0.125,0.548,1.2,#2e2020 smoke=0.79,0.548,1.3,#2e2020 smoke=0.917,0.548,1,#2e2020 ash=0.6 leaves=0.6
bgfx estate_tearoom petals=1.2 glow=0.6875,0.163,0.07,#cfe0ff steam=0.4917,0.785,0.9 steam=0.65,0.711,0.8 glints=0.31,0.66,0.38,0.05,10 flame=0.748,0.459,0.02,#ffd28a
bgfx estate_room glow=0.2167,0.244,0.035,#cfe0ff glints=0.17,0.56,0.12,0.13,10 fireflies=0.27,0.15,0.15,0.5,8 fireflies=0.696,0.16,0.2,0.5,10 motes=0.25,0.74,0.46,0.13,20
bgfx aviary flutter=0.365,0.25,0.33,0.38,18 leaves=0.8 rays=0.19,0.15,0.8,0.8,#fff2c4 motes=0.3,0.3,0.4,0.5,25,#fff0c8
bgfx burned_village smoke=0.167,0.65,1.3,#2e2020 smoke=0.7,0.64,1,#2e2020 smoke=0.906,0.67,1.2,#2e2020 smoke=0.41,0.62,0.7,#3a2a28 embers=0.167,0.7,1 embers=0.906,0.726,1 embers=0.406,0.63,0.6 ash=1 flame=0.167,0.71,0.08,#ff7a30 flame=0.7,0.69,0.07,#ff7a30 flame=0.906,0.75,0.08,#ff7a30
# the painted close-ups shown with "cg"
bgfx the_cup steam=0.52,0.54,0.9 glow=0.19,0.385,0.06,#ffc070 petals=0.3,0.62,0.07,0.25,0.25
bgfx the_glove motes=0.1,0,0.7,0.8,22,#fff0c8 rays=0.3,0,1.2,0.5,#fff0c0
bgfx the_letter flame=0.896,0.29,0.03,#ffc070 motes=0.6,0.1,0.3,0.5,14,#ffe0a0
bgfx forest_camp_night flame=0.429,0.82,0.12,#ff9a40 embers=0.429,0.8,1 smoke=0.429,0.78,0.8,#6a7288 fireflies=0,0.55,1,0.3,14 mist=0.7,0.2,0.3,#b8c8ff rays=0.6,0,0.9,0.45,#b8d0ff flame=0.219,0.79,0.05,#ffb860 glow=0.625,0.096,0.03,#cfe0ff

# Each place has its own sound, which starts when the story arrives there and fades
# when it leaves: "bgsound background ambience [volume]". A recording in
# assets/music/<ambience>.mp3 is used if there is one; otherwise it is synthesized.
bgsound lavilledieu       stream
bgsound silk_mill         mill
bgsound silk_mill_empty   rain 0.6
bgsound balbadiou_office  clock
bgsound joncour_home      fire 0.8
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
bgsound burned_village    ruins
bgsound forest_camp_night camp
bgsound blanche_salon     city 0.8

# How the light of each place falls on the characters: "bglight background look",
# where look is day, warm, fire, dusk, night, moon, grey, dim or ash.
bglight balbadiou_office  warm
bglight joncour_home      fire
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
karma business     color=#9ccf9f up="Balbadiou would be pleased."
karma mystery      color=#9fb4ff up="The mystery deepens." down="A little of the mystery fades."

# ---------------------------------------------------------------- journal words
# The DDLC-style word game in Chapter 4. Each word pulls Hervé's heart toward
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
  scene black with none
  centered "EUROPE, 1861"


# ============================================================================
#  INTRO — THE SILK DISEASE
# ============================================================================
label intro
  chapter "Prologue" "The Silk Disease" seal 絹
  scene lavilledieu with fade
  play music town_theme fadein 3
  cutscene prologue
  "That year, the silkworms began to die."
  "First in one village, then in the next. The eggs turned grey before they could hatch, and the worms that did hatch stopped eating and lay still on the mulberry leaves."
  "It spread across Europe. Then, they said, it reached Africa."
  "Our whole town lived on silk. The mill, the weavers, the merchants, the bakers who fed them. If the worms died, so did we — only more slowly."
  scene balbadiou_office with dissolve
  show balbadiou serious
  "Balbadiou had built the town's silk trade with his own two hands. He was the one who had talked me into it, years ago."
  "When he called me to his office, I knew he had already decided something."
  balbadiou "Japan."
  herve "Japan?"
  balbadiou serious "The disease hasn't reached them yet. You need to go."
  "He said it the way other men say it's raining."
  "Japan. The end of the world. A country that, officially, did not sell its silkworms to anyone."
  "He put a heavy purse on the desk between us: money for the road, for the smugglers, and for whatever else the road would ask."
  gain francs 200
  balbadiou "Spend it well, Hervé. Every franc that comes back is the town's."
  jump chapter1


# ============================================================================
#  CHAPTER 1 — THE JOURNEY
# ============================================================================
label chapter1
  chapter "Chapter 1" "The Journey" seal 旅
  scene joncour_home with fade
  play music helene_theme fadein 2
  "Hélène was reading by the window when I came home. She put the book face-down on her lap. She always knew before I said anything."
  show helene neutral
  herve "I have to go to secure the silkworms."
  helene sad "You're leaving again."
  herve "Only for a few months."
  helene "Japan."
  herve "Yes."
  helene "You've never even seen it."
  menu
    - "I'll be back before you know it." tone=warm [helene_trust += 1]
        helene soft "You always say that."
        herve "And I always come back."
        helene sad "That's not what I meant."
        set ch1_choice = "promise"
    - "It's necessary for the business." tone=duty [business += 1, helene_trust -= 1]
        helene hurt "Everything is always about the silk."
        herve "It's how we live."
        helene sad "I know."
        set ch1_choice = "business"
    - "Do you want me to stay?" tone=tender [helene_trust += 2]
        helene neutral "No."
        herve "No?"
        helene soft "I want you to want to stay."
        set ch1_choice = "stay"
    - hesitate [helene_trust -= 1]
        "I opened my mouth, and nothing came out. Japan, the eggs, the town: none of it sounded like an answer."
        helene sad "{speed=0.6}You don't know either, do you.{/speed}"
        "She picked up her book again. She didn't turn a single page."
        set ch1_choice = "silent"

  scene joncour_home with fade
  tint dawn
  "The next morning, I left before the sun was over the hills."
  "I wound my father's watch, the way I did before every journey. It had crossed half of Europe in his pocket. Now it would cross the rest in mine."
  gain item watch
  if ch1_choice == "stay"
    show helene soft
    "Hélène walked with me to the end of the garden. She didn't say anything. She held my hand until the gate, and then she let go of it very carefully, the way you set down something that might break."
    "In my palm she had left a handkerchief. White silk. She had sewn my initials in the corner."
    helene soft "So you have something of home to hold."
    hide helene
  elif ch1_choice == "business"
    "Hélène didn't come down. I saw her shape at the upstairs window, and then I didn't."
    "In my coat I found a handkerchief I had not packed: white silk, my initials sewn in the corner. She had come down in the night after all."
  elif ch1_choice == "silent"
    "Hélène was asleep when I left, or pretending to be. On the table by the door she had left a handkerchief, white silk, my initials sewn in the corner. No note."
  else
    show helene neutral
    helene "Write to me."
    herve "I will."
    "We both knew there would be nowhere to post a letter from where I was going."
    "She tucked a handkerchief into my breast pocket, white silk with my initials sewn in the corner, and patted it flat, the way you close a book."
    hide helene
  endif
  gain item handkerchief
  tint none
  play music journey fadein 3
  cutscene journey_one
  scene road_east with slow
  "I crossed France by train, then the Alps. Austria. Hungary. Then Russia, where the roads stopped being roads."
  "Weeks of steppe. Lake Baikal, which the people there call the sea. Rivers I crossed on rafts, and villages that had never seen a Frenchman and saw no reason to start."
  scene smuggler_boat with dissolve
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
        herve "We agreed a price. We keep to it, or you can explain to Hara Kei why his buyer never arrived."
        "He looked at me for a long time. Then he laughed, and let it go. I did not sleep that night."
        set smuggler = "threat"
    - hesitate [danger += 1]
        "I said nothing. He took my silence for a yes, and helped himself to my purse."
        lose francs 50
        set smuggler = "robbed"
  "It sailed at night, with no lights, toward a country that did not want me."
  jump chapter2


# ============================================================================
#  CHAPTER 2 — JAPAN
# ============================================================================
label chapter2
  chapter "Chapter 2" "Japan" seal 日本
  scene japan_coast with fade
  play music japan fadein 3
  cutscene arrival
  "I came ashore on the west coast, the unofficial way, where foreigners were not supposed to come ashore at all."
  scene japan_path with dissolve
  "Men I never saw clearly led me inland for days, blindfolded for part of the way. Nobody explained anything. I learned very quickly not to ask."
  scene hara_kei_estate with fade
  play sound temple_bell volume 0.6
  "At last I was brought to a village in the hills, and to the house of the man who controlled everything there: Hara Kei."
  show harakei neutral at center
  "He sat perfectly still. He was younger than I had imagined, and he looked at me as if I were a piece of weather he was waiting to pass."
  harakei "You came for the eggs."
  herve "Yes."
  if smuggler == "threat"
    harakei "The boatman says you threatened him with my name."
    "He let the words sit there. I understood that everything that happened on his roads came back to him."
  endif
  show harakei neutral at left
  show woman neutral at right
  "Beside him sat a young woman. Her eyes were not Asian — that was the first strange thing. The second was that she did not lower them."
  "She looked directly at me."
  inner "She was not beautiful in the way people usually mean beautiful. She simply looked at me."
  menu
    - "Look away." tone=quiet [danger -= 1]
        "I looked down at the mat between us."
        harakei "You are a respectful man."
        "When I raised my eyes again, she was still watching me."
        set ch2_choice = "away"
    - "Continue looking at her." tone=obsession [fascination += 2]
        "I didn't look away. Neither did she."
        "Hara Kei went on speaking about prices and seasons. I have no idea what he said."
        inner "I did not know her name. But I remembered her eyes."
        set ch2_choice = "look"
    - "Ask Hara Kei who she is." tone=danger [danger += 2]
        herve "Who is she?"
        show harakei stern
        "Hara Kei turned his head, slowly, the way a door opens in an empty house."
        harakei stern "That is not a question you should ask."
        set asked_who = true
        set ch2_choice = "ask"
    - hesitate [fascination += 1]
        "I meant to look away. I didn't. I didn't do anything at all."
        "At last it was she who lowered her eyes, and I understood that she had decided when it would end, not me."
        set ch2_choice = "frozen"
  jump chapter3


# ============================================================================
#  CHAPTER 3 — THE CUP
# ============================================================================
label chapter3
  chapter "Chapter 3" "The Cup" seal 杯
  scene estate_tearoom with dissolve
  play music her_theme fadein 4
  show harakei neutral at left
  show woman neutral at right
  "Later, tea was served. The young woman prepared it herself, and I watched her hands."
  minigame tea into tea_result
  if tea_result == "win"
    "When the bowl came to me, I did as she had done, in the same order, turning it the same way."
    harakei neutral "You watch carefully, Monsieur Joncour."
    set danger -= 1
    set fascination += 1
  else
    "When the bowl came to me, my hands did everything in the wrong order. It knocked against the tray."
    harakei stern "In this house, we are careful with small things."
    set danger += 1
  endif
  "Hara Kei was talking, and for a moment no one was looking at anyone."
  "The young woman lifted a small teacup and drank from it."
  cutscene the_cup
  "Then she set it down in front of me."
  show woman gaze at right
  "She looked at me. Then at the cup. Then at me again."
  menu time 10
    - "Drink it." tone=obsession [fascination += 2, intimacy += 1]
        cg the_cup with dissolve
        "I picked up the cup and drank. Our eyes met over its rim."
        cg hide with dissolve
        inner "I didn't know what she wanted. But I wanted to understand."
        set ch3_choice = "drink"
    - "Ignore it." tone=cold [mystery += 2]
        "I looked at the cup. Then at her."
        herve "I don't understand."
        show woman neutral at right
        "She took the cup back without a word, and the moment closed over like water."
        set ch3_choice = "ignore"
    - "Drink from a different side." tone=tender [fascination += 1, intimacy += 2]
        cg the_cup with dissolve
        "I noticed where her lips had touched the porcelain."
        "I turned the cup slightly, and drank from the other side."
        cg hide with dissolve
        show woman smile at right
        "She smiled."
        "It lasted less than a second. I would think about it for years."
        set ch3_choice = "turn"
    - hesitate [mystery += 1]
        "I sat there looking at the cup for too long."
        show woman neutral at right
        "Her hand came back for it, unhurried. She drank what was left herself, and did not look at me again that evening."
        set ch3_choice = "ignore"
  if ch3_choice != "ignore"
    "Hara Kei did not seem to notice. Or he noticed everything, and chose to say nothing. With him, it was the same thing."
  endif
  jump chapter4


# ============================================================================
#  CHAPTER 4 — THE FIRST RETURN
# ============================================================================
label chapter4
  chapter "Chapter 4" "The First Return" seal 帰
  play music journey fadein 2
  cutscene return_home
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
  scene silk_mill with fade
  play music town_theme fadein 2
  show balbadiou happy
  lose item egg_box
  if eggs_result == "win"
    "In spring, the eggs hatched. They were healthy. Every one of them."
  else
    "In spring, the eggs hatched. Nearly all of them. Enough."
  endif
  balbadiou happy "You did it. You did it, Hervé! The whole town will eat this year."
  if eggs_result == "win"
    balbadiou happy "And not one bad card in the lot. Here, your share. You earned it twice."
    gain francs 80
  else
    balbadiou "Here, your share. A few more like this and we'll all be rich."
    gain francs 40
  endif
  "The journey was called a success. For a while, everyone in town wanted to shake my hand."
  hide balbadiou
  scene helene_garden with dissolve
  play music helene_theme fadein 2
  "I spent the money on the life I had with Hélène. I bought the land behind the house and made a garden for her, with paths and a pond and trees that would take years to grow."
  show helene soft
  if helene_trust >= 2
    helene smile "You came back."
    herve "I told you I would."
    helene soft "You did."
    "She took my arm and we walked the new paths together, as if we had always walked them."
  elif helene_trust < 0
    helene neutral "It's a beautiful garden."
    "She said it politely, the way you thank a stranger."
  else
    helene soft "It's a strange thing, a garden. You plant it for a future you can't see yet."
  endif
  if has("handkerchief")
    helene soft "You kept it. The handkerchief. I thought you might lose it at the first border."
  endif
  "And yet. At night, when the house was quiet, my thoughts went back across the world, to a room in the hills and a cup set down in front of me."
  if fascination >= 2
    inner "Her eyes. I could still see them if I closed mine."
  endif
  hide helene
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
  jump chapter5


# ============================================================================
#  CHAPTER 5 — THE SECOND JOURNEY
# ============================================================================
label chapter5
  chapter "Chapter 5" "The Second Journey" seal 再
  scene balbadiou_office with fade
  play music town_theme fadein 2
  show balbadiou neutral
  balbadiou "The whole valley wants to buy eggs from us now. Everyone who lost their worms, everyone who heard what we did."
  balbadiou serious "One journey was a miracle. We need a second one."
  if route() == "devoted"
    balbadiou happy "You look well, Hervé. Married life agrees with you, when you let it."
  elif route() == "lost"
    balbadiou worried "You look like a man who hasn't slept since spring."
    inner "{shake}I hadn't.{/shake}"
  endif
  "He didn't ask if I wanted to go. He didn't need to."
  play music journey fadein 2
  cutscene journey_two
  scene road_winter with fade
  "The same trains. The same steppe. The same boat without lights."
  "It was easier the second time. That frightened me a little. It meant I was getting used to it."
  scene estate_day with fade
  play music japan fadein 2
  show harakei neutral
  harakei "You came back."
  harakei "Why?"
  menu
    - "For the eggs." tone=duty [business += 1]
        harakei neutral "Eggs. Yes. That is a good reason."
        "He said it as if he were agreeing with a child."
        set ch5_choice = "eggs"
    - "For business." tone=cold [business += 2]
        harakei "Business is a good reason. Business does not lie awake at night."
        "He poured tea for both of us. Only for both of us."
        set ch5_choice = "business"
    - "I wanted to return." tone=obsession [obsession += 2, danger += 1]
        harakei stern "..."
        "He looked at me for a long time."
        harakei stern "Men who want to return to a place usually want something in it."
        "He did not say anything else. He did not have to."
        set ch5_choice = "return"
    - hesitate [obsession += 1]
        "I didn't answer. I didn't know which answer was true."
        harakei neutral "A man who does not know why he travels should travel less, Monsieur Joncour."
        set ch5_choice = "silent"
  "Then we came to the price."
  minigame bargain into price
  if price == "good"
    harakei neutral "You bargain like a man who means to come back. Take this."
    "He slid a wooden tag across the mat, marked with his red seal."
    harakei "My men will let you through. Do not lose it."
    gain item pass
    gain francs 50
    set danger -= 1
  elif price == "fair"
    "We agreed on a price that insulted neither of us."
    gain francs 20
  elif price == "insult"
    harakei cold "In my country, a man who haggles like that is telling you something else."
    set danger += 2
  else
    "I paid too much. Balbadiou would have wept."
    lose francs 40
  endif
  "The eggs would be ready in a few days."
  "I did not see her that first day. I looked for her in every doorway."
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
  jump chapter6


# ============================================================================
#  CHAPTER 6 — THE GLOVE
# ============================================================================
label chapter6
  chapter "Chapter 6" "The Glove" seal 手袋
  scene aviary with fade
  "Behind Hara Kei's house there was an aviary: a great cage of wood and paper, taller than a house, full of birds from every corner of Asia."
  "Hundreds of wings, all moving, going nowhere."
  "I stood there longer than I should have. I thought about her. About how you can keep something beautiful by never letting it leave."
  scene estate_room with dissolve
  "On the way back, I passed the room where she had been sitting that first day. Her things were there — a shawl, a small lacquered box, nobody watching."
  "Before I knew I had decided anything, I had taken off one of my gloves and laid it among her belongings."
  cutscene the_glove
  cg the_glove with dissolve
  "A glove. A stupid, ordinary thing. A message with no words in it."
  menu time 10
    - "Leave it." tone=obsession [intimacy += 1, obsession += 1]
        cg hide with dissolve
        "I left it there and walked away without turning around."
        "That night, I couldn't sleep. I kept imagining her hand finding it."
        set glove = "left"
    - "Take it back." tone=quiet [danger -= 1, mystery += 1]
        cg hide with dissolve
        "I picked it up again. My heart was beating as if I had stolen something."
        "Some things you should not say, even without words."
        "But she was standing in the doorway. I don't know how long she had been there."
        show woman gaze
        "She had seen me put it down. She had seen me take it back."
        hide woman
        set glove = "taken"
    - "Leave something else." tone=tender cost=item:handkerchief [fascination += 1, intimacy += 1, mystery += 1]
        cg hide with dissolve
        "I took the glove back and left my handkerchief instead — white silk, with my initials sewn in the corner by Hélène."
        "Something that had touched my hands every day for years."
        "I only thought, much later, about whose needle had made those letters."
        set glove = "handkerchief"
    - hesitate [intimacy += 1]
        cg hide with dissolve
        "Footsteps in the corridor. I walked away without deciding, and without my glove."
        "That night I understood that I had decided after all."
        set glove = "left"
  jump chapter7


# ============================================================================
#  CHAPTER 7 — THE NOTE
# ============================================================================
label chapter7
  chapter "Chapter 7" "The Note" seal 文
  scene estate_day with fade
  play music her_theme fadein 3
  if glove == "left"
    "On the last morning, I found my glove on my travel chest. Neatly folded. Inside it, a tiny piece of paper."
  elif glove == "handkerchief"
    "On the last morning, my handkerchief was back among my things, folded into a perfect square. Inside it, a tiny piece of paper."
    gain item handkerchief
  else
    "On the last morning, as I packed, a tiny piece of paper fell out from between the pages of my notebook. I had not put it there."
  endif
  play sound paper
  "A few lines of Japanese, in black ink. I couldn't read a single character."
  gain item note
  set mystery += 1
  "I carried it back across the world, next to the eggs. I did not show it to anyone."
  scene blanche_salon with fade
  "In France there was only one person I knew who could read Japanese: Madame Blanche, who kept a fine house in the city and asked very few questions."
  show blanche neutral
  "She unfolded the paper. She read it once. Then she looked at me for a long time before she spoke."
  cutscene the_note
  blanche serious "Come back."
  herve "That's all?"
  blanche soft "That's enough."
  set obsession += 5
  play sound heartbeat
  effect pulse 1.4
  inner "{shake}Come back, or I will die.{/shake} That's what I heard, although she hadn't said it."
  if route() == "devoted"
    blanche soft "Whoever wrote this doesn't know there is someone waiting for you at home, Monsieur. Or perhaps she does."
  elif route() == "lost"
    blanche serious "Be careful, Monsieur Joncour. Some words are not written to be read. They are written to be followed."
  endif
  jump chapter8


# ============================================================================
#  CHAPTER 8 — HÉLÈNE
# ============================================================================
label chapter8
  chapter "Chapter 8" "Hélène" seal 庭
  scene helene_garden with fade
  play music helene_theme fadein 2
  cutscene garden
  "The eggs hatched again. The town celebrated again. I walked in the garden with Hélène in the evenings, and the trees were a little taller every time."
  show helene soft
  helene soft "You're quiet since you came back."
  helene "Quieter than the first time."
  if route() == "lost"
    helene sad "{speed=0.7}Sometimes I think you only come back so that you can leave again.{/speed}"
  elif route() == "devoted"
    helene smile "But you're here. I can tell the difference, you know. When you're here."
  endif
  if glove == "handkerchief"
    helene neutral "Your handkerchief smells of something. Incense, I think. Like a temple."
    "I said it must have been the ship. She folded it very small, and gave it back to me."
    set helene_trust -= 1
  elif not has("handkerchief")
    helene neutral "The handkerchief I gave you. I haven't seen it since you came back."
    herve "I must have lost it on the road."
    helene soft "{speed=0.6}On the road.{/speed}"
    "She didn't ask again. She didn't need to."
    set helene_trust -= 1
  endif
  "I was a hundred steps from her and a whole world away. She could tell. She could always tell."
  menu
    - "Stay with her — really stay." tone=tender [helene_trust += 2, obsession -= 1]
        "I took her hand, and I made myself be where I was."
        "The smell of the cut grass. The pond. The way she laughed when a frog jumped. The weight of her head on my shoulder."
        helene smile "There you are."
        helene soft "I missed you, you know. Even when you were here."
        set ch8_choice = "present"
    - "Give her the blossom you pressed in Japan." tone=warm cost=item:blossom [helene_trust += 2, obsession -= 1]
        "I took the journal from my coat and opened it at the page. The blossom had gone thin and pale, like paper."
        helene smile "Oh."
        helene soft "Where did it grow?"
        herve "On a wall, in the hills. I thought it looked like here."
        "She pressed it into her own book, the one she was always reading, and for the rest of her life I never once saw her lose that page."
        set ch8_choice = "present"
    - "Think about the woman." tone=obsession [obsession += 2, fascination += 1, helene_trust -= 1]
        "She was talking about the garden. I nodded in the right places."
        "I was thinking about a cup of tea. About a glove. About three words on a piece of paper."
        show helene sad
        helene sad "..."
        helene sad "Where do you go, Hervé? When you look like that?"
        herve "Nowhere."
        "She let me lie. That was the worst part."
        set ch8_choice = "absent"
    - "Tell Hélène about what happened." tone=honest [helene_trust += 1, mystery -= 1]
        "I don't know why I told her. Maybe because keeping it was heavier than the journey."
        "I told her about the woman beside Hara Kei. About her eyes. I told her about the note."
        "I did not tell her about the cup."
        show helene hurt
        helene hurt "..."
        "She was quiet for a long time. Then she asked only one thing."
        helene neutral "Who translated it for you?"
        herve "Madame Blanche."
        helene soft "I see."
        "She squeezed my hand, and let it go, and we walked home."
        set told_helene = true
        set ch8_choice = "told"
    - hesitate [helene_trust -= 1]
        "She waited for me to say something. I let the silence go on too long."
        helene sad "Never mind. Look, the roses have come back."
        "She talked about the roses. I let her."
        set ch8_choice = "absent"
  jump chapter9


# ============================================================================
#  CHAPTER 9 — THE THIRD JOURNEY
# ============================================================================
label chapter9
  chapter "Chapter 9" "The Third Journey" seal 雨
  play music journey fadein 2
  cutscene journey_three
  scene road_rain with fade
  "I went back to Japan a third time."
  if obsession >= 8
    "I told Balbadiou it was for the eggs. I told Hélène it was for the eggs. I stopped believing it somewhere in Russia."
  else
    "It was for the eggs. I told myself that every morning, like a prayer."
  endif
  "At the coast, soldiers had put a barrier across the road. The officer wanted to know my business, and then he wanted money."
  menu
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
  play music japan fadein 2
  cutscene warships
  "The country had changed. Foreign ships had come into the ports with their guns, and the old order was cracking. There were soldiers on the roads. People looked at me differently now — a white face had become a political problem."
  show harakei stern
  harakei stern "It is not a good time to be a foreigner here."
  if danger >= 2
    harakei stern "It is a worse time to be a foreigner who asks questions."
  endif
  if route() == "lost"
    harakei cold "You come back too often, Monsieur Joncour. Men notice. I notice."
  elif route() == "devoted"
    harakei neutral "You look like a man with a home. Keep it in your mind on these roads."
  endif
  "He sold me the eggs anyway. But he did not invite me to stay."
  hide harakei
  "I saw her once. Across a courtyard, for the length of a breath."
  if intimacy >= 3
    show woman soft
    "She stopped when she saw me. She pressed one hand flat against her own chest — just once, very lightly — and then she was gone."
    hide woman
  elif fascination >= 3
    show woman gaze
    "She looked at me the way she had the first day. Then someone called her name, a name I didn't catch, and she turned away."
    hide woman
  else
    "She didn't see me. Or she pretended not to. I will never know which."
  endif
  "I had crossed the world to look at a woman for one second. And the practical reason for all of it — the eggs, the trade, the town — suddenly felt like an excuse I had invented for myself."
  jump chapter10


# ============================================================================
#  CHAPTER 10 — WAR
# ============================================================================
label chapter10
  chapter "Chapter 10" "War" seal 戦
  play music war fadein 2
  cutscene war
  scene balbadiou_office with fade
  show balbadiou worried
  "The next year, the news from Japan was all bad. Civil war. Foreigners attacked. Ports closed. Nobody knew who was in charge."
  balbadiou worried "You can't go this time. Nobody can."
  balbadiou serious "China. The eggs aren't as good, but they're alive, and nobody will shoot you for buying them."
  balbadiou "Go to China, Hervé. Be sensible for once."
  menu
    - "Go to China." tone=duty [obsession -= 1]
        balbadiou happy "Thank God."
        jump china_trip
    - "Go to Japan anyway." tone=danger [obsession += 3, danger += 3]
        balbadiou worried "..."
        show balbadiou serious
        balbadiou serious "You'll get yourself killed. For what? For worms?"
        herve "For the town."
        balbadiou serious "Don't lie to me, Hervé. I've known you too long. Lie to Hélène if you have to. Not to me."
        "I didn't answer. He didn't wait for me to."
        hide balbadiou
    - hesitate [obsession += 1]
        "I didn't answer. Balbadiou took it for weakness, which it was."
        balbadiou serious "Then I'll decide for you. China. I'm booking your passage tonight."
        jump china_trip
  jump chapter11

label china_trip
  set went_china = true
  scene china_dock with fade
  play music journey fadein 3
  "I went to China. I bought eggs from traders who laughed at my French and cheated me politely."
  lose francs 40
  "The eggs were sickly. Half the boxes were dead before I reached the coast."
  "I stood on a dock looking at the sea, with a ticket home in my pocket."
  inner "{shake}Japan was only a few days away. A few days.{/shake}"
  effect pulse 1.2
  play sound paper
  "I tore up the ticket."
  "Being sensible had brought me halfway round the world. The rest of the way, I went by myself."
  jump chapter11


# ============================================================================
#  CHAPTER 11 — THE ABANDONED VILLAGE
# ============================================================================
label chapter11
  chapter "Chapter 11" "The Abandoned Village" seal 灰
  scene burned_village with fade
  stop music fadeout 3
  cutscene ashes
  "I reached the hills after weeks of hiding, bribing, waiting."
  "The village was gone."
  play sound wind_gust
  effect shake 0.6
  "Burned houses. Black beams against the sky. No birds. The great aviary was empty, its door hanging open."
  if danger >= 4
    "Twice I had to lie flat in a ditch while soldiers passed on the road. Once they came so close I could hear them breathing."
    "I kept thinking: if I die here, nobody at home will ever know where."
  endif
  "On the second night, lanterns came up the road. Soldiers, going from ruin to ruin."
  minigame hide into hide_result
  if hide_result == "caught"
    play sound heartbeat
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
          "I ran. A shot cracked past me into the dark, then another. I did not stop until the trees."
      - hesitate [danger += 2]
          "I froze. He struck me once, hard, and left me in the ashes. When I could stand again, my purse was lighter."
          lose francs 40
  else
    "I pressed myself into the shadow of a burned wall, and the lanterns passed."
  endif
  play music sorrow fadein 8
  "I searched for days. For Hara Kei. For her. For anyone."
  if went_china
    inner "In China I had been sensible. Here, in the ashes, sensible was a word from another language."
  endif
  "Then, on the fourth day, a boy found me and led me into the forest, without a word."
  jump chapter12


# ============================================================================
#  CHAPTER 12 — HARA KEI'S WARNING
# ============================================================================
label chapter12
  chapter "Chapter 12" "Hara Kei's Warning" seal 森
  scene forest_camp_night with fade
  play music japan fadein 3
  cutscene forest
  show harakei cold
  "Hara Kei was camped in the forest with what was left of his people. He did not seem surprised to see me."
  harakei cold "You should not have come."
  if route() == "lost"
    harakei cold "{shake}Every time you come, something burns.{/shake}"
    inner "It was not true. It was not entirely untrue."
  endif
  harakei cold "Leave. Tomorrow. There is nothing here for you anymore."
  menu
    - "Leave." tone=quiet [danger -= 2, obsession -= 1]
        herve "I'll go."
        harakei neutral "Good. You have a wife. Go home to her."
        "It was the only personal thing he ever said to me."
        set ch12_choice = "leave"
    - "Stay." tone=danger [danger += 2, obsession += 1]
        herve "I'm not leaving yet."
        harakei stern "Then you will stay alone. And when they find you, I will not know your name."
        "He meant it. I could see that he meant it, and that it cost him nothing."
        set ch12_choice = "stay"
    - "Ask about the woman." tone=obsession [danger += 1, obsession += 2, mystery += 1]
        herve "Where is she?"
        if asked_who
          harakei stern "You asked me once who she was. I told you it was not a question you should ask."
          harakei cold "That has not changed. Only now it is too late to ask."
        else
          harakei cold "Some doors, once they close, do not have another side."
        endif
        "That was his whole answer. I have turned it over for the rest of my life."
        set ch12_choice = "ask"
    - hesitate [obsession += 1]
        "I didn't answer. The fire cracked between us."
        harakei neutral "Silence. You were always better at looking than at speaking. Go home, Monsieur Joncour."
        set ch12_choice = "leave"
  "In the end, it didn't matter what I said. Everything I had come for was already gone."
  "Japan was finished with me."
  hide harakei
  "At dawn, the boy who had found me walked me to the edge of the forest. He had not said a word in four days."
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
  jump chapter13


# ============================================================================
#  CHAPTER 13 — THE LAST EGGS
# ============================================================================
label chapter13
  chapter "Chapter 13" "The Last Eggs" seal 卵
  play music journey fadein 2
  cutscene last_eggs
  scene road_winter with fade
  "I came home with eggs — bought at a terrible price from whoever would sell them in the chaos."
  gain item egg_box
  lose francs 60
  "They had travelled too far, too slowly, through too much."
  scene silk_mill_empty with fade
  play music sorrow fadein 3
  cutscene no_hatch
  "In spring, I held every card up to the window, one by one, looking for a single living egg."
  minigame eggs dead into last_eggs
  lose item egg_box
  "In spring, they didn't hatch."
  "Almost none of them. A handful of worms, sickly and slow, that died on the leaves within a week."
  show balbadiou worried
  if business >= 3
    "I stood in the mill with Balbadiou and did the arithmetic in my head again and again, as if the numbers might change."
    balbadiou worried "It's over, isn't it. The trade."
    herve "Not yet."
    "It was. I had been good at the business once. It had been the one honest part of my journeys."
  else
    balbadiou worried "It's over, Hervé. The trade. The town will find another way to live, or it won't."
    "I nodded. I was ashamed of how little I felt. The eggs had been an excuse for so long, I had forgotten they were ever the reason."
  endif
  if route() == "lost"
    balbadiou serious "You weren't even looking for eggs any more, were you. Not really."
    "I didn't answer. He was the only one who ever asked me straight out."
  endif
  hide balbadiou
  "The practical purpose of my journeys had collapsed."
  "What I felt for Japan had not. That was the part that frightened me."
  jump chapter14


# ============================================================================
#  CHAPTER 14 — THE FINAL LETTER
# ============================================================================
label chapter14
  chapter "Chapter 14" "The Final Letter" seal 手紙
  scene joncour_home with fade
  play music her_theme fadein 3
  play sound paper
  "It came in the autumn, months after I had stopped hoping for anything: a thick envelope, with Japanese stamps, seven sheets covered in black ink."
  gain item letter
  "I didn't open it at home. I took it to Madame Blanche."
  scene blanche_salon with fade
  show blanche neutral
  blanche "Sit down, Monsieur Joncour."
  blanche serious "It's long. And it's not the kind of letter one reads quickly."
  "She read it aloud, in French, slowly, without looking up."
  hide blanche
  cutscene final_letter
  cg the_letter with dissolve
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
  show blanche soft
  "Madame Blanche folded the pages and gave them back to me."
  blanche soft "Go home, Monsieur Joncour."
  "I did."
  menu
    - "Put the letter away, and go home to Hélène." tone=tender [helene_trust += 1]
        "I put the letter in a drawer, and for a long time I didn't open the drawer."
        set letter_fate = "kept"
    - "Read it again, every night." tone=obsession [obsession += 2]
        "I put the letter in a drawer. I opened the drawer every night, when Hélène was asleep."
        set letter_fate = "reread"
    - "Tear it up." tone=danger [obsession -= 1, mystery += 1]
        "I tore the seven sheets into strips. Then I found I could not throw them away. I put the pieces in a drawer."
        set letter_fate = "torn"
    - hesitate
        "I put the letter in a drawer, and did not decide anything about it for a long time."
        set letter_fate = "kept"
  jump chapter15


# ============================================================================
#  CHAPTER 15 — HÉLÈNE'S DEATH
# ============================================================================
label chapter15
  chapter "Chapter 15" "Hélène's Death" seal 別
  scene garden_winter with fade
  play music helene_theme fadein 3
  "I gave up the silk trade. There was almost nothing left of it to give up."
  "We lived quietly. The trees in the garden grew tall. I learned the names of the birds that came to the pond."
  "Then, one winter, Hélène fell ill."
  scene helene_sickroom with fade
  play music sorrow fadein 4
  filter faded
  show helene tired
  "She was ill for a long time, and then, very quickly, she was not going to get better."
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
  if helene_trust >= 3
    helene tired "Hervé. Did you find it? What you went looking for?"
    herve "I think I found it a long time ago. I just didn't know where I'd put it."
    helene soft "That's a very French answer."
    "She laughed, and it made her cough, and she held my hand until she fell asleep."
  elif helene_trust >= 1
    helene tired "Hervé. Did you find it? What you went looking for?"
    herve "I don't know."
    helene soft "That's all right. Neither did I, at first."
  else
    helene tired "You were always somewhere else, Hervé. I got used to talking to you there."
    "I wanted to tell her I was here. I had waited too long to say it, and now it wasn't true enough to say."
  endif
  cutscene candle
  "Hélène died at the beginning of September, on a morning with a clear sky."
  filter none
  hide helene with slow
  scene black with slow
  stop music fadeout 4
  centered "I buried her in the town cemetery.\nAfterwards, I didn't know what to do with my hands."
  jump final


# ============================================================================
#  FINAL CHAPTER — THE TRUTH
# ============================================================================
label final
  chapter "Final Chapter" "The Truth" seal 真
  scene blanche_salon with fade
  play music letter fadein 4
  "A few weeks after the funeral, Madame Blanche sent for me."
  "I brought the letter with me. I don't know why. I had carried it for weeks without knowing why."
  show blanche serious
  blanche serious "I made a promise, Monsieur Joncour. To keep a secret while she was alive. She is not alive anymore."
  herve "Who?"
  play sound heartbeat
  blanche soft "Your wife."
  "She told me everything. Hélène had come to her, years ago. With a letter she had written herself, in French. She had asked Madame Blanche to copy it into Japanese — and to read it back to me when I came."
  if told_helene
    inner "Who translated it for you? — she had asked me, in the garden. And I had told her."
  endif
  hide blanche
  if letter_fate == "torn"
    "I laid the torn strips out on Madame Blanche's table. My hands would not stop shaking."
  else
    "I laid the seven sheets out on Madame Blanche's table. They had fallen out of order in the drawer, the way paper does over the years."
  endif
  minigame letter
  cutscene truth
  cg the_letter with dissolve
  effect glitch 0.9
  filter sepia
  helene "You crossed the whole world to look at me. I know what that journey costs. I have {color=#c2476a}waited at a window{/color} for every mile of it."
  helene "Let me be a story someone told you once. Beautiful, and finished."
  helene soft "Look at whoever is beside you."
  filter none
  cg hide with slow
  set persistent.knows_truth = true
  show blanche soft
  blanche soft "She wanted so much to be her. That woman in Japan. She wanted it more than anything."
  "I sat there for a long time. The seven sheets were in front of me. They had been in a drawer in my own house for years, in her handwriting, and I had never once recognised it."
  menu time 16
    - "“Why didn't she tell me?”" tone=honest
        herve "Why didn't she tell me?"
        blanche serious "Because then it would have been a letter from your wife, Monsieur. And you would have read it like one."
        "She was right. That was the cruellest thing: she was right."
        set final_choice = "tell"
    - "“Why did she help me?”" tone=warm
        herve "Why did she help me? Why would she give me that?"
        blanche soft "She didn't give it to you. She gave you back to yourself, and hoped you would bring it home."
        "Madame Blanche looked at me with something that was almost pity, and almost envy."
        set final_choice = "help"
    - "Say nothing." tone=quiet
        "I said nothing. There was nothing I could say that Hélène had not already said better, in a language I couldn't read."
        blanche soft "..."
        "Madame Blanche didn't speak either. We sat together in the silence until the light changed."
        set final_choice = "silent"
    - hesitate
        "I meant to ask something. The question never came."
        blanche soft "..."
        "Madame Blanche didn't speak either. We sat together in the silence until the light changed."
        set final_choice = "silent"
  jump ending


# ============================================================================
#  ENDING — HOME
# ============================================================================
label ending
  scene cemetery with slow
  play music home fadein 4
  "I went back to Hélène's grave."
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
  "I had spent years searching for an impossible love at the other end of the world."
  "The person who had loved me most had been beside me all along."
  if final_choice == "silent"
    scene cemetery_grey with slow
    "I stood there a long time and said nothing, the way she had said nothing, for years, for my sake."
    "Some things are told best in silence. She taught me that. I learned it too late, and I learned it completely."
    cutscene end_silence
    ending home_silence "Home — Unsaid" neutral
  elif helene_trust >= 3
    "I told her about my day. About the birds at the pond. About the letter, which I had finally read the right way."
    helene soft "{i}Look at whoever is beside you.{/i}"
    play sound wind_gust volume 0.6
    "The wind moved through the trees she had watched me plant. For the first time in many years, I was exactly where I was."
    cutscene end_beside
    ending home_beside "Home — Beside Me All Along" true
  else
    scene cemetery_night with slow
    "I tried to speak to her, and found I had forgotten how. I had spent too many years talking to someone who wasn't there."
    "Some evenings I still look east. Now I know what I am looking for is behind me."
    cutscene end_distance
    ending home_distance "Home — The Far Shore" bad
  endif
`;
