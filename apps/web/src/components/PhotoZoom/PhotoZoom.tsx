import type { PlatePhoto } from '@cookie-voting/shared'
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '../Button/Button.tsx'
import { CookieImage } from '../CookieImage/CookieImage.tsx'
import { previewPlacement } from './previewPlacement.ts'

export interface PhotoZoomProps {
  photo: Pick<PlatePhoto, 'url' | 'width' | 'height'>
  /** Names the photo, e.g. the category it belongs to. */
  label: string
  /** Sizes the thumbnail, e.g. `w-16`. */
  className?: string
}

const WHOLE_PHOTO = { x: 0, y: 0, width: 1, height: 1 }
/** A short pause before the preview shows, so sweeping the mouse past doesn't flash it. */
const HOVER_DELAY_MS = 100

/**
 * A photo thumbnail that shows the photo big: resting a mouse on it shows a preview
 * beside it, and clicking or tapping it opens the full photo in a modal `<dialog>`
 * (the only way on touch screens and from the keyboard).
 */
export function PhotoZoom({ photo, label, className = '' }: PhotoZoomProps) {
  const [preview, setPreview] = useState<CSSProperties | null>(null)
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  function hidePreview() {
    clearTimeout(timer.current)
    setPreview(null)
  }

  useEffect(() => () => clearTimeout(timer.current), [])

  // The preview is placed once, so it goes away rather than drift when the page scrolls.
  useEffect(() => {
    if (!preview) return
    window.addEventListener('scroll', hidePreview, { capture: true, passive: true })
    return () => window.removeEventListener('scroll', hidePreview, { capture: true })
  }, [preview])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <>
      <button
        type="button"
        aria-label={`Enlarge photo of ${label}`}
        aria-haspopup="dialog"
        className={`block shrink-0 cursor-zoom-in overflow-hidden rounded-control ${className}`}
        onPointerEnter={(e) => {
          // Touch and pen taps also fire pointerenter; only a mouse hovers.
          if (e.pointerType !== 'mouse') return
          const thumb = e.currentTarget.getBoundingClientRect()
          clearTimeout(timer.current)
          timer.current = setTimeout(() => {
            setPreview(
              previewPlacement(thumb, photo, {
                width: document.documentElement.clientWidth,
                height: window.innerHeight,
              }),
            )
          }, HOVER_DELAY_MS)
        }}
        onPointerLeave={hidePreview}
        onClick={() => {
          hidePreview()
          setOpen(true)
        }}
      >
        <CookieImage photo={photo} box={WHOLE_PHOTO} alt="" />
      </button>

      {preview &&
        // In <body>, because a sortable row's transform would otherwise become the
        // containing block of this fixed-position preview.
        createPortal(
          <div
            data-testid="photo-preview"
            aria-hidden="true"
            className="pointer-events-none fixed z-50 overflow-hidden rounded-card border border-border bg-surface p-1 shadow-raised"
            style={preview}
          >
            <img
              src={photo.url}
              alt=""
              draggable={false}
              className="size-full rounded-control object-cover"
            />
          </div>,
          document.body,
        )}

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        // A tap on the backdrop (the dialog element itself, outside its content) closes it.
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        className="m-auto w-[min(64rem,calc(100vw-2rem))] rounded-card bg-surface p-0 text-ink shadow-raised backdrop:bg-ink/60"
      >
        {open && (
          <div className="space-y-3 p-4">
            <h2 id={titleId} className="text-2xl">
              {label}
            </h2>
            <div className="grid place-items-center overflow-hidden rounded-control bg-surface-muted">
              <img
                src={photo.url}
                alt={`Plate photo of ${label}`}
                className="max-h-[75dvh] w-auto max-w-full object-contain"
              />
            </div>
            <div className="flex">
              <Button variant="ghost" onClick={() => setOpen(false)} className="ml-auto">
                Close
              </Button>
            </div>
          </div>
        )}
      </dialog>
    </>
  )
}
