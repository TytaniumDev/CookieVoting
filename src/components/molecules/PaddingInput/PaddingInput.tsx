import { cn } from '../../lib/cn';

export interface PaddingInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * PaddingInput - Input field for configuring padding percentage (0-50%)
 * Used when uploading cookie batches to control how much extra space is added around each cookie
 */
export function PaddingInput({ value, onChange, className, disabled }: PaddingInputProps) {
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseFloat(e.target.value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 50) {
      onChange(numValue);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  // Convert decimal (0.1) to percentage (10)
  const percentageValue = value * 100;

  const inputId = `padding-input-${Math.random().toString(36).substring(7)}`;
  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Padding Percentage
      </label>
      <div className="flex items-center gap-4">
        <input
          type="range"
          min="0"
          max="50"
          step="1"
          value={percentageValue}
          onChange={handleSliderChange}
          disabled={disabled}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
        />
        <div className="flex items-center gap-2">
          <input
            id={inputId}
            type="number"
            min="0"
            max="50"
            step="0.1"
            value={percentageValue.toFixed(1)}
            onChange={handleNumberChange}
            disabled={disabled}
            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">%</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Percentage of extra space added around each cookie when cropping (0% = no padding, 50% =
        maximum padding)
      </p>
    </div>
  );
}
