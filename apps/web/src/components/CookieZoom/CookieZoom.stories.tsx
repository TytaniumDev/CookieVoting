import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { CookieZoom } from './CookieZoom.tsx'

const cookie = {
  photo: { url: '/plates/4-cookies_stars.jpg', width: 2048, height: 1536 },
  box: { x: 0.22, y: 0.09, width: 0.287, height: 0.367 },
  number: 1,
}

const meta = {
  component: CookieZoom,
  args: { cookie, rank: null, nextRank: 1, onToggle: fn(), onClose: fn() },
} satisfies Meta<typeof CookieZoom>

export default meta
type Story = StoryObj<typeof meta>

const dialog = (el: HTMLElement) =>
  within(el.ownerDocument.body).getByRole('dialog', { name: 'Cookie #1' })

export const CanPick: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(
      within(dialog(canvasElement)).getByRole('button', { name: 'Pick as my 1st' }),
    )
    await expect(args.onToggle).toHaveBeenCalled()
  },
}

export const AlreadyPicked: Story = {
  args: { rank: 2, nextRank: 3 },
  play: async ({ canvasElement }) => {
    await expect(
      within(dialog(canvasElement)).getByRole('button', { name: 'Remove my 2nd pick' }),
    ).toBeVisible()
  },
}

export const AllPicksUsed: Story = {
  args: { nextRank: null },
  play: async ({ args, canvasElement }) => {
    const d = within(dialog(canvasElement))
    await expect(d.getByText(/used all your picks/i)).toBeVisible()
    await userEvent.click(d.getByRole('button', { name: 'Close' }))
    await expect(args.onClose).toHaveBeenCalled()
  },
}
