import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent } from 'storybook/test'
import { BakerChips, type BakerChipsProps } from './BakerChips.tsx'

const names = ['Alice', 'Ben', 'Carmen', 'Dev', 'Ellie']
const bakers = (counts: number[]) =>
  names.map((name, i) => ({ id: name.toLowerCase(), name, count: counts[i] ?? 0 }))

function Stateful(props: BakerChipsProps) {
  const [active, setActive] = useState(props.active)
  return (
    <BakerChips
      {...props}
      active={active}
      onSelect={(id) => {
        props.onSelect(id)
        setActive(id)
      }}
    />
  )
}

const meta = {
  component: BakerChips,
  parameters: { layout: 'padded' },
  args: { bakers: bakers([]), active: 'alice', onSelect: fn() },
  render: (args) => <Stateful {...args} />,
  decorators: [
    (Story) => (
      <div className="max-w-[375px] px-(--gutter)">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BakerChips>

export default meta
type Story = StoryObj<typeof meta>

export const NobodyYet: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /alice/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(canvas.getByRole('button', { name: 'Ben (no cookie yet)' })).toBeVisible()
  },
}

export const SomeTagged: Story = {
  args: { bakers: bakers([1, 1]), active: 'carmen' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Alice (1 cookie)' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: /carmen/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  },
}

/** Everyone has a cookie: nobody is highlighted, and a second entry shows a count. */
export const EveryoneTagged: Story = {
  args: { bakers: bakers([1, 1, 1, 2, 1]), active: null },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Dev (2 cookies)' })).toBeVisible()
    for (const chip of canvas.getAllByRole('button')) {
      await expect(chip).toHaveAttribute('aria-pressed', 'false')
    }
  },
}

/** Tapping a chip makes that baker next, e.g. to skip someone. */
export const PickWhoIsNext: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /ellie/i }))
    await expect(args.onSelect).toHaveBeenCalledWith('ellie')
    await expect(canvas.getByRole('button', { name: /ellie/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  },
}

/** A long roster scrolls sideways instead of wrapping. */
export const LongRoster: Story = {
  args: {
    bakers: [...names, 'Frankie', 'Gwen', 'Hiroshi', 'Imani', 'Jordan'].map((name, i) => ({
      id: name.toLowerCase(),
      name,
      count: i < 7 ? 1 : 0,
    })),
    active: 'hiroshi',
  },
  play: async ({ canvas }) => {
    const group = canvas.getByRole('group', { name: 'Bakers' })
    await expect(group.scrollWidth).toBeGreaterThan(group.clientWidth)
  },
}
