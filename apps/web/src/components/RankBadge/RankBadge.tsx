export type Rank = 1 | 2 | 3
export type RankBadgeSize = 'md' | 'lg'

export interface RankBadgeProps {
  rank: Rank
  size?: RankBadgeSize
  className?: string
}

const rankClasses: Record<Rank, string> = {
  1: 'bg-rank-1 text-on-rank-1',
  2: 'bg-rank-2 text-on-rank-2',
  3: 'bg-rank-3 text-on-rank-3',
}

const ordinal: Record<Rank, string> = { 1: '1st', 2: '2nd', 3: '3rd' }

const sizeClasses: Record<RankBadgeSize, string> = {
  md: 'size-8 text-base',
  lg: 'size-12 text-2xl',
}

/** Gold, silver or bronze medal showing a voter's 1st/2nd/3rd pick. */
export function RankBadge({ rank, size = 'md', className = '' }: RankBadgeProps) {
  return (
    <span
      aria-label={`${ordinal[rank]} place`}
      role="img"
      className={`inline-grid place-items-center rounded-full font-display font-bold shadow-raised ring-2 ring-surface ${rankClasses[rank]} ${sizeClasses[size]} ${className}`}
    >
      <span aria-hidden="true">{rank}</span>
    </span>
  )
}
