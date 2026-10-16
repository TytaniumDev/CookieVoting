import { useState, type CSSProperties } from 'react'

export interface ConfettiProps {
  /** Number of pieces. */
  count?: number
}

const COLOURS = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-rank-2', 'bg-rank-3']

// Deterministic spread (golden-ratio sequence), like Snowfall, so stories are stable.
function fraction(i: number, seed: number): number {
  return (i * 0.618034 + seed) % 1
}

/**
 * A one-off shower of confetti over the whole screen, for the results reveal. It is
 * decorative (hidden from assistive tech, ignores pointer events), falls once and
 * leaves the screen, and isn't shown at all under `prefers-reduced-motion`.
 *
 * Once every piece has fallen it unmounts its layer: Safari 26 samples full-screen fixed
 * elements, even empty ones, to tint its toolbars, and would otherwise lose the page colour.
 */
export function Confetti({ count = 60 }: ConfettiProps) {
  const [fallen, setFallen] = useState(0)
  if (fallen >= count) return null
  return (
    <div
      aria-hidden="true"
      data-testid="confetti"
      onAnimationEnd={() => setFallen((n) => n + 1)}
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden motion-reduce:hidden"
    >
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={`absolute -top-4 h-3 w-2 animate-confetti rounded-[2px] ${COLOURS[i % COLOURS.length]}`}
          style={
            {
              left: `${fraction(i, 0.21) * 100}%`,
              '--drift': `${(fraction(i, 0.47) - 0.5) * 12}rem`,
              '--spin': `${1 + fraction(i, 0.83) * 3}turn`,
              animationDuration: `${2.5 + fraction(i, 0.11) * 2}s`,
              animationDelay: `${fraction(i, 0.67) * 0.8}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
