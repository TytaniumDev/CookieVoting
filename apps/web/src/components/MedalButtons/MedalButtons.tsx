import { ORDINALS } from '../RankBadge/ordinals.ts'
import { RankBadge, type Rank } from '../RankBadge/RankBadge.tsx'

export interface MedalButtonsProps {
  /** The position (1…n) of the cookie on screen, for screen readers and to match `holders`. */
  current: number
  /** For each medal (1st, 2nd, 3rd), the number of the cookie that has it, or null. */
  holders: readonly (number | null)[]
  onAward: (place: Rank) => void
  className?: string
}

const onClasses: Record<Rank, string> = {
  1: 'bg-rank-1 text-on-rank-1',
  2: 'bg-rank-2 text-on-rank-2',
  3: 'bg-rank-3 text-on-rank-3',
}

/**
 * One button per medal for the cookie on screen. Each says where its medal is: not
 * given yet, on another cookie (tapping moves it here), or on this one (tapping takes
 * it back). Phones stack the medal, its name and the words; wider screens put the medal
 * beside its name, with the words on their own full-width row underneath.
 */
export function MedalButtons({ current, holders, onAward, className = '' }: MedalButtonsProps) {
  return (
    <div
      role="group"
      aria-label={`Give cookie ${current} a medal`}
      className={`grid gap-2 ${holders.length === 3 ? 'grid-cols-3' : holders.length === 2 ? 'grid-cols-2' : 'grid-cols-1'} ${className}`}
    >
      {holders.map((holder, i) => {
        const place = (i + 1) as Rank
        const on = holder === current
        return (
          <button
            key={place}
            type="button"
            aria-pressed={on}
            onClick={() => onAward(place)}
            className={`grid min-h-19 content-center items-center justify-items-center gap-1 rounded-card px-1 py-2 leading-tight shadow-card transition-[transform,background-color] active:scale-95 sm:min-h-16 sm:grid-cols-[auto_auto] sm:justify-center sm:gap-x-2 sm:px-2 ${
              on ? onClasses[place] : 'bg-surface text-ink hover:bg-accent-subtle'
            }`}
          >
            <span aria-hidden="true" className="grid">
              <RankBadge rank={place} />
            </span>
            <span className="font-display text-base font-semibold whitespace-nowrap">
              {ORDINALS[place]} place
            </span>
            <span
              className={`text-center text-xs font-bold sm:col-span-2 ${on ? '' : 'text-ink-muted'}`}
            >
              {on ? 'Tap to take back' : holder === null ? 'Not given yet' : 'On another cookie'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
