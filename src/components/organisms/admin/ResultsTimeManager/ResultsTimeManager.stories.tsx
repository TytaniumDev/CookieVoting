import type { Meta, StoryObj } from '@storybook/react';
import { ResultsTimeManager } from './ResultsTimeManager';

const meta: Meta<typeof ResultsTimeManager> = {
    title: 'Organisms/Admin/ResultsTimeManager',
    component: ResultsTimeManager,
    parameters: {
        layout: 'padded',
        backgrounds: {
            default: 'dark',
        },
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div style={{ maxWidth: '320px', padding: '1rem' }}>
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof ResultsTimeManager>;

export const Default: Story = {
    args: {
        eventId: 'test-event-123',
    },
};

export const WithTimeSet: Story = {
    args: {
        eventId: 'test-event-123',
    },
    parameters: {
        mockData: {
            activeEvent: {
                id: 'test-event-123',
                name: 'Cookie Contest 2024',
                resultsAvailableTime: Date.now() + 4 * 60 * 60 * 1000, // 4 hours from now
            },
        },
    },
};
