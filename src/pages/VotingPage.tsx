import { useVotingFlow } from '../lib/hooks/useVotingFlow';
import { useParams } from 'react-router-dom';
import { VotingLandingView } from '../components/organisms/voting/VotingLandingView';
import { VotingSessionView } from '../components/organisms/voting/VotingSessionView';
import { VotingWaitingView } from '../components/organisms/voting/VotingWaitingView';
import { VotingResultsView } from '../components/organisms/voting/VotingResultsView';
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
      <div
        style={{
          height: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000000',
          color: 'white',
        }}
      >
        Loading event...
      </div>
    );
  }

  if (error || !event) {
    return (
      <div
        style={{
          height: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000000',
          color: 'white',
        }}
      >
        {error || CONSTANTS.ERROR_MESSAGES.EVENT_NOT_FOUND}
      </div>
    );
  }

  const categories: Category[] = results.map((r) => r.category);

  return (
    <>
      {submitError && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            background: '#ef4444',
            color: 'white',
            padding: '1rem',
            textAlign: 'center',
          }}
        >
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
    </>
  );
}
