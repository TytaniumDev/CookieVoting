import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent } from 'storybook/test'
import { Stepper, type StepperStep } from './Stepper.tsx'

const steps: StepperStep[] = [
  { id: 'bakers', label: 'Bakers', done: true },
  { id: 'categories', label: 'Categories', done: true },
  { id: 'cookies', label: 'Cookies', done: false },
  { id: 'assign', label: 'Assign bakers', done: false },
  { id: 'voting', label: 'Voting', done: false },
  { id: 'results', label: 'Results', done: false },
]

function Interactive({ initial }: { initial: string }) {
  const [selected, setSelected] = useState(initial)
  return <Stepper steps={steps} selected={selected} onSelect={setSelected} />
}

const meta = {
  component: Stepper,
  parameters: { layout: 'padded' },
  args: { steps, selected: 'cookies', onSelect: () => {} },
  decorators: [
    (Story) => (
      <div className="max-w-[375px] px-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Stepper>

export default meta
type Story = StoryObj<typeof meta>

export const InProgress: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /cookies/i })).toHaveAttribute(
      'aria-current',
      'step',
    )
    await expect(canvas.getByRole('button', { name: /bakers \(done\)/i })).toBeVisible()
  },
}

export const NothingDone: Story = {
  args: { steps: steps.map((s) => ({ ...s, done: false })), selected: 'bakers' },
}

/** Any step can be opened, done or not. */
export const PickAnyStep: Story = {
  render: () => <Interactive initial="bakers" />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /results/i }))
    await expect(canvas.getByRole('button', { name: /results/i })).toHaveAttribute(
      'aria-current',
      'step',
    )
  },
}
