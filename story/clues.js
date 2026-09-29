/*
 * ============================================================================
 *  SILK — the clue board
 * ============================================================================
 *
 *  Across the story there are small things to notice: a glint in the scene, placed with a line
 *  like   clue ink 0.52 0.62 "Ink on her fingers" "Black ink, not the blue she used..."
 *  Clicking it notes the clue. In Chapter 17, before the truth is read, the board below asks
 *  what Hervé had not wanted to see (the script:  clueboard into truth_seen ). All three right
 *  sets truth_seen to "all", and the ending has a scene of its own.
 * ============================================================================
 */
window.VN_CLUEBOARD = {
  title: 'What had I not wanted to see?',
  intro: 'The strips of paper lay across my knees. Before I let myself read them, I made myself think.',
  questions: [
    { q: 'Who wrote the last letter?', options: ['The woman in Japan', 'Hara Kei', 'Hélène', 'Madame Blanche'], answer: 2 },
    { q: 'Who put it into Japanese for her?', options: ['Hara Kei', 'Madame Blanche', 'Baldabiou', 'No one: she wrote it herself'], answer: 1 },
    { q: 'Why did she write it?', options: ['To punish me', 'To bring me home', 'To be free of me', 'To see what I would do'], answer: 1 },
  ],
  results: {
    all: 'I had known. Somewhere in me, for years, I had known, and I had let myself not see.',
    some: 'Some of it I had seen. The rest I had turned away from.',
    none: 'I had not seen any of it. I had not let myself.',
  },
};
