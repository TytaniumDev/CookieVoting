import type { Meta, StoryObj } from '@storybook/react';
import { BakerManager } from './BakerManager';

const meta: Meta<typeof BakerManager> = {
  title: 'Organisms/Admin/BakerManager',
  component: BakerManager,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '500px', padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BakerManager>;

export const Empty: Story = {
  args: {
    eventId: 'test-event-123',
  },
};

export const WithBakers: Story = {
  args: {
    eventId: 'test-event-123',
  },
  parameters: {
    mockData: {
      bakers: [
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
        { id: '3', name: 'Carol' },
        { id: '4', name: 'David' },
      ],
    },
  },
};

export const ManyBakers: Story = {
  args: {
    eventId: 'test-event-123',
  },
  parameters: {
    mockData: {
      bakers: [
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
        { id: '3', name: 'Carol' },
        { id: '4', name: 'David' },
        { id: '5', name: 'Eve' },
        { id: '6', name: 'Frank' },
        { id: '7', name: 'Grace' },
        { id: '8', name: 'Henry' },
      ],
    },
  },
};
