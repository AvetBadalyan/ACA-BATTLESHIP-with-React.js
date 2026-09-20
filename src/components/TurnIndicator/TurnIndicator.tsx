import { Player, Position } from '@/types';
import { motion } from 'framer-motion';
import styles from './TurnIndicator.module.css';

interface TurnIndicatorProps {
  currentTurn: Player;
  lastShot?: { position: Position; result: 'hit' | 'miss' | 'sunk' } | null;
}

export function TurnIndicator({ currentTurn, lastShot }: TurnIndicatorProps) {
  const isPlayerTurn = currentTurn === 'player';

  const getLastShotMessage = () => {
    if (!lastShot) return null;
    switch (lastShot.result) {
      case 'hit':
        return '💥 Hit!';
      case 'miss':
        return '💨 Miss';
      case 'sunk':
        return '🔥 Ship Sunk!';
    }
  };

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={styles.turnInfo}>
        <motion.div
          key={currentTurn}
          className={`${styles.turnBadge} ${isPlayerTurn ? styles.player : styles.ai}`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <span className={styles.turnIcon}>{isPlayerTurn ? '🎯' : '🤖'}</span>
          <span className={styles.turnText}>{isPlayerTurn ? 'Your Turn' : 'AI Thinking...'}</span>
        </motion.div>
      </div>

      {lastShot && (
        <motion.div
          key={`${lastShot.position.row}-${lastShot.position.col}`}
          className={`${styles.lastShot} ${styles[lastShot.result]}`}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          {getLastShotMessage()}
        </motion.div>
      )}
    </motion.div>
  );
}
