import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useWakeLock } from './wakeLock.ts'

function fakeWakeLock() {
  const release = vi.fn<() => Promise<void>>(async () => {})
  const request = vi.fn<
    (type: string) => Promise<{ released: boolean; release: () => Promise<void> }>
  >(async () => ({ released: false, release }))
  Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true })
  return { request, release }
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'wakeLock')
})

describe('useWakeLock', () => {
  it('keeps the screen on while mounted and lets go on unmount', async () => {
    const { request, release } = fakeWakeLock()
    const { unmount } = renderHook(() => useWakeLock())
    await vi.waitFor(() => expect(request).toHaveBeenCalledWith('screen'))
    unmount()
    expect(release).toHaveBeenCalled()
  })

  it('does nothing while inactive', () => {
    const { request } = fakeWakeLock()
    renderHook(() => useWakeLock(false))
    expect(request).not.toHaveBeenCalled()
  })

  it('does nothing where the browser has no wake lock', () => {
    expect(() => renderHook(() => useWakeLock())).not.toThrow()
  })
})
