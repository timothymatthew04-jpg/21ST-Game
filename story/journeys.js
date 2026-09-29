/*
 * ============================================================================
 *  SILK — the Road East
 * ============================================================================
 *
 *  The script plays a journey with a line like:   journey first
 *
 *  Each journey follows Hervé's route across the map (route: 'out' to Japan, 'home' back to
 *  France) and stops at some towns for an event, keyed by the town: metz, vienna, budapest, kiev,
 *  steppe, urals, siberia, baikal, amur, sabirk (and the rest of the route in story/cutscenes.js).
 *
 *  An event has a title, a text, and options. An option can have:
 *    cost    'francs:30' or 'item:watch' (it can't be chosen without it)
 *    need    'item:pass' — only offered if Hervé has it
 *    add     { danger: 1, fever: 1, days: 4 } — added to story variables
 *    set     { road: 'north' } — story variables set outright
 *    result  what happened, in Hervé's words
 *
 *  The variables the journeys use: days (days lost on the road), fever (how ill the road has made
 *  him), danger, eggs_care (how well the eggs were kept on the way home), road (the second
 *  journey's road east: north or south).
 * ============================================================================
 */
window.VN_JOURNEYS = {
  // ---------------------------------------------------------------- Chapter 2: the first journey
  first: {
    route: 'out', zoom: 1.9, travel: 17,
    caption: 'To the end of the world, and a country that did not want him.',
    events: {
      metz: {
        title: 'The border at Metz',
        text: 'A customs officer wanted to know why a young man with a soldier\'s haircut was carrying so much money east. He wanted to count it. Slowly.',
        options: [
          { text: 'Pay his "fee" and go.', cost: 'francs:20', result: 'He counted the fee much faster than he would have counted the rest.' },
          { text: 'Show him Baldabiou\'s letter of credit.', add: { days: 2 }, result: 'The letter needed a stamp, and the man with the stamp was in Nancy. I waited two days.' },
          { text: 'Argue.', add: { danger: 1, days: 1 }, result: 'I argued. He wrote my name in a book. It was the first of many books my name went into.' },
        ],
      },
      steppe: {
        title: 'A storm on the steppe',
        text: 'The sky went the colour of a bruise. There was nothing out there to shelter behind but a village of six houses, a day\'s ride behind me.',
        options: [
          { text: 'Ride on through it.', add: { fever: 1 }, result: 'I rode through it. I rode through the fever that came after it, too.' },
          { text: 'Ride back and wait it out.', cost: 'francs:10', add: { days: 4 }, result: 'Four days by a stove, paying for soup I could not understand the name of. The storm went by without me.' },
        ],
      },
      baikal: {
        title: 'Lake Baikal',
        text: 'The lake was frozen. The shore road was a week long. Across the ice, the village on the far side was two days away. The ice creaked.',
        options: [
          { text: 'Cross on the ice.', add: { danger: 1, days: -3 }, result: 'The ice sang under the horse the whole way across, a long low note, like a cello. I did not breathe properly for two days.' },
          { text: 'Take the shore road.', add: { days: 5 }, result: 'Five more days of shore. I learned the names of three kinds of birch.' },
        ],
      },
    },
  },

  // ---------------------------------------------------------------- Chapter 5: home with the eggs
  home: {
    route: 'home', zoom: 1.8, travel: 14, ink: '#5a3a2a',
    caption: 'Across the whole world again, the eggs kept cool and counted every day.',
    events: {
      amur: {
        title: 'Heat in the hold',
        text: 'The river boat was hot below deck. The eggs had to stay cool, or they would hatch too soon and die on the way.',
        options: [
          { text: 'Carry the boxes up every night to air them.', add: { eggs_care: 1, days: 2 }, result: 'Every night, the boxes up the ladder; every morning, back down. The boatmen thought I was mad.' },
          { text: 'Leave them where they are.', add: { eggs_care: -1 }, result: 'I left them in the heat, and told myself they had come from Japan in worse.' },
        ],
      },
      baikal: {
        title: 'Frost',
        text: 'A night so cold the horse\'s breath froze on its muzzle. Frost would kill the eggs as surely as heat.',
        options: [
          { text: 'Wrap the boxes in your own coat.', add: { eggs_care: 1, fever: 1 }, result: 'The eggs slept warm. I did not sleep at all, and coughed until Kiev.' },
          { text: 'Keep your coat. They are packed well enough.', add: { eggs_care: -1 }, result: 'In the morning some of the paper sheets had gone stiff. I did not look closely.' },
        ],
      },
      kiev: {
        title: 'Damp at Kiev',
        text: 'Three days of rain. The mulberry leaves lining the boxes had gone soft and dark.',
        options: [
          { text: 'Buy fresh leaves at the market.', cost: 'francs:10', add: { eggs_care: 1 }, result: 'Dry leaves, green and sweet-smelling. The woman who sold them would not tell me where she had found them in October.' },
          { text: 'Ride on and hope.', add: { eggs_care: -1 }, result: 'I rode on, and hoped, which is what you do when you have not done anything.' },
        ],
      },
    },
  },

  // ---------------------------------------------------------------- Chapter 6: the second journey
  second: {
    route: 'out', zoom: 1.9, travel: 14, fx: 'snow=0.6',
    caption: 'The second journey. Winter, all the way.',
    events: {
      kiev: {
        title: 'Winter at Kiev',
        text: 'The furriers of Kiev looked at my French coat the way doctors look at a wound.',
        options: [
          { text: 'Buy a fur coat.', cost: 'francs:15', result: 'It smelled of the animal it had been. It kept me alive, and I stopped minding the smell.' },
          { text: 'Keep your own coat.', add: { fever: 1 }, result: 'My own coat was very elegant. I was cold in it from Kiev to the Amur.' },
        ],
      },
      urals: {
        title: 'Two roads east',
        text: 'Past the Urals the road split. The northern road ran through the forest, a week shorter. They said there were riders on it who were not soldiers and not traders. The southern road went the long way round.',
        options: [
          { text: 'Take the northern road.', set: { road: 'north' }, result: 'I took the northern road. For three days I saw nobody at all, which is worse than seeing someone.' },
          { text: 'Take the southern road.', set: { road: 'south' }, add: { days: 8 }, result: 'Eight more days. Villages, wells, dogs, the long way round. Nobody chased me. I was almost disappointed.' },
        ],
      },
      amur: {
        title: 'A boy on the Amur',
        text: 'At a ferry on the Amur a boy took my horse\'s bridle and would not let go. His mother was ill, he said. He said it in four languages, one of which was French.',
        options: [
          { text: 'Give him some money.', cost: 'francs:10', add: { helene_trust: 1 }, result: 'He ran off with it before I could change my mind. I thought of Hélène, for some reason, all the way to the coast.' },
          { text: 'Pull the bridle free and ride on.', result: 'He let go. He did not shout after me. I would have preferred it if he had.' },
        ],
      },
    },
  },

  // ---------------------------------------------------------------- Chapter 10: the third journey
  third: {
    route: 'out', zoom: 2, travel: 14, ink: '#6a1a10', fx: 'rain=0.7',
    caption: 'A third time.',
    events: {
      budapest: {
        title: 'News from the East',
        text: 'A tea trader at the station in Budapest heard where I was going and put down his cup. "Japan? There is war in Japan now. They are killing foreigners on the roads."',
        options: [
          { text: 'Ask him everything he knows.', add: { mystery: 1 }, result: 'Warships in the bays. Lords turning on the Shogun. Foreigners hunted on the roads. I thanked him, and bought my ticket east anyway.' },
          { text: 'Thank him and walk away.', result: 'I walked away. I did not want to know yet. Knowing would not have changed the ticket in my hand.' },
        ],
      },
      siberia: {
        title: 'The river in flood',
        text: 'The spring rains had turned a river I had forded twice into a brown sea. A ferryman had a raft and a price.',
        options: [
          { text: 'Pay the ferryman double.', cost: 'francs:30', result: 'He took me across standing up, as calmly as a man crossing a street. On the far side he asked for more. I did not give it to him.' },
          { text: 'Swim the horse across.', add: { fever: 1, danger: 1 }, result: 'The horse swam; I held on. On the far bank I lay in the mud for an hour, shaking, and did not know whether from the cold.' },
          { text: 'Wait for the water to fall.', add: { days: 6 }, result: 'Six days on the bank, watching the water. It fell, a finger\'s width a day.' },
        ],
      },
      sabirk: {
        title: 'The smugglers of Sabirk',
        text: 'The boats would not sail for Japan any more. The war frightened even the smugglers. One captain would, for a price, or for the right piece of paper.',
        options: [
          { text: 'Show him Hara Kei\'s pass.', need: 'item:pass', result: 'He looked at the red seal a long time. Then he went pale, and gave me his own cabin.' },
          { text: 'Pay him.', cost: 'francs:80', result: 'Eighty francs. He counted them twice, and put me in the hold with the barrels.' },
          { text: 'Stow away in the hold.', add: { danger: 2 }, result: 'Three nights in the dark between the barrels, listening to the crew arguing about what they would do with a stowaway.' },
        ],
      },
    },
  },
};
