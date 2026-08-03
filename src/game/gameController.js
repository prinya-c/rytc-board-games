import { createBoardScene } from '../scene/boardScene.js';
import { createToken, placeTokenAtCell, animateTokenMove, transformTokenForCareer } from '../scene/tokens.js';
import { createDice, rollDiceAnimation } from '../scene/dice.js';
import { getCell, BOARD_SIZE } from './cells.js';
import { ZONES } from './zones.js';
import { applyOption, computeTop3 } from './scoring.js';
import { generateDiceSequence } from './diceSequence.js';
import { renderHud } from '../ui/hud.js';
import { showMission } from '../ui/missionModal.js';
import { showPersonalResult, showFinalSummary } from '../ui/resultsScreen.js';
import { playHop } from '../audio/audioEngine.js';

export function startGame({ players, sceneContainer, uiRoot, hudRoot, scene: existingScene, gameMode = 'accurate' }) {
  const scene = existingScene ?? createBoardScene(sceneContainer);
  const dice = createDice();
  dice.position.set(0, 0.35, 2.4);
  scene.board.add(dice);

  const tokens = players.map((p, i) => {
    const token = createToken(p.color, i);
    placeTokenAtCell(token, p.position);
    scene.board.add(token);
    return token;
  });

  // Each player gets their own pre-determined roll sequence so that,
  // regardless of the exact dice faces, they're guaranteed to land on at
  // least 2 missions per EEC zone and at least 4 self-discovery missions
  // before reaching FINISH. Individual rolls still show 1-6 like real dice.
  const diceQueues = players.map(() => generateDiceSequence(gameMode).diceQueue);

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
    const queue = diceQueues[currentIndex];
    const value = queue.length > 0 ? queue.shift() : 1 + Math.floor(Math.random() * 6);
    rollDiceAnimation(dice, value, {
      onDone: () => movePlayer(value),
    });
  }

  function movePlayer(steps) {
    const player = currentPlayer();
    const token = tokens[currentIndex];
    const from = player.position;
    const to = Math.min(from + steps, BOARD_SIZE);
    scene.beginTokenFollow();
    animateTokenMove(token, from, to, {
      onUpdate: (pos) => scene.trackTokenPosition(pos),
      onHopLand: () => playHop(),
      onDone: () => {
        player.position = to;
        syncHud(steps);
        const cell = getCell(to);
        if (cell.type === 'finish') {
          const top1 = computeTop3(player.score)[0];
          transformTokenForCareer(token, top1.key);
          scene.celebrateFinish(token.position.clone(), ZONES[top1.key].color, token.rotation.y, {
            onDone: () => landOnCell(player, token),
          });
        } else {
          scene.endTokenFollow(token.position.clone(), { onDone: () => landOnCell(player, token) });
        }
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
