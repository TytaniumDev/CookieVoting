import { Link, Outlet } from 'react-router'
import { Snowfall } from '../components/Snowfall/Snowfall.tsx'
import { ErrorProvider } from './ErrorProvider.tsx'

/** One centred column with side padding, wide enough for the admin step tabs on one row. */
const PAGE_WIDTH = 'mx-auto w-full max-w-5xl px-(--gutter)'

export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="relative overflow-hidden bg-primary py-3 text-on-primary shadow-card">
        <Snowfall count={12} />
        <div className={`relative ${PAGE_WIDTH}`}>
          <Link to="/" className="font-display text-xl font-semibold">
            🍪 Cookie Voting
          </Link>
        </div>
      </header>
      <main className={`flex-1 py-6 ${PAGE_WIDTH}`}>
        <ErrorProvider>
          <Outlet />
        </ErrorProvider>
      </main>
    </div>
  )
}
