import { Link, Outlet } from 'react-router'
import { Snowfall } from '../components/Snowfall/Snowfall.tsx'

export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="relative overflow-hidden bg-primary px-4 py-3 text-on-primary shadow-card">
        <Snowfall count={12} />
        <Link to="/" className="relative font-display text-xl font-semibold">
          🍪 Cookie Voting
        </Link>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
