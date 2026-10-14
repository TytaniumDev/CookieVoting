import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { MedalButtons } from './MedalButtons.tsx'

const meta = {
  component: MedalButtons,
  parameters: { layout: 'padded' },
  args: { current: 3, holders: [null, null, null], onAward: fn() },
  decorators: [
    (Story) => (
      <div className="max-w-2xl rounded-card bg-primary p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MedalButtons>

export default meta
type Story = StoryObj<typeof meta>

export const NoneGiven: Story = {
  play: async ({ args, canvas }) => {
    await expect(canvas.getByRole('group', { name: 'Give cookie 3 a medal' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: /2nd place not given yet/i }))
    await expect(args.onAward).toHaveBeenCalledWith(2)
  },
}

/** 1st is on another cookie (tapping moves it here); 2nd is on this one. */
export const SomeGiven: Story = {
  args: { holders: [1, 3, null] },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: /1st place on another cookie/i }),
    ).toHaveAttribute('aria-pressed', 'false')
    await expect(
      canvas.getByRole('button', { name: /2nd place tap to take back/i }),
    ).toHaveAttribute('aria-pressed', 'true')
  },
}

/** Two cookies on the plate means two medals (`maxPicksFor`). */
export const SmallPlate: Story = { args: { holders: [null, 2], current: 2 } }
