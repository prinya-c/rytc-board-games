// Maps cell id (1-32) to a position on a square perimeter grid (9x9, 0-indexed).
// Path runs clockwise starting at bottom-left (START):
//   1-9   bottom row, left -> right
//   10-17 right column, bottom -> top
//   18-25 top row, right -> left
//   26-32 left column, top -> bottom (ends one cell above START)
const SIDE = 9; // grid cells per edge including corners
const MAX = SIDE - 1; // 8

export function cellGridPosition(id) {
  if (id >= 1 && id <= 9) {
    return { x: id - 1, y: 0 };
  }
  if (id >= 10 && id <= 17) {
    return { x: MAX, y: id - 9 };
  }
  if (id >= 18 && id <= 25) {
    return { x: MAX - (id - 18), y: MAX };
  }
  if (id >= 26 && id <= 32) {
    return { x: 0, y: MAX - (id - 25) };
  }
  throw new Error(`cell id out of range: ${id}`);
}

export function isCorner(id) {
  const { x, y } = cellGridPosition(id);
  return (x === 0 || x === MAX) && (y === 0 || y === MAX);
}

export const GRID_SIDE = SIDE;
export const GRID_MAX = MAX;
