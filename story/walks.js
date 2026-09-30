/*
 * ============================================================================
 *  SILK — walking areas
 * ============================================================================
 *
 *  The story script starts one with a line like:   walk camp
 *
 *  Each area walks Hervé through a long painted place (painted by tools/paint-walks.js).
 *  Along the way there are things, at x (pixels from the left of the painting):
 *
 *    coin    francs lying about:           { x, kind: 'coin', amount, label, lines }
 *    item    a keepsake to pick up:        { x, kind: 'item', item, label, lines }
 *    look    something to look at:         { x, kind: 'look', label, lines }
 *    talk    someone to talk to:           { x, kind: 'talk', look, label, lines }
 *    goal    where the walk ends:          { x, kind: 'goal', label, verb, lines }
 *
 *  lines are Hervé's thoughts ("...") or someone speaking (["Name", "..."] or ["helene", "..."]
 *  for a character of the story, who then murmurs in their own voice). look draws a person:
 *  soldier, drummer, baldabiou, villager, merchant, guard, servant, boy, patrol.
 *  set: { variable: value } changes a story variable when the thing is used.
 *
 *  Some walks have action too:
 *    cover:    [{ x0, x1, kind }]  places to crouch behind (↓): wall, rubble, sandbags, cart
 *    patrols:  [{ x0, x1, speed, reach, start, dir }]  soldiers with lanterns; if their light finds
 *              Hervé standing (or they hear him running), a meter fills, and at the top he is caught
 *    chase:    { speed, from, to, spacing, gap, kinds }  on horseback, riders behind: jump (↑) logs
 *              and rocks, duck (↓) branches; every stumble lets them close in
 *    shelling: { rate, first, until, set }  shells whistle in and burst; crouch behind cover or be
 *              knocked down (`set` counts the times Hervé was hit in a story variable)
 *    caughtLines / escapedLines: what is said when he is caught, or gets away
 *  The walk then ends as "caught" or "escaped" instead of "arrived" (see `walk ... into`).
 *
 *  And some are simply alive (none of this stops Hervé):
 *    crowd:    [{ x, near, people: [{ dx, y, look, face, pose, turn }], lines: [[who, '...'], ...] }]
 *              people standing about (pose 'sit' to sit; y to stand up on a tower; turn to look
 *              about); when Hervé comes within `near`, they talk in bubbles, one line at a time
 *    marchers: [{ x0, x1, n, gap, speed, look, pause }]  men marching up and down, in step
 *    drill:    { x, n, gap, face, officer, calls: [{ text, pose: 'present' }], period }  a rank
 *              at drill, an officer (at x + officer) calling the orders
 *    flags:    [{ x, y, w, h, fringe }]  flags of France waving (paint the pole)
 *    fires:    [{ x, y }]   smoke: [{ x, y, rate }]   flames and rising smoke
 *    airships: [{ kind: 'ship', x, y, s, speed, depth }, { kind: 'balloon', x, y, s, depth, tether }]
 *  Looks for the French army: soldier, rifleman (a rifle on the shoulder), officer, gunner, zouave.
 * ============================================================================
 */
window.VN_WALKS = {
  // ---------------------------------------------------------------- Chapter 1: the army camp at dawn
  camp: {
    title: 'The Army Camp', region: 'The south of France · 1861',
    hero: 'soldier', start: 60, weather: 'motes', accent: '255,200,190',
    water: ['rgba(200,140,170,0.5)', 'rgba(50,34,64,0.9)'],
    hint: 'Walk to the edge of camp →',
    // the camp's morning: nothing here stops Hervé, it is only there to be seen
    airships: [
      { kind: 'ship', x: 380, y: 52, s: 1, speed: 5, depth: 0.04 },
      { kind: 'ship', x: 120, y: 30, s: 0.55, speed: 3, depth: 0.03 },
      { kind: 'balloon', x: 250, y: 96, s: 0.8, depth: 0.12, tether: 170 },
      { kind: 'balloon', x: 560, y: 82, s: 0.6, depth: 0.12, tether: 168, colors: ['#f2e6dc', '#2e4a9a'] },
    ],
    flags: [
      { x: 142, y: 113, w: 28, h: 14 },
      { x: 753, y: 59, w: 20, h: 11 },
      { x: 648, y: 135, w: 16, h: 10, fringe: true },
      { x: 860, y: 135, w: 16, h: 10, fringe: true },
    ],
    fires: [{ x: 752, y: 203 }],
    smoke: [{ x: 752, y: 192, rate: 1.6 }, { x: 676, y: 124, rate: 0.8 }, { x: 829, y: 124, rate: 0.8 }],
    crowd: [
      { x: 94, near: 120, people: [{ dx: 0, y: 156, look: 'rifleman', turn: true }], lines: [[0, 'All quiet on the south road, Corporal!'], [0, 'Nothing moves out there but the mist.']] },
      { x: 292, people: [{ dx: -8, look: 'soldier', face: 1 }, { dx: 8, look: 'soldier', face: -1 }], lines: [[0, 'Pay\'s late again.'], [1, 'It\'s always late. That\'s how you know it\'s the army.'], [0, 'When I\'m discharged, I\'m opening a café in Marseille.'], [1, 'Last week it was Toulon.'], [0, 'Toulon, Marseille. Somewhere with the sea.']] },
      { x: 492, people: [{ dx: -7, look: 'rifleman', face: 1 }, { dx: 8, look: 'soldier', face: -1, pose: 'sit' }], lines: [[0, 'Polish your buttons, Lefèvre. The colonel counts them.'], [1, 'Then the colonel can count mine himself.'], [1, 'My mother writes that the silkworms are sick again at home.'], [0, 'Tell her the army eats bread, not silk.']] },
      { x: 752, near: 170, people: [{ dx: -20, look: 'soldier', face: 1, pose: 'sit' }, { dx: 20, look: 'zouave', face: -1, pose: 'sit' }, { dx: -30, look: 'gunner', face: 1 }], lines: [[0, 'Did you see the airship over the citadel?'], [1, 'Giffard\'s contraption? It flies like a fat pigeon.'], [2, 'A pigeon that can see all the way to Prussia.'], [1, 'Then tell it to look at my mother\'s farm. Tell her I\'m eating.'], [0, 'The Emperor reviewed the Guard in Paris this spring.'], [2, 'And we got soup.']] },
      { x: 1052, people: [{ dx: -12, look: 'gunner', face: 1 }, { dx: 12, look: 'gunner', face: -1 }], lines: [[0, 'New rifled barrels. The La Hitte pattern.'], [1, 'Four thousand yards, the colonel says.'], [0, 'The colonel says a great many things.'], [1, 'He says them very loudly, too.']] },
      { x: 1182, near: 120, people: [{ dx: 0, y: 156, look: 'rifleman', turn: true }], lines: [[0, 'Rider on the north road!'], [0, 'Coming fast. A big man, on a tired horse.']] },
    ],
    drill: { x: 944, n: 5, gap: 9, face: 1, officer: 58, near: 170, period: 4.2, calls: [{ text: 'Present — arms!', pose: 'present' }, { text: 'Steady, the Seventh. Steady.', pose: 'present' }, { text: 'Shoulder — arms!' }, { text: 'Eyes — front!' }] },
    marchers: [
      { x0: 470, x1: 640, n: 2, gap: 9, speed: 18, look: 'rifleman', pause: 1.6 },
      { x0: 330, x1: 460, n: 3, gap: 9, speed: 16, look: 'rifleman', pause: 2, start: 400, dir: -1 },
    ],
    things: [
      { x: 140, kind: 'look', label: 'The flag', lines: ['The tricolour, stiff with dew. We saluted it every morning, and I never once asked myself why.'] },
      { x: 232, kind: 'look', label: 'Your rifle', lines: ['My rifle, stacked with the others. I had cleaned it every day for two years and never fired it at anyone.'] },
      { x: 330, kind: 'coin', amount: 10, label: 'Your pay', lines: ['My pay for the month, in a twist of paper. Ten francs.'] },
      { x: 420, kind: 'talk', look: 'drummer', label: 'The drummer boy', lines: [['Drummer', 'Drill\'s done, Joncour. You look like a man waiting for something.'], 'I was. I just didn\'t know what yet.'] },
      { x: 540, kind: 'talk', look: 'soldier', label: 'The sergeant', lines: [['Sergeant', 'Someone rode in from Lavilledieu asking for you. Big man. Bigger hat.'], ['Sergeant', 'Friend of yours, or trouble?'], 'Both, probably.'] },
      { x: 660, kind: 'coin', amount: 5, label: 'Dropped coins', lines: ['Somebody\'s winnings from last night\'s cards, trodden into the mud.'] },
      { x: 880, kind: 'look', label: 'Supply crates', lines: ['Biscuit and powder. Everything in the army comes in a box, including the men.'] },
      { x: 1110, kind: 'talk', look: 'soldier', label: 'A sentry', lines: [['Sentry', 'Rider on the north road, Joncour. Says he\'s here for you.']] },
      { x: 1372, kind: 'look', label: 'The signpost', lines: ['LAVILLEDIEU — 3 DAYS. I read it every morning. It never got any shorter.'] },
      { x: 1405, kind: 'goal', look: 'baldabiou', ride: true, facing: -1, label: 'The rider', verb: 'Meet', lines: ['A rider was coming up the road at a gallop. I knew the hat before I knew the face.'] },
    ],
  },

  // ---------------------------------------------------------------- Chapter 2: riding east across Russia
  steppe: {
    title: 'The Steppe', region: 'Across Europe and Russia',
    hero: 'traveller', ride: true, start: 40, weather: 'motes', accent: '255,200,140',
    water: ['rgba(150,90,110,0.5)', 'rgba(30,18,40,0.9)'],
    hint: 'Ride east, to the edge of the continent →',
    things: [
      { x: 300, kind: 'talk', look: 'villager', label: 'A shepherd', lines: [['Shepherd', 'A Frenchman? Here? Nobody has ever come from that far west.'], ['Shepherd', 'Where are you going?'], ['herve', 'Japan.'], ['Shepherd', '...Then you are not coming back this way soon.']] },
      { x: 560, kind: 'coin', amount: 15, label: 'A lost purse', lines: ['A purse in the grass, lost by some trader. Fifteen francs, in coins from four countries.'] },
      { x: 677, kind: 'look', label: 'The village church', sound: 'bell', lines: ['An onion dome, green as a beetle. Someone was ringing the evening bell for no one I could see.'] },
      { x: 842, kind: 'talk', look: 'merchant', label: 'A tea merchant', lines: [['Tea merchant', 'East? Take my advice: never pay the boatman at the start. Pay him at the end, if you live.'], 'I would remember that, later, on the boat.'] },
      { x: 1241, kind: 'look', label: 'A roadside shrine', lines: ['A little shrine at a crossroads, a candle still burning inside. I did not know the saint. I asked him for good weather anyway.'] },
      { x: 1700, kind: 'look', label: 'Lake Baikal', lines: ['Lake Baikal. The people here call it the sea. For a whole day I rode beside it and never saw the other side.'] },
      { x: 1980, kind: 'coin', amount: 10, label: 'Silver in the sand', lines: ['Ten francs of silver in the sand, where a caravan had camped.'] },
      { x: 2330, kind: 'goal', label: 'The smuggler\'s boat', verb: 'Board', lines: ['At the edge of the continent: a boat with no lights, and a man who asked no questions.'] },
    ],
  },

  // ---------------------------------------------------------------- Chapter 3: into Hara Kei's village, at night
  village: {
    title: 'Hara Kei\'s Village', region: 'The hills of Japan',
    hero: 'traveller', start: 40, weather: 'fireflies', accent: '255,200,120',
    water: ['rgba(40,60,110,0.55)', 'rgba(6,10,26,0.92)'],
    hint: 'Follow the lanterns to Hara Kei\'s house →',
    things: [
      { x: 120, kind: 'look', label: 'The torii', lines: ['A red gate at the edge of the village. The men who led me here bowed as they passed under it. I did too, a moment too late.'] },
      { x: 300, kind: 'talk', look: 'servant', label: 'A servant', lines: [['A servant', '...'], 'She bowed, said something I could not understand, and pointed up the road with her whole arm.'] },
      { x: 482, kind: 'look', label: 'A stone lantern', lines: ['A stone lantern, its flame steady in the still air. Every house had one. The whole village glowed like a string of beads.'] },
      { x: 640, kind: 'coin', amount: 5, label: 'A square-holed coin', lines: ['A coin with a square hole, dropped in the dust. I kept it for luck.'] },
      { x: 800, kind: 'talk', look: 'guard', label: 'Hara Kei\'s guard', lines: [['A guard', '...'], 'He looked at me the way you look at the weather. Then he stepped aside.'] },
      { x: 1000, kind: 'talk', look: 'boy', label: 'A child', lines: ['A child stared at me from a doorway, then ran inside shouting. By the time I passed the next house, the whole village knew.'] },
      { x: 1250, kind: 'goal', label: 'Hara Kei\'s house', verb: 'Enter', lines: ['The largest house in the village, lit from inside like a lantern. Someone was waiting for me there.'] },
    ],
  },

  // ---------------------------------------------------------------- Chapter 7: the aviary, by day
  aviary: {
    title: 'The Aviary', region: 'Behind Hara Kei\'s house',
    hero: 'traveller', start: 60, weather: 'petals', weatherCount: 50, accent: '255,210,220',
    water: ['rgba(120,150,200,0.5)', 'rgba(30,40,70,0.88)'],
    hint: 'Walk through the aviary to her room →',
    things: [
      { x: 270, kind: 'look', label: 'The aviary', sound: 'chime', lines: ['Hundreds of birds, every colour Asia owns, flying from one side of the cage to the other and back.', 'Hundreds of wings, all moving, going nowhere.'] },
      { x: 420, kind: 'look', label: 'A white bird', lines: ['One white bird sat still in the middle of it all, not singing, watching me.'] },
      { x: 560, kind: 'item', item: 'feather', label: 'A white feather', lines: ['A white feather had drifted through the bars. I put it in my journal, next to the blossom, and did not ask myself why.'] },
      { x: 740, kind: 'look', label: 'The koi pond', lines: ['Koi as long as my arm, orange and white, turning under the little bridge without a sound.'] },
      { x: 885, kind: 'goal', label: 'Her room', verb: 'Go in', lines: ['The room where she had been sitting that first day. Her things were there, and nobody was watching.'] },
    ],
  },

  // ---------------------------------------------------------------- Chapter 12: the burned village
  ruins: {
    title: 'The Burned Village', region: 'The hills of Japan',
    hero: 'traveller', start: 40, weather: 'ash', weatherCount: 90, accent: '255,140,90',
    water: ['rgba(120,50,30,0.5)', 'rgba(20,6,4,0.92)'],
    hint: 'Search the ruins → · hold ↓ behind cover when a lantern comes',
    // soldiers on patrol: each walks its stretch of road with a lantern, stops, looks back
    patrols: [
      { x0: 420, x1: 700, speed: 15, reach: 90, start: 640, dir: -1 },
      { x0: 960, x1: 1250, speed: 17, reach: 96, start: 1000, dir: 1 },
    ],
    cover: [
      { x0: 318, x1: 350, kind: 'rubble' }, { x0: 480, x1: 516, kind: 'wall' }, { x0: 612, x1: 648, kind: 'cart' },
      { x0: 930, x1: 962, kind: 'rubble' }, { x0: 1086, x1: 1122, kind: 'wall' }, { x0: 1200, x1: 1236, kind: 'rubble' },
    ],
    caughtLines: [['A soldier', 'Who is there?'], 'A lantern swung my way. I ran, and threw myself down behind the last wall with my heart in my throat.'],
    things: [
      { x: 190, kind: 'look', label: 'A burned house', lines: ['The house I had slept in, the first time. I knew it by the shape of its door, which was all that was left.'] },
      { x: 365, kind: 'coin', amount: 10, label: 'Coins in the ash', lines: ['Coins melted together in the ash. Someone had hidden their savings under the floor.'] },
      { x: 555, kind: 'look', label: 'A doll', lines: ['A child\'s doll, half burned, sitting upright in the ash as if someone had put it there on purpose.'] },
      { x: 780, kind: 'look', label: 'The empty aviary', lines: ['The aviary. The paper walls were gone and its door hung open. There were no birds anywhere, not even dead ones. They had all flown.'] },
      { x: 860, kind: 'item', item: 'hairpin', label: 'A hairpin', set: { found_hairpin: true }, lines: ['A lacquered hairpin in the ashes, red and gold. I had seen it before, in her hair.'] },
      { x: 1345, kind: 'goal', label: 'The last wall', verb: 'Hide', lines: ['The last wall still standing. I pressed myself into its shadow and held my breath.'] },
    ],
  },

  // ---------------------------------------------------------------- Chapter 6: bandits on the steppe
  chase: {
    scene: 'steppe',
    title: 'Riders on the Steppe', region: 'The second journey',
    hero: 'traveller', ride: true, start: 40, weather: 'motes', accent: '255,160,120',
    water: ['rgba(150,90,110,0.5)', 'rgba(30,18,40,0.9)'],
    hint: 'Outride them! ↑ to jump the logs and rocks, ↓ to duck the branches',
    chase: { speed: 108, from: 320, to: 2180, spacing: [150, 220], gap: 110, kinds: ['log', 'rock', 'branch'] },
    caughtLines: [['A rider', 'Your purse, Frenchman. Slowly.'], 'They caught my bridle and took the money meant for the eggs. Then, laughing, they let me go.'],
    escapedLines: ['Somewhere behind me the hoofbeats thinned, and then there was only the wind over the grass.'],
    things: [],
  },

  // ---------------------------------------------------------------- Chapter 12: the road from the coast, through the war
  crossing: {
    title: 'The Road from the Coast', region: 'Japan at war',
    hero: 'traveller', start: 30, weather: 'embers', weatherCount: 60, accent: '255,140,90',
    water: ['rgba(120,40,30,0.5)', 'rgba(20,6,6,0.92)'],
    hint: 'Get through to the hills → · when a shell whistles, crouch (↓) behind cover',
    shelling: { rate: 1.1, first: 2.6, until: 1330, set: 'wounded' },
    cover: [
      { x0: 150, x1: 186, kind: 'sandbags' }, { x0: 300, x1: 336, kind: 'wall' }, { x0: 452, x1: 490, kind: 'cart' },
      { x0: 610, x1: 646, kind: 'sandbags' }, { x0: 770, x1: 806, kind: 'rubble' }, { x0: 920, x1: 956, kind: 'wall' },
      { x0: 1080, x1: 1116, kind: 'sandbags' }, { x0: 1230, x1: 1266, kind: 'rubble' },
    ],
    things: [
      { x: 700, kind: 'look', label: 'A signpost', lines: ['A signpost, its arms shot away. It still pointed somewhere, bravely, at nothing.'] },
      { x: 1040, kind: 'look', label: 'An abandoned gun', lines: ['A field gun, left where it stood. Its crew had not had time to take it with them, or had not needed to.'] },
      { x: 1395, kind: 'goal', label: 'The hills', verb: 'Climb', lines: ['The road climbed out of the smoke. Behind me, the guns went on arguing with each other.'] },
    ],
  },

  // ---------------------------------------------------------------- Ending: to Hélène's grave
  cemetery: {
    title: 'The Cemetery', region: 'Lavilledieu',
    hero: 'mourner', start: 30, weather: 'petals', weatherCount: 40, accent: '255,200,200',
    water: ['rgba(140,90,120,0.5)', 'rgba(30,16,34,0.9)'],
    hint: 'Walk to Hélène\'s grave →',
    things: [
      { x: 64, kind: 'look', label: 'The gate', lines: ['The iron gate squealed the way it always had. Hélène used to say it was the only thing in town that complained louder than Baldabiou.'] },
      { x: 300, kind: 'item', item: 'flowers', label: 'Wildflowers', lines: ['Wildflowers along the wall: poppies, cornflowers, the small white ones she never knew the name of. I picked a handful.'] },
      { x: 640, kind: 'look', label: 'The plane tree', lines: ['The old plane tree. We sat under it once, on a hot day. She fell asleep on my shoulder, and I did not move for an hour.'] },
      { x: 880, kind: 'goal', label: 'Hélène\'s grave', verb: 'Kneel', lines: ['Her name on the stone: HÉLÈNE JONCOUR. The letters were already softening with the rain.'] },
    ],
  },
};
