import { useId } from 'react'
import { Confetti } from '../../components/Confetti/Confetti.tsx'
import { Ornaments, type OrnamentItem } from '../../components/Ornaments/Ornaments.tsx'
import { useReveal, type RevealMode } from '../../components/Ornaments/useReveal.ts'
import type { RevealState } from '../../components/Ornaments/reveal.ts'
import { ordinal } from '../../components/RankBadge/ordinals.ts'
import { FESTIVE_BOTTOM } from './festiveScreen.ts'

export interface RevealSlideProps {
  title: string
  /** Up to three, in place order. */
  items: readonly OrnamentItem[]
  mode: RevealMode
  /** When the reveal ends, is skipped, or there's nothing to reveal. */
  onDone: () => void
  /** Makes open ornaments buttons, e.g. to show a cookie's votes. */
  onSelect?: (id: string) => void
  /** What tapping an ornament does, e.g. "See its votes"; the caption says it too. */
  selectHint?: { label: string; caption: string }
  /** Instead of ornaments when there are no items. */
  empty: string
}

/** The line under the title: the drumroll's "In 3rd place…", then the winner. */
function caption(
  items: readonly OrnamentItem[],
  reveal: RevealState,
  mode: RevealMode,
  tapHint: string | null,
) {
  if (mode === 'done') return tapHint && items.length > 0 ? tapHint : ''
  const drumming = reveal.drum === null ? undefined : items[reveal.drum]
  if (drumming) {
    if (reveal.drum === 0) return 'And the winner is…'
    return drumming.tied
      ? `Tied for ${ordinal(drumming.rank)}…`
      : `In ${ordinal(drumming.rank)} place…`
  }
  if (reveal.opened === items.length && items.length > 0) {
    const winners = items.filter((item) => item.rank === 1).map((item) => item.name)
    return `🎉 ${winners.join(' and ')}! 🎉`
  }
  return ''
}

/**
 * One slide of the results: a title and its top three as ornaments, opened by the timed
 * reveal the first time the slide is on screen, with confetti for the winner.
 */
const VOTES_HINT = { label: 'See its votes', caption: 'Tap an ornament to see its votes' }

export function RevealSlide({
  title,
  items,
  mode,
  onDone,
  onSelect,
  selectHint = VOTES_HINT,
  empty,
}: RevealSlideProps) {
  const headingId = useId()
  const reveal = useReveal(items.length, mode, onDone)
  const line = caption(items, reveal, mode, onSelect ? selectHint.caption : null)
  const celebrating = mode === 'play' && items.length > 0 && reveal.opened === items.length
  return (
    <section
      aria-labelledby={headingId}
      className={`relative flex min-h-0 flex-1 flex-col ${FESTIVE_BOTTOM}`}
    >
      <h2 id={headingId} className="text-center text-3xl sm:text-4xl">
        {title}
      </h2>
      <p
        aria-live="polite"
        className="min-h-7 text-center font-display text-lg font-semibold text-accent-subtle"
      >
        {line}
      </p>
      {items.length === 0 ? (
        <p className="mt-8 text-center font-bold">{empty}</p>
      ) : (
        <Ornaments
          items={items}
          reveal={reveal}
          animate={mode === 'play'}
          onSelect={onSelect}
          selectHint={selectHint.label}
          className="min-h-0 flex-1"
        />
      )}
      {mode === 'play' && !celebrating && items.length > 0 && (
        <button
          type="button"
          onClick={onDone}
          className="absolute right-0 bottom-[calc(--spacing(6)+env(safe-area-inset-bottom))] min-h-11 rounded-full bg-ink/55 px-4 text-sm font-extrabold text-on-primary"
        >
          Skip
        </button>
      )}
      {celebrating && <Confetti />}
    </section>
  )
}
