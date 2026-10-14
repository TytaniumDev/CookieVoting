import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, screen, userEvent, waitFor } from 'storybook/test'
import { Button } from '../Button/Button.tsx'
import { trees, treesPhoto } from '../CategoryBallot/fixtures.ts'
import { CookieThumb } from '../CookieThumb/CookieThumb.tsx'
import { VoteBreakdown, type VoteBreakdownProps } from './VoteBreakdown.tsx'

const cookie: NonNullable<VoteBreakdownProps['cookie']> = {
  picture: <CookieThumb photo={treesPhoto} cookie={trees[0]!} alt="" round className="w-full" />,
  name: 'Ann',
  category: 'Trees',
  rank: 1,
  tied: false,
  points: 59,
  votes: [12, 9, 5],
  voters: 42,
}

const meta = {
  component: VoteBreakdown,
  args: { cookie, onClose: fn() },
} satisfies Meta<typeof VoteBreakdown>

export default meta
type Story = StoryObj<typeof meta>

export const Winner: Story = {
  play: async ({ args }) => {
    // A modal dialog renders in the top layer, outside the story's canvas element.
    await expect(screen.getByRole('heading', { name: 'Ann' })).toBeVisible()
    await expect(screen.getByText('12 × 3 = 36 pts')).toBeVisible()
    await expect(screen.getByText('5 × 1 = 5 pts')).toBeVisible()
    // 42 voters, 26 put it in their top 3.
    await expect(screen.getByText('16 votes')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    await expect(args.onClose).toHaveBeenCalled()
  },
}

/** Lower down, tied with another cookie: no medal on the photo. */
export const TiedFifth: Story = {
  args: { cookie: { ...cookie, rank: 5, tied: true, points: 7, votes: [0, 2, 3] } },
  play: async () => {
    await expect(screen.getByText(/Trees · Tied 5th place/)).toBeVisible()
    await expect(screen.getByText('0 votes')).toBeVisible()
  },
}

function Opener() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>See the votes</Button>
      <VoteBreakdown cookie={open ? cookie : null} onClose={() => setOpen(false)} />
    </>
  )
}

/** Opens from a button and closes again (Escape and the backdrop close it too). */
export const OpenAndClose: Story = {
  render: () => <Opener />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'See the votes' }))
    await expect(screen.getByRole('dialog', { name: 'Ann' })).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(screen.getByRole('dialog', { hidden: true })).not.toBeVisible())
  },
}
