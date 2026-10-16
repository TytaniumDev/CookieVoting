import { useEffect, useRef, type ReactNode } from 'react'
import { useSwipeToClose } from '../../lib/useSwipeToClose.ts'

export interface BottomSheetProps {
  open: boolean
  onClose: () => void
  /** The id of the sheet's title, for its accessible name. */
  labelledBy: string
  /** Stays put at the top while `children` scroll, e.g. a title and a summary. */
  header: ReactNode
  /** Scrolls on its own when the sheet is taller than the screen. */
  children?: ReactNode
}

/**
 * A pop-up that slides up from the bottom on phones and drags down to close (owner
 * decision 2026-10-16, Sentry feedback COOKIE-VOTING-5); a centred card on wider
 * screens. Built on the native `<dialog>`, so focus trapping, Escape and the backdrop
 * come from the browser, and the ✕, a tap on the backdrop and Back close it too.
 * Only `children` scroll; the header and the ✕ stay in view.
 */
export function BottomSheet({ open, onClose, labelledBy, header, children }: BottomSheetProps) {
  const ref = useRef<HTMLDialogElement>(null)
  useSwipeToClose(ref, onClose)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      // A click on the backdrop lands on the dialog itself.
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="mx-auto mt-auto mb-0 max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-[1.5rem] bg-background p-0 text-ink shadow-raised backdrop:bg-ink/55 open:flex motion-safe:open:animate-sheet-up sm:m-auto sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100%-2rem)] sm:rounded-[1.5rem] sm:motion-safe:open:animate-none"
    >
      {open && (
        <>
          <div className="relative grid shrink-0 gap-3 p-5 pb-3">
            <span
              aria-hidden="true"
              className="absolute top-2 left-1/2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-border sm:hidden"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-2.5 right-2.5 grid size-11 place-items-center rounded-full bg-surface-muted text-lg font-extrabold"
            >
              <span aria-hidden="true">✕</span>
            </button>
            {header}
          </div>
          {children && (
            <div className="grid min-h-0 gap-3 overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-5">
              {children}
            </div>
          )}
        </>
      )}
    </dialog>
  )
}
