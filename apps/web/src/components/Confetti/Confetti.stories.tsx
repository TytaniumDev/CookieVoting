import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor } from 'storybook/test'
import { Confetti } from './Confetti.tsx'

const meta = {
  component: Confetti,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Confetti>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const confetti = canvasElement.ownerDocument.querySelector('[data-testid="confetti"]')
    await expect(confetti).toHaveAttribute('aria-hidden', 'true')
    await expect(confetti?.children).toHaveLength(60)
  },
}

export const Light: Story = {
  args: { count: 15 },
}

/** Once every piece has fallen, the full-screen layer leaves the page. */
export const ClearsAway: Story = {
  args: { count: 5 },
  play: async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument
    await expect(doc.querySelector('[data-testid="confetti"]')).not.toBeNull()
    await waitFor(() => expect(doc.querySelector('[data-testid="confetti"]')).toBeNull(), {
      timeout: 8000,
    })
  },
}
