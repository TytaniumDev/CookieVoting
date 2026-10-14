import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { trees, treesPhoto } from '../CategoryBallot/fixtures.ts'
import { CookieThumb } from './CookieThumb.tsx'

const meta = {
  component: CookieThumb,
  parameters: { layout: 'padded' },
  args: { photo: treesPhoto, cookie: trees[0]!, alt: 'Cookie 1', className: 'w-20' },
} satisfies Meta<typeof CookieThumb>

export default meta
type Story = StoryObj<typeof meta>

export const Plain: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'Cookie 1' })).toBeVisible()
  },
}

export const WithMedal: Story = {
  args: { rank: 1 },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: '1st place' })).toBeVisible()
  },
}

export const Small: Story = { args: { rank: 3, badgeSize: 'sm', className: 'w-14' } }

/** Round, for the festive results. */
export const Round: Story = { args: { round: true, className: 'w-24' } }
