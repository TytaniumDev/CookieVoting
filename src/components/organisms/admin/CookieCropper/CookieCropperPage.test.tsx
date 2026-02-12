import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CookieCropperPage } from './CookieCropperPage';

// Mock dependencies
vi.mock('../../../../lib/hooks/useMediaQuery', () => ({
  useMediaQuery: () => false, // Desktop mode
}));

// Mock components directory
vi.mock('./components', () => ({
  FloatingPalette: () => <div data-testid="floating-palette" />,
  MobileDrawer: () => <div data-testid="mobile-drawer" />,
  EmptyState: () => <div data-testid="empty-state" />,
}));

// Mock inner components to avoid complex rendering
vi.mock('./CookieCropper', () => ({
  CookieCropper: () => <div data-testid="cookie-cropper" />,
}));

// Mock useImageStore
vi.mock('../../../../lib/stores/useImageStore', () => ({
  useImageStore: () => ({
    subscribeToCroppedCookies: vi.fn(),
    unsubscribeFromCroppedCookies: vi.fn(),
    getCroppedCookiesForCategory: vi.fn(() => []),
    images: [],
  }),
}));

describe('CookieCropperPage', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();
  const mockImageUrl = 'https://example.com/test.jpg';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render empty state when no image URL provided', () => {
    render(<CookieCropperPage onSave={mockOnSave} onCancel={mockOnCancel} />);

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('should render cookie cropper when image URL is provided', () => {
    render(
      <CookieCropperPage
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        initialImageUrl={mockImageUrl}
      />,
    );

    expect(screen.getByTestId('cookie-cropper')).toBeInTheDocument();
  });
});
