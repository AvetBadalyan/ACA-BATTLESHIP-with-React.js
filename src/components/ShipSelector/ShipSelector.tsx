import { Orientation, Ship, SHIP_TYPES, ShipType } from '@/types';
import { motion } from 'framer-motion';
import styles from './ShipSelector.module.css';

interface ShipSelectorProps {
  selectedShip: ShipType | null;
  orientation: Orientation;
  placedShips: Ship[];
  onSelectShip: (ship: ShipType | null) => void;
  onToggleOrientation: () => void;
  onRandomize: () => void;
  onClear: () => void;
  onStartGame: () => void;
}

export function ShipSelector({
  selectedShip,
  orientation,
  placedShips,
  onSelectShip,
  onToggleOrientation,
  onRandomize,
  onClear,
  onStartGame,
}: ShipSelectorProps) {
  const isShipPlaced = (shipId: string) => placedShips.some((s) => s.id === shipId);
  const allShipsPlaced = placedShips.length === SHIP_TYPES.length;

  const getShipStatus = (ship: ShipType) => {
    if (selectedShip?.id === ship.id) return 'selected';
    if (isShipPlaced(ship.id)) return 'placed';
    return 'available';
  };

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <h3 className={styles.title}>Fleet</h3>

      <div className={styles.shipList}>
        {SHIP_TYPES.map((ship) => {
          const status = getShipStatus(ship);
          const isSelected = status === 'selected';
          const isPlaced = status === 'placed';
          return (
            <motion.button
              key={ship.id}
              className={`${styles.shipItem} ${styles[status]}`}
              onClick={() => onSelectShip(isSelected ? null : ship)}
              aria-label={`${ship.name} (${ship.size} cells)${isPlaced ? ', placed' : ''}${isSelected ? ', selected' : ''}`}
              aria-pressed={isSelected}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={styles.shipInfo}>
                <span className={styles.shipName}>{ship.name}</span>
                <span className={styles.shipSize}>({ship.size} cells)</span>
              </div>
              <div className={styles.shipPreview}>
                {Array.from({ length: ship.size }).map((_, i) => (
                  <div key={i} className={styles.shipCell} />
                ))}
              </div>
              {status === 'placed' && <span className={styles.checkmark}>✓</span>}
            </motion.button>
          );
        })}
      </div>

      <div className={styles.controls}>
        <div className={styles.orientationControl}>
          <span className={styles.label}>Orientation:</span>
          <button
            className={`${styles.orientationBtn} ${orientation === 'horizontal' ? styles.active : ''}`}
            onClick={onToggleOrientation}
            aria-label={`Orientation: ${orientation}`}
            aria-pressed={orientation === 'vertical'}
          >
            <span className={styles.orientationIcon}>
              {orientation === 'horizontal' ? '↔️' : '↕️'}
            </span>
            <span>{orientation === 'horizontal' ? 'Horizontal' : 'Vertical'}</span>
          </button>
          <span className={styles.hint}>Press R to rotate</span>
        </div>

        <div className={styles.actionButtons}>
          <button className="btn btn-secondary btn-sm" onClick={onRandomize}>
            🎲 Randomize
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onClear}
            disabled={placedShips.length === 0}
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      <motion.button
        className={`btn btn-primary ${styles.startButton}`}
        onClick={onStartGame}
        disabled={!allShipsPlaced}
        whileHover={allShipsPlaced ? { scale: 1.05 } : undefined}
        whileTap={allShipsPlaced ? { scale: 0.95 } : undefined}
      >
        {allShipsPlaced
          ? '⚔️ Start Battle!'
          : `Place ${SHIP_TYPES.length - placedShips.length} more ships`}
      </motion.button>
    </motion.div>
  );
}
