/**
 * FloatingPalette Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FloatingPalette, type GridConfig } from './FloatingPalette';

describe('FloatingPalette', () => {
    const defaultConfig: GridConfig = { rows: 2, cols: 3, padding: 0 };
    const mockOnChange = vi.fn();
    const mockOnApply = vi.fn();
    const mockOnAutoDetect = vi.fn();
    const mockOnSave = vi.fn();

    const renderPalette = (props = {}) =>
        render(
            <FloatingPalette
                config={defaultConfig}
                onChange={mockOnChange}
                onApply={mockOnApply}
                onAutoDetect={mockOnAutoDetect}
                onSave={mockOnSave}
                {...props}
            />
        );

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render grid controls', () => {
            renderPalette();

            expect(screen.getByLabelText('Rows')).toBeInTheDocument();
            expect(screen.getByLabelText('Columns')).toBeInTheDocument();
            expect(screen.getByLabelText('Padding %')).toBeInTheDocument();
        });

        it('should render action buttons', () => {
            renderPalette();

            expect(screen.getByRole('button', { name: /apply grid/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /auto detect/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /save cookies/i })).toBeInTheDocument();
        });

        it('should display current config values', () => {
            renderPalette({ config: { rows: 4, cols: 5, padding: 10 } });

            expect(screen.getByLabelText('Rows')).toHaveValue(4);
            expect(screen.getByLabelText('Columns')).toHaveValue(5);
            expect(screen.getByLabelText('Padding %')).toHaveValue(10);
        });
    });

    describe('Interactions', () => {
        it('should call onChange when rows input changes', async () => {
            const user = userEvent.setup();
            renderPalette();

            const rowsInput = screen.getByLabelText('Rows');
            await user.clear(rowsInput);
            await user.type(rowsInput, '5');

            expect(mockOnChange).toHaveBeenCalled();
        });

        it('should call onApply when Apply Grid is clicked', async () => {
            const user = userEvent.setup();
            renderPalette();

            await user.click(screen.getByRole('button', { name: /apply grid/i }));

            expect(mockOnApply).toHaveBeenCalledTimes(1);
        });

        it('should call onAutoDetect when Auto Detect is clicked', async () => {
            const user = userEvent.setup();
            renderPalette();

            await user.click(screen.getByRole('button', { name: /auto detect/i }));

            expect(mockOnAutoDetect).toHaveBeenCalledTimes(1);
        });

        it('should call onSave when Save Cookies is clicked', async () => {
            const user = userEvent.setup();
            renderPalette();

            await user.click(screen.getByRole('button', { name: /save cookies/i }));

            expect(mockOnSave).toHaveBeenCalledTimes(1);
        });
    });

    describe('Loading States', () => {
        it('should disable Auto Detect when detecting', () => {
            renderPalette({ isDetecting: true });

            expect(screen.getByRole('button', { name: /detecting/i })).toBeDisabled();
        });

        it('should disable Save when saving', () => {
            renderPalette({ isSaving: true });

            expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
        });
    });

    describe('Minimize Behavior', () => {
        it('should minimize to FAB when minimize button is clicked', async () => {
            const user = userEvent.setup();
            renderPalette();

            await user.click(screen.getByRole('button', { name: /minimize palette/i }));

            // Should now show FAB instead of palette
            expect(screen.getByRole('button', { name: /open grid controls/i })).toBeInTheDocument();
            expect(screen.queryByLabelText('Rows')).not.toBeInTheDocument();
        });

        it('should restore palette when FAB is clicked', async () => {
            const user = userEvent.setup();
            renderPalette();

            // First minimize
            await user.click(screen.getByRole('button', { name: /minimize palette/i }));

            // Then click FAB to restore
            await user.click(screen.getByRole('button', { name: /open grid controls/i }));

            // Should show palette again
            expect(screen.getByLabelText('Rows')).toBeInTheDocument();
        });
    });
});
