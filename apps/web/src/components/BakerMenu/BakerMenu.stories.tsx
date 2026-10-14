import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { BakerMenu } from './BakerMenu.tsx'

const bakers = ['Alice', 'Ben', 'Carmen', 'Dev', 'Ellie'].map((name) => ({
  id: name.toLowerCase(),
  name,
}))

const meta = {
  component: BakerMenu,
  parameters: { layout: 'padded' },
  args: {
    title: 'Cookie 2',
    bakers,
    value: 'ben',
    onChange: fn(),
    onDelete: fn(),
    onClose: fn(),
  },
} satisfies Meta<typeof BakerMenu>

export default meta
type Story = StoryObj<typeof meta>

/** Reassigning: the current baker is marked and focused. */
export const Tagged: Story = {
  play: async ({ args, canvas }) => {
    const current = canvas.getByRole('button', { name: 'Ben' })
    await expect(current).toHaveAttribute('aria-pressed', 'true')
    await expect(current).toHaveFocus()
    await userEvent.click(canvas.getByRole('button', { name: 'Dev' }))
    await expect(args.onChange).toHaveBeenCalledWith('dev')
  },
}

/** A new cookie with nobody left to highlight: nobody is marked. */
export const NeedsABaker: Story = {
  args: { title: 'Cookie 6', value: null },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('dialog', { name: 'Who baked cookie 6?' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Alice' })).toHaveFocus()
  },
}

export const DeleteAndClose: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Delete cookie 2' }))
    await expect(args.onDelete).toHaveBeenCalled()
    await userEvent.keyboard('{Escape}')
    await expect(args.onClose).toHaveBeenCalled()
  },
}

export const NoBakers: Story = {
  args: { bakers: [], value: null },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Add bakers to the event first.')).toBeVisible()
  },
}
