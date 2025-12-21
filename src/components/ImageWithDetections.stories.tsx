import type { Meta, StoryObj } from '@storybook/react';
import { ImageWithDetections, type DetectedCookie } from './ImageWithDetections';
import { withFirebaseEmulator } from '../../.storybook/firebase-decorator';
import { fn } from 'storybook/test';

/**
 * ImageWithDetections Component Stories
 * 
 * This component displays images with visual overlays for detected cookies.
 * It supports both polygon-based detection shapes and bounding boxes as fallback.
 * 
 * The component provides interactive features like hover effects and click handlers,
 * and allows for custom rendering of overlays at different positions.
 */
const meta = {
  title: 'Organisms/ImageWithDetections',
  component: ImageWithDetections,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A reusable component for rendering images with cookie detection overlays.

**Features:**
- Displays images with visual overlays for detected cookies
- Supports polygon-based detection shapes (preferred) and bounding boxes (fallback)
- Interactive hover effects on cookie overlays
- Click handlers for cookie selection
- Customizable overlay rendering at top-left, bottom, and center positions
- Smooth polygon corner rendering with Bezier curves

**Usage:**
This component is used throughout the application to display cookie detection results.
It's particularly useful in the ImageTagger component for visualizing detected cookies
before they are tagged.
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
    detectedCookies: {
      control: 'object',
      description: 'Array of detected cookie objects with position and shape data',
    },
    onCookieClick: {
      description: 'Callback when a cookie overlay is clicked',
    },
    borderColor: {
      control: 'color',
      description: 'Border color for cookie overlays (default: transparent)',
    },
    className: {
      control: 'text',
      description: 'Optional CSS class name for the container',
    },
  },
} satisfies Meta<typeof ImageWithDetections>;

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
    confidence: 0.90,
  },
];

/**
 * Default story with multiple detected cookies using polygons
 */
export const Default: Story = {
  args: {
    imageUrl: '/test-cookies.jpg',
    detectedCookies: sampleCookiesWithPolygons,
    onCookieClick: fn(),
  },
};

/**
 * Story with no detected cookies (empty state)
 */
export const NoDetections: Story = {
  args: {
    imageUrl: '/test-cookies.jpg',
    detectedCookies: [],
    onCookieClick: fn(),
  },
};

/**
 * Story with bounding boxes only (no polygons)
 */
export const BoundingBoxesOnly: Story = {
  args: {
    imageUrl: '/test-cookies.jpg',
    detectedCookies: sampleCookiesBoundingBox,
    onCookieClick: fn(),
  },
};

/**
 * Story with visible borders on cookie overlays
 */
export const WithBorders: Story = {
  args: {
    imageUrl: '/test-cookies.jpg',
    detectedCookies: sampleCookiesWithPolygons,
    borderColor: '#2196F3',
    onCookieClick: fn(),
  },
};

/**
 * Story with custom top-left overlay (showing confidence percentage)
 */
export const WithCustomOverlays: Story = {
  args: {
    imageUrl: '/test-cookies.jpg',
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
    imageUrl: '/test-cookies-6.jpg',
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
 * Story with Firebase emulator integration
 * This story demonstrates the component working with real Firebase Storage emulator
 */
export const WithFirebaseEmulator: Story = {
  decorators: [withFirebaseEmulator],
  args: {
    imageUrl: '/test-cookies.jpg',
    detectedCookies: sampleCookiesWithPolygons,
    onCookieClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: `
This story uses the Firebase Storage emulator to load images.
Make sure to start the Firebase emulators before viewing this story:
\`npm run emulators:start\`

The component will automatically connect to the emulator when running in Storybook.
        `,
      },
    },
  },
};

/**
 * Story with different image from test-images directory
 */
export const DifferentImage: Story = {
  args: {
    imageUrl: '/test-images/6-cookies/test-cookies.jpg',
    detectedCookies: [
      {
        x: 20,
        y: 25,
        width: 8,
        height: 8,
        confidence: 0.95,
        polygon: [
          [16, 21],
          [24, 21],
          [24, 29],
          [16, 29],
        ],
      },
      {
        x: 50,
        y: 35,
        width: 10,
        height: 10,
        confidence: 0.88,
        polygon: [
          [45, 30],
          [55, 30],
          [55, 40],
          [45, 40],
        ],
      },
    ],
    onCookieClick: fn(),
  },
};
