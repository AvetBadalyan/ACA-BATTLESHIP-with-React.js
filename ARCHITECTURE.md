# 🏗️ Battleship Game Architecture

> **For Interview Preparation**: This document explains the codebase architecture, data flow, and design decisions. Reading this will prepare you to answer technical questions about the project.

## 📁 Project Structure

```
src/
├── components/          # React UI components
│   ├── Board/          # Game board (10x10 grid)
│   ├── Cell/           # Individual cell with animations
│   ├── ShipSelector/   # Ship selection panel (setup phase)
│   ├── GameStats/      # Statistics display
│   ├── Header/         # App header with controls
│   ├── TurnIndicator/  # Shows current turn
│   └── GameOverModal/  # End game modal
├── store/              # Zustand state management
│   └── gameStore.ts    # Central game state & actions
├── types/              # TypeScript type definitions
│   └── game.ts         # All shared types
├── utils/              # Pure utility functions
│   ├── board.ts        # Board operations (place, shoot)
│   ├── ai.ts           # AI opponent algorithms
│   └── sounds.ts       # Web Audio API sounds
├── hooks/              # Custom React hooks
│   └── useKeyboard.ts  # Keyboard event handling
├── styles/             # Global styles
│   ├── global.css      # Reset & utility classes
│   └── variables.css   # CSS custom properties
├── App.tsx             # Root component
└── main.tsx            # Entry point
```

## 🔄 Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                         │
│            (click cell, press key, click button)                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      REACT COMPONENT                            │
│         (Board, Cell, ShipSelector, Header, etc.)               │
│                                                                 │
│   • Receives user events                                        │
│   • Calls store actions                                         │
│   • Does NOT contain business logic                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │ calls action
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ZUSTAND STORE                              │
│                    (gameStore.ts)                               │
│                                                                 │
│   • Central state container                                     │
│   • Actions modify state                                        │
│   • Calls utility functions for logic                           │
│   • Triggers side effects (sounds)                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │ uses
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    UTILITY FUNCTIONS                            │
│              (board.ts, ai.ts, sounds.ts)                       │
│                                                                 │
│   • Pure functions (no side effects except sounds)              │
│   • Contain all game logic                                      │
│   • Easily testable in isolation                                │
│   • Return new state (immutable)                                │
└───────────────────────────┬─────────────────────────────────────┘
                            │ returns new state
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STATE UPDATE                                 │
│                                                                 │
│   Zustand's set() updates state                                 │
│   React automatically re-renders affected components            │
└─────────────────────────────────────────────────────────────────┘
```

## 🎮 Game Flow State Machine

```
                    ┌──────────────┐
                    │              │
          ┌────────►│    SETUP     │◄────────┐
          │         │              │         │
          │         └──────┬───────┘         │
          │                │                 │
          │    All ships placed              │
          │    Click "Start Battle"          │
          │                │                 │
          │                ▼                 │
          │         ┌──────────────┐         │
          │         │              │         │
   Reset  │         │   PLAYING    │         │  Reset
   Game   │         │              │         │  Game
          │         └──────┬───────┘         │
          │                │                 │
          │    All enemy ships sunk          │
          │                │                 │
          │                ▼                 │
          │         ┌──────────────┐         │
          │         │              │         │
          └─────────│  GAME OVER   │─────────┘
                    │              │
                    └──────────────┘
```

## 🔫 Shot Processing Flow

When a player clicks a cell to shoot:

```
1. playerShoot(position) called
        │
        ▼
2. Validation
   ├── Is it playing phase?
   ├── Is it player's turn?
   ├── Is animation finished?
   └── Is cell not already shot?
        │
        ▼
3. processShot(board, ships, position)
   ├── Check cell state
   ├── If 'ship' → HIT
   │   ├── Mark cell as 'hit'
   │   ├── Add to ship's hits array
   │   └── If hits.length === ship.size → SUNK
   │       └── Mark all ship cells as 'sunk'
   └── If 'empty' → MISS
       └── Mark cell as 'miss'
        │
        ▼
4. Play sound effect
   ├── 'hit' → explosion sound
   ├── 'miss' → splash sound
   └── 'sunk' → sinking sound
        │
        ▼
5. Update statistics
   ├── Increment shotsFired
   ├── Increment hits or misses
   └── If sunk, increment shipsDestroyed
        │
        ▼
6. Check win condition
   └── areAllShipsSunk(enemyShips)?
       ├── Yes → Game Over (player wins)
       └── No → Switch to AI turn
```

## 🧭 Learning Guide: Follow One Shot Through the Code

> If the codebase feels overwhelming, read this section. It traces a single
> click from the screen all the way to a state change and back, naming the
> real files and functions. Once this one path makes sense, the rest of the
> app is just variations of it.

### The one idea that unlocks everything

**The board is data, not pixels.** A board is a 10×10 array of arrays
(`Cell[][]`). Each cell is a small object with a `state`:
`'empty' | 'ship' | 'hit' | 'miss' | 'sunk'`. That's the whole game state of a
grid. Everything else — drawing, sounds, the AI — just reads or changes those
cell states. You never "hit a battleship" by changing colors; you change
`board[row][col].state` from `'ship'` to `'hit'`, and React redraws because the
data changed.

There are **two boards**: `playerBoard` holds your ships (the AI shoots at it),
`aiBoard` holds the AI's ships (you shoot at it). Player and AI use the **same**
shot logic, just aimed at the opposite board.

### Step by step: clicking an enemy cell to fire

1. **`components/Cell/Cell.tsx`** — you click a cell on "Enemy Waters". The
   cell calls the `onClick` it was given. The Cell is "dumb": it just reports
   the click and draws whatever `state` it holds. It decides nothing about the
   game.

2. **`components/Board/Board.tsx`** — the board rendered each cell in a double
   `.map()` (rows × columns) and wired each one's click to
   `handleCellClick({ row, col })`. For the enemy board, that calls the
   `onCellClick` prop, which is the store's `playerShoot`.

3. **`store/gameStore.ts` → `playerShoot(position)`** — this is the brain of a
   turn. It guards against invalid clicks (not your turn, already-shot cell,
   mid-animation), then calls `processShot` to compute the result.

4. **`utils/board.ts` → `processShot(board, ships, position)`** — pure logic,
   no React. It looks at `aiBoard[row][col]`: if it's a `'ship'` it becomes
   `'hit'` (and if that ship's hit count now equals its size, all its cells
   become `'sunk'`); otherwise it becomes `'miss'`. It returns a **new** board
   (immutability — see the Design Patterns section).

5. Back in `playerShoot`, the store plays a sound (`utils/sounds.ts`), updates
   stats (shots/hits/accuracy), checks the win condition
   (`areAllShipsSunk`), stores the new board, and flips `currentTurn` to
   `'ai'`.

6. **React re-renders.** Because the store state changed, any component reading
   that state re-renders. The clicked cell now has `state: 'hit'` or `'miss'`,
   so `Cell.tsx` draws the 💥 or splash. You didn't touch the DOM — the data
   change did it.

7. **The AI's turn.** In `App.tsx`, a `useEffect` watches `currentTurn`. When it
   becomes `'ai'`, it waits ~1s (for drama) then calls `aiTurn()`. That calls
   `getAIShot(playerBoard, huntState)` to pick a cell, then runs the **same**
   `processShot` — this time against your `playerBoard` — and flips the turn
   back to `'player'`. Repeat until one side's ships are all sunk.

### How to explain it in one breath

> "The board is a 2D array of cell objects. Clicking a cell calls a store
> action, `playerShoot`, which runs a pure `processShot` function to mark the
> cell hit/miss/sunk and returns a new board. React re-renders from that new
> state. The AI turn is triggered by a `useEffect` watching whose turn it is,
> and it reuses the exact same `processShot` against my board."

---

## 🤖 AI Algorithm: Hunt/Target

The AI is a two-mode state machine. It hunts randomly until it hits a ship,
then targets that ship's neighbors until it sinks.

```
getAIShot(board, state):
    // TARGET MODE: work through neighbors of previous hits
    while state.targetQueue not empty:
        target = state.targetQueue.dequeue()   // FIFO
        if target not already shot:
            return target

    // HUNT MODE: nothing queued, fire at a random untried cell
    state.mode = 'hunt'
    return randomUntriedCell(board)

updateAIHuntState(state, position, result, board):
    on hit:
        state.mode = 'target'
        state.hitStack.push(position)
        enqueue valid, un-shot neighbors of position
        if 2+ in-line hits: detect direction, sort queue that way
    on sunk:
        clear queue + hitStack, state.mode = 'hunt'
    on miss:
        keep state unchanged
```

Characteristics:

- Uses a FIFO queue for systematic targeting
- Remembers hit locations and infers ship orientation
- Move selection is O(n²) worst case (hunt-mode scan); state update is O(1)
  aside from a small neighbor-queue sort

## 📊 State Structure

```typescript
GameState {
  // Game flow
  phase: 'setup' | 'playing' | 'gameOver'
  currentTurn: 'player' | 'ai'
  winner: 'player' | 'ai' | null

  // Player data
  playerBoard: Cell[10][10]
  playerShips: Ship[5]
  playerStats: { shotsFired, hits, misses, ... }

  // AI data
  aiBoard: Cell[10][10]
  aiShips: Ship[5]
  aiStats: { ... }
  aiHuntState: { mode, targetQueue, hitStack, ... }

  // UI state
  selectedShip: ShipType | null
  shipOrientation: 'horizontal' | 'vertical'
  isAnimating: boolean
  lastShot: { position, result } | null

  // Settings (persisted to localStorage)
  soundEnabled: boolean
  theme: 'dark' | 'light'
}
```

## 🧩 Key Design Patterns Used

### 1. **Immutability Pattern**

All state updates create new objects instead of mutating:

```typescript
// ❌ Bad: Mutation
board[row][col].state = 'hit';

// ✅ Good: Immutable update
const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
newBoard[row][col] = { ...newBoard[row][col], state: 'hit' };
```

### 2. **State Machine Pattern**

Game phases and AI modes are explicit states with defined transitions:

```typescript
// Phase transitions
'setup' → 'playing' → 'gameOver' → 'setup'

// AI mode transitions
'hunt' → (on hit) → 'target' → (on sunk) → 'hunt'
```

### 3. **Factory Pattern**

Functions create objects with consistent structure:

```typescript
function createEmptyBoard(): Board { ... }
function createEmptyStats(): GameStats { ... }
function createAIHuntState(): AIHuntState { ... }
```

### 4. **State Machine (AI)**

The AI's behavior is driven by its current mode, which transitions based on
shot results:

```typescript
// getAIShot reads the mode; updateAIHuntState transitions it
'hunt'  --(on hit)--> 'target'
'target' --(on sunk)--> 'hunt'
// In target mode it drains a queue of neighbor cells; in hunt mode
// it fires at a random untried cell.
```

### 5. **Singleton Pattern**

Sound manager is a single instance:

```typescript
export const soundManager = new SoundManager();
// Used throughout: soundManager.play('hit')
```

### 6. **Observer Pattern**

React components subscribe to store changes via Zustand:

```typescript
const { phase, playerBoard } = useGameStore();
// Component re-renders when these values change
```

## 🎯 Component Responsibilities

| Component       | Responsibility                                   |
| --------------- | ------------------------------------------------ |
| `App`           | Route between phases, orchestrate AI turns       |
| `Board`         | Render 10x10 grid, handle ship preview on hover  |
| `Cell`          | Render single cell, animations for hit/miss/sunk |
| `ShipSelector`  | Ship selection UI, orientation toggle, randomize |
| `GameStats`     | Display shots, accuracy, ships remaining         |
| `Header`        | Sound and theme toggles                          |
| `TurnIndicator` | Show current turn, last shot result              |
| `GameOverModal` | Victory/defeat display, play again button        |

## 🔊 Sound Generation

Sounds are synthesized using Web Audio API (no audio files):

```typescript
// Explosion (hit)
oscillator(80Hz, sawtooth) + whiteNoise(500Hz lowpass)

// Splash (miss)
whiteNoise(800Hz lowpass) + oscillator(200Hz, sine)

// Victory
ascending major chord: C5 → E5 → G5 → C6

// Defeat
descending minor: A4 → F4 → D4
```

## 📱 Responsive Design

CSS variables adapt to screen size:

```css
:root {
  --cell-size: 40px; /* Desktop */
}

@media (max-width: 768px) {
  :root {
    --cell-size: 32px; /* Tablet */
  }
}

@media (max-width: 480px) {
  :root {
    --cell-size: 28px; /* Mobile */
  }
}
```

Layout changes:

- **Desktop**: Boards side-by-side
- **Mobile**: Boards stacked vertically

## 🧪 Testing Strategy (Future)

```
Unit Tests:
├── utils/board.ts    → Test each function in isolation
├── utils/ai.ts       → Test AI shot selection
└── store/gameStore.ts → Test state transitions

Integration Tests:
├── Ship placement flow
├── Shot processing flow
└── Win condition detection

E2E Tests:
├── Complete game playthrough
├── Responsive design verification
└── Sound toggle functionality
```

## 📈 Performance Considerations

1. **Memoization**: Board cells don't re-render unless their state changes
2. **Lazy AudioContext**: Created on first sound play (browser requirement)
3. **Partial Persistence**: Only settings saved to localStorage, not game state
4. **CSS Animations**: Hardware-accelerated transforms for smooth animations

## 🔮 Future Enhancement Architecture

### Multiplayer Support

```
Current:
  Player ←→ LocalAI

Future:
  Player ←→ WebSocket ←→ Server ←→ WebSocket ←→ Player

  // Today the AI is a pure function (getAIShot) called from the
  // store's aiTurn() action. To add multiplayer, introduce an
  // Opponent interface and move turn-taking behind it:
  interface Opponent {
    makeMove(board: Board): Promise<Position>;
  }

  class AIOpponent implements Opponent { ... }      // wraps getAIShot()
  class RemoteOpponent implements Opponent { ... }  // sends/receives via WebSocket
```

### Replay System

```typescript
// Current lastShot only tracks one shot
// Future: Track all shots for replay
interface GameHistory {
  shots: Shot[];
  timestamp: number;
}
```

---

## 💡 Interview Quick Reference

**Q: Why Zustand over Redux or Context?**

> Zustand is simpler (no boilerplate), more performant (partial subscriptions), and doesn't require Provider wrappers. For a game with frequent state updates, this efficiency matters.

**Q: How does the AI work?**

> It's a Hunt/Target state machine. In hunt mode it fires at random untried cells; once it hits, it switches to target mode and works through a queue of the hit's neighbors until the ship sinks, then goes back to hunting. After two in-line hits it infers the ship's orientation and tries that direction first.

**Q: How is state managed immutably?**

> All state updates use spread operators or map() to create new objects. This enables React's change detection and allows for features like undo/redo.

**Q: Why Web Audio API instead of audio files?**

> Smaller bundle size, no HTTP requests, works offline, and sounds can be parameterized at runtime. It demonstrates understanding of browser APIs.

**Q: How would you add multiplayer?**

> The AI turn is isolated in one place: the store's `aiTurn()` action calls the pure `getAIShot()` function. I'd extract an `Opponent` interface with a `makeMove()` method, wrap the current AI in an `AIOpponent`, and add a `RemoteOpponent` that sends/receives moves over WebSocket. Because `getAIShot()` is already pure and turn-taking lives in one action, little of the game logic needs to change.
