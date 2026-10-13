import type { CategoryRanking, Cookie } from '@cookie-voting/shared'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { CategoryBallot, type CategoryBallotProps } from './CategoryBallot.tsx'

const photo = { url: '/plates/4-cookies_stars.jpg', width: 2048, height: 1536 }
const stars: Cookie[] = [
  { id: 'a', box: { x: 0.22, y: 0.09, width: 0.287, height: 0.367 } },
  { id: 'b', box: { x: 0.56, y: 0.064, width: 0.319, height: 0.366 } },
  { id: 'c', box: { x: 0.238, y: 0.545, width: 0.292, height: 0.383 } },
  { id: 'd', box: { x: 0.57, y: 0.515, width: 0.31, height: 0.39 } },
]

function Stateful(props: CategoryBallotProps) {
  const [ranking, setRanking] = useState<CategoryRanking>(props.ranking)
  return (
    <CategoryBallot
      {...props}
      ranking={ranking}
      onChange={(next) => {
        props.onChange(next)
        setRanking(next)
      }}
    />
  )
}

const meta = {
  component: CategoryBallot,
  parameters: { layout: 'padded' },
  args: { photo, cookies: stars, ranking: [], onChange: fn() },
  render: (args) => <Stateful {...args} />,
  decorators: [
    (Story) => (
      <div className="max-w-[375px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CategoryBallot>

export default meta
type Story = StoryObj<typeof meta>

export const NothingPicked: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/tap your 1st favourite/i)).toBeVisible()
  },
}

export const AllPicked: Story = { args: { ranking: ['c', 'a', 'd'] } }

export const TapToRankAndRenumber: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Cookie 2' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Cookie 4' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Cookie 1' }))
    await expect(canvas.getByText(/all 3 picked/i)).toBeVisible()
    // A fourth tap does nothing: every pick is used.
    await userEvent.click(canvas.getByRole('button', { name: 'Cookie 3' }))
    await expect(args.onChange).toHaveBeenLastCalledWith(['b', 'd', 'a'])
    // Removing the 1st moves the others up.
    await userEvent.click(canvas.getByRole('button', { name: 'Cookie 2, your 1st pick' }))
    await expect(args.onChange).toHaveBeenLastCalledWith(['d', 'a'])
    await expect(canvas.getByRole('button', { name: 'Cookie 4, your 1st pick' })).toBeVisible()
  },
}

/** Two cookies means two picks (`maxPicksFor`). */
export const SmallPlate: Story = {
  args: { cookies: stars.slice(0, 2) },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/0 of 2 picked/i)).toBeVisible()
  },
}

export const ZoomAndPick: Story = {
  play: async ({ args, canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'See cookie 3 up close' }))
    const dialog = within(canvasElement.ownerDocument.body).getByRole('dialog', {
      name: 'Cookie #3',
    })
    await expect(within(dialog).getByRole('img', { name: 'Cookie 3' })).toBeVisible()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Pick as my 1st' }))
    await expect(args.onChange).toHaveBeenLastCalledWith(['c'])
    await expect(canvas.getByRole('button', { name: 'Cookie 3, your 1st pick' })).toBeVisible()
  },
}
