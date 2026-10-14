import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { Button } from '../Button/Button.tsx'
import { trees, treesPhoto } from '../CategoryBallot/fixtures.ts'
import { CookieThumb } from '../CookieThumb/CookieThumb.tsx'
import { BakerBreakdown, type BakerBreakdownProps } from './BakerBreakdown.tsx'

const thumb = (i: number) => (
  <CookieThumb photo={treesPhoto} cookie={trees[i]!} alt="" round className="w-full" />
)

const select = fn()
const cookies = [
  ['Gingerbread', 1, 4, 81],
  ['Stars', 2, 4, 67],
  ['Candy Canes', 2, 5, 53],
  ['Stockings', 5, 5, 37],
  ['Trees', 5, 6, 30],
  ['Cats', 5, 7, 26],
] as const

const baker: NonNullable<BakerBreakdownProps['baker']> = {
  name: 'Ann',
  rank: 1,
  tied: false,
  bakers: 8,
  points: 294,
  picture: thumb(0),
  cookies: cookies.map(([category, rank, categorySize, points], i) => ({
    id: `c${i}`,
    category,
    rank,
    tied: false,
    categorySize,
    points,
    picture: thumb(i),
    onSelect: () => select(category),
  })),
}

const meta = {
  component: BakerBreakdown,
  args: { baker, onClose: fn() },
} satisfies Meta<typeof BakerBreakdown>

export default meta
type Story = StoryObj<typeof meta>

const dialog = () => within(screen.getByRole('dialog'))
const row = (name: RegExp) =>
  dialog()
    .getAllByRole('listitem')
    .find((li) => name.test(li.textContent ?? ''))!

export const Default: Story = {
  play: async ({ args }) => {
    // A modal dialog renders in the top layer, outside the story's canvas element.
    await expect(dialog().getByRole('heading', { name: 'Ann' })).toBeVisible()
    await expect(dialog().getByText('1st of 8 bakers')).toBeVisible()
    await expect(dialog().getByText('294 pts in all')).toBeVisible()
    await expect(dialog().getAllByRole('listitem')).toHaveLength(6)
    await expect(dialog().getByText('2nd of 5')).toBeVisible()
    await userEvent.click(dialog().getByRole('button', { name: 'Close' }))
    await expect(args.onClose).toHaveBeenCalled()
  },
}

/** Hovering a piece of the points bar names its cookie and lights up its row. */
export const HoverTheBar: Story = {
  play: async () => {
    const piece = dialog().getByRole('button', { name: 'Stars: 67 pts, 23% of the total' })
    await userEvent.hover(piece)
    await waitFor(() => expect(row(/^Stars/).firstElementChild).toHaveClass('bg-accent-subtle'))
    await expect(row(/^Gingerbread/).firstElementChild).not.toHaveClass('bg-accent-subtle')
    await userEvent.unhover(piece)
    await waitFor(() => expect(row(/^Stars/).firstElementChild).not.toHaveClass('bg-accent-subtle'))
  },
}

/** Tapping a cookie opens its votes. */
export const TapACookie: Story = {
  play: async () => {
    select.mockClear()
    await userEvent.click(dialog().getByRole('button', { name: /Candy Canes.*See its votes/ }))
    await expect(select).toHaveBeenCalledWith('Candy Canes')
  },
}

/** Results from before vote counts were kept: the rows aren't buttons. */
export const NoVoteCounts: Story = {
  args: {
    baker: { ...baker, cookies: baker.cookies.map((c) => ({ ...c, onSelect: undefined })) },
  },
  play: async () => {
    await expect(dialog().queryByRole('button', { name: /See its votes/ })).toBeNull()
    await expect(dialog().getByText('6 cookies')).toBeVisible()
  },
}

/** Nobody voted for any of their cookies: no bar, just the list. */
export const NoPoints: Story = {
  args: {
    baker: {
      ...baker,
      name: 'Hiro',
      rank: 8,
      points: 0,
      cookies: [{ ...baker.cookies[5]!, rank: 7, points: 0 }],
    },
  },
  play: async () => {
    await expect(dialog().getByText('8th of 8 bakers')).toBeVisible()
    await expect(dialog().queryByRole('group')).toBeNull()
    await expect(dialog().getByText('1 cookie · tap one for its votes')).toBeVisible()
  },
}

function Opener() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>See Ann's cookies</Button>
      <BakerBreakdown baker={open ? baker : null} onClose={() => setOpen(false)} />
    </>
  )
}

/** Opens from a button and closes again (Escape and the backdrop close it too). */
export const OpenAndClose: Story = {
  render: () => <Opener />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: "See Ann's cookies" }))
    await expect(screen.getByRole('dialog', { name: 'Ann' })).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(screen.getByRole('dialog', { hidden: true })).not.toBeVisible())
  },
}
