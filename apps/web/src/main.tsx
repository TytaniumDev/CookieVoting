import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { routes } from './app/routes.ts'
import { initMonitoring, reactErrorHandler, wrapCreateBrowserRouter } from './lib/monitoring.ts'
import './styles/index.css'

initMonitoring()

const router = wrapCreateBrowserRouter(createBrowserRouter)(routes)

createRoot(document.getElementById('root')!, {
  // Errors React catches or can't recover from go to Sentry too.
  onUncaughtError: reactErrorHandler(),
  onCaughtError: reactErrorHandler(),
  onRecoverableError: reactErrorHandler(),
}).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
