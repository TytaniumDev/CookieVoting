export interface Baker {
  id: string;
  name: string;
}

export interface BakerDropdownProps {
  /** List of available bakers */
  bakers: Baker[];
  /** Currently selected baker ID (if any) */
  selectedBakerId?: string;
  /** Title displayed in the dropdown header */
  title?: string;
  /** Callback when a baker is selected */
  onSelect: (bakerId: string) => void;
  /** Callback when the remove/unassign button is clicked */
  onRemove?: () => void;
  /** Callback when the close button is clicked */
  onClose: () => void;
  /** Whether to show the remove button */
  showRemove?: boolean;
}

/**
 * BakerDropdown - A dropdown for selecting a baker.
 *
 * Displays a list of bakers with selection state. Includes close button
 * and optional remove/unassign button.
 */
export function BakerDropdown({
  bakers,
  selectedBakerId,
  title = 'Assign Baker',
  onSelect,
  onRemove,
  onClose,
  showRemove = false,
}: BakerDropdownProps) {
  return (
    <div
      className="min-w-[180px] max-w-[280px] bg-[#1a2b47] border border-white/20 rounded-md shadow-lg overflow-hidden"
      role="dialog"
      aria-label={title}
    >
      <div className="flex justify-between items-center py-2 px-3 border-b border-white/10 bg-black/20">
        <span className="text-sm font-semibold text-[#f8fafc]">{title}</span>
        <button
          type="button"
          className="bg-transparent border-none text-[#cbd5e1] text-xl cursor-pointer p-0 leading-none transition-colors hover:text-[#f8fafc] focus-visible:outline-2 focus-visible:outline-[#dc2626] focus-visible:outline-offset-2"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div className="max-h-[200px] overflow-y-auto" role="listbox">
        {bakers.length > 0 ? (
          bakers.map((baker) => {
            const isSelected = selectedBakerId === baker.id;
            return (
              <button
                key={baker.id}
                type="button"
                className={`flex items-center justify-between w-full py-2 px-3 bg-transparent border-none text-[#f8fafc] text-sm text-left cursor-pointer transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#dc2626] focus-visible:outline-inset ${
                  isSelected ? 'bg-[rgba(220,38,38,0.2)]' : ''
                }`}
                onClick={() => onSelect(baker.id)}
                role="option"
                aria-selected={isSelected}
              >
                {baker.name}
                {isSelected && <span className="text-[#16a34a] font-bold">✓</span>}
              </button>
            );
          })
        ) : (
          <div className="py-3 text-[#cbd5e1] text-sm italic text-center">No bakers available</div>
        )}
      </div>

      {showRemove && onRemove && (
        <button
          type="button"
          className="w-full py-2 px-3 bg-transparent border-none border-t border-white/10 text-[#ef4444] text-sm text-left cursor-pointer transition-colors hover:bg-[rgba(220,38,38,0.1)] focus-visible:outline-2 focus-visible:outline-[#ef4444] focus-visible:outline-inset"
          onClick={onRemove}
        >
          Remove Assignment
        </button>
      )}
    </div>
  );
}
