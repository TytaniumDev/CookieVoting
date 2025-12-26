
import type { VoteEvent } from '../../../../lib/types';
import styles from './AdminEventList.module.css';

export interface AdminEventListProps {
    events: VoteEvent[];
    eventImages: Record<string, string[]>;
    deletingId: string | null;
    onDeleteClick: (eventId: string, e: React.MouseEvent) => void;
    onResultClick: (eventId: string, e: React.MouseEvent) => void;
    onEventClick: (eventId: string) => void;
}

export function AdminEventList({
    events,
    eventImages,
    deletingId,
    onDeleteClick,
    onResultClick,
    onEventClick,
}: AdminEventListProps) {
    if (events.length === 0) {
        return <p>No events found.</p>;
    }

    return (
        <div className={styles.eventsGrid}>
            {events.map((event) => {
                const images = eventImages[event.id] || [];
                return (
                    <div
                        key={event.id}
                        className={`${styles.eventCard} ${deletingId === event.id ? styles.deletingItem : ''} `}
                        onClick={() => onEventClick(event.id)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onEventClick(event.id);
                            }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={`View event: ${event.name} `}
                    >
                        <div className={styles.eventHeader}>
                            <h3>{event.name}</h3>
                            <div className={styles.eventActions}>
                                <button
                                    onClick={(e) => onResultClick(event.id, e)}
                                    className={styles.resultsButton}
                                >
                                    See Results
                                </button>
                                <button
                                    onClick={(e) => onDeleteClick(event.id, e)}
                                    className={`${styles.deleteButton} ${deletingId === event.id ? styles.deleting : ''} `}
                                    disabled={deletingId === event.id}
                                >
                                    <span
                                        className={styles.buttonText}
                                        style={{ opacity: deletingId === event.id ? 0 : 1 }}
                                    >
                                        Delete
                                    </span>
                                    {deletingId === event.id && <span className={styles.spinner} />}
                                </button>
                            </div>
                        </div>
                        {images.length > 0 ? (
                            <div className={styles.imageCarousel}>
                                {images.map((imageUrl, index) => {
                                    // Create a stable key from URL hash
                                    const urlHash = imageUrl.split('/').pop() || imageUrl.slice(-30);
                                    return (
                                        <img
                                            key={`${event.id} -${urlHash} `}
                                            src={imageUrl}
                                            alt={`${event.name} - ${index + 1} `}
                                            className={styles.carouselImage}
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            <div className={styles.noImages}>No images yet</div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
