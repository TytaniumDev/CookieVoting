import type { Category } from '../../../lib/types';

interface VotingLandingViewProps {
  eventName: string;
  categories: Category[];
  onStart: () => void;
}

export const VotingLandingView = ({ eventName, categories, onStart }: VotingLandingViewProps) => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-black text-white p-8 relative overflow-hidden">
      <div className="z-[2] text-center w-full max-w-[600px]">
        <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-[#fbbf24] to-[#d946ef] bg-clip-text text-transparent shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
          {eventName}
        </h1>
        <p className="text-xl text-[#cbd5e1] mb-12">Ready to cast your votes?</p>

        <div className="w-full overflow-hidden mb-12 rounded-2xl relative">
          <div className="flex gap-4 py-4 overflow-x-auto scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] [-webkit-scrollbar:hidden]">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex-none w-[150px] h-[150px] rounded-xl overflow-hidden shadow-lg border-2 border-white/10 transition-transform hover:-translate-y-1"
              >
                <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onStart}
          className="bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] text-[#0f172a] text-2xl font-bold px-12 py-4 border-none rounded-[50px] cursor-pointer shadow-[0_8px_20px_rgba(251,191,36,0.4)] transition-all hover:scale-105 hover:shadow-[0_12px_24px_rgba(251,191,36,0.6)] active:scale-[0.98]"
        >
          Start Voting
        </button>
      </div>

      <div className="hidden">
        {/* Add some festive/cookie decorations if desired */}
      </div>
    </div>
  );
};
