import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { PhotoZoom } from './PhotoZoom.tsx'

const meta = {
  component: PhotoZoom,
  parameters: { layout: 'padded' },
  args: {
    photo: { url: '/plates/5-cookies_candy-canes.jpg', width: 2048, height: 1536 },
    label: 'Candy Canes',
    className: 'w-16',
  },
} satisfies Meta<typeof PhotoZoom>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Resting the mouse on the thumbnail shows the photo big beside it. */
export const HoverShowsPreview: Story = {
  play: async ({ canvas, canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const thumb = canvas.getByRole('button', { name: 'Enlarge photo of Candy Canes' })
    await userEvent.hover(thumb)
    const preview = await body.findByTestId('photo-preview')
    await expect(preview).toBeVisible()
    await expect(preview.getBoundingClientRect().width).toBeGreaterThan(
      thumb.getBoundingClientRect().width * 3,
    )
    await userEvent.unhover(thumb)
    await waitFor(() => expect(body.queryByTestId('photo-preview')).toBeNull())
  },
}

/** Tapping or clicking opens the full photo; Close, Escape or the backdrop shuts it. */
export const TapOpensFullPhoto: Story = {
  play: async ({ canvas, canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Enlarge photo of Candy Canes' }))
    const dialog = body.getByRole('dialog', { name: 'Candy Canes' })
    await expect(
      within(dialog).getByRole('img', { name: 'Plate photo of Candy Canes' }),
    ).toBeVisible()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
  },
}
