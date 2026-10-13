import { render, screen } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { describe, expect, it, vi } from 'vitest'
import { routes } from './routes.ts'

// Pages read Firestore and Auth through the hooks in lib/; routing tests don't need them.
vi.mock('../lib/data.ts', () => ({
  useEvent: (eventId: string) => ({
    status: 'ready',
    data: { id: eventId, name: `Event ${eventId}`, status: 'voting' },
  }),
  useBallot: () => ({ status: 'ready', data: null }),
  useCategories: () => ({
    status: 'ready',
    data: [
      {
        id: 'cat-1',
        name: 'Stars',
        order: 0,
        photo: { path: 'p', url: '/plates/4-cookies_stars.jpg', width: 4, height: 3 },
        cookies: [{ id: 'c1', box: { x: 0, y: 0, width: 0.5, height: 0.5 } }],
      },
    ],
  }),
}))
vi.mock('../lib/auth.ts', () => ({
  useVoter: () => ({ status: 'ready', data: { uid: 'voter-1' } }),
}))

function renderAt(path: string) {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />)
}

describe('routes', () => {
  it('renders the voter page for an event link', async () => {
    renderAt('/event/abc123')
    expect(await screen.findByRole('heading', { name: 'Event abc123' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start voting' })).toBeInTheDocument()
  })

  it('renders the results page', async () => {
    renderAt('/event/abc123/results')
    expect(await screen.findByRole('heading', { name: /results/i })).toBeInTheDocument()
  })

  it('shows a friendly 404 for unknown paths', async () => {
    renderAt('/nope')
    expect(await screen.findByRole('heading', { name: /crumbs/i })).toBeInTheDocument()
  })
})
