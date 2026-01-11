import type { Meta, StoryObj } from '@storybook/react';
import { CroppedCookieTaggingGrid } from './CroppedCookieTaggingGrid';

/**
 * CroppedCookieTaggingGrid displays a grid of cropped cookie images
 * allowing admins to assign bakers to each individual cookie.
 * 
 * Features:
 * - Responsive grid layout
 * - Progress tracking (X of Y tagged)
 * - Filter by All/Tagged/Untagged
 * - Click cookie to open baker dropdown
 */
const meta: Meta<typeof CroppedCookieTaggingGrid> = {
    title: 'Organisms/Admin/CroppedCookieTaggingGrid',
    component: CroppedCookieTaggingGrid,
    parameters: {
        layout: 'padded',
        backgrounds: { default: 'dark' },
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div style={{
                height: '600px',
                background: 'var(--surface, #0f0f1a)',
                borderRadius: '12px',
                overflow: 'hidden',
            }}>
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof CroppedCookieTaggingGrid>;

/**
 * Default state - requires actual store data.
 * In real usage, fetches cropped cookies from Firestore.
 */
export const Default: Story = {
    args: {
        eventId: 'test-event',
        categoryId: 'cat-1',
        categoryName: 'Sugar Cookies',
    },
};

/**
 * For testing with mock data, see the integration tests
 * or use the component with actual Firestore data in dev mode.
 */
export const WithEventId: Story = {
    args: {
        eventId: 'a89e85e7-dfe5-4585-b734-6df2a272204a',
        categoryId: 'test-category',
        categoryName: 'Christmas Stockings',
    },
};
