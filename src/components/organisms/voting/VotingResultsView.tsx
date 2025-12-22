import { useEffect, useMemo, useState } from 'react';
import type { CategoryResult } from '../../../lib/hooks/useResultsData';
import { CookieViewer } from '../../organisms/CookieViewer/CookieViewer';
import type { DetectedCookie } from '../../../lib/types';
import styles from './VotingResultsView.module.css';

interface VotingResultsViewProps {
  eventName: string;
  results: CategoryResult[];
}

type Tile =
  | { type: 'welcome' }
  | { type: 'category'; result: CategoryResult; categoryIndex: number; categoriesTotal: number }
  | { type: 'finished' };

const WelcomeTile = ({ eventName, categoriesTotal }: { eventName: string; categoriesTotal: number }) => {
  return (
    <div className={styles.tile}>
      <header className={styles.header}>
        <h2 className={styles.title}>Welcome</h2>
        <div className={styles.progress}>{eventName}</div>
      </header>

      <div className={styles.textTileBody}>
        <div className={styles.textTileCard}>
          <div className={styles.textTileHeading}>Voting results</div>
          <div className={styles.textTileText}>
            Use the arrows below to step through each category. Medals show 1st / 2nd / 3rd place.
          </div>
          <div className={styles.textTileMeta}>{categoriesTotal} categories</div>
        </div>
      </div>
    </div>
  );
};

const FinishedTile = ({ eventName }: { eventName: string }) => {
  return (
    <div className={styles.tile}>
      <header className={styles.header}>
        <h2 className={styles.title}>Finished</h2>
        <div className={styles.progress}>{eventName}</div>
      </header>

      <div className={styles.textTileBody}>
        <div className={styles.textTileCard}>
          <div className={styles.textTileHeading}>That’s everything</div>
          <div className={styles.textTileText}>Thanks for voting — see you at the next Cookie Off.</div>
          <div className={styles.textTileActions}>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={() => (window.location.href = '/')}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Internal component for a single result tile
const ResultTile = ({
  result,
  index,
  total,
}: {
  result: CategoryResult;
  index: number;
  total: number;
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
    <div className={styles.tile}>
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
                <div className={styles.bakerHeaderRow}>
                  {medal && (
                    <span className={styles.bakerMedal} aria-hidden="true">
                      {medal}
                    </span>
                  )}
                  <div className={styles.bakerLabel}>{score.maker}</div>
                </div>
                <div className={styles.voteCount}>{score.votes} votes</div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
};

export const VotingResultsView = ({ eventName, results }: VotingResultsViewProps) => {
  const tiles: Tile[] = useMemo(() => {
    const categoryTiles: Tile[] = results.map((result, idx) => ({
      type: 'category',
      result,
      categoryIndex: idx,
      categoriesTotal: results.length,
    }));
    return [{ type: 'welcome' }, ...categoryTiles, { type: 'finished' }];
  }, [results]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const tileCount = tiles.length;
  const handleNext = () => setCurrentIndex((prev) => Math.min(prev + 1, tileCount - 1));
  const handlePrev = () => setCurrentIndex((prev) => Math.max(prev - 1, 0));

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setCurrentIndex((prev) => Math.min(prev + 1, tileCount - 1));
      if (e.key === 'ArrowLeft') setCurrentIndex((prev) => Math.max(prev - 1, 0));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [tileCount]);

  const currentTileLabel = useMemo(() => {
    const tile = tiles[currentIndex];
    if (!tile) return '';
    if (tile.type === 'welcome') return 'Welcome';
    if (tile.type === 'finished') return 'Finished';
    return tile.result.category.name;
  }, [currentIndex, tiles]);

  return (
    <div className={styles.container}>
      <div className={styles.carouselViewport}>
        <div
          className={styles.carouselTrack}
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {tiles.map((tile) => {
            if (tile.type === 'welcome') {
              return (
                <div className={styles.carouselSlide} key="welcome">
                  <WelcomeTile eventName={eventName} categoriesTotal={results.length} />
                </div>
              );
            }

            if (tile.type === 'finished') {
              return (
                <div className={styles.carouselSlide} key="finished">
                  <FinishedTile eventName={eventName} />
                </div>
              );
            }

            return (
              <div className={styles.carouselSlide} key={tile.result.category.id}>
                <ResultTile
                  result={tile.result}
                  index={tile.categoryIndex}
                  total={tile.categoriesTotal}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.footer} aria-label="Results navigation">
        <button
          type="button"
          onClick={handlePrev}
          className={styles.navArrow}
          aria-label="Previous"
          disabled={currentIndex === 0}
        >
          ←
        </button>

        <div className={styles.navMeta}>
          <div className={styles.navLabel}>{currentTileLabel}</div>
          <div className={styles.navProgress}>
            {currentIndex + 1} / {tiles.length}
          </div>
        </div>

        <button
          type="button"
          onClick={handleNext}
          className={styles.navArrow}
          aria-label="Next"
          disabled={currentIndex === tiles.length - 1}
        >
          →
        </button>
      </div>
    </div>
  );
};
