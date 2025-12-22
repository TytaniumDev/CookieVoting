import { useState, useEffect } from 'react';
import { getEvent, getCategories, getVotes, getAllImageDetections } from '../firestore';
import type { VoteEvent, Category, CookieCoordinate, UserVote } from '../types';
import type { DetectedCookie } from '../../components/organisms/CookieViewer/CookieViewer';
import { CONSTANTS } from '../constants';

export interface CookieScore {
    cookieNumber: number;
    votes: number;
    maker: string;
    cookie: CookieCoordinate;
}

export interface CategoryResult {
    category: Category;
    scores: CookieScore[];
    detectedCookies: DetectedCookie[] | null;
}

export const useResultsData = (eventId: string | undefined) => {
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState<VoteEvent | null>(null);
    const [results, setResults] = useState<CategoryResult[]>([]);
    const [error, setError] = useState<string | null>(null);

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

                // Calculate initial results (tally)
                const computedResults = calculateResults(catsData, votesData);
                setResults(computedResults);

                // Then load detections
                await loadDetections(computedResults, setResults);

            } catch (err) {
                console.error("Failed to load results", err);
                setError(CONSTANTS.ERROR_MESSAGES.FAILED_TO_LOAD);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [eventId]);

    return { event, results, loading, error };
};

// Helper to tally votes
function calculateResults(categories: Category[], votesData: UserVote[]): CategoryResult[] {
    return categories.map((cat) => {
        const scoresMap = new Map<number, number>();
        cat.cookies.forEach(c => scoresMap.set(c.number, 0));

        votesData.forEach(userVote => {
            const votedNumber = userVote.votes[cat.id];
            if (votedNumber !== undefined) {
                scoresMap.set(votedNumber, (scoresMap.get(votedNumber) || 0) + 1);
            }
        });

        const scores: CookieScore[] = cat.cookies.map(c => ({
            cookieNumber: c.number,
            votes: scoresMap.get(c.number) || 0,
            maker: c.makerName || 'Unknown',
            cookie: c
        })).sort((a, b) => b.votes - a.votes);

        return {
            category: cat,
            scores,
            detectedCookies: null
        };
    });
}

// Helper to load detections and merge
// Note: This logic was copied from ResultsPage.tsx and slightly adapted
async function loadDetections(
    currentResults: CategoryResult[],
    setResults: React.Dispatch<React.SetStateAction<CategoryResult[]>>
) {
    try {
        const allDetections = await getAllImageDetections();

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

        setResults(prev => prev.map(result => {
            const categoryFileName = extractFileName(result.category.imageUrl);

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
        console.error('[useResultsData] Error loading image detections:', error);
    }
}
