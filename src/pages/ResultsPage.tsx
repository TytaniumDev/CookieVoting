import { useParams } from 'react-router-dom';
import { useResultsData } from '../lib/hooks/useResultsData'; // Adjust path
import { VotingResultsView } from '../components/organisms/voting/VotingResultsView';
import { CONSTANTS } from '../lib/constants';

export default function ResultsPage() {
  const { eventId } = useParams();
  const { event, results, loading, error } = useResultsData(eventId);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[50vh] text-xl text-[#cbd5e1]">
        Calculating results...
      </div>
    );

  if (!event) {
    return (
      <div className="flex flex-col min-h-screen w-full p-4 box-border">
        <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-danger p-4 rounded-md text-center m-4">
          {error || CONSTANTS.ERROR_MESSAGES.EVENT_NOT_FOUND}
        </div>
      </div>
    );
  }

  return <VotingResultsView eventName={event.name} results={results} />;
}
