import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEventStore } from '../../../../lib/stores/useEventStore';
import { useImageStore } from '../../../../lib/stores/useImageStore';
import { sanitizeInput } from '../../../../lib/validation';
import { CONSTANTS } from '../../../../lib/constants';
import { CategoryCard } from '../../../molecules/CategoryCard';
import { FileDropZone } from '../../../molecules/FileDropZone';
import type { Category } from '../../../../lib/types';
import { cn } from '../../../../lib/cn';
import { categoryCreateSchema, categoryNameSchema, type CategoryCreateFormData } from '../../../../lib/schemas';

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

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        watch,
        reset,
        setValue,
    } = useForm<CategoryCreateFormData>({
        resolver: zodResolver(categoryCreateSchema),
        defaultValues: {
            name: '',
        },
    });

    const watchedImage = watch('image');



    // Update preview when image changes
    useEffect(() => {
        if (watchedImage && watchedImage instanceof File) {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            setPreviewUrl(URL.createObjectURL(watchedImage));
            setError(null);
        } else if (!watchedImage && previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }

        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [watchedImage, previewUrl]);

    const handleFileSelect = useCallback(
        (file: File) => {
            setValue('image', file, { shouldValidate: true });
        },
        [setValue]
    );

    const handleRemovePreview = useCallback(() => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setValue('image', undefined as unknown as File, { shouldValidate: false });
        setPreviewUrl(null);
    }, [previewUrl, setValue]);

    const onSubmit = useCallback(
        async (data: CategoryCreateFormData) => {
            setError(null);

            try {
                const sanitizedName = sanitizeInput(data.name);
                const { uploadImage } = useImageStore.getState();
                const imageEntity = await uploadImage(data.image, eventId, { type: 'tray_image' });
                await addCategory(eventId, sanitizedName, imageEntity.url);
                handleRemovePreview();
                reset();
            } catch (err) {
                console.error('Error adding category:', err);
                setError(err instanceof Error ? err.message : CONSTANTS.ERROR_MESSAGES.FAILED_TO_UPLOAD);
            }
        },
        [eventId, addCategory, handleRemovePreview, reset]
    );

    const handleNameSave = useCallback(
        async (categoryId: string, newName: string) => {
            try {
                // Validate using Zod schema
                const result = categoryNameSchema.safeParse({ name: newName });
                if (!result.success) {
                    setError(result.error.errors[0]?.message || 'Invalid category name');
                    return;
                }

                const sanitizedName = sanitizeInput(result.data.name);
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
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {!watchedImage ? (
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
                                <p className="text-gray-300 text-sm truncate">
                                    {watchedImage instanceof File ? watchedImage.name : 'Image'}
                                </p>
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

                    {watchedImage && (
                        <>
                            <div>
                                <input
                                    type="text"
                                    {...register('name')}
                                    placeholder="Category name (e.g., Sugar Cookies)"
                                    className="w-full px-4 py-2 bg-surface-tertiary border border-surface-tertiary focus:border-primary-500 focus:outline-none rounded-lg text-white placeholder-gray-500"
                                    maxLength={100}
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
                                )}
                            </div>
                            {errors.image && (
                                <p className="text-sm text-red-400">{errors.image.message}</p>
                            )}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={cn(
                                    'w-full px-4 py-2 rounded-lg font-medium transition-colors',
                                    isSubmitting
                                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                        : 'bg-primary-600 hover:bg-primary-700 text-white'
                                )}
                            >
                                {isSubmitting ? 'Uploading...' : 'Add Category'}
                            </button>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}
