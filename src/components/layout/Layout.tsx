import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AuthButton } from '../atoms/AuthButton/AuthButton';
import { useAuth } from '../../lib/hooks/useAuth';
import styles from './Layout.module.css';

/**
 * Layout - Main layout component for the application.
 * 
 * This component provides the overall page structure including header, main content area,
 * and footer. It conditionally shows/hides the header and footer based on the current
 * route (hidden on the landing page).
 * 
 * The layout includes:
 * - Header with logo and authentication button
 * - Main content area (renders child routes via Outlet)
 * - Footer with copyright information
 * 
 * @example
 * ```tsx
 * <Layout>
 *   <Routes>
 *     <Route path="/" element={<Home />} />
 *     <Route path="/admin" element={<AdminDashboard />} />
 *   </Routes>
 * </Layout>
 * ```
 * 
 * @returns JSX element containing the application layout
 */
export function Layout() {
    const location = useLocation();
    const navigate = useNavigate();
    const isLandingPage = location.pathname === '/';
    // Hide header/footer on voting pages for immersive experience
    const isVotingPage = location.pathname.startsWith('/vote/');
    const { user, loading, signIn, signOut } = useAuth();

    const handleSignOut = async () => {
        await signOut();
        navigate('/', { replace: true });
    };

    return (
        <div className={styles.container}>
            {!isLandingPage && !isVotingPage && (
                <header className={styles.header}>
                    <div className={styles.headerContent}>
                        <Link to="/" className={styles.logo}>
                            🍪 Cookie Voting
                        </Link>
                        <AuthButton 
                            user={user}
                            loading={loading}
                            onSignIn={signIn}
                            onSignOut={handleSignOut}
                        />
                    </div>
                </header>
            )}
            <main className={isVotingPage ? styles.votingMain : styles.main}>
                <Outlet />
            </main>
            {!isLandingPage && !isVotingPage && (
                <footer className={styles.footer}>
                    <p>&copy; {new Date().getFullYear()} Cookie Voting</p>
                </footer>
            )}
        </div>
    );
}
