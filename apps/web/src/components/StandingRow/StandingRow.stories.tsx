import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { StandingRow } from './StandingRow.tsx'

const meta = {
  component: StandingRow,
  args: { rank: 1, tied: false, title: 'Carmen', subtitle: 'Cookie #3', points: 24 },
  decorators: [
    (Story) => (
      <ol className="max-w-[375px] divide-y divide-border">
        <Story />
      </ol>
    ),
  ],
} satisfies Meta<typeof StandingRow>

export default meta
type Story = StoryObj<typeof meta>

export const First: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: '1st place' })).toBeVisible()
    await expect(canvas.getByText('24')).toBeVisible()
  },
}

export const TiedSecond: Story = {
  args: { rank: 2, tied: true, title: 'Dev', points: 17 },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Tied 2nd/)).toBeVisible()
  },
}

export const BelowThePodium: Story = {
  args: { rank: 5, title: 'Hiro', subtitle: undefined, points: 1 },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: '5th place' })).toBeVisible()
    await expect(canvas.getByText('point')).toBeInTheDocument()
  },
}

export const LongName: Story = {
  args: { title: 'Grandma Josephine Bartholomew-Applebaum', subtitle: 'Cookie #12' },
}
