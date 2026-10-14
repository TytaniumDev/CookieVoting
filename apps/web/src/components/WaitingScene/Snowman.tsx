import { Snowfall } from '../Snowfall/Snowfall.tsx'
import type { SceneArtProps } from './WaitingScene.tsx'

// Transforms in this drawing turn around points in the SVG's own coordinates.
const VIEW_BOX = '[transform-box:view-box]'

/**
 * Frosty, the snowman from the first version of the app, redrawn in the theme's colours.
 * He shuffles across a snowy hill at night, dancing and waving; each poke makes him jump
 * and spin.
 */
export function Snowman({ poked }: SceneArtProps) {
  return (
    <div className="relative size-full bg-linear-to-b from-secondary-hover to-secondary">
      <Snowfall count={28} />
      {/* The hill stretches to any width; the drawing over it keeps its shape. */}
      <svg
        viewBox="0 0 320 290"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute inset-0 size-full"
      >
        <path d="M0 290 L0 246 Q 80 214 160 230 T 320 240 L320 290z" className="fill-snow" />
      </svg>
      <svg
        viewBox="0 0 320 290"
        aria-hidden="true"
        className="absolute bottom-0 left-1/2 h-full max-w-full -translate-x-1/2"
      >
        <circle cx="270" cy="48" r="20" className="fill-accent-subtle" opacity="0.9" />
        <g className="fill-secondary-hover" opacity="0.9">
          <path d="M28 236 l22 -60 22 60z" />
          <path d="M36 200 l14 -40 14 40z" />
          <path d="M262 240 l24 -66 24 66z" />
          <path d="M270 204 l16 -44 16 44z" />
        </g>
        <g className={`${VIEW_BOX} origin-[160px_250px] motion-safe:animate-snowman-walk`}>
          <ellipse cx="160" cy="252" rx="46" ry="6" className="fill-ink" opacity="0.12" />
          <g
            // A new poke restarts the spin.
            key={poked}
            className={`${VIEW_BOX} origin-[160px_250px] ${poked > 0 ? 'motion-safe:animate-snowman-spin' : ''}`}
          >
            <g className={`${VIEW_BOX} origin-[160px_250px] motion-safe:animate-snowman-dance`}>
              <g
                className={`${VIEW_BOX} origin-[134px_158px] stroke-gingerbread-shade motion-safe:animate-wave-left`}
                strokeWidth="4"
                strokeLinecap="round"
              >
                <line x1="134" y1="158" x2="92" y2="132" />
                <line x1="104" y1="139" x2="98" y2="122" />
                <line x1="100" y1="136" x2="86" y2="138" />
              </g>
              <g
                className={`${VIEW_BOX} origin-[186px_158px] stroke-gingerbread-shade motion-safe:animate-wave-right`}
                strokeWidth="4"
                strokeLinecap="round"
              >
                <line x1="186" y1="158" x2="228" y2="132" />
                <line x1="216" y1="139" x2="222" y2="122" />
                <line x1="220" y1="136" x2="234" y2="138" />
              </g>
              <g className="fill-snow stroke-border" strokeWidth="2">
                <circle cx="160" cy="212" r="40" />
                <circle cx="160" cy="158" r="30" />
              </g>
              <g className="fill-accent">
                <circle cx="160" cy="150" r="3.6" />
                <circle cx="160" cy="164" r="3.6" />
                <circle cx="160" cy="178" r="3.6" />
              </g>
              <circle
                cx="160"
                cy="108"
                r="24"
                className="fill-snow stroke-border"
                strokeWidth="2"
              />
              <g className="fill-ink">
                <circle cx="151" cy="103" r="2.8" />
                <circle cx="169" cy="103" r="2.8" />
                <circle cx="150" cy="119" r="1.6" />
                <circle cx="155" cy="122" r="1.6" />
                <circle cx="161" cy="123" r="1.6" />
                <circle cx="167" cy="121" r="1.6" />
              </g>
              <path d="M160 108 L182 113 L160 115 Z" className="fill-carrot" />
              <g className="fill-primary-subtle">
                <circle cx="146" cy="113" r="4" />
                <circle cx="174" cy="113" r="4" />
              </g>
              {/* Scarf */}
              <g className="fill-primary">
                <rect x="134" y="126" width="52" height="11" rx="5.5" />
                <rect
                  x="166"
                  y="130"
                  width="11"
                  height="30"
                  rx="4"
                  transform="rotate(-10 171 130)"
                />
              </g>
              <g className="fill-snow" opacity="0.8" transform="rotate(-10 171 130)">
                <rect x="167" y="144" width="11" height="2.5" />
                <rect x="167" y="150" width="11" height="2.5" />
              </g>
              {/* Top hat with a sprig of holly */}
              <g className={`${VIEW_BOX} origin-[160px_88px] motion-safe:animate-hat-bob`}>
                <g className="fill-ink">
                  <rect x="133" y="84" width="54" height="7" rx="3.5" />
                  <rect x="143" y="52" width="34" height="34" rx="4" />
                </g>
                <rect x="143" y="74" width="34" height="7" className="fill-primary" />
                <path
                  d="M168 73 q-8 -6 -12 -1 q6 4 12 1z M174 73 q8 -6 12 -1 q-6 4 -12 1z"
                  className="fill-secondary"
                />
                <circle cx="171" cy="74" r="3.2" className="fill-primary" />
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>
  )
}
