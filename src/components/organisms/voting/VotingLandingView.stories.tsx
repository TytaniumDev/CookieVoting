import type { Meta, StoryObj } from '@storybook/react';
import { VotingLandingView } from './VotingLandingView';
import type { Category } from '../../../lib/types';

const meta: Meta<typeof VotingLandingView> = {
  title: 'Organisms/Voting/VotingLandingView',
  component: VotingLandingView,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof VotingLandingView>;

const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Best Taste',
    imageUrl: 'https://placehold.co/300x300/orange/white?text=Taste',
    cookies: [],
  },
  {
    id: '2',
    name: 'Best Look',
    imageUrl: 'https://placehold.co/300x300/purple/white?text=Look',
    cookies: [],
  },
  {
    id: '3',
    name: 'Most Creative',
    imageUrl: 'https://placehold.co/300x300/green/white?text=Creative',
    cookies: [],
  },
];

export const Default: Story = {
  args: {
    eventName: 'Holiday Cookie Off 2025',
    categories: mockCategories,
    onStart: () => console.log('Start voting clicked'),
  },
};
