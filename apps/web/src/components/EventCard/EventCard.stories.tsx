import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'
import { expect } from 'storybook/test'
import { EventCard } from './EventCard.tsx'

const meta = {
  component: EventCard,
  parameters: { layout: 'padded' },
  args: {
    name: 'Christmas Cookie Bake-Off 2025',
    status: 'setup',
    createdAt: new Date(2025, 11, 1),
    to: '/admin/events/demo',
    currentStep: 'Categories',
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="max-w-sm">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof EventCard>

export default meta
type Story = StoryObj<typeof meta>

export const SettingUp: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('link', { name: /bake-off 2025/i })).toHaveAttribute(
      'href',
      '/admin/events/demo',
    )
    await expect(canvas.getByText(/next: categories/i)).toBeVisible()
  },
}

export const VotingOpen: Story = { args: { status: 'voting' } }

export const ResultsOpen: Story = { args: { status: 'results' } }

export const AllStepsDone: Story = { args: { currentStep: null } }
