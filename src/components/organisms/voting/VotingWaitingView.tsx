import { useState, useEffect, useMemo } from 'react';
import { Snowman } from '../../molecules/Snowman/Snowman';
import styles from './VotingWaitingView.module.css';

interface VotingWaitingViewProps {
    resultsAvailableTime?: number | null; // Timestamp
    onViewResults: () => void;
}



export const VotingWaitingView = ({ resultsAvailableTime, onViewResults }: VotingWaitingViewProps) => {
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isReady, setIsReady] = useState(false);
    const [showWarning, setShowWarning] = useState(false);

    useEffect(() => {
        if (!resultsAvailableTime) {
            setTimeLeft('Waiting for admin to set release time...');
            return;
        }

        const updateTimer = () => {
            const now = Date.now();
            const diff = resultsAvailableTime - now;

            if (diff <= 0) {
                setIsReady(true);
                setTimeLeft('Results are ready!');
            } else {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [resultsAvailableTime]);

    // Generate random snowflakes
    const snowflakes = useMemo(() => {
        const chars = ['❅', '❆', '❄'];
        return Array.from({ length: 50 }).map((_, i) => ({
            id: i,
            char: chars[Math.floor(Math.random() * chars.length)],
            style: {
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${5 + Math.random() * 10}s`,
                fontSize: `${0.5 + Math.random() * 1.5}rem`,
                opacity: 0.4 + Math.random() * 0.6
            }
        }));
    }, []);

    const handleViewClick = () => {
        setShowWarning(true);
    };

    const confirmViewResults = () => {
        setShowWarning(false);
        onViewResults();
    };

    return (
        <div className={styles.container}>
            {/* Snowflakes */}
            {snowflakes.map(flake => (
                <div
                    key={flake.id}
                    className={styles.snowflake}
                    style={flake.style}
                    aria-hidden="true"
                >
                    {flake.char}
                </div>
            ))}

            <div className={styles.content}>
                <h1 className={styles.title}>Thank You For Voting!</h1>
                <p className={styles.subtitle}>The bakers appreciate your taste buds.</p>

                {!isReady && (
                    <div className={styles.timerCard}>
                        <h2 className={styles.timerTitle}>Results Reveal In:</h2>
                        <div className={styles.timer}>{timeLeft}</div>
                    </div>
                )}

                {isReady && (
                    <div style={{ marginTop: '2rem' }}>
                        <button onClick={handleViewClick} className={styles.resultsButton}>
                            View Results 🏆
                        </button>
                    </div>
                )}
            </div>

            {/* Snowman Decoration */}
            <div className={styles.snowmanWrapper}>
                <Snowman />
            </div>

            {/* Snow Mounds */}
            <div className={styles.moundsContainer} aria-hidden="true">
                <div className={`${styles.snowMound} ${styles.mound1}`} />
                <div className={`${styles.snowMound} ${styles.mound2}`} />
                <div className={`${styles.snowMound} ${styles.mound3}`} />
            </div>

            {/* Confirmation Modal */}
            {showWarning && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3 className={styles.modalTitle}>Caution!</h3>
                        <p>Once you view the results, you will <strong>no longer be able to change your votes</strong>.</p>
                        <div className={styles.modalActions}>
                            <button onClick={() => setShowWarning(false)} className={styles.cancelButton}>
                                Go Back
                            </button>
                            <button onClick={confirmViewResults} className={styles.confirmButton}>
                                Reveal Results
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
