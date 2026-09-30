import type { RouteObject } from 'react-router'
import { NotFoundPage } from '../pages/NotFoundPage.tsx'
import { AppLayout } from './AppLayout.tsx'
import { LoadingScreen } from './LoadingScreen.tsx'

/**
 * URL structure from the PRD. Pages are lazy-loaded so voters on phones never
 * download admin code (which will include the in-browser detection model).
 */
export const routes: RouteObject[] = [
  {
    Component: AppLayout,
    HydrateFallback: LoadingScreen,
    children: [
      {
        path: '/',
        lazy: async () => ({
          Component: (await import('../pages/admin/AdminHomePage.tsx')).AdminHomePage,
        }),
      },
      {
        path: '/admin/events/new',
        lazy: async () => ({
          Component: (await import('../pages/admin/NewEventPage.tsx')).NewEventPage,
        }),
      },
      {
        path: '/admin/events/:eventId',
        lazy: async () => ({
          Component: (await import('../pages/admin/EventSetupPage.tsx')).EventSetupPage,
        }),
      },
      {
        path: '/event/:eventId',
        lazy: async () => ({
          Component: (await import('../pages/voter/VoterEventPage.tsx')).VoterEventPage,
        }),
      },
      {
        path: '/event/:eventId/results',
        lazy: async () => ({
          Component: (await import('../pages/voter/ResultsPage.tsx')).ResultsPage,
        }),
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
]
