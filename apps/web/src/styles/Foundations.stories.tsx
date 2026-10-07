import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Alert } from '../components/Alert/Alert.tsx'
import { Badge } from '../components/Badge/Badge.tsx'
import { Button } from '../components/Button/Button.tsx'
import { Card } from '../components/Card/Card.tsx'
import { ProgressBar } from '../components/ProgressBar/ProgressBar.tsx'
import { RankBadge } from '../components/RankBadge/RankBadge.tsx'
import { Snowfall } from '../components/Snowfall/Snowfall.tsx'
import themeCss from './theme.css?raw'

const colorTokens = [...themeCss.matchAll(/--color-([\w-]+):\s*(#[0-9a-f]{6});/gi)].map(
  ([, name, hex]) => ({ name: name as string, hex: hex as string }),
)

const groups: { title: string; match: (name: string) => boolean }[] = [
  { title: 'Brand', match: (n) => /^(on-)?(primary|secondary|accent)/.test(n) },
  { title: 'Neutrals', match: (n) => /^(background|surface|border|ink|focus|snow)/.test(n) },
  { title: 'Status', match: (n) => /^(on-)?(danger|success|warning)/.test(n) },
  { title: 'Rank medals', match: (n) => /^(on-)?rank/.test(n) },
]

function Swatch({ name, hex }: { name: string; hex: string }) {
  return (
    <figure className="overflow-hidden rounded-control border border-border bg-surface">
      {/* Swatches render each token by name, so they always match theme.css. */}
      <div className="h-16" style={{ background: `var(--color-${name})` }} />
      <figcaption className="px-2 py-1.5 font-mono text-sm">
        <span className="block font-bold">{name}</span>
        <span className="text-ink-muted">{hex}</span>
      </figcaption>
    </figure>
  )
}

const meta = {
  title: 'Foundations',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** Every colour token in `theme.css`, grouped. Components use these names, never hex values. */
export const Colors: Story = {
  render: () => (
    <div className="max-w-4xl space-y-8">
      {groups.map((group) => (
        <section key={group.title} className="space-y-3">
          <h2 className="text-2xl">{group.title}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {colorTokens
              .filter((token) => group.match(token.name))
              .map((token) => (
                <Swatch key={token.name} {...token} />
              ))}
          </div>
        </section>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('primary')).toBeVisible()
  },
}

/** Fredoka for headings and buttons; Nunito for everything people read. */
export const Typography: Story = {
  render: () => (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-bold text-ink-muted">Display · Fredoka</p>
        <h1 className="text-5xl">Holiday Bake-Off</h1>
        <h2 className="text-3xl">Best Gingerbread</h2>
        <h3 className="text-xl">Cookie #4</h3>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-bold text-ink-muted">Body · Nunito</p>
        <p className="text-lg">
          Tap your three favourite cookies in order. Tap a cookie again to change your mind.
        </p>
        <p>
          Votes are anonymous. Results appear as soon as the organiser opens them, and update live
          while people are still voting.
        </p>
        <p className="text-sm text-ink-muted">Small print: one ballot per phone.</p>
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const heading = canvas.getByRole('heading', { level: 1 })
    await expect(getComputedStyle(heading).fontFamily).toContain('Fredoka')
  },
}

/** The pieces together, at phone width, as a voter would see them. */
export const Showcase: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div className="mx-auto min-h-dvh max-w-[375px] bg-background">
      <header className="relative overflow-hidden bg-primary px-4 pt-6 pb-8 text-on-primary">
        <Snowfall count={18} />
        <div className="relative space-y-1">
          <Badge tone="accent">Voting open</Badge>
          <h1 className="text-3xl">Holiday Bake-Off 🎄</h1>
          <p>Pick your top 3 in each category.</p>
        </div>
      </header>
      <main className="-mt-4 space-y-4 px-4 pb-6">
        <Card tone="festive" className="relative">
          <div className="space-y-4">
            <ProgressBar label="Best Gingerbread" value={2} max={5} valueText="2 of 5" />
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="relative grid aspect-square place-items-center rounded-control bg-surface-muted text-3xl"
                >
                  <span aria-hidden="true">🍪</span>
                  <span className="sr-only">Cookie {n}</span>
                  {n <= 3 && (
                    <RankBadge
                      rank={([2, 1, 3] as const)[n - 1] ?? 1}
                      className="absolute -top-2 -right-2"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Alert tone="success" title="Nice picks!">
          You can change them until you submit.
        </Alert>
        <div className="flex gap-3">
          <Button variant="ghost">Back</Button>
          <Button fullWidth size="lg">
            Next category
          </Button>
        </div>
      </main>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Next category' })).toBeEnabled()
  },
}
