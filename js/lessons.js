// Course content. Each lesson = HTML with widget mounts + a closing quiz (card ids).
const Course = {
  id: 'church-modes',
  title: 'Church Modes',
  subtitle: 'The DOS layer of Western music',
  lessons: [
    {
      id: 'boot', cmd: 'BOOT', title: 'Same keys, different world', minutes: 6,
      blurb: 'What a mode actually is, and why C major and A minor are secretly the same keys.',
      html: `
        <div class="quote">
          <div class="quote-h">💬 incoming message: Moritz</div>
          <p>"If the normal keys like C major, G major, B♭ major are kind of like <b>Windows</b>, then the church modes are the <b>DOS layer</b>. In theory you don't need to know it, but it's the layer underneath that everything is built on, and it's exciting to know the connection."</p>
        </div>
        <p>Moritz is right. And he's also right that most people forget it after music school. So let's reboot from the command line.</p>
        <h3>The one idea you need</h3>
        <div class="idea"><b>A mode = a set of notes + a "home" note.</b><br>Change the home, keep the notes, and the whole mood changes.</div>
        <p>The piano's white keys are the perfect lab: 7 notes, no sharps, no flats. Let's see what happens when we just pick a different starting key.</p>
        <div data-widget="hook"></div>
        <p>Same seven keys. But starting on C sounds bright and finished, starting on A sounds sad, and starting on D sounds… cool and a little mysterious. Your ear always hears notes <i>relative to home</i>.</p>
        <div class="aside">🧠 <b>Why the drone?</b> Medieval chant often had no chords at all. The "home" was established by the melody returning to its <i>final</i> note, sometimes over a held note. A drone is the quickest way for your ear to lock onto a home.</div>
        <div data-widget="homeBase"></div>
        <p>Seven white keys → seven possible homes → <b>seven modes</b>. Those are the old church modes. Next, let's give them names.</p>
      `,
      quiz: ['l1-what', 'l1-white-aeolian', 'l1-white-dorian'],
    },
    {
      id: 'dir', cmd: 'DIR /MODES', title: 'Seven windows on one belt', minutes: 7,
      blurb: 'The names, the white-key trick, and where the half steps hide.',
      html: `
        <p>Here are the seven modes, one for each white key:</p>
        <div class="table-wrap"><table class="t">
          <tr><th>White key</th><th>C</th><th>D</th><th>E</th><th>F</th><th>G</th><th>A</th><th>B</th></tr>
          <tr><th>Mode</th><td>Ionian</td><td>Dorian</td><td>Phrygian</td><td>Lydian</td><td>Mixolydian</td><td>Aeolian</td><td>Locrian</td></tr>
        </table></div>
        <div class="idea">🪄 Mnemonic: <b>"I Don't Particularly Like Modes A Lot"</b><br>I-D-P-L-M-A-L = C-D-E-F-G-A-B.</div>
        <h3>Why do they sound different?</h3>
        <p>Between most white keys there's a black key, a <b>whole step (W)</b>. But E–F and B–C have no black key between them: those are <b>half steps (H)</b>. Each mode puts those two half steps in a different spot relative to home, and <i>that</i> is what your ear hears as mood.</p>
        <div data-widget="modeExplorer"></div>
        <div class="aside">🔁 Spot it: all seven patterns are rotations of the same cycle <code class="steps">W W H W W W H</code>. A mode is just "where on the belt you start".</div>
        <p>Quick sanity check: Ionian has the half steps at positions 3–4 and 7–8. The 7→8 half step (B→C) is the famous <b>leading tone</b>. Remember it, it'll matter a lot in lesson 5.</p>
      `,
      quiz: ['l2-key-phrygian', 'l2-steps-dorian', 'l2-mnemonic', 'l2-key-mixolydian'],
    },
    {
      id: 'bright', cmd: 'BRIGHTNESS', title: 'From light to dark', minutes: 8,
      blurb: 'Put every mode on the same root and they line up like a dimmer switch.',
      html: `
        <p>The white-key trick is great for <i>finding</i> the modes, but it's lousy for <i>comparing</i> them, because the root keeps moving. So musicians do the opposite: keep the root fixed (say C) and change the notes. These are called <b>parallel modes</b>.</p>
        <p>And here's the beautiful part: the modes line up from bright to dark, and each step <b>lowers exactly one note</b>.</p>
        <div data-widget="brightness"></div>
        <h3>The cheat sheet</h3>
        <div class="table-wrap"><table class="t modes-t">
          <tr><th>Mode</th><th>Think of it as…</th><th>Signature note</th><th>Feels</th></tr>
          ${Theory.BRIGHTNESS_ORDER.map(m => `<tr><td><span class="mtag" style="--c:${m.color}">${m.name}</span></td><td>${m.compare}</td><td>${m.signature.label}</td><td>${m.emoji} ${m.mood}</td></tr>`).join('')}
        </table></div>
        <div class="aside">🎨 <b>Two families.</b> Lydian, Ionian and Mixolydian have a major 3rd, so they feel <i>major</i>. Dorian, Aeolian and Phrygian have a minor 3rd, so they feel <i>minor</i>. Locrian is the odd one out with a diminished 5th.</div>
        <p>Pro tip: you don't need to memorise seven scales. Memorise <b>major</b> and <b>minor</b> plus <b>one changed note</b> each. That's how working musicians think about modes.</p>
      `,
      quiz: ['l3-order', 'l3-sig-dorian', 'l3-ear-lydian', 'l3-formula-mixolydian', 'l3-ear-aeolian'],
    },
    {
      id: 'history', cmd: 'HISTORY', title: 'From chant to chart', minutes: 8,
      blurb: 'Greek names, monks, a Swiss humanist, and a tritone nobody wanted.',
      html: `
        <p>Why "church" modes? Because for roughly a thousand years they were the operating system of church music, the <b>Gregorian chant</b> sung in monasteries all over Europe.</p>
        <div data-widget="timeline"></div>
        <h3>The original 8 (before Glarean)</h3>
        <p>Medieval theory didn't count seven modes, but eight: four home notes, each in two versions. The <b>authentic</b> mode's melody runs from the final up an octave. The <b>plagal</b> ("Hypo-" = below) version keeps the same final, but the melody hovers around it, starting a 4th lower.</p>
        <div class="table-wrap"><table class="t">
          <tr><th>#</th><th>Name</th><th>Final</th><th>Range</th></tr>
          <tr><td>I</td><td>Dorian</td><td>D</td><td>D–D</td></tr>
          <tr><td>II</td><td>Hypodorian</td><td>D</td><td>A–A</td></tr>
          <tr><td>III</td><td>Phrygian</td><td>E</td><td>E–E</td></tr>
          <tr><td>IV</td><td>Hypophrygian</td><td>E</td><td>B–B</td></tr>
          <tr><td>V</td><td>Lydian</td><td>F</td><td>F–F</td></tr>
          <tr><td>VI</td><td>Hypolydian</td><td>F</td><td>C–C</td></tr>
          <tr><td>VII</td><td>Mixolydian</td><td>G</td><td>G–G</td></tr>
          <tr><td>VIII</td><td>Hypomixolydian</td><td>G</td><td>D–D</td></tr>
        </table></div>
        <div class="aside">🤯 Notice what's missing? <b>C and A as homes, the future major and minor!</b> Singers used them anyway (in practice, lots of "Lydian" got a B♭ and became F major). In 1547 Glarean made it official with Ionian and Aeolian.</div>
      `,
      quiz: ['hist-eight', 'hist-glarean', 'hist-locrian', 'hist-greek', 'hist-hypo'],
    },
    {
      id: 'upgrade', cmd: 'UPGRADE.EXE', title: 'How DOS became Windows', minutes: 10,
      blurb: 'The actual answer to Moritz\'s question: how 8 modes turned into 24 keys.',
      html: `
        <p>This is the bit Moritz couldn't remember, and it's the heart of the story. It happened in four steps.</p>
        <h3>Step 1: music started thinking in chords</h3>
        <p>Around 1600, composers stopped thinking only in melodic lines and started thinking in <b>chords</b>. The strongest way to say "the end" with chords is <b>dominant → tonic</b> (V → I). And that cadence needs a <b>leading tone</b>: a note a half step below home that pulls into it.</p>
        <div data-widget="cadence"></div>
        <h3>Step 2: patching the modes (musica ficta)</h3>
        <p>Only Ionian (B→C) and Lydian (E→F) have a leading tone built in. For the others, performers simply sharpened or flattened notes, often without writing them down. This was called <b>musica ficta</b> ("fictional music"). Try the patches yourself:</p>
        <div data-widget="ficta"></div>
        <h3>Step 3: two survivors</h3>
        <p>Patch enough, and nearly everything collapses into two templates:</p>
        <div class="two-col">
          <div class="survivor" style="--c:${Theory.BY_ID.ionian.color}"><b>MAJOR</b><br>= Ionian<br><span class="muted">(Lydian & Mixolydian merged in)</span></div>
          <div class="survivor" style="--c:${Theory.BY_ID.aeolian.color}"><b>MINOR</b><br>= Aeolian + raised 7th<br><span class="muted">(Dorian & Phrygian merged in)</span></div>
        </div>
        <h3>Step 4: install on all 12 roots</h3>
        <p>New tuning systems (well temperament, later equal temperament) made every one of the 12 notes a usable home. 2 templates × 12 roots = <b>24 keys</b>, the "Windows" you know: C major, G major, B♭ major, … Bach celebrated it in 1722 with a piece in every single one.</p>
        <div class="idea">💡 <b>The key insight:</b> a key signature tells you the <i>notes</i>, but not the <i>mode</i>. One flat (B♭) could be F major, D minor, G Dorian, C Mixolydian… The DOS layer is still there, underneath every key.</div>
        <div data-widget="relatives"></div>
        <p>That's why <b>every major key has a "relative minor"</b> (C major ↔ A minor, G major ↔ E minor): they're simply Ionian and Aeolian of the same set of notes. A fossil of the modal system, hiding in plain sight.</p>
        <div class="aside de">🇩🇪 <b>Bonus for German speakers: why is B♭ "B" and B "H"?</b> Medieval notation had two versions of the note B: a soft, round <i>b molle</i> (B♭) and a hard, square <i>b durum</i> (B♮). The square b looked like an "h", so Germans kept calling it H. The shapes also gave us the symbols ♭ (round b) and ♮/♯ (square b). And <b>Dur</b> (major) and <b>Moll</b> (minor) come straight from <i>durus</i> (hard) and <i>mollis</i> (soft). So "B-Dur" literally means "round-B hard"!</div>
      `,
      quiz: ['ficta-why', 'ficta-lydian', 'ficta-two', 'l5-parent-dorian', 'ficta-dur'],
    },
    {
      id: 'today', cmd: 'RUN', title: 'Modes in the wild', minutes: 10,
      blurb: 'How musicians actually use modes today, plus a jam machine.',
      html: `
        <p>After about 200 years in the basement, modes came back, first with Debussy and folk revivalists, then massively in jazz, rock, metal, film and game music. Here's how to use them.</p>
        <h3>Two ways to find any mode</h3>
        <div class="two-col">
          <div class="survivor"><b>1. Parent-scale method</b><br><span class="muted">"D Dorian = C major, starting on D."</span><br>Great for finding the notes.</div>
          <div class="survivor"><b>2. Parallel method</b><br><span class="muted">"D Dorian = D minor with a raised 6th."</span><br>Great for hearing the color. This is how pros think.</div>
        </div>
        <h3>Jam time</h3>
        <p>Start the groove, pick a mode, and improvise. Seriously, do it: playing the sound yourself makes it stick far better than reading about it.</p>
        <div data-widget="lab"></div>
        <h3>Where you've heard them</h3>
        <div class="song-grid">${Theory.BRIGHTNESS_ORDER.map(m => `<div class="song" style="--c:${m.color}"><b>${m.emoji} ${m.name}</b><ul>${m.songs.map(s => `<li>${s}</li>`).join('')}</ul></div>`).join('')}</div>
        <p class="muted small">Song examples are the usual textbook picks. Real songs often mix modes, so treat them as "mostly".</p>
      `,
      quiz: ['l6-build-dorian', 'l6-vamp-mixolydian', 'song-sowhat', 'song-simpsons', 'l6-build-lydian'],
    },
  ],
};

// German version: overrides title/blurb/html per lesson.
if (I18N.lang() === 'de') {
  const T = Theory;
  const DE = {
    boot: {
      title: 'Gleiche Tasten, andere Welt',
      blurb: 'Was ein Modus eigentlich ist, und warum C-Dur und a-Moll heimlich dieselben Tasten sind.',
      html: `
        <div class="quote">
          <div class="quote-h">💬 Neue Nachricht: Moritz</div>
          <p>„Das wäre tatsächlich spannend, 1. weil das die meisten nach dem Studium wieder vergessen und 2. wenn die normalen Tonarten als C-Dur, G-Dur, B-Dur und so weiter quasi wie <b>Windows</b> sind, dann sind Kirchentonarten die <b>DOS-Ebene</b>. Man muss es theoretisch nicht unbedingt kennen, aber es ist die Ebene darunter, auf die alles aufgebaut ist, und spannend, die Verbindung zu kennen.“</p>
        </div>
        <p>Moritz hat recht. Und er hat auch recht damit, dass die meisten es nach dem Studium wieder vergessen. Also booten wir neu, direkt von der Kommandozeile.</p>
        <h3>Die eine Idee, die du brauchst</h3>
        <div class="idea"><b>Ein Modus = ein Tonvorrat + ein „Zuhause“-Ton.</b><br>Wechsle das Zuhause, behalte die Töne, und die ganze Stimmung ändert sich.</div>
        <p>Die weißen Tasten des Klaviers sind das perfekte Labor: 7 Töne, keine Kreuze, keine Bs. Schauen wir, was passiert, wenn wir einfach auf einer anderen Taste anfangen.</p>
        <div data-widget="hook"></div>
        <p>Dieselben sieben Tasten. Aber auf C beginnend klingt es hell und abgeschlossen, auf A traurig, und auf D… cool und ein bisschen geheimnisvoll. Dein Ohr hört Töne immer <i>relativ zum Zuhause</i>.</p>
        <div class="aside">🧠 <b>Warum der Bordun?</b> Mittelalterlicher Choral hatte oft gar keine Akkorde. Das „Zuhause“ entstand dadurch, dass die Melodie immer wieder zu ihrer <i>Finalis</i> (Schlusston) zurückkehrte, manchmal über einem liegenden Ton. Ein Bordun ist der schnellste Weg, damit dein Ohr ein Zuhause findet.</div>
        <div data-widget="homeBase"></div>
        <p>Sieben weiße Tasten → sieben mögliche Zuhause → <b>sieben Modi</b>. Das sind die alten Kirchentonarten. Als Nächstes geben wir ihnen Namen.</p>
      `,
    },
    dir: {
      cmd: 'DIR /MODI',
      title: 'Sieben Fenster auf einem Band',
      blurb: 'Die Namen, der Weiße-Tasten-Trick und wo sich die Halbtöne verstecken.',
      html: `
        <p>Hier sind die sieben Modi, einer für jede weiße Taste:</p>
        <div class="table-wrap"><table class="t">
          <tr><th>Weiße Taste</th><th>C</th><th>D</th><th>E</th><th>F</th><th>G</th><th>A</th><th>H</th></tr>
          <tr><th>Modus</th><td>Ionisch</td><td>Dorisch</td><td>Phrygisch</td><td>Lydisch</td><td>Mixolydisch</td><td>Äolisch</td><td>Lokrisch</td></tr>
        </table></div>
        <div class="idea">🪄 Eselsbrücke: <b>„Im Dunkeln Probt Lisa Mit Anna Laut“</b><br>I-D-P-L-M-Ä-L = C-D-E-F-G-A-H.</div>
        <h3>Warum klingen sie verschieden?</h3>
        <p>Zwischen den meisten weißen Tasten liegt eine schwarze, also ein <b>Ganzton (G)</b>. Aber zwischen E–F und H–C liegt keine schwarze Taste: Das sind <b>Halbtöne (H)</b>. Jeder Modus setzt diese beiden Halbtöne an eine andere Stelle relativ zum Zuhause, und <i>genau das</i> hört dein Ohr als Stimmung.</p>
        <div data-widget="modeExplorer"></div>
        <div class="aside">🔁 Aufgefallen? Alle sieben Muster sind Verschiebungen desselben Kreislaufs <code class="steps">G G H G G G H</code>. Ein Modus ist nur die Frage: „Wo auf dem Band fange ich an?“</div>
        <p>Kurzer Check: Ionisch hat die Halbtöne zwischen Stufe 3–4 und 7–8. Der Halbton 7→8 (H→C) ist der berühmte <b>Leitton</b>. Merk ihn dir, in Lektion 5 wird er wichtig.</p>
      `,
    },
    bright: {
      cmd: 'HELLIGKEIT',
      title: 'Von hell nach dunkel',
      blurb: 'Setz alle Modi auf denselben Grundton, und sie reihen sich auf wie ein Dimmer.',
      html: `
        <p>Der Weiße-Tasten-Trick ist super, um die Modi zu <i>finden</i>, aber schlecht, um sie zu <i>vergleichen</i>, weil der Grundton ständig wandert. Deshalb machen Musiker es umgekehrt: Grundton festhalten (z. B. C) und die Töne verändern. Das nennt man <b>gleichnamige (parallele) Modi</b>.</p>
        <p>Und jetzt das Schöne: Die Modi reihen sich von hell nach dunkel auf, und jeder Schritt <b>erniedrigt genau einen Ton</b>.</p>
        <div data-widget="brightness"></div>
        <h3>Der Spickzettel</h3>
        <div class="table-wrap"><table class="t modes-t">
          <tr><th>Modus</th><th>Stell es dir vor als…</th><th>Kennton</th><th>Klingt</th></tr>
          ${T.BRIGHTNESS_ORDER.map(m => `<tr><td><span class="mtag" style="--c:${m.color}">${m.name}</span></td><td>${m.compare}</td><td>${m.signature.label}</td><td>${m.emoji} ${m.mood}</td></tr>`).join('')}
        </table></div>
        <div class="aside">🎨 <b>Zwei Familien.</b> Lydisch, Ionisch und Mixolydisch haben eine große Terz, sie klingen nach <i>Dur</i>. Dorisch, Äolisch und Phrygisch haben eine kleine Terz, sie klingen nach <i>Moll</i>. Lokrisch tanzt mit seiner verminderten Quinte aus der Reihe.</div>
        <p>Profi-Tipp: Du musst keine sieben Tonleitern auswendig lernen. Merk dir <b>Dur</b> und <b>Moll</b> plus jeweils <b>einen veränderten Ton</b>. So denken Berufsmusiker über Modi.</p>
      `,
    },
    history: {
      cmd: 'GESCHICHTE',
      title: 'Vom Choral zur Tonart',
      blurb: 'Griechische Namen, Mönche, ein Schweizer Humanist und ein Tritonus, den keiner wollte.',
      html: `
        <p>Warum „Kirchen“-Tonarten? Weil sie rund tausend Jahre lang das Betriebssystem der Kirchenmusik waren: des <b>Gregorianischen Chorals</b>, der in Klöstern in ganz Europa gesungen wurde.</p>
        <div data-widget="timeline"></div>
        <h3>Die ursprünglichen 8 (vor Glarean)</h3>
        <p>Die mittelalterliche Theorie zählte nicht sieben, sondern acht Modi: vier Grundtöne, jeweils in zwei Varianten. Beim <b>authentischen</b> Modus läuft die Melodie von der Finalis eine Oktave nach oben. Die <b>plagale</b> Variante („Hypo-“ = unter) behält die Finalis, aber die Melodie kreist um sie herum und beginnt eine Quarte tiefer.</p>
        <div class="table-wrap"><table class="t">
          <tr><th>Nr.</th><th>Name</th><th>Finalis</th><th>Ambitus</th></tr>
          <tr><td>I</td><td>Dorisch</td><td>D</td><td>D–D</td></tr>
          <tr><td>II</td><td>Hypodorisch</td><td>D</td><td>A–A</td></tr>
          <tr><td>III</td><td>Phrygisch</td><td>E</td><td>E–E</td></tr>
          <tr><td>IV</td><td>Hypophrygisch</td><td>E</td><td>H–H</td></tr>
          <tr><td>V</td><td>Lydisch</td><td>F</td><td>F–F</td></tr>
          <tr><td>VI</td><td>Hypolydisch</td><td>F</td><td>C–C</td></tr>
          <tr><td>VII</td><td>Mixolydisch</td><td>G</td><td>G–G</td></tr>
          <tr><td>VIII</td><td>Hypomixolydisch</td><td>G</td><td>D–D</td></tr>
        </table></div>
        <div class="aside">🤯 Fällt dir auf, was fehlt? <b>C und A als Grundton, also das spätere Dur und Moll!</b> Gesungen wurden sie trotzdem (in der Praxis bekam viel „Lydisch“ ein B statt H und war damit einfach F-Dur). 1547 machte Glarean es mit Ionisch und Äolisch offiziell.</div>
      `,
    },
    upgrade: {
      title: 'Wie aus DOS Windows wurde',
      blurb: 'Die eigentliche Antwort auf Moritz’ Frage: wie aus 8 Modi 24 Tonarten wurden.',
      html: `
        <p>Das ist genau der Teil, an den sich Moritz nicht mehr erinnern konnte, und er ist der Kern der Geschichte. Es passierte in vier Schritten.</p>
        <h3>Schritt 1: Die Musik denkt in Akkorden</h3>
        <p>Um 1600 hörten Komponisten auf, nur in Melodielinien zu denken, und begannen, in <b>Akkorden</b> zu denken. Der stärkste Weg, mit Akkorden „Ende“ zu sagen, ist <b>Dominante → Tonika</b> (V → I). Und diese Kadenz braucht einen <b>Leitton</b>: einen Ton einen Halbton unter dem Grundton, der in ihn hineinzieht.</p>
        <div data-widget="cadence"></div>
        <h3>Schritt 2: Die Modi werden gepatcht (Musica ficta)</h3>
        <p>Nur Ionisch (H→C) und Lydisch (E→F) haben einen Leitton eingebaut. Bei den anderen haben die Musiker Töne einfach erhöht oder erniedrigt, oft ohne es aufzuschreiben. Das nannte man <b>Musica ficta</b> („erfundene Musik“). Probier die Patches selbst aus:</p>
        <div data-widget="ficta"></div>
        <h3>Schritt 3: Zwei Überlebende</h3>
        <p>Patcht man genug, fällt fast alles auf zwei Vorlagen zusammen:</p>
        <div class="two-col">
          <div class="survivor" style="--c:${T.BY_ID.ionian.color}"><b>DUR</b><br>= Ionisch<br><span class="muted">(Lydisch & Mixolydisch aufgegangen)</span></div>
          <div class="survivor" style="--c:${T.BY_ID.aeolian.color}"><b>MOLL</b><br>= Äolisch + erhöhte 7. Stufe<br><span class="muted">(Dorisch & Phrygisch aufgegangen)</span></div>
        </div>
        <h3>Schritt 4: Installation auf allen 12 Grundtönen</h3>
        <p>Neue Stimmungssysteme (wohltemperiert, später gleichstufig) machten jeden der 12 Töne zu einem brauchbaren Zuhause. 2 Vorlagen × 12 Grundtöne = <b>24 Tonarten</b>, das „Windows“, das du kennst: C-Dur, G-Dur, B-Dur, … Bach feierte das 1722 mit einem Stück in jeder einzelnen davon.</p>
        <div class="idea">💡 <b>Die Kernerkenntnis:</b> Eine Vorzeichnung verrät dir die <i>Töne</i>, aber nicht den <i>Modus</i>. Ein ♭ (B) kann F-Dur, d-Moll, G-Dorisch, C-Mixolydisch… sein. Die DOS-Ebene ist immer noch da, unter jeder Tonart.</div>
        <div data-widget="relatives"></div>
        <p>Deshalb hat <b>jede Dur-Tonart eine Moll-Paralleltonart</b> (C-Dur ↔ a-Moll, G-Dur ↔ e-Moll): Es sind einfach Ionisch und Äolisch desselben Tonvorrats. Ein Fossil des modalen Systems, mitten vor unserer Nase.</p>
        <div class="aside de">🇩🇪 <b>Bonus: Warum sagen wir B und H, die Engländer aber B♭ und B?</b> Die mittelalterliche Notation kannte zwei Versionen des Tons B: ein weiches, rundes <i>b molle</i> (unser B) und ein hartes, eckiges <i>b durum</i> (unser H). Das eckige b sah aus wie ein „h“, und im Deutschen blieb der Name H hängen. Aus den Formen wurden auch die Zeichen ♭ (rundes b) und ♮/♯ (eckiges b). Und <b>Dur</b> und <b>Moll</b> kommen direkt von <i>durus</i> (hart) und <i>mollis</i> (weich). „B-Dur“ heißt also wörtlich „rundes B, hart“!</div>
      `,
    },
    today: {
      title: 'Modi in freier Wildbahn',
      blurb: 'Wie Musiker Modi heute benutzen, plus eine Jam-Maschine.',
      html: `
        <p>Nach rund 200 Jahren im Keller kamen die Modi zurück: zuerst mit Debussy und der Volksmusik-Bewegung, dann massiv in Jazz, Rock, Metal, Film- und Spielemusik. So benutzt du sie.</p>
        <h3>Zwei Wege zu jedem Modus</h3>
        <div class="two-col">
          <div class="survivor"><b>1. Stammtonleiter-Methode</b><br><span class="muted">„D-Dorisch = C-Dur, beginnend auf D.“</span><br>Gut, um die Töne zu finden.</div>
          <div class="survivor"><b>2. Parallel-Methode</b><br><span class="muted">„D-Dorisch = d-Moll mit erhöhter 6. Stufe.“</span><br>Gut, um die Farbe zu hören. So denken Profis.</div>
        </div>
        <h3>Jam-Zeit</h3>
        <p>Starte den Groove, wähle einen Modus und improvisiere. Wirklich: Den Klang selbst zu spielen, bleibt viel besser hängen als darüber zu lesen.</p>
        <div data-widget="lab"></div>
        <h3>Wo du sie schon gehört hast</h3>
        <div class="song-grid">${T.BRIGHTNESS_ORDER.map(m => `<div class="song" style="--c:${m.color}"><b>${m.emoji} ${m.name}</b><ul>${m.songs.map(s => `<li>${s}</li>`).join('')}</ul></div>`).join('')}</div>
        <p class="muted small">Die Songbeispiele sind die üblichen Lehrbuch-Klassiker. Echte Songs mischen oft Modi, also eher „überwiegend“.</p>
      `,
    },
  };
  Course.title = 'Kirchentonarten';
  Course.subtitle = 'Die DOS-Ebene der westlichen Musik';
  Course.lessons.forEach(l => Object.assign(l, DE[l.id]));
}
