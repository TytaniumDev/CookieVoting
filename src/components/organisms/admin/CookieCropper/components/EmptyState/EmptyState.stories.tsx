/**
 * EmptyState Storybook Stories
 */
import type { Meta, StoryObj } from 'storybook/internal/types';
import { fn } from 'storybook/test';
import { EmptyState } from './EmptyState';

const meta: Meta<typeof EmptyState> = {
    title: 'Admin/CookieCropper/EmptyState',
    component: EmptyState,
    parameters: {
        layout: 'centered',
        backgrounds: {
            default: 'dark',
        },
    },
    decorators: [
        (Story) => (
            <div style={{ width: '600px', height: '400px', background: '#1e1e2e' }}>
                <Story />
            </div>
        ),
    ],
    args: {
        onFileSelect: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

/**
 * Default drop zone state
 */
export const Default: Story = {};

/**
 * Uploading state
 */
export const Uploading: Story = {
    args: {
        isUploading: true,
    },
};
