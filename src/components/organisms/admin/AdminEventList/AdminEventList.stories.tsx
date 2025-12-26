import type { Meta, StoryObj } from '@storybook/react';
import { AdminEventList } from './AdminEventList';
import { expect, within } from 'storybook/test';


const meta: Meta<typeof AdminEventList> = {
    title: 'Organisms/Admin/AdminEventList',
    component: AdminEventList,
    parameters: {
        layout: 'fullscreen',
    },
    decorators: [
        (Story) => (
            <div id="mobile-wrapper" style={{
                width: '375px',
                height: '100vh',
                border: '2px solid red',
                overflow: 'hidden',
                position: 'relative',
                background: '#1a1a1a'
            }}>
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof AdminEventList>;

const mockEvents = [
    {
        id: '1',
        name: 'Holiday Cookie-Off 2024 with a very long name that might cause overflow on small screens',
        status: 'voting' as const,
        createdAt: Date.now(),
        adminCode: '1234',
    },
    {
        id: '2',
        name: 'Summer Bake Sale',
        status: 'completed' as const,
        createdAt: Date.now() - 10000000,
        adminCode: '5678',
    },
];

const mockImages = {
    '1': [
        'https://via.placeholder.com/150',
        'https://via.placeholder.com/150?text=Cookie2',
        'https://via.placeholder.com/150?text=Cookie3',
        'https://via.placeholder.com/150?text=Cookie4',
        'https://via.placeholder.com/150?text=Cookie5',
    ],
    '2': [],
};

export const MobileOverflow: Story = {
    args: {
        events: mockEvents,
        eventImages: mockImages,
        deletingId: null,
        onDeleteClick: () => { },
        onResultClick: () => { },
        onEventClick: () => { },
    },
    play: async ({ canvasElement, step }) => {
        const canvas = within(canvasElement);

        // Wait for render
        await expect(canvas.getByText(/Holiday Cookie-Off/)).toBeVisible();

        await step('Check for horizontal overflow', async () => {
            const wrapper = canvasElement.querySelector('#mobile-wrapper');
            if (!wrapper) throw new Error('Mobile wrapper not found');

            const scrollWidth = wrapper.scrollWidth;
            const clientWidth = wrapper.clientWidth;

            console.log({ scrollWidth, clientWidth, name: 'AdminEventList MobileOverflow Check' });
            // If running in browser, this depends on the selected viewport.

            // Strict check: scrollWidth should NOT be greater than clientWidth
            // We add a small buffer for subpixel rendering
            expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
        });
    },
};
