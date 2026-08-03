// Generates a per-player sequence of "dice roll" values that is fully
// pre-determined, but statistically indistinguishable from a real 1-6 roll
// at each individual step. Two modes:
//  - 'accurate' (default): guarantees ≥2 cells per EEC zone and ≥4
//    self-discovery (type 'A') cells before finishing — ~11-13 rolls.
//  - 'fast': guarantees only ≥1 cell per zone (no type-A minimum) — ~6-8
//    rolls, trading result accuracy for a shorter game.
// Either way the player always finishes exactly on cell 32, never needing
// a single step larger than 6.
import { CELLS, BOARD_SIZE } from './cells.js';
import { ZONE_ORDER } from './zones.js';

const MAX_DIE = 6;
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

function randInt(lo, hi) {
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

/** Fast mode: walk zone by zone, picking one cell per zone from whatever
 * range is still reachable (≤6 away) from the previous pick. Because every
 * zone is exactly 6 cells wide — the same as the max die face — that range
 * is always non-empty, so this never needs the gap-repair fallback. */
function pickFastModeCells() {
  const zoneCells = cellsByZone();
  let current = 1;
  const picks = [];
  for (const zone of ZONE_ORDER) {
    const cells = zoneCells[zone];
    const zoneStart = cells[0].id;
    const zoneEnd = cells[cells.length - 1].id;
    const lo = Math.max(zoneStart, current + 1);
    const hi = Math.min(zoneEnd, current + MAX_DIE);
    const pick = randInt(lo, hi);
    picks.push(pick);
    current = pick;
  }

  // Optional bonus cells (0-2), only added if they keep every gap ≤6.
  const bonusCount = randInt(BONUS_RANGE[0], BONUS_RANGE[1]);
  const used = new Set(picks);
  const candidates = shuffle(CELLS.filter((c) => ZONE_ORDER.includes(c.zone) && !used.has(c.id)));
  for (const cand of candidates) {
    if (picks.length - ZONE_ORDER.length >= bonusCount) break;
    if (used.has(cand.id)) continue;
    const test = [...picks, cand.id].sort((a, b) => a - b);
    const fits = test.every((id, i) => i === 0 || id - test[i - 1] <= MAX_DIE);
    if (fits) {
      picks.push(cand.id);
      used.add(cand.id);
    }
  }

  return picks.sort((a, b) => a - b);
}

function pickAccurateModeCells() {
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
 * the matching list of 1-6 step sizes to reveal on each roll.
 * `mode`: 'accurate' (default, ~11-13 rolls) or 'fast' (~6-8 rolls). */
export function generateDiceSequence(mode = 'accurate') {
  const targets = (mode === 'fast' ? pickFastModeCells() : pickAccurateModeCells())
    .filter((id) => id < BOARD_SIZE);
  const path = repairGaps([1, ...targets, BOARD_SIZE]);
  const diceQueue = [];
  for (let i = 1; i < path.length; i += 1) {
    diceQueue.push(path[i] - path[i - 1]);
  }
  return { path, diceQueue };
}
