// Shared UI helpers: DOM, keyboard widget, progress store, toasts.
const UI = (() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function html(str) {
    const t = document.createElement('template');
    t.innerHTML = str.trim();
    return t.content.firstElementChild;
  }

  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // ---------- Piano keyboard ----------
  const BLACK = new Set([1, 3, 6, 8, 10]);

  function Keyboard(el, { from = 60, octaves = 2, onPress = null, extraTop = true, labels = 'none' } = {}) {
    const to = from + octaves * 12 + (extraTop ? 1 : 0);
    const whites = [];
    for (let m = from; m < to; m++) if (!BLACK.has(m % 12)) whites.push(m);
    const w = 100 / whites.length;
    const kb = document.createElement('div');
    kb.className = 'kb';
    const keys = new Map();
    let wi = 0;
    for (let m = from; m < to; m++) {
      const k = document.createElement('button');
      k.type = 'button';
      k.dataset.midi = m;
      const isBlack = BLACK.has(m % 12);
      k.className = 'key ' + (isBlack ? 'black' : 'white');
      if (isBlack) {
        k.style.left = `calc(${wi * w}% - ${w * 0.32}%)`;
        k.style.width = `${w * 0.64}%`;
      } else {
        k.style.left = `${wi * w}%`;
        k.style.width = `${w}%`;
        wi++;
      }
      k.setAttribute('aria-label', Theory.pcName(m % 12) + Math.floor(m / 12 - 1));
      const lab = document.createElement('span');
      lab.className = 'klabel';
      if (labels === 'white' && !isBlack) lab.textContent = Theory.pcName(m % 12);
      k.appendChild(lab);
      k.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (onPress) onPress(m, k);
        else Sound.note(m, 0.5);
      });
      kb.appendChild(k);
      keys.set(m, k);
    }
    el.innerHTML = '';
    el.appendChild(kb);

    const off = Sound.onNote((midi, on) => {
      if (!kb.isConnected) { off(); return; }
      if (midi == null) { keys.forEach(k => k.classList.remove('playing')); return; }
      const k = keys.get(midi);
      if (k) k.classList.toggle('playing', on);
    });

    return {
      el: kb,
      keys,
      clear(cls) {
        keys.forEach(k => {
          if (cls) k.classList.remove(cls);
          else { k.className = k.className.split(' ').filter(c => ['key', 'white', 'black'].includes(c)).join(' '); k.style.removeProperty('--mark'); }
          if (!cls) k.querySelector('.klabel').textContent = (labels === 'white' && k.classList.contains('white')) ? Theory.pcName(+k.dataset.midi % 12) : '';
        });
      },
      mark(midi, cls = 'on', label = null, color = null) {
        const k = keys.get(midi);
        if (!k) return;
        k.classList.add(cls);
        if (cls === 'changed') k.classList.add('on');
        if (color) k.style.setProperty('--mark', color);
        if (label != null) k.querySelector('.klabel').textContent = label;
      },
      unmark(midi, cls = 'on') { keys.get(midi)?.classList.remove(cls); },
      has(midi, cls = 'on') { return keys.get(midi)?.classList.contains(cls); },
    };
  }

  // ---------- Progress store ----------
  const KEY = 'musicConcepts.v1';
  const defaults = () => ({ xp: 0, lessons: {}, cards: {}, badges: [], best: 0, streak: { day: null, count: 0 }, stats: { answered: 0, correct: 0 } });
  let state;
  try { state = Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY) || '{}')); }
  catch { state = defaults(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable */ } };

  const LEVELS = [
    [0, 'BIOS'], [80, tr('DOS Prompt', 'DOS-Prompt')], [220, tr('Batch Scripter', 'Batch-Skripter')], [450, tr('Mode Hacker', 'Modus-Hacker')],
    [800, 'Glarean.exe'], [1300, tr('Modal Wizard', 'Modal-Zauberer')], [2000, tr('Kernel Composer', 'Kernel-Komponist')],
  ];
  function level(xp = state.xp) {
    let i = 0;
    while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1][0]) i++;
    const [base, name] = LEVELS[i];
    const next = LEVELS[i + 1]?.[0] ?? null;
    return { n: i + 1, name, base, next, pct: next ? (xp - base) / (next - base) : 1 };
  }

  const listeners = new Set();
  const Progress = {
    get: () => state,
    onChange: (fn) => listeners.add(fn),
    addXP(n) {
      const before = level().n;
      state.xp += n;
      touchStreak();
      save();
      listeners.forEach(f => f());
      const after = level();
      if (after.n > before) toast(`⬆ ${tr('LEVEL UP', 'LEVEL-UP')}: ${after.name}`, 'level');
    },
    completeLesson(id) {
      const first = !state.lessons[id];
      state.lessons[id] = { done: true, at: Date.now() };
      save();
      listeners.forEach(f => f());
      return first;
    },
    isDone: (id) => !!state.lessons[id]?.done,
    card: (id) => state.cards[id] || { box: 0, due: 0, seen: 0, right: 0 },
    review(id, correct) {
      const c = Progress.card(id);
      // Leitner boxes; intervals in minutes.
      const INTERVALS = [1, 10, 60 * 24, 60 * 24 * 3, 60 * 24 * 7, 60 * 24 * 21];
      c.box = correct ? Math.min(c.box + 1, INTERVALS.length - 1) : 0;
      c.due = Date.now() + INTERVALS[c.box] * 60000;
      c.seen++;
      if (correct) c.right++;
      state.cards[id] = c;
      state.stats.answered++;
      if (correct) state.stats.correct++;
      save();
    },
    badge(id, label) {
      if (state.badges.includes(id)) return;
      state.badges.push(id);
      save();
      toast(`🏅 ${tr('Badge unlocked', 'Abzeichen freigeschaltet')}: ${label}`, 'badge');
      listeners.forEach(f => f());
    },
    setBest(n) { if (n > state.best) { state.best = n; save(); } },
    reset() { state = defaults(); save(); listeners.forEach(f => f()); },
    level,
  };

  function touchStreak() {
    const today = new Date().toISOString().slice(0, 10);
    const s = state.streak;
    if (s.day === today) return;
    const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    s.count = s.day === y ? s.count + 1 : 1;
    s.day = today;
  }

  // ---------- Toasts & confetti ----------
  function toast(msg, kind = '') {
    let wrap = $('#toasts');
    const t = html(`<div class="toast ${kind}">${msg}</div>`);
    wrap.appendChild(t);
    setTimeout(() => t.classList.add('out'), 2600);
    setTimeout(() => t.remove(), 3200);
  }

  function confetti(n = 40) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = Theory.MODES.map(m => m.color);
    for (let i = 0; i < n; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      c.textContent = pick(['♪', '♫', '♩', '♬', '■']);
      c.style.left = Math.random() * 100 + 'vw';
      c.style.color = pick(colors);
      c.style.animationDuration = 1.2 + Math.random() * 1.4 + 's';
      c.style.animationDelay = Math.random() * 0.3 + 's';
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 3200);
    }
  }

  return { $, $$, html, shuffle, pick, Keyboard, Progress, toast, confetti };
})();
