import type { Meta, StoryObj } from '@storybook/react';
import { ImageTagger } from './ImageTagger';
import { fn } from 'storybook/test';
import type { CookieCoordinate } from '../lib/types';

/**
 * ImageTagger Component Stories
 * 
 * A comprehensive image tagging interface for marking cookie positions in images.
 * Supports both manual tagging and automatic detection via AI.
 */
const meta = {
  title: 'Organisms/ImageTagger',
  component: ImageTagger,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
A comprehensive image tagging interface for marking cookie positions.

**Features:**
- Click on image to manually add cookie markers
- Auto-detect cookies using AI (Gemini)
- Click on detected cookie shapes to auto-tag them
- Edit cookie numbers and maker names
- Delete individual cookies
- Visual feedback with detection overlays
- Automatic loading of pre-detected cookies from Firestore

**Usage:**
This component is used in the admin interface for tagging cookies in category images.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    imageUrl: {
      control: 'text',
      description: 'URL of the image to tag',
    },
    initialCookies: {
      control: 'object',
      description: 'Initial cookie coordinates (for editing)',
    },
    onSave: {
      action: 'saved',
      description: 'Callback when save button is clicked',
    },
    onCancel: {
      action: 'cancelled',
      description: 'Callback when cancel button is clicked',
    },
  },
} satisfies Meta<typeof ImageTagger>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample initial cookies
const sampleInitialCookies: CookieCoordinate[] = [
  { id: '1', number: 1, makerName: 'Alice', x: 25, y: 30 },
  { id: '2', number: 2, makerName: 'Bob', x: 50, y: 40 },
];

/**
 * Default image tagger with no initial cookies
 */
export const Default: Story = {
  args: {
    imageUrl: 'test-cookies.jpg',
    initialCookies: [],
    onSave: async (cookies) => {
      fn()(cookies);
    },
    onCancel: fn(),
  },
};

/**
 * Image tagger with existing cookies (editing mode)
 */
export const WithExistingCookies: Story = {
  args: {
    imageUrl: 'test-cookies.jpg',
    initialCookies: sampleInitialCookies,
    onSave: async (cookies) => {
      fn()(cookies);
    },
    onCancel: fn(),
  },
};

/**
 * Image tagger with different image
 */
export const DifferentImage: Story = {
  args: {
    imageUrl: 'test-images/6-cookies/test-cookies.jpg',
    initialCookies: [],
    onSave: async (cookies) => {
      fn()(cookies);
    },
    onCancel: fn(),
  },
};
