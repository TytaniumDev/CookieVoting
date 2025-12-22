import { useState } from 'react';
import type { CategoryResult } from '../../../lib/hooks/useResultsData';
import { CookieViewer } from '../../organisms/CookieViewer/CookieViewer';
import type { DetectedCookie } from '../../../lib/types';
import styles from './VotingResultsView.module.css';

interface VotingResultsViewProps {
  eventName: string;
  results: CategoryResult[];
}

const WelcomeSlide = ({ className }: { className?: string }) => (
  <div className={`${styles.introSlide} ${className || ''}`}>
    <div className={styles.introContent}>
      <div className={styles.startIcon}>🏆</div>
      <h1 className={styles.introTitle}>Voting Results</h1>
      <p className={styles.introText}>
        The votes are in! Navigate through to reveal the winners of this year's competition.
      </p>
    </div>
  </div>
);

const FinishedSlide = ({ className }: { className?: string }) => (
  <div className={`${styles.finishedSlide} ${className || ''}`}>
    <div className={styles.finishedContent}>
      <div className={styles.finishIcon}>🎉</div>
      <h1 className={styles.finishedTitle}>That's a Wrap!</h1>
      <p className={styles.finishedText}>
        Thank you for participating in the voting process. We hope you enjoyed the event!
      </p>
      <a href="/" className={styles.homeButton}>
        Back to Home
      </a>
    </div>
  </div>
);

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
              <div className={styles.bakerBadgeContainer}>
                {medal && <div className={styles.medalInBadge}>{medal}</div>}
                <div className={styles.bakerInfo}>
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

export const VotingResultsView = ({ results }: VotingResultsViewProps) => {
  // 0: Welcome
  // 1 to results.length: Results
  // results.length + 1: Finished
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalSlides = results.length + 2;

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
      }, 500); // Matched CSS animation duration
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
      }, 500); // Matched CSS animation duration
    }
  };

  const renderContent = (index: number, animationClass?: string) => {
    if (index === 0) {
      return <WelcomeSlide className={animationClass} />;
    }
    if (index === totalSlides - 1) {
      return <FinishedSlide className={animationClass} />;
    }
    
    // Result indices are shifted by 1
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
        renderContent(currentIndex)
      ) : (
        <>
          {renderContent(
            animatingState.from,
            animatingState.direction === 'next' ? styles.exitNext : styles.exitPrev,
          )}
          {renderContent(
            animatingState.to,
            animatingState.direction === 'next' ? styles.enterNext : styles.enterPrev,
          )}
        </>
      )}

      <div className={styles.footer}>
        <div className={styles.footerNav}>
          <button
            onClick={handlePrev}
            className={styles.navButton}
            disabled={!!animatingState || currentIndex === 0}
            aria-label="Previous"
          >
            ←
          </button>
          
          <button
            onClick={handleNext}
            className={styles.navButton}
            disabled={!!animatingState || currentIndex === totalSlides - 1}
            aria-label="Next"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
};
