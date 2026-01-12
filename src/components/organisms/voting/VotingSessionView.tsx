import { useState } from 'react';
import type { Category } from '../../../lib/types';
import { CookieViewer } from '../CookieViewer/CookieViewer';
import type { DetectedCookie } from '../../../lib/types';
import { cn } from '../../../lib/cn';

interface VotingSessionViewProps {
  categories: Category[];
  votes: Record<string, number>; // categoryId -> cookieNumber
  onVote: (categoryId: string, cookieNumber: number) => void;
  onComplete: () => void;
}

// Internal component for a single category slide
const CategorySlide = ({
  category,
  index,
  total,
  currentVote,
  onVote,
  onNext,
  isLast,
  className,
}: {
  category: Category;
  index: number;
  total: number;
  currentVote?: number;
  onVote: (catId: string, cookieNum: number) => void;
  onNext: () => void;
  isLast: boolean;
  className?: string;
}) => {
  // Map cookies to detectedCookies format for CookieViewer
  const detectedCookies: DetectedCookie[] = category.cookies.map((cookie) => {
    if (cookie.detection) {
      return cookie.detection;
    }
    // Fallback if no specific detection data (using legacy x,y)
    return {
      x: cookie.x,
      y: cookie.y,
      width: 15,
      height: 15,
      confidence: 1.0,
      // Create a simple box polygon or circle for legacy points
    };
  });

  const cookieNumbers = category.cookies.map((c) => c.number);

  const getAnimationStyle = () => {
    if (!className) return {};
    if (className.includes('exitNext')) {
      return { animation: 'zoomOutUp 0.8s cubic-bezier(0.7, 0, 0.3, 1) forwards' };
    }
    if (className.includes('enterNext')) {
      return { animation: 'slideInUpExpand 0.8s cubic-bezier(0.7, 0, 0.3, 1) forwards' };
    }
    if (className.includes('exitPrev')) {
      return { animation: 'zoomOutDown 0.8s cubic-bezier(0.7, 0, 0.3, 1) forwards' };
    }
    if (className.includes('enterPrev')) {
      return { animation: 'slideInDownExpand 0.8s cubic-bezier(0.7, 0, 0.3, 1) forwards' };
    }
    return {};
  };

  return (
    <div
      className={cn(
        'absolute inset-0 w-full h-full flex flex-col bg-black will-change-[transform,opacity]',
        className?.includes('exitNext') || className?.includes('enterPrev') ? 'z-[1]' : '',
        className?.includes('enterNext') || className?.includes('enterPrev') ? 'z-[2]' : ''
      )}
      style={getAnimationStyle()}
    >
      {/* Header */}
      <div className="p-4 pt-14 bg-black z-10 text-center">
        <h2 className="text-2xl m-0 font-bold uppercase tracking-wide">{category.name}</h2>
        <div className="text-sm text-[#94a3b8] mt-1">
          Category {index + 1} of {total}
        </div>
      </div>

      {/* CookieViewer replaced manual image/buttons */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black overflow-hidden z-0">
        <CookieViewer
          imageUrl={category.imageUrl}
          detectedCookies={detectedCookies}
          cookieNumbers={cookieNumbers}
          selectedCookieNumber={currentVote}
          onSelectCookie={(num) => onVote(category.id, num)}
          className="w-full h-full"
          // Custom render for the number/sparkle to match previous design
          renderCenter={({ index }) => {
            const cookie = category.cookies[index];
            const isSelected = currentVote === cookie.number;

            return (
              <>
                {isSelected && (
                  <span
                    className="absolute -top-6 -right-4 text-3xl animate-[bounce_1s_infinite_alternate] z-[50] drop-shadow-[0_0_5px_gold]"
                    style={{
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'none',
                    }}
                  >
                    ✨
                  </span>
                )}
              </>
            );
          }}
        />
      </div>

      {/* Next Button inside slide so it animates with it */}
      <div
        className={cn(
          'fixed bottom-0 left-0 w-full p-6 bg-black flex justify-center z-20 transition-transform duration-300 ease-out',
          currentVote ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <button
          onClick={onNext}
          className="bg-[#22c55e] text-white border-none text-xl font-bold px-12 py-4 rounded-[50px] shadow-[0_4px_12px_rgba(34,197,94,0.4)] cursor-pointer transition-transform active:scale-95"
        >
          {isLast ? 'Finish Voting' : 'Next Category'}
        </button>
      </div>
    </div>
  );
};

export const VotingSessionView = ({
  categories: allCategories,
  votes,
  onVote,
  onComplete,
}: VotingSessionViewProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Animation State
  const [animatingState, setAnimatingState] = useState<{
    from: number;
    to: number;
    direction: 'next' | 'prev';
  } | null>(null);

  const handleNext = () => {
    if (currentIndex < allCategories.length - 1) {
      // Trigger animation to next
      setAnimatingState({
        from: currentIndex,
        to: currentIndex + 1,
        direction: 'next',
      });

      // Wait for animation to finish then update index
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setAnimatingState(null);
      }, 800); // Match CSS duration
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setAnimatingState({
        from: currentIndex,
        to: currentIndex - 1,
        direction: 'prev',
      });

      setTimeout(() => {
        setCurrentIndex((prev) => prev - 1);
        setAnimatingState(null);
      }, 800);
    }
  };

  // If animating, we render both slides.
  // If not, just one.

  const renderSlide = (index: number, animationClass?: string) => {
    const cat = allCategories[index];
    if (!cat) return null;
    return (
      <CategorySlide
        key={cat.id} // Key is important for React reconciliation if we were using it for diffing, but here we explicitly control rendering
        category={cat}
        index={index}
        total={allCategories.length}
        currentVote={votes[cat.id]}
        onVote={onVote}
        onNext={handleNext}
        isLast={index === allCategories.length - 1}
        className={animationClass}
      />
    );
  };

  return (
    <div className="fixed inset-0 h-screen w-screen bg-black overflow-hidden text-white z-10">
      {(currentIndex > 0 || (animatingState && animatingState.to > 0)) && (
        <button
          onClick={!animatingState ? handlePrev : undefined}
          className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/20 border-none text-white text-2xl w-10 h-10 rounded-full cursor-pointer z-[100] backdrop-blur-sm transition-all hover:bg-white/40 hover:-translate-x-1/2 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Go back"
          disabled={!!animatingState}
        >
          ↑
        </button>
      )}

      {/* Slides */}
      {!animatingState ? (
        renderSlide(currentIndex)
      ) : (
        <>
          {renderSlide(
            animatingState.from,
            animatingState.direction === 'next' ? 'exitNext' : 'exitPrev'
          )}
          {renderSlide(
            animatingState.to,
            animatingState.direction === 'next' ? 'enterNext' : 'enterPrev'
          )}
        </>
      )}
    </div>
  );
};
