import { useState } from 'react'
import { Link, Outlet, useMatch } from 'react-router'
import { FeedbackButton } from '../components/FeedbackButton/FeedbackButton.tsx'
import { Snowfall } from '../components/Snowfall/Snowfall.tsx'
import { monitoringEnabled } from '../lib/monitoring.ts'
import { AppBarSlotProvider } from './AppBarSlot.tsx'
import { ErrorProvider } from './ErrorProvider.tsx'

/** One centred column with side padding, wide enough for the admin step tabs on one row. */
const PAGE_WIDTH = 'mx-auto w-full max-w-5xl px-(--gutter)'

export function AppLayout() {
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  // Voters only ever have their event, so the title takes them back to it, not to admin sign-in.
  const eventId = useMatch('/event/:eventId/*')?.params.eventId
  const home = eventId ? `/event/${encodeURIComponent(eventId)}` : '/'
  return (
    // A page that marks itself `data-festive` (the ballot) gets a cranberry backdrop with snow.
    <div className="group/page relative flex min-h-dvh flex-col has-[[data-festive]]:bg-primary">
      <Snowfall count={30} className="hidden group-has-[[data-festive]]/page:block" />
      <header className="relative overflow-hidden bg-primary py-3 text-on-primary shadow-card">
        <Snowfall count={12} />
        {/* Items share a text baseline, so a page's title sits level with "Cookie Voting". */}
        <div className={`group relative flex items-baseline gap-2 ${PAGE_WIDTH}`}>
          <Link to={home} className="-my-2 shrink-0 py-2 font-display text-xl font-semibold">
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
      <main className={`relative flex-1 py-6 ${PAGE_WIDTH}`}>
        <AppBarSlotProvider value={slot}>
          <ErrorProvider>
            <Outlet />
          </ErrorProvider>
        </AppBarSlotProvider>
      </main>
    </div>
  )
}
