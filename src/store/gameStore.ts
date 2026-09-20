/**
 * @fileoverview Zustand Game Store - Central State Management
 *
 * This store manages ALL game state using Zustand, a lightweight
 * state management library. It replaces the previous Context API
 * approach with a more performant and simpler solution.
 *
 * @module store/gameStore
 *
 * INTERVIEW NOTES:
 * ================
 *
 * WHY ZUSTAND OVER CONTEXT API?
 * 1. Performance: Zustand only re-renders components that use changed state
 *    Context re-renders ALL consumers when ANY state changes
 *
 * 2. Simplicity: No Provider wrapper needed, just import and use
 *    const { phase } = useGameStore()
 *
 * 3. Devtools: Built-in Redux DevTools support
 *
 * 4. Persistence: Easy localStorage/sessionStorage integration
 *
 * 5. Middleware: Supports logging, immer, persist out of the box
 *
 * STORE ARCHITECTURE:
 * - State: All game data (boards, ships, stats, UI state)
 * - Actions: Functions that modify state (placeShip, shoot, etc.)
 * - Selectors: Derived from state automatically by Zustand
 *
 * DATA FLOW:
 * User Action → Action Function → State Update → React Re-render
 */

import {
  AIHuntState,
  Difficulty,
  GameState,
  GameStats,
  Position,
  SHIP_TYPES,
  ShipType,
} from '@/types';
import { createAIHuntState, getAIShot, updateAIHuntState } from '@/utils/ai';
import {
  areAllShipsSunk,
  createEmptyBoard,
  placeShip,
  placeShipsRandomly,
  processShot,
  removeShip,
} from '@/utils/board';
import { soundManager } from '@/utils/sounds';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Creates an empty game statistics object.
 *
 * @returns {GameStats} Initial stats with all counters at zero
 *
 * INTERVIEW TIP:
 * This is a Factory Function pattern - creates objects with
 * consistent structure. Using a function instead of a constant
 * ensures each call gets a fresh object (avoiding mutation bugs).
 */
const createEmptyStats = (): GameStats => ({
  shotsFired: 0,
  hits: 0,
  misses: 0,
  shipsDestroyed: 0,
  startTime: null,
  endTime: null,
});

/**
 * GameStore interface extending GameState with actions.
 *
 * INTERVIEW TIP:
 * TypeScript interfaces ensure type safety. The store interface
 * combines state (GameState) with actions (methods). This pattern
 * makes the API clear and enables autocomplete in IDEs.
 */
interface GameStore extends GameState {
  // Internal AI state (not part of public GameState)
  aiHuntState: AIHuntState;

  // ========== ACTIONS ==========
  // Each action is a function that updates state

  /** Set AI difficulty level (only during setup) */
  setDifficulty: (difficulty: Difficulty) => void;

  /** Select a ship for placement */
  selectShip: (ship: ShipType | null) => void;

  /** Toggle ship orientation (horizontal/vertical) */
  toggleOrientation: () => void;

  /** Place the selected ship at position */
  placePlayerShip: (position: Position) => boolean;

  /** Remove a placed ship (during setup) */
  removePlayerShip: (shipId: string) => void;

  /** Randomly place all ships */
  randomizePlacement: () => void;

  /** Clear all ship placements */
  clearPlacement: () => void;

  /** Start the game (transition from setup to playing) */
  startGame: () => void;

  /** Player fires at AI board */
  playerShoot: (position: Position) => void;

  /** AI takes its turn */
  aiTurn: () => void;

  /** Reset game to initial state */
  resetGame: () => void;

  /** Toggle sound effects on/off */
  toggleSound: () => void;

  /** Toggle dark/light theme */
  toggleTheme: () => void;

  /** Set animation state (used for timing) */
  setAnimating: (isAnimating: boolean) => void;
}

/**
 * Main game store created with Zustand.
 *
 * STRUCTURE:
 * - create<GameStore>() - Creates a typed store
 * - persist() - Middleware that saves to localStorage
 * - (set, get) => ({...}) - State and actions definition
 *
 * INTERVIEW TIP:
 * Zustand uses the "set" function to update state. Always use it
 * instead of mutating state directly. The "get" function reads
 * current state inside actions.
 *
 * PERSIST MIDDLEWARE:
 * - name: localStorage key
 * - partialize: Only persist selected fields (settings, not game state)
 */
export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // ==========================================
      // INITIAL STATE
      // ==========================================

      /**
       * Game phase: 'setup' | 'playing' | 'gameOver'
       * Controls which UI is shown
       */
      phase: 'setup',

      /**
       * AI difficulty: 'easy' | 'medium' | 'hard'
       * Affects AI targeting algorithm
       */
      difficulty: 'medium',

      /**
       * Current turn: 'player' | 'ai'
       * Determines who can act
       */
      currentTurn: 'player',

      /**
       * Winner when game is over
       */
      winner: null,

      // ----- Player State -----
      playerBoard: createEmptyBoard(),
      playerShips: [],
      playerStats: createEmptyStats(),

      // ----- AI State -----
      aiBoard: createEmptyBoard(),
      aiShips: [],
      aiStats: createEmptyStats(),

      // ----- UI State -----
      selectedShip: null, // Currently selected ship for placement
      shipOrientation: 'horizontal',
      isAnimating: false, // Prevents input during animations
      lastShot: null, // Last shot result (for UI feedback)

      // ----- Settings (persisted) -----
      soundEnabled: true,
      theme: 'dark',

      // ----- Internal AI State -----
      aiHuntState: createAIHuntState(),

      // ==========================================
      // ACTIONS
      // ==========================================

      /**
       * Sets the AI difficulty level.
       * Only callable during setup phase.
       *
       * @param {Difficulty} difficulty - 'easy', 'medium', or 'hard'
       */
      setDifficulty: (difficulty) => set({ difficulty }),

      /**
       * Selects a ship for placement.
       * Pass null to deselect.
       *
       * @param {ShipType | null} ship - Ship to select
       */
      selectShip: (ship) => set({ selectedShip: ship }),

      /**
       * Toggles ship orientation between horizontal and vertical.
       * Plays rotation sound effect.
       *
       * INTERVIEW TIP:
       * This pattern of playing sound inside action keeps
       * side effects centralized in the store.
       */
      toggleOrientation: () => {
        soundManager.play('rotate');
        set((state) => ({
          shipOrientation: state.shipOrientation === 'horizontal' ? 'vertical' : 'horizontal',
        }));
      },

      /**
       * Places the selected ship at the given position.
       *
       * LOGIC:
       * 1. Check if ship is selected and we're in setup phase
       * 2. If ship already placed, remove it first (repositioning)
       * 3. Attempt to place at new position
       * 4. If successful, update board and ships, clear selection
       *
       * @param {Position} position - Where to place the ship
       * @returns {boolean} True if placement succeeded
       *
       * INTERVIEW TIP:
       * Returning boolean allows UI to show feedback.
       * The repositioning logic (remove then add) enables
       * drag-and-drop style placement.
       */
      placePlayerShip: (position) => {
        const state = get();
        const { selectedShip, shipOrientation, playerBoard, playerShips } = state;

        if (!selectedShip || state.phase !== 'setup') return false;

        // Check if this ship is already placed (repositioning)
        const existingShip = playerShips.find((s) => s.id === selectedShip.id);
        if (existingShip) {
          // Remove existing placement first
          const boardWithoutShip = removeShip(playerBoard, selectedShip.id);
          const result = placeShip(boardWithoutShip, selectedShip, position, shipOrientation);

          if (result) {
            soundManager.play('place');
            set({
              playerBoard: result.board,
              playerShips: playerShips.map((s) => (s.id === selectedShip.id ? result.ship : s)),
              selectedShip: null,
            });
            return true;
          }
          return false;
        }

        // New ship placement
        const result = placeShip(playerBoard, selectedShip, position, shipOrientation);
        if (result) {
          soundManager.play('place');
          set({
            playerBoard: result.board,
            playerShips: [...playerShips, result.ship],
            selectedShip: null,
          });
          return true;
        }
        return false;
      },

      /**
       * Removes a ship from player's board during setup.
       *
       * @param {string} shipId - ID of ship to remove
       */
      removePlayerShip: (shipId) => {
        const state = get();
        if (state.phase !== 'setup') return;

        set({
          playerBoard: removeShip(state.playerBoard, shipId),
          playerShips: state.playerShips.filter((s) => s.id !== shipId),
        });
      },

      /**
       * Randomly places all ships on the player's board.
       * Uses the placeShipsRandomly utility function.
       */
      randomizePlacement: () => {
        const state = get();
        if (state.phase !== 'setup') return;

        const { board, ships } = placeShipsRandomly();
        soundManager.play('place');
        set({
          playerBoard: board,
          playerShips: ships,
          selectedShip: null,
        });
      },

      /**
       * Clears all ship placements from player's board.
       */
      clearPlacement: () => {
        const state = get();
        if (state.phase !== 'setup') return;

        set({
          playerBoard: createEmptyBoard(),
          playerShips: [],
          selectedShip: null,
        });
      },

      /**
       * Starts the game.
       *
       * LOGIC:
       * 1. Verify all ships are placed
       * 2. Generate AI's ship placement
       * 3. Initialize stats with start time
       * 4. Transition to playing phase
       *
       * INTERVIEW TIP:
       * Validation before state transition prevents invalid game states.
       * The AI ships are placed here (not during setup) so player
       * can't see them being placed.
       */
      startGame: () => {
        const state = get();
        if (state.playerShips.length !== SHIP_TYPES.length) return;

        // Place AI ships randomly
        const { board: aiBoard, ships: aiShips } = placeShipsRandomly();

        soundManager.play('click');
        set({
          phase: 'playing',
          aiBoard,
          aiShips,
          currentTurn: 'player',
          playerStats: { ...createEmptyStats(), startTime: Date.now() },
          aiStats: { ...createEmptyStats(), startTime: Date.now() },
          aiHuntState: createAIHuntState(),
        });
      },

      /**
       * Player fires a shot at the AI's board.
       *
       * LOGIC:
       * 1. Validate: correct phase, player's turn, not animating
       * 2. Validate: cell not already shot
       * 3. Process the shot
       * 4. Play appropriate sound
       * 5. Update stats
       * 6. Check win condition
       * 7. Switch to AI turn (or end game)
       *
       * @param {Position} position - Where to shoot
       *
       * INTERVIEW TIP:
       * This is a complex action with multiple side effects.
       * Breaking it into clear steps makes it maintainable.
       * The early returns (guard clauses) prevent invalid actions.
       */
      playerShoot: (position) => {
        const state = get();

        // Guard clauses - validate action is allowed
        if (state.phase !== 'playing' || state.currentTurn !== 'player' || state.isAnimating)
          return;

        // Check if already shot this cell
        const cell = state.aiBoard[position.row][position.col];
        if (cell.state === 'hit' || cell.state === 'miss' || cell.state === 'sunk') return;

        // Process the shot
        const { board, ships, result } = processShot(state.aiBoard, state.aiShips, position);

        // Play appropriate sound effect
        if (result === 'sunk') {
          soundManager.play('sunk');
        } else if (result === 'hit') {
          soundManager.play('hit');
        } else {
          soundManager.play('miss');
        }

        // Update statistics
        const newStats: GameStats = {
          ...state.playerStats,
          shotsFired: state.playerStats.shotsFired + 1,
          hits: state.playerStats.hits + (result !== 'miss' ? 1 : 0),
          misses: state.playerStats.misses + (result === 'miss' ? 1 : 0),
          shipsDestroyed: state.playerStats.shipsDestroyed + (result === 'sunk' ? 1 : 0),
        };

        // Check win condition
        if (areAllShipsSunk(ships)) {
          soundManager.play('victory');
          set({
            aiBoard: board,
            aiShips: ships,
            playerStats: { ...newStats, endTime: Date.now() },
            phase: 'gameOver',
            winner: 'player',
            lastShot: { position, result },
            isAnimating: true,
          });
          return;
        }

        // Continue game - switch to AI turn
        set({
          aiBoard: board,
          aiShips: ships,
          playerStats: newStats,
          lastShot: { position, result },
          isAnimating: true,
          currentTurn: 'ai',
        });
      },

      /**
       * AI takes its turn.
       *
       * LOGIC:
       * 1. Get remaining ship sizes (for Hard AI)
       * 2. Call AI algorithm to get target position
       * 3. Process the shot on player's board
       * 4. Update AI hunt state based on result
       * 5. Update stats
       * 6. Check win condition
       * 7. Switch back to player turn (or end game)
       *
       * INTERVIEW TIP:
       * The AI turn is triggered by useEffect in App.tsx
       * with a delay for dramatic effect. This separation
       * keeps the store synchronous and predictable.
       */
      aiTurn: () => {
        const state = get();
        if (state.phase !== 'playing' || state.currentTurn !== 'ai') return;

        // Get sizes of player's remaining (unsunk) ships for Hard AI
        const remainingShipSizes = state.playerShips.filter((s) => !s.isSunk).map((s) => s.size);

        // Get AI's target position
        const { position, newState } = getAIShot(
          state.playerBoard,
          state.difficulty,
          state.aiHuntState,
          remainingShipSizes
        );

        // Process the shot
        const { board, ships, result } = processShot(
          state.playerBoard,
          state.playerShips,
          position
        );

        // Play sound
        if (result === 'sunk') {
          soundManager.play('sunk');
        } else if (result === 'hit') {
          soundManager.play('hit');
        } else {
          soundManager.play('miss');
        }

        // Update AI hunt state based on result
        const updatedHuntState = updateAIHuntState(newState, position, result, board);

        // Update AI's statistics
        const newStats: GameStats = {
          ...state.aiStats,
          shotsFired: state.aiStats.shotsFired + 1,
          hits: state.aiStats.hits + (result !== 'miss' ? 1 : 0),
          misses: state.aiStats.misses + (result === 'miss' ? 1 : 0),
          shipsDestroyed: state.aiStats.shipsDestroyed + (result === 'sunk' ? 1 : 0),
        };

        // Check win condition (AI wins)
        if (areAllShipsSunk(ships)) {
          soundManager.play('defeat');
          set({
            playerBoard: board,
            playerShips: ships,
            aiStats: { ...newStats, endTime: Date.now() },
            aiHuntState: updatedHuntState,
            phase: 'gameOver',
            winner: 'ai',
            lastShot: { position, result },
            isAnimating: true,
          });
          return;
        }

        // Continue game - switch back to player turn
        set({
          playerBoard: board,
          playerShips: ships,
          aiStats: newStats,
          aiHuntState: updatedHuntState,
          lastShot: { position, result },
          isAnimating: true,
          currentTurn: 'player',
        });
      },

      /**
       * Resets the game to initial state.
       * Called when clicking "Play Again".
       */
      resetGame: () => {
        soundManager.play('click');
        set({
          phase: 'setup',
          currentTurn: 'player',
          winner: null,
          playerBoard: createEmptyBoard(),
          playerShips: [],
          playerStats: createEmptyStats(),
          aiBoard: createEmptyBoard(),
          aiShips: [],
          aiStats: createEmptyStats(),
          selectedShip: null,
          shipOrientation: 'horizontal',
          isAnimating: false,
          lastShot: null,
          aiHuntState: createAIHuntState(),
        });
      },

      /**
       * Toggles sound effects on/off.
       * Also updates the soundManager singleton.
       */
      toggleSound: () => {
        const newEnabled = !get().soundEnabled;
        soundManager.setEnabled(newEnabled);
        set({ soundEnabled: newEnabled });
      },

      /**
       * Toggles between dark and light themes.
       */
      toggleTheme: () => {
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' }));
      },

      /**
       * Sets the animation state.
       * Used to prevent user input during animations.
       */
      setAnimating: (isAnimating) => set({ isAnimating }),
    }),
    {
      // Persist middleware configuration
      name: 'battleship-settings', // localStorage key
      partialize: (state) => ({
        // Only persist settings, not game state
        soundEnabled: state.soundEnabled,
        theme: state.theme,
        difficulty: state.difficulty,
      }),
    }
  )
);
