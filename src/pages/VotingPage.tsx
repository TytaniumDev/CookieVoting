import { useVotingFlow } from '../lib/hooks/useVotingFlow';
import { useParams } from 'react-router-dom';
import { VotingLandingView } from '../components/organisms/voting/VotingLandingView';
import { VotingSessionView } from '../components/organisms/voting/VotingSessionView';
import { VotingWaitingView } from '../components/organisms/voting/VotingWaitingView';
import { VotingResultsView } from '../components/organisms/voting/VotingResultsView';
import { ErrorBoundary } from '../components/ErrorBoundary';
import type { Category } from '../lib/types';
import { CONSTANTS } from '../lib/constants';

export default function VotingPage() {
  const { eventId } = useParams();
  const {
    event,
    results,
    loading,
    error,
    currentStep,
    votes,
    handleStartVoting,
    handleVote,
    handleSubmitVotes,
    handleViewResults,
    submitError,
  } = useVotingFlow(eventId);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        Loading event...
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        {error || CONSTANTS.ERROR_MESSAGES.EVENT_NOT_FOUND}
      </div>
    );
  }

  const categories: Category[] = results.map((r) => r.category);

  return (
    <ErrorBoundary>
      {submitError && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-danger text-white p-4 text-center">
          Error: {submitError}
        </div>
      )}

      {currentStep === 'LANDING' && (
        <VotingLandingView
          eventName={event.name}
          categories={categories}
          onStart={handleStartVoting}
        />
      )}

      {currentStep === 'VOTING' && (
        <VotingSessionView
          categories={categories}
          votes={votes}
          onVote={handleVote}
          onComplete={handleSubmitVotes}
        />
      )}

      {currentStep === 'WAITING' && (
        <VotingWaitingView
          resultsAvailableTime={event.resultsAvailableTime}
          onViewResults={handleViewResults}
        />
      )}

      {currentStep === 'RESULTS' && <VotingResultsView eventName={event.name} results={results} />}
    </ErrorBoundary>
  );
}
