import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, screen, userEvent } from 'storybook/test'
import { Button } from '../Button/Button.tsx'
import { ConfirmDialog } from './ConfirmDialog.tsx'

const meta = {
  component: ConfirmDialog,
  args: {
    open: true,
    title: 'Delete Gingerbread?',
    children: 'Its plate photo and cookies are deleted too.',
    confirmLabel: 'Delete',
    tone: 'danger',
    onConfirm: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof ConfirmDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Danger: Story = {
  play: async ({ args }) => {
    // A modal dialog renders in the top layer, outside the story's canvas element.
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await expect(args.onConfirm).toHaveBeenCalled()
  },
}

export const Busy: Story = { args: { busy: true } }

function Opener() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open</Button>
      <ConfirmDialog
        open={open}
        title="Open voting?"
        confirmLabel="Open voting"
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      >
        Voters can start as soon as you share the link.
      </ConfirmDialog>
    </>
  )
}

export const OpenAndCancel: Story = {
  render: () => <Opener />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open' }))
    await expect(screen.getByRole('dialog', { name: 'Open voting?' })).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await expect(screen.queryByRole('dialog')).toBeNull()
  },
}
