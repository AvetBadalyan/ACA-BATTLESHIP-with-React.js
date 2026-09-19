import { motion } from 'framer-motion';
import { Player, Difficulty } from '@/types';
import styles from './TurnIndicator.module.css';

interface TurnIndicatorProps {
  currentTurn: Player;
  difficulty: Difficulty;
  lastShot?: { result: 'hit' | 'miss' | 'sunk' } | null;
}

export function TurnIndicator({ currentTurn, difficulty, lastShot }: TurnIndicatorProps) {
  const isPlayerTurn = currentTurn === 'player';
  
  const getDifficultyLabel = () => {
    switch (difficulty) {
      case 'easy': return '🟢 Easy';
      case 'medium': return '🟡 Medium';
      case 'hard': return '🔴 Hard';
    }
  };
  
  const getLastShotMessage = () => {
    if (!lastShot) return null;
    switch (lastShot.result) {
      case 'hit': return '💥 Hit!';
      case 'miss': return '💨 Miss';
      case 'sunk': return '🔥 Ship Sunk!';
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
          <span className={styles.turnText}>
            {isPlayerTurn ? 'Your Turn' : 'AI Thinking...'}
          </span>
        </motion.div>
        
        {!isPlayerTurn && (
          <span className={styles.difficulty}>{getDifficultyLabel()}</span>
        )}
      </div>
      
      {lastShot && (
        <motion.div
          key={`${lastShot.result}-${Date.now()}`}
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
