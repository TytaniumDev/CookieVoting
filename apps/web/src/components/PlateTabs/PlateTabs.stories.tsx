import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent } from 'storybook/test'
import { PlateTabs, type PlateTab, type PlateTabsProps } from './PlateTabs.tsx'

const plates: PlateTab[] = [
  {
    id: 'people',
    name: 'Gingerbread People',
    photo: { url: '/plates/4-cookies_people.jpg' },
    done: true,
  },
  { id: 'stars', name: 'Stars', photo: { url: '/plates/4-cookies_stars.jpg' }, done: true },
  { id: 'trees', name: 'Trees', photo: { url: '/plates/6-cookies_trees.jpg' }, done: false },
  { id: 'cats', name: 'Cats', photo: { url: '/plates/7-cookies_cats.jpg' }, done: false },
]

function Stateful(props: PlateTabsProps) {
  const [selected, setSelected] = useState(props.selected)
  return (
    <PlateTabs
      {...props}
      selected={selected}
      onSelect={(id) => {
        props.onSelect(id)
        setSelected(id)
      }}
    />
  )
}

const meta = {
  component: PlateTabs,
  parameters: { layout: 'padded' },
  args: { plates, selected: 'trees', onSelect: fn() },
  render: (args) => <Stateful {...args} />,
  decorators: [
    (Story) => (
      <div className="max-w-[375px] px-(--gutter)">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PlateTabs>

export default meta
type Story = StoryObj<typeof meta>

export const SomeDone: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /^trees/i })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(canvas.getByRole('button', { name: 'Stars (done)' })).toBeVisible()
  },
}

/** A plate without a photo yet keeps an empty frame. */
export const NoPhoto: Story = {
  args: {
    plates: [...plates, { id: 'new', name: 'Plate 5', photo: null, done: false }],
    selected: 'new',
  },
}

export const PickAPlate: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^cats/i }))
    await expect(args.onSelect).toHaveBeenCalledWith('cats')
    await expect(canvas.getByRole('button', { name: /^cats/i })).toHaveAttribute(
      'aria-current',
      'page',
    )
  },
}
