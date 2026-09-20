/**
 * @fileoverview AI Opponent Logic for Battleship Game
 *
 * The AI uses the classic Hunt/Target algorithm:
 * - Hunt mode: fire at random untried cells until something is hit
 * - Target mode: after a hit, systematically fire at adjacent cells
 *   until the ship is sunk, then return to hunting
 *
 * @module utils/ai
 *
 * INTERVIEW NOTES:
 * ================
 * This module demonstrates a few core concepts:
 *
 * 1. STATE MACHINE: The AI switches between two modes ('hunt' and
 *    'target') based on the result of its previous shots.
 *
 * 2. QUEUE-BASED SEARCH: When a hit occurs, adjacent cells are pushed
 *    onto a target queue and processed FIFO until the ship is gone.
 *
 * 3. IMMUTABILITY: Each turn returns a NEW hunt-state object rather
 *    than mutating the previous one, matching the store's data flow.
 */

import { AIHuntState, Board, Position } from '@/types';
import { getUntriedCells, isCellShot, isValidPosition } from './board';

/**
 * Creates the initial state for the AI hunting algorithm.
 *
 * The AI operates as a state machine with two modes:
 * - 'hunt': searching for ships (random shots)
 * - 'target': found a ship, systematically destroying it
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
 * // Returns: [{row:1,col:0}, {row:0,col:1}] // Out-of-bounds filtered out
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
 * Picks a random untried cell. Used in hunt mode when there are no
 * queued targets to follow up on.
 *
 * @param {Board} board - Current board state
 * @returns {Position} Random untried position
 *
 * INTERVIEW TIP:
 * O(n²) to collect untried cells, then O(1) to pick one at random.
 */
function getRandomShot(board: Board): Position {
  const available = getUntriedCells(board);
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * Selects the AI's next shot using the Hunt/Target algorithm.
 *
 * TARGET MODE:
 * - Work through the queue of cells adjacent to previous hits.
 * - Skip any that were already shot, fire at the first valid one.
 *
 * HUNT MODE:
 * - If the target queue is empty, fire at a random untried cell.
 *
 * @param {Board} board - Player's board (what the AI shoots at)
 * @param {AIHuntState} huntState - Current AI state
 * @returns {{ position: Position; newState: AIHuntState }}
 *
 * INTERVIEW TIP:
 * The target queue is a FIFO queue. When the AI hits a ship, its
 * neighbors get queued (see updateAIHuntState). The AI drains that
 * queue before going back to random hunting, which is what makes it
 * meaningfully better than pure random guessing.
 *
 * Usage flow each turn:
 * 1. Call getAIShot() to choose a position to fire at.
 * 2. Process the shot with processShot().
 * 3. Call updateAIHuntState() with the result to update the queue.
 */
export function getAIShot(
  board: Board,
  huntState: AIHuntState
): { position: Position; newState: AIHuntState } {
  const newState = { ...huntState, targetQueue: [...huntState.targetQueue] };

  // TARGET MODE: work through cells adjacent to earlier hits.
  while (newState.targetQueue.length > 0) {
    const target = newState.targetQueue.shift()!; // dequeue (FIFO)
    if (!isCellShot(board, target)) {
      return { position: target, newState };
    }
    // Already shot -> discard and try the next queued target.
  }

  // HUNT MODE: nothing queued, fire at a random untried cell.
  newState.mode = 'hunt';
  newState.lastHit = null;
  newState.shipDirection = null;

  return { position: getRandomShot(board), newState };
}

/**
 * Updates AI hunt state after receiving a shot result.
 *
 * This function is called AFTER a shot to update the AI's knowledge:
 *
 * ON HIT:
 * - Switch to target mode
 * - Add the hit to the stack (for direction detection)
 * - Queue adjacent cells for targeting
 * - If 2+ hits fall in a line, prioritize that direction
 *
 * ON SUNK:
 * - Clear all targeting state and return to hunt mode
 *
 * ON MISS:
 * - Keep the current state (continue targeting if in target mode)
 *
 * @param {AIHuntState} state - Current AI state
 * @param {Position} position - Position that was shot
 * @param {'hit' | 'miss' | 'sunk'} result - Result of the shot
 * @param {Board} board - Updated board state
 * @returns {AIHuntState} New AI state
 *
 * INTERVIEW TIP:
 * The direction detection is a simple heuristic: if two hits share a
 * row, the ship is horizontal; if they share a column, it's vertical.
 * We then sort the queue so cells along that direction are tried first.
 */
export function updateAIHuntState(
  state: AIHuntState,
  position: Position,
  result: 'hit' | 'miss' | 'sunk',
  board: Board
): AIHuntState {
  // Create a mutable copy of state (arrays copied too).
  const newState = {
    ...state,
    targetQueue: [...state.targetQueue],
    hitStack: [...state.hitStack],
  };

  if (result === 'hit') {
    // === HIT LOGIC ===
    newState.mode = 'target';
    newState.hitStack.push(position);

    // Queue adjacent cells (skip ones already shot or already queued).
    const adjacent = getAdjacentCells(position);
    for (const adj of adjacent) {
      const alreadyQueued = newState.targetQueue.some(
        (t) => t.row === adj.row && t.col === adj.col
      );
      if (!isCellShot(board, adj) && !alreadyQueued) {
        newState.targetQueue.push(adj);
      }
    }

    // Direction detection: with 2+ hits we can guess ship orientation.
    if (newState.hitStack.length >= 2) {
      const last = newState.hitStack[newState.hitStack.length - 1];
      const prev = newState.hitStack[newState.hitStack.length - 2];

      if (last.row === prev.row) {
        // Same row = horizontal ship; try horizontal targets first.
        newState.shipDirection = 'horizontal';
        newState.targetQueue.sort((a, b) => {
          const aHoriz = a.row === last.row ? 0 : 1;
          const bHoriz = b.row === last.row ? 0 : 1;
          return aHoriz - bHoriz;
        });
      } else if (last.col === prev.col) {
        // Same column = vertical ship; try vertical targets first.
        newState.shipDirection = 'vertical';
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
    // Ship destroyed! Clear targeting state and go back to hunting.
    newState.mode = 'hunt';
    newState.hitStack = [];
    newState.targetQueue = [];
    newState.lastHit = null;
    newState.shipDirection = null;
  }
  // On miss: keep current state unchanged.

  return newState;
}
