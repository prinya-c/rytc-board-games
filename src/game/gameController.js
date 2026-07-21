import { createBoardScene } from '../scene/boardScene.js';
import { createToken, placeTokenAtCell, animateTokenMove } from '../scene/tokens.js';
import { createDice, rollDiceAnimation } from '../scene/dice.js';
import { getCell, BOARD_SIZE } from './cells.js';
import { ZONES } from './zones.js';
import { applyOption, boostTopCategory } from './scoring.js';
import { renderHud } from '../ui/hud.js';
import { showMission } from '../ui/missionModal.js';
import { showPersonalResult, showFinalSummary } from '../ui/resultsScreen.js';

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
        landOnCell(player, token);
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
            player.score = applyOption(player.score, opt, cell.weight || 1);
          }
          endTurn();
        },
      });
      return;
    }

    // event / check mechanics with no direct options
    if (cell.mechanic === 'rollAgain') {
      showMission(uiRoot, cell, {
        player,
        onResolve: () => {
          busy = false;
          syncHud();
        },
      });
      return;
    }

    if (cell.mechanic === 'bonusTopCategory') {
      player.score = boostTopCategory(player.score, 2);
      showMission(uiRoot, cell, { player, onResolve: () => endTurn() });
      return;
    }

    if (cell.mechanic === 'swapOrBoost') {
      showMission(uiRoot, cell, {
        player,
        onResolve: () => {
          if (players.length > 1) {
            const others = players.map((_, i) => i).filter((i) => i !== currentIndex);
            const swapWith = others[Math.floor(Math.random() * others.length)];
            const otherPlayer = players[swapWith];
            const otherToken = tokens[swapWith];
            const tmp = player.position;
            player.position = otherPlayer.position;
            otherPlayer.position = tmp;
            placeTokenAtCell(token, player.position);
            placeTokenAtCell(otherToken, otherPlayer.position);
            endTurn();
          } else {
            const from = player.position;
            const to = Math.min(from + 2, BOARD_SIZE);
            animateTokenMove(token, from, to, {
              onDone: () => {
                player.position = to;
                landOnCell(player, token);
              },
            });
          }
        },
      });
      return;
    }

    // plain checkpoint / start with no special mechanic
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
