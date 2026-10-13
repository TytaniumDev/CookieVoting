import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Spinner } from './Spinner.tsx'

const meta = {
  component: Spinner,
  args: { label: 'Loading votes' },
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading votes')
  },
}

export const Small: Story = { args: { size: 'sm' } }

export const Large: Story = { args: { size: 'lg' } }

export const OnPrimary: Story = {
  decorators: [
    (Story) => (
      <div className="rounded-card bg-primary p-6 text-on-primary">
        <Story />
      </div>
    ),
  ],
}
