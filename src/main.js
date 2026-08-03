import './base.css';
import './ui/ui.css';
import { createBoardScene } from './scene/boardScene.js';
import { renderSetupScreen } from './ui/setupScreen.js';
import { startGame } from './game/gameController.js';
import { primeAudioOnFirstGesture, isMuted, toggleMuted } from './audio/audioEngine.js';

const app = document.querySelector('#app');
app.innerHTML = `
  <div id="scene-container"></div>
  <div id="hud-root"></div>
  <div id="ui-root"></div>
  <button id="audio-toggle" type="button" aria-label="เปิด/ปิดเสียง"></button>
`;

const sceneContainer = document.querySelector('#scene-container');
const hudRoot = document.querySelector('#hud-root');
const uiRoot = document.querySelector('#ui-root');

// Keep --vh in sync with the actual visible viewport (via visualViewport
// where available) so popup panels size themselves against the space that's
// really on screen, not the browser's full layout viewport — mobile browser
// toolbars (and in-app webviews like LINE) can otherwise cover the bottom of
// a fixed panel, e.g. clipping its action button, without shrinking 100vh.
function syncViewportHeight() {
  const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  document.documentElement.style.setProperty('--vh', `${h * 0.01}px`);
}
syncViewportHeight();
window.addEventListener('resize', syncViewportHeight);
window.addEventListener('orientationchange', () => setTimeout(syncViewportHeight, 300));
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', syncViewportHeight);
}

// Build the 3D board immediately so it's already alive — buildings, balloons,
// traffic and all — as the backdrop behind the player setup screen, instead
// of showing a blank page while players fill in their names.
const scene = createBoardScene(sceneContainer);

// Music/SFX are synthesized (no audio files); the ambient loop starts on the
// player's very first tap/click anywhere, satisfying the browser's autoplay
// policy without needing a dedicated "play music" button.
primeAudioOnFirstGesture();

const audioToggle = document.querySelector('#audio-toggle');
function syncAudioToggle() {
  audioToggle.textContent = isMuted() ? '🔇' : '🔊';
}
syncAudioToggle();
audioToggle.addEventListener('click', () => {
  toggleMuted();
  syncAudioToggle();
});

renderSetupScreen(uiRoot, {
  onStart: (players, gameMode) => {
    uiRoot.innerHTML = '';
    startGame({ players, scene, uiRoot, hudRoot, gameMode });
  },
});
