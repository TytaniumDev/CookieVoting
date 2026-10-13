import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
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
