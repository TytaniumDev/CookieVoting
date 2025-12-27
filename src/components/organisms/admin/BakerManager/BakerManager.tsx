import { useState, useCallback, useEffect } from 'react';
import { useBakerStore } from '../../../../lib/stores/useBakerStore';
import { validateMakerName, sanitizeInput } from '../../../../lib/validation';
import { cn } from '../../../../lib/cn';

export interface BakerManagerProps {
    eventId: string;
}

export function BakerManager({ eventId }: BakerManagerProps) {
    const { bakers, fetchBakers, addBaker, removeBaker, loading } = useBakerStore();
    const [newBakerName, setNewBakerName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    // Fetch bakers on mount
    useEffect(() => {
        if (eventId) {
            fetchBakers(eventId);
        }
    }, [eventId, fetchBakers]);

    const handleAddBaker = useCallback(async () => {
        if (!newBakerName.trim() || isAdding) return;

        const validation = validateMakerName(newBakerName);
        if (!validation.valid) {
            setError(validation.error || 'Invalid baker name');
            return;
        }

        const sanitizedName = sanitizeInput(newBakerName);

        // Check for duplicates
        if (bakers.some((b) => b.name.toLowerCase() === sanitizedName.toLowerCase())) {
            setError('Baker already exists');
            return;
        }

        setIsAdding(true);
        setError(null);

        try {
            await addBaker(eventId, sanitizedName);
            setNewBakerName('');
        } catch (err) {
            console.error('Failed to add baker:', err);
            setError(err instanceof Error ? err.message : 'Failed to add baker');
        } finally {
            setIsAdding(false);
        }
    }, [eventId, newBakerName, bakers, addBaker, isAdding]);

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

    const handleKeyPress = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleAddBaker();
            }
        },
        [handleAddBaker]
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
            <div className="flex gap-2">
                <input
                    type="text"
                    value={newBakerName}
                    onChange={(e) => {
                        setNewBakerName(e.target.value);
                        setError(null);
                    }}
                    onKeyDown={handleKeyPress}
                    placeholder="Baker name"
                    className="flex-1 px-4 py-2 bg-surface-tertiary border border-surface-tertiary focus:border-primary-500 focus:outline-none rounded-lg text-white placeholder-gray-500"
                    maxLength={50}
                    disabled={isAdding || loading}
                    aria-label="New baker name"
                />
                <button
                    type="button"
                    onClick={handleAddBaker}
                    onMouseDown={(e) => e.preventDefault()}
                    disabled={!newBakerName.trim() || isAdding || loading}
                    className={cn(
                        'px-4 py-2 rounded-lg font-medium transition-colors',
                        !newBakerName.trim() || isAdding || loading
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-primary-600 hover:bg-primary-700 text-white'
                    )}
                >
                    {isAdding ? 'Adding...' : 'Add'}
                </button>
            </div>

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
