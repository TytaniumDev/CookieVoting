import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, spyOn, userEvent } from 'storybook/test'
import { SharePanel } from './SharePanel.tsx'

const url = 'https://cookie-voting.web.app/event/bake-off-2025'

const meta = {
  component: SharePanel,
  parameters: { layout: 'padded' },
  args: { url, title: 'Christmas Cookie Bake-Off 2025' },
  decorators: [
    (Story) => (
      <div className="max-w-[375px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SharePanel>

export default meta
type Story = StoryObj<typeof meta>

export const WithQrCode: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(url)).toBeVisible()
    await expect(canvas.getByRole('img', { name: `QR code for ${url}` })).toBeVisible()
  },
}

export const LinkOnly: Story = {
  args: { showQrCode: false },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('img')).toBeNull()
  },
}

export const Copy: Story = {
  beforeEach: () => {
    const writeText = spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    return () => writeText.mockRestore()
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Copy link' }))
    await expect(navigator.clipboard.writeText).toHaveBeenCalledWith(url)
    await expect(await canvas.findByText('Copied!')).toBeVisible()
  },
}

export const CopyRefused: Story = {
  beforeEach: () => {
    const writeText = spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('no'))
    return () => writeText.mockRestore()
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Copy link' }))
    await expect(await canvas.findByText(/copy failed/i)).toBeVisible()
  },
}
