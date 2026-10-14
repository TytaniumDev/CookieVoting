import { Link, Outlet } from 'react-router'
import { Snowfall } from '../components/Snowfall/Snowfall.tsx'
import { ErrorProvider } from './ErrorProvider.tsx'

/** Pages use the screen's width, with side padding, up to a comfortable maximum. */
const PAGE_WIDTH = 'mx-auto w-full max-w-7xl px-(--gutter)'

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
