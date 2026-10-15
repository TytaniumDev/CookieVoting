import { Outlet } from 'react-router'

/** Voter pages: one readable column, centred on wide screens. */
export function ReadableLayout() {
  return (
    <div className="mx-auto max-w-readable">
      <Outlet />
    </div>
  )
}
