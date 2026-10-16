/**
 * MOCKUP (COOKIE-VOTING-5): how the results pop-ups close on a phone, picked for trying
 * out with `?popup=swipe` (centred card, drag down to close) or `?popup=sheet` (a bottom
 * sheet with a grab handle, drag down to close). Remembered for the tab so moving between
 * pages keeps it. Anything else keeps today's centred card with no drag.
 */
export type PopupStyle = 'card' | 'swipe' | 'sheet'

const KEY = 'popupStyle'

export function popupStyle(): PopupStyle {
  const asked = new URLSearchParams(window.location.search).get('popup')
  try {
    if (asked) sessionStorage.setItem(KEY, asked)
    const style = asked ?? sessionStorage.getItem(KEY)
    return style === 'swipe' || style === 'sheet' ? style : 'card'
  } catch {
    return asked === 'swipe' || asked === 'sheet' ? asked : 'card'
  }
}

/** Classes for a results pop-up's `<dialog>` in the given style. */
export function popupClasses(style: PopupStyle): string {
  const base = 'bg-background p-0 text-ink shadow-raised backdrop:bg-ink/55'
  return style === 'sheet'
    ? `${base} mx-auto mt-auto mb-0 max-h-[92dvh] w-full max-w-md rounded-t-[1.5rem] pb-[env(safe-area-inset-bottom)] open:motion-safe:animate-sheet-up`
    : `${base} m-auto w-[calc(100%-2rem)] max-w-md rounded-[1.5rem]`
}
