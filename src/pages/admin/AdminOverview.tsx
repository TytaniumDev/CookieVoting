import { useParams } from 'react-router-dom';
import { useEventStore } from '../../lib/stores/useEventStore';
import { VotingControls, ResultsTimeManager } from '../../components/organisms/admin';

/**
 * AdminOverview - Dashboard overview page for admin.
 */
export default function AdminOverview() {
    const { eventId = '' } = useParams();
    const { activeEvent: event } = useEventStore();

    if (!event) return null;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Page header */}
            <div className="border-b border-surface-tertiary pb-4">
                <h2 className="text-3xl font-bold text-white">Dashboard</h2>
                <p className="text-gray-400 mt-1 text-lg">Manage your event settings and controls</p>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Voting Controls Card */}
                <div className="bg-surface rounded-xl p-6 border border-surface-tertiary shadow-lg hover:border-primary-600/50 transition-colors">
                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                        <span className="text-2xl">🗳️</span>
                        Voting Controls
                    </h3>
                    <VotingControls eventId={eventId} />
                </div>

                {/* Results Time Card */}
                <div className="bg-surface rounded-xl p-6 border border-surface-tertiary shadow-lg hover:border-primary-600/50 transition-colors">
                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                        <span className="text-2xl">📅</span>
                        Results Reveal Time
                    </h3>
                    <ResultsTimeManager eventId={eventId} />
                </div>

                {/* Event Info Card */}
                <div className="bg-surface rounded-xl p-6 border border-surface-tertiary shadow-lg lg:col-span-2">
                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                        <span className="text-2xl">ℹ️</span>
                        Event Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex justify-between items-center p-4 bg-surface-secondary rounded-lg border border-surface-tertiary">
                            <span className="text-gray-400 font-medium">Status</span>
                            <span
                                className={
                                    event.status === 'voting'
                                        ? 'text-green-400 font-semibold flex items-center gap-2'
                                        : 'text-red-400 font-semibold flex items-center gap-2'
                                }
                            >
                                <span className={`w-2.5 h-2.5 rounded-full ${event.status === 'voting' ? 'bg-green-500' : 'bg-red-500'}`} />
                                {event.status === 'voting' ? 'Voting Open' : 'Voting Closed'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-surface-secondary rounded-lg border border-surface-tertiary">
                            <span className="text-gray-400 font-medium">Event ID</span>
                            <span className="text-gray-300 font-mono text-sm bg-background px-3 py-1 rounded-md">{eventId}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
