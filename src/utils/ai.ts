import { AIHuntState, Board, Difficulty, Position } from '@/types';
import { BOARD_SIZE, getUntriedCells, isCellShot, isValidPosition } from './board';

// Initialize AI hunt state
export function createAIHuntState(): AIHuntState {
  return {
    mode: 'hunt',
    targetQueue: [],
    hitStack: [],
    lastHit: null,
    shipDirection: null,
  };
}

// Get adjacent cells (up, down, left, right)
function getAdjacentCells(pos: Position): Position[] {
  return [
    { row: pos.row - 1, col: pos.col }, // up
    { row: pos.row + 1, col: pos.col }, // down
    { row: pos.row, col: pos.col - 1 }, // left
    { row: pos.row, col: pos.col + 1 }, // right
  ].filter(isValidPosition);
}

// Easy AI: Random shots
function getEasyShot(board: Board): Position {
  const available = getUntriedCells(board);
  return available[Math.floor(Math.random() * available.length)];
}

// Medium AI: Hunt/Target mode
// - Hunt mode: Random shots
// - Target mode: After a hit, try adjacent cells
function getMediumShot(
  board: Board,
  huntState: AIHuntState
): { position: Position; newState: AIHuntState } {
  const newState = { ...huntState };

  // If we have targets in the queue, try them
  while (newState.targetQueue.length > 0) {
    const target = newState.targetQueue.shift()!;
    if (!isCellShot(board, target)) {
      return { position: target, newState };
    }
  }

  // No targets, go back to hunt mode
  newState.mode = 'hunt';
  newState.lastHit = null;
  newState.shipDirection = null;

  // Random shot
  const position = getEasyShot(board);
  return { position, newState };
}

// Update hunt state after a shot result
export function updateAIHuntState(
  state: AIHuntState,
  position: Position,
  result: 'hit' | 'miss' | 'sunk',
  board: Board
): AIHuntState {
  const newState = {
    ...state,
    targetQueue: [...state.targetQueue],
    hitStack: [...state.hitStack],
  };

  if (result === 'hit') {
    newState.mode = 'target';
    newState.hitStack.push(position);

    // Add adjacent cells to target queue
    const adjacent = getAdjacentCells(position);
    for (const adj of adjacent) {
      if (
        !isCellShot(board, adj) &&
        !newState.targetQueue.some((t) => t.row === adj.row && t.col === adj.col)
      ) {
        newState.targetQueue.push(adj);
      }
    }

    // If we have 2+ hits, try to determine direction
    if (newState.hitStack.length >= 2) {
      const last = newState.hitStack[newState.hitStack.length - 1];
      const prev = newState.hitStack[newState.hitStack.length - 2];

      if (last.row === prev.row) {
        newState.shipDirection = 'horizontal';
        // Prioritize horizontal targets
        newState.targetQueue.sort((a, b) => {
          const aHoriz = a.row === last.row ? 0 : 1;
          const bHoriz = b.row === last.row ? 0 : 1;
          return aHoriz - bHoriz;
        });
      } else if (last.col === prev.col) {
        newState.shipDirection = 'vertical';
        // Prioritize vertical targets
        newState.targetQueue.sort((a, b) => {
          const aVert = a.col === last.col ? 0 : 1;
          const bVert = b.col === last.col ? 0 : 1;
          return aVert - bVert;
        });
      }
    }

    newState.lastHit = position;
  } else if (result === 'sunk') {
    // Ship destroyed, clear targeting state
    newState.mode = 'hunt';
    newState.hitStack = [];
    newState.targetQueue = [];
    newState.lastHit = null;
    newState.shipDirection = null;
  }
  // On miss, keep current state but might need to adjust strategy

  return newState;
}

// Hard AI: Probability-based targeting
// - Calculates probability for each cell based on possible ship placements
// - Prioritizes center cells (more likely to contain ships)
// - Uses hunt/target mode with smarter targeting
function getHardShot(
  board: Board,
  huntState: AIHuntState,
  remainingShipSizes: number[]
): { position: Position; newState: AIHuntState } {
  const newState = { ...huntState, targetQueue: [...huntState.targetQueue] };

  // If in target mode with valid targets
  if (newState.mode === 'target' && newState.targetQueue.length > 0) {
    while (newState.targetQueue.length > 0) {
      const target = newState.targetQueue.shift()!;
      if (!isCellShot(board, target)) {
        return { position: target, newState };
      }
    }
    // All targets exhausted
    newState.mode = 'hunt';
    newState.shipDirection = null;
  }

  // Hunt mode: Use probability density
  const probabilities = calculateProbabilityMap(board, remainingShipSizes);

  // Find max probability
  let maxProb = 0;
  let candidates: Position[] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (probabilities[row][col] > maxProb) {
        maxProb = probabilities[row][col];
        candidates = [{ row, col }];
      } else if (probabilities[row][col] === maxProb && maxProb > 0) {
        candidates.push({ row, col });
      }
    }
  }

  // Pick random from highest probability cells
  const position = candidates[Math.floor(Math.random() * candidates.length)];
  return { position, newState };
}

// Calculate probability map for hard AI
function calculateProbabilityMap(board: Board, shipSizes: number[]): number[][] {
  const probabilities: number[][] = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(0));

  for (const size of shipSizes) {
    // Try horizontal placements
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col <= BOARD_SIZE - size; col++) {
        if (canPlaceShipForProbability(board, row, col, size, 'horizontal')) {
          for (let i = 0; i < size; i++) {
            probabilities[row][col + i]++;
          }
        }
      }
    }

    // Try vertical placements
    for (let row = 0; row <= BOARD_SIZE - size; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (canPlaceShipForProbability(board, row, col, size, 'vertical')) {
          for (let i = 0; i < size; i++) {
            probabilities[row + i][col]++;
          }
        }
      }
    }
  }

  // Zero out already shot cells
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (isCellShot(board, { row, col })) {
        probabilities[row][col] = 0;
      }
    }
  }

  // Bonus for center cells (ships more likely there)
  const center = BOARD_SIZE / 2;
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (probabilities[row][col] > 0) {
        const distFromCenter = Math.abs(row - center) + Math.abs(col - center);
        const bonus = Math.max(0, (BOARD_SIZE - distFromCenter) / BOARD_SIZE);
        probabilities[row][col] += bonus * 0.5;
      }
    }
  }

  return probabilities;
}

// Check if a ship could fit at position (for probability calculation)
function canPlaceShipForProbability(
  board: Board,
  startRow: number,
  startCol: number,
  size: number,
  orientation: 'horizontal' | 'vertical'
): boolean {
  for (let i = 0; i < size; i++) {
    const row = orientation === 'vertical' ? startRow + i : startRow;
    const col = orientation === 'horizontal' ? startCol + i : startCol;

    if (row >= BOARD_SIZE || col >= BOARD_SIZE) return false;

    const cell = board[row][col];
    // Can't place if cell is miss or sunk (hit cells might be part of unsunk ship)
    if (cell.state === 'miss' || cell.state === 'sunk') {
      return false;
    }
  }
  return true;
}

// Main AI shot function
export function getAIShot(
  board: Board,
  difficulty: Difficulty,
  huntState: AIHuntState,
  remainingShipSizes: number[]
): { position: Position; newState: AIHuntState } {
  switch (difficulty) {
    case 'easy':
      return { position: getEasyShot(board), newState: huntState };
    case 'medium':
      return getMediumShot(board, huntState);
    case 'hard':
      return getHardShot(board, huntState, remainingShipSizes);
    default:
      return { position: getEasyShot(board), newState: huntState };
  }
}
