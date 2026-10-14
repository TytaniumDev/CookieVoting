import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { trees, treesPhoto } from '../CategoryBallot/fixtures.ts'
import { CookieStrip } from './CookieStrip.tsx'

const meta = {
  component: CookieStrip,
  parameters: { layout: 'fullscreen' },
  args: {
    photo: treesPhoto,
    cookies: trees,
    places: [null, null, null],
    current: 0,
    onSelect: fn(),
  },
  decorators: [
    (Story) => (
      <div className="bg-primary px-(--gutter) py-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CookieStrip>

export default meta
type Story = StoryObj<typeof meta>

export const FirstShown: Story = {
  play: async ({ args, canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Show cookie 1' })).toHaveAttribute(
      'aria-current',
      'true',
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Show cookie 4' }))
    await expect(args.onSelect).toHaveBeenCalledWith(3)
  },
}

export const WithMedals: Story = {
  args: { places: ['t3', null, 't1'], current: 2 },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: 'Show cookie 3, your 1st place' }),
    ).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: 'Show cookie 1, your 3rd place' }),
    ).toBeVisible()
  },
}

/** A big plate on a phone: the row scrolls sideways instead of wrapping. */
export const Crowded: Story = {
  args: {
    cookies: [...trees, ...trees.map((c) => ({ ...c, id: `${c.id}-again` }))],
    current: 10,
  },
  decorators: [
    (Story) => (
      <div className="w-[375px]">
        <Story />
      </div>
    ),
  ],
}
