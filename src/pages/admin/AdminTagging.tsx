import { useParams } from 'react-router-dom';
import { CategoryTaggingNavigator } from '../../components/organisms/admin';

/**
 * AdminTagging - Cookie tagging page.
 */
export default function AdminTagging() {
    const { eventId = '' } = useParams();

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Tag Cookies</h2>
            <div className="bg-surface-secondary rounded-xl border border-surface-tertiary overflow-hidden h-[600px] flex flex-col">
                <CategoryTaggingNavigator eventId={eventId} />
            </div>
        </div>
    );
}
