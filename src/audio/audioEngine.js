// UI/SFX are synthesized with the Web Audio API (no audio files). Background
// music is the one exception — it plays the user-supplied track, looped,
// through the same Web Audio graph so the mute toggle still controls it.

const MUTE_KEY = 'talui-muted';
const TRACK_URL = `${import.meta.env.BASE_URL}audio/bgm.mp3`;

let ctx = null;
let masterGain = null;
let ambientGain = null;
let sfxGain = null;
let ambientStarted = false;
let trackSource = null;
let muted = localStorage.getItem(MUTE_KEY) === '1';

// Kick off the download immediately (doesn't need an AudioContext / user
// gesture) so the ~6MB file is likely already in hand by the time the
// player's first tap actually starts playback.
let trackBytesPromise = fetch(TRACK_URL).then((r) => r.arrayBuffer());
let decodedTrackPromise = null;

function ensureContext() {
  if (!ctx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    ctx = new Ctx();
    masterGain = ctx.createGain();
    masterGain.gain.value = muted ? 0 : 1;
    masterGain.connect(ctx.destination);

    ambientGain = ctx.createGain();
    ambientGain.gain.value = 0.55;
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

// Starts audio + the background track on the very first user gesture
// anywhere on the page, satisfying browsers' autoplay policy without
// needing a dedicated "play music" button.
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

// ---------------- background music ----------------

async function startAmbient() {
  if (ambientStarted) return;
  ambientStarted = true;
  try {
    if (!decodedTrackPromise) {
      decodedTrackPromise = trackBytesPromise.then((bytes) => ctx.decodeAudioData(bytes));
    }
    const buffer = await decodedTrackPromise;
    if (!ambientStarted) return; // stopped while loading

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(ambientGain);
    source.start();
    trackSource = source;
  } catch (err) {
    console.error('Background music failed to load', err);
  }
}

export function stopAmbient() {
  ambientStarted = false;
  if (trackSource) {
    try { trackSource.stop(); } catch { /* already stopped */ }
    trackSource.disconnect();
    trackSource = null;
  }
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
