import { Suspense, lazy, useEffect } from 'react';
import { useAuthStore } from './lib/stores/useAuthStore';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { AdminLayout } from './components/layout/AdminLayout';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const AdminHome = lazy(() => import('./pages/AdminHome'));
const VotingPage = lazy(() => import('./pages/VotingPage'));
const ResultsPage = lazy(() => import('./pages/ResultsPage'));

// Admin sub-pages
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview'));
const AdminBakers = lazy(() => import('./pages/admin/AdminBakers'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));

// Loading fallback component
const PageLoader = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '50vh',
      fontSize: '1.2rem',
      color: '#333',
    }}
  >
    <div>Loading...</div>
  </div>
);

function App() {
  const initializeAuth = useAuthStore((state) => state.initialize);

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, [initializeAuth]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
        <Route path="/" element={<Layout />}>
          <Route
            index
            element={
              <Suspense fallback={<PageLoader />}>
                <Home />
              </Suspense>
            }
          />
          <Route
            path="admin"
            element={
              <Suspense fallback={<PageLoader />}>
                <AdminHome />
              </Suspense>
            }
          />
          <Route
            path="vote/:eventId"
            element={
              <Suspense fallback={<PageLoader />}>
                <VotingPage />
              </Suspense>
            }
          />
          <Route
            path="results/:eventId"
            element={
              <Suspense fallback={<PageLoader />}>
                <ResultsPage />
              </Suspense>
            }
          />
        </Route>

        {/* Admin Dashboard with Sidebar Layout */}
        <Route
          path="admin/:eventId"
          element={
            <Suspense fallback={<PageLoader />}>
              <AdminLayout />
            </Suspense>
          }
        >
          <Route index element={<Navigate to="overview" replace />} />
          <Route
            path="overview"
            element={
              <Suspense fallback={<PageLoader />}>
                <AdminOverview />
              </Suspense>
            }
          />
          <Route
            path="bakers"
            element={
              <Suspense fallback={<PageLoader />}>
                <AdminBakers />
              </Suspense>
            }
          />
          <Route
            path="categories"
            element={
              <Suspense fallback={<PageLoader />}>
                <AdminCategories />
              </Suspense>
            }
          />
          <Route
            path="settings"
            element={
              <Suspense fallback={<PageLoader />}>
                <AdminSettings />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

