# 🎹 Music Concepts

Interactive, playful music-theory lessons that run in the browser. No build step, no dependencies.

**English & Deutsch:** switch with the 🇩🇪/🇬🇧 button in the header. German mode uses German note names (H, B, Fis, Es, C-Dur, a-Moll).

**Module 1: Church Modes, the "DOS layer" of Western music.**
Major and minor keys are the Windows you use every day; the church modes (Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian) are the older system underneath. The course answers: *how exactly did we get from the modes to today's 24 keys?*

## Lessons

1. **BOOT**: Same keys, different world (what a mode is)
2. **DIR /MODES**: Seven windows on one belt (names, white-key trick, half steps)
3. **BRIGHTNESS**: From light to dark (parallel modes, signature notes)
4. **HISTORY**: From chant to chart (Gregorian chant, 8 modes, Glarean 1547)
5. **UPGRADE.EXE**: How DOS became Windows (leading tone, musica ficta, 24 keys, why German says "H")
6. **RUN**: Modes in the wild (jam machine, songs)

Plus a **Practice arena** (spaced repetition with Leitner boxes, interleaved, ear-training mode) and a **Mode Lab** sandbox.

## Learning design

- Sound for every concept (dual coding), all synthesized live with the Web Audio API
- "Predict first" prompts before reveals (generation effect)
- A checkpoint quiz at the end of every lesson (retrieval practice)
- Spaced repetition: missed cards return in minutes, known ones after days or weeks
- Interleaved practice, so you learn to *tell modes apart*
- Light gamification: XP, levels, combos, streaks, badges
- Progress is stored in `localStorage` (per browser, no account)

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

GitHub Pages → *Deploy from a branch* → `main` / root. `.nojekyll` is included.

## Structure

```
index.html
css/style.css
js/i18n.js      language switch, tr(en, de)
js/theory.js    modes, spelling, chords, note-name display
js/audio.js     Web Audio synth, drone, scheduler
js/ui.js        DOM helpers, keyboard widget, progress store
js/quiz.js      question types, card bank, spaced-repetition sessions
js/widgets.js   interactive lesson widgets
js/lessons.js   course content
js/app.js       router & pages
```

To add a module: add lessons in `js/lessons.js`, widgets in `js/widgets.js`, and cards in `js/quiz.js`.
