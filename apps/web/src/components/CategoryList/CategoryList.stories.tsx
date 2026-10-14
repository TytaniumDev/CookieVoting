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

const names = (fields: HTMLElement[]) => fields.map((f) => (f as HTMLInputElement).value)

function Reorderable() {
  const [items, setItems] = useState(categories)
  return (
    <CategoryList
      categories={items}
      onReorder={(ids) => setItems(ids.map((id) => items.find((c) => c.id === id)!))}
      onRename={(id, name) => setItems(items.map((c) => (c.id === id ? { ...c, name } : c)))}
      onDelete={() => {}}
    />
  )
}

const meta = {
  component: CategoryList,
  parameters: { layout: 'padded' },
  args: { categories, onReorder: fn(), onRename: fn(), onDelete: fn() },
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

/** Freshly uploaded plates, waiting for names; past names are offered as you type. */
export const NewPlates: Story = {
  args: {
    categories: [
      { id: 'a', name: 'Plate 1', photo: plate('4-cookies_stars.jpg'), cookieCount: 0 },
      { id: 'b', name: 'Plate 2', photo: plate('4-cookies_people.jpg'), cookieCount: 0 },
    ],
    suggestions: ['Stars', 'Gingerbread People', 'Candy Canes'],
  },
}

export const DeleteAsks: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Delete Stars' }))
    await expect(args.onDelete).toHaveBeenCalledWith('b')
  },
}

/** Typing saves after a pause, without pressing anything. */
export const RenameSavesItself: Story = {
  play: async ({ args, canvas }) => {
    const field = canvas.getAllByLabelText('Category name')[1]!
    await userEvent.clear(field)
    await userEvent.type(field, 'Shooting Stars')
    await waitFor(() => expect(args.onRename).toHaveBeenCalledWith('b', 'Shooting Stars'))
    await expect(args.onRename).toHaveBeenCalledTimes(1)
    // Leaving the field doesn't save the same name twice.
    await userEvent.tab()
    await expect(args.onRename).toHaveBeenCalledTimes(1)
  },
}

/** Enter saves straight away; an empty name is never saved and snaps back. */
export const RenameWithEnter: Story = {
  play: async ({ args, canvas }) => {
    const field = canvas.getAllByLabelText('Category name')[1]!
    await userEvent.clear(field)
    await userEvent.tab()
    await expect(field).toHaveValue('Stars')
    await userEvent.type(field, ' Cookies{Enter}')
    await expect(args.onRename).toHaveBeenCalledOnce()
    await expect(args.onRename).toHaveBeenCalledWith('b', 'Stars Cookies')
  },
}

/** Two categories can't share a name. */
export const DuplicateName: Story = {
  play: async ({ args, canvas }) => {
    const field = canvas.getAllByLabelText('Category name')[1]!
    await userEvent.clear(field)
    await userEvent.type(field, 'candy canes')
    await expect(canvas.getByText('Another category has that name.')).toBeVisible()
    await expect(field).toHaveAttribute('aria-invalid', 'true')
    await userEvent.keyboard('{Escape}')
    await expect(field).toHaveValue('Stars')
    await expect(args.onRename).not.toHaveBeenCalled()
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
      expect(names(canvas.getAllByLabelText('Category name'))).toEqual([
        'Gingerbread People',
        'Candy Canes',
        'Stars',
      ]),
    )
  },
}
