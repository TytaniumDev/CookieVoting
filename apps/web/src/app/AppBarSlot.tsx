import { createContext, useContext, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const SlotContext = createContext<HTMLElement | null>(null)

/** Given by `AppLayout`: the place in the red app bar after the home link. */
export const AppBarSlotProvider = SlotContext.Provider

/**
 * Shows its children in the red app bar, after "Cookie Voting", while the page is
 * mounted. Pages put a title there with `AppBarTitle`.
 */
export function AppBarContent({ children }: { children: ReactNode }) {
  const slot = useContext(SlotContext)
  return slot ? createPortal(children, slot) : null
}

export interface AppBarTitleProps {
  children: string
  /**
   * The title is the page's `h1`: it stays on phones, where it takes the place of
   * "Cookie Voting". Otherwise it's a reminder of the event that phones leave out.
   */
  pageHeading?: boolean
}

/**
 * The event's name in the app bar after a "›", in one style on every page. The bar lines
 * its items up on their text baseline, so this sits level with "Cookie Voting".
 */
export function AppBarTitle({ children, pageHeading = false }: AppBarTitleProps) {
  const Tag = pageHeading ? 'h1' : 'span'
  const phones = pageHeading ? '' : 'max-sm:hidden'
  return (
    <AppBarContent>
      <span aria-hidden="true" className={`opacity-60 ${phones}`}>
        ›
      </span>
      <Tag
        data-title={pageHeading || undefined}
        title={children}
        className={`truncate font-sans text-lg font-bold ${phones}`}
      >
        {children}
      </Tag>
    </AppBarContent>
  )
}
