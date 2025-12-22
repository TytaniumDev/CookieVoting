import React, { useRef, useEffect } from 'react';
import { type Category, type CookieCoordinate } from '../../../lib/types';
import { CookieViewer, type DetectedCookie } from '../CookieViewer/CookieViewer';
import { calculateSmartLabelPositions, calculateBoundsFromCookie } from '../../../lib/labelPositioning';
import styles from './EventSetupWizard.module.css';

interface Baker {
  id: string;
  name: string;
}

interface Props {
  currentCategory: Category;
  categories: Category[];
  currentCategoryIndex: number;
  onCategoryChange: (index: number) => void;
  bakers: Baker[];
  currentBaker: Baker | null;
  taggedCookies: Record<string, Record<string, CookieCoordinate[]>>;
  detectedCookies: DetectedCookie[];
  loadingDetection: boolean;
  onCookieTag: (cookie: DetectedCookie, bakerId: string) => void;
  onCookieRemove: (cookie: CookieCoordinate) => void;
  onAutoDetect: () => Promise<void>;
  onComplete: () => void;
  categoryCompletion: Record<string, boolean>;
  error?: string | null;
  detecting?: boolean;
}

export function CookieTaggingStep({
  currentCategory,
  categories,
  currentCategoryIndex,
  onCategoryChange,
  bakers,
  currentBaker,
  taggedCookies,
  detectedCookies,
  loadingDetection,
  onCookieTag,
  onCookieRemove,
  onAutoDetect,
  onComplete,
  categoryCompletion,
  error,
  detecting
}: Props) {
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [showBakerSelect, setShowBakerSelect] = React.useState(false);
  const [selectedDetectedCookie, setSelectedDetectedCookie] = React.useState<DetectedCookie | null>(null);
  const [bakerSelectPosition, setBakerSelectPosition] = React.useState<{ x: number, y: number } | null>(null);

  // Close baker selection when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showBakerSelect && imageContainerRef.current && !imageContainerRef.current.contains(e.target as Node)) {
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

  const handlePolygonClick = (e: React.MouseEvent, cookie: DetectedCookie) => {
    setSelectedDetectedCookie(cookie);
    setBakerSelectPosition({ x: e.clientX, y: e.clientY });
    setShowBakerSelect(true);
  };

  const handleBakerSelect = (bakerId: string) => {
    if (selectedDetectedCookie) {
      onCookieTag(selectedDetectedCookie, bakerId);
    }
    setShowBakerSelect(false);
    setSelectedDetectedCookie(null);
    setBakerSelectPosition(null);
  };

  // Helper to extract file identifier from URL
  const generateDetectedCookieId = (imageUrl: string, cookie: { x: number; y: number }): string => {
    const extractFileName = (url: string): string => {
      try {
        const uuidMatch = url.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
        if (uuidMatch) return uuidMatch[1];
        const urlObj = new URL(url.split('?')[0]);
        const pathParts = urlObj.pathname.split('/');
        return pathParts[pathParts.length - 1].split('.')[0];
      } catch {
        return url;
      }
    };
    const fileId = extractFileName(imageUrl);
    const x = Math.round(cookie.x * 10) / 10;
    const y = Math.round(cookie.y * 10) / 10;
    return `detected_${fileId}_${x}_${y}`;
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
              const isComplete = categoryCompletion[cat.id] === true;
              return (
                <button
                  type="button"
                  key={cat.id}
                  className={`${styles.progressDot} ${idx === currentCategoryIndex ? styles.active : ''} ${isComplete ? styles.tagged : ''}`}
                  title={cat.name}
                  onClick={() => onCategoryChange(idx)}
                  aria-label={`Go to category: ${cat.name}`}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                />
              );
            })}
          </div>
        </div>
        <button
          onClick={() => onCategoryChange(Math.min(categories.length - 1, currentCategoryIndex + 1))}
          disabled={currentCategoryIndex === categories.length - 1}
          className={styles.navButton}
        >
          Next →
        </button>
      </div>

      <div className={styles.taggingWorkspace}>
        <div className={styles.imageContainer} ref={imageContainerRef}>
          {loadingDetection && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', zIndex: 20 }}>
              Loading detection...
            </div>
          )}
          
          <CookieViewer
            imageUrl={currentCategory.imageUrl}
            detectedCookies={detectedCookies}
            onCookieClick={(cookie, _, e) => {
              const allTaggedForCategory = Object.values(taggedCookies[currentCategory.id] || {}).flat();
              const cookieId = cookie.id || generateDetectedCookieId(currentCategory.imageUrl, cookie);
              const isTagged = allTaggedForCategory.some(tagged => {
                if (tagged.detectedCookieId === cookieId) return true;
                if (tagged.detectedCookieId) return false;
                const distance = Math.sqrt(Math.pow(tagged.x - cookie.x, 2) + Math.pow(tagged.y - cookie.y, 2));
                return distance < 6;
              });

              if (isTagged) {
                setSelectedDetectedCookie(cookie);
                setBakerSelectPosition({ x: e.clientX, y: e.clientY });
                setShowBakerSelect(true);
              } else {
                handlePolygonClick(e, cookie);
              }
            }}
            className={styles.taggingImage}
            borderColor="transparent"
          />

          {/* Render markers for tagged cookies with smart label positions */}
          {(() => {
            const categoryCookies: Array<{ cookie: CookieCoordinate; baker: Baker | undefined }> = [];
            Object.entries(taggedCookies[currentCategory.id] || {}).forEach(([bakerId, cookies]) => {
              const baker = bakers.find(b => b.id === bakerId);
              cookies.forEach(cookie => categoryCookies.push({ cookie, baker }));
            });

            // Sort top-to-bottom, left-to-right
            const sortedCookies = categoryCookies.sort((a, b) => {
              const yDiff = a.cookie.y - b.cookie.y;
              if (Math.abs(yDiff) < 15) return a.cookie.x - b.cookie.x;
              return yDiff;
            });

            const cookiesWithBounds = sortedCookies.map(({ cookie, baker }) => {
              const matchingDetected = detectedCookies.find(d => {
                const distance = Math.sqrt(Math.pow(d.x - cookie.x, 2) + Math.pow(d.y - cookie.y, 2));
                return distance < 5;
              });
              const bounds = calculateBoundsFromCookie(cookie, matchingDetected || null);
              return { cookie, baker, bounds };
            });

            const labelPositions = calculateSmartLabelPositions(cookiesWithBounds);

            return cookiesWithBounds.map(({ cookie, baker, bounds }, index) => {
              const labelPos = labelPositions[index];
              return (
                <div
                  key={cookie.id}
                  className={styles.cookieMarker}
                  style={{
                    left: `${cookie.x}%`,
                    top: `${cookie.y}%`,
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    border: '2px solid white'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const matchingDetected = detectedCookies.find(d => {
                      const distance = Math.sqrt(Math.pow(d.x - cookie.x, 2) + Math.pow(d.y - cookie.y, 2));
                      return distance < 6;
                    });
                    if (matchingDetected) handlePolygonClick(e, matchingDetected);
                  }}
                >
                  <span className={styles.cookieNumber}>{index + 1}</span>
                  <div 
                    className={`${styles.cookieLabel} ${styles[labelPos]}`}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {baker?.name || 'Unknown Baker'}
                  </div>
                </div>
              );
            });
          })()}

          {showBakerSelect && bakerSelectPosition && (
            <div
              className={styles.bakerSelect}
              style={{
                position: 'fixed',
                left: bakerSelectPosition.x,
                top: bakerSelectPosition.y,
                zIndex: 1000
              }}
            >
              <div className={styles.bakerSelectHeader}>
                Assign Baker
                <button onClick={() => setShowBakerSelect(false)}>×</button>
              </div>
              <div className={styles.bakerSelectOptions}>
                {bakers.map(b => (
                  <button
                    key={b.id}
                    className={styles.bakerOption}
                    onClick={() => handleBakerSelect(b.id)}
                  >
                    {b.name}
                  </button>
                ))}
                <button
                  className={styles.removeOption}
                  onClick={() => {
                    const allTagged = Object.values(taggedCookies[currentCategory.id] || {}).flat();
                    const cookieId = selectedDetectedCookie?.id;
                    const tagged = allTagged.find(t => t.detectedCookieId === cookieId);
                    if (tagged) onCookieRemove(tagged);
                    setShowBakerSelect(false);
                  }}
                >
                  Remove Tag
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <button onClick={() => onCategoryChange(Math.max(0, currentCategoryIndex - 1))} className={styles.buttonSecondary}>
          ← Back
        </button>
        <button
          onClick={onAutoDetect}
          className={styles.buttonSecondary}
          disabled={detecting}
        >
          {detecting ? 'Detecting...' : '✨ Auto-Detect All'}
        </button>
        <button onClick={onComplete} className={styles.buttonPrimary}>
          Finish & Save
        </button>
      </div>
    </div>
  );
}
