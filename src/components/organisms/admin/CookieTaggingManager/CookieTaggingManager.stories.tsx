import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CookieTaggingManager } from './CookieTaggingManager';
import { useImageStore } from '../../../../lib/stores/useImageStore';
import { useBakerStore } from '../../../../lib/stores/useBakerStore';

const meta: Meta<typeof CookieTaggingManager> = {
    title: 'Organisms/Admin/CookieTaggingManager',
    component: CookieTaggingManager,
    parameters: {
        layout: 'padded',
        backgrounds: {
            default: 'dark',
        },
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div style={{ height: '600px', width: '800px', padding: '1rem', position: 'relative' }}>
                <Story />
            </div>
        ),
    ],
};


export default meta;
type Story = StoryObj<typeof CookieTaggingManager>;

export const Default: Story = {
    args: {
        eventId: 'test-event-123',
        categoryId: 'cat-1',
        imageUrl: 'https://picsum.photos/seed/cookies/800/600',
        categoryName: 'Sugar Cookies',
    },
};

export const WithCategoryName: Story = {
    args: {
        eventId: 'test-event-123',
        categoryId: 'cat-2',
        imageUrl: 'https://picsum.photos/seed/chocolatechip/800/600',
        categoryName: 'Chocolate Chip Cookies',
    },
};

export const EdgePositioning: Story = {
    args: {
        eventId: 'test-event-edge',
        categoryId: 'cat-edge',
        imageUrl: 'https://example.com/edge-test-image.jpg',
        categoryName: 'Edge Case Cookies',
    },
    decorators: [
        (Story) => {
            // Seed stores with mock data for this story
            useEffect(() => {
                const imageStore = useImageStore.getState();
                const bakerStore = useBakerStore.getState();

                // Add mock image with detections at edges
                // 800x600 container
                const mockDetections = [
                    { x: 50, y: 50, width: 50, height: 50, confidence: 0.9 }, // Top-Left
                    { x: 750, y: 50, width: 50, height: 50, confidence: 0.9 }, // Top-Right
                    { x: 50, y: 550, width: 50, height: 50, confidence: 0.9 }, // Bottom-Left
                    { x: 750, y: 550, width: 50, height: 50, confidence: 0.9 }, // Bottom-Right
                    { x: 400, y: 300, width: 50, height: 50, confidence: 0.9 }, // Center
                ];

                imageStore.images = {
                    ...imageStore.images,
                    'edge-image-1': {
                        id: 'edge-image-1',
                        url: 'https://example.com/edge-test-image.jpg',
                        storagePath: 'mock/path',
                        eventId: 'test-event-edge',
                        createdAt: Date.now(),
                        detectedCookies: mockDetections,
                    },
                };

                // Mock bakers
                bakerStore.bakers = [
                    { id: 'baker-1', name: 'Alice' },
                    { id: 'baker-2', name: 'Bob' },
                ];

                // Force re-render via state update if needed, but direct mutation works for zustand if not inside set
                // Actually easier to just use setState
                useImageStore.setState(imageStore);
                useBakerStore.setState(bakerStore);

            }, []);

            return <Story />;
        },
    ],
};
