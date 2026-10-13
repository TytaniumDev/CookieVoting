import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Snowfall, type SnowfallProps } from './Snowfall.tsx'

function Scene({ surface, ...props }: SnowfallProps & { surface: string }) {
  return (
    <div className={`relative grid h-64 place-items-center ${surface}`}>
      <Snowfall {...props} />
      <p className="relative font-display text-3xl font-semibold">Let it snow ❄️</p>
    </div>
  )
}

const meta = {
  component: Snowfall,
  parameters: { layout: 'fullscreen' },
  render: (args) => <Scene surface="bg-primary text-on-primary" {...args} />,
} satisfies Meta<typeof Snowfall>

export default meta
type Story = StoryObj<typeof meta>

export const OnPrimary: Story = {
  play: async ({ canvas }) => {
    const snow = canvas.getByTestId('snowfall')
    await expect(snow).toHaveAttribute('aria-hidden', 'true')
    await expect(snow.children).toHaveLength(24)
  },
}

export const OnSecondary: Story = {
  render: (args) => <Scene surface="bg-secondary text-on-secondary" {...args} />,
}

export const Light: Story = { args: { count: 10 } }

export const Heavy: Story = { args: { count: 60 } }
