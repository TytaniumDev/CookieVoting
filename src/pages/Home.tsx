import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { AuthButton } from '../components/atoms/AuthButton/AuthButton';
import { useAuth } from '../lib/hooks/useAuth';
import styles from './Home.module.css';

export default function Home() {
  const navigate = useNavigate();
  const { user, loading, signIn, signOut } = useAuth();

  useEffect(() => {
    // Check if user is already signed in
    if (!loading && user) {
      // Check if user is signed in
      const isSignedIn =
        user && (user.email || (user.providerData && user.providerData.length > 0));

      if (isSignedIn) {
        // User is signed in, redirect to admin page
        navigate('/admin', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  return (
    <div className={styles.landingContainer}>
      <div className={styles.snowContainer}>
        {Array.from({ length: 50 }, (_, i) => (
          <div
            key={`snowflake-${i}`}
            className={styles.snowflake}
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
              opacity: Math.random() * 0.5 + 0.5,
            }}
          >
            ❄
          </div>
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
          <AuthButton user={user} loading={loading} onSignIn={signIn} onSignOut={signOut} />
        </div>
      </div>
    </div>
  );
}
