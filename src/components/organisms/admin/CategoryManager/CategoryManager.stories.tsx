import type { Meta, StoryObj } from '@storybook/react';
import { CategoryManager } from './CategoryManager';

const meta: Meta<typeof CategoryManager> = {
  title: 'Organisms/Admin/CategoryManager',
  component: CategoryManager,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '800px', padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CategoryManager>;

export const Empty: Story = {
  args: {
    eventId: 'test-event-123',
  },
};

export const WithCategories: Story = {
  args: {
    eventId: 'test-event-123',
  },
  parameters: {
    mockData: {
      categories: [
        {
          id: '1',
          name: 'Sugar Cookies',
          imageUrl: 'https://picsum.photos/seed/cookie1/400/400',
          cookies: [{}, {}, {}],
        },
        {
          id: '2',
          name: 'Chocolate Chip',
          imageUrl: 'https://picsum.photos/seed/cookie2/400/400',
          cookies: [{}, {}],
        },
        {
          id: '3',
          name: 'Gingerbread',
          imageUrl: 'https://picsum.photos/seed/cookie3/400/400',
          cookies: [],
        },
      ],
    },
  },
};

export const ManyCategories: Story = {
  args: {
    eventId: 'test-event-123',
  },
  parameters: {
    mockData: {
      categories: [
        {
          id: '1',
          name: 'Sugar Cookies',
          imageUrl: 'https://picsum.photos/seed/c1/400/400',
          cookies: [{}, {}, {}],
        },
        {
          id: '2',
          name: 'Chocolate Chip',
          imageUrl: 'https://picsum.photos/seed/c2/400/400',
          cookies: [{}, {}],
        },
        {
          id: '3',
          name: 'Gingerbread',
          imageUrl: 'https://picsum.photos/seed/c3/400/400',
          cookies: [],
        },
        {
          id: '4',
          name: 'Snickerdoodle',
          imageUrl: 'https://picsum.photos/seed/c4/400/400',
          cookies: [{}, {}, {}, {}],
        },
        {
          id: '5',
          name: 'Peanut Butter',
          imageUrl: 'https://picsum.photos/seed/c5/400/400',
          cookies: [{}],
        },
        {
          id: '6',
          name: 'Oatmeal Raisin',
          imageUrl: 'https://picsum.photos/seed/c6/400/400',
          cookies: [{}, {}],
        },
      ],
    },
  },
};
