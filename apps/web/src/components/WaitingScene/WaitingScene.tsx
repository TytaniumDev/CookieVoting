import { useState, type ReactNode } from 'react'
import { CookieOven } from './CookieOven.tsx'
import { SnowGlobe } from './SnowGlobe.tsx'
import { Snowman } from './Snowman.tsx'

export const WAITING_SCENES = ['snowman', 'globe', 'oven'] as const
export type WaitingSceneName = (typeof WAITING_SCENES)[number]

export interface WaitingSceneProps {
  scene: WaitingSceneName
  className?: string
}

/** What each character says when it's poked, in turn. */
const LINES: Record<WaitingSceneName, readonly string[]> = {
  snowman: ['Ho ho ho!', 'Still counting!', 'Ooh, that one’s close!', 'Got any cookies?', 'Wheee!'],
  globe: ['Whoosh!', 'Let it snow!', 'So cozy in here', 'Again! Again!'],
  oven: ['No peeking!', 'Almost golden…', 'Smells good, right?', 'Not done yet!'],
}

const LABELS: Record<WaitingSceneName, string> = {
  snowman: 'A snowman dancing in the snow',
  globe: 'A snow globe with a gingerbread house inside',
  oven: 'An oven with cookies baking inside',
}

/** Props each scene's drawing gets: `poked` counts taps; each new one starts a reaction. */
export interface SceneArtProps {
  poked: number
}

const ART: Record<WaitingSceneName, (props: SceneArtProps) => ReactNode> = {
  snowman: Snowman,
  globe: SnowGlobe,
  oven: CookieOven,
}

/**
 * A festive, pokeable scene for voters waiting on the results: a dancing snowman, a snow
 * globe or an oven of cookies. Tapping anywhere makes the character react and say
 * something; that's left as a surprise, with no hint. Under `prefers-reduced-motion`
 * the scenes hold still.
 */
export function WaitingScene({ scene, className = '' }: WaitingSceneProps) {
  const [poked, setPoked] = useState(0)
  const lines = LINES[scene]
  const line = poked > 0 ? lines[(poked - 1) % lines.length] : null
  const Art = ART[scene]

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        aria-label={LABELS[scene]}
        onClick={() => setPoked(poked + 1)}
        className="block size-full touch-manipulation overflow-hidden"
      >
        <Art poked={poked} />
      </button>
      <p
        aria-live="polite"
        className="pointer-events-none absolute inset-x-0 top-3 flex justify-center"
      >
        {line && (
          <span
            key={poked}
            className="rounded-card bg-surface px-3.5 py-2 font-display text-base font-semibold text-ink shadow-raised motion-safe:animate-speech"
          >
            {line}
          </span>
        )}
      </p>
    </div>
  )
}
