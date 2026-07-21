import { createBoardScene } from '../scene/boardScene.js';
import { createToken, placeTokenAtCell, animateTokenMove } from '../scene/tokens.js';
import { createDice, rollDiceAnimation } from '../scene/dice.js';
import { getCell, BOARD_SIZE } from './cells.js';
import { ZONES } from './zones.js';
import { applyOption } from './scoring.js';
import { renderHud } from '../ui/hud.js';
import { showMission } from '../ui/missionModal.js';
import { showPersonalResult, showFinalSummary } from '../ui/resultsScreen.js';

// Pause after the token finishes hopping so players see it settle on the
// tile before the mission popup covers the board.
const SETTLE_DELAY = 400;

export function startGame({ players, sceneContainer, uiRoot, hudRoot }) {
  const scene = createBoardScene(sceneContainer);
  const dice = createDice();
  dice.position.set(0, 0.35, 2.4);
  scene.board.add(dice);

  const tokens = players.map((p, i) => {
    const token = createToken(p.color, i);
    placeTokenAtCell(token, p.position);
    scene.board.add(token);
    return token;
  });

  let currentIndex = 0;
  let busy = false;

  const hud = renderHud(hudRoot, { onRoll: handleRoll });

  syncHud();

  function currentPlayer() {
    return players[currentIndex];
  }

  function syncHud(lastRoll) {
    const player = currentPlayer();
    const cell = getCell(player.position);
    const zone = ZONES[cell.zone];
    hud.update({
      player,
      canRoll: !busy,
      lastRoll,
      zoneLabel: zone.name ? `📍 ${zone.name}` : '',
    });
  }

  function handleRoll() {
    if (busy) return;
    busy = true;
    syncHud();
    const value = 1 + Math.floor(Math.random() * 6);
    rollDiceAnimation(dice, value, {
      onDone: () => movePlayer(value),
    });
  }

  function movePlayer(steps) {
    const player = currentPlayer();
    const token = tokens[currentIndex];
    const from = player.position;
    const to = Math.min(from + steps, BOARD_SIZE);
    animateTokenMove(token, from, to, {
      onDone: () => {
        player.position = to;
        syncHud(steps);
        setTimeout(() => {
          scene.focusOnCell(to, { onDone: () => landOnCell(player, token) });
        }, SETTLE_DELAY);
      },
    });
  }

  function landOnCell(player, token) {
    const cell = getCell(player.position);

    if (cell.type === 'finish') {
      showMission(uiRoot, cell, {
        player,
        onResolve: () => {
          player.finished = true;
          const isLast = players.every((p) => p.finished);
          showPersonalResult(uiRoot, player, {
            isLast,
            onContinue: () => {
              if (isLast) {
                showFinalSummary(uiRoot, players, { onRestart: () => window.location.reload() });
              } else {
                endTurn();
              }
            },
          });
        },
      });
      return;
    }

    if (cell.options) {
      showMission(uiRoot, cell, {
        player,
        onResolve: (opt) => {
          if (opt) {
            player.score = applyOption(player.score, opt);
          }
          endTurn();
        },
      });
      return;
    }

    // start cell: no options, just acknowledge and move on
    showMission(uiRoot, cell, { player, onResolve: () => endTurn() });
  }

  function endTurn() {
    busy = false;
    const remaining = players.filter((p) => !p.finished).length;
    if (remaining === 0) return;
    do {
      currentIndex = (currentIndex + 1) % players.length;
    } while (players[currentIndex].finished);
    syncHud();
  }
}
