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
titlefx autumn sun=0.28,0.45 rays=0.02,-0.35
# Backgrounds are pixel art; switch to "artstyle pixel" if the sprites are pixel art too,
# or "artstyle smooth" if everything is painted / high-resolution.
artstyle mixed
credits "Adapted from Silk by Alessandro Baricco"
titlemusic title
warning "SILK is a branching story adapted from Alessandro Baricco's novel.\n\nYour choices shape Hervé's relationships, his obsession and his memories — the great events of his life stay the same.\n\nThis is an early build: characters and backgrounds are placeholders until the art arrives."

# ---------------------------------------------------------------- characters
# Hervé is the player. His spoken lines use "herve"; his inner thoughts use "inner".
character herve     "Hervé"          color=#e9c46a blip=440
character inner     ""               color=#cbbef0 italic
character helene    "Hélène"         color=#f4a7b9 blip=620
character balbadiou "Balbadiou"      color=#9ccf9f blip=380
character harakei   "Hara Kei"       color=#e0503c blip=300
character woman     "???"            color=#f6ecdb blip=700
character blanche   "Madame Blanche" color=#b7c4ff blip=520

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
  scene black with none
  centered "EUROPE, 1861"


# ============================================================================
#  INTRO — THE SILK DISEASE
# ============================================================================
label intro
  chapter "Prologue" "The Silk Disease"
  scene silk_mill with fade
  play music town_theme fadein 3
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
  jump chapter1


# ============================================================================
#  CHAPTER 1 — THE JOURNEY
# ============================================================================
label chapter1
  chapter "Chapter 1" "The Journey"
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
    - "I'll be back before you know it." [helene_trust += 1]
        helene soft "You always say that."
        herve "And I always come back."
        helene sad "That's not what I meant."
        set ch1_choice = "promise"
    - "It's necessary for the business." [business += 1, helene_trust -= 1]
        helene hurt "Everything is always about the silk."
        herve "It's how we live."
        helene sad "I know."
        set ch1_choice = "business"
    - "Do you want me to stay?" [helene_trust += 2]
        helene neutral "No."
        herve "No?"
        helene soft "I want you to want to stay."
        set ch1_choice = "stay"

  scene joncour_home with fade
  tint dawn
  "The next morning, I left before the sun was over the hills."
  if ch1_choice == "stay"
    show helene soft
    "Hélène walked with me to the end of the garden. She didn't say anything. She held my hand until the gate, and then she let go of it very carefully, the way you set down something that might break."
    hide helene
  elif ch1_choice == "business"
    "Hélène didn't come down. I saw her shape at the upstairs window, and then I didn't."
  else
    show helene neutral
    helene "Write to me."
    herve "I will."
    "We both knew there would be nowhere to post a letter from where I was going."
    hide helene
  endif
  tint none
  scene road_east with slow
  play music journey fadein 3
  "I crossed France by train, then the Alps. Austria. Hungary. Then Russia, where the roads stopped being roads."
  "Weeks of steppe. Lake Baikal, which the people there call the sea. Rivers I crossed on rafts, and villages that had never seen a Frenchman and saw no reason to start."
  scene smuggler_boat with dissolve
  play ambience waves fadein 2
  "At the edge of the continent, a man who asked no questions and wanted a great deal of money put me on a smuggler's boat."
  "It sailed at night, with no lights, toward a country that did not want me."
  stop ambience fadeout 2
  jump chapter2


# ============================================================================
#  CHAPTER 2 — JAPAN
# ============================================================================
label chapter2
  chapter "Chapter 2" "Japan"
  scene japan_coast with fade
  play music japan fadein 3
  "I came ashore on the west coast, the unofficial way, where foreigners were not supposed to come ashore at all."
  "Men I never saw clearly led me inland for days, blindfolded for part of the way. Nobody explained anything. I learned very quickly not to ask."
  scene hara_kei_estate with fade
  "At last I was brought to a village in the hills, and to the house of the man who controlled everything there: Hara Kei."
  show harakei neutral at center
  "He sat perfectly still. He was younger than I had imagined, and he looked at me as if I were a piece of weather he was waiting to pass."
  harakei "You came for the eggs."
  herve "Yes."
  show harakei neutral at left
  show woman neutral at right
  "Beside him sat a young woman. Her eyes were not Asian — that was the first strange thing. The second was that she did not lower them."
  "She looked directly at me."
  inner "She was not beautiful in the way people usually mean beautiful. She simply looked at me."
  menu
    - "Look away." [danger -= 1]
        "I looked down at the mat between us."
        harakei "You are a respectful man."
        "When I raised my eyes again, she was still watching me."
        set ch2_choice = "away"
    - "Continue looking at her." [fascination += 2]
        "I didn't look away. Neither did she."
        "Hara Kei went on speaking about prices and seasons. I have no idea what he said."
        inner "I did not know her name. But I remembered her eyes."
        set ch2_choice = "look"
    - "Ask Hara Kei who she is." [danger += 2]
        herve "Who is she?"
        show harakei stern
        "Hara Kei turned his head, slowly, the way a door opens in an empty house."
        harakei stern "That is not a question you should ask."
        set asked_who = true
        set ch2_choice = "ask"
  jump chapter3


# ============================================================================
#  CHAPTER 3 — THE CUP
# ============================================================================
label chapter3
  chapter "Chapter 3" "The Cup"
  scene estate_tearoom with dissolve
  show harakei neutral at left
  show woman neutral at right
  "Later, tea was served. Hara Kei was talking, and for a moment no one was looking at anyone."
  "The young woman lifted a small teacup and drank from it."
  "Then she set it down in front of me."
  show woman gaze at right
  "She looked at me. Then at the cup. Then at me again."
  menu
    - "Drink it." [fascination += 2, intimacy += 1]
        cg the_cup with dissolve
        "I picked up the cup and drank. Our eyes met over its rim."
        cg hide with dissolve
        inner "I didn't know what she wanted. But I wanted to understand."
        set ch3_choice = "drink"
    - "Ignore it." [mystery += 2]
        "I looked at the cup. Then at her."
        herve "I don't understand."
        show woman neutral at right
        "She took the cup back without a word, and the moment closed over like water."
        set ch3_choice = "ignore"
    - "Drink from a different side." [fascination += 1, intimacy += 2]
        cg the_cup with dissolve
        "I noticed where her lips had touched the porcelain."
        "I turned the cup slightly, and drank from the other side."
        cg hide with dissolve
        show woman smile at right
        "She smiled."
        "It lasted less than a second. I would think about it for years."
        set ch3_choice = "turn"
  if ch3_choice != "ignore"
    "Hara Kei did not seem to notice. Or he noticed everything, and chose to say nothing. With him, it was the same thing."
  endif
  jump chapter4


# ============================================================================
#  CHAPTER 4 — THE FIRST RETURN
# ============================================================================
label chapter4
  chapter "Chapter 4" "The First Return"
  scene road_east with fade
  play music journey fadein 2
  "Hara Kei sold me the eggs: thousands of them, pressed onto sheets of paper and packed in wooden boxes lined with mulberry leaves."
  "I carried them back across the whole world, watching the weather, keeping them cool, counting the days."
  scene silk_mill with fade
  play music town_theme fadein 2
  show balbadiou happy
  "In spring, the eggs hatched. They were healthy. Every one of them."
  balbadiou happy "You did it. You did it, Hervé! The whole town will eat this year."
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
  "And yet. At night, when the house was quiet, my thoughts went back across the world, to a room in the hills and a cup set down in front of me."
  if fascination >= 2
    inner "Her eyes. I could still see them if I closed mine."
  endif
  hide helene
  "One evening I sat down with my journal to write about the journey."
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
  chapter "Chapter 5" "The Second Journey"
  scene balbadiou_office with fade
  play music town_theme fadein 2
  show balbadiou neutral
  balbadiou "The whole valley wants to buy eggs from us now. Everyone who lost their worms, everyone who heard what we did."
  balbadiou serious "One journey was a miracle. We need a second one."
  "He didn't ask if I wanted to go. He didn't need to."
  scene road_east with fade
  play music journey fadein 2
  "The same trains. The same steppe. The same boat without lights."
  "It was easier the second time. That frightened me a little. It meant I was getting used to it."
  scene hara_kei_estate with fade
  play music japan fadein 2
  show harakei neutral
  harakei "You came back."
  harakei "Why?"
  menu
    - "For the eggs." [business += 1]
        harakei neutral "Eggs. Yes. That is a good reason."
        "He said it as if he were agreeing with a child."
        set ch5_choice = "eggs"
    - "For business." [business += 2]
        harakei "Business is a good reason. Business does not lie awake at night."
        "He poured tea for both of us. Only for both of us."
        set ch5_choice = "business"
    - "I wanted to return." [obsession += 2, danger += 1]
        harakei stern "..."
        "He looked at me for a long time."
        harakei stern "Men who want to return to a place usually want something in it."
        "He did not say anything else. He did not have to."
        set ch5_choice = "return"
  "We agreed on the price. The eggs would be ready in a few days."
  "I did not see her that first day. I looked for her in every doorway."
  jump chapter6


# ============================================================================
#  CHAPTER 6 — THE GLOVE
# ============================================================================
label chapter6
  chapter "Chapter 6" "The Glove"
  scene aviary with fade
  play ambience birds fadein 2
  "Behind Hara Kei's house there was an aviary: a great cage of wood and paper, taller than a house, full of birds from every corner of Asia."
  "Hundreds of wings, all moving, going nowhere."
  "I stood there longer than I should have. I thought about her. About how you can keep something beautiful by never letting it leave."
  scene estate_tearoom with dissolve
  "On the way back, I passed the room where she had been sitting that first day. Her things were there — a shawl, a small lacquered box, nobody watching."
  "Before I knew I had decided anything, I had taken off one of my gloves and laid it among her belongings."
  cg the_glove with dissolve
  "A glove. A stupid, ordinary thing. A message with no words in it."
  menu
    - "Leave it." [intimacy += 1, obsession += 1]
        cg hide with dissolve
        "I left it there and walked away without turning around."
        "That night, I couldn't sleep. I kept imagining her hand finding it."
        set glove = "left"
    - "Take it back." [danger -= 1, mystery += 1]
        cg hide with dissolve
        "I picked it up again. My heart was beating as if I had stolen something."
        "Some things you should not say, even without words."
        "But she was standing in the doorway. I don't know how long she had been there."
        show woman gaze
        "She had seen me put it down. She had seen me take it back."
        hide woman
        set glove = "taken"
    - "Leave something else." [fascination += 1, intimacy += 1, mystery += 1]
        cg hide with dissolve
        "I took the glove back and left my handkerchief instead — white silk, with my initials sewn in the corner by Hélène."
        "Something that had touched my hands every day for years."
        "I only thought, much later, about whose needle had made those letters."
        set glove = "handkerchief"
  stop ambience fadeout 2
  jump chapter7


# ============================================================================
#  CHAPTER 7 — THE NOTE
# ============================================================================
label chapter7
  chapter "Chapter 7" "The Note"
  scene hara_kei_estate with fade
  play music her_theme fadein 3
  if glove == "left"
    "On the last morning, I found my glove on my travel chest. Neatly folded. Inside it, a tiny piece of paper."
  elif glove == "handkerchief"
    "On the last morning, my handkerchief was back among my things, folded into a perfect square. Inside it, a tiny piece of paper."
  else
    "On the last morning, as I packed, a tiny piece of paper fell out from between the pages of my notebook. I had not put it there."
  endif
  "A few lines of Japanese, in black ink. I couldn't read a single character."
  set mystery += 1
  "I carried it back across the world, next to the eggs. I did not show it to anyone."
  scene blanche_salon with fade
  "In France there was only one person I knew who could read Japanese: Madame Blanche, who kept a fine house in the city and asked very few questions."
  show blanche neutral
  "She unfolded the paper. She read it once. Then she looked at me for a long time before she spoke."
  blanche serious "Come back."
  herve "That's all?"
  blanche soft "That's enough."
  set obsession += 5
  effect pulse 1.4
  inner "Come back, or I will die. That's what I heard, although she hadn't said it."
  jump chapter8


# ============================================================================
#  CHAPTER 8 — HÉLÈNE
# ============================================================================
label chapter8
  chapter "Chapter 8" "Hélène"
  scene helene_garden with fade
  play music helene_theme fadein 2
  "The eggs hatched again. The town celebrated again. I walked in the garden with Hélène in the evenings, and the trees were a little taller every time."
  show helene soft
  helene soft "You're quiet since you came back."
  helene "Quieter than the first time."
  "I was a hundred steps from her and a whole world away. She could tell. She could always tell."
  menu
    - "Stay with her — really stay." [helene_trust += 2, obsession -= 1]
        "I took her hand, and I made myself be where I was."
        "The smell of the cut grass. The pond. The way she laughed when a frog jumped. The weight of her head on my shoulder."
        helene smile "There you are."
        helene soft "I missed you, you know. Even when you were here."
        set ch8_choice = "present"
    - "Think about the woman." [obsession += 2, fascination += 1, helene_trust -= 1]
        "She was talking about the garden. I nodded in the right places."
        "I was thinking about a cup of tea. About a glove. About three words on a piece of paper."
        show helene sad
        helene sad "..."
        helene sad "Where do you go, Hervé? When you look like that?"
        herve "Nowhere."
        "She let me lie. That was the worst part."
        set ch8_choice = "absent"
    - "Tell Hélène about what happened." [helene_trust += 1, mystery -= 1]
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
  jump chapter9


# ============================================================================
#  CHAPTER 9 — THE THIRD JOURNEY
# ============================================================================
label chapter9
  chapter "Chapter 9" "The Third Journey"
  scene road_east with fade
  play music journey fadein 2
  "I went back to Japan a third time."
  if obsession >= 8
    "I told Balbadiou it was for the eggs. I told Hélène it was for the eggs. I stopped believing it somewhere in Russia."
  else
    "It was for the eggs. I told myself that every morning, like a prayer."
  endif
  scene hara_kei_estate with fade
  play music japan fadein 2
  "The country had changed. Foreign ships had come into the ports with their guns, and the old order was cracking. There were soldiers on the roads. People looked at me differently now — a white face had become a political problem."
  show harakei stern
  harakei stern "It is not a good time to be a foreigner here."
  if danger >= 2
    harakei stern "It is a worse time to be a foreigner who asks questions."
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
  chapter "Chapter 10" "War"
  scene balbadiou_office with fade
  play music war fadein 2
  show balbadiou worried
  "The next year, the news from Japan was all bad. Civil war. Foreigners attacked. Ports closed. Nobody knew who was in charge."
  balbadiou worried "You can't go this time. Nobody can."
  balbadiou serious "China. The eggs aren't as good, but they're alive, and nobody will shoot you for buying them."
  balbadiou "Go to China, Hervé. Be sensible for once."
  menu
    - "Go to China." [obsession -= 1]
        set went_china = true
        balbadiou happy "Thank God."
        scene smuggler_boat with fade
        "I went to China. I bought eggs from traders who laughed at my French and cheated me politely."
        "The eggs were sickly. Half the boxes were dead before I reached the coast."
        "I stood on a dock looking at the sea, with a ticket home in my pocket."
        inner "Japan was only a few days away. A few days."
        effect pulse 1.2
        "I tore up the ticket."
        "Being sensible had brought me halfway round the world. The rest of the way, I went by myself."
    - "Go to Japan anyway." [obsession += 3, danger += 3]
        balbadiou worried "..."
        show balbadiou serious
        balbadiou serious "You'll get yourself killed. For what? For worms?"
        herve "For the town."
        balbadiou serious "Don't lie to me, Hervé. I've known you too long. Lie to Hélène if you have to. Not to me."
        "I didn't answer. He didn't wait for me to."
        hide balbadiou
  jump chapter11


# ============================================================================
#  CHAPTER 11 — THE ABANDONED VILLAGE
# ============================================================================
label chapter11
  chapter "Chapter 11" "The Abandoned Village"
  scene burned_village with fade
  tint red
  play ambience wind fadein 3
  stop music fadeout 3
  "I reached the hills after weeks of hiding, bribing, waiting."
  "The village was gone."
  effect shake 0.6
  "Burned houses. Black beams against the sky. No birds. The great aviary was empty, its door hanging open."
  if danger >= 4
    "Twice I had to lie flat in a ditch while soldiers passed on the road. Once they came so close I could hear them breathing."
    "I kept thinking: if I die here, nobody at home will ever know where."
  endif
  "I searched for days. For Hara Kei. For her. For anyone."
  if went_china
    inner "In China I had been sensible. Here, in the ashes, sensible was a word from another language."
  endif
  "Then, on the fourth day, a boy found me and led me into the forest, without a word."
  tint none
  stop ambience fadeout 2
  jump chapter12


# ============================================================================
#  CHAPTER 12 — HARA KEI'S WARNING
# ============================================================================
label chapter12
  chapter "Chapter 12" "Hara Kei's Warning"
  scene forest_camp_night with fade
  play music japan fadein 3
  show harakei cold
  "Hara Kei was camped in the forest with what was left of his people. He did not seem surprised to see me."
  harakei cold "You should not have come."
  harakei cold "Leave. Tomorrow. There is nothing here for you anymore."
  menu
    - "Leave." [danger -= 2, obsession -= 1]
        herve "I'll go."
        harakei neutral "Good. You have a wife. Go home to her."
        "It was the only personal thing he ever said to me."
        set ch12_choice = "leave"
    - "Stay." [danger += 2, obsession += 1]
        herve "I'm not leaving yet."
        harakei stern "Then you will stay alone. And when they find you, I will not know your name."
        "He meant it. I could see that he meant it, and that it cost him nothing."
        set ch12_choice = "stay"
    - "Ask about the woman." [danger += 1, obsession += 2, mystery += 1]
        herve "Where is she?"
        if asked_who
          harakei stern "You asked me once who she was. I told you it was not a question you should ask."
          harakei cold "That has not changed. Only now it is too late to ask."
        else
          harakei cold "Some doors, once they close, do not have another side."
        endif
        "That was his whole answer. I have turned it over for the rest of my life."
        set ch12_choice = "ask"
  "In the end, it didn't matter what I said. Everything I had come for was already gone."
  "Japan was finished with me."
  jump chapter13


# ============================================================================
#  CHAPTER 13 — THE LAST EGGS
# ============================================================================
label chapter13
  chapter "Chapter 13" "The Last Eggs"
  scene road_east with fade
  play music journey fadein 2
  "I came home with eggs — bought at a terrible price from whoever would sell them in the chaos."
  "They had travelled too far, too slowly, through too much."
  scene silk_mill_empty with fade
  play music town_theme fadein 2
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
  hide balbadiou
  "The practical purpose of my journeys had collapsed."
  "What I felt for Japan had not. That was the part that frightened me."
  jump chapter14


# ============================================================================
#  CHAPTER 14 — THE FINAL LETTER
# ============================================================================
label chapter14
  chapter "Chapter 14" "The Final Letter"
  scene joncour_home with fade
  play music her_theme fadein 3
  "It came in the autumn, months after I had stopped hoping for anything: a thick envelope, with Japanese stamps, seven sheets covered in black ink."
  "I didn't open it at home. I took it to Madame Blanche."
  scene blanche_salon with fade
  show blanche neutral
  blanche "Sit down, Monsieur Joncour."
  blanche serious "It's long. And it's not the kind of letter one reads quickly."
  "She read it aloud, in French, slowly, without looking up."
  hide blanche
  cg the_letter with dissolve
  window show
  if persistent.knows_truth
    woman "You crossed the whole world to look at me. I know what that journey costs. I have {color=#f4a7b9}waited at a window{/color} for every mile of it."
    woman "I will not ask you to come back. I ask you instead to stay where you are, in your house, in your {color=#f4a7b9}garden that will grow long after both of us{/color}."
    woman "Let me be a story someone told you once. Beautiful, and finished."
    woman "And if some evening you feel {color=#f4a7b9}a hand on your arm on the garden path{/color}, don't look for me in it. Look at whoever is beside you."
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
  "I did. I put the letter in a drawer, and for a long time I didn't open the drawer."
  jump chapter15


# ============================================================================
#  CHAPTER 15 — HÉLÈNE'S DEATH
# ============================================================================
label chapter15
  chapter "Chapter 15" "Hélène's Death"
  scene helene_garden with fade
  play music helene_theme fadein 3
  "I gave up the silk trade. There was almost nothing left of it to give up."
  "We lived quietly. The trees in the garden grew tall. I learned the names of the birds that came to the pond."
  "Then, one winter, Hélène fell ill."
  scene helene_sickroom with fade
  filter faded
  show helene tired
  "She was ill for a long time, and then, very quickly, she was not going to get better."
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
  chapter "Final Chapter" "The Truth"
  scene blanche_salon with fade
  play music letter fadein 4
  "A few weeks after the funeral, Madame Blanche sent for me."
  show blanche serious
  blanche serious "I made a promise, Monsieur Joncour. To keep a secret while she was alive. She is not alive anymore."
  herve "Who?"
  blanche soft "Your wife."
  "She told me everything. Hélène had come to her, years ago. With a letter she had written herself, in French. She had asked Madame Blanche to copy it into Japanese — and to read it back to me when I came."
  if told_helene
    inner "Who translated it for you? — she had asked me, in the garden. And I had told her."
  endif
  hide blanche
  cg the_letter with dissolve
  effect glitch 0.9
  filter sepia
  helene "You crossed the whole world to look at me. I know what that journey costs. I have {color=#f4a7b9}waited at a window{/color} for every mile of it."
  helene "Let me be a story someone told you once. Beautiful, and finished."
  helene soft "Look at whoever is beside you."
  filter none
  cg hide with slow
  set persistent.knows_truth = true
  show blanche soft
  blanche soft "She wanted so much to be her. That woman in Japan. She wanted it more than anything."
  "I sat there for a long time. The seven sheets were in my pocket. They had been in a drawer in my own house for years, in her handwriting, and I had never once recognised it."
  menu
    - "“Why didn't she tell me?”"
        herve "Why didn't she tell me?"
        blanche serious "Because then it would have been a letter from your wife, Monsieur. And you would have read it like one."
        "She was right. That was the cruellest thing: she was right."
        set final_choice = "tell"
    - "“Why did she help me?”"
        herve "Why did she help me? Why would she give me that?"
        blanche soft "She didn't give it to you. She gave you back to yourself, and hoped you would bring it home."
        "Madame Blanche looked at me with something that was almost pity, and almost envy."
        set final_choice = "help"
    - "Say nothing."
        "I said nothing. There was nothing I could say that Hélène had not already said better, in a language I couldn't read."
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
  "I had spent years searching for an impossible love at the other end of the world."
  "The person who had loved me most had been beside me all along."
  if final_choice == "silent"
    "I stood there a long time and said nothing, the way she had said nothing, for years, for my sake."
    "Some things are told best in silence. She taught me that. I learned it too late, and I learned it completely."
    ending home_silence "Home — Unsaid" neutral
  elif helene_trust >= 3
    "I told her about my day. About the birds at the pond. About the letter, which I had finally read the right way."
    helene soft "{i}Look at whoever is beside you.{/i}"
    "The wind moved through the trees she had watched me plant. For the first time in many years, I was exactly where I was."
    ending home_beside "Home — Beside Me All Along" true
  else
    "I tried to speak to her, and found I had forgotten how. I had spent too many years talking to someone who wasn't there."
    "Some evenings I still look east. Now I know what I am looking for is behind me."
    ending home_distance "Home — The Far Shore" bad
  endif
`;
