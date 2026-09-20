import { motion, AnimatePresence } from 'framer-motion';
import { Player, GameStats as GameStatsType } from '@/types';
import styles from './GameOverModal.module.css';

interface GameOverModalProps {
  isOpen: boolean;
  winner: Player | null;
  playerStats: GameStatsType;
  aiStats: GameStatsType;
  onPlayAgain: () => void;
}

export function GameOverModal({
  isOpen,
  winner,
  playerStats,
  aiStats,
  onPlayAgain,
}: GameOverModalProps) {
  const isVictory = winner === 'player';

  const getAccuracy = (stats: GameStatsType) => {
    return stats.shotsFired > 0 ? Math.round((stats.hits / stats.shotsFired) * 100) : 0;
  };

  const getGameDuration = (stats: GameStatsType) => {
    if (!stats.startTime || !stats.endTime) return '0:00';
    const seconds = Math.floor((stats.endTime - stats.startTime) / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={`${styles.modal} ${isVictory ? styles.victory : styles.defeat}`}
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className={styles.header}>
              <motion.div
                className={styles.icon}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                {isVictory ? '🏆' : '💀'}
              </motion.div>
              <h2 className={styles.title}>{isVictory ? 'Victory!' : 'Defeat'}</h2>
              <p className={styles.subtitle}>
                {isVictory
                  ? "You've destroyed the enemy fleet!"
                  : 'Your fleet has been destroyed...'}
              </p>
            </div>

            <div className={styles.statsComparison}>
              <div className={styles.statColumn}>
                <h4 className={styles.statTitle}>Your Stats</h4>
                <div className={styles.statItem}>
                  <span>Shots Fired</span>
                  <span className={styles.statValue}>{playerStats.shotsFired}</span>
                </div>
                <div className={styles.statItem}>
                  <span>Hits</span>
                  <span className={`${styles.statValue} ${styles.hits}`}>{playerStats.hits}</span>
                </div>
                <div className={styles.statItem}>
                  <span>Accuracy</span>
                  <span className={`${styles.statValue} ${styles.accuracy}`}>
                    {getAccuracy(playerStats)}%
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span>Ships Destroyed</span>
                  <span className={styles.statValue}>{playerStats.shipsDestroyed}</span>
                </div>
              </div>

              <div className={styles.divider} />

              <div className={styles.statColumn}>
                <h4 className={styles.statTitle}>AI Stats</h4>
                <div className={styles.statItem}>
                  <span>Shots Fired</span>
                  <span className={styles.statValue}>{aiStats.shotsFired}</span>
                </div>
                <div className={styles.statItem}>
                  <span>Hits</span>
                  <span className={`${styles.statValue} ${styles.hits}`}>{aiStats.hits}</span>
                </div>
                <div className={styles.statItem}>
                  <span>Accuracy</span>
                  <span className={`${styles.statValue} ${styles.accuracy}`}>
                    {getAccuracy(aiStats)}%
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span>Ships Destroyed</span>
                  <span className={styles.statValue}>{aiStats.shipsDestroyed}</span>
                </div>
              </div>
            </div>

            <div className={styles.gameTime}>
              <span className={styles.timeIcon}>⏱️</span>
              <span>Game Duration: {getGameDuration(playerStats)}</span>
            </div>

            <motion.button
              className={`btn btn-primary ${styles.playAgainBtn}`}
              onClick={onPlayAgain}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🎮 Play Again
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
