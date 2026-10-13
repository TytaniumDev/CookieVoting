import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { CookieImage } from './CookieImage.tsx'

const photo = { url: '/plates/4-cookies_stars.jpg', width: 2048, height: 1536 }

const meta = {
  component: CookieImage,
  args: { photo, box: { x: 0.05, y: 0.05, width: 0.45, height: 0.45 }, alt: 'Cookie #1' },
  decorators: [
    (Story) => (
      <div className="w-48">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CookieImage>

export default meta
type Story = StoryObj<typeof meta>

export const TopLeftQuarter: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'Cookie #1' })).toBeVisible()
  },
}

export const BottomRight: Story = {
  args: { box: { x: 0.5, y: 0.5, width: 0.5, height: 0.5 }, alt: 'Cookie #4' },
}

/** A tall, narrow box keeps its shape. */
export const TallBox: Story = {
  args: { box: { x: 0.4, y: 0.1, width: 0.15, height: 0.8 }, alt: 'Candy cane' },
}

/** The whole photo, e.g. a plate thumbnail. */
export const WholePlate: Story = {
  args: { box: { x: 0, y: 0, width: 1, height: 1 }, alt: 'Plate of stars' },
}
