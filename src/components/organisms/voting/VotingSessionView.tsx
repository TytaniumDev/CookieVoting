import { useState } from 'react';
import type { Category } from '../../../lib/types';
import styles from './VotingSessionView.module.css';

interface VotingSessionViewProps {
  categories: Category[];
  votes: Record<string, number>; // categoryId -> cookieNumber
  onVote: (categoryId: string, cookieNumber: number) => void;
  onComplete: () => void;
}

import { CookieViewer } from '../CookieViewer/CookieViewer';
import type { DetectedCookie } from '../../../lib/types';

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

  return (
    <div className={`${styles.slide} ${className || ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.categoryTitle}>{category.name}</h2>
        <div className={styles.progress}>
          Category {index + 1} of {total}
        </div>
      </div>

      {/* CookieViewer replaced manual image/buttons */}
      <div className={styles.imageContainer}>
        <CookieViewer
          imageUrl={category.imageUrl}
          detectedCookies={detectedCookies}
          cookieNumbers={cookieNumbers}
          selectedCookieNumber={currentVote}
          onSelectCookie={(num) => onVote(category.id, num)}
          className={styles.cookieViewer}
          // Custom render for the number/sparkle to match previous design
          renderCenter={({ index }) => {
            const cookie = category.cookies[index];
            const isSelected = currentVote === cookie.number;

            // We rely on CookieViewer's internal positioning, but we can override appearance here
            // Actually, CookieViewer handles the number button logic if we pass onSelectCookie
            // But we want the sparkle animation which CookieViewer might not have by default unless we customize

            // CookieViewer renders a number button at detected.x/y or bounds.center.
            // If we want the sparkle, we should probably render it here.

            return (
              <>
                {isSelected && (
                  <span
                    className={styles.sparkle}
                    style={{
                      position: 'absolute',
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'none',
                    }}
                  >
                    ✨
                  </span>
                )}
                {/* The number itself is rendered by CookieViewer's default since we passed cookieNumbers */}
              </>
            );
          }}
        />
      </div>

      {/* Next Button inside slide so it animates with it */}
      <div className={`${styles.footer} ${currentVote ? styles.visible : ''}`}>
        <button onClick={onNext} className={styles.nextButton}>
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
    <div className={styles.container}>
      {/* Global Back Arrow (animates out if needed, but user didn't ask) */}
      {/* We only show back arrow if target index > 0. If animating to 0, it should disappear? */}
      {/* Let's simplify: show if currentIndex > 0 OR (animating & to > 0) */}
      {(currentIndex > 0 || (animatingState && animatingState.to > 0)) && (
        <button
          onClick={!animatingState ? handlePrev : undefined}
          className={styles.backArrow}
          aria-label="Go back"
          disabled={!!animatingState}
        >
          ↑
        </button>
      )}

      {/* Slides */}
      {!animatingState ? (
        // Stable State
        renderSlide(currentIndex)
      ) : (
        // Animating State
        <>
          {/* Outgoing Slide */}
          {renderSlide(
            animatingState.from,
            animatingState.direction === 'next' ? styles.exitNext : styles.exitPrev,
          )}

          {/* Incoming Slide */}
          {renderSlide(
            animatingState.to,
            animatingState.direction === 'next' ? styles.enterNext : styles.enterPrev,
          )}
        </>
      )}
    </div>
  );
};
