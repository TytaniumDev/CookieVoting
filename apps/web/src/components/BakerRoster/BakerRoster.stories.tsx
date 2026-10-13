import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent } from 'storybook/test'
import { BakerRoster, type BakerOption } from './BakerRoster.tsx'

const everyone: BakerOption[] = [
  { id: 'ann', name: 'Ann' },
  { id: 'annie', name: 'Annie Lee' },
  { id: 'bob', name: 'Bob' },
  { id: 'carmen', name: 'Carmen' },
]

/** Wires the callbacks to local state so the play functions can add, create and remove. */
function Stateful({ initial }: { initial: string[] }) {
  const [all, setAll] = useState(everyone)
  const [rosterIds, setRosterIds] = useState(initial)
  return (
    <BakerRoster
      roster={all.filter((b) => rosterIds.includes(b.id))}
      allBakers={all}
      onAdd={(id) => setRosterIds((ids) => [...ids, id])}
      onCreate={(name) => {
        const id = name.toLowerCase()
        setAll((bakers) => [...bakers, { id, name }])
        setRosterIds((ids) => [...ids, id])
      }}
      onRemove={(id) => setRosterIds((ids) => ids.filter((x) => x !== id))}
    />
  )
}

const meta = {
  component: BakerRoster,
  parameters: { layout: 'padded' },
  args: {
    roster: everyone.slice(0, 2),
    allBakers: everyone,
    onAdd: fn(),
    onCreate: fn(),
    onRemove: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-[375px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BakerRoster>

export default meta
type Story = StoryObj<typeof meta>

export const WithBakers: Story = {}

export const Empty: Story = {
  args: { roster: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/no bakers yet/i)).toBeVisible()
  },
}

export const Pending: Story = { args: { pendingIds: new Set(['ann']) } }

export const SearchAndAdd: Story = {
  render: () => <Stateful initial={[]} />,
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByLabelText('Name'), 'ann')
    await expect(canvas.getByRole('button', { name: 'Add Ann' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Add Annie Lee' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Add Annie Lee' }))
    const roster = canvas.getByRole('list')
    await expect(roster).toHaveTextContent('Annie Lee')
  },
}

export const CreateNew: Story = {
  render: () => <Stateful initial={['ann']} />,
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByLabelText('Name'), 'Dev{Enter}')
    await expect(canvas.getByRole('button', { name: 'Remove Dev' })).toBeVisible()
    await expect(canvas.getByLabelText('Name')).toHaveValue('')
  },
}

export const Remove: Story = {
  render: () => <Stateful initial={['ann', 'bob']} />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Remove Bob' }))
    await expect(canvas.queryByRole('button', { name: 'Remove Bob' })).toBeNull()
  },
}

export const AlreadyInEvent: Story = {
  args: { roster: everyone },
  render: (args) => <BakerRoster {...args} />,
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByLabelText('Name'), 'bob')
    await expect(canvas.getByText(/bob is already in this event/i)).toBeVisible()
    await expect(canvas.queryByRole('button', { name: /create/i })).toBeNull()
  },
}
