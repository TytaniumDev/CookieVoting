import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../lib/firebase';
import { getAllStoredImages, watchAllImageDetections, isGlobalAdmin } from '../lib/firestore';
import { CookieViewer, type DetectedCookie } from '../components/organisms/CookieViewer/CookieViewer';
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
}

interface StoredImage {
  path: string;
  url: string;
  name: string;
}

export default function ImageDetectionAudit() {
  const [storedImages, setStoredImages] = useState<StoredImage[]>([]);
  const [dbDetections, setDbDetections] = useState<ImageDetection[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check authentication and admin access
  useEffect(() => {
    const checkAccess = async () => {
      setCheckingAuth(true);
      try {
        const user = auth.currentUser;
        
        const isSignedIn = user && (
          user.email || 
          (user.providerData && user.providerData.length > 0)
        );
        
        if (!isSignedIn) {
          navigate('/', { replace: true });
          setIsAdmin(false);
          setCheckingAuth(false);
          return;
        }

        setCheckingAuth(false);
        
        // Check if user is an admin
        const admin = await isGlobalAdmin(user.uid);
        setIsAdmin(admin);

        if (!admin) {
          setError('You do not have admin access. Please contact a site administrator.');
          setLoadingImages(false);
          return;
        }

        setError(prev => prev === 'You do not have admin access. Please contact a site administrator.' ? null : prev);
      } catch (err) {
        console.error("Failed to check admin access", err);
        setError('Failed to verify admin access');
        setCheckingAuth(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async () => {
      await checkAccess();
    });

    checkAccess();

    return () => unsubscribe();
  }, [navigate]);

  // Load stored images once
  useEffect(() => {
    if (checkingAuth || !isAdmin) return;

    const loadImages = async () => {
      try {
        setLoadingImages(true);
        const images = await getAllStoredImages();
        setStoredImages(images);
      } catch (err) {
        console.error('Failed to load stored images:', err);
        setError('Failed to load images from storage.');
      } finally {
        setLoadingImages(false);
      }
    };

    loadImages();
  }, [checkingAuth, isAdmin]);

  // Subscribe to DB detections
  useEffect(() => {
    if (checkingAuth || !isAdmin) return;

    const unsubscribe = watchAllImageDetections((detections) => {
      // Cast to match our interface including optional status/progress
      setDbDetections(detections as ImageDetection[]);
    });

    return () => unsubscribe();
  }, [checkingAuth, isAdmin]);

  // Merge Data
  const detections = useMemo(() => {
    if (storedImages.length === 0 && dbDetections.length === 0) return [];

    // Map DB detections for lookup
    const detectionMap = new Map<string, ImageDetection>();
    // Map strictly by filePath
    dbDetections.forEach(d => detectionMap.set(d.filePath, d));
    // Also map by filename if needed as fallback (handle cases where stored path prefixes differ slightly)
    dbDetections.forEach(d => {
      const filename = d.filePath.split('/').pop();
      if (filename) detectionMap.set(filename, d);
    });

    // Create base list from stored images
    const merged = storedImages.map(img => {
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
          status: detection.status || (detection.detectedCookies.length > 0 ? 'detected' : 'unknown')
        };
      }

      // No detection record found -> 'missing'
      return {
        id: img.path.replace(/\//g, '_').replace(/\./g, '_'),
        filePath: img.path,
        imageUrl: img.url,
        detectedCookies: [],
        count: 0,
        status: 'missing'
      };
    });

    // Add any DB detections that didn't match a stored image (orphaned records?)
    dbDetections.forEach(d => {
      const alreadyIncluded = merged.find(m => m.filePath === d.filePath || m.id === d.id);
      if (!alreadyIncluded) {
        merged.push({
          ...d,
          status: d.status || (d.detectedCookies.length > 0 ? 'detected' : 'unknown')
        });
      }
    });

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
        if (d.detectedAt && typeof d.detectedAt === 'object' && 'toMillis' in d.detectedAt && typeof (d.detectedAt as any).toMillis === 'function') {
          return (d.detectedAt as any).toMillis();
        }
        if (d.detectedAt && typeof d.detectedAt === 'object' && 'seconds' in d.detectedAt) {
          return (d.detectedAt as any).seconds * 1000;
        }
        if (typeof d.detectedAt === 'number') {
          return d.detectedAt;
        }
        return 0;
      };

      return getTime(b) - getTime(a);
    });

  }, [storedImages, dbDetections]);


  const handleCookieClick = (cookie: DetectedCookie, index: number, event: React.MouseEvent) => {
    console.log('Cookie clicked:', { cookie, index });
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
    } catch (err) {
      console.error('Failed to copy JSON:', err);
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
    } catch (err) {
      console.error('Failed to download JSON:', err);
      setError('Failed to download JSON file');
    }
  };

  const handleRegenerate = async (detection: ImageDetection) => {
    // Just trigger the function. The UI will update via the Firestore subscription (status='processing')
    try {
      const detectCookiesWithGemini = httpsCallable(functions, 'detectCookiesWithGemini');
      // We don't await the result for UI updates anymore, we rely on the subscription
      // But we await the initial call to catch launch errors
      await detectCookiesWithGemini({ imageUrl: detection.imageUrl });
    } catch (error) {
      console.error('Error triggering regeneration:', error);
      alert('Failed to regenerate: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  if (checkingAuth) {
    return <div className={styles.container}>Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          {error || 'You do not have admin access. Please contact a site administrator.'}
        </div>
        <button onClick={() => navigate('/')} className={styles.button} style={{ marginTop: '1rem' }}>
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Image Detection Audit</h1>
        <button onClick={() => navigate('/admin')} className={styles.backButton}>
          ← Back to Admin
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

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
                <p>Found <strong>{detections.length}</strong> image{detections.length !== 1 ? 's' : ''}</p>
            <p className={styles.summarySubtext}>
              Total cookies detected: <strong>{detections.reduce((sum, d) => sum + d.count, 0)}</strong>
                  {' • '}
                  Missing: <strong>{detections.filter(d => d.status === 'missing').length}</strong>
                  {' • '}
                  Processing: <strong>{detections.filter(d => d.status === 'processing').length}</strong>
            </p>
          </div>
          <div className={styles.grid}>
            {detections.map((detection) => (
              <div key={detection.id} className={`${styles.card} ${detection.status === 'missing' ? styles.pendingCard : ''}`}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    {detection.filePath.split('/').pop() || 'Unknown'}
                  </h3>
                  <div className={styles.cardMeta}>
                    {detection.status === 'missing' ? (
                      <span className={styles.badge} style={{ backgroundColor: '#ef4444', color: 'white' }}>
                        Missing Detection
                      </span>
                    ) : detection.status === 'processing' ? (
                      <span className={styles.badge} style={{ backgroundColor: '#3b82f6', color: 'white' }}>
                        Creating Detection...
                      </span>
                    ) : (
                          <span className={styles.badge}>
                            {detection.count} cookie{detection.count !== 1 ? 's' : ''}
                          </span>
                    )}

                    {detection.detectedAt && (
                      <span className={styles.timestamp}>
                        {detection.detectedAt && typeof detection.detectedAt === 'object' && 'toDate' in detection.detectedAt && typeof (detection.detectedAt as any).toDate === 'function' ?
                          (detection.detectedAt as any).toDate().toLocaleString() :
                          detection.detectedAt && typeof detection.detectedAt === 'object' && 'seconds' in detection.detectedAt ?
                            new Date((detection.detectedAt as any).seconds * 1000).toLocaleString() :
                            typeof detection.detectedAt === 'number' ?
                              new Date(detection.detectedAt).toLocaleString() :
                              'Unknown date'}
                      </span>
                    )}
                  </div>
                </div>
                <div className={styles.imageContainer}>
                  <CookieViewer
                    imageUrl={detection.imageUrl}
                    detectedCookies={detection.detectedCookies}
                    onCookieClick={handleCookieClick}
                    borderColor={detection.status === 'missing' ? "rgba(255, 0, 0, 0.5)" : "rgba(255, 255, 255, 0.5)"}
                  />
                  {/* Overlay for processing/regenerating */}
                  {detection.status === 'processing' && (
                    <div className={styles.loadingOverlay}>
                      <div style={{ textAlign: 'center' }}>
                        <div>Scanning...</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'normal', marginTop: '0.5rem' }}>
                          {detection.progress || 'Processing...'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className={styles.cardFooter}>
                  <div className={styles.filePath}>
                    <strong>Path:</strong> {detection.filePath}
                  </div>
                  <div className={styles.jsonActions}>
                    <button
                      onClick={() => handleRegenerate(detection)}
                      className={styles.jsonButton}
                      disabled={detection.status === 'processing'}
                      style={{ backgroundColor: detection.status === 'processing' ? '#9ca3af' : '#3b82f6', color: 'white', border: 'none' }}
                    >
                      {detection.status === 'processing' ? 'Processing...' : '🔄 Regenerate'}
                    </button>
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
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

