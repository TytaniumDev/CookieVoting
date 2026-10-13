import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { QrCode } from './QrCode.tsx'

const meta = {
  component: QrCode,
  args: {
    value: 'https://cookie-voting.web.app/event/bake-off-2025',
    label: 'QR code for the voting link',
    className: 'w-48',
  },
} satisfies Meta<typeof QrCode>

export default meta
type Story = StoryObj<typeof meta>

export const VoterLink: Story = {
  play: async ({ canvas }) => {
    const svg = canvas.getByRole('img', { name: 'QR code for the voting link' })
    await expect(svg).toBeVisible()
    // Version 3+ for a URL this long: at least 29 modules plus the quiet zone.
    await expect(Number(svg.getAttribute('viewBox')?.split(' ')[2])).toBeGreaterThanOrEqual(37)
  },
}

export const Short: Story = { args: { value: 'hi', label: 'Short QR code' } }
