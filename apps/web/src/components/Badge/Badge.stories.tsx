import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Badge } from './Badge.tsx'

const meta = {
  component: Badge,
  args: { children: 'Draft' },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Neutral: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Draft')).toBeVisible()
  },
}

export const Primary: Story = { args: { tone: 'primary', children: 'Needs photos' } }

export const Secondary: Story = { args: { tone: 'secondary', children: 'Voting open 🗳️' } }

export const Accent: Story = { args: { tone: 'accent', children: 'Results ⭐' } }

export const Success: Story = { args: { tone: 'success', children: 'Complete' } }

export const Warning: Story = { args: { tone: 'warning', children: '2 cookies unassigned' } }

export const Danger: Story = { args: { tone: 'danger', children: 'Voting closed' } }

export const AllTones: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>Draft</Badge>
      <Badge tone="primary">Needs photos</Badge>
      <Badge tone="secondary">Voting open</Badge>
      <Badge tone="accent">Results</Badge>
      <Badge tone="success">Complete</Badge>
      <Badge tone="warning">2 unassigned</Badge>
      <Badge tone="danger">Closed</Badge>
    </div>
  ),
}
