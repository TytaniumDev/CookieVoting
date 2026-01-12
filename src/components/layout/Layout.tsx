import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AuthButton } from '../atoms/AuthButton/AuthButton';
import { useAuth } from '../../lib/hooks/useAuth';

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
    <div className="flex flex-col min-h-screen">
      {!isLandingPage && !isVotingPage && (
        <header className="bg-[#1a2b47] border-b border-white/10 py-4 shadow-md">
          <div className="max-w-[1200px] mx-auto px-6 md:px-3 flex items-center justify-between">
            <Link
              to="/"
              className="text-xl font-bold text-[#f8fafc] flex items-center gap-2 transition-transform hover:scale-105"
            >
              🍪 Cookie Voting
            </Link>
            <AuthButton user={user} loading={loading} onSignIn={signIn} onSignOut={handleSignOut} />
          </div>
        </header>
      )}
      <main
        className={
          isVotingPage ? 'flex-1 w-full mx-0 p-0' : 'flex-1 w-full max-w-[1200px] mx-auto p-6 md:p-2'
        }
      >
        <Outlet />
      </main>
      {!isLandingPage && !isVotingPage && (
        <footer className="text-center p-6 text-[#cbd5e1] text-sm border-t border-white/5">
          <p>&copy; {new Date().getFullYear()} Cookie Voting</p>
        </footer>
      )}
    </div>
  );
}
