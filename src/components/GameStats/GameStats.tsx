import { motion } from 'framer-motion';
import { GameStats as GameStatsType, Ship } from '@/types';
import styles from './GameStats.module.css';

interface GameStatsProps {
  stats: GameStatsType;
  ships: Ship[];
  title: string;
  isPlayer?: boolean;
}

export function GameStats({ stats, ships, title, isPlayer = false }: GameStatsProps) {
  const accuracy = stats.shotsFired > 0 
    ? Math.round((stats.hits / stats.shotsFired) * 100) 
    : 0;
  
  const shipsRemaining = ships.filter(s => !s.isSunk).length;
  const shipsSunk = ships.filter(s => s.isSunk).length;
  
  const getElapsedTime = () => {
    if (!stats.startTime) return '0:00';
    const endTime = stats.endTime || Date.now();
    const seconds = Math.floor((endTime - stats.startTime) / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      className={`${styles.container} ${isPlayer ? styles.player : styles.opponent}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h4 className={styles.title}>{title}</h4>
      
      <div className={styles.statsGrid}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.shotsFired}</span>
          <span className={styles.statLabel}>Shots</span>
        </div>
        <div className={styles.stat}>
          <span className={`${styles.statValue} ${styles.hits}`}>{stats.hits}</span>
          <span className={styles.statLabel}>Hits</span>
        </div>
        <div className={styles.stat}>
          <span className={`${styles.statValue} ${styles.misses}`}>{stats.misses}</span>
          <span className={styles.statLabel}>Misses</span>
        </div>
        <div className={styles.stat}>
          <span className={`${styles.statValue} ${styles.accuracy}`}>{accuracy}%</span>
          <span className={styles.statLabel}>Accuracy</span>
        </div>
      </div>
      
      <div className={styles.shipsStatus}>
        <div className={styles.shipsStat}>
          <span className={styles.shipsIcon}>🚢</span>
          <span className={styles.shipsValue}>{shipsRemaining}</span>
          <span className={styles.shipsLabel}>Remaining</span>
        </div>
        <div className={styles.shipsStat}>
          <span className={styles.shipsIcon}>💀</span>
          <span className={styles.shipsValue}>{shipsSunk}</span>
          <span className={styles.shipsLabel}>Sunk</span>
        </div>
      </div>
      
      <div className={styles.timer}>
        <span className={styles.timerIcon}>⏱️</span>
        <span className={styles.timerValue}>{getElapsedTime()}</span>
      </div>
    </motion.div>
  );
}
