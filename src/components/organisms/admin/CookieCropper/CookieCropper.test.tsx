/**
 * CookieCropper Component Tests
 *
 * Integration tests for the CookieCropper UI component.
 * Tests the visual canvas in controlled mode.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CookieCropper } from './CookieCropper';
import type { SliceRegion } from './cropUtils';

// Mock react-rnd since it requires DOM measurements
vi.mock('react-rnd', () => ({
    Rnd: ({ children, position, size, ...props }: {
        children: React.ReactNode;
        onDragStop?: (e: unknown, d: { x: number; y: number }) => void;
        onResizeStop?: (e: unknown, direction: unknown, ref: unknown, delta: unknown, position: { x: number; y: number }) => void;
        position: { x: number; y: number };
        size: { width: number; height: number };
        'data-testid'?: string;
    }) => (
        <div
            data-testid={props['data-testid'] || 'rnd-box'}
            style={{
                position: 'absolute',
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height,
            }}
        >
            {children}
        </div>
    ),
}));

describe('CookieCropper', () => {
    const mockImageUrl = 'https://example.com/cookie-tray.jpg';

    // Mock getBoundingClientRect to return non-zero dimensions
    const mockGetBoundingClientRect = vi.fn(() => ({
        width: 400,
        height: 300,
        top: 0,
        left: 0,
        bottom: 300,
        right: 400,
        x: 0,
        y: 0,
        toJSON: () => { },
    }));

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock getBoundingClientRect for container dimensions
        Element.prototype.getBoundingClientRect = mockGetBoundingClientRect;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // Helper to trigger image load
    const triggerImageLoad = async () => {
        const img = screen.getByRole('img');
        // Mock natural dimensions
        Object.defineProperty(img, 'naturalWidth', { value: 800, configurable: true });
        Object.defineProperty(img, 'naturalHeight', { value: 600, configurable: true });
        await act(async () => {
            img.dispatchEvent(new Event('load'));
        });
    };

    describe('Rendering', () => {
        it('should render the image', () => {
            render(
                <CookieCropper
                    imageUrl={mockImageUrl}
                />
            );

            const image = screen.getByRole('img');
            expect(image).toBeInTheDocument();
            expect(image).toHaveAttribute('src', mockImageUrl);
        });

        it('should render with no regions by default', () => {
            render(
                <CookieCropper
                    imageUrl={mockImageUrl}
                />
            );

            // No crop boxes should be present
            expect(screen.queryByTestId('crop-box-0')).not.toBeInTheDocument();
        });
    });

    describe('Controlled Mode', () => {
        it('should render regions passed as props', async () => {
            const regions: SliceRegion[] = [
                { x: 0, y: 0, width: 100, height: 100 },
                { x: 100, y: 0, width: 100, height: 100 },
            ];

            render(
                <CookieCropper
                    imageUrl={mockImageUrl}
                    regions={regions}
                />
            );

            await triggerImageLoad();

            // Should have 2 crop boxes
            expect(screen.getByTestId('crop-box-0')).toBeInTheDocument();
            expect(screen.getByTestId('crop-box-1')).toBeInTheDocument();
        });

        it('should update when regions prop changes', async () => {
            const { rerender } = render(
                <CookieCropper
                    imageUrl={mockImageUrl}
                    regions={[{ x: 0, y: 0, width: 100, height: 100 }]}
                />
            );

            await triggerImageLoad();

            expect(screen.getByTestId('crop-box-0')).toBeInTheDocument();
            expect(screen.queryByTestId('crop-box-1')).not.toBeInTheDocument();

            // Update regions
            rerender(
                <CookieCropper
                    imageUrl={mockImageUrl}
                    regions={[
                        { x: 0, y: 0, width: 100, height: 100 },
                        { x: 100, y: 0, width: 100, height: 100 },
                        { x: 200, y: 0, width: 100, height: 100 },
                    ]}
                />
            );

            expect(screen.getByTestId('crop-box-0')).toBeInTheDocument();
            expect(screen.getByTestId('crop-box-1')).toBeInTheDocument();
            expect(screen.getByTestId('crop-box-2')).toBeInTheDocument();
        });

        it('should call onRegionsChange when region is deleted', async () => {
            const user = userEvent.setup();
            const mockOnRegionsChange = vi.fn();
            const regions: SliceRegion[] = [
                { x: 0, y: 0, width: 100, height: 100 },
            ];

            render(
                <CookieCropper
                    imageUrl={mockImageUrl}
                    regions={regions}
                    onRegionsChange={mockOnRegionsChange}
                />
            );

            await triggerImageLoad();

            // Click delete button
            const deleteButton = screen.getByRole('button', { name: /delete region/i });
            await user.click(deleteButton);

            expect(mockOnRegionsChange).toHaveBeenCalledWith([]);
        });
    });

    describe('Crop Box Display', () => {
        it('should display region index numbers', async () => {
            render(
                <CookieCropper
                    imageUrl={mockImageUrl}
                    regions={[
                        { x: 0, y: 0, width: 100, height: 100 },
                        { x: 100, y: 0, width: 100, height: 100 },
                    ]}
                />
            );

            await triggerImageLoad();

            expect(screen.getByText('1')).toBeInTheDocument();
            expect(screen.getByText('2')).toBeInTheDocument();
        });

        it('should have delete button for each region', async () => {
            render(
                <CookieCropper
                    imageUrl={mockImageUrl}
                    regions={[
                        { x: 0, y: 0, width: 100, height: 100 },
                        { x: 100, y: 0, width: 100, height: 100 },
                    ]}
                />
            );

            await triggerImageLoad();

            const deleteButtons = screen.getAllByRole('button', { name: /delete region/i });
            expect(deleteButtons).toHaveLength(2);
        });
    });
});
