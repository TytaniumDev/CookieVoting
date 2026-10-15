import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor } from 'storybook/test'
import { SlideShow, type SlideShowProps } from './SlideShow.tsx'

function Stateful(props: SlideShowProps) {
  const [current, setCurrent] = useState(props.current)
  return (
    <SlideShow
      {...props}
      current={current}
      onCurrentChange={(next) => {
        props.onCurrentChange(next)
        setCurrent(next)
      }}
    />
  )
}

const names = ['Gingerbread People', 'Stars', 'Candy Canes', 'Stockings', 'Trees', 'Cats']

const meta = {
  component: SlideShow,
  parameters: { layout: 'fullscreen' },
  args: {
    label: 'Results',
    current: 0,
    onCurrentChange: fn(),
    className: 'h-96',
    slides: names.map((name) => ({
      id: name,
      label: name,
      content: <h2 className="mt-12 text-center text-4xl">{name}</h2>,
    })),
  },
  render: (args) => <Stateful {...args} />,
  decorators: [
    (Story) => (
      <div className="bg-primary px-(--gutter) py-4 text-on-primary">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SlideShow>

export default meta
type Story = StoryObj<typeof meta>

export const FirstSlide: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Gingerbread People' })).toHaveAttribute(
      'aria-current',
      'true',
    )
    await expect(canvas.getByRole('heading', { name: 'Gingerbread People' })).toBeVisible()
  },
}

/** A tab scrolls its slide into view; the slides before it aren't reported on the way. */
export const TapATab: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Trees' }))
    await expect(args.onCurrentChange).toHaveBeenCalledTimes(1)
    await expect(args.onCurrentChange).toHaveBeenCalledWith(4)
    await waitFor(() => expect(canvas.getByRole('heading', { name: 'Trees' })).toBeVisible())
  },
}

/** Off-screen slides are out of reach for keyboards and screen readers. */
export const OtherSlidesInert: Story = {
  play: async ({ canvas }) => {
    const stars = canvas.getByRole('heading', { name: 'Stars', hidden: true })
    await expect(stars.closest('[inert]')).not.toBeNull()
    await expect(
      canvas.getByRole('heading', { name: 'Gingerbread People' }).closest('[inert]'),
    ).toBeNull()
  },
}

/** Slides only move sideways: content a little taller than a slide can't be panned. */
export const SidewaysOnly: Story = {
  args: {
    slides: names.map((name) => ({
      id: name,
      label: name,
      content: <h2 className="h-[30rem] shrink-0 pt-12 text-center text-4xl">{name}</h2>,
    })),
  },
  play: async ({ canvas }) => {
    const track = canvas.getByRole('region', { name: 'Results' })
    await expect(track.scrollHeight).toBeGreaterThan(track.clientHeight)
    await expect(getComputedStyle(track).overflowY).toBe('hidden')
  },
}
