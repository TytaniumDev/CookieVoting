import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEvent, getCategories, getVotes, getAllImageDetections } from '../lib/firestore';
import { type VoteEvent, type Category, type CookieCoordinate } from '../lib/types';
import { CONSTANTS } from '../lib/constants';
import { ImageWithDetections, type DetectedCookie } from '../components/ImageWithDetections';
import styles from './ResultsPage.module.css';

interface CookieScore {
    cookieNumber: number;
    votes: number;
    maker: string;
    cookie: CookieCoordinate; // The actual cookie coordinate
}

interface CategoryResult {
    category: Category;
    scores: CookieScore[]; // Sorted descending
    detectedCookies: DetectedCookie[] | null;
}

export default function ResultsPage() {
    const { eventId } = useParams();
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState<VoteEvent | null>(null);
    const [results, setResults] = useState<CategoryResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [clickedCookie, setClickedCookie] = useState<{ categoryId: string; cookieNumber: number; votes: number; maker: string; x: number; y: number } | null>(null);

    useEffect(() => {
        if (!eventId) return;

        const fetchData = async () => {
            try {
                const [eventData, catsData, votesData] = await Promise.all([
                    getEvent(eventId),
                    getCategories(eventId),
                    getVotes(eventId)
                ]);
                setEvent(eventData);

                // Calculate Results (detections will be loaded via real-time listeners)
                const computedResults: CategoryResult[] = catsData.map((cat) => {
                    // Initialize scores
                    const scoresMap = new Map<number, number>();
                    cat.cookies.forEach(c => scoresMap.set(c.number, 0));

                    // Tally votes
                    votesData.forEach(userVote => {
                        const votedNumber = userVote.votes[cat.id];
                        if (votedNumber !== undefined) {
                            scoresMap.set(votedNumber, (scoresMap.get(votedNumber) || 0) + 1);
                        }
                    });

                    // Convert to array and sort
                    const scores: CookieScore[] = cat.cookies.map(c => ({
                        cookieNumber: c.number,
                        votes: scoresMap.get(c.number) || 0,
                        maker: c.makerName || 'Unknown',
                        cookie: c
                    })).sort((a, b) => b.votes - a.votes);

                    return {
                        category: cat,
                        scores,
                        detectedCookies: null // Will be loaded via real-time listener
                    };
                });

                setResults(computedResults);

            } catch (err) {
                console.error("Failed to load results", err);
                setError(CONSTANTS.ERROR_MESSAGES.FAILED_TO_LOAD);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [eventId]);

    // Load detection results using getAllImageDetections (same approach as tagging wizard)
    useEffect(() => {
        if (results.length === 0) return;

                const loadDetections = async () => {
            try {
                const allDetections = await getAllImageDetections();

                // Helper to extract file identifier from URL (UUID or filename)
                const extractFileName = (url: string): string | null => {
                    try {
                        const uuidMatch = url.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
                        if (uuidMatch) return uuidMatch[1];
                        const urlObj = new URL(url.split('?')[0]);
                        const pathParts = urlObj.pathname.split('/');
                        const fileName = pathParts[pathParts.length - 1];
                        return fileName || null;
                    } catch {
                        return null;
                    }
                };

                // Match detections to categories
                setResults(prev => prev.map(result => {
                    const categoryFileName = extractFileName(result.category.imageUrl);
                    
                    // Match by file identifier (UUID or filename) or exact URL
                    const matchingDetection = categoryFileName
                        ? allDetections.find(d => {
                            const detectionFileName = extractFileName(d.imageUrl);
                            return detectionFileName === categoryFileName || d.imageUrl === result.category.imageUrl;
                        })
                        : allDetections.find(d => d.imageUrl === result.category.imageUrl);

                    if (matchingDetection) {
                        
                        const converted: DetectedCookie[] = matchingDetection.detectedCookies.map(d => ({
                            x: d.x,
                            y: d.y,
                            width: d.width,
                            height: d.height,
                            polygon: d.polygon,
                            confidence: d.confidence
                        }));
                        
                        return { ...result, detectedCookies: converted };
                    } else {
                        return { ...result, detectedCookies: [] };
                    }
                }));
            } catch (error) {
                console.error('[ResultsPage] Error loading image detections:', error);
            }
        };

        loadDetections();
    }, [results.length]); // Re-run when number of results changes

    const getMedal = (index: number) => {
        if (index < CONSTANTS.MEDALS.length) {
            return CONSTANTS.MEDALS[index];
        }
        return null;
    };

    // Find the cookie score that matches a detected cookie
    // This matches the logic used in the tagging wizard (5% threshold)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _findMatchingCookieScore = (
        detected: DetectedCookie,
        scores: CookieScore[]
    ): { score: CookieScore; rank: number } | null => {
        // Find the closest cookie coordinate by distance
        let closest: { score: CookieScore; rank: number; distance: number } | null = null;
        
        for (let i = 0; i < scores.length; i++) {
            const score = scores[i];
            const distance = Math.sqrt(
                Math.pow(detected.x - score.cookie.x, 2) + 
                Math.pow(detected.y - score.cookie.y, 2)
            );
            // Use 5% threshold like the tagging wizard
            if (distance < 5 && (!closest || distance < closest.distance)) {
                closest = { score, rank: i, distance };
            }
        }
        
        
        return closest ? { score: closest.score, rank: closest.rank } : null;
    };

    if (loading) return <div className={styles.loading}>Calculating results...</div>;
    if (!event) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    {error || CONSTANTS.ERROR_MESSAGES.EVENT_NOT_FOUND}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>{event.name} Results</h1>
                <p>The votes are in!</p>
            </header>

            <div className={styles.categories}>
                {results.map(({ category, scores, detectedCookies }) => {
                    // Use detected cookies if available, otherwise create fallback from tagged coordinates
                    const cookiesToDisplay: DetectedCookie[] = detectedCookies && detectedCookies.length > 0
                        ? detectedCookies
                        : scores.map(score => ({
                            // Fallback: create detected cookies from tagged coordinates if detection not available
                            x: score.cookie.x,
                            y: score.cookie.y,
                            width: 8, // Default size
                            height: 8,
                            confidence: 1.0,
                            polygon: undefined
                        }));

                    // Create a map from detected cookie to score for quick lookup
                    const detectedToScore = new Map<DetectedCookie, CookieScore>();
                    cookiesToDisplay.forEach(detected => {
                        const match = scores.find(score => {
                            const distance = Math.sqrt(
                                Math.pow(detected.x - score.cookie.x, 2) + 
                                Math.pow(detected.y - score.cookie.y, 2)
                            );
                            return distance < 5;
                        });
                        if (match) {
                            detectedToScore.set(detected, match);
                        }
                    });

                    return (
                        <div key={category.id} className={styles.categorySection}>
                            <h2 className={styles.categoryTitle}>{category.name}</h2>
                            <div className={styles.imageContainer}>
                                <ImageWithDetections
                                    imageUrl={category.imageUrl}
                                    detectedCookies={cookiesToDisplay}
                                    className={styles.imageWithDetections}
                                    onCookieClick={(detected, index, e) => {
                                        const score = detectedToScore.get(detected);
                                        if (score) {
                                            setClickedCookie({
                                                categoryId: category.id,
                                                cookieNumber: score.cookieNumber,
                                                votes: score.votes,
                                                maker: score.maker,
                                                x: e.clientX,
                                                y: e.clientY
                                            });
                                        }
                                    }}
                                />
                                
                                {/* Render overlays for each score (tagged cookie) - matching tagging wizard pattern */}
                                {scores.map((score, rank) => {
                                    // Find matching detected cookie (same logic as tagging wizard)
                                    const matchingDetected = detectedCookies?.find(d => {
                                        const distance = Math.sqrt(
                                            Math.pow(d.x - score.cookie.x, 2) + 
                                            Math.pow(d.y - score.cookie.y, 2)
                                        );
                                        return distance < 5; // 5% threshold
                                    }) || null;
                                    
                                    // Calculate bounds (same logic as tagging wizard)
                                    let topLeftX = score.cookie.x;
                                    let topLeftY = score.cookie.y;
                                    let bottomY = score.cookie.y;
                                    let centerX = score.cookie.x;
                                    let centerY = score.cookie.y;
                                    let centerMethod = 'fallback';
                                    
                                    if (matchingDetected?.polygon && matchingDetected.polygon.length >= 3) {
                                        const xs = matchingDetected.polygon.map(p => p[0]);
                                        const ys = matchingDetected.polygon.map(p => p[1]);
                                        topLeftX = Math.min(...xs);
                                        topLeftY = Math.min(...ys);
                                        bottomY = Math.max(...ys);
                                        // Calculate centroid (geometric center) of the polygon
                                        const sumX = xs.reduce((a, b) => a + b, 0);
                                        const sumY = ys.reduce((a, b) => a + b, 0);
                                        centerX = sumX / xs.length;
                                        centerY = sumY / ys.length;
                                        centerMethod = 'polygon-centroid';
                                    } else if (matchingDetected) {
                                        topLeftX = matchingDetected.x - matchingDetected.width / 2;
                                        topLeftY = matchingDetected.y - matchingDetected.height / 2;
                                        bottomY = matchingDetected.y + matchingDetected.height / 2;
                                        centerX = matchingDetected.x;
                                        centerY = matchingDetected.y;
                                        centerMethod = 'detected-center';
                                    } else {
                                        // Default: assume cookie is ~8% in size
                                        topLeftX = score.cookie.x - 4;
                                        topLeftY = score.cookie.y - 4;
                                        bottomY = score.cookie.y + 4;
                                        centerX = score.cookie.x;
                                        centerY = score.cookie.y;
                                        centerMethod = 'tagged-coordinate';
                                    }
                                    
                                    const medal = getMedal(rank);
                                    const isFirstPlace = rank === 0;
                                    
                                    // Debug logging for first place sparkle animation
                                    if (isFirstPlace && matchingDetected) {
                                        console.log('[ResultsPage] 🎉 First place sparkle animation positioning:', {
                                            cookieNumber: score.cookieNumber,
                                            category: category.name,
                                            centerMethod,
                                            centerX: `${centerX.toFixed(2)}%`,
                                            centerY: `${centerY.toFixed(2)}%`,
                                            detectedX: matchingDetected.x,
                                            detectedY: matchingDetected.y,
                                            hasPolygon: !!matchingDetected.polygon,
                                            polygonPoints: matchingDetected.polygon?.length || 0,
                                            taggedX: score.cookie.x,
                                            taggedY: score.cookie.y,
                                            bounds: {
                                                topLeft: `${topLeftX.toFixed(2)}%, ${topLeftY.toFixed(2)}%`,
                                                bottom: `${bottomY.toFixed(2)}%`,
                                            }
                                        });
                                    }
                                    
                                    return (
                                        <React.Fragment key={score.cookieNumber}>
                                            {/* Medal at top-left - EXACT same structure as tagging wizard markerNumber */}
                                            {medal && (
                                                <div
                                                    className={`${styles.medal} ${isFirstPlace ? styles.firstPlace : ''}`}
                                                    style={{ 
                                                        left: `${Math.max(0, topLeftX)}%`, 
                                                        top: `${Math.max(0, topLeftY)}%`,
                                                        position: 'absolute',
                                                        zIndex: 11
                                                    }}
                                                >
                                                    {medal}
                                                </div>
                                            )}
                                            
                                            {/* Sparkling animation for first place - centered on detection area */}
                                            {isFirstPlace && matchingDetected && (
                                                <div
                                                    className={styles.sparkleAnimation}
                                                    style={{
                                                        position: 'absolute',
                                                        left: `${centerX}%`,
                                                        top: `${centerY}%`,
                                                        zIndex: 10,
                                                        pointerEvents: 'none',
                                                        /* Transform is handled in CSS animation keyframes */
                                                    }}
                                                />
                                            )}
                                            
                                            {/* Baker name at bottom - EXACT same structure as tagging wizard markerName */}
                                            <div
                                                className={styles.bakerName}
                                                style={{
                                                    left: `${score.cookie.x}%`,
                                                    top: `${Math.min(100, bottomY + 1)}%`,
                                                    position: 'absolute',
                                                    transform: 'translate(-50%, 0)',
                                                    zIndex: 11
                                                }}
                                            >
                                                {score.maker}
                                            </div>
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className={styles.footer}>
                <Link 
                    to={`/vote/${eventId}`} 
                    className={styles.backLink}
                >
                    Back to Voting
                </Link>
            </div>

            {/* Vote count tooltip */}
            {clickedCookie && (
                <>
                    <div 
                        className={styles.tooltipBackdrop}
                        onClick={() => setClickedCookie(null)}
                    />
                    <div
                        className={styles.voteTooltip}
                        style={{
                            left: `${clickedCookie.x}px`,
                            top: `${clickedCookie.y}px`,
                        }}
                        onClick={() => setClickedCookie(null)}
                    >
                        <div className={styles.tooltipHeader}>
                            Cookie #{clickedCookie.cookieNumber}
                        </div>
                        <div className={styles.tooltipContent}>
                            <div className={styles.tooltipMaker}>Baker: {clickedCookie.maker}</div>
                            <div className={styles.tooltipVotes}>
                                {clickedCookie.votes} {clickedCookie.votes === 1 ? 'Vote' : 'Votes'}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
