import type { Meta, StoryObj } from '@storybook/react';
import { AdminPageHeader } from './AdminPageHeader';
import { within, expect } from '@storybook/test';

const meta: Meta<typeof AdminPageHeader> = {
    title: 'Organisms/Admin/AdminPageHeader',
    component: AdminPageHeader,
    parameters: {
        layout: 'fullscreen',
        viewport: {
            defaultViewport: 'iphone12',
        },
    },
    decorators: [
        (Story) => (
            <div id="mobile-wrapper" style={{
                width: '375px',
                height: '100vh',
                border: '2px solid red',
                overflow: 'hidden', // Make sure container clips, but we check scrollWidth
                position: 'relative',
                background: '#1a1a1a'
            }}>
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof AdminPageHeader>;

export const MobileActions: Story = {
    args: {
        detectingAll: false,
        currentJobId: null,
        onAuditClick: () => { },
        onCancelDetection: () => { },
        onDetectAll: () => { },
    },
    play: async ({ canvasElement, step }) => {
        // Wait for render
        const canvas = within(canvasElement);
        await expect(canvas.getByText(/Create Voting Event/)).toBeVisible();

        await step('Check for horizontal overflow', async () => {
            const wrapper = canvasElement.querySelector('#mobile-wrapper');
            if (!wrapper) throw new Error('Mobile wrapper not found');

            const scrollWidth = wrapper.scrollWidth;
            const clientWidth = wrapper.clientWidth;

            console.log({ scrollWidth, clientWidth, name: 'AdminPageHeader Overflow Check' });

            expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
        });
    },
};
