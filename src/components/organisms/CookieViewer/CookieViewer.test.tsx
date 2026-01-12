import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// vi.mock must use inline factory functions to avoid hoisting issues
vi.mock('react-zoom-pan-pinch', () => ({
    TransformWrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement('div', { 'data-testid': 'transform-wrapper' }, children),
    TransformComponent: ({ children }: { children: React.ReactNode }) =>
        React.createElement('div', { 'data-testid': 'transform-component' }, children),
}));

// Import after mocks are set up
import { CookieViewer, type DetectedCookie } from './CookieViewer';

describe('CookieViewer', () => {
    const mockDetections: DetectedCookie[] = [
        { x: 25, y: 25, width: 10, height: 10, confidence: 0.95 },
        { x: 75, y: 75, width: 10, height: 10, confidence: 0.90 },
    ];

    const defaultProps = {
        imageUrl: 'https://example.com/cookie-image.jpg',
        detectedCookies: mockDetections,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Image Display', () => {
        it('renders the image with correct source', () => {
            render(React.createElement(CookieViewer, defaultProps));

            const image = screen.getByAltText('Cookie detection');
            expect(image).toBeInTheDocument();
            expect(image).toHaveAttribute('src', defaultProps.imageUrl);
        });

        it('applies image class for proper styling', () => {
            render(React.createElement(CookieViewer, defaultProps));

            const image = screen.getByAltText('Cookie detection');
            // Component now uses Tailwind classes, check for key styling classes
            expect(image.className).toContain('object-contain');
            expect(image.className).toContain('block');
        });

        it('ensures image is never cropped with object-fit: contain', () => {
            render(React.createElement(CookieViewer, defaultProps));

            const image = screen.getByAltText('Cookie detection');
            // Verify the image has styles that prevent cropping
            expect(image).toHaveStyle({ objectFit: 'contain' });
            expect(image).toHaveStyle({ maxWidth: '100%' });
            expect(image).toHaveStyle({ maxHeight: '100%' });
        });
    });

    describe('Detection Zone Positioning', () => {
        it('creates overlay container after image loads', async () => {
            const { container } = render(React.createElement(CookieViewer, defaultProps));

            const image = screen.getByAltText('Cookie detection') as HTMLImageElement;

            // Mock image dimensions
            Object.defineProperty(image, 'offsetWidth', { value: 400, configurable: true });
            Object.defineProperty(image, 'offsetHeight', { value: 300, configurable: true });
            Object.defineProperty(image, 'naturalWidth', { value: 400, configurable: true });
            Object.defineProperty(image, 'naturalHeight', { value: 300, configurable: true });
            Object.defineProperty(image, 'clientWidth', { value: 400, configurable: true });
            Object.defineProperty(image, 'clientHeight', { value: 300, configurable: true });
            Object.defineProperty(image, 'naturalWidth', { value: 400, configurable: true });
            Object.defineProperty(image, 'naturalHeight', { value: 300, configurable: true });
            Object.defineProperty(image, 'clientWidth', { value: 400, configurable: true });
            Object.defineProperty(image, 'clientHeight', { value: 300, configurable: true });

            fireEvent.load(image);

            await waitFor(() => {
                const overlayContainer = container.querySelector('[data-testid="overlay-container"]');
                expect(overlayContainer).toBeInTheDocument();
            });
        });

        it('sizes overlay container to match image dimensions when width-constrained', async () => {
            const { container } = render(React.createElement(CookieViewer, defaultProps));

            const image = screen.getByAltText('Cookie detection') as HTMLImageElement;

            // Simulate a wide container where image is constrained by width
            Object.defineProperty(image, 'offsetWidth', { value: 400, configurable: true });
            Object.defineProperty(image, 'offsetHeight', { value: 200, configurable: true });
            Object.defineProperty(image, 'naturalWidth', { value: 400, configurable: true });
            Object.defineProperty(image, 'naturalHeight', { value: 200, configurable: true });
            Object.defineProperty(image, 'clientWidth', { value: 400, configurable: true });
            Object.defineProperty(image, 'clientHeight', { value: 200, configurable: true });

            fireEvent.load(image);

            await waitFor(() => {
                const overlayContainer = container.querySelector('[data-testid="overlay-container"]');
                expect(overlayContainer).toBeInTheDocument();
                expect(overlayContainer).toHaveStyle({ width: '400px', height: '200px' });
            });
        });

        it('sizes overlay container to match image dimensions when height-constrained', async () => {
            const { container } = render(React.createElement(CookieViewer, defaultProps));

            const image = screen.getByAltText('Cookie detection') as HTMLImageElement;

            // Simulate a tall container where image is constrained by height
            Object.defineProperty(image, 'offsetWidth', { value: 200, configurable: true });
            Object.defineProperty(image, 'offsetHeight', { value: 400, configurable: true });
            Object.defineProperty(image, 'naturalWidth', { value: 200, configurable: true });
            Object.defineProperty(image, 'naturalHeight', { value: 400, configurable: true });
            Object.defineProperty(image, 'clientWidth', { value: 200, configurable: true });
            Object.defineProperty(image, 'clientHeight', { value: 400, configurable: true });

            fireEvent.load(image);

            await waitFor(() => {
                const overlayContainer = container.querySelector('[data-testid="overlay-container"]');
                expect(overlayContainer).toBeInTheDocument();
                expect(overlayContainer).toHaveStyle({ width: '200px', height: '400px' });
            });
        });

        it('renders detection zones inside the overlay container', async () => {
            const { container } = render(React.createElement(CookieViewer, defaultProps));

            const image = screen.getByAltText('Cookie detection') as HTMLImageElement;

            Object.defineProperty(image, 'offsetWidth', { value: 400, configurable: true });
            Object.defineProperty(image, 'offsetHeight', { value: 300, configurable: true });
            Object.defineProperty(image, 'naturalWidth', { value: 400, configurable: true });
            Object.defineProperty(image, 'naturalHeight', { value: 300, configurable: true });
            Object.defineProperty(image, 'clientWidth', { value: 400, configurable: true });
            Object.defineProperty(image, 'clientHeight', { value: 300, configurable: true });

            fireEvent.load(image);

            await waitFor(() => {
                const overlayContainer = container.querySelector('[data-testid="overlay-container"]');
                expect(overlayContainer).toBeInTheDocument();

                // Should have detection zones as children
                const buttons = overlayContainer?.querySelectorAll('[role="button"]');
                expect(buttons?.length).toBe(mockDetections.length);
            });
        });

        it('positions detection zones using percentage-based coordinates', async () => {
            const { container } = render(React.createElement(CookieViewer, defaultProps));

            const image = screen.getByAltText('Cookie detection') as HTMLImageElement;

            Object.defineProperty(image, 'offsetWidth', { value: 400, configurable: true });
            Object.defineProperty(image, 'offsetHeight', { value: 300, configurable: true });
            Object.defineProperty(image, 'naturalWidth', { value: 400, configurable: true });
            Object.defineProperty(image, 'naturalHeight', { value: 300, configurable: true });
            Object.defineProperty(image, 'clientWidth', { value: 400, configurable: true });
            Object.defineProperty(image, 'clientHeight', { value: 300, configurable: true });

            fireEvent.load(image);

            await waitFor(() => {
                const overlayContainer = container.querySelector('[data-testid="overlay-container"]');
                expect(overlayContainer).toBeInTheDocument();
            });

            // Bounding boxes use percentage-based positions
            // First detection at x:25, y:25 with width:10, height:10
            // left = 25 - 10/2 = 20%, top = 25 - 10/2 = 20%
            const boundingBoxes = container.querySelectorAll('[role="button"]');
            expect(boundingBoxes.length).toBeGreaterThan(0);

            const firstBox = boundingBoxes[0];
            expect(firstBox).toHaveStyle({ left: '20%', top: '20%' });
        });
    });

    describe('Resize Handling', () => {
        it('updates overlay dimensions when window resizes', async () => {
            const { container } = render(React.createElement(CookieViewer, defaultProps));

            const image = screen.getByAltText('Cookie detection') as HTMLImageElement;

            // Initial dimensions
            Object.defineProperty(image, 'offsetWidth', { value: 400, configurable: true });
            Object.defineProperty(image, 'offsetHeight', { value: 300, configurable: true });
            Object.defineProperty(image, 'naturalWidth', { value: 400, configurable: true });
            Object.defineProperty(image, 'naturalHeight', { value: 300, configurable: true });
            Object.defineProperty(image, 'clientWidth', { value: 400, configurable: true });
            Object.defineProperty(image, 'clientHeight', { value: 300, configurable: true });

            fireEvent.load(image);

            await waitFor(() => {
                const overlayContainer = container.querySelector('[data-testid="overlay-container"]');
                expect(overlayContainer).toHaveStyle({ width: '400px', height: '300px' });
            });

            // Simulate resize - update dimensions
            Object.defineProperty(image, 'offsetWidth', { value: 200, configurable: true });
            Object.defineProperty(image, 'offsetHeight', { value: 150, configurable: true });
            Object.defineProperty(image, 'naturalWidth', { value: 200, configurable: true });
            Object.defineProperty(image, 'naturalHeight', { value: 150, configurable: true });
            Object.defineProperty(image, 'clientWidth', { value: 200, configurable: true });
            Object.defineProperty(image, 'clientHeight', { value: 150, configurable: true });

            fireEvent(window, new Event('resize'));

            await waitFor(() => {
                const overlayContainer = container.querySelector('[data-testid="overlay-container"]');
                expect(overlayContainer).toHaveStyle({ width: '200px', height: '150px' });
            });
        });
    });
});
