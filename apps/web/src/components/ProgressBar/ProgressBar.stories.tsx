import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { ProgressBar } from './ProgressBar.tsx'

const meta = {
  component: ProgressBar,
  args: { label: 'Your votes', value: 2, max: 5, valueText: 'Category 2 of 5' },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProgressBar>

export default meta
type Story = StoryObj<typeof meta>

export const InProgress: Story = {
  play: async ({ canvas }) => {
    const bar = canvas.getByRole('progressbar', { name: 'Your votes' })
    await expect(bar).toHaveAttribute('aria-valuenow', '2')
    await expect(bar).toHaveAttribute('aria-valuetext', 'Category 2 of 5')
  },
}

export const NotStarted: Story = { args: { value: 0, valueText: 'Not started' } }

export const Complete: Story = { args: { value: 5, valueText: 'All done!' } }

export const OutOfRange: Story = {
  args: { value: 9 },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '5')
  },
}
