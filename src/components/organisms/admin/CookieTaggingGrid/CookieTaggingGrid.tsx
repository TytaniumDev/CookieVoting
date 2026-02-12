import { useCallback } from 'react';
import { CroppedCookieCard } from '../../../molecules/CroppedCookieCard/CroppedCookieCard';
import type { Cookie, Baker } from '../../../../lib/types';

interface CookieTaggingGridProps {
  cookies: Cookie[];
  bakers: Baker[];
  onUpdateCookies: (cookies: Cookie[]) => void;
}

export function CookieTaggingGrid({ cookies, bakers, onUpdateCookies }: CookieTaggingGridProps) {
  const handleAssignBaker = useCallback(
    (cookieId: string, bakerId: string) => {
      const updatedCookies = cookies.map((cookie) => {
        if (cookie.id === cookieId) {
          return { ...cookie, bakerId };
        }
        return cookie;
      });
      onUpdateCookies(updatedCookies);
    },
    [cookies, onUpdateCookies],
  );

  const handleRemoveAssignment = useCallback(
    (cookieId: string) => {
      const updatedCookies = cookies.map((cookie) => {
        if (cookie.id === cookieId) {
          // Return cookie without bakerId
          return { ...cookie, bakerId: undefined };
        }
        return cookie;
      });
      onUpdateCookies(updatedCookies);
    },
    [cookies, onUpdateCookies],
  );

  return (
    <div className="space-y-4">
      {/* Grid */}
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
        {cookies.map((cookie) => (
          <CroppedCookieCard
            key={cookie.id}
            imageUrl={cookie.imageUrl}
            assignedBakerId={cookie.bakerId}
            bakers={bakers}
            onAssign={(bakerId) => handleAssignBaker(cookie.id, bakerId)}
            onRemove={() => handleRemoveAssignment(cookie.id)}
          />
        ))}
      </div>

      {cookies.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-surface-secondary rounded-xl border border-dashed border-surface-tertiary">
          <p>No cropped cookies found in this category.</p>
        </div>
      )}
    </div>
  );
}
