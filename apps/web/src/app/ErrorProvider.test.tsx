import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useShowError } from '../lib/errors.ts'
import { ErrorProvider } from './ErrorProvider.tsx'

function Saver() {
  const showError = useShowError()
  return (
    <button type="button" onClick={() => showError("That didn't save", new Error('No permission'))}>
      Save
    </button>
  )
}

describe('ErrorProvider', () => {
  it('shows an action’s error above the page, once, until dismissed', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorProvider>
        <Saver />
      </ErrorProvider>,
    )
    expect(screen.queryByRole('alert')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent("That didn't save")
    expect(alert).toHaveTextContent('No permission')
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    // Rendered before the page content, so it's at the top.
    expect(
      alert.compareDocumentPosition(screen.getByRole('button', { name: 'Save' })) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
