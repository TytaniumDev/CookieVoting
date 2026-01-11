/**
 * CookieCropperPage Storybook Stories
 */
import type { Meta, StoryObj } from 'storybook/internal/types';
import { fn } from 'storybook/test';
import { CookieCropperPage } from './CookieCropperPage';

const meta: Meta<typeof CookieCropperPage> = {
    title: 'Admin/CookieCropperPage',
    component: CookieCropperPage,
    parameters: {
        layout: 'fullscreen',
    },
    args: {
        onSave: fn(),
        onCancel: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof CookieCropperPage>;

/**
 * Empty state - shows the drop zone for uploading images
 */
export const Empty: Story = {};

/**
 * With an initial image pre-loaded
 */
export const WithImage: Story = {
    args: {
        initialImageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&h=600&fit=crop',
    },
};

/**
 * Mobile viewport simulation
 */
export const Mobile: Story = {
    parameters: {
        viewport: {
            defaultViewport: 'mobile1',
        },
    },
};

/**
 * Mobile with image loaded
 */
export const MobileWithImage: Story = {
    args: {
        initialImageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&h=600&fit=crop',
    },
    parameters: {
        viewport: {
            defaultViewport: 'mobile1',
        },
    },
};
