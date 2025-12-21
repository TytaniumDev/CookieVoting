import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getAllImageDetections, isGlobalAdmin } from '../lib/firestore';
import { CookieViewer, type DetectedCookie } from '../components/CookieViewer';
import styles from './ImageDetectionAudit.module.css';

interface ImageDetection {
  id: string;
  filePath: string;
  imageUrl: string;
  detectedCookies: DetectedCookie[];
  count: number;
  detectedAt?: unknown;
  contentType?: string;
}

export default function ImageDetectionAudit() {
  const [detections, setDetections] = useState<ImageDetection[]>([]);
  const [loading, setLoading] = useState(true);
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
          setLoading(false);
          return;
        }
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

  // Load detections when admin access is confirmed
  useEffect(() => {
    if (checkingAuth || !isAdmin) return;

    const loadDetections = async () => {
      try {
        setLoading(true);
        const allDetections = await getAllImageDetections();
        // Sort by detectedAt (most recent first), fallback to id
        const sorted = allDetections.sort((a, b) => {
          const getTime = (detection: ImageDetection): number => {
            if (!detection.detectedAt) return 0;
            if (detection.detectedAt?.toMillis) {
              return detection.detectedAt.toMillis();
            }
            if (detection.detectedAt?.seconds) {
              return detection.detectedAt.seconds * 1000;
            }
            if (typeof detection.detectedAt === 'number') {
              return detection.detectedAt;
            }
            return 0;
          };
          const aTime = getTime(a);
          const bTime = getTime(b);
          if (aTime !== bTime) {
            return bTime - aTime;
          }
          // Fallback to id for consistent sorting
          return a.id.localeCompare(b.id);
        });
        setDetections(sorted);
        // Debug: log detection data
        console.log('[ImageDetectionAudit] Loaded detections:', sorted.length);
        sorted.forEach((det, idx) => {
          const withPolygons = det.detectedCookies.filter(c => c.polygon && c.polygon.length >= 3).length;
          console.log(`[ImageDetectionAudit] Detection ${idx}: ${det.detectedCookies.length} cookies, ${withPolygons} with polygons`);
        });
      } catch (err) {
        console.error('Failed to load image detections:', err);
        setError('Failed to load image detections. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadDetections();
  }, [checkingAuth, isAdmin]);

  const handleCookieClick = (cookie: DetectedCookie, index: number, event: React.MouseEvent) => {
    // For now, just log the click - different pages can attach their own handlers
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

      {loading ? (
        <div className={styles.loading}>Loading detections...</div>
      ) : detections.length === 0 ? (
        <div className={styles.empty}>
          <p>No image detections found.</p>
          <p className={styles.emptySubtext}>
            Detections are created automatically when images are uploaded, or when you run &quot;Auto-detect All Images&quot;.
          </p>
        </div>
      ) : (
        <>
          <div className={styles.summary}>
            <p>Found <strong>{detections.length}</strong> image{detections.length !== 1 ? 's' : ''} with detection results</p>
            <p className={styles.summarySubtext}>
              Total cookies detected: <strong>{detections.reduce((sum, d) => sum + d.count, 0)}</strong>
            </p>
          </div>
          <div className={styles.grid}>
            {detections.map((detection) => (
              <div key={detection.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    {detection.filePath.split('/').pop() || 'Unknown'}
                  </h3>
                  <div className={styles.cardMeta}>
                    <span className={styles.badge}>
                      {detection.count} cookie{detection.count !== 1 ? 's' : ''}
                    </span>
                    {detection.detectedAt && (
                      <span className={styles.timestamp}>
                        {detection.detectedAt?.toDate ? 
                          detection.detectedAt.toDate().toLocaleString() :
                          detection.detectedAt?.seconds ?
                            new Date(detection.detectedAt.seconds * 1000).toLocaleString() :
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
                    borderColor="rgba(255, 255, 255, 0.5)"
                  />
                </div>
                <div className={styles.cardFooter}>
                  <div className={styles.filePath}>
                    <strong>Path:</strong> {detection.filePath}
                  </div>
                  <div className={styles.jsonActions}>
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
                      ⬇️ Download JSON
                    </button>
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

