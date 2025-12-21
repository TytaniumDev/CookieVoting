import type { Meta, StoryObj } from '@storybook/react';
import { CookieViewer } from './CookieViewer';
import { fn } from 'storybook/test';
import type { CookieCoordinate } from '../lib/types';

/**
 * CookieViewer Component Stories
 * 
 * An interactive image viewer component for displaying cookie images with numbered markers.
 * Supports zoom, pan, and touch gestures.
 */
const meta = {
  title: 'Organisms/CookieViewer',
  component: CookieViewer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
An interactive image viewer for displaying cookie images with numbered markers.

**Features:**
- Zoom controls (1x to 4x)
- Mouse drag to pan when zoomed
- Touch pinch-to-zoom on mobile
- Touch drag to pan on mobile
- Visual highlighting of selected cookie
- Numbered markers for each cookie

**Usage:**
This component is used in the voting interface to allow users to view and select cookies.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    imageUrl: {
      control: 'text',
      description: 'URL of the cookie image to display',
    },
    cookies: {
      control: 'object',
      description: 'Array of cookie coordinate objects',
    },
    selectedCookieId: {
      control: 'text',
      description: 'ID of the currently selected cookie',
    },
    onSelectCookie: {
      action: 'cookie-selected',
      description: 'Callback when a cookie marker is clicked',
    },
    onBack: {
      action: 'back-clicked',
      description: 'Callback when the back button is clicked',
    },
  },
} satisfies Meta<typeof CookieViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample cookie coordinates
const sampleCookies: CookieCoordinate[] = [
  { id: '1', number: 1, makerName: 'Alice', x: 25, y: 30 },
  { id: '2', number: 2, makerName: 'Bob', x: 50, y: 40 },
  { id: '3', number: 3, makerName: 'Charlie', x: 75, y: 50 },
  { id: '4', number: 4, makerName: 'Diana', x: 30, y: 60 },
  { id: '5', number: 5, makerName: 'Eve', x: 60, y: 70 },
];

/**
 * Default cookie viewer with sample cookies
 */
export const Default: Story = {
  args: {
    imageUrl: '/test-cookies.jpg',
    cookies: sampleCookies,
    selectedCookieId: undefined,
    onSelectCookie: fn(),
    onBack: fn(),
  },
};

/**
 * Cookie viewer with a selected cookie
 */
export const WithSelection: Story = {
  args: {
    imageUrl: '/test-cookies.jpg',
    cookies: sampleCookies,
    selectedCookieId: '2',
    onSelectCookie: fn(),
    onBack: fn(),
  },
};

/**
 * Cookie viewer with many cookies
 */
export const ManyCookies: Story = {
  args: {
    imageUrl: '/test-cookies-6.jpg',
    cookies: Array.from({ length: 12 }, (_, i) => ({
      id: String(i + 1),
      number: i + 1,
      makerName: `Maker ${i + 1}`,
      x: 20 + (i % 4) * 20,
      y: 20 + Math.floor(i / 4) * 20,
    })),
    selectedCookieId: undefined,
    onSelectCookie: fn(),
    onBack: fn(),
  },
};

/**
 * Cookie viewer with no cookies (empty state)
 */
export const NoCookies: Story = {
  args: {
    imageUrl: '/test-cookies.jpg',
    cookies: [],
    selectedCookieId: undefined,
    onSelectCookie: fn(),
    onBack: fn(),
  },
};
