import './base.css';
import './ui/ui.css';
import { createBoardScene } from './scene/boardScene.js';
import { renderSetupScreen } from './ui/setupScreen.js';
import { startGame } from './game/gameController.js';

const app = document.querySelector('#app');
app.innerHTML = `
  <div id="scene-container"></div>
  <div id="hud-root"></div>
  <div id="ui-root"></div>
`;

const sceneContainer = document.querySelector('#scene-container');
const hudRoot = document.querySelector('#hud-root');
const uiRoot = document.querySelector('#ui-root');

// Build the 3D board immediately so it's already alive — buildings, balloons,
// traffic and all — as the backdrop behind the player setup screen, instead
// of showing a blank page while players fill in their names.
const scene = createBoardScene(sceneContainer);

renderSetupScreen(uiRoot, {
  onStart: (players) => {
    uiRoot.innerHTML = '';
    startGame({ players, scene, uiRoot, hudRoot });
  },
});
