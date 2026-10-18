// Interactive widgets mounted into lessons via <div data-widget="name">.
const Widgets = (() => {
  const { $, $$, html, Keyboard } = UI;
  const T = Theory;
  const M = T.BY_ID;
  const D = T.dispNote;
  let cleanups = [];
  const onCleanup = (fn) => cleanups.push(fn);
  function cleanup() {
    cleanups.forEach(f => { try { f(); } catch { /* ignore */ } });
    cleanups = [];
    Sound.stop();
    Sound.stopDrone();
  }

  const modeTag = (m) => `<span class="mtag" style="--c:${m.color}">${m.name}</span>`;
  const whiteMidi = (letter, octave) => 12 * (octave + 1) + T.parseNote(letter).pc;
  const modeOn = (root, m) => tr(`${D(root)} ${m.name}`, `${D(root)}-${m.name}`);

  function droneButton(getRoot) {
    const b = html(`<button class="btn" type="button" aria-pressed="false">◉ ${tr('Drone', 'Bordun')}</button>`);
    b.onclick = () => {
      if (Sound.isDroning()) { Sound.stopDrone(); b.setAttribute('aria-pressed', 'false'); }
      else { Sound.startDrone(getRoot()); b.setAttribute('aria-pressed', 'true'); }
    };
    b.sync = () => {
      if (Sound.isDroning()) Sound.startDrone(getRoot());
    };
    return b;
  }

  const W = {};

  // L1: same keys, different home
  W.hook = (el) => {
    el.innerHTML = `<div class="widget">
      <div class="w-title">${tr('EXPERIMENT_01.EXE: same keys, different world', 'EXPERIMENT_01.EXE: gleiche Tasten, andere Welt')}</div>
      <p class="hint">${tr('Predict first: which one sounds happy, which one sad, which one… something else? Then press play.', 'Erst raten: Welche klingt fröhlich, welche traurig, welche… irgendwie anders? Dann abspielen.')}</p>
      <div class="row wrap">
        <button class="btn" data-k="C" data-o="4">▶ C → C (${tr('white keys', 'weiße Tasten')})</button>
        <button class="btn" data-k="A" data-o="3">▶ A → A (${tr('white keys', 'weiße Tasten')})</button>
        <button class="btn" data-k="D" data-o="3">▶ D → D (${tr('white keys', 'weiße Tasten')})</button>
      </div>
      <div class="kb-wrap"></div>
      <div class="w-out muted">${tr('Only white keys, every time. Watch the keyboard.', 'Jedes Mal nur weiße Tasten. Schau auf die Tastatur.')}</div>
    </div>`;
    const kb = Keyboard($('.kb-wrap', el), { from: 48, octaves: 2, labels: 'white' });
    const out = $('.w-out', el);
    const info = { C: 'ionian', A: 'aeolian', D: 'dorian' };
    $$('[data-k]', el).forEach(b => b.onclick = () => {
      const k = b.dataset.k, o = +b.dataset.o;
      const m = M[info[k]];
      const notes = T.scaleMidi(k, m.steps, o);
      kb.clear();
      notes.forEach(n => kb.mark(n, 'on'));
      kb.mark(notes[0], 'root');
      kb.mark(notes[0] + 12, 'root');
      Sound.scale(notes, { updown: true, step: 0.28 });
      out.innerHTML = tr(`${m.emoji} That was ${modeTag(m)}: <b>${m.mood}</b>. Today you'd call it: <i>${m.today}</i>.`,
        `${m.emoji} Das war ${modeTag(m)}: <b>${m.mood}</b>. Heute würde man sagen: <i>${m.today}</i>.`);
    });
  };

  // L1: choose any white key as home
  W.homeBase = (el) => {
    el.innerHTML = `<div class="widget">
      <div class="w-title">${tr('HOMEBASE.EXE: pick a home, any home', 'HOMEBASE.EXE: such dir ein Zuhause aus')}</div>
      <p class="hint">${tr('Choose a white key as "home". Turn on the drone (a held note, like a bagpipe or an organ in a church) and play over it. Notice how the <i>same</i> keys change character.', 'Wähle eine weiße Taste als „Zuhause“. Schalte den Bordun ein (ein liegender Ton wie beim Dudelsack oder der Kirchenorgel) und spiel darüber. Achte darauf, wie <i>dieselben</i> Tasten ihren Charakter ändern.')}</p>
      <div class="row wrap seg">${T.LETTERS.map(l => `<button class="seg-b" data-l="${l}">${D(l)}</button>`).join('')}</div>
      <div class="kb-wrap"></div>
      <div class="row wrap ctl"><button class="btn primary" data-a="play">▶ ${tr('Play scale', 'Tonleiter spielen')}</button></div>
      <div class="w-out"></div>
    </div>`;
    let letter = 'D';
    const kb = Keyboard($('.kb-wrap', el), { from: 48, octaves: 2, labels: 'white' });
    const rootOf = () => whiteMidi(letter, 3);
    const modeOf = () => T.MODES.find(x => x.whiteKey === letter);
    const drone = droneButton(() => rootOf() + 12);
    $('.ctl', el).appendChild(drone);
    const out = $('.w-out', el);
    function draw() {
      const m = modeOf();
      const r = rootOf();
      kb.clear();
      m.steps.forEach(s => kb.mark(r + s, 'on'));
      kb.mark(r, 'root'); kb.mark(r + 12, 'root');
      $$('.seg-b', el).forEach(b => b.classList.toggle('active', b.dataset.l === letter));
      out.innerHTML = `${tr('Home', 'Zuhause')} = <b>${D(letter)}</b> → ${modeTag(m)} ${m.emoji} <span class="muted">${m.mood}</span>`;
      drone.sync();
    }
    $$('.seg-b', el).forEach(b => b.onclick = () => {
      letter = b.dataset.l;
      draw();
      Sound.scale(modeOf().steps.map(s => rootOf() + s), { updown: false, step: 0.2 });
    });
    $('[data-a=play]', el).onclick = () => Sound.scale(modeOf().steps.map(s => rootOf() + s));
    draw();
  };

  // L2: the rotating belt of steps
  W.modeExplorer = (el) => {
    const belt = 'CDEFGABCDEFGABC'.split('');
    el.innerHTML = `<div class="widget">
      <div class="w-title">${tr('DIR /MODES: one belt, seven windows', 'DIR /MODI: ein Band, sieben Fenster')}</div>
      <p class="hint">${tr('The white keys form a belt of whole steps (W) and half steps (H). The half steps are always E–F and B–C. Each mode is an 8-note window on that belt. Click a mode and watch where the H\'s land.', 'Die weißen Tasten bilden ein Band aus Ganztönen (G) und Halbtönen (H). Die Halbtöne liegen immer bei E–F und H–C. Jeder Modus ist ein 8-Ton-Fenster auf diesem Band. Klick einen Modus an und schau, wo die H landen.')}</p>
      <div class="belt">${belt.map((l, i) => `<span class="bn" data-i="${i}">${D(l)}</span>${i < belt.length - 1 ? `<span class="bs ${'EB'.includes(l) ? 'h' : ''}" data-i="${i}">${'EB'.includes(l) ? 'H' : tr('W', 'G')}</span>` : ''}`).join('')}</div>
      <div class="mode-grid">${T.MODES.map(m => `<button class="mcard" data-id="${m.id}" style="--c:${m.color}">
        <span class="mc-emoji">${m.emoji}</span><span class="mc-num">${m.degree}</span>
        <b>${m.name}</b><span class="mc-key">${D(m.whiteKey)} → ${D(m.whiteKey)}</span><span class="mc-mood">${m.mood}</span></button>`).join('')}</div>
      <div class="w-out"></div>
    </div>`;
    const out = $('.w-out', el);
    function select(m) {
      const start = m.degree - 1;
      $$('.bn', el).forEach(n => { const i = +n.dataset.i; n.classList.toggle('in', i >= start && i <= start + 7); n.classList.toggle('home', i === start || i === start + 7); });
      $$('.bs', el).forEach(n => { const i = +n.dataset.i; n.classList.toggle('in', i >= start && i < start + 7); });
      $$('.bn, .bs', el).forEach(n => n.style.setProperty('--c', m.color));
      $$('.mcard', el).forEach(c => c.classList.toggle('active', c.dataset.id === m.id));
      out.innerHTML = `${modeTag(m)} ${tr('pattern', 'Muster')}: <code class="steps">${T.STEP_NAMES(m.steps).join(' ')}</code> · ${tr('today', 'heute')}: <i>${m.today}</i>`;
      const oct = 'CDEF'.includes(m.whiteKey) ? 4 : 3;
      Sound.scale(T.scaleMidi(m.whiteKey, m.steps, oct), { updown: false, step: 0.22 });
    }
    $$('.mcard', el).forEach(c => c.onclick = () => select(M[c.dataset.id]));
    select(M.ionian);
    Sound.stop();
  };

  // L3: brightness slider (parallel modes on C)
  W.brightness = (el) => {
    const order = T.BRIGHTNESS_ORDER;
    el.innerHTML = `<div class="widget">
      <div class="w-title">${tr('BRIGHTNESS.SYS: one root, seven moods', 'HELLIGKEIT.SYS: ein Grundton, sieben Stimmungen')}</div>
      <p class="hint">${tr('All modes on the same root C. Slide from bright to dark. Each step lowers <b>exactly one note</b> (it flashes).', 'Alle Modi auf demselben Grundton C. Schieb von hell nach dunkel. Jeder Schritt erniedrigt <b>genau einen Ton</b> (er blinkt).')}</p>
      <div class="bright-slider"><span>☀</span><input type="range" min="0" max="6" step="1" value="1" aria-label="${tr('Brightness', 'Helligkeit')}"><span>☾</span></div>
      <div class="bright-name"></div>
      <div class="kb-wrap"></div>
      <div class="degrees"></div>
      <div class="row wrap ctl"><button class="btn primary" data-a="play">▶ ${tr('Play', 'Abspielen')}</button><button class="btn" data-a="chord">▶ ${tr('Home chord', 'Grundakkord')}</button></div>
      <div class="w-out muted"></div>
    </div>`;
    const kb = Keyboard($('.kb-wrap', el), { from: 60, octaves: 1 });
    const range = $('input', el);
    const drone = droneButton(() => 60);
    $('.ctl', el).appendChild(drone);
    let idx = 1;
    function draw(prev) {
      const m = order[idx];
      const names = T.spellD('C', m.steps);
      kb.clear();
      m.steps.forEach((s, i) => kb.mark(60 + s, 'on', names[i], m.color));
      kb.mark(72, 'on', 'C', m.color);
      kb.mark(60, 'root');
      let changed = '';
      if (prev != null && prev !== idx) {
        const pm = order[prev];
        const i = m.steps.findIndex((s, k) => s !== pm.steps[k]);
        if (Math.abs(prev - idx) === 1 && i >= 0) {
          kb.mark(60 + m.steps[i], 'changed');
          changed = `${prev < idx ? tr('Lowered', 'Erniedrigt') : tr('Raised', 'Erhöht')}: ${T.spellD('C', pm.steps)[i]} → ${names[i]}`;
        }
      }
      $('.bright-name', el).innerHTML = `${m.emoji} ${modeTag(m)} <span class="muted">${m.mood}</span>`;
      $('.degrees', el).innerHTML = T.DEGREE_LABELS(m.steps).map((d, i) => `<span class="deg ${i === m.signature.degree - 1 && m.id !== 'ionian' ? 'sig' : ''}" style="--c:${m.color}">${d}</span>`).join('');
      $('.w-out', el).innerHTML = (changed ? `<b>${changed}</b> · ` : '') + `${m.compare} ${tr('Signature', 'Kennton')}: ${m.signature.label}.`;
    }
    range.oninput = () => { const p = idx; idx = +range.value; draw(p); Sound.scale(order[idx].steps.map(s => 60 + s), { updown: false, step: 0.15 }); };
    $('[data-a=play]', el).onclick = () => Sound.scale(order[idx].steps.map(s => 60 + s));
    $('[data-a=chord]', el).onclick = () => Sound.chord(T.triad(60, order[idx].steps, 1).concat([48]), 1.6);
    draw();
  };

  // L4: timeline
  const CHANT = [62, 65, 67, 69, 69, 67, 69, 72, 71, 69, 67, 65, 67, 69, 67, 65, 64, 62, 62];
  W.timeline = (el) => {
    const E = [
      { y: tr('~500 BC', '~500 v. Chr.'), t: tr('Greek theory', 'Griechische Theorie'),
        d: tr('Pythagoras and friends describe scales with names like Dorian, Phrygian, Lydian, named after Greek regions. Their "Dorian" is <b>not</b> our Dorian; medieval scholars later mixed up the mapping.',
          'Pythagoras & Co. beschreiben Tonleitern mit Namen wie Dorisch, Phrygisch, Lydisch, benannt nach griechischen Regionen. Ihr „Dorisch“ ist <b>nicht</b> unser Dorisch; mittelalterliche Gelehrte haben die Zuordnung später verwechselt.') },
      { y: '~800–1000', t: tr('Gregorian chant & the 8 church modes', 'Gregorianischer Choral & die 8 Kirchentonarten'),
        d: tr('Church singers sort chant melodies into 8 modes: 4 <b>authentic</b> (Dorian on D, Phrygian on E, Lydian on F, Mixolydian on G) and 4 <b>plagal</b> "Hypo-" versions with the same home note but a lower range. What defines a mode: its <b>final</b> (home note) and its <b>ambitus</b> (range).',
          'Kirchensänger ordnen die Choralmelodien 8 Modi zu: 4 <b>authentische</b> (Dorisch auf D, Phrygisch auf E, Lydisch auf F, Mixolydisch auf G) und 4 <b>plagale</b> „Hypo-“-Varianten mit gleichem Grundton, aber tieferem Tonraum. Einen Modus bestimmen seine <b>Finalis</b> (Schlusston) und sein <b>Ambitus</b> (Tonumfang).'), play: 'chant' },
      { y: tr('~1025', 'um 1025'), t: tr('Guido of Arezzo', 'Guido von Arezzo'),
        d: tr('Invents staff-line notation and the syllables <i>ut–re–mi–fa–sol–la</i> (our do-re-mi). The basic toolkit of Western notation is born.',
          'Erfindet das Notenlinien-System und die Silben <i>ut–re–mi–fa–sol–la</i> (unser Do-Re-Mi). Das Grundwerkzeug der westlichen Notenschrift ist geboren.') },
      { y: '1200–1500', t: tr('Musica ficta: unwritten accidentals', 'Musica ficta: ungeschriebene Vorzeichen'),
        d: tr('Singers add B♭ to dodge the harsh F–B tritone, and raise notes before cadences (C→C♯ before D) so the ending pulls home harder. Little by little, the modes start to drift toward major and minor.',
          'Sänger nehmen B statt H, um den harten Tritonus F–H zu vermeiden, und erhöhen Töne vor Kadenzen (C→Cis vor D), damit der Schluss stärker nach Hause zieht. Nach und nach driften die Modi Richtung Dur und Moll.'), play: 'ficta' },
      { y: '1547', t: tr('Glarean\'s "Dodecachordon"', 'Glareans „Dodekachordon“'),
        d: tr('Swiss humanist Heinrich Glarean expands the system to <b>12 modes</b> by officially adding <b>Ionian (C)</b> and <b>Aeolian (A)</b>, which composers already used all the time. Locrian (B) is rejected: its 5th is a tritone.',
          'Der Schweizer Humanist Heinrich Glarean erweitert das System auf <b>12 Modi</b> und nimmt offiziell <b>Ionisch (C)</b> und <b>Äolisch (A)</b> auf, die Komponisten längst ständig benutzten. Lokrisch (H) wird verworfen: Seine Quinte ist ein Tritonus.'), play: 'glarean' },
      { y: '~1600–1700', t: tr('Baroque: chords take over', 'Barock: Akkorde übernehmen'),
        d: tr('Music is now thought in <b>chords</b> and <b>dominant→tonic</b> cadences. That needs a leading tone, which Ionian has built in and Aeolian gets with a raised 7th. The other modes merge into these two. Major/minor tonality is born.',
          'Musik wird jetzt in <b>Akkorden</b> und <b>Dominante→Tonika</b>-Kadenzen gedacht. Dafür braucht es einen Leitton: Ionisch hat ihn eingebaut, Äolisch bekommt ihn durch die erhöhte 7. Stufe. Die anderen Modi gehen in diesen beiden auf. Die Dur-Moll-Tonalität ist geboren.'), play: 'cadence' },
      { y: '1722', t: tr('Bach: The Well-Tempered Clavier', 'Bach: Das Wohltemperierte Klavier'),
        d: tr('New tunings make all 12 roots usable. Bach writes a prelude & fugue in each of the <b>24 major and minor keys</b>. The "Windows" layer is fully installed.',
          'Neue Stimmungen machen alle 12 Grundtöne nutzbar. Bach schreibt Präludium & Fuge in jeder der <b>24 Dur- und Moll-Tonarten</b>. Die „Windows“-Ebene ist vollständig installiert.') },
      { y: '1825', t: tr('Beethoven goes retro', 'Beethoven wird retro'),
        d: tr('In his String Quartet Op. 132, Beethoven writes a movement "in der lydischen Tonart", a deliberate return to the old church sound.',
          'In seinem Streichquartett op. 132 schreibt Beethoven einen Satz „in der lydischen Tonart“, eine bewusste Rückkehr zum alten Kirchenklang.') },
      { y: '~1890–1930', t: tr('Impressionists & folk revival', 'Impressionisten & Folk-Revival'),
        d: tr('Debussy, Ravel and Vaughan Williams rediscover modes for color and an ancient, folk-like feel.',
          'Debussy, Ravel und Vaughan Williams entdecken die Modi wieder, für Klangfarbe und ein altertümliches, volksliedhaftes Gefühl.') },
      { y: '1959', t: tr('Modal jazz', 'Modal Jazz'),
        d: tr('Miles Davis\' "So What" (album <i>Kind of Blue</i>) improvises over long stretches of D Dorian instead of fast chord changes. Modes become a playground again.',
          'In Miles Davis’ „So What“ (Album <i>Kind of Blue</i>) wird lange über D-Dorisch improvisiert statt über schnelle Akkordwechsel. Die Modi werden wieder zum Spielplatz.'), play: 'sowhat' },
      { y: tr('Today', 'Heute'), t: tr('Everywhere', 'Überall'),
        d: tr('Rock (Mixolydian), metal (Phrygian), film (Lydian for magic, Dorian for heroes), game music, EDM. The DOS layer never went away; it\'s just running in the background.',
          'Rock (Mixolydisch), Metal (Phrygisch), Film (Lydisch für Magie, Dorisch für Helden), Spielemusik, EDM. Die DOS-Ebene war nie weg; sie läuft einfach im Hintergrund.') },
    ];
    el.innerHTML = `<div class="widget">
      <div class="w-title">${tr('HISTORY.LOG: 2,500 years in 11 entries', 'HISTORY.LOG: 2.500 Jahre in 11 Einträgen')}</div>
      <p class="hint">${tr('Tap an entry to expand it. Some have sound.', 'Tippe auf einen Eintrag, um ihn aufzuklappen. Manche haben Ton.')}</p>
      <ol class="timeline">${E.map((e, i) => `<li class="tl" data-i="${i}">
        <button class="tl-h" type="button" aria-expanded="false"><span class="tl-y">${e.y}</span><span class="tl-t">${e.t}</span><span class="tl-x">+</span></button>
        <div class="tl-d" hidden><p>${e.d}</p>${e.play ? `<button class="btn" data-play="${e.play}">▶ ${tr('Listen', 'Anhören')}</button>` : ''}</div></li>`).join('')}</ol>
    </div>`;
    $$('.tl-h', el).forEach(h => h.onclick = () => {
      const d = h.nextElementSibling;
      const open = d.hidden;
      d.hidden = !open;
      h.setAttribute('aria-expanded', open);
      h.querySelector('.tl-x').textContent = open ? '−' : '+';
    });
    const plays = {
      chant: () => { Sound.startDrone(62); const t = Sound.sequence(CHANT, 0.42, { dur: 0.45 }); const id = setTimeout(() => Sound.stopDrone(), t * 1000 + 300); onCleanup(() => clearTimeout(id)); },
      ficta: () => Sound.sequence([69, 72, 71, 72, 74, null, 69, 73, 71, 73, 74], 0.34),
      glarean: () => Sound.sequence([...T.scaleMidi('C', M.ionian.steps, 4), 72, null, ...T.scaleMidi('A', M.aeolian.steps, 3), 69], 0.22),
      cadence: () => Sound.sequence([[48, 64, 67, 72], null, [53, 65, 69, 72], null, [43, 62, 67, 71], null, [48, 64, 67, 72]], 0.45, { dur: 0.85 }),
      sowhat: () => Sound.sequence(Quiz.vampSequence(M.dorian, 'D'), 0.3),
    };
    $$('[data-play]', el).forEach(b => b.onclick = () => plays[b.dataset.play]());
  };

  // L5: leading-tone cadence
  W.cadence = (el) => {
    el.innerHTML = `<div class="widget">
      <div class="w-title">${tr('CADENCE.BAT: the pull of the leading tone', 'KADENZ.BAT: der Sog des Leittons')}</div>
      <p class="hint">${tr('Two ways to end a piece in D. Listen to the top voice: <b>C → D</b> (whole step) vs. <b>C♯ → D</b> (half step).', 'Zwei Arten, ein Stück in D zu beenden. Hör auf die Oberstimme: <b>C → D</b> (Ganzton) vs. <b>Cis → D</b> (Halbton).')}</p>
      <div class="row wrap">
        <button class="btn" data-a="modal">▶ ${tr('Modal ending (C → Dm)', 'Modaler Schluss (C → Dm)')}</button>
        <button class="btn primary" data-a="tonal">▶ ${tr('Tonal ending (A → Dm)', 'Tonaler Schluss (A → Dm)')}</button>
      </div>
      <div class="kb-wrap"></div>
      <div class="w-out muted">${tr('The second one "clicks" into place. That click is why the modes got upgraded.', 'Der zweite „rastet ein“. Genau wegen dieses Einrastens wurden die Modi umgebaut.')}</div>
    </div>`;
    const kb = Keyboard($('.kb-wrap', el), { from: 36, octaves: 4 });
    const seqs = {
      modal: [[48, 64, 67, 72], null, [50, 65, 69, 74]],
      tonal: [[45, 64, 69, 73], null, [50, 65, 69, 74]],
    };
    $$('[data-a]', el).forEach(b => b.onclick = () => {
      kb.clear();
      const s = seqs[b.dataset.a];
      kb.mark(s[0][3], 'changed');
      kb.mark(74, 'root');
      Sound.sequence(s, 0.55, { dur: 1.0 });
    });
  };

  // L5: musica ficta machine
  W.ficta = (el) => {
    const P = (n) => T.parseNote(n).pc;
    // note/to are internal spellings; result & note are display text.
    const DATA = {
      lydian: { root: 'F', fixes: [{ note: 'B', to: 'B♭', d: -1, result: tr('F major (= Ionian on F)', 'F-Dur (= Ionisch auf F)') }],
        note: tr('Lydian\'s B♮ makes an ugly tritone with F, so singers almost always flatted it. With B♭ it simply <b>is</b> F major.', 'Das H in Lydisch bildet mit F einen hässlichen Tritonus, also sangen die Sänger fast immer B. Mit B <b>ist</b> es einfach F-Dur.') },
      mixolydian: { root: 'G', fixes: [{ note: 'F', to: 'F♯', d: 1, result: tr('G major (= Ionian on G)', 'G-Dur (= Ionisch auf G)') }],
        note: tr('Raise the 7th for a leading tone, and Mixolydian turns into major.', 'Erhöhe die 7. Stufe zum Leitton, und Mixolydisch wird zu Dur.') },
      dorian: { root: 'D', fixes: [{ note: 'B', to: 'B♭', d: -1, result: tr('D natural minor (= Aeolian on D)', 'natürliches d-Moll (= Äolisch auf D)') }, { note: 'C', to: 'C♯', d: 1, result: tr('D harmonic minor', 'harmonisches d-Moll') }],
        note: tr('B♭ was so common in Dorian that it became part of the "key signature". Then the leading tone C♯ was added at cadences.', 'Das B war in Dorisch so üblich, dass es Teil der „Vorzeichnung“ wurde. Dann kam an Kadenzen der Leitton Cis dazu.') },
      phrygian: { root: 'E', fixes: [{ note: 'F', to: 'F♯', d: 1, result: tr('E natural minor', 'natürliches e-Moll') }, { note: 'D', to: 'D♯', d: 1, result: tr('E harmonic minor', 'harmonisches e-Moll') }],
        note: tr('Phrygian resisted: its whole identity is the F♮. It survived mostly as the "Phrygian cadence" (a half cadence in minor).', 'Phrygisch hat sich gewehrt: Seine ganze Identität ist das F. Überlebt hat es vor allem als „phrygische Kadenz“ (ein Halbschluss in Moll).') },
      aeolian: { root: 'A', fixes: [{ note: 'G', to: 'G♯', d: 1, result: tr('A harmonic minor', 'harmonisches a-Moll') }, { note: 'F', to: 'F♯', d: 1, result: tr('A melodic minor (going up)', 'melodisches a-Moll (aufwärts)') }],
        note: tr('Aeolian only needed a leading tone (G♯). Adding F♯ too smooths the awkward gap F→G♯. That\'s the minor key we use today.', 'Äolisch brauchte nur einen Leitton (Gis). Mit Fis wird zusätzlich der holprige Sprung F→Gis geglättet. Das ist das Moll, das wir heute benutzen.') },
      ionian: { root: 'C', fixes: [],
        note: tr('Ionian already has a leading tone (B→C). No patch needed: it became the major scale as-is.', 'Ionisch hat schon einen Leitton (H→C). Kein Patch nötig: Es wurde unverändert zur Dur-Tonleiter.') },
    };
    el.innerHTML = `<div class="widget">
      <div class="w-title">${tr('FICTA.EXE: patch the modes, one accidental at a time', 'FICTA.EXE: patche die Modi, ein Vorzeichen nach dem anderen')}</div>
      <p class="hint">${tr('Pick an old mode. Apply the patches musicians actually used, and watch it turn into a modern key.', 'Wähle einen alten Modus. Spiel die Patches ein, die Musiker tatsächlich benutzt haben, und sieh zu, wie daraus eine moderne Tonart wird.')}</p>
      <div class="row wrap seg">${['dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'ionian'].map(id => `<button class="seg-b" data-id="${id}" style="--c:${M[id].color}">${M[id].name}</button>`).join('')}</div>
      <div class="kb-wrap"></div>
      <div class="ficta-notes"></div>
      <div class="row wrap fixes"></div>
      <div class="ficta-result"></div>
      <p class="w-out muted"></p>
    </div>`;
    const kb = Keyboard($('.kb-wrap', el), { from: 48, octaves: 2 });
    let cur = 'dorian', applied = 0;
    function steps() {
      const d = DATA[cur];
      const base = T.scaleMidi(d.root, M[cur].steps, 3);
      const pcs = base.map(m => m % 12);
      const out = [...base];
      const changed = new Set();
      d.fixes.slice(0, applied).forEach(f => {
        const i = pcs.indexOf(P(f.note));
        out[i] += f.d;
        changed.add(i);
      });
      return { out, changed };
    }
    function draw() {
      const d = DATA[cur];
      const m = M[cur];
      const { out, changed } = steps();
      const names = T.spell(d.root, m.steps).map(n => {
        const f = d.fixes.slice(0, applied).find(x => x.note === n);
        return D(f ? f.to : n);
      });
      kb.clear();
      out.forEach((n, i) => kb.mark(n, changed.has(i) ? 'changed' : 'on', names[i], m.color));
      kb.mark(out[0], 'root');
      $$('.seg-b', el).forEach(b => b.classList.toggle('active', b.dataset.id === cur));
      $('.ficta-notes', el).innerHTML = names.map((n, i) => `<span class="deg ${changed.has(i) ? 'sig' : ''}" style="--c:${m.color}">${n}</span>`).join('');
      $('.fixes', el).innerHTML = d.fixes.map((f, i) => `<button class="btn ${i < applied ? 'done' : ''}" data-f="${i}" ${i > applied ? 'disabled' : ''}>${i < applied ? '✓' : '⚙'} Patch ${i + 1}: ${D(f.note)} → ${D(f.to)}</button>`).join('')
        + (applied ? `<button class="btn ghost" data-f="reset">↶ ${tr('Reset', 'Zurücksetzen')}</button>` : '')
        + `<button class="btn primary" data-f="play">▶ ${tr('Play', 'Abspielen')}</button>`;
      const result = applied ? d.fixes[applied - 1].result : `${modeOn(d.root, m)} (${tr('original', 'Original')})`;
      $('.ficta-result', el).innerHTML = `<span class="muted">${tr('Result', 'Ergebnis')}:</span> <b>${result}</b>`;
      $('.w-out', el).innerHTML = d.note;
      $$('[data-f]', el).forEach(b => b.onclick = () => {
        const f = b.dataset.f;
        if (f === 'play') { Sound.scale(steps().out, { updown: false, step: 0.24 }); return; }
        if (f === 'reset') applied = 0; else applied = Math.min(+f + 1, DATA[cur].fixes.length);
        draw();
        Sound.scale(steps().out, { updown: false, step: 0.2 });
      });
    }
    $$('.seg-b', el).forEach(b => b.onclick = () => { cur = b.dataset.id; applied = 0; draw(); Sound.scale(steps().out, { updown: false, step: 0.2 }); });
    draw();
  };

  // L5: the 7 modes inside any key
  W.relatives = (el) => {
    const KEYS = ['C', 'G', 'D', 'A', 'E', 'F', 'B♭', 'E♭', 'A♭'];
    el.innerHTML = `<div class="widget">
      <div class="w-title">${tr('TREE /KEY: every key contains all 7 modes', 'TREE /TONART: jede Tonart enthält alle 7 Modi')}</div>
      <p class="hint">${tr('Pick a major key ("Windows"). Below are the 7 modes hidden inside it ("DOS"): same notes, different home. Tap a row to hear it.', 'Wähle eine Dur-Tonart („Windows“). Darunter stehen die 7 Modi, die in ihr stecken („DOS“): gleiche Töne, anderes Zuhause. Tippe eine Zeile an, um sie zu hören.')}</p>
      <div class="row wrap seg">${KEYS.map(k => `<button class="seg-b" data-k="${k}">${D(k)}</button>`).join('')}</div>
      <div class="rel-list"></div>
    </div>`;
    let key = 'G';
    function draw() {
      const names = T.spell(key, M.ionian.steps);
      $$('.seg-b', el).forEach(b => b.classList.toggle('active', b.dataset.k === key));
      $('.rel-list', el).innerHTML = T.MODES.map((m, i) => {
        const root = names[i];
        const notes = T.spellD(root, m.steps);
        const tag = m.id === 'ionian' ? `<span class="badge">= ${T.keyName(key, 'major')}</span>`
          : m.id === 'aeolian' ? `<span class="badge">= ${T.keyName(root, 'minor')} (${tr('relative minor!', 'Paralleltonart!')})</span>` : '';
        return `<button class="rel" data-i="${i}" style="--c:${m.color}"><span class="rel-root">${D(root)}</span>${modeTag(m)} ${tag}<span class="rel-notes">${notes.join(' ')}</span></button>`;
      }).join('');
      $$('.rel', el).forEach(r => r.onclick = () => {
        const i = +r.dataset.i;
        const pc = T.parseNote(names[i]).pc;
        const base = (pc >= 7 ? 48 : 60) + pc;
        Sound.scale(T.MODES[i].steps.map(s => base + s), { updown: false, step: 0.2 });
      });
    }
    $$('.seg-b', el).forEach(b => b.onclick = () => { key = b.dataset.k; draw(); });
    draw();
  };

  // L6 + Lab: the jam machine
  W.lab = (el) => {
    const ROOTS = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
    const KEYMAP = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
    el.innerHTML = `<div class="widget lab">
      <div class="w-title">${tr('MODELAB.EXE: jam in any mode', 'MODUSLABOR.EXE: jamme in jedem Modus')}</div>
      <p class="hint">${tr('Pick a root and a mode, start the groove, then improvise on the highlighted keys (or your computer keys <kbd>A</kbd>–<kbd>L</kbd> = scale degrees 1–9). You can\'t play a wrong note. Lean on the <span class="sigdot"></span> signature note to make the mode obvious.', 'Wähle Grundton und Modus, starte den Groove und improvisiere auf den markierten Tasten (oder mit den Computertasten <kbd>A</kbd>–<kbd>L</kbd> = Stufen 1–9). Du kannst keinen falschen Ton spielen. Betone den <span class="sigdot"></span> Kennton, damit man den Modus deutlich hört.')}</p>
      <div class="lab-ctl">
        <label>${tr('Root', 'Grundton')} <select class="root">${ROOTS.map(r => `<option value="${r}" ${r === 'D' ? 'selected' : ''}>${D(r)}</option>`).join('')}</select></label>
        <label>Tempo <input type="range" class="tempo" min="60" max="140" value="96"></label>
      </div>
      <div class="row wrap seg modes">${T.BRIGHTNESS_ORDER.map(m => `<button class="seg-b" data-id="${m.id}" style="--c:${m.color}">${m.emoji} ${m.name}</button>`).join('')}</div>
      <div class="lab-info"></div>
      <div class="kb-wrap"></div>
      <div class="row wrap ctl">
        <button class="btn primary" data-a="groove">▶ ${tr('Start groove', 'Groove starten')}</button>
        <button class="btn" data-a="scale">▶ ${tr('Scale', 'Tonleiter')}</button>
      </div>
    </div>`;
    let modeId = 'dorian', rootName = 'D', loop = null, bar = 0;
    const kb = Keyboard($('.kb-wrap', el), { from: 48, octaves: 3 });
    const rootM = () => 48 + T.parseNote(rootName).pc;
    const playable = () => {
      const r = rootM();
      const arr = [];
      for (let o = 0; o < 3; o++) M[modeId].steps.forEach(s => { const n = r + s + 12 * o; if (n <= 84) arr.push(n); });
      return arr;
    };
    const drone = droneButton(() => rootM() + 12);
    $('.ctl', el).appendChild(drone);
    function draw() {
      const m = M[modeId];
      const r = rootM();
      kb.clear();
      const deg = T.DEGREE_LABELS(m.steps);
      for (let o = 0; o < 3; o++) m.steps.forEach((s, i) => {
        const n = r + s + 12 * o;
        if (n > 84) return;
        kb.mark(n, i === m.signature.degree - 1 && m.id !== 'ionian' ? 'changed' : 'on', deg[i], m.color);
        if (i === 0) kb.mark(n, 'root');
      });
      $$('.modes .seg-b', el).forEach(b => b.classList.toggle('active', b.dataset.id === modeId));
      const chords = m.vamp.map(([d]) => T.chordName(rootName, m.steps, d));
      $('.lab-info', el).innerHTML = `${modeTag(m)} ${tr('on', 'auf')} <b>${D(rootName)}</b>: ${T.spellD(rootName, m.steps).join(' ')} · Groove: <code>${chords.join(' → ')}</code><br><span class="muted">${m.compare} ${tr('Signature', 'Kennton')}: ${m.signature.label}. ${tr('Heard in', 'Zu hören in')}: ${m.songs.join(', ')}</span>`;
      drone.sync();
    }
    function tick() {
      const m = M[modeId];
      const r = rootM();
      const beat = 60 / +$('.tempo', el).value;
      const [d] = m.vamp[bar % m.vamp.length];
      const tri = T.triad(r + 12, m.steps, d);
      const bass = r - 12 + m.steps[d - 1];
      Sound.note(bass, beat * 1.6, 0, 0.9);
      Sound.chord(tri, beat * 0.9, 0, 0.45);
      Sound.note(bass + 12, beat * 0.5, beat * 1.5, 0.5);
      Sound.chord(tri, beat * 0.5, beat * 2.5, 0.35);
      Sound.note(bass, beat * 0.8, beat * 3, 0.7);
      bar++;
      loop = setTimeout(tick, beat * 4 * 1000);
    }
    const grooveBtn = $('[data-a=groove]', el);
    const stopLoop = () => { clearTimeout(loop); loop = null; grooveBtn.textContent = `▶ ${tr('Start groove', 'Groove starten')}`; };
    onCleanup(stopLoop);
    grooveBtn.onclick = () => {
      if (loop) { stopLoop(); return; }
      bar = 0; tick();
      grooveBtn.textContent = `■ ${tr('Stop groove', 'Groove stoppen')}`;
    };
    $('[data-a=scale]', el).onclick = () => Sound.scale(M[modeId].steps.map(s => rootM() + 12 + s));
    $('.root', el).onchange = (e) => { rootName = e.target.value; draw(); };
    $$('.modes .seg-b', el).forEach(b => b.onclick = () => { modeId = b.dataset.id; draw(); });
    const keyHandler = (e) => {
      if (!el.isConnected) { document.removeEventListener('keydown', keyHandler); return; }
      if (e.repeat || e.target.matches('input, select, textarea') || e.metaKey || e.ctrlKey) return;
      const i = KEYMAP.indexOf(e.key.toLowerCase());
      if (i < 0) return;
      const notes = playable();
      Sound.note(notes[7 + i] ?? notes[notes.length - 1], 0.5, 0, 0.9);
    };
    document.addEventListener('keydown', keyHandler);
    onCleanup(() => document.removeEventListener('keydown', keyHandler));
    draw();
  };

  function mount(root) {
    $$('[data-widget]', root).forEach(el => {
      const fn = W[el.dataset.widget];
      if (fn) fn(el);
    });
  }

  return { mount, cleanup, modeTag };
})();
