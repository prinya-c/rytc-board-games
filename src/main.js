import './base.css';
import './ui/ui.css';
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

renderSetupScreen(uiRoot, {
  onStart: (players) => {
    uiRoot.innerHTML = '';
    startGame({ players, sceneContainer, uiRoot, hudRoot });
  },
});
