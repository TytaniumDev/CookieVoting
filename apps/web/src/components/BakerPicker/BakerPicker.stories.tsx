import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent } from 'storybook/test'
import { BakerPicker, type BakerPickerProps } from './BakerPicker.tsx'

const bakers = [
  { id: 'ann', name: 'Ann' },
  { id: 'bob', name: 'Bob' },
  { id: 'carmen', name: 'Carmen' },
  { id: 'dev', name: 'Dev' },
]

function Stateful(props: BakerPickerProps) {
  const [value, setValue] = useState(props.value)
  return (
    <BakerPicker
      {...props}
      value={value}
      onChange={(id) => {
        props.onChange(id)
        setValue(id)
      }}
    />
  )
}

const meta = {
  component: BakerPicker,
  parameters: { layout: 'padded' },
  args: { bakers, value: null, onChange: fn(), label: 'Baker for cookie 1' },
  render: (args) => <Stateful {...args} />,
  decorators: [
    (Story) => (
      <div className="min-h-80 max-w-[375px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BakerPicker>

export default meta
type Story = StoryObj<typeof meta>

export const Unassigned: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('combobox', { name: 'Baker for cookie 1' })).toHaveValue('')
  },
}

export const Assigned: Story = {
  args: { value: 'carmen' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('combobox')).toHaveValue('Carmen')
  },
}

export const TypeToFilter: Story = {
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole('combobox')
    await userEvent.type(input, 'ar')
    await expect(canvas.getAllByRole('option')).toHaveLength(1)
    await userEvent.keyboard('{Enter}')
    await expect(args.onChange).toHaveBeenCalledWith('carmen')
    await expect(input).toHaveValue('Carmen')
  },
}

export const PickWithArrows: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('combobox'))
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}')
    await expect(args.onChange).toHaveBeenCalledWith('carmen')
  },
}

export const PickByTapping: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('combobox'))
    await userEvent.click(canvas.getByRole('option', { name: 'Dev' }))
    await expect(args.onChange).toHaveBeenCalledWith('dev')
  },
}

export const NoMatch: Story = {
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByRole('combobox'), 'zed')
    await expect(canvas.getByText('No baker matches “zed”.')).toBeVisible()
  },
}

export const EmptyRoster: Story = {
  args: { bakers: [] },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('combobox'))
    await expect(canvas.getByText('Add bakers to the event first.')).toBeVisible()
  },
}
