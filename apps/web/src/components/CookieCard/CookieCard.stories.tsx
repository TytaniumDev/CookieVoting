import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { CookieCard } from './CookieCard.tsx'

const meta = {
  component: CookieCard,
  parameters: { layout: 'padded' },
  args: {
    photo: { url: '/plates/5-cookies_candy-canes.jpg', width: 2048, height: 1536 },
    box: { x: 0.41, y: 0.13, width: 0.2, height: 0.37 },
    number: 2,
    rank: null,
    onToggle: fn(),
    onZoom: fn(),
    className: 'w-40',
  },
} satisfies Meta<typeof CookieCard>

export default meta
type Story = StoryObj<typeof meta>

export const Unranked: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Cookie 2' }))
    await expect(args.onToggle).toHaveBeenCalled()
    await userEvent.click(canvas.getByRole('button', { name: 'See cookie 2 up close' }))
    await expect(args.onZoom).toHaveBeenCalled()
  },
}

export const First: Story = { args: { rank: 1 } }
export const Second: Story = { args: { rank: 2 } }
export const Third: Story = { args: { rank: 3 } }

/** A wide cookie fills the width of its square. */
export const Wide: Story = { args: { box: { x: 0.1, y: 0.4, width: 0.6, height: 0.2 } } }
