import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { CroppedCookieCard } from './CroppedCookieCard';

const meta: Meta<typeof CroppedCookieCard> = {
    title: 'Molecules/CroppedCookieCard',
    component: CroppedCookieCard,
    parameters: {
        layout: 'centered',
        backgrounds: { default: 'dark' },
    },
    tags: ['autodocs'],
    argTypes: {
        bakerName: {
            control: 'text',
            description: 'Name of assigned baker, or undefined if untagged',
        },
        isSelected: {
            control: 'boolean',
            description: 'Whether this card is currently selected',
        },
    },
    args: {
        onClick: fn(),
    },
    decorators: [
        (Story) => (
            <div style={{ width: '150px' }}>
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof CroppedCookieCard>;

/** Default untagged cookie card */
export const Untagged: Story = {
    args: {
        imageUrl: 'https://picsum.photos/seed/cookie1/200/200',
        bakerName: undefined,
        isSelected: false,
    },
};

/** Cookie card with baker assigned */
export const Tagged: Story = {
    args: {
        imageUrl: 'https://picsum.photos/seed/cookie2/200/200',
        bakerName: 'Ryan',
        isSelected: false,
    },
};

/** Selected state (dropdown open) */
export const Selected: Story = {
    args: {
        imageUrl: 'https://picsum.photos/seed/cookie3/200/200',
        bakerName: undefined,
        isSelected: true,
    },
};

/** Long baker name handling */
export const LongBakerName: Story = {
    args: {
        imageUrl: 'https://picsum.photos/seed/cookie4/200/200',
        bakerName: 'Christopher Alexander',
        isSelected: false,
    },
};

/** Image load error state */
export const ImageError: Story = {
    args: {
        imageUrl: 'https://invalid-url-that-will-fail.com/image.png',
        bakerName: undefined,
        isSelected: false,
    },
};

/** Multiple cards in a row (grid context) */
export const GridContext: Story = {
    decorators: [
        () => (
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 150px)',
                gap: '1rem',
                padding: '1rem',
            }}>
                <CroppedCookieCard
                    imageUrl="https://picsum.photos/seed/c1/200"
                    bakerName="Ryan"
                    onClick={() => { }}
                />
                <CroppedCookieCard
                    imageUrl="https://picsum.photos/seed/c2/200"
                    bakerName="Kelly"
                    onClick={() => { }}
                />
                <CroppedCookieCard
                    imageUrl="https://picsum.photos/seed/c3/200"
                    bakerName={undefined}
                    onClick={() => { }}
                />
                <CroppedCookieCard
                    imageUrl="https://picsum.photos/seed/c4/200"
                    bakerName="Mike"
                    onClick={() => { }}
                />
            </div>
        ),
    ],
    args: {
        imageUrl: 'https://picsum.photos/seed/c1/200/200',
        bakerName: 'Ryan',
        isSelected: false,
    },
};

/** Hover state demonstration */
export const HoverDemo: Story = {
    args: {
        imageUrl: 'https://picsum.photos/seed/cookie5/200/200',
        bakerName: 'Sarah',
        isSelected: false,
    },
    parameters: {
        pseudo: { hover: true },
    },
};
