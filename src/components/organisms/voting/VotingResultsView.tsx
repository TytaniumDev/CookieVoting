import { useState } from 'react';
import type { CategoryResult } from '../../../lib/hooks/useResultsData';
import { CookieViewer } from '../../organisms/CookieViewer/CookieViewer';
import type { DetectedCookie } from '../../../lib/types';
import { cn } from '../../../lib/cn';

interface VotingResultsViewProps {
  eventName: string;
  results: CategoryResult[];
}

// Intro tile component
const IntroTile = ({ eventName, className }: { eventName: string; className?: string }) => {
  const getAnimationStyle = () => {
    if (!className) return {};
    if (className.includes('exitNext')) {
      return { animation: 'slideOutLeft 0.6s cubic-bezier(0.7, 0, 0.3, 1) forwards' };
    }
    if (className.includes('enterNext')) {
      return { animation: 'slideInRight 0.6s cubic-bezier(0.7, 0, 0.3, 1) forwards' };
    }
    if (className.includes('exitPrev')) {
      return { animation: 'slideOutRight 0.6s cubic-bezier(0.7, 0, 0.3, 1) forwards' };
    }
    if (className.includes('enterPrev')) {
      return { animation: 'slideInLeft 0.6s cubic-bezier(0.7, 0, 0.3, 1) forwards' };
    }
    return {};
  };

  return (
    <div
      className={cn(
        'absolute inset-0 w-full h-full flex flex-col bg-black will-change-[transform,opacity] flex items-center justify-center bg-gradient-to-br from-[#1e293b] to-[#0f172a]',
        className?.includes('exitNext') || className?.includes('exitPrev') ? 'z-[1]' : '',
        className?.includes('enterNext') || className?.includes('enterPrev') ? 'z-[2]' : ''
      )}
      style={getAnimationStyle()}
    >
      <div className="text-center p-8 max-w-[600px]">
        <h1 className="text-5xl font-extrabold m-0 mb-4 bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] bg-clip-text text-transparent">
          🏆 Results Are In! 🏆
        </h1>
        <p className="text-[1.8rem] font-semibold text-white m-0 mb-6">{eventName}</p>
        <p className="text-xl text-[#94a3b8] m-0 leading-relaxed">
          Swipe through to see the winners in each category
        </p>
      </div>
    </div>
  );
};

// Outro tile component
const OutroTile = ({ className }: { className?: string }) => {
  const getAnimationStyle = () => {
    if (!className) return {};
    if (className.includes('exitNext')) {
      return { animation: 'slideOutLeft 0.6s cubic-bezier(0.7, 0, 0.3, 1) forwards' };
    }
    if (className.includes('enterNext')) {
      return { animation: 'slideInRight 0.6s cubic-bezier(0.7, 0, 0.3, 1) forwards' };
    }
    if (className.includes('exitPrev')) {
      return { animation: 'slideOutRight 0.6s cubic-bezier(0.7, 0, 0.3, 1) forwards' };
    }
    if (className.includes('enterPrev')) {
      return { animation: 'slideInLeft 0.6s cubic-bezier(0.7, 0, 0.3, 1) forwards' };
    }
    return {};
  };

  return (
    <div
      className={cn(
        'absolute inset-0 w-full h-full flex flex-col bg-black will-change-[transform,opacity] flex items-center justify-center bg-gradient-to-br from-[#1e293b] to-[#0f172a]',
        className?.includes('exitNext') || className?.includes('exitPrev') ? 'z-[1]' : '',
        className?.includes('enterNext') || className?.includes('enterPrev') ? 'z-[2]' : ''
      )}
      style={getAnimationStyle()}
    >
      <div className="text-center p-8 max-w-[600px]">
        <h1 className="text-5xl font-extrabold m-0 mb-4 bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] bg-clip-text text-transparent">
          🎉 Congratulations! 🎉
        </h1>
        <p className="text-[1.8rem] font-semibold text-white m-0 mb-6">Thank you for participating!</p>
        <p className="text-xl text-[#94a3b8] m-0 leading-relaxed">
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

  const getAnimationStyle = () => {
    if (!className) return {};
    if (className.includes('exitNext')) {
      return { animation: 'slideOutLeft 0.6s cubic-bezier(0.7, 0, 0.3, 1) forwards' };
    }
    if (className.includes('enterNext')) {
      return { animation: 'slideInRight 0.6s cubic-bezier(0.7, 0, 0.3, 1) forwards' };
    }
    if (className.includes('exitPrev')) {
      return { animation: 'slideOutRight 0.6s cubic-bezier(0.7, 0, 0.3, 1) forwards' };
    }
    if (className.includes('enterPrev')) {
      return { animation: 'slideInLeft 0.6s cubic-bezier(0.7, 0, 0.3, 1) forwards' };
    }
    return {};
  };

  return (
    <div
      className={cn(
        'absolute inset-0 w-full h-full flex flex-col bg-black will-change-[transform,opacity]',
        className?.includes('exitNext') || className?.includes('exitPrev') ? 'z-[1]' : '',
        className?.includes('enterNext') || className?.includes('enterPrev') ? 'z-[2]' : ''
      )}
      style={getAnimationStyle()}
    >
      <header className="p-4 pt-14 bg-black z-10 text-center">
        <h2 className="text-2xl m-0 font-bold uppercase tracking-wide text-[#ffd700]">
          {category.name} Results
        </h2>
        <div className="text-base text-[#94a3b8] font-medium min-w-[80px] text-center">
          Category {index + 1} of {total}
        </div>
      </header>

      <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black overflow-hidden z-0 pt-[120px] pb-[120px] box-border">
        <CookieViewer
          imageUrl={category.imageUrl}
          detectedCookies={cookiesToDisplay}
          className="w-full h-full"
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

            return (
              <div className="absolute -inset-5 rounded-[15px] bg-[radial-gradient(circle,rgba(255,215,0,0.4)_0%,rgba(255,215,0,0)_70%)] animate-[pulseGlow_2s_infinite_alternate_ease-in-out] pointer-events-none" />
            );
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
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[110%] flex flex-row items-center gap-2 bg-black/80 backdrop-blur-sm py-2 px-4 rounded-xl border border-white/20 min-w-[120px] whitespace-nowrap">
                {medal && <div className="text-3xl leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{medal}</div>}
                <div className="flex flex-col items-start">
                  <div className="font-bold text-sm text-white">{score.maker}</div>
                  <div className="text-xs text-[#cbd5e1]">{score.votes} votes</div>
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
    <div className="bg-black overflow-hidden text-white z-10">
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

      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/95 to-black/0 flex justify-center z-20">
        <div className="flex items-center gap-8">
          <button
            onClick={handlePrev}
            className="bg-white/15 border-2 border-white/30 text-white text-3xl w-[60px] h-[60px] rounded-full cursor-pointer backdrop-blur-sm transition-all flex items-center justify-center hover:bg-white/25 hover:border-white/50 hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous"
            disabled={!!animatingState || currentIndex === 0}
          >
            ←
          </button>

          <div className="text-base text-[#94a3b8] font-medium min-w-[80px] text-center">
            {currentIndex + 1} / {totalSlides}
          </div>

          {currentIndex < totalSlides - 1 ? (
            <button
              onClick={handleNext}
              className="bg-white/15 border-2 border-white/30 text-white text-3xl w-[60px] h-[60px] rounded-full cursor-pointer backdrop-blur-sm transition-all flex items-center justify-center hover:bg-white/25 hover:border-white/50 hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next"
              disabled={!!animatingState}
            >
              →
            </button>
          ) : (
            <button
              onClick={() => (window.location.href = '/')}
              className="bg-[#3b82f6] text-white border-none text-base font-bold px-8 py-4 rounded-[50px] shadow-[0_4px_12px_rgba(59,130,246,0.4)] cursor-pointer transition-transform hover:scale-105 active:scale-95"
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
