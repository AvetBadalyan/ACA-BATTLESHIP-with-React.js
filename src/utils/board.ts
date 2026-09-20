/**
 * @fileoverview Board utility functions for Battleship game
 *
 * This module contains all the core game logic for board management:
 * - Creating and manipulating the game board
 * - Ship placement with validation
 * - Shot processing (hit/miss/sunk detection)
 * - Win condition checking
 *
 * @module utils/board
 *
 * INTERVIEW NOTES:
 * ================
 * Key concepts demonstrated:
 * 1. Immutable data patterns (never mutate, always return new copies)
 * 2. Pure functions (same input → same output, no side effects)
 * 3. Type safety with TypeScript
 * 4. Separation of concerns (board logic separate from UI/state)
 */

import { Board, Cell, Orientation, Position, Ship, SHIP_TYPES, ShipType } from '@/types';

/**
 * Standard Battleship board size (10x10 grid)
 * @constant
 */
export const BOARD_SIZE = 10;

/**
 * Creates an empty 10x10 game board.
 *
 * Each cell contains:
 * - position: {row, col} coordinates
 * - state: 'empty' initially (can become 'ship', 'hit', 'miss', 'sunk')
 * - shipId: null initially (populated when ship is placed)
 *
 * @returns {Board} A 10x10 2D array of Cell objects
 *
 * @example
 * const board = createEmptyBoard();
 * // board[0][0] = { position: {row: 0, col: 0}, state: 'empty', shipId: null }
 *
 * INTERVIEW TIP:
 * This demonstrates the Factory Pattern - a function that creates
 * objects with consistent structure. Using nested loops for 2D array
 * creation is O(n²) where n = BOARD_SIZE.
 */
export function createEmptyBoard(): Board {
  const board: Board = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    const rowCells: Cell[] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      rowCells.push({
        position: { row, col },
        state: 'empty',
        shipId: null,
      });
    }
    board.push(rowCells);
  }
  return board;
}

/**
 * Validates if a position is within board boundaries.
 *
 * @param {Position} pos - The position to validate
 * @returns {boolean} True if position is valid (0-9 for both row and col)
 *
 * @example
 * isValidPosition({ row: 5, col: 5 })  // true
 * isValidPosition({ row: -1, col: 5 }) // false
 * isValidPosition({ row: 10, col: 5 }) // false
 *
 * INTERVIEW TIP:
 * Boundary checking is fundamental in grid-based games.
 * This is O(1) constant time operation.
 */
export function isValidPosition(pos: Position): boolean {
  return pos.row >= 0 && pos.row < BOARD_SIZE && pos.col >= 0 && pos.col < BOARD_SIZE;
}

/**
 * Calculates all positions a ship would occupy based on starting position,
 * size, and orientation.
 *
 * @param {Position} startPos - Top-left position of the ship
 * @param {number} size - Length of the ship (2-5)
 * @param {Orientation} orientation - 'horizontal' or 'vertical'
 * @returns {Position[]} Array of all positions the ship occupies
 *
 * @example
 * // Horizontal ship of size 3 at position (2,3)
 * getShipPositions({row: 2, col: 3}, 3, 'horizontal')
 * // Returns: [{row:2, col:3}, {row:2, col:4}, {row:2, col:5}]
 *
 * // Vertical ship of size 3 at position (2,3)
 * getShipPositions({row: 2, col: 3}, 3, 'vertical')
 * // Returns: [{row:2, col:3}, {row:3, col:3}, {row:4, col:3}]
 *
 * INTERVIEW TIP:
 * This is O(n) where n = ship size. The ternary operator chooses
 * which coordinate to increment based on orientation.
 */
export function getShipPositions(
  startPos: Position,
  size: number,
  orientation: Orientation
): Position[] {
  const positions: Position[] = [];
  for (let i = 0; i < size; i++) {
    if (orientation === 'horizontal') {
      positions.push({ row: startPos.row, col: startPos.col + i });
    } else {
      positions.push({ row: startPos.row + i, col: startPos.col });
    }
  }
  return positions;
}

/**
 * Validates if a ship can be placed at the given position.
 *
 * A placement is valid if:
 * 1. All cells are within board boundaries
 * 2. No cells overlap with existing ships (except the ship being moved)
 *
 * @param {Board} board - Current board state
 * @param {Position} startPos - Proposed starting position
 * @param {number} size - Ship size
 * @param {Orientation} orientation - Ship orientation
 * @param {string} [excludeShipId] - Ship ID to exclude (for repositioning)
 * @returns {boolean} True if placement is valid
 *
 * @example
 * const board = createEmptyBoard();
 * canPlaceShip(board, {row: 0, col: 0}, 5, 'horizontal'); // true
 * canPlaceShip(board, {row: 0, col: 8}, 5, 'horizontal'); // false (out of bounds)
 *
 * INTERVIEW TIP:
 * The excludeShipId parameter allows repositioning ships - when dragging
 * a ship to a new position, we ignore its current cells. This is a
 * common pattern for "edit" operations in CRUD systems.
 */
export function canPlaceShip(
  board: Board,
  startPos: Position,
  size: number,
  orientation: Orientation,
  excludeShipId?: string
): boolean {
  const positions = getShipPositions(startPos, size, orientation);

  // Check all positions are valid and not occupied
  for (const pos of positions) {
    if (!isValidPosition(pos)) {
      return false;
    }
    const cell = board[pos.row][pos.col];
    if (cell.shipId !== null && cell.shipId !== excludeShipId) {
      return false;
    }
  }

  return true;
}

/**
 * Places a ship on the board.
 *
 * This function:
 * 1. Validates placement is legal
 * 2. Creates a NEW board (immutable pattern)
 * 3. Marks cells with ship state and ID
 * 4. Returns both the new board and ship object
 *
 * @param {Board} board - Current board state
 * @param {ShipType} shipType - Type of ship to place
 * @param {Position} startPos - Starting position
 * @param {Orientation} orientation - Ship orientation
 * @returns {{ board: Board; ship: Ship } | null} New board and ship, or null if invalid
 *
 * @example
 * const result = placeShip(board, SHIP_TYPES[0], {row: 0, col: 0}, 'horizontal');
 * if (result) {
 *   const { board: newBoard, ship } = result;
 *   // newBoard has the ship placed, original board unchanged
 * }
 *
 * INTERVIEW TIP:
 * Immutability Pattern: We use map() to create new arrays rather than
 * modifying in place. This is crucial for React's change detection
 * and enables features like undo/redo. The spread operator {...cell}
 * creates shallow copies of cell objects.
 */
export function placeShip(
  board: Board,
  shipType: ShipType,
  startPos: Position,
  orientation: Orientation
): { board: Board; ship: Ship } | null {
  if (!canPlaceShip(board, startPos, shipType.size, orientation)) {
    return null;
  }

  const positions = getShipPositions(startPos, shipType.size, orientation);

  // Create new board with ship placed (immutable update)
  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));

  // Mark cells as ship
  for (const pos of positions) {
    newBoard[pos.row][pos.col] = {
      ...newBoard[pos.row][pos.col],
      state: 'ship',
      shipId: shipType.id,
    };
  }

  // Create ship object
  const ship: Ship = {
    id: shipType.id,
    name: shipType.name,
    size: shipType.size,
    positions,
    orientation,
    hits: [],
    isSunk: false,
  };

  return { board: newBoard, ship };
}

/**
 * Removes a ship from the board.
 *
 * @param {Board} board - Current board state
 * @param {string} shipId - ID of ship to remove
 * @returns {Board} New board with ship removed
 *
 * INTERVIEW TIP:
 * This uses functional programming pattern - map() with conditional
 * transformation. It's O(n²) where n = BOARD_SIZE, but since we're
 * iterating all cells anyway, there's no faster approach for this
 * data structure.
 */
export function removeShip(board: Board, shipId: string): Board {
  return board.map((row) =>
    row.map((cell) => {
      if (cell.shipId === shipId) {
        return { ...cell, state: 'empty', shipId: null };
      }
      return cell;
    })
  );
}

/**
 * Randomly places all ships on the board.
 *
 * Algorithm:
 * 1. For each ship type (in order of size, largest first)
 * 2. Generate random position and orientation
 * 3. Check if valid, retry if not (max 100 attempts)
 * 4. Place ship and continue
 *
 * @returns {{ board: Board; ships: Ship[] }} Board with all ships placed
 *
 * INTERVIEW TIP:
 * This is a Monte Carlo approach - random sampling until success.
 * Placing larger ships first increases success rate because they
 * have fewer valid positions. The 100-attempt limit prevents infinite
 * loops in edge cases. Average case is O(n) where n = total ship cells,
 * worst case is O(n * maxAttempts).
 */
export function placeShipsRandomly(): { board: Board; ships: Ship[] } {
  let board = createEmptyBoard();
  const ships: Ship[] = [];

  for (const shipType of SHIP_TYPES) {
    let placed = false;
    let attempts = 0;
    const maxAttempts = 100;

    while (!placed && attempts < maxAttempts) {
      // Random orientation
      const orientation: Orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';

      // Calculate valid range for starting position
      const maxRow = orientation === 'vertical' ? BOARD_SIZE - shipType.size : BOARD_SIZE - 1;
      const maxCol = orientation === 'horizontal' ? BOARD_SIZE - shipType.size : BOARD_SIZE - 1;

      // Random starting position within valid range
      const startPos: Position = {
        row: Math.floor(Math.random() * (maxRow + 1)),
        col: Math.floor(Math.random() * (maxCol + 1)),
      };

      const result = placeShip(board, shipType, startPos, orientation);
      if (result) {
        board = result.board;
        ships.push(result.ship);
        placed = true;
      }
      attempts++;
    }

    if (!placed) {
      console.error(`Failed to place ${shipType.name} after ${maxAttempts} attempts`);
    }
  }

  return { board, ships };
}

/**
 * Processes a shot on the board.
 *
 * This is the core game mechanic function that:
 * 1. Determines if shot hits a ship or misses
 * 2. Updates cell state accordingly
 * 3. Updates ship's hit tracking
 * 4. Determines if ship is sunk (all cells hit)
 * 5. Marks all ship cells as 'sunk' if destroyed
 *
 * @param {Board} board - Current board state
 * @param {Ship[]} ships - Array of ships on this board
 * @param {Position} position - Position of the shot
 * @returns {Object} Result containing updated board, ships, and shot result
 *
 * @example
 * const { board, ships, result, sunkShip } = processShot(board, ships, {row: 5, col: 5});
 * // result is 'hit', 'miss', or 'sunk'
 * // sunkShip is defined only if result is 'sunk'
 *
 * INTERVIEW TIP:
 * This function demonstrates the Command Pattern - encapsulating an action
 * with all the data needed to perform it. The return value includes all
 * state changes, allowing the caller (store) to update state atomically.
 *
 * The sunk detection uses array length comparison (hits.length === ship.size)
 * which is O(1). Finding the hit ship is O(n) where n = number of ships.
 */
export function processShot(
  board: Board,
  ships: Ship[],
  position: Position
): {
  board: Board;
  ships: Ship[];
  result: 'hit' | 'miss' | 'sunk';
  sunkShip?: Ship;
} {
  const cell = board[position.row][position.col];
  const newBoard = board.map((row) => row.map((c) => ({ ...c })));

  if (cell.state === 'ship') {
    // HIT! 🎯
    newBoard[position.row][position.col].state = 'hit';

    // Update ship hits (immutable update)
    const newShips = ships.map((ship) => {
      if (ship.id === cell.shipId) {
        const newHits = [...ship.hits, position];
        const isSunk = newHits.length === ship.size;
        return { ...ship, hits: newHits, isSunk };
      }
      return ship;
    });

    // Check if ship is sunk
    const hitShip = newShips.find((s) => s.id === cell.shipId);
    if (hitShip?.isSunk) {
      // Mark all ship cells as sunk for visual effect
      for (const pos of hitShip.positions) {
        newBoard[pos.row][pos.col].state = 'sunk';
      }
      return { board: newBoard, ships: newShips, result: 'sunk', sunkShip: hitShip };
    }

    return { board: newBoard, ships: newShips, result: 'hit' };
  } else {
    // MISS 💨
    newBoard[position.row][position.col].state = 'miss';
    return { board: newBoard, ships, result: 'miss' };
  }
}

/**
 * Checks if all ships in the fleet are sunk (game over condition).
 *
 * @param {Ship[]} ships - Array of ships to check
 * @returns {boolean} True if all ships are sunk
 *
 * @example
 * if (areAllShipsSunk(playerShips)) {
 *   // AI wins!
 * }
 *
 * INTERVIEW TIP:
 * Uses Array.every() for clean, declarative code. This is O(n) where
 * n = number of ships, but since n ≤ 5 in standard Battleship, it's
 * effectively constant time.
 */
export function areAllShipsSunk(ships: Ship[]): boolean {
  return ships.every((ship) => ship.isSunk);
}

/**
 * Gets all cells that haven't been shot yet.
 *
 * Used by AI to determine valid targets.
 *
 * @param {Board} board - Current board state
 * @returns {Position[]} Array of positions that can be targeted
 *
 * INTERVIEW TIP:
 * This collects valid AI targets. 'empty' means water not yet shot,
 * 'ship' means ship not yet discovered (AI shouldn't see ships).
 * Time complexity is O(n²) where n = BOARD_SIZE.
 */
export function getUntriedCells(board: Board): Position[] {
  const cells: Position[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cell = board[row][col];
      if (cell.state === 'empty' || cell.state === 'ship') {
        cells.push({ row, col });
      }
    }
  }
  return cells;
}

/**
 * Checks if a cell has already been shot.
 *
 * @param {Board} board - Current board state
 * @param {Position} position - Position to check
 * @returns {boolean} True if cell has been shot (hit, miss, or sunk)
 *
 * INTERVIEW TIP:
 * O(1) lookup - direct array access. Used by AI to avoid
 * shooting the same cell twice.
 */
export function isCellShot(board: Board, position: Position): boolean {
  const cell = board[position.row][position.col];
  return cell.state === 'hit' || cell.state === 'miss' || cell.state === 'sunk';
}
