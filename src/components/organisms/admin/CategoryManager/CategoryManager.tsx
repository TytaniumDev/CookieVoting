import { useState, useCallback, useEffect } from 'react';
import { useEventStore } from '../../../../lib/stores/useEventStore';
import { uploadImage } from '../../../../lib/storage';
import { validateImage, validateCategoryName, sanitizeInput } from '../../../../lib/validation';
import { CONSTANTS } from '../../../../lib/constants';
import { CategoryCard } from '../../../molecules/CategoryCard';
import { FileDropZone } from '../../../molecules/FileDropZone';
import type { Category } from '../../../../lib/types';
import styles from './CategoryManager.module.css';

export interface CategoryManagerProps {
    eventId: string;
    onCategoryClick?: (category: Category) => void;
}

/**
 * CategoryManager - Manages category listing, creation, and editing.
 *
 * Uses CategoryCard for displaying individual categories and FileDropZone
 * for image upload. Orchestrates data fetching and CRUD operations.
 */
export function CategoryManager({ eventId, onCategoryClick }: CategoryManagerProps) {
    const { categories, fetchCategories, addCategory, deleteCategory, updateCategory, loading } =
        useEventStore();

    // Add form state
    const [newCatName, setNewCatName] = useState('');
    const [newCatFile, setNewCatFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch categories on mount
    useEffect(() => {
        if (eventId) {
            fetchCategories(eventId);
        }
    }, [eventId, fetchCategories]);

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
        [previewUrl],
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
                const storagePath = `shared/cookies`;
                const imageUrl = await uploadImage(newCatFile, storagePath);
                await addCategory(eventId, sanitizedName, imageUrl);
                handleRemovePreview();
                setNewCatName('');
            } catch (err) {
                console.error('Error adding category:', err);
                setError(err instanceof Error ? err.message : CONSTANTS.ERROR_MESSAGES.FAILED_TO_UPLOAD);
            } finally {
                setUploading(false);
            }
        },
        [eventId, newCatFile, newCatName, uploading, addCategory, handleRemovePreview],
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
        [eventId, updateCategory],
    );

    const handleDelete = useCallback(
        async (category: Category) => {
            if (
                !window.confirm(
                    `Are you sure you want to delete "${category.name}"? This will remove all associated cookie data.`,
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
        [eventId, deleteCategory],
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>Categories &amp; Images</h3>
                {categories.length > 0 && <span className={styles.count}>{categories.length}</span>}
            </div>

            {error && (
                <div className={styles.error} role="alert">
                    {error}
                </div>
            )}

            {/* Category Grid */}
            {categories.length > 0 ? (
                <div className={styles.grid}>
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
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>🍪</span>
                        <p>No categories yet. Add your first category below!</p>
                    </div>
                )
            )}

            {/* Add Category Form */}
            <div className={styles.addSection}>
                <h4 className={styles.addTitle}>Add Category</h4>
                <form onSubmit={handleAddCategory} className={styles.addForm}>
                    {!newCatFile ? (
                        <FileDropZone
                            accept="image/*"
                            onFileSelect={handleFileSelect}
                            icon="📷"
                            text="Click or drag an image here"
                            ariaLabel="Upload category image"
                        />
                    ) : (
                        <div className={styles.previewContainer}>
                            <img src={previewUrl || ''} alt="Preview" className={styles.previewImage} />
                            <div className={styles.previewInfo}>
                                <span className={styles.previewFileName}>{newCatFile.name}</span>
                                <button type="button" onClick={handleRemovePreview} className={styles.removePreview}>
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
                                className={styles.input}
                                maxLength={100}
                                required
                            />
                            <button
                                type="submit"
                                disabled={!newCatName.trim() || uploading}
                                className={styles.addButton}
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
