import { render, screen } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { describe, expect, it, vi } from 'vitest'
import { routes } from './routes.ts'

// Pages read Firestore through the hooks in lib/data.ts; routing tests don't need it.
vi.mock('../lib/data.ts', () => ({
  useEvent: (eventId: string) => ({
    status: 'ready',
    data: { id: eventId, name: `Event ${eventId}`, status: 'voting' },
  }),
}))

function renderAt(path: string) {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />)
}

describe('routes', () => {
  it('renders the voter page for an event link', async () => {
    renderAt('/event/abc123')
    expect(await screen.findByRole('heading', { name: /let's vote/i })).toBeInTheDocument()
    expect(screen.getByText('Event abc123')).toBeInTheDocument()
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
