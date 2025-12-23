import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAdminAuth } from '../lib/hooks/useAdminAuth';
import { getEvent } from '../lib/firestore';
import { EventSetupWizard } from '../components/organisms/EventSetupWizard/EventSetupWizard';
import { type VoteEvent } from '../lib/types';
import styles from './WizardPage.module.css';

export default function WizardPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('categoryId');

  // Use admin auth hook
  const { isAdmin, isLoading: authLoading } = useAdminAuth({
    redirectIfNotAuth: '/',
    redirectIfNotAdmin: '/admin',
  });

  const [event, setEvent] = useState<VoteEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) {
      navigate('/admin', { replace: true });
      return;
    }

    if (authLoading || !isAdmin) return;

    const loadEvent = async () => {
      try {
        const eventData = await getEvent(eventId);
        setEvent(eventData);
      } catch {
        navigate('/admin', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventId, navigate, authLoading, isAdmin]);

  if (authLoading || loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!isAdmin || !event || !eventId) {
    return null; // Will redirect
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate(`/admin/${eventId}`)} className={styles.backButton}>
          ← Back to Event
        </button>
        <h1>{event.name} - Setup Wizard</h1>
      </div>
      <EventSetupWizard
        eventId={eventId}
        eventName={event.name}
        initialCategoryId={categoryId || undefined}
        onComplete={async () => {
          // Navigate back to event dashboard after completion
          navigate(`/admin/${eventId}`);
        }}
        onCancel={() => navigate(`/admin/${eventId}`)}
      />
    </div>
  );
}
