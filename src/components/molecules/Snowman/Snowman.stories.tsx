import type { Meta, StoryObj } from '@storybook/react';
import { Snowman } from './Snowman';

const meta = {
  title: 'Molecules/Snowman',
  component: Snowman,
  parameters: {
    layout: 'centered',
    backgrounds: {
        default: 'dark',
        values: [
            { name: 'dark', value: '#1e293b' },
            { name: 'light', value: '#f8fafc' },
        ],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Snowman>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
