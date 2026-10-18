// Tiny Web Audio synth: a soft electric-piano voice, a drone, and a scheduler.
const Sound = (() => {
  let ctx = null, master = null, wet = null;
  let drone = null;
  let activeTimers = [];
  const listeners = new Set();

  // ---------- Mobile unlocking ----------
  // iOS plays Web Audio on the "ambient" channel, which the silent switch mutes.
  // Newer Safari lets us ask for the "playback" channel; older iOS needs a looping
  // silent <audio> element started from a tap to switch the channel.
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* unsupported */ }
  let silentEl = null;

  function silentWavUrl() {
    const rate = 8000, n = rate / 2; // 0.5 s, 8-bit mono
    const buf = new Uint8Array(44 + n);
    const dv = new DataView(buf.buffer);
    const str = (o, s) => [...s].forEach((c, i) => buf[o + i] = c.charCodeAt(0));
    str(0, 'RIFF'); dv.setUint32(4, 36 + n, true); str(8, 'WAVEfmt ');
    dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
    dv.setUint32(24, rate, true); dv.setUint32(28, rate, true); dv.setUint16(32, 1, true); dv.setUint16(34, 8, true);
    str(36, 'data'); dv.setUint32(40, n, true);
    buf.fill(128, 44);
    return 'data:audio/wav;base64,' + btoa(String.fromCharCode(...buf));
  }

  function startSilentLoop() {
    if (!isIOS || navigator.audioSession) return;
    if (!silentEl) {
      silentEl = document.createElement('audio');
      silentEl.setAttribute('x-webkit-airplay', 'deny');
      silentEl.setAttribute('playsinline', '');
      silentEl.loop = true;
      silentEl.preload = 'auto';
      silentEl.src = silentWavUrl();
    }
    if (silentEl.paused) silentEl.play().catch(() => { /* retried on next tap */ });
  }

  // Called from real user gestures (tap/click/key): create/resume the context.
  function unlock() {
    startSilentLoop();
    const c = ensure();
    if (c.state !== 'running') c.resume().catch(() => { /* retried on next tap */ });
    // Old iOS: playing a buffer inside the gesture is what actually unlocks output.
    const b = c.createBufferSource();
    b.buffer = c.createBuffer(1, 1, 22050);
    b.connect(c.destination);
    b.start(0);
  }
  ['touchend', 'pointerup', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, unlock, { capture: true, passive: true }));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { silentEl?.pause(); return; }
    if (ctx && ctx.state !== 'running') ctx.resume().catch(() => { /* needs a tap */ });
  });

  function ensure() {
    if (ctx) {
      // iOS uses "interrupted" (calls, lock screen) in addition to "suspended".
      if (ctx.state !== 'running') ctx.resume().catch(() => { /* needs a tap */ });
      return ctx;
    }
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 4;
    comp.connect(ctx.destination);

    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(comp);

    // Simple generated reverb for some room.
    const conv = ctx.createConvolver();
    const len = ctx.sampleRate * 1.8;
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    conv.buffer = ir;
    wet = ctx.createGain();
    wet.gain.value = 0.22;
    wet.connect(conv);
    conv.connect(comp);
    return ctx;
  }

  const freq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

  function voice(midi, when, dur, vel = 0.8) {
    const t = when;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.32 * vel, t + 0.008);
    out.gain.exponentialRampToValueAtTime(0.12 * vel, t + 0.25);
    out.gain.setValueAtTime(0.12 * vel, t + Math.max(0.26, dur));
    out.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.26, dur) + 0.45);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(4200, t);
    lp.frequency.exponentialRampToValueAtTime(1400, t + 0.6);

    const f = freq(midi);
    const o1 = ctx.createOscillator();
    o1.type = 'triangle';
    o1.frequency.value = f;
    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = f * 2;
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.25, t);
    g2.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
    const o3 = ctx.createOscillator();
    o3.type = 'sine';
    o3.frequency.value = f;

    o1.connect(lp);
    o2.connect(g2).connect(lp);
    o3.connect(lp);
    lp.connect(out);
    out.connect(master);
    out.connect(wet);

    const stop = t + Math.max(0.26, dur) + 0.5;
    [o1, o2, o3].forEach(o => { o.start(t); o.stop(stop); });
  }

  function emit(midi, on) { listeners.forEach(fn => fn(midi, on)); }

  function scheduleVisual(midi, delaySec, dur) {
    activeTimers.push(setTimeout(() => emit(midi, true), delaySec * 1000));
    activeTimers.push(setTimeout(() => emit(midi, false), (delaySec + dur) * 1000));
  }

  function note(midi, dur = 0.6, delay = 0, vel = 0.8) {
    ensure();
    voice(midi, ctx.currentTime + 0.02 + delay, dur, vel);
    scheduleVisual(midi, delay, dur);
  }

  function chord(notes, dur = 1.2, delay = 0, vel = 0.6) {
    notes.forEach((n, i) => note(n, dur, delay + i * 0.012, vel));
  }

  // Play a sequence; each item is a midi number or array (chord). Returns total seconds.
  function sequence(items, step = 0.32, opts = {}) {
    stop();
    ensure();
    const dur = opts.dur ?? step * 0.95;
    items.forEach((it, i) => {
      if (Array.isArray(it)) chord(it, dur, i * step, 0.55);
      else if (it != null) note(it, dur, i * step);
    });
    return items.length * step;
  }

  function scale(midis, { updown = true, step = 0.3 } = {}) {
    const top = midis[0] + 12;
    let seq = [...midis, top];
    if (updown) seq = [...seq, ...[...midis].reverse()];
    return sequence(seq, step);
  }

  function startDrone(rootMidi) {
    ensure();
    stopDrone();
    const t = ctx.currentTime;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.8);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 700;
    lp.Q.value = 0.7;
    const oscs = [];
    [[rootMidi - 12, 'sawtooth', 0], [rootMidi - 12, 'sawtooth', 6], [rootMidi - 5, 'triangle', 0], [rootMidi - 24, 'sine', 0]].forEach(([m, type, det]) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq(m);
      o.detune.value = det;
      o.connect(lp);
      o.start(t);
      oscs.push(o);
    });
    lp.connect(g);
    g.connect(master);
    g.connect(wet);
    drone = { g, oscs, root: rootMidi };
  }

  function stopDrone() {
    if (!drone) return;
    const t = ctx.currentTime;
    drone.g.gain.cancelScheduledValues(t);
    drone.g.gain.setValueAtTime(drone.g.gain.value, t);
    drone.g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    drone.oscs.forEach(o => o.stop(t + 0.45));
    drone = null;
  }

  function stop() {
    activeTimers.forEach(clearTimeout);
    activeTimers = [];
    listeners.forEach(fn => fn(null, false));
  }

  // Short "game" sounds.
  function blip(good) {
    ensure();
    const t = ctx.currentTime + 0.01;
    const seq = good ? [76, 83] : [52, 49];
    seq.forEach((m, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = good ? 'square' : 'sawtooth';
      o.frequency.value = freq(m);
      g.gain.setValueAtTime(0.0001, t + i * 0.08);
      g.gain.exponentialRampToValueAtTime(0.05, t + i * 0.08 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.08 + 0.12);
      o.connect(g).connect(master);
      o.start(t + i * 0.08);
      o.stop(t + i * 0.08 + 0.15);
    });
  }

  return {
    note, chord, sequence, scale, startDrone, stopDrone, stop, blip,
    isDroning: () => !!drone,
    onNote: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    unlock,
  };
})();
