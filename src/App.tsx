import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home'))
const AdminHome = lazy(() => import('./pages/AdminHome'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const WizardPage = lazy(() => import('./pages/WizardPage'))
const VotingPage = lazy(() => import('./pages/VotingPage'))
const ResultsPage = lazy(() => import('./pages/ResultsPage'))
const CookieDetectionTest = lazy(() => import('./pages/CookieDetectionTest'))
const CookieDetectionDebug = lazy(() => import('./pages/CookieDetectionDebug'))
const ImageDetectionAudit = lazy(() => import('./pages/ImageDetectionAudit'))
const CookieDetectionVisualizer = lazy(() => import('./pages/CookieDetectionVisualizer'))

// Loading fallback component
const PageLoader = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '50vh',
    fontSize: '1.2rem',
    color: '#333'
  }}>
    <div>Loading...</div>
  </div>
)

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={
            <Suspense fallback={<PageLoader />}>
              <Home />
            </Suspense>
          } />
          <Route path="admin" element={
            <Suspense fallback={<PageLoader />}>
              <AdminHome />
            </Suspense>
          } />
          <Route path="admin/:eventId" element={
            <Suspense fallback={<PageLoader />}>
              <AdminDashboard />
            </Suspense>
          } />
          <Route path="admin/:eventId/wizard" element={
            <Suspense fallback={<PageLoader />}>
              <WizardPage />
            </Suspense>
          } />
          <Route path="vote/:eventId" element={
            <Suspense fallback={<PageLoader />}>
              <VotingPage />
            </Suspense>
          } />
          <Route path="results/:eventId" element={
            <Suspense fallback={<PageLoader />}>
              <ResultsPage />
            </Suspense>
          } />
          <Route path="test-cookies" element={
            <Suspense fallback={<PageLoader />}>
              <CookieDetectionTest />
            </Suspense>
          } />
          <Route path="test-cookies-debug" element={
            <Suspense fallback={<PageLoader />}>
              <CookieDetectionDebug />
            </Suspense>
          } />
          <Route path="admin/audit/detections" element={
            <Suspense fallback={<PageLoader />}>
              <ImageDetectionAudit />
            </Suspense>
          } />
          <Route path="test-detection-visualizer" element={
            <Suspense fallback={<PageLoader />}>
              <CookieDetectionVisualizer />
            </Suspense>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
