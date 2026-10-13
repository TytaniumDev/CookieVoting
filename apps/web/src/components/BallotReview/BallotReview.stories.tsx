import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { BallotReview } from './BallotReview.tsx'

const plate = (file: string) => ({ url: `/plates/${file}`, width: 2048, height: 1536 })
const grid = (prefix: string, n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: `${prefix}${i + 1}`,
    box: { x: (i % 2) * 0.5 + 0.05, y: Math.floor(i / 2) * 0.33 + 0.05, width: 0.4, height: 0.28 },
  }))

const categories = [
  { id: 'stars', name: 'Stars', photo: plate('4-cookies_stars.jpg'), cookies: grid('s', 4) },
  {
    id: 'canes',
    name: 'Candy Canes',
    photo: plate('5-cookies_candy-canes.jpg'),
    cookies: grid('c', 5),
  },
]

const meta = {
  component: BallotReview,
  parameters: { layout: 'padded' },
  args: {
    categories,
    rankings: { stars: ['s2', 's1', 's4'], canes: ['c5', 'c3', 'c1'] },
    onEdit: fn(),
    onSubmit: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-[375px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BallotReview>

export default meta
type Story = StoryObj<typeof meta>

export const Ready: Story = {
  play: async ({ args, canvas }) => {
    await expect(canvas.getAllByRole('img', { name: /place$/ })).toHaveLength(6)
    await userEvent.click(canvas.getByRole('button', { name: 'Change Candy Canes' }))
    await expect(args.onEdit).toHaveBeenCalledWith(1)
    await userEvent.click(canvas.getByRole('button', { name: 'Submit my votes' }))
    await expect(args.onSubmit).toHaveBeenCalled()
  },
}

export const Submitting: Story = { args: { submitting: true } }
