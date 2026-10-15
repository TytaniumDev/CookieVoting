import { Outlet } from 'react-router'

/** Voter pages: one readable column, centred on wide screens; the app bar narrows to match. */
export function ReadableLayout() {
  return (
    <div data-readable className="mx-auto max-w-readable">
      <Outlet />
    </div>
  )
}
