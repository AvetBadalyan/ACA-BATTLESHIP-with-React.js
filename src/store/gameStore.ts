/**
 * Zustand store holding all game state and the actions that change it.
 * Actions call the pure board/ai utils, then commit the result with set().
 * Only settings (sound, theme) are persisted to localStorage, not game state.
 */

import { AIHuntState, GameState, GameStats, Position, SHIP_TYPES, ShipType } from '@/types';
import { createAIHuntState, getAIShot, updateAIHuntState } from '@/utils/ai';
import {
  areAllShipsSunk,
  createEmptyBoard,
  placeShip,
  placeShipsRandomly,
  processShot,
  removeShip,
} from '@/utils/board';
import { playSound, setSoundEnabled } from '@/utils/sounds';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Fresh stats object (a function so each game gets its own copy). */
const createEmptyStats = (): GameStats => ({
  shotsFired: 0,
  hits: 0,
  misses: 0,
  shipsDestroyed: 0,
  startTime: null,
  endTime: null,
});

/** Store shape: game state plus internal AI state and the actions. */
interface GameStore extends GameState {
  aiHuntState: AIHuntState;

  selectShip: (ship: ShipType | null) => void;
  toggleOrientation: () => void;
  placePlayerShip: (position: Position) => boolean;
  removePlayerShip: (shipId: string) => void;
  randomizePlacement: () => void;
  clearPlacement: () => void;
  startGame: () => void;
  playerShoot: (position: Position) => void;
  aiTurn: () => void;
  resetGame: () => void;
  toggleSound: () => void;
  toggleTheme: () => void;
  setAnimating: (isAnimating: boolean) => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // ----- Initial state -----
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

      soundEnabled: true,
      theme: 'dark',

      aiHuntState: createAIHuntState(),

      // ----- Actions -----

      selectShip: (ship) => set({ selectedShip: ship }),

      toggleOrientation: () => {
        playSound('rotate');
        set((state) => ({
          shipOrientation: state.shipOrientation === 'horizontal' ? 'vertical' : 'horizontal',
        }));
      },

      /**
       * Places the selected ship, repositioning it if already placed.
       * Returns true on success so the UI can react.
       */
      placePlayerShip: (position) => {
        const state = get();
        const { selectedShip, shipOrientation, playerBoard, playerShips } = state;

        if (!selectedShip || state.phase !== 'setup') return false;

        // Repositioning: remove the existing placement, then place again.
        const existingShip = playerShips.find((s) => s.id === selectedShip.id);
        if (existingShip) {
          const boardWithoutShip = removeShip(playerBoard, selectedShip.id);
          const result = placeShip(boardWithoutShip, selectedShip, position, shipOrientation);

          if (result) {
            playSound('place');
            set({
              playerBoard: result.board,
              playerShips: playerShips.map((s) => (s.id === selectedShip.id ? result.ship : s)),
              selectedShip: null,
            });
            return true;
          }
          return false;
        }

        // New placement.
        const result = placeShip(playerBoard, selectedShip, position, shipOrientation);
        if (result) {
          playSound('place');
          set({
            playerBoard: result.board,
            playerShips: [...playerShips, result.ship],
            selectedShip: null,
          });
          return true;
        }
        return false;
      },

      removePlayerShip: (shipId) => {
        const state = get();
        if (state.phase !== 'setup') return;

        set({
          playerBoard: removeShip(state.playerBoard, shipId),
          playerShips: state.playerShips.filter((s) => s.id !== shipId),
        });
      },

      randomizePlacement: () => {
        const state = get();
        if (state.phase !== 'setup') return;

        const { board, ships } = placeShipsRandomly();
        playSound('place');
        set({
          playerBoard: board,
          playerShips: ships,
          selectedShip: null,
        });
      },

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
       * Starts the game once all ships are placed: generates the AI fleet,
       * initialises stats, and moves to the playing phase.
       */
      startGame: () => {
        const state = get();
        if (state.playerShips.length !== SHIP_TYPES.length) return;

        // AI ships are placed here (not during setup) so they stay hidden.
        const { board: aiBoard, ships: aiShips } = placeShipsRandomly();

        playSound('click');
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
       * Player fires at the AI board: guards the turn, processes the shot,
       * updates stats, then either ends the game or hands over to the AI.
       */
      playerShoot: (position) => {
        const state = get();

        if (state.phase !== 'playing' || state.currentTurn !== 'player' || state.isAnimating)
          return;

        // Ignore cells that were already shot.
        const cell = state.aiBoard[position.row][position.col];
        if (cell.state === 'hit' || cell.state === 'miss' || cell.state === 'sunk') return;

        const { board, ships, result } = processShot(state.aiBoard, state.aiShips, position);

        if (result === 'sunk') {
          playSound('sunk');
        } else if (result === 'hit') {
          playSound('hit');
        } else {
          playSound('miss');
        }

        const newStats: GameStats = {
          ...state.playerStats,
          shotsFired: state.playerStats.shotsFired + 1,
          hits: state.playerStats.hits + (result !== 'miss' ? 1 : 0),
          misses: state.playerStats.misses + (result === 'miss' ? 1 : 0),
          shipsDestroyed: state.playerStats.shipsDestroyed + (result === 'sunk' ? 1 : 0),
        };

        if (areAllShipsSunk(ships)) {
          playSound('victory');
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
       * AI's turn: pick a target via the Hunt/Target logic, process the shot,
       * update its state and stats, then end the game or hand back to the player.
       * Triggered from App.tsx on a delay so the store stays synchronous.
       */
      aiTurn: () => {
        const state = get();
        if (state.phase !== 'playing' || state.currentTurn !== 'ai') return;

        const { position, newState } = getAIShot(state.playerBoard, state.aiHuntState);

        const { board, ships, result } = processShot(
          state.playerBoard,
          state.playerShips,
          position
        );

        if (result === 'sunk') {
          playSound('sunk');
        } else if (result === 'hit') {
          playSound('hit');
        } else {
          playSound('miss');
        }

        const updatedHuntState = updateAIHuntState(newState, position, result, board);

        const newStats: GameStats = {
          ...state.aiStats,
          shotsFired: state.aiStats.shotsFired + 1,
          hits: state.aiStats.hits + (result !== 'miss' ? 1 : 0),
          misses: state.aiStats.misses + (result === 'miss' ? 1 : 0),
          shipsDestroyed: state.aiStats.shipsDestroyed + (result === 'sunk' ? 1 : 0),
        };

        if (areAllShipsSunk(ships)) {
          playSound('defeat');
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

      /** Resets everything back to a fresh setup phase. */
      resetGame: () => {
        playSound('click');
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

      toggleSound: () => {
        const newEnabled = !get().soundEnabled;
        setSoundEnabled(newEnabled);
        set({ soundEnabled: newEnabled });
      },

      toggleTheme: () => {
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' }));
      },

      setAnimating: (isAnimating) => set({ isAnimating }),
    }),
    {
      name: 'battleship-settings', // localStorage key
      // Persist settings only, never the in-progress game.
      partialize: (state) => ({
        soundEnabled: state.soundEnabled,
        theme: state.theme,
      }),
    }
  )
);
