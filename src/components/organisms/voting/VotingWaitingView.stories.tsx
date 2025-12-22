import type { Meta, StoryObj } from '@storybook/react';
import { VotingWaitingView } from './VotingWaitingView';

const meta: Meta<typeof VotingWaitingView> = {
  title: 'Organisms/Voting/VotingWaitingView',
  component: VotingWaitingView,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof VotingWaitingView>;

const NOW = Date.now();

export const Waiting: Story = {
  args: {
    resultsAvailableTime: NOW + 3600000, // 1 hour later
    onViewResults: () => alert('View Results Clicked'),
  },
};

export const Ready: Story = {
  args: {
    resultsAvailableTime: NOW - 1000, // 1 second ago
    onViewResults: () => alert('View Results Clicked'),
  },
};
