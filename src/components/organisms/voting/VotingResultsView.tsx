import { useState } from 'react';
import type { CategoryResult } from '../../../lib/hooks/useResultsData';
import { CookieViewer } from '../../organisms/CookieViewer/CookieViewer';
import type { DetectedCookie } from '../../../lib/types';
import styles from './VotingResultsView.module.css';

interface VotingResultsViewProps {
  eventName: string;
  results: CategoryResult[];
}

// Intro tile component
const IntroTile = ({ eventName, className }: { eventName: string; className?: string }) => {
  return (
    <div className={`${styles.slide} ${styles.introTile} ${className || ''}`}>
      <div className={styles.introContent}>
        <h1 className={styles.introTitle}>🏆 Results Are In! 🏆</h1>
        <p className={styles.introSubtitle}>{eventName}</p>
        <p className={styles.introDescription}>
          Swipe through to see the winners in each category
        </p>
      </div>
    </div>
  );
};

// Outro tile component
const OutroTile = ({ className }: { className?: string }) => {
  return (
    <div className={`${styles.slide} ${styles.outroTile} ${className || ''}`}>
      <div className={styles.outroContent}>
        <h1 className={styles.outroTitle}>🎉 Congratulations! 🎉</h1>
        <p className={styles.outroSubtitle}>Thank you for participating!</p>
        <p className={styles.outroDescription}>
          We hope you enjoyed the competition!
        </p>
      </div>
    </div>
  );
};

// Internal component for a single result slide
const ResultSlide = ({
  result,
  index,
  total,
  className,
}: {
  result: CategoryResult;
  index: number;
  total: number;
  className?: string;
}) => {
  const { category, scores, detectedCookies } = result;

  // Use detected cookies if available, otherwise fallback
  const cookiesToDisplay: DetectedCookie[] =
    detectedCookies && detectedCookies.length > 0
      ? detectedCookies
      : scores.map((score) => ({
          x: score.cookie.x,
          y: score.cookie.y,
          width: 15,
          height: 15,
          confidence: 1.0,
        }));

  // Dense Ranking Logic: Sort scores by votes descending and assign rank based on unique vote counts
  const sortedScores = [...scores].sort((a, b) => b.votes - a.votes);
  const rankedScores = sortedScores.map((score, i, arr) => {
    // Count how many unique higher vote totals exist before this one
    const uniqueHigherVotes = new Set(
      arr
        .slice(0, i)
        .map((s) => s.votes)
        .filter((v) => v > score.votes),
    );
    const rank = uniqueHigherVotes.size; // 0-indexed rank
    return { ...score, rank };
  });

  const getMedal = (rank: number) => {
    const medals = ['🥇', '🥈', '🥉'];
    return rank < 3 ? medals[rank] : null;
  };

  const maxVotes = Math.max(...scores.map((s) => s.votes));

  return (
    <div className={`${styles.slide} ${className || ''}`}>
      <header className={styles.header}>
        <h2 className={styles.title}>{category.name} Results</h2>
        <div className={styles.progress}>
          Category {index + 1} of {total}
        </div>
      </header>

      <div className={styles.imageContainer}>
        <CookieViewer
          imageUrl={category.imageUrl}
          detectedCookies={cookiesToDisplay}
          className={styles.viewer}
          renderCenter={({ index: cookieIndex }) => {
            const detected = cookiesToDisplay[cookieIndex];
            const score = rankedScores.find((s) => {
              const distance = Math.sqrt(
                Math.pow(detected.x - s.cookie.x, 2) + Math.pow(detected.y - s.cookie.y, 2),
              );
              return distance < 5;
            });

            const isWinner = score && score.votes === maxVotes && maxVotes > 0;
            if (!isWinner) return null;

            return <div className={styles.winnerGlow} />;
          }}
          renderBottom={({ index: cookieIndex }) => {
            const detected = cookiesToDisplay[cookieIndex];
            const score = rankedScores.find((s) => {
              const distance = Math.sqrt(
                Math.pow(detected.x - s.cookie.x, 2) + Math.pow(detected.y - s.cookie.y, 2),
              );
              return distance < 5;
            });

            if (!score) return null;

            const medal = getMedal(score.rank);

            return (
              <div className={styles.bakerInfo}>
                {medal && <div className={styles.medalInline}>{medal}</div>}
                <div className={styles.bakerDetails}>
                  <div className={styles.bakerLabel}>{score.maker}</div>
                  <div className={styles.voteCount}>{score.votes} votes</div>
                </div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
};

export const VotingResultsView = ({ eventName, results }: VotingResultsViewProps) => {
  // Total slides: 1 intro + results.length + 1 outro
  const totalSlides = results.length + 2;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animatingState, setAnimatingState] = useState<{
    from: number;
    to: number;
    direction: 'next' | 'prev';
  } | null>(null);

  const handleNext = () => {
    if (currentIndex < totalSlides - 1) {
      setAnimatingState({
        from: currentIndex,
        to: currentIndex + 1,
        direction: 'next',
      });
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setAnimatingState(null);
      }, 600);
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
      }, 600);
    }
  };

  const renderSlide = (index: number, animationClass?: string) => {
    // First slide is intro
    if (index === 0) {
      return <IntroTile key="intro" eventName={eventName} className={animationClass} />;
    }
    // Last slide is outro
    if (index === totalSlides - 1) {
      return <OutroTile key="outro" className={animationClass} />;
    }
    // Middle slides are results
    const resultIndex = index - 1;
    const result = results[resultIndex];
    if (!result) return null;
    return (
      <ResultSlide
        key={result.category.id}
        result={result}
        index={resultIndex}
        total={results.length}
        className={animationClass}
      />
    );
  };

  return (
    <div className={styles.container}>
      {!animatingState ? (
        renderSlide(currentIndex)
      ) : (
        <>
          {renderSlide(
            animatingState.from,
            animatingState.direction === 'next' ? styles.exitNext : styles.exitPrev,
          )}
          {renderSlide(
            animatingState.to,
            animatingState.direction === 'next' ? styles.enterNext : styles.enterPrev,
          )}
        </>
      )}

      <div className={styles.footer}>
        <div className={styles.navigationControls}>
          <button
            onClick={handlePrev}
            className={styles.navArrow}
            aria-label="Previous"
            disabled={!!animatingState || currentIndex === 0}
          >
            ←
          </button>

          <div className={styles.progress}>
            {currentIndex + 1} / {totalSlides}
          </div>

          {currentIndex < totalSlides - 1 ? (
            <button
              onClick={handleNext}
              className={styles.navArrow}
              aria-label="Next"
              disabled={!!animatingState}
            >
              →
            </button>
          ) : (
            <button
              onClick={() => (window.location.href = '/')}
              className={styles.homeButton}
              aria-label="Back to Home"
            >
              Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
