import { emptyPlaces, type CategoryPlaces } from '@cookie-voting/shared'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor } from 'storybook/test'
import { CategoryBallot, type CategoryBallotProps } from './CategoryBallot.tsx'
import { trees, treesPhoto } from './fixtures.ts'

function Stateful(props: CategoryBallotProps) {
  const [places, setPlaces] = useState<CategoryPlaces>(props.places)
  return (
    <CategoryBallot
      {...props}
      places={places}
      onChange={(next) => {
        props.onChange(next)
        setPlaces(next)
      }}
    />
  )
}

const meta = {
  component: CategoryBallot,
  parameters: { layout: 'fullscreen' },
  args: {
    photo: treesPhoto,
    cookies: trees,
    places: emptyPlaces(trees.length),
    onChange: fn(),
    className: 'h-[34rem]',
  },
  render: (args) => <Stateful {...args} />,
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-readable bg-primary px-(--gutter) py-4 text-on-primary">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CategoryBallot>

export default meta
type Story = StoryObj<typeof meta>

export const NoMedalsYet: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'Cookie 1' })).toBeInTheDocument()
    await expect(canvas.getByRole('group', { name: 'Give cookie 1 a medal' })).toBeVisible()
    // Hidden at the ends, so there's nothing to go back to.
    await expect(canvas.queryByRole('button', { name: 'Previous cookie' })).toBeNull()
  },
}

export const SomeMedals: Story = { args: { places: ['t3', null, 't1'] } }

/** Medals go to any cookie in any order; giving one again takes it back. */
export const GiveMedals: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /2nd place not given yet/i }))
    await expect(args.onChange).toHaveBeenLastCalledWith([null, 't1', null])

    await userEvent.click(canvas.getByRole('button', { name: 'Next cookie' }))
    await waitFor(() =>
      expect(canvas.getByRole('group', { name: 'Give cookie 2 a medal' })).toBeVisible(),
    )
    // 2nd moves from cookie 1 to cookie 2.
    await userEvent.click(canvas.getByRole('button', { name: /2nd place on another cookie/i }))
    await expect(args.onChange).toHaveBeenLastCalledWith([null, 't2', null])

    await userEvent.click(canvas.getByRole('button', { name: 'Show cookie 5' }))
    await waitFor(() =>
      expect(canvas.getByRole('group', { name: 'Give cookie 5 a medal' })).toBeVisible(),
    )
    await userEvent.click(canvas.getByRole('button', { name: /1st place not given yet/i }))
    await userEvent.click(canvas.getByRole('button', { name: /1st place tap to take back/i }))
    await expect(args.onChange).toHaveBeenLastCalledWith([null, 't2', null])
    await expect(
      canvas.getByRole('button', { name: 'Show cookie 2, your 2nd place' }),
    ).toBeVisible()
  },
}

export const AllMedalsGiven: Story = {
  args: { places: ['t3', 't6', 't1'] },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /3rd place tap to take back/i })).toBeVisible()
  },
}

/** Two cookies means two medals (`maxPicksFor`). */
export const SmallPlate: Story = {
  args: { cookies: trees.slice(0, 2), places: emptyPlaces(2) },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: /3rd place/i })).toBeNull()
  },
}

export const WithFooter: Story = {
  args: {
    footer: (
      <button type="button" className="min-h-14 rounded-control bg-secondary font-bold">
        Next category →
      </button>
    ),
  },
}
