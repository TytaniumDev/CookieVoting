import { useState, useCallback } from 'react';
import { useEventStore } from '../../../../lib/stores/useEventStore';
import { cn } from '../../../../lib/cn';

export interface VotingControlsProps {
  eventId: string;
}

export function VotingControls({ eventId }: VotingControlsProps) {
  const { activeEvent, updateEventStatus } = useEventStore();
  const [copiedLink, setCopiedLink] = useState<'vote' | 'results' | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const isVotingOpen = activeEvent?.status === 'voting';

  const handleCopyLink = useCallback(
    async (type: 'vote' | 'results') => {
      const baseUrl = window.location.origin;
      const path = type === 'vote' ? `/vote/${eventId}` : `/results/${eventId}`;
      const url = `${baseUrl}${path}`;

      try {
        await navigator.clipboard.writeText(url);
        setCopiedLink(type);
        setTimeout(() => setCopiedLink(null), 2000);
      } catch (error) {
        console.error('Failed to copy link:', error);
      }
    },
    [eventId],
  );

  const handleToggleVoting = useCallback(async () => {
    if (!activeEvent || isUpdating) return;

    setIsUpdating(true);
    try {
      const newStatus = isVotingOpen ? 'completed' : 'voting';
      await updateEventStatus(eventId, newStatus);
    } catch (error) {
      console.error('Failed to update voting status:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [activeEvent, isVotingOpen, eventId, updateEventStatus, isUpdating]);

  if (!activeEvent) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Status indicator */}
      <div className="flex items-center gap-3 p-4 bg-surface-secondary rounded-xl border border-surface-tertiary">
        <span
          className={cn(
            'w-3 h-3 rounded-full animate-pulse',
            isVotingOpen ? 'bg-green-500' : 'bg-red-500',
          )}
          aria-hidden="true"
        />
        <span className="text-white font-medium text-lg">
          Voting is currently {isVotingOpen ? 'Open' : 'Closed'}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => handleCopyLink('vote')}
          className="relative inline-flex items-center gap-2 px-5 py-3 bg-surface-tertiary hover:bg-primary-600/20 hover:border-primary-600 text-gray-200 hover:text-white rounded-xl transition-all text-base font-medium border border-surface-tertiary"
          aria-label="Copy voting link"
        >
          <span className="text-lg">📋</span>
          Copy Vote Link
          {copiedLink === 'vote' && (
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg whitespace-nowrap shadow-lg">
              Copied!
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleCopyLink('results')}
          className="relative inline-flex items-center gap-2 px-5 py-3 bg-surface-tertiary hover:bg-primary-600/20 hover:border-primary-600 text-gray-200 hover:text-white rounded-xl transition-all text-base font-medium border border-surface-tertiary"
          aria-label="Copy results link"
        >
          <span className="text-lg">📊</span>
          Copy Results Link
          {copiedLink === 'results' && (
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg whitespace-nowrap shadow-lg">
              Copied!
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={handleToggleVoting}
          disabled={isUpdating}
          className={cn(
            'inline-flex items-center gap-2 px-6 py-3 rounded-xl transition-all text-base font-semibold shadow-lg',
            isVotingOpen
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-primary-600 hover:bg-primary-700 text-white',
            isUpdating && 'opacity-50 cursor-not-allowed',
          )}
          aria-label={isVotingOpen ? 'Close voting' : 'Open voting'}
        >
          {isUpdating ? 'Updating...' : isVotingOpen ? '🚫 Close Voting' : '✅ Open Voting'}
        </button>
      </div>
    </div>
  );
}
