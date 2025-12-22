import type { Meta, StoryObj } from '@storybook/react';
import { VotingSessionView } from './VotingSessionView';
import { useState } from 'react';
import { testCategories } from '../../../stories/data/test-cookies';

const meta: Meta<typeof VotingSessionView> = {
    title: 'Organisms/Voting/VotingSessionView',
    component: VotingSessionView,
    parameters: {
        layout: 'fullscreen',
    },
};

export default meta;
type Story = StoryObj<typeof VotingSessionView>;

const InteractiveStory = () => {
    const [votes, setVotes] = useState<Record<string, number>>({});

    return (
        <VotingSessionView
            categories={testCategories}
            votes={votes}
            onVote={(catId, cookieNum) => setVotes(prev => ({ ...prev, [catId]: cookieNum }))}
            onComplete={() => alert('Completed!')}
        />
    );
};

export const Default: Story = {
    render: () => <InteractiveStory />
};
