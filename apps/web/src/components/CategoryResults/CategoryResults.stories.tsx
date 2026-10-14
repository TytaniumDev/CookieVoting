import type { CategoryResult } from '@cookie-voting/shared'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { CategoryResults } from './CategoryResults.tsx'

const plate = {
  photo: { url: '/plates/4-cookies_stars.jpg', width: 2048, height: 1536 },
  cookies: [
    { id: 'a', box: { x: 0.08, y: 0.1, width: 0.3, height: 0.36 } },
    { id: 'b', box: { x: 0.55, y: 0.08, width: 0.3, height: 0.38 } },
    { id: 'c', box: { x: 0.1, y: 0.55, width: 0.3, height: 0.36 } },
    { id: 'd', box: { x: 0.56, y: 0.54, width: 0.3, height: 0.38 } },
  ],
}

const result: CategoryResult = {
  categoryId: 'stars',
  name: 'Stars',
  standings: [
    { cookieId: 'c', bakerId: 'carmen', bakerName: 'Carmen', points: 31, rank: 1 },
    { cookieId: 'a', bakerId: 'ann', bakerName: 'Ann', points: 22, rank: 2 },
    { cookieId: 'd', bakerId: 'dev', bakerName: 'Dev', points: 22, rank: 2 },
    { cookieId: 'b', bakerId: null, bakerName: null, points: 5, rank: 4 },
  ],
}

const meta = {
  component: CategoryResults,
  args: { result, plate },
  decorators: [
    (Story) => (
      <div className="max-w-[375px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CategoryResults>

export default meta
type Story = StoryObj<typeof meta>

export const WithTies: Story = {
  play: async ({ canvas }) => {
    const rows = canvas.getAllByRole('listitem')
    await expect(rows).toHaveLength(4)
    await expect(within(rows[0]!).getByText('Carmen')).toBeVisible()
    await expect(within(rows[0]!).queryByText(/Cookie #/)).toBeNull()
    await expect(canvas.getAllByText(/Tied 2nd/)).toHaveLength(2)
    await expect(canvas.getAllByRole('img', { name: '2nd place' })).toHaveLength(2)
    await expect(canvas.getByRole('img', { name: '4th place' })).toBeVisible()
    await expect(canvas.getByText('No baker')).toBeVisible()
  },
}

/** Before the plate has loaded (or after it was deleted), rows just skip the picture. */
export const WithoutPictures: Story = {
  args: { plate: undefined },
}

export const NoCookies: Story = {
  args: { result: { ...result, standings: [] } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No cookies in this category.')).toBeVisible()
  },
}
