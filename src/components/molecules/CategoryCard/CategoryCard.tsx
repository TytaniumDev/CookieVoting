import { useState, useRef, useEffect, useCallback } from 'react';


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
}: CategoryCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(name);
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
        [handleSave, handleCancel]
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

                {/* Actions */}
                <div className="pt-2 border-t border-surface-secondary">
                    <button
                        type="button"
                        onClick={onDelete}
                        className="text-red-400 hover:text-red-300 text-sm"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}
