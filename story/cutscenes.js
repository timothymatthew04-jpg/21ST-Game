/*
 * ============================================================================
 *  SILK — cutscenes
 * ============================================================================
 *
 *  The story script plays these with a line like:   cutscene prologue
 *
 *  A cutscene is a list of shots. Each shot can have:
 *
 *    bg       the painted scene to show (any background, or a close-up like the_cup)
 *    dur      how long it lasts, in seconds
 *    cam      the camera: [zoom, x, y] or a move [[zoom, x, y], [zoom, x, y]];
 *             x and y are the point to look at, as fractions of the picture
 *    fx       extra effects, written like a bgfx line: "snow=1 embers=0.4,0.7,0.6"
 *    text     a caption in the letterbox; textAt = when it appears (seconds)
 *    title    big words across the middle;  kanji: large brushed characters at the side
 *    sound    a sound, or a list of [name, seconds, volume]
 *    flash    moments (seconds) of a bright flash;  shake: moments the picture jolts
 *    trans    how the shot arrives: fade (default), cut, white or black
 *    tint     a colour laid over the shot, e.g. "rgba(10,10,40,0.4)"
 *    sprites  characters in the shot: [{ id, x, y, h, expr, to, filter, opacity }]
 *    map      a journey across the map: { stops: [...], zoom, travel }
 *    letter   a sheet of writing: { lang: 'ja' or 'fr', lines: [...] }
 *
 *  Click moves to the next shot; Esc or "Skip" ends the cutscene.
 * ============================================================================
 */
(function () {
  // ---- Hervé's route, as the novel tells it: Metz, Vienna, Budapest, Kiev, the steppe,
  // the Urals, Siberia, Lake Baikal, the Amur, the port of Sabirk, then by sea to Japan.
  const P = {
    lavilledieu: { lon: 4.45, lat: 44.58, label: 'Lavilledieu', big: true, side: 'below' },
    metz: { lon: 6.18, lat: 49.12, label: 'Metz' },
    bavaria: { lon: 11.5, lat: 48.4 },
    vienna: { lon: 16.37, lat: 48.21, label: 'Vienna' },
    budapest: { lon: 19.04, lat: 47.5, label: 'Budapest', side: 'below' },
    kiev: { lon: 30.52, lat: 50.45, label: 'Kiev' },
    steppe: { lon: 45, lat: 52.5, label: 'the steppe' },
    urals: { lon: 60.6, lat: 56.8, label: 'the Urals' },
    omsk: { lon: 73.4, lat: 55 },
    siberia: { lon: 88, lat: 56.3, label: 'Siberia' },
    baikal: { lon: 105.8, lat: 52.2, label: 'Lake Baikal' },
    chita: { lon: 113.5, lat: 52 },
    amur: { lon: 127.5, lat: 50.3, label: 'the Amur' },
    khabarovsk: { lon: 135, lat: 48.5 },
    sabirk: { lon: 140.2, lat: 49, label: 'Sabirk', side: 'above' },
    strait: { lon: 138.8, lat: 44, sea: true },
    teraya: { lon: 136.9, lat: 37.3, label: 'Cape Teraya', sea: true, side: 'left' },
    shirakawa: { lon: 140.2, lat: 37.1, label: 'Shirakawa', big: true, side: 'below' },
  };
  const OUT = ['lavilledieu', 'metz', 'bavaria', 'vienna', 'budapest', 'kiev', 'steppe', 'urals', 'omsk', 'siberia', 'baikal', 'chita', 'amur', 'khabarovsk', 'sabirk', 'strait', 'teraya', 'shirakawa'];
  const out = () => OUT.map((k) => ({ ...P[k], key: k }));
  // the way home: the same stops backwards, the sea crossing now at the start
  const home = () => {
    const back = OUT.slice().reverse().map((k) => ({ ...P[k], sea: false, key: k }));
    back[2].sea = true; back[3].sea = true; // on to the strait and Sabirk by sea
    return back;
  };

  // the route out and the route home, for the journeys (story/journeys.js)
  window.VN_ROUTE = { out, home };

  window.VN_CUTSCENES = {
    // ---------------------------------------------------------------- Prologue
    prologue: {
      shots: [
        { bg: 'lavilledieu', dur: 6, cam: [[1.4, 0.25, 0.3], [1.06, 0.5, 0.5]], title: 'LAVILLEDIEU', titleAt: 0.8, text: 'The south of France, 1861.', textAt: 2, sound: [['bell', 1, 0.5]] },
        { bg: 'silk_mill', dur: 4.5, cam: [[1.3, 0.35, 0.45], [1.1, 0.6, 0.5]], text: 'A town that lived on silk.' },
        { bg: 'cs_worms', dur: 6, cam: [[1.6, 0.42, 0.62], [1.15, 0.5, 0.55]], fx: 'motes=0.05,0.05,0.4,0.6,18,#c8d0e0', sound: [['heartbeat', 2.4, 0.6], ['heartbeat', 4.2, 0.4]], trans: 'black' },
      ],
    },

    // ---------------------------------------------------------------- Chapter 1: the first journey
    journey_one: {
      shots: [
        { bg: 'journey_map', dur: 17, map: { stops: out(), zoom: 1.9, travel: 15 }, text: 'To the end of the world, and a country that did not want him.', textAt: 1.5, sound: [['whoosh', 0.2, 0.5]] },
      ],
    },

    // ---------------------------------------------------------------- Chapter 2: Japan
    arrival: {
      shots: [
        { bg: 'smuggler_boat', dur: 5, cam: [[1.3, 0.4, 0.55], [1.12, 0.6, 0.5]], fx: 'mist=0.55,0.35,0.45,#b8c8e8', sound: [['wind_gust', 0.3, 0.5]], text: 'No lights. No questions.' },
        { bg: 'japan_coast', dur: 6.5, cam: [[1.35, 0.2, 0.55], [1.06, 0.62, 0.45]], kanji: '日本', sound: [['temple_bell', 2.2, 0.5]], text: 'Japan.', textAt: 2.6 },
      ],
    },

    // ---------------------------------------------------------------- Chapter 3: the cup
    the_cup: {
      shots: [
        { bg: 'estate_tearoom', dur: 3.5, cam: [[1.0, 0.5, 0.5], [1.28, 0.5, 0.78]] },
        { bg: 'the_cup', dur: 6.5, cam: [[1.7, 0.43, 0.55], [1.2, 0.5, 0.58]], sound: [['cup', 0.5, 1], ['heartbeat', 3.6, 0.35]] },
      ],
    },

    // ---------------------------------------------------------------- Chapter 4: the way home
    return_home: {
      shots: [
        { bg: 'journey_map', dur: 12, map: { stops: home(), zoom: 1.8, travel: 10.5 }, text: 'Across the whole world again, the eggs kept cool and counted every day.', textAt: 1 },
      ],
    },

    // ---------------------------------------------------------------- Chapter 5: the second journey
    journey_two: {
      shots: [
        { bg: 'journey_map', dur: 12, map: { stops: out(), zoom: 1.9, travel: 10.5 }, fx: 'snow=0.6', text: 'The second journey. Winter, all the way.', textAt: 1 },
      ],
    },

    // ---------------------------------------------------------------- Chapter 6: the glove
    the_glove: {
      shots: [
        { bg: 'estate_room', dur: 4, cam: [[1.05, 0.5, 0.5], [1.35, 0.4, 0.75]], sound: [['breath', 1.5, 0.6]] },
        { bg: 'the_glove', dur: 6, cam: [[1.7, 0.42, 0.62], [1.2, 0.45, 0.58]], fx: 'motes=0.1,0,0.7,0.8,26,#fff0c8 rays=0.3,0,1.2,0.6,#fff0c0', sound: [['heartbeat', 3, 0.4]] },
      ],
    },

    // ---------------------------------------------------------------- Chapter 7: the note
    the_note: {
      shots: [
        { letter: { lang: 'ja', lines: ['帰って来てください'], at: 0.8, step: 2.6 }, dur: 5.5, sound: [['paper', 0.2, 0.8], ['heartbeat', 4, 0.6]] },
      ],
    },

    // ---------------------------------------------------------------- Chapter 8: the garden
    garden: {
      shots: [
        { bg: 'helene_garden', dur: 6, cam: [[1.3, 0.5, 0.2], [1.06, 0.5, 0.55]], text: 'The trees were a little taller every time.', textAt: 1.2, sprites: [{ id: 'helene', x: 0.87, y: 0.02, h: 0.46, expr: 'soft', filter: 'sepia(0.18) saturate(1.1) brightness(0.96)' }] },
      ],
    },

    // ---------------------------------------------------------------- Chapter 9: the third journey, and the black ships
    journey_three: {
      shots: [
        { bg: 'road_rain', dur: 3.5, cam: [[1.2, 0.5, 0.4], [1.05, 0.5, 0.5]], flash: [0.9], sound: [['thunder', 0.9, 0.8]] },
        { bg: 'journey_map', dur: 11, map: { stops: out(), zoom: 2, travel: 9.5, ink: '#6a1a10' }, fx: 'rain=0.7', text: 'A third time.', textAt: 1 },
      ],
    },
    warships: {
      shots: [
        { bg: 'cs_warships', dur: 7, cam: [[1.35, 0.25, 0.6], [1.08, 0.62, 0.5]], fx: 'smoke=0.39,0.66,1,#2a1a1a smoke=0.72,0.62,0.6,#2a1a1a glints=0,0.66,1,0.3,30,#ffb070', kanji: '黒船', flash: [2.4, 4.8], shake: [[2.4, 1], [4.8, 0.7]], sound: [['horn', 0.4, 0.45], ['cannon', 2.4, 0.8], ['cannon', 4.8, 0.6]] },
      ],
    },

    // ---------------------------------------------------------------- Chapter 11: the war
    // The horizon burning, two armies meeting, the guns, the ships, the villages, and after.
    war: {
      shots: [
        {
          bg: 'war_horizon', dur: 8.5, cam: [[1.04, 0.5, 0.56], [1.3, 0.64, 0.52]], kanji: '戦',
          fx: 'gunfire=0.69,0.02,0.98,16,1 gunfire=0.68,0.05,0.95,1.3,2.6 rockets=1.1,0.69,0.08,0.92 shells=0.5,0.7,0.78,0.15,0.85 embers=0.7,0.5,0.8',
          text: 'In Japan, the war had come.', textAt: 1.8,
          sound: [['horn', 0.2, 0.6], ['cannon_far', 1.0, 0.8], ['rocket', 1.7, 0.5], ['cannon_far', 2.8, 0.7], ['volley', 3.6, 0.35], ['rocket', 4.6, 0.45], ['cannon_far', 5.4, 0.8], ['shell', 6.2, 0.5]],
          shake: [[1.0, 0.4], [5.4, 0.5]],
        },
        {
          bg: 'war_field', dur: 9, cam: [[1.6, 0.22, 0.68], [1.6, 0.78, 0.66]], ease: 'cubic-bezier(0.35, 0, 0.65, 1)', trans: 'cut',
          fx: 'army=0.7,1,5,34,0,1,0,0.42,0.5 army=0.69,-1,6,30,1,1,0.58,1,0.3 army=0.77,1,8,24,0,2,0,0.44,0.8 army=0.76,-1,11,20,1,2,0.56,1,0.4 gunfire=0.63,0.1,0.9,5,1 shells=0.35,0.72,0.86,0.3,0.7 boom=0.46,0.8,2.3,1.8 boom=0.6,0.76,6.4,2 boom=0.34,0.84,4.4,1.4',
          sound: [['drumroll', 0.1, 0.6], ['volley', 1.1, 0.6], ['shell', 0.9, 0.5], ['explosion', 2.3, 0.9], ['shouts', 3.0, 0.7], ['explosion', 4.4, 0.6], ['volley', 5.3, 0.55], ['shell', 5.0, 0.5], ['explosion', 6.4, 1], ['horn', 7.4, 0.6]],
          shake: [[2.3, 1.2], [4.4, 0.6], [6.4, 1.5]], flash: [6.4],
        },
        {
          bg: 'war_guns', dur: 6, cam: [[1.22, 0.36, 0.7], [1.42, 0.46, 0.66]], trans: 'cut',
          fx: 'cannon=0.482,0.745,2.6,0.9,1,1.7 cannon=0.81,0.713,2.6,2.2,1,1.1 gunfire=0.71,0.05,0.95,6,1 embers=0.6,0.7,0.8',
          sound: [['cannon', 0.9, 1], ['cannon', 2.2, 0.7], ['cannon', 3.5, 1], ['cannon', 4.8, 0.7], ['shouts', 1.6, 0.4]],
          shake: [[0.9, 1.6], [2.2, 0.7], [3.5, 1.6], [4.8, 0.7]], flash: [0.9, 3.5],
        },
        {
          bg: 'cs_warships', dur: 6.5, cam: [[1.3, 0.3, 0.58], [1.12, 0.62, 0.52]], tint: 'rgba(10,6,30,0.4)', trans: 'cut',
          fx: 'cannon=0.24,0.8,3.2,0.7,-1,1.2 cannon=0.3,0.8,3.2,1.25,-1,1.2 cannon=0.36,0.8,3.2,1.8,-1,1.2 cannon=0.66,0.72,3.2,2.35,-1,0.8 rockets=0.4,0.62,0.2,0.8 shells=0.5,0.6,0.66,0.02,0.4 smoke=0.39,0.66,1,#1a1010',
          sound: [['battery', 0.7, 0.9], ['rocket', 2.6, 0.4], ['battery', 3.9, 0.8], ['explosion', 5.6, 0.6]],
          shake: [[0.7, 1.1], [1.25, 0.6], [1.8, 0.9], [2.35, 0.5], [3.9, 1.1], [4.45, 0.6], [5.0, 0.9]], flash: [0.7, 3.9],
        },
        {
          bg: 'estate_unrest', dur: 5.5, cam: [[1.3, 0.35, 0.5], [1.1, 0.55, 0.55]], tint: 'rgba(70,14,0,0.3)',
          fx: 'embers=0.5,0.8,1.6 smoke=0.5,0.7,1,#1a1010 blasts=0.5,0.62,0.74,0.1,0.9 ash=0.8',
          text: 'Villages burned. Foreigners were hunted on the roads.', textAt: 0.6,
          sound: [['shouts', 0.1, 0.9], ['shell', 0.6, 0.9], ['volley', 2.7, 0.8], ['drumroll', 3.2, 0.5]],
          flash: [1.9], shake: [[1.9, 1.3]],
        },
        {
          bg: 'war_horizon', dur: 6, cam: [[1.35, 0.62, 0.52], [1.02, 0.5, 0.55]], trans: 'white', tint: 'rgba(20,8,10,0.35)',
          fx: 'ash=1.3 gunfire=0.69,0.2,0.8,2.5,1',
          sound: [['wind_gust', 0.2, 0.6], ['musket', 1.4, 0.4], ['musket', 2.6, 0.25], ['cannon_far', 3.8, 0.4]],
        },
      ],
    },

    // ---------------------------------------------------------------- Chapter 11: the burned village
    ashes: {
      shots: [
        { bg: 'burned_village', dur: 6.5, cam: [[1.0, 0.5, 0.5], [1.32, 0.45, 0.45]], fx: 'ash=1.2', sound: [['wind_gust', 0.5, 0.7]], kanji: '灰' },
        { bg: 'aviary', dur: 4.5, cam: [[1.25, 0.4, 0.5], [1.1, 0.5, 0.45]], nofx: true, tint: 'rgba(30,26,24,0.55)', fx: 'ash=0.8', text: 'No birds.', textAt: 1.2 },
      ],
    },

    // ---------------------------------------------------------------- Chapter 12: the camp in the forest
    forest: {
      shots: [
        { bg: 'forest_camp_night', dur: 6.5, cam: [[1.45, 0.15, 0.45], [1.15, 0.43, 0.68]], text: 'A fire in the forest, and what was left of his people.', textAt: 1.5 },
      ],
    },

    // ---------------------------------------------------------------- Chapter 13: the last eggs
    last_eggs: {
      shots: [
        { bg: 'journey_map', dur: 11, map: { stops: home(), zoom: 1.8, travel: 9.5, ink: '#5a3a2a' }, fx: 'snow=0.8', text: 'Eggs bought at any price, carried too far, too slowly.', textAt: 1 },
      ],
    },
    no_hatch: {
      shots: [
        { bg: 'cs_worms', dur: 6, cam: [[1.1, 0.5, 0.55], [1.55, 0.44, 0.62]], fx: 'motes=0.05,0.05,0.4,0.6,12,#c8d0e0', sound: [['heartbeat', 1.5, 0.5], ['heartbeat', 3.5, 0.3]] },
      ],
    },

    // ---------------------------------------------------------------- Chapter 14: the final letter
    final_letter: {
      shots: [
        { bg: 'the_letter', dur: 4.5, cam: [[1.05, 0.5, 0.5], [1.3, 0.4, 0.45]], fx: 'flame=0.896,0.29,0.03,#ffc070 motes=0.6,0.1,0.3,0.5,14,#ffe0a0', sound: [['paper', 0.6, 0.8]] },
        { letter: { lang: 'ja', lines: ['あなたは私を見るために', '世界を渡って来た', 'どうか今いる場所に', 'いてください', '隣にいる人を', '見てください', 'さようなら　愛しい人'], at: 0.6, step: 1.15 }, dur: 9.5, trans: 'fade' },
      ],
    },

    // ---------------------------------------------------------------- Chapter 15: the candle
    candle: {
      shots: [
        { bg: 'cs_candle', dur: 5.5, cam: [[1.05, 0.5, 0.5], [1.35, 0.5, 0.45]], fx: 'flame=0.5,0.35,0.035,#ffc070 snow=0.5,0.31,0.06,0.4,0.5' },
        { bg: 'cs_candle_dawn', dur: 6, cam: [[1.35, 0.5, 0.48], [1.1, 0.5, 0.45]], fx: 'smoke=0.5,0.53,0.5,#c8c8d0 rays=0.56,0.35,0.8,0.5,#ffe0b0', trans: 'black', sound: [['candle_out', 0, 0.8], ['bell', 2.6, 0.55]] },
      ],
    },

    // ---------------------------------------------------------------- Final chapter: the truth
    truth: {
      shots: [
        { letter: { lang: 'ja', lines: ['あなたは私を見るために', '世界を渡って来た', '隣にいる人を', '見てください'], at: 0.4, step: 0.9 }, dur: 5, sound: [['heartbeat', 3.4, 0.6]] },
        { letter: { lang: 'fr', lines: ['Tu as traversé le monde entier pour me regarder.', 'Laisse-moi être une histoire qu’on t’a racontée,', 'belle, et finie.', 'Regarde celle qui est à côté de toi.', '— Hélène'], at: 0.6, step: 1.5 }, dur: 10, trans: 'white', sound: [['sparkle', 0.2, 0.5]] },
      ],
    },

    // ---------------------------------------------------------------- the endings
    // ---------------------------------------------------------------- the opening: Japan, before the story reaches it
    opening: {
      shots: [
        { bg: 'op_sky', dur: 8.5, cam: [[1.75, 0.42, 0.18], [1.12, 0.55, 0.52]], ease: 'cubic-bezier(0.45, 0, 0.25, 1)', kanji: '空', sound: [['wind_gust', 0.3, 0.3], ['chime', 3.2, 0.3]] },
        { bg: 'op_grass', dur: 7.5, cam: [[1.5, 0.22, 0.72], [1.1, 0.58, 0.62]], kanji: '風', fade: 1.6, sound: [['wind_gust', 0.6, 0.45], ['wind_gust', 4.4, 0.35]] },
        { bg: 'op_grass', dur: 5, cam: [[2.0, 0.84, 0.66], [2.4, 0.8, 0.58]], fade: 1.2, fx: 'motes=0.5,0.3,0.5,0.6,40,#fffbe0', sound: [['wind_gust', 0.8, 0.5]] },
        { bg: 'op_sunset', dur: 10, cam: [[1.45, 0.38, 0.62], [1.04, 0.52, 0.5]], trans: 'white', logo: true, logoAt: 2.2, kanji: '絹', sound: [['temple_bell', 0.9, 0.5], ['swell', 2.4, 0.35]] },
      ],
    },

    // ---------------------------------------------------------------- the seasons turning in Lavilledieu
    seasons: {
      shots: [
        { bg: 'helene_garden', dur: 3.2, cam: [[1.25, 0.3, 0.55], [1.12, 0.4, 0.5]], tint: 'rgba(255,190,210,0.12)', fx: 'petals=1.6', kanji: '春', text: 'Spring.', textAt: 0.5, sound: [['wind_gust', 0.2, 0.3]] },
        { bg: 'silk_mill', dur: 3.2, cam: [[1.1, 0.4, 0.5], [1.25, 0.55, 0.5]], text: 'The mill ran day and night.', textAt: 0.4, sound: [['creak', 0.3, 0.4]] },
        { bg: 'helene_garden', dur: 3.2, cam: [[1.12, 0.6, 0.5], [1.25, 0.7, 0.55]], tint: 'rgba(255,140,40,0.22)', fx: 'leaves=1.8', kanji: '秋', text: 'Autumn.', textAt: 0.5 },
        { bg: 'garden_winter', dur: 3.4, cam: [[1.25, 0.45, 0.5], [1.08, 0.5, 0.5]], kanji: '冬', text: 'Winter.', textAt: 0.5, sound: [['wind_gust', 0.3, 0.4]] },
      ],
    },
    years: {
      shots: [
        { bg: 'helene_garden', dur: 2.4, cam: [[1.1, 0.5, 0.5], [1.2, 0.5, 0.5]], tint: 'rgba(255,190,210,0.12)', fx: 'petals=1.4', text: 'Years passed.', textAt: 0.4 },
        { bg: 'helene_garden', dur: 2.2, cam: [[1.2, 0.5, 0.5], [1.3, 0.5, 0.5]], tint: 'rgba(255,140,40,0.22)', fx: 'leaves=1.8', trans: 'cut' },
        { bg: 'silk_mill_empty', dur: 2.6, cam: [[1.1, 0.5, 0.5], [1.22, 0.5, 0.45]], text: 'The mill fell quiet.', textAt: 0.3 },
        { bg: 'garden_winter', dur: 2.6, cam: [[1.3, 0.5, 0.5], [1.1, 0.5, 0.5]], trans: 'cut', kanji: '歳月' },
      ],
    },

    // ---------------------------------------------------------------- Chapter 1: the army camp
    camp: {
      shots: [
        { bg: 'army_camp', dur: 6, cam: [[1.5, 0.2, 0.3], [1.08, 0.45, 0.55]], title: 'THE ARMY', titleAt: 0.8, kanji: '兵', text: 'The south of France, 1861.', textAt: 2.2, fx: 'motes=0.1,0.5,0.8,0.4,30,#fff0c8 birds=5,0.06,0.3', sound: [['horn', 0.3, 0.6], ['drumroll', 2.6, 0.5]] },
        { bg: 'army_camp', dur: 5.5, cam: [[1.9, 0.46, 0.84], [1.3, 0.68, 0.7]], fx: 'embers=0.4625,0.86,1.4 smoke=0.4625,0.84,1.2,#9a8a8a', text: 'One road led out of camp. It led home.', textAt: 1, sound: [['gallop', 2.8, 0.6]] },
        { bg: 'army_camp', dur: 3.5, cam: [[1.4, 0.72, 0.62], [2.1, 0.66, 0.6]], trans: 'white', flash: [0.2], fx: 'motes=0.5,0.5,0.4,0.4,40,#fff6d8', text: 'A rider, coming up the road at a gallop.', textAt: 0.6, sound: [['whoosh', 0, 0.6]] },
      ],
    },

    // ---------------------------------------------------------------- the wedding
    wedding: {
      shots: [
        { bg: 'lavilledieu', dur: 5.5, cam: [[1.45, 0.72, 0.28], [1.08, 0.5, 0.5]], fx: 'petals=1.4 birds=7,0.05,0.35 motes=0.1,0.3,0.8,0.5,30,#fff6d8', title: 'SPRING', titleAt: 0.6, kanji: '結', text: 'The bells of Lavilledieu.', textAt: 1.8, sound: [['bell', 0.2, 0.7], ['bell', 1.6, 0.6], ['bell', 3, 0.5]] },
        { bg: 'joncour_home', dur: 5, cam: [[1.3, 0.4, 0.45], [1.12, 0.5, 0.5]], fx: 'petals=1', sprites: [{ id: 'helene', x: 0.5, y: 0.02, h: 0.72, expr: 'smile' }], text: 'The whole town came.', textAt: 1, flash: [0.3], sound: [['chime', 0.3, 0.6], ['sparkle', 1.5, 0.7]] },
        { bg: 'helene_garden', dur: 5, cam: [[1.08, 0.5, 0.5], [1.3, 0.5, 0.4]], fx: 'petals=1.6 fireflies=0.05,0.45,0.9,0.4,20', sprites: [{ id: 'helene', x: 0.35, y: 0.02, h: 0.6, expr: 'soft' }], text: 'One week of being married.', textAt: 1.2, trans: 'white', sound: [['swell', 0, 0.6]] },
      ],
    },

    // ---------------------------------------------------------------- endings
    end_quiet_life: {
      shots: [
        { bg: 'helene_garden', dur: 5.5, cam: [[1.4, 0.3, 0.45], [1.1, 0.5, 0.5]], fx: 'petals=1.8 birds=4,0.06,0.3', sprites: [{ id: 'helene', x: 0.72, y: 0.02, h: 0.56, expr: 'smile' }], title: 'SPRING', titleAt: 0.6, text: 'The cherry tree flowered for one week. The best week of the year.', textAt: 1.6, sound: [['chime', 0.4, 0.5]] },
        { bg: 'helene_garden', dur: 5, cam: [[1.1, 0.5, 0.55], [1.35, 0.7, 0.55]], fx: 'fireflies=0.05,0.4,0.9,0.5,40 glints=0.3,0.6,0.5,0.2,30', tint: 'rgba(40,20,70,0.35)', title: 'SUMMER', titleAt: 0.5, text: 'Two children, and a pond full of frogs with names.', textAt: 1.4, sound: [['sparkle', 0.5, 0.6]] },
        { bg: 'garden_winter', dur: 5, cam: [[1.3, 0.25, 0.4], [1.06, 0.5, 0.5]], fx: 'snow=1.6', title: 'WINTER', titleAt: 0.5, text: 'Muddy boots at the door. Laughter upstairs.', textAt: 1.4, trans: 'white' },
        { bg: 'joncour_home', dur: 5, cam: [[1.15, 0.5, 0.5], [1.4, 0.8, 0.62]], fx: 'embers=0.856,0.63,1.2', text: 'A whole life, one ordinary day at a time.', textAt: 1, sound: [['page', 0.4, 0.4]] },
        { bg: 'cemetery_two', dur: 7, cam: [[1.05, 0.5, 0.35], [1.7, 0.5, 0.82]], fx: 'petals=1.2 motes=0.2,0.5,0.6,0.4,40,#ffe0a0', kanji: '陽', text: 'Buried beside each other, the way they had lived.', textAt: 2, trans: 'black', sound: [['bell', 1.2, 0.6], ['swell', 4.4, 0.6]] },
      ],
    },
    end_our_house: {
      shots: [
        { bg: 'helene_garden', dur: 5.5, cam: [[1.5, 0.82, 0.4], [1.1, 0.5, 0.5]], fx: 'petals=1.2 glints=0.49,0.67,0.33,0.12,30', sprites: [{ id: 'helene', x: 0.3, y: 0.02, h: 0.58, expr: 'smile' }], title: 'OUR HOUSE', titleAt: 0.6, text: 'A small yellow house at the edge of town.', textAt: 1.6, sound: [['chime', 0.3, 0.5]] },
        { bg: 'silk_mill', dur: 4.5, cam: [[1.3, 0.35, 0.45], [1.08, 0.6, 0.5]], fx: 'motes=0.15,0.25,0.55,0.7,70', text: 'The mill hummed. The town lived.', textAt: 0.8, sound: [['sparkle', 0.8, 0.5]] },
        { bg: 'estate_tearoom', dur: 5, cam: [[1.5, 0.5, 0.75], [1.2, 0.5, 0.6]], tint: 'rgba(40,20,40,0.45)', fx: 'steam=0.4917,0.785,1.3 petals=0.6', text: 'Sometimes, at the bottom of a teacup, a pair of eyes...', textAt: 0.8, trans: 'black', sound: [['cup', 0.4, 0.6]] },
        { bg: 'joncour_home', dur: 4.5, cam: [[1.4, 0.3, 0.55], [1.1, 0.5, 0.5]], fx: 'embers=0.856,0.63,1', sprites: [{ id: 'helene', x: 0.4, y: 0.02, h: 0.62, expr: 'smile' }], text: '...and then her laugh from the next room, and it was gone.', textAt: 0.6, trans: 'white', flash: [0.1] },
        { bg: 'cemetery_two', dur: 7, cam: [[1.05, 0.5, 0.35], [1.7, 0.5, 0.82]], fx: 'petals=1 fireflies=0.05,0.62,0.9,0.3,20', kanji: '家', text: 'Grown old together. Side by side.', textAt: 2, trans: 'black', sound: [['bell', 1.2, 0.6], ['swell', 4.4, 0.6]] },
      ],
    },
    end_no_goodbye: {
      shots: [
        { bg: 'china_dock', dur: 5, cam: [[1.1, 0.5, 0.5], [1.5, 0.3, 0.7]], fx: 'embers=0.3,0.8,0.6', tint: 'rgba(20,10,40,0.35)', title: 'NO NEWS', titleAt: 0.6, text: 'A harbour at the far side of the world. He never came back from it.', textAt: 1.4, sound: [['gong', 0.3, 0.5]] },
        { bg: 'joncour_home', dur: 5.5, cam: [[1.1, 0.5, 0.5], [1.6, 0.5, 0.4]], tint: 'rgba(10,14,40,0.5)', fx: 'stars=0.37,0.21,0.26,0.14,30', sprites: [{ id: 'helene', x: 0.5, y: 0.02, h: 0.64, expr: 'sad', filter: 'brightness(0.75) saturate(0.7)' }], text: 'She waited at the window.', textAt: 1 },
        { bg: 'garden_winter', dur: 4.5, cam: [[1.3, 0.3, 0.45], [1.05, 0.5, 0.5]], fx: 'snow=2', text: 'Weeks became months.', textAt: 0.6, trans: 'black' },
        { bg: 'helene_garden', dur: 4.5, cam: [[1.05, 0.5, 0.5], [1.25, 0.2, 0.5]], tint: 'rgba(60,40,20,0.4)', fx: 'leaves=1.8', text: 'Months became years.', textAt: 0.6, trans: 'black' },
        { bg: 'cemetery_grey', dur: 7, cam: [[1.45, 0.5, 0.58], [1.0, 0.5, 0.5]], fx: 'rain=1.6', kanji: '消', text: 'She died believing he had chosen another life.', textAt: 1.8, trans: 'black', sound: [['thunder', 3.2, 0.5], ['bell', 5, 0.4]] },
      ],
    },
    end_endless_journey: {
      shots: [
        { bg: 'forest_camp_night', dur: 4.5, cam: [[1.1, 0.43, 0.7], [1.8, 0.43, 0.75]], fx: 'embers=0.429,0.8,2 ash=1', tint: 'rgba(80,0,0,0.3)', flash: [0.5, 1.4, 2.2], shake: [[0.5, 1.4], [1.4, 1], [2.2, 1.2]], text: 'The forest kept him.', textAt: 2.6, sound: [['sword', 0.2, 0.8], ['sting', 0.5, 0.8], ['shouts', 0.9, 0.7], ['heartbeat_fast', 2, 0.6]] },
        { bg: 'japan_path', dur: 5, cam: [[1.4, 0.5, 0.3], [1.05, 0.5, 0.55]], tint: 'rgba(20,20,40,0.45)', fx: 'mist=0.55,0.3,0.4,#c8d0e0 fireflies=0,0.6,1,0.3,20', text: 'His journey never ended. It only stopped.', textAt: 1, trans: 'black', sound: [['wind_gust', 0.3, 0.6]] },
        { bg: 'joncour_home', dur: 5, cam: [[1.1, 0.5, 0.5], [1.5, 0.5, 0.38]], tint: 'rgba(10,14,40,0.5)', sprites: [{ id: 'helene', x: 0.5, y: 0.02, h: 0.64, expr: 'sad', filter: 'brightness(0.72) saturate(0.7)' }], text: 'In France, a lamp burned at a window for years.', textAt: 1 },
        { bg: 'cemetery_night', dur: 7, cam: [[1.2, 0.3, 0.55], [1.35, 0.78, 0.3]], fx: 'fireflies=0.05,0.6,0.9,0.3,30', kanji: '旅', text: 'She never learned the truth.', textAt: 2, trans: 'black', sound: [['gong', 1.4, 0.5]] },
      ],
    },
    end_left_behind: {
      shots: [
        { bg: 'yuki_house', dur: 5.5, cam: [[1.08, 0.5, 0.5], [1.5, 0.5, 0.6]], fx: 'rain=1.6,0.208,0.14,0.583,0.585', text: 'The rain sounded like someone whispering.', textAt: 1.2, sound: [['thunder', 3, 0.4]] },
        { bg: 'yuki_house', dur: 5, cam: [[1.6, 0.14, 0.72], [1.2, 0.3, 0.7]], tint: 'rgba(10,14,30,0.5)', fx: 'mist=0.62,0.2,0.4,#b8c4c8', text: 'She did not come back.', textAt: 1, trans: 'black', sound: [['door', 0.4, 0.6]] },
        { bg: 'joncour_home', dur: 5, cam: [[1.4, 0.5, 0.45], [1.1, 0.5, 0.5]], tint: 'rgba(90,60,20,0.35)', sprites: [{ id: 'helene', x: 0.3, y: 0.02, h: 0.6, expr: 'soft', filter: 'sepia(0.7) brightness(0.9)', opacity: 0.8 }], text: 'He thought of France. Of Hélène. Of the home he abandoned.', textAt: 0.8, trans: 'white', flash: [0.1], sound: [['heartbeat', 1.4, 0.5]] },
        { bg: 'garden_winter', dur: 5, cam: [[1.05, 0.5, 0.5], [1.4, 0.2, 0.4]], fx: 'snow=1.6', tint: 'rgba(40,40,60,0.3)', text: 'A garden he would never see grow.', textAt: 0.8, trans: 'black' },
        { bg: 'yuki_house', dur: 7, cam: [[1.5, 0.5, 0.6], [1.0, 0.5, 0.5]], tint: 'rgba(0,0,10,0.6)', fx: 'rain=1,0.208,0.14,0.583,0.585', kanji: '空', text: 'He had crossed the world for a woman who never asked him to come.', textAt: 1.6, trans: 'black', sound: [['candle_out', 4.6, 0.6], ['gong', 5.2, 0.4]] },
      ],
    },
    end_home: {
      shots: [
        { bg: 'cemetery', dur: 6, cam: [[1.7, 0.5, 0.85], [1.15, 0.5, 0.6]], fx: 'petals=1.4 birds=4,0.08,0.3 motes=0.2,0.5,0.6,0.4,40,#ffe0a0', title: 'HOME', titleAt: 0.8, text: 'The journey was finally over.', textAt: 2, sound: [['wind_gust', 0.3, 0.5], ['chime', 2, 0.5]] },
        { bg: 'helene_garden', dur: 6, cam: [[1.08, 0.5, 0.5], [1.35, 0.55, 0.45]], fx: 'petals=1.8 fireflies=0.05,0.45,0.9,0.4,30 glints=0.49,0.67,0.33,0.12,30', sprites: [{ id: 'helene', x: 0.52, y: 0.02, h: 0.62, expr: 'smile', filter: 'brightness(1.1) sepia(0.15)', opacity: 0.9 }], text: 'Look at whoever is beside you.', textAt: 1.4, trans: 'white', flash: [0.1], sound: [['swell', 0.2, 0.7], ['sparkle', 1.4, 0.7]] },
        { bg: 'garden_winter', dur: 4.5, cam: [[1.3, 0.2, 0.4], [1.06, 0.5, 0.5]], fx: 'snow=1.2', tint: 'rgba(255,220,180,0.15)', text: 'The trees she watched him plant.', textAt: 0.8 },
        { bg: 'cemetery', dur: 7, cam: [[1.1, 0.5, 0.45], [1.0, 0.5, 0.5]], fx: 'petals=1 rays=0.3,0.2,1.2,0.6,#ffe0b0 motes=0.1,0.3,0.8,0.5,50,#fff0c8', kanji: '帰', text: 'For the first time in many years, he was exactly where he was.', textAt: 1.6, trans: 'white', sound: [['temple_bell', 1, 0.6], ['swell', 4, 0.6]] },
      ],
    },
  };
})();
