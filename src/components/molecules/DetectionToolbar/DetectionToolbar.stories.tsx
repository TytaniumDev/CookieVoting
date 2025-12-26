import type { Meta, StoryObj } from '@storybook/react';
import { DetectionToolbar } from './DetectionToolbar';

const meta: Meta<typeof DetectionToolbar> = {
    title: 'Molecules/DetectionToolbar',
    component: DetectionToolbar,
    parameters: {
        layout: 'padded',
        backgrounds: {
            default: 'dark',
        },
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div style={{ maxWidth: '500px' }}>
                <Story />
            </div>
        ),
    ],
    argTypes: {
        onRegenerate: { action: 'regenerate clicked' },
        onToggleAddMode: { action: 'add mode toggled' },
    },
};

export default meta;
type Story = StoryObj<typeof DetectionToolbar>;

export const Default: Story = {
    args: {
        detectionCount: 5,
        isRegenerating: false,
        isAddMode: false,
    },
};

export const Regenerating: Story = {
    args: {
        detectionCount: 5,
        isRegenerating: true,
        isAddMode: false,
    },
};

export const AddModeActive: Story = {
    args: {
        detectionCount: 5,
        isRegenerating: false,
        isAddMode: true,
    },
};

export const NoDetections: Story = {
    args: {
        detectionCount: 0,
        isRegenerating: false,
        isAddMode: false,
    },
};

export const CustomHelperText: Story = {
    args: {
        detectionCount: 3,
        isRegenerating: false,
        isAddMode: false,
        helperText: 'Drag to reposition detections',
    },
};
