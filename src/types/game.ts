/**
 * @fileoverview TypeScript Type Definitions for Battleship Game
 *
 * This file contains all shared type definitions used throughout
 * the application. Centralizing types here provides:
 *
 * 1. Single source of truth for data structures
 * 2. Easy refactoring (change once, update everywhere)
 * 3. Better IDE autocomplete and error checking
 * 4. Self-documenting code
 *
 * @module types/game
 *
 * INTERVIEW NOTES:
 * ================
 * Understanding these types is crucial for understanding the codebase.
 * Each type represents a core game concept.
 */

// ============================================
// PRIMITIVE TYPES (Simple string unions)
// ============================================

/**
 * Possible states for a single cell on the board.
 *
 * STATE MACHINE:
 * empty → ship (when ship placed)
 * empty → miss (when shot at water)
 * ship → hit (when ship cell shot)
 * hit → sunk (when all ship cells hit)
 */
export type CellState = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk';

/**
 * Ship orientation for placement.
 */
export type Orientation = 'horizontal' | 'vertical';

/**
 * Game phases - controls UI and allowed actions.
 *
 * setup → playing (when Start Game clicked)
 * playing → gameOver (when all ships sunk)
 */
export type GamePhase = 'setup' | 'playing' | 'gameOver';

/**
 * Player identifier.
 */
export type Player = 'player' | 'ai';

// ============================================
// POSITION & CELL (Board building blocks)
// ============================================

/**
 * 2D coordinate on the game board.
 * Both row and col are 0-indexed (0-9 for standard 10x10 board).
 *
 * @example
 * const topLeft: Position = { row: 0, col: 0 };
 * const center: Position = { row: 5, col: 5 };
 */
export interface Position {
  row: number;
  col: number;
}

/**
 * Single cell on the game board.
 *
 * Each cell tracks:
 * - Its position (for convenience)
 * - Its current state (empty/ship/hit/miss/sunk)
 * - Which ship occupies it (if any)
 *
 * @example
 * // Empty water cell
 * { position: {row:0,col:0}, state: 'empty', shipId: null }
 *
 * // Cell with ship
 * { position: {row:0,col:0}, state: 'ship', shipId: 'carrier' }
 *
 * // Hit ship cell
 * { position: {row:0,col:0}, state: 'hit', shipId: 'carrier' }
 */
export interface Cell {
  position: Position;
  state: CellState;
  shipId: string | null;
}

/**
 * Game board - 10x10 grid of cells.
 * Accessed as board[row][col].
 *
 * @example
 * const cell = board[5][3]; // Row 5, Column 3 (0-indexed)
 */
export type Board = Cell[][];

// ============================================
// SHIP TYPES (Ship definitions)
// ============================================

/**
 * Ship type definition (template for creating ships).
 * This is the "blueprint" - the actual ship instances are Ship objects.
 *
 * @example
 * const carrier: ShipType = { id: 'carrier', name: 'Carrier', size: 5 };
 */
export interface ShipType {
  id: string; // Unique identifier
  name: string; // Display name
  size: number; // Number of cells (length)
}

/**
 * Standard Battleship fleet configuration.
 *
 * Total cells: 5 + 4 + 3 + 3 + 2 = 17 cells
 * On a 100-cell board, this is 17% coverage.
 *
 * INTERVIEW TIP:
 * Using a constant array of ShipTypes allows easy modification
 * of fleet composition. Could add game modes with different fleets.
 */
export const SHIP_TYPES: ShipType[] = [
  { id: 'carrier', name: 'Carrier', size: 5 },
  { id: 'battleship', name: 'Battleship', size: 4 },
  { id: 'cruiser', name: 'Cruiser', size: 3 },
  { id: 'submarine', name: 'Submarine', size: 3 },
  { id: 'destroyer', name: 'Destroyer', size: 2 },
];

/**
 * Placed ship instance with runtime state.
 *
 * Extends ShipType with:
 * - positions: Actual cells occupied on board
 * - orientation: How it's oriented
 * - hits: Which cells have been hit
 * - isSunk: Whether all cells are hit
 *
 * @example
 * const placedCarrier: Ship = {
 *   id: 'carrier',
 *   name: 'Carrier',
 *   size: 5,
 *   positions: [{row:0,col:0}, {row:0,col:1}, ...],
 *   orientation: 'horizontal',
 *   hits: [{row:0,col:0}],  // One hit so far
 *   isSunk: false
 * };
 */
export interface Ship {
  id: string;
  name: string;
  size: number;
  positions: Position[];
  orientation: Orientation;
  hits: Position[];
  isSunk: boolean;
}

// ============================================
// GAME TRACKING (Stats & Shots)
// ============================================

/**
 * Record of a single shot fired.
 * Used for game history/replay (future feature).
 */
export interface Shot {
  position: Position;
  result: 'hit' | 'miss' | 'sunk';
  timestamp: number;
}

/**
 * Game statistics tracked for each player.
 *
 * Derived values:
 * - accuracy = hits / shotsFired * 100
 * - gameDuration = endTime - startTime
 */
export interface GameStats {
  shotsFired: number;
  hits: number;
  misses: number;
  shipsDestroyed: number;
  startTime: number | null; // Date.now() when game started
  endTime: number | null; // Date.now() when game ended
}

// ============================================
// GAME STATE (Complete game snapshot)
// ============================================

/**
 * Complete game state.
 *
 * This interface represents EVERYTHING needed to render the game.
 * It's used by the Zustand store and could be serialized for:
 * - Save/load game
 * - Multiplayer sync
 * - Replay system
 *
 * INTERVIEW TIP:
 * Separating state definition (this interface) from state management
 * (Zustand store) follows the Single Responsibility Principle.
 */
export interface GameState {
  // ----- Game Flow -----
  phase: GamePhase;
  currentTurn: Player;
  winner: Player | null;

  // ----- Player Data -----
  playerBoard: Board;
  playerShips: Ship[];
  playerStats: GameStats;

  // ----- AI Data -----
  aiBoard: Board;
  aiShips: Ship[];
  aiStats: GameStats;

  // ----- UI State -----
  selectedShip: ShipType | null; // Ship being placed
  shipOrientation: Orientation; // Current placement orientation
  isAnimating: boolean; // Blocks input during animations
  lastShot: { position: Position; result: 'hit' | 'miss' | 'sunk' } | null;

  // ----- Settings -----
  soundEnabled: boolean;
  theme: 'dark' | 'light';
}

// ============================================
// AI STATE (Internal AI tracking)
// ============================================

/**
 * AI state for the Hunt/Target approach.
 *
 * The AI hunts at random until it hits a ship, then queues the cells next
 * to that hit and fires at those before hunting again.
 *
 * @example
 * // Hunting (nothing queued)
 * { targetQueue: [] }
 *
 * // After a hit, neighbours queued
 * { targetQueue: [{row:5,col:4}, {row:5,col:6}] }
 */
export interface AIHuntState {
  /** 'hunt' = firing at random; 'target' = chasing a hit ship */
  mode: 'hunt' | 'target';

  /** Cells to try next (neighbours of previous hits), used as a FIFO queue */
  targetQueue: Position[];
}
