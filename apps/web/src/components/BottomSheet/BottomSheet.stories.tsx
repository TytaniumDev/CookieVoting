import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, screen, userEvent, waitFor } from 'storybook/test'
import { Button } from '../Button/Button.tsx'
import { BottomSheet } from './BottomSheet.tsx'

const header = (
  <h2 id="sheet-title" className="pr-10 text-3xl text-primary">
    Ann's cookies
  </h2>
)

const meta = {
  component: BottomSheet,
  args: { open: true, onClose: fn(), labelledBy: 'sheet-title', header },
} satisfies Meta<typeof BottomSheet>

export default meta
type Story = StoryObj<typeof meta>

/** A short sheet: nothing scrolls. On phones it sits at the bottom with a grab handle. */
export const Short: Story = {
  args: { children: <p>Gingerbread, Stars and Trees.</p> },
  play: async ({ args }) => {
    // A modal dialog renders in the top layer, outside the story's canvas element.
    await expect(screen.getByRole('dialog', { name: "Ann's cookies" })).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    await expect(args.onClose).toHaveBeenCalled()
  },
}

/** Taller than the screen: only the list scrolls, the header and ✕ stay in view. */
export const LongList: Story = {
  args: {
    children: (
      <ol className="grid gap-2">
        {Array.from({ length: 30 }, (_, i) => (
          <li key={i} className="rounded-control bg-surface p-3">
            Cookie {i + 1}
          </li>
        ))}
      </ol>
    ),
  },
  play: async () => {
    const title = screen.getByRole('heading', { name: "Ann's cookies" })
    const top = title.getBoundingClientRect().top
    const last = screen.getByText('Cookie 30')
    last.scrollIntoView()
    await waitFor(() => expect(last).toBeVisible())
    await expect(title.getBoundingClientRect().top).toBe(top)
    await expect(screen.getByRole('button', { name: 'Close' })).toBeVisible()
  },
}

function Opener() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>See Ann's cookies</Button>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        labelledBy="sheet-title"
        header={header}
      >
        <p>Gingerbread, Stars and Trees.</p>
      </BottomSheet>
    </>
  )
}

/** Opens from a button and closes again (Escape, the backdrop and a drag down close it too). */
export const OpenAndClose: Story = {
  render: () => <Opener />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: "See Ann's cookies" }))
    await expect(screen.getByRole('dialog', { name: "Ann's cookies" })).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.getByRole('dialog', { hidden: true })).not.toBeVisible())
  },
}
