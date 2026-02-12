import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEventStore } from '../../lib/stores/useEventStore';
import { useAdminAuth } from '../../lib/hooks/useAdminAuth';
import { CookieTaggingGrid } from '../../components/organisms/admin/CookieTaggingGrid/CookieTaggingGrid';
import type { Cookie, Baker } from '../../lib/types';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function CookieAssignmentPage() {
  const { eventId = '', categoryId = '' } = useParams();
  const navigate = useNavigate();
  const { isLoading: authLoading } = useAdminAuth({
    redirectIfNotAuth: '/',
  });

  const { categories, fetchCategories, updateCategoryCookies } = useEventStore();
  const [bakers, setBakers] = useState<Baker[]>([]);
  const [loadingBakers, setLoadingBakers] = useState(true);

  // Get current category
  const category = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId],
  );

  // Fetch categories if needed
  useEffect(() => {
    if (!authLoading && eventId && categories.length === 0) {
      fetchCategories(eventId);
    }
  }, [authLoading, eventId, categories.length, fetchCategories]);

  // Fetch bakers
  useEffect(() => {
    if (!authLoading && eventId) {
      const fetchBakers = async () => {
        try {
          const q = query(collection(db, 'events', eventId, 'bakers'), orderBy('name', 'asc'));
          const snapshot = await getDocs(q);
          const bakersList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Baker);
          setBakers(bakersList);
        } catch (err) {
          console.error('Error fetching bakers:', err);
        } finally {
          setLoadingBakers(false);
        }
      };
      fetchBakers();
    }
  }, [authLoading, eventId]);

  const handleUpdateCookies = async (updatedCookies: Cookie[]) => {
    if (eventId && categoryId) {
      await updateCategoryCookies(eventId, categoryId, updatedCookies);
    }
  };

  if (authLoading || loadingBakers) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-gray-400">Loading...</div>
    );
  }

  if (!category) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl text-white font-semibold">Category not found</h2>
        <button
          onClick={() => navigate(`/admin/${eventId}/categories`)}
          className="mt-4 text-primary-400 hover:text-primary-300"
        >
          Back to Categories
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/admin/${eventId}/categories`)}
          className="p-2 hover:bg-surface-secondary rounded-lg text-gray-400 hover:text-white transition-colors"
          aria-label="Back to categories"
        >
          ←
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            {category.name}
            <span className="text-sm font-normal text-gray-400 px-2 py-0.5 bg-surface-tertiary rounded-full">
              {category.cookies.length} Cookies
            </span>
          </h2>
          <p className="text-gray-400 mt-1">Assign bakers to the detected cookies</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-surface rounded-xl p-6 border border-surface-tertiary">
        <CookieTaggingGrid
          cookies={category.cookies}
          bakers={bakers}
          onUpdateCookies={handleUpdateCookies}
        />
      </div>
    </div>
  );
}
