import { useState, useCallback } from 'react';
import { useEventStore } from '../../../../lib/stores/useEventStore';
import styles from './VotingControls.module.css';

export interface VotingControlsProps {
    eventId: string;
}

export function VotingControls({ eventId }: VotingControlsProps) {
    const { activeEvent, updateEventStatus } = useEventStore();
    const [copiedLink, setCopiedLink] = useState<'vote' | 'results' | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const isVotingOpen = activeEvent?.status === 'voting';

    const handleCopyLink = useCallback(
        async (type: 'vote' | 'results') => {
            const baseUrl = window.location.origin;
            const path = type === 'vote' ? `/vote/${eventId}` : `/results/${eventId}`;
            const url = `${baseUrl}${path}`;

            try {
                await navigator.clipboard.writeText(url);
                setCopiedLink(type);
                setTimeout(() => setCopiedLink(null), 2000);
            } catch (error) {
                console.error('Failed to copy link:', error);
            }
        },
        [eventId],
    );

    const handleToggleVoting = useCallback(async () => {
        if (!activeEvent || isUpdating) return;

        setIsUpdating(true);
        try {
            const newStatus = isVotingOpen ? 'completed' : 'voting';
            await updateEventStatus(eventId, newStatus);
        } catch (error) {
            console.error('Failed to update voting status:', error);
        } finally {
            setIsUpdating(false);
        }
    }, [activeEvent, isVotingOpen, eventId, updateEventStatus, isUpdating]);

    if (!activeEvent) {
        return null;
    }

    return (
        <div className={styles.container}>
            <div className={styles.statusRow}>
                <span
                    className={`${styles.statusDot} ${isVotingOpen ? styles.open : styles.closed}`}
                    aria-hidden="true"
                />
                <span>Voting: {isVotingOpen ? 'Open' : 'Closed'}</span>
            </div>

            <div className={styles.buttonRow}>
                <button
                    type="button"
                    className={styles.button}
                    onClick={() => handleCopyLink('vote')}
                    aria-label="Copy voting link"
                    style={{ position: 'relative' }}
                >
                    <span className={styles.icon}>📋</span>
                    Vote Link
                    {copiedLink === 'vote' && <span className={styles.tooltip}>Copied!</span>}
                </button>

                <button
                    type="button"
                    className={styles.button}
                    onClick={() => handleCopyLink('results')}
                    aria-label="Copy results link"
                    style={{ position: 'relative' }}
                >
                    <span className={styles.icon}>📋</span>
                    Results Link
                    {copiedLink === 'results' && <span className={styles.tooltip}>Copied!</span>}
                </button>

                <button
                    type="button"
                    className={`${styles.button} ${isVotingOpen ? styles.buttonDanger : styles.buttonPrimary}`}
                    onClick={handleToggleVoting}
                    disabled={isUpdating}
                    aria-label={isVotingOpen ? 'Close voting' : 'Open voting'}
                >
                    {isUpdating ? 'Updating...' : isVotingOpen ? 'Close Voting' : 'Open Voting'}
                </button>
            </div>
        </div>
    );
}
