// All sound in this game is synthesized with the Web Audio API — no audio
// files — matching the rest of the project's fully procedural approach
// (canvas textures, generated geometry, etc).

const MUTE_KEY = 'talui-muted';

let ctx = null;
let masterGain = null;
let ambientGain = null;
let sfxGain = null;
let ambientStarted = false;
let padVoices = [];
let twinkleTimer = null;
let muted = localStorage.getItem(MUTE_KEY) === '1';

function ensureContext() {
  if (!ctx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    ctx = new Ctx();
    masterGain = ctx.createGain();
    masterGain.gain.value = muted ? 0 : 1;
    masterGain.connect(ctx.destination);

    ambientGain = ctx.createGain();
    ambientGain.gain.value = 1;
    ambientGain.connect(masterGain);

    sfxGain = ctx.createGain();
    sfxGain.gain.value = 1;
    sfxGain.connect(masterGain);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function isMuted() {
  return muted;
}

export function setMuted(value) {
  muted = value;
  localStorage.setItem(MUTE_KEY, value ? '1' : '0');
  if (masterGain) {
    masterGain.gain.setTargetAtTime(value ? 0 : 1, ctx.currentTime, 0.06);
  }
}

export function toggleMuted() {
  setMuted(!muted);
  return muted;
}

// Starts audio + the ambient loop on the very first user gesture anywhere on
// the page, satisfying browsers' autoplay policy without needing a dedicated
// "play music" button.
export function primeAudioOnFirstGesture() {
  const start = () => {
    ensureContext();
    startAmbient();
    window.removeEventListener('pointerdown', start);
    window.removeEventListener('keydown', start);
  };
  window.addEventListener('pointerdown', start, { once: true });
  window.addEventListener('keydown', start, { once: true });
}

// ---------------- ambient background loop ----------------
// A soft, slowly-detuned pad chord as a bed, plus a generative sparse
// "twinkle" layer of random pentatonic notes so it never feels like an
// obvious short loop repeating.

function startAmbient() {
  if (ambientStarted) return;
  ambientStarted = true;
  const now = ctx.currentTime;
  const chord = [130.81, 164.81, 196.0, 261.63]; // C3 E3 G3 C4

  chord.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.04 + i * 0.015;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 3;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.detune);
    lfo.start(now);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;

    const voiceGain = ctx.createGain();
    voiceGain.gain.value = 0;
    voiceGain.gain.setTargetAtTime(0.05, now + i * 0.6, 2.4);

    osc.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(ambientGain);
    osc.start(now);

    padVoices.push(osc, lfo);
  });

  scheduleTwinkle();
  startBeat();
}

function scheduleTwinkle() {
  const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];

  function playNote() {
    if (!ambientStarted) return;
    const t = ctx.currentTime;
    const freq = pentatonic[Math.floor(Math.random() * pentatonic.length)];
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.07, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);

    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.random() * 1.6 - 0.8;

    osc.connect(g);
    g.connect(pan);
    pan.connect(ambientGain);
    osc.start(t);
    osc.stop(t + 2.3);

    twinkleTimer = setTimeout(playNote, 2400 + Math.random() * 3200);
  }

  twinkleTimer = setTimeout(playNote, 900);
}

// A soft plucked arpeggio + a light shaker flick, locked to a steady 92 BPM
// 8th-note grid — this is what actually gives the ambient bed a beat, on top
// of the sustained pad and the sparse melodic twinkle.
const BEAT_BPM = 92;
const STEP_SECONDS = 60 / BEAT_BPM / 2;
const BEAT_PATTERN = [0, null, 1, null, 2, 1, null, null, 0, null, 2, null, 1, 2, null, null];
let beatSchedulerId = null;
let beatStepIndex = 0;
let nextStepTime = 0;

function scheduleBeatNote(time, chordIndex) {
  const chordFreqs = [261.63, 329.63, 392.0]; // C4 E4 G4 — an octave above the pad
  const freq = chordFreqs[chordIndex];

  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, time);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1500;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(0.1, time + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.3);

  osc.connect(filter);
  filter.connect(g);
  g.connect(ambientGain);
  osc.start(time);
  osc.stop(time + 0.32);
}

function scheduleShaker(time, accent) {
  const bufferSize = Math.floor(ctx.sampleRate * 0.045);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 4200;

  const g = ctx.createGain();
  g.gain.setValueAtTime(accent ? 0.05 : 0.026, time);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);

  noise.connect(filter);
  filter.connect(g);
  g.connect(ambientGain);
  noise.start(time);
}

function startBeat() {
  beatStepIndex = 0;
  nextStepTime = ctx.currentTime + 0.1;
  beatSchedulerId = setInterval(() => {
    // schedule any steps that fall within the next ~120ms lookahead window
    while (nextStepTime < ctx.currentTime + 0.12) {
      const chordIndex = BEAT_PATTERN[beatStepIndex % BEAT_PATTERN.length];
      if (chordIndex !== null) {
        scheduleBeatNote(nextStepTime, chordIndex);
        scheduleShaker(nextStepTime, beatStepIndex % 8 === 0);
      }
      beatStepIndex += 1;
      nextStepTime += STEP_SECONDS;
    }
  }, 25);
}

function stopBeat() {
  if (beatSchedulerId) clearInterval(beatSchedulerId);
  beatSchedulerId = null;
}

export function stopAmbient() {
  ambientStarted = false;
  if (twinkleTimer) clearTimeout(twinkleTimer);
  stopBeat();
  padVoices.forEach((v) => {
    try { v.stop(); } catch { /* already stopped */ }
  });
  padVoices = [];
}

// ---------------- short sound effects ----------------

function blip({ freq = 600, freqTo, duration = 0.09, type = 'sine', gain = 0.35 }) {
  ensureContext();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freqTo) osc.frequency.exponentialRampToValueAtTime(freqTo, t + duration);

  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  osc.connect(g);
  g.connect(sfxGain);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

// Light tick — small UI toggles (color dot, player-count chip).
export function playTick() {
  blip({ freq: 520, freqTo: 640, duration: 0.06, type: 'triangle', gain: 0.28 });
}

// Pop — a primary selection (mission option, roll button).
export function playPop() {
  blip({ freq: 340, freqTo: 620, duration: 0.09, type: 'sine', gain: 0.4 });
}

// Ching — confirm / success (start game, continue after a mission).
export function playChing() {
  blip({ freq: 700, freqTo: 920, duration: 0.1, type: 'sine', gain: 0.38 });
  setTimeout(() => blip({ freq: 1180, duration: 0.14, type: 'sine', gain: 0.22 }), 70);
}

// Boop — token lands on a cell while hopping.
export function playHop() {
  blip({ freq: 260, freqTo: 150, duration: 0.08, type: 'sine', gain: 0.32 });
}
