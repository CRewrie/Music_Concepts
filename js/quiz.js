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

  // Lesson 1: what is a mode
  card('l1-what', 'boot', () => ({
    kind: 'mc',
    prompt: 'C major and A minor use exactly the same 7 notes. What makes them sound different?',
    ...mcOpts('Which note feels like "home"', ['Which note feels like "home"', 'The tempo', 'Using black keys', 'The volume']),
    explain: 'A mode is a set of notes PLUS a home note (tonic). Same notes, different home = different mood.',
  }));
  T.MODES.forEach(m => card(`l1-white-${m.id}`, 'boot', () => ({
    kind: 'mc',
    prompt: `You play only white keys, starting and ending on <b>${m.whiteKey}</b>. Which mode is that?`,
    ...mcOpts(m.name, T.MODES.map(x => x.name)),
    explain: `${m.whiteKey} → ${m.whiteKey} on white keys is ${m.name}. ${m.today !== '(Almost never used)' ? 'Today we call it: ' + m.today + '.' : ''}`,
    play: () => Sound.scale(T.scaleMidi(m.whiteKey, m.steps, m.whiteKey >= 'G' || m.whiteKey === 'A' || m.whiteKey === 'B' ? 3 : 4), { updown: false }),
  })));

  // Lesson 2: the white-key trick
  T.MODES.forEach(m => card(`l2-key-${m.id}`, 'dir', () => ({
    kind: 'mc',
    prompt: `On which white key does ${modeTag(m)} start?`,
    ...mcOpts(m.whiteKey, T.LETTERS),
    explain: `I-D-P-L-M-A-L ↔ C-D-E-F-G-A-B. ${m.name} is mode #${m.degree}, so it starts on ${m.whiteKey}.`,
  })));
  T.MODES.forEach(m => card(`l2-steps-${m.id}`, 'dir', () => ({
    kind: 'mc',
    prompt: `Which mode has the step pattern <code class="steps">${T.STEP_NAMES(m.steps).join(' ')}</code>?`,
    ...mcOpts(m.name, T.MODES.map(x => x.name)),
    explain: `W = whole step, H = half step. Every mode is the same cycle W W H W W W H, started at a different point. ${m.name} starts at position ${m.degree}.`,
  })));
  card('l2-mnemonic', 'dir', () => ({
    kind: 'mc',
    prompt: 'Which order is correct (starting on C, D, E, F, G, A, B)?',
    ...mcOpts('Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian', [
      'Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian',
      'Ionian, Phrygian, Dorian, Lydian, Mixolydian, Aeolian, Locrian',
      'Dorian, Ionian, Phrygian, Mixolydian, Lydian, Aeolian, Locrian',
      'Ionian, Dorian, Lydian, Phrygian, Mixolydian, Locrian, Aeolian']),
    explain: '"<b>I D</b>on\'t <b>P</b>articularly <b>L</b>ike <b>M</b>odes <b>A</b> <b>L</b>ot" → I D P L M A L.',
  }));

  // Lesson 3: brightness & characteristic notes
  T.MODES.forEach(m => card(`l3-formula-${m.id}`, 'bright', () => ({
    kind: 'mc',
    prompt: `"${m.compare}" Which mode is that?`,
    ...mcOpts(m.name, T.MODES.map(x => x.name)),
    explain: `${m.name}: ${m.compare} Characteristic note: ${m.signature.label}.`,
  })));
  T.MODES.filter(m => m.id !== 'ionian').forEach(m => card(`l3-sig-${m.id}`, 'bright', () => {
    const r = 60;
    const notes = T.scaleMidi('C', m.steps, 4);
    const target = notes[m.signature.degree - 1];
    return {
      kind: 'tap',
      prompt: `Here is C ${modeTag(m)}. Tap the <b>one note</b> that gives it its special color (compared to plain major/minor).`,
      from: 60, octaves: 1,
      marks: notes.map((n, i) => ({ midi: n, label: T.spell('C', m.steps)[i] })),
      target,
      explain: `The ${m.signature.label} (${T.spell('C', m.steps)[m.signature.degree - 1]}). ${m.signature.why}`,
      play: () => Sound.scale(notes, { updown: false }),
    };
  }));
  card('l3-order', 'bright', () => ({
    kind: 'order',
    prompt: 'Tap the modes from <b>brightest</b> to <b>darkest</b>.',
    items: shuffle(T.MODES.map(m => ({ id: m.id, label: m.name, color: m.color }))),
    answerOrder: T.BRIGHTNESS_ORDER.map(m => m.id),
    explain: 'Lydian → Ionian → Mixolydian → Dorian → Aeolian → Phrygian → Locrian. Each step down lowers exactly one note.',
  }));
  T.MODES.filter(m => m.id !== 'locrian').forEach(m => card(`l3-ear-${m.id}`, 'bright', (c) => {
    const n = c.box < 2 ? 3 : 4;
    const pool = T.MODES.filter(x => x.id !== 'locrian' && x.id !== m.id);
    // Easy: very different brightness. Hard: neighbors.
    const sorted = pool.sort((a, b) => Math.abs(a.brightness - m.brightness) - Math.abs(b.brightness - m.brightness));
    const distract = c.box < 2 ? shuffle(sorted.slice(2)).slice(0, n - 1) : sorted.slice(0, n - 1);
    const options = shuffle([m, ...distract]);
    const root = 'C';
    return {
      kind: 'mc', ear: true,
      prompt: '🎧 Listen. Which mode is this (on C)?',
      options: options.map(x => x.name),
      answer: options.indexOf(m),
      play: () => Sound.scale(T.scaleMidi(root, m.steps, 4), { updown: true, step: 0.26 }),
      autoplay: true,
      explain: `${m.name}: ${m.mood}. Listen for the ${m.signature.label}.`,
    };
  }));

  // Lesson 4: history
  const HIST = [
    ['hist-glarean', 'In 1547, who expanded the church modes from 8 to 12, adding Ionian and Aeolian?', 'Heinrich Glarean', ['Heinrich Glarean', 'Guido of Arezzo', 'J. S. Bach', 'Pythagoras'], 'Glarean, a Swiss humanist, did it in his book "Dodecachordon" ("twelve strings"). Ionian = future major, Aeolian = future minor.'],
    ['hist-eight', 'How many modes did medieval chant theory originally use?', '8', ['8', '7', '12', '24'], '4 authentic modes (Dorian, Phrygian, Lydian, Mixolydian) plus 4 plagal "Hypo-" versions.'],
    ['hist-hypo', 'What does "Hypo-" mean in Hypodorian?', 'Same home note, but the melody\'s range sits a 4th lower', ['Same home note, but the melody\'s range sits a 4th lower', 'Dorian played faster', 'Dorian without the 6th', 'Dorian on black keys'], 'Hypo = "below". Plagal modes keep the final but the range (ambitus) starts a 4th under it.'],
    ['hist-locrian', 'Why did medieval theorists skip Locrian?', 'Its 5th is a tritone, so home never feels stable', ['Its 5th is a tritone, so home never feels stable', 'It was banned by the Pope', 'It only works on black keys', 'Nobody had discovered B yet'], 'B–F is a diminished 5th, the "diabolus in musica". A home chord without a perfect 5th wobbles.'],
    ['hist-greek', 'The mode names come from ancient Greece. What\'s the twist?', 'The medieval theorists mixed them up: Greek "Dorian" was a different scale', ['The medieval theorists mixed them up: Greek "Dorian" was a different scale', 'Greek music had no scales', 'The names are from Latin, not Greek', 'Greeks only used Locrian'], 'Medieval writers borrowed the Greek names but mapped them onto different scales. Our "Dorian" isn\'t Plato\'s Dorian.'],
    ['hist-bach', 'What did Bach\'s "Well-Tempered Clavier" (Book I, 1722) show off?', 'Pieces in all 24 major and minor keys', ['Pieces in all 24 major and minor keys', 'The first use of Lydian', 'How to play without a tonic', 'Music for 12 church modes'], 'Thanks to well-tempered tuning, every one of the 12 roots works for both major and minor: 24 keys.'],
    ['hist-sowhat', 'Which 1959 track became the anthem of modal jazz?', '"So What" by Miles Davis', ['"So What" by Miles Davis', '"Take Five" by Dave Brubeck', '"Giant Steps" by John Coltrane', '"Fly Me to the Moon"'], 'From "Kind of Blue". It sits on D Dorian for 16 bars, moves up to E♭ Dorian, then comes back.'],
    ['hist-final', 'The "finalis" (home note) of the authentic Dorian mode is…', 'D', ['D', 'C', 'E', 'A'], 'Authentic finals: Dorian D, Phrygian E, Lydian F, Mixolydian G.'],
    ['hist-beethoven', 'Beethoven wrote a famous slow movement "in the Lydian mode". Which piece?', 'String Quartet Op. 132 ("Heiliger Dankgesang")', ['String Quartet Op. 132 ("Heiliger Dankgesang")', 'Symphony No. 5', 'Für Elise', 'Moonlight Sonata'], 'He wrote it after recovering from an illness and marked it "in der lydischen Tonart", a deliberate nod to old church music.'],
  ];
  HIST.forEach(([id, prompt, correct, pool, explain]) => card(id, 'history', () => ({ kind: 'mc', prompt, ...mcOpts(correct, pool), explain })));

  // Lesson 5: from modes to keys
  const FICTA = [
    ['ficta-lydian', 'F Lydian kept getting a B♭ added (to avoid the F–B tritone). What does F Lydian + B♭ become?', 'F major', ['F major', 'F minor', 'D Dorian', 'B♭ Lydian']],
    ['ficta-mixo', 'G Mixolydian gets an F♯ so it has a leading tone. Result?', 'G major', ['G major', 'G minor', 'E minor', 'G Lydian']],
    ['ficta-dorian', 'D Dorian + B♭ becomes…', 'D natural minor (Aeolian)', ['D natural minor (Aeolian)', 'D major', 'F Lydian', 'D Phrygian']],
    ['ficta-aeolian', 'A Aeolian + G♯ (leading tone) becomes…', 'A harmonic minor', ['A harmonic minor', 'A major', 'A Dorian', 'G Mixolydian']],
    ['ficta-why', 'Why did composers keep adding sharps right before the final note?', 'To create a leading tone a half-step below home', ['To create a leading tone a half-step below home', 'Sharps were cheaper to print', 'To make the music louder', 'The organ was out of tune'], 'A half-step "pull" into the tonic (like B→C) makes cadences feel final. Only Ionian and Lydian have it built in.'],
    ['ficta-two', 'After the Baroque era, the many church modes boiled down to how many "templates"?', '2: major and minor', ['2: major and minor', '7: one per white key', '12: one per root', '1: the chromatic scale'], 'Major (= Ionian) and minor (= Aeolian, with a raised 7th when needed). Put them on 12 roots and you get 24 keys.'],
    ['ficta-dur', 'German "Dur" and "Moll" come from…', 'Latin durus (hard) and mollis (soft): the square and the round B', ['Latin durus (hard) and mollis (soft): the square and the round B', 'The names of two monks', 'Old German words for "day" and "night"', 'Greek mode names'], 'The square "b durum" (B♮) became our ♮ and ♯ and the German letter H. The round "b molle" (B♭) became ♭. That\'s why B♭ major is "B-Dur" in German!'],
    ['ficta-relative', 'Which pair of modern keys is a "fossil" of the modal system, since they share all 7 notes?', 'C major and A minor', ['C major and A minor', 'C major and C minor', 'C major and G major', 'A minor and E minor'], 'C Ionian and A Aeolian use the same white keys. Every major key has a relative minor 3 half-steps below.'],
  ];
  FICTA.forEach(([id, prompt, correct, pool, explain]) => card(id, 'upgrade', () => ({
    kind: 'mc', prompt, ...mcOpts(correct, pool),
    explain: explain || 'Musica ficta: accidentals that weren\'t written but performed. They nudged the modes toward major and minor.',
  })));
  T.MODES.filter(m => m.id !== 'ionian').forEach(m => card(`l5-parent-${m.id}`, 'upgrade', () => {
    const parents = ['C', 'G', 'F', 'D', 'B♭'];
    const parent = pick(parents);
    const majorNames = T.spell(parent, M.ionian.steps);
    const root = majorNames[m.degree - 1];
    return {
      kind: 'mc',
      prompt: `<b>${root} ${m.name}</b> uses the same notes as which major scale?`,
      ...mcOpts(`${parent} major`, ['C major', 'G major', 'F major', 'D major', 'B♭ major', 'A major', 'E♭ major'].concat([`${root} major`])),
      explain: `${m.name} is mode #${m.degree}, so ${root} is the ${m.degree}${['st', 'nd', 'rd'][m.degree - 1] || 'th'} note of ${parent} major (${majorNames.join(' ')}).`,
    };
  }));

  // Lesson 6: modes today
  T.MODES.filter(m => m.id !== 'locrian').forEach(m => card(`l6-build-${m.id}`, 'today', (c) => {
    const root = pick(c.box < 2 ? ['C', 'D', 'G', 'F'] : ROOTS);
    return {
      kind: 'build',
      prompt: `Build <b>${root} ${m.name}</b>. Tap its 7 notes (${m.compare.toLowerCase()})`,
      root, mode: m,
      explain: `${root} ${m.name} = ${T.spell(root, m.steps).join(' ')}`,
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
      prompt: '🎧 A band jams this groove, then plays the scale. Which mode?',
      options: options.map(x => x.name),
      answer: options.indexOf(m),
      play: () => Sound.sequence(vampSequence(m, root), 0.3),
      autoplay: true,
      explain: `${root} ${m.name}: ${chords}. ${m.mood}.`,
    };
  }));
  const SONGS = [
    ['song-sowhat', '"So What" by Miles Davis is the classic example of…', 'dorian'],
    ['song-simpsons', 'The Simpsons theme opens with that floating raised 4th. Which mode?', 'lydian'],
    ['song-norwegian', '"Norwegian Wood" (The Beatles) is major with a flat 7th. Which mode?', 'mixolydian'],
    ['song-flamenco', 'Flamenco guitar\'s dark half-step "sting" above the root comes from…', 'phrygian'],
    ['song-scarborough', '"Scarborough Fair" is a famous folk tune in…', 'dorian'],
    ['song-alabama', '"Sweet Home Alabama" (D–C–G) grooves in which mode?', 'mixolydian'],
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
      fb.innerHTML = `<div class="fb ${correct ? 'good' : 'bad'}"><b>${correct ? pick(['Correct!', 'Nailed it!', 'Yes!', 'Bingo!', 'C:\\> OK']) : pick(['Not quite.', 'Close, but no.', 'ERROR 404: right answer not found.'])}</b> ${extra}<div class="explain">${q.explain || ''}</div></div>`;
      el.classList.add(correct ? 'is-good' : 'is-bad');
      done(correct);
    }

    if (q.play) {
      const pb = html(`<button class="btn play" type="button">▶ ${q.ear ? 'Listen' : 'Hear it'}</button>`);
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
          count.textContent = `${selected().length + 1} / 7 notes`;
        },
      });
      kb.mark(r, 'root', q.root);
      const selected = () => [...kb.keys.keys()].filter(m => kb.has(m, 'sel'));
      const ctrl = html(`<div class="row"><span class="count">1 / 7 notes</span><button class="btn" type="button" data-a="hear">▶ Hear mine</button><button class="btn primary" type="button" data-a="check">Check ✓</button></div>`);
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
        finish(okLoose, !ok && okLoose ? '(Right notes! Tip: stay inside one octave above the root.)' : '');
      };
      el._keys = (k) => { if (k === 'Enter') ctrl.querySelector('[data-a=check]').click(); };
    }

    if (q.kind === 'order') {
      const picked = [];
      const slots = html(`<div class="slots">${q.items.map((_, i) => `<span class="slot">${i + 1}</span>`).join('')}</div>`);
      const pool = html('<div class="opts pills"></div>');
      body.appendChild(html('<div class="order-scale"><span>☀ brightest</span><span>darkest ☾</span></div>'));
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
            finish(wrongAt === 0, wrongAt ? `${q.items.length - wrongAt}/${q.items.length} in the right spot.` : '');
          }
        };
        pool.appendChild(b);
      });
      const undo = html('<button class="btn ghost" type="button">↶ Undo</button>');
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
      <div class="quiz-actions"><button class="btn primary next" type="button" hidden>Next ⏎</button></div>
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
          if (it.q.ear) { earStreak++; if (earStreak >= 5) Progress.badge('golden-ear', 'Golden Ear (5 ear questions in a row)'); }
          if (combo === 10) Progress.badge('combo10', 'Combo ×10');
        } else { combo = 0; if (it.q.ear) earStreak = 0; }
        const c = root.querySelector('.combo');
        c.textContent = combo >= 2 ? `🔥 ×${combo}` : '';
        c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
        next.hidden = false;
        next.textContent = i + 1 < items.length ? 'Next ⏎' : 'Finish ⏎';
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
        <div>${pct === 100 ? 'Flawless. The monks would be proud. 🎉' : pct >= 70 ? 'Solid! A few more reps and it sticks.' : 'Good start. Mistakes are where the learning happens; these cards will come back soon.'}</div>
        <div class="muted">Best combo: ×${bestCombo}</div>
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
