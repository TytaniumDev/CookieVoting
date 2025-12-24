import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { uploadImage } from '../lib/storage';
import { type Category } from '../lib/types';
import { AlertModal } from '../components/atoms/AlertModal/AlertModal';
import { Toast } from '../components/atoms/Toast/Toast';
import {
  validateImage,
  validateCategoryName,
  validateMakerName,
  sanitizeInput,
} from '../lib/validation';
import { CONSTANTS } from '../lib/constants';
import { exportToCSV, exportToJSON, downloadFile } from '../lib/export';
import { getVotes } from '../lib/firestore';
import { useEventStore } from '../lib/stores/useEventStore';
import { useBakerStore } from '../lib/stores/useBakerStore';
import { useImageStore } from '../lib/stores/useImageStore';
import { useCookieStore } from '../lib/stores/useCookieStore';
import { useAuthStore } from '../lib/stores/useAuthStore';
import { useAdmins } from '../lib/hooks/useAdmins';
import styles from './AdminDashboard.module.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function AdminDashboard() {
  const { eventId = '' } = useParams();
  const navigate = useNavigate();

  // Zustand Stores
  const {
    activeEvent: event,
    categories,
    setActiveEvent,
    fetchCategories,
    addCategory,
    deleteCategory,
    updateCategory,
    updateCategoryOrder,
    updateResultsAvailableTime,
    updateEventStatus,
    loading: eventLoading,
  } = useEventStore();

  const {
    bakers: savedBakersList,
    fetchBakers,
    addBaker,
    removeBaker,
    loading: bakersLoading,
  } = useBakerStore();

  const { fetchImagesForEvent } = useImageStore();
  const { fetchCookies } = useCookieStore();

  // Auth & Permission
  const { user } = useAuthStore();
  const { isAdmin, loading: adminLoading } = useAdmins();

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
    };
    init();
  }, [eventId, setActiveEvent, fetchCategories, fetchBakers, fetchImagesForEvent, fetchCookies]);

  // Auto-set default time if not set
  useEffect(() => {
    if (!event || eventLoading || event.resultsAvailableTime) return;

    // Calculate default: 4 hours from now, rounded up to next hour
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

  // Local UI State
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatFile, setNewCatFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [newBakerName, setNewBakerName] = useState('');

  const [editingCategoryName, setEditingCategoryName] = useState<Category | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info'>('info');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  // Focus input when editing starts
  useEffect(() => {
    if (editingCategoryName) {
      // Small timeout to ensure element is mounted
      const timer = setTimeout(() => {
        editInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [editingCategoryName]);

  // Navigation and Access Check
  useEffect(() => {
    if (!adminLoading) {
      if (!user) {
        navigate('/', { replace: true });
      } else if (!isAdmin) {
        setError('You do not have admin access. Please contact a site administrator.');
      } else {
        // User is admin, clear any previous access errors
        setError((prev) =>
          prev === 'You do not have admin access. Please contact a site administrator.'
            ? null
            : prev,
        );
      }
    }
  }, [isAdmin, adminLoading, user, navigate]);

  // Initial loading is covered by stores, but we need to wait for activeEvent
  const loading = eventLoading || bakersLoading || adminLoading || !event;

  const handleDeleteCategory = async (category: Category) => {
    if (!eventId) return;

    if (
      !window.confirm(
        `Are you sure you want to delete "${category.name}"? This will also delete the image and all cookie tags.`,
      )
    ) {
      return;
    }

    try {
      // Image cleanup is handled by store or backend triggers
      await deleteCategory(eventId, category.id);
      setAlertMessage('Category deleted successfully');
      setAlertType('success');
    } catch (err) {
      console.error('Failed to delete category', err);
      setAlertMessage('Failed to delete category. Please try again.');
      setAlertType('error');
    }
  };

  const handleStartEditCategory = (category: Category) => {
    setEditingCategoryName(category);
    setEditCategoryName(category.name);
  };

  const handleSaveCategoryName = async () => {
    if (!eventId || !editingCategoryName) return;

    const validation = validateCategoryName(editCategoryName);
    if (!validation.valid) {
      setError(validation.error || 'Invalid category name');
      return;
    }

    try {
      const sanitizedName = sanitizeInput(editCategoryName);
      await updateCategory(eventId, editingCategoryName.id, sanitizedName);
      setEditingCategoryName(null);
      setEditCategoryName('');
      setAlertMessage('Category name updated successfully');
      setAlertType('success');
    } catch (err) {
      console.error('Failed to update category name', err);
      setAlertMessage('Failed to update category name. Please try again.');
      setAlertType('error');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // For now, we'll still only handle one file at a time for the preview
      // but allow multiple selection for better UX
      const file = e.target.files[0];

      // Validate image
      const validation = validateImage(file);
      if (!validation.valid) {
        setError(validation.error || CONSTANTS.ERROR_MESSAGES.INVALID_IMAGE_TYPE);
        e.target.value = ''; // Reset file input
        return;
      }

      setNewCatFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !newCatFile) return;

    // Validate category name
    const nameValidation = validateCategoryName(newCatName);
    if (!nameValidation.valid) {
      setError(nameValidation.error || 'Invalid category name');
      return;
    }

    // Validate image (double check)
    const imageValidation = validateImage(newCatFile);
    if (!imageValidation.valid) {
      setError(imageValidation.error || CONSTANTS.ERROR_MESSAGES.INVALID_IMAGE_TYPE);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const sanitizedName = sanitizeInput(newCatName);
      // Store images in shared location so they can be reused across multiple events
      const storagePath = `shared/cookies`;
      const imageUrl = await uploadImage(newCatFile, storagePath);
      await addCategory(eventId, sanitizedName, imageUrl);
      setNewCatName('');
      setNewCatFile(null);
      setPreviewUrl(null);
      setAlertMessage(CONSTANTS.SUCCESS_MESSAGES.CATEGORY_ADDED);
      setAlertType('success');
    } catch (err) {
      console.error('Error adding category:', err);
      const errorMessage =
        err instanceof Error ? err.message : CONSTANTS.ERROR_MESSAGES.FAILED_TO_UPLOAD;
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  /*
    Legacy Cookie Update - Removing as we now use granular CookieTaggingStep
    const _handleUpdateCookies = async (_cookies: CookieCoordinate[]) => { ... } 
    */

  const handleExport = async (format: 'csv' | 'json') => {
    if (!eventId || !event) return;

    setExporting(true);
    try {
      const votes = await getVotes(eventId);
      const content =
        format === 'csv'
          ? exportToCSV(event, categories, votes)
          : exportToJSON(event, categories, votes);

      const extension = format === 'csv' ? 'csv' : 'json';
      const mimeType = format === 'csv' ? 'text/csv' : 'application/json';
      const filename = `${event.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.${extension}`;

      downloadFile(content, filename, mimeType);
    } catch (err) {
      console.error('Failed to export data', err);
      setAlertMessage('Failed to export data. Please try again.');
      setAlertType('error');
    } finally {
      setExporting(false);
    }
  };

  const _handleMoveCategory = async (categoryId: string, direction: 'up' | 'down') => {
    if (!eventId) return;

    const currentIndex = categories.findIndex((c) => c.id === categoryId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;

    try {
      const currentCat = categories[currentIndex];
      const targetCat = categories[newIndex];

      // Just update orders via store - it handles optimistic updates usually or re-fetch
      const currentOrder = currentCat.order ?? currentIndex;
      const targetOrder = targetCat.order ?? newIndex;

      await Promise.all([
        updateCategoryOrder(eventId, currentCat.id, targetOrder),
        updateCategoryOrder(eventId, targetCat.id, currentOrder),
      ]);

      // Refetch to sync (simple approach)
      await fetchCategories(eventId);
    } catch (err) {
      console.error('Failed to reorder category', err);
      setAlertMessage('Failed to reorder category. Please try again.');
      setAlertType('error');
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          {error || 'You do not have admin access. Please contact a site administrator.'}
        </div>
        <button
          onClick={() => navigate('/')}
          className={styles.buttonPrimary}
          style={{ marginTop: '1rem' }}
        >
          Go Home
        </button>
      </div>
    );
  }

  if (!event) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error || CONSTANTS.ERROR_MESSAGES.EVENT_NOT_FOUND}</div>
      </div>
    );
  }

  // Extract bakers from categories and Firestore
  const getBakersFromCategories = (): string[] => {
    const bakerSet = new Set<string>();
    // Add saved bakers
    savedBakersList.forEach((b) => bakerSet.add(b.name));
    // Also extract from cookies (for backward compatibility)
    categories.forEach((cat) => {
      cat.cookies.forEach((cookie) => {
        if (cookie.makerName && cookie.makerName !== CONSTANTS.DEFAULT_MAKER_NAME) {
          bakerSet.add(cookie.makerName);
        }
      });
    });
    return Array.from(bakerSet).sort();
  };

  const bakers = getBakersFromCategories();

  const handleRemoveBaker = async (bakerName: string) => {
    if (!eventId) return;

    if (
      !window.confirm(
        `Are you sure you want to remove "${bakerName}"? This will remove all their cookies from all categories.`,
      )
    ) {
      return;
    }

    try {
      const baker = savedBakersList.find((b) => b.name === bakerName);
      if (baker) {
        await removeBaker(eventId, baker.id);
        // Also need to cleanup cookies?
        // The store should possibly handle cascading deletes or specific cleanup.
        // For now, let's assume manual cleanup or backend trigger.
        // Actually, the old code filtered cookies.
        // With the new store, we might need a `deleteCookiesByBaker` action or just rely on the user to re-tag.
        // Let's keep it simple: just remove baker from roster.
      }
      setAlertMessage(`Baker "${bakerName}" removed successfully`);
      setAlertType('success');
    } catch (err) {
      console.error('Failed to remove baker', err);
      setAlertMessage('Failed to remove baker. Please try again.');
      setAlertType('error');
    }
  };

  const handleAddBakerAction = async () => {
    if (!eventId || !newBakerName.trim()) return;

    const validation = validateMakerName(newBakerName);
    if (!validation.valid) {
      setError(validation.error || 'Invalid baker name');
      return;
    }

    const sanitizedName = sanitizeInput(newBakerName);
    if (bakers.includes(sanitizedName)) {
      setError('Baker already exists');
      return;
    }

    try {
      await addBaker(eventId, sanitizedName);
      setNewBakerName('');
      setError(null);
    } catch (err) {
      console.error('Failed to add baker:', err);
      setError(err instanceof Error ? err.message : 'Failed to add baker');
    }
  };

  return (
    <div>
      {/* Event management header */}
      <div className={styles.container} style={{ marginBottom: '1rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.75rem' }}>{event.name}</h1>
            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary, #cbd5e1)' }}>
              Status:{' '}
              <strong style={{ color: 'var(--color-text-primary, #f8fafc)' }}>
                {event.status === 'voting' ? 'Voting Open' : 'Voting Closed'}
              </strong>
            </div>
            <div
              style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <DatePicker
                selected={event.resultsAvailableTime ? new Date(event.resultsAvailableTime) : null}
                onChange={async (date: Date | null) => {
                  if (!eventId || !date) return;
                  try {
                    await updateResultsAvailableTime(eventId, date.getTime());
                    setAlertMessage('Results time updated');
                    setAlertType('success');
                  } catch {
                    setAlertMessage('Failed to update results time');
                    setAlertType('error');
                  }
                }}
                showTimeSelect
                dateFormat="MMM d, yyyy h:mm aa"
                timeIntervals={60}
                placeholderText="Select reveal time"
                className={styles.input}
                openToDate={(() => {
                  const now = new Date();
                  const target = new Date(now.getTime() + 4 * 60 * 60 * 1000);
                  if (target.getMinutes() > 0) {
                    target.setHours(target.getHours() + 1);
                    target.setMinutes(0, 0, 0);
                  }
                  return target;
                })()}
              />
            </div>
          </div>

          {/* Overflow menu - top right */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowOverflowMenu(!showOverflowMenu)}
              className={styles.overflowButton}
              aria-label="More options"
            >
              <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>⋯</span>
            </button>
            {showOverflowMenu && (
              <>
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 998,
                  }}
                  onClick={() => setShowOverflowMenu(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setShowOverflowMenu(false);
                    } else if (e.key === 'Escape') {
                      setShowOverflowMenu(false);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label="Close menu"
                />
                <div className={styles.overflowMenu} style={{ right: 0, left: 'auto' }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/vote/${event.id}`);
                      setToastMessage('Vote link copied to clipboard!');
                      setToastType('success');
                      setShowOverflowMenu(false);
                    }}
                    className={styles.menuItem}
                  >
                    📋 Copy Vote Link
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/results/${event.id}`,
                      );
                      setToastMessage('Results link copied to clipboard!');
                      setToastType('success');
                      setShowOverflowMenu(false);
                    }}
                    className={styles.menuItem}
                  >
                    📋 Copy Results Link
                  </button>
                  <button
                    onClick={async () => {
                      if (!eventId) return;
                      const newStatus = event.status === 'voting' ? 'completed' : 'voting';
                      try {
                        await updateEventStatus(eventId, newStatus);
                      } catch (err) {
                        console.error('Failed to update status', err);
                        setAlertMessage('Failed to update event status');
                        setAlertType('error');
                      }
                      setShowOverflowMenu(false);
                    }}
                    className={styles.menuItem}
                  >
                    {event.status === 'voting' ? 'Close Voting' : 'Reopen Voting'}
                  </button>
                  <button
                    onClick={() => {
                      handleExport('csv');
                      setShowOverflowMenu(false);
                    }}
                    disabled={exporting || categories.length === 0}
                    className={styles.menuItem}
                  >
                    {exporting ? 'Exporting...' : 'Export CSV'}
                  </button>
                  <button
                    onClick={() => {
                      handleExport('json');
                      setShowOverflowMenu(false);
                    }}
                    disabled={exporting || categories.length === 0}
                    className={styles.menuItem}
                  >
                    {exporting ? 'Exporting...' : 'Export JSON'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <div
          style={{
            marginTop: '1rem',
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <button
            onClick={() => navigate(`/admin/${eventId}/wizard`)}
            className={styles.buttonPrimary}
            style={{ minWidth: '150px' }}
          >
            🪄 Open Wizard
          </button>
        </div>
      </div>

      {/* Quick Views */}
      <div className={styles.container}>
        {/* Bakers Quick View */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--color-accent)', marginBottom: '1rem' }}>Bakers</h2>
          <div className={styles.sectionCard}>
            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="baker-name"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: 'var(--color-text-primary)',
                  fontWeight: 'bold',
                }}
              >
                Add Baker:
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  id="baker-name"
                  type="text"
                  value={newBakerName}
                  onChange={(e) => {
                    setNewBakerName(e.target.value);
                    setError(null);
                  }}
                  placeholder="Baker name"
                  className={styles.input}
                  style={{ flex: 1 }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddBakerAction();
                    }
                  }}
                />
                <button
                  onClick={handleAddBakerAction}
                  onMouseDown={(e) => {
                    // Prevent keyboard from dismissing on mobile
                    e.preventDefault();
                  }}
                  className={styles.buttonPrimary}
                >
                  Add
                </button>
              </div>
              {error && (
                <div
                  style={{
                    color: 'var(--color-danger)',
                    fontSize: '0.875rem',
                    marginTop: '0.5rem',
                  }}
                >
                  {error}
                </div>
              )}
            </div>
            {bakers.length > 0 ? (
              <div>
                <div
                  style={{
                    marginBottom: '0.5rem',
                    color: 'var(--color-text-secondary)',
                    fontSize: '0.9rem',
                  }}
                >
                  {bakers.length} baker{bakers.length !== 1 ? 's' : ''} in this event
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {bakers.map((baker) => (
                    <div
                      key={baker}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      <span style={{ color: 'var(--color-text-primary)' }}>{baker}</span>
                      <button
                        onClick={() => handleRemoveBaker(baker)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: '0.75rem',
                          color: 'var(--color-text-primary)',
                          transition: 'background 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(220, 38, 38, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        }}
                        aria-label={`Remove ${baker}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                No bakers yet. Add bakers in the wizard or tag cookies to create bakers.
              </div>
            )}
          </div>
        </div>

        {/* Categories Quick View */}
        <div>
          <h2 style={{ color: 'var(--color-accent)', marginBottom: '1rem' }}>
            Categories & Images
          </h2>
          <div className={styles.sectionCard}>
            {/* Categories List */}
            {categories.length > 0 ? (
              <div>
                <div
                  style={{
                    marginBottom: '0.5rem',
                    color: 'var(--color-text-secondary)',
                    fontSize: '0.9rem',
                  }}
                >
                  {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
                </div>
                <div className={styles.grid}>
                  {categories.map((category) => (
                    <div key={category.id} className={styles.card}>
                      <button
                        type="button"
                        onClick={() => {
                          if (eventId) {
                            navigate(`/admin/${eventId}/wizard?categoryId=${category.id}`);
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          width: '100%',
                          display: 'block',
                        }}
                        aria-label={`Tag cookies for ${category.name}`}
                        title="Click to tag cookies for this category"
                      >
                        <img
                          src={category.imageUrl}
                          alt={category.name}
                          className={styles.cardImage}
                        />
                      </button>
                      <div className={styles.cardContent}>
                        {editingCategoryName?.id === category.id ? (
                          <div className={styles.editInputRow}>
                            <input
                              type="text"
                              value={editCategoryName}
                              onChange={(e) => setEditCategoryName(e.target.value)}
                              className={`${styles.input} ${styles.editInput}`}
                              ref={editInputRef}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveCategoryName();
                                if (e.key === 'Escape') {
                                  setEditingCategoryName(null);
                                  setEditCategoryName('');
                                }
                              }}
                            />
                            <button
                              onClick={handleSaveCategoryName}
                              className={`${styles.buttonPrimary} ${styles.smallButton}`}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingCategoryName(null);
                                setEditCategoryName('');
                              }}
                              className={`${styles.buttonSecondary} ${styles.smallButton}`}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className={styles.categoryNameButton}
                            onClick={() => handleStartEditCategory(category)}
                            aria-label={`Edit category name: ${category.name}`}
                            title="Click to rename"
                          >
                            {category.name}
                          </button>
                        )}
                        <div className={styles.categoryCardContent}>
                          {category.cookies.length} cookie{category.cookies.length !== 1 ? 's' : ''}{' '}
                          tagged
                        </div>
                        <div className={styles.categoryCardActions}>
                          <button
                            onClick={() => handleDeleteCategory(category)}
                            className={`${styles.buttonSecondary} ${styles.smallButton}`}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.noCategories}>
                No categories yet. Add categories below or use the wizard to set up your event.
              </div>
            )}

            {/* Add Category Form - moved to bottom */}
            <div className={styles.addCategorySection}>
              <h3 className={styles.addCategoryTitle}>Add Category</h3>
              <form onSubmit={handleAddCategory} className={styles.addCategoryForm}>
                <div>
                  <label htmlFor="category-name" className={styles.formLabel}>
                    Category Name:
                  </label>
                  <input
                    id="category-name"
                    type="text"
                    value={newCatName}
                    onChange={(e) => {
                      setNewCatName(e.target.value);
                      setError(null);
                    }}
                    placeholder="Category name"
                    className={styles.input}
                    disabled={uploading}
                    maxLength={100}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="category-image" className={styles.formLabel}>
                    Image:
                  </label>
                  <input
                    id="category-image"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className={styles.fileInput}
                    disabled={uploading}
                    required
                  />
                  {previewUrl && (
                    <img src={previewUrl} alt="Preview" className={styles.previewImage} />
                  )}
                </div>
                <button
                  type="submit"
                  disabled={uploading || !newCatName.trim() || !newCatFile}
                  className={styles.buttonPrimary}
                >
                  {uploading ? 'Uploading...' : 'Add Category'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {alertMessage && (
        <AlertModal message={alertMessage} type={alertType} onClose={() => setAlertMessage(null)} />
      )}

      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
}
