import type { RouteObject } from 'react-router'
import { NotFoundPage } from '../pages/NotFoundPage.tsx'
import { AppLayout } from './AppLayout.tsx'
import { LoadingScreen } from './LoadingScreen.tsx'
import { ReadableLayout } from './ReadableLayout.tsx'

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
        // Admin pages: sign-in and the admin allowlist check wrap all of them.
        lazy: async () => ({
          Component: (await import('../pages/admin/AdminGate.tsx')).AdminGate,
        }),
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
            path: '/admin/admins',
            lazy: async () => ({
              Component: (await import('../pages/admin/AdminsPage.tsx')).AdminsPage,
            }),
          },
          {
            path: '/admin/events/:eventId',
            lazy: async () => ({
              Component: (await import('../pages/admin/EventSetupPage.tsx')).EventSetupPage,
            }),
          },
        ],
      },
      {
        Component: ReadableLayout,
        children: [
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
    ],
  },
]
