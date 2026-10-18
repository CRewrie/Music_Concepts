// Quiz engine: question types, renderer, card bank, spaced-repetition sessions.
const Quiz = (() => {
  const { html, shuffle, pick, Keyboard, Progress, toast, confetti } = UI;
  const T = Theory;
  const M = T.BY_ID;

  const ROOTS = ['C', 'D', 'E', 'F', 'G', 'A', 'B♭', 'E♭'];
  const rootMidi = (name) => {
    const pc = T.parseNote(name).pc;
    return (pc >= 7 ? 48 : 60) + pc; // keep the register comfortable
  };
  const modeTag = (m) => `<span class="mtag" style="--c:${m.color}">${m.name}</span>`;

  function vampSequence(mode, root) {
    const r = rootMidi(root);
    const items = [];
    mode.vamp.forEach(([deg]) => {
      const tri = T.triad(r, mode.steps, deg);
      const bass = r - 12 + mode.steps[deg - 1];
      items.push([bass, ...tri], null, tri, null);
    });
    // finish with the melody line of the scale so the mode is clear
    return [...items, ...T.scaleMidi(root, mode.steps, Math.floor(r / 12) - 1), r + 12];
  }

  // ---------- Card bank ----------
  // Each card belongs to a lesson; it unlocks when that lesson is completed.
  const CARDS = [];
  const card = (id, lesson, gen) => CARDS.push({ id, lesson, gen });

  const mcOpts = (correct, pool, n = 4) => {
    const others = shuffle([...new Set(pool)].filter(x => x !== correct)).slice(0, n - 1);
    const options = shuffle([correct, ...others]);
    return { options, answer: options.indexOf(correct) };
  };

  const D = T.dispNote;
  const ordinal = (n) => tr(n + (['st', 'nd', 'rd'][n - 1] || 'th'), n + '.');

  // Lesson 1: what is a mode
  card('l1-what', 'boot', () => {
    const right = tr('Which note feels like "home"', 'Welcher Ton sich wie „Zuhause“ anfühlt');
    return {
      kind: 'mc',
      prompt: tr('C major and A minor use exactly the same 7 notes. What makes them sound different?',
        'C-Dur und a-Moll benutzen genau dieselben 7 Töne. Warum klingen sie trotzdem verschieden?'),
      ...mcOpts(right, [right, tr('The tempo', 'Das Tempo'), tr('Using black keys', 'Die schwarzen Tasten'), tr('The volume', 'Die Lautstärke')]),
      explain: tr('A mode is a set of notes PLUS a home note (tonic). Same notes, different home = different mood.',
        'Ein Modus ist ein Tonvorrat PLUS ein Zuhause-Ton (Grundton). Gleiche Töne, anderes Zuhause = andere Stimmung.'),
    };
  });
  T.MODES.forEach(m => card(`l1-white-${m.id}`, 'boot', () => ({
    kind: 'mc',
    prompt: tr(`You play only white keys, starting and ending on <b>${m.whiteKey}</b>. Which mode is that?`,
      `Du spielst nur weiße Tasten, von <b>${D(m.whiteKey)}</b> bis <b>${D(m.whiteKey)}</b>. Welcher Modus ist das?`),
    ...mcOpts(m.name, T.MODES.map(x => x.name)),
    explain: `${D(m.whiteKey)} → ${D(m.whiteKey)} ${tr('on white keys is', 'auf weißen Tasten ist')} ${m.name}. ${m.id !== 'locrian' ? tr('Today we call it: ', 'Heute nennen wir das: ') + m.today + '.' : ''}`,
    play: () => Sound.scale(T.scaleMidi(m.whiteKey, m.steps, 'CDEF'.includes(m.whiteKey) ? 4 : 3), { updown: false }),
  })));

  // Lesson 2: the white-key trick
  T.MODES.forEach(m => card(`l2-key-${m.id}`, 'dir', () => ({
    kind: 'mc',
    prompt: tr(`On which white key does ${modeTag(m)} start?`, `Auf welcher weißen Taste beginnt ${modeTag(m)}?`),
    ...mcOpts(D(m.whiteKey), T.LETTERS.map(D)),
    explain: tr(`I-D-P-L-M-A-L ↔ C-D-E-F-G-A-B. ${m.name} is mode #${m.degree}, so it starts on ${m.whiteKey}.`,
      `I-D-P-L-M-Ä-L ↔ C-D-E-F-G-A-H. ${m.name} ist Modus Nr. ${m.degree}, beginnt also auf ${D(m.whiteKey)}.`),
  })));
  T.MODES.forEach(m => card(`l2-steps-${m.id}`, 'dir', () => ({
    kind: 'mc',
    prompt: tr(`Which mode has the step pattern <code class="steps">${T.STEP_NAMES(m.steps).join(' ')}</code>?`,
      `Welcher Modus hat das Schrittmuster <code class="steps">${T.STEP_NAMES(m.steps).join(' ')}</code>?`),
    ...mcOpts(m.name, T.MODES.map(x => x.name)),
    explain: tr(`W = whole step, H = half step. Every mode is the same cycle W W H W W W H, started at a different point. ${m.name} starts at position ${m.degree}.`,
      `G = Ganzton, H = Halbton. Jeder Modus ist derselbe Kreislauf G G H G G G H, nur an einer anderen Stelle begonnen. ${m.name} beginnt an Position ${m.degree}.`),
  })));
  card('l2-mnemonic', 'dir', () => {
    const N = (ids) => ids.map(id => M[id].name).join(', ');
    const right = N(['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian']);
    return {
      kind: 'mc',
      prompt: tr('Which order is correct (starting on C, D, E, F, G, A, B)?', 'Welche Reihenfolge stimmt (beginnend auf C, D, E, F, G, A, H)?'),
      ...mcOpts(right, [right,
        N(['ionian', 'phrygian', 'dorian', 'lydian', 'mixolydian', 'aeolian', 'locrian']),
        N(['dorian', 'ionian', 'phrygian', 'mixolydian', 'lydian', 'aeolian', 'locrian']),
        N(['ionian', 'dorian', 'lydian', 'phrygian', 'mixolydian', 'locrian', 'aeolian'])]),
      explain: tr('"<b>I D</b>on\'t <b>P</b>articularly <b>L</b>ike <b>M</b>odes <b>A</b> <b>L</b>ot" → I D P L M A L.',
        '„<b>I</b>m <b>D</b>unkeln <b>P</b>robt <b>L</b>isa <b>M</b>it <b>A</b>nna <b>L</b>aut“ → I D P L M Ä L.'),
    };
  });

  // Lesson 3: brightness & characteristic notes
  T.MODES.forEach(m => card(`l3-formula-${m.id}`, 'bright', () => ({
    kind: 'mc',
    prompt: tr(`"${m.compare}" Which mode is that?`, `„${m.compare}“ Welcher Modus ist das?`),
    ...mcOpts(m.name, T.MODES.map(x => x.name)),
    explain: `${m.name}: ${m.compare} ${tr('Characteristic note', 'Charakteristischer Ton')}: ${m.signature.label}.`,
  })));
  T.MODES.filter(m => m.id !== 'ionian').forEach(m => card(`l3-sig-${m.id}`, 'bright', () => {
    const notes = T.scaleMidi('C', m.steps, 4);
    const names = T.spellD('C', m.steps);
    const target = notes[m.signature.degree - 1];
    return {
      kind: 'tap',
      prompt: tr(`Here is C ${modeTag(m)}. Tap the <b>one note</b> that gives it its special color (compared to plain major/minor).`,
        `Hier ist C-${modeTag(m)}. Tippe den <b>einen Ton</b> an, der ihm seine besondere Farbe gibt (im Vergleich zu normalem Dur/Moll).`),
      from: 60, octaves: 1,
      marks: notes.map((n, i) => ({ midi: n, label: names[i] })),
      target,
      explain: tr(`The ${m.signature.label} (${names[m.signature.degree - 1]}). ${m.signature.why}`,
        `Die ${m.signature.label} (${names[m.signature.degree - 1]}). ${m.signature.why}`),
      play: () => Sound.scale(notes, { updown: false }),
    };
  }));
  card('l3-order', 'bright', () => ({
    kind: 'order',
    prompt: tr('Tap the modes from <b>brightest</b> to <b>darkest</b>.', 'Tippe die Modi von <b>hell</b> nach <b>dunkel</b> an.'),
    items: shuffle(T.MODES.map(m => ({ id: m.id, label: m.name, color: m.color }))),
    answerOrder: T.BRIGHTNESS_ORDER.map(m => m.id),
    explain: T.BRIGHTNESS_ORDER.map(m => m.name).join(' → ') + '. ' + tr('Each step down lowers exactly one note.', 'Jeder Schritt nach unten erniedrigt genau einen Ton.'),
  }));
  T.MODES.filter(m => m.id !== 'locrian').forEach(m => card(`l3-ear-${m.id}`, 'bright', (c) => {
    const n = c.box < 2 ? 3 : 4;
    const pool = T.MODES.filter(x => x.id !== 'locrian' && x.id !== m.id);
    // Easy: very different brightness. Hard: neighbors.
    const sorted = pool.sort((a, b) => Math.abs(a.brightness - m.brightness) - Math.abs(b.brightness - m.brightness));
    const distract = c.box < 2 ? shuffle(sorted.slice(2)).slice(0, n - 1) : sorted.slice(0, n - 1);
    const options = shuffle([m, ...distract]);
    return {
      kind: 'mc', ear: true,
      prompt: tr('🎧 Listen. Which mode is this (on C)?', '🎧 Hör zu. Welcher Modus ist das (auf C)?'),
      options: options.map(x => x.name),
      answer: options.indexOf(m),
      play: () => Sound.scale(T.scaleMidi('C', m.steps, 4), { updown: true, step: 0.26 }),
      autoplay: true,
      explain: tr(`${m.name}: ${m.mood}. Listen for the ${m.signature.label}.`, `${m.name}: ${m.mood}. Achte auf die ${m.signature.label}.`),
    };
  }));

  // Lesson 4: history
  const HIST = [
    ['hist-glarean',
      tr('In 1547, who expanded the church modes from 8 to 12, adding Ionian and Aeolian?', 'Wer erweiterte 1547 die Kirchentonarten von 8 auf 12 und fügte Ionisch und Äolisch hinzu?'),
      'Heinrich Glarean', ['Heinrich Glarean', 'Guido von Arezzo', 'J. S. Bach', 'Pythagoras'],
      tr('Glarean, a Swiss humanist, did it in his book "Dodecachordon" ("twelve strings"). Ionian = future major, Aeolian = future minor.',
        'Glarean, ein Schweizer Humanist, in seinem Buch „Dodekachordon“ („zwölf Saiten“). Ionisch = späteres Dur, Äolisch = späteres Moll.')],
    ['hist-eight',
      tr('How many modes did medieval chant theory originally use?', 'Wie viele Modi kannte die mittelalterliche Choraltheorie ursprünglich?'),
      '8', ['8', '7', '12', '24'],
      tr('4 authentic modes (Dorian, Phrygian, Lydian, Mixolydian) plus 4 plagal "Hypo-" versions.',
        '4 authentische Modi (Dorisch, Phrygisch, Lydisch, Mixolydisch) plus 4 plagale „Hypo-“-Varianten.')],
    ['hist-hypo',
      tr('What does "Hypo-" mean in Hypodorian?', 'Was bedeutet „Hypo-“ in Hypodorisch?'),
      tr('Same home note, but the melody\'s range sits a 4th lower', 'Gleicher Grundton, aber der Tonumfang liegt eine Quarte tiefer'),
      [tr('Same home note, but the melody\'s range sits a 4th lower', 'Gleicher Grundton, aber der Tonumfang liegt eine Quarte tiefer'), tr('Dorian played faster', 'Dorisch, nur schneller'), tr('Dorian without the 6th', 'Dorisch ohne 6. Stufe'), tr('Dorian on black keys', 'Dorisch auf schwarzen Tasten')],
      tr('Hypo = "below". Plagal modes keep the final but the range (ambitus) starts a 4th under it.',
        'Hypo = „unter“. Plagale Modi behalten die Finalis, aber der Ambitus beginnt eine Quarte darunter.')],
    ['hist-locrian',
      tr('Why did medieval theorists skip Locrian?', 'Warum ließen die mittelalterlichen Theoretiker Lokrisch weg?'),
      tr('Its 5th is a tritone, so home never feels stable', 'Seine Quinte ist ein Tritonus, das Zuhause fühlt sich nie stabil an'),
      [tr('Its 5th is a tritone, so home never feels stable', 'Seine Quinte ist ein Tritonus, das Zuhause fühlt sich nie stabil an'), tr('It was banned by the Pope', 'Der Papst hat ihn verboten'), tr('It only works on black keys', 'Er funktioniert nur auf schwarzen Tasten'), tr('Nobody had discovered B yet', 'Das H war noch nicht entdeckt')],
      tr('B–F is a diminished 5th, the "diabolus in musica". A home chord without a perfect 5th wobbles.',
        'H–F ist eine verminderte Quinte, der „diabolus in musica“. Ein Grundakkord ohne reine Quinte wackelt.')],
    ['hist-greek',
      tr('The mode names come from ancient Greece. What\'s the twist?', 'Die Namen der Modi stammen aus dem antiken Griechenland. Wo ist der Haken?'),
      tr('The medieval theorists mixed them up: Greek "Dorian" was a different scale', 'Die mittelalterlichen Theoretiker haben sie verwechselt: Das griechische „Dorisch“ war eine andere Tonleiter'),
      [tr('The medieval theorists mixed them up: Greek "Dorian" was a different scale', 'Die mittelalterlichen Theoretiker haben sie verwechselt: Das griechische „Dorisch“ war eine andere Tonleiter'), tr('Greek music had no scales', 'Griechische Musik hatte keine Tonleitern'), tr('The names are from Latin, not Greek', 'Die Namen sind lateinisch, nicht griechisch'), tr('Greeks only used Locrian', 'Die Griechen nutzten nur Lokrisch')],
      tr('Medieval writers borrowed the Greek names but mapped them onto different scales. Our "Dorian" isn\'t Plato\'s Dorian.',
        'Mittelalterliche Autoren übernahmen die griechischen Namen, ordneten sie aber anderen Tonleitern zu. Unser „Dorisch“ ist nicht Platons Dorisch.')],
    ['hist-bach',
      tr('What did Bach\'s "Well-Tempered Clavier" (Book I, 1722) show off?', 'Was führte Bachs „Wohltemperiertes Klavier“ (Teil I, 1722) vor?'),
      tr('Pieces in all 24 major and minor keys', 'Stücke in allen 24 Dur- und Moll-Tonarten'),
      [tr('Pieces in all 24 major and minor keys', 'Stücke in allen 24 Dur- und Moll-Tonarten'), tr('The first use of Lydian', 'Den ersten Einsatz von Lydisch'), tr('How to play without a tonic', 'Musik ganz ohne Grundton'), tr('Music for 12 church modes', 'Musik für 12 Kirchentonarten')],
      tr('Thanks to well-tempered tuning, every one of the 12 roots works for both major and minor: 24 keys.',
        'Dank wohltemperierter Stimmung funktioniert jeder der 12 Grundtöne für Dur und Moll: 24 Tonarten.')],
    ['hist-sowhat',
      tr('Which 1959 track became the anthem of modal jazz?', 'Welches Stück von 1959 wurde zur Hymne des Modal Jazz?'),
      tr('"So What" by Miles Davis', '„So What“ von Miles Davis'),
      [tr('"So What" by Miles Davis', '„So What“ von Miles Davis'), tr('"Take Five" by Dave Brubeck', '„Take Five“ von Dave Brubeck'), tr('"Giant Steps" by John Coltrane', '„Giant Steps“ von John Coltrane'), tr('"Fly Me to the Moon"', '„Fly Me to the Moon“')],
      tr('From "Kind of Blue". It sits on D Dorian for 16 bars, moves up to E♭ Dorian, then comes back.',
        'Von „Kind of Blue“. 16 Takte D-Dorisch, dann Es-Dorisch, dann zurück.')],
    ['hist-final',
      tr('The "finalis" (home note) of the authentic Dorian mode is…', 'Die „Finalis“ (Grundton) des authentischen dorischen Modus ist…'),
      'D', ['D', 'C', 'E', 'A'],
      tr('Authentic finals: Dorian D, Phrygian E, Lydian F, Mixolydian G.', 'Authentische Finales: Dorisch D, Phrygisch E, Lydisch F, Mixolydisch G.')],
    ['hist-beethoven',
      tr('Beethoven wrote a famous slow movement "in the Lydian mode". Which piece?', 'Beethoven schrieb einen berühmten langsamen Satz „in der lydischen Tonart“. Welches Werk?'),
      tr('String Quartet Op. 132 ("Heiliger Dankgesang")', 'Streichquartett op. 132 („Heiliger Dankgesang“)'),
      [tr('String Quartet Op. 132 ("Heiliger Dankgesang")', 'Streichquartett op. 132 („Heiliger Dankgesang“)'), tr('Symphony No. 5', '5. Sinfonie'), 'Für Elise', tr('Moonlight Sonata', 'Mondscheinsonate')],
      tr('He wrote it after recovering from an illness and marked it "in der lydischen Tonart", a deliberate nod to old church music.',
        'Er schrieb ihn nach überstandener Krankheit und überschrieb ihn mit „in der lydischen Tonart“, eine bewusste Verbeugung vor der alten Kirchenmusik.')],
  ];
  HIST.forEach(([id, prompt, correct, pool, explain]) => card(id, 'history', () => ({ kind: 'mc', prompt, ...mcOpts(correct, pool), explain })));

  // Lesson 5: from modes to keys
  const K = T.keyName;
  const FICTA_EXPLAIN = tr('Musica ficta: accidentals that weren\'t written but performed. They nudged the modes toward major and minor.',
    'Musica ficta: Vorzeichen, die nicht notiert, aber gesungen wurden. Sie schoben die Modi Richtung Dur und Moll.');
  const FICTA = [
    ['ficta-lydian',
      tr('F Lydian kept getting a B♭ added (to avoid the F–B tritone). What does F Lydian + B♭ become?', 'F-Lydisch bekam ständig ein B statt H (um den Tritonus F–H zu vermeiden). Was wird aus F-Lydisch + B?'),
      K('F', 'major'), [K('F', 'major'), K('F', 'minor'), tr('D Dorian', 'D-Dorisch'), tr('B♭ Lydian', 'B-Lydisch')]],
    ['ficta-mixo',
      tr('G Mixolydian gets an F♯ so it has a leading tone. Result?', 'G-Mixolydisch bekommt ein Fis als Leitton. Ergebnis?'),
      K('G', 'major'), [K('G', 'major'), K('G', 'minor'), K('E', 'minor'), tr('G Lydian', 'G-Lydisch')]],
    ['ficta-dorian',
      tr('D Dorian + B♭ becomes…', 'D-Dorisch + B (statt H) wird zu…'),
      tr('D natural minor (Aeolian)', 'natürliches d-Moll (Äolisch)'),
      [tr('D natural minor (Aeolian)', 'natürliches d-Moll (Äolisch)'), K('D', 'major'), tr('F Lydian', 'F-Lydisch'), tr('D Phrygian', 'D-Phrygisch')]],
    ['ficta-aeolian',
      tr('A Aeolian + G♯ (leading tone) becomes…', 'A-Äolisch + Gis (Leitton) wird zu…'),
      tr('A harmonic minor', 'harmonisches a-Moll'),
      [tr('A harmonic minor', 'harmonisches a-Moll'), K('A', 'major'), tr('A Dorian', 'A-Dorisch'), tr('G Mixolydian', 'G-Mixolydisch')]],
    ['ficta-why',
      tr('Why did composers keep adding sharps right before the final note?', 'Warum fügten Komponisten kurz vor dem Schlusston immer wieder Kreuze hinzu?'),
      tr('To create a leading tone a half-step below home', 'Um einen Leitton einen Halbton unter dem Grundton zu erzeugen'),
      [tr('To create a leading tone a half-step below home', 'Um einen Leitton einen Halbton unter dem Grundton zu erzeugen'), tr('Sharps were cheaper to print', 'Kreuze waren billiger zu drucken'), tr('To make the music louder', 'Damit die Musik lauter wird'), tr('The organ was out of tune', 'Die Orgel war verstimmt')],
      tr('A half-step "pull" into the tonic (like B→C) makes cadences feel final. Only Ionian and Lydian have it built in.',
        'Ein Halbton-„Sog“ in den Grundton (wie H→C) lässt Kadenzen abgeschlossen klingen. Nur Ionisch und Lydisch haben ihn eingebaut.')],
    ['ficta-two',
      tr('After the Baroque era, the many church modes boiled down to how many "templates"?', 'Auf wie viele „Vorlagen“ schrumpften die Kirchentonarten nach dem Barock?'),
      tr('2: major and minor', '2: Dur und Moll'),
      [tr('2: major and minor', '2: Dur und Moll'), tr('7: one per white key', '7: eine pro weißer Taste'), tr('12: one per root', '12: eine pro Grundton'), tr('1: the chromatic scale', '1: die chromatische Tonleiter')],
      tr('Major (= Ionian) and minor (= Aeolian, with a raised 7th when needed). Put them on 12 roots and you get 24 keys.',
        'Dur (= Ionisch) und Moll (= Äolisch, bei Bedarf mit erhöhter 7. Stufe). Auf 12 Grundtöne gesetzt ergibt das 24 Tonarten.')],
    ['ficta-dur',
      tr('German "Dur" and "Moll" come from…', 'Die Wörter „Dur“ und „Moll“ kommen von…'),
      tr('Latin durus (hard) and mollis (soft): the square and the round B', 'Lateinisch durus (hart) und mollis (weich): dem eckigen und dem runden b'),
      [tr('Latin durus (hard) and mollis (soft): the square and the round B', 'Lateinisch durus (hart) und mollis (weich): dem eckigen und dem runden b'), tr('The names of two monks', 'Den Namen zweier Mönche'), tr('Old German words for "day" and "night"', 'Althochdeutschen Wörtern für „Tag“ und „Nacht“'), tr('Greek mode names', 'Griechischen Modusnamen')],
      tr('The square "b durum" (B♮) became our ♮ and ♯ and the German letter H. The round "b molle" (B♭) became ♭. That\'s why B♭ major is "B-Dur" in German!',
        'Das eckige „b durum“ (unser H) wurde zu ♮, ♯ und zum Buchstaben H. Das runde „b molle“ (unser B) wurde zu ♭. Deshalb heißt es im Deutschen B-Dur, im Englischen aber „B♭ major“!')],
    ['ficta-relative',
      tr('Which pair of modern keys is a "fossil" of the modal system, since they share all 7 notes?', 'Welches Tonarten-Paar ist ein „Fossil“ des modalen Systems, weil beide alle 7 Töne teilen?'),
      `${K('C', 'major')} & ${K('A', 'minor')}`,
      [`${K('C', 'major')} & ${K('A', 'minor')}`, `${K('C', 'major')} & ${K('C', 'minor')}`, `${K('C', 'major')} & ${K('G', 'major')}`, `${K('A', 'minor')} & ${K('E', 'minor')}`],
      tr('C Ionian and A Aeolian use the same white keys. Every major key has a relative minor 3 half-steps below.',
        'C-Ionisch und A-Äolisch benutzen dieselben weißen Tasten. Jede Dur-Tonart hat eine Paralleltonart in Moll, 3 Halbtöne tiefer.')],
  ];
  FICTA.forEach(([id, prompt, correct, pool, explain]) => card(id, 'upgrade', () => ({
    kind: 'mc', prompt, ...mcOpts(correct, pool), explain: explain || FICTA_EXPLAIN,
  })));
  T.MODES.filter(m => m.id !== 'ionian').forEach(m => card(`l5-parent-${m.id}`, 'upgrade', () => {
    const parent = pick(['C', 'G', 'F', 'D', 'B♭']);
    const majorNames = T.spell(parent, M.ionian.steps);
    const root = majorNames[m.degree - 1];
    const pool = ['C', 'G', 'F', 'D', 'B♭', 'A', 'E♭', root].map(r => K(r, 'major'));
    return {
      kind: 'mc',
      prompt: tr(`<b>${D(root)} ${m.name}</b> uses the same notes as which major scale?`,
        `<b>${D(root)}-${m.name}</b> benutzt dieselben Töne wie welche Dur-Tonleiter?`),
      ...mcOpts(K(parent, 'major'), pool),
      explain: tr(`${m.name} is mode #${m.degree}, so ${D(root)} is the ${ordinal(m.degree)} note of ${K(parent, 'major')} (${majorNames.map(D).join(' ')}).`,
        `${m.name} ist Modus Nr. ${m.degree}, also ist ${D(root)} der ${ordinal(m.degree)} Ton von ${K(parent, 'major')} (${majorNames.map(D).join(' ')}).`),
    };
  }));

  // Lesson 6: modes today
  T.MODES.filter(m => m.id !== 'locrian').forEach(m => card(`l6-build-${m.id}`, 'today', (c) => {
    const root = pick(c.box < 2 ? ['C', 'D', 'G', 'F'] : ROOTS);
    return {
      kind: 'build',
      prompt: tr(`Build <b>${D(root)} ${m.name}</b>. Tap its 7 notes (${m.compare.toLowerCase()})`,
        `Baue <b>${D(root)}-${m.name}</b>. Tippe seine 7 Töne an (${m.compare})`),
      root, mode: m,
      explain: tr(`${D(root)} ${m.name} = `, `${D(root)}-${m.name} = `) + T.spellD(root, m.steps).join(' '),
    };
  }));
  T.MODES.filter(m => m.id !== 'locrian').forEach(m => card(`l6-vamp-${m.id}`, 'today', (c) => {
    const root = pick(['C', 'D', 'E', 'G', 'A']);
    const pool = T.MODES.filter(x => x.id !== 'locrian' && x.id !== m.id);
    const distract = shuffle(pool).slice(0, c.box < 2 ? 2 : 3);
    const options = shuffle([m, ...distract]);
    const chords = m.vamp.map(([d]) => T.chordName(root, m.steps, d)).join(' → ');
    return {
      kind: 'mc', ear: true,
      prompt: tr('🎧 A band jams this groove, then plays the scale. Which mode?', '🎧 Eine Band jammt diesen Groove und spielt dann die Tonleiter. Welcher Modus?'),
      options: options.map(x => x.name),
      answer: options.indexOf(m),
      play: () => Sound.sequence(vampSequence(m, root), 0.3),
      autoplay: true,
      explain: `${D(root)}${tr(' ', '-')}${m.name}: ${chords}. ${m.mood}.`,
    };
  }));
  const SONGS = [
    ['song-sowhat', tr('"So What" by Miles Davis is the classic example of…', '„So What“ von Miles Davis ist das Paradebeispiel für…'), 'dorian'],
    ['song-simpsons', tr('The Simpsons theme opens with that floating raised 4th. Which mode?', 'Die Simpsons-Melodie beginnt mit dieser schwebenden erhöhten Quarte. Welcher Modus?'), 'lydian'],
    ['song-norwegian', tr('"Norwegian Wood" (The Beatles) is major with a flat 7th. Which mode?', '„Norwegian Wood“ (The Beatles) ist Dur mit kleiner Septime. Welcher Modus?'), 'mixolydian'],
    ['song-flamenco', tr('Flamenco guitar\'s dark half-step "sting" above the root comes from…', 'Der dunkle Halbton-„Stich“ über dem Grundton in der Flamenco-Gitarre kommt von…'), 'phrygian'],
    ['song-scarborough', tr('"Scarborough Fair" is a famous folk tune in…', '„Scarborough Fair“ ist ein berühmtes Volkslied in…'), 'dorian'],
    ['song-alabama', tr('"Sweet Home Alabama" (D–C–G) grooves in which mode?', '„Sweet Home Alabama“ (D–C–G) groovt in welchem Modus?'), 'mixolydian'],
  ];
  SONGS.forEach(([id, prompt, mid]) => card(id, 'today', () => ({
    kind: 'mc', prompt, ...mcOpts(M[mid].name, T.MODES.map(x => x.name)),
    explain: `${M[mid].name}: ${M[mid].compare}`,
  })));

  // ---------- Renderer ----------
  function renderQuestion(box, q, done) {
    box.innerHTML = '';
    const el = html(`<div class="q"><div class="q-prompt">${q.prompt}</div><div class="q-body"></div><div class="q-feedback" aria-live="polite"></div></div>`);
    box.appendChild(el);
    const body = el.querySelector('.q-body');
    const fb = el.querySelector('.q-feedback');
    let answered = false;

    function finish(correct, extra = '') {
      if (answered) return;
      answered = true;
      Sound.blip(correct);
      fb.innerHTML = `<div class="fb ${correct ? 'good' : 'bad'}"><b>${correct ? pick(tr(['Correct!', 'Nailed it!', 'Yes!', 'Bingo!', 'C:\\> OK'], ['Richtig!', 'Volltreffer!', 'Ja!', 'Bingo!', 'C:\\> OK'])) : pick(tr(['Not quite.', 'Close, but no.', 'ERROR 404: right answer not found.'], ['Nicht ganz.', 'Knapp daneben.', 'FEHLER 404: Richtige Antwort nicht gefunden.']))}</b> ${extra}<div class="explain">${q.explain || ''}</div></div>`;
      el.classList.add(correct ? 'is-good' : 'is-bad');
      done(correct);
    }

    if (q.play) {
      const pb = html(`<button class="btn play" type="button">▶ ${q.ear ? tr('Listen', 'Anhören') : tr('Hear it', 'Abspielen')}</button>`);
      pb.onclick = () => q.play();
      body.appendChild(pb);
      if (q.autoplay) setTimeout(() => { if (el.isConnected) q.play(); }, 250);
    }

    if (q.kind === 'mc') {
      const opts = html('<div class="opts"></div>');
      q.options.forEach((o, i) => {
        const b = html(`<button class="opt" type="button"><kbd>${i + 1}</kbd><span>${o}</span></button>`);
        b.onclick = () => {
          if (answered) return;
          const ok = i === q.answer;
          b.classList.add(ok ? 'right' : 'wrong');
          opts.children[q.answer].classList.add('right');
          [...opts.children].forEach(c => c.disabled = true);
          finish(ok);
        };
        opts.appendChild(b);
      });
      body.appendChild(opts);
      el._keys = (k) => { const n = +k; if (n >= 1 && n <= q.options.length) opts.children[n - 1].click(); };
    }

    if (q.kind === 'tap') {
      const kbWrap = html('<div class="kb-wrap small"></div>');
      body.appendChild(kbWrap);
      const kb = Keyboard(kbWrap, {
        from: q.from, octaves: q.octaves || 1,
        onPress: (m) => {
          Sound.note(m, 0.5);
          if (answered) return;
          if (!kb.has(m)) return;
          const ok = m === q.target;
          kb.mark(m, ok ? 'right' : 'wrong');
          kb.mark(q.target, 'right');
          finish(ok);
        },
      });
      q.marks.forEach(({ midi, label }) => kb.mark(midi, 'on', label));
    }

    if (q.kind === 'build') {
      const r = rootMidi(q.root);
      const target = new Set(q.mode.steps.map(s => (r + s) % 12));
      const kbWrap = html('<div class="kb-wrap"></div>');
      body.appendChild(kbWrap);
      const from = r - (r % 12);
      const kb = Keyboard(kbWrap, {
        from, octaves: 2,
        onPress: (m) => {
          Sound.note(m, 0.45);
          if (answered) return;
          if (m === r) return; // root fixed
          kb.has(m, 'sel') ? kb.unmark(m, 'sel') : kb.mark(m, 'sel');
          count.textContent = `${selected().length + 1} / 7 ${tr('notes', 'Töne')}`;
        },
      });
      kb.mark(r, 'root', T.dispNote(q.root));
      const selected = () => [...kb.keys.keys()].filter(m => kb.has(m, 'sel'));
      const ctrl = html(`<div class="row"><span class="count">1 / 7 ${tr('notes', 'Töne')}</span><button class="btn" type="button" data-a="hear">▶ ${tr('Hear mine', 'Meine anhören')}</button><button class="btn primary" type="button" data-a="check">${tr('Check', 'Prüfen')} ✓</button></div>`);
      const count = ctrl.querySelector('.count');
      body.appendChild(ctrl);
      ctrl.querySelector('[data-a=hear]').onclick = () => {
        const seq = [r, ...selected().sort((a, b) => a - b)];
        Sound.sequence(seq, 0.28);
      };
      ctrl.querySelector('[data-a=check]').onclick = () => {
        if (answered) return;
        const sel = selected();
        const pcs = new Set([r % 12, ...sel.map(m => m % 12)]);
        const ok = pcs.size === 7 && [...target].every(p => pcs.has(p)) && sel.every(m => m > r && m < r + 12);
        const okLoose = pcs.size === 7 && [...target].every(p => pcs.has(p));
        sel.forEach(m => kb.mark(m, target.has(m % 12) ? 'right' : 'wrong'));
        q.mode.steps.forEach(s => kb.mark(r + s, 'right'));
        Sound.scale(q.mode.steps.map(s => r + s), { updown: false, step: 0.24 });
        finish(okLoose, !ok && okLoose ? tr('(Right notes! Tip: stay inside one octave above the root.)', '(Richtige Töne! Tipp: Bleib innerhalb einer Oktave über dem Grundton.)') : '');
      };
      el._keys = (k) => { if (k === 'Enter') ctrl.querySelector('[data-a=check]').click(); };
    }

    if (q.kind === 'order') {
      const picked = [];
      const slots = html(`<div class="slots">${q.items.map((_, i) => `<span class="slot">${i + 1}</span>`).join('')}</div>`);
      const pool = html('<div class="opts pills"></div>');
      body.appendChild(html(`<div class="order-scale"><span>☀ ${tr('brightest', 'am hellsten')}</span><span>${tr('darkest', 'am dunkelsten')} ☾</span></div>`));
      body.appendChild(slots);
      body.appendChild(pool);
      const redraw = () => {
        [...slots.children].forEach((s, i) => {
          const it = q.items.find(x => x.id === picked[i]);
          s.innerHTML = it ? it.label : i + 1;
          s.style.setProperty('--c', it ? it.color : 'transparent');
          s.classList.toggle('filled', !!it);
        });
        [...pool.children].forEach(b => b.disabled = picked.includes(b.dataset.id) || answered);
      };
      q.items.forEach(it => {
        const b = html(`<button class="pill" type="button" data-id="${it.id}" style="--c:${it.color}">${it.label}</button>`);
        b.onclick = () => {
          if (answered) return;
          picked.push(it.id);
          Sound.scale(T.scaleMidi('C', M[it.id].steps, 4), { updown: false, step: 0.12 });
          redraw();
          if (picked.length === q.items.length) {
            const wrongAt = picked.map((id, i) => id === q.answerOrder[i]).filter(x => !x).length;
            [...slots.children].forEach((s, i) => s.classList.add(picked[i] === q.answerOrder[i] ? 'right' : 'wrong'));
            finish(wrongAt === 0, wrongAt ? `${q.items.length - wrongAt}/${q.items.length} ${tr('in the right spot.', 'an der richtigen Stelle.')}` : '');
          }
        };
        pool.appendChild(b);
      });
      const undo = html(`<button class="btn ghost" type="button">↶ ${tr('Undo', 'Zurück')}</button>`);
      undo.onclick = () => { if (!answered) { picked.pop(); redraw(); } };
      body.appendChild(undo);
      redraw();
    }

    return el;
  }

  // ---------- Session runner ----------
  // questions: array of {cardId?, q}
  function run(container, items, { title = 'Quiz', onFinish, xpPer = 10, srs = true } = {}) {
    let i = 0, score = 0, combo = 0, bestCombo = 0, earStreak = 0;
    const root = html(`<div class="quiz">
      <div class="quiz-head"><span class="quiz-title">${title}</span><span class="quiz-meta"><span class="combo"></span><span class="qn"></span></span></div>
      <div class="bar"><i></i></div>
      <div class="quiz-stage"></div>
      <div class="quiz-actions"><button class="btn primary next" type="button" hidden>${tr('Next', 'Weiter')} ⏎</button></div>
    </div>`);
    container.innerHTML = '';
    container.appendChild(root);
    const stage = root.querySelector('.quiz-stage');
    const next = root.querySelector('.next');
    let current;

    const keyHandler = (e) => {
      if (!root.isConnected) { document.removeEventListener('keydown', keyHandler); return; }
      if (e.target.matches('input, select, textarea')) return;
      if (e.key === 'Enter' && !next.hidden) { e.preventDefault(); next.click(); return; }
      if (current?._keys) current._keys(e.key);
    };
    document.addEventListener('keydown', keyHandler);

    function show() {
      const it = items[i];
      root.querySelector('.qn').textContent = `${i + 1}/${items.length}`;
      root.querySelector('.bar i').style.width = `${(i / items.length) * 100}%`;
      next.hidden = true;
      current = renderQuestion(stage, it.q, (correct) => {
        if (srs && it.cardId) Progress.review(it.cardId, correct);
        if (correct) {
          score++; combo++;
          bestCombo = Math.max(bestCombo, combo);
          const bonus = combo >= 3 ? Math.min(combo - 2, 5) * 2 : 0;
          Progress.addXP(xpPer + bonus);
          if (it.q.ear) { earStreak++; if (earStreak >= 5) Progress.badge('golden-ear', tr('Golden Ear (5 ear questions in a row)', 'Goldenes Ohr (5 Hörfragen in Folge)')); }
          if (combo === 10) Progress.badge('combo10', tr('Combo ×10', 'Kombo ×10'));
        } else { combo = 0; if (it.q.ear) earStreak = 0; }
        const c = root.querySelector('.combo');
        c.textContent = combo >= 2 ? `🔥 ×${combo}` : '';
        c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
        next.hidden = false;
        next.textContent = i + 1 < items.length ? tr('Next ⏎', 'Weiter ⏎') : tr('Finish ⏎', 'Fertig ⏎');
        next.focus({ preventScroll: true });
      });
    }

    next.onclick = () => {
      Sound.stop();
      i++;
      if (i < items.length) { show(); return; }
      root.querySelector('.bar i').style.width = '100%';
      const pct = Math.round((score / items.length) * 100);
      if (pct === 100) confetti(60);
      Progress.setBest(bestCombo);
      stage.innerHTML = `<div class="result">
        <div class="big">${score}/${items.length}</div>
        <div>${pct === 100 ? tr('Flawless. The monks would be proud. 🎉', 'Fehlerfrei. Die Mönche wären stolz. 🎉') : pct >= 70 ? tr('Solid! A few more reps and it sticks.', 'Stark! Noch ein paar Wiederholungen und es sitzt.') : tr('Good start. Mistakes are where the learning happens; these cards will come back soon.', 'Guter Anfang. Aus Fehlern lernt man am meisten; diese Karten kommen bald wieder.')}</div>
        <div class="muted">${tr('Best combo', 'Beste Kombo')}: ×${bestCombo}</div>
      </div>`;
      next.hidden = true;
      document.removeEventListener('keydown', keyHandler);
      onFinish && onFinish({ score, total: items.length, bestCombo, root });
    };

    show();
  }

  // ---------- Card selection ----------
  function unlockedCards(lessonIds) {
    return CARDS.filter(c => lessonIds.includes(c.lesson));
  }

  // Build a spaced-repetition session: due cards first (lowest box first), then new ones, interleaved.
  function buildSession(lessonIds, n = 10) {
    const now = Date.now();
    const pool = unlockedCards(lessonIds);
    const withState = pool.map(c => ({ c, s: Progress.card(c.id) }));
    const due = shuffle(withState.filter(x => x.s.seen > 0 && x.s.due <= now)).sort((a, b) => a.s.box - b.s.box);
    const fresh = shuffle(withState.filter(x => x.s.seen === 0));
    const later = shuffle(withState.filter(x => x.s.seen > 0 && x.s.due > now)).sort((a, b) => a.s.due - b.s.due);
    const chosen = [...due, ...fresh, ...later].slice(0, n);
    // interleave: avoid the same lesson twice in a row where possible
    const out = [];
    const rest = shuffle(chosen);
    while (rest.length) {
      const idx = rest.findIndex(x => !out.length || x.c.lesson !== out[out.length - 1].c.lesson);
      out.push(rest.splice(idx === -1 ? 0 : idx, 1)[0]);
    }
    return out.map(({ c, s }) => ({ cardId: c.id, q: c.gen(s) }));
  }

  function lessonSet(lessonId, ids) {
    return ids.map(id => {
      const c = CARDS.find(x => x.id === id);
      return { cardId: c.id, q: c.gen(Progress.card(c.id)) };
    });
  }

  function stats(lessonIds) {
    const pool = unlockedCards(lessonIds);
    const now = Date.now();
    let due = 0, fresh = 0, mastered = 0;
    pool.forEach(c => {
      const s = Progress.card(c.id);
      if (s.seen === 0) fresh++;
      else if (s.due <= now) due++;
      if (s.box >= 3) mastered++;
    });
    return { total: pool.length, due, fresh, mastered };
  }

  return { run, buildSession, lessonSet, stats, CARDS, vampSequence, rootMidi, modeTag };
})();
