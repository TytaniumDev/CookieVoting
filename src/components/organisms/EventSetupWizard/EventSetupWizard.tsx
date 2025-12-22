import React, { useState, useEffect } from 'react';
import { useEventStore } from '../../../lib/stores/useEventStore';
import { useBakerStore } from '../../../lib/stores/useBakerStore';
import { useImageStore } from '../../../lib/stores/useImageStore';
import { useCookieStore } from '../../../lib/stores/useCookieStore';
import { useEventSetupState, type SetupStep } from '../../../lib/hooks/useEventSetupState';
import { ImageUploadStep, type UploadedImage } from './ImageUploadStep';
import { CategoryNamingStep } from './CategoryNamingStep';
import { BakerSetupStep } from './BakerSetupStep';
import { CookieTaggingStep } from './CookieTaggingStep';
import styles from './EventSetupWizard.module.css';

interface Props {
    eventId: string;
    eventName: string;
    onComplete: () => void;
    onCancel: () => void;
    initialCategoryId?: string;
}

export function EventSetupWizard({ eventId, eventName, onComplete, onCancel, initialCategoryId }: Props) {
    // Stores
    const { categories, fetchCategories, addCategory, loading: categoriesLoading } = useEventStore();
    const { bakers, fetchBakers, addBaker, removeBaker, loading: bakersLoading } = useBakerStore();
    const { uploadImage, fetchImagesForEvent } = useImageStore();
    const { fetchCookies } = useCookieStore();

    // Local State
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);

    // Initial Data Fetch
    // Data is initialized by parent AdminDashboard


    // Setup Logic
    const initialStep: SetupStep = initialCategoryId ? 'tagging' : (categories.length > 0 ? (bakers.length > 0 ? 'tagging' : 'bakers') : 'upload');
    const { step, setStep } = useEventSetupState(initialStep, initialCategoryId || null);

    // Derived State
    const currentCategory = categories[currentCategoryIndex];

    // Sync categories to local 'images' state for the naming step
    useEffect(() => {
        if (categories.length > 0) {
            const categoryImages: UploadedImage[] = categories.map(cat => ({
                file: {} as File, // Dummy file
                preview: cat.imageUrl,
                uploaded: true,
                imageUrl: cat.imageUrl,
                categoryName: cat.name
            }));
            setImages(categoryImages);

            // Sync index if needed
            if (initialCategoryId) {
                const idx = categories.findIndex(c => c.id === initialCategoryId);
                if (idx !== -1) setCurrentCategoryIndex(idx);
            }
        }
    }, [categories, initialCategoryId]);

    // Handlers
    const handleFilesSelect = (newFiles: UploadedImage[]) => {
        setImages([...images, ...newFiles]);
    };

    const handleRemoveImage = (index: number) => {
        const newImages = [...images];
        if (!newImages[index].uploaded) {
            URL.revokeObjectURL(newImages[index].preview);
        }
        newImages.splice(index, 1);
        setImages(newImages);
    };

    const handleUploadImages = async () => {
        if (images.length === 0) return;
        setUploading(true);
        setError(null);
        try {
            const uploaded: UploadedImage[] = [];
            for (const img of images) {
                if (img.uploaded) {
                    uploaded.push(img);
                    continue;
                }
                const imageEntity = await uploadImage(img.file, eventId);
                uploaded.push({ ...img, uploaded: true, imageUrl: imageEntity.url });
            }
            setImages(uploaded);
            setStep('categories');
        } catch (e) {
            console.error(e);
            setError('Failed to upload images');
        } finally {
            setUploading(false);
        }
    };

    const handleCategoryNameChange = (index: number, name: string) => {
        const newImages = [...images];
        newImages[index].categoryName = name;
        setImages(newImages);
    };

    const handleCreateCategories = async () => {
        setUploading(true);
        setError(null);
        try {
            const imagesToCreate = images.filter(img => img.uploaded && img.categoryName?.trim() && !categories.some(c => c.imageUrl === img.imageUrl));
            for (const img of imagesToCreate) {
                if (img.categoryName && img.imageUrl) {
                    await addCategory(eventId, img.categoryName, img.imageUrl);
                }
            }
            setStep('bakers');
        } catch {
            setError('Failed to create categories');
        } finally {
            setUploading(false);
        }
    };

    if (categoriesLoading || bakersLoading) {
        return <div className={styles.loading}>Loading Wizard...</div>;
    }

    return (
        <div className={styles.wizard}>
            <div className={styles.header}>
                <h1>Edit Event: {eventName}</h1>
                <div className={styles.steps}>
                    {(['upload', 'categories', 'bakers', 'tagging'] as SetupStep[]).map((s, idx) => (
                        <button
                            key={s}
                            className={`${styles.step} ${step === s ? styles.active : ''}`}
                            onClick={() => categories.length > 0 && setStep(s)}
                        >
                            <span className={styles.stepNumber}>{idx + 1}</span>
                            <span className={styles.stepLabel}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.content}>
                {step === 'upload' && (
                    <ImageUploadStep
                        images={images}
                        uploading={uploading}
                        onFilesSelect={handleFilesSelect}
                        onRemoveImage={handleRemoveImage}
                        onUpload={handleUploadImages}
                        onCancel={onCancel}
                        onNext={() => setStep('categories')}
                        hasExistingCategories={categories.length > 0}
                        error={error}
                    />
                )}
                {step === 'categories' && (
                    <CategoryNamingStep
                        images={images}
                        uploading={uploading}
                        onNameChange={handleCategoryNameChange}
                        onCreateCategories={handleCreateCategories}
                        onBack={() => setStep('upload')}
                        onNext={() => setStep('bakers')}
                        hasExistingCategories={categories.length > 0}
                        error={error}
                    />
                )}
                {step === 'bakers' && (
                    <BakerSetupStep
                        bakers={bakers}
                        onAddBaker={(name) => addBaker(eventId, name)}
                        onRemoveBaker={(id) => removeBaker(eventId, id)}
                        onBack={() => setStep('categories')}
                        onNext={() => setStep('tagging')}
                        hasExistingCategories={categories.length > 0}
                        error={error}
                    />
                )}
                {step === 'tagging' && currentCategory && (
                    <CookieTaggingStep
                        eventId={eventId}
                        currentCategory={currentCategory}
                        categories={categories}
                        currentCategoryIndex={currentCategoryIndex}
                        onCategoryChange={setCurrentCategoryIndex}
                        onComplete={onComplete}
                        // Bakers passed for selecting
                        bakers={bakers}
                    />
                )}
            </div>
        </div>
    );
}
