import { cn } from '../../../lib/cn';

export interface DetectionToolbarProps {
    /** Number of detections */
    detectionCount: number;
    /** Whether regeneration is in progress */
    isRegenerating: boolean;
    /** Whether add mode is active */
    isAddMode: boolean;
    /** Callback when regenerate button is clicked */
    onRegenerate: () => void;
    /** Callback when add mode is toggled */
    onToggleAddMode: () => void;
    /** Helper text shown on the right side */
    helperText?: string;
}

/**
 * DetectionToolbar - Toolbar for cookie detection operations.
 *
 * Provides buttons for regenerating detections and toggling manual add mode.
 * Displays detection count and contextual helper text.
 */
export function DetectionToolbar({
    detectionCount,
    isRegenerating,
    isAddMode,
    onRegenerate,
    onToggleAddMode,
    helperText,
}: DetectionToolbarProps) {
    const defaultHelperText = isAddMode
        ? 'Click on image to add detection'
        : 'Click on detection to delete';

    return (
        <div className="flex items-center justify-between flex-wrap gap-2 py-2 px-3 bg-white/5 rounded-md max-[480px]:flex-col max-[480px]:items-stretch">
            <div className="flex items-center gap-2 max-[480px]:flex-wrap max-[480px]:justify-center">
                <button
                    type="button"
                    className="inline-flex items-center gap-2 py-2 px-3 rounded-md text-sm font-medium border border-white/20 bg-white/5 text-[#f8fafc] cursor-pointer transition-all whitespace-nowrap hover:bg-white/10 hover:border-white/30 focus-visible:outline-2 focus-visible:outline-[#dc2626] focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={onRegenerate}
                    disabled={isRegenerating}
                >
                    <span className="text-base leading-none">{isRegenerating ? '⏳' : '↻'}</span>
                    {isRegenerating ? 'Scanning...' : 'Regenerate'}
                </button>

                <button
                    type="button"
                    className={cn(
                        'inline-flex items-center gap-2 py-2 px-3 rounded-md text-sm font-medium border text-[#f8fafc] cursor-pointer transition-all whitespace-nowrap hover:border-white/30 focus-visible:outline-2 focus-visible:outline-[#dc2626] focus-visible:outline-offset-2',
                        isAddMode
                            ? 'bg-[#dc2626] border-[#dc2626] hover:bg-[#b91c1c]'
                            : 'border-white/20 bg-white/5 hover:bg-white/10'
                    )}
                    onClick={onToggleAddMode}
                >
                    <span className="text-base leading-none">+</span>
                    Add Manual
                </button>

                <span className="text-sm text-[#cbd5e1] bg-white/10 py-1 px-2 rounded-full">
                    {detectionCount} detections
                </span>
            </div>

            <div className="text-sm text-[#cbd5e1] italic max-[480px]:text-center">
                {helperText || defaultHelperText}
            </div>
        </div>
    );
}
