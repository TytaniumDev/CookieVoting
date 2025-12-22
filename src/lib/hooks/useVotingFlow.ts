import { useState, useEffect } from 'react';
import { useResultsData } from './useResultsData';
import { submitVote, getUserVote, markResultsViewed } from '../firestore';
import { useAuth } from './useAuth';

export type VotingStep = 'LANDING' | 'VOTING' | 'WAITING' | 'RESULTS';

export const useVotingFlow = (eventId: string | undefined) => {
    const { event, results, loading, error } = useResultsData(eventId);
    const { user, getOrCreateAnonymousId } = useAuth();

    const [currentStep, setCurrentStep] = useState<VotingStep>('LANDING');
    const [votes, setVotes] = useState<Record<string, number>>({});
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Initial state check
    useEffect(() => {
        if (!event || !eventId) return;

        const checkUserStatus = async () => {
            try {
                const userId = user?.uid || await getOrCreateAnonymousId();
                const existingVote = await getUserVote(eventId, userId);

                if (existingVote) {
                    // Pre-fill votes
                    setVotes(existingVote.votes);

                    // Check if they are locked out because they viewed results
                    if (existingVote.viewedResults) {
                        setCurrentStep('WAITING');
                        // Note: ideally we might go straight to results, but waiting screen handles "View Results" click
                        // We will handle "results ready" visualization in Waiting view as well
                    } else if (Object.keys(existingVote.votes).length > 0) {
                        // They have voted but not locked results yet
                        setCurrentStep('WAITING');
                    }
                }
            } catch (err) {
                console.error("Error checking user status:", err);
            }
        };

        checkUserStatus();
    }, [event, eventId, user, getOrCreateAnonymousId]);

    const handleStartVoting = () => {
        if (event?.status === 'completed') {
            setCurrentStep('WAITING');
        } else {
            setCurrentStep('VOTING');
        }
    };

    const handleVote = (categoryId: string, cookieNumber: number) => {
        setVotes(prev => ({
            ...prev,
            [categoryId]: cookieNumber
        }));
    };

    const handleSubmitVotes = async () => {
        if (!eventId) return;
        setSubmitError(null);
        try {
            const userId = user?.uid || await getOrCreateAnonymousId();
            await submitVote(eventId, userId, votes);
            setCurrentStep('WAITING');
        } catch (err: any) {
            console.error("Error submitting votes:", err);
            setSubmitError(err.message || "Failed to submit votes");
        }
    };

    const handleViewResults = async () => {
        if (!eventId) return;
        try {
            const userId = user?.uid || await getOrCreateAnonymousId();
            // Lock the user!
            await markResultsViewed(eventId, userId);
            setCurrentStep('RESULTS');
        } catch (err: any) {
            console.error("Error locking results view:", err);
            // If error (e.g. network), we might just show results anyway?
            // But strict requirement is to lock.
            // Let's assume critical failure if we can't lock.
            setSubmitError("Failed to verify access to results. Please try again.");
        }
    };

    return {
        event,
        results, // Contains categories and detections
        loading,
        error,
        currentStep,
        votes,
        handleStartVoting,
        handleVote,
        handleSubmitVotes,
        handleViewResults,
        submitError
    };
};
