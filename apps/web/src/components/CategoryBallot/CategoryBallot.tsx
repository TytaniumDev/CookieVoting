import {
  allPlacesGiven,
  awardPlace,
  type CategoryPlaces,
  type Cookie,
  type PlatePhoto,
} from '@cookie-voting/shared'
import { useState, type ReactNode } from 'react'
import { buzz } from '../../lib/haptics.ts'
import { Confetti } from '../Confetti/Confetti.tsx'
import { CookieCarousel } from '../CookieCarousel/CookieCarousel.tsx'
import { CookieStrip } from '../CookieStrip/CookieStrip.tsx'
import { MedalButtons } from '../MedalButtons/MedalButtons.tsx'

export interface CategoryBallotProps {
  photo: Pick<PlatePhoto, 'url' | 'width' | 'height'>
  /** In display order. Screen readers number them 1…n; no number is shown. */
  cookies: readonly Cookie[]
  /** The voter's medals so far (`emptyPlaces` to start). */
  places: CategoryPlaces
  onChange: (places: CategoryPlaces) => void
  /** Shown beside the medal buttons on wide screens and under them on phones, e.g. Next. */
  footer?: ReactNode
  className?: string
}

/**
 * One category's cookies to give medals to, one cookie at a time and as big as fits:
 * the plate's cookies in a row, the cookie on screen, then a button per medal. Meant for
 * a brand-coloured backdrop. Give it a height; the photo takes what the rest leaves.
 * Confetti falls when the last medal is given.
 */
export function CategoryBallot({
  photo,
  cookies,
  places,
  onChange,
  footer,
  className = '',
}: CategoryBallotProps) {
  const [current, setCurrent] = useState(0)
  const [celebrations, setCelebrations] = useState(0)
  // Admins can delete cookies while people vote.
  const shown = Math.min(current, cookies.length - 1)
  const cookie = cookies[shown]
  if (!cookie) return null
  const numberOf = (id: string | null) =>
    id === null ? null : cookies.findIndex((c) => c.id === id) + 1 || null

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <CookieStrip
        photo={photo}
        cookies={cookies}
        places={places}
        current={shown}
        onSelect={setCurrent}
      />
      <CookieCarousel
        photo={photo}
        cookies={cookies}
        places={places}
        current={shown}
        onCurrentChange={setCurrent}
        className="min-h-0 flex-1"
      />
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_18rem]">
        <MedalButtons
          current={shown + 1}
          holders={places.map(numberOf)}
          onAward={(place) => {
            const next = awardPlace(places, cookie.id, place)
            buzz()
            if (!allPlacesGiven(places) && allPlacesGiven(next)) setCelebrations((n) => n + 1)
            onChange(next)
          }}
        />
        {footer}
      </div>
      {celebrations > 0 && <Confetti key={celebrations} count={40} />}
    </div>
  )
}
