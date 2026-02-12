import { useState, useRef, useEffect, useCallback } from 'react';
import type { ProcessingStatus } from '../../../lib/firestore';
import { AlertModal } from '../../atoms/AlertModal/AlertModal';
import { Button } from '@/components/ui/button';

export interface CategoryCardProps {
  /** Unique identifier for the category */
  id: string;
  /** Display name of the category */
  name: string;
  /** URL of the category image */
  imageUrl: string;
  /** Number of cookies tagged in this category */
  cookieCount: number;
  /** Callback when the image is clicked */
  onImageClick?: () => void;
  /** Callback when the name is saved after editing */
  onNameSave?: (newName: string) => void;
  /** Callback when delete is clicked */
  onDelete?: () => void;
  /** Processing status for Vision API */
  processingStatus?: ProcessingStatus;
  /** Error message for processing (shown in modal) */
  processingError?: string | null;
  /** Callback when process button is clicked */
  onProcess?: () => void;
  /** Callback when reprocess button is clicked */
  /** Callback when reprocess button is clicked */
  onReprocess?: () => void;
  /** Event ID this category belongs to (for navigation) */
  eventId?: string;
}

/**
 * CategoryCard - Displays a category with image, editable name, and actions.
 */
export function CategoryCard({
  id,
  name,
  imageUrl,
  cookieCount,
  onImageClick,
  onNameSave,
  onDelete,
  processingStatus,
  processingError,
  onProcess,
  onReprocess,
  eventId,
}: CategoryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isEditing]);

  // Reset edit name when name prop changes
  useEffect(() => {
    setEditName(name);
  }, [name]);

  const handleStartEdit = useCallback(() => {
    setIsEditing(true);
    setEditName(name);
  }, [name]);

  const handleSave = useCallback(() => {
    if (editName.trim() && editName !== name) {
      onNameSave?.(editName.trim());
    }
    setIsEditing(false);
  }, [editName, name, onNameSave]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditName(name);
  }, [name]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSave();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    },
    [handleSave, handleCancel],
  );

  return (
    <div
      className="bg-surface-tertiary rounded-xl overflow-hidden border border-surface-tertiary hover:border-primary-600/50 transition-colors"
      data-category-id={id}
    >
      {/* Image */}
      <button
        type="button"
        className="w-full aspect-video relative overflow-hidden bg-surface-secondary group"
        onClick={onImageClick}
        aria-label={`View ${name}`}
      >
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
      </button>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Name / Edit */}
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className="flex-1 px-2 py-1 bg-surface-secondary border border-primary-500 focus:outline-none rounded text-white text-sm"
              maxLength={100}
            />
            <button
              type="button"
              onClick={handleSave}
              className="w-7 h-7 flex items-center justify-center rounded bg-primary-600 hover:bg-primary-700 text-white text-sm"
              aria-label="Save"
            >
              ✓
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="w-7 h-7 flex items-center justify-center rounded bg-surface-secondary hover:bg-surface text-gray-400 text-sm"
              aria-label="Cancel"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="text-white font-medium text-sm hover:text-primary-400 transition-colors text-left truncate w-full"
            onClick={handleStartEdit}
            title="Click to rename"
          >
            {name}
          </button>
        )}

        {/* Cookie count */}
        <span className="block text-gray-500 text-xs">
          {cookieCount} cookie{cookieCount !== 1 ? 's' : ''} tagged
        </span>

        {/* Processing status */}
        {processingStatus && (
          <div className="text-xs">
            {processingStatus === 'not_processed' && (
              <span className="text-gray-500">Not Processed</span>
            )}
            {processingStatus === 'review_required' && (
              <span className="text-yellow-500 font-bold">In Review</span>
            )}
            {processingStatus === 'in_progress' && (
              <div className="flex items-center gap-2 text-blue-400">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Processing...</span>
              </div>
            )}
            {processingStatus === 'processed' && <span className="text-green-400">Processed</span>}
            {processingStatus === 'error' && (
              <button
                type="button"
                onClick={() => setShowErrorModal(true)}
                className="text-red-400 hover:text-red-300 hover:underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1 focus:ring-offset-surface-tertiary rounded"
                aria-label="View error details"
              >
                Error
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
          <div className="flex gap-1">
            {processingStatus === 'review_required' && (
              <Button
                type="button"
                size="sm"
                variant="default"
                className="bg-yellow-500 hover:bg-yellow-600 text-white h-7 px-2 text-xs"
                onClick={() => {
                  const eId = eventId || id.split('_')[0];
                  window.location.href = `/admin/${eId}/categories/${id}/review`;
                }}
              >
                Review
              </Button>
            )}
            {processingStatus === 'not_processed' && onProcess && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-primary-400 hover:text-primary-300 hover:bg-primary-400/10"
                onClick={onProcess}
              >
                Process
              </Button>
            )}
            {(processingStatus === 'processed' ||
              processingStatus === 'error' ||
              (processingStatus === 'not_processed' && !onProcess)) &&
              onReprocess && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-primary-400 hover:text-primary-300 hover:bg-primary-400/10"
                  onClick={onReprocess}
                >
                  Reprocess
                </Button>
              )}
          </div>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10"
            onClick={onDelete}
          >
            Delete
          </Button>
        </div>

        {/* Error Modal */}
        {showErrorModal && processingError && (
          <AlertModal
            message={processingError}
            type="error"
            title="Processing Error"
            onClose={() => setShowErrorModal(false)}
          />
        )}
      </div>
    </div>
  );
}
