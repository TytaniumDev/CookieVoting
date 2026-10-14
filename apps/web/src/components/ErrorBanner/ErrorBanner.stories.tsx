import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { ErrorBanner } from './ErrorBanner.tsx'

const meta = {
  component: ErrorBanner,
  parameters: { layout: 'padded' },
  args: {
    errors: [
      {
        id: 1,
        title: "That didn't save",
        message:
          "Firebase Storage: User does not have permission to access 'events/abc/plates/x.jpg'.",
      },
    ],
    onDismiss: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-[375px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ErrorBanner>

export default meta
type Story = StoryObj<typeof meta>

export const OneError: Story = {
  play: async ({ args, canvas }) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent("That didn't save")
    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss' }))
    await expect(args.onDismiss).toHaveBeenCalledWith(1)
  },
}

export const Several: Story = {
  args: {
    errors: [
      { id: 1, title: "That didn't save", message: 'You are offline.' },
      { id: 2, title: 'Voting didn’t open', message: 'Missing or insufficient permissions.' },
    ],
  },
}

export const Empty: Story = {
  args: { errors: [] },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('alert')).toBeNull()
  },
}
