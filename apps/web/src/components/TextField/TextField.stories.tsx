import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { TextField } from './TextField.tsx'

const meta = {
  component: TextField,
  args: { label: 'Event name', placeholder: 'Office Cookie Swap 2026' },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('Event name')
    await userEvent.type(input, 'Holiday Bake-Off')
    await expect(input).toHaveValue('Holiday Bake-Off')
  },
}

export const WithHint: Story = {
  args: { hint: 'Voters see this on the first screen.' },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('Event name')).toHaveAccessibleDescription(
      'Voters see this on the first screen.',
    )
  },
}

export const WithError: Story = {
  args: { hint: 'Voters see this on the first screen.', error: 'Give the event a name.' },
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText('Event name')
    await expect(input).toBeInvalid()
    await expect(input).toHaveAccessibleDescription('Give the event a name.')
  },
}

export const Disabled: Story = { args: { disabled: true, value: 'Holiday Bake-Off' } }
