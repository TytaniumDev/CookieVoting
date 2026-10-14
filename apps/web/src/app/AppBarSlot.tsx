import { createContext, useContext, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const SlotContext = createContext<HTMLElement | null>(null)

/** Given by `AppLayout`: the place in the red app bar after the home link. */
export const AppBarSlotProvider = SlotContext.Provider

/**
 * Shows its children in the red app bar, after "Cookie Voting", while the page is
 * mounted: e.g. the event an admin is setting up.
 */
export function AppBarContent({ children }: { children: ReactNode }) {
  const slot = useContext(SlotContext)
  return slot ? createPortal(children, slot) : null
}
