import { useState } from 'react';
import { useDetectionJob } from '../../lib/hooks/useDetectionJob';
import { useAdmins } from '../../lib/hooks/useAdmins';
import { AlertModal } from '../../components/atoms/AlertModal/AlertModal';

/**
 * AdminSettings - Event settings page.
 * Contains Image Detection Audit link and auto-detection controls.
 */
export default function AdminSettings() {
    const { isAdmin } = useAdmins();
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<'success' | 'error' | 'info'>('info');

    // Use detection job hook
    const {
        isDetecting: detectingAll,
        progress: detectionProgress,
        currentJobId,
        startDetection,
        cancelDetection,
    } = useDetectionJob({
        enabled: isAdmin,
        onComplete: (result) => {
            if (result.errors > 0) {
                const message =
                    `Detection complete with errors!\n` +
                    `Total images: ${result.total}\n` +
                    `Processed: ${result.processed}\n` +
                    `Skipped (already detected): ${result.skipped}\n` +
                    `Errors: ${result.errors}`;
                setAlertMessage(message);
                setAlertType('error');
            } else {
                setAlertMessage(
                    `Detection complete!\n` +
                    `Processed: ${result.processed}\n` +
                    `Skipped (already detected): ${result.skipped}`
                );
                setAlertType('success');
            }
        },
        onError: (errorMsg) => {
            setAlertMessage(errorMsg);
            setAlertType('error');
        },
        onStatusChange: (msg) => {
            setAlertMessage(msg);
            setAlertType('info');
        },
    });

    const handleDetectAllImages = async () => {
        if (
            !window.confirm(
                'This will detect cookies in all images in shared storage. This may take a few minutes. Continue?',
            )
        ) {
            return;
        }
        await startDetection();
    };

    const handleCancelDetection = async () => {
        if (!currentJobId) return;

        if (
            !window.confirm(
                'Are you sure you want to cancel the detection job? It will stop processing after the current image.',
            )
        ) {
            return;
        }
        await cancelDetection();
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {alertMessage && (
                <AlertModal message={alertMessage} type={alertType} onClose={() => setAlertMessage(null)} />
            )}

            {/* Page header */}
            <div className="border-b border-surface-tertiary pb-4">
                <h2 className="text-3xl font-bold text-white">Settings</h2>
                <p className="text-gray-400 mt-1 text-lg">Manage event settings and detection controls</p>
            </div>

            {/* Image Detection Controls */}
            <div className="bg-surface rounded-xl p-6 border border-surface-tertiary">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
                    <span className="text-2xl">🔍</span>
                    Image Detection
                </h3>
                <p className="text-gray-400 mb-6">
                    Manage cookie detection across all stored images. The audit page shows detection status for each image.
                </p>

                {detectionProgress && (
                    <div
                        className="mb-4 px-4 py-3 rounded-lg text-sm"
                        style={{
                            background: 'rgba(76, 175, 80, 0.2)',
                            border: '1px solid rgba(76, 175, 80, 0.5)',
                            color: '#c8e6c9',
                        }}
                    >
                        {detectionProgress}
                    </div>
                )}

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => window.open('/admin/audit/detections', '_blank')}
                        className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                        style={{ background: 'rgba(33, 150, 243, 0.8)', color: 'white' }}
                    >
                        🔍 Image Detection Audit
                    </button>

                    {detectingAll && currentJobId && (
                        <button
                            onClick={handleCancelDetection}
                            className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                            style={{ background: 'rgba(244, 67, 54, 0.8)', color: 'white' }}
                        >
                            ⏹️ Stop Detection
                        </button>
                    )}

                    <button
                        onClick={handleDetectAllImages}
                        disabled={detectingAll}
                        className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                        style={{
                            background: detectingAll ? 'rgba(76, 175, 80, 0.5)' : 'rgba(76, 175, 80, 0.8)',
                            color: 'white',
                            cursor: detectingAll ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {detectingAll ? '🔄 Detecting...' : '🔍 Auto-detect All Images'}
                    </button>
                </div>
            </div>

            {/* Placeholder for future settings */}
            <div className="bg-surface rounded-xl p-6 border border-surface-tertiary">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
                    <span className="text-2xl">⚙️</span>
                    General Settings
                </h3>
                <p className="text-gray-400">
                    Additional event settings will be available here in a future update.
                </p>
            </div>
        </div>
    );
}
