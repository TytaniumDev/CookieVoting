import { useState, useEffect, useRef } from 'react';
import type { User } from 'firebase/auth';
import { AlertModal } from './AlertModal';
import styles from './AuthButton.module.css';

/**
 * Props for the AuthButton component
 */
interface AuthButtonProps {
    /** Current authenticated user, or null if not signed in */
    user: User | null;
    /** Whether authentication state is still loading */
    loading: boolean;
    /** Callback function called when user clicks sign in */
    onSignIn: () => Promise<void>;
    /** Callback function called when user clicks sign out */
    onSignOut: () => Promise<void>;
}

/**
 * AuthButton - Authentication button component with user menu.
 * 
 * This component displays either a sign-in button or a user menu with avatar and sign-out option.
 * It does not directly interact with Firebase - all auth logic should be handled by parent components
 * using the useAuth hook or similar.
 * 
 * Features:
 * - User avatar display (photo or initial)
 * - Dropdown menu with user info and sign-out
 * - Error handling with alert modals
 * 
 * @example
 * ```tsx
 * const { user, loading, signIn, signOut } = useAuth();
 * 
 * <AuthButton
 *   user={user}
 *   loading={loading}
 *   onSignIn={signIn}
 *   onSignOut={signOut}
 * />
 * ```
 * 
 * @param props - Component props
 * @returns JSX element containing either sign-in button or user menu
 */
export function AuthButton({ user, loading, onSignIn, onSignOut }: AuthButtonProps) {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [alertType, setAlertType] = useState<'success' | 'error' | 'info'>('error');

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
            await onSignIn();
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
            await onSignOut();
            setShowMenu(false);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };


    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner} />
            </div>
        );
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

