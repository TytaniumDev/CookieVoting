import type { HTMLAttributes } from 'react'

export type CardTone = 'plain' | 'festive'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** `festive` adds a candy-cane stripe along the top edge. */
  tone?: CardTone
  /** Remove the inner padding, e.g. for a photo that runs edge to edge. */
  flush?: boolean
}

const stripe =
  'before:absolute before:inset-x-0 before:top-0 before:h-2 before:bg-[repeating-linear-gradient(135deg,var(--color-primary)_0_10px,var(--color-surface)_10px_20px)]'

// Festive cards add the stripe's height (0.5rem) to the top padding.
function paddingClasses(tone: CardTone, flush: boolean): string {
  if (flush) return tone === 'festive' ? 'pt-2' : ''
  return tone === 'festive' ? 'px-4 pt-6 pb-4 sm:px-6 sm:pt-8 sm:pb-6' : 'p-4 sm:p-6'
}

/** A raised surface that groups related content. */
export function Card({ tone = 'plain', flush = false, className = '', ...props }: CardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-card border border-border bg-surface shadow-card ${tone === 'festive' ? stripe : ''} ${paddingClasses(tone, flush)} ${className}`}
      {...props}
    />
  )
}
