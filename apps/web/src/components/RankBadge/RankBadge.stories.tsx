import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { RankBadge } from './RankBadge.tsx'

const meta = {
  component: RankBadge,
  args: { rank: 1 },
} satisfies Meta<typeof RankBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Gold: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: '1st place' })).toBeVisible()
  },
}

export const Silver: Story = { args: { rank: 2 } }

export const Bronze: Story = { args: { rank: 3 } }

export const Large: Story = { args: { size: 'lg' } }

export const Podium: Story = {
  render: () => (
    <div className="flex items-end gap-3">
      <RankBadge rank={2} size="lg" />
      <RankBadge rank={1} size="lg" className="-translate-y-3" />
      <RankBadge rank={3} size="lg" />
    </div>
  ),
}
