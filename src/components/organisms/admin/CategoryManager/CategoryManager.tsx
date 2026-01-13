import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { v4 as uuidv4 } from 'uuid';
import { useEventStore } from '../../../../lib/stores/useEventStore';
import { useImageStore } from '../../../../lib/stores/useImageStore';
import { sanitizeInput } from '../../../../lib/validation';
import { CONSTANTS } from '../../../../lib/constants';
import { CategoryCard } from '../../../molecules/CategoryCard';
import { FileDropZone } from '../../../molecules/FileDropZone';
import { uploadTray } from '../../../../lib/uploadTray';
import { addCategory as addCategoryFirestore } from '../../../../lib/firestore';
import { useCategoryProcessing } from '../../../../lib/hooks/useCategoryProcessing';
import { reprocessCategory } from '../../../../lib/firestore';
import { ConfirmationModal } from '../../../atoms/ConfirmationModal/ConfirmationModal';
import type { Category } from '../../../../lib/types';
import { cn } from '../../../../lib/cn';
import { Button } from '@/components/ui/button';
import { categoryCreateSchema, categoryNameSchema, type CategoryCreateFormData } from '../../../../lib/schemas';

export interface CategoryManagerProps {
    eventId: string;
    onCategoryClick?: (category: Category) => void;
}

// Wrapper component that uses useCategoryProcessing hook
function CategoryCardWithProcessing({
    category,
    onImageClick,
    onNameSave,
    onDelete,
    onReprocess,
    eventId,
}: {
    category: Category;
    onImageClick?: () => void;
    onNameSave?: (newName: string) => void;
    onDelete?: () => void;
    onReprocess?: () => void;
    eventId: string;
}) {
    const { status: processingStatus, errorMessage: processingError } = useCategoryProcessing(category.batchId || null);
    return (
        <CategoryCard
            id={category.id}
            name={category.name}
            imageUrl={category.imageUrl}
            cookieCount={category.cookies.length}
            onImageClick={onImageClick}
            onNameSave={onNameSave}
            onDelete={onDelete}
            processingStatus={processingStatus}
            processingError={processingError}
            onReprocess={onReprocess}
            eventId={eventId}
        />
    );
}

/**
 * CategoryManager - Manages category listing, creation, and editing.
 */
export function CategoryManager({ eventId, onCategoryClick }: CategoryManagerProps) {
    const { categories, addCategory, deleteCategory, updateCategory, loading, fetchCategories } =
        useEventStore();

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [processWithVisionAPI, setProcessWithVisionAPI] = useState(false);

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

            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/46f7a595-7888-424b-9f1c-56c8a6eb8084', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'CategoryManager.tsx:120', message: 'onSubmit entry', data: { eventId, processWithVisionAPI, fileName: data.image?.name }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A,B,C,D,E' }) }).catch(() => { });
            // #endregion

            try {
                const sanitizedName = sanitizeInput(data.name);

                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/46f7a595-7888-424b-9f1c-56c8a6eb8084', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'CategoryManager.tsx:125', message: 'before uploadImage', data: { sanitizedName, fileSize: data.image?.size }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
                // #endregion

                const { uploadImage } = useImageStore.getState();
                const imageEntity = await uploadImage(data.image, eventId, { type: 'tray_image' });

                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/46f7a595-7888-424b-9f1c-56c8a6eb8084', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'CategoryManager.tsx:130', message: 'after uploadImage', data: { imageId: imageEntity?.id, imageUrl: imageEntity?.url }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
                // #endregion

                if (processWithVisionAPI) {
                    // Vision API processing: generate batchId, create category with batchId, upload to pipeline
                    const batchId = uuidv4();

                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/46f7a595-7888-424b-9f1c-56c8a6eb8084', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'CategoryManager.tsx:136', message: 'before addCategoryFirestore', data: { batchId, eventId, sanitizedName }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }) }).catch(() => { });
                    // #endregion

                    const category = await addCategoryFirestore(eventId, sanitizedName, imageEntity.url, batchId);

                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/46f7a595-7888-424b-9f1c-56c8a6eb8084', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'CategoryManager.tsx:141', message: 'after addCategoryFirestore', data: { categoryId: category?.id, batchId }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }) }).catch(() => { });
                    // #endregion

                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/46f7a595-7888-424b-9f1c-56c8a6eb8084', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'CategoryManager.tsx:144', message: 'before uploadTray', data: { batchId, eventId, categoryId: category?.id, fileSize: data.image?.size }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }) }).catch(() => { });
                    // #endregion

                    await uploadTray(data.image, batchId, eventId, category.id);

                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/46f7a595-7888-424b-9f1c-56c8a6eb8084', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'CategoryManager.tsx:147', message: 'after uploadTray', data: { batchId }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }) }).catch(() => { });
                    // #endregion
                } else {
                    // Regular flow: just create category with imageUrl

                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/46f7a595-7888-424b-9f1c-56c8a6eb8084', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'CategoryManager.tsx:153', message: 'before addCategory (non-Vision)', data: { eventId, sanitizedName }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D' }) }).catch(() => { });
                    // #endregion

                    await addCategory(eventId, sanitizedName, imageEntity.url);

                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/46f7a595-7888-424b-9f1c-56c8a6eb8084', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'CategoryManager.tsx:156', message: 'after addCategory (non-Vision)', data: { eventId }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D' }) }).catch(() => { });
                    // #endregion
                }

                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/46f7a595-7888-424b-9f1c-56c8a6eb8084', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'CategoryManager.tsx:162', message: 'onSubmit success', data: {}, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A,B,C,D,E' }) }).catch(() => { });
                // #endregion

                // Refresh categories list to show the new category immediately
                await fetchCategories(eventId);

                handleRemovePreview();
                reset();
            } catch (err) {
                console.error('Error adding category:', err);

                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/46f7a595-7888-424b-9f1c-56c8a6eb8084', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'CategoryManager.tsx:171', message: 'onSubmit error', data: { error: err instanceof Error ? err.message : String(err), errorStack: err instanceof Error ? err.stack : undefined }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A,B,C,D,E' }) }).catch(() => { });
                // #endregion

                const errorMessage = err instanceof Error ? err.message : CONSTANTS.ERROR_MESSAGES.FAILED_TO_UPLOAD;
                setError(errorMessage);
                // Re-throw error so react-hook-form can properly track submission state
                throw err;
            }
        },
        [eventId, addCategory, handleRemovePreview, reset, processWithVisionAPI, fetchCategories]
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

    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        action: () => Promise<void>;
        isDestructive: boolean;
    }>({
        isOpen: false,
        title: '',
        message: '',
        action: async () => { },
        isDestructive: false,
    });

    const closeConfirmation = useCallback(() => {
        setConfirmation((prev) => ({ ...prev, isOpen: false }));
    }, []);

    const handleConfirmAction = useCallback(async () => {
        try {
            await confirmation.action();
        } finally {
            closeConfirmation();
        }
    }, [confirmation, closeConfirmation]);

    const handleDelete = useCallback(
        (category: Category) => {
            setConfirmation({
                isOpen: true,
                title: 'Delete Category',
                message: `Are you sure you want to delete "${category.name}"? This will remove all associated cookie data.`,
                isDestructive: true,
                action: async () => {
                    try {
                        await deleteCategory(eventId, category.id);
                    } catch (err) {
                        console.error('Failed to delete category:', err);
                        setError('Failed to delete category. Please try again.');
                    }
                },
            });
        },
        [eventId, deleteCategory]
    );

    const handleReprocess = useCallback(
        (category: Category) => {
            setConfirmation({
                isOpen: true,
                title: 'Reprocess Category',
                message: `Are you sure you want to reprocess "${category.name}"? This will clear existing cookies and create new ones.`,
                isDestructive: true,
                action: async () => {
                    try {
                        await reprocessCategory(eventId, category.id);
                    } catch (err) {
                        console.error('Failed to reprocess category:', err);
                        setError('Failed to reprocess category. Please try again.');
                    }
                },
            });
        },
        [eventId]
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
                        <CategoryCardWithProcessing
                            key={category.id}
                            category={category}
                            onImageClick={() => onCategoryClick?.(category)}
                            onNameSave={(newName) => handleNameSave(category.id, newName)}
                            onDelete={() => handleDelete(category)}
                            onReprocess={() => handleReprocess(category)}
                            eventId={eventId}
                        />
                    ))}
                </div>
            ) : (
                !loading && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <span className="text-4xl mb-4">🍪</span>
                        <p className="mb-4">No categories yet. Add your first category below!</p>
                        <Button
                            variant="default"
                            onClick={() => document.getElementById('add-category-form')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            Create Category
                        </Button>
                    </div>
                )
            )}

            {/* Add Category Form */}
            <div id="add-category-form" className="border-t border-surface-tertiary pt-6">
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
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="process-with-vision-api"
                                    checked={processWithVisionAPI}
                                    onChange={(e) => setProcessWithVisionAPI(e.target.checked)}
                                    className="w-4 h-4 rounded border-surface-secondary bg-surface-tertiary text-primary-600 focus:ring-primary-500"
                                />
                                <label
                                    htmlFor="process-with-vision-api"
                                    className="text-sm text-gray-300 cursor-pointer"
                                >
                                    Process with Vision API
                                </label>
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

            <ConfirmationModal
                isOpen={confirmation.isOpen}
                title={confirmation.title}
                message={confirmation.message}
                onConfirm={handleConfirmAction}
                onCancel={closeConfirmation}
                isDestructive={confirmation.isDestructive}
            />
        </div >
    );
}
