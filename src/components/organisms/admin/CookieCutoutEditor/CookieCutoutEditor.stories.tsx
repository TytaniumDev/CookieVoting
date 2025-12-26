import type { Meta, StoryObj } from '@storybook/react';
import { CookieCutoutEditor } from './CookieCutoutEditor';

const meta: Meta<typeof CookieCutoutEditor> = {
    title: 'Organisms/Admin/CookieCutoutEditor',
    component: CookieCutoutEditor,
    parameters: {
        layout: 'padded',
        backgrounds: {
            default: 'dark',
        },
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div style={{ height: '500px', padding: '1rem' }}>
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof CookieCutoutEditor>;

export const Default: Story = {
    args: {
        eventId: 'test-event-123',
        imageUrl: 'https://picsum.photos/seed/cookies/800/600',
    },
};

export const WithImageId: Story = {
    args: {
        eventId: 'test-event-123',
        imageUrl: 'https://picsum.photos/seed/cookies2/800/600',
        imageId: 'img-123',
    },
};
