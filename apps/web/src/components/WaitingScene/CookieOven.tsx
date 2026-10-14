import type { SceneArtProps } from './WaitingScene.tsx'

const VIEW_BOX = '[transform-box:view-box]'

function Cookie({ x, chips, delay }: { x: number; chips: [number, number][]; delay: string }) {
  return (
    <g
      className="origin-bottom [transform-box:fill-box] motion-safe:animate-cookie-rise"
      style={{ animationDelay: delay }}
    >
      <circle cx={x} cy="186" r="13" className="fill-dough stroke-gingerbread" strokeWidth="2.5" />
      <g className="fill-ink">
        {chips.map(([dx, dy]) => (
          <circle key={`${dx},${dy}`} cx={x + dx} cy={186 + dy} r="2.1" />
        ))}
      </g>
    </g>
  )
}

/**
 * A retro oven with the results baking: cookies rise behind a glowing window, steam
 * curls up and the timer ticks round (it's decoration, not a countdown). Each poke
 * makes it wobble.
 */
export function CookieOven({ poked }: SceneArtProps) {
  return (
    <div className="relative size-full bg-[radial-gradient(120%_90%_at_50%_0%,var(--color-accent-subtle)_0%,var(--color-surface-muted)_70%)]">
      <svg
        viewBox="0 0 320 300"
        aria-hidden="true"
        className="absolute bottom-0 left-1/2 h-full max-w-full -translate-x-1/2"
      >
        <g
          fill="none"
          className="stroke-ink-muted"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.5"
        >
          {[124, 160, 196].map((x, i) => (
            <path
              key={x}
              d={`M${x} ${i === 1 ? 48 : 52} q-8 -10 0 -20 q8 -10 0 -20`}
              className="opacity-0 motion-safe:animate-steam motion-reduce:opacity-60"
              style={{ animationDelay: `${-1.1 * i}s` }}
            />
          ))}
        </g>
        <ellipse cx="160" cy="292" rx="100" ry="7" className="fill-ink" opacity="0.12" />
        <g
          key={poked}
          className={`${VIEW_BOX} origin-[160px_300px] ${poked > 0 ? 'motion-safe:animate-oven-knock' : ''}`}
        >
          <g className="fill-ink">
            <rect x="70" y="276" width="18" height="14" rx="3" />
            <rect x="232" y="276" width="18" height="14" rx="3" />
          </g>
          <rect x="62" y="56" width="196" height="224" rx="22" className="fill-primary" />
          <g className="fill-primary-hover">
            <rect x="62" y="56" width="196" height="54" rx="22" />
            <rect x="62" y="90" width="196" height="20" />
          </g>
          {/* Knobs and the timer */}
          <g className="fill-background">
            <circle cx="98" cy="82" r="11" />
            <circle cx="222" cy="82" r="11" />
          </g>
          <g className="fill-ink">
            <rect x="96.5" y="73" width="3" height="9" rx="1.5" transform="rotate(30 98 82)" />
            <rect x="220.5" y="73" width="3" height="9" rx="1.5" transform="rotate(-40 222 82)" />
          </g>
          <circle cx="160" cy="82" r="17" className="fill-accent" />
          <circle cx="160" cy="82" r="12" className="fill-accent-subtle" />
          <rect
            x="158.6"
            y="72"
            width="2.8"
            height="11"
            rx="1.4"
            className={`${VIEW_BOX} origin-[160px_82px] fill-ink motion-safe:animate-dial`}
          />
          {/* Door with a glowing window */}
          <rect x="78" y="122" width="164" height="140" rx="16" className="fill-primary-hover" />
          <rect x="92" y="134" width="136" height="86" rx="10" className="fill-ink" />
          <rect
            x="92"
            y="134"
            width="136"
            height="86"
            rx="10"
            className="fill-accent opacity-80 motion-safe:animate-oven-glow"
          />
          <rect
            x="100"
            y="198"
            width="120"
            height="5"
            rx="2.5"
            className="fill-gingerbread-shade"
          />
          <Cookie
            x={124}
            delay="0s"
            chips={[
              [-4, -4],
              [4, 2],
            ]}
          />
          <Cookie
            x={160}
            delay="-1s"
            chips={[
              [-5, -2],
              [4, -5],
              [2, 4],
            ]}
          />
          <Cookie
            x={196}
            delay="-2s"
            chips={[
              [-4, 3],
              [4, -4],
            ]}
          />
          <rect x="110" y="234" width="100" height="10" rx="5" className="fill-background" />
        </g>
      </svg>
    </div>
  )
}
