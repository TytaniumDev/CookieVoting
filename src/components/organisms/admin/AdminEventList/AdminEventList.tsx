
import type { VoteEvent } from '../../../../lib/types';
import { cn } from '../../../../lib/cn';

export interface AdminEventListProps {
    events: VoteEvent[];
    eventImages: Record<string, string[]>;
    deletingId: string | null;
    onDeleteClick: (eventId: string, e: React.MouseEvent) => void;
    onResultClick: (eventId: string, e: React.MouseEvent) => void;
    onEventClick: (eventId: string) => void;
}

export function AdminEventList({
    events,
    eventImages,
    deletingId,
    onDeleteClick,
    onResultClick,
    onEventClick,
}: AdminEventListProps) {
    if (events.length === 0) {
        return <p>No events found.</p>;
    }

    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6 max-md:grid-cols-1 max-md:gap-4">
            {events.map((event) => {
                const images = eventImages[event.id] || [];
                return (
                    <div
                        key={event.id}
                        className={cn(
                            'bg-black/20 border border-white/10 rounded-lg p-4 transition-all overflow-hidden cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(220,38,38,0.2)] hover:border-[rgba(220,38,38,0.3)]',
                            deletingId === event.id &&
                                'opacity-0 -translate-x-5 scale-95 max-h-0 m-0 pt-0 pb-0 border-b-0'
                        )}
                        onClick={() => onEventClick(event.id)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onEventClick(event.id);
                            }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={`View event: ${event.name} `}
                    >
                        <div className="flex justify-between items-center mb-4 flex-wrap gap-2 max-md:mb-3">
                            <h3 className="m-0 text-[#f8fafc] text-lg">{event.name}</h3>
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={(e) => onResultClick(event.id, e)}
                                    className="px-3 py-2 text-base cursor-pointer bg-[#22c55e] text-white border-none rounded-md relative transition-all min-w-fit flex items-center justify-center font-semibold shadow-[0_2px_8px_rgba(34,197,94,0.3)] whitespace-nowrap overflow-hidden text-ellipsis hover:bg-[#16a34a] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(34,197,94,0.4)] disabled:bg-[#cbd5e1] disabled:cursor-not-allowed disabled:opacity-80"
                                >
                                    See Results
                                </button>
                                <button
                                    onClick={(e) => onDeleteClick(event.id, e)}
                                    className={cn(
                                        'px-3 py-2 text-base cursor-pointer bg-[#ef4444] text-white border-none rounded-md ml-2 relative transition-all min-w-[80px] flex items-center justify-center font-semibold shadow-[0_2px_8px_rgba(239,68,68,0.3)] whitespace-nowrap overflow-hidden text-ellipsis hover:bg-[#dc2626] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(239,68,68,0.4)] disabled:cursor-not-allowed disabled:opacity-80',
                                        deletingId === event.id && 'bg-[#ef4444] min-w-[80px]'
                                    )}
                                    disabled={deletingId === event.id}
                                >
                                    <span
                                        className="transition-opacity inline-block"
                                        style={{ opacity: deletingId === event.id ? 0 : 1 }}
                                    >
                                        Delete
                                    </span>
                                    {deletingId === event.id && (
                                        <span className="absolute w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin opacity-100 transition-opacity" />
                                    )}
                                </button>
                            </div>
                        </div>
                        {images.length > 0 ? (
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3 mt-4 p-2 bg-black/10 rounded-md">
                                {images.map((imageUrl, index) => {
                                    const urlHash = imageUrl.split('/').pop() || imageUrl.slice(-30);
                                    return (
                                        <img
                                            key={`${event.id} -${urlHash} `}
                                            src={imageUrl}
                                            alt={`${event.name} - ${index + 1} `}
                                            className="w-full h-[120px] object-contain bg-black/30 rounded-md border-2 border-white/10 cursor-pointer transition-all shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:scale-110 hover:shadow-[0_6px_20px_rgba(220,38,38,0.4)] hover:border-[#dc2626] hover:z-10 hover:relative"
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center p-4 text-[#cbd5e1] italic">No images yet</div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
