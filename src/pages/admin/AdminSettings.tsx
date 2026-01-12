/**
 * AdminSettings - Event settings page.
 */
export default function AdminSettings() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Page header */}
            <div className="border-b border-surface-tertiary pb-4">
                <h2 className="text-3xl font-bold text-white">Settings</h2>
                <p className="text-gray-400 mt-1 text-lg">Manage event settings</p>
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
