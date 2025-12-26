import { useState, useCallback, useEffect } from 'react';
import { useBakerStore } from '../../../../lib/stores/useBakerStore';
import { validateMakerName, sanitizeInput } from '../../../../lib/validation';
import styles from './BakerManager.module.css';

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
                    `Are you sure you want to remove "${bakerName}"? This will remove their cookie assignments.`,
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
        [eventId, removeBaker],
    );

    const handleKeyPress = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleAddBaker();
            }
        },
        [handleAddBaker],
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>Bakers</h3>
                {bakers.length > 0 && <span className={styles.count}>{bakers.length}</span>}
            </div>

            <div className={styles.addForm}>
                <input
                    type="text"
                    value={newBakerName}
                    onChange={(e) => {
                        setNewBakerName(e.target.value);
                        setError(null);
                    }}
                    onKeyDown={handleKeyPress}
                    placeholder="Baker name"
                    className={styles.input}
                    maxLength={50}
                    disabled={isAdding || loading}
                    aria-label="New baker name"
                />
                <button
                    type="button"
                    onClick={handleAddBaker}
                    onMouseDown={(e) => e.preventDefault()} // Prevent keyboard dismiss on mobile
                    disabled={!newBakerName.trim() || isAdding || loading}
                    className={styles.addButton}
                >
                    {isAdding ? 'Adding...' : 'Add'}
                </button>
            </div>

            {error && (
                <div className={styles.error} role="alert">
                    {error}
                </div>
            )}

            {bakers.length > 0 ? (
                <div className={styles.bakerList} role="list" aria-label="Bakers list">
                    {bakers.map((baker) => (
                        <div key={baker.id} className={styles.bakerChip} role="listitem">
                            <span className={styles.bakerName}>{baker.name}</span>
                            <button
                                type="button"
                                onClick={() => handleRemoveBaker(baker.id, baker.name)}
                                className={styles.removeButton}
                                aria-label={`Remove ${baker.name}`}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                !loading && <p className={styles.emptyState}>No bakers added yet</p>
            )}
        </div>
    );
}
