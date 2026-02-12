import { type Cookie } from '../../../../lib/types';
import { cn } from '../../../../lib/cn';

export interface CookieGridProps {
  cookies: Cookie[];
  selectedCookieId?: string;
  onSelectCookie: (cookieId: string) => void;
  className?: string;
}

/**
 * CookieGrid - Displays cookies in a responsive grid layout for voting.
 */
export function CookieGrid({
  cookies,
  selectedCookieId,
  onSelectCookie,
  className,
}: CookieGridProps) {
  return (
    <div className={cn('w-full h-full overflow-y-auto p-4', className)}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
        {cookies.map((cookie) => {
          const isSelected = selectedCookieId === cookie.id;
          return (
            <button
              key={cookie.id}
              type="button"
              onClick={() => onSelectCookie(cookie.id)}
              className={cn(
                'relative aspect-square rounded-lg overflow-hidden border-2 transition-all',
                isSelected
                  ? 'border-primary-500 ring-4 ring-primary-500/50 scale-105'
                  : 'border-surface-tertiary hover:border-primary-400 hover:scale-102',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
              )}
              aria-label={`Select cookie ${cookie.id}`}
            >
              <img
                src={cookie.imageUrl}
                alt={`Cookie ${cookie.id}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {isSelected && (
                <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center">
                  <span className="text-4xl">✨</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
