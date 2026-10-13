import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent } from 'storybook/test'
import { CategoryNameForm } from './CategoryNameForm.tsx'

const meta = {
  component: CategoryNameForm,
  parameters: { layout: 'padded' },
  args: {
    existingNames: ['Stars'],
    pastNames: ['Gingerbread', 'Gingerbread', 'Sugar Cookies', 'Stars', 'Candy Canes', 'Bars'],
    onAdd: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-[375px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CategoryNameForm>

export default meta
type Story = StoryObj<typeof meta>

export const Suggestions: Story = {
  play: async ({ args, canvas }) => {
    // Most used first; names the event already has are left out.
    const chips = canvas.getAllByRole('button', { name: /^\+/ })
    await expect(chips[0]).toHaveTextContent('Gingerbread')
    await expect(canvas.queryByRole('button', { name: '+ Stars' })).toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: '+ Bars' }))
    await expect(args.onAdd).toHaveBeenCalledWith('Bars')
  },
}

export const TypeANewName: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.type(canvas.getByLabelText('Category name'), 'Thumbprints{Enter}')
    await expect(args.onAdd).toHaveBeenCalledWith('Thumbprints')
    await expect(canvas.getByLabelText('Category name')).toHaveValue('')
  },
}

export const Duplicate: Story = {
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByLabelText('Category name'), 'stars')
    await expect(canvas.getByText(/already has a category/i)).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Add category' })).toBeDisabled()
  },
}

export const NoHistory: Story = { args: { pastNames: [], existingNames: [] } }
