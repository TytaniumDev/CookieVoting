import type { Meta, StoryObj } from '@storybook/react';
import { CategoryTaggingNavigator } from './CategoryTaggingNavigator';

const meta: Meta<typeof CategoryTaggingNavigator> = {
    title: 'Organisms/Admin/CategoryTaggingNavigator',
    component: CategoryTaggingNavigator,
    parameters: {
        layout: 'padded',
        backgrounds: {
            default: 'dark',
        },
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div style={{ height: '600px', padding: '1rem' }}>
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof CategoryTaggingNavigator>;

export const Default: Story = {
    args: {
        eventId: 'test-event-123',
    },
};

export const WithInitialCategory: Story = {
    args: {
        eventId: 'test-event-123',
        initialCategoryId: 'cat-2',
    },
};
