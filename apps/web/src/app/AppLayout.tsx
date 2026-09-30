import { Link, Outlet } from 'react-router'

export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-primary px-4 py-3 text-on-primary shadow-md">
        <Link to="/" className="font-display text-xl font-semibold">
          🍪 Cookie Voting
        </Link>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
