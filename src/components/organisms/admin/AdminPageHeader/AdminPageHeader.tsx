import styles from './AdminPageHeader.module.css';

interface AdminPageHeaderProps {
    detectingAll: boolean;
    currentJobId: string | null;
    onAuditClick: () => void;
    onCancelDetection: () => void;
    onDetectAll: () => void;
}

export function AdminPageHeader({
    detectingAll,
    currentJobId,
    onAuditClick,
    onCancelDetection,
    onDetectAll,
}: AdminPageHeaderProps) {
    return (
        <div className={styles.headerContainer}>
            <h1 className={styles.title}>Create Voting Event</h1>
            <div className={styles.actions}>
                <button
                    onClick={onAuditClick}
                    className={styles.button}
                    style={{
                        background: 'rgba(33, 150, 243, 0.8)',
                    }}
                >
                    🔍 Image Detection Audit
                </button>
                {detectingAll && currentJobId && (
                    <button
                        onClick={onCancelDetection}
                        className={styles.button}
                        style={{
                            background: 'rgba(244, 67, 54, 0.8)',
                        }}
                    >
                        ⏹️ Stop Detection
                    </button>
                )}
                <button
                    onClick={onDetectAll}
                    disabled={detectingAll}
                    className={styles.button}
                    style={{
                        background: detectingAll ? 'rgba(76, 175, 80, 0.5)' : 'rgba(76, 175, 80, 0.8)',
                        cursor: detectingAll ? 'not-allowed' : 'pointer',
                    }}
                >
                    {detectingAll ? '🔄 Detecting...' : '🔍 Auto-detect All Images'}
                </button>
            </div>
        </div>
    );
}
