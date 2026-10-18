// Music theory core: notes, modes, spelling, chords.
// Internally notes are spelled in English (B, B♭); dispNote() converts for display (German: H, B).
const Theory = (() => {
  const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];

  // Ordered by the white-key they start on (C D E F G A B).
  const MODES = [
    {
      id: 'ionian', name: tr('Ionian', 'Ionisch'), degree: 1, whiteKey: 'C', steps: [0, 2, 4, 5, 7, 9, 11],
      brightness: 6, color: '#ffb347', today: tr('Major scale', 'Dur-Tonleiter'),
      mood: tr('Bright, settled, "happy ending"', 'Hell, gefestigt, „Happy End“'),
      emoji: '☀️',
      signature: {
        degree: 7, label: tr('natural 7 (leading tone)', 'große Septime (Leitton)'),
        why: tr('The 7th is a half-step below the root and pulls hard back home. That pull is what made Ionian the winner.',
          'Die 7. Stufe liegt einen Halbton unter dem Grundton und zieht stark nach Hause. Genau dieser Zug hat Ionisch zum Gewinner gemacht.'),
      },
      compare: tr('This IS the major scale.', 'Das IST die Dur-Tonleiter.'),
      vamp: [[1], [4], [5], [1]],
      songs: [tr('"Twinkle Twinkle Little Star"', '„Morgen kommt der Weihnachtsmann“'), tr('Most pop choruses', 'Die meisten Pop-Refrains'), tr('"Let It Be" (The Beatles)', '„Let It Be“ (The Beatles)')],
    },
    {
      id: 'dorian', name: tr('Dorian', 'Dorisch'), degree: 2, whiteKey: 'D', steps: [0, 2, 3, 5, 7, 9, 10],
      brightness: 4, color: '#4dd0c8', today: tr('Minor with a raised 6th', 'Moll mit erhöhter 6. Stufe'),
      mood: tr('Cool, soulful, hopeful-minor', 'Cool, soulig, hoffnungsvolles Moll'),
      emoji: '😎',
      signature: {
        degree: 6, label: tr('major 6th', 'große Sexte'),
        why: tr('A minor scale whose 6th is NOT lowered. That one bright note gives minor a hopeful, funky lift.',
          'Eine Moll-Tonleiter, deren 6. Stufe NICHT erniedrigt ist. Dieser eine helle Ton gibt dem Moll einen hoffnungsvollen, funky Schwung.'),
      },
      compare: tr('Natural minor, but with a raised 6th.', 'Natürliches Moll, aber mit erhöhter 6. Stufe.'),
      vamp: [[1], [4], [1], [4]],
      songs: [tr('"Scarborough Fair" (trad.)', '„Scarborough Fair“ (trad.)'), tr('"So What" (Miles Davis)', '„So What“ (Miles Davis)'), tr('"Oye Como Va" (Santana)', '„Oye Como Va“ (Santana)'), tr('"Eleanor Rigby" (The Beatles)', '„Eleanor Rigby“ (The Beatles)')],
    },
    {
      id: 'phrygian', name: tr('Phrygian', 'Phrygisch'), degree: 3, whiteKey: 'E', steps: [0, 1, 3, 5, 7, 8, 10],
      brightness: 2, color: '#b06cf0', today: tr('Minor with a lowered 2nd', 'Moll mit erniedrigter 2. Stufe'),
      mood: tr('Dark, Spanish, menacing', 'Dunkel, spanisch, bedrohlich'),
      emoji: '🗡️',
      signature: {
        degree: 2, label: tr('minor 2nd', 'kleine Sekunde'),
        why: tr('The 2nd sits a half-step above the root, a tense "sting" heard in flamenco and metal.',
          'Die 2. Stufe liegt nur einen Halbton über dem Grundton: ein angespannter „Stich“, den man aus Flamenco und Metal kennt.'),
      },
      compare: tr('Natural minor, but with a lowered 2nd.', 'Natürliches Moll, aber mit erniedrigter 2. Stufe.'),
      vamp: [[1], [2], [1], [2]],
      songs: [tr('Flamenco guitar music', 'Flamenco-Gitarre'), tr('"Wherever I May Roam" (Metallica)', '„Wherever I May Roam“ (Metallica)'), tr('Lots of film villain themes', 'Viele Bösewicht-Themen im Film')],
    },
    {
      id: 'lydian', name: tr('Lydian', 'Lydisch'), degree: 4, whiteKey: 'F', steps: [0, 2, 4, 6, 7, 9, 11],
      brightness: 7, color: '#ffe14d', today: tr('Major with a raised 4th', 'Dur mit erhöhter 4. Stufe'),
      mood: tr('Dreamy, floating, magical', 'Verträumt, schwebend, magisch'),
      emoji: '✨',
      signature: {
        degree: 4, label: tr('augmented 4th', 'übermäßige Quarte'),
        why: tr('Raising the 4th removes the one "heavy" note of major, so it floats and never quite lands.',
          'Die erhöhte Quarte entfernt den einen „schweren“ Ton von Dur. Dadurch schwebt es und landet nie ganz.'),
      },
      compare: tr('Major scale, but with a raised 4th.', 'Dur-Tonleiter, aber mit erhöhter 4. Stufe.'),
      vamp: [[1], [2], [1], [2]],
      songs: [tr('"The Simpsons" theme (Danny Elfman)', '„Die Simpsons“-Titelmelodie (Danny Elfman)'), tr('"Flying in a Blue Dream" (Joe Satriani)', '„Flying in a Blue Dream“ (Joe Satriani)'), tr('Many John Williams flying/wonder scenes', 'Viele Flug- und Staun-Szenen von John Williams')],
    },
    {
      id: 'mixolydian', name: tr('Mixolydian', 'Mixolydisch'), degree: 5, whiteKey: 'G', steps: [0, 2, 4, 5, 7, 9, 10],
      brightness: 5, color: '#ff7f50', today: tr('Major with a lowered 7th', 'Dur mit erniedrigter 7. Stufe'),
      mood: tr('Bluesy, rock, laid-back major', 'Bluesig, rockig, entspanntes Dur'),
      emoji: '🎸',
      signature: {
        degree: 7, label: tr('minor 7th', 'kleine Septime'),
        why: tr('Major, but the 7th is lowered, so there is no leading tone. It sounds relaxed and rocking instead of "resolved".',
          'Dur, aber mit erniedrigter 7. Stufe, also ohne Leitton. Klingt locker und rockig statt „aufgelöst“.'),
      },
      compare: tr('Major scale, but with a lowered 7th.', 'Dur-Tonleiter, aber mit erniedrigter 7. Stufe.'),
      vamp: [[1], [7], [4], [1]],
      songs: [tr('"Norwegian Wood" (The Beatles)', '„Norwegian Wood“ (The Beatles)'), tr('"Sweet Home Alabama" (Lynyrd Skynyrd)', '„Sweet Home Alabama“ (Lynyrd Skynyrd)'), tr('Celtic fiddle tunes', 'Keltische Fiddle-Melodien')],
    },
    {
      id: 'aeolian', name: tr('Aeolian', 'Äolisch'), degree: 6, whiteKey: 'A', steps: [0, 2, 3, 5, 7, 8, 10],
      brightness: 3, color: '#5b8def', today: tr('Natural minor scale', 'Natürliche Moll-Tonleiter'),
      mood: tr('Sad, serious, epic', 'Traurig, ernst, episch'),
      emoji: '🌧️',
      signature: {
        degree: 6, label: tr('minor 6th', 'kleine Sexte'),
        why: tr('The lowered 6th (compare Dorian) gives natural minor its melancholy weight.',
          'Die erniedrigte 6. Stufe (im Vergleich zu Dorisch) gibt dem natürlichen Moll seine melancholische Schwere.'),
      },
      compare: tr('This IS the natural minor scale.', 'Das IST die natürliche Moll-Tonleiter.'),
      vamp: [[1], [6], [7], [1]],
      songs: [tr('"Losing My Religion" (R.E.M.)', '„Losing My Religion“ (R.E.M.)'), tr('"All Along the Watchtower" (Dylan/Hendrix)', '„All Along the Watchtower“ (Dylan/Hendrix)'), tr('Most sad pop ballads', 'Die meisten traurigen Pop-Balladen')],
    },
    {
      id: 'locrian', name: tr('Locrian', 'Lokrisch'), degree: 7, whiteKey: 'B', steps: [0, 1, 3, 5, 6, 8, 10],
      brightness: 1, color: '#9aa0b4', today: tr('(Almost never used)', '(Fast nie verwendet)'),
      mood: tr('Unstable, eerie, unresolved', 'Instabil, unheimlich, unaufgelöst'),
      emoji: '👻',
      signature: {
        degree: 5, label: tr('diminished 5th', 'verminderte Quinte'),
        why: tr('Its 5th is a tritone, so even the home chord is unstable. Medieval theorists skipped it entirely.',
          'Seine Quinte ist ein Tritonus, deshalb ist schon der Grundakkord instabil. Die mittelalterlichen Theoretiker haben ihn komplett ausgelassen.'),
      },
      compare: tr('Phrygian, but the 5th is lowered too.', 'Phrygisch, aber zusätzlich mit erniedrigter Quinte.'),
      vamp: [[1], [2], [1], [2]],
      songs: [tr('"Army of Me" (Björk), roughly', '„Army of Me“ (Björk), ungefähr'), tr('Some extreme-metal riffs', 'Manche Extreme-Metal-Riffs'), tr('Mostly theory books 😄', 'Vor allem Theoriebücher 😄')],
    },
  ];

  const BY_ID = Object.fromEntries(MODES.map(m => [m.id, m]));
  const BRIGHTNESS_ORDER = [...MODES].sort((a, b) => b.brightness - a.brightness);

  // W/H in English, G (Ganzton) / H (Halbton) in German.
  const STEP_NAMES = (steps) => {
    const out = [];
    for (let i = 0; i < 7; i++) {
      const a = steps[i], b = i === 6 ? 12 : steps[i + 1];
      out.push(b - a === 1 ? 'H' : tr('W', 'G'));
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

  // Display name for one internally-spelled note. German: B → H, B♭ → B, F♯ → Fis, E♭ → Es, A♭ → As…
  function dispNote(n) {
    if (I18N.lang() !== 'de' || !n) return n;
    const { acc } = parseNote(n);
    const L = n[0];
    if (acc > 0) return (L === 'B' ? 'H' : L) + 'is'.repeat(acc);
    if (acc === 0) return L === 'B' ? 'H' : L;
    if (L === 'B') return acc === -1 ? 'B' : 'Heses';
    if (L === 'E') return 'Es' + 'es'.repeat(-acc - 1);
    if (L === 'A') return 'As' + 'as'.repeat(-acc - 1);
    return L + 'es'.repeat(-acc);
  }

  // Spell a scale correctly (one letter per degree). Internal spelling.
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
  const spellD = (rootName, steps) => spell(rootName, steps).map(dispNote);

  // "C major" / "C-Dur", "A minor" / "a-Moll"
  function keyName(root, quality) {
    const d = dispNote(root);
    if (I18N.lang() === 'de') return quality === 'major' ? `${d}-Dur` : `${d.toLowerCase()}-Moll`;
    return `${d} ${quality}`;
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
    return [0, 2, 4].map(k => {
      const idx = i + k;
      return rootMidi + steps[idx % 7] + 12 * Math.floor(idx / 7);
    });
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

  // Display chord name, e.g. "Dm".
  function chordName(rootName, steps, degree) {
    return spellD(rootName, steps)[degree - 1] + triadQuality(steps, degree);
  }

  const PC_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
  const pcName = (pc) => dispNote(PC_NAMES[((pc % 12) + 12) % 12]);

  const DEGREE_LABELS = (steps) => {
    const major = [0, 2, 4, 5, 7, 9, 11];
    return steps.map((s, i) => {
      const d = s - major[i];
      return (d < 0 ? '♭' : d > 0 ? '♯' : '') + (i + 1);
    });
  };

  return {
    MODES, BY_ID, BRIGHTNESS_ORDER, LETTERS, STEP_NAMES, spell, spellD, dispNote, keyName, scaleMidi, triad,
    triadQuality, chordName, parseNote, pcName, DEGREE_LABELS,
  };
})();
