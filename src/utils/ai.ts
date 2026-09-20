/**
 * @fileoverview AI Opponent Logic for Battleship Game
 *
 * This module implements three difficulty levels of AI opponents:
 * - Easy: Random targeting
 * - Medium: Hunt/Target algorithm
 * - Hard: Probability density mapping
 *
 * @module utils/ai
 *
 * INTERVIEW NOTES:
 * ================
 * This module demonstrates several important CS concepts:
 *
 * 1. ALGORITHM DESIGN: Three different approaches to the same problem
 *    - Brute force (Easy)
 *    - Heuristic-based (Medium)  
 *    - Probabilistic (Hard)
 *
 * 2. STATE MACHINE: The Hunt/Target mode switching
 *    - Hunt mode: searching randomly
 *    - Target mode: exploiting found ships
 *
 * 3. PROBABILITY: Density mapping calculates where ships COULD be
 *    - More possible placements = higher probability
 *    - Center cells naturally have higher probability
 *
 * 4. DATA STRUCTURES: Using arrays as stacks/queues for targeting
 */

import { AIHuntState, Board, Difficulty, Position } from '@/types';
import { BOARD_SIZE, getUntriedCells, isCellShot, isValidPosition } from './board';

/**
 * Creates the initial state for AI hunting algorithm.
 *
 * The AI uses a state machine with two modes:
 * - 'hunt': Searching for ships (random or probability-based)
 * - 'target': Found a ship, systematically destroying it
 *
 * @returns {AIHuntState} Initial hunt state
 *
 * INTERVIEW TIP:
 * This is the State Pattern - the AI's behavior changes based on
 * its current state. The state object holds all context needed
 * to make intelligent decisions across multiple turns.
 */
export function createAIHuntState(): AIHuntState {
  return {
    mode: 'hunt', // Current AI mode: 'hunt' or 'target'
    targetQueue: [], // Cells to try next (adjacent to hits)
    hitStack: [], // Consecutive hits (to determine ship direction)
    lastHit: null, // Most recent successful hit
    shipDirection: null, // Detected ship orientation
  };
}

/**
 * Gets the four adjacent cells (up, down, left, right) for a position.
 *
 * @param {Position} pos - Center position
 * @returns {Position[]} Array of valid adjacent positions
 *
 * @example
 * getAdjacentCells({row: 5, col: 5})
 * // Returns: [{row:4,col:5}, {row:6,col:5}, {row:5,col:4}, {row:5,col:6}]
 *
 * getAdjacentCells({row: 0, col: 0})
 * // Returns: [{row:1,col:0}, {row:0,col:1}] // Corners filtered out
 *
 * INTERVIEW TIP:
 * This is a common pattern in grid-based algorithms (BFS, flood fill, etc.)
 * The filter removes out-of-bounds positions. We don't include diagonals
 * because Battleship ships are only horizontal or vertical.
 */
function getAdjacentCells(pos: Position): Position[] {
  return [
    { row: pos.row - 1, col: pos.col }, // up
    { row: pos.row + 1, col: pos.col }, // down
    { row: pos.row, col: pos.col - 1 }, // left
    { row: pos.row, col: pos.col + 1 }, // right
  ].filter(isValidPosition);
}

/**
 * EASY AI: Pure random targeting.
 *
 * Simply picks a random cell from all untried positions.
 *
 * @param {Board} board - Current board state
 * @returns {Position} Random untried position
 *
 * INTERVIEW TIP:
 * This is O(n²) to collect untried cells, then O(1) to pick randomly.
 * A naive player would use this strategy. It's predictable and can
 * be beaten with good ship placement (corners, edges).
 *
 * Expected shots to win: ~95 shots (given 17 ship cells on 100 cell board)
 */
function getEasyShot(board: Board): Position {
  const available = getUntriedCells(board);
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * MEDIUM AI: Hunt/Target Algorithm
 *
 * This is a classic Battleship algorithm:
 *
 * HUNT MODE:
 * - Fire randomly until we hit something
 * - Upon hit, switch to TARGET mode
 *
 * TARGET MODE:
 * - Add adjacent cells to target queue
 * - Process queue until ship is sunk
 * - After sinking, return to HUNT mode
 *
 * @param {Board} board - Current board state
 * @param {AIHuntState} huntState - Current AI state
 * @returns {{ position: Position; newState: AIHuntState }}
 *
 * INTERVIEW TIP:
 * This uses a Queue (FIFO) for targets. When we hit, we add
 * all 4 adjacent cells. We try them in order until:
 * - We find another hit (add more adjacents)
 * - Ship sinks (clear queue, back to hunt)
 * - All targets exhausted (back to hunt)
 *
 * Expected shots to win: ~65 shots (significantly better than random)
 */
function getMediumShot(
  board: Board,
  huntState: AIHuntState
): { position: Position; newState: AIHuntState } {
  let newState = { ...huntState };

  // TARGET MODE: Process the queue of suspected ship cells
  while (newState.targetQueue.length > 0) {
    const target = newState.targetQueue.shift()!; // Dequeue (FIFO)
    if (!isCellShot(board, target)) {
      return { position: target, newState };
    }
    // If already shot, continue to next target
  }

  // HUNT MODE: No targets in queue, fire randomly
  newState.mode = 'hunt';
  newState.lastHit = null;
  newState.shipDirection = null;

  const position = getEasyShot(board);
  return { position, newState };
}

/**
 * Updates AI hunt state after receiving shot result.
 *
 * This function is called AFTER a shot to update the AI's knowledge:
 *
 * ON HIT:
 * - Switch to target mode
 * - Add hit to stack (for direction detection)
 * - Queue adjacent cells for targeting
 * - If 2+ hits in a line, prioritize that direction
 *
 * ON SUNK:
 * - Clear all targeting state
 * - Return to hunt mode
 *
 * ON MISS:
 * - Keep current state (continue targeting if in target mode)
 *
 * @param {AIHuntState} state - Current AI state
 * @param {Position} position - Position that was shot
 * @param {'hit' | 'miss' | 'sunk'} result - Result of the shot
 * @param {Board} board - Updated board state
 * @returns {AIHuntState} New AI state
 *
 * INTERVIEW TIP:
 * This demonstrates the Observer Pattern - the AI observes the
 * result of its action and updates internal state accordingly.
 * The direction detection is a simple heuristic: if two hits
 * share a row, ship is horizontal; if they share a column, vertical.
 */
export function updateAIHuntState(
  state: AIHuntState,
  position: Position,
  result: 'hit' | 'miss' | 'sunk',
  board: Board
): AIHuntState {
  // Create mutable copy of state
  const newState = {
    ...state,
    targetQueue: [...state.targetQueue],
    hitStack: [...state.hitStack],
  };

  if (result === 'hit') {
    // === HIT LOGIC ===
    newState.mode = 'target';
    newState.hitStack.push(position);

    // Add adjacent cells to target queue (if not already shot or queued)
    const adjacent = getAdjacentCells(position);
    for (const adj of adjacent) {
      const alreadyQueued = newState.targetQueue.some(
        (t) => t.row === adj.row && t.col === adj.col
      );
      if (!isCellShot(board, adj) && !alreadyQueued) {
        newState.targetQueue.push(adj);
      }
    }

    // Direction detection: if we have 2+ hits, determine ship orientation
    if (newState.hitStack.length >= 2) {
      const last = newState.hitStack[newState.hitStack.length - 1];
      const prev = newState.hitStack[newState.hitStack.length - 2];

      if (last.row === prev.row) {
        // Same row = horizontal ship
        newState.shipDirection = 'horizontal';
        // Prioritize horizontal targets (sort them to front of queue)
        newState.targetQueue.sort((a, b) => {
          const aHoriz = a.row === last.row ? 0 : 1;
          const bHoriz = b.row === last.row ? 0 : 1;
          return aHoriz - bHoriz;
        });
      } else if (last.col === prev.col) {
        // Same column = vertical ship
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
    // === SUNK LOGIC ===
    // Ship destroyed! Clear all targeting state and go back to hunting
    newState.mode = 'hunt';
    newState.hitStack = [];
    newState.targetQueue = [];
    newState.lastHit = null;
    newState.shipDirection = null;
  }
  // On miss: keep current state unchanged

  return newState;
}

/**
 * HARD AI: Probability Density Mapping
 *
 * The most sophisticated AI uses probability to determine the best shot.
 *
 * Algorithm:
 * 1. For each remaining ship, calculate all possible placements
 * 2. For each valid placement, increment probability of those cells
 * 3. Cells with more possible ship placements = higher probability
 * 4. Add bonus for center cells (statistically better)
 * 5. Pick from highest probability cells
 *
 * Combined with Hunt/Target mode for efficient ship destruction.
 *
 * @param {Board} board - Current board state
 * @param {AIHuntState} huntState - Current AI state
 * @param {number[]} remainingShipSizes - Sizes of ships not yet sunk
 * @returns {{ position: Position; newState: AIHuntState }}
 *
 * INTERVIEW TIP:
 * This is a Monte Carlo-like approach. The probability map represents
 * the expected value of shooting each cell. It's O(n² * k) where
 * n = BOARD_SIZE and k = sum of remaining ship sizes.
 *
 * Expected shots to win: ~42 shots (optimal human-like play)
 */
function getHardShot(
  board: Board,
  huntState: AIHuntState,
  remainingShipSizes: number[]
): { position: Position; newState: AIHuntState } {
  let newState = { ...huntState, targetQueue: [...huntState.targetQueue] };

  // If in target mode with valid targets, use them first
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

  // HUNT MODE: Use probability density mapping
  const probabilities = calculateProbabilityMap(board, remainingShipSizes);

  // Find maximum probability value
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

  // Pick randomly from highest probability cells (breaks ties)
  const position = candidates[Math.floor(Math.random() * candidates.length)];
  return { position, newState };
}

/**
 * Calculates the probability density map for the board.
 *
 * For each cell, counts how many ways remaining ships could
 * be placed such that they cover that cell.
 *
 * @param {Board} board - Current board state
 * @param {number[]} shipSizes - Sizes of remaining (unsunk) ships
 * @returns {number[][]} 10x10 probability map
 *
 * INTERVIEW TIP:
 * This is the key insight of the Hard AI. Consider a 5-cell Carrier:
 * - Center cell (5,5) can be covered by 10 different placements
 * - Corner cell (0,0) can only be covered by 2 placements
 * Therefore, center cells are statistically more likely to contain ships.
 *
 * The algorithm:
 * 1. Try every possible ship placement (start position + orientation)
 * 2. If valid (no misses/sunk cells blocking), increment covered cells
 * 3. Repeat for all ship sizes
 * 4. Apply center bonus (empirically improves performance)
 */
function calculateProbabilityMap(board: Board, shipSizes: number[]): number[][] {
  // Initialize 10x10 probability grid with zeros
  const probabilities: number[][] = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(0));

  // For each remaining ship size
  for (const size of shipSizes) {
    // Try all horizontal placements
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col <= BOARD_SIZE - size; col++) {
        if (canPlaceShipForProbability(board, row, col, size, 'horizontal')) {
          // This placement is valid - increment all covered cells
          for (let i = 0; i < size; i++) {
            probabilities[row][col + i]++;
          }
        }
      }
    }

    // Try all vertical placements
    for (let row = 0; row <= BOARD_SIZE - size; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (canPlaceShipForProbability(board, row, col, size, 'vertical')) {
          // This placement is valid - increment all covered cells
          for (let i = 0; i < size; i++) {
            probabilities[row + i][col]++;
          }
        }
      }
    }
  }

  // Zero out already-shot cells (can't shoot there again)
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (isCellShot(board, { row, col })) {
        probabilities[row][col] = 0;
      }
    }
  }

  // Apply center bonus: cells closer to center get slight probability boost
  // This is based on the observation that random ship placement
  // tends to favor center cells (more room for large ships)
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

/**
 * Checks if a ship COULD be placed at position (for probability calculation).
 *
 * Unlike regular placement, this only checks for blockers (miss/sunk cells),
 * not for existing ships (since we're calculating probability, not placing).
 *
 * @param {Board} board - Current board state
 * @param {number} startRow - Starting row
 * @param {number} startCol - Starting column
 * @param {number} size - Ship size
 * @param {'horizontal' | 'vertical'} orientation - Ship orientation
 * @returns {boolean} True if ship could potentially be here
 */
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

    // Check bounds
    if (row >= BOARD_SIZE || col >= BOARD_SIZE) return false;

    const cell = board[row][col];
    // Can't place if there's a miss or sunk ship here
    // (hit cells MIGHT be part of a longer unsunk ship, so we allow them)
    if (cell.state === 'miss' || cell.state === 'sunk') {
      return false;
    }
  }
  return true;
}

/**
 * Main AI shot selection function.
 *
 * Delegates to appropriate difficulty algorithm.
 *
 * @param {Board} board - Player's board (what AI shoots at)
 * @param {Difficulty} difficulty - Selected difficulty level
 * @param {AIHuntState} huntState - Current AI state
 * @param {number[]} remainingShipSizes - Sizes of unsunk player ships
 * @returns {{ position: Position; newState: AIHuntState }}
 *
 * INTERVIEW TIP:
 * This is the Strategy Pattern - the algorithm is selected at runtime
 * based on difficulty setting. All three strategies implement the same
 * interface (take board + state, return position + new state).
 *
 * Usage flow:
 * 1. Call getAIShot() to get position to fire at
 * 2. Process the shot with processShot()
 * 3. Call updateAIHuntState() with the result
 * 4. Store new hunt state for next turn
 */
export function getAIShot(
  board: Board,
  difficulty: Difficulty,
  huntState: AIHuntState,
  remainingShipSizes: number[]
): { position: Position; newState: AIHuntState } {
  switch (difficulty) {
    case 'easy':
      // Easy: Pure random, no state needed
      return { position: getEasyShot(board), newState: huntState };

    case 'medium':
      // Medium: Hunt/Target algorithm
      return getMediumShot(board, huntState);

    case 'hard':
      // Hard: Probability + Hunt/Target
      return getHardShot(board, huntState, remainingShipSizes);

    default:
      // Fallback to easy
      return { position: getEasyShot(board), newState: huntState };
  }
}
