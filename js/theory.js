// Music theory core: notes, modes, spelling, chords.
const Theory = (() => {
  const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];

  // Ordered by the white-key they start on (C D E F G A B).
  const MODES = [
    {
      id: 'ionian', name: 'Ionian', degree: 1, whiteKey: 'C', steps: [0, 2, 4, 5, 7, 9, 11],
      brightness: 6, color: '#ffb347', today: 'Major scale',
      mood: 'Bright, settled, "happy ending"',
      emoji: '☀️',
      signature: { degree: 7, label: 'natural 7 (leading tone)', why: 'The 7th is a half-step below the root and pulls hard back home. That pull is what made Ionian the winner.' },
      compare: 'This IS the major scale.',
      vamp: [[1], [4], [5], [1]],
      songs: ['"Twinkle Twinkle Little Star"', 'Most pop choruses', '"Let It Be" (The Beatles)'],
    },
    {
      id: 'dorian', name: 'Dorian', degree: 2, whiteKey: 'D', steps: [0, 2, 3, 5, 7, 9, 10],
      brightness: 4, color: '#4dd0c8', today: 'Minor with a raised 6th',
      mood: 'Cool, soulful, hopeful-minor',
      emoji: '😎',
      signature: { degree: 6, label: 'major 6th', why: 'A minor scale whose 6th is NOT lowered. That one bright note gives minor a hopeful, funky lift.' },
      compare: 'Natural minor, but with a raised 6th.',
      vamp: [[1], [4], [1], [4]],
      songs: ['"Scarborough Fair" (trad.)', '"So What" (Miles Davis)', '"Oye Como Va" (Santana)', '"Eleanor Rigby" (The Beatles)'],
    },
    {
      id: 'phrygian', name: 'Phrygian', degree: 3, whiteKey: 'E', steps: [0, 1, 3, 5, 7, 8, 10],
      brightness: 2, color: '#b06cf0', today: 'Minor with a lowered 2nd',
      mood: 'Dark, Spanish, menacing',
      emoji: '🗡️',
      signature: { degree: 2, label: 'minor 2nd', why: 'The 2nd sits a half-step above the root, a tense "sting" heard in flamenco and metal.' },
      compare: 'Natural minor, but with a lowered 2nd.',
      vamp: [[1], [2], [1], [2]],
      songs: ['Flamenco guitar music', '"Wherever I May Roam" (Metallica)', 'Lots of film villain themes'],
    },
    {
      id: 'lydian', name: 'Lydian', degree: 4, whiteKey: 'F', steps: [0, 2, 4, 6, 7, 9, 11],
      brightness: 7, color: '#ffe14d', today: 'Major with a raised 4th',
      mood: 'Dreamy, floating, magical',
      emoji: '✨',
      signature: { degree: 4, label: 'augmented 4th', why: 'Raising the 4th removes the one "heavy" note of major, so it floats and never quite lands.' },
      compare: 'Major scale, but with a raised 4th.',
      vamp: [[1], [2], [1], [2]],
      songs: ['"The Simpsons" theme (Danny Elfman)', '"Flying in a Blue Dream" (Joe Satriani)', 'Many John Williams flying/wonder scenes'],
    },
    {
      id: 'mixolydian', name: 'Mixolydian', degree: 5, whiteKey: 'G', steps: [0, 2, 4, 5, 7, 9, 10],
      brightness: 5, color: '#ff7f50', today: 'Major with a lowered 7th',
      mood: 'Bluesy, rock, laid-back major',
      emoji: '🎸',
      signature: { degree: 7, label: 'minor 7th', why: 'Major, but the 7th is lowered, so there is no leading tone. It sounds relaxed and rocking instead of "resolved".' },
      compare: 'Major scale, but with a lowered 7th.',
      vamp: [[1], [7], [4], [1]],
      songs: ['"Norwegian Wood" (The Beatles)', '"Sweet Home Alabama" (Lynyrd Skynyrd)', 'Celtic fiddle tunes'],
    },
    {
      id: 'aeolian', name: 'Aeolian', degree: 6, whiteKey: 'A', steps: [0, 2, 3, 5, 7, 8, 10],
      brightness: 3, color: '#5b8def', today: 'Natural minor scale',
      mood: 'Sad, serious, epic',
      emoji: '🌧️',
      signature: { degree: 6, label: 'minor 6th', why: 'The lowered 6th (compare Dorian) gives natural minor its melancholy weight.' },
      compare: 'This IS the natural minor scale.',
      vamp: [[1], [6], [7], [1]],
      songs: ['"Losing My Religion" (R.E.M.)', '"All Along the Watchtower" (Dylan/Hendrix)', 'Most sad pop ballads'],
    },
    {
      id: 'locrian', name: 'Locrian', degree: 7, whiteKey: 'B', steps: [0, 1, 3, 5, 6, 8, 10],
      brightness: 1, color: '#9aa0b4', today: '(Almost never used)',
      mood: 'Unstable, eerie, unresolved',
      emoji: '👻',
      signature: { degree: 5, label: 'diminished 5th', why: 'Its 5th is a tritone, so even the home chord is unstable. Medieval theorists skipped it entirely.' },
      compare: 'Phrygian, but the 5th is lowered too.',
      vamp: [[1], [2], [1], [2]],
      songs: ['"Army of Me" (Björk), roughly', 'Some extreme-metal riffs', 'Mostly theory books 😄'],
    },
  ];

  const BY_ID = Object.fromEntries(MODES.map(m => [m.id, m]));
  const BRIGHTNESS_ORDER = [...MODES].sort((a, b) => b.brightness - a.brightness);

  const STEP_NAMES = (steps) => {
    const out = [];
    for (let i = 0; i < 7; i++) {
      const a = steps[i], b = i === 6 ? 12 : steps[i + 1];
      out.push(b - a === 1 ? 'H' : 'W');
    }
    return out;
  };

  function parseNote(name) {
    const letter = name[0].toUpperCase();
    const li = LETTERS.indexOf(letter);
    let acc = 0;
    for (const ch of name.slice(1)) {
      if (ch === '#' || ch === '♯') acc++;
      if (ch === 'b' || ch === '♭') acc--;
    }
    return { li, pc: (LETTER_PC[li] + acc + 12) % 12, acc };
  }

  function accStr(acc) {
    return acc === 0 ? '' : acc > 0 ? '♯'.repeat(acc) : '♭'.repeat(-acc);
  }

  // Spell a scale correctly (one letter per degree).
  function spell(rootName, steps) {
    const r = parseNote(rootName);
    return steps.map((iv, i) => {
      const li = (r.li + i) % 7;
      const target = (r.pc + iv) % 12;
      let acc = target - LETTER_PC[li];
      if (acc > 6) acc -= 12;
      if (acc < -6) acc += 12;
      return LETTERS[li] + accStr(acc);
    });
  }

  // MIDI notes for a scale starting at root in octave 4 (C4 = 60).
  function scaleMidi(rootName, steps, octave = 4) {
    const r = parseNote(rootName);
    const base = 12 * (octave + 1) + r.pc;
    return steps.map(s => base + s);
  }

  // Triad on scale degree (1-based) within a mode.
  function triad(rootMidi, steps, degree) {
    const i = degree - 1;
    const notes = [0, 2, 4].map(k => {
      const idx = i + k;
      return rootMidi + steps[idx % 7] + 12 * Math.floor(idx / 7);
    });
    return notes;
  }

  function triadQuality(steps, degree) {
    const t = triad(0, steps, degree);
    const a = t[1] - t[0], b = t[2] - t[0];
    if (a === 4 && b === 7) return '';
    if (a === 3 && b === 7) return 'm';
    if (a === 3 && b === 6) return '°';
    if (a === 4 && b === 8) return '+';
    return '?';
  }

  function chordName(rootName, steps, degree) {
    const names = spell(rootName, steps);
    return names[degree - 1] + triadQuality(steps, degree);
  }

  const PC_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
  const pcName = (pc) => PC_NAMES[((pc % 12) + 12) % 12];

  const DEGREE_LABELS = (steps) => {
    const major = [0, 2, 4, 5, 7, 9, 11];
    return steps.map((s, i) => {
      const d = s - major[i];
      return (d < 0 ? '♭' : d > 0 ? '♯' : '') + (i + 1);
    });
  };

  return {
    MODES, BY_ID, BRIGHTNESS_ORDER, LETTERS, STEP_NAMES, spell, scaleMidi, triad,
    triadQuality, chordName, parseNote, pcName, DEGREE_LABELS,
  };
})();
