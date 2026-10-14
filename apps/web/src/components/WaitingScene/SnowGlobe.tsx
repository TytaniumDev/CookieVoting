import { useEffect, useId, useRef } from 'react'
import type { SceneArtProps } from './WaitingScene.tsx'

const GLASS = { x: 160, y: 140, r: 94 }
const FLOOR = 214
const FLAKES = 42
const START = settledFlakes()
const SHAKE = 'motion-safe:animate-globe-shake'

interface Flake {
  r: number
  x: number
  y: number
  vx: number
  vy: number
}

// Deterministic spread (golden-ratio sequence), like Snowfall.
function fraction(i: number, seed: number): number {
  return (i * 0.618034 + seed) % 1
}

/** Snow resting on the ground inside the globe, where every visit starts. */
function settledFlakes(): Flake[] {
  return Array.from({ length: FLAKES }, (_, i) => ({
    r: 1.6 + fraction(i, 0.37) * 2.4,
    x: 80 + fraction(i, 0.13) * 160,
    y: FLOOR - 4 - fraction(i, 0.71) * 6,
    vx: 0,
    vy: 0,
  }))
}

/** Moves every flake one frame on; returns whether any are still falling. */
function stepFlakes(flakes: Flake[]): boolean {
  let falling = false
  for (const f of flakes) {
    f.vy += 0.018
    f.vx = f.vx * 0.985 + (Math.random() - 0.5) * 0.04
    f.vy *= 0.985
    f.x += f.vx
    f.y += f.vy
    // Bounce off the glass.
    const dx = f.x - GLASS.x
    const dy = f.y - GLASS.y
    const d = Math.hypot(dx, dy)
    if (d > GLASS.r - f.r) {
      const k = (GLASS.r - f.r) / d
      f.x = GLASS.x + dx * k
      f.y = GLASS.y + dy * k
      f.vx *= -0.4
      f.vy *= -0.4
    }
    // Settle on the snow, which dips towards the middle.
    const ground = FLOOR - f.r - Math.abs(f.x - GLASS.x) / 20
    if (f.y >= ground && f.vy >= 0) {
      f.y = ground
      f.vy = 0
      f.vx *= 0.6
    } else {
      falling = true
    }
  }
  return falling
}

/**
 * A snow globe with a gingerbread house inside. The snow settles slowly; each poke
 * shakes the globe and swirls it up again. Under reduced motion it rests on the ground.
 */
export function SnowGlobe({ poked }: SceneArtProps) {
  // useId's characters aren't all safe inside url(#…).
  const ids = useId().replace(/[^\w-]/g, '')
  const globe = useRef<SVGGElement>(null)
  const flakeGroup = useRef<SVGGElement>(null)
  const flakes = useRef(settledFlakes())

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Restart the shake (it also plays once when the page opens).
    const shake = globe.current
    if (shake && poked > 0) {
      shake.classList.remove(SHAKE)
      void shake.getBoundingClientRect()
      shake.classList.add(SHAKE)
    }
    // A gentle swirl when the page opens, a big one on every poke.
    const power = poked === 0 ? 0.7 : 1
    for (const f of flakes.current) {
      f.vx = (Math.random() - 0.5) * 6 * power
      f.vy = -(1.5 + Math.random() * 4.5) * power
    }
    let frame = 0
    const draw = () => {
      const falling = stepFlakes(flakes.current)
      flakeGroup.current?.childNodes.forEach((node, i) => {
        const f = flakes.current[i]
        if (!f) return
        const circle = node as SVGCircleElement
        circle.setAttribute('cx', f.x.toFixed(1))
        circle.setAttribute('cy', f.y.toFixed(1))
      })
      if (falling) frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [poked])

  const clip = `globe-${ids}-glass`
  const sky = `globe-${ids}-sky`
  return (
    <div className="relative size-full bg-[radial-gradient(120%_90%_at_50%_0%,var(--color-accent-subtle)_0%,var(--color-surface-muted)_70%)]">
      <svg
        viewBox="0 0 320 300"
        aria-hidden="true"
        className="absolute bottom-0 left-1/2 h-full max-w-full -translate-x-1/2"
      >
        <defs>
          <clipPath id={clip}>
            <circle cx={GLASS.x} cy={GLASS.y} r="98" />
          </clipPath>
          <radialGradient id={sky} cx="0.5" cy="0.3" r="0.8">
            <stop offset="0" className="[stop-color:var(--color-secondary-subtle)]" />
            <stop offset="1" className="[stop-color:var(--color-secondary)]" />
          </radialGradient>
        </defs>
        <ellipse cx="160" cy="290" rx="92" ry="7" className="fill-ink" opacity="0.12" />
        <g ref={globe} className={`origin-[160px_290px] [transform-box:view-box] ${SHAKE}`}>
          <g clipPath={`url(#${clip})`}>
            <rect x="60" y="40" width="200" height="200" fill={`url(#${sky})`} />
            <path d="M50 214 Q 110 192 160 202 T 270 206 L270 260 L50 260z" className="fill-snow" />
            <g className="fill-secondary-hover">
              <path d="M92 206 l14 -40 14 40z" />
              <path d="M204 204 l12 -34 12 34z" />
            </g>
            {/* Gingerbread house */}
            <rect x="130" y="160" width="60" height="44" rx="3" className="fill-gingerbread" />
            <path d="M122 164 L160 128 L198 164z" className="fill-primary" />
            <path
              d="M122 164 q6 6 12 0 q6 6 12 0 q6 6 12 0 q6 6 12 0 q6 6 12 0 q6 6 13 0"
              fill="none"
              className="stroke-snow"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <g className="fill-gingerbread-shade">
              <rect x="152" y="180" width="16" height="24" rx="8" />
            </g>
            <g className="fill-accent">
              <rect x="136" y="172" width="11" height="11" rx="2" />
              <rect x="173" y="172" width="11" height="11" rx="2" />
            </g>
            <g className="fill-primary">
              <circle cx="136" cy="200" r="2.5" />
              <circle cx="184" cy="200" r="2.5" />
            </g>
            <g ref={flakeGroup} className="fill-snow">
              {START.map((f, i) => (
                <circle key={i} cx={f.x} cy={f.y} r={f.r} opacity={0.6 + fraction(i, 0.53) * 0.4} />
              ))}
            </g>
          </g>
          {/* Glass and its shine */}
          <circle
            cx={GLASS.x}
            cy={GLASS.y}
            r="98"
            fill="none"
            className="stroke-snow"
            strokeOpacity="0.75"
            strokeWidth="3"
          />
          <path
            d="M96 96 A 78 78 0 0 1 150 58"
            fill="none"
            className="stroke-snow"
            strokeOpacity="0.7"
            strokeWidth="7"
            strokeLinecap="round"
          />
          {/* Base */}
          <path d="M84 230 L236 230 L252 284 L68 284 Z" className="fill-primary" />
          <rect x="74" y="244" width="172" height="12" className="fill-accent" />
          <g className="fill-accent-subtle">
            <circle cx="110" cy="268" r="3" />
            <circle cx="160" cy="268" r="3" />
            <circle cx="210" cy="268" r="3" />
          </g>
        </g>
      </svg>
    </div>
  )
}
