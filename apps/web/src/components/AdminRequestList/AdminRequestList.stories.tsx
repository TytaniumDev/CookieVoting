import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { AdminRequestList } from './AdminRequestList.tsx'

const meta = {
  component: AdminRequestList,
  parameters: { layout: 'padded' },
  args: {
    requests: [
      { email: 'mrs.claus@example.com', name: 'Mrs Claus' },
      { email: 'rudolph.the.red.nosed.reindeer@example.com' },
    ],
    onApprove: fn(),
    onDecline: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-[375px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AdminRequestList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvas }) => {
    await expect(canvas.getByText('Mrs Claus')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Approve mrs.claus@example.com' }))
    await expect(args.onApprove).toHaveBeenCalledWith('mrs.claus@example.com')
    await userEvent.click(
      canvas.getByRole('button', { name: 'Decline rudolph.the.red.nosed.reindeer@example.com' }),
    )
    await expect(args.onDecline).toHaveBeenCalledWith('rudolph.the.red.nosed.reindeer@example.com')
  },
}

export const Approving: Story = {
  args: { pendingEmails: new Set(['mrs.claus@example.com']) },
}
