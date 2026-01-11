/**
 * Shared UI Components for CookieCropper Controls
 * 
 * Stepper: +/- buttons for numeric values
 * Slider: Range input for padding percentage
 */
import { cn } from '../../../../../lib/cn';

interface StepperProps {
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (value: number) => void;
    id: string;
}

export function Stepper({ label, value, min, max, onChange, id }: StepperProps) {
    const decrement = () => onChange(Math.max(min, value - 1));
    const increment = () => onChange(Math.min(max, value + 1));

    return (
        <div className="space-y-2">
            <label
                htmlFor={id}
                className="block text-xs font-medium text-white/50 uppercase tracking-widest"
            >
                {label}
            </label>
            <div className="flex items-center justify-between bg-surface-tertiary/50 rounded-xl p-1 border border-white/5">
                <button
                    type="button"
                    onClick={decrement}
                    disabled={value <= min}
                    className={cn(
                        "w-10 h-10 flex items-center justify-center rounded-lg transition-all active:scale-95",
                        "text-white/70 hover:bg-white/10 hover:text-white",
                        value <= min && "opacity-30 cursor-not-allowed hover:bg-transparent"
                    )}
                    aria-label={`Decrease ${label}`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                </button>
                <span
                    id={id}
                    className="flex-1 text-center text-xl font-bold font-mono text-white tracking-wider"
                    aria-live="polite"
                >
                    {value}
                </span>
                <button
                    type="button"
                    onClick={increment}
                    disabled={value >= max}
                    className={cn(
                        "w-10 h-10 flex items-center justify-center rounded-lg transition-all active:scale-95",
                        "text-white/70 hover:bg-white/10 hover:text-white",
                        value >= max && "opacity-30 cursor-not-allowed hover:bg-transparent"
                    )}
                    aria-label={`Increase ${label}`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

interface SliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (value: number) => void;
    id: string;
    unit?: string;
}

export function Slider({ label, value, min, max, onChange, id, unit = '%' }: SliderProps) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label
                    htmlFor={id}
                    className="text-xs font-medium text-white/50 uppercase tracking-widest"
                >
                    {label}
                </label>
                <span className="text-sm font-mono text-white/70">
                    {value}{unit}
                </span>
            </div>
            <input
                id={id}
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="w-full h-2 bg-surface-tertiary rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
        </div>
    );
}

interface ActionButtonProps {
    children: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'secondary';
    className?: string;
}

export function ActionButton({
    children,
    onClick,
    disabled = false,
    variant = 'secondary',
    className
}: ActionButtonProps) {
    const baseClasses = "w-full font-medium rounded-xl transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";

    const variantClasses = variant === 'primary'
        ? "py-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold shadow-lg shadow-primary-900/20"
        : "py-3 bg-surface-tertiary/50 hover:bg-surface-tertiary text-white/90 border border-white/5";

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(baseClasses, variantClasses, className)}
        >
            {children}
        </button>
    );
}
