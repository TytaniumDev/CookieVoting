/**
 * A festive page (ballot, results) fills the screen below the app bar, down to the bottom
 * edge, so what scrolls inside it runs to the edge instead of stopping short of it.
 * Never shorter than 34rem: a tiny or landscape screen scrolls the page instead.
 */
export const FESTIVE_SCREEN = 'h-[max(34rem,calc(100dvh-var(--app-bar-height,4rem)-1.5rem))]'

/** The space a festive page keeps clear at the bottom of the screen. */
export const FESTIVE_BOTTOM = 'pb-[calc(--spacing(6)+env(safe-area-inset-bottom))]'
