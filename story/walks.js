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
 *              kind 'giant' is the great airship, veiled in haze; `z` says which layers it flies
 *              behind (it is drawn before every layer deeper than z: 0.03 is behind the clouds)
 *    colours:  { group, flag, from, delay, dur, hold, call, caller }  the flag hoisted at the start:
 *              crowd[group] shows `call`, then its people take their `rite` pose ('bugle', 'haul',
 *              'present') while flags[flag] climbs from y `from` to its own y and the bugle sounds
 *    train:    { depth, deck, speed, first, dir, pause: [min, max] }  a train now and then along a
 *              viaduct painted at `depth` (its rails at y `deck`), whistling as it comes into view;
 *              (first: after so many seconds; afterMove: so many seconds after Hervé first moves;
 *              each train comes in at the edge of the screen)
 *    cavalry:  { from, to, y, speed, gap, first, pause, riders: [{ look, horse }] }  horsemen riding
 *              the length of the walk and back (horses: bay, black, grey)
 *    band:     { first, volume }  a band practising somewhere, heard now and then
 *    range:    { x: [...], y, targets: [...], ty, look, period, pause }  riflemen on a firing step
 *              at x (feet at y), each in turn aiming and firing at the targets (centres at ty):
 *              a muzzle flash, smoke, dust at the target and the crack of the shot
 *  A river town has more (Lavilledieu):
 *    boats:    [{ kind: 'gabare' | 'barge' | 'rowboat', x, y, speed, dir, s }]  on the water, round and round
 *    fish:     { rate, y0, y1 }  fish leaping out of the water, rings and drops where they go in
 *    glitter:  { x, n }  the sun's sparkle on the water, under the sun at x on the screen
 *    flocks:   { first, every: [min, max], y: [top, bottom] }  birds going over in loose Vs
 *    ducks:    [{ x0, x1, y, n, speed }]  a duck and her ducklings paddling to and fro
 *    wheels:   [{ x, y, r, speed }]  a mill wheel turning in the river
 *    fountains: [{ x, y, basin }]  water thrown up and falling back
 *    bright:   true for a sunny place (the edges barely darken)
 *    windmills: [{ x, y, r, depth, speed, ph }]  the sails of a windmill painted at `depth`, turning
 *              round its hub (x, y in that layer's own pixels)
 *    sparkles: [{ x, y, depth, speed, size }]  the sun flashing on a spire or a gilded finial
 *    runners:  [{ look | kind: 'dog' | 'cat', coat, x0, x1, speed, turn, y, hoop, follow, gap }]
 *              children and animals running to and fro between x0 and x1, stopping now and then
 *              (a cat sits a good while); `follow` (an index) keeps to its own side of that runner,
 *              `gap` away: children at tag, a dog at their heels. Dogs: spaniel, black, white,
 *              gold; cats: ginger, black, tabby; `hoop` gives a child a hoop to bowl along
 *    weather 'autumn' brings leaves down, orange, gold and red
 *  A thing can stand in a pose, and change it when Hervé comes near: { pose, nearPose, nearAt }.
 *  Looks for the French army: soldier, rifleman (a rifle on the shoulder), officer, gunner, zouave,
 *  bugler, and the cavalry's cuirassier, cuirassierOfficer and trumpeter. And the town's: woman,
 *  lady, girl, baker, fisherman, washer, priest, oldman, fiddler, helene, and the children lad and
 *  lass (poses: wash, fish, fiddle, wave, aim). The navy's: sailor (the striped marinière and the
 *  red-pompom cap) and captain.
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
      // the great airship, far off beyond Paris and behind the clouds, crossing very slowly
      { kind: 'giant', x: 330, y: 86, s: 2.1, speed: 1.4, depth: 0.015, z: 0.03 },
      { kind: 'ship', x: 380, y: 44, s: 1, speed: 5, depth: 0.04 },
      { kind: 'ship', x: 120, y: 24, s: 0.55, speed: 3, depth: 0.03 },
      { kind: 'balloon', x: 250, y: 96, s: 0.8, depth: 0.12, tether: 170 },
      { kind: 'balloon', x: 560, y: 82, s: 0.6, depth: 0.12, tether: 168, colors: ['#f2e6dc', '#2e4a9a'] },
    ],
    flags: [
      { x: 142, y: 113, w: 28, h: 14 },
      { x: 1233, y: 59, w: 20, h: 11 },
      { x: 1128, y: 135, w: 16, h: 10, fringe: true },
      { x: 1340, y: 135, w: 16, h: 10, fringe: true },
      // the warship's ensign at her stern and the tricolour at the main masthead; the great gate's
      { x: 982, y: 121, w: 16, h: 10 },
      { x: 841, y: 14, w: 12, h: 7 },
      { x: 1717, y: 109, w: 18, h: 11 },
    ],
    fires: [{ x: 1232, y: 203 }],
    smoke: [{ x: 1232, y: 192, rate: 1.6 }, { x: 1156, y: 124, rate: 0.8 }, { x: 1309, y: 124, rate: 0.8 }, { x: 804, y: 123, rate: 1.4, col: '84,74,86', a: 0.5 }],
    // the colours go up at dawn: the bugle, the flag hoisted, the guard presenting arms
    colours: { group: 0, flag: 0, from: 176, delay: 1.6, dur: 10.4, hold: 3, call: 'To the colours!', caller: 5 },
    // an army train crossing the viaduct now and then, and cuirassiers riding through the camp
    train: { depth: 0.2, deck: 146, speed: 40, afterMove: 5, dir: -1, pause: [12, 20] },
    cavalry: {
      from: 1960, to: -60, y: 201, speed: 40, gap: 26, first: 4, pause: 22,
      riders: [{ look: 'cuirassierOfficer', horse: 'bay' }, { look: 'trumpeter', horse: 'grey' }, { look: 'cuirassier', horse: 'black' }, { look: 'cuirassier', horse: 'black' }],
    },
    band: { first: 35, volume: 0.35 },
    // riflemen at the butts, firing in turn at the targets
    range: { x: [300, 312, 324], y: 199, targets: [406, 428, 450], ty: 186 },
    crowd: [
      { x: 141, near: 150, people: [{ dx: -20, look: 'bugler', face: 1, rite: 'bugle' }, { dx: -4, look: 'soldier', face: 1, rite: 'haul' }, { dx: 11, look: 'rifleman', face: -1, rite: 'present' }, { dx: 18, look: 'rifleman', face: -1, rite: 'present' }, { dx: 25, look: 'rifleman', face: -1, rite: 'present' }, { dx: 36, look: 'officer', face: -1 }], lines: [[5, 'Stand easy, the colour guard.'], [0, 'I cracked the last note. Nobody say a word.'], [3, 'The colonel heard it. The colonel hears everything.'], [1, 'My arms. Every morning, my arms.']] },
      { x: 94, near: 120, people: [{ dx: 0, y: 156, look: 'rifleman', turn: true }], lines: [[0, 'All quiet on the south road, Corporal!'], [0, 'Nothing moves out there but the mist.']] },
      { x: 282, near: 90, people: [{ dx: 0, look: 'officer', face: 1 }], lines: [[0, 'Aim for the black, not the sky!'], [0, 'Squeeze the trigger, Morel. Don\'t pull it.'], [0, 'Better. Again!']] },
      { x: 256, people: [{ dx: -8, look: 'soldier', face: 1 }, { dx: 8, look: 'soldier', face: -1 }], lines: [[0, 'Pay\'s late again.'], [1, 'It\'s always late. That\'s how you know it\'s the army.'], [0, 'When I\'m discharged, I\'m opening a café in Marseille.'], [1, 'Last week it was Toulon.'], [0, 'Toulon, Marseille. Somewhere with the sea.']] },
      { x: 492, people: [{ dx: -7, look: 'rifleman', face: 1 }, { dx: 8, look: 'soldier', face: -1, pose: 'sit' }], lines: [[0, 'Polish your buttons, Lefèvre. The colonel counts them.'], [1, 'Then the colonel can count mine himself.'], [1, 'My mother writes that the silkworms are sick again at home.'], [0, 'Tell her the army eats bread, not silk.']] },
      { x: 706, people: [{ dx: -8, look: 'sailor', face: 1 }, { dx: 8, look: 'sailor', face: -1, pose: 'haul' }], lines: [[0, 'Mind the hawser, soldier!'], [1, 'Heave, and heave again!'], [0, 'The Napoléon. Ninety guns and a steam engine. Fastest ship afloat.'], [1, 'And we still scrub her decks by hand.']] },
      { x: 900, near: 160, people: [{ dx: -40, y: 163, look: 'sailor', turn: true }, { dx: 0, y: 162, look: 'sailor', face: -1 }, { dx: 50, y: 159, look: 'captain', face: -1 }], lines: [[2, 'Stand by to take on powder!'], [0, 'Aye, Captain!'], [2, 'And somebody tell the army to keep its boots off my gangplank.']] },
      { x: 1232, near: 170, people: [{ dx: -20, look: 'soldier', face: 1, pose: 'sit' }, { dx: 20, look: 'zouave', face: -1, pose: 'sit' }, { dx: -30, look: 'gunner', face: 1 }], lines: [[0, 'Did you see the airship over the citadel?'], [1, 'Giffard\'s contraption? It flies like a fat pigeon.'], [2, 'A pigeon that can see all the way to Prussia.'], [1, 'Then tell it to look at my mother\'s farm. Tell her I\'m eating.'], [0, 'The Emperor reviewed the Guard in Paris this spring.'], [2, 'And we got soup.']] },
      { x: 1532, people: [{ dx: -12, look: 'gunner', face: 1 }, { dx: 12, look: 'gunner', face: -1 }], lines: [[0, 'New rifled barrels. The La Hitte pattern.'], [1, 'Four thousand yards, the colonel says.'], [0, 'The colonel says a great many things.'], [1, 'He says them very loudly, too.']] },
      { x: 1716, near: 130, people: [{ dx: -22, look: 'rifleman', face: 1, pose: 'present' }, { dx: 22, look: 'rifleman', face: -1, pose: 'present' }, { dx: -30, y: 118, look: 'rifleman', turn: true }, { dx: 30, y: 118, look: 'rifleman', turn: true }], lines: [[2, 'Rider on the north road!'], [3, 'Coming fast. A big man, on a tired horse.'], [0, 'Halt! ...Ah, Joncour. Pass.'], [1, 'Mind the hedgehogs out there. They bite horses.']] },
    ],
    drill: { x: 1424, n: 5, gap: 9, face: 1, officer: 58, near: 170, period: 4.2, calls: [{ text: 'Present — arms!', pose: 'present' }, { text: 'Steady, the Seventh. Steady.', pose: 'present' }, { text: 'Shoulder — arms!' }, { text: 'Eyes — front!' }] },
    marchers: [
      { x0: 470, x1: 620, n: 2, gap: 9, speed: 18, look: 'rifleman', pause: 1.6 },
      { x0: 740, x1: 1080, n: 3, gap: 9, speed: 16, look: 'rifleman', pause: 2, start: 900, dir: -1 },
    ],
    things: [
      { x: 140, kind: 'look', label: 'The flag', lines: ['The tricolour, stiff with dew. We saluted it every morning, and I never once asked myself why.'] },
      { x: 232, kind: 'look', label: 'Your rifle', lines: ['My rifle, stacked with the others. I had cleaned it every day for two years and never fired it at anyone.'] },
      { x: 330, kind: 'coin', amount: 10, label: 'Your pay', lines: ['My pay for the month, in a twist of paper. Ten francs.'] },
      { x: 420, kind: 'talk', look: 'drummer', label: 'The drummer boy', lines: [['Drummer', 'Drill\'s done, Joncour. You look like a man waiting for something.'], 'I was. I just didn\'t know what yet.'] },
      { x: 540, kind: 'talk', look: 'soldier', label: 'The sergeant', lines: [['Sergeant', 'Someone rode in from Lavilledieu asking for you. Big man. Bigger hat.'], ['Sergeant', 'Friend of yours, or trouble?'], 'Both, probably.'] },
      { x: 840, kind: 'look', label: 'The warship', lines: ['A ship of the line of the Imperial Navy: ninety guns in two white bands, and a funnel between her masts. Sail and steam together, like the whole century.'] },
      { x: 1140, kind: 'coin', amount: 5, label: 'Dropped coins', lines: ['Somebody\'s winnings from last night\'s cards, trodden into the mud.'] },
      { x: 1360, kind: 'look', label: 'Supply crates', lines: ['Biscuit and powder. Everything in the army comes in a box, including the men.'] },
      { x: 1590, kind: 'talk', look: 'soldier', label: 'A sentry', lines: [['Sentry', 'Rider on the north road, Joncour. Says he\'s here for you.']] },
      { x: 1852, kind: 'look', label: 'The signpost', lines: ['LAVILLEDIEU — 3 DAYS. I read it every morning. It never got any shorter.'] },
      { x: 1885, kind: 'goal', look: 'baldabiou', ride: true, facing: -1, label: 'The rider', verb: 'Meet', lines: ['A rider was coming up the road at a gallop. I knew the hat before I knew the face.'] },
    ],
  },

  // ---------------------------------------------------------------- home: Lavilledieu, on a sunny day
  lavilledieu: {
    title: 'Lavilledieu', region: 'Home · The south of France', hero: 'traveller', start: 40, weather: 'autumn', weatherCount: 40, accent: '255,210,140', bright: true,
    water: ['rgba(120,184,230,0.34)', 'rgba(52,108,160,0.72)'],
    hint: 'Walk home to Hélène →',
    // the river's trade and its life: nothing here stops Hervé, it is only there to be seen
    boats: [
      { kind: 'gabare', x: 300, y: 228, speed: 7, dir: 1 },
      { kind: 'barge', x: 1300, y: 242, speed: 4, dir: -1 },
      { kind: 'rowboat', x: 960, y: 236, speed: 0, dir: -1 },
      { kind: 'gabare', x: 1760, y: 250, speed: 5, dir: -1, s: 1.15 },
    ],
    fish: { rate: 0.55, y0: 222, y1: 258 },
    glitter: { x: 80, n: 70 },
    flocks: { first: 3, every: [12, 22], y: [14, 80] },
    ducks: [{ x0: 250, x1: 420, y: 218, n: 4, speed: 5 }, { x0: 1380, x1: 1540, y: 220, n: 3, speed: 4 }],
    wheels: [{ x: 646, y: 206, r: 15, speed: 0.9 }],
    fountains: [{ x: 1560, y: 170, basin: 194 }],
    // the windmills on the far ridges (their hubs, where tools/paint/walks.js painted the towers)
    windmills: [
      { x: 65.1, y: 129.7, r: 17, depth: 0.13, speed: 0.55 },
      { x: 211.1, y: 127.5, r: 17, depth: 0.13, speed: 0.7, ph: 1 },
      { x: 471.1, y: 121.5, r: 17, depth: 0.13, speed: 0.6, ph: 2 },
      { x: 621.1, y: 127.5, r: 17, depth: 0.13, speed: 0.5, ph: 0.5 },
    ],
    // the sun catching the cathedral's spires and its great window, and the château's gilding
    sparkles: [
      { x: 561, y: 9, depth: 0.22 }, { x: 583, y: 9, depth: 0.22, speed: 0.9 }, { x: 640, y: 41, depth: 0.22, size: 2 },
      { x: 572, y: 76, depth: 0.22, size: 2, speed: 1.4 },
      { x: 149, y: 76, depth: 0.07, size: 2 }, { x: 108.5, y: 89, depth: 0.07, size: 2, speed: 0.8 }, { x: 163.7, y: 94, depth: 0.07, size: 2, speed: 1.3 },
    ],
    // children at tag in the meadow with a spaniel at their heels, a black cat by the hives, a boy
    // bowling his hoop along the quay with a black dog after him, a ginger cat by the fountain,
    // and the Joncours' old dog pottering about the garden
    runners: [
      { look: 'lass', x0: 150, x1: 420, speed: 30 },
      { look: 'lad', follow: 0, gap: 12, speed: 34 },
      { kind: 'dog', coat: 'spaniel', follow: 1, gap: 9, speed: 44 },
      { kind: 'cat', coat: 'black', x0: 168, x1: 236, speed: 7 },
      { look: 'boy', hoop: true, x0: 880, x1: 1200, speed: 30, turn: 0.05 },
      { kind: 'dog', coat: 'black', follow: 4, gap: 20, speed: 44 },
      { kind: 'cat', coat: 'ginger', x0: 1572, x1: 1600, speed: 8 },
      { kind: 'dog', coat: 'gold', x0: 1700, x1: 1880, speed: 14, turn: 0.15 },
    ],
    smoke: [{ x: 482, y: 82, rate: 0.9, col: '240,240,244' }, { x: 1782, y: 100, rate: 0.6, col: '240,240,244' }],
    crowd: [
      { x: 110, near: 130, people: [{ dx: -8, look: 'oldman', face: 1, pose: 'sit' }, { dx: 10, look: 'girl', face: -1 }], lines: [[0, 'Is that the Joncour boy? Out of uniform at last!'], [1, 'He looks taller, Grandpa.'], [0, 'Everyone looks taller when they come home.']] },
      { x: 700, people: [{ dx: -12, y: 205, look: 'washer', face: 1, pose: 'wash' }, { dx: 10, y: 205, look: 'washer', face: -1, pose: 'wash' }], lines: [[0, 'The worms are sick again, all down the valley.'], [1, 'Baldabiou will think of something. He always does.'], [0, 'He has been buying drinks all week. Something is afoot.'], [1, 'Something is always afoot with that man.']] },
      { x: 836, people: [{ dx: -8, look: 'baker', face: 1 }, { dx: 10, look: 'woman', face: -1 }], lines: [[0, 'Fresh bread! Still warm!'], [1, 'Two loaves. And one for the Joncour house: their boy is home.'], [0, 'Then take a brioche for him too. On me.']] },
      { x: 1050, people: [{ dx: -14, look: 'oldman', face: 1, pose: 'sit' }, { dx: 16, look: 'traveller', face: -1, pose: 'sit' }], lines: [[0, 'Hervé Joncour! Sit, sit, have a glass with us.'], [1, 'Let the boy go home, Émile. Someone is waiting for him.'], [0, 'Hmph. In my day we had a glass first.']] },
      { x: 1236, people: [{ dx: 0, look: 'fisherman', face: 1, pose: 'fish' }], lines: [[0, 'Nothing biting. The fish are all too busy jumping at the boats.']] },
      { x: 1344, people: [{ dx: -10, look: 'fiddler', face: 1, pose: 'fiddle' }, { dx: 12, look: 'lady', face: -1 }, { dx: 22, look: 'woman', face: -1 }], lines: [[0, 'A tune for the soldier come home!'], [1, 'Play the one about the river, Jules.'], [2, 'Not that one again!']] },
      { x: 1520, people: [{ dx: -10, look: 'priest', face: 1 }, { dx: 8, look: 'boy', face: -1 }, { dx: 15, look: 'girl', face: -1 }], lines: [[0, 'Welcome home, my son. The bells will ring for you on Sunday.'], [1, 'Monsieur Hervé! Did you see a war?'], [0, 'Leave him be, children. He has somewhere to be.']] },
    ],
    marchers: [
      { x0: 760, x1: 1010, n: 1, gap: 9, speed: 12, look: 'lady', pause: 3 },
      { x0: 1100, x1: 1290, n: 2, gap: 7, speed: 10, look: 'woman', pause: 2.5, start: 1200, dir: -1 },
    ],
    things: [
      { x: 204, kind: 'look', label: 'The bee hives', lines: ['Old Verdier\'s bees. The whole meadow hummed with them. I had forgotten that sound.'] },
      { x: 332, kind: 'coin', amount: 5, label: 'A coin in the grass', lines: ['A five-franc piece in the grass by the wayside cross. Somebody\'s bad luck, and my good.'] },
      { x: 540, kind: 'look', label: 'The silk mill', lines: ['The mill, running as it always had. The whole town lived on what the silkworms spun, and on what Baldabiou could sell.'] },
      { x: 1470, kind: 'look', label: 'The church', sound: 'bell', lines: ['The bell rang the hour as I passed. It had rung every hour I was away, whether I heard it or not.'] },
      { x: 1650, kind: 'look', label: 'The garden gate', lines: ['The gate still stuck at the bottom. I lifted it, the way I always had.'] },
      { x: 1790, kind: 'goal', look: 'helene', facing: -1, nearPose: 'wave', nearAt: 120, label: 'Hélène', verb: 'Talk to', lines: ['She was in the garden, among the roses. She saw me before I reached the gate.'] },
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
