import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../lib/hooks/useAdminAuth';
import { useDetectionJob } from '../lib/hooks/useDetectionJob';
import { createEvent, getAllEvents, deleteEvent, getCategories } from '../lib/firestore';
import { validateEventName, sanitizeInput } from '../lib/validation';
import { CONSTANTS } from '../lib/constants';
import { AlertModal } from '../components/atoms/AlertModal/AlertModal';
import styles from './AdminHome.module.css';
import { type VoteEvent } from '../lib/types';
import { AdminEventList } from '../components/organisms/admin/AdminEventList/AdminEventList';
import { AdminPageHeader } from '../components/organisms/admin/AdminPageHeader/AdminPageHeader';

export default function AdminHome() {
  const navigate = useNavigate();

  // Use admin auth hook for auth state management
  const { user, isAdmin, isLoading: authLoading, error: authError } = useAdminAuth({
    redirectIfNotAuth: '/',
  });

  // Alert state
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info'>('info');

  // Use detection job hook
  const {
    isDetecting: detectingAll,
    progress: detectionProgress,
    currentJobId,
    startDetection,
    cancelDetection,
  } = useDetectionJob({
    enabled: isAdmin,
    onComplete: (result) => {
      if (result.errors > 0) {
        const message =
          `Detection complete with errors!\n` +
          `Total images: ${result.total}\n` +
          `Processed: ${result.processed}\n` +
          `Skipped (already detected): ${result.skipped}\n` +
          `Errors: ${result.errors}`;
        setAlertMessage(message);
        setAlertType('error');
      }
    },
    onError: (errorMsg) => {
      setAlertMessage(errorMsg);
      setAlertType('error');
    },
    onStatusChange: (msg) => {
      setAlertMessage(msg);
      setAlertType('info');
    },
  });

  // Event management state
  const [eventName, setEventName] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [events, setEvents] = useState<VoteEvent[]>([]);
  const [eventImages, setEventImages] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch events if user is admin and auth check is complete
    if (authLoading || !isAdmin) return;

    const fetchEvents = async () => {
      try {
        const allEvents = await getAllEvents();
        // Sort by most recent first (createdAt is timestamp)
        const sortedEvents = allEvents.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setEvents(sortedEvents);

        // Fetch images for each event
        const imagesMap: Record<string, string[]> = {};
        await Promise.all(
          sortedEvents.map(async (event) => {
            try {
              const categories = await getCategories(event.id);
              imagesMap[event.id] = categories.map((cat) => cat.imageUrl);
            } catch {
              imagesMap[event.id] = [];
            }
          }),
        );
        setEventImages(imagesMap);
      } catch {
        setError(CONSTANTS.ERROR_MESSAGES.FAILED_TO_LOAD);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, [authLoading, isAdmin]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate event name
    const validation = validateEventName(eventName);
    if (!validation.valid) {
      setError(validation.error || 'Invalid event name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const sanitizedName = sanitizeInput(eventName);
      const event = await createEvent(sanitizedName);
      // Navigate directly to admin page
      navigate(`/admin/${event.id}`);
    } catch (error) {
      console.error('Error creating event:', error);
      let errorMessage =
        error instanceof Error ? error.message : CONSTANTS.ERROR_MESSAGES.FAILED_TO_SAVE;

      // Provide more helpful error message for permission errors
      if (
        error instanceof Error &&
        (error.message.includes('permission') || error.message.includes('Permission'))
      ) {
        if (user) {
          errorMessage = `Permission denied: Your account (${user.email || user.uid}) is not a global admin. Use the local script to bootstrap your admin access: node scripts/set-admin.js ${user.email}`;
        } else {
          errorMessage =
            'Permission denied: You must be signed in as a global admin to create events.';
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (eventId: string) => {
    setConfirmDelete(eventId);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;

    const eventId = confirmDelete;
    setConfirmDelete(null);
    setDeleting(eventId);
    try {
      await deleteEvent(eventId);
      // Wait for fade-out animation to complete before removing from list
      await new Promise((resolve) => setTimeout(resolve, 300));
      // Update state to remove deleted event (event is deleted even if storage cleanup failed)
      setEvents(events.filter((event) => event.id !== eventId));
      // Remove images from state
      const newImages = { ...eventImages };
      delete newImages[eventId];
      setEventImages(newImages);
    } catch (error) {
      console.error('Error deleting event:', error);
      // Check if it's a storage error - if so, event was still deleted from Firestore
      const isStorageError =
        error instanceof Error &&
        (error.message.includes('storage') || error.message.includes('Storage'));

      if (isStorageError) {
        // Event was deleted from Firestore, just storage cleanup failed
        // Still update state to reflect the deletion
        setEvents(events.filter((event) => event.id !== eventId));
        const newImages = { ...eventImages };
        delete newImages[eventId];
        setEventImages(newImages);
        // Show a warning but don't treat it as a failure
        setError('Event deleted, but some files may not have been removed from storage.');
      } else {
        // Real error - event deletion failed
        const errorMessage =
          error instanceof Error ? error.message : CONSTANTS.ERROR_MESSAGES.FAILED_TO_DELETE;
        setError(errorMessage);
      }
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteCancel = () => {
    setConfirmDelete(null);
  };

  const handleDetectAllImages = async () => {
    if (
      !window.confirm(
        'This will detect cookies in all images in shared storage. This may take a few minutes. Continue?',
      )
    ) {
      return;
    }
    setError(null);
    await startDetection();
  };

  const handleCancelDetection = async () => {
    if (!currentJobId) return;

    if (
      !window.confirm(
        'Are you sure you want to cancel the detection job? It will stop processing after the current image.',
      )
    ) {
      return;
    }
    await cancelDetection();
  };

  if (authLoading) {
    return <div className={styles.container}>Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          {authError || error || 'You do not have admin access. Please contact a site administrator.'}
        </div>
        <button
          onClick={() => navigate('/')}
          className={styles.button}
          style={{ marginTop: '1rem' }}
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {alertMessage && (
        <AlertModal message={alertMessage} type={alertType} onClose={() => setAlertMessage(null)} />
      )}
      <section className={styles.section}>
        <AdminPageHeader
          detectingAll={detectingAll}
          currentJobId={currentJobId}
          onAuditClick={() => window.open('/admin/audit/detections', '_blank')}
          onCancelDetection={handleCancelDetection}
          onDetectAll={handleDetectAllImages}
        />
        {detectionProgress && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.75rem 1rem',
              background: 'rgba(76, 175, 80, 0.2)',
              border: '1px solid rgba(76, 175, 80, 0.5)',
              borderRadius: '6px',
              color: '#c8e6c9',
              fontSize: '0.875rem',
            }}
          >
            {detectionProgress}
          </div>
        )}
        {error && (
          <div className={styles.error} style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleCreate} className={styles.form}>
          <input
            type="text"
            placeholder="Event Name (e.g. Holiday Cookie-Off)"
            value={eventName}
            onChange={(e) => {
              setEventName(e.target.value);
              setError(null);
            }}
            className={styles.input}
            disabled={loading}
            maxLength={100}
            required
          />
          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </form>
      </section>

      <section className={styles.section}>
        <h2>Existing Events</h2>
        {loadingEvents ? (
          <p>Loading events...</p>
        ) : (
          <AdminEventList
            events={events}
            eventImages={eventImages}
            deletingId={deleting}
            onDeleteClick={(eventId, e) => {
              e.stopPropagation();
              handleDeleteClick(eventId);
            }}
            onResultClick={(eventId, e) => {
              e.stopPropagation();
              window.open(`/results/${eventId}`, '_blank');
            }}
            onEventClick={(eventId) => navigate(`/admin/${eventId}`)}
          />
        )}
      </section>

      {confirmDelete && (
        <div
          className={styles.modalOverlay}
          onClick={handleDeleteCancel}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
              e.preventDefault();
              handleDeleteCancel();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Close delete confirmation"
        >
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Escape') {
                handleDeleteCancel();
              }
            }}
            role="dialog"
            aria-modal="true"
          >
            <h3>Delete Event</h3>
            <p>
              Are you sure you want to delete this event and all its data? This action cannot be
              undone.
            </p>
            <div className={styles.modalActions}>
              <button
                onClick={handleDeleteCancel}
                className={styles.modalButton}
                disabled={deleting === confirmDelete}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className={styles.modalDeleteButton}
                disabled={deleting === confirmDelete}
              >
                {deleting === confirmDelete ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
