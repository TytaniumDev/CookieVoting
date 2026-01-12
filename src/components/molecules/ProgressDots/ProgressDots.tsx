import { useCallback } from 'react';
import { cn } from '../../../lib/cn';

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
            const getDotSize = () => {
                switch (size) {
                    case 'small':
                        return 'w-2 h-2 max-[480px]:w-2.5 max-[480px]:h-2.5';
                    case 'large':
                        return 'w-4 h-4 max-[480px]:w-2.5 max-[480px]:h-2.5';
                    default:
                        return 'w-3 h-3 max-[480px]:w-2.5 max-[480px]:h-2.5';
                }
            };

            return cn(
                'rounded-full border-2 bg-transparent cursor-pointer p-0 transition-all hover:border-white/50 hover:scale-110 focus-visible:outline-2 focus-visible:outline-[#dc2626] focus-visible:outline-offset-2',
                getDotSize(),
                index === activeIndex && 'border-[#dc2626] shadow-[0_0_8px_#dc2626]',
                item.status === 'complete' && 'bg-[#16a34a] border-[#16a34a]',
                item.status === 'partial' &&
                    'bg-gradient-to-br from-[#dc2626] from-50% to-transparent to-50% border-[#dc2626]',
                item.status === 'empty' && 'bg-transparent'
            );
        },
        [activeIndex, size],
    );

    return (
        <div className="flex justify-center gap-2 flex-wrap" role="tablist">
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
