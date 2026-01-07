import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CookieCropperPage } from '../../components/organisms/admin';
import { useImageStore } from '../../lib/stores/useImageStore';
import { useEventStore } from '../../lib/stores/useEventStore';
import { AlertModal } from '../../components/atoms/AlertModal/AlertModal';

/**
 * AdminCropper - Cookie cropping tool page.
 * 
 * Supports both general upload and category-specific cropping when categoryId is provided.
 * When a categoryId is present, the cropped cookies are linked to that category
 * and users are navigated to the cropped cookie tagging page after saving.
 */
export default function AdminCropper() {
    const { eventId = '', categoryId } = useParams();
    const navigate = useNavigate();
    const { uploadImage } = useImageStore();
    const { categories } = useEventStore();
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Find the category if categoryId is provided
    const category = categoryId ? categories.find((c) => c.id === categoryId) : null;

    const handleSave = async (data: { blob: Blob; region: { x: number; y: number; width: number; height: number } }[]) => {
        if (saving || data.length === 0) return;

        // Require category for cropping individual cookies
        if (!category) {
            setAlert({
                message: 'Please select a category before cropping cookies.',
                type: 'error',
            });
            return;
        }

        setSaving(true);
        try {
            // Upload all blobs in parallel with proper metadata
            const uploadPromises = data.map(({ blob, region }, index) => {
                const file = new File([blob], `cropped_cookie_${Date.now()}_${index}.png`, {
                    type: 'image/png',
                });
                return uploadImage(file, eventId, {
                    type: 'cropped_cookie',
                    categoryId: category.id,
                    sourceTrayImageUrl: category.imageUrl,
                    cropRegion: region,
                });
            });

            await Promise.all(uploadPromises);

            setAlert({
                message: `Successfully saved ${data.length} cookie images!`,
                type: 'success',
            });

            // Navigate to cropped cookie tagging page after short delay
            setTimeout(() => {
                navigate(`/admin/${eventId}/cropped-tagging`);
            }, 1500);

        } catch (error) {
            console.error('Failed to save cookies:', error);
            setAlert({
                message: 'Failed to save cookie images. Please try again.',
                type: 'error',
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            {alert && (
                <AlertModal
                    message={alert.message}
                    type={alert.type}
                    onClose={() => setAlert(null)}
                />
            )}

            <CookieCropperPage
                onSave={handleSave}
                onCancel={() => navigate(`/admin/${eventId}/categories`)}
                initialImageUrl={category?.imageUrl}
                categoryName={category?.name}
                eventId={eventId}
                categoryId={categoryId}
            />

            {saving && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-surface p-6 rounded-xl border border-surface-tertiary shadow-xl text-center">
                        <div className="animate-spin text-4xl mb-4">🍪</div>
                        <p className="text-white text-lg">Saving cookies...</p>
                    </div>
                </div>
            )}
        </>
    );
}
