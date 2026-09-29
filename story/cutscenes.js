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
  const out = () => OUT.map((k) => ({ ...P[k] }));
  // the way home: the same stops backwards, the sea crossing now at the start
  const home = () => {
    const back = OUT.slice().reverse().map((k) => ({ ...P[k], sea: false }));
    back[2].sea = true; back[3].sea = true; // on to the strait and Sabirk by sea
    return back;
  };

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

    // ---------------------------------------------------------------- Chapter 10: war
    war: {
      shots: [
        { bg: 'cs_warships', dur: 6, cam: [[1.15, 0.4, 0.55], [1.3, 0.5, 0.6]], tint: 'rgba(10,6,30,0.45)', fx: 'embers=0.39,0.7,1 smoke=0.39,0.66,1,#1a1010', flash: [1.2, 2.6, 3.4, 4.7], shake: [[1.2, 1.2], [2.6, 0.8], [4.7, 1.3]], sound: [['horn', 0.1, 0.8], ['cannon', 1.2, 0.9], ['cannon', 2.6, 0.7], ['volley', 3, 0.6], ['cannon', 3.4, 0.5], ['explosion', 4.7, 0.8]], text: 'In Japan, the war had come.', textAt: 1.6 },
        { bg: 'estate_unrest', dur: 5, cam: [[1.3, 0.35, 0.5], [1.1, 0.55, 0.55]], tint: 'rgba(70,14,0,0.3)', fx: 'embers=0.5,0.8,1.6 smoke=0.5,0.7,1,#1a1010', flash: [1.9], shake: [[1.9, 1.3]], sound: [['shouts', 0.1, 0.9], ['shell', 0.6, 0.9], ['volley', 2.7, 0.8], ['drumroll', 3.2, 0.5]], text: 'Villages burned. Foreigners were hunted on the roads.', textAt: 0.6 },
        { bg: 'estate_unrest', dur: 4.5, cam: [[1.1, 0.5, 0.5], [1.3, 0.6, 0.6]], fx: 'embers=0.5,0.8,1.2 ash=0.8', trans: 'white', sound: [['wind_gust', 0.2, 0.6], ['musket', 1.4, 0.5], ['musket', 2.3, 0.35]] },
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
    end_beside: {
      shots: [
        { bg: 'cemetery', dur: 7, cam: [[1.25, 0.5, 0.72], [1.08, 0.5, 0.28]], fx: 'petals=0.5 birds=3,0.08,0.3', text: 'Beside me, all along.', textAt: 2.5, sound: [['chime', 3, 0.5]] },
      ],
    },
    end_silence: {
      shots: [
        { bg: 'cemetery_grey', dur: 7, cam: [[1.45, 0.5, 0.58], [1.0, 0.5, 0.5]], text: 'Some things are told best in silence.', textAt: 2.5 },
      ],
    },
    end_distance: {
      shots: [
        { bg: 'cemetery_night', dur: 7, cam: [[1.2, 0.3, 0.55], [1.35, 0.78, 0.3]], text: 'Some evenings I still look east.', textAt: 2.5, sound: [['wind_gust', 1, 0.5]] },
      ],
    },
  };
})();
