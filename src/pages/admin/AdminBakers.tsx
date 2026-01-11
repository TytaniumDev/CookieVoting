import { useParams } from 'react-router-dom';
import { BakerManager } from '../../components/organisms/admin';

/**
 * AdminBakers - Baker management page.
 */
export default function AdminBakers() {
    const { eventId = '' } = useParams();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white">Bakers</h2>
                <p className="text-gray-400 mt-1">Manage the bakers participating in this event</p>
            </div>
            <div className="bg-surface-secondary rounded-xl p-6 border border-surface-tertiary">
                <BakerManager eventId={eventId} />
            </div>
        </div>
    );
}
