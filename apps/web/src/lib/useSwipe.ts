import { useRef, type PointerEvent } from 'react'

/** Horizontal travel, in CSS pixels, that counts as a swipe. */
const SWIPE_DISTANCE = 60

/**
 * Pointer handlers that report a horizontal finger swipe. Mostly-vertical moves are
 * ignored so the page still scrolls; mouse drags are ignored so text can be selected.
 */
export function useSwipe(handlers: { onSwipeLeft?: () => void; onSwipeRight?: () => void }) {
  const start = useRef<{ id: number; x: number; y: number } | null>(null)
  return {
    onPointerDown(e: PointerEvent) {
      if (e.pointerType !== 'mouse') start.current = { id: e.pointerId, x: e.clientX, y: e.clientY }
    },
    onPointerUp(e: PointerEvent) {
      const s = start.current
      start.current = null
      if (!s || s.id !== e.pointerId) return
      const dx = e.clientX - s.x
      const dy = e.clientY - s.y
      if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) < 2 * Math.abs(dy)) return
      if (dx < 0) handlers.onSwipeLeft?.()
      else handlers.onSwipeRight?.()
    },
    onPointerCancel() {
      start.current = null
    },
  }
}
