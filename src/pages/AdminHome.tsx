import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { doc, onSnapshot, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  createEvent,
  getAllEvents,
  deleteEvent,
  getCategories,
  isGlobalAdmin,
} from '../lib/firestore';
import { validateEventName, sanitizeInput } from '../lib/validation';
import { CONSTANTS } from '../lib/constants';
import { AlertModal } from '../components/atoms/AlertModal/AlertModal';
import styles from './AdminHome.module.css';
import { type VoteEvent } from '../lib/types';

export default function AdminHome() {
  const [eventName, setEventName] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [events, setEvents] = useState<VoteEvent[]>([]);
  const [eventImages, setEventImages] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [detectingAll, setDetectingAll] = useState(false);
  const [detectionProgress, setDetectionProgress] = useState<string | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info'>('info');
  const navigate = useNavigate();

  // Check authentication and admin access
  useEffect(() => {
    const checkAccess = async () => {
      setCheckingAccess(true);
      try {
        // Get current user
        const user = auth.currentUser;

        // A user is considered signed in if they have an email or provider data
        const isSignedIn =
          user && (user.email || (user.providerData && user.providerData.length > 0));

        if (!isSignedIn) {
          // Not signed in, redirect to landing page
          navigate('/', { replace: true });
          setIsAdmin(false);
          setCheckingAuth(false);
          setCheckingAccess(false);
          return;
        }

        setCheckingAuth(false);

        // Check if user is an admin
        const admin = await isGlobalAdmin(user.uid);
        setIsAdmin(admin);

        if (!admin) {
          setError('You do not have admin access. Please contact a site administrator.');
          setLoadingEvents(false);
          setCheckingAccess(false);
          return;
        }

        // User is admin, proceed to load events
        setCheckingAccess(false);
      } catch (err) {
        console.error('Failed to check admin access', err);
        setError(CONSTANTS.ERROR_MESSAGES.FAILED_TO_LOAD);
        setCheckingAuth(false);
        setCheckingAccess(false);
      }
    };

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async () => {
      await checkAccess();
    });

    // Also check immediately
    checkAccess();

    return () => unsubscribe();
  }, [navigate]);

  // Check for running detection jobs on mount
  useEffect(() => {
    if (checkingAuth || checkingAccess || !isAdmin) return;

    const checkRunningJobs = async () => {
      try {
        // Query without orderBy to avoid needing an index
        // We'll check both statuses separately and take the most recent
        const jobsRef = collection(db, 'detection_jobs');

        // Check for processing jobs first (most likely to be active)
        const processingQuery = query(jobsRef, where('status', '==', 'processing'), limit(1));
        const processingSnapshot = await getDocs(processingQuery);

        if (!processingSnapshot.empty) {
          const jobDoc = processingSnapshot.docs[0];
          setCurrentJobId(jobDoc.id);
          setDetectingAll(true);
          setDetectionProgress('Found running detection job. Watching progress...');
          return;
        }

        // If no processing job, check for queued jobs
        const queuedQuery = query(jobsRef, where('status', '==', 'queued'), limit(1));
        const queuedSnapshot = await getDocs(queuedQuery);

        if (!queuedSnapshot.empty) {
          const jobDoc = queuedSnapshot.docs[0];
          setCurrentJobId(jobDoc.id);
          setDetectingAll(true);
          setDetectionProgress('Found queued detection job. Watching progress...');
        }
      } catch (error) {
        console.error('Error checking for running jobs:', error);
      }
    };

    checkRunningJobs();
  }, [checkingAuth, checkingAccess, isAdmin]);

  useEffect(() => {
    // Only fetch events if user is admin and access check is complete
    if (checkingAuth || checkingAccess || !isAdmin) return;

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
            } catch (err) {
              console.error(`Failed to load images for event ${event.id}`, err);
              imagesMap[event.id] = [];
            }
          }),
        );
        setEventImages(imagesMap);
      } catch (err) {
        console.error('Failed to load events', err);
        setError(CONSTANTS.ERROR_MESSAGES.FAILED_TO_LOAD);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, [checkingAuth, checkingAccess, isAdmin]);

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
        const currentUser = auth.currentUser;

        if (currentUser) {
          errorMessage = `Permission denied: Your account (${currentUser.email || currentUser.uid}) is not a global admin. Use the local script to bootstrap your admin access: node scripts/set-admin.js ${currentUser.email}`;
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

  // Watch job status when a job is active
  useEffect(() => {
    if (!currentJobId) return;

    const jobRef = doc(db, 'detection_jobs', currentJobId);
    const unsubscribe = onSnapshot(
      jobRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setDetectionProgress(null);
          setDetectingAll(false);
          return;
        }

        const jobData = snapshot.data();
        const status = jobData.status;
        const total = jobData.total || 0;
        const processed = jobData.processed || 0;
        const skipped = jobData.skipped || 0;
        const errors = jobData.errors || 0;
        const currentFile = jobData.currentFile || '';
        const currentIndex = jobData.currentIndex || 0;

        if (status === 'queued') {
          setDetectionProgress('Job queued, starting soon...');
        } else if (status === 'processing') {
          if (total > 0) {
            const progress = Math.round(((processed + skipped + errors) / total) * 100);
            setDetectionProgress(
              `Processing ${currentIndex}/${total}: ${currentFile}\n` +
                `Progress: ${progress}% (${processed} processed, ${skipped} skipped, ${errors} errors)`,
            );
          } else {
            setDetectionProgress('Scanning for images...');
          }
        } else if (status === 'completed') {
          setDetectingAll(false);
          setDetectionProgress(null);
          setCurrentJobId(null);
          const message =
            `Detection complete!\n` +
            `Total images: ${total}\n` +
            `Processed: ${processed}\n` +
            `Skipped (already detected): ${skipped}\n` +
            `Errors: ${errors}`;
          setAlertMessage(message);
          setAlertType(errors > 0 ? 'error' : 'success');
        } else if (status === 'cancelled') {
          setDetectingAll(false);
          setDetectionProgress(null);
          setCurrentJobId(null);
          setAlertMessage('Detection job cancelled');
          setAlertType('info');
        } else if (status === 'error') {
          setDetectingAll(false);
          setDetectionProgress(null);
          setCurrentJobId(null);
          setAlertMessage(`Detection failed: ${jobData.error || 'Unknown error'}`);
          setAlertType('error');
        }
      },
      (error) => {
        console.error('Error watching job status:', error);
        setDetectingAll(false);
        setDetectionProgress(null);
        setCurrentJobId(null);
      },
    );

    return () => unsubscribe();
  }, [currentJobId]);

  const handleDetectAllImages = async () => {
    if (
      !window.confirm(
        'This will detect cookies in all images in shared storage. This may take a few minutes. Continue?',
      )
    ) {
      return;
    }

    setDetectingAll(true);
    setDetectionProgress('Starting detection job...');
    setError(null);
    setCurrentJobId(null);

    try {
      const detectAllImages = httpsCallable<
        Record<string, never>,
        {
          jobId: string;
          status: string;
          message: string;
        }
      >(functions, 'detectAllImages');

      const result = await detectAllImages({});
      const data = result.data;

      if (data && data.jobId) {
        if (data.status === 'already_running') {
          // A job is already running - start watching it
          setCurrentJobId(data.jobId);
          setDetectingAll(true);
          setDetectionProgress('A detection job is already running. Watching progress...');
        } else {
          // Start watching the new job
          setCurrentJobId(data.jobId);
          setDetectionProgress('Job started, waiting for progress...');
        }
      } else {
        setAlertMessage('Failed to start detection job');
        setAlertType('error');
        setDetectingAll(false);
        setDetectionProgress(null);
      }
    } catch (err) {
      console.error('Failed to start detection job:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to start detection job';
      setAlertMessage(`Failed to start detection: ${errorMessage}`);
      setAlertType('error');
      setDetectingAll(false);
      setDetectionProgress(null);
    }
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

    try {
      const cancelDetectionJob = httpsCallable<
        { jobId: string },
        {
          success: boolean;
          message: string;
        }
      >(functions, 'cancelDetectionJob');

      await cancelDetectionJob({ jobId: currentJobId });
      setAlertMessage(
        'Cancellation requested. The job will stop after processing the current image.',
      );
      setAlertType('info');
    } catch (err) {
      console.error('Failed to cancel detection job:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel detection job';
      setAlertMessage(`Failed to cancel: ${errorMessage}`);
      setAlertType('error');
    }
  };

  if (checkingAuth || checkingAccess) {
    return <div className={styles.container}>Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          {error || 'You do not have admin access. Please contact a site administrator.'}
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <h1 style={{ margin: 0 }}>Create Voting Event</h1>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={() => window.open('/admin/audit/detections', '_blank')}
              className={styles.button}
              style={{
                background: 'rgba(33, 150, 243, 0.8)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem',
                transition: 'background 0.2s',
              }}
            >
              🔍 Image Detection Audit
            </button>
            {detectingAll && currentJobId && (
              <button
                onClick={handleCancelDetection}
                className={styles.button}
                style={{
                  background: 'rgba(244, 67, 54, 0.8)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  transition: 'background 0.2s',
                }}
              >
                ⏹️ Stop Detection
              </button>
            )}
            <button
              onClick={handleDetectAllImages}
              disabled={detectingAll}
              className={styles.button}
              style={{
                background: detectingAll ? 'rgba(76, 175, 80, 0.5)' : 'rgba(76, 175, 80, 0.8)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                cursor: detectingAll ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem',
                transition: 'background 0.2s',
              }}
            >
              {detectingAll ? '🔄 Detecting...' : '🔍 Auto-detect All Images'}
            </button>
          </div>
        </div>
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
        ) : events.length > 0 ? (
          <div className={styles.eventsGrid}>
            {events.map((event) => {
              const images = eventImages[event.id] || [];
              return (
                <div
                  key={event.id}
                  className={`${styles.eventCard} ${deleting === event.id ? styles.deletingItem : ''}`}
                  onClick={() => navigate(`/admin/${event.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/admin/${event.id}`);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`View event: ${event.name}`}
                >
                  <div className={styles.eventHeader}>
                    <h3>{event.name}</h3>
                    <div className={styles.eventActions}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/results/${event.id}`, '_blank');
                        }}
                        className={styles.resultsButton}
                      >
                        See Results
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(event.id);
                        }}
                        className={`${styles.deleteButton} ${deleting === event.id ? styles.deleting : ''}`}
                        disabled={deleting === event.id}
                      >
                        <span
                          className={styles.buttonText}
                          style={{ opacity: deleting === event.id ? 0 : 1 }}
                        >
                          Delete
                        </span>
                        {deleting === event.id && <span className={styles.spinner} />}
                      </button>
                    </div>
                  </div>
                  {images.length > 0 ? (
                    <div className={styles.imageCarousel}>
                      {images.map((imageUrl, index) => {
                        // Create a stable key from URL hash
                        const urlHash = imageUrl.split('/').pop() || imageUrl.slice(-30);
                        return (
                          <img
                            key={`${event.id}-${urlHash}`}
                            src={imageUrl}
                            alt={`${event.name} - ${index + 1}`}
                            className={styles.carouselImage}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className={styles.noImages}>No images yet</div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p>No events found.</p>
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
            role="dialog"
            aria-modal="true"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation();
                handleDeleteCancel();
              }
            }}
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
