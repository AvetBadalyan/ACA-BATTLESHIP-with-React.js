import { motion } from 'framer-motion';
import { useGameStore } from '@/store';
import styles from './Header.module.css';

export function Header() {
  const { soundEnabled, theme, toggleSound, toggleTheme, difficulty, setDifficulty, phase } = useGameStore();

  return (
    <motion.header
      className={styles.header}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.logo}>
        <span className={styles.logoIcon}>⚓</span>
        <h1 className={styles.title}>Battleship</h1>
      </div>
      
      <div className={styles.controls}>
        {phase === 'setup' && (
          <div className={styles.difficultySelect}>
            <label className={styles.label}>AI Difficulty:</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
              className={styles.select}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        )}
        
        <button
          className={styles.iconButton}
          onClick={toggleSound}
          title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>
        
        <button
          className={styles.iconButton}
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </motion.header>
  );
}
