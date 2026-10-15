import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Spinner } from './Spinner.tsx'

const meta = {
  component: Spinner,
  args: { label: 'Loading votes' },
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading votes')
    // Inline, the label is for screen readers only.
    await expect(canvas.getByText('Loading votes')).toHaveClass('sr-only')
  },
}

export const Medium: Story = { args: { size: 'md' } }

export const Large: Story = { args: { size: 'lg' } }

/** Part of a page that is still loading: centred in its container, label shown. */
export const Section: Story = {
  args: { layout: 'section', label: 'Loading bakers' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading bakers')
    await expect(canvas.getByText('Loading bakers')).not.toHaveClass('sr-only')
  },
}

/** A whole page that is still loading: the cookie sits in the middle of the screen. */
export const Screen: Story = {
  args: { layout: 'screen', label: 'Loading the event' },
  parameters: { layout: 'fullscreen' },
}

/** No label when the surrounding element already says it's busy. */
export const Unlabelled: Story = {
  args: { label: '' },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('status')).toBeNull()
  },
}

/** On the cranberry voter pages. */
export const OnPrimary: Story = {
  args: { layout: 'section', size: 'lg', label: 'Loading the results' },
  decorators: [
    (Story) => (
      <div className="rounded-card bg-primary p-6 text-on-primary">
        <Story />
      </div>
    ),
  ],
}
