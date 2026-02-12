import type { Meta, StoryObj } from '@storybook/react';
import { BakerDropdown } from './BakerDropdown';

const mockBakers = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
  { id: '3', name: 'Carol' },
  { id: '4', name: 'David' },
];

const meta: Meta<typeof BakerDropdown> = {
  title: 'Molecules/BakerDropdown',
  component: BakerDropdown,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onSelect: { action: 'baker selected' },
    onRemove: { action: 'remove clicked' },
    onClose: { action: 'close clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof BakerDropdown>;

export const Default: Story = {
  args: {
    bakers: mockBakers,
    title: 'Assign Baker',
  },
};

export const WithSelection: Story = {
  args: {
    bakers: mockBakers,
    selectedBakerId: '2',
    title: 'Assign Baker',
  },
};

export const WithRemoveButton: Story = {
  args: {
    bakers: mockBakers,
    selectedBakerId: '3',
    showRemove: true,
    title: 'Assign Baker',
  },
};

export const Empty: Story = {
  args: {
    bakers: [],
    title: 'Assign Baker',
  },
};

export const ManyBakers: Story = {
  args: {
    bakers: [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
      { id: '3', name: 'Carol' },
      { id: '4', name: 'David' },
      { id: '5', name: 'Eve' },
      { id: '6', name: 'Frank' },
      { id: '7', name: 'Grace' },
      { id: '8', name: 'Henry' },
      { id: '9', name: 'Ivy' },
      { id: '10', name: 'Jack' },
    ],
    title: 'Assign Baker',
  },
};
