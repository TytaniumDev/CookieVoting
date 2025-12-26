import type { Meta, StoryObj } from '@storybook/react';
import { CookieViewer, type DetectedCookie } from './CookieViewer';
import { fn } from 'storybook/test';

/**
 * CookieViewer Component Stories
 *
 * Component for displaying cookie images with detection overlays.
 * Supports polygon-based detection shapes and bounding boxes as fallback.
 */
const meta = {
  title: 'Organisms/CookieViewer',
  component: CookieViewer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Component for displaying cookie images with detection overlays.

**Features:**
- Polygon-based detection shapes with smooth corners
- Bounding box fallback for detections without polygons
- Optional numbered markers for cookies
- Interactive hover effects and click handlers
- Custom overlay rendering at top-left, bottom, and center positions
- Optional toolbar with back button for fullscreen viewing

**Usage:**
This component is used throughout the application to display cookie detection results.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    imageUrl: {
      control: 'text',
      description: 'URL of the image to display',
    },
  },
} satisfies Meta<typeof CookieViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample detected cookies with polygons
const sampleCookiesWithPolygons: DetectedCookie[] = [
  {
    x: 25,
    y: 30,
    width: 8,
    height: 8,
    confidence: 0.95,
    polygon: [
      [20, 25],
      [30, 25],
      [30, 35],
      [20, 35],
    ],
  },
  {
    x: 50,
    y: 40,
    width: 10,
    height: 10,
    confidence: 0.88,
    polygon: [
      [45, 35],
      [55, 35],
      [55, 45],
      [45, 45],
    ],
  },
  {
    x: 75,
    y: 50,
    width: 9,
    height: 9,
    confidence: 0.92,
    polygon: [
      [70, 45],
      [80, 45],
      [80, 55],
      [70, 55],
    ],
  },
];

// Sample detected cookies with bounding boxes only (no polygons)
const sampleCookiesBoundingBox: DetectedCookie[] = [
  {
    x: 30,
    y: 30,
    width: 8,
    height: 8,
    confidence: 0.85,
  },
  {
    x: 60,
    y: 50,
    width: 10,
    height: 10,
    confidence: 0.9,
  },
];

/**
 * Default story with multiple detected cookies using polygons
 */
export const Default: Story = {
  args: {
    imageUrl: 'test-cookies.jpg',
    detectedCookies: sampleCookiesWithPolygons,
    onCookieClick: fn(),
  },
};

/**
 * Story with no detected cookies (empty state)
 */
export const NoDetections: Story = {
  args: {
    imageUrl: 'test-cookies.jpg',
    detectedCookies: [],
    onCookieClick: fn(),
  },
};

/**
 * Story with bounding boxes only (no polygons)
 */
export const BoundingBoxesOnly: Story = {
  args: {
    imageUrl: 'test-cookies.jpg',
    detectedCookies: sampleCookiesBoundingBox,
    onCookieClick: fn(),
  },
};

/**
 * Story with visible borders on cookie overlays
 */
export const WithBorders: Story = {
  args: {
    imageUrl: 'test-cookies.jpg',
    detectedCookies: sampleCookiesWithPolygons,
    borderColor: '#2196F3',
    onCookieClick: fn(),
  },
};

/**
 * Story with numbered markers
 */
export const WithNumberedMarkers: Story = {
  args: {
    imageUrl: 'test-cookies.jpg',
    detectedCookies: sampleCookiesWithPolygons,
    cookieNumbers: [1, 2, 3],
    onSelectCookie: fn(),
  },
};

/**
 * Story with numbered markers and selection
 */
export const WithNumberedMarkersAndSelection: Story = {
  args: {
    imageUrl: 'test-cookies.jpg',
    detectedCookies: sampleCookiesWithPolygons,
    cookieNumbers: [1, 2, 3],
    selectedCookieNumber: 2,
    onSelectCookie: fn(),
  },
};

/**
 * Story with custom overlays (showing confidence percentage)
 */
export const WithCustomOverlays: Story = {
  args: {
    imageUrl: 'test-cookies.jpg',
    detectedCookies: sampleCookiesWithPolygons,
    onCookieClick: fn(),
    renderTopLeft: ({ detected }) => (
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: 'bold',
        }}
      >
        {(detected.confidence * 100).toFixed(0)}%
      </div>
    ),
    renderCenter: ({ index }) => (
      <div
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: 'rgba(33, 150, 243, 0.5)',
          border: '2px solid #2196F3',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
        }}
      >
        {index + 1}
      </div>
    ),
  },
};

/**
 * Story with many detected cookies (stress test)
 */
export const ManyDetections: Story = {
  args: {
    imageUrl: 'test-cookies-6.jpg',
    detectedCookies: Array.from({ length: 12 }, (_, i) => ({
      x: 20 + (i % 4) * 20,
      y: 20 + Math.floor(i / 4) * 20,
      width: 8,
      height: 8,
      confidence: 0.85 + Math.random() * 0.1,
      polygon: [
        [18 + (i % 4) * 20, 18 + Math.floor(i / 4) * 20],
        [22 + (i % 4) * 20, 18 + Math.floor(i / 4) * 20],
        [22 + (i % 4) * 20, 22 + Math.floor(i / 4) * 20],
        [18 + (i % 4) * 20, 22 + Math.floor(i / 4) * 20],
      ] as Array<[number, number]>,
    })),
    onCookieClick: fn(),
  },
};

/**
 * Story with many numbered markers
 */
export const ManyNumberedMarkers: Story = {
  args: {
    imageUrl: 'test-cookies-6.jpg',
    detectedCookies: Array.from({ length: 12 }, (_, i) => ({
      x: 20 + (i % 4) * 20,
      y: 20 + Math.floor(i / 4) * 20,
      width: 8,
      height: 8,
      confidence: 1.0,
    })),
    cookieNumbers: Array.from({ length: 12 }, (_, i) => i + 1),
    onSelectCookie: fn(),
  },
};

/**
 * Story with disabled zoom functionality
 */
export const ZoomDisabled: Story = {
  args: {
    imageUrl: 'test-cookies.jpg',
    detectedCookies: sampleCookiesWithPolygons,
    disableZoom: true,
    onCookieClick: fn(),
  },
};

/**
 * Story in a height-constrained container
 *
 * This story tests that the image scales properly to fit within a fixed-height
 * container without being cropped. The full image should be visible.
 *
 * **Visual test criteria:**
 * - Image should be fully visible (not cropped)
 * - Image should scale down to fit the container
 * - Detection overlays should align with the scaled image
 */
export const InConstrainedContainer: Story = {
  args: {
    imageUrl: 'test-cookies-6.jpg',
    detectedCookies: Array.from({ length: 6 }, (_, i) => ({
      x: 20 + (i % 3) * 30,
      y: 30 + Math.floor(i / 3) * 40,
      width: 15,
      height: 15,
      confidence: 0.9,
      polygon: [
        [15 + (i % 3) * 30, 25 + Math.floor(i / 3) * 40],
        [25 + (i % 3) * 30, 25 + Math.floor(i / 3) * 40],
        [25 + (i % 3) * 30, 35 + Math.floor(i / 3) * 40],
        [15 + (i % 3) * 30, 35 + Math.floor(i / 3) * 40],
      ] as Array<[number, number]>,
    })),
    // Show visible borders and numbered markers for visual verification
    borderColor: '#2196F3',
    cookieNumbers: [1, 2, 3, 4, 5, 6],
    disableZoom: true,
    onCookieClick: fn(),
    onSelectCookie: fn(),
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: '600px',
          height: '400px',
          background: '#1a1a1a',
          border: '2px solid #dc2626',
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: `
**Visual Regression Test for Image Cropping**

This story renders the CookieViewer inside a fixed 600x400 container.
The image should scale to fit completely within the container without any cropping.

**Pass criteria:**
- All detection zones are visible
- Image is centered in the container
- No scrollbars or hidden content
        `,
      },
    },
  },
};
