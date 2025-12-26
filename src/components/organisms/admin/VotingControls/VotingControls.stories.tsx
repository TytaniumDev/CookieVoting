import type { Meta, StoryObj } from '@storybook/react';
import { VotingControls } from './VotingControls';

const meta: Meta<typeof VotingControls> = {
    title: 'Organisms/Admin/VotingControls',
    component: VotingControls,
    parameters: {
        layout: 'padded',
        backgrounds: {
            default: 'dark',
        },
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div style={{ maxWidth: '400px', padding: '1rem' }}>
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof VotingControls>;

export const VotingOpen: Story = {
    args: {
        eventId: 'test-event-123',
    },
    parameters: {
        mockData: {
            activeEvent: {
                id: 'test-event-123',
                name: 'Cookie Contest 2024',
                status: 'voting',
            },
        },
    },
};

export const VotingClosed: Story = {
    args: {
        eventId: 'test-event-123',
    },
    parameters: {
        mockData: {
            activeEvent: {
                id: 'test-event-123',
                name: 'Cookie Contest 2024',
                status: 'completed',
            },
        },
    },
};
