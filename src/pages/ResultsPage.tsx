import { useParams } from 'react-router-dom';
import { useResultsData } from '../lib/hooks/useResultsData'; // Adjust path
import { VotingResultsView } from '../components/organisms/voting/VotingResultsView';
import { CONSTANTS } from '../lib/constants';
import styles from './ResultsPage.module.css';

export default function ResultsPage() {
  const { eventId } = useParams();
  const { event, results, loading, error } = useResultsData(eventId);

  if (loading) return <div className={styles.loading}>Calculating results...</div>;

  if (!event) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error || CONSTANTS.ERROR_MESSAGES.EVENT_NOT_FOUND}</div>
      </div>
    );
  }

  return <VotingResultsView eventName={event.name} results={results} />;
}
