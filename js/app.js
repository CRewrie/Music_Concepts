// App shell: routing, pages, header.
(() => {
  const { $, $$, html, Progress, confetti, toast } = UI;
  const app = $('#app');
  const L = Course.lessons;
  const lessonIdx = (id) => L.findIndex(l => l.id === id);
  const doneIds = () => L.filter(l => Progress.isDone(l.id)).map(l => l.id);

  const BADGES = {
    booted: ['🥾', 'Booted', 'Finished lesson 1'],
    graduate: ['🎓', 'Graduate', 'Finished every lesson'],
    'golden-ear': ['👂', 'Golden Ear', '5 ear questions in a row'],
    combo10: ['🔥', 'Combo ×10', '10 correct in a row'],
    jammer: ['🎹', 'Jammer', 'Opened the Mode Lab'],
    reviewer: ['🔁', 'Reviewer', 'Finished a practice session'],
  };

  // ---------- Header ----------
  function renderHeader() {
    const s = Progress.get();
    const lv = Progress.level();
    $('#hud').innerHTML = `
      <span class="lvl" title="Level ${lv.n}">LV${lv.n} <b>${lv.name}</b></span>
      <span class="xpbar" title="${s.xp} XP${lv.next ? ' / ' + lv.next : ''}"><i style="width:${Math.round(lv.pct * 100)}%"></i></span>
      <span class="xp">${s.xp} XP</span>
      ${s.streak.count ? `<span class="streak" title="Daily streak">🔥${s.streak.count}</span>` : ''}`;
    const r = location.hash || '#/';
    $$('.nav a').forEach(a => a.classList.toggle('active', r.startsWith(a.getAttribute('href')) && (a.getAttribute('href') !== '#/' || r === '#/')));
  }
  Progress.onChange(renderHeader);

  // ---------- Pages ----------
  function home() {
    const st = Quiz.stats(doneIds().length ? doneIds() : []);
    const next = L.find(l => !Progress.isDone(l.id)) || null;
    const s = Progress.get();
    const el = html(`<div class="page home">
      <section class="hero">
        <pre class="boot" aria-label="Boot screen"></pre>
        <h1>Learn the <span class="glow">DOS layer</span> of music.</h1>
        <p class="lead">Major and minor keys are the Windows you use every day. Underneath runs an older operating system: the <b>church modes</b>. Six short, hands-on lessons with sound, a jam machine, and quizzes that come back right when you're about to forget.</p>
        <div class="row wrap">
          <a class="btn primary big" href="#/lesson/${(next || L[0]).id}">${next && next !== L[0] ? '▶ Continue: ' + next.title : next ? '▶ Start lesson 1' : '↻ Revisit lessons'}</a>
          <a class="btn big" href="#/practice">🔁 Practice${st.due ? ` <span class="pill-n">${st.due} due</span>` : ''}</a>
          <a class="btn big" href="#/lab">🎹 Mode Lab</a>
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
            <span class="lc-meta">${done ? '✓ done' : isNext ? 'next ›' : `${l.minutes} min`}</span></a></li>`;
        }).join('')}</ol>
      </section>

      <section class="grid2">
        <div class="panel">
          <h2 class="sec-h">Your stats</h2>
          <div class="stats">
            <div><b>${doneIds().length}/${L.length}</b><span>lessons</span></div>
            <div><b>${st.mastered}</b><span>cards mastered</span></div>
            <div><b>${s.stats.answered ? Math.round(100 * s.stats.correct / s.stats.answered) : 0}%</b><span>accuracy</span></div>
            <div><b>×${s.best}</b><span>best combo</span></div>
          </div>
          <div class="badges">${Object.entries(BADGES).map(([id, [e, n, d]]) => `<span class="bdg ${s.badges.includes(id) ? 'got' : ''}" title="${n}: ${d}">${e}<small>${n}</small></span>`).join('')}</div>
        </div>
        <div class="panel">
          <h2 class="sec-h">How this course teaches</h2>
          <ul class="methods">
            <li><b>🎧 Hear it, don't just read it.</b> Every concept comes with sound (dual coding).</li>
            <li><b>🔮 Predict first.</b> Guessing before the reveal makes the answer stick (generation effect).</li>
            <li><b>🧠 Retrieval practice.</b> Each lesson ends with a quiz. Recalling beats re-reading.</li>
            <li><b>🔁 Spaced repetition.</b> Missed cards come back soon; known cards wait days (Leitner boxes).</li>
            <li><b>🔀 Interleaving.</b> Practice mixes topics, so you learn to tell modes apart.</li>
            <li><b>🎹 Make music.</b> The Mode Lab lets you jam, which is the real goal.</li>
          </ul>
        </div>
      </section>
      <section class="coming">
        <h2 class="sec-h">Coming next</h2>
        <div class="row wrap"><span class="soon">Circle of fifths</span><span class="soon">Chords & functions</span><span class="soon">Rhythm & meter</span><span class="soon">Ear training gym</span></div>
      </section>
    </div>`);
    app.appendChild(el);
    bootAnim($('.boot', el));
  }

  function bootAnim(pre) {
    const lines = [
      'MUSIC-BIOS v1547 (c) Glarean Systems',
      'Detecting modes... IONIAN DORIAN PHRYGIAN LYDIAN MIXOLYDIAN AEOLIAN [LOCRIAN?]',
      'Loading MAJOR.SYS ......... OK',
      'Loading MINOR.SYS ......... OK',
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
      <div class="crumbs"><a href="#/">Course</a> / Lesson ${i + 1} of ${L.length}</div>
      <div class="lesson-progress">${L.map((x, k) => `<a href="#/lesson/${x.id}" class="lp ${k === i ? 'cur' : ''} ${Progress.isDone(x.id) ? 'done' : ''}" title="${x.title}"></a>`).join('')}</div>
      <header class="lesson-h">
        <div class="prompt-line"><span class="prompt">C:\\MODES&gt;</span> <span class="cmd">${l.cmd}</span><span class="cursor">▌</span></div>
        <h1>${l.title}</h1>
        <p class="muted">⏱ ~${l.minutes} min · ${l.blurb}</p>
      </header>
      <div class="lesson-body">${l.html}</div>
      <section class="checkpoint">
        <h2 class="sec-h">🧠 Checkpoint</h2>
        <p class="muted">Recall beats re-reading. Answer without scrolling up; mistakes are fine and help you learn.</p>
        <div class="quiz-box"><button class="btn primary big" data-a="start">Start checkpoint (${l.quiz.length} questions)</button></div>
      </section>
      <nav class="lesson-nav">
        ${prev ? `<a class="btn" href="#/lesson/${prev.id}">‹ ${prev.title}</a>` : '<span></span>'}
        ${next ? `<a class="btn" href="#/lesson/${next.id}">${next.title} ›</a>` : '<a class="btn" href="#/practice">Practice arena ›</a>'}
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
            toast(`✓ Lesson complete! +30 XP`, 'good');
            confetti(50);
          }
          if (l.id === 'boot') Progress.badge('booted', 'Booted');
          if (L.every(x => Progress.isDone(x.id))) Progress.badge('graduate', 'Graduate');
          const actions = html(`<div class="row wrap center">
            ${next ? `<a class="btn primary" href="#/lesson/${next.id}">Next lesson: ${next.title} ›</a>` : '<a class="btn primary" href="#/practice">🔁 Go to the practice arena ›</a>'}
            <button class="btn" type="button" data-a="again">↻ Retry</button></div>`);
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
        <h1>Practice arena</h1>
        <p class="muted">10 mixed questions from the lessons you finished. Cards you miss come back in minutes; cards you know wait days, then weeks. Five minutes a day beats an hour once a week.</p>
      </header>
      <div class="stats">
        <div><b>${st.total}</b><span>cards unlocked</span></div>
        <div><b>${st.due}</b><span>due now</span></div>
        <div><b>${st.fresh}</b><span>new</span></div>
        <div><b>${st.mastered}</b><span>mastered</span></div>
      </div>
      <div class="boxes">${[0, 1, 2, 3, 4, 5].map(b => {
        const n = Quiz.CARDS.filter(c => ids.includes(c.lesson) && Progress.card(c.id).seen && Progress.card(c.id).box === b).length;
        return `<div class="lbox"><i style="height:${Math.min(100, n * 8)}%"></i><span>${n}</span><small>box ${b}</small></div>`;
      }).join('')}</div>
      <div class="quiz-box">${ids.length
        ? '<button class="btn primary big" data-a="go">▶ Start session</button> <button class="btn big" data-a="ear">🎧 Ear-only session</button>'
        : `<p>You haven't finished a lesson yet, so no cards are unlocked. <a href="#/lesson/boot">Start lesson 1</a>, or jump in with everything (${all.total} cards):</p><button class="btn big" data-a="all">⚡ Practice everything anyway</button>`}</div>
    </div>`);
    app.appendChild(el);
    const start = (lessonIds, earOnly = false) => {
      Sound.unlock();
      let items = Quiz.buildSession(lessonIds, earOnly ? 40 : 10);
      if (earOnly) items = items.filter(x => x.q.ear).slice(0, 10);
      if (!items.length) { toast('No ear-training cards unlocked yet. Finish lesson 3!'); return; }
      Quiz.run($('.quiz-box', el), items, {
        title: earOnly ? 'Ear session' : 'Practice session',
        onFinish: ({ root }) => {
          Progress.badge('reviewer', 'Reviewer');
          const a = html('<div class="row wrap center"><button class="btn primary" type="button">↻ Another round</button><a class="btn" href="#/">Home</a></div>');
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
        <h1>Mode Lab</h1>
        <p class="muted">A sandbox. Start a groove, switch modes while it plays, and listen to the color change. Challenge: play the same melody in Dorian and then in Aeolian. Only one note differs. Can you hear it?</p>
      </header>
      <div data-widget="lab"></div>
      <div data-widget="brightness"></div>
      <div data-widget="relatives"></div>
    </div>`);
    app.appendChild(el);
    Widgets.mount(el);
    Progress.badge('jammer', 'Jammer');
  }

  function notFound() {
    app.appendChild(html(`<div class="page"><h1>Bad command or file name</h1><p><a href="#/">C:\\&gt; cd home</a></p></div>`));
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
  document.addEventListener('pointerdown', () => Sound.unlock(), { once: true });

  $('#reset').onclick = () => {
    if (confirm('Reset all progress (XP, lessons, cards)?')) { Progress.reset(); route(); }
  };
  $('#stopall').onclick = () => { Widgets.cleanup(); route(); };
  route();
})();
