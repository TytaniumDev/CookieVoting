import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTakingLong } from './useTakingLong.ts'

describe('useTakingLong', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('turns true once busy has lasted the whole wait', () => {
    const { result } = renderHook(() => useTakingLong(true, 1000))
    act(() => vi.advanceTimersByTime(999))
    expect(result.current[0]).toBe(false)
    act(() => vi.advanceTimersByTime(1))
    expect(result.current[0]).toBe(true)
  })

  it('stays false when the work finishes in time, and resets when it does', () => {
    const { result, rerender } = renderHook(({ busy }) => useTakingLong(busy, 1000), {
      initialProps: { busy: true },
    })
    act(() => vi.advanceTimersByTime(1000))
    expect(result.current[0]).toBe(true)
    rerender({ busy: false })
    expect(result.current[0]).toBe(false)
    rerender({ busy: true })
    expect(result.current[0]).toBe(false)
    act(() => vi.advanceTimersByTime(500))
    expect(result.current[0]).toBe(false)
  })

  it('restart starts the wait again', () => {
    const { result } = renderHook(() => useTakingLong(true, 1000))
    act(() => vi.advanceTimersByTime(1000))
    act(() => result.current[1]())
    expect(result.current[0]).toBe(false)
    act(() => vi.advanceTimersByTime(1000))
    expect(result.current[0]).toBe(true)
  })
})
