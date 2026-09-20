/**
 * Board logic for the Battleship game: creating the board, placing ships,
 * processing shots, and checking the win condition. All functions are pure
 * and return new data instead of mutating their inputs.
 */

import { Board, Cell, Orientation, Position, Ship, SHIP_TYPES, ShipType } from '@/types';

/** Standard 10x10 board. */
export const BOARD_SIZE = 10;

/** Creates an empty 10x10 board of cells. */
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

/** True if a position is inside the board bounds. */
export function isValidPosition(pos: Position): boolean {
  return pos.row >= 0 && pos.row < BOARD_SIZE && pos.col >= 0 && pos.col < BOARD_SIZE;
}

/** Returns every cell a ship would occupy from a starting position. */
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
 * True if a ship fits: all cells in bounds and not overlapping another ship.
 * excludeShipId lets a ship ignore its own cells (used when repositioning).
 */
export function canPlaceShip(
  board: Board,
  startPos: Position,
  size: number,
  orientation: Orientation,
  excludeShipId?: string
): boolean {
  const positions = getShipPositions(startPos, size, orientation);

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
 * Places a ship on a new copy of the board.
 * Returns the new board and ship, or null if the placement is invalid.
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

  // Copy the board (immutable update), then mark the ship's cells.
  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
  for (const pos of positions) {
    newBoard[pos.row][pos.col] = {
      ...newBoard[pos.row][pos.col],
      state: 'ship',
      shipId: shipType.id,
    };
  }

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

/** Returns a new board with the given ship's cells cleared back to empty. */
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
 * Randomly places the whole fleet. Places larger ships first (they have
 * fewer valid spots) and retries up to 100 times per ship.
 */
export function placeShipsRandomly(): { board: Board; ships: Ship[] } {
  let board = createEmptyBoard();
  const ships: Ship[] = [];

  for (const shipType of SHIP_TYPES) {
    let placed = false;
    let attempts = 0;
    const maxAttempts = 100;

    while (!placed && attempts < maxAttempts) {
      const orientation: Orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';

      // Keep the start position within range so the ship stays on the board.
      const maxRow = orientation === 'vertical' ? BOARD_SIZE - shipType.size : BOARD_SIZE - 1;
      const maxCol = orientation === 'horizontal' ? BOARD_SIZE - shipType.size : BOARD_SIZE - 1;

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
 * Processes a shot at a position on a new copy of the board.
 * Returns the updated board/ships, the result, and the sunk ship if any.
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
    newBoard[position.row][position.col].state = 'hit';

    // Record the hit on its ship and recompute isSunk.
    const newShips = ships.map((ship) => {
      if (ship.id === cell.shipId) {
        const newHits = [...ship.hits, position];
        const isSunk = newHits.length === ship.size;
        return { ...ship, hits: newHits, isSunk };
      }
      return ship;
    });

    const hitShip = newShips.find((s) => s.id === cell.shipId);
    if (hitShip?.isSunk) {
      // Mark every cell of the sunk ship for the visual effect.
      for (const pos of hitShip.positions) {
        newBoard[pos.row][pos.col].state = 'sunk';
      }
      return { board: newBoard, ships: newShips, result: 'sunk', sunkShip: hitShip };
    }

    return { board: newBoard, ships: newShips, result: 'hit' };
  } else {
    newBoard[position.row][position.col].state = 'miss';
    return { board: newBoard, ships, result: 'miss' };
  }
}

/** True if every ship in the fleet is sunk (game over). */
export function areAllShipsSunk(ships: Ship[]): boolean {
  return ships.every((ship) => ship.isSunk);
}

/** Returns all cells that haven't been shot yet (used by the AI). */
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

/** True if a cell has already been shot (hit, miss, or sunk). */
export function isCellShot(board: Board, position: Position): boolean {
  const cell = board[position.row][position.col];
  return cell.state === 'hit' || cell.state === 'miss' || cell.state === 'sunk';
}
