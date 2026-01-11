/**
 * FloatingPalette Storybook Stories
 */
import type { Meta, StoryObj } from 'storybook/internal/types';
import { fn } from 'storybook/test';
import { FloatingPalette } from './FloatingPalette';

const meta: Meta<typeof FloatingPalette> = {
    title: 'Admin/CookieCropper/FloatingPalette',
    component: FloatingPalette,
    parameters: {
        layout: 'centered',
        backgrounds: {
            default: 'dark',
        },
    },
    decorators: [
        (Story) => (
            <div style={{ width: '600px', height: '400px', position: 'relative', background: '#1e1e2e' }}>
                <Story />
            </div>
        ),
    ],
    args: {
        config: { rows: 2, cols: 3, padding: 0 },
        onChange: fn(),
        onApply: fn(),
        onAutoDetect: fn(),
        onSave: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof FloatingPalette>;

/**
 * Default state with grid controls visible
 */
export const Default: Story = {};

/**
 * With custom grid configuration
 */
export const CustomConfig: Story = {
    args: {
        config: { rows: 4, cols: 4, padding: 5 },
    },
};

/**
 * Detecting state - Auto Detect button is disabled
 */
export const Detecting: Story = {
    args: {
        isDetecting: true,
    },
};

/**
 * Saving state - Save button is disabled
 */
export const Saving: Story = {
    args: {
        isSaving: true,
    },
};
