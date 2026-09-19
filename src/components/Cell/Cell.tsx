import { Cell as CellType } from '@/types'
import { motion } from 'framer-motion'
import styles from './Cell.module.css'

interface CellProps {
	cell: CellType
	onClick?: () => void
	isPreview?: boolean
	isValidPreview?: boolean
	isPlayerBoard?: boolean
	showShips?: boolean
	disabled?: boolean
}

export function Cell({
	cell,
	onClick,
	isPreview = false,
	isValidPreview = true,
	isPlayerBoard = false,
	showShips = false,
	disabled = false
}: CellProps) {
	const { state } = cell

	const getClassName = () => {
		const classes = [styles.cell]

		if (disabled) classes.push(styles.disabled)
		if (isPreview)
			classes.push(isValidPreview ? styles.previewValid : styles.previewInvalid)

		switch (state) {
			case 'ship':
				if (showShips || isPlayerBoard) classes.push(styles.ship)
				break
			case 'hit':
				classes.push(styles.hit)
				break
			case 'miss':
				classes.push(styles.miss)
				break
			case 'sunk':
				classes.push(styles.sunk)
				break
		}

		if (
			!disabled &&
			onClick &&
			state !== 'hit' &&
			state !== 'miss' &&
			state !== 'sunk'
		) {
			classes.push(styles.clickable)
		}

		return classes.join(' ')
	}

	const handleClick = () => {
		if (!disabled && onClick) {
			onClick()
		}
	}

	return (
		<motion.div
			className={getClassName()}
			onClick={handleClick}
			whileHover={!disabled && onClick ? { scale: 1.05 } : undefined}
			whileTap={!disabled && onClick ? { scale: 0.95 } : undefined}
		>
			{/* Water animation */}
			<div className={styles.water}>
				<div className={styles.wave} />
			</div>

			{/* Hit marker */}
			{state === 'hit' && (
				<motion.div
					className={styles.hitMarker}
					initial={{ scale: 0, rotate: -180 }}
					animate={{ scale: 1, rotate: 0 }}
					transition={{ type: 'spring', stiffness: 300, damping: 20 }}
				>
					<div className={styles.explosion} />
					<span className={styles.hitIcon}>💥</span>
				</motion.div>
			)}

			{/* Miss marker */}
			{state === 'miss' && (
				<motion.div
					className={styles.missMarker}
					initial={{ scale: 0, y: -20 }}
					animate={{ scale: 1, y: 0 }}
					transition={{ type: 'spring', stiffness: 400, damping: 25 }}
				>
					<div className={styles.splash} />
				</motion.div>
			)}

			{/* Sunk marker */}
			{state === 'sunk' && (
				<motion.div
					className={styles.sunkMarker}
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{ type: 'spring', stiffness: 200 }}
				>
					<span className={styles.sunkIcon}>🔥</span>
				</motion.div>
			)}
		</motion.div>
	)
}
