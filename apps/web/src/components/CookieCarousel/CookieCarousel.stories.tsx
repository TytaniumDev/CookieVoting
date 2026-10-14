import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor } from 'storybook/test'
import { trees, treesPhoto } from '../CategoryBallot/fixtures.ts'
import { CookieCarousel, type CookieCarouselProps } from './CookieCarousel.tsx'

function Stateful(props: CookieCarouselProps) {
  const [current, setCurrent] = useState(props.current)
  return (
    <CookieCarousel
      {...props}
      current={current}
      onCurrentChange={(next) => {
        props.onCurrentChange(next)
        setCurrent(next)
      }}
    />
  )
}

const meta = {
  component: CookieCarousel,
  parameters: { layout: 'fullscreen' },
  args: {
    photo: treesPhoto,
    cookies: trees,
    places: [null, null, null],
    current: 0,
    onCurrentChange: fn(),
    className: 'h-96',
  },
  render: (args) => <Stateful {...args} />,
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-readable bg-primary px-(--gutter) py-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CookieCarousel>

export default meta
type Story = StoryObj<typeof meta>

export const FirstCookie: Story = {
  play: async ({ canvas }) => {
    // Hidden at the ends, so there's nothing to go back to.
    await expect(canvas.queryByRole('button', { name: 'Previous cookie' })).toBeNull()
    await expect(canvas.getByRole('img', { name: 'Cookie 1' })).toBeVisible()
  },
}

export const ArrowsStepThrough: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Next cookie' }))
    await expect(args.onCurrentChange).toHaveBeenCalledWith(1)
    await waitFor(() => expect(canvas.getByRole('img', { name: 'Cookie 2' })).toBeVisible())
  },
}

export const LastCookie: Story = {
  args: { current: 5 },
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.queryByRole('button', { name: 'Next cookie' })).toBeNull())
  },
}

/** The medal sits inside the card's corner, so it is never cut off. */
export const WithMedal: Story = {
  args: { places: ['t1', null, null] },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: '1st place' })).toBeVisible()
  },
}
