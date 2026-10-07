import type { CSSProperties } from 'react'

export interface SnowfallProps {
  /** Number of flakes. Keep it low; this is a background flourish. */
  count?: number
  className?: string
}

interface Flake {
  left: number
  top: number
  size: number
  opacity: number
  duration: number
  delay: number
}

// Deterministic "random" spread (golden-ratio sequence) so renders, stories and
// screenshots are stable.
function fraction(i: number, seed: number): number {
  return (i * 0.618034 + seed) % 1
}

function makeFlakes(count: number): Flake[] {
  return Array.from({ length: count }, (_, i) => ({
    left: fraction(i, 0.13) * 100,
    top: fraction(i, 0.71) * 100,
    size: 3 + fraction(i, 0.37) * 5,
    opacity: 0.35 + fraction(i, 0.53) * 0.5,
    duration: 9 + fraction(i, 0.29) * 9,
    delay: -fraction(i, 0.91) * 18,
  }))
}

/**
 * Gently falling snow, layered over a brand-coloured area. Place it inside a
 * `relative` parent. It is decorative (hidden from assistive tech, ignores
 * pointer events) and, under `prefers-reduced-motion`, the flakes hold still.
 */
export function Snowfall({ count = 24, className = '' }: SnowfallProps) {
  return (
    <div
      aria-hidden="true"
      data-testid="snowfall"
      className={`pointer-events-none absolute inset-0 overflow-hidden [container-type:size] ${className}`}
    >
      {makeFlakes(count).map((flake, i) => (
        <span
          key={i}
          className="absolute top-(--top) rounded-full bg-snow motion-safe:-top-2 motion-safe:animate-snowfall"
          style={
            {
              '--top': `${flake.top}%`,
              left: `${flake.left}%`,
              width: flake.size,
              height: flake.size,
              opacity: flake.opacity,
              animationDuration: `${flake.duration}s`,
              animationDelay: `${flake.delay}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
