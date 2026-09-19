import {
	AIHuntState,
	Difficulty,
	GameState,
	GameStats,
	Position,
	SHIP_TYPES,
	ShipType
} from '@/types'
import { createAIHuntState, getAIShot, updateAIHuntState } from '@/utils/ai'
import {
	areAllShipsSunk,
	createEmptyBoard,
	placeShip,
	placeShipsRandomly,
	processShot,
	removeShip
} from '@/utils/board'
import { soundManager } from '@/utils/sounds'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const createEmptyStats = (): GameStats => ({
	shotsFired: 0,
	hits: 0,
	misses: 0,
	shipsDestroyed: 0,
	startTime: null,
	endTime: null
})

interface GameStore extends GameState {
	// AI hunt state (internal)
	aiHuntState: AIHuntState

	// Actions
	setDifficulty: (difficulty: Difficulty) => void
	selectShip: (ship: ShipType | null) => void
	toggleOrientation: () => void
	placePlayerShip: (position: Position) => boolean
	removePlayerShip: (shipId: string) => void
	randomizePlacement: () => void
	clearPlacement: () => void
	startGame: () => void
	playerShoot: (position: Position) => void
	aiTurn: () => void
	resetGame: () => void
	toggleSound: () => void
	toggleTheme: () => void
	setAnimating: (isAnimating: boolean) => void
}

export const useGameStore = create<GameStore>()(
	persist(
		(set, get) => ({
			// Initial state
			phase: 'setup',
			difficulty: 'medium',
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

			// Actions
			setDifficulty: difficulty => set({ difficulty }),

			selectShip: ship => set({ selectedShip: ship }),

			toggleOrientation: () => {
				soundManager.play('rotate')
				set(state => ({
					shipOrientation:
						state.shipOrientation === 'horizontal' ? 'vertical' : 'horizontal'
				}))
			},

			placePlayerShip: position => {
				const state = get()
				const { selectedShip, shipOrientation, playerBoard, playerShips } =
					state

				if (!selectedShip || state.phase !== 'setup') return false

				// Check if this ship is already placed
				const existingShip = playerShips.find(s => s.id === selectedShip.id)
				if (existingShip) {
					// Remove existing placement first
					const boardWithoutShip = removeShip(playerBoard, selectedShip.id)
					const result = placeShip(
						boardWithoutShip,
						selectedShip,
						position,
						shipOrientation
					)

					if (result) {
						soundManager.play('place')
						set({
							playerBoard: result.board,
							playerShips: playerShips.map(s =>
								s.id === selectedShip.id ? result.ship : s
							),
							selectedShip: null
						})
						return true
					}
					return false
				}

				// New ship placement
				const result = placeShip(
					playerBoard,
					selectedShip,
					position,
					shipOrientation
				)
				if (result) {
					soundManager.play('place')
					set({
						playerBoard: result.board,
						playerShips: [...playerShips, result.ship],
						selectedShip: null
					})
					return true
				}
				return false
			},

			removePlayerShip: shipId => {
				const state = get()
				if (state.phase !== 'setup') return

				set({
					playerBoard: removeShip(state.playerBoard, shipId),
					playerShips: state.playerShips.filter(s => s.id !== shipId)
				})
			},

			randomizePlacement: () => {
				const state = get()
				if (state.phase !== 'setup') return

				const { board, ships } = placeShipsRandomly()
				soundManager.play('place')
				set({
					playerBoard: board,
					playerShips: ships,
					selectedShip: null
				})
			},

			clearPlacement: () => {
				const state = get()
				if (state.phase !== 'setup') return

				set({
					playerBoard: createEmptyBoard(),
					playerShips: [],
					selectedShip: null
				})
			},

			startGame: () => {
				const state = get()
				if (state.playerShips.length !== SHIP_TYPES.length) return

				// Place AI ships
				const { board: aiBoard, ships: aiShips } = placeShipsRandomly()

				soundManager.play('click')
				set({
					phase: 'playing',
					aiBoard,
					aiShips,
					currentTurn: 'player',
					playerStats: { ...createEmptyStats(), startTime: Date.now() },
					aiStats: { ...createEmptyStats(), startTime: Date.now() },
					aiHuntState: createAIHuntState()
				})
			},

			playerShoot: position => {
				const state = get()
				if (
					state.phase !== 'playing' ||
					state.currentTurn !== 'player' ||
					state.isAnimating
				)
					return

				// Check if already shot
				const cell = state.aiBoard[position.row][position.col]
				if (
					cell.state === 'hit' ||
					cell.state === 'miss' ||
					cell.state === 'sunk'
				)
					return

				const { board, ships, result } = processShot(
					state.aiBoard,
					state.aiShips,
					position
				)

				// Play sound
				if (result === 'sunk') {
					soundManager.play('sunk')
				} else if (result === 'hit') {
					soundManager.play('hit')
				} else {
					soundManager.play('miss')
				}

				// Update stats
				const newStats: GameStats = {
					...state.playerStats,
					shotsFired: state.playerStats.shotsFired + 1,
					hits: state.playerStats.hits + (result !== 'miss' ? 1 : 0),
					misses: state.playerStats.misses + (result === 'miss' ? 1 : 0),
					shipsDestroyed:
						state.playerStats.shipsDestroyed + (result === 'sunk' ? 1 : 0)
				}

				// Check win condition
				if (areAllShipsSunk(ships)) {
					soundManager.play('victory')
					set({
						aiBoard: board,
						aiShips: ships,
						playerStats: { ...newStats, endTime: Date.now() },
						phase: 'gameOver',
						winner: 'player',
						lastShot: { position, result },
						isAnimating: true
					})
					return
				}

				set({
					aiBoard: board,
					aiShips: ships,
					playerStats: newStats,
					lastShot: { position, result },
					isAnimating: true,
					currentTurn: 'ai'
				})
			},

			aiTurn: () => {
				const state = get()
				if (state.phase !== 'playing' || state.currentTurn !== 'ai') return

				// Get remaining ship sizes for hard AI
				const remainingShipSizes = state.playerShips
					.filter(s => !s.isSunk)
					.map(s => s.size)

				const { position, newState } = getAIShot(
					state.playerBoard,
					state.difficulty,
					state.aiHuntState,
					remainingShipSizes
				)

				const { board, ships, result } = processShot(
					state.playerBoard,
					state.playerShips,
					position
				)

				// Play sound
				if (result === 'sunk') {
					soundManager.play('sunk')
				} else if (result === 'hit') {
					soundManager.play('hit')
				} else {
					soundManager.play('miss')
				}

				// Update AI hunt state
				const updatedHuntState = updateAIHuntState(
					newState,
					position,
					result,
					board
				)

				// Update stats
				const newStats: GameStats = {
					...state.aiStats,
					shotsFired: state.aiStats.shotsFired + 1,
					hits: state.aiStats.hits + (result !== 'miss' ? 1 : 0),
					misses: state.aiStats.misses + (result === 'miss' ? 1 : 0),
					shipsDestroyed:
						state.aiStats.shipsDestroyed + (result === 'sunk' ? 1 : 0)
				}

				// Check win condition
				if (areAllShipsSunk(ships)) {
					soundManager.play('defeat')
					set({
						playerBoard: board,
						playerShips: ships,
						aiStats: { ...newStats, endTime: Date.now() },
						aiHuntState: updatedHuntState,
						phase: 'gameOver',
						winner: 'ai',
						lastShot: { position, result },
						isAnimating: true
					})
					return
				}

				set({
					playerBoard: board,
					playerShips: ships,
					aiStats: newStats,
					aiHuntState: updatedHuntState,
					lastShot: { position, result },
					isAnimating: true,
					currentTurn: 'player'
				})
			},

			resetGame: () => {
				soundManager.play('click')
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
					aiHuntState: createAIHuntState()
				})
			},

			toggleSound: () => {
				const newEnabled = !get().soundEnabled
				soundManager.setEnabled(newEnabled)
				set({ soundEnabled: newEnabled })
			},

			toggleTheme: () => {
				set(state => ({ theme: state.theme === 'dark' ? 'light' : 'dark' }))
			},

			setAnimating: isAnimating => set({ isAnimating })
		}),
		{
			name: 'battleship-settings',
			partialize: state => ({
				soundEnabled: state.soundEnabled,
				theme: state.theme,
				difficulty: state.difficulty
			})
		}
	)
)
