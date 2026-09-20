import { Board, GameOverModal, GameStats, Header, ShipSelector, TurnIndicator } from '@/components';
import { useKeyboard } from '@/hooks';
import { useGameStore } from '@/store';
import '@/styles/global.css';
import { setSoundEnabled } from '@/utils/sounds';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import styles from './App.module.css';

function App() {
  const {
    phase,
    currentTurn,
    winner,
    playerBoard,
    playerShips,
    playerStats,
    aiBoard,
    aiShips,
    aiStats,
    selectedShip,
    shipOrientation,
    isAnimating,
    lastShot,
    soundEnabled,
    theme,
    selectShip,
    toggleOrientation,
    placePlayerShip,
    randomizePlacement,
    clearPlacement,
    startGame,
    playerShoot,
    aiTurn,
    resetGame,
    setAnimating,
  } = useGameStore();

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Sync sound setting with store
  useEffect(() => {
    setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  // Handle AI turn
  useEffect(() => {
    if (phase === 'playing' && currentTurn === 'ai' && !isAnimating) {
      const timeout = setTimeout(() => {
        aiTurn();
      }, 1000); // Delay for dramatic effect
      return () => clearTimeout(timeout);
    }
  }, [phase, currentTurn, isAnimating, aiTurn]);

  // Reset animation state after animation completes
  useEffect(() => {
    if (isAnimating && phase !== 'gameOver') {
      const timeout = setTimeout(() => {
        setAnimating(false);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isAnimating, phase, setAnimating]);

  // Keyboard handlers
  useKeyboard({
    r: () => {
      if (phase === 'setup') {
        toggleOrientation();
      }
    },
  });

  return (
    <div className={styles.app}>
      <Header />

      <main className={styles.main}>
        <AnimatePresence mode="wait">
          {phase === 'setup' && (
            <motion.div
              key="setup"
              className={styles.setupPhase}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className={styles.setupContent}>
                <ShipSelector
                  selectedShip={selectedShip}
                  orientation={shipOrientation}
                  placedShips={playerShips}
                  onSelectShip={selectShip}
                  onToggleOrientation={toggleOrientation}
                  onRandomize={randomizePlacement}
                  onClear={clearPlacement}
                  onStartGame={startGame}
                />

                <Board
                  board={playerBoard}
                  title="Your Fleet"
                  isPlayerBoard
                  selectedShip={selectedShip}
                  shipOrientation={shipOrientation}
                  onShipPlace={placePlayerShip}
                  placedShipIds={playerShips.map((s) => s.id)}
                />
              </div>

              <div className={styles.instructions}>
                <h3>📋 Instructions</h3>
                <ul>
                  <li>Select a ship from the fleet panel</li>
                  <li>Click on the board to place it</li>
                  <li>
                    Press <kbd>R</kbd> or click the orientation button to rotate
                  </li>
                  <li>Use "Randomize" for quick placement</li>
                  <li>Place all 5 ships to start the battle!</li>
                </ul>
              </div>
            </motion.div>
          )}

          {phase === 'playing' && (
            <motion.div
              key="playing"
              className={styles.playingPhase}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <TurnIndicator currentTurn={currentTurn} lastShot={lastShot} />

              <div className={styles.gameBoards}>
                <div className={styles.boardSection}>
                  <Board board={playerBoard} title="Your Fleet" isPlayerBoard showShips disabled />
                  <GameStats
                    stats={aiStats}
                    ships={playerShips}
                    title="Enemy's Progress"
                    isPlayer={false}
                  />
                </div>

                <div className={styles.boardSection}>
                  <Board
                    board={aiBoard}
                    title="Enemy Waters"
                    showShips={false}
                    disabled={currentTurn !== 'player' || isAnimating}
                    onCellClick={playerShoot}
                  />
                  <GameStats stats={playerStats} ships={aiShips} title="Your Progress" isPlayer />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <GameOverModal
        isOpen={phase === 'gameOver'}
        winner={winner}
        playerStats={playerStats}
        aiStats={aiStats}
        onPlayAgain={resetGame}
      />
    </div>
  );
}

export default App;
