import React, { useRef, useEffect, useMemo, useState } from 'react';
import type { Category, Cookie } from '../../../lib/types';
import { CookieViewer, type DetectedCookie } from '../CookieViewer/CookieViewer';
import { useImageStore } from '../../../lib/stores/useImageStore';
import { useCookieStore } from '../../../lib/stores/useCookieStore';
import { watchImageDetectionResults } from '../../../lib/firestore';
import { functions } from '../../../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import styles from './EventSetupWizard.module.css';

interface Baker {
  id: string;
  name: string;
}

interface DetectedCookieWithTag extends DetectedCookie {
  _tagged?: Cookie;
}

interface Props {
  eventId: string;
  currentCategory: Category;
  categories: Category[];
  currentCategoryIndex: number;
  onCategoryChange: (index: number) => void;
  // Passing bakers as props since we need to select them,
  // and EventSetupWizard already fetches them.
  // Alternatively, we could fetch from store here too.
  bakers: Baker[];
  onComplete: () => void;
}

export function CookieTaggingStep({
  eventId,
  currentCategory,
  categories,
  currentCategoryIndex,
  onCategoryChange,
  bakers,
  onComplete,
}: Props) {
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Store Access
  const { images, getDetectionData, watchImage } = useImageStore();
  const { cookies, createCookie, deleteCookie } = useCookieStore();

  // Local UI State
  const [showBakerSelect, setShowBakerSelect] = React.useState(false);
  const [selectedDetectedCookie, setSelectedDetectedCookie] =
    React.useState<DetectedCookieWithTag | null>(null);
  const [bakerSelectPosition, setBakerSelectPosition] = React.useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [liveDetections, setLiveDetections] = useState<DetectedCookie[] | null>(null);

  // Derived Data
  // Find the image entity matching the current category URL
  const imageEntity = useMemo(
    () => Object.values(images).find((img) => img.url === currentCategory.imageUrl),
    [images, currentCategory.imageUrl],
  );

  // If image entity exists, get detections from store.
  // If not, we'll try to fetch them manually (legacy support).
  const [manualDetections, setManualDetections] = React.useState<DetectedCookie[]>([]);

  const detectedCookies = useMemo(() => {
    // 1. Prefer live detections (from image_detections collection) if available
    if (liveDetections) {
      return liveDetections;
    }
    // 2. Fallback to ImageEntity from 'images' collection
    if (imageEntity) {
      return getDetectionData(imageEntity.id) || [];
    }
    // 3. Fallback to manually fetched legacy detections
    return manualDetections;
  }, [liveDetections, imageEntity, getDetectionData, manualDetections]);

  // Watch for live detection updates (from image_detections collection)
  // This listens to the separate detection collection which the cloud function writes to
  useEffect(() => {
    if (currentCategory.imageUrl) {
      const unsub = watchImageDetectionResults(currentCategory.imageUrl, (results) => {
        if (results) {
          setLiveDetections(results as DetectedCookie[]);
        } else {
          setLiveDetections(null);
        }
      });
      return unsub;
    }
  }, [currentCategory.imageUrl]);

  // Setup listener for detections if image exists (e.g. they arrive late)
  const imageId = imageEntity?.id;
  useEffect(() => {
    if (imageId) {
      return watchImage(imageId);
    } else if (currentCategory.imageUrl) {
      // Legacy Fallback: Try to fetch detections directly by URL
      // This handles cases where the ImageEntity doesn't exist in the 'images' collection
      import('../../../lib/firestore').then(({ getImageDetectionResults }) => {
        getImageDetectionResults(currentCategory.imageUrl).then((results) => {
          if (results) {
            setManualDetections(results as DetectedCookie[]);
          }
        });
      });
    }
  }, [imageId, currentCategory.imageUrl, watchImage]); // Re-sub if ID changes

  // Filter cookies for this category
  const taggedCookies = useMemo(
    () => cookies.filter((c) => c.categoryId === currentCategory.id),
    [cookies, currentCategory.id],
  );

  // Merged detections state - moved out of render and memoized for stability
  const mergedDetections = useMemo<DetectedCookieWithTag[]>(() => {
    // 1. Map detected cookies (assign numbers if tagged)
    const mappedDetections = detectedCookies.map((d) => {
      // Find matching tag based on proximity
      const tagged = taggedCookies.find((t) => {
        const dist = Math.sqrt(Math.pow(t.x - d.x, 2) + Math.pow(t.y - d.y, 2));
        return dist < 2; // Tolerance
      });
      // Attach the full tag object to the detection wrapper for easy access
      return { ...d, _tagged: tagged };
    });

    // 2. Add manual tags that don't match any AI detection
    const manualTags = taggedCookies
      .filter((t) => {
        return !detectedCookies.some((d) => {
          const dist = Math.sqrt(Math.pow(t.x - d.x, 2) + Math.pow(t.y - d.y, 2));
          return dist < 2;
        });
      })
      .map(
        (t) =>
          ({
            x: t.x,
            y: t.y,
            width: 10, // Default size for manual tags
            height: 10,
            confidence: 1.0,
            _tagged: t, // Ensure manual tags also have the _tagged property
          }) as DetectedCookieWithTag,
      );

    return [...mappedDetections, ...manualTags];
  }, [detectedCookies, taggedCookies]);

  // Determine selected index for the Viewer prop
  const selectedViewerIndex = useMemo(() => {
    if (!selectedDetectedCookie) return undefined;
    return mergedDetections.indexOf(selectedDetectedCookie);
  }, [selectedDetectedCookie, mergedDetections]);

  // Derived baker ID for the currently selected cookie (if any)
  const currentBakerId = selectedDetectedCookie?._tagged?.bakerId;

  // --- Handlers ---

  // Close baker selection when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showBakerSelect &&
        imageContainerRef.current &&
        !imageContainerRef.current.contains(e.target as Node)
      ) {
        setShowBakerSelect(false);
        setSelectedDetectedCookie(null);
        setBakerSelectPosition(null);
      }
    };

    if (showBakerSelect) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showBakerSelect]);

  const handleRegenerateDetections = async () => {
    if (!currentCategory.imageUrl || isRegenerating) return;

    setIsRegenerating(true);
    try {
      const detectCookiesWithGemini = httpsCallable(functions, 'detectCookiesWithGemini');
      await detectCookiesWithGemini({ imageUrl: currentCategory.imageUrl });
      // The listener on image_detections will pick up the changes automatically
    } catch (error) {
      console.error('Error regenerating detections:', error);
      alert('Failed to regenerate detections. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleBakerSelect = async (bakerId: string) => {
    // We need an image ID. If we have an entity, use it.
    // If NOT (legacy/test event), use a placeholder based on category ID to allow testing to proceed.
    const effectiveImageId = imageEntity?.id || `legacy-image-${currentCategory.id}`;

    if (selectedDetectedCookie && (imageEntity || effectiveImageId)) {
      // Create a "Detection ID" hash if one doesn't exist to strongly link them
      const pseudoId = `${selectedDetectedCookie.x.toFixed(2)}_${selectedDetectedCookie.y.toFixed(2)}`;

      await createCookie(
        eventId,
        currentCategory.id,
        effectiveImageId,
        bakerId,
        pseudoId, // Use pseudo-ID as detectionId
        selectedDetectedCookie.x,
        selectedDetectedCookie.y,
        undefined,
      );
    } else {
      console.warn('Cannot assign baker: missing selectedCookie');
    }
    setShowBakerSelect(false);
    setSelectedDetectedCookie(null);
    setBakerSelectPosition(null);
  };

  const handleRemoveCookie = async (cookieId: string) => {
    await deleteCookie(eventId, cookieId);
  };

  return (
    <div className={styles.stepContent}>
      <div className={styles.categoryNavigation}>
        <button
          onClick={() => onCategoryChange(Math.max(0, currentCategoryIndex - 1))}
          disabled={currentCategoryIndex === 0}
          className={styles.navButton}
        >
          ← Previous
        </button>
        <div className={styles.categoryTitle}>
          <h3>{currentCategory.name}</h3>
          <div className={styles.progressBar}>
            {categories.map((cat, idx) => {
              // Check if OTHER categories are complete by filtering store
              const catCookies = allCookiesForKeyCheck(cookies, cat.id);
              const isCatComplete = catCookies.length > 0;
              return (
                <button
                  type="button"
                  key={cat.id}
                  className={`${styles.progressDot} ${idx === currentCategoryIndex ? styles.active : ''} ${isCatComplete ? styles.tagged : ''}`}
                  title={cat.name}
                  onClick={() => onCategoryChange(idx)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                />
              );
            })}
          </div>
        </div>
        <button
          onClick={() =>
            onCategoryChange(Math.min(categories.length - 1, currentCategoryIndex + 1))
          }
          disabled={currentCategoryIndex === categories.length - 1}
          className={styles.navButton}
        >
          Next →
        </button>
      </div>

      <div className={styles.taggingWorkspace}>
        <div className={styles.imageContainer} ref={imageContainerRef}>
          {!imageEntity && !currentCategory.imageUrl && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                zIndex: 20,
              }}
            >
              Loading image data...
            </div>
          )}

          <CookieViewer
            imageUrl={currentCategory.imageUrl}
            detectedCookies={mergedDetections}
            selectedIndex={selectedViewerIndex} // Highlight the selected cookie
            // Handle clicks
            onCookieClick={(cookie: DetectedCookieWithTag, _, e) => {
              // 'cookie' is the object from mergedDetections
              setSelectedDetectedCookie(cookie);
              setBakerSelectPosition({ x: e.clientX, y: e.clientY });
              setShowBakerSelect(true);
            }}
            // Render Baker Name under cookie with click handler to re-open menu
            renderBottom={({ detected }: { detected: DetectedCookieWithTag }) => {
              if (detected._tagged) {
                const baker = bakers.find((b) => b.id === detected._tagged?.bakerId);
                return (
                  <button
                    type="button"
                    className={styles.bakerLabel}
                    style={{
                      pointerEvents: 'auto',
                      cursor: 'pointer',
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDetectedCookie(detected);
                      setBakerSelectPosition({ x: e.clientX, y: e.clientY });
                      setShowBakerSelect(true);
                    }}
                  >
                    {baker ? baker.name : detected._tagged?.makerName || 'Unknown'}
                  </button>
                );
              }
              return null;
            }}
            imageClassName={styles.taggingImage}
            borderColor="transparent"
            disableZoom={true} // User disabled zoom specifically for tagging
          />

          {showBakerSelect && bakerSelectPosition && (
            <div
              className={styles.bakerDropdown}
              style={{
                position: 'fixed',
                left: bakerSelectPosition.x + 20, // Offset to not block click
                top: bakerSelectPosition.y,
                zIndex: 1000,
                // Ensure it doesn't go off screen
                maxWidth: '300px',
              }}
            >
              <div className={styles.bakerDropdownHeader}>
                <span>Assign Baker</span>
                <button onClick={() => setShowBakerSelect(false)} aria-label="Close">
                  ×
                </button>
              </div>
              <div className={styles.bakerDropdownOptions}>
                {bakers.map((b) => {
                  const isSelected = currentBakerId === b.id;
                  return (
                    <button
                      key={b.id}
                      className={`${styles.bakerOption} ${isSelected ? styles.selected : ''}`}
                      onClick={() => handleBakerSelect(b.id)}
                    >
                      {b.name}
                      {isSelected && <span style={{ marginLeft: 'auto' }}>✓</span>}
                    </button>
                  );
                })}
              </div>

              {/* If this cookie is already tagged, show option to remove tag */}
              {selectedDetectedCookie && selectedDetectedCookie._tagged && (
                <button
                  className={styles.removeOption}
                  onClick={() => {
                    const tagged = selectedDetectedCookie._tagged;
                    if (tagged) handleRemoveCookie(tagged.id);
                    setShowBakerSelect(false);
                  }}
                >
                  Remove Assignment
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <button
          onClick={() => onCategoryChange(Math.max(0, currentCategoryIndex - 1))}
          className={styles.buttonSecondary}
        >
          ← Back
        </button>
        <button
          onClick={handleRegenerateDetections}
          className={styles.buttonSecondary}
          disabled={isRegenerating || !currentCategory.imageUrl}
        >
          {isRegenerating ? 'Scanning...' : 'Regenerate detections'}
        </button>
        <button onClick={onComplete} className={styles.buttonPrimary}>
          Finish & Save
        </button>
      </div>
    </div>
  );
}

// Helper to avoid circular diff in render
function allCookiesForKeyCheck(cookies: Cookie[], catId: string) {
  return cookies.filter((c) => c.categoryId === catId);
}
