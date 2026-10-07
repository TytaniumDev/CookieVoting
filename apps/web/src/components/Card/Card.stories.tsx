import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Button } from '../Button/Button.tsx'
import { Card } from './Card.tsx'

const meta = {
  component: Card,
  parameters: { layout: 'padded' },
  args: {
    children: (
      <div className="space-y-3">
        <h2 className="text-2xl">Gingerbread</h2>
        <p className="text-ink-muted">8 cookies are waiting for your vote in this category.</p>
        <Button>Start voting</Button>
      </div>
    ),
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Plain: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: 'Gingerbread' })).toBeVisible()
  },
}

export const Festive: Story = { args: { tone: 'festive' } }

export const Flush: Story = {
  args: {
    flush: true,
    children: (
      <>
        <div aria-hidden="true" className="grid h-32 place-items-center bg-surface-muted text-5xl">
          🍪
        </div>
        <p className="p-4 font-display text-lg font-semibold">Cookie #3</p>
      </>
    ),
  },
}
