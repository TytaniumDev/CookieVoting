import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { Button } from './Button.tsx'

const meta = {
  component: Button,
  args: { children: 'Start voting', onClick: fn() },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Start voting' }))
    await expect(args.onClick).toHaveBeenCalledOnce()
  },
}

export const Secondary: Story = { args: { variant: 'secondary' } }

export const Ghost: Story = { args: { variant: 'ghost', children: 'Back' } }

export const Danger: Story = { args: { variant: 'danger', children: 'Delete category' } }

export const Large: Story = { args: { size: 'lg', children: 'Submit my votes 🎉' } }

export const FullWidth: Story = {
  args: { size: 'lg', fullWidth: true, children: 'Next category' },
  parameters: { layout: 'padded' },
}

export const Loading: Story = {
  args: { loading: true, children: 'Submitting…' },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: /Submitting/ })
    await expect(button).toBeDisabled()
    await expect(button).toHaveAttribute('aria-busy', 'true')
  },
}

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button')).toBeDisabled()
  },
}

export const KeyboardFocus: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab()
    await expect(canvas.getByRole('button')).toHaveFocus()
  },
}
