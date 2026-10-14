import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { BakerLeaderboard } from './BakerLeaderboard.tsx'

const meta = {
  component: BakerLeaderboard,
  args: {
    bakers: [
      { bakerId: 'carmen', name: 'Carmen', points: 58, rank: 1 },
      { bakerId: 'ann', name: 'Ann', points: 41, rank: 2 },
      { bakerId: 'bob', name: 'Bob', points: 33, rank: 3 },
      { bakerId: 'dev', name: 'Dev', points: 33, rank: 3 },
      { bakerId: 'elif', name: 'Elif', points: 12, rank: 5 },
      { bakerId: 'hiro', name: 'Hiro', points: 0, rank: 6 },
    ],
  },
  decorators: [
    (Story) => (
      <div className="max-w-[375px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BakerLeaderboard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: 'Every baker' })).toBeVisible()
    await expect(canvas.getAllByRole('listitem')).toHaveLength(6)
    await expect(canvas.getAllByText(/Tied 3rd/)).toHaveLength(2)
  },
}

export const NoBakers: Story = {
  args: { bakers: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No bakers yet.')).toBeVisible()
  },
}
