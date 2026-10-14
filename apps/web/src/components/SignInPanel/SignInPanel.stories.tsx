import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { SignInPanel } from './SignInPanel.tsx'

const meta = {
  component: SignInPanel,
  parameters: { layout: 'padded' },
  args: { onSignIn: fn(), onSignOut: fn(), onRequestAccess: fn() },
} satisfies Meta<typeof SignInPanel>

export default meta
type Story = StoryObj<typeof meta>

export const SignedOut: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /sign in with google/i }))
    await expect(args.onSignIn).toHaveBeenCalled()
  },
}

export const SigningIn: Story = { args: { busy: true } }

export const NotAnAdmin: Story = {
  args: { notAdminEmail: 'grinch@example.com' },
  play: async ({ args, canvas }) => {
    await expect(canvas.getByText('grinch@example.com')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: /sign out/i }))
    await expect(args.onSignOut).toHaveBeenCalled()
  },
}

export const AskToBeAdmin: Story = {
  args: { notAdminEmail: 'elf@example.com' },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Ask to be an admin' }))
    await expect(args.onRequestAccess).toHaveBeenCalled()
  },
}

export const RequestSent: Story = {
  args: { notAdminEmail: 'elf@example.com', requested: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Request sent')).toBeVisible()
    await expect(canvas.queryByRole('button', { name: 'Ask to be an admin' })).toBeNull()
  },
}

export const Failed: Story = { args: { error: 'The sign-in window was closed.' } }
