import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../lib/hooks/useAdminAuth';
import { useDetectionJob } from '../lib/hooks/useDetectionJob';
import { getAllStoredImages, watchAllImageDetections } from '../lib/firestore';
import {
  CookieViewer,
  type DetectedCookie,
} from '../components/organisms/CookieViewer/CookieViewer';
import { ExtractedCookieCard } from '../components/atoms/ExtractedCookieCard';
import { extractCookiesWithSharp, type ExtractedCookie } from '../lib/detection';
import styles from './ImageDetectionAudit.module.css';

interface ImageDetection {
  id: string;
  filePath: string;
  imageUrl: string;
  detectedCookies: DetectedCookie[];
  count: number;
  detectedAt?: unknown;
  contentType?: string;
  status?: string; // 'detected', 'processing', 'completed', 'error', 'missing'
  progress?: string;
  extractedCookies?: ExtractedCookie[]; // Individual extracted cookie images
  geminiGeneratedImageUrl?: string | null; // Debug: Gemini-generated image
}

interface StoredImage {
  path: string;
  url: string;
  name: string;
}

export default function ImageDetectionAudit() {
  const navigate = useNavigate();

  // Use admin auth hook
  const { isAdmin, isLoading: authLoading, error: authError } = useAdminAuth({
    redirectIfNotAuth: '/',
  });

  // Use detection job hook for regeneration
  const { triggerSingleDetection } = useDetectionJob({
    enabled: isAdmin,
    onError: (errorMsg) => setError(errorMsg),
  });

  const [storedImages, setStoredImages] = useState<StoredImage[]>([]);
  const [dbDetections, setDbDetections] = useState<ImageDetection[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [extractingId, setExtractingId] = useState<string | null>(null);
  const [showExtracted, setShowExtracted] = useState<Record<string, boolean>>({});
  const [showDebugImage, setShowDebugImage] = useState<Record<string, boolean>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  // Load stored images
  useEffect(() => {
    if (authLoading || !isAdmin) return;

    const loadImages = async () => {
      try {
        setLoadingImages(true);
        const images = await getAllStoredImages();
        setStoredImages(images);
      } catch {
        setError('Failed to load images from storage.');
      } finally {
        setLoadingImages(false);
      }
    };

    loadImages();
  }, [authLoading, isAdmin, refreshKey]);

  // Subscribe to DB detections
  useEffect(() => {
    if (authLoading || !isAdmin) return;

    const unsubscribe = watchAllImageDetections((detections) => {
      // Cast to match our interface including optional status/progress
      setDbDetections(detections as ImageDetection[]);
    });

    return () => unsubscribe();
  }, [authLoading, isAdmin, refreshKey]);

  // Merge Data
  const detections = useMemo(() => {
    if (storedImages.length === 0 && dbDetections.length === 0) return [];

    // Map DB detections for lookup
    const detectionMap = new Map<string, ImageDetection>();
    // Map strictly by filePath
    dbDetections.forEach((d) => detectionMap.set(d.filePath, d));
    // Also map by filename if needed as fallback (handle cases where stored path prefixes differ slightly)
    dbDetections.forEach((d) => {
      const filename = d.filePath.split('/').pop();
      if (filename) detectionMap.set(filename, d);
    });

    // Create base list from stored images
    const merged = storedImages.map((img) => {
      // Try exact path match first
      let detection = detectionMap.get(img.path);

      // Try name match if path fails
      if (!detection) {
        detection = detectionMap.get(img.name);
      }

      // If we found a detection record
      if (detection) {
        return {
          ...detection,
          imageUrl: img.url, // Prefer storage URL as it might be fresher or have token
          // If it has status, use it. If it has cookies but no status, it's 'detected'.
          status:
            detection.status || (detection.detectedCookies.length > 0 ? 'detected' : 'unknown'),
        };
      }

      // No detection record found -> 'missing'
      return {
        id: img.path.replace(/\//g, '_').replace(/\./g, '_'),
        filePath: img.path,
        imageUrl: img.url,
        detectedCookies: [],
        count: 0,
        status: 'missing',
      };
    });

    // dbDetections logic removed to prevent showing images that don't exist in storage

    // Sort: Processing -> Missing -> Detected (Recent first)
    return merged.sort((a, b) => {
      // Processing first
      if (a.status === 'processing' && b.status !== 'processing') return -1;
      if (a.status !== 'processing' && b.status === 'processing') return 1;

      // Missing second
      if (a.status === 'missing' && b.status !== 'missing') return -1;
      if (a.status !== 'missing' && b.status === 'missing') return 1;

      // Then by time
      const getTime = (d: ImageDetection): number => {
        if (!d.detectedAt) return 0;
        if (
          typeof d.detectedAt === 'object' &&
          d.detectedAt !== null &&
          'toMillis' in d.detectedAt &&
          typeof (d.detectedAt as { toMillis: () => number }).toMillis === 'function'
        ) {
          return (d.detectedAt as { toMillis: () => number }).toMillis();
        }
        if (
          typeof d.detectedAt === 'object' &&
          d.detectedAt !== null &&
          'seconds' in d.detectedAt
        ) {
          return (d.detectedAt as { seconds: number }).seconds * 1000;
        }
        if (typeof d.detectedAt === 'number') {
          return d.detectedAt;
        }
        return 0;
      };

      return getTime(b) - getTime(a);
    });
  }, [storedImages, dbDetections]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleCookieClick = (_cookie: DetectedCookie, _index: number, event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const getDetectionJson = (detection: ImageDetection): string => {
    return JSON.stringify(detection.detectedCookies, null, 2);
  };

  const handleCopyJson = async (detection: ImageDetection) => {
    try {
      const json = getDetectionJson(detection);
      await navigator.clipboard.writeText(json);
      setCopiedId(detection.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError('Failed to copy JSON to clipboard');
    }
  };

  const handleDownloadJson = (detection: ImageDetection) => {
    try {
      const json = getDetectionJson(detection);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const filename = `${detection.filePath.split('/').pop() || 'detection'}-cookies.json`;
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to download JSON file');
    }
  };

  const handleRegenerate = async (detection: ImageDetection) => {
    // Trigger regeneration via hook - UI will update via Firestore subscription
    await triggerSingleDetection(detection.imageUrl);
  };

  const handleExtract = async (detection: ImageDetection) => {
    setExtractingId(detection.id);
    setError(null);
    try {
      const result = await extractCookiesWithSharp(detection.imageUrl, detection.filePath);
      console.log('[Audit] Extraction complete:', result);
      // Update local state to show extracted cookies and gemini debug image
      setDbDetections((prev) =>
        prev.map((d) =>
          d.id === detection.id
            ? {
              ...d,
              // Preserver existing detectedCookies if result.cookies doesn't represent them (extractedCookies are different)
              detectedCookies: result.cookies.length > 0 ? d.detectedCookies : d.detectedCookies,
              extractedCookies: result.cookies,
              geminiGeneratedImageUrl: result.geminiImageUrl,
            }
            : d,
        ),
      );
      setShowExtracted((prev) => ({ ...prev, [detection.id]: true }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract cookies');
    } finally {
      setExtractingId(null);
    }
  };

  const toggleShowExtracted = (id: string) => {
    setShowExtracted((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleShowDebugImage = (id: string) => {
    setShowDebugImage((prev) => ({ ...prev, [id]: !prev[id] }));
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
      <div className={styles.header}>
        <h1>Image Detection Audit</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handleRefresh} className={styles.jsonButton}>
            🔄 Refresh Data
          </button>
          <button onClick={() => navigate('/admin')} className={styles.backButton}>
            ← Back to Admin
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loadingImages ? (
        <div className={styles.loading}>Loading images...</div>
      ) : detections.length === 0 ? (
        <div className={styles.empty}>
          <p>No images found in shared/cookies/.</p>
          <p className={styles.emptySubtext}>
            Upload images to the shared folder to see them here.
          </p>
        </div>
      ) : (
        <>
          <div className={styles.summary}>
            <p>
              Found <strong>{detections.length}</strong> image{detections.length !== 1 ? 's' : ''}
            </p>
            <p className={styles.summarySubtext}>
              Total cookies detected:{' '}
              <strong>{detections.reduce((sum, d) => sum + d.count, 0)}</strong>
              {' • '}
              Missing: <strong>{detections.filter((d) => d.status === 'missing').length}</strong>
              {' • '}
              Processing:{' '}
              <strong>{detections.filter((d) => d.status === 'processing').length}</strong>
            </p>
          </div>
          <div className={styles.grid}>
            {detections.map((detection) => (
              <div
                key={detection.id}
                className={`${styles.card} ${detection.status === 'missing' ? styles.pendingCard : ''}`}
              >
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    {detection.filePath.split('/').pop() || 'Unknown'}
                  </h3>
                  <div className={styles.cardMeta}>
                    {detection.status === 'missing' ? (
                      <span
                        className={styles.badge}
                        style={{ backgroundColor: '#ef4444', color: 'white' }}
                      >
                        Missing Detection
                      </span>
                    ) : detection.status === 'processing' ? (
                      <span
                        className={styles.badge}
                        style={{ backgroundColor: '#3b82f6', color: 'white' }}
                      >
                        Creating Detection...
                      </span>
                    ) : (
                      <span className={styles.badge}>
                        {detection.count} cookie{detection.count !== 1 ? 's' : ''}
                      </span>
                    )}

                    {detection.detectedAt && (
                      <span className={styles.timestamp}>
                        {typeof detection.detectedAt === 'object' &&
                          detection.detectedAt !== null &&
                          'toDate' in detection.detectedAt &&
                          typeof (detection.detectedAt as { toDate: () => Date }).toDate ===
                          'function'
                          ? (detection.detectedAt as { toDate: () => Date })
                            .toDate()
                            .toLocaleString()
                          : typeof detection.detectedAt === 'object' &&
                            detection.detectedAt !== null &&
                            'seconds' in detection.detectedAt
                            ? new Date(
                              (detection.detectedAt as { seconds: number }).seconds * 1000,
                            ).toLocaleString()
                            : typeof detection.detectedAt === 'number'
                              ? new Date(detection.detectedAt).toLocaleString()
                              : 'Unknown date'}
                      </span>
                    )}
                  </div>
                </div>
                <div className={styles.imageContainer}>
                  <CookieViewer
                    imageUrl={detection.imageUrl}
                    detectedCookies={detection.detectedCookies}
                    onCookieClick={handleCookieClick}
                    disableZoom={true} // Disable zoom as requested
                    borderColor={
                      detection.status === 'missing'
                        ? 'rgba(255, 0, 0, 0.5)'
                        : 'rgba(255, 255, 255, 0.5)'
                    }
                  />
                  {/* Overlay for processing/regenerating */}
                  {detection.status === 'processing' && (
                    <div className={styles.loadingOverlay}>
                      <div style={{ textAlign: 'center' }}>
                        <div>Scanning...</div>
                        <div
                          style={{ fontSize: '0.9rem', fontWeight: 'normal', marginTop: '0.5rem' }}
                        >
                          {detection.progress || 'Processing...'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Debug: Gemini-Generated Image Overlay */}
                {showDebugImage[detection.id] && detection.geminiGeneratedImageUrl && (
                  <div className={styles.debugImageContainer} style={{ padding: '1rem', borderTop: '1px solid #333' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#e879f9' }}>
                      👻 Gemini-Generated Transparent Image
                    </h4>
                    <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: '#9ca3af' }}>
                      This is the raw source image generated by Gemini for extraction. It should show cookies on a transparent background.
                    </p>
                    <img
                      src={detection.geminiGeneratedImageUrl}
                      alt="Gemini generated transparent cookies"
                      style={{
                        maxWidth: '100%',
                        borderRadius: '4px',
                        background: 'repeating-conic-gradient(#333 0% 25%, #222 0% 50%) 50% / 16px 16px',
                        border: '1px solid #444'
                      }}
                    />
                  </div>
                )}
                <div className={styles.cardFooter}>
                  <div className={styles.filePath}>
                    <strong>Path:</strong> {detection.filePath}
                  </div>
                  <div className={styles.jsonActions}>
                    <button
                      onClick={() => handleRegenerate(detection)}
                      className={styles.jsonButton}
                      disabled={detection.status === 'processing'}
                      style={{
                        backgroundColor: detection.status === 'processing' ? '#9ca3af' : '#3b82f6',
                        color: 'white',
                        border: 'none',
                      }}
                    >
                      {detection.status === 'processing' ? 'Processing...' : '🔄 Regenerate'}
                    </button>
                    <button
                      onClick={() => handleExtract(detection)}
                      className={styles.jsonButton}
                      disabled={extractingId === detection.id || detection.status === 'processing'}
                      style={{
                        backgroundColor: extractingId === detection.id ? '#9ca3af' : '#10b981',
                        color: 'white',
                        border: 'none',
                      }}
                    >
                      {extractingId === detection.id ? '⏳ Extracting...' : '✂️ Extract Cookies'}
                    </button>
                    {detection.extractedCookies && detection.extractedCookies.length > 0 && (
                      <button
                        onClick={() => toggleShowExtracted(detection.id)}
                        className={styles.jsonButton}
                        style={{
                          backgroundColor: showExtracted[detection.id] ? '#6366f1' : '#8b5cf6',
                          color: 'white',
                          border: 'none',
                        }}
                      >
                        {showExtracted[detection.id] ? '🔼 Hide Sprites' : '🔽 Show Sprites'}
                      </button>
                    )}

                    {detection.geminiGeneratedImageUrl && (
                      <button
                        onClick={() => toggleShowDebugImage(detection.id)}
                        className={styles.jsonButton}
                        style={{
                          backgroundColor: showDebugImage[detection.id] ? '#d946ef' : '#e879f9',
                          color: 'white',
                          border: 'none',
                        }}
                      >
                        {showDebugImage[detection.id] ? '👻 Hide Transparent' : '👻 Show Transparent'}
                      </button>
                    )}
                    {detection.status !== 'missing' && detection.status !== 'processing' && (
                      <>
                        <button
                          onClick={() => handleCopyJson(detection)}
                          className={styles.jsonButton}
                          title="Copy detected cookie locations JSON to clipboard"
                        >
                          {copiedId === detection.id ? '✓ Copied!' : '📋 Copy JSON'}
                        </button>
                        <button
                          onClick={() => handleDownloadJson(detection)}
                          className={styles.jsonButton}
                          title="Download detected cookie locations JSON file"
                        >
                          ⬇️ JSON
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {/* Extracted Cookies Sprite Grid */}
                {showExtracted[detection.id] && detection.extractedCookies && detection.extractedCookies.length > 0 && (
                  <div className={styles.spriteGrid}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#fff' }}>
                      Extracted Cookies ({detection.extractedCookies.length})
                    </h4>
                    {/* Debug: Show Gemini-generated image if available */}
                    {detection.geminiGeneratedImageUrl && (
                      <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(74, 158, 255, 0.1)', borderRadius: '8px' }}>
                        <h5 style={{ margin: '0 0 8px 0', color: '#4a9eff' }}>
                          🔍 Debug: Gemini-Generated Image
                        </h5>
                        <img
                          src={detection.geminiGeneratedImageUrl}
                          alt="Gemini generated transparent cookies"
                          style={{ maxWidth: '100%', borderRadius: '4px', background: 'repeating-conic-gradient(#333 0% 25%, #222 0% 50%) 50% / 16px 16px' }}
                        />
                        <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                          This image was generated by Gemini. If cookies have transparent backgrounds here, the extraction worked correctly.
                        </p>
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                      {detection.extractedCookies.map((cookie, idx) => (
                        <ExtractedCookieCard
                          key={cookie.id}
                          imageUrl={cookie.extractedUrl || ''}
                          cookieId={cookie.id}
                          index={idx}
                          confidence={cookie.confidence}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
