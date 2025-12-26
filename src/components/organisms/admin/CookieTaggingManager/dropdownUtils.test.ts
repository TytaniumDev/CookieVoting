import { describe, it, expect } from 'vitest';
import { calculateAdjustedPosition } from './dropdownUtils';

describe('calculateAdjustedPosition', () => {
    const DROPDOWN_WIDTH = 200;
    const DROPDOWN_HEIGHT = 300;
    const WINDOW_WIDTH = 1000;
    const WINDOW_HEIGHT = 800;
    const PADDING = 10;

    it('returns original coordinates when there is no overflow', () => {
        // Middle of screen
        const result = calculateAdjustedPosition(
            100,
            100,
            DROPDOWN_WIDTH,
            DROPDOWN_HEIGHT,
            WINDOW_WIDTH,
            WINDOW_HEIGHT,
            PADDING
        );
        expect(result).toEqual({ x: 100, y: 100 });
    });

    it('adjusts X when overflowing right edge', () => {
        // Click near right edge
        const clickX = WINDOW_WIDTH - 50; // 950
        const result = calculateAdjustedPosition(
            clickX,
            100,
            DROPDOWN_WIDTH,
            DROPDOWN_HEIGHT,
            WINDOW_WIDTH,
            WINDOW_HEIGHT,
            PADDING
        );

        // Should be shifted to: Window - Width - Padding = 1000 - 200 - 10 = 790
        expect(result.x).toBe(WINDOW_WIDTH - DROPDOWN_WIDTH - PADDING);
        expect(result.y).toBe(100);
    });

    it('adjusts Y when overflowing bottom edge', () => {
        // Click near bottom edge
        const clickY = WINDOW_HEIGHT - 50; // 750
        const result = calculateAdjustedPosition(
            100,
            clickY,
            DROPDOWN_WIDTH,
            DROPDOWN_HEIGHT,
            WINDOW_WIDTH,
            WINDOW_HEIGHT,
            PADDING
        );

        // Should be shifted to: Window - Height - Padding = 800 - 300 - 10 = 490
        expect(result.x).toBe(100);
        expect(result.y).toBe(WINDOW_HEIGHT - DROPDOWN_HEIGHT - PADDING);
    });

    it('adjusts both X and Y when in bottom-right corner', () => {
        const result = calculateAdjustedPosition(
            WINDOW_WIDTH - 20,
            WINDOW_HEIGHT - 20,
            DROPDOWN_WIDTH,
            DROPDOWN_HEIGHT,
            WINDOW_WIDTH,
            WINDOW_HEIGHT,
            PADDING
        );

        expect(result.x).toBe(WINDOW_WIDTH - DROPDOWN_WIDTH - PADDING);
        expect(result.y).toBe(WINDOW_HEIGHT - DROPDOWN_HEIGHT - PADDING);
    });

    it('considers padding for top-left constraints', () => {
        // Suppose we managed to pass negative coordinates or close to 0
        const result = calculateAdjustedPosition(
            5,
            5,
            DROPDOWN_WIDTH,
            DROPDOWN_HEIGHT,
            WINDOW_WIDTH,
            WINDOW_HEIGHT,
            PADDING
        );

        // Should be clamped to padding (10)
        expect(result.x).toBe(PADDING);
        expect(result.y).toBe(PADDING);
    });

    it('prioritizes top-left visibility on small screens', () => {
        // Screen smaller than dropdown
        const SMALL_WINDOW_W = 150;
        const SMALL_WINDOW_H = 200;

        const result = calculateAdjustedPosition(
            50,
            50,
            DROPDOWN_WIDTH,
            DROPDOWN_HEIGHT,
            SMALL_WINDOW_W,
            SMALL_WINDOW_H,
            PADDING
        );

        // Should start at padding (top-left) even if it overflows right/bottom
        expect(result.x).toBe(PADDING);
        expect(result.y).toBe(PADDING);
    });
});
