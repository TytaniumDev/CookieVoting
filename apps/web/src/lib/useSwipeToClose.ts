import { useEffect, useRef, type RefObject } from 'react'

// How far (px) or how fast (px/ms) a drag has to go to close; less springs back.
const CLOSE_DISTANCE = 110
const CLOSE_SPEED = 0.6

/** Whether the touch landed in something inside `dialog` that's scrolled away from its top. */
function scrolledDown(target: EventTarget | null, dialog: HTMLElement): boolean {
  for (let el = target instanceof Element ? target : null; el; el = el.parentElement) {
    if (el.scrollTop > 0) return true
    if (el === dialog) break
  }
  return false
}

/**
 * Drag a modal `<dialog>` down to close it, like an iOS sheet (see `BottomSheet`). A drag
 * starts only where nothing under the finger is scrolled down, so scrolling a long list
 * still works. The dialog follows the finger and springs back, or slides away and calls
 * `onClose` when let go far enough down or flicked. Touch only: mice keep the ✕ and the
 * backdrop.
 */
export function useSwipeToClose(ref: RefObject<HTMLDialogElement | null>, onClose: () => void) {
  // Callers pass a fresh function each render; don't restart a drag for it.
  const close = useRef(onClose)
  useEffect(() => {
    close.current = onClose
  })

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    let startY = 0
    let startT = 0
    let lastY = 0
    let lastT = 0
    let dragging = false
    let fromTop = false

    const move = (dy: number, animate: boolean) => {
      dialog.style.transition = animate ? 'translate 0.25s cubic-bezier(0.2, 0.8, 0.3, 1)' : ''
      dialog.style.translate = dy ? `0 ${dy}px` : ''
    }

    const onStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (!touch || e.touches.length > 1) return
      startY = lastY = touch.clientY
      startT = lastT = e.timeStamp
      fromTop = !scrolledDown(e.target, dialog)
      dragging = false
    }
    const onMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (!touch || !fromTop) return
      const dy = touch.clientY - startY
      if (!dragging) {
        // Only a downward pull from the top drags; anything else scrolls as usual.
        if (dy < 6) {
          if (dy < -6) fromTop = false
          return
        }
        dragging = true
      }
      e.preventDefault()
      lastY = touch.clientY
      lastT = e.timeStamp
      move(Math.max(0, dy), false)
    }
    const onEnd = (e: TouchEvent) => {
      if (!dragging) return
      dragging = false
      const dy = lastY - startY
      const speed = (lastY - startY) / Math.max(1, lastT - startT)
      const recent = e.timeStamp - lastT < 100 ? speed : 0
      if (dy > CLOSE_DISTANCE || recent > CLOSE_SPEED) {
        move(window.innerHeight, true)
        window.setTimeout(() => {
          close.current()
          move(0, false)
        }, 220)
      } else {
        move(0, true)
      }
    }

    dialog.addEventListener('touchstart', onStart, { passive: true })
    dialog.addEventListener('touchmove', onMove, { passive: false })
    dialog.addEventListener('touchend', onEnd)
    dialog.addEventListener('touchcancel', onEnd)
    return () => {
      dialog.removeEventListener('touchstart', onStart)
      dialog.removeEventListener('touchmove', onMove)
      dialog.removeEventListener('touchend', onEnd)
      dialog.removeEventListener('touchcancel', onEnd)
      move(0, false)
    }
  }, [ref])
}
