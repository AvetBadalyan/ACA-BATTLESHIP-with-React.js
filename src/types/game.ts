// Core game types for Battleship

export type CellState = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk';

export type Orientation = 'horizontal' | 'vertical';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type GamePhase = 'setup' | 'playing' | 'gameOver';

export type Player = 'player' | 'ai';

export interface Position {
  row: number;
  col: number;
}

export interface Ship {
  id: string;
  name: string;
  size: number;
  positions: Position[];
  orientation: Orientation;
  hits: Position[];
  isSunk: boolean;
}

export interface ShipType {
  id: string;
  name: string;
  size: number;
}

// Standard Battleship fleet
export const SHIP_TYPES: ShipType[] = [
  { id: 'carrier', name: 'Carrier', size: 5 },
  { id: 'battleship', name: 'Battleship', size: 4 },
  { id: 'cruiser', name: 'Cruiser', size: 3 },
  { id: 'submarine', name: 'Submarine', size: 3 },
  { id: 'destroyer', name: 'Destroyer', size: 2 },
];

export interface Cell {
  position: Position;
  state: CellState;
  shipId: string | null;
}

export type Board = Cell[][];

export interface Shot {
  position: Position;
  result: 'hit' | 'miss' | 'sunk';
  timestamp: number;
}

export interface GameStats {
  shotsFired: number;
  hits: number;
  misses: number;
  shipsDestroyed: number;
  startTime: number | null;
  endTime: number | null;
}

export interface GameState {
  phase: GamePhase;
  difficulty: Difficulty;
  currentTurn: Player;
  winner: Player | null;
  
  // Player data
  playerBoard: Board;
  playerShips: Ship[];
  playerStats: GameStats;
  
  // AI data
  aiBoard: Board;
  aiShips: Ship[];
  aiStats: GameStats;
  
  // UI state
  selectedShip: ShipType | null;
  shipOrientation: Orientation;
  isAnimating: boolean;
  lastShot: { position: Position; result: 'hit' | 'miss' | 'sunk' } | null;
  
  // Settings
  soundEnabled: boolean;
  theme: 'dark' | 'light';
}

// AI hunting state for medium/hard difficulty
export interface AIHuntState {
  mode: 'hunt' | 'target';
  targetQueue: Position[];
  hitStack: Position[];
  lastHit: Position | null;
  shipDirection: 'horizontal' | 'vertical' | null;
}
