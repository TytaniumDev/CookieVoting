import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Alert } from './Alert.tsx'

const meta = {
  component: Alert,
  parameters: { layout: 'padded' },
  args: { children: 'Results will appear here once the organiser opens them.' },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Info: Story = {
  args: { title: 'Thanks for voting!' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('Thanks for voting!')
  },
}

export const Success: Story = {
  args: { tone: 'success', title: 'Votes submitted', children: 'Your picks are in. 🍪' },
}

export const Warning: Story = {
  args: {
    tone: 'warning',
    title: '2 cookies need a baker',
    children: 'Assign every cookie before opening voting.',
  },
}

export const Danger: Story = {
  args: {
    tone: 'danger',
    title: 'Voting is closed',
    children: 'This event is no longer accepting votes.',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent('Voting is closed')
  },
}

export const WithoutTitle: Story = {}
