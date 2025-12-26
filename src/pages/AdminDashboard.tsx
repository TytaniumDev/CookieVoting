import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEventStore } from '../lib/stores/useEventStore';
import { useBakerStore } from '../lib/stores/useBakerStore';
import { useImageStore } from '../lib/stores/useImageStore';
import { useCookieStore } from '../lib/stores/useCookieStore';
import { useAuthStore } from '../lib/stores/useAuthStore';
import { useAdmins } from '../lib/hooks/useAdmins';

// New modular admin components
import {
  VotingControls,
  ResultsTimeManager,
  BakerManager,
  CategoryManager,
  CategoryTaggingNavigator,
} from '../components/organisms/admin';

import { AlertModal } from '../components/atoms/AlertModal/AlertModal';
import styles from './AdminDashboard.module.css';

type TabId = 'overview' | 'bakers' | 'categories' | 'tagging';

export default function AdminDashboard() {
  const { eventId = '' } = useParams();
  const navigate = useNavigate();

  // Zustand Stores
  const {
    activeEvent: event,
    setActiveEvent,
    fetchCategories,
    updateResultsAvailableTime,
    loading: eventLoading,
  } = useEventStore();

  const { fetchBakers } = useBakerStore();
  const { fetchImagesForEvent } = useImageStore();
  const { fetchCookies } = useCookieStore();

  // Auth & Permission
  const { user } = useAuthStore();
  const { isAdmin, loading: adminLoading } = useAdmins();

  // UI State
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info'>('info');
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Initialization
  useEffect(() => {
    if (!eventId) return;
    const init = async () => {
      await Promise.all([
        setActiveEvent(eventId),
        fetchCategories(eventId),
        fetchBakers(eventId),
        fetchImagesForEvent(eventId),
        fetchCookies(eventId),
      ]);
      setInitialLoadComplete(true);
    };
    init();
  }, [eventId, setActiveEvent, fetchCategories, fetchBakers, fetchImagesForEvent, fetchCookies]);

  // Auto-set default time if not set
  useEffect(() => {
    if (!event || eventLoading || event.resultsAvailableTime) return;

    const now = new Date();
    const target = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    if (target.getMinutes() > 0 || target.getSeconds() > 0) {
      target.setHours(target.getHours() + 1);
      target.setMinutes(0, 0, 0);
    }

    updateResultsAvailableTime(event.id, target.getTime()).catch((err) => {
      console.error('Failed to auto-set default time', err);
    });
  }, [event, eventLoading, updateResultsAvailableTime]);

  // Navigation and Access Check
  useEffect(() => {
    if (!adminLoading) {
      if (!user) {
        navigate('/', { replace: true });
      } else if (!isAdmin) {
        setAlertMessage('You do not have admin access. Please contact a site administrator.');
        setAlertType('error');
      }
    }
  }, [isAdmin, adminLoading, user, navigate]);

  const handleCategoryClick = useCallback(() => {
    setActiveTab('tagging');
  }, []);

  // Only show loading on initial load, not on subsequent fetches from child components
  const loading = !initialLoadComplete || adminLoading || !event;

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'bakers', label: 'Bakers', icon: '👩‍🍳' },
    { id: 'categories', label: 'Categories', icon: '🍪' },
    { id: 'tagging', label: 'Tag Cookies', icon: '🏷️' },
  ];

  return (
    <div className={styles.dashboardContainer}>
      {/* Alert Modal */}
      {alertMessage && (
        <AlertModal message={alertMessage} type={alertType} onClose={() => setAlertMessage(null)} />
      )}

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <button onClick={() => navigate('/admin')} className={styles.backButton}>
              ← Back
            </button>
            <h1 className={styles.eventTitle}>{event.name}</h1>
          </div>
          <div className={styles.headerRight}>
            <VotingControls eventId={eventId} />
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className={styles.tabNav}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            <span className={styles.tabLabel}>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {activeTab === 'overview' && (
          <div className={styles.overviewGrid}>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>📅 Results Reveal Time</h2>
              <ResultsTimeManager eventId={eventId} />
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>ℹ️ Event Info</h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Status</span>
                  <span className={styles.infoValue}>
                    {event.status === 'voting' ? '🟢 Voting Open' : '🔴 Voting Closed'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Event ID</span>
                  <span className={styles.infoValue}>{eventId}</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'bakers' && (
          <section className={styles.tabContent}>
            <BakerManager eventId={eventId} />
          </section>
        )}

        {activeTab === 'categories' && (
          <section className={styles.tabContent}>
            <CategoryManager eventId={eventId} onCategoryClick={handleCategoryClick} />
          </section>
        )}

        {activeTab === 'tagging' && (
          <section className={styles.taggingContent}>
            <CategoryTaggingNavigator eventId={eventId} />
          </section>
        )}
      </main>
    </div>
  );
}
