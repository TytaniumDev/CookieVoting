import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CookieCropper } from './CookieCropper';
import type { SliceRegion } from './cropUtils';

// Mock react-rnd
vi.mock('react-rnd', () => ({
    Rnd: ({ children, position, size, ...props }: any) => (
        <div
            data-testid={props['data-testid'] || 'rnd-box'}
            style={{
                position: 'absolute',
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height,
            }}
            onClick={props.onClick}
        >
            {children}
        </div>
    ),
}));

describe('CookieCropper Interactions', () => {
    const mockImageUrl = 'https://example.com/cookie-tray.jpg';
    
    const mockGetBoundingClientRect = vi.fn(() => ({
        width: 800,
        height: 600,
        top: 0,
        left: 0,
        bottom: 600,
        right: 800,
        x: 0,
        y: 0,
        toJSON: () => {},
    }));

    beforeEach(() => {
        vi.clearAllMocks();
        Element.prototype.getBoundingClientRect = mockGetBoundingClientRect;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const triggerImageLoad = async () => {
        const img = screen.getByRole('img');
        Object.defineProperty(img, 'naturalWidth', { value: 800, configurable: true });
        Object.defineProperty(img, 'naturalHeight', { value: 600, configurable: true });
        await act(async () => {
            img.dispatchEvent(new Event('load'));
        });
    };

    it('should allow drag-to-create a new crop box', async () => {
        const mockOnRegionsChange = vi.fn();
        const user = userEvent.setup();

        render(
            <CookieCropper
                imageUrl={mockImageUrl}
                regions={[]}
                onRegionsChange={mockOnRegionsChange}
            />
        );

        await triggerImageLoad();

        const container = screen.getByTestId('cropper-container');

        // Drag on the container
        await fireEvent.mouseDown(container, { clientX: 100, clientY: 100 });
        await fireEvent.mouseMove(container, { clientX: 200, clientY: 200 });
        await fireEvent.mouseUp(container);

        // Should call onChange with new region
        expect(mockOnRegionsChange).toHaveBeenCalledTimes(1);
        const newRegions = mockOnRegionsChange.mock.calls[0][0];
        expect(newRegions).toHaveLength(1);
        expect(newRegions[0]).toEqual(expect.objectContaining({
            x: 100,
            y: 100,
            width: 100, // 200 - 100
            height: 100 // 200 - 100
        }));
    });

    it('should delete selected box when Delete key is pressed', async () => {
        const mockOnRegionsChange = vi.fn();
        const initialRegions: SliceRegion[] = [
            { x: 100, y: 100, width: 100, height: 100 }
        ];

        render(
            <CookieCropper
                imageUrl={mockImageUrl}
                regions={initialRegions}
                onRegionsChange={mockOnRegionsChange}
            />
        );

        await triggerImageLoad();

        // Click the box to select it (mocking Rnd click handling if needed, or container logic)
        // Note: We need to implement selection logic first.
        // For now, let's assume clicking the box selects it.
        const box = screen.getByTestId('crop-box-0');
        await fireEvent.click(box);

        // Press Delete key
        await fireEvent.keyDown(document, { key: 'Delete' });

        expect(mockOnRegionsChange).toHaveBeenCalledWith([]);
    });

    it('should delete selected box when Backspace key is pressed', async () => {
        const mockOnRegionsChange = vi.fn();
        const initialRegions: SliceRegion[] = [
            { x: 100, y: 100, width: 100, height: 100 }
        ];

        render(
            <CookieCropper
                imageUrl={mockImageUrl}
                regions={initialRegions}
                onRegionsChange={mockOnRegionsChange}
            />
        );

        await triggerImageLoad();

        const box = screen.getByTestId('crop-box-0');
        await fireEvent.click(box);

        await fireEvent.keyDown(document, { key: 'Backspace' });

        expect(mockOnRegionsChange).toHaveBeenCalledWith([]);
    });
});
