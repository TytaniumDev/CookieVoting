import type { Meta, StoryObj } from '@storybook/react';
import { ProgressDots } from './ProgressDots';

const meta: Meta<typeof ProgressDots> = {
  title: 'Molecules/ProgressDots',
  component: ProgressDots,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onDotClick: { action: 'dot clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof ProgressDots>;

export const AllEmpty: Story = {
  args: {
    items: [
      { id: '1', label: 'Sugar Cookies: 0/5', status: 'empty' },
      { id: '2', label: 'Chocolate Chip: 0/3', status: 'empty' },
      { id: '3', label: 'Gingerbread: 0/4', status: 'empty' },
    ],
    activeIndex: 0,
  },
};

export const Mixed: Story = {
  args: {
    items: [
      { id: '1', label: 'Sugar Cookies: 5/5', status: 'complete' },
      { id: '2', label: 'Chocolate Chip: 2/3', status: 'partial' },
      { id: '3', label: 'Gingerbread: 0/4', status: 'empty' },
    ],
    activeIndex: 1,
  },
};

export const AllComplete: Story = {
  args: {
    items: [
      { id: '1', label: 'Sugar Cookies: 5/5', status: 'complete' },
      { id: '2', label: 'Chocolate Chip: 3/3', status: 'complete' },
      { id: '3', label: 'Gingerbread: 4/4', status: 'complete' },
    ],
    activeIndex: 2,
  },
};

export const ManyItems: Story = {
  args: {
    items: [
      { id: '1', label: 'Category 1', status: 'complete' },
      { id: '2', label: 'Category 2', status: 'complete' },
      { id: '3', label: 'Category 3', status: 'partial' },
      { id: '4', label: 'Category 4', status: 'partial' },
      { id: '5', label: 'Category 5', status: 'empty' },
      { id: '6', label: 'Category 6', status: 'empty' },
      { id: '7', label: 'Category 7', status: 'empty' },
      { id: '8', label: 'Category 8', status: 'empty' },
    ],
    activeIndex: 3,
  },
};

export const Small: Story = {
  args: {
    items: [
      { id: '1', label: 'Step 1', status: 'complete' },
      { id: '2', label: 'Step 2', status: 'partial' },
      { id: '3', label: 'Step 3', status: 'empty' },
    ],
    activeIndex: 1,
    size: 'small',
  },
};

export const Large: Story = {
  args: {
    items: [
      { id: '1', label: 'Step 1', status: 'complete' },
      { id: '2', label: 'Step 2', status: 'partial' },
      { id: '3', label: 'Step 3', status: 'empty' },
    ],
    activeIndex: 1,
    size: 'large',
  },
};
