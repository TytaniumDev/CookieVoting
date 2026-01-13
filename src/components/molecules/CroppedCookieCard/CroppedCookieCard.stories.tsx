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

const mockBakers = [
    { id: '1', name: 'Ryan' },
    { id: '2', name: 'Kelly' },
    { id: '3', name: 'Mike' },
    { id: '4', name: 'Sarah' },
    { id: '5', name: 'Christopher Alexander' },
];

export const Untagged: Story = {
    args: {
        imageUrl: 'https://picsum.photos/seed/cookie1/200/200',
        assignedBakerId: undefined,
        bakers: mockBakers,
        onAssign: fn(),
        onRemove: fn(),
    },
};

export const Tagged: Story = {
    args: {
        imageUrl: 'https://picsum.photos/seed/cookie2/200/200',
        assignedBakerId: '1',
        bakers: mockBakers,
        onAssign: fn(),
        onRemove: fn(),
    },
};

export const LongBakerName: Story = {
    args: {
        imageUrl: 'https://picsum.photos/seed/cookie4/200/200',
        assignedBakerId: '5',
        bakers: mockBakers,
        onAssign: fn(),
        onRemove: fn(),
    },
};

export const ImageError: Story = {
    args: {
        imageUrl: 'https://invalid-url-that-will-fail.com/image.png',
        assignedBakerId: undefined,
        bakers: mockBakers,
        onAssign: fn(),
        onRemove: fn(),
    },
};

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
                    assignedBakerId="1"
                    bakers={mockBakers}
                    onAssign={fn()}
                    onRemove={fn()}
                />
                <CroppedCookieCard
                    imageUrl="https://picsum.photos/seed/c2/200"
                    assignedBakerId="2"
                    bakers={mockBakers}
                    onAssign={fn()}
                    onRemove={fn()}
                />
                <CroppedCookieCard
                    imageUrl="https://picsum.photos/seed/c3/200"
                    assignedBakerId={undefined}
                    bakers={mockBakers}
                    onAssign={fn()}
                    onRemove={fn()}
                />
                <CroppedCookieCard
                    imageUrl="https://picsum.photos/seed/c4/200"
                    assignedBakerId="3"
                    bakers={mockBakers}
                    onAssign={fn()}
                    onRemove={fn()}
                />
            </div>
        ),
    ],
    args: {
        imageUrl: 'https://picsum.photos/seed/c1/200/200',
        assignedBakerId: '1',
        bakers: mockBakers,
        onAssign: fn(),
        onRemove: fn(),
    },
};

export const HoverDemo: Story = {
    args: {
        imageUrl: 'https://picsum.photos/seed/cookie5/200/200',
        assignedBakerId: '4',
        bakers: mockBakers,
        onAssign: fn(),
        onRemove: fn(),
    },
    parameters: {
        pseudo: { hover: true },
    },
};
