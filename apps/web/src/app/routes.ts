import type { RouteObject } from 'react-router'
import { loadChunk } from '../lib/staleChunk.ts'
import { NotFoundPage } from '../pages/NotFoundPage.tsx'
import { RouteErrorPage } from '../pages/RouteErrorPage.tsx'
import { AppLayout } from './AppLayout.tsx'
import { LoadingScreen } from './LoadingScreen.tsx'
import { ReadableLayout } from './ReadableLayout.tsx'

/**
 * URL structure from the PRD. Pages are lazy-loaded so voters on phones never
 * download admin code (which will include the in-browser detection model).
 * `loadChunk` reloads the page when a tab from before a deploy asks for a chunk that's gone.
 */
export const routes: RouteObject[] = [
  {
    Component: AppLayout,
    HydrateFallback: LoadingScreen,
    // Only reached if the app bar itself fails; page errors are caught below, under it.
    ErrorBoundary: RouteErrorPage,
    children: [
      {
        ErrorBoundary: RouteErrorPage,
        children: [
          {
            // Admin pages: sign-in and the admin allowlist check wrap all of them.
            lazy: () =>
              loadChunk(async () => ({
                Component: (await import('../pages/admin/AdminGate.tsx')).AdminGate,
              })),
            children: [
              {
                path: '/',
                lazy: () =>
                  loadChunk(async () => ({
                    Component: (await import('../pages/admin/AdminHomePage.tsx')).AdminHomePage,
                  })),
              },
              {
                path: '/admin/events/new',
                lazy: () =>
                  loadChunk(async () => ({
                    Component: (await import('../pages/admin/NewEventPage.tsx')).NewEventPage,
                  })),
              },
              {
                path: '/admin/admins',
                lazy: () =>
                  loadChunk(async () => ({
                    Component: (await import('../pages/admin/AdminsPage.tsx')).AdminsPage,
                  })),
              },
              {
                path: '/admin/events/:eventId',
                lazy: () =>
                  loadChunk(async () => ({
                    Component: (await import('../pages/admin/EventSetupPage.tsx')).EventSetupPage,
                  })),
              },
            ],
          },
          {
            Component: ReadableLayout,
            children: [
              {
                path: '/event/:eventId',
                lazy: () =>
                  loadChunk(async () => ({
                    Component: (await import('../pages/voter/VoterEventPage.tsx')).VoterEventPage,
                  })),
              },
              {
                path: '/event/:eventId/results',
                lazy: () =>
                  loadChunk(async () => ({
                    Component: (await import('../pages/voter/ResultsPage.tsx')).ResultsPage,
                  })),
              },
              { path: '*', Component: NotFoundPage },
            ],
          },
        ],
      },
    ],
  },
]
