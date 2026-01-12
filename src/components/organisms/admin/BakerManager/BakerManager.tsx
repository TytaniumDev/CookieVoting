import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useBakerStore } from '../../../../lib/stores/useBakerStore';
import { sanitizeInput } from '../../../../lib/validation';
import { cn } from '../../../../lib/cn';
import { bakerNameSchema, type BakerNameFormData } from '../../../../lib/schemas';

export interface BakerManagerProps {
    eventId: string;
}

export function BakerManager({ eventId }: BakerManagerProps) {
    const { bakers, fetchBakers, addBaker, removeBaker, loading } = useBakerStore();
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<BakerNameFormData>({
        resolver: zodResolver(bakerNameSchema),
        defaultValues: {
            name: '',
        },
    });

    // Fetch bakers on mount
    useEffect(() => {
        if (eventId) {
            fetchBakers(eventId);
        }
    }, [eventId, fetchBakers]);

    const onSubmit = useCallback(
        async (data: BakerNameFormData) => {
            const sanitizedName = sanitizeInput(data.name);

            // Check for duplicates
            if (bakers.some((b) => b.name.toLowerCase() === sanitizedName.toLowerCase())) {
                setError('Baker already exists');
                return;
            }

            setError(null);

            try {
                await addBaker(eventId, sanitizedName);
                reset();
            } catch (err) {
                console.error('Failed to add baker:', err);
                setError(err instanceof Error ? err.message : 'Failed to add baker');
            }
        },
        [eventId, bakers, addBaker, reset]
    );

    const handleRemoveBaker = useCallback(
        async (bakerId: string, bakerName: string) => {
            if (
                !window.confirm(
                    `Are you sure you want to remove "${bakerName}"? This will remove their cookie assignments.`
                )
            ) {
                return;
            }

            try {
                await removeBaker(eventId, bakerId);
            } catch (err) {
                console.error('Failed to remove baker:', err);
                setError('Failed to remove baker. Please try again.');
            }
        },
        [eventId, removeBaker]
    );

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-white">Bakers</h3>
                {bakers.length > 0 && (
                    <span className="px-2 py-0.5 bg-primary-600/30 text-primary-400 text-sm rounded-full">
                        {bakers.length}
                    </span>
                )}
            </div>

            {/* Add form */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
                <div className="flex-1">
                    <input
                        type="text"
                        {...register('name')}
                        placeholder="Baker name"
                        className="w-full px-4 py-2 bg-surface-tertiary border border-surface-tertiary focus:border-primary-500 focus:outline-none rounded-lg text-white placeholder-gray-500"
                        maxLength={50}
                        disabled={isSubmitting || loading}
                        aria-label="New baker name"
                    />
                    {errors.name && (
                        <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting || loading}
                    className={cn(
                        'px-4 py-2 rounded-lg font-medium transition-colors',
                        isSubmitting || loading
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-primary-600 hover:bg-primary-700 text-white'
                    )}
                >
                    {isSubmitting ? 'Adding...' : 'Add'}
                </button>
            </form>

            {/* Error */}
            {error && (
                <div className="text-red-400 text-sm" role="alert">
                    {error}
                </div>
            )}

            {/* Baker list */}
            {bakers.length > 0 ? (
                <div className="flex flex-wrap gap-2" role="list" aria-label="Bakers list">
                    {bakers.map((baker) => (
                        <div
                            key={baker.id}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-tertiary rounded-full text-gray-300"
                            role="listitem"
                        >
                            <span>{baker.name}</span>
                            <button
                                type="button"
                                onClick={() => handleRemoveBaker(baker.id, baker.name)}
                                className="w-5 h-5 flex items-center justify-center rounded-full bg-surface-secondary hover:bg-red-600/30 hover:text-red-400 transition-colors"
                                aria-label={`Remove ${baker.name}`}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                !loading && <p className="text-gray-500 text-sm">No bakers added yet</p>
            )}
        </div>
    );
}
