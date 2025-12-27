/**
 * EmptyState Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
    const mockOnFileSelect = vi.fn();

    const renderEmptyState = (props = {}) =>
        render(<EmptyState onFileSelect={mockOnFileSelect} {...props} />);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render drop zone', () => {
            renderEmptyState();

            expect(screen.getByRole('button', { name: /drop zone/i })).toBeInTheDocument();
        });

        it('should display upload instructions', () => {
            renderEmptyState();

            expect(screen.getByText(/drop cookie tray here/i)).toBeInTheDocument();
            expect(screen.getByText(/click to select a file/i)).toBeInTheDocument();
        });

        it('should show uploading state', () => {
            renderEmptyState({ isUploading: true });

            expect(screen.getByText(/uploading/i)).toBeInTheDocument();
        });
    });

    describe('File Selection', () => {
        it('should call onFileSelect when file is selected', async () => {
            const user = userEvent.setup();
            renderEmptyState();

            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
            const input = document.querySelector('input[type="file"]') as HTMLInputElement;

            await user.upload(input, file);

            expect(mockOnFileSelect).toHaveBeenCalledWith(file);
        });
    });

    describe('Drag and Drop', () => {
        it('should accept dropped image files', () => {
            renderEmptyState();

            const dropZone = screen.getByRole('button', { name: /drop zone/i });
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

            // Simulate drag over
            fireEvent.dragOver(dropZone);

            // Simulate drop
            fireEvent.drop(dropZone, {
                dataTransfer: {
                    files: [file],
                },
            });

            expect(mockOnFileSelect).toHaveBeenCalledWith(file);
        });

        it('should not accept non-image files', () => {
            renderEmptyState();

            const dropZone = screen.getByRole('button', { name: /drop zone/i });
            const file = new File(['test'], 'test.txt', { type: 'text/plain' });

            fireEvent.drop(dropZone, {
                dataTransfer: {
                    files: [file],
                },
            });

            expect(mockOnFileSelect).not.toHaveBeenCalled();
        });
    });
});
