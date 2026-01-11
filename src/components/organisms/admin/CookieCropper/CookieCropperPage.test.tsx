import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CookieCropperPage } from './CookieCropperPage';
import * as geminiDetection from '../../../../lib/cookieDetectionGemini';
import * as blobDetection from './blobDetection';
import type { FloatingPaletteProps } from './components/FloatingPalette/FloatingPalette';

// Mock dependencies
vi.mock('../../../../lib/cookieDetectionGemini');
vi.mock('./blobDetection');
vi.mock('../../../../lib/hooks/useMediaQuery', () => ({
    useMediaQuery: () => false // Desktop mode
}));

// Mock inner components to avoid complex rendering
vi.mock('./CookieCropper', () => ({
    CookieCropper: () => <div data-testid="cookie-cropper" />
}));
vi.mock('./components/FloatingPalette/FloatingPalette', () => ({
    FloatingPalette: ({ onAutoDetect, isDetecting }: Pick<FloatingPaletteProps, 'onAutoDetect' | 'isDetecting'>) => (
        <div data-testid="floating-palette">
            <button onClick={onAutoDetect} disabled={isDetecting}>
                Auto Detect
            </button>
        </div>
    )
}));

describe('CookieCropperPage Detection Integration', () => {
    const mockOnSave = vi.fn();
    const mockOnCancel = vi.fn();
    const mockImageUrl = 'https://example.com/test.jpg';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should try Gemini detection first when auto-detect is triggered', async () => {
        const mockDetectCookiesGemini = vi.spyOn(geminiDetection, 'detectCookiesGemini');
        mockDetectCookiesGemini.mockResolvedValue([
            { x: 50, y: 50, width: 10, height: 10, confidence: 0.9 }
        ]);

        render(
            <CookieCropperPage
                onSave={mockOnSave}
                onCancel={mockOnCancel}
                initialImageUrl={mockImageUrl}
            />
        );

        // Find and click auto detect
        const autoDetectBtn = screen.getByText('Auto Detect');
        fireEvent.click(autoDetectBtn);

        await waitFor(() => {
            expect(mockDetectCookiesGemini).toHaveBeenCalledWith(mockImageUrl);
        });
    });

    it('should fallback to blob detection if Gemini fails', async () => {
        const mockDetectCookiesGemini = vi.spyOn(geminiDetection, 'detectCookiesGemini');
        mockDetectCookiesGemini.mockRejectedValue(new Error('Gemini failed'));

        const mockDetectBlobs = vi.spyOn(blobDetection, 'detectBlobsFromImage');
        mockDetectBlobs.mockResolvedValue([
            { x: 10, y: 10, width: 100, height: 100 }
        ]);

        render(
            <CookieCropperPage
                onSave={mockOnSave}
                onCancel={mockOnCancel}
                initialImageUrl={mockImageUrl}
            />
        );

        // Trigger detection
        const autoDetectBtn = screen.getByText('Auto Detect');
        fireEvent.click(autoDetectBtn);

        // Should try Gemini first
        await waitFor(() => {
            expect(mockDetectCookiesGemini).toHaveBeenCalled();
        });

        // Then fallback to blobs (we need to wait for the catch block)
        await waitFor(() => {
            expect(mockDetectBlobs).toHaveBeenCalled();
        });
    });
});
