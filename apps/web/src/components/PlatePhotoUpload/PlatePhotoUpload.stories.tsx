import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { PlatePhotoUpload } from './PlatePhotoUpload.tsx'

const meta = {
  component: PlatePhotoUpload,
  parameters: { layout: 'padded' },
  args: { onFiles: fn() },
  decorators: [
    (Story) => (
      <div className="max-w-[375px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PlatePhotoUpload>

export default meta
type Story = StoryObj<typeof meta>

const photo = (name: string) => new File(['jpeg'], name, { type: 'image/jpeg' })

export const PickSeveral: Story = {
  play: async ({ args, canvas }) => {
    const files = [photo('stars.jpg'), photo('canes.jpg')]
    await userEvent.upload(canvas.getByLabelText('Upload plate photos'), files)
    await expect(args.onFiles).toHaveBeenCalledWith(files)
  },
}

export const Uploading: Story = {
  args: { progress: { current: 2, total: 4, fraction: 0.5 } },
  play: async ({ canvas }) => {
    const bar = canvas.getByRole('progressbar', { name: 'Uploading photo 2 of 4' })
    await expect(bar).toHaveAttribute('aria-valuenow', '38')
    await expect(canvas.queryByLabelText('Upload plate photos')).toBeNull()
  },
}
