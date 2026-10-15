import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { PageLoading } from './PageLoading.tsx'

const meta = {
  component: PageLoading,
  args: { label: 'Loading the event', onReload: fn() },
} satisfies Meta<typeof PageLoading>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading the event')
    await expect(canvas.queryByRole('button', { name: 'Reload' })).toBeNull()
  },
}

/** Still loading after the wait: offers a reload. */
export const TakingLong: Story = {
  args: { slowAfterMs: 0 },
  play: async ({ args, canvas }) => {
    await userEvent.click(await canvas.findByRole('button', { name: 'Reload' }))
    await expect(args.onReload).toHaveBeenCalledOnce()
  },
}
