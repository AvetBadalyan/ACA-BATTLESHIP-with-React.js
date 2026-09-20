import { useGameStore } from '@/store';
import { motion } from 'framer-motion';
import styles from './Header.module.css';

export function Header() {
  const { soundEnabled, theme, toggleSound, toggleTheme } = useGameStore();

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
        <button
          className={styles.iconButton}
          onClick={toggleSound}
          title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
          aria-label={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
          aria-pressed={soundEnabled}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>

        <button
          className={styles.iconButton}
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </motion.header>
  );
}
