import type { Rank } from './RankBadge.tsx'

export const ORDINALS: Record<Rank, string> = { 1: '1st', 2: '2nd', 3: '3rd' }

/** 1 → "1st", 12 → "12th", 22 → "22nd". */
export function ordinal(n: number): string {
  const lastTwo = n % 100
  if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`
  const suffix = { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th'
  return `${n}${suffix}`
}
