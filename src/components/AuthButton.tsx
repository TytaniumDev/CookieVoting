import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import type { User } from 'firebase/auth';
import { AlertModal } from './AlertModal';
import styles from './AuthButton.module.css';

/**
 * AuthButton - Authentication button component with user menu.
 * 
 * This component handles user authentication and displays either a sign-in button
 * or a user menu with avatar and sign-out option. It integrates with Firebase Auth
 * and supports both popup and redirect authentication flows.
 * 
 * Features:
 * - Google Sign-In integration
 * - Automatic redirect result handling
 * - User avatar display (photo or initial)
 * - Dropdown menu with user info and sign-out
 * - Error handling with alert modals
 * - Automatic navigation after sign-out
 * 
 * The component automatically detects authentication state changes and updates
 * the UI accordingly. It handles both popup and redirect authentication methods,
 * falling back to redirect if popup is blocked.
 * 
 * @example
 * ```tsx
 * <AuthButton />
 * ```
 * 
 * @returns JSX element containing either sign-in button or user menu
 */
export function AuthButton() {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<'success' | 'error' | 'info'>('error');

    useEffect(() => {
        let isMounted = true;

        // Check for redirect result first, BEFORE setting up auth state listener
        const initializeAuth = async () => {
            try {
                const result = await getRedirectResult(auth);
                if (result && isMounted) {
                    console.log('User signed in via redirect:', result.user.email);
                    // The auth state will be updated by onAuthStateChanged below
                } else {
                    console.log('No redirect result found');
                }
            } catch (error: unknown) {
                const firebaseError = error as { code?: string; message?: string };
                if (firebaseError?.code !== 'auth/no-auth-event' && isMounted) {
                    console.error('Error getting redirect result:', error);
                }
            }

            // Test user is enabled - no need to add to admin list anymore
            // Anonymous users can now create/delete test events directly

            // Check current auth state
            const currentUser = auth.currentUser;
            console.log('Current auth user:', currentUser ? (currentUser.isAnonymous ? 'anonymous (test user)' : currentUser.email) : 'none');

            // Now set up the auth state listener
            // This will fire immediately with the current user (including after redirect)
            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                if (isMounted) {
                    // Regular Firebase auth user
                    console.log('Auth state changed:', user ? `${user.email || 'user'} (${user.uid})` : 'signed out');
                    setUser(user);
                    setLoading(false);
                }
            });

            return unsubscribe;
        };

        let unsubscribe: (() => void) | undefined;
        initializeAuth().then((unsub) => {
            unsubscribe = unsub;
        });

        return () => {
            isMounted = false;
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showMenu]);

    const handleSignIn = async () => {
        try {
            const provider = new GoogleAuthProvider();
            // Request additional scopes for profile information
            provider.addScope('profile');
            provider.addScope('email');
            
            console.log('Starting Google sign-in...');
            
            // Try popup first (more reliable in most browsers)
            try {
                console.log('Attempting popup sign-in...');
                const userCredential = await signInWithPopup(auth, provider);
                console.log('✅ Google sign-in successful');
                console.log('📋 Your User UID:', userCredential.user.uid);
                console.log('📧 Your Email:', userCredential.user.email);
                console.log('💡 Tip: Enable test user mode to use a separate test database');
                console.log('🔧 To create events, add your UID to: Firebase Console → Firestore → system/admins → userIds array');
            } catch (popupError: unknown) {
                const firebaseError = popupError as { code?: string; message?: string };
                // If popup is blocked or fails, fall back to redirect
                if (firebaseError?.code === 'auth/popup-blocked' || 
                    firebaseError?.code === 'auth/popup-closed-by-user' ||
                    firebaseError?.code === 'auth/cancelled-popup-request') {
                    console.log('Popup blocked/failed, using redirect flow');
                    await signInWithRedirect(auth, provider);
                    // signInWithRedirect doesn't return, it redirects the page
                    return;
                }
                throw popupError;
            }
        } catch (error: unknown) {
            console.error('Error signing in:', error);
            const firebaseError = error as { code?: string; message?: string };
            // Only show alert if it's not a redirect cancellation
            if (firebaseError?.code !== 'auth/redirect-cancelled-by-user') {
                setAlertMessage(`Failed to sign in: ${firebaseError?.message || 'Please try again.'}`);
                setAlertType('error');
            }
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            setShowMenu(false);
            // Redirect to landing page after sign out
            navigate('/', { replace: true });
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };


    if (loading) {
        return <div className={styles.loading}>...</div>;
    }

    // Show user menu if user is authenticated
    if (user && user.email) {
        return (
            <div className={styles.userMenu} ref={menuRef}>
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className={styles.avatarButton}
                    title={`Signed in as ${user.displayName || user.email}`}
                >
                    {user.photoURL ? (
                        <img
                            src={user.photoURL}
                            alt={user.displayName || 'User avatar'}
                            className={styles.avatar}
                        />
                    ) : (
                        <div className={styles.avatarPlaceholder}>
                            {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                    )}
                </button>
                {showMenu && (
                    <div className={styles.dropdown}>
                        <div className={styles.userInfo}>
                            <div className={styles.userName}>{user.displayName || 'User'}</div>
                            <div className={styles.userEmail}>{user.email}</div>
                        </div>
                        <button onClick={handleSignOut} className={styles.signOutButton}>
                            Sign out
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button 
                onClick={(e) => {
                    e.preventDefault();
                    console.log('Sign in button clicked');
                    handleSignIn();
                }} 
                className={styles.signInButton}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
            </button>
            
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

