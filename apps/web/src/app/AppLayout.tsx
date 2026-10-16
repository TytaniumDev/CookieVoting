import { useCallback, useState } from 'react'
import { Link, Outlet, useMatch } from 'react-router'
import { FeedbackButton } from '../components/FeedbackButton/FeedbackButton.tsx'
import { Snowfall } from '../components/Snowfall/Snowfall.tsx'
import { monitoringEnabled } from '../lib/monitoring.ts'
import { AppBarSlotProvider } from './AppBarSlot.tsx'
import { ErrorProvider } from './ErrorProvider.tsx'

/** One centred column with side padding, wide enough for the admin step tabs on one row. */
const PAGE_WIDTH = 'mx-auto w-full max-w-5xl px-(--gutter)'

/**
 * Publishes the pinned app bar's height as --app-bar-height, so things pinned below it
 * (ErrorBanner) and scrolling to a focused field (scroll-padding-top) clear it.
 */
function useAppBarHeight() {
  return useCallback((header: HTMLElement | null) => {
    if (!header) return
    const root = document.documentElement
    const observer = new ResizeObserver(() =>
      root.style.setProperty('--app-bar-height', `${header.offsetHeight}px`),
    )
    observer.observe(header)
    return () => {
      observer.disconnect()
      root.style.removeProperty('--app-bar-height')
    }
  }, [])
}

export function AppLayout() {
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  const appBarRef = useAppBarHeight()
  // Voters only ever have their event, so the title takes them back to it, not to admin sign-in.
  const eventId = useMatch('/event/:eventId/*')?.params.eventId
  const home = eventId ? `/event/${encodeURIComponent(eventId)}` : '/'
  return (
    // A page that marks itself `data-festive` (the ballot) gets a cranberry backdrop with snow.
    <div className="group/page relative flex min-h-dvh flex-col has-[[data-festive]]:bg-primary">
      <Snowfall count={30} className="hidden group-has-[[data-festive]]/page:block" />
      {/*
        Pinned to the top, like an app's title bar; it also keeps Safari 26's top bar
        cranberry on cream pages. In a home-screen app it sits under the status bar
        (viewport-fit=cover), so it pads itself clear. Named so page transitions leave it be.
        A page that marks itself `data-no-app-bar` (the results) has no bar on phones: it
        shows its own compact row instead, and the page pads itself clear of the status bar.
      */}
      <header
        ref={appBarRef}
        className="sticky top-0 z-40 overflow-hidden bg-primary [view-transition-name:app-bar] pt-[calc(--spacing(3)+env(safe-area-inset-top))] pb-3 text-on-primary shadow-card max-sm:group-has-[[data-no-app-bar]]/page:hidden"
      >
        <Snowfall count={12} />
        {/* Items share a text baseline, so a page's title sits level with "Cookie Voting". */}
        <div className={`group relative flex items-baseline gap-2 ${PAGE_WIDTH}`}>
          <Link
            to={home}
            viewTransition
            className="-my-2 shrink-0 py-2 font-display text-xl font-semibold"
          >
            <span aria-hidden="true">🍪 </span>
            {/* On phones a page's own title (data-title) needs the room; the cookie still goes home. */}
            <span className="max-sm:group-has-[[data-title]]:sr-only">Cookie Voting</span>
          </Link>
          <div ref={setSlot} className="flex min-w-0 items-baseline gap-2" />
          {/* Off in dev and tests, where nothing reaches Sentry. */}
          {monitoringEnabled && (
            <div className="ml-auto">
              <FeedbackButton />
            </div>
          )}
        </div>
      </header>
      <main
        // Festive pages run to the bottom of the screen and keep their own space there, so
        // what scrolls inside them isn't cut off short of the edge.
        className={`relative flex-1 pt-6 max-sm:group-has-[[data-no-app-bar]]/page:pt-[calc(--spacing(3)+env(safe-area-inset-top))] pb-[calc(--spacing(6)+env(safe-area-inset-bottom))] group-has-[[data-festive]]/page:pb-0 ${PAGE_WIDTH}`}
      >
        <AppBarSlotProvider value={slot}>
          <ErrorProvider>
            <Outlet />
          </ErrorProvider>
        </AppBarSlotProvider>
      </main>
    </div>
  )
}
