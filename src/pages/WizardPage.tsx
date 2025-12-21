import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getEvent, isGlobalAdmin } from '../lib/firestore';
import { EventSetupWizard } from '../components/EventSetupWizard';
import { type VoteEvent } from '../lib/types';
import styles from './WizardPage.module.css';

export default function WizardPage() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const categoryId = searchParams.get('categoryId');
    const [event, setEvent] = useState<VoteEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [checkingAccess, setCheckingAccess] = useState(true);

    useEffect(() => {
        if (!eventId) {
            navigate('/admin', { replace: true });
            return;
        }

        const checkAccess = async () => {
            setCheckingAccess(true);
            try {
                // Get current user
                const user = auth.currentUser;
                
                if (!user || !user.email) {
                    navigate('/', { replace: true });
                    setIsAdmin(false);
                    setCheckingAccess(false);
                    return;
                }
                
                // Check if user is an admin
                const admin = await isGlobalAdmin(user.uid);
                setIsAdmin(admin);

                if (!admin) {
                    navigate('/admin', { replace: true });
                    setCheckingAccess(false);
                    return;
                }

                // Load event data
                const eventData = await getEvent(eventId);
                setEvent(eventData);
            } catch (err) {
                console.error("Failed to check access", err);
                navigate('/admin', { replace: true });
            } finally {
                setLoading(false);
                setCheckingAccess(false);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, async () => {
            await checkAccess();
        });

        checkAccess();

        return () => unsubscribe();
    }, [eventId, navigate]);

    if (checkingAccess || loading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    if (!isAdmin || !event || !eventId) {
        return null; // Will redirect
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button onClick={() => navigate(`/admin/${eventId}`)} className={styles.backButton}>
                    ← Back to Event
                </button>
                <h1>{event.name} - Setup Wizard</h1>
            </div>
            <EventSetupWizard
                eventId={eventId}
                eventName={event.name}
                initialCategoryId={categoryId || undefined}
                autoAdvance={!categoryId} // Only auto-advance if no categoryId (came from "Open Wizard" button)
                onComplete={async () => {
                    // Navigate back to event dashboard after completion
                    navigate(`/admin/${eventId}`);
                }}
                onCancel={() => navigate(`/admin/${eventId}`)}
            />
        </div>
    );
}

