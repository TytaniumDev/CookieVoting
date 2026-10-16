import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { trees, treesPhoto } from '../CategoryBallot/fixtures.ts'
import { CookieThumb } from '../CookieThumb/CookieThumb.tsx'
import { Ornaments, type OrnamentItem } from './Ornaments.tsx'
import { DROPPED, revealed } from './reveal.ts'

const picture = (i: number) => (
  <CookieThumb photo={treesPhoto} cookie={trees[i]!} alt="" round className="w-full" />
)

const items: OrnamentItem[] = [
  { id: 'a', rank: 1, tied: false, name: 'Ann', detail: '40 pts', picture: picture(0) },
  { id: 'b', rank: 2, tied: false, name: 'Frank', detail: '33 pts', picture: picture(1) },
  { id: 'c', rank: 3, tied: false, name: 'Carmen', detail: '24 pts', picture: picture(2) },
]

const meta = {
  component: Ornaments,
  parameters: { layout: 'fullscreen' },
  args: { items, reveal: revealed(3), className: 'h-[30rem]' },
  decorators: [
    (Story) => (
      <div className="bg-primary p-4 text-on-primary">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Ornaments>

export default meta
type Story = StoryObj<typeof meta>

/** Every ornament open: 1st in the middle with a crown, a medal on each. */
export const Open: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'Ann, 1st place, 40 pts' })).toBeVisible()
    await expect(canvas.getByRole('img', { name: 'Carmen, 3rd place, 24 pts' })).toBeVisible()
  },
}

/** Dropped onto the garland, before the reveal: nobody's name shows. */
export const Closed: Story = {
  args: { reveal: DROPPED },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('img', { name: 'Not revealed yet' })).toHaveLength(3)
    await expect(canvas.queryByRole('img', { name: /Ann/ })).toBeNull()
  },
}

/** Mid-reveal: 3rd is open and 2nd is shaking before it opens. */
export const Drumroll: Story = {
  args: { reveal: { dropped: true, opened: 1, drum: 1 } },
}

/** The ornaments lowering on their strings, the first time a slide is seen. */
export const Dropping: Story = { args: { reveal: DROPPED, animate: true } }

/** On a laptop the ornaments sit side by side. */
export const Wide: Story = { args: { className: 'h-80' } }

/** A tie for 2nd says so on both tags. */
export const Tied: Story = {
  args: {
    items: [items[0]!, { ...items[1]!, tied: true }, { ...items[2]!, rank: 2, tied: true }],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('img', { name: /tied 2nd place/ })).toHaveLength(2)
  },
}

/** 1st shared too: the taller tags still fit (on a phone, 1st hangs below them). */
export const TiedFirst: Story = {
  args: {
    className: 'h-[27.5rem] max-w-[22.375rem]',
    items: [
      { ...items[0]!, tied: true },
      { ...items[1]!, rank: 1, tied: true },
      { ...items[2]!, detail: '24 pts in all' },
    ],
  },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getAllByRole('img', { name: /tied 1st place/ })).toHaveLength(2)
    // The winner's tag, lowest of all, ends inside the area: nothing below it is cut off.
    const area = canvasElement.querySelector('.relative')!.getBoundingClientRect()
    const tag = canvas.getByText('Ann').parentElement!.getBoundingClientRect()
    await expect(tag.bottom).toBeLessThanOrEqual(area.bottom + 0.5)
  },
}

/** A category with only two cookies hangs two ornaments. */
export const TwoCookies: Story = { args: { items: items.slice(0, 2), reveal: revealed(2) } }

/** With `onSelect`, open ornaments are buttons. */
export const Selectable: Story = {
  args: { onSelect: fn() },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^Frank, 2nd place/ }))
    await expect(args.onSelect).toHaveBeenCalledWith('b')
  },
}
