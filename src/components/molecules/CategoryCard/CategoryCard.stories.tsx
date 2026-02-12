import type { Meta, StoryObj } from '@storybook/react';
import { CategoryCard } from './CategoryCard';

const meta: Meta<typeof CategoryCard> = {
  title: 'Molecules/CategoryCard',
  component: CategoryCard,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '200px' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onImageClick: { action: 'image clicked' },
    onNameSave: { action: 'name saved' },
    onDelete: { action: 'delete clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof CategoryCard>;

export const Default: Story = {
  args: {
    id: 'cat-1',
    name: 'Sugar Cookies',
    imageUrl: 'https://picsum.photos/seed/sugar/400/400',
    cookieCount: 5,
  },
};

export const NoCookies: Story = {
  args: {
    id: 'cat-2',
    name: 'Chocolate Chip',
    imageUrl: 'https://picsum.photos/seed/chocolate/400/400',
    cookieCount: 0,
  },
};

export const LongName: Story = {
  args: {
    id: 'cat-3',
    name: "Grandma's Special Holiday Gingerbread Men",
    imageUrl: 'https://picsum.photos/seed/gingerbread/400/400',
    cookieCount: 12,
  },
};

export const OneCookie: Story = {
  args: {
    id: 'cat-4',
    name: 'Snickerdoodle',
    imageUrl: 'https://picsum.photos/seed/snicker/400/400',
    cookieCount: 1,
  },
};
