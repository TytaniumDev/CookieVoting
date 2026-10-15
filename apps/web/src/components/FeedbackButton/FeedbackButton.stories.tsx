import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { FeedbackButton } from './FeedbackButton.tsx'

const open = fn()

const meta = {
  component: FeedbackButton,
  args: {
    // Stands in for Sentry, which is off in Storybook: clicks call `open`.
    attach: (el) => {
      el.addEventListener('click', open)
      return () => el.removeEventListener('click', open)
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-primary p-3">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FeedbackButton>

export default meta
type Story = StoryObj<typeof meta>

// The "Feedback" label shows from 640 px up; narrower, only the 💬 icon.
export const Default: Story = {
  play: async ({ canvas }) => {
    open.mockClear()
    await userEvent.click(canvas.getByRole('button', { name: 'Send feedback or report a problem' }))
    await expect(open).toHaveBeenCalledOnce()
  },
}
