import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInAsTestUser, isUsingEmulator } from '../lib/emulatorAuth';
import { addGlobalAdmin } from '../lib/firestore';
import { AuthButton } from '../components/AuthButton';
import { useAuth } from '../lib/hooks/useAuth';
import styles from './Home.module.css';

export default function Home() {
    const navigate = useNavigate();
    const [isEnablingTestUser, setIsEnablingTestUser] = useState(false);
    const { user, loading, signIn, signOut } = useAuth();

    useEffect(() => {
        // Check if user is already signed in
        if (!loading && user) {
            // Check if user is signed in
            const isSignedIn = user && (
                user.email || 
                (user.providerData && user.providerData.length > 0)
            );
            
            if (isSignedIn) {
                // User is signed in, redirect to admin page
                navigate('/admin', { replace: true });
            }
        }
    }, [user, loading, navigate]);

    const handleTestUserSignIn = async () => {
        setIsEnablingTestUser(true);
        try {
            if (!isUsingEmulator()) {
                alert('Emulator auth is only available when using Firebase emulators.\n\nMake sure emulators are running:\nnpm run emulators:start');
                return;
            }
            
            const user = await signInAsTestUser();
            
            // Ensure user is admin in emulator
            try {
                await addGlobalAdmin(user.uid);
                console.log('✅ Test user added as admin');
            } catch (error: unknown) {
                const firebaseError = error as { message?: string };
                // If already admin or permission error, that's okay
                if (!firebaseError.message?.includes('already') && !firebaseError.message?.includes('Permission')) {
                    console.warn('Could not auto-add test user as admin:', error);
                }
            }
            
            // Redirect will happen via auth state listener
        } catch (error: unknown) {
            const firebaseError = error as { message?: string };
            console.error('Error signing in as test user:', error);
            alert(`Failed to sign in: ${firebaseError.message || 'Unknown error'}`);
        } finally {
            setIsEnablingTestUser(false);
        }
    };

    return (
        <div className={styles.landingContainer}>
            <div className={styles.snowContainer}>
                {Array.from({ length: 50 }).map((_, i) => (
                    <div key={i} className={styles.snowflake} style={{
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 3}s`,
                        animationDuration: `${3 + Math.random() * 4}s`,
                        opacity: Math.random() * 0.5 + 0.5
                    }}>❄</div>
                ))}
            </div>
            <div className={styles.landingContent}>
                <h1 className={styles.title}>
                    <span className={styles.cookieEmoji}>🍪</span>
                    Cookie Voting
                </h1>
                <p className={styles.subtitle}>Cast your vote for the best cookies!</p>
                <div className={styles.authSection}>
                    <p className={styles.authPrompt}>Administrators, sign in to manage events:</p>
                    <AuthButton 
                        user={user}
                        loading={loading}
                        onSignIn={signIn}
                        onSignOut={signOut}
                    />
                    {isUsingEmulator() && (
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                            <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem', opacity: 0.8 }}>
                                Development: Using Firebase Emulators
                            </p>
                            <button
                                onClick={handleTestUserSignIn}
                                disabled={isEnablingTestUser}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    fontSize: '0.875rem',
                                    backgroundColor: isEnablingTestUser ? '#666' : '#4a5568',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: isEnablingTestUser ? 'not-allowed' : 'pointer',
                                    fontWeight: '500',
                                    transition: 'background-color 0.2s'
                                }}
                            >
                                {isEnablingTestUser ? 'Signing in...' : 'Sign in with Test User'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
