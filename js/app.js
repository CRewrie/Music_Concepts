// App shell: routing, pages, header.
(() => {
  const { $, $$, html, Progress, confetti, toast } = UI;
  const app = $('#app');
  const L = Course.lessons;
  const lessonIdx = (id) => L.findIndex(l => l.id === id);
  const doneIds = () => L.filter(l => Progress.isDone(l.id)).map(l => l.id);

  const BADGES = {
    booted: ['🥾', tr('Booted', 'Gebootet'), tr('Finished lesson 1', 'Lektion 1 abgeschlossen')],
    graduate: ['🎓', tr('Graduate', 'Absolvent'), tr('Finished every lesson', 'Alle Lektionen abgeschlossen')],
    'golden-ear': ['👂', tr('Golden Ear', 'Goldenes Ohr'), tr('5 ear questions in a row', '5 Hörfragen in Folge')],
    combo10: ['🔥', tr('Combo ×10', 'Kombo ×10'), tr('10 correct in a row', '10 richtige in Folge')],
    jammer: ['🎹', 'Jammer', tr('Opened the Mode Lab', 'Modus-Labor geöffnet')],
    reviewer: ['🔁', tr('Reviewer', 'Wiederholer'), tr('Finished a practice session', 'Eine Übungsrunde abgeschlossen')],
  };
  const badge = (id) => Progress.badge(id, BADGES[id][1]);

  // ---------- Static shell text ----------
  function initShell() {
    document.title = tr('Music Concepts: Church Modes', 'Music Concepts: Kirchentonarten');
    $('meta[name=description]').content = tr(
      'An interactive, playful course on the church modes (Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian) and how they became today\'s major and minor keys.',
      'Ein interaktiver, verspielter Kurs über die Kirchentonarten (Ionisch, Dorisch, Phrygisch, Lydisch, Mixolydisch, Äolisch, Lokrisch) und wie daraus unsere heutigen Dur- und Moll-Tonarten wurden.');
    const [course, practice, lab] = $$('.nav a');
    course.textContent = tr('Course', 'Kurs');
    practice.textContent = tr('Practice', 'Üben');
    lab.textContent = tr('Lab', 'Labor');
    $('.skip').textContent = tr('Skip to content', 'Zum Inhalt springen');
    $('#stopall').title = $('#stopall').ariaLabel = tr('Stop all sound', 'Alle Klänge stoppen');
    $('#foot-sound').textContent = tr('Made with Web Audio. Turn your sound on 🔊', 'Mit Web Audio gemacht. Ton an! 🔊');
    $('#foot-save').textContent = tr('Progress is saved in this browser.', 'Der Fortschritt wird in diesem Browser gespeichert.');
    $('#reset').textContent = tr('Reset progress', 'Fortschritt zurücksetzen');
    const lang = $('#lang');
    lang.textContent = tr('🇩🇪 DE', '🇬🇧 EN');
    lang.title = lang.ariaLabel = tr('Auf Deutsch umschalten', 'Switch to English');
    lang.onclick = () => I18N.set(I18N.lang() === 'de' ? 'en' : 'de');
  }

  // ---------- Header ----------
  function renderHeader() {
    const s = Progress.get();
    const lv = Progress.level();
    $('#hud').innerHTML = `
      <span class="lvl" title="Level ${lv.n}">LV${lv.n} <b>${lv.name}</b></span>
      <span class="xpbar" title="${s.xp} XP${lv.next ? ' / ' + lv.next : ''}"><i style="width:${Math.round(lv.pct * 100)}%"></i></span>
      <span class="xp">${s.xp} XP</span>
      ${s.streak.count ? `<span class="streak" title="${tr('Daily streak', 'Tage in Folge')}">🔥${s.streak.count}</span>` : ''}`;
    const r = location.hash || '#/';
    $$('.nav a').forEach(a => a.classList.toggle('active', r.startsWith(a.getAttribute('href')) && (a.getAttribute('href') !== '#/' || r === '#/')));
  }
  Progress.onChange(renderHeader);

  // ---------- Pages ----------
  function home() {
    const st = Quiz.stats(doneIds().length ? doneIds() : []);
    const next = L.find(l => !Progress.isDone(l.id)) || null;
    const s = Progress.get();
    const cta = next && next !== L[0] ? tr('▶ Continue: ', '▶ Weiter: ') + next.title : next ? tr('▶ Start lesson 1', '▶ Lektion 1 starten') : tr('↻ Revisit lessons', '↻ Lektionen wiederholen');
    const el = html(`<div class="page home">
      <section class="hero">
        <pre class="boot" aria-label="Boot screen"></pre>
        <h1>${tr('Learn the <span class="glow">DOS layer</span> of music.', 'Lerne die <span class="glow">DOS-Ebene</span> der Musik.')}</h1>
        <p class="lead">${tr('Major and minor keys are the Windows you use every day. Underneath runs an older operating system: the <b>church modes</b>. Six short, hands-on lessons with sound, a jam machine, and quizzes that come back right when you\'re about to forget.',
          'Dur- und Moll-Tonarten sind das Windows, das du jeden Tag benutzt. Darunter läuft ein älteres Betriebssystem: die <b>Kirchentonarten</b>. Sechs kurze Lektionen zum Mitmachen, mit Klang, einer Jam-Maschine und Quizfragen, die genau dann wiederkommen, wenn du kurz davor bist, sie zu vergessen.')}</p>
        <div class="row wrap">
          <a class="btn primary big" href="#/lesson/${(next || L[0]).id}">${cta}</a>
          <a class="btn big" href="#/practice">🔁 ${tr('Practice', 'Üben')}${st.due ? ` <span class="pill-n">${st.due} ${tr('due', 'fällig')}</span>` : ''}</a>
          <a class="btn big" href="#/lab">🎹 ${tr('Mode Lab', 'Modus-Labor')}</a>
        </div>
      </section>

      <section>
        <h2 class="sec-h"><span class="prompt">C:\\MODES&gt;</span> DIR</h2>
        <ol class="lesson-list">${L.map((l, i) => {
          const done = Progress.isDone(l.id);
          const isNext = next && next.id === l.id;
          return `<li><a class="lesson-card ${done ? 'done' : ''} ${isNext ? 'next' : ''}" href="#/lesson/${l.id}" style="--c:${Theory.BRIGHTNESS_ORDER[i % 7].color}">
            <span class="lc-n">${String(i + 1).padStart(2, '0')}</span>
            <span class="lc-body"><span class="lc-cmd">${l.cmd}</span><b>${l.title}</b><span class="lc-blurb">${l.blurb}</span></span>
            <span class="lc-meta">${done ? tr('✓ done', '✓ fertig') : isNext ? tr('next ›', 'weiter ›') : `${l.minutes} min`}</span></a></li>`;
        }).join('')}</ol>
      </section>

      <section class="grid2">
        <div class="panel">
          <h2 class="sec-h">${tr('Your stats', 'Deine Statistik')}</h2>
          <div class="stats">
            <div><b>${doneIds().length}/${L.length}</b><span>${tr('lessons', 'Lektionen')}</span></div>
            <div><b>${st.mastered}</b><span>${tr('cards mastered', 'Karten gemeistert')}</span></div>
            <div><b>${s.stats.answered ? Math.round(100 * s.stats.correct / s.stats.answered) : 0}%</b><span>${tr('accuracy', 'Trefferquote')}</span></div>
            <div><b>×${s.best}</b><span>${tr('best combo', 'beste Kombo')}</span></div>
          </div>
          <div class="badges">${Object.entries(BADGES).map(([id, [e, n, d]]) => `<span class="bdg ${s.badges.includes(id) ? 'got' : ''}" title="${n}: ${d}">${e}<small>${n}</small></span>`).join('')}</div>
        </div>
        <div class="panel">
          <h2 class="sec-h">${tr('How this course teaches', 'So lernst du hier')}</h2>
          <ul class="methods">${tr(`
            <li><b>🎧 Hear it, don't just read it.</b> Every concept comes with sound (dual coding).</li>
            <li><b>🔮 Predict first.</b> Guessing before the reveal makes the answer stick (generation effect).</li>
            <li><b>🧠 Retrieval practice.</b> Each lesson ends with a quiz. Recalling beats re-reading.</li>
            <li><b>🔁 Spaced repetition.</b> Missed cards come back soon; known cards wait days (Leitner boxes).</li>
            <li><b>🔀 Interleaving.</b> Practice mixes topics, so you learn to tell modes apart.</li>
            <li><b>🎹 Make music.</b> The Mode Lab lets you jam, which is the real goal.</li>`, `
            <li><b>🎧 Hören statt nur lesen.</b> Jedes Konzept kommt mit Klang (duale Kodierung).</li>
            <li><b>🔮 Erst raten.</b> Wer vor der Auflösung tippt, behält die Antwort besser (Generierungseffekt).</li>
            <li><b>🧠 Abrufübung.</b> Jede Lektion endet mit einem Quiz. Erinnern schlägt Nochmal-Lesen.</li>
            <li><b>🔁 Verteilte Wiederholung.</b> Falsche Karten kommen bald wieder, gewusste erst nach Tagen (Lernkartei nach Leitner).</li>
            <li><b>🔀 Vermischtes Üben.</b> Die Übungen mischen Themen, damit du lernst, die Modi auseinanderzuhalten.</li>
            <li><b>🎹 Musik machen.</b> Im Modus-Labor kannst du jammen, darum geht es ja eigentlich.</li>`)}
          </ul>
        </div>
      </section>
      <section class="coming">
        <h2 class="sec-h">${tr('Coming next', 'Demnächst')}</h2>
        <div class="row wrap">${tr(['Circle of fifths', 'Chords & functions', 'Rhythm & meter', 'Ear training gym'], ['Quintenzirkel', 'Akkorde & Funktionen', 'Rhythmus & Takt', 'Gehörbildungs-Studio']).map(x => `<span class="soon">${x}</span>`).join('')}</div>
      </section>
    </div>`);
    app.appendChild(el);
    bootAnim($('.boot', el));
  }

  function bootAnim(pre) {
    const lines = [
      'MUSIC-BIOS v1547 (c) Glarean Systems',
      tr('Detecting modes...', 'Suche Modi...') + ' ' + Theory.MODES.slice(0, 6).map(m => m.name.toUpperCase()).join(' ') + ` [${Theory.BY_ID.locrian.name.toUpperCase()}?]`,
      tr('Loading MAJOR.SYS ......... OK', 'Lade DUR.SYS ......... OK'),
      tr('Loading MINOR.SYS ......... OK', 'Lade MOLL.SYS ........ OK'),
      'C:\\MODES> _',
    ];
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { pre.textContent = lines.join('\n'); return; }
    let li = 0, ci = 0, out = '';
    const step = () => {
      if (!pre.isConnected || li >= lines.length) return;
      out += lines[li][ci++] ?? '';
      if (ci > lines[li].length) { out += li < lines.length - 1 ? '\n' : ''; li++; ci = 0; }
      pre.textContent = out;
      setTimeout(step, ci === 0 ? 120 : 9);
    };
    step();
  }

  function lesson(id) {
    const i = lessonIdx(id);
    if (i < 0) return notFound();
    const l = L[i];
    const prev = L[i - 1], next = L[i + 1];
    const el = html(`<article class="page lesson">
      <div class="crumbs"><a href="#/">${tr('Course', 'Kurs')}</a> / ${tr(`Lesson ${i + 1} of ${L.length}`, `Lektion ${i + 1} von ${L.length}`)}</div>
      <div class="lesson-progress">${L.map((x, k) => `<a href="#/lesson/${x.id}" class="lp ${k === i ? 'cur' : ''} ${Progress.isDone(x.id) ? 'done' : ''}" title="${x.title}"></a>`).join('')}</div>
      <header class="lesson-h">
        <div class="prompt-line"><span class="prompt">C:\\MODES&gt;</span> <span class="cmd">${l.cmd}</span><span class="cursor">▌</span></div>
        <h1>${l.title}</h1>
        <p class="muted">⏱ ~${l.minutes} min · ${l.blurb}</p>
      </header>
      <div class="lesson-body">${l.html}</div>
      <section class="checkpoint">
        <h2 class="sec-h">🧠 Checkpoint</h2>
        <p class="muted">${tr('Recall beats re-reading. Answer without scrolling up; mistakes are fine and help you learn.', 'Erinnern schlägt Nochmal-Lesen. Antworte, ohne hochzuscrollen; Fehler sind okay und helfen beim Lernen.')}</p>
        <div class="quiz-box"><button class="btn primary big" data-a="start">${tr(`Start checkpoint (${l.quiz.length} questions)`, `Checkpoint starten (${l.quiz.length} Fragen)`)}</button></div>
      </section>
      <nav class="lesson-nav">
        ${prev ? `<a class="btn" href="#/lesson/${prev.id}">‹ ${prev.title}</a>` : '<span></span>'}
        ${next ? `<a class="btn" href="#/lesson/${next.id}">${next.title} ›</a>` : `<a class="btn" href="#/practice">${tr('Practice arena', 'Übungsarena')} ›</a>`}
      </nav>
    </article>`);
    app.appendChild(el);
    Widgets.mount(el);
    const startQuiz = () => {
      Sound.unlock();
      Quiz.run($('.quiz-box', el), Quiz.lessonSet(l.id, l.quiz), {
        title: `Checkpoint ${i + 1}`,
        onFinish: ({ root }) => {
          const first = Progress.completeLesson(l.id);
          if (first) {
            Progress.addXP(30);
            toast(tr('✓ Lesson complete! +30 XP', '✓ Lektion abgeschlossen! +30 XP'), 'good');
            confetti(50);
          }
          if (l.id === 'boot') badge('booted');
          if (L.every(x => Progress.isDone(x.id))) badge('graduate');
          const actions = html(`<div class="row wrap center">
            ${next ? `<a class="btn primary" href="#/lesson/${next.id}">${tr('Next lesson', 'Nächste Lektion')}: ${next.title} ›</a>` : `<a class="btn primary" href="#/practice">🔁 ${tr('Go to the practice arena', 'Ab in die Übungsarena')} ›</a>`}
            <button class="btn" type="button" data-a="again">↻ ${tr('Retry', 'Nochmal')}</button></div>`);
          root.querySelector('.quiz-stage').appendChild(actions);
          $('[data-a=again]', actions).onclick = startQuiz;
          renderHeader();
        },
      });
    };
    $('[data-a=start]', el).onclick = startQuiz;
  }

  function practice() {
    const ids = doneIds();
    const st = Quiz.stats(ids);
    const all = Quiz.stats(L.map(l => l.id));
    const el = html(`<div class="page practice">
      <header class="lesson-h">
        <div class="prompt-line"><span class="prompt">C:\\MODES&gt;</span> <span class="cmd">PRACTICE /SPACED</span><span class="cursor">▌</span></div>
        <h1>${tr('Practice arena', 'Übungsarena')}</h1>
        <p class="muted">${tr('10 mixed questions from the lessons you finished. Cards you miss come back in minutes; cards you know wait days, then weeks. Five minutes a day beats an hour once a week.',
          '10 gemischte Fragen aus den Lektionen, die du abgeschlossen hast. Falsch beantwortete Karten kommen nach Minuten wieder, gewusste erst nach Tagen, dann Wochen. Fünf Minuten am Tag schlagen eine Stunde pro Woche.')}</p>
      </header>
      <div class="stats">
        <div><b>${st.total}</b><span>${tr('cards unlocked', 'Karten freigeschaltet')}</span></div>
        <div><b>${st.due}</b><span>${tr('due now', 'jetzt fällig')}</span></div>
        <div><b>${st.fresh}</b><span>${tr('new', 'neu')}</span></div>
        <div><b>${st.mastered}</b><span>${tr('mastered', 'gemeistert')}</span></div>
      </div>
      <div class="boxes">${[0, 1, 2, 3, 4, 5].map(b => {
        const n = Quiz.CARDS.filter(c => ids.includes(c.lesson) && Progress.card(c.id).seen && Progress.card(c.id).box === b).length;
        return `<div class="lbox"><i style="height:${Math.min(100, n * 8)}%"></i><span>${n}</span><small>${tr('box', 'Fach')} ${b}</small></div>`;
      }).join('')}</div>
      <div class="quiz-box">${ids.length
        ? `<button class="btn primary big" data-a="go">▶ ${tr('Start session', 'Runde starten')}</button> <button class="btn big" data-a="ear">🎧 ${tr('Ear-only session', 'Nur Hörfragen')}</button>`
        : `<p>${tr(`You haven't finished a lesson yet, so no cards are unlocked. <a href="#/lesson/boot">Start lesson 1</a>, or jump in with everything (${all.total} cards):`,
          `Du hast noch keine Lektion abgeschlossen, also sind noch keine Karten freigeschaltet. <a href="#/lesson/boot">Starte Lektion 1</a> oder spring direkt mit allem rein (${all.total} Karten):`)}</p><button class="btn big" data-a="all">⚡ ${tr('Practice everything anyway', 'Trotzdem alles üben')}</button>`}</div>
    </div>`);
    app.appendChild(el);
    const start = (lessonIds, earOnly = false) => {
      Sound.unlock();
      let items = Quiz.buildSession(lessonIds, earOnly ? 40 : 10);
      if (earOnly) items = items.filter(x => x.q.ear).slice(0, 10);
      if (!items.length) { toast(tr('No ear-training cards unlocked yet. Finish lesson 3!', 'Noch keine Hörkarten freigeschaltet. Schließ Lektion 3 ab!')); return; }
      Quiz.run($('.quiz-box', el), items, {
        title: earOnly ? tr('Ear session', 'Hörrunde') : tr('Practice session', 'Übungsrunde'),
        onFinish: ({ root }) => {
          badge('reviewer');
          const a = html(`<div class="row wrap center"><button class="btn primary" type="button">↻ ${tr('Another round', 'Noch eine Runde')}</button><a class="btn" href="#/">${tr('Home', 'Start')}</a></div>`);
          a.querySelector('button').onclick = () => route();
          root.querySelector('.quiz-stage').appendChild(a);
        },
      });
    };
    $('[data-a=go]', el) && ($('[data-a=go]', el).onclick = () => start(ids));
    $('[data-a=ear]', el) && ($('[data-a=ear]', el).onclick = () => start(ids, true));
    $('[data-a=all]', el) && ($('[data-a=all]', el).onclick = () => start(L.map(l => l.id)));
  }

  function lab() {
    const el = html(`<div class="page labpage">
      <header class="lesson-h">
        <div class="prompt-line"><span class="prompt">C:\\MODES&gt;</span> <span class="cmd">MODELAB</span><span class="cursor">▌</span></div>
        <h1>${tr('Mode Lab', 'Modus-Labor')}</h1>
        <p class="muted">${tr('A sandbox. Start a groove, switch modes while it plays, and listen to the color change. Challenge: play the same melody in Dorian and then in Aeolian. Only one note differs. Can you hear it?',
          'Ein Sandkasten. Starte einen Groove, wechsle den Modus, während er läuft, und hör, wie sich die Farbe ändert. Challenge: Spiel dieselbe Melodie in Dorisch und dann in Äolisch. Nur ein Ton ist anders. Hörst du ihn?')}</p>
      </header>
      <div data-widget="lab"></div>
      <div data-widget="brightness"></div>
      <div data-widget="relatives"></div>
    </div>`);
    app.appendChild(el);
    Widgets.mount(el);
    badge('jammer');
  }

  function notFound() {
    app.appendChild(html(`<div class="page"><h1>${tr('Bad command or file name', 'Befehl oder Dateiname nicht gefunden')}</h1><p><a href="#/">C:\\&gt; cd home</a></p></div>`));
  }

  // ---------- Router ----------
  function route() {
    Widgets.cleanup();
    app.innerHTML = '';
    const h = location.hash.replace(/^#/, '') || '/';
    const [, a, b] = h.split('/');
    if (!a) home();
    else if (a === 'lesson') lesson(b);
    else if (a === 'practice') practice();
    else if (a === 'lab') lab();
    else notFound();
    renderHeader();
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }
  window.addEventListener('hashchange', route);

  $('#reset').onclick = () => {
    if (confirm(tr('Reset all progress (XP, lessons, cards)?', 'Gesamten Fortschritt zurücksetzen (XP, Lektionen, Karten)?'))) { Progress.reset(); route(); }
  };
  $('#stopall').onclick = () => { Widgets.cleanup(); route(); };
  initShell();
  route();
})();
