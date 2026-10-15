import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { SlowNotice } from './SlowNotice.tsx'

const meta = {
  component: SlowNotice,
  parameters: { layout: 'padded' },
  args: {
    title: 'Still sending your votes',
    children: 'This is taking longer than it should. Check your connection, then try again.',
    onRetry: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SlowNotice>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('Still sending your votes')
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }))
    await expect(args.onRetry).toHaveBeenCalledOnce()
  },
}

export const Retrying: Story = {
  args: { retrying: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Try again' })).toBeDisabled()
  },
}

export const Reload: Story = {
  args: {
    title: 'Still loading',
    children: 'This is taking longer than it should. Check your connection, then reload.',
    retryLabel: 'Reload',
  },
}
