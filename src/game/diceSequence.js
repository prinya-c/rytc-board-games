// Generates a per-player sequence of "dice roll" values that is fully
// pre-determined, but statistically indistinguishable from a real 1-6 roll
// at each individual step. The sequence is engineered so that, over the
// course of a game, the player is guaranteed to land on at least 2 cells
// per EEC zone and at least 4 self-discovery (type 'A') cells, then finish
// exactly on cell 32 — without ever needing a single step larger than 6.
import { CELLS, BOARD_SIZE } from './cells.js';
import { ZONE_ORDER } from './zones.js';

const MAX_DIE = 6;
const MIN_PER_ZONE = 2;
const BONUS_RANGE = [0, 2]; // extra random cells added for natural variance

function cellsByZone() {
  const map = Object.fromEntries(ZONE_ORDER.map((z) => [z, []]));
  for (const cell of CELLS) {
    if (map[cell.zone]) map[cell.zone].push(cell);
  }
  return map;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickOneFromEachHalf(all) {
  // Each zone is 6 cells; splitting into a low/high half and taking one
  // pick from each keeps every zone's selection spread out, so neither a
  // same-zone pair nor two neighboring zones' picks can cluster at facing
  // edges — that clustering is what produces >6 gaps between rolls.
  const low = all.slice(0, 3);
  const high = all.slice(3, 6);
  const a = shuffle(low)[0];
  const b = shuffle(high)[0];
  return [a, b];
}

function pickTargetCells() {
  const zoneCells = cellsByZone();
  const selected = new Set();

  for (const zone of ZONE_ORDER) {
    const all = zoneCells[zone];
    const typeA = all.filter((c) => c.type === 'A');

    if (typeA.length > 0) {
      // Guarantee one self-discovery mission per zone that has any
      // (every zone except bio-chem), which also covers the ≥4 type-A quota,
      // while still keeping the pair spread across the zone's low/high half.
      const chosenA = shuffle(typeA)[0];
      const aIdx = chosenA.id - all[0].id;
      const oppositeHalf = aIdx <= 2 ? all.slice(3, 6) : all.slice(0, 3);
      const nonAOpposite = oppositeHalf.filter((c) => c.type !== 'A');
      const fallbackPool = all.filter((c) => c.id !== chosenA.id && c.type !== 'A');
      const fillerPool = nonAOpposite.length > 0 ? nonAOpposite : fallbackPool;
      const filler = shuffle(fillerPool)[0];
      selected.add(chosenA.id);
      selected.add(filler.id);
    } else {
      // bio-chem has no type-A cells; take one spread-out pair instead.
      const [a, b] = pickOneFromEachHalf(all);
      selected.add(a.id);
      selected.add(b.id);
    }
  }

  // A little natural variance so not every game has an identical roll count.
  const bonusCount = BONUS_RANGE[0] + Math.floor(Math.random() * (BONUS_RANGE[1] - BONUS_RANGE[0] + 1));
  const remaining = shuffle(CELLS.filter((c) => ZONE_ORDER.includes(c.zone) && !selected.has(c.id)));
  for (let i = 0; i < bonusCount && i < remaining.length; i += 1) {
    selected.add(remaining[i].id);
  }

  return [...selected].sort((a, b) => a - b);
}

function repairGaps(path) {
  const fixed = [...path];
  const usedIds = new Set(fixed);
  for (let i = 1; i < fixed.length; i += 1) {
    while (fixed[i] - fixed[i - 1] > MAX_DIE) {
      const fillerId = fixed[i - 1] + MAX_DIE;
      if (!usedIds.has(fillerId) && fillerId < fixed[i]) {
        fixed.splice(i, 0, fillerId);
        usedIds.add(fillerId);
      } else {
        // fallback: nudge by one to guarantee progress even in a collision
        const nudged = fixed[i - 1] + 1;
        if (!usedIds.has(nudged) && nudged < fixed[i]) {
          fixed.splice(i, 0, nudged);
          usedIds.add(nudged);
        } else {
          break; // extremely unlikely; avoid infinite loop
        }
      }
    }
  }
  return fixed;
}

/** Builds { path, diceQueue } for one player: path is the sorted list of
 * cell ids they will land on (always ending at BOARD_SIZE), diceQueue is
 * the matching list of 1-6 step sizes to reveal on each roll. */
export function generateDiceSequence() {
  const targets = pickTargetCells().filter((id) => id < BOARD_SIZE);
  const path = repairGaps([1, ...targets, BOARD_SIZE]);
  const diceQueue = [];
  for (let i = 1; i < path.length; i += 1) {
    diceQueue.push(path[i] - path[i - 1]);
  }
  return { path, diceQueue };
}
