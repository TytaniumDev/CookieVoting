import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { type CookieCoordinate } from '../../../lib/types';
import { uploadImage } from '../../../lib/storage';
import { detectCookiesGemini } from '../../../lib/cookieDetectionGemini';
import { useEvent } from '../../../lib/hooks/useEvent';
import { useCategories } from '../../../lib/hooks/useCategories';
import { useBakers } from '../../../lib/hooks/useBakers';
import { useImageDetection } from '../../../lib/hooks/useImageDetection';
import { useEventSetupState, type SetupStep } from '../../../lib/hooks/useEventSetupState';
import { sortAndNumberCookies } from '../../../lib/cookieUtils';
import { ImageUploadStep, type UploadedImage } from './ImageUploadStep';
import { CategoryNamingStep } from './CategoryNamingStep';
import { BakerSetupStep } from './BakerSetupStep';
import { CookieTaggingStep } from './CookieTaggingStep';
import { type DetectedCookie } from '../CookieViewer/CookieViewer';
import styles from './EventSetupWizard.module.css';

interface Props {
    eventId: string;
    eventName: string;
    onComplete: () => void;
    onCancel: () => void;
    initialCategoryId?: string;
}

export function EventSetupWizard({ eventId, eventName, onComplete, onCancel, initialCategoryId }: Props) {
    const { loading: eventLoading } = useEvent(eventId);
    const { categories, add: addCategory, update: updateCategoryCookies, loading: categoriesLoading } = useCategories(eventId);
    const { bakers, add: addBaker, remove: removeBaker, loading: bakersLoading } = useBakers(eventId);

    const [images, setImages] = useState<UploadedImage[]>([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
    const [taggedCookies, setTaggedCookies] = useState<Record<string, Record<string, CookieCoordinate[]>>>({});
    const [categoryCompletion] = useState<Record<string, boolean>>({});
    const [detecting, setDetecting] = useState(false);

    const initialStep: SetupStep = initialCategoryId ? 'tagging' : (categories.length > 0 ? (bakers.length > 0 ? 'tagging' : 'bakers') : 'upload');

    const { step, setStep } = useEventSetupState(
        initialStep,
        initialCategoryId || null
    );

    const currentCategory = categories[currentCategoryIndex];
    const { detectedCookies, loading: loadingDetection } = useImageDetection(currentCategory?.imageUrl || null);

    // Load existing data into taggedCookies
    useEffect(() => {
        if (categories.length > 0) {
            const existingTagged: Record<string, Record<string, CookieCoordinate[]>> = {};
            categories.forEach(cat => {
                existingTagged[cat.id] = {};
                cat.cookies.forEach(cookie => {
                    const baker = bakers.find(b => b.name === cookie.makerName);
                    if (baker) {
                        if (!existingTagged[cat.id][baker.id]) {
                            existingTagged[cat.id][baker.id] = [];
                        }
                        existingTagged[cat.id][baker.id].push(cookie);
                    }
                });
            });
            setTaggedCookies(existingTagged);

            // Load categories into images for naming step
            const categoryImages: UploadedImage[] = categories.map(cat => ({
                file: {} as File,
                preview: cat.imageUrl,
                uploaded: true,
                imageUrl: cat.imageUrl,
                categoryName: cat.name
            }));
            setImages(categoryImages);
        }
    }, [categories, bakers]);

    // Set initial category index if initialCategoryId is provided
    useEffect(() => {
        if (initialCategoryId && categories.length > 0) {
            const idx = categories.findIndex(c => c.id === initialCategoryId);
            if (idx !== -1) setCurrentCategoryIndex(idx);
        }
    }, [initialCategoryId, categories]);

    const handleFilesSelect = (newFiles: UploadedImage[]) => {
        setImages([...images, ...newFiles]);
    };

    const handleRemoveImage = (index: number) => {
        const newImages = [...images];
        URL.revokeObjectURL(newImages[index].preview);
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
                const url = await uploadImage(img.file, 'shared/cookies');
                uploaded.push({ ...img, uploaded: true, imageUrl: url });
            }
            setImages(uploaded);
            setStep('categories');
        } catch {
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
                    await addCategory(img.categoryName, img.imageUrl);
                }
            }
            setStep('bakers');
        } catch {
            setError('Failed to create categories');
        } finally {
            setUploading(false);
        }
    };

    const handleAddBaker = async (name: string) => {
        await addBaker(name);
    };

    const handleRemoveBaker = async (id: string) => {
        await removeBaker(id);
    };

    const handleCookieTag = async (cookie: DetectedCookie, bakerId: string) => {
        if (!currentCategory) return;
        const baker = bakers.find(b => b.id === bakerId);
        if (!baker) return;

        const newCookie: CookieCoordinate = {
            id: uuidv4(),
            number: 0,
            makerName: baker.name,
            x: cookie.x,
            y: cookie.y,
            detectedCookieId: cookie.id
        };

        const updatedTagged = { ...taggedCookies };
        if (!updatedTagged[currentCategory.id]) updatedTagged[currentCategory.id] = {};
        if (!updatedTagged[currentCategory.id][bakerId]) updatedTagged[currentCategory.id][bakerId] = [];
        updatedTagged[currentCategory.id][bakerId].push(newCookie);

        // Autosave
        const allCookies = Object.values(updatedTagged[currentCategory.id]).flat();
        const sorted = sortAndNumberCookies(allCookies);
        await updateCategoryCookies(currentCategory.id, { cookies: sorted });
        setTaggedCookies(updatedTagged);
    };

    const handleCookieRemove = async (cookie: CookieCoordinate) => {
        if (!currentCategory) return;
        const updatedTagged = { ...taggedCookies };
        const catTagged = updatedTagged[currentCategory.id];
        if (!catTagged) return;

        Object.keys(catTagged).forEach(bakerId => {
            catTagged[bakerId] = catTagged[bakerId].filter(c => c.id !== cookie.id);
        });

        const allCookies = Object.values(catTagged).flat();
        const sorted = sortAndNumberCookies(allCookies);
        await updateCategoryCookies(currentCategory.id, { cookies: sorted });
        setTaggedCookies(updatedTagged);
    };

    const handleAutoDetect = async () => {
        if (!currentCategory || bakers.length === 0) return;
        setDetecting(true);
        try {
            const detected = await detectCookiesGemini(currentCategory.imageUrl);
            const defaultBaker = bakers[0];
            const newCookies: CookieCoordinate[] = detected.map(d => ({
                id: uuidv4(),
                number: 0,
                makerName: defaultBaker.name,
                x: d.x,
                y: d.y,
                detectedCookieId: d.id || `detected_${uuidv4()}`
            }));

            const updatedTagged = { ...taggedCookies };
            if (!updatedTagged[currentCategory.id]) updatedTagged[currentCategory.id] = {};
            updatedTagged[currentCategory.id][defaultBaker.id] = [...(updatedTagged[currentCategory.id][defaultBaker.id] || []), ...newCookies];

            const allCookies = Object.values(updatedTagged[currentCategory.id]).flat();
            const sorted = sortAndNumberCookies(allCookies);
            await updateCategoryCookies(currentCategory.id, { cookies: sorted });
            setTaggedCookies(updatedTagged);
        } catch {
            setError('Auto-detection failed');
        } finally {
            setDetecting(false);
        }
    };

    if (eventLoading || categoriesLoading || bakersLoading) {
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
                        onAddBaker={handleAddBaker}
                        onRemoveBaker={handleRemoveBaker}
                        onBack={() => setStep('categories')}
                        onNext={() => setStep('tagging')}
                        hasExistingCategories={categories.length > 0}
                        error={error}
                    />
                )}
                {step === 'tagging' && currentCategory && (
                    <CookieTaggingStep
                        currentCategory={currentCategory}
                        categories={categories}
                        currentCategoryIndex={currentCategoryIndex}
                        onCategoryChange={setCurrentCategoryIndex}
                        bakers={bakers}
                        currentBaker={bakers[0] || null}
                        taggedCookies={taggedCookies}
                        detectedCookies={detectedCookies}
                        loadingDetection={loadingDetection}
                        onCookieTag={handleCookieTag}
                        onCookieRemove={handleCookieRemove}
                        onAutoDetect={handleAutoDetect}
                        onComplete={onComplete}
                        categoryCompletion={categoryCompletion}
                        error={error}
                        detecting={detecting}
                    />
                )}
            </div>
        </div>
    );
}
