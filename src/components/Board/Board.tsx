import { Cell } from '@/components/Cell';
import { Board as BoardType, Orientation, Position, ShipType } from '@/types';
import { canPlaceShip, getShipPositions } from '@/utils/board';
import { motion } from 'framer-motion';
import { useCallback, useState } from 'react';
import styles from './Board.module.css';

interface BoardProps {
  board: BoardType;
  title: string;
  isPlayerBoard?: boolean;
  showShips?: boolean;
  disabled?: boolean;
  onCellClick?: (position: Position) => void;
  // Ship placement props
  selectedShip?: ShipType | null;
  shipOrientation?: Orientation;
  onShipPlace?: (position: Position) => void;
  placedShipIds?: string[];
}

const LABELS = {
  cols: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
  rows: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
};

export function Board({
  board,
  title,
  isPlayerBoard = false,
  showShips = false,
  disabled = false,
  onCellClick,
  selectedShip,
  shipOrientation = 'horizontal',
  onShipPlace,
  placedShipIds = [],
}: BoardProps) {
  const [hoverPos, setHoverPos] = useState<Position | null>(null);

  // Calculate preview positions for ship placement
  const getPreviewPositions = useCallback((): {
    positions: Position[];
    isValid: boolean;
  } => {
    if (!selectedShip || !hoverPos) return { positions: [], isValid: false };

    const positions = getShipPositions(hoverPos, selectedShip.size, shipOrientation);
    const isPlaced = placedShipIds.includes(selectedShip.id);
    const isValid = canPlaceShip(
      board,
      hoverPos,
      selectedShip.size,
      shipOrientation,
      isPlaced ? selectedShip.id : undefined
    );

    return { positions, isValid };
  }, [selectedShip, hoverPos, shipOrientation, board, placedShipIds]);

  const { positions: previewPositions, isValid: isValidPlacement } = getPreviewPositions();

  const isPreviewCell = (row: number, col: number): boolean => {
    return previewPositions.some((p) => p.row === row && p.col === col);
  };

  const handleCellClick = (position: Position) => {
    if (disabled) return;

    if (selectedShip && onShipPlace) {
      onShipPlace(position);
    } else if (onCellClick) {
      onCellClick(position);
    }
  };

  const handleMouseEnter = (position: Position) => {
    if (selectedShip) {
      setHoverPos(position);
    }
  };

  const handleMouseLeave = () => {
    setHoverPos(null);
  };

  return (
    <motion.div
      className={styles.boardContainer}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className={styles.title}>{title}</h3>

      <div className={styles.boardWrapper}>
        {/* Column labels */}
        <div className={styles.colLabels}>
          <div className={styles.cornerLabel} />
          {LABELS.cols.map((label) => (
            <div key={label} className={styles.label}>
              {label}
            </div>
          ))}
        </div>

        {/* Board grid with row labels */}
        <div className={styles.gridContainer}>
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className={styles.row}>
              <div className={styles.rowLabel}>{LABELS.rows[rowIndex]}</div>
              {row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  onMouseEnter={() => handleMouseEnter({ row: rowIndex, col: colIndex })}
                  onMouseLeave={handleMouseLeave}
                >
                  <Cell
                    cell={cell}
                    onClick={() => handleCellClick({ row: rowIndex, col: colIndex })}
                    isPreview={isPreviewCell(rowIndex, colIndex)}
                    isValidPreview={isValidPlacement}
                    isPlayerBoard={isPlayerBoard}
                    showShips={showShips}
                    disabled={disabled}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
