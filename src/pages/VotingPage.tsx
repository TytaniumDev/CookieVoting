import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { getEvent, getCategories, submitVote, getUserVote, getUserIdForVoting } from '../lib/firestore';
import { type VoteEvent, type Category } from '../lib/types';
import { CookieViewer } from '../components/CookieViewer';
import type { DetectedCookie } from '../components/CookieViewer';
import { AlertModal } from '../components/AlertModal';
import { CONSTANTS } from '../lib/constants';
import { auth } from '../lib/firebase';
import styles from './VotingPage.module.css';

// Convert CookieCoordinate[] to DetectedCookie[] for voting UI
function convertCookiesToDetected(cookies: Category['cookies']): { detectedCookies: DetectedCookie[]; cookieNumbers: number[] } {
    const detectedCookies: DetectedCookie[] = cookies.map(cookie => ({
        x: cookie.x,
        y: cookie.y,
        width: 8, // Default size
        height: 8,
        confidence: 1.0,
        polygon: undefined
    }));
    
    const cookieNumbers = cookies.map(cookie => cookie.number);
    
    return { detectedCookies, cookieNumbers };
}

// localStorage helpers for Google Forms-like voting tracking
function getVotingStatusKey(eventId: string): string {
    return `cookie_voting_${eventId}`;
}

function hasVotedInBrowser(eventId: string): boolean {
    if (!eventId) return false;
    const key = getVotingStatusKey(eventId);
    return localStorage.getItem(key) === 'voted';
}

function markVotedInBrowser(eventId: string): void {
    if (!eventId) return;
    const key = getVotingStatusKey(eventId);
    localStorage.setItem(key, 'voted');
}

// localStorage helpers for draft votes (saves progress on page refresh)
function getDraftVotesKey(eventId: string): string {
    return `cookie_voting_draft_${eventId}`;
}

function saveDraftVotes(eventId: string, votes: Record<string, number>): void {
    if (!eventId) return;
    const key = getDraftVotesKey(eventId);
    try {
        localStorage.setItem(key, JSON.stringify(votes));
    } catch (err) {
        console.error("Failed to save draft votes to localStorage", err);
    }
}

function loadDraftVotes(eventId: string): Record<string, number> | null {
    if (!eventId) return null;
    const key = getDraftVotesKey(eventId);
    try {
        const stored = localStorage.getItem(key);
        if (stored) {
            return JSON.parse(stored) as Record<string, number>;
        }
    } catch (err) {
        console.error("Failed to load draft votes from localStorage", err);
    }
    return null;
}

function clearDraftVotes(eventId: string): void {
    if (!eventId) return;
    const key = getDraftVotesKey(eventId);
    localStorage.removeItem(key);
}

export default function VotingPage() {
    const { eventId } = useParams();
    const navigate = useNavigate();

    const [event, setEvent] = useState<VoteEvent | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Vote State
    const [votes, setVotes] = useState<Record<string, number>>({}); // categoryId -> cookieNumber
    const [submittedVotes, setSubmittedVotes] = useState<Record<string, number>>({}); // Last submitted votes
    const [activeCategory, setActiveCategory] = useState<Category | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<'success' | 'error' | 'info'>('info');
    const [userId, setUserId] = useState<string | null>(null);

    // Initialize user ID and listen for auth state changes
    useEffect(() => {
        const currentUserId = getUserIdForVoting();
        setUserId(currentUserId);
        
        // Listen for auth state changes (e.g., user signs in)
        // If user signs in, re-check Firebase for existing votes
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!eventId) return;
            
            // If user just signed in, check if they've already voted
            if (user && user.uid) {
                try {
                    const previousVote = await getUserVote(eventId, user.uid);
                    if (previousVote && previousVote.votes) {
                        // User has already voted - load their vote
                        setHasVoted(true);
                        setVotes(previousVote.votes);
                        setSubmittedVotes(previousVote.votes);
                        setUserId(user.uid);
                    } else {
                        // User signed in but hasn't voted yet - update user ID
                        setUserId(user.uid);
                    }
                } catch (err) {
                    console.error("Failed to check vote after sign-in", err);
                    // Update user ID anyway
                    setUserId(user.uid);
                }
            } else {
                // User signed out - use session ID
                const sessionUserId = getUserIdForVoting();
                setUserId(sessionUserId);
            }
        });
        
        return () => unsubscribe();
    }, [eventId]);

    useEffect(() => {
        if (!eventId) return;

        const fetchData = async () => {
            try {
                const [eventData, catsData] = await Promise.all([
                    getEvent(eventId),
                    getCategories(eventId)
                ]);
                setEvent(eventData);
                setCategories(catsData);
                
                // Check if event is completed
                if (eventData?.status === 'completed') {
                    setError(CONSTANTS.ERROR_MESSAGES.VOTING_COMPLETED);
                }
                
                // Check if user has already voted
                // For authenticated users, check Firebase first (prevents multi-device voting)
                // For unauthenticated users, check localStorage (per-device behavior)
                const isAuthenticated = auth.currentUser && auth.currentUser.uid;
                let hasVotedBefore = false;
                let loadedFirebaseVotes = false;
                
                if (isAuthenticated) {
                    // Authenticated users: Check Firebase first
                    try {
                        const userId = getUserIdForVoting();
                        const previousVote = await getUserVote(eventId, userId);
                        if (previousVote && previousVote.votes) {
                            hasVotedBefore = true;
                            setHasVoted(true);
                            setVotes(previousVote.votes);
                            setSubmittedVotes(previousVote.votes); // Track submitted votes
                            loadedFirebaseVotes = true;
                        }
                    } catch (err) {
                        console.error("Failed to load previous votes from Firebase", err);
                        // Continue - user can still vote
                    }
                } else {
                    // Unauthenticated users: Check localStorage (per-device behavior)
                    hasVotedBefore = hasVotedInBrowser(eventId);
                    if (hasVotedBefore) {
                        setHasVoted(true);
                        
                        // Try to load previous votes from Firebase as fallback
                        try {
                            const userId = getUserIdForVoting();
                            const previousVote = await getUserVote(eventId, userId);
                            if (previousVote && previousVote.votes) {
                                setVotes(previousVote.votes);
                                setSubmittedVotes(previousVote.votes);
                                loadedFirebaseVotes = true;
                            }
                        } catch (err) {
                            console.error("Failed to load previous votes", err);
                            // Continue anyway - user can still vote
                        }
                    }
                }
                
                // If we found votes from Firebase, we're done
                if (loadedFirebaseVotes) {
                    // Already loaded votes from Firebase
                } else if (hasVotedBefore) {
                    // If we couldn't load Firebase votes, try draft votes as fallback
                    // (This handles cases where they made changes but refreshed before submitting)
                    const draftVotes = loadDraftVotes(eventId);
                    if (draftVotes && Object.keys(draftVotes).length > 0) {
                        setVotes(draftVotes);
                    }
                } else {
                    // If they haven't voted yet, try to load draft votes from localStorage
                    const draftVotes = loadDraftVotes(eventId);
                    if (draftVotes && Object.keys(draftVotes).length > 0) {
                        setVotes(draftVotes);
                    }
                }
            } catch (err) {
                console.error("Failed to load voting data", err);
                setError(CONSTANTS.ERROR_MESSAGES.FAILED_TO_LOAD);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [eventId]);

    // Save votes to localStorage whenever they change (for page refresh recovery)
    useEffect(() => {
        if (!eventId || loading) return;
        // Only save if there are actual votes (not empty)
        if (Object.keys(votes).length > 0) {
            saveDraftVotes(eventId, votes);
        }
    }, [votes, eventId, loading]);

    const handleSelectCookie = (cookieNumber: number) => {
        if (activeCategory) {
            setVotes(prev => ({
                ...prev,
                [activeCategory.id]: cookieNumber
            }));
            
            // If user has already submitted votes, return to overview instead of auto-advancing
            if (hasVoted) {
                setTimeout(() => {
                    setActiveCategory(null);
                }, 300); // Small delay for visual feedback
                return;
            }
            
            // Auto-advance to next category after vote is cast (only for first-time voting)
            const currentIndex = categories.findIndex(cat => cat.id === activeCategory.id);
            if (currentIndex !== -1) {
                if (currentIndex < categories.length - 1) {
                    // There's a next category - advance to it
                    setTimeout(() => {
                        setActiveCategory(categories[currentIndex + 1]);
                    }, 300); // Small delay for visual feedback
                } else {
                    // Last category - return to overview
                    setTimeout(() => {
                        setActiveCategory(null);
                    }, 300); // Small delay for visual feedback
                }
            }
        }
    };

    const calculateProgress = () => {
        if (categories.length === 0) return 0;
        const votedCount = Object.keys(votes).length;
        return Math.round((votedCount / categories.length) * 100);
    };

    // Check if votes have changed from submitted votes
    const votesHaveChanged = () => {
        if (!hasVoted || Object.keys(submittedVotes).length === 0) return false;
        
        // Compare current votes with submitted votes
        if (Object.keys(votes).length !== Object.keys(submittedVotes).length) return true;
        
        for (const categoryId in votes) {
            if (votes[categoryId] !== submittedVotes[categoryId]) {
                return true;
            }
        }
        
        return false;
    };

    const handleSubmit = async () => {
        if (!eventId) return;

        // Check if event is completed
        if (event?.status === 'completed') {
            setAlertMessage(CONSTANTS.ERROR_MESSAGES.VOTING_COMPLETED);
            setAlertType('error');
            setTimeout(() => navigate(`/results/${eventId}`), 2000);
            return;
        }

        // If showing "See Results" button and votes haven't changed, navigate to results
        if (hasVoted && !votesHaveChanged()) {
            navigate(`/results/${eventId}`);
            return;
        }

        // Validate
        if (Object.keys(votes).length !== categories.length) {
            setAlertMessage(CONSTANTS.ERROR_MESSAGES.VOTE_INCOMPLETE);
            setAlertType('error');
            return;
        }

        // Get user ID - no authentication required
        // getUserIdForVoting() handles both authenticated and unauthenticated users
        const finalUserId = getUserIdForVoting();
        if (finalUserId !== userId) {
            setUserId(finalUserId);
        }

        // For authenticated users, double-check Firebase to prevent duplicate submissions
        // (This is a safety check in case the UI state is out of sync)
        const isAuthenticated = auth.currentUser && auth.currentUser.uid;
        if (isAuthenticated) {
            try {
                const existingVote = await getUserVote(eventId, finalUserId);
                if (existingVote) {
                    // Check if current votes are different from Firebase vote
                    const votesAreDifferent = 
                        Object.keys(votes).length !== Object.keys(existingVote.votes).length ||
                        Object.keys(votes).some(catId => votes[catId] !== existingVote.votes[catId]);
                    
                    if (!votesAreDifferent) {
                        // User has already voted with the same votes - navigate to results
                        navigate(`/results/${eventId}`);
                        return;
                    }
                }
            } catch (err) {
                console.error("Failed to verify existing vote", err);
                // Continue with submission - better to allow than block
            }
        }

        setSubmitting(true);
        setError(null);
        
        try {
            await submitVote(eventId, finalUserId, votes);
            
            // Mark as voted in localStorage (Google Forms-like behavior)
            const wasUpdating = hasVotedInBrowser(eventId);
            markVotedInBrowser(eventId);
            setHasVoted(true);
            
            // Save the submitted votes for comparison
            setSubmittedVotes({ ...votes });
            
            // Clear draft votes since they've successfully submitted
            clearDraftVotes(eventId);
            
            setAlertMessage(wasUpdating ? 'Votes updated successfully!' : CONSTANTS.SUCCESS_MESSAGES.VOTES_SUBMITTED);
            setAlertType('success');
            // Don't auto-redirect - let them continue editing if they want
        } catch (err) {
            console.error("Failed to submit votes", err);
            const errorMessage = err instanceof Error 
                ? err.message 
                : CONSTANTS.ERROR_MESSAGES.FAILED_TO_SAVE;
            setError(errorMessage);
            setAlertMessage(errorMessage);
            setAlertType('error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className={styles.loading}>Loading...</div>;
    if (!event) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    {error || CONSTANTS.ERROR_MESSAGES.EVENT_NOT_FOUND}
                </div>
            </div>
        );
    }
    
    // Show error if event is completed
    if (event.status === 'completed') {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <h2>Voting Closed</h2>
                    <p>{CONSTANTS.ERROR_MESSAGES.VOTING_COMPLETED}</p>
                    <button 
                        onClick={() => navigate(`/results/${eventId}`)}
                        className={styles.submitButton}
                    >
                        View Results
                    </button>
                </div>
            </div>
        );
    }

    // View Mode: Cookie Viewer Overlay
    if (activeCategory) {
        const { detectedCookies, cookieNumbers } = convertCookiesToDetected(activeCategory.cookies);
        const selectedCookieNumber = votes[activeCategory.id];
        return (
            <div className={styles.viewerContainer}>
                <div className={styles.viewerToolbar}>
                    <button onClick={() => setActiveCategory(null)} className={styles.backButton}>&larr; Back</button>
                </div>
                <div className={styles.viewerViewport}>
                    <CookieViewer
                        imageUrl={activeCategory.imageUrl}
                        detectedCookies={detectedCookies}
                        cookieNumbers={cookieNumbers}
                        selectedCookieNumber={selectedCookieNumber}
                        onSelectCookie={handleSelectCookie}
                    />
                </div>
                <div className={styles.viewerInstruction}>
                    Tap a number to select it.
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>{event.name}</h1>
                {error && (
                    <div className={styles.error} style={{ marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}
                {hasVoted && <div className={styles.badgeSuccess}>Votes Submitted</div>}
                {!hasVoted && (
                    <div className={styles.progress}>
                        <div className={styles.progressBar} style={{ width: `${calculateProgress()}%` }} />
                    </div>
                )}
            </header>

            <div className={styles.intro}>
                {hasVoted ? (
                    <p style={{ color: '#4caf50', fontWeight: 'bold' }}>
                        ✓ You&apos;ve already submitted your vote. You can change your votes below and resubmit.
                    </p>
                ) : (
                    <p>Tap a category to start voting. You can come back and change your votes anytime.</p>
                )}
            </div>

            <div className={styles.grid}>
                {categories.map(cat => {
                    const selection = votes[cat.id];
                    return (
                        <div
                            key={cat.id}
                            className={`${styles.card} ${selection ? styles.cardVoted : ''}`}
                            onClick={() => setActiveCategory(cat)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setActiveCategory(cat);
                                }
                            }}
                            role="button"
                            tabIndex={0}
                        >
                            <img src={cat.imageUrl} alt={cat.name} className={styles.cardImage} />
                            <div className={styles.cardOverlay}>
                                <h3>{cat.name}</h3>
                                {selection ? (
                                    <div className={styles.selection}>Selected: Cookie #{selection}</div>
                                ) : (
                                    <div className={styles.cta}>Tap to Vote</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <footer className={styles.footer}>
                <button
                    onClick={handleSubmit}
                    disabled={submitting || categories.length === 0}
                    className={styles.submitButton}
                >
                    {submitting 
                        ? 'Submitting...' 
                        : hasVoted 
                            ? (votesHaveChanged() ? 'Update Votes' : 'See Results')
                            : 'Submit Votes'
                    }
                </button>
            </footer>
            
            {alertMessage && (
                <AlertModal
                    message={alertMessage}
                    type={alertType}
                    onClose={() => setAlertMessage(null)}
                />
            )}
        </div>
    );
}
