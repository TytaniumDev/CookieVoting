import { useState, useRef, type MouseEvent, useEffect } from 'react';
import { type CookieCoordinate } from '../lib/types';
import { CONSTANTS } from '../lib/constants';
import { sanitizeInput } from '../lib/validation';
import { v4 as uuidv4 } from 'uuid';
import { detectCookiesGemini } from '../lib/cookieDetectionGemini';
import { getImageDetectionResults } from '../lib/firestore';
import { ImageWithDetections, type DetectedCookie } from './ImageWithDetections';
import styles from './ImageTagger.module.css';

/**
 * Props for the ImageTagger component
 */
interface Props {
    /** URL of the image to tag */
    imageUrl: string;
    /** Initial array of cookie coordinates (for editing existing tags) */
    initialCookies: CookieCoordinate[];
    /** Callback function called when tags are saved, receives the array of tagged cookies */
    onSave: (cookies: CookieCoordinate[]) => Promise<void>;
    /** Callback function called when tagging is cancelled */
    onCancel: () => void;
}

/**
 * ImageTagger - A comprehensive tool for tagging cookies in images.
 * 
 * This component provides a full-featured interface for tagging cookies in images.
 * It supports both manual tagging (clicking on the image) and automatic detection
 * using AI. The component displays detected cookies as overlays and allows users
 * to click on them to automatically tag them.
 * 
 * Features:
 * - Manual cookie tagging by clicking on the image
 * - Automatic cookie detection using Gemini AI
 * - Visual display of detected cookies (before tagging)
 * - Sidebar with list of all tagged cookies
 * - Edit cookie numbers and maker names
 * - Delete individual cookies
 * - Automatic filtering of already-tagged cookies from detection results
 * 
 * The component automatically loads pre-detected cookies from Firestore when the
 * image URL changes, and provides a button to trigger new detection if needed.
 * 
 * @example
 * ```tsx
 * <ImageTagger
 *   imageUrl="/path/to/image.jpg"
 *   initialCookies={[]}
 *   onSave={async (cookies) => {
 *     await saveCookiesToFirestore(cookies);
 *   }}
 *   onCancel={() => navigate('/admin')}
 * />
 * ```
 * 
 * @param props - Component props
 * @returns JSX element containing the tagging interface
 */
export function ImageTagger({ imageUrl, initialCookies, onSave, onCancel }: Props) {
    const [cookies, setCookies] = useState<CookieCoordinate[]>(initialCookies);
    const [saving, setSaving] = useState(false);
    const [detecting, setDetecting] = useState(false);
    const [detectionError, setDetectionError] = useState<string | null>(null);
    const [detectedCookies, setDetectedCookies] = useState<Array<{x: number, y: number, width: number, height: number, polygon?: Array<[number, number]>, confidence: number}>>([]);
    const [loadingDetection, setLoadingDetection] = useState(true);
    const imageAreaRef = useRef<HTMLDivElement>(null);

    // Automatically load detection results when image URL changes
    useEffect(() => {
        const loadDetectionResults = async () => {
            setLoadingDetection(true);
            try {
                const results = await getImageDetectionResults(imageUrl);
                if (results && results.length > 0) {
                    setDetectedCookies(results);
                    console.log(`Loaded ${results.length} pre-detected cookies for image`);
                } else {
                    console.log('No pre-detected cookies found, user can run detection manually');
                }
            } catch (error) {
                console.error('Error loading detection results:', error);
            } finally {
                setLoadingDetection(false);
            }
        };

        loadDetectionResults();
    }, [imageUrl]);

    const handleImageClick = (e: MouseEvent<HTMLDivElement>) => {
        if (!imageAreaRef.current) return;

        // Find the actual image element inside ImageWithDetections
        const img = imageAreaRef.current.querySelector('img');
        if (!img) return;

        const rect = img.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        // Default next number
        const maxNum = cookies.reduce((max, c) => Math.max(max, c.number), 0);

        const newCookie: CookieCoordinate = {
            id: uuidv4(),
            number: maxNum + 1,
            makerName: CONSTANTS.DEFAULT_MAKER_NAME, // Default, admin will edit
            x,
            y
        };

        setCookies([...cookies, newCookie]);
    };

    const updateCookie = (id: string, updates: Partial<CookieCoordinate>) => {
        setCookies(cookies.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const removeCookie = (id: string) => {
        setCookies(cookies.filter(c => c.id !== id));
    };

    const handleAutoDetect = async () => {
        setDetecting(true);
        setDetectionError(null);

        try {
            const detected = await detectCookiesGemini(imageUrl);

            // Store detected cookies for visualization
            setDetectedCookies(detected);

            if (detected.length === 0) {
                setDetectionError('No cookies detected. Try adjusting the image or use manual tagging.');
                setDetecting(false);
                return;
            }

            // Get the highest number currently used
            const maxNum = cookies.reduce((max, c) => Math.max(max, c.number), 0);

            // Convert detected cookies to CookieCoordinate format
            // Filter out detections that are too close to existing cookies (within 5%)
            const newCookies: CookieCoordinate[] = [];
            for (let i = 0; i < detected.length; i++) {
                const detectedCookie = detected[i];
                
                // Check if this detection is too close to an existing cookie
                const tooClose = cookies.some(existing => {
                    const distance = Math.sqrt(
                        Math.pow(existing.x - detectedCookie.x, 2) + 
                        Math.pow(existing.y - detectedCookie.y, 2)
                    );
                    return distance < 5; // 5% threshold
                });

                if (!tooClose) {
                    newCookies.push({
                        id: uuidv4(),
                        number: maxNum + newCookies.length + 1,
                        makerName: CONSTANTS.DEFAULT_MAKER_NAME,
                        x: detectedCookie.x,
                        y: detectedCookie.y,
                    });
                }
            }

            // Merge with existing cookies
            setCookies([...cookies, ...newCookies]);

            if (newCookies.length === 0) {
                setDetectionError('All detected cookies were already tagged. Try manual tagging for any missed cookies.');
            } else {
                setDetectionError(null);
            }
        } catch (error) {
            console.error('Cookie detection failed:', error);
            setDetectionError(
                error instanceof Error 
                    ? `Detection failed: ${error.message}` 
                    : 'Cookie detection failed. Please try manual tagging.'
            );
        } finally {
            setDetecting(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        await onSave(cookies);
        setSaving(false);
    };

    return (
        <div className={styles.container}>
            <div className={styles.toolbar}>
                <div>
                    <h3>Tagging Mode</h3>
                    <p>Click on the image to add a number, or use auto-detect to find cookies automatically.</p>
                    {loadingDetection && (
                        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                            Loading detection results...
                        </p>
                    )}
                </div>
                <div className={styles.actions}>
                    <button 
                        onClick={handleAutoDetect} 
                        disabled={saving || detecting} 
                        className={styles.buttonAutoDetect}
                        title="Automatically detect cookies in the image"
                    >
                        {detecting ? 'Detecting...' : 'Auto-detect Cookies'}
                    </button>
                    <button onClick={onCancel} disabled={saving || detecting} className={styles.buttonSecondary}>Cancel</button>
                    <button onClick={handleSave} disabled={saving || detecting} className={styles.buttonPrimary}>
                        {saving ? 'Saving...' : 'Save Tags'}
                    </button>
                </div>
            </div>

            <div className={styles.workspace}>
                <div className={styles.imageArea} ref={imageAreaRef} onClick={handleImageClick}>
                    {(() => {
                        // Filter out already-tagged cookies
                        const untaggedCookies: DetectedCookie[] = detectedCookies
                            .map((detected, index) => {
                                // Check if this detected cookie is already tagged
                                const isTagged = cookies.some(cookie => {
                                    const distance = Math.sqrt(
                                        Math.pow(cookie.x - detected.x, 2) + 
                                        Math.pow(cookie.y - detected.y, 2)
                                    );
                                    return distance < 5; // 5% threshold
                                });
                                
                                if (isTagged) return null; // Don't show shape if already tagged
                                
                                // Map to DetectedCookie format
                                return {
                                    x: detected.x,
                                    y: detected.y,
                                    width: detected.width,
                                    height: detected.height,
                                    polygon: detected.polygon,
                                    confidence: detected.confidence,
                                } as DetectedCookie;
                            })
                            .filter((cookie): cookie is DetectedCookie => cookie !== null);
                        
                        // Create a map to find original index for click handler
                        const indexMap = new Map<DetectedCookie, number>();
                        detectedCookies.forEach((detected, index) => {
                            const untagged = untaggedCookies.find(uc => 
                                uc.x === detected.x && 
                                uc.y === detected.y &&
                                uc.confidence === detected.confidence
                            );
                            if (untagged) {
                                indexMap.set(untagged, index);
                            }
                        });
                        
                        return (
                            <ImageWithDetections
                                imageUrl={imageUrl}
                                detectedCookies={untaggedCookies}
                                onCookieClick={(cookie, _, e) => {
                                    e.stopPropagation();
                                    const originalIndex = indexMap.get(cookie);
                                    if (originalIndex !== undefined) {
                                        // Auto-tag this detected cookie
                                        const maxNum = cookies.reduce((max, c) => Math.max(max, c.number), 0);
                                        const newCookie: CookieCoordinate = {
                                            id: uuidv4(),
                                            number: maxNum + 1,
                                            makerName: CONSTANTS.DEFAULT_MAKER_NAME,
                                            x: cookie.x,
                                            y: cookie.y
                                        };
                                        setCookies([...cookies, newCookie]);
                                        // Remove from detected list
                                        setDetectedCookies(detectedCookies.filter((_, i) => i !== originalIndex));
                                    }
                                }}
                                className={styles.image}
                            />
                        );
                    })()}
                    {/* Show tagged cookies */}
                    {cookies.map(cookie => (
                        <div
                            key={cookie.id}
                            className={styles.marker}
                            style={{ left: `${cookie.x}%`, top: `${cookie.y}%` }}
                            onClick={(e) => { e.stopPropagation(); /* Select? */ }}
                        >
                            <div className={styles.markerNumber}>{cookie.number}</div>
                        </div>
                    ))}
                </div>

                <div className={styles.sidebar}>
                    <h4>Cookies ({cookies.length})</h4>
                    {detectionError && (
                        <div className={styles.errorMessage}>
                            {detectionError}
                        </div>
                    )}
                    <div className={styles.list}>
                        {cookies.sort((a, b) => a.number - b.number).map(cookie => (
                            <div key={cookie.id} className={styles.item}>
                                <div className={styles.itemHeader}>
                                    <span className={styles.itemNumber}>#{cookie.number}</span>
                                    <button onClick={() => removeCookie(cookie.id)} className={styles.deleteBtn}>×</button>
                                </div>
                                <label>Maker Name</label>
                                <input
                                    type="text"
                                    value={cookie.makerName}
                                    onChange={(e) => {
                                        const sanitized = sanitizeInput(e.target.value);
                                        updateCookie(cookie.id, { makerName: sanitized });
                                    }}
                                    className={styles.input}
                                    maxLength={50}
                                />
                                <label>Number</label>
                                <input
                                    type="number"
                                    value={cookie.number}
                                    onChange={(e) => updateCookie(cookie.id, { number: parseInt(e.target.value) || 0 })}
                                    className={styles.input}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
