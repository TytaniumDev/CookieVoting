import type { Box, PlatePhoto } from '@cookie-voting/shared'
import { useEffect, useId, useRef } from 'react'
import { Button } from '../Button/Button.tsx'
import { ORDINALS } from '../RankBadge/ordinals.ts'
import { CookieImage } from '../CookieImage/CookieImage.tsx'
import type { Rank } from '../RankBadge/RankBadge.tsx'

export interface CookieZoomProps {
  /** The cookie to show, or null when closed. */
  cookie: { photo: Pick<PlatePhoto, 'url' | 'width' | 'height'>; box: Box; number: number } | null
  rank: Rank | null
  /** The rank a pick would get now, or null when every pick is used. */
  nextRank: Rank | null
  onToggle: () => void
  onClose: () => void
}

/** A cookie up close, with its pick button, in a native modal `<dialog>`. */
export function CookieZoom({ cookie, rank, nextRank, onToggle, onClose }: CookieZoomProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (cookie && !dialog.open) dialog.showModal()
    if (!cookie && dialog.open) dialog.close()
  }, [cookie])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      // A tap on the backdrop (the dialog element itself, outside its content) closes it.
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-card bg-surface p-0 text-ink shadow-raised backdrop:bg-ink/60"
    >
      {cookie && (
        <div className="space-y-3 p-4">
          <h2 id={titleId} className="text-2xl">
            Cookie #{cookie.number}
          </h2>
          <div className="grid place-items-center overflow-hidden rounded-control bg-surface-muted">
            <CookieImage
              photo={cookie.photo}
              box={cookie.box}
              alt={`Cookie ${cookie.number}`}
              // As big as fits: the full width, or 60% of the screen height for tall cookies.
              style={{
                width: `min(100%, calc(60dvh * ${(cookie.box.width * cookie.photo.width) / (cookie.box.height * cookie.photo.height)}))`,
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {rank ? (
              <Button variant="secondary" onClick={onToggle}>
                Remove my {ORDINALS[rank]} pick
              </Button>
            ) : nextRank ? (
              <Button onClick={onToggle}>Pick as my {ORDINALS[nextRank]}</Button>
            ) : (
              <p className="text-ink-muted">You've used all your picks. Remove one to pick this.</p>
            )}
            <Button variant="ghost" onClick={onClose} className="ml-auto">
              Close
            </Button>
          </div>
        </div>
      )}
    </dialog>
  )
}
