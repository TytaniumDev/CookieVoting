import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor } from 'storybook/test'
import { CategoryList, type CategoryListItem } from './CategoryList.tsx'

const plate = (file: string) => ({ path: file, url: `/plates/${file}`, width: 2048, height: 1536 })

const categories: CategoryListItem[] = [
  { id: 'a', name: 'Gingerbread People', photo: plate('4-cookies_people.jpg'), cookieCount: 4 },
  { id: 'b', name: 'Stars', photo: plate('4-cookies_stars.jpg'), cookieCount: 0 },
  { id: 'c', name: 'Candy Canes', photo: null, cookieCount: 0 },
]

function Reorderable() {
  const [items, setItems] = useState(categories)
  return (
    <CategoryList
      categories={items}
      onReorder={(ids) => setItems(ids.map((id) => items.find((c) => c.id === id)!))}
      onRename={(id, name) => setItems(items.map((c) => (c.id === id ? { ...c, name } : c)))}
      onDelete={() => {}}
      onPhoto={() => {}}
    />
  )
}

const meta = {
  component: CategoryList,
  parameters: { layout: 'padded' },
  args: { categories, onReorder: fn(), onRename: fn(), onDelete: fn(), onPhoto: fn() },
  decorators: [
    (Story) => (
      <div className="max-w-[375px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CategoryList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Needs a photo')).toBeVisible()
    await expect(canvas.getByText('4 cookies')).toBeVisible()
  },
}

export const Uploading: Story = { args: { uploads: { c: 0.4 } } }

export const DeleteAsks: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Delete Stars' }))
    await expect(args.onDelete).toHaveBeenCalledWith('b')
  },
}

export const Rename: Story = {
  render: () => <Reorderable />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Rename Stars' }))
    const field = canvas.getByLabelText('New name')
    await userEvent.clear(field)
    await userEvent.type(field, 'Shooting Stars{Enter}')
    await expect(canvas.getByRole('heading', { name: 'Shooting Stars' })).toBeVisible()
  },
}

/** Keyboard reordering: focus a handle, Space to lift, arrow to move, Space to drop. */
export const KeyboardReorder: Story = {
  render: () => <Reorderable />,
  play: async ({ canvas }) => {
    canvas.getByRole('button', { name: 'Reorder Candy Canes' }).focus()
    await userEvent.keyboard(' ')
    await userEvent.keyboard('{ArrowUp}')
    await userEvent.keyboard(' ')
    await waitFor(() =>
      expect(canvas.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
        'Gingerbread People',
        'Candy Canes',
        'Stars',
      ]),
    )
  },
}
