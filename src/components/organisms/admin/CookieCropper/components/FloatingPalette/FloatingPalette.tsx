/**
 * FloatingPalette Component (Redesigned)
 *
 * A fixed side panel containing grid controls for the CookieCropper.
 * Desktop only - on mobile we use MobileDrawer instead.
 *
 * Redesign Features:
 * - Glassmorphism styling with backdrop blur
 * - Stepper controls for rows/columns
 * - Slider for padding
 * - Gradient action buttons
 */
import { Stepper, Slider, ActionButton } from '../ControlUi';
import { cn } from '../../../../../../lib/cn';
import type { GridConfig } from '../cropUtils';

export interface FloatingPaletteProps {
  /** Current grid configuration */
  config: GridConfig;
  /** Called when any config value changes */
  onChange: (config: GridConfig) => void;
  /** Called when Apply button is clicked */
  onApply: () => void;
  /** Called when Save is clicked */
  onSave: () => void;
  /** Whether saving is in progress */
  isSaving?: boolean;
  /** Whether the palette is open (controlled state) */
  isOpen: boolean;
  /** Called when the palette is toggled (minimized/maximized) */
  onToggle: () => void;
}

export function FloatingPalette({
  config,
  onChange,
  onApply,
  onSave,
  isSaving = false,
  isOpen,
  onToggle,
}: FloatingPaletteProps) {
  const handleChange = (key: keyof GridConfig, value: number) => {
    onChange({ ...config, [key]: value });
  };

  // Minimized FAB state (when NOT open)
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-label="Open grid controls"
        className={cn(
          'absolute bottom-5 right-5 w-14 h-14',
          'flex items-center justify-center',
          'bg-gradient-to-r from-primary-600 to-primary-500',
          'border-none rounded-full',
          'text-white text-2xl',
          'cursor-pointer',
          'shadow-lg shadow-primary-900/40',
          'transition-transform hover:scale-105',
          'z-50',
        )}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    );
  }

  return (
    <aside
      className={cn(
        'absolute top-0 right-0 h-full w-[320px]',
        'bg-surface-secondary/95 backdrop-blur-xl',
        'border-l border-white/10',
        'flex flex-col',
        'shadow-2xl z-50',
      )}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <h2 className="text-lg font-semibold tracking-tight text-white/90">Grid Controls</h2>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Minimize palette"
          className={cn(
            'w-8 h-8 flex items-center justify-center',
            'rounded-lg',
            'text-white/50 hover:text-white hover:bg-white/10',
            'transition-colors',
          )}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </header>

      {/* Body */}
      <div className="flex-1 p-5 space-y-6 overflow-y-auto">
        {/* Grid Layout Section */}
        <section>
          <h3 className="text-xs font-medium text-white/50 uppercase tracking-widest mb-4">
            Grid Layout
          </h3>
          <div className="space-y-4">
            <Stepper
              id="rows"
              label="Rows"
              value={config.rows}
              min={1}
              max={10}
              onChange={(val) => handleChange('rows', val)}
            />
            <Stepper
              id="cols"
              label="Columns"
              value={config.cols}
              min={1}
              max={10}
              onChange={(val) => handleChange('cols', val)}
            />
          </div>
        </section>

        {/* Spacing Section */}
        <section>
          <h3 className="text-xs font-medium text-white/50 uppercase tracking-widest mb-4">
            Spacing
          </h3>
          <Slider
            id="padding"
            label="Padding"
            value={config.padding}
            min={0}
            max={20}
            onChange={(val) => handleChange('padding', val)}
          />
        </section>

        {/* Actions */}
        <section className="space-y-3">
          <h3 className="text-xs font-medium text-white/50 uppercase tracking-widest mb-4">
            Actions
          </h3>
          <ActionButton onClick={onApply}>Apply Grid</ActionButton>
        </section>
      </div>

      {/* Footer with Save Button */}
      <footer className="p-5 border-t border-white/10">
        <ActionButton variant="primary" onClick={onSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Cookies'}
        </ActionButton>
      </footer>
    </aside>
  );
}
