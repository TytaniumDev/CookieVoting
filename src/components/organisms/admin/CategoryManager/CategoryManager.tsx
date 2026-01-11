import { useState, useCallback, useEffect } from 'react';
import { useEventStore } from '../../../../lib/stores/useEventStore';
import { useImageStore } from '../../../../lib/stores/useImageStore';
import { validateImage, validateCategoryName, sanitizeInput } from '../../../../lib/validation';
import { CONSTANTS } from '../../../../lib/constants';
import { CategoryCard } from '../../../molecules/CategoryCard';
import { FileDropZone } from '../../../molecules/FileDropZone';
import type { Category } from '../../../../lib/types';
import { cn } from '../../../../lib/cn';

export interface CategoryManagerProps {
    eventId: string;
    onCategoryClick?: (category: Category) => void;
}

/**
 * CategoryManager - Manages category listing, creation, and editing.
 */
export function CategoryManager({ eventId, onCategoryClick }: CategoryManagerProps) {
    const { categories, addCategory, deleteCategory, updateCategory, loading } =
        useEventStore();

    // Add form state
    const [newCatName, setNewCatName] = useState('');
    const [newCatFile, setNewCatFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);



    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleFileSelect = useCallback(
        (file: File) => {
            const validation = validateImage(file);
            if (!validation.valid) {
                setError(validation.error || CONSTANTS.ERROR_MESSAGES.INVALID_IMAGE_TYPE);
                return;
            }

            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }

            setNewCatFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setError(null);
        },
        [previewUrl]
    );

    const handleRemovePreview = useCallback(() => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setNewCatFile(null);
        setPreviewUrl(null);
    }, [previewUrl]);

    const handleAddCategory = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!newCatFile || uploading) return;

            const nameValidation = validateCategoryName(newCatName);
            if (!nameValidation.valid) {
                setError(nameValidation.error || 'Invalid category name');
                return;
            }

            setUploading(true);
            setError(null);

            try {
                const sanitizedName = sanitizeInput(newCatName);
                const { uploadImage } = useImageStore.getState();
                const imageEntity = await uploadImage(newCatFile, eventId, { type: 'tray_image' });
                await addCategory(eventId, sanitizedName, imageEntity.url);
                handleRemovePreview();
                setNewCatName('');
            } catch (err) {
                console.error('Error adding category:', err);
                setError(err instanceof Error ? err.message : CONSTANTS.ERROR_MESSAGES.FAILED_TO_UPLOAD);
            } finally {
                setUploading(false);
            }
        },
        [eventId, newCatFile, newCatName, uploading, addCategory, handleRemovePreview]
    );

    const handleNameSave = useCallback(
        async (categoryId: string, newName: string) => {
            const validation = validateCategoryName(newName);
            if (!validation.valid) {
                setError(validation.error || 'Invalid category name');
                return;
            }

            try {
                const sanitizedName = sanitizeInput(newName);
                await updateCategory(eventId, categoryId, sanitizedName);
                setError(null);
            } catch (err) {
                console.error('Failed to update category:', err);
                setError('Failed to update category name.');
            }
        },
        [eventId, updateCategory]
    );

    const handleDelete = useCallback(
        async (category: Category) => {
            if (
                !window.confirm(
                    `Are you sure you want to delete "${category.name}"? This will remove all associated cookie data.`
                )
            ) {
                return;
            }

            try {
                await deleteCategory(eventId, category.id);
            } catch (err) {
                console.error('Failed to delete category:', err);
                setError('Failed to delete category. Please try again.');
            }
        },
        [eventId, deleteCategory]
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-white">Categories & Images</h3>
                {categories.length > 0 && (
                    <span className="px-2 py-0.5 bg-primary-600/30 text-primary-400 text-sm rounded-full">
                        {categories.length}
                    </span>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="text-red-400 text-sm p-3 bg-red-900/20 border border-red-900/50 rounded-lg" role="alert">
                    {error}
                </div>
            )}

            {/* Category Grid */}
            {categories.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category) => (
                        <CategoryCard
                            key={category.id}
                            id={category.id}
                            name={category.name}
                            imageUrl={category.imageUrl}
                            cookieCount={category.cookies.length}
                            onImageClick={() => onCategoryClick?.(category)}
                            onNameSave={(newName) => handleNameSave(category.id, newName)}
                            onDelete={() => handleDelete(category)}
                        />
                    ))}
                </div>
            ) : (
                !loading && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <span className="text-4xl mb-4">🍪</span>
                        <p>No categories yet. Add your first category below!</p>
                    </div>
                )
            )}

            {/* Add Category Form */}
            <div className="border-t border-surface-tertiary pt-6">
                <h4 className="text-md font-semibold text-white mb-4">Add Category</h4>
                <form onSubmit={handleAddCategory} className="space-y-4">
                    {!newCatFile ? (
                        <FileDropZone
                            accept="image/*"
                            onFileSelect={handleFileSelect}
                            icon="📷"
                            text="Click or drag an image here"
                            ariaLabel="Upload category image"
                        />
                    ) : (
                        <div className="flex items-center gap-4 p-4 bg-surface-tertiary rounded-lg">
                            <img
                                src={previewUrl || ''}
                                alt="Preview"
                                className="w-20 h-20 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                                <p className="text-gray-300 text-sm truncate">{newCatFile.name}</p>
                                <button
                                    type="button"
                                    onClick={handleRemovePreview}
                                    className="text-red-400 hover:text-red-300 text-sm mt-1"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    )}

                    {newCatFile && (
                        <>
                            <input
                                type="text"
                                value={newCatName}
                                onChange={(e) => {
                                    setNewCatName(e.target.value);
                                    setError(null);
                                }}
                                placeholder="Category name (e.g., Sugar Cookies)"
                                className="w-full px-4 py-2 bg-surface-tertiary border border-surface-tertiary focus:border-primary-500 focus:outline-none rounded-lg text-white placeholder-gray-500"
                                maxLength={100}
                                required
                            />
                            <button
                                type="submit"
                                disabled={!newCatName.trim() || uploading}
                                className={cn(
                                    'w-full px-4 py-2 rounded-lg font-medium transition-colors',
                                    !newCatName.trim() || uploading
                                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                        : 'bg-primary-600 hover:bg-primary-700 text-white'
                                )}
                            >
                                {uploading ? 'Uploading...' : 'Add Category'}
                            </button>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}
