import { Board, Cell, Position, Ship, ShipType, Orientation, SHIP_TYPES } from '@/types';

export const BOARD_SIZE = 10;

// Create an empty board
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

// Check if a position is valid on the board
export function isValidPosition(pos: Position): boolean {
  return pos.row >= 0 && pos.row < BOARD_SIZE && pos.col >= 0 && pos.col < BOARD_SIZE;
}

// Get all positions a ship would occupy
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

// Check if ship placement is valid
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

// Place a ship on the board
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
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  
  // Mark cells as ship
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

// Remove a ship from the board
export function removeShip(board: Board, shipId: string): Board {
  return board.map(row =>
    row.map(cell => {
      if (cell.shipId === shipId) {
        return { ...cell, state: 'empty', shipId: null };
      }
      return cell;
    })
  );
}

// Random ship placement for AI or "Randomize" button
export function placeShipsRandomly(): { board: Board; ships: Ship[] } {
  let board = createEmptyBoard();
  const ships: Ship[] = [];
  
  for (const shipType of SHIP_TYPES) {
    let placed = false;
    let attempts = 0;
    const maxAttempts = 100;
    
    while (!placed && attempts < maxAttempts) {
      const orientation: Orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
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
      // This shouldn't happen with standard fleet, but just in case
      console.error(`Failed to place ${shipType.name} after ${maxAttempts} attempts`);
    }
  }
  
  return { board, ships };
}

// Process a shot on the board
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
  const newBoard = board.map(row => row.map(c => ({ ...c })));
  
  if (cell.state === 'ship') {
    // Hit!
    newBoard[position.row][position.col].state = 'hit';
    
    // Update ship hits
    const newShips = ships.map(ship => {
      if (ship.id === cell.shipId) {
        const newHits = [...ship.hits, position];
        const isSunk = newHits.length === ship.size;
        return { ...ship, hits: newHits, isSunk };
      }
      return ship;
    });
    
    // Check if ship is sunk
    const hitShip = newShips.find(s => s.id === cell.shipId);
    if (hitShip?.isSunk) {
      // Mark all ship cells as sunk
      for (const pos of hitShip.positions) {
        newBoard[pos.row][pos.col].state = 'sunk';
      }
      return { board: newBoard, ships: newShips, result: 'sunk', sunkShip: hitShip };
    }
    
    return { board: newBoard, ships: newShips, result: 'hit' };
  } else {
    // Miss
    newBoard[position.row][position.col].state = 'miss';
    return { board: newBoard, ships, result: 'miss' };
  }
}

// Check if all ships are sunk (game over condition)
export function areAllShipsSunk(ships: Ship[]): boolean {
  return ships.every(ship => ship.isSunk);
}

// Get cells that haven't been shot yet
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

// Check if a cell has been shot
export function isCellShot(board: Board, position: Position): boolean {
  const cell = board[position.row][position.col];
  return cell.state === 'hit' || cell.state === 'miss' || cell.state === 'sunk';
}
