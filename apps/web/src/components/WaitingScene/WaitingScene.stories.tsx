import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent } from 'storybook/test'
import { WaitingScene } from './WaitingScene.tsx'

const meta = {
  component: WaitingScene,
  parameters: { layout: 'padded' },
  args: { scene: 'snowman', className: 'h-72' },
  decorators: [
    (Story, { parameters }) => (
      <div
        className="overflow-hidden rounded-card"
        style={{ maxWidth: (parameters.width as string | undefined) ?? '375px' }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WaitingScene>

export default meta
type Story = StoryObj<typeof meta>

export const Snowman: Story = {
  play: async ({ canvas }) => {
    const snowman = canvas.getByRole('button', { name: 'A snowman dancing in the snow' })
    // A surprise: nothing is said until it's poked. (The bubble fades in, so it's
    // checked for being there rather than visible.)
    await expect(canvas.queryByText('Ho ho ho!')).toBeNull()
    await userEvent.click(snowman)
    await expect(canvas.getByText('Ho ho ho!')).toBeInTheDocument()
    await userEvent.click(snowman)
    await expect(canvas.getByText('Still counting!')).toBeInTheDocument()
  },
}

export const SnowGlobe: Story = {
  args: { scene: 'globe' },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /snow globe/ }))
    await expect(canvas.getByText('Whoosh!')).toBeInTheDocument()
  },
}

export const Oven: Story = {
  args: { scene: 'oven' },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /oven/ }))
    await expect(canvas.getByText('No peeking!')).toBeInTheDocument()
  },
}

/** Laptop size: the drawing keeps its shape and centres in the wider scene. */
export const Wide: Story = {
  args: { scene: 'snowman', className: 'h-90' },
  parameters: { width: '48rem' },
}
