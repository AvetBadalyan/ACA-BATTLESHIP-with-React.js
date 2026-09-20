/**
 * Shared type definitions for the Battleship game.
 * Central source of truth for the app's data structures.
 */

// ----- Primitive unions -----

/** State of a single board cell. */
export type CellState = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk';

/** Ship orientation for placement. */
export type Orientation = 'horizontal' | 'vertical';

/** Game phase: controls which UI is shown and what actions are allowed. */
export type GamePhase = 'setup' | 'playing' | 'gameOver';

/** Who is acting. */
export type Player = 'player' | 'ai';

// ----- Board building blocks -----

/** 2D board coordinate, 0-indexed (0-9 on a 10x10 board). */
export interface Position {
  row: number;
  col: number;
}

/** A single cell: its position, current state, and the ship on it (if any). */
export interface Cell {
  position: Position;
  state: CellState;
  shipId: string | null;
}

/** 10x10 grid of cells, accessed as board[row][col]. */
export type Board = Cell[][];

// ----- Ships -----

/** Ship template (blueprint); actual placed ships are Ship objects. */
export interface ShipType {
  id: string;
  name: string;
  size: number;
}

/** Standard fleet: 5 ships, 17 cells total. */
export const SHIP_TYPES: ShipType[] = [
  { id: 'carrier', name: 'Carrier', size: 5 },
  { id: 'battleship', name: 'Battleship', size: 4 },
  { id: 'cruiser', name: 'Cruiser', size: 3 },
  { id: 'submarine', name: 'Submarine', size: 3 },
  { id: 'destroyer', name: 'Destroyer', size: 2 },
];

/** A placed ship with its cells, hits, and sunk status. */
export interface Ship {
  id: string;
  name: string;
  size: number;
  positions: Position[];
  orientation: Orientation;
  hits: Position[];
  isSunk: boolean;
}

// ----- Stats -----

/** A single shot record (reserved for a future history/replay feature). */
export interface Shot {
  position: Position;
  result: 'hit' | 'miss' | 'sunk';
  timestamp: number;
}

/** Per-player stats. accuracy = hits / shotsFired; duration = endTime - startTime. */
export interface GameStats {
  shotsFired: number;
  hits: number;
  misses: number;
  shipsDestroyed: number;
  startTime: number | null;
  endTime: number | null;
}

// ----- Full game state -----

/** Everything needed to render the game; held by the Zustand store. */
export interface GameState {
  // Game flow
  phase: GamePhase;
  currentTurn: Player;
  winner: Player | null;

  // Player
  playerBoard: Board;
  playerShips: Ship[];
  playerStats: GameStats;

  // AI
  aiBoard: Board;
  aiShips: Ship[];
  aiStats: GameStats;

  // UI
  selectedShip: ShipType | null;
  shipOrientation: Orientation;
  isAnimating: boolean; // blocks input during animations
  lastShot: { position: Position; result: 'hit' | 'miss' | 'sunk' } | null;

  // Settings
  soundEnabled: boolean;
  theme: 'dark' | 'light';
}

// ----- AI state -----

/** State for the AI's Hunt/Target logic. */
export interface AIHuntState {
  /** 'hunt' = firing at random; 'target' = chasing a hit ship */
  mode: 'hunt' | 'target';

  /** Cells to try next (neighbours of previous hits), used as a FIFO queue */
  targetQueue: Position[];
}
