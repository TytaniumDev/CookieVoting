import { render, screen } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { describe, expect, it, vi } from 'vitest'
import { RouteErrorPage } from './RouteErrorPage.tsx'

function renderFailing(error: Error) {
  const router = createMemoryRouter([
    {
      path: '/',
      ErrorBoundary: RouteErrorPage,
      lazy: () => Promise.reject(error),
    },
  ])
  render(<RouterProvider router={router} />)
}

describe('RouteErrorPage', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})

  it('asks to try again when a page chunk would not load', async () => {
    renderFailing(new TypeError('Failed to fetch dynamically imported module: /assets/a.js'))
    expect(await screen.findByText(/didn't load/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('shows a friendly message for other errors', async () => {
    renderFailing(new Error('boom'))
    expect(await screen.findByRole('heading', { name: 'Oh, crumbs!' })).toBeInTheDocument()
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument()
  })
})
