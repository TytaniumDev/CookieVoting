import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { PicksSummary } from './PicksSummary.tsx'

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
  { id: 'trees', name: 'Trees', photo: plate('6-cookies_trees.jpg'), cookies: grid('t', 6) },
]

const meta = {
  component: PicksSummary,
  parameters: { layout: 'padded' },
  args: {
    categories,
    rankings: { stars: ['s2', 's1', 's4'], canes: ['c5', 'c3', 'c1'], trees: ['t6', 't2', 't3'] },
    onEdit: fn(),
  },
  decorators: [
    (Story, { parameters }) => (
      <div style={{ maxWidth: (parameters.width as string | undefined) ?? '375px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PicksSummary>

export default meta
type Story = StoryObj<typeof meta>

export const Phone: Story = {
  play: async ({ args, canvas }) => {
    await expect(canvas.getAllByRole('img', { name: '1st place' })).toHaveLength(3)
    await expect(canvas.getByRole('img', { name: 'Cookie 5' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Change Candy Canes' }))
    await expect(args.onEdit).toHaveBeenCalledWith('canes')
  },
}

export const Laptop: Story = { parameters: { width: '48rem' } }

/** A category added after the voter sent their ballot. */
export const NewCategory: Story = {
  args: { rankings: { stars: ['s2', 's1', 's4'], canes: ['c5', 'c3', 'c1'] } },
  play: async ({ args, canvas }) => {
    await expect(canvas.getByText('No votes here yet.')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Vote in Trees' }))
    await expect(args.onEdit).toHaveBeenCalledWith('trees')
  },
}
