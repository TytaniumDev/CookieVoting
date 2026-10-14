import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { AdminList } from './AdminList.tsx'

const meta = {
  component: AdminList,
  parameters: { layout: 'padded' },
  args: {
    admins: [
      { email: 'tyler@example.com' },
      { email: 'mrs.claus@example.com', addedBy: 'tyler@example.com' },
    ],
    currentEmail: 'tyler@example.com',
    onAdd: fn(),
    onRemove: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-[375px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AdminList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvas }) => {
    // You can't remove yourself, only others.
    await expect(canvas.queryByRole('button', { name: 'Remove tyler@example.com' })).toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: 'Remove mrs.claus@example.com' }))
    await expect(args.onRemove).toHaveBeenCalledWith('mrs.claus@example.com')
  },
}

export const AddSomeone: Story = {
  play: async ({ args, canvas }) => {
    const field = canvas.getByLabelText('Google email')
    await userEvent.type(field, '  Rudolph@Example.com {Enter}')
    await expect(args.onAdd).toHaveBeenCalledWith('rudolph@example.com')
    await expect(field).toHaveValue('')
  },
}

export const NotAnEmail: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.type(canvas.getByLabelText('Google email'), 'rudolph{Enter}')
    await expect(canvas.getByText(/enter an email address/i)).toBeVisible()
    await expect(args.onAdd).not.toHaveBeenCalled()
  },
}

export const AlreadyAnAdmin: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.type(canvas.getByLabelText('Google email'), 'Mrs.Claus@example.com{Enter}')
    await expect(canvas.getByText('mrs.claus@example.com is already an admin.')).toBeVisible()
    await expect(args.onAdd).not.toHaveBeenCalled()
  },
}

export const Removing: Story = {
  args: { pendingEmails: new Set(['mrs.claus@example.com']) },
}
