import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Mock the firestore module before importing the hook
vi.mock('../firestore', () => ({
    watchImageDetectionResults: vi.fn(),
}));

// Import after mocking
import { useCategoryDetectionCounts, useDetectionResults } from './useDetectionResults';
import { watchImageDetectionResults } from '../firestore';

describe('useDetectionResults', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('useDetectionResults', () => {
        it('should return null when imageUrl is undefined', () => {
            const { result } = renderHook(() => useDetectionResults(undefined));
            expect(result.current).toBeNull();
        });

        it('should subscribe to detection results when imageUrl is provided', () => {
            const mockUnsubscribe = vi.fn();
            (watchImageDetectionResults as Mock).mockReturnValue(mockUnsubscribe);

            renderHook(() => useDetectionResults('https://example.com/image.jpg'));

            expect(watchImageDetectionResults).toHaveBeenCalledWith(
                'https://example.com/image.jpg',
                expect.any(Function)
            );
        });

        it('should unsubscribe on unmount', () => {
            const mockUnsubscribe = vi.fn();
            (watchImageDetectionResults as Mock).mockReturnValue(mockUnsubscribe);

            const { unmount } = renderHook(() => useDetectionResults('https://example.com/image.jpg'));
            unmount();

            expect(mockUnsubscribe).toHaveBeenCalled();
        });
    });

    describe('useCategoryDetectionCounts', () => {
        it('should subscribe to each category imageUrl', () => {
            const mockUnsubscribe = vi.fn();
            (watchImageDetectionResults as Mock).mockReturnValue(mockUnsubscribe);

            const categories = [
                { id: 'cat1', imageUrl: 'https://example.com/1.jpg' },
                { id: 'cat2', imageUrl: 'https://example.com/2.jpg' },
            ];

            renderHook(() => useCategoryDetectionCounts(categories));

            expect(watchImageDetectionResults).toHaveBeenCalledTimes(2);
        });

        it('should cleanup all subscriptions on unmount', () => {
            const mockUnsubscribe = vi.fn();
            (watchImageDetectionResults as Mock).mockReturnValue(mockUnsubscribe);

            const categories = [
                { id: 'cat1', imageUrl: 'https://example.com/1.jpg' },
                { id: 'cat2', imageUrl: 'https://example.com/2.jpg' },
            ];

            const { unmount } = renderHook(() => useCategoryDetectionCounts(categories));
            unmount();

            expect(mockUnsubscribe).toHaveBeenCalledTimes(2);
        });

        it('should NOT re-subscribe when categories array reference changes but content is same', async () => {
            const mockUnsubscribe = vi.fn();
            (watchImageDetectionResults as Mock).mockReturnValue(mockUnsubscribe);

            // First render with categories array
            const categories1 = [
                { id: 'cat1', imageUrl: 'https://example.com/1.jpg' },
            ];
            const { rerender } = renderHook(
                ({ categories }) => useCategoryDetectionCounts(categories),
                { initialProps: { categories: categories1 } }
            );

            // Clear the mock to track new calls
            vi.clearAllMocks();

            // Re-render with a new array reference but same content
            const categories2 = [
                { id: 'cat1', imageUrl: 'https://example.com/1.jpg' },
            ];
            rerender({ categories: categories2 });

            // Should NOT have re-subscribed since content is the same
            await waitFor(() => {
                expect(watchImageDetectionResults).not.toHaveBeenCalled();
            });
        });

        it('should re-subscribe when category content actually changes', async () => {
            const mockUnsubscribe = vi.fn();
            (watchImageDetectionResults as Mock).mockReturnValue(mockUnsubscribe);

            const categories1 = [
                { id: 'cat1', imageUrl: 'https://example.com/1.jpg' },
            ];
            const { rerender } = renderHook(
                ({ categories }) => useCategoryDetectionCounts(categories),
                { initialProps: { categories: categories1 } }
            );

            vi.clearAllMocks();

            // Re-render with different content
            const categories2 = [
                { id: 'cat1', imageUrl: 'https://example.com/1.jpg' },
                { id: 'cat2', imageUrl: 'https://example.com/2.jpg' },
            ];
            rerender({ categories: categories2 });

            // Should have re-subscribed since content changed
            await waitFor(() => {
                expect(watchImageDetectionResults).toHaveBeenCalled();
            });
        });

        it('should update counts when detection results arrive', async () => {
            let capturedCallback: ((results: unknown[] | null) => void) | null = null;
            const mockUnsubscribe = vi.fn();
            (watchImageDetectionResults as Mock).mockImplementation((_url, callback) => {
                capturedCallback = callback;
                return mockUnsubscribe;
            });

            const categories = [
                { id: 'cat1', imageUrl: 'https://example.com/1.jpg' },
            ];

            const { result } = renderHook(() => useCategoryDetectionCounts(categories));

            // Initially counts should be empty
            expect(result.current.counts).toEqual({});

            // Simulate detection results arriving
            act(() => {
                capturedCallback?.([{ x: 0, y: 0, width: 10, height: 10, confidence: 0.9 }]);
            });

            await waitFor(() => {
                expect(result.current.counts).toEqual({ cat1: 1 });
            });
        });

        it('should reset counts when resetCounts is called', async () => {
            let capturedCallback: ((results: unknown[] | null) => void) | null = null;
            const mockUnsubscribe = vi.fn();
            (watchImageDetectionResults as Mock).mockImplementation((_url, callback) => {
                capturedCallback = callback;
                return mockUnsubscribe;
            });

            const categories = [{ id: 'cat1', imageUrl: 'https://example.com/1.jpg' }];
            const { result } = renderHook(() => useCategoryDetectionCounts(categories));

            // Add some counts
            act(() => {
                capturedCallback?.([{ x: 0, y: 0, width: 10, height: 10, confidence: 0.9 }]);
            });

            await waitFor(() => {
                expect(result.current.counts).toEqual({ cat1: 1 });
            });

            // Reset counts
            act(() => {
                result.current.resetCounts();
            });

            expect(result.current.counts).toEqual({});
        });
    });
});
