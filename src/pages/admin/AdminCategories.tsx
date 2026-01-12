import { useParams, useNavigate } from 'react-router-dom';
import { CategoryManager } from '../../components/organisms/admin';

/**
 * AdminCategories - Category management page.
 */
export default function AdminCategories() {
    const { eventId = '' } = useParams();
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white">Categories</h2>
                <p className="text-gray-400 mt-1">Manage cookie categories and their images</p>
            </div>
            <div className="bg-surface-secondary rounded-xl p-6 border border-surface-tertiary">
                <CategoryManager
                    eventId={eventId}
                    onCategoryClick={(category) => navigate(`/admin/${eventId}/categories/${category.id}/assign`)}
                />
            </div>
        </div>
    );
}
