import { useState } from 'react';
import type { CategoryResult } from '../../../lib/hooks/useResultsData';
import { CookieViewer } from '../../organisms/CookieViewer/CookieViewer';
import type { DetectedCookie } from '../../../lib/types';
import styles from './VotingResultsView.module.css';

interface VotingResultsViewProps {
  eventName: string;
  results: CategoryResult[];
}

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
          renderTopLeft={({ index: cookieIndex }) => {
            // Find the score for this cookie index
            // We need to match the cookie in the score to the detected cookie at this index
            const detected = cookiesToDisplay[cookieIndex];
            const score = rankedScores.find((s) => {
              const distance = Math.sqrt(
                Math.pow(detected.x - s.cookie.x, 2) + Math.pow(detected.y - s.cookie.y, 2),
              );
              return distance < 5;
            });

            if (!score) return null;
            const medal = getMedal(score.rank);
            if (!medal) return null;

            return <div className={styles.medal}>{medal}</div>;
          }}
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

            return (
              <div className={styles.bakerInfo}>
                <div className={styles.bakerLabel}>{score.maker}</div>
                <div className={styles.voteCount}>{score.votes} votes</div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
};

export const VotingResultsView = ({ results }: VotingResultsViewProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animatingState, setAnimatingState] = useState<{
    from: number;
    to: number;
    direction: 'next' | 'prev';
  } | null>(null);

  const handleNext = () => {
    if (currentIndex < results.length - 1) {
      setAnimatingState({
        from: currentIndex,
        to: currentIndex + 1,
        direction: 'next',
      });
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setAnimatingState(null);
      }, 800);
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

  const renderSlide = (index: number, animationClass?: string) => {
    const result = results[index];
    if (!result) return null;
    return (
      <ResultSlide
        key={result.category.id}
        result={result}
        index={index}
        total={results.length}
        className={animationClass}
      />
    );
  };

  return (
    <div className={styles.container}>
      {/* Back to previous category arrow */}
      {(currentIndex > 0 || (animatingState && animatingState.to > 0)) && (
        <button
          onClick={!animatingState ? handlePrev : undefined}
          className={styles.backArrow}
          aria-label="Previous category"
          disabled={!!animatingState}
        >
          ↑
        </button>
      )}

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
        <button
          onClick={
            currentIndex < results.length - 1 ? handleNext : () => (window.location.href = '/')
          }
          className={styles.nextButton}
          disabled={!!animatingState}
        >
          {currentIndex < results.length - 1 ? 'Next Category' : 'Back to Home'}
        </button>
      </div>
    </div>
  );
};
