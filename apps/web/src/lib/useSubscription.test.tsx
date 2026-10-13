import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useSubscription, type Subscribe } from './useSubscription.ts'

function fakeSource<T>() {
  const listeners = new Set<{ onData: (data: T) => void; onError: (error: Error) => void }>()
  const subscribe: Subscribe<T> = (onData, onError) => {
    const listener = { onData, onError }
    listeners.add(listener)
    return () => listeners.delete(listener)
  }
  return {
    subscribe: vi.fn<Subscribe<T>>(subscribe),
    emit: (data: T) => listeners.forEach((l) => l.onData(data)),
    fail: (error: Error) => listeners.forEach((l) => l.onError(error)),
    get listenerCount() {
      return listeners.size
    },
  }
}

describe('useSubscription', () => {
  it('reports loading, then each value the listener sends', () => {
    const source = fakeSource<string>()
    const { result } = renderHook(() => useSubscription(source.subscribe, 'a'))
    expect(result.current).toEqual({ status: 'loading' })
    act(() => source.emit('first'))
    expect(result.current).toEqual({ status: 'ready', data: 'first' })
    act(() => source.emit('second'))
    expect(result.current).toEqual({ status: 'ready', data: 'second' })
  })

  it('reports errors', () => {
    const source = fakeSource<string>()
    const { result } = renderHook(() => useSubscription(source.subscribe, 'a'))
    act(() => source.fail(new Error('denied')))
    expect(result.current).toMatchObject({ status: 'error', error: { message: 'denied' } })
  })

  it('stops listening on unmount', () => {
    const source = fakeSource<string>()
    const { unmount } = renderHook(() => useSubscription(source.subscribe, 'a'))
    expect(source.listenerCount).toBe(1)
    unmount()
    expect(source.listenerCount).toBe(0)
  })

  it('restarts when the key changes, without showing the old data', () => {
    const source = fakeSource<string>()
    const { result, rerender } = renderHook(({ id }) => useSubscription(source.subscribe, id), {
      initialProps: { id: 'a' },
    })
    act(() => source.emit('from a'))
    rerender({ id: 'b' })
    expect(result.current).toEqual({ status: 'loading' })
    expect(source.listenerCount).toBe(1)
    expect(source.subscribe).toHaveBeenCalledTimes(2)
  })

  it("doesn't subscribe when given null", () => {
    const { result } = renderHook(() => useSubscription<string>(null, 'a'))
    expect(result.current).toEqual({ status: 'loading' })
  })
})
