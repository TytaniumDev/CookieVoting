import { useCallback } from 'react';
import styles from './ProgressDots.module.css';

export type DotStatus = 'empty' | 'partial' | 'complete';

export interface DotItem {
    id: string;
    label: string;
    status: DotStatus;
}

export interface ProgressDotsProps {
    /** Array of dot items with their status */
    items: DotItem[];
    /** Index of the currently active/selected dot */
    activeIndex: number;
    /** Callback when a dot is clicked */
    onDotClick: (index: number) => void;
    /** Size variant */
    size?: 'small' | 'medium' | 'large';
}

/**
 * ProgressDots - A row of progress indicator dots.
 *
 * Each dot can be empty, partial, or complete. One dot is marked as active.
 * Clicking a dot triggers navigation to that item.
 */
export function ProgressDots({
    items,
    activeIndex,
    onDotClick,
    size = 'medium',
}: ProgressDotsProps) {
    const getDotClass = useCallback(
        (item: DotItem, index: number): string => {
            const classes = [styles.dot];

            if (index === activeIndex) {
                classes.push(styles.active);
            }

            classes.push(styles[item.status]);

            return classes.join(' ');
        },
        [activeIndex],
    );

    const sizeClass = size === 'small' ? styles.small : size === 'large' ? styles.large : '';

    return (
        <div className={`${styles.container} ${sizeClass}`} role="tablist">
            {items.map((item, index) => (
                <button
                    key={item.id}
                    type="button"
                    className={getDotClass(item, index)}
                    onClick={() => onDotClick(index)}
                    title={item.label}
                    aria-label={item.label}
                    aria-selected={index === activeIndex}
                    role="tab"
                />
            ))}
        </div>
    );
}
