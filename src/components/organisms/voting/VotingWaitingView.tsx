import { useState, useEffect, useMemo } from 'react';
import { Snowman } from '../../molecules/Snowman/Snowman';

interface VotingWaitingViewProps {
  resultsAvailableTime?: number | null; // Timestamp
  onViewResults: () => void;
}

export const VotingWaitingView = ({
  resultsAvailableTime,
  onViewResults,
}: VotingWaitingViewProps) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isReady, setIsReady] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!resultsAvailableTime) {
      setTimeLeft('Waiting for admin to set release time...');
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diff = resultsAvailableTime - now;

      if (diff <= 0) {
        setIsReady(true);
        setTimeLeft('Results are ready!');
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [resultsAvailableTime]);

  // Generate random snowflakes
  const snowflakes = useMemo(() => {
    const chars = ['❅', '❆', '❄'];
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      char: chars[Math.floor(Math.random() * chars.length)],
      style: {
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 10}s`,
        animationDuration: `${5 + Math.random() * 10}s`,
        fontSize: `${0.5 + Math.random() * 1.5}rem`,
        opacity: 0.4 + Math.random() * 0.6,
      },
    }));
  }, []);

  const handleViewClick = () => {
    setShowWarning(true);
  };

  const confirmViewResults = () => {
    setShowWarning(false);
    onViewResults();
  };

  return (
    <div className="fixed inset-0 h-screen w-screen flex items-center justify-center bg-black text-white overflow-hidden text-center p-8 box-border z-0">
      {/* Snowflakes */}
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="text-white text-base font-[Arial,sans-serif] text-shadow-[0_0_5px_#000] absolute -top-[10%] z-[1] select-none cursor-default pointer-events-none"
          style={{
            ...flake.style,
            animationName: 'snowflakes-fall, snowflakes-shake',
            animationTimingFunction: 'linear, ease-in-out',
            animationIterationCount: 'infinite, infinite',
          }}
          aria-hidden="true"
        >
          {flake.char}
        </div>
      ))}

      <div className="z-10 bg-white/5 p-8 rounded-2xl backdrop-blur-sm border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] max-w-[500px] w-full relative mb-16">
        <h1 className="text-3xl mb-2 text-[#ffd700] text-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
          Thank You For Voting!
        </h1>
        <p className="text-[#cbd5e1] mb-6">The bakers appreciate your taste buds.</p>

        {!isReady && (
          <div className="mb-6 p-4 bg-black/20 rounded-lg">
            <h2 className="text-sm uppercase tracking-[2px] mb-2 text-[#94a3b8]">
              Results Reveal In:
            </h2>
            <div className="text-[2.5rem] font-mono font-bold text-[#38bdf8] text-shadow-[0_0_20px_rgba(56,189,248,0.5)]">
              {timeLeft}
            </div>
          </div>
        )}

        {isReady && (
          <div style={{ marginTop: '2rem' }}>
            <button
              onClick={handleViewClick}
              className="bg-gradient-to-br from-[#22c55e] to-[#16a34a] text-white text-xl font-bold px-8 py-3 border-none rounded-[50px] cursor-pointer shadow-[0_4px_12px_rgba(34,197,94,0.4)] transition-all animate-[bounce-button_2s_infinite] hover:scale-105"
            >
              View Results 🏆
            </button>
          </div>
        )}
      </div>

      {/* Snowman Decoration */}
      <div className="absolute bottom-[50px] right-[15%] z-[7]">
        <Snowman />
      </div>

      {/* Snow Mounds */}
      <div
        className="absolute bottom-0 left-0 w-full h-[15vh] z-[5] pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute -bottom-[50px] -left-[10%] w-1/2 h-[150px] bg-[#f8fafc] rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
        <div className="absolute -bottom-[50px] left-[30%] w-2/5 h-[180px] bg-[#f8fafc] rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)] z-[6]" />
        <div className="absolute -bottom-[50px] -right-[10%] w-3/5 h-[160px] bg-[#f8fafc] rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
      </div>

      {/* Confirmation Modal */}
      {showWarning && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/80 flex justify-center items-center z-[100]">
          <div className="bg-[#1e293b] p-8 rounded-2xl max-w-[90%] w-[400px] text-center border border-white/10">
            <h3 className="text-[#ef4444] text-2xl mb-4">Caution!</h3>
            <p>
              Once you view the results, you will{' '}
              <strong>no longer be able to change your votes</strong>.
            </p>
            <div className="flex gap-4 justify-center mt-8">
              <button
                onClick={() => setShowWarning(false)}
                className="bg-transparent border border-[#94a3b8] text-[#cbd5e1] px-6 py-3 rounded-lg cursor-pointer"
              >
                Go Back
              </button>
              <button
                onClick={confirmViewResults}
                className="bg-[#ef4444] text-white border-none px-6 py-3 rounded-lg cursor-pointer font-bold"
              >
                Reveal Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
